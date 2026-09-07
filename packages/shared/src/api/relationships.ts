import { getApiClient } from "./client";
import type { BiText, CompatibilityIntelligenceData, DirectPoruthamData } from "../types";

export interface SynastryAspect {
  pair: string;
  aspect: string;
  orbDegrees: number;
  tone: string;
  note: BiText;
}

export interface SynastryTimingIndicator {
  planet: string;
  description: BiText;
}

export interface SynastryData {
  familyVaultId: string;
  memberId: string;
  score: number;
  label: string;
  harmonyNotes: BiText[];
  tensionNotes: BiText[];
  keyAspects: SynastryAspect[];
  summary: BiText;
  timingIndicators: SynastryTimingIndicator[];
}

export function getRelationshipSynastry(
  memberId: string,
  familyVaultId: string,
): Promise<{ success: boolean; data: SynastryData }> {
  return getApiClient().get(
    `/relationships/${encodeURIComponent(memberId)}/synastry`,
    { familyVaultId },
  ) as Promise<{ success: boolean; data: SynastryData }>;
}

export interface DirectSynastryData {
  chartIdA: string;
  chartIdB: string;
  score: number;
  label: string;
  harmonyNotes: BiText[];
  tensionNotes: BiText[];
  keyAspects: SynastryAspect[];
  summary: BiText;
  timingIndicators: SynastryTimingIndicator[];
}

/** General (non-marriage) synastry for any two charts the current user owns —
 * used for family-bond pairs where neither person is the vault owner. */
export function compareSynastry(
  chartIdA: string,
  chartIdB: string,
): Promise<{ success: boolean; data: DirectSynastryData }> {
  return getApiClient().post("/relationships/compare-synastry", {
    chartIdA,
    chartIdB,
  }) as Promise<{ success: boolean; data: DirectSynastryData }>;
}

/** Porutham for any two charts the current user owns, pinned to explicit chart
 * IDs. Every relationship surface (Porutham sub-tab, the Compatibility
 * Intelligence report, family bonds) should score the SAME two charts through
 * this path so a given pair shows one consistent number instead of diverging by
 * which "owner chart" each surface happened to resolve. Backend: POST
 * /relationships/compare. */
export function compareCharts(
  chartIdA: string,
  chartIdB: string,
  compatibilityContext = "GENERAL",
): Promise<{ success: boolean; data: DirectPoruthamData }> {
  return getApiClient().post("/relationships/compare", {
    chartIdA,
    chartIdB,
    compatibilityContext,
  }) as Promise<{ success: boolean; data: DirectPoruthamData }>;
}
export interface CompatibilityIntelligenceBirthInput {
  displayName?: string;
  birthDateLocal: string;
  birthTimeLocal?: string | null;
  birthPlace?: string;
  birthLatitude: number;
  birthLongitude: number;
  birthTimezone: string;
}

/** Full 8-level Compatibility Intelligence report for two people the signed-in
 * user typed in, neither of whom has to exist in a family vault.
 *
 * The `/relationships/{memberId}/compatibility-intelligence*` routes require
 * Person B to be a saved vault member, which made the depth of the report a
 * function of where the birth data was stored rather than of who was asking —
 * a signed-in user entering two people by hand in the Porutham tool got the
 * same shallow ten-porutham result as a logged-out visitor. Prefer the
 * member-scoped route when Person B *is* a saved member (it reads that
 * member's persisted chart and enforces the spouse/partner relationship
 * check); use this for every other pair. Backend: POST
 * /relationships/compatibility-intelligence/direct. */
export function compareCompatibilityIntelligence(
  personA: CompatibilityIntelligenceBirthInput,
  personB: CompatibilityIntelligenceBirthInput,
): Promise<{ success: boolean; data: CompatibilityIntelligenceData }> {
  return getApiClient().post("/relationships/compatibility-intelligence/direct", {
    personA,
    personB,
  }) as Promise<{ success: boolean; data: CompatibilityIntelligenceData }>;
}
