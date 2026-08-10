/**
 * Regression for the bug `dashboard-render-pass.spec.ts` had to route around:
 * a user with no family vault (or a vault with no members) saw no chart at
 * all on Family & Charts — no D1/D9, no bhava table, no planet orbs, no
 * "Full technical reading" — because `reading` in
 * `dashboard-family-charts-hybrid.tsx` came only from `familyAggregate.members`,
 * which is empty until the vault has at least one member. `readingChartId`
 * already fell back to the owner's own chart id; `reading` (the loaded chart
 * object) did not.
 *
 * The fix falls back to `ownerMemberChart` — the owner's own reading, already
 * loaded independently of the family vault — whenever there is no member at
 * all. This spec creates a birth profile and deliberately no vault, so it
 * exercises the simplest case that hits the same empty-`memberMeta` path.
 */
import { test, expect, type Page, type BrowserContext } from "@playwright/test";

const RUN_ID = Date.now();
const EMAIL = `no-vault-${RUN_ID}@e2e.test`;
const PASSWORD = "NoVault!Test123";
const CSRF = { "X-Vinaadi-CSRF": "1" };

test.setTimeout(120_000);

async function dismissBlockingDialogs(page: Page, maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    const dialog = page.locator('[role="dialog"][aria-modal="true"]').first();
    if (!(await dialog.isVisible().catch(() => false))) return;
    await dialog.click({ position: { x: 3, y: 3 }, force: true }).catch(() => {});
    await page.waitForTimeout(400);
  }
}

test("Family & Charts renders the owner's own reading with no family vault", async ({ browser }) => {
  const context: BrowserContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const api = context.request;

  const reg = await api.post("/api/backend/api/v1/auth/register", { data: { email: EMAIL, password: PASSWORD } });
  if (!reg.ok()) throw new Error(`register failed: ${reg.status()} ${await reg.text()}`);
  const login = await api.post("/api/backend/api/v1/auth/login", { data: { email: EMAIL, password: PASSWORD } });
  if (!login.ok()) throw new Error(`login failed: ${login.status()} ${await login.text()}`);

  // Fictitious birth data, per the repo's synthetic-fixtures rule.
  const bp = await api.post("/api/backend/api/v1/birth-profiles", {
    data: {
      displayName: "E2E No-Vault Owner",
      relationshipToOwner: "self",
      birthDateLocal: "1990-05-15",
      birthTimeLocal: "08:30:00",
      birthPlace: "Chennai, Tamil Nadu, India",
      birthLatitude: 13.0827,
      birthLongitude: 80.2707,
      birthTimezone: "Asia/Kolkata",
      calculateNow: true,
      genderForTraditionalRules: "male",
      maritalStatus: "married",
    },
    headers: CSRF,
  });
  if (!bp.ok()) throw new Error(`birth profile failed: ${bp.status()} ${await bp.text()}`);

  // Deliberately no /api/v1/family-vaults call — this account has a birth
  // profile and nothing else.

  const page = await context.newPage();
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  await dismissBlockingDialogs(page);
  const enToggle = page.getByRole("button", { name: "Switch to English" });
  if (await enToggle.isVisible({ timeout: 5000 }).catch(() => false)) {
    await enToggle.click();
    await page.waitForTimeout(500);
  }
  await dismissBlockingDialogs(page);
  await page
    .waitForFunction(() => !document.body.innerText.includes("Refreshing..."), { timeout: 45_000 })
    .catch(() => {});
  await page.waitForTimeout(1000);

  await dismissBlockingDialogs(page, 3);
  await page.getByRole("button", { name: "Family & Charts", exact: true }).first().click();
  await page.waitForTimeout(1500);
  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});

  // The section this bug blanked out entirely — no skeleton, no placeholder,
  // just an absent subtree — so its heading appearing is the actual signal.
  await expect(
    page.getByRole("heading", { name: /Full technical reading/i }),
    "the Full technical reading section did not render for an owner with no family vault",
  ).toBeVisible({ timeout: 60_000 });

  await context.close();
});
