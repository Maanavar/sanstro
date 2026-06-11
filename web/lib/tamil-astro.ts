const ROMAN_NAKSHATHIRAM_MAP: Record<string, string> = {
  "அஸ்வினி": "Aswini",
  ashwini: "Aswini",
  aswini: "Aswini",
  "பரணி": "Bharani",
  bharani: "Bharani",
  "கார்த்திகை": "Karthigai",
  krittika: "Karthigai",
  karthigai: "Karthigai",
  "ரோகிணி": "Rohini",
  rohini: "Rohini",
  "மிருகசீரிடம்": "Mirugaseeridam",
  mrigashira: "Mirugaseeridam",
  mirugaseeridam: "Mirugaseeridam",
  "திருவாதிரை": "Thiruvathirai",
  ardra: "Thiruvathirai",
  thiruvathirai: "Thiruvathirai",
  "புனர்பூசம்": "Punarpoosam",
  punarvasu: "Punarpoosam",
  punarpoosam: "Punarpoosam",
  "பூசம்": "Poosam",
  pushya: "Poosam",
  poosam: "Poosam",
  "ஆயில்யம்": "Ayilyam",
  ashlesha: "Ayilyam",
  ayilyam: "Ayilyam",
  "மகம்": "Magam",
  magha: "Magam",
  magam: "Magam",
  "பூரம்": "Pooram",
  "purva phalguni": "Pooram",
  pooram: "Pooram",
  "உத்திரம்": "Uthiram",
  "uttara phalguni": "Uthiram",
  uthiram: "Uthiram",
  "ஹஸ்தம்": "Hastham",
  hasta: "Hastham",
  hastham: "Hastham",
  "சித்திரை": "Chithirai",
  chitra: "Chithirai",
  chithirai: "Chithirai",
  "சுவாதி": "Swathi",
  swati: "Swathi",
  swathi: "Swathi",
  "விசாகம்": "Visakam",
  vishakha: "Visakam",
  visakam: "Visakam",
  "அனுஷம்": "Anusham",
  anuradha: "Anusham",
  anusham: "Anusham",
  "கேட்டை": "Kettai",
  jyeshtha: "Kettai",
  kettai: "Kettai",
  "மூலம்": "Moolam",
  mula: "Moolam",
  moola: "Moolam",
  moolam: "Moolam",
  "பூராடம்": "Pooradam",
  "purva ashadha": "Pooradam",
  pooradam: "Pooradam",
  "உத்திராடம்": "Uthiradam",
  "uttara ashadha": "Uthiradam",
  uthiradam: "Uthiradam",
  "திருவோணம்": "Thiruvonam",
  shravana: "Thiruvonam",
  thiruvonam: "Thiruvonam",
  "அவிட்டம்": "Avittam",
  dhanishtha: "Avittam",
  avittam: "Avittam",
  "சதயம்": "Sadayam",
  shatabhisha: "Sadayam",
  sadayam: "Sadayam",
  "பூரட்டாதி": "Poorattathi",
  "purva bhadra": "Poorattathi",
  "purva bhadrapada": "Poorattathi",
  poorattathi: "Poorattathi",
  "உத்திரட்டாதி": "Uthirattathi",
  "uttara bhadra": "Uthirattathi",
  "uttara bhadrapada": "Uthirattathi",
  uthirattathi: "Uthirattathi",
  "ரேவதி": "Revathi",
  revati: "Revathi",
  revathi: "Revathi",
};

const PHRASE_REPLACEMENTS = [
  ["Nakshatras", "Nakshathirams"],
  ["Nakshatra", "Nakshathiram"],
];

const TAMIL_ASTRO_REPLACEMENTS: Array<[string, string]> = [
  ["ஜன்ம ஜாதகம்", "பிறப்பு ஜாதகம்"],
  ["ஜன்ம நட்சத்திரம்", "பிறப்பு நட்சத்திரம்"],
  ["ஜன்ம சந்திர ராசி", "பிறப்பு சந்திர ராசி"],
  ["ஜன்ம ராசி", "பிறப்பு ராசி"],
  ["ஜன்ம விவரங்கள்", "பிறப்பு விவரங்கள்"],
  ["ஜன்ம விவரம்", "பிறப்பு விவரம்"],
  ["ஜன்ம", "பிறப்பு"],
  ["கோசாரம்", "கிரகநகர்வு"],
];

const ENGLISH_NAME_KEYS = Object.keys(ROMAN_NAKSHATHIRAM_MAP)
  .filter((key) => /^[a-z ]+$/.test(key))
  .sort((a, b) => b.length - a.length);

function normalizeTraditionalName(value: string): string {
  return value.trim().toLowerCase().replace(/[-_/]+/g, " ").replace(/\s+/g, " ");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function romanNakshathiramName(value: string): string {
  const normalized = normalizeTraditionalName(value);
  return ROMAN_NAKSHATHIRAM_MAP[normalized] ?? ROMAN_NAKSHATHIRAM_MAP[value] ?? value;
}

export function romanNakshathiramLabel(value: string): string {
  return `${romanNakshathiramName(value)} Nakshathiram`;
}

export function tamilizeAstroEnglish(text: string): string {
  let next = text;

  for (const [from, to] of PHRASE_REPLACEMENTS) {
    next = next.replace(new RegExp(`\\b${escapeRegExp(from)}\\b`, "g"), to);
  }

  for (const key of ENGLISH_NAME_KEYS) {
    const replacement = ROMAN_NAKSHATHIRAM_MAP[key];
    next = next.replace(new RegExp(`\\b${escapeRegExp(key)}\\b`, "gi"), replacement);
  }

  return next;
}

export function normalizeTamilAstroText(text: string): string {
  let next = text;

  for (const [from, to] of TAMIL_ASTRO_REPLACEMENTS) {
    next = next.split(from).join(to);
  }

  return next;
}
