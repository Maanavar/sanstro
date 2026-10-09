"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  DEFAULT_SETTINGS_SECTION, TAB_QUERY_PARAM, dashboardPath, isDashboardTool,
  parseDashboardPath, sanitizeUrlTab, type DashboardTool, type Tab,
} from "@/lib/dashboard-tabs";
import type { SettingsSectionId } from "@/components/dashboard-settings-rail";

export const ENABLE_QA_TAB = process.env.NODE_ENV !== "production";

export type SettingsSubTab = "setup" | "session";

/**
 * The workspace's destination: which tab, tool and settings section is on
 * screen, how that is mirrored into the URL and history, which panes stay
 * mounted, where the scroll lands, and the cross-tab focus requests that pick a
 * section inside the destination. The workspace calls `adoptUrlDestination`
 * and then `enableUrlSync` from its hydration effect, once `/auth/me` answers.
 */
export function useWorkspaceNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlTabParam = searchParams.get(TAB_QUERY_PARAM);
  // Seeded from the PATH at first render, not hardcoded to "personal".
  //
  // This matters on a cold arrival: someone opening or reloading
  // `/dashboard/calendar` must land on Calendar in the very first paint. With a
  // hardcoded default they got **Today** first and only moved to the real
  // destination once the hydration effect below had resolved — and that effect
  // waits on `/auth/me`, so the wrong screen sat there for a whole round trip.
  //
  // `usePathname()` already knows the destination on that first render; nothing
  // has to be awaited to read it. The hydration effect still runs and is now a
  // no-op for this value, but it still owns the one case a path cannot answer:
  // the legacy `?tab=` param, which only applies when the path names nothing.
  // A bare path is Today; the last tab is not restored (DXA-02, D1).
  //
  // In-app tab clicks no longer go through any of this: the workspace is
  // mounted by app/dashboard/(workspace)/layout.tsx, which the router keeps
  // alive across every /dashboard ⇄ /dashboard/* move, so a tab change is state
  // plus a URL rewrite and this initialiser runs once per real page load.
  const [activeTab, setActiveTab] = useState<Tab>(
    () => parseDashboardPath(pathname, { qaEnabled: ENABLE_QA_TAB }).tab ?? "personal",
  );
  const [exploreReturnTab, setExploreReturnTab] = useState<Tab | null>(null);
  // Settings is two panes (setup / session) over nine rail sections, and the
  // URL names the SECTION — the pane is derived from it, because "setup" is
  // the only section the setup pane draws. Seeded from the path for the same
  // reason `activeTool` is: `/dashboard/settings/notifications` must land on
  // Notifications, not land on the default and slide there a render later.
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>(
    () => (parseDashboardPath(pathname, { qaEnabled: ENABLE_QA_TAB }).section ?? DEFAULT_SETTINGS_SECTION) === "setup"
      ? "setup"
      : "session",
  );
  const [settingsSection, setSettingsSection] = useState<SettingsSectionId>(() => {
    // "setup" is the other pane's section, never this one's — seeding it here
    // would hand the session pane a section it cannot draw.
    const fromPath = parseDashboardPath(pathname, { qaEnabled: ENABLE_QA_TAB }).section;
    return fromPath && fromPath !== "setup" ? fromPath : "account";
  });
  // Which pane is on screen right now. Settings splits into two independent
  // panes (setup / session) that need the same keep-alive treatment as a top-
  // level tab, so it gets its own compound key; every other tab is just itself.
  const currentPaneKey = activeTab === "settings" ? `settings-${settingsSubTab}` : activeTab;
  // The one settings value the URL carries. The two states above cannot
  // disagree about it — the setup pane draws exactly the "setup" section — so
  // the path names the section and the pane is recovered from it on the way
  // back in. Ignored by `dashboardPath` on every tab but `settings`.
  const urlSettingsSection: SettingsSectionId = settingsSubTab === "setup" ? "setup" : settingsSection;
  // Panes are mounted once and never unmounted again (see `TabPane`) —
  // switching tabs used to fully unmount/remount the outgoing and incoming
  // tab's whole subtree (a single AnimatePresence child keyed by the tab), so
  // every panel with its own local `loading` state re-showed that loading
  // state on every single revisit, even though it had already loaded. This
  // ref is the record of which panes have ever been on screen; once true for
  // a pane, it stays mounted and is just hidden via CSS instead.
  const visitedPanesRef = useRef<Set<string> | null>(null);
  if (visitedPanesRef.current === null) visitedPanesRef.current = new Set([currentPaneKey]);
  useEffect(() => {
    visitedPanesRef.current?.add(currentPaneKey);
  }, [currentPaneKey]);
  const isPaneRendered = useCallback(
    (key: string) => key === currentPaneKey || (visitedPanesRef.current?.has(key) ?? false),
    [currentPaneKey],
  );

  // ── Destination ⇄ URL ────────────────────────────────────
  // The tab AND the open tool are addressable as path segments
  // (`/dashboard/calendar`, `/dashboard/tools/numerology`) so both can be
  // deep-linked, bookmarked, and walked with browser back/forward. Segments,
  // not the `?tab=` query param this used to write — see lib/dashboard-tabs.ts
  // for the slug vocabulary and for how the legacy param still resolves.
  //
  // push vs. replace: a destination the *user* chose is a navigation and earns
  // a history entry (back should undo it). One the *app* chose — the setup
  // gate, the QA fallback, a post-save redirect — is a correction, and pushing
  // those would trap the user in a loop where back re-triggers the same
  // redirect. So the intent-carrying helpers below (goToTab, openTool, …) flag
  // "push"; every other setActiveTab call site falls through to "replace" by
  // default, which is what they want.
  const navIntentRef = useRef<"push" | "replace">("replace");
  // State, not a ref: the outbound effect depends on it, so flipping it at the
  // end of hydration triggers one normalising write. That is what rewrites a
  // legacy `?tab=` link, or a mistyped path, to its canonical URL even when the
  // resolved tab happens to equal the default and no other dependency changes.
  const [urlSyncReady, setUrlSyncReady] = useState(false);
  const goToTab = useCallback((tab: Tab) => {
    navIntentRef.current = "push";
    setExploreReturnTab(null);
    setActiveTab(tab);
  }, []);

  const goToExploreDestination = useCallback((tab: Tab) => {
    navIntentRef.current = "push";
    setExploreReturnTab(tab);
    setActiveTab(tab);
  }, []);

  const returnToExplore = useCallback(() => {
    navIntentRef.current = "push";
    setExploreReturnTab(null);
    setActiveTab("explore");
  }, []);
  // The open tool is ONE value, not nine booleans (it was nine until
  // 2026-07-28). Only one tool panel can be open at a time — the old setters
  // were only ever called together, from openTool/closeTool, each assigning
  // `toolId === "…"` — so the booleans could never legally disagree, and
  // collapsing them is what lets the tool be addressable in the URL alongside
  // the tab.
  // Seeded from the path for the same reason as `activeTab` above — otherwise
  // `/dashboard/tools/numerology` lands on the Tools card grid and only opens
  // the panel a round-trip later. `parseDashboardPath` only ever reports a tool
  // under the `tools` tab, so this cannot disagree with the tab seeded above.
  const [activeTool, setActiveTool] = useState<DashboardTool | null>(
    () => parseDashboardPath(pathname, { qaEnabled: ENABLE_QA_TAB }).tool,
  );

  // Cross-tab sub-tab focus for Life Areas — lets a link-out (Family's
  // "View all remedies →" / "Forecast →") land on the correct populated
  // sub-tab, not just the tab's default Overview (IA audit 2026-07-22).
  const [lifeAreasFocusSubTab, setLifeAreasFocusSubTab] = useState<string | null>(null);
  const focusLifeAreas = useCallback((sub: string) => {
    setLifeAreasFocusSubTab(sub);
    goToTab("life-areas");
  }, [goToTab]);

  // Cross-tab view focus for Calendar — lets Goals' "Best Dates & Muhurta in
  // Calendar →" open the muhurta view directly (IA audit 2026-07-22, Phase 3).
  const [calendarFocusView, setCalendarFocusView] = useState<string | null>(null);
  const focusCalendar = useCallback((view: string) => {
    setCalendarFocusView(view);
    goToTab("calendar");
  }, [goToTab]);

  // Cross-tab section focus for Family & Charts — the Today tab's Dasa Chapter
  // "Open →" and Family Today "Family →" used to both dump the user at the top
  // of the family page; these land them on the actual section (#hy-dashas /
  // #hy-members) instead.
  const [familyFocusSection, setFamilyFocusSection] = useState<string | null>(null);
  const focusFamily = useCallback((section: string) => {
    setFamilyFocusSection(section);
    goToTab("family");
  }, [goToTab]);

  // ── Scroll reset on destination change ───────────────────
  // Panes are kept mounted and hidden with CSS rather than unmounted, and the
  // workspace itself no longer remounts on navigation (the router keeps the
  // (workspace) layout alive), so nothing resets the window scroll on a tab
  // change any more — it used to be a side effect of the remount this fix
  // removed. Without it, leaving a tab from halfway down dropped you into the
  // middle of the next one.
  //
  // Skipped on the first render, which belongs to whatever the arriving URL
  // named (including its anchor), and skipped whenever a cross-tab focus
  // request is in flight — focusLifeAreas/focusCalendar/focusFamily place the
  // scroll themselves, and the family deep-link retries for up to ~4s, so
  // yanking to the top here would fight them.
  const scrollResetPrimedRef = useRef(false);
  useEffect(() => {
    if (!scrollResetPrimedRef.current) {
      scrollResetPrimedRef.current = true;
      return;
    }
    if (familyFocusSection || lifeAreasFocusSubTab || calendarFocusView) return;
    // `auto`, not `smooth`: the destination is already fading in under the
    // TabPane transition, and a competing smooth scroll reads as the page
    // sliding out from under the content.
    window.scrollTo({ top: 0, behavior: "auto" });
  // The focus values are read as an escape hatch, not as triggers — only an
  // actual destination change should reset the scroll.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPaneKey, activeTool]);

  useEffect(() => {
    if (!ENABLE_QA_TAB && activeTab === "qa") {
      setActiveTab("personal");
    }
  }, [activeTab]);

  // Opening/closing a tool is a navigation: it earns a history entry and a URL
  // (`/dashboard/tools/numerology`), so Back leaves the tool the way it leaves
  // a tab. An unrecognised id closes the panel rather than opening nothing —
  // the Tools tab's card specs also carry the two cross-nav ids, which never
  // reach here.
  const openTool = useCallback((toolId: string) => {
    navIntentRef.current = "push";
    setActiveTool(isDashboardTool(toolId) ? toolId : null);
  }, []);
  const closeTool = useCallback(() => {
    navIntentRef.current = "push";
    setActiveTool(null);
  }, []);
  const focusTool = useCallback((toolId: string) => {
    openTool(toolId);
    goToTab("tools");
  }, [openTool, goToTab]);

  // A destination in the URL is an explicit instruction and outranks the
  // restored session. Resolved outside the isSameUser branch on purpose: a
  // link shared with someone else must still land where it names, even though
  // that person's localStorage belongs to a different user and gets cleared.
  //
  // Legacy fallback: `/dashboard?tab=tools` was the scheme until 2026-07-28
  // and is still out there in bookmarks and shared links, so the param is
  // consulted when the path itself names nothing. The outbound sync below
  // then rewrites the URL to the path form and drops the param.
  function adoptUrlDestination() {
    const fromPath = parseDashboardPath(pathname, { qaEnabled: ENABLE_QA_TAB });
    const fromLegacyParam = fromPath.tab ? null : sanitizeUrlTab(urlTabParam, { qaEnabled: ENABLE_QA_TAB });
    const fromUrl = fromPath.tab ?? fromLegacyParam?.tab ?? null;
    if (fromUrl) {
      setActiveTab(fromUrl);
      setActiveTool(fromUrl === "tools" ? fromPath.tool : null);
      if (fromUrl === "settings") {
        // Also covers the legacy `?tab=settings`, which names no section: that
        // resolves to the default here and the outbound sync writes the
        // section into the path on its way to dropping the param.
        const section = fromPath.section ?? DEFAULT_SETTINGS_SECTION;
        setSettingsSubTab(section === "setup" ? "setup" : "session");
        if (section !== "setup") setSettingsSection(section);
      }
    }
  }

  // Only once this has run may the outbound sync write to the URL — before
  // that `activeTab` is still the "personal" default and would overwrite the
  // very destination the hydration effect just read.
  function enableUrlSync() {
    setUrlSyncReady(true);
  }

  // ── Destination → URL (outbound) ──────────────────────────
  // Mirrors the active tab and open tool into the path. Keyed on those two
  // state values (plus the readiness latch) ALONE — never on `pathname`. That
  // distinction is what stops the back/forward ping-pong: a browser Back
  // changes only the URL (activeTab still lags one render), and if this effect
  // also woke on that change it would write the *old* destination straight back
  // into the URL, undoing the Back and fighting the inbound effect below — the
  // two would then flip each other forever. By waking only when the state
  // itself changes, a Back is handled solely by the inbound effect (URL →
  // state); this effect then re-runs once the state has caught up, sees the URL
  // already correct, and bails. `pathname` is still read fresh from render
  // scope for that bail check.
  useEffect(() => {
    if (!urlSyncReady) return;
    const nextPath = dashboardPath(activeTab, { tool: activeTool, section: urlSettingsSection });
    // Everything except the superseded `?tab=` survives the rewrite — the
    // destination lives in the path now, so carrying the old param forward
    // would leave `/dashboard/tools?tab=tools` in the address bar.
    const query = new URLSearchParams(Array.from(searchParams.entries()));
    query.delete(TAB_QUERY_PARAM);
    const nextSearch = query.toString();
    if (nextPath === pathname && nextSearch === searchParams.toString()) return;
    const href = nextSearch ? `${nextPath}?${nextSearch}` : nextPath;
    const intent = navIntentRef.current;
    navIntentRef.current = "replace";
    // scroll: false — the scroll reset above already owns this, and it can tell
    // a plain tab switch from a cross-tab jump that wants to land on a section.
    // The router's blanket jump-to-top cannot, and fights both the panel
    // transition and those deep links.
    if (intent === "push") router.push(href, { scroll: false });
    else router.replace(href, { scroll: false });
  // searchParams/pathname/router are stable per navigation; pathname is read
  // for the bail but deliberately NOT a dependency (see comment above).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, activeTool, urlSettingsSection, urlSyncReady]);

  // ── URL → destination (inbound) ───────────────────────────
  // Back/forward and hand-edited URLs. Guarded the same way as the outbound
  // effect.
  useEffect(() => {
    if (!urlSyncReady) return;
    const fromUrl = parseDashboardPath(pathname, { qaEnabled: ENABLE_QA_TAB });
    // A path naming no tab means Today here, NOT "leave things alone" — Back to
    // a bare `/dashboard` must actually land on Today rather than stranding the
    // previous tab on screen under a URL that no longer describes it. The
    // hydration effect reads the same null the same way: bare means Today.
    const nextTab = fromUrl.tab ?? "personal";
    const nextTool = nextTab === "tools" ? fromUrl.tool : null;
    // Bare `/dashboard/settings` names no section, so it means the default —
    // the same "a URL is user-editable input" rule the parser applies to a
    // typo'd slug. The outbound sync then writes the explicit path back.
    const nextSection = nextTab === "settings" ? fromUrl.section ?? DEFAULT_SETTINGS_SECTION : null;
    if (nextTab === activeTab && nextTool === activeTool && (nextSection === null || nextSection === urlSettingsSection)) return;
    // A history move is not a new navigation — never push in response to one.
    navIntentRef.current = "replace";
    setExploreReturnTab(null);
    setActiveTab(nextTab);
    setActiveTool(nextTool);
    if (nextSection) {
      setSettingsSubTab(nextSection === "setup" ? "setup" : "session");
      if (nextSection !== "setup") setSettingsSection(nextSection);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, urlSyncReady]);

  function openSetupInSettings() {
    setActiveTab("settings");
    setSettingsSubTab("setup");
  }

  // Unified navigation for the Settings rail: "setup" routes to the onboarding
  // sub-tab; every other id routes to the session panels and selects a section.
  function navigateSettings(id: SettingsSectionId) {
    setActiveTab("settings");
    if (id === "setup") {
      setSettingsSubTab("setup");
    } else {
      setSettingsSubTab("session");
      setSettingsSection(id);
    }
  }

  return {
    activeTab, setActiveTab, activeTool, settingsSubTab, setSettingsSubTab, settingsSection,
    isPaneRendered, exploreReturnTab,
    goToTab, goToExploreDestination, returnToExplore, openTool, closeTool, focusTool,
    openSetupInSettings, navigateSettings, adoptUrlDestination, enableUrlSync,
    lifeAreasFocusSubTab, focusLifeAreas, consumeLifeAreasFocus: () => setLifeAreasFocusSubTab(null),
    calendarFocusView, focusCalendar, consumeCalendarFocus: () => setCalendarFocusView(null),
    familyFocusSection, focusFamily, consumeFamilyFocus: () => setFamilyFocusSection(null),
  };
}
