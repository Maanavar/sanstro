import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const confirmBirthProfileLocation = vi.fn();
const updateBirthProfileLocation = vi.fn();

vi.mock("@vinaadi/shared/api/charts", () => ({
  confirmBirthProfileLocation: (...args: unknown[]) => confirmBirthProfileLocation(...args),
  updateBirthProfileLocation: (...args: unknown[]) => updateBirthProfileLocation(...args),
}));
vi.mock("@/lib/api", () => ({ apiFetchJson: vi.fn() }));
// The combobox's own search is exercised in place-combobox.test.tsx; here it
// only has to be a control that can hand back a chosen city.
vi.mock("./place-combobox", () => ({
  PlaceCombobox: ({ value, onChange }: {
    value: string;
    onChange: (city: { name: string; lat: string; lng: string; timezone: string } | null, raw: string) => void;
  }) => (
    <div>
      <input readOnly value={value} aria-label="place search" />
      <button
        type="button"
        onClick={() => onChange(
          { name: "Singapore, Singapore", lat: "1.3521", lng: "103.8198", timezone: "Asia/Singapore" },
          "Singapore",
        )}
      >
        pick Singapore
      </button>
    </div>
  ),
}));

import { LocationCheckStrip } from "./location-check-strip";

function renderStrip(overrides: Partial<Parameters<typeof LocationCheckStrip>[0]> = {}) {
  const onResolved = vi.fn();
  const onDismiss = vi.fn();
  render(
    <LocationCheckStrip
      variant="location-mismatch"
      lang="en"
      birthProfileId="bp-1"
      currentPlace="Chennai, Tamil Nadu, India"
      deviceTimeZone="Asia/Singapore"
      onResolved={onResolved}
      onDismiss={onDismiss}
      {...overrides}
    />,
  );
  return { onResolved, onDismiss };
}

beforeEach(() => {
  confirmBirthProfileLocation.mockReset().mockResolvedValue({ success: true, data: {} });
  updateBirthProfileLocation.mockReset().mockResolvedValue({ success: true, data: {} });
});

describe("LocationCheckStrip — the mismatch prompt (§2.1)", () => {
  it("names the device's city in the question and the saved place in the keep action", async () => {
    renderStrip();
    expect(screen.getByText(/Your phone is on Singapore time/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Use Singapore/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Keep Chennai/i })).toBeInTheDocument();
  });

  it("records a Keep as an answer rather than as silence", async () => {
    // Owner ruling R2: declining still stamps, or the backstop returns on the
    // reader's next visit and "no" is indistinguishable from ignoring.
    const { onResolved } = renderStrip();
    fireEvent.click(screen.getByRole("button", { name: /Keep Chennai/i }));

    await waitFor(() => expect(confirmBirthProfileLocation).toHaveBeenCalledWith("bp-1"));
    expect(updateBirthProfileLocation).not.toHaveBeenCalled();
    await waitFor(() => expect(onResolved).toHaveBeenCalled());
  });

  it("never saves the timezone's city directly — accepting opens the picker", async () => {
    // A zone names a representative city, not the reader's, and sunrise moves
    // with longitude. Owner ruling 2026-09-22: the reader confirms a real place.
    renderStrip();
    fireEvent.click(screen.getByRole("button", { name: /Use Singapore/i }));

    expect(updateBirthProfileLocation).not.toHaveBeenCalled();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("place search")).toHaveValue("Singapore");
  });

  it("saves the coordinates of the place the reader picked, not the zone's", async () => {
    const { onResolved } = renderStrip();
    fireEvent.click(screen.getByRole("button", { name: /Use Singapore/i }));
    fireEvent.click(await screen.findByRole("button", { name: /pick Singapore/i }));

    await waitFor(() => expect(updateBirthProfileLocation).toHaveBeenCalledWith("bp-1", {
      currentPlace: "Singapore, Singapore",
      currentLatitude: 1.3521,
      currentLongitude: 103.8198,
      currentTimezone: "Asia/Singapore",
    }));
    await waitFor(() => expect(onResolved).toHaveBeenCalled());
  });

  it("says so instead of going quiet when the save fails", async () => {
    updateBirthProfileLocation.mockRejectedValue(new Error("offline"));
    const { onResolved } = renderStrip();
    fireEvent.click(screen.getByRole("button", { name: /Use Singapore/i }));
    fireEvent.click(await screen.findByRole("button", { name: /pick Singapore/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Couldn't save/i);
    expect(onResolved).not.toHaveBeenCalled();
  });
});

describe("LocationCheckStrip — the 45-day backstop (§2.2)", () => {
  it("asks about the saved place rather than about the device", () => {
    renderStrip({ variant: "location-backstop", deviceTimeZone: "Asia/Kolkata" });
    expect(screen.getByText(/Still in Chennai, Tamil Nadu, India\?/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Change city/i })).toBeInTheDocument();
  });

  it("asks a place-free question when the profile has no usable location", () => {
    renderStrip({ variant: "location-backstop", currentPlace: null, deviceTimeZone: null });
    expect(screen.getByText(/Where are you right now\?/i)).toBeInTheDocument();
  });

  it("falls back to the place-free wording when the device zone is unreadable", () => {
    // `useDeviceTimeZone` is null during SSR and the first client render, and a
    // mismatch with nothing to name must not print an empty slot.
    renderStrip({ variant: "location-mismatch", currentPlace: null, deviceTimeZone: null });
    expect(screen.getByText(/Where are you right now\?/i)).toBeInTheDocument();
  });
});
