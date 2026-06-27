import { getApiClient } from "./client";
import type { PanchangamDailyResponseData, PanchangamMonthlyData } from "../types";

export interface PanchangamParams {
  lat: number;
  lng: number;
  tz: string;
}

export function getPanchangamDay(
  date: string,
  params: PanchangamParams,
): Promise<{ data: PanchangamDailyResponseData }> {
  const q = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    tz: params.tz,
  });
  return getApiClient().get(`/panchangam/${date}?${q}`) as Promise<{
    data: PanchangamDailyResponseData;
  }>;
}

export function getPanchangamToday(
  params: PanchangamParams,
): Promise<{ data: PanchangamDailyResponseData }> {
  const q = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    tz: params.tz,
  });
  return getApiClient().get(`/panchangam/today?${q}`) as Promise<{
    data: PanchangamDailyResponseData;
  }>;
}

export function getPanchangamMonth(
  year: number,
  month: number,
  params: PanchangamParams,
): Promise<{ data: PanchangamMonthlyData }> {
  const q = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    tz: params.tz,
  });
  return getApiClient().get(`/panchangam/month/${year}/${month}?${q}`) as Promise<{
    data: PanchangamMonthlyData;
  }>;
}
