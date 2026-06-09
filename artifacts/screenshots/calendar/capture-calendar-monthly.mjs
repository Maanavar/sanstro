import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import playwright from "../../../web/node_modules/playwright/index.js";

const { chromium } = playwright;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../../..");
const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? "http://127.0.0.1:3101";
const OUT_FILE = path.join(__dirname, "monthly-calendar-full-page.png");
const DEBUG_LOG = path.join(__dirname, "calendar-capture-debug.log");
const STORAGE_KEY = "jothidam-ai-dashboard-state";

function appendDebug(line) {
  fs.appendFileSync(DEBUG_LOG, `${new Date().toISOString()} ${line}\n`);
}

async function launchBrowser() {
  const attempts = [
    { label: "msedge", options: { headless: true, channel: "msedge" } },
    { label: "bundled chromium", options: { headless: true } },
  ];

  const errors = [];
  for (const attempt of attempts) {
    try {
      appendDebug(`Launching ${attempt.label}`);
      return await chromium.launch(attempt.options);
    } catch (error) {
      errors.push(`${attempt.label}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(`Could not launch a browser.\n${errors.join("\n")}`);
}

async function checkedJson(response, label) {
  const text = await response.text();
  if (!response.ok()) {
    throw new Error(`${label} failed: ${response.status()} ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

fs.writeFileSync(DEBUG_LOG, "");
fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });

const browser = await launchBrowser();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1200 },
  deviceScaleFactor: 1,
  colorScheme: "light",
});
const page = await context.newPage();
page.setDefaultTimeout(120000);
page.setDefaultNavigationTimeout(120000);

page.on("console", (msg) => appendDebug(`console:${msg.type()}: ${msg.text()}`));
page.on("pageerror", (err) => appendDebug(`pageerror: ${err.message}`));
page.on("requestfailed", (request) => appendDebug(`requestfailed: ${request.url()} ${request.failure()?.errorText ?? ""}`));

try {
  const stamp = Date.now();
  const email = `calendar-shot-${stamp}@example.local`;
  const password = "Screenshot123!";
  const selectedDate = "2026-06-08";

  appendDebug(`Registering ${email}`);
  const registerResponse = await context.request.post(`${BASE_URL}/api/backend/api/v1/auth/register`, {
    data: { email, password },
  });
  const auth = await checkedJson(registerResponse, "register");
  const userId = auth.userId;

  appendDebug("Creating birth profile");
  const profileResponse = await context.request.post(`${BASE_URL}/api/backend/api/v1/birth-profiles`, {
    data: {
      ownerUserId: userId,
      relationshipToOwner: "self",
      displayName: "Calendar Capture",
      birthDateLocal: "1990-01-15",
      birthTimeLocal: "06:30:00",
      birthPlace: "Chennai, Tamil Nadu, India",
      birthLatitude: 13.0827,
      birthLongitude: 80.2707,
      birthTimezone: "Asia/Kolkata",
      currentPlace: "Chennai, Tamil Nadu, India",
      currentLatitude: 13.0827,
      currentLongitude: 80.2707,
      currentTimezone: "Asia/Kolkata",
      calculateNow: true,
      languagePreference: "ta-en",
      birthTimeSource: "known",
      birthTimeConfidenceMinutes: 0,
    },
  });
  const profile = await checkedJson(profileResponse, "birth profile");
  const birthProfileId = profile.data.birthProfileId;
  const chartId = profile.data.chartId ?? "";

  appendDebug(`Profile ${birthProfileId} chart ${chartId}`);
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ key, state }) => {
      window.localStorage.setItem(key, JSON.stringify(state));
    },
    {
      key: STORAGE_KEY,
      state: {
        ownerUserId: userId,
        selectedDate,
        selectedVaultId: "",
        birthProfileId,
        chartId,
        birthForm: {
          ownerUserId: userId,
          displayName: "Calendar Capture",
          birthDateLocal: "1990-01-15",
          birthTimeLocal: "06:30",
          birthPlace: "Chennai, Tamil Nadu, India",
          birthLatitude: "13.0827",
          birthLongitude: "80.2707",
          birthTimezone: "Asia/Kolkata",
          currentPlace: "Chennai, Tamil Nadu, India",
          currentLatitude: "13.0827",
          currentLongitude: "80.2707",
          currentTimezone: "Asia/Kolkata",
          relationshipToOwner: "self",
          calculateNow: true,
          maritalStatus: "",
          employmentType: "",
          birthTimeSource: "known",
          birthTimeConfidenceMinutes: "0",
        },
        vaultForm: { ownerUserId: userId, name: "", defaultLanguage: "ta-en" },
        memberForm: {
          displayName: "",
          relationshipToOwner: "spouse",
          birthDateLocal: "",
          birthTimeLocal: "",
          birthPlace: "",
          birthLatitude: "",
          birthLongitude: "",
          birthTimezone: "",
          currentPlace: "",
          currentLatitude: "",
          currentLongitude: "",
          currentTimezone: "",
          memberWeight: "1.00",
          calculateNow: true,
        },
        activeTab: "calendar",
        lang: "en",
      },
    },
  );

  appendDebug("Opening dashboard");
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    await document.fonts.ready;
  });

  const monthlyButton = page.getByRole("button", { name: /Monthly/i });
  await monthlyButton.waitFor({ state: "visible" });
  await monthlyButton.click();

  appendDebug("Waiting for monthly data");
  await page.waitForResponse((response) => response.url().includes("/api/v1/panchangam/monthly") && response.ok(), { timeout: 120000 });
  await page.waitForFunction(() => {
    const loading = document.body.innerText.includes("Loading monthly panchangam");
    const hasMonthHeading = /June\s+2026/i.test(document.body.innerText);
    const hasWeekHeader = Array.from(document.querySelectorAll("p")).some((node) => node.textContent?.trim() === "Sun");
    const hasFestivalSidebar = document.body.innerText.includes("This month's events");
    const dayCells = Array.from(document.querySelectorAll("div")).filter((node) => {
      const style = window.getComputedStyle(node);
      return style.minHeight === "112px" && style.display === "flex";
    });
    return !loading && hasMonthHeading && hasWeekHeader && hasFestivalSidebar && dayCells.length >= 30;
  });

  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1200);

  const metrics = await page.evaluate(() => ({
    title: document.title,
    url: window.location.href,
    bodyHeight: document.documentElement.scrollHeight,
    bodyWidth: document.documentElement.scrollWidth,
    textSample: document.body.innerText.slice(0, 800),
  }));
  appendDebug(`metrics ${JSON.stringify(metrics)}`);

  await page.screenshot({ path: OUT_FILE, fullPage: true, type: "png" });
  console.log(OUT_FILE);
} finally {
  await browser.close();
}
