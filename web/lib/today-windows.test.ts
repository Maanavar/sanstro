import { describe, expect, it } from "vitest";

import { pickFeaturedWindow } from "./today-windows";
import type { DailyGuidanceWindow } from "./types";

const ABHIJIT: DailyGuidanceWindow = { type: "ABHIJIT_MUHURTA", start: "12:02", end: "12:50" };
const PERSONAL_AM: DailyGuidanceWindow = { type: "PERSONAL_HORA", start: "08:00", end: "09:00" };
const PERSONAL_PM: DailyGuidanceWindow = { type: "PERSONAL_HORA", start: "15:00", end: "16:00" };
const BENEFIC_HORA: DailyGuidanceWindow = { type: "BENEFIC_HORA", start: "10:00", end: "11:00" };

// Fixed "now": 2026-07-13 12:00 in Chennai (06:30 UTC).
const CHENNAI_NOON = new Date(Date.UTC(2026, 6, 13, 6, 30));
const TZ = "Asia/Kolkata";
const DATE = "2026-07-13";

describe("pickFeaturedWindow", () => {
  it("returns null when there are no windows", () => {
    expect(pickFeaturedWindow(undefined, CHENNAI_NOON, true, DATE, TZ)).toBeNull();
    expect(pickFeaturedWindow([], CHENNAI_NOON, true, DATE, TZ)).toBeNull();
  });

  it("prefers PERSONAL_HORA over Abhijit (DASH-10 doctrine deviation, queued)", () => {
    const picked = pickFeaturedWindow([ABHIJIT, PERSONAL_AM, PERSONAL_PM], CHENNAI_NOON, false, DATE, TZ);
    expect(picked).toBe(PERSONAL_AM);
  });

  it("falls back to benefic horas, then Abhijit, when nothing personal exists", () => {
    expect(pickFeaturedWindow([ABHIJIT, BENEFIC_HORA], CHENNAI_NOON, false, DATE, TZ)).toBe(BENEFIC_HORA);
    expect(pickFeaturedWindow([ABHIJIT], CHENNAI_NOON, false, DATE, TZ)).toBe(ABHIJIT);
  });

  it("on today, skips windows that already ended — judged in the panchangam zone", () => {
    // At Chennai noon, the 08:00-09:00 window is over; 15:00-16:00 is upcoming.
    const picked = pickFeaturedWindow([PERSONAL_AM, PERSONAL_PM], CHENNAI_NOON, true, DATE, TZ);
    expect(picked).toBe(PERSONAL_PM);
  });

  it("a Toronto browser clock must not change the answer (DASH-01)", () => {
    // Same instant is 02:30 in Toronto — with browser-local math the 08:00
    // window would look upcoming. In Chennai's zone it has ended.
    const picked = pickFeaturedWindow([PERSONAL_AM, PERSONAL_PM], CHENNAI_NOON, true, DATE, TZ);
    expect(picked).not.toBe(PERSONAL_AM);
  });

  it("keeps the last window when everything has ended", () => {
    const evening = new Date(Date.UTC(2026, 6, 13, 15, 0)); // 20:30 Chennai
    const picked = pickFeaturedWindow([PERSONAL_AM, PERSONAL_PM], evening, true, DATE, TZ);
    expect(picked).toBe(PERSONAL_PM);
  });

  it("on other dates, returns the first preferred window", () => {
    const picked = pickFeaturedWindow([ABHIJIT, PERSONAL_PM, PERSONAL_AM], CHENNAI_NOON, false, DATE, TZ);
    expect(picked).toBe(PERSONAL_PM);
  });
});
