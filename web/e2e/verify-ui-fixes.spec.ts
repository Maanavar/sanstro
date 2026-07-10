/**
 * TEMPORARY verification spec (2026-07-07 UI pass) — deletes after use.
 * Bootstraps a synthetic Nova account (same pattern as nova-sweep.spec.ts),
 * then opens the two surfaces the sweep never expands: a Tools *detail* panel
 * (item 6 — dark reskin) and the ChartExplanationPanel (item 5 — sticky tab
 * strip). Also selects a non-owner member pill (item 2 — gold fill).
 */
import { test, type Page, type BrowserContext } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUN_ID = Date.now();
const EMAIL = `verify-ui-${RUN_ID}@e2e.test`;
const PASSWORD = "NovaSweep!Test123";
const CSRF_HEADERS = { "X-Vinaadi-CSRF": "1" };
const ARTIFACT_DIR = path.join(__dirname, ".artifacts", "verify-ui");

test.describe.configure({ mode: "serial", timeout: 180_000 });

let context: BrowserContext;
let page: Page;

test.beforeAll(async ({ browser }) => {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  context = await browser.newContext();
  const api = context.request;
  await api.post("/api/backend/api/v1/auth/register", { data: { email: EMAIL, password: PASSWORD } });
  await api.post("/api/backend/api/v1/auth/login", { data: { email: EMAIL, password: PASSWORD } });
  const selfProfile = {
    displayName: "E2E Nova Owner", relationshipToOwner: "self",
    birthDateLocal: "1990-05-15", birthTimeLocal: "08:30:00",
    birthPlace: "Chennai, Tamil Nadu, India", birthLatitude: 13.0827, birthLongitude: 80.2707,
    birthTimezone: "Asia/Kolkata", calculateNow: true, genderForTraditionalRules: "male", maritalStatus: "married",
  };
  await api.post("/api/backend/api/v1/birth-profiles", { data: selfProfile, headers: CSRF_HEADERS });
  const vault = await api.post("/api/backend/api/v1/family-vaults", { data: { name: "E2E Nova Family" }, headers: CSRF_HEADERS });
  const vaultId = (await vault.json()).data.familyVaultId as string;
  await api.post(`/api/backend/api/v1/family-vaults/${vaultId}/members`, {
    data: { ...selfProfile, displayName: "E2E Nova Spouse", relationshipToOwner: "spouse",
      birthDateLocal: "1992-08-20", birthTimeLocal: "14:15:00", birthPlace: "Madurai, Tamil Nadu, India",
      birthLatitude: 9.9252, birthLongitude: 78.1198, genderForTraditionalRules: "female" },
    headers: CSRF_HEADERS,
  });
  // Nova is the only dashboard look now (data-ui="nova" set in app/layout.tsx).
  page = await context.newPage();
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  await dismissDialogs();
  const enToggle = page.getByRole("button", { name: "Switch to English" });
  if (await enToggle.isVisible({ timeout: 5000 }).catch(() => false)) { await enToggle.click(); await page.waitForTimeout(500); }
  await dismissDialogs();
  await page.waitForFunction(() => !document.body.innerText.includes("Refreshing..."), { timeout: 45_000 }).catch(() => {});
  await page.waitForTimeout(1500);
});

async function dismissDialogs(maxAttempts = 15) {
  for (let i = 0; i < maxAttempts; i++) {
    const dialog = page.locator('[role="dialog"][aria-modal="true"]').first();
    if (!(await dialog.isVisible().catch(() => false))) return;
    await dialog.click({ position: { x: 3, y: 3 }, force: true }).catch(() => {});
    await page.waitForTimeout(400);
  }
}

test.afterAll(async () => { await context.close(); });

test("item 6 — Tools detail panel renders dark", async () => {
  await dismissDialogs();
  await page.getByRole("button", { name: "Tools", exact: true }).first().click();
  await page.waitForTimeout(1200);
  // Open the Jadhagam Generator (chart-generate inline panel).
  await page.getByText("Jadhagam Generator").first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "tools-detail-jadhagam.png"), fullPage: true });
});

test("item 5 — chart explanation tab strip (Today deep dive)", async () => {
  await dismissDialogs();
  await page.getByRole("button", { name: "Today", exact: true }).first().click();
  await page.waitForTimeout(1500);
  // ChartExplanationPanel's collapsed teaser exposes an "Open chart explanation" toggle.
  const openBtn = page.getByRole("button", { name: /Open chart explanation/i }).first();
  await openBtn.scrollIntoViewIfNeeded().catch(() => {});
  if (await openBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
    await openBtn.click();
    await page.waitForTimeout(600);
    // Click through a couple of tabs to prove one-at-a-time switching works.
    for (const tabName of ["Planet Positions", "Yogas / Doshams"]) {
      const tab = page.getByRole("tab", { name: tabName }).first();
      if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) { await tab.click(); await page.waitForTimeout(300); }
    }
    await openBtn.scrollIntoViewIfNeeded().catch(() => {});
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "chart-explanation-tabstrip.png"), fullPage: true });
});

test("item 2 — non-owner member pill fills gold when selected", async () => {
  await dismissDialogs();
  await page.getByRole("button", { name: "Life Area", exact: true }).first().click();
  await page.waitForTimeout(2000);
  const spousePill = page.getByRole("button", { name: "E2E Nova Spouse", exact: true }).first();
  await spousePill.waitFor({ state: "visible", timeout: 8000 });
  await spousePill.click();
  await page.waitForTimeout(1000);
  const bg = await spousePill.evaluate((el) => getComputedStyle(el).backgroundColor);
  const color = await spousePill.evaluate((el) => getComputedStyle(el).color);
  // eslint-disable-next-line no-console
  console.log(`[verify] selected spouse pill background=${bg} color=${color}`);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "member-pill-selected.png"), fullPage: true });
  // Accent gold (#d4af5f) → rgb(212, 175, 95); assert it is NOT transparent.
  if (bg.includes("rgba(0, 0, 0, 0)") || bg === "transparent") {
    throw new Error(`spouse pill did not fill on selection (background=${bg})`);
  }
});
