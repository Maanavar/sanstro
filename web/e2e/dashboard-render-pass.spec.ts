/**
 * The signed-in render pass three items owe, done once.
 *
 *   F9   the three secondary-dasha panels, "not visually diffed"
 *   F10  the migrated form fields, whose a11y is proven and whose LOOK is not
 *   F6   the Fraunces merge's dashboard half — "verified statically … never
 *        rendered signed-in"
 *
 * WHY THESE WERE NEVER SEEN, WHICH THE PLAN GETS WRONG. F9 says the panels sit
 * behind `AdvancedAstrologyGate`, "which the sweep's BALANCED-mode account does
 * not open". That gate is a **pass-through** for BALANCED and TRADITIONAL —
 * advanced-astrology-gate.tsx:26 returns `<>{children}</>`, and only BEGINNER
 * wraps them in a collapsed section. The panels render for this account.
 *
 * What actually hides them is one level down: `SecondaryDashaPanel` wraps itself
 * in `<CollapsibleSection defaultOpen={false}>`, and collapsible-section.tsx:61
 * renders `{open && …}` — a closed section puts **no children in the DOM at
 * all**. So every sweep that screenshotted this tab captured three closed
 * triggers and nothing else, and no assertion could have noticed: there is no
 * skeleton, no error, no empty state, just an absent subtree.
 *
 * That distinction is why this spec clicks. A pass that only navigated here
 * would reproduce the same blind spot and report success.
 *
 * THE FRAUNCES CHECK IS AN ASSERTION, NOT A SCREENSHOT. `.cd-shell` used to
 * re-point `--font-display` at a second next/font instance and now inherits the
 * one on <html>. A screenshot cannot tell a correctly-inherited Fraunces from a
 * fallback serif; the computed value can.
 */
import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACT_DIR = path.join(__dirname, ".artifacts", "dashboard-render-pass");

const RUN_ID = Date.now();
const EMAIL = `render-pass-${RUN_ID}@e2e.test`;
const PASSWORD = "RenderPass!Test123";
const CSRF = { "X-Vinaadi-CSRF": "1" };

test.describe.configure({ mode: "serial" });
test.setTimeout(120_000);

let context: BrowserContext;
let page: Page;
const consoleErrors: string[] = [];

function log(msg: string) {
  // eslint-disable-next-line no-console
  console.log(`[render-pass t=${((Date.now() - RUN_ID) / 1000).toFixed(1)}s] ${msg}`);
}

async function dismissBlockingDialogs(maxAttempts = 20) {
  // Backdrop click, not a labelled button: on life-mode-picker.tsx "Skip for
  // now" fires a real PATCH mutation that can hang under chart-calc load.
  for (let i = 0; i < maxAttempts; i++) {
    const dialog = page.locator('[role="dialog"][aria-modal="true"]').first();
    if (!(await dialog.isVisible().catch(() => false))) return;
    await dialog.click({ position: { x: 3, y: 3 }, force: true }).catch(() => {});
    await page.waitForTimeout(400);
  }
}

async function shot(name: string) {
  await page.screenshot({ path: path.join(ARTIFACT_DIR, `${name}.png`), fullPage: true });
}

test.beforeAll(async ({ browser }) => {
  // File-scope test.setTimeout() does not reach hooks — they keep the config
  // default of 30s, which is well under the chart-calc + first-compile chain
  // this bootstrap waits on.
  test.setTimeout(240_000);
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const api = context.request;

  const reg = await api.post("/api/backend/api/v1/auth/register", { data: { email: EMAIL, password: PASSWORD } });
  if (!reg.ok()) throw new Error(`register failed: ${reg.status()} ${await reg.text()}`);
  const login = await api.post("/api/backend/api/v1/auth/login", { data: { email: EMAIL, password: PASSWORD } });
  if (!login.ok()) throw new Error(`login failed: ${login.status()} ${await login.text()}`);

  // Fictitious birth data, per the repo's synthetic-fixtures rule.
  const bp = await api.post("/api/backend/api/v1/birth-profiles", {
    data: {
      displayName: "E2E Render Pass Owner",
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

  /**
   * A family vault with NO extra members — deliberately the minimum, and it is
   * an experiment as much as a fixture.
   *
   * The first run of this spec had a birth profile and no vault, and every
   * chart section of Family & Charts rendered nothing: no D1/D9, no bhava
   * table, no planet orbs, no "Full technical reading". The reading sections
   * hang off `activeMeta`, which is `memberMeta.find(m => m.isSelf)` — family
   * *vault* members. With no vault, `memberMeta` is empty, so `readingChart` is
   * null while `readingChartId` still falls back to the owner's chart. The
   * secondary-dasha panels are gated on the id and their parent section on the
   * object, so they can never appear.
   *
   * nova-sweep creates a vault AND a spouse, so this state is not covered
   * anywhere. Creating the vault alone pins which of the two is required.
   */
  const vault = await api.post("/api/backend/api/v1/family-vaults", {
    data: { name: "E2E Render Pass Family" },
    headers: CSRF,
  });
  if (!vault.ok()) throw new Error(`vault failed: ${vault.status()} ${await vault.text()}`);
  const vaultId = (await vault.json()).data.familyVaultId as string;

  // An empty vault was tried first and is NOT enough: `memberMeta` maps
  // `familyAggregate.members`, which stays empty until the vault has a member,
  // so the owner's own row (`familyMemberId === birthProfileId`) never appears
  // and `readingChart` stays null. One member is the boundary.
  const spouse = await api.post(`/api/backend/api/v1/family-vaults/${vaultId}/members`, {
    data: {
      displayName: "E2E Render Pass Spouse",
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
  log("account bootstrapped (birth profile + vault + one member)");

  page = await context.newPage();
  page.on("console", (m) => {
    if (m.type() === "error" && !/favicon|chrome-extension/i.test(m.text())) consoleErrors.push(m.text());
  });

  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  await dismissBlockingDialogs();
  const enToggle = page.getByRole("button", { name: "Switch to English" });
  if (await enToggle.isVisible({ timeout: 5000 }).catch(() => false)) {
    await enToggle.click();
    await page.waitForTimeout(500);
  }
  await dismissBlockingDialogs();
  await page
    .waitForFunction(() => !document.body.innerText.includes("Refreshing..."), { timeout: 45_000 })
    .catch(() => {});
  await page.waitForTimeout(1000);
  log("dashboard settled");
});

test.afterAll(async () => {
  await context?.close();
});

// ────────────────────────────────────────────── F6 · Fraunces, signed in

test("dashboard resolves the one Fraunces instance, not a second or a fallback", async () => {
  const info = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const shell = document.querySelector(".cd-shell");
    const shellStyle = shell ? getComputedStyle(shell) : null;
    const heading = document.querySelector("h1") ?? document.querySelector("h2");
    return {
      rootDisplay: root.getPropertyValue("--font-display").trim(),
      rootNova: root.getPropertyValue("--font-nova-display").trim(),
      shellDisplay: shellStyle?.getPropertyValue("--font-display").trim() ?? "(no .cd-shell)",
      shellNova: shellStyle?.getPropertyValue("--font-nova-display").trim() ?? "",
      headingTag: heading?.tagName ?? "(none)",
      headingFamily: heading ? getComputedStyle(heading).fontFamily : "",
      headingWeight: heading ? getComputedStyle(heading).fontWeight : "",
    };
  });
  log(`fraunces: ${JSON.stringify(info)}`);
  await shot("dashboard-today");

  expect(info.rootDisplay, "--font-display on <html>").toMatch(/Fraunces/i);
  // The point of the merge: inside .cd-shell the variable must RESOLVE to the
  // same instance, by inheritance, rather than being re-pointed at a second one.
  expect(info.shellDisplay, "--font-display inside .cd-shell").toBe(info.rootDisplay);
  expect(info.rootNova, "--font-nova-display must be gone, not aliased").toBe("");
  expect(info.shellNova, "--font-nova-display inside .cd-shell").toBe("");
});

// ────────────────────────────── F9 · the three secondary-dasha panels, OPENED

const SECONDARY_DASHAS = [
  { key: "yogini", title: /Yogini Dasha/i },
  { key: "ashtottari", title: /Ashtottari Dasha/i },
  { key: "kalachakra", title: /Kalachakra Dasha/i },
];

test("Family & Charts: the three secondary-dasha panels render their bodies", async () => {
  await dismissBlockingDialogs(3);
  await page.getByRole("button", { name: "Family & Charts", exact: true }).first().click();
  await page.waitForTimeout(1500);
  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});

  /**
   * Waiting for skeletons to clear is NOT enough here, and the first run of this
   * spec proved it by reporting all three panels "not present".
   *
   * The panels live inside `<HySection "Full technical reading">`, which is
   * gated on `readingChart` — the loaded chart object, not the chart id. Until
   * that resolves the section renders nothing: no skeleton, no placeholder, no
   * heading. So `.skel === 0` was satisfied by a page that had simply not
   * fetched the chart yet, and the run looked like a finding about missing
   * panels rather than a race. Wait for the section itself.
   */
  await expect(
    page.getByRole("heading", { name: /Full technical reading/i }),
    "the Full technical reading section never rendered — readingChart did not load",
  ).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(1000);
  await dismissBlockingDialogs();
  await shot("family-charts-collapsed");

  const notFound: string[] = [];
  for (const d of SECONDARY_DASHAS) {
    const trigger = page.locator("button.collapsible__trigger", { hasText: d.title }).first();
    if (!(await trigger.isVisible().catch(() => false))) {
      notFound.push(d.key);
      continue;
    }
    // A closed section renders no children, so "is it open" is answerable only
    // via the trigger's own aria-expanded.
    if ((await trigger.getAttribute("aria-expanded")) !== "true") {
      // The focus picker (life-mode-picker.tsx) is gated behind data loading,
      // so it can mount *after* the tab has settled and then swallow every
      // click as an aria-modal overlay. Re-check immediately before each one.
      await dismissBlockingDialogs(8);
      await trigger.scrollIntoViewIfNeeded();
      await trigger.click();
      await page.waitForTimeout(1200);
    }
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    expect(await trigger.getAttribute("aria-expanded"), `${d.key} did not open`).toBe("true");
    log(`${d.key}: opened`);
  }

  expect(notFound, "secondary dasha panels not present on Family & Charts").toEqual([]);
  await page.waitForTimeout(1500);
  await shot("family-charts-dashas-open");

  // The body is what has never been rendered in a check. Assert it is really
  // there and carries content, not just that a container appeared.
  for (const d of SECONDARY_DASHAS) {
    // collapsible-section.tsx renders the body as the trigger's NEXT SIBLING
    // inside a plain wrapper div, so anchor off the trigger rather than
    // filtering ancestors — a `div` filtered by `has:` matches every ancestor
    // up the tree, and .first() then picks an outer one whose first
    // .collapsible__body belongs to a different panel entirely.
    const trigger = page.locator("button.collapsible__trigger", { hasText: d.title }).first();
    const body = trigger.locator("xpath=following-sibling::div[contains(@class,'collapsible__body')]").first();
    expect(await body.count(), `${d.key} body`).toBeGreaterThan(0);

    // Per-panel screenshot, because the full-page one is ~12,600px tall and
    // these three sit at the bottom of it — at that scale the thing this pass
    // exists to look at is a few unreadable pixels.
    await trigger
      .locator("xpath=..")
      .screenshot({ path: path.join(ARTIFACT_DIR, `panel-${d.key}.png`) })
      .catch(() => {});

    const text = (await body.innerText().catch(() => "")).replace(/\s+/g, " ").trim();
    log(`${d.key} body text: ${text.slice(0, 160)}`);
    expect(text.length, `${d.key} body is empty`).toBeGreaterThan(20);
    expect(text, `${d.key} shows an error state`).not.toMatch(/Could not load/i);
  }
});

// ─────────────────────────────────── F10 · the migrated fields, as rendered

const FIELD_SURFACES: Array<{ name: string; go: () => Promise<void> }> = [
  {
    name: "goals-whatif",
    go: async () => {
      await page.getByRole("button", { name: "Goals", exact: true }).first().click();
      await page.waitForTimeout(1200);
      const sub = page.getByRole("tab", { name: /What-If/i }).first();
      if (await sub.isVisible().catch(() => false)) await sub.click();
      await page.waitForTimeout(1200);
    },
  },
  {
    name: "goals-decisions",
    go: async () => {
      const sub = page.getByRole("tab", { name: /Decisions/i }).first();
      if (await sub.isVisible().catch(() => false)) await sub.click();
      await page.waitForTimeout(1200);
    },
  },
  {
    name: "calendar-muhurta",
    go: async () => {
      await page.getByRole("button", { name: "Calendar", exact: true }).first().click();
      await page.waitForTimeout(1200);
      const sub = page.getByRole("tab", { name: /Best Dates & Muhurta/i }).first();
      if (await sub.isVisible().catch(() => false)) await sub.click();
      await page.waitForTimeout(1500);
    },
  },
  {
    name: "journal",
    go: async () => {
      await page.goto("/dashboard/journal");
      await page.waitForTimeout(1500);
    },
  },
  {
    name: "settings",
    go: async () => {
      await page.goto("/dashboard");
      await page.waitForTimeout(1000);
      await dismissBlockingDialogs(3);
      await page.getByRole("button", { name: "Settings", exact: true }).first().click();
      await page.waitForTimeout(1500);
    },
  },
];

for (const surface of FIELD_SURFACES) {
  test(`migrated form fields render: ${surface.name}`, async () => {
    await dismissBlockingDialogs(3);
    await surface.go();
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
    for (let i = 0; i < 20; i++) {
      if ((await page.locator(".skel").count().catch(() => 0)) === 0) break;
      await page.waitForTimeout(400);
    }
    await shot(`fields-${surface.name}`);

    // Every control on the surface must still compute a real box. A field that
    // lost its styling in the kit migration collapses or goes transparent, and
    // both read as "fine" in a DOM assertion.
    const controls = await page.evaluate(() => {
      const out: { tag: string; type: string; name: string; h: number; w: number; bg: string; border: string; font: string }[] = [];
      for (const el of Array.from(document.querySelectorAll("input, select, textarea"))) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue; // genuinely hidden
        const type = (el as HTMLInputElement).type ?? "";
        // A checkbox or radio is legitimately ~13px square, so it cannot be
        // judged by the same box rule as a text control. The first run of this
        // spec flagged one as "collapsed" — the assertion was wrong, not the
        // markup. Their accessible name is e2e/field-a11y-probe.spec.ts's job.
        if (type === "checkbox" || type === "radio") continue;
        const cs = getComputedStyle(el);
        out.push({
          tag: el.tagName.toLowerCase(),
          type,
          name: (el as HTMLInputElement).name || el.getAttribute("aria-label") || el.id || "(unnamed)",
          h: Math.round(r.height),
          w: Math.round(r.width),
          bg: cs.backgroundColor,
          border: cs.borderTopWidth + " " + cs.borderTopColor,
          font: cs.fontSize,
        });
      }
      return out;
    });
    log(`${surface.name}: ${controls.length} visible controls`);
    for (const c of controls) log(`   ${JSON.stringify(c)}`);

    const collapsed = controls.filter((c) => c.h < 20);
    expect(collapsed, `controls with a collapsed box on ${surface.name}`).toEqual([]);
  });
}

test("no console errors across the render pass", () => {
  if (consoleErrors.length) {
    // eslint-disable-next-line no-console
    console.log("[render-pass] console errors:", JSON.stringify(consoleErrors, null, 2));
  }
  expect(consoleErrors).toHaveLength(0);
});
