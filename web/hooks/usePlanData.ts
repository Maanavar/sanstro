"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetchJson, readErrorMessage, toQuery } from "@/lib/api";
import { STALE } from "@/lib/queryClient";
import type { ApiEnvelope, GoalData, GoalListData, WhatIfData } from "@/lib/types";

type UsePlanDataOptions = {
  chartId: string;
  onError?: (message: string) => void;
  onGoalAdded?: (goalType: string) => void;
  onGoalRemoved?: () => void;
};

const goalsKey = (chartId: string) => ["goals", chartId, true] as const;

async function fetchGoals(targetChartId: string): Promise<GoalData[]> {
  const response = await apiFetchJson<ApiEnvelope<GoalListData>>(
    `/api/v1/goals${toQuery({ chartId: targetChartId, activeOnly: true })}`,
  );
  return response.data.goals ?? [];
}

export function usePlanData({ chartId, onError, onGoalAdded, onGoalRemoved }: UsePlanDataOptions) {
  const queryClient = useQueryClient();
  const [addingGoalType, setAddingGoalType] = useState("");
  const [removingGoalId, setRemovingGoalId] = useState("");

  const [whatIfScenario, setWhatIfScenario] = useState("job_change");
  const [whatIfDate, setWhatIfDate] = useState("");

  function reportError(message: string) {
    onError?.(message);
  }

  const goalsQuery = useQuery({
    queryKey: goalsKey(chartId),
    queryFn: async () => {
      try {
        return await fetchGoals(chartId);
      } catch (error) {
        const msg = readErrorMessage(error);
        if (!msg.includes("404")) reportError(msg);
        return [];
      }
    },
    enabled: !!chartId,
    staleTime: STALE.today,
  });

  async function loadGoals(targetChartId = chartId) {
    if (!targetChartId) return;
    await queryClient.invalidateQueries({ queryKey: goalsKey(targetChartId) });
  }

  const addGoalMutation = useMutation({
    mutationFn: async (goalType: string) => {
      await apiFetchJson<ApiEnvelope<unknown>>("/api/v1/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chartId, goalType, languagePreference: "ta-en" }),
      });
      return goalType;
    },
    onMutate: (goalType) => {
      setAddingGoalType(goalType);
    },
    onSuccess: async (goalType) => {
      await queryClient.invalidateQueries({ queryKey: goalsKey(chartId) });
      onGoalAdded?.(goalType);
    },
    onError: (error) => {
      reportError(readErrorMessage(error));
    },
    onSettled: () => {
      setAddingGoalType("");
    },
  });

  const removeGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      await apiFetchJson<ApiEnvelope<unknown>>(`/api/v1/goals/${goalId}`, { method: "DELETE" });
      return goalId;
    },
    onMutate: (goalId) => {
      setRemovingGoalId(goalId);
    },
    onSuccess: async (goalId) => {
      queryClient.setQueryData<GoalData[]>(goalsKey(chartId), (prev) =>
        prev ? prev.filter((goal) => goal.goalId !== goalId) : prev,
      );
      await queryClient.invalidateQueries({ queryKey: goalsKey(chartId) });
      onGoalRemoved?.();
    },
    onError: (error) => {
      reportError(readErrorMessage(error));
    },
    onSettled: () => {
      setRemovingGoalId("");
    },
  });

  const whatIfMutation = useMutation({
    mutationFn: async () => {
      const response = await apiFetchJson<ApiEnvelope<WhatIfData>>("/api/v1/whatif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chartId, scenario: whatIfScenario, targetDate: whatIfDate }),
      });
      return response.data;
    },
    onError: (error) => {
      reportError(readErrorMessage(error));
    },
  });

  async function addGoal(goalType: string) {
    if (!chartId) return;
    await addGoalMutation.mutateAsync(goalType).catch(() => {});
  }

  async function removeGoal(goalId: string) {
    await removeGoalMutation.mutateAsync(goalId).catch(() => {});
  }

  async function runWhatIf() {
    if (!chartId || !whatIfDate) return;
    await whatIfMutation.mutateAsync().catch(() => {});
  }

  return {
    goals: goalsQuery.data ?? [],
    goalsBusy: goalsQuery.isFetching || addGoalMutation.isPending,
    addingGoalType,
    removingGoalId,
    whatIfScenario,
    whatIfDate,
    whatIfResult: whatIfMutation.data ?? null,
    whatIfBusy: whatIfMutation.isPending,
    whatIfError: whatIfMutation.error ? readErrorMessage(whatIfMutation.error) : "",
    setAddingGoalType,
    setWhatIfScenario,
    setWhatIfDate,
    addGoal,
    removeGoal,
    runWhatIf,
    loadGoals,
  };
}
