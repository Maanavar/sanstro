/**
 * The Today tab used to carry two sections asking the same question of the
 * same engine — a four-pill "Is today okay for…?" strip over the hardcoded
 * travel/property/money/job_change set, above an eleven-row "What is today
 * good for?" board that already contained those same four under different
 * labels. These tests pin the two properties that merge depends on:
 *
 *   1. a reason shared by several activities is printed once, on the group
 *      heading, not once per row (the visible repetition users flagged), and
 *   2. an activity whose reason differs still states its own.
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DailyActivityBoard } from "@/lib/types";
import { getActivityTimingBatch } from "@vinaadi/shared/api/activityTiming";

import { DashboardTodayActivityBoardNova } from "./dashboard-today-activity-board-nova";

vi.mock("@vinaadi/shared/api/activityTiming", () => ({
  getActivityTimingBatch: vi.fn(() => new Promise(() => {})),
}));

function verdict(activity: string, label: string, alignment: "SUPPORTS" | "NEUTRAL" | "CAUTION", reason: string) {
  return { activity, label: { ta: label, en: label }, alignment, reason: { ta: reason, en: reason } };
}

function renderBoard(board: DailyActivityBoard) {
  return render(
    <DashboardTodayActivityBoardNova
      board={board}
      lang="en"
      chartId={null}
      selectedDate="2026-07-18"
      bestWindow={null}
      now={new Date("2026-07-18T12:00:00Z")}
      isToday
      onOpenAskVinaadi={() => {}}
    />,
  );
}

describe("DashboardTodayActivityBoardNova — no repeated reasons", () => {
  it("states a shared cause once on the heading instead of on every row", () => {
    renderBoard({
      favourable: [verdict("property", "Property", "SUPPORTS", "Panchami tithi favourable")],
      caution: [
        verdict("business_start", "Starting a business", "CAUTION", "Saturday unfavourable"),
        verdict("marriage", "Marriage", "CAUTION", "Saturday unfavourable"),
        verdict("child_birth", "Children", "CAUTION", "Saturday unfavourable"),
        verdict("travel_abroad", "Travel abroad", "CAUTION", "Saturday unfavourable"),
      ],
      neutral: [verdict("health", "Health", "NEUTRAL", "Neutral for this activity")],
      isChandrashtama: false,
    });

    // Four cautioned activities, one statement of why.
    expect(screen.getAllByText(/Saturday unfavourable/)).toHaveLength(1);
    expect(screen.getByText("Marriage")).toBeTruthy();
    expect(screen.getByText("Travel abroad")).toBeTruthy();
  });

  it("keeps a row's own reason when it differs from the group's", () => {
    renderBoard({
      favourable: [],
      caution: [
        verdict("marriage", "Marriage", "CAUTION", "Saturday unfavourable"),
        verdict("child_birth", "Children", "CAUTION", "Saturday unfavourable"),
        verdict("money", "Money decisions", "CAUTION", "Ashtami — rikta tithi"),
      ],
      neutral: [],
      isChandrashtama: false,
    });

    expect(screen.getAllByText(/Saturday unfavourable/)).toHaveLength(1);
    const row = screen.getByText("Money decisions").closest("li");
    expect(row).toBeTruthy();
    expect(within(row as HTMLElement).getByText(/Ashtami — rikta tithi/)).toBeTruthy();
  });

  it("renders neutral activities inline as cards with their reason (no toggle)", () => {
    renderBoard({
      favourable: [],
      caution: [],
      neutral: [verdict("business_start", "Starting a business", "NEUTRAL", "Paksha is neutral for this activity")],
      isChandrashtama: false,
    });

    // Shown directly now — no "N more" toggle stands between the user and it.
    expect(screen.queryByText(/business as usual/)).toBeNull();

    const row = screen.getByText("Starting a business").closest("li");
    expect(row).toBeTruthy();
    expect(within(row as HTMLElement).getByText(/Neutral/)).toBeTruthy();
    expect(within(row as HTMLElement).getByText(/Paksha is neutral for this activity/)).toBeTruthy();
  });

  it("hoists a reason shared by several neutral activities onto no single card", () => {
    renderBoard({
      favourable: [],
      caution: [],
      neutral: [
        verdict("business_start", "Starting a business", "NEUTRAL", "Wednesday is neutral for this activity"),
        verdict("money", "Money decisions", "NEUTRAL", "Wednesday is neutral for this activity"),
        verdict("property", "Property", "NEUTRAL", "Ashtami tithi — neutral"),
      ],
      isChandrashtama: false,
    });

    expect(screen.queryAllByText(/Wednesday is neutral for this activity/)).toHaveLength(0);
    const propertyRow = screen.getByText("Property").closest("li");
    expect(within(propertyRow as HTMLElement).getByText(/Ashtami tithi — neutral/)).toBeTruthy();
  });

  it("explains an empty favourable column on a Chandrashtama day", () => {
    renderBoard({
      favourable: [],
      caution: [],
      neutral: [verdict("health", "Health", "NEUTRAL", "Neutral for this activity")],
      isChandrashtama: true,
    });

    expect(screen.getByText(/Because today is your Chandrashtama/)).toBeTruthy();
  });

  it("puts the next three good dates in a neutral activity's hover hint", async () => {
    vi.mocked(getActivityTimingBatch).mockResolvedValueOnce({
      success: true,
      data: {
        chartId: "chart-1",
        month: "2026-07",
        results: {
          money: {
            chartId: "chart-1", activity: "money", month: "2026-07", topDates: [], dateResult: null,
            nextFavourableDates: ["2026-07-20", "2026-07-23", "2026-07-28"],
          },
        },
      },
    });

    render(
      <DashboardTodayActivityBoardNova
        board={{ favourable: [], caution: [], neutral: [verdict("money", "Money decisions", "NEUTRAL", "Neutral today")], isChandrashtama: false }}
        lang="en"
        chartId="chart-1"
        selectedDate="2026-07-18"
        bestWindow={null}
        now={new Date("2026-07-18T12:00:00Z")}
        isToday
        onOpenAskVinaadi={() => {}}
      />,
    );

    const row = screen.getByText("Money decisions").closest("li") as HTMLElement;
    await waitFor(() => expect(row.title).toContain("Next good dates: 20 Jul, 23 Jul, 28 Jul"));
    fireEvent.mouseEnter(row);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Next good dates: 20 Jul, 23 Jul, 28 Jul");
  });
});
