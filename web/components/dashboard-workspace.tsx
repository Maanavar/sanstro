"use client";

import dynamic from "next/dynamic";
import { LocalizedLink as Link } from "@/components/localized-link";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { MotionConfig, motion, useReducedMotion } from "framer-motion";

import { toast } from "sonner";
import { getLifeMode, updateLifeMode } from "@vinaadi/shared/api";
import { isLocationMismatch, pickCheckIn } from "@vinaadi/shared/checkIn";
import { apiFetchJson, toQuery } from "@/lib/api";
import { getFriendlyErrorMessage } from "@/lib/error-messages";
import { isBirthDateWithinBounds } from "@/lib/birth-date";
import type { Tab } from "@/lib/dashboard-tabs";
import { todayIso } from "@/lib/format";
import { DUR, EASE_NOVA } from "@/lib/motion";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { dt, ONBOARDING_DETAIL_LEVEL } from "@/lib/dashboard-i18n";
import { appliedFocus } from "@/lib/life-focus";
import { parseLatitude, parseLongitude } from "@/lib/validation";
import type {
  ApiEnvelope,
  BirthProfileCreateResponseData,
  FamilyAggregateMember,
  FamilyVaultListItem,
  LifeMode,
  LifeModeStatus,
  BirthProfileResponse,
} from "@/lib/types";

import { useSession } from "@/hooks/useSession";
import type { UserMode } from "@/hooks/useSession";
import { usePersonalData } from "@/hooks/usePersonalData";
import { useDeviceTimeZone } from "@/hooks/useDeviceTimeZone";
import { useFamilyData } from "@/hooks/useFamilyData";
import { usePlanData } from "@/hooks/usePlanData";
import { useJournalData } from "@/hooks/useJournalData";
import { useNotificationInbox } from "@/hooks/useNotificationInbox";
import { ENABLE_QA_TAB, useWorkspaceNavigation } from "@/hooks/useWorkspaceNavigation";

import type { EditMemberState } from "./dashboard-edit-member-modal";
import { ConfirmDialog, type ConfirmDialogState } from "./modal-shell";
import type { StatusMessage } from "./dashboard-ui-nova";
import { CelestialAmbientNova } from "./celestial-ambient-nova";
import { useLang } from "./lang-toggle";
import { moonPhaseFromTithi } from "@/lib/lunar";
import { DashboardHero } from "./dashboard-hero";
import { DashboardFooterMorningGuidance } from "./dashboard-footer-morning-nova";
import { LifeModePicker, lifeModeLabel } from "./life-mode-picker";
import { DashboardAskVinaadiWidget } from "./dashboard-ask-vinaadi-widget";
import { ViewSwap } from "./ui/view-swap";
import {
  chartIdFor, isOwnChart, maritalStatusFor, memberChartFor, memberPickerOptions, numerologyMembers,
  ownerAsMemberChart, poruthamCandidates, reconcileOwnerScore, synastryMemberOptions,
} from "./dashboard-workspace-chart-view";

const STORAGE_KEY = "jothidam-ai-dashboard-state";
/** Holds the `lifeModeSetAt` whose 60-day focus strip the reader dismissed. */
const FOCUS_NUDGE_DISMISSED_KEY = "vinaadi-focus-nudge-dismissed";

/**
 * Footer link — either a workspace tab (local state + a URL rewrite, no
 * remount) or a real route outside the workspace.
 *
 * The two are deliberately not collapsed into one shape. A tab entry MUST stay
 * a `<button>`: routing it as a link would take the `(workspace)` layout out
 * from under itself and bring back the nav bounce that layout exists to kill.
 * An `href` entry MUST stay a `<Link>`: it genuinely leaves, and dressing a
 * real navigation as a button costs the reader middle-click, open-in-new-tab
 * and the status-bar preview (DASH-13's rule, in the other direction).
 *
 * Written out arm by arm rather than as `{ en; ta } & (A | B)`: TS does not
 * narrow through an intersection whose right side is a union, so the factored
 * version left `link.tab` as `Tab | undefined` in the branch that needs it.
 */
type FooterNavLink =
  | { en: string; ta: string; tab: Tab; href?: undefined }
  | { en: string; ta: string; href: string; tab?: undefined };
type FooterNavColumn = { head: { en: string; ta: string }; links: FooterNavLink[] };

import { SkeletonDashboardCard } from "@/components/skeleton";

function LazyPanelFallback() {
  return (
    <div className="lazy-panel-fallback">
      <SkeletonDashboardCard lines={4} showIcon />
      <SkeletonDashboardCard lines={3} />
    </div>
  );
}

// DXA-05 — Today's own loading shape: the hero and Quick Links at their final
// heights (see .nova-today-fallback in dashboard-nova.css). The generic
// two-card fallback was ~320px where the loaded hero is ~525px, so the swap
// shoved every row below it down.
function LazyTodayFallback() {
  return (
    <div className="nova-today-fallback" aria-hidden="true">
      <div className="skel-card nova-today-fallback__hero" />
      <div className="skel-card nova-today-fallback__links" />
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
  // ssr: false, measured (DXA-05). With SSR on, the server sent the whole
  // ~1200px Today pane, and hydration then replaced it with this fallback
  // (~900px) until the chunk arrived — a 300px shrink at ~2.5s that moved
  // Quick Links and everything under it. The pane carries no server data
  // anyway (every hook fetches client-side), so the only thing SSR bought
  // here was that swap. Now the fallback IS the first paint and the real
  // pane replaces it at the same hero height.
  { loading: LazyTodayFallback, ssr: false },
);

const DashboardToolsTabNova = dynamic(
  () => import("./dashboard-tools-tab-nova").then((mod) => mod.DashboardToolsTabNova),
  { loading: LazyPanelFallback },
);

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
  memberForm: MemberFormState;
  // No activeTab: bare /dashboard always opens Today (DXA-02, D1). Older
  // stored states still carry one; it is ignored.
  lang: Lang;
  hasVisitedReading: boolean;
};

const defaultBirthForm: BirthFormState = {
  ownerUserId: "", displayName: "", birthDateLocal: "", birthTimeLocal: "",
  birthPlace: "", birthLatitude: "", birthLongitude: "", birthTimezone: "",
  currentPlace: "", currentLatitude: "", currentLongitude: "", currentTimezone: "",
  relationshipToOwner: "self", calculateNow: true,
  maritalStatus: "", employmentType: "", children: "",
  birthTimeSource: "unknown", birthTimeConfidenceMinutes: "0",
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
      // minHeight (DXA-05): the active pane is at least a screen tall, so the
      // footer starts below the fold and its moves while the pane fills in
      // are not layout shifts the reader sees.
      style={{ display: active ? "block" : "none", position: "relative", zIndex: 1, minHeight: "100vh" }}
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
  // Destination, URL sync, pane keep-alive, scroll reset and cross-tab focus.
  const {
    activeTab, setActiveTab, activeTool, settingsSubTab, setSettingsSubTab, settingsSection,
    isPaneRendered, exploreReturnTab,
    goToTab, goToExploreDestination, returnToExplore, openTool, closeTool, focusTool,
    openSetupInSettings, navigateSettings, adoptUrlDestination, enableUrlSync,
    lifeAreasFocusSubTab, focusLifeAreas, consumeLifeAreasFocus,
    calendarFocusView, focusCalendar, consumeCalendarFocus,
    familyFocusSection, focusFamily, consumeFamilyFocus,
  } = useWorkspaceNavigation();
  // In-design confirmation dialog for destructive actions (DASH-05) —
  // replaces the browser confirm() popups.
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayIso());
  // Starts at the language the page was *rendered* in (LangProvider is seeded
  // from the request cookie in app/layout.tsx), not at English (DXA-05).
  // Hard-coded "en" here meant a Tamil reader's dashboard painted in English
  // and flipped a second later, when localStorage and then the DB preference
  // landed below — every label re-set, and the top bar's tab strip, the Ask
  // pill and the sub-bar all re-flowed to Tamil's longer words. The effect
  // below stamps this onto <html lang>, so it was also overwriting the
  // server's own correct answer. localStorage and the DB still override it;
  // they simply no longer have an English first paint to correct.
  const [serverLang] = useLang();
  const [lang, setLang] = useState<Lang>(serverLang);

  // UI-only state: forms, modals, toast
  const [ownerUserId, setOwnerUserId] = useState("");
  const [birthForm, setBirthForm] = useState<BirthFormState>(defaultBirthForm);
  const [memberForm, setMemberForm] = useState<MemberFormState>(defaultMemberForm);
  const [editMember, setEditMember] = useState<EditMemberState | null>(null);
  // Bumped after a successful save so BirthProfilesManager, which owns its own
  // fetch, reloads instead of showing the values the reader just changed.
  const [birthProfilesReloadToken, setBirthProfilesReloadToken] = useState(0);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showRectification, setShowRectification] = useState(false);
  const [askVinaadiOpen, setAskVinaadiOpen] = useState(false);

  // The nine `show*` flags are derived from the one open tool, so every
  // consumer downstream reads them unchanged.
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
    const chartId = targetChartId ?? lifeAreasChartId;
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
          // /gemstone-advice names these `gemstone_name_*` (app/api/remedies.py);
          // reading `gemstone_*` here made every stone null, so the "optional"
          // group never rendered and a named stone printed "No gemstone needed".
          gemstoneNameTa: (r.gemstone_name_ta as string | null) ?? null,
          gemstoneNameEn: (r.gemstone_name_en as string | null) ?? null,
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
  const [busyAddMember, setBusyAddMember] = useState(false);
  const [busyEditingMember, setBusyEditingMember] = useState(false);
  const [busyEditingProfile, setBusyEditingProfile] = useState(false);
  const [deletingVaultId, setDeletingVaultId] = useState("");
  const [deletingMemberId, setDeletingMemberId] = useState("");

  // Member view selector for Life Areas. Today and Explore always read the reader's own chart.
  const [lifeAreasViewId, setLifeAreasViewId] = useState<string | null>(null);
  // Timing is explicitly scoped: a family member selected for a muhurta does
  // not silently replace the chart currently being read in Life Areas.
  const [muhurtaMemberId, setMuhurtaMemberId] = useState<string | null>(null);

  // null = not decided yet (DXA-04). The banner shows only on a definite
  // `false`; starting at `false` flashed "A few steps to get started" at every
  // finished user until the profile and vault lookups had answered.
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  // Onboarding step 3 — "read your two-minute chart result." Set once the
  // reader has actually been on Family & Charts (where the reading renders)
  // with a calculated chart, not merely once step 1 has a birth profile — the
  // two used to share step 1's condition, which marked step 3 done before the
  // reader had read anything.
  const [hasVisitedReading, setHasVisitedReading] = useState(false);

  // Notification inbox (bell). Poll, refresh-on-open and optimistic
  // mark-read live in the hook.
  const inbox = useNotificationInbox({ lang, onError: (msg) => toast.error(msg) });

  // ── Domain hooks ─────────────────────────────────────────

  const session = useSession({
    onSetupRedirect: useCallback(() => {
      setActiveTab("settings");
      setSettingsSubTab("setup");
    }, [setActiveTab, setSettingsSubTab]),
  });

  // ── Life Mode (Feature 2) ─────────────────────────────────
  const [lifeModeStatus, setLifeModeStatus] = useState<LifeModeStatus | null>(null);
  // Which way the picker was opened decides what its dismiss button does:
  // first run "Skip for now" records BALANCED; from the chip it just closes.
  const [lifeModePicker, setLifeModePicker] = useState<null | "first-run" | "change">(null);
  const [focusNudgeDismissed, setFocusNudgeDismissed] = useState(false);
  const activeLifeMode: LifeMode = lifeModeStatus?.mode ?? "BALANCED";

  const personal = usePersonalData({
    selectedDate,
    onStatus: setStatus,
    // Life-area predictions are 4 extra requests per chart+date that only the
    // Life Areas tab renders — don't fetch them while paging dates on Today
    // (DASH-04).
    predictionsEnabled: activeTab === "life-areas",
  });

  // Only a finished lookup that found nothing means "no profile" (DXA-03);
  // during the lookup the chart-dependent tiles must not grey out.
  const needsProfile = personal.birthProfileLookupDone && !personal.birthProfileId;

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
      const targetChartId = chartIdFor(family.memberCharts, lifeAreasViewId, personal.chartId);
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
      const targetChartId = chartIdFor(family.memberCharts, lifeAreasViewId, personal.chartId);
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

  // ── Hydration + localStorage restore (everything but the tab) ──

  useEffect(() => {
    if (!session.hydrated) return;
    const authedUserId = session.sessionUserId;
    setOwnerUserId(authedUserId);
    // The URL's destination outranks the restored session, whoever's it is.
    adoptUrlDestination();
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
          if (typeof parsed.hasVisitedReading === "boolean") setHasVisitedReading(parsed.hasVisitedReading);
          if (parsed.birthForm) setBirthForm((c) => ({ ...c, ...parsed.birthForm }));
          if (parsed.memberForm) setMemberForm((c) => ({ ...c, ...parsed.memberForm }));
          // The tab is deliberately NOT restored (DXA-02, owner decision D1):
          // bare /dashboard is always Today. Restoring the last tab here, after
          // /auth/me, swapped the screen under a returning user who had
          // already seen Today paint. A path or legacy ?tab= still wins above.
          if (parsed.lang === "ta" || parsed.lang === "en") setLang(parsed.lang);
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // ignore parse errors
    }
    enableUrlSync();
    // Load DB lang preference — overrides localStorage (works across devices).
    // GET /settings/ui answers flat ({ lang, dashboard_mode }) — there is no
    // { data } envelope to unwrap.
    void apiFetchJson<{ lang?: string }>("/api/v1/settings/ui").then((r) => {
      const dbLang = r?.lang;
      if (dbLang === "ta" || dbLang === "en") setLang(dbLang as Lang);
    }).catch(() => { /* non-critical — localStorage fallback is fine */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.hydrated]);

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

  // Debounced (DASH-12): birthForm/memberForm are dependencies, so
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
        memberForm,
        lang,
        hasVisitedReading,
      } as PersistedState));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [
    session.hydrated, ownerUserId, selectedDate,
    family.selectedVaultId, personal.birthProfileId, personal.chartId,
    birthForm, memberForm, lang, hasVisitedReading,
  ]);

  // Fires once, the first time the reader is actually on Family & Charts with
  // a calculated chart — see the state's own comment for why this is not
  // shared with step 1's condition.
  useEffect(() => {
    if (activeTab === "family" && personal.chartId && !hasVisitedReading) {
      setHasVisitedReading(true);
    }
  }, [activeTab, personal.chartId, hasVisitedReading]);

  // Keep ownerUserId in sync with the profile form.
  useEffect(() => {
    if (!session.hydrated) return;
    if (birthForm.ownerUserId !== ownerUserId) setBirthForm((c) => ({ ...c, ownerUserId }));
  }, [session.hydrated, ownerUserId, birthForm.ownerUserId]);

  // ── Onboarding gate ────────────────────────────────────

  useEffect(() => {
    if (!session.hydrated || !personal.birthProfileLookupDone) return;
    if (!personal.birthProfileId) {
      setActiveTab("settings");
      setSettingsSubTab("setup");
      setOnboardingDone(false);
    } else if (!family.vaultsReady) {
      // An unfetched vault list is "not known yet", not "no members".
      return;
    } else if (family.vaults.length === 0 || family.vaults.every((v) => v.memberCount === 0)) {
      setOnboardingDone(false);
    } else {
      setOnboardingDone(true);
    }
  }, [
    session.hydrated, personal.birthProfileLookupDone, personal.birthProfileId, family.vaultsReady, family.vaults,
    setActiveTab, setSettingsSubTab,
  ]);

  // ── Data trigger effects ───────────────────────────────

  useEffect(() => {
    if (session.hydrated && ownerUserId) void family.loadVaults(ownerUserId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.hydrated, ownerUserId]);

  useEffect(() => {
    if (session.hydrated) void journal.loadJournalSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.hydrated]);

  // Load the life focus. The full picker opens only on first run (the server's
  // flag, cleared by any save including Skip). A stale focus gets the inline
  // 60-day strip on Today instead (`focusNudgeDue`, computed server-side), never
  // the modal: docs/LIFE_FOCUS_PLAN_2026-09-22.md, D3.
  useEffect(() => {
    if (!session.hydrated || !personal.chartId) return;
    getLifeMode()
      .then((s) => {
        setLifeModeStatus(s);
        if (s.showLifeModePicker) setLifeModePicker("first-run");
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.hydrated, personal.chartId]);

  const keepLifeMode = useCallback(async () => {
    try {
      setLifeModeStatus(await updateLifeMode(activeLifeMode, "KEEP", "WEB"));
    } catch {
      // The strip stays up; the reader can try again or dismiss it.
    }
  }, [activeLifeMode]);

  const dismissFocusNudge = useCallback(() => {
    setFocusNudgeDismissed(true);
    try {
      window.localStorage.setItem(FOCUS_NUDGE_DISMISSED_KEY, lifeModeStatus?.lifeModeSetAt ?? "");
    } catch {
      // Storage unavailable: the dismissal holds for this session only.
    }
  }, [lifeModeStatus?.lifeModeSetAt]);

  // The location check is dismissed for the session only, not persisted: a
  // reader who waves it away and then opens the app from another city should
  // be asked again. The server-side stamp is what stops it recurring once it
  // has actually been answered.
  const [locationCheckDismissed, setLocationCheckDismissed] = useState(false);
  const dismissLocationCheck = useCallback(() => setLocationCheckDismissed(true), []);
  const onLocationResolved = useCallback(() => {
    setLocationCheckDismissed(true);
    // The backend has already dropped this profile's cached daily rows from
    // today forward if the place actually moved, so this refetch recomputes
    // rather than re-reading the old place's numbers.
    void personal.refreshPersonalBundle();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A dismissal is remembered against the timestamp it dismissed, so a later
  // stale period (after the focus is re-saved) asks again.
  useEffect(() => {
    const setAt = lifeModeStatus?.lifeModeSetAt;
    if (!setAt) return;
    try {
      setFocusNudgeDismissed(window.localStorage.getItem(FOCUS_NUDGE_DISMISSED_KEY) === setAt);
    } catch {
      // Storage unavailable: fall back to showing the strip.
    }
  }, [lifeModeStatus?.lifeModeSetAt]);

  // §2.3 — the focus strip and the location strip share one slot, and the
  // priority lives in @vinaadi/shared so mobile reaches the same answer. The
  // two signals arrive from different endpoints (life-mode settings vs. the
  // dashboard bundle), which is exactly why the rule cannot live in either.
  const deviceTimeZone = useDeviceTimeZone();
  const checkIn = pickCheckIn({
    locationMismatch: isLocationMismatch(deviceTimeZone, personal.panchangamTimezone),
    locationCheckDue: Boolean(personal.locationCheckDue),
    focusNudgeDue: Boolean(lifeModeStatus?.focusNudgeDue),
    dismissed: [
      ...(focusNudgeDismissed ? (["focus"] as const) : []),
      ...(locationCheckDismissed ? (["location-mismatch", "location-backstop"] as const) : []),
    ],
  });
  const showFocusNudge = checkIn === "focus";
  const locationCheck = checkIn === "location-mismatch" || checkIn === "location-backstop" ? checkIn : null;

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
  const lifeAreasChartId = chartIdFor(family.memberCharts, lifeAreasViewId, personal.chartId);
  useEffect(() => {
    if (!session.hydrated) return;
    const targetChartId = lifeAreasChartId;
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
  }, [session.hydrated, lifeAreasViewId, selectedDate, lifeAreasChartId]);

  function showToast(message: string, tone: "success" | "error" = "success") {
    if (tone === "error") toast.error(message);
    else toast.success(message);
  }

  // ── Derived / resolved state ──────────────────────────────

  const muhurtaChartId = chartIdFor(family.memberCharts, muhurtaMemberId, personal.chartId);

  const selectedVault = family.vaults.find((v) => v.familyVaultId === family.selectedVaultId) ?? null;

  const lifeAreasMemberChart = memberChartFor(family.memberCharts, lifeAreasViewId);

  const lifeAreasFocus = appliedFocus(lifeModeStatus, isOwnChart(family.familyMembers, lifeAreasViewId));
  // Phase 3. Today and Goals are always the reader's own chart; the muhurta view
  // follows its member picker; the month grid's chip is always read on the own chart.
  const ownFocus = appliedFocus(lifeModeStatus, true);
  const muhurtaFocus = appliedFocus(lifeModeStatus, isOwnChart(family.familyMembers, muhurtaMemberId));
  const monthFocus = personal.chartId && ownFocus.activities.length > 0
    ? { chartId: personal.chartId, activities: ownFocus.activities, label: lifeModeLabel(activeLifeMode, lang) }
    : null;

  const familyAggregateForToday = reconcileOwnerScore(
    family.familyAggregate, personal.chart?.birthProfile.birthProfileId, personal.dailyGuidance?.score,
  );

  // Life Areas tab specific resolved data (follows lifeAreasViewId selector) —
  // feeds the Overview sub-tab's guidance/gochar cards, moved here from
  // Family & Charts on 2026-07-09.
  const lifeAreasDailyGuidance = lifeAreasMemberChart?.dailyGuidance ?? personal.dailyGuidance;
  const lifeAreasTransit = lifeAreasMemberChart?.transit ?? personal.transit;
  const lifeAreasSani = lifeAreasMemberChart?.sani ?? personal.sani;
  // The aggregate's synthetic owner row (familyMemberId === birthProfileId) is excluded from
  // `memberCharts`, so the Family tab resolves the owner's tile from this instead.
  const ownerMemberChart = ownerAsMemberChart(personal);

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
      // A calculated chart lands on Family & Charts, not Today — that tab
      // opens on "Your chart in two/five minutes" (dashboard-family-charts-
      // hybrid.tsx), the plain-language reading, above every score and table
      // on the page. Today is a live dashboard built for a returning reader;
      // shown first, it is the jargon wall neither persona has context for
      // yet. `calculateNow` can be turned off (deferred to rectification), in
      // which case there is no reading yet and Today — which still finishes
      // the rest of onboarding — is the more useful landing.
      setActiveTab(response.data.chartId ? "family" : "personal");
    } catch (error) {
      const msg = getFriendlyErrorMessage(error);
      showToast(msg, "error"); setStatus(msg, "error");
    } finally { setBusyCreateProfile(false); }
  }

  async function handleAddMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateMemberForm(memberForm);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({});
    setBusyAddMember(true);
    try {
      // T19: a family space is useful only once there is someone else to add.
      // Do not make its creation a second onboarding gate; create it on the
      // first member submission and keep the person moving toward a result.
      let targetVaultId = family.selectedVaultId;
      if (!targetVaultId) {
        const vaultResponse = await apiFetchJson<ApiEnvelope<{
          familyVaultId: string; ownerUserId: string;
        }>>(
          "/api/v1/family-vaults",
          {
            method: "POST",
            body: JSON.stringify({
              ownerUserId: ownerUserId || undefined,
              name: lang === "ta" ? "உங்கள் குடும்பம்" : "Your family",
              defaultLanguage: "ta-en",
            }),
          },
        );
        targetVaultId = vaultResponse.data.familyVaultId;
        setOwnerUserId(vaultResponse.data.ownerUserId);
        family.setSelectedVaultId(targetVaultId);
        await family.loadVaults(vaultResponse.data.ownerUserId);
      }
      const response = await apiFetchJson<ApiEnvelope<{ familyMemberId: string; displayName: string }>>(
        `/api/v1/family-vaults/${targetVaultId}/members`,
        {
          method: "POST",
          body: JSON.stringify({
            ownerUserId, familyVaultId: targetVaultId,
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
      showToast(`${response.data.displayName} added to your family.`);
      setStatus(`${response.data.displayName} added to your family.`);
      setMemberForm(defaultMemberForm);
      await family.loadVaults(ownerUserId);
      await family.refreshFamilyBundle(targetVaultId, selectedDate);
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
      // Birth fields: `|| undefined` omits an empty one, which the API reads as
      // "leave alone" — right, because none of them is nullable on a saved
      // profile.
      //
      // Current location is the opposite case and must NOT use `|| undefined`:
      // "" is the sentinel that clears it back to the birth place, and omitting
      // it made the field a one-way door. The four move together — a place
      // without coordinates is not a location.
      const clearingCurrent = !editMember.currentPlace;
      const body = {
        displayName: editMember.displayName,
        birthDateLocal: editMember.birthDateLocal || undefined,
        birthTimeLocal: editMember.birthTimeLocal || undefined,
        birthPlace: editMember.birthPlace || undefined,
        birthLatitude: editMember.birthLatitude ? parseNumber(editMember.birthLatitude) : undefined,
        birthLongitude: editMember.birthLongitude ? parseNumber(editMember.birthLongitude) : undefined,
        birthTimezone: editMember.birthTimezone || undefined,
        currentPlace: editMember.currentPlace,
        currentLatitude: clearingCurrent || !editMember.currentLatitude ? undefined : parseNumber(editMember.currentLatitude),
        currentLongitude: clearingCurrent || !editMember.currentLongitude ? undefined : parseNumber(editMember.currentLongitude),
        currentTimezone: clearingCurrent ? undefined : (editMember.currentTimezone || undefined),
        recalculate: true,
      };
      const url = editMember.scope === "member"
        ? `/api/v1/family-vaults/${editMember.familyVaultId}/members/${editMember.memberId}`
        : `/api/v1/birth-profiles/${editMember.birthProfileId}`;
      await apiFetchJson<unknown>(url, {
        method: "PATCH",
        body: JSON.stringify(
          editMember.scope === "member"
            ? { ...body, relationshipToOwner: editMember.relationshipToOwner, memberWeight: parseNumber(editMember.memberWeight, 1) }
            : body,
        ),
      });
      showToast(`${editMember.displayName} updated.`);
      setStatus(`${editMember.displayName} updated.`);
      setEditMember(null);
      // Both scopes can touch a family-linked profile, and a profile edit can
      // change the name and DOB the family views read, so refresh either way.
      setBirthProfilesReloadToken((n) => n + 1);
      if (family.selectedVaultId) {
        await family.refreshFamilyBundle(family.selectedVaultId, selectedDate);
      }
      // A profile edit can be the owner's own, and it may have recalculated the
      // chart, so the personal bundle has to be refetched rather than reused.
      if (editMember.scope === "profile" && editMember.birthProfileId === personal.birthProfileId) {
        await personal.refreshPersonalBundle(personal.birthProfileId, selectedDate, true, { forceChart: true, forceDay: true });
      }
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
            // "" is the clear sentinel, so this one is sent as-is rather than
            // `|| undefined` — omitting it means "leave alone", which made the
            // owner's own current location unremovable once set.
            currentPlace: birthForm.currentPlace,
            currentLatitude: birthForm.currentPlace && birthForm.currentLatitude ? parseNumber(birthForm.currentLatitude) : undefined,
            currentLongitude: birthForm.currentPlace && birthForm.currentLongitude ? parseNumber(birthForm.currentLongitude) : undefined,
            currentTimezone: birthForm.currentPlace ? (birthForm.currentTimezone || undefined) : undefined,
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
    setBirthForm((c) => ({ ...c, ownerUserId: item.ownerUserId }));
  }

  function handleEditFamilyMember(member: FamilyAggregateMember) {
    const mc = family.memberCharts.find((x) => x.memberId === member.familyMemberId);
    const bp = mc?.chart.birthProfile;
    // Guard: member charts may still be loading — don't open with empty fields
    if (!bp) return;
    // Relationship and weight are columns on the FamilyMember row, so they are
    // read from the vault's own member list — NOT from `bp`. `chart.birthProfile`
    // carries a `relationshipToOwner` that the backend cannot populate for a
    // persisted profile (the column is not on that table); it reported "self"
    // for everyone, this modal PATCHed that back over the real relationship,
    // and a member tagged "self" is then excluded from `memberCharts`, which
    // empties the member picker on every tab. Seeded from the truth here so the
    // save is a no-op when the reader does not touch the dropdown.
    const row = family.familyMembers.find((fm) => fm.familyMemberId === member.familyMemberId);
    setEditMember({
      scope: "member",
      birthProfileId: bp.birthProfileId,
      familyVaultId: family.selectedVaultId,
      memberId: member.familyMemberId,
      displayName: member.displayName,
      relationshipToOwner: (row?.relationshipToOwner as Relationship) ?? "other",
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

  /** Open the editor on a bare birth profile, from Setup -> all birth profiles.
   *
   *  Deliberately routed to /birth-profiles even for a family-linked profile,
   *  rather than to the member endpoint: this list edits birth DATA, and
   *  relationship/weight are membership facts that belong to the Family surface
   *  where the rest of the vault is visible. The backend mirrors display name
   *  and date of birth back onto the FamilyMember row, so the family views stay
   *  correct either way. */
  function handleEditBirthProfile(profile: BirthProfileResponse) {
    setEditMember({
      scope: "profile",
      birthProfileId: profile.birthProfileId,
      familyVaultId: "",
      memberId: "",
      displayName: profile.displayName,
      relationshipToOwner: (profile.relationshipToOwner as Relationship) ?? "other",
      memberWeight: "1.00",
      birthDateLocal: profile.birthDateLocal ?? "",
      birthTimeLocal: profile.birthTimeLocal ?? "",
      birthPlace: profile.birthPlace ?? "",
      birthLatitude: profile.birthLatitude?.toString() ?? "",
      birthLongitude: profile.birthLongitude?.toString() ?? "",
      birthTimezone: profile.birthTimezone ?? "",
      currentPlace: profile.currentPlace ?? "",
      currentLatitude: profile.currentLatitude?.toString() ?? "",
      currentLongitude: profile.currentLongitude?.toString() ?? "",
      currentTimezone: profile.currentTimezone ?? "",
    });
  }

  // Destructured rather than read off `session` inside the callback: the whole
  // session object is a new identity every render, so depending on it rebuilt
  // this callback constantly — and listing `session.x` members instead trips
  // exhaustive-deps, which cannot see through the member expressions. The two
  // setters are raw `useState` setters (useSession.ts:29-30) and so are stable;
  // the two values are genuine dependencies, since the rollback path needs
  // whatever was current when the save started.
  const { userMode: currentUserMode, setUserMode } = session;
  // goalTrack is no longer sent: the Goal track card is retired (life-focus
  // plan Q6) and the server derives goal_track from the focus. PATCH /auth/me
  // still accepts goalTrack for old clients.
  const saveUserSettings = useCallback(async (mode: UserMode, options?: { toast?: boolean }) => {
    const previousMode = currentUserMode;
    setUserMode(mode);
    try {
      await apiFetchJson("/api/v1/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMode: mode }),
      });
      if (options?.toast) toast.success(dt(ONBOARDING_DETAIL_LEVEL.saved, lang));
    } catch {
      setUserMode(previousMode);
      if (options?.toast) toast.error(dt(ONBOARDING_DETAIL_LEVEL.saveFailed, lang));
    }
  }, [lang, currentUserMode, setUserMode]);

  // ── Render ────────────────────────────────────────────────

  return (
    <MotionConfig reducedMotion="user" transition={{ duration: DUR.base, ease: EASE_NOVA }}>
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
          // Server-resolved, not re-picked from the profile (§2.4). The
          // resolver falls back to the birth place when the current location is
          // missing *any* of place/lat/lng/timezone, so a profile with a typed
          // city but no coordinates is computed at its birth place while this
          // line used to label it with the city — the one case the label
          // exists to catch.
          panchangamPlace={personal.panchangamPlace}
          userEmail={session.userEmail}
          showUserMenu={session.showUserMenu}
          alertCount={personal.ambientAlerts.length}
          alertItems={personal.ambientAlerts.map((a) => ({
            type: a.source,
            title: lang === "ta" ? a.title.ta : a.title.en,
            body: lang === "ta" ? a.message.ta : a.message.en,
          }))}
          inboxItems={inbox.items}
          inboxUnreadCount={inbox.unreadCount}
          onMarkAllRead={inbox.markAllRead}
          onMarkOneRead={inbox.markOneRead}
          onOpenNotificationSettings={() => navigateSettings("notifications")}
          onInboxOpen={inbox.onOpen}
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
          onAskVinaadi={() => setAskVinaadiOpen(true)}
          askReady={Boolean(personal.chartId)}
          dayLoading={personal.isShowingPreviousDay}
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
              aria-label={t("tab_explore_back", lang)}
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
              {t("tab_explore_back", lang)}
            </button>
          </div>
        )}

        {/* Onboarding banner: shown until profile + one family member added */}
        {onboardingDone === false && session.hydrated && (
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
                  <div className="cd-onboarding__step">
                    <span className={`cd-onboarding__step-badge ${hasVisitedReading ? "is-done" : "is-pending"}`}>
                      {hasVisitedReading ? "✓" : "3"}
                    </span>
                    <span className={`cd-onboarding__step-text ${hasVisitedReading ? "is-done" : ""}`}>
                      {t("onboarding_step3", lang)}
                    </span>
                  </div>
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
              birthForm={birthForm}
              memberForm={memberForm}
              formErrors={formErrors}
              busy={{ createProfile: busyCreateProfile, addMember: busyAddMember }}
              onNavigate={navigateSettings}
              onBirthFormChange={setBirthForm}
              onMemberFormChange={setMemberForm}
              onFormErrorChange={(patch) => setFormErrors((c) => ({ ...c, ...patch }))}
              onCreateProfile={handleCreateProfile}
              onAddMember={handleAddMember}
              onShowEditProfile={() => setShowEditProfile(true)}
              onEditBirthProfile={handleEditBirthProfile}
              birthProfilesReloadToken={birthProfilesReloadToken}
              onGoToPersonal={() => setActiveTab("personal")}
              userMode={session.userMode}
              onModeChange={(mode) => void saveUserSettings(mode, { toast: true })}
            />
          </TabPane>

          <TabPane visible={isPaneRendered("personal")} active={activeTab === "personal"}>
            <DashboardTodayTabNova
              lang={lang}
              userMode={session.userMode}
              activeLifeMode={activeLifeMode}
              onOpenFocusPicker={() => setLifeModePicker("change")}
              showFocusNudge={showFocusNudge}
              onKeepFocus={keepLifeMode}
              onDismissFocusNudge={dismissFocusNudge}
              locationCheck={locationCheck}
              locationCheckProfileId={personal.birthProfileId}
              panchangamPlace={personal.panchangamPlace}
              deviceTimeZone={deviceTimeZone}
              onLocationResolved={onLocationResolved}
              onDismissLocationCheck={dismissLocationCheck}
              lifeFocus={ownFocus}
              birthDisplayName={birthForm.displayName}
              selectedDate={selectedDate}
              todayDate={personal.todayDate}
              personalChartSummary={personal.chartSummary}
              personalDailyGuidance={personal.dailyGuidance}
              personalSani={personal.sani}
              peyarchiUpcoming={personal.peyarchiUpcoming}
              panchangam={personal.panchangam}
              panchangamTimings={personal.panchangamTimings}
              weekAhead={personal.weekAhead}
              familyAggregate={familyAggregateForToday}
              personalPending={personal.personalPending}
              showingPreviousDay={personal.isShowingPreviousDay}
              familyPending={family.familyPending}
              remedyMemberCharts={family.memberCharts}
              lifeAreas={personal.lifeAreas}
              dasha={personal.dasha}
              dashaAntar={personal.dashaAntar}
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
              <ViewSwap viewKey={activeTool ?? "tools-hub"}>
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
                numerologyMembers={numerologyMembers(family.memberCharts)}
                ownerChart={personal.chart}
                synastryMemberCharts={family.memberCharts}
                synastryMemberOptions={synastryMemberOptions(family.memberCharts, family.familyMembers)}
                relationshipAlerts={family.relationshipAlerts}
                relationshipAlertsLoading={family.relationshipAlertsLoading}
                familyMembersForPorutham={poruthamCandidates(personal.chart, family.memberCharts)}
                onGoToPlan={() => goToTab("plan")}
                onGoToCalendar={() => goToTab("calendar")}
                onOpenAskVinaadi={() => setAskVinaadiOpen(true)}
                />
              </ViewSwap>
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
              onEditSelf: () => setShowEditProfile(true),
              onGoToLifeAreas: () => goToTab("life-areas"),
              onGoToRemedies: () => focusLifeAreas("remedies"),
              onGoToForecast: () => focusLifeAreas("predictions"),
              onGoToTools: () => goToTab("tools"),
              focusSection: familyFocusSection,
              onFocusConsumed: consumeFamilyFocus,
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
              chartId={muhurtaChartId}
              memberCharts={memberPickerOptions(family.memberCharts)}
              selectedMemberId={muhurtaMemberId}
              onSelectMember={setMuhurtaMemberId}
              focusView={calendarFocusView}
              onFocusConsumed={consumeCalendarFocus}
              pending={personal.personalPending}
              muhurtaFocusActivities={muhurtaFocus.activities}
              monthFocus={monthFocus}
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
              onLoadJadhagamReport={() => void personal.loadJadhagamReport(lifeAreasChartId)}
              chartSummary={lifeAreasMemberChart?.summary ?? personal.chartSummary}
              birthDisplayName={birthForm.displayName}
              maritalStatus={maritalStatusFor(family.memberCharts, lifeAreasViewId, birthForm.maritalStatus)}
              memberCharts={memberPickerOptions(family.memberCharts)}
              selectedMemberId={lifeAreasViewId}
              onSelectMember={setLifeAreasViewId}
              focusArea={lifeAreasFocus.area}
              active={activeTab === "life-areas"}
              chartId={lifeAreasChartId}
              remedyPlan={remedyPlan}
              gemstoneAdvice={gemstoneAdvice}
              remediesLoading={remediesLoading}
              onLoadRemedies={() => void loadRemedies(lifeAreasChartId)}
              goals={plan.goals}
              onGoToPlan={() => goToTab("plan")}
              onGoToChart={() => goToTab("family")}
              focusSubTab={lifeAreasFocusSubTab}
              onFocusConsumed={consumeLifeAreasFocus}
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
              focusActivities={ownFocus.activities}
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
              personalChartSummary={personal.chartSummary}
              personalChart={personal.chart}
              personalDailyGuidance={personal.dailyGuidance}
              nakshatraCard={personal.nakshatraCard}
              pending={personal.personalPending}
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
              moonRasi={personal.chartSummary?.moonRasi ?? ""}
              janmaNakshatra={personal.chartSummary?.janmaNakshatra ?? ""}
              lagnaRasi={personal.chartSummary?.lagnaRasi ?? ""}
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
              onSaveUserSettings={(mode) => saveUserSettings(mode)}
              lifeMode={activeLifeMode}
              blockedLifeModes={lifeModeStatus?.blockedModes ?? []}
              onSaveLifeMode={async (mode) => setLifeModeStatus(await updateLifeMode(mode, "SELECT", "WEB"))}
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
                {(([
                  {
                    head: { en: "Understand", ta: "ஆராயுங்கள்" },
                    links: [
                      { tab: "personal" as Tab, ta: "இன்று", en: "Today" },
                      { tab: "calendar" as Tab, ta: "நாட்காட்டி", en: "Calendar" },
                      { tab: "life-areas" as Tab, ta: "வாழ்க்கைத் துறைகள்", en: "Life Areas" },
                      // The glossary's ONLY other way in is tapping a glossed
                      // term, which a reader who does not already suspect the
                      // words are tappable will never do — so the page that
                      // explains the vocabulary was reachable only by readers who
                      // did not need it. This is the one entry point.
                      //
                      // In the footer rather than the hero nav on purpose: it is
                      // a route outside `(workspace)`, so it unmounts the
                      // workspace, and a tab strip must never do that. Reaching
                      // the bottom of the page is already a "leaving" gesture,
                      // and the cost is small — /dashboard/layout.tsx (and its
                      // QueryProvider cache) is shared with this route and so
                      // survives, and "Back to dashboard" lands on /dashboard,
                      // which is always Today (DXA-02, D1). A plain link, not
                      // router.back(): the glossary is also opened directly.
                      { href: "/dashboard/glossary", ta: "சொற்களஞ்சியம்", en: "Glossary" },
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
                ]) as FooterNavColumn[]).map((col) => (
                  <div key={col.head.en} className="nova-footer__nav-col">
                    <h2 className="nova-footer__nav-head">
                      {lang === "ta" ? col.head.ta : col.head.en}
                    </h2>
                    <div className="nova-footer__nav-links">
                      {col.links.map((link) => {
                        // `!== undefined`, not truthiness: `href: string` includes
                        // "", so a falsy test cannot rule that arm out and the
                        // other branch keeps `tab` as `Tab | undefined`.
                        if (link.href !== undefined) {
                          return (
                            <Link key={link.href} href={link.href} className="nova-footer__nav-link">
                              {lang === "ta" ? link.ta : link.en}
                            </Link>
                          );
                        }
                        // Read out here, not inside the handler: narrowing on a
                        // parameter does not survive into a nested closure, so
                        // `link.tab` reads as `Tab | undefined` in there.
                        const tab = link.tab;
                        return (
                          <button
                            key={tab}
                            type="button"
                            className="nova-footer__nav-link"
                            onClick={() => goToTab(tab)}
                          >
                            {lang === "ta" ? link.ta : link.en}
                          </button>
                        );
                      })}
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

        {lifeModePicker && (
          <LifeModePicker
            lang={lang}
            currentMode={activeLifeMode}
            blockedModes={lifeModeStatus?.blockedModes ?? []}
            firstRun={lifeModePicker === "first-run"}
            onClose={() => setLifeModePicker(null)}
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
    </MotionConfig>
  );
}


