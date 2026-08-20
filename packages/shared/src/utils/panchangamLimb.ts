import type { PanchangamLimbSpan } from "../types";

// `activeLimb` in dashboard-calendar-shared knows about one transition — the sunrise value and the one
// after it — because that is all the wire used to carry. Karana has three spans
// on most days (it averages 11.79 h against a ~24 h solar day), so the third was
// simply unrepresentable. `limbNow` reads the full span list the backend now
// ships and falls back to `activeLimb` when it is absent.
//
// It also returns `sunriseName` alongside `activeName`, because the two answer
// different questions and both are wanted on screen: the sunrise (உதய) value is
// what the almanac *calls* the day and what the calendar grid shows, while the
// active value is what is running right now. Today (2026-08-19) that is Swathi
// for fifteen minutes and Visakam for the remaining 96.8%, and a surface that
// prints only the first is the defect this exists to fix.
export interface LimbNow {
  /** The value in effect at `nowIso` — or the sunrise value when not viewing today. */
  activeName: string;
  /** End of the active stretch, "HH:MM". Null when it runs to the end of the day. */
  until: string | null;
  untilIso: string | null;
  /** What follows the active stretch, if anything. */
  upcomingName: string | null;
  /** True when the active value is no longer the one the day is named for. */
  rolledOver: boolean;
  /** The உதய value — what the calendar grid and the almanac call this day. */
  sunriseName: string;
}

export function limbNow(
  limb: {
    name: string;
    endsAt: string;
    endsAtIso: string;
    nextName: string;
    spans?: PanchangamLimbSpan[];
  },
  options: { isToday: boolean; nowIso?: string },
): LimbNow {
  const spans = limb.spans ?? [];
  const sunriseName = limb.name;

  // Not today: nothing to promote to. Show the day as the almanac names it,
  // with the boundary so the reader can still see the day splits.
  if (!options.isToday) {
    const first = spans[0];
    return {
      activeName: sunriseName,
      until: first ? first.endsAt : limb.endsAt,
      untilIso: first ? first.endsAtIso : limb.endsAtIso,
      upcomingName: spans.length > 1 ? spans[1].name : limb.nextName,
      rolledOver: false,
      sunriseName,
    };
  }

  // No spans: a response from before backend v43. Fall back to the single
  // transition the old wire carried — the same rule `activeLimb` applies,
  // compared on exact instants rather than clock strings (a boundary routinely
  // lands on the next calendar day, and a clock-only compare reads that as
  // "later today" — the trap the tithi-rollover fix already hit once).
  if (spans.length === 0) {
    const endInstant = new Date(limb.endsAtIso).getTime();
    const nowInstant = options.nowIso ? new Date(options.nowIso).getTime() : Date.now();
    if (!Number.isNaN(endInstant) && !Number.isNaN(nowInstant) && nowInstant > endInstant) {
      return { activeName: limb.nextName, until: null, untilIso: null, upcomingName: null, rolledOver: true, sunriseName };
    }
    return { activeName: sunriseName, until: limb.endsAt, untilIso: limb.endsAtIso, upcomingName: limb.nextName, rolledOver: false, sunriseName };
  }

  const now = options.nowIso ? new Date(options.nowIso).getTime() : Date.now();
  if (Number.isNaN(now)) {
    return { activeName: sunriseName, until: limb.endsAt, untilIso: limb.endsAtIso, upcomingName: limb.nextName, rolledOver: false, sunriseName };
  }

  // Clamp rather than return nothing: before sunrise the first span is the
  // honest answer, after the last boundary the last one is.
  let index = spans.findIndex((span) => now < new Date(span.endsAtIso).getTime());
  if (index < 0) index = spans.length - 1;

  const active = spans[index];
  const next = spans[index + 1];
  return {
    activeName: active.name,
    until: next ? active.endsAt : null,
    untilIso: next ? active.endsAtIso : null,
    upcomingName: next ? next.name : null,
    rolledOver: index > 0,
    sunriseName,
  };
}
