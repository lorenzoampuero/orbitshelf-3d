import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import type { ProviderConfig } from "@/lib/env";
import { createDemoModel, createProviderModel, refreshJob } from "@/lib/jobs";
import { validateAndNormalizeImage } from "@/lib/image";
import { store } from "@/lib/store";

const config: ProviderConfig = { clientId: "cid-0000", clientSecret: "sec-0000-xxxx", apiBase: "https://p.test/api", resultBase: "https://r.test/jobs/" };
const glb = readFileSync(path.join(process.cwd(), "public", "demo", "lamp.glb"));
const JOB = "01JZQY4YJ7KV1GQZ9G6H6H2X25";
const tmpRoot = mkdtempSync(path.join(os.tmpdir(), "orbitshelf-unit-"));
let n = 0;

async function image() {
  const buf = await sharp({ create: { width: 512, height: 512, channels: 3, background: "#cc8844" } }).jpeg().toBuffer();
  return validateAndNormalizeImage({ buffer: buf, declaredMime: "image/jpeg" });
}
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
type Route = (url: string, init?: RequestInit) => Response | Promise<Response>;
const fake = (route: Route) => ({ config, fetch: ((u: string | URL | Request, i?: RequestInit) => Promise.resolve(route(String(u), i))) as unknown as typeof fetch });

beforeEach(() => {
  process.env.DATA_DIR = path.join(tmpRoot, "t" + ++n);
  process.env.LOCAL_PAID_ATTEMPT_CAP = "3";
  process.env.MAX_ACTIVE_JOBS_PER_ORG = "2";
});
afterAll(() => rmSync(tmpRoot, { recursive: true, force: true }));

const input = async (key: string | null = null) => ({ title: "Vase", sku: "SKU-1", category: "home-decor" as const, textureResolution: "1k" as const, idempotencyKey: key, image: await image() });

describe("workspaces and demo models", () => {
  it("signs in once per email, grants the local cap once, and isolates tenants", async () => {
    const a1 = await store.signIn("a@example.com");
    const a2 = await store.signIn("A@Example.com ");
    expect(a2.org.id).toBe(a1.org.id);
    expect((await store.usage(a1.org.id)).balance).toBe(3);
    const b = await store.signIn("b@example.com");
    expect(b.org.id).not.toBe(a1.org.id);

    const m = await createDemoModel(a1.org.id, { title: "Vase", sku: null, category: "home-decor", demoAsset: "vase" });
    expect(m.provenance).toBe("demo-sample");
    expect(m.status).toBe("ready");
    expect(await store.getModel(b.org.id, m.id)).toBeNull();
    expect(await store.readGlb(b.org.id, m.id)).toBeNull();
    expect(await store.deleteModel(b.org.id, m.id)).toBe(false);
    expect((await store.listModels(b.org.id)).length).toBe(0);
    expect((await store.readGlb(a1.org.id, m.id))?.subarray(0, 4).toString()).toBe("glTF");
    expect((await store.usage(a1.org.id)).balance).toBe(3); // demo is free
  });

  it("deletes the GLB file with the model but keeps the ledger", async () => {
    const { org } = await store.signIn("c@example.com");
    const m = await createDemoModel(org.id, { title: "x", sku: null, category: "other", demoAsset: "chair" });
    const file = path.join(process.env.DATA_DIR!, "files", org.id, `${m.id}.glb`);
    expect(existsSync(file)).toBe(true);
    expect(await store.deleteModel(org.id, m.id)).toBe(true);
    expect(existsSync(file)).toBe(false);
    expect((await store.usage(org.id)).ledger.length).toBe(1);
  });
});

describe("provider job lifecycle (fake provider)", () => {
  it("reserves → debits once → stores provider job id; idempotency key prevents duplicate debits", async () => {
    const { org } = await store.signIn("d@example.com");
    const deps = fake((u) => (u.endsWith("/jobs/image-to-3d") ? json(200, { jobId: JOB }) : json(404, {})));
    const first = await createProviderModel(org.id, await input("idem-1"), deps);
    expect(first.ok).toBe(true);
    const again = await createProviderModel(org.id, await input("idem-1"), deps);
    expect(again.ok && again.duplicate).toBe(true);
    expect((await store.usage(org.id)).debited).toBe(1);
    expect((await store.listModels(org.id)).length).toBe(1);
    const row = await store.getModel(org.id, first.ok ? first.model.id : "");
    expect(row?.providerJobId).toBe(JOB);
    expect(row?.status).toBe("processing");
    expect(row?.rightsAffirmed).toBe(true);
  });

  it("HTTP 402 at creation: no job, attempt refunded, failure code payment_required", async () => {
    const { org } = await store.signIn("e@example.com");
    const r = await createProviderModel(org.id, await input(), fake(() => json(402, { available: 3, error: "Payment Required", message: "Insufficient API credits", required: 20 })));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.code).toBe("payment_required");
    expect(r.httpStatus).toBe(402);
    expect(r.model?.status).toBe("failed");
    const u = await store.usage(org.id);
    expect(u.balance).toBe(3);
    expect(u.refunded).toBe(1);
  });

  it("ambiguous failures (timeout / 5xx) are NOT refunded automatically", async () => {
    const { org } = await store.signIn("f@example.com");
    const r = await createProviderModel(org.id, await input(), fake(() => json(500, { message: "boom" })));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.code).toBe("ambiguous");
    expect((await store.usage(org.id)).balance).toBe(2);
  });

  it("refuses when the local attempt cap is exhausted and when too many jobs are active", async () => {
    process.env.LOCAL_PAID_ATTEMPT_CAP = "2";
    process.env.MAX_ACTIVE_JOBS_PER_ORG = "5";
    const { org } = await store.signIn("g@example.com");
    const deps = fake(() => json(200, { jobId: JOB }));
    expect((await createProviderModel(org.id, await input(), deps)).ok).toBe(true);
    expect((await createProviderModel(org.id, await input(), deps)).ok).toBe(true);
    const third = await createProviderModel(org.id, await input(), deps);
    expect(third.ok).toBe(false);
    if (!third.ok) expect(third.code).toBe("insufficient_attempts");

    process.env.MAX_ACTIVE_JOBS_PER_ORG = "1";
    process.env.LOCAL_PAID_ATTEMPT_CAP = "9";
    const h = await store.signIn("h@example.com");
    expect((await createProviderModel(h.org.id, await input(), deps)).ok).toBe(true);
    const blocked = await createProviderModel(h.org.id, await input(), deps);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.code).toBe("too_many_active");
      expect(blocked.httpStatus).toBe(429);
    }
  });

  it("concurrent reservations can never overdraw the ledger", async () => {
    process.env.LOCAL_PAID_ATTEMPT_CAP = "2";
    process.env.MAX_ACTIVE_JOBS_PER_ORG = "5";
    const { org } = await store.signIn("i@example.com");
    const deps = fake(() => json(200, { jobId: JOB }));
    const imgs = await Promise.all(Array.from({ length: 6 }, () => input()));
    const results = await Promise.all(imgs.map((i) => createProviderModel(org.id, i, deps)));
    expect(results.filter((r) => r.ok).length).toBe(2);
    const u = await store.usage(org.id);
    expect(u.balance).toBe(0);
    expect(u.debited).toBe(2);
  });

  it("success → downloads, validates and stores a private GLB; repeated refresh is idempotent", async () => {
    const { org } = await store.signIn("j@example.com");
    const state = { polls: 0 };
    const deps = fake((u) => {
      if (u.endsWith("/jobs/image-to-3d")) return json(200, { jobId: JOB });
      if (u.includes(`/jobs/${JOB}.glb`)) return new Response(new Uint8Array(glb), { status: 200 });
      if (u.endsWith(`/jobs/${JOB}`)) return json(200, { status: ++state.polls < 3 ? "running" : "success" });
      return json(404, {});
    });
    const created = await createProviderModel(org.id, await input(), deps);
    if (!created.ok) throw new Error("create failed");
    const id = created.model.id;
    expect((await refreshJob(org.id, id, deps))?.status).toBe("processing");
    expect((await refreshJob(org.id, id, deps))?.jobState).toBe("running");
    const done = await refreshJob(org.id, id, deps);
    expect(done?.status).toBe("ready");
    expect(done?.checksum).toMatch(/^[a-f0-9]{64}$/);
    expect((await store.readGlb(org.id, id))?.equals(glb)).toBe(true);
    expect((await refreshJob(org.id, id, deps))?.status).toBe("ready");
    expect(state.polls).toBe(3); // no extra provider calls after completion
    expect((await store.usage(org.id)).balance).toBe(2);
  });

  it("provider error status → failed + automatic refund (once)", async () => {
    const { org } = await store.signIn("k@example.com");
    const deps = fake((u) => (u.endsWith("/jobs/image-to-3d") ? json(200, { jobId: JOB }) : json(200, { status: "failed", errorMessage: "model crashed" })));
    const c = await createProviderModel(org.id, await input(), deps);
    if (!c.ok) throw new Error("create failed");
    const a = await refreshJob(org.id, c.model.id, deps);
    expect(a?.status).toBe("failed");
    expect(a?.error).toBe("model crashed");
    expect(a?.failureCode).toBe("provider_error");
    await refreshJob(org.id, c.model.id, deps);
    await store.refundJob(org.id, c.model.id, "manual double refund attempt");
    const u = await store.usage(org.id);
    expect(u.refunded).toBe(1);
    expect(u.balance).toBe(3);
  });

  it("corrupt GLB from the provider is rejected, never stored, not auto-refunded", async () => {
    const { org } = await store.signIn("l@example.com");
    const bad = Buffer.from(glb);
    bad.write("XXXX", 0);
    const deps = fake((u) => {
      if (u.endsWith("/jobs/image-to-3d")) return json(200, { jobId: JOB });
      if (u.includes(".glb")) return new Response(new Uint8Array(bad), { status: 200 });
      return json(200, { status: "success" });
    });
    const c = await createProviderModel(org.id, await input(), deps);
    if (!c.ok) throw new Error("create failed");
    const r = await refreshJob(org.id, c.model.id, deps);
    expect(r?.status).toBe("failed");
    expect(r?.failureCode).toBe("invalid_output");
    expect(await store.readGlb(org.id, c.model.id)).toBeNull();
    expect((await store.usage(org.id)).balance).toBe(2);
  });

  it("success but file not yet published (404) stays processing", async () => {
    const { org } = await store.signIn("m@example.com");
    const deps = fake((u) => (u.endsWith("/jobs/image-to-3d") ? json(200, { jobId: JOB }) : u.includes(".glb") ? new Response("", { status: 404 }) : json(200, { status: "success" })));
    const c = await createProviderModel(org.id, await input(), deps);
    if (!c.ok) throw new Error("create failed");
    const r = await refreshJob(org.id, c.model.id, deps);
    expect(r?.status).toBe("processing");
    expect(r?.lastPollError).toMatch(/not available/);
  });

  it("another tenant cannot refresh or see the job", async () => {
    const a = await store.signIn("n1@example.com");
    const b = await store.signIn("n2@example.com");
    const deps = fake(() => json(200, { jobId: JOB, status: "success" }));
    const c = await createProviderModel(a.org.id, await input(), deps);
    if (!c.ok) throw new Error("create failed");
    expect(await refreshJob(b.org.id, c.model.id, deps)).toBeNull();
  });
});
