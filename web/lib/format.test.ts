import { describe, expect, it } from "vitest";

import {
  addDays,
  formatClockLabel,
  formatDateLabel,
  formatDateTimeLabel,
  getLifeAreaVerdict,
  getScoreBand,
  getScoreVerdictFromGuidance,
  nextWeekdayDate,
  todayIso,
  type ScoreVerdict,
} from "./format";

describe("format helpers", () => {
  it("classifies score bands", () => {
    expect(getScoreBand(86)).toEqual({ label: "strong day", tone: "high" });
    expect(getScoreBand(68)).toEqual({ label: "supportive", tone: "high" });
    expect(getScoreBand(53)).toEqual({ label: "steady", tone: "mid" });
    expect(getScoreBand(44)).toEqual({ label: "soft caution", tone: "low" });
    expect(getScoreBand(14)).toEqual({ label: "take care", tone: "low" });
  });

  it("formats dates and clock labels", () => {
    expect(addDays("2026-05-21", 6)).toBe("2026-05-27");
    expect(formatClockLabel("00:05")).toBe("12:05 am");
    expect(formatClockLabel("12:00")).toBe("12:00 pm");
    expect(formatClockLabel("13:40:00")).toBe("1:40 pm");
    expect(formatDateLabel("2026-05-21")).toBe("21 May 2026");
    expect(todayIso(new Date("2026-05-21T12:00:00Z"))).toBe("2026-05-21");
  });

  it("finds the next matching weekday", () => {
    // 2026-05-21 is a Thursday.
    expect(nextWeekdayDate("FRIDAY", "2026-05-21")).toBe("2026-05-22"); // tomorrow
    expect(nextWeekdayDate("MONDAY", "2026-05-21")).toBe("2026-05-25"); // 4 days on
    expect(nextWeekdayDate("THURSDAY", "2026-05-21")).toBe("2026-05-21"); // today counts
    expect(nextWeekdayDate("WEDNESDAY", "2026-05-21")).toBe("2026-05-27"); // 6 days on
    expect(nextWeekdayDate("bogus", "2026-05-21")).toBe("2026-05-21"); // unknown → unchanged
  });

  it("formats date-time labels with am/pm", () => {
    expect(formatDateTimeLabel("not-a-date")).toBe("not-a-date");
    expect(formatDateTimeLabel("2026-05-21T13:40:00")).toMatch(/\bpm\b/);
  });

  it("derives the headline verdict from the backend label across boundary scores", () => {
    const cases: Array<[string, number, ScoreVerdict["tone"]]> = [
      ["RESTORATIVE", 34, "low"],
      ["CAUTION", 35, "low"],
      ["CAUTION", 49, "low"],
      ["BALANCED", 50, "mid"],
      ["BALANCED", 64, "mid"],
      ["GOOD", 65, "high"],
      ["GOOD", 79, "high"],
      ["STRONG_SUPPORT", 80, "high"],
    ];
    for (const [label, score, tone] of cases) {
      expect(getScoreVerdictFromGuidance(label, score, "en").tone).toBe(tone);
    }
  });

  it("never shows Good day for a chandrashtama day demoted to BALANCED", () => {
    const verdict = getScoreVerdictFromGuidance("BALANCED", 72, "en");
    expect(verdict.tone).toBe("mid");
    expect(verdict.verdict).not.toBe("Good day");
  });

  it("falls back to score-only verdict when label is missing", () => {
    expect(getScoreVerdictFromGuidance(null, 72, "en")).toEqual(
      expect.objectContaining({ tone: "high", verdict: "Good day" }),
    );
    expect(getScoreVerdictFromGuidance(undefined, 45, "en")).toEqual(
      expect.objectContaining({ tone: "low", verdict: "Take care" }),
    );
  });

  it("reads a life-area score in the period noun, never the daily one", () => {
    expect(getLifeAreaVerdict(82, "en").verdict).toBe("Excellent period");
    expect(getLifeAreaVerdict(54, "en").verdict).toBe("Mixed period");
    expect(getLifeAreaVerdict(16, "en").verdict).toBe("Needs care");
    expect(getLifeAreaVerdict(54, "ta").verdict).toBe("கலப்பான காலகட்டம்");
  });

  /** The engine bands a life area at 70 / 45 — `_score_area` closes its own
   *  prose with "strong" / "moderate and steady" / "needs attention" on those
   *  boundaries. The daily palette bands at 70 / 65 / 50, and borrowing it left
   *  a 45 reading "Needs care" on the Today tile while its own detail text said
   *  "moderate and steady (45/100)". The UI follows the engine here. */
  it("bands a life area on the engine's boundaries, not the daily palette's", () => {
    expect(getLifeAreaVerdict(44, "en").verdict).toBe("Needs care");
    expect(getLifeAreaVerdict(45, "en").verdict).toBe("Mixed period");
    expect(getLifeAreaVerdict(49, "en").verdict).toBe("Mixed period"); // was "Take care"
    expect(getLifeAreaVerdict(69, "en").verdict).toBe("Mixed period");
    expect(getLifeAreaVerdict(70, "en").verdict).toBe("Excellent period");
    // The 50 and 65 boundaries belong to the daily ladder and must not show up.
    expect(getLifeAreaVerdict(49, "en").verdict).toBe(getLifeAreaVerdict(50, "en").verdict);
    expect(getLifeAreaVerdict(64, "en").verdict).toBe(getLifeAreaVerdict(65, "en").verdict);
  });

  /** The whole point of the separate lexicon: a life-area score spans the
   *  running dasha and slow transits, so a tile of them sitting beside the
   *  "Is today okay for…?" muhurtam board must never claim to be about today.
   *  Guarding the *word* is what stops the two cards reading as contradictory. */
  it("never puts a day word on a life-area verdict, in either language", () => {
    for (let score = 0; score <= 100; score += 1) {
      expect(getLifeAreaVerdict(score, "en").verdict).not.toMatch(/\bday\b/i);
      expect(getLifeAreaVerdict(score, "ta").verdict).not.toMatch(/நாள்/);
      // An empty string would mean a rung fell out of the lexicon.
      expect(getLifeAreaVerdict(score, "en").verdict).not.toBe("");
      expect(getLifeAreaVerdict(score, "ta").verdict).not.toBe("");
    }
  });

  it("keeps a life-area word and its band colour in agreement", () => {
    // One word per colour band (70 / 65 / 50), so no score can draw a hue its
    // word disagrees with — the failure that moved the good/fair line to 65.
    const seen = new Map<string, Set<string>>();
    for (let score = 0; score <= 100; score += 1) {
      const { verdict, color } = getLifeAreaVerdict(score, "en");
      if (!seen.has(color)) seen.set(color, new Set());
      seen.get(color)!.add(verdict);
    }
    for (const words of seen.values()) expect(words.size).toBe(1);
  });
});