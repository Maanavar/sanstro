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

/**
 * A porutham result's tone, from the server's band label, never from the raw
 * score. Since KI-01 the server labels a Rajju or Vedha failure CAUTION, even
 * at 8/10 or more (604 of 11,664 star/pada pairings), so a client that reads
 * `totalScore` alone celebrates a match the server has vetoed (AAU-06).
 */
export function poruthamTone(label: string | null | undefined): ScoreTone {
  if (label === "EXCELLENT" || label === "GOOD") return "high";
  if (label === "AVERAGE") return "mid";
  return "low";
}
