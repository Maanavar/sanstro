/**
 * DXA-34: the dashboard experience audit as a Playwright test.
 * docs/DASHBOARD_EXPERIENCE_AUDIT_2026-09-17.md §12 defines the gates; the
 * probes live in web/scripts/ux-audit-core.mjs, shared with the CLI.
 *
 * Opt-in. Skipped unless VISUAL_AUDIT=1, so `playwright test` in CI (which
 * points BASE_URL at a preview deploy) is unaffected. A run registers a
 * throwaway `ux-audit-*@e2e.test` account, so it refuses any backend whose
 * health route does not report environment "e2e".
 *
 *   $env:VISUAL_AUDIT = "1"
 *   $env:VISUAL_AUDIT_PHASES = "load,tabs,reduced"   # optional; default all
 *   npx playwright test e2e/dashboard-experience.spec.ts --project=chromium
 *
 * Ratchet. Most gates fail today; those are open work, reported as annotations
 * and in the attached gates.txt, not as test failures. A gate listed in
 * MUST_PASS passes today and fails the test if it regresses. When an item
 * lands (§15), add its gates here.
 */
import path from "node:path";

import { expect, test } from "@playwright/test";

import { ALL_PHASES, assertE2eBackend, formatGates, gateKey, runAudit, type Gate } from "../scripts/ux-audit-core.mjs";

/** Gate key → the phase that produces it. */
const MUST_PASS: Record<string, string> = {
  "DXA-01 skeleton bar/card contrast, dark (1.05–1.6)": "load",
  "DXA-01 skeleton bar/card contrast, light (1.05–1.6)": "light",
  "DXA-02 bare /dashboard shows one destination": "load",
  "DXA-03 no empty-state copy while loading (Today)": "load",
  "DXA-04 no onboarding banner for a set-up account": "load",
  "DXA-05 CLS < 0.1 (Today cold load)": "load",
  "DXA-05 no top-bar / sub-bar shifts": "load",
  "DXA-05 CLS < 0.1 (Understand cold load)": "load",
  "DXA-05 pending hero within 8px of loaded": "load",
  "DXA-07 hero keeps ≥ 90% height through a date change": "today",
  "DXA-07 Today pane keeps ≥ 90% height through a date change": "today",
  "DXA-07 the selected day replaces the held one": "today",
  "DXA-08 no raw enums / 'None' / upper-case rasi names": "tabs",
  "DXA-11 reduced motion: nav indicator does not move": "reduced",
  "DXA-11 reduced motion: pane appears without a fade": "reduced",
  "DXA-27 phone: no horizontal overflow": "phone",
  "DXA-41 overlay ask-vinaadi: closes on Escape and on a page click": "overlays",
  "DXA-41 overlay day-drawer: closes on Escape and on a page click": "overlays",
};

const ENABLED = process.env.VISUAL_AUDIT === "1";
const PHASES = (process.env.VISUAL_AUDIT_PHASES ?? ALL_PHASES.join(","))
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

test.describe("dashboard experience audit (DXA gates)", () => {
  test.skip(!ENABLED, "opt-in: set VISUAL_AUDIT=1 against the isolated e2e stack");
  // One run is 7-10 minutes on next dev; a retry would only repeat the findings.
  test.describe.configure({ retries: 0 });

  test("fixed gates stay fixed", async ({ browser, baseURL }, testInfo) => {
    test.setTimeout(30 * 60_000);
    const unknown = PHASES.filter((p) => !ALL_PHASES.includes(p));
    expect(unknown, `unknown VISUAL_AUDIT_PHASES; valid: ${ALL_PHASES.join(",")}`).toEqual([]);

    const base = (baseURL ?? "http://localhost:3100").replace(/\/$/, "");
    await assertE2eBackend(base);

    const out = testInfo.outputPath("ux-audit");
    let gates: Gate[] = [];
    try {
      const metrics = await runAudit({
        browser,
        base,
        out,
        phases: PHASES,
        prod: process.env.VISUAL_AUDIT_PROD === "1",
        log: (...a: unknown[]) => console.log("[ux-audit]", ...a),
      });
      gates = metrics.gates;
    } finally {
      await testInfo.attach("metrics.json", { path: path.join(out, "metrics.json"), contentType: "application/json" }).catch(() => {});
    }

    const report = formatGates(gates);
    await testInfo.attach("gates.txt", { body: report, contentType: "text/plain" });
    for (const g of gates.filter((x) => x.result === "FAIL")) {
      testInfo.annotations.push({ type: "open gate", description: `${gateKey(g)}: ${String(g.value).slice(0, 120)}` });
    }

    const byKey = new Map(gates.map((g) => [gateKey(g), g]));
    const regressions = Object.entries(MUST_PASS)
      .filter(([, phase]) => PHASES.includes(phase))
      .map(([key]) => ({ key, result: byKey.get(key)?.result ?? "MISSING" }))
      .filter((r) => r.result !== "PASS");
    expect(regressions, `ratcheted gates regressed\n\n${report}`).toEqual([]);
  });
});
