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
