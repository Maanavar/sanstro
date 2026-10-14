import type * as Server from "../generated/api-types";
import { getApiClient } from "./client";

/**
 * Ashtottari Dasha — 108-year secondary/comparison dasha (8 lords, no
 * Ketu). See app/calculations/ashtottari_dasha.py for the documented
 * Ardra-adi (B.V. Raman / Jataka Parijata) nakshatra-lord convention this
 * project uses. Backend: GET /charts/{id}/ashtottari-dasha
 * (app/services/ashtottari_dasha_service.py).
 *
 * Types are the server's own (A14 step 7), generated from the response model.
 * `applicability` was optional in the hand-written type; the route always
 * sends it.
 */
export type AshtottariDashaPeriod = Server.LordDashaPeriod;

/**
 * Informational classical-applicability verdict — never hides the timeline.
 * `applicable` is the primary positional rule (Rahu kendra/trikona from the
 * lagna lord, Rahu not in lagna); `pakshaSupports` is the disputed secondary
 * day/night+paksha condition, surfaced separately. `null` = indeterminate.
 */
export type AshtottariDashaApplicability = Server.AshtottariApplicabilityData;
export type AshtottariDashaData = Server.AshtottariDashaData;

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
