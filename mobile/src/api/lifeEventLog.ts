import { apiGet, apiPost } from "@/api/client";

export interface EventCorrelation {
  mahaLord: string;
  antarLord: string;
  moonRasi: string;
  narrative: { ta: string; en: string };
}

export interface LifeEventLogItem {
  id: string;
  chartId: string;
  eventType: string;
  eventDate: string;
  description?: string | null;
  correlation?: EventCorrelation | null;
}

export interface LifeEventLogCreateRequest {
  eventType: string;
  eventDate: string;
  description?: string | null;
}

export function getLifeEventLog(
  chartId: string,
): Promise<{ success: boolean; data: LifeEventLogItem[] }> {
  return apiGet<{ success: boolean; data: LifeEventLogItem[] }>(
    `/api/v1/charts/${encodeURIComponent(chartId)}/life-event-log`,
  );
}

export function createLifeEventLogEntry(
  chartId: string,
  req: LifeEventLogCreateRequest,
): Promise<{ success: boolean; data: LifeEventLogItem }> {
  return apiPost<{ success: boolean; data: LifeEventLogItem }>(
    `/api/v1/charts/${encodeURIComponent(chartId)}/life-event-log`,
    req,
  );
}
