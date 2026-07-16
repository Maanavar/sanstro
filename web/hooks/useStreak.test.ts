import { describe, expect, it } from "vitest";
import { computeStreak, type StreakState } from "./streak-logic";

const base = (over: Partial<StreakState>): StreakState => ({ days: 1, lastVisit: "2026-07-10", best: 1, ...over });

describe("computeStreak (UXD-18 forgiveness)", () => {
  it("starts a fresh streak when there is no prior state", () => {
    const { state, forgiven } = computeStreak(null, "2026-07-15");
    expect(state).toMatchObject({ days: 1, lastVisit: "2026-07-15", best: 1 });
    expect(forgiven).toBe(false);
  });

  it("leaves the streak unchanged on a same-day revisit", () => {
    const { state, forgiven } = computeStreak(base({ days: 5, lastVisit: "2026-07-15", best: 5 }), "2026-07-15");
    expect(state.days).toBe(5);
    expect(forgiven).toBe(false);
  });

  it("increments on a consecutive day", () => {
    const { state, forgiven } = computeStreak(base({ days: 5, lastVisit: "2026-07-14", best: 5 }), "2026-07-15");
    expect(state.days).toBe(6);
    expect(state.best).toBe(6);
    expect(forgiven).toBe(false);
  });

  it("forgives a single missed day when no grace was used recently", () => {
    // last visit 2 days ago (missed one day), no prior grace
    const { state, forgiven } = computeStreak(base({ days: 5, lastVisit: "2026-07-13", best: 5 }), "2026-07-15");
    expect(state.days).toBe(6);
    expect(state.graceUsedOn).toBe("2026-07-15");
    expect(forgiven).toBe(true);
  });

  it("resets when a grace was already spent inside the window", () => {
    const { state, forgiven } = computeStreak(
      base({ days: 8, lastVisit: "2026-07-13", best: 8, graceUsedOn: "2026-07-11" }), // grace 4 days ago (< 7)
      "2026-07-15",
    );
    expect(state.days).toBe(1);
    expect(state.best).toBe(8); // personal best preserved
    expect(forgiven).toBe(false);
  });

  it("forgives again once the grace window has passed", () => {
    const { state, forgiven } = computeStreak(
      base({ days: 8, lastVisit: "2026-07-13", best: 8, graceUsedOn: "2026-07-01" }), // grace 14 days ago (>= 7)
      "2026-07-15",
    );
    expect(state.days).toBe(9);
    expect(forgiven).toBe(true);
  });

  it("resets on a gap longer than one missed day", () => {
    const { state, forgiven } = computeStreak(base({ days: 12, lastVisit: "2026-07-10", best: 12 }), "2026-07-15");
    expect(state.days).toBe(1);
    expect(state.best).toBe(12);
    expect(forgiven).toBe(false);
  });
});
