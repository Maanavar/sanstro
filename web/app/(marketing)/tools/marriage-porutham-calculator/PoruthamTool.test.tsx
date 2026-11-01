/**
 * The web porutham tool must not compute a split star's pair until its half is
 * chosen (OPEN_ITEMS Part 5). It used to fetch at once and print "If not
 * selected, <rasi> is used by default" — the backend's majority-half guess,
 * which flips the 6/8 answer for 144 of the 405 pairings involving a split star.
 *
 * Blind spot: this pins the fetch gating and the prompt, not the rendered
 * result; the detail request is left pending so no result renders at all.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

const getPorutham = vi.fn();
const getPoruthamGrid = vi.fn();

vi.mock("@vinaadi/shared/api/porutham", () => ({
  getPorutham: (...a: unknown[]) => getPorutham(...a),
  getPoruthamGrid: (...a: unknown[]) => getPoruthamGrid(...a),
}));
vi.mock("@/components/lang-toggle", () => ({ useLang: () => ["ta", vi.fn()] }));
vi.mock("@/components/localized-link", () => ({
  LocalizedLink: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

import { PoruthamTool, halfAnswered } from "./PoruthamTool";

const GRID = Array.from({ length: 27 }, (_, i) => ({
  boyNakshatra: i + 1, totalScore: 6, maxScore: 10, percentage: 60, label: "AVERAGE",
  rajjuDosha: false, vedhaDosha: false, nadiCaution: false,
}));

beforeEach(() => {
  getPorutham.mockReset().mockReturnValue(new Promise(() => {}));
  getPoruthamGrid.mockReset().mockResolvedValue({ success: true, girlNakshatraNumber: 3, results: GRID });
});

describe("halfAnswered", () => {
  it("needs a half only for the nine split stars", () => {
    expect(halfAnswered(null, null)).toBe(false);
    expect(halfAnswered(3, null)).toBe(true); // Rohini: whole star
    expect(halfAnswered(2, null)).toBe(false); // Karthigai: split
    expect(halfAnswered(2, "late")).toBe(true);
    const split = [2, 4, 6, 11, 13, 15, 20, 22, 24];
    for (let i = 0; i < 27; i++) expect(halfAnswered(i, null)).toBe(!split.includes(i));
  });
});

describe("PoruthamTool split-star gating", () => {
  it("asks for the girl's half before fetching the grid, then sends it", async () => {
    render(<PoruthamTool />);
    fireEvent.click(screen.getByText("கார்த்திகை"));

    expect(getPoruthamGrid).not.toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toContain("தேர்வு செய்யவும்");
    expect(screen.queryByText(/எனக் கணக்கிடப்படும்/)).toBeNull();

    fireEvent.click(screen.getByText("பாதம் 2–4 · ரிஷபம்"));
    expect(getPoruthamGrid).toHaveBeenCalledWith({ girlNakshatraNumber: 3, girlPada: 4 });
  });

  it("asks for the boy's half before fetching the pair", async () => {
    render(<PoruthamTool />);
    fireEvent.click(screen.getByText("ரோகிணி")); // whole star: no question
    expect(getPoruthamGrid).toHaveBeenCalledWith({ girlNakshatraNumber: 4, girlPada: undefined });

    // The boy grid's Mirugaseeridam (split) — the second match, after the girl picker's.
    await waitFor(() => expect(screen.getAllByText("மிருகசீரிடம்")).toHaveLength(2));
    fireEvent.click(screen.getAllByText("மிருகசீரிடம்")[1]);
    expect(getPorutham).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("பாதம் 1–2 · ரிஷபம்"));
    expect(getPorutham).toHaveBeenCalledWith({
      girlNakshatraNumber: 4, boyNakshatraNumber: 5, girlPada: undefined, boyPada: 1,
    });
  });
});
