import { apiGet, apiPost } from "./client";
import type {
  ChartCalculateResponseData,
  ChartSummaryData,
  BirthProfileCreateResponseData,
} from "@vinaadi/shared";

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
  payload: CreateBirthProfilePayload
): Promise<{ success: boolean; data: BirthProfileCreateResponseData }> {
  return apiPost("/birth-profiles", payload);
}

export function getChartSummary(
  chartId: string
): Promise<{ success: boolean; data: ChartSummaryData }> {
  return apiGet(`/charts/${chartId}/summary`);
}

export function getChartFull(
  chartId: string
): Promise<{ success: boolean; data: ChartCalculateResponseData }> {
  return apiGet(`/charts/${chartId}`);
}
