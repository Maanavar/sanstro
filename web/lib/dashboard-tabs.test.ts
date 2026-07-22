import { describe, expect, it } from "vitest";

import { sanitizeRestoredTab, sanitizeUrlTab } from "./dashboard-tabs";

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
