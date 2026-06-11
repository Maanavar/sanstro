"use client";

import { useEffect, useRef, useState } from "react";

import { addDays, todayIso } from "@/lib/format";
import { apiFetchJson, readErrorMessage, toQuery } from "@/lib/api";
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

export function usePersonalData({ selectedDate, onStatus }: UsePersonalDataOptions) {
  const todayDate = useRef(todayIso());
  const personalRequestIdRef = useRef(0);
  const personalAbortRef = useRef<AbortController | null>(null);

  const [birthProfileId, setBirthProfileId] = useState("");
  const [birthProfileLookupDone, setBirthProfileLookupDone] = useState(false);
  const [chartId, setChartId] = useState("");

  const [chart, setChart] = useState<ChartCalculateResponseData | null>(null);
  const [chartExplanation, setChartExplanation] = useState<ChartExplanationData | null>(null);
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
  const [panchangamTimings, setPanchangamTimings] = useState<PanchangamTimingsData | null>(null);
  const [lifeAreas, setLifeAreas] = useState<LifeAreasResponseData | null>(null);

  const [ambientAlerts, setAmbientAlerts] = useState<AmbientAlertItem[]>([]);
  const [nakshatraCard, setNakshatraCard] = useState<NakshatraCardData | null>(null);
  const [peyarchiReport, setPeyarchiReport] = useState<PeyarchiReportData | null>(null);
  const [weekAhead, setWeekAhead] = useState<WeekAheadData | null>(null);
  const [dashaStory, setDashaStory] = useState<DashaStoryData | null>(null);
  const [journalCorrelations, setJournalCorrelations] = useState<JournalCorrelationData | null>(null);

  const [predictions, setPredictions] = useState<PredictionBundle>({
    marriage: null,
    career: null,
    wealth: null,
    health: null,
  });
  const [predictionsLoading, setPredictionsLoading] = useState(false);
  const [jadhagamReport, setJadhagamReport] = useState<JadhagamReportResponse["data"] | null>(null);
  const [jadhagamReportLoading, setJadhagamReportLoading] = useState(false);
  const [busyPersonal, setBusyPersonal] = useState(false);

  useEffect(() => () => {
    personalAbortRef.current?.abort();
  }, []);

  function reportStatus(message: string) {
    if (onStatus) onStatus(message);
  }

  function isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === "AbortError";
  }

  function beginPersonalRequest() {
    personalRequestIdRef.current += 1;
    personalAbortRef.current?.abort();
    const controller = new AbortController();
    personalAbortRef.current = controller;
    return { controller, requestId: personalRequestIdRef.current };
  }

  function isPersonalRequestCurrent(requestId: number) {
    return personalRequestIdRef.current === requestId;
  }

  async function withFallback<T>(promise: Promise<T>, fallback: T): Promise<T> {
    try {
      return await promise;
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }
      return fallback;
    }
  }

  function updateBirthProfileId(nextBirthProfileId: string) {
    setBirthProfileId(nextBirthProfileId);
    if (nextBirthProfileId) {
      setBirthProfileLookupDone(true);
    }
  }

  async function loadLatestBirthProfileForCurrentUser(): Promise<BirthProfileSnapshot | null> {
    try {
      const response = await apiFetchJson<ApiEnvelope<BirthProfileSnapshot>>("/api/v1/birth-profiles/me/latest");
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
      const predQuery = toQuery({ asOf: onDate });
      const lifeAreasPromise = options.preloadedLifeAreas === undefined
        ? apiFetchJson<ApiEnvelope<LifeAreasResponseData>>(
            `/api/v1/charts/${targetChartId}/life-areas${toQuery({ asOf: onDate })}`,
            { signal: options.signal },
          )
        : Promise.resolve({
            data: options.preloadedLifeAreas,
          } as ApiEnvelope<LifeAreasResponseData | null>);
      const [lifeAreasRes, marriage, career, wealth, health] = await Promise.all([
        lifeAreasPromise,
        apiFetchJson<LifeAreaPredictionResponse>(
          `/api/v1/charts/${targetChartId}/predictions/marriage${predQuery}`,
          { signal: options.signal },
        ).catch((error) => {
          if (isAbortError(error)) throw error;
          return null;
        }),
        apiFetchJson<LifeAreaPredictionResponse>(
          `/api/v1/charts/${targetChartId}/predictions/career${predQuery}`,
          { signal: options.signal },
        ).catch((error) => {
          if (isAbortError(error)) throw error;
          return null;
        }),
        apiFetchJson<LifeAreaPredictionResponse>(
          `/api/v1/charts/${targetChartId}/predictions/wealth${predQuery}`,
          { signal: options.signal },
        ).catch((error) => {
          if (isAbortError(error)) throw error;
          return null;
        }),
        apiFetchJson<LifeAreaPredictionResponse>(
          `/api/v1/charts/${targetChartId}/predictions/health${predQuery}`,
          { signal: options.signal },
        ).catch((error) => {
          if (isAbortError(error)) throw error;
          return null;
        }),
      ]);

      if (!isPersonalRequestCurrent(requestId)) {
        return;
      }
      if (lifeAreasRes.data) {
        setLifeAreas(lifeAreasRes.data);
      }
      setPredictions({
        marriage: marriage?.data ?? null,
        career: career?.data ?? null,
        wealth: wealth?.data ?? null,
        health: health?.data ?? null,
      });
    } catch (error) {
      if (isAbortError(error) || !isPersonalRequestCurrent(requestId)) {
        return;
      }
      reportStatus(readErrorMessage(error));
    }
  }

  async function loadJadhagamReport(targetChartId: string): Promise<void> {
    if (!targetChartId || jadhagamReportLoading) return;
    setJadhagamReportLoading(true);
    try {
      const response = await apiFetchJson<JadhagamReportResponse>(
        `/api/v1/charts/${targetChartId}/jadhagam-report`,
      );
      setJadhagamReport(response.data);
    } finally {
      setJadhagamReportLoading(false);
    }
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

    const { controller, requestId } = beginPersonalRequest();
    setBusyPersonal(true);
    try {
      setChartSummary(null);
      setChartExplanation(null);
      setDailyGuidanceRange(null);
      setPanchangamTimings(null);
      setDashaAntar([]);

      const chartResponse = await apiFetchJson<ApiEnvelope<ChartCalculateResponseData>>("/api/v1/charts/calculate", {
        method: "POST",
        body: JSON.stringify({
          birthProfileId: nextBirthProfileId,
          calculationVersion: "thirukanitham-2026-v1",
        }),
        signal: controller.signal,
      });
      if (!isPersonalRequestCurrent(requestId)) {
        return;
      }

      setChart(chartResponse.data);
      setChartId(chartResponse.data.chartId);
      const chartPath = `/api/v1/charts/${chartResponse.data.chartId}`;
      const isToday = nextDate === todayDate.current;
      const profile = chartResponse.data.birthProfile;
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
      const panchangamLocationLabel = hasCurrentLocation ? "current location" : "birth location";
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
        apiFetchJson<ApiEnvelope<ChartSummaryData>>(`${chartPath}/summary${toQuery({ language: "ta-en" })}`, { signal: controller.signal }),
        apiFetchJson<ApiEnvelope<DailyGuidanceData>>(`${chartPath}/daily-guidance${toQuery({ date: nextDate, language: "ta-en" })}`, { signal: controller.signal }),
        apiFetchJson<ApiEnvelope<DailyGuidanceRangeData>>(
          `/api/v1/daily-guidance/range${toQuery({
            profileId: nextBirthProfileId,
            from: nextDate,
            to: addDays(nextDate, 2),
            language: "ta-en",
          })}`,
          { signal: controller.signal },
        ),
        apiFetchJson<ApiEnvelope<DashaTimelineResponseData>>(`${chartPath}/dasha${toQuery({ asOf: nextDate, level: "pratyantar" })}`, { signal: controller.signal }),
        apiFetchJson<ApiEnvelope<DashaTimelineResponseData>>(`${chartPath}/dasha${toQuery({ asOf: nextDate, level: "maha" })}`, { signal: controller.signal }),
        apiFetchJson<ApiEnvelope<DashaTimelineResponseData>>(`${chartPath}/dasha${toQuery({ asOf: nextDate, level: "antar" })}`, { signal: controller.signal }),
        apiFetchJson<ApiEnvelope<TransitSnapshotData>>(`${chartPath}/gochar/current${toQuery({ date: nextDate })}`, { signal: controller.signal }),
        apiFetchJson<ApiEnvelope<SaniCycleData>>(`${chartPath}/sani-cycle${toQuery({ date: nextDate })}`, { signal: controller.signal }),
        apiFetchJson<ApiEnvelope<PeyarchiEvent[]>>(
          `${chartPath}/peyarchi/upcoming${toQuery({ as_of: nextDate, window_days: 30 })}`,
          { signal: controller.signal },
        ),
        withFallback(apiFetchJson<ApiEnvelope<ChartExplanationData>>(
          `${chartPath}/explanation${toQuery({ asOf: nextDate, peyarchiWindowDays: 700 })}`,
          { signal: controller.signal },
        ), { data: null } as ApiEnvelope<ChartExplanationData | null>),
        hasPanchangamLocation
          ? withFallback(apiFetchJson<ApiEnvelope<PanchangamDailyResponseData>>(
              `/api/v1/panchangam/daily${toQuery({ date: nextDate, lat, lng, timezone: tz })}`,
              { signal: controller.signal },
            ), emptyPanchangam)
          : Promise.resolve(emptyPanchangam),
        hasPanchangamLocation
          ? withFallback(apiFetchJson<ApiEnvelope<PanchangamTimingsData>>(
              `/api/v1/panchangam/timings${toQuery({ date: nextDate, lat, lng, timezone: tz })}`,
              { signal: controller.signal },
            ), emptyTimings)
          : Promise.resolve(emptyTimings),
        apiFetchJson<ApiEnvelope<LifeAreasResponseData>>(`${chartPath}/life-areas${toQuery({ asOf: nextDate })}`, { signal: controller.signal }),
      ]);
      if (!isPersonalRequestCurrent(requestId)) {
        return;
      }

      setChartSummary(summaryRes.data);
      setChartExplanation(explanationRes.data);
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

      apiFetchJson<{ success: boolean; data: { items: AmbientAlertItem[] } }>(
        `/api/v1/alerts/ambient?as_of_date=${nextDate}&min_significance=70&unread_only=false&limit=5`,
        { signal: controller.signal },
      )
        .then((response) => {
          if (isPersonalRequestCurrent(requestId)) {
            setAmbientAlerts(response.data.items);
          }
        })
        .catch(() => {});

      apiFetchJson<ApiEnvelope<WeekAheadData>>(
        `/api/v1/daily-guidance/week-ahead${toQuery({ profileId: nextBirthProfileId, weekStart: nextDate, language: "ta-en" })}`,
        { signal: controller.signal },
      )
        .then((response) => {
          if (isPersonalRequestCurrent(requestId)) {
            setWeekAhead(response.data);
          }
        })
        .catch(() => {});

      const moonPlanet = chartResponse.data.planets.find((planet) => planet.graha === "MOON");
      if (moonPlanet && moonPlanet.nakshatra >= 1 && moonPlanet.nakshatra <= 27) {
        apiFetchJson<{ success: boolean; data: NakshatraCardData }>(
          `/api/v1/content/nakshatra/${moonPlanet.nakshatra}`,
          { signal: controller.signal },
        )
          .then((response) => {
            if (isPersonalRequestCurrent(requestId)) {
              setNakshatraCard(response.data);
            }
          })
          .catch(() => {});
      }

      apiFetchJson<ApiEnvelope<DashaStoryData>>(
        `/api/v1/charts/${chartResponse.data.chartId}/dasha/timeline${toQuery({ asOf: nextDate })}`,
        { signal: controller.signal },
      )
        .then((response) => {
          if (isPersonalRequestCurrent(requestId)) {
            setDashaStory(response.data);
          }
        })
        .catch(() => {});

      if (peyarchiRes.data.length > 0) {
        const firstPlanet = peyarchiRes.data[0].planet;
        apiFetchJson<ApiEnvelope<PeyarchiReportData>>(
          `/api/v1/transits/peyarchi-report/${chartResponse.data.chartId}${toQuery({
            planet: firstPlanet,
            asOf: nextDate,
          })}`,
          { signal: controller.signal },
        )
          .then((response) => {
            if (isPersonalRequestCurrent(requestId)) {
              setPeyarchiReport(response.data);
            }
          })
          .catch(() => {
            if (isPersonalRequestCurrent(requestId)) {
              setPeyarchiReport(null);
            }
          });
      } else if (isPersonalRequestCurrent(requestId)) {
        setPeyarchiReport(null);
      }

      apiFetchJson<ApiEnvelope<JournalCorrelationData>>(
        `/api/v1/journal/${chartResponse.data.chartId}/correlations${toQuery({ lookbackDays: 30 })}`,
        { signal: controller.signal },
      )
        .then((response) => {
          if (isPersonalRequestCurrent(requestId)) {
            setJournalCorrelations(response.data);
          }
        })
        .catch(() => {});

      setPredictionsLoading(true);
      void refreshLifeAreasInsights(chartResponse.data.chartId, nextDate, {
        preloadedLifeAreas: lifeAreasRes.data,
        requestId,
        signal: controller.signal,
      }).finally(() => {
        if (isPersonalRequestCurrent(requestId)) {
          setPredictionsLoading(false);
        }
      });

      setJadhagamReport(null);
      setJadhagamReportLoading(false);
      reportStatus(
        hasPanchangamLocation
          ? `Personal data refreshed. Panchangam uses ${panchangamLocationLabel}.`
          : "Personal data refreshed. Panchangam needs a saved birth or current location.",
      );
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }
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
      if (personalAbortRef.current === controller) {
        personalAbortRef.current = null;
      }
      if (isPersonalRequestCurrent(requestId)) {
        setBusyPersonal(false);
      }
    }
  }

  return {
    todayDate: todayDate.current,
    birthProfileId,
    chartId,
    chart,
    chartExplanation,
    chartSummary,
    todayGuidance,
    todayTransit,
    dailyGuidance,
    dailyGuidanceRange,
    dasha,
    dashaMaha,
    dashaAntar,
    transit,
    sani,
    peyarchiUpcoming,
    panchangam,
    panchangamTimings,
    lifeAreas,
    ambientAlerts,
    nakshatraCard,
    peyarchiReport,
    weekAhead,
    dashaStory,
    journalCorrelations,
    predictions,
    predictionsLoading,
    jadhagamReport,
    jadhagamReportLoading,
    busyPersonal,
    setBirthProfileId: updateBirthProfileId,
    birthProfileLookupDone,
    setChartId,
    setPredictionsLoading,
    setJadhagamReport,
    setLifeAreas,
    loadLatestBirthProfileForCurrentUser,
    refreshLifeAreasInsights,
    refreshPersonalBundle,
    loadJadhagamReport,
  };
}

