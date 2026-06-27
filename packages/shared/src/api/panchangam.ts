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
  return getApiClient().get(`/panchangam/${date}`, {
    lat: params.lat,
    lng: params.lng,
    tz: params.tz,
  }) as Promise<{
    data: PanchangamDailyResponseData;
  }>;
}

export function getPanchangamToday(
  params: PanchangamParams,
): Promise<{ data: PanchangamDailyResponseData }> {
  return getApiClient().get("/panchangam/today", {
    lat: params.lat,
    lng: params.lng,
    tz: params.tz,
  }) as Promise<{
    data: PanchangamDailyResponseData;
  }>;
}

export function getPanchangamMonth(
  year: number,
  month: number,
  params: PanchangamParams,
): Promise<{ data: PanchangamMonthlyData }> {
  return getApiClient().get(`/panchangam/month/${year}/${month}`, {
    lat: params.lat,
    lng: params.lng,
    tz: params.tz,
  }) as Promise<{
    data: PanchangamMonthlyData;
  }>;
}