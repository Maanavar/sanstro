import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardTodayRibbonNova } from "./dashboard-today-ribbon-nova";
import type { PanchangamDailyResponseData } from "@/lib/types";

function panchangamFixture(): PanchangamDailyResponseData {
  return {
    dateLocal: "2026-06-04",
    location: { lat: 13.0827, lng: 80.2707, timezone: "Asia/Kolkata" },
    sunrise: "05:45",
    sunset: "18:29",
    solarNoon: "12:07",
    vara: { weekday: "THURSDAY", lord: "GURU" },
    tithi: {
      number: 4,
      name: "CHATURTHI",
      paksha: "SHUKLA",
      endsAt: "21:10",
      endsAtIso: "2026-06-04T21:10:00+05:30",
      nextNumber: 5,
      nextName: "PANCHAMI",
      nextPaksha: "SHUKLA",
    },
    nakshatra: {
      name: "ROHINI",
      pada: 2,
      endsAt: "14:20",
      endsAtIso: "2026-06-04T14:20:00+05:30",
      nextName: "MRIGASHIRA",
    },
    yoga: { number: 7, name: "SUKARMA", endsAt: "16:40", endsAtIso: "2026-06-04T16:40:00+05:30", nextName: "DHRITI" },
    karana: { name: "VANIJA", endsAt: "10:05", endsAtIso: "2026-06-04T10:05:00+05:30", nextName: "VISHTI" },
    kalam: {
      rahuKalam: { start: "13:42", end: "15:18", slot: 6 },
      yamagandam: { start: "05:45", end: "07:20", slot: 1 },
      kuligai: { start: "08:56", end: "10:31", slot: 3 },
      gowriPanchangam: [],
      nallaNeram: [{ start: "07:20", end: "08:56", slot: 1, name: "SUGAM", period: "AM", isGood: true }],
      gowriNallaNeram: [],
    },
    abhijit: { start: "11:52", end: "12:22", isRestrictedByWeekday: false },
    subhaMuhurtham: { isSubha: true, reason: "", isSubhaStrict: false, strictReason: "" },
    festivals: [],
    hora: [],
    moonPhaseLabel: "WAXING",
    soolam: { direction: "SOUTH", parigaram: "CURD" },
    lagnam: { rasiNumber: 3, rasiName: "Mithunam", endsAt: "07:30", endsAtIso: "2026-06-04T07:30:00+05:30", nazhigai: 2, vinadi: 30 },
    nethiram: "OPEN",
    jeevan: "SUKKILAN",
    amirdhadhiYogam: { name: "AMIRTHA", endsAt: "14:20", endsAtIso: "2026-06-04T14:20:00+05:30", nextName: "SIDDHA" },
    chandrashtamamToday: {
      moonRasiNumber: 2,
      moonRasiName: "Rishabam",
      affectedJanmaRasiNumber: 7,
      affectedJanmaRasiName: "Thulam",
      nakshatras: [],
      janmaNakshatraWindows: [],
    },
  } as unknown as PanchangamDailyResponseData;
}

describe("DashboardTodayRibbonNova glossary", () => {
  it("renders every kala legend term as a tappable glossary control", () => {
    render(
      <DashboardTodayRibbonNova
        lang="en"
        panchangam={panchangamFixture()}
        weekAhead={null}
        selectedDate="2026-06-04"
        now={new Date("2026-06-04T08:00:00+05:30")}
        timeZone="Asia/Kolkata"
      />,
    );

    for (const label of ["Yamagandam", "Rahu Kalam", "Kuligai", "Nalla Neram"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }

    fireEvent.click(screen.getByRole("button", { name: "Rahu Kalam" }));
    // `[data-glossary-panel]`, not `role="tooltip"`: the panel is a click-toggled
    // disclosure holding a keyboard-reachable link, which a tooltip may not be.
    // See glossary-term.tsx.
    expect(document.querySelector("[data-glossary-panel]")).toHaveTextContent(/starting anything new/i);
  });
});
