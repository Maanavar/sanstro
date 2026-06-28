import type { Lang } from "./i18n";
import type { PanchangamDailyResponseData } from "./types";

export type GowriTimingSlot = PanchangamDailyResponseData["kalam"]["nallaNeram"][number];

// Keep nameEn/nameTa/purposeEn/purposeTa in sync verbatim with
// GOWRI_GOOD_LABELS_EN/TA and GOWRI_GOOD_PURPOSE_EN/TA in app/calculations/panchangam.py —
// the backend has no per-slot localized fields in the API response, so this table is the
// single place the frontend defines that wording. Update both together.
// Traditional Tamil Nadu 8-kala cycle: VILAMBHI, ANANDHA, ROGAM, LABHAM, AMIRTHAM, SHODAM, KALAM, VISHAM.
// Good kalas (4): AMIRTHAM (best), LABHAM, VILAMBHI, ANANDHA.
const GOWRI_CATEGORY_DETAILS = {
  AMIRTHAM: {
    rank: 1,
    nameEn: "Amirtham",
    nameTa: "அமிர்தம்",
    purposeEn: "best overall — all auspicious activities",
    purposeTa: "மிகச் சிறந்த பொது நல்ல நேரம் — அனைத்து மங்கலகர செயல்களுக்கும்",
  },
  LABHAM: {
    rank: 2,
    nameEn: "Labham",
    nameTa: "லாபம்",
    purposeEn: "profit, business, deals, buying, and selling",
    purposeTa: "லாபம், வணிகம், ஒப்பந்தம், வாங்கல்/விற்பனைக்கு நல்லது",
  },
  VILAMBHI: {
    rank: 3,
    nameEn: "Vilambhi",
    nameTa: "விளம்பி",
    purposeEn: "new starts, livelihood, official work, and applications",
    purposeTa: "புதிய தொடக்கம், வாழ்வாதாரம், அலுவல், விண்ணப்பங்களுக்கு நல்லது",
  },
  ANANDHA: {
    rank: 4,
    nameEn: "Anandha",
    nameTa: "ஆனந்தம்",
    purposeEn: "joyful occasions, celebrations, and family gatherings",
    purposeTa: "மகிழ்ச்சியான நிகழ்வுகள், கொண்டாட்டங்கள், குடும்ப ஒன்று கூடல்களுக்கு நல்லது",
  },
} as const;

type GowriCategoryName = keyof typeof GOWRI_CATEGORY_DETAILS;

function gowriKey(name: string | null | undefined): GowriCategoryName | null {
  const key = String(name ?? "").toUpperCase();
  return key in GOWRI_CATEGORY_DETAILS ? (key as GowriCategoryName) : null;
}

export function gowriCategoryRank(name: string | null | undefined): number {
  const key = gowriKey(name);
  return key ? GOWRI_CATEGORY_DETAILS[key].rank : 999;
}

export function gowriCategoryLabel(name: string | null | undefined, lang: Lang): string {
  const key = gowriKey(name);
  if (!key) return name ?? "";
  const detail = GOWRI_CATEGORY_DETAILS[key];
  return lang === "ta" ? detail.nameTa : detail.nameEn;
}

export function gowriPurposeLabel(name: string | null | undefined, lang: Lang): string {
  const key = gowriKey(name);
  if (!key) return "";
  const detail = GOWRI_CATEGORY_DETAILS[key];
  return lang === "ta" ? detail.purposeTa : detail.purposeEn;
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
