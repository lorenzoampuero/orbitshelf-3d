import "server-only";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { validateGlb, GlbError } from "@/lib/glb";
import type { NormalizedImage } from "@/lib/image";
import { createImageJob, createMultiImageJob, createTextJob, downloadResult, getJob, ProviderError, redact, type Deps } from "@/lib/provider/sloyd";
import { emptyChecklist, emptyDimensions, estimateProviderCredits, nowIso, store, type ExtraImage, type ModelRow, type SourcePhoto } from "@/lib/store";
import type { Category, DemoAsset, FailureCode, ImageView, InputKind, TextureResolution } from "@/lib/types";

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
    inputKind: null,
    sourceViews: [],
    prompt: null,
    demoAsset: null,
    status: "processing",
    jobState: "queued",
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
  Object.assign(row, { status: "ready", jobState: "success", demoAsset: input.demoAsset, fileSize: info.bytes, checksum: info.sha256 });
  return store.insertDemoModel(orgId, row, glb);
}

export type CreateProviderResult =
  | { ok: true; model: ModelRow; duplicate: boolean }
  | { ok: false; code: "insufficient_attempts" | "too_many_active" | FailureCode; message: string; model?: ModelRow; httpStatus: number };

/** What the paid generation starts from: one photo, 2–4 photos of the same object (front is required), or a text description. */
export type ProviderInput =
  | { kind: "image"; image: NormalizedImage }
  | { kind: "multi-image"; images: Partial<Record<ImageView, NormalizedImage>> }
  | { kind: "text"; prompt: string };

export async function createProviderModel(
  orgId: string,
  input: {
    title: string;
    sku: string | null;
    category: Category;
    textureResolution: TextureResolution;
    idempotencyKey: string | null;
    source: ProviderInput;
  },
  deps?: Deps,
): Promise<CreateProviderResult> {
  const row = baseRow(orgId, { title: input.title, sku: input.sku, category: input.category, source: "sloyd", provenance: "ai-generated" });
  const kind: InputKind = input.source.kind;
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
    inputKind: kind,
    sourceViews: photos.map((p) => p.view),
    prompt: input.source.kind === "text" ? input.source.prompt : null,
    textureResolution: input.textureResolution,
    providerCreditsEstimate: estimateProviderCredits(input.textureResolution, kind),
    idempotencyKey: input.idempotencyKey,
    rightsAffirmed: true,
    hasSourceImage: Boolean(front),
    sourceImageExt: front?.ext ?? null,
    extraImages,
    sourceImageSha256: frontImage?.sha256 ?? null,
  });
  const reserved = await store.reserveProviderJob(orgId, row, photos);
  if (!reserved.ok) {
    return reserved.reason === "insufficient"
      ? { ok: false, code: "insufficient_attempts", message: "No paid generation attempts left under the local cap.", httpStatus: 402 }
      : { ok: false, code: "too_many_active", message: "Too many jobs are already running. Wait for one to finish.", httpStatus: 429 };
  }
  if (reserved.duplicate) return { ok: true, model: reserved.model, duplicate: true };

  try {
    const src = input.source;
    const { jobId } =
      src.kind === "image"
        ? await createImageJob({ image: src.image.buffer, mime: src.image.mime, filename: `product.${src.image.ext}`, textureResolution: input.textureResolution }, deps)
        : src.kind === "multi-image"
          ? await createMultiImageJob(
              {
                images: Object.fromEntries(Object.entries(src.images).map(([v, img]) => [v, { image: img.buffer, mime: img.mime }])),
                textureResolution: input.textureResolution,
              },
              deps,
            )
          : await createTextJob({ prompt: src.prompt, textureResolution: input.textureResolution }, deps);
    const updated = await store.updateModel(orgId, row.id, {
      providerJobId: jobId,
      jobState: "pending",
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

const inflight = new Set<string>();

/**
 * Advances one provider job: poll status, and on success download → validate → store the GLB privately.
 * Safe to call concurrently (single-flight per model) and repeatedly (idempotent).
 */
export async function refreshJob(orgId: string, modelId: string, deps?: Deps): Promise<ModelRow | null> {
  const key = `${orgId}:${modelId}`;
  const current = await store.getModel(orgId, modelId);
  if (!current) return null;
  if (current.source !== "sloyd" || current.status !== "processing") return current;
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
    let status;
    try {
      status = await getJob(current.providerJobId, deps);
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
        const glb = await downloadResult(current.providerJobId, deps);
        const info = validateGlb(glb);
        return await store.completeJob(orgId, modelId, glb, { sha256: info.sha256, bytes: info.bytes });
      } catch (e) {
        if (e instanceof ProviderError && (e.kind === "not_ready" || e.kind === "network" || e.kind === "timeout" || e.kind === "server")) {
          return await scheduleNext(current, e.message, "running");
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
    return await scheduleNext(current, null, status.status);
  } finally {
    inflight.delete(key);
  }
}

async function scheduleNext(row: ModelRow, pollError: string | null, state: "pending" | "running" = "running") {
  const pollCount = row.pollCount + 1;
  const stalled = Date.now() - Date.parse(row.createdAt) > STALL_AFTER_MS;
  const delay = Math.min(POLL_MAX_MS, POLL_FIRST_MS * Math.pow(1.5, pollCount));
  return store.updateModel(row.orgId, row.id, {
    jobState: state,
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
    const rows = await store.listPollable();
    const now = Date.now();
    for (const r of rows) {
      if (r.nextPollAt && Date.parse(r.nextPollAt) > now) continue;
      if (r.stalled) continue;
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
