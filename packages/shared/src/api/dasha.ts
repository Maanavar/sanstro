import { getApiClient } from "./client";

export type DashaLevel = "maha" | "antar" | "pratyantar" | "sookshma" | "prana";

export interface DashaInterpretation {
  activatedHouses: number[];
  houseTextTa: string;
  houseTextEn: string;
  naturalDomainTa: string;
  naturalDomainEn: string;
  relationshipToMahaTa: string;
  relationshipToMahaEn: string;
}

export interface DashaTransitionNote {
  transitionDate: string;
  noteTa: string;
  noteEn: string;
}

export interface DashaPeriodWindow {
  lord: string;
  startDate: string;
  endDate: string;
  interpretation?: DashaInterpretation | null;
  transitionNote?: DashaTransitionNote | null;
  maturationStatus?: Record<string, unknown> | null;
}

export interface DashaTimelineItem extends DashaPeriodWindow {
  level: DashaLevel;
}

export interface DashaTimelineData {
  chartId: string;
  openingDasha: {
    lord: string;
    balanceYearsAtBirth: number;
  };
  current: {
    mahadasha: DashaPeriodWindow;
    antardasha: DashaPeriodWindow;
    pratyantardasha: DashaPeriodWindow;
  };
  timeline: DashaTimelineItem[];
}

export const dashaKeys = {
  timeline: (chartId: string, level: DashaLevel | readonly DashaLevel[] = "maha") =>
    ["dasha-timeline", chartId, Array.isArray(level) ? level.join(",") : level] as const,
};

/**
 * Dasha timeline. `level` accepts one level or a list — with a list, the
 * backend returns every requested level's rows concatenated in `timeline`
 * (each row carries its own `level` tag), so callers rendering maha + antar +
 * pratyantar views need a single request instead of three (DASH-04).
 * Backend: GET /api/v1/charts/{chart_id}/dasha (app/api/charts.py::get_dasha,
 * comma-separated `level` handled in app/services/dasha_service.py).
 */
export function getDashaTimeline(
  chartId: string,
  level: DashaLevel | readonly DashaLevel[] = "maha",
  asOf?: string,
): Promise<{ success: boolean; data: DashaTimelineData }> {
  return getApiClient().get(
    `/charts/${chartId}/dasha`,
    { level: Array.isArray(level) ? level.join(",") : (level as string), asOf },
  ) as Promise<{ success: boolean; data: DashaTimelineData }>;
}
