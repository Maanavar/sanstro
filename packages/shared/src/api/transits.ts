import { getApiClient } from "./client";

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

// Upachaya houses (3, 6, 10, 11) are favourable; dusthana (4, 8, 12) are challenging.
export function moonHouseImpact(house: number): "good" | "neutral" | "challenging" {
  if ([3, 6, 10, 11].includes(house)) return "good";
  if ([4, 8, 12].includes(house)) return "challenging";
  return "neutral";
}

export const transitsKeys = {
  upcoming: (chartId: string) => ["transits-upcoming", chartId] as const,
};

export function getUpcomingTransits(
  chartId: string,
  windowDays = 30,
): Promise<{ success: boolean; data: TransitItem[]; meta: unknown }> {
  const asOf = new Date().toISOString().slice(0, 10);
  return getApiClient().get(`/charts/${chartId}/peyarchi/upcoming`, {
    as_of: asOf,
    window_days: windowDays,
  }) as Promise<{
    success: boolean;
    data: TransitItem[];
    meta: unknown;
  }>;
}
