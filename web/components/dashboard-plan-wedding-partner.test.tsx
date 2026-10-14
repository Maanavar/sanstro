import { describe, expect, it } from "vitest";

import {
  coupleFromChoice,
  defaultRoleFor,
  partnerOptions,
  scanWeddingParams,
  suggestedPartner,
} from "./dashboard-plan-wedding-partner";
import type { BirthProfileResponse } from "@/lib/types";

/** Only the fields the helpers read. Names are synthetic. */
function profile(
  chartId: string | null,
  relationshipToOwner: BirthProfileResponse["relationshipToOwner"],
  displayName: string,
  birthTimeLocal: string | null = "06:30:00",
): BirthProfileResponse {
  return { chartId, relationshipToOwner, displayName, birthTimeLocal } as BirthProfileResponse;
}

const PROFILES = [
  profile("chart-self", "self", "Synthetic Self"),
  profile("chart-sibling", "sibling", "Synthetic Sibling"),
  profile("chart-spouse", "spouse", "Synthetic Spouse"),
  profile("chart-untimed", "other", "Synthetic Untimed", null),
  profile(null, "child", "Synthetic Uncalculated"),
];

describe("partnerOptions", () => {
  it("never offers the chart the panel is open on as its own partner", () => {
    const values = partnerOptions(PROFILES, "chart-self", "en").map((o) => o.value);
    expect(values).not.toContain("chart-self");
  });

  it("puts a spouse first and keeps the rest in the order the API sent them", () => {
    const values = partnerOptions(PROFILES, "chart-self", "en").map((o) => o.value);
    expect(values).toEqual(["chart-spouse", "chart-sibling", "chart-untimed"]);
  });

  it("keeps an untimed chart visible but unselectable, and says why", () => {
    // A couple's shared verdict needs both birth times; hiding the chart would
    // leave a reader looking for one they know they saved.
    const untimed = partnerOptions(PROFILES, "chart-self", "en").find((o) => o.value === "chart-untimed");
    expect(untimed?.disabled).toBe(true);
    expect(untimed?.label).toContain("no birth time saved");
  });

  it("drops a profile that has no chart yet", () => {
    expect(partnerOptions(PROFILES, "chart-self", "en").some((o) => o.label.includes("Uncalculated"))).toBe(false);
  });
});

describe("suggestedPartner", () => {
  it("preselects the one timed spouse", () => {
    expect(suggestedPartner(PROFILES, "chart-self")).toBe("chart-spouse");
  });

  it("preselects nobody when there are two spouses to choose between", () => {
    const two = [...PROFILES, profile("chart-spouse-2", "spouse", "Synthetic Second")];
    expect(suggestedPartner(two, "chart-self")).toBe("");
  });

  it("does not suggest the open chart even when it is saved as a spouse", () => {
    expect(suggestedPartner(PROFILES, "chart-spouse")).toBe("");
  });
});

describe("defaultRoleFor", () => {
  it("reads the saved gender and nothing else", () => {
    expect(defaultRoleFor({ genderForTraditionalRules: "female" })).toBe("BRIDE");
    expect(defaultRoleFor({ genderForTraditionalRules: "Male" })).toBe("GROOM");
    // Unknown stays unnamed: the bride's Jupiter rule must not be applied to a
    // chart nobody said was hers.
    expect(defaultRoleFor({ genderForTraditionalRules: null })).toBe("PERSON");
    expect(defaultRoleFor(null)).toBe("PERSON");
  });
});

describe("coupleFromChoice", () => {
  it("sends a couple only once it is complete", () => {
    expect(coupleFromChoice({ mode: "couple", subjectRole: "BRIDE", partnerChartId: "chart-spouse" }, true))
      .toEqual({ partnerChartId: "chart-spouse", subjectRole: "BRIDE" });
    expect(coupleFromChoice({ mode: "couple", subjectRole: "BRIDE", partnerChartId: "" }, true)).toBeNull();
    expect(coupleFromChoice({ mode: "solo", subjectRole: "BRIDE", partnerChartId: "chart-spouse" }, true)).toBeNull();
  });

  it("reads as one chart when the open chart has no birth time, rather than sending a request the backend refuses", () => {
    expect(coupleFromChoice({ mode: "couple", subjectRole: "GROOM", partnerChartId: "chart-spouse" }, false)).toBeNull();
  });
});

describe("scanWeddingParams", () => {
  const couple = { partnerChartId: "chart-spouse", subjectRole: "BRIDE" as const };

  it("sends the couple for a wedding scan", () => {
    expect(scanWeddingParams("marriage", couple)).toEqual({ partnerChartId: "chart-spouse", subjectRole: "BRIDE" });
  });

  it("sends nothing for the activities the panel merely maps onto the wedding muhurta", () => {
    // Family harmony and child birth hand off to MARRIAGE in the detailed
    // search, but neither is elected on two charts, and the backend refuses it.
    expect(scanWeddingParams("family_harmony", couple)).toEqual({});
    expect(scanWeddingParams("child_birth", couple)).toEqual({});
  });

  it("sends nothing without a complete couple", () => {
    expect(scanWeddingParams("marriage", null)).toEqual({});
  });
});
