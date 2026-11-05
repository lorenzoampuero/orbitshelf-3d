import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { encryptSecret } from "@/lib/secrets";
import { createPostgresStore } from "@/lib/store-postgres";
import { emptyChecklist, emptyDimensions, nowIso, toWebhookDeliveryDto, type ModelRow } from "@/lib/store-shared";
import { copyRows, type LocalData } from "../../scripts/migrate-rows";
import { memoryBlobs, migrate, pgliteClient } from "./sql-client";

process.env.INTEGRATIONS_KEY = "unit-test-integrations-key-32-characters";

const row = (orgId: string, status: ModelRow["status"]): ModelRow => {
  const t = nowIso();
  return {
    id: crypto.randomUUID(), orgId, title: "Vase", sku: null, category: "home-decor", source: "demo", provenance: "demo-sample", engineId: null, estimatedCostUsd: null, inputKind: null, sourceViews: [], prompt: null, demoAsset: null,
    status, jobState: "succeeded", providerJobRef: null, providerJobId: null, providerJobUrls: null, idempotencyKey: null, error: null, failureCode: null, attemptsDebited: 0, attemptsRefunded: 0, providerCreditsEstimate: 0, textureResolution: null,
    reviewState: "pending", checklist: emptyChecklist(), reviewNote: null, reviewedAt: null, dimensions: emptyDimensions(), fileSize: null, checksum: null, stalled: false, rightsAffirmed: true, hasSourceImage: false, sourceImageExt: null, extraImages: [],
    currentVersionId: null, projectId: null, tags: [], favorite: false, hasThumbnail: false, deletedAt: null, sourceImageSha256: null, nextPollAt: null, pollCount: 0, lastPolledAt: null, lastPollError: null, createdAt: t, updatedAt: t,
  };
};

describe("webhooks on Postgres", () => {
  let store: ReturnType<typeof createPostgresStore>;
  let db: PGlite;
  let orgId: string;
  let endpointId: string;

  beforeAll(async () => {
    db = new PGlite();
    await migrate(db);
    store = createPostgresStore(pgliteClient(db), memoryBlobs());
    orgId = (await store.signIn("hooks@example.com")).org.id;
    endpointId = crypto.randomUUID();
    await store.createWebhookEndpoint({ id: endpointId, orgId, url: "https://hooks.example.com/in", secretEnc: encryptSecret("whsec_x"), createdAt: nowIso(), disabledAt: null });
  });

  it("queues one delivery per key, claims it once and records the result", async () => {
    await store.enqueueWebhook(orgId, "model.ready", "{}", "model.ready:1");
    await store.enqueueWebhook(orgId, "model.ready", "{}", "model.ready:1");
    const first = await store.claimWebhookDeliveries();
    expect(first).toHaveLength(1);
    expect(first[0]).toMatchObject({ url: "https://hooks.example.com/in", attempts: 1, event: "model.ready" });
    expect(await store.claimWebhookDeliveries()).toEqual([]); // held for two minutes
    await store.recordWebhookResult(first[0].id, { deliveredAt: nowIso(), lastStatus: 204, lastError: null, nextAttemptAt: null });
    const [d] = await store.listWebhookDeliveries(orgId);
    expect(toWebhookDeliveryDto(d)).toMatchObject({ state: "delivered", lastStatus: 204 });
  });

  it("can target a single address, and stops at a disabled one", async () => {
    await store.enqueueWebhook(orgId, "ping", "{}", "ping:1", endpointId);
    expect(await store.claimWebhookDeliveries()).toHaveLength(1);
    expect(await store.disableWebhookEndpoint("org_other", endpointId)).toBe(false);
    expect(await store.disableWebhookEndpoint(orgId, endpointId)).toBe(true);
    await store.enqueueWebhook(orgId, "model.ready", "{}", "model.ready:2");
    expect(await store.claimWebhookDeliveries()).toEqual([]);
  });

  it("customers cannot read the secret or the deliveries directly", async () => {
    await db.exec(`SET ROLE authenticated_tenant; SELECT set_config('app.current_user_id', '11111111-1111-4111-8111-111111111111', false);`);
    for (const t of ["webhook_endpoints", "webhook_deliveries"]) {
      expect((await db.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM public.${t}`)).rows[0].n).toBe(0);
      await expect(db.exec(`DELETE FROM public.${t}`)).rejects.toThrow(/permission denied/i);
    }
    await db.exec("RESET ROLE");
  });

  it("removes old finished deliveries and keeps what is still pending", async () => {
    const before = (await store.listWebhookDeliveries(orgId)).length;
    expect(before).toBeGreaterThan(0);
    await store.pruneWebhookDeliveries(new Date(Date.now() + 60_000).toISOString());
    expect((await store.listWebhookDeliveries(orgId)).length).toBeLessThan(before);
  });
});

describe("engine report on Postgres", () => {
  it("counts jobs, outcomes and approvals per engine, across workspaces", async () => {
    const db = new PGlite();
    await migrate(db);
    const store = createPostgresStore(pgliteClient(db), memoryBlobs());
    const a = (await store.signIn("a@example.com")).org.id;
    const b = (await store.signIn("b@example.com")).org.id;
    const glb = Buffer.from("glb");
    const ok = row(a, "ready");
    const bad = row(b, "failed");
    await store.insertReadyModel(a, ok, glb);
    await store.insertReadyModel(b, { ...bad, status: "ready" }, glb);
    await db.query("UPDATE public.models SET status = 'failed' WHERE id = $1", [bad.id]);
    await db.query("UPDATE public.models SET review_state = 'approved' WHERE id = $1", [ok.id]);
    await store.recordCost(a, ok.id, "sloyd", 0.27, "published");
    await store.recordCost(b, bad.id, "sloyd", 0.27, "published");
    expect(await store.engineStats()).toEqual([{ engineId: "sloyd", jobs: 2, ready: 1, failed: 1, approved: 1, rejected: 0, publishedUsd: 0.54 }]);
  });
});

describe("moving the local data to Postgres", () => {
  const t = "2026-11-01T10:00:00.000Z";
  const MODEL = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const VERSION = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const PROJECT = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
  const data: LocalData = {
    orgs: [{ id: "org_a", name: "A", createdAt: t }],
    users: [{ id: "usr_a", email: "a@example.com", orgId: "org_a", createdAt: t, profile: { useCase: "game", experience: "advanced", goal: "assets", activeWorkspace: "game", onboardedAt: t, skippedAt: null } }],
    projects: [{ id: PROJECT, orgId: "org_a", name: "Spring", createdAt: t }],
    models: [{ ...row("org_a", "ready"), id: MODEL, currentVersionId: VERSION, projectId: PROJECT, tags: ["red"], favorite: true, hasThumbnail: true, thumbnailExt: "png", deletedAt: null, createdAt: t, updatedAt: t }],
    ledger: [{ id: crypto.randomUUID(), orgId: "org_a", modelId: null, delta: 3, reason: "local_cap_grant", idempotencyKey: "grant:initial", createdAt: t }],
    versions: [{ id: VERSION, orgId: "org_a", modelId: MODEL, preset: "web", bytes: 10, sha256: "a".repeat(64), diagnostics: { triangles: 12 }, createdAt: t }],
    embeds: [{ id: crypto.randomUUID(), token: "t".repeat(40), orgId: "org_a", modelId: MODEL, allowedDomains: ["shop.example"], createdAt: t, revokedAt: null }],
    integrations: [{ orgId: "org_a", shop: "x.myshopify.com", accessTokenEnc: "enc", refreshTokenEnc: null, expiresAt: null, scopes: "write_files", connectedAt: t, revokedAt: null }],
    publications: [{ id: crypto.randomUUID(), orgId: "org_a", modelId: MODEL, checksum: "c", shop: "x.myshopify.com", productId: "gid://1", productTitle: "P", state: "published", remoteFileId: null, error: null, createdAt: t, updatedAt: t }],
    apiTokens: [{ id: crypto.randomUUID(), orgId: "org_a", name: "ci", tokenHash: "h".repeat(64), prefix: "os_abc", scopes: ["assets:read"], createdAt: t, lastUsedAt: null, revokedAt: null }],
    webhookEndpoints: [{ id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", orgId: "org_a", url: "https://hooks.example.com", secretEnc: "enc", createdAt: t, disabledAt: null }],
    webhookDeliveries: [{ id: crypto.randomUUID(), endpointId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", orgId: "org_a", event: "ping", dedupeKey: "k", payload: "{}", attempts: 1, nextAttemptAt: null, deliveredAt: t, lastStatus: 200, lastError: null, createdAt: t }],
  };

  it("carries every table, and running it twice changes nothing", async () => {
    const db = new PGlite();
    await migrate(db);
    const sql = pgliteClient(db);
    await copyRows(data, sql);
    await copyRows(data, sql);
    for (const table of ["organizations", "app_users", "projects", "models", "usage_ledger", "asset_versions", "embeds", "integrations", "publications", "api_tokens", "webhook_endpoints", "webhook_deliveries"]) {
      expect((await db.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM public.${table}`)).rows[0].n, table).toBe(1);
    }
    const store = createPostgresStore(sql, memoryBlobs());
    const model = await store.getModel("org_a", MODEL);
    expect(model).toMatchObject({ currentVersionId: VERSION, projectId: PROJECT, tags: ["red"], favorite: true, hasThumbnail: true });
    const profile = (await db.query<{ use_case: string; onboarded_at: unknown }>("SELECT use_case, onboarded_at FROM public.app_users")).rows[0];
    expect(profile.use_case).toBe("game");
    expect(profile.onboarded_at).not.toBeNull();
  });
});
