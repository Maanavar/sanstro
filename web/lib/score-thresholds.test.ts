import { describe, expect, it } from "vitest";
import { SCORE_THRESHOLDS, scoreTone, scoreTonePct } from "@vinaadi/shared/utils/score";
import { scoreColor } from "@/lib/format";

describe("shared score thresholds", () => {
  it("keeps the agreed threshold constants in sync", () => {
    expect(SCORE_THRESHOLDS.HIGH).toBe(65);
    expect(SCORE_THRESHOLDS.MID).toBe(45);
  });

  it("classifies whole-number scores consistently", () => {
    expect(scoreTone(65)).toBe("high");
    expect(scoreTone(64)).toBe("mid");
    expect(scoreTone(45)).toBe("mid");
    expect(scoreTone(44)).toBe("low");
  });

  it("classifies percentage inputs consistently", () => {
    expect(scoreTonePct(0.65)).toBe("high");
    expect(scoreTonePct(0.64)).toBe("mid");
    expect(scoreTonePct(0.45)).toBe("mid");
    expect(scoreTonePct(0.44)).toBe("low");
  });

  it("maps a 50-64 score to the four-band gold (fair) color", () => {
    expect(scoreColor(50)).toBe("var(--color-score-fair, #C8892E)");
    expect(scoreColor(72)).toBe("var(--color-score-strong, #3F7A4E)");
    expect(scoreColor(66)).toBe("var(--color-score-good, #6B9E5E)");
    expect(scoreColor(41)).toBe("var(--color-score-weak, #C04530)");
  });

  // The good/fair colour boundary must sit on SCORE_THRESHOLDS.HIGH, matching
  // the engine's `_score_label` (GOOD >=65). At 60 it did not, and a 60-64 day
  // drew green from the score-driven Family Today ring while the label-driven
  // Today hero dial drew gold.
  it("puts the good/fair colour boundary on the same 65 as the tone bands", () => {
    expect(scoreColor(65)).toBe("var(--color-score-good, #6B9E5E)");
    expect(scoreColor(64)).toBe("var(--color-score-fair, #C8892E)");
    expect(scoreTone(64)).toBe("mid");
  });
});