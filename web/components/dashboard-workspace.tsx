"use client";

import React, { useEffect, useRef, useState } from "react";

import { apiFetchJson, readErrorMessage, toQuery } from "@/lib/api";
import { addDays, getScoreBand, todayIso } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  ApiEnvelope,
  BirthProfileCreateResponseData,
  BirthProfileSnapshot,
  ChartCalculateResponseData,
  ChartSummaryData,
  DailyGuidanceData,
  DailyGuidanceRangeData,
  DashaTimelineItem,
  DashaTimelineResponseData,
  FamilyAggregateData,
  FamilyAggregateMember,
  FamilyCalendarData,
  FamilyVaultDetailData,
  FamilyVaultListData,
  FamilyVaultListItem,
  GoalData,
  GoalListData,
  JournalSettingsData,
  LifeAreasResponseData,
  PanchangamDailyResponseData,
  PanchangamTimingsData,
  PeyarchiEvent,
  SaniCycleData,
  TransitSnapshotData,
  AmbientAlertItem,
  WhatIfData,
  NakshatraCardData,
  NotificationPreferenceData,
  PeyarchiReportData,
  WeekAheadData,
  ActivityTimingData,
  DashaStoryData,
  JournalCorrelationData,
  PredictionBundle,
  LifeAreaPredictionResponse,
  JadhagamReportResponse,
} from "@/lib/types";

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

const STORAGE_KEY = "jothidam-ai-dashboard-state";

function generateUUID(): string {
  return crypto.randomUUID();
}

type Tab = "onboarding" | "personal" | "life-areas" | "family" | "calendar" | "settings" | "qa";
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
  memberWeight: string;
  calculateNow: boolean;
};

type MemberChart = {
  memberId: string;
  displayName: string;
  chart: ChartCalculateResponseData;
  summary: ChartSummaryData | null;
  transit: TransitSnapshotData | null;
  sani: SaniCycleData | null;
  peyarchiUpcoming: PeyarchiEvent[];
  dailyGuidance: DailyGuidanceData | null;
  weekAhead: WeekAheadData | null;
  dasha: DashaTimelineResponseData | null;
  dashaMaha: DashaTimelineResponseData | null;
  dashaAntar: DashaTimelineItem[];
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

type AuthSession = {
  userId: string;
  email: string;
};

const defaultBirthForm: BirthFormState = {
  ownerUserId: "", displayName: "", birthDateLocal: "", birthTimeLocal: "",
  birthPlace: "", birthLatitude: "", birthLongitude: "", birthTimezone: "",
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
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState("Ready. Create a profile or family vault to begin.");
  const [activeTab, setActiveTab] = useState<Tab>("personal");
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>("setup");
  const [ownerUserId, setOwnerUserId] = useState(() => generateUUID());
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const todayDate = useRef(todayIso());
  const [selectedVaultId, setSelectedVaultId] = useState("");
  const [birthProfileId, setBirthProfileId] = useState("");
  const [chartId, setChartId] = useState("");
  const [birthForm, setBirthForm] = useState<BirthFormState>(defaultBirthForm);
  const [vaultForm, setVaultForm] = useState<VaultFormState>(defaultVaultForm);
  const [memberForm, setMemberForm] = useState<MemberFormState>(defaultMemberForm);
  const [vaults, setVaults] = useState<FamilyVaultListItem[]>([]);
  const [chart, setChart] = useState<ChartCalculateResponseData | null>(null);
  const [chartSummary, setChartSummary] = useState<ChartSummaryData | null>(null);
  const [todayGuidance, setTodayGuidance] = useState<DailyGuidanceData | null>(null);
  const [todayTransit, setTodayTransit] = useState<TransitSnapshotData | null>(null);
  const [dailyGuidance, setDailyGuidance] = useState<DailyGuidanceData | null>(null);
  const [dailyGuidanceRange, setDailyGuidanceRange] = useState<DailyGuidanceRangeData | null>(null);
  const [dasha, setDasha] = useState<DashaTimelineResponseData | null>(null);
  const [dashaMaha, setDashaMaha] = useState<DashaTimelineResponseData | null>(null);
  const [dashaAntar, setDashaAntar] = useState<DashaTimelineItem[]>([]);
  const [transit, setTransit] = useState<TransitSnapshotData | null>(null);
  const [sani, setSani] = useState<SaniCycleData | null>(null);
  const [peyarchiUpcoming, setPeyarchiUpcoming] = useState<PeyarchiEvent[]>([]);
  const [panchangam, setPanchangam] = useState<PanchangamDailyResponseData | null>(null);
  const [lifeAreas, setLifeAreas] = useState<LifeAreasResponseData | null>(null);
  const [panchangamTimings, setPanchangamTimings] = useState<PanchangamTimingsData | null>(null);
  const [familyDetail, setFamilyDetail] = useState<FamilyVaultDetailData | null>(null);
  const [familyAggregate, setFamilyAggregate] = useState<FamilyAggregateData | null>(null);
  const [familyCalendar, setFamilyCalendar] = useState<FamilyCalendarData | null>(null);
  const [memberCharts, setMemberCharts] = useState<MemberChart[]>([]);
  const [editMember, setEditMember] = useState<EditMemberState | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [personalViewId, setPersonalViewId] = useState<string | null>(null);
  const [lifeAreasViewId, setLifeAreasViewId] = useState<string | null>(null);
  const [calendarViewId, setCalendarViewId] = useState<string | null>(null);
  const [busy, setBusy] = useState({
    vaults: false, personal: false, family: false,
    createProfile: false, createVault: false, addMember: false,
    deletingMemberId: "", deletingVaultId: "", editingMember: false,
    editingProfile: false, memberCharts: false, journalSettings: false,
  });
  const [journalSettings, setJournalSettings] = useState<JournalSettingsData | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [lang, setLang] = useState<Lang>("ta");
  const [showFeedback, setShowFeedback] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);

  // ── Goals & What-If state ──
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [goalsBusy, setGoalsBusy] = useState(false);
  const [addingGoalType, setAddingGoalType] = useState("");
  const [removingGoalId, setRemovingGoalId] = useState("");
  const [whatIfScenario, setWhatIfScenario] = useState("job_change");
  const [whatIfDate, setWhatIfDate] = useState("");
  const [whatIfResult, setWhatIfResult] = useState<WhatIfData | null>(null);
  const [whatIfBusy, setWhatIfBusy] = useState(false);
  const [whatIfError, setWhatIfError] = useState("");
  const [ambientAlerts, setAmbientAlerts] = useState<AmbientAlertItem[]>([]);
  const [relationshipAlerts, setRelationshipAlerts] = useState<import("@/lib/types").RelationshipAlertItem[]>([]);
  const [relationshipAlertsLoading, setRelationshipAlertsLoading] = useState(false);

  // ── New feature state (FEATURE-10, ARCH-02, FEATURE-07, FEATURE-09, FEATURE-11, FEATURE-12) ──
  const [nakshatraCard, setNakshatraCard] = useState<NakshatraCardData | null>(null);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferenceData | null>(null);
  const [peyarchiReport, setPeyarchiReport] = useState<PeyarchiReportData | null>(null);
  const [weekAhead, setWeekAhead] = useState<WeekAheadData | null>(null);
  const [dashaStory, setDashaStory] = useState<DashaStoryData | null>(null);
  const [journalCorrelations, setJournalCorrelations] = useState<JournalCorrelationData | null>(null);

  // ── Phase 4: Deep predictions + Jadhagam report ──
  const [predictions, setPredictions] = useState<PredictionBundle>({ marriage: null, career: null, wealth: null, health: null });
  const [predictionsLoading, setPredictionsLoading] = useState(false);
  const [jadhagamReport, setJadhagamReport] = useState<JadhagamReportResponse["data"] | null>(null);
  const [jadhagamReportLoading, setJadhagamReportLoading] = useState(false);

  // ── Auth session + hydration ────

  useEffect(() => {
    let active = true;

    async function bootstrapSession() {
      try {
        const me = await apiFetchJson<AuthSession>("/api/v1/auth/me");
        if (!active) return;

        const authedUserId = me.userId;
        setOwnerUserId(authedUserId);
        setUserEmail(me.email);

        try {
          const stored = window.localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored) as Partial<PersistedState>;
            const storedUserId = typeof parsed.ownerUserId === "string" ? parsed.ownerUserId : null;
            const isSameUser = storedUserId === authedUserId;

            if (isSameUser) {
              if (typeof parsed.selectedVaultId === "string") setSelectedVaultId(parsed.selectedVaultId);
              if (typeof parsed.birthProfileId === "string") setBirthProfileId(parsed.birthProfileId);
              if (typeof parsed.chartId === "string") setChartId(parsed.chartId);
              if (parsed.birthForm) setBirthForm((c) => ({ ...c, ...parsed.birthForm }));
              if (parsed.vaultForm) setVaultForm((c) => ({ ...c, ...parsed.vaultForm }));
              if (parsed.memberForm) setMemberForm((c) => ({ ...c, ...parsed.memberForm }));
              if (parsed.activeTab === "onboarding") {
                setActiveTab("settings");
                setSettingsSubTab("setup");
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
        // Honor ?setup=1 from login redirect
        const url = new URL(window.location.href);
        if (url.searchParams.get("setup") === "1") {
          setActiveTab("settings");
          setSettingsSubTab("setup");
          url.searchParams.delete("setup");
          window.history.replaceState({}, "", url.toString());
        }

        setHydrated(true);
      } catch (error) {
        if (!active) return;
        const message = readErrorMessage(error);
        if (message.startsWith("401:")) {
          await fetch("/api/backend/api/v1/auth/logout", {
            method: "POST",
            credentials: "include",
          }).catch(() => undefined);
          window.location.href = "/login";
          return;
        }
        setStatus(message);
        window.location.href = "/login";
      }
    }

    void bootstrapSession();
    return () => { active = false; };
  }, []);

  // Onboarding redirect: force setup tab until profile + vault member are added
  useEffect(() => {
    if (!hydrated) return;
    if (!birthProfileId) {
      setActiveTab("settings");
      setSettingsSubTab("setup");
      setOnboardingDone(false);
    } else if (vaults.length === 0 || vaults.every((v) => v.memberCount === 0)) {
      setOnboardingDone(false);
    } else {
      setOnboardingDone(true);
    }
  }, [hydrated, birthProfileId, vaults]);

  // ── Persistence ────────────────────────────────────────

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ownerUserId, selectedDate, selectedVaultId, birthProfileId, chartId,
      birthForm, vaultForm, memberForm, activeTab, lang,
    } as PersistedState));
  }, [activeTab, birthForm, birthProfileId, chartId, hydrated, lang, memberForm, ownerUserId, selectedDate, selectedVaultId, vaultForm]);

  useEffect(() => {
    if (!hydrated) return;
    if (vaultForm.ownerUserId !== ownerUserId) setVaultForm((c) => ({ ...c, ownerUserId }));
    if (birthForm.ownerUserId !== ownerUserId) setBirthForm((c) => ({ ...c, ownerUserId }));
  }, [birthForm.ownerUserId, hydrated, ownerUserId, vaultForm.ownerUserId]);

  // ── Toast ────────────────────────────────────────────────

  function showToast(message: string, tone: "success" | "error" = "success") {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 4000);
  }

  function openSetupInSettings() {
    setActiveTab("settings");
    setSettingsSubTab("setup");
  }

  // ── Data loaders ────────────────────────────────────────

  async function loadVaults(nextOwnerUserId = ownerUserId) {
    setBusy((c) => ({ ...c, vaults: true }));
    try {
      const response = await apiFetchJson<ApiEnvelope<FamilyVaultListData>>(
        `/api/v1/family-vaults${toQuery({ ownerUserId: nextOwnerUserId, limit: 20, offset: 0 })}`
      );
      setVaults(response.data.items);
      const next = response.data.items.find((i) => i.familyVaultId === selectedVaultId) ?? response.data.items[0];
      if (next && next.familyVaultId !== selectedVaultId) setSelectedVaultId(next.familyVaultId);
      if (!next) { setSelectedVaultId(""); setFamilyDetail(null); setFamilyAggregate(null); setFamilyCalendar(null); }
    } catch (error) { setStatus(readErrorMessage(error)); }
    finally { setBusy((c) => ({ ...c, vaults: false })); }
  }

  async function loadJournalSettings() {
    try {
      const response = await apiFetchJson<ApiEnvelope<JournalSettingsData>>("/api/v1/settings/journal");
      setJournalSettings(response.data);
    } catch {
      // Keep default if settings are not reachable in current session.
    }
    // ARCH-02: also load notification preferences alongside journal settings
    apiFetchJson<ApiEnvelope<NotificationPreferenceData>>("/api/v1/settings/notifications")
      .then((r) => setNotificationPrefs(r.data))
      .catch(() => {});
  }

  async function loadLatestBirthProfileForCurrentUser(): Promise<BirthProfileSnapshot | null> {
    try {
      const response = await apiFetchJson<ApiEnvelope<BirthProfileSnapshot>>("/api/v1/birth-profiles/me/latest");
      const profile = response.data;
      setBirthProfileId(profile.birthProfileId);
      setBirthForm((current) => ({
        ...current,
        displayName: profile.displayName,
        birthDateLocal: profile.birthDateLocal,
        birthTimeLocal: profile.birthTimeLocal ?? "",
        birthPlace: profile.birthPlace,
        birthLatitude: profile.birthLatitude !== undefined ? String(profile.birthLatitude) : current.birthLatitude,
        birthLongitude: profile.birthLongitude !== undefined ? String(profile.birthLongitude) : current.birthLongitude,
        birthTimezone: profile.birthTimezone,
        relationshipToOwner: (profile.relationshipToOwner as Relationship) ?? current.relationshipToOwner,
      }));
      return profile;
    } catch {
      return null;
    }
  }

  async function refreshPersonalBundle(nextBirthProfileId = birthProfileId, nextDate = selectedDate, allowRecovery = true) {
    if (!nextBirthProfileId) {
      if (allowRecovery) {
        const recovered = await loadLatestBirthProfileForCurrentUser();
        if (recovered) await refreshPersonalBundle(recovered.birthProfileId, nextDate, false);
      }
      return;
    }
    setBusy((c) => ({ ...c, personal: true }));
    try {
      setChartSummary(null); setDailyGuidanceRange(null); setPanchangamTimings(null); setDashaAntar([]);
      const chartResponse = await apiFetchJson<ApiEnvelope<ChartCalculateResponseData>>("/api/v1/charts/calculate", {
        method: "POST",
        body: JSON.stringify({ birthProfileId: nextBirthProfileId, calculationVersion: "thirukanitham-2026-v1" }),
      });
      setChart(chartResponse.data);
      setChartId(chartResponse.data.chartId);

      const chartPath = `/api/v1/charts/${chartResponse.data.chartId}`;
      const isToday = nextDate === todayDate.current;
      const { birthLatitude: lat, birthLongitude: lng, birthTimezone: tz } = chartResponse.data.birthProfile;

      const [summaryRes, daily, dailyRange, dashaRes, dashaMahaRes, dashaAntarRes, transitRes, saniRes, peyarchiRes, panchangamRes, timingsRes, lifeAreasRes] = await Promise.all([
        apiFetchJson<ApiEnvelope<ChartSummaryData>>(`${chartPath}/summary${toQuery({ language: "ta-en" })}`),
        apiFetchJson<ApiEnvelope<DailyGuidanceData>>(`${chartPath}/daily-guidance${toQuery({ date: nextDate, language: "ta-en" })}`),
        apiFetchJson<ApiEnvelope<DailyGuidanceRangeData>>(
          `/api/v1/daily-guidance/range${toQuery({ profileId: nextBirthProfileId, from: nextDate, to: addDays(nextDate, 2), language: "ta-en" })}`
        ),
        apiFetchJson<ApiEnvelope<DashaTimelineResponseData>>(`${chartPath}/dasha${toQuery({ asOf: nextDate, level: "pratyantar" })}`),
        apiFetchJson<ApiEnvelope<DashaTimelineResponseData>>(`${chartPath}/dasha${toQuery({ asOf: nextDate, level: "maha" })}`),
        apiFetchJson<ApiEnvelope<DashaTimelineResponseData>>(`${chartPath}/dasha${toQuery({ asOf: nextDate, level: "antar" })}`),
        apiFetchJson<ApiEnvelope<TransitSnapshotData>>(`${chartPath}/gochar/current${toQuery({ date: nextDate })}`),
        apiFetchJson<ApiEnvelope<SaniCycleData>>(`${chartPath}/sani-cycle${toQuery({ date: nextDate })}`),
        apiFetchJson<ApiEnvelope<PeyarchiEvent[]>>(`${chartPath}/peyarchi/upcoming${toQuery({ as_of: nextDate, window_days: 30 })}`),
        apiFetchJson<ApiEnvelope<PanchangamDailyResponseData>>(
          `/api/v1/panchangam/daily${toQuery({ date: nextDate, lat, lng, timezone: tz })}`
        ),
        apiFetchJson<ApiEnvelope<PanchangamTimingsData>>(
          `/api/v1/panchangam/timings${toQuery({ date: nextDate, lat, lng, timezone: tz })}`
        ),
        apiFetchJson<ApiEnvelope<LifeAreasResponseData>>(`${chartPath}/life-areas${toQuery({ asOf: nextDate })}`),
      ]);

      setChartSummary(summaryRes.data);
      setDailyGuidance(daily.data);
      setDailyGuidanceRange(dailyRange.data);
      setDasha(dashaRes.data);
      setDashaMaha(dashaMahaRes.data);
      setDashaAntar(dashaAntarRes.data.timeline);
      setTransit(transitRes.data);
      setSani(saniRes.data);
      setPeyarchiUpcoming(peyarchiRes.data);
      setPanchangam(panchangamRes.data);
      setPanchangamTimings(timingsRes.data);
      setLifeAreas(lifeAreasRes.data);

      if (isToday || !todayGuidance) setTodayGuidance(daily.data);
      if (isToday || !todayTransit) setTodayTransit(transitRes.data);

      apiFetchJson<ApiEnvelope<GoalListData>>(`/api/v1/goals${toQuery({ chartId: chartResponse.data.chartId, activeOnly: true })}`)
        .then((r) => setGoals(r.data.goals))
        .catch(() => {});

      apiFetchJson<{ success: boolean; data: { items: AmbientAlertItem[] } }>(
        `/api/v1/alerts/ambient?as_of_date=${nextDate}&min_significance=70&unread_only=false&limit=5`
      ).then((r) => setAmbientAlerts(r.data.items)).catch(() => {});

      // ── Fire-and-forget: new features ──────────────────────────────────────

      // FEATURE-10: Nakshatra personality card — use Moon planet's nakshatra number
      const moonPlanet = chartResponse.data.planets.find((p) => p.graha === "MOON");
      if (moonPlanet && moonPlanet.nakshatra >= 1 && moonPlanet.nakshatra <= 27) {
        apiFetchJson<{ success: boolean; data: NakshatraCardData }>(
          `/api/v1/content/nakshatra/${moonPlanet.nakshatra}`
        ).then((r) => setNakshatraCard(r.data)).catch(() => {});
      }

      // FEATURE-07: Week-ahead digest
      apiFetchJson<ApiEnvelope<WeekAheadData>>(
        `/api/v1/daily-guidance/week-ahead${toQuery({ profileId: nextBirthProfileId, weekStart: nextDate, language: "ta-en" })}`
      ).then((r) => setWeekAhead(r.data)).catch(() => {});

      // FEATURE-09: Dasha story timeline
      apiFetchJson<ApiEnvelope<DashaStoryData>>(
        `/api/v1/charts/${chartResponse.data.chartId}/dasha/timeline${toQuery({ asOf: nextDate })}`
      ).then((r) => setDashaStory(r.data)).catch(() => {});

      // FEATURE-11: Peyarchi report (only if peyarchi events are available)
      if (peyarchiRes.data.length > 0) {
        const firstPlanet = peyarchiRes.data[0].planet;
        apiFetchJson<ApiEnvelope<PeyarchiReportData>>(
          `/api/v1/transits/peyarchi-report/${chartResponse.data.chartId}${toQuery({ planet: firstPlanet, asOf: nextDate })}`
        ).then((r) => setPeyarchiReport(r.data)).catch(() => {});
      }

      // FEATURE-12: Journal correlations
      apiFetchJson<ApiEnvelope<JournalCorrelationData>>(
        `/api/v1/journal/${chartResponse.data.chartId}/correlations${toQuery({ lookbackDays: 30 })}`
      ).then((r) => setJournalCorrelations(r.data)).catch(() => {});

      // Phase 4: deep predictions are tied to the active chart in Life Areas.
      const cid = chartResponse.data.chartId;
      setPredictionsLoading(true);
      void refreshLifeAreasInsights(cid, nextDate).finally(() => setPredictionsLoading(false));

      // Reset jadhagam report on refresh so user can reload fresh
      setJadhagamReport(null);
      setJadhagamReportLoading(false);

      setStatus("Personal data refreshed.");
    } catch (error) {
      const message = readErrorMessage(error);
      if (allowRecovery && (message.startsWith("403:") || message.startsWith("404:"))) {
        setBirthProfileId("");
        setChartId("");
        const recovered = await loadLatestBirthProfileForCurrentUser();
        if (recovered && recovered.birthProfileId !== nextBirthProfileId) {
          await refreshPersonalBundle(recovered.birthProfileId, nextDate, false);
          return;
        }
      }
      setStatus(message);
    }
    finally { setBusy((c) => ({ ...c, personal: false })); }
  }

  async function addGoal(goalType: string) {
    if (!chartId) return;
    setGoalsBusy(true);
    setAddingGoalType(goalType);
    try {
      await apiFetchJson<ApiEnvelope<unknown>>("/api/v1/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chartId, goalType, languagePreference: "ta-en" }),
      });
      const r = await apiFetchJson<ApiEnvelope<GoalListData>>(`/api/v1/goals${toQuery({ chartId, activeOnly: true })}`);
      setGoals(r.data.goals);
    } catch (err) { setToast({ message: readErrorMessage(err), tone: "error" }); }
    finally { setGoalsBusy(false); setAddingGoalType(""); }
  }

  async function removeGoal(goalId: string) {
    setRemovingGoalId(goalId);
    try {
      await apiFetchJson<ApiEnvelope<unknown>>(`/api/v1/goals/${goalId}`, { method: "DELETE" });
      setGoals((prev) => prev.filter((g) => g.goalId !== goalId));
    } catch (err) { setToast({ message: readErrorMessage(err), tone: "error" }); }
    finally { setRemovingGoalId(""); }
  }

  async function runWhatIf() {
    if (!chartId || !whatIfDate) return;
    setWhatIfBusy(true);
    setWhatIfError("");
    setWhatIfResult(null);
    try {
      const r = await apiFetchJson<ApiEnvelope<WhatIfData>>("/api/v1/whatif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chartId, scenario: whatIfScenario, targetDate: whatIfDate }),
      });
      setWhatIfResult(r.data);
    } catch (err) { setWhatIfError(readErrorMessage(err)); }
    finally { setWhatIfBusy(false); }
  }

  function resolveLifeAreasChartId(): string {
    if (!lifeAreasViewId) return chartId;
    const member = memberCharts.find((mc) => mc.memberId === lifeAreasViewId);
    return member?.chart.chartId ?? chartId;
  }

  async function refreshLifeAreasInsights(targetChartId: string, onDate: string) {
    if (!targetChartId) return;
    try {
      const predQuery = toQuery({ asOf: onDate });
      const [lifeAreasRes, m, c, w, h] = await Promise.all([
        apiFetchJson<ApiEnvelope<LifeAreasResponseData>>(
          `/api/v1/charts/${targetChartId}/life-areas${toQuery({ asOf: onDate })}`
        ),
        apiFetchJson<LifeAreaPredictionResponse>(`/api/v1/charts/${targetChartId}/predictions/marriage${predQuery}`).catch(() => null),
        apiFetchJson<LifeAreaPredictionResponse>(`/api/v1/charts/${targetChartId}/predictions/career${predQuery}`).catch(() => null),
        apiFetchJson<LifeAreaPredictionResponse>(`/api/v1/charts/${targetChartId}/predictions/wealth${predQuery}`).catch(() => null),
        apiFetchJson<LifeAreaPredictionResponse>(`/api/v1/charts/${targetChartId}/predictions/health${predQuery}`).catch(() => null),
      ]);
      setLifeAreas(lifeAreasRes.data);
      setPredictions({
        marriage: m?.data ?? null,
        career: c?.data ?? null,
        wealth: w?.data ?? null,
        health: h?.data ?? null,
      });
    } catch (err) {
      setStatus(readErrorMessage(err));
    }
  }

  async function loadJadhagamReport() {
    const reportChartId = resolveLifeAreasChartId();
    if (!reportChartId || jadhagamReportLoading) return;
    setJadhagamReportLoading(true);
    try {
      const r = await apiFetchJson<JadhagamReportResponse>(`/api/v1/charts/${reportChartId}/jadhagam-report`);
      setJadhagamReport(r.data);
    } catch (err) {
      setToast({ message: readErrorMessage(err), tone: "error" });
    } finally {
      setJadhagamReportLoading(false);
    }
  }

  async function refreshFamilyBundle(nextVaultId = selectedVaultId, nextDate = selectedDate) {
    if (!nextVaultId) return;
    setBusy((c) => ({ ...c, family: true }));
    try {
      const [detailRes, aggregateRes, calendarRes] = await Promise.all([
        apiFetchJson<ApiEnvelope<FamilyVaultDetailData>>(`/api/v1/family-vaults/${nextVaultId}`),
        apiFetchJson<ApiEnvelope<FamilyAggregateData>>(`/api/v1/family-vaults/${nextVaultId}/daily-aggregate${toQuery({ date: nextDate })}`),
        apiFetchJson<ApiEnvelope<FamilyCalendarData>>(`/api/v1/family-vaults/${nextVaultId}/calendar${toQuery({ from: nextDate, to: addDays(nextDate, 6) })}`),
      ]);
      setFamilyDetail(detailRes.data);
      setFamilyAggregate(aggregateRes.data);
      setFamilyCalendar(calendarRes.data);
      void loadMemberCharts(aggregateRes.data.members, nextDate);
      setStatus("Family data refreshed.");
    } catch (error) {
      const message = readErrorMessage(error);
      if (message.startsWith("404:") || message.startsWith("403:")) {
        // Stale vault ID (e.g. from a previous DB) — clear it and reload the list.
        setSelectedVaultId("");
        setFamilyDetail(null);
        setFamilyAggregate(null);
        setFamilyCalendar(null);
        void loadVaults(ownerUserId);
      } else {
        setStatus(message);
      }
    }
    finally { setBusy((c) => ({ ...c, family: false })); }
  }

  async function loadMemberCharts(members: FamilyAggregateMember[], nextDate: string) {
    if (members.length === 0) return;
    setBusy((c) => ({ ...c, memberCharts: true }));
    const results: MemberChart[] = [];
    const errors: string[] = [];
    await Promise.allSettled(members.map(async (m) => {
      try {
        const cid = m.chartId;
        const [chartRes, summaryRes, dailyRes, transitRes, saniRes, peyarchiRes, dashaRes, dashaMahaRes, dashaAntarRes, weekAheadRes] = await Promise.all([
          apiFetchJson<ApiEnvelope<ChartCalculateResponseData>>("/api/v1/charts/calculate", {
            method: "POST",
            body: JSON.stringify({ birthProfileId: m.birthProfileId, calculationVersion: "thirukanitham-2026-v1" }),
          }),
          apiFetchJson<ApiEnvelope<ChartSummaryData>>(`/api/v1/charts/${cid}/summary${toQuery({ language: "ta-en" })}`),
          apiFetchJson<ApiEnvelope<DailyGuidanceData>>(`/api/v1/charts/${cid}/daily-guidance${toQuery({ date: nextDate, language: "ta-en" })}`),
          apiFetchJson<ApiEnvelope<TransitSnapshotData>>(`/api/v1/charts/${cid}/gochar/current${toQuery({ date: nextDate })}`),
          apiFetchJson<ApiEnvelope<SaniCycleData>>(`/api/v1/charts/${cid}/sani-cycle${toQuery({ date: nextDate })}`),
          apiFetchJson<ApiEnvelope<PeyarchiEvent[]>>(`/api/v1/charts/${cid}/peyarchi/upcoming${toQuery({ as_of: nextDate, window_days: 30 })}`),
          apiFetchJson<ApiEnvelope<DashaTimelineResponseData>>(`/api/v1/charts/${cid}/dasha${toQuery({ asOf: nextDate, level: "pratyantar" })}`),
          apiFetchJson<ApiEnvelope<DashaTimelineResponseData>>(`/api/v1/charts/${cid}/dasha${toQuery({ asOf: nextDate, level: "maha" })}`),
          apiFetchJson<ApiEnvelope<DashaTimelineResponseData>>(`/api/v1/charts/${cid}/dasha${toQuery({ asOf: nextDate, level: "antar" })}`),
          apiFetchJson<ApiEnvelope<WeekAheadData>>(`/api/v1/charts/${cid}/week-ahead${toQuery({ weekStart: nextDate, language: "ta-en" })}`).catch((e) => { console.error(`week-ahead failed for ${m.displayName}:`, e); return { data: null }; }),
        ]);
        results.push({
          memberId: m.familyMemberId,
          displayName: m.displayName,
          chart: chartRes.data,
          summary: summaryRes.data,
          transit: transitRes.data,
          sani: saniRes.data,
          peyarchiUpcoming: peyarchiRes.data,
          dailyGuidance: dailyRes.data,
          weekAhead: (weekAheadRes as ApiEnvelope<WeekAheadData>).data ?? null,
          dasha: dashaRes.data,
          dashaMaha: dashaMahaRes.data,
          dashaAntar: dashaAntarRes.data.timeline,
        });
      } catch (err) {
        errors.push(`${m.displayName}: ${readErrorMessage(err)}`);
      }
    }));
    setMemberCharts(results);
    if (errors.length > 0) setStatus(`Some family charts failed to load: ${errors.join("; ")}`);
    setBusy((c) => ({ ...c, memberCharts: false }));
  }

  async function loadRelationshipAlerts(vaultId: string) {
    if (!vaultId) return;
    setRelationshipAlertsLoading(true);
    try {
      const r = await apiFetchJson<{ success: boolean; data: { items: import("@/lib/types").RelationshipAlertItem[] } }>(
        `/api/v1/relationships/alerts${toQuery({ familyVaultId: vaultId })}`
      );
      setRelationshipAlerts(r.data.items);
    } catch {
      // non-critical — keep empty
    } finally {
      setRelationshipAlertsLoading(false);
    }
  }

  useEffect(() => { if (hydrated && ownerUserId) void loadVaults(ownerUserId); }, [hydrated, ownerUserId]);
  useEffect(() => { if (hydrated) void loadJournalSettings(); }, [hydrated]);
  useEffect(() => { if (hydrated && birthProfileId) void refreshPersonalBundle(birthProfileId, selectedDate); }, [birthProfileId, hydrated, selectedDate]);
  useEffect(() => {
    if (!hydrated || birthProfileId) return;
    void loadLatestBirthProfileForCurrentUser();
  }, [birthProfileId, hydrated]);
  useEffect(() => { if (hydrated && selectedVaultId) void refreshFamilyBundle(selectedVaultId, selectedDate); }, [hydrated, selectedDate, selectedVaultId]);
  useEffect(() => { if (hydrated && selectedVaultId) void loadRelationshipAlerts(selectedVaultId); }, [hydrated, selectedVaultId]);
  useEffect(() => {
    if (!hydrated) return;
    const targetChartId = resolveLifeAreasChartId();
    if (!targetChartId) return;
    setPredictionsLoading(true);
    setJadhagamReport(null);
    void refreshLifeAreasInsights(targetChartId, selectedDate).finally(() => setPredictionsLoading(false));
  }, [hydrated, lifeAreasViewId, selectedDate, chartId, memberCharts]);

  // ── Form handlers ────────────────────────────────────────

  function validateBirthForm(form: BirthFormState): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!form.displayName.trim()) errors.displayName = t("err_name_required", lang);
    if (!form.birthDateLocal) errors.birthDateLocal = t("err_date_required", lang);
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
    if (!form.birthPlace.trim()) errors.memberBirthPlace = t("err_place_required", lang);
    if (!form.birthTimezone.trim()) errors.memberTimezone = t("err_tz_required", lang);
    return errors;
  }

  async function handleCreateProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateBirthForm(birthForm);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({});
    setBusy((c) => ({ ...c, createProfile: true }));
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
          calculateNow: birthForm.calculateNow,
          maritalStatus: birthForm.maritalStatus || undefined,
          employmentType: birthForm.employmentType || undefined,
          birthTimeSource: birthForm.birthTimeSource || undefined,
          birthTimeConfidenceMinutes: birthForm.birthTimeConfidenceMinutes ? parseInt(birthForm.birthTimeConfidenceMinutes, 10) : undefined,
        }),
      });
      setBirthProfileId(response.data.birthProfileId);
      if (response.data.chartId) setChartId(response.data.chartId);
      showToast(`${birthForm.displayName} – ${t("toast_profile_created", lang)}`);
      setStatus(`Profile created – ${response.data.birthProfileId.slice(0, 8)}`);
      setActiveTab("personal");
    } catch (error) {
      const msg = readErrorMessage(error);
      showToast(msg, "error"); setStatus(msg);
    } finally { setBusy((c) => ({ ...c, createProfile: false })); }
  }

  async function handleCreateVault(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy((c) => ({ ...c, createVault: true }));
    try {
      const response = await apiFetchJson<ApiEnvelope<{ familyVaultId: string; ownerUserId: string; name: string; defaultLanguage: string; memberCount: number }>>(
        "/api/v1/family-vaults",
        { method: "POST", body: JSON.stringify({ ownerUserId: vaultForm.ownerUserId || undefined, name: vaultForm.name, defaultLanguage: vaultForm.defaultLanguage }) }
      );
      setOwnerUserId(response.data.ownerUserId);
      setSelectedVaultId(response.data.familyVaultId);
      showToast(`Vault "${response.data.name}" created.`);
      setStatus(`Vault "${response.data.name}" created.`);
      await loadVaults(response.data.ownerUserId);
      setActiveTab("family");
    } catch (error) {
      const msg = readErrorMessage(error);
      showToast(msg, "error"); setStatus(msg);
    } finally { setBusy((c) => ({ ...c, createVault: false })); }
  }

  async function handleAddMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedVaultId) { showToast(t("toast_vault_required", lang), "error"); return; }
    const errors = validateMemberForm(memberForm);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({});
    setBusy((c) => ({ ...c, addMember: true }));
    try {
      const response = await apiFetchJson<ApiEnvelope<{ familyMemberId: string; displayName: string }>>(
        `/api/v1/family-vaults/${selectedVaultId}/members`,
        {
          method: "POST",
          body: JSON.stringify({
            ownerUserId, familyVaultId: selectedVaultId,
            relationshipToOwner: memberForm.relationshipToOwner,
            displayName: memberForm.displayName,
            birthDateLocal: memberForm.birthDateLocal,
            birthTimeLocal: memberForm.birthTimeLocal,
            birthPlace: memberForm.birthPlace,
            birthLatitude: parseNumber(memberForm.birthLatitude),
            birthLongitude: parseNumber(memberForm.birthLongitude),
            birthTimezone: memberForm.birthTimezone,
            calculateNow: memberForm.calculateNow,
            memberWeight: parseNumber(memberForm.memberWeight, 1),
          }),
        }
      );
      showToast(`${response.data.displayName} added to vault.`);
      setStatus(`${response.data.displayName} added to vault.`);
      setMemberForm(defaultMemberForm);
      await loadVaults(ownerUserId);
      await refreshFamilyBundle(selectedVaultId, selectedDate);
    } catch (error) {
      const msg = readErrorMessage(error);
      showToast(msg, "error"); setStatus(msg);
    } finally { setBusy((c) => ({ ...c, addMember: false })); }
  }

  async function handleSaveEdit() {
    if (!editMember) return;
    setBusy((c) => ({ ...c, editingMember: true }));
    try {
      await apiFetchJson<unknown>(
        `/api/v1/family-vaults/${selectedVaultId}/members/${editMember.memberId}`,
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
            recalculate: true,
          }),
        }
      );
      showToast(`${editMember.displayName} updated.`);
      setStatus(`${editMember.displayName} updated.`);
      setEditMember(null);
      await refreshFamilyBundle(selectedVaultId, selectedDate);
    } catch (error) {
      const msg = readErrorMessage(error);
      showToast(msg, "error"); setStatus(msg);
    } finally { setBusy((c) => ({ ...c, editingMember: false })); }
  }

  async function handleSaveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy((c) => ({ ...c, editingProfile: true }));
    try {
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
          calculateNow: true,
        }),
      });
      setBirthProfileId(response.data.birthProfileId);
      if (response.data.chartId) setChartId(response.data.chartId);
      setShowEditProfile(false);
      showToast(`${birthForm.displayName} profile updated.`);
      await refreshPersonalBundle(response.data.birthProfileId, selectedDate);
    } catch (error) {
      const msg = readErrorMessage(error);
      showToast(msg, "error");
    } finally { setBusy((c) => ({ ...c, editingProfile: false })); }
  }

  async function handleDeleteMember(memberId: string, displayName: string) {
    if (!confirm(`Remove "${displayName}" from the vault?`)) return;
    setBusy((c) => ({ ...c, deletingMemberId: memberId }));
    try {
      await apiFetchJson<unknown>(`/api/v1/family-vaults/${selectedVaultId}/members/${memberId}`, { method: "DELETE" });
      showToast(`${displayName} removed.`);
      setStatus(`${displayName} removed.`);
      await loadVaults(ownerUserId);
      await refreshFamilyBundle(selectedVaultId, selectedDate);
    } catch (error) {
      const msg = readErrorMessage(error);
      showToast(msg, "error"); setStatus(msg);
    } finally { setBusy((c) => ({ ...c, deletingMemberId: "" })); }
  }

  async function handleDeleteVault(vaultId: string, vaultName: string) {
    if (!confirm(`Delete vault "${vaultName}" and all its members? This cannot be undone.`)) return;
    setBusy((c) => ({ ...c, deletingVaultId: vaultId }));
    try {
      await apiFetchJson<unknown>(`/api/v1/family-vaults/${vaultId}`, { method: "DELETE" });
      showToast(`Vault "${vaultName}" deleted.`);
      setStatus(`Vault "${vaultName}" deleted.`);
      if (selectedVaultId === vaultId) { setSelectedVaultId(""); setFamilyDetail(null); setFamilyAggregate(null); setFamilyCalendar(null); }
      await loadVaults(ownerUserId);
    } catch (error) {
      const msg = readErrorMessage(error);
      showToast(msg, "error"); setStatus(msg);
    } finally { setBusy((c) => ({ ...c, deletingVaultId: "" })); }
  }

  // ── Derived state ────────────────────────────────────────

  const selectedVault = vaults.find((v) => v.familyVaultId === selectedVaultId) ?? null;
  const personalMemberChart = personalViewId ? memberCharts.find((mc) => mc.memberId === personalViewId) ?? null : null;
  const lifeAreasMemberChart = lifeAreasViewId ? memberCharts.find((mc) => mc.memberId === lifeAreasViewId) ?? null : null;
  const calendarMemberChart = calendarViewId ? memberCharts.find((mc) => mc.memberId === calendarViewId) ?? null : null;
  const personalChart = personalMemberChart ? personalMemberChart.chart : chart;
  const personalChartSummary = personalMemberChart ? personalMemberChart.summary : chartSummary;
  const personalDailyGuidance = personalMemberChart ? personalMemberChart.dailyGuidance : dailyGuidance;
  const personalDasha = personalMemberChart ? personalMemberChart.dasha : dasha;
  const personalDashaMaha = personalMemberChart ? personalMemberChart.dashaMaha : dashaMaha;
  const personalDashaAntar = personalMemberChart ? personalMemberChart.dashaAntar : dashaAntar;
  const personalTransit = personalMemberChart ? personalMemberChart.transit : transit;
  const personalSani = personalMemberChart ? personalMemberChart.sani : sani;
  const personalPeyarchiUpcoming = personalMemberChart ? personalMemberChart.peyarchiUpcoming : peyarchiUpcoming;
  const journalRetentionDays = journalSettings?.journalRetentionDays ?? 365;

  function handleSelectVault(item: FamilyVaultListItem) {
    setSelectedVaultId(item.familyVaultId);
    setOwnerUserId(item.ownerUserId);
    setVaultForm((c) => ({ ...c, ownerUserId: item.ownerUserId }));
    setBirthForm((c) => ({ ...c, ownerUserId: item.ownerUserId }));
  }

  function handleEditFamilyMember(member: FamilyAggregateMember) {
    const mc = memberCharts.find((x) => x.memberId === member.familyMemberId);
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
    });
  }

  function handleOwnerUserIdChange(value: string) {
    setOwnerUserId(value);
    setBirthForm((c) => ({ ...c, ownerUserId: value }));
    setVaultForm((c) => ({ ...c, ownerUserId: value }));
  }

  async function handleSaveJournalRetentionDays(days: number) {
    setBusy((c) => ({ ...c, journalSettings: true }));
    try {
      const response = await apiFetchJson<ApiEnvelope<JournalSettingsData>>("/api/v1/settings/journal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journalRetentionDays: days }),
      });
      setJournalSettings(response.data);
      showToast(t("settings_retention_saved", lang));
      setStatus(t("settings_retention_saved", lang));
    } catch (error) {
      const msg = readErrorMessage(error);
      showToast(msg, "error");
      setStatus(msg);
    } finally {
      setBusy((c) => ({ ...c, journalSettings: false }));
    }
  }

  async function handleAcknowledgeJournalReminder() {
    const effectiveDays = journalSettings?.journalRetentionDays ?? 365;
    setBusy((c) => ({ ...c, journalSettings: true }));
    try {
      const response = await apiFetchJson<ApiEnvelope<JournalSettingsData>>("/api/v1/settings/journal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journalRetentionDays: effectiveDays, acknowledgeReminder: true }),
      });
      setJournalSettings(response.data);
      showToast(t("settings_retention_ack_saved", lang));
      setStatus(t("settings_retention_ack_saved", lang));
    } catch (error) {
      const msg = readErrorMessage(error);
      showToast(msg, "error");
      setStatus(msg);
    } finally {
      setBusy((c) => ({ ...c, journalSettings: false }));
    }
  }

  function handleSignOut() {
    void fetch("/api/backend/api/v1/auth/logout", {
      method: "POST",
      credentials: "include",
    }).finally(() => {
      window.location.href = "/login";
    });
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="site">

      <DashboardHero
        lang={lang}
        activeTab={activeTab}
        birthDisplayName={birthForm.displayName}
        status={status}
        chartSummary={chartSummary}
        dasha={dasha}
        todayGuidance={todayGuidance}
        todayTransit={todayTransit}
        familyAggregate={familyAggregate}
        selectedVault={selectedVault}
        selectedVaultId={selectedVaultId}
        selectedDate={selectedDate}
        userEmail={userEmail}
        showUserMenu={showUserMenu}
        toast={toast}
        alertCount={ambientAlerts.length}
        alertItems={ambientAlerts.map((a) => ({
          type: a.source,
          title: lang === "ta" ? a.title.ta : a.title.en,
          body: lang === "ta" ? a.message.ta : a.message.en,
        }))}
        onTabChange={setActiveTab}
        onDateChange={setSelectedDate}
        onLangToggle={() => setLang((l) => l === "ta" ? "en" : "ta")}
        onUserMenuToggle={() => setShowUserMenu((v) => !v)}
        onUserMenuClose={() => setShowUserMenu(false)}
        onGoToSettings={() => { setActiveTab("settings"); setSettingsSubTab("session"); setShowUserMenu(false); }}
        onSignOut={() => { setShowUserMenu(false); handleSignOut(); }}
      />

      {/* Edit member modal */}
      {editMember && (
        <EditMemberModal
          lang={lang}
          editMember={editMember}
          busySaving={busy.editingMember}
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
          busySaving={busy.editingProfile}
          onClose={() => setShowEditProfile(false)}
          onChange={setBirthForm}
          onSubmit={handleSaveProfile}
        />
      )}

      {/* Onboarding banner: shown until profile + one family member added */}
      {!onboardingDone && hydrated && (
        <div style={{ width: "min(1200px, calc(100% - 32px))", margin: "0 auto 8px" }}>
        <div style={{
          padding: "14px 20px", borderRadius: "12px",
          background: "rgba(229,184,77,0.07)", border: "1px solid rgba(229,184,77,0.25)",
          display: "flex", alignItems: "flex-start", gap: "16px", flexWrap: "wrap",
        }}>
          <div style={{ flex: 1, minWidth: "240px" }}>
            <p style={{ margin: "0 0 8px", fontSize: "0.8rem", fontWeight: 700, color: "#e5b84d" }}>
              {lang === "ta" ? "தொடங்க சில படிகள் மீதம்" : "A few steps to get started"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "18px", height: "18px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 800, flexShrink: 0,
                  background: birthProfileId ? "rgba(74,222,128,0.2)" : "rgba(229,184,77,0.2)",
                  border: `1px solid ${birthProfileId ? "#4ade80" : "#e5b84d"}`,
                  color: birthProfileId ? "#4ade80" : "#e5b84d" }}>
                  {birthProfileId ? "✓" : "1"}
                </span>
                <span style={{ fontSize: "0.78rem", color: birthProfileId ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.75)", textDecoration: birthProfileId ? "line-through" : "none" }}>
                  {lang === "ta" ? "உங்கள் ஜாதக விவரங்களை சேர்க்கவும்" : "Add your birth profile"}
                </span>
              </div>
              {(() => { const hasMember = vaults.some((v) => v.memberCount > 0); return (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "18px", height: "18px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 800, flexShrink: 0,
                    background: hasMember ? "rgba(74,222,128,0.2)" : "rgba(229,184,77,0.2)",
                    border: `1px solid ${hasMember ? "#4ade80" : "#e5b84d"}`,
                    color: hasMember ? "#4ade80" : "#e5b84d" }}>
                    {hasMember ? "✓" : "2"}
                  </span>
                  <span style={{ fontSize: "0.78rem", color: hasMember ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.75)", textDecoration: hasMember ? "line-through" : "none" }}>
                    {lang === "ta" ? "குடும்ப வாஷி திறந்து ஒரு உறுப்பினரை சேர்க்கவும்" : "Open Family Vault and add one family member"}
                  </span>
                </div>
              ); })()}
            </div>
          </div>
          <button type="button"
            onClick={() => { setActiveTab("settings"); setSettingsSubTab("setup"); }}
            style={{ padding: "8px 18px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, background: "rgba(229,184,77,0.85)", color: "#0a0800", whiteSpace: "nowrap" }}>
            {lang === "ta" ? "அமைவுக்கு செல்" : "Go to Setup"}
          </button>
        </div>
        </div>
      )}

      {/* Tab content */}
      <div className="site__body">

        {activeTab === "settings" && settingsSubTab === "setup" && (
          <DashboardSetupTab
            lang={lang}
            settingsSubTab={settingsSubTab}
            birthProfileId={birthProfileId}
            selectedVaultId={selectedVaultId}
            selectedVault={selectedVault}
            vaults={vaults}
            birthForm={birthForm}
            vaultForm={vaultForm}
            memberForm={memberForm}
            formErrors={formErrors}
            busy={{ createProfile: busy.createProfile, createVault: busy.createVault, addMember: busy.addMember }}
            onSettingsSubTabChange={setSettingsSubTab}
            onBirthFormChange={setBirthForm}
            onVaultFormChange={setVaultForm}
            onMemberFormChange={setMemberForm}
            onFormErrorChange={(patch) => setFormErrors((c) => ({ ...c, ...patch }))}
            onCreateProfile={handleCreateProfile}
            onCreateVault={handleCreateVault}
            onAddMember={handleAddMember}
            onSelectVault={(vaultId, uid) => { setSelectedVaultId(vaultId); setOwnerUserId(uid); }}
            onShowEditProfile={() => setShowEditProfile(true)}
            onGoToPersonal={() => setActiveTab("personal")}
          />
        )}

        {activeTab === "personal" && (
          <DashboardPersonalTab
            lang={lang}
            birthDisplayName={birthForm.displayName}
            selectedDate={selectedDate}
            todayDate={todayDate.current}
            personalViewId={personalViewId}
            birthProfileId={birthProfileId}
            busyPersonal={busy.personal}
            memberCharts={memberCharts.map((mc) => ({ memberId: mc.memberId, displayName: mc.displayName }))}
            onSelectPersonalView={setPersonalViewId}
            onOpenEditProfile={() => setShowEditProfile(true)}
            onRefreshPersonal={() => void refreshPersonalBundle()}
            personalMemberChart={personalMemberChart}
            personalChart={personalChart}
            personalChartSummary={personalChartSummary}
            personalDailyGuidance={personalDailyGuidance}
            dailyGuidanceRange={dailyGuidanceRange}
            personalDasha={personalDasha}
            personalDashaMaha={personalDashaMaha}
            personalDashaAntar={personalDashaAntar}
            personalTransit={personalTransit}
            personalSani={personalSani}
            peyarchiUpcoming={personalPeyarchiUpcoming}
            panchangam={panchangam}
            panchangamTimings={panchangamTimings}
            goals={goals}
            goalsBusy={goalsBusy}
            addingGoalType={addingGoalType}
            onAddingGoalTypeChange={setAddingGoalType}
            removingGoalId={removingGoalId}
            chartId={chartId}
            onAddGoal={(goalType) => void addGoal(goalType)}
            onRemoveGoal={(goalId) => void removeGoal(goalId)}
            whatIfScenario={whatIfScenario}
            whatIfDate={whatIfDate}
            whatIfResult={whatIfResult}
            whatIfBusy={whatIfBusy}
            whatIfError={whatIfError}
            onWhatIfScenarioChange={setWhatIfScenario}
            onWhatIfDateChange={setWhatIfDate}
            onRunWhatIf={() => void runWhatIf()}
            ambientAlerts={ambientAlerts}
            formatScoreLabel={formatScoreLabel}
            nakshatraCard={nakshatraCard}
            peyarchiReport={peyarchiReport}
            dashaStory={dashaStory}
            journalCorrelations={journalCorrelations}
          />
        )}

        {activeTab === "family" && (
          <DashboardFamilyTab
            lang={lang}
            selectedDate={selectedDate}
            selectedVaultId={selectedVaultId}
            ownerChartId={chartId}
            vaults={vaults}
            familyDetail={familyDetail}
            familyAggregate={familyAggregate}
            memberCharts={memberCharts}
            relationshipAlerts={relationshipAlerts}
            alertsLoading={relationshipAlertsLoading}
            busy={{
              family: busy.family, vaults: busy.vaults,
              deletingVaultId: busy.deletingVaultId, deletingMemberId: busy.deletingMemberId,
              memberCharts: busy.memberCharts,
            }}
            onRefreshFamily={() => void refreshFamilyBundle()}
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
            panchangam={panchangam}
            panchangamTimings={panchangamTimings}
            dailyGuidance={calendarMemberChart?.dailyGuidance ?? dailyGuidance}
            dailyGuidanceRange={dailyGuidanceRange}
            familyCalendar={familyCalendar}
            familyAggregate={familyAggregate}
            chartSummary={calendarMemberChart?.summary ?? chartSummary}
            transit={calendarMemberChart?.transit ?? transit}
            sani={calendarMemberChart?.sani ?? sani}
            hasBirthProfile={!!birthProfileId}
            hasVault={!!selectedVaultId}
            lang={lang}
            weekAhead={calendarMemberChart?.weekAhead ?? weekAhead}
            birthDisplayName={birthForm.displayName}
            memberCharts={memberCharts.map((mc) => ({ memberId: mc.memberId, displayName: mc.displayName }))}
            selectedMemberId={calendarViewId}
            onSelectMember={setCalendarViewId}
          />
        )}

        {activeTab === "life-areas" && (
          <DashboardLifeAreasTab
            lang={lang}
            lifeAreas={lifeAreas}
            predictions={predictions}
            predictionsLoading={predictionsLoading}
            yogas={(lifeAreasMemberChart?.chart ?? chart)?.yogas ?? []}
            doshams={(lifeAreasMemberChart?.chart ?? chart)?.doshams ?? []}
            jadhagamReport={jadhagamReport}
            jadhagamReportLoading={jadhagamReportLoading}
            onLoadJadhagamReport={loadJadhagamReport}
            chartSummary={lifeAreasMemberChart?.summary ?? chartSummary}
            chartId={lifeAreasMemberChart?.chart.chartId ?? chartId}
            birthDisplayName={birthForm.displayName}
            memberCharts={memberCharts.map((mc) => ({ memberId: mc.memberId, displayName: mc.displayName }))}
            selectedMemberId={lifeAreasViewId}
            onSelectMember={setLifeAreasViewId}
          />
        )}

        {activeTab === "qa" && (
          <QATab lang={lang} />
        )}

        {activeTab === "settings" && settingsSubTab === "session" && (
          <DashboardSettingsSessionTab
            lang={lang}
            ownerUserId={ownerUserId}
            selectedDate={selectedDate}
            selectedVaultId={selectedVaultId}
            birthProfileId={birthProfileId}
            chartId={chartId}
            busyPersonal={busy.personal}
            busyFamily={busy.family}
            journalRetentionDays={journalRetentionDays}
            journalLastUpdatedAt={journalSettings?.lastUpdatedAt ?? null}
            journalLastRetentionReviewedAt={journalSettings?.lastRetentionReviewedAt ?? null}
            journalNextRecommendedReviewDate={journalSettings?.nextRecommendedReviewDate ?? null}
            busyJournalSettings={busy.journalSettings}
            notificationPrefs={notificationPrefs}
            onNotificationPrefsSaved={setNotificationPrefs}
            onOpenSetup={openSetupInSettings}
            onOwnerUserIdChange={handleOwnerUserIdChange}
            onSelectedDateChange={setSelectedDate}
            onRefreshPersonal={() => void refreshPersonalBundle()}
            onRefreshFamily={() => void refreshFamilyBundle()}
            onSaveJournalRetentionDays={(days) => void handleSaveJournalRetentionDays(days)}
            onAcknowledgeJournalReminder={() => void handleAcknowledgeJournalReminder()}
            onSignOut={handleSignOut}
          />
        )}

      </div>

      {/* Dashboard footer */}
      <footer className="dashboard-footer">
        <div className="dashboard-footer__inner">
          <p className="dashboard-footer__disclaimer">
            {lang === "ta"
              ? "இந்த பயன்பாடு ஜோதிடம் சார்ந்த வழிகாட்டுதல்களை வழங்குகிறது. இவை நம்பிக்கை சார்ந்த பாரம்பரிய கலை — அறிவியல் உண்மைகள் அல்ல. மருத்துவ, சட்டம், நிதி முடிவுகளுக்கு தகுதிவாய்ந்த நிபுணரை அணுகுங்கள்."
              : "This app provides Jyotish-based guidance. Astrology is a traditional belief system, not a science. For medical, legal, or financial decisions, consult a qualified professional."}
          </p>
          <p className="dashboard-footer__copy">
            © {new Date().getFullYear()} Vinaadi
          </p>
        </div>
      </footer>

      {/* Floating feedback button */}
      <button
        type="button"
        onClick={() => setShowFeedback(true)}
        title={t("feedback_btn", lang)}
        style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 150,
          width: "48px", height: "48px", borderRadius: "50%",
          background: "rgba(139,92,246,0.85)", border: "1px solid rgba(139,92,246,0.6)",
          boxShadow: "0 4px 20px rgba(139,92,246,0.4)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.2rem", color: "#fff", transition: "transform 0.15s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.1)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
      >
        ✉
      </button>

      {showFeedback && <FeedbackModal lang={lang} onClose={() => setShowFeedback(false)} />}

    </div>
  );
}
