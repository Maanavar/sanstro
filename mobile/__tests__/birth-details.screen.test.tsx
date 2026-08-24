/**
 * B-006 — birth-details.tsx used to geocode automatically (onBlur and again
 * on submit) via a third-party Nominatim proxy; the owner ruling requires a
 * bundled offline dataset by default with online geocoding as an explicit,
 * opt-in fallback only. These pin the properties that changed:
 *
 *   1. no network geocode call fires just from typing/blurring the field,
 *   2. picking a bundled suggestion is what submit actually uses,
 *   3. submit is blocked (named error, not a silent geocode) until a place
 *      is selected — either a suggestion or a completed online search,
 *   4. the online-search fallback is reachable, but only after a real miss,
 *      and only by an explicit tap.
 *
 * Rendered with no LanguageProvider/SessionProvider ancestor — `useLanguage`/
 * `useSession` fall back to their context defaults (`lang: "ta"`, guest,
 * no user) exactly as they would for any consumer with no provider mounted,
 * so the screen renders in Tamil. Assertions below match that default
 * on purpose, not as a Tamil-specific test.
 */
import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { router } from "expo-router";
import { fetchWithAuth } from "@/api/client";
import { createBirthProfile } from "@/api/charts";
import { searchPlaces } from "@vinaadi/shared/api/places";
import { setPrimaryChartId, setPrimaryProfileId } from "@/lib/userPrefs";
import { trackEvent } from "@/lib/analytics";

import BirthDetailsScreen from "../app/(onboarding)/birth-details";

jest.mock("expo-router", () => ({
  router: { replace: jest.fn(), back: jest.fn() },
}));
// Decorative only; imports react-native-reanimated, which isn't runnable
// under Jest in this app yet — see jest.setup.screens.js.
jest.mock("@/components/OnboardingProgressBar", () => ({
  OnboardingProgressBar: () => null,
}));
jest.mock("@/api/client", () => ({ fetchWithAuth: jest.fn() }));
jest.mock("@/api/charts", () => ({ createBirthProfile: jest.fn() }));
jest.mock("@vinaadi/shared/api/places", () => ({ searchPlaces: jest.fn() }));
jest.mock("@/lib/userPrefs", () => ({
  setPrimaryChartId: jest.fn(),
  setPrimaryProfileId: jest.fn(),
}));
jest.mock("@/lib/analytics", () => ({ trackEvent: jest.fn() }));

const mockFetchWithAuth = jest.mocked(fetchWithAuth);
const mockCreateBirthProfile = jest.mocked(createBirthProfile);
const mockSearchPlaces = jest.mocked(searchPlaces);

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

function geocodeResponse(body: unknown, ok = true) {
  return { ok, json: () => Promise.resolve(body) } as Response;
}

async function fillStep0AndAdvance() {
  fireEvent.changeText(screen.getByPlaceholderText("உங்கள் பெயர்"), "Test User");
  fireEvent.changeText(screen.getByPlaceholderText("நாள்"), "18");
  fireEvent.changeText(screen.getByPlaceholderText("மாதம்"), "4");
  fireEvent.changeText(screen.getByPlaceholderText("ஆண்டு"), "1992");
  fireEvent.press(screen.getByText("அடுத்தது →"));
  await screen.findByText("பிறந்த நேரமும் இடமும்");
}

beforeEach(() => {
  mockFetchWithAuth.mockReset();
  mockCreateBirthProfile.mockReset();
  mockSearchPlaces.mockReset();
  jest.mocked(router.replace).mockReset();
  mockCreateBirthProfile.mockResolvedValue({
    success: true,
    data: { birthProfileId: "profile-1", chartId: "chart-1" },
  } as never);
});

describe("BirthDetailsScreen — bundled place search (B-006)", () => {
  it("does not geocode automatically while typing or blurring the field", async () => {
    mockSearchPlaces.mockResolvedValue({ success: true, data: [MANNARGUDI] });
    render(<BirthDetailsScreen />);
    await fillStep0AndAdvance();

    const placeInput = screen.getByPlaceholderText("நகரம் தட்டச்சு செய்யவும்");
    fireEvent.changeText(placeInput, "mann");
    fireEvent(placeInput, "blur");

    await screen.findByText("Mannargudi, Tamil Nadu, India");
    expect(mockFetchWithAuth).not.toHaveBeenCalled();
  });

  it("lists a bundled suggestion after a debounced search and selecting it fills the timezone", async () => {
    mockSearchPlaces.mockResolvedValue({ success: true, data: [MANNARGUDI] });
    render(<BirthDetailsScreen />);
    await fillStep0AndAdvance();

    fireEvent.changeText(screen.getByPlaceholderText("நகரம் தட்டச்சு செய்யவும்"), "mann");
    await waitFor(() => expect(mockSearchPlaces).toHaveBeenCalledWith("mann", 20));

    fireEvent.press(await screen.findByText("Mannargudi, Tamil Nadu, India"));
    expect(await screen.findByDisplayValue("Asia/Kolkata")).toBeTruthy();
  });

  it("blocks submit with a named error until a place is actually selected", async () => {
    mockSearchPlaces.mockResolvedValue({ success: true, data: [MANNARGUDI] });
    render(<BirthDetailsScreen />);
    await fillStep0AndAdvance();

    // Typed, but never picked from the list.
    fireEvent.changeText(screen.getByPlaceholderText("நகரம் தட்டச்சு செய்யவும்"), "mann");
    fireEvent.changeText(screen.getByPlaceholderText("HH"), "09");
    fireEvent.changeText(screen.getByPlaceholderText("MM"), "15");
    fireEvent.press(screen.getByText("ஜாதகம் உருவாக்கு"));

    await screen.findByText("பட்டியலிலிருந்து ஒரு இடத்தைத் தேர்ந்தெடுக்கவும், அல்லது கீழே ஆன்லைனில் தேடவும்.");
    expect(mockCreateBirthProfile).not.toHaveBeenCalled();
  });

  it("submits the selected suggestion's coordinates and timezone, then navigates", async () => {
    mockSearchPlaces.mockResolvedValue({ success: true, data: [MANNARGUDI] });
    render(<BirthDetailsScreen />);
    await fillStep0AndAdvance();

    fireEvent.changeText(screen.getByPlaceholderText("நகரம் தட்டச்சு செய்யவும்"), "mann");
    fireEvent.press(await screen.findByText("Mannargudi, Tamil Nadu, India"));
    fireEvent.changeText(screen.getByPlaceholderText("HH"), "09");
    fireEvent.changeText(screen.getByPlaceholderText("MM"), "15");

    await act(async () => {
      fireEvent.press(screen.getByText("ஜாதகம் உருவாக்கு"));
    });

    expect(mockCreateBirthProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        birthPlace: "Mannargudi, Tamil Nadu, India",
        birthLatitude: 10.6667,
        birthLongitude: 79.4833,
        birthTimezone: "Asia/Kolkata",
      }),
    );
    expect(router.replace).toHaveBeenCalled();
  });

  it("offers the online-search fallback only after a real miss, and it is reachable", async () => {
    mockSearchPlaces.mockResolvedValue({ success: true, data: [] });
    mockFetchWithAuth.mockResolvedValue(
      geocodeResponse({ lat: 43.6532, lon: -79.3832, countryCode: "ca", timezone: "America/Toronto", error: null }),
    );
    render(<BirthDetailsScreen />);
    await fillStep0AndAdvance();

    fireEvent.changeText(screen.getByPlaceholderText("நகரம் தட்டச்சு செய்யவும்"), "Toronto");
    await screen.findByText("பொருத்தங்கள் இல்லை");
    expect(mockFetchWithAuth).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.press(screen.getByText("கிடைக்கவில்லையா? ஆன்லைனில் தேடு"));
    });

    expect(mockFetchWithAuth).toHaveBeenCalledWith("/geo/geocode", expect.objectContaining({ method: "POST" }));
    expect(await screen.findByDisplayValue("America/Toronto")).toBeTruthy();
  });
});
