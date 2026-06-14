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

  // Jothidam Guide dropdown
  guide:               s("Jothidam Guide",      "ஜோதிட வழிகாட்டி"),
  guide_dosham:        s("Dosham",              "தோஷம்"),
  guide_dosham_desc:   s("Meaning, calculation & pariharam", "பொருள், கணக்கீடு & பரிகாரம்"),
  guide_yogam:         s("Yogam",               "யோகம்"),
  guide_yogam_desc:    s("Auspicious combinations & their benefits", "சுப சேர்க்கைகளும் பலன்களும்"),
  guide_pariharam:     s("Pariharam",           "பரிகாரம்"),
  guide_pariharam_desc: s("Remedies & slokams for life's difficulties", "வாழ்க்கை சிக்கல்களுக்கான பரிகாரமும் ஸ்லோகமும்"),
  guide_temples:       s("Temples",             "கோயில்கள்"),
  guide_temples_desc:  s("Powerful temples & their blessings", "சக்தி வாய்ந்த கோயில்களும் அருளும்"),
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
  col_guide:    s("Jothidam Guide", "ஜோதிட வழிகாட்டி"),
  col_company:  s("Company",   "நிறுவனம்"),

  guide_dosham:    s("Dosham",          "தோஷம்"),
  guide_yogam:     s("Yogam",           "யோகம்"),
  guide_pariharam: s("Pariharam",       "பரிகாரம்"),
  guide_temples:   s("Temples",         "கோயில்கள்"),

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

// ─── SHARED FAITH NOTE (devotional pages) ─────────────────────────────────────

export const FAITH_NOTE = s(
  "Pariharam and worship are matters of faith and tradition handed down through generations. Practise them with devotion (bhakti) and a calm mind. They are not a substitute for medical, legal, or financial advice.",
  "பரிகாரமும் வழிபாடும் தலைமுறை தலைமுறையாக வந்த நம்பிக்கையும் பாரம்பரியமும் சார்ந்தவை. பக்தியோடும் அமைதியான மனதோடும் செய்யுங்கள். இவை மருத்துவ, சட்ட அல்லது நிதி ஆலோசனைக்கு மாற்றல்ல."
);

// ─── DOSHAM / YOGAM ───────────────────────────────────────────────────────────

export const DOSHAM_INDEX = {
  eyebrow:  s("Jothidam Guide · Dosham", "ஜோதிட வழிகாட்டி · தோஷம்"),
  h1:       s("Doshams in your chart", "உங்கள் ஜாதகத்தில் தோஷங்கள்"),
  lead:     s(
    "A dosham is a planetary placement that asks for awareness and care — not a fixed verdict on your life. Each guide explains what the dosham means, how it is calculated in Thirukanitham, what it can express depending on house, aspect and dasha, and the traditional pariharam.",
    "தோஷம் என்பது கவனமும் பராமரிப்பும் கேட்கும் ஒரு கிரக நிலை — உங்கள் வாழ்க்கையின் மாறாத தீர்ப்பு அல்ல. ஒவ்வொரு வழிகாட்டியும் தோஷத்தின் பொருள், திருக்கணிதத்தில் அது எப்படிக் கணக்கிடப்படுகிறது, பாவம்–பார்வை–தசையைப் பொறுத்து எப்படி வெளிப்படலாம், பாரம்பரிய பரிகாரம் ஆகியவற்றை விளக்குகிறது."
  ),
  list_h2: s("Common Doshams", "முக்கிய தோஷங்கள்"),
  upcoming_note: s("Detailed guide coming soon", "விரிவான வழிகாட்டி விரைவில்"),
  what_h2:  s("A calm view of dosham", "தோஷம் — அமைதியான பார்வை"),
  what_p1:  s(
    "In classical jyotish, no single placement decides a life. A dosham marks an area that benefits from awareness and care; how strongly it expresses depends on the house it falls in, the aspects it receives, the planet's strength, and the running dasha and transit.",
    "பாரம்பரிய ஜோதிடத்தில் ஒரே ஒரு கிரக நிலை வாழ்க்கையை முடிவு செய்வதில்லை. தோஷம் கவனமும் பராமரிப்பும் பயன்தரும் ஒரு பகுதியைக் குறிக்கிறது; அது எவ்வளவு வலுவாக வெளிப்படுகிறது என்பது அது விழும் பாவம், வரும் பார்வைகள், கிரகத்தின் பலம், நடக்கும் தசை–கோச்சாரத்தைப் பொறுத்தது."
  ),
  what_p2:  s(
    "Cancellations (parihara yoga) often reduce a dosham, and a 'low' dosham can balance out against a matched chart. The steady approach is to understand it clearly, then act with devotion and patience rather than fear.",
    "பல சமயங்களில் பரிகார யோகங்கள் தோஷத்தைக் குறைக்கின்றன; 'குறைந்த' தோஷம் பொருந்தும் ஜாதகத்தோடு சமன் ஆகலாம். நிதானமான அணுகுமுறை: தெளிவாகப் புரிந்துகொண்டு, பயத்துக்குப் பதிலாக பக்தியோடும் பொறுமையோடும் செயல்படுவது."
  ),
  cta:      s("Generate your jadhagam to check →", "சரிபார்க்க உங்கள் ஜாதகம் உருவாக்குங்கள் →"),
};

export const YOGAM_INDEX = {
  eyebrow:  s("Jothidam Guide · Yogam", "ஜோதிட வழிகாட்டி · யோகம்"),
  h1:       s("Yogams in your chart", "உங்கள் ஜாதகத்தில் யோகங்கள்"),
  lead:     s(
    "A yogam is a fortunate planetary combination that lifts a chart — strengthening wealth, wisdom, status or relationships. Each guide explains the formula, what the yogam can bring, when it activates through dasha, and what makes it strong or weak.",
    "யோகம் என்பது ஜாதகத்தை உயர்த்தும் நல்ல கிரகச் சேர்க்கை — செல்வம், ஞானம், அந்தஸ்து அல்லது உறவுகளை வலுப்படுத்துவது. ஒவ்வொரு வழிகாட்டியும் அதன் சூத்திரம், யோகம் தரக்கூடியவை, தசை வழியாக எப்போது செயல்படுகிறது, எது அதை வலுவாக்குகிறது அல்லது பலவீனப்படுத்துகிறது என்பதை விளக்குகிறது."
  ),
  list_h2: s("Auspicious Yogams", "சுப யோகங்கள்"),
  upcoming_note: s("Detailed guide coming soon", "விரிவான வழிகாட்டி விரைவில்"),
  what_h2:  s("How a yogam strengthens a chart", "யோகம் ஜாதகத்தை எப்படி வலுப்படுத்துகிறது"),
  what_p1:  s(
    "A yogam describes where a chart carries natural grace. Its benefit is not automatic — it depends on the strength of the planets involved, the houses they own, and whether its dasha or bhukti is active during the relevant years of life.",
    "யோகம் ஜாதகத்தில் இயல்பான அருள் எங்கே உள்ளது என்பதைச் சொல்கிறது. அதன் பலன் தானாக வராது — அதில் ஈடுபட்ட கிரகங்களின் பலம், அவை ஆளும் பாவங்கள், அந்த ஆண்டுகளில் அதன் தசை அல்லது புக்தி செயல்படுகிறதா என்பதைப் பொறுத்தது."
  ),
  what_p2:  s(
    "A strong yogam can soften the difficulty of a dosham elsewhere in the chart. Reading both together — calmly, without exaggeration — gives the truest picture.",
    "வலுவான யோகம் ஜாதகத்தின் வேறு இடத்தில் உள்ள தோஷத்தின் சிரமத்தை மென்மையாக்க முடியும். இரண்டையும் சேர்த்து — மிகைப்படுத்தாமல், அமைதியாக — படிப்பதே மிகச் சரியான படத்தைத் தரும்."
  ),
  cta:      s("Generate your jadhagam to check →", "சரிபார்க்க உங்கள் ஜாதகம் உருவாக்குங்கள் →"),
};

export const DOSHAM_SEVVAI = {
  eyebrow:  s("Dosham · Sevvai (Mangal) Dosham", "தோஷம் · செவ்வாய் தோஷம்"),
  h1:       s("Sevvai Dosham (Mangal / Chevvai Dosham)", "செவ்வாய் தோஷம் (மங்கள் தோஷம்)"),
  lead:     s(
    "Sevvai dosham — also called Mangal dosha, Kuja dosha, or 'Manglik' — forms when Mars sits in certain houses of the birth chart. It is examined most closely for marriage matching. Here is what it truly means, how it is calculated, and the traditional pariharam.",
    "செவ்வாய் தோஷம் — மங்கள் தோஷம், குஜ தோஷம் என்றும் அழைக்கப்படுவது — ஜாதகத்தில் சில குறிப்பிட்ட பாவங்களில் செவ்வாய் அமரும்போது உருவாகிறது. திருமணப் பொருத்தத்தில் இது மிகக் கூர்ந்து பார்க்கப்படுகிறது. அதன் உண்மையான பொருள், கணக்கீட்டு முறை, பாரம்பரிய பரிகாரம் இங்கே."
  ),
  what_h2:   s("What Sevvai dosham means", "செவ்வாய் தோஷம் என்றால் என்ன"),
  what_body: s(
    "Mars (Chevvai / Mangal) is the planet of energy, courage, and drive. When it occupies a sensitive house relative to marriage and partnership, its fiery nature is said to bring friction, impatience, or delay into married life if unbalanced. The dosham is about managing this intensity — not a verdict against marriage.",
    "செவ்வாய் (மங்கள்) ஆற்றல், தைரியம், உந்துதல் ஆகியவற்றின் கிரகம். திருமணம், வாழ்க்கைத் துணை தொடர்பான உணர்வுப்பூர்வமான பாவத்தில் அது அமரும்போது, சமநிலை இல்லாவிட்டால் அதன் தீ குணம் தாம்பத்திய வாழ்வில் உராய்வு, பொறுமையின்மை அல்லது தாமதத்தைக் கொண்டுவருவதாகச் சொல்லப்படுகிறது. தோஷம் என்பது இந்த தீவிரத்தை சமாளிப்பது பற்றியது — திருமணத்துக்கு எதிரான தீர்ப்பு அல்ல."
  ),
  calc_h2:   s("How Sevvai dosham is calculated", "செவ்வாய் தோஷம் எப்படி கணக்கிடப்படுகிறது"),
  calc_body: s(
    "Sevvai dosham is present when Mars occupies the 1st, 2nd, 4th, 7th, 8th, or 12th house — counted from three reference points: the Lagna (ascendant), the Moon sign, and Venus (Sukran). The 7th house rules marriage, the 8th longevity of the union, the 2nd the family, and the 12th the bedroom; the 1st and 4th affect temperament and domestic peace. Strength depends on the sign Mars sits in and the aspects it receives.",
    "செவ்வாய் 1, 2, 4, 7, 8 அல்லது 12-ஆம் பாவத்தில் அமரும்போது செவ்வாய் தோஷம் ஏற்படுகிறது — இது மூன்று இடங்களிலிருந்து எண்ணப்படுகிறது: லக்னம், சந்திர ராசி, சுக்கிரன். 7-ஆம் பாவம் திருமணம், 8-ஆம் பாவம் தாம்பத்திய ஆயுள், 2-ஆம் பாவம் குடும்பம், 12-ஆம் பாவம் படுக்கையறை; 1, 4-ஆம் பாவங்கள் குணத்தையும் வீட்டின் அமைதியையும் பாதிக்கின்றன. செவ்வாய் இருக்கும் ராசியும் அதற்கு வரும் பார்வைகளும் வலிமையை நிர்ணயிக்கின்றன."
  ),
  brings_h2: s("What Sevvai dosham can bring", "செவ்வாய் தோஷம் என்ன கொண்டு வரலாம்"),
  brings_intro: s(
    "These are tendencies shaped by Mars's placement — not certainties. Mars is the planet of fire, drive, and decisiveness; when it presses on marriage-sensitive houses, these qualities can run out of balance. Knowing the pattern helps you work with it rather than be caught off guard.",
    "இவை செவ்வாயின் நிலையால் உருவாகும் போக்குகள் — நிச்சயங்கள் அல்ல. செவ்வாய் நெருப்பு, உந்துதல், உறுதியான முடிவுகளின் கிரகம்; திருமண பாவங்களில் அழுத்தும்போது இந்தக் குணங்கள் சமநிலையற்றதாக மாறலாம். போக்கை அறிவது அதிர்ச்சியின்றி அதனோடு செயல்பட உதவுகிறது."
  ),
  brings_categories: [
    {
      heading: s("Psychological & Emotional", "உளவியல் மற்றும் உணர்வு"),
      items: [
        s("Quick to react, slow to reflect — the Mars impulse fires before patience catches up.", "விரைவாக எதிர்வினையாற்றுவது, மெதுவாக சிந்திப்பது — பொறுமை பிடிக்கும் முன்பே செவ்வாய் உந்துதல் கிளம்பும்."),
        s("A short fuse in arguments; finds it hard to back down even when wrong.", "விவாதங்களில் சீக்கிரம் கோபப்படுவது; தவறாக இருந்தாலும் பின்வாங்குவது கடினமாக இருக்கும்."),
        s("Restlessness in close relationships — difficulty with the slow pace of domestic life.", "நெருங்கிய உறவுகளில் ஓய்வின்மை — வீட்டு வாழ்க்கையின் நிதானமான வேகத்தோடு பொருந்துவதில் சிரமம்."),
        s("Deep loyalty and intensity — the same fire that causes conflict also drives fierce protectiveness.", "ஆழமான விசுவாசம் மற்றும் தீவிரம் — மோதலை ஏற்படுத்தும் அதே நெருப்பு கடும் பாதுகாப்பையும் தரும்."),
        s("Emotions held in until they erupt — then calm returns, but the damage lingers.", "உணர்வுகள் வெடிக்கும் வரை அடக்கி வைக்கப்படும் — பிறகு அமைதி திரும்பும், ஆனால் தாக்கம் நீடிக்கும்."),
      ],
    },
    {
      heading: s("Career & Finance", "தொழில் மற்றும் பொருளாதாரம்"),
      items: [
        s("Bold and fast-moving at work — which brings results but also overshoots.", "தொழிலில் தைரியமாகவும் வேகமாகவும் செயல்படுவது — பலனும் தரும், அதிகமாகவும் போகும்."),
        s("Friction with authority figures or colleagues — Mars does not subordinate easily.", "அதிகாரிகள் அல்லது சக ஊழியர்களுடன் உராய்வு — செவ்வாய் எளிதாக கீழ்படிவதில்லை."),
        s("Disputes over land, property, or inheritance — Mars rules immovable assets in Tamil astrology.", "நிலம், சொத்து அல்லது மரபுரிமை சம்பந்தமான சர்ச்சைகள் — தமிழ் ஜோதிடத்தில் செவ்வாய் நிலையான சொத்தை ஆளுகிறது."),
        s("Impulsive financial decisions — especially during Mars dasha or when under pressure.", "உந்துதலில் எடுக்கப்படும் நிதி முடிவுகள் — குறிப்பாக செவ்வாய் தசையில் அல்லது அழுத்தத்தில் இருக்கும்போது."),
        s("Strong natural fit for medicine, engineering, defence, or law — fields that reward Mars energy.", "மருத்துவம், பொறியியல், தற்காப்பு, சட்டம் போன்றவற்றில் இயற்கையான திறன் — செவ்வாய் ஆற்றலை வெகுமதியாக தரும் துறைகள்."),
      ],
    },
    {
      heading: s("Relationship, Marriage & Family", "உறவு, திருமணம் மற்றும் குடும்பம்"),
      items: [
        s("Friction in early marriage — the intensity needs time and maturity to settle into steadiness.", "திருமண ஆரம்பத்தில் உராய்வு — தீவிரம் நிலைத்த அமைதியாக மாற நேரமும் முதிர்ச்சியும் தேவை."),
        s("When the dosham is strong from multiple reference points, finding a well-matched partner takes longer.", "தோஷம் பல இடங்களிலிருந்து வலிமையாக இருக்கும்போது, பொருத்தமான துணையை கண்டுபிடிக்க அதிக நேரம் ஆகும்."),
        s("Mars in the 2nd house can bring friction in family speech and finances; in the 8th, emotional distance in patches; in the 12th, phases of physical separation.", "2-ஆம் பாவத்தில் செவ்வாய் குடும்பத்தில் வார்த்தை மற்றும் நிதி உராய்வை தரலாம்; 8-ஆம் பாவத்தில் இடையிடையே உணர்வு தூரம்; 12-ஆம் பாவத்தில் உடல் ரீதியான பிரிவு காலங்கள்."),
        s("Temperament clashes with spouse — the 'fire meets fire' dynamic, especially when both have strong Mars.", "துணையுடன் குணம் மோதல் — குறிப்பாக இருவரும் வலிமையான செவ்வாய் கொண்டிருக்கும்போது 'நெருப்பும் நெருப்பும்' சந்திக்கும் நிலை."),
        s("Once channeled, the same Mars gives fierce loyalty, protection, and passion in marriage — the dosham is the intensity, not the verdict.", "சரியாக திசைப்படுத்தப்பட்டவுடன், அதே செவ்வாய் திருமணத்தில் கடும் விசுவாசம், பாதுகாப்பு, ஆர்வத்தை தரும் — தோஷம் என்பது தீவிரமே தவிர தீர்ப்பல்ல."),
      ],
    },
  ],
  howtoread_h2: s("How to read your own chart for Sevvai dosham", "உங்கள் ஜாதகத்தில் செவ்வாய் தோஷம் எப்படி பார்ப்பது"),
  howtoread_intro: s(
    "Open your Thirukanitham jadhagam and note three things: where Mars (Sevvai / Angaraka) sits, your Lagna (ascendant), and your Janma Rasi (Moon's sign). Tradition measures the dosham from all three as reference points — not from Lagna alone.",
    "உங்கள் திருகணித ஜாதகத்தை எடுத்து மூன்று விஷயங்களை கவனியுங்கள்: செவ்வாய் (அங்காரகன்) எங்கே இருக்கிறார், உங்கள் லக்னம், உங்கள் ஜென்ம ராசி (சந்திரன் இருக்கும் ராசி). பாரம்பரியம் தோஷத்தை இந்த மூன்றையும் தொடக்கப் புள்ளிகளாக வைத்து அளக்கிறது — லக்னத்தை மட்டுமல்ல."
  ),
  howtoread_steps: [
    {
      h: s("1 — Locate Mars in the rasi chart", "1 — ராசி ஜாதகத்தில் செவ்வாயை கண்டறியுங்கள்"),
      b: s(
        "Find the symbol for Sevvai (Mars / Angaraka) in the square south Indian chart. Count clockwise from your Lagna box to see which house number it occupies.",
        "தென்னிந்திய சதுர ஜாதகத்தில் செவ்வாய் (அங்காரகன்) குறியீட்டைக் கண்டுபிடியுங்கள். உங்கள் லக்னப் பெட்டியிலிருந்து கடிகார திசையில் எண்ணி அது எந்தப் பாவத்தில் அமர்ந்திருக்கிறது என்று குறிக்கவும்."
      ),
    },
    {
      h: s("2 — Count from three reference points", "2 — மூன்று இடங்களிலிருந்து எண்ணுங்கள்"),
      b: s(
        "In Thirukanitham reading, Mars's house is counted from three positions: from Lagna, from your Janma Rasi (Moon's house), and from Venus (Sukra's house). If Mars falls in house 1, 2, 4, 7, 8, or 12 counted from any of those three points, dosham is present for that reference. One reference showing dosham → mild. Two → moderate. All three → strong.",
        "திருகணித வாசிப்பில் செவ்வாயின் இடம் மூன்று இடங்களிலிருந்து எண்ணப்படுகிறது: லக்னம், ஜென்ம ராசி (சந்திரன் இருக்கும் பாவம்), சுக்கிரன் இருக்கும் பாவம். அந்த மூன்றிலிருந்தும் எண்ணும்போது செவ்வாய் 1, 2, 4, 7, 8 அல்லது 12-ஆம் பாவத்தில் விழுந்தால் அந்த இடத்திலிருந்து தோஷம் காட்டுகிறது. ஒரு இடத்தில் → லேசான தோஷம். இரண்டு இடங்களில் → மிதமான தோஷம். மூன்றிலும் → வலுவான தோஷம்."
      ),
    },
    {
      h: s("3 — Note the sign Mars occupies", "3 — செவ்வாய் இருக்கும் ராசியை கவனியுங்கள்"),
      b: s(
        "The sign changes severity. In own signs Mesham (Aries) or Vrischikam (Scorpio), Mars is at full strength — some classical texts also treat this as a partial cancellation. In Makaram (Capricorn, exaltation) it is strongest. In Kadagam (Cancer, debilitation) Mars is weakened and the dosham is milder. Benefic company or a friendly sign softens it further.",
        "ராசி தீவிரத்தை பாதிக்கிறது. சொந்த ராசிகளான மேஷம் (Aries) அல்லது விருச்சிகத்தில் (Scorpio) செவ்வாய் முழு பலத்துடன் இருக்கும் — சில சாஸ்திர நூல்கள் இதை பகுதி ரத்தாகவும் பார்க்கின்றன. மகரத்தில் (Capricorn — உச்சம்) மிகவும் பலமாக இருக்கும். கடகத்தில் (Cancer — நீசம்) செவ்வாய் பலமிழக்கும்; தோஷமும் மிதமாகும். சுப கிரக சேர்க்கையில் அல்லது நட்பு ராசியில் இருந்தால் வலிமை மேலும் குறையும்."
      ),
    },
    {
      h: s("4 — Check the standard cancellations (parihara bhanga)", "4 — வழக்கமான ரத்து நிலைகளை சரிபாருங்கள் (பரிகார பங்க)"),
      b: s(
        "Before accepting the dosham label, check these recognised cancellations: Guru (Jupiter) aspects Mars in the chart — strong cancellation. Both partner charts carry Sevvai dosham — mutual cancellation. Mars is lord of the 7th or 2nd house — it becomes a marriage-house significator and its affliction softens. Mars sits in its own sign (Mesham, Vrischikam) — partial cancellation in most Thirukanitham readings. If any of these apply, the dosham is reduced or removed.",
        "தோஷம் என்ற முத்திரை ஒட்டுவதற்கு முன் இந்த அங்கீகரிக்கப்பட்ட ரத்து நிலைகளை சரிபாருங்கள்: குரு (Jupiter) ஜாதகத்தில் செவ்வாயை பார்த்தால் — வலுவான ரத்து. இரு ஜாதகங்களிலும் செவ்வாய் தோஷம் இருந்தால் — பரஸ்பர ரத்து. செவ்வாய் 7 அல்லது 2-ஆம் பாவ அதிபதியாக இருந்தால் — திருமண பாவ காரகனே ஆவதால் தாக்கம் மெலிகிறது. செவ்வாய் சொந்த ராசியில் (மேஷம், விருச்சிகம்) இருந்தால் — பெரும்பாலான திருகணித வாசிப்பில் பகுதி ரத்து. இவற்றில் ஏதாவது பொருந்தினால், தோஷம் குறைக்கப்படுகிறது அல்லது நீங்குகிறது."
      ),
    },
    {
      h: s("5 — Look at the running dasha", "5 — நடக்கும் தசையை பாருங்கள்"),
      b: s(
        "A dosham in the chart does not press equally at every stage of life. Its pull on marriage is felt most during Mars mahadasha (the 7-year Mars period) or a Mars antardasha within another dasha. If you are in Venus dasha and Mars afflicts Venus in your chart, marriage timing comes into focus then. Outside those periods the same placement may pass quietly. This is why Thirukanitham reading always checks dasha alongside placement.",
        "ஜாதகத்தில் தோஷம் இருந்தாலும் எல்லா காலத்திலும் சம அளவில் அழுத்தம் கொடுக்காது. திருமணத்தில் அதன் இழுப்பு மிகவும் உணரப்படுவது செவ்வாய் மஹாதசையில் (7 ஆண்டு செவ்வாய் கால) அல்லது வேறொரு தசையில் செவ்வாய் அந்தர்தசையிலேயே. சுக்கிர தசையில் இருக்கும்போது ஜாதகத்தில் செவ்வாய் சுக்கிரனை பாதிக்கிறது என்றால், திருமண காலம் அப்போது கவனத்துக்கு வரும். அந்தக் காலங்களுக்கு வெளியே, அதே அமைப்பு அமைதியாகவும் கடந்து போகலாம். திருகணித வாசிப்பு எப்போதும் அமைப்புடன் தசையையும் சேர்த்துப் பார்க்கும் காரணம் இதுவே."
      ),
    },
  ],
  cancel_h2:  s("When the dosham is cancelled or reduced", "தோஷம் ரத்தாகும் அல்லது குறையும் நிலைகள்"),
  cancel_body: s(
    "Tradition lists many cancellations (parihara / bhanga yogas): Mars in its own sign or exaltation, both partners' charts carrying Mangal dosha, Mars aspected by Jupiter, or Mars in certain signs by age. A 'low' dosham in one chart matched with another can balance out entirely. This is why a full chart reading matters more than a single yes/no label.",
    "பாரம்பரியம் பல ரத்து நிலைகளை (பரிகார / பங்க யோகங்கள்) சொல்கிறது: செவ்வாய் தன் சொந்த ராசியில் அல்லது உச்சத்தில் இருப்பது, இரு ஜாதகங்களிலும் மங்கள் தோஷம் இருப்பது, குருவின் பார்வை செவ்வாயின் மீது இருப்பது, அல்லது வயதின் அடிப்படையில் சில ராசிகளில் செவ்வாய் இருப்பது. ஒரு ஜாதகத்தில் 'குறைந்த' தோஷம் மற்றொன்றோடு பொருந்தும்போது முழுமையாக சமன் ஆகலாம். ஒரே ஆம்/இல்லை முத்திரையை விட முழு ஜாதக வாசிப்பு ஏன் முக்கியம் என்பதற்கு இதுவே காரணம்."
  ),
  pariharam_h2:   s("Pariharam — softening its power", "பரிகாரம் — அதன் வலிமையை மென்மையாக்குதல்"),
  pariharam_body: s(
    "Devotees traditionally worship Lord Anjaneya (Hanuman) and Lord Subramanya for Mars-related relief, light a red or sesame-oil lamp on Tuesdays, observe a Tuesday fast, chant the Mangal mantra, and offer at the Vaitheeswaran Koil (the temple of the planet Sevvai). Charitable giving of red lentils (masoor dal) or red cloth is also recommended.",
    "செவ்வாய் தொடர்பான நிவாரணத்துக்கு பக்தர்கள் பாரம்பரியமாக ஆஞ்சநேயரையும் (அனுமன்) முருகப்பெருமானையும் வழிபடுகிறார்கள், செவ்வாய்க்கிழமைகளில் சிவப்பு அல்லது நல்லெண்ணெய் விளக்கேற்றுகிறார்கள், செவ்வாய் விரதம் இருக்கிறார்கள், மங்கள மந்திரம் ஜெபிக்கிறார்கள், செவ்வாய்க் கோயிலான வைத்தீஸ்வரன் கோயிலில் வழிபடுகிறார்கள். மைசூர் பருப்பு அல்லது சிவப்பு ஆடை தானம் செய்வதும் சிறந்தது."
  ),
  slokam_label:  s("Mangal (Sevvai) slokam", "மங்கள (செவ்வாய்) ஸ்லோகம்"),
  slokam_text:   s(
    "Dharani-garbha-sambhutam vidyut-kanti-samaprabham\nKumaram shakti-hastam cha mangalam pranamamyaham",
    "தரணீ கர்ப்ப ஸம்பூதம் வித்யுத் காந்தி ஸமப்ரபம்\nகுமாரம் சக்தி ஹஸ்தம் ச மங்களம் ப்ரணமாம்யஹம்"
  ),
  slokam_meaning: s(
    "I bow to Mangala (Mars) — born of the Earth, radiant like lightning, ever-youthful, holding the spear in his hand.",
    "பூமியின் மகனாய்த் தோன்றியவனே, மின்னல் போல் ஒளிர்பவனே, என்றும் இளமையானவனே, கையில் சக்தி வேலேந்தியவனே — மங்களனே, உன்னை வணங்குகிறேன்."
  ),
  related_h2: s("Related", "தொடர்புடையவை"),
};

// ─── PARIHARAM ─────────────────────────────────────────────────────────────────

export const PARIHARAM_INDEX = {
  eyebrow:  s("Jothidam Guide · Pariharam", "ஜோதிட வழிகாட்டி · பரிகாரம்"),
  h1:       s("Pariharam for life's difficulties", "வாழ்க்கைச் சிக்கல்களுக்கான பரிகாரம்"),
  lead:     s(
    "When a chart shows a difficult period, tradition offers pariharam — devotional remedies, slokams, fasts, and temple worship that steady the mind and invite grace. Each guide explains the astrological reason behind the difficulty and the remedy handed down for it.",
    "ஜாதகம் கடினமான காலத்தைக் காட்டும்போது, பாரம்பரியம் பரிகாரத்தை வழங்குகிறது — மனதை நிலைப்படுத்தி அருளை அழைக்கும் வழிபாட்டு பரிகாரம், ஸ்லோகம், விரதம், கோயில் வழிபாடு. ஒவ்வொரு வழிகாட்டியும் சிக்கலுக்குப் பின்னுள்ள ஜோதிடக் காரணத்தையும் அதற்காக வந்த பரிகாரத்தையும் விளக்குகிறது."
  ),
  byproblem_h2: s("Remedies by situation", "சூழ்நிலை வாரியான பரிகாரம்"),
  upcoming_note: s("Detailed guide coming soon", "விரிவான வழிகாட்டி விரைவில்"),
  what_h2:  s("How pariharam works", "பரிகாரம் எப்படி செயல்படுகிறது"),
  what_p1:  s(
    "Pariharam is not bargaining with fate. It is a disciplined act of devotion that calms the mind, builds patience, and aligns effort with the right time. The slokam focuses the heart; the fast builds discipline; the temple visit renews faith.",
    "பரிகாரம் என்பது விதியோடு பேரம் பேசுவதல்ல. அது மனதை அமைதிப்படுத்தி, பொறுமையை வளர்த்து, முயற்சியை சரியான நேரத்தோடு இணைக்கும் ஒழுக்கமான பக்திச் செயல். ஸ்லோகம் இதயத்தை ஒருமுகப்படுத்துகிறது; விரதம் ஒழுக்கத்தை வளர்க்கிறது; கோயில் வழிபாடு நம்பிக்கையைப் புதுப்பிக்கிறது."
  ),
  what_p2:  s(
    "The most effective pariharam is matched to your own chart — the planet and house causing the difficulty, and the running dasha. Use these guides to understand the tradition, and a personal reading to know which remedy fits you.",
    "மிகவும் பயனுள்ள பரிகாரம் உங்கள் சொந்த ஜாதகத்துக்கு ஏற்றது — சிக்கலை ஏற்படுத்தும் கிரகம், பாவம், நடக்கும் தசை ஆகியவற்றுக்கு ஏற்பவே. பாரம்பரியத்தைப் புரிந்துகொள்ள இந்த வழிகாட்டிகளையும், எந்தப் பரிகாரம் உங்களுக்குப் பொருந்தும் என்றறிய தனிப்பட்ட வாசிப்பையும் பயன்படுத்துங்கள்."
  ),
  cta:      s("Generate your jadhagam →", "உங்கள் ஜாதகம் உருவாக்குங்கள் →"),
};

export const PARIHARAM_MARRIAGE = {
  eyebrow:  s("Pariharam · Marriage Delay", "பரிகாரம் · திருமணத் தடை"),
  h1:       s("Pariharam for delayed marriage (Thirumana Thadai)", "திருமணத் தடைக்கான பரிகாரம்"),
  lead:     s(
    "When marriage is delayed despite sincere effort, the chart often points to the 7th house, Venus, Jupiter, or the influence of Mars, Saturn, or Rahu. Here is why the delay shows up — and the devotional pariharam traditionally offered for a timely, happy marriage.",
    "உண்மையான முயற்சி இருந்தும் திருமணம் தாமதமாகும்போது, ஜாதகம் பெரும்பாலும் 7-ஆம் பாவம், சுக்கிரன், குரு அல்லது செவ்வாய், சனி, ராகுவின் தாக்கத்தைச் சுட்டிக்காட்டுகிறது. தாமதம் ஏன் வருகிறது — சரியான நேரத்தில் மகிழ்ச்சியான திருமணத்துக்காக பாரம்பரியமாக வழங்கப்படும் வழிபாட்டு பரிகாரம் இங்கே."
  ),
  why_h2:   s("Why marriage gets delayed — the astrological reasons", "திருமணம் ஏன் தாமதமாகிறது — ஜோதிடக் காரணங்கள்"),
  why_body: s(
    "The 7th house and its lord govern marriage; Venus signifies the spouse for men and Jupiter for women. Delay is commonly linked to an afflicted 7th lord, Saturn aspecting the 7th (slowing but stabilising), Sevvai dosham, Rahu-Ketu on the marriage axis, or a weak Venus/Jupiter. The running dasha also decides when marriage 'opens'.",
    "7-ஆம் பாவமும் அதன் அதிபதியும் திருமணத்தை ஆளுகின்றன; ஆண்களுக்கு சுக்கிரன், பெண்களுக்கு குரு துணையைக் குறிக்கின்றனர். தாமதம் பொதுவாக பாதிக்கப்பட்ட 7-ஆம் அதிபதி, 7-ஐப் பார்க்கும் சனி (தாமதப்படுத்தினாலும் நிலைப்படுத்துபவர்), செவ்வாய் தோஷம், திருமண அச்சில் ராகு-கேது, அல்லது பலவீனமான சுக்கிரன்/குரு ஆகியவற்றோடு தொடர்புடையது. திருமணம் எப்போது 'திறக்கும்' என்பதை நடக்கும் தசையும் தீர்மானிக்கிறது."
  ),
  remedy_h2:   s("The pariharam — step by step", "பரிகாரம் — படிப்படியாக"),
  remedy_intro: s(
    "Practise the following with devotion, ideally beginning on a Friday during the bright fortnight (Shukla paksha):",
    "பின்வருவனவற்றை பக்தியோடு செய்யுங்கள் — சிறந்தது வளர்பிறை (சுக்ல பக்ஷம்) வெள்ளிக்கிழமை தொடங்குவது:"
  ),
  step1_t: s("Worship Goddess Katyayani / Swayamvara Parvati", "கத்யாயனி / சுயம்வர பார்வதியை வழிபடுங்கள்"),
  step1_b: s(
    "Pray to the form of the Goddess who blesses a good marriage, lighting a ghee lamp before Her image each Friday.",
    "நல்ல திருமணத்தை அருளும் அம்பிகையின் வடிவத்தை வழிபடுங்கள்; ஒவ்வொரு வெள்ளிக்கிழமையும் அவள் படத்தின் முன் நெய் விளக்கேற்றுங்கள்."
  ),
  step2_t: s("Chant the marriage slokam 108 times", "திருமண ஸ்லோகத்தை 108 முறை ஜெபியுங்கள்"),
  step2_b: s(
    "Recite the Katyayani mantra (below) 108 times daily with a steady mind, ideally before a lit lamp.",
    "கத்யாயனி மந்திரத்தை (கீழே) நாள்தோறும் 108 முறை அமைதியான மனதோடு, ஏற்றிய விளக்கின் முன் ஜெபியுங்கள்."
  ),
  step3_t: s("Worship at Lord Shiva–Parvati temples", "சிவன்–பார்வதி கோயில்களில் வழிபடுங்கள்"),
  step3_b: s(
    "Visit temples where the Lord and Goddess are worshipped together; offer for an early, harmonious marriage. Thirumananjeri (near Mayiladuthurai) is the traditional 'marriage-blessing' temple.",
    "இறைவனும் அம்பிகையும் சேர்ந்து வழிபடப்படும் கோயில்களுக்குச் செல்லுங்கள்; விரைவான, இணக்கமான திருமணத்துக்காக வேண்டுங்கள். திருமணஞ்சேரி (மயிலாடுதுறை அருகே) பாரம்பரிய 'திருமண வரம்' அளிக்கும் கோயில்."
  ),
  step4_t: s("Strengthen Venus & Jupiter", "சுக்கிரன் & குருவை வலுப்படுத்துங்கள்"),
  step4_b: s(
    "Where the chart shows a weak Venus or Jupiter, donate white items (Venus) on Fridays and turmeric/yellow items (Jupiter) on Thursdays, and keep those days disciplined.",
    "ஜாதகத்தில் சுக்கிரன் அல்லது குரு பலவீனமாக இருந்தால், வெள்ளிக்கிழமை வெள்ளைப் பொருட்களையும் (சுக்கிரன்), வியாழக்கிழமை மஞ்சள்/மஞ்சள் நிறப் பொருட்களையும் (குரு) தானம் செய்யுங்கள்; அந்நாட்களை ஒழுக்கமாகக் கடைப்பிடியுங்கள்."
  ),
  slokam_label:  s("Katyayani marriage slokam", "கத்யாயனி திருமண ஸ்லோகம்"),
  slokam_text:   s(
    "Katyayani mahamaye mahayoginyadhishwari\nNanda-gopa-sutam devi patim me kuru te namah",
    "கத்யாயனி மஹாமாயே மஹாயோகின்யதீஶ்வரி\nநந்தகோப ஸுதம் தேவி பதிம் மே குரு தே நம꞉"
  ),
  slokam_meaning: s(
    "O Katyayani, great Maya, supreme mistress of yoga — Devi, grant me a good and worthy husband. Salutations to you. (Traditionally prayed for a good spouse; both seekers may pray for a worthy life-partner.)",
    "கத்யாயனியே, மஹாமாயையே, யோகத்தின் தலைவியே — தேவியே, எனக்கு நல்ல, தகுதியான துணையை அருள்வாயாக. உனக்கு வணக்கம். (பாரம்பரியமாக நல்ல துணைக்காக வேண்டப்படுவது; தகுதியான வாழ்க்கைத் துணைக்காக யாவரும் வேண்டலாம்.)"
  ),
  temple_h2:   s("Where to worship", "எங்கு வழிபடலாம்"),
  temple_body: s(
    "Thirumananjeri Kalyana Sundareswarar temple is the most sought temple for marriage delay; Tirupati and Lord Subramanya temples are also visited. If Sevvai or Rahu-Ketu is the cause, add the remedy for that planet as well.",
    "திருமண தாமதத்துக்கு திருமணஞ்சேரி கல்யாண சுந்தரேஸ்வரர் கோயில் மிகவும் நாடப்படும் கோயில்; திருப்பதி மற்றும் முருகன் கோயில்களும் வழிபடப்படுகின்றன. காரணம் செவ்வாய் அல்லது ராகு-கேது எனில், அந்தக் கிரகத்துக்கான பரிகாரத்தையும் சேர்த்துச் செய்யுங்கள்."
  ),
  related_h2: s("Related", "தொடர்புடையவை"),
};

// ─── TEMPLES ───────────────────────────────────────────────────────────────────

export const TEMPLE_INDEX = {
  eyebrow:  s("Jothidam Guide · Temples", "ஜோதிட வழிகாட்டி · கோயில்கள்"),
  h1:       s("Famous temples & their power", "புகழ்பெற்ற கோயில்களும் அவற்றின் சக்தியும்"),
  lead:     s(
    "Certain temples are sought for specific blessings — the nine Navagraha temples for planetary peace, Rahu-Ketu sthalams for serpent doshams, Vaitheeswaran Koil for health and Mars. Learn what each temple is known for, the deity worshipped, and which difficulty it traditionally addresses.",
    "சில கோயில்கள் குறிப்பிட்ட அருளுக்காக நாடப்படுகின்றன — கிரக சாந்திக்கு ஒன்பது நவகிரக கோயில்கள், சர்ப்ப தோஷங்களுக்கு ராகு-கேது தலங்கள், ஆரோக்கியத்துக்கும் செவ்வாய்க்கும் வைத்தீஸ்வரன் கோயில். ஒவ்வொரு கோயிலும் எதற்காக புகழ்பெற்றது, வழிபடப்படும் தெய்வம், எந்தச் சிக்கலை பாரம்பரியமாக நீக்குகிறது என்பதை அறியுங்கள்."
  ),
  navagraha_h2: s("Navagraha temples", "நவகிரக கோயில்கள்"),
  navagraha_desc: s(
    "Nine temples near Kumbakonam, each dedicated to one of the nine planets — visited for relief during difficult planetary periods (peyarchi) and dasha.",
    "கும்பகோணம் அருகே ஒன்பது கோயில்கள், ஒவ்வொன்றும் ஒரு கிரகத்துக்கு உரியது — கடினமான கிரக காலங்களிலும் (பெயர்ச்சி) தசையிலும் நிவாரணத்துக்கு வழிபடப்படுகின்றன."
  ),
  other_h2:  s("Other powerful sthalams", "மற்ற சக்தி வாய்ந்த தலங்கள்"),
  upcoming_note: s("Detailed guide coming soon", "விரிவான வழிகாட்டி விரைவில்"),
  what_h2:  s("Why temple worship is part of pariharam", "கோயில் வழிபாடு ஏன் பரிகாரத்தின் ஒரு பகுதி"),
  what_p1:  s(
    "A temple consecrated to a planet or deity is, in tradition, a focused field of that energy. Worshipping there during a difficult period is a way to steady the mind, surrender the worry, and renew faith — the inner shift that pariharam is really about.",
    "ஒரு கிரகத்துக்கோ தெய்வத்துக்கோ அர்ப்பணிக்கப்பட்ட கோயில், பாரம்பரியத்தில், அந்த ஆற்றலின் ஒருமுகப்படுத்தப்பட்ட களம். கடினமான காலத்தில் அங்கே வழிபடுவது மனதை நிலைப்படுத்தி, கவலையை சமர்ப்பித்து, நம்பிக்கையைப் புதுப்பிக்கும் வழி — பரிகாரத்தின் உண்மையான உள்மாற்றம் இதுவே."
  ),
  cta:      s("See which planet runs your dasha →", "உங்கள் தசையை ஆளும் கிரகத்தைப் பாருங்கள் →"),
};

export const TEMPLE_THIRUNALLAR = {
  eyebrow:  s("Temple · Thirunallar (Saniswaran)", "கோயில் · திருநள்ளாறு (சனீஸ்வரன்)"),
  h1:       s("Thirunallar Saniswaran Temple", "திருநள்ளாறு சனீஸ்வரன் கோயில்"),
  lead:     s(
    "Thirunallar, near Karaikal, is the most revered of the Navagraha temples — the abode of Saniswaran (Saturn). Lord Shiva is worshipped here as Dharbaranyeswarar. It is the temple millions visit for relief from the effects of Saturn, especially during Sani peyarchi and Ezharai Sani.",
    "காரைக்கால் அருகே உள்ள திருநள்ளாறு, நவகிரக கோயில்களில் மிகவும் போற்றப்படுவது — சனீஸ்வரனின் (சனி) தலம். இங்கே சிவபெருமான் தர்ப்பாரண்யேஸ்வரராக வழிபடப்படுகிறார். சனியின் தாக்கங்களிலிருந்து, குறிப்பாக சனி பெயர்ச்சி, ஏழரை சனி காலங்களில் நிவாரணம் தேட லட்சக்கணக்கானோர் வரும் கோயில் இது."
  ),
  about_h2:   s("The temple & its deity", "கோயிலும் அதன் தெய்வமும்"),
  about_body: s(
    "The presiding deity is Lord Shiva as Dharbaranyeswarar, with Saniswaran (Saturn) in his own powerful shrine. By legend, even Saturn could not afflict King Nala once he reached this kshetra — so the place is famed for releasing devotees from Saturn's grip. 'Thiru-nal-laru' itself means 'the sacred place of well-being'.",
    "மூலவர் சிவபெருமான் தர்ப்பாரண்யேஸ்வரராக; சனீஸ்வரன் (சனி) தனது சக்தி வாய்ந்த சந்நிதியில். புராணப்படி, நள மகாராஜன் இந்தத் தலத்தை அடைந்தவுடன் சனியால்கூட அவரைப் பீடிக்க முடியவில்லை — எனவே சனியின் பிடியிலிருந்து பக்தர்களை விடுவிப்பதில் இத்தலம் புகழ்பெற்றது. 'திரு-நல்-லாறு' என்றாலே 'நலம் தரும் புனிதத் தலம்' என்று பொருள்."
  ),
  power_h2:   s("What it is known for", "எதற்காக புகழ்பெற்றது"),
  power_body: s(
    "It is the foremost temple for Saturn-related relief: the seven-and-a-half-year Sani (Ezharai Sani), Ashtama Sani, Sani dasha/bhukti, and Sani peyarchi (Saturn's transit, every ~2.5 years). During Sani peyarchi, lakhs of devotees take a holy dip in the Nala Theertham and worship Saniswaran for a smoother transit.",
    "சனி தொடர்பான நிவாரணத்துக்கு முதன்மையான கோயில்: ஏழரை சனி, அஷ்டம சனி, சனி தசை/புக்தி, மற்றும் சனி பெயர்ச்சி (சுமார் 2.5 ஆண்டுகளுக்கு ஒருமுறை). சனி பெயர்ச்சியின்போது லட்சக்கணக்கான பக்தர்கள் நள தீர்த்தத்தில் புனித நீராடி, சுமூகமான பெயர்ச்சிக்காக சனீஸ்வரனை வழிபடுகிறார்கள்."
  ),
  when_h2:   s("When & how to worship", "எப்போது, எப்படி வழிபடுவது"),
  when_body: s(
    "Saturdays are most auspicious for Saturn; Sani peyarchi day draws the largest crowds. Devotees first bathe in the Nala Theertham, then worship Dharbaranyeswarar before Saniswaran. Lighting a sesame-oil (nallennai) lamp and offering black sesame and blue/black cloth are traditional.",
    "சனிக்கு சனிக்கிழமைகள் மிகவும் உகந்தவை; சனி பெயர்ச்சி நாளில் மிகப்பெரிய கூட்டம். பக்தர்கள் முதலில் நள தீர்த்தத்தில் நீராடி, பின்னர் சனீஸ்வரனை வழிபடுவதற்கு முன் தர்ப்பாரண்யேஸ்வரரை வழிபடுகிறார்கள். நல்லெண்ணெய் விளக்கேற்றுவதும், கருப்பு எள், நீலம்/கருப்பு ஆடை சமர்ப்பிப்பதும் பாரம்பரியம்."
  ),
  slokam_label:  s("Sani (Saturn) slokam", "சனி ஸ்லோகம்"),
  slokam_text:   s(
    "Nilanjana-samabhasam ravi-putram yamagrajam\nChaya-martanda-sambhutam tam namami shanaishcharam",
    "நீலாஞ்ஜன ஸமாபாஸம் ரவிபுத்ரம் யமாக்ரஜம்\nசாயா மார்த்தாண்ட ஸம்பூதம் தம் நமாமி சநைஶ்சரம்"
  ),
  slokam_meaning: s(
    "I bow to Shanaishchara (Saturn) — dark-hued like black collyrium, son of the Sun, elder brother of Yama, born of Chaya and the Sun.",
    "கருமை நிறம் கொண்டவனே, சூரியனின் மகனே, யமனின் மூத்த சகோதரனே, சாயா–சூரியனின் மைந்தனே — சனைஶ்சரனே, உன்னை வணங்குகிறேன்."
  ),
  related_h2: s("Related", "தொடர்புடையவை"),
};

// ─── FAQs (single source for visible FAQ + JSON-LD) ───────────────────────────
// Render the visible FAQ with mt(); build FAQPage JSON-LD from the .en strings so
// the structured data always matches on-page content (Google requirement).

export const FAQ_HEADING = s("Frequently asked questions", "அடிக்கடி கேட்கப்படும் கேள்விகள்");

export const DOSHAM_SEVVAI_FAQ = [
  {
    q: s("Can two people who both have Sevvai dosham marry each other?", "செவ்வாய் தோஷம் உள்ள இருவர் ஒருவரை ஒருவர் திருமணம் செய்யலாமா?"),
    a: s(
      "Yes — in tradition this is one of the recognised cancellations. When both charts carry Mangal dosha, the intensity is considered to balance out, so a Manglik–Manglik match is often seen as favourable rather than a problem. The full porutham of both charts should still be checked.",
      "ஆம் — பாரம்பரியத்தில் இது அங்கீகரிக்கப்பட்ட ரத்து நிலைகளில் ஒன்று. இரு ஜாதகங்களிலும் மங்கள் தோஷம் இருக்கும்போது அதன் தீவிரம் சமன் ஆவதாகக் கருதப்படுகிறது; எனவே செவ்வாய்–செவ்வாய் பொருத்தம் பெரும்பாலும் சிக்கலாக அல்ல, சாதகமாகவே பார்க்கப்படுகிறது. இருப்பினும் இரு ஜாதகங்களின் முழுப் பொருத்தத்தையும் பார்க்க வேண்டும்."
    ),
  },
  {
    q: s("Does Sevvai dosham become weaker with age?", "செவ்வாய் தோஷம் வயதுக்கு ஏற்ப குறையுமா?"),
    a: s(
      "Many traditional texts hold that Mars's fiery influence settles as a person matures, so the dosham is treated as milder for an older bride or groom. It is a softening, not an automatic removal — the strength of Mars in the chart and the running dasha still decide how much it matters.",
      "பல பாரம்பரிய நூல்கள், ஒருவர் முதிர்ச்சியடையும்போது செவ்வாயின் தீ தாக்கம் தணிவதாகச் சொல்கின்றன; எனவே வயது முதிர்ந்த மணமகன்/மணமகளுக்கு தோஷம் மிதமாகக் கருதப்படுகிறது. இது மென்மையாகுதலே தவிர தானாக நீங்குதல் அல்ல — ஜாதகத்தில் செவ்வாயின் பலமும் நடக்கும் தசையும் அதன் முக்கியத்துவத்தை இன்னும் தீர்மானிக்கின்றன."
    ),
  },
  {
    q: s("Does Sevvai dosham affect anything besides marriage?", "செவ்வாய் தோஷம் திருமணத்தைத் தவிர வேறு எதையும் பாதிக்குமா?"),
    a: s(
      "It is weighed most closely for marriage and partnership, but Mars also colours temperament, courage, property and disputes. A well-placed Mars can give drive and leadership; the same placement is only called a 'dosham' in the specific context of the marriage houses. Outside that, strong Mars is often an asset.",
      "இது திருமணம், துணை விஷயத்தில் மிகக் கூர்ந்து பார்க்கப்பட்டாலும், செவ்வாய் குணம், தைரியம், சொத்து, தகராறுகளையும் தீர்மானிக்கிறது. நன்கு அமைந்த செவ்வாய் உந்துதலையும் தலைமைப் பண்பையும் தரும்; அதே அமைப்பு திருமணப் பாவங்களின் சூழலில் மட்டுமே 'தோஷம்' என அழைக்கப்படுகிறது. அதற்கு வெளியே, பலமான செவ்வாய் பெரும்பாலும் ஒரு வலிமையே."
    ),
  },
  {
    q: s("Can Sevvai dosham be completely removed?", "செவ்வாய் தோஷத்தை முழுவதுமாக நீக்க முடியுமா?"),
    a: s(
      "It is not 'deleted' like an error. Tradition speaks of balancing and softening it — through a matched chart, cancellations already present in the horoscope, and devotional pariharam. A naturally strong chart reduces its effect; the aim is harmony in married life, not erasing a planet.",
      "இது ஒரு பிழையைப் போல 'அழிக்கப்படுவது' அல்ல. பாரம்பரியம் அதை சமன்செய்தல், மென்மையாக்குதல் பற்றியே பேசுகிறது — பொருந்தும் ஜாதகம், ஜாதகத்தில் ஏற்கனவே உள்ள ரத்து நிலைகள், வழிபாட்டுப் பரிகாரம் மூலம். இயல்பாகவே பலமான ஜாதகம் அதன் தாக்கத்தைக் குறைக்கிறது; நோக்கம் தாம்பத்திய வாழ்வில் இணக்கமே தவிர ஒரு கிரகத்தை அழிப்பதல்ல."
    ),
  },
];

// ─── DOSHAM: NAGA / SARPA ──────────────────────────────────────────────────────

export const DOSHAM_NAGA = {
  eyebrow:  s("Dosham · Naga / Sarpa Dosham", "தோஷம் · நாக / சர்ப்ப தோஷம்"),
  h1:       s("Naga Dosham (Sarpa Dosham)", "நாக தோஷம் (சர்ப்ப தோஷம்)"),
  lead:     s(
    "Naga or Sarpa dosham is read through Rahu, Ketu, the 5th house, and the flow of ancestral blessings. When the lunar nodes press on the house of children and lineage, tradition sees it as a call to honour the naga — the serpent energy tied to fertility, family continuity, and ancestral duty. Here is what it means, how it is formed, and the traditional pariharam.",
    "நாக அல்லது சர்ப்ப தோஷம் ராகு, கேது, 5-ஆம் பாவம், முன்னோர் ஆசீர்வாதத்தின் ஓட்டம் ஆகியவற்றால் படிக்கப்படுகிறது. சந்திர நோடுகள் குழந்தை மற்றும் வம்சத்தின் பாவத்தை அழுத்தும்போது, பாரம்பரியம் இதை நாகத்தை — கருவுறுதல், குடும்பத் தொடர்ச்சி, முன்னோர் கடமையுடன் தொடர்புடைய சர்ப்ப சக்தியை — மரியாதைப்படுத்தும் அழைப்பாகப் பார்க்கிறது. அதன் பொருள், எப்படி உருவாகிறது, பாரம்பரிய பரிகாரம் இங்கே."
  ),
  what_h2:   s("What Naga dosham means", "நாக தோஷம் என்றால் என்ன"),
  what_body: s(
    "Rahu and Ketu are the lunar nodes — shadow planets that represent karmic concentrations. In Tamil tradition they are the divine serpent (naga) whose head (Rahu) swallows the Sun and Moon during eclipses. The naga holds the energy of lineage, hidden wisdom, fertility, and family continuity. When Rahu or Ketu press on the 5th house (children and ancestral merit), the 5th lord, or Jupiter (the natural protector of progeny), this flow of ancestral blessing is disrupted. Naga dosham is not a curse — it is a signal that the serpent energy in the family needs to be acknowledged and honoured.",
    "ராகு மற்றும் கேது சந்திர நோடுகள் — கர்ம செறிவுகளை குறிக்கும் நிழல் கிரகங்கள். தமிழ் மரபில் இவை கிரகணத்தின்போது சூரியனையும் சந்திரனையும் விழுங்கும் தெய்வீக சர்ப்பமாக வெளிப்படுகின்றன; ராகு அதன் தலை. நாகம் வம்சம், மறைந்த ஞானம், கருவுறுதல், குடும்பக் கோட்டின் தொடர்ச்சி ஆகியவற்றின் சக்தியை கொண்டுள்ளது. ராகு அல்லது கேது 5-ஆம் பாவத்தை (குழந்தை மற்றும் முன்னோர் புண்ணியம்), 5-ஆம் அதிபதியை, அல்லது சந்தான காரகனான குருவை அழுத்தும்போது, முன்னோர் ஆசீர்வாதத்தின் ஓட்டம் தடைப்படுகிறது. நாக தோஷம் சாபமல்ல — குடும்பத்தில் உள்ள சர்ப்ப சக்தியை ஒப்புக்கொண்டு மரியாதைப்படுத்த வேண்டும் என்ற அறிகுறி."
  ),
  calc_h2:   s("How Naga dosham is formed", "நாக தோஷம் எப்படி உருவாகிறது"),
  calc_body: s(
    "Naga dosham is recognised when: Rahu or Ketu occupies the 5th house (putra sthana — children and ancestral merit); Rahu or Ketu conjoins or aspects the 5th lord; they afflict Jupiter, the karaka for children; or the Moon is closely conjunct Rahu (Grahan yoga — eclipse combination), disrupting the maternal line of ancestral flow. The severity depends on whether Jupiter provides a counter-aspect, the strength of the 5th lord, and the running dasha.",
    "நாக தோஷம் இவ்விடங்களில் அங்கீகரிக்கப்படுகிறது: ராகு அல்லது கேது 5-ஆம் பாவத்தில் (புத்திர ஸ்தானம்) அமரும்போது; ராகு அல்லது கேது 5-ஆம் அதிபதியுடன் சேரும் அல்லது பார்க்கும்போது; சந்தான காரகனான குருவை பாதிக்கும்போது; அல்லது சந்திரன் ராகுவுடன் நெருக்கமாக சேரும்போது (கிரஹண யோகம்), தாய் வழி முன்னோர் ஓட்டத்தை பாதிக்கிறது. குரு எதிர்ப்பார்வை தருகிறதா, 5-ஆம் அதிபதியின் பலம், நடக்கும் தசை ஆகியவற்றைப் பொறுத்து தீவிரம் மாறும்."
  ),
  brings_h2: s("What Naga dosham can bring", "நாக தோஷம் என்ன கொண்டு வரலாம்"),
  brings_intro: s(
    "These are tendencies shaped by Rahu and Ketu's pressure on the lineage and progeny houses — not certainties. Their effect intensifies at unexpected times and can settle quietly when Jupiter is strong or when the ancestral connection is restored through worship.",
    "இவை வம்சம் மற்றும் சந்தான பாவங்களில் ராகு-கேதுவின் அழுத்தத்தால் உருவாகும் போக்குகள் — நிச்சயங்கள் அல்ல. குரு பலமாக இருக்கும்போது அல்லது முன்னோர் தொடர்பு வழிபாட்டின் மூலம் மீட்டமைக்கப்படும்போது, தாக்கம் எதிர்பாராத நேரத்தில் தீவிரமடையவும் அமைதியாக நிற்கவும் செய்யலாம்."
  ),
  brings_categories: [
    {
      heading: s("Progeny & Lineage", "சந்தானம் & வம்சம்"),
      items: [
        s("Delay or anxiety around childbirth — conception tends to require more patience, spiritual effort, or medical support.", "குழந்தைப் பேறில் தாமதம் அல்லது கவலை — கருத்தரிப்பு அதிக பொறுமை, ஆன்மீக முயற்சி அல்லது மருத்துவ உதவியை தேவைப்படலாம்."),
        s("When the dosham is strong, pregnancy may come after persistent effort and spiritual practice — rarely a permanent block.", "தோஷம் வலிமையாக இருக்கும்போது, கர்ப்பம் தொடர்ந்த முயற்சி மற்றும் ஆன்மீக நடைமுறைக்குப் பின் வரலாம் — நிரந்தர தடை அரிதே."),
        s("Concern around children's health in early years — they tend to stabilise once past the initial phase.", "சிறுவயதில் குழந்தைகளின் ஆரோக்கியம் பற்றிய கவலை — ஆரம்பக் கட்டம் கடந்தவுடன் நிலைப்படுகிறார்கள்."),
        s("A feeling of incomplete lineage — as if the family line is waiting for someone to honour a long-lapsed ancestral duty.", "முழுமையற்ற வம்சம் என்ற உணர்வு — குடும்பக் கோடு நீண்டகாலமாக தவறவிட்ட ஒரு முன்னோர் கடமையை நிறைவேற்ற காத்திருப்பது போல்."),
        s("Once a naga prathishta or family vow is fulfilled, the progeny area often opens within one to two years.", "நாக பிரதிஷ்டை அல்லது குடும்ப நேர்த்திக்கடன் நிறைவேற்றப்பட்டால், சந்தான பகுதி ஒன்று இரண்டு ஆண்டுகளில் திறக்கும்."),
      ],
    },
    {
      heading: s("Family & Ancestral Patterns", "குடும்பம் & முன்னோர் அமைப்பு"),
      items: [
        s("Recurring patterns across generations — similar unexplained obstacles appearing in each generation of the family.", "தலைமுறைகளில் மீண்டும் வரும் அமைப்புகள் — குடும்பத்தின் ஒவ்வொரு தலைமுறையிலும் தோன்றும் ஒத்த விவரிக்கமுடியாத தடைகள்."),
        s("A sense of carrying an old burden — once the naga rite (ancestral serpent worship) is fulfilled, the weight lifts noticeably.", "பழைய சுமை சுமப்பது போன்ற உணர்வு — நாக சடங்கு (முன்னோர் சர்ப்ப வழிபாடு) நிறைவேற்றப்பட்டால், சுமை தெளிவாகக் குறைகிறது."),
        s("Serpent dreams — in Tamil tradition these are the naga's signal for attention; they typically recede after worship and milk abhishekam.", "சர்ப்ப கனவுகள் — தமிழ் மரபில் இவை கவனத்திற்கான நாகத்தின் அறிகுறிகள்; வழிபாடு மற்றும் பால் அபிஷேகத்திற்குப் பின் இவை வழக்கமாக நிற்கின்றன."),
        s("Tension around family property or inherited land — especially if an old naga idol on the property has been neglected.", "குடும்பச் சொத்து அல்லது மரபு நிலம் தொடர்பான பதற்றம் — குறிப்பாக சொத்தில் உள்ள பழைய நாக சிலை புறக்கணிக்கப்பட்டிருந்தால்."),
      ],
    },
    {
      heading: s("Mind & Health", "மனம் & ஆரோக்கியம்"),
      items: [
        s("Free-floating anxiety without clear cause — Rahu's nodal energy creates an unsettled, seeking quality in the mind.", "தெளிவான காரணமின்றி மிதக்கும் பதற்றம் — ராகுவின் நோடு சக்தி மனதில் அமைதியற்ற, தேடும் குணத்தை உருவாக்குகிறது."),
        s("Sensitivity to eclipses — restlessness or vivid dreams around lunar and solar eclipses, especially during Rahu-Ketu dasha.", "கிரகணங்களுக்கு உணர்திறன் — சந்திர மற்றும் சூரிய கிரகணங்களில், குறிப்பாக ராகு-கேது தசையில் அமைதியின்மை அல்லது தெளிவான கனவுகள்."),
        s("Skin conditions that come and go during nodal transits — mild in most cases, receding with pariharam.", "நோடு கோச்சாரங்களில் தோல் நிலைகள் வந்து போவது — பெரும்பாலான சந்தர்ப்பங்களில் மிதமானது, பரிகாரத்துடன் குறைகிறது."),
        s("Once the ancestral connection is restored through worship, many report a settling of mind and energy that was unexpected.", "வழிபாட்டின் மூலம் முன்னோர் தொடர்பு மீண்டும் நிலைபெறுத்தப்பட்டவுடன், பலர் எதிர்பாராத மன மற்றும் சக்தி அமைதியை அனுபவிப்பதாக தெரிவிக்கின்றனர்."),
      ],
    },
  ],
  howtoread_h2: s("How to read your own chart for Naga dosham", "உங்கள் ஜாதகத்தில் நாக தோஷம் எப்படி பார்ப்பது"),
  howtoread_intro: s(
    "Open your Thirukanitham jadhagam and note five things: where Rahu sits, where Ketu sits, what is in the 5th house, where Jupiter (Guru) is placed, and where the Moon sits. Tradition reads Naga dosham from the combined picture of these — not from one placement alone.",
    "உங்கள் திருக்கணித ஜாதகத்தை எடுத்து ஐந்து விஷயங்களை கவனியுங்கள்: ராகு எங்கே இருக்கிறார், கேது எங்கே இருக்கிறார், 5-ஆம் பாவத்தில் என்ன இருக்கிறது, குரு எங்கே இருக்கிறார், சந்திரன் எங்கே இருக்கிறார். பாரம்பரியம் இந்த ஐந்தின் ஒருங்கிணைந்த படத்திலிருந்து நாக தோஷத்தை படிக்கிறது — ஒரு இடத்தை மட்டும் வைத்து அல்ல."
  ),
  howtoread_steps: [
    {
      h: s("1 — Locate Rahu and Ketu in the rasi chart", "1 — ராசி ஜாதகத்தில் ராகு மற்றும் கேதுவை கண்டறியுங்கள்"),
      b: s(
        "Find Rahu (Ra) and Ketu (Ke) in the south Indian square chart. They always occupy opposite houses — six houses apart. Note which houses they occupy and which rasi (sign) each sits in. This is the starting point for all Naga dosham reading.",
        "தென்னிந்திய சதுர ஜாதகத்தில் ராகு (ர) மற்றும் கேது (கே) ஆகியவற்றை கண்டுபிடியுங்கள். இவை எப்போதும் எதிர் பாவங்களில் — ஆறு பாவங்கள் தள்ளி — அமர்கின்றன. இவை எந்தப் பாவங்களில் அமர்ந்திருக்கின்றன, எந்த ராசியில் என்பதை குறிக்கவும். இது நாக தோஷம் படிக்கும் தொடக்கப் புள்ளி."
      ),
    },
    {
      h: s("2 — Check the 5th house and its lord", "2 — 5-ஆம் பாவத்தையும் அதன் அதிபதியையும் சரிபாருங்கள்"),
      b: s(
        "The 5th house is the putra sthana — the seat of children, ancestral merit, and good fortune. Count 5 houses from your Lagna to find it. Is Rahu or Ketu sitting there? Then find the 5th lord (the planet ruling the sign in the 5th house) and check whether Rahu or Ketu conjoins or aspects it. This is the primary check.",
        "5-ஆம் பாவம் புத்திர ஸ்தானம் — குழந்தை, முன்னோர் புண்ணியம், நல்வாழ்வின் இடம். உங்கள் லக்னத்திலிருந்து 5 பாவங்கள் எண்ணி அதை கண்டறியுங்கள். ராகு அல்லது கேது அங்கே அமர்ந்திருக்கிறதா? 5-ஆம் அதிபதியை கண்டுபிடித்து ராகு அல்லது கேது அதனுடன் சேருகிறதா அல்லது பார்க்கிறதா என்று சரிபாருங்கள். இது முதன்மையான சோதனை."
      ),
    },
    {
      h: s("3 — Check Jupiter's placement and strength", "3 — குருவின் இடம் மற்றும் பலத்தை சரிபாருங்கள்"),
      b: s(
        "Jupiter (Guru) is the natural karaka of children and the 5th house. Find it in the chart. Is it in its own sign (Dhanus or Meena), exalted (Kataka), or debilitated (Makaram)? Does Guru's 5th, 7th, or 9th aspect fall on the 5th house? A strong, well-aspecting Guru is the most powerful counterweight to Naga dosham — it can largely neutralise even strong Rahu-Ketu pressure on the 5th.",
        "குரு குழந்தை மற்றும் 5-ஆம் பாவத்தின் இயற்கையான காரகன். ஜாதகத்தில் அதை கண்டுபிடியுங்கள். அது சொந்த ராசியில் (தனுஸ் அல்லது மீனம்), உச்சத்தில் (கடகம்) அல்லது நீசத்தில் (மகரம்) இருக்கிறதா? குருவின் 5, 7 அல்லது 9-ஆவது பார்வை 5-ஆம் பாவத்தில் விழுகிறதா? வலுவான, நன்கு பார்க்கும் குரு நாக தோஷத்தின் மிகவும் சக்தி வாய்ந்த எதிர்சக்தி — 5-ஆம் பாவத்தில் வலிமையான ராகு-கேது அழுத்தத்தையும் இது பெரும்பாலும் சமன் செய்யலாம்."
      ),
    },
    {
      h: s("4 — Check if the Moon is conjunct Rahu or Ketu", "4 — சந்திரன் ராகு அல்லது கேதுவுடன் சேர்கிறதா என்று சரிபாருங்கள்"),
      b: s(
        "Moon conjunct Rahu is the Grahan yoga (eclipse combination) — it adds anxiety, unsettledness, and maternal-line karmic pressure. Moon-Ketu conjunction brings spiritual sensitivity but emotional detachment. Either combination in the 5th house or aspecting the 5th lord adds to the dosham's strength.",
        "சந்திரன்-ராகு சேர்க்கை கிரஹண யோகம் (கிரகண அமைப்பு) — இது ஜாதகத்தில் பதற்றம், அமைதியின்மை, தாய் வழி கர்ம அழுத்தத்தை சேர்க்கிறது. சந்திரன்-கேது சேர்க்கை ஆன்மீக உணர்திறனை தரும் ஆனால் உணர்ச்சி விலகல் கொண்டுவரும். இந்த இரண்டு சேர்க்கைகளும் 5-ஆம் பாவத்தில் அல்லது 5-ஆம் அதிபதியை பார்க்கும்போது தோஷத்தின் வலிமையை சேர்க்கின்றன."
      ),
    },
    {
      h: s("5 — Note the running dasha", "5 — நடக்கும் தசையை பாருங்கள்"),
      b: s(
        "Naga dosham is felt most during Rahu mahadasha (18 years) and Ketu mahadasha (7 years), and within other dashas during Rahu or Ketu antardasha. Jupiter mahadasha and antardasha generally bring relief — they open the 5th house's positive potential and ease the ancestral karmic weight. Outside Rahu-Ketu dasha periods, even a strongly-placed dosham can pass quietly.",
        "நாக தோஷம் ராகு மஹாதசையில் (18 ஆண்டு) மற்றும் கேது மஹாதசையில் (7 ஆண்டு) மிகவும் உணரப்படுகிறது; மற்ற தசைகளில் ராகு அல்லது கேது அந்தர்தசையிலும். குரு மஹாதசை மற்றும் அந்தர்தசை பொதுவாக நிவாரணம் தருகின்றன — 5-ஆம் பாவத்தின் நேர்மறையான திறனை திறந்து முன்னோர் கர்ம சுமையை குறைக்கின்றன. ராகு-கேது தசை காலங்களுக்கு வெளியே, வலிமையான நிலையிலுள்ள தோஷமும் அமைதியாக கடந்து போகலாம்."
      ),
    },
  ],
  cancel_h2:  s("When the dosham is softened or cancelled", "தோஷம் மென்மையாகும் அல்லது ரத்தாகும் நிலைகள்"),
  cancel_body: s(
    "Jupiter in the 5th house or a direct Jupiter aspect on the 5th is the most powerful natural cancellation. Rahu in a Mercury or Saturn sign (Mithuna, Kanya, Makaram, Kumbam) behaves more moderately. When the 5th lord is in its own or exalted sign, the protective force is increased even with Rahu present. A strong running dasha of Jupiter or the 5th lord counteracts the nodal pressure for that period. When the family sincerely resumes naga worship and tarpan, the dosham often noticeably lightens within a year — this is the tradition's most reliable teaching on Naga dosham.",
    "5-ஆம் பாவத்தில் குரு அல்லது 5-ஆம் பாவத்தில் நேரடி குரு பார்வை மிகவும் சக்தி வாய்ந்த இயற்கை ரத்து. ராகு புதன் அல்லது சனி ராசியில் (மிதுனம், கன்னி, மகரம், கும்பம்) இருந்தால் மிதமாக நடந்துகொள்கிறது. ராகு இருந்தாலும் 5-ஆம் அதிபதி சொந்த அல்லது உச்ச ராசியில் இருந்தால் பாதுகாப்பு சக்தி அதிகரிக்கிறது. குரு அல்லது 5-ஆம் அதிபதியின் வலிமையான நடக்கும் தசை அந்தக் காலத்தில் நோடு அழுத்தத்தை சமன் செய்கிறது. குடும்பம் மனமார்ந்து நாக வழிபாடு மற்றும் தர்ப்பணத்தை மீண்டும் தொடங்கும்போது, தோஷம் ஒரு ஆண்டில் கணிசமாகக் குறைகிறது — இது நாக தோஷம் குறித்த மரபின் மிகவும் நம்பகமான போதனை."
  ),
  pariharam_h2:   s("Pariharam — honouring the naga", "பரிகாரம் — நாகத்தை மரியாதைப்படுத்துதல்"),
  pariharam_body: s(
    "Devotees visit the Rahu temple at Thirunageswaram (near Kumbakonam, one of the Navagraha sthalams) and the Ketu temple at Keezhaperumpallam — ideally on Aayilyam nakshatra day and Saturdays. Milk abhishekam to naga idols and prayer on Panchami and Naga Chaturthi days are traditional. If a family naga idol or sarpa kavu (serpent grove) has been neglected, performing naga prathishta (reinstatement) is the most powerful step. Strengthening Jupiter through Thursday worship, yellow flowers, and respect to teachers and elders is a complementary remedy that steadily softens the nodal pressure on the 5th house.",
    "பக்தர்கள் திருநாகேஸ்வரம் (கும்பகோணம் அருகே, நவகிரக தலங்களில் ஒன்று) ராகு கோயிலிலும் கீழப்பெரும்பள்ளம் கேது கோயிலிலும் — குறிப்பாக ஆயில்யம் நட்சத்திர நாளிலும் சனிக்கிழமைகளிலும் — தரிசிக்கின்றனர். நாக சிலைகளுக்கு பால் அபிஷேகம், பஞ்சமி மற்றும் நாக சதுர்த்தி நாட்களில் தொடர்ந்த பிரார்த்தனை ஆகியவை பாரம்பரியம். குடும்பத்தில் புறக்கணிக்கப்பட்ட நாக சிலை அல்லது சர்ப்ப காவு இருந்தால் நாக பிரதிஷ்டை செய்வது மிகவும் சக்தி வாய்ந்த நடவடிக்கை. வியாழன் வழிபாடு, மஞ்சள் பூக்கள், பெரியோர் மரியாதை மூலம் குருவை பலப்படுத்துவது 5-ஆம் பாவத்தில் நோடு அழுத்தத்தை படிப்படியாக குறைக்கும் ஒரு துணை பரிகாரம்."
  ),
  slokam_label:  s("Rahu (Naga) slokam", "ராகு (நாக) ஸ்லோகம்"),
  slokam_text:   s(
    "Ardha-kayam maha-veeram chandraditya-vimardanam\nSimhika-garbha-sambhutam tam Rahum pranamamyaham",
    "அர்த காயம் மஹாவீரம் சந்திராதித்ய விமர்தனம்\nசிம்ஹிகா கர்ப்ப ஸம்பூதம் தம் ராஹும் ப்ரணமாம்யஹம்"
  ),
  slokam_meaning: s(
    "I bow to Rahu — half-bodied, supremely powerful, the suppressor of the Sun and Moon, born of the womb of Simhika.",
    "அர்த்த உடல் கொண்டவனே, மஹாவீரனே, சூரிய-சந்திரர்களை மறைப்பவனே, சிம்ஹிகையின் கர்ப்பத்தில் பிறந்தவனே — ராஹுவே, உன்னை வணங்குகிறேன்."
  ),
  related_h2: s("Related", "தொடர்புடையவை"),
};

export const DOSHAM_NAGA_FAQ = [
  {
    q: s("Does Naga dosham mean I will not have children?", "நாக தோஷம் என்றால் குழந்தை பிறக்காதா?"),
    a: s(
      "No. It most often indicates delay or that conception benefits from patience and medical support. A strong Jupiter or a supportive 5th house dasha can open the progeny area normally. Many couples with this pattern conceive naturally with time.",
      "இல்லை. பெரும்பாலும் இது தாமதம் அல்லது கருத்தரிப்பு பொறுமை மற்றும் மருத்துவ உதவியால் பலன் அடையும் என்பதைக் குறிக்கிறது. பலமான குரு அல்லது ஆதரவான 5-ஆம் பாவ தசை சந்தான பகுதியை இயல்பாக திறக்கலாம். இந்த அமைப்பு கொண்ட பல தம்பதியர் காலப்போக்கில் இயல்பாகவே கருத்தரிக்கின்றனர்."
    ),
  },
  {
    q: s("Is Naga dosham the same as Kala Sarpa dosham?", "நாக தோஷமும் கால சர்ப்ப தோஷமும் ஒன்றா?"),
    a: s(
      "They are related but different. Naga dosham is specifically about Rahu-Ketu pressure on the 5th house, its lord, and Jupiter — it is about lineage and children. Kala Sarpa dosham is the specific pattern where all seven classical planets are enclosed between Rahu and Ketu, affecting the full sweep of life. A chart can have one without the other.",
      "அவை தொடர்புடையவை ஆனால் வேறுபட்டவை. நாக தோஷம் குறிப்பாக 5-ஆம் பாவம், அதன் அதிபதி, குரு மீது ராகு-கேது அழுத்தம் பற்றியது — வம்சம் மற்றும் குழந்தை பற்றியது. கால சர்ப்ப தோஷம் ஏழு கிரகங்களும் ராகு-கேதுக்கிடையே அடைபடும் குறிப்பிட்ட அமைப்பு. ஒரு ஜாதகத்தில் ஒன்று மட்டும் இருக்கலாம்."
    ),
  },
  {
    q: s("Do serpent dreams confirm this dosham?", "சர்ப்ப கனவுகள் இந்த தோஷத்தை உறுதி செய்யுமா?"),
    a: s(
      "In traditional practice, recurring serpent dreams are seen as a signal to look at the naga connection in the chart. But dreams alone do not confirm the dosham — the astrologer reads the chart first. The remedies (particularly naga temple worship and milk abhishekam) typically bring the dreams to a natural close.",
      "பாரம்பரிய நடைமுறையில் மீண்டும் வரும் சர்ப்ப கனவுகள் ஜாதகத்தில் நாக தொடர்பை பார்க்கும் அறிகுறியாக கருதப்படுகின்றன. ஆனால் கனவுகள் மட்டும் தோஷத்தை உறுதி செய்யாது — ஜோதிடர் முதலில் ஜாதகத்தை படிக்கிறார். பரிகாரங்கள் (நாக கோயில் வழிபாடு மற்றும் பால் அபிஷேகம்) வழக்கமாக கனவுகளை இயல்பாக நிறுத்துகின்றன."
    ),
  },
  {
    q: s("Is Naga dosham inherited across generations?", "நாக தோஷம் தலைமுறைகளில் மரபுரிமையாக வருமா?"),
    a: s(
      "It can appear in successive generations when ancestral serpent worship has lapsed. But it is not mechanically hereditary — each chart is individual. When the family collectively fulfils the ancestral duty (naga prathishta, regular tarpan), the pattern tends to ease across the family line within one or two generations.",
      "குடும்பத்தில் முன்னோர் சர்ப்ப வழிபாடு தவறிவிட்டிருக்கும்போது தொடர்ந்த தலைமுறைகளில் தோன்றலாம். ஆனால் இது இயந்திரமாக மரபுரிமையல்ல — ஒவ்வொரு ஜாதகமும் தனிப்பட்டது. குடும்பம் ஒட்டுமொத்தமாக முன்னோர் கடமையை நிறைவேற்றும்போது, ஒன்று இரண்டு தலைமுறைகளில் குடும்பக் கோடு முழுவதும் அமைப்பு குறைய முனைகிறது."
    ),
  },
];

// ─── DOSHAM: KALA SARPA ────────────────────────────────────────────────────────

export const DOSHAM_KALA_SARPA = {
  eyebrow:  s("Dosham · Kala Sarpa Dosham", "தோஷம் · கால சர்ப்ப தோஷம்"),
  h1:       s("Kala Sarpa Dosham", "கால சர்ப்ப தோஷம்"),
  lead:     s(
    "Kala Sarpa dosham forms when all seven classical planets are enclosed within the arc from Rahu to Ketu. It intensifies the chart rather than ruining it — many high achievers carry this pattern. Here is what it truly means, how it is read, and the traditional pariharam.",
    "கால சர்ப்ப தோஷம் ஏழு கிரகங்களும் ராகுவிலிருந்து கேதுவரையுள்ள வட்டவாயத்துக்குள் அடைபடும்போது உருவாகிறது. இது ஜாதகத்தை அழிக்கவில்லை — தீவிரப்படுத்துகிறது. பல சாதனையாளர்களுக்கு இந்த அமைப்பு உள்ளது. அதன் உண்மையான பொருள், எப்படி படிக்கப்படுகிறது, பாரம்பரிய பரிகாரம் இங்கே."
  ),
  what_h2:   s("What Kala Sarpa dosham means", "கால சர்ப்ப தோஷம் என்றால் என்ன"),
  what_body: s(
    "When all seven classical planets — Suryan (Sun), Chandran (Moon), Chevvai (Mars), Budhan (Mercury), Guru (Jupiter), Sukran (Venus), Sani (Saturn) — fall on one side of the Rahu-Ketu axis, this is Kala Sarpa. 'Kala' means time, fate, and the force of Yama; 'Sarpa' is the serpent. The planetary life-force is enclosed within the serpent's body — a concentrated karmic pressure asking a person to earn their rise through sustained effort. It is not a rare configuration, and its effect ranges from mild to intense depending on the type and planetary strengths within the enclosure.",
    "ஏழு கிரகங்களும் — சூரியன், சந்திரன், செவ்வாய், புதன், குரு, சுக்கிரன், சனி — ராகு-கேது அச்சின் ஒரு பக்கத்தில் இருக்கும்போது கால சர்ப்பம் என்று அழைக்கப்படுகிறது. 'கால' என்றால் நேரம், விதி, யமனின் சக்தி; 'சர்ப்பம்' சர்ப்பம். கோள் ஆற்றல் சர்ப்பத்தின் உடலுக்குள் அடைபட்டுள்ளது — ஒருவர் உயர்வை எளிதாகப் பெறாமல் உழைத்துப் பெற வேண்டும் என்று கேட்கும் செறிவான கர்ம அழுத்தம். இது அரிய அமைப்பல்ல; அச்சு வகையும் அடைப்பிலுள்ள கிரக பலமும் தீவிரத்தை மாற்றுகின்றன."
  ),
  calc_h2:   s("How Kala Sarpa dosham is identified", "கால சர்ப்ப தோஷம் எப்படி கண்டறியப்படுகிறது"),
  calc_body: s(
    "In the Thirukanitham chart, examine whether all 7 planets fall within the arc from Rahu to Ketu moving clockwise (the direction of Rahu's apparent motion). If even ONE planet sits on the other side — the Ketu-to-Rahu arc — the enclosure is broken and strict Kala Sarpa does not apply. There are 12 named types based on Rahu's house: Ananta (1st), Kulika (2nd), Vasuki (3rd), Shankhapala (4th), Padma (5th), Mahapadma (6th — mildest), Takshaka (7th), Karkotaka (8th), Shankhachuda (9th), Ghataka (10th), Vishadhara (11th), Sheshanaga (12th). The axis direction and the houses involved change the reading significantly.",
    "திருக்கணித ஜாதகத்தில், கடிகார திசையில் ராகுவிலிருந்து கேதுவரை உள்ள வட்டவாயத்துக்குள் எல்லா 7 கிரகங்களும் விழுகிறதா என்று சரிபாருங்கள். ஒரே ஒரு கிரகமாவது மறுபுறத்தில் — கேதுவிலிருந்து ராகுவரை — இருந்தால் அடைப்பு உடைந்து கடுமையான தோஷம் பொருந்தாது. ராகு எந்தப் பாவத்தில் இருக்கிறது என்பதை வைத்து 12 வகைகள்: அனந்த (1), குலிக (2), வாசுகி (3), சங்கபால (4), பத்ம (5), மஹாபத்ம (6 — மிகவும் மிதமானது), தக்ஷக (7), கர்கோடக (8), சங்கசூட (9), கடக (10), விஷாதர (11), சேஷநாக (12). அச்சு திசையும் சம்பந்தப்பட்ட பாவங்களும் வாசிப்பை கணிசமாக மாற்றுகின்றன."
  ),
  brings_h2: s("What Kala Sarpa dosham can bring", "கால சர்ப்ப தோஷம் என்ன கொண்டு வரலாம்"),
  brings_intro: s(
    "The experience of this dosham depends on which type (Rahu's house), the strength of the enclosed planets, and the running dasha. These are tendencies — many who carry this pattern develop exceptional strength and resilience precisely because the chart requires it.",
    "இந்த தோஷத்தின் அனுபவம் எந்த வகை (ராகுவின் பாவம்), அடைக்கப்பட்ட கிரகங்களின் பலம், நடக்கும் தசை ஆகியவற்றைப் பொறுத்தது. இவை போக்குகள் — இந்த அமைப்பு கொண்ட பலர் ஜாதகம் அதை தேவைப்படுவதால் சரியாக விதிவிலக்கான வலிமையையும் மன உறுதியையும் வளர்க்கிறார்கள்."
  ),
  brings_categories: [
    {
      heading: s("Career & Life Path", "தொழில் & வாழ்க்கை பாதை"),
      items: [
        s("Effort that meets unexpected obstacles just before culmination — the 'two steps forward, one step back' pattern is characteristic.", "உச்சத்திற்கு நேரம் தவறாமல் எதிர்பாராத தடைகளை சந்திக்கும் முயற்சி — 'இரண்டு படி முன்னோக்கி, ஒரு படி பின்னோக்கி' அமைப்பு குணாதிசயமானது."),
        s("A late but often powerful rise — the chart's full potential tends to emerge after the first Rahu dasha or significant Saturn transit.", "தாமதமான ஆனால் பெரும்பாலும் சக்திவாய்ந்த உயர்வு — ஜாதகத்தின் முழு திறன் முதல் ராகு தசை அல்லது முக்கிய சனி கோச்சாரத்திற்குப் பின் வெளிப்படுவது வழக்கம்."),
        s("Risk of dramatic reversals after peaks of success — the dosham asks for sustained discipline, not one big bet.", "வெற்றியின் உச்சத்திற்குப் பிறகு நாடகமான திரும்பல் ஏற்படும் அபாயம் — தோஷம் நிலையான ஒழுக்கத்தை கேட்கிறது, ஒரே ஒரு பெரிய சவாலை அல்ல."),
        s("Financial instability in waves, especially during nodal transits — more stable during Jupiter and Venus dashas.", "நோடு கோச்சாரங்களில் குறிப்பாக அலையலையாக நிதி நிலையின்மை — குரு மற்றும் சுக்கிர தசைகளில் மிகவும் நிலையானது."),
        s("High ambition and unusual focus — the concentration of planetary energy often produces people who go further than expected.", "உயர் லட்சியம் மற்றும் அசாதாரண கவனம் — கிரக சக்தியின் செறிவு பெரும்பாலும் எதிர்பார்ப்பை விட தூரம் செல்லும் மனிதர்களை உருவாக்குகிறது."),
      ],
    },
    {
      heading: s("Mind & Inner Life", "மனம் & உள்ளுணர்வு"),
      items: [
        s("Intense inner world with a pull toward spiritual or philosophical inquiry — the naga is also a symbol of hidden wisdom in Tamil tradition.", "ஆன்மீக அல்லது தத்துவ ஆராய்ச்சியை நோக்கிய இழுப்புடன் தீவிரமான உள்ளான உலகம் — தமிழ் மரபில் நாகம் மறைந்த ஞானத்தின் அடையாளம்."),
        s("Recurring dreams with vivid imagery; sensitivity to the Moon's phases, especially the full moon and eclipses.", "ஆழமான உருவகங்களுடன் மீண்டும் வரும் கனவுகள்; பௌர்ணமி மற்றும் கிரகணங்கள் உட்பட சந்திரன் நிலைகளுக்கு உணர்திறன்."),
        s("Restlessness that is often creative — many artists, seekers, innovators, and leaders carry this pattern and channel it into output.", "பெரும்பாலும் ஆக்கப்பூர்வமான அமைதியின்மை — பல கலைஞர்கள், தேடுபவர்கள், புதுமையாளர்கள், தலைவர்கள் இந்த அமைப்பு கொண்டு அதை வெளிப்பாடாக செலுத்துகிறார்கள்."),
        s("Periods of feeling enclosed or restricted, followed by sudden openings — the rhythm of the dosham itself.", "அடைபட்டது அல்லது கட்டுப்பாட்டில் உள்ளது என்ற உணர்வின் காலங்கள், அதைத் தொடரும் திடீர் திறப்புகள் — தோஷத்தின் சொந்த தாளம்."),
        s("Heightened intuition — a consistent ability to sense undercurrents others miss, especially during Rahu-Ketu dasha.", "உயர்ந்த நுண்ணுணர்வு — மற்றவர்கள் தவறும் அடிநீரோட்டங்களை உணரும் தொடர்ந்த திறன், குறிப்பாக ராகு-கேது தசையில்."),
      ],
    },
    {
      heading: s("Relationships & Family", "உறவுகள் & குடும்பம்"),
      items: [
        s("Carrying family responsibility early in life — often the person who anchors the family during its most difficult period.", "இளம் வயதில் குடும்பப் பொறுப்பை சுமப்பது — கடினமான காலத்தில் குடும்பத்தை தாங்கும் நபராக பெரும்பாலும் இருப்பது."),
        s("Delay in marriage or a turbulent early phase when the Rahu-Ketu axis falls on the 7th house — the marriage axis.", "ராகு-கேது அச்சு 7-ஆம் பாவத்தில் — திருமண அச்சில் — விழும்போது திருமண தாமதம் அல்லது கொந்தளிப்பான ஆரம்ப கட்டம்."),
        s("Deep loyalty and capacity for long commitments — once the relationship is steady, it tends to last.", "ஆழமான விசுவாசமும் நீண்ட அர்ப்பணிப்பிற்கான திறனும் — உறவு நிலைபெற்றவுடன் நீடிக்கும்."),
        s("A sense of isolation even in company — until the karmic pattern opens after the testing phase, often in the 30s or 40s.", "கர்ம அமைப்பு திறக்கும் வரை — பெரும்பாலும் 30 அல்லது 40 வயதிற்குப் பிறகு — மக்கள் மத்தியிலும் தனிமை உணர்வு."),
      ],
    },
  ],
  howtoread_h2: s("How to read your own chart for Kala Sarpa dosham", "உங்கள் ஜாதகத்தில் கால சர்ப்ப தோஷம் எப்படி பார்ப்பது"),
  howtoread_intro: s(
    "Open your Thirukanitham jadhagam. The check is precise: are ALL seven classical planets enclosed within the clockwise arc from Rahu to Ketu? If yes, the dosham is present. If even one is on the other side, it is broken.",
    "உங்கள் திருக்கணித ஜாதகத்தை திறவுங்கள். சோதனை நுட்பமானது: ஏழு கிரகங்களும் கடிகார திசையில் ராகுவிலிருந்து கேதுவரை உள்ள வட்டவாயத்துக்குள் இருக்கிறதா? ஆம் என்றால் தோஷம் இருக்கிறது. ஒன்று மட்டும் மறுபுறத்தில் இருந்தாலும் அடைப்பு உடைந்துவிடும்."
  ),
  howtoread_steps: [
    {
      h: s("1 — Locate Rahu and Ketu and note the type", "1 — ராகு மற்றும் கேதுவை கண்டறிந்து வகையை குறிக்கவும்"),
      b: s(
        "Find Rahu (Ra) and Ketu (Ke) in the south Indian chart — they are always in opposite houses. Note Rahu's house number: this determines the type of Kala Sarpa. Ananta (Rahu 1st), Kulika (2nd), Vasuki (3rd), Shankhapala (4th), Padma (5th), Mahapadma (6th), Takshaka (7th), Karkotaka (8th), Shankhachuda (9th), Ghataka (10th), Vishadhara (11th), Sheshanaga (12th).",
        "தென்னிந்திய ஜாதகத்தில் ராகு (ர) மற்றும் கேது (கே) ஆகியவற்றை கண்டுபிடியுங்கள் — இவை எப்போதும் எதிர் பாவங்களில் இருக்கும். ராகுவின் பாவ எண்ணை குறிக்கவும்: இது கால சர்ப்ப வகையை தீர்மானிக்கிறது. அனந்த (ராகு 1), குலிக (2), வாசுகி (3), சங்கபால (4), பத்ம (5), மஹாபத்ம (6), தக்ஷக (7), கர்கோடக (8), சங்கசூட (9), கடக (10), விஷாதர (11), சேஷநாக (12)."
      ),
    },
    {
      h: s("2 — Check if all 7 planets are on the Rahu-to-Ketu arc", "2 — ஏழு கிரகங்களும் ராகு-கேது வட்டவாயத்துக்குள் விழுகிறதா என சரிபாருங்கள்"),
      b: s(
        "Starting from Rahu's house, move clockwise. List every planet you encounter. If all seven — Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn — are within this arc before reaching Ketu, the dosham is fully present. If any one planet sits on the Ketu-to-Rahu arc (the other half), the enclosure is broken.",
        "ராகுவின் பாவத்திலிருந்து தொடங்கி கடிகார திசையில் பாவங்களை கடந்து செல்லுங்கள். நீங்கள் சந்திக்கும் ஒவ்வொரு கிரகத்தையும் பட்டியலிடுங்கள். கேதுவை அடைவதற்கு முன்பு ஏழும் — சூரியன், சந்திரன், செவ்வாய், புதன், குரு, சுக்கிரன், சனி — இந்த வட்டவாயத்துக்குள் இருந்தால் தோஷம் முழுமையாக இருக்கிறது. மறு பாதியில் ஒரு கிரகமாவது இருந்தால் அடைப்பு உடைந்துவிடும்."
      ),
    },
    {
      h: s("3 — Identify which life areas are affected by the type", "3 — வகையால் எந்த வாழ்க்கைத் துறைகள் பாதிக்கப்படுகின்றன என்று அறியுங்கள்"),
      b: s(
        "The type changes the focus: Rahu in 1st or 7th affects personality or marriage; in 2nd or 8th, family wealth and hidden matters; in 4th or 10th, home and career; in 5th or 11th, children and gains; in 9th or 3rd, dharma and courage. Mahapadma (Rahu 6th) is traditionally considered the mildest and often partially self-cancelling.",
        "வகை கவனத்தை மாற்றுகிறது: ராகு 1 அல்லது 7-ல் ஆளுமை அல்லது திருமணத்தை பாதிக்கும்; 2 அல்லது 8-ல் குடும்ப செல்வம் மற்றும் மறைந்த விஷயங்கள்; 4 அல்லது 10-ல் இல்லம் மற்றும் தொழில்; 5 அல்லது 11-ல் குழந்தை மற்றும் லாபம்; 9 அல்லது 3-ல் தர்மம் மற்றும் தைரியம். மஹாபத்ம (ராகு 6-ல்) பாரம்பரியமாக மிகவும் மிதமானதாக கருதப்படுகிறது."
      ),
    },
    {
      h: s("4 — Check the strength of Lagna lord and Moon inside the arc", "4 — வட்டவாயத்துக்குள் லக்னாதிபதி மற்றும் சந்திரனின் பலத்தை சரிபாருங்கள்"),
      b: s(
        "A strong Lagna lord and Moon inside the enclosure significantly reduce the dosham's impact. If Jupiter or Venus is strong and well-placed within the enclosed arc, they provide inner stability even under the nodal pressure. The question is not just whether the dosham exists, but how strong the planets inside are.",
        "அடைக்கப்பட்ட வட்டவாயத்துக்குள் வலிமையான லக்னாதிபதி மற்றும் சந்திரன் தோஷத்தின் தாக்கத்தை கணிசமாக குறைக்கின்றன. குரு அல்லது சுக்கிரன் வட்டவாயத்துக்குள் வலிமையாக நிலைப்பட்டிருந்தால், நோடு அழுத்தத்திலும் உள் நிலைத்தன்மையை அளிக்கின்றன. தோஷம் இருக்கிறதா என்பது மட்டுமல்ல; அடைப்பிற்குள் உள்ள கிரகங்கள் எவ்வளவு வலிமையாக உள்ளன என்பதும் முக்கியம்."
      ),
    },
    {
      h: s("5 — Note the running dasha", "5 — நடக்கும் தசையை பாருங்கள்"),
      b: s(
        "Kala Sarpa is felt most during Rahu mahadasha (18 years) and Ketu mahadasha (7 years). The interval between these two periods often provides relative relief. Jupiter mahadasha brings expansion and opening even within a Kala Sarpa chart. Outside nodal dasha windows, many people with this pattern lead essentially normal lives, with intensity surfacing mainly during sensitive transits.",
        "கால சர்ப்பம் ராகு மஹாதசையில் (18 ஆண்டு) மற்றும் கேது மஹாதசையில் (7 ஆண்டு) மிகவும் உணரப்படுகிறது. இந்த இரண்டு காலங்களுக்கிடையேயுள்ள இடைவெளி பொதுவாக ஒப்பீட்டளவில் நிவாரணம் தருகிறது. குரு மஹாதசை கால சர்ப்ப ஜாதகத்திலும் விரிவாக்கம் மற்றும் திறப்பை கொண்டுவருகிறது. நோடு தசை காலங்களுக்கு வெளியே, இந்த அமைப்பு கொண்ட பலர் அடிப்படையில் இயல்பான வாழ்க்கை வாழ்கின்றனர்."
      ),
    },
  ],
  cancel_h2:  s("When the dosham is softened", "தோஷம் மென்மையாகும் நிலைகள்"),
  cancel_body: s(
    "The dosham is technically broken if even one planet sits outside the Rahu-Ketu arc. Mahapadma (Rahu in 6th, Ketu in 12th) is considered the mildest and often partially self-cancelling. Sheshanaga (Rahu in 12th, Ketu in 6th) is treated as potentially auspicious by some classical authorities. A strong Lagna lord inside the arc counteracts the enclosure. Jupiter's strength anywhere in the chart is the most reliable softener regardless of type. As life advances and the person earns their rise through the tests the chart sets, the dosham naturally loses its grip — this is the traditional teaching.",
    "ஒரு கிரகமாவது ராகு-கேது வட்டவாயத்திற்கு வெளியே இருந்தால் தோஷம் தொழில்நுட்ப ரீதியாக உடைகிறது. மஹாபத்ம (ராகு 6-ல், கேது 12-ல்) மிகவும் மிதமானதாக கருதப்படுகிறது; பெரும்பாலும் பகுதியாக தனியாக ரத்தாகும். சேஷநாக (ராகு 12-ல், கேது 6-ல்) சில சாஸ்திர அதிகாரிகளால் சுபமானதாக கருதப்படுகிறது. வட்டவாயத்துக்குள் வலிமையான லக்னாதிபதி அடைப்பு சக்தியை சமன் செய்கிறது. அச்சு வகையைப் பொருட்படுத்தாமல் ஜாதகத்தில் எங்கேயும் குருவின் வலிமை மிகவும் நம்பகமான மென்மையாக்கி."
  ),
  pariharam_h2:   s("Pariharam — opening the enclosure", "பரிகாரம் — அடைப்பை திறத்தல்"),
  pariharam_body: s(
    "Devotees visit the Rahu temple at Thirunageswaram and the Ketu temple at Keezhaperumpallam — ideally as a single pilgrimage on Aayilyam nakshatra day. Srikalahasti in Andhra Pradesh, where both Rahu and Ketu have dedicated shrines, is widely visited by Tamil families for Kala Sarpa shanti. A formal Kala Sarpa shanti pooja, performed by a priest on the correct tithi with the birth chart, is the most traditional remedy. Monthly Amavasya tarpan settles the ancestral dimension. Building a strong daily discipline and routine is itself a spiritual remedy: the enclosed planetary energy responds to structure, consistency, and patient effort.",
    "பக்தர்கள் திருநாகேஸ்வரம் ராகு கோயிலிலும் கீழப்பெரும்பள்ளம் கேது கோயிலிலும் — குறிப்பாக ஆயில்யம் நட்சத்திர நாளில் ஒரே யாத்திரையாக — வழிபடுகிறார்கள். ஆந்திரப்பிரதேசத்தில் உள்ள ஸ்ரீகாளஹஸ்தி, ராகு மற்றும் கேதுவுக்கு விரிவான தனித்தனி சன்னதிகள் கொண்ட இடம்; தமிழ் குடும்பங்கள் கால சர்ப்ப சாந்திக்காக இதை அதிகமாக வழிபடுகின்றன. ஜன்ம ஜாதகத்துடன் சரியான திதியில் புரோகிதர் செய்யும் முறையான கால சர்ப்ப சாந்தி பூஜை மிகவும் பாரம்பரியமான பரிகாரம். மாதாந்திர அமாவாசை தர்ப்பணம் முன்னோர் பரிமாணத்தை சமன்படுத்துகிறது. வலிமையான தினசரி ஒழுக்கத்தை வளர்ப்பதும் வழக்கத்தை உருவாக்குவதும் ஆன்மீக பரிகாரம்: அடைக்கப்பட்ட கிரக சக்தி அமைப்பு, நிலைத்தன்மை, பொறுமையான முயற்சிக்கு பதிலளிக்கிறது."
  ),
  slokam_label:  s("Ketu (Naga) slokam", "கேது (நாக) ஸ்லோகம்"),
  slokam_text:   s(
    "Palasha-pushpa-sankasham taraka-graha-mastakam\nRaudram raudratmakam ghoram tam Ketum pranamamyaham",
    "பலாச புஷ்ப சங்காசம் தாரகா க்ரஹ மஸ்தகம்\nரௌத்ரம் ரௌத்ராத்மகம் கோரம் தம் கேதும் ப்ரணமாம்யஹம்"
  ),
  slokam_meaning: s(
    "I bow to Ketu — radiant like the palasha flower, bearing a star as his crown, fierce and dreadful in nature.",
    "பலாச மலர் போன்று ஒளிர்பவனே, நட்சத்திரத்தை சிரமணியாக கொண்டவனே, கோரமான, ரௌத்திரமான இயல்புடையவனே — கேதுவே, உன்னை வணங்குகிறேன்."
  ),
  related_h2: s("Related", "தொடர்புடையவை"),
};

export const DOSHAM_KALA_SARPA_FAQ = [
  {
    q: s("Is Kala Sarpa dosham always negative?", "கால சர்ப்ப தோஷம் எப்போதும் கெட்டதா?"),
    a: s(
      "No. It intensifies the chart rather than ruining it. Many historically successful and spiritually significant people carry this pattern. The challenge is in the path — delay, reversals, intense tests — not in the destination. Kala Sarpa charts often produce achievers who have earned their rise the hard way and carry unusual resilience.",
      "இல்லை. இது ஜாதகத்தை அழிப்பதை விட தீவிரப்படுத்துகிறது. வரலாற்றில் வெற்றிகரமான மற்றும் ஆன்மீகமாக குறிப்பிடத்தக்க பலருக்கு இந்த அமைப்பு உள்ளது. சவால் பாதையில் உள்ளது — தாமதம், திரும்பல், கடுமையான சோதனைகள் — இலக்கில் அல்ல. கால சர்ப்ப ஜாதகங்கள் பெரும்பாலும் கடினமான வழியில் உயர்வை சம்பாதித்த, அசாதாரண மன உறுதி கொண்ட சாதனையாளர்களை உருவாக்குகின்றன."
    ),
  },
  {
    q: s("What if just one planet is slightly outside the Rahu-Ketu arc?", "ஒரு கிரகம் ராகு-கேது வட்டவாயத்திற்கு சிறிது வெளியே இருந்தால் என்ன?"),
    a: s(
      "Then strictly speaking, the enclosure is broken and the full Kala Sarpa dosham does not apply. A planet very close to the Rahu or Ketu boundary is a 'border zone' case — astrologers judge this from the full chart. Even in a border case, if the planet outside the arc is strong, it sufficiently breaks the enclosure.",
      "அப்படி என்றால், கடுமையாக சொல்லும்போது, அடைப்பு உடைகிறது மற்றும் முழு கால சர்ப்ப தோஷம் பொருந்தாது. ராகு அல்லது கேது எல்லைக்கு மிக அருகே உள்ள கிரகம் 'எல்லை மண்டல' வழக்கு — ஜோதிடர்கள் இதை முழு ஜாதகத்திலிருந்து தீர்மானிக்கிறார்கள். எல்லை வழக்கிலும், வட்டவாயத்திற்கு வெளியே உள்ள கிரகம் வலிமையாக இருந்தால், அது அடைப்பை போதுமான அளவு உடைக்கிறது."
    ),
  },
  {
    q: s("Two astrologers gave me different opinions — why?", "இரண்டு ஜோதிடர்கள் வெவ்வேறு கருத்து சொன்னார்கள் — ஏன்?"),
    a: s(
      "Different astrologers use slightly different criteria. Some accept near-enclosures; some count Uranus or Neptune; some use different divisional charts. Thirukanitham tradition requires all 7 classical planets to be strictly within the Rahu-to-Ketu clockwise arc in the rasi chart. If you are in a border case, the rest of the chart matters more than the dosham label.",
      "வெவ்வேறு ஜோதிடர்கள் சிறிது வேறுபட்ட அளவுகோல்களை பயன்படுத்துகிறார்கள். சிலர் நெருங்கிய-அடைப்பை ஏற்கிறார்கள்; சிலர் யுரேனஸ் அல்லது நெப்டியூனை எண்ணுகிறார்கள்; சிலர் வேறுபட்ட வர்க ஜாதகங்களை பயன்படுத்துகிறார்கள். திருக்கணித மரபு ராசி ஜாதகத்தில் கடிகார திசையில் ராகுவிலிருந்து கேதுவரை 7 கிரகங்களும் கடுமையாக இருக்க வேண்டும் என்று கோருகிறது. எல்லை வழக்கில் இருந்தால், தோஷ முத்திரையை விட ஜாதகத்தின் மற்ற பகுதி முக்கியம்."
    ),
  },
  {
    q: s("Does Kala Sarpa dosham ease as one gets older?", "வயது அதிகரிக்கும்போது கால சர்ப்ப தோஷம் குறையுமா?"),
    a: s(
      "Yes, in practice. The dosham typically feels heaviest during the Rahu mahadasha and eases as the person moves into benefic dashas. Many with Kala Sarpa report that after the first major Rahu period, life opens noticeably. The tradition says the chart asks you to earn your rise — once earned, the dosham has fulfilled its purpose.",
      "ஆம், நடைமுறையில். தோஷம் வழக்கமாக ராகு மஹாதசையில் மிகவும் கனமாக உணரப்பட்டு, சாதகமான தசைகளுக்கு நகரும்போது குறைகிறது. கால சர்ப்பம் கொண்ட பலர் முதல் முக்கிய ராகு காலத்திற்குப் பிறகு வாழ்க்கை கணிசமாக திறக்கிறது என்று சொல்கிறார்கள். பாரம்பரியம் சொல்கிறது ஜாதகம் உன் உயர்வை உழைத்துப் பெறும்படி கேட்கிறது — ஒருமுறை சம்பாதிக்கப்பட்டால், தோஷம் அதன் நோக்கத்தை நிறைவேற்றியிருக்கிறது."
    ),
  },
];

// ─── DOSHAM: PITHRU ────────────────────────────────────────────────────────────

export const DOSHAM_PITHRU = {
  eyebrow:  s("Dosham · Pithru Dosham", "தோஷம் · பித்ரு தோஷம்"),
  h1:       s("Pithru Dosham (Ancestral Karma)", "பித்ரு தோஷம் (முன்னோர் கர்மம்)"),
  lead:     s(
    "Pithru dosham is the chart's signal that the ancestral line carries unacknowledged duty — visible in the affliction of the Sun, the 9th house, and recurring family patterns. It calls for remembrance and gratitude rather than fear. Here is what it truly means, how it is read, and the traditional pariharam.",
    "பித்ரு தோஷம் வம்சம் ஒப்புக்கொள்ளப்படாத கடமை சுமக்கிறது என்ற ஜாதகத்தின் அறிகுறி — சூரியனின் பீடன், 9-ஆம் பாவம், மீண்டும் வரும் குடும்ப அமைப்புகளில் தெரியும். இது பயமல்ல — நினைவு மற்றும் நன்றியை அழைக்கிறது. அதன் உண்மையான பொருள், எப்படி படிக்கப்படுகிறது, பாரம்பரிய பரிகாரம் இங்கே."
  ),
  what_h2:   s("What Pithru dosham means", "பித்ரு தோஷம் என்றால் என்ன"),
  what_body: s(
    "In Tamil astrology, the Sun (Suryan) represents the father, forefathers, and the dharmic line of ancestral blessing that flows down through a family. 'Pithru' means ancestors — father (pitha), grandfather (pitamaha), and great-grandfather (prapitamaha). When the Sun is afflicted — particularly by Rahu's conjunction, creating Pithru-Rahu yoga — or when the 9th house (the pitrusthanam, seat of dharma and ancestral grace) is under malefic pressure, the flow of ancestral blessing is disrupted. The tradition's teaching is not punishment but responsibility: the family carries accumulated duty that remembrance, rites, and sincere service can settle.",
    "தமிழ் ஜோதிடத்தில், சூரியன் தந்தை, முன்னோர், குடும்பத்தில் கீழே பாயும் தர்ம வழி முன்னோர் ஆசீர்வாதத்தை குறிக்கிறது. 'பித்ரு' என்றால் முன்னோர் — தந்தை (பிதா), தாத்தா (பிதாமஹா), கொள்ளுத்தாத்தா (பிரபிதாமஹா). சூரியன் பீடிக்கப்படும்போது — குறிப்பாக ராகுவின் சேர்க்கையால் பித்ரு-ராகு யோகம் உருவாகும்போது — அல்லது 9-ஆம் பாவம் (பித்ரு ஸ்தானம் — தர்மம் மற்றும் முன்னோர் அருளின் இடம்) தீய கிரக அழுத்தத்தில் இருக்கும்போது, முன்னோர் ஆசீர்வாத ஓட்டம் தடைப்படுகிறது. மரபின் போதனை தண்டனையல்ல — பொறுப்பு: குடும்பம் நினைவு, சடங்குகள், மனமார்ந்த சேவையால் தீர்க்கப்படக்கூடிய திரட்டப்பட்ட கடமையை சுமக்கிறது."
  ),
  calc_h2:   s("How Pithru dosham is identified", "பித்ரு தோஷம் எப்படி கண்டறியப்படுகிறது"),
  calc_body: s(
    "The primary indicator is the Sun-Rahu conjunction (Pithru-Rahu yoga) in any house of the rasi chart. Secondary indicators: Rahu in the 9th house (the ancestral station); the 9th lord afflicted by Rahu, Saturn, or Mars; the Sun placed in the 6th, 8th, or 12th house (dusthanas); Sun-Saturn conjunction or aspect. In Thirukanitham, if both the 9th and 5th houses are under simultaneous pressure, the dosham is stronger. Jupiter's strength alongside is always assessed — strong Jupiter acts as a natural shield even where the Sun is under pressure.",
    "முதன்மையான காட்டி ராசி ஜாதகத்தில் எந்த பாவத்திலும் சூரிய-ராகு சேர்க்கை (பித்ரு-ராகு யோகம்). இரண்டாம் நிலை காட்டிகள்: ராகு 9-ஆம் பாவத்தில் (முன்னோர் ஸ்தானம்); 9-ஆம் அதிபதி ராகு, சனி, அல்லது செவ்வாயால் பீடிக்கப்பட்டிருப்பது; சூரியன் 6, 8 அல்லது 12-ஆம் பாவத்தில் (துஷ்ட பாவங்கள்); சூரிய-சனி சேர்க்கை அல்லது பார்வை. திருக்கணிதத்தில் 9-ஆம் மற்றும் 5-ஆம் பாவங்கள் ஒரே நேரத்தில் அழுத்தத்தில் இருந்தால் தோஷம் வலிமையாகப் படிக்கப்படுகிறது. சூரியனுடன் குருவின் நிலையும் எப்போதும் மதிப்பிடப்படுகிறது — சூரியன் அழுத்தத்தில் இருந்தாலும் வலிமையான குரு இயற்கையான கேடயமாக செயல்படுகிறது."
  ),
  brings_h2: s("What Pithru dosham can bring", "பித்ரு தோஷம் என்ன கொண்டு வரலாம்"),
  brings_intro: s(
    "These are tendencies, not fixed outcomes. The tradition is clear that Pithru dosham is the most response-sensitive of the doshams — it reliably lightens when the family takes up ancestral rites sincerely. The chart shows the pattern; the pattern responds to action.",
    "இவை போக்குகள் — நிலையான விளைவுகள் அல்ல. பாரம்பரியம் தெளிவாக சொல்கிறது: பித்ரு தோஷம் தோஷங்களில் மிகவும் 'பதிலளிக்கக்கூடியது' — குடும்பம் மனமார்ந்து முன்னோர் சடங்குகளை எடுக்கும்போது நம்பகமாக குறைகிறது. ஜாதகம் அமைப்பைக் காட்டுகிறது; அமைப்பு செயலுக்கு பதில் சொல்கிறது."
  ),
  brings_categories: [
    {
      heading: s("Fortune & Career", "பாக்கியம் & தொழில்"),
      items: [
        s("Effort that does not convert to results in proportion — others with similar work advance while this person faces unexplained ceilings.", "முயற்சி விகிதாசாரமாக பலனாக மாறாமல் — ஒத்த வேலை செய்வோர் முன்னேறும்போது இந்த நபர் விவரிக்கமுடியாத உயரளவுகளை எதிர்கொள்கிறார்."),
        s("A ceiling that appears just before major breakthroughs — one step short of the culmination, repeatedly.", "முக்கிய திருப்புமுனைகளுக்கு சரியாக முன்பு வரும் உயரளவு — திரும்பத்திரும்ப உச்சத்திற்கு ஒரு படி குறைவாக."),
        s("Fortune opens noticeably after ancestral rites are performed — this is the classic pattern in Tamil tradition.", "முன்னோர் சடங்குகள் செய்யப்பட்ட பிறகு பாக்கியம் கணிசமாக திறக்கிறது — தமிழ் மரபில் கிளாசிக் அமைப்பு இது."),
        s("A father or paternal figure who is absent, distant, or whose blessings feel blocked — improving this relationship often parallels the dosham's easing.", "இல்லாத, தூரமான அல்லது ஆசீர்வாதம் தடைபட்டதாக உணரும் தந்தை அல்லது தந்தை போன்ற நபர் — இந்த உறவை மேம்படுத்துவது பெரும்பாலும் தோஷம் குறைவதோடு இணையாக நடக்கும்."),
        s("The dosham eases gradually as tarpan is maintained — usually a clear opening in fortune is felt within one to two years of regular practice.", "தர்ப்பணம் தொடர்ந்தோடும்போது தோஷம் படிப்படியாக குறைகிறது — வழக்கமாக வழக்கமான நடைமுறையின் ஒன்று இரண்டு ஆண்டுகளில் பாக்கியத்தில் தெளிவான திறப்பு உணரப்படுகிறது."
        ),
      ],
    },
    {
      heading: s("Health & Wellbeing", "ஆரோக்கியம் & நலம்"),
      items: [
        s("Recurring health conditions in the family that follow similar patterns across generations — not necessarily severe, but persistent.", "தலைமுறைகளில் ஒத்த அமைப்புகளை பின்பற்றும் குடும்பத்தில் மீண்டும் வரும் ஆரோக்கிய நிலைகள் — தீவிரமாக இல்லாவிட்டாலும் நிலையாக."),
        s("Male members of the family facing health challenges where the Sun's affliction runs through the paternal line.", "சூரியனின் பீடன் தந்தை வழியில் செல்லும்போது குடும்பத்தில் ஆண்கள் ஆரோக்கிய சவால்களை எதிர்கொள்கிறார்கள்."),
        s("Chronic conditions that respond slowly to treatment — tarpan and annadanam traditionally support recovery alongside medical care.", "மெதுவாக சிகிச்சைக்கு பதிலளிக்கும் நாள்பட்ட நிலைகள் — மருத்துவ பராமரிப்புடன் தர்ப்பணம் மற்றும் அன்னதானம் மீட்சியை ஆதரிக்கும்."),
        s("Mental fatigue — a feeling of carrying an invisible weight that lifts when ancestral duty is honoured.", "மன சோர்வு — முன்னோர் கடமை மதிக்கப்படும்போது உயரும் ஒரு அதிர்வற்ற சுமை சுமக்கும் உணர்வு."),
      ],
    },
    {
      heading: s("Children & Lineage", "சந்தானம் & வம்சம்"),
      items: [
        s("Delay in children — the blessing of progeny feels paused until tarpan is established; once rites begin, conception often follows.", "குழந்தைகளில் தாமதம் — தர்ப்பணம் நிலைபெறும் வரை சந்தான ஆசீர்வாதம் நிறுத்தப்பட்டதாக உணரப்படுகிறது; சடங்குகள் தொடங்கிய பிறகு பெரும்பாலும் கருத்தரிப்பு வருகிறது."),
        s("Children's early years may involve extra health care — they typically stabilise as the pariharam is sustained.", "குழந்தைகளின் ஆரம்பகால ஆண்டுகளில் கூடுதல் ஆரோக்கிய கவனிப்பு தேவைப்படலாம் — பரிகாரம் தொடர்வதால் இவர்கள் வழக்கமாக நிலைப்படுகிறார்கள்."),
        s("The relationship with the father or paternal elders may feel strained — honouring living elders is as much a remedy as temple worship.", "தந்தை அல்லது தந்தை வழி மூத்தோருடனான உறவு கடினமாகவோ முழுமையற்றதாகவோ உணரலாம் — வாழ்க்கையில் மூத்தோரை மதிப்பது கோயில் வழிபாட்டைப் போலவே பரிகாரம்."),
        s("Once regular tarpan is maintained, the next generation shows marked improvement — this is the tradition's most consistent observation.", "வழக்கமான தர்ப்பணம் பராமரிக்கப்பட்டவுடன் அடுத்த தலைமுறை குறிப்பிடத்தக்க முன்னேற்றத்தை காட்டுகிறது — இது மரபின் மிகவும் நிலையான கவனிப்பு."
        ),
      ],
    },
  ],
  howtoread_h2: s("How to read your own chart for Pithru dosham", "உங்கள் ஜாதகத்தில் பித்ரு தோஷம் எப்படி பார்ப்பது"),
  howtoread_intro: s(
    "Open your Thirukanitham jadhagam and focus on four key areas: the Sun's house and whether Rahu is with it, the 9th house and its condition, Jupiter's placement and strength, and the 5th house. Reading all four together gives the complete picture.",
    "உங்கள் திருக்கணித ஜாதகத்தை எடுத்து நான்கு முக்கிய பகுதிகளில் கவனம் செலுத்துங்கள்: சூரியனின் பாவம் மற்றும் ராகு அதனுடன் இருக்கிறதா, 9-ஆம் பாவம் மற்றும் அதன் நிலை, குருவின் இடம் மற்றும் பலம், 5-ஆம் பாவம். நான்கையும் சேர்த்து படிப்பது முழு படத்தை தருகிறது."
  ),
  howtoread_steps: [
    {
      h: s("1 — Find the Sun and check for Rahu conjunction", "1 — சூரியனை கண்டறிந்து ராகு சேர்க்கையை சரிபாருங்கள்"),
      b: s(
        "Locate Suryan (Sun) in the rasi chart. Is Rahu in the same house? Sun-Rahu conjunction in any house is the Pithru-Rahu yoga — the primary marker. Also note if Rahu opposes the Sun (in the 7th from it), as some traditions read this as a secondary indicator.",
        "ராசி ஜாதகத்தில் சூரியனை கண்டுபிடியுங்கள். ராகு அதே பாவத்தில் இருக்கிறதா? எந்த பாவத்திலும் சூரிய-ராகு சேர்க்கை பித்ரு-ராகு யோகம் — முதன்மையான குறி. ராகு சூரியனிலிருந்து 7-ல் (எதிராக) இருக்கிறதா என்றும் குறிக்கவும், சில மரபுகள் இதை இரண்டாம் நிலை காட்டியாக படிக்கின்றன."
      ),
    },
    {
      h: s("2 — Check the 9th house and its lord", "2 — 9-ஆம் பாவத்தையும் அதன் அதிபதியையும் சரிபாருங்கள்"),
      b: s(
        "The 9th house is the pitrusthanam — the seat of dharma, the father, and ancestral blessings. Count 9 houses from your Lagna. Is Rahu, Saturn, or Mars sitting there? Find the 9th lord and check if it is in a dusthana (6th, 8th, or 12th house) or afflicted by malefics. Each of these strengthens the dosham reading.",
        "9-ஆம் பாவம் பித்ரு ஸ்தானம் — தர்மம், தந்தை, முன்னோர் ஆசீர்வாதத்தின் இடம். உங்கள் லக்னத்திலிருந்து 9 பாவங்கள் எண்ணுங்கள். ராகு, சனி அல்லது செவ்வாய் அங்கே அமர்ந்திருக்கிறதா? 9-ஆம் அதிபதியை கண்டுபிடித்து அது துஷ்ட பாவத்தில் (6, 8 அல்லது 12-ஆம் பாவம்) இருக்கிறதா அல்லது தீய கிரகங்களால் பீடிக்கப்பட்டிருக்கிறதா என்று சரிபாருங்கள்."
      ),
    },
    {
      h: s("3 — Check Jupiter's placement and strength", "3 — குருவின் இடம் மற்றும் பலத்தை சரிபாருங்கள்"),
      b: s(
        "Jupiter (Guru) is the dharma karaka and the natural protector of the 9th and 5th houses. Find it in the chart. Is it in its own sign (Dhanus or Meena), exalted (Kataka), or afflicted? Does Guru directly aspect the 9th or Sun through its 5th, 7th, or 9th aspect? A strong Guru significantly softens Pithru dosham — it acts as a natural mediator between the ancestor's unresolved energy and the present family.",
        "குரு தர்ம காரகன் மற்றும் 9-ஆம் மற்றும் 5-ஆம் பாவங்களின் இயற்கையான பாதுகாவலன். ஜாதகத்தில் அதை கண்டுபிடியுங்கள். அது சொந்த ராசியில் (தனுஸ் அல்லது மீனம்), உச்சத்தில் (கடகம்) இருக்கிறதா அல்லது பீடிக்கப்பட்டிருக்கிறதா? குரு 9-ஆம் பாவத்தை அல்லது சூரியனை 5, 7 அல்லது 9-ஆவது பார்வை மூலம் நேரடியாக பார்க்கிறதா? வலிமையான குரு பித்ரு தோஷத்தை கணிசமாக மென்மையாக்குகிறது."
      ),
    },
    {
      h: s("4 — Check the 5th house alongside the 9th", "4 — 9-ஆம் பாவத்துடன் 5-ஆம் பாவத்தை சரிபாருங்கள்"),
      b: s(
        "The 5th house (putra sthana) carries the lineage blessings flowing from ancestors. When both 9th and 5th houses are under simultaneous pressure, the dosham is stronger and its effect on children and fortune more pronounced. When only one is affected, the dosham is milder and responds faster to pariharam.",
        "5-ஆம் பாவம் (புத்திர ஸ்தானம்) முன்னோரிடமிருந்து கீழே பாயும் வம்ச ஆசீர்வாதங்களை சுமக்கிறது. 9-ஆம் மற்றும் 5-ஆம் பாவங்கள் ஒரே நேரத்தில் அழுத்தத்தில் இருக்கும்போது, தோஷம் வலிமையாகி குழந்தை மற்றும் பாக்கியம் மீதான தாக்கம் அதிகமாகும். ஒன்று மட்டும் பாதிக்கப்பட்டால், தோஷம் மிதமாகி பரிகாரத்துக்கு வேகமாக பதில் சொல்கிறது."
      ),
    },
    {
      h: s("5 — Note the dasha — especially Sun, Rahu, and Saturn dashas", "5 — தசையை குறிக்கவும் — குறிப்பாக சூரியன், ராகு, சனி தசைகள்"),
      b: s(
        "Pithru dosham's pull is felt most during Sun mahadasha (6 years), Rahu mahadasha (18 years), and Saturn mahadasha (19 years). Jupiter mahadasha (16 years) typically opens the ancestral blessing-flow and brings notable improvement. If you are in Jupiter's mahadasha or antardasha, this is the natural window to perform tarpan and see the dosham ease quickly.",
        "பித்ரு தோஷத்தின் இழுப்பு சூரிய மஹாதசையில் (6 ஆண்டு), ராகு மஹாதசையில் (18 ஆண்டு), சனி மஹாதசையில் (19 ஆண்டு) மிகவும் உணரப்படுகிறது. குரு மஹாதசை (16 ஆண்டு) வழக்கமாக முன்னோர் ஆசீர்வாத ஓட்டத்தை திறந்து குறிப்பிடத்தக்க முன்னேற்றம் தருகிறது. குரு மஹாதசை அல்லது அந்தர்தசையில் இருந்தால், இது தர்ப்பணம் செய்து தோஷம் விரைவாக குறைவதை பார்க்கும் இயற்கையான காலகட்டம்."
      ),
    },
  ],
  cancel_h2:  s("When Pithru dosham lightens", "பித்ரு தோஷம் குறையும் நிலைகள்"),
  cancel_body: s(
    "Pithru dosham lightens most directly when the family resumes and maintains ancestral rites — this is the tradition's primary teaching. Jupiter aspecting or placed in the 9th is a strong natural softener. Sun in its own sign (Simha/Leo) or exalted (Mesha/Aries) reduces Rahu's conjunction impact. When a senior member of the family performs regular Amavasya tarpan, the pattern reliably becomes quieter within a generation. Unlike doshams rooted in a planet's fixed chart position, Pithru dosham is uniquely responsive: the action directly addresses the cause, and results tend to be visible within one to three years of sincere practice.",
    "குடும்பம் முன்னோர் சடங்குகளை மீண்டும் தொடங்கி பராமரிக்கும்போது பித்ரு தோஷம் மிகவும் நேரடியாக குறைகிறது — இது மரபின் முதன்மையான போதனை. 9-ஆம் பாவத்தில் குரு பார்வை அல்லது நிலை வலிமையான இயற்கையான மென்மையாக்கி. சூரியன் சொந்த ராசியில் (சிம்மம்) அல்லது உச்சத்தில் (மேஷம்) இருந்தால் ராகு சேர்க்கையின் தாக்கம் குறைகிறது. குடும்பத்தின் மூத்த உறுப்பினர் வழக்கமான அமாவாசை தர்ப்பணம் செய்யும்போது, அமைப்பு ஒரு தலைமுறையில் நம்பகமாக அமைதியாகிறது. கிரகத்தின் நிலையான ஜாதக நிலையில் வேரூன்றிய தோஷங்களைப் போலல்லாமல், பித்ரு தோஷம் தனித்துவமாக பதிலளிக்கக்கூடியது: செயல் காரணத்தை நேரடியாக தீர்க்கிறது; ஒன்று மூன்று ஆண்டுகளில் பலன்கள் தெரியும்."
  ),
  pariharam_h2:   s("Pariharam — honouring the ancestors", "பரிகாரம் — முன்னோரை மரியாதைப்படுத்துதல்"),
  pariharam_body: s(
    "The most effective pariharam is Amavasya tarpanam — offered to ancestors on the new-moon day each month with sesamum (gingelly), darbha grass, and water, facing south, by the senior male of the family. The most sacred locations are Rameswaram (where sea-water tarpan is performed, considered the most powerful in the Tamil tradition) and Gaya in Bihar. Feeding Brahmins or the needy on the ancestor's death anniversary (mahalayam tithi), lighting a sesame-oil lamp on Sundays, and caring sincerely for elderly parents are day-to-day expressions of the pariharam. Mahalaya Amavasya — the last day of the Pithru Paksha fortnight in the Kanni month — is the most important annual day for Pithru karma.",
    "மிகவும் பயனுள்ள பரிகாரம் அமாவாசை தர்ப்பணம் — குடும்பத்தின் மூத்த ஆண் தெற்கு நோக்கி நல்லெண்ணெய் விதைகள் (எள்), தர்ப்பை புல், நீர் ஆகியவற்றால் ஒவ்வொரு மாதமும் அமாவாசை நாளில் முன்னோருக்கு செய்யும் தர்ப்பணம். மிகவும் புனித இடங்கள் ராமேஸ்வரம் (கடல் நீர் தர்ப்பணம் செய்யப்படுகிறது, தமிழ் மரபில் மிகவும் சக்தி வாய்ந்ததாக கருதப்படுகிறது) மற்றும் பீகாரில் காயா. முன்னோரின் மரண நாளில் (மஹாலய திதி) பிராமணர்களுக்கு அல்லது ஏழைகளுக்கு அன்னதானம், ஞாயிற்றுக்கிழமைகளில் நல்லெண்ணெய் விளக்கேற்றுதல், முதியோர் பெற்றோரை மனமார்ந்து பராமரித்தல் ஆகியவை தினசரி பரிகாரத்தின் வெளிப்பாடுகள். மஹாலய அமாவாசை — கன்னி மாதத்தில் பித்ரு பட்சம் பதினைந்து நாட்களின் கடைசி நாள் — அனைத்து இந்து குடும்பங்களுக்கும் பித்ரு கர்மத்தின் மிகவும் முக்கியமான வார்ஷிக நாள்."
  ),
  slokam_label:  s("Suryan (Sun / Pithru) slokam", "சூரியன் (பித்ரு) ஸ்லோகம்"),
  slokam_text:   s(
    "Japa-kusuma-sankasham kashyapeyam maha-dyutim\nTamo-rim sarva-paapaghnam pranato'smi divakaram",
    "ஜபா குசும சங்காசம் காஷ்யபேயம் மஹாத்யுதிம்\nதமோரிம் சர்வ பாபக்னம் ப்ரணதோஸ்மி திவாகரம்"
  ),
  slokam_meaning: s(
    "I bow to Divakara (the Sun) — red like the japa flower, brilliantly radiant, son of Kashyapa, the enemy of darkness, the destroyer of all sins.",
    "ஜபா மலர் போல் சிவந்தவனே, மஹாதேஜஸ் கொண்டவனே, காஷ்யப மகனே, இருளின் பகைவனே, சர்வ பாபங்களை போக்குபவனே — திவாகரனே, உன்னை வணங்குகிறேன்."
  ),
  related_h2: s("Related", "தொடர்புடையவை"),
};

export const DOSHAM_PITHRU_FAQ = [
  {
    q: s("Do I need to know my ancestor's exact death date to perform tarpan?", "தர்ப்பணம் செய்ய முன்னோரின் சரியான மரண தேதி தெரிய வேண்டுமா?"),
    a: s(
      "The Mahalaya Amavasya day (the new moon at the end of Pithru Paksha in the Kanni month) is dedicated to all ancestors — known and unknown — so no individual dates are needed for this day. For individual tithi tarpan on the death anniversary, a priest can guide the family. If dates are unknown, a general tarpan with the intent to honour all ancestors is accepted in most traditions.",
      "கன்னி மாதத்தில் பித்ரு பட்சத்தின் இறுதியில் வரும் மஹாலய அமாவாசை நாள் அனைத்து முன்னோருக்கும் — தெரிந்தவர்களுக்கும் தெரியாதவர்களுக்கும் — அர்ப்பணிக்கப்பட்டது; இதற்கு தனிப்பட்ட தேதிகள் தேவையில்லை. மரண நாளில் தனிப்பட்ட திதி தர்ப்பணத்திற்கு புரோகிதர் குடும்பத்திற்கு வழிகாட்டலாம். தேதிகள் தெரியாவிட்டால், அனைத்து முன்னோரையும் மரியாதைப்படுத்தும் நோக்கத்துடன் பொது தர்ப்பணம் பெரும்பாலான மரபுகளில் ஏற்றுக்கொள்ளப்படுகிறது."
    ),
  },
  {
    q: s("Can women perform tarpan?", "பெண்கள் தர்ப்பணம் செய்யலாமா?"),
    a: s(
      "In most traditional Tamil practices, tarpan is performed by the senior male of the family. In families without a male heir or where the male is unable, some Shaiva and Vaishnava traditions permit women to perform it, or a close male relative stands in. Sincerity matters as much as the exact form — a priest can advise on the family tradition.",
      "பெரும்பாலான பாரம்பரிய தமிழ் நடைமுறைகளில் தர்ப்பணம் குடும்பத்தின் மூத்த ஆண் உறுப்பினரால் செய்யப்படுகிறது. ஆண் வாரிசு இல்லாத அல்லது ஆண் இயலாத குடும்பங்களில் சில சைவ மற்றும் வைணவ மரபுகள் பெண்களை செய்ய அனுமதிக்கின்றன, அல்லது ஒரு நெருங்கிய ஆண் உறவினர் நிற்கிறார். சரியான வடிவம் போலவே மனத்தூய்மையான நோக்கமும் முக்கியம் — புரோகிதர் குடும்ப மரபில் ஆலோசனை தரலாம்."
    ),
  },
  {
    q: s("Is Pithru dosham permanent?", "பித்ரு தோஷம் நிரந்தரமானதா?"),
    a: s(
      "No — it is the tradition's most responsive dosham. It eases directly as the family takes up ancestral rites. Unlike a dosham from a fixed planetary placement, Pithru dosham responds to action: tarpan, annadanam, respect to elders, and sincere care for parents. Families who establish regular Amavasya tarpan typically see a gradual but clear opening in fortune and family wellbeing within one or two years.",
      "இல்லை — இது மரபின் மிகவும் பதிலளிக்கக்கூடிய தோஷம். குடும்பம் முன்னோர் சடங்குகளை எடுத்தவுடன் நேரடியாக குறைகிறது. நிலையான கிரக நிலையால் ஏற்படும் தோஷத்தைப் போலல்லாமல், பித்ரு தோஷம் செயலுக்கு பதில் சொல்கிறது: தர்ப்பணம், அன்னதானம், மூத்தோர் மரியாதை, பெற்றோரை மனமார்ந்து பராமரித்தல். வழக்கமான அமாவாசை தர்ப்பணத்தை நிலைநாட்டும் குடும்பங்கள் ஒன்று இரண்டு ஆண்டுகளில் பாக்கியம் மற்றும் குடும்ப நலனில் படிப்படியான ஆனால் தெளிவான திறப்பை பார்க்கிறார்கள்."
    ),
  },
  {
    q: s("Does Pithru dosham affect the maternal line too?", "பித்ரு தோஷம் தாய் வழியையும் பாதிக்குமா?"),
    a: s(
      "The paternal line (pitruvamsha) is primary in most traditions and is read through the Sun and 9th house. A separate concept — sometimes called Matru dosham — applies to the maternal line and is read through the Moon's condition, the 4th house, and its lord. When both the Sun and Moon are afflicted, both lines may be involved. A priest familiar with the family's tradition can advise on which set of ancestral rites best addresses the pattern.",
      "தந்தை வழி (பித்ரு வம்சம்) பெரும்பாலான மரபுகளில் முதன்மையானது; சூரியன் மற்றும் 9-ஆம் பாவம் வழியாக படிக்கப்படுகிறது. தாய் வழிக்கு ஒரு தனி கருத்து — சில நேரங்களில் மாத்ரு தோஷம் என்று அழைக்கப்படுவது — சந்திரனின் நிலை, 4-ஆம் பாவம், அதன் அதிபதி ஆகியவற்றால் படிக்கப்படுகிறது. சூரியன் மற்றும் சந்திரன் இரண்டும் பீடிக்கப்படும்போது, இரு வழிகளும் சம்பந்தப்படலாம். குடும்பத்தின் குறிப்பிட்ட மரபை அறிந்த புரோகிதர் எந்த முன்னோர் சடங்குகள் சிறப்பாக நிவர்த்திக்கும் என்று ஆலோசனை தரலாம்."
    ),
  },
];

// ─── DOSHAM: KALATHRA ──────────────────────────────────────────────────────────

export const DOSHAM_KALATHRA = {
  eyebrow:  s("Dosham · Kalathra Dosham", "தோஷம் · களத்திர தோஷம்"),
  h1:       s("Kalathra Dosham (Spouse & Marriage Affliction)", "களத்திர தோஷம் (துணை & திருமண பீடன)"),
  lead:     s(
    "Kalathra dosham is the broad name for stress in the 7th house — the house of the spouse and marriage. Unlike Sevvai (Mangal) dosham which is specifically Mars, Kalathra covers any malefic planet pressing the 7th house, its lord, or Venus. It is about timing, maturity, and matching — not a refusal of marriage. Here is what it means, how it is read, and the pariharam.",
    "களத்திர தோஷம் 7-ஆம் பாவத்தில் — துணை மற்றும் திருமணத்தின் பாவத்தில் — அழுத்தத்தின் பரந்த பெயர். குறிப்பாக செவ்வாயை மட்டும் குறிக்கும் செவ்வாய் தோஷத்திலிருந்து வேறுபட்டு, களத்திரம் 7-ஆம் பாவம், அதன் அதிபதி அல்லது சுக்கிரனை அழுத்தும் எந்த தீய கிரகத்தையும் உள்ளடக்குகிறது. இது காலம், முதிர்ச்சி, பொருத்தம் பற்றியது — திருமண மறுப்பல்ல. அதன் பொருள், எப்படி படிக்கப்படுகிறது, பரிகாரம் இங்கே."
  ),
  what_h2:   s("What Kalathra dosham means", "களத்திர தோஷம் என்றால் என்ன"),
  what_body: s(
    "'Kalathra' means spouse in Sanskrit. This dosham covers any strong malefic pressure on the 7th house (the primary house of marriage), the 7th lord, or Venus — the natural significator of love, beauty, and marriage. Each malefic brings a distinct quality: Saturn in 7th delays but eventually stabilises; Mars brings fire and friction (which is Sevvai dosham when it presses the marriage houses); Rahu introduces unexpected or unconventional elements; Ketu brings detachment; an unmodified Sun creates ego-driven conflicts. The dosham is not a verdict against marriage but a signal about the quality and timing required for it to work.",
    "'களத்திர' என்றால் சம்ஸ்கிருதத்தில் துணை. இந்த தோஷம் 7-ஆம் பாவத்தில் (திருமணத்தின் முதன்மை பாவம்), 7-ஆம் அதிபதியில் அல்லது சுக்கிரனில் — அன்பு, அழகு, திருமணத்தின் இயற்கையான காரகன் — வலுவான தீய கிரக அழுத்தத்தை உள்ளடக்குகிறது. ஒவ்வொரு தீய கிரகமும் தனித்துவமான தரத்தை கொண்டுவருகிறது: 7-ல் சனி தாமதப்படுத்துகிறது ஆனால் இறுதியில் நிலைப்படுத்துகிறது; செவ்வாய் நெருப்பும் உராய்வும் கொண்டுவருகிறது (திருமண பாவங்களை அழுத்தும்போது செவ்வாய் தோஷமே); ராகு எதிர்பாராத அல்லது மரபுக்கு மாறான கூறுகளை அறிமுகப்படுத்துகிறது; கேது விலகலை கொண்டுவருகிறது; சுதந்திர சூரியன் ஆணவம் நிறைந்த மோதல்களை உருவாக்குகிறது. தோஷம் திருமணத்திற்கு எதிரான தீர்ப்பல்ல — அது செயல்படுவதற்கு தேவையான தரம் மற்றும் காலம் பற்றிய அறிகுறி."
  ),
  calc_h2:   s("How Kalathra dosham is assessed", "களத்திர தோஷம் எப்படி மதிப்பிடப்படுகிறது"),
  calc_body: s(
    "Multiple factors are weighed: which planet(s) sit in the 7th house from Lagna, the condition of the 7th lord (its sign, dignity, and house it occupies), the placement and sign of Venus (exalted in Meena, debilitated in Kanya), and Jupiter's aspect on Venus or the 7th house. The 7th from the Moon (emotional compatibility) and from Venus (quality of love) are secondary references. Strength is proportional to how many factors are simultaneously stressed — one weak point is a mild dosham; three or four together require careful matching and pariharam.",
    "பல காரணிகள் எடைபோடப்படுகின்றன: லக்னத்திலிருந்து 7-ல் எந்த கிரகம் அமர்ந்திருக்கிறது, 7-ஆம் அதிபதியின் நிலை (அதன் ராசி, மரியாதை, அது இருக்கும் பாவம்), சுக்கிரனின் இடம் மற்றும் ராசி (மீனத்தில் உச்சம், கன்னியில் நீசம்), 7-ஆம் பாவத்தில் அல்லது சுக்கிரனில் குரு பார்வை. சந்திரனிலிருந்து 7 (உணர்வு பொருத்தம்) மற்றும் சுக்கிரனிலிருந்து 7 (காதலின் தரம்) இரண்டாம் நிலை குறிப்புகள். வலிமை எத்தனை காரணிகள் ஒரே நேரத்தில் அழுத்தப்படுகின்றன என்பதற்கு விகிதாசாரமானது — ஒரு பலவீனமான புள்ளி மிதமான தோஷம்; மூன்று நான்கு சேர்ந்தால் கவனமான பொருத்தம் மற்றும் பரிகாரம் தேவை."
  ),
  brings_h2: s("What Kalathra dosham can bring", "களத்திர தோஷம் என்ன கொண்டு வரலாம்"),
  brings_intro: s(
    "These are tendencies determined by which planet is pressing the 7th house. Saturn, Mars, Rahu, Ketu, and Sun each bring a different quality of challenge. The dosham is not a verdict against marriage — it is a signal about timing, temperament, and the kind of matching that will work.",
    "இவை 7-ஆம் பாவத்தை எந்த கிரகம் அழுத்துகிறது என்பதால் தீர்மானிக்கப்படும் போக்குகள். சனி, செவ்வாய், ராகு, கேது, சூரியன் ஒவ்வொன்றும் வேறுபட்ட தரத்தை கொண்டுவருகின்றன. தோஷம் திருமணத்திற்கு எதிரான தீர்ப்பல்ல — காலம், குணம், வேலை செய்யும் பொருத்தம் பற்றிய அறிகுறி."
  ),
  brings_categories: [
    {
      heading: s("Marriage Timing", "திருமண காலம்"),
      items: [
        s("Delay in marriage beyond the expected age — proposals arrive and dissolve before concluding; each near-miss adds to impatience.", "எதிர்பார்த்த வயதுக்கு அப்பால் திருமணத் தாமதம் — வரன்கள் வந்து முடிவதற்கு முன்பே கலைகின்றன; ஒவ்வொரு நெருங்கிய தவறலும் ஆவலின்மையை சேர்க்கிறது."),
        s("When Saturn is in the 7th: the right person arrives late, but once the marriage settles it tends to be durable and steady.", "7-ல் சனி இருக்கும்போது: சரியான நபர் தாமதமாக வருகிறார், ஆனால் திருமணம் நிலைபெற்றவுடன் நீடிக்கிறது."),
        s("When Rahu is in the 7th: the match may be unconventional or arrive through unexpected circumstances — not a negative, just unexpected.", "7-ல் ராகு இருக்கும்போது: வரன் மரபுக்கு மாறானதாக அல்லது எதிர்பாராத சூழ்நிலையில் வரலாம் — எதிர்மறையல்ல, எதிர்பாராதது மட்டும்."),
        s("A long phase of waiting that resolves suddenly — the dosham is time-sensitive, often clearing during the Venus or Jupiter dasha window.", "திடீரென தீர்வடையும் நீண்ட காத்திருப்பு கட்டம் — தோஷம் காலம்-சார்ந்தது; பெரும்பாலும் சுக்கிர அல்லது குரு தசை காலத்தில் தீர்கிறது."),
        s("Good porutham between two charts can compensate for individual dosham — the tradition's primary solution to Kalathra dosham.", "இரு ஜாதகங்களுக்கிடையே நல்ல பொருத்தம் தனிப்பட்ட தோஷத்தை சமன் செய்யலாம் — களத்திர தோஷத்திற்கான மரபின் முதன்மையான தீர்வு."),
      ],
    },
    {
      heading: s("Partnership Harmony", "திருமண ஒற்றுமை"),
      items: [
        s("Temperament differences that require conscious work — the chart is pointing to areas where growth matters more than natural fit.", "சிரமப்பட்டு வேலை செய்ய வேண்டிய குணம் வேறுபாடுகள் — ஜாதகம் இயல்பான பொருத்தத்தை விட வளர்ச்சி முக்கியம் என்ற பகுதிகளை சுட்டிக்காட்டுகிறது."),
        s("Ego clashes when the Sun afflicts the 7th — each partner pushes to lead rather than listen; finding where to yield is the growth.", "சூரியன் 7-ஐ பீடிக்கும்போது ஆணவ மோதல்கள் — ஒவ்வொரு துணையும் கேட்பதை விட தலைமை தாங்க முயல்கிறார்; எங்கே விட்டுக்கொடுப்பது என்பதை கண்டறிவதே வளர்ச்சி."),
        s("Emotional distance in phases when Ketu afflicts the 7th — a detached quality that comes and goes; spiritual practice helps ground this.", "கேது 7-ஐ பீடிக்கும்போது கட்டங்களில் உணர்ச்சி தூரம் — வந்து போகும் விலகிய குணம்; ஆன்மீக நடைமுறை இதை நிலைப்படுத்த உதவுகிறது."),
        s("Friction over roles, finances, or family boundaries (Saturn) — steady negotiation and clarity build the relationship better than expecting immediate agreement.", "பாத்திரங்கள், நிதி அல்லது குடும்ப எல்லைகள் குறித்த உராய்வு (சனி) — நிதானமான பேச்சுவார்த்தையும் தெளிவும் உடனடி ஒப்புதலை எதிர்பார்ப்பதை விட உறவை சிறப்பாக கட்டுகின்றன."),
        s("The same intensity that creates friction, when channelled through mutual respect, produces deep loyalty and enduring partnership.", "உராய்வை உருவாக்கும் அதே தீவிரம், பரஸ்பர மரியாதையால் திசைப்படுத்தப்படும்போது, ஆழமான விசுவாசம் மற்றும் நீடித்த கூட்டாண்மையை உருவாக்குகிறது."),
      ],
    },
    {
      heading: s("Family & Social Dynamics", "குடும்பம் & சமூக நிலை"),
      items: [
        s("Family pressure around marriage timeline — particularly felt when the expected age passes without a settled match.", "திருமண காலக்கெடு குறித்த குடும்ப அழுத்தம் — குறிப்பாக எதிர்பார்க்கப்பட்ட வயது நிலைப்பட்ட பொருத்தமின்றி கடந்துவிடும்போது உணரப்படுகிறது."),
        s("Unconventional matches that the family takes time to accept — what seems unusual often turns out to be the right fit.", "குடும்பம் ஏற்கவும் நேரம் ஆகும் மரபுக்கு மாறான பொருத்தங்கள் — அசாதாரணமாகத் தோன்றுவது பெரும்பாலும் சரியான பொருத்தமாக மாறுகிறது."),
        s("Health of the spouse may need extra attention — the 7th house in some classical readings also relates to the partner's longevity and vitality.", "துணையின் ஆரோக்கியம் கூடுதல் கவனிப்பு தேவைப்படலாம் — சில சாஸ்திர வாசிப்புகளில் 7-ஆம் பாவம் துணையின் ஆயுள் மற்றும் உயிரோட்டத்துடன் தொடர்புடையது."),
        s("Multiple relationships or a long search before the right match — in tradition this is addressed through pariharam and proper porutham before finalising, not after.", "சரியான பொருத்தம் வருவதற்கு முன்பு பல உறவுகள் அல்லது நீண்ட தேடல் — மரபில் இது முடிவு செய்வதற்கு முன்பு பரிகாரம் மற்றும் சரியான பொருத்தம் மூலம் தீர்க்கப்படுகிறது, பின்னர் அல்ல."),
      ],
    },
  ],
  howtoread_h2: s("How to read your own chart for Kalathra dosham", "உங்கள் ஜாதகத்தில் களத்திர தோஷம் எப்படி பார்ப்பது"),
  howtoread_intro: s(
    "Open your Thirukanitham jadhagam and focus on five things: what sits in the 7th house, the condition of the 7th lord, where Venus is placed and in what sign, whether Jupiter aspects the 7th house, and the running dasha of Venus or the 7th lord. These five together give the marriage picture.",
    "உங்கள் திருக்கணித ஜாதகத்தை எடுத்து ஐந்து விஷயங்களில் கவனம் செலுத்துங்கள்: 7-ஆம் பாவத்தில் என்ன இருக்கிறது, 7-ஆம் அதிபதியின் நிலை, சுக்கிரன் எங்கே உள்ளது மற்றும் எந்த ராசியில், குரு 7-ஆம் பாவத்தை பார்க்கிறதா, சுக்கிரனின் அல்லது 7-ஆம் அதிபதியின் நடக்கும் தசை. இந்த ஐந்தும் சேர்ந்து திருமண படத்தை தருகின்றன."
  ),
  howtoread_steps: [
    {
      h: s("1 — Check who sits in the 7th house", "1 — 7-ஆம் பாவத்தில் யார் அமர்ந்திருக்கிறார் என்று சரிபாருங்கள்"),
      b: s(
        "Find the 7th house from your Lagna in the south Indian chart. Is there a planet there? A benefic (Jupiter, Venus, or a well-placed Mercury or Moon) here is protective. A malefic (Saturn, Mars, Rahu, Ketu, or an unmodified Sun) creates the dosham. Multiple malefics together in the 7th intensify it considerably.",
        "தென்னிந்திய ஜாதகத்தில் உங்கள் லக்னத்திலிருந்து 7-ஆம் பாவத்தை கண்டறியுங்கள். அங்கே ஒரு கிரகம் இருக்கிறதா? சுப கிரகம் (குரு, சுக்கிரன், அல்லது நன்கு நிலைப்பட்ட புதன் அல்லது சந்திரன்) இங்கே இருந்தால் பாதுகாப்பு. தீய கிரகம் (சனி, செவ்வாய், ராகு, கேது, அல்லது சுதந்திர சூரியன்) தோஷத்தை உருவாக்குகிறது. பல தீய கிரகங்கள் 7-ல் சேர்ந்தால் அதை கணிசமாக தீவிரப்படுத்துகின்றன."
      ),
    },
    {
      h: s("2 — Check the 7th lord's condition", "2 — 7-ஆம் அதிபதியின் நிலையை சரிபாருங்கள்"),
      b: s(
        "The 7th lord is the planet ruling the sign in the 7th house. Find it in the chart. Is it in a good sign (own, exalted, or friendly) or a weak one (debilitated, enemy sign)? Is it in a dusthana — the 6th (conflict), 8th (hidden matters), or 12th (distance, isolation)? A 7th lord in the 6th often brings disputes; in the 8th, secrecy or partner's health concerns; in the 12th, distance or foreign elements in marriage.",
        "7-ஆம் அதிபதி 7-ஆம் பாவத்தில் உள்ள ராசியை ஆளும் கிரகம். ஜாதகத்தில் அதை கண்டுபிடித்து சரிபாருங்கள்: அது நல்ல ராசியில் (சொந்த, உச்சம் அல்லது நட்பு) அல்லது பலவீனமான ஒன்றில் (நீசம், பகை ராசி) இருக்கிறதா? துஷ்ட பாவத்தில் — 6-ல் (மோதல்), 8-ல் (மறைந்த விஷயங்கள்) அல்லது 12-ல் (தூரம், தனிமை) இருக்கிறதா? 7-ஆம் அதிபதி 6-ல் இருந்தால் பெரும்பாலும் தகராறுகள்; 8-ல், ரகசியம் அல்லது துணையின் ஆரோக்கிய கவலைகள்; 12-ல், திருமணத்தில் தூரம் அல்லது வெளிநாட்டு கூறுகள்."
      ),
    },
    {
      h: s("3 — Check Venus's sign and strength", "3 — சுக்கிரனின் ராசி மற்றும் பலத்தை சரிபாருங்கள்"),
      b: s(
        "Venus (Sukran) is the natural karaka of marriage and love. Find its sign: Venus exalted in Meena (Pisces) is the most marriage-protective position. Venus in Kanya (Virgo) is debilitated — the weakest for marriage significance. Check if Jupiter or Moon aspects Venus — these benefic aspects significantly restore Venus's strength even where it is debilitated.",
        "சுக்கிரன் திருமணம் மற்றும் காதலின் இயற்கையான காரகன். அதன் ராசியை கண்டறியுங்கள்: மீனத்தில் சுக்கிரன் உச்சம் — திருமணம் மிகவும் பாதுகாப்பான நிலை. கன்னியில் நீசம் — திருமண முக்கியத்துவத்திற்கு மிகவும் பலவீனமான. குரு அல்லது சந்திரன் சுக்கிரனை பார்க்கிறதா என்று சரிபாருங்கள் — இந்த சுப பார்வைகள் நீசத்தில் இருந்தாலும் சுக்கிரனின் பலத்தை கணிசமாக மீட்டமைக்கின்றன."
      ),
    },
    {
      h: s("4 — Check Jupiter's aspect on the 7th house", "4 — 7-ஆம் பாவத்தில் குரு பார்வையை சரிபாருங்கள்"),
      b: s(
        "Jupiter's 7th aspect on your 7th house is one of the strongest natural protections for marriage in the chart. Find where Jupiter sits and count 7 houses forward — if that lands on your 7th house, Guru directly protects your marriage house. This single factor can substantially offset even a malefic in the 7th.",
        "உங்கள் 7-ஆம் பாவத்தில் குருவின் 7-ஆவது பார்வை ஜாதகத்தில் திருமணத்திற்கான மிகவும் வலிமையான இயற்கையான பாதுகாப்புகளில் ஒன்று. குரு எங்கே அமர்ந்திருக்கிறது என்று கண்டுபிடித்து 7 பாவங்கள் முன்னோக்கி எண்ணுங்கள் — அது உங்கள் 7-ஆம் பாவத்தில் விழுந்தால் குரு நேரடியாக திருமண பாவத்தை பாதுகாக்கிறது. இந்த ஒரே காரணி 7-ல் தீய கிரகத்தையும் கணிசமாக சமன் செய்யலாம்."
      ),
    },
    {
      h: s("5 — Note the dasha of the 7th lord and Venus", "5 — 7-ஆம் அதிபதி மற்றும் சுக்கிரனின் தசையை பாருங்கள்"),
      b: s(
        "Marriage typically manifests during the mahadasha or antardasha of the 7th lord, Venus, or Jupiter. If these dashas coincide with unfavorable transits or the malefic's own dasha, the timing gets pushed. Watching the dasha window is more useful than worrying about the dosham label — when the right dasha arrives and a good match is found, Kalathra dosham charts marry well.",
        "திருமணம் வழக்கமாக 7-ஆம் அதிபதி, சுக்கிரன் அல்லது குரு மஹாதசை அல்லது அந்தர்தசையில் வெளிப்படுகிறது. இந்த தசைகள் சாதகமற்ற கோச்சாரங்கள் அல்லது தீய கிரகத்தின் சொந்த தசையுடன் ஒத்துப்போனால் காலம் தள்ளிப்போகிறது. தோஷ முத்திரையைப் பற்றி கவலைப்படுவதை விட தசை காலகட்டத்தை கவனிப்பது அதிக பயனுள்ளது — சரியான தசை வந்து நல்ல பொருத்தம் கண்டறியப்படும்போது, களத்திர தோஷம் கொண்ட ஜாதகங்கள் நன்றாகவே திருமணம் செய்கின்றன."
      ),
    },
  ],
  cancel_h2:  s("When Kalathra dosham is reduced", "களத்திர தோஷம் குறையும் நிலைகள்"),
  cancel_body: s(
    "Venus exalted in Meena is the strongest natural counterweight — deep marriage potential even with 7th house stress elsewhere. Jupiter directly aspecting the 7th house offers reliable protection regardless of the malefic there. A strong 7th lord in its own or exalted sign reduces the pressure significantly. The traditional practice of thorough marriage porutham — the 10-kuta system comparing both charts — is itself the most practical form of Kalathra dosham management: a chart where one partner's strength offsets the other's sensitivity creates the complementary balance the tradition seeks. A well-matched pair marries well even where individual charts show this dosham.",
    "மீனத்தில் சுக்கிரன் உச்சம் வலிமையான இயற்கையான எதிர்சக்தி — அங்கே 7-ஆம் பாவ அழுத்தம் இருந்தாலும் ஆழமான திருமண திறனை காட்டுகிறது. 7-ஆம் பாவத்தை நேரடியாக பார்க்கும் குரு அங்கே தீய கிரகத்தைப் பொருட்படுத்தாமல் நம்பகமான பாதுகாப்பை அளிக்கிறது. வலிமையான 7-ஆம் அதிபதி சொந்த அல்லது உச்ச ராசியில் இருந்தால் அழுத்தம் கணிசமாக குறைகிறது. முழுமையான திருமணப் பொருத்தம் — இரு ஜாதகங்களையும் ஒப்பிடும் 10-கூட முறை — என்பது களத்திர தோஷ மேலாண்மையின் மிகவும் நடைமுறை வடிவம். நல்ல பொருத்தமுடைய ஜோடி தனிப்பட்ட ஜாதகங்களில் தோஷம் காட்டினாலும் நன்றாகவே திருமணம் செய்கின்றனர்."
  ),
  pariharam_h2:   s("Pariharam — honouring Venus and the marriage house", "பரிகாரம் — சுக்கிரனையும் திருமண பாவத்தையும் மரியாதைப்படுத்துதல்"),
  pariharam_body: s(
    "Devotees worship Goddess Lakshmi and Lord Vishnu for marital harmony and Venus strengthening — Fridays are the most auspicious day, lighting a white camphor lamp and offering white flowers such as jasmine or white lotus. Thirumananjeri Kalyana Sundareswarar temple near Mayiladuthurai is the traditional Tamil temple for marriage timing and harmony. Jupiter is strengthened through Thursday worship (yellow flowers, banana, turmeric). Chanting Vishnu Sahasranama or Lalitha Sahasranama on Fridays is the devotional practice for Venus and marriage harmony. If Mars is the specific malefic in the 7th (making this Sevvai dosham as well), the Mangal pariharam at Vaitheeswaran Koil is recommended alongside.",
    "பக்தர்கள் திருமண ஒற்றுமை மற்றும் சுக்கிர வலுவேற்றத்திற்காக மஹாலட்சுமி மற்றும் மஹாவிஷ்ணுவை வழிபடுகிறார்கள் — வெள்ளிக்கிழமைகள் மிகவும் சுபமான நாள்; வெள்ளை கர்ப்பூர விளக்கேற்றி மல்லிகை அல்லது வெண்தாமரை போன்ற வெள்ளை பூக்கள் சமர்ப்பிக்கின்றனர். மயிலாடுதுறை அருகே திருமணஞ்சேரி கல்யாண சுந்தரேஸ்வரர் கோயில் திருமண காலம் மற்றும் ஒற்றுமைக்கான பாரம்பரிய தமிழ் கோயில். வியாழன் வழிபாட்டால் குரு பலப்படுத்தப்படுகிறது (மஞ்சள் பூக்கள், வாழைப்பழம், மஞ்சள்). வெள்ளிக்கிழமைகளில் விஷ்ணு சஹஸ்ரநாமம் அல்லது லலிதா சஹஸ்ரநாமம் ஜெபிப்பது சுக்கிரன் மற்றும் திருமண ஒற்றுமைக்கான பக்தி நடைமுறை. 7-ல் செவ்வாய் குறிப்பிட்ட தீய கிரகமாக இருந்தால் (இதை செவ்வாய் தோஷமும் ஆக்கும்போது), வைத்தீஸ்வரன் கோயிலில் மங்கள பரிகாரத்தையும் சேர்த்து செய்ய பரிந்துரைக்கப்படுகிறது."
  ),
  slokam_label:  s("Sukran (Venus) slokam", "சுக்கிரன் ஸ்லோகம்"),
  slokam_text:   s(
    "Hima-kunda-mrinaalaabham daityaanam paramam gurum\nSarva-shastra-pravaktaram bhargavam pranamamyaham",
    "ஹிம குந்த ம்ருணாலாபம் தைத்யானாம் பரமம் குரும்\nசர்வ சாஸ்திர ப்ரவக்தாரம் பார்க்கவம் ப்ரணமாம்யஹம்"
  ),
  slokam_meaning: s(
    "I bow to Bhargava (Venus) — white like snow, jasmine, and the lotus stalk; the supreme teacher of the asuras, the revealer of all shastras.",
    "ஹிம குந்த ம்ருணாலம் போன்று வெண்மையானவனே, அசுரர்களின் மேலான ஆசிரியனே, சர்வ சாஸ்திரங்களின் வெளிப்படுத்துபவனே — பார்க்கவனே, உன்னை வணங்குகிறேன்."
  ),
  related_h2: s("Related", "தொடர்புடையவை"),
};

export const DOSHAM_KALATHRA_FAQ = [
  {
    q: s("Is Kalathra dosham the same as Sevvai (Mangal) dosham?", "களத்திர தோஷம் செவ்வாய் (மங்கள) தோஷம் தானா?"),
    a: s(
      "No. Sevvai dosham is specifically Mars in the marriage-sensitive houses (1st, 2nd, 4th, 7th, 8th, 12th). Kalathra dosham is broader — it is any malefic planet (Saturn, Mars, Rahu, Ketu, or the Sun) stressing the 7th house, the 7th lord, or Venus. Every Sevvai dosham creates Kalathra-type challenges, but Kalathra dosham has many more sources than just Mars.",
      "இல்லை. செவ்வாய் தோஷம் குறிப்பாக திருமண உணர்திறன் வாய்ந்த பாவங்களில் (1, 2, 4, 7, 8, 12) செவ்வாய் அமர்வது. களத்திர தோஷம் பரந்தது — எந்த தீய கிரகமும் (சனி, செவ்வாய், ராகு, கேது, அல்லது சூரியன்) 7-ஆம் பாவம், 7-ஆம் அதிபதி அல்லது சுக்கிரனை அழுத்துவது. ஒவ்வொரு செவ்வாய் தோஷமும் களத்திர தரத்தை உருவாக்குகிறது, ஆனால் களத்திர தோஷம் செவ்வாயை விட பல அதிக ஆதாரங்கள் கொண்டது."
    ),
  },
  {
    q: s("Does Kalathra dosham mean my marriage will always have problems?", "களத்திர தோஷம் என்றால் திருமணம் எப்போதும் சிக்கல்களாக இருக்குமா?"),
    a: s(
      "Not necessarily. It indicates sensitivity in the marriage area — most often just the need for better timing, a well-matched partner, or more maturity. A strong 7th lord, Venus in a good sign, Jupiter's aspect on the 7th, and good porutham between both charts allow most such charts to have stable, happy marriages. The dosham describes a starting condition, not a permanent outcome.",
      "அவசியமில்லை. இது திருமண பகுதியில் உணர்திறனைக் குறிக்கிறது — பெரும்பாலும் சிறந்த காலம், நன்கு பொருந்தும் துணை, அல்லது அதிக முதிர்ச்சி தேவை. வலிமையான 7-ஆம் அதிபதி, நல்ல ராசியில் சுக்கிரன், 7-ஆம் பாவத்தில் குரு பார்வை, இரு ஜாதகங்களுக்கிடையே நல்ல பொருத்தம் ஆகியவை இதுபோன்ற பல ஜாதகங்களை நிலையான, மகிழ்ச்சியான திருமணம் செய்ய வைக்கின்றன. தோஷம் தொடக்க நிலையை விவரிக்கிறது, நிரந்தர விளைவை அல்ல."
    ),
  },
  {
    q: s("Should I look at the 7th house from Lagna, Moon, and Venus?", "லக்னம், சந்திரன், சுக்கிரன் ஆகியவற்றிலிருந்து 7-ஐ பார்க்க வேண்டுமா?"),
    a: s(
      "In Thirukanitham tradition, the 7th from Lagna carries the most weight. The 7th from Moon is checked for emotional compatibility, and the 7th from Venus for the quality of love and attraction. A senior astrologer reads all three but gives the 7th from Lagna primary importance. If all three show stress, the dosham is strong; if only one or two do, it is milder.",
      "திருக்கணித மரபில், லக்னத்திலிருந்து 7-ஆம் பாவம் மிகவும் முக்கியத்துவம் வாய்ந்தது. சந்திரனிலிருந்து 7-ஆம் பாவம் உணர்வு பொருத்தம், சுக்கிரனிலிருந்து 7-ஆம் பாவம் காதலின் தரம் மற்றும் ஈர்ப்பு ஆகியவற்றிற்கு சரிபார்க்கப்படுகிறது. மூத்த ஜோதிடர் மூன்றையும் படிக்கிறார், ஆனால் லக்னத்திலிருந்து 7 முதன்மையானது. மூன்று 7களும் அழுத்தம் காட்டினால் தோஷம் வலிமையானது; ஒன்று அல்லது இரண்டு மட்டும் காட்டினால் மிதமானது."
    ),
  },
  {
    q: s("If Venus is debilitated in my chart, is marriage difficult?", "ஜாதகத்தில் சுக்கிரன் நீசமாக இருந்தால் திருமணம் கடினமாக இருக்குமா?"),
    a: s(
      "Debilitated Venus (in Kanya/Virgo) does weaken the marriage significator, but neecha-bhanga (cancellation of debilitation) is very common. Venus's debilitation is cancelled when Mercury (lord of Virgo) or Jupiter (lord of Pisces, Venus's exaltation sign) is strong and well-placed. A strong Jupiter elsewhere in the chart is often sufficient to overcome debilitated Venus's effect on marriage.",
      "நீச சுக்கிரன் (கன்னியில்) திருமண காரகனை பலவீனப்படுத்துகிறது, ஆனால் நீச பங்க (நீசம் ரத்தாதல்) மிக பொதுவானது. புதன் (கன்னியின் அதிபதி) அல்லது குரு (மீனத்தின் அதிபதி, சுக்கிரன் உச்ச ராசி) வலிமையாகவும் நன்கு நிலைப்பட்டும் இருக்கும்போது சுக்கிரனின் நீசம் ரத்தாகிறது. ஜாதகத்தில் வேறிடத்தில் வலிமையான குரு திருமணத்தில் நீச சுக்கிரனின் தாக்கத்தை சமன் செய்ய பெரும்பாலும் போதுமானது."
    ),
  },
];

export const PARIHARAM_MARRIAGE_FAQ = [
  {
    q: s("Does the pariharam guarantee marriage by a fixed date?", "பரிகாரம் ஒரு குறிப்பிட்ட தேதிக்குள் திருமணத்தை உறுதி செய்யுமா?"),
    a: s(
      "No sincere tradition promises a date. Pariharam steadies the mind, builds patience, and aligns your effort with the time the chart opens marriage (the supportive dasha). It works best alongside practical steps — meeting families and porutham matching — not as a substitute for them.",
      "எந்த உண்மையான பாரம்பரியமும் தேதியை உறுதியளிக்காது. பரிகாரம் மனதை நிலைப்படுத்தி, பொறுமையை வளர்த்து, ஜாதகம் திருமணத்தைத் திறக்கும் காலத்தோடு (சாதகமான தசை) உங்கள் முயற்சியை இணைக்கிறது. குடும்பங்களைச் சந்திப்பது, பொருத்தம் பார்ப்பது போன்ற நடைமுறை நடவடிக்கைகளுக்கு மாற்றாக அல்ல, அவற்றுடன் சேர்ந்தே சிறப்பாகப் பயன்படுகிறது."
    ),
  },
  {
    q: s("Can men also do the Katyayani / Swayamvara Parvati pariharam?", "கத்யாயனி / சுயம்வர பார்வதி பரிகாரத்தை ஆண்களும் செய்யலாமா?"),
    a: s(
      "Yes. Though the Katyayani vratam is traditionally framed for a woman seeking a good husband, the devotion is for a worthy life-partner and anyone may pray it sincerely. Men commonly add strengthening of Venus — the significator of the wife — on Fridays.",
      "ஆம். கத்யாயனி விரதம் பாரம்பரியமாக நல்ல கணவனை வேண்டும் பெண்ணுக்காகச் சொல்லப்பட்டாலும், அந்த பக்தி தகுதியான வாழ்க்கைத் துணைக்கானது; யாவரும் உண்மையாக ஜெபிக்கலாம். ஆண்கள் பொதுவாக மனைவியைக் குறிக்கும் சுக்கிரனை வெள்ளிக்கிழமைகளில் வலுப்படுத்துவதையும் சேர்க்கிறார்கள்."
    ),
  },
  {
    q: s("How long should the marriage pariharam be continued?", "திருமணப் பரிகாரத்தை எவ்வளவு காலம் தொடர வேண்டும்?"),
    a: s(
      "Treat it as steady devotion, not a one-day fix — many continue through the unfavourable dasha or until the marriage settles. It is ideally begun on a Friday in the bright fortnight (Shukla paksha) and kept up with a calm, regular discipline.",
      "ஒரே நாள் தீர்வாக அல்ல, தொடர்ந்த பக்தியாகக் கொள்ளுங்கள் — பலர் சாதகமற்ற தசை முடியும் வரை அல்லது திருமணம் நிறைவேறும் வரை தொடர்கின்றனர். சிறந்தது வளர்பிறை (சுக்ல பக்ஷம்) வெள்ளிக்கிழமை தொடங்கி, அமைதியான வழக்கமான ஒழுக்கத்துடன் கடைப்பிடிப்பது."
    ),
  },
];

export const TEMPLE_THIRUNALLAR_FAQ = [
  {
    q: s("Where is Thirunallar temple and how do I reach it?", "திருநள்ளாறு கோயில் எங்கே உள்ளது, எப்படிச் செல்வது?"),
    a: s(
      "Thirunallar is in the Karaikal region (Puducherry UT), close to Mayiladuthurai and Nagore in the Tamil Nadu delta. The nearest railheads are Karaikal and Nagore, and it is an easy road trip from Kumbakonam, the hub of the Navagraha temples.",
      "திருநள்ளாறு காரைக்கால் பகுதியில் (புதுச்சேரி யூனியன் பிரதேசம்), மயிலாடுதுறை, நாகூருக்கு அருகே தமிழ்நாடு டெல்டா பகுதியில் உள்ளது. அருகிலுள்ள ரயில் நிலையங்கள் காரைக்கால், நாகூர்; நவகிரக கோயில்களின் மையமான கும்பகோணத்திலிருந்து சாலை வழியாக எளிதாகச் செல்லலாம்."
    ),
  },
  {
    q: s("Do I have to visit during Sani peyarchi?", "சனி பெயர்ச்சியின்போதுதான் செல்ல வேண்டுமா?"),
    a: s(
      "No. Any Saturday brings Saturn's grace. Sani peyarchi day is considered the most powerful but draws enormous crowds; many devotees prefer a quieter Saturday darshan when they can bathe in the Nala Theertham and worship without the rush.",
      "இல்லை. எந்த சனிக்கிழமையும் சனியின் அருளைத் தரும். சனி பெயர்ச்சி நாள் மிகவும் சக்தி வாய்ந்ததாகக் கருதப்பட்டாலும் பெரும் கூட்டத்தை ஈர்க்கிறது; பலர் நள தீர்த்தத்தில் நிதானமாக நீராடி, கூட்ட நெரிசல் இல்லாமல் வழிபட அமைதியான சனிக்கிழமை தரிசனத்தையே விரும்புகிறார்கள்."
    ),
  },
  {
    q: s("Is Thirunallar only for people going through Saturn troubles?", "திருநள்ளாறு சனித் தொல்லைகளில் இருப்பவர்களுக்கு மட்டுமா?"),
    a: s(
      "No — worship there is open to all. It is most sought during Ezharai Sani, Ashtama Sani and Sani dasha/peyarchi, but devotees also visit for general discipline, patience and Saturn's blessing, and many go simply out of faith rather than fear.",
      "இல்லை — அங்கு வழிபாடு அனைவருக்கும் திறந்தது. ஏழரை சனி, அஷ்டம சனி, சனி தசை/பெயர்ச்சி காலங்களில் மிகவும் நாடப்பட்டாலும், பொது ஒழுக்கம், பொறுமை, சனியின் அருளுக்காகவும் பக்தர்கள் வருகிறார்கள்; பலர் பயத்தால் அல்ல, நம்பிக்கையாலேயே செல்கிறார்கள்."
    ),
  },
];

// ─── PARIHARAM — RAHU-KETU ───────────────────────────────────────────────────

export const PARIHARAM_RAHU_KETU = {
  eyebrow:       s("Pariharam · Rahu-Ketu", "பரிகாரம் · ராகு-கேது"),
  h1:            s("Rahu-Ketu Pariharam", "ராகு-கேது பரிகாரம்"),
  lead:          s(
    "Rahu-Ketu pariharam is steady devotional practice taken up when the lunar nodes pressure the chart — through dasha, transit or sensitive house contact. Its aim is clarity and steadiness, not fear.",
    "தசை, கோச்சாரம் அல்லது முக்கிய பாவத் தொடர்பு வழியாக சந்திப்பு புள்ளிகள் ஜாதகத்தை அழுத்தும்போது மேற்கொள்ளப்படும் நிலையான பக்தி நடைமுறையே ராகு-கேது பரிகாரம். அதன் இலக்கு தெளிவும் மன உறுதியும் — பயம் அல்ல."
  ),
  why_h2:        s("Why this pariharam is taken up", "இந்த பரிகாரம் ஏன் மேற்கொள்ளப்படுகிறது"),
  why_body:      s(
    "Rahu and Ketu are the nodal axis — they bring disruption, sudden change, confusion and karmic intensity wherever they sit. When they afflict the Lagna, Moon, 5th or 7th house, or run their dasha-bhukti, life can feel unstable. Sarpa dosham and Kala Sarpa patterns are also read through this axis. This pariharam steadies the mind and channels the nodes' intensity into disciplined effort.",
    "ராகு-கேது சந்திப்பு அச்சு — அவை அமரும் இடத்தில் குழப்பம், திடீர் மாற்றம், கர்ம தீவிரம் தருகின்றன. அவை லக்னம், சந்திரன், 5 அல்லது 7-ஆம் பாவத்தைப் பாதிக்கும்போது, அல்லது தசை-புத்தி நடக்கும்போது, வாழ்க்கை நிலையற்றதாக உணரலாம். சர்ப்ப தோஷமும் கால சர்ப்ப அமைப்பும் இந்த அச்சு வழியே படிக்கப்படுகின்றன. இந்த பரிகாரம் மனதை அமைதிப்படுத்தி, நோடுகளின் தீவிரத்தை ஒழுக்கமான முயற்சியாக மாற்றுகிறது."
  ),
  remedy_h2:     s("What to do — step by step", "என்ன செய்வது — படிப்படியாக"),
  remedy_intro:  s(
    "These steps are meant as consistent devotion across the Rahu-Ketu period, not a one-time ceremony.",
    "இந்த படிகள் ஒரே சடங்காக அல்ல, ராகு-கேது காலம் முழுவதும் தொடர்ந்த பக்தியாக கருதப்படுகின்றன."
  ),
  step1_t: s("Identify the active node first", "செயல்படும் நோடை முதலில் கண்டறியுங்கள்"),
  step1_b: s("Read the chart to find which node (Rahu or Ketu) is more afflicting and whose dasha is running — the emphasis follows the active node, not both equally.", "எந்த நோடு (ராகு அல்லது கேது) அதிகம் பாதிக்கிறது, யாருடைய தசை நடக்கிறது என்பதை ஜாதகத்தில் கண்டறியுங்கள் — முக்கியத்துவம் செயல்படும் நோடைப் பின்தொடருகிறது, இரண்டையும் சமனாக அல்ல."),
  step2_t: s("Visit Thirunageswaram (Rahu) and Keezhaperumpallam (Ketu)", "திருநாகேஸ்வரம் (ராகு) & கீழப்பெரும்பள்ளம் (கேது) தரிசனம்"),
  step2_b: s("These are the dedicated Navagraha sthalams for the nodes. Offer milk abhishekam with naga prarthana. Both temples are ideally visited in one pilgrimage for Sarpa or Kala Sarpa concerns.", "இவை நோடுகளுக்குரிய நவகிரக ஸ்தலங்கள். நாக பிரார்த்தனையுடன் பால் அபிஷேகம் செய்யுங்கள். சர்ப்ப அல்லது கால சர்ப்ப கவலைகளுக்கு இரண்டு கோயில்களும் ஒரே யாத்திரையில் தரிசிக்கப்படுவது சிறந்தது."),
  step3_t: s("Add Panchami and Aayilyam observances", "பஞ்சமி & ஆயில்யம் நோன்புகளைச் சேருங்கள்"),
  step3_b: s("Panchami (5th tithi) and Aayilyam nakshathiram days are traditionally linked to naga worship and Rahu-Ketu propitiation. Keep a regular family prayer on these days.", "பஞ்சமி (5-ஆம் திதி) மற்றும் ஆயில்யம் நட்சத்திர நாட்கள் பாரம்பரியமாக நாக வழிபாடு & ராகு-கேது தூதுவரவுடன் இணைக்கப்பட்டுள்ளன. இந்த நாட்களில் தொடர்ந்த குடும்ப பிரார்த்தனை வையுங்கள்."),
  step4_t: s("Recite Rahu Beeja Mantra consistently", "ராகு பீஜ மந்திரத்தை தொடர்ந்து ஓதுங்கள்"),
  step4_b: s("Om Braam Breem Braum Sah Raahave Namah — recited 18 or 108 times during Rahu's period with steady intent, not out of fear. Ketu Beeja Mantra (Om Straam Streem Straum Sah Ketave Namah) for Ketu periods.", "ஓம் ப்ராம் ப்ரீம் ப்ரௌம் சஹ ராஹவே நமஹ — ராகு காலத்தில் பயத்தால் அல்ல, நிலைத்த எண்ணத்துடன் 18 அல்லது 108 தடவை ஓதுங்கள். கேது காலங்களில் கேது பீஜ மந்திரம் (ஓம் ஸ்த்ராம் ஸ்த்ரீம் ஸ்த்ரௌம் சஹ கேதவே நமஹ)."),
  step5_t: s("Channel the period's energy into focused work", "காலத்தின் சக்தியை கவனம் செலுத்திய உழைப்பாக மாற்றுங்கள்"),
  step5_b: s("Rahu rewards disciplined ambition. Pair devotion with a clear, focused goal in the area the node is touching — this converts restless energy into real progress.", "ராகு ஒழுக்கமான லட்சியத்திற்கு வெகுமதி தருகிறார். நோடு தொடும் துறையில் தெளிவான, கவனம் செலுத்திய இலக்குடன் பக்தியை சேருங்கள் — இது அமைதியற்ற சக்தியை உண்மையான முன்னேற்றமாக மாற்றுகிறது."),
  temple_h2:     s("Key temples for this pariharam", "இந்த பரிகாரத்திற்கான முக்கிய கோயில்கள்"),
  temple_body:   s(
    "Thirunageswaram (Rahu temple, Kumbakonam) and Keezhaperumpallam (Ketu temple, near Poompuhar) are the primary sthalams. For Sarpa dosham, also include Naganatha Swamy temples in your region. Durga temples (especially Kottai Mariamman) are also traditionally part of Rahu-Ketu propitiation.",
    "திருநாகேஸ்வரம் (ராகு கோயில், கும்பகோணம்) மற்றும் கீழப்பெரும்பள்ளம் (கேது கோயில், பூம்புகார் அருகே) முதன்மை ஸ்தலங்கள். சர்ப்ப தோஷத்திற்கு உங்கள் பகுதியிலுள்ள நாகநாத சுவாமி கோயில்களையும் சேருங்கள். துர்கா கோயில்களும் (குறிப்பாக கோட்டை மாரியம்மன்) பாரம்பரியமாக ராகு-கேது தூதுவரவின் ஒரு பகுதி."
  ),
  slokam_label:  s("Rahu Beeja Mantra", "ராகு பீஜ மந்திரம்"),
  slokam_text:   s("Om Braam Breem Braum Sah Raahave Namah", "ஓம் ப்ராம் ப்ரீம் ப்ரௌம் சஹ ராஹவே நமஹ"),
  slokam_meaning: s(
    "Salutation to Rahu, who transforms restless ambition into focused power. Steady recitation during Rahu dasha with calm intent and disciplined action brings clarity over confusion.",
    "அமைதியற்ற ஆசையை கவனம் செலுத்திய சக்தியாக மாற்றும் ராகுவுக்கு வணக்கம். ராகு தசையில் அமைதியான எண்ணம் & ஒழுக்கமான செயலுடன் நிலையான ஜெபம் குழப்பத்திற்கு மேல் தெளிவைத் தருகிறது."
  ),
  related_h2:    s("Related guides", "தொடர்புடைய வழிகாட்டிகள்"),
};

export const PARIHARAM_RAHU_KETU_FAQ = [
  {
    q: s("Which node do I focus on — Rahu or Ketu?", "ராகு அல்லது கேது — எந்த நோடில் கவனம் செலுத்த வேண்டும்?"),
    a: s("Follow the active node — whichever is running its dasha-bhukti or afflicting key houses more strongly in your chart. Both nodes share one axis, so both temples are often visited together, but prayers are directed to the more pressing one.", "செயல்படும் நோடைப் பின்தொடருங்கள் — உங்கள் ஜாதகத்தில் தசை-புத்தி நடத்துவது அல்லது முக்கிய பாவங்களை அதிகமாக பாதிப்பது எதுவோ அது. இரு நோடும் ஒரே அச்சைப் பகிர்வதால் இரண்டு கோயில்களும் சேர்ந்து தரிசிக்கப்படுகின்றன; ஆனால் பிரார்த்தனை அழுத்தமான நோடிடம் செலுத்தப்படுகிறது."),
  },
  {
    q: s("How long should I continue this pariharam?", "இந்த பரிகாரம் எவ்வளவு காலம் தொடர வேண்டும்?"),
    a: s("Treat it as steady devotion across the Rahu or Ketu period rather than a one-time ritual. Consistency over months matters more than an elaborate single ceremony.", "ஒரே சடங்காக அல்ல, ராகு அல்லது கேது காலம் முழுவதும் நிலையான பக்தியாகக் கொள்ளுங்கள். விரிவான ஒற்றை சடங்கை விட மாதங்களாக தொடர்ச்சியே முக்கியம்."),
  },
  {
    q: s("Is Rahu kalam the only time to worship Rahu?", "ராகு காலம் மட்டும் ராகு வழிபாட்டிற்கான நேரமா?"),
    a: s("Rahu kalam worship is a tradition, not a requirement. A panchangam day suited to your chart, approached with calm and consistent devotion, matters more than the specific daily window.", "ராகு கால வழிபாடு ஒரு மரபு; தேவை அல்ல. ஒரு குறிப்பிட்ட தினசரி நேரத்தை விட உங்கள் ஜாதகத்திற்கு ஏற்ற பஞ்சாங்க நாள், அமைதி & தொடர்ந்த பக்தியுடன் அணுகப்படுவது, முக்கியம்."),
  },
  {
    q: s("Does this pariharam remove all obstacles immediately?", "இந்த பரிகாரம் எல்லா தடைகளையும் உடனே நீக்குமா?"),
    a: s("No pariharam works as an instant fix. Rahu-Ketu pariharam steadies the mind and channels the period's intensity — combine it with practical effort in the area life is pressuring.", "எந்த பரிகாரமும் உடனடித் தீர்வாக வேலை செய்யாது. ராகு-கேது பரிகாரம் மனதை அமைதிப்படுத்தி காலத்தின் தீவிரத்தை வழிப்படுத்துகிறது — வாழ்க்கை அழுத்தும் துறையில் நடைமுறை முயற்சியுடன் சேருங்கள்."),
  },
];

// ─── PARIHARAM — SEVVAI DOSHAM ───────────────────────────────────────────────

export const PARIHARAM_SEVVAI = {
  eyebrow:       s("Pariharam · Sevvai Dosham", "பரிகாரம் · செவ்வாய் தோஷம்"),
  h1:            s("Sevvai Dosham Pariharam", "செவ்வாய் தோஷ பரிகாரம்"),
  lead:          s(
    "Sevvai dosham pariharam is taken up when Mars placement in specific houses creates friction around marriage, health or courage. The approach is steady devotion and understanding of the chart, not panic.",
    "குறிப்பிட்ட பாவங்களில் செவ்வாய் அமைப்பு திருமணம், ஆரோக்கியம் அல்லது தைரியம் தொடர்பான உராய்வை உருவாக்கும்போது செவ்வாய் தோஷ பரிகாரம் மேற்கொள்ளப்படுகிறது. அணுகுமுறை நிலையான பக்தி & ஜாதக புரிதல் — பதற்றம் அல்ல."
  ),
  why_h2:        s("What causes Sevvai dosham", "செவ்வாய் தோஷம் எதனால் வருகிறது"),
  why_body:      s(
    "Sevvai dosham is traditionally read when Mars occupies the 1st, 2nd, 4th, 7th, 8th or 12th house from the Lagna, Moon or Venus. Mars in these positions can introduce friction into partnership and domestic areas of life. However, the actual impact depends on Mars's strength, sign, aspects, and whether cancellation factors are present — not every placement is severe, and a knowledgeable reading of the full chart is essential before treating this as a major concern.",
    "சேவ்வாய் தோஷம் பாரம்பரியமாக செவ்வாய் லக்னம், சந்திரன் அல்லது சுக்கிரனிலிருந்து 1, 2, 4, 7, 8 அல்லது 12-ஆம் பாவத்தில் இருக்கும்போது படிக்கப்படுகிறது. இந்த இடங்களில் செவ்வாய் கூட்டு & குடும்பத் துறைகளில் உராய்வை அறிமுகப்படுத்தலாம். ஆனால் உண்மையான தாக்கம் செவ்வாயின் பலம், ராசி, பார்வை, ரத்து காரணங்கள் இருக்கிறதா என்பதைப் பொறுத்தது — ஒவ்வொரு அமைப்பும் கடுமையானது அல்ல; இதை பெரிய கவலையாக எடுப்பதற்கு முன் முழு ஜாதகத்தின் அறிவுள்ள வாசிப்பு அவசியம்."
  ),
  remedy_h2:     s("What to do — step by step", "என்ன செய்வது — படிப்படியாக"),
  remedy_intro:  s(
    "Sevvai pariharam pairs Mars-strengthening devotion with Murugan worship — Mars and Murugan share warrior energy in Tamil tradition.",
    "செவ்வாய் பரிகாரம் செவ்வாயை பலப்படுத்தும் பக்தியை முருகன் வழிபாட்டுடன் இணைக்கிறது — தமிழ் மரபில் செவ்வாயும் முருகனும் போர்வீர சக்தியைப் பகிர்கின்றனர்."
  ),
  step1_t: s("Get the full chart read first", "முதலில் முழு ஜாதகம் படிக்கப்படட்டும்"),
  step1_b: s("Confirm severity, cancellations and whether the 7th house and Venus are genuinely afflicted — this shapes whether you need intensive pariharam or simple strengthening worship.", "தீவிரம், ரத்து காரணங்கள், 7-ஆம் பாவமும் சுக்கிரனும் உண்மையில் பாதிக்கப்பட்டுள்ளனவா என உறுதி செய்யுங்கள் — இது தீவிர பரிகாரம் தேவையா அல்லது எளிய பலப்படுத்தல் வழிபாடு தேவையா என வடிவமைக்கிறது."),
  step2_t: s("Visit Vaitheeswaran Koil on a Tuesday", "செவ்வாய்க்கிழமை வைத்தீஸ்வரன் கோயில் தரிசனம்"),
  step2_b: s("Vaitheeswaran Koil is the premier Mars-healing temple. Offer Angaraka mantra worship, take the sacred thiruchandhu ash, and set a clear sankalpam for the dosham relief.", "வைத்தீஸ்வரன் கோயில் முதன்மையான செவ்வாய்-வைத்திய ஸ்தலம். அங்காரக மந்திர வழிபாடு செய்யுங்கள், புனித திருச்சாந்து திருநீற்றை பெறுங்கள், தோஷ நிவாரணத்திற்கான தெளிவான சங்கல்பம் வையுங்கள்."),
  step3_t: s("Add Murugan / Subramanya worship", "முருகன் / சுப்ரமண்ய வழிபாடு சேருங்கள்"),
  step3_b: s("In Tamil tradition, Murugan (Karthikeya / Subramanya) governs courage and Mars energy. Regular Murugan prayer — especially on Skanda Sashti — is a core part of Sevvai pariharam.", "தமிழ் மரபில் முருகன் (கார்த்திகேயன் / சுப்ரமண்யன்) தைரியம் & செவ்வாய் சக்தியை ஆளுகிறார். தொடர்ந்த முருகன் பிரார்த்தனை — குறிப்பாக ஸ்கந்த சஷ்டியில் — செவ்வாய் பரிகாரத்தின் முக்கிய பகுதி."),
  step4_t: s("Recite Angaraka Mantra on Tuesdays", "செவ்வாய்க்கிழமைகளில் அங்காரக மந்திரம் ஓதுங்கள்"),
  step4_b: s("Om Kraam Kreem Kraum Sah Bhaumaaya Namah — recite on Tuesdays with red offerings (red flowers, vermilion, jaggery). Consistency over months matters more than a single elaborate ceremony.", "ஓம் க்ராம் க்ரீம் க்ரௌம் சஹ பௌமாய நமஹ — செவ்வாய்க்கிழமைகளில் சிவப்பு நைவேத்யத்துடன் (சிவப்பு பூ, குங்குமம், வெல்லம்) ஓதுங்கள். ஒரே சடங்கை விட மாதங்களாக தொடர்ச்சியே முக்கியம்."),
  step5_t: s("Keep medical care alongside for health concerns", "ஆரோக்கிய கவலைகளுக்கு மருத்துவ சிகிச்சையை இணையாக வையுங்கள்"),
  step5_b: s("If Sevvai dosham is read alongside health difficulties, devotion supports hope — but a qualified doctor's care is always primary. Never replace medicine with pariharam.", "செவ்வாய் தோஷம் ஆரோக்கிய சிரமங்களுடன் சேர்த்துப் படிக்கப்பட்டால், பக்தி நம்பிக்கையை ஆதரிக்கிறது — ஆனால் தகுதியான மருத்துவரின் சிகிச்சை எப்போதும் முதன்மையானது. மருந்துக்கு மாற்றாக பரிகாரத்தை வைக்க வேண்டாம்."),
  temple_h2:     s("Key temples for this pariharam", "இந்த பரிகாரத்திற்கான முக்கிய கோயில்கள்"),
  temple_body:   s(
    "Vaitheeswaran Koil (near Chidambaram) is the primary Mars-healing temple. Arupadai Veedu temples — the six Murugan abodes — are collectively the strongest for Sevvai pariharam through Murugan worship. Of these, Swamimalai and Thiruparankundram are especially accessible. For marriage matters, also include Thirumananjeri (Jupiter-Parvati temple).",
    "வைத்தீஸ்வரன் கோயில் (சிதம்பரம் அருகே) முதன்மையான செவ்வாய்-வைத்திய ஸ்தலம். அறுபடை வீடுகள் — ஆறு முருகன் படை வீடுகள் — முருகன் வழிபாடு மூலம் செவ்வாய் பரிகாரத்திற்கு மொத்தத்தில் வலிமையானவை. இவற்றில் சுவாமிமலை & திருப்பரங்குன்றம் குறிப்பாக அணுகக்கூடியவை. திருமண விஷயங்களுக்கு திருமணஞ்சேரியையும் (குரு-பார்வதி கோயில்) சேருங்கள்."
  ),
  slokam_label:  s("Angaraka (Sevvai) Mantra", "அங்காரக (செவ்வாய்) மந்திரம்"),
  slokam_text:   s("Om Kraam Kreem Kraum Sah Bhaumaaya Namah", "ஓம் க்ராம் க்ரீம் க்ரௌம் சஹ பௌமாய நமஹ"),
  slokam_meaning: s(
    "Salutation to Bhouma / Angaraka (Mars), who channels raw energy into courage, healing and decisive strength. Recite on Tuesdays with sincere intent.",
    "கச்சா சக்தியை தைரியம், வைத்தியம், முடிவான பலமாக மாற்றும் பௌம / அங்காரகருக்கு (செவ்வாய்) வணக்கம். செவ்வாய்க்கிழமைகளில் மனமார்ந்த எண்ணத்துடன் ஓதுங்கள்."
  ),
  related_h2:    s("Related guides", "தொடர்புடைய வழிகாட்டிகள்"),
};

export const PARIHARAM_SEVVAI_FAQ = [
  {
    q: s("Does every Sevvai placement cause dosham?", "ஒவ்வொரு செவ்வாய் அமைப்பும் தோஷம் தருமா?"),
    a: s("No. Many charts have Mars in these positions with little or no dosham effect due to sign placement, aspects, or strong cancellation factors. A full chart reading is essential before assuming severity.", "இல்லை. பல ஜாதகங்களில் இந்த இடங்களில் செவ்வாய் இருந்தாலும் ராசி நிலை, பார்வை அல்லது வலுவான ரத்து காரணங்களால் தோஷ விளைவு குறைவாக அல்லது இல்லாமல் இருக்கும். தீவிரத்தை எண்ணுவதற்கு முன் முழு ஜாதக வாசிப்பு அவசியம்."),
  },
  {
    q: s("Can Sevvai dosham be cancelled?", "செவ்வாய் தோஷம் ரத்தாகுமா?"),
    a: s("Yes. Classical cancellations include Mars in own sign (Aries, Scorpio), exaltation (Capricorn), the 7th lord in certain positions, or matching dosham in both charts. These significantly reduce its impact.", "ஆம். செம்மொழி ரத்துகளில் சொந்த ராசியில் (மேஷம், விருச்சிகம்), உச்சத்தில் (மகரம்), குறிப்பிட்ட இடங்களில் 7-ஆம் அதிபதி, அல்லது இரு ஜாதகங்களிலும் தோஷம் பொருந்துதல் ஆகியவை அடங்கும். இவை அதன் தாக்கத்தை கணிசமாகக் குறைக்கின்றன."),
  },
  {
    q: s("Should both partners do this pariharam?", "இரு துணையும் இந்த பரிகாரம் செய்ய வேண்டுமா?"),
    a: s("If both charts have Sevvai dosham, both doing the pariharam is traditional and considered mutually supportive. If only one has it, the dosham-holder's pariharam is primary.", "இரு ஜாதகங்களிலும் செவ்வாய் தோஷம் இருந்தால், இருவரும் பரிகாரம் செய்வது பாரம்பரியம், பரஸ்பர ஆதரவாகக் கருதப்படுகிறது. ஒருவருக்கு மட்டும் இருந்தால், தோஷம் உள்ளவரின் பரிகாரம் முதன்மையானது."),
  },
  {
    q: s("How is this different from general Mars worship?", "இது பொது செவ்வாய் வழிபாட்டிலிருந்து எப்படி வேறுபடுகிறது?"),
    a: s("General Mars worship strengthens the planet; dosham pariharam specifically addresses its friction on marriage/health areas through dedicated temple visits, sankalpam and consistent practice across the relevant period.", "பொது செவ்வாய் வழிபாடு கிரகத்தை பலப்படுத்துகிறது; தோஷ பரிகாரம் குறிப்பாக அர்ப்பணிக்கப்பட்ட கோயில் தரிசனம், சங்கல்பம், சம்பந்தப்பட்ட காலத்தில் தொடர்ந்த நடைமுறை மூலம் திருமணம்/ஆரோக்கியத் துறைகளில் அதன் உராய்வை நிவர்த்தி செய்கிறது."),
  },
];

// ─── PARIHARAM — NAGA DOSHAM ─────────────────────────────────────────────────

export const PARIHARAM_NAGA = {
  eyebrow:       s("Pariharam · Naga Dosham", "பரிகாரம் · நாக தோஷம்"),
  h1:            s("Naga Dosham Pariharam", "நாக தோஷ பரிகாரம்"),
  lead:          s(
    "Naga dosham pariharam addresses the ancestral and karmic knots tied to serpent energy in the chart — particularly when childbirth, lineage, or the 5th house feels blocked. It is devotional, patient, and works best understood from the full chart.",
    "நாக தோஷ பரிகாரம் ஜாதகத்தில் சர்ப்ப சக்தியுடன் இணைந்த முன்னோர் & கர்ம முடிச்சுகளை நிவர்த்தி செய்கிறது — குறிப்பாக சந்தானம், வம்சம் அல்லது 5-ஆம் பாவம் தடைப்பட்டதாக உணரும்போது. இது பக்தியுள்ளதும் பொறுமையுள்ளதும்; முழு ஜாதகத்திலிருந்து புரிந்துகொள்ளும்போது சிறப்பாகப் பயன்படுகிறது."
  ),
  why_h2:        s("What naga dosham points to", "நாக தோஷம் எதை சுட்டுகிறது"),
  why_body:      s(
    "Naga or Sarpa dosham is tied to Rahu and Ketu's pressure on the 5th house, the 5th lord, and Jupiter — the combination that governs children, lineage and spiritual merit. In Tamil tradition it also carries an ancestral dimension: unfulfilled serpent-related vows or neglected duties of the lineage. It is not a curse but a signal that one area of life needs more devotional attention and patience. A strong Jupiter, good aspect on the 5th house, or a benefic lagna can soften it considerably.",
    "நாக அல்லது சர்ப்ப தோஷம் 5-ஆம் பாவம், 5-ஆம் அதிபதி, குரு — குழந்தைகள், வம்சம், ஆன்ம புண்ணியம் ஆகியவற்றை நிர்வகிக்கும் சேர்க்கை — மீது ராகு-கேதுவின் அழுத்தத்துடன் இணைந்தது. தமிழ் மரபில் இதற்கு முன்னோர் பரிமாணமும் உண்டு: நிறைவேறாத சர்ப்ப சம்பந்தமான நேர்த்திக்கடன்கள் அல்லது வம்சத்தின் புறக்கணிக்கப்பட்ட கடமைகள். இது சாபம் அல்ல, ஒரு வாழ்க்கைத் துறைக்கு அதிக பக்தி கவனமும் பொறுமையும் தேவை என்பதற்கான அறிகுறி. பலமான குரு, 5-ஆம் பாவத்தில் நல்ல பார்வை, அல்லது சுப லக்னம் இதை கணிசமாக மென்மையாக்கலாம்."
  ),
  remedy_h2:     s("What to do — step by step", "என்ன செய்வது — படிப்படியாக"),
  remedy_intro:  s(
    "Naga dosham pariharam is patient and gentle — it steadies the mind and invites grace rather than forcing an outcome.",
    "நாக தோஷ பரிகாரம் பொறுமையும் மென்மையும் கொண்டது — இது ஒரு விளைவை கட்டாயப்படுத்துவதற்கு பதில் மனதை அமைதிப்படுத்தி அருளை வரவழைக்கிறது."
  ),
  step1_t: s("Visit Thirunageswaram and Keezhaperumpallam", "திருநாகேஸ்வரம் & கீழப்பெரும்பள்ளம் தரிசனம்"),
  step1_b: s("These Navagraha sthalams for Rahu and Ketu are the primary temples for naga pariharam. Offer milk abhishekam with naga prarthana at both, ideally in a single pilgrimage.", "ராகு & கேதுவுக்குரிய இந்த நவகிரக ஸ்தலங்கள் நாக பரிகாரத்திற்கான முதன்மையான கோயில்கள். இரண்டிலும் நாக பிரார்த்தனையுடன் பால் அபிஷேகம் செய்யுங்கள், சாத்தியமாக ஒரே யாத்திரையில்."),
  step2_t: s("Observe Panchami and Aayilyam days", "பஞ்சமி & ஆயில்யம் நாட்களை கடைப்பிடியுங்கள்"),
  step2_b: s("Panchami and Aayilyam nakshathiram days are traditionally for naga worship. Light a lamp, offer milk to a naga idol, and keep a joint family prayer on these days through the year.", "பஞ்சமி & ஆயில்யம் நட்சத்திர நாட்கள் பாரம்பரியமாக நாக வழிபாட்டிற்கானவை. ஒரு விளக்கை ஏற்றி, நாக சிலைக்கு பால் அர்ப்பணியுங்கள், ஆண்டு முழுவதும் இந்த நாட்களில் கூட்டுக் குடும்ப பிரார்த்தனை வையுங்கள்."),
  step3_t: s("Offer milk at a nearby Naga or Shiva temple", "அருகிலுள்ள நாக அல்லது சிவன் கோயிலில் பால் அர்ப்பணியுங்கள்"),
  step3_b: s("If distant travel to the Navagraha sthalams is difficult, a local Naganatha temple, Shiva temple with naga shrine, or Subramanya temple is a valid starting point. Sincerity of practice matters as much as the specific location.", "நவகிரக ஸ்தலங்களுக்கு தொலைவு பயணம் கடினமாக இருந்தால், உள்ளூர் நாகநாத கோயில், நாக மடம் உள்ள சிவன் கோயில், அல்லது சுப்ரமண்ய கோயில் செல்லுபடியான தொடக்க புள்ளி. நடைமுறையின் நேர்மை குறிப்பிட்ட இடத்தைப் போலவே முக்கியம்."),
  step4_t: s("Light a lamp with cow's ghee on Aayilyam", "ஆயில்யத்தில் பசு நெய்யில் விளக்கேற்றுங்கள்"),
  step4_b: s("A ghee lamp lit on Aayilyam day, kept burning through prayer time, is a simple and powerful traditional observance. Do this consistently month by month through the Rahu-Ketu period.", "ஆயில்யம் நாளில் ஏற்றப்பட்ட நெய் விளக்கு, பிரார்த்தனை நேரம் முழுவதும் எரிந்துகொண்டிருக்கட்டும், இது எளிய & சக்திவாய்ந்த பாரம்பரிய கடைப்பிடிப்பு. ராகு-கேது காலம் முழுவதும் மாதம் மாதம் தொடர்ந்து செய்யுங்கள்."),
  step5_t: s("Pair with medical guidance where childbirth is the concern", "சந்தானம் கவலையாக இருக்கும்போது மருத்துவ வழிகாட்டலுடன் சேருங்கள்"),
  step5_b: s("Naga dosham pariharam supports the mind and spirit; for childbirth-related concerns, it should always be paired with qualified medical care. Devotion and medicine are partners, not alternatives.", "நாக தோஷ பரிகாரம் மனதையும் ஆவியையும் ஆதரிக்கிறது; சந்தான தொடர்பான கவலைகளுக்கு, இது எப்போதும் தகுதியான மருத்துவ சிகிச்சையுடன் சேரவேண்டும். பக்தியும் மருத்துவமும் கூட்டாளிகள், மாற்றுகள் அல்ல."),
  temple_h2:     s("Key temples for this pariharam", "இந்த பரிகாரத்திற்கான முக்கிய கோயில்கள்"),
  temple_body:   s(
    "Thirunageswaram (Rahu, near Kumbakonam) and Keezhaperumpallam (Ketu, near Poompuhar) are primary. Alangudi (Guru temple) should also be included when childbirth blessings are sought — Jupiter's grace on the 5th house is the softening force. Murugan temples and Naganatha Swamy temples in your region are secondary supports.",
    "திருநாகேஸ்வரம் (ராகு, கும்பகோணம் அருகே) மற்றும் கீழப்பெரும்பள்ளம் (கேது, பூம்புகார் அருகே) முதன்மையானவை. சந்தான பாக்கியம் தேடும்போது ஆலங்குடி (குரு கோயில்) உட்படுத்தப்பட வேண்டும் — 5-ஆம் பாவத்தில் குருவின் அருளே மென்மையாக்கும் சக்தி. முருகன் கோயில்கள் மற்றும் உங்கள் பகுதியிலுள்ள நாகநாத சுவாமி கோயில்கள் இரண்டாம் நிலை ஆதரவுகள்."
  ),
  slokam_label:  s("Naga Prarthana Slokam", "நாக பிரார்த்தனை ஸ்லோகம்"),
  slokam_text:   s("Om Namo Bhagavathe Vasudhevaaya Sarpa Roopaaya Namah", "ஓம் நமோ பகவதே வாசுதேவாய சர்ப்ப ரூபாய நமஹ"),
  slokam_meaning: s(
    "Salutation to the serpent form of the divine — the formless energy of lineage, karma and regeneration. Recited with a calm mind, especially on Aayilyam and Panchami days.",
    "வம்சம், கர்மம், புதுப்பிப்பின் வடிவமற்ற சக்தியான தெய்வத்தின் சர்ப்ப ரூபத்திற்கு வணக்கம். அமைதியான மனதுடன், குறிப்பாக ஆயில்யம் & பஞ்சமி நாட்களில் ஓதப்படுகிறது."
  ),
  related_h2:    s("Related guides", "தொடர்புடைய வழிகாட்டிகள்"),
};

export const PARIHARAM_NAGA_FAQ = [
  {
    q: s("Is naga dosham only for childbirth concerns?", "நாக தோஷம் சந்தான கவலைகளுக்கு மட்டுமா?"),
    a: s("No. It covers lineage, family peace, and spiritual karmic knots as well. Childbirth difficulty is the most common presenting concern, but naga dosham pariharam is also done for general family harmony and ancestral merit.", "இல்லை. வம்சம், குடும்ப அமைதி, ஆன்ம கர்ம முடிச்சுகளையும் உள்ளடக்குகிறது. சந்தான சிரமம் மிக பொதுவான வழக்கிற்கு வரும் கவலை; ஆனால் நாக தோஷ பரிகாரம் பொதுவான குடும்ப நலன் மற்றும் முன்னோர் புண்ணியத்திற்காகவும் செய்யப்படுகிறது."),
  },
  {
    q: s("How does this differ from Kala Sarpa pariharam?", "இது கால சர்ப்ப பரிகாரத்திலிருந்து எப்படி வேறுபடுகிறது?"),
    a: s("Naga dosham is tied to Rahu-Ketu's specific pressure on the 5th house and lineage; Kala Sarpa is the pattern where all planets are hemmed between the nodes. Both use Navagraha node temples, but Kala Sarpa also includes broader planetary strengthening.", "நாக தோஷம் 5-ஆம் பாவம் & வம்சத்தில் ராகு-கேதுவின் குறிப்பிட்ட அழுத்தத்துடன் இணைந்தது; கால சர்ப்பம் எல்லா கிரகங்களும் நோடுகளுக்கு இடையே சிக்கும் அமைப்பு. இரண்டும் நவகிரக நோடு கோயில்களைப் பயன்படுத்துகின்றன; ஆனால் கால சர்ப்பத்தில் பரந்த கிரக பலப்படுத்தலும் அடங்கும்."),
  },
  {
    q: s("Can the dosham be 'removed' permanently?", "தோஷம் நிரந்தரமாக 'நீக்கப்பட' முடியுமா?"),
    a: s("Pariharam steadies and softens the dosham's effects over time — it is not a one-time removal. Consistent practice across the relevant planetary periods, combined with patience and medical care where needed, is what helps most.", "பரிகாரம் காலப்போக்கில் தோஷத்தின் விளைவுகளை அமைதிப்படுத்தி மென்மையாக்குகிறது — இது ஒரே நேரத்தில் நீக்குவது அல்ல. சம்பந்தப்பட்ட கிரக காலங்களில் தொடர்ந்த நடைமுறை, பொறுமை, தேவைப்படும் இடத்தில் மருத்துவ சிகிச்சையுடன் சேர்ந்தது, மிகவும் உதவுகிறது."),
  },
  {
    q: s("Should my partner also do this pariharam?", "என் துணையும் இந்த பரிகாரம் செய்ய வேண்டுமா?"),
    a: s("It is traditional for the family to pray together, especially for childbirth blessings — joint prayer is considered more powerful. Individual pariharam by the person whose chart shows the dosham is the foundation.", "குறிப்பாக சந்தான பாக்கியத்திற்கு குடும்பமாக சேர்ந்து பிரார்த்திப்பது பாரம்பரியம் — கூட்டு பிரார்த்தனை அதிக சக்திவாய்ந்ததாகக் கருதப்படுகிறது. ஜாதகத்தில் தோஷம் காட்டும் நபரின் தனிப்பட்ட பரிகாரம் அடிப்படை."),
  },
];

// ─── PARIHARAM — KADAN (DEBT) ─────────────────────────────────────────────────

export const PARIHARAM_KADAN = {
  eyebrow:       s("Pariharam · Debt & Financial Strain", "பரிகாரம் · கடன் & பண நெருக்கடி"),
  h1:            s("Pariharam for debt and financial strain (Kadan Pariharam)", "கடன் & பண நெருக்கடிக்கான பரிகாரம்"),
  lead:          s(
    "Kadan pariharam is taken up when persistent debt, financial strain or chronic money difficulty feels astrologically rooted. It pairs Lakshmi-Kubera devotion with disciplined financial practice — worship and effort together.",
    "தொடர்ந்த கடன், பண நெருக்கடி அல்லது நீடித்த பண சிரமம் ஜோதிட ரீதியாக வேரூன்றியதாக உணரும்போது கடன் பரிகாரம் மேற்கொள்ளப்படுகிறது. இது லட்சுமி-குபேர பக்தியை ஒழுக்கமான நிதி நடைமுறையுடன் இணைக்கிறது — வழிபாடும் முயற்சியும் சேர்ந்து."
  ),
  why_h2:        s("What causes financial pressure in the chart", "ஜாதகத்தில் பண அழுத்தம் எதனால் வருகிறது"),
  why_body:      s(
    "Persistent financial difficulty in a chart is typically read through the 2nd house (stored wealth, savings), the 11th house (income and gains), and the 6th house (debt and obstacles). When these houses or their lords are weak, afflicted by Saturn, Rahu, or the 12th lord (loss), or when dasha periods of such planets run, money strain can feel chronic. Mercury's weakness also affects financial reasoning and business judgment. This pariharam addresses these placements through devotion to Lakshmi, Kubera, and strengthening Venus and Jupiter.",
    "ஜாதகத்தில் நீடித்த பண சிரமம் வழக்கமாக 2-ஆம் பாவம் (சேமிப்பு செல்வம்), 11-ஆம் பாவம் (வருமானம் & லாபம்), 6-ஆம் பாவம் (கடன் & தடைகள்) ஆகியவற்றின் மூலம் படிக்கப்படுகிறது. இந்த பாவங்கள் அல்லது அவற்றின் அதிபதிகள் பலவீனமாக, சனி, ராகு அல்லது 12-ஆம் அதிபதியால் (இழப்பு) பாதிக்கப்படும்போது, அல்லது இத்தகைய கிரகங்களின் தசை காலங்கள் நடக்கும்போது, பண நெருக்கடி நீடிப்பதாக உணரலாம். புதனின் பலவீனம் நிதி சிந்தனையையும் வணிக தீர்மானத்தையும் பாதிக்கிறது. இந்த பரிகாரம் லட்சுமி, குபேர பக்தி மற்றும் சுக்கிரன், குரு வலுப்படுத்தல் மூலம் இந்த அமைப்புகளை நிவர்த்தி செய்கிறது."
  ),
  remedy_h2:     s("What to do — step by step", "என்ன செய்வது — படிப்படியாக"),
  remedy_intro:  s(
    "These remedies work best as consistent, patient devotion combined with real-world financial discipline — not as a replacement for practical money management.",
    "இந்த பரிகாரங்கள் நிதி ஒழுக்கத்திற்கு மாற்றாக அல்ல, உண்மை உலக நிதி ஒழுக்கத்துடன் இணைந்த தொடர்ச்சியான, பொறுமையான பக்தியாக சிறப்பாகப் பயன்படுகின்றன."
  ),
  step1_t: s("Worship Mahalakshmi every Friday", "ஒவ்வொரு வெள்ளியும் மகாலட்சுமியை வழிபடுங்கள்"),
  step1_b: s("Light a ghee lamp, offer white flowers or lotus, chant Sri Lakshmi Ashtothram or Sri Suktha. Keep the prayer space clean and maintained — a tidy altar is itself part of Lakshmi's welcome.", "நெய் விளக்கு ஏற்றி, வெள்ளை பூ அல்லது தாமரை அர்ப்பணியுங்கள், ஸ்ரீ லட்சுமி அஷ்டோத்தரம் அல்லது ஸ்ரீ சூக்தம் ஓதுங்கள். வழிபாட்டு இடத்தை சுத்தமாகவும் பராமரித்தும் வையுங்கள் — ஒழுங்கான பலிபீடமே லட்சுமியை வரவேற்பதன் ஒரு பகுதி."),
  step2_t: s("Include Kubera mantra on Thursdays", "வியாழன்களில் குபேர மந்திரம் சேருங்கள்"),
  step2_b: s("Kubera is the lord of wealth and finance. Om Yakshaya Kuberaya Vaishravanaya Dhanadhanaadhipataye Dhanadhanyasamriddhim Me Dehi Dapaya Svaha — recite on Thursdays.", "குபேரர் செல்வம் & நிதியின் தேவர். ஓம் யக்ஷாய குபேராய வைஸ்ரவணாய தனதனாதிபதயே தனதான்ய சம்ருத்திம் மே தேஹி தாபய ஸ்வாஹா — வியாழன்களில் ஓதுங்கள்."),
  step3_t: s("Visit Kanjanur (Venus) and Alangudi (Jupiter) temples", "காஞ்சனூர் (சுக்கிரன்) & ஆலங்குடி (குரு) கோயில்கள் தரிசிக்கவும்"),
  step3_b: s("Venus governs financial comfort and Jupiter governs legitimate wealth and wisdom in money matters. These temples together address both comfort (2nd house) and fortune (9th-11th house) dimensions of Kadan pariharam.", "சுக்கிரன் நிதி சுகத்தை, குரு சட்டபூர்வமான செல்வத்தையும் பண விஷயங்களில் ஞானத்தையும் ஆளுகிறார். இந்த கோயில்கள் சேர்ந்து கடன் பரிகாரத்தின் சுகம் (2-ஆம் பாவம்) & பாக்கியம் (9-11-ஆம் பாவம்) பரிமாணங்களை நிவர்த்தி செய்கின்றன."),
  step4_t: s("Practice financial discipline alongside devotion", "பக்தியுடன் நிதி ஒழுக்கத்தை கடைப்பிடியுங்கள்"),
  step4_b: s("Pariharam is not a substitute for budgeting, debt repayment or saving. Use the dasha periods of 2nd, 11th and Venus lords for financial decisions. Avoid new debt during weak planetary periods.", "பரிகாரம் பட்ஜெட், கடன் திரும்பச் செலுத்தல் அல்லது சேமிப்பிற்கு மாற்றல்ல. 2, 11-ஆம் பாவம் & சுக்கிர அதிபதிகளின் தசை காலங்களை நிதி முடிவுகளுக்குப் பயன்படுத்துங்கள். பலவீன கிரக காலங்களில் புதிய கடன் வாங்கவதை தவிருங்கள்."),
  step5_t: s("Give a portion to charity consistently", "தொடர்ந்து ஒரு பகுதியை தானம் செய்யுங்கள்"),
  step5_b: s("Traditional wisdom across many systems holds that charitable giving keeps the channels of wealth open — not from abundance alone, but as a practice even in difficulty. A small, consistent amount is more meaningful than a large one-time gesture.", "பல முறைகளிலுள்ள பாரம்பரிய ஞானம் தானம் செல்வத்தின் வழிகளைத் திறந்து வைக்கும் என்கிறது — வளம் இருக்கும்போது மட்டும் அல்ல, சிரமத்திலும் ஒரு நடைமுறையாக. சிறிய, தொடர்ந்த தொகை பெரிய ஒரே முறை சைகையை விட அர்த்தமுள்ளது."),
  temple_h2:     s("Key temples for this pariharam", "இந்த பரிகாரத்திற்கான முக்கிய கோயில்கள்"),
  temple_body:   s(
    "Kanjanur (Sukra / Venus temple, near Kumbakonam) and Alangudi (Guru / Jupiter temple, Papanasam) are the core temples. For Saturn-related financial blocks, Thirunallar (Sani temple) is also part of the circuit. Major Lakshmi temples — Srirangam, Kanchi Kamakshi — and the nearest Kubera shrine in Shiva temples (Kubera is often enshrined in the northeast corner) supplement the home practice.",
    "காஞ்சனூர் (சுக்கிர கோயில், கும்பகோணம் அருகே) மற்றும் ஆலங்குடி (குரு கோயில், பாபநாசம்) மையமான கோயில்கள். சனி தொடர்பான நிதி தடைகளுக்கு திருநள்ளாறு (சனி கோயில்) சுற்றுப்பயணத்தின் ஒரு பகுதி. முக்கிய லட்சுமி கோயில்கள் — ஸ்ரீரங்கம், காஞ்சி காமாக்ஷி — மற்றும் சிவன் கோயில்களில் அருகிலுள்ள குபேர சன்னதி (குபேரர் பெரும்பாலும் வடகிழக்கு மூலையில் கோயில் கொண்டுள்ளார்) வீட்டு நடைமுறையை பூர்த்தி செய்கின்றன."
  ),
  slokam_label:  s("Sri Mahalakshmi Slokam", "ஸ்ரீ மகாலட்சுமி ஸ்லோகம்"),
  slokam_text:   s("Om Shreem Mahalakshmyai Namah", "ஓம் ஸ்ரீம் மஹாலட்சுமையி நமஹ"),
  slokam_meaning: s(
    "Salutation to Mahalakshmi, the goddess of wealth, fortune and auspiciousness. Recited on Fridays with a clean heart, alongside sincere effort in daily life.",
    "செல்வம், பாக்கியம், மங்களத்தின் தெய்வமான மகாலட்சுமிக்கு வணக்கம். தினசரி வாழ்வில் நேர்மையான முயற்சியுடன், தூய்மையான இதயத்துடன் வெள்ளிகளில் ஓதப்படுகிறது."
  ),
  related_h2:    s("Related guides", "தொடர்புடைய வழிகாட்டிகள்"),
};

export const PARIHARAM_KADAN_FAQ = [
  {
    q: s("Can pariharam replace financial planning?", "பரிகாரம் நிதி திட்டமிடலுக்கு மாற்றாக இருக்குமா?"),
    a: s("No. Pariharam supports the mind and invites grace — it is most effective when paired with real-world budgeting, debt repayment discipline and financial planning. One without the other works less well.", "இல்லை. பரிகாரம் மனதை ஆதரிக்கிறது & அருளை வரவழைக்கிறது — உண்மை உலக பட்ஜெட், கடன் திரும்பச் செலுத்தல் ஒழுக்கம், நிதி திட்டமிடலுடன் இணைந்தபோது மிகவும் பயனுள்ளது. இல்லாமல் ஒன்று குறைவான வேலை செய்கிறது."),
  },
  {
    q: s("Which planet primarily causes persistent debt?", "தொடர்ந்த கடனுக்கு முதன்மையாக எந்த கிரகம் காரணம்?"),
    a: s("There is no single planet. Persistent debt usually involves the 2nd and 11th house lords being weak, strong 6th or 12th house influence, or Saturn-Mercury affliction. The chart as a whole must be read rather than blaming one planet.", "ஒரே கிரகம் இல்லை. தொடர்ந்த கடன் பொதுவாக 2 & 11-ஆம் பாவ அதிபதிகள் பலவீனமாக இருப்பது, வலுவான 6 அல்லது 12-ஆம் பாவ தாக்கம், அல்லது சனி-புதன் பாதிப்பை உள்ளடக்குகிறது. ஒரு கிரகத்தை குற்றப்படுத்துவதை விட முழு ஜாதகம் படிக்கப்பட வேண்டும்."),
  },
  {
    q: s("How long should I continue kadan pariharam?", "கடன் பரிகாரம் எவ்வளவு காலம் தொடர வேண்டும்?"),
    a: s("Maintain the practice through the dasha period of the afflicting planet and for at least one full year of consistent worship. Combine it with visible financial discipline changes to make the practice meaningful.", "பாதிக்கும் கிரகத்தின் தசை காலம் முழுவதும் & குறைந்தது ஒரு முழு ஆண்டு தொடர்ந்த வழிபாட்டிற்கு நடைமுறையை பராமரியுங்கள். நடைமுறையை அர்த்தமுள்ளதாக்க தெரியும் நிதி ஒழுக்க மாற்றங்களுடன் இணையுங்கள்."),
  },
  {
    q: s("Is charitable giving really part of the pariharam?", "தானம் உண்மையில் பரிகாரத்தின் ஒரு பகுதியா?"),
    a: s("Yes, across Tamil and Vedic tradition, anna daanam (food offering), Go daanam (cow donation) and consistent small charity are held to open the flow of wealth. It is not about the amount — consistency and sincerity matter more.", "ஆம், தமிழ் & வேத மரபு முழுவதும் அன்னதானம், கோதானம், தொடர்ந்த சிறிய தானம் செல்வத்தின் வழியைத் திறக்கும் என்று கருதப்படுகிறது. தொகை முக்கியம் அல்ல — தொடர்ச்சியும் நேர்மையும் அதிக முக்கியம்."),
  },
];

// ─── PARIHARAM — PUTHRA (CHILDBIRTH) ─────────────────────────────────────────

export const PARIHARAM_PUTHRA = {
  eyebrow:       s("Pariharam · Childbirth Blessings", "பரிகாரம் · புத்திர பாக்கியம்"),
  h1:            s("Pariharam for childbirth blessings (Puthra Pariharam)", "புத்திர பாக்கியத்திற்கான பரிகாரம்"),
  lead:          s(
    "Puthra pariharam is devotional practice taken up when the 5th house — the house of children, merit and lineage — feels blocked. It invites Jupiter's grace, steady Naga propitiation, and the blessings of Murugan and Subramanya.",
    "குழந்தைகள், புண்ணியம், வம்சம் ஆகியவற்றின் பாவமான 5-ஆம் பாவம் தடைப்பட்டதாக உணரும்போது புத்திர பரிகாரம் மேற்கொள்ளப்படுகிறது. இது குருவின் அருள், நிலையான நாக வழிபாடு, முருகன் & சுப்ரமண்யரின் ஆசீர்வாதங்களை வரவழைக்கிறது."
  ),
  why_h2:        s("What the chart reveals about puthra bhaagya", "ஜாதகம் புத்திர பாக்கியத்தைப் பற்றி என்ன வெளிப்படுத்துகிறது"),
  why_body:      s(
    "The 5th house is the primary house of children in Tamil astrology — its lord's strength, Jupiter's condition as the natural significator of children, and any Rahu-Ketu contact are the key indicators. A strong Jupiter in or aspecting the 5th, or a well-placed 5th lord, generally supports children; affliction from Rahu, Saturn or the 12th lord creates delay or difficulty. Naga dosham (see related guide) is a common co-factor. This pariharam works on all these threads together.",
    "தமிழ் ஜோதிடத்தில் 5-ஆம் பாவம் குழந்தைகளின் முதன்மையான பாவம் — அதன் அதிபதியின் பலம், குழந்தைகளின் இயல்பான காரகனான குருவின் நிலை, எந்த ராகு-கேது தொடர்பும் முக்கிய அறிகுறிகள். 5-ஆம் பாவத்தில் அல்லது பார்க்கும் வலுவான குரு, அல்லது நல்ல இடத்தில் உள்ள 5-ஆம் அதிபதி, பொதுவாக குழந்தைகளை ஆதரிக்கிறது; ராகு, சனி அல்லது 12-ஆம் அதிபதியிடமிருந்து பாதிப்பு தாமதம் அல்லது சிரமத்தை உருவாக்குகிறது. நாக தோஷம் (தொடர்புடைய வழிகாட்டி பார்க்கவும்) ஒரு பொதுவான கூட்டு காரணி. இந்த பரிகாரம் இந்த எல்லா நூல்களிலும் சேர்ந்து செயல்படுகிறது."
  ),
  remedy_h2:     s("What to do — step by step", "என்ன செய்வது — படிப்படியாக"),
  remedy_intro:  s(
    "Puthra pariharam is patient devotion. It is most powerful when paired with medical guidance — astrology and medicine are partners in this.",
    "புத்திர பரிகாரம் பொறுமையான பக்தி. மருத்துவ வழிகாட்டலுடன் இணைந்தபோது மிகவும் சக்திவாய்ந்தது — ஜோதிடமும் மருத்துவமும் இதில் கூட்டாளிகள்."
  ),
  step1_t: s("Visit Alangudi (Guru temple) on a Thursday", "வியாழன் ஆலங்குடி (குரு கோயில்) தரிசனம்"),
  step1_b: s("Jupiter is the karaka for children and a strong Jupiter is the most important protective factor. Alangudi is the Navagraha sthalam for Guru. Pray with a clear sankalpam for 5th house grace and children's blessings.", "குரு குழந்தைகளுக்கான காரகன்; பலமான குரு மிக முக்கியமான பாதுகாப்பு காரணி. ஆலங்குடி குருவுக்குரிய நவகிரக ஸ்தலம். 5-ஆம் பாவ அருள் & குழந்தை பாக்கியத்திற்கு தெளிவான சங்கல்பத்துடன் பிரார்த்தியுங்கள்."),
  step2_t: s("Do Naga pariharam alongside", "இணையாக நாக பரிகாரம் செய்யுங்கள்"),
  step2_b: s("If Rahu-Ketu afflicts the 5th house or Jupiter, naga pariharam at Thirunageswaram and Keezhaperumpallam, with Panchami-Aayilyam observances, is an essential companion to puthra pariharam.", "ராகு-கேது 5-ஆம் பாவம் அல்லது குருவைப் பாதித்தால், பஞ்சமி-ஆயில்யம் கடைப்பிடிப்புகளுடன் திருநாகேஸ்வரம் & கீழப்பெரும்பள்ளத்தில் நாக பரிகாரம் புத்திர பரிகாரத்தின் அத்தியாவசிய துணை."),
  step3_t: s("Worship Murugan / Subramanya for children's grace", "குழந்தை அருளுக்கு முருகன் / சுப்ரமண்யர் வழிபாடு"),
  step3_b: s("Subramanya (Murugan) is the divine child and bestower of children in Tamil tradition. Santhana Gopala puja (for the Lord as divine child) and Murugan worship on Karthigai and Sashti days are traditionally part of puthra pariharam.", "சுப்ரமண்யன் (முருகன்) தெய்வக் குழந்தை மற்றும் தமிழ் மரபில் குழந்தைகளை அருளுபவர். சந்தான கோபால பூஜை (இறைவனை தெய்வக் குழந்தையாக) மற்றும் கார்த்திகை & சஷ்டி நாட்களில் முருகன் வழிபாடு பாரம்பரியமாக புத்திர பரிகாரத்தின் ஒரு பகுதி."),
  step4_t: s("Recite Santhana Gopala mantra daily", "சந்தான கோபால மந்திரத்தை தினமும் ஓதுங்கள்"),
  step4_b: s("Om Devaki Suta Govinda Vasudeva Jagat Pate Dehi Me Tanayam Krishna Tvaamaham Sharanam Gatah — traditionally recited 108 times daily for children's blessing, especially by both partners together.", "ஓம் தேவகி சுத கோவிந்த வாசுதேவ ஜகத்பதே தேஹி மே தனயம் கிருஷ்ண த்வாமஹம் சரணம் கதஹ — பாரம்பரியமாக குழந்தை ஆசீர்வாதத்திற்கு, குறிப்பாக இரு துணையும் சேர்ந்து, தினமும் 108 முறை ஓதப்படுகிறது."),
  step5_t: s("Always pair with qualified medical care", "எப்போதும் தகுதியான மருத்துவ சிகிச்சையுடன் சேருங்கள்"),
  step5_b: s("Astrology and devotion support the mind and spirit during a tender time. Medical guidance — including fertility consultation — is always primary. Devotion is the most powerful when it walks alongside medical care, not instead of it.", "ஜோதிடமும் பக்தியும் மென்மையான நேரத்தில் மனதையும் ஆவியையும் ஆதரிக்கின்றன. மருத்துவ வழிகாட்டல் — கருவுறுதல் ஆலோசனை உட்பட — எப்போதும் முதன்மையானது. பக்தி மருத்துவ சிகிச்சையுடன் இணையாக நடக்கும்போது மிகவும் சக்திவாய்ந்தது, அதற்கு மாற்றாக அல்ல."),
  temple_h2:     s("Key temples for this pariharam", "இந்த பரிகாரத்திற்கான முக்கிய கோயில்கள்"),
  temple_body:   s(
    "Alangudi (Guru/Jupiter, Papanasam district) is primary. Thirunageswaram (Rahu) and Keezhaperumpallam (Ketu) for the naga component. Arupadai Veedu temples for Murugan's blessing — Swamimalai (near Kumbakonam) is especially linked to progeny blessings. Thirumananjeri (Parvati-Shiva marriage temple) is also traditionally visited for family blessings.",
    "ஆலங்குடி (குரு, பாபநாசம் மாவட்டம்) முதன்மையானது. நாக பகுதிக்கு திருநாகேஸ்வரம் (ராகு) & கீழப்பெரும்பள்ளம் (கேது). முருகனின் ஆசீர்வாதத்திற்கு அறுபடை வீட்டு கோயில்கள் — சுவாமிமலை (கும்பகோணம் அருகே) குறிப்பாக வழிவழி ஆசீர்வாதங்களுடன் தொடர்பு கொண்டுள்ளது. குடும்ப ஆசீர்வாதங்களுக்கு திருமணஞ்சேரி (பார்வதி-சிவன் திருமணக் கோயில்) பாரம்பரியமாக தரிசிக்கப்படுகிறது."
  ),
  slokam_label:  s("Santhana Gopala Mantra", "சந்தான கோபால மந்திரம்"),
  slokam_text:   s("Om Devaki Suta Govinda Vasudeva Jagat Pate Dehi Me Tanayam Krishna", "ஓம் தேவகி சுத கோவிந்த வாசுதேவ ஜகத் பதே தேஹி மே தனயம் கிருஷ்ண"),
  slokam_meaning: s(
    "Prayer to Sri Krishna as Santhana Gopala — the divine bestower of children and lineage. Recited 108 times daily with sincere longing, ideally by both partners together.",
    "சந்தான கோபாலனாக ஸ்ரீ கிருஷ்ணனுக்கு பிரார்த்தனை — குழந்தைகளையும் வம்சத்தையும் அருளும் தெய்வம். நேர்மையான ஏக்கத்துடன், முன்னுரிமையாக இரு துணையும் சேர்ந்து, தினமும் 108 முறை ஓதப்படுகிறது."
  ),
  related_h2:    s("Related guides", "தொடர்புடைய வழிகாட்டிகள்"),
};

export const PARIHARAM_PUTHRA_FAQ = [
  {
    q: s("How is puthra pariharam different from naga pariharam?", "புத்திர பரிகாரம் நாக பரிகாரத்திலிருந்து எப்படி வேறுபடுகிறது?"),
    a: s("Naga pariharam specifically addresses the serpent-energy and ancestor-karma dimension; puthra pariharam is broader — it addresses the 5th house through Jupiter, Murugan and naga propitiation together. Often they overlap and both are done.", "நாக பரிகாரம் குறிப்பாக சர்ப்ப சக்தி & முன்னோர்-கர்ம பரிமாணத்தை நிவர்த்தி செய்கிறது; புத்திர பரிகாரம் விரிவானது — குரு, முருகன், நாக வழிபாடு சேர்ந்து 5-ஆம் பாவத்தை நிவர்த்தி செய்கிறது. பெரும்பாலும் அவை ஒன்றிணைந்து இரண்டும் செய்யப்படுகின்றன."),
  },
  {
    q: s("Should both partners do the pariharam?", "இரு துணையும் பரிகாரம் செய்ய வேண்டுமா?"),
    a: s("Joint prayer is traditional and considered more powerful for childbirth blessings. Ideally both partners participate in temple visits, mantra recitation and observances — shared intent matters.", "கூட்டு பிரார்த்தனை பாரம்பரியம்; புத்திர ஆசீர்வாதங்களுக்கு அதிக சக்திவாய்ந்ததாகக் கருதப்படுகிறது. முன்னுரிமையாக இரு துணையும் கோயில் தரிசனம், மந்திர ஜெபம், கடைப்பிடிப்புகளில் பங்கேற்கிறார்கள் — பகிர்ந்த எண்ணம் முக்கியம்."),
  },
  {
    q: s("Is this pariharam only for those with dosham?", "இந்த பரிகாரம் தோஷம் உள்ளவர்களுக்கு மட்டுமா?"),
    a: s("No. Puthra pariharam is taken up by many couples simply as devotional practice for children's blessings, regardless of whether the chart shows a specific dosham. Grace and devotion are open to all.", "இல்லை. ஜாதகம் குறிப்பிட்ட தோஷம் காட்டுகிறதா இல்லையா என்பதைப் பொருட்படுத்தாமல், குழந்தை ஆசீர்வாதங்களுக்கான பக்தி நடைமுறையாக மட்டுமே பல தம்பதிகள் புத்திர பரிகாரம் மேற்கொள்கின்றனர். அருளும் பக்தியும் அனைவருக்கும் திறந்தவை."),
  },
  {
    q: s("When can we expect results?", "எப்போது பலன் எதிர்பார்க்கலாம்?"),
    a: s("Results are tied to chart timing — the dasha and bhukti of Jupiter and the 5th lord, supported by favourable transits, are the most likely windows. Maintain the practice patiently through those periods alongside medical care.", "பலன்கள் ஜாதக காலத்துடன் இணைந்தவை — குரு & 5-ஆம் அதிபதியின் தசை-புத்தி, சாதகமான கோச்சாரத்தால் ஆதரிக்கப்படுவது, மிகவும் சாத்தியமான காலகட்டங்கள். அந்த காலங்களில் மருத்துவ சிகிச்சையுடன் நடைமுறையை பொறுமையாக பராமரியுங்கள்."),
  },
];

// ─── PARIHARAM — AYUL (HEALTH & LONGEVITY) ───────────────────────────────────

export const PARIHARAM_AYUL = {
  eyebrow:       s("Pariharam · Health & Longevity", "பரிகாரம் · ஆரோக்கியம் & ஆயுள்"),
  h1:            s("Pariharam for health and longevity (Ayul Pariharam)", "ஆரோக்கியம் & ஆயுளுக்கான பரிகாரம்"),
  lead:          s(
    "Ayul pariharam is taken up when health, vitality or longevity feels challenged by the chart — particularly when the 8th house (lifespan), the Sun (vitality) or the 6th house (illness) are under pressure. It pairs healing temple devotion with the Mahamrityunjaya mantra.",
    "ஆரோக்கியம், உயிர்சக்தி அல்லது ஆயுள் ஜாதகத்தால் சவாலாக உணரும்போது ஆயுள் பரிகாரம் மேற்கொள்ளப்படுகிறது — குறிப்பாக 8-ஆம் பாவம் (ஆயுள்), சூரியன் (உயிர்சக்தி) அல்லது 6-ஆம் பாவம் (நோய்) அழுத்தத்தில் இருக்கும்போது. இது வைத்திய கோயில் பக்தியை மஹாம்ருத்யுஞ்சய மந்திரத்துடன் இணைக்கிறது."
  ),
  why_h2:        s("What the chart points to in health and longevity", "ஆரோக்கியம் & ஆயுளில் ஜாதகம் எதை சுட்டுகிறது"),
  why_body:      s(
    "In Tamil astrology, lifespan and vitality are primarily read through the 8th house and its lord, the Sun (atmakaraka), and the Lagna's strength. The 6th house governs disease and enemies of the body. When these houses or their lords are under pressure from Saturn (chronic illness, age), Rahu (sudden disruption), or the 12th lord (loss, hospitalisation), health can become a recurring concern. The Ayul pariharam addresses these through Surya worship, the healing temple of Vaitheeswaran Koil, and the most powerful mantra for longevity — the Mahamrityunjaya.",
    "தமிழ் ஜோதிடத்தில், ஆயுளும் உயிர்சக்தியும் முதன்மையாக 8-ஆம் பாவம் & அதன் அதிபதி, சூரியன் (ஆத்மகாரகன்), லக்னத்தின் பலம் ஆகியவற்றின் மூலம் படிக்கப்படுகின்றன. 6-ஆம் பாவம் நோய் & உடலின் எதிரிகளை ஆளுகிறது. இந்த பாவங்கள் அல்லது அவற்றின் அதிபதிகள் சனி (நீடித்த நோய், வயோதிகம்), ராகு (திடீர் குழப்பம்), அல்லது 12-ஆம் அதிபதியிடமிருந்து (இழப்பு, மருத்துவமனை) அழுத்தத்தில் இருக்கும்போது, ஆரோக்கியம் மீண்டும் வரும் கவலையாகிவிடலாம். ஆயுள் பரிகாரம் சூரிய வழிபாடு, வைத்தீஸ்வரன் கோயிலின் வைத்திய கோயில், ஆயுளுக்கான மிகவும் சக்திவாய்ந்த மந்திரம் — மஹாம்ருத்யுஞ்சயம் — மூலம் இவற்றை நிவர்த்தி செய்கிறது."
  ),
  remedy_h2:     s("What to do — step by step", "என்ன செய்வது — படிப்படியாக"),
  remedy_intro:  s(
    "Ayul pariharam is the companion to qualified medical care — never a replacement. It supports the mind's strength, which supports healing.",
    "ஆயுள் பரிகாரம் தகுதியான மருத்துவ சிகிச்சையின் துணை — ஒருபோதும் மாற்று அல்ல. மனதின் பலத்தை ஆதரிக்கிறது, இது குணமடைதலை ஆதரிக்கிறது."
  ),
  step1_t: s("Visit Vaitheeswaran Koil for healing grace", "வைத்திய அருளுக்கு வைத்தீஸ்வரன் கோயில் தரிசனம்"),
  step1_b: s("Vaitheeswaran Koil is the premier healing temple in the Navagraha circuit. Shiva is worshipped here as Vaidyanatha, the divine physician. Take the sacred thiruchandhu ash with a health sankalpam.", "வைத்தீஸ்வரன் கோயில் நவகிரக சுற்றில் முதன்மையான வைத்திய ஸ்தலம். இங்கே சிவன் வைத்தியநாதராக — தெய்வ வைத்தியராக — வழிபடப்படுகிறார். ஆரோக்கிய சங்கல்பத்துடன் புனித திருச்சாந்து திருநீற்றை பெறுங்கள்."),
  step2_t: s("Recite Mahamrityunjaya mantra daily", "மஹாம்ருத்யுஞ்சய மந்திரத்தை தினமும் ஓதுங்கள்"),
  step2_b: s("Om Tryambakam Yajamahe Sugandhim Pushtivardhanam Urvarukamiva Bandhanan Mrityor Mukshiya Maamritat — traditionally recited 108 times daily for health and longevity. Consistent daily practice over many months is most powerful.", "ஓம் த்ர்யம்பகம் யஜாமஹே சுகந்திம் புஷ்டிவர்தனம் உர்வாருகமிவ பந்தனான் ம்ருத்யோர் முக்ஷீய மாம்ருதாத் — ஆரோக்கியம் & ஆயுளுக்காக பாரம்பரியமாக தினமும் 108 முறை ஓதப்படுகிறது. பல மாதங்களாக தொடர்ந்த தினசரி நடைமுறை மிகவும் சக்திவாய்ந்தது."),
  step3_t: s("Worship the Sun at sunrise on Sundays", "ஞாயிறுகளில் சூரிய உதயத்தில் சூரியனை வழிபடுங்கள்"),
  step3_b: s("The Sun is the soul of the chart and governs vitality, heartbeat and life-force. Facing east at sunrise, offer water (arghyam) and recite Aditya Hridayam or the Surya mantra. A consistent morning routine is itself a Sun remedy.", "சூரியன் ஜாதகத்தின் ஆன்மா; உயிர்சக்தி, இதயத்துடிப்பு, ஜீவன் ஆகியவற்றை ஆளுகிறார். சூரிய உதயத்தில் கிழக்கு நோக்கி, நீர் அர்க்யம் அளித்து ஆதித்ய ஹ்ருதயம் அல்லது சூரிய மந்திரம் ஓதுங்கள். நிலையான காலை வழக்கமே ஒரு சூரிய பரிகாரம்."),
  step4_t: s("Visit Suryanar Koil for the Sun's blessing", "சூரியனின் ஆசீர்வாதத்திற்கு சூரியனார் கோயில் தரிசனம்"),
  step4_b: s("Suryanar Koil (near Kumbakonam) is the Navagraha sthalam for the Sun. For health prayers specifically linked to vitality, eyesight, heart or the father, this temple is the natural companion to Vaitheeswaran Koil.", "சூரியனார் கோயில் (கும்பகோணம் அருகே) சூரியனுக்குரிய நவகிரக ஸ்தலம். உயிர்சக்தி, பார்வை, இதயம் அல்லது தந்தையுடன் குறிப்பாக தொடர்புடைய ஆரோக்கிய பிரார்த்தனைகளுக்கு, இந்த கோயில் வைத்தீஸ்வரன் கோயிலுக்கு இயல்பான துணை."),
  step5_t: s("Always continue qualified medical treatment", "எப்போதும் தகுதியான மருத்துவ சிகிச்சையை தொடருங்கள்"),
  step5_b: s("Devotion strengthens the mind and spirit — which supports healing — but it does not replace diagnosis, medicine or surgery. Mahamrityunjaya and temple prayer are most powerful alongside a doctor, not instead of one.", "பக்தி மனதையும் ஆவியையும் வலுப்படுத்துகிறது — இது குணமடைதலை ஆதரிக்கிறது — ஆனால் கண்டறிதல், மருந்து அல்லது அறுவை சிகிச்சைக்கு மாற்றல்ல. மஹாம்ருத்யுஞ்சயம் & கோயில் பிரார்த்தனை மருத்துவருடன் இணைந்தபோது மிகவும் சக்திவாய்ந்தவை, அவருக்கு மாற்றாக அல்ல."),
  temple_h2:     s("Key temples for this pariharam", "இந்த பரிகாரத்திற்கான முக்கிய கோயில்கள்"),
  temple_body:   s(
    "Vaitheeswaran Koil (Mars-healing, Shiva as Vaidyanatha, near Chidambaram) is the primary temple. Suryanar Koil (near Kumbakonam) for vitality and Sun-related health. Thirunallar (Sani, near Karaikal) is included when Saturn is the afflicting planet for chronic illness or longevity concerns. The Pancha Bhoota Sthalams are traditionally visited for body-element purification when systemic illness is present.",
    "வைத்தீஸ்வரன் கோயில் (செவ்வாய்-வைத்தியம், சிவன் வைத்தியநாதர், சிதம்பரம் அருகே) முதன்மையான கோயில். உயிர்சக்தி & சூரியன் தொடர்பான ஆரோக்கியத்திற்கு சூரியனார் கோயில் (கும்பகோணம் அருகே). நீடித்த நோய் அல்லது ஆயுள் கவலைகளுக்கு சனி பாதிக்கும் கிரகமாக இருக்கும்போது திருநள்ளாறு (சனி, காரைக்கால் அருகே) சேர்க்கப்படுகிறது. உடல் உறுப்பு சுத்திகரிப்பிற்கு பஞ்ச பூத ஸ்தலங்கள் முறையான நோய் இருக்கும்போது பாரம்பரியமாக தரிசிக்கப்படுகின்றன."
  ),
  slokam_label:  s("Mahamrityunjaya Mantra", "மஹாம்ருத்யுஞ்சய மந்திரம்"),
  slokam_text:   s("Om Tryambakam Yajamahe Sugandhim Pushtivardhanam · Urvarukamiva Bandhanan Mrityor Mukshiya Maamritat", "ஓம் த்ர்யம்பகம் யஜாமஹே சுகந்திம் புஷ்டிவர்தனம் · உர்வாருகமிவ பந்தனான் ம்ருத்யோர் முக்ஷீய மாம்ருதாத்"),
  slokam_meaning: s(
    "The great Shiva mantra for overcoming illness and death — 'We worship the three-eyed one who is fragrant and nourishing; as a cucumber ripens and falls from its vine, may we be freed from death and suffering, not from immortality.' Recited 108 times daily with deep sincerity.",
    "நோய் & மரணத்தை வெல்வதற்கான பெரும் சிவ மந்திரம் — 'மூன்று கண்களையும், மணமும் போஷகத்தன்மையும் கொண்ட இறைவனை வழிபடுகிறோம்; வெள்ளரி கொடியிலிருந்து பழுத்து விழுவதுபோல, மரணம் & துன்பத்திலிருந்து, அமரத்துவத்திலிருந்து அல்ல, விடுதலை பெறுவோமாக.' தீவிர நேர்மையுடன் தினமும் 108 முறை ஓதப்படுகிறது."
  ),
  related_h2:    s("Related guides", "தொடர்புடைய வழிகாட்டிகள்"),
};

export const PARIHARAM_AYUL_FAQ = [
  {
    q: s("Can this pariharam cure illness?", "இந்த பரிகாரம் நோயைக் குணப்படுத்துமா?"),
    a: s("Pariharam supports the mind's strength during illness — which genuinely helps healing — but it is not a medical cure. Always continue your doctor's treatment. Devotion and medicine together are more powerful than either alone.", "பரிகாரம் நோயின்போது மனதின் பலத்தை ஆதரிக்கிறது — இது குணமடைதலை உண்மையில் உதவுகிறது — ஆனால் மருத்துவ தீர்வு அல்ல. உங்கள் மருத்துவரின் சிகிச்சையை எப்போதும் தொடருங்கள். பக்தியும் மருத்துவமும் சேர்ந்து தனியாக ஒவ்வொன்றையும் விட சக்திவாய்ந்தவை."),
  },
  {
    q: s("What if the 8th lord is strong — is that bad?", "8-ஆம் அதிபதி பலமாக இருந்தால் — அது கெட்டதா?"),
    a: s("Not necessarily. A strong 8th lord can also give long life and occult insight. The 8th house is complex — it governs lifespan, transformation and hidden things. A strong 8th lord with good aspects is often a longevity indicator, not a threat.", "அவசியமில்லை. பலமான 8-ஆம் அதிபதி நீண்ட ஆயுளையும் ரகசிய ஞானத்தையும் தரலாம். 8-ஆம் பாவம் சிக்கலானது — ஆயுள், மாற்றம், மறைந்த விஷயங்கள் ஆகியவற்றை ஆளுகிறது. நல்ல பார்வையுடன் பலமான 8-ஆம் அதிபதி பெரும்பாலும் ஆயுள் அறிகுறி, அச்சுறுத்தல் அல்ல."),
  },
  {
    q: s("How often should I recite Mahamrityunjaya?", "மஹாம்ருத்யுஞ்சயம் எவ்வளவு அடிக்கடி ஓத வேண்டும்?"),
    a: s("Daily recitation of 108 times is traditional and most effective. If 108 is not possible, a consistent smaller count — 11, 21, or 27 — maintained daily is better than occasional large counts.", "108 முறை தினசரி ஜெபம் பாரம்பரியம் மற்றும் மிகவும் பயனுள்ளது. 108 சாத்தியமில்லாவிட்டால், தினமும் பராமரிக்கப்படும் சீரான சிறிய எண்ணிக்கை — 11, 21, அல்லது 27 — எப்போதாவது பெரிய எண்ணிக்கையை விட சிறந்தது."),
  },
  {
    q: s("Is this pariharam appropriate even if health is good currently?", "தற்போது ஆரோக்கியம் நல்லாக இருந்தாலும் இந்த பரிகாரம் ஏற்றதா?"),
    a: s("Yes. Many people do Mahamrityunjaya and Surya worship as a preventive, life-affirming practice rather than in response to illness. It is traditionally considered auspicious for longevity and vitality even in good health.", "ஆம். பலர் நோயின் பதிலாக அல்ல, தடுப்பு, வாழ்க்கையை உறுதிப்படுத்தும் நடைமுறையாக மஹாம்ருத்யுஞ்சயம் & சூரிய வழிபாடு செய்கிறார்கள். நல்ல ஆரோக்கியத்திலும் ஆயுளுக்கும் உயிர்சக்திக்கும் மங்களமாகக் கருதப்படுகிறது."),
  },
];

// ─── TEMPLE — THIRUMANANJERI ─────────────────────────────────────────────────

export const TEMPLE_THIRUMANANJERI = {
  eyebrow:       s("Temple Guide · Thirumananjeri", "கோயில் வழிகாட்டி · திருமணஞ்சேரி"),
  h1:            s("Thirumananjeri — the temple of the divine marriage", "திருமணஞ்சேரி — தெய்வீக திருமணத்தின் கோயில்"),
  lead:          s(
    "Thirumananjeri (near Mayiladuthurai) is where, by tradition, Goddess Parvati married Lord Shiva — making it the foremost temple for marriage blessings in Tamil astrology and the primary pariharam destination for thirumana thadai.",
    "திருமணஞ்சேரி (மயிலாடுதுறை அருகே) பாரம்பரியத்தின்படி, தேவி பார்வதி சிவபெருமானை மணந்த இடம் — இது தமிழ் ஜோதிடத்தில் திருமண வாழ்த்துகளுக்கான முதன்மையான கோயிலாகவும் திருமணத் தடை பரிகாரத்திற்கான முதன்மையான இலக்காகவும் ஆகிறது."
  ),
  about_h2:      s("About the temple and its sthalapurana", "கோயிலும் ஸ்தல புராணமும்"),
  about_body:    s(
    "The presiding deity is Shiva as Sivakama Sundara (the handsome Lord who fulfils desires) and the Goddess is Kokilambika (she whose voice is as sweet as a cuckoo). The sthalapurana holds that the celestial marriage of Shiva and Parvati took place at this very spot — and that all who pray here for a good marriage receive the Goddess's particular blessing. The vimanam is ancient, the sthala vriksha (sacred tree) is the vilva, and the sthala theertham (sacred tank) is the Chakra Theertham.",
    "பிரதான தெய்வம் சிவன் சிவகாம சுந்தரராக (ஆசைகளை நிறைவேற்றும் அழகான இறைவன்) மற்றும் தேவி கோகிலாம்பிகையாக (குயிலைப் போல் இனிய குரலுடையவள்) உள்ளார். ஸ்தல புராணம் சிவன் & பார்வதியின் விண்ணகத் திருமணம் இந்த இடத்திலேயே நடந்தது என்று சொல்கிறது — இங்கே நல்ல திருமணத்திற்காக பிரார்த்திப்போர் அனைவரும் தேவியின் குறிப்பான ஆசீர்வாதம் பெறுவர். விமானம் பண்டையது, ஸ்தல விருட்சம் வில்வம், ஸ்தல தீர்த்தம் சக்ர தீர்த்தம்."
  ),
  power_h2:      s("What this temple is known for", "இந்த கோயில் எதற்காக அறியப்படுகிறது"),
  power_body:    s(
    "Thirumananjeri is primarily a marriage-blessing temple — the destination for prayers about marriage delay (thirumana thadai), finding a compatible partner, and family harmony after marriage. It is also visited for blessings related to Jupiter (Guru) and Venus (Sukra), which govern marriage in the chart. When Jupiter aspects the 7th house or the 7th lord, this temple amplifies that grace. Newly married couples also visit to receive the blessing of the divine marriage that took place here.",
    "திருமணஞ்சேரி முதன்மையாக திருமண வாழ்த்து கோயில் — திருமண தாமதம் (திருமணத் தடை), பொருத்தமான துணை கண்டுபிடித்தல், திருமணத்திற்கு பிறகு குடும்ப நல்லிணக்கம் ஆகியவற்றிற்கான பிரார்த்தனை இலக்கு. ஜாதகத்தில் திருமணத்தை நிர்வகிக்கும் குரு (Guru) மற்றும் சுக்கிரன் (Sukra) தொடர்பான வாழ்த்துகளுக்கும் தரிசிக்கப்படுகிறது. குரு 7-ஆம் பாவம் அல்லது 7-ஆம் அதிபதியை பார்க்கும்போது, இந்த கோயில் அந்த அருளை பெருக்குகிறது. புதிதாக திருமணமான ஜோடிகளும் இங்கே நடந்த தெய்வீக திருமணத்தின் வாழ்த்தை பெறுவதற்காக வருகிறார்கள்."
  ),
  when_h2:       s("Best times to visit", "தரிசிக்க சிறந்த நேரங்கள்"),
  when_body:     s(
    "Panguni Uthiram (Panguni month, Uthiram nakshathiram) is the most auspicious time — this is when the divine marriage is celebrated here each year with grand festival. Aadi Pooram (in the Tamil month of Aadi), Fridays, and Tuesdays are also specially auspicious for this temple. Those in a Venus or Jupiter dasha, or facing 7th house pressure, are particularly recommended to visit during these windows. For pariharam visits, a Thursday (Jupiter's day) combined with the puja timing works well.",
    "பங்குனி உத்திரம் (பங்குனி மாதம், உத்திரம் நட்சத்திரம்) மிகவும் மங்களகரமான நேரம் — ஒவ்வொரு ஆண்டும் தெய்வீக திருமணம் இங்கே பெரும் திருவிழாவுடன் கொண்டாடப்படுகிறது. ஆடி பூரம் (தமிழ் ஆடி மாதம்), வெள்ளிகிழமைகள், செவ்வாய்க்கிழமைகள் ஆகியவையும் இந்த கோயிலுக்கு குறிப்பாக சுபமானவை. சுக்கிர அல்லது குரு தசையில் இருப்பவர்கள், அல்லது 7-ஆம் பாவ அழுத்தம் உள்ளவர்கள், இந்த காலகட்டங்களில் தரிசிக்க குறிப்பாக பரிந்துரைக்கப்படுகிறார்கள். பரிகார தரிசனத்திற்கு வியாழன் (குருவின் நாள்) பூஜை நேரத்துடன் சேர்ந்து நன்றாக வேலை செய்கிறது."
  ),
  slokam_label:  s("Swayamvara Parvati Mantra", "சுயம்வர பார்வதி மந்திரம்"),
  slokam_text:   s("Om Hreem Yogini Yogini Yogeswari Yoga Bhayankari Sakala Sthavara Jangamasya Mukha Hridayam Mama Vasam Akarsha Akarshaya Namah", "ஓம் ஹ்ரீம் யோகினி யோகினி யோகேஸ்வரி யோக பயங்கரி சகல ஸ்தாவர ஜங்கமஸ்ய முக ஹ்ருதயம் மம வசம் ஆகர்ஷ ஆகர்ஷய நமஹ"),
  slokam_meaning: s(
    "The Swayamvara Parvati mantra, inviting the Goddess's grace for a good marriage match. Recited on Fridays and Tuesdays with a ghee lamp, particularly by those awaiting a suitable partner.",
    "நல்ல திருமண பொருத்தத்திற்கான தேவியின் அருளை வரவழைக்கும் சுயம்வர பார்வதி மந்திரம். ஒரு பொருத்தமான துணையை எதிர்நோக்குபவர்களால் குறிப்பாக, நெய் விளக்குடன் வெள்ளி & செவ்வாய்க்கிழமைகளில் ஓதப்படுகிறது."
  ),
  related_h2:    s("Related guides", "தொடர்புடைய வழிகாட்டிகள்"),
};

export const TEMPLE_THIRUMANANJERI_FAQ = [
  {
    q: s("Can I visit Thirumananjeri even if I am already married?", "திருமணமான பிறகும் திருமணஞ்சேரி செல்லலாமா?"),
    a: s("Yes — many couples visit after marriage to receive the temple's blessing for a harmonious life together. The divine marriage celebrated here is a blessing for all partnerships, not just those seeking a match.", "ஆம் — பல தம்பதிகள் திருமணத்திற்கு பிறகு கூட்டு வாழ்க்கைக்கான கோயிலின் வாழ்த்தை பெறுவதற்காக தரிசிக்கிறார்கள். இங்கே கொண்டாடப்படும் தெய்வீக திருமணம் பொருத்தம் தேடுபவர்களுக்கு மட்டுமல்ல, எல்லா கூட்டு உறவுகளுக்கும் வாழ்த்து."),
  },
  {
    q: s("Is this temple specifically for Sevvai dosham pariharam?", "இந்த கோயில் குறிப்பாக செவ்வாய் தோஷ பரிகாரத்திற்கானதா?"),
    a: s("No. Thirumananjeri is primarily a marriage-blessing temple (Shiva-Parvati union). For Sevvai dosham pariharam, Vaitheeswaran Koil (Mars) is primary; Thirumananjeri is visited for the broader marriage delay remedy (thirumana thadai pariharam).", "இல்லை. திருமணஞ்சேரி முதன்மையாக திருமண வாழ்த்து கோயில் (சிவன்-பார்வதி சேர்க்கை). செவ்வாய் தோஷ பரிகாரத்திற்கு வைத்தீஸ்வரன் கோயில் (செவ்வாய்) முதன்மையானது; திருமணஞ்சேரி பரந்த திருமண தாமதம் (திருமணத் தடை பரிகாரம்) தீர்விற்கு தரிசிக்கப்படுகிறது."),
  },
  {
    q: s("Do I need to do a specific puja or can I just visit?", "குறிப்பிட்ட பூஜை செய்ய வேண்டுமா, வெறும் தரிசனம் செய்தால் போதுமா?"),
    a: s("A simple darshan with a clear, sincere sankalpam is enough. If you wish to do a formal puja, the temple has a specific Swayamvara puja for marriage blessings. Either approach with genuine intent is what matters.", "தெளிவான, நேர்மையான சங்கல்பத்துடன் எளிய தரிசனம் போதும். விதிவிலக்கான பூஜை செய்ய விரும்பினால், கோயிலில் திருமண வாழ்த்துகளுக்கான குறிப்பிட்ட சுயம்வர பூஜை உள்ளது. உண்மையான எண்ணத்துடன் எந்த அணுகுமுறையும் முக்கியம்."),
  },
  {
    q: s("Can non-Hindus visit this temple?", "இந்துவல்லாதவர்கள் இந்த கோயிலுக்கு வரலாமா?"),
    a: s("This is a traditional Agamic temple with standard entry rules. Check with the temple office about any specific entry guidelines for non-Hindus, as these can vary by temple and by puja type.", "இது நிலையான நுழைவு விதிகளுடைய பாரம்பரிய ஆகம கோயில். இந்துவல்லாதவர்களுக்கான குறிப்பிட்ட நுழைவு வழிகாட்டுதல்களைப் பற்றி கோயில் அலுவலகத்திடம் சரிபாருங்கள், ஏனெனில் இவை கோயில் மற்றும் பூஜை வகையால் மாறுபடலாம்."),
  },
];

// ─── TEMPLE — PANCHA BHOOTA STHALAMS ─────────────────────────────────────────

export const TEMPLE_PANCHA_BHOOTA = {
  eyebrow:       s("Temple Guide · Pancha Bhoota Sthalams", "கோயில் வழிகாட்டி · பஞ்ச பூத ஸ்தலங்கள்"),
  h1:            s("Pancha Bhoota Sthalams — the five element temples of Shiva", "பஞ்ச பூத ஸ்தலங்கள் — சிவனின் ஐம்பூத கோயில்கள்"),
  lead:          s(
    "The Pancha Bhoota Sthalams are five ancient Shiva temples in South India, each enshrining the Lord as one of the five elements — Earth, Water, Fire, Wind, Space. Together they form the most profound pilgrimage circuit for elemental purification and planetary harmony.",
    "பஞ்ச பூத ஸ்தலங்கள் தென்னிந்தியாவிலுள்ள ஐந்து பண்டைய சிவன் கோயில்கள், ஒவ்வொன்றும் இறைவனை ஐம்பூதங்களில் ஒன்றாக — மண், நீர், நெருப்பு, காற்று, ஆகாயம் — பிரதிஷ்டை செய்கின்றன. ஒன்றாக அவை பூத சுத்திகரணம் & கிரக நல்லிணக்கத்திற்கான மிக ஆழமான யாத்திரை சுற்றை உருவாக்குகின்றன."
  ),
  about_h2:      s("The five temples and their elements", "ஐந்து கோயில்களும் அவற்றின் பூதங்களும்"),
  about_body:    s(
    "Each of the five temples enshrines Shiva as a form of one element, and each has its own sthalapurana and power: Ekambareswarar (Kanchipuram) — Earth (Prithvi); Shiva appears as a mango tree, Goddess as Kamakshi. Jambukeswarar / Thiruvanaikaval (Thiruvanaikaval, Tiruchirappalli) — Water (Appu); the lingam is always under a natural spring. Arunachaleswarar (Thiruvannamalai) — Fire (Tejas); the holy hill Arunachala is itself the Fire lingam. Srikalahasti Temple (Andhra Pradesh) — Wind (Vayu); the sacred spider, serpent and elephant worshipped here. Nataraja Temple, Chidambaram — Space / Ether (Akash); the Chidambara Rahasyam — the formless divine.",
    "ஐந்து கோயில்களில் ஒவ்வொன்றும் சிவனை ஒரு பூதத்தின் வடிவமாக பிரதிஷ்டை செய்கிறது, ஒவ்வொன்றிற்கும் அதன் சொந்த ஸ்தல புராணமும் சக்தியும் உண்டு: ஏகாம்பரேஸ்வரர் (காஞ்சிபுரம்) — மண் (பிருத்வி); சிவன் ஒரு மாமரமாக தோன்றுகிறார், தேவி காமாக்ஷி. ஜம்புகேஸ்வரர் / திருவானைக்காவல் (திருவானைக்காவல், திருச்சிராப்பள்ளி) — நீர் (அப்பு); லிங்கம் எப்போதும் இயற்கையான ஊற்றின் கீழ் உள்ளது. அருணாசலேஸ்வரர் (திருவண்ணாமலை) — நெருப்பு (தேஜஸ்); புனிதமான அருணாச்சல மலையே நெருப்பு லிங்கம். ஸ்ரீகாளஹஸ்தி கோயில் (ஆந்திர பிரதேசம்) — காற்று (வாயு); புனித சிலந்தி, பாம்பு, யானை இங்கே வழிபடப்படுகின்றன. நடராஜர் கோயில், சிதம்பரம் — ஆகாயம் / ஈதர் (ஆகாஸ்); சிதம்பர ரகசியம் — வடிவமற்ற தெய்வம்."
  ),
  power_h2:      s("What the Pancha Bhoota circuit is known for", "பஞ்ச பூத சுற்று எதற்காக அறியப்படுகிறது"),
  power_body:    s(
    "In Tamil astrology, illness, chronic imbalance, and persistent life difficulty are sometimes attributed to elemental disruption — when one of the five body elements is weakened or out of harmony. Visiting all five sthalams in sequence is a traditional purification for such systemic difficulty. The circuit is also done during Saturn or Rahu periods (which can disrupt elemental harmony) and as a life pilgrimage for spiritual merit. Each temple also has its own individual significance — Chidambaram for the mind and liberation, Thiruvannamalai for fire-energy and intensity, Kanchipuram for grounding and stability.",
    "தமிழ் ஜோதிடத்தில், நோய், நீடித்த சமன்பாடின்மை, தொடர்ந்த வாழ்க்கை சிரமம் சில நேரங்களில் பூத குழப்பத்திற்கு — ஐந்து உடல் பூதங்களில் ஒன்று பலவீனமாக அல்லது சமன்பாடின்றி இருக்கும்போது — கட்டளையிடப்படுகின்றன. அனைத்து ஐந்து ஸ்தலங்களையும் வரிசையாக தரிசிப்பது இத்தகைய முறையான சிரமத்திற்கான பாரம்பரிய சுத்திகரணம். சனி அல்லது ராகு காலங்களிலும் (இவை பூத நல்லிணக்கத்தை சீர்குலைக்கலாம்) ஆன்ம புண்ணியத்திற்கான வாழ்க்கை யாத்திரையாகவும் சுற்று செய்யப்படுகிறது. ஒவ்வொரு கோயிலுக்கும் அதன் சொந்த தனிப்பட்ட முக்கியத்துவம் உண்டு — மனம் & விமோசனத்திற்கு சிதம்பரம், நெருப்பு சக்தி & தீவிரத்திற்கு திருவண்ணாமலை, ஆதாரம் & நிலைத்தன்மைக்கு காஞ்சிபுரம்."
  ),
  when_h2:       s("When and how to do the circuit", "சுற்றை எப்போது, எப்படி செய்வது"),
  when_body:     s(
    "The most common approach is to complete all five temples in 3–5 days in a single trip. The traditional order is: Kanchipuram → Thiruvanaikaval → Thiruvannamalai → Srikalahasti → Chidambaram. Mahashivaratri is auspicious for any of these individually. Saturn and Rahu dasha periods are the most recommended times for the full circuit as a remedy. Kartika month (Tamil Karthigai) is especially powerful at Thiruvannamalai (the Karthigai Deepam festival). Even visiting one or two of these temples has individual significance — the full circuit is not required for benefit.",
    "மிகவும் பொதுவான அணுகுமுறை ஒரே பயணத்தில் 3–5 நாட்களில் அனைத்து ஐந்து கோயில்களையும் நிறைவு செய்வது. பாரம்பரிய வரிசை: காஞ்சிபுரம் → திருவானைக்காவல் → திருவண்ணாமலை → ஸ்ரீகாளஹஸ்தி → சிதம்பரம். மஹாசிவராத்திரி இவற்றில் எதற்கும் தனித்தனியாக மங்களகரமானது. சனி & ராகு தசை காலங்கள் பரிகாரமாக முழு சுற்றுக்கு மிகவும் பரிந்துரைக்கப்படும் நேரங்கள். கார்த்திக மாதம் (தமிழ் கார்த்திகை) திருவண்ணாமலையில் குறிப்பாக சக்திவாய்ந்தது (கார்த்திகை தீப திருவிழா). இந்த கோயில்களில் ஒன்று அல்லது இரண்டை மட்டும் தரிசிப்பதும் தனிப்பட்ட முக்கியத்துவம் கொண்டது — நலனுக்கு முழு சுற்று தேவையில்லை."
  ),
  slokam_label:  s("Panchakshara Mantra", "பஞ்சாக்ஷர மந்திரம்"),
  slokam_text:   s("Om Namah Shivaaya", "ஓம் நமஃ சிவாய"),
  slokam_meaning: s(
    "The five-syllable mantra of Shiva — Na (earth), Ma (water), Shi (fire), Va (wind), Ya (space) — encoding the five elements. The most powerful mantra for this circuit, recited at each of the five sthalams.",
    "சிவனின் ஐந்தெழுத்து மந்திரம் — ந (மண்), ம (நீர்), சி (நெருப்பு), வ (காற்று), ய (ஆகாயம்) — ஐம்பூதங்களை குறியாக்குகிறது. இந்த சுற்றிற்கான மிகவும் சக்திவாய்ந்த மந்திரம், ஐந்து ஸ்தலங்களில் ஒவ்வொன்றிலும் ஓதப்படுகிறது."
  ),
  related_h2:    s("Related guides", "தொடர்புடைய வழிகாட்டிகள்"),
};

export const TEMPLE_PANCHA_BHOOTA_FAQ = [
  {
    q: s("Do I have to visit all five temples for the remedy to work?", "பரிகாரம் வேலை செய்ய ஐந்து கோயில்களும் தரிசிக்க வேண்டுமா?"),
    a: s("No. Visiting even one or two of these temples has its own individual significance. The full circuit amplifies the benefit, but any of these temples can be visited independently for their own power.", "இல்லை. இந்த கோயில்களில் ஒன்று அல்லது இரண்டை தரிசிப்பதும் அதன் சொந்த தனிப்பட்ட முக்கியத்துவம் கொண்டது. முழு சுற்று நலனை பெருக்குகிறது, ஆனால் இந்த கோயில்களில் எதுவும் அவற்றின் சொந்த சக்திக்காக சுதந்திரமாக தரிசிக்கப்படலாம்."),
  },
  {
    q: s("What is the significance of visiting these during Saturn's dasha?", "சனி தசையில் இவற்றை தரிசிப்பதன் முக்கியத்துவம் என்ன?"),
    a: s("Saturn's energy is associated with slowness, discipline and the body's structural elements — earth and air. Visiting Ekambareswarar (earth) and Srikalahasti (wind/air) during Sani dasha is particularly meaningful for grounding and stability.", "சனியின் சக்தி மெதுவான தன்மை, ஒழுக்கம், உடலின் கட்டமைப்பு பூதங்கள் — மண் & காற்று — ஆகியவற்றுடன் தொடர்புடையது. சனி தசையில் ஏகாம்பரேஸ்வரர் (மண்) & ஸ்ரீகாளஹஸ்தி (காற்று) தரிசிப்பது ஆதாரம் & நிலைத்தன்மைக்கு குறிப்பாக அர்த்தமுள்ளது."),
  },
  {
    q: s("Is Chidambaram only for the element of space?", "சிதம்பரம் ஆகாய பூதத்திற்கு மட்டுமா?"),
    a: s("Chidambaram is the akash (space/ether) sthalam and also the primary temple of Nataraja (Shiva as cosmic dancer) — it is considered the most spiritually profound of the five, representing the formless divine beyond element. Many visit it independently for liberation, mind-clarity and cosmic perspective.", "சிதம்பரம் ஆகாஸ (ஆகாயம்/ஈதர்) ஸ்தலமும் நடராஜரின் (பிரபஞ்சப் நடனராடும் சிவன்) முதன்மையான கோயிலும் — இது ஐந்தில் மிகவும் ஆன்மீக ஆழமுடையதாகக் கருதப்படுகிறது, பூதத்திற்கு அப்பால் வடிவமற்ற தெய்வத்தை குறிக்கிறது. பலர் விடுதலை, மன தெளிவு, பிரபஞ்சக் கண்ணோட்டத்திற்காக சுதந்திரமாக தரிசிக்கிறார்கள்."),
  },
  {
    q: s("How long does the full circuit take?", "முழு சுற்று எவ்வளவு நேரம் ஆகும்?"),
    a: s("Most pilgrims complete the full circuit in 3–5 days by road. Kanchipuram and Thiruvanaikaval are near each other (1–2 hours apart); Thiruvannamalai and Chidambaram are another cluster; Srikalahasti is in Andhra and can be added on the route back or done as a separate trip.", "பெரும்பாலான யாத்திரிகர்கள் சாலையில் 3–5 நாட்களில் முழு சுற்றை நிறைவு செய்கிறார்கள். காஞ்சிபுரம் & திருவானைக்காவல் ஒருவருக்கொருவர் அருகில் உள்ளன (1–2 மணி நேர இடைவெளி); திருவண்ணாமலை & சிதம்பரம் மற்றொரு குழு; ஸ்ரீகாளஹஸ்தி ஆந்திரத்தில் உள்ளது, திரும்பும் வழியில் சேர்க்கலாம் அல்லது தனி பயணமாக செய்யலாம்."),
  },
];

// ─── TEMPLE — ARUPADAI VEEDU ─────────────────────────────────────────────────

export const TEMPLE_ARUPADAI_VEEDU = {
  eyebrow:       s("Temple Guide · Arupadai Veedu", "கோயில் வழிகாட்டி · அறுபடை வீடு"),
  h1:            s("Arupadai Veedu — the six sacred abodes of Lord Murugan", "அறுபடை வீடு — முருகப் பெருமானின் ஆறு திருப்பதிகள்"),
  lead:          s(
    "The Arupadai Veedu are the six most sacred shrines of Lord Murugan in Tamil Nadu — each representing a different quality of his divine presence: warrior, teacher, bridegroom, wanderer, compassionate healer, and supreme grace.",
    "அறுபடை வீடுகள் தமிழ்நாட்டில் முருகப் பெருமானின் ஆறு மிகவும் புனிதமான திருப்பதிகள் — ஒவ்வொன்றும் அவரது தெய்வீக இருப்பின் வேறுபட்ட குணத்தை குறிக்கின்றன: போர்வீரன், ஆசிரியன், மணமகன், அலைந்திரிபவன், இரக்கமுள்ள வைத்தியன், உச்ச அருள்."
  ),
  about_h2:      s("The six temples — who they are and what they represent", "ஆறு கோயில்கள் — அவை யாவை, அவை என்னை குறிக்கின்றன"),
  about_body:    s(
    "Thiruparankundram (Madurai) — the first abode; Murugan as bridegroom (Devasena kalyanam), for marriage blessings and fulfilment of desires. Thiruchendur (Tuticorin coast) — the warrior temple; Murugan's victory over Surapadman, for protection and strength in adversity. Palani (Dindigul) — the wanderer; Murugan as the renunciant (wearing only a loincloth), for dissolving ego, obstacles and Saturn pressure. Swamimalai (Kumbakonam) — the teacher; Murugan as Guru who taught the Pranava Mantra to Brahma, for wisdom, speech and Jupiter's blessing. Thiruvannamalai / Pazhamudircholai (Madurai hills) — the forest abode; Murugan as the serene lord of nature, for peace, healing and family harmony. Thiruthani (Thiruvannamalai district) — the resting abode; Murugan's rest and victory-gift after battle, for grace under difficult personal karma.",
    "திருப்பரங்குன்றம் (மதுரை) — முதல் படை வீடு; முருகன் மணமகனாக (தேவசேனா கல்யாணம்), திருமண வாழ்த்துகள் & ஆசை நிறைவேற்றத்திற்காக. திருச்செந்தூர் (தூத்துக்குடி கரை) — போர் கோயில்; சூரபத்மன் மீது முருகனின் வெற்றி, பாதுகாப்பு & இக்கட்டான நேரத்தில் வலிமைக்காக. பழனி (டிண்டுக்கல்) — அலைந்திரிபவன்; முருகன் துறவியாக (கோவணம் மட்டும் அணிந்து), அகங்காரம், தடைகள், சனி அழுத்தம் கரைப்பதற்காக. சுவாமிமலை (கும்பகோணம்) — ஆசிரியன்; பிரணவ மந்திரத்தை பிரம்மாவுக்கு கற்றுக்கொடுத்த குருவாக முருகன், ஞானம், பேச்சு, குருவின் வாழ்த்துக்காக. திருவாவினன்குடி / பழமுதிர்ச்சோலை (மதுரை மலைகள்) — வனப்படை வீடு; முருகன் இயற்கையின் அமைதியான தேவனாக, அமைதி, குணமடைதல், குடும்ப நல்லிணக்கத்திற்காக. திருத்தணி (திருவள்ளூர் மாவட்டம்) — தங்கும் படை வீடு; போரிற்கு பின் முருகனின் ஓய்வு & வெற்றி வரம், கடினமான தனிப்பட்ட கர்மத்தில் அருளுக்காக."
  ),
  power_h2:      s("What these temples are known for — pilgrimage purpose", "இந்த கோயில்கள் எதற்காக அறியப்படுகின்றன — யாத்திரை நோக்கம்"),
  power_body:    s(
    "In Tamil astrology, the Arupadai Veedu pilgrimage is the primary remedy for Sevvai dosham, strong Mars energy, and life challenges requiring courage and clarity. Each temple has its specific power: Thiruparankundram for marriage desires; Thiruchendur for protection in crisis; Palani for surrendering ego and overcoming Saturn/Rahu blocks; Swamimalai for wisdom and Jupiter's grace; Pazhamudircholai for healing and peace; Thiruthani for rest and the courage to continue after setback. The full circuit is traditionally done over 5–7 days and considered one of the most powerful remedies in Tamil devotional tradition.",
    "தமிழ் ஜோதிடத்தில், அறுபடை வீடு யாத்திரை செவ்வாய் தோஷம், வலுவான செவ்வாய் சக்தி, தைரியம் & தெளிவு தேவைப்படும் வாழ்க்கை சவால்களுக்கான முதன்மையான பரிகாரம். ஒவ்வொரு கோயிலுக்கும் அதன் குறிப்பிட்ட சக்தி உண்டு: திருப்பரங்குன்றம் திருமண ஆசைகளுக்கு; திருச்செந்தூர் நெருக்கடியில் பாதுகாப்பிற்கு; பழனி அகங்காரம் சரணடைந்து சனி/ராகு தடைகள் கடப்பதற்கு; சுவாமிமலை ஞானம் & குருவின் அருளுக்கு; பழமுதிர்ச்சோலை குணமடைதல் & அமைதிக்கு; திருத்தணி தோல்விக்கு பின் தொடர தைரியம் & ஓய்வுக்கு. முழு சுற்று பாரம்பரியமாக 5–7 நாட்களில் செய்யப்பட்டு தமிழ் பக்தி மரபில் மிகவும் சக்திவாய்ந்த பரிகாரங்களில் ஒன்றாகக் கருதப்படுகிறது."
  ),
  when_h2:       s("Best times to visit", "தரிசிக்க சிறந்த நேரங்கள்"),
  when_body:     s(
    "Skanda Sashti (the six-day festival in Tamil Karthigai / October-November) is the most powerful time for any Murugan temple, and especially for Thiruchendur — where the Soorasamharam (victory over Surapadman) is re-enacted dramatically. Karthigai Deepam, Thaipusam (Thai month), and Vaikasi Visakam are all auspicious. Tuesdays are Murugan's day (Mars governs the same energy). For Sevvai dosham pariharam, visiting on a Tuesday during Mars dasha or antardasha is particularly meaningful. Individual temples have their own festivals — Thiruparankundram's Panguni Uthiram and Palani's Thaipusam are the largest individual mela-s.",
    "ஸ்கந்த சஷ்டி (தமிழ் கார்த்திகை / அக்டோபர்-நவம்பர் மாதங்களில் ஆறு நாள் திருவிழா) எந்த முருகன் கோயிலுக்கும் மிகவும் சக்திவாய்ந்த நேரம், குறிப்பாக திருச்செந்தூருக்கு — சூரசம்ஹாரம் (சூரபத்மன் மீது வெற்றி) இங்கே வியத்தகு முறையில் மீண்டும் நடிக்கப்படுகிறது. கார்த்திகை தீபம், தைப்பூசம் (தை மாதம்), வைகாசி விசாகம் ஆகியவை மங்களகரமானவை. செவ்வாய்க்கிழமைகள் முருகனின் நாள் (செவ்வாய் அதே சக்தியை ஆளுகிறது). செவ்வாய் தோஷ பரிகாரத்திற்கு செவ்வாய் தசை அல்லது அந்தர்தசையில் செவ்வாய்க்கிழமை தரிசிப்பது குறிப்பாக அர்த்தமுள்ளது. தனிப்பட்ட கோயில்களுக்கு அவற்றின் சொந்த திருவிழாக்கள் உள்ளன — திருப்பரங்குன்றத்தின் பங்குனி உத்திரம் & பழனியின் தைப்பூசம் மிகப் பெரிய தனிப்பட்ட மேளாக்கள்."
  ),
  slokam_label:  s("Murugan Mantra (Shadakshara)", "முருகன் மந்திரம் (ஷடக்ஷர)"),
  slokam_text:   s("Om Saravanabhava", "ஓம் சரவணபவ"),
  slokam_meaning: s(
    "The six-syllable mantra of Murugan — each syllable said to correspond to one of the six sacred abodes. The simplest and most powerful Murugan mantra, recited especially on Tuesdays and through the Skanda Sashti period.",
    "முருகனின் ஆறெழுத்து மந்திரம் — ஒவ்வொரு எழுத்தும் ஆறு புனிதமான படை வீடுகளில் ஒன்றை குறிப்பதாக சொல்லப்படுகிறது. எளிமையான & மிகவும் சக்திவாய்ந்த முருகன் மந்திரம், குறிப்பாக செவ்வாய்க்கிழமைகளிலும் ஸ்கந்த சஷ்டி காலம் முழுவதும் ஓதப்படுகிறது."
  ),
  related_h2:    s("Related guides", "தொடர்புடைய வழிகாட்டிகள்"),
};

export const TEMPLE_ARUPADAI_VEEDU_FAQ = [
  {
    q: s("Do I need to visit all six temples for the pilgrimage to work?", "யாத்திரை வேலை செய்ய ஆறு கோயில்களும் தரிசிக்க வேண்டுமா?"),
    a: s("No. Each of the six temples is complete in itself and can be visited independently for its own specific power and blessing. The full circuit adds a cumulative grace, but is not required for individual benefit.", "இல்லை. ஆறு கோயில்களில் ஒவ்வொன்றும் தனக்கு நிறைவானது, அதன் சொந்த குறிப்பிட்ட சக்தி & வாழ்த்துக்காக சுதந்திரமாக தரிசிக்கப்படலாம். முழு சுற்று ஒட்டுமொத்த அருளை சேர்க்கிறது, ஆனால் தனிப்பட்ட நலனுக்கு தேவையில்லை."),
  },
  {
    q: s("Which temple is best for Sevvai dosham specifically?", "செவ்வாய் தோஷத்திற்கு குறிப்பாக எந்த கோயில் சிறந்தது?"),
    a: s("Vaitheeswaran Koil is the primary Navagraha Mars temple for Sevvai dosham. Among the Arupadai Veedu, Palani (for surrendering Mars pride and ego) and Thiruchendur (for strength and warrior energy) are most specific to the Sevvai quality.", "செவ்வாய் தோஷத்திற்கு வைத்தீஸ்வரன் கோயில் முதன்மையான நவகிரக செவ்வாய் கோயில். அறுபடை வீடுகளில், பழனி (செவ்வாய் கர்வம் & அகங்காரம் சரணடைவதற்கு) & திருச்செந்தூர் (வலிமை & போர்வீர சக்திக்கு) செவ்வாய் குணத்திற்கு மிகவும் குறிப்பிட்டவை."),
  },
  {
    q: s("What does Palani temple specifically help with?", "பழனி கோயில் குறிப்பாக எதில் உதவுகிறது?"),
    a: s("Palani is the abode of Murugan as the great renunciant — he left behind wealth and status, symbolising the dissolution of ego and attachment. It is particularly visited for removing Saturn-Rahu obstacles, pride-driven blocks, and any situation requiring deep humility and surrender.", "பழனி முருகனின் பெரும் துறவியாகப் படை வீடு — செல்வமும் அந்தஸ்தும் விட்டுச் சென்றார், அகங்காரம் & பற்றுதலின் கரைப்பை அடையாளப்படுத்துகிறது. சனி-ராகு தடைகள், கர்வத்தால் வரும் தடைகள், ஆழமான பணிவு & சரணடைதல் தேவைப்படும் எந்த சூழ்நிலைக்கும் குறிப்பாக தரிசிக்கப்படுகிறது."),
  },
  {
    q: s("Is the Arupadai Veedu circuit a fixed pilgrimage order?", "அறுபடை வீடு சுற்று ஒரு நிலையான யாத்திரை வரிசையா?"),
    a: s("There is no single universally mandated order. Most pilgrims follow a geographic convenience or a traditional sequence starting with Thiruparankundram and ending with Thiruthani. The intention and devotion matter more than the sequence.", "ஒரே உலகளவில் கட்டாயமான வரிசை இல்லை. பெரும்பாலான யாத்திரிகர்கள் திருப்பரங்குன்றத்தில் தொடங்கி திருத்தணியில் முடிக்கும் புவியியல் வசதி அல்லது பாரம்பரிய வரிசையை பின்பற்றுகிறார்கள். வரிசையை விட எண்ணமும் பக்தியும் முக்கியம்."),
  },
];
