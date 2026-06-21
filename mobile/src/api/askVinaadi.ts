import { apiGet, apiPost } from "./client";

export interface AskVinaadiDailyStatus {
  questionsUsedToday: number;
  dailyLimit: number;
  chipsRemaining: number | null;
}

export interface AskVinaadiAnswer {
  question: string;
  answer: { ta: string; en: string };
  signalsUsed: string[];
  confidence: string;
  caveat: { ta: string; en: string } | null;
  questionsUsedToday: number;
  dailyLimit: number;
  chipsRemaining: number | null;
}

export interface AskVinaadiResponse {
  success: boolean;
  data: AskVinaadiAnswer;
}

export function getDailyStatus(): Promise<AskVinaadiDailyStatus> {
  return apiGet("/ask-vinaadi/daily-status");
}

export function askVinaadi(
  chartId: string,
  question: string,
  lang: string = "ta",
  isChipQuestion: boolean = false,
): Promise<AskVinaadiResponse> {
  return apiPost(`/charts/${chartId}/ask`, {
    question,
    lang,
    isChipQuestion,
  });
}
