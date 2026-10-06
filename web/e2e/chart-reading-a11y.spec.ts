/**
 * Full chart reading (Family & Charts §9) — a rendered accessibility pass over
 * every state of the panel, in both themes and both languages.
 *
 * WHY THIS EXISTS. `theme-contrast.spec.ts` sweeps top-level tab panes as they
 * open. In this panel that is Story chapter 1 only: chapters 2–5, a tapped
 * planet, and the whole Astrologer view (now a lazy chunk) exist only after a
 * click, so that gate measures none of them. jsdom measures none of them
 * either — it has no layout, no composited colour and no focus rendering.
 * (docs/FULL_READING_STORY_MODE_PLAN_2026-10-04.md §13, "not run yet".)
 *
 * What it checks, per state:
 *   - axe, WCAG 2.0/2.1/2.2 A + AA rules, scoped to the panel's section;
 *   - no horizontal overflow of the section (desktop, and 375 px);
 *   - the Astrologer chunk actually arrives — the lazy load is real only if a
 *     reader who asks for it gets it.
 *
 * Blind spots, recorded beside the PASS: axe cannot see non-text contrast
 * (meter segments, aspect lines, paral dots), focus order, or whether the
 * Tamil reads well. One synthetic chart. It runs on `next dev`, whose CSP
 * refusals on lazy chunks are DXA-35 — this spec waits for the content rather
 * than asserting a clean console.
 */
import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACT_DIR = path.join(__dirname, ".artifacts", "chart-reading-a11y");

const RUN_ID = Date.now();
const EMAIL = `chart-reading-${RUN_ID}-${Math.random().toString(36).slice(2, 8)}@e2e.test`;
const PASSWORD = "ChartReading!Test123";
const CSRF = { "X-Vinaadi-CSRF": "1" };
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

type Lang = "en" | "ta";
const L = {
  chapters: { en: ["Who you are", "Your nine planets", "Running now", "Gifts & care", "What's coming"], ta: ["நீங்கள் யார்", "உங்கள் ஒன்பது கிரகங்கள்", "இப்போது நடப்பது", "பலமும் கவனமும்", "வரவிருப்பவை"] },
  chapterRail: { en: "Reading chapters", ta: "விளக்கப் பகுதிகள்" },
  sections: { en: "Reading sections", ta: "விளக்கப் பிரிவுகள்" },
  story: { en: "Story", ta: "எளிய விளக்கம்" },
  astrologer: { en: "Astrologer view", ta: "ஜோதிடர் பார்வை" },
  sun: { en: /^Sun/, ta: /^சூரியன்/ },
} as const;

// Not serial: one pass failing must not hide the other five. Each worker
// bootstraps its own synthetic account in beforeAll. 6 min: a pass visits 16
// states (5 chapters, a tapped planet, 10 ledger tabs), each with axe.
test.setTimeout(360_000);
// Every click and wait is bounded: a missing label fails in 30 s and names
// itself, instead of hanging until the test timeout (CLAUDE.md, P0-5).
test.use({ actionTimeout: 30_000 });

let context: BrowserContext;
let page: Page;

function log(msg: string) {
  // eslint-disable-next-line no-console
  console.log(`[chart-reading t=${((Date.now() - RUN_ID) / 1000).toFixed(1)}s] ${msg}`);
}

async function dismissBlockingDialogs(maxAttempts = 12) {
  for (let i = 0; i < maxAttempts; i++) {
    const dialog = page.locator('[role="dialog"][aria-modal="true"]').first();
    if (!(await dialog.isVisible().catch(() => false))) return;
    const skip = dialog.getByRole("button", { name: /^(Skip for now|இப்போது தவிர்க்கவும்)$/ });
    if (await skip.isVisible().catch(() => false)) await skip.click({ timeout: 3_000 }).catch(() => {});
    else await dialog.click({ position: { x: 3, y: 3 }, force: true }).catch(() => {});
    await page.waitForTimeout(400);
  }
}

/** Same rule as theme-contrast.spec.ts: axe measures composited pixels, so a
 *  fade caught mid-way reads as a palette failure. Bounded; loops excluded. */
async function settleAnimations() {
  await page.evaluate(async () => {
    const settling = document.getAnimations().filter((a) => {
      if (a.playState !== "running") return false;
      const timing = a.effect?.getComputedTiming();
      return !!timing && timing.iterations !== Infinity && Number.isFinite(timing.endTime as number);
    });
    if (!settling.length) return;
    await Promise.race([
      Promise.all(settling.map((a) => a.finished.catch(() => undefined))),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  });
  await page.waitForTimeout(150);
}

test.beforeAll(async ({ browser }) => {
  test.setTimeout(240_000);
  context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const api = context.request;
  const reg = await api.post("/api/backend/api/v1/auth/register", { data: { email: EMAIL, password: PASSWORD, consentGiven: true } });
  if (!reg.ok()) throw new Error(`register failed: ${reg.status()} ${await reg.text()}`);
  // register commits as the response goes out; retry the race (see theme-contrast.spec.ts).
  let login = await api.post("/api/backend/api/v1/auth/login", { data: { email: EMAIL, password: PASSWORD } });
  for (let attempt = 0; attempt < 10 && !login.ok(); attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    login = await api.post("/api/backend/api/v1/auth/login", { data: { email: EMAIL, password: PASSWORD } });
  }
  if (!login.ok()) throw new Error(`login failed: ${login.status()} ${await login.text()}`);
  // Synthetic identity, per the repo's fixture rule.
  const bp = await api.post("/api/backend/api/v1/birth-profiles", {
    data: {
      displayName: "E2E Reading Owner",
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
  log("account bootstrapped");
});

test.afterAll(async () => {
  await context?.close();
});

/**
 * Set the language where the page reads it from. The account's own language
 * (`PATCH /settings/ui`, what the toggle persists) comes back on session load
 * and overrides a stored preference, so writing localStorage alone left the
 * page English; clicking the toggle did not land either. All three are set,
 * then a reload, asserted on <html lang> and bounded.
 */
async function setLanguage(lang: Lang) {
  if ((await page.getAttribute("html", "lang")) === lang) return;
  const saved = await context.request.patch("/api/backend/api/v1/settings/ui", { data: { lang }, headers: CSRF });
  if (!saved.ok()) throw new Error(`settings/ui failed: ${saved.status()} ${await saved.text()}`);
  await page.evaluate((l) => {
    localStorage.setItem("jothidam-lang", l);
    document.cookie = `jothidam-lang=${l}; path=/; max-age=31536000; samesite=lax`;
  }, lang);
  await page.reload();
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  await expect(page.locator("html"), `the page did not switch to ${lang}`).toHaveAttribute("lang", lang, { timeout: 30_000 });
}

async function openReading(lang: Lang, theme: "light" | "dark") {
  await page.evaluate((t) => localStorage.setItem("vinaadi-theme", t), theme);
  await page.goto("/dashboard/family");
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  await dismissBlockingDialogs();
  await setLanguage(lang);
  await dismissBlockingDialogs();
  await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
  expect(await page.getAttribute("html", "data-theme")).toBe(theme);
  const section = page.locator("#hy-explain");
  await section.waitFor({ state: "visible", timeout: 90_000 });
  await section.scrollIntoViewIfNeeded();
  // Start from Story regardless of what an earlier pass left in localStorage.
  // Only click when it is not already selected: the segmented thumb animates
  // and a selected tab can read as "not stable" for the whole action timeout.
  const storyTab = section.getByRole("tab", { name: L.story[lang], exact: true });
  if ((await storyTab.getAttribute("aria-selected")) !== "true") await storyTab.click();
  await section.getByRole("tablist", { name: L.chapterRail[lang] }).waitFor({ timeout: 30_000 });
  return section;
}

type Finding = string;

async function measure(label: string, findings: Finding[]) {
  await settleAnimations();
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).include("#hy-explain").analyze();
  for (const v of results.violations) {
    for (const node of v.nodes) {
      findings.push(`[${label}] ${v.id} (${v.impact}): ${node.failureSummary?.split("\n").join(" ") ?? ""} — ${node.target.join(" ")}`);
    }
  }
  const overflow = await page.locator("#hy-explain").evaluate((el) => {
    const out: string[] = [];
    if (el.scrollWidth > el.clientWidth + 1) {
      // Name the culprits, not just the width: the deepest elements whose
      // right edge passes the section's (legible failure, CLAUDE.md P0-5).
      const edge = el.getBoundingClientRect().right + 1;
      // Skip anything inside a scroller or clip that itself fits: overflow
      // there is by design (the ledger tables, the tab strip).
      const contained = (node: HTMLElement) => {
        for (let up = node.parentElement; up && up !== el; up = up.parentElement) {
          const ox = getComputedStyle(up).overflowX;
          if (ox !== "visible" && up.getBoundingClientRect().right <= edge) return true;
        }
        return false;
      };
      const wide = [...el.querySelectorAll<HTMLElement>("*")].filter(
        (node) =>
          node.getBoundingClientRect().right > edge &&
          !contained(node) &&
          ![...node.children].some((c) => c.getBoundingClientRect().right > edge),
      );
      const names = wide.slice(0, 4).map((node) => `${node.tagName.toLowerCase()}[${Math.round(node.getBoundingClientRect().width)}px] "${(node.textContent ?? "").trim().slice(0, 40)}"`);
      out.push(`section ${el.scrollWidth} > ${el.clientWidth}: ${names.join(" | ")}`);
    }
    if (document.documentElement.scrollWidth > window.innerWidth + 1) out.push(`page ${document.documentElement.scrollWidth} > ${window.innerWidth}`);
    return out;
  });
  for (const o of overflow) findings.push(`[${label}] horizontal overflow: ${o}`);
}

async function sweep(lang: Lang, theme: "light" | "dark", tag: string) {
  const findings: Finding[] = [];
  const section = await openReading(lang, theme);

  for (const title of L.chapters[lang]) {
    // The life-focus picker can open late (after a reload); clear it first.
    await dismissBlockingDialogs(3);
    await section.getByRole("tab", { name: new RegExp(title) }).click();
    await measure(`${tag} · story · ${title}`, findings);
    if (title === L.chapters[lang][1]) {
      await section.getByRole("tabpanel").getByRole("button", { name: L.sun[lang] }).first().click();
      await measure(`${tag} · story · planet expanded`, findings);
    }
  }

  // The Astrologer view is a lazy chunk: the toggle must actually bring it in.
  await section.getByRole("tab", { name: L.astrologer[lang], exact: true }).click();
  const ledger = section.getByRole("tablist", { name: L.sections[lang] });
  await expect(ledger, "the Astrologer view chunk never rendered").toBeVisible({ timeout: 45_000 });
  const tabs = ledger.getByRole("tab");
  const count = await tabs.count();
  expect(count, "Astrologer view lost sections").toBeGreaterThanOrEqual(10);
  for (let i = 0; i < count; i++) {
    const tab = tabs.nth(i);
    const name = (await tab.innerText()).trim();
    await tab.click();
    await measure(`${tag} · astrologer · ${name}`, findings);
  }

  if (findings.length) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
    fs.writeFileSync(path.join(ARTIFACT_DIR, `${tag.replace(/\W+/g, "-")}.txt`), findings.join("\n") + "\n");
    log(`${findings.length} finding(s) in ${tag}:\n${findings.join("\n")}`);
  }
  return findings;
}

for (const lang of ["en", "ta"] as const) {
  for (const theme of ["light", "dark"] as const) {
    test(`full chart reading: no WCAG A/AA violations or overflow — ${lang}, ${theme}`, async () => {
      await page.setViewportSize({ width: 1280, height: 900 });
      expect(await sweep(lang, theme, `${lang}-${theme}-1280`)).toEqual([]);
    });
  }
  test(`full chart reading at 375 px: no violations or overflow — ${lang}`, async () => {
    await page.setViewportSize({ width: 375, height: 812 });
    expect(await sweep(lang, "light", `${lang}-light-375`)).toEqual([]);
  });
}
