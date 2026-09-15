/**
 * Calendar → Monthly: screenshot the grid + Events & Festivals rail at desktop,
 * laptop and phone widths, in a light month and a heavy one, and record the
 * rail-vs-grid height so layout changes are judged on pixels, not on JSX.
 *
 * Synthetic account only (repo fixture rule). Runs on the isolated e2e stack.
 * Run: cd web && npx playwright test e2e/calendar-rail-visual.spec.ts --project=chromium --workers=1
 */
import { test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, ".artifacts", "calendar-rail");
const RUN_ID = Date.now();
const EMAIL = `cal-rail-${RUN_ID}@e2e.test`;
const PASSWORD = "CalRail!Test123";
const CSRF = { "X-Vinaadi-CSRF": "1" };

test.setTimeout(420_000);

async function dismissDialogs(page: Page, attempts = 12) {
  for (let i = 0; i < attempts; i++) {
    const dialog = page.locator('[role="dialog"][aria-modal="true"]').first();
    if (!(await dialog.isVisible().catch(() => false))) return;
    await dialog.click({ position: { x: 3, y: 3 }, force: true }).catch(() => {});
    await page.waitForTimeout(400);
  }
}

/** The first-run focus picker can mount seconds after the tab settles and is
 *  modal, so a plain click waits out the whole test budget behind it. Dismiss
 *  immediately before each attempt, and bound each attempt. */
async function clickPastDialogs(page: Page, locator: ReturnType<Page["locator"]>, what: string) {
  for (let attempt = 0; attempt < 8; attempt++) {
    await dismissDialogs(page);
    try {
      await locator.click({ timeout: 8_000 });
      return;
    } catch {
      await page.waitForTimeout(1_000);
    }
  }
  throw new Error(`could not click ${what} after 8 bounded attempts`);
}

async function measure(page: Page, label: string) {
  const dims = await page.evaluate(() => {
    const layout = document.querySelector(".nova-cal-monthly-layout");
    if (!layout) return null;
    const [grid, rail] = Array.from(layout.children) as HTMLElement[];
    const card = rail?.querySelector("section");
    return {
      grid: grid?.getBoundingClientRect().height,
      rail: rail?.getBoundingClientRect().height,
      eventsCard: card?.getBoundingClientRect().height,
      heading: document.querySelector(".nova-cal-monthly-layout")?.previousElementSibling?.textContent,
    };
  });
  fs.appendFileSync(path.join(OUT, "dims.txt"), `${label}: ${JSON.stringify(dims)}\n`);
}

async function snap(page: Page, label: string) {
  await page.waitForTimeout(800);
  const layout = page.locator(".nova-cal-monthly-layout");
  await layout.screenshot({ path: path.join(OUT, `${label}-layout.png`) });
  await layout.locator("xpath=..").screenshot({ path: path.join(OUT, `${label}-view.png`) });
  const rail = layout.locator("> div").nth(1);
  await rail.screenshot({ path: path.join(OUT, `${label}-rail.png`) });
  await measure(page, label);
}

test("calendar monthly rail — visual pass", async ({ browser }) => {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "dims.txt"), "");
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const api = context.request;

  const reg = await api.post("/api/backend/api/v1/auth/register", {
    data: { email: EMAIL, password: PASSWORD, consentGiven: true },
  });
  if (!reg.ok()) throw new Error(`register failed: ${reg.status()} ${await reg.text()}`);
  let loggedIn = false;
  for (let i = 0; i < 10 && !loggedIn; i++) {
    const login = await api.post("/api/backend/api/v1/auth/login", { data: { email: EMAIL, password: PASSWORD } });
    loggedIn = login.ok();
    if (!loggedIn) await new Promise((r) => setTimeout(r, 500));
  }
  if (!loggedIn) throw new Error("login never succeeded");

  const bp = await api.post("/api/backend/api/v1/birth-profiles", {
    headers: CSRF,
    data: {
      displayName: "E2E Calendar Owner",
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
  if (!bp.ok()) throw new Error(`birth profile failed: ${bp.status()} ${await bp.text()}`);

  const page = await context.newPage();
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});
  await dismissDialogs(page);
  const en = page.getByRole("button", { name: "Switch to English" });
  if (await en.isVisible({ timeout: 5000 }).catch(() => false)) {
    await en.click();
    await page.waitForTimeout(500);
  }
  await dismissDialogs(page);

  await clickPastDialogs(page, page.locator("button.cd-tab", { hasText: "Calendar" }).first(), "Calendar tab");
  await page.waitForTimeout(1500);
  await clickPastDialogs(page, page.getByRole("tab", { name: /Monthly/i }).first(), "Monthly tab");
  await page.locator(".nova-cal-monthly-layout").waitFor({ timeout: 120_000 });
  await dismissDialogs(page);
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});

  await snap(page, "desktop-1440-current");

  // Heaviest measured months: Jan and Mar 2026 (spec §4.2).
  const prev = page.getByRole("button", { name: "Previous month" });
  const steps = await page.evaluate(() => {
    const heading = document.body.innerText.match(/(January|February|March|April|May|June|July|August|September|October|November|December) (\d{4})/);
    if (!heading) return 0;
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return (Number(heading[2]) - 2026) * 12 + months.indexOf(heading[1]!) - 2; // steps back to March 2026
  });
  for (let i = 0; i < steps; i++) {
    await prev.click();
    await page.waitForTimeout(300);
  }
  await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await snap(page, "desktop-1440-march");

  await page.setViewportSize({ width: 1180, height: 900 });
  await snap(page, "laptop-1180-march");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(600);
  const rail = page.locator(".nova-cal-monthly-layout > div").nth(1);
  await rail.screenshot({ path: path.join(OUT, "phone-390-march-rail.png") });

  await context.close();
});
