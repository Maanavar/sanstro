/**
 * F-04 — Mobile API contract tests (priority 5 clients).
 * Mocks the HTTP layer via initApiClient so no network is required.
 * Each test: call the client function → assert returned object shape.
 */

import { initApiClient } from "@vinaadi/shared/api/client";
import { getPanchangamDay, getPanchangamToday } from "@vinaadi/shared/api/panchangam";
import { getChartFull, getChartSummary } from "@vinaadi/shared/api/charts";
import { getDashaTimeline } from "@vinaadi/shared/api/dasha";
import { getDailyStatus, askVinaadi } from "@vinaadi/shared/api/askVinaadi";
import { getRasiPalan } from "@vinaadi/shared/api/rasiPalan";

const mockGet = jest.fn();
const mockPost = jest.fn();

const MOCK_CLIENT = {
  get: mockGet,
  post: mockPost,
  patch: jest.fn(),
  delete: jest.fn(),
};

beforeAll(() => {
  initApiClient(MOCK_CLIENT);
});

beforeEach(() => {
  mockGet.mockReset();
  mockPost.mockReset();
});

// ─── PANCHANGAM ───────────────────────────────────────────────────────────────

describe("panchangam API", () => {
  const PANCHANGAM_RESPONSE = {
    data: {
      date: "2026-06-28",
      vara: "Saturday",
      vara_ta: "சனி",
      tithi: "Ekadasi",
      tithi_ta: "ஏகாதசி",
      nakshatra: "Kettai",
      nakshatra_ta: "கேட்டை",
      yoga: "Vishkambha",
      karana: "Kaulava",
      sunrise: "06:04",
      sunset: "18:42",
      rahu_kalam: { start: "09:00", end: "10:30" },
      nalla_neram: [],
      gowri_nalla_neram: [],
    },
  };

  it("getPanchangamDay returns object with required panchangam fields", async () => {
    mockGet.mockResolvedValue(PANCHANGAM_RESPONSE);
    const result = await getPanchangamDay("2026-06-28", { lat: 13.08, lng: 80.27, tz: "Asia/Kolkata" });
    expect(result.data).toBeDefined();
    expect(result.data.date).toBe("2026-06-28");
    expect(result.data.vara).toBeDefined();
    expect(result.data.tithi).toBeDefined();
    expect(result.data.nakshatra).toBeDefined();
    expect(result.data.sunrise).toBeDefined();
    expect(result.data.sunset).toBeDefined();
    expect(result.data.rahu_kalam).toBeDefined();
    expect(mockGet).toHaveBeenCalledWith("/panchangam/daily", expect.objectContaining({ date: "2026-06-28", lat: 13.08, lng: 80.27, timezone: "Asia/Kolkata" }));
  });

  it("getPanchangamToday calls /panchangam/daily with today's date and coords", async () => {
    mockGet.mockResolvedValue(PANCHANGAM_RESPONSE);
    await getPanchangamToday({ lat: 13.08, lng: 80.27, tz: "Asia/Kolkata" });
    expect(mockGet).toHaveBeenCalledWith("/panchangam/daily", expect.objectContaining({ lat: 13.08, timezone: "Asia/Kolkata" }));
  });
});

// ─── JADHAGAM (charts) ────────────────────────────────────────────────────────

describe("jadhagam API", () => {
  const CHART_FULL_RESPONSE = {
    success: true,
    data: {
      chartId: "chart-uuid-001",
      birthProfile: { displayName: "Arjun", birthPlace: "Chennai" },
      lagna: { rasi: 1, rasiName: "Mesha", nakshatraName: "Ashwini", pada: 1 },
      planets: [
        { graha: "Sun", rasi: 5, isRetrograde: false },
        { graha: "Moon", rasi: 4, isRetrograde: false },
      ],
      dasha: { maha: "Moon", antar: "Moon" },
    },
  };

  const CHART_SUMMARY_RESPONSE = {
    success: true,
    data: {
      chartId: "chart-uuid-001",
      lagna: { rasi: 1, rasiName: "Mesha" },
      moonRasi: 4,
      nakshatraName: "Ashwini",
    },
  };

  it("getChartFull returns chart with lagna and planets array", async () => {
    mockGet.mockResolvedValue(CHART_FULL_RESPONSE);
    const result = await getChartFull("chart-uuid-001");
    expect(result.success).toBe(true);
    expect(result.data.lagna).toBeDefined();
    expect(result.data.lagna.rasi).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(result.data.planets)).toBe(true);
    expect(mockGet).toHaveBeenCalledWith("/charts/chart-uuid-001");
  });

  it("getChartSummary returns summary with lagna and moonRasi", async () => {
    mockGet.mockResolvedValue(CHART_SUMMARY_RESPONSE);
    const result = await getChartSummary("chart-uuid-001");
    expect(result.success).toBe(true);
    expect(result.data.lagna).toBeDefined();
    expect(mockGet).toHaveBeenCalledWith("/charts/chart-uuid-001/summary");
  });
});

// ─── DASHA ────────────────────────────────────────────────────────────────────

describe("dasha API", () => {
  const DASHA_RESPONSE = {
    success: true,
    data: {
      chartId: "chart-uuid-001",
      openingDasha: {
        lord: "SATURN",
        balanceYearsAtBirth: 12.5,
      },
      current: {
        mahadasha: {
          lord: "MOON",
          startDate: "2020-01-01",
          endDate: "2030-01-01",
        },
        antardasha: {
          lord: "MARS",
          startDate: "2026-01-01",
          endDate: "2026-07-01",
        },
        pratyantardasha: {
          lord: "RAHU",
          startDate: "2026-04-01",
          endDate: "2026-05-01",
        },
      },
      timeline: [],
    },
  };

  it("getDashaTimeline returns current dasha windows and maha timeline", async () => {
    mockGet.mockResolvedValue(DASHA_RESPONSE);
    const result = await getDashaTimeline("chart-uuid-001");
    expect(result.success).toBe(true);
    expect(result.data.current.mahadasha).toBeDefined();
    expect(result.data.current.mahadasha.lord).toBe("MOON");
    expect(result.data.current.antardasha).toBeDefined();
    expect(Array.isArray(result.data.timeline)).toBe(true);
    expect(mockGet).toHaveBeenCalledWith("/charts/chart-uuid-001/dasha", { level: "maha" });
  });
});

// Dasha tests above intentionally mirror the backend camelCase response.
describe("askVinaadi API", () => {
  it("getDailyStatus returns questionsUsedToday and dailyLimit", async () => {
    mockGet.mockResolvedValue({ questionsUsedToday: 2, dailyLimit: 7, chipsRemaining: null });
    const result = await getDailyStatus();
    expect(typeof result.questionsUsedToday).toBe("number");
    expect(typeof result.dailyLimit).toBe("number");
    expect("chipsRemaining" in result).toBe(true);
    expect(mockGet).toHaveBeenCalledWith("/ask-vinaadi/daily-status");
  });

  it("askVinaadi returns success with BiText answer", async () => {
    mockPost.mockResolvedValue({
      success: true,
      data: {
        question: "Is today good for travel?",
        answer: { ta: "இன்று பயணம் நல்லது.", en: "Today is good for travel." },
        signalsUsed: ["panchangam", "dasha"],
        confidence: "HIGH",
        caveat: null,
        questionsUsedToday: 3,
        dailyLimit: 7,
        chipsRemaining: null,
      },
    });
    const result = await askVinaadi("chart-uuid-001", "Is today good for travel?", "ta", false);
    expect(result.success).toBe(true);
    expect(result.data.answer.ta).toBeTruthy();
    expect(result.data.answer.en).toBeTruthy();
    expect(Array.isArray(result.data.signalsUsed)).toBe(true);
    expect(mockPost).toHaveBeenCalledWith(
      "/charts/chart-uuid-001/ask",
      expect.objectContaining({ question: "Is today good for travel?" }),
    );
  });
});

// ─── RASI PALAN ───────────────────────────────────────────────────────────────

describe("rasiPalan API", () => {
  it("getRasiPalan returns normalised RasiPalanData shape", async () => {
    mockGet.mockResolvedValue({
      rasi: 1,
      rasiName: { ta: "மேஷம்", en: "Mesha" },
      date: "2026-06-28",
      moonRasi: 4,
      moonHouse: 1,
      headline: { ta: "சாதகமான நாள்.", en: "Favourable day." },
      body: { ta: "நல்ல நேரம் கிடைக்கும்.", en: "Good windows available." },
      luckyColor: { ta: "சிவப்பு", en: "Red" },
      luckyNumbers: [1, 3, 7],
      pariharam: { ta: "சிவன் வழிபாடு", en: "Worship Shiva" },
      tone: "positive",
    });
    const result = await getRasiPalan({ rasi: "mesha" });
    expect(result.rasi).toBe(1);
    expect(result.rasiName.en).toBe("Mesha");
    expect(result.headline.ta).toBeTruthy();
    expect(Array.isArray(result.luckyNumbers)).toBe(true);
    expect(["positive", "neutral", "caution", "warn"]).toContain(result.tone);
    expect(mockGet).toHaveBeenCalledWith(
      "/public/rasi-palan",
      expect.objectContaining({ rasi: "mesha" }),
    );
  });

  it("getRasiPalan normalises missing fields to safe defaults", async () => {
    mockGet.mockResolvedValue({});
    const result = await getRasiPalan({ rasi: "rishabam" });
    expect(result.rasi).toBe(1);
    expect(result.rasiName).toEqual({ ta: "", en: "" });
    expect(result.date).toBe("");
    expect(result.tone).toBe("neutral");
  });
});
