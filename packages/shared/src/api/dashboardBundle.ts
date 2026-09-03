import { getApiClient } from "./client";
import type {
  ChartCalculateResponseData,
  ChartExplanationData,
  ChartSummaryData,
  DailyGuidanceData,
  DailyGuidanceRangeData,
  DashaTimelineResponseData,
  LifeAreasResponseData,
  NakshatraCardData,
  PanchangamDailyResponseData,
  PanchangamTimingsData,
  PeyarchiEvent,
  SaniCycleData,
  TransitSnapshotData,
  WeekAheadData,
} from "../types";

/**
 * One response carrying everything the dashboard renders for a chart+date —
 * replaces the ~13 parallel per-chart requests (DASH-04). Every section is
 * nullable: the backend isolates section failures and reports them under
 * `errors` instead of failing the bundle (DASH-02), so consumers must render
 * a graceful gap (or retry affordance) for null sections.
 */
export type ChartDashboardBundleData = {
  chartId: string;
  dateLocal: string;
  chart: ChartCalculateResponseData | null;
  summary: ChartSummaryData | null;
  dailyGuidance: DailyGuidanceData | null;
  dailyGuidanceRange: DailyGuidanceRangeData | null;
  /** Combined maha+antar+pratyantar timeline; rows carry their `level` tag. */
  dasha: DashaTimelineResponseData | null;
  transit: TransitSnapshotData | null;
  sani: SaniCycleData | null;
  peyarchiUpcoming: PeyarchiEvent[] | null;
  explanation: ChartExplanationData | null;
  panchangam: PanchangamDailyResponseData | null;
  panchangamTimings: PanchangamTimingsData | null;
  lifeAreas: LifeAreasResponseData | null;
  weekAhead: WeekAheadData | null;
  nakshatraCard: NakshatraCardData | null;
  /** Which saved location the panchangam used ("current" wins over "birth"). */
  panchangamLocation: "current" | "birth" | null;
  /** IANA timezone of that location — compute "now" in this zone (DASH-01). */
  panchangamTimezone: string | null;
  /** Section name -> short failure note for sections returned as null. */
  errors: Record<string, string>;
};

export const dashboardBundleKeys = {
  bundle: (chartId: string, date: string) => ["chart", "dashboard-bundle", chartId, date] as const,
};

/**
 * Backend: GET /api/v1/charts/{chart_id}/dashboard-bundle
 * (app/api/charts.py::get_dashboard_bundle — query params `date`, `language`).
 */
export function getChartDashboardBundle(
  chartId: string,
  date: string,
  language = "ta-en",
): Promise<{ success: boolean; data: ChartDashboardBundleData }> {
  return getApiClient().get(`/charts/${chartId}/dashboard-bundle`, {
    date,
    language,
  }) as Promise<{ success: boolean; data: ChartDashboardBundleData }>;
}
