import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VARUDA_PALAN_COMPONENTS, VARUDA_PALAN_NAME } from "@vinaadi/shared/constants";

import type { Lang } from "@/lib/i18n";
import type { VarshaphalaData } from "@/lib/types";
import { VarshaphalaPanel } from "./dashboard-varshaphala-panel";

/**
 * Varuda Palan — owner ruling 2026-10-21 (FSA-17, §8.3).
 *
 * The data below deliberately CARRIES favourable months, as the backend used to
 * send: a constant per score band, identical for every chart. The panel must
 * not render them even if a backend regression sends them again — they come
 * back only when derived from the chart by a method ruled on first.
 *
 * The disclosure table must be on the paid feature itself, in both languages.
 *
 * BLIND SPOT: mobile renders the same shared table on its own screen; this test
 * does not cover it. The months are also stopped at the source
 * (`tests/test_charts_api.py::test_varshaphala_never_sends_favourable_months_fsa17`).
 */
const YEAR = new Date().getFullYear();

const DATA = {
  chartId: "00000000-0000-0000-0000-000000000000",
  year: YEAR,
  solarReturnDate: `${YEAR}-05-10`,
  solarReturnLagnaRasi: 5,
  solarReturnLagnaName: "Simham",
  munthaRasi: 9,
  munthaRasiName: "Dhanusu",
  munthaHouseFromSrLagna: 5,
  yearLord: "SATURN",
  yearLordHouse: 10,
  tajakaPlanets: [],
  itthasalaPairs: [],
  isarafaPairs: [],
  areaOutlook: [
    { area: "LITIGATION", score: 74, narrativeTa: "வரி.", narrativeEn: "Line.", favourableMonths: [2, 4, 6, 9, 11] },
  ],
} as unknown as VarshaphalaData;

function renderPanel(lang: Lang) {
  return render(<VarshaphalaPanel lang={lang} chartId="c1" data={DATA} loading={false} onLoad={() => {}} />);
}

describe.each<Lang>(["en", "ta"])("Varuda Palan panel (%s)", (lang) => {
  it("is named Varuda Palan, not Varshaphala", () => {
    renderPanel(lang);
    expect(screen.getByText(VARUDA_PALAN_NAME[lang])).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/Varshaphala|வர்ஷபல|வருஷபல/);
  });

  it("never renders favourable months, even when the data carries them", () => {
    renderPanel(lang);
    // The disclosure table names "Favourable months — Hidden" on purpose; the
    // months themselves must appear nowhere else.
    const outside = document.body.cloneNode(true) as HTMLElement;
    outside.querySelector('[data-testid="varuda-palan-disclosure"]')?.remove();
    expect(outside.textContent).not.toMatch(/Favourable months|சாதக(மான)? மாதங்கள்|Feb|Apr|2, 4, 6/);
  });

  it("shows the component-by-component disclosure on the feature itself", () => {
    renderPanel(lang);
    const table = screen.getByTestId("varuda-palan-disclosure");
    for (const row of VARUDA_PALAN_COMPONENTS) {
      expect(within(table).getByText(row.label[lang])).toBeTruthy();
    }
    expect(VARUDA_PALAN_COMPONENTS.find((r) => r.key === "FAVOURABLE_MONTHS")?.status).toBe("HIDDEN");
    expect(VARUDA_PALAN_COMPONENTS.find((r) => r.key === "YEAR_LORD")?.status).toBe("APPROXIMATE");
  });

  it("renders the area through its label, never the wire code", () => {
    renderPanel(lang);
    expect(document.body.textContent).not.toContain("LITIGATION");
  });
});
