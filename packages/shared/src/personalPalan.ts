import type { PalanAreaKey, PalanPolarity, PersonalPalan, PersonalPalanArea } from "./types";

/**
 * Personal palan display helpers shared by web and mobile (proposal §5, R6).
 *
 * The palan's words come from the server. Only the area *labels* and the order
 * the areas are shown in live here, so the two apps cannot name or order the
 * same area differently.
 */

type BiText = { ta: string; en: string };

export const PALAN_AREA_LABEL: Record<PalanAreaKey, BiText> = {
  CAREER:        { en: "Career",               ta: "வேலை / தொழில்" },
  BUSINESS:      { en: "Business",             ta: "வியாபாரம்" },
  MONEY:         { en: "Money",                ta: "பணம்" },
  FAMILY:        { en: "Family",               ta: "குடும்பம்" },
  LOVE:          { en: "Love & marriage",      ta: "காதல் / திருமணம்" },
  HEALTH:        { en: "Health",               ta: "ஆரோக்கியம்" },
  EDUCATION:     { en: "Studies",              ta: "கல்வி" },
  TRAVEL:        { en: "Travel & vehicle",     ta: "பயணம் / வாகனம்" },
  DOCUMENTS:     { en: "Documents & official", ta: "அரசு / ஆவணங்கள்" },
  FRIENDS:       { en: "Friends",              ta: "நண்பர்கள் / சமூகம்" },
  COMMUNICATION: { en: "Communication",        ta: "பேச்சு / தொடர்பு" },
  MIND:          { en: "Mind (Moon)",          ta: "மனநிலை (சந்திரன்)" },
};

export const PALAN_POLARITY_LABEL: Record<PalanPolarity, BiText> = {
  FAVOURABLE: { en: "Favourable", ta: "சாதகம்" },
  MIXED:      { en: "Mixed",      ta: "கலவை" },
  CAUTION:    { en: "Take care",  ta: "கவனம்" },
};

export function palanAreaLabel(area: string, lang: "ta" | "en"): string {
  const label = PALAN_AREA_LABEL[area as PalanAreaKey];
  return label ? label[lang] : area;
}

/** Neutral lead areas: a family member's chart, or no life focus (ruling Q2). */
const NEUTRAL_LEAD: readonly PalanAreaKey[] = ["CAREER", "MONEY", "FAMILY"];

/** Life-area code (server `FOCUS_TABLE.area`) → the three palan areas it leads with. */
const FOCUS_LEAD: Record<string, readonly PalanAreaKey[]> = {
  CAREER:         ["CAREER", "BUSINESS", "MONEY"],
  EDUCATION:      ["EDUCATION", "MIND", "COMMUNICATION"],
  RELATIONSHIPS:  ["LOVE", "FAMILY", "COMMUNICATION"],
  FAMILY_HARMONY: ["FAMILY", "LOVE", "HEALTH"],
  MONEY:          ["MONEY", "BUSINESS", "CAREER"],
  HEALTH:         ["HEALTH", "MIND", "TRAVEL"],
  SPIRITUAL:      ["MIND", "FAMILY", "HEALTH"],
};

/**
 * Split the palan's areas into the three shown up front and the rest.
 * Reorders only: the same area objects come back, none dropped, none changed.
 *
 * The running bhukti's areas (`dashaAreas`) are chart facts, so they lead on
 * every chart. With a life focus, the reader's two focus areas come first and
 * the bhukti's top area takes the third slot; without one (a family member,
 * ruling Q2), the bhukti's areas lead and the neutral order fills the rest.
 */
export function palanLeadAreas(
  palan: Pick<PersonalPalan, "areas" | "dashaAreas">,
  focusArea: string | null,
): { lead: PersonalPalanArea[]; rest: PersonalPalanArea[] } {
  const focus = focusArea ? FOCUS_LEAD[focusArea] : undefined;
  const dasha = palan.dashaAreas ?? [];
  const ordered = focus
    ? [focus[0], focus[1], ...dasha, ...focus.slice(2)]
    : [...dasha, ...NEUTRAL_LEAD];
  const keys = Array.from(new Set(ordered)).slice(0, 3);
  const lead = keys
    .map((key) => palan.areas.find((area) => area.area === key))
    .filter((area): area is PersonalPalanArea => area !== undefined);
  const rest = palan.areas.filter((area) => !lead.includes(area));
  return { lead, rest };
}
