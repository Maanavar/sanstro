"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { addDays, todayIso } from "@/lib/format";
import { apiFetchJson, readErrorMessage, toQuery } from "@/lib/api";
import { STALE } from "@/lib/queryClient";
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
  onStatus?: (message: string) => void;
};

type RefreshLifeAreasInsightsOptions = {
  preloadedLifeAreas?: LifeAreasResponseData | null;
  requestId?: number;
  signal?: AbortSignal;
};

type ChartBundle = {
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
  panchangamLocationLabel: string | null;
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

async function withFallback<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    if (isAbortError(error)) throw error;
    return fallback;
  }
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

async function fetchChartBundle(
  chart: ChartCalculateResponseData,
  birthProfileId: string,
  date: string,
  signal?: AbortSignal,
): Promise<ChartBundle> {
  const chartPath = `/api/v1/charts/${chart.chartId}`;
  const profile = chart.birthProfile;
  const hasCurrentLocation =
    profile.currentLatitude != null &&
    profile.currentLongitude != null &&
    !!profile.currentTimezone;
  const lat = hasCurrentLocation ? profile.currentLatitude : profile.birthLatitude;
  const lng = hasCurrentLocation ? profile.currentLongitude : profile.birthLongitude;
  const tz = hasCurrentLocation ? profile.currentTimezone : profile.birthTimezone;
  const hasPanchangamLocation =
    typeof lat === "number" &&
    Number.isFinite(lat) &&
    typeof lng === "number" &&
    Number.isFinite(lng) &&
    !!tz;
  const emptyPanchangam = { data: null } as ApiEnvelope<PanchangamDailyResponseData | null>;
  const emptyTimings = { data: null } as ApiEnvelope<PanchangamTimingsData | null>;

  const [
    summaryRes,
    daily,
    dailyRange,
    dashaRes,
    dashaMahaRes,
    dashaAntarRes,
    transitRes,
    saniRes,
    peyarchiRes,
    explanationRes,
    panchangamRes,
    timingsRes,
    lifeAreasRes,
  ] = await Promise.all([
    apiFetchJson<ApiEnvelope<ChartSummaryData>>(`${chartPath}/summary${toQuery({ language: "ta-en" })}`, { signal }),
    apiFetchJson<ApiEnvelope<DailyGuidanceData>>(`${chartPath}/daily-guidance${toQuery({ date, language: "ta-en" })}`, { signal }),
    apiFetchJson<ApiEnvelope<DailyGuidanceRangeData>>(
      `/api/v1/daily-guidance/range${toQuery({
        profileId: birthProfileId,
        from: date,
        to: addDays(date, 2),
        language: "ta-en",
      })}`,
      { signal },
    ),
    apiFetchJson<ApiEnvelope<DashaTimelineResponseData>>(`${chartPath}/dasha${toQuery({ asOf: date, level: "pratyantar" })}`, { signal }),
    apiFetchJson<ApiEnvelope<DashaTimelineResponseData>>(`${chartPath}/dasha${toQuery({ asOf: date, level: "maha" })}`, { signal }),
    apiFetchJson<ApiEnvelope<DashaTimelineResponseData>>(`${chartPath}/dasha${toQuery({ asOf: date, level: "antar" })}`, { signal }),
    apiFetchJson<ApiEnvelope<TransitSnapshotData>>(`${chartPath}/gochar/current${toQuery({ date })}`, { signal }),
    apiFetchJson<ApiEnvelope<SaniCycleData>>(`${chartPath}/sani-cycle${toQuery({ date })}`, { signal }),
    apiFetchJson<ApiEnvelope<PeyarchiEvent[]>>(
      `${chartPath}/peyarchi/upcoming${toQuery({ as_of: date, window_days: 30 })}`,
      { signal },
    ),
    withFallback(
      apiFetchJson<ApiEnvelope<ChartExplanationData>>(
        `${chartPath}/explanation${toQuery({ asOf: date, peyarchiWindowDays: 700 })}`,
        { signal },
      ),
      { data: null } as ApiEnvelope<ChartExplanationData | null>,
    ),
    hasPanchangamLocation
      ? withFallback(
          apiFetchJson<ApiEnvelope<PanchangamDailyResponseData>>(
            `/api/v1/panchangam/daily${toQuery({ date, lat, lng, timezone: tz })}`,
            { signal },
          ),
          emptyPanchangam,
        )
      : Promise.resolve(emptyPanchangam),
    hasPanchangamLocation
      ? withFallback(
          apiFetchJson<ApiEnvelope<PanchangamTimingsData>>(
            `/api/v1/panchangam/timings${toQuery({ date, lat, lng, timezone: tz })}`,
            { signal },
          ),
          emptyTimings,
        )
      : Promise.resolve(emptyTimings),
    apiFetchJson<ApiEnvelope<LifeAreasResponseData>>(`${chartPath}/life-areas${toQuery({ asOf: date })}`, { signal }),
  ]);

  return {
    chartSummary: summaryRes.data,
    chartExplanation: explanationRes.data,
    dailyGuidance: daily.data,
    dailyGuidanceRange: dailyRange.data,
    dasha: dashaRes.data,
    dashaMaha: dashaMahaRes.data,
    dashaAntar: dashaAntarRes.data.timeline,
    transit: transitRes.data,
    sani: saniRes.data,
    peyarchiUpcoming: peyarchiRes.data,
    panchangam: panchangamRes.data,
    panchangamTimings: timingsRes.data,
    lifeAreas: lifeAreasRes.data,
    panchangamLocationLabel: hasPanchangamLocation
      ? hasCurrentLocation ? "current location" : "birth location"
      : null,
  };
}

async function fetchLifeAreaInsights(
  chartId: string,
  date: string,
  preloadedLifeAreas?: LifeAreasResponseData | null,
  signal?: AbortSignal,
): Promise<LifeAreaInsights> {
  const predQuery = toQuery({ asOf: date });
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

export function usePersonalData({ selectedDate, onStatus }: UsePersonalDataOptions) {
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
    staleTime: STALE.today,
  });

  const chart = chartQuery.data?.data ?? null;
  const effectiveChartId = chartId || chart?.chartId || "";

  const bundleQuery = useQuery({
    queryKey: personalKeys.chartBundle(effectiveChartId, selectedDate),
    queryFn: ({ signal }) => fetchChartBundle(chart as ChartCalculateResponseData, birthProfileId, selectedDate, signal),
    enabled: !!chart && !!effectiveChartId && !!birthProfileId,
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

  const weekAheadQuery = useQuery({
    queryKey: personalKeys.weekAhead(birthProfileId, selectedDate),
    queryFn: async ({ signal }) => {
      const response = await apiFetchJson<ApiEnvelope<WeekAheadData>>(
        `/api/v1/daily-guidance/week-ahead${toQuery({ profileId: birthProfileId, weekStart: selectedDate, language: "ta-en" })}`,
        { signal },
      );
      return response.data;
    },
    enabled: !!birthProfileId,
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
    enabled: typeof moonNakshatra === "number" && moonNakshatra >= 1 && moonNakshatra <= 27,
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

  const lifeAreaInsightsQuery = useQuery({
    queryKey: personalKeys.lifeAreaInsights(effectiveChartId, selectedDate),
    queryFn: ({ signal }) => fetchLifeAreaInsights(effectiveChartId, selectedDate, bundle?.lifeAreas, signal),
    enabled: !!effectiveChartId,
    staleTime: STALE.today,
  });

  function reportStatus(message: string) {
    onStatus?.(message);
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
        staleTime: STALE.today,
      });
      if (!isPersonalRequestCurrent(requestId)) return;
      setLifeAreasOverride(insights.lifeAreas);
      setPredictionsOverride(insights.predictions);
    } catch (error) {
      if (isAbortError(error) || !isPersonalRequestCurrent(requestId)) return;
      reportStatus(readErrorMessage(error));
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
    nextChart: ChartCalculateResponseData,
    nextBirthProfileId: string,
    nextDate: string,
    nextBundle: ChartBundle,
  ) {
    const nextChartId = nextChart.chartId;
    const nextMoonNakshatra = nextChart.planets.find((planet) => planet.graha === "MOON")?.nakshatra ?? null;
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
        queryKey: personalKeys.weekAhead(nextBirthProfileId, nextDate),
        queryFn: async () => {
          const response = await apiFetchJson<ApiEnvelope<WeekAheadData>>(
            `/api/v1/daily-guidance/week-ahead${toQuery({ profileId: nextBirthProfileId, weekStart: nextDate, language: "ta-en" })}`,
          );
          return response.data;
        },
        staleTime: STALE.today,
      }),
      nextMoonNakshatra && nextMoonNakshatra >= 1 && nextMoonNakshatra <= 27
        ? queryClient.prefetchQuery({
            queryKey: personalKeys.nakshatraCard(nextMoonNakshatra),
            queryFn: async () => {
              const response = await apiFetchJson<{ success: boolean; data: NakshatraCardData }>(
                `/api/v1/content/nakshatra/${nextMoonNakshatra}`,
              );
              return response.data;
            },
            staleTime: STALE.static,
          })
        : Promise.resolve(),
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
      queryClient.prefetchQuery({
        queryKey: personalKeys.lifeAreaInsights(nextChartId, nextDate),
        queryFn: () => fetchLifeAreaInsights(nextChartId, nextDate, nextBundle.lifeAreas),
        staleTime: STALE.today,
      }),
    ]);
  }

  async function refreshPersonalBundle(
    nextBirthProfileId = birthProfileId,
    nextDate = selectedDate,
    allowRecovery = true,
  ) {
    if (!nextBirthProfileId) {
      if (allowRecovery) {
        const recovered = await loadLatestBirthProfileForCurrentUser();
        if (recovered) {
          await refreshPersonalBundle(recovered.birthProfileId, nextDate, false);
        }
      }
      return;
    }

    const requestId = beginPersonalRequest();
    setBusyPersonalState(true);
    try {
      const chartResponse = await queryClient.fetchQuery({
        queryKey: personalKeys.chartCalculate(nextBirthProfileId),
        queryFn: ({ signal }) => calculateChart(nextBirthProfileId, signal),
        staleTime: 0,
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
        queryFn: ({ signal }) => fetchChartBundle(chartResponse.data, nextBirthProfileId, nextDate, signal),
        staleTime: STALE.today,
      });
      if (!isPersonalRequestCurrent(requestId)) return;

      if (nextDate === todayDate.current || !todayGuidanceSnapshot) {
        setTodayGuidanceSnapshot(nextBundle.dailyGuidance);
      }
      if (nextDate === todayDate.current || !todayTransitSnapshot) {
        setTodayTransitSnapshot(nextBundle.transit);
      }

      void prefetchSecondaryQueries(chartResponse.data, nextBirthProfileId, nextDate, nextBundle);

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
          await refreshPersonalBundle(recovered.birthProfileId, nextDate, false);
          return;
        }
      }
      reportStatus(message);
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
    lifeAreas,
    ambientAlerts: ambientAlertsQuery.data ?? [],
    nakshatraCard: nakshatraCardQuery.data ?? null,
    peyarchiReport: peyarchiReportQuery.data ?? null,
    weekAhead: weekAheadQuery.data ?? null,
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