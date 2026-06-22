import { C } from "@/theme/colors";

export function scoreTone(score: number): string {
  if (score >= 75) return C.green;
  if (score >= 55) return C.gold;
  return C.caution;
}
