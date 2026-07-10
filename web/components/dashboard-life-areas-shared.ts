// Shared Life-Areas utilities extracted from the (now-deleted) Classic
// dashboard-life-areas-tab.tsx and dashboard-prediction-panel.tsx during the
// Nova-only migration (docs/NOVA_ONLY_MIGRATION_PLAN.md Phase 3b). Pure
// age-relevance gate + prediction tone/label helpers, no Classic/Nova fork.

import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { SCORE_HIGH, SCORE_MID, SCORE_LOW } from "@/lib/format";
import type { LifeAreaPredictionData } from "@/lib/types";

// Areas that are always relevant once a person is 18+ (health is always relevant)
const ALWAYS_ON_AFTER_18 = new Set(["HEALTH", "SPIRITUAL", "MONEY", "CAREER"]);

// Areas that unlock when the person is married
const MARRIAGE_AREAS = new Set(["FAMILY_HARMONY", "CHILDREN"]);

export function isAreaRelevantForAge(areaKey: string, age: number, maritalStatus?: string): boolean {
  const isMarried = maritalStatus === "married" || maritalStatus === "widowed" || maritalStatus === "divorced";

  // Health is relevant at every age
  if (areaKey === "HEALTH") return true;

  // Under 12: only health, education, family basics
  if (age < 12) return areaKey === "EDUCATION" || areaKey === "FAMILY_HARMONY";

  // 12-17: education + health
  if (age < 18) return areaKey === "EDUCATION";

  // 18+: most areas are relevant
  if (ALWAYS_ON_AFTER_18.has(areaKey)) return true;

  // Education stays relevant until 30
  if (areaKey === "EDUCATION") return age < 30;

  // Relationships (dating/marriage prospects) relevant from 18 onwards
  if (areaKey === "RELATIONSHIPS") return true;

  // Property, foreign travel, litigation relevant from 25 onwards
  if (areaKey === "PROPERTY" || areaKey === "FOREIGN" || areaKey === "LITIGATION") return age >= 25;

  // Family harmony and children unlock for married/divorced/widowed persons at any age 18+,
  // or for unmarried persons 35+ (may still be relevant)
  if (MARRIAGE_AREAS.has(areaKey)) return isMarried || age >= 35;

  return true;
}

// ── Prediction tone/label helpers (shared by Classic PredictionDetailPanel and
//    Nova's Life-Areas predictions panel) ──
export function confidenceTone(confidence: string) {
  if (confidence === "HIGH") return { bg: "var(--chart-d9-active-bg)", border: "var(--cl-sage-border)", text: SCORE_HIGH };
  if (confidence === "LOW") return { bg: "var(--panel-warm-tint)", border: "var(--cl-rust-35)", text: SCORE_LOW };
  return { bg: "var(--chart-d1-lagna-bg)", border: "var(--cl-brand-edge)", text: SCORE_MID };
}

export function supportTone(value: string) {
  if (value === "STRONG") return SCORE_HIGH;
  if (value === "WEAK") return SCORE_LOW;
  return SCORE_MID;
}

export function supportLabel(value: string, lang: Lang) {
  if (value === "STRONG") return t("pred_strong", lang);
  if (value === "PARTIAL") return t("pred_partial", lang);
  return t("pred_weak", lang);
}

export function confidenceLabel(value: string, lang: Lang) {
  if (value === "HIGH") return t("pred_high", lang);
  if (value === "MEDIUM") return t("pred_medium", lang);
  return t("pred_low", lang);
}

export function predictionIsDeferred(pred: LifeAreaPredictionData): boolean {
  const factorKeys = pred.astrologicalFactors.map((factor) => factor.key);
  if (factorKeys.includes("age_phase_gate")) return true;
  const text = pred.mainPredictionEn.toLowerCase();
  return text.includes("age-gated") || text.includes("not applicable in this phase") || text.includes("deferred to later phase");
}
