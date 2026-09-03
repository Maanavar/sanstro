import { s } from "./_s";

// ─── LEARN ───────────────────────────────────────────────────────────────────

export const LEARN_THIRUK = {
  eyebrow:  s("Learn · Thirukanitham",  "அறிந்து கொள் · திருக்கணிதம்"),
  h1:       s("What is Thirukanitham?", "திருக்கணிதம் என்றால் என்ன?"),
  lead:     s(
    "Thirukanitham is the Tamil astronomical calculation system for astrology — based on the actual (drik) positions of the planets, not traditional memorised tables.",
    "திருக்கணிதம் ஜோதிடத்திற்கான தமிழ் வானியல் கணக்கீட்டு முறை — பாரம்பரிய மனப்பாட அட்டவணைகளில் அல்ல, கிரகங்களின் உண்மையான (திரிக்) நிலைகளை அடிப்படையாக கொண்டது.",
  ),

  meaning_h2:   s("The meaning of Thirukanitham",  "திருக்கணிதம் என்ன அர்த்தம்"),
  meaning_body: s(
    "The word Thirukanitham comes from 'Thiru' (sacred) and 'Kanitham' (mathematics/calculation). It refers to the precise astronomical calculation method used in Tamil Jothidam — as opposed to the older Vakya system, which relied on pre-computed planetary positions from memorised Sanskrit verses.",
    "'திரு' (புனிதமான) மற்றும் 'கணிதம்' (கணிதம்/கணக்கீடு) என்ற வார்த்தைகளிலிருந்து திருக்கணிதம் என்ற வார்த்தை வருகிறது. இது தமிழ் ஜோதிடத்தில் பயன்படுத்தப்படும் துல்லியமான வானியல் கணக்கீட்டு முறையை குறிக்கிறது — மனப்பாட சமஸ்கிருத வசனங்களிலிருந்து முன்கூட்டியே கணக்கிடப்பட்ட கிரக நிலைகளை நம்பிய பழைய வாக்கிய முறைக்கு மாறாக."
  ),

  drik_h2:   s("Drik vs Vakya",   "திரிக் vs வாக்கியம்"),
  drik_body: s(
    "Vakya astrology uses planetary positions derived from ancient Sanskrit verses — approximations that were accurate centuries ago but have drifted from actual planetary positions due to accumulated errors. Thirukanitham uses drik (direct observation) calculations — the same astronomical data used in modern ephemerides and panchang publications.",
    "வாக்கிய ஜோதிடம் பழைய சமஸ்கிருத வசனங்களிலிருந்து பெறப்பட்ட கிரக நிலைகளை பயன்படுத்துகிறது — நூற்றாண்டுகளுக்கு முன்பு துல்லியமான தோராயங்கள், ஆனால் திரட்டப்பட்ட பிழைகளால் உண்மையான கிரக நிலைகளிலிருந்து விலகிவிட்டன. திருக்கணிதம் திரிக் (நேரடி கவனிப்பு) கணக்கீடுகளை பயன்படுத்துகிறது — நவீன கோளக்கணித மற்றும் பஞ்சாங்க வெளியீடுகளில் பயன்படுத்தப்படும் அதே வானியல் தரவு."
  ),

  ayanamsa_h2:   s("The role of ayanamsa",  "அயனாம்சத்தின் பங்கு"),
  ayanamsa_body: s(
    "Ayanamsa is the correction applied to convert tropical (Western) planetary positions to sidereal (Vedic) positions, accounting for the precession of the equinoxes. Thirukanitham uses the Lahiri ayanamsa — India's government-recognised standard, also known as Chitrapaksha ayanamsa.",
    "அயனாம்சம் என்பது வெப்பமண்டல (மேற்கத்திய) கிரக நிலைகளை நட்சத்திர (வேத) நிலைகளாக மாற்ற பயன்படுத்தப்படும் திருத்தம், சம இராப்பகல் நகர்வை கணக்கிட்டு. திருக்கணிதம் லாகிரி அயனாம்சத்தை பயன்படுத்துகிறது — இந்திய அரசாங்கம் அங்கீகரித்த தரநிலை, சித்திரபக்ஷ அயனாம்சம் என்றும் அழைக்கப்படுகிறது."
  ),

  matters_h2:   s("Why it matters for your chart", "உங்கள் ஜாதகத்திற்கு ஏன் முக்கியம்"),
  matters_body: s(
    "A planet's position can differ by 1–2 degrees or more between Vakya and Thirukanitham calculations — enough to move it from one birth star to another, change its pada, and sometimes place it in a different rasi. For charts near cusps, this difference matters significantly.",
    "வாக்கியம் மற்றும் திருக்கணிதம் கணக்கீடுகளுக்கு இடையில் ஒரு கிரகத்தின் நிலை 1-2 டிகிரி அல்லது அதற்கு மேல் கூட மாறக்கூடும். அதனால் ஒரு கிரகம் வேறு நட்சத்திரத்திற்கோ, வேறு பாதத்திற்கோ, சில சமயம் வேறு ராசிக்கோ நகர்ந்துவிடலாம். எல்லைப் பகுதிக்கு அருகில் உள்ள பிறப்பு ஜாதகங்களுக்கு இந்த வித்தியாசம் மிகவும் முக்கியமானது."
  ),

  how_h2:   s("How Vinaadi uses Thirukanitham", "விநாடி திருக்கணிதத்தை எவ்வாறு பயன்படுத்துகிறது"),
  how_body: s(
    "Vinaadi computes all charts using the Drik ephemeris with Lahiri ayanamsa — giving you precise planet positions, correct birth-star placements, and an accurate dasa sequence based on your actual Moon birth star and pada at birth.",
    "விநாடி லாகிரி அயனாம்சத்துடன் திரிக் கோளக்கணிதத்தை பயன்படுத்தி அனைத்து ஜாதகங்களையும் கணக்கிடுகிறது — துல்லியமான கிரக நிலைகள், சரியான நட்சத்திர நிலைகள், பிறப்பின் போது உங்கள் உண்மையான சந்திர நட்சத்திரம் மற்றும் பாதத்தை அடிப்படையாக கொண்ட துல்லியமான தசை வரிசை தருகிறது."
  ),

  related_h2: s("Related", "தொடர்புடையவை"),
};
