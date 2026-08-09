import { s } from "./_s";

// ─── FEATURES ────────────────────────────────────────────────────────────────

export const FEAT_DAILY = {
  eyebrow:      s("Feature · Daily Guidance",  "அம்சம் · தினசரி வழிகாட்டுதல்"),
  h1:           s("One quiet reading. Every morning.", "ஒரு அமைதியான வாசிப்பு. ஒவ்வொரு காலையும்."),
  lead:         s(
    "Vinaadi reads your Thirukanitham chart, your current dasa period, today's transit positions, and the panchangam — then gives you one balanced answer. Not four separate reports. One reading.",
    "விநாடி உங்கள் திருக்கணித ஜாதகம், நடப்பு தசை, இன்றைய கிரகநகர்வு, பஞ்சாங்கம் ஆகியவற்றை ஒன்றாகப் படித்து ஒரு சமச்சீர் பதிலைத் தருகிறது. நான்கு தனித்தனி அறிக்கைகள் அல்ல; ஒரே ஒரு வாசிப்பு.",
  ),
  cta_start:    s("Start reading →",           "வாசிக்க தொடங்கு →"),
  cta_method:   s("How it's calculated",        "எப்படி கணக்கிடப்படுகிறது"),

  signals_h2:   s("The four signals",           "நான்கு சமிக்ஞைகள்"),
  sig1_title:   s("Vimshottari dasa",          "விம்சோத்தரி தசை"),
  sig1_body:    s("Your planetary period cycle — which planet runs the current dasa and bhukti, and whether that period is favourable, neutral, or challenging for your chart.", "உங்கள் கிரக சுழற்சி — எந்த கிரகம் நடப்பு தசை மற்றும் புக்தியை நடத்துகிறது, அந்த காலம் உங்கள் ஜாதகத்திற்கு சாதகமானதா, நடுநிலையானதா அல்லது சவாலானதா."),
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
    "Every day brings a new panchangam, new Moon position, and slight dasa progressions. The reading updates daily — it doesn't recycle a generic week-long or month-long forecast.",
    "ஒவ்வொரு நாளும் புதிய பஞ்சாங்கம், புதிய சந்திர நிலை, சிறிய தசை முன்னேற்றங்களை கொண்டு வருகிறது. வாசிப்பு தினசரி புதுப்பிக்கப்படுகிறது — பொதுவான வார அல்லது மாத கணிப்பை மீண்டும் பயன்படுத்துவதில்லை."
  ),

  faq_h2: s("Questions about daily guidance", "தினசரி வழிகாட்டுதல் பற்றிய கேள்விகள்"),
  faq1_q: s("How is this different from a generic daily horoscope?", "இது ஒரு பொதுவான தினசரி ஜோதிட பலனிலிருந்து எவ்வாறு வேறுபடுகிறது?"),
  faq1_a: s("Generic horoscopes use only your Sun sign or Moon sign. Vinaadi uses your full Thirukanitham birth chart — precise to your date, time, and place of birth — combined with your current dasa period and the day's actual planetary positions. The result is specific to you, not shared with millions of people born in the same month.", "பொதுவான ஜோதிட பலன்கள் உங்கள் சூரிய ராசி அல்லது சந்திர ராசியை மட்டுமே பார்க்கும். விநாடி உங்கள் முழு திருக்கணிதப் பிறப்பு ஜாதகத்தை — பிறந்த தேதி, நேரம், இடம் ஆகியவற்றுக்கு துல்லியமாக — நடப்பு தசை மற்றும் நாளின் உண்மையான கிரக நிலைகளுடன் சேர்த்து வாசிக்கிறது. அதனால் கிடைக்கும் முடிவு உங்களுக்கே உரியது; அதே மாதத்தில் பிறந்த எல்லோருக்கும் ஒரே மாதிரி சொல்லப்படுவது அல்ல."),
  faq2_q: s("Does Vinaadi show me my score every day automatically?", "விநாடி ஒவ்வொரு நாளும் தானாகவே மதிப்பெண்ணை காட்டுகிறதா?"),
  faq2_a: s("Yes — the Today tab updates every day with a fresh reading. Your chart stays saved, so there's nothing to re-enter. Open the app in the morning and the reading is ready.", "ஆம் — இன்று தாவல் ஒவ்வொரு நாளும் புதிய வாசிப்புடன் புதுப்பிக்கப்படுகிறது. உங்கள் ஜாதகம் சேமிக்கப்பட்டிருக்கும், மீண்டும் உள்ளிட தேவையில்லை. காலையில் ஆப்பை திறந்தால் வாசிப்பு தயாராக இருக்கும்."),
  faq3_q: s("What does the daily score number mean?", "தினசரி மதிப்பெண் எண் என்ன அர்த்தம்?"),
  faq3_a: s("It's a relative indicator — not a prediction of luck, but a composite of how your dasa, transits, and panchangam align today versus your baseline chart. Higher means more signals are aligned favourably. It's a planning aid, not a verdict.", "இது அதிர்ஷ்டக் கணிப்பு அல்ல; உங்கள் தசை, கிரகநகர்வு, பஞ்சாங்கம் ஆகியவை இன்று உங்கள் அடிப்படை ஜாதகத்துடன் எவ்வளவு ஒத்திசைகின்றன என்பதைக் காட்டும் ஒப்பீட்டு மதிப்பெண். மதிப்பெண் உயர்ந்தால் சாதகமான சைகைகள் அதிகம் சேர்ந்துள்ளன என்பதுதான் பொருள். இது திட்டமிட உதவும் குறியீடு; இறுதி தீர்ப்பு அல்ல."),
  faq4_q: s("What is Chandrashtama and when does it show up?", "சந்திராஷ்டமம் என்றால் என்ன, எப்போது தெரியும்?"),
  faq4_a: s("Chandrashtama occurs when the transiting Moon moves into the 8th sign from your birth Moon sign. It lasts roughly 2.5 days and repeats monthly. Vinaadi tracks it and flags it clearly in the reading — without dramatising it.", "சந்திராஷ்டமம் நகரும் சந்திரன் உங்கள் பிறப்பு சந்திர ராசியிலிருந்து 8வது ராசிக்கு செல்லும்போது நிகழ்கிறது. இது தோராயமாக 2.5 நாட்கள் நீடிக்கும், மாதாந்திரம் திரும்பும். விநாடி இதை கண்காணித்து, வாசிப்பில் தெளிவாகக் குறிப்பிடுகிறது — நாடகமயமாக்காமல்."),

  related_h2:   s("Related",         "தொடர்புடையவை"),
};
