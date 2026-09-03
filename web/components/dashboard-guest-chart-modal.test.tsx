import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { ChartCalculateResponseData } from "@/lib/types";

/**
 * B-008: the guest preview shipped a chart computed against assumptions it
 * never disclosed.
 *
 * Two separate defaults did it. `birthTimezone` defaulted to `Asia/Kolkata` for
 * every visitor on earth — fixed earlier — and `birthTimeLocal` was PRE-FILLED
 * with "12:00", so a visitor who never touched the field submitted noon as
 * though they had stated it and received a lagna, twelve house placements and a
 * dasa balance presented as fact.
 *
 * The backend cannot take a blank (`_birth_datetime_utc` raises without a
 * time), so the assumption still has to be made — what changed is that the
 * field now starts empty and the result says so when it was made. These tests
 * pin all three halves: the empty field, the assumed time still reaching the
 * API, and the notice appearing on the chart.
 */

const apiFetchJson = vi.fn();

vi.mock("@/lib/api", () => ({
  apiFetchJson: (...args: unknown[]) => apiFetchJson(...args),
  readErrorMessage: (err: unknown) => String(err),
}));

function sampleChart(birthTimeLocal: string | null): ChartCalculateResponseData {
  return {
    chartId: "chart-1",
    birthProfile: {
      birthProfileId: "profile-1",
      displayName: "Test Visitor",
      birthDateLocal: "1990-01-01",
      birthTimeLocal,
      birthPlace: "Portland",
      birthTimezone: "America/Los_Angeles",
      calculationStatus: "completed",
      warnings: [],
    },
    birthDateTimeUTC: "1990-01-01T20:00:00Z",
    julianDay: 2447892.5,
    ayanamsa: { type: "LAHIRI", valueDegrees: 23.5 },
    lagna: {
      rasi: 1, rasiName: "Mesham", absoluteLongitude: 10, degreeInRasi: 10,
      nakshatra: 1, nakshatraName: "Aswini", pada: 4,
    },
    planets: [
      {
        graha: "SUN", rasiName: "Mesham", absoluteLongitude: 20, rasi: 1, degreeInRasi: 20,
        nakshatra: 2, nakshatraName: "Bharani", pada: 2, houseFromLagna: 1, speedDegPerDay: 1,
        isRetrograde: false, isCombust: false, d9Rasi: 2, isVargottama: false, showRetrogradeBadge: false,
      },
    ],
    yogas: [],
    doshams: [],
    calculationVersion: "v1",
    calculationStatus: "completed",
    warnings: [],
    ephemerisBackend: "swisseph",
  } as unknown as ChartCalculateResponseData;
}

/** Fill everything the zod schema requires except the birth time. */
function fillFormExceptTime(container: HTMLElement) {
  fireEvent.click(screen.getByText(/Enter location manually/i));
  const set = (id: string, value: string) => {
    const el = container.querySelector(`#${id}`) as HTMLInputElement;
    fireEvent.change(el, { target: { value } });
  };
  set("displayName", "Test Visitor");
  set("birthDateLocal", "1990-01-01");
  // The place combobox renders an unlabelled input of its own — it is the only
  // input in the form without an id, which is a sturdier handle here than its
  // internal structure.
  fireEvent.change(container.querySelector("input:not([id])") as HTMLInputElement, {
    target: { value: "Portland" },
  });
  set("birthLatitude", "45.52");
  set("birthLongitude", "-122.68");
  set("birthTimezone", "America/Los_Angeles");
}

function timeInput(container: HTMLElement) {
  return container.querySelector('input[type="time"]') as HTMLInputElement;
}

describe("GuestChartModal birth time", () => {
  beforeEach(() => {
    apiFetchJson.mockReset();
  });

  it("does not pre-fill a birth time the visitor never gave", async () => {
    const { GuestChartModal } = await import("./dashboard-guest-chart-modal");
    const { container } = render(<GuestChartModal lang="en" onClose={() => {}} onCreateAccount={() => {}} />);
    expect(timeInput(container).value).toBe("");
  });

  it("tells the reader what the birth time costs, not just that it is optional", async () => {
    const { GuestChartModal } = await import("./dashboard-guest-chart-modal");
    render(<GuestChartModal lang="en" onClose={() => {}} onCreateAccount={() => {}} />);
    expect(screen.getByText(/Even 15 minutes changes your Lagna/i)).toBeTruthy();
  });

  it("marks the result approximate when the birth time was left blank", async () => {
    apiFetchJson.mockResolvedValue({ success: true, data: sampleChart(null) });
    const { GuestChartModal } = await import("./dashboard-guest-chart-modal");
    const { container } = render(<GuestChartModal lang="en" onClose={() => {}} onCreateAccount={() => {}} />);

    fillFormExceptTime(container);
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);

    await waitFor(() => expect(apiFetchJson).toHaveBeenCalled());
    // The assumption still has to reach the API — the calculation requires a
    // time — but it is ours, not the reader's.
    const body = JSON.parse((apiFetchJson.mock.calls[0][1] as { body: string }).body);
    expect(body.birth.birthTimeLocal).toBe("12:00");

    await screen.findByText(/Approximate — birth time not provided/i);
  });

  it("says nothing about approximation when the reader gave a time", async () => {
    apiFetchJson.mockResolvedValue({ success: true, data: sampleChart("07:45:00") });
    const { GuestChartModal } = await import("./dashboard-guest-chart-modal");
    const { container } = render(<GuestChartModal lang="en" onClose={() => {}} onCreateAccount={() => {}} />);

    fillFormExceptTime(container);
    fireEvent.change(timeInput(container), { target: { value: "07:45" } });
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);

    await waitFor(() => expect(apiFetchJson).toHaveBeenCalled());
    const body = JSON.parse((apiFetchJson.mock.calls[0][1] as { body: string }).body);
    expect(body.birth.birthTimeLocal).toBe("07:45");
    expect(screen.queryByText(/Approximate — birth time not provided/i)).toBeNull();
  });
});
