import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { apiFetchJson } from "@/lib/api";
import { track } from "@/lib/analytics";
import { DashboardAskVinaadi } from "./dashboard-ask-vinaadi";

vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));
vi.mock("@/lib/api", () => ({
  apiFetchJson: vi.fn(() => new Promise(() => {})),
  getApiError: vi.fn(() => null),
}));

describe("DashboardAskVinaadi life-focus analytics", () => {
  it("records the focus and chip position without sending the question text", () => {
    render(
      <DashboardAskVinaadi
        lang="en"
        chartId="synthetic-chart-id"
        activeLifeMode="CAREER"
      />,
    );

    fireEvent.click(screen.getByText("How is my work energy today?"));

    expect(track).toHaveBeenCalledWith("life_focus_ask_chip_tapped", {
      focus: "CAREER",
      surface: "web",
      chip_index: 0,
    });
    expect(apiFetchJson).toHaveBeenCalledWith(
      "/api/v1/charts/synthetic-chart-id/ask",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
