/**
 * The one shared dashboard Tab union (DASH-11). This type used to be
 * copy-pasted into dashboard-workspace / dashboard-hero / dashboard-explore-
 * tab-nova — add or remove tab ids HERE and every consumer type-fails
 * together.
 *
 * `"plan"` is the Goals tab (dashboard-plan-tab-nova.tsx). The former
 * standalone `"transits"` (Transit & Dashas) destination was removed
 * 2026-07-21 — its content now lives inside Family & Charts, which covers
 * the same transit overview, dasha timeline, and Sani cycle.
 */
export type Tab =
  | "onboarding"
  | "personal"
  | "tools"
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

/** The query param that addresses a dashboard tab: `/dashboard?tab=calendar`. */
export const TAB_QUERY_PARAM = "tab";

/** Tabs a URL may address. This is deliberately a SUPERSET of
 *  `RESTORABLE_TABS`: `settings` is excluded from localStorage restore (a
 *  stale session should not resurrect into Settings) but a link someone
 *  deliberately typed or shared *should* land there. `onboarding` stays out
 *  of both — it is derived from whether a profile exists, never addressed. */
const URL_ADDRESSABLE_TABS: readonly Tab[] = [...RESTORABLE_TABS, "settings"];

/**
 * Sanitizes a `?tab=` value into a real destination, or null when the param is
 * absent/unknown (caller falls back to localStorage, then to the default).
 *
 * Unknown ids resolve to null rather than throwing or 404-ing: a URL is
 * user-editable input, and a typo should degrade to the default tab, not to an
 * error screen.
 */
export function sanitizeUrlTab(value: unknown, options: { qaEnabled: boolean }): RestoredTabResolution {
  if (typeof value !== "string") return null;
  if (value === "qa") return options.qaEnabled ? { tab: "qa" } : null;
  if ((URL_ADDRESSABLE_TABS as readonly string[]).includes(value)) {
    return { tab: value as Tab };
  }
  return null;
}
