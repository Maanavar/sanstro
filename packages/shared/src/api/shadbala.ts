import type * as Server from "../generated/api-types";
import { getApiClient } from "./client";

/**
 * Full classical six-component Shadbala (Rupas). Advanced/experimental,
 * additive to the 0-100 product strength score. Backend: GET
 * /charts/{id}/shadbala (app/services/shadbala_service.py).
 *
 * Types are the server's own (A14 step 7): generated from the route's
 * response model, so a backend change reaches every consumer through tsc.
 */
export type PlanetShadbala = Server.ShadbalaPlanet;
export type ShadbalaData = Server.ShadbalaData;

export const shadbalaKeys = {
  chart: (chartId: string) => ["shadbala", chartId] as const,
};

export function getShadbala(
  chartId: string,
): Promise<{ success: boolean; data: ShadbalaData }> {
  return getApiClient().get(
    `/charts/${encodeURIComponent(chartId)}/shadbala`,
  ) as Promise<{ success: boolean; data: ShadbalaData }>;
}
