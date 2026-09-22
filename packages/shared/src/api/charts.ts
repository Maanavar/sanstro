import { getApiClient } from "./client";
import type {
  ChartCalculateResponseData,
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
