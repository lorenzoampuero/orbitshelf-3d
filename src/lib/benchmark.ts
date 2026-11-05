import "server-only";
import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { GlbError, validateGlb } from "@/lib/glb";
import { diagnoseGlb } from "@/lib/glb-tools";
import { validateAndNormalizeImage, type NormalizedImage } from "@/lib/image";
import { adapterFor, capabilityProblem, priceOf } from "@/lib/provider/registry";
import { ProviderError, type Deps, type EngineDefinition, type ProviderInput } from "@/lib/provider/types";
import { IMAGE_VIEWS, type ImageView, type InputKind, type TextureResolution } from "@/lib/types";

/**
 * The paid comparison of engines. It calls the adapters directly because the engines under test are disabled for customers.
 * A plan costs nothing to build. Only runPlan spends money, and it stops before crossing the budget it is given.
 */

export type BenchProduct = { id: string; category: string; photos: Partial<Record<ImageView, string>> };
export type BenchItem = { product: BenchProduct; engine: EngineDefinition; mode: InputKind; usd: number };
export type BenchPlan = { items: BenchItem[]; skipped: { productId: string; engineId: string; reason: string }[]; totalUsd: number };

const HEADER = ["id", "categoria", "front", "left", "back", "right", "derechos_confirmados"];

/** Only products whose owner confirmed the rights to the photos go to a provider. */
export function parseManifest(text: string): { products: BenchProduct[]; refused: string[] } {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  if (lines.length === 0 || lines[0].split(",").join(",") !== HEADER.join(",")) throw new Error(`The manifest must start with: ${HEADER.join(",")}`);
  const products: BenchProduct[] = [];
  const refused: string[] = [];
  for (const line of lines.slice(1)) {
    const [id, category, front, left, back, right, rights] = line.split(",").map((c) => c.trim());
    if (!id || !front) throw new Error(`Each row needs an id and a front photo: ${line}`);
    if (rights?.toLowerCase() !== "si") {
      refused.push(id);
      continue;
    }
    const photos: BenchProduct["photos"] = { front };
    if (left) photos.left = left;
    if (back) photos.back = back;
    if (right) photos.right = right;
    products.push({ id, category: category ?? "", photos });
  }
  return { products, refused };
}

export function buildPlan(products: BenchProduct[], engines: readonly EngineDefinition[], texture: TextureResolution): BenchPlan {
  const items: BenchItem[] = [];
  const skipped: BenchPlan["skipped"] = [];
  for (const product of products) {
    for (const engine of engines) {
      const views = IMAGE_VIEWS.filter((v) => product.photos[v]);
      // An engine that takes one photo is tested on the front one, and the results say so.
      const mode: InputKind = views.length > 1 && engine.modes.includes("multi-image") ? "multi-image" : "image";
      const used = mode === "image" ? (["front"] as ImageView[]) : views;
      const query = { mode, photoCount: used.length, texture };
      const problem = capabilityProblem(engine, { ...query, views: used });
      if (problem) {
        skipped.push({ productId: product.id, engineId: engine.id, reason: problem });
        continue;
      }
      items.push({ product, engine, mode, usd: priceOf(engine, query).usd });
    }
  }
  return { items, skipped, totalUsd: Math.round(items.reduce((n, i) => n + i.usd, 0) * 10_000) / 10_000 };
}

export type BenchResult = {
  productId: string;
  category: string;
  engineId: string;
  mode: InputKind;
  photos: number;
  status: "ok" | "failed" | "not_run";
  detail: string;
  /** Published price counted against the budget. Zero when the provider definitely did not start the job. */
  publishedUsd: number;
  seconds: number | null;
  triangles: number | null;
  bytes: number | null;
  file: string | null;
};

export type RunOptions = {
  budgetUsd: number;
  texture: TextureResolution;
  outDir: string;
  deps?: Deps;
  pollMs?: number;
  maxWaitMs?: number;
  sleep?: (ms: number) => Promise<void>;
  readPhoto?: (file: string) => Buffer;
  log?: (line: string) => void;
};

async function loadSource(item: BenchItem, read: (file: string) => Buffer): Promise<ProviderInput> {
  const load = async (file: string): Promise<NormalizedImage> => validateAndNormalizeImage({ buffer: read(file) });
  if (item.mode === "image") return { kind: "image", image: await load(item.product.photos.front!) };
  const images: Partial<Record<ImageView, NormalizedImage>> = {};
  for (const v of IMAGE_VIEWS) if (item.product.photos[v]) images[v] = await load(item.product.photos[v]!);
  return { kind: "multi-image", images };
}

export async function runPlan(plan: BenchPlan, opts: RunOptions): Promise<{ results: BenchResult[]; spentUsd: number }> {
  const { budgetUsd, texture, outDir, deps } = opts;
  const sleep = opts.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const read = opts.readPhoto ?? ((file: string) => readFileSync(file));
  const log = opts.log ?? (() => undefined);
  const pollMs = opts.pollMs ?? 10_000;
  const maxWaitMs = opts.maxWaitMs ?? 20 * 60_000;
  mkdirSync(path.join(outDir, "modelos"), { recursive: true });
  const results: BenchResult[] = [];
  let spentUsd = 0;

  for (const item of plan.items) {
    const base = { productId: item.product.id, category: item.product.category, engineId: item.engine.id, mode: item.mode, photos: item.mode === "image" ? 1 : IMAGE_VIEWS.filter((v) => item.product.photos[v]).length };
    const empty = { publishedUsd: 0, seconds: null, triangles: null, bytes: null, file: null };
    if (spentUsd + item.usd > budgetUsd) {
      results.push({ ...base, ...empty, status: "not_run", detail: "Over budget" });
      continue;
    }
    const adapter = adapterFor(item.engine);
    if (!adapter.isConfigured(deps)) {
      results.push({ ...base, ...empty, status: "not_run", detail: "No credentials for this provider" });
      continue;
    }
    const started = Date.now();
    let publishedUsd = 0;
    try {
      const source = await loadSource(item, read);
      // Counted before the call: if the answer is lost the provider may still charge, so the budget assumes it did.
      spentUsd += item.usd;
      publishedUsd = item.usd;
      const job = await adapter.submit(item.engine, { source, textureResolution: texture }, deps);
      for (;;) {
        const snapshot = await adapter.getStatus(item.engine, job, deps);
        if (snapshot.status === "error") throw new Error(snapshot.errorMessage ?? "The provider reported a failure.");
        if (snapshot.status === "success") break;
        if (Date.now() - started > maxWaitMs) throw new Error("Timed out waiting for the provider.");
        await sleep(pollMs);
      }
      const glb = await adapter.fetchResult(item.engine, job, deps);
      const info = validateGlb(glb);
      const diagnostics = await diagnoseGlb(glb);
      const file = path.join("modelos", `${item.product.id}__${item.engine.id}.glb`);
      writeFileSync(path.join(outDir, file), glb);
      results.push({ ...base, status: "ok", detail: "", publishedUsd, seconds: Math.round((Date.now() - started) / 1000), triangles: diagnostics.triangles, bytes: info.bytes, file });
      log(`ok      ${item.product.id} / ${item.engine.id}`);
    } catch (e) {
      if (e instanceof ProviderError && e.definite && publishedUsd > 0) {
        spentUsd -= publishedUsd;
        publishedUsd = 0;
      }
      const detail = e instanceof GlbError ? `Invalid GLB: ${e.message}` : e instanceof Error ? e.message : "Unknown failure";
      results.push({ ...base, ...empty, publishedUsd, status: "failed", detail: detail.slice(0, 300), seconds: Math.round((Date.now() - started) / 1000) });
      log(`failed  ${item.product.id} / ${item.engine.id}: ${detail.slice(0, 120)}`);
    }
  }
  return { results, spentUsd: Math.round(spentUsd * 10_000) / 10_000 };
}

const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (rows: unknown[][]) => rows.map((r) => r.map(csvCell).join(",")).join("\n") + "\n";

/** Parses what toCsv writes and what a spreadsheet saves, including quoted cells and either separator a Spanish-locale Excel may use. */
export function parseCsv(text: string): Record<string, string>[] {
  const clean = text.replace(/^﻿/, "");
  const sep = (clean.split(/\r?\n/)[0] ?? "").includes(";") ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (quoted) {
      if (c === '"' && clean[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && clean[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    if (row.some((x) => x !== "")) rows.push(row);
  }
  const [head, ...body] = rows;
  return (body ?? []).map((r) => Object.fromEntries((head ?? []).map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
}

const RESULT_COLUMNS = ["producto", "categoria", "motor", "modo", "fotos", "estado", "detalle", "usd_publicado", "segundos", "triangulos", "bytes", "archivo"];

/**
 * Writes the results and the two files of a blind review. The reviewer gets only coded models; which engine made each one stays in the key.
 * The order is shuffled so that models of one engine do not sit next to each other.
 */
export function writeRunFiles(outDir: string, results: BenchResult[], random: (n: number) => number = (n) => randomBytes(4).readUInt32BE(0) % n) {
  writeFileSync(
    path.join(outDir, "resultados.csv"),
    toCsv([RESULT_COLUMNS, ...results.map((r) => [r.productId, r.category, r.engineId, r.mode, r.photos, r.status, r.detail, r.publishedUsd, r.seconds, r.triangles, r.bytes, r.file])]),
  );
  const ok = results.filter((r) => r.status === "ok");
  for (let i = ok.length - 1; i > 0; i--) {
    const j = random(i + 1);
    [ok[i], ok[j]] = [ok[j], ok[i]];
  }
  const dir = path.join(outDir, "revision-ciega");
  mkdirSync(dir, { recursive: true });
  const codes = ok.map((_, i) => `M${String(i + 1).padStart(4, "0")}`);
  ok.forEach((r, i) => writeFileSync(path.join(dir, `${codes[i]}.glb`), readFileSync(path.join(outDir, r.file!))));
  writeFileSync(path.join(outDir, "revision-ciega.csv"), toCsv([["codigo", "producto", "categoria", "forma_1a5", "textura_1a5", "defectos", "utilizable_si_no"], ...ok.map((r, i) => [codes[i], r.productId, r.category, "", "", "", ""])]));
  writeFileSync(path.join(outDir, "clave-no-abrir-antes-de-revisar.csv"), toCsv([["codigo", "motor"], ...ok.map((r, i) => [codes[i], r.engineId])]));
}

export type EngineScore = { engineId: string; jobs: number; ok: number; failed: number; reviewed: number; usable: number; usableRate: number | null; publishedUsd: number; usdPerUsable: number | null; avgForm: number | null; avgTexture: number | null; avgSeconds: number | null };

/** Cost per usable model counts every job paid for, including the failed and unusable ones. Nothing unreviewed counts as usable. */
export function scoreRun(results: Record<string, string>[], review: Record<string, string>[], key: Record<string, string>[]): EngineScore[] {
  const engineOf = new Map(key.map((k) => [k.codigo, k.motor]));
  const scores = new Map<string, EngineScore & { form: number[]; texture: number[]; seconds: number[] }>();
  const of = (engineId: string) => {
    if (!scores.has(engineId)) scores.set(engineId, { engineId, jobs: 0, ok: 0, failed: 0, reviewed: 0, usable: 0, usableRate: null, publishedUsd: 0, usdPerUsable: null, avgForm: null, avgTexture: null, avgSeconds: null, form: [], texture: [], seconds: [] });
    return scores.get(engineId)!;
  };
  for (const r of results) {
    if (r.estado === "not_run") continue;
    const s = of(r.motor);
    s.jobs += 1;
    s.publishedUsd += Number(r.usd_publicado || 0);
    if (r.estado === "ok") s.ok += 1;
    if (r.estado === "failed") s.failed += 1;
    if (r.segundos) s.seconds.push(Number(r.segundos));
  }
  for (const r of review) {
    const engine = engineOf.get(r.codigo);
    const verdict = r.utilizable_si_no?.toLowerCase();
    if (!engine || (verdict !== "si" && verdict !== "no")) continue;
    const s = of(engine);
    s.reviewed += 1;
    if (verdict === "si") s.usable += 1;
    if (Number(r.forma_1a5)) s.form.push(Number(r.forma_1a5));
    if (Number(r.textura_1a5)) s.texture.push(Number(r.textura_1a5));
  }
  const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100 : null);
  return [...scores.values()]
    .map(({ form, texture, seconds, ...s }) => ({
      ...s,
      publishedUsd: Math.round(s.publishedUsd * 10_000) / 10_000,
      usableRate: s.reviewed ? Math.round((s.usable / s.reviewed) * 1000) / 1000 : null,
      usdPerUsable: s.usable ? Math.round((s.publishedUsd / s.usable) * 1000) / 1000 : null,
      avgForm: avg(form),
      avgTexture: avg(texture),
      avgSeconds: avg(seconds),
    }))
    .sort((a, b) => (a.usdPerUsable ?? Infinity) - (b.usdPerUsable ?? Infinity));
}
