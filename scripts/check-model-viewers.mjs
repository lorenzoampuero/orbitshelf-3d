// Opens /dev/models?model=<slug> for every model and waits for the live viewer to report "ready" (dev server on :3000).
import { chromium } from "@playwright/test";
import manifest from "../src/content/models-manifest.json" with { type: "json" };

const base = process.env.BASE ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "chrome" });
const failures = [];
for (const level of ["web", "card"]) {
  for (const m of manifest) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));
    await page.goto(`${base}/dev/models?model=${m.slug}&level=${level}`, { waitUntil: "domcontentloaded" });
    const viewer = page.getByTestId("dev-model-viewer");
    try {
      await viewer.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('[data-testid="dev-model-viewer"]')?.getAttribute("data-status") === "ready", null, { timeout: 40000 });
    } catch {
      const status = await viewer.getAttribute("data-status").catch(() => "missing");
      failures.push(`${level} ${m.slug}: status ${status} ${errors.slice(0, 1).join("|")}`);
    }
    await ctx.close();
  }
}
await browser.close();
console.log(failures.length ? `FAILED\n${failures.join("\n")}` : `all ${manifest.length * 2} GLBs ready`);
process.exit(failures.length ? 1 : 0);
