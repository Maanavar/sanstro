import { getApiClient } from "./client";

/**
 * "Your Chart in One Minute" — docs/ONE_MINUTE_READING_2026-08-04.md.
 *
 * Route verified against the backend decorator before wiring:
 * `@router.get("/charts/{chart_id}/one-minute")` in app/api/charts.py — path
 * param (not query), GET, optional `asOf` query alias. Two wrappers in this
 * package have silently drifted from their routes in the past, so the check is
 * part of adding one.
 */

export interface OneMinuteText {
  ta: string;
  en: string;
}

/**
 * `basis` is the astrological ground for the beat and the ONLY field on this
 * surface allowed to carry technical vocabulary — the body text never does.
 * Render it behind a disclosure, never inline.
 */
export interface OneMinuteBeat {
  id: string;
  text: OneMinuteText;
  basis: OneMinuteText | null;
}

export interface OneMinuteQuestionOption {
  value: string;
  label: OneMinuteText;
}

/**
 * Raised when a beat has been WITHHELD because it turns on a fact we have never
 * asked for — an adult whose `maritalStatus` is null. Answering PATCHes the
 * birth profile, so it improves every other surface too.
 *
 * `beforeBeat` is the id of the beat this question renders above: it stands in
 * the gap the withheld beat left, and the backend owns the beat order, so the
 * anchor is sent rather than guessed. Render every option — the set covers
 * married/single/divorced/widowed, and a reader who is given fewer has to
 * misdescribe themselves to dismiss the question.
 */
export interface OneMinutePendingQuestion {
  field: string;
  prompt: OneMinuteText;
  options: OneMinuteQuestionOption[];
  beforeBeat: string;
}

/** The span the reading is stable for; it moves at the antardasha boundary, never daily. */
export interface OneMinuteReadingWindow {
  from: string;
  to: string;
}

export interface OneMinuteReadingData {
  chartId: string;
  /** Answer `pendingQuestion` against PATCH /birth-profiles/{birthProfileId}. */
  birthProfileId: string;
  displayName: string;
  asOf: string;
  readingWindow: OneMinuteReadingWindow;
  age: number;
  stage: string;
  ageBand: OneMinuteText;
  focusTopic: string;
  /** "self" | "parent" — a minor's reading is addressed to the parent. */
  addressedTo: string;
  beats: OneMinuteBeat[];
  pendingQuestion: OneMinutePendingQuestion | null;
  wordCount: { ta: number; en: number };
  nextStep: { label: OneMinuteText; href: string };
}

export function getOneMinuteReading(
  chartId: string,
  options?: { asOf?: string },
): Promise<{ success: boolean; data: OneMinuteReadingData }> {
  const query = options?.asOf ? `?asOf=${encodeURIComponent(options.asOf)}` : "";
  return getApiClient().get(`/charts/${chartId}/one-minute${query}`) as Promise<{
    success: boolean;
    data: OneMinuteReadingData;
  }>;
}
