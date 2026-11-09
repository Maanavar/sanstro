/**
 * Words for பாப சாம்யம் (papa samyam), the malefic-balance check in Tamil
 * jathaga porutham. Shared by web and mobile so the two apps cannot word it
 * differently (deferred-checks plan, item 3).
 *
 * The engine (`app/calculations/dosha_samyam.py`) sends keys and numbers in
 * `papaSamyam`; this module is the only place they become sentences. Grahas go
 * through the shared name table, never a server string.
 *
 * Rules every line keeps:
 *  - Report only. The check is not in the porutham score or label, so no line
 *    may say it raised or lowered the match.
 *  - The weights are not ratified (`ratified: false`): every view says the
 *    count is the common one-point method and an astrologer may weigh it
 *    differently.
 *  - Advisory voice: "short by", "weighs it with the rest", never "avoid".
 *
 * Tamil strings here are pending native review.
 */
import type { PapaSamyamData, PapaSide } from "./types";
import { PLANET_LORDS } from "./i18n/astro-names";

export type PapaLang = "ta" | "en";
type Text = { ta: string; en: string };
const pick = (t: Text, lang: PapaLang) => (lang === "ta" ? t.ta : t.en);

/** "From the Lagna" / "லக்னத்திலிருந்து", in the order the engine reports. */
const REFERENCE_FROM: Record<string, Text> = {
  LAGNA: { ta: "லக்னத்திலிருந்து", en: "From the Lagna" },
  MOON: { ta: "சந்திரனிலிருந்து", en: "From the Moon" },
  VENUS: { ta: "சுக்கிரனிலிருந்து", en: "From Venus" },
};

const REFERENCE_ORDER = ["LAGNA", "MOON", "VENUS"] as const;

function planet(key: string, lang: PapaLang): string {
  const entry = PLANET_LORDS[key.toUpperCase()];
  return entry ? entry[lang] : key;
}

function ordinal(n: number, lang: PapaLang): string {
  if (lang === "ta") return `${n}ஆம்`;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  return `${n}${n % 10 === 1 ? "st" : n % 10 === 2 ? "nd" : n % 10 === 3 ? "rd" : "th"}`;
}

export interface PapaReferenceLine {
  reference: string;
  /** "From the Lagna" */
  label: string;
  /** "Mars (7th), Saturn (8th)", or "none" / "could not be read". */
  detail: string;
  points: number | null;
}

export interface PapaSideView {
  total: number;
  lines: PapaReferenceLine[];
}

export interface PapaSamyamView {
  heading: string;
  /** "Groom 4 · Bride 3" */
  totals: string;
  balanced: boolean;
  /** The verdict, in advisory voice. */
  verdict: string;
  groomLabel: string;
  brideLabel: string;
  groom: PapaSideView;
  bride: PapaSideView;
  /** How it was counted, and that it is not in the score. Always shown. */
  method: string;
  /** Set when the groom/bride direction was assumed, not read. */
  directionNote: string | null;
}

function sideView(side: PapaSide, lang: PapaLang): PapaSideView {
  const missing = new Set(side.missingReferences ?? []);
  const lines = REFERENCE_ORDER.map((ref): PapaReferenceLine => {
    if (missing.has(ref)) {
      return {
        reference: ref,
        label: pick(REFERENCE_FROM[ref], lang),
        detail: lang === "ta" ? "கணக்கிட முடியவில்லை" : "could not be read",
        points: null,
      };
    }
    const rows = side.rows.filter((r) => r.reference === ref);
    const detail = rows.length
      ? rows.map((r) => `${planet(r.graha, lang)} (${ordinal(r.house, lang)})`).join(", ")
      : lang === "ta" ? "இல்லை" : "none";
    return {
      reference: ref,
      label: pick(REFERENCE_FROM[ref], lang),
      detail,
      points: side.byReference[ref] ?? rows.reduce((sum, r) => sum + r.points, 0),
    };
  });
  return { total: side.total, lines };
}

/** The card's content, or null when the payload carries no block. */
export function papaSamyamView(
  data: PapaSamyamData | null | undefined,
  lang: PapaLang,
): PapaSamyamView | null {
  if (!data) return null;
  const groomLabel = lang === "ta" ? "மாப்பிள்ளை" : "Groom";
  const brideLabel = lang === "ta" ? "பெண்" : "Bride";
  const verdict = data.balanced
    ? pick(
        {
          en: "Balanced: the groom's malefic count is at least the bride's, which is what traditional practice asks.",
          ta: "சமன்: மாப்பிள்ளையின் பாப கிரக எண்ணிக்கை பெண்ணுடையதற்குக் குறையவில்லை; மரபு இதையே எதிர்பார்க்கிறது.",
        },
        lang,
      )
    : pick(
        {
          en: `Short by ${data.shortfall}: traditional practice asks the groom's malefic count to be at least the bride's. This is one check among many; an experienced astrologer weighs it with the rest of both charts.`,
          ta: `${data.shortfall} குறைகிறது: மரபுப்படி மாப்பிள்ளையின் பாப கிரக எண்ணிக்கை பெண்ணுடையதற்குக் குறையாமல் இருக்க வேண்டும். இது பல சோதனைகளில் ஒன்று; அனுபவமிக்க ஜோதிடர் இரு ஜாதகங்களின் மற்ற அம்சங்களுடன் சேர்த்து இதைப் பார்ப்பார்.`,
        },
        lang,
      );
  return {
    heading: lang === "ta" ? "பாப சாம்யம்" : "Papa samyam",
    totals: `${groomLabel} ${data.boy.total} · ${brideLabel} ${data.girl.total}`,
    balanced: data.balanced,
    verdict,
    groomLabel,
    brideLabel,
    groom: sideView(data.boy, lang),
    bride: sideView(data.girl, lang),
    method: papaMethodNote(lang),
    directionNote: data.directionAssumed
      ? pick(
          {
            en: "Neither chart states a gender, so Person 1 was read as the groom. Swapping them changes this check.",
            ta: "இரு ஜாதகங்களிலும் பாலினம் குறிப்பிடப்படவில்லை; அதனால் நபர் 1 மாப்பிள்ளையாகக் கொள்ளப்பட்டார். இருவரையும் மாற்றினால் இந்தச் சோதனையின் முடிவு மாறும்.",
          },
          lang,
        )
      : null,
  };
}

/** How the count is made. Shown on every card: the weights are not ratified. */
export function papaMethodNote(lang: PapaLang): string {
  return pick(
    {
      en: "Counted the common way: the Sun, Mars, Saturn, Rahu and Ketu in the 1st, 2nd, 4th, 7th, 8th or 12th house from the Lagna, the Moon and Venus, one point each. Your astrologer may weigh them differently. It is not part of the porutham score.",
      ta: "பொதுவான முறையில் எண்ணப்பட்டது: லக்னம், சந்திரன், சுக்கிரன் ஆகிய மூன்றிலிருந்தும் 1, 2, 4, 7, 8, 12ஆம் இடங்களில் உள்ள சூரியன், செவ்வாய், சனி, ராகு, கேது ஒவ்வொன்றுக்கும் ஒரு புள்ளி. உங்கள் ஜோதிடர் வேறு எடைகளில் கணக்கிடலாம். இது பொருத்த மதிப்பெண்ணில் சேர்க்கப்படவில்லை.",
    },
    lang,
  );
}

/**
 * For the star-only porutham tools (mobile, the marketing calculator), which
 * cannot run this check. Said rather than left out: a missing check reads as
 * a clean one (F-CI-03).
 */
export function papaNotCheckedNote(lang: PapaLang): string {
  return pick(
    {
      en: "Papa samyam is not checked here. It needs both full birth charts, not only the birth stars, so have it checked with the two jathagams.",
      ta: "பாப சாம்யம் இங்கு பார்க்கப்படவில்லை. அதற்கு நட்சத்திரம் மட்டும் போதாது, இரு முழு ஜாதகங்களும் தேவை; இரு ஜாதகங்களுடன் இதைப் பார்த்துக்கொள்ளுங்கள்.",
    },
    lang,
  );
}

