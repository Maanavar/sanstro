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

// ── Members ──────────────────────────────────────────────────────────────────
//
// `app/api/family_vaults.py` member CRUD. Web reached these with raw
// `apiFetchJson` (`dashboard-workspace-profile-forms.ts`); mobile had no member
// editing at all, which is where the per-member alert opt-in (audit F5) had to
// land, so the calls are wrappers now — one spelling of each path and payload
// for both clients.

/** `FamilyMemberData` — the read view of one member. */
export interface FamilyMember {
  familyMemberId: string;
  familyVaultId: string;
  ownerUserId: string;
  displayName: string;
  /** self | spouse | child | parent | sibling | grandparent | other */
  relationshipToOwner: string;
  memberWeight: number;
  genderForTraditionalRules: string;
  dateOfBirthLocal: string | null;
  isMinor: boolean;
  /** Opt-in to the evening family digest (audit F5). Off by default. */
  alertsEnabled: boolean;
  birthProfileId: string | null;
  maritalStatus: string | null;
  employmentType: string | null;
}

export interface FamilyMemberResponse {
  success: boolean;
  data: FamilyMember;
}

export interface FamilyMemberListResponse {
  success: boolean;
  data: {
    familyVaultId: string;
    totalCount: number;
    items: FamilyMember[];
  };
}

/**
 * PATCH body. Every field is optional and an omitted field means "leave
 * alone", so only what the user changed is sent.
 *
 * `currentPlace: ""` is the one exception: it is the sentinel that clears the
 * current location back to the birth place. The four `current*` fields move
 * together — a place without coordinates is not a location.
 */
export interface FamilyMemberPatch {
  displayName?: string;
  relationshipToOwner?: string;
  memberWeight?: number;
  genderForTraditionalRules?: string;
  alertsEnabled?: boolean;
  birthDateLocal?: string;
  birthTimeLocal?: string;
  birthPlace?: string;
  birthLatitude?: number;
  birthLongitude?: number;
  birthTimezone?: string;
  currentPlace?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  currentTimezone?: string;
  maritalStatus?: string;
  employmentType?: string;
  /** Recalculate the chart after a birth-field change. Defaults true server-side. */
  recalculate?: boolean;
}

/**
 * POST body for adding a member. Mirrors `FamilyMemberCreate`, which extends
 * `BirthProfileCreate` (app/schemas/birth_profiles.py) with `memberWeight`, so a
 * new member is a birth profile plus the vault membership facts in one call. The
 * server casts and calculates the chart; the four `current*` fields are optional
 * (the member's daily-timings location, defaulting to the birth place).
 */
export interface FamilyMemberCreatePayload {
  relationshipToOwner: string;
  displayName: string;
  birthDateLocal: string;
  birthTimeLocal?: string;
  birthPlace: string;
  birthLatitude: number;
  birthLongitude: number;
  birthTimezone: string;
  genderForTraditionalRules?: string | null;
  currentPlace?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  currentTimezone?: string;
  memberWeight?: number;
  calculateNow?: boolean;
}

/** `FamilyMemberCreateResult` — the created member plus its fresh chart. */
export interface FamilyMemberCreateResponse {
  success: boolean;
  data: {
    familyMemberId: string;
    familyVaultId: string;
    ownerUserId: string;
    displayName: string;
    relationshipToOwner: string;
    memberWeight: number;
    birthProfileId: string;
    chartId: string | null;
    calculationStatus: "pending" | "completed" | "failed";
    warnings: string[];
  };
}

export function addFamilyMember(
  vaultId: string,
  payload: FamilyMemberCreatePayload,
): Promise<FamilyMemberCreateResponse> {
  return getApiClient().post(
    `/family-vaults/${encodeURIComponent(vaultId)}/members`,
    payload,
  ) as Promise<FamilyMemberCreateResponse>;
}

export function listFamilyMembers(vaultId: string): Promise<FamilyMemberListResponse> {
  return getApiClient().get(
    `/family-vaults/${encodeURIComponent(vaultId)}/members`,
  ) as Promise<FamilyMemberListResponse>;
}

export function getFamilyMember(vaultId: string, memberId: string): Promise<FamilyMemberResponse> {
  return getApiClient().get(
    `/family-vaults/${encodeURIComponent(vaultId)}/members/${encodeURIComponent(memberId)}`,
  ) as Promise<FamilyMemberResponse>;
}

export function updateFamilyMember(
  vaultId: string,
  memberId: string,
  patch: FamilyMemberPatch,
): Promise<FamilyMemberResponse> {
  return getApiClient().patch(
    `/family-vaults/${encodeURIComponent(vaultId)}/members/${encodeURIComponent(memberId)}`,
    patch,
  ) as Promise<FamilyMemberResponse>;
}

export function deleteFamilyMember(vaultId: string, memberId: string): Promise<void> {
  return getApiClient().delete(
    `/family-vaults/${encodeURIComponent(vaultId)}/members/${encodeURIComponent(memberId)}`,
  );
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