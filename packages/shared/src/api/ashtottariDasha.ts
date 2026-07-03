import { getApiClient } from "./client";

/**
 * Ashtottari Dasha — 108-year secondary/comparison dasha (8 lords, no
 * Ketu). See app/calculations/ashtottari_dasha.py for the documented
 * Krittikadi nakshatra-lord convention this project uses, and its noted
 * uncertainty. Backend: GET /charts/{id}/ashtottari-dasha
 * (app/services/ashtottari_dasha_service.py).
 */
export interface AshtottariDashaPeriod {
  level: "maha" | "antar";
  lord: string;
  years: number;
  startDate: string;
  endDate: string;
}

export interface AshtottariDashaData {
  chartId: string;
  openingLord: {
    lord: string;
    balanceYearsAtBirth: number;
  };
  current: {
    mahadasha: AshtottariDashaPeriod;
    antardasha: AshtottariDashaPeriod;
  };
  mahadashas: AshtottariDashaPeriod[];
  antardashas: AshtottariDashaPeriod[];
}

export const ashtottariDashaKeys = {
  timeline: (chartId: string, asOf?: string) =>
    ["ashtottari-dasha", chartId, asOf ?? "current"] as const,
};

export function getAshtottariDasha(
  chartId: string,
  asOf?: string,
): Promise<{ success: boolean; data: AshtottariDashaData }> {
  return getApiClient().get(
    `/charts/${encodeURIComponent(chartId)}/ashtottari-dasha`,
    asOf ? { asOf } : undefined,
  ) as Promise<{ success: boolean; data: AshtottariDashaData }>;
}
