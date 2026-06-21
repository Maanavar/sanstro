import { apiPost, apiGet } from "./client";
import type { DirectPoruthamData, MuhurtaResponseData } from "@vinaadi/shared";

export interface PoruthamPayload {
  boyNakshatraNumber: number;
  girlNakshatraNumber: number;
}

export function getPorutham(
  payload: PoruthamPayload
): Promise<{ success: boolean; data: DirectPoruthamData }> {
  return apiPost("/public-tools/porutham", payload);
}

export interface MuhurtaPayload {
  chartId: string;
  activity: string;
  dateFrom: string;
  dateTo: string;
}

export function getMuhurta(
  params: MuhurtaPayload
): Promise<{ success: boolean; data: MuhurtaResponseData }> {
  const q = new URLSearchParams({
    chartId: params.chartId,
    activity: params.activity,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  });
  return apiGet(`/muhurta?${q}`);
}
