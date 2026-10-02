import { describe, expect, it } from "vitest";

import {
  DEFAULT_SETTINGS_SECTION, dashboardPath, parseDashboardPath, sanitizeRestoredTab, sanitizeUrlTab,
} from "./dashboard-tabs";

describe("sanitizeRestoredTab (DASH-11)", () => {
  it("restores tabs the hero nav actually offers", () => {
    for (const tab of ["personal", "tools", "plan", "life-areas", "family", "calendar", "journal", "explore"]) {
      expect(sanitizeRestoredTab(tab, { qaEnabled: false })).toEqual({ tab });
    }
  });

  it("no longer restores the removed transits tab (folded into Family & Charts)", () => {
    expect(sanitizeRestoredTab("transits", { qaEnabled: false })).toBeNull();
  });

  it("gates qa on the dev flag", () => {
    expect(sanitizeRestoredTab("qa", { qaEnabled: true })).toEqual({ tab: "qa" });
    expect(sanitizeRestoredTab("qa", { qaEnabled: false })).toEqual({ tab: "personal" });
  });

  it("refuses onboarding/settings — the onboarding gate owns them", () => {
    expect(sanitizeRestoredTab("settings", { qaEnabled: true })).toBeNull();
    expect(sanitizeRestoredTab("onboarding", { qaEnabled: true })).toBeNull();
  });

  it("refuses unknown and non-string values", () => {
    expect(sanitizeRestoredTab("ghost-tab", { qaEnabled: true })).toBeNull();
    expect(sanitizeRestoredTab(42, { qaEnabled: true })).toBeNull();
    expect(sanitizeRestoredTab(undefined, { qaEnabled: true })).toBeNull();
  });
});

describe("sanitizeUrlTab", () => {
  it("addresses every tab the hero nav offers", () => {
    for (const tab of ["personal", "tools", "plan", "life-areas", "family", "calendar", "journal", "explore"]) {
      expect(sanitizeUrlTab(tab, { qaEnabled: false })).toEqual({ tab });
    }
  });

  it("degrades a stale ?tab=transits deep link to the fallback", () => {
    expect(sanitizeUrlTab("transits", { qaEnabled: false })).toBeNull();
  });

  it("addresses settings, which localStorage restore deliberately refuses", () => {
    // A deep link someone typed or shared should reach Settings even though a
    // stale session must never resurrect into it.
    expect(sanitizeUrlTab("settings", { qaEnabled: false })).toEqual({ tab: "settings" });
    expect(sanitizeRestoredTab("settings", { qaEnabled: false })).toBeNull();
  });

  it("never addresses onboarding — it is derived from profile existence", () => {
    expect(sanitizeUrlTab("onboarding", { qaEnabled: true })).toBeNull();
  });

  it("gates qa on the dev flag", () => {
    expect(sanitizeUrlTab("qa", { qaEnabled: true })).toEqual({ tab: "qa" });
    // null, not a redirect to personal: an absent param and a forbidden param
    // both mean "the URL has nothing to say", so the caller's fallback chain
    // (localStorage, then the default) still gets to run.
    expect(sanitizeUrlTab("qa", { qaEnabled: false })).toBeNull();
  });

  it("degrades a typo to the fallback rather than erroring", () => {
    expect(sanitizeUrlTab("ghost-tab", { qaEnabled: true })).toBeNull();
    expect(sanitizeUrlTab("", { qaEnabled: true })).toBeNull();
    expect(sanitizeUrlTab(null, { qaEnabled: true })).toBeNull();
    expect(sanitizeUrlTab(undefined, { qaEnabled: true })).toBeNull();
  });
});

// ── Path addressing ──────────────────────────────────────────────────────────
// Nothing covered `dashboardPath`/`parseDashboardPath` before, which is how
// nine Settings sections shared one URL without anything noticing.

const NO_QA = { qaEnabled: false } as const;

describe("dashboardPath", () => {
  it("keeps Today on the bare path and names every other tab", () => {
    expect(dashboardPath("personal")).toBe("/dashboard");
    expect(dashboardPath("onboarding")).toBe("/dashboard");
    expect(dashboardPath("calendar")).toBe("/dashboard/calendar");
    // The slug follows the nav LABEL, not the internal id.
    expect(dashboardPath("plan")).toBe("/dashboard/goals");
  });

  it("appends a detail segment only under the tab that owns it", () => {
    expect(dashboardPath("tools", { tool: "numerology" })).toBe("/dashboard/tools/numerology");
    expect(dashboardPath("settings", { section: "notifications" }))
      .toBe("/dashboard/settings/notifications");
    // A tool under a tab that hosts none would advertise a destination that
    // cannot be re-entered.
    expect(dashboardPath("calendar", { tool: "numerology" })).toBe("/dashboard/calendar");
    expect(dashboardPath("tools", { section: "account" })).toBe("/dashboard/tools");
  });

  it("round-trips every settings section", () => {
    const sections = [
      "setup", "account", "context", "experience", "appearance",
      "notifications", "journal", "privacy", "danger",
    ] as const;
    for (const section of sections) {
      const path = dashboardPath("settings", { section });
      expect(path).not.toBe("/dashboard/settings");
      expect(parseDashboardPath(path, NO_QA)).toEqual({ tab: "settings", tool: null, section });
    }
  });

  it("round-trips every tool", () => {
    const tools = [
      "porutham", "chartgen", "wrapped", "retro", "rasipalan", "muhurta",
      "activityTiming", "varshaphala", "synastry", "numerology", "babynames",
    ] as const;
    for (const tool of tools) {
      const path = dashboardPath("tools", { tool });
      expect(parseDashboardPath(path, NO_QA)).toEqual({ tab: "tools", tool, section: null });
    }
  });

  it("never leaks a camelCase id into the address bar", () => {
    expect(dashboardPath("tools", { tool: "activityTiming" })).toBe("/dashboard/tools/activity-timing");
  });
});

describe("parseDashboardPath", () => {
  it("reads the bare path as naming nothing, and the alias as Today", () => {
    expect(parseDashboardPath("/dashboard", NO_QA)).toEqual({ tab: null, tool: null, section: null });
    expect(parseDashboardPath("/dashboard/today", NO_QA)).toEqual({ tab: "personal", tool: null, section: null });
  });

  it("reads bare /dashboard/settings as naming no section", () => {
    // Which the caller resolves to the default and the outbound sync then
    // writes back explicitly — a URL that names a section is the canonical one.
    expect(parseDashboardPath("/dashboard/settings", NO_QA))
      .toEqual({ tab: "settings", tool: null, section: null });
    expect(DEFAULT_SETTINGS_SECTION).toBe("setup");
  });

  it("degrades an unknown detail slug to the tab, not an error", () => {
    expect(parseDashboardPath("/dashboard/settings/ghost", NO_QA))
      .toEqual({ tab: "settings", tool: null, section: null });
    expect(parseDashboardPath("/dashboard/tools/ghost", NO_QA))
      .toEqual({ tab: "tools", tool: null, section: null });
    expect(parseDashboardPath("/dashboard/ghost", NO_QA))
      .toEqual({ tab: null, tool: null, section: null });
  });

  it("never reports a section outside settings, or a tool outside tools", () => {
    expect(parseDashboardPath("/dashboard/calendar/account", NO_QA))
      .toEqual({ tab: "calendar", tool: null, section: null });
    expect(parseDashboardPath("/dashboard/settings/numerology", NO_QA))
      .toEqual({ tab: "settings", tool: null, section: null });
  });

  it("gates qa on the dev flag", () => {
    expect(parseDashboardPath("/dashboard/qa", NO_QA)).toEqual({ tab: null, tool: null, section: null });
    expect(parseDashboardPath("/dashboard/qa", { qaEnabled: true }))
      .toEqual({ tab: "qa", tool: null, section: null });
  });

  it("ignores a path that is not the dashboard's", () => {
    expect(parseDashboardPath("/tools/numerology-calculator", NO_QA))
      .toEqual({ tab: null, tool: null, section: null });
  });
});
