import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { creditsFor } from "@/lib/credits";
import { billingUnit } from "@/lib/env";
import { billingConfigProblem, capabilityProblem, getEngine, engineEnabled, priceOf, type CapabilityProblem } from "@/lib/provider/registry";
import type { PriceQuery } from "@/lib/provider/types";
import { sessionSecret } from "@/lib/session";
import type { PriceEvidence, QuoteDto } from "@/lib/types";

const TTL_MS = 15 * 60_000;

/** What a job with this provider cost takes from the balance. */
export const chargeFor = (usd: number) => (billingUnit() === "credits" ? creditsFor(usd) : 1);

/** `u` is a keyed fingerprint of the provider price, not the price: the id travels through the browser and must not reveal what the provider charges. */
type Signed = { o: string; e: string; m: PriceQuery["mode"]; p: number; t: PriceQuery["texture"]; u: string; x: number };

const sign = (body: string) => createHmac("sha256", `quote:${sessionSecret()}`).update(body).digest();
const priceFingerprint = (usd: number) => createHmac("sha256", `quote-price:${sessionSecret()}`).update(String(usd)).digest("base64url").slice(0, 16);

export type QuoteResult = { ok: true; quote: QuoteDto } | { ok: false; code: "engine_unavailable" } | { ok: false; code: "billing_unsafe" } | { ok: false; code: "engine_unsupported"; problem: CapabilityProblem };

/** The server decides the price. The id is signed, so a client cannot change the engine, options or amount it was quoted. */
export function createQuote(orgId: string, engineId: string, q: PriceQuery, now = Date.now()): QuoteResult {
  if (billingConfigProblem()) return { ok: false, code: "billing_unsafe" };
  const engine = getEngine(engineId);
  if (!engine || !engineEnabled(engine)) return { ok: false, code: "engine_unavailable" };
  const problem = capabilityProblem(engine, q);
  if (problem) return { ok: false, code: "engine_unsupported", problem };
  const { usd } = priceOf(engine, q);
  const expiresAt = now + TTL_MS;
  const payload: Signed = { o: orgId, e: engineId, m: q.mode, p: q.photoCount, t: q.texture, u: priceFingerprint(usd), x: expiresAt };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return {
    ok: true,
    quote: {
      id: `${body}.${sign(body).toString("base64url")}`,
      engineId,
      engineLabel: engine.label,
      mode: q.mode,
      photoCount: q.photoCount,
      texture: q.texture,
      credits: creditsFor(usd),
      charge: chargeFor(usd),
      unit: billingUnit(),
      evidence: engine.priceEvidence as PriceEvidence,
      priceVerifiedAt: engine.priceVerifiedAt,
      expiresAt: new Date(expiresAt).toISOString(),
    },
  };
}

export type QuoteCheck = "ok" | "invalid" | "expired" | "mismatch" | "unsafe";

/** A quote is only valid for the workspace, engine and exact options it was issued for, at the price the server would charge now. */
export function checkQuote(id: string, orgId: string, engineId: string, q: PriceQuery, now = Date.now()): QuoteCheck {
  if (billingConfigProblem()) return "unsafe";
  const [body, sig, extra] = id.split(".");
  if (!body || !sig || extra !== undefined || id.length > 1024) return "invalid";
  const expected = sign(body);
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return "invalid";
  let p: Signed;
  try {
    p = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Signed;
  } catch {
    return "invalid";
  }
  if (p.o !== orgId) return "invalid";
  if (p.x < now) return "expired";
  if (p.e !== engineId || p.m !== q.mode || p.p !== q.photoCount || p.t !== q.texture) return "mismatch";
  const engine = getEngine(engineId);
  if (!engine || priceFingerprint(priceOf(engine, q).usd) !== p.u) return "mismatch"; // the price changed after quoting: quote again
  return "ok";
}
