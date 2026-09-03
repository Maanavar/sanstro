/**
 * B-006 — the combobox switched from an in-memory 145-city array to a
 * debounced call against the bundled `/places/search` endpoint. These pin
 * the properties that changed: a request only fires at/above the 2-char
 * minimum, a selection reconstructs the "City, State, Country" display
 * string the rest of the app expects, and the online-geocode fallback is
 * offered only after a real miss — never fired automatically.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { PlaceCombobox } from "./place-combobox";
import { searchPlaces } from "@vinaadi/shared/api/places";
import { apiFetchJson } from "@/lib/api";

vi.mock("@vinaadi/shared/api/places", () => ({
  searchPlaces: vi.fn(),
}));
vi.mock("@/lib/api", () => ({
  apiFetchJson: vi.fn(),
}));

const mockSearchPlaces = vi.mocked(searchPlaces);
const mockApiFetchJson = vi.mocked(apiFetchJson);

const MANNARGUDI = {
  geonameId: 1263659,
  name: "Mannargudi",
  admin1Name: "Tamil Nadu",
  countryCode: "IN",
  countryName: "India",
  lat: 10.6667,
  lng: 79.4833,
  timezone: "Asia/Kolkata",
};

beforeEach(() => {
  mockSearchPlaces.mockReset();
  mockApiFetchJson.mockReset();
});

describe("PlaceCombobox — bundled search", () => {
  it("does not search below the 2-character minimum", () => {
    render(<PlaceCombobox value="" onChange={() => {}} aria-label="Birth place" />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "m" } });
    expect(mockSearchPlaces).not.toHaveBeenCalled();
  });

  it("debounces a search at 2+ characters and lists the qualified place name", async () => {
    mockSearchPlaces.mockResolvedValue({ success: true, data: [MANNARGUDI] });

    render(<PlaceCombobox value="" onChange={() => {}} aria-label="Birth place" />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "mann" } });

    await waitFor(() => expect(mockSearchPlaces).toHaveBeenCalledWith("mann", 20));
    expect(await screen.findByText("Mannargudi, Tamil Nadu, India")).toBeTruthy();
  });

  it("selecting a result calls onChange with the qualified name and string coordinates", async () => {
    mockSearchPlaces.mockResolvedValue({ success: true, data: [MANNARGUDI] });
    const onChange = vi.fn();

    render(<PlaceCombobox value="" onChange={onChange} aria-label="Birth place" />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "mann" } });
    const option = await screen.findByText("Mannargudi, Tamil Nadu, India");
    fireEvent.mouseDown(option);

    expect(onChange).toHaveBeenLastCalledWith(
      { name: "Mannargudi, Tamil Nadu, India", lat: "10.6667", lng: "79.4833", timezone: "Asia/Kolkata" },
      "Mannargudi, Tamil Nadu, India",
    );
  });

  it("typing without selecting never claims a match", () => {
    const onChange = vi.fn();
    render(<PlaceCombobox value="" onChange={onChange} aria-label="Birth place" />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "mann" } });
    expect(onChange).toHaveBeenLastCalledWith(null, "mann");
  });
});

describe("PlaceCombobox — explicit online fallback (B-006 owner ruling)", () => {
  it("offers the online-search link only after a real miss, and never calls it automatically", async () => {
    mockSearchPlaces.mockResolvedValue({ success: true, data: [] });
    render(<PlaceCombobox value="" onChange={() => {}} aria-label="Birth place" />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "nowhereville" } });

    await screen.findByText("No matches found");
    expect(screen.getByText("Can't find it? Search online")).toBeTruthy();
    expect(mockApiFetchJson).not.toHaveBeenCalled();
  });

  it("clicking the online-search link geocodes the typed text and selects the result", async () => {
    mockSearchPlaces.mockResolvedValue({ success: true, data: [] });
    mockApiFetchJson.mockResolvedValue({ lat: 43.6532, lon: -79.3832, countryCode: "ca", timezone: "America/Toronto", error: null });
    const onChange = vi.fn();

    render(<PlaceCombobox value="" onChange={onChange} aria-label="Birth place" />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Toronto" } });
    const link = await screen.findByText("Can't find it? Search online");
    fireEvent.mouseDown(link);

    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(
      { name: "Toronto", lat: "43.6532", lng: "-79.3832", timezone: "America/Toronto" },
      "Toronto",
    ));
    expect(mockApiFetchJson).toHaveBeenCalledWith("/geo/geocode", expect.objectContaining({ method: "POST" }));
  });

  it("shows a failure message, not a silent no-op, when the online fallback also misses", async () => {
    mockSearchPlaces.mockResolvedValue({ success: true, data: [] });
    mockApiFetchJson.mockResolvedValue({ lat: null, lon: null, countryCode: null, timezone: null, error: "not_found" });

    render(<PlaceCombobox value="" onChange={() => {}} aria-label="Birth place" />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "nowhereville" } });
    const link = await screen.findByText("Can't find it? Search online");
    fireEvent.mouseDown(link);

    expect(await screen.findByText("Couldn't find that place online either")).toBeTruthy();
  });
});
