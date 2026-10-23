import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import type { Lang } from "@vinaadi/shared";

import { applyKalamReminderPlans } from "@/lib/kalamNotificationScheduler";
import { planKalamReminders, type KalamReminderPrefs, type KalamWindows } from "@/lib/kalamReminders";
import { getKalamReminderPrefs } from "@/lib/kalamReminderPrefs";

export interface UseKalamRemindersArgs {
  /** `panchangam.kalam` off today's snapshot; undefined while it is loading. */
  kalam: KalamWindows | null | undefined;
  dateLocal: string | null | undefined;
  timeZone: string | null | undefined;
  lang: Lang;
}

/**
 * Opt-in local reminders for Rahu Kalam / Yamagandam
 * (docs/HOME_CALENDAR_CHARTS_PROPOSALS_2026-09-22.md §1, R1). The toggle
 * itself lives in Settings (`useKalamReminderToggle`, a separate device-only
 * store) — this hook only re-reads it and rebuilds the device's scheduled
 * notifications, from the Today tab, where today's kalam times already load.
 *
 * Prefs are re-read `useFocusEffect`, not just on mount: Today is a tab and
 * stays mounted while the reader visits Settings and flips a toggle there: a
 * mount-only read would never see that change until the app restarted.
 */
export function useKalamReminders({ kalam, dateLocal, timeZone, lang }: UseKalamRemindersArgs) {
  const [prefs, setPrefs] = useState<KalamReminderPrefs | null>(null);

  useFocusEffect(
    useCallback(() => {
      void getKalamReminderPrefs().then(setPrefs);
    }, []),
  );

  useEffect(() => {
    if (!prefs || !dateLocal) return;
    if (!prefs.rahuKalam && !prefs.yamagandam) {
      void applyKalamReminderPlans([], lang);
      return;
    }
    const plans = planKalamReminders(kalam, prefs, { now: new Date(), dateLocal, timeZone });
    void applyKalamReminderPlans(plans, lang);
  }, [prefs, kalam, dateLocal, timeZone, lang]);
}
