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
// Each tab now waits for its lazy panel to actually render before asserting, and
// several take >10s to settle, so the default 30s is no longer enough.
test.setTimeout(90_000);

let context: BrowserContext;
let page: Page;
let currentTab = "setup";
const consoleErrors: { tab: string; text: string }[] = [];
const pageErrors: { tab: string; text: string }[] = [];
/** Sub-tabs named in TOP_TABS that the run could not find — see the assertion
 *  at the bottom. A silent skip here is how this sweep came to cover far less
 *  than its name claims. */
const missingSubTabs: string[] = [];

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
    data: { email: EMAIL, password: PASSWORD, consentGiven: true },
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
    JSON.stringify({ email: EMAIL, consoleErrors, pageErrors, missingSubTabs }, null, 2),
  );
  await context.close();
});

async function shot(name: string) {
  await page.screenshot({ path: path.join(ARTIFACT_DIR, `${name}.png`), fullPage: true });
}

/**
 * `role` differs by where the destination lives, and getting it wrong does not
 * fail — it hangs. The hero nav renders plain `<button>`s, but the "More"
 * dropdown gives its items `role="menuitem"` (dashboard-hero.tsx:321), which
 * REPLACES the implicit button role rather than adding to it. So a
 * `getByRole("button", { name: "Tools" })` matches nothing and Playwright waits
 * for it to appear until the test times out, taking Understand and QA down with it
 * under serial mode.
 */
async function goToTab(label: string, role: "button" | "menuitem" = "button") {
  currentTab = label;
  log(`goToTab(${label}): start`);
  await dismissBlockingDialogs(3);
  log(`goToTab(${label}): dialogs dismissed, clicking ${role} "${label}"`);
  await page.getByRole(role, { name: label, exact: true }).first().click();
  log(`goToTab(${label}): clicked`);
  await page.waitForTimeout(1200);
  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
  await waitForContent(label);
}

/**
 * Wait for the tab's real content, not just for the network to go quiet.
 *
 * `networkidle` says nothing about a `next/dynamic` panel still showing its
 * `loading` fallback — dashboard-workspace.tsx lazy-loads 16 of them. Goals and
 * Life Areas were being screenshotted mid-skeleton, and since a skeleton
 * contains no text, `assertNoLeakedText` passed and the tab was reported as
 * rendering cleanly. Every sub-tab under those two was then "not visible" and
 * silently skipped, which is why this sweep was green while covering neither.
 */
async function waitForContent(label: string) {
  // Bounded, and a timeout is logged rather than thrown: a tab whose skeleton
  // never resolves is a finding worth seeing in the log, but it must not eat the
  // whole per-test budget and turn into an unrelated-looking timeout.
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    const remaining = await page.locator(".skel").count().catch(() => 0);
    if (remaining === 0) {
      await page.waitForTimeout(400);
      return;
    }
    await page.waitForTimeout(400);
  }
  const stuck = await page.locator(".skel").count().catch(() => 0);
  log(`waitForContent(${label}): ${stuck} skeleton element(s) still present after 12s`);
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

/**
 * Mirrors dashboard-hero.tsx's TAB_DEFS + MORE_TAB_DEFS. Keep it that way: a
 * label here that the nav does not render makes `getByRole(...).click()` wait
 * until the test times out rather than fail with "not found", so the sweep
 * stops at that tab and every tab after it is reported as "did not run".
 *
 * That is what had happened. This list still carried "Transits & Dashas", a
 * destination removed on 2026-07-21 — lib/dashboard-tabs.ts says so in its own
 * docstring, and its content moved into Family & Charts. So the sweep had been
 * unable to get past the fourth tab for two and a half weeks, and the last
 * artifacts in e2e/.artifacts/nova-sweep are dated 18 July. It also listed
 * "Journal", which is a real tab but has never had a nav pill, and omitted
 * Settings, which does.
 *
 * `via` says how each destination is actually reached, because they differ:
 *   nav   a pill in the hero nav
 *   more  behind the "More" dropdown, which must be opened first
 *   url   no nav affordance at all — Journal is reached from a Today quick-link
 *         tile or by its canonical path, so the sweep addresses it directly
 *         rather than pretending a pill exists.
 */
const TOP_TABS: Array<{ label: string; subTabs?: RegExp[]; via: "nav" | "more" | "url"; path?: string }> = [
  { label: "Today", via: "nav" },
  // "Best Dates & Muhurta" lives here, not under Goals — it moved in the
  // 2026-07-22 IA refactor and dashboard-plan-tab-nova.tsx:99 records the move.
  // It was still listed under Goals below, where it can never be found.
  { label: "Calendar", via: "nav", subTabs: [/Panchangam/i, /Monthly/i, /Best Dates & Muhurta/i] },
  { label: "Family & Charts", via: "nav" },
  { label: "Goals", via: "nav", subTabs: [/Life Events/i, /What-If/i, /Decisions/i] },
  { label: "Life Areas", via: "nav", subTabs: [/Overview/, /Predictions/, /Yogas/, /Remedies/, /Full report/i] },
  { label: "Settings", via: "nav" },
  { label: "Journal", via: "url", path: "/dashboard/journal" },
  { label: "Tools", via: "more" },
  { label: "Understand", via: "more" },
  { label: "QA", via: "more" },
];

for (const tabDef of TOP_TABS) {
  test(`Nova tab renders cleanly: ${tabDef.label}`, async () => {
    if (tabDef.via === "url") {
      currentTab = tabDef.label;
      await dismissBlockingDialogs(3);
      await page.goto(tabDef.path!);
      await page.waitForTimeout(1200);
      await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
      await waitForContent(tabDef.label);
    } else {
      if (tabDef.via === "more") {
        // Tools/Understand/QA live behind the "More" dropdown now — open it first
        // so the item exists for goToTab() to click. The trigger's accessible
        // name carries a caret ("More ▾"), hence exact: false.
        await dismissBlockingDialogs(3);
        await page.getByRole("button", { name: "More", exact: false }).first().click();
      }
      await goToTab(tabDef.label, tabDef.via === "more" ? "menuitem" : "button");
    }
    await shot(`tab-${tabDef.label.replace(/\s+/g, "-").toLowerCase()}`);
    await assertNoLeakedText(tabDef.label);

    if (tabDef.subTabs) {
      for (const subPattern of tabDef.subTabs) {
        // The sub-tab strip is the shared <Segmented>, whose buttons carry
        // role="tab" — and an explicit role REPLACES the implicit button role
        // rather than adding to it, the same trap goToTab() documents above for
        // the "More" dropdown's role="menuitem". So the old
        // getByRole("button", …) matched nothing here, and because a miss was
        // treated as "not applicable" and skipped, this sweep reported Goals and
        // Life Areas as clean while never opening a single sub-tab.
        let subBtn = page.getByRole("tab", { name: subPattern }).first();
        let visible = await subBtn.isVisible().catch(() => false);
        if (!visible) {
          subBtn = page.getByRole("button", { name: subPattern }).first();
          visible = await subBtn.isVisible().catch(() => false);
        }
        if (!visible) {
          const tabs = await page
            .getByRole("tab")
            .evaluateAll((els) => els.map((e) => (e.textContent ?? "").replace(/\s+/g, " ").trim()));
          missingSubTabs.push(`${tabDef.label} > ${subPattern} (tabs on screen: ${JSON.stringify(tabs)})`);
          continue;
        }
        currentTab = `${tabDef.label} > ${subPattern}`;
        // The focus picker can mount after the parent tab has settled. Dismiss
        // it again immediately before a sub-tab click so it cannot intercept
        // the interaction and turn a rendered screen into a false timeout.
        await dismissBlockingDialogs(3);
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

/**
 * A sub-tab named in TOP_TABS that could not be found is a failure, not a skip.
 *
 * This is the same lesson as the stale "Transits & Dashas" entry: a list of
 * destinations is only worth having if a destination going missing is loud. A
 * skipped sub-tab still lets the parent tab report "renders cleanly", so the
 * sweep's coverage can shrink to nothing without any run turning red.
 */
test("every sub-tab named in TOP_TABS was actually reached", () => {
  if (missingSubTabs.length > 0) {
    // eslint-disable-next-line no-console
    console.log("[nova-sweep] sub-tabs not found:", JSON.stringify(missingSubTabs, null, 2));
  }
  expect(
    missingSubTabs,
    "named sub-tabs were not found — either the nav changed and TOP_TABS is stale, or the role is wrong",
  ).toHaveLength(0);
});
