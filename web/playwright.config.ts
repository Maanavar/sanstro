import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

// The e2e frontend runs on its own port, NOT dev's :3000. `reuseExistingServer`
// is true outside CI, so sharing a port with `dev.ps1` meant Playwright reused
// the dev server whenever it happened to be up — and a reused server keeps the
// environment it was started with, so the `env: { BACKEND_URL }` below was
// silently dropped and the specs wrote to vinaadi_dev. A distinct port means
// the only thing that can be reused here is another e2e frontend. See
// e2e/global-setup.ts, which refuses to run if the proxy still lands on the
// wrong backend.
const E2E_FRONTEND_PORT = 3100;

/**
 * Base URL is overridden by BASE_URL env var in CI / staging, or defaults
 * to the dedicated e2e frontend. When webServer is set below, Playwright
 * starts the isolated copy-based stack so nothing needs to be running beforehand.
 */
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${E2E_FRONTEND_PORT}`;

// e2e runs get their own backend + database (vinaadi_e2e on the test Postgres
// container, port 5433) instead of reusing whatever backend is already
// running for local dev. That backend defaults to vinaadi_dev — e2e specs
// register throwaway @e2e.test accounts on every run, and those rows used to
// accumulate in vinaadi_dev forever, inflating the admin dashboard's user and
// family-vault counts (227 stray users / 81 stray family vaults found
// 2026-07-28). See scripts/e2e-backend.ps1.
const E2E_BACKEND_PORT = 8010;
export default defineConfig({
  testDir: ".",
  testMatch: ["e2e/**/*.spec.ts", "tests/**/*.spec.ts"],
  // Proves the stack under test is the isolated one before any spec writes to it.
  globalSetup: "./e2e/global-setup.ts",
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
  // Only spin up the isolated stack when not pointing at a real environment.
  // Set BASE_URL in CI to point at a preview deploy to skip this block.
  ...(!process.env.BASE_URL && {
    webServer: {
      // The stack copies web/ before starting next dev, so Playwright cannot
      // clean the owner's web/.next on :3000. The same action starts the
      // dedicated backend and keeps both processes alive until Playwright
      // stops this command.
      command: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\\ux-audit-stack.ps1 -Action serve -FrontendPort ${E2E_FRONTEND_PORT} -BackendPort ${E2E_BACKEND_PORT}`,
      // Ready means the proxy reaches the backend, not just that next dev
      // answers: global-setup fails hard if /api/backend/health is not up yet.
      url: `http://localhost:${E2E_FRONTEND_PORT}/api/backend/health`,
      cwd: REPO_ROOT,
      reuseExistingServer: false,
      // The stack waits up to 300s for the proxy after copying web/; a shorter
      // limit here kills a cold start that would have succeeded.
      timeout: 360_000,
    },
  }),
});
