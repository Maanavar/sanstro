/**
 * Regression test for the Prasna envelope bug (parity audit 2026-07-17 §8.3).
 *
 * POST /prasna answers FLAT — there is no { success, data } envelope. Both
 * widgets typed the response as { success, data } and read `res.data`, so
 * `res.success` was always undefined and every ask fell to the error branch:
 * the feature never rendered a result for anyone.
 *
 * Nothing caught it — the cast asserted a shape the route never sends, so the
 * type checker was satisfied and there was no 404 or 405 to notice. These tests
 * feed the *real* flat payload through and assert a result actually renders.
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const apiFetchJson = vi.fn();

vi.mock("@/lib/api", () => ({
  apiFetchJson: (...args: unknown[]) => apiFetchJson(...args),
  readErrorMessage: (e: unknown) => String(e),
}));

import { PrasnaWidget } from "./dashboard-prasna-widget";
import { NovaPrasnaWidget } from "./dashboard-today-deepdive-extras-nova";

/** Exactly what app/api/prasna.py returns — flat, no envelope. */
const FLAT_PRASNA_RESPONSE = {
  prasnaLagnaRasi: 3,
  prasnaLagnaName: "Mithunam",
  moonRasi: 7,
  moonNakshatraName: "Visakam",
  questionArea: "GENERAL",
  karaka: "VENUS",
  karakaHouse: 5,
  outlook: "FAVOURABLE" as const,
  outlookTa: "சாதகமான பதில்.",
  outlookEn: "The chart supports this.",
  positiveIndicators: ["Venus in kendra from Prasna Lagna"],
  negativeIndicators: ["Saturn aspects the karaka"],
  cautionTa: "",
  cautionEn: "",
};

const PROPS = {
  lang: "en" as const,
  open: true,
  onClose: () => {},
  timezone: "Asia/Kolkata",
  latitude: 13.0827,
  longitude: 80.2707,
};

beforeEach(() => {
  apiFetchJson.mockReset();
  apiFetchJson.mockResolvedValue(FLAT_PRASNA_RESPONSE);
});

describe.each([
  ["NovaPrasnaWidget (the live one)", NovaPrasnaWidget],
  ["PrasnaWidget", PrasnaWidget],
])("%s", (_name, Widget) => {
  it("renders the outlook from a flat response instead of erroring", async () => {
    render(<Widget {...PROPS} />);

    fireEvent.click(screen.getByRole("button", { name: /ask/i }));

    // The outlook body only appears if the flat payload was read correctly.
    await waitFor(() => {
      expect(screen.getByText("The chart supports this.")).toBeTruthy();
    });
    expect(screen.getByText(/Venus in kendra from Prasna Lagna/)).toBeTruthy();
    // The pre-fix code always landed here.
    expect(screen.queryByText(/No result returned/i)).toBeNull();
  });

  it("posts the question area to /api/v1/prasna", async () => {
    render(<Widget {...PROPS} />);
    fireEvent.click(screen.getByRole("button", { name: /ask/i }));

    await waitFor(() => expect(apiFetchJson).toHaveBeenCalled());
    const [path, init] = apiFetchJson.mock.calls[0];
    expect(path).toBe("/api/v1/prasna");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toMatchObject({
      question_area: "GENERAL",
      timezone_name: "Asia/Kolkata",
    });
  });
});
