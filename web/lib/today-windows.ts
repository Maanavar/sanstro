import { timeOnDateToMs } from "@/lib/tz";
import type { DailyGuidanceWindow } from "@/lib/types";

/**
 * Choose which best-window to feature in the Today hero. The backend always
 * lists Abhijit first — a ~48-min slot fixed around solar noon, so it barely
 * moves day to day and made the hero read "12:02–12:50" every single day. We
 * instead prefer the user's own planetary-hora windows (PERSONAL_HORA — keyed
 * to lagna lord + running dasha), which land at a different clock time each
 * weekday, then any benefic hora, and only fall back to Abhijit when nothing
 * personal exists. On today we surface the next window that hasn't ended yet,
 * so the hero stays actionable as the day advances; on other dates we show the
 * first. "Ended yet" is judged in the panchangam timezone (`timeZone`) when
 * given — window times are wall-clock at the panchangam location, not the
 * browser's (DASH-01).
 *
 * RULING (DASH-10.1, 2026-07-16): the hero still leads with the personal
 * window (more actionable, varies day to day), but Abhijit — a universally
 * auspicious daily muhurtham in Tamil panchangam tradition — should never
 * fully vanish just because a personal window exists. See
 * `findSecondaryAbhijitWindow` below, which callers use to surface it as a
 * small secondary line when it isn't already the featured window.
 */
export function pickFeaturedWindow(
  windows: DailyGuidanceWindow[] | undefined,
  now: Date,
  isToday: boolean,
  dateLocal: string,
  timeZone?: string | null,
): DailyGuidanceWindow | null {
  if (!windows || windows.length === 0) return null;
  const personal = windows.filter((w) => w.type.includes("PERSONAL_HORA"));
  const horas = windows.filter((w) => w.type.includes("HORA"));
  const preferred = personal.length ? personal : horas.length ? horas : windows;
  if (isToday) {
    const upcoming = preferred.find((w) => {
      const endMs = timeOnDateToMs(dateLocal, w.end, timeZone);
      return endMs === null || endMs >= now.getTime();
    });
    return upcoming ?? preferred[preferred.length - 1] ?? null;
  }
  return preferred[0] ?? null;
}

/**
 * Find the day's Abhijit window when one exists and isn't already the
 * featured window — DASH-10.1 (2026-07-16). Abhijit is a fixed ~48-minute
 * slot around solar noon, always auspicious regardless of the native's
 * chart, so it's worth a secondary mention even on days where a personal
 * hora window rightly wins the hero's headline pick.
 */
export function findSecondaryAbhijitWindow(
  windows: DailyGuidanceWindow[] | undefined,
  featured: DailyGuidanceWindow | null,
): DailyGuidanceWindow | null {
  if (!windows || windows.length === 0) return null;
  const abhijit = windows.find((w) => w.type === "ABHIJIT");
  if (!abhijit || abhijit === featured) return null;
  return abhijit;
}

/* ────────────────────────────────────────────────────────────────────────────
   T8 / A-013 — one recommended window, not four competing systems.

   Today used to show Nalla Neram, Gowri, Abhijit and Horai at the same weight
   as Rahu Kalam / Yamagandam / Kuligai. A reader who knows only Rahu Kalam
   cannot tell which of them to obey, and may act on the wrong one.

   OWNER RULING (2026-08-23), which supersedes DASH-10.1's precedence for the
   featured window:

     1. The promoted window is the one in the best GOWRI KALA — the almanac's
        own ranking, Amirtham > Uthi > Labham > Dhanam > Sugam, earliest first
        on a tie. Not the personal hora. DASH-10.1's argument (a personal
        window varies day to day and is more actionable) still holds for the
        hora itself, which is why the hora is named on the card and kept in
        "Other traditional timings" — it just no longer decides which window
        the reader is told to use.

     2. A window that overlaps Rahu Kalam, Yamagandam or Kuligai is never
        promoted. Fall through the ranking to the next clean one. The reader is
        never told to act during an avoid-kala, whatever its Gowri kala says.

   Ranking `bestWindows` rather than the raw Gowri table is deliberate: since
   the backend made each best window the intersection of the hora grid and the
   Gowri kala grid, every window already carries the `kala` it sits in. Picking
   from them applies the ruling without inventing a second, parallel notion of
   "the good window" that could disagree with the one the rest of the tab
   explains.

   `bestWindowConflicts` deliberately excludes Rahu/Yama/Kuligai clashes (see
   the type's docstring — the hero's Avoid card owns those), so nothing before
   this checked them against the window being recommended.
   ──────────────────────────────────────────────────────────────────────────── */

/** Gowri rank of a kala name; unknown/absent sorts last. Mirrors
 *  `gowriCategoryRank` in lib/gowri.ts, which reads the same five-name table
 *  the backend's `GOWRI_GOOD_RANK` defines. */
const GOWRI_RANK: Record<string, number> = {
  AMIRTHAM: 1, UTHI: 2, LABHAM: 3, DHANAM: 4, SUGAM: 5,
};

function kalaRank(kala: string | null | undefined): number {
  return GOWRI_RANK[(kala ?? "").toUpperCase()] ?? 999;
}

function hmToMinutes(hm: string): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(hm.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export interface TimingSpan {
  start: string;
  end: string;
}

/** Half-open overlap on wall-clock minutes. Touching edges (10:30 end vs 10:30
 *  start) do not overlap — a window that begins the moment Rahu Kalam ends is
 *  clean, which is how the almanac reads it. */
export function spansOverlap(a: TimingSpan, b: TimingSpan): boolean {
  const aStart = hmToMinutes(a.start);
  const aEnd = hmToMinutes(a.end);
  const bStart = hmToMinutes(b.start);
  const bEnd = hmToMinutes(b.end);
  if (aStart === null || aEnd === null || bStart === null || bEnd === null) return false;
  return aStart < bEnd && bStart < aEnd;
}

export interface RecommendedWindow {
  window: DailyGuidanceWindow;
  /** Gowri rank of the promoted window (1 = Amirtham, 999 = unnamed). */
  rank: number;
  /** Better-ranked windows passed over because they ran into an avoid-kala. */
  skippedForCollision: number;
  /** True only in the degraded case: EVERY candidate collided, so the reader is
   *  shown the best of a bad set and told so, rather than shown nothing. */
  collidesWithAvoid: boolean;
  /** The window has already ended (today only) — nothing clean is left. */
  hasPassed: boolean;
}

export function pickRecommendedWindow(
  windows: DailyGuidanceWindow[] | undefined,
  avoid: readonly TimingSpan[],
  options: { now: Date; isToday: boolean; dateLocal: string; timeZone?: string | null },
): RecommendedWindow | null {
  if (!windows || windows.length === 0) return null;
  const { now, isToday, dateLocal, timeZone } = options;

  const ranked = [...windows].sort((a, b) => {
    const rankDelta = kalaRank(a.kala) - kalaRank(b.kala);
    if (rankDelta !== 0) return rankDelta;
    return (hmToMinutes(a.start) ?? 0) - (hmToMinutes(b.start) ?? 0);
  });

  const collides = (w: DailyGuidanceWindow) => avoid.some((span) => spansOverlap(w, span));
  const clean = ranked.filter((w) => !collides(w));

  const hasEnded = (w: DailyGuidanceWindow) => {
    if (!isToday) return false;
    const endMs = timeOnDateToMs(dateLocal, w.end, timeZone);
    return endMs !== null && endMs < now.getTime();
  };

  // Nothing clean anywhere in the day: promote the best-ranked window and let
  // the caller say plainly that it runs into an avoid period. Silence here
  // would be worse — the reader would simply see no recommendation at all on a
  // day that has one, just a compromised one.
  const pool = clean.length > 0 ? clean : ranked;
  const chosen = (isToday ? pool.find((w) => !hasEnded(w)) : undefined) ?? pool[0];
  if (!chosen) return null;

  const chosenRank = kalaRank(chosen.kala);
  return {
    window: chosen,
    rank: chosenRank,
    skippedForCollision: ranked.filter((w) => kalaRank(w.kala) < chosenRank && collides(w)).length,
    collidesWithAvoid: clean.length === 0,
    hasPassed: hasEnded(chosen),
  };
}
