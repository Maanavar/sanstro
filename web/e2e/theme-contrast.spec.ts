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
  for (let i = 0; i < maxAttempts; i++) {
    const dialog = page.locator('[role="dialog"][aria-modal="true"]').first();
    if (!(await dialog.isVisible().catch(() => false))) return;
    await dialog.click({ position: { x: 3, y: 3 }, force: true }).catch(() => {});
    await page.waitForTimeout(400);
  }
}

test.beforeAll(async ({ browser }) => {
  test.setTimeout(240_000);
  context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const api = context.request;

  const reg = await api.post("/api/backend/api/v1/auth/register", { data: { email: EMAIL, password: PASSWORD } });
  if (!reg.ok()) throw new Error(`register failed: ${reg.status()} ${await reg.text()}`);
  const login = await api.post("/api/backend/api/v1/auth/login", { data: { email: EMAIL, password: PASSWORD } });
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

/** Reached the same way nova-sweep does — a label the nav does not render makes
 *  the click hang until timeout rather than fail, so keep this list in step with
 *  dashboard-hero.tsx's TAB_DEFS. */
const TABS = ["Today", "Calendar", "Family & Charts", "Goals", "Life Areas"] as const;

async function goToTab(label: string) {
  await dismissBlockingDialogs(3);
  await page.getByRole("button", { name: label, exact: true }).first().click();
  await page.waitForTimeout(1500);
  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
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
