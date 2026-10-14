import type * as Server from "../generated/api-types";
import { getApiClient } from "./client";

/**
 * Yogini Dasha — 36-year secondary/comparison dasha (Devi Bhagavata /
 * Muhurta Chintamani tradition). See app/calculations/yogini_dasha.py for
 * the documented starting-offset convention this project uses. Backend:
 * GET /charts/{id}/yogini-dasha (app/services/yogini_dasha_service.py).
 *
 * Types are the server's own (A14 step 7), generated from the response model.
 */
export type YoginiDashaPeriod = Server.YoginiDashaPeriod;
export type YoginiDashaData = Server.YoginiDashaData;

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
