import { getApiClient } from "./client";
import type {
  ChartCalculateResponseData,
  ChartSummaryData,
  BirthProfileCreateResponseData,
} from "../types";

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
