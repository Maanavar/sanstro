import { getApiClient } from "./client";

export interface MonthPrediction {
  month: number;
  score: number;
  prediction_ta: string;
  prediction_en: string;
}

export interface HouseSummary {
  bhava: number;
  title_ta: string;
  title_en: string;
  summary_ta: string;
  summary_en: string;
}

export interface VarshaphalaData {
  year: number;
  varsha_lagna: string;
  varsha_lagna_ta: string;
  muntha: string;
  muntha_ta: string;
  varshesh: string;
  varshesh_ta: string;
  monthly: MonthPrediction[];
  houses: HouseSummary[];
}

export function getVarshaphala(
  chartId: string,
  year: number,
): Promise<{ success: boolean; data: VarshaphalaData }> {
  return getApiClient().get(
    `/charts/${chartId}/varshaphala`,
    { year },
  ) as Promise<{ success: boolean; data: VarshaphalaData }>;
}