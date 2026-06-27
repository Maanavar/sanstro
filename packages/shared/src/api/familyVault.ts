import { getApiClient } from "./client";

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

function utcDateParam(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function getFamilyVaultToday(
  vaultId: string,
  dateLocal = utcDateParam(),
): Promise<FamilyVaultTodayResponse> {
  return getApiClient().get(
    `/family-vaults/${encodeURIComponent(vaultId)}/today`,
    { date: dateLocal },
  ) as Promise<FamilyVaultTodayResponse>;
}

export function createFamilyVault(name: string): Promise<FamilyVaultCreateResponse> {
  return getApiClient().post("/family-vaults", { name }) as Promise<FamilyVaultCreateResponse>;
}