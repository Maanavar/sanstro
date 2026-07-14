"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { todayIso } from "@/lib/format";
import { apiFetchJson, readErrorMessage, toQuery } from "@/lib/api";
import { STALE } from "@/lib/queryClient";
import {
  getChartDashboardBundle,
  type ChartDashboardBundleData,
} from "@vinaadi/shared/api/dashboardBundle";
import type {
  AmbientAlertItem,
  ApiEnvelope,
  BirthProfileSnapshot,
  ChartCalculateResponseData,
  ChartExplanationData,
  ChartSummaryData,
  DailyGuidanceData,
  DailyGuidanceRangeData,
  DashaStoryData,
  DashaTimelineItem,
  DashaTimelineResponseData,
  JadhagamReportResponse,
  JournalCorrelationData,
  LifeAreaPredictionResponse,
  LifeAreasResponseData,
  NakshatraCardData,
  PanchangamDailyResponseData,
  PanchangamTimingsData,
  PeyarchiEvent,
  PeyarchiReportData,
  PredictionBundle,
  SaniCycleData,
  TransitSnapshotData,
  WeekAheadData,
} from "@/lib/types";

type UsePersonalDataOptions = {
  selectedDate: string;
  /** Tone rides along so the hero can render ✓/⚠ without sniffing wording (DASH-08). */
  onStatus?: (message: string, tone?: "success" | "error") => void;
  /** Life-area predictions are only fetched while their surface (the Life
   *  Areas tab) is visible — they are 4 extra requests per chart+date and
   *  nothing on the Today surface reads them (DASH-04). Defaults to true. */
  predictionsEnabled?: boolean;
};

type RefreshLifeAreasInsightsOptions = {
  preloadedLifeAreas?: LifeAreasResponseData | null;
  requestId?: number;
  signal?: AbortSignal;
  /** Bypass the react-query cache — used after goal changes, whose effects
   *  the cached insights wouldn't reflect. */
  force?: boolean;
};

type RefreshPersonalBundleOptions = {
  /** Re-POST /charts/calculate even if a fresh chart is cached. Only profile
   *  edits change the chart, so only those paths should pass this (DASH-04:
   *  date paging must never re-run the calculation). */
  forceChart?: boolean;
  /** Refetch the day bundle even if cached — manual refresh, goal changes. */
  forceDay?: boolean;
};

export type ChartBundle = {
  chartSummary: ChartSummaryData | null;
  chartExplanation: ChartExplanationData | null;
  dailyGuidance: DailyGuidanceData | null;
  dailyGuidanceRange: DailyGuidanceRangeData | null;
  dasha: DashaTimelineResponseData | null;
  dashaMaha: DashaTimelineResponseData | null;
  dashaAntar: DashaTimelineItem[];
  transit: TransitSnapshotData | null;
  sani: SaniCycleData | null;
  peyarchiUpcoming: PeyarchiEvent[];
  panchangam: PanchangamDailyResponseData | null;
  panchangamTimings: PanchangamTimingsData | null;
  lifeAreas: LifeAreasResponseData | null;
  weekAhead: WeekAheadData | null;
  nakshatraCard: NakshatraCardData | null;
  panchangamLocationLabel: string | null;
  /** IANA timezone the panchangam was computed for — "now" on the Today
   *  surface is computed in this zone, not the browser's (DASH-01). */
  panchangamTimezone: string | null;
  /** Bundle sections the backend could not compute (name -> short note).
   *  Non-empty means some cards render a gap/retry state (DASH-02). */
  sectionErrors: Record<string, string>;
};

type LifeAreaInsights = {
  lifeAreas: LifeAreasResponseData | null;
  predictions: PredictionBundle;
};

const EMPTY_PREDICTIONS: PredictionBundle = {
  marriage: null,
  career: null,
  wealth: null,
  health: null,
};

const personalKeys = {
  latestBirthProfile: ["birth-profiles", "me", "latest"] as const,
  chartCalculate: (birthProfileId: string) => ["chart", "calculate", birthProfileId] as const,
  chartBundle: (chartId: string, date: string) => ["chart", "bundle", chartId, date] as const,
  ambientAlerts: (date: string) => ["alerts", "ambient", date, 70, false, 5] as const,
  weekAhead: (birthProfileId: string, date: string) => ["daily-guidance", "week-ahead", birthProfileId, date] as const,
  nakshatraCard: (nakshatra: number) => ["content", "nakshatra", nakshatra] as const,
  dashaStory: (chartId: string, date: string) => ["chart", "dasha-story", chartId, date] as const,
  peyarchiReport: (chartId: string, planet: string, date: string) => ["transits", "peyarchi-report", chartId, planet, date] as const,
  journalCorrelations: (chartId: string) => ["journal", "correlations", chartId, 30] as const,
  lifeAreaInsights: (chartId: string, date: string) => ["chart", "life-area-insights", chartId, date] as const,
  jadhagamReport: (chartId: string) => ["charts", chartId, "jadhagam-report"] as const,
};

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

async function calculateChart(birthProfileId: string, signal?: AbortSignal): Promise<ApiEnvelope<ChartCalculateResponseData>> {
  return apiFetchJson<ApiEnvelope<ChartCalculateResponseData>>("/api/v1/charts/calculate", {
    method: "POST",
    body: JSON.stringify({
      birthProfileId,
      calculationVersion: "thirukanitham-2026-v1",
    }),
    signal,
  });
}

/** Splits the combined maha+antar+pratyantar dasha timeline the bundle carries
 *  into the three shapes the dashboard components consume. Exported for tests. */
export function splitDashaTimeline(dasha: DashaTimelineResponseData | null): {
  dasha: DashaTimelineResponseData | null;
  dashaMaha: DashaTimelineResponseData | null;
  dashaAntar: DashaTimelineItem[];
} {
  if (!dasha) return { dasha: null, dashaMaha: null, dashaAntar: [] };
  const timeline = dasha.timeline ?? [];
  return {
    dasha: { ...dasha, timeline: timeline.filter((item) => item.level === "pratyantar") },
    dashaMaha: { ...dasha, timeline: timeline.filter((item) => item.level === "maha") },
    dashaAntar: timeline.filter((item) => item.level === "antar"),
  };
}

/** Maps the composite dashboard-bundle response onto the ChartBundle shape the
 *  dashboard consumes. Null sections stay null — the backend isolates section
 *  failures instead of failing the request (DASH-02). Exported for tests. */
export function mapDashboardBundle(data: ChartDashboardBundleData): ChartBundle {
  const dashaSplit = splitDashaTimeline(data.dasha);
  return {
    chartSummary: data.summary,
    chartExplanation: data.explanation,
    dailyGuidance: data.dailyGuidance,
    dailyGuidanceRange: data.dailyGuidanceRange,
    dasha: dashaSplit.dasha,
    dashaMaha: dashaSplit.dashaMaha,
    dashaAntar: dashaSplit.dashaAntar,
    transit: data.transit,
    sani: data.sani,
    peyarchiUpcoming: data.peyarchiUpcoming ?? [],
    panchangam: data.panchangam,
    panchangamTimings: data.panchangamTimings,
    lifeAreas: data.lifeAreas,
    weekAhead: data.weekAhead,
    nakshatraCard: data.nakshatraCard,
    panchangamLocationLabel: data.panchangamLocation ? `${data.panchangamLocation} location` : null,
    panchangamTimezone: data.panchangamTimezone,
    sectionErrors: data.errors ?? {},
  };
}

/** One request for the whole per-chart day bundle (DASH-04) — replaces the 13
 *  parallel requests this function used to fan out. */
async function fetchChartBundle(chartId: string, date: string): Promise<ChartBundle> {
  const response = await getChartDashboardBundle(chartId, date);
  return mapDashboardBundle(response.data);
}

async function fetchLifeAreaInsights(
  chartId: string,
  date: string,
  preloadedLifeAreas?: LifeAreasResponseData | null,
  signal?: AbortSignal,
): Promise<LifeAreaInsights> {
  const predQuery = toQuery({ asOf: date });
  // The personal chart's life-areas always arrive preloaded from the bundle;
  // this fetch branch only serves family-member charts (DASH-16: never fetch
  // /life-areas in parallel with a bundle that already carries it).
  const lifeAreasPromise = preloadedLifeAreas === undefined
    ? apiFetchJson<ApiEnvelope<LifeAreasResponseData>>(
        `/api/v1/charts/${chartId}/life-areas${toQuery({ asOf: date })}`,
        { signal },
      )
    : Promise.resolve({ data: preloadedLifeAreas } as ApiEnvelope<LifeAreasResponseData | null>);

  const [lifeAreasRes, marriage, career, wealth, health] = await Promise.all([
    lifeAreasPromise,
    apiFetchJson<LifeAreaPredictionResponse>(
      `/api/v1/charts/${chartId}/predictions/marriage${predQuery}`,
      { signal },
    ).catch((error) => {
      if (isAbortError(error)) throw error;
      return null;
    }),
    apiFetchJson<LifeAreaPredictionResponse>(
      `/api/v1/charts/${chartId}/predictions/career${predQuery}`,
      { signal },
    ).catch((error) => {
      if (isAbortError(error)) throw error;
      return null;
    }),
    apiFetchJson<LifeAreaPredictionResponse>(
      `/api/v1/charts/${chartId}/predictions/wealth${predQuery}`,
      { signal },
    ).catch((error) => {
      if (isAbortError(error)) throw error;
      return null;
    }),
    apiFetchJson<LifeAreaPredictionResponse>(
      `/api/v1/charts/${chartId}/predictions/health${predQuery}`,
      { signal },
    ).catch((error) => {
      if (isAbortError(error)) throw error;
      return null;
    }),
  ]);

  return {
    lifeAreas: lifeAreasRes.data,
    predictions: {
      marriage: marriage?.data ?? null,
      career: career?.data ?? null,
      wealth: wealth?.data ?? null,
      health: health?.data ?? null,
    },
  };
}

export function usePersonalData({ selectedDate, onStatus, predictionsEnabled = true }: UsePersonalDataOptions) {
  const todayDate = useRef(todayIso());
  const personalRequestIdRef = useRef(0);
  const queryClient = useQueryClient();

  const [birthProfileId, setBirthProfileId] = useState("");
  const [birthProfileLookupDone, setBirthProfileLookupDone] = useState(false);
  const [chartId, setChartId] = useState("");
  const [todayGuidanceSnapshot, setTodayGuidanceSnapshot] = useState<DailyGuidanceData | null>(null);
  const [todayTransitSnapshot, setTodayTransitSnapshot] = useState<TransitSnapshotData | null>(null);
  const [lifeAreasOverride, setLifeAreasOverride] = useState<LifeAreasResponseData | null>(null);
  const [predictionsOverride, setPredictionsOverride] = useState<PredictionBundle | null>(null);
  const [predictionsManualLoading, setPredictionsManualLoading] = useState(false);
  const [jadhagamReport, setJadhagamReport] = useState<JadhagamReportResponse["data"] | null>(null);
  const [jadhagamReportLoading, setJadhagamReportLoading] = useState(false);
  const [busyPersonalState, setBusyPersonalState] = useState(false);

  const chartQuery = useQuery({
    queryKey: personalKeys.chartCalculate(birthProfileId),
    queryFn: ({ signal }) => calculateChart(birthProfileId, signal),
    enabled: false,
    staleTime: STALE.session,
  });

  const chart = chartQuery.data?.data ?? null;
  const effectiveChartId = chartId || chart?.chartId || "";

  const bundleQuery = useQuery({
    queryKey: personalKeys.chartBundle(effectiveChartId, selectedDate),
    queryFn: () => fetchChartBundle(effectiveChartId, selectedDate),
    enabled: !!effectiveChartId,
    staleTime: STALE.today,
  });

  const bundle = bundleQuery.data ?? null;
  const moonNakshatra = chart?.planets.find((planet) => planet.graha === "MOON")?.nakshatra ?? null;
  const firstPeyarchiPlanet = bundle?.peyarchiUpcoming[0]?.planet ?? null;

  const ambientAlertsQuery = useQuery({
    queryKey: personalKeys.ambientAlerts(selectedDate),
    queryFn: async ({ signal }) => {
      const response = await apiFetchJson<{ success: boolean; data: { items: AmbientAlertItem[] } }>(
        `/api/v1/alerts/ambient?as_of_date=${selectedDate}&min_significance=70&unread_only=false&limit=5`,
        { signal },
      );
      return response.data.items;
    },
    enabled: !!effectiveChartId,
    staleTime: STALE.today,
  });

  // Fallback only: the bundle already carries weekAhead/nakshatraCard; these
  // fire solely when that section failed server-side.
  const weekAheadQuery = useQuery({
    queryKey: personalKeys.weekAhead(birthProfileId, selectedDate),
    queryFn: async ({ signal }) => {
      const response = await apiFetchJson<ApiEnvelope<WeekAheadData>>(
        `/api/v1/daily-guidance/week-ahead${toQuery({ profileId: birthProfileId, weekStart: selectedDate, language: "ta-en" })}`,
        { signal },
      );
      return response.data;
    },
    enabled: !!birthProfileId && !!bundle && !bundle.weekAhead,
    staleTime: STALE.today,
  });

  const nakshatraCardQuery = useQuery({
    queryKey: personalKeys.nakshatraCard(moonNakshatra ?? 0),
    queryFn: async ({ signal }) => {
      const response = await apiFetchJson<{ success: boolean; data: NakshatraCardData }>(
        `/api/v1/content/nakshatra/${moonNakshatra}`,
        { signal },
      );
      return response.data;
    },
    enabled:
      typeof moonNakshatra === "number" && moonNakshatra >= 1 && moonNakshatra <= 27 &&
      !!bundle && !bundle.nakshatraCard,
    staleTime: STALE.static,
  });

  const dashaStoryQuery = useQuery({
    queryKey: personalKeys.dashaStory(effectiveChartId, selectedDate),
    queryFn: async ({ signal }) => {
      const response = await apiFetchJson<ApiEnvelope<DashaStoryData>>(
        `/api/v1/charts/${effectiveChartId}/dasha/timeline${toQuery({ asOf: selectedDate })}`,
        { signal },
      );
      return response.data;
    },
    enabled: !!effectiveChartId,
    staleTime: STALE.today,
  });

  const peyarchiReportQuery = useQuery({
    queryKey: personalKeys.peyarchiReport(effectiveChartId, firstPeyarchiPlanet ?? "", selectedDate),
    queryFn: async ({ signal }) => {
      const response = await apiFetchJson<ApiEnvelope<PeyarchiReportData>>(
        `/api/v1/transits/peyarchi-report/${effectiveChartId}${toQuery({
          planet: firstPeyarchiPlanet,
          asOf: selectedDate,
        })}`,
        { signal },
      );
      return response.data;
    },
    enabled: !!effectiveChartId && !!firstPeyarchiPlanet,
    staleTime: STALE.today,
  });

  const journalCorrelationsQuery = useQuery({
    queryKey: personalKeys.journalCorrelations(effectiveChartId),
    queryFn: async ({ signal }) => {
      const response = await apiFetchJson<ApiEnvelope<JournalCorrelationData>>(
        `/api/v1/journal/${effectiveChartId}/correlations${toQuery({ lookbackDays: 30 })}`,
        { signal },
      );
      return response.data;
    },
    enabled: !!effectiveChartId,
    staleTime: STALE.today,
  });

  // Gated on the bundle so the preloaded life-areas are always available
  // (DASH-16 — never a second /life-areas in flight), and on the predictions
  // surface being open (DASH-04 — 4 requests that only the Life Areas tab reads).
  const lifeAreaInsightsQuery = useQuery({
    queryKey: personalKeys.lifeAreaInsights(effectiveChartId, selectedDate),
    queryFn: ({ signal }) => fetchLifeAreaInsights(effectiveChartId, selectedDate, bundle?.lifeAreas ?? null, signal),
    enabled: !!effectiveChartId && !!bundle && predictionsEnabled,
    staleTime: STALE.today,
  });

  function reportStatus(message: string, tone: "success" | "error" = "success") {
    onStatus?.(message, tone);
  }

  function beginPersonalRequest() {
    personalRequestIdRef.current += 1;
    return personalRequestIdRef.current;
  }

  function isPersonalRequestCurrent(requestId: number) {
    return personalRequestIdRef.current === requestId;
  }

  function updateBirthProfileId(nextBirthProfileId: string) {
    setBirthProfileId(nextBirthProfileId);
    if (nextBirthProfileId) {
      setBirthProfileLookupDone(true);
    }
  }

  async function loadLatestBirthProfileForCurrentUser(): Promise<BirthProfileSnapshot | null> {
    try {
      const response = await queryClient.fetchQuery({
        queryKey: personalKeys.latestBirthProfile,
        queryFn: () => apiFetchJson<ApiEnvelope<BirthProfileSnapshot>>("/api/v1/birth-profiles/me/latest"),
        staleTime: STALE.session,
      });
      const profile = response.data;
      updateBirthProfileId(profile.birthProfileId);
      return profile;
    } catch {
      return null;
    } finally {
      setBirthProfileLookupDone(true);
    }
  }

  async function refreshLifeAreasInsights(
    targetChartId: string,
    onDate: string,
    options: RefreshLifeAreasInsightsOptions = {},
  ) {
    if (!targetChartId) return;
    const requestId = options.requestId ?? personalRequestIdRef.current;
    try {
      const insights = await queryClient.fetchQuery({
        queryKey: personalKeys.lifeAreaInsights(targetChartId, onDate),
        queryFn: () => fetchLifeAreaInsights(targetChartId, onDate, options.preloadedLifeAreas, options.signal),
        staleTime: options.force ? 0 : STALE.today,
      });
      if (!isPersonalRequestCurrent(requestId)) return;
      setLifeAreasOverride(insights.lifeAreas);
      setPredictionsOverride(insights.predictions);
    } catch (error) {
      if (isAbortError(error) || !isPersonalRequestCurrent(requestId)) return;
      reportStatus(readErrorMessage(error), "error");
    }
  }

  async function loadJadhagamReport(targetChartId: string): Promise<void> {
    if (!targetChartId || jadhagamReportLoading) return;
    setJadhagamReportLoading(true);
    try {
      const response = await queryClient.fetchQuery({
        queryKey: personalKeys.jadhagamReport(targetChartId),
        queryFn: () => apiFetchJson<JadhagamReportResponse>(
          `/api/v1/charts/${targetChartId}/jadhagam-report`,
        ),
        staleTime: STALE.today,
      });
      setJadhagamReport(response.data);
    } finally {
      setJadhagamReportLoading(false);
    }
  }

  async function prefetchSecondaryQueries(
    nextChartId: string,
    nextDate: string,
    nextBundle: ChartBundle,
  ) {
    const nextPeyarchiPlanet = nextBundle.peyarchiUpcoming[0]?.planet ?? null;

    await Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: personalKeys.ambientAlerts(nextDate),
        queryFn: async () => {
          const response = await apiFetchJson<{ success: boolean; data: { items: AmbientAlertItem[] } }>(
            `/api/v1/alerts/ambient?as_of_date=${nextDate}&min_significance=70&unread_only=false&limit=5`,
          );
          return response.data.items;
        },
        staleTime: STALE.today,
      }),
      queryClient.prefetchQuery({
        queryKey: personalKeys.dashaStory(nextChartId, nextDate),
        queryFn: async () => {
          const response = await apiFetchJson<ApiEnvelope<DashaStoryData>>(
            `/api/v1/charts/${nextChartId}/dasha/timeline${toQuery({ asOf: nextDate })}`,
          );
          return response.data;
        },
        staleTime: STALE.today,
      }),
      nextPeyarchiPlanet
        ? queryClient.prefetchQuery({
            queryKey: personalKeys.peyarchiReport(nextChartId, nextPeyarchiPlanet, nextDate),
            queryFn: async () => {
              const response = await apiFetchJson<ApiEnvelope<PeyarchiReportData>>(
                `/api/v1/transits/peyarchi-report/${nextChartId}${toQuery({
                  planet: nextPeyarchiPlanet,
                  asOf: nextDate,
                })}`,
              );
              return response.data;
            },
            staleTime: STALE.today,
          })
        : Promise.resolve(),
      queryClient.prefetchQuery({
        queryKey: personalKeys.journalCorrelations(nextChartId),
        queryFn: async () => {
          const response = await apiFetchJson<ApiEnvelope<JournalCorrelationData>>(
            `/api/v1/journal/${nextChartId}/correlations${toQuery({ lookbackDays: 30 })}`,
          );
          return response.data;
        },
        staleTime: STALE.today,
      }),
    ]);
  }

  async function refreshPersonalBundle(
    nextBirthProfileId = birthProfileId,
    nextDate = selectedDate,
    allowRecovery = true,
    options: RefreshPersonalBundleOptions = {},
  ) {
    if (!nextBirthProfileId) {
      if (allowRecovery) {
        const recovered = await loadLatestBirthProfileForCurrentUser();
        if (recovered) {
          await refreshPersonalBundle(recovered.birthProfileId, nextDate, false, options);
        }
      }
      return;
    }

    const requestId = beginPersonalRequest();
    setBusyPersonalState(true);
    try {
      // Cached for the session unless a profile edit forces a re-run — the
      // chart is a function of the birth data, not of the selected date
      // (DASH-04: no POST /charts/calculate on date paging).
      const chartResponse = await queryClient.fetchQuery({
        queryKey: personalKeys.chartCalculate(nextBirthProfileId),
        queryFn: ({ signal }) => calculateChart(nextBirthProfileId, signal),
        staleTime: options.forceChart ? 0 : STALE.session,
      });
      if (!isPersonalRequestCurrent(requestId)) return;

      updateBirthProfileId(nextBirthProfileId);
      setChartId(chartResponse.data.chartId);
      setLifeAreasOverride(null);
      setPredictionsOverride(null);
      setJadhagamReport(null);
      setJadhagamReportLoading(false);

      const nextBundle = await queryClient.fetchQuery({
        queryKey: personalKeys.chartBundle(chartResponse.data.chartId, nextDate),
        queryFn: () => fetchChartBundle(chartResponse.data.chartId, nextDate),
        staleTime: options.forceDay ? 0 : STALE.today,
      });
      if (!isPersonalRequestCurrent(requestId)) return;

      if (nextDate === todayDate.current || !todayGuidanceSnapshot) {
        setTodayGuidanceSnapshot(nextBundle.dailyGuidance);
      }
      if (nextDate === todayDate.current || !todayTransitSnapshot) {
        setTodayTransitSnapshot(nextBundle.transit);
      }

      void prefetchSecondaryQueries(chartResponse.data.chartId, nextDate, nextBundle);
      if (options.forceDay) {
        void refreshLifeAreasInsights(chartResponse.data.chartId, nextDate, {
          preloadedLifeAreas: nextBundle.lifeAreas,
          requestId,
          force: true,
        });
      }

      reportStatus(
        nextBundle.panchangamLocationLabel
          ? `Personal data refreshed. Panchangam uses ${nextBundle.panchangamLocationLabel}.`
          : "Personal data refreshed. Panchangam needs a saved birth or current location.",
      );
    } catch (error) {
      if (isAbortError(error)) return;
      const message = readErrorMessage(error);
      if (allowRecovery && (message.startsWith("403:") || message.startsWith("404:"))) {
        setBirthProfileId("");
        setChartId("");
        const recovered = await loadLatestBirthProfileForCurrentUser();
        if (recovered && recovered.birthProfileId !== nextBirthProfileId) {
          await refreshPersonalBundle(recovered.birthProfileId, nextDate, false, options);
          return;
        }
      }
      reportStatus(message, "error");
    } finally {
      if (isPersonalRequestCurrent(requestId)) {
        setBusyPersonalState(false);
      }
    }
  }

  const activeInsights = lifeAreaInsightsQuery.data ?? null;
  const lifeAreas = lifeAreasOverride ?? activeInsights?.lifeAreas ?? bundle?.lifeAreas ?? null;
  const predictions = predictionsOverride ?? activeInsights?.predictions ?? EMPTY_PREDICTIONS;
  const todayGuidance = selectedDate === todayDate.current
    ? bundle?.dailyGuidance ?? todayGuidanceSnapshot
    : todayGuidanceSnapshot ?? bundle?.dailyGuidance ?? null;
  const todayTransit = selectedDate === todayDate.current
    ? bundle?.transit ?? todayTransitSnapshot
    : todayTransitSnapshot ?? bundle?.transit ?? null;

  return {
    todayDate: todayDate.current,
    birthProfileId,
    chartId: effectiveChartId,
    chart,
    chartExplanation: bundle?.chartExplanation ?? null,
    chartSummary: bundle?.chartSummary ?? null,
    todayGuidance,
    todayTransit,
    dailyGuidance: bundle?.dailyGuidance ?? null,
    dailyGuidanceRange: bundle?.dailyGuidanceRange ?? null,
    dasha: bundle?.dasha ?? null,
    dashaMaha: bundle?.dashaMaha ?? null,
    dashaAntar: bundle?.dashaAntar ?? [],
    transit: bundle?.transit ?? null,
    sani: bundle?.sani ?? null,
    peyarchiUpcoming: bundle?.peyarchiUpcoming ?? [],
    panchangam: bundle?.panchangam ?? null,
    panchangamTimings: bundle?.panchangamTimings ?? null,
    panchangamLocationLabel: bundle?.panchangamLocationLabel ?? null,
    panchangamTimezone: bundle?.panchangamTimezone ?? null,
    bundleSectionErrors: bundle?.sectionErrors ?? {},
    lifeAreas,
    ambientAlerts: ambientAlertsQuery.data ?? [],
    nakshatraCard: bundle?.nakshatraCard ?? nakshatraCardQuery.data ?? null,
    peyarchiReport: peyarchiReportQuery.data ?? null,
    weekAhead: bundle?.weekAhead ?? weekAheadQuery.data ?? null,
    dashaStory: dashaStoryQuery.data ?? null,
    journalCorrelations: journalCorrelationsQuery.data ?? null,
    predictions,
    predictionsLoading: predictionsManualLoading || lifeAreaInsightsQuery.isFetching,
    jadhagamReport,
    jadhagamReportLoading,
    busyPersonal: busyPersonalState || bundleQuery.isFetching,
    setBirthProfileId: updateBirthProfileId,
    birthProfileLookupDone,
    setChartId,
    setPredictionsLoading: setPredictionsManualLoading,
    setJadhagamReport,
    setLifeAreas: (nextLifeAreas: LifeAreasResponseData | null) => {
      setLifeAreasOverride(nextLifeAreas);
      if (!nextLifeAreas) setPredictionsOverride(null);
    },
    loadLatestBirthProfileForCurrentUser,
    refreshLifeAreasInsights,
    refreshPersonalBundle,
    loadJadhagamReport,
  };
}
