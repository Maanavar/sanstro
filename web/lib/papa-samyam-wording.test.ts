import { describe, expect, it } from "vitest";

import type { PapaSamyamData } from "@vinaadi/shared";
import { papaNotCheckedNote, papaSamyamView } from "@vinaadi/shared/papaSamyam";
import { muhurtaSafetyNotices } from "@vinaadi/shared/muhurtaSafety";

// Synthetic: groom Saturn 7th + Mars 8th from all three references (6), bride clean.
const SHORT: PapaSamyamData = {
  method: "equal_count",
  ratified: false,
  boy: { total: 0, byReference: { LAGNA: 0, MOON: 0, VENUS: 0 }, rows: [] },
  girl: {
    total: 6,
    byReference: { LAGNA: 2, MOON: 2, VENUS: 2 },
    rows: (["LAGNA", "MOON", "VENUS"] as const).flatMap((reference) => [
      { reference, graha: "SATURN", house: 7, points: 1 },
      { reference, graha: "MARS", house: 8, points: 1 },
    ]),
  },
  balanced: false,
  shortfall: 6,
  directionAssumed: true,
};

describe("papaSamyamView", () => {
  it("renders nothing without a block", () => {
    expect(papaSamyamView(null, "en")).toBeNull();
    expect(papaSamyamView(undefined, "ta")).toBeNull();
  });

  it("names the shortfall in advisory voice and always says how it was counted", () => {
    const v = papaSamyamView(SHORT, "en")!;
    expect(v.totals).toBe("Groom 0 · Bride 6");
    expect(v.verdict).toMatch(/^Short by 6:/);
    expect(v.verdict).toMatch(/astrologer/);
    expect(v.verdict).not.toMatch(/avoid|reject|do not marry/i);
    expect(v.method).toMatch(/not part of the porutham score/);
    expect(v.directionNote).toMatch(/Person 1 was read as the groom/);
    expect(v.bride.lines.map((l) => l.detail)).toEqual(Array(3).fill("Saturn (7th), Mars (8th)"));
    expect(v.groom.lines.every((l) => l.detail === "none")).toBe(true);
  });

  it("words every graha in Tamil in Tamil mode, with no English name leaking", () => {
    const v = papaSamyamView(SHORT, "ta")!;
    const text = [v.heading, v.totals, v.verdict, v.method, v.directionNote, ...v.bride.lines.map((l) => `${l.label} ${l.detail}`)].join(" ");
    expect(text).toContain("சனி (7ஆம்)");
    expect(text).toContain("செவ்வாய் (8ஆம்)");
    expect(text).not.toMatch(/Saturn|Mars|Lagna|Groom|Bride|Papa samyam/);
  });

  it("says a missing reference could not be read instead of counting it as zero", () => {
    const v = papaSamyamView({ ...SHORT, girl: { ...SHORT.girl, missingReferences: ["MOON"] } }, "en")!;
    const moon = v.bride.lines.find((l) => l.reference === "MOON")!;
    expect(moon.points).toBeNull();
    expect(moon.detail).toBe("could not be read");
  });

  it("has a not-checked line for the star-only tools in both languages", () => {
    expect(papaNotCheckedNote("en")).toMatch(/not checked here/);
    expect(papaNotCheckedNote("ta")).toMatch(/பார்க்கப்படவில்லை/);
  });
});

describe("muhurtaSafetyNotices", () => {
  it("words the medical key and skips unknown keys rather than printing them", () => {
    expect(muhurtaSafetyNotices(["medical_doctor_first"], "en")[0]).toMatch(/doctor's advice comes first/);
    expect(muhurtaSafetyNotices(["medical_doctor_first"], "ta")[0]).toMatch(/மருத்துவரின் ஆலோசனையே முதன்மையானது/);
    expect(muhurtaSafetyNotices(["not_a_key"], "en")).toEqual([]);
    expect(muhurtaSafetyNotices(undefined, "en")).toEqual([]);
  });
});
