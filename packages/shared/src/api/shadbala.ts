import { getApiClient } from "./client";

/**
 * Full classical six-component Shadbala (Rupas). Advanced/experimental,
 * additive to the 0-100 product strength score. Backend: GET
 * /charts/{id}/shadbala (app/services/shadbala_service.py).
 */
export interface PlanetShadbala {
  graha: string;
  sthana: number;
  dig: number;
  kala: number;
  chesta: number;
  naisargika: number;
  drik: number;
  totalVirupa: number;
  rupas: number;
  requiredRupas: number;
  strengthRatio: number;
  isStrong: boolean;
  sthanaComponents: Record<string, number>;
  kalaComponents: Record<string, number>;
}

export interface ShadbalaData {
  chartId: string;
  experimental: boolean;
  note: string;
  birthTimeKnown: boolean;
  planets: PlanetShadbala[];
  strongestFirst: string[];
}

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
