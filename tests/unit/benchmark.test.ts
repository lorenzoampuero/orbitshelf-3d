import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterAll, describe, expect, it } from "vitest";
import { buildPlan, parseCsv, parseManifest, runPlan, scoreRun, writeRunFiles, type BenchProduct } from "@/lib/benchmark";
import type { FalConfig } from "@/lib/env";
import { getEngine } from "@/lib/provider/registry";

const root = mkdtempSync(path.join(os.tmpdir(), "orbitshelf-bench-"));
afterAll(() => rmSync(root, { recursive: true, force: true }));

const glb = readFileSync(path.join(process.cwd(), "public", "demo", "lamp.glb"));
const fal: FalConfig = { key: "k-secret", queueBase: "https://queue.test", resultHosts: ["fal.media"], allowInsecureResultHosts: false };
const engine = (id: string) => getEngine(id)!;
const product = (id: string, photos: BenchProduct["photos"] = { front: "f.jpg" }): BenchProduct => ({ id, category: "apparel", photos });

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
const REQ = "764cabcf-b745-4b3e-ae38-1200304cf45b";

/** Answers for any fal engine. `behave` decides what a submit does. */
function fakeFal(behave: (n: number) => "ok" | "refused" | "lost" = () => "ok") {
  let submits = 0;
  const f = (async (u: string | URL | Request) => {
    const url = String(u);
    const base = `https://queue.test/x/requests/${REQ}`;
    if (url === `${base}/status`) return json(200, { status: "COMPLETED" });
    if (url === base) return json(200, { model_mesh: { url: "https://v3.fal.media/m.glb" }, model_glb: { url: "https://v3.fal.media/m.glb" } });
    if (url.includes("fal.media")) return new Response(new Uint8Array(glb), { status: 200 });
    const what = behave(++submits);
    if (what === "refused") return json(422, { detail: "nope" });
    if (what === "lost") throw new TypeError("socket hang up");
    return json(200, { request_id: REQ, status_url: `${base}/status`, response_url: base });
  }) as unknown as typeof fetch;
  return { deps: { fetch: f, falConfig: fal, meshyConfig: null, config: null }, submits: () => submits };
}

const photo = await sharp({ create: { width: 512, height: 512, channels: 3, background: "#884422" } }).jpeg().toBuffer();
let run = 0;
const opts = (over: object = {}) => ({ budgetUsd: 10, texture: "1k" as const, outDir: path.join(root, `run${++run}`), readPhoto: () => photo, sleep: async () => undefined, ...over });

describe("manifest", () => {
  it("only lets through products whose rights are confirmed", () => {
    const { products, refused } = parseManifest("id,categoria,front,left,back,right,derechos_confirmados\n# help\na,apparel,a.jpg,,a-back.jpg,,si\nb,apparel,b.jpg,,,,no\nc,apparel,c.jpg,,,,\n");
    expect(products.map((p) => p.id)).toEqual(["a"]);
    expect(products[0].photos).toEqual({ front: "a.jpg", back: "a-back.jpg" });
    expect(refused).toEqual(["b", "c"]);
  });

  it("refuses a file with the wrong columns or a row with no photo", () => {
    expect(() => parseManifest("id,photo\nx,y\n")).toThrow(/must start with/);
    expect(() => parseManifest("id,categoria,front,left,back,right,derechos_confirmados\nx,apparel,,,,,si\n")).toThrow(/front photo/);
  });
});

describe("plan", () => {
  it("adds up published prices and uses every photo an engine can take", () => {
    const plan = buildPlan([product("a", { front: "f", back: "b" })], [engine("fal-rodin-2.5-fast"), engine("fal-trellis-1"), engine("fal-hunyuan-3.1-pro")], "1k");
    expect(plan.items.map((i) => [i.engine.id, i.mode, i.usd])).toEqual([
      ["fal-rodin-2.5-fast", "multi-image", 0.1],
      ["fal-trellis-1", "image", 0.02],
      ["fal-hunyuan-3.1-pro", "multi-image", 0.825],
    ]);
    expect(plan.totalUsd).toBe(0.945);
  });

  it("lists what an engine cannot do instead of hiding it", () => {
    const plan = buildPlan([product("a")], [engine("fal-trellis-1")], "none");
    expect(plan.items).toEqual([]);
    expect(plan.skipped).toEqual([{ productId: "a", engineId: "fal-trellis-1", reason: "texture" }]);
  });
});

describe("run", () => {
  it("building a plan calls nobody, and a run saves validated models", async () => {
    const { deps, submits } = fakeFal();
    const plan = buildPlan([product("a"), product("b")], [engine("fal-trellis-1")], "1k");
    expect(submits()).toBe(0);
    const o = opts({ deps });
    const { results, spentUsd } = await runPlan(plan, o);
    expect(submits()).toBe(2);
    expect(spentUsd).toBe(0.04);
    expect(results.every((r) => r.status === "ok" && r.triangles! > 0)).toBe(true);
    expect(existsSync(path.join(o.outDir, "modelos", "a__fal-trellis-1.glb"))).toBe(true);
  });

  it("stops before crossing the budget", async () => {
    const { deps, submits } = fakeFal();
    const plan = buildPlan([product("a"), product("b"), product("c")], [engine("fal-rodin-2.5-fast")], "1k");
    const { results, spentUsd } = await runPlan(plan, opts({ deps, budgetUsd: 0.25 }));
    expect(submits()).toBe(2);
    expect(spentUsd).toBe(0.2);
    expect(results.map((r) => r.status)).toEqual(["ok", "ok", "not_run"]);
    expect(results[2].detail).toBe("Over budget");
  });

  it("does not count a job the provider refused, but counts one whose answer was lost", async () => {
    const refused = fakeFal(() => "refused");
    const a = await runPlan(buildPlan([product("a")], [engine("fal-rodin-2.5-fast")], "1k"), opts({ deps: refused.deps }));
    expect(a.spentUsd).toBe(0);
    expect(a.results[0]).toMatchObject({ status: "failed", publishedUsd: 0 });
    const lost = fakeFal(() => "lost");
    const b = await runPlan(buildPlan([product("a")], [engine("fal-rodin-2.5-fast")], "1k"), opts({ deps: lost.deps }));
    expect(b.spentUsd).toBe(0.1);
    expect(b.results[0]).toMatchObject({ status: "failed", publishedUsd: 0.1 });
  });

  it("spends nothing on a provider with no credentials", async () => {
    const { deps, submits } = fakeFal();
    const { results, spentUsd } = await runPlan(buildPlan([product("a")], [engine("meshy-7.1")], "1k"), opts({ deps }));
    expect(submits()).toBe(0);
    expect(spentUsd).toBe(0);
    expect(results[0].status).toBe("not_run");
  });

  it("a photo that cannot be read costs nothing", async () => {
    const { deps, submits } = fakeFal();
    const { spentUsd, results } = await runPlan(buildPlan([product("a")], [engine("fal-trellis-1")], "1k"), opts({ deps, readPhoto: () => Buffer.from("not an image") }));
    expect(submits()).toBe(0);
    expect(spentUsd).toBe(0);
    expect(results[0].status).toBe("failed");
  });
});

describe("blind review and score", () => {
  it("the review sheet and file names do not reveal the engine", async () => {
    const { deps } = fakeFal();
    const o = opts({ deps });
    const { results } = await runPlan(buildPlan([product("a"), product("b")], [engine("fal-trellis-1"), engine("fal-rodin-2.5-fast")], "1k"), o);
    writeRunFiles(o.outDir, results);
    const sheet = readFileSync(path.join(o.outDir, "revision-ciega.csv"), "utf8");
    expect(sheet).not.toMatch(/fal-|trellis|rodin/i);
    const files = readdirSync(path.join(o.outDir, "revision-ciega"));
    expect(files).toHaveLength(4);
    expect(files.join()).not.toMatch(/fal-|trellis|rodin/i);
    expect(parseCsv(readFileSync(path.join(o.outDir, "clave-no-abrir-antes-de-revisar.csv"), "utf8"))).toHaveLength(4);
  });

  it("charges failed and unusable models to the cost per usable one", () => {
    const results = [
      { motor: "cheap", estado: "ok", usd_publicado: "0.1", segundos: "20" },
      { motor: "cheap", estado: "ok", usd_publicado: "0.1", segundos: "40" },
      { motor: "cheap", estado: "failed", usd_publicado: "0.1", segundos: "5" },
      { motor: "dear", estado: "ok", usd_publicado: "0.5", segundos: "60" },
      { motor: "unseen", estado: "ok", usd_publicado: "0.2", segundos: "60" },
      { motor: "skipped", estado: "not_run", usd_publicado: "0", segundos: "" },
    ];
    const key = [
      { codigo: "M1", motor: "cheap" },
      { codigo: "M2", motor: "cheap" },
      { codigo: "M3", motor: "dear" },
      { codigo: "M4", motor: "unseen" },
    ];
    const review = [
      { codigo: "M1", forma_1a5: "4", textura_1a5: "3", utilizable_si_no: "si" },
      { codigo: "M2", forma_1a5: "2", textura_1a5: "1", utilizable_si_no: "NO" },
      { codigo: "M3", forma_1a5: "5", textura_1a5: "5", utilizable_si_no: "si" },
      { codigo: "M4", forma_1a5: "", textura_1a5: "", utilizable_si_no: "" },
    ];
    const scores = scoreRun(results, review, key);
    const cheap = scores.find((s) => s.engineId === "cheap")!;
    expect(cheap).toMatchObject({ jobs: 3, ok: 2, failed: 1, reviewed: 2, usable: 1, usableRate: 0.5, publishedUsd: 0.3, usdPerUsable: 0.3, avgForm: 3, avgTexture: 2 });
    const unseen = scores.find((s) => s.engineId === "unseen")!;
    expect(unseen).toMatchObject({ reviewed: 0, usable: 0, usableRate: null, usdPerUsable: null });
    expect(scores.map((s) => s.engineId)).toEqual(["cheap", "dear", "unseen"]);
  });

  it("reads a sheet saved by a Spanish Excel: semicolons, quotes and a byte-order mark", () => {
    expect(parseCsv('﻿codigo;defectos;utilizable_si_no\r\nM1;"manga; rota ""fea""";si\r\n')).toEqual([{ codigo: "M1", defectos: 'manga; rota "fea"', utilizable_si_no: "si" }]);
  });
});
