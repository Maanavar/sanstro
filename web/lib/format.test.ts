import { describe, expect, it } from "vitest";

import { addDays, formatClockLabel, formatDateLabel, formatDateTimeLabel, getScoreBand, todayIso } from "./format";

describe("format helpers", () => {
  it("classifies score bands", () => {
    expect(getScoreBand(86)).toEqual({ label: "strong day", tone: "high" });
    expect(getScoreBand(68)).toEqual({ label: "supportive", tone: "high" });
    expect(getScoreBand(53)).toEqual({ label: "steady", tone: "mid" });
    expect(getScoreBand(39)).toEqual({ label: "soft caution", tone: "low" });
    expect(getScoreBand(14)).toEqual({ label: "restorative", tone: "low" });
  });

  it("formats dates and clock labels", () => {
    expect(addDays("2026-05-21", 6)).toBe("2026-05-27");
    expect(formatClockLabel("00:05")).toBe("12:05 am");
    expect(formatClockLabel("12:00")).toBe("12:00 pm");
    expect(formatClockLabel("13:40:00")).toBe("1:40 pm");
    expect(formatDateLabel("2026-05-21")).toBe("21 May 2026");
    expect(todayIso(new Date("2026-05-21T12:00:00Z"))).toBe("2026-05-21");
  });

  it("formats date-time labels with am/pm", () => {
    expect(formatDateTimeLabel("not-a-date")).toBe("not-a-date");
    expect(formatDateTimeLabel("2026-05-21T13:40:00")).toMatch(/\bpm\b/);
  });
});