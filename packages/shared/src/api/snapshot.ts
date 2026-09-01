import { getApiClient } from "./client";
import type { PanchangamDailyResponseData, DailyGuidanceData } from "../types";
import type { RasiPalanData } from "./rasiPalan";
import type { LifeAreaData } from "./lifeAreas";
import type { LifeEventWindow } from "./lifeEvents";
import type { TransitItem } from "./transits";

/**
 * Why a section is or is not in the payload.
 *
 * A null section used to mean three different things — you did not ask for it,
 * you are not entitled to it, or it failed — and the client could not tell them
 * apart, so a broken section rendered as "nothing today". `unavailable` is the
 * one to surface as an error state; `not_requested` is not a failure.
 */
export type SnapshotSectionStatus =
  | "ok"
  | "unavailable"
  | "not_requested"
  | "invalid_input";

export type SnapshotSectionName =
  | "panchangam"
  | "rasi_palan"
  | "guidance"
  | "life_areas"
  | "life_events";

export interface DailySnapshotData {
  panchangam: PanchangamDailyResponseData | null;
  rasi_palan: RasiPalanData | null;
  guidance: DailyGuidanceData | null;
  life_areas: LifeAreaData[] | null;
  life_events: LifeEventWindow[] | null;
  transits: TransitItem[];
  /** Added after the payload fields, so older clients are unaffected. */
  sections?: Partial<Record<SnapshotSectionName, SnapshotSectionStatus>>;
}

export interface DailySnapshotParams {
  lat?: number;
  lng?: number;
  tz?: string;
  rasi?: string;
  chartId?: string;
}

export function getDailySnapshot(
  params: DailySnapshotParams,
): Promise<{ success: boolean; data: DailySnapshotData }> {
  return getApiClient().get("/daily-snapshot", {
    lat: params.lat,
    lng: params.lng,
    tz: params.tz,
    rasi: params.rasi,
    chartId: params.chartId,
  }) as Promise<{ success: boolean; data: DailySnapshotData }>;
}
