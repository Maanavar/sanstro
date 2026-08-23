import { dt, SANI_CYCLE_CARD } from "@/lib/dashboard-i18n";
import type { Lang } from "@/lib/i18n";
import type { SaniCycleData } from "@/lib/types";
import { formatDateLabel } from "@/lib/format";

type SaniCycleAssessment = SaniCycleData["moonBasedCycle"];

const SADE_SATI_TYPES = new Set(["EZHARAI_SANI_PHASE_1", "JANMA_SANI", "EZHARAI_SANI_PHASE_2", "EZHARAI_SANI_PHASE_3"]);

export function cycleText(entry: SaniCycleAssessment, lang: Lang) {
  const type = entry.type ?? "";
  if (SADE_SATI_TYPES.has(type)) {
    const phase = type === "EZHARAI_SANI_PHASE_1"
      ? SANI_CYCLE_CARD.phaseOpening
      : type === "EZHARAI_SANI_PHASE_3"
        ? SANI_CYCLE_CARD.phaseClosing
        : SANI_CYCLE_CARD.phasePeak;
    return {
      scope: dt(SANI_CYCLE_CARD.scopeSade, lang),
      phase: dt(phase, lang),
      prevalence: dt(SANI_CYCLE_CARD.prevalenceSade, lang),
      action: dt(SANI_CYCLE_CARD.actionSade, lang),
    };
  }
  if (type === "ASHTAMA_SANI") {
    return {
      scope: dt(SANI_CYCLE_CARD.scopeAshtama, lang),
      phase: dt(SANI_CYCLE_CARD.phaseDeep, lang),
      prevalence: dt(SANI_CYCLE_CARD.prevalenceTransit, lang),
      action: dt(SANI_CYCLE_CARD.actionAshtama, lang),
    };
  }
  if (type === "ARDHASHTAMA_SANI") {
    return {
      scope: dt(SANI_CYCLE_CARD.scopeArdhashtama, lang),
      phase: dt(SANI_CYCLE_CARD.phaseHome, lang),
      prevalence: dt(SANI_CYCLE_CARD.prevalenceTransit, lang),
      action: dt(SANI_CYCLE_CARD.actionArdhashtama, lang),
    };
  }
  return {
    scope: dt(SANI_CYCLE_CARD.scopeCrossCheck, lang),
    phase: dt(SANI_CYCLE_CARD.phaseCrossCheck, lang),
    prevalence: dt(SANI_CYCLE_CARD.prevalenceTransit, lang),
    action: dt(SANI_CYCLE_CARD.actionCrossCheck, lang),
  };
}

export function cycleDate(value: string | null | undefined, lang: Lang): string {
  return value ? formatDateLabel(value) : dt(SANI_CYCLE_CARD.refreshForDate, lang);
}
