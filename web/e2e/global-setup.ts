/**
 * Refuses to run a single spec until the frontend under test is proven to be
 * proxying to the dedicated e2e backend.
 *
 * The 2026-07-28 isolation fix (dedicated `vinaadi_e2e` DB on its own backend
 * port) was procedural, not structural, and it had a hole. Playwright's
 * `reuseExistingServer` is true outside CI, so whenever a dev server was
 * already listening on the e2e frontend port, Playwright reused it and the
 * `webServer` entry's `env: { BACKEND_URL }` was silently never applied — a
 * reused server keeps the environment it was originally started with. That
 * server reads `web/.env.local` (`BACKEND_URL=http://127.0.0.1:8000`), so the
 * throwaway `@e2e.test` accounts these specs register went straight back into
 * `vinaadi_dev`: exactly the pollution the fix was written to stop, with the
 * dedicated backend running and unused beside it.
 *
 * Two changes close it. The e2e frontend now has its own port, so a dev server
 * on :3000 can no longer be mistaken for it. And this check verifies the
 * property that actually matters — not "did we pass the right env" but "does
 * the running app reach the right backend" — which also catches a stale
 * BASE_URL, a hand-started server, and a reused server from an older config.
 *
 * The signal is `GET /health`'s `environment` field, set to "e2e" by
 * `scripts/e2e-backend.ps1`. It is requested *through the frontend proxy*
 * rather than directly, because the proxy is the exact hop that was wrong.
 * Asking the backend directly would have passed happily while the browser
 * talked to the dev DB.
 */
import type { FullConfig } from "@playwright/test";

const EXPECTED_ENVIRONMENT = "e2e";

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL;
  if (!baseURL) throw new Error("No baseURL configured — cannot verify e2e isolation.");

  // Deliberately not caught-and-warned. A run that cannot prove its isolation
  // must not proceed: the cost of being wrong is silent writes to the real dev
  // database, which is unnoticed until the admin counts look absurd weeks later.
  const target = new URL("/api/backend/health", baseURL);
  let response: Response;
  try {
    response = await fetch(target, { headers: { accept: "application/json" } });
  } catch (cause) {
    throw new Error(
      `Could not reach ${target} to verify e2e isolation. Is the e2e stack up?\n` +
        `Run Playwright without a preexisting server on that port so it can start its own.`,
      { cause },
    );
  }

  if (!response.ok) {
    throw new Error(
      `${target} answered ${response.status} while verifying e2e isolation. ` +
        `Expected the backend health route through the frontend proxy.`,
    );
  }

  const body = (await response.json()) as { environment?: string };
  if (body.environment !== EXPECTED_ENVIRONMENT) {
    throw new Error(
      `REFUSING TO RUN: ${baseURL} proxies to a backend reporting ` +
        `environment="${body.environment}", not "${EXPECTED_ENVIRONMENT}".\n\n` +
        `That backend is almost certainly the dev one on :8000, which is backed by ` +
        `vinaadi_dev — the real database. These specs register throwaway @e2e.test ` +
        `accounts, and running them here would pollute it (227 stray users had ` +
        `accumulated this way by 2026-07-28).\n\n` +
        `Most likely cause: a server was already listening on the e2e frontend port, ` +
        `so Playwright reused it instead of starting one with BACKEND_URL pointed at ` +
        `the e2e backend. Stop that server and re-run, or unset BASE_URL if you set it.`,
    );
  }
}
