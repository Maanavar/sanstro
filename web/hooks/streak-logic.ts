// Pure streak transition logic (no React, no network) so it is unit-testable in
// isolation. Consumed by useStreak.ts; see useStreak.test.ts. (UXD-18)

// Forgiveness: a single missed day does not break the streak, but only once per
// rolling window — so it stays a genuine daily habit, not every-other-day.
export const GRACE_WINDOW_DAYS = 7;

export type StreakState = {
  days: number;
  lastVisit: string; // local date "YYYY-MM-DD"
  best: number; // longest streak reached (for the Wrapped / pride surface)
  graceUsedOn?: string; // local date a forgiveness ("rest day") was last applied
};

export function toLocalIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayIso(): string {
  return toLocalIso(new Date());
}

/** Whole-day difference (b - a) between two "YYYY-MM-DD" local dates. */
export function dayGap(aIso: string, bIso: string): number {
  const a = new Date(`${aIso}T00:00:00`);
  const b = new Date(`${bIso}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/**
 * Given the previous stored state (or null) and today's local date, return the
 * next state plus whether a forgiveness grace was spent to keep the streak alive.
 */
export function computeStreak(prev: StreakState | null, today: string): { state: StreakState; forgiven: boolean } {
  if (!prev || !prev.lastVisit) {
    return { state: { days: 1, lastVisit: today, best: Math.max(1, prev?.best ?? 0) }, forgiven: false };
  }

  const gap = dayGap(prev.lastVisit, today);
  const prevBest = prev.best ?? prev.days ?? 1;

  // Same day (or a clock that ran backwards) — nothing changes.
  if (gap <= 0) {
    return {
      state: { days: prev.days, lastVisit: today, best: Math.max(prevBest, prev.days), graceUsedOn: prev.graceUsedOn },
      forgiven: false,
    };
  }

  // Consecutive day — increment.
  if (gap === 1) {
    const days = prev.days + 1;
    return { state: { days, lastVisit: today, best: Math.max(prevBest, days), graceUsedOn: prev.graceUsedOn }, forgiven: false };
  }

  // Missed exactly one day — forgive once per rolling window, else reset.
  if (gap === 2) {
    const graceRecentlyUsed = prev.graceUsedOn ? dayGap(prev.graceUsedOn, today) < GRACE_WINDOW_DAYS : false;
    if (!graceRecentlyUsed) {
      const days = prev.days + 1;
      return { state: { days, lastVisit: today, best: Math.max(prevBest, days), graceUsedOn: today }, forgiven: true };
    }
  }

  // Longer gap (or grace already spent) — reset, but remember the personal best.
  return { state: { days: 1, lastVisit: today, best: Math.max(prevBest, 1) }, forgiven: false };
}
