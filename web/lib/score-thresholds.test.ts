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

  it("maps mid-tier scores to the warm support color", () => {
    expect(scoreColor(50)).toBe("var(--color-score-mid, #B85A2C)");
  });
});