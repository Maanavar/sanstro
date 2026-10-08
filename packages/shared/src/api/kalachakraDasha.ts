import type * as Server from "../generated/api-types";
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
 *
 * Types are the server's own (A14 step 7), generated from the response model.
 * Render `rasi` through the localiser, never `rasiName`/`rasiCode` (CLAUDE.md,
 * display boundary).
 */
export type KalachakraDashaPeriod = Server.KalachakraDashaPeriod;
export type KalachakraDashaData = Server.KalachakraDashaData;

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
