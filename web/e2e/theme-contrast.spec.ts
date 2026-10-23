/**
 * WCAG contrast regression gate for BOTH Nova themes.
 *
 * WHY THIS EXISTS. The 2026-08-21 colour audit found eight AA failures that had
 * shipped, and every one of them was invisible to the tooling we had:
 *
 *   - Unit tests never resolve a token cascade, so nothing could see that
 *     `--color-mid` (#B86A00, inherited faithfully from the design system's own
 *     light `--warning`) is 3.85:1 on cream across ~50 text call sites.
 *   - A literal-hex grep — the first pass's method — finds none of it, because
 *     every one of those call sites is correctly token-driven. The defect was in
 *     the token's *value*, not in anyone's discipline.
 *   - The one static check that could have caught it was never run against the
 *     light block, on the stated grounds that light was an opt-in minority path.
 *     It wasn't: UXD-03 made System follow the OS, so light is the default for
 *     every OS-light user. The safety argument was void for months.
 *
 * So the gate has to be a real browser measuring real composited pixels. axe
 * resolves var() chains, alpha compositing, and gradients-behind-text the way
 * the user's eye does; a script over the stylesheet resolves none of those.
 *
 * WHY IT SWEEPS BOTH THEMES RATHER THAN THE ACTIVE ONE. Two of the audit's
 * seven findings (F5's Rahu ribbon label, F6's Ketu glyph) were cases where a
 * fix had been reasoned out correctly in one theme and never carried to its
 * twin. A single-theme pass reproduces exactly that blind spot.
 *
 * The theme is set the way the app sets it — localStorage + the `data-theme`
 * attribute the pre-paint script in app/layout.tsx stamps — rather than through
 * Playwright's `colorScheme`, so this exercises the real resolution path
 * including the `.cd-shell` cascade that F4 turned on.
 */
import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACT_DIR = path.join(__dirname, ".artifacts", "theme-contrast");

const RUN_ID = Date.now();
const EMAIL = `theme-contrast-${RUN_ID}-${Math.random().toString(36).slice(2, 8)}@e2e.test`;
const PASSWORD = "ThemeContrast!Test123";
const CSRF = { "X-Vinaadi-CSRF": "1" };

test.describe.configure({ mode: "serial" });
test.setTimeout(180_000);

let context: BrowserContext;
let page: Page;

function log(msg: string) {
  // eslint-disable-next-line no-console
  console.log(`[theme-contrast t=${((Date.now() - RUN_ID) / 1000).toFixed(1)}s] ${msg}`);
}

async function dismissBlockingDialogs(maxAttempts = 12) {
  // The focus picker's "Skip for now" closes at once and saves BALANCED in the
  // background (life-focus plan, Phase 0), so it is the real user path and it
  // stops the picker coming back. Other first-run modals: backdrop click.
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
  // `register` commits in a `yield` dependency's teardown, which runs as the
  // response goes out — so a login issued the instant the 200 lands can race
  // the INSERT and come back 401 with the row arriving milliseconds later. This
  // spec has failed that way in its `beforeAll`, which aborts all four cases
  // and reads as a broken contrast gate rather than a flaky bootstrap.
  let login = await api.post("/api/backend/api/v1/auth/login", { data: { email: EMAIL, password: PASSWORD } });
  for (let attempt = 0; attempt < 10 && !login.ok(); attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    login = await api.post("/api/backend/api/v1/auth/login", { data: { email: EMAIL, password: PASSWORD } });
  }
  if (!login.ok()) throw new Error(`login failed: ${login.status()} ${await login.text()}`);

  // Synthetic identity, per the repo's fixture rule.
  const bp = await api.post("/api/backend/api/v1/birth-profiles", {
    data: {
      displayName: "E2E Contrast Owner",
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

  // A vault with one member — the boundary dashboard-render-pass.spec.ts pinned
  // down: an empty vault leaves `memberMeta` empty and the chart sections never
  // mount, so half the palette would go unmeasured.
  const vault = await api.post("/api/backend/api/v1/family-vaults", {
    data: { name: "E2E Contrast Family" },
    headers: CSRF,
  });
  if (!vault.ok()) throw new Error(`vault failed: ${vault.status()} ${await vault.text()}`);
  const vaultId = (await vault.json()).data.familyVaultId as string;

  const spouse = await api.post(`/api/backend/api/v1/family-vaults/${vaultId}/members`, {
    data: {
      displayName: "E2E Contrast Spouse",
      relationshipToOwner: "spouse",
      birthDateLocal: "1992-08-20",
      birthTimeLocal: "14:15:00",
      birthPlace: "Madurai, Tamil Nadu, India",
      birthLatitude: 9.9252,
      birthLongitude: 78.1198,
      birthTimezone: "Asia/Kolkata",
      calculateNow: true,
      genderForTraditionalRules: "female",
      maritalStatus: "married",
    },
    headers: CSRF,
  });
  if (!spouse.ok()) throw new Error(`spouse failed: ${spouse.status()} ${await spouse.text()}`);

  page = await context.newPage();
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  await dismissBlockingDialogs();
  log("account bootstrapped");
});

test.afterAll(async () => {
  await context?.close();
});

/** Set the theme through the app's own mechanism, then let the shell repaint. */
async function applyTheme(theme: "light" | "dark") {
  await page.evaluate((t) => {
    localStorage.setItem("vinaadi-theme", t);
    document.documentElement.setAttribute("data-theme", t);
  }, theme);
  await page.waitForTimeout(500);
  // Guard against measuring the wrong palette: a silently-failing set would
  // otherwise produce a confident PASS for a theme that was never rendered.
  expect(await page.getAttribute("html", "data-theme")).toBe(theme);
}

/**
 * Waits for in-flight entrance animations to finish before axe measures.
 *
 * WHY. axe reports *composited* pixels, which is the whole reason this gate is
 * a browser and not a stylesheet script — but it means an element caught
 * mid-fade is measured at its transitional alpha, not its designed colour.
 * Nova fades almost everything in: `.nova-stagger > *` and `.nova-reveal` run
 * `nova-rise` (opacity 0->1) per section, and `.drawer__panel` runs
 * `drawer-panel-in` (opacity 0->1, 220ms) on open.
 *
 * Left unhandled that makes this gate non-deterministic, and it demonstrably
 * was: on 2026-09-28 the same commit produced a day-drawer run with seven
 * violations and, minutes later, a clean one. The seven were arithmetic on the
 * panel at ~0.91 opacity over its own semi-opaque black backdrop: every ground
 * axe reported reproduced exactly as the designed token darkened by that one
 * alpha (--color-accent-muted and --color-surface-soft both landed ~5% down),
 * i.e. the gate was reporting the fade, not the palette. It also explains the
 * shape of the report — a whole pane failing at once, at ratios near 1.3,
 * which no palette regression produces. A gate that can pass or fail on
 * identical
 * input proves nothing in either direction, which is worse than a gate that
 * fails: a green tick from it gets inherited as "this theme is clean".
 *
 * Infinite animations are excluded deliberately. The hero's 240s rasi-chakra
 * rotation and the skeleton shimmers never reach `finished`, so awaiting them
 * would hang until the test timeout. And the whole wait is bounded rather than
 * open-ended — an entrance animation that never settles should cost this gate
 * a bounded delay and a real measurement, not a 9-minute timeout with no
 * result (which is exactly how the first attempt of that same run died).
 */
async function settleAnimations() {
  await page.evaluate(async () => {
    const settling = document.getAnimations().filter((a) => {
      if (a.playState !== "running") return false;
      const timing = a.effect?.getComputedTiming();
      // iterations: Infinity => a loop (shimmer, the chakra spin). endTime is
      // Infinity for those too; either check alone is enough, both is cheap.
      return !!timing && timing.iterations !== Infinity && Number.isFinite(a.effect!.getComputedTiming().endTime as number);
    });
    if (!settling.length) return;
    await Promise.race([
      Promise.all(settling.map((a) => a.finished.catch(() => undefined))),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  });
  // One frame past the last commit, so the final values are painted.
  await page.waitForTimeout(150);
}

/** Reached the same way nova-sweep does — a label the nav does not render makes
 *  the click hang until timeout rather than fail, so keep this list in step with
 *  dashboard-hero.tsx's TAB_DEFS. */
const TABS = ["Today", "Calendar", "Family & Charts", "Goals", "Life Areas"] as const;

async function goToTab(label: string) {
  // dismissBlockingDialogs() returns immediately once no dialog is visible, so
  // capping attempts below the default bought no speed on the common case —
  // only a reliability loss on the rare one where a dialog takes a couple of
  // render cycles to actually unmount after its dismiss click. Found live: the
  // day-drawer flow below intercepted on a life-mode-picker dialog that a
  // 3-attempt cap didn't clear in time on a cold dev build.
  await dismissBlockingDialogs();
  await page.getByRole("button", { name: label, exact: true }).first().click();
  await page.waitForTimeout(1500);
  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
  // Every pane stagger-reveals its sections; measure them at their real colours.
  await settleAnimations();
}

for (const theme of ["light", "dark"] as const) {
  test(`no WCAG AA contrast violations in ${theme} theme`, async () => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
    await dismissBlockingDialogs();
    await applyTheme(theme);

    const offenders: string[] = [];
    /** Grouped by the (ink, ground, size) triple rather than by element: one
     *  bad token pair shows up as dozens of nodes, and the triple is the thing
     *  that actually needs a decision. */
    const pairs = new Map<string, { count: number; ratio: number; tabs: Set<string>; sample: string }>();

    for (const tab of TABS) {
      await goToTab(tab);

      const results = await new AxeBuilder({ page })
        // Only the contrast rule: this spec is a palette gate, not a general
        // a11y sweep. F8/F9/F10 already own names, roles and labels, and
        // bundling them here would make a palette regression arrive as one
        // failure among dozens of unrelated ones.
        .withRules(["color-contrast"])
        .include(".cd-shell")
        .analyze();

      for (const v of results.violations) {
        for (const node of v.nodes) {
          const summary = node.failureSummary?.split("\n").join(" ") ?? "";
          offenders.push(`[${theme} · ${tab}] ${summary} — ${node.target.join(" ")}`);
          const m = summary.match(
            /contrast of ([\d.]+) \(foreground color: (#[0-9a-f]{6}), background color: (#[0-9a-f]{6}), font size: ([^,]+), font weight: (\w+)\)/i,
          );
          if (m) {
            const key = `${m[2]} on ${m[3]} @ ${m[4]} ${m[5]}`;
            const entry = pairs.get(key) ?? { count: 0, ratio: Number(m[1]), tabs: new Set<string>(), sample: node.target.join(" ") };
            entry.count += 1;
            entry.tabs.add(tab);
            pairs.set(key, entry);
          }
        }
      }
    }

    if (offenders.length) {
      fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
      const grouped = [...pairs.entries()]
        .sort((a, b) => a[1].ratio - b[1].ratio)
        .map(([k, v]) => `${v.ratio.toFixed(2)}  ${k}  ×${v.count}  [${[...v.tabs].join(", ")}]  e.g. ${v.sample}`);
      fs.writeFileSync(
        path.join(ARTIFACT_DIR, `${theme}.txt`),
        `${offenders.length} node(s), ${pairs.size} distinct ink/ground pairs\n\n${grouped.join("\n")}\n\n---\n${offenders.join("\n")}\n`,
      );
      log(`${offenders.length} violation(s) across ${pairs.size} distinct pairs in ${theme}:\n` + grouped.join("\n"));
    }
    expect(offenders, `WCAG AA contrast violations in ${theme} theme`).toEqual([]);
  });
}

/**
 * The month-grid day drawer, which the tab sweep above cannot reach.
 *
 * A modal only exists after a click, so a sweep that navigates tabs measures
 * zero of it — and this one carries ink/ground pairs that appear nowhere else:
 * tone-carded verdict rows, status chips, a red Chandrashtamam card, and a
 * pinned footer sitting on the panel rather than on the page. It is portalled
 * into `.cd-shell`, so the same `.include()` above still applies once it is on
 * screen. Same both-themes rule, and for the same reason.
 */
for (const theme of ["light", "dark"] as const) {
  test(`no WCAG AA contrast violations in the day drawer — ${theme} theme`, async () => {
    // Three navigations plus a per-day panchangam fetch before axe can even
    // start; the 180s default is not enough on a cold dev build.
    test.slow();
    await page.goto("/dashboard/calendar");
    await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
    await dismissBlockingDialogs();
    await applyTheme(theme);

    await page.getByRole("tab", { name: /Monthly/i }).click();
    await page.waitForTimeout(2000);
    await dismissBlockingDialogs();
    // Wait for the grid EXPLICITLY before clicking into it.
    //
    // Playwright's auto-wait on `.click()` is bounded only by the test
    // timeout, and `test.slow()` makes that 540s — so a month grid that has
    // not rendered yet costs this gate nine minutes of silence and then an
    // error naming the browser teardown ("Target page, context or browser has
    // been closed") rather than the thing that was actually missing. Observed
    // 2026-09-28: the first attempt died exactly that way, and the retry ran
    // the identical test in 21.0s. A 25x gap is a cold `next dev` route
    // compile on the isolated e2e stack, not a defect — but nothing in the
    // failure said so, and a nine-minute unreadable hang is indistinguishable
    // from a real break while you are looking at it.
    //
    // 60s is generous for a warm route and still an order of magnitude below
    // the test timeout, so a genuinely missing grid now fails fast and names
    // itself. Repo rule: bound every unbounded wait, and make the failure
    // legible before theorising (CLAUDE.md, P0-5).
    const today = page.locator('button[aria-current="date"]').first();
    await today.waitFor({ state: "visible", timeout: 60_000 });
    await today.click();
    // The sheet fetches the day it was opened on; measuring the skeleton would
    // pass trivially.
    await page.getByRole("dialog").getByText("Panchangam").waitFor({ timeout: 20_000 });
    // The text node appears while .drawer__panel is still running its 220ms
    // opacity 0->1; without this, axe measures the panel mid-fade and reports
    // the fade as a palette failure. See settleAnimations().
    await settleAnimations();

    const results = await new AxeBuilder({ page })
      .withRules(["color-contrast"])
      .include(".cd-shell")
      .analyze();

    const offenders = results.violations.flatMap((v) =>
      v.nodes.map((node) => `[${theme} · day drawer] ${node.failureSummary?.split("\n").join(" ") ?? ""} — ${node.target.join(" ")}`),
    );
    if (offenders.length) log(`day drawer ${theme}:\n${offenders.join("\n")}`);
    expect(offenders, `WCAG AA contrast violations in the day drawer (${theme})`).toEqual([]);
  });
}
