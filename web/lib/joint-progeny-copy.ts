/**
 * FAA-32 copy: joint progeny, composed here so the server never chooses a
 * name (CLAUDE.md display boundary). Mirrored for the PDF by
 * app/services/joint_progeny_copy.py; both reproduce
 * tests/golden/joint_progeny/joint_progeny_copy.json.
 *
 * Describes and times only. No status word, no net verdict, no probability,
 * and nothing that says whether a child will come (Q17).
 */
import type { JointProgeny, ProgenyFactor, ProgenyReading, ProgenyTimingRole, ProgenyWindow } from "@vinaadi/shared";
import { rasiDisplayName } from "./chart-utils";
import { tPlanetLord } from "./i18n";
import type { Lang } from "./i18n";

function ordEn(n: number): string {
  const s = n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
  return `${n}${s}`;
}

export const JOINT_PROGENY_HEADING: Record<Lang, string> = {
  en: "Children: reading both charts",
  ta: "குழந்தைப் பேறு: இரு ஜாதகங்களும்",
};

export const JOINT_PROGENY_INTRO: Record<Lang, string> = {
  en: "What each chart shows around children: the 5th house, Jupiter, the 5th from Jupiter and from the Moon sign, and for a bride the 9th. Each line is marked supportive or challenging; the marks are not added up. These describe the charts for your astrologer; they do not change the score, and nothing here says whether or when a child will come.",
  ta: "ஒவ்வொரு ஜாதகத்திலும் குழந்தைப் பேறு தொடர்பானவை: 5ஆம் இடம், குரு, குருவிலிருந்தும் ராசியிலிருந்தும் 5ஆம் இடம், மணப்பெண்ணுக்கு 9ஆம் இடம். ஒவ்வொரு வரியும் சாதகம் அல்லது சவால் எனக் குறிக்கப்பட்டுள்ளது; இவை கூட்டிக் கணக்கிடப்படுவதில்லை. இவை ஜோதிடர் பார்க்க வேண்டிய ஜாதகக் குறிப்புகள்; மதிப்பெண்ணை மாற்றாது, குழந்தை பிறக்குமா, எப்போது என்று இங்கு எதுவும் சொல்லப்படவில்லை.",
};

export type ProgenyGroup = "LAGNA" | "KARAKA" | "JUPITER" | "MOON" | "NINTH" | "D7";
export const PROGENY_GROUPS: readonly ProgenyGroup[] = ["LAGNA", "KARAKA", "JUPITER", "MOON", "NINTH", "D7"];

export function progenyGroup(f: ProgenyFactor): ProgenyGroup {
  if (f.reference === "D7_LAGNA") return "D7";
  if (f.target === "KARAKA") return "KARAKA";
  if (f.reference === "LAGNA" && f.bhava === 9) return "NINTH";
  return f.reference as "LAGNA" | "JUPITER" | "MOON";
}

export function progenyGroupLabel(g: ProgenyGroup, r: ProgenyReading, lang: Lang): string {
  const ninthEn = r.ninth === "CHILDREN" ? "The 9th, read for children in a woman's chart" : "The 9th, as context only";
  const ninthTa = r.ninth === "CHILDREN" ? "9ஆம் இடம் (பெண் ஜாதகத்தில் குழந்தைப் பேற்றுக்கு)" : "9ஆம் இடம் (குறிப்புக்காக மட்டும்)";
  const en = {
    LAGNA: "The 5th from the lagna", KARAKA: "Jupiter, the karaka for children", JUPITER: "The 5th from Jupiter",
    MOON: "The 5th from the Moon sign", NINTH: ninthEn, D7: "In the Saptamsa (D7)",
  };
  const ta = {
    LAGNA: "லக்னத்திலிருந்து 5ஆம் இடம்", KARAKA: "புத்திர காரகர் குரு", JUPITER: "குருவிலிருந்து 5ஆம் இடம்",
    MOON: "ராசியிலிருந்து 5ஆம் இடம்", NINTH: ninthTa, D7: "சப்தாம்சத்தில் (D7)",
  };
  return (lang === "en" ? en : ta)[g];
}

function qualifiers(f: ProgenyFactor, lang: Lang): string {
  const parts: string[] = [];
  if (lang === "en") {
    parts.push(f.nature === "MALEFIC" ? "malefic" : "benefic");
    if (f.condition === "PAKSHA") parts.push(f.nature === "MALEFIC" ? "waning Moon" : "waxing Moon");
    if (f.condition === "ASSOCIATION") parts.push("by its company");
    if (f.dignity !== "NEUTRAL") parts.push({ EXALTED: "exalted", OWN: "in its own sign", DEBILITATED: "debilitated" }[f.dignity]);
    if (f.combust) parts.push("combust");
    if (f.ownHouse) parts.push("owns this house");
  } else {
    parts.push(f.nature === "MALEFIC" ? "பாவக் கிரகம்" : "சுபக் கிரகம்");
    if (f.condition === "PAKSHA") parts.push(f.nature === "MALEFIC" ? "தேய்பிறைச் சந்திரன்" : "வளர்பிறைச் சந்திரன்");
    if (f.condition === "ASSOCIATION") parts.push("சேர்க்கையால்");
    if (f.dignity !== "NEUTRAL") parts.push({ EXALTED: "உச்சம்", OWN: "ஆட்சி", DEBILITATED: "நீசம்" }[f.dignity]);
    if (f.combust) parts.push("அஸ்தங்கம்");
    if (f.ownHouse) parts.push("இந்த இடத்தின் அதிபதி");
  }
  return parts.join(", ");
}

/** One factor, one sentence, with its qualifiers in brackets. */
export function progenyLine(f: ProgenyFactor, lang: Lang): string {
  const g = tPlanetLord(f.graha, lang);
  const sign = rasiDisplayName(f.rasi, lang);
  const q = qualifiers(f, lang);
  const n = f.bhava;
  if (lang === "en") {
    const lord = f.target === "LORD" ? `the ${ordEn(n)} lord` : `the ${ordEn(n)}`;
    switch (f.kind) {
      case "OCCUPANT": return `${g} is in the ${ordEn(n)}, ${sign} (${q}).`;
      case "LORD": return `The ${ordEn(n)} lord, ${g}, is in the ${ordEn(f.house)} house, ${sign} (${q}).`;
      case "KARAKA": return `${g} is in the ${ordEn(f.house)} house, ${sign} (${q}).`;
      case "INFLUENCE":
      case "BENEFIC_ASPECT":
        if (f.target === "KARAKA") return `${g} is with Jupiter, in ${sign} (${q}).`;
        return f.via === "CONJUNCT" ? `${g} is with ${lord}, in ${sign} (${q}).` : `${g} aspects ${lord} from ${sign} (${q}).`;
      case "D7_LORD": return `The 5th lord in the Saptamsa, ${g}, is in its ${ordEn(f.house)} house, ${sign} (${q}).`;
      case "D7_KARAKA": return `${g} is in the Saptamsa's ${ordEn(f.house)} house, ${sign} (${q}).`;
      default: return `${g} is in the Saptamsa's 5th, ${sign} (${q}).`;
    }
  }
  const lordTa = f.target === "LORD" ? `${n}ஆம் அதிபதியை` : `${n}ஆம் இடத்தை`;
  switch (f.kind) {
    case "OCCUPANT": return `${g} ${n}ஆம் இடமான ${sign}-இல் உள்ளது (${q}).`;
    case "LORD": return `${n}ஆம் அதிபதி ${g}, ${f.house}ஆம் இடமான ${sign}-இல் உள்ளது (${q}).`;
    case "KARAKA": return `${g} ${f.house}ஆம் இடமான ${sign}-இல் உள்ளது (${q}).`;
    case "INFLUENCE":
    case "BENEFIC_ASPECT":
      if (f.target === "KARAKA") return `${g} குருவுடன் ${sign}-இல் சேர்ந்துள்ளது (${q}).`;
      return f.via === "CONJUNCT" ? `${g} ${n}ஆம் அதிபதியுடன் ${sign}-இல் சேர்ந்துள்ளது (${q}).` : `${g} ${sign}-இலிருந்து ${lordTa} பார்க்கிறது (${q}).`;
    case "D7_LORD": return `சப்தாம்சத்தில் 5ஆம் அதிபதி ${g}, ${f.house}ஆம் இடமான ${sign}-இல் உள்ளது (${q}).`;
    case "D7_KARAKA": return `சப்தாம்சத்தில் ${g} ${f.house}ஆம் இடமான ${sign}-இல் உள்ளது (${q}).`;
    default: return `சப்தாம்சத்தின் 5ஆம் இடமான ${sign}-இல் ${g} உள்ளது (${q}).`;
  }
}

/** The line's mark, "" for context. */
export function progenyBearing(f: ProgenyFactor, lang: Lang): string {
  if (f.bearing === "SUPPORTIVE") return lang === "en" ? "supportive" : "சாதகம்";
  if (f.bearing === "CHALLENGING") return lang === "en" ? "challenging" : "சவால்";
  return "";
}

/** "Same placement as counted in …": the shared placement, said once. */
export function progenyAlsoCounted(f: ProgenyFactor, lang: Lang): string {
  const names: Record<string, [string, string]> = {
    PUTRA_SARPA_DOSHAM: ["Putra Sarpa dosham", "புத்ர சர்ப்ப தோஷம்"],
    SANTHANA_THADAI: ["Santhana Thadai", "புத்திர தடை"],
  };
  const list = f.alsoCountedIn.map((k) => (names[k] ?? [k, k])[lang === "en" ? 0 : 1]);
  if (!list.length) return "";
  return lang === "en"
    ? `The same placement is counted in ${list.join(" and ")}; it is one finding, not two.`
    : `இதே நிலை ${list.join(", ")}-இலும் கணக்கிடப்பட்டுள்ளது; இது இரண்டு தனிக் குறிப்புகள் அல்ல.`;
}

/** Shown when no gender is stated: the 9th was not read. "" otherwise. */
export function progenyNinthNotApplied(r: ProgenyReading, lang: Lang): string {
  if (r.ninth !== "NOT_APPLIED") return "";
  return lang === "en"
    ? "In a woman's chart the 9th is also read for children. No gender is stated, so the 9th was not read."
    : "பெண் ஜாதகத்தில் 9ஆம் இடமும் குழந்தைப் பேற்றுக்குப் பார்க்கப்படும். பாலினம் குறிப்பிடப்படாததால் 9ஆம் இடம் பார்க்கப்படவில்லை.";
}

export function progenyD7Note(r: ProgenyReading, lang: Lang): string {
  if (r.d7Note === "D7_LAGNA_UNRELIABLE") {
    return lang === "en"
      ? "Saptamsa (D7) lines are left out: the birth time cannot fix the D7 lagna."
      : "சப்தாம்சக் (D7) குறிப்புகள் சேர்க்கப்படவில்லை: பிறந்த நேரத்தால் சப்தாம்ச லக்னத்தை உறுதி செய்ய முடியவில்லை.";
  }
  if (r.d7Note === "D7_UNAVAILABLE") {
    return lang === "en" ? "Saptamsa (D7) lines are not available for this chart." : "இந்த ஜாதகத்துக்குச் சப்தாம்சக் (D7) குறிப்புகள் கிடைக்கவில்லை.";
  }
  return "";
}

/** The joint layer: a pattern, never a sum. */
export function progenyJointLine(key: JointProgeny["joint"][number]["key"], pattern: JointProgeny["joint"][number]["pattern"], lang: Lang): string {
  const en = {
    FIFTH_HOUSE: {
      BOTH: "In both charts a malefic sits in the 5th, outside its own sign. Read the two together with your astrologer.",
      ONE: "In one chart a malefic sits in the 5th, outside its own sign; in the other none does.",
      NEITHER: "In neither chart does a malefic sit in the 5th outside its own sign.",
    },
    FIFTH_LORD: {
      BOTH: "In both charts the 5th lord is marked challenging, by its own placement or by a malefic with it. Read the two together with your astrologer.",
      ONE: "In one chart the 5th lord is marked challenging; in the other it is not.",
      NEITHER: "In neither chart is the 5th lord marked challenging.",
    },
    JUPITER: {
      BOTH: "In both charts Jupiter is marked challenging, by its own placement or by a malefic with it. Read the two together with your astrologer.",
      ONE: "In one chart Jupiter is marked challenging; in the other it is not.",
      NEITHER: "In neither chart is Jupiter marked challenging.",
    },
  };
  const ta = {
    FIFTH_HOUSE: {
      BOTH: "இரண்டு ஜாதகங்களிலும் 5ஆம் இடத்தில் பாவக் கிரகம் உள்ளது (அதன் சொந்த ராசி அல்ல). இரண்டையும் சேர்த்து ஜோதிடரிடம் பார்க்கவும்.",
      ONE: "ஒரு ஜாதகத்தில் 5ஆம் இடத்தில் பாவக் கிரகம் உள்ளது (அதன் சொந்த ராசி அல்ல); மற்றதில் இல்லை.",
      NEITHER: "இரண்டு ஜாதகங்களிலும் 5ஆம் இடத்தில் சொந்த ராசி அல்லாத பாவக் கிரகம் இல்லை.",
    },
    FIFTH_LORD: {
      BOTH: "இரண்டு ஜாதகங்களிலும் 5ஆம் அதிபதி சவால் எனக் குறிக்கப்பட்டுள்ளது: அதன் நிலையாலோ, உடன் உள்ள பாவக் கிரகத்தாலோ. இரண்டையும் சேர்த்து ஜோதிடரிடம் பார்க்கவும்.",
      ONE: "ஒரு ஜாதகத்தில் 5ஆம் அதிபதி சவால் எனக் குறிக்கப்பட்டுள்ளது; மற்றதில் இல்லை.",
      NEITHER: "இரண்டு ஜாதகங்களிலும் 5ஆம் அதிபதி சவால் எனக் குறிக்கப்படவில்லை.",
    },
    JUPITER: {
      BOTH: "இரண்டு ஜாதகங்களிலும் குரு சவால் எனக் குறிக்கப்பட்டுள்ளார்: அவரது நிலையாலோ, உடன் உள்ள பாவக் கிரகத்தாலோ. இரண்டையும் சேர்த்து ஜோதிடரிடம் பார்க்கவும்.",
      ONE: "ஒரு ஜாதகத்தில் குரு சவால் எனக் குறிக்கப்பட்டுள்ளார்; மற்றதில் இல்லை.",
      NEITHER: "இரண்டு ஜாதகங்களிலும் குரு சவால் எனக் குறிக்கப்படவில்லை.",
    },
  };
  return (lang === "en" ? en : ta)[key][pattern];
}

export function progenyTimingHeading(lang: Lang): string {
  return lang === "en" ? "Periods running for both" : "இருவருக்கும் ஒரே நேரத்தில் நடக்கும் காலங்கள்";
}

export function progenyTimingIntro(j: JointProgeny, lang: Lang): string {
  return lang === "en"
    ? `Bhuktis of each chart's timing lords for children that run at the same time, over the next ${j.horizonYears} years (${j.horizonStart} to ${j.horizonEnd}). These are dates for your astrologer to read, not predictions.`
    : `அடுத்த ${j.horizonYears} ஆண்டுகளில் (${j.horizonStart} முதல் ${j.horizonEnd} வரை) இருவருக்கும் ஒரே நேரத்தில் நடக்கும், குழந்தைப் பேற்றைக் குறிக்கும் கிரகங்களின் புக்திகள். இவை ஜோதிடர் பார்க்க வேண்டிய தேதிகள்; கணிப்புகள் அல்ல.`;
}

/** Shown in place of the windows when there are none, or when dates are withheld. */
export function progenyTimingEmpty(j: JointProgeny, lang: Lang): string {
  if (j.timingNote === "AGE_OUTSIDE_RANGE") {
    return lang === "en"
      ? "Dates are not listed: they are given only when both partners are between 18 and 50."
      : "தேதிகள் காட்டப்படவில்லை: இருவரும் 18 முதல் 50 வயதுக்குள் இருக்கும்போது மட்டுமே இவை தரப்படும்.";
  }
  if (j.windows.length) return "";
  return lang === "en"
    ? `No bhukti of a timing lord runs for both in the next ${j.horizonYears} years.`
    : `அடுத்த ${j.horizonYears} ஆண்டுகளில் இருவருக்கும் ஒரே நேரத்தில் இத்தகைய புக்தி இல்லை.`;
}

const ROLE: Record<ProgenyTimingRole, [string, string]> = {
  FIFTH_LORD: ["5th lord", "5ஆம் அதிபதி"],
  JUPITER: ["putra karaka", "புத்திர காரகர்"],
  FIFTH_OCCUPANT: ["in the 5th", "5ஆம் இடத்தில்"],
  FIFTH_FROM_JUPITER_LORD: ["lord of the 5th from Jupiter", "குருவிலிருந்து 5ஆம் அதிபதி"],
  FIFTH_LORD_DISPOSITOR: ["dispositor of the 5th lord", "5ஆம் அதிபதி நிற்கும் ராசியின் அதிபதி"],
  NINTH_LORD: ["9th lord", "9ஆம் அதிபதி"],
  NINTH_OCCUPANT: ["in the 9th", "9ஆம் இடத்தில்"],
};

export function progenyRoles(roles: ProgenyTimingRole[], lang: Lang): string {
  return roles.map((r) => ROLE[r][lang === "en" ? 0 : 1]).join(", ");
}

/** One window: dates, then each partner's maha / bhukti and why the bhukti lord counts. */
export function progenyWindowLine(w: ProgenyWindow, nameA: string, nameB: string, lang: Lang): string {
  const p = (maha: string, lord: string) => `${tPlanetLord(maha, lang)} / ${tPlanetLord(lord, lang)}`;
  return lang === "en"
    ? `${w.start} to ${w.end}: ${nameA}, ${p(w.mahaA, w.lordA)} (${progenyRoles(w.rolesA, lang)}); ${nameB}, ${p(w.mahaB, w.lordB)} (${progenyRoles(w.rolesB, lang)}).`
    : `${w.start} முதல் ${w.end} வரை: ${nameA}, ${p(w.mahaA, w.lordA)} (${progenyRoles(w.rolesA, lang)}); ${nameB}, ${p(w.mahaB, w.lordB)} (${progenyRoles(w.rolesB, lang)}).`;
}
