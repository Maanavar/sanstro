export interface ApiMeta {
  calculationVersion: string;
  generatedAt: string;
}

export interface BiText {
  ta: string;
  en: string;
}

export type LifeEventType = "CAREER" | "MARRIAGE" | "STUDIES" | "RELOCATION" | "HEALTH_CAUTION";
export type ConfidenceTier = "HIGH" | "MEDIUM" | "LOW";

export interface LifeEventWindow {
  eventType: LifeEventType;
  startDate: string;
  endDate: string;
  confidence: ConfidenceTier;
  headline: BiText;
  reasons: BiText[];
  dashaSupport: BiText;
  gocharSupport: BiText;
}

export interface LifeEventsResponseData {
  chartId: string;
  asOfDate: string;
  yearsAhead: number;
  windows: LifeEventWindow[];
}

export interface EventWindowItem {
  event: "MARRIAGE" | "CAREER" | "FINANCE";
  startDate: string;
  endDate: string;
  score: number;
  reasons: string[];
}

export interface LifeAreaText {
  ta: string;
  en: string;
}

export interface LifeAreaData {
  area: string;
  label: LifeAreaText;
  score: number;
  trend: "UP" | "DOWN" | "STABLE";
  confidence: ConfidenceTier;
  confidenceReason: LifeAreaText;
  primaryHouseStrength: "STRONG" | "NEUTRAL" | "WEAK";
  karakaStatus: "STRONG" | "MODERATE" | "WEAK";
  dashaActivation: boolean;
  transitSupport: number;
  supportingFactors: string[];
  blockingFactors: string[];
  driver: {
    planet: string;
    reason: LifeAreaText;
  };
  narrative: LifeAreaText;
  remedy: LifeAreaText;
  next30DayOutlook: LifeAreaText;
  caution: LifeAreaText | null;
  isGoalFocus: boolean;
}

export interface LifeAreasResponseData {
  chartId: string;
  dateLocal: string;
  areas: LifeAreaData[];
}

export interface AskVinaadiAnswer {
  ta: string;
  en: string;
}

export interface AskVinaadiResponseData {
  question: string;
  answer: AskVinaadiAnswer;
  signalsUsed: string[];
  confidence: ConfidenceTier;
  caveat: AskVinaadiAnswer | null;
  questionsUsedToday: number;
  dailyLimit: number;
  chipsRemaining?: number | null;
}

export interface MuhurtaSlot {
  date: string;
  tamilDate?: BiText | null;
  timeStart: string;
  timeEnd: string;
  score: number;
  panchangamSupport: BiText;
  dashaSupport: BiText;
  cautions: BiText[];
}

export interface MuhurtaResponseData {
  chartId: string;
  activity: string;
  dateFrom: string;
  dateTo: string;
  slots: MuhurtaSlot[];
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta: ApiMeta;
}

export interface JournalSettingsData {
  journalRetentionDays: number;
  lastUpdatedAt: string;
  lastRetentionReviewedAt: string | null;
  nextRecommendedReviewDate: string;
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
  currentPlace?: string | null;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  currentTimezone?: string | null;
  currentLocationUpdatedAt?: string | null;
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
  strengthScore?: number;
  strengthBreakdown?: {
    sthana: "STRONG" | "NEUTRAL" | "WEAK";
    dik: "STRONG" | "NEUTRAL" | "WEAK";
    kala: "STRONG" | "NEUTRAL" | "WEAK";
    chesta: "STRONG" | "NEUTRAL" | "WEAK";
    naisargika: "STRONG" | "NEUTRAL" | "WEAK";
    drik: "STRONG" | "NEUTRAL" | "WEAK";
  };
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
  yogas: ChartYogaInsight[];
  doshams: ChartDoshamInsight[];
  calculationVersion: string;
  calculationStatus: "completed";
  warnings: string[];
  ephemerisBackend: string;
  bhavaChalit?: Record<string, number>;
  vargas?: Record<string, Record<string, number>>;
  nakshatraAnalysis?: Record<string, unknown>;
  birthPanchangamSignature?: Record<string, unknown>;
}

export interface ChartValidationStatus {
  passed: boolean;
  matchCount: number;
  totalChecked: number;
  confidence: "HIGH" | "MEDIUM" | "LOW" | "UNVALIDATED";
  unmatchedEvents: string[];
}

export interface ChartSummaryData {
  chartId: string;
  displayName: string;
  currentAge: number;
  lagnaRasi: string;
  moonRasi: string;
  d9LagnaRasi?: string | null;
  d9MoonRasi?: string | null;
  janmaNakshatra: string;
  janmaPada: number;
  currentMahadasha: string;
  currentAntardasha: string;
  functionalNature?: Record<string, string>;
  ashtakavarga?: Record<string, Record<number, number>>;
  planets?: ChartPlanet[];
  yogas?: ChartYogaInsight[];
  primaryLanguageText: {
    ta: string;
    en: string;
  };
  chartValidationStatus?: ChartValidationStatus;
}

export interface DailyGuidanceWindow {
  type: string;
  start: string;
  end: string;
}

export interface BiText {
  ta: string;
  en: string;
}

export interface DailyGuidanceReasons {
  moonTransit: BiText;
  dashaSupport: BiText;
  panchangam: BiText;
  gochar: BiText;
  personalCaution: BiText;
}

export interface DailyGuidanceEmotionalWeather {
  tone: string;
  physicalTendency: string;
  bestUseOfDay: string;
  avoidBefore: BiText | null;
  toneText: BiText;
  physicalTendencyText: BiText;
  bestUseOfDayText: BiText;
}

export interface DailyGuidanceJournalInsight {
  lookbackDays: number;
  entryCount: number;
  dominantLifeArea: string;
  topTags: string[];
  text: BiText;
  signals: Array<{ lifeArea: string; count: number }>;
}

export interface DailyGuidanceData {
  chartId: string;
  dateLocal: string;
  score: number;
  label: string;
  confidence: ConfidenceTier;
  confidenceReason: BiText;
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
  text: BiText;
  nakshatraPerspective: BiText | null;
  emotionalWeather: DailyGuidanceEmotionalWeather | null;
  contextInsight: BiText | null;
  journalInsight: DailyGuidanceJournalInsight | null;
  actionSuggestion: BiText;
  cautionSuggestion: BiText;
  reasons: DailyGuidanceReasons;
  remedy: BiText;
  currentHoraLord?: string | null;
  pratyantarNarrative?: BiText | null;
  tithiCard: BiText | null;
}

export type AmbientAlertItem = {
  alertId: string;
  source: "PEYARCHI" | "RELATIONSHIP";
  significanceScore: number;
  triggerPlanet: string;
  triggerType: string;
  eventDate: string;
  daysFromToday: number;
  tier?: string;
  chartId?: string;
  familyVaultId?: string;
  memberId?: string;
  title: BiText;
  message: BiText;
};

export type AmbientAlertsData = {
  asOfDate: string;
  minSignificance: number;
  unreadOnly: boolean;
  totalReturned: number;
  totalSuppressed: number;
  items: AmbientAlertItem[];
};

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

export interface CharaDashaPeriod {
  rasi: number;
  rasi_name: string;
  years: number;
  start_date: string;
  end_date: string;
}

export interface CharaDashaData {
  chartId: string;
  lagnaRasi: number;
  currentPeriod: CharaDashaPeriod | null;
  periods: CharaDashaPeriod[];
}

export interface SolarReturnData {
  chartId: string;
  returnYear: number;
  srLagnaRasi: number;
  srLagnaRasiName: string;
  munthaRasi: number;
  munthaRasiName: string;
  lagnaMatchesNatal: boolean;
  sunLongAtReturn: number;
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

export interface PeyarchiEvent {
  alertId: string;
  planet: "SATURN" | "JUPITER" | "RAHU" | "KETU";
  fromRasi: string;
  toRasi: string;
  peyarchiDateUTC: string;
  peyarchiDateLocal: string;
  daysFromToday: number;
  impactFromMoon: number;
  impactFromLagna: number;
  saniCycleAfter: string | null;
  labelTa: string;
  labelEn: string;
}

export interface ChartExplanationCoreIdentity {
  lagnaRasi: string;
  moonRasi: string;
  janmaNakshatra: string;
  janmaPada: number;
  currentMahadasha: string;
  currentAntardasha: string;
  currentPratyantardasha: string;
  explanation: BiText;
}

export interface ChartExplanationPlanet {
  graha: string;
  houseFromLagna: number;
  rasi: number;
  rasiName: string;
  nakshatra: number;
  nakshatraName: string;
  pada: number;
  dignity: string;
  dignityScore: number;
  strengthScore: number;
  isRetrograde: boolean;
  isCombust: boolean;
  isVargottama: boolean;
  d9Rasi: number;
  houseGroup: "KENDRA" | "TRIKONA" | "DUSTHANA" | "OTHER";
  functionalNature: string;
  explanation: BiText;
}

export interface ChartExplanationMaitriPair {
  planetA: string;
  planetB: string;
  relationship: "FRIENDLY" | "NEUTRAL" | "HOSTILE";
  explanation: BiText;
}

export interface ChartExplanationConjunctionGroup {
  rasi: number;
  rasiName: string;
  houseFromLagna: number;
  planets: string[];
  relationshipTone: "FRIENDLY" | "NEUTRAL" | "HOSTILE";
  pairs: ChartExplanationMaitriPair[];
  explanation: BiText;
}

export interface ChartExplanationAspect {
  sourcePlanet: string;
  targetPlanet: string;
  sourceHouse: number;
  targetHouse: number;
  aspectHouse: number;
  aspectType: string;
  explanation: BiText;
}

export interface ChartExplanationHouseGroup {
  group: "KENDRA" | "TRIKONA" | "DUSTHANA" | "OTHER";
  houses: number[];
  planets: string[];
  explanation: BiText;
}

export interface ChartExplanationYogaDoshamSection {
  yogas: ChartYogaInsight[];
  doshams: ChartDoshamInsight[];
  explanation: BiText;
}

export interface ChartExplanationActivationSignal {
  sourcePlanet: string;
  signalType: string;
  explanation: BiText;
}

export interface ChartExplanationDashaLordActivation {
  level: "MAHADASHA" | "BHUKTI" | "ANTARAM";
  lord: string;
  startDate: string;
  endDate: string;
  natalHouseFromLagna: number;
  natalHouseFromMoon: number;
  natalRasi: number;
  natalRasiName: string;
  natalDignity: string;
  natalStrengthScore: number;
  functionalNature: string;
  transitRasi: number;
  transitRasiName: string;
  transitHouseFromMoon: number;
  transitHouseFromLagna: number;
  transitIsRetrograde: boolean;
  periodTone: "SUPPORT" | "STEADY" | "CAUTION";
  lifeAreas: string[];
  transitSignals: ChartExplanationActivationSignal[];
  explanation: BiText;
}

export interface ChartExplanationCurrentActivationSection {
  asOf: string;
  periodSummary: BiText;
  transitSummary: BiText;
  activeLords: ChartExplanationDashaLordActivation[];
  explanation: BiText;
}

export interface ChartExplanationSummarySection {
  strongestPlanet: string | null;
  weakestPlanet: string | null;
  positives: BiText[];
  cautions: BiText[];
}

export interface ChartExplanationPeyarchiEvent {
  planet: string;
  eventDate: string;
  fromRasi: string;
  toRasi: string;
  houseFromMoon: number;
  houseFromLagna: number;
  saniCycleAfter: string | null;
  explanation: BiText;
}

export interface ChartExplanationPeyarchiSection {
  asOf: string;
  events: ChartExplanationPeyarchiEvent[];
  explanation: BiText;
}

export interface ChartExplanationData {
  chartId: string;
  coreIdentity: ChartExplanationCoreIdentity;
  planets: ChartExplanationPlanet[];
  conjunctions: ChartExplanationConjunctionGroup[];
  aspects: ChartExplanationAspect[];
  houseGroups: ChartExplanationHouseGroup[];
  functionalNature: Record<string, string>;
  yogaDosham: ChartExplanationYogaDoshamSection;
  currentActivation: ChartExplanationCurrentActivationSection;
  summary: ChartExplanationSummarySection;
  peyarchi: ChartExplanationPeyarchiSection;
  methodNote: BiText;
}

export type PanchangamFestivalCategory =
  | "hindu"
  | "muslim"
  | "christian"
  | "indian_govt"
  | "tamilnadu_govt"
  | "observance"
  | string;

export interface PanchangamFestival {
  name: string;
  category: PanchangamFestivalCategory;
  tags?: PanchangamFestivalCategory[];
}

export interface PanchangamDailyResponseData {
  dateLocal: string;
  tamilDate?: BiText | null;
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
    nextNumber: number;
    nextName: string;
    nextPaksha: "SHUKLA" | "KRISHNA";
  };
  nakshatra: {
    name: string;
    pada: number;
    endsAt: string;
    nextName: string;
  };
  yoga: {
    number: number;
    name: string;
    endsAt: string;
    nextName: string;
  };
  karana: {
    name: string;
    endsAt: string;
    nextName: string;
  };
  kalam: {
    rahuKalam: { start: string; end: string; slot: number };
    yamagandam: { start: string; end: string; slot: number };
    kuligai: { start: string; end: string; slot: number };
    gowriPanchangam?: Array<{ start: string; end: string; slot: number; warning?: string | null; name?: string | null; period?: "DAY" | "NIGHT" | "AM" | "PM" | null; isGood?: boolean | null }>;
    nallaNeram: Array<{ start: string; end: string; slot: number; warning?: string | null; name?: string | null; period?: "DAY" | "NIGHT" | "AM" | "PM" | null; isGood?: boolean | null }>;
    gowriNallaNeram: Array<{ start: string; end: string; slot: number; warning?: string | null; name?: string | null; period?: "DAY" | "NIGHT" | "AM" | "PM" | null; isGood?: boolean | null }>;
  };
  abhijit: {
    start: string;
    end: string;
    isRestrictedByWeekday: boolean;
  };
  subhaMuhurtham: {
    isSubha: boolean;
    reason: string;
    isSubhaStrict: boolean;
    strictReason: string;
  };
  festivals: PanchangamFestival[];
  hora: Array<{
    index: number;
    lord: string;
    start: string;
    end: string;
  }>;
  moonPhaseLabel: string;
  soolam: { direction: string; parigaram: string };
  lagnam: { rasiNumber: number; rasiName: string; endsAt: string; nazhigai: number; vinadi: number };
  nethiram: string;
  jeevan: string;
  amirdhadhiYogam: { name: string; endsAt: string; nextName: string };
  chandrashtamamToday: {
    moonRasiNumber: number;
    moonRasiName: string;
    affectedJanmaRasiNumber: number;
    affectedJanmaRasiName: string;
    nakshatras: string[];
  };
  specialTithiDay?: {
    tithiNumber: number;
    name: "POURNAMI" | "AMAVASAI";
    moonPhase: "FULL" | "NEW";
  } | null;
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
    gowriPanchangam?: Array<{ start: string; end: string; slot: number; warning?: string | null; name?: string | null; period?: "DAY" | "NIGHT" | "AM" | "PM" | null; isGood?: boolean | null }>;
    nallaNeram: Array<{ start: string; end: string; slot: number; warning?: string | null; name?: string | null; period?: "DAY" | "NIGHT" | "AM" | "PM" | null; isGood?: boolean | null }>;
    gowriNallaNeram: Array<{ start: string; end: string; slot: number; warning?: string | null; name?: string | null; period?: "DAY" | "NIGHT" | "AM" | "PM" | null; isGood?: boolean | null }>;
  };
  abhijit: {
    start: string;
    end: string;
    isRestrictedByWeekday: boolean;
  };
  subhaMuhurtham: {
    isSubha: boolean;
    reason: string;
    isSubhaStrict: boolean;
    strictReason: string;
  };
  festivals: PanchangamFestival[];
  hora: Array<{
    index: number;
    lord: string;
    start: string;
    end: string;
  }>;
}

export interface PanchangamMonthDayEntry {
  dateLocal: string;
  tamilDate?: BiText | null;
  weekday: string;
  tithiNumber: number;
  tithiName: string;
  tithiPaksha: "SHUKLA" | "KRISHNA";
  nakshatraName: string;
  specialTithiDayNumber?: number | null;
  festivals: PanchangamFestival[];
  isTamilMuhurthamDay: boolean;
  isSubhaMuhurtham: boolean;
  isSubhaMuhurthamStrict: boolean;
}

export interface PanchangamMonthlyData {
  year: number;
  month: number;
  tamilMonthName?: BiText | null;
  entries: PanchangamMonthDayEntry[];
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

export interface FamilyMemberTodayScore {
  memberId: string;
  displayName: string;
  score: number;
  dashaLord: string;
  keyTransit: string | null;
}

export interface FamilyVaultTodayData {
  vaultId: string;
  date: string;
  members: FamilyMemberTodayScore[];
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

// ── Goals types ──────────────────────────────────────────────────────────────

export interface GoalData {
  goalId: string;
  chartId: string;
  goalType: string;
  description: string | null;
  isActive: boolean;
  languagePreference: string;
  createdAt: string;
}

export interface GoalListData {
  chartId: string;
  goals: GoalData[];
}

// ── What-If Simulator types ───────────────────────────────────────────────────

export interface TripleConfirmation {
  natalPromise: string;
  natalPromiseStrength: "STRONG" | "MODERATE" | "WEAK";
  dashaSupport: string;
  dashaSupportStrength: "STRONG" | "MODERATE" | "WEAK";
  gocharSupport: string;
  gocharSupportStrength: "STRONG" | "MODERATE" | "WEAK";
  overallVerdict: "FAVOURABLE" | "NEUTRAL" | "CAUTION";
}

export interface WhatIfBiText {
  ta: string;
  en: string;
}

export interface WhatIfData {
  chartId: string;
  scenario: string;
  targetDate: string;
  overallScore: number;
  verdict: "FAVOURABLE" | "NEUTRAL" | "CAUTION";
  tripleConfirmation: TripleConfirmation;
  summary: WhatIfBiText;
  bestPeriodInWindow: WhatIfBiText;
  cautionNote: WhatIfBiText;
  remedy: WhatIfBiText;
  disclaimer: WhatIfBiText;
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

export interface RetrospectiveBiText {
  ta: string;
  en: string;
}

export interface RetrospectivePlanetarySnapshot {
  planet: string;
  houseFromMoon: number;
  houseFromLagna: number;
  notableAspect: string | null;
}

export interface RetrospectiveFutureRecurrence {
  approximateDate: string;
  signatureDescription: string;
  intensity: "similar" | "milder" | "stronger";
}

export interface RetrospectiveData {
  retrospectiveId: string;
  chartId: string;
  eventDate: string;
  eventDescription: string;
  eventType: string;
  activeDasha: string;
  keyTransits: RetrospectivePlanetarySnapshot[];
  correlationExplanation: RetrospectiveBiText;
  futureRecurrences: RetrospectiveFutureRecurrence[];
  caution: RetrospectiveBiText;
  createdAt: string;
}

export interface RetrospectiveListData {
  chartId: string;
  items: RetrospectiveData[];
}

export interface DecisionBiText {
  ta: string;
  en: string;
}

export interface DecisionOptionAnalysis {
  label: string;
  score: number;
  alignmentNotes: string[];
  riskFactors: string[];
  optimalWindow: string | null;
}

export interface DecisionBriefData {
  chartId: string;
  targetDate: string;
  scenarioUsed: string;
  optionA: DecisionOptionAnalysis;
  optionB: DecisionOptionAnalysis;
  recommended: "A" | "B" | "DEFER";
  confidence: number;
  reasoning: DecisionBiText;
  caution: DecisionBiText | null;
}

// ── FEATURE-10: Nakshatra personality card ────────────────────────────────────

export type NakshatraCardData = {
  number: number;
  nameTa: string;
  nameEn: string;
  deityTa: string;
  deityEn: string;
  symbolTa: string;
  symbolEn: string;
  rulingPlanet: string;
  profile: BiText;
  strengths: BiText[];
  cautions: BiText[];
  compatibleGroups: string[];
};

// ── ARCH-02: Notification preferences ────────────────────────────────────────

export type NotificationPreferenceData = {
  notification_channel: "none" | "email" | "push" | "both";
  morningAlertEnabled: boolean;
  morningAlertTime: string;
  dashaAlertEnabled: boolean;
  piranthaNaalAlertEnabled: boolean;
  smartSilenceEnabled: boolean;
  fcmTokenRegistered: boolean;
};

// ── Notification inbox ────────────────────────────────────────────────────────

export type NotificationInboxItem = {
  notification_id: string;
  type: string;
  title: string;
  body: string;
  status: string;
  send_at: string;
  read_at: string | null;
};

export type NotificationInboxResponse = {
  success: boolean;
  data: NotificationInboxItem[];
  unread_count: number;
};

// ── FEATURE-11: Peyarchi report ───────────────────────────────────────────────

export type PeyarchiReportData = {
  chartId: string;
  planet: string;
  events: {
    planet: string;
    fromRasi: number;
    toRasi: number;
    transitDate: string;
    houseFromMoon: number;
    houseFromLagna: number;
    outlookTa: string;
    outlookEn: string;
  }[];
};

// ── FEATURE-07: Week-ahead digest ─────────────────────────────────────────────

export type WeekAheadDayItem = {
  dateLocal: string;
  score: number;
  label: string;
  nakshatraNumber: number;
  tithiNumber: number;
  isChandrashtama: boolean;
  specialTithi: string | null;
  bestWindowStart: string | null;
};

export type WeekAheadData = {
  profileId: string;
  chartId: string;
  weekStart: string;
  weekEnd: string;
  bestDay: string;
  bestDayScore: number;
  chandrashtamaDays: string[];
  specialTithiDays: string[];
  dashaThemeTa: string;
  dashaThemeEn: string;
  days: WeekAheadDayItem[];
};

// ── FEATURE-08: Activity timing tool ─────────────────────────────────────────

export type ActivityTimingData = {
  chartId: string;
  activity: string;
  month: string;
  topDates: {
    dateLocal: string;
    score: number;
    label: string;
    alignment: string;
    reasonTa: string;
    reasonEn: string;
  }[];
};

// ── FEATURE-09: Dasha story timeline ─────────────────────────────────────────

export type DashaStoryData = {
  chartId: string;
  openingLord: string;
  periods: {
    lord: string;
    startDate: string;
    endDate: string;
    ageStart: number;
    ageEnd: number;
    themeTa: string;
    themeEn: string;
    isCurrent: boolean;
  }[];
};

// ── Phase 4: Life-area deep predictions ──────────────────────────────────────

export interface PredictionBiText {
  ta: string;
  en: string;
}

export interface PredictionAstroFactor {
  key: string;
  status: "SUPPORT" | "CAUTION" | "NEUTRAL";
  detail: PredictionBiText;
}

export interface LifeAreaPredictionData {
  lifeArea: string;
  mainPredictionTa: string;
  mainPredictionEn: string;
  astrologicalFactors: PredictionAstroFactor[];
  dashaSupport: "STRONG" | "PARTIAL" | "WEAK";
  transitSupport: "STRONG" | "PARTIAL" | "WEAK";
  timingWindowStart: string | null;
  timingWindowEnd: string | null;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  challenges: PredictionBiText[];
  supports: PredictionBiText[];
}

export interface LifeAreaPredictionResponse {
  success: boolean;
  data: LifeAreaPredictionData;
  // Feature 5 — set on the wealth prediction for under-18 users so the client can
  // reframe investment guidance as education/savings.
  ageGated?: boolean;
  alternativeFraming?: string | null;
}

// Feature 2/5 — Life Mode (focus intent). Stored on user_preferences, not user_mode
// (which is the dashboard complexity mode: BEGINNER/BALANCED/TRADITIONAL).
export type LifeMode =
  | "STUDY" | "CAREER" | "LOVE" | "MARRIAGE" | "FAMILY"
  | "WEALTH" | "HEALTH" | "SPIRITUALITY" | "REMEDIES" | "BALANCED";

export interface LifeModeStatus {
  mode: LifeMode;
  lifeModeSetAt: string | null;
  showLifeModePicker: boolean;
  blockedModes?: string[];
}

// ── Phase 4: All four predictions bundled ─────────────────────────────────────

export interface PredictionBundle {
  marriage: LifeAreaPredictionData | null;
  career: LifeAreaPredictionData | null;
  wealth: LifeAreaPredictionData | null;
  health: LifeAreaPredictionData | null;
}

// ── Phase 2: Yoga / Dosham (from ChartCalculateResponseData) ─────────────────

export interface ChartYogaInsight {
  name: string;
  isPresent: boolean;
  strength: "STRONG" | "PARTIAL" | "WEAK";
  conditionsMet: string[];
  cancellationFactors: string[];
  dashaActivated: boolean;
  activationScore: number;
  isCurrentlyActive: boolean;
  descriptionTa: string;
  descriptionEn: string;
}

export interface ChartDoshamInsight {
  name: string;
  isPresent: boolean;
  isCancelled: boolean;
  strength: "STRONG" | "PARTIAL" | "WEAK";
  label: string;
  category: string;
  conditionsMet: string[];
  cancellationFactors: string[];
  missingData: string[];
  dashaActivated: boolean;
  descriptionTa: string;
  descriptionEn: string;
  explanationWhatTa: string;
  explanationWhatEn: string;
  explanationWhyTa: string;
  explanationWhyEn: string;
  explanationHowTa: string;
  explanationHowEn: string;
}

// ── Phase 6: Jadhagam full report ─────────────────────────────────────────────

export interface JadhagamReportBirthProfile {
  displayName: string;
  birthDateLocal: string;
  birthTimeLocal: string;
  birthPlace: string;
  birthTimezone: string;
  currentAge: number;
}

export interface JadhagamReportCoreIdentity {
  lagnaRasi: string;
  moonRasi: string;
  janmaNakshatra: string;
  janmaPada: number;
  currentMahadasha: string;
  currentAntardasha: string;
}

export interface JadhagamReportNavamsaSummary {
  d9ByPlanet: Record<string, number>;
  vargottamaPlanets: string[];
}

export interface JadhagamReportPlanetStrengthItem {
  planet: string;
  score: number;
}

export interface JadhagamReportPlanetStrengthSummary {
  strong: JadhagamReportPlanetStrengthItem[];
  moderate: JadhagamReportPlanetStrengthItem[];
  weak: JadhagamReportPlanetStrengthItem[];
}

export interface JadhagamReportData {
  chartId: string;
  birthProfile: JadhagamReportBirthProfile;
  coreIdentity: JadhagamReportCoreIdentity;
  navamsamSummary: JadhagamReportNavamsaSummary;
  functionalNatureTable: Record<string, string>;
  yogaDoshamSummary: {
    yogas: ChartYogaInsight[];
    doshams: ChartDoshamInsight[];
  };
  planetaryStrengthSummary: JadhagamReportPlanetStrengthSummary;
  dashaAnalysis: { currentMahadasha: string; currentAntardasha: string };
  lifeAreaPredictions: Array<{ area: string; status: string }>;
  ageWiseTimeline: { currentAge: number; activeFocusAreas: string[] };
  currentYearGuidance: { ta: string; en: string };
  practicalGuidance: { ta: string[]; en: string[] };
  optionalRemedies: { ta: string[]; en: string[] };
  executiveSummary: { ta: string; en: string };
}

export interface JadhagamReportResponse {
  success: boolean;
  data: JadhagamReportData;
}

// ── Journal CRUD ─────────────────────────────────────────────────────────────

export type JournalAnchorData = {
  activeDasha: string;
  moonHouseFromMoon: number;
  saturnHouseFromMoon: number;
  moonRasi: string;
  saturnRasi: string;
};

export type JournalEntryData = {
  journalId: string;
  chartId: string;
  entryDate: string;
  lifeArea: string;
  noteText: string;
  tags: string[];
  anchor: JournalAnchorData;
  createdAt: string;
};

export type JournalListData = {
  chartId: string;
  totalCount: number;
  items: JournalEntryData[];
};

export type JournalPromptItem = {
  promptId: string;
  category: string;
  text: BiText;
};

export type JournalPromptsData = {
  chartId: string;
  dateLocal: string;
  lifeArea: string;
  scoreLabel: string;
  prompts: JournalPromptItem[];
};

// ── Context events ────────────────────────────────────────────────────────────

export type ContextEvent = {
  type: string;
  date: string;
  note: string | null;
};

export type ContextData = {
  contextId: string;
  ownerUserId: string;
  chartId: string;
  lifeSituation: Record<string, unknown>;
  activeEvents: ContextEvent[];
  reactionHistory: unknown[];
  updatedAt: string;
};

// ── FEATURE-12: Journal correlations ─────────────────────────────────────────

export type JournalCorrelationData = {
  chartId: string;
  entryCount: number;
  lookbackDays: number;
  hasSufficientData: boolean;
  minimumEntriesRequired: number;
  correlations: {
    condition: string;
    sampleCount: number;
    avgMood: number;
    descriptionTa: string;
    descriptionEn: string;
  }[];
};

// ── Synastry & Relationship Alerts ───────────────────────────────────────────

export interface SynastryAspect {
  planet1: string;
  planet2: string;
  aspectType: string;
  orb: number;
  tone: "supportive" | "challenging" | "neutral";
  descriptionTa: string;
  descriptionEn: string;
}

export interface SynastryData {
  memberId: string;
  memberName: string;
  ownerChartId: string;
  memberChartId: string;
  compatibilityScore: number;
  compatibilityLabel: string;
  aspects: SynastryAspect[];
  timingIndicators: {
    planet: string;
    description: BiText;
  }[];
  summary: BiText;
  caution: BiText | null;
}

export interface KutaResult {
  name: string;
  nameTa: string;
  score: number;
  maxScore: number;
  label: string;
}

export interface PorutthamData {
  familyVaultId: string;
  memberId: string;
  boyNakshatra: number;
  boyNakshatraName: string;
  girlNakshatra: number;
  girlNakshatraName: string;
  kutas: KutaResult[];
  totalScore: number;
  maxScore: number;
  percentage: number;
  label: string;
  rajjuDosha: boolean;
  vedhaDosha: boolean;
  summary: BiText;
  compatibilityContext: string;
  contextNote: BiText | null;
}

export interface DirectPoruthamData {
  chartIdA: string;
  chartIdB: string;
  boyNakshatra: number;
  boyNakshatraName: string;
  girlNakshatra: number;
  girlNakshatraName: string;
  kutas: KutaResult[];
  totalScore: number;
  maxScore: number;
  percentage: number;
  label: string;
  rajjuDosha: boolean;
  vedhaDosha: boolean;
  summary: BiText;
  compatibilityContext: string;
  contextNote: BiText | null;
}

// Compatibility Intelligence — signed-user full 8-level report

export interface SevvaiDoshamDetail {
  hasDosham: boolean;
  marsHouse: number;
  isCancelled: boolean;
  severity: string;
  cancellationReasons: string[];
  noteEn: string;
  noteTa: string;
  score: number;
}

export interface ChartMarriageStrength {
  seventhHouseRasi: number;
  seventhLord: string;
  seventhLordHouse: number;
  seventhLordStrength: number;
  venusHouse: number;
  venusStrength: number;
  jupiterHouse: number;
  jupiterStrength: number;
  hasMaleficInSeventh: boolean;
  score: number;
  noteEn: string;
  noteTa: string;
}

export interface NavamsaCompatibility {
  personAVenusD9: number;
  personBVenusD9: number;
  personASeventhLordD9: number;
  personBSeventhLordD9: number;
  harmonyLabel: string;
  noteEn: string;
  noteTa: string;
  score: number;
}

export interface DashaHarmony {
  personAMahaLord: string;
  personAantarLord: string;
  personAMahaEnd: string;
  personBMahaLord: string;
  personBAntarLord: string;
  personBMahaEnd: string;
  harmonyLabel: string;
  noteEn: string;
  noteTa: string;
  score: number;
}

export interface EmotionalCompatibility {
  moonMoonHarmony: string;
  venusMarsHarmony: string;
  communicationNote: string;
  noteEn: string;
  noteTa: string;
  score: number;
}

export interface CompatibilityScoreBreakdown {
  porutham: number;
  seventhHouse: number;
  navamsa: number;
  dashaHarmony: number;
  doshamAnalysis: number;
  emotional: number;
  synastry: number;
}

export interface NadiDoshaResult {
  boyNadi: string;
  girlNadi: string;
  hasNadiDosha: boolean;
  cancellations: string[];
  severity: string;
  noteTa: string;
  noteEn: string;
}

export interface CompatibilityIntelligenceData {
  personAName: string;
  personBName: string;
  poruthamScore: number;
  poruthamMax: number;
  poruthamPercentage: number;
  poruthamLabel: string;
  poruthamKutas: KutaResult[];
  rajjuDosha: boolean;
  vedhaDosha: boolean;
  nadiDosha: NadiDoshaResult;
  chartAStrength: ChartMarriageStrength;
  chartBStrength: ChartMarriageStrength;
  navamsa: NavamsaCompatibility;
  sevvaiA: SevvaiDoshamDetail;
  sevvaiB: SevvaiDoshamDetail;
  dashaHarmony: DashaHarmony;
  emotional: EmotionalCompatibility;
  synastryScore: number;
  overallScore: number;
  overallLabel: string;
  scoreBreakdown: CompatibilityScoreBreakdown;
  strengthsEn: string[];
  strengthsTa: string[];
  risksEn: string[];
  risksTa: string[];
  summary: BiText;
}

export interface RelationshipAlertItem {
  alertId: string;
  memberId: string;
  memberName: string;
  significanceScore: number;
  triggerPlanet: string;
  eventDate: string;
  daysFromToday: number;
  title: BiText;
  message: BiText;
}

export interface RelationshipAlertsData {
  familyVaultId: string;
  items: RelationshipAlertItem[];
}

// ── P2-B Share Cards ──────────────────────────────────────────────────────────

export type ShareCardType = "DAILY_VIBE" | "DASHA_ERA" | "NAKSHATRA";

export interface ShareCardData {
  cardType: ShareCardType;
  chartId: string;
  dateLocal: string;
  // DAILY_VIBE
  score?: number;
  scoreLabel?: string;
  scoreBand?: "high" | "good" | "neutral" | "caution";
  headline?: BiText;
  subHeadline?: BiText;
  bestWindow?: string;
  // DASHA_ERA
  mahaLord?: string;
  mahaLordPlain?: BiText;
  eraLabel?: BiText;
  eraYears?: string;
  // NAKSHATRA
  nakshatraNameTa?: string;
  nakshatraNameEn?: string;
  nakshatraTrait?: BiText;
  rulingPlanet?: string;
}

// ── Retrospective event analysis ─────────────────────────────────────────────

export interface RetrospectiveCreatePayload {
  chartId: string;
  eventDate: string;
  eventDescription: string;
  eventType: string;
}

// ── Decision brief ───────────────────────────────────────────────────────────

export interface DecisionBriefPayload {
  chartId: string;
  optionA: { label: string; description: string };
  optionB: { label: string; description: string };
  priority?: "career" | "family" | "health" | "relationship" | "education" | "money" | "spiritual";
  targetDate?: string;
}

// ── P2-C Annual Wrapped ───────────────────────────────────────────────────────

export interface WrappedSlide {
  slideId: string;
  slideType: "OVERVIEW" | "DASHA_ERA" | "PEAK" | "STATS" | "REFLECTION" | "LIFE_AREA" | "CLOSING";
  headline: BiText;
  body: BiText;
  accentColor: string;
  stat: string | null;
}

export interface AnnualWrappedData {
  chartId: string;
  year: number;
  slides: WrappedSlide[];
  totalDaysScored: number;
  peakScore: number;
  peakDate: string | null;
  valleyScore: number;
  valleyDate: string | null;
  dominantDashaLord: string;
  highDays: number;
  cautionDays: number;
  averageScore: number;
  topLifeArea: string | null;
}

// ── Varshaphala (Annual Chart) ────────────────────────────────────────────────

export interface TajakaPlanetPosition {
  planet: string;
  rasi: number;
  rasiName: string;
  house: number;
  longitude: number;
}

export interface TajakaAspect {
  planet1: string;
  planet2: string;
  aspectType: string;
  orb: number;
}

export interface VarshaphalaAreaOutlook {
  area: string;
  score: number;
  narrativeTa: string;
  narrativeEn: string;
  favourableMonths: number[];
}

export interface VarshaphalaData {
  year: number;
  solarReturnDate: string;
  solarReturnLagnaRasi: number;
  solarReturnLagnaName: string;
  munthaRasi: number;
  munthaRasiName: string;
  munthaHouseFromSrLagna: number;
  yearLord: string;
  yearLordHouse: number;
  tajakaPlanets: TajakaPlanetPosition[];
  itthasalaPairs: TajakaAspect[];
  isarafaPairs: TajakaAspect[];
  areaOutlook: VarshaphalaAreaOutlook[];
}

// ── Remedies ──────────────────────────────────────────────────────────────────

export interface RemedyPlanItem {
  planet: string;
  priority: number;
  reason: string;
  day: string;
  templeTa: string;
  templeEn: string;
  mantraFullTa: string;
  japaCount: number;
  daanumItemsTa: string;
  daanumItemsEn: string;
  gemstoneTa: string | null;
  gemstoneEn: string | null;
  fastingRuleTa: string;
  fastingRuleEn: string;
  behaviouralTa: string;
  behaviouralEn: string;
}

export interface GemstoneAdviceItem {
  planet: string;
  functionalNature: string;
  isGemstonePrescribed: boolean;
  gemstoneNameTa: string | null;
  gemstoneNameEn: string | null;
  reasonTa: string;
  reasonEn: string;
  cautionTa: string | null;
  cautionEn: string | null;
}

// ── Prasna (Horary) ───────────────────────────────────────────────────────────

export interface PrasnaResponse {
  prasnaLagnaRasi: number;
  prasnaLagnaName: string;
  moonRasi: number;
  moonNakshatraName: string;
  questionArea: string;
  karaka: string;
  karakaHouse: number;
  outlook: "FAVOURABLE" | "UNFAVOURABLE" | "MIXED" | "DELAY";
  outlookTa: string;
  outlookEn: string;
  positiveIndicators: string[];
  negativeIndicators: string[];
  cautionTa: string;
  cautionEn: string;
}
