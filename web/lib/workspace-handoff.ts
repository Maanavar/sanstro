/**
 * What the utility pages (Inbox, Glossary, Reports) and the dashboard
 * workspace pass to each other. They are separate route trees, so nothing in
 * React state survives the move between them.
 *
 * Browser storage only, and every access is guarded: private windows and
 * blocked site data throw on access, and then the hand-off is simply lost
 * (the workspace opens on today, the sub-bar on the first family).
 */

/** The workspace's persisted session blob. Owned by dashboard-workspace.tsx;
 *  exported here so readers outside it do not copy the string. */
export const WORKSPACE_STORAGE_KEY = "jothidam-ai-dashboard-state";

const DAY_HANDOFF_KEY = "vinaadi-dashboard-day-handoff";
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The family the workspace last had selected, if the blob belongs to this
 *  user. Another account's blob on a shared browser must not name a vault. */
export function readPersistedVaultId(userId: string): string | null {
  if (!userId) return null;
  try {
    const raw = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ownerUserId?: unknown; selectedVaultId?: unknown };
    if (parsed.ownerUserId !== userId) return null;
    return typeof parsed.selectedVaultId === "string" && parsed.selectedVaultId ? parsed.selectedVaultId : null;
  } catch {
    return null;
  }
}

/**
 * A date picked in a utility page's sub-bar, for Today to open on.
 *
 * Its own one-shot key rather than a write into the persisted blob: the
 * workspace drops a persisted date that is already in the past (a stale
 * browse must not pin the dashboard to an old day), and a date the reader has
 * just picked is not stale, whichever way it points.
 */
export function handOffDashboardDay(date: string): void {
  if (!ISO_DAY.test(date)) return;
  try {
    window.sessionStorage.setItem(DAY_HANDOFF_KEY, date);
  } catch {
    // Storage blocked: Today opens on today.
  }
}

/** Reads and clears the hand-off, so a later plain visit is not affected. */
export function takeDashboardDayHandoff(): string | null {
  try {
    const value = window.sessionStorage.getItem(DAY_HANDOFF_KEY);
    // Only touch storage when there was something to take: an ordinary
    // dashboard load should leave no write behind.
    if (value === null) return null;
    window.sessionStorage.removeItem(DAY_HANDOFF_KEY);
    return ISO_DAY.test(value) ? value : null;
  } catch {
    return null;
  }
}
