import { getApiClient } from "./client";

export interface GoalData {
  goalId: string;
  chartId: string;
  goalType: string;
  description: string | null;
  isActive: boolean;
  languagePreference: string;
  createdAt: string;
}

export interface GoalListData {
  chartId: string;
  goals: GoalData[];
}

export interface CreateGoalPayload {
  chartId: string;
  goalType: string;
  description?: string;
  languagePreference?: string;
}

export const GOAL_TYPES = [
  { key: "career", labelEn: "Career", labelTa: "à®¤à¯Šà®´à®¿à®²à¯" },
  { key: "marriage", labelEn: "Marriage", labelTa: "à®¤à®¿à®°à¯à®®à®£à®®à¯" },
  { key: "education", labelEn: "Education", labelTa: "à®•à®²à¯à®µà®¿" },
  { key: "health", labelEn: "Health", labelTa: "à®‰à®Ÿà®²à¯ à®¨à®²à®®à¯" },
  { key: "wealth", labelEn: "Wealth", labelTa: "à®šà¯†à®²à¯à®µà®®à¯" },
  { key: "family", labelEn: "Family", labelTa: "à®•à¯à®Ÿà¯à®®à¯à®ªà®®à¯" },
  { key: "spiritual", labelEn: "Spiritual", labelTa: "à®†à®©à¯à®®à¯€à®•à®®à¯" },
  { key: "property", labelEn: "Property", labelTa: "à®šà¯Šà®¤à¯à®¤à¯" },
  { key: "travel", labelEn: "Travel", labelTa: "à®ªà®¯à®£à®®à¯" },
  { key: "general", labelEn: "General", labelTa: "à®ªà¯Šà®¤à¯" },
] as const;

export const goalsKeys = {
  list: (chartId: string, activeOnly: boolean) => ["goals", chartId, activeOnly] as const,
};

export function listGoals(
  chartId: string,
  activeOnly = true,
): Promise<{ success: boolean; data: GoalListData }> {
  return getApiClient().get(
    "/goals",
    { chartId, activeOnly },
  ) as Promise<{ success: boolean; data: GoalListData }>;
}

export function createGoal(
  payload: CreateGoalPayload,
): Promise<{ success: boolean; data: GoalData }> {
  return getApiClient().post("/goals", {
    chartId: payload.chartId,
    goalType: payload.goalType,
    description: payload.description ?? null,
    languagePreference: payload.languagePreference ?? "ta-en",
  }) as Promise<{ success: boolean; data: GoalData }>;
}

export function deactivateGoal(goalId: string): Promise<void> {
  return getApiClient().delete(`/goals/${goalId}`);
}