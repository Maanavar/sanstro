"use client";

import { useRef, useState } from "react";

import { addDays, todayIso } from "@/lib/format";
import { apiFetchJson, readErrorMessage, toQuery } from "@/lib/api";
import type {
  AmbientAlertItem,
  ApiEnvelope,
  BirthProfileSnapshot,
  ChartCalculateResponseData,
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

export function usePersonalData({ selectedDate, onStatus }: UsePersonalDataOptions) {
  const todayDate = useRef(todayIso());

  const [birthProfileId, setBirthProfileId] = useState("");
  const [chartId, setChartId] = useState("");

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

  function reportStatus(message: string) {
    if (onStatus) onStatus(message);
  }

  async function loadLatestBirthProfileForCurrentUser(): Promise<BirthProfileSnapshot | null> {
    try {
      const response = await apiFetchJson<ApiEnvelope<BirthProfileSnapshot>>("/api/v1/birth-profiles/me/latest");
      const profile = response.data;
      setBirthProfileId(profile.birthProfileId);
      return profile;
    } catch {
      return null;
    }
  }

  async function refreshLifeAreasInsights(targetChartId: string, onDate: string) {
    if (!targetChartId) return;
    try {
      const predQuery = toQuery({ asOf: onDate });
      const [lifeAreasRes, marriage, career, wealth, health] = await Promise.all([
        apiFetchJson<ApiEnvelope<LifeAreasResponseData>>(
          `/api/v1/charts/${targetChartId}/life-areas${toQuery({ asOf: onDate })}`,
        ),
        apiFetchJson<LifeAreaPredictionResponse>(
          `/api/v1/charts/${targetChartId}/predictions/marriage${predQuery}`,
        ).catch(() => null),
        apiFetchJson<LifeAreaPredictionResponse>(
          `/api/v1/charts/${targetChartId}/predictions/career${predQuery}`,
        ).catch(() => null),
        apiFetchJson<LifeAreaPredictionResponse>(
          `/api/v1/charts/${targetChartId}/predictions/wealth${predQuery}`,
        ).catch(() => null),
        apiFetchJson<LifeAreaPredictionResponse>(
          `/api/v1/charts/${targetChartId}/predictions/health${predQuery}`,
        ).catch(() => null),
      ]);

      setLifeAreas(lifeAreasRes.data);
      setPredictions({
        marriage: marriage?.data ?? null,
        career: career?.data ?? null,
        wealth: wealth?.data ?? null,
        health: health?.data ?? null,
      });
    } catch (error) {
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

    setBusyPersonal(true);
    try {
      setChartSummary(null);
      setDailyGuidanceRange(null);
      setPanchangamTimings(null);
      setDashaAntar([]);

      const chartResponse = await apiFetchJson<ApiEnvelope<ChartCalculateResponseData>>("/api/v1/charts/calculate", {
        method: "POST",
        body: JSON.stringify({
          birthProfileId: nextBirthProfileId,
          calculationVersion: "thirukanitham-2026-v1",
        }),
      });

      setChart(chartResponse.data);
      setChartId(chartResponse.data.chartId);
      const chartPath = `/api/v1/charts/${chartResponse.data.chartId}`;
      const isToday = nextDate === todayDate.current;
      const { birthLatitude: lat, birthLongitude: lng, birthTimezone: tz } = chartResponse.data.birthProfile;

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
        panchangamRes,
        timingsRes,
        lifeAreasRes,
      ] = await Promise.all([
        apiFetchJson<ApiEnvelope<ChartSummaryData>>(`${chartPath}/summary${toQuery({ language: "ta-en" })}`),
        apiFetchJson<ApiEnvelope<DailyGuidanceData>>(`${chartPath}/daily-guidance${toQuery({ date: nextDate, language: "ta-en" })}`),
        apiFetchJson<ApiEnvelope<DailyGuidanceRangeData>>(
          `/api/v1/daily-guidance/range${toQuery({
            profileId: nextBirthProfileId,
            from: nextDate,
            to: addDays(nextDate, 2),
            language: "ta-en",
          })}`,
        ),
        apiFetchJson<ApiEnvelope<DashaTimelineResponseData>>(`${chartPath}/dasha${toQuery({ asOf: nextDate, level: "pratyantar" })}`),
        apiFetchJson<ApiEnvelope<DashaTimelineResponseData>>(`${chartPath}/dasha${toQuery({ asOf: nextDate, level: "maha" })}`),
        apiFetchJson<ApiEnvelope<DashaTimelineResponseData>>(`${chartPath}/dasha${toQuery({ asOf: nextDate, level: "antar" })}`),
        apiFetchJson<ApiEnvelope<TransitSnapshotData>>(`${chartPath}/gochar/current${toQuery({ date: nextDate })}`),
        apiFetchJson<ApiEnvelope<SaniCycleData>>(`${chartPath}/sani-cycle${toQuery({ date: nextDate })}`),
        apiFetchJson<ApiEnvelope<PeyarchiEvent[]>>(
          `${chartPath}/peyarchi/upcoming${toQuery({ as_of: nextDate, window_days: 30 })}`,
        ),
        apiFetchJson<ApiEnvelope<PanchangamDailyResponseData>>(
          `/api/v1/panchangam/daily${toQuery({ date: nextDate, lat, lng, timezone: tz })}`,
        ),
        apiFetchJson<ApiEnvelope<PanchangamTimingsData>>(
          `/api/v1/panchangam/timings${toQuery({ date: nextDate, lat, lng, timezone: tz })}`,
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

      apiFetchJson<{ success: boolean; data: { items: AmbientAlertItem[] } }>(
        `/api/v1/alerts/ambient?as_of_date=${nextDate}&min_significance=70&unread_only=false&limit=5`,
      )
        .then((response) => setAmbientAlerts(response.data.items))
        .catch(() => {});

      apiFetchJson<ApiEnvelope<WeekAheadData>>(
        `/api/v1/daily-guidance/week-ahead${toQuery({ profileId: nextBirthProfileId, weekStart: nextDate, language: "ta-en" })}`,
      )
        .then((response) => setWeekAhead(response.data))
        .catch(() => {});

      const moonPlanet = chartResponse.data.planets.find((planet) => planet.graha === "MOON");
      if (moonPlanet && moonPlanet.nakshatra >= 1 && moonPlanet.nakshatra <= 27) {
        apiFetchJson<{ success: boolean; data: NakshatraCardData }>(
          `/api/v1/content/nakshatra/${moonPlanet.nakshatra}`,
        )
          .then((response) => setNakshatraCard(response.data))
          .catch(() => {});
      }

      apiFetchJson<ApiEnvelope<DashaStoryData>>(
        `/api/v1/charts/${chartResponse.data.chartId}/dasha/timeline${toQuery({ asOf: nextDate })}`,
      )
        .then((response) => setDashaStory(response.data))
        .catch(() => {});

      if (peyarchiRes.data.length > 0) {
        const firstPlanet = peyarchiRes.data[0].planet;
        apiFetchJson<ApiEnvelope<PeyarchiReportData>>(
          `/api/v1/transits/peyarchi-report/${chartResponse.data.chartId}${toQuery({
            planet: firstPlanet,
            asOf: nextDate,
          })}`,
        )
          .then((response) => setPeyarchiReport(response.data))
          .catch(() => {});
      }

      apiFetchJson<ApiEnvelope<JournalCorrelationData>>(
        `/api/v1/journal/${chartResponse.data.chartId}/correlations${toQuery({ lookbackDays: 30 })}`,
      )
        .then((response) => setJournalCorrelations(response.data))
        .catch(() => {});

      const currentChartId = chartResponse.data.chartId;
      setPredictionsLoading(true);
      void refreshLifeAreasInsights(currentChartId, nextDate).finally(() => setPredictionsLoading(false));

      setJadhagamReport(null);
      setJadhagamReportLoading(false);
      reportStatus("Personal data refreshed.");
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
      reportStatus(message);
    } finally {
      setBusyPersonal(false);
    }
  }

  return {
    todayDate: todayDate.current,
    birthProfileId,
    chartId,
    chart,
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
    setBirthProfileId,
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

