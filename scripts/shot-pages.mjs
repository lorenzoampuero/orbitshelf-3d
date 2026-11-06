// Full-page screenshots of the public pages for design review.
// Usage: node scripts/shot-pages.mjs <baseUrl> [outDir]   (needs `next start -p 3101` after `npm run build`)
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const base = process.argv[2] ?? "http://127.0.0.1:3101";
const out = process.argv[3] ?? path.join(process.cwd(), "docs", "screenshots", "pages");
await mkdir(out, { recursive: true });

const pages = [
  ["home", "/es"],
  ["features", "/es/features"],
  ["feature-image", "/es/features/image-to-3d"],
  ["feature-text", "/es/features/text-to-3d"],
  ["feature-multi", "/es/features/multi-image-to-3d"],
  ["solutions", "/es/solutions"],
  ["solutions-stores", "/es/solutions/stores"],
  ["solutions-games", "/es/solutions/games"],
  ["solutions-design", "/es/solutions/design"],
  ["integrations", "/es/integrations"],
  ["pricing", "/es/pricing"],
  ["how-it-works", "/es/how-it-works"],
  ["examples", "/es/examples"],
  ["resources", "/es/resources"],
  ["compare", "/es/compare/ai-3d-vs-manual"],
  ["login", "/es/login"],
];

const browser = await chromium.launch();
for (const [suffix, width, height] of [["desktop", 1280, 860], ["mobile", 390, 844]]) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
  const page = await context.newPage();
  for (const [name, url] of pages) {
    await page.goto(`${base}${url}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(out, `${name}-${suffix}.png`), fullPage: true });
  }
  // Open menus on desktop to check the dropdown panels.
  if (suffix === "desktop") {
    await page.goto(`${base}/es`, { waitUntil: "networkidle" });
    for (const label of ["Producto", "Soluciones", "Recursos"]) {
      await page.getByRole("button", { name: label }).click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(out, `menu-${label.toLowerCase()}-desktop.png`) });
      await page.keyboard.press("Escape");
    }
  }
  await context.close();
}
await browser.close();
console.log("ok");
