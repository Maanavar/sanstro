import type { Lang } from "./i18n";
import type { PanchangamDailyResponseData } from "./types";

export type GowriTimingSlot = PanchangamDailyResponseData["kalam"]["nallaNeram"][number];

// Keep nameEn/nameTa/purposeEn/purposeTa in sync verbatim with
// GOWRI_GOOD_LABELS_EN/TA and GOWRI_GOOD_PURPOSE_EN/TA in app/calculations/panchangam.py —
// the backend has no per-slot localized fields in the API response, so this table is the
// single place the frontend defines that wording. Update both together.
// The eight kalas: AMIRTHAM, VISHAM, ROGAM, LABHAM, DHANAM, SUGAM, SORAM, UTHI.
// Good kalas (5): AMIRTHAM (best), UTHI, LABHAM, DHANAM, SUGAM.
// These are not a rotating 8-cycle — only seven rotate and VISHAM takes the Rahu
// Kalam slot (see GOWRI_DAY_TABLE in app/calculations/panchangam.py). Slot order is
// decided backend-side; this file only maps an already-chosen name to its wording.
const GOWRI_CATEGORY_DETAILS = {
  AMIRTHAM: {
    rank: 1,
    nameEn: "Amirtham",
    nameTa: "அமிர்தம்",
    purposeEn: "best overall — any important activity",
    purposeTa: "மிகச் சிறந்த பொது நல்ல நேரம் — அனைத்து முக்கிய செயல்களுக்கும்",
  },
  UTHI: {
    rank: 2,
    nameEn: "Uthi",
    nameTa: "உத்தி",
    purposeEn: "new starts, jobs, official work, and applications",
    purposeTa: "புதிய தொடக்கம், வேலை, அலுவல், விண்ணப்பங்களுக்கு நல்லது",
  },
  LABHAM: {
    rank: 3,
    nameEn: "Labham",
    nameTa: "லாபம்",
    purposeEn: "profit, business, deals, buying, and selling",
    purposeTa: "லாபம், வணிகம், ஒப்பந்தம், வாங்கல்/விற்பனைக்கு நல்லது",
  },
  DHANAM: {
    rank: 4,
    nameEn: "Dhanam",
    nameTa: "தனம்",
    purposeEn: "money, finance, investments, and wealth matters",
    purposeTa: "பணம், நிதி, முதலீடு போன்ற செல்வம் சார்ந்த விஷயங்களுக்கு நல்லது",
  },
  SUGAM: {
    rank: 5,
    nameEn: "Sugam",
    nameTa: "சுகம்",
    purposeEn: "comfort, health, family peace, travel, and routine good work",
    purposeTa: "ஆறுதல், ஆரோக்கியம், குடும்ப அமைதி, பயணம், வழக்கமான நல்ல வேலைகளுக்கு நல்லது",
  },
} as const;

// Inauspicious kalas (3 of 8): ROGAM, SORAM, VISHAM. Unlike the good kalas these
// carry no "use it for X" purpose — they carry a reason to AVOID. The API sends
// only the raw name + isGood=false, so (like GOWRI_CATEGORY_DETAILS) this is the
// single place the frontend defines their wording.
const GOWRI_BAD_CATEGORY_DETAILS = {
  ROGAM: {
    nameEn: "Rogam",
    nameTa: "ரோகம்",
    cautionEn: "inauspicious kala — linked to illness; avoid new or important work",
    cautionTa: "தீய கலம் — நோய் சம்பந்தம்; புதிய/முக்கிய வேலைகளைத் தவிர்க்கவும்",
  },
  SORAM: {
    nameEn: "Soram",
    nameTa: "சோரம்",
    cautionEn: "inauspicious kala — linked to loss/theft; avoid deals and money matters",
    cautionTa: "தீய கலம் — இழப்பு/திருட்டு சம்பந்தம்; பணப் பரிவர்த்தனைகளைத் தவிர்க்கவும்",
  },
  VISHAM: {
    nameEn: "Visham",
    nameTa: "விஷம்",
    cautionEn: "inauspicious 'poison' kala — avoid starting anything important",
    cautionTa: "தீய 'விஷம்' கலம் — முக்கியமான எதையும் தொடங்குவதைத் தவிர்க்கவும்",
  },
} as const;

type GowriCategoryName = keyof typeof GOWRI_CATEGORY_DETAILS;
type GowriBadCategoryName = keyof typeof GOWRI_BAD_CATEGORY_DETAILS;

function gowriKey(name: string | null | undefined): GowriCategoryName | null {
  const key = String(name ?? "").toUpperCase();
  return key in GOWRI_CATEGORY_DETAILS ? (key as GowriCategoryName) : null;
}

function gowriBadKey(name: string | null | undefined): GowriBadCategoryName | null {
  const key = String(name ?? "").toUpperCase();
  return key in GOWRI_BAD_CATEGORY_DETAILS ? (key as GowriBadCategoryName) : null;
}

export function gowriCategoryRank(name: string | null | undefined): number {
  const key = gowriKey(name);
  return key ? GOWRI_CATEGORY_DETAILS[key].rank : 999;
}

export function gowriCategoryLabel(name: string | null | undefined, lang: Lang): string {
  const key = gowriKey(name);
  if (key) {
    const detail = GOWRI_CATEGORY_DETAILS[key];
    return lang === "ta" ? detail.nameTa : detail.nameEn;
  }
  const badKey = gowriBadKey(name);
  if (badKey) {
    const detail = GOWRI_BAD_CATEGORY_DETAILS[badKey];
    return lang === "ta" ? detail.nameTa : detail.nameEn;
  }
  return name ?? "";
}

// Why an inauspicious Gowri kala (Rogam/Soram/Visham) is best avoided. Empty for
// good kalas (use gowriPurposeLabel for those) and for unknown names.
export function gowriCautionLabel(name: string | null | undefined, lang: Lang): string {
  const badKey = gowriBadKey(name);
  if (!badKey) return "";
  const detail = GOWRI_BAD_CATEGORY_DETAILS[badKey];
  return lang === "ta" ? detail.cautionTa : detail.cautionEn;
}

export function gowriPurposeLabel(name: string | null | undefined, lang: Lang): string {
  const key = gowriKey(name);
  if (!key) return "";
  const detail = GOWRI_CATEGORY_DETAILS[key];
  return lang === "ta" ? detail.purposeTa : detail.purposeEn;
}

/**
 * One-word verdict for the Gowri detail grid, so a kala can be judged without
 * reading its purpose line. Deliberately NOT a per-kala English gloss: printed
 * almanacs render Labham as "Gain" and Dhanam as "Wealth", but those are just
 * translations of the names themselves — in Tamil they'd restate the name and
 * say nothing. Amirtham (rank 1) is the only good kala singled out as best;
 * the other four read simply as good.
 */
export function gowriQualityLabel(name: string | null | undefined, lang: Lang): string {
  const key = gowriKey(name);
  if (key) {
    if (GOWRI_CATEGORY_DETAILS[key].rank === 1) return lang === "ta" ? "மிகச் சிறந்தது" : "Best";
    return lang === "ta" ? "நல்லது" : "Good";
  }
  if (gowriBadKey(name)) return lang === "ta" ? "தவிர்க்கவும்" : "Avoid";
  return "";
}

// Local minute parser: this module is a leaf lib and must not import from the
// dashboard component tree (where the shared parseHmToMinutes lives).
function hmToMinutes(hm: string): number {
  const [h, m] = String(hm ?? "").split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export interface GowriSlotDayOffset {
  /** Days after the panchangam date on which the slot's start falls (0 or 1). */
  startOffset: number;
  /** Same for its end — one slot can start before midnight and end after it. */
  endOffset: number;
}

/**
 * Which calendar day each slot's start/end lands on, given the wall-clock
 * "HH:MM" strings the API sends.
 *
 * The night kalas run sunset → next sunrise, so most of them fall on the *next*
 * Gregorian date even though they belong to this panchangam day. Printed as a
 * bare clock time, "12:27 am" reads as this morning when it means tomorrow
 * morning; the caller uses these offsets to date-stamp the ones that wrapped.
 *
 * Slots must be in chronological order starting at `anchorHm` (sunrise for the
 * day column, sunset for the night column). Midnight is detected by the clock
 * running backwards between consecutive slots.
 */
export function gowriSlotDayOffsets(
  slots: readonly { start: string; end: string }[],
  anchorHm: string,
): GowriSlotDayOffset[] {
  let dayOffset = 0;
  let previousStart = hmToMinutes(anchorHm);
  return slots.map((slot) => {
    const start = hmToMinutes(slot.start);
    if (start < previousStart) dayOffset += 1;
    previousStart = start;
    const end = hmToMinutes(slot.end);
    return { startOffset: dayOffset, endOffset: end <= start ? dayOffset + 1 : dayOffset };
  });
}

export function gowriPeriodLabel(period: string | null | undefined, lang: Lang): string {
  if (period === "AM") return lang === "ta" ? "காலை" : "AM";
  if (period === "PM") return lang === "ta" ? "மாலை" : "PM";
  if (period === "DAY") return lang === "ta" ? "பகல்" : "Day";
  if (period === "NIGHT") return lang === "ta" ? "இரவு" : "Night";
  return "";
}

export function bestGowriSlot<T extends { name?: string | null; start: string; end: string }>(
  slots: readonly T[] | null | undefined,
): T | undefined {
  return [...(slots ?? [])].sort((a, b) => {
    const rankDelta = gowriCategoryRank(a.name) - gowriCategoryRank(b.name);
    if (rankDelta !== 0) return rankDelta;
    return `${a.start}-${a.end}`.localeCompare(`${b.start}-${b.end}`);
  })[0];
}
