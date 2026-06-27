import { getApiClient } from "./client";
import type { DailyGuidanceData } from "../types";

export interface GuidanceEnvelope {
  success: boolean;
  data: DailyGuidanceData;
}

export function getDailyGuidance(
  chartId: string,
  date: string,
): Promise<GuidanceEnvelope> {
  return getApiClient().get(
    `/daily-guidance?chartId=${chartId}&date=${date}`,
  ) as Promise<GuidanceEnvelope>;
}
