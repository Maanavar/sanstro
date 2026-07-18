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
// GET /charts/{id}/muhurta (app/api/muhurta.py). chartId is a real chart UUID in
// the path — the old wrapper sent it as a query param and passed the literal
// string "public", which the route would reject even if the path existed.

export interface MuhurtaPayload {
  chartId: string;
  activity: string;
  dateFrom: string;
  dateTo: string;
}

export function getMuhurta(
  params: MuhurtaPayload,
): Promise<{ success: boolean; data: MuhurtaResponseData }> {
  return getApiClient().get(
    `/charts/${encodeURIComponent(params.chartId)}/muhurta`,
    {
      activity: params.activity,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    },
  ) as Promise<{ success: boolean; data: MuhurtaResponseData }>;
}
