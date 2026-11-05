import { readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import type { MeshyConfig } from "@/lib/env";
import { validateAndNormalizeImage } from "@/lib/image";
import { meshyAdapter } from "@/lib/provider/meshy";
import { allEngines, availableEngines, capabilityProblem, getEngine, priceOf } from "@/lib/provider/registry";
import { ProviderError } from "@/lib/provider/types";

const glb = readFileSync(path.join(process.cwd(), "public", "demo", "lamp.glb"));
const image = async () => validateAndNormalizeImage({ buffer: await sharp({ create: { width: 512, height: 512, channels: 3, background: "#884422" } }).jpeg().toBuffer(), declaredMime: "image/jpeg" });
const usd = (id: string, texture: "none" | "1k" | "2k" = "1k", photoCount = 1) => priceOf(getEngine(id)!, { mode: photoCount > 1 ? "multi-image" : "image", photoCount, texture }).usd;

describe("engines added from the published documentation", () => {
  it("every engine but Sloyd stays off, whichever provider it uses", () => {
    for (const e of allEngines().filter((x) => x.id !== "sloyd")) expect(e.lifecycle, e.id).toBe("disabled");
    expect(availableEngines({ falConfig: { key: "k", queueBase: "https://q.test", resultHosts: [], allowInsecureResultHosts: false }, meshyConfig: { key: "k", apiBase: "https://m.test", resultHosts: [], allowInsecureResultHosts: false }, config: null })).toEqual([]);
  });

  it("prices match what was read at each page", () => {
    expect(usd("fal-rodin-2.5-fast")).toBe(0.1);
    expect(usd("fal-rodin-2.5-fast", "1k", 4)).toBe(0.1);
    expect(usd("fal-hunyuan-3.1-rapid", "none")).toBe(0.225);
    expect(usd("fal-hunyuan-3.1-rapid")).toBe(0.375);
    expect(usd("fal-trellis-1")).toBe(0.02);
    expect(usd("meshy-7.1", "none")).toBe(0.4);
    expect(usd("meshy-7.1")).toBe(0.6);
  });

  it("refuses what these engines cannot do", () => {
    expect(capabilityProblem(getEngine("fal-hunyuan-3.1-rapid")!, { mode: "multi-image", photoCount: 2, texture: "1k" })).toBe("mode");
    expect(capabilityProblem(getEngine("fal-trellis-1")!, { mode: "image", photoCount: 1, texture: "none" })).toBe("texture");
    expect(capabilityProblem(getEngine("meshy-7.1")!, { mode: "text", photoCount: 0, texture: "1k" })).toBe("mode");
  });

  it("asks each endpoint for what its page documents", async () => {
    const front = await image();
    const req = (t: "none" | "1k" | "2k") => ({ source: { kind: "image" as const, image: front }, textureResolution: t });
    expect(getEngine("fal-rodin-2.5-fast")!.fal!.buildInput(req("none"))).toMatchObject({ geometry_file_format: "glb", material: "None" });
    expect(getEngine("fal-hunyuan-3.1-rapid")!.fal!.buildInput(req("none"))).toMatchObject({ enable_geometry: true, enable_pbr: false });
    expect(getEngine("fal-hunyuan-3.1-rapid")!.fal!.buildInput(req("1k"))).toMatchObject({ enable_geometry: false, enable_pbr: true });
    expect(getEngine("fal-trellis-1")!.fal!.buildInput(req("2k"))).toMatchObject({ texture_size: "2048" });
  });

  it("never follows an OBJ from Hunyuan as if it were a GLB", () => {
    for (const id of ["fal-hunyuan-3.1-pro", "fal-hunyuan-3.1-rapid"]) {
      const pick = getEngine(id)!.fal!.glbUrl;
      expect(pick({ model_urls: { glb: { url: "https://v3.fal.media/a.glb" } }, model_glb: { url: "https://v3.fal.media/a.obj" } })).toBe("https://v3.fal.media/a.glb");
      expect(pick({ model_glb: { url: "https://v3.fal.media/a.glb", content_type: "model/gltf-binary" } })).toBe("https://v3.fal.media/a.glb");
      expect(pick({ model_glb: { url: "https://v3.fal.media/a.obj", content_type: "model/obj" }, model_urls: { obj: { url: "https://v3.fal.media/a.obj" } } })).toBeNull();
      expect(pick({ model_glb: { url: "https://v3.fal.media/model", content_type: "model/obj" } })).toBeNull();
      expect(pick({ model_glb: { url: "https://v3.fal.media/a.obj?sig=1" } })).toBeNull();
    }
  });
});

describe("Meshy adapter", () => {
  const cfg: MeshyConfig = { key: "msy-secret-key", apiBase: "https://api.test", resultHosts: ["assets.meshy.ai"], allowInsecureResultHosts: false };
  const engine = getEngine("meshy-7.1")!;
  const TASK = "018a210d-8ba4-705c-b111-1f1776f7f578";
  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

  function fake(task: object, submit: Response = json(202, { result: TASK })) {
    const seen: { url: string; init?: RequestInit }[] = [];
    const f = (async (u: string | URL | Request, init?: RequestInit) => {
      const url = String(u);
      seen.push({ url, init });
      if (url.includes("assets.meshy.ai")) return new Response(new Uint8Array(glb), { status: 200 });
      return init?.method === "POST" ? submit : json(200, task);
    }) as unknown as typeof fetch;
    return { seen, deps: { fetch: f, meshyConfig: cfg } };
  }

  it("submits the current model with the key, and asks only for a GLB", async () => {
    const { seen, deps } = fake({});
    const job = await meshyAdapter.submit(engine, { source: { kind: "image", image: await image() }, textureResolution: "1k" }, deps);
    expect(job.jobId).toBe(TASK);
    expect(seen[0].url).toBe("https://api.test/openapi/v1/image-to-3d");
    expect(new Headers(seen[0].init?.headers).get("authorization")).toBe("Bearer msy-secret-key");
    const body = JSON.parse(String(seen[0].init?.body));
    expect(body).toMatchObject({ ai_model: "meshy-7.1", should_texture: true, enable_pbr: true, target_formats: ["glb"] });
    expect(body.image_url).toMatch(/^data:image\/jpeg;base64,/);
  });

  it("does not ask for textures on a geometry-only model", async () => {
    const { seen, deps } = fake({});
    await meshyAdapter.submit(engine, { source: { kind: "image", image: await image() }, textureResolution: "none" }, deps);
    const body = JSON.parse(String(seen[0].init?.body));
    expect(body.should_texture).toBe(false);
    expect(body).not.toHaveProperty("enable_pbr");
  });

  it.each([
    ["PENDING", "pending"],
    ["IN_PROGRESS", "running"],
    ["SUCCEEDED", "success"],
    ["FAILED", "error"],
    ["CANCELED", "error"],
  ])("reads %s as %s", async (raw, expected) => {
    const { deps } = fake({ status: raw, task_error: raw === "FAILED" ? { message: `boom msy-secret-key` } : null });
    const snap = await meshyAdapter.getStatus(engine, { jobId: TASK }, deps);
    expect(snap.status).toBe(expected);
    if (raw === "FAILED") expect(snap.errorMessage).toBe("boom [redacted]");
  });

  it("downloads the GLB without sending the key", async () => {
    const { seen, deps } = fake({ status: "SUCCEEDED", model_urls: { glb: "https://assets.meshy.ai/x/model.glb?Expires=1" } });
    const out = await meshyAdapter.fetchResult(engine, { jobId: TASK }, deps);
    expect(out.equals(glb)).toBe(true);
    const download = seen.find((s) => s.url.includes("assets.meshy.ai"))!;
    expect(new Headers(download.init?.headers).get("authorization")).toBeNull();
  });

  it("refuses a result on a host that is not Meshy's", async () => {
    const { deps } = fake({ status: "SUCCEEDED", model_urls: { glb: "https://evil.example/model.glb" } });
    await expect(meshyAdapter.fetchResult(engine, { jobId: TASK }, deps)).rejects.toMatchObject({ kind: "invalid_response" });
  });

  it("treats the documented refusals as definite, so the attempt goes back", async () => {
    const cases: [number, ProviderError["kind"]][] = [[401, "auth"], [402, "payment_required"], [403, "rejected"], [429, "rate_limited"], [400, "rejected"]];
    for (const [status, kind] of cases) {
      const { deps } = fake({}, json(status, { message: "no msy-secret-key" }));
      const err = await meshyAdapter.submit(engine, { source: { kind: "image", image: await image() }, textureResolution: "1k" }, deps).catch((e) => e);
      expect(err).toBeInstanceOf(ProviderError);
      expect(err.kind).toBe(kind);
      expect(err.definite).toBe(true);
      expect(err.message).not.toContain("msy-secret-key");
    }
  });

  it("a server error is not definite: the job may have started", async () => {
    const { deps } = fake({}, json(502, {}));
    const err = await meshyAdapter.submit(engine, { source: { kind: "image", image: await image() }, textureResolution: "1k" }, deps).catch((e) => e);
    expect(err).toMatchObject({ kind: "server", definite: false });
  });

  it("is off without a key", () => {
    expect(meshyAdapter.isConfigured({ meshyConfig: null })).toBe(false);
    expect(meshyAdapter.isConfigured({ meshyConfig: cfg })).toBe(true);
  });
});
