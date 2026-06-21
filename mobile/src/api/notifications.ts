import { apiGet, apiPatch } from "./client";
import type {
  NotificationInboxResponse,
  NotificationPreferenceData,
} from "@vinaadi/shared";

export function getNotificationInbox(): Promise<NotificationInboxResponse> {
  return apiGet("/notifications");
}

export function getNotificationPreferences(): Promise<{
  success: boolean;
  data: NotificationPreferenceData;
}> {
  return apiGet("/settings/notifications");
}

export function updateNotificationPreferences(
  patch: Partial<NotificationPreferenceData>
): Promise<{ success: boolean; data: NotificationPreferenceData }> {
  return apiPatch("/settings/notifications", patch);
}
