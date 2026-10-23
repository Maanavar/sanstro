import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { dasaTimingsFor } from "@/lib/natchathiram-dasa-timings";
import { BhuktiTable, DasaSummaryTables, formatSpan, mahadashaSpanLabel } from "./natchathiram-dasa-timing";

/**
 * FSA-03 — the nakshatra pages print the engine's numbers, with their datum.
 *
 * The numbers themselves are proven in tests/test_natchathiram_dasa_timings.py;
 * this checks they reach the reader as written, in both languages, and that the
 * ruling's own drafting example comes out right (Venus–Rahu begins 7 yr 2 mo
 * into Venus dasa, not the 12 yr 6 mo first written).
 *
 * BLIND SPOT: the hand-written prose beside these tables is checked by
 * web/lib/natchathiram-dasa-prose.test.ts, not here.
 */
const BHARANI = dasaTimingsFor(2);
const ROHINI = dasaTimingsFor(4);
const venus = BHARANI.mahadashas.find((m) => m.lord === "VENUS")!;

describe("BhuktiTable", () => {
  it("names the datum in the column and prints Venus–Rahu at 7 yr 2 mo", () => {
    render(<BhuktiTable md={venus} lang="en" color="currentColor" />);
    expect(screen.getByRole("columnheader", { name: /After .* begins/ })).toBeTruthy();
    const row = screen.getByRole("row", { name: /Rahu/ });
    // Column by column, so a swapped "begins"/"lasts" pair fails.
    expect(within(row).getAllByRole("cell").map((c) => c.textContent)).toEqual([
      "7 yr 2 mo",
      "3 yr",
      "before birth – 7 yr 2 mo",
    ]);
  });

  it("says an opening-dasa bhukti may lie before birth instead of printing a negative age", () => {
    render(<BhuktiTable md={venus} lang="ta" color="currentColor" />);
    expect(screen.getAllByText(/பிறப்புக்கு முன்/).length).toBe(venus.bhuktis.length);
  });
});

describe("mahadasha labels", () => {
  it("states every later dasha's start as a range, from birth where the range reaches it", () => {
    const mars = ROHINI.mahadashas[1];
    expect(mahadashaSpanLabel(mars, "en")).toBe("7 yr · starts between birth and 10 yr");
    expect(mahadashaSpanLabel(mars, "ta")).toBe("7 வருடம் · தொடங்கும் வயது பிறப்பு – 10 வருடம்");
    expect(mahadashaSpanLabel(ROHINI.mahadashas[2], "en")).toBe("18 yr · starts between age 7 yr and 17 yr");
  });

  it("never states the opening dasha as a fixed age span", () => {
    expect(mahadashaSpanLabel(ROHINI.mahadashas[0], "en")).toBe("Running at birth · up to 10 yr left");
  });
});

describe("DasaSummaryTables", () => {
  it("prints the pada balances and each dasa's start range", () => {
    render(<DasaSummaryTables timings={ROHINI} lang="en" />);
    expect(screen.getByRole("row", { name: /^4 0 – 2 yr 6 mo$/ })).toBeTruthy();
    expect(screen.getByRole("row", { name: /Jupiter.*16 yr.*25 yr – 35 yr/ })).toBeTruthy();
  });
});

it("formatSpan writes the book's y-m-d and a bare 0", () => {
  expect(formatSpan([0, 4, 27], "en")).toBe("4 mo 27 d");
  expect(formatSpan([0, 0, 0], "ta")).toBe("0");
});
