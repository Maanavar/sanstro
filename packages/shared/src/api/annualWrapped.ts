import { getApiClient } from "./client";
import type { BiText } from "../types";

export interface WrappedSlide {
  slideId: string;
  slideType: string;
  headline: BiText;
  body: BiText;
  accentColor: string;
  stat?: string | null;
}

export interface AnnualWrappedData {
  chartId: string;
  year: number;
  slides: WrappedSlide[];
  totalDaysScored: number;
  peakScore: number;
  peakDate: string | null;
  valleyScore: number;
  valleyDate: string | null;
  dominantDashaLord: string;
  highDays: number;
  cautionDays: number;
  averageScore: number;
  topLifeArea: string | null;
}

export const annualWrappedKeys = {
  year: (chartId: string, year: number) => ["annual-wrapped", chartId, year] as const,
};

export function getAnnualWrapped(
  chartId: string,
  year: number,
): Promise<{ success: boolean; data: AnnualWrappedData }> {
  return getApiClient().get(
    `/charts/${encodeURIComponent(chartId)}/annual-wrapped`,
    { year },
  ) as Promise<{ success: boolean; data: AnnualWrappedData }>;
}