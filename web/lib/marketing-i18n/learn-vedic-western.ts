import { s } from "./_s";

// New Tamil, pending native review
export const LEARN_VEDIC_WESTERN = {
  eyebrow: s("Learn", "அறிந்து கொள்"),
  h1: s("Vedic vs Western astrology", "வேத ஜோதிடம் மற்றும் மேலை ஜோதிடம்"),
  lead: s(
    "The two systems can describe the same birth moment with different maps.",
    "ஒரே பிறப்பு நேரத்தை இரண்டு முறைகளும் வேறு வரைபடங்களால் விளக்கலாம்.",
  ),
  start_here: s("New to Vedic astrology? Start here →", "வேத ஜோதிடம் புதிதா? இங்கே தொடங்குங்கள் →"),
  zodiac_h2: s("Different zodiac calculation", "வேறுபட்ட ராசிக் கணிப்பு"),
  zodiac_body: s(
    "Western astrology usually uses the tropical zodiac, which is tied to the seasons. Vedic astrology uses a sidereal zodiac, which tracks the sky against the fixed stars, so the signs can differ from a Western chart.",
    "மேலை ஜோதிடம் பெரும்பாலும் பருவங்களுடன் இணைந்த ட்ராபிக்கல் ராசி முறையைப் பயன்படுத்துகிறது. வேத ஜோதிடம் நிலையான நட்சத்திரங்களை அடிப்படையாகக் கொண்ட சைடீரியல் ராசி முறையைப் பயன்படுத்துகிறது; அதனால் மேலை ஜாதகத்திலிருந்து ராசிகள் மாறலாம்.",
  ),
  lagna_h2: s("Rising sign over sun sign", "சூரிய ராசியை விட லக்னம் முக்கியம்"),
  lagna_body: s(
    "In Vedic reading, the rising sign, called lagnam, sets the houses and becomes the main frame for many interpretations. The Sun still matters, but it is not the only identity marker.",
    "வேத ஜோதிட வாசிப்பில் லக்னம் வீடுகளை அமைத்து பல விளக்கங்களுக்கு முக்கிய அடிப்படையாகிறது. சூரியனும் முக்கியம்; ஆனால் அது மட்டும் ஒரே அடையாளக் குறி அல்ல.",
  ),
  stars_h2: s("27 lunar stars as well as 12 signs", "12 ராசிகளுடன் 27 நட்சத்திரங்களும்"),
  stars_body: s(
    "Vedic astrology reads the Moon through 27 lunar stars, called nakshatras, in addition to the 12 signs. Your birth star shapes the tone of the reading and is used to start the dasha sequence.",
    "வேத ஜோதிடம் 12 ராசிகளுடன் சேர்த்து சந்திரனை 27 நட்சத்திரங்களின் வழியாகப் படிக்கிறது. உங்கள் பிறந்த நட்சத்திரம் வாசிப்பின் தன்மையையும் தசை வரிசையின் தொடக்கத்தையும் அமைக்கிறது.",
  ),
  dasha_h2: s("Life runs in planetary periods", "வாழ்க்கை கிரக காலங்களாகப் படிக்கப்படுகிறது"),
  dasha_body: s(
    "Vedic astrology uses multi-year planetary periods called dashas to read timing. A daily transit matters, but it is interpreted inside the larger period you are already living through.",
    "வேத ஜோதிடம் தசை எனப்படும் பல வருட கிரக காலங்களின் வழியாக நேரத்தைப் படிக்கிறது. தினசரி கோசாரம் முக்கியமானது; ஆனால் அது நீங்கள் ஏற்கனவே வாழும் பெரிய காலத்தின் உள்ளே விளக்கப்படுகிறது.",
  ),
  related_h2: s("Related guides", "தொடர்புடைய வழிகாட்டிகள்"),
} as const;
