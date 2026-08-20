import { describe, expect, it } from "vitest";

import { limbNow } from "./panchangam-limb";

// Real values for 2026-08-19 at Chennai (sunrise 06:00:32). Swathi holds the day
// for 15 minutes — 3.2% of it — and Visakam holds the remaining 96.8%. This is
// the day that exposed the bug: every surface except the Calendar tab printed
// "Swathi" for all 24 hours.
const NAKSHATRA = {
  name: "SWATHI",
  pada: 4,
  endsAt: "06:47",
  endsAtIso: "2026-08-19T06:47:04+05:30",
  nextName: "VISAKAM",
  spans: [
    { number: 15, name: "SWATHI", startsAt: "06:00", endsAt: "06:47", startsAtIso: "2026-08-19T06:00:32+05:30", endsAtIso: "2026-08-19T06:47:04+05:30", fraction: 0.032 },
    { number: 16, name: "VISAKAM", startsAt: "06:47", endsAt: "06:00", startsAtIso: "2026-08-19T06:47:04+05:30", endsAtIso: "2026-08-20T06:00:49+05:30", fraction: 0.968 },
  ],
};

// Karana is the case a single `nextName` could never express: three spans, so
// the third was unrepresentable on the old wire. Vishti runs 19:20 → 06:00.
const KARANA = {
  name: "GARAJA",
  endsAt: "06:31",
  endsAtIso: "2026-08-19T06:31:14+05:30",
  nextName: "VANIJA",
  spans: [
    { number: 53, name: "GARAJA", startsAt: "06:00", endsAt: "06:31", startsAtIso: "2026-08-19T06:00:32+05:30", endsAtIso: "2026-08-19T06:31:14+05:30", fraction: 0.021 },
    { number: 54, name: "VANIJA", startsAt: "06:31", endsAt: "19:20", startsAtIso: "2026-08-19T06:31:14+05:30", endsAtIso: "2026-08-19T19:20:02+05:30", fraction: 0.534 },
    { number: 55, name: "VISHTI", startsAt: "19:20", endsAt: "06:00", startsAtIso: "2026-08-19T19:20:02+05:30", endsAtIso: "2026-08-20T06:00:49+05:30", fraction: 0.445 },
  ],
};

describe("limbNow", () => {
  it("keeps the sunrise star before the boundary", () => {
    const result = limbNow(NAKSHATRA, { isToday: true, nowIso: "2026-08-19T06:30:00+05:30" });
    expect(result.activeName).toBe("SWATHI");
    expect(result.rolledOver).toBe(false);
    expect(result.upcomingName).toBe("VISAKAM");
  });

  it("promotes to the star actually running after the boundary", () => {
    const result = limbNow(NAKSHATRA, { isToday: true, nowIso: "2026-08-19T14:00:00+05:30" });
    expect(result.activeName).toBe("VISAKAM");
    expect(result.rolledOver).toBe(true);
    // The almanac still calls this a Swathi day, and the caller needs to be able
    // to say so — promoting must not erase the உதய name.
    expect(result.sunriseName).toBe("SWATHI");
  });

  it("never promotes on a date that is not today", () => {
    const result = limbNow(NAKSHATRA, { isToday: false, nowIso: "2026-08-19T14:00:00+05:30" });
    expect(result.activeName).toBe("SWATHI");
    expect(result.rolledOver).toBe(false);
  });

  it("reaches a third span, which nextName alone could not express", () => {
    const result = limbNow(KARANA, { isToday: true, nowIso: "2026-08-19T21:00:00+05:30" });
    expect(result.activeName).toBe("VISHTI");
    expect(result.rolledOver).toBe(true);
    // Last span of the day: nothing follows it before the next sunrise.
    expect(result.upcomingName).toBeNull();
    expect(result.until).toBeNull();
  });

  it("holds the middle span rather than skipping to the last", () => {
    const result = limbNow(KARANA, { isToday: true, nowIso: "2026-08-19T12:00:00+05:30" });
    expect(result.activeName).toBe("VANIJA");
    expect(result.upcomingName).toBe("VISHTI");
  });

  it("clamps to the first span before sunrise instead of returning nothing", () => {
    const result = limbNow(KARANA, { isToday: true, nowIso: "2026-08-19T03:00:00+05:30" });
    expect(result.activeName).toBe("GARAJA");
    expect(result.rolledOver).toBe(false);
  });

  it("falls back to the single old-wire transition when spans are absent", () => {
    const legacy = { name: "SWATHI", pada: 4, endsAt: "06:47", endsAtIso: "2026-08-19T06:47:04+05:30", nextName: "VISAKAM" };
    expect(limbNow(legacy, { isToday: true, nowIso: "2026-08-19T06:30:00+05:30" }).activeName).toBe("SWATHI");
    expect(limbNow(legacy, { isToday: true, nowIso: "2026-08-19T14:00:00+05:30" }).activeName).toBe("VISAKAM");
  });

  it("compares instants, not clock strings, when the boundary is tomorrow", () => {
    // Visakam ends 06:00 *the next morning*. A clock-only comparison reads
    // "06:00" as earlier than a 14:00 "now" and wrongly promotes — the exact
    // trap the tithi-rollover fix hit before.
    const result = limbNow(NAKSHATRA, { isToday: true, nowIso: "2026-08-19T23:59:00+05:30" });
    expect(result.activeName).toBe("VISAKAM");
    expect(result.upcomingName).toBeNull();
  });
});
