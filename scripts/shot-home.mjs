// Takes full-page screenshots of the home for design review. Usage: node scripts/shot-home.mjs <baseUrl>
import { chromium } from "@playwright/test";
import path from "node:path";

const base = process.argv[2] ?? "http://127.0.0.1:3101";
const out = path.join(process.cwd(), "docs", "screenshots");

const browser = await chromium.launch();
for (const [name, width, height] of [["home-fullpage-desktop", 1280, 860], ["home-fullpage-mobile", 390, 844]]) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(`${base}/es`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="hero-model-viewer"][data-status="ready"]', { timeout: 20000 }).catch(() => {});
  await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true });
  await context.close();
}
await browser.close();
console.log("ok");
