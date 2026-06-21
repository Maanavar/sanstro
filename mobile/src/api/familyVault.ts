import { apiGet, apiPost } from "./client";

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
  return apiGet("/family-vaults");
}

export function getFamilyVaultToday(vaultId: string): Promise<FamilyVaultTodayResponse> {
  return apiGet(`/family-vaults/${vaultId}/today`);
}

export function createFamilyVault(name: string): Promise<FamilyVaultCreateResponse> {
  return apiPost("/family-vaults", { name });
}
