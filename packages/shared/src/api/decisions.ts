import { getApiClient } from "./client";
import type { BiText } from "../types";

export type DecisionPriority =
  | "career"
  | "family"
  | "health"
  | "relationship"
  | "education"
  | "money"
  | "spiritual";

export interface DecisionOption {
  label: string;
  description: string;
}

export interface DecisionBriefPayload {
  chartId: string;
  optionA: DecisionOption;
  optionB: DecisionOption;
  priority: DecisionPriority;
  targetDate: string;
}

export interface OptionAnalysis {
  label: string;
  score: number;
  alignmentNotes: string[];
  riskFactors: string[];
  optimalWindow: string | null;
}

export interface DecisionBriefData {
  chartId: string;
  targetDate: string;
  scenarioUsed: string;
  optionA: OptionAnalysis;
  optionB: OptionAnalysis;
  recommended: string;
  confidence: number;
  reasoning: BiText;
  caution: BiText | null;
}

export function getDecisionBrief(
  payload: DecisionBriefPayload,
): Promise<{ success: boolean; data: DecisionBriefData }> {
  return getApiClient().post("/decisions/brief", payload) as Promise<{
    success: boolean;
    data: DecisionBriefData;
  }>;
}
