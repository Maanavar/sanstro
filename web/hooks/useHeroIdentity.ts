"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { apiFetchJson } from "@/lib/api";
import { STALE } from "@/lib/queryClient";
import { readPersistedVaultId } from "@/lib/workspace-handoff";
import type { ApiEnvelope, BirthProfileSnapshot } from "@/lib/types";
import { calculateChart, fetchChartBundle, personalKeys } from "@/hooks/usePersonalData";
import { familyKeys, fetchVaults } from "@/hooks/useFamilyData";

/**
 * The sub-bar identity line (name · Moon rasi - nakshatra - lagna · sunrise ·
 * family) for the utility pages, which do not mount the workspace and so have
 * none of its data.
 *
 * Deliberately not usePersonalData/useFamilyData: those also start dasha,
 * journal, peyarchi and family-bundle loads that nothing here reads. This reads
 * only the four queries the line needs, under the workspace's own keys and
 * fetchers, so a reader arriving from the dashboard is answered from cache and
 * a cold arrival costs those four requests and no more.
 */
export function useHeroIdentity({ userId, date }: { userId: string; date: string }) {
  const profileQuery = useQuery({
    queryKey: personalKeys.latestBirthProfile,
    queryFn: () => apiFetchJson<ApiEnvelope<BirthProfileSnapshot>>("/api/v1/birth-profiles/me/latest"),
    enabled: !!userId,
    staleTime: STALE.session,
    // No profile yet is an answer (a new account), not a fault to retry.
    retry: false,
  });
  const birthProfileId = profileQuery.data?.data.birthProfileId ?? "";

  const chartQuery = useQuery({
    queryKey: personalKeys.chartCalculate(birthProfileId),
    queryFn: ({ signal }) => calculateChart(birthProfileId, signal),
    enabled: !!birthProfileId,
    staleTime: STALE.session,
  });
  const chart = chartQuery.data?.data ?? null;
  const chartId = chart?.chartId ?? "";

  const bundleQuery = useQuery({
    queryKey: personalKeys.chartBundle(chartId, date),
    queryFn: () => fetchChartBundle(chartId, date),
    enabled: !!chartId,
    staleTime: STALE.today,
  });
  const bundle = bundleQuery.data ?? null;

  const vaultsQuery = useQuery({
    queryKey: familyKeys.vaults(userId),
    queryFn: () => fetchVaults(userId),
    enabled: !!userId,
    staleTime: STALE.session,
  });

  // The family the workspace last showed, else the first — the same fallback
  // useFamilyData applies, so the chip names the family Today would.
  const [persistedVaultId, setPersistedVaultId] = useState<string | null>(null);
  useEffect(() => {
    setPersistedVaultId(readPersistedVaultId(userId));
  }, [userId]);
  const vaults = vaultsQuery.data?.items ?? [];
  const selectedVault = vaults.find((v) => v.familyVaultId === persistedVaultId) ?? vaults[0] ?? null;

  const birthProfile = chart?.birthProfile ?? profileQuery.data?.data ?? null;

  return {
    displayName: birthProfile?.displayName ?? "",
    birthTimeLocal: birthProfile?.birthTimeLocal ?? null,
    birthTimeConfidenceMinutes: birthProfile?.birthTimeConfidenceMinutes ?? null,
    chartSummary: bundle?.chartSummary ?? null,
    panchangamSunrise: bundle?.panchangam?.sunrise ?? null,
    panchangamPlace: bundle?.panchangamPlace ?? null,
    selectedVault,
  };
}
