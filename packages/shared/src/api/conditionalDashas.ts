import type * as Server from "../generated/api-types";
import { getApiClient } from "./client";

/**
 * Conditional Nakshatra Dashas — the seven Parashari *conditional* udu dashas
 * (Shodashottari 116y, Dwadashottari 112y, Panchottari 105y, Shatabdika 100y,
 * Chaturashiti-sama 84y, Dwisaptati-sama 72y, Shashtihayani 60y), each a
 * Vimshottari variant selected classically by a birth condition, plus an
 * informational applicability report.
 *
 * Tables anchored to a single cited source (satyori/Santhanam BPHS); see
 * app/calculations/conditional_dashas.py for the documented single-source
 * posture and the divergences flagged for the astrologer pass. Experimental /
 * display-only — not used in any scoring path; the applicability report never
 * auto-hides a system.
 *
 * Backend: GET /charts/{id}/conditional-dashas
 * (app/services/conditional_dashas_service.py).
 *
 * Types are the server's own (A14 step 7), generated from the response model.
 */
export type ConditionalDashaPeriod = Server.LordDashaPeriod;
export type ConditionalDashaSystem = Server.ConditionalDashaTimelineData;
/**
 * `applicable`: true = meets the classical condition, false = does not,
 * null = needs review (missing datum or a genuine judgement call).
 */
export type ConditionalDashaApplicabilityResult = Server.ConditionalDashaApplicabilityResult;
export type ConditionalDashasData = Server.ConditionalDashasData;

export const conditionalDashasKeys = {
  timeline: (chartId: string, asOf?: string) =>
    ["conditional-dashas", chartId, asOf ?? "current"] as const,
};

export function getConditionalDashas(
  chartId: string,
  asOf?: string,
): Promise<{ success: boolean; data: ConditionalDashasData }> {
  return getApiClient().get(
    `/charts/${encodeURIComponent(chartId)}/conditional-dashas`,
    asOf ? { asOf } : undefined,
  ) as Promise<{ success: boolean; data: ConditionalDashasData }>;
}
