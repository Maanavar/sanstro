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

  it("keeps Saturn Sade Sati houses neutral (12/1/2)", () => {
    expect(classifyPeyarchiToneFromMoon("SATURN", 12)).toBe("neutral");
    expect(classifyPeyarchiToneFromMoon("SATURN", 1)).toBe("neutral");
    expect(classifyPeyarchiToneFromMoon("SATURN", 2)).toBe("neutral");
  });

  it("treats Saturn Ashtama Sani (8th) as caution", () => {
    expect(classifyPeyarchiToneFromMoon("SATURN", 8)).toBe("caution");
  });
});
