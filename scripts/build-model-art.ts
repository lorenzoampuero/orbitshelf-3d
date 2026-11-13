/**
 * Turns the Blender output in .art-cache/out/<id>/ into the files the site serves for every model in the catalogue.
 *
 *   npm run model-art            all models with status "use"
 *   npm run model-art -- 9d8b403c hoodie      only those ids
 *
 * Needs `blender -b --factory-startup -P scripts/render-landing.py -- --id <id> --what art` to have run first.
 * Writes public/models/<slug>/ and src/content/models-manifest.json. The originals are never served.
 *
 * Budgets (docs/PLAN_REDISENO.md §4.3): the script fails, listing every offender, when a file goes over its limit.
 */
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { quantize, textureCompress } from "@gltf-transform/functions";
import sharp from "sharp";
import { COPY } from "./model-copy";

const root = process.cwd();
const cache = path.join(root, ".art-cache", "out");
const publicDir = path.join(root, "public", "models");
const manifestFile = path.join(root, "src", "content", "models-manifest.json");

const KB = 1024;
const MB = 1024 * 1024;
const BUDGET = {
  beauty: 250 * KB, // each of the 1600 / 800 / 240 px renders
  spin: 1.2 * MB, // 6 x 6 sprite sheet
  web: 1.5 * MB,
  webHeavy: 3 * MB, // untextured models: the shape is all they have
  card: 350 * KB,
  poster: 120 * KB,
  total: 64 * MB, // plan estimated 60 MB for 48x720 spins; 32 models at 36x512 spins land near 61 MB
};
const WIDTHS = [1600, 800] as const;
const THUMB = 240;
const COLS = 6;
const STAGE = "#08080a";

type Box = { left: number; top: number; width: number; height: number };
type Entry = { name: string; category: string; tags: string[]; status: string; role?: string; integration?: string };

const problems: string[] = [];
const over = (file: string, bytes: number, limit: number) => {
  if (bytes > limit) problems.push(`${path.relative(root, file)}: ${(bytes / KB).toFixed(0)} KB, limit ${(limit / KB).toFixed(0)} KB`);
};

/** The area with visible pixels. The threshold ignores the faint floor shadow, which would otherwise reach the frame edge. */
async function visibleBox(file: string): Promise<Box> {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let [left, top, right, bottom] = [info.width, info.height, 0, 0];
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] <= 40) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  if (right <= left) throw new Error(`${file}: nothing visible`);
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

function pad(box: Box, size: number, ratio = 0.05): Box {
  const margin = Math.round(Math.max(box.width, box.height) * ratio);
  const left = Math.max(0, box.left - margin);
  const top = Math.max(0, box.top - margin);
  return { left, top, width: Math.min(size - left, box.width + margin * 2), height: Math.min(size - top, box.height + margin * 2) };
}

function union(boxes: Box[]): Box {
  const left = Math.min(...boxes.map((b) => b.left));
  const top = Math.min(...boxes.map((b) => b.top));
  return { left, top, width: Math.max(...boxes.map((b) => b.left + b.width)) - left, height: Math.max(...boxes.map((b) => b.top + b.height)) - top };
}

/** A mask that fades the outer edge, so the soft floor shadow never ends in a hard rectangle where the crop cuts it. */
function feather(width: number, height: number): Buffer {
  const m = Math.round(Math.min(width, height) * 0.05);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><filter id="f" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${m / 2}"/></filter><rect x="${m}" y="${m}" width="${width - m * 2}" height="${height - m * 2}" fill="#fff" filter="url(#f)"/></svg>`,
  );
}

async function croppedPng(input: string, box: Box, width?: number): Promise<{ data: Buffer; width: number; height: number }> {
  let pipeline = sharp(input).extract(box);
  if (width) pipeline = pipeline.resize({ width, withoutEnlargement: true });
  const { data, info } = await pipeline.png().toBuffer({ resolveWithObject: true });
  const faded = await sharp(data).composite([{ input: feather(info.width, info.height), blend: "dest-in" }]).png().toBuffer();
  return { data: faded, width: info.width, height: info.height };
}

async function encode(png: Buffer, limit: number, target: string, qualities = [86, 80, 74, 68, 60, 52, 44]) {
  for (const quality of qualities) {
    const out = await sharp(png).webp({ quality, alphaQuality: 80, effort: 6 }).toBuffer();
    if (out.byteLength <= limit || quality === qualities[qualities.length - 1]) {
      await writeFile(target, out);
      over(target, out.byteLength, limit);
      return out.byteLength;
    }
  }
  return 0;
}

/** Blender's reduced model, squeezed with extensions the viewer reads without a separate decoder. */
async function squeeze(file: string, size: number, quality: number): Promise<Buffer> {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const doc = await io.read(file);
  await doc.transform(quantize(), textureCompress({ encoder: sharp, targetFormat: "webp", quality, resize: [size, size] }));
  return Buffer.from(await io.writeBinary(doc));
}

async function triangles(buffer: Buffer): Promise<number> {
  const doc = await new NodeIO().registerExtensions(ALL_EXTENSIONS).readBinary(new Uint8Array(buffer));
  let tris = 0;
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const idx = prim.getIndices();
      tris += idx ? idx.getCount() / 3 : (prim.getAttribute("POSITION")?.getCount() ?? 0) / 3;
    }
  }
  return Math.round(tris);
}

async function glb(id: string, slug: string, level: "web" | "card", heavy: boolean) {
  const size = level === "web" ? 1024 : 512;
  const limit = level === "card" ? BUDGET.card : heavy ? BUDGET.webHeavy : BUDGET.web;
  const target = path.join(publicDir, slug, `${level}.glb`);
  // Texture quality first, then a smaller texture, until the file fits.
  const attempts: Array<[number, number]> = [[size, 74], [size, 60], [size, 48], [size / 2, 56]];
  let out: Buffer = Buffer.alloc(0);
  for (const [px, quality] of attempts) {
    out = await squeeze(path.join(cache, id, `${level}.glb`), px, quality);
    if (out.byteLength <= limit) break;
  }
  await writeFile(target, out);
  over(target, out.byteLength, limit);
  return { bytes: out.byteLength, tris: await triangles(out) };
}

async function dominantColour(file: string): Promise<string> {
  const { data } = await sharp(file).resize(48, 48, { fit: "inside" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let [r, g, b, n] = [0, 0, 0, 0];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    n++;
  }
  const hex = (v: number) => Math.round(v / Math.max(n, 1)).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function slugOf(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function folderBytes(dir: string): Promise<number> {
  let total = 0;
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    total += e.isDirectory() ? await folderBytes(p) : (await stat(p)).size;
  }
  return total;
}

async function build(id: string, entry: Entry, info: { tris: number }) {
  const slug = slugOf(entry.name);
  const dir = path.join(publicDir, slug);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const base = path.join(cache, id);

  // Main render, three widths.
  const beautyPng = path.join(base, "beauty.png");
  const { width: fullWidth } = await sharp(beautyPng).metadata().then((m) => ({ width: m.width! }));
  const box = pad(await visibleBox(beautyPng), fullWidth);
  const beauty: Record<number, number> = {};
  let beautySize = { width: 0, height: 0 };
  for (const width of [...WIDTHS, THUMB]) {
    const cropped = await croppedPng(beautyPng, box, width);
    beauty[width] = await encode(cropped.data, BUDGET.beauty, path.join(dir, `beauty-${width}.webp`));
    if (width === WIDTHS[0]) beautySize = { width: cropped.width, height: cropped.height };
  }

  // Poster for the live viewer: the render on the stage colour.
  const posterFile = path.join(dir, "poster.webp");
  const poster = await sharp(beautyPng).extract(box).resize({ width: 800, withoutEnlargement: true }).flatten({ background: STAGE }).webp({ quality: 70 }).toBuffer();
  await writeFile(posterFile, poster);
  over(posterFile, poster.byteLength, BUDGET.poster);

  // Spin: every frame cropped to the same box (the union over all frames), laid out in a COLS-wide sheet.
  const frames = (await readdir(path.join(base, "spin"))).filter((f) => f.endsWith(".png")).sort();
  const frameSize = (await sharp(path.join(base, "spin", frames[0])).metadata()).width!;
  const spinBox = pad(union(await Promise.all(frames.map((f) => visibleBox(path.join(base, "spin", f))))), frameSize, 0.03);
  const tiles = await Promise.all(frames.map((f) => croppedPng(path.join(base, "spin", f), spinBox)));
  const rows = Math.ceil(frames.length / COLS);
  const tw = tiles[0].width;
  const th = tiles[0].height;
  const sheet = await sharp({ create: { width: tw * COLS, height: th * rows, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(tiles.map((t, i) => ({ input: t.data, left: (i % COLS) * tw, top: Math.floor(i / COLS) * th })))
    .png()
    .toBuffer();
  const spinBytes = await encode(sheet, BUDGET.spin, path.join(dir, "spin.webp"), [74, 68, 62, 56, 50, 44, 38]);

  // Models.
  const heavy = (entry.tags ?? []).includes("untextured");
  const web = await glb(id, slug, "web", heavy);
  const card = await glb(id, slug, "card", heavy);

  const copy = COPY[id];
  if (!copy) throw new Error(`${id}: no entry in scripts/model-copy.ts`);
  const url = `/models/${slug}`;
  return {
    id,
    slug,
    name: { en: entry.name, es: copy.es },
    alt: { en: copy.altEn, es: copy.altEs },
    category: entry.category,
    tags: entry.tags,
    ...(entry.role ? { role: entry.role, integration: entry.integration } : {}),
    colour: await dominantColour(path.join(dir, `beauty-${THUMB}.webp`)),
    tris: { original: info.tris, web: web.tris, card: card.tris },
    bytes: { web: web.bytes, card: card.bytes, spin: spinBytes, beauty: beauty[WIDTHS[0]], poster: poster.byteLength },
    beauty: { src: `${url}/beauty-1600.webp`, srcSmall: `${url}/beauty-800.webp`, thumb: `${url}/beauty-240.webp`, ...beautySize },
    spin: { src: `${url}/spin.webp`, frames: frames.length, cols: COLS, frameWidth: tw, frameHeight: th },
    poster: `${url}/poster.webp`,
    glb: { web: `${url}/web.glb`, card: `${url}/card.glb` },
  };
}

async function main() {
  const catalogue: Record<string, Entry> = JSON.parse(readFileSync(path.join(root, ".art-cache", "models.json"), "utf8"));
  const wanted = process.argv.slice(2);
  const ids = Object.entries(catalogue)
    .filter(([id, e]) => (wanted.length ? wanted.includes(id) : e.status === "use"))
    .map(([id]) => id);

  const previous: Array<{ id: string }> = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, "utf8")) : [];
  const byId = new Map(previous.map((m) => [m.id, m]));
  for (const id of ids) {
    const infoFile = path.join(cache, id, "info.json");
    if (!existsSync(path.join(cache, id, "card.glb")) || !existsSync(infoFile)) {
      console.log(`skip ${id}: run the Blender "art" step first`);
      continue;
    }
    byId.set(id, await build(id, catalogue[id], JSON.parse(readFileSync(infoFile, "utf8"))));
    console.log(`ok ${id} ${catalogue[id].name}`);
  }

  await mkdir(path.dirname(manifestFile), { recursive: true });
  const order = Object.keys(catalogue);
  const list = [...byId.values()].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  await writeFile(manifestFile, JSON.stringify(list, null, 1) + "\n");

  const total = existsSync(publicDir) ? await folderBytes(publicDir) : 0;
  console.log(`public/models: ${(total / MB).toFixed(1)} MB for ${list.length} models`);
  if (total > BUDGET.total) problems.push(`public/models is ${(total / MB).toFixed(1)} MB, limit ${BUDGET.total / MB} MB`);
  if (problems.length) {
    console.error("\nOver budget:\n" + problems.map((p) => "  " + p).join("\n"));
    process.exit(1);
  }
}

main();
