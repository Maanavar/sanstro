import { SCORE_THRESHOLDS, scoreTone, scoreTonePct } from "@vinaadi/shared/utils/score";

describe("SCORE_THRESHOLDS constants", () => {
  it("HIGH threshold is 65", () => expect(SCORE_THRESHOLDS.HIGH).toBe(65));
  it("MID threshold is 45", () => expect(SCORE_THRESHOLDS.MID).toBe(45));
});

describe("scoreTone", () => {
  it("score exactly at HIGH boundary → high", () => expect(scoreTone(65)).toBe("high"));
  it("score just below HIGH → mid", () => expect(scoreTone(64)).toBe("mid"));
  it("score exactly at MID boundary → mid", () => expect(scoreTone(45)).toBe("mid"));
  it("score just below MID → low", () => expect(scoreTone(44)).toBe("low"));
  it("score 0 → low", () => expect(scoreTone(0)).toBe("low"));
  it("score 100 → high", () => expect(scoreTone(100)).toBe("high"));
  it("old mobile magic number 55 → mid (not high)", () => expect(scoreTone(55)).toBe("mid"));
});

describe("scoreTonePct", () => {
  it("0.65 → high", () => expect(scoreTonePct(0.65)).toBe("high"));
  it("0.64 → mid", () => expect(scoreTonePct(0.64)).toBe("mid"));
  it("0.45 → mid", () => expect(scoreTonePct(0.45)).toBe("mid"));
  it("0.44 → low", () => expect(scoreTonePct(0.44)).toBe("low"));
});
