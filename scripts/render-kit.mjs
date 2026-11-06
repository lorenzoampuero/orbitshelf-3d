// Render kit: turns GLB files into transparent PNGs for the marketing pages.
// Usage: node scripts/render-kit.mjs [glbDir=assets/glb] [outDir=public/showcase] [sizePx=1600]
//   Optional assets/glb/manifest.json: [{ "file": "dragon.glb", "name": "Dragón", "niche": "games", "origin": "mío|compra|IA", "rights": "uso comercial confirmado" }]
// For each model it writes <slug>.png (original materials) and <slug>-clay.png (one flat grey colour, the "no texture" look),
// and a showcase.json that records the origin and rights you declared. Nothing is labelled "made with OrbitShelf".
import { chromium } from "@playwright/test";
import { createServer } from "node:http";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const glbDir = path.resolve(process.argv[2] ?? "assets/glb");
const outDir = path.resolve(process.argv[3] ?? "public/showcase");
const size = Number(process.argv[4] ?? 1600);
await mkdir(outDir, { recursive: true });

const files = (await readdir(glbDir)).filter((f) => f.toLowerCase().endsWith(".glb")).sort();
if (!files.length) {
  console.error(`No .glb files in ${glbDir}. Put your models there and run again.`);
  process.exit(1);
}
let manifest = [];
try { manifest = JSON.parse(await readFile(path.join(glbDir, "manifest.json"), "utf8")); } catch {}
const meta = (f) => manifest.find((m) => m.file === f) ?? {};
const slug = (f) => f.replace(/\.glb$/i, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const vendor = path.resolve("public/vendor/model-viewer.min.js");
const server = createServer(async (req, res) => {
  try {
    const u = decodeURIComponent((req.url ?? "/").split("?")[0]);
    if (u === "/") {
      res.setHeader("content-type", "text/html");
      return res.end(`<!doctype html><body style="margin:0;background:transparent"><script type="module" src="/vendor.js"></script>
<model-viewer id="mv" style="width:${size}px;height:${size}px;background:transparent" camera-controls
 exposure="1.1" shadow-intensity="0" environment-image="neutral" interaction-prompt="none" camera-orbit="35deg 72deg auto"></model-viewer></body>`);
    }
    if (u === "/vendor.js") { res.setHeader("content-type", "text/javascript"); return res.end(await readFile(vendor)); }
    if (u.startsWith("/glb/")) { res.setHeader("content-type", "model/gltf-binary"); return res.end(await readFile(path.join(glbDir, path.basename(u)))); }
    res.statusCode = 404; res.end();
  } catch { res.statusCode = 500; res.end(); }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: size, height: size } });
await page.goto(base);
const out = [];
for (const f of files) {
  const s = slug(f);
  await page.evaluate(async (src) => {
    const mv = document.getElementById("mv");
    mv.removeAttribute("src");
    await new Promise((resolve, reject) => {
      mv.addEventListener("load", resolve, { once: true });
      mv.addEventListener("error", () => reject(new Error("model failed to load")), { once: true });
      mv.src = src;
    });
  }, `${base}/glb/${encodeURIComponent(f)}`);
  for (const variant of ["", "-clay"]) {
    if (variant) {
      await page.evaluate(() => {
        for (const m of document.getElementById("mv").model.materials) {
          m.pbrMetallicRoughness.setBaseColorFactor([0.62, 0.62, 0.66, 1]);
          m.pbrMetallicRoughness.setMetallicFactor(0);
          m.pbrMetallicRoughness.setRoughnessFactor(0.7);
          m.pbrMetallicRoughness.baseColorTexture?.setTexture?.(null);
        }
      });
    }
    await page.waitForTimeout(600);
    const b64 = await page.evaluate(async () => {
      const blob = await document.getElementById("mv").toBlob({ mimeType: "image/png", idealAspect: true });
      const buf = new Uint8Array(await blob.arrayBuffer());
      let bin = ""; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      return btoa(bin);
    });
    await writeFile(path.join(outDir, `${s}${variant}.png`), Buffer.from(b64, "base64"));
  }
  const m = meta(f);
  out.push({ slug: s, file: f, name: m.name ?? s, niche: m.niche ?? null, origin: m.origin ?? "undeclared", rights: m.rights ?? "undeclared" });
  console.log("ok", s);
}
await writeFile(path.join(outDir, "showcase.json"), JSON.stringify(out, null, 2));
await browser.close();
server.close();
const missing = out.filter((o) => o.origin === "undeclared" || o.rights === "undeclared");
if (missing.length) console.warn(`\n${missing.length} model(s) have no declared origin/rights in manifest.json. Do not publish their renders until you fill that in.`);
