/**
 * Critical-path e2e tests (Phase 5.2).
 *
 * These cover the two most important user journeys:
 *   1. Guest — public pages and the embeddable widget load without auth.
 *   2. Auth   — login → /dashboard renders; redirects work for unauthenticated access.
 *
 * Run locally:  cd web && npx playwright test
 * Run in CI:    BASE_URL=https://staging.vinaadi.ai npx playwright test
 *
 * For the auth journeys, set TEST_USER_EMAIL + TEST_USER_PASSWORD in the env
 * or in a `.env.test` file. If unset those tests are skipped.
 */
import { test, expect } from "@playwright/test";

const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? "";
const TEST_PASS = process.env.TEST_USER_PASSWORD ?? "";
const hasCredentials = TEST_EMAIL.length > 0 && TEST_PASS.length > 0;

// ---------------------------------------------------------------------------
// Guest journeys — no auth required
// ---------------------------------------------------------------------------

test.describe("Guest — public pages", () => {
  test("home page loads and shows marketing content", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Vinaadi/i);
    // Page should render without a JS crash (no console errors for uncaught exceptions).
    const errors: string[] = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.waitForLoadState("networkidle");
    expect(errors).toHaveLength(0);
  });

  test("login page renders the sign-in form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("input[type='email'], input[name='email']")).toBeVisible();
    await expect(page.locator("input[type='password'], input[name='password']")).toBeVisible();
  });

  test("/dashboard redirects unauthenticated visitors to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("/admin redirects unauthenticated visitors to /login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Guest — widget", () => {
  test("panchangam widget renders panchangam data", async ({ page }) => {
    await page.goto("/widget/panchangam");
    // Widget shows loading state, then resolves to panchangam content.
    // Look for tithi / vakara / nakshatra labels which are always present.
    await expect(
      page.getByText(/tithi|திதி/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});

// ---------------------------------------------------------------------------
// Authenticated journeys — require TEST_USER_EMAIL + TEST_USER_PASSWORD
// ---------------------------------------------------------------------------

test.describe("Auth — login and dashboard", () => {
  test.skip(!hasCredentials, "TEST_USER_EMAIL / TEST_USER_PASSWORD not set — skipping auth journeys");

  test("user can log in and reach /dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.locator("input[type='email'], input[name='email']").fill(TEST_EMAIL);
    await page.locator("input[type='password'], input[name='password']").fill(TEST_PASS);
    await page.locator("button[type='submit']").click();

    // Expect redirect to dashboard after successful login.
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    // At least one tab / nav element should be visible.
    await expect(page.locator("[data-testid='dashboard'], nav, main").first()).toBeVisible();
  });

  test("authenticated user sees dashboard content without JS errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", e => errors.push(e.message));

    // Log in first.
    await page.goto("/login");
    await page.locator("input[type='email'], input[name='email']").fill(TEST_EMAIL);
    await page.locator("input[type='password'], input[name='password']").fill(TEST_PASS);
    await page.locator("button[type='submit']").click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    // Wait for interactive content.
    await page.waitForLoadState("networkidle");
    expect(errors).toHaveLength(0);
  });
});
