"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { toast } from "sonner";
import { apiFetchJson, toQuery } from "@/lib/api";
import { getFriendlyErrorMessage } from "@/lib/error-messages";
import { isBirthDateWithinBounds } from "@/lib/birth-date";
import {
  TAB_QUERY_PARAM, dashboardPath, isDashboardTool, parseDashboardPath,
  sanitizeRestoredTab, sanitizeUrlTab, type DashboardTool, type Tab,
} from "@/lib/dashboard-tabs";
import { todayIso } from "@/lib/format";
import { DUR, EASE_NOVA } from "@/lib/motion";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { parseLatitude, parseLongitude } from "@/lib/validation";
import type {
  ApiEnvelope,
  BirthProfileCreateResponseData,
  FamilyAggregateMember,
  FamilyVaultListItem,
  LifeMode,
  LifeModeStatus,
  NotificationInboxItem,
  NotificationInboxResponse,
} from "@/lib/types";

import { useSession } from "@/hooks/useSession";
import { usePersonalData } from "@/hooks/usePersonalData";
import { useFamilyData, type MemberChart } from "@/hooks/useFamilyData";
import { usePlanData } from "@/hooks/usePlanData";
import { useJournalData } from "@/hooks/useJournalData";

import type { EditMemberState } from "./dashboard-edit-member-modal";
import type { SettingsSectionId } from "./dashboard-settings-rail";
import { ConfirmDialog, type ConfirmDialogState } from "./modal-shell";
import type { StatusMessage } from "./dashboard-ui-nova";
import { CelestialAmbientNova } from "./celestial-ambient-nova";
import { moonPhaseFromTithi } from "@/lib/lunar";
import { DashboardHero } from "./dashboard-hero";
import { DashboardFooterMorningGuidance } from "./dashboard-footer-morning-nova";
import { LifeModePicker } from "./life-mode-picker";
import { DashboardAskVinaadiWidget } from "./dashboard-ask-vinaadi-widget";

const STORAGE_KEY = "jothidam-ai-dashboard-state";
const ENABLE_QA_TAB = process.env.NODE_ENV !== "production";

import { SkeletonDashboardCard } from "@/components/skeleton";

function LazyPanelFallback() {
  return (
    <div className="lazy-panel-fallback">
      <SkeletonDashboardCard lines={4} showIcon />
      <SkeletonDashboardCard lines={3} />
    </div>
  );
}

// UXD-12 — modals load as an overlay, so their loading state should be a
// modal-shaped skeleton (dimmed backdrop + centered panel), not the inline
// dashboard-card skeleton the tab panels use.
function LazyModalFallback() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "var(--ink-overlay)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
      }}
    >
      <div
        style={{
          width: "min(480px, 100%)",
          background: "var(--color-surface, var(--panel-cream))",
          border: "1px solid var(--color-border, var(--panel-tan-light))",
          borderRadius: "16px", padding: "24px",
          boxShadow: "0 24px 64px rgba(var(--nova-shadow-ink, 26, 22, 18), 0.28)",
        }}
      >
        <SkeletonDashboardCard lines={5} showIcon />
      </div>
    </div>
  );
}

const DashboardCalendarTabNova = dynamic(
  () => import("./dashboard-calendar-tab-nova").then((mod) => mod.DashboardCalendarTabNova),
  { loading: LazyPanelFallback },
);

const EditMemberModal = dynamic(
  () => import("./dashboard-edit-member-modal").then((mod) => mod.EditMemberModal),
  { loading: LazyModalFallback },
);

const EditProfileModal = dynamic(
  () => import("./dashboard-edit-profile-modal").then((mod) => mod.EditProfileModal),
  { loading: LazyModalFallback },
);

// "Family & Charts Hybrid v2" — the Family tab's single-scroll, section-railed
// graphical page (promoted to default 2026-07-22, replacing the earlier
// DashboardFamilyTabNova).
const DashboardFamilyChartsHybrid = dynamic(
  () => import("./dashboard-family-charts-hybrid").then((mod) => mod.DashboardFamilyChartsHybrid),
  { loading: LazyPanelFallback },
);
type DashboardFamilyChartsHybridProps =
  import("./dashboard-family-charts-hybrid").DashboardFamilyChartsHybridProps;

const FeedbackModal = dynamic(
  () => import("./dashboard-feedback-modal").then((mod) => mod.FeedbackModal),
  { loading: LazyModalFallback },
);

const DashboardLifeAreasTabNova = dynamic(
  () => import("./dashboard-life-areas-tab-nova").then((mod) => mod.DashboardLifeAreasTabNova),
  { loading: LazyPanelFallback },
);

const QATab = dynamic(
  () => import("./dashboard-qa-tab").then((mod) => mod.QATab),
  { loading: LazyPanelFallback },
);

const DashboardSetupTab = dynamic(
  () => import("./dashboard-setup-tab").then((mod) => mod.DashboardSetupTab),
  { loading: LazyPanelFallback },
);

const DashboardSettingsSessionTab = dynamic(
  () => import("./dashboard-settings-session-tab").then((mod) => mod.DashboardSettingsSessionTab),
  { loading: LazyPanelFallback },
);

const DashboardJournalTabNova = dynamic(
  () => import("./dashboard-journal-tab-nova").then((mod) => mod.DashboardJournalTabNova),
  { loading: LazyPanelFallback },
);

const DashboardPlanTabNova = dynamic(
  () => import("./dashboard-plan-tab-nova").then((mod) => mod.DashboardPlanTabNova),
  { loading: LazyPanelFallback },
);

const DashboardExploreTabNova = dynamic(
  () => import("./dashboard-explore-tab-nova").then((mod) => mod.DashboardExploreTabNova),
  { loading: LazyPanelFallback },
);

const RectificationWizard = dynamic(
  () => import("./dashboard-rectification-wizard").then((mod) => mod.RectificationWizard),
  { loading: LazyModalFallback },
);

const DashboardTodayTabNova = dynamic(
  () => import("./dashboard-today-tab-nova").then((mod) => mod.DashboardTodayTabNova),
  { loading: LazyPanelFallback },
);

const DashboardToolsTabNova = dynamic(
  () => import("./dashboard-tools-tab-nova").then((mod) => mod.DashboardToolsTabNova),
  { loading: LazyPanelFallback },
);

type SettingsSubTab = "setup" | "session";
type Relationship = "self" | "spouse" | "child" | "parent" | "sibling" | "grandparent" | "other";

const RELATIONSHIP_WEIGHTS: Record<Relationship, string> = {
  self: "1.00", spouse: "1.00", child: "0.75",
  parent: "1.15", sibling: "0.75", grandparent: "1.15", other: "1.00",
};

type BirthFormState = {
  ownerUserId: string;
  displayName: string;
  birthDateLocal: string;
  birthTimeLocal: string;
  birthPlace: string;
  birthLatitude: string;
  birthLongitude: string;
  birthTimezone: string;
  currentPlace: string;
  currentLatitude: string;
  currentLongitude: string;
  currentTimezone: string;
  relationshipToOwner: Relationship;
  calculateNow: boolean;
  maritalStatus: string;
  employmentType: string;
  children: string;
  birthTimeSource: string;
  birthTimeConfidenceMinutes: string;
};

type VaultFormState = {
  ownerUserId: string;
  name: string;
  defaultLanguage: string;
};

type MemberFormState = {
  displayName: string;
  relationshipToOwner: Relationship;
  birthDateLocal: string;
  birthTimeLocal: string;
  birthPlace: string;
  birthLatitude: string;
  birthLongitude: string;
  birthTimezone: string;
  currentPlace: string;
  currentLatitude: string;
  currentLongitude: string;
  currentTimezone: string;
  memberWeight: string;
  calculateNow: boolean;
  birthTimeSource: string;
  birthTimeConfidenceMinutes: string;
};

type PersistedState = {
  ownerUserId: string;
  selectedDate: string;
  selectedVaultId: string;
  birthProfileId: string;
  chartId: string;
  birthForm: BirthFormState;
  vaultForm: VaultFormState;
  memberForm: MemberFormState;
  activeTab: Tab;
  lang: Lang;
};

const defaultBirthForm: BirthFormState = {
  ownerUserId: "", displayName: "", birthDateLocal: "", birthTimeLocal: "",
  birthPlace: "", birthLatitude: "", birthLongitude: "", birthTimezone: "",
  currentPlace: "", currentLatitude: "", currentLongitude: "", currentTimezone: "",
  relationshipToOwner: "self", calculateNow: true,
  maritalStatus: "", employmentType: "", children: "",
  birthTimeSource: "unknown", birthTimeConfidenceMinutes: "0",
};

const defaultVaultForm: VaultFormState = {
  ownerUserId: "", name: "", defaultLanguage: "ta-en",
};

const defaultMemberForm: MemberFormState = {
  displayName: "", relationshipToOwner: "spouse", birthDateLocal: "", birthTimeLocal: "",
  birthPlace: "", birthLatitude: "", birthLongitude: "", birthTimezone: "",
  currentPlace: "", currentLatitude: "", currentLongitude: "", currentTimezone: "",
  memberWeight: RELATIONSHIP_WEIGHTS.spouse, calculateNow: true,
  birthTimeSource: "unknown", birthTimeConfidenceMinutes: "0",
};

function parseNumber(value: string, fallback = 0): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * One tab's pane. Mounted the first time `visible` goes true and never
 * unmounted again afterwards — `active` only toggles CSS `display` and a
 * framer-motion fade, so a tab's own data-fetching state (and anything else
 * it holds) survives switching away and back instead of resetting to
 * "loading" every time.
 *
 * `initial` is a real entry state, not `false`. A pane is only ever mounted at
 * the moment it becomes active, so with `initial={false}` framer snapped it
 * straight to the target and the FIRST visit to a tab appeared instantly while
 * every later visit — animating back up from the opacity 0 it was parked at —
 * took the full navigation duration. Same click, two different-looking transitions depending
 * on history. Giving the mount the same starting values the parked state uses
 * makes one tab switch look like every other.
 */
function TabPane({
  visible,
  active,
  children,
}: {
  visible: boolean;
  active: boolean;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  if (!visible) return null;
  return (
    <motion.div
      style={{ display: active ? "block" : "none", position: "relative", zIndex: 1 }}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
      transition={{ duration: reduce ? 0 : DUR.base, ease: EASE_NOVA }}
    >
      {children}
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────

export function DashboardWorkspace() {
  // Status carries an explicit tone (DASH-08) — the hero renders ✓/⚠ and an
  // aria-live announcement from it instead of guessing from the wording.
  // UXD-05 — no jargon "Create a profile or family vault to begin" sentence at
  // minute zero; the onboarding checklist below is the sole first-run guide.
  const [status, setStatusMessage] = useState<StatusMessage | null>(null);
  const setStatus = useCallback((text: string, tone: "success" | "error" = "success") => {
    setStatusMessage(text ? { text, tone } : null);
  }, []);
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
  // no-op for this value, but it still owns the two cases a path cannot answer:
  // the legacy `?tab=` param and the localStorage restore, both of which only
  // apply when the path names nothing.
  //
  // In-app tab clicks no longer go through any of this: the workspace is
  // mounted by app/dashboard/(workspace)/layout.tsx, which the router keeps
  // alive across every /dashboard ⇄ /dashboard/* move, so a tab change is state
  // plus a URL rewrite and this initialiser runs once per real page load.
  const [activeTab, setActiveTab] = useState<Tab>(
    () => parseDashboardPath(pathname, { qaEnabled: ENABLE_QA_TAB }).tab ?? "personal",
  );
  // In-design confirmation dialog for destructive actions (DASH-05) —
  // replaces the browser confirm() popups.
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [exploreReturnTab, setExploreReturnTab] = useState<Tab | null>(null);
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>("setup");
  const [settingsSection, setSettingsSection] = useState<SettingsSectionId>("account");
  // Which pane is on screen right now. Settings splits into two independent
  // panes (setup / session) that need the same keep-alive treatment as a top-
  // level tab, so it gets its own compound key; every other tab is just itself.
  const currentPaneKey = activeTab === "settings" ? `settings-${settingsSubTab}` : activeTab;
  // Panes are mounted once and never unmounted again (see `TabPane` below) —
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
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [lang, setLang] = useState<Lang>("en");

  // UI-only state: forms, modals, toast
  const [ownerUserId, setOwnerUserId] = useState("");
  const [birthForm, setBirthForm] = useState<BirthFormState>(defaultBirthForm);
  const [vaultForm, setVaultForm] = useState<VaultFormState>(defaultVaultForm);
  const [memberForm, setMemberForm] = useState<MemberFormState>(defaultMemberForm);
  const [editMember, setEditMember] = useState<EditMemberState | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showRectification, setShowRectification] = useState(false);
  const [askVinaadiOpen, setAskVinaadiOpen] = useState(false);

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
  // the tab. The nine `show*` flags below are now derived, so every consumer
  // downstream is unchanged.
  // Seeded from the path for the same reason as `activeTab` above — otherwise
  // `/dashboard/tools/numerology` lands on the Tools card grid and only opens
  // the panel a round-trip later. `parseDashboardPath` only ever reports a tool
  // under the `tools` tab, so this cannot disagree with the tab seeded above.
  const [activeTool, setActiveTool] = useState<DashboardTool | null>(
    () => parseDashboardPath(pathname, { qaEnabled: ENABLE_QA_TAB }).tool,
  );
  const showWrapped = activeTool === "wrapped";
  const showRetrospective = activeTool === "retro";
  const showPorutham = activeTool === "porutham";
  const showChartGenerate = activeTool === "chartgen";
  const showRasipalan = activeTool === "rasipalan";
  const showActivityTiming = activeTool === "activityTiming";
  const showVarshaphala = activeTool === "varshaphala";
  const showSynastry = activeTool === "synastry";
  const showNumerology = activeTool === "numerology";
  const showBabyNames = activeTool === "babynames";
  const [showPrasna, setShowPrasna] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ── Remedies state (lazy-loaded on first tab open)
  const [remedyPlan, setRemedyPlan] = useState<import("@/lib/types").RemedyPlanItem[] | null>(null);
  const [gemstoneAdvice, setGemstoneAdvice] = useState<import("@/lib/types").GemstoneAdviceItem[] | null>(null);
  const [remediesLoading, setRemediesLoading] = useState(false);

  async function loadRemedies(targetChartId?: string) {
    const chartId = targetChartId ?? resolveLifeAreasChartId();
    if (!chartId || remediesLoading) return;
    setRemediesLoading(true);
    try {
      type RawRemedyItem = Record<string, unknown>;
      const [planRes, gemRes] = await Promise.all([
        apiFetchJson<{ success: boolean; data: { items: RawRemedyItem[] } }>(`/api/v1/charts/${chartId}/remedy-plan`),
        apiFetchJson<{ success: boolean; data: { advice: RawRemedyItem[] } }>(`/api/v1/charts/${chartId}/gemstone-advice`),
      ]);
      if (planRes.success && Array.isArray(planRes.data?.items)) {
        setRemedyPlan(planRes.data.items.map((r) => ({
          planet: r.planet as string,
          priority: (r.priority as number) ?? 1,
          reason: (r.reason_en as string) ?? "",
          day: r.day as string,
          templeTa: r.temple_ta as string,
          templeEn: r.temple_en as string,
          mantraFullTa: r.mantra_full_ta as string,
          japaCount: r.japa_count as number,
          daanumItemsTa: r.daanam_items_ta as string,
          daanumItemsEn: r.daanam_items_en as string,
          gemstoneTa: (r.gemstone_ta as string | null) ?? null,
          gemstoneEn: (r.gemstone_en as string | null) ?? null,
          fastingRuleTa: r.fasting_rule_ta as string,
          fastingRuleEn: r.fasting_rule_en as string,
          behaviouralTa: r.behavioural_ta as string,
          behaviouralEn: r.behavioural_en as string,
          sevaTa: r.seva_ta as string,
          sevaEn: r.seva_en as string,
        })));
      }
      if (gemRes.success && Array.isArray(gemRes.data?.advice)) {
        setGemstoneAdvice(gemRes.data.advice.map((r) => ({
          planet: r.planet as string,
          functionalNature: r.functional_nature as string,
          isGemstonePrescribed: r.is_gemstone_prescribed as boolean,
          gemstoneNameTa: (r.gemstone_ta as string | null) ?? null,
          gemstoneNameEn: (r.gemstone_en as string | null) ?? null,
          reasonTa: r.reason_ta as string,
          reasonEn: r.reason_en as string,
          cautionTa: (r.caution_ta as string | null) ?? null,
          cautionEn: (r.caution_en as string | null) ?? null,
        })));
      }
    } catch {
      // leave null — panel shows empty state
    } finally {
      setRemediesLoading(false);
    }
  }

  // ── Varshaphala state (lazy-loaded per year)
  const [varshaphalaData, setVarshaphalaData] = useState<import("@/lib/types").VarshaphalaData | null>(null);
  const [varshaphalaLoading, setVarshaphalaLoading] = useState(false);

  async function loadVarshaphala(year: number, overrideChartId?: string) {
    const chartId = overrideChartId ?? personal.chartId;
    if (!chartId || varshaphalaLoading) return;
    setVarshaphalaLoading(true);
    try {
      const res = await apiFetchJson<{ success: boolean; data: import("@/lib/types").VarshaphalaData }>(
        `/api/v1/charts/${chartId}/varshaphala?year=${year}`
      );
      if (res.success) setVarshaphalaData(res.data);
    } catch {
      // leave null
    } finally {
      setVarshaphalaLoading(false);
    }
  }
  const [busyCreateProfile, setBusyCreateProfile] = useState(false);
  const [busyCreateVault, setBusyCreateVault] = useState(false);
  const [busyAddMember, setBusyAddMember] = useState(false);
  const [busyEditingMember, setBusyEditingMember] = useState(false);
  const [busyEditingProfile, setBusyEditingProfile] = useState(false);
  const [deletingVaultId, setDeletingVaultId] = useState("");
  const [deletingMemberId, setDeletingMemberId] = useState("");

  // View-selector IDs for member cross-tab views
  const [personalViewId, setPersonalViewId] = useState<string | null>(null);
  const [lifeAreasViewId, setLifeAreasViewId] = useState<string | null>(null);

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
  // Timing is explicitly scoped: a family member selected for a muhurta does
  // not silently replace the chart currently being read in Life Areas.
  const [muhurtaMemberId, setMuhurtaMemberId] = useState<string | null>(null);
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

  const [onboardingDone, setOnboardingDone] = useState(false);

  // Notification inbox
  const [inboxItems, setInboxItems] = useState<NotificationInboxItem[]>([]);
  const [inboxUnreadCount, setInboxUnreadCount] = useState(0);

  useEffect(() => {
    if (!ENABLE_QA_TAB && activeTab === "qa") {
      setActiveTab("personal");
    }
  }, [activeTab]);

  // Poll inbox every 5 minutes
  useEffect(() => {
    function fetchInbox() {
      apiFetchJson<NotificationInboxResponse>("/api/v1/notifications")
        .then((r) => { setInboxItems(r.data); setInboxUnreadCount(r.unread_count); })
        .catch(() => {});
    }
    fetchInbox();
    const id = setInterval(fetchInbox, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  function handleMarkAllRead() {
    apiFetchJson<NotificationInboxResponse>("/api/v1/notifications/read-all", { method: "POST" })
      .then((r) => { setInboxItems(r.data); setInboxUnreadCount(r.unread_count); })
      .catch(() => {});
  }

  function handleMarkOneRead(notificationId: string) {
    apiFetchJson<NotificationInboxResponse>(`/api/v1/notifications/${notificationId}/read`, { method: "POST" })
      .then((r) => { setInboxItems(r.data); setInboxUnreadCount(r.unread_count); })
      .catch(() => {});
  }

  // ── Domain hooks ─────────────────────────────────────────

  const session = useSession({
    onSetupRedirect: useCallback(() => {
      setActiveTab("settings");
      setSettingsSubTab("setup");
    }, []),
  });

  // ── Life Mode (Feature 2) ─────────────────────────────────
  const [lifeModeStatus, setLifeModeStatus] = useState<LifeModeStatus | null>(null);
  const [lifeModePickerOpen, setLifeModePickerOpen] = useState(false);
  const activeLifeMode: LifeMode = lifeModeStatus?.mode ?? "BALANCED";

  const personal = usePersonalData({
    selectedDate,
    onStatus: setStatus,
    // Life-area predictions are 4 extra requests per chart+date that only the
    // Life Areas tab renders — don't fetch them while paging dates on Today
    // (DASH-04).
    predictionsEnabled: activeTab === "life-areas",
  });

  // Tools tab open/close — lifted to component level (was local to the
  // `activeTab === "tools"` render block) so Today's Quick Links can open a
  // specific tool from outside the Tools tab, the same way focusLifeAreas/
  // focusCalendar/focusFamily reach into their tabs (homepage redesign
  // 2026-07-24).
  const needsProfile = !personal.birthProfileId;
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

  const family = useFamilyData({
    ownerUserId,
    selectedDate,
    onStatus: setStatus,
  });

  const plan = usePlanData({
    chartId: personal.chartId,
    onError: (msg) => showToast(msg, "error"),
    // Goal changes alter what the day bundle and life-area insights compute,
    // so both refreshes bypass the cache (forceDay / force — DASH-04); the
    // chart itself is untouched, so no forceChart.
    onGoalAdded: (goalType) => {
      showToast(`${t("toast_goal_added", lang)}: ${goalType}`);
      if (personal.birthProfileId) {
        void personal.refreshPersonalBundle(personal.birthProfileId, selectedDate, true, { forceDay: true });
      }
      const targetChartId = (() => {
        if (!lifeAreasViewId) return personal.chartId;
        const member = family.memberCharts.find((mc) => mc.memberId === lifeAreasViewId);
        return member?.chart.chartId ?? personal.chartId;
      })();
      if (!targetChartId || targetChartId === personal.chartId) return;
      personal.setPredictionsLoading(true);
      personal.setJadhagamReport(null);
      void personal
        .refreshLifeAreasInsights(targetChartId, selectedDate, { force: true })
        .finally(() => personal.setPredictionsLoading(false));
    },
    onGoalRemoved: () => {
      showToast(t("toast_goal_removed", lang));
      if (personal.birthProfileId) {
        void personal.refreshPersonalBundle(personal.birthProfileId, selectedDate, true, { forceDay: true });
      }
      const targetChartId = (() => {
        if (!lifeAreasViewId) return personal.chartId;
        const member = family.memberCharts.find((mc) => mc.memberId === lifeAreasViewId);
        return member?.chart.chartId ?? personal.chartId;
      })();
      if (!targetChartId || targetChartId === personal.chartId) return;
      personal.setPredictionsLoading(true);
      personal.setJadhagamReport(null);
      void personal
        .refreshLifeAreasInsights(targetChartId, selectedDate, { force: true })
        .finally(() => personal.setPredictionsLoading(false));
    },
  });

  const journal = useJournalData({
    lang,
    onStatus: setStatus,
    onError: (msg) => showToast(msg, "error"),
  });

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // ── Hydration + localStorage restore ─────────────────────

  useEffect(() => {
    if (!session.hydrated) return;
    const authedUserId = session.sessionUserId;
    setOwnerUserId(authedUserId);
    // A destination in the URL is an explicit instruction and outranks the
    // restored session. Resolved outside the isSameUser branch on purpose: a
    // link shared with someone else must still land where it names, even though
    // that person's localStorage belongs to a different user and gets cleared
    // below.
    //
    // Legacy fallback: `/dashboard?tab=tools` was the scheme until 2026-07-28
    // and is still out there in bookmarks and shared links, so the param is
    // consulted when the path itself names nothing. The outbound sync below
    // then rewrites the URL to the path form and drops the param.
    const fromPath = parseDashboardPath(pathname, { qaEnabled: ENABLE_QA_TAB });
    const fromLegacyParam = fromPath.tab ? null : sanitizeUrlTab(urlTabParam, { qaEnabled: ENABLE_QA_TAB });
    const fromUrl = fromPath.tab ?? fromLegacyParam?.tab ?? null;
    if (fromUrl) {
      setActiveTab(fromUrl);
      setActiveTool(fromUrl === "tools" ? fromPath.tool : null);
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<PersistedState>;
        const isSameUser = parsed.ownerUserId === authedUserId;
        if (isSameUser) {
          // Reject a persisted selectedDate that's fallen into the past: a date
          // browsed (or merely left open) in an earlier session must not keep
          // silently overriding the fresh today() default on every later visit,
          // which would permanently hide "today"-anchored content like festivals.
          // A persisted today-or-future date is still honored, so browsing ahead
          // and refreshing the same day keeps its place.
          if (typeof parsed.selectedDate === "string" && parsed.selectedDate >= todayIso()) {
            setSelectedDate(parsed.selectedDate);
          }
          if (typeof parsed.selectedVaultId === "string") family.setSelectedVaultId(parsed.selectedVaultId);
          if (typeof parsed.birthProfileId === "string") personal.setBirthProfileId(parsed.birthProfileId);
          if (typeof parsed.chartId === "string") personal.setChartId(parsed.chartId);
          if (parsed.birthForm) setBirthForm((c) => ({ ...c, ...parsed.birthForm }));
          if (parsed.vaultForm) setVaultForm((c) => ({ ...c, ...parsed.vaultForm }));
          if (parsed.memberForm) setMemberForm((c) => ({ ...c, ...parsed.memberForm }));
          // Allowlist restore (DASH-11): only tabs the hero nav actually
          // offers come back. Settings/onboarding stay excluded — the
          // onboarding gate decides those from profile existence.
          // Skipped entirely when the URL already named a tab.
          if (!fromUrl) {
            const restored = sanitizeRestoredTab(parsed.activeTab, { qaEnabled: ENABLE_QA_TAB });
            if (restored) {
              setActiveTab(restored.tab);
            }
          }
          if (parsed.lang === "ta" || parsed.lang === "en") setLang(parsed.lang);
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // ignore parse errors
    }
    // Only now may the outbound sync write to the URL — before this point
    // `activeTab` is still the "personal" default and would overwrite the very
    // destination we just read.
    setUrlSyncReady(true);
    // Load DB lang preference — overrides localStorage (works across devices).
    // GET /settings/ui answers flat ({ lang, dashboard_mode }) — there is no
    // { data } envelope to unwrap.
    void apiFetchJson<{ lang?: string }>("/api/v1/settings/ui").then((r) => {
      const dbLang = r?.lang;
      if (dbLang === "ta" || dbLang === "en") setLang(dbLang as Lang);
    }).catch(() => { /* non-critical — localStorage fallback is fine */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.hydrated]);

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
    const nextPath = dashboardPath(activeTab, activeTool);
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
  }, [activeTab, activeTool, urlSyncReady]);

  // ── URL → destination (inbound) ───────────────────────────
  // Back/forward and hand-edited URLs. Guarded the same way as the outbound
  // effect.
  useEffect(() => {
    if (!urlSyncReady) return;
    const fromUrl = parseDashboardPath(pathname, { qaEnabled: ENABLE_QA_TAB });
    // A path naming no tab means Today here, NOT "leave things alone" — Back to
    // a bare `/dashboard` must actually land on Today rather than stranding the
    // previous tab on screen under a URL that no longer describes it. (The
    // hydration effect above reads the same null differently, handing off to
    // the localStorage restore, because on first load there is no "previous
    // tab" to strand.)
    const nextTab = fromUrl.tab ?? "personal";
    const nextTool = nextTab === "tools" ? fromUrl.tool : null;
    if (nextTab === activeTab && nextTool === activeTool) return;
    // A history move is not a new navigation — never push in response to one.
    navIntentRef.current = "replace";
    setExploreReturnTab(null);
    setActiveTab(nextTab);
    setActiveTool(nextTool);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, urlSyncReady]);

  // ── Persist lang to DB when changed ───────────────────────
  const langSyncRef = useRef(false);
  useEffect(() => {
    if (!session.hydrated || !langSyncRef.current) {
      langSyncRef.current = true;
      return;
    }
    void apiFetchJson("/api/v1/settings/ui", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang }),
    }).catch(() => { /* non-critical */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // ── Persistence ────────────────────────────────────────

  // Debounced (DASH-12): birthForm/vaultForm/memberForm are dependencies, so
  // without the delay every keystroke in any form serialized and wrote the
  // whole persisted state. Trailing-edge write after 500ms of quiet; the
  // timer also flushes stale-closure-free because each effect run recreates it.
  useEffect(() => {
    if (!session.hydrated) return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ownerUserId,
        selectedDate,
        selectedVaultId: family.selectedVaultId,
        birthProfileId: personal.birthProfileId,
        chartId: personal.chartId,
        birthForm,
        vaultForm,
        memberForm,
        activeTab,
        lang,
      } as PersistedState));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [
    session.hydrated, ownerUserId, selectedDate,
    family.selectedVaultId, personal.birthProfileId, personal.chartId,
    birthForm, vaultForm, memberForm, activeTab, lang,
  ]);

  // Keep ownerUserId in sync with forms
  useEffect(() => {
    if (!session.hydrated) return;
    if (vaultForm.ownerUserId !== ownerUserId) setVaultForm((c) => ({ ...c, ownerUserId }));
    if (birthForm.ownerUserId !== ownerUserId) setBirthForm((c) => ({ ...c, ownerUserId }));
  }, [session.hydrated, ownerUserId, birthForm.ownerUserId, vaultForm.ownerUserId]);

  // ── Onboarding gate ────────────────────────────────────

  useEffect(() => {
    if (!session.hydrated || !personal.birthProfileLookupDone) return;
    if (!personal.birthProfileId) {
      setActiveTab("settings");
      setSettingsSubTab("setup");
      setOnboardingDone(false);
    } else if (family.vaults.length === 0 || family.vaults.every((v) => v.memberCount === 0)) {
      setOnboardingDone(false);
    } else {
      setOnboardingDone(true);
    }
  }, [session.hydrated, personal.birthProfileLookupDone, personal.birthProfileId, family.vaults]);

  // ── Data trigger effects ───────────────────────────────

  useEffect(() => {
    if (session.hydrated && ownerUserId) void family.loadVaults(ownerUserId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.hydrated, ownerUserId]);

  useEffect(() => {
    if (session.hydrated) void journal.loadJournalSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.hydrated]);

  // Load Life Mode status; auto-open the picker for set-up users who haven't
  // chosen recently (null, stale >30d, or server flag set).
  useEffect(() => {
    if (!session.hydrated || !personal.chartId) return;
    apiFetchJson<LifeModeStatus>("/api/v1/settings/life-mode")
      .then((s) => {
        setLifeModeStatus(s);
        const stale =
          !s.lifeModeSetAt ||
          Date.now() - new Date(s.lifeModeSetAt).getTime() > 30 * 24 * 60 * 60 * 1000;
        if (s.showLifeModePicker || stale) setLifeModePickerOpen(true);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.hydrated, personal.chartId]);

  useEffect(() => {
    if (session.hydrated && personal.chartId) {
      journal.loadJournalEntries(personal.chartId);
      journal.loadContextData(personal.chartId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.hydrated, personal.chartId]);

  useEffect(() => {
    if (session.hydrated && personal.birthProfileId) {
      void personal.refreshPersonalBundle(personal.birthProfileId, selectedDate);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personal.birthProfileId, session.hydrated, selectedDate]);

  useEffect(() => {
    if (!session.hydrated || personal.birthProfileId || personal.birthProfileLookupDone) return;
    void personal.loadLatestBirthProfileForCurrentUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personal.birthProfileId, personal.birthProfileLookupDone, session.hydrated]);

  // Sync birthForm from the loaded chart so name/details survive new builds.
  //
  // The three life-stage selects below were left out of this effect for a long
  // time on the reasoning that a blank select sends `undefined`, `exclude_unset`
  // skips it, and the stored value survives — true, and harmless while nothing
  // but this form could write them. The one-minute reading ended that: it asks
  // the marital-status question inline and PATCHes the answer. A reader who
  // taps the wrong option had written a value that this form could not show
  // them and therefore could not correct, while it fed life_areas,
  // marriage_service and daily guidance. Not lost data — an unanswerable
  // answer, which is worse in a feature whose argument is that declining is
  // safe. Hydrate them.
  useEffect(() => {
    if (!personal.chart) return;
    const bp = personal.chart.birthProfile;
    setBirthForm((c) => ({
      ...c,
      displayName: c.displayName || bp.displayName || "",
      birthDateLocal: c.birthDateLocal || bp.birthDateLocal || "",
      birthTimeLocal: c.birthTimeLocal || bp.birthTimeLocal || "",
      birthPlace: c.birthPlace || bp.birthPlace || "",
      birthTimezone: c.birthTimezone || bp.birthTimezone || "",
      birthLatitude: c.birthLatitude || (bp.birthLatitude != null ? String(bp.birthLatitude) : ""),
      birthLongitude: c.birthLongitude || (bp.birthLongitude != null ? String(bp.birthLongitude) : ""),
      currentPlace: c.currentPlace || bp.currentPlace || "",
      currentTimezone: c.currentTimezone || bp.currentTimezone || "",
      currentLatitude: c.currentLatitude || (bp.currentLatitude != null ? String(bp.currentLatitude) : ""),
      currentLongitude: c.currentLongitude || (bp.currentLongitude != null ? String(bp.currentLongitude) : ""),
      maritalStatus: c.maritalStatus || bp.maritalStatus || "",
      employmentType: c.employmentType || bp.employmentType || "",
      children: c.children || bp.children || "",
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personal.chart]);

  useEffect(() => {
    if (session.hydrated && family.selectedVaultId) {
      void family.refreshFamilyBundle(family.selectedVaultId, selectedDate);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.hydrated, selectedDate, family.selectedVaultId]);

  useEffect(() => {
    if (session.hydrated && family.selectedVaultId) {
      void family.loadRelationshipAlerts(family.selectedVaultId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.hydrated, family.selectedVaultId]);

  // Life areas insights re-run when the resolved chart changes or date changes.
  // Deliberately NOT including family.memberCharts (a new array reference every
  // render) — we only need the resolved chart ID for the selected member.
  const lifeAreasResolvedChartId = (() => {
    if (!lifeAreasViewId) return personal.chartId;
    const member = family.memberCharts.find((mc) => mc.memberId === lifeAreasViewId);
    return member?.chart.chartId ?? personal.chartId;
  })();
  useEffect(() => {
    if (!session.hydrated) return;
    const targetChartId = lifeAreasResolvedChartId;
    if (!targetChartId) return;
    personal.setJadhagamReport(null);
    // Remedies & gemstone advice are per-chart — clear the previous member's
    // data so a switched member never shows another person's remedies/stones.
    setRemedyPlan(null);
    setGemstoneAdvice(null);
    if (!lifeAreasViewId || targetChartId === personal.chartId) {
      // Personal chart: the bundle already carries life-areas and the gated
      // insights query in usePersonalData fetches the predictions — kicking
      // off a second fetch here raced it and double-fetched /life-areas
      // (DASH-16). Just drop any member override so the query data shows.
      personal.setLifeAreas(null);
      return;
    }
    personal.setPredictionsLoading(true);
    void personal.refreshLifeAreasInsights(targetChartId, selectedDate)
      .finally(() => personal.setPredictionsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.hydrated, lifeAreasViewId, selectedDate, lifeAreasResolvedChartId]);

  function showToast(message: string, tone: "success" | "error" = "success") {
    if (tone === "error") toast.error(message);
    else toast.success(message);
  }

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

  // ── Derived / resolved state ──────────────────────────────

  function resolveLifeAreasChartId(): string {
    if (!lifeAreasViewId) return personal.chartId;
    const member = family.memberCharts.find((mc) => mc.memberId === lifeAreasViewId);
    return member?.chart.chartId ?? personal.chartId;
  }

  function resolveMuhurtaChartId(): string {
    if (!muhurtaMemberId) return personal.chartId;
    const member = family.memberCharts.find((mc) => mc.memberId === muhurtaMemberId);
    return member?.chart.chartId ?? personal.chartId;
  }

  const selectedVault = family.vaults.find((v) => v.familyVaultId === family.selectedVaultId) ?? null;

  function resolveMemberChart(viewId: string | null): MemberChart | null {
    if (!viewId) return null;
    return family.memberCharts.find((mc) => mc.memberId === viewId) ?? null;
  }

  const personalMemberChart = resolveMemberChart(personalViewId);
  const lifeAreasMemberChart = resolveMemberChart(lifeAreasViewId);

  const personalChart = personalMemberChart?.chart ?? personal.chart;
  const personalChartExplanation = personalMemberChart ? personalMemberChart.explanation : personal.chartExplanation;
  const personalChartSummary = personalMemberChart?.summary ?? personal.chartSummary;
  const personalDailyGuidance = personalMemberChart?.dailyGuidance ?? personal.dailyGuidance;
  const personalDasha = personalMemberChart?.dasha ?? personal.dasha;
  const personalDashaMaha = personalMemberChart?.dashaMaha ?? personal.dashaMaha;
  const personalDashaAntar = personalMemberChart?.dashaAntar ?? personal.dashaAntar;
  const personalTransit = personalMemberChart?.transit ?? personal.transit;
  const personalSani = personalMemberChart?.sani ?? personal.sani;
  const personalPeyarchiUpcoming = personalMemberChart?.peyarchiUpcoming ?? personal.peyarchiUpcoming;

  // The owner's row in familyAggregate is reconciled against their own live daily-guidance
  // score, so the same person can't show two different "today" scores on one screen (this
  // feeds both the classic household strip and Nova's family-today card).
  const ownerBirthProfileId = personal.chart?.birthProfile.birthProfileId;
  const familyAggregateForToday = family.familyAggregate
    ? {
        ...family.familyAggregate,
        members: family.familyAggregate.members.map((m) =>
          // `memberCharts` intentionally excludes the synthetic owner row, so
          // it cannot be used to identify this member. The birth-profile ID is
          // shared by the live personal reading and the aggregate owner row.
          ownerBirthProfileId !== undefined && m.birthProfileId === ownerBirthProfileId && personal.dailyGuidance?.score != null
            ? { ...m, individualScore: personal.dailyGuidance.score }
            : m
        ),
      }
    : family.familyAggregate;

  // Life Areas tab specific resolved data (follows lifeAreasViewId selector) —
  // feeds the Overview sub-tab's guidance/gochar cards, moved here from
  // Family & Charts on 2026-07-09.
  const lifeAreasDailyGuidance = lifeAreasMemberChart?.dailyGuidance ?? personal.dailyGuidance;
  const lifeAreasTransit = lifeAreasMemberChart?.transit ?? personal.transit;
  const lifeAreasSani = lifeAreasMemberChart?.sani ?? personal.sani;
  // Backend's family-aggregate injects a synthetic "owner" row (familyMemberId === birthProfileId)
  // so family-score averaging includes the owner alongside managed members. useFamilyData.ts
  // deliberately excludes that row from family.memberCharts (to avoid duplicating the owner in
  // member-picker pill lists elsewhere), so the Family tab's own member grid — which reads the
  // *unfiltered* aggregate — can never resolve a chart for that row via memberCharts.find(...).
  // The owner's own chart/dasha/dailyGuidance are already loaded here as `personal.*`; assembling
  // them into a MemberChart-shaped object lets the Family tab render/click the owner's tile like
  // any other member's, with no extra fetch.
  const ownerMemberChart: MemberChart | null = !personal.chart ? null : {
    memberId: personal.birthProfileId,
    displayName: personal.chart.birthProfile.displayName,
    chart: personal.chart,
    explanation: personal.chartExplanation,
    summary: personal.chartSummary,
    transit: personal.transit,
    sani: personal.sani,
    peyarchiUpcoming: personal.peyarchiUpcoming,
    dailyGuidance: personal.dailyGuidance,
    weekAhead: personal.weekAhead,
    dasha: personal.dasha,
    dashaMaha: personal.dashaMaha,
    dashaAntar: personal.dashaAntar,
    nakshatraCard: personal.nakshatraCard,
  };

  const journalRetentionDays = journal.journalSettings?.journalRetentionDays ?? 365;

  // ── Form validation ───────────────────────────────────────

  function validateBirthForm(form: BirthFormState): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!form.displayName.trim()) errors.displayName = t("err_name_required", lang);
    if (!form.birthDateLocal) errors.birthDateLocal = t("err_date_required", lang);
    else if (!isBirthDateWithinBounds(form.birthDateLocal)) {
      errors.birthDateLocal = t("err_date_out_of_range", lang);
    }
    if (!form.birthPlace.trim()) errors.birthPlace = t("err_place_required", lang);
    if (!form.birthTimezone.trim()) errors.birthTimezone = t("err_tz_required", lang);
    // parseLatitude/parseLongitude, not truthiness — a coordinate of exactly 0
    // (equator/prime meridian) is valid (DASH-03).
    if (parseLatitude(form.birthLatitude) === null) errors.birthLatitude = t("err_lat_required", lang);
    if (parseLongitude(form.birthLongitude) === null) errors.birthLongitude = t("err_lng_required", lang);
    return errors;
  }

  function validateMemberForm(form: MemberFormState): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!form.displayName.trim()) errors.memberDisplayName = t("err_name_required", lang);
    if (!form.birthDateLocal) errors.memberBirthDate = t("err_date_required", lang);
    else if (!isBirthDateWithinBounds(form.birthDateLocal)) {
      errors.memberBirthDate = t("err_date_out_of_range", lang);
    }
    if (!form.birthPlace.trim()) errors.memberBirthPlace = t("err_place_required", lang);
    if (!form.birthTimezone.trim()) errors.memberTimezone = t("err_tz_required", lang);
    return errors;
  }

  // ── Form handlers ─────────────────────────────────────────

  async function handleCreateProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateBirthForm(birthForm);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({});
    setBusyCreateProfile(true);
    try {
      const response = await apiFetchJson<ApiEnvelope<BirthProfileCreateResponseData>>("/api/v1/birth-profiles", {
        method: "POST",
        body: JSON.stringify({
          ownerUserId: birthForm.ownerUserId || undefined,
          relationshipToOwner: birthForm.relationshipToOwner,
          displayName: birthForm.displayName,
          birthDateLocal: birthForm.birthDateLocal,
          birthTimeLocal: birthForm.birthTimeLocal || undefined,
          birthPlace: birthForm.birthPlace,
          birthLatitude: parseNumber(birthForm.birthLatitude),
          birthLongitude: parseNumber(birthForm.birthLongitude),
          birthTimezone: birthForm.birthTimezone,
          currentPlace: birthForm.currentPlace || undefined,
          currentLatitude: birthForm.currentLatitude ? parseNumber(birthForm.currentLatitude) : undefined,
          currentLongitude: birthForm.currentLongitude ? parseNumber(birthForm.currentLongitude) : undefined,
          currentTimezone: birthForm.currentTimezone || undefined,
          calculateNow: birthForm.calculateNow,
          maritalStatus: birthForm.maritalStatus || undefined,
          employmentType: birthForm.employmentType || undefined,
          children: birthForm.children || undefined,
          birthTimeSource: birthForm.birthTimeSource || undefined,
          birthTimeConfidenceMinutes: birthForm.birthTimeConfidenceMinutes
            ? parseInt(birthForm.birthTimeConfidenceMinutes, 10)
            : undefined,
        }),
      });
      personal.setBirthProfileId(response.data.birthProfileId);
      if (response.data.chartId) personal.setChartId(response.data.chartId);
      showToast(`${birthForm.displayName} – ${t("toast_profile_created", lang)}`);
      setStatus(`Profile created – ${response.data.birthProfileId.slice(0, 8)}`);
      setActiveTab("personal");
    } catch (error) {
      const msg = getFriendlyErrorMessage(error);
      showToast(msg, "error"); setStatus(msg, "error");
    } finally { setBusyCreateProfile(false); }
  }

  async function handleCreateVault(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyCreateVault(true);
    try {
      const response = await apiFetchJson<ApiEnvelope<{
        familyVaultId: string; ownerUserId: string; name: string;
        defaultLanguage: string; memberCount: number;
      }>>(
        "/api/v1/family-vaults",
        { method: "POST", body: JSON.stringify({ ownerUserId: vaultForm.ownerUserId || undefined, name: vaultForm.name, defaultLanguage: vaultForm.defaultLanguage }) }
      );
      setOwnerUserId(response.data.ownerUserId);
      family.setSelectedVaultId(response.data.familyVaultId);
      showToast(`Vault "${response.data.name}" created.`);
      setStatus(`Vault "${response.data.name}" created.`);
      await family.loadVaults(response.data.ownerUserId);
      setActiveTab("family");
    } catch (error) {
      const msg = getFriendlyErrorMessage(error);
      showToast(msg, "error"); setStatus(msg, "error");
    } finally { setBusyCreateVault(false); }
  }

  async function handleAddMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!family.selectedVaultId) { showToast(t("toast_vault_required", lang), "error"); return; }
    const errors = validateMemberForm(memberForm);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({});
    setBusyAddMember(true);
    try {
      const response = await apiFetchJson<ApiEnvelope<{ familyMemberId: string; displayName: string }>>(
        `/api/v1/family-vaults/${family.selectedVaultId}/members`,
        {
          method: "POST",
          body: JSON.stringify({
            ownerUserId, familyVaultId: family.selectedVaultId,
            relationshipToOwner: memberForm.relationshipToOwner,
            displayName: memberForm.displayName,
            birthDateLocal: memberForm.birthDateLocal,
            birthTimeLocal: memberForm.birthTimeLocal,
            birthPlace: memberForm.birthPlace,
            birthLatitude: parseNumber(memberForm.birthLatitude),
            birthLongitude: parseNumber(memberForm.birthLongitude),
            birthTimezone: memberForm.birthTimezone,
            currentPlace: memberForm.currentPlace || undefined,
            currentLatitude: memberForm.currentLatitude ? parseNumber(memberForm.currentLatitude) : undefined,
            currentLongitude: memberForm.currentLongitude ? parseNumber(memberForm.currentLongitude) : undefined,
            currentTimezone: memberForm.currentTimezone || undefined,
            calculateNow: memberForm.calculateNow,
            memberWeight: parseNumber(memberForm.memberWeight, 1),
            birthTimeSource: memberForm.birthTimeSource || undefined,
            birthTimeConfidenceMinutes: memberForm.birthTimeConfidenceMinutes
              ? parseInt(memberForm.birthTimeConfidenceMinutes, 10)
              : undefined,
          }),
        }
      );
      showToast(`${response.data.displayName} added to vault.`);
      setStatus(`${response.data.displayName} added to vault.`);
      setMemberForm(defaultMemberForm);
      await family.loadVaults(ownerUserId);
      await family.refreshFamilyBundle(family.selectedVaultId, selectedDate);
      setActiveTab("personal");
    } catch (error) {
      const msg = getFriendlyErrorMessage(error);
      showToast(msg, "error"); setStatus(msg, "error");
    } finally { setBusyAddMember(false); }
  }

  async function handleSaveEdit() {
    if (!editMember) return;
    setBusyEditingMember(true);
    try {
      await apiFetchJson<unknown>(
        `/api/v1/family-vaults/${family.selectedVaultId}/members/${editMember.memberId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            displayName: editMember.displayName,
            relationshipToOwner: editMember.relationshipToOwner,
            memberWeight: parseNumber(editMember.memberWeight, 1),
            birthDateLocal: editMember.birthDateLocal || undefined,
            birthTimeLocal: editMember.birthTimeLocal || undefined,
            birthPlace: editMember.birthPlace || undefined,
            birthLatitude: editMember.birthLatitude ? parseNumber(editMember.birthLatitude) : undefined,
            birthLongitude: editMember.birthLongitude ? parseNumber(editMember.birthLongitude) : undefined,
            birthTimezone: editMember.birthTimezone || undefined,
            currentPlace: editMember.currentPlace || undefined,
            currentLatitude: editMember.currentLatitude ? parseNumber(editMember.currentLatitude) : undefined,
            currentLongitude: editMember.currentLongitude ? parseNumber(editMember.currentLongitude) : undefined,
            currentTimezone: editMember.currentTimezone || undefined,
            recalculate: true,
          }),
        }
      );
      showToast(`${editMember.displayName} updated.`);
      setStatus(`${editMember.displayName} updated.`);
      setEditMember(null);
      await family.refreshFamilyBundle(family.selectedVaultId, selectedDate);
    } catch (error) {
      const msg = getFriendlyErrorMessage(error);
      showToast(msg, "error"); setStatus(msg, "error");
    } finally { setBusyEditingMember(false); }
  }

  async function handleSaveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyEditingProfile(true);
    try {
      const existingId = personal.birthProfileId;
      if (existingId) {
        // Update existing profile — never create a duplicate
        const updated = await apiFetchJson<ApiEnvelope<{ data: BirthProfileCreateResponseData }>>(`/api/v1/birth-profiles/${existingId}`, {
          method: "PATCH",
          body: JSON.stringify({
            displayName: birthForm.displayName,
            birthDateLocal: birthForm.birthDateLocal,
            birthTimeLocal: birthForm.birthTimeLocal,
            birthPlace: birthForm.birthPlace,
            birthLatitude: parseNumber(birthForm.birthLatitude),
            birthLongitude: parseNumber(birthForm.birthLongitude),
            birthTimezone: birthForm.birthTimezone,
            currentPlace: birthForm.currentPlace || undefined,
            currentLatitude: birthForm.currentLatitude ? parseNumber(birthForm.currentLatitude) : undefined,
            currentLongitude: birthForm.currentLongitude ? parseNumber(birthForm.currentLongitude) : undefined,
            currentTimezone: birthForm.currentTimezone || undefined,
            maritalStatus: birthForm.maritalStatus || undefined,
            employmentType: birthForm.employmentType || undefined,
            children: birthForm.children || undefined,
            recalculate: true,
          }),
        });
        const profileId = (updated as any).data?.birthProfileId ?? existingId;
        const chartId = (updated as any).data?.chartId;
        if (chartId) personal.setChartId(chartId);
        setShowEditProfile(false);
        showToast(`${birthForm.displayName} profile updated.`);
        // Profile edits change the chart — this is the one path that must
        // bypass the session-cached /charts/calculate result (DASH-04).
        await personal.refreshPersonalBundle(profileId, selectedDate, true, { forceChart: true, forceDay: true });
      } else {
        // First-time creation
        const response = await apiFetchJson<ApiEnvelope<BirthProfileCreateResponseData>>("/api/v1/birth-profiles", {
          method: "POST",
          body: JSON.stringify({
            ownerUserId: birthForm.ownerUserId || undefined,
            relationshipToOwner: birthForm.relationshipToOwner,
            displayName: birthForm.displayName,
            birthDateLocal: birthForm.birthDateLocal,
            birthTimeLocal: birthForm.birthTimeLocal,
            birthPlace: birthForm.birthPlace,
            birthLatitude: parseNumber(birthForm.birthLatitude),
            birthLongitude: parseNumber(birthForm.birthLongitude),
            birthTimezone: birthForm.birthTimezone,
            currentPlace: birthForm.currentPlace || undefined,
            currentLatitude: birthForm.currentLatitude ? parseNumber(birthForm.currentLatitude) : undefined,
            currentLongitude: birthForm.currentLongitude ? parseNumber(birthForm.currentLongitude) : undefined,
            currentTimezone: birthForm.currentTimezone || undefined,
            calculateNow: true,
            maritalStatus: birthForm.maritalStatus || undefined,
            employmentType: birthForm.employmentType || undefined,
            children: birthForm.children || undefined,
          }),
        });
        personal.setBirthProfileId(response.data.birthProfileId);
        if (response.data.chartId) personal.setChartId(response.data.chartId);
        setShowEditProfile(false);
        showToast(`${birthForm.displayName} profile created.`);
        await personal.refreshPersonalBundle(response.data.birthProfileId, selectedDate, true, { forceChart: true, forceDay: true });
      }
    } catch (error) {
      const msg = getFriendlyErrorMessage(error);
      showToast(msg, "error");
    } finally { setBusyEditingProfile(false); }
  }

  // The three destructive flows below confirm through the in-design
  // ConfirmDialog (bilingual, destructive-styled) instead of browser
  // confirm() popups (DASH-05). Vault deletion — the most destructive —
  // additionally requires typing the vault name.

  function handleDeleteProfile() {
    const existingId = personal.birthProfileId;
    if (!existingId) return;
    const name = birthForm.displayName || (lang === "ta" ? "இந்த ஜாதகம்" : "this profile");
    setConfirmDialog({
      title: t("btn_delete_profile", lang),
      body: t("confirm_delete_profile_body", lang).replace("%s", name),
      confirmLabel: t("btn_delete_profile", lang),
      onConfirm: () => {
        setBusyEditingProfile(true);
        void apiFetchJson<unknown>(`/api/v1/birth-profiles/${existingId}`, { method: "DELETE" })
          .then(() => {
            // Sign out and redirect — user must not stay on the dashboard
            // after deleting their profile.
            session.signOut();
          })
          .catch((error) => {
            showToast(getFriendlyErrorMessage(error), "error");
            setBusyEditingProfile(false);
          });
      },
    });
  }

  function handleDeleteMember(memberId: string, displayName: string) {
    setConfirmDialog({
      title: `${t("btn_remove", lang)} — ${displayName}`,
      body: t("confirm_remove_member", lang),
      confirmLabel: t("btn_remove", lang),
      onConfirm: () => {
        setDeletingMemberId(memberId);
        void (async () => {
          try {
            await apiFetchJson<unknown>(`/api/v1/family-vaults/${family.selectedVaultId}/members/${memberId}`, { method: "DELETE" });
            const removedMsg = t("toast_member_removed", lang).replace("%s", displayName);
            showToast(removedMsg);
            setStatus(removedMsg);
            await family.loadVaults(ownerUserId);
            await family.refreshFamilyBundle(family.selectedVaultId, selectedDate);
          } catch (error) {
            const msg = getFriendlyErrorMessage(error);
            showToast(msg, "error"); setStatus(msg, "error");
          } finally {
            setDeletingMemberId("");
          }
        })();
      },
    });
  }

  function handleDeleteVault(vaultId: string, vaultName: string) {
    setConfirmDialog({
      title: `${t("btn_delete", lang)} — ${vaultName}`,
      body: t("confirm_delete_vault", lang),
      confirmLabel: t("btn_delete", lang),
      typeToConfirm: vaultName,
      onConfirm: () => {
        setDeletingVaultId(vaultId);
        void (async () => {
          try {
            await apiFetchJson<unknown>(`/api/v1/family-vaults/${vaultId}`, { method: "DELETE" });
            const deletedMsg = t("toast_vault_deleted", lang).replace("%s", vaultName);
            showToast(deletedMsg);
            setStatus(deletedMsg);
            if (family.selectedVaultId === vaultId) {
              family.setSelectedVaultId("");
              family.setFamilyDetail(null);
              family.setFamilyAggregate(null);
              family.setFamilyComposite(null);
            }
            await family.loadVaults(ownerUserId);
          } catch (error) {
            const msg = getFriendlyErrorMessage(error);
            showToast(msg, "error"); setStatus(msg, "error");
          } finally {
            setDeletingVaultId("");
          }
        })();
      },
    });
  }

  function handleSelectVault(item: FamilyVaultListItem) {
    family.setSelectedVaultId(item.familyVaultId);
    setOwnerUserId(item.ownerUserId);
    setVaultForm((c) => ({ ...c, ownerUserId: item.ownerUserId }));
    setBirthForm((c) => ({ ...c, ownerUserId: item.ownerUserId }));
  }

  function handleEditFamilyMember(member: FamilyAggregateMember) {
    const mc = family.memberCharts.find((x) => x.memberId === member.familyMemberId);
    const bp = mc?.chart.birthProfile;
    // Guard: member charts may still be loading — don't open with empty fields
    if (!bp) return;
    setEditMember({
      memberId: member.familyMemberId,
      displayName: member.displayName,
      relationshipToOwner: (bp.relationshipToOwner as Relationship) ?? "other",
      memberWeight: member.memberWeight.toFixed(2),
      birthDateLocal: bp.birthDateLocal ?? "",
      birthTimeLocal: bp.birthTimeLocal ?? "",
      birthPlace: bp.birthPlace ?? "",
      birthLatitude: bp.birthLatitude?.toString() ?? "",
      birthLongitude: bp.birthLongitude?.toString() ?? "",
      birthTimezone: bp.birthTimezone ?? "",
      currentPlace: bp.currentPlace ?? "",
      currentLatitude: bp.currentLatitude?.toString() ?? "",
      currentLongitude: bp.currentLongitude?.toString() ?? "",
      currentTimezone: bp.currentTimezone ?? "",
    });
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="site cd-shell" data-lang={lang}>

      {/* Print-only brand lockup. Hidden on screen; appears at the top of
          browser-printed / "Save as PDF" output so printouts read as a Vinaadi
          document. Pairs with the brand-first <title> in dashboard/layout.tsx. */}
      <div className="cd-print-brand" aria-hidden="true">
        <span className="cd-print-brand__name">Vinaadi AI</span>
        <span className="cd-print-brand__tag">{lang === "ta" ? "திருக்கணித ஜோதிடம்" : "Thirukanitham Jothidam"}</span>
      </div>

      <DashboardHero
        lang={lang}
        activeTab={activeTab}
        birthDisplayName={birthForm.displayName}
        status={status}
        chartSummary={personal.chartSummary}
        birthTimeConfidenceMinutes={personal.chart?.birthProfile.birthTimeConfidenceMinutes ?? null}
        birthTimeLocal={personal.chart?.birthProfile.birthTimeLocal ?? null}
        selectedVault={selectedVault}
        selectedVaultId={family.selectedVaultId}
        selectedDate={selectedDate}
        panchangamSunrise={personal.panchangam?.sunrise ?? null}
        panchangamPlace={personal.chart?.birthProfile.currentPlace ?? personal.chart?.birthProfile.birthPlace ?? null}
        userEmail={session.userEmail}
        showUserMenu={session.showUserMenu}
        alertCount={personal.ambientAlerts.length}
        alertItems={personal.ambientAlerts.map((a) => ({
          type: a.source,
          title: lang === "ta" ? a.title.ta : a.title.en,
          body: lang === "ta" ? a.message.ta : a.message.en,
        }))}
        inboxItems={inboxItems}
        inboxUnreadCount={inboxUnreadCount}
        onMarkAllRead={handleMarkAllRead}
        onMarkOneRead={handleMarkOneRead}
        onTabChange={goToTab}
        onDateChange={setSelectedDate}
        onLangToggle={() => setLang((l) => l === "ta" ? "en" : "ta")}
        onUserMenuToggle={() => session.setShowUserMenu((v) => !v)}
        onUserMenuClose={() => session.setShowUserMenu(false)}
        onGoToSettings={() => {
          navigateSettings("account");
          session.setShowUserMenu(false);
        }}
        onSignOut={() => {
          session.setShowUserMenu(false);
          session.signOut();
        }}
        onAskVinaadi={personal.chartId ? () => setAskVinaadiOpen(true) : undefined}
      />

      {/* Destructive-action confirmation (DASH-05) */}
      {confirmDialog && (
        <ConfirmDialog
          lang={lang}
          state={confirmDialog}
          onClose={() => setConfirmDialog(null)}
        />
      )}

      {/* Edit member modal */}
      {editMember && (
        <EditMemberModal
          lang={lang}
          editMember={editMember}
          busySaving={busyEditingMember}
          onClose={() => setEditMember(null)}
          onChange={setEditMember}
          onSave={() => void handleSaveEdit()}
        />
      )}

      {/* Edit personal profile modal */}
      {showEditProfile && (
        <EditProfileModal
          lang={lang}
          birthForm={birthForm}
          busySaving={busyEditingProfile}
          isExistingProfile={!!personal.birthProfileId}
          onClose={() => setShowEditProfile(false)}
          onChange={setBirthForm}
          onSubmit={handleSaveProfile}
          onOpenRectification={() => setShowRectification(true)}
          onDeleteProfile={() => void handleDeleteProfile()}
        />
      )}

      <div className="cd-app-body" data-active-tab={activeTab}>
      <div className="cd-main-content" data-active-tab={activeTab}>
      <div className="cd-main-content__body">

      {exploreReturnTab === activeTab && activeTab !== "explore" && (
        <div style={{ padding: "var(--space-3) var(--space-3) 0" }}>
          <button
            type="button"
            onClick={returnToExplore}
            aria-label={lang === "ta" ? "ஆராய் பக்கத்துக்கு திரும்பு" : "Back to Explore"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              minHeight: 36,
              padding: "7px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--panel-tan-light)",
              background: "var(--panel-cream)",
              color: "var(--panel-earth)",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <span aria-hidden="true">←</span>
            {lang === "ta" ? "ஆராய் பக்கத்துக்கு திரும்பு" : "Back to Explore"}
          </button>
        </div>
      )}

      {/* Onboarding banner: shown until profile + one family member added */}
      {!onboardingDone && session.hydrated && (
        <div className="cd-onboarding">
          <div className="cd-onboarding__card">
            <div className="cd-onboarding__content">
              <p className="cd-onboarding__title">
                {t("onboarding_title", lang)}
              </p>
              <div className="cd-onboarding__steps">
                <div className="cd-onboarding__step">
                  <span className={`cd-onboarding__step-badge ${personal.birthProfileId ? "is-done" : "is-pending"}`}>
                    {personal.birthProfileId ? "✓" : "1"}
                  </span>
                  <span className={`cd-onboarding__step-text ${personal.birthProfileId ? "is-done" : ""}`}>
                    {t("onboarding_step1", lang)}
                  </span>
                </div>
                {(() => {
                  const hasMember = family.vaults.some((v) => v.memberCount > 0);
                  return (
                    <div className="cd-onboarding__step">
                      <span className={`cd-onboarding__step-badge ${hasMember ? "is-done" : "is-pending"}`}>
                        {hasMember ? "✓" : "2"}
                      </span>
                      <span className={`cd-onboarding__step-text ${hasMember ? "is-done" : ""}`}>
                        {t("onboarding_step2", lang)}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
            <button
              type="button"
              onClick={() => { goToTab("settings"); setSettingsSubTab("setup"); }}
              className="cd-onboarding__cta"
            >
              {t("onboarding_go_setup", lang)}
            </button>
          </div>
        </div>
      )}

      {/* Tab content */}
      <div className="cd-page site__body" style={{ position: "relative" }}>
        {/* Decorative celestial sky filling the whole content column — a crown
            of light at the top plus a star field the full scroll height, behind
            all tab content (which is lifted to zIndex 1 below). Moon-reactive:
            the selected day's tithi lifts the night wash + star brightness
            (Pournami luminous, Amavasai a deep new-moon night). */}
        <CelestialAmbientNova
          moon={personal.panchangam ? moonPhaseFromTithi(personal.panchangam.tithi.number, personal.panchangam.tithi.paksha) : null}
        />
        <TabPane visible={isPaneRendered("settings-setup")} active={activeTab === "settings" && settingsSubTab === "setup"}>
          <DashboardSetupTab
            lang={lang}
            birthProfileId={personal.birthProfileId}
            selectedVaultId={family.selectedVaultId}
            selectedVault={selectedVault}
            vaults={family.vaults}
            birthForm={birthForm}
            vaultForm={vaultForm}
            memberForm={memberForm}
            formErrors={formErrors}
            busy={{ createProfile: busyCreateProfile, createVault: busyCreateVault, addMember: busyAddMember }}
            onNavigate={navigateSettings}
            onBirthFormChange={setBirthForm}
            onVaultFormChange={setVaultForm}
            onMemberFormChange={setMemberForm}
            onFormErrorChange={(patch) => setFormErrors((c) => ({ ...c, ...patch }))}
            onCreateProfile={handleCreateProfile}
            onCreateVault={handleCreateVault}
            onAddMember={handleAddMember}
            onSelectVault={(vaultId, uid) => { family.setSelectedVaultId(vaultId); setOwnerUserId(uid); }}
            onShowEditProfile={() => setShowEditProfile(true)}
            familyMembers={family.familyAggregate?.members ?? []}
            onEditMember={handleEditFamilyMember}
            onGoToPersonal={() => setActiveTab("personal")}
          />
        </TabPane>

        <TabPane visible={isPaneRendered("personal")} active={activeTab === "personal"}>
          <DashboardTodayTabNova
            lang={lang}
            activeLifeMode={activeLifeMode}
            birthDisplayName={birthForm.displayName}
            selectedDate={selectedDate}
            todayDate={personal.todayDate}
            personalMemberChart={personalMemberChart}
            personalChartSummary={personalChartSummary}
            personalDailyGuidance={personalDailyGuidance}
            personalSani={personalSani}
            peyarchiUpcoming={personalPeyarchiUpcoming}
            panchangam={personal.panchangam}
            panchangamTimings={personal.panchangamTimings}
            weekAhead={personal.weekAhead}
            familyAggregate={familyAggregateForToday}
            remedyMemberCharts={family.memberCharts}
            lifeAreas={personal.lifeAreas}
            dasha={personalDasha}
            dashaAntar={personalDashaAntar}
            dailyGuidanceRange={personal.dailyGuidanceRange}
            panchangamTimezone={personal.panchangamTimezone}
            bundleSectionErrors={personal.bundleSectionErrors}
            onRetryBundle={() => void personal.refreshPersonalBundle(undefined, undefined, true, { forceDay: true })}
            onGoToFamily={() => focusFamily("hy-members")}
            onGoToJournal={() => setActiveTab("journal")}
            onGoToCalendar={() => setActiveTab("calendar")}
            onGoToLifeAreas={() => setActiveTab("life-areas")}
            onGoToChart={() => focusFamily("hy-dashas")}
            onGoToCharts={() => setActiveTab("family")}
            onOpenAskVinaadi={() => setAskVinaadiOpen(true)}
            onOpenNotificationSettings={() => navigateSettings("notifications")}
            needsProfile={needsProfile}
            onOpenChartGen={() => focusTool("chartgen")}
            onOpenMuhurta={() => focusCalendar("muhurta")}
            onOpenCompatibility={() => focusTool("synastry")}
            onOpenActivityTiming={() => focusTool("activityTiming")}
            onOpenRasipalan={() => focusTool("rasipalan")}
            onOpenNumerology={() => focusTool("numerology")}
            onGoToExplore={() => goToTab("explore")}
            onGoToAllTools={() => goToTab("tools")}
          />
        </TabPane>

        <TabPane visible={isPaneRendered("tools")} active={activeTab === "tools"}>
          {(() => {
          // `activeTool` is component-level state now (it used to be derived
          // here from the nine show* booleans) — that is what makes it
          // addressable as `/dashboard/tools/<tool>`.
          // Note: Find Birth Time (rectification) removed — results were unreliable
          // needsProfile/openTool/closeTool now live at component level (see
          // above, near the other cross-tab focus helpers) so Today's Quick
          // Links can reuse them via focusTool.
          // Compatibility tool (moved from the Family page 2026-07-21): join the
          // vault's member charts with their relationship labels for the picker.
          const synastryMemberOptions = family.memberCharts.map((mc) => {
            const fm = family.familyMembers.find((f) => f.familyMemberId === mc.memberId);
            return { memberId: mc.memberId, displayName: mc.displayName, relationshipToOwner: fm?.relationshipToOwner ?? "other" };
          });
          // Numerology's "Reading for" switcher — same member charts as
          // Compatibility above, just the {memberId, displayName, chartId}
          // shape the panel's picker needs.
          const numerologyMembers = family.memberCharts.map((mc) => ({
            memberId: mc.memberId,
            displayName: mc.displayName,
            chartId: mc.chart.chartId,
          }));

          return (
            <DashboardToolsTabNova
              lang={lang}
              activeTool={activeTool}
              needsProfile={needsProfile}
              onOpenTool={openTool}
              onCloseTool={closeTool}
              showPorutham={showPorutham}
              showChartGenerate={showChartGenerate}
              showWrapped={showWrapped}
              showRetrospective={showRetrospective}
              showRasipalan={showRasipalan}
              showActivityTiming={showActivityTiming}
              showVarshaphala={showVarshaphala}
              showSynastry={showSynastry}
              showNumerology={showNumerology}
              showBabyNames={showBabyNames}
              varshaphalaData={varshaphalaData}
              varshaphalaLoading={varshaphalaLoading}
              onLoadVarshaphala={(year) => void loadVarshaphala(year)}
              personalChartId={personal.chartId}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              familyVaultId={family.selectedVaultId ?? undefined}
              numerologyMembers={numerologyMembers}
              ownerChart={personal.chart}
              synastryMemberCharts={family.memberCharts}
              synastryMemberOptions={synastryMemberOptions}
              relationshipAlerts={family.relationshipAlerts}
              relationshipAlertsLoading={family.relationshipAlertsLoading}
              familyMembersForPorutham={[
                ...(personal.chart ? [{
                  memberId: `owner:${personal.chart.birthProfile.birthProfileId}`,
                  displayName: personal.chart.birthProfile.displayName,
                  birthDateLocal: personal.chart.birthProfile.birthDateLocal,
                  birthTimeLocal: personal.chart.birthProfile.birthTimeLocal ?? "",
                  birthPlace: personal.chart.birthProfile.birthPlace,
                  birthLatitude: personal.chart.birthProfile.birthLatitude,
                  birthLongitude: personal.chart.birthProfile.birthLongitude,
                  birthTimezone: personal.chart.birthProfile.birthTimezone,
                }] : []),
                ...family.memberCharts
                  .filter((mc) => mc.chart.birthProfile.birthProfileId !== personal.chart?.birthProfile.birthProfileId)
                  .map((mc) => ({
                    memberId: mc.memberId,
                    displayName: mc.displayName,
                    birthDateLocal: mc.chart.birthProfile.birthDateLocal,
                    birthTimeLocal: mc.chart.birthProfile.birthTimeLocal ?? "",
                    birthPlace: mc.chart.birthProfile.birthPlace,
                    birthLatitude: mc.chart.birthProfile.birthLatitude,
                    birthLongitude: mc.chart.birthProfile.birthLongitude,
                    birthTimezone: mc.chart.birthProfile.birthTimezone,
                  })),
              ]}
              onGoToPlan={() => goToTab("plan")}
              onGoToCalendar={() => goToTab("calendar")}
              onOpenAskVinaadi={() => setAskVinaadiOpen(true)}
            />
          );
          })()}
        </TabPane>

        <TabPane visible={isPaneRendered("family")} active={activeTab === "family"}>
          {(() => {
          const familyTabProps: DashboardFamilyChartsHybridProps = {
            lang,
            selectedDate,
            selectedVaultId: family.selectedVaultId,
            ownerChartId: personal.chartId,
            ownerChart: personal.chart,
            ownerMemberChart,
            vaults: family.vaults,
            familyDetail: family.familyDetail,
            familyAggregate: familyAggregateForToday,
            familyComposite: family.familyComposite,
            familyMembers: family.familyMembers,
            memberCharts: family.memberCharts,
            relationshipAlerts: family.relationshipAlerts,
            alertsLoading: family.relationshipAlertsLoading,
            panchangam: personal.panchangam,
            mode: session.userMode,
            onGoToJournal: () => goToTab("journal"),
            onOpenPrasna: () => setShowPrasna(true),
            showPrasna,
            onClosePrasna: () => setShowPrasna(false),
            busy: {
              family: family.busyFamily,
              vaults: family.busyVaults,
              deletingVaultId,
              deletingMemberId,
              memberCharts: family.busyMemberCharts,
            },
            onRefreshFamily: () => void family.refreshFamilyBundle(),
            onOpenSetup: openSetupInSettings,
            onSelectVault: handleSelectVault,
            onDeleteVault: (vaultId: string, name: string) => void handleDeleteVault(vaultId, name),
            onDeleteMember: (memberId: string, name: string) => void handleDeleteMember(memberId, name),
            onEditMember: handleEditFamilyMember,
            onGoToLifeAreas: () => goToTab("life-areas"),
            onGoToRemedies: () => focusLifeAreas("remedies"),
            onGoToForecast: () => focusLifeAreas("predictions"),
            onGoToTools: () => goToTab("tools"),
            focusSection: familyFocusSection,
            onFocusConsumed: () => setFamilyFocusSection(null),
          };
          return <DashboardFamilyChartsHybrid {...familyTabProps} />;
          })()}
        </TabPane>

        <TabPane visible={isPaneRendered("calendar")} active={activeTab === "calendar"}>
          <DashboardCalendarTabNova
            selectedDate={selectedDate}
            todayDate={personal.todayDate}
            panchangam={personal.panchangam}
            panchangamTimings={personal.panchangamTimings}
            lang={lang}
            locationLabel={personal.panchangamLocationLabel}
            panchangamTimezone={personal.panchangamTimezone}
            onSelectDate={setSelectedDate}
            chartId={resolveMuhurtaChartId()}
            memberCharts={family.memberCharts.map((mc) => ({ memberId: mc.memberId, displayName: mc.displayName }))}
            selectedMemberId={muhurtaMemberId}
            onSelectMember={setMuhurtaMemberId}
            focusView={calendarFocusView}
            onFocusConsumed={() => setCalendarFocusView(null)}
          />
        </TabPane>

        <TabPane visible={isPaneRendered("life-areas")} active={activeTab === "life-areas"}>
          <DashboardLifeAreasTabNova
            lang={lang}
            personalDailyGuidance={lifeAreasDailyGuidance}
            dailyGuidanceRange={!lifeAreasViewId ? personal.dailyGuidanceRange : undefined}
            personalTransit={lifeAreasTransit}
            personalSani={lifeAreasSani}
            panchangam={personal.panchangam}
            lifeAreas={personal.lifeAreas}
            predictions={personal.predictions}
            predictionsLoading={personal.predictionsLoading}
            yogas={(lifeAreasMemberChart?.chart ?? personal.chart)?.yogas ?? []}
            doshams={(lifeAreasMemberChart?.chart ?? personal.chart)?.doshams ?? []}
            jadhagamReport={personal.jadhagamReport}
            jadhagamReportLoading={personal.jadhagamReportLoading}
            onLoadJadhagamReport={() => void personal.loadJadhagamReport(resolveLifeAreasChartId())}
            chartSummary={lifeAreasMemberChart?.summary ?? personal.chartSummary}
            birthDisplayName={birthForm.displayName}
            maritalStatus={(() => {
              if (!lifeAreasViewId) return birthForm.maritalStatus || undefined;
              const mc = family.memberCharts.find((m) => m.memberId === lifeAreasViewId);
              const rel = mc?.chart.birthProfile.relationshipToOwner;
              // Spouse/parent/grandparent are definitionally married — no need to ask
              if (rel === "spouse" || rel === "parent" || rel === "grandparent") return "married";
              return undefined;
            })()}
            memberCharts={family.memberCharts.map((mc) => ({ memberId: mc.memberId, displayName: mc.displayName }))}
            selectedMemberId={lifeAreasViewId}
            onSelectMember={setLifeAreasViewId}
            chartId={resolveLifeAreasChartId()}
            remedyPlan={remedyPlan}
            gemstoneAdvice={gemstoneAdvice}
            remediesLoading={remediesLoading}
            onLoadRemedies={() => void loadRemedies(resolveLifeAreasChartId())}
            goals={plan.goals}
            onGoToPlan={() => goToTab("plan")}
            onGoToChart={() => goToTab("family")}
            focusSubTab={lifeAreasFocusSubTab}
            onFocusConsumed={() => setLifeAreasFocusSubTab(null)}
          />
        </TabPane>

        <TabPane visible={isPaneRendered("plan")} active={activeTab === "plan"}>
          <DashboardPlanTabNova
            lang={lang}
            chartId={personal.chartId}
            hasBirthProfile={!!personal.birthProfileId}
            goals={plan.goals}
            goalsBusy={plan.goalsBusy}
            addingGoalType={plan.addingGoalType}
            onAddingGoalTypeChange={plan.setAddingGoalType}
            removingGoalId={plan.removingGoalId}
            onAddGoal={(goalType) => void plan.addGoal(goalType)}
            onRemoveGoal={(goalId) => void plan.removeGoal(goalId)}
            whatIfScenario={plan.whatIfScenario}
            whatIfDate={plan.whatIfDate}
            whatIfResult={plan.whatIfResult}
            whatIfBusy={plan.whatIfBusy}
            whatIfError={plan.whatIfError}
            onWhatIfScenarioChange={plan.setWhatIfScenario}
            onWhatIfDateChange={plan.setWhatIfDate}
            onRunWhatIf={() => void plan.runWhatIf()}
            mode={session.userMode}
            onGoToLifeAreas={() => goToTab("life-areas")}
            onGoToCalendar={() => goToTab("calendar")}
            onGoToMuhurta={() => focusCalendar("muhurta")}
            onGoToJournal={() => goToTab("journal")}
            onGoToChart={() => goToTab("family")}
          />
        </TabPane>

        <TabPane visible={isPaneRendered("journal")} active={activeTab === "journal"}>
          <DashboardJournalTabNova
            lang={lang}
            chartId={personal.chartId}
            selectedDate={selectedDate}
            hasBirthProfile={!!personal.birthProfileId}
            journalEntries={journal.journalEntries}
            journalTotal={journal.journalTotal}
            contextData={journal.contextData}
            onEntrySaved={() => journal.loadJournalEntries(personal.chartId)}
            onEntryArchived={() => journal.loadJournalEntries(personal.chartId)}
            mode={session.userMode}
            chartSummary={personal.chartSummary}
            journalCorrelations={personal.journalCorrelations}
            onGoToChart={() => goToTab("family")}
            onManageContext={() => navigateSettings("context")}
          />
        </TabPane>

        <TabPane visible={isPaneRendered("explore")} active={activeTab === "explore"}>
          <DashboardExploreTabNova
            lang={lang}
            personalChartSummary={personalChartSummary}
            personalChart={personalChart}
            personalDailyGuidance={personalDailyGuidance}
            nakshatraCard={personalMemberChart?.nakshatraCard ?? personal.nakshatraCard}
            memberCharts={family.memberCharts}
            onNavigate={goToExploreDestination}
            onOpenAskVinaadi={() => setAskVinaadiOpen(true)}
          />
        </TabPane>

        {ENABLE_QA_TAB && (
          <TabPane visible={isPaneRendered("qa")} active={activeTab === "qa"}>
            <QATab lang={lang} />
          </TabPane>
        )}

        <TabPane visible={isPaneRendered("settings-session")} active={activeTab === "settings" && settingsSubTab === "session"}>
          <DashboardSettingsSessionTab
            lang={lang}
            section={settingsSection}
            onNavigate={navigateSettings}
            onLangChange={setLang}
            userDisplayName={birthForm.displayName}
            moonRasi={personalChartSummary?.moonRasi ?? ""}
            janmaNakshatra={personalChartSummary?.janmaNakshatra ?? ""}
            lagnaRasi={personalChartSummary?.lagnaRasi ?? ""}
            vaultName={selectedVault?.name ?? ""}
            ownerUserId={ownerUserId}
            selectedDate={selectedDate}
            selectedVaultId={family.selectedVaultId}
            birthProfileId={personal.birthProfileId}
            chartId={personal.chartId}
            contextData={journal.contextData}
            onContextUpdated={(data) => journal.setContextData(data)}
            busyPersonal={personal.busyPersonal}
            busyFamily={family.busyFamily}
            journalRetentionDays={journalRetentionDays}
            journalLastUpdatedAt={journal.journalSettings?.lastUpdatedAt ?? null}
            journalLastRetentionReviewedAt={journal.journalSettings?.lastRetentionReviewedAt ?? null}
            journalNextRecommendedReviewDate={journal.journalSettings?.nextRecommendedReviewDate ?? null}
            busyJournalSettings={journal.busyJournalSettings}
            notificationPrefs={journal.notificationPrefs}
            onNotificationPrefsSaved={journal.setNotificationPrefs}
            userMode={session.userMode}
            goalTrack={session.goalTrack}
            onSaveUserSettings={async (mode, track) => {
              try {
                await apiFetchJson("/api/v1/auth/me", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ userMode: mode, goalTrack: track }),
                });
                session.setUserMode(mode);
                session.setGoalTrack(track);
              } catch {
                // ignore
              }
            }}
            onSelectedDateChange={setSelectedDate}
            onRefreshPersonal={() => void personal.refreshPersonalBundle(undefined, undefined, true, { forceDay: true })}
            onRefreshFamily={() => void family.refreshFamilyBundle()}
            onSaveJournalRetentionDays={(days) => void journal.saveJournalRetentionDays(days)}
            onAcknowledgeJournalReminder={() => void journal.acknowledgeJournalReminder()}
            onApplyRetention={(dryRun) => journal.applyJournalRetention(personal.chartId, dryRun)}
            busyRetentionApply={journal.busyRetentionApply}
            onSignOut={session.signOut}
          />
        </TabPane>
      </div>
      </div>{/* cd-main-content__body */}

      {/* Dashboard footer. Layout rationale lives in the "Footer redesign"
          block in dashboard-nova.css; the 2026-07-20 Apple pass reordered
          the regions to Apple's global-footer sequence — legal disclaimer
          FIRST (a footnote qualifying everything above it, so it reads
          before the navigation rather than as an afterthought beside the
          copyright), then the link grid, then the copyright baseline, with
          a hairline between each.

          Deliberately NOT accordions: Apple collapses footer columns behind
          chevrons because their global footer carries ~60 links. This one
          carries 6. Collapsing them would hide content that costs nothing
          to show and put two taps between the user and a tab — the pattern
          without the problem it solves. Columns stay open at every width. */}
      <footer className="cd-footer">
        <div className="cd-footer__inner">

          <p className="nova-footer__legal">
            {lang === "ta"
              ? "ஜோதிடம் ஒரு பாரம்பரிய நம்பிக்கை அமைப்பு — அறிவியல் உண்மை அல்ல. மருத்துவ, சட்ட, நிதி முடிவுகளுக்கு தகுதிவாய்ந்த நிபுணரை அணுகுங்கள்."
              : "Astrology is a traditional belief system, not a scientific fact. For medical, legal, or financial decisions, consult a qualified professional."}
          </p>

          <div className="cd-footer__divider" />

          <div className="nova-footer__grid">
            <div className="nova-footer__brand">
              <p className="cd-footer__wordmark">Vinaadi</p>
              <p className="nova-footer__tagline">
                {lang === "ta" ? "ஜோதிட வழிகாட்டல் — தினமும் சூரிய உதயத்திற்கு முன்." : "Jothidam guidance, every morning before sunrise."}
              </p>
            </div>

            {/* Real navigation, not link-styled spans (DASH-13) — every
                element styled as a link must actually go somewhere. */}
            <nav className="nova-footer__nav" aria-label={lang === "ta" ? "அடிக்குறிப்பு வழிசெலுத்தல்" : "Footer navigation"}>
              {([
                {
                  head: { en: "Explore", ta: "ஆராயுங்கள்" },
                  links: [
                    { tab: "personal" as Tab, ta: "இன்று", en: "Today" },
                    { tab: "calendar" as Tab, ta: "நாட்காட்டி", en: "Calendar" },
                    { tab: "life-areas" as Tab, ta: "வாழ்க்கைத் துறைகள்", en: "Life Areas" },
                  ],
                },
                {
                  head: { en: "Personal", ta: "தனிப்பட்ட" },
                  links: [
                    { tab: "family" as Tab, ta: "குடும்பம் & ஜாதகம்", en: "Family & Charts" },
                    { tab: "journal" as Tab, ta: "குறிப்பேடு", en: "Journal" },
                    { tab: "settings" as Tab, ta: "அமைப்புகள்", en: "Settings" },
                  ],
                },
              ]).map((col) => (
                <div key={col.head.en} className="nova-footer__nav-col">
                  <h2 className="nova-footer__nav-head">
                    {lang === "ta" ? col.head.ta : col.head.en}
                  </h2>
                  <div className="nova-footer__nav-links">
                    {col.links.map((link) => (
                      <button
                        key={link.tab}
                        type="button"
                        className="nova-footer__nav-link"
                        onClick={() => goToTab(link.tab)}
                      >
                        {lang === "ta" ? link.ta : link.en}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className="nova-footer__quick">
              <h2 className="nova-footer__nav-head">
                {lang === "ta" ? "விரைவு அமைப்பு" : "Quick setting"}
              </h2>
              <DashboardFooterMorningGuidance lang={lang} onOpenSettings={() => navigateSettings("notifications")} />
            </div>
          </div>

          <div className="cd-footer__divider" />

          <div className="cd-footer__bottom">
            <p className="cd-footer__copy">
              © {new Date().getFullYear()} Vinaadi
            </p>
          </div>

        </div>
      </footer>

      </div>{/* cd-main-content */}
      </div>{/* cd-app-body */}

      {/* Feedback FAB — Clarity ink style */}
      <button
        type="button"
        onClick={() => setShowFeedback(true)}
        title={t("feedback_btn", lang)}
        aria-label={t("feedback_btn", lang)}
        className="cd-feedback-fab"
      >
        ✉
      </button>

      {personal.chartId && (
        <DashboardAskVinaadiWidget
          lang={lang}
          chartId={personal.chartId}
          goalTrack={session.goalTrack}
          activeLifeMode={activeLifeMode}
          open={askVinaadiOpen}
          onOpenChange={setAskVinaadiOpen}
          hideLauncher
        />
      )}

      {showFeedback && <FeedbackModal lang={lang} onClose={() => setShowFeedback(false)} />}

      {lifeModePickerOpen && (
        <LifeModePicker
          lang={lang}
          currentMode={activeLifeMode}
          blockedModes={lifeModeStatus?.blockedModes ?? []}
          onClose={() => setLifeModePickerOpen(false)}
          onSelected={(status) => setLifeModeStatus(status)}
        />
      )}

      {showRectification && personal.birthProfileId && (
        <RectificationWizard
          lang={lang}
          birthProfileId={personal.birthProfileId}
          onApply={(time) => {
            setShowRectification(false);
            showToast(`Birth time updated: ${time}`, "success");
          }}
          onClose={() => setShowRectification(false)}
        />
      )}

    </div>
  );
}




