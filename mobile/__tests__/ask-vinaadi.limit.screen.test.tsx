import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { askVinaadi } from "@/api/askVinaadi";
import { ApiError } from "@/api/client";
import AskVinaadiScreen from "../app/ask-vinaadi";

// The quota day is Kolkata's, so the limit bar names the reset instant the
// server sends rather than "tomorrow" (packages/shared/src/askAllowance.ts).

let mockStatus: Record<string, unknown> = {};

jest.mock("expo-router", () => ({
  router: { back: jest.fn(), push: jest.fn() },
  useLocalSearchParams: () => ({ chartId: "synthetic-chart-id" }),
}));
jest.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: mockStatus }),
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));
jest.mock("@/hooks/useColors", () => ({ useColors: () => ({}) }));
jest.mock("@/hooks/useI18n", () => ({ useI18n: () => ({ lang: "en" }) }));
jest.mock("@/hooks/useSession", () => ({ useSession: () => ({ tier: "registered", gateTier: "registered", openBeta: true }) }));
jest.mock("@/hooks/useLifeFocus", () => ({ useLifeFocus: () => ({ mode: "CAREER" }) }));
jest.mock("@/api/askVinaadi", () => ({ getDailyStatus: jest.fn(), askVinaadi: jest.fn() }));
jest.mock("@/api/client", () => {
  class MockApiError extends Error {
    readonly status: number;
    readonly apiError?: unknown;
    constructor(httpStatus: number, message: string, envelope?: unknown) {
      super(message);
      this.status = httpStatus;
      this.apiError = envelope;
    }
  }
  return { ApiError: MockApiError };
});
jest.mock("@/lib/analytics", () => ({ trackEvent: jest.fn() }));

const inAnHour = () => new Date(Date.now() + 3_600_000).toISOString();

function statusWith(overrides: Record<string, unknown>) {
  return {
    chipsUsed: 0, chipsRemaining: 7, isPremium: false, openBeta: true,
    dailyLimit: 7, monthlyLimit: null, resetsAt: inAnHour(), ...overrides,
  };
}

it("shows the shared limit sentence and offers no Premium link in the open beta", () => {
  mockStatus = statusWith({ chipsUsed: 7, chipsRemaining: 0 });
  render(<AskVinaadiScreen />);

  expect(screen.getByText(/^You've used today's 7 questions\. Ask again /)).toBeTruthy();
  expect(screen.queryByText(/Come back tomorrow/)).toBeNull();
  expect(screen.queryByText("Premium →")).toBeNull();
});

it("offers Premium only when an upgrade exists", () => {
  mockStatus = statusWith({ chipsUsed: 7, chipsRemaining: 0, openBeta: false });
  render(<AskVinaadiScreen />);

  expect(screen.getByText("Premium →")).toBeTruthy();
});

it("does not block on a count from before the reset instant", () => {
  mockStatus = statusWith({ chipsUsed: 7, chipsRemaining: 0, resetsAt: new Date(Date.now() - 1000).toISOString() });
  render(<AskVinaadiScreen />);

  expect(screen.queryByText(/^You've used today's/)).toBeNull();
});

it("reports a burst rate limit as slow down, not as a spent quota", async () => {
  mockStatus = statusWith({});
  (askVinaadi as jest.Mock).mockRejectedValueOnce(
    new ApiError(429, "Rate limit exceeded.", {
      code: "RATE_LIMITED",
      message: { en: "Too many requests. Please wait a moment and try again.", ta: "…" },
      requestId: null,
      detail: "Rate limit exceeded. Please slow down.",
      status: 429,
    }),
  );
  render(<AskVinaadiScreen />);

  fireEvent.press(screen.getByText("How is my work energy today?"));

  await waitFor(() => expect(screen.getByText("Too many requests. Please wait a moment and try again.")).toBeTruthy());
  expect(screen.queryByText(/^You've used today's/)).toBeNull();
});
