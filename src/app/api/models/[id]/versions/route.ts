import { randomUUID } from "node:crypto";
import { z } from "zod";
import { apiError, apiJson, readJsonCapped, withUser } from "@/lib/api";
import { GlbError } from "@/lib/glb";
import { diagnoseGlb, OptimizeError, optimizeGlb } from "@/lib/glb-tools";
import { rateLimit } from "@/lib/rate-limit";
import { nowIso, store, toVersionDto, type ModelRow, type VersionRow } from "@/lib/store";
import { OPTIMIZE_PRESETS } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

/** The stored file becomes the first version the first time it is looked at. */
async function withOriginal(orgId: string, model: ModelRow): Promise<VersionRow[] | null> {
  const rows = await store.listVersions(orgId, model.id);
  if (rows.some((v) => v.preset === "original")) return rows;
  const glb = await store.readGlb(orgId, model.id);
  if (!glb) return null;
  const original: VersionRow = { id: randomUUID(), orgId, modelId: model.id, preset: "original", bytes: glb.byteLength, sha256: model.checksum ?? "", diagnostics: await diagnoseGlb(glb), createdAt: nowIso() };
  if (original.sha256.length !== 64) {
    const { createHash } = await import("node:crypto");
    original.sha256 = createHash("sha256").update(glb).digest("hex");
  }
  await store.addVersion(orgId, original, null);
  return store.listVersions(orgId, model.id);
}

export const GET = withUser<Ctx>(async (_req, user, { params }) => {
  const { id } = await params;
  const model = await store.getModel(user.orgId, id);
  if (!model) return apiError(404, "not_found", "Model not found.");
  if (model.status !== "ready") return apiJson({ versions: [] });
  try {
    const rows = await withOriginal(user.orgId, model);
    if (!rows) return apiError(409, "not_ready", "The model file is not available yet.");
    return apiJson({ versions: rows.map((v) => toVersionDto(v, model)) });
  } catch (e) {
    console.error("[versions] diagnosis failed:", e instanceof Error ? e.message : "unknown");
    return apiError(422, "cannot_read_model", "This file could not be analysed.");
  }
});

const createSchema = z.object({ preset: z.enum(OPTIMIZE_PRESETS) });

export const POST = withUser<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  // Optimization is heavy work for the server, so it has its own limit.
  const rl = await rateLimit(`optimize:${user.orgId}`, 6, 60_000);
  if (!rl.ok) return apiError(429, "rate_limited", "Too many optimizations. Try again shortly.", undefined, { "Retry-After": String(rl.retryAfterSeconds) });
  const read = await readJsonCapped(req);
  if (!read.ok) return read.response;
  const parsed = createSchema.safeParse(read.value);
  if (!parsed.success) return apiError(422, "validation", "Choose a preset.");

  const model = await store.getModel(user.orgId, id);
  if (!model) return apiError(404, "not_found", "Model not found.");
  if (model.status !== "ready") return apiError(409, "not_ready", "The model file is not available yet.");

  try {
    const rows = await withOriginal(user.orgId, model);
    const original = rows?.find((v) => v.preset === "original");
    const source = original ? await store.readVersionGlb(user.orgId, id, original.id) : null;
    if (!source) return apiError(409, "not_ready", "The model file is not available yet.");
    const result = await optimizeGlb(source, parsed.data.preset); // always from the original, so quality does not degrade with each pass
    const version: VersionRow = { id: randomUUID(), orgId: user.orgId, modelId: id, preset: parsed.data.preset, bytes: result.bytes, sha256: result.sha256, diagnostics: result.diagnostics, createdAt: nowIso() };
    await store.addVersion(user.orgId, version, result.glb);
    return apiJson({ version: toVersionDto(version, model) }, 201);
  } catch (e) {
    if (e instanceof GlbError || e instanceof OptimizeError) return apiError(422, "cannot_optimize", "This file could not be optimized.");
    console.error("[versions] optimization failed:", e instanceof Error ? e.message : "unknown");
    return apiError(422, "cannot_optimize", "This file could not be optimized.");
  }
});
