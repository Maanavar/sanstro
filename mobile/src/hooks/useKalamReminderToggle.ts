import { useCallback, useEffect, useState } from "react";

import { ensureKalamReminderPermission } from "@/lib/kalamNotificationScheduler";
import { getKalamReminderPrefs, setKalamReminderPref } from "@/lib/kalamReminderPrefs";
import type { KalamReminderKind, KalamReminderPrefs } from "@/lib/kalamReminders";

const OFF: KalamReminderPrefs = { rahuKalam: false, yamagandam: false };

/**
 * The Settings-screen half of the kalam reminder feature: read and flip the
 * device-local opt-in toggles. Scheduling itself happens in
 * `useKalamReminders`, mounted on the Today tab where today's kalam times
 * are already loaded — this hook only owns the switch and the permission
 * prompt behind turning one on.
 */
export function useKalamReminderToggle() {
  const [prefs, setPrefs] = useState<KalamReminderPrefs | null>(null);

  useEffect(() => {
    void getKalamReminderPrefs().then(setPrefs);
  }, []);

  const setKind = useCallback(async (kind: KalamReminderKind, enabled: boolean): Promise<boolean> => {
    if (enabled && !(await ensureKalamReminderPermission())) return false;
    await setKalamReminderPref(kind, enabled);
    setPrefs((prev) => ({ ...(prev ?? OFF), [kind]: enabled }));
    return true;
  }, []);

  return { prefs, setKind };
}
