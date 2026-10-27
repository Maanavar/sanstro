import { describe, expect, it } from "vitest";
import { categoryKindsFor, categorySlug, parseCategorySlug } from "./calendar-category-api";
import { parseEventSlug } from "@/lib/tamil-calendar-years";

const OCT_2026 = new Date("2026-10-23T06:00:00Z");
const MAR_2028 = new Date("2028-03-01T06:00:00Z");

describe("calendar category slugs", () => {
  it("has every kind in the curated year and the computed two in any other", () => {
    expect(categoryKindsFor(2026)).toHaveLength(4);
    expect(categoryKindsFor(2027)).toEqual(["hindu-festivals", "christian-festivals"]);
  });

  it("parses a served year's category and nothing the backend would 404", () => {
    expect(parseCategorySlug("hindu-festivals-2027", OCT_2026)).toEqual({ kind: "hindu-festivals", year: 2027 });
    expect(parseCategorySlug("christian-festivals-2025", OCT_2026)).toEqual({ kind: "christian-festivals", year: 2025 });
    // Moon sighting and the government order are not computed.
    expect(parseCategorySlug("muslim-festivals-2027", OCT_2026)).toBeNull();
    expect(parseCategorySlug("tamil-nadu-government-holidays-2027", OCT_2026)).toBeNull();
    // Outside the served window.
    expect(parseCategorySlug("hindu-festivals-2029", OCT_2026)).toBeNull();
    expect(parseCategorySlug("pournami-2027", OCT_2026)).toBeNull();
  });

  it("keeps the curated year's pages after the window moves on", () => {
    expect(parseCategorySlug("muslim-festivals-2026", MAR_2028)).toEqual({ kind: "muslim-festivals", year: 2026 });
    expect(parseCategorySlug("hindu-festivals-2026", MAR_2028)).toEqual({ kind: "hindu-festivals", year: 2026 });
  });

  it("never collides with an event slug", () => {
    for (const kind of categoryKindsFor(2026)) {
      expect(parseEventSlug(categorySlug(kind, 2026), OCT_2026)).toBeNull();
    }
  });
});
