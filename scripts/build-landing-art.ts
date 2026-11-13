/**
 * Turns the Blender renders in .art-cache/out/ into the files the public site serves.
 *
 *   npm run landing-art
 *
 * Needs scripts/render-landing.py to have run first, and ffmpeg on the PATH. Writes public/landing/ and
 * src/content/landing-art-data.json. Fails if a file goes over its weight limit.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { quantize, textureCompress } from "@gltf-transform/functions";
import sharp from "sharp";

const root = process.cwd();
const cache = path.join(root, ".art-cache", "out");
const publicDir = path.join(root, "public", "landing");
const dataFile = path.join(root, "src", "content", "landing-art-data.json");

const WIDTHS = [1600, 800] as const;
const THUMB = 240;
const MAX_IMAGE_BYTES = 250 * 1024;
const MAX_VIDEO_BYTES = 1.5 * 1024 * 1024;
const MAX_GLB_BYTES = 3.5 * 1024 * 1024;
const PAGE_COLOUR = "0a0912";
const TURN_FPS = 16;
/** Pure black where the video is blended over a coloured banner: "screen" only hides true black. */
const TURN_COLOUR: Record<string, string> = { dragon: "000000" };

/** Full set: main shot, second angle, clay, wire and a turntable. */
const FULL = ["dragon", "hoodie", "kitchen"];
/** Poly Haven CC0 models already in public/demo: one shot each. */
const SINGLE = ["bust", "camera", "lounge", "lantern"];
/** Models with a live GLB for the viewer (scripts/render-landing.py --what web). */
const LIVE_GLB = ["dragon", "hoodie", "kitchen"];

type Box = { left: number; top: number; width: number; height: number };
type Image = { src: string; srcSmall: string; thumb: string; width: number; height: number };

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

function pad(box: Box, size: number): Box {
  const margin = Math.round(Math.max(box.width, box.height) * 0.04);
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

async function webp(input: string, box: Box, width: number, target: string): Promise<void> {
  const resized = await sharp(input).extract(box).resize({ width, withoutEnlargement: true }).png().toBuffer({ resolveWithObject: true });
  const faded = await sharp(resized.data).composite([{ input: feather(resized.info.width, resized.info.height), blend: "dest-in" }]).png().toBuffer();
  for (const quality of [86, 80, 74, 68, 60, 52]) {
    const out = await sharp(faded).webp({ quality, alphaQuality: 80, effort: 6 }).toBuffer();
    if (out.byteLength <= MAX_IMAGE_BYTES) return void (await writeFile(target, out));
  }
  throw new Error(`${target}: over ${MAX_IMAGE_BYTES} bytes even at the lowest quality`);
}

async function image(id: string, name: string, box: Box): Promise<Image> {
  const input = path.join(cache, id, `${name}.png`);
  const dir = path.join(publicDir, id);
  for (const width of [...WIDTHS, THUMB]) await webp(input, box, width, path.join(dir, `${name}-${width}.webp`));
  const scale = Math.min(1, WIDTHS[0] / box.width);
  return {
    src: `/landing/${id}/${name}-${WIDTHS[0]}.webp`,
    srcSmall: `/landing/${id}/${name}-${WIDTHS[1]}.webp`,
    thumb: `/landing/${id}/${name}-${THUMB}.webp`,
    width: Math.round(box.width * scale),
    height: Math.round(box.height * scale),
  };
}

/** Blender's reduced model, squeezed with extensions the viewer reads without a separate decoder. */
async function squeeze(file: string): Promise<Buffer> {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const doc = await io.read(file);
  await doc.transform(quantize(), textureCompress({ encoder: sharp, targetFormat: "webp", quality: 74, resize: [1024, 1024] }));
  return Buffer.from(await io.writeBinary(doc));
}

function ffmpeg(args: string[]) {
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });
}

async function turntable(id: string) {
  const frames = path.join(cache, id, "turn", "%04d.png");
  const dir = path.join(publicDir, id);
  const size = (await sharp(path.join(cache, id, "turn", "0000.png")).metadata()).width!;
  const mp4 = path.join(dir, "turn.mp4");
  const webm = path.join(dir, "turn.webm");
  const colour = TURN_COLOUR[id] ?? PAGE_COLOUR;
  const input = ["-framerate", String(TURN_FPS), "-i", frames, "-f", "lavfi", "-i", `color=c=0x${colour}:s=${size}x${size}:r=${TURN_FPS}`];
  const compose = "[1][0]overlay=shortest=1,format=yuv420p";
  ffmpeg([...input, "-filter_complex", compose, "-c:v", "libx264", "-crf", "27", "-preset", "slow", "-movflags", "+faststart", "-an", mp4]);
  ffmpeg([...input, "-filter_complex", compose, "-c:v", "libvpx-vp9", "-crf", "36", "-b:v", "0", "-row-mt", "1", "-an", webm]);
  for (const f of [mp4, webm]) {
    const { size: bytes } = await stat(f);
    if (bytes > MAX_VIDEO_BYTES) throw new Error(`${f}: ${bytes} bytes, limit ${MAX_VIDEO_BYTES}`);
  }
  await sharp(path.join(cache, id, "turn", "0000.png")).flatten({ background: `#${colour}` }).resize(800).webp({ quality: 78 }).toFile(path.join(dir, "turn-poster.webp"));
  return { mp4: `/landing/${id}/turn.mp4`, webm: `/landing/${id}/turn.webm`, poster: `/landing/${id}/turn-poster.webp`, size };
}

async function main() {
  await rm(publicDir, { recursive: true, force: true });
  const data: Record<string, unknown> = {};

  for (const id of FULL) {
    await mkdir(path.join(publicDir, id), { recursive: true });
    const size = (await sharp(path.join(cache, id, "beauty.png")).metadata()).width!;
    // Beauty, clay and wire share one crop so the comparison slider lines up exactly.
    const shared = pad(union(await Promise.all(["beauty", "clay", "wire"].map((n) => visibleBox(path.join(cache, id, `${n}.png`))))), size);
    const entry: Record<string, unknown> = {
      beauty: await image(id, "beauty", shared),
      clay: await image(id, "clay", shared),
      wire: await image(id, "wire", shared),
      alt: await image(id, "alt", pad(await visibleBox(path.join(cache, id, "alt.png")), size)),
      turn: existsSync(path.join(cache, id, "turn", "0000.png")) ? await turntable(id) : null,
    };
    if (LIVE_GLB.includes(id)) {
      const glb = await squeeze(path.join(cache, id, "web.glb"));
      console.log(`${id}: GLB ${glb.byteLength} bytes`);
      if (glb.byteLength > MAX_GLB_BYTES) throw new Error(`${id}: GLB is ${glb.byteLength} bytes`);
      await writeFile(path.join(publicDir, id, `${id}.glb`), glb);
      entry.glb = `/landing/${id}/${id}.glb`;
    }
    data[id] = entry;
    console.log(`${id}: done`);
  }

  for (const id of SINGLE) {
    await mkdir(path.join(publicDir, id), { recursive: true });
    const size = (await sharp(path.join(cache, id, "beauty.png")).metadata()).width!;
    data[id] = { beauty: await image(id, "beauty", pad(await visibleBox(path.join(cache, id, "beauty.png")), size)) };
    console.log(`${id}: done`);
  }

  await writeFile(dataFile, `${JSON.stringify(data, null, 2)}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
