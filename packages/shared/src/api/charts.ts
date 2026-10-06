import { getApiClient } from "./client";
import type {
  ChartCalculateResponseData,
  ChartExplanationData,
  ChartSummaryData,
  BirthProfileCreateResponseData,
  BirthProfileResponse,
} from "../types";

/** GET /birth-profiles (app/api/birth_profiles.py) — the signed-in user's active
 *  profiles, newest first, each with its saved `chartId`. */
export function listBirthProfiles(): Promise<{ success: boolean; data: BirthProfileResponse[] }> {
  return getApiClient().get("/birth-profiles") as Promise<{
    success: boolean;
    data: BirthProfileResponse[];
  }>;
}

/**
 * POST /birth-profiles/{birthProfileId}/confirm-location
 * (`confirm_birth_profile_location_endpoint`, app/api/birth_profiles.py).
 *
 * The "Keep Chennai" answer to the §2 location check: stamps
 * `currentLocationUpdatedAt` without moving the saved place, so declining the
 * prompt is recorded as an answer rather than as silence. Path param, POST,
 * no body — checked against the route decorator, not inferred.
 */
export function confirmBirthProfileLocation(
  birthProfileId: string,
): Promise<{ success: boolean; data: BirthProfileResponse }> {
  return getApiClient().post(
    `/birth-profiles/${birthProfileId}/confirm-location`,
    {},
  ) as Promise<{ success: boolean; data: BirthProfileResponse }>;
}

export interface CurrentLocationPayload {
  currentPlace: string;
  currentLatitude: number;
  currentLongitude: number;
  currentTimezone: string;
}

/**
 * PATCH /birth-profiles/{birthProfileId} (`update_birth_profile_endpoint`),
 * narrowed to the daily-timings location.
 *
 * `recalculate: false` on purpose — the natal chart is fixed at birth and does
 * not move with the reader. The backend drops that profile's cached daily
 * guidance from today forward when the effective location actually changes,
 * so nothing here has to invalidate anything.
 */
export function updateBirthProfileLocation(
  birthProfileId: string,
  payload: CurrentLocationPayload,
): Promise<{ success: boolean; data: BirthProfileResponse }> {
  return getApiClient().patch(`/birth-profiles/${birthProfileId}`, {
    ...payload,
    recalculate: false,
  }) as Promise<{ success: boolean; data: BirthProfileResponse }>;
}

export interface CreateBirthProfilePayload {
  displayName: string;
  birthDateLocal: string;
  birthTimeLocal?: string;
  birthPlace: string;
  birthLatitude: number;
  birthLongitude: number;
  birthTimezone: string;
  calculateNow?: boolean;
  genderForTraditionalRules?: string | null;
}

export function createBirthProfile(
  payload: CreateBirthProfilePayload,
): Promise<{ success: boolean; data: BirthProfileCreateResponseData }> {
  return getApiClient().post("/birth-profiles", payload) as Promise<{
    success: boolean;
    data: BirthProfileCreateResponseData;
  }>;
}

export function getChartSummary(
  chartId: string,
): Promise<{ success: boolean; data: ChartSummaryData }> {
  return getApiClient().get(`/charts/${chartId}/summary`) as Promise<{
    success: boolean;
    data: ChartSummaryData;
  }>;
}

export function getChartFull(
  chartId: string,
): Promise<{ success: boolean; data: ChartCalculateResponseData }> {
  return getApiClient().get(`/charts/${chartId}`) as Promise<{
    success: boolean;
    data: ChartCalculateResponseData;
  }>;
}

export type JadhagamPdfDetail = "summary" | "astrologer";

/**
 * GET /charts/{chart_id}/export/pdf (`export_chart_pdf`, app/api/charts.py) —
 * query params `asOf` (date), `lang` ("en" | "ta"), `detail` ("summary" |
 * "astrologer"; FTR-22 appends the Astrologer ledgers). Checked against the
 * route decorator: path param + three query params, GET.
 *
 * A path, not a wrapper: the response is a PDF and `ApiClient` speaks JSON
 * only, so each surface fetches the bytes itself (web: credentialed fetch;
 * mobile: `fetchWithAuth`). The URL shape still lives in one place.
 */
export function jadhagamPdfPath(
  chartId: string,
  options: { lang: "en" | "ta"; asOf?: string; detail?: JadhagamPdfDetail },
): string {
  // Built by hand: React Native's URLSearchParams has thrown "not implemented"
  // for `set` on some versions, and this runs on mobile too.
  const query = [`lang=${options.lang}`];
  if (options.asOf) query.push(`asOf=${encodeURIComponent(options.asOf)}`);
  if (options.detail && options.detail !== "summary") query.push(`detail=${options.detail}`);
  return `/charts/${encodeURIComponent(chartId)}/export/pdf?${query.join("&")}`;
}

/**
 * GET /charts/{chart_id}/explanation (`get_explanation`, app/api/charts.py) —
 * path param + optional `asOf` (date) and `peyarchiWindowDays` (1..1200)
 * query params, GET. Checked against the route decorator. Carries the Story
 * view's server picks in `story` (FTR-21), which mobile's reading renders.
 */
export function getChartExplanation(
  chartId: string,
  asOf?: string,
): Promise<{ success: boolean; data: ChartExplanationData }> {
  return getApiClient().get(`/charts/${encodeURIComponent(chartId)}/explanation`, asOf ? { asOf } : undefined) as Promise<{
    success: boolean;
    data: ChartExplanationData;
  }>;
}