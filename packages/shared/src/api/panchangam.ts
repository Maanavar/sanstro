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
  return getApiClient().get("/panchangam/daily", {
    date,
    lat: params.lat,
    lng: params.lng,
    timezone: params.tz,
  }) as Promise<{
    data: PanchangamDailyResponseData;
  }>;
}

export function getPanchangamToday(
  params: PanchangamParams,
): Promise<{ data: PanchangamDailyResponseData }> {
  const today = new Date().toISOString().slice(0, 10);
  return getApiClient().get("/panchangam/daily", {
    date: today,
    lat: params.lat,
    lng: params.lng,
    timezone: params.tz,
  }) as Promise<{
    data: PanchangamDailyResponseData;
  }>;
}

export function getPanchangamMonth(
  year: number,
  month: number,
  params: PanchangamParams,
): Promise<{ data: PanchangamMonthlyData }> {
  return getApiClient().get("/panchangam/monthly", {
    year,
    month,
    lat: params.lat,
    lng: params.lng,
    timezone: params.tz,
  }) as Promise<{
    data: PanchangamMonthlyData;
  }>;
}