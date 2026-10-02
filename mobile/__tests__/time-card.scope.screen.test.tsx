/**
 * R7 / R8 — the two kalam windows whose polarity is narrower than the strip
 * they sit in.
 *
 * `TimeCard` renders in a horizontal row beside Rahu Kalam and Yamagandam on
 * Today and on the Panchangam tab. Kuligai was re-tinted there (caution → sky
 * blue) to stop it reading as a general avoid period, and Durmuhurtham was
 * added in the caution tint. A tint is not a carrier of meaning: it is invisible
 * to a screen reader, invisible to a colour-blind reader, and says nothing at
 * all to a sighted reader who has no legend. Both windows therefore carry their
 * scope in words, wired to the kind rather than to the screen, so that no
 * surface can render the window without the clause.
 *
 * Rendered with no LanguageProvider ancestor, so `useI18n` falls back to the
 * context default (`lang: "ta"`) — the Tamil clause is what a default install
 * shows, which is precisely the half an English-only pass cannot see.
 */
import React from "react";
import { render, screen } from "@testing-library/react-native";

import { TimeCard } from "@/components/TimeCard";

describe("TimeCard scope notes", () => {
  it("says what Kuligai is for, rather than leaving a blue card unexplained", () => {
    render(<TimeCard kind="kuligai" start="08:56" end="10:31" />);

    expect(screen.getByText("குளிகை")).toBeTruthy();
    expect(
      screen.getByText("மீண்டும் நிகழ, தொடர அல்லது வளர வேண்டிய செயல்களுக்கு; பொதுவான தவிர்ப்பு அல்ல"),
    ).toBeTruthy();
  });

  it("limits Durmuhurtham to auspicious work and new beginnings", () => {
    render(<TimeCard kind="durmuhurtham" start="10:31" end="11:18" />);

    expect(screen.getByText("துர்முகூர்த்தம்")).toBeTruthy();
    expect(screen.getByText("சுப / புதிய தொடக்கங்களுக்கு மட்டும் தவிர்க்கவும்")).toBeTruthy();
    // The name stays a name. It is reused in chips, legends and accessible
    // labels where a clause does not fit, so the clause lives beside it.
    expect(screen.queryByText(/துர்முகூர்த்தம் ·/)).toBeNull();
  });

  it("leaves the unconditional windows alone — they need no qualifier", () => {
    const { queryAllByText } = render(<TimeCard kind="rahu_kalam" start="13:42" end="15:18" />);

    expect(screen.getByText("ராகு காலம்")).toBeTruthy();
    expect(queryAllByText(/தவிர்க்கவும்/)).toHaveLength(0);
  });
});
