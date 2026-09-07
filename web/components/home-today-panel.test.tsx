import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import type { PanchangamDailyResponseData } from "@/lib/types";

/**
 * The marketing hero's demonstration card used to be a mock — a hardcoded 64, a
 * hardcoded best window, a day-arc SVG whose bars marked nothing — on a page
 * whose own trust proof one section below reads "Method, not marketing".
 *
 * These pin the two properties that make the replacement worth having, both of
 * which fail silently:
 *
 *   1. Every value on it is today's real almanac. A future edit that reaches for
 *      a placeholder "so the card looks full while loading" reintroduces exactly
 *      the defect this replaced, and looks reasonable in a diff.
 *   2. The doctrine matches the dashboard's. Two surfaces, same reader, same
 *      kind of claim — a landing page that recommends a window inside Rahu
 *      Kalam, or that calls Abhijit auspicious one row under a card boasting
 *      "clear of the kalas", is the app contradicting itself in public.
 */

const getRasiPalan = vi.fn();
vi.mock("@vinaadi/shared/api", () => ({
  getRasiPalan: (...args: unknown[]) => getRasiPalan(...args),
}));

// Synthetic Friday in Chennai. No real birth data anywhere in this file.
// Backend enum spellings, not guesses: a fixture that invents a key renders the
// raw enum and the Tamil-mode assertion below would pass while the UI leaked.
function fixture(overrides: Partial<PanchangamDailyResponseData> = {}): PanchangamDailyResponseData {
  return {
    dateLocal: "2026-09-04",
    location: { lat: 13.0827, lng: 80.2707, timezone: "Asia/Kolkata" },
    sunrise: "06:14",
    sunset: "18:25",
    solarNoon: "12:19",
    vara: { weekday: "FRIDAY", lord: "SUKRAN" },
    tithi: {
      number: 23, name: "ASHTAMI", paksha: "KRISHNA", endsAt: "20:10", endsAtIso: "2026-09-04T20:10",
      nextNumber: 24, nextName: "NAVAMI", nextPaksha: "KRISHNA",
    },
    nakshatra: { name: "ROHINI", pada: 2, endsAt: "22:20", endsAtIso: "2026-09-04T22:20", nextName: "MRIGASHIRA" },
    yoga: { number: 7, name: "SUKARMA", endsAt: "16:40", endsAtIso: "2026-09-04T16:40", nextName: "DHRITI" },
    karana: { name: "VANIJA", endsAt: "10:05", endsAtIso: "2026-09-04T10:05", nextName: "VISHTI" },
    kalam: {
      rahuKalam: { start: "10:48", end: "12:19", slot: 4 },
      yamagandam: { start: "15:22", end: "16:53", slot: 7 },
      kuligai: { start: "07:45", end: "09:16", slot: 2 },
      gowriPanchangam: [
        { start: "06:14", end: "07:45", slot: 1, name: "SUGAM", period: "DAY", isGood: true },
        { start: "10:48", end: "12:19", slot: 4, name: "AMIRTHAM", period: "DAY", isGood: true },
        { start: "12:19", end: "13:50", slot: 5, name: "UTHI", period: "DAY", isGood: true },
      ],
      nallaNeram: [
        { start: "06:14", end: "07:45", slot: 1, name: "SUGAM", period: "AM", isGood: true },
        { start: "16:53", end: "18:25", slot: 8, name: "LABHAM", period: "PM", isGood: true },
      ],
      gowriNallaNeram: [],
    },
    abhijit: { start: "11:55", end: "12:44", isRestrictedByWeekday: false },
    subhaMuhurtham: { isSubha: true, reason: "", isSubhaStrict: false, strictReason: "" },
    festivals: [
      { name: "World Literacy Day", category: "observance" },
      { name: "Krishna Jayanthi", category: "hindu" },
    ],
    hora: [],
    moonPhaseLabel: "WANING",
    soolam: { direction: "மேற்கு", parigaram: "பால்" },
    lagnam: { rasiNumber: 6, rasiName: "Kanni", endsAt: "07:30", endsAtIso: "2026-09-04T07:30", nazhigai: 2, vinadi: 30 },
    nethiram: "OPEN",
    jeevan: "SUKKILAN",
    amirdhadhiYogam: { name: "அமிர்தயோகம்", endsAt: "22:20", endsAtIso: "2026-09-04T22:20", nextName: "சித்தயோகம்" },
    chandrashtamamToday: {
      moonRasiNumber: 2, moonRasiName: "Rishabam",
      affectedJanmaRasiNumber: 7, affectedJanmaRasiName: "Thulam",
      nakshatras: [], janmaNakshatraWindows: [],
    },
    ...overrides,
  };
}

/** Epoch ms of an IST wall-clock time on the fixture's day. */
function ist(hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(2026, 8, 4, h - 5, m - 30));
}

async function renderPanel(options: {
  at: string;
  lang?: "en" | "ta";
  panchangam?: PanchangamDailyResponseData | null;
  failed?: boolean;
} ) {
  vi.setSystemTime(ist(options.at));
  const { HomeTodayPanel } = await import("./home-today-panel");
  return render(
    <HomeTodayPanel
      panchangam={options.panchangam === undefined ? fixture() : options.panchangam}
      failed={options.failed ?? false}
      lang={options.lang ?? "en"}
      dateLocal="2026-09-04"
    />,
  );
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  getRasiPalan.mockReset();
  getRasiPalan.mockResolvedValue({
    rasi: 8, rasiName: { en: "Viruchigam", ta: "விருச்சிகம்" }, date: "2026-09-04",
    moonRasi: 2, moonHouse: 7,
    headline: { en: "Relationships", ta: "உறவுகள்" },
    body: {
      en: "Partnerships and social interactions are highlighted.",
      ta: "கூட்டாண்மை மற்றும் சமூகத் தொடர்புகள் முன்னிலை பெறுகின்றன.",
    },
    luckyColor: { en: "", ta: "" }, luckyNumbers: [],
    pariharam: { en: "", ta: "" }, tone: "neutral",
  });
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Hero today panel — nothing on it is invented", () => {
  it("prints the day's real timings, not the old hardcoded sample window", async () => {
    const { container } = await renderPanel({ at: "10:30" });

    // The retired mock's constants. If any of these reappear the card has gone
    // back to describing a day that does not exist.
    expect(container.textContent).not.toContain("11:53");
    expect(container.textContent).not.toContain("12:41");
    expect(container.textContent).not.toContain("15:28");
    // Rahu Kalam appears twice by design — on the avoid card and again in the
    // disclosure — so this is scoped to the card rather than a bare getByText.
    const avoid = container.querySelector(".cl-today__window--avoid")!;
    expect(within(avoid as HTMLElement).getByText(/10:48 am/)).toBeInTheDocument();
  });

  it("shows no day score, because a visitor has no chart to score", async () => {
    const { container } = await renderPanel({ at: "10:30" });

    // The dashboard's dial reads a real per-chart number. Any number in that
    // role here would be fabricated — which is the defect this panel replaced.
    expect(container.querySelector(".cl-dial")).toBeNull();
    expect(container.textContent).not.toMatch(/\b64\b/);
  });

  it("names the location the times belong to", async () => {
    await renderPanel({ at: "10:30" });

    // An unlabelled Rahu Kalam is wrong for a reader in Coimbatore by minutes
    // and for one in Toronto by hours.
    expect(screen.getByText(/Today in Chennai/i)).toBeInTheDocument();
  });
});

describe("Hero today panel — the promoted window", () => {
  it("skips the better-ranked kala that sits inside Rahu Kalam", async () => {
    const { container } = await renderPanel({ at: "06:30" });

    const best = container.querySelector(".cl-today__window--best")!;
    // AMIRTHAM outranks UTHI but runs 10:48-12:19, exactly Rahu Kalam.
    expect(within(best as HTMLElement).getByText("12:19 pm – 1:50 pm")).toBeInTheDocument();
    expect(best.textContent).toContain("Uthi");
    expect(best.textContent).toContain("Clear of Rahu Kalam, Yamagandam and Kuligai");
  });

  it("counts down to the window before it opens", async () => {
    const { container } = await renderPanel({ at: "12:01" });

    const best = container.querySelector(".cl-today__window--best")!;
    expect(best.textContent).toContain("starts in 18m");
  });

  it("switches to a live remaining-time once it is running", async () => {
    const { container } = await renderPanel({ at: "13:32" });

    const best = container.querySelector(".cl-today__window--best")!;
    expect(best.textContent).toContain("on now");
    expect(best.textContent).toContain("18m left");
  });
});

describe("Hero today panel — the avoid axis", () => {
  /**
   * The dashboard hero review's finding 4: the opportunity axis had a countdown
   * and three phase states while the safety axis had none, so the avoid card
   * went silent at exactly the moment the reader was standing inside the window
   * it exists to warn about. A caution earns live state more than an invitation
   * does — and that must hold on the surface a stranger sees first.
   */
  it("tells the reader when they are inside Rahu Kalam right now", async () => {
    const { container } = await renderPanel({ at: "12:01" });

    const avoid = container.querySelector(".cl-today__window--avoid")!;
    expect(avoid.textContent).toContain("You are inside it now");
    expect(avoid.textContent).toContain("18m left");
  });

  it("counts down to it beforehand", async () => {
    const { container } = await renderPanel({ at: "10:30" });
    expect(container.querySelector(".cl-today__window--avoid")!.textContent).toContain("in 18m");
  });

  /**
   * Pinned to a Rahu Kalam, this card sat on a period that finished at noon
   * while Yamagandam was still three hours ahead and named nowhere on the
   * panel. The safety axis has to advance through the day exactly as the
   * opportunity axis beside it does.
   */
  it("moves on to the next kala once Rahu Kalam is spent", async () => {
    const { container } = await renderPanel({ at: "16:00" });

    const avoid = container.querySelector(".cl-today__window--avoid")!;
    expect(avoid.textContent).toContain("Yamagandam");
    expect(avoid.textContent).toContain("3:22 pm – 4:53 pm");
    expect(avoid.textContent).toContain("You are inside it now");
  });

  it("falls back to Rahu Kalam, marked over, once all three are past", async () => {
    const { container } = await renderPanel({ at: "17:30" });

    const avoid = container.querySelector(".cl-today__window--avoid")!;
    expect(avoid.textContent).toContain("Rahu Kalam");
    expect(avoid.textContent).toContain("over for today");
  });
});

describe("Hero today panel — other traditional timings", () => {
  it("gives every listed row actual times, and counts what it lists", async () => {
    const { container } = await renderPanel({ at: "10:30" });

    const rows = container.querySelectorAll(".cl-today__row");
    expect(rows.length).toBe(5);
    // Finding 6 on the dashboard: "Nalla Neram" shipped as the one row with a
    // definition and no times, under a badge promising four answers.
    for (const row of rows) {
      expect(row.querySelector(".cl-today__row-value")!.textContent).toMatch(/\d/);
    }
    expect(container.querySelector(".cl-today__more-count")!.textContent).toBe(String(rows.length));
  });

  /**
   * The avoid card promotes whichever kala is next, so listing only the other
   * two here meant Rahu Kalam's times left the panel entirely once it was past
   * — and Rahu Kalam is the one of the three that a reader who knows only one
   * of them knows.
   */
  it("lists all three avoid kalas, including the one the card above is showing", async () => {
    const { container } = await renderPanel({ at: "16:00" });

    const labels = Array.from(container.querySelectorAll(".cl-today__row-label")).map((n) => n.textContent);
    expect(labels).toEqual(expect.arrayContaining(["Rahu Kalam", "Yamagandam", "Kuligai"]));
    expect(container.querySelector(".cl-today__more")!.textContent).toContain("10:48 am – 12:19 pm");
  });

  it("says that Abhijit is clipped by an avoid period instead of staying silent", async () => {
    const { container } = await renderPanel({ at: "10:30" });

    // Abhijit 11:55-12:44 against Rahu Kalam 10:48-12:19 — 24 of its 49
    // minutes. Calling it "auspicious for anyone" one row under a card whose
    // whole argument is "clear of the kalas" gives the reader two contradictory
    // instructions from one panel.
    const note = container.querySelector(".cl-today__row-note")!;
    expect(note.textContent).toContain("overlaps an avoid period");
    expect(note.textContent).toContain("12:19 pm – 12:44 pm");
  });
});

describe("Hero today panel — the rasi payoff", () => {
  it("turns one tap into a real reading, with no account", async () => {
    const { container } = await renderPanel({ at: "10:30" });

    fireEvent.click(screen.getByRole("button", { name: "Viruchigam" }));

    await waitFor(() => expect(getRasiPalan).toHaveBeenCalledTimes(1));
    expect(getRasiPalan).toHaveBeenCalledWith(
      expect.objectContaining({ rasi: "8", date: "2026-09-04", timezone: "Asia/Kolkata" }),
    );
    await waitFor(() => expect(container.querySelector(".cl-today__rasi-body")).not.toBeNull());
    expect(screen.getByText(/Moon is in your 7th house today/)).toBeInTheDocument();
  });

  /**
   * `headline` is a one-word category ("Relationships", "Gains and success");
   * `body` is the reading. The panel first shipped printing the headline alone,
   * so the reward for picking a rasi was a single noun — the tap taught the
   * visitor nothing and the affordance was worse than absent.
   */
  it("prints the reading, not just its category label", async () => {
    const { container } = await renderPanel({ at: "10:30" });

    fireEvent.click(screen.getByRole("button", { name: "Viruchigam" }));

    await waitFor(() => expect(container.querySelector(".cl-today__rasi-body")).not.toBeNull());
    const body = container.querySelector(".cl-today__rasi-body")!;
    expect(body.textContent).toContain("Relationships");
    expect(body.textContent).toContain("Partnerships and social interactions are highlighted.");
  });
});

describe("Hero today panel — Tamil mode", () => {
  /**
   * The dashboard hero shipped `balanced_routine` — a raw Python enum — as user
   * copy, invisible until a multi-word token surfaced, and it read as English
   * database tokens in Tamil mode too. Every name this panel prints goes
   * through a name map, so the check is that no backend enum survives to the
   * screen in either language.
   */
  it("prints no raw backend enum anywhere", async () => {
    const { container } = await renderPanel({ at: "10:30", lang: "ta" });

    const text = container.textContent ?? "";
    for (const token of ["ROHINI", "ASHTAMI", "AMIRTHAM", "UTHI", "SUGAM", "LABHAM", "KRISHNA", "FRIDAY"]) {
      expect(text).not.toContain(token);
    }
    expect(text).not.toMatch(/[a-z]+_[a-z]+/);
  });
});

describe("Hero today panel — degraded states", () => {
  it("says the almanac could not be loaded rather than shimmering forever", async () => {
    const { container } = await renderPanel({ at: "10:30", panchangam: null, failed: true });

    expect(container.querySelector(".cl-today__skeleton")).toBeNull();
    expect(screen.getByText(/could not be loaded/i)).toBeInTheDocument();
  });

  it("keeps the loading status announceable instead of hiding it with the skeleton", async () => {
    const { container } = await renderPanel({ at: "10:30", panchangam: null });

    // `aria-hidden` on an ancestor hides its whole subtree, so a status nested
    // inside the decorative skeleton would be announced to nobody.
    const status = screen.getByRole("status");
    expect(status.closest("[aria-hidden='true']")).toBeNull();
    expect(container.querySelector(".cl-today__skeleton")).not.toBeNull();
  });
});
