import { getApiClient } from "./client";
import type { OneMinuteBeat, OneMinutePendingQuestion, OneMinuteText } from "./oneMinuteReading";

/**
 * "Your Chart in Five Minutes" — docs/FIVE_MINUTE_READING_SPEC_2026-08-11.md.
 *
 * Route verified against the backend decorator before wiring:
 * `@router.get("/charts/{chart_id}/five-minute")` in app/api/charts.py — path
 * param (not query), GET, optional `asOf` query alias, same shape as
 * `getOneMinuteReading`. Two wrappers in this package have silently drifted
 * from their routes in the past, so the check is part of adding one.
 *
 * SCOPE, RIGHT NOW: the backend only builds this for the "self" register and
 * only renders 4 of the eventual 8 beats (ids: who_you_are, what_this_rests_on,
 * core_nature, one_thing). Every other `addressedTo` value 404s, identically
 * to the flag being off. No web/mobile UI consumes this yet — this wrapper
 * exists per CLAUDE.md's forward policy (a new backend endpoint gets a typed
 * wrapper here before anything calls it), not because a screen is shipping.
 */

export interface FiveMinuteReadingData {
  chartId: string;
  birthProfileId: string;
  displayName: string;
  asOf: string;
  readingWindow: { from: string; to: string };
  age: number;
  stage: string;
  ageBand: OneMinuteText;
  focusTopic: string;
  /** Only "self" is ever returned today — see module doc comment. */
  addressedTo: string;
  beats: OneMinuteBeat[];
  pendingQuestion: OneMinutePendingQuestion | null;
  wordCount: { ta: number; en: number };
  nextStep: { label: OneMinuteText; href: string };
}

export function getFiveMinuteReading(
  chartId: string,
  options?: { asOf?: string },
): Promise<{ success: boolean; data: FiveMinuteReadingData }> {
  const query = options?.asOf ? `?asOf=${encodeURIComponent(options.asOf)}` : "";
  return getApiClient().get(`/charts/${chartId}/five-minute${query}`) as Promise<{
    success: boolean;
    data: FiveMinuteReadingData;
  }>;
}
