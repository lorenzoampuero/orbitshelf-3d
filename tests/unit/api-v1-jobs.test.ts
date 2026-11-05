import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as createJob } from "@/app/api/v1/jobs/route";
import { generateToken } from "@/lib/api-tokens";
import { createQuote } from "@/lib/quotes";
import { store } from "@/lib/store";

/** The switched-on path: E2E runs with API generation off, so it is covered here. */
describe("POST /api/v1/jobs when enabled", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "orbitshelf-v1-"));
  let n = 0;
  let providerCalls = 0;

  const ctx = {} as never;
  async function setup() {
    const { org } = await store.signIn(`v1-${++n}@example.com`);
    const { token, hash, prefix } = generateToken();
    await store.createApiToken({ id: crypto.randomUUID(), orgId: org.id, name: "t", tokenHash: hash, prefix, scopes: ["jobs:write"], createdAt: new Date().toISOString(), lastUsedAt: null, revokedAt: null });
    return { orgId: org.id, token };
  }
  const post = (token: string, key: string | null, body: unknown) =>
    createJob(new Request("http://x/api/v1/jobs", { method: "POST", headers: { Authorization: `Bearer ${token}`, ...(key ? { "Idempotency-Key": key } : {}) }, body: JSON.stringify(body) }), ctx);
  const body = (quoteId: string, extra: object = {}) => ({ quoteId, engineId: "sloyd", title: "Chair", category: "furniture", texture: "1k", prompt: "a wooden chair with arms", rightsAffirmed: true, ...extra });

  beforeEach(() => {
    process.env.DATA_DIR = path.join(root, "t" + ++n);
    process.env.API_GENERATION_ENABLED = "true";
    process.env.SESSION_SECRET = "unit-test-session-secret-32-characters-long";
    process.env.SLOYD_CLIENT_ID = "cid-0000";
    process.env.SLOYD_CLIENT_SECRET = "sec-0000-xxxx";
    process.env.LOCAL_PAID_ATTEMPT_CAP = "3";
    process.env.MAX_ACTIVE_JOBS_PER_ORG = "2";
    providerCalls = 0;
    vi.stubGlobal("fetch", (async (u: string | URL) => {
      if (String(u).endsWith("/jobs/text-to-3d")) {
        providerCalls += 1;
        return new Response(JSON.stringify({ jobId: `01JZQY4YJ7KV1GQZ9G6H6H2X${String(providerCalls).padStart(2, "0")}` }), { status: 200 });
      }
      return new Response("{}", { status: 404 });
    }) as unknown as typeof fetch);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    for (const k of ["API_GENERATION_ENABLED", "SLOYD_CLIENT_ID", "SLOYD_CLIENT_SECRET"]) delete process.env[k];
  });
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  const quote = (orgId: string) => {
    const q = createQuote(orgId, "sloyd", { mode: "text", photoCount: 0, texture: "1k" });
    if (!q.ok) throw new Error("expected a quote");
    return q.quote.id;
  };

  it("starts a job against the same balance as the web, and a retry with the same key does not pay twice", async () => {
    const { orgId, token } = await setup();
    const first = await post(token, "key-12345678", body(quote(orgId)));
    expect(first.status).toBe(202);
    const retry = await post(token, "key-12345678", body(quote(orgId)));
    expect(retry.status).toBe(200);
    expect((await retry.json()).duplicate).toBe(true);
    expect(providerCalls).toBe(1);
    expect((await store.usage(orgId)).balance).toBe(2);
  });

  it("requires an idempotency key, a valid quote for this workspace, and either a prompt or images", async () => {
    const { orgId, token } = await setup();
    const other = await setup();
    expect((await post(token, null, body(quote(orgId)))).status).toBe(422);
    expect((await post(token, "key-12345678", body("forged.quote"))).status).toBe(409);
    expect((await post(token, "key-12345678", body(quote(other.orgId)))).status).toBe(409);
    expect((await post(token, "key-12345678", body(quote(orgId), { prompt: undefined }))).status).toBe(422);
    expect((await post(token, "key-12345678", body(quote(orgId), { rightsAffirmed: false }))).status).toBe(422);
    expect(providerCalls).toBe(0);
    expect((await store.usage(orgId)).balance).toBe(3);
  });

  it("stops when the balance runs out", async () => {
    process.env.LOCAL_PAID_ATTEMPT_CAP = "1";
    const { orgId, token } = await setup();
    expect((await post(token, "key-aaaaaaaa", body(quote(orgId)))).status).toBe(202);
    const refused = await post(token, "key-bbbbbbbb", body(quote(orgId)));
    expect(refused.status).toBe(402);
    expect(providerCalls).toBe(1);
  });

  it("stays off when the server has not enabled it, whatever the token", async () => {
    delete process.env.API_GENERATION_ENABLED;
    const { orgId, token } = await setup();
    const res = await post(token, "key-12345678", body(quote(orgId)));
    expect(res.status).toBe(503);
    expect(providerCalls).toBe(0);
  });
});
