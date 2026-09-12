import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";

import type { OneMinuteReadingData } from "@vinaadi/shared/api/oneMinuteReading";

/**
 * The two-minute reading is the heaviest thing on Today and it sits below the
 * fold, so it was given `deferUntilVisible` — the endpoint call is held until
 * the reading is near the viewport.
 *
 * The whole value of that prop is a call that DOESN'T happen, which is exactly
 * the kind of thing that regresses silently: nothing looks wrong on screen when
 * the deferral stops working, the request simply moves back onto first paint.
 * These pin the negative directly — no call before intersection, a call after —
 * plus the two escape hatches (prop off, and no IntersectionObserver at all),
 * because a deferral that never resolves is a card that never loads.
 */

const getOneMinuteReading = vi.fn();

vi.mock("@vinaadi/shared/api/oneMinuteReading", () => ({
  getOneMinuteReading: (...args: unknown[]) => getOneMinuteReading(...args),
}));

vi.mock("@/lib/api", () => ({
  apiFetchJson: vi.fn(),
}));

type ObserverRecord = {
  callback: IntersectionObserverCallback;
  options: IntersectionObserverInit | undefined;
  observed: Element[];
  disconnected: boolean;
};

let observers: ObserverRecord[] = [];

/** Minimal stand-in — jsdom ships no IntersectionObserver, and the test needs
 *  to fire the intersection itself rather than wait for a layout it never has. */
class TestIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds: ReadonlyArray<number> = [];
  private record: ObserverRecord;

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.record = { callback, options, observed: [], disconnected: false };
    observers.push(this.record);
  }

  observe(target: Element) {
    this.record.observed.push(target);
  }
  unobserve() {}
  disconnect() {
    this.record.disconnected = true;
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

function intersect(record: ObserverRecord) {
  act(() => {
    record.callback(
      [{ isIntersecting: true, target: record.observed[0] } as unknown as IntersectionObserverEntry],
      record as unknown as IntersectionObserver,
    );
  });
}

function readingFixture(): OneMinuteReadingData {
  return {
    chartId: "chart-1",
    birthProfileId: "profile-1",
    displayName: "Test Reader",
    asOf: "2026-08-01",
    readingWindow: { from: "2026-08-01", to: "2027-02-01" },
    age: 30,
    stage: "ESTABLISHING",
    ageBand: { en: "thirties", ta: "முப்பதுகள்" },
    focusTopic: "WORK",
    addressedTo: "self",
    beats: [
      {
        id: "who_you_are",
        text: { en: "You steady a room before you speak in it.", ta: "நீங்கள் அமைதியாகத் தொடங்குபவர்." },
        basis: null,
      },
      {
        id: "period_now",
        text: {
          en: "Guru bhukti asks you to finish things. It rewards the slower route.",
          ta: "குரு புத்தி முடிக்கச் சொல்கிறது.",
        },
        basis: null,
      },
    ],
    pendingQuestion: null,
    wordCount: { ta: 40, en: 40 },
    nextStep: { label: { en: "Open the full chart", ta: "முழு ஜாதகம்" }, href: "/dashboard" },
  };
}

describe("DashboardOneMinuteReading deferUntilVisible", () => {
  beforeEach(() => {
    observers = [];
    getOneMinuteReading.mockReset();
    getOneMinuteReading.mockResolvedValue({ success: true, data: readingFixture() });
    vi.stubGlobal("IntersectionObserver", TestIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not call the endpoint until the sentinel intersects", async () => {
    const { DashboardOneMinuteReading } = await import("./dashboard-one-minute-reading");
    render(<DashboardOneMinuteReading lang="en" chartId="chart-1" deferUntilVisible />);

    // The point of the prop: nothing has been fetched yet, and nothing of the
    // reading is on the page — only the sentinel the observer is watching.
    expect(getOneMinuteReading).not.toHaveBeenCalled();
    expect(screen.queryByText(/Your chart in two minutes/i)).toBeNull();
    expect(observers).toHaveLength(1);
    expect(observers[0].observed).toHaveLength(1);

    intersect(observers[0]);

    await waitFor(() => expect(getOneMinuteReading).toHaveBeenCalledWith("chart-1"));
    await screen.findByText(/Your chart in two minutes/i);
  });

  it("arms the observer ahead of the viewport, not at its edge", async () => {
    const { DashboardOneMinuteReading } = await import("./dashboard-one-minute-reading");
    render(<DashboardOneMinuteReading lang="en" chartId="chart-1" deferUntilVisible />);

    // A zero rootMargin would start the fetch only once the reader is already
    // looking at an empty slot — the deferral has to lead the scroll.
    expect(observers[0].options?.rootMargin).toBe("360px 0px");
  });

  it("stops observing once the reading has been requested", async () => {
    const { DashboardOneMinuteReading } = await import("./dashboard-one-minute-reading");
    render(<DashboardOneMinuteReading lang="en" chartId="chart-1" deferUntilVisible />);

    intersect(observers[0]);

    await waitFor(() => expect(getOneMinuteReading).toHaveBeenCalledTimes(1));
    expect(observers[0].disconnected).toBe(true);
  });

  it("fetches immediately when the caller has not asked for deferral", async () => {
    const { DashboardOneMinuteReading } = await import("./dashboard-one-minute-reading");
    render(<DashboardOneMinuteReading lang="en" chartId="chart-1" />);

    await waitFor(() => expect(getOneMinuteReading).toHaveBeenCalledWith("chart-1"));
    expect(observers).toHaveLength(0);
  });

  it("falls back to loading immediately where IntersectionObserver is absent", async () => {
    // Otherwise the deferral is permanent on that browser and the card is
    // simply missing, with no error anywhere to say so.
    vi.stubGlobal("IntersectionObserver", undefined);
    const { DashboardOneMinuteReading } = await import("./dashboard-one-minute-reading");
    render(<DashboardOneMinuteReading lang="en" chartId="chart-1" deferUntilVisible />);

    await waitFor(() => expect(getOneMinuteReading).toHaveBeenCalledWith("chart-1"));
    await screen.findByText(/Your chart in two minutes/i);
  });
});

/**
 * `collapseWhenRead` — the daily home stops re-serving a reading that has not
 * changed.
 *
 * The reading moves at the antardasha boundary (`readingWindow` IS the current
 * antardasha, months to years wide) and most of its beats are natal and never
 * move at all, so Today was spending its third slot on ~240 words the reader
 * had already read, under a subtitle that said so out loud.
 *
 * What has to hold, and what these pin:
 *  - collapsed only where the caller asked for it — Family & Charts is the
 *    reading's home and keeps it whole;
 *  - the dismissal expires by itself, because what is stored is the reading
 *    window and not a boolean. A boolean would bury the bhukti turn, which is
 *    the one moment in the year this writing is news;
 *  - a render is not a reading. Marking it read on mount would collapse it for
 *    a reader who never scrolled to it;
 *  - and marking it read never collapses it under the reader doing the
 *    reading — that lands on the next visit.
 */
describe("DashboardOneMinuteReading collapseWhenRead", () => {
  const FULL_BODY = /You steady a room before you speak in it/i;
  const RECAP_LINE = /Guru bhukti asks you to finish things\./i;

  beforeEach(() => {
    observers = [];
    localStorage.clear();
    getOneMinuteReading.mockReset();
    getOneMinuteReading.mockResolvedValue({ success: true, data: readingFixture() });
    vi.stubGlobal("IntersectionObserver", TestIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("collapses to one line and a way back, once this reading has been read", async () => {
    localStorage.setItem("vinaadi-om-read:chart-1", "2026-08-01");
    const { DashboardOneMinuteReading } = await import("./dashboard-one-minute-reading");
    const onOpenFullChart = vi.fn();
    render(
      <DashboardOneMinuteReading
        lang="en"
        chartId="chart-1"
        collapseWhenRead
        onOpenFullChart={onOpenFullChart}
      />,
    );

    // The heading survives — the document outline should not change because the
    // reader has read something — but the 240 words do not.
    await screen.findByText(/Your chart in two minutes/i);
    expect(screen.queryByText(FULL_BODY)).toBeNull();

    // The line it keeps is the beat that MOVED, not the natal opener.
    expect(screen.getByText(RECAP_LINE)).toBeTruthy();

    screen.getByRole("button", { name: /Read it again/i }).click();
    expect(onOpenFullChart).toHaveBeenCalledTimes(1);
  });

  it("keeps the reading whole on the surface that is its home", async () => {
    // Family & Charts passes no `collapseWhenRead`: a reader who navigates there
    // has gone TO the reading, and finding one line waiting would be a bug.
    localStorage.setItem("vinaadi-om-read:chart-1", "2026-08-01");
    const { DashboardOneMinuteReading } = await import("./dashboard-one-minute-reading");
    render(<DashboardOneMinuteReading lang="en" chartId="chart-1" />);

    await screen.findByText(FULL_BODY);
    expect(screen.queryByRole("button", { name: /Read it again/i })).toBeNull();
  });

  it("comes back in full, and says why, when the antardasha has turned", async () => {
    // Stored window is an older antardasha, so the backend has since rewritten
    // the piece. This is the whole reason the stored value is a date.
    localStorage.setItem("vinaadi-om-read:chart-1", "2026-02-01");
    const { DashboardOneMinuteReading } = await import("./dashboard-one-minute-reading");
    render(<DashboardOneMinuteReading lang="en" chartId="chart-1" collapseWhenRead />);

    await screen.findByText(FULL_BODY);
    expect(screen.getByText(/Rewritten/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Read it again/i })).toBeNull();
  });

  it("keeps a reading whole while it is still asking the reader something", async () => {
    // A reading with an unanswered question is not finished, whatever the
    // stored window says — collapsing it would hide the question for good.
    const withQuestion = readingFixture();
    withQuestion.pendingQuestion = {
      field: "marital_status",
      beforeBeat: "period_now",
      prompt: { en: "Are you married?", ta: "திருமணமானவரா?" },
      options: [{ value: "single", label: { en: "No", ta: "இல்லை" } }],
    };
    getOneMinuteReading.mockResolvedValue({ success: true, data: withQuestion });
    localStorage.setItem("vinaadi-om-read:chart-1", "2026-08-01");

    const { DashboardOneMinuteReading } = await import("./dashboard-one-minute-reading");
    render(<DashboardOneMinuteReading lang="en" chartId="chart-1" collapseWhenRead />);

    await screen.findByText(FULL_BODY);
    expect(screen.getByText(/Are you married\?/i)).toBeTruthy();
  });

  it("does not count a render as a reading until it has been on screen", async () => {
    const { DashboardOneMinuteReading } = await import("./dashboard-one-minute-reading");
    render(<DashboardOneMinuteReading lang="en" chartId="chart-1" collapseWhenRead />);

    await screen.findByText(FULL_BODY);
    // Rendered, not read: nothing stored, so a reader who never scrolls this far
    // gets the reading again tomorrow rather than losing it unread.
    expect(localStorage.getItem("vinaadi-om-read:chart-1")).toBeNull();

    // The read observer watches the section itself with no lead margin — the
    // lazy-load one deliberately fires 360px early, which is why this is a
    // second observer and not a reuse of that one.
    const readObserver = observers.find((o) => o.options?.threshold === 0.2);
    expect(readObserver).toBeTruthy();
    intersect(readObserver!);

    await waitFor(
      () => expect(localStorage.getItem("vinaadi-om-read:chart-1")).toBe("2026-08-01"),
      { timeout: 4000 },
    );

    // And it did NOT fold up under the reader who was reading it. The collapse
    // is for the next visit.
    expect(screen.getByText(FULL_BODY)).toBeTruthy();
  });
});
