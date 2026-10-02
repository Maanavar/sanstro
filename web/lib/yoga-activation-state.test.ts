import { describe, expect, it } from "vitest";
import {
  displayName,
  yogaActivationLabel,
  yogaActivationState,
  type YogaActivationState,
} from "@vinaadi/shared/yogaDisplay";

const base = { isPresent: true, dashaActivated: false };

describe("yogaActivationState — DD-15's four states, shared by web and mobile", () => {
  it("reads the backend tier when present", () => {
    expect(yogaActivationState({ ...base, activationTier: "STRONG" })).toBe("STRONGLY_ACTIVATED");
    expect(yogaActivationState({ ...base, activationTier: "MODERATE" })).toBe("MODERATELY_ACTIVATED");
    expect(yogaActivationState({ ...base, activationTier: "NONE", dashaActivated: true })).toBe("NOT_DOMINANT");
    expect(yogaActivationState({ ...base, isPresent: false, activationTier: "STRONG" })).toBe("ABSENT");
  });

  it("falls back to the running-dasha flag for an older payload", () => {
    expect(yogaActivationState({ ...base, dashaActivated: true })).toBe("MODERATELY_ACTIVATED");
    expect(yogaActivationState(base)).toBe("NOT_DOMINANT");
  });

  it("never calls a present yoga dormant, in either language", () => {
    const states: YogaActivationState[] = ["STRONGLY_ACTIVATED", "MODERATELY_ACTIVATED", "NOT_DOMINANT"];
    for (const state of states) {
      expect(yogaActivationLabel(state, "en")).not.toMatch(/dormant/i);
      expect(yogaActivationLabel(state, "ta")).toMatch(/[஀-௿]/);
    }
  });
});

describe("candidate labels say so in both languages", () => {
  it("ADHI_RAJA_GRADE is a candidate in Tamil as in English", () => {
    expect(displayName("ADHI_RAJA_GRADE", "en")).toMatch(/candidate/);
    expect(displayName("ADHI_RAJA_GRADE", "ta")).toContain("பரிசீலனையில்");
  });

  it("the Gaja Kesari base is a pattern and the strict form is the yoga", () => {
    expect(displayName("GAJA_KESARI_YOGA", "ta")).toBe("கஜகேசரி அமைப்பு");
    expect(displayName("GAJA_KESARI_PARASHARA", "ta")).toBe("கஜகேசரி யோகம்");
  });
});
