import { readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";
import { createPostgresStore } from "@/lib/store-postgres";
import { emptyChecklist, emptyDimensions, glbKey, nowIso, sourceKey, type ModelRow } from "@/lib/store-shared";
import { memoryBlobs, migrate, pgliteClient } from "./sql-client";

/** Same behaviour the JSON store has, on the real schema. PGlite runs one connection, so this proves the logic, not lock contention. */
const glb = readFileSync(path.join(process.cwd(), "public", "demo", "lamp.glb"));
let n = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;

function row(orgId: string, over: Partial<ModelRow> = {}): ModelRow {
  const t = nowIso();
  return {
    id: uuid(),
    orgId,
    title: "Vase",
    sku: null,
    category: "home-decor",
    source: "ai",
    provenance: "ai-generated",
    engineId: "sloyd",
    estimatedCostUsd: 0.27,
    currentVersionId: null,
    projectId: null,
    tags: [],
    favorite: false,
    hasThumbnail: false,
    deletedAt: null,
    inputKind: "image",
    sourceViews: ["front"],
    prompt: null,
    demoAsset: null,
    status: "processing",
    jobState: "reserved",
    providerJobRef: null,
    providerJobId: null,
    providerJobUrls: null,
    idempotencyKey: null,
    error: null,
    failureCode: null,
    attemptsDebited: 0,
    attemptsRefunded: 0,
    providerCreditsEstimate: 20,
    textureResolution: "1k",
    reviewState: "pending",
    checklist: emptyChecklist(),
    reviewNote: null,
    reviewedAt: null,
    dimensions: emptyDimensions(),
    fileSize: null,
    checksum: null,
    stalled: false,
    rightsAffirmed: true,
    hasSourceImage: false,
    sourceImageExt: null,
    extraImages: [],
    sourceImageSha256: null,
    nextPollAt: null,
    pollCount: 0,
    lastPolledAt: null,
    lastPollError: null,
    createdAt: t,
    updatedAt: t,
    ...over,
  };
}

describe("Postgres store", () => {
  let store: ReturnType<typeof createPostgresStore>;
  let blobs: ReturnType<typeof memoryBlobs>;
  let db: PGlite;

  beforeEach(async () => {
    process.env.LOCAL_PAID_ATTEMPT_CAP = "3";
    process.env.MAX_ACTIVE_JOBS_PER_ORG = "2";
    db = new PGlite();
    await migrate(db);
    blobs = memoryBlobs();
    store = createPostgresStore(pgliteClient(db), blobs);
  });

  it("signs in once per email, grants the cap once and records the membership RLS needs", async () => {
    const auth = "33333333-3333-4333-8333-333333333333";
    const a1 = await store.signIn("A@example.com ", auth);
    const a2 = await store.signIn("a@example.com", auth);
    expect(a2.org.id).toBe(a1.org.id);
    expect(a1.user.email).toBe("a@example.com");
    expect((await store.usage(a1.org.id)).balance).toBe(3);
    expect((await db.query("SELECT * FROM public.memberships")).rows).toHaveLength(1);
  });

  it("keeps organizations apart", async () => {
    const a = await store.signIn("a@example.com");
    const b = await store.signIn("b@example.com");
    const r = row(a.org.id, { source: "demo", provenance: "demo-sample", status: "ready", jobState: "succeeded", engineId: null });
    await store.insertReadyModel(a.org.id, r, glb);
    expect(await store.getModel(b.org.id, r.id)).toBeNull();
    expect(await store.readGlb(b.org.id, r.id)).toBeNull();
    expect(await store.updateModel(b.org.id, r.id, { title: "stolen" })).toBeNull();
    expect(await store.deleteModel(b.org.id, r.id)).toBe(false);
    expect(await store.listModels(b.org.id)).toEqual([]);
    expect((await store.readGlb(a.org.id, r.id))?.subarray(0, 4).toString()).toBe("glTF");
  });

  it("round-trips every field of a model", async () => {
    const { org } = await store.signIn("a@example.com");
    const r = row(org.id, {
      sku: "SKU-1",
      prompt: "a chair",
      sourceViews: ["front", "back"],
      extraImages: [{ view: "back", ext: "png" }],
      hasSourceImage: true,
      sourceImageExt: "jpg",
      dimensions: { widthMm: 10, heightMm: 20.5, depthMm: null },
      providerJobUrls: { status: "https://q/s", response: "https://q/r" },
      nextPollAt: new Date(Date.now() + 1000).toISOString(),
    });
    const res = await store.reserveProviderJob(org.id, r, []);
    expect(res.ok).toBe(true);
    const back = await store.getModel(org.id, r.id);
    expect(back).toEqual({ ...r, attemptsDebited: 1 });
  });

  it("reserves atomically: debits once, honours the idempotency key, the job cap and the balance", async () => {
    const { org } = await store.signIn("a@example.com");
    const first = await store.reserveProviderJob(org.id, row(org.id, { idempotencyKey: "idem-1" }), []);
    expect(first).toMatchObject({ ok: true, duplicate: false });
    const dup = await store.reserveProviderJob(org.id, row(org.id, { idempotencyKey: "idem-1" }), []);
    expect(dup).toMatchObject({ ok: true, duplicate: true });
    expect((await store.usage(org.id)).debited).toBe(1);

    await store.reserveProviderJob(org.id, row(org.id), []);
    expect(await store.reserveProviderJob(org.id, row(org.id), [])).toEqual({ ok: false, reason: "too_many_active" });

    process.env.MAX_ACTIVE_JOBS_PER_ORG = "5";
    await store.reserveProviderJob(org.id, row(org.id), []);
    expect((await store.usage(org.id)).balance).toBe(0);
    expect(await store.reserveProviderJob(org.id, row(org.id), [])).toEqual({ ok: false, reason: "insufficient" });
  });

  it("never spends more than the balance when requests arrive together", async () => {
    process.env.MAX_ACTIVE_JOBS_PER_ORG = "5";
    const { org } = await store.signIn("a@example.com");
    const results = await Promise.all(Array.from({ length: 10 }, () => store.reserveProviderJob(org.id, row(org.id), [])));
    expect(results.filter((r) => r.ok)).toHaveLength(3);
    const usage = await store.usage(org.id);
    expect(usage.balance).toBe(0);
    expect(usage.debited).toBe(3);
  });

  it("stores photos under the organization and removes every file with the model, keeping the ledger", async () => {
    const { org } = await store.signIn("a@example.com");
    const r = row(org.id, { hasSourceImage: true, sourceImageExt: "jpg", extraImages: [{ view: "back", ext: "png" }], sourceViews: ["front", "back"] });
    await store.reserveProviderJob(org.id, r, [
      { view: "front", ext: "jpg", buffer: Buffer.from("front") },
      { view: "back", ext: "png", buffer: Buffer.from("back") },
    ]);
    expect(await store.readSourceImage(org.id, r.id)).toEqual({ data: Buffer.from("front"), mime: "image/jpeg" });
    expect(await store.readSourceImage(org.id, r.id, "back")).toEqual({ data: Buffer.from("back"), mime: "image/png" });
    expect(await store.readSourceImage(org.id, r.id, "left")).toBeNull();
    expect(blobs.files.has(sourceKey(org.id, r.id, "png", "back"))).toBe(true);

    await store.completeJob(org.id, r.id, glb, { sha256: "a".repeat(64), bytes: glb.byteLength });
    expect(blobs.files.has(glbKey(org.id, r.id))).toBe(true);
    expect(await store.deleteModel(org.id, r.id)).toBe(true);
    expect(blobs.files.size).toBe(0);
    expect((await store.usage(org.id)).ledger.length).toBe(2);
  });

  it("refunds at most once, whichever path gets there first", async () => {
    const { org } = await store.signIn("a@example.com");
    const r = row(org.id);
    await store.reserveProviderJob(org.id, r, []);
    const failed = await store.markFailed(org.id, r.id, { error: "boom", failureCode: "provider_error", refund: true });
    expect(failed).toMatchObject({ status: "failed", jobState: "failed", attemptsRefunded: 1 });
    expect(await store.refundJob(org.id, r.id, "again")).toBe(false);
    await store.markFailed(org.id, r.id, { error: "boom", failureCode: "provider_error", refund: true });
    const usage = await store.usage(org.id);
    expect(usage.balance).toBe(3);
    expect(usage.refunded).toBe(1);
  });

  it("an uncertain outcome needs review and is not refunded; a finished model is never overwritten", async () => {
    const { org } = await store.signIn("a@example.com");
    const r = row(org.id);
    await store.reserveProviderJob(org.id, r, []);
    expect(await store.markFailed(org.id, r.id, { error: "?", failureCode: "ambiguous", refund: false })).toMatchObject({ jobState: "needs_review", attemptsRefunded: 0 });
    expect((await store.usage(org.id)).balance).toBe(2);

    const ok = row(org.id);
    await store.reserveProviderJob(org.id, ok, []);
    await store.completeJob(org.id, ok.id, glb, { sha256: "a".repeat(64), bytes: glb.byteLength });
    expect(await store.markFailed(org.id, ok.id, { error: "late", failureCode: "provider_error", refund: true })).toMatchObject({ status: "ready" });
  });

  it("keeps a history of job states and one cost per model", async () => {
    const { org } = await store.signIn("a@example.com");
    const r = row(org.id);
    await store.reserveProviderJob(org.id, r, []);
    await store.updateModel(org.id, r.id, { jobState: "queued", providerJobId: "job-12345678" });
    await store.updateModel(org.id, r.id, { jobState: "queued", pollCount: 1 });
    await store.recordCost(org.id, r.id, "sloyd", 0.27, "published");
    await store.recordCost(org.id, r.id, "sloyd", 0.27, "published");
    await store.completeJob(org.id, r.id, glb, { sha256: "a".repeat(64), bytes: glb.byteLength });
    expect((await store.listJobEvents(org.id, r.id)).map((e) => e.state)).toEqual(["reserved", "queued", "succeeded"]);
    expect(await store.listCostEvents(org.id)).toMatchObject([{ engineId: "sloyd", usd: 0.27, evidence: "published" }]);
    expect((await store.findByProviderJob("job-12345678"))?.id).toBe(r.id);
  });

  it("a claimed job is not handed to another worker until its lease ends or it is due again", async () => {
    const { org } = await store.signIn("a@example.com");
    const due = row(org.id);
    const later = row(org.id, { nextPollAt: new Date(Date.now() + 60_000).toISOString() });
    await store.reserveProviderJob(org.id, due, []);
    await store.reserveProviderJob(org.id, later, []);
    expect((await store.claimPollable()).map((m) => m.id)).toEqual([due.id]);
    expect(await store.claimPollable()).toEqual([]);
    await db.exec("UPDATE public.models SET lease_until = now() - interval '1 second'");
    expect((await store.claimPollable()).map((m) => m.id)).toEqual([due.id]);
  });

  it("does not poll a job that timed out, and it stops holding a slot", async () => {
    const { org } = await store.signIn("a@example.com");
    const r = row(org.id);
    await store.reserveProviderJob(org.id, r, []);
    expect((await store.usage(org.id)).activeJobs).toBe(1);
    await store.updateModel(org.id, r.id, { stalled: true, jobState: "timed_out" });
    expect(await store.claimPollable()).toEqual([]);
    expect((await store.usage(org.id)).activeJobs).toBe(0);
  });

  it("keeps versions: only one original, current file follows activation, review resets, and the original cannot be deleted", async () => {
    const { org } = await store.signIn("a@example.com");
    const other = await store.signIn("b@example.com");
    const r = row(org.id, { source: "demo", provenance: "demo-sample", status: "ready", jobState: "succeeded", engineId: null, reviewState: "approved", checklist: { shape: true, surfaces: true, hiddenAngles: true, material: true, labels: true } });
    await store.insertReadyModel(org.id, r, glb);
    const diagnostics = { bytes: 1, vertices: 3, triangles: 1, meshes: 1, primitives: 1, materials: 0, textures: [], textureBytes: 0, maxTextureSize: 0, hasUv: false, hasNormals: false, sizeMeters: [1, 1, 1] as [number, number, number], warnings: [] };
    const original = { id: uuid(), orgId: org.id, modelId: r.id, preset: "original" as const, bytes: glb.byteLength, sha256: "a".repeat(64), diagnostics, createdAt: nowIso() };
    await store.addVersion(org.id, original, null);
    await store.addVersion(org.id, { ...original, id: uuid() }, null); // a second original is ignored
    const optimized = { ...original, id: uuid(), preset: "web" as const, bytes: 4, sha256: "b".repeat(64), createdAt: new Date(Date.now() + 1000).toISOString() };
    await store.addVersion(org.id, optimized, Buffer.from("opt!"));
    expect((await store.listVersions(org.id, r.id)).map((v) => v.preset)).toEqual(["original", "web"]);
    expect(await store.listVersions(other.org.id, r.id)).toEqual([]);
    expect(await store.readVersionGlb(other.org.id, r.id, optimized.id)).toBeNull();
    expect(await store.activateVersion(other.org.id, r.id, optimized.id)).toBeNull();

    const active = await store.activateVersion(org.id, r.id, optimized.id);
    expect(active).toMatchObject({ currentVersionId: optimized.id, fileSize: 4, checksum: "b".repeat(64), reviewState: "pending" });
    expect(active?.checklist.shape).toBe(false);
    expect((await store.readGlb(org.id, r.id))?.toString()).toBe("opt!");
    expect((await store.readVersionGlb(org.id, r.id, original.id))?.subarray(0, 4).toString()).toBe("glTF");

    expect(await store.deleteVersion(org.id, r.id, optimized.id)).toBe("protected");
    expect(await store.deleteVersion(org.id, r.id, original.id)).toBe("protected");
    expect(await store.deleteVersion(other.org.id, r.id, optimized.id)).toBe("not_found");

    expect((await store.activateVersion(org.id, r.id, original.id))?.currentVersionId).toBeNull();
    expect((await store.readGlb(org.id, r.id))?.subarray(0, 4).toString()).toBe("glTF");
    expect(await store.deleteVersion(org.id, r.id, optimized.id)).toBe("deleted");
    expect(blobs.files.size).toBe(1);

    await store.deleteModel(org.id, r.id);
    expect(blobs.files.size).toBe(0);
    expect(await store.listVersions(org.id, r.id)).toEqual([]);
  });

  it("keeps a user's answers across sign-ins and never touches balance", async () => {
    const { user, org } = await store.signIn("a@example.com");
    expect((await store.getProfile(user.id)).useCase).toBeNull();
    await store.saveProfile(user.id, { useCase: "game", experience: "advanced", goal: "assets", activeWorkspace: "game", onboardedAt: nowIso() });
    await store.saveProfile(user.id, { activeWorkspace: "commerce" });
    await store.signIn("a@example.com");
    const p = await store.getProfile(user.id);
    expect(p).toMatchObject({ useCase: "game", experience: "advanced", goal: "assets", activeWorkspace: "commerce" });
    expect(p.onboardedAt).not.toBeNull();
    expect((await store.usage(org.id)).balance).toBe(3);
  });

  it("trash hides a model from everything, stops its public links, and can be undone", async () => {
    const { org } = await store.signIn("a@example.com");
    const other = await store.signIn("b@example.com");
    const r = row(org.id, { source: "demo", provenance: "demo-sample", status: "ready", jobState: "succeeded", engineId: null, reviewState: "approved" });
    await store.insertReadyModel(org.id, r, glb);
    const embed = { id: uuid(), token: "t".repeat(32), orgId: org.id, modelId: r.id, allowedDomains: ["shop.test"], createdAt: nowIso(), revokedAt: null };
    await store.createEmbed(embed);
    expect((await store.getPublicEmbed(embed.token))?.model.id).toBe(r.id);

    expect(await store.trashModel(other.org.id, r.id)).toBe("not_found");
    expect(await store.trashModel(org.id, r.id)).toBe("trashed");
    expect(await store.getModel(org.id, r.id)).toBeNull();
    expect(await store.listModels(org.id)).toEqual([]);
    expect(await store.readGlb(org.id, r.id)).toBeNull();
    expect((await store.listTrash(org.id)).map((m) => m.id)).toEqual([r.id]);
    expect(await store.isInTrash(org.id, r.id)).toBe(true);
    expect(await store.isInTrash(other.org.id, r.id)).toBe(false);
    expect(await store.getPublicEmbed(embed.token)).toBeNull();

    expect(await store.restoreModel(other.org.id, r.id)).toBeNull();
    expect((await store.restoreModel(org.id, r.id))?.deletedAt).toBeNull();
    expect(await store.getPublicEmbed(embed.token)).toBeNull(); // a restored model does not republish itself

    await store.trashModel(org.id, r.id);
    expect(await store.listExpiredTrash(Date.now() + 29 * 86_400_000)).toEqual([]);
    expect(await store.listExpiredTrash(Date.now() + 31 * 86_400_000)).toEqual([{ orgId: org.id, id: r.id }]);
  });

  it("a running job cannot be trashed", async () => {
    const { org } = await store.signIn("a@example.com");
    const r = row(org.id);
    await store.reserveProviderJob(org.id, r, []);
    expect(await store.trashModel(org.id, r.id)).toBe("busy");
  });

  it("a public link needs an active link and an approved model", async () => {
    const { org } = await store.signIn("a@example.com");
    const other = await store.signIn("b@example.com");
    const r = row(org.id, { source: "demo", provenance: "demo-sample", status: "ready", jobState: "succeeded", engineId: null, reviewState: "approved" });
    await store.insertReadyModel(org.id, r, glb);
    const embed = { id: uuid(), token: "x".repeat(32), orgId: org.id, modelId: r.id, allowedDomains: [], createdAt: nowIso(), revokedAt: null };
    await store.createEmbed(embed);
    expect(await store.getPublicEmbed("nope")).toBeNull();
    await store.updateModel(org.id, r.id, { reviewState: "rejected" });
    expect(await store.getPublicEmbed(embed.token)).toBeNull();
    await store.updateModel(org.id, r.id, { reviewState: "approved" });
    expect(await store.getPublicEmbed(embed.token)).not.toBeNull();
    expect(await store.revokeEmbed(other.org.id, embed.id)).toBe(false);
    expect(await store.getPublicEmbed(embed.token)).not.toBeNull();
    expect(await store.revokeEmbed(org.id, embed.id)).toBe(true);
    expect(await store.getPublicEmbed(embed.token)).toBeNull();
  });

  it("projects belong to one organization, and deleting one keeps its models", async () => {
    const { org } = await store.signIn("a@example.com");
    const other = await store.signIn("b@example.com");
    const p = await store.createProject(org.id, { id: uuid(), name: "Winter", createdAt: nowIso() });
    expect(await store.listProjects(other.org.id)).toEqual([]);
    const r = row(org.id, { source: "demo", provenance: "demo-sample", status: "ready", jobState: "succeeded", engineId: null });
    await store.insertReadyModel(org.id, r, glb);
    await store.updateModel(org.id, r.id, { projectId: p.id, tags: ["a", "b"], favorite: true });
    expect(await store.getModel(org.id, r.id)).toMatchObject({ projectId: p.id, tags: ["a", "b"], favorite: true });
    expect(await store.deleteProject(other.org.id, p.id)).toBe(false);
    expect(await store.deleteProject(org.id, p.id)).toBe(true);
    expect((await store.getModel(org.id, r.id))?.projectId).toBeNull();
  });

  it("reads the engine kill switch", async () => {
    await db.exec("INSERT INTO public.engine_switches (engine_id) VALUES ('fal-rodin-2.5'); INSERT INTO public.engine_switches (engine_id, disabled) VALUES ('sloyd', false);");
    expect(await store.listDisabledEngines()).toEqual(["fal-rodin-2.5"]);
  });

  it("rejects ids that are not UUIDs without touching the database", async () => {
    const { org } = await store.signIn("a@example.com");
    expect(await store.getModel(org.id, "../../etc/passwd")).toBeNull();
    expect(await store.listJobEvents(org.id, "nope")).toEqual([]);
    await expect(store.deleteModel(org.id, "../../etc/passwd")).rejects.toThrow(/Invalid identifier/);
  });
});
