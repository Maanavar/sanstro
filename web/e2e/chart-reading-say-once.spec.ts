/**
 * FTR-18 — "say it once", as a gate.
 *
 * The Story view (§9) sits under §3–§8 on Family & Charts. A reading that
 * repeats a sentence the page already said is what made the old panel feel
 * endless (docs/FULL_READING_STORY_MODE_PLAN_2026-10-04.md §2.2 item 5). The
 * rule: a sentence renders once per page; a name or number may recur as a
 * label (a planet's name in §5 and in Chapter 2 is navigation, not repetition).
 *
 * The check: every sentence of ≥ MIN_WORDS words visible in a Story chapter
 * (before any tap) must not also be visible in §3–§8. Measured in both
 * languages, in a real browser, because jsdom cannot mount the whole page.
 *
 * Blind spots, recorded beside the PASS: it compares exact sentences, so a
 * paraphrase of the same fact passes; it reads only pre-tap text on both
 * sides; one synthetic chart; and it says nothing about whether the chapter
 * still reads well once the repeat is gone.
 */
import { test, expect, type Page, type BrowserContext } from "@playwright/test";

const RUN_ID = Date.now();
const EMAIL = `say-once-${RUN_ID}-${Math.random().toString(36).slice(2, 8)}@e2e.test`;
const PASSWORD = "SayOnce!Test123";
const CSRF = { "X-Vinaadi-CSRF": "1" };
const MIN_WORDS = 6;
const ABOVE = ["#hy-overview", "#hy-charts", "#hy-planets", "#hy-dashas", "#hy-insights", "#hy-forecast"];
const CHAPTERS = {
  en: ["Who you are", "Your nine planets", "Running now", "Gifts & care", "What's coming"],
  ta: ["நீங்கள் யார்", "உங்கள் ஒன்பது கிரகங்கள்", "இப்போது நடப்பது", "பலமும் கவனமும்", "வரவிருப்பவை"],
} as const;
const STORY = { en: "Story", ta: "எளிய விளக்கம்" } as const;

// Not serial: an English failure must not hide the Tamil result.
test.setTimeout(240_000);
// Every click and wait is bounded: a missing label fails in 30 s and names
// itself, instead of hanging until the test timeout (CLAUDE.md, P0-5).
test.use({ actionTimeout: 30_000 });

let context: BrowserContext;
let page: Page;

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

test.beforeAll(async ({ browser }) => {
  test.setTimeout(240_000);
  context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const api = context.request;
  const reg = await api.post("/api/backend/api/v1/auth/register", { data: { email: EMAIL, password: PASSWORD, consentGiven: true } });
  if (!reg.ok()) throw new Error(`register failed: ${reg.status()} ${await reg.text()}`);
  let login = await api.post("/api/backend/api/v1/auth/login", { data: { email: EMAIL, password: PASSWORD } });
  for (let attempt = 0; attempt < 10 && !login.ok(); attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    login = await api.post("/api/backend/api/v1/auth/login", { data: { email: EMAIL, password: PASSWORD } });
  }
  if (!login.ok()) throw new Error(`login failed: ${login.status()} ${await login.text()}`);
  // Synthetic identity, per the repo's fixture rule.
  const bp = await api.post("/api/backend/api/v1/birth-profiles", {
    data: {
      displayName: "E2E Say Once Owner",
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

function sentences(text: string): string[] {
  return text
    .split(/[.!?।\n]+/)
    .map((s) => s.replace(/\s+/g, " ").trim().toLowerCase())
    .filter((s) => s.split(" ").length >= MIN_WORDS);
}

for (const lang of ["en", "ta"] as const) {
  test(`no Story sentence repeats one already on the page — ${lang}`, async () => {
    await page.goto("/dashboard/family");
    await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
    await dismissBlockingDialogs();
    // The account language, not just the stored preference: it comes back on
    // session load and overrides a written cookie (see chart-reading-a11y.spec.ts).
    if ((await page.getAttribute("html", "lang")) !== lang) {
      const saved = await context.request.patch("/api/backend/api/v1/settings/ui", { data: { lang }, headers: CSRF });
      if (!saved.ok()) throw new Error(`settings/ui failed: ${saved.status()} ${await saved.text()}`);
      await page.evaluate((l) => {
        localStorage.setItem("jothidam-lang", l);
        document.cookie = `jothidam-lang=${l}; path=/; max-age=31536000; samesite=lax`;
      }, lang);
      await page.reload();
      await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
      await expect(page.locator("html"), `the page did not switch to ${lang}`).toHaveAttribute("lang", lang, { timeout: 30_000 });
      await dismissBlockingDialogs();
    }
    const section = page.locator("#hy-explain");
    await section.waitFor({ state: "visible", timeout: 90_000 });
    const storyTab = section.getByRole("tab", { name: STORY[lang], exact: true });
    if ((await storyTab.getAttribute("aria-selected")) !== "true") await storyTab.click();

    // The sections above must have rendered, or the comparison is vacuous.
    const above = new Set<string>();
    for (const sel of ABOVE) {
      const loc = page.locator(sel);
      if (!(await loc.count())) continue;
      for (const s of sentences(await loc.innerText())) above.add(s);
    }
    expect(above.size, "the sections above §9 rendered too little text to compare against").toBeGreaterThan(20);

    const repeats: string[] = [];
    for (const title of CHAPTERS[lang]) {
      // The life-focus picker can open late (after a reload); clear it first.
      await dismissBlockingDialogs(3);
      await section.getByRole("tab", { name: new RegExp(title) }).click();
      await page.waitForTimeout(300);
      for (const s of sentences(await section.getByRole("tabpanel").innerText())) {
        if (above.has(s)) repeats.push(`[${title}] ${s}`);
      }
    }
    if (repeats.length) console.log(`[say-once ${lang}] ${repeats.length} repeated sentence(s):\n${repeats.join("\n")}`);
    expect(repeats).toEqual([]);
  });
}
