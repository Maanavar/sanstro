import { getApiClient } from "./client";

export interface TransitItem {
  planet: string;
  planet_ta: string;
  from_sign: string;
  from_sign_ta: string;
  to_sign: string;
  to_sign_ta: string;
  transit_date: string;
  impact: "good" | "neutral" | "challenging";
  summary_ta: string;
  summary_en: string;
  description_ta?: string;
  description_en?: string;
}

export const transitsKeys = {
  upcoming: (chartId: string) => ["transits-upcoming", chartId] as const,
};

export function getUpcomingTransits(
  chartId: string,
  windowDays = 30,
): Promise<{ success: boolean; data: TransitItem[] }> {
  const asOf = new Date().toISOString().slice(0, 10);
  return getApiClient().get(`/charts/${chartId}/peyarchi/upcoming`, {
    as_of: asOf,
    window_days: windowDays,
  }) as Promise<{
    success: boolean;
    data: TransitItem[];
  }>;
}