import { describe, expect, it } from "vitest";

import { classifyPeyarchiToneFromMoon } from "./peyarchi";

describe("peyarchi tone classifier", () => {
  it("treats Jupiter 7th from Moon as supportive (not red)", () => {
    expect(classifyPeyarchiToneFromMoon("JUPITER", 7)).toBe("supportive");
  });

  it("keeps Jupiter 10th from Moon neutral", () => {
    expect(classifyPeyarchiToneFromMoon("JUPITER", 10)).toBe("neutral");
  });

  it("treats Jupiter 8th from Moon as caution", () => {
    expect(classifyPeyarchiToneFromMoon("JUPITER", 8)).toBe("caution");
  });

  // Ruling D2 (astrologer, 2026-10-04) replaced the earlier "soften Sade Sati
  // to neutral" product rule: Saturn outside 3/6/11 always needs care.
  it("treats Saturn Sade Sati houses (12/1/2) as caution (D2)", () => {
    expect(classifyPeyarchiToneFromMoon("SATURN", 12)).toBe("caution");
    expect(classifyPeyarchiToneFromMoon("SATURN", 1)).toBe("caution");
    expect(classifyPeyarchiToneFromMoon("SATURN", 2)).toBe("caution");
  });

  it("treats Saturn 5/7/9 from Moon as caution too — not only the named cycles (D2)", () => {
    expect(classifyPeyarchiToneFromMoon("SATURN", 5)).toBe("caution");
    expect(classifyPeyarchiToneFromMoon("SATURN", 7)).toBe("caution");
    expect(classifyPeyarchiToneFromMoon("SATURN", 9)).toBe("caution");
  });

  it("grades Jupiter 1/3/4/10 as neutral (Vinaadi 'Mixed', D3) and 6/8/12 as caution", () => {
    for (const h of [1, 3, 4, 10]) expect(classifyPeyarchiToneFromMoon("JUPITER", h)).toBe("neutral");
    for (const h of [6, 8, 12]) expect(classifyPeyarchiToneFromMoon("JUPITER", h)).toBe("caution");
  });

  it("treats Saturn Ashtama Sani (8th) as caution", () => {
    expect(classifyPeyarchiToneFromMoon("SATURN", 8)).toBe("caution");
  });

  it("treats only 3/6/11 from Moon as supportive for Saturn (classical gochara)", () => {
    expect(classifyPeyarchiToneFromMoon("SATURN", 3)).toBe("supportive");
    expect(classifyPeyarchiToneFromMoon("SATURN", 6)).toBe("supportive");
    expect(classifyPeyarchiToneFromMoon("SATURN", 11)).toBe("supportive");
  });

  it("treats Saturn 10th from Moon (kandaka kendra) as caution, never supportive (D2)", () => {
    expect(classifyPeyarchiToneFromMoon("SATURN", 10)).toBe("caution");
  });
});
