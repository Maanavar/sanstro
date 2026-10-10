import type * as Server from "../generated/api-types";
import { getApiClient } from "./client";
import type { BiText } from "../types";

/**
 * GET /ask-vinaadi/daily-status — app/services/ask_vinaadi_usage_service.py
 * `get_daily_status`. Until A14 (2026-10-08) that route had no response_model,
 * so tests/test_api_wrapper_field_contract.py could not check this type: it
 * declared `questionsUsedToday` (a field of the *answer*, never of the status)
 * until 2026-09-26, which left mobile's limit bar permanently hidden. The route
 * now declares `AskVinaadiDailyStatus` (app/schemas/ask_vinaadi.py), and this
 * type IS that model, generated (A14 step 7).
 *
 * - `chipsUsed`: questions spent — today for a daily allowance, this month for
 *   a monthly one. `chipsRemaining` is never null (both branches clamp at 0).
 * - `isPremium`: the subscription fact. `openBeta`: a spent allowance is a
 *   fair-use cap to wait out, not a paywall.
 * - `dailyLimit` is null for a monthly (premium) allowance; `monthlyLimit` is
 *   null for a daily one.
 */
export type AskVinaadiDailyStatus = Server.AskVinaadiDailyStatus;

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
