import { getApiClient } from "./client";
import type { BiText } from "../types";

export interface LifeEventWindow {
  eventType: "CAREER" | "MARRIAGE" | "STUDIES" | "RELOCATION" | "HEALTH_CAUTION";
  startDate: string;
  endDate: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  headline: BiText;
  reasons: BiText[];
  dashaSupport: BiText;
  gocharSupport: BiText;
}

export interface LifeEventsData {
  chartId: string;
  asOfDate: string;
  yearsAhead: number;
  windows: LifeEventWindow[];
}

export const lifeEventsKeys = {
  events: (chartId: string) => ["life-events", chartId] as const,
};

export function getLifeEvents(
  chartId: string,
  yearsAhead = 3,
): Promise<{ success: boolean; data: LifeEventsData }> {
  return getApiClient().get(
    `/charts/${encodeURIComponent(chartId)}/life-events?yearsAhead=${yearsAhead}`,
  ) as Promise<{ success: boolean; data: LifeEventsData }>;
}
