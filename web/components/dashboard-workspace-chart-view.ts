import type { MemberChart } from "@/hooks/useFamilyData";
import type { FamilyAggregateData, FamilyMemberData } from "@/lib/types";
import type { NumerologyMemberOption } from "./dashboard-numerology-panel-nova";
import type { PoruthamFamilyMember } from "./dashboard-tools-porutham-nova";

// Pure derivations of which chart each view reads; a `null` view id is the reader's own chart.

export function memberChartFor(memberCharts: readonly MemberChart[], viewId: string | null): MemberChart | null {
  if (!viewId) return null;
  return memberCharts.find((mc) => mc.memberId === viewId) ?? null;
}

/** Falls back to the reader's own chart while the member's chart has not loaded. */
export function chartIdFor(memberCharts: readonly MemberChart[], viewId: string | null, ownChartId: string): string {
  if (!viewId) return ownChartId;
  const member = memberCharts.find((mc) => mc.memberId === viewId);
  return member?.chart.chartId ?? ownChartId;
}

/** Life focus D4 (owner ruling Q2): a family member's chart gets the neutral order. */
export function isOwnChart(familyMembers: readonly FamilyMemberData[], viewId: string | null): boolean {
  return !viewId || familyMembers.find((f) => f.familyMemberId === viewId)?.relationshipToOwner === "self";
}

/**
 * One person must not show two "today" scores on one screen, so the owner row
 * takes the live score. Matched on birth-profile id: `memberCharts` excludes the owner row.
 */
export function reconcileOwnerScore(
  aggregate: FamilyAggregateData | null,
  ownerBirthProfileId: string | undefined,
  ownScore: number | null | undefined,
): FamilyAggregateData | null {
  if (!aggregate) return aggregate;
  return {
    ...aggregate,
    members: aggregate.members.map((m) =>
      ownerBirthProfileId !== undefined && m.birthProfileId === ownerBirthProfileId && ownScore != null
        ? { ...m, individualScore: ownScore }
        : m,
    ),
  };
}

export type OwnReading = {
  birthProfileId: string;
  chart: MemberChart["chart"] | null;
  chartExplanation: MemberChart["explanation"];
  chartSummary: MemberChart["summary"];
} & Pick<
  MemberChart,
  "transit" | "sani" | "peyarchiUpcoming" | "dailyGuidance" | "weekAhead" | "dasha" | "dashaMaha" | "dashaAntar" | "nakshatraCard"
>;

/** The reader's own reading in `MemberChart` shape, for the aggregate's owner row. */
export function ownerAsMemberChart(own: OwnReading): MemberChart | null {
  if (!own.chart) return null;
  return {
    memberId: own.birthProfileId,
    displayName: own.chart.birthProfile.displayName,
    chart: own.chart,
    explanation: own.chartExplanation,
    summary: own.chartSummary,
    transit: own.transit,
    sani: own.sani,
    peyarchiUpcoming: own.peyarchiUpcoming,
    dailyGuidance: own.dailyGuidance,
    weekAhead: own.weekAhead,
    dasha: own.dasha,
    dashaMaha: own.dashaMaha,
    dashaAntar: own.dashaAntar,
    nakshatraCard: own.nakshatraCard,
  };
}

export function memberPickerOptions(memberCharts: readonly MemberChart[]): { memberId: string; displayName: string }[] {
  return memberCharts.map((mc) => ({ memberId: mc.memberId, displayName: mc.displayName }));
}

/** Compatibility's picker: member charts joined with their vault relationship. */
export function synastryMemberOptions(
  memberCharts: readonly MemberChart[],
  familyMembers: readonly FamilyMemberData[],
): { memberId: string; displayName: string; relationshipToOwner: string }[] {
  return memberCharts.map((mc) => {
    const fm = familyMembers.find((f) => f.familyMemberId === mc.memberId);
    return { memberId: mc.memberId, displayName: mc.displayName, relationshipToOwner: fm?.relationshipToOwner ?? "other" };
  });
}

export function numerologyMembers(memberCharts: readonly MemberChart[]): NumerologyMemberOption[] {
  return memberCharts.map((mc) => ({ memberId: mc.memberId, displayName: mc.displayName, chartId: mc.chart.chartId }));
}

/** Porutham's candidates: the reader first (when charted), then every member who is not the reader. */
export function poruthamCandidates(
  ownChart: MemberChart["chart"] | null,
  memberCharts: readonly MemberChart[],
): PoruthamFamilyMember[] {
  return [
    ...(ownChart ? [{
      memberId: `owner:${ownChart.birthProfile.birthProfileId}`,
      displayName: ownChart.birthProfile.displayName,
      birthDateLocal: ownChart.birthProfile.birthDateLocal,
      birthTimeLocal: ownChart.birthProfile.birthTimeLocal ?? "",
      birthPlace: ownChart.birthProfile.birthPlace,
      birthLatitude: ownChart.birthProfile.birthLatitude,
      birthLongitude: ownChart.birthProfile.birthLongitude,
      birthTimezone: ownChart.birthProfile.birthTimezone,
    }] : []),
    ...memberCharts
      .filter((mc) => mc.chart.birthProfile.birthProfileId !== ownChart?.birthProfile.birthProfileId)
      .map((mc) => ({
        memberId: mc.memberId,
        displayName: mc.displayName,
        birthDateLocal: mc.chart.birthProfile.birthDateLocal,
        birthTimeLocal: mc.chart.birthProfile.birthTimeLocal ?? "",
        birthPlace: mc.chart.birthProfile.birthPlace,
        birthLatitude: mc.chart.birthProfile.birthLatitude,
        birthLongitude: mc.chart.birthProfile.birthLongitude,
        birthTimezone: mc.chart.birthProfile.birthTimezone,
      })),
  ];
}

/** A spouse, parent or grandparent is married by definition; other members are not asserted. */
export function maritalStatusFor(
  memberCharts: readonly MemberChart[],
  viewId: string | null,
  ownMaritalStatus: string,
): string | undefined {
  if (!viewId) return ownMaritalStatus || undefined;
  const mc = memberCharts.find((m) => m.memberId === viewId);
  const rel = mc?.chart.birthProfile.relationshipToOwner;
  if (rel === "spouse" || rel === "parent" || rel === "grandparent") return "married";
  return undefined;
}
