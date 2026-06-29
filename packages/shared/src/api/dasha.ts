import { getApiClient } from "./client";

export interface DashaPeriod {
  lord: string;
  lord_ta: string;
  start_date: string;
  end_date: string;
  years_remaining?: number;
  prediction_ta?: string;
  prediction_en?: string;
  sub_periods?: DashaPeriod[];
}

export interface DashaTimelineData {
  maha_dasha: DashaPeriod;
  antar_dasha: DashaPeriod;
  current_timeline: DashaPeriod[];
}

export const dashaKeys = {
  timeline: (chartId: string) => ["dasha-timeline", chartId] as const,
};

export function getDashaTimeline(
  chartId: string,
): Promise<{ success: boolean; data: DashaTimelineData }> {
  return getApiClient().get(
    `/charts/${chartId}/dasha`,
    {},
  ) as Promise<{ success: boolean; data: DashaTimelineData }>;
}