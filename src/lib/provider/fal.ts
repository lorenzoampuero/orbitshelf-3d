import "server-only";
import { createHash, createPublicKey, verify as verifySignature } from "node:crypto";
import { falConfig, type FalConfig } from "@/lib/env";
import type { NormalizedImage } from "@/lib/image";
import { downloadGlb, isAllowedResultUrl } from "./download";
import { ProviderError, type Deps, type EngineDefinition, type JobSnapshot, type ModelAdapter, type ProviderJobRef } from "./types";

function cfg(deps?: Deps): FalConfig {
  const c = deps?.falConfig === undefined ? falConfig() : deps.falConfig;
  if (!c) throw new ProviderError("not_configured", "fal credentials are not configured on the server.");
  return c;
}

/** Photos go inline, so no public URL to a private product photo ever exists. */
export const dataUri = (image: NormalizedImage) => `data:${image.mime};base64,${image.buffer.toString("base64")}`;

export { isAllowedResultUrl };

export function redactFal(text: string, c: FalConfig | null): string {
  let out = text;
  if (c?.key && c.key.length >= 4) out = out.split(c.key).join("[redacted]");
  return out.replace(/authorization\s*[:=]\s*key\s+\S+/gi, "authorization: [redacted]").slice(0, 400);
}

async function call(url: string, init: RequestInit, c: FalConfig, deps?: Deps): Promise<Response> {
  const f = deps?.fetch ?? fetch;
  try {
    return await f(url, {
      ...init,
      headers: { ...(init.headers as Record<string, string>), Authorization: `Key ${c.key}` },
      signal: AbortSignal.timeout(deps?.timeoutMs ?? 60_000),
      cache: "no-store",
      redirect: "error",
    });
  } catch (e) {
    const name = e instanceof Error ? e.name : "";
    if (name === "TimeoutError" || name === "AbortError") throw new ProviderError("timeout", "The provider did not respond in time.");
    throw new ProviderError("network", "Could not reach the provider.");
  }
}

async function failFrom(res: Response, c: FalConfig): Promise<never> {
  let message = "";
  try {
    const j = JSON.parse((await res.text()).slice(0, 2000)) as { detail?: unknown; message?: unknown };
    if (typeof j.detail === "string") message = j.detail;
    else if (typeof j.message === "string") message = j.message;
  } catch {
    /* non-JSON body */
  }
  message = redactFal(message || `Provider returned HTTP ${res.status}.`, c);
  switch (res.status) {
    case 401:
    case 403:
      throw new ProviderError("auth", `The provider rejected the server credentials (HTTP ${res.status}). Check FAL_KEY.`, res.status, true);
    case 402:
      throw new ProviderError("payment_required", "The provider account has insufficient balance. No job was started.", 402, true);
    case 429:
      throw new ProviderError("rate_limited", "The provider is limiting requests. Wait and retry.", 429, true);
    case 400:
    case 404:
    case 413:
    case 415:
    case 422:
      throw new ProviderError("rejected", message, res.status, true);
    default:
      throw new ProviderError("server", message, res.status, res.status < 500);
  }
}

/** fal returns its own queue URLs and asks clients to use them. Only ones on the configured queue host are followed, because the API key is sent to them. */
function queueUrl(raw: unknown, c: FalConfig): string | null {
  if (typeof raw !== "string") return null;
  return raw.startsWith(`${c.queueBase}/`) ? raw : null;
}

function webhookUrl(): string | null {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (!site || !site.startsWith("https://")) return null; // fal drops deliveries to private or loopback addresses
  return `${site}/api/webhooks/fal`;
}

export const falAdapter: ModelAdapter = {
  provider: "fal",

  isConfigured(deps) {
    return (deps?.falConfig === undefined ? falConfig() : deps.falConfig) !== null;
  },

  async submit(engine, req, deps) {
    if (!engine.fal) throw new ProviderError("not_configured", "This engine has no fal endpoint.");
    const c = cfg(deps);
    const hook = webhookUrl();
    const url = `${c.queueBase}/${engine.fal.endpoint}${hook ? `?fal_webhook=${encodeURIComponent(hook)}` : ""}`;
    const res = await call(url, { method: "POST", body: JSON.stringify(engine.fal.buildInput(req)), headers: { "content-type": "application/json" } }, c, deps);
    if (!res.ok) return failFrom(res, c);
    let json: { request_id?: unknown; status_url?: unknown; response_url?: unknown; cancel_url?: unknown };
    try {
      json = (await res.json()) as typeof json;
    } catch {
      throw new ProviderError("invalid_response", "The provider returned an unreadable response.", res.status);
    }
    const status = queueUrl(json.status_url, c);
    const response = queueUrl(json.response_url, c);
    if (typeof json.request_id !== "string" || !/^[A-Za-z0-9_-]{8,80}$/.test(json.request_id) || !status || !response) {
      throw new ProviderError("invalid_response", "The provider did not return a valid job reference.", res.status);
    }
    return { jobId: json.request_id, urls: { status, response, cancel: queueUrl(json.cancel_url, c) ?? undefined } };
  },

  async getStatus(_engine: EngineDefinition, job: ProviderJobRef, deps): Promise<JobSnapshot> {
    const c = cfg(deps);
    const url = queueUrl(job.urls?.status, c);
    if (!url) throw new ProviderError("rejected", "This job has no valid status location.", undefined, true);
    const res = await call(url, { method: "GET" }, c, deps);
    if (!res.ok) return failFrom(res, c);
    let json: { status?: unknown; error?: unknown };
    try {
      json = (await res.json()) as typeof json;
    } catch {
      throw new ProviderError("invalid_response", "The provider returned an unreadable job response.", res.status);
    }
    const raw = String(json.status ?? "");
    const errorMessage = typeof json.error === "string" && json.error ? redactFal(json.error, c) : null;
    if (raw === "IN_QUEUE") return { status: "pending", rawStatus: raw, errorMessage: null };
    if (raw === "COMPLETED") return { status: errorMessage ? "error" : "success", rawStatus: raw, errorMessage };
    return { status: "running", rawStatus: raw.slice(0, 40), errorMessage: null };
  },

  async fetchResult(engine, job, deps) {
    const c = cfg(deps);
    const url = queueUrl(job.urls?.response, c);
    if (!url || !engine.fal) throw new ProviderError("invalid_response", "This job has no valid result location.");
    const res = await call(url, { method: "GET" }, c, deps);
    if (res.status === 404 || res.status === 400) throw new ProviderError("not_ready", "The result is not available yet.", res.status);
    if (!res.ok) return failFrom(res, c);
    let output: unknown;
    try {
      output = await res.json();
    } catch {
      throw new ProviderError("invalid_response", "The provider returned an unreadable result.", res.status);
    }
    const glbUrl = engine.fal.glbUrl(output);
    if (!glbUrl) throw new ProviderError("invalid_response", "The provider result has no GLB file.");
    return downloadGlb(glbUrl, c, deps);
  },
};

/* ───────── webhook signature ───────── */

export type FalJwk = { x: string };
export const FAL_JWKS_URL = "https://rest.fal.ai/.well-known/jwks.json";
const TOLERANCE_SECONDS = 300;
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

/**
 * Checks the ED25519 signature fal documents: request id, user id, timestamp and the SHA-256 of the raw body, joined by newlines.
 * Pure, so it can be tested without network access. Any failure returns false.
 */
export function verifyFalWebhook(input: {
  requestId: string | null;
  userId: string | null;
  timestamp: string | null;
  signature: string | null;
  rawBody: Buffer;
  keys: FalJwk[];
  nowSeconds?: number;
}): boolean {
  const { requestId, userId, timestamp, signature, rawBody, keys } = input;
  if (!requestId || !userId || !timestamp || !signature) return false;
  const ts = Number(timestamp);
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > TOLERANCE_SECONDS) return false;
  if (!/^[0-9a-fA-F]+$/.test(signature)) return false;
  const message = Buffer.from([requestId, userId, timestamp, createHash("sha256").update(rawBody).digest("hex")].join("\n"), "utf8");
  const sig = Buffer.from(signature, "hex");
  for (const key of keys) {
    try {
      const raw = Buffer.from(key.x, "base64url");
      if (raw.length !== 32) continue;
      const publicKey = createPublicKey({ key: Buffer.concat([ED25519_SPKI_PREFIX, raw]), format: "der", type: "spki" });
      if (verifySignature(null, message, publicKey, sig)) return true;
    } catch {
      /* malformed key: try the next one */
    }
  }
  return false;
}

let jwksCache: { keys: FalJwk[]; at: number } | null = null;
const JWKS_TTL_MS = 12 * 60 * 60 * 1000;

export async function falWebhookKeys(deps?: Pick<Deps, "fetch">): Promise<FalJwk[]> {
  if (jwksCache && Date.now() - jwksCache.at < JWKS_TTL_MS) return jwksCache.keys;
  const f = deps?.fetch ?? fetch;
  const res = await f(FAL_JWKS_URL, { signal: AbortSignal.timeout(10_000), cache: "no-store", redirect: "error" });
  if (!res.ok) throw new Error(`Could not fetch webhook keys (HTTP ${res.status}).`);
  const json = (await res.json()) as { keys?: { x?: unknown }[] };
  const keys = (json.keys ?? []).flatMap((k) => (typeof k.x === "string" ? [{ x: k.x }] : []));
  jwksCache = { keys, at: Date.now() };
  return keys;
}
