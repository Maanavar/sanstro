export {
  todayIso,
  addDays,
  formatDateLabel,
  formatClockLabel,
  formatDateTimeLabel,
} from "@vinaadi/shared/utils/format";

export interface ScoreBand {
  label: string;
  tone: "high" | "mid" | "low" | "rest";
}

export const SCORE_HIGH = "var(--color-score-high, #5C7654)";
export const SCORE_MID = "var(--color-score-mid, #B85A2C)";
export const SCORE_LOW = "var(--color-score-low, #A8482F)";

/** Color for a 0–100 daily score. */
export function scoreColor(score: number): string {
  if (score >= 65) return SCORE_HIGH;
  if (score >= 45) return SCORE_MID;
  return SCORE_LOW;
}

/** Color for a 0–1 compatibility/porutham percentage. */
export function scoreColorPct(pct: number): string {
  if (pct >= 0.7) return SCORE_HIGH;
  if (pct >= 0.4) return SCORE_MID;
  return SCORE_LOW;
}

export function getScoreBand(score: number): ScoreBand {
  if (score >= 80) return { label: "strong day", tone: "high" };
  if (score >= 65) return { label: "supportive", tone: "high" };
  if (score >= 50) return { label: "steady", tone: "mid" };
  if (score >= 35) return { label: "soft caution", tone: "low" };
  return { label: "restorative", tone: "rest" };
}
