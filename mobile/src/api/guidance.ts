import { apiGet } from "./client";
import type { DailyGuidanceData } from "@vinaadi/shared";

export interface GuidanceEnvelope {
  success: boolean;
  data: DailyGuidanceData;
}

export function getDailyGuidance(
  chartId: string,
  date: string
): Promise<GuidanceEnvelope> {
  return apiGet(`/daily-guidance?chartId=${chartId}&date=${date}`);
}
