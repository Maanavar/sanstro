/**
 * A `CONSENT_REQUIRED` answer reopens the consent sheet (audit 2026-11-03, Part 3).
 *
 * Before this, a mobile account with no service consent that tried to save a
 * birth profile got an error and had no screen that could answer it. The API
 * client now asks the sheet to open whenever the server names that code.
 *
 * WHAT THIS SUITE CANNOT SEE: that the sheet renders. It proves the client
 * raises the request and that any other error code does not.
 */
jest.mock("expo-router", () => ({ router: { replace: jest.fn() } }));
jest.mock("react-native", () => ({ Platform: { OS: "android" } }));
jest.mock("@/lib/secureStore", () => ({
  getTokens: jest.fn(() => Promise.resolve({ accessToken: "a", refreshToken: "r" })),
  setTokens: jest.fn(() => Promise.resolve()),
  clearTokens: jest.fn(() => Promise.resolve()),
}));
jest.mock("@/state/sessionTransition", () => ({ endSession: () => Promise.resolve() }));
jest.mock("@/lib/env", () => ({ ENV: { API_BASE_URL: "https://api.test" } }));

import { apiPost } from "@/api/client";
import { onConsentSheetRequested } from "@/lib/consentPrompt";

function answer(status: number, code: string) {
  global.fetch = jest.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify({ error: { code, message: { en: "x", ta: "x" } } }), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  ) as unknown as typeof fetch;
}

describe("consent sheet request", () => {
  it("opens the sheet when the server answers CONSENT_REQUIRED", async () => {
    answer(403, "CONSENT_REQUIRED");
    const listener = jest.fn();
    const off = onConsentSheetRequested(listener);
    await expect(apiPost("/birth-profiles", {})).rejects.toThrow();
    off();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("does not open it for any other error", async () => {
    answer(403, "PERMISSION_DENIED");
    const listener = jest.fn();
    const off = onConsentSheetRequested(listener);
    await expect(apiPost("/birth-profiles", {})).rejects.toThrow();
    off();
    expect(listener).not.toHaveBeenCalled();
  });

  it("stops calling a listener once it unsubscribes", async () => {
    answer(403, "CONSENT_REQUIRED");
    const listener = jest.fn();
    onConsentSheetRequested(listener)();
    await expect(apiPost("/birth-profiles", {})).rejects.toThrow();
    expect(listener).not.toHaveBeenCalled();
  });
});
