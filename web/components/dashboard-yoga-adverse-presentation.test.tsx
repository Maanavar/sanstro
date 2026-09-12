/**
 * Presentation contract for adverse yogas, and for a yoga that formed and was
 * then annulled. Astrologer ruling, 2026-09-11.
 *
 * Two defects are pinned shut here:
 *
 * 1. Valence was never consulted. Card colour, background, border and the ★
 *    glyph were all chosen from `strength` alone, so a STRONG Kemadruma —
 *    emotional isolation — rendered in the `--color-high` "good outcome" tokens
 *    behind a filled star, reading to the native as a prize.
 * 2. A fully-bhanga'd Kemadruma arrives with `isPresent=false` and its
 *    cancellation factors populated. The panel printed "your chart does not have
 *    the planetary positions needed", which is a different chart entirely: the
 *    Moon *was* isolated and a graha in a kendra from it then annulled the yoga.
 *    Classically that native carries the yoga's signature together with the
 *    resource to transcend it — a real reading, and it was being deleted.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  YogaDoshamPanel,
  yogaCardTone,
  buildWhyText,
  getYogaPowerContext,
  getDoshamPowerContext,
} from "./dashboard-yoga-dosham-panel";
import { yogaReadingStatus, isAdverseYoga } from "@vinaadi/shared/yogaDisplay";
import type { ChartYogaInsight } from "@/lib/types";

function yoga(overrides: Partial<ChartYogaInsight> = {}): ChartYogaInsight {
  return {
    name: "KEMADRUMA_YOGA",
    isPresent: true,
    strength: "STRONG",
    conditionsMet: ["no_planets_2nd_12th_from_moon"],
    cancellationFactors: [],
    dashaActivated: false,
    activationScore: 34,
    isCurrentlyActive: false,
    descriptionTa: "",
    descriptionEn: "",
    ...overrides,
  };
}

describe("adverse yogas are not styled as prizes", () => {
  it.each(["KEMADRUMA_YOGA", "SAKATA_YOGA", "DARIDRA_YOGA", "DARIDRA_PROXY_YOGA"])(
    "%s is classified adverse",
    (name) => {
      expect(isAdverseYoga(name)).toBe(true);
    },
  );

  it("a STRONG adverse yoga takes the low tokens, never the high ones", () => {
    const tone = yogaCardTone("KEMADRUMA_YOGA", "PRESENT", "STRONG");
    expect(tone.fg).toBe("var(--color-low)");
    expect(tone.bg).toBe("var(--color-low-bg)");
    expect(tone.border).toBe("var(--color-low-border)");
  });

  it("a STRONG benefic yoga keeps the high tokens and the star", () => {
    const tone = yogaCardTone("GAJA_KESARI_YOGA", "PRESENT", "STRONG");
    expect(tone.border).toBe("var(--color-high-border)");
    expect(tone.glyph).toBe("★");
  });

  it("does not give an adverse yoga the star glyph", () => {
    expect(yogaCardTone("KEMADRUMA_YOGA", "PRESENT", "STRONG").glyph).not.toBe("★");
  });

  it("renders a strong Kemadruma card in the low tokens, not the high ones", () => {
    const { container } = render(
      <YogaDoshamPanel lang="en" yogas={[yoga()]} doshams={[]} />,
    );
    expect(screen.getByText("Kemadruma Yoga")).toBeInTheDocument();
    // Scope to the card. The section header carries a neutral "N Present"
    // counter that is styled in the high tokens for every chart, adverse or not.
    const card = container.querySelector(".ui-card")!;
    expect(card.outerHTML).not.toContain("--color-high-border");
    expect(card.outerHTML).toContain("--color-low-border");
    expect(card.outerHTML).toContain("▲");
  });
});

describe("formed-then-annulled reads as Cancelled, not Absent", () => {
  const cancelled = yoga({
    isPresent: false,
    strength: "WEAK",
    cancellationFactors: ["planet_kendra_from_moon"],
  });

  it("resolves to CANCELLED even though isPresent is false", () => {
    expect(yogaReadingStatus(cancelled)).toBe("CANCELLED");
  });

  it("still resolves a genuinely unformed yoga to ABSENT", () => {
    expect(
      yogaReadingStatus({ isPresent: false, strength: "WEAK", cancellationFactors: [] }),
    ).toBe("ABSENT");
  });

  it("does not claim the chart lacked the positions", () => {
    const why = buildWhyText(
      cancelled.conditionsMet,
      cancelled.cancellationFactors,
      cancelled.isPresent,
      false,
      false,
      "en",
    );
    expect(why).not.toMatch(/does not have the planetary positions/);
    expect(why).toMatch(/did form/);
  });

  it("names the bhanga that annulled it, and the resource it leaves behind", () => {
    const why = buildWhyText(
      cancelled.conditionsMet,
      cancelled.cancellationFactors,
      cancelled.isPresent,
      false,
      false,
      "en",
    );
    expect(why).toMatch(/kendra from the Moon/);
    expect(why).toMatch(/resource/);
  });

  it("has the same branch in Tamil", () => {
    const why = buildWhyText(
      cancelled.conditionsMet,
      cancelled.cancellationFactors,
      cancelled.isPresent,
      false,
      false,
      "ta",
    );
    expect(why).toMatch(/நிவர்த்தி/);
  });

  it("labels the card Cancelled rather than Absent", () => {
    render(<YogaDoshamPanel lang="en" yogas={[cancelled]} doshams={[]} />);
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
    expect(screen.queryByText("Absent")).not.toBeInTheDocument();
  });
});

describe("the activation score no longer claims a transit input", () => {
  it("titles the pill with dasha only", () => {
    render(
      <YogaDoshamPanel
        lang="en"
        yogas={[yoga({ name: "GAJA_KESARI_YOGA", activationScore: 61 })]}
        doshams={[]}
      />,
    );
    const pill = screen.getByTitle(/activation score/i);
    expect(pill.getAttribute("title")).not.toMatch(/transit/i);
    expect(pill.getAttribute("title")).toMatch(/Dasha/);
  });
});

describe("adverse yogas have their own 'what it can do now' copy", () => {
  it.each(["KEMADRUMA_YOGA", "SAKATA_YOGA", "DARIDRA_YOGA", "DARIDRA_PROXY_YOGA"])(
    "%s does not fall through to the generic line",
    (name) => {
      const text = getYogaPowerContext(name, "STRONG", true, "en");
      expect(text).not.toMatch(/varies with your current Dasha period/);
      expect(text.length).toBeGreaterThan(80);
    },
  );

  it("has Tamil for each band", () => {
    for (const name of ["KEMADRUMA_YOGA", "SAKATA_YOGA", "DARIDRA_YOGA", "DARIDRA_PROXY_YOGA"]) {
      for (const strength of ["STRONG", "PARTIAL", "WEAK"]) {
        const ta = getYogaPowerContext(name, strength, true, "ta");
        expect(ta).toMatch(/[஀-௿]/);
        expect(ta).not.toMatch(/varies with/);
      }
    }
  });

  it("tells an adverse yoga's reader the pressure sits lighter, not that it awaits support", () => {
    const text = getYogaPowerContext("KEMADRUMA_YOGA", "STRONG", false, "en");
    expect(text).toMatch(/lighter/);
    expect(text).not.toMatch(/supporting Dasha/);
  });

  it("keeps the original wording for an unactivated benefic", () => {
    const text = getYogaPowerContext("GAJA_KESARI_YOGA", "STRONG", false, "en");
    expect(text).toMatch(/next supporting Dasha/);
  });
});

describe("no surface claims a transit input that does not exist", () => {
  it("keeps transits out of the yoga fallback copy", () => {
    for (const lang of ["en", "ta"] as const) {
      const text = getYogaPowerContext("SOME_UNMAPPED_YOGA", "STRONG", true, lang);
      expect(text).not.toMatch(/transit/i);
      expect(text).not.toMatch(/கிரகநகர்வு/);
    }
  });

  it("keeps transits out of the dosham fallback copy", () => {
    const dosham = {
      name: "SOME_UNMAPPED_DOSHAM",
      label: "ACTIVE",
      isPresent: true,
      isCancelled: false,
      strength: "STRONG",
      conditionsMet: [],
      cancellationFactors: [],
      dashaActivated: false,
    } as unknown as Parameters<typeof getDoshamPowerContext>[0];
    for (const lang of ["en", "ta"] as const) {
      const text = getDoshamPowerContext(dosham, lang);
      expect(text).not.toMatch(/transit/i);
      expect(text).not.toMatch(/கிரகநகர்வு/);
    }
  });
});

describe("the present-count chip is neutral, not a verdict", () => {
  it("does not paint the counter in the good-outcome tokens", () => {
    const { container } = render(
      <YogaDoshamPanel lang="en" yogas={[yoga()]} doshams={[]} />,
    );
    const chip = screen.getByText(/^1$|1 Present/).closest("span")!;
    expect(chip.getAttribute("style")).not.toMatch(/color-high|d9-active/);
  });
});

describe("the Daridra proxy is no longer labelled supportive", () => {
  it("names it as ours, not as a benefit", () => {
    render(
      <YogaDoshamPanel
        lang="en"
        yogas={[yoga({ name: "DARIDRA_PROXY_YOGA", strength: "PARTIAL" })]}
        doshams={[]}
      />,
    );
    expect(screen.getByText("Daridra Yoga (Vinaadi measure)")).toBeInTheDocument();
    expect(screen.queryByText(/supportive/i)).not.toBeInTheDocument();
  });
});

describe("Sakata's card states the condition the detector actually tests", () => {
  it("says 6th, 8th or 12th", () => {
    render(
      <YogaDoshamPanel
        lang="en"
        yogas={[yoga({ name: "SAKATA_YOGA", conditionsMet: ["moon_from_jupiter_12"] })]}
        doshams={[]}
      />,
    );
    fireEvent.click(screen.getByText("Sakata Yoga"));
    expect(screen.getByText(/6th, 8th, or 12th from Jupiter/)).toBeInTheDocument();
  });
});
