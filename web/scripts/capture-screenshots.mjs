import fs from "node:fs";
import path from "node:path";
import { AxeBuilder } from "@axe-core/playwright";
import { chromium } from "playwright";

const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? "http://127.0.0.1:3000";
const OUT_DIR = path.resolve("artifacts", "screenshots", "marketing-site");
const REPORT_FILE = path.resolve("artifacts", "screenshots", "marketing-site-report.json");
const FAIL_ON_ISSUES = process.env.SCREENSHOT_FAIL_ON_ISSUES !== "0";

const VIEWPORTS = [
  { name: "iphone-se", width: 375, height: 667, kind: "mobile" },
  { name: "iphone-15-pro", width: 393, height: 852, kind: "mobile" },
  { name: "pixel-7", width: 412, height: 915, kind: "mobile" },
  { name: "ipad-768", width: 768, height: 1024, kind: "tablet" },
  { name: "ipad-landscape-1024", width: 1024, height: 768, kind: "tablet" },
  { name: "desktop-1440", width: 1440, height: 1000, kind: "desktop" },
];

const RENDER_MODES = [
  { name: "default", suffix: "", reducedMotion: "no-preference" },
  { name: "reduced-motion", suffix: "__reduced-motion", reducedMotion: "reduce" },
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
  { route: "/learn/what-is-chandrashtama", file: "learn-chandrashtama.png" },
  { route: "/learn/how-to-read-a-jadhagam", file: "learn-jadhagam.png" },
  { route: "/learn/why-birth-time-matters", file: "learn-birth-time.png" },
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

async function waitForStablePage(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);
}

async function collectLayoutIssues(page) {
  return page.evaluate(() => {
    const issues = [];
    const isVisible = (el) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
    };

    if (document.documentElement.scrollWidth > window.innerWidth + 1) {
      issues.push({
        type: "horizontal-overflow",
        detail: `${document.documentElement.scrollWidth}px content in ${window.innerWidth}px viewport`,
      });
    }

    const clipped = [];
    document.querySelectorAll("p, h1, h2, h3, h4, h5, h6, button, a, label").forEach((el) => {
      if (!isVisible(el)) return;
      const style = window.getComputedStyle(el);
      if (style.overflow === "visible") return;
      if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) {
        clipped.push(el.textContent?.trim().slice(0, 80) || el.tagName.toLowerCase());
      }
    });
    if (clipped.length > 0) {
      issues.push({ type: "text-clipping", count: clipped.length, samples: clipped.slice(0, 5) });
    }

    const tapTargetIssues = [];
    document.querySelectorAll("a[href], button, input, select, textarea, [role='button'], [tabindex]:not([tabindex='-1'])").forEach((el) => {
      if (!isVisible(el)) return;
      if (el.matches("input[type='hidden'], [disabled], [aria-disabled='true']")) return;
      const rect = el.getBoundingClientRect();
      const hasText = Boolean(el.textContent?.trim()) || Boolean(el.getAttribute("aria-label"));
      const isInlineTextLink = el.tagName.toLowerCase() === "a" && hasText && rect.height < 32 && rect.width > 44;
      if (!isInlineTextLink && (rect.width < 44 || rect.height < 44)) {
        tapTargetIssues.push({
          tag: el.tagName.toLowerCase(),
          label: el.getAttribute("aria-label") || el.textContent?.trim().slice(0, 60) || "",
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
    });
    if (tapTargetIssues.length > 0) {
      issues.push({ type: "tap-target-too-small", count: tapTargetIssues.length, samples: tapTargetIssues.slice(0, 5) });
    }

    const distortedImages = [];
    document.querySelectorAll("img").forEach((img) => {
      if (!isVisible(img)) return;
      if (!img.naturalWidth || !img.naturalHeight) return;
      const naturalRatio = img.naturalWidth / img.naturalHeight;
      const displayRatio = img.width / img.height;
      if (Math.abs(naturalRatio - displayRatio) > 0.5) {
        distortedImages.push(img.getAttribute("src") || img.getAttribute("alt") || "image");
      }
    });
    if (distortedImages.length > 0) {
      issues.push({ type: "image-ratio-issues", count: distortedImages.length, samples: distortedImages.slice(0, 5) });
    }

    return issues;
  });
}

async function collectA11yIssues(page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  return result.violations
    .filter((violation) => violation.impact === "critical" || violation.impact === "serious")
    .map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes.slice(0, 5).map((node) => ({
        target: node.target,
        failureSummary: node.failureSummary,
      })),
    }));
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await launchBrowser();
const results = { baseUrl: BASE_URL, generatedAt: new Date().toISOString(), total: 0, issues: [] };

try {
  for (const viewport of VIEWPORTS) {
    for (const mode of RENDER_MODES) {
      console.log(`\nStarting ${mode.name} captures for ${viewport.name} (${viewport.width}x${viewport.height})`);

      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        colorScheme: "light",
        reducedMotion: mode.reducedMotion,
        isMobile: viewport.kind === "mobile",
      });
      const page = await context.newPage();
      page.setDefaultNavigationTimeout(60000);

      for (const item of PAGES) {
        const targetUrl = new URL(item.route, BASE_URL).toString();
        const baseFileName = item.file.replace(".png", "");
        const outFile = path.join(OUT_DIR, `${baseFileName}__${viewport.name}${mode.suffix}.png`);

        results.total++;
        try {
          console.log(`  Capturing ${item.route} (${viewport.name}, ${mode.name})...`);
          await page.goto(targetUrl, { waitUntil: "networkidle" });
          await waitForStablePage(page);

          const layoutIssues = await collectLayoutIssues(page);
          const a11yIssues = await collectA11yIssues(page);
          await page.screenshot({ path: outFile, fullPage: true, type: "png" });

          if (layoutIssues.length > 0 || a11yIssues.length > 0) {
            results.issues.push({
              route: item.route,
              viewport: viewport.name,
              mode: mode.name,
              screenshot: outFile,
              layoutIssues,
              accessibilityIssues: a11yIssues,
            });
            console.log(`    Issues: ${layoutIssues.length} layout, ${a11yIssues.length} accessibility`);
          } else {
            console.log(`    Saved ${outFile}`);
          }
        } catch (error) {
          results.issues.push({
            route: item.route,
            viewport: viewport.name,
            mode: mode.name,
            error: error instanceof Error ? error.message : String(error),
          });
          console.error(`    Error: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      await context.close();
    }
  }
} finally {
  await browser.close();
}

fs.mkdirSync(path.dirname(REPORT_FILE), { recursive: true });
fs.writeFileSync(REPORT_FILE, `${JSON.stringify(results, null, 2)}\n`, "utf8");

console.log("\n" + "=".repeat(60));
console.log("SCREENSHOT QA SUMMARY");
console.log("=".repeat(60));
console.log(`Total captures attempted: ${results.total}`);
console.log(`Pages with issues: ${results.issues.length}`);
console.log(`Report: ${REPORT_FILE}`);

if (results.issues.length > 0) {
  console.log("\nBROKEN PAGES:\n");
  results.issues.forEach((item) => {
    const layout = item.layoutIssues?.map((issue) => issue.type).join(", ");
    const a11y = item.accessibilityIssues?.map((issue) => issue.id).join(", ");
    const issueStr = item.error || [layout, a11y].filter(Boolean).join(" | ");
    console.log(`  - ${item.route} @ ${item.viewport} / ${item.mode}`);
    console.log(`    ${issueStr}`);
  });
} else {
  console.log("\nAll pages passed screenshot QA across all viewports.");
}

if (FAIL_ON_ISSUES && results.issues.length > 0) {
  process.exitCode = 1;
}