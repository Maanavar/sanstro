"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

import { apiFetchJson, readErrorMessage, toQuery } from "@/lib/api";
import { isBirthDateWithinBounds } from "@/lib/birth-date";
import { getScoreBand, todayIso } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  ApiEnvelope,
  BirthProfileCreateResponseData,
  FamilyAggregateMember,
  FamilyVaultListItem,
  NotificationInboxItem,
  NotificationInboxResponse,
} from "@/lib/types";

import { useSession } from "@/hooks/useSession";
import { usePersonalData } from "@/hooks/usePersonalData";
import { useFamilyData, type MemberChart } from "@/hooks/useFamilyData";
import { usePlanData } from "@/hooks/usePlanData";
import { useJournalData } from "@/hooks/useJournalData";

import { CalendarTab } from "./dashboard-calendar-tab";
import { EditMemberModal } from "./dashboard-edit-member-modal";
import type { EditMemberState } from "./dashboard-edit-member-modal";
import { EditProfileModal } from "./dashboard-edit-profile-modal";
import { DashboardFamilyTab } from "./dashboard-family-tab";
import { FeedbackModal } from "./dashboard-feedback-modal";
import { DashboardHero } from "./dashboard-hero";
import { DashboardLifeAreasTab } from "./dashboard-life-areas-tab";
import { DashboardPersonalTab } from "./dashboard-personal-tab";
import { QATab } from "./dashboard-qa-tab";
import { DashboardSetupTab } from "./dashboard-setup-tab";
import { DashboardSettingsSessionTab } from "./dashboard-settings-session-tab";
import { DashboardTransitsTab } from "./dashboard-transits-tab";
import { DashboardPlanTab } from "./dashboard-plan-tab";
import { DashboardJournalTab } from "./dashboard-journal-tab";
import { ToolsGrid } from "./tools-grid";
import { PoruthamPanel } from "./porutham-panel";
import { ChartGenerateInlinePanel } from "./chart-generate-inline-panel";
import { DashboardAnnualWrapped } from "./dashboard-annual-wrapped";
import { RetrospectivePanel } from "./dashboard-retrospective-panel";
import { RectificationWizard } from "./dashboard-rectification-wizard";

const STORAGE_KEY = "jothidam-ai-dashboard-state";
const ENABLE_QA_TAB = process.env.NODE_ENV !== "production";

type Tab = "onboarding" | "personal" | "tools" | "transits" | "plan" | "life-areas" | "family" | "calendar" | "journal" | "settings" | "qa";
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
  maritalStatus: "", employmentType: "",
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
};

function parseNumber(value: string, fallback = 0): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatScoreLabel(score: number) {
  const band = getScoreBand(score);
  return `${score}/100 – ${band.label}`;
}

// ── Main component ────────────────────────────────────────

export function DashboardWorkspace() {
  const [status, setStatus] = useState("Ready. Create a profile or family vault to begin.");
  const [activeTab, setActiveTab] = useState<Tab>("personal");
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>("setup");
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [lang, setLang] = useState<Lang>("ta");

  // UI-only state: forms, modals, toast
  const [ownerUserId, setOwnerUserId] = useState("");
  const [birthForm, setBirthForm] = useState<BirthFormState>(defaultBirthForm);
  const [vaultForm, setVaultForm] = useState<VaultFormState>(defaultVaultForm);
  const [memberForm, setMemberForm] = useState<MemberFormState>(defaultMemberForm);
  const [editMember, setEditMember] = useState<EditMemberState | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showRectification, setShowRectification] = useState(false);
  const [showWrapped, setShowWrapped] = useState(false);
  const [showRetrospective, setShowRetrospective] = useState(false);
  const [showPorutham, setShowPorutham] = useState(false);
  const [showChartGenerate, setShowChartGenerate] = useState(false);
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
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

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
  const [transitViewId, setTransitViewId] = useState<string | null>(null);

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

  // ── Domain hooks ─────────────────────────────────────────

  const session = useSession({
    onSetupRedirect: useCallback(() => {
      setActiveTab("settings");
      setSettingsSubTab("setup");
    }, []),
  });

  const personal = usePersonalData({
    selectedDate,
    onStatus: setStatus,
  });

  const family = useFamilyData({
    ownerUserId,
    selectedDate,
    onStatus: setStatus,
  });

  const plan = usePlanData({
    chartId: personal.chartId,
    onError: (msg) => showToast(msg, "error"),
    onGoalAdded: (goalType) => {
      showToast(lang === "ta" ? `இலக்கு சேர்க்கப்பட்டது: ${goalType}` : `Goal saved: ${goalType}`);
      if (personal.birthProfileId) {
        void personal.refreshPersonalBundle(personal.birthProfileId, selectedDate);
      }
      const targetChartId = (() => {
        if (!lifeAreasViewId) return personal.chartId;
        const member = family.memberCharts.find((mc) => mc.memberId === lifeAreasViewId);
        return member?.chart.chartId ?? personal.chartId;
      })();
      if (!targetChartId) return;
      personal.setPredictionsLoading(true);
      personal.setJadhagamReport(null);
      void personal
        .refreshLifeAreasInsights(targetChartId, selectedDate)
        .finally(() => personal.setPredictionsLoading(false));
    },
    onGoalRemoved: () => {
      showToast(lang === "ta" ? "இலக்கு நீக்கப்பட்டது" : "Goal removed");
      if (personal.birthProfileId) {
        void personal.refreshPersonalBundle(personal.birthProfileId, selectedDate);
      }
      const targetChartId = (() => {
        if (!lifeAreasViewId) return personal.chartId;
        const member = family.memberCharts.find((mc) => mc.memberId === lifeAreasViewId);
        return member?.chart.chartId ?? personal.chartId;
      })();
      if (!targetChartId) return;
      personal.setPredictionsLoading(true);
      personal.setJadhagamReport(null);
      void personal
        .refreshLifeAreasInsights(targetChartId, selectedDate)
        .finally(() => personal.setPredictionsLoading(false));
    },
  });

  const journal = useJournalData({
    lang,
    onStatus: setStatus,
    onError: (msg) => showToast(msg, "error"),
  });

  // ── Hydration + localStorage restore ─────────────────────

  useEffect(() => {
    if (!session.hydrated) return;
    const authedUserId = session.sessionUserId;
    setOwnerUserId(authedUserId);
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<PersistedState>;
        const isSameUser = parsed.ownerUserId === authedUserId;
        if (isSameUser) {
          if (typeof parsed.selectedDate === "string") setSelectedDate(parsed.selectedDate);
          if (typeof parsed.selectedVaultId === "string") family.setSelectedVaultId(parsed.selectedVaultId);
          if (typeof parsed.birthProfileId === "string") personal.setBirthProfileId(parsed.birthProfileId);
          if (typeof parsed.chartId === "string") personal.setChartId(parsed.chartId);
          if (parsed.birthForm) setBirthForm((c) => ({ ...c, ...parsed.birthForm }));
          if (parsed.vaultForm) setVaultForm((c) => ({ ...c, ...parsed.vaultForm }));
          if (parsed.memberForm) setMemberForm((c) => ({ ...c, ...parsed.memberForm }));
          if (parsed.activeTab === "onboarding" || parsed.activeTab === "settings") {
            // Don't restore settings from localStorage — the onboarding gate
            // decides whether to show settings based on profile existence.
            // Restoring "settings" here causes newly-onboarded users to land
            // back on the setup tab even after they have a birth profile.
          } else if (parsed.activeTab === "qa" && !ENABLE_QA_TAB) {
            setActiveTab("personal");
          } else if (parsed.activeTab) {
            setActiveTab(parsed.activeTab);
          }
          if (parsed.lang === "ta" || parsed.lang === "en") setLang(parsed.lang);
          setStatus("Session restored.");
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // ignore parse errors
    }
    // Load DB lang preference — overrides localStorage (works across devices)
    void apiFetchJson<{ data: { lang: string } }>("/api/v1/settings/ui").then((r) => {
      const dbLang = r.data?.lang;
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

  useEffect(() => {
    if (!session.hydrated) return;
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

  // Sync birthForm from the loaded chart so name/details survive new builds
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
    personal.setPredictionsLoading(true);
    personal.setJadhagamReport(null);
    // Remedies & gemstone advice are per-chart — clear the previous member's
    // data so a switched member never shows another person's remedies/stones.
    setRemedyPlan(null);
    setGemstoneAdvice(null);
    void personal.refreshLifeAreasInsights(targetChartId, selectedDate)
      .finally(() => personal.setPredictionsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.hydrated, lifeAreasViewId, selectedDate, lifeAreasResolvedChartId]);

  // ── Toast ────────────────────────────────────────────────

  function showToast(message: string, tone: "success" | "error" = "success") {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 4000);
  }

  function openSetupInSettings() {
    setActiveTab("settings");
    setSettingsSubTab("setup");
  }

  // ── Derived / resolved state ──────────────────────────────

  function resolveLifeAreasChartId(): string {
    if (!lifeAreasViewId) return personal.chartId;
    const member = family.memberCharts.find((mc) => mc.memberId === lifeAreasViewId);
    return member?.chart.chartId ?? personal.chartId;
  }

  const selectedVault = family.vaults.find((v) => v.familyVaultId === family.selectedVaultId) ?? null;

  function resolveMemberChart(viewId: string | null): MemberChart | null {
    if (!viewId) return null;
    return family.memberCharts.find((mc) => mc.memberId === viewId) ?? null;
  }

  const personalMemberChart = resolveMemberChart(personalViewId);
  const lifeAreasMemberChart = resolveMemberChart(lifeAreasViewId);
  const transitMemberChart = resolveMemberChart(transitViewId);

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

  // Transit-tab specific resolved data (follows transitViewId selector)
  const transitChart = transitMemberChart?.chart ?? personal.chart;
  const transitDailyGuidance = transitMemberChart?.dailyGuidance ?? personal.dailyGuidance;
  const transitTransit = transitMemberChart?.transit ?? personal.transit;
  const transitSani = transitMemberChart?.sani ?? personal.sani;
  const transitDasha = transitMemberChart?.dasha ?? personal.dasha;
  const transitDashaMaha = transitMemberChart?.dashaMaha ?? personal.dashaMaha;
  const transitDashaAntar = transitMemberChart?.dashaAntar ?? personal.dashaAntar;
  const journalRetentionDays = journal.journalSettings?.journalRetentionDays ?? 365;

  // ── Form validation ───────────────────────────────────────

  function validateBirthForm(form: BirthFormState): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!form.displayName.trim()) errors.displayName = t("err_name_required", lang);
    if (!form.birthDateLocal) errors.birthDateLocal = t("err_date_required", lang);
    else if (!isBirthDateWithinBounds(form.birthDateLocal)) {
      errors.birthDateLocal = lang === "ta"
        ? "பிறந்த தேதி 1900 முதல் இன்றைய தேதிக்குள் இருக்க வேண்டும்."
        : "Birth date must be between 1900 and today.";
    }
    if (!form.birthPlace.trim()) errors.birthPlace = t("err_place_required", lang);
    if (!form.birthTimezone.trim()) errors.birthTimezone = t("err_tz_required", lang);
    if (!form.birthLatitude || !parseNumber(form.birthLatitude)) errors.birthLatitude = t("err_lat_required", lang);
    if (!form.birthLongitude || !parseNumber(form.birthLongitude)) errors.birthLongitude = t("err_lng_required", lang);
    return errors;
  }

  function validateMemberForm(form: MemberFormState): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!form.displayName.trim()) errors.memberDisplayName = t("err_name_required", lang);
    if (!form.birthDateLocal) errors.memberBirthDate = t("err_date_required", lang);
    else if (!isBirthDateWithinBounds(form.birthDateLocal)) {
      errors.memberBirthDate = lang === "ta"
        ? "பிறந்த தேதி 1900 முதல் இன்றைய தேதிக்குள் இருக்க வேண்டும்."
        : "Birth date must be between 1900 and today.";
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
      const msg = readErrorMessage(error);
      showToast(msg, "error"); setStatus(msg);
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
      const msg = readErrorMessage(error);
      showToast(msg, "error"); setStatus(msg);
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
      const msg = readErrorMessage(error);
      showToast(msg, "error"); setStatus(msg);
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
      const msg = readErrorMessage(error);
      showToast(msg, "error"); setStatus(msg);
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
            recalculate: true,
          }),
        });
        const profileId = (updated as any).data?.birthProfileId ?? existingId;
        const chartId = (updated as any).data?.chartId;
        if (chartId) personal.setChartId(chartId);
        setShowEditProfile(false);
        showToast(`${birthForm.displayName} profile updated.`);
        await personal.refreshPersonalBundle(profileId, selectedDate);
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
          }),
        });
        personal.setBirthProfileId(response.data.birthProfileId);
        if (response.data.chartId) personal.setChartId(response.data.chartId);
        setShowEditProfile(false);
        showToast(`${birthForm.displayName} profile created.`);
        await personal.refreshPersonalBundle(response.data.birthProfileId, selectedDate);
      }
    } catch (error) {
      const msg = readErrorMessage(error);
      showToast(msg, "error");
    } finally { setBusyEditingProfile(false); }
  }

  async function handleDeleteProfile() {
    const existingId = personal.birthProfileId;
    if (!existingId) return;
    const name = birthForm.displayName || "this profile";
    if (!confirm(
      lang === "ta"
        ? `"${name}" ஜாதகம் மற்றும் அனைத்து கணக்கீட்டு தரவையும் நிரந்தரமாக நீக்கவா? இதை மீட்டெடுக்க முடியாது.`
        : `Permanently delete "${name}" and all its chart data? This cannot be undone.`
    )) return;
    setBusyEditingProfile(true);
    try {
      await apiFetchJson<unknown>(`/api/v1/birth-profiles/${existingId}`, { method: "DELETE" });
      // Sign out and redirect — user must not stay on the dashboard after deleting their profile
      session.signOut();
    } catch (error) {
      showToast(readErrorMessage(error), "error");
      setBusyEditingProfile(false);
    }
  }

  async function handleDeleteMember(memberId: string, displayName: string) {
    if (!confirm(`Remove "${displayName}" from the vault?`)) return;
    setDeletingMemberId(memberId);
    try {
      await apiFetchJson<unknown>(`/api/v1/family-vaults/${family.selectedVaultId}/members/${memberId}`, { method: "DELETE" });
      showToast(`${displayName} removed.`);
      setStatus(`${displayName} removed.`);
      await family.loadVaults(ownerUserId);
      await family.refreshFamilyBundle(family.selectedVaultId, selectedDate);
    } catch (error) {
      const msg = readErrorMessage(error);
      showToast(msg, "error"); setStatus(msg);
    } finally {
      setDeletingMemberId("");
    }
  }

  async function handleDeleteVault(vaultId: string, vaultName: string) {
    if (!confirm(`Delete vault "${vaultName}" and all its members? This cannot be undone.`)) return;
    setDeletingVaultId(vaultId);
    try {
      await apiFetchJson<unknown>(`/api/v1/family-vaults/${vaultId}`, { method: "DELETE" });
      showToast(`Vault "${vaultName}" deleted.`);
      setStatus(`Vault "${vaultName}" deleted.`);
      if (family.selectedVaultId === vaultId) {
        family.setSelectedVaultId("");
        family.setFamilyDetail(null);
        family.setFamilyAggregate(null);
        family.setFamilyCalendar(null);
      }
      await family.loadVaults(ownerUserId);
    } catch (error) {
      const msg = readErrorMessage(error);
      showToast(msg, "error"); setStatus(msg);
    } finally {
      setDeletingVaultId("");
    }
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
    setEditMember({
      memberId: member.familyMemberId,
      displayName: member.displayName,
      relationshipToOwner: (bp?.relationshipToOwner as Relationship) ?? "other",
      memberWeight: member.memberWeight.toFixed(2),
      birthDateLocal: bp?.birthDateLocal ?? "",
      birthTimeLocal: bp?.birthTimeLocal ?? "",
      birthPlace: bp?.birthPlace ?? "",
      birthLatitude: bp?.birthLatitude?.toString() ?? "",
      birthLongitude: bp?.birthLongitude?.toString() ?? "",
      birthTimezone: bp?.birthTimezone ?? "",
      currentPlace: bp?.currentPlace ?? "",
      currentLatitude: bp?.currentLatitude?.toString() ?? "",
      currentLongitude: bp?.currentLongitude?.toString() ?? "",
      currentTimezone: bp?.currentTimezone ?? "",
    });
  }

  function handleOwnerUserIdChange(value: string) {
    setOwnerUserId(value);
    setBirthForm((c) => ({ ...c, ownerUserId: value }));
    setVaultForm((c) => ({ ...c, ownerUserId: value }));
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="site cd-shell">

      <DashboardHero
        lang={lang}
        activeTab={activeTab}
        birthDisplayName={birthForm.displayName}
        status={status}
        chartSummary={personal.chartSummary}
        todayGuidance={personal.todayGuidance}
        todayTransit={personal.todayTransit}
        familyAggregate={family.familyAggregate}
        selectedVault={selectedVault}
        selectedVaultId={family.selectedVaultId}
        selectedDate={selectedDate}
        userEmail={session.userEmail}
        showUserMenu={session.showUserMenu}
        toast={toast}
        alertCount={personal.ambientAlerts.length}
        alertItems={personal.ambientAlerts.map((a) => ({
          type: a.source,
          title: lang === "ta" ? a.title.ta : a.title.en,
          body: lang === "ta" ? a.message.ta : a.message.en,
        }))}
        inboxItems={inboxItems}
        inboxUnreadCount={inboxUnreadCount}
        onMarkAllRead={handleMarkAllRead}
        onTabChange={(tab) => setActiveTab(tab)}
        onDateChange={setSelectedDate}
        onLangToggle={() => setLang((l) => l === "ta" ? "en" : "ta")}
        onUserMenuToggle={() => session.setShowUserMenu((v) => !v)}
        onUserMenuClose={() => session.setShowUserMenu(false)}
        onGoToSettings={() => {
          setActiveTab("settings");
          setSettingsSubTab("session");
          session.setShowUserMenu(false);
        }}
        onSignOut={() => {
          session.setShowUserMenu(false);
          session.signOut();
        }}
        onToastDismiss={() => setToast(null)}
      />

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

      {/* Onboarding banner: shown until profile + one family member added */}
      {!onboardingDone && session.hydrated && (
        <div className="cd-onboarding">
          <div className="cd-onboarding__card">
            <div className="cd-onboarding__content">
              <p className="cd-onboarding__title">
                {lang === "ta" ? "தொடங்க சில படிகள் மீதம்" : "A few steps to get started"}
              </p>
              <div className="cd-onboarding__steps">
                <div className="cd-onboarding__step">
                  <span className={`cd-onboarding__step-badge ${personal.birthProfileId ? "is-done" : "is-pending"}`}>
                    {personal.birthProfileId ? "✓" : "1"}
                  </span>
                  <span className={`cd-onboarding__step-text ${personal.birthProfileId ? "is-done" : ""}`}>
                    {lang === "ta" ? "உங்கள் ஜாதக விவரங்களை சேர்க்கவும்" : "Add your birth profile"}
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
                        {lang === "ta" ? "குடும்ப வாஷி திறந்து ஒரு உறுப்பினரை சேர்க்கவும்" : "Open Family Vault and add one family member"}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setActiveTab("settings"); setSettingsSubTab("setup"); }}
              className="cd-onboarding__cta"
            >
              {lang === "ta" ? "அமைவுக்கு செல்" : "Go to Setup"}
            </button>
          </div>
        </div>
      )}

      {/* Tab content */}
      <div className="cd-page site__body">

        {activeTab === "settings" && settingsSubTab === "setup" && (
          <DashboardSetupTab
            lang={lang}
            settingsSubTab={settingsSubTab}
            birthProfileId={personal.birthProfileId}
            selectedVaultId={family.selectedVaultId}
            selectedVault={selectedVault}
            vaults={family.vaults}
            birthForm={birthForm}
            vaultForm={vaultForm}
            memberForm={memberForm}
            formErrors={formErrors}
            busy={{ createProfile: busyCreateProfile, createVault: busyCreateVault, addMember: busyAddMember }}
            onSettingsSubTabChange={setSettingsSubTab}
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
        )}

        {activeTab === "personal" && (
          <DashboardPersonalTab
            lang={lang}
            birthDisplayName={birthForm.displayName}
            selectedDate={selectedDate}
            todayDate={personal.todayDate}
            personalViewId={personalViewId}
            birthProfileId={personal.birthProfileId}
            busyPersonal={personal.busyPersonal}
            memberCharts={family.memberCharts.map((mc) => ({ memberId: mc.memberId, displayName: mc.displayName }))}
            onSelectPersonalView={setPersonalViewId}
            onOpenEditProfile={() => setShowEditProfile(true)}
            onRefreshPersonal={() => void personal.refreshPersonalBundle()}
            personalMemberChart={personalMemberChart}
            personalChart={personalChart}
            personalChartExplanation={personalChartExplanation}
            personalChartSummary={personalChartSummary}
            personalDailyGuidance={personalDailyGuidance}
            dailyGuidanceRange={personal.dailyGuidanceRange}
            personalTransit={personalTransit}
            personalSani={personalSani}
            peyarchiUpcoming={personalPeyarchiUpcoming}
            panchangam={personal.panchangam}
            panchangamTimings={personal.panchangamTimings}
            ambientAlerts={personal.ambientAlerts}
            formatScoreLabel={formatScoreLabel}
            nakshatraCard={personalMemberChart?.nakshatraCard ?? personal.nakshatraCard}
            peyarchiReport={personal.peyarchiReport}
            weekAhead={personal.weekAhead}
            familyAggregate={family.familyAggregate}
            onDateChange={setSelectedDate}
            onGoToFamily={() => setActiveTab("family")}
            onOpenPrasna={() => setShowPrasna(true)}
            showPrasna={showPrasna}
            onClosePrasna={() => setShowPrasna(false)}
            dasha={personalDasha}
            dashaMaha={personalDashaMaha}
            dashaAntar={personalDashaAntar}
          />
        )}

        {activeTab === "tools" && (() => {
          const activeTool = showPorutham ? "porutham" : showChartGenerate ? "chartgen" : showWrapped ? "wrapped" : showRetrospective ? "retro" : null;
          // Note: Find Birth Time (rectification) removed — results were unreliable
          const needsProfile = !personal.birthProfileId;
          const TOOL_LIST = [
            { id: "porutham", icon: "CP", nameEn: "Porutham / Compatibility", nameTa: "பொருத்தம்", descEn: "Check compatibility between any two people", descTa: "எந்த இரு நபரிடமும் பொருத்தம் பார்க்கவும்", disabled: false },
            { id: "chartgen", icon: "CH", nameEn: "Generate Chart", nameTa: "ஜாதகம் உருவாக்கு", descEn: "Create a printable birth chart for any person", descTa: "எவருக்கும் அச்சடிக்கக்கூடிய ஜாதகம் உருவாக்கு", disabled: false },
            { id: "wrapped", icon: "AW", nameEn: "Annual Wrapped", nameTa: "ஆண்டு சுருக்கம்", descEn: "Your year in review — astrological summary", descTa: "உங்கள் வருட ஜோதிட சுருக்கம்", disabled: needsProfile },
            { id: "retro", icon: "RT", nameEn: "Retrospective", nameTa: "பின்னோக்கு பார்வை", descEn: "Look back at past periods and life patterns", descTa: "கடந்த காலங்களை ஜோதிட பார்வையில் அலசு", disabled: needsProfile },
          ];
          return (
            <div className="cd-tools">
              <div>
                <p className="section-kicker">{lang === "ta" ? "கருவிகள்" : "Tools"}</p>
                <h2 className="section-title">{lang === "ta" ? "சிறப்பு கருவிகள்" : "Specialist Tools"}</h2>
                <p className="section-description">{lang === "ta" ? "ஆழமான பகுப்பாய்வுக்கான கருவிகள்" : "Deep-dive tools for specific astrology questions"}</p>
              </div>
              <div className={`cd-tools__layout${activeTool ? " is-open" : ""}`}>
                {/* Tool selector rail */}
                <div className="cd-tools__rail">
                  {TOOL_LIST.map((tool) => {
                    const isActive = activeTool === tool.id;
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        disabled={tool.disabled}
                        onClick={() => {
                          setShowPorutham(tool.id === "porutham");
                          setShowChartGenerate(tool.id === "chartgen");
                          setShowWrapped(tool.id === "wrapped");
                          setShowRetrospective(tool.id === "retro");
                        }}
                        className={`cd-tools__item${isActive ? " is-active" : ""}${tool.disabled ? " is-disabled" : ""}`}
                      >
                        <span className={`cd-tools__icon${isActive ? " is-active" : ""}`}>
                          {tool.icon}
                        </span>
                        <div className="cd-tools__copy">
                          <p className={`cd-tools__title${isActive ? " is-active" : ""}`}>
                            {lang === "ta" ? tool.nameTa : tool.nameEn}
                          </p>
                          <p className="cd-tools__desc">
                            {lang === "ta" ? tool.descTa : tool.descEn}
                          </p>
                        </div>
                        {isActive && <span className="cd-tools__chevron">&gt;</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Active tool panel */}
                {activeTool && (
                  <div className="cd-responsive-tools-panel">
                    <div className="cd-tools__panel-head">
                      <button type="button"
                        onClick={() => { setShowPorutham(false); setShowChartGenerate(false); setShowWrapped(false); setShowRetrospective(false); }}
                        className="cd-tools__close">
                        {lang === "ta" ? "மூடு" : "Close"}
                      </button>
                    </div>
                    {showPorutham && (
                      <PoruthamPanel
                        lang={lang}
                        familyVaultId={family.selectedVaultId ?? undefined}
                        familyMembers={[
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
                      />
                    )}
                    {showChartGenerate && <ChartGenerateInlinePanel lang={lang} />}
                    {showWrapped && <DashboardAnnualWrapped chartId={personal.chartId} lang={lang} />}
                    {showRetrospective && personal.chartId && <RetrospectivePanel chartId={personal.chartId} lang={lang} />}
                  </div>
                )}

                {/* No tool selected: show description cards */}
                {!activeTool && <div className="cd-tools__empty" />}
              </div>
            </div>
          );
        })()}

        {activeTab === "family" && (
          <DashboardFamilyTab
            lang={lang}
            selectedDate={selectedDate}
            selectedVaultId={family.selectedVaultId}
            ownerChartId={personal.chartId}
            ownerChart={personal.chart}
            vaults={family.vaults}
            familyDetail={family.familyDetail}
            familyAggregate={family.familyAggregate}
            memberCharts={family.memberCharts}
            relationshipAlerts={family.relationshipAlerts}
            alertsLoading={family.relationshipAlertsLoading}
            busy={{
              family: family.busyFamily,
              vaults: family.busyVaults,
              deletingVaultId,
              deletingMemberId,
              memberCharts: family.busyMemberCharts,
            }}
            onRefreshFamily={() => void family.refreshFamilyBundle()}
            onOpenSetup={openSetupInSettings}
            onSelectVault={handleSelectVault}
            onDeleteVault={(vaultId, name) => void handleDeleteVault(vaultId, name)}
            onDeleteMember={(memberId, name) => void handleDeleteMember(memberId, name)}
            onEditMember={handleEditFamilyMember}
          />
        )}

        {activeTab === "calendar" && (
          <CalendarTab
            selectedDate={selectedDate}
            todayDate={personal.todayDate}
            panchangam={personal.panchangam}
            panchangamTimings={personal.panchangamTimings}
            lang={lang}
          />
        )}

        {activeTab === "life-areas" && (
          <DashboardLifeAreasTab
            lang={lang}
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
          />
        )}

        {activeTab === "transits" && (
          <DashboardTransitsTab
            lang={lang}
            selectedDate={selectedDate}
            personalChart={transitChart}
            personalDailyGuidance={transitDailyGuidance}
            personalTransit={transitTransit}
            personalSani={transitSani}
            personalDasha={transitDasha}
            personalDashaMaha={transitDashaMaha}
            personalDashaAntar={transitDashaAntar}
            dashaStory={transitViewId ? null : personal.dashaStory}
            journalCorrelations={personal.journalCorrelations}
            varshaphalaData={varshaphalaData}
            varshaphalaLoading={varshaphalaLoading}
            onLoadVarshaphala={(year) => void loadVarshaphala(year, transitChart?.chartId ?? personal.chartId)}
            birthDisplayName={birthForm.displayName}
            memberCharts={family.memberCharts.map((mc) => ({ memberId: mc.memberId, displayName: mc.displayName }))}
            selectedMemberId={transitViewId}
            onSelectMember={setTransitViewId}
          />
        )}

        {activeTab === "plan" && (
          <DashboardPlanTab
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
          />
        )}

        {activeTab === "journal" && (
          <DashboardJournalTab
            lang={lang}
            chartId={personal.chartId}
            selectedDate={selectedDate}
            hasBirthProfile={!!personal.birthProfileId}
            journalEntries={journal.journalEntries}
            journalTotal={journal.journalTotal}
            contextData={journal.contextData}
            onEntrySaved={() => journal.loadJournalEntries(personal.chartId)}
            onEntryArchived={() => journal.loadJournalEntries(personal.chartId)}
            onContextUpdated={(data) => journal.setContextData(data)}
            mode={session.userMode}
          />
        )}

        {ENABLE_QA_TAB && activeTab === "qa" && (
          <QATab lang={lang} />
        )}

        {activeTab === "settings" && settingsSubTab === "session" && (
          <DashboardSettingsSessionTab
            lang={lang}
            ownerUserId={ownerUserId}
            selectedDate={selectedDate}
            selectedVaultId={family.selectedVaultId}
            birthProfileId={personal.birthProfileId}
            chartId={personal.chartId}
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
            onOpenSetup={openSetupInSettings}
            onSettingsSubTabChange={setSettingsSubTab}
            onOwnerUserIdChange={handleOwnerUserIdChange}
            onSelectedDateChange={setSelectedDate}
            onRefreshPersonal={() => void personal.refreshPersonalBundle()}
            onRefreshFamily={() => void family.refreshFamilyBundle()}
            onSaveJournalRetentionDays={(days) => void journal.saveJournalRetentionDays(days)}
            onAcknowledgeJournalReminder={() => void journal.acknowledgeJournalReminder()}
            onSignOut={session.signOut}
          />
        )}

      </div>

      {/* Dashboard footer */}
      <footer className="cd-footer">
        <div className="cd-footer__inner">

          {/* Top row: brand + nav links */}
          <div className="cd-footer__top">
            <div>
              <p className="cd-footer__wordmark">
                Vinaadi
              </p>
              <p className="cd-footer__tagline">
                {lang === "ta" ? "ஜோதிட வழிகாட்டி · தினமும் காலை" : "Jyotish guidance · every morning"}
              </p>
            </div>
            <div className="cd-footer__links">
              {(lang === "ta"
                ? ["தனிப்பட்ட", "வாழ்க்கை", "நாட்காட்டி", "குறிப்பேடு", "அமைப்புகள்"]
                : ["Personal", "Life Areas", "Calendar", "Journal", "Settings"]
              ).map((label) => (
                <span key={label} className="cd-footer__link">{label}</span>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="cd-footer__divider" />

          {/* Bottom row: disclaimer + copyright */}
          <div className="cd-footer__bottom">
            <p className="cd-footer__disclaimer">
              {lang === "ta"
                ? "ஜோதிடம் ஒரு பாரம்பரிய நம்பிக்கை அமைப்பு — அறிவியல் உண்மை அல்ல. மருத்துவ, சட்ட, நிதி முடிவுகளுக்கு தகுதிவாய்ந்த நிபுணரை அணுகுங்கள்."
                : "Astrology is a traditional belief system, not a scientific fact. For medical, legal, or financial decisions, consult a qualified professional."}
            </p>
            <p className="cd-footer__copy">
              © {new Date().getFullYear()} Vinaadi
            </p>
          </div>

        </div>
      </footer>

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

      {showFeedback && <FeedbackModal lang={lang} onClose={() => setShowFeedback(false)} />}

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




