import { timeOnDateToMs } from "@vinaadi/shared/utils/tz";

export type KalamReminderKind = "rahuKalam" | "yamagandam";

export interface KalamReminderPrefs {
  rahuKalam: boolean;
  yamagandam: boolean;
}

export const KALAM_REMINDER_KINDS: readonly KalamReminderKind[] = ["rahuKalam", "yamagandam"];

/** docs/HOME_CALENDAR_CHARTS_PROPOSALS_2026-09-22.md §1 PO/UX: "remind me 10
 *  min before Rahu Kalam". */
export const KALAM_REMINDER_LEAD_MINUTES = 10;

export interface KalamWindow {
  start: string;
  end: string;
}

export type KalamWindows = Record<KalamReminderKind, KalamWindow>;

export interface KalamReminderPlan {
  kind: KalamReminderKind;
  /** Epoch ms the local notification should fire at. */
  triggerAt: number;
  windowStart: string;
  windowEnd: string;
}

/**
 * Which of today's opted-in kalams still deserve a local reminder.
 *
 * Kuligai is never planned here, even if a caller passed a truthy pref for
 * it: R5 (docs/HOME_CALENDAR_CHARTS_PROPOSALS_2026-09-22.md) rules Kuligai is
 * not a plain avoid period — it is good for repeat-worthy acquisitions and
 * bad only for a wedding or surgery — and a "10 minutes before" reminder,
 * worded like the Rahu/Yama ones, would misstate that. `KALAM_REMINDER_KINDS`
 * simply does not include it, so there is no wording to get wrong.
 *
 * A kalam already running, or already over, gets no reminder: a "10 minutes
 * before" notification firing after the fact would be confusing, not useful.
 * Same reasoning as web's `resolveKalamStatus` in `web/lib/kalam-live.ts`,
 * independently arrived at because the two run in different runtimes, but
 * both resolve "now" through the one shared `timeOnDateToMs`.
 */
export function planKalamReminders(
  kalam: KalamWindows | null | undefined,
  prefs: KalamReminderPrefs,
  options: { now: Date; dateLocal: string; timeZone?: string | null },
): KalamReminderPlan[] {
  if (!kalam) return [];

  const plans: KalamReminderPlan[] = [];
  const nowMs = options.now.getTime();
  for (const kind of KALAM_REMINDER_KINDS) {
    if (!prefs[kind]) continue;
    const slot = kalam[kind];
    const startMs = timeOnDateToMs(options.dateLocal, slot.start, options.timeZone);
    if (startMs === null) continue;
    const triggerAt = startMs - KALAM_REMINDER_LEAD_MINUTES * 60_000;
    if (triggerAt <= nowMs) continue;
    plans.push({ kind, triggerAt, windowStart: slot.start, windowEnd: slot.end });
  }
  return plans;
}
