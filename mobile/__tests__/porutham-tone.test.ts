/**
 * AAU-06: the porutham hero's colour and success haptic follow the server's
 * band label, never the raw score. Since KI-01 the server labels a Rajju or
 * Vedha failure CAUTION at any score; the screen used to celebrate 8/10 and up.
 *
 * Blind spot: the source checks below read the screen's text; they do not
 * render it (the bottom sheet and haptics need a device-level harness).
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { poruthamTone } from "@vinaadi/shared/utils/score";

const SCREEN = readFileSync(path.join(__dirname, "../app/(tabs)/tools/porutham.tsx"), "utf8");

describe("poruthamTone", () => {
  it("celebrates only the server's EXCELLENT and GOOD", () => {
    expect(poruthamTone("EXCELLENT")).toBe("high");
    expect(poruthamTone("GOOD")).toBe("high");
    expect(poruthamTone("AVERAGE")).toBe("mid");
    // An 8/10 with Rajju failing arrives as CAUTION.
    expect(poruthamTone("CAUTION")).toBe("low");
    expect(poruthamTone(undefined)).toBe("low");
  });
});

describe("mobile porutham screen", () => {
  it("never decides tone from totalScore", () => {
    expect(SCREEN).not.toMatch(/totalScore\s*>=/);
    expect(SCREEN).toMatch(/poruthamTone\(result\.label\)/);
  });

  it("fires the success haptic only inside an effect keyed on the result", () => {
    const calls = [...SCREEN.matchAll(/NotificationFeedbackType\.Success/g)];
    expect(calls).toHaveLength(1);
    const effect = SCREEN.match(/useEffect\(\(\) => \{[\s\S]*?\}, \[result\]\);/);
    expect(effect?.[0]).toContain("NotificationFeedbackType.Success");
  });
});
