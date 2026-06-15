import { apiFetchJson, toQuery } from "@/lib/api";

export interface BiText {
  ta: string;
  en: string;
}

export interface NallaNeramWindow {
  start: string;
  end: string;
  period: string; // "AM" | "PM"
}

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
  source: string;
  count: number;
  naals: MuhurthamNaalItem[];
}

export interface MuhurthamNaalMatchItem {
  naal: MuhurthamNaalItem;
  taraNumber: number;
  taraName: BiText;
  taraQuality: "GOOD" | "NEUTRAL" | "AVOID";
  isChandrashtama: boolean;
  isRecommended: boolean;
  matchScore: number;
  reasons: BiText[];
}

export interface MuhurthamNaalMatchContext {
  janmaNakshatra: BiText;
  janmaRasiNumber: number;
  chandrashtamaRasiNumber: number;
  recommendedCount: number;
  totalCount: number;
  source: string;
}

export interface MuhurthamNaalMatchResponse {
  success: boolean;
  year: number;
  chartId: string;
  context: MuhurthamNaalMatchContext;
  matches: MuhurthamNaalMatchItem[];
}

export interface MuhurthamNaalFilters {
  month?: number;
  pirai?: string;
  weekday?: string;
  nakshatra?: string;
}

export function fetchPublicMuhurthamNaals(
  year: number,
  filters: MuhurthamNaalFilters = {},
): Promise<MuhurthamNaalListResponse> {
  const query = toQuery({ year, ...filters });
  return apiFetchJson<MuhurthamNaalListResponse>(`/api/v1/public/muhurtham-naals${query}`);
}

export function fetchChartMuhurthamNaals(
  chartId: string,
  year = 2026,
  recommendedOnly = false,
): Promise<MuhurthamNaalMatchResponse> {
  const query = toQuery({ year, recommendedOnly });
  return apiFetchJson<MuhurthamNaalMatchResponse>(
    `/api/v1/charts/${chartId}/muhurtham-naals${query}`,
  );
}
