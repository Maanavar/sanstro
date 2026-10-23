import { describe, expect, it } from "vitest";
import {
  calendarYearNow,
  parseEventSlug,
  promotedCalendarYears,
  servedCalendarYears,
} from "./tamil-calendar-years";

const OCT_2026 = new Date("2026-10-23T06:00:00Z");

describe("tamil-calendar years", () => {
  it("reads the year in India, not UTC", () => {
    // 31 Dec 20:00 UTC is 1 Jan 01:30 in Chennai.
    expect(calendarYearNow(new Date("2026-12-31T20:00:00Z"))).toBe(2027);
    expect(calendarYearNow(new Date("2026-12-31T18:00:00Z"))).toBe(2026);
  });

  it("serves last, this and next year; promotes this and next", () => {
    expect(servedCalendarYears(OCT_2026)).toEqual([2025, 2026, 2027]);
    expect(promotedCalendarYears(OCT_2026)).toEqual([2026, 2027]);
  });

  it("turns over on 1 January without a code change", () => {
    const jan2027 = new Date("2027-01-01T00:00:00+05:30");
    expect(promotedCalendarYears(jan2027)).toEqual([2027, 2028]);
    expect(parseEventSlug("pournami-2026", jan2027)).toEqual({ key: "pournami", year: 2026 });
    expect(parseEventSlug("pournami-2025", jan2027)).toBeNull();
  });

  it("clips to the backend's 2020-2045", () => {
    expect(servedCalendarYears(new Date("2045-06-01T00:00:00Z"))).toEqual([2044, 2045]);
    expect(promotedCalendarYears(new Date("2045-06-01T00:00:00Z"))).toEqual([2045]);
  });

  it("parses only known events in served years", () => {
    expect(parseEventSlug("sankatahara-chathurthi-2027", OCT_2026)).toEqual({ key: "sankatahara-chathurthi", year: 2027 });
    expect(parseEventSlug("pournami-2028", OCT_2026)).toBeNull();
    expect(parseEventSlug("pournami", OCT_2026)).toBeNull();
    expect(parseEventSlug("hindu-festivals-2026", OCT_2026)).toBeNull();
    expect(parseEventSlug("POURNAMI-2026", OCT_2026)).toBeNull();
  });
});
