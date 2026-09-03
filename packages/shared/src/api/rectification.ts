import { getApiClient } from "./client";

export type RectificationEventType =
  | "MARRIAGE"
  | "CAREER_BREAK"
  | "RELOCATION"
  | "HEALTH_MAJOR"
  | "PARENT_BIRTH";

export interface RectificationEvent {
  eventType: RectificationEventType;
  eventYear: number;
  eventMonth?: number;
}

export interface RectificationCandidate {
  timeLocal: string;
  lagnaRasi: number;
  lagnaRasiName: string;
  probabilityWeight: number;
  matchingEvents: number;
}

export interface RectificationResultData {
  birthProfileId: string;
  candidates: RectificationCandidate[];
  recommendedTime: string;
  confidenceNote: string;
  disclaimer: string;
}

export interface RectificationApplyData {
  birthProfileId: string;
  appliedOffsetMinutes: number;
  newBirthTimeLocal: string;
}

export function estimateBirthTime(
  birthProfileId: string,
  events: RectificationEvent[],
): Promise<{ success: boolean; data: RectificationResultData }> {
  return getApiClient().post(
    `/birth-profiles/${encodeURIComponent(birthProfileId)}/rectify`,
    { events },
  ) as Promise<{ success: boolean; data: RectificationResultData }>;
}

export function applyRectifiedBirthTime(
  birthProfileId: string,
  selectedTime: string,
): Promise<RectificationApplyData> {
  return getApiClient().patch(
    `/birth-profiles/${encodeURIComponent(birthProfileId)}/rectify/apply`,
    { selectedTime },
  ) as Promise<RectificationApplyData>;
}
