import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? "http://127.0.0.1:3000";
const OUT_DIR = path.resolve("artifacts", "screenshots", "marketing-site");

const VIEWPORTS = [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "ipad-768", width: 768, height: 1024 },
  { name: "ipad-landscape-1024", width: 1024, height: 768 },
];

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

const results = {
  total: 0,
  issues: [],
};

try {
  for (const viewport of VIEWPORTS) {
    console.log(`\n📱 Starting captures for ${viewport.name} (${viewport.width}x${viewport.height})`);
    
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      colorScheme: "light",
    });
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(60000);

    for (const item of PAGES) {
      const targetUrl = new URL(item.route, BASE_URL).toString();
      const baseFileName = item.file.replace(".png", "");
      const outFile = path.join(OUT_DIR, `${baseFileName}__${viewport.name}.png`);

      results.total++;
      try {
        console.log(`  Capturing ${item.route} (${viewport.name})...`);
        await page.goto(targetUrl, { waitUntil: "networkidle" });
        
        // Check for layout issues
        const layoutIssues = await page.evaluate(() => {
          const issues = [];
          
          // Check for horizontal overflow
          if (window.innerWidth < document.documentElement.scrollWidth) {
            issues.push("horizontal-overflow");
          }
          
          // Check for text clipping
          const elements = document.querySelectorAll("p, h1, h2, h3, h4, h5, h6, button, a");
          let clipped = 0;
          elements.forEach((el) => {
            if (el.scrollHeight > el.clientHeight) {
              clipped++;
            }
          });
          if (clipped > 5) {
            issues.push("text-clipping");
          }
          
          // Check for overlapping elements
          const buttons = document.querySelectorAll("button, [role='button']");
          if (buttons.length > 0) {
            let overlapped = 0;
            buttons.forEach((btn) => {
              const rect = btn.getBoundingClientRect();
              if (rect.right > window.innerWidth) {
                overlapped++;
              }
            });
            if (overlapped > 0) {
              issues.push("buttons-overflow");
            }
          }
          
          // Check for images with bad aspect ratios
          const images = document.querySelectorAll("img");
          let badImages = 0;
          images.forEach((img) => {
            if (img.naturalWidth && img.naturalHeight) {
              const ratio = img.naturalWidth / img.naturalHeight;
              const displayRatio = img.width / img.height;
              if (Math.abs(ratio - displayRatio) > 0.5) {
                badImages++;
              }
            }
          });
          if (badImages > 3) {
            issues.push("image-ratio-issues");
          }
          
          return issues;
        });
        
        await page.evaluate(async () => {
          await document.fonts.ready;
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(800);
        await page.screenshot({ path: outFile, fullPage: true, type: "png" });
        
        if (layoutIssues.length > 0) {
          results.issues.push({
            route: item.route,
            viewport: viewport.name,
            issues: layoutIssues,
          });
          console.log(`    ⚠️  Issues detected: ${layoutIssues.join(", ")}`);
        } else {
          console.log(`    ✅ Saved ${outFile}`);
        }
      } catch (error) {
        results.issues.push({
          route: item.route,
          viewport: viewport.name,
          error: error.message,
        });
        console.error(`    ❌ Error: ${error.message}`);
      }
    }
    
    await context.close();
  }
} finally {
  await browser.close();
}

// Report summary
console.log("\n" + "=".repeat(60));
console.log("SCREENSHOT CAPTURE SUMMARY");
console.log("=".repeat(60));
console.log(`Total captures attempted: ${results.total}`);
console.log(`Pages with issues: ${results.issues.length}`);

if (results.issues.length > 0) {
  console.log("\n🔴 BROKEN PAGES:\n");
  results.issues.forEach((item) => {
    const issueStr = item.error || item.issues.join(", ");
    console.log(`  • ${item.route} @ ${item.viewport}`);
    console.log(`    └─ ${issueStr}`);
  });
} else {
  console.log("\n✅ All pages look good across all viewports!");
}
