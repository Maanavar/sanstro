import { getApiClient } from "./client";
import type { PanchangamDailyResponseData, DailyGuidanceData } from "../types";
import type { RasiPalanData } from "./rasiPalan";
import type { LifeAreaData } from "./lifeAreas";
import type { LifeEventWindow } from "./lifeEvents";
import type { TransitItem } from "./transits";

export interface DailySnapshotData {
  panchangam: PanchangamDailyResponseData | null;
  rasi_palan: RasiPalanData | null;
  guidance: DailyGuidanceData | null;
  life_areas: LifeAreaData[] | null;
  life_events: LifeEventWindow[] | null;
  transits: TransitItem[];
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
