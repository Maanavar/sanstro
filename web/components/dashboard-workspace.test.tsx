import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/**
 * `dashboard-workspace.tsx` is far too heavy to mount in a unit test (session
 * hydration, URL sync, a dozen lazy-loaded tabs, localStorage restore). The
 * established guard for that file (see the `userMode`-wiring test at the
 * bottom of dashboard-today-tab-nova.test.tsx) is a source pin: assert the
 * exact call/condition survives, so a refactor that silently drops it fails
 * loudly here instead of only in production.
 *
 * T5 (UX_BLINDSPOT_HANDOFF_2026-08-23.md): "Promote the two/five-minute
 * reading to the first post-calculation screen." Both guards below cover
 * that change — where a freshly-created chart is routed, and what actually
 * proves the reader got there.
 */
const source = readFileSync("components/dashboard-workspace.tsx", "utf8");

describe("dashboard-workspace — first post-calculation screen (T5)", () => {
  it("routes a freshly calculated chart to Family & Charts, not Today", () => {
    // Family & Charts opens on "Your chart in two/five minutes" — the
    // plain-language reading — above every score and table on the page
    // (dashboard-family-charts-hybrid.tsx §3, MEMBER OVERVIEW). Landing a
    // first-time reader on Today instead skips straight past the one
    // screen written to be read rather than scanned.
    const fn = source.slice(source.indexOf("async function handleCreateProfile"));
    const body = fn.slice(0, fn.indexOf("\n  async function handleCreateVault"));

    expect(body).toMatch(/setActiveTab\(response\.data\.chartId \? "family" : "personal"\)/);
  });

  it("does not mark 'read your reading' done just because a profile exists", () => {
    // Step 3's badge used to share step 1's condition
    // (`personal.birthProfileId`), which marked "read your two-minute chart
    // result" done the instant step 1 finished — before the reader had read
    // anything. It now tracks a dedicated flag set only once the reader has
    // actually been on Family & Charts with a calculated chart.
    const step3Marker = source.indexOf('{t("onboarding_step3"');
    const step3Block = source.slice(Math.max(0, step3Marker - 400), step3Marker);

    expect(step3Block).toMatch(/hasVisitedReading/);
    expect(step3Block).not.toMatch(/personal\.birthProfileId/);
  });

  it("sets the flag only once the reader is on Family & Charts with a chart", () => {
    const effect = source.slice(source.indexOf("Fires once, the first time the reader"));
    const body = effect.slice(0, effect.indexOf("}, [activeTab, personal.chartId, hasVisitedReading]);"));

    expect(body).toMatch(/activeTab === "family" && personal\.chartId && !hasVisitedReading/);
  });
});
