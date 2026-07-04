import { moonHouseImpact } from "@vinaadi/shared/api/transits";

export type PeyarchiTone = "supportive" | "neutral" | "caution";

const TONE_BY_IMPACT: Record<ReturnType<typeof moonHouseImpact>, PeyarchiTone> = {
  good: "supportive",
  neutral: "neutral",
  challenging: "caution",
};

// Thin vocabulary adapter over the shared gochara classifier — the house
// tables live in packages/shared/src/api/transits.ts so web and mobile can
// never disagree on a transit's tone.
export function classifyPeyarchiToneFromMoon(planet: string, houseFromMoon: number): PeyarchiTone {
  return TONE_BY_IMPACT[moonHouseImpact(planet, houseFromMoon)];
}
