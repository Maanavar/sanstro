export interface ApiMeta {
  calculationVersion: string;
  generatedAt: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta: ApiMeta;
}

export interface BirthProfileCreateResponseData {
  birthProfileId: string;
  chartId: string | null;
  calculationStatus: "pending" | "completed" | "failed";
  warnings: string[];
}

export interface BirthProfileSnapshot {
  birthProfileId: string;
  ownerUserId?: string;
  familyVaultId?: string | null;
  familyMemberId?: string | null;
  relationshipToOwner?: string;
  displayName: string;
  birthDateLocal: string;
  birthTimeLocal: string | null;
  birthPlace: string;
  birthLatitude?: number;
  birthLongitude?: number;
  birthTimezone: string;
  birthTimeSource?: string;
  birthTimeConfidenceMinutes?: number;
  calendarInputType?: string;
  calculateNow?: boolean;
  languagePreference?: string;
  genderForTraditionalRules?: string | null;
  birthDatetimeUtc?: string | null;
  calculationStatus: "pending" | "completed" | "failed";
  warnings: string[];
}

export interface ChartPlanet {
  graha: string;
  rasiName: string;
  absoluteLongitude: number;
  rasi: number;
  degreeInRasi: number;
  nakshatra: number;
  nakshatraName: string;
  pada: number;
  houseFromLagna: number;
  speedDegPerDay: number;
  isRetrograde: boolean;
  isCombust: boolean;
  d9Rasi: number;
  isVargottama: boolean;
  showRetrogradeBadge: boolean;
}

export interface ChartCalculateResponseData {
  chartId: string;
  birthProfile: BirthProfileSnapshot;
  birthDateTimeUTC: string;
  julianDay: number;
  ayanamsa: {
    type: "LAHIRI";
    valueDegrees: number;
  };
  lagna: {
    rasi: number;
    rasiName: string;
    absoluteLongitude: number;
    degreeInRasi: number;
    nakshatra: number;
    nakshatraName: string;
    pada: number;
  };
  planets: ChartPlanet[];
  calculationVersion: string;
  calculationStatus: "completed";
  warnings: string[];
  ephemerisBackend: string;
}

export interface ChartSummaryData {
  chartId: string;
  displayName: string;
  lagnaRasi: string;
  moonRasi: string;
  janmaNakshatra: string;
  janmaPada: number;
  currentMahadasha: string;
  currentAntardasha: string;
  primaryLanguageText: {
    ta: string;
    en: string;
  };
}

export interface DailyGuidanceWindow {
  type: string;
  start: string;
  end: string;
}

export interface DailyGuidanceData {
  chartId: string;
  dateLocal: string;
  score: number;
  label: string;
  scoreBreakdown: {
    moonTransit: number;
    dashaSupport: number;
    panchangam: number;
    gocharSupport: number;
    personalCautions: number;
    remedialActionSupport: number;
  };
  bestWindows: DailyGuidanceWindow[];
  cautionWindows: DailyGuidanceWindow[];
  text: {
    ta: string;
    en: string;
  };
  actionSuggestion: {
    ta: string;
    en: string;
  };
  cautionSuggestion: {
    ta: string;
    en: string;
  };
}

export interface DailyGuidanceRangeData {
  profileId: string;
  chartId: string;
  fromDate: string;
  toDate: string;
  items: DailyGuidanceData[];
}

export interface DashaPeriodWindow {
  lord: string;
  startDate: string;
  endDate: string;
}

export interface DashaTimelineItem {
  level: "maha" | "antar" | "pratyantar";
  lord: string;
  startDate: string;
  endDate: string;
}

export interface DashaTimelineResponseData {
  chartId: string;
  openingDasha: {
    lord: string;
    balanceYearsAtBirth: number;
  };
  current: {
    mahadasha: DashaPeriodWindow;
    antardasha: DashaPeriodWindow;
    pratyantardasha: DashaPeriodWindow;
  };
  timeline: DashaTimelineItem[];
}

export interface TransitPosition {
  graha: string;
  currentRasi: string;
  houseFromMoon: number;
  houseFromLagna: number;
  isRetrograde: boolean;
  isCombust: boolean;
  isSandhi: boolean;
  isGandanta: boolean;
  interpretationKey: string;
}

export interface TransitSnapshotData {
  asOfUTC: string;
  janmaRasi: string;
  lagnaRasi: string;
  isChandrashtama: boolean;
  transits: TransitPosition[];
}

export interface SaniCycleData {
  saturnRasi: string;
  janmaRasi: string;
  lagnaRasi: string;
  positionFromMoon: number;
  positionFromLagna: number;
  moonBasedCycle: {
    type: string | null;
    isActive: boolean;
    supportiveLabel: string | null;
  };
  lagnaBasedCycle: {
    type: string | null;
    isActive: boolean;
    supportiveLabel: string | null;
  };
  confirmationSentence: string;
}

export interface PanchangamDailyResponseData {
  dateLocal: string;
  location: {
    lat: number;
    lng: number;
    timezone: string;
  };
  sunrise: string;
  sunset: string;
  solarNoon: string;
  vara: {
    weekday: string;
    lord: string;
  };
  tithi: {
    number: number;
    name: string;
    paksha: "SHUKLA" | "KRISHNA";
    endsAt: string;
  };
  nakshatra: {
    name: string;
    pada: number;
    endsAt: string;
  };
  yoga: {
    number: number;
    name: string;
  };
  karana: {
    name: string;
  };
  kalam: {
    rahuKalam: { start: string; end: string; slot: number };
    yamagandam: { start: string; end: string; slot: number };
    kuligai: { start: string; end: string; slot: number };
  };
  abhijit: {
    start: string;
    end: string;
    isRestrictedByWeekday: boolean;
  };
  hora: Array<{
    index: number;
    lord: string;
    start: string;
    end: string;
  }>;
}

export interface PanchangamTimingsData {
  dateLocal: string;
  location: {
    lat: number;
    lng: number;
    timezone: string;
  };
  sunrise: string;
  sunset: string;
  solarNoon: string;
  kalam: {
    rahuKalam: { start: string; end: string; slot: number };
    yamagandam: { start: string; end: string; slot: number };
    kuligai: { start: string; end: string; slot: number };
  };
  abhijit: {
    start: string;
    end: string;
    isRestrictedByWeekday: boolean;
  };
  hora: Array<{
    index: number;
    lord: string;
    start: string;
    end: string;
  }>;
}

export interface FamilyVaultListItem {
  familyVaultId: string;
  ownerUserId: string;
  name: string;
  defaultLanguage: string;
  memberCount: number;
  latestAggregateDate: string | null;
}

export interface FamilyVaultListData {
  ownerUserId: string;
  limit: number;
  offset: number;
  totalCount: number;
  items: FamilyVaultListItem[];
}

export interface FamilyVaultDetailData {
  familyVaultId: string;
  ownerUserId: string;
  name: string;
  defaultLanguage: string;
  memberCount: number;
  latestAggregateDate: string | null;
}

export interface FamilyAggregateMember {
  familyMemberId: string;
  displayName: string;
  birthProfileId: string;
  chartId: string;
  individualScore: number;
  label: string;
  memberWeight: number;
  birthTimeConfidenceMinutes: number;
  activeCycleTags: string[];
  bestWindows: DailyGuidanceWindow[];
  cautionWindows: DailyGuidanceWindow[];
}

export interface FamilyAggregateBreakdown {
  weightedMean: number;
  meanScore: number;
  lowestScore: number;
  highestScore: number;
  totalWeight: number;
  lowScoreCount: number;
  chandrashtamaCount: number;
  majorSaniCount: number;
  healthPreventiveNudgeCount: number;
  supportNeedIndex: number;
  decisionReadinessIndex: number;
  commonGoodWindowBonus: number;
  rahuYamaOverlapPenalty: number;
  keyMemberLowScorePenalty: number;
}

export interface FamilyAggregateData {
  familyVaultId: string;
  dateLocal: string;
  timezone: string;
  familyScore: number;
  familyLabel: string;
  members: FamilyAggregateMember[];
  aggregateBreakdown: FamilyAggregateBreakdown;
  bestFamilyWindows: DailyGuidanceWindow[];
  avoidForFamilyDecisions: DailyGuidanceWindow[];
  summary: {
    ta: string;
    en: string;
  };
}

export interface FamilySummaryData {
  familyVaultId: string;
  dateLocal: string;
  familyScore: number;
  familyLabel: string;
  summary: {
    ta: string;
    en: string;
  };
  bestFamilyWindows: DailyGuidanceWindow[];
  avoidForFamilyDecisions: DailyGuidanceWindow[];
}

export interface FamilyCalendarItem {
  dateLocal: string;
  familyScore: number;
  familyLabel: string;
  bestFamilyWindows: DailyGuidanceWindow[];
  avoidForFamilyDecisions: DailyGuidanceWindow[];
  summary: {
    ta: string;
    en: string;
  };
}

export interface FamilyCalendarData {
  familyVaultId: string;
  fromDate: string;
  toDate: string;
  items: FamilyCalendarItem[];
}

// ── QA Dashboard types ───────────────────────────────────────────────────────

export interface QACaseResult {
  test_id: string;
  description: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
  detail: string | null;
}

export interface QAModuleResult {
  module: string;
  passed: number;
  failed: number;
  cases: QACaseResult[];
}

export interface QAValidationResponse {
  total_passed: number;
  total_failed: number;
  modules: QAModuleResult[];
  run_at: string;
}

export interface QAFailureRecord {
  test_id: string;
  module: string;
  description: string;
  expected: unknown;
  actual: unknown;
  detail: string | null;
  first_seen: string;
  last_seen: string;
  occurrences: number;
}

export interface QARegressionReport {
  total_stored: number;
  failures: QAFailureRecord[];
}
