import { describe, expect, it } from "vitest";
import type { MatchConfidence } from "@vinaadi/shared/api/numerology";
import { CONFIDENCE_CHIP, CONFIDENCE_LABEL, CONFIDENCE_TONE, pick } from "@/lib/baby-name-copy";

// Every value app/calculations/numerology_naming.py MatchConfidence can put on
// a baby-name candidate. "no_match" is real: a parent's own shortlist name
// whose opening letter opens no paadham ("Zara", "Xavier") is scored by
// evaluate_against_target and comes back with it. Both baby-name surfaces
// render `pick(CONFIDENCE_CHIP[c.confidence])`, which threw on it.
const SERVER_CONFIDENCES: MatchConfidence[] = ["confirmed", "tamil_only", "latin_only", "ambiguous", "no_match"];

describe("baby-name confidence copy", () => {
  it.each(SERVER_CONFIDENCES)("renders a chip, a label and a tone for %s", (confidence) => {
    for (const ta of [false, true]) {
      expect(() => pick(CONFIDENCE_CHIP[confidence], ta)).not.toThrow();
      expect(pick(CONFIDENCE_CHIP[confidence], ta)).toBeTruthy();
      expect(pick(CONFIDENCE_LABEL[confidence], ta)).toBeTruthy();
    }
    expect(CONFIDENCE_TONE[confidence]).toBeTruthy();
  });
});
