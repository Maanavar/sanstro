import { apiGet, apiPost } from "@/api/client";
import type { RetrospectiveData, RetrospectiveListData } from "@vinaadi/shared";

export type { RetrospectiveData, RetrospectiveListData };

export interface RetrospectiveRequest {
  chartId: string;
  eventDate: string;
  eventDescription: string;
  eventType: string;
}

export function createRetrospective(
  req: RetrospectiveRequest,
): Promise<{ success: boolean; data: RetrospectiveData }> {
  return apiPost<{ success: boolean; data: RetrospectiveData }>(
    "/api/v1/retrospective",
    req,
  );
}

export function listRetrospectives(
  chartId: string,
): Promise<{ success: boolean; data: RetrospectiveListData }> {
  return apiGet<{ success: boolean; data: RetrospectiveListData }>(
    "/api/v1/retrospective",
    { chartId },
  );
}
