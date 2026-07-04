import { getApiClient } from "./client";

export interface TransitItem {
  alertId: string;
  planet: string;
  fromRasi: string;
  toRasi: string;
  peyarchiDateUTC: string;
  peyarchiDateLocal: string;
  daysFromToday: number;
  impactFromMoon: number;
  impactFromLagna: number;
  saniCycleAfter: string | null;
  labelTa: string;
  labelEn: string;
}

// Classical gochara tone from the natal Moon sign (janma rasi), per planet.
// Jupiter favours 2/5/7/9/11; Saturn favours only 3/6/11 — the 10th is a
// kandaka kendra the backend daily score penalises, so it must never read as
// favourable. Sade Sati houses (12/1/2) are softened to neutral rather than
// flatly challenging, matching the product's framing. Rahu/Ketu (and any
// other planet) stay neutral pending an astrologer-approved node convention.
export function moonHouseImpact(planet: string, house: number): "good" | "neutral" | "challenging" {
  if (planet === "JUPITER") {
    if ([2, 5, 7, 9, 11].includes(house)) return "good";
    if ([1, 10].includes(house)) return "neutral";
    return "challenging";
  }
  if (planet === "SATURN") {
    if ([3, 6, 11].includes(house)) return "good";
    if ([1, 2, 5, 7, 10, 12].includes(house)) return "neutral";
    return "challenging";
  }
  return "neutral";
}

export const transitsKeys = {
  upcoming: (chartId: string) => ["transits-upcoming", chartId] as const,
};

export function getUpcomingTransits(
  chartId: string,
  windowDays = 30,
): Promise<{ success: boolean; data: TransitItem[]; meta: unknown }> {
  const asOf = new Date().toISOString().slice(0, 10);
  return getApiClient().get(`/charts/${chartId}/peyarchi/upcoming`, {
    as_of: asOf,
    window_days: windowDays,
  }) as Promise<{
    success: boolean;
    data: TransitItem[];
    meta: unknown;
  }>;
}
