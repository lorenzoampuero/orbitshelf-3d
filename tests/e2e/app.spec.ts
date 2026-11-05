import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import sharp from "sharp";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

const SCREENSHOT_DIR = path.join(process.cwd(), "docs", "screenshots");

test.beforeAll(async () => {
  await rm(path.join(process.cwd(), ".data-e2e"), { recursive: true, force: true }).catch(() => {});
  await mkdir(SCREENSHOT_DIR, { recursive: true });
});

async function makeTestPng(width = 300, height = 300): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 46, g: 211, b: 183 },
    },
  })
    .png()
    .toBuffer();
}

test.describe("OrbitShelf 3D — Full E2E, API, Security, i18n, and Accessibility Suite", () => {
  test("1. Marketing home (desktop + mobile), SEO metadata, hreflang, and Spanish (/es) routes", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 840 });
    await page.goto("/");

    await expect(page).toHaveTitle(/OrbitShelf 3D/i);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toBeTruthy();

    const hreflangEn = await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute("href");
    const hreflangEs = await page.locator('link[rel="alternate"][hreflang="es"]').getAttribute("href");
    expect(hreflangEn).toBeTruthy();
    expect(hreflangEs).toContain("/es");

    // Wait for Hero 3D viewer to validate GLB and reach ready state
    const viewer = page.getByTestId("hero-model-viewer");
    await expect(viewer).toHaveAttribute("data-status", "ready");

    // Verify pointer drag updates camera orbit
    const initialOrbit = await viewer.getAttribute("data-orbit");
    const box = await viewer.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 - 30, { steps: 5 });
      await page.mouse.up();
    }
    const afterOrbit = await viewer.getAttribute("data-orbit");
    expect(afterOrbit).not.toEqual(initialOrbit);

    // Screenshot: Desktop Home
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01-home-desktop.png"), fullPage: false });

    // Accessibility check on Home
    const a11yHome = await new AxeBuilder({ page })
      .exclude("model-viewer")
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(a11yHome.violations).toEqual([]);

    // Mobile viewport screenshot & layout check
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByTestId("hero-model-viewer")).toHaveAttribute("data-status", "ready");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "02-home-mobile.png"), fullPage: false });

    // Check Spanish routes (/es, /es/pricing, /es/compare/ai-3d-vs-manual, /es/resources)
    await page.setViewportSize({ width: 1280, height: 840 });
    await page.goto("/es");
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.locator("h1")).toContainText("Una foto muestra un ángulo");

    await page.goto("/es/pricing");
    await expect(page.locator("h1")).toContainText("Planes por intentos, sin promesas de ilimitado");

    await page.goto("/es/compare/ai-3d-vs-manual");
    await expect(page.locator("h1")).toContainText("Imagen a 3D con IA vs modelado 3D manual");
  });

  test("2. API Security: unauthorized access (401), CSRF cross-site rejection (403), secret non-leakage", async ({
    request,
  }) => {
    const healthRes = await request.get("/api/health");
    expect(healthRes.status()).toBe(200);
    const healthBody = await healthRes.text();
    expect(healthBody).not.toContain("test-client-secret-never-leak");
    expect(healthBody).not.toContain("test-client-id-secret-check");

    // Unauthenticated API access must return 401
    const modelsUnauth = await request.get("/api/models");
    expect(modelsUnauth.status()).toBe(401);

    const createUnauth = await request.post("/api/models", {
      data: { source: "demo", title: "Test", category: "home-decor", demoAsset: "vase" },
    });
    expect(createUnauth.status()).toBe(401);

    // Cross-site Origin must be rejected with 403
    const csrfAttempt = await request.post("/api/models", {
      headers: {
        Origin: "https://evil.example.com",
        "Sec-Fetch-Site": "cross-site",
      },
      data: { source: "demo", title: "CSRF", category: "home-decor", demoAsset: "vase" },
    });
    expect(csrfAttempt.status()).toBe(403);
  });

  test("3. End-to-End Demo Workflow: Login -> Create Demo -> Persist -> Review & Approve -> GLB & CSV Download -> Delete", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 840 });
    await page.goto("/login");

    await page.fill("#login-email", "alice@merchant.test");
    await page.getByTestId("login-submit").click();
    await page.waitForURL("**/dashboard");

    // Sidebar collapse keyboard accessibility check
    const collapseBtn = page.getByTestId("sidebar-collapse-btn");
    await collapseBtn.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("aside[data-collapsed]")).toHaveAttribute("data-collapsed", "true");
    await page.keyboard.press("Enter");
    await expect(page.locator("aside[data-collapsed]")).toHaveAttribute("data-collapsed", "false");

    // Navigate to Create 3D
    await page.goto("/dashboard/create");
    await expect(page.getByTestId("create-preview-viewer")).toHaveAttribute("data-status", "ready");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "03-create-wizard.png"), fullPage: false });

    await page.fill("#create-title", "Nordic Ceramic Vase");
    await page.fill("#create-sku", "NORDIC-01");
    await page.getByTestId("source-demo-radio").check();
    await page.getByTestId("create-submit-btn").click();

    await page.waitForURL("**/dashboard/models/*");
    const modelUrl = page.url();
    const modelId = modelUrl.split("/").pop()!;

    // Verify 3D Studio viewer loads the private model file
    await expect(page.getByTestId("studio-title")).toHaveText("Nordic Ceramic Vase");
    await expect(page.getByTestId("studio-viewer")).toHaveAttribute("data-status", "ready");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "04-studio-detail.png"), fullPage: false });

    // Approve button must be disabled until all 5 checklist items are checked
    const approveBtn = page.getByTestId("review-approve-btn");
    await expect(approveBtn).toBeDisabled();

    for (const key of ["shape", "surfaces", "hiddenAngles", "material", "labels"]) {
      await page.getByTestId(`checklist-${key}`).check();
    }
    await expect(approveBtn).toBeEnabled();
    await page.getByTestId("review-note-input").fill("Checked silhouette and bottom geometry.");
    await approveBtn.click();

    await expect(page.getByTestId("review-approved-banner")).toBeVisible();

    // Update user-supplied dimensions & metadata
    await page.fill("#meta-w", "140");
    await page.fill("#meta-h", "260");
    await page.fill("#meta-d", "140");
    await page.getByTestId("save-meta-btn").click();

    // Verify GLB binary download has glTF magic header
    const glbRes = await page.request.get(`/api/models/${modelId}/file?download=1`);
    expect(glbRes.status()).toBe(200);
    const glbBytes = await glbRes.body();
    expect(glbBytes.subarray(0, 4).toString("ascii")).toBe("glTF");

    // Reload and verify persistence in Dashboard & My Models library
    await page.goto("/dashboard");
    await expect(page.getByTestId("stat-total-models")).toHaveText("1");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "05-dashboard-overview.png"), fullPage: false });

    await page.goto("/dashboard/models");
    await expect(page.getByTestId(`model-card-${modelId}`)).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "06-models-library.png"), fullPage: false });

    // Search filter
    await page.getByTestId("library-search").fill("NON-EXISTENT-SKU");
    await expect(page.getByTestId(`model-card-${modelId}`)).toHaveCount(0);
    await page.getByTestId("library-search").fill("NORDIC-01");
    await expect(page.getByTestId(`model-card-${modelId}`)).toBeVisible();

    // CSV export
    const csvRes = await page.request.get("/api/export/jobs.csv");
    expect(csvRes.status()).toBe(200);
    const csvText = await csvRes.text();
    expect(csvText).toContain("Nordic Ceramic Vase");
    expect(csvText).toContain("demo-sample");

    // Delete model from library and confirm removal
    await page.getByTestId(`delete-model-${modelId}`).click();
    await page.getByTestId("confirm-delete-model").click();
    await expect(page.getByTestId(`model-card-${modelId}`)).toHaveCount(0);

    // File must be gone (404)
    const afterDelFile = await page.request.get(`/api/models/${modelId}/file`);
    expect(afterDelFile.status()).toBe(404);
  });

  test("4. Cross-Tenant Isolation: User B cannot view, modify, download, or delete User A's model", async ({
    browser,
  }) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();

    // User A signs in and creates a model
    const loginA = await ctxA.request.post("/api/auth/login", {
      data: { email: "tenant-a@merchant.test" },
    });
    expect(loginA.ok()).toBe(true);

    const createA = await ctxA.request.post("/api/models", {
      data: {
        source: "demo",
        title: "Tenant A Private Chair",
        sku: "CHAIR-A",
        category: "furniture",
        demoAsset: "chair",
      },
    });
    expect(createA.status()).toBe(201);
    const { model: modelA } = await createA.json();

    // User B signs in
    const loginB = await ctxB.request.post("/api/auth/login", {
      data: { email: "tenant-b@merchant.test" },
    });
    expect(loginB.ok()).toBe(true);

    // User B cannot see User A's model in list, detail, file download, patch, or delete
    const listB = await ctxB.request.get("/api/models");
    const { models: modelsB } = await listB.json();
    expect(modelsB).toHaveLength(0);

    expect((await ctxB.request.get(`/api/models/${modelA.id}`)).status()).toBe(404);
    expect((await ctxB.request.get(`/api/models/${modelA.id}/file`)).status()).toBe(404);
    expect(
      (
        await ctxB.request.patch(`/api/models/${modelA.id}`, {
          data: { title: "Hijacked" },
        })
      ).status(),
    ).toBe(404);
    expect((await ctxB.request.delete(`/api/models/${modelA.id}`)).status()).toBe(404);

    await ctxA.close();
    await ctxB.close();
  });

  test("5. Sloyd AI Provider Flow: Upload validation, async job polling -> GLB validation, 402 & error refunds", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 840 });
    await page.goto("/login");
    await page.fill("#login-email", "ai-tester@merchant.test");
    await page.getByTestId("login-submit").click();
    await page.waitForURL("**/dashboard");

    // Check initial attempts balance = 5 (from LOCAL_PAID_ATTEMPT_CAP=5)
    const usage0 = await (await page.request.get("/api/usage")).json();
    expect(usage0.usage.balance).toBe(5);

    // 5a. Reject SVG upload disguised as PNG
    await page.goto("/dashboard/create");
    await page.fill("#create-title", "Brushed Brass Lamp");
    await page.getByTestId("source-sloyd-radio").check();
    await page.getByTestId("confirm-paid-checkbox").check();
    await page.getByTestId("confirm-rights-checkbox").check();

    await page.getByTestId("create-photo-input").setInputFiles({
      name: "exploit.png",
      mimeType: "image/png",
      buffer: Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>"),
    });
    await page.getByTestId("create-submit-btn").click();
    await expect(page.getByTestId("create-error-alert")).toContainText(/SVG|not allowed|Unsupported/i);

    // Balance unchanged after rejected upload
    const usageAfterInvalid = await (await page.request.get("/api/usage")).json();
    expect(usageAfterInvalid.usage.balance).toBe(5);

    // 5b. Simulate Sloyd HTTP 402 Payment Required -> verify automatic refund of attempt
    await page.request.post("http://127.0.0.1:3999/__control", {
      data: { nextCreateStatus: 402 },
    });

    const validPng = await makeTestPng(320, 320);
    await page.getByTestId("create-photo-input").setInputFiles({
      name: "lamp-photo.png",
      mimeType: "image/png",
      buffer: validPng,
    });
    await page.getByTestId("create-submit-btn").click();
    await expect(page.getByTestId("create-error-alert")).toContainText(/prepaid credits|refunded/i);

    const usageAfter402 = await (await page.request.get("/api/usage")).json();
    expect(usageAfter402.usage.balance).toBe(5);
    expect(usageAfter402.usage.debited).toBe(1);
    expect(usageAfter402.usage.refunded).toBe(1);

    // 5c. Happy-path Sloyd AI job: upload PNG -> pending/running -> success -> GLB validated & viewable
    await page.fill("#create-title", "Brushed Brass Lamp");
    await page.fill("#create-sku", "LAMP-AI-01");
    await page.getByTestId("create-photo-input").setInputFiles({
      name: "lamp-photo.png",
      mimeType: "image/png",
      buffer: validPng,
    });
    await page.getByTestId("create-submit-btn").click();

    await page.waitForURL("**/dashboard/models/*");
    // Trigger refresh until status transitions from processing -> ready
    await expect(async () => {
      const refreshBtn = page.getByTestId("refresh-job-btn");
      if (await refreshBtn.isVisible()) {
        await refreshBtn.click();
      }
      await expect(page.getByTestId("studio-viewer")).toHaveAttribute("data-status", "ready", {
        timeout: 2500,
      });
    }).toPass({ timeout: 15_000 });

    // Source photo is displayed alongside the AI-generated 3D model
    await expect(page.getByTestId("studio-source-photo")).toBeVisible();

    // Balance is now 4 (1 net attempt used)
    const usageAfterSuccess = await (await page.request.get("/api/usage")).json();
    expect(usageAfterSuccess.usage.balance).toBe(4);

    // 5d. Async provider job failure -> automatic refund back to 4
    await page.request.post("http://127.0.0.1:3999/__control", {
      data: { nextJobOutcome: "error" },
    });
    await page.goto("/dashboard/create");
    await page.fill("#create-title", "Transparent Glass Bottle");
    await page.getByTestId("source-sloyd-radio").check();
    await page.getByTestId("confirm-paid-checkbox").check();
    await page.getByTestId("confirm-rights-checkbox").check();
    await page.getByTestId("create-photo-input").setInputFiles({
      name: "bottle.png",
      mimeType: "image/png",
      buffer: validPng,
    });
    await page.getByTestId("create-submit-btn").click();
    await page.waitForURL("**/dashboard/models/*");

    await expect(async () => {
      const refreshBtn = page.getByTestId("refresh-job-btn");
      if (await refreshBtn.isVisible()) {
        await refreshBtn.click();
      }
      await expect(page.getByTestId("job-failed-panel")).toBeVisible({ timeout: 2500 });
    }).toPass({ timeout: 15_000 });

    const usageAfterJobError = await (await page.request.get("/api/usage")).json();
    expect(usageAfterJobError.usage.balance).toBe(4);
  });

  test("6. Several photos: front + back + left go to the multi-image endpoint, one attempt, every photo shown in the studio", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 840 });
    await page.goto("/login");
    await page.fill("#login-email", "multi-photo@merchant.test");
    await page.getByTestId("login-submit").click();
    await page.waitForURL("**/dashboard");

    await page.goto("/dashboard/create");
    await page.fill("#create-title", "Grey Hoodie");
    await page.selectOption("#create-category", "apparel");
    await page.getByTestId("source-sloyd-radio").check();
    const png = await makeTestPng(320, 320);
    await page.getByTestId("create-photo-input").setInputFiles({ name: "front.png", mimeType: "image/png", buffer: png });
    // One photo costs 20 credits; adding views switches the estimate to the 30-credit multi-photo price.
    await expect(page.getByTestId("create-cost-text")).toContainText("US$0.27");
    await page.getByTestId("create-photo-input-back").setInputFiles({ name: "back.png", mimeType: "image/png", buffer: png });
    await page.getByTestId("create-photo-input-left").setInputFiles({ name: "left.png", mimeType: "image/png", buffer: png });
    await expect(page.getByTestId("create-cost-text")).toContainText("US$0.40");
    await page.getByTestId("confirm-paid-checkbox").check();
    await page.getByTestId("confirm-rights-checkbox").check();
    await page.getByTestId("create-submit-btn").click();
    await page.waitForURL("**/dashboard/models/*");

    const created = ((await (await page.request.get("http://127.0.0.1:3999/__created")).json()) as { created: { endpoint: string; parts: string[] }[] }).created;
    const call = created.filter((c) => c.endpoint === "multi-image-to-3d").at(-1);
    expect(call?.parts).toEqual(expect.arrayContaining(["frontImage", "backImage", "leftImage", "EnablePBR"]));
    expect(call?.parts).not.toContain("rightImage");

    await expect(async () => {
      const refreshBtn = page.getByTestId("refresh-job-btn");
      if (await refreshBtn.isVisible()) await refreshBtn.click();
      await expect(page.getByTestId("studio-viewer")).toHaveAttribute("data-status", "ready", { timeout: 2500 });
    }).toPass({ timeout: 15_000 });

    await expect(page.getByTestId("studio-source-photo")).toBeVisible();
    await expect(page.getByTestId("studio-source-photo-back")).toBeVisible();
    await expect(page.getByTestId("studio-source-photo-left")).toBeVisible();
    await expect(page.getByTestId("studio-source-photo-right")).toHaveCount(0);

    const usage = await (await page.request.get("/api/usage")).json();
    expect(usage.usage.debited).toBe(1); // one attempt, whatever the number of photos
  });

  test("6b. A second engine runs through the same flow: chosen engine, server quote, its own endpoint, stored result and event history", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 840 });
    await page.goto("/login");
    await page.fill("#login-email", "second-engine@merchant.test");
    await page.getByTestId("login-submit").click();
    await page.waitForURL("**/dashboard");

    // A disabled engine is refused by the server, whatever the client sends
    const refused = await page.request.post("/api/quotes", { data: { engineId: "fal-trellis-2", mode: "image", photoCount: 1, texture: "1k" } });
    expect(refused.status()).toBe(503);

    await page.goto("/dashboard/create");
    await page.fill("#create-title", "Oak Chair");
    await page.selectOption("#create-category", "furniture");
    await page.getByTestId("source-sloyd-radio").check();
    await expect(page.getByTestId("create-engine-select").locator("option")).toHaveCount(2); // Sloyd and the one piloted engine, no others
    await page.getByTestId("create-engine-select").selectOption("fal-rodin-2.5");
    const png = await makeTestPng(320, 320);
    await page.getByTestId("create-photo-input").setInputFiles({ name: "front.png", mimeType: "image/png", buffer: png });
    await page.getByTestId("create-photo-input-back").setInputFiles({ name: "back.png", mimeType: "image/png", buffer: png });
    await expect(page.getByTestId("create-cost-text")).toContainText("Rodin 2.5");
    await expect(page.getByTestId("create-cost-text")).toContainText("US$0.40");
    await page.getByTestId("confirm-paid-checkbox").check();
    await page.getByTestId("confirm-rights-checkbox").check();
    await page.getByTestId("create-submit-btn").click();
    await page.waitForURL("**/dashboard/models/*");

    const created = ((await (await page.request.get("http://127.0.0.1:3999/__created")).json()) as { created: { endpoint: string; parts: string[] }[] }).created;
    expect(created.filter((c) => c.endpoint === "fal/rodin-2.5").at(-1)?.parts).toEqual(["images:2", "format:glb"]);

    await expect(async () => {
      const refreshBtn = page.getByTestId("refresh-job-btn");
      if (await refreshBtn.isVisible()) await refreshBtn.click();
      await expect(page.getByTestId("studio-viewer")).toHaveAttribute("data-status", "ready", { timeout: 2500 });
    }).toPass({ timeout: 15_000 });

    // The provider key and queue URLs never reach the browser
    const id = page.url().split("/").at(-1)!;
    const body = await (await page.request.get(`/api/models/${id}`)).text();
    expect(body).not.toContain("test-fal-key-never-leak");
    expect(body).not.toContain("3999");
    expect(body).toContain('"engineId":"fal-rodin-2.5"');
    expect((JSON.parse(body).events as { state: string }[]).map((e) => e.state)).toEqual(["reserved", "queued", "running", "processing", "succeeded"]);
    await expect(page.getByTestId("studio-engine")).toHaveText("Rodin 2.5");
    expect((await (await page.request.get("/api/usage")).json()).usage.debited).toBe(1);
  });

  test("6c. Import a GLB for free, read its diagnostics, optimize to a new version, compare, use it, and export geometry", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/login");
    await page.fill("#login-email", "importer@merchant.test");
    await page.getByTestId("login-submit").click();
    await page.waitForURL("**/dashboard");

    // Something that is not a GLB is refused, and nothing is created
    const bad = await page.request.post("/api/models/import", {
      multipart: { title: "Bad", category: "other", rightsAffirmed: "true", file: { name: "x.glb", mimeType: "model/gltf-binary", buffer: Buffer.from("not a glb") } },
    });
    expect(bad.status()).toBe(422);
    expect((await (await page.request.get("/api/models")).json()).models).toHaveLength(0);

    await page.goto("/dashboard/create");
    await page.getByTestId("source-import-radio").check();
    await page.fill("#create-title", "Imported Lamp");
    await page.getByTestId("create-glb-input").setInputFiles(path.join(process.cwd(), "public", "demo", "lamp.glb"));
    await page.getByTestId("create-submit-btn").click();
    await expect(page.getByTestId("create-error-alert")).toBeVisible(); // rights not confirmed yet
    await page.getByTestId("confirm-rights-checkbox").check();
    await page.getByTestId("create-submit-btn").click();
    await page.waitForURL("**/dashboard/models/*");

    // It keeps saying it was imported, and it cost no attempt
    const id = page.url().split("/").at(-1)!;
    const created = (await (await page.request.get(`/api/models/${id}`)).json()).model;
    expect(created.source).toBe("import");
    expect(created.provenance).toBe("imported");
    expect((await (await page.request.get("/api/usage")).json()).usage.debited).toBe(0);

    // The library's picture is a real render of this model, taken once it is on screen
    await expect(async () => {
      expect((await (await page.request.get(`/api/models/${id}`)).json()).model.hasThumbnail).toBe(true);
    }).toPass({ timeout: 15_000 });
    const thumb = await page.request.get(`/api/models/${id}/thumbnail`);
    expect(thumb.status()).toBe(200);
    expect(thumb.headers()["content-type"]).toMatch(/^image\//);
    const stats = await sharp(await thumb.body()).stats();
    expect(stats.channels.some((c) => c.stdev > 1)).toBe(true); // not a blank image

    // Diagnostics are measured from the file
    await expect(page.getByTestId("tools-metrics")).toBeVisible();
    await expect(page.getByTestId("preset-web-result")).toBeVisible();
    await expect(page.getByTestId("version-original")).toContainText("In use");

    // Approving, then changing the file, sends the review back to pending
    await page.getByTestId("optimize-store-btn").click();
    await expect(page.getByTestId("version-store")).toBeVisible();
    await page.getByTestId("compare-version-store").click();
    await expect(page.getByTestId("compare-panel")).toBeVisible();
    await page.request.post(`/api/models/${id}/review`, {
      data: { decision: "approve", checklist: { shape: true, surfaces: true, hiddenAngles: true, material: true, labels: true }, note: null },
    });
    expect((await (await page.request.get(`/api/models/${id}`)).json()).model.reviewState).toBe("approved");
    await page.getByTestId("use-version-store").click();
    await expect(page.getByTestId("version-store")).toContainText("In use");
    expect((await (await page.request.get(`/api/models/${id}`)).json()).model.reviewState).toBe("pending");

    // The original stays, and it and the version in use cannot be deleted
    const versions = (await (await page.request.get(`/api/models/${id}/versions`)).json()).versions as { id: string; preset: string; current: boolean }[];
    expect(versions.map((v) => v.preset)).toEqual(["original", "store"]);
    for (const v of versions) expect((await page.request.delete(`/api/models/${id}/versions/${v.id}`)).status()).toBe(409);

    // Back to the original
    await page.getByTestId("use-version-original").click();
    await expect(page.getByTestId("version-original")).toContainText("In use");
    await page.getByTestId("delete-version-store").click();
    await expect(page.getByTestId("version-store")).toHaveCount(0);

    // Exports are real files
    const stl = await page.request.get(`/api/models/${id}/export?format=stl`);
    expect(stl.status()).toBe(200);
    const body = await stl.body();
    expect(body.length).toBe(84 + body.readUInt32LE(80) * 50);
    expect((await page.request.get(`/api/models/${id}/export?format=obj`)).status()).toBe(200);
    expect((await page.request.get(`/api/models/${id}/export?format=exe`)).status()).toBe(422);

    // Another workspace sees none of it
    await page.request.post("/api/auth/logout");
    await page.goto("/login");
    await page.fill("#login-email", "someone-else@merchant.test");
    await page.getByTestId("login-submit").click();
    await page.waitForURL("**/dashboard");
    expect((await page.request.get(`/api/models/${id}/versions`)).status()).toBe(404);
    expect((await page.request.get(`/api/models/${id}/export?format=stl`)).status()).toBe(404);
    expect((await page.request.get(`/api/models/${id}/file?version=${versions[0].id}`)).status()).toBe(404);
  });

  test("6d. Profiles: skip or answer, the dashboard reorders, tools stay reachable, and balance and projects do not change", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const signIn = async (email: string) => {
      await page.goto("/login");
      await page.fill("#login-email", email);
      await page.getByTestId("login-submit").click();
      await page.waitForURL("**/dashboard");
    };

    await signIn("skipper@merchant.test");
    await page.getByTestId("profile-skip").click();
    await expect(page.getByTestId("onboarding-card")).toHaveCount(0);
    await page.reload();
    await expect(page.getByTestId("onboarding-card")).toHaveCount(0);
    await expect(page.getByTestId("shortcut-createPhotos")).toBeVisible();

    await page.request.post("/api/auth/logout");
    await signIn("profile@merchant.test");
    await page.request.post("/api/models", { data: { source: "demo", title: "Keep me", category: "other", demoAsset: "vase" } });
    const before = (await (await page.request.get("/api/usage")).json()).usage.balance;

    // A goal that does not belong to the use case is refused
    expect((await page.request.put("/api/me/profile", { data: { useCase: "explore", experience: "beginner", goal: "publish" } })).status()).toBe(422);
    // Nothing but preferences can be written here
    expect((await page.request.put("/api/me/profile", { data: { useCase: "game", experience: "advanced", goal: "text", balance: 999 } })).status()).toBe(422);

    await page.goto("/dashboard");
    await page.getByTestId("use-case-game").check();
    await page.getByTestId("experience-beginner").check();
    await page.getByTestId("goal-assets").check();
    await page.getByTestId("profile-save").click();
    await expect(page.getByTestId("onboarding-card")).toHaveCount(0);
    await expect(page.getByTestId("workspace-shortcuts").locator("a").first()).toHaveAttribute("href", /mode=import/);

    await page.getByTestId("workspace-select").selectOption("commerce");
    await expect(page.getByTestId("workspace-shortcuts").locator("a").nth(1)).toHaveAttribute("href", /mode=photos/);

    // The wizard follows the workspace and goal, and manual controls appear only in Advanced
    await page.goto("/dashboard/create?mode=photos");
    await expect(page.getByTestId("preset-radio-studio")).toBeChecked();
    await expect(page.getByTestId("create-engine-select")).toHaveCount(0);
    await expect(page.getByTestId("create-cost-text")).toContainText("Sloyd");
    await page.getByTestId("preset-radio-advanced").check();
    await expect(page.getByTestId("create-engine-select")).toBeVisible();

    // Every tool stays reachable; an engine not validated says so instead of being offered
    await page.goto("/dashboard/explore");
    await expect(page.getByTestId("explore-tool-import")).toBeVisible();
    await expect(page.getByTestId("explore-engine-status-sloyd")).toHaveText("Available");
    await expect(page.getByTestId("explore-engine-status-fal-trellis-2")).toHaveText("Not available yet");
    const a11y = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(a11y.violations.map((v) => v.id)).toEqual([]);

    // Editable from Settings, and nothing else moved
    await page.goto("/dashboard/settings");
    await expect(page.getByTestId("use-case-game")).toBeChecked();
    await page.getByTestId("use-case-pro").check();
    await page.getByTestId("goal-text").check();
    await page.getByTestId("profile-save").click();
    await expect(page.getByTestId("profile-saved")).toBeVisible();
    expect((await (await page.request.get("/api/usage")).json()).usage.balance).toBe(before);
    expect((await (await page.request.get("/api/models")).json()).models).toHaveLength(1);
  });

  test("6e. Library and public viewer: tags, projects, favorites, trash, and a viewer that only lives while approved and not revoked", async ({ page, request }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/login");
    await page.fill("#login-email", "publisher@merchant.test");
    await page.getByTestId("login-submit").click();
    await page.waitForURL("**/dashboard");

    const made = await (await page.request.post("/api/models", { data: { source: "demo", title: "Published Vase", category: "home-decor", demoAsset: "vase" } })).json();
    const id = made.model.id as string;

    // Project, tags and favorite
    const project = (await (await page.request.post("/api/projects", { data: { name: "Winter" } })).json()).project;
    expect((await page.request.patch(`/api/models/${id}`, { data: { projectId: "00000000-0000-4000-8000-000000000000" } })).status()).toBe(422);
    expect((await page.request.patch(`/api/models/${id}`, { data: { projectId: project.id, tags: ["vase", "vase", "ceramic"], favorite: true } })).ok()).toBe(true);
    expect((await (await page.request.get(`/api/models/${id}`)).json()).model).toMatchObject({ projectId: project.id, tags: ["vase", "ceramic"], favorite: true });
    await page.goto("/dashboard/models");
    await page.getByTestId("library-filter-tag").selectOption("ceramic");
    await expect(page.getByTestId(`model-card-${id}`)).toBeVisible();
    await page.getByTestId("library-filter-project").selectOption(project.id);
    await expect(page.getByTestId(`model-card-${id}`)).toBeVisible();

    // Only an approved model can be published
    expect((await page.request.post("/api/embeds", { data: { modelId: id, allowedDomains: [] } })).status()).toBe(409);
    await page.goto("/dashboard/embeds");
    await expect(page.getByTestId("embeds-none-approved")).toBeVisible();

    const checklist = { shape: true, surfaces: true, hiddenAngles: true, material: true, labels: true };
    await page.request.post(`/api/models/${id}/review`, { data: { decision: "approve", checklist, note: null } });
    expect((await page.request.post("/api/embeds", { data: { modelId: id, allowedDomains: ["not a domain!"] } })).status()).toBe(422);

    await page.goto("/dashboard/embeds");
    await page.getByTestId("embed-domains-input").fill("https://www.MiTienda.cl/producto");
    await page.getByTestId("embed-create-btn").click();
    await expect(page.getByTestId("embed-snippet")).toContainText("<iframe");
    const embed = (await (await page.request.get("/api/embeds")).json()).embeds[0];
    expect(embed.allowedDomains).toEqual(["www.mitienda.cl"]);

    // Public, with no session: only the listed sites may frame it, and it says what it is
    const view = await request.get(`/embed/${embed.token}`, { headers: { cookie: "" } });
    expect(view.status()).toBe(200);
    const csp = view.headers()["content-security-policy"];
    expect(csp).toContain("frame-ancestors https://www.mitienda.cl https://*.www.mitienda.cl");
    expect(view.headers()["x-frame-options"]).toBeUndefined();
    expect(view.headers()["x-robots-tag"]).toBe("noindex");
    expect(await view.text()).toContain("Sample 3D model.");
    const file = await request.get(`/api/public/embed/${embed.token}/file`, { headers: { cookie: "" } });
    expect(file.status()).toBe(200);
    expect((await file.body()).subarray(0, 4).toString()).toBe("glTF");
    expect((await request.get(`/api/public/embed/${embed.token}/file`, { headers: { cookie: "", referer: "https://evil.test/x" } })).status()).toBe(403);
    expect((await request.get(`/api/public/embed/${embed.token}/file`, { headers: { cookie: "", referer: "https://www.mitienda.cl/p/1" } })).status()).toBe(200);
    expect((await request.get("/embed/unknown-token-unknown-token-unknown")).status()).toBe(404);

    // The viewer actually draws the model
    await page.goto(`/embed/${embed.token}`);
    await page.waitForFunction(() => (document.querySelector("model-viewer") as (HTMLElement & { loaded?: boolean }) | null)?.loaded === true, undefined, { timeout: 15_000 });

    // Rejecting ends it; approving again brings it back
    await page.goto("/dashboard/models");
    await page.request.post(`/api/models/${id}/review`, { data: { decision: "reject", checklist, note: null } });
    expect((await request.get(`/embed/${embed.token}`)).status()).toBe(404);
    await page.request.post(`/api/models/${id}/review`, { data: { decision: "approve", checklist, note: null } });
    expect((await request.get(`/embed/${embed.token}`)).status()).toBe(200);

    // Revoking ends it for good
    await page.goto("/dashboard/embeds");
    await page.getByTestId("embed-revoke-btn").click();
    await expect(page.getByTestId("embed-snippet")).toHaveCount(0);
    expect((await request.get(`/embed/${embed.token}`)).status()).toBe(404);

    // Trash: hidden, public links stop, restorable, and only then deletable for good
    const second = (await (await page.request.post("/api/embeds", { data: { modelId: id, allowedDomains: [] } })).json()).embed;
    expect((await request.get(`/embed/${second.token}`)).status()).toBe(200);
    expect((await page.request.delete(`/api/models/${id}?permanent=1`)).status()).toBe(404); // not in the trash yet
    expect((await page.request.delete(`/api/models/${id}`)).ok()).toBe(true);
    expect((await page.request.get(`/api/models/${id}`)).status()).toBe(404);
    expect((await request.get(`/embed/${second.token}`)).status()).toBe(404);
    await page.goto("/dashboard/models/trash");
    await page.getByTestId(`trash-restore-${id}`).click();
    await expect(page.getByTestId("trash-empty")).toBeVisible();
    expect((await page.request.get(`/api/models/${id}`)).ok()).toBe(true);
    expect((await request.get(`/embed/${second.token}`)).status()).toBe(404); // restoring does not publish again
    await page.request.delete(`/api/models/${id}`);
    await page.reload();
    await page.getByTestId(`trash-purge-${id}`).click();
    await expect(page.getByTestId("trash-empty")).toBeVisible();
    expect((await (await page.request.get("/api/models/trash")).json()).models).toHaveLength(0);
    expect((await (await page.request.get("/api/projects")).json()).projects).toHaveLength(1);
  });

  test("7. Text to 3D: prompt validation, text endpoint, prompt shown in the studio, and a refund when the provider refuses", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 840 });
    await page.goto("/login");
    await page.fill("#login-email", "text-to-3d@merchant.test");
    await page.getByTestId("login-submit").click();
    await page.waitForURL("**/dashboard");

    await page.goto("/dashboard/create");
    await page.fill("#create-title", "Low-poly fox");
    await page.getByTestId("source-text-radio").check();
    await page.getByTestId("confirm-paid-checkbox").check();
    await page.getByTestId("confirm-rights-checkbox").check();

    // Too-short prompt is refused before anything is charged
    await page.getByTestId("create-prompt-input").fill("fox");
    await page.getByTestId("create-submit-btn").click();
    await expect(page.getByTestId("create-error-alert")).toContainText(/10 characters|10 caracteres/);
    expect((await (await page.request.get("/api/usage")).json()).usage.debited).toBe(0);

    // Provider refuses at creation: attempt is refunded
    await page.request.post("http://127.0.0.1:3999/__control", { data: { nextCreateStatus: 402 } });
    await page.getByTestId("create-prompt-input").fill("A low-poly red fox sitting, stylized");
    await page.getByTestId("create-submit-btn").click();
    await expect(page.getByTestId("create-error-alert")).toContainText(/prepaid credits|refunded/i);
    const afterRefusal = (await (await page.request.get("/api/usage")).json()).usage;
    expect(afterRefusal.debited).toBe(1);
    expect(afterRefusal.refunded).toBe(1);

    // Happy path
    await page.getByTestId("create-submit-btn").click();
    await page.waitForURL("**/dashboard/models/*");
    const created = ((await (await page.request.get("http://127.0.0.1:3999/__created")).json()) as { created: { endpoint: string; prompt?: string }[] }).created;
    expect(created.filter((c) => c.endpoint === "text-to-3d").at(-1)?.prompt).toBe("A low-poly red fox sitting, stylized");

    await expect(async () => {
      const refreshBtn = page.getByTestId("refresh-job-btn");
      if (await refreshBtn.isVisible()) await refreshBtn.click();
      await expect(page.getByTestId("studio-viewer")).toHaveAttribute("data-status", "ready", { timeout: 2500 });
    }).toPass({ timeout: 15_000 });
    await expect(page.getByTestId("studio-prompt")).toContainText("low-poly red fox");
    await expect(page.getByTestId("studio-source-photo")).toHaveCount(0);
  });

  test("8. Marketing pages: accessible (axe), no horizontal overflow at 375 px, and no sub-12px text", async ({ page }) => {
    const paths = ["/", "/examples", "/how-it-works", "/pricing", "/resources", "/resources/photograph-clothing-for-3d", "/compare/ai-3d-vs-manual", "/privacy", "/es/examples", "/es/pricing"];
    for (const width of [1280, 375]) {
      await page.setViewportSize({ width, height: 840 });
      for (const p of paths) {
        await page.goto(p);
        await expect(page.locator("h1")).toHaveCount(1);
        const a11y = await new AxeBuilder({ page }).exclude("model-viewer").withTags(["wcag2a", "wcag2aa"]).analyze();
        expect(a11y.violations, `axe violations on ${p} at ${width}px`).toEqual([]);
        const metrics = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          small: [...document.querySelectorAll("main p, main li, main span, main a, main h1, main h2, main h3, main th, main td, main summary, main dd, main dt")]
            .filter((el) => el.children.length === 0 && (el.textContent ?? "").trim() && parseFloat(getComputedStyle(el).fontSize) < 12)
            .map((el) => (el.textContent ?? "").trim().slice(0, 40)),
        }));
        expect(metrics.overflow, `horizontal overflow on ${p} at ${width}px`).toBeLessThanOrEqual(0);
        expect(metrics.small, `text under 12px on ${p} at ${width}px`).toEqual([]);
      }
    }
  });
});
