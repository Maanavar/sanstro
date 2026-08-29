export interface ApiMeta {
  calculationVersion: string;
  generatedAt: string;
}

export interface BiText {
  ta: string;
  en: string;
}

export type LifeAreaText = BiText;

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

export interface LifeAreaData {
  area: string;
  label: BiText;
  score: number;
  /** The six-month slope (score vs score6mo), not a restatement of how high
   *  the current score is. */
  trend: "UP" | "DOWN" | "STABLE";
  /** True while Chandrashtamam is docking this area's score. The rest of a
   *  life-area score holds for weeks at a time; this is its one ~2-day input,
   *  so a surface can name the cause rather than let the tile move silently.
   *  Optional for backward-compatibility with cached responses. */
  chandrashtamaApplied?: boolean;
  /** Engine re-run at +6 / +12 months (real transits + dasha in force then),
   *  blended as the current score is. Optional for backward-compatibility with
   *  older cached responses; falls back to the current score when absent. */
  score6mo?: number;
  score12mo?: number;
  /** Life-stage relevance decided by the engine's age/phase gate — the single
   *  source of truth. False when the area is skipped for the native's current
   *  phase (e.g. Career for a child, Relationships for an unmarried elder). The
   *  area is still returned with a "becomes relevant later" reading; a surface
   *  may dim or hide it but must NOT re-derive the gate from age on the client.
   *  Optional for backward-compatibility with cached responses (absent ⇒ shown). */
  ageRelevant?: boolean;
  confidence: ConfidenceTier;
  confidenceReason: BiText;
  primaryHouseStrength: "STRONG" | "NEUTRAL" | "WEAK";
  karakaStatus: "STRONG" | "MODERATE" | "WEAK";
  dashaActivation: boolean;
  transitSupport: number;
  supportingFactors: string[];
  blockingFactors: string[];
  driver: {
    planet: string;
    reason: BiText;
  };
  narrative: BiText;
  remedy: BiText;
  next30DayOutlook: BiText;
  caution: BiText | null;
  isGoalFocus: boolean;
  /** Additive — present only when the reasoning_contradiction flag is on. */
  reading?: ReasoningReading | null;
  /**
   * Root-cause chain ("because ... therefore ..."), replacing the flat
   * factor list for LOW-confidence areas only. Additive — present only
   * when the reasoning_chart_signature flag is on (plan Phase 5).
   */
  causalChain?: BiText | null;
}

/** Dominant-graha framing for the whole chart (plan Phase 5). */
export interface ChartSignatureData {
  dominant: string;
  framing: BiText;
}

export interface LifeAreasResponseData {
  chartId: string;
  dateLocal: string;
  areas: LifeAreaData[];
  /** Additive — present only when the reasoning_chart_signature flag is on. */
  chartSignature?: ChartSignatureData | null;
}

export interface AskVinaadiAnswer {
  ta: string;
  en: string;
}

/** Plain go/stay verdict led before the reasoning, for decision/voice users
 *  (UX #6). Absent when the question was informational, not a decision. */
export interface AskVinaadiVerdict {
  kind: "GO" | "WAIT" | "CAUTION" | "MIXED";
  ta: string;
  en: string;
}

export interface AskVinaadiResponseData {
  question: string;
  answer: AskVinaadiAnswer;
  verdict?: AskVinaadiVerdict | null;
  signalsUsed: string[];
  confidence: ConfidenceTier;
  caveat: AskVinaadiAnswer | null;
  questionsUsedToday: number;
  dailyLimit: number;
  chipsRemaining?: number | null;
}

/**
 * Where a muhurta factor's rule comes from, when a classical text decided it.
 * Present only on factors whose rule is primary-text confirmed — a citation on
 * screen claims that a named page of a named edition says this.
 */
export interface MuhurtaCitation {
  tradition?: string | null;
  chapter?: string | null;
  page?: string | null;
  passage?: string | null;
  edition?: string | null;
}

/**
 * One thing the muhurta engine checked, what it decided, and why — the audit
 * trail behind a slot's score.
 *
 * Two distinctions in `verdict` are load-bearing and must survive into the UI:
 *
 * - `UNSOURCED` is NOT `NEUTRAL`. "We checked and it is fine" and "we have no
 *   table to check against" must never render the same way. Today only marriage
 *   has a primary-text table; gold, land and business return UNSOURCED.
 * - `VETO` is NOT a large `PENALTY`. A veto removes the day and cannot be
 *   outweighed — render it as an exclusion, never as a low score.
 */
export interface MuhurtaFactor {
  factor: string;
  verdict: "VETO" | "PENALTY" | "NEUTRAL" | "BONUS" | "UNSOURCED";
  contribution: number;
  reason: BiText;
  /** True only for primary-text-confirmed doctrine — never for the generic almanac layer. */
  sourced?: boolean;
  ruleId?: string | null;
  citation?: MuhurtaCitation | null;
  /** Two sourced rules matched and the text does not settle which wins. */
  conflict?: string | null;
}

/** A non-scoring family-custom note for the Tamil solar month of the slot. */
export interface TraditionalMonthNotice {
  month: BiText;
  message: BiText;
}

export interface MuhurtaSlot {
  date: string;
  tamilDate?: BiText | null;
  timeStart: string;
  timeEnd: string;
  score: number;
  /** False only for an explicit selected-date assessment that found a veto. */
  recommended?: boolean;
  band?: "BEST" | "GOOD" | "USABLE" | "NOT_RECOMMENDED";
  panchangamSupport: BiText;
  dashaSupport?: BiText | null;
  horaSupport?: BiText | null;
  cautions: BiText[];
  /** Informational only; never changes the score or recommendation. */
  traditionalMonthNotices?: TraditionalMonthNotice[];
  /**
   * Every factor the engine weighed, in evaluation order. `cautions` is a lossy
   * projection of this (the PENALTY reasons only), kept for surfaces that
   * already render it — new UI should read `factors`, which also carries
   * verdicts, citations and rule conflicts.
   */
  factors?: MuhurtaFactor[];
}

export interface MuhurtaActivityLocation {
  /** Human-readable place name whose local sky was used for the results. */
  place: string;
  latitude: number;
  longitude: number;
  timezone: string;
  source: "activity" | "current" | "birth";
}

export interface MuhurtaResponseData {
  chartId: string | null;
  activity: string;
  dateFrom: string;
  dateTo: string;
  timezone: string;
  activityLocation: MuhurtaActivityLocation;
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

/** Result of POST /journal/retention/apply (dryRun previews without archiving). */
export interface JournalRetentionApplyData {
  chartId: string;
  keepDays: number;
  thresholdDate: string;
  matchedCount: number;
  archivedCount: number;
  dryRun: boolean;
}

export interface BirthProfileCreateResponseData {
  birthProfileId: string;
  chartId: string | null;
  calculationStatus: "pending" | "completed" | "failed";
  warnings: string[];
}

export interface BirthProfileResponse {
  birthProfileId: string;
  ownerUserId: string | null;
  familyVaultId: string | null;
  familyMemberId: string | null;
  relationshipToOwner: "self" | "spouse" | "child" | "parent" | "sibling" | "grandparent" | "other";
  displayName: string;
  birthDateLocal: string;
  birthTimeLocal: string | null;
  birthPlace: string;
  birthLatitude: number;
  birthLongitude: number;
  birthTimezone: string;
  currentPlace: string | null;
  currentLatitude: number | null;
  currentLongitude: number | null;
  currentTimezone: string | null;
  birthTimeSource: string;
  birthTimeConfidenceMinutes: number;
  calculationStatus: "pending" | "completed" | "failed";
  warnings: string[];
}

export interface BirthProfileSnapshot {
  birthProfileId: string;
  chartId?: string | null;
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
  /** Life-stage answers. `null` means we hold no answer and is NOT the same as
   *  "single" / "none" — `undisclosed` is the reader declining, which is also
   *  not an answer. Anything gating on these must distinguish all three. They
   *  are optional here only because older cached snapshots predate them. */
  maritalStatus?: string | null;
  employmentType?: string | null;
  children?: string | null;
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
  /** Cazimi — planet within 0°17' of the Sun (heart of the Sun): empowered, not burnt. */
  isCazimi?: boolean;
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

export interface ChartYogaInsight {
  name: string;
  isPresent: boolean;
  strength: "STRONG" | "PARTIAL" | "WEAK";
  conditionsMet: string[];
  cancellationFactors: string[];
  dashaActivated: boolean;
  activationScore: number;
  isCurrentlyActive: boolean;
  /** How the yoga forms (the mechanism). */
  descriptionTa: string;
  descriptionEn: string;
  /**
   * What the yoga is traditionally held to do, in one sentence — the "so what"
   * for a reader who does not already know the term. Render as its own line
   * below the mechanism, never concatenated onto it. Empty string when the
   * code has no catalogue entry, so callers should skip falsy values.
   */
  effectTa?: string;
  effectEn?: string;
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
  /** Optional named sub-type, e.g. the specific Kala Sarpa naga (Ananta..Sheshanaga). */
  variantTa?: string;
  variantEn?: string;
}

/**
 * One birth-time junction/edge condition — the "Border Alert" module.
 * severity: BOOST = empowering (e.g. Cazimi), ALERT = needs attention
 * (Sankranti / Grahana birth), INFO = neutral note.
 */
export interface ChartBirthCondition {
  code: string;
  isPresent: boolean;
  severity: "BOOST" | "ALERT" | "INFO";
  titleTa: string;
  titleEn: string;
  descriptionTa: string;
  descriptionEn: string;
  detail?: Record<string, unknown>;
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
  equalBhava?: Record<string, number>;
  vargas?: Record<string, Record<string, number>>;
  vargaReliability?: Record<string, string>;
  nakshatraAnalysis?: Record<string, unknown>;
  birthConditions?: ChartBirthCondition[];
  birthPanchangamSignature?: Record<string, unknown>;
}

export interface ChartValidationStatus {
  passed: boolean;
  matchCount: number;
  totalChecked: number;
  confidence: "HIGH" | "MEDIUM" | "LOW" | "UNVALIDATED";
  unmatchedEvents: string[];
}

/** One house's bhava-lord (அதிபதி) placement reading — audit T3. */
export interface AdhipathiReading {
  house: number;
  houseRasi: number;
  lord: string;
  lordRasi: number;
  lordHouse: number;
  strengthScore: number;
  strengthBand: "STRONG" | "MODERATE" | "WEAK";
  functionalNature: string;
  adhipathiTa: string;
  adhipathiEn: string;
  significationsTa: string;
  significationsEn: string;
  readingTa: string;
  readingEn: string;
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
  adhipathiReport?: AdhipathiReading[];
  ashtakavarga?: Record<string, Record<number, number>>;
  planets?: ChartPlanet[];
  yogas?: ChartYogaInsight[];
  primaryLanguageText: BiText;
  chartValidationStatus?: ChartValidationStatus;
}

export interface DailyGuidanceWindow {
  type: string;
  start: string;
  end: string;
  /**
   * What the window is made of. Populated since the best window became the
   * intersection of the hora grid and the Gowri kala grid, trimmed to where both
   * agree — so a surface can say *why* a time is best. All optional: rows cached
   * before the change, and the backend's stale-snapshot fallback, send only
   * type/start/end.
   */
  kala?: string | null;       // AMIRTHAM | UTHI | LABHAM | DHANAM | SUGAM
  horaLord?: string | null;   // VENUS | JUPITER | …
  isPersonal?: boolean;       // ruled by this native's lagna or dasha lord
  text?: BiText | null;       // "Venus hora inside Amirtham"
}

/**
 * A stretch of the day that was nearly a best window, and what spoiled it —
 * always a hora-vs-kala collision, the one pairing no other surface reconciles.
 * Rahu Kalam / Yamagandam / Kuligai clashes are deliberately absent: the hero's
 * Avoid card and the panchangam page already carry those.
 */
export interface DailyGuidanceWindowConflict {
  kind: "BAD_KALA" | "MALEFIC_HORA" | (string & {});
  cause: string;  // ROGAM | SATURN — the specific thing named
  start: string;
  end: string;
  text: BiText;
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

/** One concrete remedy act for the Today card's anchor planet. `cadence` is a
 *  genuine attribute of the act (a weekday ritual vs. anytime service), never a
 *  per-chart ranking. */
export interface RemedyFocusAction {
  text: BiText;
  kind: "TEMPLE" | "SEVA";
  cadence: "RITUAL_ON_DAY" | "ANY_DAY";
}

/** The Today card's chart-driven remedy: one anchor planet (the running dasa
 *  lord), why it was chosen, and up to three concrete acts from the catalog.
 *  `weekday` is an English enum the client localises and uses to find the next
 *  date; `isWeak` is true only when the planet genuinely sits among the chart's
 *  weakest grahas by natal strength. */
export interface RemedyFocus {
  planet: string;
  role: "DASHA_LORD" | "WEAK_BENEFIC" | "DOSHA";
  isWeak: boolean;
  weekday: "SUNDAY" | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY";
  lead: BiText;
  why: BiText;
  actions: RemedyFocusAction[];
  japa?: number | null;
}

export interface DailyGuidanceData {
  chartId: string;
  dateLocal: string;
  score: number;
  label: string;
  confidence: ConfidenceTier;
  confidenceReason: BiText;
  /** Additive ordinal band — present only when the reasoning_bands flag is on. */
  band?: ReasoningBand | null;
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
  /** Near-misses and their causes. Optional — absent on rows cached before it. */
  bestWindowConflicts?: DailyGuidanceWindowConflict[];
  text: BiText;
  nakshatraPerspective: BiText | null;
  emotionalWeather: DailyGuidanceEmotionalWeather | null;
  contextInsight: BiText | null;
  journalInsight: DailyGuidanceJournalInsight | null;
  actionSuggestion: BiText;
  cautionSuggestion: BiText;
  reasons: DailyGuidanceReasons;
  /** Track A synthesis — the six `reasons` composed into one prioritized, flowing
   *  briefing (verdict lead → salient signals → one action). Present only when the
   *  `daily_briefing_synth` flag is on; additive so older cached rows stay valid. */
  briefing?: BiText | null;
  remedy: BiText;
  /** Structured, chart-driven remedy for the Today card (anchor planet + three
   *  concrete acts). Additive/optional — cached rows built before it return null
   *  and the client falls back to the flat `remedy` string above. */
  remedyFocus?: RemedyFocus | null;
  currentHoraLord?: string | null;
  pratyantarNarrative?: BiText | null;
  tithiCard: BiText | null;
  isChandrashtama?: boolean;
  chandrashtamaEnds?: string | null;
  /** Today's green/red light across all activity types. Optional — older
   *  cached rows predate it, so callers must handle undefined. */
  activityBoard?: DailyActivityBoard | null;
}

/** One activity and today's verdict on it. */
export interface DailyActivityVerdict {
  activity: string;
  label: BiText;
  alignment: "SUPPORTS" | "NEUTRAL" | "CAUTION";
  reason: BiText;
}

/**
 * "What is today good for?" — the same activity-timing doctrine the goal
 * screens already use, swept across every activity and partitioned.
 *
 * On a Chandrashtama day `favourable` is deliberately empty (those activities
 * move to `neutral`) so the board cannot contradict the Chandrashtama alert.
 */
export interface DailyActivityBoard {
  favourable: DailyActivityVerdict[];
  caution: DailyActivityVerdict[];
  neutral: DailyActivityVerdict[];
  isChandrashtama: boolean;
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

// Jaimini Chara Karakas (BPHS Ch. 32) — see app/calculations/jaimini_karakas.py
// for the documented Rahu/tie-break conventions this project uses.
export interface CharaKarakaMap {
  ATMAKARAKA: string;
  AMATYAKARAKA: string;
  BHRATRUKARAKA: string;
  MATRUKARAKA: string;
  PITRUKARAKA: string;
  PUTRAKARAKA: string;
  GNATIKARAKA: string;
  DAARAKARAKA: string;
}

export interface CharaDashaData {
  chartId: string;
  lagnaRasi: number;
  currentPeriod: CharaDashaPeriod | null;
  periods: CharaDashaPeriod[];
  charKarakas: CharaKarakaMap | null;
  atmakaraka: string | null;
  karakamsaRasi: number | null;
  karakamsaRasiName: string | null;
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
  moonBasedCycle: SaniCycleAssessment;
  lagnaBasedCycle: SaniCycleAssessment;
  confirmationSentence: string;
}

export interface SaniCycleAssessment {
  type: string | null;
  isActive: boolean;
  supportiveLabel: string | null;
  role?: "primary" | "cross_check" | string | null;
  phaseEndsOn?: string | null;
  cycleEndsOn?: string | null;
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
  /** Graha ruling this nakshatra, served from the engine's canonical table.
   *  Prefer this over a client-side 27-star lord list. */
  nakshatraLord?: string;
  dignity: string;
  dignityScore: number;
  strengthScore: number;
  isRetrograde: boolean;
  isCombust: boolean;
  isCazimi: boolean;
  isVargottama: boolean;
  d9Rasi: number;
  houseGroup: "KENDRA" | "TRIKONA" | "DUSTHANA" | "OTHER";
  functionalNature: string;
  /** Inside a graha yuddham (planetary war) — two tara grahas within 1°. The
   *  engine has always charged the loser -15 on `strengthScore`; these fields
   *  are what finally let a client say so. */
  isPlanetaryWar?: boolean;
  warOpponent?: string | null;
  warOutcome?: "LOST" | "WON" | null;
  /** Other grahas sharing this planet's sign. */
  coTenants?: string[];
  /** The full reading as one paragraph. Retained for existing consumers;
   *  prefer `facets` for anything newly built. */
  explanation: BiText;
  /** The same reading split into labelled, scannable lines. Empty on responses
   *  from before this field existed. */
  facets?: ChartExplanationFacet[];
  /** Additive derivation of `strengthScore` — the rows sum to it exactly.
   *  Empty on charts calculated before this field existed. */
  scoreBreakdown?: ChartExplanationScoreTerm[];
}

/** One signed, labelled row of a planet's score derivation. */
export interface ChartExplanationScoreTerm {
  key: string;
  label: BiText;
  points: number;
  detail?: BiText | null;
}

/**
 * One labelled line of a planet's reading.
 *
 * `tone` lets a client style the line without re-deriving meaning:
 * BOOST = strengthening, CAUTION = asks for care, NEUTRAL = descriptive.
 */
export interface ChartExplanationFacet {
  key:
    | "placement"
    | "role"
    | "strength"
    | "lordship"
    | "condition"
    | "company"
    | "navamsa"
    | "activation"
    | "nakshatra"
    | "transit"
    | "remedy"
    | "synthesis";
  label: BiText;
  value: BiText;
  tone: "NEUTRAL" | "BOOST" | "CAUTION";
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
  /** Positional-strength scores behind the two picks above (0-100). */
  strongestPlanetScore?: number | null;
  weakestPlanetScore?: number | null;
  /**
   * Present when the highest-scoring planet is combust, debilitated or in an
   * enemy sign — positional strength is a different axis from the capacity to
   * deliver benefic results, and the top pick must not imply both.
   */
  strongestPlanetCaveat?: BiText | null;
  /** One-line anchor for what the 0-100 scale measures. */
  scoreScaleNote?: BiText | null;
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

/**
 * One house read as a life area.
 *
 * `aspects` above is planet-to-planet only, so an empty house under a full
 * drishti (an unoccupied 7th receiving Saturn's aspect, say) surfaced nowhere.
 * These entries always cover all twelve houses, occupied or not.
 */
export interface ChartExplanationBhava {
  house: number;
  rasi: number;
  rasiName: string;
  lord: string;
  lordHouse: number;
  lordStrength?: number | null;
  occupants: string[];
  aspectingPlanets: string[];
  bhavaBala?: number | null;
  theme: BiText;
  explanation: BiText;
}

export interface ChartExplanationBhavaSection {
  bhavas: ChartExplanationBhava[];
  explanation: BiText;
}

export interface ChartExplanationData {
  chartId: string;
  coreIdentity: ChartExplanationCoreIdentity;
  planets: ChartExplanationPlanet[];
  conjunctions: ChartExplanationConjunctionGroup[];
  aspects: ChartExplanationAspect[];
  houseGroups: ChartExplanationHouseGroup[];
  /** Per-house life-area reading. Optional — older servers omit it. */
  bhavas?: ChartExplanationBhavaSection | null;
  functionalNature: Record<string, string>;
  yogaDosham: ChartExplanationYogaDoshamSection;
  currentActivation: ChartExplanationCurrentActivationSection;
  summary: ChartExplanationSummarySection;
  peyarchi: ChartExplanationPeyarchiSection;
  methodNote: BiText;
}

export type PanchangamFestivalCategory =
  | "hindu" | "muslim" | "christian" | "indian_govt" | "tamilnadu_govt" | "observance" | string;

export interface PanchangamFestival {
  name: string;
  category: PanchangamFestivalCategory;
  tags?: PanchangamFestivalCategory[];
}

export interface KalamSlot {
  start: string;
  end: string;
  slot: number;
  warning?: string | null;
  name?: string | null;
  period?: "DAY" | "NIGHT" | "AM" | "PM" | null;
  isGood?: boolean | null;
}

/** One stretch of a single panchangam limb value inside the solar day.
 *
 * `name` on each limb is the value at sunrise (the உதய rule, which names the
 * day). `spans` is what the limb actually did — always present from backend
 * v43 onward, and optional here only so an older cached response still parses.
 * Karana carries three of these on most days, which `nextName` alone could
 * never express. */
export interface PanchangamLimbSpan {
  number: number;
  name: string;
  startsAt: string;
  endsAt: string;
  startsAtIso: string;
  endsAtIso: string;
  /** Share of the solar day, 0..1. */
  fraction: number;
}

export interface PanchangamDailyResponseData {
  dateLocal: string;
  tamilDate?: BiText | null;
  location: { lat: number; lng: number; timezone: string };
  sunrise: string;
  sunset: string;
  solarNoon: string;
  vara: { weekday: string; lord: string };
  tithi: {
    number: number; name: string; paksha: "SHUKLA" | "KRISHNA"; endsAt: string; endsAtIso: string;
    nextNumber: number; nextName: string; nextPaksha: "SHUKLA" | "KRISHNA";
    spans?: PanchangamLimbSpan[];
  };
  nakshatra: { name: string; pada: number; endsAt: string; endsAtIso: string; nextName: string; spans?: PanchangamLimbSpan[] };
  yoga: { number: number; name: string; endsAt: string; endsAtIso: string; nextName: string; spans?: PanchangamLimbSpan[] };
  karana: { name: string; endsAt: string; endsAtIso: string; nextName: string; spans?: PanchangamLimbSpan[] };
  kalam: {
    rahuKalam: { start: string; end: string; slot: number };
    yamagandam: { start: string; end: string; slot: number };
    kuligai: { start: string; end: string; slot: number };
    gowriPanchangam?: KalamSlot[];
    nallaNeram: KalamSlot[];
    gowriNallaNeram: KalamSlot[];
  };
  abhijit: { start: string; end: string; isRestrictedByWeekday: boolean };
  subhaMuhurtham: { isSubha: boolean; reason: string; isSubhaStrict: boolean; strictReason: string };
  festivals: PanchangamFestival[];
  hora: Array<{ index: number; lord: string; start: string; end: string }>;
  moonPhaseLabel: string;
  soolam: { direction: string; parigaram: string };
  lagnam: { rasiNumber: number; rasiName: string; endsAt: string; endsAtIso: string; nazhigai: number; vinadi: number };
  nethiram: string;
  jeevan: string;
  /** Nethiram/Jeevan with the boundary they change at. Both derive from the
   *  Moon's star, so they flip at the nakshatra boundary exactly as Nokku does.
   *  Optional only for responses predating backend v43. */
  nethiramJeevan?: {
    nethiram: string; jeevan: string;
    nethiramNext: string; jeevanNext: string;
    endsAt: string; endsAtIso: string;
  } | null;
  amirdhadhiYogam: { name: string; endsAt: string; endsAtIso: string; nextName: string };
  chandrashtamamToday: {
    moonRasiNumber: number; moonRasiName: string;
    affectedJanmaRasiNumber: number; affectedJanmaRasiName: string; nakshatras: string[];
    janmaNakshatraWindows: Array<{ name: string; start: string; end: string }>;
  };
  specialTithiDay?: { tithiNumber: number; name: "POURNAMI" | "AMAVASAI"; moonPhase: "FULL" | "NEW" } | null;
  isKarinaal?: boolean;
}

export type PanchangamTimingsData = Pick<
  PanchangamDailyResponseData,
  "dateLocal" | "location" | "sunrise" | "sunset" | "solarNoon" | "kalam" | "abhijit" | "subhaMuhurtham" | "festivals" | "hora"
>;

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
  isKarinaal?: boolean;
}

export interface PanchangamMonthlyData {
  year: number;
  month: number;
  tamilMonthName?: BiText | null;
  entries: PanchangamMonthDayEntry[];
}

export interface FamilyVaultListItem {
  familyVaultId: string; ownerUserId: string; name: string;
  defaultLanguage: string; memberCount: number; latestAggregateDate: string | null;
}

export interface FamilyVaultListData {
  ownerUserId: string; limit: number; offset: number; totalCount: number;
  items: FamilyVaultListItem[];
}

export interface FamilyVaultDetailData {
  familyVaultId: string; ownerUserId: string; name: string;
  defaultLanguage: string; memberCount: number; latestAggregateDate: string | null;
}

export interface FamilyAggregateMember {
  familyMemberId: string; displayName: string; birthProfileId: string; chartId: string;
  individualScore: number; label: string; memberWeight: number;
  birthTimeConfidenceMinutes: number; activeCycleTags: string[];
  bestWindows: DailyGuidanceWindow[]; cautionWindows: DailyGuidanceWindow[];
}

export interface FamilyAggregateBreakdown {
  weightedMean: number; meanScore: number; lowestScore: number; highestScore: number;
  totalWeight: number; lowScoreCount: number; chandrashtamaCount: number;
  majorSaniCount: number; healthPreventiveNudgeCount: number; supportNeedIndex: number;
  decisionReadinessIndex: number; commonGoodWindowBonus: number;
  rahuYamaOverlapPenalty: number; keyMemberLowScorePenalty: number;
}

export interface FamilyAggregateData {
  familyVaultId: string; dateLocal: string; timezone: string;
  familyScore: number; familyLabel: string;
  members: FamilyAggregateMember[]; aggregateBreakdown: FamilyAggregateBreakdown;
  bestFamilyWindows: DailyGuidanceWindow[]; avoidForFamilyDecisions: DailyGuidanceWindow[];
  summary: BiText;
}

export interface FamilySummaryData {
  familyVaultId: string; dateLocal: string; familyScore: number; familyLabel: string;
  summary: BiText; bestFamilyWindows: DailyGuidanceWindow[]; avoidForFamilyDecisions: DailyGuidanceWindow[];
}

export interface FamilyCalendarItem {
  dateLocal: string; familyScore: number; familyLabel: string;
  bestFamilyWindows: DailyGuidanceWindow[]; avoidForFamilyDecisions: DailyGuidanceWindow[];
  summary: BiText;
}

export interface FamilyCalendarData {
  familyVaultId: string; fromDate: string; toDate: string; items: FamilyCalendarItem[];
}

export interface FamilyMemberData {
  familyMemberId: string; familyVaultId: string; ownerUserId: string; displayName: string;
  relationshipToOwner: string; memberWeight: number; genderForTraditionalRules: string;
  dateOfBirthLocal: string | null; isMinor: boolean; birthProfileId: string | null;
  maritalStatus: string | null; employmentType: string | null;
}

export interface FamilyMemberListData {
  familyVaultId: string; totalCount: number; items: FamilyMemberData[];
}

export interface CompositeMemberScore {
  familyMemberId: string; displayName: string; individualScore: number;
  label: string; activeCycleTags: string[];
}

export interface CompositeTimelineItem {
  dateLocal: string; familyScore: number; familyLabel: string;
  members: CompositeMemberScore[]; supportNeedIndex: number; decisionReadinessIndex: number;
}

export interface FamilyCompositeTimelineData {
  familyVaultId: string; fromDate: string; toDate: string; items: CompositeTimelineItem[];
}

export interface FamilyVaultJournalEntryData {
  journalId: string; familyVaultId: string; familyMemberId: string; memberDisplayName: string;
  birthProfileId: string; chartId: string; entryDate: string; lifeArea: string;
  noteText: string; tags: string[]; createdAt: string; deletedAt: string | null;
}

export interface FamilyVaultJournalData {
  familyVaultId: string; includeArchived: boolean; totalCount: number;
  items: FamilyVaultJournalEntryData[];
}

export interface FamilyVaultJournalLifeAreaCount { lifeArea: string; count: number }

export interface FamilyVaultJournalSummaryData {
  familyVaultId: string; includeArchived: boolean; fromDate: string | null; toDate: string | null;
  totalEntries: number; lifeAreaCounts: FamilyVaultJournalLifeAreaCount[];
}

export interface GoalData {
  goalId: string; chartId: string; goalType: string; description: string | null;
  isActive: boolean; languagePreference: string; createdAt: string;
}

export interface GoalListData { chartId: string; goals: GoalData[] }

export interface TripleConfirmation {
  natalPromise: string; natalPromiseStrength: "STRONG" | "MODERATE" | "WEAK";
  dashaSupport: string; dashaSupportStrength: "STRONG" | "MODERATE" | "WEAK";
  gocharSupport: string; gocharSupportStrength: "STRONG" | "MODERATE" | "WEAK";
  overallVerdict: "FAVOURABLE" | "NEUTRAL" | "CAUTION";
}

/**
 * Ordinal reasoning band (reasoning kernel Phase 1).
 * BLOCKED = the chart actively denies; SILENT = the chart is quiet
 * (insufficient signal) — deliberately not the same as "no".
 */
export type ReasoningBand = "STRONG" | "LIKELY" | "MIXED" | "WEAK" | "BLOCKED" | "SILENT";

/**
 * Contradiction reading (reasoning kernel Phase 3, D4): why the promise
 * gate and the timing vote agree or disagree. PROMISED_NOT_NOW = wait
 * (the window opens later); ACTIVE_BUT_UNPROMISED = redirect the period's
 * energy elsewhere (gate SILENT, no promise signal at all);
 * PARTIALLY_PROMISED = active period with partial support, not a full
 * promise (gate WEAK — distinct from ACTIVE_BUT_UNPROMISED per §15.2
 * Option B, 2026-07-13); NOT_PROMISED = the chart does not indicate this.
 */
export type ReasoningReading =
  | "PROMISED_AND_TIMED"
  | "PROMISED_NOT_NOW"
  | "ACTIVE_BUT_UNPROMISED"
  | "PARTIALLY_PROMISED"
  | "NOT_PROMISED"
  | "MIXED"
  | "SILENT";

export interface WhatIfData {
  chartId: string; scenario: string; targetDate: string; overallScore: number;
  verdict: "FAVOURABLE" | "NEUTRAL" | "CAUTION";
  /** Additive — present only when the reasoning_gate flag is on. */
  band?: ReasoningBand | null;
  /** Additive — present only when the reasoning_contradiction flag is on. */
  reading?: ReasoningReading | null;
  tripleConfirmation: TripleConfirmation;
  summary: BiText; bestPeriodInWindow: BiText; cautionNote: BiText;
  remedy: BiText; disclaimer: BiText;
  /** Additive — present only when the reasoning_chart_signature flag is on (Phase 5). */
  chartSignature?: ChartSignatureData | null;
  /** Additive — populated only for non-FAVOURABLE verdicts (Phase 5). */
  causalChain?: BiText | null;
}

export interface RetrospectivePlanetarySnapshot {
  planet: string; houseFromMoon: number; houseFromLagna: number; notableAspect: string | null;
}

export interface RetrospectiveFutureRecurrence {
  approximateDate: string; signatureDescription: string; intensity: "similar" | "milder" | "stronger";
}

export interface RetrospectiveData {
  retrospectiveId: string; chartId: string; eventDate: string;
  eventDescription: string; eventType: string; activeDasha: string;
  keyTransits: RetrospectivePlanetarySnapshot[];
  correlationExplanation: BiText; futureRecurrences: RetrospectiveFutureRecurrence[];
  caution: BiText; createdAt: string;
}

export interface RetrospectiveListData { chartId: string; items: RetrospectiveData[] }

export interface DecisionOptionAnalysis {
  label: string; score: number; alignmentNotes: string[];
  riskFactors: string[]; optimalWindow: string | null;
}

export interface DecisionBriefData {
  chartId: string; targetDate: string; scenarioUsed: string;
  optionA: DecisionOptionAnalysis; optionB: DecisionOptionAnalysis;
  recommended: "A" | "B" | "DEFER"; confidence: number;
  reasoning: BiText; caution: BiText | null;
}

export type NakshatraCardData = {
  number: number; nameTa: string; nameEn: string; deityTa: string; deityEn: string;
  symbolTa: string; symbolEn: string; rulingPlanet: string;
  profile: BiText; strengths: BiText[]; cautions: BiText[]; compatibleGroups: string[];
  ganam: BiText; yoni: BiText;
};

export type NotificationPreferenceData = {
  notification_channel: "none" | "email" | "push" | "both";
  morningAlertEnabled: boolean; morningAlertTime: string; dashaAlertEnabled: boolean;
  piranthaNaalAlertEnabled: boolean; smartSilenceEnabled: boolean; fcmTokenRegistered: boolean;
};

export type NotificationInboxItem = {
  notification_id: string; type: string; title: string; body: string;
  status: string; send_at: string; read_at: string | null;
};

export type NotificationInboxResponse = {
  success: boolean; data: NotificationInboxItem[]; unread_count: number;
};

export type PeyarchiReportData = {
  chartId: string; planet: string;
  events: {
    planet: string; fromRasi: number; toRasi: number; transitDate: string;
    houseFromMoon: number; houseFromLagna: number; outlookTa: string; outlookEn: string;
  }[];
};

export type WeekAheadDayItem = {
  dateLocal: string; score: number; label: string;
  nakshatraNumber: number; tithiNumber: number; isChandrashtama: boolean;
  specialTithi: string | null; bestWindowStart: string | null;
};

export type WeekAheadData = {
  profileId: string; chartId: string; weekStart: string; weekEnd: string;
  bestDay: string; bestDayScore: number; chandrashtamaDays: string[];
  specialTithiDays: string[]; dashaThemeTa: string; dashaThemeEn: string;
  days: WeekAheadDayItem[];
};

export type ActivityTimingDayResult = {
  dateLocal: string; score: number; label: string; alignment: string;
  reasonTa: string; reasonEn: string;
  /** Compact named cause ("Navami — rikta tithi") for chip-sized UI. */
  shortReasonTa?: string | null; shortReasonEn?: string | null;
};

export type ActivityTimingData = {
  chartId: string; activity: string; month: string;
  topDates: ActivityTimingDayResult[];
  /** The first three chronological SUPPORTS dates after the requested asOf date. */
  nextFavourableDates?: string[];
  dateResult: ActivityTimingDayResult | null;
  /** Panchangam location used to rank this month's dates. */
  dailyLocation?: { latitude: number; longitude: number; timezone: string; source: "current" | "birth" } | null;
};

export type DashaStoryData = {
  chartId: string; openingLord: string;
  periods: {
    lord: string; startDate: string; endDate: string;
    ageStart: number; ageEnd: number; themeTa: string; themeEn: string; isCurrent: boolean;
  }[];
};

export interface PredictionAstroFactor {
  key: string; status: "SUPPORT" | "CAUTION" | "NEUTRAL"; detail: BiText;
}

export interface LifeAreaPredictionData {
  lifeArea: string; mainPredictionTa: string; mainPredictionEn: string;
  astrologicalFactors: PredictionAstroFactor[];
  dashaSupport: "STRONG" | "PARTIAL" | "WEAK"; transitSupport: "STRONG" | "PARTIAL" | "WEAK";
  timingWindowStart: string | null; timingWindowEnd: string | null;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  /** Additive ordinal band — present only when the reasoning_gate flag is on. */
  band?: ReasoningBand | null;
  challenges: BiText[]; supports: BiText[];
  /** Additive — present only when the reasoning_chart_signature flag is on
   *  (Phase 5, P0-4). Currently only populated by the marriage prediction. */
  chartSignature?: ChartSignatureData | null;
  causalChain?: BiText | null;
}

export interface LifeAreaPredictionResponse {
  success: boolean; data: LifeAreaPredictionData;
  ageGated?: boolean; alternativeFraming?: string | null;
}

export type LifeMode =
  | "STUDY" | "CAREER" | "LOVE" | "MARRIAGE" | "FAMILY"
  | "WEALTH" | "HEALTH" | "SPIRITUALITY" | "REMEDIES" | "BALANCED";

export interface LifeModeStatus {
  mode: LifeMode; lifeModeSetAt: string | null;
  showLifeModePicker: boolean; blockedModes?: string[];
}

export interface PredictionBundle {
  marriage: LifeAreaPredictionData | null; career: LifeAreaPredictionData | null;
  wealth: LifeAreaPredictionData | null; health: LifeAreaPredictionData | null;
}

export interface JadhagamReportBirthProfile {
  displayName: string; birthDateLocal: string; birthTimeLocal: string;
  birthPlace: string; birthTimezone: string; currentAge: number;
}

export interface JadhagamReportCoreIdentity {
  lagnaRasi: string; moonRasi: string; janmaNakshatra: string; janmaPada: number;
  currentMahadasha: string; currentAntardasha: string;
}

export interface JadhagamReportNavamsaSummary {
  d9ByPlanet: Record<string, number>; vargottamaPlanets: string[];
}

export interface JadhagamReportPlanetStrengthItem { planet: string; score: number }

export interface JadhagamReportPlanetStrengthSummary {
  strong: JadhagamReportPlanetStrengthItem[];
  moderate: JadhagamReportPlanetStrengthItem[];
  weak: JadhagamReportPlanetStrengthItem[];
}

export interface JadhagamReportData {
  chartId: string; birthProfile: JadhagamReportBirthProfile;
  coreIdentity: JadhagamReportCoreIdentity;
  navamsamSummary: JadhagamReportNavamsaSummary;
  functionalNatureTable: Record<string, string>;
  adhipathiReport?: AdhipathiReading[];
  yogaDoshamSummary: { yogas: ChartYogaInsight[]; doshams: ChartDoshamInsight[] };
  planetaryStrengthSummary: JadhagamReportPlanetStrengthSummary;
  dashaAnalysis: { currentMahadasha: string; currentAntardasha: string };
  lifeAreaPredictions: Array<{ area: string; status: string }>;
  ageWiseTimeline: { currentAge: number; activeFocusAreas: string[] };
  primaryConcerns: Array<{ concern: string; confidence: string; rationaleEn: string; rationaleTa: string }>;
  currentYearGuidance: BiText; practicalGuidance: { ta: string[]; en: string[] };
  optionalRemedies: { ta: string[]; en: string[] }; executiveSummary: BiText;
}

export interface JadhagamReportResponse { success: boolean; data: JadhagamReportData }

export type JournalAnchorData = {
  activeDasha: string; moonHouseFromMoon: number; saturnHouseFromMoon: number;
  moonRasi: string; saturnRasi: string;
};

export type JournalEntryData = {
  journalId: string; chartId: string; entryDate: string; lifeArea: string;
  noteText: string; tags: string[]; anchor: JournalAnchorData; createdAt: string;
};

export type JournalListData = { chartId: string; totalCount: number; items: JournalEntryData[] };

export type JournalPromptItem = { promptId: string; category: string; text: BiText };

export type JournalPromptsData = {
  chartId: string; dateLocal: string; lifeArea: string; scoreLabel: string;
  prompts: JournalPromptItem[];
};

export type ContextEvent = { type: string; date: string; note: string | null };

export type ContextData = {
  contextId: string; ownerUserId: string; chartId: string;
  lifeSituation: Record<string, unknown>; activeEvents: ContextEvent[];
  reactionHistory: unknown[]; updatedAt: string;
};

export type JournalCorrelationData = {
  chartId: string; entryCount: number; lookbackDays: number;
  hasSufficientData: boolean; minimumEntriesRequired: number;
  correlations: {
    condition: string; sampleCount: number; avgMood: number;
    descriptionTa: string; descriptionEn: string;
  }[];
};

export interface SynastryAspect {
  planet1: string; planet2: string; aspectType: string; orb: number;
  tone: "supportive" | "challenging" | "neutral"; descriptionTa: string; descriptionEn: string;
}

export interface SynastryData {
  memberId: string; memberName: string; ownerChartId: string; memberChartId: string;
  compatibilityScore: number; compatibilityLabel: string;
  aspects: SynastryAspect[];
  timingIndicators: { planet: string; description: BiText }[];
  summary: BiText; caution: BiText | null;
}

export interface KutaResult { name: string; nameTa: string; passed: boolean; score: number; maxScore: number; label: string; detail?: string | null }

export interface PorutthamData {
  familyVaultId: string; memberId: string;
  boyNakshatra: number; boyNakshatraName: string;
  girlNakshatra: number; girlNakshatraName: string;
  kutas: KutaResult[]; totalScore: number; maxScore: number; percentage: number; label: string;
  rajjuDosha: boolean; vedhaDosha: boolean; summary: BiText;
  compatibilityContext: string; contextNote: BiText | null;
}

export interface DirectPoruthamData {
  chartIdA: string; chartIdB: string;
  boyNakshatra: number; boyNakshatraName: string;
  girlNakshatra: number; girlNakshatraName: string;
  kutas: KutaResult[]; totalScore: number; maxScore: number; percentage: number; label: string;
  rajjuDosha: boolean; vedhaDosha: boolean; summary: BiText;
  compatibilityContext: string; contextNote: BiText | null;
}

// Porutham computed from nakshatra numbers alone (no birth chart) — powers
// the public marriage-porutham-calculator and mobile porutham/friendship tools.
export interface PublicPoruthamStarData {
  boyNakshatra: number; girlNakshatra: number;
  kutas: KutaResult[]; totalScore: number; maxScore: number; percentage: number; label: string;
  rajjuDosha: boolean; vedhaDosha: boolean; nadiDosha: NadiDoshaResult;
  summary: BiText; compatibilityContext: string;
}

// One row of a full 1-vs-27 nakshatra grid comparison (see getPoruthamGrid).
export interface PublicPoruthamGridItem {
  boyNakshatra: number; totalScore: number; maxScore: number; percentage: number; label: string;
  rajjuDosha: boolean; vedhaDosha: boolean; nadiCaution: boolean;
}

export interface SevvaiDoshamDetail {
  hasDosham: boolean; marsHouse: number; isCancelled: boolean; severity: string;
  cancellationReasons: string[]; noteEn: string; noteTa: string; score: number;
}

export interface ChartMarriageStrength {
  seventhHouseRasi: number; seventhLord: string; seventhLordHouse: number;
  seventhLordStrength: number; venusHouse: number; venusStrength: number;
  jupiterHouse: number; jupiterStrength: number; hasMaleficInSeventh: boolean;
  score: number; noteEn: string; noteTa: string;
}

export interface NavamsaCompatibility {
  personAVenusD9: number; personBVenusD9: number;
  personASeventhLordD9: number; personBSeventhLordD9: number;
  harmonyLabel: string; noteEn: string; noteTa: string; score: number;
}

export interface DashaHarmony {
  personAMahaLord: string; personAantarLord: string; personAMahaEnd: string;
  personBMahaLord: string; personBAntarLord: string; personBMahaEnd: string;
  harmonyLabel: string; noteEn: string; noteTa: string; score: number;
}

// Rasi/Nakshatra/Lagnam identity facts for one person in a compatibility
// report — the plain-language facts a non-astrologer needs alongside the
// score breakdowns (2026-07 porutham UX gap).
export interface PersonAstroIdentity {
  rasi: number; rasiName: string;
  nakshatra: number; nakshatraName: string; pada: number;
  lagnaRasi: number; lagnaRasiName: string;
}

export interface EmotionalCompatibility {
  moonMoonHarmony: string; venusMarsHarmony: string; communicationNote: string;
  noteEn: string; noteTa: string; score: number;
}

export interface CompatibilityScoreBreakdown {
  porutham: number; seventhHouse: number; navamsa: number; dashaHarmony: number;
  doshamAnalysis: number; emotional: number; synastry: number;
}

export interface NadiDoshaResult {
  boyNadi: string; girlNadi: string; hasNadiDosha: boolean;
  cancellations: string[]; severity: string;
  // A-9 v2 (2026-07-14): internal mitigation tier, active parihara mode, and
  // a Rajju-guard warning (non-null only when Rajju fails). Additive/optional
  // — no consumer renders these yet.
  mitigation?: string; nadiPariharaMode?: string; rajjuGuardWarning?: string | null;
  noteTa: string; noteEn: string;
}

export interface CompatibilityIntelligenceData {
  personAName: string; personBName: string;
  personAIdentity: PersonAstroIdentity; personBIdentity: PersonAstroIdentity;
  poruthamScore: number; poruthamMax: number; poruthamPercentage: number; poruthamLabel: string;
  poruthamKutas: KutaResult[]; rajjuDosha: boolean; vedhaDosha: boolean;
  nadiDosha: NadiDoshaResult; chartAStrength: ChartMarriageStrength; chartBStrength: ChartMarriageStrength;
  navamsa: NavamsaCompatibility; sevvaiA: SevvaiDoshamDetail; sevvaiB: SevvaiDoshamDetail;
  dashaHarmony: DashaHarmony; emotional: EmotionalCompatibility;
  synastryScore: number; overallScore: number; overallLabel: string;
  scoreBreakdown: CompatibilityScoreBreakdown;
  strengthsEn: string[]; strengthsTa: string[]; risksEn: string[]; risksTa: string[];
  summary: BiText;
}

export interface RelationshipAlertItem {
  alertId: string; memberId: string; memberName: string; significanceScore: number;
  triggerPlanet: string; eventDate: string; daysFromToday: number; title: BiText; message: BiText;
}

export interface RelationshipAlertsData { familyVaultId: string; items: RelationshipAlertItem[] }

export type ShareCardType = "DAILY_VIBE" | "DASHA_ERA" | "NAKSHATRA";

export interface ShareCardData {
  cardType: ShareCardType; chartId: string; dateLocal: string;
  score?: number; scoreLabel?: string; scoreBand?: "high" | "good" | "neutral" | "caution";
  headline?: BiText; subHeadline?: BiText; bestWindow?: string;
  mahaLord?: string; mahaLordPlain?: BiText; eraLabel?: BiText; eraYears?: string;
  nakshatraNameTa?: string; nakshatraNameEn?: string; nakshatraTrait?: BiText; rulingPlanet?: string;
}

export interface RetrospectiveCreatePayload {
  chartId: string; eventDate: string; eventDescription: string; eventType: string;
}

export interface DecisionBriefPayload {
  chartId: string;
  optionA: { label: string; description: string };
  optionB: { label: string; description: string };
  priority?: "career" | "family" | "health" | "relationship" | "education" | "money" | "spiritual";
  targetDate?: string;
}

export interface WrappedSlide {
  slideId: string;
  slideType: "OVERVIEW" | "DASHA_ERA" | "PEAK" | "STATS" | "REFLECTION" | "LIFE_AREA" | "CLOSING";
  headline: BiText; body: BiText; accentColor: string; stat: string | null;
}

export interface AnnualWrappedData {
  chartId: string; year: number; slides: WrappedSlide[];
  totalDaysScored: number; peakScore: number; peakDate: string | null;
  valleyScore: number; valleyDate: string | null;
  dominantDashaLord: string; highDays: number; cautionDays: number;
  averageScore: number; topLifeArea: string | null;
}

export interface TajakaPlanetPosition { planet: string; rasi: number; rasiName: string; house: number; longitude: number }

// Matches the backend TajakaAspect schema exactly: pair is a hyphen-joined
// "PLANET1-PLANET2" string (see tajaka.py _detect_itthasala/_detect_isarafa),
// kind is "ITTHASALA" or "ISARAFA". No orb value is computed (Doctrine §9 —
// this is the "Simplified" same-rasi +-5deg approximation, not real Tajika).
export interface TajakaAspect { pair: string; kind: string }

export interface VarshaphalaAreaOutlook {
  area: string; score: number; narrativeTa: string; narrativeEn: string; favourableMonths: number[];
}

export interface VarshaphalaData {
  year: number; solarReturnDate: string; solarReturnLagnaRasi: number;
  solarReturnLagnaName: string; munthaRasi: number; munthaRasiName: string;
  munthaHouseFromSrLagna: number; yearLord: string; yearLordHouse: number;
  tajakaPlanets: TajakaPlanetPosition[]; itthasalaPairs: TajakaAspect[];
  isarafaPairs: TajakaAspect[]; areaOutlook: VarshaphalaAreaOutlook[];
}

export interface RemedyPlanItem {
  planet: string; priority: number; reason: string; day: string;
  templeTa: string; templeEn: string; mantraFullTa: string; japaCount: number;
  daanumItemsTa: string; daanumItemsEn: string;
  gemstoneTa: string | null; gemstoneEn: string | null;
  fastingRuleTa: string; fastingRuleEn: string;
  behaviouralTa: string; behaviouralEn: string; sevaTa: string; sevaEn: string;
}

export interface GemstoneAdviceItem {
  planet: string; functionalNature: string; isGemstonePrescribed: boolean;
  gemstoneNameTa: string | null; gemstoneNameEn: string | null;
  reasonTa: string; reasonEn: string; cautionTa: string | null; cautionEn: string | null;
}

export interface PrasnaResponse {
  prasnaLagnaRasi: number; prasnaLagnaName: string; moonRasi: number;
  moonNakshatraName: string; questionArea: string; karaka: string; karakaHouse: number;
  outlook: "FAVOURABLE" | "UNFAVOURABLE" | "MIXED" | "DELAY";
  outlookTa: string; outlookEn: string;
  positiveIndicators: string[]; negativeIndicators: string[];
  cautionTa: string; cautionEn: string;
}

export type QACaseResult = {
  test_id: string; description: string; passed: boolean;
  expected: unknown; actual: unknown; detail: string | null;
};

export type QAModuleResult = { module: string; passed: number; failed: number; cases: QACaseResult[] };

export type QAValidationResponse = {
  total_passed: number; total_failed: number; modules: QAModuleResult[]; run_at: string;
};

export type QAFailureRecord = {
  test_id: string; module: string; description: string;
  expected: unknown; actual: unknown; detail: string | null;
  first_seen: string; last_seen: string; occurrences: number;
};

export type QARegressionReport = { total_stored: number; failures: QAFailureRecord[] };

export interface FamilyMemberTodayScore {
  memberId: string;
  profileId: string;
  chartId: string;
  displayName: string;
  relationship: string;
  score: number;
  label: string;
  highlightTa: string;
  highlightEn: string;
  chandrashtama: boolean;
  saniCycleActive: boolean;
  saniCycleType: string | null;
  nallaNeramStart: string;
  rahuKalamStart: string;
  rahuKalamEnd: string;
}

export interface FamilyVaultTodayData {
  vaultId: string;
  dateLocal: string;
  members: FamilyMemberTodayScore[];
}
