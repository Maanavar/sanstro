/**
 * Life focus, Phase 2 — the client half of D2 ("focus changes emphasis, never
 * the astrology"). The server half is tests/test_life_focus_phase2.py.
 *
 * What this can see: the helpers every Today surface reorders through. What it
 * cannot see: a component that bypasses them and edits a value inline. The
 * browser pass in the plan's Phase 2 status block covers the rendered page.
 */
import { describe, expect, it } from "vitest";

import { appliedFocus, focusQuickLinkId, NO_FOCUS, pinFirst } from "./life-focus";
import type { LifeModeStatus } from "./types";

function status(overrides: Partial<LifeModeStatus>): LifeModeStatus {
  return {
    mode: "BALANCED",
    lifeModeSetAt: null,
    showLifeModePicker: false,
    focusNudgeDue: false,
    focusArea: null,
    focusActivities: [],
    ...overrides,
  } as LifeModeStatus;
}

describe("pinFirst", () => {
  const areas = [
    { area: "MONEY", score: 41 },
    { area: "HEALTH", score: 63 },
    { area: "CAREER", score: 58 },
    { area: "EDUCATION", score: 72 },
  ];

  it("moves the pinned item first and keeps the rest in order", () => {
    expect(pinFirst(areas, (a) => a.area === "CAREER").map((a) => a.area)).toEqual([
      "CAREER", "MONEY", "HEALTH", "EDUCATION",
    ]);
  });

  it("returns the same objects, so no value can change (D2)", () => {
    const pinned = pinFirst(areas, (a) => a.area === "EDUCATION");
    expect(pinned).toHaveLength(areas.length);
    for (const item of areas) expect(pinned).toContain(item);
    expect(pinned.find((a) => a.area === "EDUCATION")).toBe(areas[3]);
  });

  it("is the identity when nothing matches (BALANCED)", () => {
    expect(pinFirst(areas, () => false)).toEqual(areas);
  });

  it("keeps several pinned items in their original relative order", () => {
    const board = ["job_change", "money", "property", "business_start"];
    const wealth = ["money", "property", "business_start"];
    expect(pinFirst(board, (a) => wealth.includes(a))).toEqual(["money", "property", "business_start", "job_change"]);
  });
});

describe("appliedFocus", () => {
  const career = status({ mode: "CAREER", focusArea: "CAREER", focusActivities: ["job_change", "business_start"] });

  it("carries the server's area and activities on the reader's own chart", () => {
    expect(appliedFocus(career, true)).toEqual({
      area: "CAREER", activities: ["job_change", "business_start"], remediesFirst: false,
    });
  });

  it("is off on a family member's chart (D4, ruling Q2)", () => {
    expect(appliedFocus(career, false)).toBe(NO_FOCUS);
    expect(appliedFocus(status({ mode: "REMEDIES" }), false).remediesFirst).toBe(false);
  });

  it("is off before the status has loaded", () => {
    expect(appliedFocus(null, true)).toBe(NO_FOCUS);
  });

  it("lifts the remedy row only for REMEDIES", () => {
    expect(appliedFocus(status({ mode: "REMEDIES" }), true).remediesFirst).toBe(true);
    expect(appliedFocus(career, true).remediesFirst).toBe(false);
  });
});

describe("focusQuickLinkId", () => {
  it("sends relationships to porutham and other areas to best days", () => {
    expect(focusQuickLinkId("RELATIONSHIPS")).toBe("compatibility");
    expect(focusQuickLinkId("CAREER")).toBe("activityTiming");
    expect(focusQuickLinkId(null)).toBeNull();
  });
});
