"use client";

import { useEffect, useState } from "react";

import { apiFetchJson, readErrorMessage, toQuery } from "@/lib/api";
import type { ApiEnvelope, GoalData, GoalListData, WhatIfData } from "@/lib/types";

type UsePlanDataOptions = {
  chartId: string;
  onError?: (message: string) => void;
  onGoalAdded?: (goalType: string) => void;
  onGoalRemoved?: () => void;
};

export function usePlanData({ chartId, onError, onGoalAdded, onGoalRemoved }: UsePlanDataOptions) {
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [goalsBusy, setGoalsBusy] = useState(false);
  const [addingGoalType, setAddingGoalType] = useState("");
  const [removingGoalId, setRemovingGoalId] = useState("");

  const [whatIfScenario, setWhatIfScenario] = useState("job_change");
  const [whatIfDate, setWhatIfDate] = useState("");
  const [whatIfResult, setWhatIfResult] = useState<WhatIfData | null>(null);
  const [whatIfBusy, setWhatIfBusy] = useState(false);
  const [whatIfError, setWhatIfError] = useState("");

  function reportError(message: string) {
    if (onError) onError(message);
  }

  async function loadGoals(targetChartId = chartId) {
    if (!targetChartId) return;
    try {
      const response = await apiFetchJson<ApiEnvelope<GoalListData>>(
        `/api/v1/goals${toQuery({ chartId: targetChartId, activeOnly: true })}`,
      );
      setGoals(response.data.goals ?? []);
    } catch (error) {
      // Goals might not exist yet; only report actual errors
      const msg = readErrorMessage(error);
      if (!msg.includes("404")) reportError(msg);
      setGoals([]);
    }
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
      await loadGoals(chartId);
      onGoalAdded?.(goalType);
    } catch (error) {
      reportError(readErrorMessage(error));
    } finally {
      setGoalsBusy(false);
      setAddingGoalType("");
    }
  }

  async function removeGoal(goalId: string) {
    setRemovingGoalId(goalId);
    try {
      await apiFetchJson<ApiEnvelope<unknown>>(`/api/v1/goals/${goalId}`, { method: "DELETE" });
      setGoals((prev) => prev.filter((goal) => goal.goalId !== goalId));
      onGoalRemoved?.();
    } catch (error) {
      reportError(readErrorMessage(error));
    } finally {
      setRemovingGoalId("");
    }
  }

  async function runWhatIf() {
    if (!chartId || !whatIfDate) return;
    setWhatIfBusy(true);
    setWhatIfError("");
    setWhatIfResult(null);
    try {
      const response = await apiFetchJson<ApiEnvelope<WhatIfData>>("/api/v1/whatif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chartId, scenario: whatIfScenario, targetDate: whatIfDate }),
      });
      setWhatIfResult(response.data);
    } catch (error) {
      const message = readErrorMessage(error);
      setWhatIfError(message);
      reportError(message);
    } finally {
      setWhatIfBusy(false);
    }
  }

  useEffect(() => {
    if (!chartId) {
      setGoals([]);
      return;
    }
    void loadGoals(chartId);
  }, [chartId]);

  return {
    goals,
    goalsBusy,
    addingGoalType,
    removingGoalId,
    whatIfScenario,
    whatIfDate,
    whatIfResult,
    whatIfBusy,
    whatIfError,
    setAddingGoalType,
    setWhatIfScenario,
    setWhatIfDate,
    addGoal,
    removeGoal,
    runWhatIf,
    loadGoals,
  };
}

