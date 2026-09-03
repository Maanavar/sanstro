import { getApiClient } from "./client";
import type { BiText, KutaResult, NadiDoshaResult } from "../types";

export interface PoruthamShareBirthInput {
  birthDateLocal: string;
  birthTimeLocal?: string | null;
  birthLatitude: number;
  birthLongitude: number;
  birthTimezone: string;
  birthPlace?: string;
}

export interface CreatePoruthamSharePayload {
  personA: PoruthamShareBirthInput;
  personB: PoruthamShareBirthInput;
  compatibilityContext?: "GENERAL" | "MARRIAGE" | "FRIENDSHIP" | "BUSINESS" | "FAMILY";
  labelA?: string | null;
  labelB?: string | null;
}

export interface CreatePoruthamShareData {
  shareId: string;
  token: string;
  url: string;
  expiresAt: string;
  labelA: string | null;
  labelB: string | null;
}

export interface PoruthamShareViewData {
  labelA: string | null;
  labelB: string | null;
  boyNakshatra: number;
  boyNakshatraName: string;
  girlNakshatra: number;
  girlNakshatraName: string;
  kutas: KutaResult[];
  totalScore: number;
  maxScore: number;
  percentage: number;
  label: string;
  rajjuDosha: boolean;
  vedhaDosha: boolean;
  nadiDosha: NadiDoshaResult;
  summary: BiText;
  compatibilityContext: string;
  contextNote: BiText | null;
  createdAt: string;
  expiresAt: string;
}

export interface RevokePoruthamShareData {
  shareId: string;
  revokedAt: string;
}

export function createPoruthamShare(
  payload: CreatePoruthamSharePayload,
): Promise<{ success: boolean; data: CreatePoruthamShareData }> {
  return getApiClient().post("/porutham-shares", payload) as Promise<{
    success: boolean;
    data: CreatePoruthamShareData;
  }>;
}

export function revokePoruthamShare(
  shareId: string,
): Promise<{ success: boolean; data: RevokePoruthamShareData }> {
  return getApiClient().post(`/porutham-shares/${encodeURIComponent(shareId)}/revoke`) as Promise<{
    success: boolean;
    data: RevokePoruthamShareData;
  }>;
}
