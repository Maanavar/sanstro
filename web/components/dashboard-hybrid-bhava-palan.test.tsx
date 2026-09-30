import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { HyBhavaTable } from "./dashboard-hybrid-parts";
import type { ChartCalculateResponseData, ChartExplanationBhava } from "@/lib/types";

/**
 * The per-house reading (`ChartExplanationBhava`) shipped from the API for months
 * with zero consumers in web/ or mobile/, while this very table drew a "Status"
 * dot from `lordScore` alone — the 50% bhavadhipati term — so an empty 7th with a
 * strong lord elsewhere and Saturn aspecting it rendered GREEN.
 *
 * These tests pin the RENDERED output in both languages, because that is where
 * every defect in this class has lived:
 *   · the band must reach the reader as a WORD, not as a colour (WCAG 1.4.1);
 *   · the raw bala must never be printed — the scale is centred at 45 with a
 *     stdev of 6, so "38/100" reads as a failing grade on an ordinary house;
 *   · `title=` must not come back, since no text probe and no touch user can
 *     reach it;
 *   · Tamil is not optional for this class — the audit harness pins the account
 *     to lang "en", so an English-only pass proves nothing about the Tamil side.
 *
 * BLIND SPOT, recorded deliberately: jsdom has no layout, so nothing here can see
 * reflow at 375px, focus-ring visibility, or the non-text contrast of the chip
 * border (axe has no 1.4.11 implementation either). Those need a real browser and
 * a hand measurement.
 */
function sampleChart(): ChartCalculateResponseData {
  return {
    chartId: "chart-1",
    lagna: { rasi: 1, rasiName: "Mesham", absoluteLongitude: 10, degreeInRasi: 10, d9Rasi: 4, nakshatra: 1, nakshatraName: "Aswini", pada: 4 },
    planets: [
      { graha: "SUN", rasi: 1, houseFromLagna: 1, rasiName: "Mesham", absoluteLongitude: 20, degreeInRasi: 20, nakshatra: 2, nakshatraName: "Bharani", pada: 2, speedDegPerDay: 1, isRetrograde: false, isCombust: false, d9Rasi: 2, d9Dignity: "ENEMY_SIGN", isVargottama: false, showRetrogradeBadge: false },
      { graha: "SATURN", rasi: 10, houseFromLagna: 10, rasiName: "Makaram", absoluteLongitude: 280, degreeInRasi: 10, nakshatra: 21, nakshatraName: "Uthiradam", pada: 2, speedDegPerDay: 0.1, isRetrograde: false, isCombust: false, d9Rasi: 10, d9Dignity: "OWN_SIGN", isVargottama: true, showRetrogradeBadge: false },
    ],
    calculationVersion: "v1",
    calculationStatus: "completed",
    warnings: [],
  } as unknown as ChartCalculateResponseData;
}

/** House 7 — empty, lord weak elsewhere, Saturn aspecting it. The exact case the
 *  old lordScore dot rendered green. */
function seventh(): ChartExplanationBhava {
  return {
    house: 7,
    rasi: 7,
    rasiName: "Thulam",
    lord: "VENUS",
    lordHouse: 8,
    lordStrength: 29,
    occupants: [],
    aspectingPlanets: ["SATURN"],
    bhavaBala: 38,
    theme: { ta: "உறவுகள்", en: "relationships" },
    explanation: { ta: "…", en: "…" },
    verdict: "NEEDS_CARE",
    polarity: "DIRECT",
    bandWord: { ta: "கவனம் தேவை", en: "Needs care" },
    houseLabel: { ta: "களத்திரம்", en: "Partnership" },
    framing: { ta: "இந்தத் துறைக்குக் கூடுதல் கவனம் தேவை.", en: "This area asks for more care than the rest of your chart." },
    why: { ta: "இதன் அதிபதி சுக்கிரன் 8-ஆம் வீட்டில் வலு குறைந்து அமர்ந்துள்ளார்.", en: "Its lord Venus sits in house 8 without much strength." },
    leanOn: [{ ta: "பொறுமை", en: "patience — with Saturn, delay is the remedy" }],
    goSlowlyWith: [{ ta: "அவசர முடிவு", en: "rushing to get it finished" }],
    karakaNote: null,
    polarityNote: null,
  };
}

/** House 6 — a QUIET dusthana, which is good news and must not be worded "Supported". */
function sixth(): ChartExplanationBhava {
  return {
    house: 6,
    rasi: 6,
    rasiName: "Kanni",
    lord: "MERCURY",
    lordHouse: 3,
    lordStrength: 31,
    occupants: [],
    aspectingPlanets: [],
    bhavaBala: 36,
    theme: { ta: "தடைகள்", en: "obstacles" },
    explanation: { ta: "…", en: "…" },
    verdict: "SUPPORTED",
    polarity: "INVERTED",
    bandWord: { ta: "அமைதி", en: "Quiet" },
    houseLabel: { ta: "ரிபு", en: "Obstacles & health" },
    framing: { ta: "இந்தத் துறை அமைதியாக உள்ளது.", en: "This area is quiet in your chart." },
    why: { ta: "இதன் அதிபதி புதன் வலு குறைந்து உள்ளார்.", en: "Its lord Mercury sits without much strength." },
    leanOn: [{ ta: "எழுதிப் பார்ப்பது", en: "writing it down before you say it" }],
    goSlowlyWith: [{ ta: "அதிகம் விளக்குவது", en: "over-explaining yourself" }],
    karakaNote: null,
    polarityNote: { ta: "6, 8, 12 தலைகீழாகப் படிக்கப்படுகின்றன.", en: "Houses 6, 8 and 12 are read the other way round." },
  };
}

function renderTable(lang: "ta" | "en") {
  return render(<HyBhavaTable lang={lang} chart={sampleChart()} bhavas={[seventh(), sixth()]} />);
}

/** The header's GlossaryTerm is also a <button>, so role=button alone picks that up
 *  instead of a house. Rows carry data-house for exactly this reason. */
function houseRows(container: HTMLElement): HTMLButtonElement[] {
  return Array.from(container.querySelectorAll<HTMLButtonElement>("button[data-house]"));
}

/** Address rows by house number, never by index: rows render 1..12, so the 6th
 *  house comes BEFORE the 7th and index 1 is not the second fixture. */
function row(container: HTMLElement, house: number): HTMLButtonElement {
  const el = container.querySelector<HTMLButtonElement>(`button[data-house="${house}"]`);
  if (!el) throw new Error(`no row for house ${house}`);
  return el;
}

describe("HyBhavaTable — band chip", () => {
  it("carries the band as a word, in English", () => {
    renderTable("en");
    expect(screen.getAllByText("Needs care").length).toBeGreaterThan(0);
  });

  it("carries the band as a word, in Tamil", () => {
    renderTable("ta");
    // queryAllByText, not a regex over textContent: adjacent chips concatenate
    // in textContent and a \bword\b probe over it cannot fail.
    expect(screen.getAllByText("கவனம் தேவை").length).toBeGreaterThan(0);
  });

  it("words a quiet dusthana as 'Quiet', never as 'Supported'", () => {
    renderTable("en");
    expect(screen.getAllByText("Quiet").length).toBeGreaterThan(0);
    expect(screen.queryByText("Supported")).toBeNull();
  });

  it("never prints the raw bhava bala, and brings back no title attribute", () => {
    const { container } = renderTable("en");
    // 38 and 36 are the fixture's bala values; house numbers only reach 12, so a
    // match here can only be the number leaking into the copy.
    expect(screen.queryAllByText(/\b38\b/)).toHaveLength(0);
    expect(screen.queryAllByText(/\b36\b/)).toHaveLength(0);
    expect(container.querySelectorAll("[title]")).toHaveLength(0);
  });
});

describe("HyBhavaTable — row expansion", () => {
  it("exposes each house as an expandable button, collapsed by default", () => {
    const { container } = renderTable("en");
    const rows = houseRows(container);
    expect(rows).toHaveLength(2);
    for (const row of rows) expect(row.getAttribute("aria-expanded")).toBe("false");
  });

  it("reveals the verdict, the why and both conduct columns on open", () => {
    const { container } = renderTable("en");
    const seventhRow = row(container, 7);
    fireEvent.click(seventhRow);
    expect(seventhRow.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText(/asks for more care/)).toBeTruthy();
    expect(screen.getByText(/Its lord Venus sits in house 8/)).toBeTruthy();
    expect(screen.getByText("Lean on")).toBeTruthy();
    expect(screen.getByText("Go slowly with")).toBeTruthy();
  });

  it("states the drishti landing on an EMPTY house — the case the old dot missed", () => {
    const { container } = renderTable("en");
    fireEvent.click(row(container, 7));
    expect(screen.getByText(/Aspects falling on it/)).toBeTruthy();
  });

  it("explains the inverted scale on a dusthana, so a green chip reads as intended", () => {
    const { container } = renderTable("en");
    fireEvent.click(row(container, 6));
    expect(screen.getByText(/read the other way round/)).toBeTruthy();
  });

  it("keeps only one row open at a time", () => {
    const { container } = renderTable("en");
    fireEvent.click(row(container, 6));
    fireEvent.click(row(container, 7));
    expect(row(container, 6).getAttribute("aria-expanded")).toBe("false");
    expect(row(container, 7).getAttribute("aria-expanded")).toBe("true");
  });

  it("ties each panel to its row with aria-controls", () => {
    const { container } = renderTable("en");
    const seventhRow = row(container, 7);
    fireEvent.click(seventhRow);
    const id = seventhRow.getAttribute("aria-controls")!;
    expect(container.querySelector(`#${id}`)).toBeTruthy();
  });
});

/**
 * Readers compared the house chips with the planet scores lower on the page and
 * read a green house beside a weak lord as a contradiction; the old column title
 * "Reading" sat right after "Planets", so the chip looked like a planet grade.
 * The titles must say the chip rates the house, in both languages.
 */
describe("HyBhavaTable — titles say what the chip rates", () => {
  it("titles the chip column as the house's outlook, in English", () => {
    renderTable("en");
    expect(screen.getByText("House outlook")).toBeTruthy();
    expect(screen.getByText("Planets in it")).toBeTruthy();
    expect(screen.queryByText("Reading")).toBeNull();
    expect(screen.getByText(/Each house is rated as a whole/)).toBeTruthy();
  });

  it("titles the chip column as the house's outlook, in Tamil", () => {
    renderTable("ta");
    expect(screen.getByText("வீட்டின் நிலை")).toBeTruthy();
    expect(screen.getByText("அதில் உள்ள கிரகங்கள்")).toBeTruthy();
    expect(screen.getByText(/மூன்றையும் சேர்த்துக் கணிக்கப்படுகிறது/)).toBeTruthy();
  });
});

/**
 * A green 10th under a weak Saturn — Saturn's own chip, lower on the page, says
 * "Needs support". The contradiction is seen in the CLOSED row, so the line that
 * answers it must be there too, not only in the expanded panel.
 */
describe("HyBhavaTable — contrast line", () => {
  function tenth(): ChartExplanationBhava {
    return {
      ...seventh(),
      house: 10,
      rasi: 10,
      rasiName: "Magaram",
      lord: "SATURN",
      verdict: "SUPPORTED",
      bandWord: { ta: "வலுவானது", en: "Supported" },
      houseLabel: { ta: "தொழில்", en: "Work & standing" },
      contrast: {
        ta: "அதிபதி சனி வலு குறைந்தவர்; ஆனால் சந்திரன், குரு ஆகியோர் இந்த வீட்டைத் தாங்குகின்றனர்.",
        en: "Lord Saturn is weak, but Moon and Jupiter carry this house.",
      },
    };
  }

  it("shows in the closed row, in English", () => {
    const { container } = render(<HyBhavaTable lang="en" chart={sampleChart()} bhavas={[seventh(), tenth()]} />);
    const r = row(container, 10);
    expect(r.getAttribute("aria-expanded")).toBe("false");
    expect(r.textContent).toContain("Lord Saturn is weak, but Moon and Jupiter carry this house.");
  });

  it("shows in the closed row, in Tamil", () => {
    const { container } = render(<HyBhavaTable lang="ta" chart={sampleChart()} bhavas={[seventh(), tenth()]} />);
    expect(row(container, 10).textContent).toContain("ஆனால் சந்திரன், குரு ஆகியோர் இந்த வீட்டைத் தாங்குகின்றனர்");
  });

  it("adds nothing to a row whose payload carries no contrast", () => {
    const { container } = render(<HyBhavaTable lang="en" chart={sampleChart()} bhavas={[seventh(), tenth()]} />);
    expect(row(container, 7).textContent).not.toContain("Lord ");
  });
});

describe("HyBhavaTable — older servers", () => {
  it("claims no verdict when the payload has no bhavas, instead of the old dot", () => {
    const { container } = render(<HyBhavaTable lang="en" chart={sampleChart()} />);
    expect(houseRows(container)).toHaveLength(0);
    expect(screen.queryByText("Needs care")).toBeNull();
  });
});
