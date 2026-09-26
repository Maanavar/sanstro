import { getApiClient } from "./client";
import type { BiText } from "../types";

/**
 * GET /ask-vinaadi/daily-status — app/services/ask_vinaadi_usage_service.py
 * `get_daily_status`. That route has no response_model, so
 * tests/test_api_wrapper_field_contract.py cannot check this type: it declared
 * `questionsUsedToday` (a field of the *answer*, never of the status) until
 * 2026-09-26, which left mobile's limit bar permanently hidden. Keep in step by hand.
 */
export interface AskVinaadiDailyStatus {
  /** Questions spent — today for a daily allowance, this month for a monthly one. */
  chipsUsed: number;
  chipsRemaining: number | null;
  /** The subscription fact. */
  isPremium: boolean;
  /** Open beta: a spent allowance is a fair-use cap to wait out, not a paywall. */
  openBeta: boolean;
  /** Null for a monthly (premium) allowance. */
  dailyLimit: number | null;
  /** Null for a daily allowance. */
  monthlyLimit: number | null;
}

export type AskVinaadiVerdictKind = "GO" | "WAIT" | "CAUTION" | "MIXED";

/** A plain go/stay answer led before the reasoning, for decision/voice users
 *  (UX #6). Absent when the question was informational, not a decision. */
export interface AskVinaadiVerdict {
  kind: AskVinaadiVerdictKind;
  ta: string;
  en: string;
}

export interface AskVinaadiAnswer {
  question: string;
  answer: BiText;
  verdict?: AskVinaadiVerdict | null;
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
