import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

import type { KalamReminderPlan } from "./kalamReminders";

/** Tags every notification this scheduler creates, so a rebuild ("rebuilt
 *  each morning and on location change" — docs/HOME_CALENDAR_CHARTS_PROPOSALS_2026-09-22.md
 *  §1 Arch) can find and cancel exactly its own, and nothing else the app or
 *  the server-driven push preferences may have scheduled. */
const TAG = "kalam-reminder";

const TITLE: Record<KalamReminderPlan["kind"], { en: string; ta: string }> = {
  rahuKalam: { en: "Rahu Kalam in 10 minutes", ta: "10 நிமிடத்தில் ராகு காலம்" },
  yamagandam: { en: "Yamagandam in 10 minutes", ta: "10 நிமிடத்தில் யமகண்டம்" },
};

// Advisory register (தவிர்ப்பது நல்லது), not the imperative — same owner
// ruling (2026-09-17) as web's `avoidRahu` / `liveAvoidLine`
// (web/lib/dashboard-i18n.ts). A push notification is still a panchangam
// counselling the reader, not commanding them.
function bodyFor(windowEnd: string, lang: "en" | "ta"): string {
  if (lang === "ta") {
    return `${windowEnd} வரை — புதிய தொடக்கங்களைத் தவிர்ப்பது நல்லது.`;
  }
  return `Until ${windowEnd} — good to avoid new starts.`;
}

/** Notification permission plus the Android channel local reminders need,
 *  shared by the Settings toggle (mobile/src/hooks/useKalamReminderToggle.ts)
 *  and anything else that schedules a local notification through this
 *  module. Returns false without scheduling anything if permission is
 *  denied. */
export async function ensureKalamReminderPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return false;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Vinaadi",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  return true;
}

/** Cancel every kalam reminder this scheduler previously scheduled, whether
 *  or not it is one of today's plans — a stale Yamagandam reminder from
 *  yesterday, or from a kind the reader just switched off, must not survive
 *  a rebuild. */
async function cancelAllKalamReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.content.data?.tag === TAG)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

/**
 * Replace today's scheduled kalam reminders with `plans`. Always cancels
 * first, so calling this again with an empty plan (reader turned both
 * toggles off) clears anything already on the device.
 */
export async function applyKalamReminderPlans(plans: KalamReminderPlan[], lang: "en" | "ta"): Promise<void> {
  await cancelAllKalamReminders();

  await Promise.all(
    plans.map((plan) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: TITLE[plan.kind][lang],
          body: bodyFor(plan.windowEnd, lang),
          data: { tag: TAG, kind: plan.kind },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(plan.triggerAt),
        },
      }),
    ),
  );
}
