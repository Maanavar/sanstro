/**
 * FAA-30 copy: the 8th-house reading, composed here so the server never
 * chooses a name (CLAUDE.md display boundary). Mirrored for the PDF by
 * app/services/eighth_house_copy.py; both reproduce
 * tests/golden/eighth_house/eighth_house_copy.json.
 *
 * Describes only. No status word, no verdict, and nothing about lifespan,
 * widowhood or a spouse's death (EC-RULING-06). "Mangalya" appears only for a
 * stated bride; a groom's reading is "8th-house factors".
 */
import type { EighthHouseCouple, EighthHouseFactor, EighthHouseReading } from "@vinaadi/shared";
import { rasiDisplayName } from "./chart-utils";
import { tPlanetLord } from "./i18n";
import type { Lang } from "./i18n";

function ordEn(n: number): string {
  const s = n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
  return `${n}${s}`;
}

export function eighthHouseTitle(r: EighthHouseReading, lang: Lang): string {
  if (r.role === "BRIDE") return lang === "en" ? "Mangalya sthana (the 8th house)" : "மாங்கல்ய ஸ்தானம் (8ஆம் இடம்)";
  if (r.role === "GROOM_8TH") return lang === "en" ? "8th-house factors" : "8ஆம் இடக் காரணிகள்";
  return lang === "en" ? "8th-house reading not applied" : "8ஆம் இட ஆய்வு செய்யப்படவில்லை";
}

/** Shown for NOT_APPLIED: which gender-specific readings were left out. */
export function eighthHouseNotApplied(lang: Lang): string {
  return lang === "en"
    ? "This reading needs a stated gender. For a bride the 8th is read as mangalya sthana, for a groom as general 8th-house factors; neither was applied."
    : "இந்த ஆய்வுக்குப் பாலினம் குறிப்பிடப்பட வேண்டும். மணப்பெண்ணுக்கு 8ஆம் இடம் மாங்கல்ய ஸ்தானமாகவும், மணமகனுக்குப் பொதுவான 8ஆம் இடக் காரணிகளாகவும் பார்க்கப்படும்; இரண்டும் இங்கு பார்க்கப்படவில்லை.";
}

export const EIGHTH_HOUSE_INTRO: Record<Lang, string> = {
  en: "What stands in, on and around the 8th house, from the lagna and from the Moon sign. These describe the chart for your astrologer; they do not change the score, and no single line decides anything.",
  ta: "லக்னத்திலிருந்தும் ராசியிலிருந்தும் 8ஆம் இடத்தில் உள்ளவை, அதைப் பார்ப்பவை, அதன் அதிபதி. இவை ஜோதிடர் பார்க்க வேண்டிய ஜாதகக் குறிப்புகள்; மதிப்பெண்ணை மாற்றாது, எந்த ஒரு வரியும் தனியாக முடிவு சொல்லாது.",
};

export function eighthHouseGroupLabel(ref: EighthHouseFactor["reference"], lang: Lang): string {
  const en = { LAGNA: "From the lagna", MOON: "From the Moon sign", D9_LAGNA: "In the Navamsa (D9)" };
  const ta = { LAGNA: "லக்னத்திலிருந்து", MOON: "ராசியிலிருந்து", D9_LAGNA: "நவாம்சத்தில் (D9)" };
  return (lang === "en" ? en : ta)[ref];
}

function qualifiers(f: EighthHouseFactor, lang: Lang): string {
  const parts: string[] = [];
  if (lang === "en") {
    parts.push(f.nature === "MALEFIC" ? "malefic" : "benefic");
    if (f.condition === "PAKSHA") parts.push(f.nature === "MALEFIC" ? "waning Moon" : "waxing Moon");
    if (f.condition === "ASSOCIATION") parts.push("by its company");
    if (f.dignity !== "NEUTRAL") parts.push({ EXALTED: "exalted", OWN: "in its own sign", DEBILITATED: "debilitated" }[f.dignity]);
    if (f.combust) parts.push("combust");
    if (f.ownHouse) parts.push("owns this 8th");
  } else {
    parts.push(f.nature === "MALEFIC" ? "பாவக் கிரகம்" : "சுபக் கிரகம்");
    if (f.condition === "PAKSHA") parts.push(f.nature === "MALEFIC" ? "தேய்பிறைச் சந்திரன்" : "வளர்பிறைச் சந்திரன்");
    if (f.condition === "ASSOCIATION") parts.push("சேர்க்கையால்");
    if (f.dignity !== "NEUTRAL") parts.push({ EXALTED: "உச்சம்", OWN: "ஆட்சி", DEBILITATED: "நீசம்" }[f.dignity]);
    if (f.combust) parts.push("அஸ்தங்கம்");
    if (f.ownHouse) parts.push("இந்த 8ஆம் இடத்தின் அதிபதி");
  }
  return parts.join(", ");
}

/** One factor, one sentence, with its qualifiers in brackets. */
export function eighthHouseLine(f: EighthHouseFactor, lang: Lang): string {
  const g = tPlanetLord(f.graha, lang);
  const sign = rasiDisplayName(f.rasi, lang);
  const q = qualifiers(f, lang);
  if (lang === "en") {
    const lord = f.target === "LORD" ? "the 8th lord" : "the 8th";
    switch (f.kind) {
      case "OCCUPANT": return `${g} is in the 8th, ${sign} (${q}).`;
      case "LORD": return `The 8th lord, ${g}, is in the ${ordEn(f.house)} house, ${sign} (${q}).`;
      case "INFLUENCE": return f.via === "CONJUNCT" ? `${g} is with the 8th lord, in ${sign} (${q}).` : `${g} aspects ${lord} from ${sign} (${q}).`;
      case "PROTECTION": return `${g} aspects ${lord} from ${sign}, a protecting line (${q}).`;
      case "D9_LORD": return `The 8th lord, ${g}, is in ${sign} in the Navamsa (${q}).`;
      default: return `${g} is in the Navamsa's 8th, ${sign} (${q}).`;
    }
  }
  const lord = f.target === "LORD" ? "8ஆம் அதிபதியை" : "8ஆம் இடத்தை";
  switch (f.kind) {
    case "OCCUPANT": return `${g} 8ஆம் இடமான ${sign}-இல் உள்ளது (${q}).`;
    case "LORD": return `8ஆம் அதிபதி ${g}, ${f.house}ஆம் இடமான ${sign}-இல் உள்ளது (${q}).`;
    case "INFLUENCE": return f.via === "CONJUNCT" ? `${g} 8ஆம் அதிபதியுடன் ${sign}-இல் சேர்ந்துள்ளது (${q}).` : `${g} ${sign}-இலிருந்து ${lord} பார்க்கிறது (${q}).`;
    case "PROTECTION": return `${g} ${sign}-இலிருந்து ${lord} பார்க்கிறது; இது காக்கும் அம்சம் (${q}).`;
    case "D9_LORD": return `நவாம்சத்தில் 8ஆம் அதிபதி ${g}, ${sign}-இல் உள்ளது (${q}).`;
    default: return `நவாம்சத்தின் 8ஆம் இடமான ${sign}-இல் ${g} உள்ளது (${q}).`;
  }
}

/** "Same placement as counted in …": the shared placement, said once. */
export function eighthHouseAlsoCounted(f: EighthHouseFactor, lang: Lang): string {
  const names: Record<string, [string, string]> = {
    SEVVAI_DOSHAM: ["Sevvai dosham", "செவ்வாய் தோஷம்"],
    RAHU_KETU_DOSHAM: ["Rahu-Ketu dosham", "ராகு-கேது தோஷம்"],
  };
  const list = f.alsoCountedIn.map((k) => (names[k] ?? [k, k])[lang === "en" ? 0 : 1]);
  if (!list.length) return "";
  return lang === "en"
    ? `The same placement is counted in ${list.join(" and ")}; it is one finding, not two.`
    : `இதே நிலை ${list.join(", ")}-இலும் கணக்கிடப்பட்டுள்ளது; இது இரண்டு தனிக் குறிப்புகள் அல்ல.`;
}

export function eighthHouseD9Note(r: EighthHouseReading, lang: Lang): string {
  if (r.d9Note === "D9_LAGNA_UNRELIABLE") {
    return lang === "en"
      ? "Navamsa lines are left out: the birth time cannot fix the Navamsa lagna."
      : "நவாம்சக் குறிப்புகள் சேர்க்கப்படவில்லை: பிறந்த நேரத்தால் நவாம்ச லக்னத்தை உறுதி செய்ய முடியவில்லை.";
  }
  if (r.d9Note === "D9_UNAVAILABLE") {
    return lang === "en" ? "Navamsa lines are not available for this chart." : "இந்த ஜாதகத்துக்கு நவாம்சக் குறிப்புகள் கிடைக்கவில்லை.";
  }
  return "";
}

/** Assessment 3, beside the samyam layers. "" when it does not apply. */
export function eighthHouseJoint(c: EighthHouseCouple, lang: Lang): string {
  const en = {
    BOTH: "Both charts show malefic influence on the 8th. Read the two together with your astrologer.",
    ONE: "One chart shows malefic influence on the 8th; the other does not.",
    NEITHER: "Neither chart shows malefic influence on the 8th.",
    NOT_APPLIED: "",
  };
  const ta = {
    BOTH: "இரண்டு ஜாதகங்களிலும் 8ஆம் இடத்தில் பாவக் கிரகத் தாக்கம் உள்ளது. இரண்டையும் சேர்த்து ஜோதிடரிடம் பார்க்கவும்.",
    ONE: "ஒரு ஜாதகத்தில் 8ஆம் இடத்தில் பாவக் கிரகத் தாக்கம் உள்ளது; மற்றதில் இல்லை.",
    NEITHER: "இரண்டு ஜாதகங்களிலும் 8ஆம் இடத்தில் பாவக் கிரகத் தாக்கம் இல்லை.",
    NOT_APPLIED: "",
  };
  return (lang === "en" ? en : ta)[c.joint];
}
