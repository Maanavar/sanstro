/**
 * Which emblem an observance is drawn with (see <ObservanceGlyph>). Emblems,
 * never deity figures: a monoline vel, modakam or tulasi sprig stays legible at
 * 12 px and takes the theme's ink; a shrunken devotional picture does neither
 * (IMG-02, docs/IMAGERY_AUDIT_AND_ART_DIRECTION_2026-10-14.md).
 */
export type ObservanceKind =
  | "muhurtham"
  | "pournami"
  | "amavasai"
  | "chathurthi"
  | "sashti"
  | "ekadashi"
  | "pradosham"
  | "festival"
  | "karinaal";

/** Spellings tolerated are the ones the backend and festival feed actually emit. */
const RULES: ReadonlyArray<readonly [RegExp, ObservanceKind]> = [
  [/chaturthi|chathurthi/i, "chathurthi"],
  [/sashti|shasti|shashti/i, "sashti"],
  [/ekadasi|ekadashi|ekadhasi/i, "ekadashi"],
  // "pradhosam" is the backend's own spelling (festivals.py).
  [/pradosham|pradhosam|pradosha/i, "pradosham"],
  [/pournami|pournima|purnima/i, "pournami"],
  [/amavasai|amavasya|amavasi/i, "amavasai"],
];

/** Emblem for a festival/observance name, or null when none is drawn for it. */
export function observanceKindFor(name: string): ObservanceKind | null {
  for (const [pattern, kind] of RULES) if (pattern.test(name)) return kind;
  return null;
}
