import { apiGet } from "./client";

export interface TransitItem {
  planet: string;
  planet_ta: string;
  from_sign: string;
  from_sign_ta: string;
  to_sign: string;
  to_sign_ta: string;
  transit_date: string;
  impact: "good" | "neutral" | "challenging";
  summary_ta: string;
  summary_en: string;
  description_ta?: string;
  description_en?: string;
}

export const transitsKeys = {
  upcoming: (rasi: string) => ["transits-upcoming", rasi] as const,
};

export function getUpcomingTransits(
  rasi: string,
  limit = 12
): Promise<{ success: boolean; data: TransitItem[] }> {
  const q = new URLSearchParams({ rasi, limit: String(limit) });
  return apiGet(`/transits/upcoming?${q}`);
}
