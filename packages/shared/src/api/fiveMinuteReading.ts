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
 * SCOPE, RIGHT NOW (updated 2026-08-11): the backend builds this for the
 * "self" register (11 beats) and "client_with_guardian" (6). `parent` and
 * `other` 404, identically to the flag being off, and by design rather than
 * pending work — see spec §0.2.
 *
 * BEAT IDS ARE DELIBERATELY NOT A UNION TYPE HERE, and that is not laziness.
 * The set has changed three times since this wrapper was written — most
 * recently gaining `the_tension`, `window_ahead` and `what_comes_after` in the
 * descent rebuild (spec §8) — and each beat is a self-describing
 * `{id, text, basis}` that a client renders generically. A union would turn
 * every backend beat addition into a breaking change across three packages for
 * a value no consumer switches on exhaustively. `web/components/
 * dashboard-five-minute-reading.tsx` keys on exactly three ids (`who_you_are`,
 * `what_this_rests_on`, `one_thing`) for chrome, and falls through for the
 * rest — which is the pattern to follow.
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
