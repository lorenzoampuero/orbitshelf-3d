import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "off",
    channel: "chrome",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
  webServer: [
    {
      command: "npx tsx tests/e2e/mock-sloyd.ts",
      url: "http://127.0.0.1:3999/health",
      reuseExistingServer: false,
      timeout: 20_000,
    },
    {
      command: "npx next start -p 3100 -H 127.0.0.1",
      url: "http://127.0.0.1:3100/api/health",
      reuseExistingServer: false,
      timeout: 30_000,
      env: {
        ...process.env,
        NODE_ENV: "production",
        ALLOW_LOCAL_AUTH: "true",
        AUTH_MODE: "local",
        SESSION_SECRET: "playwright-e2e-session-secret-32-chars-minimum",
        SLOYD_CLIENT_ID: "test-client-id-secret-check",
        SLOYD_CLIENT_SECRET: "test-client-secret-never-leak",
        SLOYD_API_BASE_URL: "http://127.0.0.1:3999/api",
        SLOYD_RESULT_BASE_URL: "http://127.0.0.1:3999/results/",
        ORBITSHELF_TEST: "1",
        FAL_KEY: "test-fal-key-never-leak",
        FAL_QUEUE_BASE_URL: "http://127.0.0.1:3999/fal",
        FAL_RESULT_HOSTS: "127.0.0.1",
        ENGINES_ENABLED: "fal-rodin-2.5",
        SHOPIFY_CLIENT_ID: "test-shopify-client",
        SHOPIFY_CLIENT_SECRET: "test-shopify-secret-never-leak",
        INTEGRATIONS_KEY: "test-integrations-key-32-characters-long",
        SHOPIFY_TEST_BASE: "http://127.0.0.1:3999/shopify",
        LOCAL_PAID_ATTEMPT_CAP: "5",
        MAX_ACTIVE_JOBS_PER_ORG: "3",
        DATA_DIR: ".data-e2e",
      },
    },
  ],
});
