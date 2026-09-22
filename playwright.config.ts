import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "pilot-browser-smoke.test.ts",
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:3217",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "npm run dev -- --webpack --hostname 127.0.0.1 --port 3217",
    url: "http://127.0.0.1:3217/fr",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      PILOT_TELEMETRY_SECRET: "playwright-only-pilot-secret",
    },
  },
});
