import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { askVinaadi } from "@/api/askVinaadi";
import { trackEvent } from "@/lib/analytics";
import AskVinaadiScreen from "../app/ask-vinaadi";

jest.mock("expo-router", () => ({
  router: { back: jest.fn(), push: jest.fn() },
  useLocalSearchParams: () => ({ chartId: "synthetic-chart-id" }),
}));
jest.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: { questionsUsedToday: 0, dailyLimit: 5, chipsRemaining: 5 },
  }),
}));
jest.mock("@/hooks/useColors", () => ({ useColors: () => ({}) }));
jest.mock("@/hooks/useI18n", () => ({ useI18n: () => ({ lang: "en" }) }));
jest.mock("@/hooks/useSession", () => ({ useSession: () => ({ tier: "premium" }) }));
jest.mock("@/hooks/useLifeFocus", () => ({ useLifeFocus: () => ({ mode: "CAREER" }) }));
jest.mock("@/api/askVinaadi", () => ({
  getDailyStatus: jest.fn(),
  askVinaadi: jest.fn(() => new Promise(() => {})),
}));
jest.mock("@/lib/analytics", () => ({ trackEvent: jest.fn() }));

it("records a consent-gated Ask chip tap by focus without sending its text", () => {
  render(<AskVinaadiScreen />);

  fireEvent.press(screen.getByText("How is my work energy today?"));

  expect(trackEvent).toHaveBeenCalledWith("life_focus_ask_chip_tapped", {
    focus: "CAREER",
    surface: "mobile",
    chip_index: 0,
  });
  expect(askVinaadi).toHaveBeenCalledWith(
    "synthetic-chart-id",
    "How is my work energy today?",
    "en",
    true,
  );
});
