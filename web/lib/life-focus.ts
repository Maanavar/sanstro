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

/** Stable partition: matching items first, each group in its original order.
 *  Returns the input objects themselves, never copies. */
export function pinFirst<T>(items: readonly T[], isPinned: (item: T) => boolean): T[] {
  const pinned: T[] = [];
  const rest: T[] = [];
  for (const item of items) (isPinned(item) ? pinned : rest).push(item);
  return [...pinned, ...rest];
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
