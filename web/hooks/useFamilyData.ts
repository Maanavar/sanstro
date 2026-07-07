"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { addDays } from "@/lib/format";
import { apiFetchJson, readErrorMessage, toQuery } from "@/lib/api";
import { STALE } from "@/lib/queryClient";
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
  FamilyCompositeTimelineData,
  FamilyMemberData,
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

type FamilyBundle = {
  detail: FamilyVaultDetailData | null;
  aggregate: FamilyAggregateData | null;
  composite: FamilyCompositeTimelineData | null;
  members: FamilyMemberData[];
};

const MEMBER_CHART_CONCURRENCY = 2;

const familyKeys = {
  vaults: (ownerUserId: string) => ["family", "vaults", ownerUserId] as const,
  bundle: (vaultId: string, date: string) => ["family", "bundle", vaultId, date] as const,
  memberCharts: (vaultId: string, date: string, members: FamilyAggregateMember[]) => [
    "family",
    "member-charts",
    vaultId,
    date,
    members.map((member) => `${member.familyMemberId}:${member.chartId}`).join("|"),
  ] as const,
  relationshipAlerts: (vaultId: string) => ["family", "relationship-alerts", vaultId] as const,
};

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

async function fetchVaults(ownerUserId: string): Promise<FamilyVaultListData> {
  const response = await apiFetchJson<ApiEnvelope<FamilyVaultListData>>(
    `/api/v1/family-vaults${toQuery({ ownerUserId, limit: 20, offset: 0 })}`,
  );
  return response.data;
}

async function fetchFamilyBundle(vaultId: string, date: string): Promise<FamilyBundle> {
  const [detailRes, aggregateRes, compositeRes, membersRes] = await Promise.all([
    apiFetchJson<ApiEnvelope<FamilyVaultDetailData>>(`/api/v1/family-vaults/${vaultId}`),
    apiFetchJson<ApiEnvelope<FamilyAggregateData>>(
      `/api/v1/family-vaults/${vaultId}/daily-aggregate${toQuery({ date })}`,
    ),
    apiFetchJson<ApiEnvelope<FamilyCompositeTimelineData>>(
      `/api/v1/family-vaults/${vaultId}/composite${toQuery({ from: date, to: addDays(date, 6) })}`,
    ),
    apiFetchJson<ApiEnvelope<{ familyVaultId: string; totalCount: number; items: FamilyMemberData[] }>>(
      `/api/v1/family-vaults/${vaultId}/members`,
    ),
  ]);

  return {
    detail: detailRes.data,
    aggregate: aggregateRes.data,
    composite: compositeRes.data,
    members: membersRes.data.items,
  };
}

async function loadMemberChart(member: FamilyAggregateMember, nextDate: string, signal: AbortSignal): Promise<MemberChart> {
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
    apiFetchJson<ApiEnvelope<ChartCalculateResponseData>>(`/api/v1/charts/${chartId}`, { signal }),
    apiFetchJson<ApiEnvelope<ChartSummaryData>>(
      `/api/v1/charts/${chartId}/summary${toQuery({ language: "ta-en" })}`,
      { signal },
    ),
    apiFetchJson<ApiEnvelope<DailyGuidanceData>>(
      `/api/v1/charts/${chartId}/daily-guidance${toQuery({ date: nextDate, language: "ta-en" })}`,
      { signal },
    ),
    apiFetchJson<ApiEnvelope<TransitSnapshotData>>(
      `/api/v1/charts/${chartId}/gochar/current${toQuery({ date: nextDate })}`,
      { signal },
    ),
    apiFetchJson<ApiEnvelope<SaniCycleData>>(
      `/api/v1/charts/${chartId}/sani-cycle${toQuery({ date: nextDate })}`,
      { signal },
    ),
    apiFetchJson<ApiEnvelope<PeyarchiEvent[]>>(
      `/api/v1/charts/${chartId}/peyarchi/upcoming${toQuery({ as_of: nextDate, window_days: 30 })}`,
      { signal },
    ),
    apiFetchJson<ApiEnvelope<ChartExplanationData>>(
      `/api/v1/charts/${chartId}/explanation${toQuery({ asOf: nextDate, peyarchiWindowDays: 700 })}`,
      { signal },
    ).catch((error) => {
      if (isAbortError(error)) throw error;
      return { data: null } as ApiEnvelope<ChartExplanationData | null>;
    }),
    apiFetchJson<ApiEnvelope<DashaTimelineResponseData>>(
      `/api/v1/charts/${chartId}/dasha${toQuery({ asOf: nextDate, level: "pratyantar" })}`,
      { signal },
    ),
    apiFetchJson<ApiEnvelope<DashaTimelineResponseData>>(
      `/api/v1/charts/${chartId}/dasha${toQuery({ asOf: nextDate, level: "maha" })}`,
      { signal },
    ),
    apiFetchJson<ApiEnvelope<DashaTimelineResponseData>>(
      `/api/v1/charts/${chartId}/dasha${toQuery({ asOf: nextDate, level: "antar" })}`,
      { signal },
    ),
    apiFetchJson<ApiEnvelope<WeekAheadData>>(
      `/api/v1/charts/${chartId}/week-ahead${toQuery({ weekStart: nextDate, language: "ta-en" })}`,
      { signal },
    ).catch((error) => {
      if (isAbortError(error)) throw error;
      return { data: null } as ApiEnvelope<WeekAheadData | null>;
    }),
  ]);

  const moonPlanet = chartRes.data.planets.find((p) => p.graha === "MOON");
  let nakshatraCard: NakshatraCardData | null = null;
  if (moonPlanet && moonPlanet.nakshatra >= 1 && moonPlanet.nakshatra <= 27) {
    nakshatraCard = await apiFetchJson<{ success: boolean; data: NakshatraCardData }>(
      `/api/v1/content/nakshatra/${moonPlanet.nakshatra}`,
      { signal },
    ).then((response) => response.data).catch((error) => {
      if (isAbortError(error)) throw error;
      return null;
    });
  }

  return {
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
  };
}

async function loadMemberChartsData(
  members: FamilyAggregateMember[],
  nextDate: string,
  signal: AbortSignal,
): Promise<{ charts: MemberChart[]; errors: string[] }> {
  const results = new Array<MemberChart | null>(members.length).fill(null);
  const errors: string[] = [];

  for (let start = 0; start < members.length; start += MEMBER_CHART_CONCURRENCY) {
    const chunk = members.slice(start, start + MEMBER_CHART_CONCURRENCY);
    const chunkResults = await Promise.all(
      chunk.map(async (member, offset) => {
        try {
          return {
            chart: await loadMemberChart(member, nextDate, signal),
            error: null,
            index: start + offset,
          };
        } catch (error) {
          if (isAbortError(error)) throw error;
          return {
            chart: null,
            error: `${member.displayName}: ${readErrorMessage(error)}`,
            index: start + offset,
          };
        }
      }),
    );

    chunkResults.forEach(({ chart, error, index }) => {
      results[index] = chart;
      if (error) errors.push(error);
    });
  }

  return {
    charts: results.filter((memberChart): memberChart is MemberChart => memberChart !== null),
    errors,
  };
}

export function useFamilyData({ ownerUserId, selectedDate, onStatus }: UseFamilyDataOptions) {
  const queryClient = useQueryClient();
  const [requestedOwnerUserId, setRequestedOwnerUserId] = useState("");
  const [selectedVaultId, setSelectedVaultId] = useState("");
  const effectiveOwnerUserId = requestedOwnerUserId || ownerUserId;

  function reportStatus(message: string) {
    onStatus?.(message);
  }

  const vaultsQuery = useQuery({
    queryKey: familyKeys.vaults(effectiveOwnerUserId),
    queryFn: () => fetchVaults(effectiveOwnerUserId),
    enabled: !!effectiveOwnerUserId,
    staleTime: STALE.session,
  });

  useEffect(() => {
    const items = vaultsQuery.data?.items ?? [];
    const next = items.find((item) => item.familyVaultId === selectedVaultId) ?? items[0];
    if (next && next.familyVaultId !== selectedVaultId) {
      setSelectedVaultId(next.familyVaultId);
    } else if (!next && selectedVaultId) {
      setSelectedVaultId("");
    }
  }, [selectedVaultId, vaultsQuery.data]);

  const familyBundleQuery = useQuery({
    queryKey: familyKeys.bundle(selectedVaultId, selectedDate),
    queryFn: () => fetchFamilyBundle(selectedVaultId, selectedDate),
    enabled: !!selectedVaultId,
    staleTime: STALE.today,
  });

  // "self" is a real, user-selectable relationshipToOwner value (dashboard-edit-member-modal.tsx's
  // dropdown) — someone can end up with a family-member row that IS themselves. Every member-picker
  // pill list across the app (Today/Life Areas/Transits/Plan, both Classic and Nova) already renders
  // a dedicated owner pill from birthDisplayName *and* separately maps over family.memberCharts, so a
  // self-tagged member duplicated the owner's own name in those pickers. Excluding it here (not from
  // familyAggregate.members) keeps it visible in the Family tab's own roster/edit/delete UI, which
  // reads familyAggregate.members directly — only the derived memberCharts used by pickers is filtered.
  const selfMemberIds = new Set(
    (familyBundleQuery.data?.members ?? [])
      .filter((fm) => fm.relationshipToOwner === "self")
      .map((fm) => fm.familyMemberId),
  );
  // The backend's daily-aggregate endpoint also injects a synthetic entry for the owner's own
  // personal profile (family_vault_service.py's _owner_aggregate_member) so family-score averaging
  // counts the owner alongside managed members. That synthetic entry isn't a real FamilyMember row
  // (family_member_id is null for it), so it's absent from familyBundleQuery.data.members and
  // selfMemberIds above never catches it — it duplicated the same owner-pill problem described
  // above. It's structurally distinguishable: the backend sets familyMemberId = birthProfileId for
  // it (both point at the owner's own birth_profile row), whereas real members always have two
  // separate ids (their family_member_id vs. their birth_profile_id).
  const members = (familyBundleQuery.data?.aggregate?.members ?? []).filter(
    (m) => !selfMemberIds.has(m.familyMemberId) && m.familyMemberId !== m.birthProfileId,
  );
  const memberChartsQuery = useQuery({
    queryKey: familyKeys.memberCharts(selectedVaultId, selectedDate, members),
    queryFn: async ({ signal }) => {
      if (members.length === 0) return [];
      const result = await loadMemberChartsData(members, selectedDate, signal);
      if (result.errors.length > 0) {
        reportStatus(`Some family charts failed to load: ${result.errors.join("; ")}`);
      }
      return result.charts;
    },
    enabled: !!selectedVaultId && members.length > 0,
    staleTime: STALE.today,
  });

  const relationshipAlertsQuery = useQuery({
    queryKey: familyKeys.relationshipAlerts(selectedVaultId),
    queryFn: async () => {
      const response = await apiFetchJson<{ success: boolean; data: { items: RelationshipAlertItem[] } }>(
        `/api/v1/relationships/alerts${toQuery({ familyVaultId: selectedVaultId })}`,
      );
      return response.data.items;
    },
    enabled: !!selectedVaultId,
    staleTime: STALE.today,
    retry: false,
  });

  async function loadVaults(nextOwnerUserId = ownerUserId) {
    if (!nextOwnerUserId) return;
    setRequestedOwnerUserId(nextOwnerUserId);
    try {
      const data = await queryClient.fetchQuery({
        queryKey: familyKeys.vaults(nextOwnerUserId),
        queryFn: () => fetchVaults(nextOwnerUserId),
        staleTime: STALE.session,
      });
      const next = data.items.find((item) => item.familyVaultId === selectedVaultId) ?? data.items[0];
      setSelectedVaultId(next?.familyVaultId ?? "");
    } catch (error) {
      reportStatus(readErrorMessage(error));
    }
  }

  async function refreshFamilyBundle(nextVaultId = selectedVaultId, nextDate = selectedDate) {
    if (!nextVaultId) return;
    if (nextVaultId !== selectedVaultId) setSelectedVaultId(nextVaultId);
    try {
      // staleTime: 0 (not STALE.today) — this is a user-triggered manual refresh, so it must
      // always hit the network. fetchQuery() treats cached data younger than staleTime as
      // fresh and returns it without calling queryFn, and the bundle is almost always still
      // "fresh" here (it was fetched when the tab opened) — so the button did nothing.
      await queryClient.fetchQuery({
        queryKey: familyKeys.bundle(nextVaultId, nextDate),
        queryFn: () => fetchFamilyBundle(nextVaultId, nextDate),
        staleTime: 0,
      });
      await queryClient.invalidateQueries({ queryKey: ["family", "member-charts", nextVaultId] });
      reportStatus("Family data refreshed.");
    } catch (error) {
      const message = readErrorMessage(error);
      if (message.startsWith("404:") || message.startsWith("403:")) {
        setSelectedVaultId("");
        await loadVaults(ownerUserId);
      } else {
        reportStatus(message);
      }
    }
  }

  async function loadRelationshipAlerts(vaultId = selectedVaultId) {
    if (!vaultId) return;
    if (vaultId !== selectedVaultId) setSelectedVaultId(vaultId);
    await queryClient.invalidateQueries({ queryKey: familyKeys.relationshipAlerts(vaultId) });
  }

  function updateFamilyBundle(partial: Partial<FamilyBundle>) {
    if (!selectedVaultId) return;
    queryClient.setQueryData<FamilyBundle>(familyKeys.bundle(selectedVaultId, selectedDate), (prev) => ({
      detail: partial.detail ?? prev?.detail ?? null,
      aggregate: partial.aggregate ?? prev?.aggregate ?? null,
      composite: partial.composite ?? prev?.composite ?? null,
      members: partial.members ?? prev?.members ?? [],
    }));
  }

  const bundle = familyBundleQuery.data;

  return {
    selectedVaultId,
    vaults: vaultsQuery.data?.items ?? ([] as FamilyVaultListItem[]),
    familyDetail: bundle?.detail ?? null,
    familyAggregate: bundle?.aggregate ?? null,
    familyComposite: bundle?.composite ?? null,
    familyMembers: bundle?.members ?? ([] as FamilyMemberData[]),
    memberCharts: memberChartsQuery.data ?? [],
    relationshipAlerts: relationshipAlertsQuery.data ?? [],
    relationshipAlertsLoading: relationshipAlertsQuery.isFetching,
    busyVaults: vaultsQuery.isFetching,
    busyFamily: familyBundleQuery.isFetching,
    busyMemberCharts: memberChartsQuery.isFetching,
    setSelectedVaultId,
    setFamilyDetail: (detail: FamilyVaultDetailData | null) => updateFamilyBundle({ detail }),
    setFamilyAggregate: (aggregate: FamilyAggregateData | null) => updateFamilyBundle({ aggregate }),
    setFamilyComposite: (composite: FamilyCompositeTimelineData | null) => updateFamilyBundle({ composite }),
    loadVaults,
    refreshFamilyBundle,
    loadRelationshipAlerts,
  };
}
