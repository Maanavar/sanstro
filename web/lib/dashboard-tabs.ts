/**
 * The one shared dashboard Tab union (DASH-11). This type used to be
 * copy-pasted into dashboard-workspace / dashboard-left-rail / dashboard-hero /
 * dashboard-explore-tab-nova, which is exactly how the ghost `"transits"`
 * entry survived after transits moved under Plan — add or remove tab ids HERE
 * and every consumer type-fails together.
 *
 * `"transits"` remains in the union only so stale persisted state can be
 * recognized and remapped — the standalone transits tab itself was deleted
 * (DASH-17). No navigation offers it; localStorage restore maps it to
 * Plan → Transits (see sanitizeRestoredTab).
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

/** Tabs the rail/hero actually offer — the only values worth restoring from
 *  localStorage. `settings`/`onboarding` are excluded on purpose (the
 *  onboarding gate owns them) and `qa` is dev-only (caller checks). */
const RESTORABLE_TABS: readonly Tab[] = [
  "personal",
  "tools",
  "plan",
  "life-areas",
  "family",
  "calendar",
  "journal",
  "explore",
  "qa",
];

export type RestoredTabResolution =
  | { tab: Tab; planView?: "transits" }
  | null;

/**
 * Sanitizes a persisted `activeTab` (DASH-11). Unknown ids, unreachable ids,
 * and gate-owned ids return null (caller keeps its default). The retired
 * standalone `"transits"` tab maps to Plan with its Transits view active so
 * users who last used it land somewhere equivalent instead of a ghost tab.
 */
export function sanitizeRestoredTab(value: unknown, options: { qaEnabled: boolean }): RestoredTabResolution {
  if (typeof value !== "string") return null;
  if (value === "transits") return { tab: "plan", planView: "transits" };
  if (value === "qa") return options.qaEnabled ? { tab: "qa" } : { tab: "personal" };
  if ((RESTORABLE_TABS as readonly string[]).includes(value)) {
    return { tab: value as Tab };
  }
  return null;
}
