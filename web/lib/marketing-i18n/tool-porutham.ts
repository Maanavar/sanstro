import { s } from "./_s";

// ─── TOOLS ──────────────────────────────────────────────────────────────────

export const TOOL_PORUTHAM = {
  eyebrow:    s("Tool · Marriage Porutham Calculator", "கருவி · திருமண பொருத்தம் கணக்கிடல்"),
  h1:         s("Quick Tamil birth-star porutham preview.", "விரைவான தமிழ் நட்சத்திரப் பொருத்த முதல் பார்வை."),
  lead:       s(
    "Choose two birth stars and get a quick porutham preview with Rajju, Vedhai, and Rasi cautions. For the full traditional 10-factor Thirukanitham match with Sevvai dosham, D9, dasa, and cancellation rules, sign in and use the dashboard.",
    "இரண்டு பிறப்பு நட்சத்திரங்களைத் தேர்வு செய்து ரஜ்ஜு, வேதை, ராசி கவனங்களுடன் விரைவான பொருத்த முதல் பார்வையைப் பெறுங்கள். செவ்வாய் தோஷம், நவாம்சம், தசை, தோஷ நிவர்த்தி விதிகள் உடன் முழு 10-கூறு திருக்கணித பொருத்தத்திற்கு உள்நுழைந்து dashboard-ஐ பயன்படுத்துங்கள்."
  ),

  checks_h2: s("What Vinaadi checks",     "விநாடி என்ன சரிபார்க்கிறது"),
  checks_body: s(
    "The public tool gives a fast birth-star reading so families can take a first look without entering full birth details. A proper Tamil marriage judgement needs the signed-in chart reading, where the score and dosha cautions are read together.",
    "முழு பிறப்பு விவரங்கள் இல்லாமலேயே குடும்பங்கள் முதலில் பார்த்துக் கொள்ள இந்த public கருவி விரைவான நட்சத்திர வாசிப்பைத் தருகிறது. சரியான தமிழ் திருமண முடிவுக்கு உள்நுழைந்த ஜாதக வாசிப்பில் மதிப்பெண், தோஷ கவனங்கள் இரண்டும் சேர்த்து பார்க்க வேண்டும்."
  ),

  ten_h2: s("The 10 poruthams", "10 பொருத்தங்கள்"),
  p1:  s("Dina porutham — birth-star compatibility for daily harmony",      "தின பொருத்தம் — தினசரி நல்லிணக்கத்திற்கு நட்சத்திர பொருத்தம்"),
  p2:  s("Gana porutham — temperament match (Deva, Manushya, Rakshasa)",   "கண பொருத்தம் — குணம் பொருத்தம் (தேவ, மனுஷ்ய, ராக்ஷஸ)"),
  p3:  s("Mahendra porutham — progeny and prosperity of the couple",      "மகேந்திர பொருத்தம் — தம்பதிகளின் குழந்தைப் பேறும் செழிப்பும்"),
  p4:  s("Sthree dheerga porutham — wife's welfare and lasting prosperity", "ஸ்திரீ தீர்க்க பொருத்தம் — மனைவியின் நலனும் நீடித்த செழிப்பும்"),
  p5:  s("Yoni porutham — physical compatibility",                         "யோனி பொருத்தம் — உடல் பொருத்தம்"),
  p6:  s("Rasi porutham — sign compatibility",                             "ராசி பொருத்தம் — ராசி பொருத்தம்"),
  p7:  s("Rasiyathipathi porutham — compatibility of rasi lords",          "ராசியாதிபதி பொருத்தம் — ராசி அதிபதிகளின் பொருத்தம்"),
  p8:  s("Vasya porutham — harmony and mutual respect",                    "வசியப் பொருத்தம் — நல்லிணக்கம் மற்றும் பரஸ்பர மரியாதை"),
  // EC-RULING-06 (2026-08-17): the parenthetical here named a spouse-death
  // outcome on a public marketing page. Excised, not softened — that class gets
  // no conversion-operator form. The porutham's weight is stated instead, which
  // is what a reader actually needs from a list item.
  p9:  s("Rajju porutham — the strongest of the dosha checks",             "ரஜ்ஜு பொருத்தம் — தோஷ சரிபார்ப்புகளுள் வலிமையானது"),
  // The tenth Tamil porutham is Vedhai. This slot used to hold Nadi, a North
  // Indian check that is not one of the Tamil ten (owner ruling 2026-11-11).
  p10: s("Vedhai porutham — star pairs that obstruct each other",          "வேதைப் பொருத்தம் — ஒன்றையொன்று தடுக்கும் நட்சத்திர இணைகள்"),

  rajju_h2:   s("Rajju and Vedhai — the critical checks", "ரஜ்ஜு, வேதை — முக்கியமான சரிபார்ப்புகள்"),
  rajju_body: s(
    "In Tamil tradition, a missing Rajju or Vedhai is not a small footnote: the match is marked as needing care whatever the total. Nadi, a North Indian check, is not one of the Tamil ten and is shown only as a side note. This public page flags the caution; the signed-in report checks the full chart before giving a final recommendation.",
    "தமிழ் பாரம்பரியத்தில் ரஜ்ஜு அல்லது வேதை அமையாதது சிறிய குறிப்பு அல்ல; மொத்த எண்ணிக்கை எவ்வளவு இருந்தாலும் 'கவனம் தேவை' எனக் காட்டப்படும். நாடி வட இந்திய முறையைச் சேர்ந்தது; தமிழ்ப் பத்துப் பொருத்தங்களில் சேராது, கூடுதல் குறிப்பாக மட்டும் காட்டப்படும். இந்த public பக்கம் கவனத்தை மட்டும் காட்டும்; இறுதி பரிந்துரைக்கு முன் உள்நுழைந்த அறிக்கை முழு ஜாதகத்தைப் பார்க்கும்."
  ),

  related_h2: s("Related", "தொடர்புடையவை"),
};

/**
 * Numerology's public page.
 *
 * Every string here describes the *method* — which alphabet is scored, where
 * the series stops, what a birth time would add. None of it interprets a
 * number, because that corpus is withheld pending Tamil native review and
 * writing it into marketing copy would route around the gate the backend
 * enforces. The FAQ answers mirror the JSON-LD in the page's metadata, which
 * had been feeding search engines an explanation the page never showed a human.
 */
