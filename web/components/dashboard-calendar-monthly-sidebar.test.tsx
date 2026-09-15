/**
 * Calendar → Monthly: the agenda rail and the filter chips that gate it.
 *
 * The rail is one chronological agenda — a row per day, each opening the day
 * like a grid cell — and the filter chips above the grid are the only filter.
 * Fixtures are synthetic (repo fixture rule).
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { PanchangamFestival, PanchangamMonthDayEntry } from "@/lib/types";
import { MonthlyCalendarViewNova } from "./dashboard-calendar-monthly-nova";

function day(dateLocal: string, festivals: PanchangamFestival[], extra: Partial<PanchangamMonthDayEntry> = {}): PanchangamMonthDayEntry {
  return {
    dateLocal,
    tamilDate: { ta: "ஆவணி 1", en: "Aavani 1" },
    weekday: "MONDAY",
    tithiNumber: 5,
    tithiName: "Panchami",
    tithiPaksha: "SHUKLA",
    nakshatraName: "Rohini",
    festivals,
    isTamilMuhurthamDay: false,
    isSubhaMuhurtham: false,
    isSubhaMuhurthamStrict: false,
    isKarinaal: false,
    ...extra,
  };
}

const TODAY = "2026-08-11";

// 23 synthetic festival days, plus one routine vratham on a festival day and
// one muhurtham day with nothing else on it.
const ENTRIES: PanchangamMonthDayEntry[] = [
  ...Array.from({ length: 23 }, (_, i) =>
    day(`2026-08-${String(i + 1).padStart(2, "0")}`, [{ name: `Test Event ${i + 1}`, category: "hindu" }]),
  ),
  day("2026-08-26", [], { isTamilMuhurthamDay: true, isSubhaMuhurtham: true }),
];
ENTRIES[4] = day("2026-08-05", [
  { name: "Test Event 5", category: "hindu" },
  { name: "Pradhosam", category: "hindu" },
]);

function renderView(onSelectDate = vi.fn()) {
  render(
    <MonthlyCalendarViewNova
      lang="en"
      year={2026}
      month={8}
      monthly={{ entries: ENTRIES }}
      isLoading={false}
      error={null}
      hasLocation
      selectedDate={TODAY}
      todayDate={TODAY}
      onPrevMonth={() => {}}
      onNextMonth={() => {}}
      onSelectDate={onSelectDate}
    />,
  );
  return onSelectDate;
}

function agenda() {
  return within(screen.getByRole("region", { name: "Events & Festivals" }));
}

describe("Calendar monthly agenda rail", () => {
  it("counts every observance the rows show", () => {
    renderView();
    // 23 festivals + Pradhosam + 1 muhurtham day.
    expect(agenda().getByText("25 observances")).toBeTruthy();
  });

  it("lists every day in date order with nothing dropped", () => {
    renderView();
    const rows = agenda().getAllByRole("button");
    expect(rows).toHaveLength(24);
    expect(within(rows[0]!).getByText("Test Event 1")).toBeTruthy();
    expect(within(rows[22]!).getByText("Test Event 23")).toBeTruthy();
  });

  it("gives every row the same date column: day number over weekday", () => {
    renderView();
    const row = agenda().getAllByRole("button")[4]!;
    expect(within(row).getByText("5")).toBeTruthy();
    expect(within(row).getByText("Wed")).toBeTruthy();
    expect(within(row).getByText("Pradhosam")).toBeTruthy();
  });

  it("does not repeat a generic observance under the named festival that covers it", () => {
    const entries = [
      day("2026-08-14", [
        { name: "Vinayagar Chaturthi", category: "hindu" },
        { name: "Chathurthi", category: "hindu" },
      ]),
    ];
    render(
      <MonthlyCalendarViewNova
        lang="en" year={2026} month={8} monthly={{ entries }} isLoading={false} error={null} hasLocation
        selectedDate={TODAY} todayDate={TODAY} onPrevMonth={() => {}} onNextMonth={() => {}}
      />,
    );
    expect(agenda().getByText("Vinayagar Chaturthi")).toBeTruthy();
    expect(agenda().queryByText("Chathurthi")).toBeNull();
    expect(agenda().getByText("1 observance")).toBeTruthy();
  });

  it("labels the almanac's subha rule as the almanac's, not as the reader's chart", () => {
    renderView();
    expect(agenda().getByText("Subha muhurtham")).toBeTruthy();
    expect(screen.queryByText(/your chart/i)).toBeNull();
  });

  it("opens a day from its agenda row", () => {
    const onSelectDate = renderView();
    fireEvent.click(agenda().getAllByRole("button")[2]!);
    expect(onSelectDate).toHaveBeenCalledWith("2026-08-03");
  });

  it("marks today's row as the current date", () => {
    renderView();
    const today = agenda().getAllByRole("button").find((b) => b.getAttribute("aria-current") === "date");
    expect(today && within(today).getByText("Test Event 11")).toBeTruthy();
  });

  it("filter chips gate the agenda: Vratham off hides Pradhosam, Festivals off leaves the muhurtham day", () => {
    renderView();
    const filters = within(screen.getByRole("group", { name: "Filter calendar" }));

    fireEvent.click(filters.getByRole("button", { name: "Vratham" }));
    expect(filters.getByRole("button", { name: "Vratham" }).getAttribute("aria-pressed")).toBe("false");
    expect(agenda().queryByText("Pradhosam")).toBeNull();

    fireEvent.click(filters.getByRole("button", { name: "Festivals" }));
    expect(agenda().getAllByRole("button")).toHaveLength(1);
    expect(agenda().getByText("1 observance")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Show all" }));
    expect(agenda().getAllByRole("button")).toHaveLength(24);
  });
});
