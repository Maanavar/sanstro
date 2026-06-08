"use client";

import { useState } from "react";

import { addDays } from "@/lib/format";
import { apiFetchJson, readErrorMessage, toQuery } from "@/lib/api";
import type {
  ApiEnvelope,
  ChartCalculateResponseData,
  ChartExplanationData,
  ChartSummaryData,
  DailyGuidanceData,
  DashaTimelineItem,
  DashaTimelineResponseData,
  FamilyAggregateData,
  FamilyAggregateMember,
  FamilyCalendarData,
  FamilyVaultDetailData,
  FamilyVaultListData,
  FamilyVaultListItem,
  NakshatraCardData,
  PeyarchiEvent,
  RelationshipAlertItem,
  SaniCycleData,
  TransitSnapshotData,
  WeekAheadData,
} from "@/lib/types";

export type MemberChart = {
  memberId: string;
  displayName: string;
  chart: ChartCalculateResponseData;
  explanation: ChartExplanationData | null;
  summary: ChartSummaryData | null;
  transit: TransitSnapshotData | null;
  sani: SaniCycleData | null;
  peyarchiUpcoming: PeyarchiEvent[];
  dailyGuidance: DailyGuidanceData | null;
  weekAhead: WeekAheadData | null;
  dasha: DashaTimelineResponseData | null;
  dashaMaha: DashaTimelineResponseData | null;
  dashaAntar: DashaTimelineItem[];
  nakshatraCard: NakshatraCardData | null;
};

type UseFamilyDataOptions = {
  ownerUserId: string;
  selectedDate: string;
  onStatus?: (message: string) => void;
};

export function useFamilyData({ ownerUserId, selectedDate, onStatus }: UseFamilyDataOptions) {
  const [selectedVaultId, setSelectedVaultId] = useState("");
  const [vaults, setVaults] = useState<FamilyVaultListItem[]>([]);
  const [familyDetail, setFamilyDetail] = useState<FamilyVaultDetailData | null>(null);
  const [familyAggregate, setFamilyAggregate] = useState<FamilyAggregateData | null>(null);
  const [familyCalendar, setFamilyCalendar] = useState<FamilyCalendarData | null>(null);
  const [memberCharts, setMemberCharts] = useState<MemberChart[]>([]);
  const [relationshipAlerts, setRelationshipAlerts] = useState<RelationshipAlertItem[]>([]);
  const [relationshipAlertsLoading, setRelationshipAlertsLoading] = useState(false);

  const [busyVaults, setBusyVaults] = useState(false);
  const [busyFamily, setBusyFamily] = useState(false);
  const [busyMemberCharts, setBusyMemberCharts] = useState(false);

  function reportStatus(message: string) {
    if (onStatus) onStatus(message);
  }

  async function loadVaults(nextOwnerUserId = ownerUserId) {
    setBusyVaults(true);
    try {
      const response = await apiFetchJson<ApiEnvelope<FamilyVaultListData>>(
        `/api/v1/family-vaults${toQuery({ ownerUserId: nextOwnerUserId, limit: 20, offset: 0 })}`,
      );
      setVaults(response.data.items);
      const next =
        response.data.items.find((item) => item.familyVaultId === selectedVaultId) ??
        response.data.items[0];
      if (next && next.familyVaultId !== selectedVaultId) setSelectedVaultId(next.familyVaultId);
      if (!next) {
        setSelectedVaultId("");
        setFamilyDetail(null);
        setFamilyAggregate(null);
        setFamilyCalendar(null);
      }
    } catch (error) {
      reportStatus(readErrorMessage(error));
    } finally {
      setBusyVaults(false);
    }
  }

  async function loadMemberCharts(members: FamilyAggregateMember[], nextDate: string) {
    if (members.length === 0) {
      setMemberCharts([]);
      return;
    }
    setBusyMemberCharts(true);
    const results: MemberChart[] = [];
    const errors: string[] = [];

    await Promise.allSettled(
      members.map(async (member) => {
        try {
          const chartId = member.chartId;
          const [
            chartRes,
            summaryRes,
            dailyRes,
            transitRes,
            saniRes,
            peyarchiRes,
            explanationRes,
            dashaRes,
            dashaMahaRes,
            dashaAntarRes,
            weekAheadRes,
          ] = await Promise.all([
            apiFetchJson<ApiEnvelope<ChartCalculateResponseData>>("/api/v1/charts/calculate", {
              method: "POST",
              body: JSON.stringify({
                birthProfileId: member.birthProfileId,
                calculationVersion: "thirukanitham-2026-v1",
              }),
            }),
            apiFetchJson<ApiEnvelope<ChartSummaryData>>(
              `/api/v1/charts/${chartId}/summary${toQuery({ language: "ta-en" })}`,
            ),
            apiFetchJson<ApiEnvelope<DailyGuidanceData>>(
              `/api/v1/charts/${chartId}/daily-guidance${toQuery({ date: nextDate, language: "ta-en" })}`,
            ),
            apiFetchJson<ApiEnvelope<TransitSnapshotData>>(
              `/api/v1/charts/${chartId}/gochar/current${toQuery({ date: nextDate })}`,
            ),
            apiFetchJson<ApiEnvelope<SaniCycleData>>(
              `/api/v1/charts/${chartId}/sani-cycle${toQuery({ date: nextDate })}`,
            ),
            apiFetchJson<ApiEnvelope<PeyarchiEvent[]>>(
              `/api/v1/charts/${chartId}/peyarchi/upcoming${toQuery({ as_of: nextDate, window_days: 30 })}`,
            ),
            apiFetchJson<ApiEnvelope<ChartExplanationData>>(
              `/api/v1/charts/${chartId}/explanation${toQuery({ asOf: nextDate, peyarchiWindowDays: 700 })}`,
            ).catch(() => ({ data: null } as ApiEnvelope<ChartExplanationData | null>)),
            apiFetchJson<ApiEnvelope<DashaTimelineResponseData>>(
              `/api/v1/charts/${chartId}/dasha${toQuery({ asOf: nextDate, level: "pratyantar" })}`,
            ),
            apiFetchJson<ApiEnvelope<DashaTimelineResponseData>>(
              `/api/v1/charts/${chartId}/dasha${toQuery({ asOf: nextDate, level: "maha" })}`,
            ),
            apiFetchJson<ApiEnvelope<DashaTimelineResponseData>>(
              `/api/v1/charts/${chartId}/dasha${toQuery({ asOf: nextDate, level: "antar" })}`,
            ),
            apiFetchJson<ApiEnvelope<WeekAheadData>>(
              `/api/v1/charts/${chartId}/week-ahead${toQuery({ weekStart: nextDate, language: "ta-en" })}`,
            ).catch(() => ({ data: null } as ApiEnvelope<WeekAheadData | null>)),
          ]);

          const moonPlanet = chartRes.data.planets.find((p) => p.graha === "MOON");
          let nakshatraCard: NakshatraCardData | null = null;
          if (moonPlanet && moonPlanet.nakshatra >= 1 && moonPlanet.nakshatra <= 27) {
            nakshatraCard = await apiFetchJson<{ success: boolean; data: NakshatraCardData }>(
              `/api/v1/content/nakshatra/${moonPlanet.nakshatra}`,
            ).then((r) => r.data).catch(() => null);
          }

          results.push({
            memberId: member.familyMemberId,
            displayName: member.displayName,
            chart: chartRes.data,
            explanation: explanationRes.data,
            summary: summaryRes.data,
            transit: transitRes.data,
            sani: saniRes.data,
            peyarchiUpcoming: peyarchiRes.data,
            dailyGuidance: dailyRes.data,
            weekAhead: weekAheadRes.data,
            dasha: dashaRes.data,
            dashaMaha: dashaMahaRes.data,
            dashaAntar: dashaAntarRes.data.timeline,
            nakshatraCard,
          });
        } catch (error) {
          errors.push(`${member.displayName}: ${readErrorMessage(error)}`);
        }
      }),
    );

    setMemberCharts(results);
    if (errors.length > 0) {
      reportStatus(`Some family charts failed to load: ${errors.join("; ")}`);
    }
    setBusyMemberCharts(false);
  }

  async function refreshFamilyBundle(nextVaultId = selectedVaultId, nextDate = selectedDate) {
    if (!nextVaultId) return;
    setBusyFamily(true);
    try {
      const [detailRes, aggregateRes, calendarRes] = await Promise.all([
        apiFetchJson<ApiEnvelope<FamilyVaultDetailData>>(`/api/v1/family-vaults/${nextVaultId}`),
        apiFetchJson<ApiEnvelope<FamilyAggregateData>>(
          `/api/v1/family-vaults/${nextVaultId}/daily-aggregate${toQuery({ date: nextDate })}`,
        ),
        apiFetchJson<ApiEnvelope<FamilyCalendarData>>(
          `/api/v1/family-vaults/${nextVaultId}/calendar${toQuery({ from: nextDate, to: addDays(nextDate, 6) })}`,
        ),
      ]);
      setFamilyDetail(detailRes.data);
      setFamilyAggregate(aggregateRes.data);
      setFamilyCalendar(calendarRes.data);
      void loadMemberCharts(aggregateRes.data.members, nextDate);
      reportStatus("Family data refreshed.");
    } catch (error) {
      const message = readErrorMessage(error);
      if (message.startsWith("404:") || message.startsWith("403:")) {
        setSelectedVaultId("");
        setFamilyDetail(null);
        setFamilyAggregate(null);
        setFamilyCalendar(null);
        void loadVaults(ownerUserId);
      } else {
        reportStatus(message);
      }
    } finally {
      setBusyFamily(false);
    }
  }

  async function loadRelationshipAlerts(vaultId = selectedVaultId) {
    if (!vaultId) return;
    setRelationshipAlertsLoading(true);
    try {
      const response = await apiFetchJson<{ success: boolean; data: { items: RelationshipAlertItem[] } }>(
        `/api/v1/relationships/alerts${toQuery({ familyVaultId: vaultId })}`,
      );
      setRelationshipAlerts(response.data.items);
    } catch {
      // non-critical
    } finally {
      setRelationshipAlertsLoading(false);
    }
  }

  return {
    selectedVaultId,
    vaults,
    familyDetail,
    familyAggregate,
    familyCalendar,
    memberCharts,
    relationshipAlerts,
    relationshipAlertsLoading,
    busyVaults,
    busyFamily,
    busyMemberCharts,
    setSelectedVaultId,
    setFamilyDetail,
    setFamilyAggregate,
    setFamilyCalendar,
    loadVaults,
    refreshFamilyBundle,
    loadRelationshipAlerts,
  };
}
