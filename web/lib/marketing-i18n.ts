import { normalizeTamilAstroText } from "./tamil-astro";
import { LANG_STORAGE_KEY, type Lang } from "./i18n";

export type { Lang };
export { LANG_STORAGE_KEY };

type BiStr = { en: string; ta: string };

function s(en: string, ta: string): BiStr {
  return { en, ta };
}

export function mt(str: BiStr, lang: Lang): string {
  return lang === "ta" ? normalizeTamilAstroText(str.ta) : str.en;
}

// ─── NAV ────────────────────────────────────────────────────────────────────

export const NAV = {
  features:       s("Features",          "அம்சங்கள்"),
  tools:          s("Tools",             "கருவிகள்"),
  learn:          s("Learn",             "அறிந்து கொள்"),
  method:         s("Method",            "கணக்குமுறை"),
  sign_in:        s("Sign in",           "உள்நுழை"),
  open_menu:      s("Open navigation menu",  "மெனு திற"),
  close_menu:     s("Close navigation menu", "மெனு மூடு"),
  home:           s("Vinaadi home",      "விநாடி முகப்பு"),

  feat_daily:     s("Daily Guidance",        "தினசரி வழிகாட்டுதல்"),
  feat_family:    s("Family Planning",       "குடும்ப திட்டமிடல்"),
  feat_chart:     s("Chart Guidance",        "ஜாதகப் புரிதல்"),
  feat_timing:    s("Timing & Decisions",    "நல்ல நேரம் & முடிவுகள்"),

  tool_porutham:  s("Porutham Calculator",   "பொருத்தம் பார்"),
  tool_porutham_desc: s("Marriage compatibility", "திருமணப் பொருத்தம்"),
  tool_jad:       s("Jadhagam Generator",    "ஜாதகம் உருவாக்கு"),
  tool_jad_desc:  s("Tamil birth chart",     "தமிழ் ஜாதகம்"),
  tool_panch:     s("Panchangam Planner",    "தின பஞ்சாங்கம்"),
  tool_panch_desc: s("Daily Tamil almanac",  "இன்றைய தமிழ் பஞ்சாங்கம்"),
  tool_btr:       s("Birth Time Rectification", "பிறப்பு நேர திருத்தம்"),
  tool_btr_desc:  s("Refine uncertain birth time", "தெளிவற்ற பிறந்த நேரத்தை சரிசெய்"),
  tool_rasipalan:      s("Indraiya Rasipalan",      "இன்றைய ராசிபலன்"),
  tool_rasipalan_desc: s("Today's horoscope by rasi", "இன்றைய ராசி பலன்"),

  lang_toggle_en: s("EN", "EN"),
  lang_toggle_ta: s("தமிழ்", "தமிழ்"),
};

// ─── FOOTER ─────────────────────────────────────────────────────────────────

export const FOOTER = {
  tagline:      s(
    "Thirukanitham-based Tamil astrology for daily life and family planning.",
    "தினசரி வாழ்க்கைக்கும் குடும்ப முடிவுகளுக்கும் திருக்கணிதம் அடிப்படையிலான தமிழ் ஜோதிட வழிகாட்டல்."
  ),
  col_features: s("Features",  "அம்சங்கள்"),
  col_tools:    s("Tools",     "கருவிகள்"),
  col_learn:    s("Learn",     "அறிந்து கொள்"),
  col_company:  s("Company",   "நிறுவனம்"),

  feat_daily:   s("Daily Guidance",       "தினசரி வழிகாட்டுதல்"),
  feat_family:  s("Family Planning",      "குடும்ப திட்டமிடல்"),
  feat_chart:   s("Chart Guidance",       "ஜாதகப் புரிதல்"),
  feat_timing:  s("Timing & Decisions",   "நல்ல நேரம் & முடிவுகள்"),

  tool_porutham: s("Porutham Calculator",     "பொருத்தம் பார்"),
  tool_jad:      s("Jadhagam Generator",      "ஜாதகம் உருவாக்கு"),
  tool_panch:    s("Panchangam Planner",      "தின பஞ்சாங்கம்"),
  tool_btr:      s("Birth Time Rectification","பிறப்பு நேர திருத்தம்"),
  tool_rasipalan: s("Indraiya Rasipalan",     "இன்றைய ராசிபலன்"),

  learn_porutham:  s("What is Porutham?",         "பொருத்தம் என்றால் என்ன?"),
  learn_thiruk:    s("What is Thirukanitham?",     "திருக்கணிதம் என்றால் என்ன?"),
  learn_chandra:   s("What is Chandrashtama?",     "சந்திராஷ்டமம் என்றால் என்ன?"),
  learn_jad:       s("How to read a Jadhagam",     "ஜாதகம் படிப்பது எப்படி"),
  learn_birth:     s("Why birth time matters",     "பிறந்த நேரம் ஏன் முக்கியம்"),

  about:        s("About Vinaadi",      "விநாடி பற்றி"),
  methodology:  s("Methodology",        "கணக்கீட்டு முறை"),
  privacy:      s("Privacy policy",     "தனியுரிமைக் கொள்கை"),
  terms:        s("Terms of service",   "பயன்பாட்டு விதிகள்"),

  disclaimer: s(
    "Vinaadi provides Jyotish-based guidance. Astrology is a traditional belief system, not a science. For medical, legal, or financial decisions, consult a qualified professional.",
    "விநாடி ஜோதிட அடிப்படையிலான வழிகாட்டுதலை வழங்குகிறது. ஜோதிடம் ஒரு பாரம்பரிய நம்பிக்கை முறை — அறிவியல் அல்ல. மருத்துவ, சட்ட அல்லது நிதி முடிவுகளுக்கு தகுதிவாய்ந்த நிபுணரை அணுகவும்."
  ),
  copyright: s("© {year} Vinaadi", "© {year} விநாடி"),
};

// ─── HOME PAGE ──────────────────────────────────────────────────────────────

export const HOME = {
  // Hero
  hero_eyebrow:   s("Tamil Astrology Assistant", "தமிழ் ஜோதிட வழிகாட்டி"),
  hero_h1:        s(
    "One calm guide for your chart, your day, and the people you plan with.",
    "உங்கள் ஜாதகம், இன்றைய நாள், குடும்ப முடிவுகள் அனைத்துக்கும் ஒரே அமைதியான வழிகாட்டல்."
  ),
  hero_body:      s(
    "Vinaadi turns Thirukanitham-based astrology into daily guidance, timing windows, family planning, and tools you can actually use — every morning, in plain language.",
    "திருக்கணிதம் அடிப்படையிலான ஜோதிடத்தை விநாடி எளிதாகப் புரியும் தினசரி வாசிப்பு, நல்ல நேரக் குறிப்பு, குடும்பத் திட்டமிடல், பயன்படும் கருவிகள் ஆகியதாக மாற்றுகிறது."
  ),
  hero_cta_start: s("Start with today's guidance →", "இன்றைய வழிகாட்டுதலை தொடங்கு →"),
  hero_cta_how:   s("See how it works",               "எப்படி வேலை செய்கிறது"),

  card_today:     s("Today's Reading",   "இன்றைய வாசிப்பு"),
  card_your_day:  s("Your day",          "உங்கள் நாள்"),
  card_best:      s("Best Window",       "சிறந்த நேரம்"),
  card_hold:      s("Hold",              "எச்சரிக்கை நேரம்"),
  card_d1_ready:  s("D1 · D9 ready",    "D1 · D9 தயார்"),

  // Section 2 — What Vinaadi does
  helps_eyebrow:  s("What Vinaadi does", "விநாடி என்ன செய்கிறது"),
  helps_h2:       s(
    "Guidance for the moments people actually need help with",
    "உண்மையில் உதவி தேவைப்படும் தருணங்களுக்கான வழிகாட்டுதல்"
  ),
  help1_title:    s("Understand today",              "இன்றைய நாளைப் புரிந்து கொள்ளுங்கள்"),
  help1_body:     s(
    "One daily score combining your chart, dasha period, transits, and panchangam. Clear reasoning, no guesswork.",
    "ஜாதகம், தசை, கிரகநகர்வு, பஞ்சாங்கம் ஆகியவை சேர்ந்த ஒரு தினசரி மதிப்பெண். ஏன் அந்த முடிவு வருகிறது என்பதும் தெளிவாகத் தெரியும்."
  ),
  help2_title:    s("Plan important actions",         "முக்கியமான செயல்களை திட்டமிடுங்கள்"),
  help2_body:     s(
    "Best and caution windows calculated from your natal chart and the day's signals — practical, not vague.",
    "பிறப்பு ஜாதகமும் அந்த நாளின் அறிகுறிகளும் சேர்ந்து சொல்லும் நல்ல நேரம், கவன நேரம். மங்கலான கணிப்பு இல்லை; பயன்படுத்தக் கூடிய வழிகாட்டல்."
  ),
  help3_title:    s("Read family timing together",    "குடும்பமாக நேரத்தைப் பாருங்கள்"),
  help3_body:     s(
    "See your reading alongside the people you plan with. Shared best-window view for family decisions.",
    "உங்களுடன் முடிவு எடுக்கும் குடும்பத்தினரின் வாசிப்பையும் சேர்த்து பார்க்கலாம். எல்லோருக்கும் ஏற்ற நேரத்தை ஒரே பார்வையில் கண்டுபிடிக்கலாம்."
  ),
  help4_title:    s("Understand chart patterns",      "ஜாதக அமைப்பைப் புரிந்து கொள்ளுங்கள்"),
  help4_body:     s(
    "Your lagna, dasha lord, transiting planets, yogas, and doshas — explained in plain language, not jargon.",
    "லக்னம், தசைநாதன், கிரகநகர்வு, யோகம், தோஷம் ஆகியவை எளிய சொல்லில் விளக்கப்படும். அரிய தொழில்சொற்களில் சிக்கிக்கொள்ள வேண்டாம்."
  ),
  help5_title:    s("Check compatibility when needed", "தேவைப்படும்போது பொருத்தம் பாருங்கள்"),
  help5_body:     s(
    "Use the public birth-star preview for a quick first look. Sign in for full chart-grade porutham with 36-point score, Nadi, Sevvai, D9, and dasha context.",
    "விரைவான முதல் பார்வைக்கு பொதுப் பிறப்பு நட்சத்திரப் பொருத்தத்தைப் பயன்படுத்துங்கள். 36 மதிப்பெண், நாடி, செவ்வாய், நவாம்சம், தசை சூழல் உடன் முழு ஜாதகப் பொருத்தத்திற்கு உள்நுழையுங்கள்."
  ),
  help6_title:    s("Use tools when you need them",   "தேவைப்படும் போது கருவிகளைப் பயன்படுத்துங்கள்"),
  help6_body:     s(
    "Jadhagam generation, panchangam planner, birth time rectification — part of the assistant, not separate apps.",
    "ஜாதகம் உருவாக்கம், பஞ்சாங்கப் பார்வை, பிறந்த நேரத் திருத்தம் போன்றவை தனி ஆப்கள் அல்ல; அதே வழிகாட்டியின் பகுதிகள்."
  ),

  // Section 3 — Daily Guidance
  daily_eyebrow:  s("Daily Guidance",       "தினசரி வழிகாட்டுதல்"),
  daily_h2:       s(
    "Every day starts with one quiet reading",
    "ஒவ்வொரு நாளும் ஒரு அமைதியான வாசிப்பில் தொடங்கட்டும்"
  ),
  daily_body:     s(
    "Vinaadi reads your chart, dasha, transits, and panchangam together — and gives you one balanced answer for the day. Not four separate reports. One reading.",
    "விநாடி உங்கள் ஜாதகம், தசை, கிரகநகர்வு, பஞ்சாங்கம் ஆகியவற்றை ஒன்றாகப் படிக்கிறது — நாளுக்கு ஒரு சமச்சீர் பதிலைத் தருகிறது. நான்கு தனித்தனி அறிக்கைகள் அல்ல; ஒரே ஒரு வாசிப்பு."
  ),
  daily_sig1: s("Dasha and bhukti period quality — how your current planetary cycle frames the day", "தசை மற்றும் புக்தி தரம் — இன்றைய நடப்பு கிரக சுழற்சி நாளை எவ்வாறு வடிவமைக்கிறது"),
  daily_sig2: s("Planet transits — how Saturn, Jupiter, Rahu, Ketu, and the rest are influencing your birth chart", "கிரகநகர்வு — சனி, குரு, ராகு, கேது போன்றவை உங்கள் பிறப்பு ஜாதகத்தில் இப்போது என்ன தாக்கம் தருகின்றன"),
  daily_sig3: s("Panchangam quality — Tithi, Vara, Nakshathiram, Yoga, Karana for the day", "பஞ்சாங்க தரம் — நாளுக்கான திதி, வாரம், நட்சத்திரம், யோகம், கரணம்"),
  daily_sig4: s("Best window and caution window — specific times, not vague ranges", "சிறந்த நேரம் மற்றும் எச்சரிக்கை நேரம் — குறிப்பிட்ட நேரங்கள், தெளிவற்ற வரம்புகள் அல்ல"),
  daily_sig5: s("Chandrashtama tracking when relevant — named clearly, not dramatised", "தொடர்புடையபோது சந்திராஷ்டமம் கண்காணிப்பு — தெளிவாக பெயரிடப்பட்டது, நாடகமயமாக்கப்படவில்லை"),
  daily_link: s("How daily guidance works →", "தினசரி வழிகாட்டுதல் எப்படி வேலை செய்கிறது →"),

  card_reading:   s("Daily Reading · Sample",  "தினசரி வாசிப்பு · மாதிரி"),
  card_caution:   s("Caution",                 "எச்சரிக்கை"),

  // Section 4 — Family Planning
  family_eyebrow: s("Family Planning",  "குடும்ப திட்டமிடல்"),
  family_h2:      s(
    "Plan for yourself, or for the people you share life with.",
    "உங்களுக்காகவும், உங்களுடன் வாழ்பவர்களுக்காகவும் ஒரே இடத்தில் திட்டமிடுங்கள்."
  ),
  family_body:    s(
    "Most astrology products stop at individual readings. Vinaadi is built for the way Tamil families actually use astrology — together. Add family members, see everyone's reading side by side, and find the windows that work for the whole household.",
    "பெரும்பாலான ஜோதிட தயாரிப்புகள் தனிப்பட்ட வாசிப்பில் நிறுத்திக்கொள்கின்றன. விநாடி தமிழ் குடும்பங்கள் உண்மையில் ஜோதிடத்தை பயன்படுத்தும் விதத்திற்காக கட்டப்பட்டுள்ளது — சேர்ந்து. குடும்பத்தினரை சேர்க்கவும், எல்லோரின் வாசிப்பையும் ஒப்பிட்டுப் பாருங்கள், முழு வீட்டிற்கும் பொருந்தும் நேரங்களை கண்டறியுங்கள்."
  ),
  family_item1: s("Family vault with individual birth profiles for each member", "ஒவ்வொருவருக்கும் தனித் பிறப்பு விவரங்களுடன் குடும்ப சேகரிப்பு"),
  family_item2: s("Shared best-window view — plan important events for everyone", "பகிரப்பட்ட சிறந்த நேர காட்சி — எல்லோருக்கும் முக்கியமான நிகழ்வுகளை திட்டமிடுங்கள்"),
  family_item3: s("Porutham compatibility when making family decisions", "குடும்ப முடிவுகள் எடுக்கும்போது பொருத்தம் சரிபார்ப்பு"),
  family_item4: s("Dasha comparisons across family members", "குடும்பத்தினர் முழுவதும் தசை ஒப்பீடுகள்"),
  family_link:  s("Family planning feature →", "குடும்ப திட்டமிடல் அம்சம் →"),

  family_panel_label: s("Your family today",          "இன்று உங்கள் குடும்பம்"),
  family_panel_foot:  s("Best combined window:",       "சிறந்த கூட்டு நேரம்:"),

  // Section 5 — Tools
  tools_eyebrow:  s("Tools",  "கருவிகள்"),
  tools_h2:       s(
    "When you need a tool, it's already part of the guide",
    "கருவி தேவைப்படும்போது, அது ஏற்கனவே வழிகாட்டியின் ஒரு பகுதி"
  ),
  tools_sub: s(
    "Vinaadi includes quick public tools and deeper signed-in readings. Use the public pages for first lookups; use the dashboard when you want chart-based reasoning from your saved jadhagam.",
    "விரைவான பொதுக் கருவிகளும், உள்நுழைந்த பிறகு ஆழமான ஜாதக வாசிப்புகளும் விநாடியில் உள்ளன. முதல் பார்வைக்கு public பக்கங்களைப் பயன்படுத்துங்கள்; சேமித்த ஜாதகத்தின் அடிப்படையிலான காரண விளக்கத்திற்கு dashboard-ஐ பயன்படுத்துங்கள்."
  ),
  tool1_name: s("Marriage Porutham",          "திருமண பொருத்தம்"),
  tool1_desc: s("Quick public birth-star porutham preview. Sign in for the full Tamil marriage match with 36-point score, Nadi, Sevvai, D9, and dasha context.", "விரைவான நட்சத்திரப் பொருத்த முதல் பார்வை. 36 மதிப்பெண், நாடி, செவ்வாய், நவாம்சம், தசை சூழல் உடன் முழு தமிழ் திருமணப் பொருத்தத்திற்கு உள்நுழையுங்கள்."),
  tool1_cta:  s("Porutham calculator →",      "பொருத்தம் பார் →"),
  tool2_name: s("Jadhagam Generator",         "ஜாதகம் உருவாக்கு"),
  tool2_desc: s("South Indian birth chart in Thirukanitham format — D1 Rasi chart and D9 Navamsa, with Lahiri ayanamsa precision.", "திருக்கணிதம் முறையில் தென்னிந்திய ஜாதகம் — D1 ராசி கட்டம் மற்றும் D9 நவாம்சம், லாகிரி அயனாம்சத்துடன்."),
  tool2_cta:  s("Generate jadhagam →",        "ஜாதகம் உருவாக்கு →"),
  tool3_name: s("Daily Panchangam Planner",   "தின பஞ்சாங்கம்"),
  tool3_desc: s("Tithi, Vara, Nakshathiram, Yoga, Karana — plus Rahu Kalam, Yamagandam, and auspicious timings for any day.", "திதி, வாரம், நட்சத்திரம், யோகம், கரணம் — ராகு காலம், யமகண்டம், எந்த நாளுக்கும் சுப நேரங்கள்."),
  tool3_cta:  s("Panchangam planner →",       "பஞ்சாங்கம் பார் →"),
  tool4_name: s("Birth Time Rectification",   "பிறப்பு நேர திருத்தம்"),
  tool4_desc: s("Refine an uncertain birth time using life events and the Thirukanitham calculation method for more accurate readings.", "வாழ்க்கை நிகழ்வுகள் மற்றும் திருக்கணிதம் முறையைப் பயன்படுத்தி தெளிவற்ற பிறந்த நேரத்தை திருத்தவும்."),
  tool4_cta:  s("Rectification tool →",       "திருத்தம் கருவி →"),

  // Section 6 — How it works
  how_eyebrow: s("How it works",    "இது எப்படி வேலை செய்கிறது"),
  how_h2:      s("Traditional inputs. Clear output. Modern guidance.", "பாரம்பரிய உள்ளீடுகள். தெளிவான வெளியீடு. நவீன வழிகாட்டுதல்."),
  step1_num:   s("01", "01"),
  step1_title: s("Add your birth details", "உங்கள் பிறப்பு விவரங்களை சேர்க்கவும்"),
  step1_body:  s(
    "Date, time, and place of birth. Vinaadi uses this to compute your precise Thirukanitham jadhagam — lagna, birth stars, rasi, and dasha periods.",
    "பிறந்த தேதி, நேரம், இடம். விநாடி இதை பயன்படுத்தி உங்கள் திருக்கணிதம் ஜாதகத்தை கணக்கிடுகிறது — லக்னம், நட்சத்திரங்கள், ராசி, தசை."
  ),
  step2_num:   s("02", "02"),
  step2_title: s("Vinaadi reads chart, dasha, transits, and panchangam together", "விநாடி ஜாதகம், தசை, கிரகநகர்வு, பஞ்சாங்கம் ஆகியவற்றை ஒன்றாகப் படிக்கிறது"),
  step2_body:  s(
    "Every day, the assistant combines your birth-chart reading with the current dasha period, transit positions, and the day's panchangam into one view.",
    "ஒவ்வொரு நாளும், உதவியாளர் உங்கள் பிறப்பு ஜாதகப் பார்வையை நடப்பு தசை, கிரகநகர்வு, அந்த நாளின் பஞ்சாங்கம் ஆகியவற்றுடன் சேர்த்து ஒரு வாசிப்பாகத் தருகிறது."
  ),
  step3_num:   s("03", "03"),
  step3_title: s("Get one balanced answer", "ஒரு சமச்சீர் பதிலை பெறுங்கள்"),
  step3_body:  s(
    "A daily score, a best window, a caution window, and a brief interpretation. For decisions, tools, or family context — it's all in the same place.",
    "தினசரி மதிப்பெண், சிறந்த நேரம், எச்சரிக்கை நேரம், சுருக்கமான விளக்கம். முடிவுகளுக்கு, கருவிகளுக்கு, குடும்ப சூழலுக்கு — எல்லாம் ஒரே இடத்தில்."
  ),

  // Section 7 — Method & Trust
  method_eyebrow: s("Method & Trust",   "முறை & நம்பகத்தன்மை"),
  method_h2:      s("Built on method, not vague astrology language", "மங்கலான ஜோதிட மொழி அல்ல, தெளிவான கணக்குமுறை தான் அடித்தளம்"),
  method_body:    s(
    "Vinaadi is designed to be transparent about how it works. Every reading shows the reasoning behind it. Every signal is sourced from a specific astrological input.",
    "விநாடி தனது செயல்பாட்டில் வெளிப்படையாக இருக்க வடிவமைக்கப்பட்டுள்ளது. ஒவ்வொரு வாசிப்பும் அதன் பின்னால் உள்ள காரணத்தை காட்டுகிறது. ஒவ்வொரு சமிக்ஞையும் ஒரு குறிப்பிட்ட ஜோதிட உள்ளீட்டிலிருந்து எடுக்கப்பட்டது."
  ),
  meth1_title: s("Thirukanitham",        "திருக்கணிதம்"),
  meth1_body:  s("The Tamil astronomical calculation standard — precise planet positions, traditional South Indian methodology.", "தமிழ் வானியல் கணக்கீட்டு தரநிலை — துல்லியமான கிரக நிலைகள், பாரம்பரிய தென்னிந்திய முறை."),
  meth2_title: s("Lahiri ayanamsa",      "லாகிரி அயனாம்சம்"),
  meth2_body:  s("India's government-recognized sidereal ayanamsa standard. The same used by traditional Tamil Jyotish practitioners.", "இந்திய அரசாங்கம் அங்கீகரித்த நட்சத்திர அயனாம்சம். பாரம்பரிய தமிழ் ஜோதிடர்களும் பயன்படுத்துவதே இது."),
  meth3_title: s("Drik ephemeris precision", "திரிக் கோளக்கணித துல்லியம்"),
  meth3_body:  s("High-accuracy astronomical data — the same source used in modern Tamil panchang publications.", "உயர் துல்லியமான வானியல் தரவு — நவீன தமிழ் பஞ்சாங்க வெளியீடுகளில் பயன்படுத்தப்படும் அதே மூலம்."),
  meth4_title: s("Multi-signal daily score",  "பல சமிக்ஞை தினசரி மதிப்பெண்"),
  meth4_body:  s("Dasha + transit + panchangam + Moon star combined into one reading. Not a single-factor verdict.", "தசை + கிரகநகர்வு + பஞ்சாங்கம் + சந்திர நட்சத்திரம் ஒன்றாக சேர்ந்த வாசிப்பு. ஒரு காரணியை மட்டும் வைத்த முடிவு அல்ல."),
  meth5_title: s("Calm interpretation",       "அமைதியான விளக்கம்"),
  meth5_body:  s("No fear language. No doom predictions. Vinaadi frames astrology as a planning tool, not a fatalistic oracle.", "பயமுறுத்தும் வார்த்தைகள் இல்லை. அழிவு கணிப்புகள் இல்லை. விநாடி ஜோதிடத்தை திட்டமிடல் கருவியாக கட்டமைக்கிறது, விதி நிர்ணயிக்கும் ஆரக்கிள் அல்ல."),
  method_panel_title: s(
    "Vinaadi is designed to help users interpret astrology thoughtfully, not fearfully.",
    "விநாடி பயனர்களுக்கு பயமின்றி, சிந்தனையுடன் ஜோதிடத்தை புரிந்துகொள்ள உதவ வடிவமைக்கப்பட்டுள்ளது."
  ),
  method_panel_body: s(
    "Jyotish is a traditional belief system with deep roots in Tamil culture. We approach it with respect for that tradition while communicating clearly and calmly. Every verdict includes the reasoning. Your data is never sold or shared.",
    "ஜோதிடம் தமிழ் கலாச்சாரத்தில் ஆழமான வேர்களைக் கொண்ட ஒரு பாரம்பரிய நம்பிக்கை முறை. நாங்கள் அந்த பாரம்பரியத்தை மதிக்கிறோம், தெளிவாகவும் அமைதியாகவும் தகவல் தருகிறோம். ஒவ்வொரு தீர்ப்பும் காரணத்தை உள்ளடக்கும். உங்கள் தரவு விற்கப்படுவதோ பகிரப்படுவதோ இல்லை."
  ),
  method_link: s("Full methodology →", "முழு கணக்கீட்டு முறை →"),

  // Section 8 — Feature Hub
  hub_eyebrow: s("Features", "அம்சங்கள்"),
  hub_h2:      s("Explore the ways Vinaadi can guide you", "விநாடி எந்தெந்த வழியில் உதவுகிறது என்பதைப் பாருங்கள்"),
  hub1_eye:    s("Feature",  "அம்சம்"),
  hub1_title:  s("Daily Guidance", "தினசரி வழிகாட்டுதல்"),
  hub1_body:   s("One daily reading combining chart, dasha, transits, and panchangam. Your best window, caution window, and day tone.", "ஜாதகம், தசை, கிரகநகர்வு, பஞ்சாங்கம் சேர்ந்த தினசரி வாசிப்பு. நல்ல நேரம், கவன நேரம், நாளின் நிலை அனைத்தும் ஒரே இடத்தில்."),
  hub2_eye:    s("Feature",  "அம்சம்"),
  hub2_title:  s("Family Planning", "குடும்ப திட்டமிடல்"),
  hub2_body:   s("Add family members, compare readings, and find the timing windows that work for the whole household.", "குடும்பத்தினரை சேர்க்கவும், வாசிப்புகளை ஒப்பிடவும், முழு வீட்டிற்கும் பொருந்தும் நேர சாளரங்களை கண்டறியுங்கள்."),
  hub3_eye:    s("Feature",  "அம்சம்"),
  hub3_title:  s("Chart Guidance", "ஜாதகப் புரிதல்"),
  hub3_body:   s("Understand your jadhagam — lagna, planets, yogas, doshas, and what they mean in the context of your current dasha.", "உங்கள் ஜாதகம் — லக்னம், கிரகங்கள், யோகங்கள், தோஷங்கள், நடப்பு தசை சூழலில் அவற்றின் அர்த்தம்."),
  hub4_eye:    s("Feature",  "அம்சம்"),
  hub4_title:  s("Timing and Decisions", "நல்ல நேரம் & முடிவுகள்"),
  hub4_body:   s("Plan important actions — ceremonies, travel, business, health — with astrological timing grounded in Thirukanitham.", "முக்கியமான செயல்களை திட்டமிடுங்கள் — விழாக்கள், பயணம், வியாபாரம், உடல்நலம் — திருக்கணிதம் அடிப்படையிலான ஜோதிட நேரத்தில்."),
  hub5_eye:    s("Tool",     "கருவி"),
  hub5_title:  s("Porutham Calculator", "பொருத்தம் பார்"),
  hub5_body:   s("Quick birth-star porutham for visitors; full signed-in matching adds 36-point scoring, Nadi judgement, Sevvai, D9, and dasha context.", "வருகையாளர்களுக்கு விரைவான நட்சத்திரப் பொருத்தம்; உள்நுழைந்த பிறகு 36 மதிப்பெண், நாடி தீர்வு, செவ்வாய், நவாம்சம், தசை சூழல் உடன் முழு பொருத்தம்."),
  hub6_eye:    s("Method",   "முறை"),
  hub6_title:  s("Our Methodology", "எங்கள் கணக்கீட்டு முறை"),
  hub6_body:   s("How Vinaadi calculates — Thirukanitham, Lahiri ayanamsa, Drik ephemeris, multi-signal daily score.", "விநாடி எவ்வாறு கணக்கிடுகிறது — திருக்கணிதம், லாகிரி அயனாம்சம், திரிக் கோளக்கணிதம், பல சமிக்ஞை தினசரி மதிப்பெண்."),

  // Section 9 — Learn strip
  learn_eyebrow: s("Learn",  "அறிந்து கொள்"),
  learn_h2:      s("Learn the ideas behind the guidance", "இந்த வழிகாட்டலின் பின்னால் உள்ள கருத்துகளை அறிந்து கொள்ளுங்கள்"),
  learn1:        s("What is Porutham?",           "பொருத்தம் என்றால் என்ன?"),
  learn2:        s("What is Thirukanitham?",       "திருக்கணிதம் என்றால் என்ன?"),
  learn3:        s("What is Chandrashtama?",       "சந்திராஷ்டமம் என்றால் என்ன?"),
  learn4:        s("How to read a Jadhagam",       "ஜாதகம் படிப்பது எப்படி"),
  learn5:        s("Why birth time matters",       "பிறந்த நேரம் ஏன் முக்கியம்"),

  // Section 10 — Commitment
  commit_eyebrow: s("Our commitment",   "எங்கள் உறுதிமொழி"),
  commit_h2:      s("Calm language, no fear.", "அமைதியான மொழி, பயம் இல்லை."),
  commit1: s("No doom language or guaranteed bad predictions",   "அழிவு மொழி அல்லது உறுதியான மோசமான கணிப்புகள் இல்லை"),
  commit2: s("Every verdict shows the reasoning behind it",     "ஒவ்வொரு தீர்ப்பும் அதன் பின்னால் உள்ள காரணத்தை காட்டுகிறது"),
  commit3: s("Your data stays on our servers — never sold",     "உங்கள் தரவு எங்கள் சேவையகங்களில் இருக்கும் — ஒருபோதும் விற்கப்படாது"),
  commit4: s("Jyotish is tradition, not science — we say so clearly", "ஜோதிடம் பாரம்பரியம், அறிவியல் அல்ல — நாங்கள் தெளிவாக சொல்கிறோம்"),

  // Section 11 — CTA
  cta_eyebrow: s("Early access",   "ஆரம்ப அணுகல்"),
  cta_h2:      s("Start with one reading. Stay for the clarity.", "ஒரு வாசிப்பில் தொடங்குங்கள். தெளிவாக முன்னேறுங்கள்."),
  cta_body:    s(
    "Full access — chart, daily guidance, family vault, all tools — at no cost during early access.",
    "முழு அணுகல் — ஜாதகம், தினசரி வழிகாட்டுதல், குடும்ப சேகரிப்பு, அனைத்து கருவிகளும் — ஆரம்ப அணுகல் காலத்தில் இலவசம்."
  ),
  cta_btn: s("Get started free →", "இலவசமாக தொடங்குங்கள் →"),
};

// ─── FEATURES ────────────────────────────────────────────────────────────────

export const FEAT_DAILY = {
  eyebrow:      s("Feature · Daily Guidance",  "அம்சம் · தினசரி வழிகாட்டுதல்"),
  h1:           s("One quiet reading. Every morning.", "ஒரு அமைதியான வாசிப்பு. ஒவ்வொரு காலையும்."),
  lead:         s(
    "Vinaadi reads your Thirukanitham chart, your current dasha period, today's transit positions, and the panchangam — then gives you one balanced answer. Not four separate reports. One reading.",
    "விநாடி உங்கள் திருக்கணித ஜாதகம், நடப்பு தசை, இன்றைய கிரகநகர்வு, பஞ்சாங்கம் ஆகியவற்றை ஒன்றாகப் படித்து ஒரு சமச்சீர் பதிலைத் தருகிறது. நான்கு தனித்தனி அறிக்கைகள் அல்ல; ஒரே ஒரு வாசிப்பு.",
  ),
  cta_start:    s("Start reading →",           "வாசிக்க தொடங்கு →"),
  cta_method:   s("How it's calculated",        "எப்படி கணக்கிடப்படுகிறது"),

  signals_h2:   s("The four signals",           "நான்கு சமிக்ஞைகள்"),
  sig1_title:   s("Vimshottari Dasha",          "விம்சோத்தரி தசை"),
  sig1_body:    s("Your planetary period cycle — which planet runs the current dasha and bhukti, and whether that period is favourable, neutral, or challenging for your chart.", "உங்கள் கிரக சுழற்சி — எந்த கிரகம் நடப்பு தசை மற்றும் புக்தியை நடத்துகிறது, அந்த காலம் உங்கள் ஜாதகத்திற்கு சாதகமானதா, நடுநிலையானதா அல்லது சவாலானதா."),
  sig2_title:   s("Planet transits",             "கிரகநகர்வு"),
  sig2_body:    s("Where the planets are today — and how Saturn, Jupiter, Rahu, Ketu, and Moon are interacting with your birth chart right now.", "இன்று கிரகங்கள் எங்கு உள்ளன, சனி, குரு, ராகு, கேது, சந்திரன் ஆகியவை உங்கள் பிறப்பு ஜாதகத்தை இப்போது எப்படி தொடுகின்றன என்பதைக் காட்டும்."),
  sig3_title:   s("Tamil Panchangam",            "தமிழ் பஞ்சாங்கம்"),
  sig3_body:    s("Tithi, Vara, Nakshathiram, Yoga, and Karana for the day — the five elements of the Tamil almanac that colour the quality of the day itself.", "திதி, வாரம், நட்சத்திரம், யோகம், கரணம் — நாளின் தன்மையை வண்ணமிடும் தமிழ் பஞ்சாங்கத்தின் ஐந்து கூறுகள்."),
  sig4_title:   s("Moon birth star",            "சந்திர நட்சத்திரம்"),
  sig4_body:    s("Where the transiting Moon is today relative to your birth star — including Chandrashtama detection when the Moon reaches your 8th sign.", "இன்று நகரும் சந்திரன் உங்கள் பிறப்பு நட்சத்திரத்துடன் எந்த தொடர்பில் உள்ளது என்பதை இது காட்டும்; சந்திரன் 8ஆம் ராசியை அடையும்போது சந்திராஷ்டமமும் தெளிவாகக் குறிக்கப்படும்."),

  windows_h2:   s("Best windows and caution windows", "சிறந்த நேரங்கள் மற்றும் எச்சரிக்கை நேரங்கள்"),
  windows_body: s(
    "Each daily reading identifies specific time windows — not just a broad day quality, but narrow time ranges where the signals align most favourably or least favourably. These are calculated from your natal chart against the day's planetary positions, not generic tables.",
    "ஒவ்வொரு தினசரி வாசிப்பும் குறிப்பிட்ட நேர சாளரங்களை கண்டறிகிறது — பரந்த நாள் தரம் மட்டுமல்ல, சமிக்ஞைகள் மிகவும் சாதகமாக அல்லது மிகவும் சாதகமற்று அமையும் குறுகிய நேர வரம்புகள். இவை பொதுவான அட்டவணைகளிலிருந்து அல்ல, நாளின் கிரக நிலைகளுக்கு எதிராக உங்கள் பிறப்பு ஜாதகத்திலிருந்து கணக்கிடப்படுகின்றன."
  ),

  current_h2:   s("Why it stays current", "ஏன் இது புதுப்பிக்கப்பட்டிருக்கும்"),
  current_body: s(
    "Every day brings a new panchangam, new Moon position, and slight dasha progressions. The reading updates daily — it doesn't recycle a generic week-long or month-long forecast.",
    "ஒவ்வொரு நாளும் புதிய பஞ்சாங்கம், புதிய சந்திர நிலை, சிறிய தசை முன்னேற்றங்களை கொண்டு வருகிறது. வாசிப்பு தினசரி புதுப்பிக்கப்படுகிறது — பொதுவான வார அல்லது மாத கணிப்பை மீண்டும் பயன்படுத்துவதில்லை."
  ),

  faq_h2: s("Questions about daily guidance", "தினசரி வழிகாட்டுதல் பற்றிய கேள்விகள்"),
  faq1_q: s("How is this different from a generic daily horoscope?", "இது ஒரு பொதுவான தினசரி ஜோதிட பலனிலிருந்து எவ்வாறு வேறுபடுகிறது?"),
  faq1_a: s("Generic horoscopes use only your Sun sign or Moon sign. Vinaadi uses your full Thirukanitham birth chart — precise to your date, time, and place of birth — combined with your current dasha period and the day's actual planetary positions. The result is specific to you, not shared with millions of people born in the same month.", "பொதுவான ஜோதிட பலன்கள் உங்கள் சூரிய ராசி அல்லது சந்திர ராசியை மட்டுமே பார்க்கும். விநாடி உங்கள் முழு திருக்கணிதப் பிறப்பு ஜாதகத்தை — பிறந்த தேதி, நேரம், இடம் ஆகியவற்றுக்கு துல்லியமாக — நடப்பு தசை மற்றும் நாளின் உண்மையான கிரக நிலைகளுடன் சேர்த்து வாசிக்கிறது. அதனால் கிடைக்கும் முடிவு உங்களுக்கே உரியது; அதே மாதத்தில் பிறந்த எல்லோருக்கும் ஒரே மாதிரி சொல்லப்படுவது அல்ல."),
  faq2_q: s("Does Vinaadi show me my score every day automatically?", "விநாடி ஒவ்வொரு நாளும் தானாகவே மதிப்பெண்ணை காட்டுகிறதா?"),
  faq2_a: s("Yes — the Today tab updates every day with a fresh reading. Your chart stays saved, so there's nothing to re-enter. Open the app in the morning and the reading is ready.", "ஆம் — இன்று தாவல் ஒவ்வொரு நாளும் புதிய வாசிப்புடன் புதுப்பிக்கப்படுகிறது. உங்கள் ஜாதகம் சேமிக்கப்பட்டிருக்கும், மீண்டும் உள்ளிட தேவையில்லை. காலையில் ஆப்பை திறந்தால் வாசிப்பு தயாராக இருக்கும்."),
  faq3_q: s("What does the daily score number mean?", "தினசரி மதிப்பெண் எண் என்ன அர்த்தம்?"),
  faq3_a: s("It's a relative indicator — not a prediction of luck, but a composite of how your dasha, transits, and panchangam align today versus your baseline chart. Higher means more signals are aligned favourably. It's a planning aid, not a verdict.", "இது அதிர்ஷ்டக் கணிப்பு அல்ல; உங்கள் தசை, கிரகநகர்வு, பஞ்சாங்கம் ஆகியவை இன்று உங்கள் அடிப்படை ஜாதகத்துடன் எவ்வளவு ஒத்திசைகின்றன என்பதைக் காட்டும் ஒப்பீட்டு மதிப்பெண். மதிப்பெண் உயர்ந்தால் சாதகமான சைகைகள் அதிகம் சேர்ந்துள்ளன என்பதுதான் பொருள். இது திட்டமிட உதவும் குறியீடு; இறுதி தீர்ப்பு அல்ல."),
  faq4_q: s("What is Chandrashtama and when does it show up?", "சந்திராஷ்டமம் என்றால் என்ன, எப்போது தெரியும்?"),
  faq4_a: s("Chandrashtama occurs when the transiting Moon moves into the 8th sign from your birth Moon sign. It lasts roughly 2.5 days and repeats monthly. Vinaadi tracks it and flags it clearly in the reading — without dramatising it.", "சந்திராஷ்டமம் நகரும் சந்திரன் உங்கள் பிறப்பு சந்திர ராசியிலிருந்து 8வது ராசிக்கு செல்லும்போது நிகழ்கிறது. இது தோராயமாக 2.5 நாட்கள் நீடிக்கும், மாதாந்திரம் திரும்பும். விநாடி இதை கண்காணித்து, வாசிப்பில் தெளிவாகக் குறிப்பிடுகிறது — நாடகமயமாக்காமல்."),

  related_h2:   s("Related",         "தொடர்புடையவை"),
};

export const FEAT_FAMILY = {
  eyebrow:    s("Feature · Family Planning", "அம்சம் · குடும்ப திட்டமிடல்"),
  h1:         s("Plan for the people you share life with.", "வாழ்க்கையை பகிர்ந்து கொள்பவர்களுக்காக திட்டமிடுங்கள்."),
  lead:       s(
    "Vinaadi's family vault lets you store birth profiles for every family member, see their readings side by side, and find shared timing windows for household decisions.",
    "விநாடியின் குடும்ப சேகரிப்பில் ஒவ்வொரு குடும்ப உறுப்பினரின் பிறப்பு விவரங்களையும் சேமிக்கலாம், அவர்களின் வாசிப்புகளை பக்கப்பக்கமாக ஒப்பிடலாம், வீட்டு முடிவுகளுக்கு எல்லோருக்கும் ஏற்ற பொதுநேரத்தையும் கண்டறியலாம்."
  ),
  cta_start:  s("Start planning →",       "திட்டமிட தொடங்கு →"),
  cta_how:    s("How it works",           "எப்படி வேலை செய்கிறது"),

  vault_h2:   s("The family vault",       "குடும்ப சேகரிப்பு"),
  vault_body: s(
    "Create a vault and add as many family members as you need. Each member gets their own full Thirukanitham chart, daily reading, and dasha timeline.",
    "ஒரு சேகரிப்பை உருவாக்கி, தேவையான அளவு குடும்பத்தினரை சேர்க்கலாம். ஒவ்வொருவருக்கும் தனிப்பட்ட முழுமையான திருக்கணித ஜாதகம், தினசரி வாசிப்பு, தசை காலவரிசை கிடைக்கும்."
  ),
  vault1:       s("Individual charts for each family member",           "ஒவ்வொரு குடும்ப உறுப்பினருக்கும் தனிப்பட்ட ஜாதகங்கள்"),
  vault2_title: s("Shared timing view",                                 "பகிரப்பட்ட நேர காட்சி"),
  vault2:       s("Side-by-side daily readings",                        "பக்கப்பக்கமான தினசரி வாசிப்புகள்"),
  vault3_title: s("Porutham integration",                               "பொருத்தம் இணைப்பு"),
  vault3:       s("Shared best-window calculation for joint decisions", "கூட்டு முடிவுகளுக்கான பொதுவான நல்ல நேரக் கணிப்பு"),
  vault4_title: s("Individual deep-dives",                              "தனிப்பட்ட விரிவான பார்வை"),
  vault4:       s("Dasha timeline comparison across members",           "உறுப்பினர்கள் முழுவதும் தசை காலவரிசை ஒப்பீடு"),

  why_h2:   s("Why family planning matters in Tamil astrology", "தமிழ் ஜோதிடத்தில் குடும்ப திட்டமிடல் ஏன் முக்கியம்"),
  why_body: s(
    "Tamil families have always used astrology together — for muhurtha selection, travel timing, ceremony dates, and understanding each member's dasha period. Vinaadi brings that collaborative use into a single assistant.",
    "தமிழ் குடும்பங்கள் எப்போதும் ஜோதிடத்தை சேர்ந்து பயன்படுத்தியிருக்கின்றன — முகூர்த்த தேர்வு, பயண நேரம், விழா தேதிகள், ஒவ்வொரு உறுப்பினரின் தசை காலத்தை புரிந்துகொள்வதற்கு. விநாடி அந்த கூட்டு பயன்பாட்டை ஒரே உதவியாளரில் கொண்டு வருகிறது."
  ),

  faq_h2: s("Questions about family planning", "குடும்ப திட்டமிடல் பற்றிய கேள்விகள்"),
  faq1_q: s("How many family members can I add?", "எத்தனை குடும்பத்தினரை சேர்க்கலாம்?"),
  faq1_a: s("You can add multiple vaults and as many members as you need across them. There's no hard cap during early access.", "பல சேகரிப்புகளை உருவாக்கலாம், அவற்றில் தேவையான அளவு உறுப்பினர்களை சேர்க்கலாம். ஆரம்ப அணுகல் காலத்தில் கடினமான வரம்பு இல்லை."),
  faq2_q: s("Does each family member need their own account?", "ஒவ்வொரு குடும்ப உறுப்பினருக்கும் தனி கணக்கு தேவையா?"),
  faq2_a: s("No. One account manages the whole vault. You add birth details for each member — they don't need to sign up.", "இல்லை. முழு சேகரிப்பையும் ஒரே கணக்கு நிர்வகிக்கும். ஒவ்வொருவரின் பிறப்பு விவரங்களையும் நீங்கள் சேர்க்கலாம்; அவர்கள் தனியாக பதிவு செய்ய வேண்டியதில்லை."),
  faq3_q: s("What is the shared best-window calculation?", "பொதுவான நல்ல நேரக் கணிப்பு என்றால் என்ன?"),
  faq3_a: s("When you have multiple family members, Vinaadi overlaps their individual daily windows to find times that work reasonably well for everyone — useful for joint ceremonies, family travel, or household decisions.", "பல குடும்பத்தினர் இருந்தால், ஒவ்வொருவரின் தனிப்பட்ட தினசரி நேரங்களை விநாடி ஒன்றுடன் ஒன்று ஒப்பிட்டு, எல்லோருக்கும் ஏற்ற நேரங்களைத் தேர்ந்தெடுக்கிறது. இது கூட்டு விழாக்கள், குடும்பப் பயணம், வீட்டுச் சம்பந்தமான முடிவுகள் போன்றவற்றில் உதவும்."),
  faq4_q: s("Can I use porutham for existing family members, not just marriage?", "திருமணத்திற்குப் பிறகும், குடும்பத்தினருக்குள் பொருத்தம் பார்க்கலாமா?"),
  faq4_a: s("Yes. Porutham is also used to understand compatibility in business partnerships, sibling relationships, and joint ventures — not just marriage. The tool works for any two natal charts.", "ஆம். பொருத்தம் திருமணத்திற்கே மட்டும் அல்ல; வணிக கூட்டாண்மை, உடன்பிறப்பு உறவு, கூட்டு முயற்சி போன்றவற்றிலும் ஒத்துழைப்பு எப்படி இருக்கும் என்பதைப் பார்க்க பயன்படும். இந்த கருவி எந்த இரண்டு பிறப்பு ஜாதகங்களையும் ஒப்பிட முடியும்."),

  related_h2: s("Related", "தொடர்புடையவை"),
};

export const FEAT_CHART = {
  eyebrow:  s("Feature · Chart Guidance", "அம்சம் · ஜாதக விளக்கம்"),
  h1:       s("Understand what your chart is actually saying.", "உங்கள் ஜாதகம் உண்மையில் என்ன சொல்கிறது என்று புரிந்துகொள்ளுங்கள்."),
  lead:     s(
    "Vinaadi reads your Thirukanitham jadhagam — lagna, planet positions, dasha context, yogas, and doshas — and explains what they mean in plain language.",
    "விநாடி உங்கள் திருக்கணித ஜாதகத்தை வாசிக்கிறது — லக்னம், கிரக நிலைகள், தசை சூழல், யோகங்கள், தோஷங்கள் ஆகியவை உங்கள் வாழ்க்கையில் என்ன சொல்லுகின்றன என்பதை எளிய மொழியில் விளக்குகிறது."
  ),
  cta_start:  s("Open my chart →",          "என் ஜாதகத்தை திற →"),
  cta_method: s("Full methodology",          "முழு கணக்கீட்டு முறை"),

  chart_h2:   s("What your chart includes",  "உங்கள் ஜாதகம் என்ன உள்ளடக்கியுள்ளது"),
  c1_title:   s("Lagna and house lords",      "லக்னம் மற்றும் பாவ நாதர்கள்"),
  c1_body:    s("Your rising sign and which planets govern each of the 12 houses in your chart — the foundation of the full reading.", "உங்கள் உதய ராசி மற்றும் ஜாதகத்தில் 12 பாவங்களில் எந்த கிரகங்கள் ஆட்சி செய்கின்றன — முழுமையான வாசிப்பின் அடித்தளம்."),
  c2_title:   s("Planet placements",          "கிரக நிலைகள்"),
  c2_body:    s("Where each planet sits in the South Indian square chart — which rasi, which house, which birth-star pada. Shown in both D1 Rasi and D9 Navamsa.", "தென்னிந்திய சதுர ஜாதகத்தில் ஒவ்வொரு கிரகமும் எந்த ராசியில், எந்த பாவத்தில், எந்த நட்சத்திர பாதத்தில் உள்ளது என்பதைக் காட்டும். இது D1 ராசி கட்டத்திலும் D9 நவாம்சத்திலும் தெரியும்."),
  c3_title:   s("Yogas and doshas",           "யோகங்கள் மற்றும் தோஷங்கள்"),
  c3_body:    s("Key yogas present in your chart — Raj yoga, Dhana yoga, Viparita Raja yoga — and relevant doshas including Kuja dosha and Nadi dosha.", "உங்கள் ஜாதகத்தில் உள்ள முக்கிய யோகங்கள் — ராஜ யோகம், தன யோகம், விபரீத ராஜ யோகம் — மற்றும் குஜ தோஷம், நாடி தோஷம் உட்பட தொடர்புடைய தோஷங்கள்."),
  c4_title:   s("D9 Navamsa chart",           "D9 நவாம்ச ஜாதகம்"),
  c4_body:    s("The divisional chart that reveals deeper patterns — used especially to examine marriage, dharma, and the second half of life.", "ஆழமான முறைகளை வெளிப்படுத்தும் பிரிவு ஜாதகம் — குறிப்பாக திருமணம், தர்மம், வாழ்க்கையின் இரண்டாம் பாதியை ஆய்வு செய்ய பயன்படுகிறது."),

  assistant_h2:   s("The assistant model",    "உதவியாளர் மாதிரி"),
  assistant_body: s(
    "Chart guidance in Vinaadi is not a static printout. The assistant interprets your chart in the context of where you are now — your current dasha period and today's transits — so the explanation is always grounded in the present moment.",
    "விநாடியில் ஜாதக விளக்கம் ஒரு நிலையான அச்சு அல்ல. நீங்கள் இப்போது நிற்கும் வாழ்க்கைச் சூழலில் — நடப்பு தசை, இன்றைய கிரகநகர்வு ஆகியவற்றை சேர்த்து — உதவியாளர் உங்கள் ஜாதகத்தை விளக்குகிறது. அதனால் வாசிப்பு எப்போதும் நிகழ்காலத்துடன் இணைந்ததாக இருக்கும்."
  ),

  faq_h2: s("Questions about chart guidance", "ஜாதக விளக்கம் பற்றிய கேள்விகள்"),
  faq1_q: s("Do I need to know astrology to read my chart?", "என் ஜாதகத்தை படிக்க ஜோதிடம் தெரிய வேண்டுமா?"),
  faq1_a: s("No. Vinaadi explains each element in plain language — you don't need to know what lagna or dasha lord means before reading. The assistant provides context.", "இல்லை. விநாடி ஒவ்வொரு கூறையும் எளிய மொழியில் விளக்குகிறது — படிக்கும் முன் லக்னம் அல்லது தசை நாதன் என்று தெரிய வேண்டியதில்லை. உதவியாளர் சூழலை வழங்குகிறது."),
  faq2_q: s("What ayanamsa does Vinaadi use?", "விநாடி எந்த அயனாம்சத்தை பயன்படுத்துகிறது?"),
  faq2_a: s("Lahiri ayanamsa — the standard used by most traditional Tamil jyotish practitioners and recognised by the Government of India. This is the same as Chitrapaksha ayanamsa.", "லாகிரி அயனாம்சம் — பெரும்பாலான பாரம்பரிய தமிழ் ஜோதிடர்கள் பயன்படுத்தும் தரநிலை, இந்திய அரசாங்கத்தால் அங்கீகரிக்கப்பட்டது. இது சித்திரபக்ஷ அயனாம்சம் என்றும் அழைக்கப்படுகிறது."),
  faq3_q: s("Can I see both D1 and D9 charts?", "D1 மற்றும் D9 ஜாதகங்கள் இரண்டையும் பார்க்கலாமா?"),
  faq3_a: s("Yes. Both the D1 Rasi chart and D9 Navamsa are generated with every birth profile. You can toggle between them in the chart view.", "ஆம். ஒவ்வொரு பிறப்பு விவரத்துடனும் D1 ராசி ஜாதகம் மற்றும் D9 நவாம்சம் இரண்டும் உருவாக்கப்படும். ஜாதகக் காட்சியில் அவற்றுக்கு இடையே மாறிப் பார்க்கலாம்."),
  faq4_q: s("What is a yoga in a birth chart?", "பிறப்பு ஜாதகத்தில் யோகம் என்றால் என்ன?"),
  faq4_a: s("A yoga is a specific combination of planets or house lords that creates a meaningful pattern — favourable or unfavourable. Common yogas in Tamil jyotish include Raj yoga (power and authority), Dhana yoga (wealth), and Chandra-Mangal yoga (financial drive). Vinaadi identifies the key ones present in your chart.", "யோகம் என்பது கிரகங்கள் அல்லது பாவ நாதர்களின் குறிப்பிட்ட சேர்க்கை, இது ஒரு அர்த்தமுள்ள முறையை உருவாக்குகிறது — சாதகமானதோ இல்லையோ. தமிழ் ஜோதிடத்தில் பொதுவான யோகங்கள்: ராஜ யோகம் (அதிகாரம்), தன யோகம் (செல்வம்), சந்திர-மங்கல யோகம் (நிதி உந்துதல்). விநாடி உங்கள் ஜாதகத்தில் உள்ள முக்கியமானவற்றை கண்டறிகிறது."),

  related_h2: s("Related", "தொடர்புடையவை"),
};

export const FEAT_TIMING = {
  eyebrow:  s("Feature · Timing and Decisions", "அம்சம் · நேரம் & முடிவுகள்"),
  h1:       s("Act at the right time. Skip the wrong ones.", "சரியான நேரத்தில் செயல்படுங்கள். தவறான நேரங்களை தவிருங்கள்."),
  lead:     s(
    "Vinaadi identifies the best and caution windows each day, combining your birth chart with dasha, transit positions, and panchangam — so you know when to move and when to wait.",
    "விநாடி ஒவ்வொரு நாளும் சிறந்த மற்றும் எச்சரிக்கை நேரங்களை கண்டறிகிறது. உங்கள் பிறப்பு ஜாதகம், தசை, கிரகநகர்வு, பஞ்சாங்கம் ஆகியவற்றை சேர்த்து எப்போது நகரவேண்டும், எப்போது காத்திருக்கவேண்டும் என்பதைத் தெளிவாகச் சொல்கிறது."
  ),
  cta_start:  s("See today's windows →", "இன்றைய நேரங்களை பாருங்கள் →"),
  cta_method: s("How it's calculated",   "எப்படி கணக்கிடப்படுகிறது"),

  muhurtha_h2:   s("The muhurtha tradition",    "முகூர்த்த பாரம்பரியம்"),
  muhurtha_body: s(
    "Muhurtha — the practice of selecting auspicious timing — is one of the oldest branches of Tamil jyotish. Vinaadi brings this into a daily assistant: not just special-occasion muhurtha, but practical daily windows for any kind of action.",
    "முகூர்த்தம் — நல்ல நேரம் தேர்வுசெய்யும் மரபு — தமிழ் ஜோதிடத்தின் பழமையான முக்கியப் பிரிவுகளில் ஒன்று. விநாடி இதை தினசரி உதவியாளராக கொண்டு வருகிறது: விழா, திருமணம் போன்ற சிறப்பு நாட்களுக்கு மட்டும் அல்ல, அன்றாட முக்கிய செயல்களுக்கும் பயன்படும் நேரச் சுட்டிகளாக."
  ),

  what_h2:   s("What timing guidance covers", "நேர வழிகாட்டுதல் என்ன உள்ளடக்குகிறது"),
  what1: s("Best window — the highest-signal time of day for starting new actions", "சிறந்த நேரம் — புதிய செயலை தொடங்க நாளில் அதிக ஆதரவு கிடைக்கும் பகுதி"),
  what2: s("Caution window — times where planetary combinations suggest waiting or proceeding carefully", "எச்சரிக்கை நேரம் — சற்று காத்திருக்கவோ, மிக கவனமாக முன்னேறவோ சொல்வதுபோல் இருக்கும் நேரங்கள்"),
  what3: s("Rahu Kalam and Yamagandam — traditional inauspicious periods from the Tamil panchangam", "ராகு காலம் மற்றும் யமகண்டம் — தமிழ் பஞ்சாங்கத்திலிருந்து பாரம்பரிய அசுப காலங்கள்"),
  what4: s("Dasha-transit quality — how your current planetary period amplifies or softens the day's signals", "தசை-கிரகநகர்வு ஒத்திசைவு — உங்கள் நடப்பு தசை நாளின் சுட்டிகளை எவ்வாறு வலுப்படுத்துகிறது அல்லது மெலிதாக்குகிறது"),

  decisions_h2:   s("What kinds of decisions benefit", "எந்த வகையான முடிவுகள் பயனடைகின்றன"),
  decisions_body: s(
    "Timing guidance is especially useful for irreversible or high-stakes decisions — not for routine daily tasks.",
    "நேர வழிகாட்டுதல் திரும்ப மாற்ற முடியாத அல்லது அதிக முக்கியத்துவம் கொண்ட முடிவுகளுக்கு மிகவும் உதவும். சாதாரண அன்றாட வேலைகளுக்காக இதை பயன்படுத்த வேண்டியதில்லை."
  ),
  dec1: s("Starting a business or signing contracts",      "வியாபாரம் தொடங்குவது அல்லது ஒப்பந்தங்கள் கையெழுத்திடுவது"),
  dec2: s("Wedding dates and ceremonies",                  "திருமண தேதிகள் மற்றும் விழாக்கள்"),
  dec3: s("Medical procedures or elective surgery",        "மருத்துவ நடைமுறைகள் அல்லது தேர்வு அறுவை சிகிச்சை"),
  dec4: s("Travel — especially long-distance or overseas", "பயணம் — குறிப்பாக நீண்ட தூரம் அல்லது வெளிநாடு"),
  dec5: s("Property purchases or large financial moves",   "சொத்து கொள்முதல் அல்லது பெரிய நிதி நடவடிக்கைகள்"),
  dec6: s("Job changes or educational decisions",          "வேலை மாற்றங்கள் அல்லது கல்வி முடிவுகள்"),

  faq_h2: s("Questions about timing guidance", "நேர வழிகாட்டுதல் பற்றிய கேள்விகள்"),
  faq1_q: s("Is astrological timing a guarantee?", "ஜோதிட நேரம் ஒரு உத்தரவாதமா?"),
  faq1_a: s("No — and Vinaadi doesn't claim it is. Timing guidance improves the odds of a favourable outcome, but no astrological method guarantees results. We treat it as a planning input, not a fatalistic verdict.", "இல்லை — விநாடியும் அப்படிச் சொல்லாது. நல்ல முடிவுக்கான வாய்ப்பை உயர்த்த உதவலாம்; ஆனால் எந்த ஜோதிட முறையும் முடிவை உறுதியாகச் சொல்ல முடியாது. இதை நாங்கள் திட்டமிட உதவும் ஒரு சுட்டியாகவே பார்க்கிறோம்; இறுதி விதித் தீர்ப்பாக அல்ல."),
  faq2_q: s("How is a 'best window' calculated?", "'சிறந்த நேரம்' எவ்வாறு கணக்கிடப்படுகிறது?"),
  faq2_a: s("It combines your natal chart's sensitive points with the day's planetary hora sequence, panchangam quality, and dasha-transit alignment. It's a multi-signal composite, not a single-rule lookup.", "உங்கள் பிறப்பு ஜாதகத்தின் முக்கிய அம்சங்களை, அன்றைய கிரக ஹோரா வரிசை, பஞ்சாங்கத் தரம், தசை-கிரகநகர்வு ஒத்திசைவு ஆகியவற்றுடன் சேர்த்து பார்க்கிறோம். இது ஒரு விதியை மட்டும் பார்த்த முடிவு அல்ல; பல சுட்டிகள் சேர்ந்து தரும் வாசிப்பு."),
  faq3_q: s("What is Rahu Kalam exactly?", "ராகு காலம் என்றால் சரியாக என்ன?"),
  faq3_a: s("Rahu Kalam is a daily inauspicious period in the Tamil panchangam — roughly 90 minutes, occurring at different times on each day of the week. Traditional practice avoids starting new actions during this window. Vinaadi marks it clearly in the daily view.", "ராகு காலம் தமிழ் பஞ்சாங்கத்தில் தினசரி அசுப காலம் — தோராயமாக 90 நிமிடங்கள், வாரத்தின் ஒவ்வொரு நாளும் வெவ்வேறு நேரங்களில் நிகழ்கிறது. பாரம்பரிய நடைமுறை இந்த சாளரத்தில் புதிய செயல்களை தொடங்குவதை தவிர்க்கிறது. விநாடி தினசரி காட்சியில் இதை தெளிவாக குறிக்கிறது."),

  related_h2: s("Related", "தொடர்புடையவை"),
};

// ─── TOOLS ──────────────────────────────────────────────────────────────────

export const TOOL_PORUTHAM = {
  eyebrow:    s("Tool · Marriage Porutham Calculator", "கருவி · திருமண பொருத்தம் கணக்கிடல்"),
  h1:         s("Quick Tamil birth-star porutham preview.", "விரைவான தமிழ் நட்சத்திரப் பொருத்த முதல் பார்வை."),
  lead:       s(
    "Choose two birth stars and get a quick porutham preview with Rajju, Vedha, Rasi, and Nadi cautions. For the full 36-point chart-grade match with Sevvai dosham, D9, dasha, and cancellation rules, sign in and use the dashboard.",
    "இரண்டு பிறப்பு நட்சத்திரங்களைத் தேர்வு செய்து ரஜ்ஜு, வேதம், ராசி, நாடி கவனங்களுடன் விரைவான பொருத்த முதல் பார்வையைப் பெறுங்கள். செவ்வாய் தோஷம், நவாம்சம், தசை, தோஷ நிவர்த்தி விதிகள் உடன் முழு 36 மதிப்பெண் ஜாதகப் பொருத்தத்திற்கு உள்நுழைந்து dashboard-ஐ பயன்படுத்துங்கள்."
  ),

  checks_h2: s("What Vinaadi checks",     "விநாடி என்ன சரிபார்க்கிறது"),
  checks_body: s(
    "The public tool gives a fast birth-star reading so families can take a first look without entering full birth details. A proper Tamil marriage judgement needs the signed-in chart reading, where the score and dosha cautions are read together.",
    "முழு பிறப்பு விவரங்கள் இல்லாமலேயே குடும்பங்கள் முதலில் பார்த்துக் கொள்ள இந்த public கருவி விரைவான நட்சத்திர வாசிப்பைத் தருகிறது. சரியான தமிழ் திருமண முடிவுக்கு உள்நுழைந்த ஜாதக வாசிப்பில் மதிப்பெண், தோஷ கவனங்கள் இரண்டும் சேர்த்து பார்க்க வேண்டும்."
  ),

  ten_h2: s("The 10 poruthams", "10 பொருத்தங்கள்"),
  p1:  s("Dina porutham — birth-star compatibility for daily harmony",      "தின பொருத்தம் — தினசரி நல்லிணக்கத்திற்கு நட்சத்திர பொருத்தம்"),
  p2:  s("Gana porutham — temperament match (Deva, Manushya, Rakshasa)",   "கண பொருத்தம் — குணம் பொருத்தம் (தேவ, மனுஷ்ய, ராக்ஷஸ)"),
  p3:  s("Mahendra porutham — longevity and prosperity of the couple",     "மகேந்திர பொருத்தம் — தம்பதிகளின் ஆயுள் மற்றும் செழிப்பு"),
  p4:  s("Sthree dheerga porutham — wife's welfare and longevity",         "ஸ்திரீ தீர்க்க பொருத்தம் — மனைவியின் நலன் மற்றும் ஆயுள்"),
  p5:  s("Yoni porutham — physical compatibility",                         "யோனி பொருத்தம் — உடல் பொருத்தம்"),
  p6:  s("Rasi porutham — sign compatibility",                             "ராசி பொருத்தம் — ராசி பொருத்தம்"),
  p7:  s("Rasyadhipati porutham — compatibility of rasi lords",            "ராஸ்யதிபதி பொருத்தம் — ராசி நாதர்கள் பொருத்தம்"),
  p8:  s("Vasya porutham — harmony and mutual respect",                    "வஸ்ய பொருத்தம் — நல்லிணக்கம் மற்றும் பரஸ்பர மரியாதை"),
  p9:  s("Rajju porutham — the critical dosha check (widow/widower risk)", "ரஜ்ஜு பொருத்தம் — முக்கியமான தோஷம் சரிபார்ப்பு (விதவை/இழப்பு ஆபத்து)"),
  p10: s("Nadi porutham — health and progeny compatibility",               "நாடி பொருத்தம் — உடல்நலம் மற்றும் குழந்தை பொருத்தம்"),

  rajju_h2:   s("Rajju and Nadi — the critical checks", "ரஜ்ஜு மற்றும் நாடி — முக்கியமான சரிபார்ப்புகள்"),
  rajju_body: s(
    "In Tamil tradition, Rajju, Vedha, Rasi, and Nadi cautions are not treated as small footnotes. This public page flags the caution; the signed-in report checks the full chart before giving a final recommendation.",
    "தமிழ் பாரம்பரியத்தில் ரஜ்ஜு, வேதம், ராசி, நாடி கவனங்கள் சிறிய குறிப்புகளாகப் பார்க்கப்படுவதில்லை. இந்த public பக்கம் கவனத்தை மட்டும் காட்டும்; இறுதி பரிந்துரைக்கு முன் உள்நுழைந்த அறிக்கை முழு ஜாதகத்தைப் பார்க்கும்."
  ),

  related_h2: s("Related", "தொடர்புடையவை"),
};

export const TOOL_JADHAGAM = {
  eyebrow:   s("Tool · Jadhagam Generator", "கருவி · ஜாதகம் உருவாக்கு"),
  h1:        s("South Indian Tamil birth chart, precisely calculated.", "தென்னிந்திய தமிழ் ஜாதகம், துல்லியமாக கணக்கிடப்பட்டது."),
  lead:      s(
    "Enter a birth date, time, and place to generate a Thirukanitham-precise South Indian jadhagam — D1 Rasi chart, D9 Navamsa, planet positions, and Vimshottari dasha sequence.",
    "திருக்கணிதம் துல்லியமான தென்னிந்திய ஜாதகம் உருவாக்க பிறந்த தேதி, நேரம், இடம் உள்ளிடவும் — D1 ராசி கட்டம், D9 நவாம்சம், கிரக நிலைகள், விம்சோத்தரி தசை வரிசை."
  ),
  cta_gen:    s("Generate now →",           "இப்போதே உருவாக்கு →"),
  cta_method: s("Our calculation method",   "எங்கள் கணக்கீட்டு முறை"),

  what_h2:    s("What's included in every jadhagam", "ஒவ்வொரு ஜாதகத்திலும் என்ன உள்ளது"),
  w1_title:   s("D1 Rasi chart",             "D1 ராசி கட்டம்"),
  w1_body:    s("The main South Indian square chart showing all 9 planets across the 12 rasis, with lagna, planet positions, and birth-star details.", "12 ராசிகளில் அனைத்து 9 கிரகங்களையும் காட்டும் முக்கிய தென்னிந்திய சதுர கட்டம். லக்னம், கிரக நிலைகள், நட்சத்திர விவரங்கள் எல்லாம் இதில் இருக்கும்."),
  w2_title:   s("D9 Navamsa chart",           "D9 நவாம்ச கட்டம்"),
  w2_body:    s("The Navamsa divisional chart, used to examine deeper patterns — especially marriage and dharma — beyond the D1 Rasi chart.", "D1 ராசி கட்டத்திற்கு அப்பால் ஆழமான முறைகளை — குறிப்பாக திருமணம் மற்றும் தர்மம் — ஆய்வு செய்ய பயன்படும் நவாம்ச பிரிவு கட்டம்."),
  w3_title:   s("Planet positions",           "கிரக நிலைகள்"),
  w3_body:    s("Longitude, rasi, birth star, pada, and retrograde status for all 9 planets — Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, and Ketu.", "சூரியன், சந்திரன், செவ்வாய், புதன், குரு, சுக்கிரன், சனி, ராகு, கேது ஆகிய 9 கிரகங்களுக்கும் தீர்க்கரேகை, ராசி, நட்சத்திரம், பாதம், வக்கிர நிலை ஆகியவை காட்டப்படும்."),
  w4_title:   s("Vimshottari Dasha sequence", "விம்சோத்தரி தசை வரிசை"),
  w4_body:    s("The full 120-year dasha sequence with start and end dates — maha dasha, antar dasha (bhukti), and pratyanta dasha levels.", "மஹா தசை, அந்தர் தசை (புக்தி), பிரத்யந்த தசை நிலைகளுடன் தொடக்க மற்றும் முடிவு தேதிகள் கொண்ட முழுமையான 120 ஆண்டு தசை வரிசை."),

  related_h2: s("Related", "தொடர்புடையவை"),
};

export const TOOL_PANCH = {
  eyebrow:  s("Tool · Daily Panchangam Planner", "கருவி · தினசரி பஞ்சாங்க திட்டமிடல்"),
  h1:       s("The Tamil panchangam for any day, precisely calculated.", "எந்த நாளுக்கும் தமிழ் பஞ்சாங்கம், துல்லியமாக கணக்கிடப்பட்டது."),
  lead:     s(
    "Look up the five elements of the Tamil panchangam — Tithi, Vara, Birth Star, Yoga, and Karana — for any date, along with Rahu Kalam, Yamagandam, and auspicious timings.",
    "எந்த தேதிக்கும் தமிழ் பஞ்சாங்கத்தின் ஐந்து கூறுகளை — திதி, வாரம், நட்சத்திரம், யோகம், கரணம் — ராகு காலம், யமகண்டம், நல்ல நேரங்களுடன் பார்க்கலாம்."
  ),

  five_h2:   s("The five panchangam elements", "பஞ்சாங்கத்தின் ஐந்து கூறுகள்"),
  e1_title:  s("Tithi",      "திதி"),
  e1_body:   s("The lunar day — one of 30 tithis in the lunar cycle, calculated from the angular distance between the Sun and Moon.", "சந்திர நாள் — சூரியன் மற்றும் சந்திரனுக்கு இடையிலான கோண தூரத்திலிருந்து கணக்கிடப்படும் சந்திர சுழற்சியில் 30 திதிகளில் ஒன்று."),
  e2_title:  s("Vara",       "வாரம்"),
  e2_body:   s("The day of the week — each weekday carries a specific planetary lord with its own quality.", "வாரத்தின் நாள் — ஒவ்வொரு வாரநாளும் தனிப்பட்ட தன்மையுடன் ஒரு குறிப்பிட்ட கிரக நாதனை கொண்டுள்ளது."),
  e3_title:  s("Birth Star",    "நட்சத்திரம்"),
  e3_body:   s("The birth star the Moon occupies today — one of 27 stars, each carrying its own tone for the day.", "இன்று சந்திரன் தங்கியிருக்கும் நட்சத்திரம் — 27 நட்சத்திரங்களில் ஒன்று. ஒவ்வொன்றும் அந்த நாளுக்கே உரிய தன்மையையும் மனநிலையையும் தரும்."),
  e4_title:  s("Yoga",       "யோகம்"),
  e4_body:   s("The combined Sun-Moon yoga for the day — one of 27 nitya yogas, indicating the overall quality of the day.", "நாளுக்கான கூட்டு சூரியன்-சந்திரன் யோகம் — 27 நித்ய யோகங்களில் ஒன்று, நாளின் ஒட்டுமொத்த தரத்தை சுட்டுகிறது."),
  e5_title:  s("Karana",     "கரணம்"),
  e5_body:   s("The half-tithi — each day has two karanas. Used for fine-grained timing within the day.", "அரை-திதி — ஒவ்வொரு நாளும் இரண்டு கரணங்களை கொண்டுள்ளது. நாளுக்குள் நுண்ணிய நேர நிர்ணயத்திற்கு பயன்படுகிறது."),

  related_h2: s("Related", "தொடர்புடையவை"),
};

export const TOOL_BTR = {
  eyebrow:  s("Tool · Birth Time Rectification", "கருவி · பிறப்பு நேர திருத்தம்"),
  h1:       s("Refine an uncertain birth time for a more accurate chart.", "மேலும் துல்லியமான ஜாதகத்திற்கு தெளிவற்ற பிறந்த நேரத்தை திருத்துங்கள்."),
  lead:     s(
    "Birth time rectification uses known life events — marriage, job changes, major moves — to work backwards and narrow the probable birth time. The result is a more accurate Thirukanitham chart.",
    "பிறப்பு நேர திருத்தம் என்பது, திருமணம், வேலை மாற்றம், பெரிய இடமாற்றம் போன்ற வாழ்க்கை நிகழ்வுகளை வைத்து நேரத்தைத் திரும்பிப் பார்த்து சரி செய்யும் முறை. இதன் முடிவாக அதிக துல்லியமான திருக்கணித ஜாதகம் கிடைக்கும்."
  ),
  cta_start:  s("Try rectification →",      "திருத்தத்தை முயற்சிக்கவும் →"),
  cta_method: s("Our calculation method",   "எங்கள் கணக்கீட்டு முறை"),

  related_h2: s("Related", "தொடர்புடையவை"),
};

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
    "The word Thirukanitham comes from 'Thiru' (sacred) and 'Kanitham' (mathematics/calculation). It refers to the precise astronomical calculation method used in Tamil jyotish — as opposed to the older Vakya system, which relied on pre-computed planetary positions from memorised Sanskrit verses.",
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
    "Vinaadi computes all charts using the Drik ephemeris with Lahiri ayanamsa — giving you precise planet positions, correct birth-star placements, and an accurate dasha sequence based on your actual Moon birth star and pada at birth.",
    "விநாடி லாகிரி அயனாம்சத்துடன் திரிக் கோளக்கணிதத்தை பயன்படுத்தி அனைத்து ஜாதகங்களையும் கணக்கிடுகிறது — துல்லியமான கிரக நிலைகள், சரியான நட்சத்திர நிலைகள், பிறப்பின் போது உங்கள் உண்மையான சந்திர நட்சத்திரம் மற்றும் பாதத்தை அடிப்படையாக கொண்ட துல்லியமான தசை வரிசை தருகிறது."
  ),

  related_h2: s("Related", "தொடர்புடையவை"),
};

export const LEARN_PORUTHAM = {
  eyebrow:  s("Learn · Porutham",     "அறிந்து கொள் · பொருத்தம்"),
  h1:       s("What is Porutham?",     "பொருத்தம் என்றால் என்ன?"),
  lead:     s(
    "Porutham is the Tamil system of marriage compatibility matching using birth stars and rasis. The system checks 10 poruthams — each testing a different dimension of compatibility.",
    "பொருத்தம் என்பது, பிறப்பு நட்சத்திரமும் ராசியும் அடிப்படையாக வைத்து திருமணத்திற்கு ஏற்ற இணக்கத்தைப் பார்ப்பதற்கான தமிழ் முறை. இதில் பத்து பொருத்தங்கள் பார்க்கப்படும்; ஒவ்வொன்றும் வாழ்க்கையின் வேறு அம்சத்தை அளவிடும்."
  ),

  meaning_h2: s("The meaning of Porutham", "பொருத்தம் என்ன அர்த்தம்"),
  meaning_body: s(
    "Porutham means 'compatibility' or 'suitability' in Tamil. The porutham system compares the birth stars of two people to assess how well they match across ten dimensions — from day-to-day harmony to progeny, longevity, and prosperity.",
    "பொருத்தம் என்றால் 'இணக்கம்' அல்லது 'ஏற்றமை' என்பதாகும். இரண்டு பேரின் பிறப்பு நட்சத்திரங்களை ஒப்பிட்டு, அன்றாட நல்லிணக்கம், வாழ்நாள் நிலைத்தன்மை, குடும்ப வளர்ச்சி, செழிப்பு போன்ற பல அம்சங்களில் அவர்கள் எவ்வளவு சேர்ந்து செல்ல முடியும் என்பதைப் பார்க்கும் முறையே இது."
  ),

  how_h2:   s("How porutham is determined", "பொருத்தம் எவ்வாறு நிர்ணயிக்கப்படுகிறது"),
  how_body: s(
    "Each of the 10 poruthams is determined by comparing specific attributes of the two birth stars — their order, their animal symbols, their gana (temperament type), and their rasi lords. The result for each porutham is binary: it either matches or it doesn't.",
    "இந்த பத்து பொருத்தங்களும் இரண்டு பேரின் பிறப்பு நட்சத்திரங்களில் உள்ள குறிப்பிட்ட அம்சங்களை ஒப்பிட்டு நிர்ணயிக்கப்படுகின்றன. நட்சத்திர வரிசை, விலங்கு சின்னம், கணம், ராசி அதிபதி போன்றவற்றை வைத்து ஒவ்வொன்றாகத் தீர்மானிக்கப்படுகிறது. ஒவ்வொரு பொருத்தத்திற்கும் முடிவு தெளிவாக இருக்கும்: பொருந்தும் அல்லது பொருந்தாது."
  ),

  critical_h2: s("Rajju and Nadi — why they outweigh the count", "ரஜ்ஜு மற்றும் நாடி — ஏன் இவை எண்ணிக்கையை விட முக்கியம்"),
  critical_body: s(
    "Traditional Tamil jyotish treats Rajju dosha and Nadi dosha as dealbreakers — regardless of how many other poruthams match. A high porutham count with Rajju dosha or Nadi dosha present is still considered problematic by traditional practitioners.",
    "பாரம்பரிய தமிழ் ஜோதிடத்தில் ரஜ்ஜு தோஷமும் நாடி தோஷமும் மிகவும் முக்கியமாகக் கருதப்படுகின்றன. மற்ற பல பொருத்தங்கள் இருந்தாலும், இந்த இரண்டில் குறை இருந்தால் அதை எளிதாகத் தவிர்க்க முடியாது. அதனால் மொத்த எண்ணிக்கையைவிட இவை அதிக கவனம் பெறுகின்றன."
  ),

  sevvai_h2:   s("Sevvai dosham (Manglik status)", "செவ்வாய் தோஷம் (மங்கலிக் நிலை)"),
  sevvai_body: s(
    "Sevvai dosham (also called Kuja dosha or Manglik) occurs when Mars is placed in the 1st, 2nd, 4th, 7th, 8th, or 12th house from lagna, Moon, or Venus. Traditional practice matches Sevvai dosham holders together to neutralise the dosha.",
    "செவ்வாய் தோஷம் (குஜ தோஷம் அல்லது மங்கலிக் என்றும் அழைக்கப்படுகிறது) செவ்வாய் லக்னம், சந்திரன் அல்லது சுக்கிரனிலிருந்து 1வது, 2வது, 4வது, 7வது, 8வது அல்லது 12வது பாவத்தில் அமரும்போது நிகழ்கிறது. பாரம்பரிய நடைமுறை தோஷத்தை நடுநிலையாக்க செவ்வாய் தோஷம் உள்ளவர்களை ஒன்றாக பொருத்துகிறது."
  ),

  count_h2:   s("How many poruthams are needed?", "எத்தனை பொருத்தங்கள் தேவை?"),
  count_body: s(
    "Traditional Tamil practice considers 7 or more out of 10 poruthams (excluding Rajju and Nadi) as a good match. But the qualitative factors — Rajju, Nadi, and Sevvai dosham — matter more than the raw count.",
    "பாரம்பரியமாக, பத்து பொருத்தங்களில் ஏழு அல்லது அதற்கு மேல் இருந்தால் நல்ல பொருத்தம் எனக் கருதுவார்கள். ஆனால் ரஜ்ஜு, நாடி, செவ்வாய் தோஷம் போன்ற முக்கியச் சரிபார்ப்புகள் வெறும் எண்ணிக்கையைவிட மேலானவை."
  ),

  related_h2: s("Related", "தொடர்புடையவை"),
};

export const LEARN_CHANDRA = {
  eyebrow:  s("Learn · Chandrashtama",    "அறிந்து கொள் · சந்திராஷ்டமம்"),
  h1:       s("What is Chandrashtama?",   "சந்திராஷ்டமம் என்றால் என்ன?"),
  lead:     s(
    "Chandrashtama is the period when the transiting Moon passes through the 8th sign from your birth Moon sign. It occurs roughly every 27 days and lasts about 2.5 days.",
    "சந்திராஷ்டமம் என்பது நகரும் சந்திரன் உங்கள் பிறப்பு சந்திர ராசியிலிருந்து 8வது ராசி வழியாக கடக்கும் காலம். இது தோராயமாக ஒவ்வொரு 27 நாட்களுக்கும் ஒரு முறை நிகழ்கிறது, சுமார் 2.5 நாட்கள் நீடிக்கும்."
  ),

  what_h2:   s("What it means",        "இது என்ன அர்த்தம்"),
  what_body: s(
    "In Tamil jyotish, the 8th house is associated with obstacles, hidden difficulties, and matters requiring extra care. When the transiting Moon — which moves through all 12 signs in roughly 27 days — enters the sign 8th from your natal Moon, the period is traditionally considered one for caution rather than new beginnings.",
    "தமிழ் ஜோதிடத்தில், 8வது பாவம் தடைகள், மறைக்கப்பட்ட சிரமங்கள், கூடுதல் கவனம் தேவைப்படும் விஷயங்களுடன் தொடர்புடையது. நகரும் சந்திரன் — தோராயமாக 27 நாட்களில் அனைத்து 12 ராசிகளையும் கடக்கும் — உங்கள் பிறப்பு சந்திரனிலிருந்து 8வது ராசியை நுழையும்போது, அந்த காலம் புதிய தொடக்கங்களுக்கு அல்ல, எச்சரிக்கைக்காக பாரம்பரியமாக கருதப்படுகிறது."
  ),

  calm_h2:   s("A calm approach",      "அமைதியான அணுகுமுறை"),
  calm_body: s(
    "Chandrashtama is not a crisis period — it's a short monthly phase worth noting. Vinaadi tracks it and flags it clearly without dramatising it. The practical approach is to avoid starting major new actions during this window, while continuing routine work normally.",
    "சந்திராஷ்டமம் ஒரு நெருக்கடி காலம் அல்ல — இது கவனிக்க வேண்டிய ஒரு சுருக்கமான மாதாந்திர கட்டம். விநாடி இதை கண்காணிக்கிறது, நாடகமயமாக்காமல் தெளிவாக குறிக்கிறது. நடைமுறை அணுகுமுறை என்னவென்றால், இந்த சாளரத்தில் பெரிய புதிய செயல்களை தொடங்குவதை தவிர்ப்பது, வழக்கமான வேலையை சாதாரணமாக தொடருவது."
  ),

  related_h2: s("Related", "தொடர்புடையவை"),
};

export const LEARN_JAD = {
  eyebrow:  s("Learn · Jadhagam",          "அறிந்து கொள் · ஜாதகம்"),
  h1:       s("How to read a Jadhagam.",    "ஜாதகம் படிப்பது எப்படி."),
  lead:     s(
    "A Thirukanitham jadhagam is a map of the sky at the moment of your birth. Understanding its structure helps you follow the guidance Vinaadi provides.",
    "திருக்கணித ஜாதகம் என்பது நீங்கள் பிறந்த தருணத்தில் வானின் நிலையைச் சொல்வது போலான ஒரு வரைபடம். அதன் அமைப்பை புரிந்துகொண்டால், விநாடி தரும் விளக்கங்களும் வழிகாட்டுதலும் இன்னும் தெளிவாகப் புரியும்."
  ),

  structure_h2:   s("The South Indian chart structure",  "தென்னிந்திய ஜாதக அமைப்பு"),
  structure_body: s(
    "The South Indian chart is a fixed square grid with the 12 rasis always in the same positions. Unlike the North Indian chart where lagna rotates, here the rasis are fixed — only the planet symbols and lagna marker move based on birth details.",
    "தென்னிந்திய ஜாதகம் என்பது 12 ராசிகளும் எப்போதும் ஒரே இடத்தில் இருக்கும் நிலையான சதுர வடிவம். வடஇந்திய முறையில் லக்னம் சுற்றி நகரும்; ஆனால் இங்கே ராசிகள் மாறாது. பிறப்பு விவரங்களின் அடிப்படையில் கிரகச் சின்னங்களும் லக்னக் குறியும் மட்டும் மாறும்."
  ),

  lagna_h2:   s("Lagna — your rising sign",  "லக்னம் — உங்கள் உதய ராசி"),
  lagna_body: s(
    "Lagna is the rasi that was rising on the eastern horizon at the moment of your birth. It marks the 1st house — the reference point from which all house positions are counted. In Vinaadi's chart, lagna is marked clearly in its square.",
    "நீங்கள் பிறந்த தருணத்தில் கிழக்கு திசையில் உதித்துக் கொண்டிருந்த ராசியே லக்னம். அதுவே முதல் பாவமாகக் கொள்ளப்படும்; அங்கிருந்துதான் மற்ற பாவங்கள் அனைத்தும் எண்ணப்படுகின்றன. விநாடி ஜாதகக் காட்சியில் லக்னம் தெளிவாகக் குறிக்கப்படும்."
  ),

  dasha_h2:   s("The dasha sequence",  "தசை வரிசை"),
  dasha_body: s(
    "The dasha sequence starts from the Moon's birth star at birth. Each birth star has a planetary lord, and the sequence runs through 9 planets in a fixed order over 120 years. Where you start in the sequence, and how much of the first dasha remains at birth, depends on the Moon's exact position within that star.",
    "தசை வரிசை, பிறந்தபோது சந்திரன் இருந்த நட்சத்திரத்திலிருந்தே தொடங்குகிறது. ஒவ்வொரு நட்சத்திரத்துக்கும் ஒரு கிரக அதிபதி உண்டு; அந்த வரிசை 120 ஆண்டுகளில் ஒன்பது கிரகங்கள் வழியாகச் செல்கிறது. பிறக்கும் போது அந்த நட்சத்திரத்தில் சந்திரன் எங்கே இருந்தது என்பதையே வைத்து, எந்த தசையில் ஆரம்பிக்கிறீர்கள், முதல் தசையில் எவ்வளவு காலம் எஞ்சியுள்ளது என்பதைக் கணக்கிடுகிறோம்."
  ),

  related_h2: s("Related", "தொடர்புடையவை"),
};

export const LEARN_BIRTH = {
  eyebrow:  s("Learn · Birth Time",      "அறிந்து கொள் · பிறந்த நேரம்"),
  h1:       s("Why birth time matters.", "பிறந்த நேரம் ஏன் முக்கியம்."),
  lead:     s(
    "In Thirukanitham astrology, the birth time determines your lagna and the Moon's exact position within its birth star — both of which shape the entire reading.",
    "திருக்கணித ஜோதிடத்தில், பிறந்த நேரம் உங்கள் லக்னத்தையும், நட்சத்திரத்திற்குள் சந்திரன் இருந்த துல்லியமான இடத்தையும் நிர்ணயிக்கிறது. இந்த இரண்டு அம்சங்களே முழு வாசிப்பின் அடித்தளமாக இருக்கும்."
  ),

  lagna_h2:   s("Lagna changes every 2 hours",  "லக்னம் ஒவ்வொரு 2 மணி நேரத்திலும் மாறும்"),
  lagna_body: s(
    "Because the Earth rotates, the sign rising on the eastern horizon changes approximately every 2 hours. A person born at 6:00 AM may have a different lagna than someone born at 8:00 AM — even in the same city on the same day. The lagna determines house positions for all 9 planets, which shapes the entire chart interpretation.",
    "பூமி சுழல்வதால், கிழக்கில் உதிக்கும் ராசி சுமார் இரண்டு மணி நேரத்திற்கு ஒருமுறை மாறுகிறது. அதே நகரத்தில், அதே நாளில் பிறந்திருந்தாலும், காலை 6 மணிக்கும் 8 மணிக்கும் பிறந்தவர்களின் லக்னம் வேறுபடலாம். லக்னம் தான் ஒன்பது கிரகங்களும் எந்த பாவத்தில் அமைகின்றன என்பதை முடிவு செய்கிறது; அதனால் முழு ஜாதக விளக்கமும் மாறலாம்."
  ),

  dasha_h2:   s("Dasha start depends on Moon's exact pada",  "தசை தொடக்கம் சந்திரனின் சரியான பாதத்தை பொறுத்தது"),
  dasha_body: s(
    "The Vimshottari dasha sequence starts from the Moon's birth star at birth. Each birth star has 4 padas (quarter divisions). The exact pada — which requires an accurate birth time to determine — sets where in the dasha sequence you begin and how much of the first dasha period has already elapsed.",
    "விம்சோத்தரி தசை வரிசை, பிறந்தபோது சந்திரன் இருந்த நட்சத்திரத்திலிருந்து தொடங்குகிறது. ஒவ்வொரு நட்சத்திரமும் நான்கு பாதங்களாகப் பிரியும். நீங்கள் எந்த பாதத்தில் பிறந்தீர்கள் என்பதைத் துல்லியமாக அறிய பிறப்பு நேரம் அவசியம்; அதைத்தான் வைத்து நீங்கள் எந்த தசையில் ஆரம்பிக்கிறீர்கள், முதல் தசையில் எவ்வளவு காலம் ஏற்கனவே சென்றுவிட்டது என்பதைக் கணக்கிடுகிறோம்."
  ),

  uncertain_h2:   s("When birth time is uncertain",   "பிறந்த நேரம் தெளிவற்றிருக்கும்போது"),
  uncertain_body: s(
    "Many people have an approximate birth time — or no recorded time at all. Vinaadi can generate a chart with an approximate time and flag the uncertain elements. For a more accurate chart, the birth time rectification tool can help narrow the probable birth time using known life events.",
    "பலருக்கு பிறப்பு நேரம் தோராயமாக மட்டுமே தெரியும்; சிலருக்கு பதிவு செய்த நேரமே இருக்காது. அப்படியிருந்தாலும், விநாடி தோராயமான நேரத்தை வைத்து ஒரு ஜாதகத்தை உருவாக்கி, நிச்சயமில்லாத பகுதிகளைத் தெளிவாகக் காட்டும். இன்னும் துல்லியமாகப் பார்க்க, வாழ்க்கை நிகழ்வுகளை ஆதாரமாகக் கொண்டு பிறப்பு நேரத்தை குறுக்கும் திருத்து கருவி உதவும்."
  ),

  related_h2: s("Related", "தொடர்புடையவை"),
};

// ─── TRUST ───────────────────────────────────────────────────────────────────

export const TRUST_METHOD = {
  eyebrow:  s("Methodology",          "கணக்கீட்டு முறை"),
  h1:       s("How Vinaadi calculates Tamil astrology.", "விநாடி தமிழ் ஜோதிடத்தை எவ்வாறு கணக்கிடுகிறது."),
  lead:     s(
    "Every reading in Vinaadi is grounded in specific, named calculation methods. This page explains what they are and why we use them.",
    "விநாடியில் ஒவ்வொரு வாசிப்பும் குறிப்பிட்ட, பெயரிடப்பட்ட கணக்கீட்டு முறைகளில் நிலைநிறுத்தப்பட்டுள்ளது. இந்த பக்கம் அவை என்ன என்று, நாங்கள் ஏன் அவற்றை பயன்படுத்துகிறோம் என்று விளக்குகிறது."
  ),
  related_h2: s("Related", "தொடர்புடையவை"),
};

export const TRUST_ABOUT = {
  eyebrow:  s("About Vinaadi",         "விநாடி பற்றி"),
  h1:       s("A calm Tamil astrology assistant.", "ஒரு அமைதியான தமிழ் ஜோதிட உதவியாளர்."),
  lead:     s(
    "Vinaadi is built to bring the Tamil jyotish tradition into a modern, calm planning assistant — precise calculation, family-aware, and without fear language.",
    "விநாடி தமிழ் ஜோதிட பாரம்பரியத்தை நவீன, அமைதியான திட்டமிடல் உதவியாளரில் கொண்டு வர கட்டப்பட்டுள்ளது — துல்லியமான கணக்கீடு, குடும்பத்தை கருத்தில் கொண்டது, பயமுறுத்தும் மொழியின்றி."
  ),
  related_h2: s("Related", "தொடர்புடையவை"),
};

// ─── NATCHATHIRAM ────────────────────────────────────────────────────────────

export const NATCHATHIRAM_INDEX = {
  eyebrow:       s("Thirukanitham · Vedic Astrology", "திருக்கணிதம் — Vedic Astrology"),
  h1_ta:         s("27 Birth Stars", "27 நட்சத்திரங்கள்"),
  h1_sub:        s("The 27 Birth Stars · Complete Nakshathiram Profiles", "27 நட்சத்திரங்கள் — முழு வழிகாட்டுதல்"),
  lead:          s(
    "Your birth star — the lunar mansion the Moon occupied at the moment of your birth — reveals your core temperament, career strengths, relationship patterns, and the dasha periods that shape each chapter of life. Find your full birth-star profile below.",
    "நீங்கள் பிறந்த நட்சத்திரம் உங்கள் குணம், தொழில், குடும்பம், தசை காலங்கள் மற்றும் ஆன்மீக பாதை பற்றி என்ன சொல்கிறது? ஒவ்வொரு நட்சத்திரத்தின் விரிவான வழிகாட்டுதல் இங்கே."
  ),
  figure_label:  s("Birth star map · 27 Nakshathirams", "27 நட்சத்திர வரைபடம்"),
  figure_title:  s("Moon, Lunar Mansions & Birth Temperament", "சந்திரன், நட்சத்திரங்கள் மற்றும் பிறப்பு குணம்"),
  available_h2:  s("Available Nakshathiram Profiles", "கிடைக்கும் நட்சத்திர வழிகாட்டுதல்கள்"),
  upcoming_h2:   s("Coming Soon", "விரைவில் வருகிறது"),
  upcoming_desc: s(
    "The remaining birth-star profiles will be added shortly.",
    "மீதமுள்ள நட்சத்திர வழிகாட்டுதல்கள் விரைவில் சேர்க்கப்படும்."
  ),
  what_h2:       s("What is a Birth Star?", "நட்சத்திரம் என்றால் என்ன?"),
  what_p1:       s(
    "In Vedic astrology, the Moon passes through one of 27 lunar mansions every day, completing its full cycle in 27 days. Your birth star is the one the Moon occupied at the exact moment of birth — a lasting marker of your inner nature.",
    "இந்திய வேத ஜோதிடத்தில் சந்திரன் 27 நட்சத்திரங்களில் ஒவ்வொரு நாளும் ஒன்றைத் தொட்டு நகர்கிறது; 27 நாளில் முழு சுற்றை முடிக்கிறது. நீங்கள் பிறந்த கணத்தில் சந்திரன் இருந்த நட்சத்திரமே உங்கள் பிறப்பு நட்சத்திரம். அது உங்கள் உள்ளுணர்வு, குணநிலை, வாழ்க்கை ஓட்டம் ஆகியவற்றின் நிலையான அடையாளம்."
  ),
  what_p2:       s(
    "Unlike the Sun sign, the birth star is a finer lens. It speaks more directly to emotional instincts, natural abilities, and the dasha rhythm active from birth.",
    "சூரிய ராசியை விட நட்சத்திரம் நுணுக்கமான பார்வை தரும். உங்கள் மனப் போக்கு, இயல்பான திறன், பிறந்தபோதே தொடங்கும் தசை ஓட்டம் ஆகியவற்றை இது தெளிவாகச் சொல்கிறது. இங்கே உள்ள பலன்கள் பொதுவானவை; தனிப்பட்ட ஜாதகம் இன்னும் துல்லியமான வாசிப்பை தரும்."
  ),
  what_cta:      s("Find Your Birth Star →", "உங்கள் நட்சத்திரத்தை அறியவும் →"),
};

export const NATCHATHIRAM_DETAIL = {
  eyebrow_prefix:    s("27 Nakshathirams", "27 நட்சத்திரங்கள்"),
  lead:              s(
    "General birth-star tendencies for personality, career strengths, family dynamics, dasha themes, and spiritual guidance. Your exact lagna, Moon degree, and dasha balance refine the reading.",
    "குணநிலை, தொழில் பலம், குடும்ப ஓட்டம், தசை கருக்கள், ஆன்மீக வழிகாட்டுதல் பற்றிய பொதுப் பிறப்பு நட்சத்திரப் பார்வை. உங்கள் துல்லியமான லக்னம், சந்திரன் degree, தசை இருப்பு வாசிப்பை மேலும் நுணுக்கமாக்கும்."
  ),
  fig_label_suffix:  s("Nakshathiram profile", "நட்சத்திர விவரம்"),
  // Fact card labels
  fact_rasi:         s("Rasi (Sign)",   "ராசி"),
  fact_planet:       s("Ruling Planet", "அதிபதி கிரகம்"),
  fact_deity:        s("Deity / Worship Form", "தெய்வம் / வழிபாட்டு வடிவு"),
  fact_gana:         s("Gana",          "கணம்"),
  fact_symbol:       s("Symbol",        "சின்னம்"),
  fact_dasha:        s("Birth Dasha",   "பிறப்பு தசை"),
  // Section headings (English translations of the fixed Tamil headings in data)
  sec_personality:   s("Personality Traits",    "குண நலன்கள்"),
  sec_career:        s("Career & Abilities",     "தொழில் மற்றும் திறன்கள்"),
  sec_modern_pre:    s("In Today's World ·",     "இன்றைய காலத்தில் ·"),
  sec_family:        s("Family & Relationships", "குடும்பம் மற்றும் உறவுகள்"),
  sec_dasha:         s("Dasha Periods",          "தசை பலன்கள்"),
  sec_spiritual:     s("Spirituality & Worship", "ஆன்மீகம் மற்றும் வழிபாடு"),
  sec_summary:       s("Key Guidance",           "முக்கியமான வழிகாட்டுதல்"),
  // Notes
  modern_note:       s(
    "Computers didn't exist a century ago. Analytics didn't exist 20 years ago. AI agents didn't exist 5 years ago. See how traditional birth-star traits express themselves for today's generation.",
    "100 ஆண்டுகளுக்கு முன் கணினி இல்லை. 20 ஆண்டுகளுக்கு முன் analytics இல்லை. 5 ஆண்டுகளுக்கு முன் AI agents இல்லை. இன்றைய தலைமுறைக்கு பாரம்பரிய குண நலன்கள் எப்படி வெளிப்படுகின்றன என்று பாருங்கள்."
  ),
  dasha_note_pre:    s(
    "Note: Dasha timelines shift based on the exact pada and degree at birth.",
    "குறிப்பு: தசை காலங்கள் பாதம் மற்றும் டிகிரியை பொறுத்து மாறும்."
  ),
  dasha_note_link:   s("Generate your jathagam", "ஜாதகம் உருவாக்கவும்"),
  dasha_note_post:   s("for precise personal dasha dates.", "தனிப்பட்ட தசை காலங்களை அறிய."),
  // Compatible nakshatras
  compat_h2:         s("Compatible Nakshathirams",             "சாதகமான நட்சத்திரங்கள்"),
  compat_desc_pre:   s("Nakshathirams that usually blend well with", "இந்த நட்சத்திரத்துடன் பொதுவாக நன்றாக ஒத்துச் செல்லும் நட்சத்திரங்கள்:"),
  compat_link:       s("Check marriage compatibility →",       "திருமணப் பொருத்தம் பார்க்க →"),
  porutham_cta:      s("Porutham Calculator",                  "பொருத்தம் கணிப்பான்"),
  // CTA
  cta_h2:            s("Read Your Full Birth Chart",           "உங்கள் ஜாதகம் பாருங்கள்"),
  cta_body:          s(
    "This profile covers general tendencies. Your lagna, planetary positions, and personal dasha timeline give the precise, complete picture.",
    "இந்த நட்சத்திரத்தின் பொதுப் பலன்கள் இங்கே தரப்பட்டுள்ளன. உங்கள் லக்னம், கிரக நிலைகள் மற்றும் தனிப்பட்ட தசை காலங்களுக்கு உங்கள் ஜாதகத்தை உருவாக்கவும்."
  ),
  cta_btn_primary:   s("Generate Free Jathagam →", "இலவச ஜாதகம் உருவாக்கவும்"),
  cta_btn_ghost:     s("All 27 Nakshathirams",      "அனைத்து நட்சத்திரங்கள்"),
  // Prev / Next
  nav_prev:          s("← Previous", "← முந்தைய"),
  nav_next:          s("Next →",     "அடுத்த →"),
  // Related
  related_h2:        s("Learn More",                        "மேலும் அறிக"),
  rel_thirukanitham: s("What is Thirukanitham? →",          "திருக்கணிதம் என்றால் என்ன? →"),
  rel_porutham:      s("What is Porutham? →",               "பொருத்தம் என்றால் என்ன? →"),
  rel_chandrashtama: s("What is Chandrashtama? →",          "சந்திராஷ்டமம் என்றால் என்ன? →"),
  rel_all:           s("All 27 Nakshathirams →",            "27 நட்சத்திரங்கள் முழு பட்டியல் →"),
};

// ─── NAKSHATRA VISUAL PAGE ───────────────────────────────────────────────────

export const NATCHATHIRAM_VISUAL = {
  mode_label:       s("Visual Profile",        "காட்சி விவரம்"),
  read_text:        s("Read Text Version",     "உரை பதிப்பு படிக்க"),
  at_a_glance:      s("AT A GLANCE",           "ஒரு பார்வையில்"),
  natch_profile:    s("NAKSHATHIRAM PROFILE",  "நட்சத்திர விவரம்"),
  better_star:      s("BETTER STAR",           "உங்கள் நட்சத்திரம்"),
  rasi_label:       s("RASI",                  "ராசி"),
  personality:      s("Personality Snapshot",  "ஆளுமை சுருக்கம்"),
  core_strengths:   s("Core Strengths",        "முக்கிய பலங்கள்"),
  career_clusters:  s("Best Career Clusters",  "சிறந்த தொழில் துறைகள்"),
  modern_title:     s("In Today's World — Applications", "இன்றைய உலகில் — பயன்பாடுகள்"),
  dasha_lead:       s(
    "These are general dasha themes for the birth star. Exact personal dates and strength depend on the Moon's degree, pada, and full horoscope.",
    "இவை பிறப்பு நட்சத்திரத்துக்கான பொதுத் தசை கருக்கள். துல்லியமான தனிப்பட்ட தேதிகளும் பலமும் சந்திரன் degree, பாதம், முழு ஜாதகம் ஆகியவற்றைப் பொறுத்தது."
  ),
  compat_lead:      s(
    "General birth-star affinities. Marriage porutham should still be confirmed with both full horoscopes.",
    "பொதுவான பிறப்பு நட்சத்திர ஒத்திசைவுகள். திருமணப் பொருத்தம் இருவரின் முழு ஜாதகத்தாலும் உறுதி செய்யப்பட வேண்டும்."
  ),
  check_compat:     s("Check Compatibility →",        "பொருத்தம் பார்க்க →"),
  key_guidance:     s("KEY GUIDANCE",                 "முக்கிய வழிகாட்டுதல்"),
  cta_eyebrow:      s("READ YOUR FULL BIRTH CHART",   "உங்கள் ஜாதகம் பாருங்கள்"),
  cta_title:        s("This Profile is Just the Beginning", "இந்த விவரம் ஒரு தொடக்கம் மட்டுமே"),
  want_full:        s("Want the full in-depth written analysis?", "முழு விவர விளக்கம் வேண்டுமா?"),
  read_detailed:    s("Read the detailed guide for {name} Nakshathiram →", "{name} நட்சத்திரத்தின் விரிவான விளக்கம் →"),
  nudge_want:       s("Want full written analysis?",    "முழு விவர விளக்கம் வேண்டுமா?"),
  nudge_read:       s("Read the detailed guide for {name} →", "{name}-க்கான விரிவான வழிகாட்டியை படிக்க →"),
  rel_you:          s("You",         "நீங்கள்"),
  rel_partners:     s("Partners",    "துணை"),
  rel_friends:      s("Friends",     "நண்பர்கள்"),
  rel_family:       s("Family",      "குடும்பம்"),
  rel_mentors:      s("Mentors",     "வழிகாட்டிகள்"),
  rel_community:    s("Community",   "சமூகம்"),
};

// ─── PRIVACY / TERMS ────────────────────────────────────────────────────────

export const LEGAL = {
  privacy_h1: s("Privacy Policy",    "தனியுரிமைக் கொள்கை"),
  terms_h1:   s("Terms of Service",  "பயன்பாட்டு விதிகள்"),
};
