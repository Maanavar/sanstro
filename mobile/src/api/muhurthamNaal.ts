import { getApiClient } from "@vinaadi/shared/api/client";

export interface BiText { ta: string; en: string; }
export interface NallaNeramWindow { start: string; end: string; period: string; }

export interface MuhurthamNaalItem {
  date: string;
  weekday: BiText;
  pirai: BiText;
  tamilMonth: BiText;
  tamilDay: number;
  nakshatra: BiText;
  tithiNumber: number;
  paksha: string;
  nallaNeram: NallaNeramWindow[];
}

export interface MuhurthamNaalListResponse {
  success: boolean;
  year: number;
  count: number;
  naals: MuhurthamNaalItem[];
}

export interface MuhurthamNaalMatchItem {
  naal: MuhurthamNaalItem;
  taraQuality: "GOOD" | "NEUTRAL" | "AVOID";
  isRecommended: boolean;
  matchScore: number;
  reasons: BiText[];
}

export interface MuhurthamNaalMatchResponse {
  success: boolean;
  year: number;
  chartId: string;
  matches: MuhurthamNaalMatchItem[];
}

export async function getPublicMuhurthamNaals(year = 2027): Promise<MuhurthamNaalListResponse> {
  const api = getApiClient();
  return api.get("/public/muhurtham-naals", { year }) as Promise<MuhurthamNaalListResponse>;
}

export async function getChartMuhurthamNaals(chartId: string, year = 2027): Promise<MuhurthamNaalMatchResponse> {
  const api = getApiClient();
  return api.get(`/charts/${chartId}/muhurtham-naals`, { year }) as Promise<MuhurthamNaalMatchResponse>;
}
