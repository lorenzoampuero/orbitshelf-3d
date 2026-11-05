import "server-only";
import { providerConfig, type ProviderConfig } from "@/lib/env";
import { MAX_GLB_BYTES } from "@/lib/glb";
import type { TextureResolution } from "@/lib/types";

export type ProviderErrorKind = "payment_required" | "auth" | "rate_limited" | "rejected" | "server" | "network" | "timeout" | "not_ready" | "not_configured" | "invalid_response";

export class ProviderError extends Error {
  constructor(
    public kind: ProviderErrorKind,
    message: string,
    public status?: number,
    /** True when the provider definitely did NOT start (or has refunded) the job → safe to refund locally. */
    public definite = false,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export type NormalizedStatus = "pending" | "running" | "success" | "error";
export type Deps = { fetch?: typeof fetch; config?: ProviderConfig | null; timeoutMs?: number };

const JOB_ID = /^[A-Za-z0-9_-]{8,80}$/;
export const isValidJobId = (id: unknown): id is string => typeof id === "string" && JOB_ID.test(id);

/** Maps documented and legacy provider statuses onto the four-state vocabulary. Unknown values are treated as still running. */
export function normalizeStatus(raw: unknown): NormalizedStatus {
  const s = String(raw ?? "").toLowerCase();
  if (["success", "succeeded", "completed", "complete", "done"].includes(s)) return "success";
  if (["error", "failed", "failure", "canceled", "cancelled"].includes(s)) return "error";
  if (["pending", "created", "queued", "waiting"].includes(s)) return "pending";
  return "running";
}

/** Removes any credential material from text that might be logged or shown. */
export function redact(text: string, config: ProviderConfig | null = providerConfig()): string {
  let out = text;
  for (const secret of [config?.clientSecret, config?.clientId]) if (secret && secret.length >= 4) out = out.split(secret).join("[redacted]");
  return out.replace(/x-client-(id|secret)\s*[:=]\s*\S+/gi, "x-client-$1: [redacted]").slice(0, 400);
}

function cfg(deps?: Deps): ProviderConfig {
  const c = deps?.config === undefined ? providerConfig() : deps.config;
  if (!c) throw new ProviderError("not_configured", "Provider credentials are not configured on the server.");
  return c;
}

async function call(url: string, init: RequestInit, c: ProviderConfig, deps?: Deps): Promise<Response> {
  const f = deps?.fetch ?? fetch;
  try {
    return await f(url, {
      ...init,
      headers: { ...(init.headers as Record<string, string>), "x-client-id": c.clientId, "x-client-secret": c.clientSecret },
      signal: AbortSignal.timeout(deps?.timeoutMs ?? 45_000),
      cache: "no-store",
      redirect: "error",
    });
  } catch (e) {
    const name = e instanceof Error ? e.name : "";
    if (name === "TimeoutError" || name === "AbortError") throw new ProviderError("timeout", "The provider did not respond in time.");
    throw new ProviderError("network", "Could not reach the provider.");
  }
}

async function bodyText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 2000);
  } catch {
    return "";
  }
}

async function failFrom(res: Response, c: ProviderConfig): Promise<never> {
  const text = await bodyText(res);
  let message = "";
  try {
    const j = JSON.parse(text) as { message?: unknown };
    if (typeof j.message === "string") message = j.message;
  } catch {
    /* non-JSON body */
  }
  message = redact(message || `Provider returned HTTP ${res.status}.`, c);
  switch (res.status) {
    case 401:
    case 403:
      throw new ProviderError("auth", "The provider rejected the server credentials (HTTP " + res.status + "). Check SLOYD_CLIENT_ID / SLOYD_CLIENT_SECRET.", res.status, true);
    case 402:
      throw new ProviderError("payment_required", "The provider account has insufficient prepaid credits. No job was started.", 402, true);
    case 429:
      throw new ProviderError("rate_limited", "The provider is limiting concurrent jobs. Wait for a running job to finish and retry.", 429, true);
    case 400:
    case 404:
    case 413:
    case 415:
    case 422:
      throw new ProviderError("rejected", message, res.status, true);
    default:
      throw new ProviderError("server", message, res.status, res.status >= 500 ? false : true);
  }
}

export type CreateImageJobInput = {
  image: Buffer;
  mime: "image/png" | "image/jpeg";
  filename: string;
  textureResolution: TextureResolution;
  targetFaceCount?: number;
};

async function readJobId(res: Response): Promise<{ jobId: string }> {
  let json: { jobId?: unknown };
  try {
    json = (await res.json()) as { jobId?: unknown };
  } catch {
    throw new ProviderError("invalid_response", "The provider returned an unreadable response.", res.status);
  }
  if (!isValidJobId(json.jobId)) throw new ProviderError("invalid_response", "The provider did not return a valid job id.", res.status);
  return { jobId: json.jobId };
}

/** POST /jobs/image-to-3d (multipart). Returns the provider job id. */
export async function createImageJob(input: CreateImageJobInput, deps?: Deps): Promise<{ jobId: string }> {
  const c = cfg(deps);
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(input.image)], { type: input.mime }), input.filename);
  form.append("targetFaceCount", String(input.targetFaceCount ?? 20000));
  form.append("textureResolution", input.textureResolution);
  form.append("topology", "triangles"); // explicit: "quads" adds provider cost, "auto" may choose it
  const res = await call(`${c.apiBase}/jobs/image-to-3d`, { method: "POST", body: form }, c, deps);
  if (!res.ok) return failFrom(res, c);
  return readJobId(res);
}

export type MultiImageView = "front" | "left" | "back" | "right";
export type CreateMultiImageJobInput = {
  /** `front` is required; at least one of left / back / right must accompany it (Sloyd: 2 to 4 photos of the same object). */
  images: Partial<Record<MultiImageView, { image: Buffer; mime: "image/png" | "image/jpeg" }>>;
  /** Sloyd's multi-image endpoint has no texture resolution: any value other than "none" turns PBR texturing on. */
  textureResolution: TextureResolution;
  faceCount?: number;
};

/** POST /jobs/multi-image-to-3d (multipart: frontImage + leftImage / backImage / rightImage). Returns the provider job id. */
export async function createMultiImageJob(input: CreateMultiImageJobInput, deps?: Deps): Promise<{ jobId: string }> {
  const c = cfg(deps);
  const front = input.images.front;
  const others = (["left", "back", "right"] as const).filter((v) => input.images[v]);
  if (!front || others.length < 1) throw new ProviderError("rejected", "Multi-photo generation needs a front photo and at least one more view.", undefined, true);
  const form = new FormData();
  for (const view of ["front", ...others] as const) {
    const part = input.images[view]!;
    const ext = part.mime === "image/png" ? "png" : "jpg";
    form.append(`${view}Image`, new Blob([new Uint8Array(part.image)], { type: part.mime }), `${view}.${ext}`);
  }
  form.append("EnablePBR", input.textureResolution === "none" ? "false" : "true");
  form.append("FaceCount", String(input.faceCount ?? 20000));
  const res = await call(`${c.apiBase}/jobs/multi-image-to-3d`, { method: "POST", body: form }, c, deps);
  if (!res.ok) return failFrom(res, c);
  return readJobId(res);
}

export type CreateTextJobInput = {
  prompt: string;
  textureResolution: TextureResolution;
  targetFaceCount?: number;
};

/** POST /jobs/text-to-3d (JSON). Returns the provider job id. */
export async function createTextJob(input: CreateTextJobInput, deps?: Deps): Promise<{ jobId: string }> {
  const c = cfg(deps);
  const body = {
    prompt: input.prompt,
    textureResolution: input.textureResolution,
    topology: "triangles", // explicit, same reason as image-to-3d
    targetFaceCount: input.targetFaceCount ?? 20000,
    tPose: false,
  };
  const res = await call(`${c.apiBase}/jobs/text-to-3d`, { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } }, c, deps);
  if (!res.ok) return failFrom(res, c);
  return readJobId(res);
}

export type JobSnapshot = { status: NormalizedStatus; rawStatus: string; errorMessage: string | null };

/** GET /jobs/{jobId}. */
export async function getJob(jobId: string, deps?: Deps): Promise<JobSnapshot> {
  if (!isValidJobId(jobId)) throw new ProviderError("rejected", "Invalid job id.");
  const c = cfg(deps);
  const res = await call(`${c.apiBase}/jobs/${encodeURIComponent(jobId)}`, { method: "GET" }, c, deps);
  if (!res.ok) return failFrom(res, c);
  let json: { status?: unknown; errorMessage?: unknown };
  try {
    json = (await res.json()) as typeof json;
  } catch {
    throw new ProviderError("invalid_response", "The provider returned an unreadable job response.", res.status);
  }
  return {
    status: normalizeStatus(json.status),
    rawStatus: String(json.status ?? "").slice(0, 40),
    errorMessage: typeof json.errorMessage === "string" ? redact(json.errorMessage, c) : null,
  };
}

/**
 * Downloads the finished GLB from the provider's public, predictable URL. A 404 / 403 / empty body means
 * "not ready yet". The caller must validate the bytes (`validateGlb`) before storing them.
 */
export async function downloadResult(jobId: string, deps?: Deps): Promise<Buffer> {
  if (!isValidJobId(jobId)) throw new ProviderError("rejected", "Invalid job id.");
  const c = cfg(deps);
  const f = deps?.fetch ?? fetch;
  let res: Response;
  try {
    // The result URL is public: do not send credentials to it.
    res = await f(`${c.resultBase}${encodeURIComponent(jobId)}.glb`, { signal: AbortSignal.timeout(deps?.timeoutMs ?? 60_000), cache: "no-store", redirect: "follow" });
  } catch (e) {
    const name = e instanceof Error ? e.name : "";
    throw new ProviderError(name === "TimeoutError" ? "timeout" : "network", "Could not download the generated file.");
  }
  if (res.status === 404 || res.status === 403) throw new ProviderError("not_ready", "The generated file is not available yet.", res.status);
  if (!res.ok) throw new ProviderError("server", `Result download failed (HTTP ${res.status}).`, res.status);
  const declared = Number(res.headers.get("content-length") ?? "0");
  if (declared > MAX_GLB_BYTES) throw new ProviderError("invalid_response", "Generated file is larger than the allowed maximum.");
  const reader = res.body?.getReader();
  if (!reader) throw new ProviderError("not_ready", "Empty result body.");
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_GLB_BYTES) {
      await reader.cancel();
      throw new ProviderError("invalid_response", "Generated file is larger than the allowed maximum.");
    }
    chunks.push(value);
  }
  if (total === 0) throw new ProviderError("not_ready", "The generated file is empty.");
  return Buffer.concat(chunks);
}
