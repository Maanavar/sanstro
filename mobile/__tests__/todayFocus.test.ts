import { todayPulseAreas } from "@/lib/todayFocus";

// Synthetic areas in the server's order; only `area` matters to the pin.
const areas = ["HEALTH", "MONEY", "RELATIONSHIPS", "FAMILY_HARMONY", "SPIRITUAL", "CAREER", "EDUCATION"].map(
  (area, i) => ({ area, score: 70 - i }),
);

describe("todayPulseAreas (mobile Today T2)", () => {
  it("without a focus, is the server's first four unchanged", () => {
    expect(todayPulseAreas(areas, null).map((a) => a.area)).toEqual(["HEALTH", "MONEY", "RELATIONSHIPS", "FAMILY_HARMONY"]);
  });

  it("pins the focus area before the cut, so a sixth-ranked focus still reaches the row", () => {
    expect(todayPulseAreas(areas, "CAREER").map((a) => a.area)).toEqual(["CAREER", "HEALTH", "MONEY", "RELATIONSHIPS"]);
  });

  it("keeps the rest in server order and returns the same objects (D2: reorder, never rescore)", () => {
    const out = todayPulseAreas(areas, "MONEY");
    expect(out.map((a) => a.area)).toEqual(["MONEY", "HEALTH", "RELATIONSHIPS", "FAMILY_HARMONY"]);
    expect(out[0]).toBe(areas[1]);
    expect(out.map((a) => a.score)).toEqual([69, 70, 68, 67]);
  });

  it("leaves the row alone for a focus area the server did not send", () => {
    expect(todayPulseAreas(areas, "NOT_AN_AREA").map((a) => a.area)).toEqual(["HEALTH", "MONEY", "RELATIONSHIPS", "FAMILY_HARMONY"]);
  });
});
