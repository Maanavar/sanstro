import { apiFetchJson, toQuery } from "@/lib/api";

export const MUHURTHAM_NAAL_YEARS = [2027, 2026] as const;
export const LATEST_MUHURTHAM_NAAL_YEAR = MUHURTHAM_NAAL_YEARS[0];
export type MuhurthamNaalYear = (typeof MUHURTHAM_NAAL_YEARS)[number];

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

/** One chart's reading of one date. `who` is null for a single chart. */
export interface MuhurthamNaalReading {
  who: BiText | null;
  taraNumber: number;
  taraName: BiText;
  taraQuality: "GOOD" | "NEUTRAL" | "AVOID";
  isChandrashtama: boolean;
  /** The reading whose tara set `matchScore`. */
  governs: boolean;
}

export interface MuhurthamNaalMatchItem {
  naal: MuhurthamNaalItem;
  /** The governing reading's tara. */
  taraNumber: number;
  taraName: BiText;
  taraQuality: "GOOD" | "NEUTRAL" | "AVOID";
  /** Chandrashtama for either chart. */
  isChandrashtama: boolean;
  isRecommended: boolean;
  matchScore: number;
  reasons: BiText[];
  readings?: MuhurthamNaalReading[];
}

export interface MuhurthamNaalMatchContext {
  janmaNakshatra: BiText;
  janmaRasiNumber: number;
  chandrashtamaRasiNumber: number;
  recommendedCount: number;
  totalCount: number;
  source: string;
  /** The chart's effective daily location, used for the displayed Nalla Neram. */
  dailyLocation?: { latitude: number; longitude: number; timezone: string; source: "current" | "birth" } | null;
  subjectWho?: BiText | null;
  partner?: { who: BiText; janmaNakshatra: BiText; janmaRasiNumber: number; chandrashtamaRasiNumber: number } | null;
}

export interface MuhurthamNaalMatchResponse {
  success: boolean;
  year: number;
  chartId: string;
  partnerChartId?: string | null;
  context: MuhurthamNaalMatchContext;
  matches: MuhurthamNaalMatchItem[];
}

export type WeddingRole = "BRIDE" | "GROOM" | "PERSON";

/** A couple to rank the published dates for: the partner's saved chart and the
 *  role of the chart the list is opened on. */
export interface NaalCouple {
  partnerChartId: string;
  subjectRole: WeddingRole;
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
  year: number = LATEST_MUHURTHAM_NAAL_YEAR,
  recommendedOnly = false,
  couple: NaalCouple | null = null,
): Promise<MuhurthamNaalMatchResponse> {
  const query = toQuery({
    year,
    recommendedOnly,
    partnerChartId: couple?.partnerChartId,
    subjectRole: couple?.subjectRole,
  });
  return apiFetchJson<MuhurthamNaalMatchResponse>(
    `/api/v1/charts/${chartId}/muhurtham-naals${query}`,
  );
}
