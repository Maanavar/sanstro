import { describe, expect, it } from "vitest";

import { activeLimb, parseHmToMinutes } from "./dashboard-calendar-shared";

const hm = (value: string) => parseHmToMinutes(value);

describe("activeLimb", () => {
  // Regression: 2026-07-20 Chennai. Saptami runs from before sunrise (05:55)
  // until 04:03 the *next* morning. The old clock-only heuristics (a hard-coded
  // `end >= 240` cutoff, then an `end > sunrise` guess) both misread 04:03 as a
  // same-day boundary and promoted the headline to Ashtami — tomorrow's tithi —
  // for the whole day. Comparing the real ISO instant fixes it.
  it("does not promote a tithi whose boundary rolled past midnight", () => {
    const result = activeLimb("SAPTAMI", "04:03", "ASHTAMI", hm("14:00"), "2026-07-21T04:03:00+05:30", "2026-07-20T08:30:00+05:30");

    expect(result.activeName).toBe("SAPTAMI");
    expect(result.rolledOver).toBe(false);
    expect(result.until).toBe("04:03");
  });

  it("holds the sunrise tithi at every hour of the affected day", () => {
    for (const now of ["00:10", "04:04", "05:56", "12:00", "18:30", "23:59"]) {
      const nowIso = `2026-07-20T${now}:00+05:30`;
      const result = activeLimb("SAPTAMI", "04:03", "ASHTAMI", hm(now), "2026-07-21T04:03:00+05:30", nowIso);
      expect(result.activeName, `at ${now}`).toBe("SAPTAMI");
    }
  });

  it("promotes once a genuine same-day boundary has passed", () => {
    // 2026-07-20 nakshatra: Hastham ends 19:09 the same evening.
    const before = activeLimb("HASTHAM", "19:09", "CHITHIRAI", hm("18:00"), "2026-07-20T19:09:00+05:30", "2026-07-20T18:00:00+05:30");
    expect(before.activeName).toBe("HASTHAM");
    expect(before.rolledOver).toBe(false);

    const after = activeLimb("HASTHAM", "19:09", "CHITHIRAI", hm("19:10"), "2026-07-20T19:09:00+05:30", "2026-07-20T19:10:00+05:30");
    expect(after.activeName).toBe("CHITHIRAI");
    expect(after.rolledOver).toBe(true);
    expect(after.until).toBeNull();
  });

  it("never promotes when the viewed date is not today (nowMinutes < 0)", () => {
    const result = activeLimb("HASTHAM", "19:09", "CHITHIRAI", -1, "2026-07-20T19:09:00+05:30", "2026-07-20T19:10:00+05:30");
    expect(result.activeName).toBe("HASTHAM");
    expect(result.rolledOver).toBe(false);
    expect(result.upcomingName).toBe("CHITHIRAI");
  });

  it("treats a boundary exactly at sunrise as belonging to the next day", () => {
    const result = activeLimb("ASHTAMI", "05:55", "NAVAMI", hm("12:00"), "2026-07-21T05:55:00+05:30", "2026-07-20T12:00:00+05:30");
    expect(result.activeName).toBe("ASHTAMI");
    expect(result.rolledOver).toBe(false);
  });

  // 2026-07-21: Ashtami ends 05:17 next morning, before that day's 05:55
  // sunrise. Same shape as the reported bug, one day later.
  it("holds Ashtami through 2026-07-21", () => {
    const result = activeLimb("ASHTAMI", "05:17", "NAVAMI", hm("20:00"), "2026-07-22T05:17:00+05:30", "2026-07-21T20:00:00+05:30");
    expect(result.activeName).toBe("ASHTAMI");
    expect(result.rolledOver).toBe(false);
  });

  // Regression: 2026-07-25 Chennai. Kettai (Jyeshtha) nakshatra runs from
  // before sunrise (05:56) until 07:35 the *next* morning (2026-07-26). Because
  // 07:35 is numerically later than sunrise's 05:56, the pre-ISO `end >
  // sunrise` heuristic read it as "ends later today" and promoted the headline
  // to Moolam (the next nakshatra) as soon as the clock passed 7:35 AM on the
  // 25th itself — 24 hours before Kettai actually ends. This is the exact bug
  // reported live: "today's nakshatra" showed Moolam instead of Kettai.
  it("does not promote a nakshatra whose >24h span ends after sunrise's clock-time tomorrow", () => {
    const result = activeLimb("KETTAI", "07:35", "MOOLAM", hm("09:00"), "2026-07-26T07:35:00+05:30", "2026-07-25T09:00:00+05:30");

    expect(result.activeName).toBe("KETTAI");
    expect(result.rolledOver).toBe(false);
    expect(result.until).toBe("07:35");
  });

  it("promotes the 2026-07-25 nakshatra once the real end instant has passed", () => {
    const result = activeLimb("KETTAI", "07:35", "MOOLAM", hm("08:00"), "2026-07-26T07:35:00+05:30", "2026-07-26T08:00:00+05:30");

    expect(result.activeName).toBe("MOOLAM");
    expect(result.rolledOver).toBe(true);
  });
});
