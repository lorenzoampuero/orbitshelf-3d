// Screenshots of the home under alternative colour palettes (CSS variable overrides only, nothing is saved in the app).
// Usage: node scripts/shot-palettes.mjs <baseUrl>
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const base = process.argv[2] ?? "http://localhost:3000";
const out = path.join(process.cwd(), "docs", "screenshots", "palettes");
await mkdir(out, { recursive: true });

const glow = (rgb) => `.glow{background:radial-gradient(closest-side, rgb(${rgb} / 0.5), rgb(${rgb} / 0)) !important}`;
const palettes = {
  "A-actual-rojo": "",
  "B-grafito-rojo-detalle": `:root{--bg:#0c0c0d;--surface:#161618;--surface-2:#202023;--accent:#ff5a5f;--blood:#b3262b;--blood-hi:#d23a40}
    .btn-solid{background:#f4f4f5 !important;color:#0c0c0d !important}.btn-solid:hover{background:#fff !important}
    ${glow("90 90 100")} .pill-nav{background:rgb(22 22 24 / .8)}`,
  "C-azul-noche-coral": `:root{--bg:#090c13;--surface:#121826;--surface-2:#1b2333;--accent:#ff8a65;--accent-strong:#ffa488;--blood:#c2410c;--blood-hi:#ea580c}
    .btn-solid{background:linear-gradient(135deg,#ff7a45,#e0531f) !important;color:#fff !important}
    ${glow("40 70 140")}`,
  "D-violeta-profundo": `:root{--bg:#0a0912;--surface:#15132a;--surface-2:#1f1c3a;--accent:#b79cff;--accent-strong:#cdbbff;--blood:#5b3df5;--blood-hi:#7355ff}
    .btn-solid{background:linear-gradient(135deg,#7a5cff,#4a2fe0) !important;color:#fff !important}
    ${glow("91 61 245")}`,
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 860 }, reducedMotion: "reduce" });
const page = await context.newPage();
for (const [name, css] of Object.entries(palettes)) {
  await page.goto(`${base}/es`, { waitUntil: "networkidle" });
  if (css) await page.addStyleTag({ content: css });
  await page.evaluate(() => (document.documentElement.style.scrollBehavior = "auto"));
  await page.waitForSelector('[data-testid="hero-model-viewer"][data-status="ready"]', { timeout: 40000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(out, `${name}-1-hero.png`) });
  await page.evaluate(() => [...document.querySelectorAll("h2")].find((h) => /Control/i.test(h.textContent))?.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(3500);
  await page.screenshot({ path: path.join(out, `${name}-2-control.png`) });
}
await browser.close();
console.log("ok");
