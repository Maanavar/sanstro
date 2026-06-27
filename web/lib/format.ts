export {
  todayIso,
  addDays,
  formatDateLabel,
  formatClockLabel,
  formatDateTimeLabel,
} from "@vinaadi/shared/utils/format";
import { scoreTone, scoreTonePct } from "@vinaadi/shared/utils/score";

export interface ScoreBand {
  label: string;
  tone: "high" | "mid" | "low";
}

export const SCORE_HIGH = "var(--color-score-high, #5C7654)";
export const SCORE_MID = "var(--color-score-mid, #B85A2C)";
export const SCORE_LOW = "var(--color-score-low, #A8482F)";

/** Color for a 0–100 daily score. */
export function scoreColor(score: number): string {
  const tone = scoreTone(score);
  if (tone === "high") return SCORE_HIGH;
  if (tone === "mid") return SCORE_MID;
  return SCORE_LOW;
}

/** Color for a 0–1 compatibility/porutham percentage. */
export function scoreColorPct(pct: number): string {
  const tone = scoreTonePct(pct);
  if (tone === "high") return SCORE_HIGH;
  if (tone === "mid") return SCORE_MID;
  return SCORE_LOW;
}

export function getScoreBand(score: number): ScoreBand {
  if (score >= 80) return { label: "strong day", tone: "high" };
  const tone = scoreTone(score);
  if (tone === "high") return { label: "supportive", tone };
  if (tone === "mid") return { label: "steady", tone };
  if (score >= 35) return { label: "soft caution", tone };
  return { label: "restorative", tone };
}