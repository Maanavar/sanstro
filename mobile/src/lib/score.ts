import { scoreTone as getScoreTone } from "@vinaadi/shared/utils/score";
import { C } from "@/theme/colors";

const TONE_COLOR = {
  high: C.green,
  mid: C.gold,
  low: C.caution,
} as const;

/** Returns the theme color string for a 0–100 score. */
export function scoreFillColor(score: number): string {
  return TONE_COLOR[getScoreTone(score)];
}