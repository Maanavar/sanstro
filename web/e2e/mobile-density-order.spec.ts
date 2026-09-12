/**
 * Mobile information-order pass (360px and 390px).
 *
 * Dense Panchangam facts are useful only after the reader knows how to use the
 * day. This is a browser test because responsive CSS can reorder or clip the
 * same DOM at phone widths. It guards the intended reading order:
 * actionable day summary -> safety guidance -> dense Five Limbs detail.
 */
import { test, expect, type BrowserContext, type Page } from "@playwright/test";

const RUN_ID = Date.now();
const EMAIL = `density-mobile-${RUN_ID}-${Math.random().toString(36).slice(2, 8)}@e2e.test`;
const PASSWORD = "DensityMobile!Test123";
const CSRF = { "X-Vinaadi-CSRF": "1" };
const VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
] as const;

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
  context = await browser.newContext({ viewport: VIEWPORTS[0] });
  const api = context.request;

  const reg = await api.post("/api/backend/api/v1/auth/register", { data: { email: EMAIL, password: PASSWORD, consentGiven: true } });
  if (!reg.ok()) throw new Error(`register failed: ${reg.status()} ${await reg.text()}`);

  let login = await api.post("/api/backend/api/v1/auth/login", { data: { email: EMAIL, password: PASSWORD } });
  for (let attempt = 0; attempt < 10 && !login.ok(); attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    login = await api.post("/api/backend/api/v1/auth/login", { data: { email: EMAIL, password: PASSWORD } });
  }
  if (!login.ok()) throw new Error(`login failed: ${login.status()} ${await login.text()}`);

  const profile = await api.post("/api/backend/api/v1/birth-profiles", {
    data: {
      displayName: "E2E Density Owner",
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
  if (!profile.ok()) throw new Error(`birth profile failed: ${profile.status()} ${await profile.text()}`);

  page = await context.newPage();
});

test.afterAll(async () => {
  await context?.close();
});

test("action and safety guidance lead the dense day detail at phone widths", async () => {
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
    await dismissBlockingDialogs();

    // The hero pill nav ("cd-tab") and the footer nav both render a "Calendar"
    // button — the footer's stays in the DOM (not removed) at phone widths, so
    // an unscoped role query is ambiguous. Scope to the hero tab specifically.
    await page.locator("button.cd-tab", { hasText: "Calendar" }).click();
    const summary = page.getByTestId("calendar-day-summary");
    const avoid = page.getByText("Avoid", { exact: true }).first();
    const detail = page.getByText("Panchangam · Five Limbs", { exact: true });
    await expect(summary).toBeVisible({ timeout: 45_000 });
    await expect(avoid).toBeVisible();
    await expect(detail).toBeVisible();

    await expect(summary).toContainText(/Use a recommended window|Keep plans simple|routine/i);
    const order = await page.evaluate(() => {
      const summaryEl = document.querySelector('[data-testid="calendar-day-summary"]');
      const avoidEl = [...document.querySelectorAll("*")].find((el) => el.textContent?.trim() === "Avoid");
      const detailEl = [...document.querySelectorAll("*")].find((el) => el.textContent?.trim() === "Panchangam · Five Limbs");
      if (!summaryEl || !avoidEl || !detailEl) return null;
      const before = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
      return { summaryBeforeAvoid: before(summaryEl, avoidEl), avoidBeforeDetail: before(avoidEl, detailEl) };
    });
    expect(order, `${viewport.width}px: required calendar landmarks did not render`).not.toBeNull();
    expect(order).toEqual({ summaryBeforeAvoid: true, avoidBeforeDetail: true });

    for (const landmark of [summary, avoid, detail]) {
      await landmark.scrollIntoViewIfNeeded();
      const box = await landmark.boundingBox();
      expect(box, `${viewport.width}px: a reading landmark has no layout box`).not.toBeNull();
      expect(box!.x, `${viewport.width}px: landmark is clipped on the left`).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width, `${viewport.width}px: landmark overflows horizontally`).toBeLessThanOrEqual(viewport.width + 1);
    }
  }
});
