import { describe, expect, it } from "vitest";
import type { MemberChart } from "@/hooks/useFamilyData";
import type { FamilyAggregateData, FamilyMemberData } from "@/lib/types";
import {
  chartIdFor, isOwnChart, maritalStatusFor, memberChartFor, memberPickerOptions, numerologyMembers,
  ownerAsMemberChart, poruthamCandidates, reconcileOwnerScore, synastryMemberOptions, type OwnReading,
} from "./dashboard-workspace-chart-view";

function bp(id: string, name: string, rel: string, time: string | null = "06:30") {
  return {
    birthProfileId: id, displayName: name, relationshipToOwner: rel, birthDateLocal: "1990-01-15",
    birthTimeLocal: time, birthPlace: "Synthetic Nagar", birthLatitude: 11.5, birthLongitude: 78.25,
    birthTimezone: "Asia/Kolkata",
  };
}

function member(memberId: string, rel: string, profileId = `bp-${memberId}`, time: string | null = "06:30"): MemberChart {
  return {
    memberId, displayName: `Name ${memberId}`, chart: { chartId: `chart-${memberId}`, birthProfile: bp(profileId, `Name ${memberId}`, rel, time) },
    explanation: null, summary: null, transit: null, sani: null, peyarchiUpcoming: [], dailyGuidance: null,
    weekAhead: null, dasha: null, dashaMaha: null, dashaAntar: [], nakshatraCard: null,
  } as unknown as MemberChart;
}

const charts = [member("spouse", "spouse"), member("child", "child"), member("selfrow", "self")];
const rows = [
  { familyMemberId: "spouse", relationshipToOwner: "spouse" },
  { familyMemberId: "selfrow", relationshipToOwner: "self" },
] as FamilyMemberData[];

describe("chart resolution", () => {
  it("reads the reader's own chart without a selection", () => {
    expect(chartIdFor(charts, null, "chart-own")).toBe("chart-own");
    expect(memberChartFor(charts, null)).toBeNull();
  });

  it("reads a selected member's chart once it has loaded", () => {
    expect(chartIdFor(charts, "child", "chart-own")).toBe("chart-child");
    expect(memberChartFor(charts, "child")?.memberId).toBe("child");
  });

  it("stays on the reader's own chart while the member's chart has not loaded", () => {
    expect(chartIdFor(charts, "not-loaded", "chart-own")).toBe("chart-own");
    expect(memberChartFor(charts, "not-loaded")).toBeNull();
  });
});

describe("isOwnChart (life focus D4)", () => {
  it("is the reader's own chart without a selection or on a self-tagged vault row", () => {
    expect(isOwnChart(rows, null)).toBe(true);
    expect(isOwnChart(rows, "selfrow")).toBe(true);
  });

  it("is not for another member or an id the vault does not know", () => {
    expect(isOwnChart(rows, "spouse")).toBe(false);
    expect(isOwnChart(rows, "child")).toBe(false);
  });
});

describe("reconcileOwnerScore", () => {
  const aggregate = {
    familyVaultId: "v", members: [
      { familyMemberId: "own", birthProfileId: "bp-own", individualScore: 50 },
      { familyMemberId: "spouse", birthProfileId: "bp-spouse", individualScore: 61 },
    ],
  } as unknown as FamilyAggregateData;

  it("gives the owner row the live score and leaves other rows as they are", () => {
    const out = reconcileOwnerScore(aggregate, "bp-own", 74)!;
    expect(out.members.map((m) => m.individualScore)).toEqual([74, 61]);
    expect(out.members[1]).toBe(aggregate.members[1]);
    expect(aggregate.members[0].individualScore).toBe(50);
  });

  it("counts a live score of 0", () => {
    expect(reconcileOwnerScore(aggregate, "bp-own", 0)!.members[0].individualScore).toBe(0);
  });

  it("changes nothing without a live score or an owner id", () => {
    expect(reconcileOwnerScore(aggregate, "bp-own", null)!.members[0].individualScore).toBe(50);
    expect(reconcileOwnerScore(aggregate, undefined, 74)!.members[0].individualScore).toBe(50);
  });

  it("passes a missing aggregate through", () => {
    expect(reconcileOwnerScore(null, "bp-own", 74)).toBeNull();
  });
});

describe("ownerAsMemberChart", () => {
  const own = {
    birthProfileId: "bp-own", chart: member("own", "self", "bp-own").chart, chartExplanation: null,
    chartSummary: null, transit: null, sani: null, peyarchiUpcoming: [], dailyGuidance: { score: 74 },
    weekAhead: null, dasha: null, dashaMaha: null, dashaAntar: [], nakshatraCard: null,
  } as unknown as OwnReading;

  it("is keyed by the birth-profile id the aggregate's owner row carries", () => {
    const out = ownerAsMemberChart(own)!;
    expect(out.memberId).toBe("bp-own");
    expect(out.displayName).toBe("Name own");
    expect(out.dailyGuidance).toEqual({ score: 74 });
  });

  it("does not exist before the reader has a chart", () => {
    expect(ownerAsMemberChart({ ...own, chart: null })).toBeNull();
  });
});

describe("pickers", () => {
  it("lists Porutham candidates reader first, without the reader twice, with a blank unknown time", () => {
    const dup = member("dup", "self", "bp-own");
    const untimed = member("untimed", "child", "bp-untimed", null);
    const out = poruthamCandidates(member("own", "self", "bp-own").chart, [dup, untimed]);
    expect(out.map((c) => c.memberId)).toEqual(["owner:bp-own", "untimed"]);
    expect(out[1].birthTimeLocal).toBe("");
    expect(poruthamCandidates(null, [dup]).map((c) => c.memberId)).toEqual(["dup"]);
  });

  it("labels a Compatibility member the vault does not list as 'other'", () => {
    expect(synastryMemberOptions(charts, rows).map((o) => o.relationshipToOwner)).toEqual(["spouse", "other", "self"]);
  });

  it("gives numerology each member's chart and the pickers each member's name", () => {
    expect(numerologyMembers(charts)[1]).toEqual({ memberId: "child", displayName: "Name child", chartId: "chart-child" });
    expect(memberPickerOptions(charts)[0]).toEqual({ memberId: "spouse", displayName: "Name spouse" });
  });
});

describe("maritalStatusFor", () => {
  it("reads the reader's own answer, and no answer as none", () => {
    expect(maritalStatusFor(charts, null, "single")).toBe("single");
    expect(maritalStatusFor(charts, null, "")).toBeUndefined();
  });

  it("treats a spouse, parent or grandparent as married and asserts nothing for others", () => {
    const family = [...charts, member("parent", "parent"), member("grandparent", "grandparent")];
    expect(maritalStatusFor(family, "spouse", "single")).toBe("married");
    expect(maritalStatusFor(family, "parent", "")).toBe("married");
    expect(maritalStatusFor(family, "grandparent", "")).toBe("married");
    expect(maritalStatusFor(family, "child", "married")).toBeUndefined();
    expect(maritalStatusFor(family, "not-loaded", "married")).toBeUndefined();
  });
});
