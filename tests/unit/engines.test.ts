import { generateKeyPairSync, sign as edSign, createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FalConfig } from "@/lib/env";
import { validateAndNormalizeImage } from "@/lib/image";
import { createProviderModel, refreshJob } from "@/lib/jobs";
import { falAdapter, isAllowedResultUrl, verifyFalWebhook } from "@/lib/provider/fal";
import { allEngines, availableEngines, capabilityProblem, engineEnabled, getEngine, priceOf } from "@/lib/provider/registry";
import { checkQuote, createQuote } from "@/lib/quotes";
import { store, toDto } from "@/lib/store";

const fal: FalConfig = { key: "fal-secret-key-xyz", queueBase: "https://queue.test", resultHosts: ["fal.media"], allowInsecureResultHosts: false };
const glb = readFileSync(path.join(process.cwd(), "public", "demo", "lamp.glb"));
const REQ = "764cabcf-b745-4b3e-ae38-1200304cf45b";
const tmpRoot = mkdtempSync(path.join(os.tmpdir(), "orbitshelf-engines-"));
let n = 0;

async function image() {
  const buf = await sharp({ create: { width: 512, height: 512, channels: 3, background: "#cc8844" } }).jpeg().toBuffer();
  return validateAndNormalizeImage({ buffer: buf, declaredMime: "image/jpeg" });
}

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
type Seen = { url: string; init?: RequestInit };

/** A fake of fal's documented queue: status and result live under owner/app, not under the full model id. */
function fakeFal(opts: { outcome?: "ok" | "error"; glbUrl?: string; submitStatus?: number } = {}) {
  const seen: Seen[] = [];
  const base = `https://queue.test/fal-ai/hyper3d/requests/${REQ}`;
  const f = ((u: string | URL | Request, init?: RequestInit) => {
    const url = String(u);
    seen.push({ url, init });
    if (url === "https://queue.test/fal-ai/hyper3d/rodin/v2.5") {
      if (opts.submitStatus) return Promise.resolve(json(opts.submitStatus, { detail: "nope" }));
      return Promise.resolve(json(200, { request_id: REQ, status_url: `${base}/status`, response_url: base, cancel_url: `${base}/cancel` }));
    }
    if (url === `${base}/status`) return Promise.resolve(json(200, opts.outcome === "error" ? { status: "COMPLETED", error: "boom" } : { status: "COMPLETED" }));
    if (url === base) return Promise.resolve(json(200, { model_mesh: { url: opts.glbUrl ?? "https://v3.fal.media/files/m.glb" } }));
    if (url.includes("fal.media")) return Promise.resolve(new Response(new Uint8Array(glb), { status: 200 }));
    return Promise.resolve(json(404, {}));
  }) as unknown as typeof fetch;
  return { seen, deps: { fetch: f, falConfig: fal } };
}

beforeEach(() => {
  process.env.DATA_DIR = path.join(tmpRoot, "t" + ++n);
  process.env.LOCAL_PAID_ATTEMPT_CAP = "3";
  process.env.BILLING_UNIT = "attempts"; // these tests are about flat attempts; the product default is credits
  process.env.MAX_ACTIVE_JOBS_PER_ORG = "2";
  process.env.SESSION_SECRET = "unit-test-session-secret-32-characters-long";
});
afterEach(() => {
  delete process.env.ENGINES_ENABLED;
  delete process.env.ENGINES_DISABLED;
  delete process.env.FAL_KEY;
});
afterAll(() => rmSync(tmpRoot, { recursive: true, force: true }));

describe("engine registry", () => {
  it("keeps every fal engine disabled: none has been validated with real money", () => {
    for (const e of allEngines().filter((x) => x.provider === "fal")) expect(e.lifecycle).toBe("disabled");
    expect(availableEngines({ falConfig: fal, config: null })).toEqual([]);
  });

  it("offers a piloted engine only with credentials, and the kill switch always wins", () => {
    process.env.ENGINES_ENABLED = "fal-rodin-2.5";
    expect(availableEngines({ falConfig: null, config: null })).toEqual([]);
    expect(availableEngines({ falConfig: fal, config: null }).map((e) => e.id)).toEqual(["fal-rodin-2.5"]);
    process.env.ENGINES_DISABLED = "fal-rodin-2.5";
    expect(engineEnabled(getEngine("fal-rodin-2.5")!)).toBe(false);
  });

  it("prices match what was read at each provider's page", () => {
    const usd = (id: string, q: Parameters<typeof priceOf>[1]) => priceOf(getEngine(id)!, q).usd;
    // Hunyuan Pro: +0.15 for face_count, which the adapter always sends (vendor add-on, priced in until an invoice says otherwise).
    expect(usd("fal-hunyuan-3.1-pro", { mode: "image", photoCount: 1, texture: "none" })).toBe(0.525);
    expect(usd("fal-hunyuan-3.1-pro", { mode: "image", photoCount: 1, texture: "1k" })).toBe(0.675);
    expect(usd("fal-hunyuan-3.1-pro", { mode: "multi-image", photoCount: 3, texture: "1k" })).toBe(0.825);
    expect(usd("fal-rodin-2.5", { mode: "multi-image", photoCount: 4, texture: "1k" })).toBe(0.4);
    expect(usd("fal-tripo-h3.1", { mode: "image", photoCount: 1, texture: "none" })).toBe(0.2);
    expect(usd("fal-tripo-h3.1", { mode: "image", photoCount: 1, texture: "1k" })).toBe(0.3);
    expect(usd("fal-tripo-h3.1", { mode: "image", photoCount: 1, texture: "2k" })).toBe(0.4);
    expect(usd("fal-trellis-2", { mode: "image", photoCount: 1, texture: "1k" })).toBe(0.3);
    expect(usd("sloyd", { mode: "image", photoCount: 1, texture: "1k" })).toBeCloseTo(20 / 75, 3);
    expect(usd("sloyd", { mode: "multi-image", photoCount: 3, texture: "1k" })).toBe(0.4);
    expect(usd("sloyd", { mode: "text", photoCount: 0, texture: "1k" })).toBeCloseTo(25 / 75, 3);
  });

  it("refuses what an engine cannot do instead of quietly reducing it", () => {
    const tripo = getEngine("fal-tripo-h3.1")!;
    expect(capabilityProblem(tripo, { mode: "text", photoCount: 0, texture: "1k" })).toBe("mode");
    expect(capabilityProblem(tripo, { mode: "multi-image", photoCount: 3, texture: "1k" })).toBe("mode");
    expect(capabilityProblem(getEngine("fal-trellis-2")!, { mode: "image", photoCount: 1, texture: "none" })).toBe("texture");
    expect(capabilityProblem(getEngine("sloyd")!, { mode: "multi-image", photoCount: 5, texture: "1k" })).toBe("photos");
    expect(capabilityProblem(getEngine("sloyd")!, { mode: "multi-image", photoCount: 3, texture: "1k" })).toBeNull();
  });
});

describe("quotes", () => {
  const q = { mode: "image" as const, photoCount: 1, texture: "1k" as const };

  it("refuses to quote a disabled engine", () => {
    expect(createQuote("org", "fal-rodin-2.5", q)).toEqual({ ok: false, code: "engine_unavailable" });
  });

  it("is valid only for the same workspace, engine, options and within its time", () => {
    const r = createQuote("org", "sloyd", q, 1000);
    if (!r.ok) throw new Error("expected a quote");
    expect(r.quote.evidence).toBe("published");
    expect(checkQuote(r.quote.id, "org", "sloyd", q, 2000)).toBe("ok");
    expect(checkQuote(r.quote.id, "other", "sloyd", q, 2000)).toBe("invalid");
    expect(checkQuote(r.quote.id, "org", "sloyd", { ...q, texture: "2k" }, 2000)).toBe("mismatch"); // same price, but not what was quoted
    expect(checkQuote(r.quote.id, "org", "sloyd", { ...q, texture: "none" }, 2000)).toBe("mismatch");
    expect(checkQuote(r.quote.id, "org", "sloyd", q, 1000 + 16 * 60_000)).toBe("expired");
  });

  it("rejects a tampered quote", () => {
    const r = createQuote("org", "sloyd", q);
    if (!r.ok) throw new Error("expected a quote");
    const [body, sig] = r.quote.id.split(".");
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, "base64url").toString()), u: 0.01 })).toString("base64url");
    expect(checkQuote(`${forged}.${sig}`, "org", "sloyd", q)).toBe("invalid");
  });
});

describe("fal adapter", () => {
  const rodin = () => getEngine("fal-rodin-2.5")!;

  it("sends the key only to the queue host and uses the URLs fal returns", async () => {
    process.env.ENGINES_ENABLED = "fal-rodin-2.5";
    const { org } = await store.signIn("fal1@example.com");
    const { seen, deps } = fakeFal();
    const r = await createProviderModel(
      org.id,
      { title: "Chair", sku: null, category: "furniture", textureResolution: "1k", idempotencyKey: null, engineId: "fal-rodin-2.5", source: { kind: "multi-image", images: { front: await image(), back: await image() } } },
      deps,
    );
    if (!r.ok) throw new Error(r.message);
    expect(r.model.engineId).toBe("fal-rodin-2.5");
    expect(r.model.estimatedCostUsd).toBe(0.4);
    expect(r.model.jobState).toBe("queued");
    expect(toDto(r.model)).not.toHaveProperty("providerJobUrls");

    const body = JSON.parse(String(seen[0].init?.body)) as { image_urls: string[]; geometry_file_format: string };
    expect(body.image_urls).toHaveLength(2);
    expect(body.image_urls[0]).toMatch(/^data:image\/jpeg;base64,/);
    expect(body.geometry_file_format).toBe("glb");

    const done = await refreshJob(org.id, r.model.id, deps);
    expect(done?.status).toBe("ready");
    expect(done?.jobState).toBe("succeeded");

    const download = seen.find((s) => s.url.includes("fal.media"))!;
    expect(new Headers(download.init?.headers).get("authorization")).toBeNull();
    for (const s of seen.filter((x) => x.url.startsWith("https://queue.test"))) expect(new Headers(s.init?.headers).get("authorization")).toBe(`Key ${fal.key}`);

    expect((await store.listJobEvents(org.id, r.model.id)).map((e) => e.state)).toEqual(["reserved", "queued", "processing", "succeeded"]);
    expect(await store.listCostEvents(org.id)).toMatchObject([{ engineId: "fal-rodin-2.5", usd: 0.4, evidence: "published" }]);
  });

  it("refunds a provider failure, and records a cost because the provider had accepted the job", async () => {
    process.env.ENGINES_ENABLED = "fal-rodin-2.5";
    const { org } = await store.signIn("fal2@example.com");
    const { deps } = fakeFal({ outcome: "error" });
    const r = await createProviderModel(org.id, { title: "X", sku: null, category: "other", textureResolution: "1k", idempotencyKey: null, engineId: "fal-rodin-2.5", source: { kind: "image", image: await image() } }, deps);
    if (!r.ok) throw new Error(r.message);
    const failed = await refreshJob(org.id, r.model.id, deps);
    expect(failed?.status).toBe("failed");
    expect(failed?.jobState).toBe("failed");
    expect((await store.usage(org.id)).balance).toBe(3);
    expect(await store.listCostEvents(org.id)).toHaveLength(1);
  });

  it("does not charge or record a cost when the provider refuses the job", async () => {
    process.env.ENGINES_ENABLED = "fal-rodin-2.5";
    const { org } = await store.signIn("fal3@example.com");
    const { deps } = fakeFal({ submitStatus: 422 });
    const r = await createProviderModel(org.id, { title: "X", sku: null, category: "other", textureResolution: "1k", idempotencyKey: null, engineId: "fal-rodin-2.5", source: { kind: "image", image: await image() } }, deps);
    expect(r.ok).toBe(false);
    expect((await store.usage(org.id)).balance).toBe(3);
    expect(await store.listCostEvents(org.id)).toHaveLength(0);
  });

  it("will not call a disabled engine and debits nothing", async () => {
    const { org } = await store.signIn("fal4@example.com");
    const { seen, deps } = fakeFal();
    const r = await createProviderModel(org.id, { title: "X", sku: null, category: "other", textureResolution: "1k", idempotencyKey: null, engineId: "fal-rodin-2.5", source: { kind: "image", image: await image() } }, deps);
    expect(r).toMatchObject({ ok: false, code: "engine_unavailable" });
    expect(seen).toHaveLength(0);
    expect((await store.usage(org.id)).balance).toBe(3);
  });

  it("refuses a request the engine cannot honour and debits nothing", async () => {
    process.env.ENGINES_ENABLED = "fal-tripo-h3.1";
    const { org } = await store.signIn("fal5@example.com");
    const { seen, deps } = fakeFal();
    const r = await createProviderModel(org.id, { title: "X", sku: null, category: "other", textureResolution: "1k", idempotencyKey: null, engineId: "fal-tripo-h3.1", source: { kind: "multi-image", images: { front: await image(), back: await image() } } }, deps);
    expect(r).toMatchObject({ ok: false, code: "engine_unsupported" });
    expect(seen).toHaveLength(0);
    expect((await store.usage(org.id)).balance).toBe(3);
  });

  it("rejects queue URLs on another host, so the key cannot be sent elsewhere", async () => {
    const f = (() => Promise.resolve(json(200, { request_id: REQ, status_url: "https://evil.test/s", response_url: "https://evil.test/r" }))) as unknown as typeof fetch;
    await expect(falAdapter.submit(rodin(), { source: { kind: "image", image: await image() }, textureResolution: "1k" }, { fetch: f, falConfig: fal })).rejects.toMatchObject({ kind: "invalid_response" });
    await expect(falAdapter.getStatus(rodin(), { jobId: REQ, urls: { status: "https://evil.test/s", response: "https://evil.test/r" } }, { fetch: f, falConfig: fal })).rejects.toMatchObject({ kind: "rejected" });
  });

  it("only downloads results over https from an allowed host", () => {
    expect(isAllowedResultUrl("https://v3.fal.media/files/a.glb", fal)).toBe(true);
    expect(isAllowedResultUrl("https://fal.media/a.glb", fal)).toBe(true);
    expect(isAllowedResultUrl("http://v3.fal.media/a.glb", fal)).toBe(false);
    expect(isAllowedResultUrl("https://fal.media.evil.test/a.glb", fal)).toBe(false);
    expect(isAllowedResultUrl("https://evilfal.media/a.glb", fal)).toBe(false);
    expect(isAllowedResultUrl("https://user:pw@fal.media/a.glb", fal)).toBe(false);
    expect(isAllowedResultUrl("https://169.254.169.254/latest", fal)).toBe(false);
    expect(isAllowedResultUrl("not a url", fal)).toBe(false);
  });

  it("marks a disallowed result location for human review instead of fetching it", async () => {
    process.env.ENGINES_ENABLED = "fal-rodin-2.5";
    const { org } = await store.signIn("fal6@example.com");
    const { seen, deps } = fakeFal({ glbUrl: "https://169.254.169.254/latest/meta-data" });
    const r = await createProviderModel(org.id, { title: "X", sku: null, category: "other", textureResolution: "1k", idempotencyKey: null, engineId: "fal-rodin-2.5", source: { kind: "image", image: await image() } }, deps);
    if (!r.ok) throw new Error(r.message);
    const out = await refreshJob(org.id, r.model.id, deps);
    expect(out?.jobState).toBe("needs_review");
    expect(seen.some((s) => s.url.includes("169.254"))).toBe(false);
  });
});

describe("fal webhook signature", () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const x = (publicKey.export({ format: "jwk" }) as { x: string }).x;
  const rawBody = Buffer.from(JSON.stringify({ request_id: REQ, status: "OK" }));

  function signed(overrides: Partial<{ requestId: string; userId: string; timestamp: string }> = {}) {
    const requestId = overrides.requestId ?? REQ;
    const userId = overrides.userId ?? "user-1";
    const timestamp = overrides.timestamp ?? "1800000000";
    const msg = [requestId, userId, timestamp, createHash("sha256").update(rawBody).digest("hex")].join("\n");
    return { requestId, userId, timestamp, signature: edSign(null, Buffer.from(msg), privateKey).toString("hex"), rawBody, keys: [{ x }], nowSeconds: 1800000000 };
  }

  it("accepts a correctly signed delivery", () => {
    expect(verifyFalWebhook(signed())).toBe(true);
  });

  it("tries each key until one verifies", () => {
    const other = generateKeyPairSync("ed25519").publicKey.export({ format: "jwk" }) as { x: string };
    expect(verifyFalWebhook({ ...signed(), keys: [{ x: other.x }, { x }] })).toBe(true);
  });

  it("rejects a changed body, a changed id, an old timestamp and missing headers", () => {
    expect(verifyFalWebhook({ ...signed(), rawBody: Buffer.from("{}") })).toBe(false);
    expect(verifyFalWebhook({ ...signed(), requestId: "other-request" })).toBe(false);
    expect(verifyFalWebhook({ ...signed(), nowSeconds: 1800000000 + 301 })).toBe(false);
    expect(verifyFalWebhook({ ...signed(), signature: null })).toBe(false);
    expect(verifyFalWebhook({ ...signed(), keys: [] })).toBe(false);
  });
});

describe("existing data", () => {
  it("reads rows saved before the multi-engine version", async () => {
    const { org } = await store.signIn("legacy@example.com");
    const { deps } = fakeFal();
    process.env.ENGINES_ENABLED = "fal-rodin-2.5";
    const r = await createProviderModel(org.id, { title: "X", sku: null, category: "other", textureResolution: "1k", idempotencyKey: null, engineId: "fal-rodin-2.5", source: { kind: "image", image: await image() } }, deps);
    if (!r.ok) throw new Error(r.message);
    const file = path.join(process.env.DATA_DIR!, "db.json");
    const { writeFileSync } = await import("node:fs");
    const db = JSON.parse(readFileSync(file, "utf8"));
    Object.assign(db.models[0], { source: "sloyd", engineId: undefined, jobState: "success", status: "ready" });
    delete db.jobEvents;
    delete db.costEvents;
    writeFileSync(file, JSON.stringify(db));
    const row = (await store.getModel(org.id, r.model.id))!;
    expect(row.source).toBe("ai");
    expect(row.engineId).toBe("sloyd");
    expect(row.jobState).toBe("succeeded");
  });
});
