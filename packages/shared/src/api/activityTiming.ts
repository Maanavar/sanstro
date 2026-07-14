import { getApiClient } from "./client";
import type { ActivityTimingData } from "../types";

export type ActivityTimingBatchData = {
  chartId: string;
  month: string;
  /** Keyed by requested activity id; a failed/unknown activity maps to null. */
  results: Record<string, ActivityTimingData | null>;
};

export const activityTimingKeys = {
  batch: (chartId: string, month: string, activities: readonly string[], asOf?: string) =>
    ["activity-timing", "batch", chartId, month, activities.join(","), asOf ?? ""] as const,
};

/**
 * Timings for several activities in one request.
 * Backend: GET /api/v1/activity-timing/batch
 * (app/api/daily_guidance.py::activity_timing_batch — query params
 * chartId, activities (comma list, max 12), month=YYYY-MM, asOf optional).
 */
export function getActivityTimingBatch(
  chartId: string,
  activities: readonly string[],
  month: string,
  asOf?: string,
): Promise<{ success: boolean; data: ActivityTimingBatchData }> {
  return getApiClient().get("/activity-timing/batch", {
    chartId,
    activities: activities.join(","),
    month,
    asOf,
  }) as Promise<{ success: boolean; data: ActivityTimingBatchData }>;
}
