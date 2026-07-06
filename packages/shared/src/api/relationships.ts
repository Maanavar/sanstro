import { getApiClient } from "./client";
import type { BiText } from "../types";

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