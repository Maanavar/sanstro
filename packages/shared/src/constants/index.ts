export * from "./tiers";

import type { BiText } from "../types";

export const RASI_LIST: Array<{ number: number; slug: string; name: BiText }> = [
  { number: 1,  slug: "mesham",     name: { ta: "மேஷம்",      en: "Aries" } },
  { number: 2,  slug: "rishabam",   name: { ta: "ரிஷபம்",     en: "Taurus" } },
  { number: 3,  slug: "mithunam",   name: { ta: "மிதுனம்",    en: "Gemini" } },
  { number: 4,  slug: "katakam",    name: { ta: "கடகம்",      en: "Cancer" } },
  { number: 5,  slug: "simham",     name: { ta: "சிம்மம்",    en: "Leo" } },
  { number: 6,  slug: "kanni",      name: { ta: "கன்னி",      en: "Virgo" } },
  { number: 7,  slug: "thulam",     name: { ta: "துலாம்",     en: "Libra" } },
  { number: 8,  slug: "viruchigam", name: { ta: "விருச்சிகம்", en: "Scorpio" } },
  { number: 9,  slug: "dhanusu",    name: { ta: "தனுசு",      en: "Sagittarius" } },
  { number: 10, slug: "makaram",    name: { ta: "மகரம்",      en: "Capricorn" } },
  { number: 11, slug: "kumbam",     name: { ta: "கும்பம்",    en: "Aquarius" } },
  { number: 12, slug: "meenam",     name: { ta: "மீனம்",      en: "Pisces" } },
];

export const NAKSHATRA_LIST: Array<{ number: number; slug: string; name: BiText }> = [
  { number: 1,  slug: "ashwini",       name: { ta: "அஸ்வினி",      en: "Aswini" } },
  { number: 2,  slug: "bharani",       name: { ta: "பரணி",          en: "Bharani" } },
  { number: 3,  slug: "krittika",      name: { ta: "கார்த்திகை",    en: "Karthigai" } },
  { number: 4,  slug: "rohini",        name: { ta: "ரோகிணி",        en: "Rohini" } },
  { number: 5,  slug: "mrigashira",    name: { ta: "மிருகசீரிடம்",  en: "Mirugaseeridam" } },
  { number: 6,  slug: "ardra",         name: { ta: "திருவாதிரை",    en: "Thiruvathirai" } },
  { number: 7,  slug: "punarvasu",     name: { ta: "புனர்பூசம்",    en: "Punarpoosam" } },
  { number: 8,  slug: "pushya",        name: { ta: "பூசம்",         en: "Poosam" } },
  { number: 9,  slug: "ashlesha",      name: { ta: "ஆயில்யம்",      en: "Ayilyam" } },
  { number: 10, slug: "magha",         name: { ta: "மகம்",          en: "Magam" } },
  { number: 11, slug: "purva-phalguni", name: { ta: "பூரம்",        en: "Pooram" } },
  { number: 12, slug: "uttara-phalguni", name: { ta: "உத்திரம்",    en: "Uthiram" } },
  { number: 13, slug: "hasta",         name: { ta: "ஹஸ்தம்",        en: "Hastham" } },
  { number: 14, slug: "chitra",        name: { ta: "சித்திரை",      en: "Chithirai" } },
  { number: 15, slug: "swati",         name: { ta: "சுவாதி",        en: "Swathi" } },
  { number: 16, slug: "vishakha",      name: { ta: "விசாகம்",       en: "Visakam" } },
  { number: 17, slug: "anuradha",      name: { ta: "அனுஷம்",        en: "Anusham" } },
  { number: 18, slug: "jyeshtha",      name: { ta: "கேட்டை",        en: "Kettai" } },
  { number: 19, slug: "mula",          name: { ta: "மூலம்",         en: "Moolam" } },
  { number: 20, slug: "purva-ashadha", name: { ta: "பூராடம்",       en: "Pooradam" } },
  { number: 21, slug: "uttara-ashadha", name: { ta: "உத்திராடம்",   en: "Uthiradam" } },
  { number: 22, slug: "shravana",      name: { ta: "திருவோணம்",     en: "Thiruvonam" } },
  { number: 23, slug: "dhanishtha",    name: { ta: "அவிட்டம்",      en: "Avittam" } },
  { number: 24, slug: "shatabhisha",   name: { ta: "சதயம்",         en: "Sadayam" } },
  { number: 25, slug: "purva-bhadra",  name: { ta: "பூரட்டாதி",     en: "Poorattathi" } },
  { number: 26, slug: "uttara-bhadra", name: { ta: "உத்திரட்டாதி",  en: "Uthirattathi" } },
  { number: 27, slug: "revati",        name: { ta: "ரேவதி",         en: "Revathi" } },
];

export const LIFE_EVENT_TYPES = [
  "CAREER", "MARRIAGE", "STUDIES", "RELOCATION", "HEALTH_CAUTION",
] as const;

export type LifeEventTypeConst = (typeof LIFE_EVENT_TYPES)[number];

export const GRAHAS = [
  "SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU",
] as const;

export type GrahaName = (typeof GRAHAS)[number];

export const GRAHA_LABELS: Record<GrahaName, BiText> = {
  SUN:     { ta: "சூரியன்", en: "Sun" },
  MOON:    { ta: "சந்திரன்", en: "Moon" },
  MARS:    { ta: "செவ்வாய்", en: "Mars" },
  MERCURY: { ta: "புதன்",    en: "Mercury" },
  JUPITER: { ta: "குரு",     en: "Jupiter" },
  VENUS:   { ta: "சுக்கிரன்", en: "Venus" },
  SATURN:  { ta: "சனி",      en: "Saturn" },
  RAHU:    { ta: "ராகு",     en: "Rahu" },
  KETU:    { ta: "கேது",     en: "Ketu" },
};
