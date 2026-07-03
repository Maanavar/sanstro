import { getApiClient } from "./client";

/**
 * Kalachakra Dasha — rasi-based Navamsa-Nakshatra dasha, non-uniform period
 * lengths (4-21 years per rasi). See app/calculations/kalachakra_dasha.py
 * for the cited Saravali source (itself citing Parasara's Hora Shastra and
 * Vaidhyanatha Dikshita's Jataka Parijata), the documented Portion-Zero
 * cycle convention, and a discovered inconsistency in the source's own
 * worked example. Experimental / display only — not used in any scoring
 * path. Backend: GET /charts/{id}/kalachakra-dasha
 * (app/services/kalachakra_dasha_service.py).
 */
export interface KalachakraDashaPeriod {
  level: "maha" | "antar";
  rasi: number;
  rasiCode: string;
  rasiName: string | null;
  years: number;
  startDate: string;
  endDate: string;
}

export interface KalachakraDashaData {
  chartId: string;
  openingInfo: {
    chakra: string;
    direction: string;
    pada: number;
    paramayus: number;
    rasi: number;
    rasiCode: string;
    rasiName: string | null;
    balanceYearsAtBirth: number;
  };
  current: {
    mahadasha: KalachakraDashaPeriod;
    antardasha: KalachakraDashaPeriod;
  };
  mahadashas: KalachakraDashaPeriod[];
  antardashas: KalachakraDashaPeriod[];
}

export const kalachakraDashaKeys = {
  timeline: (chartId: string, asOf?: string) =>
    ["kalachakra-dasha", chartId, asOf ?? "current"] as const,
};

export function getKalachakraDasha(
  chartId: string,
  asOf?: string,
): Promise<{ success: boolean; data: KalachakraDashaData }> {
  return getApiClient().get(
    `/charts/${encodeURIComponent(chartId)}/kalachakra-dasha`,
    asOf ? { asOf } : undefined,
  ) as Promise<{ success: boolean; data: KalachakraDashaData }>;
}
