import type { BiText } from "../types";

export type Tier = "guest" | "registered" | "premium";
export type DashaDepth = "none" | "current_only" | "full";

export interface TierLimits {
  /** Total saved birth profiles. Infinity = unlimited. */
  birthProfilesMax: number;
  /** Profiles in Family Vault. */
  familyVaultProfilesMax: number;
  /** Active goals. Infinity = unlimited. */
  goalsMax: number;
  /** Days of rasi palan history + future window from today. 0 = today only. */
  rasiPalanWindowDays: number;
  /** Ask Vinaadi questions per day. null = use monthly limit instead. */
  askVinaadiDailyLimit: number | null;
  /** Ask Vinaadi questions per month (premium). null = use daily limit instead. */
  askVinaadiMonthlyLimit: number | null;
  /** Whether the top-up question pack (10 questions) can be purchased. */
  askVinaadiTopUpEnabled: boolean;
  /** How much of the Vimshottari dasha tree is exposed. */
  dashaDepth: DashaDepth;
  /** Detailed jadhagam reports included per month before pay-per-use kicks in. */
  detailedReportsMonthlyIncluded: number;
  /** Porutham reports included per month before pay-per-use kicks in. */
  poruthamReportsMonthlyIncluded: number;
  adsEnabled: boolean;
  annualWrappedEnabled: boolean;
  /** Social share export for Annual Wrapped. */
  annualWrappedShareEnabled: boolean;
  journalEnabled: boolean;
  streakEnabled: boolean;
  pushNotificationsEnabled: boolean;
  varshaphalaEnabled: boolean;
  vargasEnabled: boolean;
  synastryEnabled: boolean;
  retrospectiveEnabled: boolean;
  remediesEnabled: boolean;
  lifeEventLogEnabled: boolean;
  birthTimeRectificationEnabled: boolean;
  /** Life area history charts and trend lines. */
  lifeAreaHistoryEnabled: boolean;
  /** One-time pay-per-use report purchases available. Guest requires account creation at checkout. */
  payPerUseEnabled: boolean;
}

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  guest: {
    birthProfilesMax: 0,
    familyVaultProfilesMax: 0,
    goalsMax: 0,
    rasiPalanWindowDays: 0,
    askVinaadiDailyLimit: 2,
    askVinaadiMonthlyLimit: null,
    askVinaadiTopUpEnabled: false,
    dashaDepth: "none",
    detailedReportsMonthlyIncluded: 0,
    poruthamReportsMonthlyIncluded: 0,
    adsEnabled: true,
    annualWrappedEnabled: false,
    annualWrappedShareEnabled: false,
    journalEnabled: false,
    streakEnabled: false,
    pushNotificationsEnabled: false,
    varshaphalaEnabled: false,
    vargasEnabled: false,
    synastryEnabled: false,
    retrospectiveEnabled: false,
    remediesEnabled: false,
    lifeEventLogEnabled: false,
    birthTimeRectificationEnabled: false,
    lifeAreaHistoryEnabled: false,
    payPerUseEnabled: true,
  },

  registered: {
    birthProfilesMax: 3,
    familyVaultProfilesMax: 1,
    goalsMax: 3,
    rasiPalanWindowDays: 3,
    askVinaadiDailyLimit: 5,
    askVinaadiMonthlyLimit: null,
    askVinaadiTopUpEnabled: false,
    dashaDepth: "current_only",
    detailedReportsMonthlyIncluded: 0,
    poruthamReportsMonthlyIncluded: 0,
    adsEnabled: true,
    annualWrappedEnabled: true,
    annualWrappedShareEnabled: false,
    journalEnabled: true,
    streakEnabled: true,
    pushNotificationsEnabled: true,
    varshaphalaEnabled: false,
    vargasEnabled: false,
    synastryEnabled: false,
    retrospectiveEnabled: false,
    remediesEnabled: false,
    lifeEventLogEnabled: false,
    birthTimeRectificationEnabled: false,
    lifeAreaHistoryEnabled: false,
    payPerUseEnabled: true,
  },

  premium: {
    birthProfilesMax: Infinity,
    familyVaultProfilesMax: 5,
    goalsMax: Infinity,
    rasiPalanWindowDays: 30,
    askVinaadiDailyLimit: null,
    askVinaadiMonthlyLimit: 30,
    askVinaadiTopUpEnabled: true,
    dashaDepth: "full",
    detailedReportsMonthlyIncluded: 5,
    poruthamReportsMonthlyIncluded: 3,
    adsEnabled: false,
    annualWrappedEnabled: true,
    annualWrappedShareEnabled: true,
    journalEnabled: true,
    streakEnabled: true,
    pushNotificationsEnabled: true,
    varshaphalaEnabled: true,
    vargasEnabled: true,
    synastryEnabled: true,
    retrospectiveEnabled: true,
    remediesEnabled: true,
    lifeEventLogEnabled: true,
    birthTimeRectificationEnabled: true,
    lifeAreaHistoryEnabled: true,
    payPerUseEnabled: true,
  },
};

// ─── Pay-per-use product catalogue ───────────────────────────────────────────
// rcProductId must match the product ID configured in RevenueCat / App Store Connect / Play Console.
// priceINR is the fallback display price shown before store prices load.

export interface PpuProduct {
  rcProductId: string;
  priceINR: number;
  label: BiText;
  description: BiText;
}

export interface PpuReportProduct extends PpuProduct {
  pages: number;
}

export interface PpuTopUpProduct extends PpuProduct {
  questions: number;
}

export const PPU_REPORT_PRODUCTS = {
  SNAPSHOT_1PAGE: {
    rcProductId: "vinaadi.ppu.report.1page",
    pages: 1,
    priceINR: 29,
    label: { ta: "சுருக்க அறிக்கை", en: "Quick Snapshot" },
    description: {
      ta: "லக்னம், ராசி, நட்சத்திரம், தசா சுருக்கம், முக்கிய 3 வாழ்க்கை நுண்ணறிவு",
      en: "Ascendant, rasi, nakshatra, dasha summary, 3 key life insights",
    },
  },
  STANDARD_3PAGE: {
    rcProductId: "vinaadi.ppu.report.3page",
    pages: 3,
    priceINR: 59,
    label: { ta: "நடுத்தர அறிக்கை", en: "Standard Report" },
    description: {
      ta: "கிரக நிலை, விரிவான தசா, அடிப்படை வருஷபலன்",
      en: "Planetary positions, full dasha, basic varshaphala",
    },
  },
  DETAILED_5PAGE: {
    rcProductId: "vinaadi.ppu.report.5page",
    pages: 5,
    priceINR: 99,
    label: { ta: "விரிவான அறிக்கை", en: "Detailed Report" },
    description: {
      ta: "வர்க கட்டங்கள், ஆயுள்கால நிகழ்வுகள், பரிகாரங்கள்",
      en: "Divisional charts, life event windows, remedies",
    },
  },
  PORTRAIT_10PAGE: {
    rcProductId: "vinaadi.ppu.report.10page",
    pages: 10,
    priceINR: 179,
    label: { ta: "முழு ஜாதகப் படம்", en: "Full Portrait" },
    description: {
      ta: "யோக/தோஷ பகுப்பாய்வு, முகூர்த்த வழிகாட்டி, பரிகார கட்டம்",
      en: "Yoga/dosham analysis, muhurta windows, parihara chart",
    },
  },
} as const satisfies Record<string, PpuReportProduct>;

export const PPU_PORUTHAM_PRODUCTS = {
  SUMMARY_1PAGE: {
    rcProductId: "vinaadi.ppu.porutham.1page",
    pages: 1,
    priceINR: 49,
    label: { ta: "பொருத்த சுருக்கம்", en: "Porutham Summary" },
    description: {
      ta: "10 பொருத்த அம்சங்கள் + மொத்த மதிப்பெண் + சுருக்க தீர்ப்பு",
      en: "10-factor score + overall verdict",
    },
  },
  DETAILED_3PAGE: {
    rcProductId: "vinaadi.ppu.porutham.3page",
    pages: 3,
    priceINR: 99,
    label: { ta: "விரிவான ஜாதக பொருத்தம்", en: "Detailed Jadhagam Porutham" },
    description: {
      ta: "10 அம்சங்கள் + தசா-புக்தி ஒப்பீடு + பரிகாரங்கள்",
      en: "Full 10-factor + dasha bhukti comparison + remedies",
    },
  },
} as const satisfies Record<string, PpuReportProduct>;

export const PPU_TOPUP_PRODUCTS = {
  QUESTIONS_10: {
    rcProductId: "vinaadi.ppu.topup.10q",
    questions: 10,
    priceINR: 49,
    label: { ta: "10 கேள்வி பேக்", en: "10-Question Top-up" },
    description: {
      ta: "விநாடி AI உடன் 10 கூடுதல் கேள்விகள்",
      en: "10 extra questions with Ask Vinaadi",
    },
  },
} as const satisfies Record<string, PpuTopUpProduct>;

// ─── Subscription pricing ─────────────────────────────────────────────────────
// savingsPercent is computed: (149×12 − 999) / (149×12) = 44%

export const SUBSCRIPTION_PLANS = {
  monthly: {
    rcProductId: "vinaadi.premium.monthly",
    priceINR: 149,
    trialDays: 7,
    savingsPercent: null,
    label: { ta: "மாத திட்டம்", en: "Monthly Plan" },
  },
  annual: {
    rcProductId: "vinaadi.premium.annual",
    priceINR: 999,
    trialDays: 7,
    savingsPercent: 44,
    label: { ta: "வருட திட்டம்", en: "Annual Plan" },
  },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getTierLimits(tier: Tier): TierLimits {
  return TIER_LIMITS[tier];
}

export function canAccess(tier: Tier, feature: keyof TierLimits): boolean {
  const v = TIER_LIMITS[tier][feature];
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v > 0;
  return v !== null && v !== "none";
}
