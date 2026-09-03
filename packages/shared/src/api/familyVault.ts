import { getApiClient } from "./client";
import { todayIso } from "../utils/format";

export interface FamilyVaultListItem {
  familyVaultId: string;
  name: string;
  memberCount: number;
  latestAggregateDate: string | null;
}

export interface FamilyVaultListResponse {
  success: boolean;
  data: {
    items: FamilyVaultListItem[];
    totalCount: number;
    limit: number;
    offset: number;
  };
}

export interface FamilyMemberDayView {
  memberId: string;
  profileId: string;
  chartId: string;
  name: string;
  relationship: string;
  score: number;
  label: string;
  highlightTa: string;
  highlightEn: string;
  chandrashtama: boolean;
  saniCycleActive: boolean;
  saniCycleType: string | null;
  nallaNeramStart: string;
  rahuKalamStart: string;
  rahuKalamEnd: string;
}

export interface FamilyVaultTodayResponse {
  success: boolean;
  data: {
    vaultId: string;
    dateLocal: string;
    members: FamilyMemberDayView[];
  };
}

export interface FamilyVaultCreateResponse {
  success: boolean;
  data: { familyVaultId: string; name: string; memberCount: number };
}

export function listFamilyVaults(): Promise<FamilyVaultListResponse> {
  return getApiClient().get("/family-vaults") as Promise<FamilyVaultListResponse>;
}

export function getFamilyVaultToday(
  vaultId: string,
  dateLocal = todayIso(),
): Promise<FamilyVaultTodayResponse> {
  return getApiClient().get(
    `/family-vaults/${encodeURIComponent(vaultId)}/today`,
    { date: dateLocal },
  ) as Promise<FamilyVaultTodayResponse>;
}

export function createFamilyVault(name: string): Promise<FamilyVaultCreateResponse> {
  return getApiClient().post("/family-vaults", { name }) as Promise<FamilyVaultCreateResponse>;
}

export interface FamilyHarmonyRemedyItem {
  signal: "COMBUST_SHARED" | "NODE_FRICTION" | "RETROGRADE_LOAD" | "CHILD_WEAK_PLANET" | string;
  priority: number;
  planet: string | null;
  titleTa: string;
  titleEn: string;
  findingTa: string;
  findingEn: string;
  remedyTa: string;
  remedyEn: string;
  members: string[];
  day: string | null;
  templeTa: string | null;
  templeEn: string | null;
  mantraTa: string | null;
  daanamTa: string | null;
  daanamEn: string | null;
  tags: string[];
}

export interface FamilyHarmonyRemediesResponse {
  success: boolean;
  data: {
    familyVaultId: string;
    membersConsidered: string[];
    items: FamilyHarmonyRemedyItem[];
    disclaimer: Record<string, string>;
  };
}

export function getFamilyHarmonyRemedies(
  vaultId: string,
): Promise<FamilyHarmonyRemediesResponse> {
  return getApiClient().get(
    `/family-vaults/${encodeURIComponent(vaultId)}/harmony-remedies`,
  ) as Promise<FamilyHarmonyRemediesResponse>;
}