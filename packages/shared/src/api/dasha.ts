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
  timeline: (chartId: string, level: DashaLevel = "maha") => ["dasha-timeline", chartId, level] as const,
};

export function getDashaTimeline(
  chartId: string,
  level: DashaLevel = "maha",
): Promise<{ success: boolean; data: DashaTimelineData }> {
  return getApiClient().get(
    `/charts/${chartId}/dasha`,
    { level },
  ) as Promise<{ success: boolean; data: DashaTimelineData }>;
}
