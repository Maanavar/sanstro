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

/** The LEGACY query param that used to address a dashboard tab
 *  (`/dashboard?tab=calendar`). Superseded 2026-07-28 by path segments — see
 *  `dashboardPath` below. Still read once on hydration so links shared or
 *  bookmarked under the old scheme resolve; the outbound sync then rewrites
 *  them to the path form. Nothing writes this param any more. */
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

// ── Path-segment addressing ─────────────────────────────────────────────────

/** The ten inline tools the Tools tab can open. The two `kind: "cross-nav"`
 *  cards (Muhurta, Panchangam) are NOT here — they navigate to the Goals and
 *  Calendar tabs rather than opening a panel, so they have no tool URL. */
export type DashboardTool =
  | "porutham"
  | "chartgen"
  | "wrapped"
  | "retro"
  | "rasipalan"
  | "activityTiming"
  | "varshaphala"
  | "synastry"
  | "numerology"
  | "babynames";

export const DASHBOARD_BASE_PATH = "/dashboard";

/**
 * Tab id → URL segment. The slug is what a person reads in the address bar, so
 * it follows the nav LABEL, not the internal id: the tab whose id is `personal`
 * is labelled "Today", and `plan` is labelled "Goals".
 *
 * `personal` maps to null because it is the canonical bare `/dashboard` — see
 * `dashboardPath`. `onboarding` maps to null because it is derived from whether
 * a profile exists and is never addressable (same rule `sanitizeUrlTab` applies).
 */
const TAB_SLUGS: Record<Tab, string | null> = {
  onboarding: null,
  personal: null,
  tools: "tools",
  plan: "goals",
  "life-areas": "life-areas",
  family: "family",
  calendar: "calendar",
  journal: "journal",
  settings: "settings",
  qa: "qa",
  explore: "explore",
};

/** Extra inbound-only aliases. `/dashboard/today` is what someone will type or
 *  hand-edit for the Today tab; it resolves, but `dashboardPath` never writes
 *  it back — bare `/dashboard` stays canonical. */
const TAB_SLUG_ALIASES: Record<string, Tab> = {
  today: "personal",
};

/** Tool id → URL segment, same readability rule as the tabs: the slug follows
 *  the tool card's name, not the internal id (`chartgen` is "Jadhagam
 *  Generator", `synastry` is "Compatibility", `activityTiming` would otherwise
 *  leak camelCase into the address bar). */
const TOOL_SLUGS: Record<DashboardTool, string> = {
  porutham: "porutham",
  chartgen: "jadhagam-generator",
  wrapped: "annual-wrapped",
  retro: "retrospective",
  rasipalan: "rasipalan",
  activityTiming: "activity-timing",
  varshaphala: "varshaphala",
  synastry: "compatibility",
  numerology: "numerology",
  babynames: "baby-name-finder",
};

const TAB_BY_SLUG: Record<string, Tab> = {
  ...TAB_SLUG_ALIASES,
  ...Object.fromEntries(
    Object.entries(TAB_SLUGS)
      .filter((entry): entry is [Tab, string] => typeof entry[1] === "string")
      .map(([tab, slug]) => [slug, tab]),
  ),
};

const TOOL_BY_SLUG: Record<string, DashboardTool> = Object.fromEntries(
  Object.entries(TOOL_SLUGS).map(([tool, slug]) => [slug, tool as DashboardTool]),
);

/** Narrows the `string` tool ids the Tools tab passes to `onOpenTool` (its card
 *  specs also carry the two cross-nav ids) down to a real tool. */
export function isDashboardTool(value: unknown): value is DashboardTool {
  return typeof value === "string" && value in TOOL_SLUGS;
}

/**
 * Builds the canonical URL path for a dashboard destination.
 *
 * `/dashboard` (Today) · `/dashboard/calendar` · `/dashboard/tools` ·
 * `/dashboard/tools/numerology`.
 *
 * A tool segment is only ever appended under `tools` — no other tab hosts one,
 * and emitting e.g. `/dashboard/calendar/numerology` would advertise a
 * destination that cannot be re-entered.
 */
export function dashboardPath(tab: Tab, tool?: DashboardTool | null): string {
  const slug = TAB_SLUGS[tab];
  if (!slug) return DASHBOARD_BASE_PATH;
  if (tab === "tools" && tool) return `${DASHBOARD_BASE_PATH}/${slug}/${TOOL_SLUGS[tool]}`;
  return `${DASHBOARD_BASE_PATH}/${slug}`;
}

export type DashboardRoute = {
  /** null means "this path names no tab" — bare `/dashboard`, or a slug that
   *  does not resolve. The caller decides what that means, and the two callers
   *  deliberately differ: on first load it hands off to the localStorage
   *  restore, but a later history move treats it as Today (otherwise Back to
   *  `/dashboard` would leave the previous tab on screen under a URL that no
   *  longer describes it). */
  tab: Tab | null;
  tool: DashboardTool | null;
};

/**
 * Resolves a pathname into a dashboard destination.
 *
 * Unknown slugs resolve to null rather than throwing or 404-ing, for the same
 * reason `sanitizeUrlTab` does: a URL is user-editable input, and a typo should
 * degrade to the fallback tab (which the outbound sync then rewrites to the
 * canonical path), not to an error screen.
 */
export function parseDashboardPath(pathname: string, options: { qaEnabled: boolean }): DashboardRoute {
  const none: DashboardRoute = { tab: null, tool: null };
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== "dashboard") return none;

  const tabSlug = segments[1];
  if (!tabSlug) return none;
  const tab = TAB_BY_SLUG[tabSlug];
  if (!tab) return none;
  if (tab === "qa" && !options.qaEnabled) return none;
  if (tab !== "tools") return { tab, tool: null };

  const toolSlug = segments[2];
  return { tab, tool: (toolSlug && TOOL_BY_SLUG[toolSlug]) || null };
}
