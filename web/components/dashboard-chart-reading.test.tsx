import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { OneMinuteReadingData } from "@vinaadi/shared/api/oneMinuteReading";
import type { FiveMinuteReadingData } from "@vinaadi/shared/api/fiveMinuteReading";

/**
 * The length switch (DXA-37, D4).
 *
 * Three behaviours, and each of them is a thing that goes wrong QUIETLY:
 *
 * - **No switch when the long reading 404s.** That endpoint answers 404 for any
 *   register but "self" and whenever its flag is off, i.e. on every family
 *   member's chart. A control offered there leads nowhere, and nothing on
 *   screen would say so.
 * - **The choice persists**, per viewer, so a reader who prefers the long
 *   reading is not asked again every visit.
 * - **A stored "long" never strands a reader** on a chart that has no long
 *   reading — the stored preference has to lose to what actually loaded.
 *
 * Also asserted here: exactly one `section.om`. That is the audit's own gate
 * for this item, and the reason the switch renders one section rather than
 * hiding a second one.
 */

const getOneMinuteReading = vi.fn();
const getFiveMinuteReading = vi.fn();

vi.mock("@vinaadi/shared/api/oneMinuteReading", () => ({
  getOneMinuteReading: (...args: unknown[]) => getOneMinuteReading(...args),
}));
vi.mock("@vinaadi/shared/api/fiveMinuteReading", () => ({
  getFiveMinuteReading: (...args: unknown[]) => getFiveMinuteReading(...args),
}));
vi.mock("@/lib/api", () => ({ apiFetchJson: vi.fn() }));

// framer's AnimatePresence keeps the outgoing view mounted for its exit
// animation, which in jsdom never runs to completion — two sections would be on
// screen for the whole test and the count assertions would be measuring the
// mock, not the component. ViewSwap's own contract (`mode="wait"`: one view at
// a time) is what is being stood in for here.
vi.mock("./ui/view-swap", () => ({
  ViewSwap: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { DashboardChartReading } from "./dashboard-chart-reading";

function shortFixture(): OneMinuteReadingData {
  return {
    chartId: "chart-1",
    birthProfileId: "profile-1",
    displayName: "Test Reader",
    asOf: "2026-08-01",
    readingWindow: { from: "2026-08-01", to: "2027-02-01" },
    age: 30,
    stage: "ESTABLISHING",
    ageBand: { en: "thirties", ta: "முப்பதுகள்" },
    focusTopic: "WORK",
    addressedTo: "self",
    beats: [
      {
        id: "who_you_are",
        text: { en: "You steady a room before you speak in it.", ta: "நீங்கள் அமைதியாகத் தொடங்குபவர்." },
        basis: null,
      },
    ],
    pendingQuestion: null,
    wordCount: { ta: 40, en: 40 },
    nextStep: { label: { en: "Open the full chart", ta: "முழு ஜாதகம்" }, href: "/dashboard" },
  };
}

function longFixture(): FiveMinuteReadingData {
  return {
    ...shortFixture(),
    beats: [
      {
        id: "who_you_are",
        text: { en: "The longer telling of the same opening beat.", ta: "அதே தொடக்கம், நீளமாக." },
        basis: null,
      },
    ],
  };
}

describe("DashboardChartReading length switch", () => {
  beforeEach(() => {
    localStorage.clear();
    getOneMinuteReading.mockReset();
    getFiveMinuteReading.mockReset();
    getOneMinuteReading.mockResolvedValue({ success: true, data: shortFixture() });
    getFiveMinuteReading.mockResolvedValue({ success: true, data: longFixture() });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders exactly one reading, with the switch, when both lengths load", async () => {
    const { container } = render(<DashboardChartReading lang="en" chartId="chart-1" />);

    await screen.findByText("Your chart in two minutes");
    expect(container.querySelectorAll("section.om")).toHaveLength(1);
    expect(screen.getByRole("tab", { name: "2 min" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "4 min" })).toBeTruthy();
  });

  it("offers no switch when the four-minute reading 404s", async () => {
    getFiveMinuteReading.mockRejectedValue(new Error("404"));

    const { container } = render(<DashboardChartReading lang="en" chartId="chart-1" />);

    await screen.findByText("Your chart in two minutes");
    await waitFor(() => expect(getFiveMinuteReading).toHaveBeenCalled());
    expect(screen.queryByRole("tab")).toBeNull();
    expect(container.querySelectorAll("section.om")).toHaveLength(1);
  });

  it("changes the title, and still shows one reading, when switched", async () => {
    const { container } = render(<DashboardChartReading lang="en" chartId="chart-1" />);

    await screen.findByRole("tab", { name: "4 min" });
    fireEvent.click(screen.getByRole("tab", { name: "4 min" }));

    await screen.findByText("Your chart in four minutes");
    expect(screen.queryByText("Your chart in two minutes")).toBeNull();
    expect(container.querySelectorAll("section.om")).toHaveLength(1);
  });

  it("remembers the choice for the next visit", async () => {
    const first = render(<DashboardChartReading lang="en" chartId="chart-1" />);
    await screen.findByRole("tab", { name: "4 min" });
    fireEvent.click(screen.getByRole("tab", { name: "4 min" }));
    await screen.findByText("Your chart in four minutes");
    expect(localStorage.getItem("vinaadi-reading-length")).toBe("long");
    first.unmount();

    render(<DashboardChartReading lang="en" chartId="chart-1" />);
    await screen.findByText("Your chart in four minutes");
  });

  it("falls back to the short reading when a remembered 'long' has no reading", async () => {
    localStorage.setItem("vinaadi-reading-length", "long");
    getFiveMinuteReading.mockRejectedValue(new Error("404"));

    render(<DashboardChartReading lang="en" chartId="chart-2" />);

    await screen.findByText("Your chart in two minutes");
    expect(screen.queryByRole("tab")).toBeNull();
  });

  it("labels the switch in Tamil without echoing the title's wording", async () => {
    render(<DashboardChartReading lang="ta" chartId="chart-1" />);

    // The app writes a numeral duration with the singular — `${m} நிமிடம்` in
    // lib/public-today.ts and mobile's inbox — and spells the word out only in
    // prose ("இரண்டு நிமிடங்களில்", the H2). The control follows the numeral
    // convention, the title keeps the prose one.
    await screen.findByText("உங்கள் ஜாதகம் — இரண்டு நிமிடங்களில்");
    expect(screen.getByRole("tab", { name: "2 நிமிடம்" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "4 நிமிடம்" })).toBeTruthy();
  });
});
