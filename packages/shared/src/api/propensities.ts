import { getApiClient } from "./client";

/**
 * "Chances & Cautions" — life-propensity insights. Additive, read-only,
 * gated behind the `propensity_insights` feature flag (returns 404 when off).
 * Backend: GET /charts/{id}/propensities (app/api/predictions.py →
 * app/services/propensity_service.py). Verified against the route decorator:
 * chart id is a PATH param, `asOf` an optional query param, verb GET.
 */
export interface PropensityBiText {
  ta: string;
  en: string;
}

export interface PropensityFactor {
  key: string;
  /** SUPPORT | CAUTION | NEUTRAL */
  status: string;
  detail: PropensityBiText;
}

/**
 * CHANCE = positive leaning; CAUTION = a be-mindful season; PROFILE = a
 * single descriptive synthesis card (Swabhava) with no pro/con grading.
 */
export type PropensityTier = "CHANCE" | "CAUTION" | "PROFILE";

export type PropensityCategory =
  | "RELATIONSHIPS"
  | "EDUCATION"
  | "CAREER"
  | "WELLBEING"
  | "MARRIAGE"
  | "WEALTH"
  | "LIFE_PATH";

export interface PropensityCard {
  key: string;
  category: PropensityCategory;
  tier: PropensityTier;
  title: PropensityBiText;
  /**
   * Ordinal level (never a percentage). CHANCE: STRONG | PROMISING | MIXED |
   * LIMITED | QUIET. CAUTION: STEADY | WATCHFUL | EXTRA_CARE | QUIET.
   * career_mode is directional: ENTERPRISE_LEANING | SALARIED_LEANING |
   * BALANCED | QUIET. PROFILE (swabhava_profile only): always "PROFILE".
   */
  level: string;
  summary: PropensityBiText;
  factors: PropensityFactor[];
  whatHelps: PropensityBiText[];
  windowNote: PropensityBiText | null;
  /**
   * Phase 2 — concrete ISO dates (YYYY-MM-DD) for windowNote, narrowed from
   * the currently running antardasha by a gochara + Sarvashtakavarga-bindu
   * gate. Both are non-null only when windowNote also fired.
   */
  timingWindowStart: string | null;
  timingWindowEnd: string | null;
  disclaimer: PropensityBiText | null;
  showSupportResources: boolean;
  deferred: boolean;
  deferredReason: PropensityBiText | null;
  /** Internal reasoning band — do not render as a percentage. */
  band: string | null;
}

export interface PropensityBundle {
  success: boolean;
  generatedFor: string;
  lifeStage: string;
  results: PropensityCard[];
}

export const propensityKeys = {
  chart: (chartId: string) => ["propensities", chartId] as const,
};

export function getPropensities(
  chartId: string,
  asOf?: string,
): Promise<PropensityBundle> {
  const query = asOf ? `?asOf=${encodeURIComponent(asOf)}` : "";
  return getApiClient().get(
    `/charts/${encodeURIComponent(chartId)}/propensities${query}`,
  ) as Promise<PropensityBundle>;
}
