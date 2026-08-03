/**
 * The shared vocabulary, and the drift it exists to prevent.
 *
 * `app/tools/baby-name-finder` kept a private copy of `VERDICT_LABEL` because
 * `components/dashboard-numerology-shared.tsx` cannot be imported from a
 * marketing page — it pulls dashboard primitives and its inline styles read
 * `var(--color-*)`, which are defined only under `[data-ui="nova"] .cd-shell`,
 * so importing it would render text with undefined tokens. Two hand-kept
 * copies of the same enum vocabulary is how "Out of step" starts meaning two
 * different things in two tabs.
 */
import { describe, expect, it } from "vitest";

import type { AlignmentVerdict, FunctionalNature } from "@vinaadi/shared/api/numerology";

import {
  NATURE_LABEL,
  VERDICT_LABEL,
  natureLabel,
  plainSummaryText,
  verdictLabel,
  verdictTone,
} from "./numerology-labels";
import {
  NATURE_LABEL as DASH_NATURE_LABEL,
  VERDICT_LABEL as DASH_VERDICT_LABEL,
} from "@/components/dashboard-numerology-shared";

const VERDICTS: AlignmentVerdict[] = [
  "strongly_aligned",
  "aligned",
  "neutral",
  "misaligned",
  "strongly_misaligned",
];

const NATURES: FunctionalNature[] = [
  "LAGNA_LORD",
  "YOGAKARAKA",
  "TRIKONA",
  "KENDRA",
  "UPACHAYA",
  "MARAKA",
  "DUSTHANA",
  "NEUTRAL",
];

function alignment(over: Partial<Parameters<typeof plainSummaryText>[0]> = {}) {
  return {
    number: 9,
    verdict: "strongly_aligned" as AlignmentVerdict,
    functionalNature: "LAGNA_LORD" as FunctionalNature,
    grahaEn: "Mars",
    grahaTa: "செவ்வாய்",
    ...over,
  };
}

describe("shared numerology vocabulary", () => {
  it("is the same object the dashboard uses — not a second copy", () => {
    // Identity, not deep-equality: a copy that happens to match today is
    // exactly the state this file was created to end.
    expect(DASH_VERDICT_LABEL).toBe(VERDICT_LABEL);
    expect(DASH_NATURE_LABEL).toBe(NATURE_LABEL);
  });

  it("labels every verdict and every functional nature in both languages", () => {
    for (const v of VERDICTS) {
      expect(verdictLabel(v, "en")).toBeTruthy();
      expect(verdictLabel(v, "ta")).toBeTruthy();
      expect(verdictLabel(v, "en")).not.toBe(v);
      expect(verdictTone(v)).toBeTruthy();
    }
    for (const n of NATURES) {
      expect(natureLabel(n, "en")).toBeTruthy();
      expect(natureLabel(n, "ta")).toBeTruthy();
      expect(natureLabel(n, "en")).not.toBe(n);
    }
  });

  it("falls back to a readable string for an enum value it does not know", () => {
    // A backend that ships a new nature before the web bundle must not render
    // "STRONGLY_MISALIGNED" raw or crash.
    expect(verdictLabel("brand_new" as AlignmentVerdict, "en")).toBe("brand new");
    expect(natureLabel("BRAND_NEW" as FunctionalNature, "en")).toBe("BRAND NEW");
    expect(verdictTone("brand_new" as AlignmentVerdict)).toBe("neutral");
  });
});

describe("plainSummaryText", () => {
  it("names the child's chart on Baby Name Finder, never the reader's", () => {
    const text = plainSummaryText(alignment(), "child", "en");
    expect(text).toContain("this child's chart");
    expect(text).not.toContain("your chart");
  });

  it("still says 'your chart' everywhere else", () => {
    expect(plainSummaryText(alignment(), "self", "en")).toContain("your chart");
  });

  it("takes its direction from the verdict band, never the score", () => {
    // The summary and the last step of the derivation must agree; keying off
    // a raw score is how a card ends up saying "works with" above "Out of
    // step".
    expect(plainSummaryText(alignment({ verdict: "aligned" }), "child", "en")).toContain(
      "pull the same way",
    );
    expect(plainSummaryText(alignment({ verdict: "neutral" }), "child", "en")).toContain(
      "neither helps nor hinders",
    );
    expect(plainSummaryText(alignment({ verdict: "misaligned" }), "child", "en")).toContain(
      "pulls against",
    );
    expect(
      plainSummaryText(alignment({ verdict: "strongly_misaligned" }), "child", "en"),
    ).toContain("pulls against");
  });

  it("never restates the score — the card already shows it", () => {
    const text = plainSummaryText(alignment(), "child", "en");
    expect(text).not.toMatch(/\/\s*100/);
  });

  it("renders in Tamil without leaking English", () => {
    const text = plainSummaryText(alignment(), "child", "ta");
    expect(text).toContain("செவ்வாய்");
    expect(text).not.toContain("chart");
  });
});
