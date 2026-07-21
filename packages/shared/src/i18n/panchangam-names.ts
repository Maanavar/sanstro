// ── Panchangam element name lookups (Thirukanitham tradition) ────────────────
//
// The backend emits tithi / nakshatra / yoga / karana as language-neutral
// uppercase keys (see app/calculations/panchangam.py — TITHI_NAMES, YOGA_NAMES,
// MOVABLE_KARANAS, _karana_name). Every surface that renders those fields must
// map them through here; rendering `response.karana.name` directly puts a raw
// `KAULAVA` on screen in both languages.
//
// This module is the single source of truth for these four maps — web
// (web/lib/i18n.ts) and mobile both read from it. Correct a name here once.

import type { Lang } from "./strings";

export type PanchangamNameMap = Record<string, { ta: string; en: string }>;

export const TITHI_NAMES: PanchangamNameMap = {
  PRATHAMA:    { ta: "பிரதமை",    en: "Prathama" },
  DVITHIYAI:   { ta: "துவிதியை",  en: "Dvithiyai" },
  THRITHIYAI:  { ta: "திரிதியை",  en: "Thrithiyai" },
  CHATHURTHI:  { ta: "சதுர்த்தி", en: "Chathurthi" },
  PANCHAMI:    { ta: "பஞ்சமி",    en: "Panchami" },
  SHASHTI:     { ta: "சஷ்டி",     en: "Shashti" },
  SAPTAMI:     { ta: "சப்தமி",    en: "Saptami" },
  ASHTAMI:     { ta: "அஷ்டமி",   en: "Ashtami" },
  NAVAMI:      { ta: "நவமி",      en: "Navami" },
  DASAMI:      { ta: "தசமி",      en: "Dasami" },
  EKADASI:     { ta: "ஏகாதசி",   en: "Ekadasi" },
  DVADASI:     { ta: "துவாதசி",   en: "Dvadasi" },
  THRAYODASI:  { ta: "திரயோதசி", en: "Thrayodasi" },
  CHATHURDASI: { ta: "சதுர்தசி",  en: "Chathurdasi" },
  POURNAMI:    { ta: "பௌர்ணமி",   en: "Pournami" },
  AMAVASAI:    { ta: "அமாவாசை",  en: "Amavasai" },
};

// Insertion order is load-bearing: Aswini=1 … Revathi=27 is the canonical
// nakshatra numbering used to resolve a name back to a number. Do not reorder.
export const NAKSHATRA_NAMES: PanchangamNameMap = {
  ASWINI:         { ta: "அஸ்வினி",        en: "Aswini" },
  BHARANI:        { ta: "பரணி",            en: "Bharani" },
  KARTHIGAI:      { ta: "கார்த்திகை",     en: "Karthigai" },
  ROHINI:         { ta: "ரோகிணி",         en: "Rohini" },
  MIRUGASEERIDAM: { ta: "மிருகசீரிடம்",   en: "Mirugaseeridam" },
  THIRUVATHIRAI:  { ta: "திருவாதிரை",     en: "Thiruvathirai" },
  PUNARPOOSAM:    { ta: "புனர்பூசம்",     en: "Punarpoosam" },
  POOSAM:         { ta: "பூசம்",           en: "Poosam" },
  AYILYAM:        { ta: "ஆயில்யம்",       en: "Ayilyam" },
  MAGAM:          { ta: "மகம்",            en: "Magam" },
  POORAM:         { ta: "பூரம்",           en: "Pooram" },
  UTHIRAM:        { ta: "உத்திரம்",        en: "Uthiram" },
  HASTHAM:        { ta: "ஹஸ்தம்",         en: "Hastham" },
  CHITHIRAI:      { ta: "சித்திரை",        en: "Chithirai" },
  SWATHI:         { ta: "சுவாதி",          en: "Swathi" },
  VISAKAM:        { ta: "விசாகம்",         en: "Visakam" },
  ANUSHAM:        { ta: "அனுஷம்",         en: "Anusham" },
  KETTAI:         { ta: "கேட்டை",          en: "Kettai" },
  MOOLAM:         { ta: "மூலம்",           en: "Moolam" },
  POORADAM:       { ta: "பூராடம்",         en: "Pooradam" },
  UTHIRADAM:      { ta: "உத்திராடம்",      en: "Uthiradam" },
  THIRUVONAM:     { ta: "திருவோணம்",       en: "Thiruvonam" },
  AVITTAM:        { ta: "அவிட்டம்",        en: "Avittam" },
  SADAYAM:        { ta: "சதயம்",           en: "Sadayam" },
  POORATTATHI:    { ta: "பூரட்டாதி",       en: "Poorattathi" },
  UTHIRATTATHI:   { ta: "உத்திரட்டாதி",    en: "Uthirattathi" },
  REVATHI:        { ta: "ரேவதி",           en: "Revathi" },
};

export const YOGA_NAMES: PanchangamNameMap = {
  VISHKAMBHA: { ta: "விஷ்கம்பம்", en: "Vishkambha" },
  PRITI:      { ta: "பிரீதி",     en: "Priti" },
  AYUSHMAN:   { ta: "ஆயுஷ்மான்", en: "Ayushman" },
  SAUBHAGYA:  { ta: "சௌபாக்கியம்", en: "Saubhagya" },
  SHOBHANA:   { ta: "சோபன",       en: "Shobhana" },
  ATIGANDA:   { ta: "அதிகண்ட",    en: "Atiganda" },
  SUKARMA:    { ta: "சுகர்ம",      en: "Sukarma" },
  DHRITI:     { ta: "திருதி",      en: "Dhriti" },
  SHOOLA:     { ta: "சூல",         en: "Shoola" },
  GANDA:      { ta: "கண்ட",        en: "Ganda" },
  VRIDDHI:    { ta: "விருத்தி",    en: "Vriddhi" },
  DHRUVA:     { ta: "த்ருவ",       en: "Dhruva" },
  VYAGHATA:   { ta: "வியாகாத",    en: "Vyaghata" },
  HARSHANA:   { ta: "ஹர்ஷண",      en: "Harshana" },
  VAJRA:      { ta: "வஜ்ர",        en: "Vajra" },
  SIDDHI:     { ta: "சித்தி",      en: "Siddhi" },
  VYATIPATA:  { ta: "வியதீபாத",   en: "Vyatipata" },
  VARIYANA:   { ta: "வரியான",      en: "Variyana" },
  PARIGHA:    { ta: "பரிகம்",      en: "Parigha" },
  SHIVA:      { ta: "சிவ",          en: "Shiva" },
  SIDDHA:     { ta: "சித்த",        en: "Siddha" },
  SADHYA:     { ta: "சாத்ய",        en: "Sadhya" },
  SHUBHA:     { ta: "சுப",           en: "Shubha" },
  SHUKLA:     { ta: "சுக்ல",         en: "Shukla" },
  BRAHMA:     { ta: "பிரம்ம",       en: "Brahma" },
  INDRA:      { ta: "இந்திர",        en: "Indra" },
  VAIDHRITI:  { ta: "வைத்ருதி",     en: "Vaidhriti" },
};

// Tamil almanac forms, confirmed by the project astrologer 2026-07-20. These
// replaced the previous Sanskrit-transliterated values (Vishti / Garaja /
// Vanija / Taitila), which are not what a Tamil almanac prints. The English
// column romanises the Tamil name rather than reverting to the Sanskrit.
//
// The uppercase KEYS remain the Sanskrit-derived wire values emitted by
// app/calculations/panchangam.py — those are the language-neutral contract and
// must not be renamed here.
export const KARANA_NAMES: PanchangamNameMap = {
  BAVA:    { ta: "பவம்",     en: "Bavam" },
  BALAVA:  { ta: "பாலவம்",  en: "Baalavam" },
  KAULAVA: { ta: "கௌலவம்", en: "Kaulavam" },
  TAITILA: { ta: "தைதுலம்", en: "Thaithulam" },
  GARAJA:  { ta: "கரசை",    en: "Karasai" },
  VANIJA:  { ta: "வணிசை",   en: "Vanisai" },
  VISHTI:  { ta: "பத்திரை",  en: "Paththirai" },
  SHAKUNI: { ta: "சகுனி",    en: "Sakuni" },
  CHATUSHPADA: { ta: "சதுஷ்பாதம்", en: "Chathushpatham" },
  NAGA:    { ta: "நாகவம்",   en: "Naagavam" },
  KIMSTUGHNA: { ta: "கிம்ஸ்துக்னம்", en: "Kimsthugnam" },
};

export function lookupPanchangamName(
  map: PanchangamNameMap,
  key: string | null | undefined,
  lang: Lang,
): string {
  const rawKey = typeof key === "string" ? key.trim() : "";
  if (!rawKey) return "";
  const entry = map[rawKey.toUpperCase()];
  if (!entry) return rawKey; // fallback: return the raw key unchanged
  return entry[lang];
}

export function tTithi(key: string | null | undefined, lang: Lang): string {
  return lookupPanchangamName(TITHI_NAMES, key, lang);
}

export function tNakshatra(key: string | null | undefined, lang: Lang): string {
  return lookupPanchangamName(NAKSHATRA_NAMES, key, lang);
}

export function tYoga(key: string | null | undefined, lang: Lang): string {
  return lookupPanchangamName(YOGA_NAMES, key, lang);
}

export function tKarana(key: string | null | undefined, lang: Lang): string {
  return lookupPanchangamName(KARANA_NAMES, key, lang);
}
