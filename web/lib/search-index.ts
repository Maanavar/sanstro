// MKT-03 — phase-1 client-side site search index.
//
// Deliberately a compact, self-contained static table (title EN + Tamil + a
// keyword/transliteration hint per page) rather than importing the heavy
// `natchathiram-data.ts` / `guide-detail-content.ts` prose modules — those would
// ship the full bilingual content into the shared nav bundle on every page. The
// Tamil strings here are copied verbatim from those authoritative sources; a
// phase-2 build step could generate this table from them to remove the drift
// risk. Draft/unreviewed dosham slugs (rahu-ketu, badhaka, marana-karaka) are
// intentionally excluded, matching DRAFT_GUIDE_SLUGS on the public pages.

export type SearchCategory =
  | "Nakshatra"
  | "Dosham"
  | "Yogam"
  | "Temple"
  | "Pariharam"
  | "Tool"
  | "Page";

export interface SearchDoc {
  href: string;
  en: string;
  ta: string;
  category: SearchCategory;
  /** Extra transliteration variants / synonyms to match on (e.g. the Sanskrit slug). */
  kw?: string;
}

const NAKSHATRAS: SearchDoc[] = [
  { en: "Aswini", ta: "அஸ்வினி", kw: "ashwini", href: "/natchathiram/ashwini", category: "Nakshatra" },
  { en: "Bharani", ta: "பரணி", kw: "bharani", href: "/natchathiram/bharani", category: "Nakshatra" },
  { en: "Karthigai", ta: "கார்த்திகை", kw: "krittika karthikai", href: "/natchathiram/krittika", category: "Nakshatra" },
  { en: "Rohini", ta: "ரோகிணி", kw: "rohini", href: "/natchathiram/rohini", category: "Nakshatra" },
  { en: "Mirugaseeridam", ta: "மிருகசீரிடம்", kw: "mrigashira", href: "/natchathiram/mrigashira", category: "Nakshatra" },
  { en: "Thiruvathirai", ta: "திருவாதிரை", kw: "ardra arudra", href: "/natchathiram/ardra", category: "Nakshatra" },
  { en: "Punarpoosam", ta: "புனர்பூசம்", kw: "punarvasu", href: "/natchathiram/punarvasu", category: "Nakshatra" },
  { en: "Poosam", ta: "பூசம்", kw: "pushya poosam", href: "/natchathiram/pushya", category: "Nakshatra" },
  { en: "Ayilyam", ta: "ஆயில்யம்", kw: "ashlesha", href: "/natchathiram/ashlesha", category: "Nakshatra" },
  { en: "Magam", ta: "மகம்", kw: "magha", href: "/natchathiram/magha", category: "Nakshatra" },
  { en: "Pooram", ta: "பூரம்", kw: "purva-phalguni pubba", href: "/natchathiram/purva-phalguni", category: "Nakshatra" },
  { en: "Uthiram", ta: "உத்திரம்", kw: "uttara-phalguni", href: "/natchathiram/uttara-phalguni", category: "Nakshatra" },
  { en: "Hastham", ta: "ஹஸ்தம்", kw: "hasta hastham", href: "/natchathiram/hasta", category: "Nakshatra" },
  { en: "Chithirai", ta: "சித்திரை", kw: "chitra chithira", href: "/natchathiram/chitra", category: "Nakshatra" },
  { en: "Swathi", ta: "சுவாதி", kw: "swati", href: "/natchathiram/swati", category: "Nakshatra" },
  { en: "Visakam", ta: "விசாகம்", kw: "vishakha visaka", href: "/natchathiram/vishakha", category: "Nakshatra" },
  { en: "Anusham", ta: "அனுஷம்", kw: "anuradha", href: "/natchathiram/anuradha", category: "Nakshatra" },
  { en: "Kettai", ta: "கேட்டை", kw: "jyeshtha", href: "/natchathiram/jyeshtha", category: "Nakshatra" },
  { en: "Moolam", ta: "மூலம்", kw: "mula moola", href: "/natchathiram/mula", category: "Nakshatra" },
  { en: "Pooradam", ta: "பூராடம்", kw: "purva-ashadha", href: "/natchathiram/purva-ashadha", category: "Nakshatra" },
  { en: "Uthiradam", ta: "உத்திராடம்", kw: "uttara-ashadha", href: "/natchathiram/uttara-ashadha", category: "Nakshatra" },
  { en: "Thiruvonam", ta: "திருவோணம்", kw: "shravana", href: "/natchathiram/shravana", category: "Nakshatra" },
  { en: "Avittam", ta: "அவிட்டம்", kw: "dhanishtha", href: "/natchathiram/dhanishtha", category: "Nakshatra" },
  { en: "Sadayam", ta: "சதயம்", kw: "shatabhisha sadhayam", href: "/natchathiram/shatabhisha", category: "Nakshatra" },
  { en: "Poorattathi", ta: "பூரட்டாதி", kw: "purva-bhadra", href: "/natchathiram/purva-bhadra", category: "Nakshatra" },
  { en: "Uthirattathi", ta: "உத்திரட்டாதி", kw: "uttara-bhadra", href: "/natchathiram/uttara-bhadra", category: "Nakshatra" },
  { en: "Revathi", ta: "ரேவதி", kw: "revati", href: "/natchathiram/revati", category: "Nakshatra" },
];

const DOSHAMS: SearchDoc[] = [
  { en: "Naga / Sarpa Dosham", ta: "நாக / சர்ப்ப தோஷம்", kw: "sarpa naga", href: "/dosham/naga-sarpa-dosham", category: "Dosham" },
  { en: "Kala Sarpa Dosham", ta: "கால சர்ப்ப தோஷம்", kw: "kalasarpa", href: "/dosham/kala-sarpa-dosham", category: "Dosham" },
  { en: "Pithru Dosham", ta: "பித்ரு தோஷம்", kw: "pitru", href: "/dosham/pithru-dosham", category: "Dosham" },
  { en: "Kalathra Dosham", ta: "களத்திர தோஷம்", kw: "kalathra", href: "/dosham/kalathra-dosham", category: "Dosham" },
  { en: "Sevvai Dosham", ta: "செவ்வாய் தோஷம்", kw: "chevvai mangal manglik", href: "/dosham/sevvai-dosham", category: "Dosham" },
];

const YOGAMS: SearchDoc[] = [
  { en: "Gaja Kesari Yogam", ta: "கஜகேசரி யோகம்", kw: "gajakesari", href: "/yogam/gaja-kesari-yogam", category: "Yogam" },
  { en: "Dhana Yogam", ta: "தன யோகம்", kw: "dhana wealth", href: "/yogam/dhana-yogam", category: "Yogam" },
  { en: "Budha-Aditya Yogam", ta: "புத-ஆதித்ய யோகம்", kw: "budha aditya", href: "/yogam/budha-aditya-yogam", category: "Yogam" },
  { en: "Neecha Bhanga Raja Yogam", ta: "நீச பங்க ராஜ யோகம்", kw: "neecha bhanga", href: "/yogam/neecha-bhanga-raja-yogam", category: "Yogam" },
  { en: "Raja Yogam", ta: "ராஜ யோகம்", kw: "raja", href: "/yogam/raja-yogam", category: "Yogam" },
];

const TEMPLES: SearchDoc[] = [
  { en: "Suryanar Koil", ta: "சூரியனார் கோயில்", kw: "surya sun navagraha", href: "/temples/suryanar-koil", category: "Temple" },
  { en: "Thingalur Chandran Temple", ta: "திங்களூர் சந்திரன் கோயில்", kw: "chandra moon navagraha", href: "/temples/thingalur", category: "Temple" },
  { en: "Vaitheeswaran Koil", ta: "வைத்தீஸ்வரன் கோயில்", kw: "sevvai mars angaraka navagraha", href: "/temples/vaitheeswaran-koil", category: "Temple" },
  { en: "Thiruvenkadu Budhan Temple", ta: "திருவெண்காடு புதன் கோயில்", kw: "budha mercury navagraha", href: "/temples/thiruvenkadu", category: "Temple" },
  { en: "Alangudi Guru Temple", ta: "ஆலங்குடி குரு கோயில்", kw: "guru jupiter navagraha", href: "/temples/alangudi", category: "Temple" },
  { en: "Kanjanur Sukran Temple", ta: "காஞ்சனூர் சுக்கிரன் கோயில்", kw: "sukra venus navagraha", href: "/temples/kanjanur", category: "Temple" },
  { en: "Thirunageswaram Rahu Temple", ta: "திருநாகேஸ்வரம் ராகு கோயில்", kw: "rahu navagraha", href: "/temples/thirunageswaram", category: "Temple" },
  { en: "Keezhaperumpallam Ketu Temple", ta: "கீழப்பெரும்பள்ளம் கேது கோயில்", kw: "ketu navagraha", href: "/temples/keezhaperumpallam", category: "Temple" },
  { en: "Thirumananjeri", ta: "திருமணஞ்சேரி", kw: "marriage", href: "/temples/thirumananjeri", category: "Temple" },
  { en: "Pancha Bhoota Sthalams", ta: "பஞ்ச பூத ஸ்தலங்கள்", kw: "panchabhoota five elements", href: "/temples/pancha-bhoota-sthalams", category: "Temple" },
  { en: "Arupadai Veedu", ta: "அறுபடை வீடு", kw: "murugan six abodes", href: "/temples/arupadai-veedu", category: "Temple" },
];

const PARIHARAMS: SearchDoc[] = [
  { en: "Rahu-Ketu Pariharam", ta: "ராகு-கேது பரிகாரம்", kw: "rahu ketu remedy", href: "/pariharam/rahu-ketu-pariharam", category: "Pariharam" },
  { en: "Sevvai Dosham Pariharam", ta: "செவ்வாய் தோஷ பரிகாரம்", kw: "chevvai mangal remedy", href: "/pariharam/sevvai-dosha-pariharam", category: "Pariharam" },
  { en: "Naga Dosham Pariharam", ta: "நாக தோஷ பரிகாரம்", kw: "sarpa remedy", href: "/pariharam/naga-dosha-pariharam", category: "Pariharam" },
  { en: "Kadan (Debt) Pariharam", ta: "கடன் பரிகாரம்", kw: "debt remedy", href: "/pariharam/kadan-pariharam", category: "Pariharam" },
  { en: "Puthra (Childbirth) Pariharam", ta: "புத்திர பரிகாரம்", kw: "childbirth santhana remedy", href: "/pariharam/puthra-pariharam", category: "Pariharam" },
  { en: "Health (Ayul) Pariharam", ta: "ஆயுள் / ஆரோக்கிய பரிகாரம்", kw: "health remedy", href: "/pariharam/ayul-pariharam", category: "Pariharam" },
  { en: "Thirumana Thadai (Marriage Delay)", ta: "திருமணத் தடை பரிகாரம்", kw: "marriage delay remedy", href: "/pariharam/thirumana-thadai", category: "Pariharam" },
];

const TOOLS: SearchDoc[] = [
  { en: "Marriage Porutham Calculator", ta: "திருமண பொருத்தம்", kw: "porutham match compatibility", href: "/tools/marriage-porutham-calculator", category: "Tool" },
  { en: "Jadhagam Generator", ta: "ஜாதகம் உருவாக்கு", kw: "horoscope birth chart", href: "/tools/jadhagam-generator", category: "Tool" },
  { en: "Daily Panchangam Planner", ta: "தின பஞ்சாங்கம்", kw: "panchangam tithi", href: "/tools/daily-panchangam-planner", category: "Tool" },
  { en: "Birth Time Rectification", ta: "பிறப்பு நேர திருத்தம்", kw: "rectification", href: "/tools/birth-time-rectification", category: "Tool" },
  { en: "Indraiya Rasi Palan", ta: "இன்றைய ராசி பலன்", kw: "rasi palan daily horoscope", href: "/tools/indraiya-rasipalan", category: "Tool" },
  { en: "Muhurta Calculator", ta: "முகூர்த்தம்", kw: "muhurtham muhurta", href: "/tools/muhurta-calculator", category: "Tool" },
  { en: "Chandrashtama", ta: "சந்திராஷ்டமம்", kw: "chandrashtama", href: "/tools/chandrashtama", category: "Tool" },
  { en: "Friendship Compatibility", ta: "நட்பு பொருத்தம்", kw: "friendship compatibility", href: "/tools/friendship-compatibility", category: "Tool" },
  { en: "Baby Name Finder", ta: "பெயர் தேடல்", kw: "baby names nakshatra pada", href: "/tools/baby-name-finder", category: "Tool" },
];

const PAGES: SearchDoc[] = [
  { en: "Pricing", ta: "விலை", kw: "plans premium subscription", href: "/pricing", category: "Page" },
  { en: "27 Nakshathirams", ta: "27 நட்சத்திரங்கள்", kw: "natchathiram stars", href: "/natchathiram", category: "Page" },
  { en: "Doshams", ta: "தோஷங்கள்", kw: "dosham", href: "/dosham", category: "Page" },
  { en: "Yogams", ta: "யோகங்கள்", kw: "yogam", href: "/yogam", category: "Page" },
  { en: "Pariharam", ta: "பரிகாரம்", kw: "remedies", href: "/pariharam", category: "Page" },
  { en: "Temples", ta: "கோயில்கள்", kw: "temple navagraha", href: "/temples", category: "Page" },
  { en: "Muhurtham Naal", ta: "முகூர்த்த நாள்", kw: "wedding dates muhurtham", href: "/muhurtham-naal", category: "Page" },
  { en: "Tamil Calendar", ta: "தமிழ் நாட்காட்டி", kw: "calendar pournami amavasai", href: "/tamil-calendar", category: "Page" },
  { en: "What is Thirukanitham?", ta: "திருக்கணிதம் என்றால் என்ன?", kw: "learn methodology", href: "/learn/what-is-thirukanitham", category: "Page" },
  { en: "Methodology", ta: "முறையியல்", kw: "trust drik ganita", href: "/trust/methodology", category: "Page" },
];

export const SEARCH_DOCS: SearchDoc[] = [
  ...NAKSHATRAS,
  ...DOSHAMS,
  ...YOGAMS,
  ...TEMPLES,
  ...PARIHARAMS,
  ...TOOLS,
  ...PAGES,
];

/** Rank-and-filter the index for a query. Prefix matches rank above substring
 *  matches so the intended page surfaces within a keystroke or two. */
export function searchSite(query: string, limit = 12): SearchDoc[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored: { doc: SearchDoc; score: number }[] = [];
  for (const doc of SEARCH_DOCS) {
    const en = doc.en.toLowerCase();
    const ta = doc.ta.toLowerCase();
    const kw = (doc.kw ?? "").toLowerCase();
    let score = 0;
    if (en.startsWith(q) || ta.startsWith(q)) score = 3;
    else if (en.includes(q) || ta.includes(q)) score = 2;
    else if (kw.includes(q)) score = 1;
    if (score > 0) scored.push({ doc, score });
  }
  scored.sort((a, b) => b.score - a.score || a.doc.en.localeCompare(b.doc.en));
  return scored.slice(0, limit).map((s) => s.doc);
}
