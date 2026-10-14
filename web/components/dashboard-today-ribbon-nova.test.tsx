import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardTodayRibbonNova } from "./dashboard-today-ribbon-nova";
import { tNakshatra, tTithi } from "@/lib/i18n";
import type { PanchangamDailyResponseData, WeekAheadData } from "@/lib/types";

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

function renderRibbon(overrides: Partial<Parameters<typeof DashboardTodayRibbonNova>[0]> = {}) {
  return render(
    <DashboardTodayRibbonNova
      lang="en"
      panchangam={panchangamFixture()}
      weekAhead={null}
      selectedDate="2026-06-04"
      now={new Date("2026-06-04T08:00:00+05:30")}
      timeZone="Asia/Kolkata"
      {...overrides}
    />,
  );
}

describe("DashboardTodayRibbonNova glossary", () => {
  it("glosses every kala on the bar once it is selected", () => {
    renderRibbon();

    for (const label of ["Yamagandam", "Rahu Kalam", "Kuligai", "Nalla Neram"]) {
      fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${label} \\d`) }));
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }

    fireEvent.click(screen.getByRole("button", { name: /^Rahu Kalam \d/ }));
    fireEvent.click(screen.getByRole("button", { name: "Rahu Kalam" }));
    // `[data-glossary-panel]`, not `role="tooltip"`: the panel is a click-toggled
    // disclosure holding a keyboard-reachable link, which a tooltip may not be.
    // See glossary-term.tsx.
    expect(document.querySelector("[data-glossary-panel]")).toHaveTextContent(/starting anything new/i);
  });

  it("marks the same currently-running kalam that the hero resolves", () => {
    renderRibbon({ now: new Date("2026-06-04T06:30:00+05:30") });

    const live = document.querySelector("[data-current-kalam]");
    expect(live).toHaveAttribute("data-current-kalam", "yamagandam");
    expect(live).toHaveAttribute("aria-current", "time");
  });

  it("surfaces the current and next hora with localized planet names", () => {
    const data = panchangamFixture();
    data.hora = [
      { index: 1, lord: "JUPITER", start: "07:45", end: "08:45" },
      { index: 2, lord: "MARS", start: "08:45", end: "09:45" },
    ];

    renderRibbon({ panchangam: data });

    expect(screen.getByLabelText("Current hora")).toHaveTextContent("Jupiter");
    expect(screen.getByLabelText("Current hora")).toHaveTextContent("then Mars at 8:45 am");
  });

  it("renders the week as dated controls that open the calendar", () => {
    const weekAhead = {
      days: [
        { dateLocal: "2026-06-04", score: 72, label: "GOOD" },
        { dateLocal: "2026-06-05", score: 54, label: "MIXED" },
      ],
    } as unknown as WeekAheadData;
    let opens = 0;

    renderRibbon({ weekAhead, onGoToCalendar: () => { opens += 1; } });

    const thursday = screen.getByRole("button", { name: /Thu 4: 72 \/ 100/i });
    expect(thursday).toHaveAttribute("data-selected", "true");
    fireEvent.click(thursday);
    expect(opens).toBe(1);
  });
});

/* 2026-09-26. A redesign pass re-printed on this card what the hero directly
   above already shows: the star and tithi names, the full list of named
   timings with their ranges, a numeric day score, and a second "full almanac"
   button — and printed sunrise/sunset twice inside the card itself. These pin
   the card to what only it shows. */
describe("DashboardTodayRibbonNova does not repeat the hero", () => {
  it("prints one timing window at a time, not the hero's list", () => {
    const { container } = renderRibbon();

    // 08:00 sits inside the 07:20–08:56 Nalla Neram: the readout names that
    // window and no other.
    const ranges = container.querySelectorAll(".day-ribbon__time");
    expect(ranges).toHaveLength(1);
    expect(ranges[0]).toHaveTextContent("7:20 am – 8:56 am");
    expect(container.querySelector(".day-ribbon__detail")).toHaveTextContent(/^Now/);
  });

  it("does not print today's star or tithi name until a change-over is selected", () => {
    renderRibbon();

    // The hero masthead owns the names; here they appear only as the answer
    // to "when does it change?".
    const star = tNakshatra("ROHINI", "en");
    const tithi = tTithi("CHATURTHI", "en");
    expect(document.body).not.toHaveTextContent(star);
    expect(document.body).not.toHaveTextContent(tithi);

    fireEvent.click(screen.getByRole("button", { name: "Star changes at 2:20 pm" }));
    expect(document.querySelector(".day-ribbon__detail")).toHaveTextContent(`${star} until 2:20 pm, then`);

    fireEvent.click(screen.getByRole("button", { name: "Tithi changes at 9:10 pm" }));
    expect(document.querySelector(".day-ribbon__detail")).toHaveTextContent(`${tithi} until 9:10 pm, then`);
  });

  it("does not place a change-over that falls on the next date", () => {
    const data = panchangamFixture();
    data.nakshatra.endsAt = "10:35";
    data.nakshatra.endsAtIso = "2026-06-05T10:35:00+05:30";

    renderRibbon({ panchangam: data });

    // Without the date check this would land on TODAY's 10:35.
    expect(screen.queryByRole("button", { name: /Star changes/ })).not.toBeInTheDocument();
  });

  it("prints sunrise and sunset exactly once each", () => {
    renderRibbon();

    expect(screen.getAllByText("5:45 am")).toHaveLength(1);
    expect(screen.getAllByText("6:29 pm")).toHaveLength(1);
  });

  it("keeps the week's scores out of the visible text, and has no second almanac button", () => {
    const weekAhead = {
      days: [
        { dateLocal: "2026-06-04", score: 72, label: "GOOD" },
        { dateLocal: "2026-06-05", score: 54, label: "MIXED" },
      ],
    } as unknown as WeekAheadData;

    renderRibbon({ weekAhead, onGoToCalendar: () => {} });

    expect(screen.queryByText("72")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Full panchangam/i })).not.toBeInTheDocument();
  });

  it("names the Tamil week in Tamil, including the day's standing", () => {
    const weekAhead = {
      days: [{ dateLocal: "2026-06-04", score: 72, label: "GOOD" }],
    } as unknown as WeekAheadData;

    renderRibbon({ lang: "ta", weekAhead, onGoToCalendar: () => {} });

    // aria-label is rendering: an English band label here would read out
    // "strong day" to a Tamil screen-reader user.
    const day = screen.getByRole("button", { name: /72 \/ 100/ });
    expect(day.getAttribute("aria-label")).toContain("நல்ல நாள்");
    expect(day.getAttribute("aria-label")).not.toMatch(/[A-Za-z]{3,}/);
  });
});

describe("DashboardTodayRibbonNova on another date", () => {
  it("draws no NOW and asks the reader to pick a window", () => {
    const { container } = renderRibbon({ now: new Date("2026-06-03T08:00:00+05:30") });

    expect(container.querySelector(".day-ribbon__now-chip")).toBeNull();
    expect(container.querySelector(".day-ribbon__detail")).toHaveTextContent(/Select any part of the timeline/);
  });
});

/* §2.4 of docs/HOME_CALENDAR_CHARTS_PROPOSALS_2026-09-22.md: every time on
   this card is cut from sunrise at one place, so the card names that place
   without waiting to be asked. */
describe("DashboardTodayRibbonNova place label", () => {
  function renderWithPlace(place: string | null | undefined, lang: "en" | "ta" = "en") {
    return render(
      <DashboardTodayRibbonNova
        lang={lang}
        panchangam={panchangamFixture()}
        weekAhead={null}
        selectedDate="2026-06-04"
        now={new Date("2026-06-04T08:00:00+05:30")}
        timeZone="Asia/Kolkata"
        place={place}
      />,
    );
  }

  it("names the place the day's timings were computed for, city only", () => {
    renderWithPlace("Chennai, Tamil Nadu, India");

    const label = screen.getByText("Timings for Chennai");
    expect(label).toBeInTheDocument();
    // The whole saved string survives in the title: shortening is a layout
    // decision, not a loss of what the reader actually saved.
    expect(label).toHaveAttribute("title", "Chennai, Tamil Nadu, India");
  });

  it("names it in Tamil in the almanac's own form", () => {
    renderWithPlace("Chennai, Tamil Nadu, India", "ta");

    // "<place> நேரப்படி" — by Chennai time. Not a translated preposition:
    // the saved place is a Latin-script string and a Tamil case suffix does not
    // attach to one cleanly. A Tamil reader must still be told the place, so an
    // en-only assertion would not have covered this surface.
    expect(screen.getByText("Chennai நேரப்படி")).toBeInTheDocument();
  });

  it("prints no label at all when no place is known", () => {
    // A profile with no usable location resolves to no place. An empty
    // "Timings for" would be worse than silence.
    renderWithPlace(null);

    expect(screen.queryByText(/Timings for/)).not.toBeInTheDocument();
    expect(screen.getByText(/sunrise/)).toBeInTheDocument();
  });
});
