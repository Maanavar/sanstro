import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { almanacMuhurthamLabel } from "./almanac-muhurtham";

/* §3 of docs/HOME_CALENDAR_CHARTS_PROPOSALS_2026-09-22.md. The astrologer's
   reading: almanac membership is a gate, not a bonus point. These pin the
   wording decisions; the renderers' own tests pin the painting. */
describe("almanacMuhurthamLabel", () => {
  it("gives a listed day the emphatic tone and the almanac's own fortnight", () => {
    const label = almanacMuhurthamLabel({ status: "ON_LIST", pirai: "VALARPIRAI" }, "en");
    expect(label).toMatchObject({ tone: "listed", text: "Almanac muhurtham day", pirai: "Valarpirai" });
  });

  it("names the fortnight the Tamil almanac's way, never Shukla or Krishna", () => {
    // Owner ruling: Tamil almanac naming over Sanskrit.
    expect(almanacMuhurthamLabel({ status: "ON_LIST", pirai: "VALARPIRAI" }, "ta")?.pirai).toBe("வளர்பிறை");
    expect(almanacMuhurthamLabel({ status: "ON_LIST", pirai: "THEIPIRAI" }, "ta")?.pirai).toBe("தேய்பிறை");
  });

  it("keeps both negative states quiet, and keeps them apart", () => {
    const unlisted = almanacMuhurthamLabel({ status: "NOT_ON_LIST" }, "en");
    const noSheet = almanacMuhurthamLabel({ status: "NO_SHEET" }, "en");

    // Quiet: a list of well-scored dates must not read as a wall of faults.
    expect(unlisted?.tone).toBe("quiet");
    expect(noSheet?.tone).toBe("quiet");
    // Apart: telling a family their date failed a list nobody has published is
    // the conflation the three-state design exists to prevent.
    expect(unlisted?.text).not.toBe(noSheet?.text);
    expect(noSheet?.text).not.toMatch(/Not on/);
  });

  it("says nothing for an activity with no almanac verdict", () => {
    // Every non-wedding activity. The sourced sheets are wedding sheets.
    expect(almanacMuhurthamLabel(null, "en")).toBeNull();
    expect(almanacMuhurthamLabel(undefined, "ta")).toBeNull();
  });

  it("is the only place either surface writes this wording", () => {
    /* Two surfaces render wedding slots from the same endpoint — the signed-in
       picker and the public muhurta calculator — in two different design
       systems. A doctrine answer applied to one of two surfaces is the DXA-08
       failure this repo has recorded twice, so this asserts neither renderer
       has its own copy of the strings. A grep, because the drift it guards
       against is a *new* literal appearing, which no render assertion sees. */
    const surfaces = [
      join(__dirname, "..", "components", "dashboard-plan-muhurta-picker-nova.tsx"),
      join(__dirname, "..", "app", "(marketing)", "tools", "muhurta-calculator", "MuhurtaTool.tsx"),
    ];
    for (const file of surfaces) {
      const src = readFileSync(file, "utf8");
      expect(src).toContain("almanacMuhurthamLabel");
      // Quoted exactly as a rendered string literal. The picker's filter control
      // legitimately carries "Almanac muhurtham day filter" as an aria-label, so
      // a bare substring match would fire on a label that is not this wording.
      expect(src).not.toContain('"Almanac muhurtham day"');
      expect(src).not.toContain("Not on the almanac muhurtham list");
      // The pirai *key*, not its Tamil rendering: வளர்பிறை is also the
      // picker's own lunar-fortnight filter option, which has nothing to do with
      // the almanac list. A surface that mapped the key itself would be the
      // second copy of the naming rule.
      expect(src).not.toContain("VALARPIRAI");
    }
  });
});
