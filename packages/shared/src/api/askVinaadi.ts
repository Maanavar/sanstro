import { getApiClient } from "./client";
import type { BiText } from "../types";

export interface AskVinaadiDailyStatus {
  questionsUsedToday: number;
  dailyLimit: number;
  chipsRemaining: number | null;
}

export interface AskVinaadiAnswer {
  question: string;
  answer: BiText;
  signalsUsed: string[];
  confidence: string;
  caveat: BiText | null;
  questionsUsedToday: number;
  dailyLimit: number;
  chipsRemaining: number | null;
}

export interface AskVinaadiResponse {
  success: boolean;
  data: AskVinaadiAnswer;
}

export function getDailyStatus(): Promise<AskVinaadiDailyStatus> {
  return getApiClient().get("/ask-vinaadi/daily-status") as Promise<AskVinaadiDailyStatus>;
}

export function askVinaadi(
  chartId: string,
  question: string,
  lang = "ta",
  isChipQuestion = false,
): Promise<AskVinaadiResponse> {
  return getApiClient().post(`/charts/${chartId}/ask`, {
    question,
    lang,
    isChipQuestion,
  }) as Promise<AskVinaadiResponse>;
}
