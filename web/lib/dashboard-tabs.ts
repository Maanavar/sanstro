/**
 * The one shared dashboard Tab union (DASH-11). This type used to be
 * copy-pasted into dashboard-workspace / dashboard-hero / dashboard-explore-
 * tab-nova — add or remove tab ids HERE and every consumer type-fails
 * together.
 *
 * `"transits"` is the standalone Transit & Dashas tab (dashboard-plan-
 * transits-nova.tsx's `NovaTransitsView`, reinstated as its own top-level
 * destination). `"plan"` is the Goals tab (dashboard-plan-tab-nova.tsx) —
 * same id as before, relabeled "Goals" in the nav since Transits split out
 * of it.
 */
export type Tab =
  | "onboarding"
  | "personal"
  | "tools"
  | "transits"
  | "plan"
  | "life-areas"
  | "family"
  | "calendar"
  | "journal"
  | "settings"
  | "qa"
  | "explore";

/** Tabs the hero nav actually offers — the only values worth restoring from
 *  localStorage. `settings`/`onboarding` are excluded on purpose (the
 *  onboarding gate owns them) and `qa` is dev-only (caller checks). */
const RESTORABLE_TABS: readonly Tab[] = [
  "personal",
  "tools",
  "plan",
  "transits",
  "life-areas",
  "family",
  "calendar",
  "journal",
  "explore",
  "qa",
];

export type RestoredTabResolution = { tab: Tab } | null;

/**
 * Sanitizes a persisted `activeTab` (DASH-11). Unknown ids, unreachable ids,
 * and gate-owned ids return null (caller keeps its default).
 */
export function sanitizeRestoredTab(value: unknown, options: { qaEnabled: boolean }): RestoredTabResolution {
  if (typeof value !== "string") return null;
  if (value === "qa") return options.qaEnabled ? { tab: "qa" } : { tab: "personal" };
  if ((RESTORABLE_TABS as readonly string[]).includes(value)) {
    return { tab: value as Tab };
  }
  return null;
}
