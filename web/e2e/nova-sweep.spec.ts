/**
 * Nova-mode QA sweep (manual test-request follow-up, 2026-07-06).
 *
 * Bootstraps a disposable synthetic account (register -> login -> birth
 * profile -> family vault with a spouse + child, all fictitious data per
 * the repo's synthetic-fixtures rule) via direct API calls, forces Nova
 * mode via localStorage, then clicks through every top-level Nova tab
 * (plus the Life Area and Plan sub-tabs) capturing a screenshot and any
 * console/page error at each stop.
 *
 * Run locally: cd web && npx playwright test e2e/nova-sweep.spec.ts --project=chromium
 */
import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RUN_ID = Date.now();
const EMAIL = `nova-sweep-${RUN_ID}@e2e.test`;
const PASSWORD = "NovaSweep!Test123";
const CSRF_HEADERS = { "X-Vinaadi-CSRF": "1" };

const ARTIFACT_DIR = path.join(__dirname, ".artifacts", "nova-sweep");

test.describe.configure({ mode: "serial" });

let context: BrowserContext;
let page: Page;
let currentTab = "setup";
const consoleErrors: { tab: string; text: string }[] = [];
const pageErrors: { tab: string; text: string }[] = [];

function log(msg: string) {
  // eslint-disable-next-line no-console
  console.log(`[nova-sweep t=${((Date.now() - RUN_ID) / 1000).toFixed(1)}s] ${msg}`);
}

test.beforeAll(async ({ browser }) => {
  log("beforeAll start");
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  context = await browser.newContext();
  const api = context.request;

  const reg = await api.post("/api/backend/api/v1/auth/register", {
    data: { email: EMAIL, password: PASSWORD },
  });
  if (!reg.ok()) throw new Error(`register failed: ${reg.status()} ${await reg.text()}`);
  log("registered");

  const login = await api.post("/api/backend/api/v1/auth/login", {
    data: { email: EMAIL, password: PASSWORD },
  });
  if (!login.ok()) throw new Error(`login failed: ${login.status()} ${await login.text()}`);
  log("logged in");

  const selfProfile = {
    displayName: "E2E Nova Owner",
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
  };
  const bp = await api.post("/api/backend/api/v1/birth-profiles", {
    data: selfProfile,
    headers: CSRF_HEADERS,
  });
  if (!bp.ok()) throw new Error(`self birth profile failed: ${bp.status()} ${await bp.text()}`);
  log("self birth profile created (chart calculated)");

  const vault = await api.post("/api/backend/api/v1/family-vaults", {
    data: { name: "E2E Nova Family" },
    headers: CSRF_HEADERS,
  });
  if (!vault.ok()) throw new Error(`vault failed: ${vault.status()} ${await vault.text()}`);
  const vaultId = (await vault.json()).data.familyVaultId as string;
  log("family vault created");

  const spouseRes = await api.post(`/api/backend/api/v1/family-vaults/${vaultId}/members`, {
    data: {
      ...selfProfile,
      displayName: "E2E Nova Spouse",
      relationshipToOwner: "spouse",
      birthDateLocal: "1992-08-20",
      birthTimeLocal: "14:15:00",
      birthPlace: "Madurai, Tamil Nadu, India",
      birthLatitude: 9.9252,
      birthLongitude: 78.1198,
      genderForTraditionalRules: "female",
    },
    headers: CSRF_HEADERS,
  });
  if (!spouseRes.ok()) throw new Error(`spouse member failed: ${spouseRes.status()} ${await spouseRes.text()}`);
  log("spouse member created (chart calculated)");
  // Free-tier family vaults cap at 1 additional member ("Family Vault limit reached (1
  // profile)"), so this synthetic account intentionally stops at owner + spouse.

  // Nova is now the only dashboard look (data-ui="nova" is set statically in
  // app/layout.tsx — see docs/NOVA_ONLY_MIGRATION_PLAN.md Phase 3), so no
  // localStorage forcing is needed.

  page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push({ tab: currentTab, text: msg.text() });
  });
  page.on("pageerror", (err) => {
    pageErrors.push({ tab: currentTab, text: err.message });
  });

  await page.goto("/dashboard");
  log("navigated to /dashboard");
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  log("networkidle after initial load");

  // A brand-new account lands in Tamil by default and shows first-run onboarding
  // dialogs (beta welcome + "what's your focus") that overlay the whole page and
  // can mount with a delay (gated behind data loading), so poll for them rather
  // than checking once. Dismiss whatever appears, then switch to English so the
  // hardcoded tab labels below can match.
  await dismissBlockingDialogs();
  log("dismissed first dialog pass");
  const enToggle = page.getByRole("button", { name: "Switch to English" });
  if (await enToggle.isVisible({ timeout: 5000 }).catch(() => false)) {
    await enToggle.click();
    await page.waitForTimeout(500);
  }
  log("switched to English (if toggle was present)");
  await dismissBlockingDialogs();
  log("dismissed second dialog pass");

  // Chart calc + family aggregate + per-member chart loading is a long chain of
  // backend calls (astrology computation, not just a DB read) — give it real time
  // to settle before the sweep starts clicking through tabs, or every screenshot
  // just shows the "Refreshing…" / empty-state placeholders instead of real content.
  await page
    .waitForFunction(
      () => {
        const text = document.body.innerText;
        return !text.includes("Refreshing...") && !text.includes("Ready. Create a profile or family vault");
      },
      { timeout: 45_000 },
    )
    .catch(() => {});
  log("data-settle wait finished");
  await page.waitForTimeout(1000);
  log("beforeAll done");
});

async function dismissBlockingDialogs(maxAttempts = 20) {
  // Deliberately NOT clicking labelled buttons like "Skip for now" here: on the
  // focus-picker modal (life-mode-picker.tsx) that button calls choose("BALANCED"),
  // a real PATCH /settings/life-mode mutation, not a plain close — under the load
  // of concurrent chart-calc requests that mutation can sit "saving…" for a long
  // time, which hung this exact dismissal loop during investigation. Both known
  // first-run modals (beta-system.tsx, life-mode-picker.tsx) close on a backdrop
  // click via `if (e.target === e.currentTarget) close()`, which is a pure
  // client-side state change with no network call, so prefer that.
  for (let i = 0; i < maxAttempts; i++) {
    const dialog = page.locator('[role="dialog"][aria-modal="true"]').first();
    const visible = await dialog.isVisible().catch(() => false);
    log(`dismissBlockingDialogs: attempt ${i + 1}/${maxAttempts}, dialog visible=${visible}`);
    if (!visible) return;
    await dialog.click({ position: { x: 3, y: 3 }, force: true }).catch(() => {});
    await page.waitForTimeout(400);
  }
}

test.afterAll(async () => {
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "report.json"),
    JSON.stringify({ email: EMAIL, consoleErrors, pageErrors }, null, 2),
  );
  await context.close();
});

async function shot(name: string) {
  await page.screenshot({ path: path.join(ARTIFACT_DIR, `${name}.png`), fullPage: true });
}

async function goToTab(label: string) {
  currentTab = label;
  log(`goToTab(${label}): start`);
  await dismissBlockingDialogs(3);
  log(`goToTab(${label}): dialogs dismissed, clicking nav button`);
  await page.getByRole("button", { name: label, exact: true }).first().click();
  log(`goToTab(${label}): clicked`);
  await page.waitForTimeout(1200);
  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
}

async function assertNoLeakedText(tabName: string) {
  const bodyText = await page.locator("body").innerText();
  const suspicious: [string, RegExp][] = [
    ["literal undefined", /\bundefined\b/],
    ["literal NaN", /\bNaN\b/],
    ["stringified object", /\[object Object\]/],
    ["unhandled TypeError text", /Cannot read propert(y|ies)/i],
    ["unhandled TypeError text", /is not a function/i],
  ];
  for (const [label, pattern] of suspicious) {
    if (pattern.test(bodyText)) {
      // eslint-disable-next-line no-console
      console.log(`[nova-sweep] LEAK on "${tabName}": ${label} (pattern ${pattern})`);
    }
  }
}

const TOP_TABS: Array<{ label: string; subTabs?: RegExp[] }> = [
  { label: "Today" },
  { label: "Calendar" },
  { label: "Family" },
  { label: "Explore" },
  { label: "Life Area", subTabs: [/Overview/, /Predictions/, /Yogas/, /Remedies/, /Full report/i] },
  { label: "Plan", subTabs: [/Goals & Windows/i, /Transits & Dasha/i] },
  { label: "Journal" },
  { label: "Tools" },
  { label: "QA" },
];

for (const tabDef of TOP_TABS) {
  test(`Nova tab renders cleanly: ${tabDef.label}`, async () => {
    await goToTab(tabDef.label);
    await shot(`tab-${tabDef.label.replace(/\s+/g, "-").toLowerCase()}`);
    await assertNoLeakedText(tabDef.label);

    if (tabDef.subTabs) {
      for (const subPattern of tabDef.subTabs) {
        const subBtn = page.getByRole("button", { name: subPattern }).first();
        const visible = await subBtn.isVisible().catch(() => false);
        if (!visible) continue;
        currentTab = `${tabDef.label} > ${subPattern}`;
        await subBtn.click();
        await page.waitForTimeout(1000);
        await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
        const safeName = subPattern.source.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
        await shot(`tab-${tabDef.label.replace(/\s+/g, "-").toLowerCase()}-${safeName}`);
        await assertNoLeakedText(currentTab);
      }
    }
  });
}

test("no console or page errors across the whole sweep", async () => {
  const filtered = consoleErrors.filter((e) => !/favicon|chrome-extension/i.test(e.text));
  if (filtered.length > 0) {
    // eslint-disable-next-line no-console
    console.log("[nova-sweep] console errors:", JSON.stringify(filtered, null, 2));
  }
  if (pageErrors.length > 0) {
    // eslint-disable-next-line no-console
    console.log("[nova-sweep] page errors:", JSON.stringify(pageErrors, null, 2));
  }
  expect(filtered, "console errors were logged during the sweep — see stdout above").toHaveLength(0);
  expect(pageErrors, "uncaught page errors were logged during the sweep — see stdout above").toHaveLength(0);
});
