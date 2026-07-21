import { describe, expect, it } from "vitest";

import { activeLimb, parseHmToMinutes } from "./dashboard-calendar-shared";

const hm = (value: string) => parseHmToMinutes(value);

describe("activeLimb", () => {
  // Regression: 2026-07-20 Chennai. Saptami runs from before sunrise (05:55)
  // until 04:03 the *next* morning, so the wire value is "04:03" with the date
  // stripped. The old `end >= 240` (04:00) heuristic read 04:03 as a same-day
  // daytime boundary and promoted the headline to Ashtami — tomorrow's tithi —
  // from 04:03 onward, while every other panchangam showed Saptami.
  it("does not promote a tithi whose boundary rolled past midnight", () => {
    const result = activeLimb("SAPTAMI", "04:03", "ASHTAMI", hm("14:00"), "05:55");

    expect(result.activeName).toBe("SAPTAMI");
    expect(result.rolledOver).toBe(false);
    expect(result.until).toBe("04:03");
  });

  it("holds the sunrise tithi at every hour of the affected day", () => {
    for (const now of ["00:10", "04:04", "05:56", "12:00", "18:30", "23:59"]) {
      const result = activeLimb("SAPTAMI", "04:03", "ASHTAMI", hm(now), "05:55");
      expect(result.activeName, `at ${now}`).toBe("SAPTAMI");
    }
  });

  it("promotes once a genuine same-day boundary has passed", () => {
    // 2026-07-20 nakshatra: Hastham ends 19:09 the same evening.
    const before = activeLimb("HASTHAM", "19:09", "CHITHIRAI", hm("18:00"), "05:55");
    expect(before.activeName).toBe("HASTHAM");
    expect(before.rolledOver).toBe(false);

    const after = activeLimb("HASTHAM", "19:09", "CHITHIRAI", hm("19:10"), "05:55");
    expect(after.activeName).toBe("CHITHIRAI");
    expect(after.rolledOver).toBe(true);
    expect(after.until).toBeNull();
  });

  it("never promotes when the viewed date is not today (nowMinutes < 0)", () => {
    const result = activeLimb("HASTHAM", "19:09", "CHITHIRAI", -1, "05:55");
    expect(result.activeName).toBe("HASTHAM");
    expect(result.rolledOver).toBe(false);
    expect(result.upcomingName).toBe("CHITHIRAI");
  });

  it("treats a boundary exactly at sunrise as belonging to the next day", () => {
    const result = activeLimb("ASHTAMI", "05:55", "NAVAMI", hm("12:00"), "05:55");
    expect(result.activeName).toBe("ASHTAMI");
    expect(result.rolledOver).toBe(false);
  });

  // 2026-07-21: Ashtami ends 05:17 next morning, before that day's 05:55
  // sunrise. Same shape as the reported bug, one day later.
  it("holds Ashtami through 2026-07-21", () => {
    const result = activeLimb("ASHTAMI", "05:17", "NAVAMI", hm("20:00"), "05:55");
    expect(result.activeName).toBe("ASHTAMI");
    expect(result.rolledOver).toBe(false);
  });
});
