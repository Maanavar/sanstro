// Ask Vinaadi Lite — pre-written daily prompt chips per Life Mode (Feature 3).
// The table now lives in @vinaadi/shared (`LIFE_MODE_ASK_CHIPS`) so mobile asks
// the same three questions; this module keeps web's import path.

import { askChipsForMode } from "@vinaadi/shared/lifeFocus";
import type { LifeMode } from "@/lib/types";

export interface ChipText {
  ta: string;
  en: string;
}

export function getChipsForMode(mode: LifeMode): readonly [ChipText, ChipText, ChipText] {
  return askChipsForMode(mode);
}
