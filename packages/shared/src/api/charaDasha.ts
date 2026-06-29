import { getApiClient } from "./client";

export interface CharaPeriod {
  rasi: number;
  rasi_name: string;
  years: number;
  start_date: string;
  end_date: string;
}

export interface CharaDashaData {
  chartId: string;
  lagnaRasi: string;
  currentPeriod: CharaPeriod | null;
  periods: CharaPeriod[];
}

export const charaDashaKeys = {
  timeline: (chartId: string) => ["chara-dasha", chartId] as const,
};

export function getCharaDasha(
  chartId: string,
): Promise<{ success: boolean; data: CharaDashaData }> {
  return getApiClient().get(
    `/charts/${chartId}/chara-dasha`,
  ) as Promise<{ success: boolean; data: CharaDashaData }>;
}
