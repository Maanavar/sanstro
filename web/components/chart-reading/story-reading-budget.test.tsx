/**
 * FTR-17 — the reading budget, as a gate.
 *
 * The owner's complaint was not a defect any test could see: ten tabs of
 * correct, bilingual, chart-specific prose that nobody could finish. The
 * Positions tab alone ran ~4,000 English words. The Story view's promise is a
 * number, so it is checked as one: every chapter, as it opens and before any
 * tap, stays at or under BUDGET visible words — in English and in Tamil — for
 * two real synthetic charts captured from the engine
 * (`__fixtures__/synthetic-readings.json`, via the dashboard bundle;
 * regenerate with `scripts/capture_reading_fixture.py`).
 *
 * The baseline is asserted in the same file: the Astrologer view's Positions
 * tab, which is the old panel's content unchanged, must still blow straight
 * through the budget. If that ever stops failing the budget, the measure has
 * gone blind (e.g. text moved into attributes) — not the reading short.
 *
 * Blind spots, recorded beside the PASS: a word count cannot judge clarity;
 * jsdom has no layout, so it says nothing about how long a chapter *looks*;
 * and the Tamil has not been read by a native reader.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import type {
  ChartCalculateResponseData,
  ChartExplanationData,
  PeyarchiEvent,
  SaniCycleData,
  TransitSnapshotData,
} from "@/lib/types";

import { ChartExplanationPanel } from "../dashboard-chart-explanation";
import fixtures from "./__fixtures__/synthetic-readings.json";
import { CHAPTER_ORDER, CHAPTER_TITLES } from "./reading-selectors";

export const BUDGET = 120;
// The Astrologer view is a lazy chunk; its first import can pass findBy's 1 s default.
const LAZY = { timeout: 5000 };

type Fixture = {
  name: string;
  today: string;
  chart: ChartCalculateResponseData;
  explanation: ChartExplanationData;
  transit: TransitSnapshotData | null;
  sani: SaniCycleData | null;
  peyarchiUpcoming: PeyarchiEvent[];
};

const readings = fixtures as unknown as Fixture[];

function words(text: string | null | undefined): number {
  return (text ?? "").split(/\s+/).filter(Boolean).length;
}

function renderReading(fixture: Fixture, lang: "en" | "ta", mode?: "TRADITIONAL") {
  return render(
    <ChartExplanationPanel
      lang={lang}
      chart={fixture.chart}
      explanation={fixture.explanation}
      summary={null}
      transit={fixture.transit}
      sani={fixture.sani}
      peyarchiUpcoming={fixture.peyarchiUpcoming}
      dasha={null}
      dashaAntar={[]}
      mode={mode}
      defaultOpen
    />,
  );
}

function chapterCounts(fixture: Fixture, lang: "en" | "ta"): Record<string, number> {
  const { unmount } = renderReading(fixture, lang);
  const counts: Record<string, number> = {};
  for (const id of CHAPTER_ORDER) {
    const title = lang === "ta" ? CHAPTER_TITLES[id].ta : CHAPTER_TITLES[id].en;
    fireEvent.click(screen.getByRole("tab", { name: new RegExp(title) }));
    counts[id] = words(screen.getByRole("tabpanel").textContent);
  }
  unmount();
  return counts;
}

beforeEach(() => window.localStorage.clear());

it("the fixture carries more than one chart, so one lucky chart cannot pass the gate alone", () => {
  expect(readings.length).toBeGreaterThanOrEqual(2);
});

describe.each(readings.map((r) => [r.name, r] as const))("reading budget — %s", (_name, fixture) => {
  it.each(["en", "ta"] as const)("every Story chapter opens at or under the budget (%s)", (lang) => {
    const counts = chapterCounts(fixture, lang);
    for (const [id, count] of Object.entries(counts)) {
      expect(count, `${lang} chapter "${id}" shows ${count} words (budget ${BUDGET})`).toBeLessThanOrEqual(BUDGET);
      expect(count, `${lang} chapter "${id}" rendered nothing — the fixture or the chapter broke`).toBeGreaterThan(5);
    }
  });

  // Plan §3.1: Tamil must come in at or under the English count (it measures
  // ~0.7×). A Tamil chapter longer than its English twin means a Tamil-only
  // branch is printing something English readers do not get.
  it("no Tamil chapter runs longer than its English twin", () => {
    const en = chapterCounts(fixture, "en");
    const ta = chapterCounts(fixture, "ta");
    for (const id of CHAPTER_ORDER) {
      expect(ta[id], `chapter "${id}": ta ${ta[id]} > en ${en[id]}`).toBeLessThanOrEqual(en[id]);
    }
  });

  // FTR-18: on the Family page §4 prints the summary's strengths/watch-outs,
  // so Chapter 4 links there instead of repeating them (browser gate:
  // e2e/chart-reading-say-once.spec.ts). Without that host it keeps them.
  it("Chapter 4 says the summary lines once: here alone, a link beside §4", () => {
    const first = fixture.explanation.summary.positives[0];
    expect(first, "fixture has no summary positives to check").toBeTruthy();
    const open = (onOpenSection?: () => void) => {
      const view = render(
        <ChartExplanationPanel
          lang="en"
          chart={fixture.chart}
          explanation={fixture.explanation}
          summary={null}
          transit={fixture.transit}
          sani={fixture.sani}
          peyarchiUpcoming={fixture.peyarchiUpcoming}
          dasha={null}
          dashaAntar={[]}
          onOpenSection={onOpenSection}
          defaultOpen
        />,
      );
      fireEvent.click(screen.getByRole("tab", { name: /Gifts & care/ }));
      const text = screen.getByRole("tabpanel").textContent ?? "";
      view.unmount();
      return text;
    };
    expect(open()).toContain(first.en);
    const beside = open(() => {});
    expect(beside).not.toContain(first.en);
    expect(beside).toContain("Chart strengths and watch-outs");
  });

  it("a tapped planet adds a short detail card, not a wall", () => {
    renderReading(fixture, "en");
    fireEvent.click(screen.getByRole("tab", { name: /Your nine planets/ }));
    const panel = screen.getByRole("tabpanel");
    const before = words(panel.textContent);
    fireEvent.click(within(panel).getByRole("button", { name: /^Sun/ }));
    const added = words(panel.textContent) - before;
    // Meaning + reassurance + at most two why-lines + the aspect summary.
    expect(added, `tapping a planet added ${added} words`).toBeLessThanOrEqual(BUDGET);
  });

  it("baseline: the old Positions tab (now the Astrologer view) is far over the budget", async () => {
    renderReading(fixture, "en", "TRADITIONAL");
    // The Astrologer view is a lazy chunk; wait for it.
    fireEvent.click(await screen.findByText("Where your planets are placed", undefined, LAZY));
    const container = screen.getByRole("tablist", { name: "Reading sections" }).parentElement!;
    expect(words(container.textContent)).toBeGreaterThan(BUDGET * 10);
  });
});
