import AsyncStorage from "@react-native-async-storage/async-storage";

import { KALAM_REMINDER_KINDS, type KalamReminderKind, type KalamReminderPrefs } from "./kalamReminders";

/**
 * Device-local only, deliberately not the server-synced
 * `NotificationPreferenceData` (mobile/src/api/notifications.ts): the PO/UX
 * ruling for this feature (docs/HOME_CALENDAR_CHARTS_PROPOSALS_2026-09-22.md
 * §1) is local scheduled notifications precisely because they are exact, work
 * offline and add no server load. Syncing the toggle to the server would also
 * need every surface to say which of a reader's devices "remembers" it — a
 * question this feature was chosen specifically to avoid. Off by default:
 * opt-in, per the same ruling.
 */
const KEY_PREFIX = "@vinaadi/kalam_reminder/";

const DEFAULT_PREFS: KalamReminderPrefs = { rahuKalam: false, yamagandam: false };

export async function getKalamReminderPrefs(): Promise<KalamReminderPrefs> {
  const entries = await Promise.all(
    KALAM_REMINDER_KINDS.map(
      async (kind) => [kind, (await AsyncStorage.getItem(KEY_PREFIX + kind)) === "1"] as const,
    ),
  );
  return { ...DEFAULT_PREFS, ...Object.fromEntries(entries) };
}

export async function setKalamReminderPref(kind: KalamReminderKind, enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY_PREFIX + kind, enabled ? "1" : "0");
}
