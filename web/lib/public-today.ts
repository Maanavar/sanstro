/**
 * The logged-out visitor's "today" model.
 *
 * The dashboard's Today hero decides one thing for the reader — one promoted
 * window, chosen by the almanac's own Gowri ranking and never overlapping Rahu
 * Kalam / Yamagandam (owner ruling 2026-08-23, narrowed by R7, documented on
 * `pickRecommendedWindow` in today-windows.ts). The marketing hero showed a
 * hardcoded `bestWindow: { start: "11:53", end: "12:41" }` instead, on a page
 * whose own trust proof reads "Method, not marketing".
 *
 * This module applies the *same ruling* to the data a guest can actually have.
 * The dashboard ranks `bestWindows` (hora ∩ Gowri intersections, personal to a
 * chart); a guest has no chart, so we rank the Gowri grid itself — which is the
 * layer those intersections were cut from, so the two surfaces cannot recommend
 * windows that disagree about which kala is best.
 *
 * Deliberately a leaf module: no React, no dashboard imports. `spansOverlap`
 * and `clearSegments` are reused from today-windows.ts rather than re-derived,
 * because a second copy of the overlap rule is how the two surfaces would drift.
 */

import { spansOverlap, type TimingSpan } from "@/lib/today-windows";
import { gowriCategoryRank } from "@/lib/gowri";
import { timeOnDateToMs } from "@/lib/tz";
import type { Lang } from "@/lib/i18n";
import type { PanchangamDailyResponseData } from "@/lib/types";

type Kalam = PanchangamDailyResponseData["kalam"];
export type GuestSlot = Kalam["nallaNeram"][number];

/** Chennai. The public panchangam endpoint requires a location and a guest has
 *  not given us one, so every time on this surface is a Chennai time and the UI
 *  must say so — an unlabelled Rahu Kalam is wrong for a reader in Coimbatore by
 *  several minutes and wrong for one in Toronto by hours. */
export const GUEST_LOCATION = { lat: 13.0827, lng: 80.2707, tz: "Asia/Kolkata", labelEn: "Chennai", labelTa: "சென்னை" } as const;

/* ── avoid axis ─────────────────────────────────────────────────────────── */

export interface AvoidPeriod extends TimingSpan {
  key: "rahuKalam" | "yamagandam";
}

/** The kalas a promoted window may never overlap, in the order a Tamil almanac
 *  prints them. Rahu Kalam leads because it is the one a reader who knows only
 *  one of them knows.
 *
 *  Kuligai was a third entry here until owner ruling R7 (2026-09-22). It is not
 *  an avoid period: what is begun in Kuligai tends to recur, and whether that
 *  is wanted is the activity's question. A guest supplies no activity at all,
 *  so this surface can assert neither polarity — see `kuligaiPeriod`. */
export function avoidPeriods(kalam: Kalam | null | undefined): AvoidPeriod[] {
  if (!kalam) return [];
  return ([
    ["rahuKalam", kalam.rahuKalam],
    ["yamagandam", kalam.yamagandam],
  ] as const)
    .filter(([, slot]) => slot?.start && slot?.end)
    .map(([key, slot]) => ({ key, start: slot.start, end: slot.end }));
}

/** Kuligai as its own conditional period (R7.7): never folded into the avoid
 *  list, never folded into the recommended one. */
export function kuligaiPeriod(kalam: Kalam | null | undefined): TimingSpan | null {
  const slot = kalam?.kuligai;
  return slot?.start && slot?.end ? { start: slot.start, end: slot.end } : null;
}

/**
 * Which avoid period the hero puts beside the recommendation.
 *
 * The dashboard shows `cautionWindows[0] ?? rahuKalam`; a guest has no caution
 * windows, so this ranks the kalas the same way the promoted window is
 * ranked — the next one that has not ended yet, so the safety axis stays as
 * actionable as the opportunity axis as the day advances. Left un-ranked, the
 * card sat on a Rahu Kalam that finished at noon while Yamagandam was still
 * three hours ahead and unmentioned.
 *
 * Rahu Kalam is the fallback once both are spent: it is the one a reader who
 * knows only one of them knows, so "over for today" is more legible against
 * that name. Kuligai is not a candidate here at all (R7).
 */
export function pickAvoidPeriod(
  kalam: Kalam | null | undefined,
  options: { now: Date; dateLocal: string; timeZone?: string | null },
): AvoidPeriod | null {
  const periods = avoidPeriods(kalam);
  if (periods.length === 0) return null;
  const { now, dateLocal, timeZone } = options;
  const upcoming = periods
    .filter((p) => {
      const endMs = timeOnDateToMs(dateLocal, p.end, timeZone);
      return endMs === null || endMs >= now.getTime();
    })
    .sort((a, b) => {
      const aStart = timeOnDateToMs(dateLocal, a.start, timeZone) ?? 0;
      const bStart = timeOnDateToMs(dateLocal, b.start, timeZone) ?? 0;
      return aStart - bStart;
    });
  return upcoming[0] ?? periods.find((p) => p.key === "rahuKalam") ?? periods[0];
}

/* ── live phase ─────────────────────────────────────────────────────────── */

export type SpanPhase = "before" | "during" | "after";

export interface SpanState {
  phase: SpanPhase | null;
  /** ms until the span starts (`before`) or ends (`during`); null otherwise. */
  remainingMs: number | null;
}

/**
 * Where `now` stands relative to a wall-clock span on `dateLocal`, resolved in
 * the panchangam's zone rather than the browser's.
 *
 * The zone matters more here than on the dashboard, not less: a marketing page
 * is read from anywhere, and a Chennai Rahu Kalam compared against a London
 * clock would tell a visitor they are inside a window that ended five hours
 * ago. Same reason the dashboard's `spanPhase` takes a timezone (DASH-01).
 */
export function spanState(
  span: TimingSpan | null | undefined,
  options: { now: Date; dateLocal: string; timeZone?: string | null },
): SpanState {
  if (!span?.start || !span?.end) return { phase: null, remainingMs: null };
  const { now, dateLocal, timeZone } = options;
  const startMs = timeOnDateToMs(dateLocal, span.start, timeZone);
  const endMs = timeOnDateToMs(dateLocal, span.end, timeZone);
  if (startMs === null || endMs === null) return { phase: null, remainingMs: null };
  const nowMs = now.getTime();
  if (nowMs < startMs) return { phase: "before", remainingMs: startMs - nowMs };
  if (nowMs <= endMs) return { phase: "during", remainingMs: endMs - nowMs };
  return { phase: "after", remainingMs: null };
}

/** "18m" / "1h 5m" / Tamil equivalents. Mirrors the dashboard hero's private
 *  `formatDuration` — same rounding, same shape, so the two heroes never
 *  disagree about how long is left in the same window. */
export function formatCountdown(ms: number, lang: Lang): string {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return lang === "ta" ? `${m} நிமிடம்` : `${m}m`;
  if (m <= 0) return lang === "ta" ? `${h} மணி` : `${h}h`;
  return lang === "ta" ? `${h}மணி ${m}நிமிடம்` : `${h}h ${m}m`;
}

/* ── the promoted window ────────────────────────────────────────────────── */

export interface GuestRecommendation {
  slot: GuestSlot;
  /** True when the pick came from the NIGHT half — every daytime window has
   *  already passed, so the card must say "tonight" rather than implying the
   *  reader can still act on it this afternoon. */
  isNight: boolean;
  /** Better-ranked daytime windows passed over because they ran into a kala. */
  skippedForCollision: number;
  /** The degraded case: nothing clean anywhere, so the reader is shown the best
   *  of a bad set and told so. Silence would leave the hero blank on a day that
   *  does have a recommendation, just a compromised one. */
  collidesWithAvoid: boolean;
  /** Every candidate has already ended (and no night fallback existed). */
  hasPassed: boolean;
}

function startMinutes(slot: TimingSpan): number {
  const match = /^(\d{1,2}):(\d{2})/.exec(slot.start.trim());
  return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
}

/**
 * The one window the hero promotes, under the dashboard's ruling.
 *
 * 1. Rank the day's auspicious Gowri kalas — Amirtham > Uthi > Labham > Dhanam
 *    > Sugam, earlier start breaking a tie.
 * 2. Drop any that overlap Rahu Kalam or Yamagandam. The reader is never told
 *    to act inside an avoid-kala, whatever its Gowri kala says. Kuligai is not
 *    one of them (R7) — it neither disqualifies a window nor endorses one.
 * 3. Prefer the first that has not already ended, so the hero stays actionable
 *    as the day advances instead of pointing at 7am at 4pm.
 *
 * Daytime only. A landing page that promotes 01:40 as "your best window today"
 * is worse than one that admits the day is spent — so when every daytime
 * candidate has passed we fall through to the NIGHT entry of `gowriNallaNeram`,
 * which the backend already picks as *earliest* clear-good rather than
 * best-ranked precisely so it lands in the evening a reader can still use
 * (see `_compute_gowri_nalla_neram`).
 */
export function pickGuestWindow(
  kalam: Kalam | null | undefined,
  options: { now: Date; dateLocal: string; timeZone?: string | null },
): GuestRecommendation | null {
  if (!kalam) return null;
  const avoid = avoidPeriods(kalam);
  const { now, dateLocal, timeZone } = options;

  // `gowriPanchangam` is the full 8-part grid and the richest candidate set.
  // It is optional on the type (older cached responses predate it), so fall
  // back to the two-window Nalla Neram summary, which the backend has already
  // filtered clear of the kalas.
  const grid = (kalam.gowriPanchangam ?? []).filter((s) => s?.start && s?.end);
  const daytime = grid.length > 0
    ? grid.filter((s) => s.isGood && s.period === "DAY")
    : (kalam.nallaNeram ?? []).filter((s) => s?.start && s?.end);

  const hasEnded = (slot: TimingSpan): boolean => {
    const endMs = timeOnDateToMs(dateLocal, slot.end, timeZone);
    return endMs !== null && endMs < now.getTime();
  };

  if (daytime.length > 0) {
    const ranked = [...daytime].sort((a, b) => {
      const rankDelta = gowriCategoryRank(a.name) - gowriCategoryRank(b.name);
      return rankDelta !== 0 ? rankDelta : startMinutes(a) - startMinutes(b);
    });
    const collides = (slot: GuestSlot) => avoid.some((span) => spansOverlap(slot, span));
    const clean = ranked.filter((slot) => !collides(slot));
    const pool = clean.length > 0 ? clean : ranked;
    const upcoming = pool.find((slot) => !hasEnded(slot));

    if (upcoming) {
      const chosenRank = gowriCategoryRank(upcoming.name);
      return {
        slot: upcoming,
        isNight: false,
        skippedForCollision: ranked.filter((s) => gowriCategoryRank(s.name) < chosenRank && collides(s)).length,
        collidesWithAvoid: clean.length === 0,
        hasPassed: false,
      };
    }

    // Every daytime window is spent. Try tonight before admitting it.
    const night = (kalam.gowriNallaNeram ?? []).find(
      (s) => s?.start && s?.end && s.period === "NIGHT" && !hasEnded(s),
    );
    if (night) {
      return { slot: night, isNight: true, skippedForCollision: 0, collidesWithAvoid: false, hasPassed: false };
    }

    const last = pool[pool.length - 1];
    return last
      ? { slot: last, isNight: false, skippedForCollision: 0, collidesWithAvoid: clean.length === 0, hasPassed: true }
      : null;
  }

  const night = (kalam.gowriNallaNeram ?? []).find((s) => s?.start && s?.end && !hasEnded(s));
  return night
    ? { slot: night, isNight: night.period === "NIGHT", skippedForCollision: 0, collidesWithAvoid: false, hasPassed: false }
    : null;
}

/* ── festivals ──────────────────────────────────────────────────────────── */

/**
 * The day's headline festival, or null.
 *
 * World observances are excluded for the same reason the dashboard hero
 * excludes them: a UN awareness day is not what a Tamil reader means by "what
 * day is it today", and it would push a real festival out of the one slot the
 * header has. Inlined rather than importing `festivalTags` from
 * dashboard-calendar-shared.tsx — that module is a dashboard *component* file,
 * and pulling it into the marketing bundle for a three-line helper is how the
 * route weights that F7 cut came back.
 */
export function headlineFestival(
  festivals: PanchangamDailyResponseData["festivals"] | null | undefined,
): { name: string } | null {
  return (festivals ?? []).find((f) => {
    const tags = f.tags && f.tags.length > 0 ? f.tags : [f.category];
    return !tags.includes("observance");
  }) ?? null;
}
