/**
 * The 390px browser pass owed by T1, made permanent.
 *
 * WHY A BROWSER AND NOT A UNIT TEST. `GlossaryTerm` was rewritten to portal its
 * tooltip to `<body>` precisely because the Today ribbon's kala legend clips
 * twice — `overflow: hidden` on the legend grid for its rounded corners, and
 * again on each cell for the text ellipsis (dashboard-today-ribbon-nova.tsx,
 * the `repeat(auto-fit, minmax(160px, 1fr))` grid and its cells). Before the
 * rewrite a definition opened there rendered sliced in half, which is why those
 * terms went unglossed for so long.
 *
 * jsdom cannot see any of that. It has no layout: every element reports a zero
 * rect, `overflow` clips nothing, and `elementFromPoint` is meaningless. The
 * existing `dashboard-today-ribbon-nova.test.tsx` proves the tooltip is in the
 * DOM with the right text — which it would also have done for the clipped
 * version. Only a real engine can answer "can the reader see the whole thing".
 *
 * WHY 390px. The narrowest common phone width in the audit's mobile pass, and
 * the width where it actually bites: the panel is 260px wide and pinned into
 * the viewport by `reposition()`, so a term near the right edge is the case
 * where the horizontal clamp and the clipping ancestors interact.
 *
 * WHAT IT ASSERTS, and why each half matters on its own:
 *   - the panel is a child of <body>, not of the term (the portal is live);
 *   - its rect sits wholly inside the viewport (the clamp and the flip-below
 *     both work at this width);
 *   - a hit test at its centre lands on the panel itself. This is the clipping
 *     check: a panel confined to an `overflow: hidden` ancestor still reports a
 *     full bounding rect, so geometry alone would pass. What is painted is the
 *     only honest question, and elementFromPoint answers it.
 */
import { test, expect, type BrowserContext, type Page } from "@playwright/test";

const RUN_ID = Date.now();
const EMAIL = `gloss-mobile-${RUN_ID}-${Math.random().toString(36).slice(2, 8)}@e2e.test`;
const PASSWORD = "GlossMobile!Test123";
const CSRF = { "X-Vinaadi-CSRF": "1" };

// iPhone 14/15 logical width — the audit's narrow case.
const VIEWPORT = { width: 390, height: 844 };

test.describe.configure({ mode: "serial" });
test.setTimeout(180_000);

let context: BrowserContext;
let page: Page;

async function dismissBlockingDialogs(maxAttempts = 12) {
  for (let i = 0; i < maxAttempts; i++) {
    const dialog = page.locator('[role="dialog"][aria-modal="true"]').first();
    if (!(await dialog.isVisible().catch(() => false))) return;
    await dialog.click({ position: { x: 3, y: 3 }, force: true }).catch(() => {});
    await page.waitForTimeout(400);
  }
}

test.beforeAll(async ({ browser }) => {
  test.setTimeout(240_000);
  context = await browser.newContext({ viewport: VIEWPORT });
  const api = context.request;

  const reg = await api.post("/api/backend/api/v1/auth/register", { data: { email: EMAIL, password: PASSWORD } });
  if (!reg.ok()) throw new Error(`register failed: ${reg.status()} ${await reg.text()}`);

  // `register` commits in a `yield` dependency's teardown, which FastAPI runs
  // once the response is on its way out — so a login issued the instant the
  // 200 lands can genuinely race the INSERT and come back 401 with the row
  // arriving milliseconds later. Observed on this suite (the first attempt 401s,
  // the retry passes). Poll rather than sleep a fixed amount.
  let login = await api.post("/api/backend/api/v1/auth/login", { data: { email: EMAIL, password: PASSWORD } });
  for (let attempt = 0; attempt < 10 && !login.ok(); attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    login = await api.post("/api/backend/api/v1/auth/login", { data: { email: EMAIL, password: PASSWORD } });
  }
  if (!login.ok()) throw new Error(`login failed: ${login.status()} ${await login.text()}`);

  // Synthetic identity, per the repo's fixture rule.
  const bp = await api.post("/api/backend/api/v1/birth-profiles", {
    data: {
      displayName: "E2E Gloss Owner",
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

  page = await context.newPage();
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  await dismissBlockingDialogs();
});

test.afterAll(async () => {
  await context?.close();
});

/** GlossaryTerm's trigger, and only it.
 *
 *  `cursor: help` is set inline by the component, so this matches on the style
 *  attribute rather than a computed style — which lets Playwright resolve the
 *  elements themselves instead of positions in a list. That distinction is
 *  load-bearing: the tab keeps mounting `aria-expanded` buttons after first
 *  paint (the one-minute reading's "Show the astrology" among them), so an
 *  index captured up front points at a different element by the time it is
 *  clicked, and the sweep silently tests the wrong controls. */
const TRIGGERS = '.cd-shell button[aria-expanded][style*="cursor: help"]';

test("every open gloss is fully visible at 390px", async () => {
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  await dismissBlockingDialogs();
  // The ribbon's legend is the densest cluster of glosses and the last thing to
  // mount. Without this the sweep can run against a half-hydrated page and find
  // nothing to click, which would read as a pass.
  await page
    .getByRole("button", { name: "Rahu Kalam", exact: true })
    .first()
    .waitFor({ state: "visible", timeout: 45_000 });

  // Resolved to element handles, not positions — see the selector's note.
  const triggers = await page.locator(TRIGGERS).elementHandles();

  // The Today ribbon alone glosses today's star, the tithi and four kalas. A
  // zero here means the selector drifted, not that the screen is clean.
  expect(
    triggers.length,
    "no glossary triggers found — has the ribbon stopped glossing?",
  ).toBeGreaterThan(0);

  const failures: string[] = [];
  let opened = 0;

  for (const trigger of triggers) {
    if (!(await trigger.isVisible().catch(() => false))) continue;

    await trigger.scrollIntoViewIfNeeded().catch(() => {});
    // Let the scroll land before clicking. The tooltip is positioned from the
    // anchor's viewport rect at open time, so opening one mid-scroll measures a
    // position the page is about to leave — a harness artefact, not a defect,
    // but it produces a confident and completely wrong failure.
    await page.waitForTimeout(250);
    await trigger.click({ force: true }).catch(() => {});
    await page.waitForTimeout(300);

    const tip = page.locator('[role="tooltip"]').first();
    if (!(await tip.isVisible().catch(() => false))) {
      // Not a glossary term — some other disclosure using aria-expanded.
      await page.keyboard.press("Escape").catch(() => {});
      continue;
    }
    opened += 1;

    const label = (await trigger.innerText().catch(() => "")).trim() || "an unnamed gloss";
    const report = await page.evaluate(() => {
      const el = document.querySelector('[role="tooltip"]') as HTMLElement | null;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const hit = document.elementFromPoint(cx, cy);
      return {
        portalled: el.parentElement === document.body,
        rect: { top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height },
        viewport: { width: window.innerWidth, height: window.innerHeight },
        hitIsTip: !!hit && (hit === el || el.contains(hit)),
        text: (el.textContent ?? "").trim(),
      };
    });

    if (!report) {
      failures.push(`${label}: tooltip vanished between visibility check and measurement`);
    } else {
      const { rect, viewport, portalled, hitIsTip, text } = report;
      if (!portalled) failures.push(`${label}: tooltip is not portalled to <body> — it will be clipped by the legend cell`);
      if (rect.width === 0 || rect.height === 0) failures.push(`${label}: tooltip has a zero rect`);
      if (!text) failures.push(`${label}: tooltip rendered empty`);
      if (rect.left < 0) failures.push(`${label}: clipped off the left edge (left=${rect.left.toFixed(0)})`);
      if (rect.right > viewport.width) failures.push(`${label}: overflows the right edge (right=${rect.right.toFixed(0)} > ${viewport.width})`);
      if (rect.top < 0) failures.push(`${label}: clipped off the top (top=${rect.top.toFixed(0)})`);
      if (rect.bottom > viewport.height) failures.push(`${label}: runs past the bottom (bottom=${rect.bottom.toFixed(0)} > ${viewport.height})`);
      if (!hitIsTip) failures.push(`${label}: something else paints over the middle of the definition`);
    }

    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(80);
  }

  expect(opened, "no trigger opened a role=tooltip — the gloss may have stopped rendering").toBeGreaterThan(0);
  expect(failures).toEqual([]);
});
