import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const email = process.env.SCREENSHOT_EMAIL;
const password = process.env.SCREENSHOT_PASSWORD;
if (!email || !password) throw new Error("Missing SCREENSHOT_EMAIL / SCREENSHOT_PASSWORD");

const outDir = path.resolve("artifacts", "screenshots");
fs.mkdirSync(outDir, { recursive: true });

const files = {
  transits: path.join(outDir, "dashboard-transits-full-en.png"),
  calendarPanchangam: path.join(outDir, "dashboard-calendar-panchangam-full-en.png"),
  calendarPersonal: path.join(outDir, "dashboard-calendar-personal-full-en.png"),
  calendarFamily: path.join(outDir, "dashboard-calendar-family-full-en.png"),
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1512, height: 2200 } });

async function clickVisibleButtonByPattern(pattern) {
  const loc = page.getByRole("button", { name: pattern });
  const n = await loc.count();
  for (let i = 0; i < n; i += 1) {
    const btn = loc.nth(i);
    if (await btn.isVisible().catch(() => false)) {
      await btn.click({ force: true });
      await page.waitForTimeout(900);
      return true;
    }
  }
  return false;
}

async function clickVisibleButtonByExact(text) {
  const loc = page.getByRole("button", { name: text, exact: true });
  const n = await loc.count();
  for (let i = 0; i < n; i += 1) {
    const btn = loc.nth(i);
    if (await btn.isVisible().catch(() => false)) {
      await btn.click({ force: true });
      await page.waitForTimeout(1000);
      return;
    }
  }
  throw new Error(`Could not click visible exact button: ${text}`);
}

async function ensureLoggedIn() {
  await page.goto("http://127.0.0.1:3000/dashboard", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1200);

  if (page.url().includes("/login")) {
    const form = page.locator("form").first();
    await form.locator('input[type="email"]').fill(email);
    await form.locator('input[type="password"]').fill(password);
    await form.locator('button[type="submit"]').click();
    await page.waitForURL("**/dashboard", { timeout: 60000 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1200);
  }

  // If onboarding/setup screen is active, jump to personal workspace first.
  await clickVisibleButtonByPattern(/(தனிப்பட்ட பக்கம்|Personal page|Go to personal)/i);
}

try {
  await ensureLoggedIn();

  // English mode
  await clickVisibleButtonByPattern(/^EN$/i);
  await page.waitForTimeout(1200);

  // Transits
  await clickVisibleButtonByPattern(/(கோசாரம்|Transits|Dasha)/i);
  await page.screenshot({ path: files.transits, fullPage: true, type: "png" });

  // Calendar tab
  await clickVisibleButtonByPattern(/(நாட்காட்டி|Calendar|Transits\s*&\s*Events)/i);
  await page.waitForTimeout(1200);

  // Calendar sub-tabs by exact icon+label
  await clickVisibleButtonByExact("📅 Panchangam");
  await page.screenshot({ path: files.calendarPanchangam, fullPage: true, type: "png" });

  await clickVisibleButtonByExact("◎ Personal");
  await page.screenshot({ path: files.calendarPersonal, fullPage: true, type: "png" });

  await clickVisibleButtonByExact("👪 Family");
  await page.screenshot({ path: files.calendarFamily, fullPage: true, type: "png" });

  console.log("Saved screenshots:");
  Object.values(files).forEach((p) => console.log(p));
} finally {
  await browser.close();
}
