/**
 * Life focus, Phase 2 (docs/LIFE_FOCUS_PLAN_2026-09-22.md §3): how the Today
 * tab and the Life areas tab respond to the reader's focus.
 *
 * Everything here reorders. Nothing here reads or writes a score, a verdict or
 * a window (D2): two readers with the same chart and different focuses see the
 * same numbers in a different order. `pinFirst` is the only reordering
 * primitive, and it returns the very same objects it was given.
 *
 * The focus → area / activities table is the server's (`FOCUS_TABLE` in
 * app/core/life_mode.py), delivered as `focusArea` / `focusActivities` on the
 * life-mode response. It is not re-typed here.
 */

import type { LifeModeStatus } from "./types";

/** The focus as a surface should apply it: already switched off for a chart
 *  that is not the reader's own (D4, owner ruling Q2). */
export type AppliedFocus = {
  /** Life-area code to pin (e.g. "CAREER"), or null. */
  area: string | null;
  /** Activity types to lift on the activity board. */
  activities: readonly string[];
  /** REMEDIES focus: the remedy row moves up, directly under the hero (T5). */
  remediesFirst: boolean;
};

export const NO_FOCUS: AppliedFocus = { area: null, activities: [], remediesFirst: false };

export function appliedFocus(status: LifeModeStatus | null, isOwnChart: boolean): AppliedFocus {
  if (!status || !isOwnChart) return NO_FOCUS;
  return {
    area: status.focusArea ?? null,
    activities: status.focusActivities ?? [],
    remediesFirst: status.mode === "REMEDIES",
  };
}

/** Stable partition, shared with mobile's Today pulse so the two cannot drift. */
export { pinFirst } from "@vinaadi/shared/lifeFocus";

/** Phase 3 pre-select: the focus's first activity, if the form offers it and
 *  the reader has not already used it; otherwise null.
 *
 *  Only the first, never a fall-through to the next: FAMILY's second activity
 *  is child_birth, and opening a form on "Child birth" because the reader
 *  picked "Family" presumes too much. A default only: the caller keeps any
 *  choice the reader has made, and every option stays selectable. */
export function focusPreselect(
  activities: readonly string[],
  offered: readonly string[],
  taken: readonly string[] = [],
): string | null {
  const first = activities[0];
  return first && offered.includes(first) && !taken.includes(first) ? first : null;
}

/** Calendar "Good days" chip (Phase 3): every date the activity-timing engine
 *  ranks among the month's best for a focus activity AND reads as SUPPORTS.
 *  A top-ranked date that only reads CAUTION is the best of a bad set, not a
 *  good day, so it is left unmarked. A failed activity (null) adds nothing. */
export function supportiveFocusDates(
  results: Record<string, { topDates: { dateLocal: string; alignment: string }[] } | null> | undefined,
): Set<string> {
  const dates = new Set<string>();
  for (const timing of Object.values(results ?? {})) {
    for (const day of timing?.topDates ?? []) {
      if (day.alignment === "SUPPORTS") dates.add(day.dateLocal);
    }
  }
  return dates;
}

/** The Today quick link that serves a focus area best (T4), or null.
 *
 *  Relationships goes to porutham. Every other area with activities goes to
 *  "Best days this month", the activity-timing tool that answers "when" for
 *  the focus's own activity types. */
export function focusQuickLinkId(area: string | null): "compatibility" | "activityTiming" | null {
  if (!area) return null;
  return area === "RELATIONSHIPS" ? "compatibility" : "activityTiming";
}
