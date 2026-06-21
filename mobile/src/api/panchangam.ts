import { apiGet } from "./client";
import type { PanchangamDailyResponseData, PanchangamMonthlyData } from "@vinaadi/shared";

export interface PanchangamParams {
  lat: number;
  lng: number;
  tz: string;
}

export function getPanchangamDay(
  date: string,
  params: PanchangamParams
): Promise<{ data: PanchangamDailyResponseData }> {
  const q = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    tz: params.tz,
  });
  return apiGet(`/panchangam/${date}?${q}`);
}

export function getPanchangamToday(
  params: PanchangamParams
): Promise<{ data: PanchangamDailyResponseData }> {
  const q = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    tz: params.tz,
  });
  return apiGet(`/panchangam/today?${q}`);
}

export function getPanchangamMonth(
  year: number,
  month: number,
  params: PanchangamParams
): Promise<{ data: PanchangamMonthlyData }> {
  const q = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    tz: params.tz,
  });
  return apiGet(`/panchangam/month/${year}/${month}?${q}`);
}
