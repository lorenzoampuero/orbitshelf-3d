import "server-only";
import { meshyConfig, type MeshyConfig } from "@/lib/env";
import { downloadGlb } from "./download";
import { dataUri } from "./fal";
import { ProviderError, type Deps, type JobSnapshot, type ModelAdapter } from "./types";

/**
 * Meshy's own API, as documented at https://docs.meshy.ai/en/api/image-to-3d (read 2026-11-05). Never called with a real key.
 * `meshy-7` is deprecated there in favour of `meshy-7.1`, so that is the model used.
 */
const TASK_PATH = "/openapi/v1/image-to-3d";

function cfg(deps?: Deps): MeshyConfig {
  const c = deps?.meshyConfig === undefined ? meshyConfig() : deps.meshyConfig;
  if (!c) throw new ProviderError("not_configured", "Meshy credentials are not configured on the server.");
  return c;
}

const redactMeshy = (text: string, c: MeshyConfig) => (c.key.length >= 4 ? text.split(c.key).join("[redacted]") : text).replace(/bearer\s+\S+/gi, "bearer [redacted]").slice(0, 400);

async function call(url: string, init: RequestInit, c: MeshyConfig, deps?: Deps): Promise<Response> {
  const f = deps?.fetch ?? fetch;
  try {
    return await f(url, {
      ...init,
      headers: { ...(init.headers as Record<string, string>), Authorization: `Bearer ${c.key}` },
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

async function failFrom(res: Response, c: MeshyConfig): Promise<never> {
  let message = "";
  try {
    const j = JSON.parse((await res.text()).slice(0, 2000)) as { message?: unknown };
    if (typeof j.message === "string") message = j.message;
  } catch {
    /* non-JSON body */
  }
  message = redactMeshy(message || `Provider returned HTTP ${res.status}.`, c);
  switch (res.status) {
    case 401:
      throw new ProviderError("auth", "The provider rejected the server credentials (HTTP 401). Check MESHY_API_KEY.", 401, true);
    case 402:
      throw new ProviderError("payment_required", "The provider account has insufficient credits. No job was started.", 402, true);
    case 429:
      throw new ProviderError("rate_limited", "The provider is limiting requests. Wait and retry.", 429, true);
    case 400:
    case 403: // Meshy uses 403 for content moderation, not for credentials.
    case 404:
    case 422:
      throw new ProviderError("rejected", message, res.status, true);
    default:
      throw new ProviderError("server", message, res.status, res.status < 500);
  }
}

async function readTask(jobId: string, c: MeshyConfig, deps?: Deps) {
  const res = await call(`${c.apiBase}${TASK_PATH}/${encodeURIComponent(jobId)}`, { method: "GET" }, c, deps);
  if (!res.ok) return failFrom(res, c);
  try {
    return (await res.json()) as { status?: unknown; task_error?: { message?: unknown } | null; model_urls?: { glb?: unknown } };
  } catch {
    throw new ProviderError("invalid_response", "The provider returned an unreadable job response.", res.status);
  }
}

export const meshyAdapter: ModelAdapter = {
  provider: "meshy",

  isConfigured(deps) {
    return (deps?.meshyConfig === undefined ? meshyConfig() : deps.meshyConfig) !== null;
  },

  async submit(engine, req, deps) {
    if (!engine.meshy) throw new ProviderError("not_configured", "This engine has no Meshy model.");
    if (req.source.kind !== "image") throw new ProviderError("rejected", "This engine only takes one photo.", undefined, true);
    const c = cfg(deps);
    const textured = req.textureResolution !== "none";
    const body = {
      image_url: dataUri(req.source.image),
      ai_model: engine.meshy.aiModel,
      should_texture: textured,
      ...(textured ? { enable_pbr: true, texture_resolution: "2k" } : {}), // 2K is the lowest Meshy offers
      target_formats: ["glb"],
    };
    const res = await call(`${c.apiBase}${TASK_PATH}`, { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } }, c, deps);
    if (!res.ok) return failFrom(res, c);
    let json: { result?: unknown };
    try {
      json = (await res.json()) as typeof json;
    } catch {
      throw new ProviderError("invalid_response", "The provider returned an unreadable response.", res.status);
    }
    if (typeof json.result !== "string" || !/^[A-Za-z0-9_-]{8,80}$/.test(json.result)) throw new ProviderError("invalid_response", "The provider did not return a valid job reference.", res.status);
    return { jobId: json.result, urls: null };
  },

  async getStatus(_engine, job, deps): Promise<JobSnapshot> {
    const c = cfg(deps);
    const task = await readTask(job.jobId, c, deps);
    const raw = String(task.status ?? "");
    if (raw === "PENDING") return { status: "pending", rawStatus: raw, errorMessage: null };
    if (raw === "SUCCEEDED") return { status: "success", rawStatus: raw, errorMessage: null };
    if (raw === "FAILED" || raw === "CANCELED") {
      const message = typeof task.task_error?.message === "string" && task.task_error.message ? redactMeshy(task.task_error.message, c) : `The provider reported ${raw.toLowerCase()}.`;
      return { status: "error", rawStatus: raw, errorMessage: message };
    }
    return { status: "running", rawStatus: raw.slice(0, 40), errorMessage: null };
  },

  async fetchResult(_engine, job, deps) {
    const c = cfg(deps);
    const task = await readTask(job.jobId, c, deps);
    const url = task.model_urls?.glb;
    if (typeof url !== "string" || !url) throw new ProviderError("invalid_response", "The provider result has no GLB file.");
    return downloadGlb(url, c, deps);
  },
};
