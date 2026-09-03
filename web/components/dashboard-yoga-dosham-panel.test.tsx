/**
 * Regression test for the Gaja Kesari key-corruption bug: every lookup in
 * this file used to apply name.toUpperCase().replace("GAJA_KESARI",
 * "GAJA_KESARI_YOGA") unconditionally, which corrupts the real engine value
 * "GAJA_KESARI_YOGA" into "GAJA_KESARI_YOGA_YOGA" (the replace matches the
 * leading substring and leaves the original "_YOGA" suffix appended after
 * it) — silently missing every dictionary lookup and leaving the "What This
 * Brings" / "How to Strengthen This Yoga" / "Remedies" cards empty for the
 * one yoga name the engine actually emits. resolveYogaKey() tries the name
 * directly first, so these should always render real text.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { YogaDoshamPanel } from "./dashboard-yoga-dosham-panel";
import type { ChartYogaInsight } from "@/lib/types";

function makeGajaKesari(overrides: Partial<ChartYogaInsight> = {}): ChartYogaInsight {
  return {
    name: "GAJA_KESARI_YOGA",
    isPresent: true,
    strength: "STRONG",
    conditionsMet: ["jupiter_in_kendra_from_moon"],
    cancellationFactors: [],
    dashaActivated: false,
    activationScore: 0,
    isCurrentlyActive: false,
    descriptionTa: "",
    descriptionEn: "",
    ...overrides,
  };
}

describe("YogaDoshamPanel — Gaja Kesari outcomes/how-to/remedies cards", () => {
  it("renders real text for What This Brings, How to Strengthen, and Remedies once expanded", () => {
    render(<YogaDoshamPanel lang="en" yogas={[makeGajaKesari()]} doshams={[]} />);

    fireEvent.click(screen.getByText("Gaja Kesari Yoga"));

    expect(screen.getByText("What This Brings")).toBeInTheDocument();
    expect(
      screen.getByText(/People with this yoga may experience professional respect/),
    ).toBeInTheDocument();

    expect(screen.getByText("How to Strengthen This Yoga")).toBeInTheDocument();

    expect(screen.getByText("Remedies")).toBeInTheDocument();
    expect(screen.getByText(/Jupiter worship on Thursdays/)).toBeInTheDocument();
  });

  it("renders real Tamil text for the same cards when lang=ta", () => {
    render(<YogaDoshamPanel lang="ta" yogas={[makeGajaKesari()]} doshams={[]} />);

    fireEvent.click(screen.getByText("Gaja Kesari Yoga"));

    expect(screen.getByText(/இந்த யோகம் உள்ளவர்களுக்கு தொழில்முறை மரியாதை/)).toBeInTheDocument();
    expect(screen.getByText(/வியாழக்கிழமை குரு வழிபாடு/)).toBeInTheDocument();
  });
});
