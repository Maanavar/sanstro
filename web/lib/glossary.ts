// Short, plain-language definitions for Jothidam terms that recur on the Deep
// Dive surface. Kept separate from i18n.ts's label dictionaries because these
// are explanatory sentences, not UI labels — see H8 (#15/#24/#89).
//
// EXPANDED 2026-08-22 (UX blindspot audit) from 20 Deep-Dive terms to cover the
// DAILY vocabulary as well. The original twenty were chosen for the surface a
// curious reader opts into; the terms below are the ones the app puts in front
// of everybody, unasked, on Today and the Calendar — Rahu Kalam, Tithi,
// Chandrashtama, Nalla Neram, Karinaal and the rest. Between those two screens
// ~28 terms rendered with no definition anywhere in the product (there is no
// glossary page, and `GlossaryTerm` reached neither file).
//
// House style, worth keeping: a definition DEFINES. "Rajju — the Rajju
// porutham" is not an entry. Each one below says what the thing is in ordinary
// words, and where it earns it, what to actually do about it.
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
  | "charaDasha"
  // ── Daily vocabulary: Today ribbon + Calendar day panel ──
  | "panchangam"
  | "tithi"
  | "karana"
  | "vara"
  | "yogam"
  | "paksham"
  | "rahuKalam"
  | "yamagandam"
  | "kuligai"
  | "nallaNeram"
  | "abhijit"
  | "hora"
  | "chandrashtama"
  | "karinaal"
  | "soolam"
  | "parigaram"
  | "amirdhadhi"
  | "muhurtham"
  | "lagnam"
  | "pada"
  | "peyarchi"
  | "sadeSati"
  | "house"
  | "yoga"
  | "pournami"
  | "chathurthi"
  | "sashti"
  | "ekadashi"
  | "pradosham"
  | "vratham";

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

  // ── Daily vocabulary ──────────────────────────────────────────────────────
  // New Tamil, pending native review (CLAUDE.md new-Tamil rule).
  panchangam: {
    en: "The traditional daily almanac. Five readings — tithi, star, yogam, karana and weekday — that together say what kind of day this is.",
    ta: "பாரம்பரிய தினசரி நாட்காட்டி. திதி, நட்சத்திரம், யோகம், கரணம், வாரம் — இந்த ஐந்து அங்கங்கள் சேர்ந்து இன்றைய நாளின் தன்மையைச் சொல்கின்றன.",
  },
  tithi: {
    en: "The lunar day — how far the Moon has pulled ahead of the Sun. There are 30 in a lunar month, and they set which rites and festivals fall today.",
    ta: "சந்திர தினம் — சூரியனிடமிருந்து சந்திரன் எவ்வளவு விலகியுள்ளது என்பதன் அளவு. ஒரு சந்திர மாதத்தில் 30 திதிகள்; இன்றைய விரதங்களும் பண்டிகைகளும் இதைப் பொறுத்தே அமைகின்றன.",
  },
  karana: {
    en: "Half a tithi — the shortest of the almanac's five limbs. Used mainly for fine-grained timing of when to begin something.",
    ta: "ஒரு திதியின் பாதி — பஞ்சாங்கத்தின் ஐந்து அங்கங்களில் மிகச் சிறியது. ஒரு செயலைத் தொடங்கும் நுணுக்கமான நேரத்தைக் காண முக்கியமாகப் பயன்படுகிறது.",
  },
  vara: {
    en: "The weekday, and the planet that rules it — Sunday the Sun, Monday the Moon, and so on. It colours the whole day's character.",
    ta: "வாரத்தின் நாளும் அதை ஆளும் கிரகமும் — ஞாயிறு சூரியன், திங்கள் சந்திரன், என்று தொடரும். நாள் முழுவதன் தன்மையை இது வண்ணமிடுகிறது.",
  },
  // New Tamil, pending native review.
  house: {
    en: "A numbered area of the birth chart. Each of the twelve houses represents a part of life, such as self, work, relationships, or home.",
    ta: "ஜாதகத்தின் எண் கொண்ட ஒரு பகுதி. பன்னிரண்டு வீடுகளில் ஒவ்வொன்றும் தன்மை, வேலை, உறவுகள் அல்லது வீடு போன்ற வாழ்க்கையின் ஒரு பகுதியைக் குறிக்கிறது.",
  },
  // New Tamil, pending native review.
  yoga: {
    en: "A chart combination — a particular relationship between planets and houses. It is not exercise yoga; its meaning depends on the whole chart.",
    ta: "ஜாதக அமைப்பு — கிரகங்கள் மற்றும் வீடுகளுக்கு இடையிலான ஒரு குறிப்பிட்ட தொடர்பு. இது உடற்பயிற்சி யோகம் அல்ல; இதன் பொருள் முழு ஜாதகத்தைப் பொறுத்தது.",
  },
  pournami: {
    en: "The full-moon day, when the Moon is opposite the Sun. Many Tamil households mark it with prayer, temple visits, or a simple observance.",
    ta: "முழுநிலவு நாள் — சந்திரன் சூரியனுக்கு எதிரில் இருக்கும் திதி. பல தமிழ் குடும்பங்கள் இதை வழிபாடு, கோவில் தரிசனம் அல்லது எளிய அனுசரிப்புடன் கடைப்பிடிக்கின்றன.",
  },
  chathurthi: {
    en: "The fourth lunar day. It is traditionally associated with Ganesha worship; Sankatahara Chathurthi is a widely observed monthly form.",
    ta: "நான்காவது சந்திரத் திதி. இது பாரம்பரியமாக விநாயகர் வழிபாட்டுடன் தொடர்புடையது; சங்கடஹர சதுர்த்தி அதன் மாதாந்திர அனுசரிப்பாகும்.",
  },
  sashti: {
    en: "The sixth lunar day. In Tamil tradition it is often associated with Murugan worship, especially the monthly Sashti observance.",
    ta: "ஆறாவது சந்திரத் திதி. தமிழ் மரபில் இது பெரும்பாலும் முருகன் வழிபாட்டுடன், குறிப்பாக மாதாந்திர சஷ்டி அனுசரிப்புடன் தொடர்புடையது.",
  },
  ekadashi: {
    en: "The eleventh lunar day. Many Vaishnava households observe it with prayer, a fast, or a simpler meal according to their own practice.",
    ta: "பதினொன்றாவது சந்திரத் திதி. பல வைணவக் குடும்பங்கள் தங்கள் வழக்கத்தின்படி வழிபாடு, விரதம் அல்லது எளிய உணவுடன் இதை அனுசரிக்கின்றன.",
  },
  pradosham: {
    en: "A twilight observance on the thirteenth lunar day, traditionally associated with Shiva worship. The exact observance window depends on local sunset and tithi timing.",
    ta: "பதின்மூன்றாவது திதியில் வரும் மாலை நேர அனுசரிப்பு; பாரம்பரியமாக சிவ வழிபாட்டுடன் தொடர்புடையது. உள்ளூர் சூரிய அஸ்தமனம் மற்றும் திதி நேரத்தைப் பொறுத்து இதன் நேரம் மாறும்.",
  },
  vratham: {
    en: "A voluntary religious observance, often involving prayer, a fast, or a chosen discipline for a particular day. Practices vary by household and tradition.",
    ta: "ஒரு குறிப்பிட்ட நாளுக்கான விருப்பமான சமய அனுசரிப்பு — வழிபாடு, விரதம் அல்லது தேர்ந்தெடுத்த ஒழுக்கம் இதில் இருக்கலாம். குடும்பம் மற்றும் மரபுக்கு ஏற்ப நடைமுறை மாறும்.",
  },
  yogam: {
    en: "One of 27 daily combinations of Sun and Moon position. Nothing to do with the exercise — it is an almanac reading of the day's quality.",
    ta: "சூரியன் மற்றும் சந்திரனின் நிலைகளைச் சேர்த்துக் கணக்கிடும் 27 தினசரி சேர்க்கைகளில் ஒன்று. நாளின் தரத்தைக் குறிக்கும் பஞ்சாங்க அங்கம்.",
  },
  paksham: {
    en: "Which half of the lunar month today falls in — Valarpirai, the waxing half towards full moon, or Theipirai, the waning half towards new moon.",
    ta: "சந்திர மாதத்தின் எந்தப் பாதியில் இன்று வருகிறது என்பது — பௌர்ணமியை நோக்கி வளரும் வளர்பிறை, அல்லது அமாவாசையை நோக்கிக் குறையும் தேய்பிறை.",
  },
  rahuKalam: {
    en: "A roughly 90-minute stretch each day traditionally avoided for starting anything new. Its slot shifts by weekday. Work already under way is not affected.",
    ta: "ஒவ்வொரு நாளும் ஏறத்தாழ 90 நிமிடம் — புதிதாக எதையும் தொடங்குவதைப் பாரம்பரியமாகத் தவிர்க்கும் நேரம். வாரநாளுக்கேற்ப இது மாறும். ஏற்கனவே நடக்கும் வேலைக்குப் பாதிப்பில்லை.",
  },
  yamagandam: {
    en: "A second daily stretch traditionally avoided for new beginnings, on the same weekday cycle as Rahu Kalam but a different slot.",
    ta: "புதிய தொடக்கங்களைத் தவிர்க்கும் இரண்டாவது தினசரி நேரம் — ராகு காலத்தின் அதே வாரநாள் சுழற்சி, ஆனால் வேறு நேரப் பகுதி.",
  },
  // Said "favourable rather than avoided — the counterpart to Rahu Kalam and
  // Yamagandam" until 2026-08-23, which contradicted the screen it opens on.
  // Kuligai is Saturn's own (Mandi), the THIRD avoid-kala: the Today ribbon
  // paints it with `--color-low` beside Rahu and Yama, the calendar rows mark
  // it `avoid-soft` and the legend names it as a red cause, and the Today row
  // it hangs off is literally headed "Avoid periods". A reader tapping a red
  // band and being told it is the good one is the explanation contradicting
  // the very thing it explains.
  //
  // The nuance the old wording was reaching for is real and kept in the second
  // sentence: what begins in Kuligai is held to REPEAT, so Tamil practice puts
  // it to deliberate use for things worth recurring (saving, buying gold) —
  // which is a carve-out from an avoid period, not a reclassification of one.
  kuligai: {
    en: "The third stretch each day traditionally avoided for new starts, alongside Rahu Kalam and Yamagandam. It has a rule of its own: what begins in Kuligai is said to repeat — so it is used deliberately for things you want to happen again, like starting savings, and avoided for everything else.",
    ta: "ராகு காலம், எமகண்டத்துடன் சேர்ந்து புதிய தொடக்கங்களுக்குத் தவிர்க்கப்படும் மூன்றாவது தினசரி நேரம். இதற்கு ஒரு தனி விதி உண்டு: குளிகையில் தொடங்குவது மீண்டும் நிகழும் என்பர் — எனவே திரும்பத் திரும்ப வேண்டியவற்றுக்கு (சேமிப்பு தொடங்குதல் போன்றவை) வேண்டுமென்றே பயன்படுத்தி, மற்ற அனைத்தையும் தவிர்ப்பர்.",
  },
  nallaNeram: {
    en: "The day's recommended good window — the stretch to aim for when you get to choose the hour for something that matters.",
    ta: "அன்றைய நாளின் பரிந்துரைக்கப்பட்ட நல்ல நேரம் — முக்கியமான ஒன்றுக்கு நேரம் தேர்ந்தெடுக்க முடியும்போது இதை நோக்கமாகக் கொள்ளுங்கள்.",
  },
  abhijit: {
    en: "A short window around solar noon, held to be favourable on most days regardless of the rest of the almanac.",
    ta: "நண்பகல் சூரிய உச்சத்தைச் சுற்றியுள்ள ஒரு குறுகிய நேரம் — பஞ்சாங்கத்தின் மற்ற அங்கங்கள் எப்படியிருந்தாலும் பெரும்பாலான நாட்களில் நல்லதாகக் கருதப்படுகிறது.",
  },
  hora: {
    en: "The planetary hour. Each hour of the day is ruled by a planet in a fixed cycle — a finer layer of timing under the day's own ruler.",
    ta: "கிரக ஹோரை. நாளின் ஒவ்வொரு மணி நேரமும் ஒரு நிலையான சுழற்சியில் ஒரு கிரகத்தால் ஆளப்படுகிறது — நாளின் அதிபதிக்குக் கீழ் இயங்கும் நுட்பமான நேர அடுக்கு.",
  },
  chandrashtama: {
    en: "The roughly 2¼ days each month when the Moon sits in the 8th sign from your birth Moon. Traditionally a low-energy stretch — a day for care and routine, not for launching things.",
    ta: "ஒவ்வொரு மாதமும் ஏறத்தாழ 2¼ நாட்கள் — உங்கள் ஜென்ம ராசியிலிருந்து 8-ஆம் ராசியில் சந்திரன் இருக்கும் காலம். வழக்கமான வேலைகளுக்கும் கவனத்திற்குமான நாள்; புதிய தொடக்கங்களுக்கு அல்ல.",
  },
  karinaal: {
    en: "A day traditionally avoided for beginnings — weddings, moving house, signing things. Ongoing work and routine matters are unaffected.",
    ta: "தொடக்கங்களுக்குப் பாரம்பரியமாகத் தவிர்க்கப்படும் நாள் — திருமணம், குடிபுகுதல், ஒப்பந்தம். நடந்துகொண்டிருக்கும் வேலைகளுக்கும் அன்றாடப் பணிகளுக்கும் பாதிப்பில்லை.",
  },
  soolam: {
    en: "The direction traditionally avoided for travel today. It shifts with the weekday.",
    ta: "இன்று பயணத்திற்குப் பாரம்பரியமாகத் தவிர்க்கப்படும் திசை. வாரநாளுக்கேற்ப மாறும்.",
  },
  parigaram: {
    en: "The small customary remedy that offsets the day's Soolam direction — usually eating or carrying a particular thing before you set out.",
    ta: "அன்றைய சூலத் திசையை ஈடுசெய்யும் சிறு வழக்கமான பரிகாரம் — பொதுவாகப் புறப்படும் முன் ஒரு குறிப்பிட்ட பொருளை உண்பது அல்லது எடுத்துச் செல்வது.",
  },
  amirdhadhi: {
    en: "A quality rating formed by pairing the day's star with its weekday — Amirtha is the best of the three, then Siddha, then Marana.",
    ta: "அன்றைய நட்சத்திரத்தையும் வாரநாளையும் இணைத்துக் கிடைக்கும் தர மதிப்பீடு — மூன்றில் அமிர்தம் சிறந்தது, பிறகு சித்தம், பிறகு மரணம்.",
  },
  muhurtham: {
    en: "A deliberately chosen auspicious moment to begin something important — a wedding, a move, a new venture. Choosing one is its own branch of the tradition.",
    ta: "முக்கியமான ஒன்றைத் தொடங்க வேண்டுமென்றே தேர்ந்தெடுக்கப்படும் உகந்த நேரம் — திருமணம், குடிபுகுதல், புதிய முயற்சி. இதைத் தேர்வு செய்வது ஜோதிடத்தின் தனி ஒரு பிரிவு.",
  },
  lagnam: {
    en: "The sign rising on the eastern horizon at the moment you were born. It anchors the whole chart — which is why the exact minute of birth matters so much.",
    ta: "நீங்கள் பிறந்த தருணத்தில் கிழக்கு அடிவானத்தில் உதயமான ராசி. ஜாதகம் முழுவதற்குமான அடித்தளம் இது — பிறந்த நேரம் துல்லியமாக இருப்பது இதனால்தான் முக்கியம்.",
  },
  pada: {
    en: "A quarter of a birth star. Each of the 27 stars divides into four padas, and which one you were born in refines the reading.",
    ta: "ஒரு நட்சத்திரத்தின் கால் பகுதி. 27 நட்சத்திரங்களும் தலா நான்கு பாதங்களாகப் பிரிகின்றன; நீங்கள் பிறந்த பாதம் பலனை நுட்பமாக்குகிறது.",
  },
  peyarchi: {
    en: "A slow planet changing sign — Jupiter roughly yearly, Saturn every 2½ years. These are the big shifts that redraw a chart's weather for a long stretch.",
    ta: "மெதுவாக நகரும் கிரகம் ராசி மாறுவது — குரு ஏறத்தாழ ஆண்டுக்கு ஒருமுறை, சனி 2½ ஆண்டுகளுக்கு ஒருமுறை. நீண்ட காலத்திற்கு ஜாதகத்தின் போக்கை மாற்றியமைக்கும் பெரிய நகர்வுகள்.",
  },
  sadeSati: {
    en: "The 7½-year stretch when Saturn transits the signs around your birth Moon. It reaches almost everyone about three times in a lifetime — demanding rather than disastrous, and it ends on a known date.",
    ta: "உங்கள் ஜென்ம ராசியைச் சுற்றியுள்ள ராசிகளில் சனி நகரும் 7½ ஆண்டுக் காலம். ஒரு வாழ்நாளில் கிட்டத்தட்ட எல்லோரையும் மூன்று முறை வந்தடையும் — பேரிடர் அல்ல, பொறுமை கேட்கும் காலம்; முடியும் நாள் தெரிந்ததே.",
  },
};

/**
 * The NAME of each term, as against its definition above.
 *
 * Every `GlossaryTerm` call site until now passed its own display text as
 * children — the term was always already on screen, and the component only had
 * to define it. Listing the vocabulary itself (the Understand tab's search)
 * inverts that: there is no surrounding sentence to borrow a name from, so the
 * first pass rendered the object key. English readers were shown `rahuKalam`,
 * `sthanaBala`, `naisargikaBala` — the identifiers, camelCase and all — while
 * Tamil got `definition.split(".")[0]`, a whole clause standing in for a name.
 *
 * Typed as a total `Record<GlossaryKey, …>`, so adding a glossary entry without
 * a name is a compile error rather than a chip reading `charaDasha`.
 *
 * Tamil follows almanac usage, not Sanskrit transliteration — ஏழரைச் சனி for
 * Sade Sati, எமகண்டம் for Yamagandam. `yoga` and `yogam` are different things
 * that share a name in both languages (a chart combination vs. one of the
 * almanac's five daily limbs), so both carry a disambiguator; a bare "Yogam"
 * twice in one result list would be a worse answer than none.
 */
export const GLOSSARY_LABELS: Record<GlossaryKey, { ta: string; en: string }> = {
  dasha: { en: "Dasha", ta: "தசை" },
  bhukti: { en: "Bhukti", ta: "புக்தி" },
  rasi: { en: "Rasi", ta: "ராசி" },
  nakshatra: { en: "Nakshatra", ta: "நட்சத்திரம்" },
  gochar: { en: "Gochar", ta: "கிரகநகர்வு" },
  shadbala: { en: "Shadbala", ta: "ஷட்பலம்" },
  sthanaBala: { en: "Sthana Bala", ta: "ஸ்தான பலம்" },
  digBala: { en: "Dig Bala", ta: "திக் பலம்" },
  kalaBala: { en: "Kala Bala", ta: "கால பலம்" },
  chestaBala: { en: "Chesta Bala", ta: "சேஷ்டா பலம்" },
  naisargikaBala: { en: "Naisargika Bala", ta: "நைசர்கிக பலம்" },
  drikBala: { en: "Drik Bala", ta: "திருக் பலம்" },
  varga: { en: "Varga", ta: "வர்க்கம்" },
  navamsa: { en: "Navamsa (D9)", ta: "நவாம்சம் (D9)" },
  atmakaraka: { en: "Atmakaraka", ta: "ஆத்மகாரகன்" },
  karakamsa: { en: "Karakamsa", ta: "காரகாம்சம்" },
  yoginiDasha: { en: "Yogini Dasha", ta: "யோகினி தசை" },
  ashtottariDasha: { en: "Ashtottari Dasha", ta: "அஷ்டோத்தரி தசை" },
  kalachakraDasha: { en: "Kalachakra Dasha", ta: "காலசக்கர தசை" },
  charaDasha: { en: "Chara Dasha", ta: "சர தசை" },
  panchangam: { en: "Panchangam", ta: "பஞ்சாங்கம்" },
  tithi: { en: "Tithi", ta: "திதி" },
  karana: { en: "Karana", ta: "கரணம்" },
  vara: { en: "Vara (weekday)", ta: "வாரம்" },
  yogam: { en: "Yogam (almanac limb)", ta: "யோகம் (பஞ்சாங்க அங்கம்)" },
  paksham: { en: "Paksham", ta: "பட்சம்" },
  rahuKalam: { en: "Rahu Kalam", ta: "ராகு காலம்" },
  yamagandam: { en: "Yamagandam", ta: "எமகண்டம்" },
  kuligai: { en: "Kuligai", ta: "குளிகை" },
  nallaNeram: { en: "Nalla Neram", ta: "நல்ல நேரம்" },
  abhijit: { en: "Abhijit", ta: "அபிஜித்" },
  hora: { en: "Hora", ta: "ஹோரை" },
  chandrashtama: { en: "Chandrashtama", ta: "சந்திராஷ்டமம்" },
  karinaal: { en: "Karinaal", ta: "கரிநாள்" },
  soolam: { en: "Soolam", ta: "சூலம்" },
  parigaram: { en: "Parigaram", ta: "பரிகாரம்" },
  amirdhadhi: { en: "Amirdhadhi Yogam", ta: "அமிர்தாதி யோகம்" },
  muhurtham: { en: "Muhurtham", ta: "முகூர்த்தம்" },
  lagnam: { en: "Lagnam", ta: "லக்னம்" },
  pada: { en: "Pada", ta: "பாதம்" },
  peyarchi: { en: "Peyarchi", ta: "பெயர்ச்சி" },
  sadeSati: { en: "Sade Sati", ta: "ஏழரைச் சனி" },
  house: { en: "House", ta: "வீடு" },
  yoga: { en: "Yoga (chart combination)", ta: "யோகம் (ஜாதக அமைப்பு)" },
  pournami: { en: "Pournami", ta: "பௌர்ணமி" },
  chathurthi: { en: "Chathurthi", ta: "சதுர்த்தி" },
  sashti: { en: "Sashti", ta: "சஷ்டி" },
  ekadashi: { en: "Ekadashi", ta: "ஏகாதசி" },
  pradosham: { en: "Pradosham", ta: "பிரதோஷம்" },
  vratham: { en: "Vratham", ta: "விரதம்" },
};

/** The display name for a term, in the reader's language. */
export function glossaryLabel(key: GlossaryKey, lang: "ta" | "en"): string {
  return lang === "ta" ? GLOSSARY_LABELS[key].ta : GLOSSARY_LABELS[key].en;
}
