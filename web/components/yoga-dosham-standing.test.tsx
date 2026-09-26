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

  it("maps natal strength to one scale for yogas and doshams alike", () => {
    expect(doshamStanding(DOSHAMS[0], "en")).toEqual({ label: "Mitigated", tone: "good" });
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

  it("lists under the heading only what the running dasha lights", () => {
    const { container } = renderSummary(lang);
    const quietHeading = lang === "ta" ? "ஜாதகத்தில் உள்ளது, ஆனால் இந்த தசையில் செயல்படவில்லை" : "In the chart, quiet in this dasha";
    expect(screen.getByText(quietHeading)).toBeInTheDocument();
    const [runningPart, quietPart] = (container.textContent ?? "").split(quietHeading);
    // Lit by the running dasha: Rahu-Ketu and Raja Yoga. Not lit: Marana
    // Karaka, Gaja Kesari, and the mitigated Sevvai.
    for (const lit of ["RAHU_KETU_DOSHAM", "RAJA_YOGA"]) {
      expect(runningPart).toContain(displayName(lit, lang));
      expect(quietPart).not.toContain(displayName(lit, lang));
    }
    for (const unlit of ["MARANA_KARAKA_STHANA", "GAJA_KESARI_YOGA", "SEVVAI_DOSHAM"]) {
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
