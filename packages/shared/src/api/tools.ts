import { getApiClient } from "./client";
import { getChartFull } from "./charts";
import type {
  ChartDoshamInsight,
  ChartYogaInsight,
  MuhurtaResponseData,
  PrasnaResponse,
} from "../types";

/*
 * These wrappers previously targeted an older backend URL scheme
 * (`/public-tools/*`, `prashan`, a top-level `/muhurta`) that no route has
 * served for a long time, so every mobile screen using them hard-404ed. They are
 * now pointed at the real routes, with the response types the backend actually
 * returns. See docs/WEB_MOBILE_PARITY_AUDIT_2026-07-17.md §2a, and
 * tests/test_api_wrapper_route_contract.py which now fails if they drift again.
 */

// ─── Nakshatra content ────────────────────────────────────────────────────────
// GET /content/nakshatra/{n} (app/api/content.py)

export interface NakshatraBiText {
  ta: string;
  en: string;
}

/** Serialised without aliases by the backend, hence snake_case. */
export interface NakshatraCompatGroup {
  nakshatra_code: string;
  nakshatra_name_ta: string;
  nakshatra_name_en: string;
  porutham_basis: string;
}

export interface NakshatraCard {
  number: number;
  nameTa: string;
  nameEn: string;
  deityTa: string;
  deityEn: string;
  symbolTa: string;
  symbolEn: string;
  rulingPlanet: string;
  profile: NakshatraBiText;
  strengths: NakshatraBiText[];
  cautions: NakshatraBiText[];
  compatibleGroups: string[];
  compatibleGroupsRich: NakshatraCompatGroup[];
  ganam: NakshatraBiText;
  yoni: NakshatraBiText;
}

export function getNatchathiram(
  nakshatraNumber: number,
): Promise<{ success: boolean; data: NakshatraCard }> {
  return getApiClient().get(
    `/content/nakshatra/${encodeURIComponent(nakshatraNumber)}`,
  ) as Promise<{ success: boolean; data: NakshatraCard }>;
}

// ─── Dosham / Yogam ───────────────────────────────────────────────────────────
// There is no `/charts/{id}/dosham` or `/charts/{id}/yogam` route. Both live on
// the full chart payload, which is where web reads them from too — so these read
// the chart rather than inventing new backend surface.

export function getDosham(
  chartId: string,
): Promise<{ success: boolean; data: ChartDoshamInsight[] }> {
  return getChartFull(chartId).then((res) => ({
    success: res.success,
    data: res.data?.doshams ?? [],
  }));
}

export function getYogam(
  chartId: string,
): Promise<{ success: boolean; data: ChartYogaInsight[] }> {
  return getChartFull(chartId).then((res) => ({
    success: res.success,
    data: res.data?.yogas ?? [],
  }));
}

// ─── Pariharam (remedies) ─────────────────────────────────────────────────────
// GET /charts/{id}/remedy-plan (app/api/remedies.py). The route returns a plain
// dict, so the rows keep the calculation layer's snake_case keys.

export interface RemedyDisclaimer {
  fasting_caution_ta: string;
  fasting_caution_en: string;
  guarantee_note_ta: string;
  guarantee_note_en: string;
}

export interface RemedyItem {
  planet: string;
  day: string;
  temple_ta: string;
  temple_en: string;
  mantra_seed: string;
  mantra_full_ta: string;
  japa_count: number;
  daanam_items_ta: string;
  daanam_items_en: string;
  gemstone_ta: string | null;
  gemstone_en: string | null;
  metal: string;
  finger: string;
  fasting_rule_ta: string;
  fasting_rule_en: string;
  behavioural_ta: string;
  behavioural_en: string;
  seva_ta: string;
  seva_en: string;
  functional_nature: string;
  severity: string;
  is_gemstone_prescribed: boolean;
  reason_ta: string;
  reason_en: string;
  caution_ta: string;
  caution_en: string;
  fasting_caution_ta: string;
  fasting_caution_en: string;
  priority: number;
}

export interface RemedyPlanData {
  chartId: string;
  currentMahaLord: string;
  weakestPlanets: string[];
  activeDoshamPlanet: string | null;
  items: RemedyItem[];
  disclaimer: RemedyDisclaimer;
}

export function getPariharam(
  chartId: string,
): Promise<{ success: boolean; data: RemedyPlanData }> {
  return getApiClient().get(
    `/charts/${encodeURIComponent(chartId)}/remedy-plan`,
  ) as Promise<{ success: boolean; data: RemedyPlanData }>;
}

// ─── Prasna (horary) ──────────────────────────────────────────────────────────
// POST /prasna (app/api/prasna.py). Note this route responds with the payload
// FLAT — there is no { success, data } envelope.

export type PrasnaOutlook = PrasnaResponse["outlook"];

/**
 * The engine reads the sky at the moment the question is asked; it does not
 * interpret free text. Callers pick a question *area* instead.
 */
export const PRASNA_QUESTION_AREAS = [
  "JOB",
  "MARRIAGE",
  "HEALTH",
  "FINANCE",
  "PROPERTY",
  "TRAVEL",
  "LEGAL",
  "CHILDREN",
  "GENERAL",
] as const;

export type PrasnaQuestionArea = (typeof PRASNA_QUESTION_AREAS)[number];

export interface PrasnaPayload {
  questionArea: PrasnaQuestionArea | string;
  timezoneName: string;
  latitude: number;
  longitude: number;
  /** Local ISO datetime; when omitted the server uses the current instant
   *  (interpreted in `timezoneName`, not the server's own clock). */
  questionDateTimeLocal?: string;
}

export type { PrasnaResponse };

export function askPrasna(payload: PrasnaPayload): Promise<PrasnaResponse> {
  return getApiClient().post("/prasna", payload) as Promise<PrasnaResponse>;
}

// ─── Muhurta ──────────────────────────────────────────────────────────────────
// GET /charts/{id}/muhurta or /muhurta (app/api/muhurta.py). A supplied chartId
// stays in the legacy path for compatibility; without one, /muhurta is the
// location-aware general mode. Never send the old literal "public" chart id.

export interface MuhurtaPayload {
  chartId?: string | null;
  activity: string;
  dateFrom: string;
  dateTo: string;
  lat?: number;
  lon?: number;
  tz?: string;
  /**
   * Display label for the activity location. Ignored by the backend unless
   * lat/lon/tz are all supplied, so it can never mislabel a profile-located
   * reading. Without it the response echoes "Selected activity location".
   */
  place?: string;
  /** Restrict results to Valarpirai (SHUKLA) or Theipirai (KRISHNA). */
  paksha?: "SHUKLA" | "KRISHNA";
  /** Return the selected day's veto factors instead of silently omitting it. */
  includeExcluded?: boolean;
}

export function getMuhurta(
  params: MuhurtaPayload,
): Promise<{ success: boolean; data: MuhurtaResponseData }> {
  const query: Record<string, string | number> = {
    activity: params.activity,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  };
  if (params.lat !== undefined) query.lat = params.lat;
  if (params.lon !== undefined) query.lon = params.lon;
  if (params.tz !== undefined) query.tz = params.tz;
  if (params.place !== undefined) query.place = params.place;
  if (params.paksha !== undefined) query.paksha = params.paksha;
  if (params.includeExcluded) query.includeExcluded = "true";
  return getApiClient().get(
    params.chartId ? `/charts/${encodeURIComponent(params.chartId)}/muhurta` : "/muhurta",
    query,
  ) as Promise<{ success: boolean; data: MuhurtaResponseData }>;
}

/** A transient birth profile used only for a no-save personalised muhurta run. */
export interface PersonalizedMuhurtaBirthInput {
  displayName?: string;
  birthDateLocal: string;
  birthTimeLocal: string;
  birthLatitude: number;
  birthLongitude: number;
  birthTimezone: string;
  birthPlace: string;
}

export interface PersonalizedMuhurtaPayload {
  birth: PersonalizedMuhurtaBirthInput;
  eventType: string;
  dateFrom: string;
  dateTo: string;
  lat: number;
  lng: number;
  timezone: string;
  place: string;
  includeExcluded?: boolean;
}

/** POST /public/muhurta/personalized (app/api/public_tools.py).
 * The supplied birth details are calculated in memory and never persisted. */
export function getPersonalizedMuhurta(
  payload: PersonalizedMuhurtaPayload,
): Promise<{ success: boolean; data: MuhurtaResponseData }> {
  return getApiClient().post(
    "/public/muhurta/personalized",
    payload,
  ) as Promise<{ success: boolean; data: MuhurtaResponseData }>;
}
