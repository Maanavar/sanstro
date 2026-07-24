import { describe, expect, it } from "vitest";

import {
  addDays,
  formatClockLabel,
  formatDateLabel,
  formatDateTimeLabel,
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
});