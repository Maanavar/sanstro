import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? "http://127.0.0.1:3100";
const OUT_DIR = path.resolve("artifacts", "screenshots", "marketing-site");

const PAGES = [
  { route: "/", file: "home.png" },
  { route: "/features/daily-guidance", file: "features-daily-guidance.png" },
  { route: "/features/family-planning", file: "features-family-planning.png" },
  { route: "/features/chart-guidance", file: "features-chart-guidance.png" },
  { route: "/features/timing-and-decisions", file: "features-timing-and-decisions.png" },
  { route: "/tools/marriage-porutham-calculator", file: "tools-marriage-porutham-calculator.png" },
  { route: "/tools/jadhagam-generator", file: "tools-jadhagam-generator.png" },
  { route: "/tools/daily-panchangam-planner", file: "tools-daily-panchangam-planner.png" },
  { route: "/tools/birth-time-rectification", file: "tools-birth-time-rectification.png" },
  { route: "/trust/methodology", file: "trust-methodology.png" },
  { route: "/trust/about-vinaadi", file: "trust-about-vinaadi.png" },
  { route: "/privacy", file: "privacy.png" },
  { route: "/terms", file: "terms.png" },
  { route: "/learn/what-is-porutham", file: "learn-what-is-porutham.png" },
  { route: "/learn/what-is-thirukanitham", file: "learn-what-is-thirukanitham.png" },
  { route: "/learn/what-is-chandrashtama", file: "learn-what-is-chandrashtama.png" },
  { route: "/learn/how-to-read-a-jadhagam", file: "learn-how-to-read-a-jadhagam.png" },
  { route: "/learn/why-birth-time-matters", file: "learn-why-birth-time-matters.png" },
];

async function launchBrowser() {
  const attempts = [
    { label: "msedge", options: { headless: true, channel: "msedge" } },
    { label: "bundled chromium", options: { headless: true } },
  ];

  const errors = [];
  for (const attempt of attempts) {
    try {
      return await chromium.launch(attempt.options);
    } catch (error) {
      errors.push(`${attempt.label}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(`Could not launch a browser.\n${errors.join("\n")}`);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await launchBrowser();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1200 },
  deviceScaleFactor: 1,
  colorScheme: "light",
});
const page = await context.newPage();
page.setDefaultNavigationTimeout(60000);

try {
  for (const item of PAGES) {
    const targetUrl = new URL(item.route, BASE_URL).toString();
    const outFile = path.join(OUT_DIR, item.file);

    console.log(`Capturing ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      await document.fonts.ready;
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: outFile, fullPage: true, type: "png" });
    console.log(`Saved ${outFile}`);
  }
} finally {
  await browser.close();
}
