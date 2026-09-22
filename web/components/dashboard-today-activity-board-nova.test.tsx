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
import { track } from "@/lib/analytics";

import { DashboardTodayActivityBoardNova } from "./dashboard-today-activity-board-nova";

vi.mock("@vinaadi/shared/api/activityTiming", () => ({
  getActivityTimingBatch: vi.fn(() => new Promise(() => {})),
}));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

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

/** Life focus T3 (docs/LIFE_FOCUS_PLAN_2026-09-22.md): the focus activities
 *  lead the carousel, verdicts untouched, and a focus with nothing to say
 *  today says so once. */
describe("DashboardTodayActivityBoardNova — life focus", () => {
  const board: DailyActivityBoard = {
    favourable: [verdict("property", "Property", "SUPPORTS", "Panchami tithi favourable")],
    caution: [verdict("marriage", "Marriage", "CAUTION", "Saturday unfavourable")],
    neutral: [
      verdict("health", "Health", "NEUTRAL", "Neutral for this activity"),
      verdict("job_change", "Job moves", "NEUTRAL", "Neutral for this activity"),
    ],
    isChandrashtama: false,
  };

  function renderWithFocus(b: DailyActivityBoard, focusActivities: string[]) {
    return render(
      <DashboardTodayActivityBoardNova
        board={b}
        lang="en"
        chartId={null}
        selectedDate="2026-07-18"
        bestWindow={null}
        now={new Date("2026-07-18T12:00:00Z")}
        isToday
        onOpenAskVinaadi={() => {}}
        focusActivities={focusActivities}
        focusMode="MARRIAGE"
      />,
    );
  }

  const cardLabels = () =>
    screen.getAllByRole("listitem").map((li) => li.textContent ?? "");

  it("leads with the focus activity and keeps its own tone", () => {
    renderWithFocus(board, ["marriage"]);
    const first = cardLabels()[0];
    expect(first).toContain("Marriage");
    expect(first).toContain("Your focus");
    expect(first).toContain("Worth a second look");
  });

  it("changes order only: the same cards with the same verdicts", () => {
    const { unmount } = renderWithFocus(board, []);
    const neutralOrder = cardLabels().sort();
    unmount();
    renderWithFocus(board, ["job_change"]);
    const focusOrder = cardLabels().map((text) => text.replace("Your focus", "")).sort();
    expect(focusOrder).toEqual(neutralOrder);
  });

  it("says once when every focus activity is neutral today", () => {
    renderWithFocus(board, ["job_change", "business_start"]);
    expect(screen.getByText(/Job moves: nothing specific today\./)).toBeTruthy();
  });

  it("says nothing extra when a focus activity has a verdict", () => {
    renderWithFocus(board, ["property"]);
    expect(screen.queryByText(/nothing specific today/)).toBeNull();
  });

  it("stays quiet on a Chandrashtama day, which already explains the neutral column", () => {
    renderWithFocus({ ...board, isChandrashtama: true }, ["job_change"]);
    expect(screen.queryByText(/nothing specific today/)).toBeNull();
  });

  it("records a focus-row tap without sending its rendered label or reason", () => {
    renderWithFocus(board, ["marriage"]);
    fireEvent.pointerUp(screen.getByText("Marriage").closest("li") as HTMLElement);

    expect(track).toHaveBeenCalledWith("life_focus_row_tapped", {
      focus: "MARRIAGE",
      activity: "marriage",
      surface: "web",
    });
  });
});
