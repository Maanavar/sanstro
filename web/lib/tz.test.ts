import { describe, expect, it } from "vitest";

import { formatClockInZone, hourInZone, minutesOfDayInZone, timeOnDateToMs, zonedParts } from "./tz";

// 2026-07-13T12:00:00Z — 17:30 in Chennai (UTC+5:30), 08:00 in Toronto (EDT, UTC-4).
const NOON_UTC = new Date(Date.UTC(2026, 6, 13, 12, 0, 0));

describe("zonedParts", () => {
  it("reads wall-clock parts in the target zone", () => {
    const chennai = zonedParts(NOON_UTC, "Asia/Kolkata");
    expect(chennai).toEqual({ year: 2026, month: 7, day: 13, hour: 17, minute: 30, second: 0 });
    const toronto = zonedParts(NOON_UTC, "America/Toronto");
    expect(toronto).toMatchObject({ hour: 8, minute: 0 });
  });

  it("returns null for an invalid zone id instead of throwing", () => {
    expect(zonedParts(NOON_UTC, "Not/AZone")).toBeNull();
  });
});

describe("hourInZone / minutesOfDayInZone", () => {
  it("computes hour and minutes-of-day in the panchangam zone", () => {
    expect(hourInZone(NOON_UTC, "Asia/Kolkata")).toBe(17);
    expect(minutesOfDayInZone(NOON_UTC, "Asia/Kolkata")).toBe(17 * 60 + 30);
    expect(hourInZone(NOON_UTC, "America/Toronto")).toBe(8);
    expect(minutesOfDayInZone(NOON_UTC, "America/Toronto")).toBe(8 * 60);
  });

  it("falls back to the local clock when zone is absent or invalid", () => {
    expect(hourInZone(NOON_UTC, null)).toBe(NOON_UTC.getHours());
    expect(hourInZone(NOON_UTC, "Not/AZone")).toBe(NOON_UTC.getHours());
    expect(minutesOfDayInZone(NOON_UTC, undefined)).toBe(NOON_UTC.getHours() * 60 + NOON_UTC.getMinutes());
  });
});

describe("timeOnDateToMs", () => {
  it("anchors a wall-clock time to the target zone, not the browser's", () => {
    // 06:00 on 2026-07-13 in Chennai is 00:30 UTC.
    expect(timeOnDateToMs("2026-07-13", "06:00", "Asia/Kolkata")).toBe(Date.UTC(2026, 6, 13, 0, 30));
    // Same wall-clock in Toronto (EDT, UTC-4) is 10:00 UTC.
    expect(timeOnDateToMs("2026-07-13", "06:00", "America/Toronto")).toBe(Date.UTC(2026, 6, 13, 10, 0));
  });

  it("accepts ISO strings with a time part", () => {
    expect(timeOnDateToMs("2026-07-13", "2026-07-13T06:00:00", "Asia/Kolkata")).toBe(
      Date.UTC(2026, 6, 13, 0, 30),
    );
  });

  it("handles a DST transition day (America/New_York spring forward)", () => {
    // 2026-03-08: clocks jump 02:00 -> 03:00 EST->EDT. 05:00 EDT = 09:00 UTC.
    expect(timeOnDateToMs("2026-03-08", "05:00", "America/New_York")).toBe(Date.UTC(2026, 2, 8, 9, 0));
  });

  it("returns null on unparseable input", () => {
    expect(timeOnDateToMs("2026-07-13", "", "Asia/Kolkata")).toBeNull();
    expect(timeOnDateToMs("2026-07-13", "no-time", "Asia/Kolkata")).toBeNull();
    expect(timeOnDateToMs("not-a-date", "06:00", "Asia/Kolkata")).toBeNull();
  });

  it("falls back to the local-clock interpretation without a zone", () => {
    const localExpected = new Date("2026-07-13T06:00:00").getTime();
    expect(timeOnDateToMs("2026-07-13", "06:00")).toBe(localExpected);
    expect(timeOnDateToMs("2026-07-13", "06:00", null)).toBe(localExpected);
  });
});

describe("formatClockInZone", () => {
  it("formats the zone's wall-clock time", () => {
    const label = formatClockInZone(NOON_UTC, "en-IN", "Asia/Kolkata");
    expect(label.replace(/ /g, " ").toLowerCase()).toContain("5:30");
  });

  it("does not throw on an invalid zone", () => {
    expect(() => formatClockInZone(NOON_UTC, "en-IN", "Not/AZone")).not.toThrow();
  });
});
