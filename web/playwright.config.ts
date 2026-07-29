import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

/**
 * Base URL is overridden by BASE_URL env var in CI / staging, or defaults
 * to local dev. When webServer is set below, Playwright starts `next dev`
 * itself so the dev server doesn't need to be running beforehand.
 */
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

// e2e runs get their own backend + database (vinaadi_e2e on the test Postgres
// container, port 5433) instead of reusing whatever backend is already
// running for local dev. That backend defaults to vinaadi_dev — e2e specs
// register throwaway @e2e.test accounts on every run, and those rows used to
// accumulate in vinaadi_dev forever, inflating the admin dashboard's user and
// family-vault counts (227 stray users / 81 stray family vaults found
// 2026-07-28). See scripts/e2e-backend.ps1.
const E2E_BACKEND_PORT = 8010;
const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ?? "postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_e2e";

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
    webServer: [
      {
        // Dedicated backend on vinaadi_e2e — deliberately NOT the backend
        // that dev.ps1 starts against vinaadi_dev.
        command: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/e2e-backend.ps1 -Port ${E2E_BACKEND_PORT} -DatabaseUrl "${E2E_DATABASE_URL}"`,
        url: `http://127.0.0.1:${E2E_BACKEND_PORT}/health`,
        cwd: REPO_ROOT,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
      {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: { BACKEND_URL: `http://127.0.0.1:${E2E_BACKEND_PORT}` },
      },
    ],
  }),
});