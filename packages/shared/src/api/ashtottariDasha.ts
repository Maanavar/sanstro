import { getApiClient } from "./client";

/**
 * Ashtottari Dasha — 108-year secondary/comparison dasha (8 lords, no
 * Ketu). See app/calculations/ashtottari_dasha.py for the documented
 * Ardra-adi (B.V. Raman / Jataka Parijata) nakshatra-lord convention this
 * project uses. Backend: GET /charts/{id}/ashtottari-dasha
 * (app/services/ashtottari_dasha_service.py).
 */
export interface AshtottariDashaPeriod {
  level: "maha" | "antar";
  lord: string;
  years: number;
  startDate: string;
  endDate: string;
}

/**
 * Informational classical-applicability verdict — never hides the timeline.
 * `applicable` is the primary positional rule (Rahu kendra/trikona from the
 * lagna lord, Rahu not in lagna); `pakshaSupports` is the disputed secondary
 * day/night+paksha condition, surfaced separately. `null` = indeterminate.
 */
export interface AshtottariDashaApplicability {
  ruleEn: string;
  ruleTa: string;
  applicable: boolean | null;
  reason: string;
  paksha: "SHUKLA" | "KRISHNA";
  isDayBirth: boolean | null;
  isDayBirthApproximate: boolean;
  pakshaSupports: boolean | null;
  pakshaReason: string;
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
  applicability?: AshtottariDashaApplicability;
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
