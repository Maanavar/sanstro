/** Life focus, Phase 3: the month grid's "Good days" chip.
 *
 * What this can see: the chip, its status line, and which cells name themselves
 * as good days. What it cannot see: whether the dates are right. They come from
 * the activity-timing engine unchanged; `supportiveFocusDates` in
 * lib/life-focus.test.ts covers the SUPPORTS-only filter. Fixtures are synthetic. */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { PanchangamMonthDayEntry } from "@/lib/types";
import { MonthlyCalendarViewNova } from "./dashboard-calendar-monthly-nova";

function day(dateLocal: string): PanchangamMonthDayEntry {
  return {
    dateLocal,
    tamilDate: { ta: "ஐப்பசி 1", en: "Aippasi 1" },
    weekday: "MONDAY",
    tithiNumber: 5,
    tithiName: "Panchami",
    tithiPaksha: "SHUKLA",
    nakshatraName: "Rohini",
    festivals: [],
    isTamilMuhurthamDay: false,
    isSubhaMuhurtham: false,
    isSubhaMuhurthamStrict: false,
    isKarinaal: false,
  };
}

const ENTRIES = Array.from({ length: 31 }, (_, i) => day(`2026-10-${String(i + 1).padStart(2, "0")}`));

type FocusDays = NonNullable<Parameters<typeof MonthlyCalendarViewNova>[0]["focusDays"]>;

function renderGrid(focusDays: FocusDays | null, lang: "en" | "ta" = "en") {
  return render(
    <MonthlyCalendarViewNova
      lang={lang}
      year={2026}
      month={10}
      monthly={{ entries: ENTRIES }}
      isLoading={false}
      error={null}
      hasLocation
      selectedDate="2026-10-01"
      todayDate="2026-10-01"
      onPrevMonth={() => {}}
      onNextMonth={() => {}}
      onSelectDate={() => {}}
      focusDays={focusDays}
    />,
  );
}

const base = (overrides: Partial<FocusDays>): FocusDays => ({
  label: "Career",
  on: false,
  onToggle: () => {},
  dates: new Set(["2026-10-09", "2026-10-15"]),
  loading: false,
  failed: false,
  ...overrides,
});

const markedCells = () => screen.queryAllByRole("button", { name: /Good day for Career/ });

describe("Calendar 'Good days' chip (Life focus Phase 3)", () => {
  it("is absent without a focus that has activities", () => {
    renderGrid(null);
    expect(screen.queryByRole("button", { name: /Good days/ })).toBeNull();
  });

  it("is off by default and marks nothing while off", () => {
    renderGrid(base({}));
    expect(screen.getByRole("button", { name: "Good days: Career" }).getAttribute("aria-pressed")).toBe("false");
    expect(markedCells()).toHaveLength(0);
  });

  it("marks exactly the supportive dates when on, and says what they are", () => {
    renderGrid(base({ on: true }));
    const names = markedCells().map((cell) => cell.getAttribute("aria-label") ?? "");
    expect(names).toHaveLength(2);
    expect(names[0]).toMatch(/^9 Oct/);
    expect(names[1]).toMatch(/^15 Oct/);
    expect(screen.getByRole("status").textContent).toMatch(/strongest supportive days for your focus/);
  });

  it("marks nothing while loading or after a failure, and says which", () => {
    const { unmount } = renderGrid(base({ on: true, loading: true }));
    expect(markedCells()).toHaveLength(0);
    expect(screen.getByRole("status").textContent).toMatch(/Finding/);
    unmount();
    renderGrid(base({ on: true, failed: true }));
    expect(markedCells()).toHaveLength(0);
    expect(screen.getByRole("status").textContent).toMatch(/Couldn't load/);
  });

  it("says so when the month has no supportive day", () => {
    renderGrid(base({ on: true, dates: new Set() }));
    expect(screen.getByRole("status").textContent).toMatch(/No strongly supportive days/);
  });

  it("is left alone by Clear / Show all", () => {
    const onToggle = vi.fn();
    renderGrid(base({ on: true, onToggle }));
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onToggle).not.toHaveBeenCalled();
    expect(markedCells()).toHaveLength(2);
  });

  it("names the marked day in Tamil without Latin text", () => {
    renderGrid(base({ on: true, label: "தொழில்" }), "ta");
    const marked = screen.getAllByRole("button", { name: /தொழில்: நல்ல நாள்/ });
    expect(marked).toHaveLength(2);
    expect(screen.getByRole("button", { name: "நல்ல நாட்கள்: தொழில்" })).toBeTruthy();
  });
});
