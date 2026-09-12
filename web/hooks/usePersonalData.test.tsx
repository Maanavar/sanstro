import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mapDashboardBundle, splitDashaTimeline, usePersonalData } from "./usePersonalData";
import type { ChartDashboardBundleData } from "@vinaadi/shared/api/dashboardBundle";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, apiFetchJson: vi.fn() };
});

vi.mock("@vinaadi/shared/api/dashboardBundle", () => ({
  getChartDashboardBundle: vi.fn(),
}));

import { ApiRequestError, apiFetchJson } from "@/lib/api";
import { getChartDashboardBundle } from "@vinaadi/shared/api/dashboardBundle";

const apiMock = vi.mocked(apiFetchJson);
const bundleMock = vi.mocked(getChartDashboardBundle);

function makeBundleData(overrides: Partial<ChartDashboardBundleData> = {}): ChartDashboardBundleData {
  return {
    chartId: "chart-1",
    dateLocal: "2026-07-13",
    chart: null,
    summary: null,
    dailyGuidance: null,
    dailyGuidanceRange: null,
    dasha: null,
    transit: null,
    sani: null,
    peyarchiUpcoming: [],
    explanation: null,
    panchangam: null,
    panchangamTimings: null,
    lifeAreas: null,
    weekAhead: null,
    nakshatraCard: null,
    panchangamLocation: null,
    panchangamTimezone: null,
    errors: {},
    ...overrides,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => { resolve = r; });
  return { promise, resolve };
}

/** Routes apiFetchJson calls; `calcGate` lets a test hold a specific profile's
 *  /charts/calculate response open to create request overlap. */
function installApiMock(options: {
  calcGate?: Map<string, Promise<void>>;
  failCalculateFor?: Set<string>;
  latestProfileId?: string;
} = {}) {
  apiMock.mockImplementation(async (path: string, init?: RequestInit) => {
    if (path === "/api/v1/charts/calculate") {
      const body = JSON.parse(String(init?.body ?? "{}")) as { birthProfileId: string };
      if (options.failCalculateFor?.has(body.birthProfileId)) {
        throw new ApiRequestError(403, path, {
          code: "ACCESS_DENIED",
          message: {
            ta: "இந்தத் தகவலை அணுக உங்களுக்கு அனுமதி இல்லை.",
            en: "You do not have permission to access this resource.",
          },
          requestId: "test-recovery-request",
          detail: "Access denied.",
          status: 403,
        });
      }
      const gate = options.calcGate?.get(body.birthProfileId);
      if (gate) await gate;
      return {
        data: {
          chartId: `chart-${body.birthProfileId}`,
          birthProfile: { birthProfileId: body.birthProfileId },
          planets: [],
        },
      } as unknown;
    }
    if (path === "/api/v1/birth-profiles/me/latest") {
      return { data: { birthProfileId: options.latestProfileId ?? "bp-latest" } } as unknown;
    }
    if (path.includes("/alerts/ambient")) return { success: true, data: { items: [] } } as unknown;
    return { data: null } as unknown;
  });
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  bundleMock.mockImplementation(async (chartId: string) => ({
    success: true,
    data: makeBundleData({ chartId }),
  }));
});

describe("splitDashaTimeline", () => {
  const base = {
    chartId: "c1",
    openingDasha: { lord: "VENUS", balanceYearsAtBirth: 4 },
    current: {
      mahadasha: { lord: "SUN", startDate: "2020-01-01", endDate: "2026-01-01" },
      antardasha: { lord: "MOON", startDate: "2025-01-01", endDate: "2025-11-01" },
      pratyantardasha: { lord: "MARS", startDate: "2025-06-01", endDate: "2025-08-01" },
    },
  };

  it("splits a combined timeline by level tag", () => {
    const combined = {
      ...base,
      timeline: [
        { level: "maha" as const, lord: "SUN", startDate: "2020-01-01", endDate: "2026-01-01" },
        { level: "antar" as const, lord: "MOON", startDate: "2025-01-01", endDate: "2025-11-01" },
        { level: "pratyantar" as const, lord: "MARS", startDate: "2025-06-01", endDate: "2025-08-01" },
      ],
    };
    const split = splitDashaTimeline(combined);
    expect(split.dasha?.timeline.map((i) => i.level)).toEqual(["pratyantar"]);
    expect(split.dashaMaha?.timeline.map((i) => i.level)).toEqual(["maha"]);
    expect(split.dashaAntar.map((i) => i.level)).toEqual(["antar"]);
    // The level-independent `current` chain rides along on both shapes.
    expect(split.dasha?.current.mahadasha.lord).toBe("SUN");
    expect(split.dashaMaha?.current.pratyantardasha.lord).toBe("MARS");
  });

  it("handles null (failed dasha section) without throwing", () => {
    expect(splitDashaTimeline(null)).toEqual({ dasha: null, dashaMaha: null, dashaAntar: [] });
  });
});

describe("mapDashboardBundle (DASH-02: one failed section must not blank the rest)", () => {
  it("maps a bundle with a failed section to nulls plus sectionErrors", () => {
    const data = makeBundleData({
      sani: null,
      errors: { sani: "500: sani-cycle exploded" },
      panchangamTimezone: "Asia/Kolkata",
      panchangamLocation: "current",
    });
    const bundle = mapDashboardBundle(data);
    expect(bundle.sani).toBeNull();
    expect(bundle.sectionErrors).toEqual({ sani: "500: sani-cycle exploded" });
    expect(bundle.panchangamTimezone).toBe("Asia/Kolkata");
    expect(bundle.panchangamLocationLabel).toBe("current location");
    // Absent list sections normalize to empty arrays, not null.
    expect(mapDashboardBundle(makeBundleData({ peyarchiUpcoming: null })).peyarchiUpcoming).toEqual([]);
  });
});

describe("usePersonalData.refreshPersonalBundle", () => {
  it("happy path: resolves chart, loads bundle, reports success", async () => {
    installApiMock();
    const onStatus = vi.fn();
    const { result } = renderHook(
      () => usePersonalData({ selectedDate: "2026-07-13", onStatus, predictionsEnabled: false }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.refreshPersonalBundle("bp-1", "2026-07-13");
    });

    expect(result.current.chartId).toBe("chart-bp-1");
    expect(onStatus).toHaveBeenCalledWith(expect.stringContaining("Personal data refreshed"), "success");
    expect(bundleMock).toHaveBeenCalledWith("chart-bp-1", "2026-07-13");
  });

  it("recovers via /birth-profiles/me/latest when the profile 403s", async () => {
    installApiMock({ failCalculateFor: new Set(["bp-stale"]), latestProfileId: "bp-fresh" });
    const onStatus = vi.fn();
    const { result } = renderHook(
      () => usePersonalData({ selectedDate: "2026-07-13", onStatus, predictionsEnabled: false }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.refreshPersonalBundle("bp-stale", "2026-07-13");
    });

    expect(result.current.birthProfileId).toBe("bp-fresh");
    expect(result.current.chartId).toBe("chart-bp-fresh");
    expect(onStatus).toHaveBeenCalledWith(expect.stringContaining("Personal data refreshed"), "success");
  });

  it("race guard: a stale refresh must not clobber a newer one", async () => {
    const gate = deferred<void>();
    installApiMock({ calcGate: new Map([["bp-slow", gate.promise]]) });
    const { result } = renderHook(
      () => usePersonalData({ selectedDate: "2026-07-13", predictionsEnabled: false }),
      { wrapper: createWrapper() },
    );

    let slowRefresh!: Promise<void>;
    await act(async () => {
      // Older request, held open at the /charts/calculate step…
      slowRefresh = result.current.refreshPersonalBundle("bp-slow", "2026-07-13");
      // …while a newer request completes in full.
      await result.current.refreshPersonalBundle("bp-fast", "2026-07-13");
    });
    expect(result.current.chartId).toBe("chart-bp-fast");

    await act(async () => {
      gate.resolve();
      await slowRefresh;
    });

    // Without the isPersonalRequestCurrent guard, the stale request would
    // finish late and flip chartId to chart-bp-slow.
    expect(result.current.chartId).toBe("chart-bp-fast");
    await waitFor(() => expect(result.current.busyPersonal).toBe(false));
  });
});
