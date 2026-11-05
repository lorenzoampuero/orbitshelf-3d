import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { pgClient } from "@/lib/sql";
import { createPostgresStore } from "@/lib/store-postgres";
import { emptyChecklist, emptyDimensions, nowIso, type ModelRow } from "@/lib/store-shared";
import { randomUUID } from "node:crypto";
import { memoryBlobs } from "./sql-client";

/**
 * Real connections competing for the same balance, which PGlite cannot do. Runs only against a throwaway database:
 *   TEST_DATABASE_URL=postgres://... npx vitest run tests/db/real-postgres.test.ts
 * It creates the schema if it is missing. Never point it at production.
 */
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("lock contention on a real Postgres", () => {
  it("20 simultaneous requests never spend more than the balance", async () => {
    process.env.LOCAL_PAID_ATTEMPT_CAP = "3";
    process.env.MAX_ACTIVE_JOBS_PER_ORG = "5";
    const sql = pgClient(url!);
    const exists = await sql.query("SELECT to_regclass('public.models') AS t");
    if (!exists.rows[0].t) await sql.query(await readFile(path.join(process.cwd(), "supabase", "migrations", "0001_init.sql"), "utf8"));

    const store = createPostgresStore(sql, memoryBlobs());
    const { org } = await store.signIn(`race-${randomUUID()}@example.test`);
    const row = (): ModelRow => {
      const t = nowIso();
      return {
        id: randomUUID(), orgId: org.id, title: "Race", sku: null, category: "other", source: "ai", provenance: "ai-generated", engineId: "sloyd", estimatedCostUsd: 0, inputKind: "text",
        sourceViews: [], prompt: null, demoAsset: null, status: "processing", jobState: "reserved", providerJobRef: null, providerJobId: null, providerJobUrls: null, idempotencyKey: null, error: null,
        failureCode: null, attemptsDebited: 0, attemptsRefunded: 0, providerCreditsEstimate: 0, textureResolution: "1k", reviewState: "pending", checklist: emptyChecklist(), reviewNote: null,
        reviewedAt: null, dimensions: emptyDimensions(), fileSize: null, checksum: null, stalled: false, rightsAffirmed: true, hasSourceImage: false, sourceImageExt: null, extraImages: [],
        sourceImageSha256: null, nextPollAt: null, pollCount: 0, lastPolledAt: null, lastPollError: null, createdAt: t, updatedAt: t,
      };
    };
    const results = await Promise.all(Array.from({ length: 20 }, () => store.reserveProviderJob(org.id, row(), [])));
    expect(results.filter((r) => r.ok)).toHaveLength(3);
    const usage = await store.usage(org.id);
    expect(usage.balance).toBe(0);
    expect(usage.debited).toBe(3);
  }, 60_000);
});
