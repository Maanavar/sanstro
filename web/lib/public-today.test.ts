import { describe, expect, it } from "vitest";
import {
  avoidPeriods,
  formatCountdown,
  headlineFestival,
  pickAvoidPeriod,
  pickGuestWindow,
  spanState,
} from "./public-today";
import type { PanchangamDailyResponseData } from "./types";

type Kalam = PanchangamDailyResponseData["kalam"];

/**
 * The marketing hero used to print `bestWindow: { start: "11:53", end: "12:41" }`
 * — a constant. What replaced it must obey the same ruling the dashboard hero
 * obeys, because the two now show the same kind of claim to the same reader:
 *
 *   1. best Gowri kala wins (Amirtham > Uthi > Labham > Dhanam > Sugam);
 *   2. never a window that overlaps Rahu Kalam / Yamagandam / Kuligai;
 *   3. on today, the next window that has not already ended.
 *
 * Each of these fails silently if it regresses — a landing page recommending a
 * window inside Rahu Kalam looks completely normal in a diff and is the single
 * most damaging thing this surface could say to a Tamil reader.
 */

const TZ = "Asia/Kolkata";
const DATE = "2026-09-04";

/** Epoch ms of an IST wall-clock time on DATE. IST is UTC+5:30 year-round. */
function ist(hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(2026, 8, 4, h - 5, m - 30));
}

function kalam(overrides: Partial<Kalam> = {}): Kalam {
  return {
    rahuKalam: { start: "10:48", end: "12:19", slot: 4 },
    yamagandam: { start: "15:22", end: "16:53", slot: 7 },
    kuligai: { start: "07:45", end: "09:16", slot: 2 },
    gowriPanchangam: [],
    nallaNeram: [],
    gowriNallaNeram: [],
    ...overrides,
  };
}

function slot(start: string, end: string, name: string, period: "DAY" | "NIGHT" = "DAY", isGood = true) {
  return { start, end, slot: 0, name, period, isGood };
}

describe("avoidPeriods", () => {
  it("lists the three kalas with Rahu Kalam first", () => {
    expect(avoidPeriods(kalam()).map((p) => p.key)).toEqual(["rahuKalam", "yamagandam", "kuligai"]);
  });

  it("is empty rather than throwing when the section is missing", () => {
    expect(avoidPeriods(null)).toEqual([]);
  });
});

describe("pickAvoidPeriod", () => {
  const at = (hhmm: string) => ({ now: ist(hhmm), dateLocal: DATE, timeZone: TZ });

  it("names the next kala still ahead, in clock order", () => {
    // Kuligai 07:45 is the earliest of the three on this fixture.
    expect(pickAvoidPeriod(kalam(), at("06:00"))?.key).toBe("kuligai");
    expect(pickAvoidPeriod(kalam(), at("10:00"))?.key).toBe("rahuKalam");
  });

  it("keeps the kala the reader is currently inside", () => {
    expect(pickAvoidPeriod(kalam(), at("11:30"))?.key).toBe("rahuKalam");
  });

  it("advances rather than sitting on one that has ended", () => {
    // Rahu Kalam finished at 12:19 and Yamagandam is still three hours out —
    // holding on Rahu Kalam left the whole afternoon's caution unnamed.
    expect(pickAvoidPeriod(kalam(), at("13:00"))?.key).toBe("yamagandam");
  });

  it("falls back to Rahu Kalam once all three are spent", () => {
    // The one of the three a reader who knows only one of them knows, so
    // "over for today" reads against a familiar name.
    expect(pickAvoidPeriod(kalam(), at("18:00"))?.key).toBe("rahuKalam");
  });
});

describe("spanState", () => {
  const span = { start: "10:48", end: "12:19" };

  it("counts down to a window that has not started", () => {
    const state = spanState(span, { now: ist("10:30"), dateLocal: DATE, timeZone: TZ });
    expect(state.phase).toBe("before");
    expect(Math.round((state.remainingMs ?? 0) / 60000)).toBe(18);
  });

  it("reports the time left while the reader is inside it", () => {
    const state = spanState(span, { now: ist("12:01"), dateLocal: DATE, timeZone: TZ });
    expect(state.phase).toBe("during");
    expect(Math.round((state.remainingMs ?? 0) / 60000)).toBe(18);
  });

  it("goes to `after` once it has ended", () => {
    expect(spanState(span, { now: ist("12:20"), dateLocal: DATE, timeZone: TZ }).phase).toBe("after");
  });

  // The whole point of threading the zone through: a marketing page is read
  // from anywhere, and these are Chennai times. Judged against a London clock,
  // 12:01 IST is 07:31 BST and the reader would be told the window has not
  // started when they are standing in the middle of it.
  it("resolves in the panchangam zone, not the reader's", () => {
    const insideIst = ist("12:01");
    expect(spanState(span, { now: insideIst, dateLocal: DATE, timeZone: TZ }).phase).toBe("during");
    expect(spanState(span, { now: insideIst, dateLocal: DATE, timeZone: "Europe/London" }).phase).toBe("before");
  });
});

describe("formatCountdown", () => {
  it("prints minutes under an hour and h+m over it", () => {
    expect(formatCountdown(18 * 60_000, "en")).toBe("18m");
    expect(formatCountdown(65 * 60_000, "en")).toBe("1h 5m");
    expect(formatCountdown(120 * 60_000, "en")).toBe("2h");
  });

  it("never renders a negative countdown", () => {
    expect(formatCountdown(-90_000, "en")).toBe("0m");
  });
});

describe("pickGuestWindow", () => {
  it("promotes the best-ranked Gowri kala", () => {
    const pick = pickGuestWindow(
      kalam({
        gowriPanchangam: [
          slot("06:14", "07:45", "SUGAM"),
          slot("13:50", "15:22", "AMIRTHAM"),
          slot("12:19", "13:50", "LABHAM"),
        ],
      }),
      { now: ist("06:00"), dateLocal: DATE, timeZone: TZ },
    );

    expect(pick?.slot.name).toBe("AMIRTHAM");
    expect(pick?.collidesWithAvoid).toBe(false);
  });

  // The ruling that matters most on this surface. A better-ranked kala sitting
  // inside Rahu Kalam must lose to a worse-ranked clean one, and the card must
  // still be able to say "clear of the three".
  it("never promotes a window that overlaps an avoid kala", () => {
    const pick = pickGuestWindow(
      kalam({
        gowriPanchangam: [
          slot("11:00", "12:19", "AMIRTHAM"), // sits inside Rahu Kalam
          slot("13:50", "15:22", "SUGAM"),
        ],
      }),
      { now: ist("06:00"), dateLocal: DATE, timeZone: TZ },
    );

    expect(pick?.slot.name).toBe("SUGAM");
    expect(pick?.skippedForCollision).toBe(1);
    expect(pick?.collidesWithAvoid).toBe(false);
  });

  it("says so, rather than going blank, when nothing is clean all day", () => {
    const pick = pickGuestWindow(
      kalam({ gowriPanchangam: [slot("11:00", "12:19", "AMIRTHAM")] }),
      { now: ist("06:00"), dateLocal: DATE, timeZone: TZ },
    );

    expect(pick?.slot.name).toBe("AMIRTHAM");
    expect(pick?.collidesWithAvoid).toBe(true);
  });

  it("advances past windows that have already ended", () => {
    const pick = pickGuestWindow(
      kalam({
        gowriPanchangam: [
          slot("06:14", "07:45", "AMIRTHAM"),
          slot("13:50", "15:22", "SUGAM"),
        ],
      }),
      { now: ist("12:30"), dateLocal: DATE, timeZone: TZ },
    );

    expect(pick?.slot.start).toBe("13:50");
    expect(pick?.hasPassed).toBe(false);
  });

  // A landing page promoting 01:40 as "your best window today" is worse than
  // one that admits the day is spent, so the night fallback is the backend's
  // *earliest* clear-good night kala (which lands in the evening), not the
  // best-ranked one (which walks around the clock across the week).
  it("falls through to tonight once every daytime window is spent", () => {
    const pick = pickGuestWindow(
      kalam({
        gowriPanchangam: [slot("06:14", "07:45", "AMIRTHAM")],
        gowriNallaNeram: [slot("18:26", "19:57", "LABHAM", "NIGHT")],
      }),
      { now: ist("20:00"), dateLocal: DATE, timeZone: TZ },
    );

    // 18:26–19:57 has itself passed by 20:00, so the day is genuinely over.
    expect(pick?.hasPassed).toBe(true);
  });

  it("promotes tonight's window while it is still ahead", () => {
    const pick = pickGuestWindow(
      kalam({
        gowriPanchangam: [slot("06:14", "07:45", "AMIRTHAM")],
        gowriNallaNeram: [slot("18:26", "19:57", "LABHAM", "NIGHT")],
      }),
      { now: ist("17:00"), dateLocal: DATE, timeZone: TZ },
    );

    expect(pick?.isNight).toBe(true);
    expect(pick?.slot.start).toBe("18:26");
  });

  // `gowriPanchangam` is optional on the response type (older cached payloads
  // predate it). The panel must still recommend something rather than render
  // an empty card.
  it("falls back to the Nalla Neram summary when the full grid is absent", () => {
    const pick = pickGuestWindow(
      kalam({ gowriPanchangam: [], nallaNeram: [slot("06:14", "07:45", "SUGAM")] }),
      { now: ist("06:00"), dateLocal: DATE, timeZone: TZ },
    );

    expect(pick?.slot.start).toBe("06:14");
  });

  it("returns null when the day carries no kalam section at all", () => {
    expect(pickGuestWindow(null, { now: ist("06:00"), dateLocal: DATE, timeZone: TZ })).toBeNull();
  });
});

describe("headlineFestival", () => {
  it("prefers a real festival over a world observance", () => {
    const picked = headlineFestival([
      { name: "World Literacy Day", category: "observance" },
      { name: "Krishna Jayanthi", category: "hindu" },
    ]);
    expect(picked?.name).toBe("Krishna Jayanthi");
  });

  it("reads the tag list when one is present, not just the category", () => {
    const picked = headlineFestival([
      { name: "Some Day", category: "hindu", tags: ["observance"] },
    ]);
    expect(picked).toBeNull();
  });
});
