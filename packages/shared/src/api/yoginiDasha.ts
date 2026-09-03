import { getApiClient } from "./client";

/**
 * Yogini Dasha — 36-year secondary/comparison dasha (Devi Bhagavata /
 * Muhurta Chintamani tradition). See app/calculations/yogini_dasha.py for
 * the documented starting-offset convention this project uses. Backend:
 * GET /charts/{id}/yogini-dasha (app/services/yogini_dasha_service.py).
 */
export interface YoginiDashaPeriod {
  level: "maha" | "antar";
  yogini: string;
  rulingPlanet: string;
  years: number;
  startDate: string;
  endDate: string;
}

export interface YoginiDashaData {
  chartId: string;
  openingYogini: {
    yogini: string;
    rulingPlanet: string;
    balanceYearsAtBirth: number;
  };
  current: {
    mahadasha: YoginiDashaPeriod;
    antardasha: YoginiDashaPeriod;
  };
  mahadashas: YoginiDashaPeriod[];
  antardashas: YoginiDashaPeriod[];
}

export const yoginiDashaKeys = {
  timeline: (chartId: string, asOf?: string) =>
    ["yogini-dasha", chartId, asOf ?? "current"] as const,
};

export function getYoginiDasha(
  chartId: string,
  asOf?: string,
): Promise<{ success: boolean; data: YoginiDashaData }> {
  return getApiClient().get(
    `/charts/${encodeURIComponent(chartId)}/yogini-dasha`,
    asOf ? { asOf } : undefined,
  ) as Promise<{ success: boolean; data: YoginiDashaData }>;
}
