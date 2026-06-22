import { apiGet } from "./client";

export interface RelationshipBiText {
  ta: string;
  en: string;
}

export interface SynastryAspect {
  pair: string;
  aspect: string;
  orbDegrees: number;
  tone: string;
  note: RelationshipBiText;
}

export interface SynastryTimingIndicator {
  planet: string;
  description: RelationshipBiText;
}

export interface SynastryData {
  familyVaultId: string;
  memberId: string;
  score: number;
  label: string;
  harmonyNotes: RelationshipBiText[];
  tensionNotes: RelationshipBiText[];
  keyAspects: SynastryAspect[];
  summary: RelationshipBiText;
  timingIndicators: SynastryTimingIndicator[];
}

export function getRelationshipSynastry(
  memberId: string,
  familyVaultId: string
): Promise<{ success: boolean; data: SynastryData }> {
  const q = new URLSearchParams({ familyVaultId });
  return apiGet(`/relationships/${encodeURIComponent(memberId)}/synastry?${q}`);
}
