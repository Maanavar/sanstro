import { pinFirst } from "@vinaadi/shared/lifeFocus";

/**
 * Life focus on mobile Today (docs/LIFE_FOCUS_PLAN_2026-09-22.md, T2): the
 * life-area pulse under the hero puts the reader's focus area first.
 *
 * Pinned BEFORE the cut to `max`, as on web, so a focus area the server ranks
 * sixth still reaches the row. Reorders only (D2): the same objects come back,
 * so no score can change on the way. D4 needs no branch here: Today's chart is
 * the primary chart, which only onboarding's own birth details ever set.
 */
export function todayPulseAreas<T extends { area: string }>(
  areas: readonly T[],
  focusArea: string | null,
  max = 4,
): T[] {
  if (!focusArea) return areas.slice(0, max);
  return pinFirst(areas, (a) => a.area === focusArea).slice(0, max);
}
