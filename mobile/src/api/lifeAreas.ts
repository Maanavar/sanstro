import { apiGet } from "./client";

export interface BiText {
  ta: string;
  en: string;
}

export interface LifeAreaData {
  area: string;
  label: BiText;
  score: number;
  trend: string;
  confidence: string;
  dashaActivation: boolean;
  transitSupport: number;
  narrative: BiText;
  remedy: BiText;
  next30DayOutlook: BiText;
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
  date: string
): Promise<{ success: boolean; data: LifeAreasData }> {
  return apiGet(`/charts/${encodeURIComponent(chartId)}/life-areas?date=${date}`);
}
