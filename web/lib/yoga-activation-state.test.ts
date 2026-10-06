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
  it("ADHI_RAJA_GRADE claims no full strength in Tamil as in English", () => {
    // Owner-ruled wording (2026-10-03, v1.8): "full strength not confirmed",
    // and no "candidate"/"grade" engine term in either language.
    expect(displayName("ADHI_RAJA_GRADE", "en")).toMatch(/not confirmed/);
    expect(displayName("ADHI_RAJA_GRADE", "en")).not.toMatch(/candidate|grade/i);
    expect(displayName("ADHI_RAJA_GRADE", "ta")).toContain("உறுதியாகவில்லை");
    expect(displayName("ADHI_RAJA_GRADE", "ta")).not.toContain("பரிசீலனையில்");
  });

  it("one cancellation condition is நீசபங்கம், never the raja-yoga name", () => {
    expect(displayName("NEECHA_NIVARTHI", "ta")).toBe("நீசபங்கம்");
    expect(displayName("NEECHA_NIVARTHI", "ta")).not.toContain("ராஜயோகம்");
  });

  it("the Gaja Kesari base is a pattern and the strict form is the yoga", () => {
    expect(displayName("GAJA_KESARI_YOGA", "ta")).toBe("கஜகேசரி அமைப்பு");
    expect(displayName("GAJA_KESARI_PARASHARA", "ta")).toBe("கஜகேசரி யோகம்");
  });
});
