"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { formatDateLabel } from "@/lib/format";
import { D1_RASI_NAMES } from "@/lib/chart-utils";
import { tNakshatra, tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  ChartCalculateResponseData,
  ChartExplanationData,
  ChartPlanet,
  ChartSummaryData,
  DashaTimelineItem,
  DashaTimelineResponseData,
  PeyarchiEvent,
  SaniCycleData,
  TransitSnapshotData,
} from "@/lib/types";

import { YogaDoshamPanel } from "./dashboard-yoga-dosham-panel";

type BiCopy = { ta: string; en: string };
type RelationshipTone = "friendly" | "neutral" | "hostile";
type SectionId =
  | "basics"
  | "activation"
  | "positions"
  | "conjunctions"
  | "drishti"
  | "houses"
  | "functional"
  | "yogas"
  | "summary"
  | "peyarchi";

type ChartExplanationPanelProps = {
  lang: Lang;
  chart: ChartCalculateResponseData;
  explanation?: ChartExplanationData | null;
  summary: ChartSummaryData | null;
  transit: TransitSnapshotData | null;
  sani: SaniCycleData | null;
  peyarchiUpcoming: PeyarchiEvent[];
  dasha: DashaTimelineResponseData | null;
  dashaAntar: DashaTimelineItem[];
};

const TAMIL_RASI_NAMES: Record<number, string> = {
  1: "மேஷம்",
  2: "ரிஷபம்",
  3: "மிதுனம்",
  4: "கடகம்",
  5: "சிம்மம்",
  6: "கன்னி",
  7: "துலாம்",
  8: "விருச்சிகம்",
  9: "தனுசு",
  10: "மகரம்",
  11: "கும்பம்",
  12: "மீனம்",
};

const KENDRA_HOUSES = new Set([1, 4, 7, 10]);
const TRIKONA_HOUSES = new Set([1, 5, 9]);
const DUSTHANA_HOUSES = new Set([6, 8, 12]);

const EXALTATION_RASI: Record<string, number> = {
  SUN: 1,
  MOON: 2,
  MARS: 10,
  MERCURY: 6,
  JUPITER: 4,
  VENUS: 12,
  SATURN: 7,
};

const DEBILITATION_RASI: Record<string, number> = {
  SUN: 7,
  MOON: 8,
  MARS: 4,
  MERCURY: 12,
  JUPITER: 10,
  VENUS: 6,
  SATURN: 1,
};

const MOOLATRIKONA_ZONE: Record<string, { rasi: number; start: number; end: number }> = {
  SUN: { rasi: 5, start: 0, end: 20 },
  MOON: { rasi: 2, start: 4, end: 30 },
  MARS: { rasi: 1, start: 0, end: 12 },
  MERCURY: { rasi: 6, start: 16, end: 20 },
  JUPITER: { rasi: 9, start: 0, end: 10 },
  VENUS: { rasi: 7, start: 0, end: 15 },
  SATURN: { rasi: 11, start: 0, end: 20 },
};

const OWN_SIGN_RASI: Record<string, number[]> = {
  SUN: [5],
  MOON: [4],
  MARS: [1, 8],
  MERCURY: [3, 6],
  JUPITER: [9, 12],
  VENUS: [2, 7],
  SATURN: [10, 11],
  RAHU: [],
  KETU: [],
};

const SIGN_LORD: Record<number, string> = {
  1: "MARS",
  2: "VENUS",
  3: "MERCURY",
  4: "MOON",
  5: "SUN",
  6: "MERCURY",
  7: "VENUS",
  8: "MARS",
  9: "JUPITER",
  10: "SATURN",
  11: "SATURN",
  12: "JUPITER",
};

const NATURAL_FRIENDS: Record<string, string[]> = {
  SUN: ["MOON", "MARS", "JUPITER"],
  MOON: ["SUN", "MERCURY"],
  MARS: ["SUN", "MOON", "JUPITER"],
  MERCURY: ["SUN", "VENUS"],
  JUPITER: ["SUN", "MOON", "MARS"],
  VENUS: ["MERCURY", "SATURN"],
  SATURN: ["MERCURY", "VENUS"],
  RAHU: ["VENUS", "SATURN"],
  KETU: ["MARS", "VENUS"],
};

const NATURAL_ENEMIES: Record<string, string[]> = {
  SUN: ["VENUS", "SATURN", "RAHU", "KETU"],
  MOON: ["RAHU", "KETU"],
  MARS: ["MERCURY", "RAHU"],
  MERCURY: ["MOON"],
  JUPITER: ["MERCURY", "VENUS", "RAHU", "KETU"],
  VENUS: ["SUN", "MOON", "RAHU", "KETU"],
  SATURN: ["SUN", "MOON", "MARS"],
  RAHU: ["SUN", "MOON", "MARS", "JUPITER"],
  KETU: ["SUN", "MOON", "JUPITER", "RAHU"],
};

const HOUSE_MEANING: Record<number, BiCopy> = {
  1: { ta: "உடல், தன்மை, வாழ்க்கை திசை", en: "self, body, life direction" },
  2: { ta: "குடும்பம், பேச்சு, பண அடித்தளம்", en: "family, speech, money base" },
  3: { ta: "முயற்சி, துணிவு, தொடர்பு", en: "effort, courage, communication" },
  4: { ta: "வீடு, மன அமைதி, சொத்து", en: "home, inner peace, property" },
  5: { ta: "கல்வி, புத்தி, குழந்தைகள்", en: "learning, intelligence, children" },
  6: { ta: "சேவை, பழக்கங்கள், ஒழுங்கு", en: "service, habits, discipline" },
  7: { ta: "உறவுகள், கூட்டாண்மை", en: "relationships, partnership" },
  8: { ta: "ஆழமான மாற்றம், ஆராய்ச்சி, கவனம்", en: "deep change, research, careful renewal" },
  9: { ta: "தர்மம், ஆசீர்வாதம், உயர்கல்வி", en: "dharma, grace, higher learning" },
  10: { ta: "தொழில், பொறுப்பு, வெளிப்படை செயல்", en: "career, responsibility, public work" },
  11: { ta: "லாபம், நண்பர்கள், வலையமைப்பு", en: "gains, friends, networks" },
  12: { ta: "ஓய்வு, வெளிநாடு, ஆன்மீக விடுவிப்பு", en: "rest, foreign links, spiritual release" },
};

const HOUSE_GROUP_COPY: Record<"kendra" | "trikona" | "dusthana" | "other", BiCopy> = {
  kendra: {
    ta: "கேந்திரம்: வாழ்க்கையின் முக்கிய தூண்கள். இங்கு உள்ள கிரகங்கள் வெளிப்படையாக வேலை செய்கின்றன.",
    en: "Kendra: the main pillars of life. Planets here tend to act visibly.",
  },
  trikona: {
    ta: "திரிகோணம்: திறமை, புண்ணியம், ஆதரவு. இங்கு உள்ள கிரகங்கள் வளர்ச்சிக்கான வழிகளை காட்டும்.",
    en: "Trikona: talent, grace, support. Planets here point to growth channels.",
  },
  dusthana: {
    ta: "துஷ்டானம்: கவனமும் திருத்தமும் தேவைப்படும் இடங்கள். நல்ல ஒழுங்கு இதை சமநிலைப்படுத்தும்.",
    en: "Dusthana: areas needing care and refinement. Good routines help balance them.",
  },
  other: {
    ta: "மற்ற வீடுகள்: சூழ்நிலைக்கு ஏற்ப விளைவு தரும் இடங்கள்.",
    en: "Other houses: areas that work through context and timing.",
  },
};

const SECTION_META: Array<{ id: SectionId; title: BiCopy; hint: BiCopy }> = [
  {
    id: "basics",
    title: { ta: "ஜாதக அடிப்படை", en: "Chart Basics" },
    hint: { ta: "லக்னம், சந்திரன், நடப்பு தசை", en: "Lagna, Moon, current Dasha" },
  },
  {
    id: "activation",
    title: { ta: "நடப்பு தசை செயல்பாடு", en: "Current Period Activation" },
    hint: { ta: "தசை / புக்தி / அந்தரம் + கோசாரம்", en: "Dasha / Bhukti / Antaram + gochar" },
  },
  {
    id: "positions",
    title: { ta: "கிரக நிலைகள்", en: "Planet Positions" },
    hint: { ta: "வீடு, ராசி, நட்சத்திரம், பலம்", en: "House, sign, nakshatra, strength" },
  },
  {
    id: "conjunctions",
    title: { ta: "ஒன்றாக நிற்கும் கிரகங்கள்", en: "Friends Standing Together" },
    hint: { ta: "ஒரே ராசியில் உள்ள கூட்டங்கள்", en: "Groups sharing one sign" },
  },
  {
    id: "drishti",
    title: { ta: "திருஷ்டி / பார்வை", en: "Drishti / Aspects" },
    hint: { ta: "7-ஆம் பார்வை மற்றும் கோசார குரு/சனி", en: "7th aspect and Guru/Sani transit aspects" },
  },
  {
    id: "houses",
    title: { ta: "கேந்திரம் / திரிகோணம் / துஷ்டானம்", en: "Kendra / Trikona / Dusthana" },
    hint: { ta: "கிரகங்கள் எந்த வீட்டு குழுவில் உள்ளன", en: "Which house group each planet occupies" },
  },
  {
    id: "functional",
    title: { ta: "செயல்பாட்டு தன்மை", en: "Functional Nature" },
    hint: { ta: "லக்னத்திற்கு கிரகத்தின் பங்கு", en: "Each planet's role for the Lagna" },
  },
  {
    id: "yogas",
    title: { ta: "யோகங்கள் / தோஷங்கள்", en: "Yogas / Doshams" },
    hint: { ta: "ஏற்கனவே கணிக்கப்பட்ட யோக/தோஷ விளக்கம்", en: "Existing yoga and dosham interpretation" },
  },
  {
    id: "summary",
    title: { ta: "நன்மை / கவனச் சுருக்கம்", en: "Positive / Caution Summary" },
    hint: { ta: "வலுவானது, ஆதரவு தேவைப்படுவது, நடைமுறை குறிப்பு", en: "Strongest, needs support, practical notes" },
  },
  {
    id: "peyarchi",
    title: { ta: "வரும் பெயர்ச்சி", en: "Upcoming Peyarchi" },
    hint: { ta: "குரு, சனி, ராகு, கேது இந்த ஜாதகத்தில் தொடும் வீடுகள்", en: "Guru, Sani, Rahu, Ketu houses for this chart" },
  },
];

const INITIAL_SECTIONS: Record<SectionId, boolean> = {
  basics: true,
  activation: true,
  positions: false,
  conjunctions: false,
  drishti: false,
  houses: false,
  functional: false,
  yogas: false,
  summary: false,
  peyarchi: false,
};

function tx(copy: BiCopy, lang: Lang): string {
  return copy[lang];
}

function rasiName(rasi: number | null | undefined, lang: Lang): string {
  if (!rasi) return lang === "ta" ? "தெரியவில்லை" : "Unknown";
  return lang === "ta" ? (TAMIL_RASI_NAMES[rasi] ?? `${rasi}`) : (D1_RASI_NAMES[rasi] ?? `Rasi ${rasi}`);
}

function ordinalHouse(house: number, lang: Lang): string {
  return lang === "ta" ? `${house}-ஆம் வீடு` : `House ${house}`;
}

function displayPlanet(graha: string, lang: Lang): string {
  const key = graha.toUpperCase() === "SANI" ? "SATURN" : graha.toUpperCase() === "GURU" ? "JUPITER" : graha;
  return tPlanetLord(key, lang) || graha;
}

function normalizePlanet(graha: string): string {
  if (graha.toUpperCase() === "GURU") return "JUPITER";
  if (graha.toUpperCase() === "SANI") return "SATURN";
  return graha.toUpperCase();
}

function strengthColor(score: number | undefined): string {
  if (score === undefined) return "var(--color-faint)";
  if (score >= 70) return "var(--color-score-high, #5C7654)";
  if (score >= 45) return "var(--color-score-mid, #B85A2C)";
  return "var(--color-score-low, #A8482F)";
}

function strengthLabel(score: number | undefined, lang: Lang): string {
  if (score === undefined) return lang === "ta" ? "பலம் இல்லை" : "No score";
  if (score >= 70) return lang === "ta" ? "வலுவானது" : "Strong";
  if (score >= 45) return lang === "ta" ? "மிதமானது" : "Moderate";
  return lang === "ta" ? "ஆதரவு தேவை" : "Needs support";
}

function dignityFor(planet: ChartPlanet, lang: Lang): string {
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

function planetFlags(planet: ChartPlanet, lang: Lang): string[] {
  const flags: string[] = [];
  if (planet.isRetrograde) flags.push(lang === "ta" ? "வக்கிரம்" : "Retrograde");
  if (planet.isCombust) flags.push(lang === "ta" ? "அஸ்தம்" : "Combust");
  if (planet.isVargottama) flags.push(lang === "ta" ? "வர்கோத்தமம்" : "Vargottama");
  return flags;
}

function relationshipBetween(a: string, b: string): RelationshipTone {
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

function normalizeRelationshipTone(tone: string): RelationshipTone {
  const key = tone.toLowerCase();
  if (key === "friendly" || key === "hostile") return key;
  return "neutral";
}

function relationshipLabel(tone: string, lang: Lang): string {
  const key = normalizeRelationshipTone(tone);
  if (key === "friendly") return lang === "ta" ? "நட்பு கூட்டம்" : "Friendly company";
  if (key === "hostile") return lang === "ta" ? "கவனத்துடன் கையாள வேண்டிய கூட்டம்" : "Company needing care";
  return lang === "ta" ? "சமநிலை கூட்டம்" : "Neutral company";
}

function relationshipColor(tone: string): string {
  const key = normalizeRelationshipTone(tone);
  if (key === "friendly") return "var(--color-score-high, #5C7654)";
  if (key === "hostile") return "var(--color-score-low, #A8482F)";
  return "var(--color-score-mid, #B85A2C)";
}

function periodLevelLabel(level: string, lang: Lang): string {
  if (level === "MAHADASHA") return lang === "ta" ? "மகாதசை" : "Mahadasha";
  if (level === "BHUKTI") return lang === "ta" ? "புக்தி" : "Bhukti";
  if (level === "ANTARAM") return lang === "ta" ? "அந்தரம்" : "Antaram";
  return level;
}

function activationToneLabel(tone: string, lang: Lang): string {
  if (tone === "SUPPORT") return lang === "ta" ? "ஆதரவு" : "Support";
  if (tone === "CAUTION") return lang === "ta" ? "கவனம்" : "Care";
  return lang === "ta" ? "சமநிலை" : "Steady";
}

function activationToneColor(tone: string): string {
  if (tone === "SUPPORT") return "var(--color-score-high, #5C7654)";
  if (tone === "CAUTION") return "var(--color-score-low, #A8482F)";
  return "var(--color-score-mid, #B85A2C)";
}

function signalTypeLabel(signalType: string, lang: Lang): string {
  if (signalType === "DASHA_LORD_RETURN") return lang === "ta" ? "சுய ராசி கோசாரம்" : "Natal sign return";
  if (signalType === "TRANSIT_CONJUNCTION") return lang === "ta" ? "கோசார சேர்க்கை" : "Transit conjunction";
  if (signalType.startsWith("TRANSIT_ASPECT_")) return lang === "ta" ? "கோசார பார்வை" : "Transit aspect";
  return signalType.replaceAll("_", " ");
}

function groupRelationship(planets: ChartPlanet[]): RelationshipTone {
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

function conjunctionGroups(chart: ChartCalculateResponseData): Array<{ rasi: number; planets: ChartPlanet[]; tone: RelationshipTone }> {
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

function mutualSeventhAspects(planets: ChartPlanet[]): Array<{ a: ChartPlanet; b: ChartPlanet }> {
  const aspects: Array<{ a: ChartPlanet; b: ChartPlanet }> = [];
  for (let i = 0; i < planets.length; i += 1) {
    for (let j = i + 1; j < planets.length; j += 1) {
      const diff = Math.abs(planets[i].houseFromLagna - planets[j].houseFromLagna);
      if (diff === 6) aspects.push({ a: planets[i], b: planets[j] });
    }
  }
  return aspects;
}

function aspectHousesFromHouse(house: number, offsets: number[]): number[] {
  return offsets.map((offset) => ((house - 1 + offset) % 12) + 1);
}

function houseGroupFor(house: number): "kendra" | "trikona" | "dusthana" | "other" {
  if (DUSTHANA_HOUSES.has(house)) return "dusthana";
  if (KENDRA_HOUSES.has(house) && TRIKONA_HOUSES.has(house)) return "kendra";
  if (KENDRA_HOUSES.has(house)) return "kendra";
  if (TRIKONA_HOUSES.has(house)) return "trikona";
  return "other";
}

function normalizeHouseGroup(group: string): "kendra" | "trikona" | "dusthana" | "other" {
  const key = group.toLowerCase();
  if (key === "kendra" || key === "trikona" || key === "dusthana") return key;
  return "other";
}

function houseGroupLabel(group: string, lang: Lang): string {
  const key = normalizeHouseGroup(group);
  if (key === "kendra") return lang === "ta" ? "கேந்திரம்" : "Kendra";
  if (key === "trikona") return lang === "ta" ? "திரிகோணம்" : "Trikona";
  if (key === "dusthana") return lang === "ta" ? "துஷ்டானம்" : "Dusthana";
  return lang === "ta" ? "மற்ற வீடு" : "Other";
}

function natureLabel(nature: string, lang: Lang): string {
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

function natureNote(nature: string, lang: Lang): string {
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
      ta: "பலன் சூழ்நிலை, தசை, கோசாரம் ஆகியவற்றின் அடிப்படையில் மாறும்.",
      en: "Results vary by context, dasha, and transit.",
    },
  };
  return tx(notes[nature] ?? notes.NEUTRAL, lang);
}

function classifySaniFromMoon(house: number | null | undefined): BiCopy {
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

function classifyKandakaFromLagna(house: number | null | undefined): BiCopy | null {
  if (!house || !KENDRA_HOUSES.has(house)) return null;
  return {
    ta: "லக்னத்திலிருந்து கண்டக சனி: முக்கிய வாழ்க்கைத் தூண்களில் பொறுப்பை அதிகரிக்கும்.",
    en: "Kandaka Sani from Lagna: responsibilities increase around a main life pillar.",
  };
}

function guruMoonQuality(house: number): "supportive" | "care" | "steady" {
  if ([2, 5, 7, 9, 11].includes(house)) return "supportive";
  if ([6, 8, 12].includes(house)) return "care";
  return "steady";
}

function guruQualityCopy(quality: "supportive" | "care" | "steady", lang: Lang): string {
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

function formatPeyarchiDate(value: string): string {
  return formatDateLabel(value.slice(0, 10));
}

function saniCycleLabel(value: string, lang: Lang): string {
  const labels: Record<string, BiCopy> = {
    EZHARAI_SANI_PHASE_1: { ta: "ஏழரை சனி தொடக்கம்", en: "Sade Sati beginning" },
    JANMA_SANI: { ta: "ஜன்ம சனி", en: "Janma Sani" },
    EZHARAI_SANI_PHASE_3: { ta: "ஏழரை சனி முடிவு", en: "Sade Sati ending" },
    ARDHASHTAMA_SANI: { ta: "அர்த்தாஷ்டம சனி", en: "Ardhashtama Sani" },
    ASHTAMA_SANI: { ta: "அஷ்டம சனி", en: "Ashtama Sani" },
  };
  return tx(labels[value] ?? { ta: value.replaceAll("_", " "), en: value.replaceAll("_", " ") }, lang);
}

function findTransit(transit: TransitSnapshotData | null, graha: string) {
  return transit?.transits.find((item) => normalizePlanet(item.graha) === graha) ?? null;
}

function strongestPlanet(planets: ChartPlanet[]): ChartPlanet | null {
  return planets
    .filter((planet) => typeof planet.strengthScore === "number")
    .sort((a, b) => (b.strengthScore ?? 0) - (a.strengthScore ?? 0))[0] ?? null;
}

function weakestPlanet(planets: ChartPlanet[]): ChartPlanet | null {
  return planets
    .filter((planet) => typeof planet.strengthScore === "number")
    .sort((a, b) => (a.strengthScore ?? 0) - (b.strengthScore ?? 0))[0] ?? null;
}

function Chip({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: "24px",
        padding: "var(--space-0_5) var(--space-2)",
        borderRadius: "var(--radius-pill)",
        border: `1px solid ${color ? `${color}44` : "var(--color-border)"}`,
        color: color ?? "var(--color-muted)",
        background: color ? `${color}12` : "var(--color-surface-soft)",
        fontSize: "0.75rem",
        fontWeight: 600,
        lineHeight: 1.25,
      }}
    >
      {children}
    </span>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      style={{
        width: "14px",
        height: "14px",
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 140ms ease",
      }}
    >
      <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(96px, 0.8fr) minmax(0, 2fr)",
        gap: "var(--space-2)",
        alignItems: "baseline",
        paddingBottom: "var(--space-2)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <span style={{ fontSize: "0.75rem", color: "var(--color-faint)", lineHeight: 1.35 }}>{label}</span>
      <span style={{ fontSize: "0.875rem", color: "var(--color-text-strong)", fontWeight: 500, lineHeight: 1.45 }}>{value}</span>
    </div>
  );
}

function SectionFrame({
  title,
  hint,
  open,
  onToggle,
  children,
}: {
  title: string;
  hint: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div style={{ borderTop: "1px solid var(--color-border)" }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        style={{
          width: "100%",
          border: "none",
          background: "transparent",
          padding: "var(--space-3) 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-3)",
          color: "var(--color-text-strong)",
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "left",
        }}
      >
        <span style={{ display: "flex", flexDirection: "column", gap: "var(--space-0_5)", minWidth: 0 }}>
          <span style={{ fontSize: "0.875rem", fontWeight: 700, lineHeight: 1.35 }}>{title}</span>
          <span style={{ fontSize: "0.75rem", color: "var(--color-faint)", lineHeight: 1.35 }}>{hint}</span>
        </span>
        <span style={{ flexShrink: 0, color: "var(--color-muted)" }}>
          <Chevron open={open} />
        </span>
      </button>
      {open && <div style={{ padding: "0 0 var(--space-4)" }}>{children}</div>}
    </div>
  );
}

export function ChartExplanationPanel({
  lang,
  chart,
  explanation,
  summary,
  transit,
  sani,
  peyarchiUpcoming,
  dasha,
  dashaAntar,
}: ChartExplanationPanelProps) {
  const [open, setOpen] = useState(false);
  const [sectionOpen, setSectionOpen] = useState<Record<SectionId, boolean>>(INITIAL_SECTIONS);
  const backend = explanation ?? null;

  const derived = useMemo(() => {
    const moon = chart.planets.find((planet) => normalizePlanet(planet.graha) === "MOON") ?? null;
    const conjunctions = conjunctionGroups(chart);
    const seventhAspects = mutualSeventhAspects(chart.planets);
    const strong = strongestPlanet(chart.planets);
    const weak = weakestPlanet(chart.planets);
    const kendraPlanets = chart.planets.filter((planet) => KENDRA_HOUSES.has(planet.houseFromLagna));
    const trikonaPlanets = chart.planets.filter((planet) => TRIKONA_HOUSES.has(planet.houseFromLagna));
    const dusthanaPlanets = chart.planets.filter((planet) => DUSTHANA_HOUSES.has(planet.houseFromLagna));
    const jupiterTransit = findTransit(transit, "JUPITER");
    const saturnTransit = findTransit(transit, "SATURN");
    const saturnFromMoon = sani?.positionFromMoon ?? saturnTransit?.houseFromMoon ?? null;
    const saturnFromLagna = sani?.positionFromLagna ?? saturnTransit?.houseFromLagna ?? null;
    const saniStage = classifySaniFromMoon(saturnFromMoon);
    const kandakaStage = classifyKandakaFromLagna(saturnFromLagna);
    return {
      moon,
      conjunctions,
      seventhAspects,
      strong,
      weak,
      kendraPlanets,
      trikonaPlanets,
      dusthanaPlanets,
      jupiterTransit,
      saturnTransit,
      saturnFromMoon,
      saturnFromLagna,
      saniStage,
      kandakaStage,
    };
  }, [chart, transit, sani]);

  const teaser = useMemo(() => {
    if (backend) {
      const kendraCount = backend.houseGroups.find((group) => normalizeHouseGroup(group.group) === "kendra")?.planets.length ?? 0;
      const strongest = backend.summary.strongestPlanet
        ? displayPlanet(backend.summary.strongestPlanet, lang)
        : (lang === "ta" ? "முக்கிய கிரகம்" : "key planet");
      return lang === "ta"
        ? `${kendraCount} கிரகங்கள் கேந்திரத்தில்; வலுவான கிரகம் ${strongest}; பெயர்ச்சி விளக்கம் தயார்.`
        : `${kendraCount} planets in Kendra; strongest planet ${strongest}; transit explanation ready.`;
    }
    const moonPhrase = derived.moon
      ? lang === "ta"
        ? `சந்திரன் ${ordinalHouse(derived.moon.houseFromLagna, lang)}`
        : `Moon in ${ordinalHouse(derived.moon.houseFromLagna, lang)}`
      : lang === "ta"
        ? "சந்திர நிலை ஏற்றப்படுகிறது"
        : "Moon placement loading";
    const saniShort =
      derived.saturnFromMoon !== null
        ? lang === "ta"
          ? `சனி சந்திரனிலிருந்து ${derived.saturnFromMoon}-ஆம் இடம்`
          : `Saturn ${derived.saturnFromMoon} from Moon`
        : lang === "ta"
          ? "சனி கோசாரம் ஏற்றப்படுகிறது"
          : "Saturn transit loading";
    return lang === "ta"
      ? `${derived.kendraPlanets.length} கிரகங்கள் கேந்திரத்தில்; ${moonPhrase}; ${saniShort}.`
      : `${derived.kendraPlanets.length} planets in Kendra; ${moonPhrase}; ${saniShort}.`;
  }, [backend, derived, lang]);

  const setSection = (section: SectionId) => {
    setSectionOpen((current) => ({ ...current, [section]: !current[section] }));
  };

  const dashaLabel = dasha
    ? `${displayPlanet(dasha.current.mahadasha.lord, lang)} ${lang === "ta" ? "தசை" : "Dasa"} / ${displayPlanet(dasha.current.antardasha.lord, lang)} ${lang === "ta" ? "புக்தி" : "Bhukti"}`
    : summary
      ? `${displayPlanet(summary.currentMahadasha, lang)} / ${displayPlanet(summary.currentAntardasha, lang)}`
      : lang === "ta"
        ? "தசை தரவு இல்லை"
        : "Dasha data unavailable";

  const currentAntar = dasha?.current.pratyantardasha.lord ?? dashaAntar.find((item) => item.level === "antar")?.lord ?? null;
  const guruEvent = peyarchiUpcoming.find((event) => event.planet === "JUPITER") ?? null;
  const saniEvent = peyarchiUpcoming.find((event) => event.planet === "SATURN") ?? null;
  const rahuEvent = peyarchiUpcoming.find((event) => event.planet === "RAHU") ?? null;
  const ketuEvent = peyarchiUpcoming.find((event) => event.planet === "KETU") ?? null;
  const coreIdentity = backend?.coreIdentity ?? null;
  const backendPlanets = backend?.planets ?? null;
  const backendConjunctions = backend?.conjunctions ?? null;
  const backendAspects = backend?.aspects ?? null;
  const backendHouseGroups = backend?.houseGroups ?? null;
  const backendFunctionalNature = backend?.functionalNature ?? null;
  const backendYogaDosham = backend?.yogaDosham ?? null;
  const backendCurrentActivation = backend?.currentActivation ?? null;
  const backendSummary = backend?.summary ?? null;
  const backendPeyarchi = backend?.peyarchi ?? null;
  const functionalNatureEntries = Object.entries(backendFunctionalNature ?? summary?.functionalNature ?? {});

  return (
    <div
      style={{
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface-soft)",
        padding: "var(--space-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 260px", minWidth: 0 }}>
          <p
            style={{
              margin: "0 0 var(--space-1)",
              fontSize: "0.625rem",
              fontWeight: 700,
              color: "var(--color-faint)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            {lang === "ta" ? "ஜாதக விளக்கம்" : "Chart Explanation"}
          </p>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-muted)", lineHeight: 1.5 }}>
            {teaser}
          </p>
        </div>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--space-1_5)",
            minHeight: "36px",
            padding: "var(--space-1_5) var(--space-4)",
            borderRadius: "var(--radius-pill)",
            border: "1.5px solid var(--color-border-strong)",
            background: open ? "var(--color-text-strong)" : "var(--color-surface)",
            color: open ? "var(--color-bg)" : "var(--color-text)",
            fontSize: "0.8125rem",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            whiteSpace: "nowrap",
          }}
        >
          <Chevron open={open} />
          {open
            ? (lang === "ta" ? "விளக்கத்தை மூடு" : "Close explanation")
            : (lang === "ta" ? "ஜாதக விளக்கம் திற" : "Open chart explanation")}
        </button>
      </div>

      {open && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {SECTION_META.map((section) => (
            <SectionFrame
              key={section.id}
              title={tx(section.title, lang)}
              hint={tx(section.hint, lang)}
              open={sectionOpen[section.id]}
              onToggle={() => setSection(section.id)}
            >
              {section.id === "basics" && (
                <div style={{ display: "grid", gap: "var(--space-3)" }}>
                  <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.6, color: "var(--color-muted)" }}>
                    {coreIdentity
                      ? tx(coreIdentity.explanation, lang)
                      : lang === "ta"
                        ? "இந்த D1 ஜாதகம் லக்னத்தை மையமாக வைத்து 12 வீடுகள், சந்திர ராசி, கிரக நிலைகள், நட்சத்திரங்கள் ஆகியவற்றை காட்டுகிறது. D9 நவாம்சம் கிரகத்தின் உள்ளார்ந்த பலத்தை கூடுதல் அடுக்காக பார்க்க உதவும்."
                        : "This D1 chart reads the 12 houses from the Lagna and shows the Moon sign, planets, and nakshatras. D9 Navamsa adds a second layer for deeper planetary strength."}
                  </p>
                  <div style={{ display: "grid", gap: "var(--space-2)" }}>
                    <DetailRow
                      label={lang === "ta" ? "லக்னம்" : "Lagna"}
                      value={coreIdentity
                        ? coreIdentity.lagnaRasi
                        : `${rasiName(chart.lagna.rasi, lang)} - ${tNakshatra(chart.lagna.nakshatraName, lang)} ${lang === "ta" ? "பாதம்" : "Pada"} ${chart.lagna.pada}`}
                    />
                    <DetailRow
                      label={lang === "ta" ? "சந்திரன்" : "Moon"}
                      value={
                        coreIdentity
                          ? `${coreIdentity.moonRasi} - ${coreIdentity.janmaNakshatra} ${lang === "ta" ? "பாதம்" : "Pada"} ${coreIdentity.janmaPada}`
                          : derived.moon
                          ? `${rasiName(derived.moon.rasi, lang)} - ${tNakshatra(derived.moon.nakshatraName, lang)} ${lang === "ta" ? "பாதம்" : "Pada"} ${derived.moon.pada}`
                          : (lang === "ta" ? "சந்திர தரவு இல்லை" : "Moon data unavailable")
                      }
                    />
                    <DetailRow
                      label={lang === "ta" ? "நடப்பு தசை" : "Current Dasha"}
                      value={coreIdentity
                        ? `${displayPlanet(coreIdentity.currentMahadasha, lang)} / ${displayPlanet(coreIdentity.currentAntardasha, lang)}`
                        : dashaLabel}
                    />
                    <DetailRow
                      label={lang === "ta" ? "நடப்பு அந்தரம்" : "Current Antaram"}
                      value={coreIdentity
                        ? displayPlanet(coreIdentity.currentPratyantardasha, lang)
                        : currentAntar ? displayPlanet(currentAntar, lang) : (lang === "ta" ? "தரவு இல்லை" : "Unavailable")}
                    />
                  </div>
                </div>
              )}

              {section.id === "activation" && (
                <div style={{ display: "grid", gap: "var(--space-3)" }}>
                  {backendCurrentActivation ? (
                    <>
                      <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.6, color: "var(--color-muted)" }}>
                        {tx(backendCurrentActivation.explanation, lang)}
                      </p>
                      <div style={{ display: "grid", gap: "var(--space-2)" }}>
                        <DetailRow
                          label={lang === "ta" ? "தசைச் சங்கிலி" : "Dasha chain"}
                          value={tx(backendCurrentActivation.periodSummary, lang)}
                        />
                        <DetailRow
                          label={lang === "ta" ? "கோசார நிலை" : "Gochar status"}
                          value={tx(backendCurrentActivation.transitSummary, lang)}
                        />
                      </div>
                      <div style={{ display: "grid", gap: "var(--space-2)" }}>
                        {backendCurrentActivation.activeLords.map((item) => (
                          <div key={`${item.level}-${item.lord}`} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", background: "var(--color-surface)", padding: "var(--space-3)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-2)", flexWrap: "wrap" }}>
                              <div>
                                <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-strong)" }}>
                                  {periodLevelLabel(item.level, lang)} - {displayPlanet(item.lord, lang)}
                                </p>
                                <p style={{ margin: "var(--space-0_5) 0 0", fontSize: "0.75rem", color: "var(--color-faint)", lineHeight: 1.45 }}>
                                  {formatPeyarchiDate(item.startDate)} - {formatPeyarchiDate(item.endDate)}
                                </p>
                              </div>
                              <Chip color={activationToneColor(item.periodTone)}>{activationToneLabel(item.periodTone, lang)}</Chip>
                            </div>
                            <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap", margin: "var(--space-2) 0" }}>
                              <Chip>{lang === "ta" ? "பிறப்பு" : "Natal"}: {ordinalHouse(item.natalHouseFromLagna, lang)}</Chip>
                              <Chip>{lang === "ta" ? "சந்திரனிலிருந்து" : "From Moon"}: {ordinalHouse(item.natalHouseFromMoon, lang)}</Chip>
                              <Chip>{natureLabel(item.functionalNature, lang)}</Chip>
                              <Chip>{Math.round(item.natalStrengthScore)}/100</Chip>
                              <Chip>{lang === "ta" ? "கோசாரம்" : "Transit"}: {ordinalHouse(item.transitHouseFromLagna, lang)}</Chip>
                              {item.transitIsRetrograde && <Chip>{lang === "ta" ? "வக்கிரம்" : "Retrograde"}</Chip>}
                            </div>
                            <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.8125rem", color: "var(--color-text)", lineHeight: 1.55 }}>
                              {tx(item.explanation, lang)}
                            </p>
                            <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
                              {item.transitSignals.length > 0
                                ? item.transitSignals.map((signal, index) => (
                                    <Chip key={`${item.level}-${item.lord}-${signal.sourcePlanet}-${signal.signalType}-${index}`}>
                                      {displayPlanet(signal.sourcePlanet, lang)}: {signalTypeLabel(signal.signalType, lang)}
                                    </Chip>
                                  ))
                                : <Chip>{lang === "ta" ? "நேரடி பெரிய கோசார தொடுதல் இல்லை" : "No direct major transit contact"}</Chip>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ display: "grid", gap: "var(--space-2)" }}>
                      <DetailRow label={lang === "ta" ? "நடப்பு தசை" : "Current Dasha"} value={dashaLabel} />
                      <DetailRow
                        label={lang === "ta" ? "நடப்பு அந்தரம்" : "Current Antaram"}
                        value={currentAntar ? displayPlanet(currentAntar, lang) : (lang === "ta" ? "தரவு இல்லை" : "Unavailable")}
                      />
                      <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-muted)", lineHeight: 1.55 }}>
                        {lang === "ta"
                          ? "முழு தசை செயல்பாட்டு விளக்கம் backend தரவு கிடைக்கும் போது காட்டப்படும்."
                          : "Full Dasha activation detail appears when backend explanation data is available."}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {section.id === "positions" && (
                <div style={{ display: "grid", gap: "var(--space-2)" }}>
                  {backendPlanets ? (
                    backendPlanets.map((planet) => {
                      const color = strengthColor(planet.strengthScore);
                      const flags = [
                        planet.isRetrograde ? (lang === "ta" ? "வக்கிரம்" : "Retrograde") : null,
                        planet.isCombust ? (lang === "ta" ? "அஸ்தம்" : "Combust") : null,
                        planet.isVargottama ? (lang === "ta" ? "வர்கோத்தமம்" : "Vargottama") : null,
                      ].filter(Boolean) as string[];
                      return (
                        <div
                          key={planet.graha}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(92px, 0.7fr) minmax(0, 2fr)",
                            gap: "var(--space-3)",
                            padding: "var(--space-3)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-sm)",
                            background: "var(--color-surface)",
                          }}
                        >
                          <div>
                            <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-strong)" }}>
                              {displayPlanet(planet.graha, lang)}
                            </p>
                            <Chip color={color}>{Math.round(planet.strengthScore)}/100</Chip>
                          </div>
                          <div style={{ display: "grid", gap: "var(--space-1_5)" }}>
                            <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-text)", lineHeight: 1.5 }}>
                              {ordinalHouse(planet.houseFromLagna, lang)} - {rasiName(planet.rasi, lang)} - {tNakshatra(planet.nakshatraName, lang)}{" "}
                              {lang === "ta" ? "பாதம்" : "Pada"} {planet.pada}
                            </p>
                            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-muted)", lineHeight: 1.5 }}>
                              {tx(planet.explanation, lang)} D9: {rasiName(planet.d9Rasi, lang)}.
                            </p>
                            <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
                              <Chip color={color}>{strengthLabel(planet.strengthScore, lang)}</Chip>
                              <Chip>{houseGroupLabel(planet.houseGroup, lang)}</Chip>
                              <Chip>{natureLabel(planet.functionalNature, lang)}</Chip>
                              {flags.length > 0
                                ? flags.map((flag) => <Chip key={flag}>{flag}</Chip>)
                                : <Chip>{lang === "ta" ? "சிறப்பு குறி இல்லை" : "No special flag"}</Chip>}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    chart.planets.map((planet) => {
                      const color = strengthColor(planet.strengthScore);
                      const flags = planetFlags(planet, lang);
                      return (
                        <div
                          key={planet.graha}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(92px, 0.7fr) minmax(0, 2fr)",
                            gap: "var(--space-3)",
                            padding: "var(--space-3)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-sm)",
                            background: "var(--color-surface)",
                          }}
                        >
                          <div>
                            <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-strong)" }}>
                              {displayPlanet(planet.graha, lang)}
                            </p>
                            <Chip color={color}>
                              {planet.strengthScore !== undefined ? `${Math.round(planet.strengthScore)}/100` : strengthLabel(undefined, lang)}
                            </Chip>
                          </div>
                          <div style={{ display: "grid", gap: "var(--space-1_5)" }}>
                            <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-text)", lineHeight: 1.5 }}>
                              {ordinalHouse(planet.houseFromLagna, lang)} - {rasiName(planet.rasi, lang)} - {tNakshatra(planet.nakshatraName, lang)}{" "}
                              {lang === "ta" ? "பாதம்" : "Pada"} {planet.pada}
                            </p>
                            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-muted)", lineHeight: 1.5 }}>
                              {dignityFor(planet, lang)}. D9: {rasiName(planet.d9Rasi, lang)}.
                            </p>
                            <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
                              <Chip color={color}>{strengthLabel(planet.strengthScore, lang)}</Chip>
                              {flags.length > 0
                                ? flags.map((flag) => <Chip key={flag}>{flag}</Chip>)
                                : <Chip>{lang === "ta" ? "சிறப்பு குறி இல்லை" : "No special flag"}</Chip>}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {section.id === "conjunctions" && (
                <div style={{ display: "grid", gap: "var(--space-3)" }}>
                  {backendConjunctions ? (
                    backendConjunctions.length === 0 ? (
                      <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-muted)", lineHeight: 1.55 }}>
                        {lang === "ta"
                          ? "ஒரே ராசியில் இரண்டு அல்லது அதற்கு மேற்பட்ட கிரகங்கள் இல்லை. அதனால் பெரிய கூட்ட அழுத்தம் குறைவு."
                          : "No sign has two or more planets together, so there is no major conjunction cluster."}
                      </p>
                    ) : (
                      backendConjunctions.map((group) => {
                        const color = relationshipColor(group.relationshipTone);
                        return (
                          <div key={group.rasi} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "var(--space-3)", background: "var(--color-surface)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
                              <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-strong)" }}>
                                {rasiName(group.rasi, lang)} - {ordinalHouse(group.houseFromLagna, lang)}
                              </p>
                              <Chip color={color}>{relationshipLabel(group.relationshipTone, lang)}</Chip>
                            </div>
                            <p style={{ margin: "var(--space-2) 0", fontSize: "0.8125rem", color: "var(--color-muted)", lineHeight: 1.5 }}>
                              {tx(group.explanation, lang)}
                            </p>
                            <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
                              {group.pairs.map((pair) => (
                                <Chip key={`${group.rasi}-${pair.planetA}-${pair.planetB}`} color={relationshipColor(pair.relationship)}>
                                  {displayPlanet(pair.planetA, lang)} / {displayPlanet(pair.planetB, lang)}: {relationshipLabel(pair.relationship, lang)}
                                </Chip>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )
                  ) : derived.conjunctions.length === 0 ? (
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-muted)", lineHeight: 1.55 }}>
                      {lang === "ta"
                        ? "ஒரே ராசியில் இரண்டு அல்லது அதற்கு மேற்பட்ட கிரகங்கள் இல்லை. அதனால் பெரிய கூட்ட அழுத்தம் குறைவு."
                        : "No sign has two or more planets together, so there is no major conjunction cluster."}
                    </p>
                  ) : (
                    derived.conjunctions.map((group) => {
                      const color = relationshipColor(group.tone);
                      return (
                        <div key={group.rasi} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "var(--space-3)", background: "var(--color-surface)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
                            <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-strong)" }}>
                              {rasiName(group.rasi, lang)}
                            </p>
                            <Chip color={color}>{relationshipLabel(group.tone, lang)}</Chip>
                          </div>
                          <p style={{ margin: "var(--space-2) 0", fontSize: "0.8125rem", color: "var(--color-muted)", lineHeight: 1.5 }}>
                            {group.planets.map((planet) => displayPlanet(planet.graha, lang)).join(" + ")}
                          </p>
                          <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
                            {group.planets.flatMap((planet, index) =>
                              group.planets.slice(index + 1).map((other) => {
                                const tone = relationshipBetween(planet.graha, other.graha);
                                return (
                                  <Chip key={`${planet.graha}-${other.graha}`} color={relationshipColor(tone)}>
                                    {displayPlanet(planet.graha, lang)} / {displayPlanet(other.graha, lang)}: {relationshipLabel(tone, lang)}
                                  </Chip>
                                );
                              }),
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {section.id === "drishti" && (
                <div style={{ display: "grid", gap: "var(--space-3)" }}>
                  <div style={{ display: "grid", gap: "var(--space-2)" }}>
                    <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-strong)" }}>
                      {lang === "ta" ? "ஜாதக திருஷ்டி" : "Natal Drishti"}
                    </p>
                    {backendAspects ? (
                      backendAspects.length === 0 ? (
                        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-muted)", lineHeight: 1.55 }}>
                          {lang === "ta"
                            ? "இந்த கணக்கில் நேரடி கிரக திருஷ்டி தொடுதல்கள் இல்லை."
                            : "No direct natal drishti contacts were found in this calculation."}
                        </p>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1_5)" }}>
                          {backendAspects.slice(0, 18).map((aspect) => (
                            <Chip key={`${aspect.sourcePlanet}-${aspect.targetPlanet}-${aspect.aspectHouse}`}>
                              {displayPlanet(aspect.sourcePlanet, lang)} {lang === "ta" ? "பார்க்கிறது" : "looks at"}{" "}
                              {displayPlanet(aspect.targetPlanet, lang)} ({ordinalHouse(aspect.targetHouse, lang)}, {aspect.aspectType})
                            </Chip>
                          ))}
                          {backendAspects.length > 18 && (
                            <Chip>{lang === "ta" ? `மேலும் ${backendAspects.length - 18}` : `${backendAspects.length - 18} more`}</Chip>
                          )}
                        </div>
                      )
                    ) : derived.seventhAspects.length === 0 ? (
                      <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-muted)", lineHeight: 1.55 }}>
                        {lang === "ta"
                          ? "எளிய 7-ஆம் பார்வையில் முக்கிய கிரக ஜோடி இல்லை."
                          : "No major planet pair is in a simple mutual 7th-house aspect."}
                      </p>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1_5)" }}>
                        {derived.seventhAspects.map(({ a, b }) => (
                          <Chip key={`${a.graha}-${b.graha}`}>
                            {displayPlanet(a.graha, lang)} {lang === "ta" ? "பார்க்கிறது" : "looks at"} {displayPlanet(b.graha, lang)}
                          </Chip>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "grid", gap: "var(--space-2)" }}>
                    <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-strong)" }}>
                      {lang === "ta" ? "கோசார குரு / சனி பார்வை" : "Transit Guru / Sani Aspects"}
                    </p>
                    {[derived.jupiterTransit, derived.saturnTransit].filter(Boolean).length === 0 ? (
                      <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-muted)", lineHeight: 1.55 }}>
                        {lang === "ta" ? "கோசார குரு/சனி தரவு இல்லை." : "Transit Guru/Sani data is unavailable."}
                      </p>
                    ) : (
                      [derived.jupiterTransit, derived.saturnTransit].filter(Boolean).map((item) => {
                        const graha = normalizePlanet(item!.graha);
                        const offsets = graha === "JUPITER" ? [4, 6, 8] : [2, 6, 9];
                        const houses = aspectHousesFromHouse(item!.houseFromLagna, offsets);
                        const touched = chart.planets.filter((planet) => houses.includes(planet.houseFromLagna));
                        return (
                          <div key={graha} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "var(--space-3)", background: "var(--color-surface)" }}>
                            <p style={{ margin: "0 0 var(--space-1_5)", fontSize: "0.8125rem", color: "var(--color-muted)", lineHeight: 1.5 }}>
                              {displayPlanet(graha, lang)} {lang === "ta" ? "லக்னத்திலிருந்து" : "from Lagna"} {ordinalHouse(item!.houseFromLagna, lang)};{" "}
                              {lang === "ta" ? "பார்வை வீடுகள்" : "aspect houses"}: {houses.map((house) => ordinalHouse(house, lang)).join(", ")}.
                            </p>
                            <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
                              {touched.length > 0
                                ? touched.map((planet) => <Chip key={`${graha}-${planet.graha}`}>{displayPlanet(planet.graha, lang)}</Chip>)
                                : <Chip>{lang === "ta" ? "நேரடி கிரக தொடுதல் இல்லை" : "No natal planet directly touched"}</Chip>}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {section.id === "houses" && (
                <div style={{ display: "grid", gap: "var(--space-3)" }}>
                  {backendHouseGroups ? (
                    backendHouseGroups.map((group) => (
                      <div key={group.group} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", background: "var(--color-surface)", padding: "var(--space-3)" }}>
                        <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-strong)" }}>
                          {houseGroupLabel(group.group, lang)}
                        </p>
                        <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.8125rem", color: "var(--color-muted)", lineHeight: 1.55 }}>
                          {tx(group.explanation, lang)}
                        </p>
                        <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
                          {group.planets.length > 0
                            ? group.planets.map((planet) => <Chip key={`${group.group}-${planet}`}>{displayPlanet(planet, lang)}</Chip>)
                            : <Chip>{lang === "ta" ? "இங்கு கிரகம் இல்லை" : "No planet here"}</Chip>}
                        </div>
                      </div>
                    ))
                  ) : (
                    (["kendra", "trikona", "dusthana"] as const).map((group) => {
                      const planets =
                        group === "kendra"
                          ? derived.kendraPlanets
                          : group === "trikona"
                            ? derived.trikonaPlanets
                            : derived.dusthanaPlanets;
                      return (
                        <div key={group} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", background: "var(--color-surface)", padding: "var(--space-3)" }}>
                          <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-strong)" }}>
                            {houseGroupLabel(group, lang)}
                          </p>
                          <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.8125rem", color: "var(--color-muted)", lineHeight: 1.55 }}>
                            {tx(HOUSE_GROUP_COPY[group], lang)}
                          </p>
                          <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
                            {planets.length > 0
                              ? planets.map((planet) => (
                                  <Chip key={`${group}-${planet.graha}`}>
                                    {displayPlanet(planet.graha, lang)} - {ordinalHouse(planet.houseFromLagna, lang)}
                                  </Chip>
                                ))
                              : <Chip>{lang === "ta" ? "இங்கு கிரகம் இல்லை" : "No planet here"}</Chip>}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
                    {(backendPlanets ?? chart.planets).map((planet) => {
                      const group = houseGroupFor(planet.houseFromLagna);
                      return (
                        <Chip key={`house-${planet.graha}`}>
                          {displayPlanet(planet.graha, lang)}: {ordinalHouse(planet.houseFromLagna, lang)} - {tx(HOUSE_MEANING[planet.houseFromLagna], lang)} - {houseGroupLabel("houseGroup" in planet ? planet.houseGroup : group, lang)}
                        </Chip>
                      );
                    })}
                  </div>
                </div>
              )}

              {section.id === "functional" && (
                <div style={{ display: "grid", gap: "var(--space-2)" }}>
                  {functionalNatureEntries.length > 0 ? (
                    functionalNatureEntries.map(([planet, nature]) => (
                      <div key={planet} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", background: "var(--color-surface)", padding: "var(--space-3)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
                          <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-strong)" }}>
                            {displayPlanet(planet, lang)}
                          </p>
                          <Chip>{natureLabel(nature, lang)}</Chip>
                        </div>
                        <p style={{ margin: "var(--space-2) 0 0", fontSize: "0.8125rem", color: "var(--color-muted)", lineHeight: 1.55 }}>
                          {natureNote(nature, lang)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-muted)", lineHeight: 1.55 }}>
                      {lang === "ta"
                        ? "இந்த சுருக்கத்தில் செயல்பாட்டு தன்மை தரவு இல்லை."
                        : "Functional nature data was not included in this summary."}
                    </p>
                  )}
                </div>
              )}

              {section.id === "yogas" && (
                <div style={{ display: "grid", gap: "var(--space-3)" }}>
                  {backendYogaDosham && (
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-muted)", lineHeight: 1.55 }}>
                      {tx(backendYogaDosham.explanation, lang)}
                    </p>
                  )}
                  <YogaDoshamPanel
                    lang={lang}
                    yogas={backendYogaDosham?.yogas ?? chart.yogas ?? []}
                    doshams={backendYogaDosham?.doshams ?? chart.doshams ?? []}
                  />
                </div>
              )}

              {section.id === "summary" && (
                <div style={{ display: "grid", gap: "var(--space-3)" }}>
                  <div style={{ display: "grid", gap: "var(--space-2)" }}>
                    <DetailRow
                      label={lang === "ta" ? "மிக வலுவான கிரகம்" : "Strongest planet"}
                      value={
                        backendSummary?.strongestPlanet
                          ? displayPlanet(backendSummary.strongestPlanet, lang)
                          : derived.strong
                          ? `${displayPlanet(derived.strong.graha, lang)} - ${Math.round(derived.strong.strengthScore ?? 0)}/100 - ${dignityFor(derived.strong, lang)}`
                          : (lang === "ta" ? "பலம் மதிப்பெண் இல்லை" : "No strength scores available")
                      }
                    />
                    <DetailRow
                      label={lang === "ta" ? "ஆதரவு தேவைப்படும் கிரகம்" : "Planet needing support"}
                      value={
                        backendSummary?.weakestPlanet
                          ? displayPlanet(backendSummary.weakestPlanet, lang)
                          : derived.weak
                          ? `${displayPlanet(derived.weak.graha, lang)} - ${Math.round(derived.weak.strengthScore ?? 0)}/100 - ${dignityFor(derived.weak, lang)}`
                          : (lang === "ta" ? "பலம் மதிப்பெண் இல்லை" : "No strength scores available")
                      }
                    />
                  </div>
                  <ul style={{ margin: 0, padding: "0 0 0 var(--space-4)", display: "grid", gap: "var(--space-1_5)" }}>
                    {backendSummary ? (
                      [...backendSummary.positives, ...backendSummary.cautions].map((item, index) => (
                        <li key={`${tx(item, "en")}-${index}`} style={{ fontSize: "0.875rem", color: "var(--color-text)", lineHeight: 1.55 }}>
                          {tx(item, lang)}
                        </li>
                      ))
                    ) : (
                      <>
                        <li style={{ fontSize: "0.875rem", color: "var(--color-text)", lineHeight: 1.55 }}>
                          {lang === "ta"
                            ? `${derived.kendraPlanets.length} கேந்திர கிரகங்கள் வாழ்க்கையின் வெளிப்படைத் துறைகளை சுறுசுறுப்பாக்கும். இதை திட்டமிட்ட செயலில் பயன்படுத்தலாம்.`
                            : `${derived.kendraPlanets.length} Kendra planets make the visible life areas more active. Use this through planned action.`}
                        </li>
                        <li style={{ fontSize: "0.875rem", color: "var(--color-text)", lineHeight: 1.55 }}>
                          {lang === "ta"
                            ? `${derived.dusthanaPlanets.length} துஷ்டான கிரகங்கள் கவனமும் ஒழுங்கும் கேட்கும். ஓய்வு, பழக்கம், கால மேலாண்மை உதவும்.`
                            : `${derived.dusthanaPlanets.length} Dusthana planets ask for care and refinement. Rest, routines, and time management help.`}
                        </li>
                        <li style={{ fontSize: "0.875rem", color: "var(--color-text)", lineHeight: 1.55 }}>
                          {lang === "ta"
                            ? `நடப்பு ${dashaLabel} இந்த விளக்கத்தின் செயல்படும் அடுக்கு. அந்த கிரகங்களின் வீடு மற்றும் பலத்தை முன்னுரிமையாக பார்க்கவும்.`
                            : `The current ${dashaLabel} is the active layer of this reading. Prioritize those planets' houses and strength.`}
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              )}

              {section.id === "peyarchi" && (
                <div style={{ display: "grid", gap: "var(--space-3)" }}>
                  {backendPeyarchi ? (
                    <>
                      <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-muted)", lineHeight: 1.55 }}>
                        {tx(backendPeyarchi.explanation, lang)}
                      </p>
                      {backendPeyarchi.events.length > 0 ? (
                        backendPeyarchi.events.map((event) => (
                          <div key={`${event.planet}-${event.eventDate}`} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "var(--space-3)", background: "var(--color-surface)" }}>
                            <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-strong)" }}>
                              {displayPlanet(event.planet, lang)} - {formatPeyarchiDate(event.eventDate)}
                            </p>
                            <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.8125rem", color: "var(--color-muted)", lineHeight: 1.55 }}>
                              {event.fromRasi} - {event.toRasi}; {lang === "ta" ? "சந்திரனிலிருந்து" : "from Moon"} {ordinalHouse(event.houseFromMoon, lang)},{" "}
                              {lang === "ta" ? "லக்னத்திலிருந்து" : "from Lagna"} {ordinalHouse(event.houseFromLagna, lang)}.
                            </p>
                            {event.saniCycleAfter && (
                              <div style={{ margin: "0 0 var(--space-2)", display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
                                <Chip>{saniCycleLabel(event.saniCycleAfter, lang)}</Chip>
                              </div>
                            )}
                            <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-text)", lineHeight: 1.55 }}>
                              {tx(event.explanation, lang)}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-muted)", lineHeight: 1.55 }}>
                          {lang === "ta" ? "இந்த காலச்சாளரத்தில் பெரிய பெயர்ச்சி நிகழ்வு இல்லை." : "No major peyarchi event in this window."}
                        </p>
                      )}
                      {backend?.methodNote && (
                        <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-faint)", lineHeight: 1.55 }}>
                          {tx(backend.methodNote, lang)}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                  <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "var(--space-3)", background: "var(--color-surface)" }}>
                    <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-strong)" }}>
                      {lang === "ta" ? "சனி" : "Sani / Saturn"}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-muted)", lineHeight: 1.55 }}>
                      {tx(derived.saniStage, lang)}
                      {derived.kandakaStage ? ` ${tx(derived.kandakaStage, lang)}` : ""}
                    </p>
                    {saniEvent && (
                      <p style={{ margin: "var(--space-2) 0 0", fontSize: "0.8125rem", color: "var(--color-text)", lineHeight: 1.55 }}>
                        {formatPeyarchiDate(saniEvent.peyarchiDateLocal)}: {saniEvent.fromRasi} - {saniEvent.toRasi};{" "}
                        {lang === "ta" ? "சந்திரனிலிருந்து" : "from Moon"} {ordinalHouse(saniEvent.impactFromMoon, lang)},{" "}
                        {lang === "ta" ? "லக்னத்திலிருந்து" : "from Lagna"} {ordinalHouse(saniEvent.impactFromLagna, lang)}.
                      </p>
                    )}
                  </div>

                  <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "var(--space-3)", background: "var(--color-surface)" }}>
                    <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-strong)" }}>
                      {lang === "ta" ? "குரு" : "Guru / Jupiter"}
                    </p>
                    {guruEvent ? (
                      <>
                        <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-muted)", lineHeight: 1.55 }}>
                          {formatPeyarchiDate(guruEvent.peyarchiDateLocal)}: {guruEvent.fromRasi} - {guruEvent.toRasi};{" "}
                          {lang === "ta" ? "சந்திரனிலிருந்து" : "from Moon"} {ordinalHouse(guruEvent.impactFromMoon, lang)}.{" "}
                          {guruQualityCopy(guruMoonQuality(guruEvent.impactFromMoon), lang)}
                        </p>
                        <p style={{ margin: "var(--space-2) 0 0", fontSize: "0.8125rem", color: "var(--color-text)", lineHeight: 1.55 }}>
                          {lang === "ta" ? "லக்னத்திலிருந்து இது தொடும் துறை" : "Life area from Lagna"}:{" "}
                          {ordinalHouse(guruEvent.impactFromLagna, lang)} - {tx(HOUSE_MEANING[guruEvent.impactFromLagna], lang)}.
                        </p>
                      </>
                    ) : (
                      <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-muted)", lineHeight: 1.55 }}>
                        {lang === "ta" ? "அடுத்த பெயர்ச்சி தரவு இந்த சாளரத்தில் இல்லை." : "No upcoming Jupiter peyarchi in this window."}
                      </p>
                    )}
                  </div>

                  <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "var(--space-3)", background: "var(--color-surface)" }}>
                    <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-strong)" }}>
                      {lang === "ta" ? "ராகு / கேது" : "Rahu / Ketu"}
                    </p>
                    {rahuEvent || ketuEvent ? (
                      <div style={{ display: "grid", gap: "var(--space-2)" }}>
                        {rahuEvent && (
                          <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-muted)", lineHeight: 1.55 }}>
                            {formatPeyarchiDate(rahuEvent.peyarchiDateLocal)}: {lang === "ta" ? "ராகு பெரிதாக்கும் பகுதி" : "Rahu amplifies"} -{" "}
                            {ordinalHouse(rahuEvent.impactFromMoon, lang)} {lang === "ta" ? "சந்திரனிலிருந்து" : "from Moon"},{" "}
                            {ordinalHouse(rahuEvent.impactFromLagna, lang)} {lang === "ta" ? "லக்னத்திலிருந்து" : "from Lagna"}.
                          </p>
                        )}
                        {ketuEvent && (
                          <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-muted)", lineHeight: 1.55 }}>
                            {formatPeyarchiDate(ketuEvent.peyarchiDateLocal)}: {lang === "ta" ? "கேது விடுவிக்கும் பகுதி" : "Ketu releases"} -{" "}
                            {ordinalHouse(ketuEvent.impactFromMoon, lang)} {lang === "ta" ? "சந்திரனிலிருந்து" : "from Moon"},{" "}
                            {ordinalHouse(ketuEvent.impactFromLagna, lang)} {lang === "ta" ? "லக்னத்திலிருந்து" : "from Lagna"}.
                          </p>
                        )}
                        <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-text)", lineHeight: 1.55 }}>
                          {lang === "ta"
                            ? "இந்த அச்சு ஆசை மற்றும் விடுவிப்பு ஆகிய இரண்டையும் ஒன்றாக இயக்கும். முடிவுகளை மெதுவாக சரிபார்த்து எடுப்பது உதவும்."
                            : "This axis activates both amplification and release. Slower verification before decisions is helpful."}
                        </p>
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-muted)", lineHeight: 1.55 }}>
                        {lang === "ta" ? "ராகு/கேது பெயர்ச்சி தரவு இந்த சாளரத்தில் இல்லை." : "No Rahu/Ketu peyarchi in this window."}
                      </p>
                    )}
                  </div>
                    </>
                  )}
                </div>
              )}
            </SectionFrame>
          ))}
        </div>
      )}
    </div>
  );
}
