import { describe, expect, it } from "vitest";

import {
  findSecondaryAbhijitWindow,
  pickFeaturedWindow,
  pickRecommendedWindow,
  spansOverlap,
  type TimingSpan,
} from "./today-windows";
import type { DailyGuidanceWindow } from "./types";

// Matches the real backend type string (app/services/_dg_hora.py:87) — must
// stay exact since findSecondaryAbhijitWindow matches on it.
const ABHIJIT: DailyGuidanceWindow = { type: "ABHIJIT", start: "12:02", end: "12:50" };
const PERSONAL_AM: DailyGuidanceWindow = { type: "PERSONAL_HORA", start: "08:00", end: "09:00" };
const PERSONAL_PM: DailyGuidanceWindow = { type: "PERSONAL_HORA", start: "15:00", end: "16:00" };
const BENEFIC_HORA: DailyGuidanceWindow = { type: "BENEFIC_HORA", start: "10:00", end: "11:00" };

// Fixed "now": 2026-07-13 12:00 in Chennai (06:30 UTC).
const CHENNAI_NOON = new Date(Date.UTC(2026, 6, 13, 6, 30));
const TZ = "Asia/Kolkata";
const DATE = "2026-07-13";

/* `pickFeaturedWindow` is no longer what the Today hero promotes — T8's
   `pickRecommendedWindow` below is — but it remains the fallback for responses
   whose windows carry no Gowri kala, so its behaviour is still load-bearing and
   still pinned. */
describe("pickFeaturedWindow", () => {
  it("returns null when there are no windows", () => {
    expect(pickFeaturedWindow(undefined, CHENNAI_NOON, true, DATE, TZ)).toBeNull();
    expect(pickFeaturedWindow([], CHENNAI_NOON, true, DATE, TZ)).toBeNull();
  });

  it("prefers PERSONAL_HORA over Abhijit for the hero (DASH-10.1 ruling: shown as a secondary line instead, see findSecondaryAbhijitWindow)", () => {
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

describe("findSecondaryAbhijitWindow", () => {
  it("returns null when there are no windows", () => {
    expect(findSecondaryAbhijitWindow(undefined, null)).toBeNull();
    expect(findSecondaryAbhijitWindow([], null)).toBeNull();
  });

  it("returns null when there's no Abhijit window", () => {
    expect(findSecondaryAbhijitWindow([PERSONAL_AM, BENEFIC_HORA], PERSONAL_AM)).toBeNull();
  });

  it("returns Abhijit when a personal window won the hero instead (DASH-10.1)", () => {
    const featured = pickFeaturedWindow([ABHIJIT, PERSONAL_AM], CHENNAI_NOON, false, DATE, TZ);
    expect(findSecondaryAbhijitWindow([ABHIJIT, PERSONAL_AM], featured)).toBe(ABHIJIT);
  });

  it("returns null when Abhijit is itself the featured window (no duplicate line)", () => {
    const featured = pickFeaturedWindow([ABHIJIT], CHENNAI_NOON, false, DATE, TZ);
    expect(findSecondaryAbhijitWindow([ABHIJIT], featured)).toBeNull();
  });
});

/**
 * T8 / A-013. Today used to show four "good time" systems — Nalla Neram, Gowri,
 * Abhijit, Horai — at the same weight as Rahu Kalam / Yamagandam / Kuligai, so
 * a reader who knows only Rahu Kalam could not tell which to obey.
 *
 * The owner's ruling (2026-08-23) is what these pin, because it is a doctrine
 * decision and not a preference: the promoted window is the one in the best
 * GOWRI KALA, and a window overlapping an avoid-kala is never promoted no
 * matter how good its kala is. Both halves are silent when wrong — a hero card
 * that quietly recommends acting inside Rahu Kalam looks entirely normal.
 */

const AVOID: TimingSpan[] = [
  { start: "09:00", end: "10:30" }, // Rahu Kalam
  { start: "13:30", end: "15:00" }, // Yamagandam
  { start: "06:00", end: "07:30" }, // Kuligai
];

function win(partial: Partial<DailyGuidanceWindow> & { start: string; end: string }): DailyGuidanceWindow {
  return { type: "PERSONAL_HORA", ...partial };
}

const NOON = new Date("2026-08-23T06:30:00Z"); // 12:00 in Asia/Kolkata
const OPTS = { now: NOON, isToday: true, dateLocal: "2026-08-23", timeZone: "Asia/Kolkata" };

describe("spansOverlap", () => {
  it("does not treat touching edges as an overlap", () => {
    expect(spansOverlap({ start: "10:30", end: "11:00" }, { start: "09:00", end: "10:30" })).toBe(false);
  });

  it("catches partial and full containment in both directions", () => {
    expect(spansOverlap({ start: "10:00", end: "11:00" }, { start: "09:00", end: "10:30" })).toBe(true);
    expect(spansOverlap({ start: "09:15", end: "09:45" }, { start: "09:00", end: "10:30" })).toBe(true);
    expect(spansOverlap({ start: "08:00", end: "12:00" }, { start: "09:00", end: "10:30" })).toBe(true);
  });

  it("reports no overlap rather than guessing when a time is unparseable", () => {
    expect(spansOverlap({ start: "", end: "" }, { start: "09:00", end: "10:30" })).toBe(false);
  });
});

describe("pickRecommendedWindow — the Gowri ranking decides", () => {
  it("promotes the best kala, not the personal hora", () => {
    const result = pickRecommendedWindow(
      [
        win({ start: "16:00", end: "16:45", kala: "SUGAM", isPersonal: true }),
        win({ start: "11:00", end: "11:48", kala: "AMIRTHAM", isPersonal: false }),
      ],
      AVOID,
      { ...OPTS, now: new Date("2026-08-23T03:00:00Z") }, // 08:30 local — both still ahead
    );

    expect(result?.window.start).toBe("11:00");
    expect(result?.rank).toBe(1);
  });

  it("breaks a tie on the same kala by the earlier start", () => {
    const result = pickRecommendedWindow(
      [
        win({ start: "16:00", end: "16:45", kala: "LABHAM" }),
        win({ start: "11:00", end: "11:48", kala: "LABHAM" }),
      ],
      [],
      { ...OPTS, now: new Date("2026-08-23T03:00:00Z") },
    );

    expect(result?.window.start).toBe("11:00");
  });

  it("sorts a window with no kala last rather than dropping it", () => {
    // Rows cached before the backend attached `kala` send type/start/end only.
    // They must still be usable, just never preferred over a named kala.
    const result = pickRecommendedWindow(
      [
        win({ start: "11:00", end: "11:48" }),
        win({ start: "16:00", end: "16:45", kala: "SUGAM" }),
      ],
      [],
      { ...OPTS, now: new Date("2026-08-23T03:00:00Z") },
    );

    expect(result?.window.start).toBe("16:00");
    expect(result?.rank).toBe(5);
  });
});

describe("pickRecommendedWindow — an avoid-kala vetoes the window", () => {
  it("skips the best-ranked window when it runs into Rahu Kalam", () => {
    const result = pickRecommendedWindow(
      [
        win({ start: "09:12", end: "10:36", kala: "AMIRTHAM" }), // inside Rahu Kalam
        win({ start: "11:00", end: "11:48", kala: "LABHAM" }),
      ],
      AVOID,
      { ...OPTS, now: new Date("2026-08-23T03:00:00Z") },
    );

    expect(result?.window.start).toBe("11:00");
    expect(result?.rank).toBe(3);
    expect(result?.skippedForCollision).toBe(1);
    expect(result?.collidesWithAvoid).toBe(false);
  });

  it("checks every avoid-kala, not just Rahu Kalam", () => {
    const result = pickRecommendedWindow(
      [
        win({ start: "14:00", end: "14:40", kala: "AMIRTHAM" }), // Yamagandam
        win({ start: "06:30", end: "07:00", kala: "UTHI" }),     // Kuligai
        win({ start: "11:00", end: "11:48", kala: "DHANAM" }),
      ],
      AVOID,
      { ...OPTS, now: new Date("2026-08-23T03:00:00Z") },
    );

    expect(result?.window.start).toBe("11:00");
    expect(result?.skippedForCollision).toBe(2);
  });

  it("degrades honestly when every window of the day collides", () => {
    // Shown, flagged, and never silently dropped: a reader on such a day still
    // needs to know what the least-bad option is.
    const result = pickRecommendedWindow(
      [
        win({ start: "09:12", end: "10:36", kala: "SUGAM" }),
        win({ start: "14:00", end: "14:40", kala: "AMIRTHAM" }),
      ],
      AVOID,
      { ...OPTS, now: new Date("2026-08-23T00:00:00Z") },
    );

    expect(result).not.toBeNull();
    expect(result?.collidesWithAvoid).toBe(true);
    expect(result?.window.kala).toBe("AMIRTHAM");
  });
});

describe("pickRecommendedWindow — staying actionable through the day", () => {
  it("prefers a clean window that has not ended yet, over a better-ranked one that has", () => {
    const result = pickRecommendedWindow(
      [
        win({ start: "07:40", end: "08:20", kala: "AMIRTHAM" }),
        win({ start: "16:00", end: "16:45", kala: "SUGAM" }),
      ],
      AVOID,
      OPTS, // 12:00 local
    );

    expect(result?.window.start).toBe("16:00");
    expect(result?.hasPassed).toBe(false);
  });

  it("falls back to the day's best and says it has passed when nothing is left", () => {
    const result = pickRecommendedWindow(
      [win({ start: "07:40", end: "08:20", kala: "AMIRTHAM" })],
      AVOID,
      OPTS,
    );

    expect(result?.window.start).toBe("07:40");
    expect(result?.hasPassed).toBe(true);
  });

  it("ignores the clock entirely on a date that is not today", () => {
    const result = pickRecommendedWindow(
      [
        win({ start: "07:40", end: "08:20", kala: "AMIRTHAM" }),
        win({ start: "16:00", end: "16:45", kala: "SUGAM" }),
      ],
      AVOID,
      { ...OPTS, isToday: false, dateLocal: "2026-09-01" },
    );

    expect(result?.window.start).toBe("07:40");
    expect(result?.hasPassed).toBe(false);
  });

  it("returns null when there are no windows at all", () => {
    expect(pickRecommendedWindow([], AVOID, OPTS)).toBeNull();
    expect(pickRecommendedWindow(undefined, AVOID, OPTS)).toBeNull();
  });
});
