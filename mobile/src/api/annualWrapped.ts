import { apiGet } from "./client";

export interface AnnualWrappedBiText {
  ta: string;
  en: string;
}

export interface WrappedSlide {
  slideId: string;
  slideType: string;
  headline: AnnualWrappedBiText;
  body: AnnualWrappedBiText;
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
  year: number
): Promise<{ success: boolean; data: AnnualWrappedData }> {
  return apiGet(`/charts/${encodeURIComponent(chartId)}/annual-wrapped?year=${year}`);
}
