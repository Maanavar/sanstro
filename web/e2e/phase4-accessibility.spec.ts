/**
 * Phase 4 rendered accessibility proof.
 *
 * The older dashboard audit measures motion/layout and its Tamil phase reads
 * visible text; neither runs the general axe rules and neither can inspect
 * title/ARIA values.  This pass exercises three primary destinations, the five
 * named overlays, and a real async panel in loading + error states, once in
 * English and once in Tamil.
 *
 * Blind spots: axe does not implement WCAG 1.4.11 non-text contrast, prove
 * reading order, or judge Tamil writing quality.  This uses one synthetic
 * chart at desktop width; exported reports, public sub-tools, mobile Safari,
 * and screen-reader announcements remain outside it.  Finite animations are
 * settled before each scan because axe measures mid-fade composited pixels;
 * the JS-driven Segmented thumb is settled separately (settleSegmentedThumbs).
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type BrowserContext, type Page, type Route } from "@playwright/test";

const RUN_ID = Date.now();
const EMAIL = `phase4-a11y-${RUN_ID}@e2e.test`;
const PASSWORD = "Phase4A11y!Test123";
const CSRF = { "X-Vinaadi-CSRF": "1" };
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const SHADBALA_PATTERN = "**/api/backend/api/v1/charts/*/shadbala";

test.describe.configure({ mode: "serial" });
test.setTimeout(420_000);
test.use({ actionTimeout: 30_000 });

let context: BrowserContext;

async function dismissDialogs(page: Page, attempts = 12) {
  for (let i = 0; i < attempts; i++) {
    const dialog = page.locator('[role="dialog"][aria-modal="true"]').first();
    if (!(await dialog.isVisible().catch(() => false))) return;
    const skip = dialog.getByRole("button", { name: /Skip for now|இப்போது தவிர்க்கவும்/i }).first();
    if (await skip.isVisible().catch(() => false)) await skip.click().catch(() => {});
    else await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(350);
  }
}

async function settle(page: Page) {
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  for (let i = 0; i < 60; i++) {
    const busy = await page.locator(".skel, [aria-busy='true']").count().catch(() => 1);
    if (busy === 0) break;
    await page.waitForTimeout(400);
  }
  await dismissDialogs(page, 4);
  await page.evaluate(async () => {
    const finite = document.getAnimations().filter((animation) => {
      const timing = animation.effect?.getComputedTiming();
      return animation.playState === "running" && !!timing &&
        timing.iterations !== Infinity && Number.isFinite(timing.endTime as number);
    });
    await Promise.race([
      Promise.all(finite.map((animation) => animation.finished.catch(() => undefined))),
      new Promise((resolve) => setTimeout(resolve, 2_000)),
    ]);
  });
  await settleSegmentedThumbs(page);
  await page.waitForTimeout(250);
}

/**
 * Wait until every Segmented thumb sits exactly over its own button.
 *
 * The thumb is a framer-motion `layoutId` animation driven from JS, so
 * `document.getAnimations()` above cannot see it. Scanning mid-slide measures
 * the selected label (already on-accent) over the ground the thumb has not
 * reached — a transition artefact, not a palette defect. Bounded at 2 s.
 *
 * Evidence, recorded honestly: the first Phase 4 run failed this way, but on
 * 2026-10-12 two no-retry runs with the thumb CSS restored passed in both
 * languages with AND without this wait. It guards a race, not a reproduced
 * failure.
 */
async function settleSegmentedThumbs(page: Page) {
  await page.waitForFunction(() => {
    const thumbs = Array.from(document.querySelectorAll<HTMLElement>(".ui-segmented__thumb"));
    return thumbs.every((thumb) => {
      const button = thumb.closest(".ui-segmented__btn");
      if (!button) return true;
      const a = thumb.getBoundingClientRect();
      const b = button.getBoundingClientRect();
      return Math.abs(a.left - b.left) < 1 && Math.abs(a.width - b.width) < 1;
    });
  }, undefined, { timeout: 2_000 }).catch(() => {});
}

async function scan(page: Page, label: string, findings: string[], include = ".cd-shell") {
  await settle(page);
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).include(include).analyze();
  for (const violation of results.violations) {
    for (const node of violation.nodes) {
      findings.push(
        `[${label}] ${violation.id} (${violation.impact}): ` +
        `${node.failureSummary?.replaceAll("\n", " ") ?? ""} — ${node.target.join(" ")}`,
      );
    }
  }
}

async function setLanguage(page: Page, lang: "en" | "ta") {
  const response = await context.request.patch("/api/backend/api/v1/settings/ui", {
    data: { lang },
    headers: CSRF,
  });
  expect(response.ok(), `could not set ${lang} in the synthetic account`).toBe(true);
  await page.goto("/dashboard");
  await page.evaluate((next) => {
    localStorage.setItem("jothidam-lang", next);
    document.cookie = `jothidam-lang=${next}; path=/; max-age=31536000; samesite=lax`;
  }, lang);
  await page.reload({ waitUntil: "domcontentloaded" });
  await settle(page);
  await expect(page.locator("html")).toHaveAttribute("lang", lang);
}

async function scanOverlay(
  page: Page,
  label: string,
  open: () => Promise<unknown>,
  selector: string,
  findings: string[],
) {
  await open();
  await page.locator(selector).first().waitFor({ state: "visible" });
  await scan(page, label, findings);
  await page.keyboard.press("Escape");
  await page.locator(selector).first().waitFor({ state: "hidden" }).catch(() => {});
}

test.beforeAll(async ({ browser }) => {
  test.setTimeout(300_000);
  context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const api = context.request;
  const reg = await api.post("/api/backend/api/v1/auth/register", {
    data: { email: EMAIL, password: PASSWORD, consentGiven: true },
    headers: CSRF,
  });
  if (!reg.ok()) throw new Error(`register failed: ${reg.status()} ${await reg.text()}`);
  const login = await api.post("/api/backend/api/v1/auth/login", {
    data: { email: EMAIL, password: PASSWORD },
    headers: CSRF,
  });
  if (!login.ok()) throw new Error(`login failed: ${login.status()} ${await login.text()}`);

  const profile = await api.post("/api/backend/api/v1/birth-profiles", {
    headers: CSRF,
    data: {
      displayName: "Phase Four Synthetic Reader",
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
  });
  if (!profile.ok()) throw new Error(`profile failed: ${profile.status()} ${await profile.text()}`);

  const vault = await api.post("/api/backend/api/v1/family-vaults", {
    headers: CSRF,
    data: { name: "Phase Four Synthetic Family" },
  });
  if (!vault.ok()) throw new Error(`vault failed: ${vault.status()} ${await vault.text()}`);
  const vaultId = (await vault.json()).data.familyVaultId as string;
  const member = await api.post(`/api/backend/api/v1/family-vaults/${vaultId}/members`, {
    headers: CSRF,
    data: {
      displayName: "Phase Four Synthetic Partner",
      relationshipToOwner: "spouse",
      birthDateLocal: "1992-08-20",
      birthTimeLocal: "14:15:00",
      birthPlace: "Madurai, Tamil Nadu, India",
      birthLatitude: 9.9252,
      birthLongitude: 78.1198,
      birthTimezone: "Asia/Kolkata",
      calculateNow: true,
      genderForTraditionalRules: "female",
      maritalStatus: "married",
    },
  });
  if (!member.ok()) throw new Error(`member failed: ${member.status()} ${await member.text()}`);
  await api.patch("/api/backend/api/v1/settings/life-mode", { data: { mode: "BALANCED" }, headers: CSRF });
});

test.afterAll(async () => {
  await context?.close();
});

for (const lang of ["en", "ta"] as const) {
  test(`key flows, overlays, loading and error states pass axe in ${lang}`, async () => {
    const page = await context.newPage();
    const findings: string[] = [];
    await setLanguage(page, lang);

    await scan(page, `${lang}:today`, findings);
    await scanOverlay(page, `${lang}:more-menu`, () => page.locator("button.cd-tab--more").first().click(), ".cd-dropdown--nav", findings);
    await scanOverlay(page, `${lang}:notifications`, () => page.locator(".cd-topbar__right .cd-icon-btn").first().click(), ".cd-alerts-popover", findings);
    await scanOverlay(page, `${lang}:account-menu`, () => page.locator(".cd-topbar .cd-avatar").click(), ".cd-dropdown:not(.cd-dropdown--nav)", findings);
    await scanOverlay(page, `${lang}:ask-vinaadi`, () => page.locator(".cd-ask-search").click(), '[role="dialog"]', findings);

    await page.locator('button[data-tab="calendar"]').first().click();
    await scan(page, `${lang}:calendar`, findings);
    const monthly = page.getByRole("tab", { name: /Monthly|மாத/i }).first();
    await monthly.click();
    await settle(page);
    await scanOverlay(page, `${lang}:day-drawer`, () => page.locator("button.nova-cal-cell").nth(10).click(), ".drawer", findings);

    let releaseFailure!: () => void;
    const failureReleased = new Promise<void>((resolve) => { releaseFailure = resolve; });
    const failShadbala = async (route: Route) => {
      await failureReleased;
      await route.fulfill({ status: 503, contentType: "application/json", body: '{"detail":"synthetic phase-four failure"}' });
    };
    await page.route(SHADBALA_PATTERN, failShadbala);
    await page.locator('button[data-tab="family"]').first().click();
    await expect(page.getByRole("heading", { name: /Full chart reading|முழு ஜாதக விளக்கம்/i })).toBeVisible({ timeout: 60_000 });
    const shadbala = page.locator("button.collapsible__trigger", { hasText: /Shadbala|ஷட்பலம்/i }).first();
    const shadbalaSection = shadbala.locator("..");
    await shadbala.scrollIntoViewIfNeeded();
    await shadbala.click();
    await expect(shadbalaSection.getByText(lang === "ta" ? "ஏற்றுகிறது…" : "Loading…", { exact: true })).toBeVisible();
    await scan(page, `${lang}:loading`, findings);
    releaseFailure();
    await expect(shadbalaSection.getByRole("alert").filter({ hasText: lang === "ta" ? "ஷட்பலத்தை ஏற்ற முடியவில்லை." : "Could not load Shadbala." })).toBeVisible({ timeout: 30_000 });
    await scan(page, `${lang}:error`, findings);
    await page.unroute(SHADBALA_PATTERN, failShadbala);

    if (findings.length) {
      // eslint-disable-next-line no-console
      console.log(`[phase4-a11y:${lang}]\n${findings.join("\n")}`);
    }
    expect(findings, `axe findings in ${lang}; see labelled output`).toEqual([]);
    await page.close();
  });
}

