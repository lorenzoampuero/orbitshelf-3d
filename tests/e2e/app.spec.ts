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
    await expect(page.locator("h1")).toContainText("Dale a cada producto otra dimensión");

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
});
