import { getApiClient } from "./client";
import { todayIso } from "../utils/format";

export interface TransitItem {
  alertId: string;
  planet: string;
  fromRasi: string;
  toRasi: string;
  peyarchiDateUTC: string;
  peyarchiDateLocal: string;
  daysFromToday: number;
  impactFromMoon: number;
  impactFromLagna: number;
  saniCycleAfter: string | null;
  labelTa: string;
  labelEn: string;
}

// ── Guru / Sani gochara from the Janma Rasi (astrologer rulings D2/D3, 2026-10-04) ──
//
// Two layers, kept apart on purpose:
//
// CLASSICAL — Phaladeepika ch. 26 (Brihat Samhita agrees on Guru). Guru favours
// 2/5/7/9/11 and is non-supportive everywhere else; Sani favours only 3/6/11
// and every other house needs care (the detailed verses name difficulties in
// the 5th, 7th, 9th and 10th too, not only the Sade Sati / Ashtama houses).
//
// VINAADI GRADING — a presentation layer over the classical one, NOT a classical
// verse. Guru in 1/3/4/10 reads "Mixed" rather than adverse so the surface does
// not use catastrophic wording; 6/8/12 need care. Sani has no "mixed" band:
// D2 rules that all non-3/6/11 houses need some degree of care.
//
// The named Saturn periods (Ezharai 12/1/2, Ardhashtama 4, Ashtama 8) are a
// SEPARATE axis — a named alert, not this grade. 7th and 10th need care because
// of the gochara table, not because they belong to a named cycle.
//
// This replaces the earlier rule that softened Sani in 12/1/2/5/7/10 to
// "neutral" and graded Guru in 3/4 as challenging; both contradicted D2/D3.
export const GURU_SUPPORTIVE_FROM_MOON: readonly number[] = [2, 5, 7, 9, 11];
export const GURU_NON_SUPPORTIVE_FROM_MOON: readonly number[] = [1, 3, 4, 6, 8, 10, 12];
export const SANI_SUPPORTIVE_FROM_MOON: readonly number[] = [3, 6, 11];
export const SANI_NEEDS_CARE_FROM_MOON: readonly number[] = [1, 2, 4, 5, 7, 8, 9, 10, 12];

/** Named Saturn periods — alerts in their own right, not the gochara grade. */
export const SADE_SATI_FROM_MOON: readonly number[] = [12, 1, 2];
export const ARDHASHTAMA_SANI_FROM_MOON: readonly number[] = [4];
export const ASHTAMA_SANI_FROM_MOON: readonly number[] = [8];

export type GocharaGrade = "SUPPORTIVE" | "MIXED" | "NEEDS_CARE";

/** Vinaadi's grade for Guru/Sani by house from the Janma Rasi. Null for any
 *  other planet: Rahu/Ketu have no astrologer-approved gochara table yet. */
export function gocharaGrade(planet: string, houseFromMoon: number): GocharaGrade | null {
  const key = planet === "GURU" ? "JUPITER" : planet === "SANI" ? "SATURN" : planet;
  if (key === "JUPITER") {
    if (GURU_SUPPORTIVE_FROM_MOON.includes(houseFromMoon)) return "SUPPORTIVE";
    if ([6, 8, 12].includes(houseFromMoon)) return "NEEDS_CARE";
    return "MIXED";
  }
  if (key === "SATURN") {
    return SANI_SUPPORTIVE_FROM_MOON.includes(houseFromMoon) ? "SUPPORTIVE" : "NEEDS_CARE";
  }
  return null;
}

// The older three-word vocabulary mobile renders. Derived from the grade so
// the two can never disagree; a non-graded planet stays neutral.
export function moonHouseImpact(planet: string, house: number): "good" | "neutral" | "challenging" {
  const grade = gocharaGrade(planet, house);
  if (grade === "SUPPORTIVE") return "good";
  if (grade === "NEEDS_CARE") return "challenging";
  return "neutral";
}

export const transitsKeys = {
  upcoming: (chartId: string) => ["transits-upcoming", chartId] as const,
};

export function getUpcomingTransits(
  chartId: string,
  windowDays = 30,
): Promise<{ success: boolean; data: TransitItem[]; meta: unknown }> {
  const asOf = todayIso();
  return getApiClient().get(`/charts/${chartId}/peyarchi/upcoming`, {
    as_of: asOf,
    window_days: windowDays,
  }) as Promise<{
    success: boolean;
    data: TransitItem[];
    meta: unknown;
  }>;
}
