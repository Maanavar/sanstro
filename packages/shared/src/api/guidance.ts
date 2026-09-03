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
    `/charts/${chartId}/daily-guidance`,
    { date },
  ) as Promise<GuidanceEnvelope>;
}