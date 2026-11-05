import "server-only";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { validateGlb, GlbError } from "@/lib/glb";
import { adapterFor, capabilityProblem, engineEnabled, getEngine, priceOf, setSwitchedOffEngines } from "@/lib/provider/registry";
import { redact } from "@/lib/provider/sloyd";
import { ProviderError, type Deps, type ProviderInput, type ProviderJobRef } from "@/lib/provider/types";
import { emptyChecklist, emptyDimensions, estimateProviderCredits, nowIso, store, type ExtraImage, type ModelRow, type SourcePhoto } from "@/lib/store";
import type { Category, DemoAsset, FailureCode, ImageView, InputKind, JobState, TextureResolution } from "@/lib/types";

export type { ProviderInput };
const DEFAULT_ENGINE_ID = "sloyd";

const POLL_FIRST_MS = 5_000;
const POLL_MAX_MS = 30_000;
const STALL_AFTER_MS = 45 * 60_000;
const AMBIGUOUS_AFTER_MS = 2 * 60_000;

function baseRow(orgId: string, v: Pick<ModelRow, "title" | "sku" | "category" | "source" | "provenance">): ModelRow {
  const t = nowIso();
  return {
    id: randomUUID(),
    orgId,
    title: v.title,
    sku: v.sku,
    category: v.category,
    source: v.source,
    provenance: v.provenance,
    engineId: null,
    estimatedCostUsd: null,
    inputKind: null,
    sourceViews: [],
    prompt: null,
    demoAsset: null,
    status: "processing",
    jobState: "reserved",
    providerJobRef: null,
    providerJobId: null,
    idempotencyKey: null,
    error: null,
    failureCode: null,
    attemptsDebited: 0,
    attemptsRefunded: 0,
    providerCreditsEstimate: 0,
    textureResolution: null,
    reviewState: "pending",
    checklist: emptyChecklist(),
    reviewNote: null,
    reviewedAt: null,
    dimensions: emptyDimensions(),
    fileSize: null,
    checksum: null,
    stalled: false,
    rightsAffirmed: false,
    hasSourceImage: false,
    sourceImageExt: null,
    sourceImageSha256: null,
    nextPollAt: null,
    pollCount: 0,
    lastPolledAt: null,
    lastPollError: null,
    createdAt: t,
    updatedAt: t,
  };
}

/** Real sample GLB shipped in /public/demo. Free, instant, never described as an AI reconstruction. */
export async function createDemoModel(orgId: string, input: { title: string; sku: string | null; category: Category; demoAsset: DemoAsset }) {
  const file = path.join(process.cwd(), "public", "demo", `${input.demoAsset}.glb`);
  const glb = await readFile(file);
  const info = validateGlb(glb);
  const row = baseRow(orgId, { title: input.title, sku: input.sku, category: input.category, source: "demo", provenance: "demo-sample" });
  Object.assign(row, { status: "ready", jobState: "succeeded", demoAsset: input.demoAsset, fileSize: info.bytes, checksum: info.sha256 });
  return store.insertDemoModel(orgId, row, glb);
}

export type CreateProviderResult =
  | { ok: true; model: ModelRow; duplicate: boolean }
  | { ok: false; code: "insufficient_attempts" | "too_many_active" | "engine_unavailable" | "engine_unsupported" | FailureCode; message: string; model?: ModelRow; httpStatus: number };

const viewsOf = (source: ProviderInput): ImageView[] => {
  if (source.kind === "image") return ["front"];
  return source.kind === "multi-image" ? (Object.keys(source.images) as ImageView[]) : [];
};

export async function createProviderModel(
  orgId: string,
  input: {
    title: string;
    sku: string | null;
    category: Category;
    textureResolution: TextureResolution;
    idempotencyKey: string | null;
    source: ProviderInput;
    engineId?: string;
  },
  deps?: Deps,
): Promise<CreateProviderResult> {
  const kind: InputKind = input.source.kind;
  // Checked before anything is debited: a request the engine cannot honour is refused, never quietly reduced.
  const engine = getEngine(input.engineId ?? DEFAULT_ENGINE_ID);
  if (!engine || !engineEnabled(engine)) return { ok: false, code: "engine_unavailable", message: "This engine is not available.", httpStatus: 503 };
  const views = viewsOf(input.source);
  const query = { mode: kind, photoCount: views.length, texture: input.textureResolution };
  if (capabilityProblem(engine, { ...query, views })) return { ok: false, code: "engine_unsupported", message: "This engine does not support these options.", httpStatus: 422 };
  const cost = priceOf(engine, query).usd;

  const row = baseRow(orgId, { title: input.title, sku: input.sku, category: input.category, source: "ai", provenance: "ai-generated" });
  const photos: SourcePhoto[] = [];
  if (input.source.kind === "image") photos.push({ view: "front", ext: input.source.image.ext, buffer: input.source.image.buffer });
  if (input.source.kind === "multi-image") {
    for (const view of ["front", "left", "back", "right"] as const) {
      const img = input.source.images[view];
      if (img) photos.push({ view, ext: img.ext, buffer: img.buffer });
    }
  }
  const front = photos.find((p) => p.view === "front");
  const extraImages: ExtraImage[] = photos.filter((p) => p.view !== "front").map((p) => ({ view: p.view as ExtraImage["view"], ext: p.ext }));
  const frontImage = input.source.kind === "image" ? input.source.image : input.source.kind === "multi-image" ? input.source.images.front : undefined;
  Object.assign(row, {
    engineId: engine.id,
    estimatedCostUsd: cost,
    inputKind: kind,
    sourceViews: photos.map((p) => p.view),
    prompt: input.source.kind === "text" ? input.source.prompt : null,
    textureResolution: input.textureResolution,
    providerCreditsEstimate: engine.provider === "sloyd" ? estimateProviderCredits(input.textureResolution, kind) : 0,
    idempotencyKey: input.idempotencyKey,
    rightsAffirmed: true,
    hasSourceImage: Boolean(front),
    sourceImageExt: front?.ext ?? null,
    extraImages,
    sourceImageSha256: frontImage?.sha256 ?? null,
  });
  let reserved;
  try {
    reserved = await store.reserveProviderJob(orgId, row, photos);
  } catch (e) {
    // The photos could not be stored after the attempt was debited. The provider was never called, so the attempt goes back.
    console.error("[jobs] reservation failed:", e instanceof Error ? e.message : "unknown");
    const failed = await store.markFailed(orgId, row.id, { error: "The photos could not be stored. Your attempt was refunded.", failureCode: "internal", refund: true }).catch(() => null);
    return { ok: false, code: "internal", message: "The photos could not be stored. Try again.", model: failed ?? undefined, httpStatus: 503 };
  }
  if (!reserved.ok) {
    return reserved.reason === "insufficient"
      ? { ok: false, code: "insufficient_attempts", message: "No paid generation attempts left under the local cap.", httpStatus: 402 }
      : { ok: false, code: "too_many_active", message: "Too many jobs are already running. Wait for one to finish.", httpStatus: 429 };
  }
  if (reserved.duplicate) return { ok: true, model: reserved.model, duplicate: true };

  try {
    const job = await adapterFor(engine).submit(engine, { source: input.source, textureResolution: input.textureResolution }, deps);
    await store.recordCost(orgId, row.id, engine.id, cost, engine.priceEvidence);
    const updated = await store.updateModel(orgId, row.id, {
      providerJobId: job.jobId,
      providerJobUrls: job.urls ?? null,
      jobState: "queued",
      nextPollAt: new Date(Date.now() + POLL_FIRST_MS).toISOString(),
    });
    return { ok: true, model: updated ?? reserved.model, duplicate: false };
  } catch (e) {
    const pe = e instanceof ProviderError ? e : new ProviderError("network", "Unexpected provider failure.");
    const code: FailureCode =
      pe.kind === "payment_required" ? "payment_required"
      : pe.kind === "auth" || pe.kind === "not_configured" ? "provider_auth"
      : pe.kind === "rate_limited" ? "rate_limited"
      : pe.kind === "rejected" ? "provider_rejected"
      : pe.definite ? "provider_error"
      : "ambiguous";
    // Refund only when the provider definitely did not start the job. Timeouts / 5xx are ambiguous: no automatic refund.
    const failed = await store.markFailed(orgId, row.id, { error: redact(pe.message), failureCode: code, refund: pe.definite });
    const http = pe.kind === "payment_required" ? 402 : pe.kind === "rate_limited" ? 429 : pe.kind === "auth" || pe.kind === "not_configured" ? 502 : pe.kind === "rejected" ? 422 : 502;
    return { ok: false, code, message: redact(pe.message), model: failed ?? undefined, httpStatus: http };
  }
}

let switchesReadAt = 0;
const SWITCHES_TTL_MS = 30_000;

/** Reads the kill switch from the database, at most every 30 seconds, so turning an engine off needs no deploy. */
export async function refreshEngineSwitches(now = Date.now()) {
  if (now - switchesReadAt < SWITCHES_TTL_MS) return;
  switchesReadAt = now;
  setSwitchedOffEngines(await store.listDisabledEngines());
}

const inflight = new Set<string>();

/**
 * Advances one provider job: poll status, and on success download → validate → store the GLB privately.
 * Safe to call concurrently (single-flight per model) and repeatedly (idempotent).
 */
export async function refreshJob(orgId: string, modelId: string, deps?: Deps): Promise<ModelRow | null> {
  const key = `${orgId}:${modelId}`;
  const current = await store.getModel(orgId, modelId);
  if (!current) return null;
  if (current.source !== "ai" || current.status !== "processing") return current;
  if (inflight.has(key)) return current;
  inflight.add(key);
  try {
    const age = Date.now() - Date.parse(current.createdAt);
    if (!current.providerJobId) {
      if (age > AMBIGUOUS_AFTER_MS) {
        return await store.markFailed(orgId, modelId, {
          error: "The provider job could not be confirmed. Check your provider dashboard before retrying; no automatic refund was issued.",
          failureCode: "ambiguous",
          refund: false,
        });
      }
      return current;
    }
    // Rows from before the multi-engine version have no engine: they can only be Sloyd jobs.
    const engine = getEngine(current.engineId ?? DEFAULT_ENGINE_ID);
    if (!engine) {
      return await store.markFailed(orgId, modelId, { error: "The engine for this job no longer exists. Check your provider dashboard; no automatic refund was issued.", failureCode: "ambiguous", refund: false });
    }
    const adapter = adapterFor(engine);
    const job: ProviderJobRef = { jobId: current.providerJobId, urls: current.providerJobUrls ?? null };
    let status;
    try {
      status = await adapter.getStatus(engine, job, deps);
    } catch (e) {
      const pe = e instanceof ProviderError ? e : null;
      if (pe?.kind === "auth") {
        return await store.markFailed(orgId, modelId, { error: pe.message, failureCode: "provider_auth", refund: false });
      }
      return await scheduleNext(current, redact(pe?.message ?? "Polling failed."));
    }
    if (status.status === "error") {
      return await store.markFailed(orgId, modelId, {
        error: status.errorMessage || "Provider generation failed.",
        failureCode: "provider_error",
        refund: true, // verified provider error → automatic refund of the local attempt
      });
    }
    if (status.status === "success") {
      try {
        if (current.jobState !== "processing") await store.updateModel(orgId, modelId, { jobState: "processing" });
        const glb = await adapter.fetchResult(engine, job, deps);
        const info = validateGlb(glb);
        return await store.completeJob(orgId, modelId, glb, { sha256: info.sha256, bytes: info.bytes });
      } catch (e) {
        if (e instanceof ProviderError && (e.kind === "not_ready" || e.kind === "network" || e.kind === "timeout" || e.kind === "server")) {
          return await scheduleNext(current, e.message, "processing");
        }
        if (e instanceof GlbError || (e instanceof ProviderError && e.kind === "invalid_response")) {
          return await store.markFailed(orgId, modelId, {
            error: `The provider reported success but the file failed validation: ${e.message} No automatic refund was issued.`,
            failureCode: "invalid_output",
            refund: false,
          });
        }
        throw e;
      }
    }
    return await scheduleNext(current, null, status.status === "pending" ? "queued" : "running");
  } finally {
    inflight.delete(key);
  }
}

async function scheduleNext(row: ModelRow, pollError: string | null, state: JobState = "running") {
  const pollCount = row.pollCount + 1;
  const stalled = Date.now() - Date.parse(row.createdAt) > STALL_AFTER_MS;
  const delay = Math.min(POLL_MAX_MS, POLL_FIRST_MS * Math.pow(1.5, pollCount));
  return store.updateModel(row.orgId, row.id, {
    jobState: stalled ? "timed_out" : state,
    pollCount,
    lastPolledAt: nowIso(),
    lastPollError: pollError,
    stalled,
    nextPollAt: stalled ? null : new Date(Date.now() + delay).toISOString(),
  });
}

/* ───────── durable background poller ───────── */

const pg = globalThis as unknown as { __osPoller?: ReturnType<typeof setInterval>; __osTicking?: boolean };

export async function pollerTick(deps?: Deps) {
  if (pg.__osTicking) return;
  pg.__osTicking = true;
  try {
    await refreshEngineSwitches().catch(() => undefined);
    const rows = await store.claimPollable();
    for (const r of rows) {
      await refreshJob(r.orgId, r.id, deps).catch((e) => console.error("[poller] refresh failed:", redact(String(e?.message ?? e))));
    }
  } finally {
    pg.__osTicking = false;
  }
}

/** State lives in the store, so jobs created before a restart are picked up again here. */
export function startPoller(intervalMs = 4_000) {
  if (pg.__osPoller) return;
  pg.__osPoller = setInterval(() => void pollerTick(), intervalMs);
  pg.__osPoller.unref?.();
}
