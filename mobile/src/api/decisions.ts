import { apiPost } from "./client";

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
  reasoning: { ta: string; en: string };
  caution: { ta: string; en: string } | null;
}

export function getDecisionBrief(
  payload: DecisionBriefPayload
): Promise<{ success: boolean; data: DecisionBriefData }> {
  return apiPost("/decisions/brief", payload);
}
