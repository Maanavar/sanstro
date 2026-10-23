import { getApiClient } from "./client";
import type { BiText } from "../types";

export interface LifeAreaData {
  area: string;
  label: BiText;
  score: number;
  trend: string;
  /** Forward-projected scores at +6 / +12 months (see full type in types/index.ts). */
  score6mo?: number;
  score12mo?: number;
  /** Engine's life-stage gate (single source of truth). False when the area is
   *  skipped for the native's current phase. Optional for older cached payloads
   *  (treat absent as relevant). */
  ageRelevant?: boolean;
  confidence: string;
  dashaActivation: boolean;
  transitSupport: number;
  narrative: BiText;
  remedy: BiText;
  next30DayOutlook: BiText;
  /** See the full type in types/index.ts (owner rulings 2026-10-01). Absent on
   *  cached payloads and whenever the area claims no score. */
  remedyKind?: "REMEDY" | "MAINTAIN" | null;
  scoreBand?: "EXCEPTIONAL" | "STRONG" | "GOOD" | "MIXED" | "DIFFICULT" | "VERY_WEAK" | null;
  scoreBandText?: BiText | null;
}

export interface LifeAreasData {
  chartId: string;
  dateLocal: string;
  areas: LifeAreaData[];
}

export const lifeAreasKeys = {
  areas: (chartId: string, date: string) => ["life-areas", chartId, date] as const,
};

export function getLifeAreas(
  chartId: string,
  date: string,
): Promise<{ success: boolean; data: LifeAreasData }> {
  // The route reads `asOf` (app/api/life_areas.py). This sent `date`, which the
  // backend ignored, so it fell back to the server's own date.today() — UTC in
  // the API image, i.e. yesterday for an Indian reader from 00:00 to 05:30.
  return getApiClient().get(
    `/charts/${encodeURIComponent(chartId)}/life-areas`,
    { asOf: date },
  ) as Promise<{ success: boolean; data: LifeAreasData }>;
}