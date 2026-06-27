import { getApiClient } from "./client";
import type {
  NotificationInboxResponse,
  NotificationPreferenceData,
} from "../types";

export function getNotificationInbox(): Promise<NotificationInboxResponse> {
  return getApiClient().get("/notifications") as Promise<NotificationInboxResponse>;
}

export function getNotificationPreferences(): Promise<{
  success: boolean;
  data: NotificationPreferenceData;
}> {
  return getApiClient().get("/settings/notifications") as Promise<{
    success: boolean;
    data: NotificationPreferenceData;
  }>;
}

export function updateNotificationPreferences(
  patch: Partial<NotificationPreferenceData>,
): Promise<{ success: boolean; data: NotificationPreferenceData }> {
  return getApiClient().patch("/settings/notifications", patch) as Promise<{
    success: boolean;
    data: NotificationPreferenceData;
  }>;
}
