// Quick desktop screenshots of chosen paths. Usage: node scripts/shot-quick.mjs <baseUrl> <name:path> ...
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
const [base, ...items] = process.argv.slice(2);
const out = path.join(process.cwd(), "docs", "screenshots", "violet");
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1280, height: 860 }, reducedMotion: "reduce" })).newPage();
for (const it of items) {
  const [name, p] = it.split(":");
  await page.goto(`${base}${p}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: path.join(out, `${name}.png`) });
}
await browser.close();
console.log("ok");
