/**
 * Admin → Analytics → Life Focus (audit U7). The failure this pins is not a
 * crash: it is an operator reading a **snapshot** as a figure for the month
 * they selected. Adoption and the tuning table are as-of-now whatever month is
 * chosen; only the Skip rate and the change rate belong to the period.
 *
 * Also pinned: a focus offered to nobody must not read as 0%, and BALANCED —
 * what a reader has without choosing anything — must never be presented as a
 * focus nobody picks.
 *
 * Blind spot: the fetch, the month round-trip to the server and the admin
 * elevation path all live in `admin-console.tsx` and are not exercised here.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminLifeFocusPanel } from "./admin-life-focus-panel";
import type { LifeFocusMetrics } from "@vinaadi/shared/api";

const metrics: LifeFocusMetrics = {
  period: "2026-09",
  adoption_as_of: "2026-11-03T08:00:00Z",
  total_users: 1000,
  non_balanced_users: 250,
  non_balanced_share: 0.25,
  mode_counts: { BALANCED: 750, CAREER: 150, LOVE: 90, MARRIAGE: 10 },
  first_run_decisions: 400,
  first_run_picker_decisions: 300,
  first_run_skips: 60,
  first_run_skip_rate: 0.2,
  focus_change_count: 120,
  focus_returning_users: 80,
  focus_changes_per_returning_user: 1.5,
  offered_users: { BALANCED: 1000, CAREER: 1000, LOVE: 600, MARRIAGE: 0 },
  offered_pick_share: { BALANCED: 0.75, CAREER: 0.15, LOVE: 0.15, MARRIAGE: null },
  rarely_picked: ["MARRIAGE"],
};

function renderPanel(over: Partial<LifeFocusMetrics> = {}) {
  return render(
    <AdminLifeFocusPanel
      metrics={{ ...metrics, ...over }}
      month="2026-09"
      onMonthChange={vi.fn()}
      onRefresh={vi.fn()}
      loading={false}
    />,
  );
}

describe("AdminLifeFocusPanel", () => {
  it("calls the snapshot measures snapshots, next to their own numbers", () => {
    renderPanel();
    const adoption = screen.getByText("Adoption").closest(".admin-metric");
    expect(adoption).not.toBeNull();
    expect(adoption!.textContent).toMatch(/Snapshot/i);
    // The one mistake this guards: adoption is NOT the selected month's figure.
    expect(adoption!.textContent).toMatch(/not the\s+selected month/i);
    expect(adoption!.textContent).not.toContain(metrics.period);
  });

  it("names the period on the measures that belong to it", () => {
    renderPanel();
    const skip = screen.getByText("First-run Skip rate").closest(".admin-metric");
    expect(skip!.textContent).toContain("2026-09");
    expect(skip!.textContent).toContain("20.0%");
    // The Skip base is the picker, not every first decision.
    expect(skip!.textContent).toContain("300");

    const changes = screen.getByText("Changes per returning reader").closest(".admin-metric");
    expect(changes!.textContent).toContain("2026-09");
    expect(changes!.textContent).toContain("1.50");
  });

  it("shows no share for a focus offered to nobody", () => {
    renderPanel();
    const row = screen.getByRole("row", { name: /Marriage/ });
    const cells = row.querySelectorAll("td");
    expect(cells[2]!.textContent).toBe("0"); // offered to
    expect(cells[3]!.textContent).toBe("-"); // share: unknown, not zero
  });

  it("marks BALANCED as the default rather than an unpopular focus", () => {
    // Even if the server's rule flagged it, BALANCED is what a reader has
    // without choosing, so its count says nothing about its popularity.
    renderPanel({ rarely_picked: ["BALANCED", "MARRIAGE"] });
    const balanced = screen.getByRole("row", { name: /Balanced/ });
    expect(balanced.textContent).toContain("default");
    expect(balanced.textContent).not.toContain("rarely picked");
    expect(screen.getByRole("row", { name: /Marriage/ }).textContent).toContain("rarely picked");
  });

  it("presents a rarely-picked focus as a candidate, not a verdict", () => {
    renderPanel();
    expect(screen.getByText(/Rarely-picked candidates: Marriage/)).toBeTruthy();
    expect(screen.getByText(/candidate, not a verdict/i)).toBeTruthy();
    expect(screen.getByText(/28 days apart/)).toBeTruthy();
  });

  it("says nothing was loaded instead of rendering zeros", () => {
    render(
      <AdminLifeFocusPanel
        metrics={null}
        month=""
        onMonthChange={vi.fn()}
        onRefresh={vi.fn()}
        loading={false}
      />,
    );
    expect(screen.getByText("No Life Focus measures loaded.")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });
});
