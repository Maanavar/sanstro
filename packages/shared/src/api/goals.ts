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
  { key: "career", labelEn: "Career", labelTa: "தொழில்" },
  { key: "marriage", labelEn: "Marriage", labelTa: "திருமணம்" },
  { key: "education", labelEn: "Education", labelTa: "கல்வி" },
  { key: "health", labelEn: "Health", labelTa: "உடல் நலம்" },
  { key: "wealth", labelEn: "Wealth", labelTa: "செல்வம்" },
  { key: "family", labelEn: "Family", labelTa: "குடும்பம்" },
  { key: "spiritual", labelEn: "Spiritual", labelTa: "ஆன்மீகம்" },
  { key: "property", labelEn: "Property", labelTa: "சொத்து" },
  { key: "travel", labelEn: "Travel", labelTa: "பயணம்" },
  { key: "general", labelEn: "General", labelTa: "பொது" },
] as const;

export const goalsKeys = {
  list: (chartId: string, activeOnly: boolean) => ["goals", chartId, activeOnly] as const,
};

export function listGoals(
  chartId: string,
  activeOnly = true,
): Promise<{ success: boolean; data: GoalListData }> {
  return getApiClient().get(
    `/goals?chartId=${encodeURIComponent(chartId)}&activeOnly=${activeOnly}`,
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
