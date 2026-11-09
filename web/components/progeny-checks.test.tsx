import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ChartDoshamInsight, ProgenyChecks } from "@vinaadi/shared/types";
import { progenyCheckView } from "@vinaadi/shared/progenyChecks";
import { DoshamReckoningBlock } from "./dosham-reckoning-block";

// Synthetic Putra Sarpa payload: Mesham lagna, Ketu in Simmam. No birth behind it.
function checks(over: Partial<ProgenyChecks["d7"]> = {}, ageBand: ProgenyChecks["dasha"]["ageBand"] = "CHILDBEARING"): ProgenyChecks {
  return {
    tier: "engine_inference",
    d7: {
      housesReliable: true, marginMinutes: 9, lagnaRasi: 4, fifthRasi: 8, fifthLord: "MARS",
      fifthLordHouse: 1, jupiterHouse: 5, repeatedBy: [], jupiterSupports: true,
      fifthLordInDusthana: false, verdict: "SUPPORTS", ...over,
    },
    dasha: {
      currentMaha: "VENUS", currentBhukti: "KETU", currentKind: "AFFLICTION",
      afflictingLords: ["KETU"], supportingLords: ["JUPITER", "SUN"], ageBand,
      windows: [
        { lord: "KETU", level: "BHUKTI", mahaLord: "VENUS", start: "2026-02-01", end: "2027-04-01", kind: "AFFLICTION", isCurrent: true },
        { lord: "SUN", level: "MAHA", mahaLord: "SUN", start: "2030-03-01", end: "2036-03-01", kind: "SUPPORT", isCurrent: false },
      ],
    },
  };
}

function putraSarpa(progenyChecks: ProgenyChecks): ChartDoshamInsight {
  return {
    name: "PUTRA_SARPA_DOSHAM", isPresent: true, isCancelled: false, strength: "WEAK",
    label: "ACTIVE_DOSHAM", category: "CHILDREN", conditionsMet: ["fifth_house_has_ketu"],
    cancellationFactors: [], missingData: [], dashaActivated: false,
    descriptionTa: "", descriptionEn: "", explanationWhatTa: "", explanationWhatEn: "",
    explanationWhyTa: "", explanationWhyEn: "", explanationHowTa: "", explanationHowEn: "",
    contextNotes: ["children_d7_dasha_unratified"], progenyChecks,
  };
}

const VERDICTS = ["REPEATS", "STRAINED", "SUPPORTS", "MIXED", "UNCERTAIN"] as const;
const BANDS = ["UNDER_18", "CHILDBEARING", "PAST"] as const;

function allLines(lang: "ta" | "en"): string[] {
  const out: string[] = [];
  for (const verdict of VERDICTS) {
    for (const band of BANDS) {
      const view = progenyCheckView(
        { progenyChecks: checks({ verdict, repeatedBy: verdict === "REPEATS" ? ["KETU"] : [], housesReliable: verdict !== "UNCERTAIN" }, band) },
        lang,
      )!;
      out.push(view.d7Finding, view.d7Effect, view.dashaNow, ...view.precautions,
        ...view.windows.flatMap((w) => [w.period, w.dates, w.meaning]));
    }
  }
  return out;
}

describe("progeny checks — words (V1 §18 Q13/Q17/Q18)", () => {
  it("never says a person cannot have children (Q17)", () => {
    // Blind spot: a phrase list. The engine's own guard is the type: no verdict
    // or outlook value expresses denial.
    const denial = /cannot have|can't have|no children|childless|never have|denied|குழந்தை இல்லை|குழந்தை பிறக்காது|சந்ததி இல்லை|பாக்கியம் இல்லை/i;
    for (const line of [...allLines("en"), ...allLines("ta")]) expect(line).not.toMatch(denial);
  });

  it("never claims the checks raised or lowered the grade (Q18)", () => {
    const moved = /lowers? the grade|raises? the grade|reduces? the dosham|cancels?|தீவிரம் குறை|நிவர்த்தி/i;
    for (const line of allLines("en")) expect(line).not.toMatch(moved);
    for (const line of allLines("ta")) expect(line).not.toMatch(moved);
  });

  it("writes Tamil with no English except the D7 label", () => {
    for (const line of allLines("ta")) expect(line.replaceAll("D7", "")).not.toMatch(/[A-Za-z]/);
  });

  it("names periods the Tamil way (சுக்கிர தசை, never சுக்கிரன் தசை)", () => {
    const view = progenyCheckView({ progenyChecks: checks() }, "ta")!;
    expect(view.windows[0].period).toBe("சுக்கிர தசையில் கேது புக்தி");
    expect(view.windows[1].period).toBe("சூரிய தசை");
    expect(view.dashaNow).toContain("சுக்கிர தசையில் கேது புக்தி");
  });

  it("gives no D7 verdict when the birth time cannot carry it", () => {
    const view = progenyCheckView({ progenyChecks: checks({ verdict: "UNCERTAIN", housesReliable: false, marginMinutes: 1 }) }, "en")!;
    expect(view.d7Effect).toMatch(/no D7 verdict/);
  });

  it("renders on the dosham card, and nothing for an older payload", () => {
    const { unmount } = render(<DoshamReckoningBlock dosham={putraSarpa(checks())} lang="en" />);
    expect(screen.getByTestId("progeny-d7")).toHaveTextContent("Saptamsa (D7) check");
    expect(screen.getByTestId("progeny-dasha")).toHaveTextContent("Ketu bhukti in Venus dasa");
    expect(screen.getByTestId("progeny-precautions")).toHaveTextContent("not a medical prediction");
    unmount();
    expect(progenyCheckView({ progenyChecks: null }, "en")).toBeNull();
  });
});
