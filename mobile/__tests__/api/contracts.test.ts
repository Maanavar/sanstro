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
import { getDailyGuidance } from "@vinaadi/shared/api/guidance";
import { registerFcmToken } from "@vinaadi/shared/api/notifications";
import { askPrasna, getMuhurta, getNatchathiram, getDosham } from "@vinaadi/shared/api/tools";

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();

const MOCK_CLIENT = {
  get: mockGet,
  post: mockPost,
  patch: jest.fn(),
  put: mockPut,
  delete: jest.fn(),
};

beforeAll(() => {
  initApiClient(MOCK_CLIENT);
});

beforeEach(() => {
  mockGet.mockReset();
  mockPost.mockReset();
  mockPut.mockReset();
});

// ─── PANCHANGAM ───────────────────────────────────────────────────────────────

describe("panchangam API", () => {
  // Mirrors PanchangamDailyResponseData (packages/shared/src/types) — the
  // nested camelCase shape the backend actually returns; the old flat
  // snake_case mock here asserted a contract no route has served.
  const PANCHANGAM_RESPONSE = {
    data: {
      dateLocal: "2026-06-28",
      location: { lat: 13.08, lng: 80.27, timezone: "Asia/Kolkata" },
      sunrise: "06:04",
      sunset: "18:42",
      solarNoon: "12:23",
      vara: { weekday: "Saturday", lord: "SATURN" },
      tithi: { number: 11, name: "Ekadasi", paksha: "SHUKLA", endsAt: "21:14", nextNumber: 12, nextName: "Dwadasi", nextPaksha: "SHUKLA" },
      nakshatra: { name: "Kettai", pada: 2, endsAt: "23:02", nextName: "Moolam" },
      yoga: { number: 1, name: "Vishkambha", endsAt: "19:30", nextName: "Preeti" },
      karana: { name: "Kaulava", endsAt: "10:05", nextName: "Taitila" },
      kalam: {
        rahuKalam: { start: "09:00", end: "10:30", slot: 5 },
        yamagandam: { start: "13:30", end: "15:00", slot: 8 },
        kuligai: { start: "06:04", end: "07:34", slot: 1 },
        nallaNeram: [],
      },
    },
  };

  it("getPanchangamDay returns object with required panchangam fields", async () => {
    mockGet.mockResolvedValue(PANCHANGAM_RESPONSE);
    const result = await getPanchangamDay("2026-06-28", { lat: 13.08, lng: 80.27, tz: "Asia/Kolkata" });
    expect(result.data).toBeDefined();
    expect(result.data.dateLocal).toBe("2026-06-28");
    expect(result.data.vara).toBeDefined();
    expect(result.data.tithi).toBeDefined();
    expect(result.data.nakshatra).toBeDefined();
    expect(result.data.sunrise).toBeDefined();
    expect(result.data.sunset).toBeDefined();
    expect(result.data.kalam.rahuKalam).toBeDefined();
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

  // Mirrors ChartSummaryData (packages/shared/src/types) — flat lagnaRasi/
  // moonRasi strings, not the old nested lagna object.
  const CHART_SUMMARY_RESPONSE = {
    success: true,
    data: {
      chartId: "chart-uuid-001",
      displayName: "Arjun",
      currentAge: 30,
      lagnaRasi: "Mesha",
      moonRasi: "Kadagam",
      janmaNakshatra: "Ashwini",
      janmaPada: 1,
      currentMahadasha: "Moon",
      currentAntardasha: "Moon",
      primaryLanguageText: { ta: "மேஷ லக்னம்", en: "Mesha lagna" },
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
    expect(result.data.lagnaRasi).toBeDefined();
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

// ─── DAILY GUIDANCE ───────────────────────────────────────────────────────────
// Regression test for WIRE-7: getDailyGuidance previously called GET
// /daily-guidance?chartId=...&date=..., but the backend route is
// GET /charts/{chart_id}/daily-guidance (chart_id is a path param, not a query
// param) — every real call would have 404'd.

describe("guidance API", () => {
  it("getDailyGuidance calls the chart-scoped path with date as a query param", async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: { score: 72, text: { ta: "நல்லது", en: "Good" } },
    });
    const result = await getDailyGuidance("chart-uuid-001", "2026-07-05");
    expect(result.success).toBe(true);
    expect(mockGet).toHaveBeenCalledWith(
      "/charts/chart-uuid-001/daily-guidance",
      { date: "2026-07-05" },
    );
  });
});

// ─── TOOLS ────────────────────────────────────────────────────────────────────
// Parity audit 2026-07-17 §2a: these wrappers targeted an older URL scheme that
// no route has served in a long time (`/public-tools/prashan`, a bare
// `/muhurta`, `/charts/{id}/dosham`), so 9 mobile screens hard-404ed.
// tests/test_api_wrapper_route_contract.py checks the paths against the real
// FastAPI route table; these pin the call shape the screens depend on.

describe("tools API", () => {
  it("askPrasna posts the question AREA to /prasna and returns the payload FLAT", async () => {
    // POST /prasna has no { success, data } envelope. Both web widgets assumed
    // one and read res.data, so every ask silently rendered nothing (§8.3).
    const FLAT_PRASNA = {
      prasnaLagnaRasi: 3,
      prasnaLagnaName: "Mithunam",
      moonRasi: 7,
      moonNakshatraName: "Visakam",
      questionArea: "MARRIAGE",
      karaka: "VENUS",
      karakaHouse: 5,
      outlook: "FAVOURABLE",
      outlookTa: "சாதகம்",
      outlookEn: "Favourable",
      positiveIndicators: ["VENUS in kendra from Prasna Lagna"],
      negativeIndicators: [],
      cautionTa: "",
      cautionEn: "",
    };
    mockPost.mockResolvedValue(FLAT_PRASNA);

    const result = await askPrasna({
      questionArea: "MARRIAGE",
      timezoneName: "Asia/Kolkata",
      latitude: 13.0827,
      longitude: 80.2707,
    });

    // Read straight off the response — nothing to unwrap.
    expect(result.outlook).toBe("FAVOURABLE");
    expect(result.questionArea).toBe("MARRIAGE");
    expect((result as unknown as { data?: unknown }).data).toBeUndefined();
    expect(mockPost).toHaveBeenCalledWith(
      "/prasna",
      expect.objectContaining({ questionArea: "MARRIAGE" }),
    );
  });

  it("getMuhurta puts the chart id in the PATH, not a query param", async () => {
    mockGet.mockResolvedValue({ success: true, data: { slots: [] } });
    await getMuhurta({
      chartId: "chart-uuid-001",
      activity: "MARRIAGE",
      dateFrom: "2026-08-01",
      dateTo: "2026-08-30",
    });
    expect(mockGet).toHaveBeenCalledWith(
      "/charts/chart-uuid-001/muhurta",
      { activity: "MARRIAGE", dateFrom: "2026-08-01", dateTo: "2026-08-30" },
    );
  });

  it("getNatchathiram reads the content route", async () => {
    mockGet.mockResolvedValue({ success: true, data: { number: 1, nameEn: "Aswini" } });
    const result = await getNatchathiram(1);
    expect(result.data.nameEn).toBe("Aswini");
    expect(mockGet).toHaveBeenCalledWith("/content/nakshatra/1");
  });

  it("getDosham reads doshams off the full chart (there is no /dosham route)", async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: { doshams: [{ name: "SEVVAI_DOSHAM", isPresent: true }], yogas: [] },
    });
    const result = await getDosham("chart-uuid-001");
    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe("SEVVAI_DOSHAM");
    expect(mockGet).toHaveBeenCalledWith("/charts/chart-uuid-001");
  });
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
// Regression test for WIRE-7: registerFcmToken previously sent PATCH, but the
// backend route only accepts PUT (and DELETE) — every real call would have 405'd.

describe("notifications API", () => {
  it("registerFcmToken sends PUT (not PATCH) to the fcm-token endpoint", async () => {
    mockPut.mockResolvedValue({
      success: true,
      data: { fcmTokenRegistered: true },
    });
    const result = await registerFcmToken("device-token-abc123");
    expect(result.success).toBe(true);
    expect(mockPut).toHaveBeenCalledWith(
      "/settings/notifications/fcm-token",
      { fcmDeviceToken: "device-token-abc123" },
    );
  });
});
