export type ScoreTone = "high" | "mid" | "low";

/** Canonical thresholds agreed across web and mobile. */
export const SCORE_THRESHOLDS = { HIGH: 65, MID: 45 } as const;

/** Returns the tone label for a 0-100 score. */
export function scoreTone(score: number): ScoreTone {
  if (score >= SCORE_THRESHOLDS.HIGH) return "high";
  if (score >= SCORE_THRESHOLDS.MID) return "mid";
  return "low";
}

/** Returns the tone label for a 0-1 percentage. */
export function scoreTonePct(pct: number): ScoreTone {
  return scoreTone(pct * 100);
}
