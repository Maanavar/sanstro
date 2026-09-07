import { getApiClient } from "./client";
import type { PanchangamDailyResponseData, PanchangamMonthlyData } from "../types";
import { todayIso } from "../utils/format";

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
  const today = todayIso();
  return getApiClient().get("/panchangam/daily", {
    date: today,
    lat: params.lat,
    lng: params.lng,
    timezone: params.tz,
  }) as Promise<{
    data: PanchangamDailyResponseData;
  }>;
}

/** GET /public/panchangam (app/api/public_tools.py) — the same full daily
 *  payload as `/panchangam/daily`, with no auth and a public rate limit.
 *
 *  Verified against the route decorator: `date`, `lat` and `lng` are required
 *  query params and `timezone` defaults to Asia/Kolkata server-side. This is the
 *  only panchangam call a logged-out visitor can make, so the marketing hero and
 *  the public panchangam pages depend on it — do not "simplify" it into
 *  `getPanchangamDay`, which sits behind `get_current_user` and 401s for a guest. */
export function getPublicPanchangamDay(
  date: string,
  params: PanchangamParams,
): Promise<{ data: PanchangamDailyResponseData }> {
  return getApiClient().get("/public/panchangam", {
    date,
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
/** One Tamil solar month, bounded in inclusive civil dates by the backend.
 *
 * Never derive these client-side. The boundary is a sankranti instant plus a
 * sunset rule plus, for some months, a published-almanac override — the web
 * calendar's own approximation table is already a day off the engine for three
 * months of 2026, and is kept module-private there for that reason. */
export interface TamilMonthSpanEntry {
  index: number;
  name: { ta: string; en: string };
  startDate: string;
  endDate: string;
}

export interface TamilMonthsData {
  location: { lat: number; lng: number; timezone: string };
  months: TamilMonthSpanEntry[];
}

/** Tamil months covering `dateFrom` onward.
 *
 * Pass `chartId` to get the boundaries for that chart's own daily location, or
 * an explicit lat/lng/tz to override it — the same precedence the muhurta
 * search applies, so a caller that feeds these dates into a muhurta request
 * cannot disagree with its own results by a day at a month edge. */
export function getTamilMonths(params: {
  dateFrom: string;
  count?: number;
  chartId?: string;
  location?: PanchangamParams;
}): Promise<{ data: TamilMonthsData }> {
  return getApiClient().get("/panchangam/tamil-months", {
    dateFrom: params.dateFrom,
    count: params.count,
    chartId: params.chartId,
    lat: params.location?.lat,
    lng: params.location?.lng,
    timezone: params.location?.tz,
  }) as Promise<{ data: TamilMonthsData }>;
}
