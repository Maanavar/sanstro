/**
 * One chart, one answer per question, on every surface.
 *
 * Reported 2026-09-23: the Charts tab's yoga & dosham card read "Partial" for
 * Rahu-Ketu Dosham and Marana Karaka Sthana while Life Areas' "Active right
 * now" read "Active" for both. They were answering different questions (natal
 * strength vs. not-cancelled) in the same chip slot, and the Life Areas heading
 * claimed dasha *and transit* triggering for items the dasha was not touching.
 *
 * The fixture below is synthetic but shaped like that report: one mitigated
 * dosham, one PARTIAL dosham the running dasha lights, one PARTIAL dosham it
 * does not, one yoga it lights and one it does not.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  doshamPresenceLabel,
  doshamStanding,
  isRunningInDasha,
  yogaStanding,
} from "@vinaadi/shared/yogaDisplay";
import type { ChartDoshamInsight, ChartYogaInsight } from "@/lib/types";
import type { Lang } from "@/lib/i18n";
import { HyYogaDoshaCard, buildYogaDoshaItems } from "./dashboard-hybrid-parts";
import { YogaActivationSummary } from "./dashboard-life-areas-tab-nova";
import { displayName } from "./dashboard-yoga-dosham-panel";

function dosham(overrides: Partial<ChartDoshamInsight>): ChartDoshamInsight {
  return {
    name: "SEVVAI_DOSHAM",
    isPresent: true,
    isCancelled: false,
    strength: "PARTIAL",
    label: "",
    category: "MARRIAGE",
    conditionsMet: [],
    cancellationFactors: [],
    missingData: [],
    dashaActivated: false,
    descriptionTa: "",
    descriptionEn: "",
    explanationWhatTa: "",
    explanationWhatEn: "",
    explanationWhyTa: "",
    explanationWhyEn: "",
    explanationHowTa: "",
    explanationHowEn: "",
    ...overrides,
  };
}

function yoga(overrides: Partial<ChartYogaInsight>): ChartYogaInsight {
  return {
    name: "GAJA_KESARI_YOGA",
    isPresent: true,
    strength: "STRONG",
    conditionsMet: [],
    cancellationFactors: [],
    dashaActivated: false,
    activationScore: 34,
    isCurrentlyActive: false,
    descriptionTa: "",
    descriptionEn: "",
    ...overrides,
  };
}

const DOSHAMS: ChartDoshamInsight[] = [
  dosham({ name: "SEVVAI_DOSHAM", isCancelled: true, strength: "WEAK" }),
  dosham({ name: "RAHU_KETU_DOSHAM", strength: "PARTIAL", dashaActivated: true }),
  dosham({ name: "MARANA_KARAKA_STHANA", strength: "PARTIAL", dashaActivated: false }),
];
const YOGAS: ChartYogaInsight[] = [
  yoga({ name: "RAJA_YOGA", dashaActivated: true, isCurrentlyActive: true, activationScore: 70 }),
  yoga({ name: "GAJA_KESARI_YOGA" }),
];

function renderSummary(lang: Lang) {
  return render(<YogaActivationSummary lang={lang} yogas={YOGAS} doshams={DOSHAMS} onGoToChart={() => {}} />);
}

describe("shared standing resolver", () => {
  it("never calls a present dosham 'Active' — that word is dasha timing", () => {
    for (const d of DOSHAMS) {
      expect(doshamStanding(d, "en").label).not.toBe("Active");
      expect(doshamPresenceLabel(d, "en")).not.toBe("Active");
    }
    expect(doshamPresenceLabel(DOSHAMS[1], "en")).toBe("Present");
    expect(doshamPresenceLabel(DOSHAMS[1], "ta")).toBe("உண்டு");
  });

  it("a mitigated dosham names its residual, never a bare 'Mitigated' (DD-17)", () => {
    // An older payload with no `residual` falls back to mild — never to cleared.
    expect(doshamStanding(DOSHAMS[0], "en")).toEqual({ label: "Mitigated · mild residual", tone: "good" });
    expect(doshamStanding(DOSHAMS[0], "ta")).toEqual({ label: "நிவர்த்தி · லேசான மீதத் தாக்கம்", tone: "good" });
    // A moderate residual is not painted with the all-clear tone.
    expect(doshamStanding(dosham({ isCancelled: true, strength: "WEAK", residual: "MODERATE" }), "en"))
      .toEqual({ label: "Mitigated · moderate residual", tone: "mid" });
    expect(doshamStanding(dosham({ isPresent: false, strength: "WEAK" }), "en")).toEqual({ label: "Absent", tone: "muted" });
  });

  it("maps natal strength to one scale for yogas and doshams alike", () => {
    expect(doshamStanding(DOSHAMS[1], "en")).toEqual({ label: "Moderate", tone: "mid" });
    expect(doshamStanding(dosham({ strength: "STRONG" }), "en")).toEqual({ label: "Strong", tone: "caution" });
    expect(yogaStanding(YOGAS[0], "en")).toEqual({ label: "Strong", tone: "good" });
    // Valence before strength: an adverse yoga is never painted as a prize.
    expect(yogaStanding(yoga({ name: "KEMADRUMA_YOGA" }), "en").tone).toBe("caution");
  });

  it("a mitigated dosham is never 'running', even when its planet's dasha runs", () => {
    expect(isRunningInDasha(dosham({ isCancelled: true, dashaActivated: true }))).toBe(false);
    expect(isRunningInDasha(DOSHAMS[1])).toBe(true);
    expect(isRunningInDasha(DOSHAMS[2])).toBe(false);
  });
});

describe.each<Lang>(["en", "ta"])("Charts card and Life Areas agree (%s)", (lang) => {
  it("every item the Life Areas card shows carries the Charts card's word for it", () => {
    const chartsWords = new Map(
      buildYogaDoshaItems({ yogas: YOGAS, doshams: DOSHAMS, explanation: { en: "", ta: "" } }, lang)
        .map((it) => [it.name, it.label]),
    );
    const { container } = renderSummary(lang);
    const text = container.textContent ?? "";
    for (const item of [...DOSHAMS, ...YOGAS]) {
      const name = displayName(item.name, lang);
      const word = chartsWords.get(name);
      expect(word, `${name} missing from Charts card`).toBeTruthy();
      expect(text).toContain(name);
      // The chip or the quiet-list entry prints the same word beside the name.
      expect(text.includes(`${name}${word}`) || text.includes(`${name} (${word})`), `${name}: expected "${word}"`).toBe(true);
    }
  });

  it("answers the marriage doshams in their own block, then lists only what the running dasha lights", () => {
    const { container } = renderSummary(lang);
    const marriageHeading = lang === "ta" ? "திருமண தோஷங்கள் — உங்கள் ஜாதகத்தில்" : "Marriage doshams in your chart";
    const runningHeading = lang === "ta" ? "தற்போதைய தசையில் செயல்படுபவை" : "Running in your current dasha";
    const quietHeading = lang === "ta" ? "ஜாதகத்தில் உண்டு; இந்தக் காலத்தில் முதன்மைத் தாக்கம் இல்லை" : "Present in birth chart — not a dominant influence in the current period";
    expect(screen.getByText(marriageHeading)).toBeInTheDocument();
    expect(screen.getByText(quietHeading)).toBeInTheDocument();
    const text = container.textContent ?? "";
    const marriagePart = text.split(marriageHeading)[1].split(runningHeading)[0];
    const [runningPart, quietPart] = text.split(runningHeading)[1].split(quietHeading);
    // Sevvai and Rahu–Ketu are answered once, in their own block, whether or
    // not the dasha lights them (plan 2026-10-06) — the mitigated Sevvai too.
    for (const marriage of ["RAHU_KETU_DOSHAM", "SEVVAI_DOSHAM"]) {
      expect(marriagePart).toContain(displayName(marriage, lang));
      expect(runningPart).not.toContain(displayName(marriage, lang));
      expect(quietPart).not.toContain(displayName(marriage, lang));
    }
    // Everything else keeps the activation split: Raja Yoga is lit; Marana
    // Karaka and Gaja Kesari are not.
    expect(runningPart).toContain(displayName("RAJA_YOGA", lang));
    expect(quietPart).not.toContain(displayName("RAJA_YOGA", lang));
    for (const unlit of ["MARANA_KARAKA_STHANA", "GAJA_KESARI_YOGA"]) {
      expect(runningPart).not.toContain(displayName(unlit, lang));
      expect(quietPart).toContain(displayName(unlit, lang));
    }
  });
});

describe("Life Areas copy", () => {
  it("does not claim transits the engine never reads, and never stamps 'Active' on a dosham", () => {
    // Match whole elements, not `textContent`: adjacent chips concatenate
    // ("DoshamActiveRaja") and a \b regex over that sees no word boundary —
    // this check passed with "Active" on screen until it was made exact.
    const { container } = renderSummary("en");
    expect(container.textContent).not.toMatch(/transit/i);
    expect(screen.queryAllByText("Active")).toHaveLength(0);
  });

  it("the Charts card never prints 'Active' or 'Partial' in its chips", () => {
    render(<HyYogaDoshaCard lang="en" yogaDosham={{ yogas: YOGAS, doshams: DOSHAMS, explanation: { en: "", ta: "" } }} />);
    expect(screen.queryAllByText("Active")).toHaveLength(0);
    expect(screen.queryAllByText("Partial")).toHaveLength(0);
    expect(screen.getAllByText("Moderate")).toHaveLength(2);
  });
});
