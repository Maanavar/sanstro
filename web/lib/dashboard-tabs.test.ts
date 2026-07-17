import { describe, expect, it } from "vitest";

import { sanitizeRestoredTab } from "./dashboard-tabs";

describe("sanitizeRestoredTab (DASH-11)", () => {
  it("restores tabs the hero nav actually offers", () => {
    for (const tab of ["personal", "tools", "plan", "transits", "life-areas", "family", "calendar", "journal", "explore"]) {
      expect(sanitizeRestoredTab(tab, { qaEnabled: false })).toEqual({ tab });
    }
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
