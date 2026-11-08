import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { PLAN_STRUCTURES, PLAN_TIERS } from "@/lib/credits";

/**
 * Whop as the payment provider. Built from Whop's public documentation and tested only against simulated payloads:
 * it has NEVER talked to the real Whop. Field names marked "unverified" must be checked against a sandbox payment before going live.
 * Whop stays the processor; the credit balance lives in OrbitShelf's own ledger, because Whop has no prepaid wallet.
 */

const DEFAULT_API_BASE = "https://api.whop.com/api/v1";
const TOLERANCE_SECONDS = 300;

/** The webhook only needs its secret. Without it the route answers 404 and nothing can be credited. */
export const whopWebhookSecret = () => process.env.WHOP_WEBHOOK_SECRET?.trim() || null;

export type WhopCheckoutConfig = { apiKey: string; companyId: string; apiBase: string; returnUrl: string | null };

/** Creating checkouts needs the API key and the company. Null → the dashboard shows no purchase button. */
export function whopCheckoutConfig(): WhopCheckoutConfig | null {
  const apiKey = process.env.WHOP_API_KEY?.trim();
  const companyId = process.env.WHOP_COMPANY_ID?.trim();
  if (!apiKey || !companyId) return null;
  return { apiKey, companyId, apiBase: (process.env.WHOP_API_BASE_URL?.trim() || DEFAULT_API_BASE).replace(/\/+$/, ""), returnUrl: process.env.WHOP_RETURN_URL?.trim() || null };
}

/** What can be bought, taken from the sized plans. Credits come from here and never from anything the buyer or Whop sends. */
export type CatalogItem = { key: string; label: string; priceUsd: number; credits: number; recurring: boolean };

export const CHECKOUT_CATALOG: CatalogItem[] = [
  ...PLAN_TIERS.flatMap((t) => t.steps.map((s) => ({ key: `plan:${t.id}:${s.priceUsd}`, label: `${t.name} US$${s.priceUsd}`, priceUsd: s.priceUsd, credits: s.credits, recurring: true }))),
  ...(PLAN_STRUCTURES.find((s) => s.id === "packs")?.plans ?? []).map((p) => ({ key: `pack:${p.priceUsd}`, label: p.name, priceUsd: p.priceUsd, credits: p.units, recurring: false })),
];

export const catalogItem = (key: string): CatalogItem | null => CHECKOUT_CATALOG.find((i) => i.key === key) ?? null;

export type WhopHeaders = { id: string | null; timestamp: string | null; signature: string | null };

export const whopHeaders = (h: Headers): WhopHeaders => ({ id: h.get("webhook-id"), timestamp: h.get("webhook-timestamp"), signature: h.get("webhook-signature") });

const sameBytes = (a: Buffer, b: Buffer) => a.length === b.length && timingSafeEqual(a, b);

/**
 * Standard Webhooks as Whop documents it: HMAC-SHA256 of `${id}.${timestamp}.${rawBody}`, keyed with the `ws_…` secret exactly as issued,
 * base64, sent as `v1,<signature>` (several may be listed, separated by spaces). The timestamp must be within 5 minutes.
 */
export function verifyWhopWebhook(rawBody: Buffer, headers: WhopHeaders, secret: string, nowMs = Date.now()): boolean {
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature) return false;
  if (!/^\d{9,11}$/.test(timestamp)) return false;
  if (Math.abs(nowMs / 1000 - Number(timestamp)) > TOLERANCE_SECONDS) return false;
  const expected = createHmac("sha256", secret).update(`${id}.${timestamp}.`).update(rawBody).digest();
  return signature.split(" ").some((part) => {
    const [version, value] = part.split(",");
    if (version !== "v1" || !value) return false;
    return sameBytes(expected, Buffer.from(value, "base64"));
  });
}

export type WhopEvent = { id: string; type: string; data: Record<string, unknown> };

export function parseWhopEvent(rawBody: Buffer): WhopEvent | null {
  try {
    const v = JSON.parse(rawBody.toString("utf8")) as Record<string, unknown>;
    if (typeof v.type !== "string" || !v.data || typeof v.data !== "object") return null;
    return { id: typeof v.id === "string" ? v.id : "", type: v.type, data: v.data as Record<string, unknown> };
  } catch {
    return null;
  }
}

export type GrantDecision =
  | { ok: true; orgId: string; credits: number; item: CatalogItem; key: string }
  | { ok: false; reason: "ignored" | "no_metadata" | "unknown_item" | "underpaid" | "no_payment_id" };

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Dollars the buyer paid, if the payload says. Field names are unverified: tried in order, and a missing amount is not treated as a mismatch. */
function paidUsd(data: Record<string, unknown>): number | null {
  for (const k of ["usd_total", "total", "subtotal"]) {
    const v = data[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && Number.isFinite(Number(v))) return Number(v);
  }
  return null;
}

/**
 * Turns a payment into credits. Only `payment.succeeded` counts. The workspace and the item come from the metadata OrbitShelf put on the checkout;
 * the credits come from OrbitShelf's own catalogue; and if the payload states an amount it must cover the price.
 * The ledger key is the payment id, so a retry or a second delivery cannot credit twice.
 */
export function decideGrant(event: WhopEvent): GrantDecision {
  if (event.type !== "payment.succeeded") return { ok: false, reason: "ignored" };
  const paymentId = str(event.data.id);
  if (!paymentId) return { ok: false, reason: "no_payment_id" };
  const meta = event.data.metadata && typeof event.data.metadata === "object" ? (event.data.metadata as Record<string, unknown>) : null;
  const orgId = str(meta?.org_id);
  const itemKey = str(meta?.item);
  if (!orgId || !itemKey) return { ok: false, reason: "no_metadata" };
  const item = catalogItem(itemKey);
  if (!item) return { ok: false, reason: "unknown_item" };
  const paid = paidUsd(event.data);
  if (paid !== null && paid + 0.005 < item.priceUsd * 0.98) return { ok: false, reason: "underpaid" };
  return { ok: true, orgId, credits: item.credits, item, key: `whop:${paymentId}` };
}

type Deps = { fetch?: typeof fetch };

export class WhopError extends Error {}

/**
 * Asks Whop for a checkout for one catalogue item and returns the address to send the buyer to.
 * The request shape (inline plan, metadata, redirect) follows Whop's "create checkout configuration" page and is unverified against the live API.
 */
export async function createCheckout(cfg: WhopCheckoutConfig, input: { orgId: string; item: CatalogItem }, deps?: Deps): Promise<string> {
  const f = deps?.fetch ?? fetch;
  const plan: Record<string, unknown> = {
    company_id: cfg.companyId,
    currency: "usd",
    plan_type: input.item.recurring ? "renewal" : "one_time",
    ...(input.item.recurring ? { renewal_price: input.item.priceUsd, billing_period: 30 } : { initial_price: input.item.priceUsd }),
  };
  const res = await f(`${cfg.apiBase}/checkout_configurations`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ plan, metadata: { org_id: input.orgId, item: input.item.key }, ...(cfg.returnUrl ? { redirect_url: cfg.returnUrl } : {}) }),
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new WhopError(`Whop answered ${res.status}.`);
  const body = (await res.json()) as Record<string, unknown>;
  const url = str(body.purchase_url) ?? str(body.checkout_url) ?? str(body.url);
  if (!url || !/^https:\/\/([a-z0-9-]+\.)*whop\.com(\/|$)/i.test(url)) throw new WhopError("Whop returned no usable checkout address.");
  return url;
}
