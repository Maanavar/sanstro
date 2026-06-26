import { defineConfig, devices } from "@playwright/test";

/**
 * Base URL is overridden by BASE_URL env var in CI / staging, or defaults
 * to local dev. When webServer is set below, Playwright starts `next dev`
 * itself so the dev server doesn't need to be running beforehand.
 */
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: ".",
  testMatch: ["e2e/**/*.spec.ts", "tests/**/*.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "list" : "html",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-safari-visual",
      testMatch: "tests/visual/**/*.spec.ts",
      use: { ...devices["iPhone 15 Pro"] },
    },
    {
      name: "reduced-motion-visual",
      testMatch: "tests/visual/**/*.spec.ts",
      use: { ...devices["Desktop Chrome"], reducedMotion: "reduce" },
    },
  ],
  // Only spin up the dev server when not pointing at a real environment.
  // Set BASE_URL in CI to point at a preview deploy to skip this block.
  ...(!process.env.BASE_URL && {
    webServer: {
      command: "npm run dev",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  }),
});