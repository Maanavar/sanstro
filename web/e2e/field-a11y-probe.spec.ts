/**
 * F10 verification: does every form control on the migrated panels have an
 * accessible name?
 *
 * A source-level guard (lib/field-style-guard.test.ts) can prove the copies are
 * gone. It cannot prove the replacement works, because the thing being claimed
 * is a property of the RENDERED accessibility tree: `<Field>` names its control
 * by wrapping it in a `<label>`, and that association is resolved by the
 * browser, not by TypeScript. The same reasoning as the F4 rendered-page A/B —
 * every other check in this item is static.
 *
 * Reports rather than merely asserting, so an unnamed control is identified by
 * what it is instead of just failing a count.
 */
import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ARTIFACT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), ".artifacts", "field-a11y");

const RUN_ID = Date.now();
const EMAIL = `field-a11y-${RUN_ID}@e2e.test`;
const PASSWORD = "FieldA11y!Test123";
const CSRF_HEADERS = { "X-Vinaadi-CSRF": "1" };

test.describe.configure({ mode: "serial" });

let context: BrowserContext;
let page: Page;

test.beforeAll(async ({ browser }) => {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  context = await browser.newContext();
  const api = context.request;

  const reg = await api.post("/api/backend/api/v1/auth/register", {
    data: { email: EMAIL, password: PASSWORD, consentGiven: true },
  });
  if (!reg.ok()) throw new Error(`register failed: ${reg.status()} ${await reg.text()}`);
  const login = await api.post("/api/backend/api/v1/auth/login", {
    data: { email: EMAIL, password: PASSWORD },
  });
  if (!login.ok()) throw new Error(`login failed: ${login.status()} ${await login.text()}`);

  const bp = await api.post("/api/backend/api/v1/birth-profiles", {
    data: {
      displayName: "E2E Field Owner",
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
    headers: CSRF_HEADERS,
  });
  if (!bp.ok()) throw new Error(`birth profile failed: ${bp.status()} ${await bp.text()}`);

  page = await context.newPage();
  await page.addInitScript(() => {
    window.localStorage.setItem("vinaadi.ui", "nova");
  });
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(1500);
});

test.afterAll(async () => {
  await context.close();
});

/**
 * Backdrop-click the first-run modals shut.
 *
 * Deliberately not clicking "Skip for now": on the focus picker that button
 * fires a real PATCH /settings/life-mode, which can sit saving; the backdrop
 * path is pure client state (same reasoning as nova-sweep.spec.ts).
 *
 * `settle` waits for a dialog that has not mounted YET rather than returning
 * immediately when none is visible — the focus picker re-appears a beat after a
 * full navigation, so a single early check passes and the next click is then
 * intercepted by a modal that appeared in between.
 */
async function dismissDialogs(attempts = 12, settleMs = 0) {
  if (settleMs) await page.waitForTimeout(settleMs);
  for (let i = 0; i < attempts; i++) {
    const dialog = page.locator('[role="dialog"][aria-modal="true"]').first();
    if (!(await dialog.isVisible().catch(() => false))) {
      await page.waitForTimeout(300);
      if (!(await dialog.isVisible().catch(() => false))) return;
    }
    await dialog.click({ position: { x: 3, y: 3 }, force: true }).catch(() => {});
    await page.waitForTimeout(400);
  }
}

/**
 * The accessible name as the browser computes it, for every control on screen.
 * Uses aria-label / wrapping-or-associated <label> / placeholder-as-fallback in
 * the same precedence the AOM uses, rather than trusting any one attribute.
 */
async function controlNames(): Promise<Array<{ tag: string; type: string; name: string }>> {
  return page.evaluate(() => {
    const out: Array<{ tag: string; type: string; name: string }> = [];
    const els = document.querySelectorAll<HTMLElement>("input, select, textarea");
    for (const el of Array.from(els)) {
      if (el.offsetParent === null && el.getClientRects().length === 0) continue;
      const type = el.getAttribute("type") ?? "";
      if (type === "hidden") continue;

      let name = el.getAttribute("aria-label")?.trim() ?? "";
      if (!name) {
        const labelledBy = el.getAttribute("aria-labelledby");
        if (labelledBy) {
          name = labelledBy
            .split(/\s+/)
            .map((id) => document.getElementById(id)?.textContent?.trim() ?? "")
            .join(" ")
            .trim();
        }
      }
      if (!name && el.id) {
        const explicit = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        // Only the label's own caption, not the value typed into the control.
        if (explicit) {
          const clone = explicit.cloneNode(true) as HTMLElement;
          clone.querySelectorAll("input, select, textarea").forEach((c) => c.remove());
          name = clone.textContent?.trim() ?? "";
        }
      }
      if (!name) {
        const wrapping = el.closest("label");
        if (wrapping) {
          const clone = wrapping.cloneNode(true) as HTMLElement;
          clone.querySelectorAll("input, select, textarea").forEach((c) => c.remove());
          name = clone.textContent?.trim() ?? "";
        }
      }
      out.push({ tag: el.tagName.toLowerCase(), type, name: name.replace(/\s+/g, " ") });
    }
    return out;
  });
}

/**
 * Collected rather than asserted per surface, then asserted once at the end.
 *
 * Failing eagerly on the first surface stops the walk, so a run reports one
 * unnamed control and says nothing about the other four screens — which is
 * exactly the wrong shape for a before/after measurement.
 */
const allUnnamed: Array<{ surface: string; tag: string; type: string }> = [];

async function report(surface: string) {
  await page
    .screenshot({
      path: path.join(ARTIFACT_DIR, `${surface.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`),
      fullPage: true,
    })
    .catch(() => {});
  const controls = await controlNames();
  const unnamed = controls.filter((c) => c.name.length === 0);
  for (const c of unnamed) allUnnamed.push({ surface, tag: c.tag, type: c.type });
  // eslint-disable-next-line no-console
  console.log(
    `\n[field-a11y] ${surface}: ${controls.length} control(s), ${unnamed.length} unnamed\n` +
      controls.map((c) => `    ${c.name ? "OK  " : "MISS"} <${c.tag}${c.type ? ` type=${c.type}` : ""}> ${c.name || "(no accessible name)"}`).join("\n"),
  );
}

/**
 * Click by accessible name, reporting what IS on screen when it is missing.
 *
 * `role` matters and getting it wrong is silent. The sub-tab strip is the shared
 * `<Segmented>`, whose buttons carry `role="tab"` — and an explicit role
 * REPLACES the implicit button role rather than adding to it, so
 * getByRole("button", { name: "What-If" }) matches nothing. nova-sweep.spec.ts
 * documents exactly this trap for the "More" dropdown's `role="menuitem"`, then
 * falls into it for sub-tabs, where its `isVisible()` guard turns the miss into
 * a skip instead of a failure.
 */
async function clickOrExplain(
  pattern: RegExp | string,
  what: string,
  role: "button" | "tab" = "button",
): Promise<boolean> {
  const btn = page.getByRole(role, { name: pattern as never }).first();
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(1400);
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    return true;
  }
  const names = await page
    .getByRole(role)
    .evaluateAll((els) => els.map((e) => (e.textContent ?? "").replace(/\s+/g, " ").trim()).filter(Boolean));
  // eslint-disable-next-line no-console
  console.log(`\n[field-a11y] could NOT reach "${what}". ${role}s on screen:\n    ${names.join("\n    ")}`);
  return false;
}

test.setTimeout(240_000);

test("every control on the migrated panels has an accessible name", async () => {
  const surfaces: string[] = [];

  await dismissDialogs();
  await clickOrExplain("Goals", "Goals tab");
  await dismissDialogs();

  for (const [pattern, label] of [
    [/What-If/i, "Goals / What-If"],
    [/Decisions/i, "Goals / Decisions"],
  ] as Array<[RegExp, string]>) {
    if (await clickOrExplain(pattern, label, "tab")) {
      await report(label);
      surfaces.push(label);
    }
  }

  // "Best Dates & Muhurta" moved from Plan to Calendar in the 2026-07-22 IA
  // refactor — dashboard-plan-tab-nova.tsx:99 says so. nova-sweep still lists it
  // under Goals, where it cannot be found.
  await dismissDialogs();
  if (await clickOrExplain("Calendar", "Calendar tab")) {
    await dismissDialogs();
    if (await clickOrExplain(/Best Dates & Muhurta|Muhurta/i, "Calendar / Best Dates & Muhurta", "tab")) {
      await report("Calendar / Best Dates & Muhurta");
      surfaces.push("Calendar / Best Dates & Muhurta");
    }
  }

  await page.goto("/dashboard/journal");
  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
  await dismissDialogs();
  await page.waitForTimeout(1200);
  await report("Journal");
  surfaces.push("Journal");

  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
  await dismissDialogs(15, 2500);
  if (await clickOrExplain("Settings", "Settings tab")) {
    await report("Settings");
    surfaces.push("Settings");
  }

  // eslint-disable-next-line no-console
  console.log(
    `\n[field-a11y] surfaces probed: ${surfaces.join(", ")}` +
      `\n[field-a11y] TOTAL unnamed controls: ${allUnnamed.length}` +
      (allUnnamed.length
        ? `\n${allUnnamed.map((u) => `    ${u.surface}: <${u.tag}${u.type ? ` type=${u.type}` : ""}>`).join("\n")}`
        : ""),
  );

  // A run that reached nothing would otherwise "pass" with zero findings.
  expect(surfaces.length, "no surface was reachable — the probe proved nothing").toBeGreaterThan(3);
  expect(allUnnamed, "form controls with no accessible name").toEqual([]);
});
