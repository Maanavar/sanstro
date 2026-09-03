import { describe, expect, it } from "vitest";

import {
  activeSaniCycles,
  careReasonLabel,
  memberCareReason,
  saniCycleName,
  saniCycleNote,
} from "./family-flags";
import { verdictPhrase } from "./verdict-lexicon";

describe("memberCareReason", () => {
  it("does not flag a mid-score member for a multi-year Saturn cycle", () => {
    // The reported case: 53 / "Steady day" wore a red "needs care" chip
    // because Ezharai Sani was running — a badge that would be on every day
    // for seven years, with nothing on the card to explain it.
    expect(
      memberCareReason({ individualScore: 53 }, false),
    ).toBeNull();
  });

  it("flags Chandrashtama regardless of score", () => {
    expect(memberCareReason({ individualScore: 67 }, true)).toBe("chandrashtama");
  });

  it("flags a score in the same band that turns the ring red", () => {
    expect(memberCareReason({ individualScore: 49 }, false)).toBe("lowScore");
    expect(memberCareReason({ individualScore: 50 }, false)).toBeNull();
  });

  it("prefers Chandrashtama over the score reason", () => {
    expect(memberCareReason({ individualScore: 20 }, true)).toBe("chandrashtama");
  });

  it("names Chandrashtama, and keeps the shared lexicon's word for the caution band", () => {
    expect(careReasonLabel("chandrashtama", "en")).toBe("Chandrashtama");
    expect(careReasonLabel("chandrashtama", "ta")).toBe("சந்திராஷ்டமம்");
    expect(careReasonLabel("lowScore", "en")).toBe(verdictPhrase("daily", "CAUTION", "en"));
    expect(careReasonLabel("lowScore", "ta")).toBe(verdictPhrase("daily", "CAUTION", "ta"));
  });
});

describe("Saturn cycle chips", () => {
  it("ignores the aggregate's non-Saturn day tags", () => {
    expect(activeSaniCycles(["NORMAL_DAY", "CHANDRASHTAMA"])).toEqual([]);
  });

  it("ranks a Moon-based cycle above a Lagna-based one", () => {
    expect(activeSaniCycles(["NORMAL_DAY", "KANDAKA_SANI", "JANMA_SANI"])).toEqual([
      "JANMA_SANI",
      "KANDAKA_SANI",
    ]);
  });

  it("names cycles in Tamil almanac terms, not the raw enum", () => {
    expect(saniCycleName("EZHARAI_SANI_PHASE_1", "en")).toBe("Ezharai Sani · opening");
    expect(saniCycleName("ASHTAMA_SANI", "ta")).toBe("அஷ்டம சனி");
  });

  it("de-snakes an unknown tag rather than leaking it", () => {
    expect(saniCycleName("SOME_NEW_SANI", "en")).toBe("Some New Sani");
  });

  it("lists both cycles in the note when two run at once", () => {
    const note = saniCycleNote(["JANMA_SANI", "KANDAKA_SANI"], "en");
    expect(note).toContain("Janma Sani");
    expect(note).toContain("Kantaka Sani · from Janma Rasi");
    expect(note).toContain("not a verdict on today");
  });

  it("states the long-cycle framing for a single cycle", () => {
    expect(saniCycleNote(["ASHTAMA_SANI"], "en")).toBe(
      "A long Saturn cycle — background context for months or years, not a verdict on today.",
    );
  });
});
