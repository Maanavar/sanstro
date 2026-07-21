// Short, plain-language definitions for Jothidam terms that recur on the Deep
// Dive surface. Kept separate from i18n.ts's label dictionaries because these
// are explanatory sentences, not UI labels — see H8 (#15/#24/#89).
export type GlossaryKey =
  | "dasha"
  | "bhukti"
  | "rasi"
  | "nakshatra"
  | "gochar"
  | "shadbala"
  | "sthanaBala"
  | "digBala"
  | "kalaBala"
  | "chestaBala"
  | "naisargikaBala"
  | "drikBala"
  | "varga"
  | "navamsa"
  | "atmakaraka"
  | "karakamsa"
  | "yoginiDasha"
  | "ashtottariDasha"
  | "kalachakraDasha"
  | "charaDasha";

export const GLOSSARY: Record<GlossaryKey, { ta: string; en: string }> = {
  dasha: {
    en: "A planetary time period. Different planets take charge for different stretches of your life, shaping which themes are most active.",
    ta: "ஒரு கிரகத்தின் ஆட்சிக் காலம். வெவ்வேறு கிரகங்கள் வாழ்க்கையின் வெவ்வேறு காலகட்டங்களில் ஆதிக்கம் செலுத்தும் — அதனால் எந்த வாழ்க்கைத் துறை செயலில் உள்ளது என்பதை இது காட்டும்.",
  },
  bhukti: {
    en: "A shorter sub-period inside a dasha, adding finer detail to which weeks or months feel a certain way.",
    ta: "தசைக்குள் இருக்கும் ஒரு சிறிய துணைக் காலம். எந்த வாரங்கள்/மாதங்கள் எப்படி இருக்கும் என்பதை இன்னும் நுணுக்கமாகக் காட்டும்.",
  },
  gochar: {
    en: "Transit — where the planets are moving right now, compared against your birth chart.",
    ta: "கிரகநகர்வு — கிரகங்கள் இப்போது எங்கு நகர்கின்றன என்பதை உங்கள் பிறப்பு ஜாதகத்துடன் ஒப்பிட்டுப் பார்ப்பது.",
  },
  rasi: {
    en: "Your Moon sign — the zodiac sign the Moon was in at the moment you were born. Used for general predictions, and as one of the checks in marriage matching.",
    ta: "உங்கள் சந்திர ராசி — நீங்கள் பிறந்த நேரத்தில் சந்திரன் இருந்த ராசி. பொதுவான பலன்கள் மற்றும் திருமண பொருத்தத்தின் ஒரு பகுதிக்கும் பயன்படுகிறது.",
  },
  nakshatra: {
    en: "Your birth star — one of 27 star divisions the Moon was in at your exact birth time. More precise than the Rasi, and the main factor classical marriage matching (Porutham) is based on.",
    ta: "உங்கள் பிறப்பு நட்சத்திரம் — நீங்கள் பிறந்த சரியான நேரத்தில் சந்திரன் இருந்த 27 நட்சத்திரப் பிரிவுகளில் ஒன்று. ராசியை விட நுட்பமானது, பாரம்பரிய திருமண பொருத்தத்தின் (பொருத்தம்) முதன்மை அடிப்படை இதுவே.",
  },
  shadbala: {
    en: "A classical six-part strength score for each planet in your chart.",
    ta: "உங்கள் ஜாதகத்தில் ஒவ்வொரு கிரகத்திற்குமான பாரம்பரிய ஆறு-கூறு பலத் தரவரிசை.",
  },
  sthanaBala: {
    en: "Positional strength — how favourable the planet's sign placement is.",
    ta: "ஸ்தான பலம் — கிரகம் இருக்கும் ராசி நிலை எவ்வளவு சாதகமானது என்பது.",
  },
  digBala: {
    en: "Directional strength — whether the planet sits in the house direction it naturally favours.",
    ta: "திக் பலம் — கிரகம் தனக்குச் சாதகமான திசை பாவத்தில் இருக்கிறதா என்பது.",
  },
  kalaBala: {
    en: "Temporal strength — strength drawn from the time of birth (day/night, month, year).",
    ta: "கால பலம் — பிறந்த நேரத்தால் (பகல்/இரவு, மாதம், ஆண்டு) கிடைக்கும் பலம்.",
  },
  chestaBala: {
    en: "Motional strength — strength from the planet's speed and direction of movement.",
    ta: "சேஷ்டா பலம் — கிரகத்தின் வேகம் மற்றும் நகர்வு திசையால் கிடைக்கும் பலம்.",
  },
  naisargikaBala: {
    en: "Natural strength — a fixed strength ranking every planet is born with (e.g. the Sun and Moon rank highest).",
    ta: "நைசர்கிக பலம் — ஒவ்வொரு கிரகத்திற்கும் இயல்பாகவே இருக்கும் நிலையான பலத் தரவரிசை.",
  },
  drikBala: {
    en: "Aspectual strength — strength gained or lost from other planets' aspects (glances) onto this one.",
    ta: "திருக் பலம் — மற்ற கிரகங்களின் பார்வையால் இந்தக் கிரகத்திற்குக் கிடைக்கும்/குறையும் பலம்.",
  },
  varga: {
    en: "A divisional chart — a zoomed-in chart that examines one life area (like marriage or career) in more detail.",
    ta: "வர்க்கம் (பிரிவு கட்டம்) — திருமணம், தொழில் போன்ற ஒரு குறிப்பிட்ட வாழ்க்கைத் துறையை விரிவாகப் பார்க்கும் கட்டம்.",
  },
  navamsa: {
    en: "The D9 divisional chart — traditionally the most important varga, used for marriage and inner strength.",
    ta: "D9 நவாம்சம் — திருமணம் மற்றும் உள்ளார்ந்த பலத்தைப் பார்க்க பயன்படும், மிக முக்கியமான வர்க்க கட்டம்.",
  },
  atmakaraka: {
    en: "The planet at the highest degree in your chart — used in Jaimini astrology to show your soul's main driver.",
    ta: "உங்கள் ஜாதகத்தில் அதிக டிகிரி கொண்ட கிரகம் — ஜைமினி ஜோதிடத்தில் ஆன்மாவின் முதன்மை உந்துதலைக் காட்ட பயன்படுகிறது.",
  },
  karakamsa: {
    en: "The navamsa sign occupied by your Atmakaraka — used to read deeper life purpose in Jaimini astrology.",
    ta: "உங்கள் ஆத்மகாரகன் இருக்கும் நவாம்ச ராசி — ஜைமினி ஜோதிடத்தில் ஆழமான வாழ்க்கை நோக்கத்தைப் பார்க்க பயன்படுகிறது.",
  },
  yoginiDasha: {
    en: "A 36-year alternate timing system, used here as a secondary comparison alongside the main Vimshottari dasha.",
    ta: "36 ஆண்டு மாற்று கால நிர்ணய முறை — முதன்மை விம்சோத்தரி தசையுடன் ஒப்பீட்டுக்காக இங்கே காட்டப்படுகிறது.",
  },
  ashtottariDasha: {
    en: "A 108-year alternate timing system, used here as a secondary comparison alongside the main Vimshottari dasha.",
    ta: "108 ஆண்டு மாற்று கால நிர்ணய முறை — முதன்மை விம்சோத்தரி தசையுடன் ஒப்பீட்டுக்காக இங்கே காட்டப்படுகிறது.",
  },
  kalachakraDasha: {
    en: "A rasi-based alternate timing system with non-uniform period lengths — experimental and display-only here.",
    ta: "ராசி அடிப்படையிலான மாற்று கால நிர்ணய முறை, சம நீளமற்ற காலங்கள் கொண்டது — இங்கே சோதனை நிலையில், காட்சிக்காக மட்டும்.",
  },
  charaDasha: {
    en: "A sign-based (Jaimini) alternate timing system, often used to time life events like marriage or career change.",
    ta: "ராசி அடிப்படையிலான (ஜைமினி) மாற்று கால நிர்ணய முறை — திருமணம், தொழில் மாற்றம் போன்ற நிகழ்வுகளின் நேரத்தைக் காண பயன்படுகிறது.",
  },
};
