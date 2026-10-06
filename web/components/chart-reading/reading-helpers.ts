// Pure helpers for the chart reading (FTR-05). Moved verbatim from
// dashboard-chart-explanation.tsx so the Story and Astrologer views share one
// vocabulary — no React here, safe to import from either view or a test.

import { formatDateLabel } from "@/lib/format";
import { rasiLabel } from "@/lib/chart-utils";
import { tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ChartCalculateResponseData, ChartPlanet, TransitSnapshotData } from "@/lib/types";

import {
  type BiCopy,
  type RelationshipTone,
  KENDRA_HOUSES,
  TRIKONA_HOUSES,
  DUSTHANA_HOUSES,
  EXALTATION_RASI,
  DEBILITATION_RASI,
  MOOLATRIKONA_ZONE,
  OWN_SIGN_RASI,
  SIGN_LORD,
  NATURAL_FRIENDS,
  NATURAL_ENEMIES,
  HOUSE_MEANING,
} from "../dashboard-chart-explanation-data";

export function tx(copy: BiCopy, lang: Lang): string {
  return copy[lang];
}

export function rasiName(rasi: number | null | undefined, lang: Lang): string {
  if (!rasi) return lang === "ta" ? "தெரியவில்லை" : "Unknown";
  return rasiLabel(rasi, lang);
}

export function ordinalHouse(house: number, lang: Lang): string {
  return lang === "ta" ? `${house}-ஆம் வீடு` : `House ${house}`;
}

export function displayPlanet(graha: string, lang: Lang): string {
  const key = graha.toUpperCase() === "SANI" ? "SATURN" : graha.toUpperCase() === "GURU" ? "JUPITER" : graha;
  return tPlanetLord(key, lang) || graha;
}

/**
 * Renders the engine's `aspectType` as a phrase instead of an internal constant.
 *
 * The backend (`_aspect_type` in chart_explanation_service.py) emits stable
 * machine keys — "STANDARD_7TH", "MARS_SPECIAL_4TH", "RAHU_SPECIAL_5TH" — and
 * the chip printed them verbatim, so users read raw enum names in the drishti
 * list. The keys stay as-is in the payload (they are a contract); only the
 * rendering changes.
 *
 * The source planet is already named in the chip ("Mars looks at Jupiter"), so
 * the label deliberately omits it and says "special 4th aspect", not
 * "Mars 4th special aspect" — otherwise the graha appears twice in one line.
 */
/** English ordinal for a house number (1st, 2nd, 3rd, 4th … 11th, 12th). */
export function ordinalSuffix(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

export function aspectTypeLabel(aspectType: string, lang: Lang): string {
  if (aspectType === "STANDARD_7TH") {
    return lang === "ta" ? "7-ஆம் பார்வை" : "7th aspect";
  }
  const special = /^[A-Z]+_SPECIAL_(\d+)TH$/.exec(aspectType);
  if (special) {
    const n = Number(special[1]);
    // The engine key always ends in a literal "TH" (it is a machine constant,
    // not prose), so the ordinal has to be rebuilt here. Hardcoding "th" gave
    // "special 3th aspect" — and Saturn's 3rd aspect is one of the most common
    // special drishtis in any chart.
    return lang === "ta" ? `சிறப்பு ${n}-ஆம் பார்வை` : `special ${ordinalSuffix(n)} aspect`;
  }
  // Unknown shape: degrade to a readable phrase rather than shouting an enum.
  return aspectType.toLowerCase().replaceAll("_", " ");
}

export function normalizePlanet(graha: string): string {
  if (graha.toUpperCase() === "GURU") return "JUPITER";
  if (graha.toUpperCase() === "SANI") return "SATURN";
  return graha.toUpperCase();
}

export function strengthColor(score: number | undefined): string {
  if (score === undefined) return "var(--color-faint)";
  if (score >= 70) return "var(--color-score-high, var(--chart-d9-active))";
  if (score >= 45) return "var(--color-score-mid)";
  return "var(--color-score-low, var(--planet-saturn))";
}

export function strengthLabel(score: number | undefined, lang: Lang): string {
  if (score === undefined) return lang === "ta" ? "பலம் இல்லை" : "No score";
  if (score >= 70) return lang === "ta" ? "வலுவானது" : "Strong";
  if (score >= 45) return lang === "ta" ? "மிதமானது" : "Moderate";
  return lang === "ta" ? "ஆதரவு தேவை" : "Needs support";
}

export function dignityFor(planet: ChartPlanet, lang: Lang): string {
  const graha = normalizePlanet(planet.graha);
  const mt = MOOLATRIKONA_ZONE[graha];

  if (DEBILITATION_RASI[graha] === planet.rasi) {
    return lang === "ta" ? "நீசம் - மெதுவாக சமநிலைப்படுத்த வேண்டியது" : "Debilitated - needs steady support";
  }
  if (EXALTATION_RASI[graha] === planet.rasi) {
    return lang === "ta" ? "உச்சம் - இயல்பான பலம் அதிகம்" : "Exalted - naturally strong";
  }
  if (mt && mt.rasi === planet.rasi && planet.degreeInRasi >= mt.start && planet.degreeInRasi < mt.end) {
    return lang === "ta" ? "மூலத்திரிகோணம் - தெளிவான சக்தி" : "Moolatrikona - focused strength";
  }
  if ((OWN_SIGN_RASI[graha] ?? []).includes(planet.rasi)) {
    return lang === "ta" ? "சொந்த ராசி - நிலையான பலம்" : "Own sign - stable strength";
  }

  const lord = SIGN_LORD[planet.rasi];
  if (lord && (NATURAL_FRIENDS[graha] ?? []).includes(lord)) {
    return lang === "ta" ? "நட்பு ராசி - ஆதரவு சூழல்" : "Friendly sign - supportive setting";
  }
  if (lord && (NATURAL_ENEMIES[graha] ?? []).includes(lord)) {
    return lang === "ta" ? "பகை ராசி - கவனமான கையாளல் தேவை" : "Enemy sign - handle with care";
  }
  return lang === "ta" ? "சம ராசி - கலந்த பலம்" : "Neutral sign - mixed strength";
}

export function planetFlags(planet: ChartPlanet, lang: Lang): string[] {
  const flags: string[] = [];
  if (planet.isRetrograde) flags.push(lang === "ta" ? "வக்கிரம்" : "Retrograde");
  if (planet.isCombust) flags.push(lang === "ta" ? "அஸ்தம்" : "Combust");
  if (planet.isVargottama) flags.push(lang === "ta" ? "வர்கோத்தமம்" : "Vargottama");
  return flags;
}

export function relationshipBetween(a: string, b: string): RelationshipTone {
  const aa = normalizePlanet(a);
  const bb = normalizePlanet(b);
  if ((NATURAL_ENEMIES[aa] ?? []).includes(bb) || (NATURAL_ENEMIES[bb] ?? []).includes(aa)) {
    return "hostile";
  }
  if ((NATURAL_FRIENDS[aa] ?? []).includes(bb) || (NATURAL_FRIENDS[bb] ?? []).includes(aa)) {
    return "friendly";
  }
  return "neutral";
}

export function normalizeRelationshipTone(tone: string): RelationshipTone {
  const key = tone.toLowerCase();
  if (key === "friendly" || key === "hostile") return key;
  return "neutral";
}

export function relationshipLabel(tone: string, lang: Lang): string {
  const key = normalizeRelationshipTone(tone);
  if (key === "friendly") return lang === "ta" ? "நட்பு கூட்டம்" : "Friendly company";
  if (key === "hostile") return lang === "ta" ? "கவனத்துடன் கையாள வேண்டிய கூட்டம்" : "Company needing care";
  return lang === "ta" ? "சமநிலை கூட்டம்" : "Neutral company";
}

export function relationshipColor(tone: string): string {
  const key = normalizeRelationshipTone(tone);
  if (key === "friendly") return "var(--color-score-high, var(--chart-d9-active))";
  if (key === "hostile") return "var(--color-score-low, var(--planet-saturn))";
  return "var(--color-score-mid)";
}

export function periodLevelLabel(level: string, lang: Lang): string {
  if (level === "MAHADASHA") return lang === "ta" ? "மகாதசை" : "Mahadasa";
  if (level === "BHUKTI") return lang === "ta" ? "புக்தி" : "Bhukti";
  if (level === "ANTARAM") return lang === "ta" ? "அந்தரம்" : "Antaram";
  return level;
}

export function activationToneLabel(tone: string, lang: Lang): string {
  if (tone === "SUPPORT") return lang === "ta" ? "ஆதரவு" : "Support";
  if (tone === "CAUTION") return lang === "ta" ? "கவனம்" : "Care";
  return lang === "ta" ? "சமநிலை" : "Steady";
}

export function activationToneColor(tone: string): string {
  if (tone === "SUPPORT") return "var(--color-score-high, var(--chart-d9-active))";
  if (tone === "CAUTION") return "var(--color-score-low, var(--planet-saturn))";
  return "var(--color-score-mid)";
}

export function signalTypeLabel(signalType: string, lang: Lang): string {
  if (signalType === "DASHA_LORD_RETURN") return lang === "ta" ? "சுய ராசி கோச்சாரம்" : "Natal sign return";
  if (signalType === "TRANSIT_RETURN") return lang === "ta" ? "சுய ராசிக்கு திரும்புதல்" : "Return to its own natal sign";
  if (signalType === "TRANSIT_CONJUNCTION") return lang === "ta" ? "கோச்சார சேர்க்கை" : "Transit conjunction";
  if (signalType.startsWith("TRANSIT_ASPECT_")) return lang === "ta" ? "கோச்சார பார்வை" : "Transit aspect";
  return signalType.replaceAll("_", " ");
}

/** Rahu and Ketu — perpetually retrograde, so the vakra badge says nothing. */
export const NODES = new Set(["RAHU", "KETU"]);

export function groupRelationship(planets: ChartPlanet[]): RelationshipTone {
  let hasFriendly = false;
  for (let i = 0; i < planets.length; i += 1) {
    for (let j = i + 1; j < planets.length; j += 1) {
      const tone = relationshipBetween(planets[i].graha, planets[j].graha);
      if (tone === "hostile") return "hostile";
      if (tone === "friendly") hasFriendly = true;
    }
  }
  return hasFriendly ? "friendly" : "neutral";
}

export function conjunctionGroups(chart: ChartCalculateResponseData): Array<{ rasi: number; planets: ChartPlanet[]; tone: RelationshipTone }> {
  const grouped = new Map<number, ChartPlanet[]>();
  chart.planets.forEach((planet) => {
    const existing = grouped.get(planet.rasi) ?? [];
    grouped.set(planet.rasi, [...existing, planet]);
  });
  return Array.from(grouped.entries())
    .filter(([, planets]) => planets.length >= 2)
    .map(([rasi, planets]) => ({ rasi, planets, tone: groupRelationship(planets) }))
    .sort((a, b) => a.rasi - b.rasi);
}

export function mutualSeventhAspects(planets: ChartPlanet[]): Array<{ a: ChartPlanet; b: ChartPlanet }> {
  const aspects: Array<{ a: ChartPlanet; b: ChartPlanet }> = [];
  for (let i = 0; i < planets.length; i += 1) {
    for (let j = i + 1; j < planets.length; j += 1) {
      const diff = Math.abs(planets[i].houseFromLagna - planets[j].houseFromLagna);
      if (diff === 6) aspects.push({ a: planets[i], b: planets[j] });
    }
  }
  return aspects;
}

export function aspectHousesFromHouse(house: number, offsets: number[]): number[] {
  return offsets.map((offset) => ((house - 1 + offset) % 12) + 1);
}

// Issue #3: the transit Guru/Sani block used to print bare house numbers with no
// interpretation, which read as if it contradicted the natal chart. It is actually
// where Guru/Sani are transiting *right now*. Spell that out and say what the
// aspect does to the touched life areas.
//
// Gochara frame (2026-07-18 astrologer review): Tamil Thirukkanitham peyarchi
// practice — Guru Peyarchi, Sani Peyarchi — is reckoned from the Janma Rasi
// (Moon sign), not the Lagna. This copy led with the Lagna house, which reads as
// non-traditional to the audience this product is for. It now leads with the
// house from Chandra and keeps the Lagna house as a secondary clause.
//
// The two frames answer different questions and both are kept deliberately:
// the Moon house is the peyarchi verdict ("is this transit good for me?"),
// while the aspect houses below are reckoned from Lagna because they are used
// to find which *natal* planets the transit aspects — a whole-sign question
// about the birth chart, not about the peyarchi reading.
export function transitAspectSummary(
  graha: string,
  currentHouse: number,
  houseFromMoon: number | null,
  houses: number[],
  lang: Lang,
): string {
  const themes = houses.map((h) => tx(HOUSE_MEANING[h], lang)).join("; ");
  const houseList = houses.map((h) => ordinalHouse(h, lang)).join(", ");

  // Lead with Janma Rasi when we have it; fall back to the Lagna-only sentence
  // rather than inventing a Moon house we were not given.
  //
  // The Tamil deliberately does NOT reuse `ordinalHouse` here. That helper
  // renders "N-ஆம் வீடு", but for a transiting graha native review preferred
  // இடம் ("place") over வீடு ("house"), with the leading clause in the locative
  // (இடத்தில்) and the trailing one in the nominative (இடம்) — T-38/T-39,
  // 2026-07-18. `ordinalHouse` is left alone because the natal-chart surfaces
  // that use it were reviewed as correct.
  // Both frames are joined with the correlative -உம் … -உம் ("both in X and in
  // Y"), which keeps a single locative verb (சஞ்சரிக்கிறார்) governing both.
  // The reviewed fragment used an em-dash aside ending in the nominative
  // ("… — லக்னத்திலிருந்து 10-ஆம் இடம்"), which left the verb attached to the
  // aside and read wrong once interpolated. The correlative keeps the Moon
  // frame first, as Tamil peyarchi practice requires, without the dash.
  const seatTa =
    houseFromMoon != null
      ? `உங்கள் ஜென்ம ராசியிலிருந்து (சந்திரன்) ${houseFromMoon}-ஆம் இடத்திலும், லக்னத்திலிருந்து ${currentHouse}-ஆம் இடத்திலும்`
      : `உங்கள் லக்னத்திலிருந்து ${currentHouse}-ஆம் இடத்தில்`;
  const seatEn =
    houseFromMoon != null
      ? `${ordinalHouse(houseFromMoon, "en")} from your Janma Rasi (Moon) — and ${ordinalHouse(currentHouse, "en")} from your Lagna`
      : `${ordinalHouse(currentHouse, "en")} from your Lagna`;

  if (graha === "JUPITER") {
    return lang === "ta"
      ? `குரு இப்போது ${seatTa} சஞ்சரிக்கிறார் — இது இன்றைய வானநிலை, உங்கள் பிறப்பு நிலை அல்ல. அவரது பார்வை ${houseList} வீடுகளை ஆதரவாகத் தொடுகிறது (${themes}). இந்தத் துறைகளில் வளர்ச்சி, வாய்ப்பு, நம்பிக்கை பெருகும் காலம்.`
      : `Guru (Jupiter) is transiting ${seatEn} right now — this is today's sky, not your birth position. Its aspect falls supportively on ${houseList} (${themes}). Growth, opportunity, and confidence tend to build in those areas while this lasts.`;
  }
  return lang === "ta"
    ? `சனி இப்போது ${seatTa} சஞ்சரிக்கிறார் — இது இன்றைய வானநிலை, உங்கள் பிறப்பு நிலை அல்ல. அவரது பார்வை ${houseList} வீடுகளைத் தொடுகிறது (${themes}). இந்தத் துறைகளில் பொறுப்பு, பொறுமை, மெதுவான வேகம் தேவை; ஒழுங்கு உதவும்.`
    : `Sani (Saturn) is transiting ${seatEn} right now — today's sky, not your birth position. Its aspect falls on ${houseList} (${themes}). Those areas ask for responsibility, patience, and a slower pace; steady, disciplined effort pays off.`;
}

// Bilingual life-signification of each natal planet — used to explain what it
// means when a transit touches it, not just its bare name (issue #3).
export const PLANET_SIGNIFICANCE: Record<string, BiCopy> = {
  SUN: { ta: "தந்தை, அதிகாரம், நம்பிக்கை, ஆரோக்கியம்", en: "father, authority, confidence, health" },
  MOON: { ta: "மனம், தாய், உணர்வுகள், பொது அபிப்ராயம்", en: "mind, mother, emotions, public image" },
  MARS: { ta: "துணிவு, உடன்பிறப்புகள், சொத்து, ஆற்றல்", en: "courage, siblings, property, drive" },
  MERCURY: { ta: "தொடர்பு, வணிகம், புத்தி, கல்வி", en: "communication, business, intellect, education" },
  JUPITER: { ta: "ஞானம், செல்வம், குழந்தைகள், குரு", en: "wisdom, wealth, children, teachers/guru" },
  VENUS: { ta: "உறவுகள், திருமணம், ஆடம்பரம், கலை", en: "relationships, marriage, comfort, the arts" },
  SATURN: { ta: "ஒழுங்கு, தொழில், நீண்டகால பொறுப்பு", en: "discipline, career, long-term responsibility" },
  RAHU: { ta: "ஆசை, வெளிநாடு, தொழில்நுட்பம், துணிச்சல்", en: "ambition, foreign links, technology, risk-taking" },
  KETU: { ta: "பற்றின்மை, ஆன்மீகம், முந்தைய திறமைகள்", en: "detachment, spirituality, past-life talents" },
};

// Implication + a simple traditional remedy for a transiting Guru/Sani aspect
// landing on a natal planet — mirrors chart_explanation_service.py's
// _TRANSIT_EFFECT/_TRANSIT_REMEDY so the explanation reads consistently whether
// it comes from the backend or this client-only panel.
export const TRANSIT_TOUCH_EFFECT: Record<"JUPITER" | "SATURN", BiCopy> = {
  JUPITER: {
    ta: "வளர்ச்சி, வாய்ப்பு, ஆசீர்வாதத்தைக் கொண்டு வரும்",
    en: "brings growth, opportunity, and blessings",
  },
  SATURN: {
    ta: "பொறுப்பையும் சோதனையையும் கொண்டு வரும்; பொறுமையுடன் அணுகினால் நீடித்த பலன் கிடைக்கும்",
    en: "brings responsibility and testing; a patient approach here holds up better than pushing",
  },
};
export const TRANSIT_TOUCH_REMEDY: Record<"JUPITER" | "SATURN", BiCopy> = {
  JUPITER: {
    ta: "வியாழக்கிழமை குரு/விஷ்ணு வழிபாடு, மஞ்சள் நிற பொருள் தானம் உதவும்.",
    en: "Thursday prayer to Guru/Vishnu and offering yellow items are traditional supports.",
  },
  SATURN: {
    ta: "சனிக்கிழமை எள் எண்ணெய் விளக்கேற்றுவது, முதியோர்/ஏழைகளுக்கு உதவுவது நல்லது.",
    en: "A sesame-oil lamp for Shani on Saturdays and serving elders or those in need are traditional supports.",
  },
};

export function touchedPlanetMeaning(sourceGraha: "JUPITER" | "SATURN", touchedGraha: string, lang: Lang): string {
  const touched = normalizePlanet(touchedGraha);
  const sig = PLANET_SIGNIFICANCE[touched];
  const effect = TRANSIT_TOUCH_EFFECT[sourceGraha];
  const remedy = TRANSIT_TOUCH_REMEDY[sourceGraha];
  const sigText = sig ? tx(sig, lang) : "";
  return lang === "ta"
    ? `${displayPlanet(touched, lang)} (${sigText}) தொடர்பான விஷயங்களில் இது ${effect.ta}. ${remedy.ta}`
    : `For matters tied to ${displayPlanet(touched, lang)} (${sigText}), this ${effect.en}. ${remedy.en}`;
}

export function houseGroupFor(house: number): "kendra" | "trikona" | "dusthana" | "other" {
  if (DUSTHANA_HOUSES.has(house)) return "dusthana";
  if (KENDRA_HOUSES.has(house) && TRIKONA_HOUSES.has(house)) return "kendra";
  if (KENDRA_HOUSES.has(house)) return "kendra";
  if (TRIKONA_HOUSES.has(house)) return "trikona";
  return "other";
}

export function normalizeHouseGroup(group: string): "kendra" | "trikona" | "dusthana" | "other" {
  const key = group.toLowerCase();
  // The lagna arrives as KENDRA_TRIKONA; without this a planet in the 1st house
  // was chipped "Other". Kendra wins, matching houseGroupFor above.
  if (key === "kendra_trikona") return "kendra";
  if (key === "kendra" || key === "trikona" || key === "dusthana") return key;
  return "other";
}

export function houseGroupLabel(group: string, lang: Lang): string {
  const key = normalizeHouseGroup(group);
  if (key === "kendra") return lang === "ta" ? "கேந்திரம்" : "Kendra";
  if (key === "trikona") return lang === "ta" ? "திரிகோணம்" : "Trikona";
  if (key === "dusthana") return lang === "ta" ? "துஷ்டானம்" : "Dusthana";
  return lang === "ta" ? "மற்ற வீடு" : "Other";
}

// Issue #4/#5: house-group taxonomy was shown with no "so what". These turn a
// planet + its house group into one plain-language line about what it means for
// that person's life area.
export function houseGroupEffect(group: "kendra" | "trikona" | "dusthana" | "other", lang: Lang): string {
  if (group === "kendra")
    return lang === "ta"
      ? "வெளிப்படையான வாழ்க்கைத் தூண் — இந்தத் துறை பொதுவாகச் சுறுசுறுப்பாக, மற்றவர்களுக்குத் தெரியும்படி இயங்கும்"
      : "a visible pillar of life — this area tends to stay active and public";
  if (group === "trikona")
    return lang === "ta"
      ? "வளர்ச்சி வழி — திறமையும் புண்ணியமும் இந்தத் துறையை இயல்பாக ஆதரிக்கும்"
      : "a growth channel — talent and grace naturally support this area";
  if (group === "dusthana")
    return lang === "ta"
      ? "கவனமும் ஒழுங்கும் கேட்கும் இடம் — சேவை, ஓய்வு, திருத்தம் மூலம் வளரும்"
      : "asks for care and discipline — it grows through service, rest, and correction";
  return lang === "ta"
    ? "சூழ்நிலையும் காலமும் சார்ந்து பலன் தரும் துறை"
    : "an area that works through timing and context";
}

export function planetHouseMeaning(graha: string, house: number, lang: Lang): string {
  const group = houseGroupFor(house);
  return lang === "ta"
    ? `${displayPlanet(graha, lang)} — ${ordinalHouse(house, lang)} (${tx(HOUSE_MEANING[house], lang)}); ${houseGroupEffect(group, lang)}.`
    : `${displayPlanet(graha, lang)} — ${ordinalHouse(house, lang)} (${tx(HOUSE_MEANING[house], lang)}); ${houseGroupEffect(group, lang)}.`;
}

export function natureLabel(nature: string, lang: Lang): string {
  const labels: Record<string, BiCopy> = {
    LAGNA_LORD: { ta: "லக்னாதிபதி", en: "Lagna lord" },
    YOGAKARAKA: { ta: "யோககாரகன்", en: "Yogakaraka" },
    TRIKONA: { ta: "திரிகோண ஆதரவு", en: "Trikona support" },
    KENDRA: { ta: "கேந்திர பங்கு", en: "Kendra role" },
    MARAKA: { ta: "மாரக பங்கு", en: "Maraka role" },
    DUSTHANA: { ta: "துஷ்டான பங்கு", en: "Dusthana role" },
    NEUTRAL: { ta: "நடுநிலை", en: "Neutral" },
  };
  return tx(labels[nature] ?? { ta: nature.replaceAll("_", " "), en: nature.replaceAll("_", " ") }, lang);
}

export function natureNote(nature: string, lang: Lang): string {
  const notes: Record<string, BiCopy> = {
    LAGNA_LORD: {
      ta: "இந்த கிரகம் உடல், முடிவு, தனிப்பட்ட திசை ஆகியவற்றை அதிகமாக சுட்டுகிறது.",
      en: "This planet strongly points to identity, choices, and personal direction.",
    },
    YOGAKARAKA: {
      ta: "இந்த லக்னத்திற்கு இது நன்மை தரும் முக்கிய ஆதரவு கிரகமாக கருதப்படுகிறது.",
      en: "For this Lagna, this is treated as a key supportive planet.",
    },
    TRIKONA: {
      ta: "திறமை, புண்ணியம், வளர்ச்சி வழிகளை ஆதரிக்கும் பங்கு.",
      en: "Supports talent, grace, and growth pathways.",
    },
    KENDRA: {
      ta: "வாழ்க்கையின் வெளிப்படைத் தூண்களில் செயல்படும் பங்கு.",
      en: "Acts through visible pillars of life.",
    },
    MARAKA: {
      ta: "அவசரம் இல்லாமல், கவனமாக கையாள வேண்டிய பங்கு.",
      en: "A role to handle steadily and carefully.",
    },
    DUSTHANA: {
      ta: "ஒழுங்கு, சேவை, திருத்தம் மூலம் சமநிலைப்படுத்த வேண்டிய பங்கு.",
      en: "A role balanced through discipline, service, and correction.",
    },
    NEUTRAL: {
      ta: "இந்த லக்னத்திற்கு கலந்த பங்கு — வீடு, பலம், பார்வை சேர்ந்து முடிவை தரும்.",
      en: "A mixed role for this Lagna — its house, strength, and aspects together decide the result.",
    },
  };
  return tx(notes[nature] ?? notes.NEUTRAL, lang);
}

export function classifySaniFromMoon(house: number | null | undefined): BiCopy {
  if (house === 12) {
    return {
      ta: "ஏழரை சனி தொடக்க நிலை: செலவு, ஓய்வு, ஆன்மீக மறுசீரமைப்பு முக்கியம்.",
      en: "Sade Sati beginning: expenses, rest, and spiritual restructuring are emphasized.",
    };
  }
  if (house === 1) {
    return {
      ta: "ஜன்ம சனி / ஏழரை சனி மையம்: பொறுப்பு, மன உறுதி, நீண்டகால மாற்றம் முக்கியம்.",
      en: "Janma Sani / Sade Sati peak: responsibility, resilience, and long-term change are emphasized.",
    };
  }
  if (house === 2) {
    return {
      ta: "ஏழரை சனி முடிவு நிலை: பணம், பேச்சு, குடும்ப ஒழுங்கில் கவனம் உதவும்.",
      en: "Sade Sati ending: care with money, speech, and family order helps.",
    };
  }
  if (house === 4) {
    return {
      ta: "அர்த்தாஷ்டம சனி: வீடு, மன அமைதி, குடும்ப பொறுப்புகளை மெதுவாக சீரமைக்கும் காலம்.",
      en: "Ardhashtama Sani: home, inner peace, and family responsibilities need patient restructuring.",
    };
  }
  if (house === 8) {
    return {
      ta: "அஷ்டம சனி: ஓய்வு, திட்டமிடல், உடல் பழக்கங்களில் கவனம் உதவும்.",
      en: "Ashtama Sani: rest, planning, and care with body routines are supportive.",
    };
  }
  return {
    ta: "சனி நிலை பொதுவாக பொறுப்பு, ஒழுங்கு, நீண்டகால திட்டம் ஆகியவற்றை வலியுறுத்துகிறது.",
    en: "Saturn's position mainly emphasizes responsibility, discipline, and long-term planning.",
  };
}

// Kandaka Sani: 4/7/10 from the Janma Rasi (doctrine A-1, ruled 2026-08-19).
// Not the kendra set and not counted from the Lagna — the 1st belongs to Janma
// Sani, and the reference is the Moon. This reading deliberately layers over
// `classifySaniFromMoon` rather than replacing it: the 4th from the Moon is
// both Ardhashtama Sani and Kandaka Sani, and the reader should be told both.
export const KANDAKA_HOUSES_FROM_MOON = new Set([4, 7, 10]);

export function classifyKandakaFromMoon(house: number | null | undefined): BiCopy | null {
  if (!house || !KANDAKA_HOUSES_FROM_MOON.has(house)) return null;
  return {
    ta: "ஜென்ம ராசியிலிருந்து கண்டக சனி: முயற்சிகளில் தடைகள் வரலாம்; பொறுமையும் தொடர் முயற்சியும் தேவை.",
    en: "Kandaka Sani from the Janma Rasi: effort meets obstruction — patience and persistence are what carry it.",
  };
}

export function guruMoonQuality(house: number): "supportive" | "care" | "steady" {
  if ([2, 5, 7, 9, 11].includes(house)) return "supportive";
  if ([6, 8, 12].includes(house)) return "care";
  return "steady";
}

export function guruQualityCopy(quality: "supportive" | "care" | "steady", lang: Lang): string {
  if (quality === "supportive") {
    return lang === "ta"
      ? "சந்திர ராசியிலிருந்து இது ஆதரவு தரும் இடமாக கருதப்படுகிறது."
      : "From the natal Moon, this is traditionally considered supportive.";
  }
  if (quality === "care") {
    return lang === "ta"
      ? "சந்திர ராசியிலிருந்து இது கவனமும் அளவான முடிவுகளும் கேட்கும் இடம்."
      : "From the natal Moon, this calls for care and measured choices.";
  }
  return lang === "ta"
    ? "சந்திர ராசியிலிருந்து இது கலந்த, சமநிலை பார்வை தேவைப்படும் இடம்."
    : "From the natal Moon, this is mixed and needs balanced judgment.";
}

export function formatPeyarchiDate(value: string): string {
  return formatDateLabel(value.slice(0, 10));
}

export function saniCycleLabel(value: string, lang: Lang): string {
  const labels: Record<string, BiCopy> = {
    EZHARAI_SANI_PHASE_1: { ta: "ஏழரை சனி தொடக்கம்", en: "Sade Sati beginning" },
    JANMA_SANI: { ta: "ஜன்ம சனி", en: "Janma Sani" },
    EZHARAI_SANI_PHASE_3: { ta: "ஏழரை சனி முடிவு", en: "Sade Sati ending" },
    ARDHASHTAMA_SANI: { ta: "அர்த்தாஷ்டம சனி", en: "Ardhashtama Sani" },
    ASHTAMA_SANI: { ta: "அஷ்டம சனி", en: "Ashtama Sani" },
  };
  return tx(labels[value] ?? { ta: value.replaceAll("_", " "), en: value.replaceAll("_", " ") }, lang);
}

export function findTransit(transit: TransitSnapshotData | null, graha: string) {
  return transit?.transits.find((item) => normalizePlanet(item.graha) === graha) ?? null;
}

/**
 * Lagna's own rasi number, recovered from any natal planet.
 *
 * The chart payload carries `lagnaRasi` as a display *name*, but Ashtakavarga
 * lookups are keyed by rasi number. Every planet carries both its absolute
 * `rasi` and its whole-sign `houseFromLagna`, and those two determine the Lagna
 * rasi exactly: houseFromLagna = ((rasi - lagnaRasi) mod 12) + 1.
 */
export function lagnaRasiNumber(planets: ChartPlanet[]): number | null {
  const anchor = planets.find((p) => typeof p.rasi === "number" && typeof p.houseFromLagna === "number");
  if (!anchor) return null;
  return (((anchor.rasi - anchor.houseFromLagna) % 12) + 12) % 12 + 1;
}

/**
 * Ashtakavarga bindus for a graha transiting a given house from Lagna.
 *
 * The engine (app/calculations/ashtakavarga.py) has computed Bhinnashtakavarga
 * all along and the chart payload has carried it — it drives predictions,
 * propensities and daily guidance — but no screen ever showed it. For Tamil
 * peyarchi practice this is the missing half of the judgement: Guru or Sani
 * moving into a rasi where it holds few bindus behaves very differently from
 * the same move into a well-endowed rasi. Flagged in the 2026-07-18 review as
 * essential for peyarchi, and correct about the UI (though not, as the review
 * assumed, absent from the engine).
 *
 * Rahu/Ketu return null — they have no Bhinnashtakavarga table and we do not
 * borrow another graha's (doctrine A-15, ruled 2026-08-19). This used to fall
 * back to Saturn's table to match `get_av_bindu` server-side; that proxy has
 * been removed from the engine, and this mirror must stay removed with it or
 * the card will print a number the backend refuses to compute.
 */
export function transitBindus(
  chart: { planets: ChartPlanet[]; ashtakavarga?: Record<string, Record<number, number>> },
  graha: string,
  houseFromLagna: number,
): number | null {
  const av = chart.ashtakavarga;
  if (!av) return null;
  const lagna = lagnaRasiNumber(chart.planets);
  if (lagna == null) return null;
  const transitRasi = ((lagna - 1 + houseFromLagna - 1) % 12) + 1;
  if (!av[graha]) return null;
  const bindu = av[graha]?.[transitRasi];
  return typeof bindu === "number" ? bindu : null;
}

/**
 * Reading of a bindu count on the classical 0-8 Bhinnashtakavarga scale.
 * 4 is the neutral midpoint; 5+ is a supported transit, 3 or fewer is thin.
 */
export function binduReading(bindus: number, lang: Lang): string {
  if (bindus >= 6) return lang === "ta" ? "மிகுந்த ஆதரவு" : "strongly supported";
  if (bindus >= 5) return lang === "ta" ? "ஆதரவு" : "supported";
  if (bindus === 4) return lang === "ta" ? "நடுநிலை" : "neutral";
  if (bindus >= 2) return lang === "ta" ? "பலவீனம்" : "thin";
  return lang === "ta" ? "மிகவும் பலவீனம்" : "very thin";
}

export function strongestPlanet(planets: ChartPlanet[]): ChartPlanet | null {
  return planets
    .filter((planet) => typeof planet.strengthScore === "number")
    .sort((a, b) => (b.strengthScore ?? 0) - (a.strengthScore ?? 0))[0] ?? null;
}

export function weakestPlanet(planets: ChartPlanet[]): ChartPlanet | null {
  return planets
    .filter((planet) => typeof planet.strengthScore === "number")
    .sort((a, b) => (a.strengthScore ?? 0) - (b.strengthScore ?? 0))[0] ?? null;
}
