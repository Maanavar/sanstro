/**
 * Marketing quality gates + screenshot baselines.
 *
 * ── Why this file was invisible for six weeks ──────────────────────────────
 * `.gitignore` carried `web/tests/`, added in fbed72d as "web/tests directory
 * for test-generated files". It is not generated — it is this source file. So
 * from 2026-06-26 the entire visual suite was outside git: no CI, no other
 * checkout, while playwright.config.ts kept configuring three projects against
 * it. Restored 2026-08-10; the rendered PNGs stay ignored because Playwright
 * names them per platform (`-win32`) and CI runs ubuntu-latest.
 *
 * ── Why the tap-target check is a ratchet and not `toEqual([])` ────────────
 * All 33 tests failed for five weeks, so the suite gated nothing: a permanently
 * red check is read as broken, not as a finding. The 44 px floor below is NOT
 * relaxed — the controls really are 40×40 and that is a real WCAG 2.5.5 issue
 * with its own item. What changes is the assertion: each page is pinned at the
 * count measured on 2026-08-10, so the number can fall (update the baseline
 * when it does) but never rise. That keeps the standard while making a
 * regression loud, which is the whole point of the file.
 *
 * Horizontal overflow stays a hard `toEqual([])` — there is none today, so
 * there is nothing to ratchet and any appearance is a regression.
 */
import fs from "node:fs";

import { expect, test } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

/**
 * Tap targets below 44 px per page, measured 2026-08-10 against the pruned
 * marketing.css on a warm dev server. These are the pre-existing 40×40 controls
 * (`tap-target-too-small`), unchanged by the F4 CSS split and by F4 step 5's
 * prune — the diff ratios and counts are identical on both sides.
 */
const TAP_TARGET_BASELINE: Record<string, number> = {
  home: 2,
  "daily-guidance": 1,
  "family-planning": 1,
  "chart-guidance": 1,
  "timing-and-decisions": 1,
  privacy: 1,
  "learn-porutham": 1,
  "learn-thirukanitham": 1,
};

const QUALITY_PAGES = [
  { route: "/", name: "home" },
  { route: "/features/daily-guidance", name: "daily-guidance" },
  { route: "/features/family-planning", name: "family-planning" },
  { route: "/features/chart-guidance", name: "chart-guidance" },
  { route: "/features/timing-and-decisions", name: "timing-and-decisions" },
  { route: "/privacy", name: "privacy" },
  { route: "/learn/what-is-porutham", name: "learn-porutham" },
  { route: "/learn/what-is-thirukanitham", name: "learn-thirukanitham" },
];

const VISUAL_BASELINE_PAGES = [
  { route: "/", name: "home" },
  { route: "/features/daily-guidance", name: "daily-guidance" },
  { route: "/trust/methodology", name: "methodology" },
];

async function settlePage(page: import("@playwright/test").Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
}

test.describe("visual quality gates", () => {
  for (const item of QUALITY_PAGES) {
    test(`${item.name} has no serious accessibility or layout regressions`, async ({ page }) => {
      await page.goto(item.route, { waitUntil: "networkidle" });
      await settlePage(page);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const seriousViolations = accessibilityScanResults.violations.filter(
        (violation) => violation.impact === "critical" || violation.impact === "serious",
      );
      expect(seriousViolations, JSON.stringify(seriousViolations, null, 2)).toEqual([]);

      const layoutIssues = await page.evaluate(() => {
        const issues: Array<Record<string, unknown>> = [];
        const isVisible = (el: Element) => {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
        };

        if (document.documentElement.scrollWidth > window.innerWidth + 1) {
          issues.push({ type: "horizontal-overflow", scrollWidth: document.documentElement.scrollWidth, viewport: window.innerWidth });
        }

        const smallTargets: Array<Record<string, unknown>> = [];
        document.querySelectorAll("a[href], button, input, select, textarea, [role='button'], [tabindex]:not([tabindex='-1'])").forEach((el) => {
          if (!isVisible(el)) return;
          if (el.matches("input[type='hidden'], [disabled], [aria-disabled='true']")) return;
          const rect = el.getBoundingClientRect();
          const hasText = Boolean(el.textContent?.trim()) || Boolean(el.getAttribute("aria-label"));
          const isInlineTextLink = el.tagName.toLowerCase() === "a" && hasText && rect.height < 44 && rect.width > 44;
          if (!isInlineTextLink && (rect.width < 44 || rect.height < 44)) {
            smallTargets.push({ tag: el.tagName.toLowerCase(), text: el.textContent?.trim().slice(0, 40), width: rect.width, height: rect.height });
          }
        });

        if (smallTargets.length > 0) {
          issues.push({ type: "tap-target-too-small", samples: smallTargets.slice(0, 5), count: smallTargets.length });
        }

        return issues;
      });

      // Overflow: hard gate, nothing to ratchet — there is none today.
      const overflow = layoutIssues.filter((i) => i.type === "horizontal-overflow");
      expect(overflow, JSON.stringify(overflow, null, 2)).toEqual([]);

      // Tap targets: ratchet against the measured baseline. A page missing from
      // the map is a new page and must start at zero rather than silently
      // inheriting a free pass.
      const tapIssue = layoutIssues.find((i) => i.type === "tap-target-too-small");
      const count = tapIssue ? Number(tapIssue.count) : 0;
      const allowed = TAP_TARGET_BASELINE[item.name] ?? 0;
      expect(
        count,
        `${item.name}: ${count} controls under the 44px floor, baseline ${allowed}.\n` +
          `If this rose, a control shrank — fix it. If it fell, lower the baseline in ` +
          `TAP_TARGET_BASELINE.\n${JSON.stringify(tapIssue ?? {}, null, 2)}`,
      ).toBeLessThanOrEqual(allowed);
    });
  }
});

test.describe("visual baselines", () => {
  for (const item of VISUAL_BASELINE_PAGES) {
    test(`${item.name} matches approved screenshot`, async ({ page }, testInfo) => {
      // The baselines are platform-specific and deliberately not committed (see
      // the header), so on any machine that has not generated them there is
      // nothing to compare against. Skipping says that plainly; the alternative
      // is a CI failure that means "this file has never been here", which reads
      // as a regression and is not one. Run `npm run test:visual:baseline` to
      // generate them locally.
      const baseline = testInfo.snapshotPath(`${item.name}.png`);
      test.skip(!fs.existsSync(baseline), `no local baseline at ${baseline} — run test:visual:baseline`);

      await page.goto(item.route, { waitUntil: "networkidle" });
      await settlePage(page);
      await expect(page).toHaveScreenshot(`${item.name}.png`, {
        fullPage: true,
        animations: "disabled",
        maxDiffPixelRatio: 0.02,
      });
    });
  }
});