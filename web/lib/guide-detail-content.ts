export type BiText = {
  en: string;
  ta: string;
};

export type GuideKind = "dosham" | "yogam" | "temple" | "pariharam";

export type GuideFact = { label: BiText; value: BiText };
export type GuideFaq = { q: BiText; a: BiText };

export type BringCategory = { heading: BiText; items: BiText[] };

export type GuideDetail = {
  slug: string;
  kind: GuideKind;
  topic: "dosham" | "pariharam" | "temple";
  title: BiText;
  eyebrow: BiText;
  lead: BiText;
  /** At-a-glance label/value pairs shown as a quick-facts strip under the hero. */
  quickFacts?: GuideFact[];
  sections: Array<{
    heading: BiText;
    body: BiText[];
  }>;
  /** Visual category-card grid for yogam "what it brings" content. */
  bringCards?: BringCategory[];
  /** Graha or devotional slokam rendered as a SlokamBlock. */
  slokam?: { label: BiText; text: BiText; meaning: BiText };
  /** Reader-facing remedies / what-to-do block. */
  remedies?: {
    heading: BiText;
    intro: BiText;
    items: BiText[];
  };
  /** Short question/answer list rendered near the bottom of the guide. */
  faq?: GuideFaq[];
  ctaVariant: "dosham" | "yogam" | "temple" | "pariharam" | "marriage-pariharam";
  related: Array<{ href: string; label: BiText }>;
};

const b = (en: string, ta: string): BiText => ({ en, ta });

export const DOSHAM_DETAILS: Record<string, GuideDetail> = {
  "naga-sarpa-dosham": {
    slug: "naga-sarpa-dosham",
    kind: "dosham",
    topic: "dosham",
    eyebrow: b("Dosham guide · Rahu-Ketu", "தோஷ வழிகாட்டி · ராகு-கேது"),
    title: b("Naga / Sarpa Dosham", "நாக / சர்ப்ப தோஷம்"),
    lead: b(
      "Naga or Sarpa dosham is read through Rahu, Ketu, the 5th house, lineage patterns, and child-blessing indicators. It should be judged from the full Thirukanitham chart, not from one placement alone.",
      "நாக அல்லது சர்ப்ப தோஷம் ராகு, கேது, 5-ஆம் பாவம், வம்ச தொடர்பு, சந்தான பாக்கியம் ஆகியவற்றுடன் பார்க்கப்படுகிறது. ஒரு இடத்தை மட்டும் வைத்து தீர்ப்பு சொல்லாமல் முழு திருக்கணித ஜாதகத்தில் பார்க்க வேண்டும்."
    ),
    quickFacts: [
      { label: b("Ruling grahas", "ஆளும் கிரகங்கள்"), value: b("Rahu & Ketu (the nodal axis)", "ராகு & கேது (சந்திப்பு அச்சு)") },
      { label: b("Houses watched", "பார்க்கும் பாவங்கள்"), value: b("5th house, 5th lord, Jupiter", "5-ஆம் பாவம், 5-ஆம் அதிபதி, குரு") },
      { label: b("Life areas", "வாழ்க்கைத் துறைகள்"), value: b("Children, lineage, family peace", "சந்தானம், வம்சம், குடும்ப அமைதி") },
      { label: b("Severity depends on", "தீவிரம் சார்ந்தது"), value: b("Jupiter strength, dasha, cancellations", "குரு பலம், தசை, ரத்து காரணங்கள்") },
    ],
    sections: [
      {
        heading: b("What it is", "என்ன என்பது"),
        body: [
          b(
            "Naga or Sarpa dosham is a karmic pattern tied to Rahu and Ketu, the lunar nodes. In Tamil tradition it points to ancestral duties left undone, serpent-related vows, or knots around the 5th house of children and good fortune.",
            "நாக அல்லது சர்ப்ப தோஷம் என்பது சந்திப்பு புள்ளிகளான ராகு-கேதுவுடன் தொடர்புடைய கர்ம அமைப்பு. தமிழ் மரபில் இது நிறைவேறாத முன்னோர் கடமை, நாக சம்பந்தமான நேர்த்திக்கடன், அல்லது சந்தானம் மற்றும் பாக்கியம் தரும் 5-ஆம் பாவத்தைச் சுற்றிய முடிச்சுகளைக் குறிக்கிறது."
          ),
          b(
            "It is not a curse or a verdict. It is a signal that one part of life needs more patience and devotion than usual — and a balanced chart often softens it considerably.",
            "இது சாபமோ தீர்ப்போ அல்ல. வாழ்க்கையின் ஒரு பகுதி வழக்கத்தை விட அதிக பொறுமையும் பக்தியும் கேட்கிறது என்பதற்கான அறிகுறி — சமநிலையான ஜாதகம் இதை கணிசமாக மென்மையாக்குகிறது."
          ),
        ],
      },
      {
        heading: b("What it can bring", "எதை கொண்டுவரலாம்"),
        body: [
          b(
            "Most commonly it shows up as delay or anxiety around childbirth, repeated obstacles that seem to follow the family, or a feeling that effort does not convert into results in one specific area.",
            "பெரும்பாலும் இது குழந்தைப் பேறில் தாமதம் அல்லது கவலை, குடும்பத்தைப் பின் தொடரும் மீண்டும் மீண்டும் வரும் தடைகள், அல்லது ஒரு குறிப்பிட்ட துறையில் முயற்சி பலனாக மாறவில்லை என்ற உணர்வாக வெளிப்படுகிறது."
          ),
          b(
            "When Jupiter is strong or a benefic supports the 5th house, the same dosham becomes mild — a slow start that opens up with time, rather than a permanent block.",
            "குரு பலமாக இருந்தால் அல்லது சுப கிரகம் 5-ஆம் பாவத்தை ஆதரித்தால், அதே தோஷம் மிதமாகிறது — நிரந்தர தடை அல்ல; காலப்போக்கில் திறக்கும் மெதுவான தொடக்கம்."
          ),
        ],
      },
      {
        heading: b("Signs & who should look into it", "அறிகுறிகள் & யார் பார்க்க வேண்டும்"),
        body: [
          b(
            "People often check this when facing unexplained childbirth delay, a string of family setbacks, recurring serpent dreams, or when an astrologer flags Rahu-Ketu pressure on the 5th house. None of these alone confirms the dosham — the full chart does.",
            "காரணம் தெரியாத குழந்தைப் பேறு தாமதம், தொடர்ச்சியான குடும்ப பின்னடைவுகள், மீண்டும் வரும் பாம்பு கனவுகள், அல்லது ஜோதிடர் 5-ஆம் பாவத்தில் ராகு-கேது அழுத்தத்தை சுட்டிக்காட்டும் போது மக்கள் இதைப் பார்க்கின்றனர். இவற்றில் எதுவும் தனியாக தோஷத்தை உறுதி செய்யாது — முழு ஜாதகமே செய்யும்."
          ),
        ],
      },
    ],
    remedies: {
      heading: b("Remedies & what to do", "பரிகாரங்கள் & என்ன செய்வது"),
      intro: b(
        "Naga dosham remedies are devotional and patient — they steady the mind and invite grace, and work best paired with the right chart timing and, where childbirth is involved, medical guidance.",
        "நாக தோஷ பரிகாரங்கள் பக்தியும் பொறுமையும் கொண்டவை — மனதை அமைதிப்படுத்தி அருளை வரவழைக்கின்றன; சரியான ஜாதக காலம், சந்தானம் சம்பந்தப்பட்ட இடத்தில் மருத்துவ ஆலோசனையுடன் சேரும்போது சிறப்பாக பயன்படுகின்றன."
      ),
      items: [
        b("Visit the Rahu temple at Thirunageswaram and the Ketu temple at Keezhaperumpallam, with naga prarthana.", "திருநாகேஸ்வரம் ராகு கோயில் மற்றும் கீழப்பெரும்பள்ளம் கேது கோயிலில் நாக பிரார்த்தனையுடன் தரிசனம் செய்யுங்கள்."),
        b("Offer milk abhishekam to naga idols and keep a steady family prayer on Panchami and Aayilyam days.", "நாக சிலைகளுக்கு பால் அபிஷேகம் செய்து, பஞ்சமி மற்றும் ஆயில்யம் நாட்களில் தொடர்ந்த குடும்ப பிரார்த்தனையை வையுங்கள்."),
        b("Strengthen Jupiter (Thursday worship, respect to elders), since a strong Guru is the natural balancer of this dosham.", "குருவை பலப்படுத்துங்கள் (வியாழன் வழிபாடு, பெரியோர் மரியாதை); பலமான குரு இந்த தோஷத்தின் இயற்கையான சமன்செய்பவர்."),
      ],
    },
    faq: [
      { q: b("Does Naga dosham mean I cannot have children?", "நாக தோஷம் என்றால் எனக்கு குழந்தை பிறக்காதா?"), a: b("No. It often indicates delay or extra care needed, not impossibility. A strong 5th house, benefic Jupiter, or supportive dasha can open childbirth normally, and many couples conceive with patience and medical support.", "இல்லை. இது பெரும்பாலும் தாமதம் அல்லது கூடுதல் கவனம் தேவை என்பதைக் குறிக்கிறது; சாத்தியமற்றது அல்ல. வலிமையான 5-ஆம் பாவம், சுப குரு அல்லது ஆதரவான தசை குழந்தைப் பேற்றை இயல்பாக திறக்கலாம்; பலர் பொறுமை மற்றும் மருத்துவ உதவியுடன் கருத்தரிக்கின்றனர்.") },
      { q: b("Is Naga dosham the same as Kala Sarpa dosham?", "நாக தோஷமும் கால சர்ப்ப தோஷமும் ஒன்றா?"), a: b("They are related but not identical. Naga/Sarpa dosham focuses on Rahu-Ketu links to the 5th house and lineage, while Kala Sarpa is the specific pattern where all planets fall between Rahu and Ketu.", "அவை தொடர்புடையவை; ஆனால் ஒன்றல்ல. நாக/சர்ப்ப தோஷம் 5-ஆம் பாவம் மற்றும் வம்சத்துடன் ராகு-கேது தொடர்பில் கவனம் செலுத்துகிறது; கால சர்ப்பம் என்பது அனைத்து கிரகங்களும் ராகு-கேதுவுக்கு இடையே விழும் குறிப்பிட்ட அமைப்பு.") },
      { q: b("How long should the remedies continue?", "பரிகாரங்களை எவ்வளவு காலம் தொடர வேண்டும்?"), a: b("Treat them as steady devotion rather than a one-day fix. Many families keep naga worship through the Rahu-Ketu dasha period or until the concerned area of life settles.", "ஒரே நாள் தீர்வாக அல்ல, தொடர்ந்த பக்தியாகக் கொள்ளுங்கள். பல குடும்பங்கள் ராகு-கேது தசை காலம் வரை அல்லது சம்பந்தப்பட்ட வாழ்க்கைத் துறை நிலைபெறும் வரை நாக வழிபாட்டைத் தொடர்கின்றன.") },
    ],
    ctaVariant: "dosham",
    related: [
      { href: "/temples/thirunageswaram", label: b("Thirunageswaram Rahu temple", "திருநாகேஸ்வரம் ராகு கோயில்") },
      { href: "/temples/keezhaperumpallam", label: b("Keezhaperumpallam Ketu temple", "கீழப்பெரும்பள்ளம் கேது கோயில்") },
      { href: "/pariharam", label: b("Pariharam guides", "பரிகார வழிகாட்டிகள்") },
    ],
  },
  "kala-sarpa-dosham": {
    slug: "kala-sarpa-dosham",
    kind: "dosham",
    topic: "dosham",
    eyebrow: b("Dosham guide · Rahu-Ketu axis", "தோஷ வழிகாட்டி · ராகு-கேது அச்சு"),
    title: b("Kala Sarpa Dosham", "கால சர்ப்ப தோஷம்"),
    lead: b(
      "Kala Sarpa dosham is considered when the planets are hemmed between Rahu and Ketu. Its result depends on the direction of the axis, planet strength, Lagna, Moon, and the dasha that is running.",
      "எல்லா கிரகங்களும் ராகு-கேது அச்சுக்குள் இருப்பதாகப் பார்க்கப்படும் போது கால சர்ப்ப தோஷம் கருதப்படுகிறது. அதன் பலன் அச்சின் திசை, கிரக பலம், லக்னம், சந்திரன், நடக்கும் தசை ஆகியவற்றைப் பொறுத்தது."
    ),
    quickFacts: [
      { label: b("Pattern", "அமைப்பு"), value: b("All planets between Rahu & Ketu", "அனைத்து கிரகங்களும் ராகு-கேதுவுக்கு இடையே") },
      { label: b("Life areas", "வாழ்க்கைத் துறைகள்"), value: b("Career swings, mind, family karma", "தொழில் ஏற்ற-இறக்கம், மனம், குடும்ப கர்மம்") },
      { label: b("Often gives", "பெரும்பாலும் தரும்"), value: b("Late but strong rise after tests", "சோதனைகளுக்குப் பின் தாமதமான ஆனால் பலமான உயர்வு") },
      { label: b("Severity depends on", "தீவிரம் சார்ந்தது"), value: b("Axis direction, Lagna & Moon strength", "அச்சு திசை, லக்ன & சந்திர பலம்") },
    ],
    sections: [
      {
        heading: b("What it is", "என்ன என்பது"),
        body: [
          b(
            "Kala Sarpa dosham is formed when all seven classical planets are hemmed on one side of the Rahu-Ketu axis. It is read as concentrated karmic pressure that asks a person to earn their rise rather than receive it easily.",
            "ஏழு கிரகங்களும் ராகு-கேது அச்சின் ஒரு பக்கத்தில் அடைபடும்போது கால சர்ப்ப தோஷம் உருவாகிறது. இது ஒருவர் உயர்வை எளிதாகப் பெறாமல் உழைத்துப் பெற வேண்டும் என்று கேட்கும் செறிவான கர்ம அழுத்தமாகப் படிக்கப்படுகிறது."
          ),
          b(
            "Many highly successful people have this pattern. By itself it does not deny success — it shapes the path with delays, intensity, and a strong second half of life.",
            "மிகவும் வெற்றிகரமான பலருக்கு இந்த அமைப்பு உள்ளது. இது தனியாக வெற்றியை மறுப்பதில்லை — தாமதம், தீவிரம், வாழ்க்கையின் பலமான இரண்டாம் பாதி ஆகியவற்றுடன் பாதையை வடிவமைக்கிறது."
          ),
        ],
      },
      {
        heading: b("What it can bring", "எதை கொண்டுவரலாம்"),
        body: [
          b(
            "Typical experiences are sudden ups and downs, inner restlessness, a sense of carrying family burden early, and breakthroughs that arrive after repeated tests. Channelled well, the same intensity becomes ambition and resilience.",
            "வழக்கமான அனுபவங்கள்: திடீர் ஏற்ற-இறக்கம், உள்ளார்ந்த அமைதியின்மை, இளம் வயதிலேயே குடும்பப் பொறுப்பை சுமக்கும் உணர்வு, பல சோதனைகளுக்குப் பின் வரும் வெற்றி. சரியாக வழிநடத்தினால், அதே தீவிரம் லட்சியமாகவும் மன உறுதியாகவும் மாறும்."
          ),
          b(
            "If even one strong planet breaks the enclosure, or benefics support the Lagna and Moon, the pressure eases noticeably and the chart behaves far more normally.",
            "ஒரு பலமான கிரகமாவது அந்த சுற்றை உடைத்தால், அல்லது சுப கிரகங்கள் லக்னம் மற்றும் சந்திரனை ஆதரித்தால், அழுத்தம் தெளிவாகக் குறைந்து ஜாதகம் மிகவும் இயல்பாக நடந்துகொள்கிறது."
          ),
        ],
      },
      {
        heading: b("Signs & who should look into it", "அறிகுறிகள் & யார் பார்க்க வேண்டும்"),
        body: [
          b(
            "People look into this when life feels like a series of intense tests, when success seems to arrive and slip away repeatedly, or when an astrologer points out the all-planets-between-the-nodes pattern. The direction of the axis matters as much as the pattern itself.",
            "வாழ்க்கை தொடர்ச்சியான கடுமையான சோதனைகளாக உணரும்போது, வெற்றி மீண்டும் மீண்டும் வந்து நழுவுவது போல் தோன்றும்போது, அல்லது ஜோதிடர் அனைத்து கிரகங்களும் நோடுகளுக்கு இடையே உள்ள அமைப்பைச் சுட்டிக்காட்டும்போது மக்கள் இதைப் பார்க்கின்றனர். அமைப்பைப் போலவே அச்சின் திசையும் முக்கியம்."
          ),
        ],
      },
    ],
    remedies: {
      heading: b("Remedies & what to do", "பரிகாரங்கள் & என்ன செய்வது"),
      intro: b(
        "Remedies aim to steady the nodal energy and turn restlessness into focus. They matter most during Rahu or Ketu dasha and when transits activate the axis.",
        "பரிகாரங்கள் நோடு சக்தியை அமைதிப்படுத்தி, அமைதியின்மையை குவிப்பாக மாற்ற இலக்கு கொள்கின்றன. ராகு அல்லது கேது தசையிலும், கோச்சாரம் அச்சை செயல்படுத்தும்போதும் இவை மிக முக்கியம்."
      ),
      items: [
        b("Worship Rahu at Thirunageswaram and Ketu at Keezhaperumpallam, ideally on the same pilgrimage.", "திருநாகேஸ்வரத்தில் ராகுவையும் கீழப்பெரும்பள்ளத்தில் கேதுவையும், முடிந்தால் ஒரே யாத்திரையில் வழிபடுங்கள்."),
        b("Keep naga prarthana, Durga or Bhairava worship, and a steady daily mantra handed down in the family.", "நாக பிரார்த்தனை, துர்கா அல்லது பைரவர் வழிபாடு, குடும்பத்தில் வழங்கப்படும் தினசரி மந்திரம் ஆகியவற்றைத் தொடருங்கள்."),
        b("Build discipline and routine during nodal periods — structure is itself a remedy for this restless pattern.", "நோடு காலங்களில் ஒழுக்கத்தையும் வழக்கத்தையும் கட்டமைக்கவும் — இந்த அமைதியற்ற அமைப்புக்கு ஒழுங்கமைப்பே ஒரு பரிகாரம்."),
      ],
    },
    faq: [
      { q: b("Is Kala Sarpa dosham always bad?", "கால சர்ப்ப தோஷம் எப்போதும் கெட்டதா?"), a: b("No. It intensifies the chart rather than ruining it. Many achievers carry it. The result depends on the axis direction, planet strength, and whether benefics support the Lagna and Moon.", "இல்லை. இது ஜாதகத்தை அழிப்பதை விட தீவிரப்படுத்துகிறது. பல சாதனையாளர்களுக்கு இது உள்ளது. பலன் அச்சு திசை, கிரக பலம், சுப கிரகங்கள் லக்னம்-சந்திரனை ஆதரிக்கிறதா என்பதைப் பொறுத்தது.") },
      { q: b("Can the dosham be 'cancelled'?", "தோஷம் 'ரத்து' ஆகுமா?"), a: b("Partial breaks are common: if a planet sits outside the Rahu-Ketu enclosure, or strong yogas operate, the strict Kala Sarpa effect is reduced. A full chart reading decides how much applies.", "பகுதி உடைப்புகள் பொதுவானவை: ஒரு கிரகம் ராகு-கேது சுற்றுக்கு வெளியே இருந்தால், அல்லது பலமான யோகங்கள் செயல்பட்டால், கடுமையான கால சர்ப்ப பலன் குறைகிறது. எவ்வளவு பொருந்தும் என்பதை முழு ஜாதக வாசிப்பு தீர்மானிக்கும்.") },
      { q: b("When is it felt most?", "எப்போது அதிகம் உணரப்படும்?"), a: b("Usually during Rahu and Ketu dasha-bhukti and when transits cross the nodal axis. Outside these windows, many people barely notice it.", "பொதுவாக ராகு மற்றும் கேது தசை-புத்தியிலும், கோச்சாரம் நோடு அச்சைக் கடக்கும்போதும். இந்த காலங்களுக்கு வெளியே, பலர் இதை அரிதாகவே உணர்கிறார்கள்.") },
    ],
    ctaVariant: "dosham",
    related: [
      { href: "/temples/thirunageswaram", label: b("Rahu temple", "ராகு கோயில்") },
      { href: "/temples/keezhaperumpallam", label: b("Ketu temple", "கேது கோயில்") },
      { href: "/yogam", label: b("Yogams that can balance dosham", "தோஷத்தை சமன் செய்யும் யோகங்கள்") },
    ],
  },
  "pithru-dosham": {
    slug: "pithru-dosham",
    kind: "dosham",
    topic: "dosham",
    eyebrow: b("Dosham guide · ancestral karma", "தோஷ வழிகாட்டி · முன்னோர் கர்மம்"),
    title: b("Pithru Dosham", "பித்ரு தோஷம்"),
    lead: b(
      "Pithru dosham is read where ancestral duties, Sun, 9th house, 5th house, and lineage blessings appear stressed. It calls for remembrance and responsibility, not fear.",
      "பித்ரு தோஷம் முன்னோர் கடமை, சூரியன், 9-ஆம் பாவம், 5-ஆம் பாவம், வம்ச ஆசீர்வாதம் ஆகிய இடங்களில் அழுத்தம் தெரியும் போது பார்க்கப்படுகிறது. இது பயமல்ல; நினைவு, பொறுப்பு, கடமை."
    ),
    quickFacts: [
      { label: b("Theme", "தலைப்பு"), value: b("Ancestral karma & duty", "முன்னோர் கர்மம் & கடமை") },
      { label: b("Houses watched", "பார்க்கும் பாவங்கள்"), value: b("9th house, 5th house, Sun, Jupiter", "9-ஆம் பாவம், 5-ஆம் பாவம், சூரியன், குரு") },
      { label: b("Life areas", "வாழ்க்கைத் துறைகள்"), value: b("Family flow, children, fortune", "குடும்ப ஓட்டம், சந்தானம், பாக்கியம்") },
      { label: b("Main response", "முக்கிய நடைமுறை"), value: b("Tarpanam, charity, remembrance", "தர்ப்பணம், தானம், நினைவு") },
    ],
    sections: [
      {
        heading: b("What it is", "என்ன என்பது"),
        body: [
          b(
            "Pithru dosham is the karmic marker of unfinished duty toward ancestors and elders. In Tamil practice it is read not as a punishment but as a reminder — that the family line carries something that respect, remembrance and service can settle.",
            "பித்ரு தோஷம் என்பது முன்னோர் மற்றும் மூத்தோருக்கான நிறைவேறாத கடமையின் கர்மக் குறி. தமிழ் நடைமுறையில் இது தண்டனையாக அல்ல, நினைவூட்டலாகப் படிக்கப்படுகிறது — வம்சம் சுமக்கும் ஒன்றை மரியாதை, நினைவு, சேவை ஆகியவை தீர்க்க முடியும்."
          ),
          b(
            "It is connected with the Sun (father and forefathers), the 9th house of dharma and fortune, and Jupiter. A strong 9th house often means the duty is light and easily honoured.",
            "இது சூரியன் (தந்தை மற்றும் முன்னோர்), தர்மம் மற்றும் பாக்கியம் தரும் 9-ஆம் பாவம், குரு ஆகியவற்றுடன் தொடர்புடையது. பலமான 9-ஆம் பாவம் பெரும்பாலும் கடமை இலகுவானது, எளிதாக நிறைவேற்றக்கூடியது என்பதைக் குறிக்கிறது."
          ),
        ],
      },
      {
        heading: b("What it can bring", "எதை கொண்டுவரலாம்"),
        body: [
          b(
            "It can show as repeating family patterns, blessings that seem blocked until elders are honoured, a strained bond with the father, or fortune that opens only after sincere remembrance and charity.",
            "மீண்டும் வரும் குடும்ப அமைப்புகள், மூத்தோரை மதிக்கும் வரை தடைபட்டதாகத் தோன்றும் ஆசீர்வாதங்கள், தந்தையுடன் சிக்கலான பந்தம், அல்லது மனமார்ந்த நினைவு மற்றும் தானத்திற்குப் பின் மட்டுமே திறக்கும் பாக்கியம் ஆகியவையாக இது வெளிப்படலாம்."
          ),
          b(
            "Handled with the simple traditional response, it usually lightens. Not every ancestral marker is severe — the chart shows how much weight it really carries.",
            "எளிய பாரம்பரிய நடைமுறையுடன் கையாண்டால், இது வழக்கமாக இலகுவாகிறது. ஒவ்வொரு முன்னோர் குறியும் கடுமையானது அல்ல — அது உண்மையில் எவ்வளவு எடை சுமக்கிறது என்பதை ஜாதகம் காட்டுகிறது."
          ),
        ],
      },
      {
        heading: b("Signs & who should look into it", "அறிகுறிகள் & யார் பார்க்க வேண்டும்"),
        body: [
          b(
            "People check this when the same obstacles repeat across generations, when progress stalls despite effort, or when they feel a pull to settle ancestral rites. It is also commonly read alongside the Sun's and 9th house's condition.",
            "தலைமுறைகளாக அதே தடைகள் மீண்டும் வரும்போது, முயற்சி இருந்தும் முன்னேற்றம் நிற்கும்போது, அல்லது முன்னோர் சடங்குகளை நிறைவேற்றும் உந்துதலை உணரும்போது மக்கள் இதைப் பார்க்கின்றனர். சூரியன் மற்றும் 9-ஆம் பாவ நிலையுடன் சேர்த்தும் இது பொதுவாகப் படிக்கப்படுகிறது."
          ),
        ],
      },
    ],
    remedies: {
      heading: b("Remedies & what to do", "பரிகாரங்கள் & என்ன செய்வது"),
      intro: b(
        "Pithru dosham remedies are about remembrance and gratitude rather than fear. They are simple, repeatable, and traditionally done especially on new-moon days.",
        "பித்ரு தோஷ பரிகாரங்கள் பயத்தை விட நினைவு மற்றும் நன்றியைப் பற்றியவை. இவை எளிமையானவை, மீண்டும் செய்யக்கூடியவை, பாரம்பரியமாக குறிப்பாக அமாவாசை நாட்களில் செய்யப்படுபவை."
      ),
      items: [
        b("Perform Amavasya tarpanam and remember ancestors on their tithi with a simple offering.", "அமாவாசை தர்ப்பணம் செய்து, முன்னோரை அவர்களின் திதியில் எளிய நைவேத்யத்துடன் நினைவுகூருங்கள்."),
        b("Offer annadanam (feeding), charity to elders, and care for parents and elderly relatives.", "அன்னதானம், மூத்தோருக்கு தானம், பெற்றோர் மற்றும் முதியோர் உறவினர்களைப் பராமரித்தல் ஆகியவற்றைச் செய்யுங்கள்."),
        b("Strengthen the Sun and Jupiter through Sunday/Thursday worship and respect to teachers and forefathers.", "ஞாயிறு/வியாழன் வழிபாடு, ஆசிரியர் மற்றும் முன்னோர் மரியாதை மூலம் சூரியன் மற்றும் குருவை பலப்படுத்துங்கள்."),
      ],
    },
    faq: [
      { q: b("Is Pithru dosham caused by something we did wrong?", "பித்ரு தோஷம் நாம் செய்த தவறால் வருகிறதா?"), a: b("It is read as inherited duty rather than personal fault. The traditional response is remembrance, rites and charity — acts of gratitude that settle the obligation, not penance for a sin.", "இது தனிப்பட்ட தவறை விட பரம்பரை கடமையாகப் படிக்கப்படுகிறது. பாரம்பரிய நடைமுறை நினைவு, சடங்குகள், தானம் — பாவத்திற்கான பிராயச்சித்தம் அல்ல, கடமையைத் தீர்க்கும் நன்றிச் செயல்கள்.") },
      { q: b("Do I need a priest for the remedies?", "பரிகாரங்களுக்கு புரோகிதர் தேவையா?"), a: b("Formal tarpanam is usually guided by a priest, but daily remembrance, charity, feeding and care for elders can be done by anyone. Sincerity matters more than scale.", "முறையான தர்ப்பணம் வழக்கமாக புரோகிதரால் வழிநடத்தப்படுகிறது; ஆனால் தினசரி நினைவு, தானம், அன்னதானம், மூத்தோர் பராமரிப்பு ஆகியவற்றை யாரும் செய்யலாம். அளவை விட மனத்தூய்மை முக்கியம்.") },
      { q: b("Will it affect my children too?", "இது என் குழந்தைகளையும் பாதிக்குமா?"), a: b("Ancestral duty, once honoured sincerely, is traditionally believed to ease the pattern for the whole line. A strong 5th house and Jupiter further protect the next generation.", "முன்னோர் கடமை மனமார்ந்து நிறைவேற்றப்பட்டால், அந்த அமைப்பு முழு வம்சத்திற்கும் இலகுவாகும் என்று பாரம்பரியமாக நம்பப்படுகிறது. பலமான 5-ஆம் பாவம் மற்றும் குரு அடுத்த தலைமுறையை மேலும் பாதுகாக்கின்றன.") },
    ],
    ctaVariant: "dosham",
    related: [
      { href: "/temples", label: b("Temple guidance", "கோயில் வழிகாட்டல்") },
      { href: "/pariharam", label: b("Pariharam", "பரிகாரம்") },
      { href: "/tools/jadhagam-generator", label: b("Generate jadhagam", "ஜாதகம் உருவாக்கு") },
    ],
  },
  "kalathra-dosham": {
    slug: "kalathra-dosham",
    kind: "dosham",
    topic: "dosham",
    eyebrow: b("Dosham guide · marriage house", "தோஷ வழிகாட்டி · திருமண பாவம்"),
    title: b("Kalathra Dosham", "களத்திர தோஷம்"),
    lead: b(
      "Kalathra dosham relates to stress around spouse, marriage harmony, and the 7th house. It is judged from the 7th house, 7th lord, Venus, Jupiter, Mars, Rahu-Ketu, and dasha timing.",
      "களத்திர தோஷம் துணை, திருமண ஒற்றுமை, 7-ஆம் பாவம் ஆகியவற்றைச் சார்ந்தது. 7-ஆம் பாவம், அதன் அதிபதி, சுக்கிரன், குரு, செவ்வாய், ராகு-கேது, தசை காலம் ஆகியவற்றால் பார்க்கப்படுகிறது."
    ),
    quickFacts: [
      { label: b("Theme", "தலைப்பு"), value: b("Spouse & marriage harmony", "துணை & திருமண ஒற்றுமை") },
      { label: b("Houses watched", "பார்க்கும் பாவங்கள்"), value: b("7th house & lord, Venus, Jupiter, Mars", "7-ஆம் பாவம் & அதிபதி, சுக்கிரன், குரு, செவ்வாய்") },
      { label: b("Life areas", "வாழ்க்கைத் துறைகள்"), value: b("Marriage timing, harmony, partnership", "திருமண காலம், ஒற்றுமை, கூட்டாண்மை") },
      { label: b("Balanced by", "சமன் செய்வது"), value: b("Good porutham, strong 7th lord, maturity", "நல்ல பொருத்தம், பலமான 7-ஆம் அதிபதி, முதிர்ச்சி") },
    ],
    sections: [
      {
        heading: b("What it is", "என்ன என்பது"),
        body: [
          b(
            "Kalathra dosham is stress on the 7th house — the house of spouse and marriage. It points to friction or delay in finding, settling into, or sustaining a marriage, depending on which planet is pressuring the house.",
            "களத்திர தோஷம் என்பது துணை மற்றும் திருமணத்தைக் குறிக்கும் 7-ஆம் பாவத்தின் அழுத்தம். எந்த கிரகம் பாவத்தை அழுத்துகிறது என்பதைப் பொறுத்து, துணையைக் கண்டுபிடிப்பது, நிலைபெறுவது, அல்லது திருமணத்தைத் தக்கவைப்பதில் உராய்வு அல்லது தாமதத்தைக் குறிக்கிறது."
          ),
          b(
            "It is a pattern to manage, not a refusal of marriage. Most charts with it marry well once the timing, maturity and match are right.",
            "இது கையாள வேண்டிய அமைப்பு; திருமண மறுப்பு அல்ல. காலம், முதிர்ச்சி, பொருத்தம் சரியாக இருந்தால் இதைக் கொண்ட பெரும்பாலான ஜாதகங்கள் நன்றாகவே திருமணம் செய்கின்றன."
          ),
        ],
      },
      {
        heading: b("What it can bring", "எதை கொண்டுவரலாம்"),
        body: [
          b(
            "Common experiences are delayed marriage, repeated proposals that fall through, mismatches that need negotiation, emotional distance, or a stretch of growing-up before the relationship steadies.",
            "வழக்கமான அனுபவங்கள்: திருமணத் தாமதம், கைகூடாமல் போகும் மீண்டும் மீண்டும் வரும் வரன்கள், சமரசம் தேவைப்படும் பொருத்த குறைவு, உணர்ச்சி தூரம், அல்லது உறவு நிலைபெறும் முன் முதிர்ச்சியடையும் காலம்."
          ),
          b(
            "When the 7th lord is strong, benefics aspect the house, porutham is good, and both partners are mature, the same dosham is easily carried.",
            "7-ஆம் அதிபதி பலமாக இருந்து, சுப கிரகங்கள் பாவத்தைப் பார்த்து, பொருத்தம் நன்றாக இருந்து, இருவரும் முதிர்ச்சியடைந்திருந்தால், அதே தோஷம் எளிதாகச் சுமக்கப்படுகிறது."
          ),
        ],
      },
      {
        heading: b("Signs & who should look into it", "அறிகுறிகள் & யார் பார்க்க வேண்டும்"),
        body: [
          b(
            "People check this when marriage is delayed without clear reason, when alliances keep breaking at the last step, or when matching reports flag the 7th house. It is best read by comparing both horoscopes, not from one chart alone.",
            "தெளிவான காரணமின்றி திருமணம் தாமதமாகும்போது, கடைசி கட்டத்தில் வரன்கள் தொடர்ந்து உடையும்போது, அல்லது பொருத்த அறிக்கைகள் 7-ஆம் பாவத்தைச் சுட்டிக்காட்டும்போது மக்கள் இதைப் பார்க்கின்றனர். ஒரே ஜாதகத்தை வைத்து அல்ல, இரு ஜாதகங்களையும் ஒப்பிட்டுப் பார்ப்பதே சிறந்தது."
          ),
        ],
      },
    ],
    remedies: {
      heading: b("Remedies & what to do", "பரிகாரங்கள் & என்ன செய்வது"),
      intro: b(
        "Remedies steady the marriage houses and bring confidence; they work best paired with honest porutham checking and open family communication rather than fear of marriage.",
        "பரிகாரங்கள் திருமண பாவங்களை அமைதிப்படுத்தி நம்பிக்கையைத் தருகின்றன; திருமணப் பயத்தை விட நேர்மையான பொருத்தம் பார்த்தல் மற்றும் திறந்த குடும்பப் பேச்சுடன் சேரும்போது சிறப்பாகப் பயன்படுகின்றன."
      ),
      items: [
        b("Worship at Thirumananjeri for timely marriage; pray to Venus (Friday) and Jupiter (Thursday) for harmony.", "காலத்தில் திருமணத்திற்கு திருமணஞ்சேரியில் வழிபடுங்கள்; ஒற்றுமைக்காக சுக்கிரன் (வெள்ளி) மற்றும் குரு (வியாழன்) வழிபாடு செய்யுங்கள்."),
        b("Run a proper marriage porutham before fixing an alliance, and weigh maturity and compatibility, not the dosham label alone.", "வரன் முடிவு செய்வதற்கு முன் முறையான திருமணப் பொருத்தம் பாருங்கள்; தோஷ முத்திரையை மட்டும் அல்ல, முதிர்ச்சி மற்றும் பொருத்தத்தை எடைபோடுங்கள்."),
        b("If Mars is the cause, follow Sevvai dosham remedies; keep family conversation calm and patient.", "செவ்வாய் காரணமாக இருந்தால், செவ்வாய் தோஷ பரிகாரங்களைப் பின்பற்றுங்கள்; குடும்பப் பேச்சை அமைதியாகவும் பொறுமையாகவும் வையுங்கள்."),
      ],
    },
    faq: [
      { q: b("Does Kalathra dosham mean my marriage will fail?", "களத்திர தோஷம் என்றால் என் திருமணம் தோல்வியடையுமா?"), a: b("No. It indicates sensitivity in the marriage house, often just delay or the need for a good match. A strong 7th lord, benefic support and proper porutham let many such charts enjoy a stable marriage.", "இல்லை. இது திருமண பாவத்தில் உணர்திறனைக் குறிக்கிறது, பெரும்பாலும் தாமதம் அல்லது நல்ல பொருத்தத்தின் தேவை மட்டுமே. பலமான 7-ஆம் அதிபதி, சுப ஆதரவு, சரியான பொருத்தம் ஆகியவை இதுபோன்ற பல ஜாதகங்களை நிலையான திருமணத்தை அனுபவிக்க வைக்கின்றன.") },
      { q: b("Is it the same as Sevvai (Mangal) dosham?", "இது செவ்வாய் (மங்கள) தோஷம் தானா?"), a: b("Not exactly. Sevvai dosham is specifically Mars pressuring the marriage houses. Kalathra dosham is broader — any planet (Mars, Saturn, Rahu-Ketu) stressing the 7th house and spouse significations.", "சரியாக அல்ல. செவ்வாய் தோஷம் என்பது குறிப்பாக திருமண பாவங்களை அழுத்தும் செவ்வாய். களத்திர தோஷம் பரந்தது — எந்த கிரகமும் (செவ்வாய், சனி, ராகு-கேது) 7-ஆம் பாவத்தையும் துணை காரகத்தையும் அழுத்துவது.") },
      { q: b("Should both horoscopes be checked?", "இரு ஜாதகங்களும் பார்க்க வேண்டுமா?"), a: b("Yes. Marriage questions need both charts compared through porutham. A concern in one chart is often balanced by strength in the other, so conclusions should never come from a single horoscope.", "ஆம். திருமண கேள்விகளுக்கு இரு ஜாதகங்களையும் பொருத்தம் மூலம் ஒப்பிட வேண்டும். ஒரு ஜாதகத்தில் உள்ள கவலை பெரும்பாலும் மற்றொன்றில் உள்ள பலத்தால் சமன் செய்யப்படுகிறது; எனவே ஒரே ஜாதகத்திலிருந்து முடிவு வரக்கூடாது.") },
    ],
    ctaVariant: "marriage-pariharam",
    related: [
      { href: "/tools/marriage-porutham-calculator", label: b("Marriage Porutham", "திருமண பொருத்தம்") },
      { href: "/pariharam/thirumana-thadai", label: b("Marriage delay pariharam", "திருமணத் தடை பரிகாரம்") },
      { href: "/dosham/sevvai-dosham", label: b("Sevvai dosham", "செவ்வாய் தோஷம்") },
    ],
  },
};

const nagaSarpaSections = DOSHAM_DETAILS["naga-sarpa-dosham"].sections;
DOSHAM_DETAILS["naga-sarpa-dosham"].sections = [
  nagaSarpaSections[0],
  nagaSarpaSections[1],
  {
    heading: b("How it is checked in Thirukanitham", "திருக்கணிதத்தில் எப்படி பார்க்கப்படுகிறது"),
    body: [
      b(
        "Tamil astrologers do not call Naga dosham from Rahu and Ketu alone. They examine the 5th house, its lord, Jupiter, putra-karaka indicators, and whether the nodal axis is truly afflicting that line from Lagna and Moon.",
        "தமிழ் ஜோதிடர்கள் ராகு-கேதுவை மட்டும் வைத்து நாக தோஷம் என்று சொல்லமாட்டார்கள். 5-ஆம் பாவம், அதன் அதிபதி, குரு, புத்திர காரக குறிகள், லக்னம் மற்றும் சந்திரத்திலிருந்து நோடு அச்சு அந்த வரிசையை உண்மையில் அழுத்துகிறதா என்று பார்க்கிறார்கள்."
      ),
      b(
        "The running dasha matters just as much. Naga dosham reads stronger when Rahu-Ketu periods activate a weak 5th house; it reads milder when Guru is strong and benefics protect childbirth and family continuity.",
        "நடக்கும் தசையும் அதே அளவு முக்கியம். பலவீனமான 5-ஆம் பாவத்தை ராகு-கேது தசைகள் செயல்படுத்தும் போது நாக தோஷம் வலுவாகப் படிக்கப்படும்; குரு பலமாக இருந்து சந்தானம் மற்றும் குடும்பத் தொடரை சுப கிரகங்கள் காக்கும் போது இது மிதமாகும்."
      ),
    ],
  },
  {
    heading: b("When it becomes mild", "எப்போது மிதமாகும்"),
    body: [
      b(
        "The indication lightens when Jupiter is strong, the 5th lord is dignified, benefics aspect the 5th house, or a supportive dasha-bhukti opens the matter after delay.",
        "குரு பலமாக இருந்தால், 5-ஆம் அதிபதி நல்ல நிலையில் இருந்தால், சுப கிரகங்கள் 5-ஆம் பாவத்தைப் பார்த்தால், அல்லது ஆதரவான தசை-புத்தி தாமதத்திற்குப் பின் விஷயத்தைத் திறந்தால் இந்தக் குறிப்பு இலகுவாகும்."
      ),
      b(
        "That is why Tamil astrologers usually treat it as a delay, knot, or karmic weight rather than a final denial. The chart decides whether patience alone is enough or whether both prayer and practical care are needed.",
        "அதனால்தான் தமிழ் ஜோதிடர்கள் இதை இறுதி மறுப்பாக அல்ல, தாமதம், முடிச்சு, அல்லது கர்ம எடையாகவே பார்க்கிறார்கள். பொறுமை மட்டும் போதுமா, இல்லையெனில் பிரார்த்தனையும் நடைமுறை கவனமும் சேர வேண்டுமா என்பதை ஜாதகமே தீர்மானிக்கிறது."
      ),
    ],
  },
  {
    ...nagaSarpaSections[2],
    body: [
      ...nagaSarpaSections[2].body,
      b(
        "Serpent imagery, temple instructions, or family stories are treated only as supporting clues. Tamil astrology still asks whether the Thirukanitham chart itself repeats the indication before calling it strong.",
        "பாம்பு குறியீடுகள், கோயில் அறிவுறுத்தல்கள், அல்லது குடும்பக் கதைகள் ஆதரவு குறிகளாக மட்டும் எடுத்துக்கொள்ளப்படுகின்றன. திருக்கணித ஜாதகமே அந்தச் சுட்டியை மீண்டும் மீண்டும் உறுதிப்படுத்துகிறதா என்று பார்த்த பிறகே தமிழ் ஜோதிடம் இதை வலுவாகக் கூறும்."
      ),
    ],
  },
];

const kalaSarpaSections = DOSHAM_DETAILS["kala-sarpa-dosham"].sections;
DOSHAM_DETAILS["kala-sarpa-dosham"].sections = [
  kalaSarpaSections[0],
  kalaSarpaSections[1],
  {
    heading: b("How it is checked in Thirukanitham", "திருக்கணிதத்தில் எப்படி பார்க்கப்படுகிறது"),
    body: [
      b(
        "A proper Thirukanitham reading checks whether all seven classical planets are truly enclosed between Rahu and Ketu, whether any graha breaks the enclosure, and which way the nodal axis is running.",
        "முறையான திருக்கணித வாசிப்பில் ஏழு கிரகங்களும் உண்மையில் ராகு-கேதுவுக்குள் அடைந்துள்ளனவா, ஏதேனும் கிரகம் அந்தச் சுற்றை உடைக்கிறதா, நோடு அச்சு எந்தத் திசையில் ஓடுகிறது என்பதையெல்லாம் பார்க்கிறார்கள்."
      ),
      b(
        "Lagna strength, Moon stability, and the running Rahu-Ketu dasha decide whether the pattern is only intense or genuinely difficult. Without that full reading, many charts are labelled too quickly.",
        "லக்ன பலம், சந்திரத்தின் நிலை, நடக்கும் ராகு-கேது தசை ஆகியவை இந்த அமைப்பு வெறும் தீவிரம்தானா, இல்லையெனில் உண்மையில் கடினமா என்பதை முடிவுசெய்கின்றன. அந்த முழு வாசிப்பில்லாமல் பல ஜாதகங்கள் விரைவாகத் தவறாகப் பெயரிடப்படுகின்றன."
      ),
    ],
  },
  {
    heading: b("When it becomes mild or breaks", "எப்போது குறையும் அல்லது உடையும்"),
    body: [
      b(
        "If even one planet sits outside the nodal enclosure, or if strong yogas, Guru, or benefics protect the Lagna and Moon, the harsh form is reduced.",
        "ஒரே ஒரு கிரகமாவது நோடு சுற்றுக்கு வெளியே இருந்தாலோ, வலுவான யோகங்கள், குரு, அல்லது சுப கிரகங்கள் லக்னமும் சந்திரனையும் காத்தாலோ, இதன் கடினமான வடிவம் குறையும்."
      ),
      b(
        "Then Kala Sarpa behaves more like concentrated ambition and inner pressure than destruction. In Tamil astrology it is often read as a test-filled rise, not a ruined fate.",
        "அப்போது கால சர்ப்பம் அழிவாக அல்ல, குவிந்த லட்சியம் மற்றும் உள்ளழுத்தமாகவே செயல்படும். தமிழ் ஜோதிடத்தில் இது சோதனைகள் நிறைந்த உயர்வாகப் படிக்கப்படுவது அதிகம்; சிதைந்த விதியாக அல்ல."
      ),
    ],
  },
  {
    ...kalaSarpaSections[2],
    body: [
      ...kalaSarpaSections[2].body,
      b(
        "This is why traditional astrologers confirm the full structure before using the label. A social-media-style pattern match is not enough for a serious reading.",
        "அதனால்தான் பாரம்பரிய ஜோதிடர்கள் இந்தப் பெயரைப் பயன்படுத்துவதற்கு முன் முழு அமைப்பையும் உறுதிப்படுத்துகிறார்கள். மேலோட்டமான வடிவப் பொருத்தம் மட்டும் ஒரு தீவிர வாசிப்புக்கு போதாது."
      ),
    ],
  },
];

const pithruSections = DOSHAM_DETAILS["pithru-dosham"].sections;
DOSHAM_DETAILS["pithru-dosham"].sections = [
  pithruSections[0],
  pithruSections[1],
  {
    heading: b("How it is checked in Thirukanitham", "திருக்கணிதத்தில் எப்படி பார்க்கப்படுகிறது"),
    body: [
      b(
        "Tamil astrologers check the 9th house, 9th lord, Sun, Jupiter, the 5th house, and afflictions from Saturn, Rahu or Ketu. They also note whether the family line shows repeated breaks in blessing, support, or continuity.",
        "தமிழ் ஜோதிடர்கள் 9-ஆம் பாவம், 9-ஆம் அதிபதி, சூரியன், குரு, 5-ஆம் பாவம், சனி, ராகு, கேது ஆகியவற்றின் பாதிப்பை பார்க்கிறார்கள். குடும்ப வரிசையில் ஆசீர்வாதம், ஆதரவு, தொடர்ச்சி ஆகியவற்றில் மீண்டும் மீண்டும் உடைப்பு இருக்கிறதா என்பதையும் கவனிக்கிறார்கள்."
      ),
      b(
        "The dosham is treated as stronger when the Sun is weak, the 9th house is afflicted, and the relevant dasha activates that strain. A healthy 9th house often shows that ancestral duty is present but manageable.",
        "சூரியன் பலவீனமாக இருந்தாலும், 9-ஆம் பாவம் பாதிக்கப்பட்டிருந்தாலும், சம்பந்தப்பட்ட தசை அந்த அழுத்தத்தை இயக்கினாலும் இந்த தோஷம் வலுவாகக் கருதப்படும். நல்ல 9-ஆம் பாவம் இருந்தால் முன்னோர் கடமை இருப்பினும் அது சமாளிக்கக்கூடியதாக இருப்பதைக் காட்டும்."
      ),
    ],
  },
  {
    heading: b("When it becomes mild", "எப்போது மிதமாகும்"),
    body: [
      b(
        "It becomes light when the 9th lord is strong, Jupiter blesses the chart, elders are respected, and Amavasya remembrance or tarpanam is maintained steadily.",
        "9-ஆம் அதிபதி பலமாக இருந்தால், குரு ஜாதகத்தை ஆசீர்வதித்தால், மூத்தோர்கள் மதிக்கப்படுவார்கள், அமாவாசை நினைவு அல்லது தர்ப்பணம் தொடர்ந்து செய்யப்படும் போது இது இலகுவாகும்."
      ),
      b(
        "Not every issue with a father, family, or delay is Pithru dosham. Tamil astrology asks whether the chart repeatedly points to ancestral duty before naming it so.",
        "தந்தை, குடும்பம், அல்லது தாமதம் சம்பந்தமான ஒவ்வொரு பிரச்சினையும் பித்ரு தோஷம் அல்ல. ஜாதகம் மீண்டும் மீண்டும் முன்னோர் கடமையைச் சுட்டிக்காட்டுகிறதா என்று பார்த்த பிறகே தமிழ் ஜோதிடம் அந்தப் பெயரைச் சொல்கிறது."
      ),
    ],
  },
  {
    ...pithruSections[2],
    body: [
      ...pithruSections[2].body,
      b(
        "Dreams, ritual pull, or family advice are supporting hints, but the chart still has to confirm the ancestral theme. That keeps the reading respectful rather than superstitious.",
        "கனவுகள், சடங்கு செய்யும் உந்துதல், அல்லது குடும்ப அறிவுறுத்தல் ஆகியவை துணைக் குறிகள் மட்டுமே; முன்னோர் கரு ஜாதகத்தால் உறுதிப்படுத்தப்பட வேண்டும். அதனால் வாசிப்பு மூடநம்பிக்கையாக அல்ல, மரியாதையுடனே இருக்கும்."
      ),
    ],
  },
];

const kalathraSections = DOSHAM_DETAILS["kalathra-dosham"].sections;
DOSHAM_DETAILS["kalathra-dosham"].sections = [
  kalathraSections[0],
  kalathraSections[1],
  {
    heading: b("How it is checked in Thirukanitham", "திருக்கணிதத்தில் எப்படி பார்க்கப்படுகிறது"),
    body: [
      b(
        "A proper reading checks the 7th house, 7th lord, Venus, Jupiter, Mars, Saturn, and Rahu-Ketu from both Lagna and Moon. Tamil match-reading also compares both horoscopes through porutham before calling the dosham serious.",
        "முறையான வாசிப்பில் லக்னமும் சந்திரமும் இரண்டிலும் இருந்து 7-ஆம் பாவம், 7-ஆம் அதிபதி, சுக்கிரன், குரு, செவ்வாய், சனி, ராகு-கேது ஆகியவற்றைப் பார்க்கிறார்கள். இந்த தோஷம் தீவிரம் என்று சொல்லுவதற்கு முன் தமிழ் பொருத்தப் பார்வை இரு ஜாதகங்களையும் ஒப்பிடும்."
      ),
      b(
        "The same Mars or Saturn placement can behave very differently depending on sign dignity, benefic aspects, age, and dasha. So Kalathra dosham is never judged from one planet name alone.",
        "அதே செவ்வாய் அல்லது சனி அமைப்பு கூட ராசிப் பலம், சுப பார்வை, வயது, தசை ஆகியவற்றைப் பொறுத்து முற்றிலும் வேறுபடலாம். அதனால் களத்திர தோஷம் ஒரு கிரகப் பெயரை மட்டும் வைத்து தீர்மானிக்கப்படாது."
      ),
    ],
  },
  {
    heading: b("When it becomes mild", "எப்போது மிதமாகும்"),
    body: [
      b(
        "It softens when the 7th lord is strong, benefics aspect the marriage house, Venus is healthy, and the match itself shows good porutham and maturity.",
        "7-ஆம் அதிபதி பலமாக இருந்து, சுப கிரகங்கள் திருமணப் பாவத்தைப் பார்த்து, சுக்கிரன் நல்ல நிலையில் இருந்து, பொருத்தமே நல்லதாய் முதிர்ச்சியைக் காட்டினால் இது மெலிதாகும்."
      ),
      b(
        "Many charts carry only delay, not damage. Once timing opens and the partner match is right, the same dosham often settles into an ordinary married life.",
        "பல ஜாதகங்களில் இது பாதிப்பை அல்ல, தாமதத்தை மட்டுமே தரும். காலம் திறந்து, துணை பொருத்தம் சரியாக வந்த பிறகு, இதே தோஷம் சாதாரணத் திருமண வாழ்வாக நிலைபெறும்."
      ),
    ],
  },
  {
    ...kalathraSections[2],
    body: [
      ...kalathraSections[2].body,
      b(
        "That is why Tamil astrologers compare both charts and family realities before speaking strongly. The label matters less than timing, porutham, and the actual strength of the marriage house.",
        "அதனால்தான் தமிழ் ஜோதிடர்கள் தீவிரமாகச் சொல்லுவதற்கு முன் இரு ஜாதகங்களையும் குடும்ப நிதர்சனங்களையும் ஒப்பிடுகிறார்கள். பெயரைவிட காலம், பொருத்தம், திருமணப் பாவத்தின் உண்மை பலம் ஆகியவையே முக்கியம்."
      ),
    ],
  },
];

export const YOGAM_DETAILS: Record<string, GuideDetail> = {
  "gaja-kesari-yogam": {
    slug: "gaja-kesari-yogam",
    kind: "yogam",
    topic: "dosham",
    eyebrow: b("Yogam guide · Moon and Jupiter", "யோக வழிகாட்டி · சந்திரன் மற்றும் குரு"),
    title: b("Gaja Kesari Yogam", "கஜகேசரி யோகம்"),
    lead: b(
      "Gaja Kesari Yogam forms when Jupiter is in a kendra from the Moon. It can support intelligence, reputation, counsel, protection, and social respect when the Moon and Jupiter are strong.",
      "சந்திரனிலிருந்து குரு கேந்திரத்தில் இருந்தால் கஜகேசரி யோகம் உருவாகும். சந்திரன், குரு பலமாக இருந்தால் அறிவு, மதிப்பு, ஆலோசனை திறன், பாதுகாப்பு, சமூக மரியாதை ஆகியவற்றை ஆதரிக்கலாம்."
    ),
    quickFacts: [
      { label: b("Formula", "சூத்திரம்"), value: b("Jupiter in a kendra (1/4/7/10) from the Moon", "சந்திரனிலிருந்து கேந்திரத்தில் (1/4/7/10) குரு") },
      { label: b("Planets", "கிரகங்கள்"), value: b("Moon & Jupiter", "சந்திரன் & குரு") },
      { label: b("Tends to give", "தரும்"), value: b("Wisdom, repute, counsel, protection", "ஞானம், மதிப்பு, ஆலோசனை, பாதுகாப்பு") },
      { label: b("Strongest in", "வலுப்பெறும்"), value: b("Moon or Jupiter dasha", "சந்திரன் அல்லது குரு தசை") },
    ],
    sections: [
      {
        heading: b("What it is", "என்ன என்பது"),
        body: [
          b(
            "Gaja Kesari Yogam forms when Jupiter sits in a kendra — the 1st, 4th, 7th or 10th — from the Moon. The name means 'elephant and lion', suggesting dignity and strength. It is one of the best-known benefic combinations in Tamil jyotisha.",
            "சந்திரனிலிருந்து கேந்திரத்தில் — 1, 4, 7 அல்லது 10-ஆம் இடத்தில் — குரு அமரும்போது கஜகேசரி யோகம் உருவாகிறது. இப்பெயரின் பொருள் 'யானையும் சிங்கமும்', கம்பீரத்தையும் பலத்தையும் குறிக்கிறது. தமிழ் ஜோதிடத்தில் இது மிகவும் அறியப்பட்ட சுப சேர்க்கைகளில் ஒன்று."
          ),
          b(
            "Its real strength depends on the condition of both planets: a Jupiter in own, exalted or friendly sign with a healthy Moon makes the yoga powerful; a weak or afflicted Jupiter makes it only mild.",
            "அதன் உண்மையான பலம் இரு கிரகங்களின் நிலையைப் பொறுத்தது: சொந்த, உச்ச அல்லது நட்பு ராசியில் உள்ள குரு, ஆரோக்கியமான சந்திரனுடன் இருந்தால் யோகம் சக்தி வாய்ந்ததாகும்; பலவீன அல்லது பாதிக்கப்பட்ட குரு அதை மிதமாக்குகிறது."
          ),
        ],
      },
      {
        heading: b("What it can bring", "எதை கொண்டுவரலாம்"),
        body: [
          b(
            "It supports learning, sound judgement, a good name, generosity, and the trust of respected people. Such natives are often sought for advice and tend to recover gracefully from setbacks.",
            "இது கல்வி, சரியான தீர்மானம், நற்பெயர், தாராளம், மதிப்புள்ளவர்களின் நம்பிக்கை ஆகியவற்றை ஆதரிக்கிறது. இவர்கள் ஆலோசனைக்காக நாடப்படுகிறார்கள்; பின்னடைவுகளிலிருந்து நயமாக மீள்கிறார்கள்."
          ),
          b(
            "The blessing is felt most clearly during Moon or Jupiter dasha, especially when those planets also rule supportive houses for education, counsel or protection.",
            "சந்திரன் அல்லது குரு தசையில், குறிப்பாக அக்கிரகங்கள் கல்வி, ஆலோசனை அல்லது பாதுகாப்பு தரும் பாவங்களையும் ஆளும்போது இந்த அருள் தெளிவாக உணரப்படுகிறது."
          ),
        ],
      },
      {
        heading: b("How to know it's strong", "இது பலமானதா என அறிவது எப்படி"),
        body: [
          b(
            "A genuinely strong Gaja Kesari shows in a steady reputation, helpful mentors, and good sense under pressure. Combustion of Jupiter, dusthana ownership, or harsh Rahu-Ketu contact dilute it — so the same yoga name can be major in one chart and minor in another.",
            "உண்மையில் பலமான கஜகேசரி நிலையான நற்பெயர், உதவும் வழிகாட்டிகள், அழுத்தத்தில் நல்ல விவேகம் ஆகியவற்றில் தெரியும். குருவின் அஸ்தங்கம், துஷ்டான அதிபத்தியம், கடுமையான ராகு-கேது தொடர்பு ஆகியவை அதை நீர்த்துப்போகச் செய்கின்றன — எனவே அதே யோகப் பெயர் ஒரு ஜாதகத்தில் பெரியதாகவும் மற்றொன்றில் சிறியதாகவும் இருக்கலாம்."
          ),
        ],
      },
    ],
    bringCards: [
      {
        heading: b("Reputation & Wisdom", "மதிப்பு & ஞானம்"),
        items: [
          b("A lasting, trusted reputation in the community", "சமூகத்தில் நிலையான, நம்பகமான மதிப்பு"),
          b("Sound judgment and ethical decision-making", "சரியான தீர்மானம், ஒழுக்கமான முடிவுகள்"),
          b("Respect for learning and dharmic living", "கல்விக்கும் தர்ம வாழ்விற்கும் மரியாதை"),
        ],
      },
      {
        heading: b("Mentorship & Counsel", "ஆசிரியம் & ஆலோசனை"),
        items: [
          b("Sought for advice in difficult situations", "கடினமான நேரங்களில் ஆலோசனைக்கு நாடப்படுதல்"),
          b("Ability to guide and protect others", "மற்றவர்களை வழிகாட்டும், காக்கும் திறன்"),
          b("Helpful elders and mentors in one's own life", "தன் வாழ்வில் உதவும் பெரியோர், வழிகாட்டிகள்"),
        ],
      },
      {
        heading: b("Grace Under Pressure", "அழுத்தத்தில் நலன்"),
        items: [
          b("Recovering gracefully from setbacks", "பின்னடைவுகளிலிருந்து நயமாக மீளுதல்"),
          b("Generosity and goodwill that builds networks", "வலையமைப்பை உருவாக்கும் தாராளம் & நல்லெண்ணம்"),
          b("Calm authority rather than reactive stress", "எதிர்வினை அழுத்தம் அல்ல, அமைதியான அதிகாரம்"),
        ],
      },
    ],
    remedies: {
      heading: b("How to strengthen it", "எப்படி பலப்படுத்துவது"),
      intro: b(
        "You cannot 'create' a yoga, but you can support the planets that carry it so its promise expresses more fully — especially during their dasha.",
        "ஒரு யோகத்தை 'உருவாக்க' முடியாது; ஆனால் அதைச் சுமக்கும் கிரகங்களை ஆதரித்து, குறிப்பாக அவற்றின் தசையில், அதன் பலன் முழுமையாக வெளிப்பட உதவலாம்."
      ),
      items: [
        b("Honour Jupiter on Thursdays — respect teachers and elders, study, and acts of generosity.", "வியாழன்களில் குருவை மதியுங்கள் — ஆசிரியர், பெரியோர் மரியாதை, கல்வி, தாராள செயல்கள்."),
        b("Keep the Moon calm and strong — Monday worship, steady sleep, and a settled emotional routine.", "சந்திரனை அமைதியாகவும் பலமாகவும் வையுங்கள் — திங்கள் வழிபாடு, நிலையான தூக்கம், அமைதியான உணர்ச்சி வழக்கம்."),
        b("Use Moon and Jupiter dasha windows for education, advisory roles, and important life decisions.", "சந்திரன் மற்றும் குரு தசை காலங்களை கல்வி, ஆலோசனைப் பணிகள், முக்கிய வாழ்க்கை முடிவுகளுக்குப் பயன்படுத்துங்கள்."),
      ],
    },
    faq: [
      { q: b("I have Gaja Kesari Yogam but life is hard — why?", "எனக்கு கஜகேசரி யோகம் உள்ளது; ஆனால் வாழ்க்கை கடினம் — ஏன்?"), a: b("A yoga only delivers in proportion to the strength of its planets. If Jupiter is combust, debilitated, or owns difficult houses, the yoga is present but mild. Its results also surface mainly in Moon or Jupiter periods.", "ஒரு யோகம் அதன் கிரகங்களின் பலத்திற்கு ஏற்பவே பலன் தரும். குரு அஸ்தங்கம், நீசம், அல்லது கடின பாவங்களை ஆண்டால், யோகம் இருந்தாலும் மிதமாகும். அதன் பலன் முக்கியமாக சந்திரன் அல்லது குரு காலங்களில் வெளிப்படும்.") },
      { q: b("Is it enough on its own for success?", "வெற்றிக்கு இது மட்டும் போதுமா?"), a: b("It is a strong support, not a guarantee. It works best alongside other yogas, a strong 10th house, effort and good timing. Think of it as a powerful tailwind rather than the whole journey.", "இது பலமான ஆதரவு; உத்தரவாதம் அல்ல. மற்ற யோகங்கள், பலமான 10-ஆம் பாவம், முயற்சி, நல்ல காலம் ஆகியவற்றுடன் சேரும்போது சிறப்பாகப் பயன்படும். இதை முழு பயணமாக அல்ல, பலமான பின்னோட்ட காற்றாகக் கருதுங்கள்.") },
      { q: b("How rare is this yoga?", "இந்த யோகம் எவ்வளவு அரிது?"), a: b("The basic placement is fairly common; a high-quality Gaja Kesari with both planets strong and well-placed is much rarer, and that is what produces the celebrated results.", "அடிப்படை அமைப்பு ஓரளவு பொதுவானது; இரு கிரகங்களும் பலமாகவும் நல்ல இடத்திலும் உள்ள உயர்தர கஜகேசரி மிகவும் அரிது — அதுவே புகழ்பெற்ற பலன்களைத் தருகிறது.") },
    ],
    ctaVariant: "yogam",
    related: [
      { href: "/yogam/dhana-yogam", label: b("Dhana Yogam", "தன யோகம்") },
      { href: "/learn/how-to-read-a-jadhagam", label: b("How to read a jadhagam", "ஜாதகம் படிப்பது எப்படி") },
      { href: "/dosham", label: b("Doshams", "தோஷங்கள்") },
    ],
  },
  "dhana-yogam": {
    slug: "dhana-yogam",
    kind: "yogam",
    topic: "dosham",
    eyebrow: b("Yogam guide · wealth combinations", "யோக வழிகாட்டி · செல்வ சேர்க்கைகள்"),
    title: b("Dhana Yogam", "தன யோகம்"),
    lead: b(
      "Dhana Yogam is a family of wealth-giving combinations involving the 2nd, 5th, 9th, and 11th houses and their lords. It must be judged by strength, dignity, and dasha activation.",
      "தன யோகம் என்பது 2, 5, 9, 11-ஆம் பாவங்கள் மற்றும் அவற்றின் அதிபதிகள் தொடர்பான செல்வ சேர்க்கைகளின் தொகுப்பு. பலம், ராசி நிலை, தசை செயல்பாடு ஆகியவற்றால் மதிப்பிட வேண்டும்."
    ),
    quickFacts: [
      { label: b("Core houses", "முக்கிய பாவங்கள்"), value: b("2nd, 5th, 9th, 11th & their lords", "2, 5, 9, 11 & அவற்றின் அதிபதிகள்") },
      { label: b("Means", "குறிக்கிறது"), value: b("Wealth-giving combinations", "செல்வம் தரும் சேர்க்கைகள்") },
      { label: b("Can show as", "வெளிப்படும் வகை"), value: b("Earnings, assets, savings, patrons", "சம்பாத்தியம், சொத்து, சேமிப்பு, ஆதரவாளர்") },
      { label: b("Activates in", "செயல்படும்"), value: b("Dasha/bhukti of linked lords", "இணைந்த அதிபதிகளின் தசை/புத்தி") },
    ],
    sections: [
      {
        heading: b("What it is", "என்ன என்பது"),
        body: [
          b(
            "Dhana Yogam is not one combination but a family of them — any meaningful link between the lords of the 2nd (stored wealth), 11th (gains), 5th and 9th (fortune and merit) houses. When these lords join, aspect or exchange, they create wealth potential.",
            "தன யோகம் என்பது ஒரே சேர்க்கை அல்ல, ஒரு தொகுப்பு — 2-ஆம் (சேமிப்பு செல்வம்), 11-ஆம் (லாபம்), 5 மற்றும் 9-ஆம் (பாக்கியம் & புண்ணியம்) பாவ அதிபதிகளுக்கு இடையே உள்ள எந்த அர்த்தமுள்ள இணைப்பும். இவ்வதிபதிகள் சேரும், பார்க்கும், அல்லது பரிவர்த்தனை செய்யும்போது செல்வ வாய்ப்பை உருவாக்குகின்றன."
          ),
          b(
            "Its strength comes from the dignity of those lords and how cleanly they connect. A clean, strong link is a real wealth yoga; a weak or afflicted one is only a hint.",
            "அதன் பலம் அவ்வதிபதிகளின் நிலையிலிருந்தும், அவை எவ்வளவு தூய்மையாக இணைகின்றன என்பதிலிருந்தும் வருகிறது. தூய்மையான பலமான இணைப்பு உண்மையான தன யோகம்; பலவீன அல்லது பாதிக்கப்பட்டது வெறும் சுட்டுதல் மட்டுமே."
          ),
        ],
      },
      {
        heading: b("What it can bring", "எதை கொண்டுவரலாம்"),
        body: [
          b(
            "Dhana Yogam rarely means a lottery win. More often it shows steady earning ability, family assets, the discipline to save, supportive patrons, or gains through knowledge, profession and service.",
            "தன யோகம் அரிதாகவே குலுக்கல் வெற்றியைக் குறிக்கிறது. பெரும்பாலும் நிலையான சம்பாதிக்கும் திறன், குடும்ப சொத்து, சேமிக்கும் ஒழுக்கம், ஆதரவான புரவலர்கள், அல்லது அறிவு, தொழில், சேவை மூலம் லாபம் ஆகியவற்றைக் காட்டுகிறது."
          ),
          b(
            "It becomes visible in the dasha or bhukti of the connected planets, especially when transits support and practical effort is present — the yoga opens the door, work walks through it.",
            "இணைந்த கிரகங்களின் தசை அல்லது புத்தியில், குறிப்பாக கோச்சாரம் ஆதரிக்கும், நடைமுறை முயற்சி இருக்கும்போது இது வெளிப்படுகிறது — யோகம் கதவைத் திறக்கிறது, உழைப்பு அதன் வழியே நடக்கிறது."
          ),
        ],
      },
      {
        heading: b("How to know it's strong", "இது பலமானதா என அறிவது எப்படி"),
        body: [
          b(
            "Trace which house lords connect and how dignified they are. Strong, well-placed wealth lords with a healthy 2nd and 11th house make the yoga reliable. The same yoga can mean abundance for one chart and a modest, steady income for another.",
            "எந்த பாவ அதிபதிகள் இணைகின்றன, அவை எவ்வளவு நிலையுள்ளவை என்பதைக் கண்டறியுங்கள். பலமான, நல்ல இடத்தில் உள்ள செல்வ அதிபதிகள், ஆரோக்கியமான 2 மற்றும் 11-ஆம் பாவத்துடன் யோகத்தை நம்பகமாக்குகின்றன. அதே யோகம் ஒரு ஜாதகத்திற்கு செழிப்பாகவும், மற்றொன்றிற்கு மிதமான நிலையான வருமானமாகவும் இருக்கலாம்."
          ),
        ],
      },
    ],
    bringCards: [
      {
        heading: b("Earnings & Income", "சம்பாத்தியம் & வருமானம்"),
        items: [
          b("Steady, reliable earning capacity over time", "காலப்போக்கில் நிலையான, நம்பகமான சம்பாதிக்கும் திறன்"),
          b("Income from multiple sources or strong profession", "பல ஆதாரங்கள் அல்லது வலுவான தொழில் மூலம் வருமானம்"),
          b("Timely gains when dasha and effort align", "தசையும் முயற்சியும் இணையும்போது சரியான நேரத்தில் லாபம்"),
        ],
      },
      {
        heading: b("Assets & Family Wealth", "சொத்து & குடும்ப செல்வம்"),
        items: [
          b("Accumulation of property and savings over life", "வாழ்வில் சொத்து & சேமிப்பு திரட்டல்"),
          b("Shared family prosperity and stability", "பகிர்ந்த குடும்ப செழிப்பு & நிலை"),
          b("Support from patrons, partners or institutions", "புரவலர், கூட்டாளி அல்லது நிறுவனங்களின் ஆதரவு"),
        ],
      },
      {
        heading: b("Business Instinct", "வணிக உள்ளுணர்வு"),
        items: [
          b("Natural sense of financial timing and opportunity", "நிதி காலமும் வாய்ப்பும் உணரும் இயல்பான உள்ளுணர்வு"),
          b("Skill in trade, negotiation and commerce", "வணிகம், பேச்சுவார்த்தை, வர்த்தக திறன்"),
          b("Discipline to save as well as earn", "சம்பாதிப்பதோடு சேமிக்கும் ஒழுக்கம்"),
        ],
      },
    ],
    remedies: {
      heading: b("How to strengthen it", "எப்படி பலப்படுத்துவது"),
      intro: b(
        "Support the wealth lords and align effort with their periods; devotion plus financial discipline lets the yoga express more fully.",
        "செல்வ அதிபதிகளை ஆதரித்து, முயற்சியை அவற்றின் காலங்களுடன் இணையுங்கள்; பக்தியும் நிதி ஒழுக்கமும் யோகம் முழுமையாக வெளிப்பட உதவும்."
      ),
      items: [
        b("Worship Lakshmi and Kubera, especially on Fridays and Akshaya Tritiya; keep a clean prayer space for wealth.", "குறிப்பாக வெள்ளி மற்றும் அட்சய திருதியையில் லட்சுமி, குபேரரை வழிபடுங்கள்; செல்வத்திற்கு தூய்மையான வழிபாட்டு இடம் வையுங்கள்."),
        b("Time investments, new ventures and big earning moves to the dasha-bhukti of the connected wealth lords.", "முதலீடுகள், புதிய முயற்சிகள், பெரிய சம்பாத்திய நகர்வுகளை இணைந்த செல்வ அதிபதிகளின் தசை-புத்திக்கு ஏற்ப அமைக்கவும்."),
        b("Pair it with savings discipline and charity — giving is traditionally held to keep wealth flowing.", "சேமிப்பு ஒழுக்கம் மற்றும் தானத்துடன் சேருங்கள் — கொடுப்பதே செல்வத்தை ஓடவைக்கும் என்று பாரம்பரியமாகக் கருதப்படுகிறது."),
      ],
    },
    faq: [
      { q: b("Does Dhana Yogam guarantee I'll be rich?", "தன யோகம் நான் பணக்காரன் ஆவேன் என உறுதி தருமா?"), a: b("No. It gives wealth potential that must be activated by dasha and effort. A strong yoga with weak periods or no action stays unrealised; a modest yoga with discipline can still build real assets.", "இல்லை. இது தசை மற்றும் முயற்சியால் செயல்படுத்தப்பட வேண்டிய செல்வ வாய்ப்பைத் தருகிறது. பலமான யோகம் பலவீன காலங்களுடன் அல்லது செயல் இல்லாமல் நிறைவேறாமல் இருக்கும்; மிதமான யோகம் ஒழுக்கத்துடன் உண்மையான சொத்தை உருவாக்கலாம்.") },
      { q: b("When will the wealth show up?", "செல்வம் எப்போது வெளிப்படும்?"), a: b("Usually during the dasha or bhukti of the planets forming the yoga, supported by favourable transits. Outside those windows, the focus is on building skills and saving so you are ready.", "வழக்கமாக யோகத்தை உருவாக்கும் கிரகங்களின் தசை அல்லது புத்தியில், சாதகமான கோச்சாரத்தின் ஆதரவுடன். அந்த காலங்களுக்கு வெளியே, தயாராக இருக்க திறன்களை வளர்த்து சேமிப்பதில் கவனம்.") },
      { q: b("Can a chart have Dhana Yogam and still face money trouble?", "தன யோகம் இருந்தும் பண சிக்கல் வரலாமா?"), a: b("Yes, if the wealth lords are afflicted, the 2nd/11th houses are weak, or spending houses dominate. Wealth yogas describe potential and inflow; they must be read together with what drains the chart.", "ஆம் — செல்வ அதிபதிகள் பாதிக்கப்பட்டால், 2/11-ஆம் பாவம் பலவீனமாக இருந்தால், அல்லது செலவு பாவங்கள் மேலோங்கினால். செல்வ யோகங்கள் வாய்ப்பையும் வரவையும் விவரிக்கின்றன; ஜாதகத்தை வடிக்கச் செய்வதுடன் சேர்த்துப் படிக்க வேண்டும்.") },
    ],
    ctaVariant: "yogam",
    related: [
      { href: "/yogam/raja-yogam", label: b("Raja Yogam", "ராஜ யோகம்") },
      { href: "/features/chart-guidance", label: b("Chart guidance", "ஜாதக வழிகாட்டல்") },
      { href: "/tools/jadhagam-generator", label: b("Generate jadhagam", "ஜாதகம் உருவாக்கு") },
    ],
  },
  "budha-aditya-yogam": {
    slug: "budha-aditya-yogam",
    kind: "yogam",
    topic: "dosham",
    eyebrow: b("Yogam guide · Sun and Mercury", "யோக வழிகாட்டி · சூரியன் மற்றும் புதன்"),
    title: b("Budha-Aditya Yogam", "புத-ஆதித்ய யோகம்"),
    lead: b(
      "Budha-Aditya Yogam forms when Sun and Mercury join. When unafflicted and strong, it can support intelligence, speech, administration, writing, commerce, and analytical ability.",
      "சூரியன் மற்றும் புதன் சேரும்போது புத-ஆதித்ய யோகம் உருவாகும். பாதிப்பு இல்லாமல் பலமாக இருந்தால் அறிவு, பேச்சு, நிர்வாகம், எழுத்து, வணிகம், பகுப்பாய்வு திறன் ஆகியவற்றை ஆதரிக்கலாம்."
    ),
    quickFacts: [
      { label: b("Formula", "சூத்திரம்"), value: b("Sun & Mercury conjoined", "சூரியன் & புதன் இணைப்பு") },
      { label: b("Planets", "கிரகங்கள்"), value: b("Sun (Aditya) & Mercury (Budha)", "சூரியன் (ஆதித்யன்) & புதன் (புதன்)") },
      { label: b("Tends to give", "தரும்"), value: b("Intellect, speech, commerce, analysis", "அறிவு, பேச்சு, வணிகம், பகுப்பாய்வு") },
      { label: b("Watch for", "கவனிக்க"), value: b("Mercury combustion (too close to Sun)", "புதன் அஸ்தங்கம் (சூரியனுக்கு மிக அருகில்)") },
    ],
    sections: [
      {
        heading: b("What it is", "என்ன என்பது"),
        body: [
          b(
            "Budha-Aditya Yogam forms when the Sun and Mercury sit together in the same sign. The Sun gives authority and confidence, Mercury gives intellect and communication — together they sharpen the mind in whatever house they occupy.",
            "சூரியனும் புதனும் ஒரே ராசியில் சேர்ந்து அமரும்போது புத-ஆதித்ய யோகம் உருவாகிறது. சூரியன் அதிகாரத்தையும் நம்பிக்கையையும், புதன் அறிவையும் தொடர்பையும் தருகிறார் — சேர்ந்து, அவர்கள் அமரும் பாவத்தில் மனதைக் கூர்மையாக்குகிறார்கள்."
          ),
          b(
            "One caution defines its quality: because Mercury is always near the Sun, it can be combust. A Mercury too close to the Sun weakens the yoga, while a well-spaced, dignified Mercury makes it shine.",
            "ஒரு எச்சரிக்கை அதன் தரத்தை வரையறுக்கிறது: புதன் எப்போதும் சூரியனுக்கு அருகில் இருப்பதால் அஸ்தங்கம் ஆகலாம். சூரியனுக்கு மிக அருகில் உள்ள புதன் யோகத்தை பலவீனப்படுத்துகிறது; நல்ல இடைவெளியுடன், நிலையுடன் உள்ள புதன் அதை ஒளிரச் செய்கிறது."
          ),
        ],
      },
      {
        heading: b("What it can bring", "எதை கொண்டுவரலாம்"),
        body: [
          b(
            "It supports clear communication, analytical and accounting skill, writing, teaching, consulting, administration and trade. The exact field depends on the house: the 10th leans to career and authority, the 2nd to speech and finance, the 5th to scholarship.",
            "தெளிவான தொடர்பு, பகுப்பாய்வு & கணக்கு திறன், எழுத்து, கற்பித்தல், ஆலோசனை, நிர்வாகம், வணிகம் ஆகியவற்றை இது ஆதரிக்கிறது. சரியான துறை பாவத்தைப் பொறுத்தது: 10-ஆம் பாவம் தொழில் & அதிகாரம், 2-ஆம் பாவம் பேச்சு & நிதி, 5-ஆம் பாவம் கல்விப் புலமை."
          ),
          b(
            "The talent expresses most clearly during Sun, Mercury, or connected house-lord periods, when communication and decision-making come to the front of life.",
            "தொடர்பும் முடிவெடுத்தலும் வாழ்க்கையின் முன்னணிக்கு வரும் சூரியன், புதன் அல்லது தொடர்புடைய பாவ அதிபதி காலங்களில் இந்த திறன் தெளிவாக வெளிப்படுகிறது."
          ),
        ],
      },
      {
        heading: b("How to know it's strong", "இது பலமானதா என அறிவது எப்படி"),
        body: [
          b(
            "Check Mercury's distance from the Sun, its sign dignity, and the house involved. A non-combust, well-placed Mercury gives the full Budha-Aditya promise; a deeply combust Mercury leaves intellect present but underused until it is supported.",
            "புதன் சூரியனிலிருந்து உள்ள தூரம், அதன் ராசி நிலை, சம்பந்தப்பட்ட பாவம் ஆகியவற்றைப் பாருங்கள். அஸ்தங்கமாகாத, நல்ல இடத்தில் உள்ள புதன் முழு புத-ஆதித்ய பலனைத் தருகிறார்; ஆழமாக அஸ்தங்கமான புதன், ஆதரிக்கப்படும் வரை அறிவை இருக்கச் செய்தாலும் பயன்படுத்தப்படாமல் வைக்கிறார்."
          ),
        ],
      },
    ],
    bringCards: [
      {
        heading: b("Intellect & Analysis", "அறிவு & பகுப்பாய்வு"),
        items: [
          b("Sharp analytical and mathematical mind", "கூர்மையான பகுப்பாய்வு & கணக்கு மனம்"),
          b("Ability to grasp complex information quickly", "சிக்கலான தகவல்களை விரைவில் புரிந்துகொள்ளும் திறன்"),
          b("Love of learning, reading and research", "கற்றல், வாசிப்பு, ஆராய்ச்சி மீது ஆர்வம்"),
        ],
      },
      {
        heading: b("Speech & Communication", "பேச்சு & தொடர்பு"),
        items: [
          b("Articulate, persuasive expression", "தெளிவான, நம்பவைக்கும் வெளிப்பாடு"),
          b("Skill in writing, teaching or public speaking", "எழுத்து, கற்பித்தல் அல்லது பொதுப் பேச்சு திறன்"),
          b("Confidence in negotiations and commercial talk", "பேச்சுவார்த்தை & வணிக பேச்சில் நம்பிக்கை"),
        ],
      },
      {
        heading: b("Career Authority", "தொழில் அதிகாரம்"),
        items: [
          b("Recognition in knowledge-based professions", "அறிவு சார்ந்த தொழில்களில் அங்கீகாரம்"),
          b("Administrative ability and natural authority", "நிர்வாக திறன் & இயல்பான அதிகாரம்"),
          b("Confidence to lead and decide under pressure", "அழுத்தத்தில் தலைமைதாங்கும், முடிவெடுக்கும் நம்பிக்கை"),
        ],
      },
    ],
    remedies: {
      heading: b("How to strengthen it", "எப்படி பலப்படுத்துவது"),
      intro: b(
        "Support Mercury and the Sun so the yoga's intelligence finds clear expression, especially in education, speech and career.",
        "புதனையும் சூரியனையும் ஆதரியுங்கள், அப்போது யோகத்தின் அறிவு குறிப்பாக கல்வி, பேச்சு, தொழிலில் தெளிவான வெளிப்பாட்டைக் காணும்."
      ),
      items: [
        b("Honour Mercury on Wednesdays (study, green offerings, Budha mantra) and the Sun at sunrise on Sundays.", "புதன்களில் புதனை (படிப்பு, பச்சை நைவேத்யம், புத மந்திரம்), ஞாயிறுகளில் சூரிய உதயத்தில் சூரியனை மதியுங்கள்."),
        b("Visit the Budhan temple at Thiruvenkadu and the Suryanar Koil for the Sun.", "திருவெண்காடு புதன் கோயிலையும், சூரியனுக்கு சூரியனார் கோயிலையும் தரிசிக்கவும்."),
        b("Use Sun/Mercury periods for exams, writing, public speaking, negotiations and business launches.", "தேர்வு, எழுத்து, பொதுப் பேச்சு, பேச்சுவார்த்தை, வணிகத் தொடக்கங்களுக்கு சூரியன்/புதன் காலங்களைப் பயன்படுத்துங்கள்."),
      ],
    },
    faq: [
      { q: b("What is combustion and why does it matter here?", "அஸ்தங்கம் என்றால் என்ன, இங்கே ஏன் முக்கியம்?"), a: b("Combustion is when a planet sits very close to the Sun and its light is 'burnt'. Since Mercury is always near the Sun, a deeply combust Mercury can mute this yoga — so the Sun-Mercury distance is the first thing to check.", "அஸ்தங்கம் என்பது ஒரு கிரகம் சூரியனுக்கு மிக அருகில் இருந்து அதன் ஒளி 'எரிந்து' போவது. புதன் எப்போதும் சூரியனுக்கு அருகில் இருப்பதால், ஆழமாக அஸ்தங்கமான புதன் இந்த யோகத்தை மங்கச் செய்யலாம் — எனவே சூரியன்-புதன் தூரமே முதலில் பார்க்க வேண்டியது.") },
      { q: b("Which careers suit this yoga?", "இந்த யோகத்திற்கு எந்த தொழில்கள் ஏற்றவை?"), a: b("Anything mind-led: accounting, finance, writing, teaching, law, IT, consulting, administration and trade. The house the yoga sits in points to the most natural field.", "மனம் சார்ந்த எதுவும்: கணக்கு, நிதி, எழுத்து, கற்பித்தல், சட்டம், ஐடி, ஆலோசனை, நிர்வாகம், வணிகம். யோகம் அமர்ந்துள்ள பாவம் மிக இயல்பான துறையைச் சுட்டிக்காட்டுகிறது.") },
      { q: b("Can effort make up for a combust Mercury?", "அஸ்தங்க புதனை முயற்சி ஈடுசெய்யுமா?"), a: b("Largely yes. Disciplined study, communication practice and Mercury-strengthening worship help the intelligence surface even when the placement is technically weak.", "பெரும்பாலும் ஆம். ஒழுக்கமான படிப்பு, தொடர்பு பயிற்சி, புதனை பலப்படுத்தும் வழிபாடு ஆகியவை, அமைப்பு தொழில்நுட்ப ரீதியாக பலவீனமாக இருந்தாலும் அறிவு வெளிப்பட உதவுகின்றன.") },
    ],
    ctaVariant: "yogam",
    related: [
      { href: "/yogam/gaja-kesari-yogam", label: b("Gaja Kesari Yogam", "கஜகேசரி யோகம்") },
      { href: "/temples/thiruvenkadu", label: b("Thiruvenkadu Budhan temple", "திருவெண்காடு புதன் கோயில்") },
      { href: "/temples/suryanar-koil", label: b("Suryanar Koil", "சூரியனார் கோயில்") },
    ],
  },
  "neecha-bhanga-raja-yogam": {
    slug: "neecha-bhanga-raja-yogam",
    kind: "yogam",
    topic: "dosham",
    eyebrow: b("Yogam guide · weakness transformed", "யோக வழிகாட்டி · நீசம் பலமாகும்"),
    title: b("Neecha Bhanga Raja Yogam", "நீச பங்க ராஜ யோகம்"),
    lead: b(
      "Neecha Bhanga Raja Yogam occurs when a debilitated planet has cancellation support and can rise through difficulty. It often shows strength gained after pressure, delay, or correction.",
      "நீசமான கிரகத்திற்கு நீச பங்க ஆதரவு கிடைத்து சிரமத்தின் மூலம் உயர்வு தரும் போது நீச பங்க ராஜ யோகம் உருவாகும். அழுத்தம், தாமதம், திருத்தம் ஆகியவற்றுக்குப் பிறகு வரும் பலத்தை இது காட்டும்."
    ),
    quickFacts: [
      { label: b("Means", "குறிக்கிறது"), value: b("A debilitated planet's weakness cancelled", "நீச கிரகத்தின் பலவீனம் ரத்தாகிறது") },
      { label: b("Theme", "தலைப்பு"), value: b("Rise through difficulty", "சிரமத்தின் மூலம் உயர்வு") },
      { label: b("Needs", "தேவை"), value: b("A valid cancellation rule + dasha", "செல்லுபடியான ரத்து விதி + தசை") },
      { label: b("Often gives", "பெரும்பாலும் தரும்"), value: b("Early struggle, later authority", "ஆரம்ப சிரமம், பின்னர் அதிகாரம்") },
    ],
    sections: [
      {
        heading: b("What it is", "என்ன என்பது"),
        body: [
          b(
            "Neecha Bhanga Raja Yogam happens when a planet that is debilitated (in its weakest sign) receives a 'cancellation' of that weakness through specific chart support. The blocked energy is not just restored — it can turn into a source of rise.",
            "நீசமான (மிகப் பலவீன ராசியில் உள்ள) ஒரு கிரகம், குறிப்பிட்ட ஜாதக ஆதரவின் மூலம் அந்த பலவீனத்திற்கு 'ரத்து' பெறும்போது நீச பங்க ராஜ யோகம் ஏற்படுகிறது. தடைபட்ட சக்தி மீட்கப்படுவது மட்டுமல்ல — உயர்வுக்கான ஆதாரமாக மாறலாம்."
          ),
          b(
            "Classical cancellation comes from things like the debilitated planet's sign-lord being strong, its exaltation lord sitting in a kendra, or kendra support from the Lagna or Moon. The story it tells is transformation, not failure.",
            "நீச கிரகத்தின் ராசி அதிபதி பலமாக இருப்பது, அதன் உச்ச அதிபதி கேந்திரத்தில் அமர்வது, அல்லது லக்னம்/சந்திரனிலிருந்து கேந்திர ஆதரவு போன்றவற்றிலிருந்து செம்மொழி ரத்து வருகிறது. இது சொல்லும் கதை தோல்வி அல்ல, மாற்றம்."
          ),
        ],
      },
      {
        heading: b("What it can bring", "எதை கொண்டுவரலாம்"),
        body: [
          b(
            "Such natives often struggle early in the area of the debilitated planet — then, after learning its lesson, gain unusual resilience, authority or recognition there. The very weakness becomes the field of their later strength.",
            "இவர்கள் நீச கிரகத்தின் துறையில் ஆரம்பத்தில் போராடுகிறார்கள் — பின்பு அதன் பாடத்தைக் கற்ற பிறகு அங்கே அசாதாரண மன உறுதி, அதிகாரம், அங்கீகாரம் பெறுகிறார்கள். அந்த பலவீனமே அவர்களின் பிற்கால பலத்தின் களமாகிறது."
          ),
          b(
            "The 'raja' (royal) result is not automatic. It needs the cancellation to be genuine and the planet to gain enough strength, and it surfaces mainly in that planet's dasha.",
            "'ராஜ' (அரச) பலன் தானாக வராது. ரத்து உண்மையாக இருக்க வேண்டும், கிரகம் போதிய பலம் பெற வேண்டும்; அது முக்கியமாக அந்த கிரகத்தின் தசையில் வெளிப்படுகிறது."
          ),
        ],
      },
      {
        heading: b("How to know it's strong", "இது பலமானதா என அறிவது எப்படி"),
        body: [
          b(
            "Not every debilitation cancellation becomes a Raja Yoga. Confirm the cancellation rule actually applies, then check house ownership, dasha timing, aspects and divisional-chart support — these decide whether it is a life-defining rise or a quiet recovery.",
            "ஒவ்வொரு நீச ரத்தும் ராஜ யோகம் ஆகாது. ரத்து விதி உண்மையில் பொருந்துகிறதா என உறுதி செய்து, பின்பு பாவ அதிபத்தியம், தசை காலம், பார்வை, வர்க்க ஆதரவு ஆகியவற்றைப் பாருங்கள் — இவையே இது வாழ்க்கையை வரையறுக்கும் உயர்வா அல்லது அமைதியான மீட்சியா என்பதைத் தீர்மானிக்கின்றன."
          ),
        ],
      },
    ],
    bringCards: [
      {
        heading: b("Resilience & Recovery", "மன உறுதி & மீட்சி"),
        items: [
          b("Unusual capacity to bounce back from difficulty", "சிரமத்திலிருந்து மீளும் அசாதாரண திறன்"),
          b("Turning weakness into a zone of strength", "பலவீனத்தை பலத்தின் களமாக மாற்றுதல்"),
          b("Hard-won wisdom that becomes a life asset", "கடினமாக ஈட்டிய ஞானம் வாழ்க்கை சொத்தாகிறது"),
        ],
      },
      {
        heading: b("Status Rise", "அந்தஸ்து உயர்வு"),
        items: [
          b("Rise in the area where life once blocked progress", "வாழ்க்கை ஒருகாலத்தில் தடுத்த இடத்தில் உயர்வு"),
          b("Authority earned through experience, not ease", "எளிமை அல்ல, அனுபவம் மூலம் ஈட்டிய அதிகாரம்"),
          b("Recognition that arrives after effort is proven", "முயற்சி நிரூபிக்கப்பட்ட பிறகு வரும் அங்கீகாரம்"),
        ],
      },
      {
        heading: b("Life Transformation", "வாழ்க்கை மாற்றம்"),
        items: [
          b("Marked improvement in life area after the lesson", "பாடத்திற்குப் பிறகு வாழ்க்கைத் துறையில் குறிப்பிடத்தக்க முன்னேற்றம்"),
          b("Deeper character built through difficulty", "சிரமம் மூலம் ஆழமான குணம் உருவாகிறது"),
          b("Late-blooming success that proves more lasting", "தாமதமாக பூக்கும் வெற்றி நிலையானதாக நிரூபிக்கும்"),
        ],
      },
    ],
    remedies: {
      heading: b("How to work with it", "இதனுடன் எப்படி செயல்படுவது"),
      intro: b(
        "This yoga rewards patience in the weak planet's area. Support that planet and persist through the early lesson rather than avoiding it.",
        "இந்த யோகம் பலவீன கிரகத்தின் துறையில் பொறுமைக்கு வெகுமதி அளிக்கிறது. அந்த கிரகத்தை ஆதரித்து, ஆரம்ப பாடத்தைத் தவிர்க்காமல் தொடர்ந்து முயலுங்கள்."
      ),
      items: [
        b("Identify the debilitated planet and strengthen it through its weekday worship, mantra and offerings.", "நீச கிரகத்தைக் கண்டறிந்து, அதன் வார நாள் வழிபாடு, மந்திரம், நைவேத்யம் மூலம் பலப்படுத்துங்கள்."),
        b("Treat early struggles in that area as training, not as failure — the rise is designed to come after them.", "அந்த துறையில் ஆரம்ப சிரமங்களை தோல்வியாக அல்ல, பயிற்சியாகக் கொள்ளுங்கள் — உயர்வு அவற்றுக்குப் பின் வரும்படி அமைந்துள்ளது."),
        b("Plan major moves in that planet's dasha, when the cancelled strength expresses most fully.", "ரத்தான பலம் முழுமையாக வெளிப்படும் அந்த கிரகத்தின் தசையில் முக்கிய நகர்வுகளைத் திட்டமிடுங்கள்."),
      ],
    },
    faq: [
      { q: b("Is a debilitated planet always bad?", "நீச கிரகம் எப்போதும் கெட்டதா?"), a: b("No. With a valid Neecha Bhanga, a debilitated planet can become a major strength. Debilitation is a starting difficulty that the right chart support turns into resilience and rise.", "இல்லை. செல்லுபடியான நீச பங்கத்துடன், நீச கிரகம் பெரிய பலமாக மாறலாம். நீசம் என்பது சரியான ஜாதக ஆதரவு மன உறுதியாகவும் உயர்வாகவும் மாற்றும் தொடக்க சிரமம்.") },
      { q: b("How do I know if my chart truly has it?", "என் ஜாதகத்தில் இது உண்மையில் உள்ளதா எப்படி அறிவது?"), a: b("A specific cancellation rule must be satisfied — not just a debilitated planet present. The dispositor's strength, exaltation lord's position and kendra support are checked together before confirming it.", "ஒரு குறிப்பிட்ட ரத்து விதி பூர்த்தியாக வேண்டும் — வெறும் நீச கிரகம் இருப்பது போதாது. ராசி அதிபதியின் பலம், உச்ச அதிபதியின் இடம், கேந்திர ஆதரவு ஆகியவை சேர்த்து பார்க்கப்பட்டே உறுதி செய்யப்படுகிறது.") },
      { q: b("When do the good results begin?", "நல்ல பலன்கள் எப்போது தொடங்கும்?"), a: b("Usually after the early struggles tied to that planet are worked through, and most strongly during its dasha. The pattern is 'difficulty first, authority later'.", "வழக்கமாக அந்த கிரகத்துடன் தொடர்புடைய ஆரம்ப சிரமங்கள் கடந்த பிறகு, மிக வலுவாக அதன் தசையில். அமைப்பு 'முதலில் சிரமம், பின்னர் அதிகாரம்'.") },
    ],
    ctaVariant: "yogam",
    related: [
      { href: "/yogam/raja-yogam", label: b("Raja Yogam", "ராஜ யோகம்") },
      { href: "/yogam/dhana-yogam", label: b("Dhana Yogam", "தன யோகம்") },
      { href: "/features/chart-guidance", label: b("Chart guidance", "ஜாதக வழிகாட்டல்") },
    ],
  },
  "raja-yogam": {
    slug: "raja-yogam",
    kind: "yogam",
    topic: "dosham",
    eyebrow: b("Yogam guide · power and rise", "யோக வழிகாட்டி · உயர்வு மற்றும் அதிகாரம்"),
    title: b("Raja Yogam", "ராஜ யோகம்"),
    lead: b(
      "Raja Yogam is formed by strong links between kendra and trikona houses, especially the 1st, 4th, 5th, 7th, 9th, and 10th lords. It can support rise, leadership, recognition, and influence.",
      "கேந்திரம் மற்றும் திரிகோண பாவங்களின் வலுவான இணைப்பால், குறிப்பாக 1, 4, 5, 7, 9, 10-ஆம் பாவ அதிபதிகளால் ராஜ யோகம் உருவாகும். உயர்வு, தலைமை, அங்கீகாரம், செல்வாக்கு ஆகியவற்றை ஆதரிக்கலாம்."
    ),
    quickFacts: [
      { label: b("Formula", "சூத்திரம்"), value: b("Kendra lord linked with trikona lord", "கேந்திர அதிபதி + திரிகோண அதிபதி இணைப்பு") },
      { label: b("Key houses", "முக்கிய பாவங்கள்"), value: b("1, 4, 5, 7, 9, 10", "1, 4, 5, 7, 9, 10") },
      { label: b("Tends to give", "தரும்"), value: b("Rise, status, leadership, influence", "உயர்வு, அந்தஸ்து, தலைமை, செல்வாக்கு") },
      { label: b("Strongest in", "வலுப்பெறும்"), value: b("Dasha of the yoga planets", "யோக கிரகங்களின் தசை") },
    ],
    sections: [
      {
        heading: b("What it is", "என்ன என்பது"),
        body: [
          b(
            "Raja Yogam is the classic 'rise to power' combination. It forms when a lord of a kendra (1, 4, 7, 10 — action and visibility) links with a lord of a trikona (1, 5, 9 — fortune and grace) by conjunction, aspect, exchange or mutual strength.",
            "ராஜ யோகம் என்பது செம்மொழி 'அதிகாரத்திற்கு உயர்தல்' சேர்க்கை. ஒரு கேந்திர அதிபதி (1, 4, 7, 10 — செயல் & வெளிப்பாடு), ஒரு திரிகோண அதிபதியுடன் (1, 5, 9 — பாக்கியம் & அருள்) சேர்க்கை, பார்வை, பரிவர்த்தனை அல்லது பரஸ்பர பலம் மூலம் இணையும்போது உருவாகிறது."
          ),
          b(
            "When effort and fortune are wired together like this, life tends to lift the person into roles of responsibility and respect — provided the planets involved are strong.",
            "முயற்சியும் பாக்கியமும் இப்படி இணைக்கப்படும்போது, சம்பந்தப்பட்ட கிரகங்கள் பலமாக இருந்தால், வாழ்க்கை அந்நபரை பொறுப்பு மற்றும் மரியாதையின் இடங்களுக்கு உயர்த்துகிறது."
          ),
        ],
      },
      {
        heading: b("What it can bring", "எதை கொண்டுவரலாம்"),
        body: [
          b(
            "Depending on the planets and houses involved, it can show as career rise, social status, higher education, land and property, a public role, respected partnerships, or authority within an institution.",
            "சம்பந்தப்பட்ட கிரகங்கள் மற்றும் பாவங்களைப் பொறுத்து, தொழில் உயர்வு, சமூக அந்தஸ்து, உயர் கல்வி, நிலம் & சொத்து, பொதுப் பங்கு, மதிப்புள்ள கூட்டாண்மை, அல்லது ஒரு நிறுவனத்தில் அதிகாரம் ஆகியவையாக வெளிப்படலாம்."
          ),
          b(
            "The yoga is felt most strongly in the dasha and bhukti of its planets — those are the windows when promotions, recognition and expanded responsibility tend to arrive.",
            "யோகம் அதன் கிரகங்களின் தசை மற்றும் புத்தியில் மிக வலுவாக உணரப்படுகிறது — பதவி உயர்வு, அங்கீகாரம், விரிவான பொறுப்பு வரும் காலங்கள் அவையே."
          ),
        ],
      },
      {
        heading: b("How to know it's strong", "இது பலமானதா என அறிவது எப்படி"),
        body: [
          b(
            "Check whether the yoga-forming lords are dignified and well-placed, and whether the 10th house and divisional charts support them. Strong, clean planets give a defining rise; weak or afflicted ones give a moderate, hard-earned version of the same.",
            "யோகம் உருவாக்கும் அதிபதிகள் நிலையுள்ளவையா, நல்ல இடத்தில் உள்ளனவா, 10-ஆம் பாவமும் வர்க்க ஜாதகங்களும் அவற்றை ஆதரிக்கின்றனவா எனப் பாருங்கள். பலமான தூய கிரகங்கள் வரையறுக்கும் உயர்வைத் தருகின்றன; பலவீன அல்லது பாதிக்கப்பட்டவை அதே உயர்வின் மிதமான, கடினமாக ஈட்டப்பட்ட வடிவத்தைத் தருகின்றன."
          ),
        ],
      },
    ],
    bringCards: [
      {
        heading: b("Power & Leadership", "அதிகாரம் & தலைமை"),
        items: [
          b("Natural ability to lead, direct and command", "தலைமை தாங்க, வழிகாட்ட, கட்டளையிட இயல்பான திறன்"),
          b("Responsibility for others comes naturally", "மற்றவர்களுக்கான பொறுப்பு இயல்பாக வருகிறது"),
          b("Institutional and professional authority", "நிறுவன மற்றும் தொழில்முறை அதிகாரம்"),
        ],
      },
      {
        heading: b("Status & Prestige", "அந்தஸ்து & மதிப்பு"),
        items: [
          b("Social recognition, honours and public standing", "சமூக அங்கீகாரம், கௌரவம், பொது அந்தஸ்து"),
          b("Rise to positions of respect and influence", "மரியாதை & செல்வாக்கு பதவிகளுக்கு உயர்வு"),
          b("Career milestones that define the biography", "வரலாற்றை வரையறுக்கும் தொழில் முக்கிய கட்டங்கள்"),
        ],
      },
      {
        heading: b("Fortune & Grace", "பாக்கியம் & அருள்"),
        items: [
          b("Luck and grace support effort at key moments", "முக்கிய தருணங்களில் அதிர்ஷ்டம் & அருள் முயற்சியை ஆதரிக்கிறது"),
          b("Right people and opportunities arrive at right time", "சரியான நேரத்தில் சரியான நபர்களும் வாய்ப்புகளும் வருகின்றன"),
          b("Blessings tied to dharmic conduct are self-renewing", "தர்ம நடத்தையுடன் தொடர்புடைய ஆசீர்வாதங்கள் தாமே புதுப்பிக்கப்படுகின்றன"),
        ],
      },
    ],
    remedies: {
      heading: b("How to strengthen it", "எப்படி பலப்படுத்துவது"),
      intro: b(
        "Support the yoga-forming planets and align ambition with their periods so the rise expresses cleanly and ethically.",
        "யோகம் உருவாக்கும் கிரகங்களை ஆதரித்து, லட்சியத்தை அவற்றின் காலங்களுடன் இணையுங்கள், அப்போது உயர்வு தூய்மையாகவும் நேர்மையாகவும் வெளிப்படும்."
      ),
      items: [
        b("Identify the kendra and trikona lords forming the yoga and honour them through their weekday worship.", "யோகத்தை உருவாக்கும் கேந்திர & திரிகோண அதிபதிகளைக் கண்டறிந்து, அவற்றின் வார நாள் வழிபாட்டின் மூலம் மதியுங்கள்."),
        b("Use their dasha-bhukti for career moves, applications, and stepping into leadership roles.", "தொழில் நகர்வுகள், விண்ணப்பங்கள், தலைமைப் பொறுப்புகளுக்கு அவற்றின் தசை-புத்தியைப் பயன்படுத்துங்கள்."),
        b("Keep conduct dharmic — Raja Yoga results sustain when authority is used with integrity and service.", "நடத்தையை தர்மமாக வையுங்கள் — அதிகாரம் நேர்மையுடனும் சேவையுடனும் பயன்படுத்தப்படும்போது ராஜ யோக பலன்கள் நிலைக்கின்றன."),
      ],
    },
    faq: [
      { q: b("Does every Raja Yoga make someone a king or CEO?", "ஒவ்வொரு ராஜ யோகமும் ஒருவரை அரசன் அல்லது தலைவராக்குமா?"), a: b("No. The scale matches the strength of the planets and houses. A powerful Raja Yoga can give high office; a modest one may give a respected position in a smaller sphere. The pattern is rise, not a fixed title.", "இல்லை. அளவு கிரகங்கள் மற்றும் பாவங்களின் பலத்திற்கு ஏற்பவே. சக்திவாய்ந்த ராஜ யோகம் உயர் பதவியைத் தரலாம்; மிதமானது சிறிய துறையில் மதிப்புள்ள இடத்தைத் தரலாம். அமைப்பு உயர்வு; நிலையான பட்டம் அல்ல.") },
      { q: b("Can a chart have many Raja Yogas?", "ஒரு ஜாதகத்தில் பல ராஜ யோகங்கள் இருக்கலாமா?"), a: b("Yes, and several supporting each other strengthen the overall promise. But quality matters more than quantity — a few strong, clean yogas outperform many weak ones.", "ஆம், ஒன்றுக்கொன்று ஆதரவான பல யோகங்கள் ஒட்டுமொத்த பலனை வலுப்படுத்துகின்றன. ஆனால் எண்ணிக்கையை விட தரம் முக்கியம் — சில பலமான தூய யோகங்கள் பல பலவீனவற்றை விட சிறப்பாகச் செயல்படுகின்றன.") },
      { q: b("Why hasn't my Raja Yoga 'worked' yet?", "என் ராஜ யோகம் ஏன் இன்னும் 'வேலை' செய்யவில்லை?"), a: b("Most often the dasha of its planets has not yet run, or the planets need strengthening. Raja Yogas are timing-dependent — preparation now lets you seize the period when it opens.", "பெரும்பாலும் அதன் கிரகங்களின் தசை இன்னும் நடக்கவில்லை, அல்லது கிரகங்களுக்கு பலப்படுத்தல் தேவை. ராஜ யோகங்கள் காலத்தைச் சார்ந்தவை — இப்போதைய தயாரிப்பு, காலம் திறக்கும்போது அதைப் பற்ற உதவும்.") },
    ],
    ctaVariant: "yogam",
    related: [
      { href: "/yogam/neecha-bhanga-raja-yogam", label: b("Neecha Bhanga Raja Yogam", "நீச பங்க ராஜ யோகம்") },
      { href: "/yogam/dhana-yogam", label: b("Dhana Yogam", "தன யோகம்") },
      { href: "/tools/jadhagam-generator", label: b("Generate jadhagam", "ஜாதகம் உருவாக்கு") },
    ],
  },
};

export const TEMPLE_DETAILS: Record<string, GuideDetail> = {
  "suryanar-koil": {
    slug: "suryanar-koil",
    kind: "temple",
    topic: "temple",
    eyebrow: b("Temple guide · Sun", "கோயில் வழிகாட்டி · சூரியன்"),
    title: b("Suryanar Koil", "சூரியனார் கோயில்"),
    lead: b(
      "Suryanar Koil is the Navagraha sthalam associated with Surya. Devotees seek clarity, vitality, authority, father-related blessings, and relief from Sun afflictions.",
      "சூரியனார் கோயில் சூரியனுக்குரிய நவகிரக ஸ்தலம். தெளிவு, ஆரோக்கிய ஒளி, அதிகாரம், தந்தை தொடர்பான ஆசீர்வாதம், சூரிய பாதிப்பு நிவாரணம் ஆகியவற்றுக்காக பக்தர்கள் தரிசிக்கின்றனர்."
    ),
    quickFacts: [
      { label: b("Graha / deity", "கிரகம் / தெய்வம்"), value: b("Surya (the Sun)", "சூரியன்") },
      { label: b("Sthalam", "ஸ்தலம்"), value: b("Navagraha temple for Surya", "சூரியனுக்குரிய நவகிரக கோயில்") },
      { label: b("Best time", "சிறந்த நேரம்"), value: b("Sunday, at sunrise", "ஞாயிறு, சூரிய உதயம்") },
      { label: b("Visit for", "எதற்காக"), value: b("Confidence, health, authority, father", "நம்பிக்கை, ஆரோக்கியம், அதிகாரம், தந்தை") },
    ],
    sections: [
      {
        heading: b("What it is", "என்ன என்பது"),
        body: [
          b("Suryanar Koil is the Navagraha sthalam dedicated to Surya, the Sun. The Sun is the soul of the chart — it stands for light, confidence, authority, the father, eyesight, vitality and the sense of direction in life.", "சூரியனார் கோயில் சூரியனுக்குரிய நவகிரக ஸ்தலம். சூரியன் ஜாதகத்தின் ஆன்மா — ஒளி, நம்பிக்கை, அதிகாரம், தந்தை, கண், உயிர்சக்தி, வாழ்க்கைத் திசை உணர்வு ஆகியவற்றைக் குறிக்கிறார்."),
        ],
      },
      {
        heading: b("What it brings", "என்ன அருளும்"),
        body: [
          b("Devotees pray here for steady health and vitality, the confidence to lead, clarity of purpose, relief from a weak or afflicted Sun, and the blessings tied to the father and the 9th house of fortune.", "நிலையான ஆரோக்கியம், உயிர்சக்தி, தலைமை தரும் நம்பிக்கை, நோக்கத் தெளிவு, பலவீன அல்லது பாதிக்கப்பட்ட சூரியன் நிவாரணம், தந்தை மற்றும் பாக்கியம் தரும் 9-ஆம் பாவம் சார்ந்த ஆசீர்வாதம் ஆகியவற்றுக்காக பக்தர்கள் இங்கு பிரார்த்திக்கின்றனர்."),
        ],
      },
      {
        heading: b("Who should visit", "யார் தரிசிக்க வேண்டும்"),
        body: [
          b("A visit is often considered when the Sun is weak, combust, afflicted or running its dasha, when confidence or recognition is low, when there is strain with the father, or for eyesight and heart-related health prayers.", "சூரியன் பலவீனமாக, அஸ்தங்கமாக, பாதிப்புடன் அல்லது தசையில் செயல்படும்போது, நம்பிக்கை அல்லது அங்கீகாரம் குறையும்போது, தந்தையுடன் சிக்கல் இருக்கும்போது, அல்லது கண் & இதயம் சார்ந்த ஆரோக்கிய பிரார்த்தனைகளுக்காக தரிசனம் கருதப்படுகிறது."),
        ],
      },
    ],
    remedies: {
      heading: b("How to worship & plan a visit", "வழிபாடு & தரிசன திட்டம்"),
      intro: b("Sun worship is simple and disciplined; consistency at sunrise matters more than elaborate ritual.", "சூரிய வழிபாடு எளிமையும் ஒழுக்கமும் கொண்டது; விரிவான சடங்கை விட சூரிய உதயத்தில் தொடர்ச்சி முக்கியம்."),
      items: [
        b("Worship on Sundays at sunrise; offer arghyam (water) to the Sun and recite the Surya mantra or Aditya Hridayam.", "ஞாயிறுகளில் சூரிய உதயத்தில் வழிபடுங்கள்; சூரியனுக்கு அர்க்யம் (நீர்) அளித்து, சூரிய மந்திரம் அல்லது ஆதித்ய ஹ்ருதயம் ஓதுங்கள்."),
        b("Keep a disciplined morning routine — early rising itself is a Surya remedy.", "ஒழுக்கமான காலை வழக்கத்தை வையுங்கள் — அதிகாலையில் எழுவதே ஒரு சூரிய பரிகாரம்."),
        b("Check the day's panchangam and avoid fixing the visit purely in a stressful tithi; favour bright, clear mornings.", "நாளின் பஞ்சாங்கத்தைப் பாருங்கள்; அழுத்தமான திதியில் மட்டும் தரிசனத்தை அமைக்க வேண்டாம்; ஒளியான தெளிவான காலைகளை விரும்புங்கள்."),
      ],
    },
    slokam: {
      label: b("Surya Beeja Mantra", "சூரிய பீஜ மந்திரம்"),
      text: b("Om Hraam Hreem Hraum Sah Suryaya Namah", "ஓம் ஹ்ராம் ஹ்ரீம் ஹ்ரௌம் சஹ சூர்யாய நமஹ"),
      meaning: b(
        "Salutation to Surya, the radiant lord of light, vitality and life's direction. Recited at sunrise facing east.",
        "ஒளி, உயிர்சக்தி, வாழ்க்கைத் திசையின் ஒளிர்வுள்ள சூர்யனுக்கு வணக்கம். சூரிய உதயத்தில் கிழக்கு நோக்கி ஓதப்படுகிறது."
      ),
    },
    faq: [
      { q: b("Who should pray at Suryanar Koil?", "சூரியனார் கோயிலில் யார் பிரார்த்திக்க வேண்டும்?"), a: b("Those with a weak or afflicted Sun, low confidence, recognition or career concerns, strain with the father, or related health matters often visit. It is also part of a full Navagraha pilgrimage.", "பலவீன அல்லது பாதிக்கப்பட்ட சூரியன், குறைந்த நம்பிக்கை, அங்கீகாரம் அல்லது தொழில் கவலை, தந்தையுடன் சிக்கல், அல்லது சம்பந்தப்பட்ட ஆரோக்கிய விஷயங்கள் உள்ளவர்கள் தரிசிக்கின்றனர். முழு நவகிரக யாத்திரையின் ஒரு பகுதியும் ஆகும்.") },
      { q: b("What is the best day and time?", "சிறந்த நாள் மற்றும் நேரம் எது?"), a: b("Sunday at sunrise is traditional for Sun worship. For a personal visit, a clear panchangam day suited to your chart refines the timing.", "சூரிய வழிபாட்டுக்கு ஞாயிறு சூரிய உதயம் பாரம்பரியம். தனிப்பட்ட தரிசனத்திற்கு, உங்கள் ஜாதகத்திற்கு ஏற்ற தெளிவான பஞ்சாங்க நாள் நேரத்தை நுணுக்கமாக்கும்.") },
      { q: b("Does a temple visit replace medical care?", "கோயில் தரிசனம் மருத்துவத்திற்கு மாற்றா?"), a: b("No. Worship supports calmness and confidence during treatment, but health concerns always need a qualified doctor. Use devotion alongside medicine, never instead of it.", "இல்லை. வழிபாடு சிகிச்சையின்போது அமைதியையும் நம்பிக்கையையும் ஆதரிக்கிறது; ஆனால் ஆரோக்கிய விஷயங்களுக்கு எப்போதும் தகுதியான மருத்துவர் தேவை. பக்தியை மருந்துடன் சேர்த்துப் பயன்படுத்துங்கள்; மாற்றாக அல்ல.") },
    ],
    ctaVariant: "temple",
    related: [
      { href: "/yogam/budha-aditya-yogam", label: b("Budha-Aditya Yogam", "புத-ஆதித்ய யோகம்") },
      { href: "/temples", label: b("Navagraha temples", "நவகிரக கோயில்கள்") },
      { href: "/tools/daily-panchangam-planner", label: b("Panchangam planner", "பஞ்சாங்க திட்டம்") },
    ],
  },
  thingalur: {
    slug: "thingalur",
    kind: "temple",
    topic: "temple",
    eyebrow: b("Temple guide · Moon", "கோயில் வழிகாட்டி · சந்திரன்"),
    title: b("Thingalur Chandran Temple", "திங்களூர் சந்திரன் கோயில்"),
    lead: b(
      "Thingalur is associated with Chandran, the Moon. Devotees seek calmness of mind, emotional steadiness, mother-related blessings, and relief during Moon-related stress.",
      "திங்களூர் சந்திரனுக்குரிய ஸ்தலம். மன அமைதி, உணர்ச்சி சமநிலை, தாய் தொடர்பான ஆசீர்வாதம், சந்திர பாதிப்பு நிவாரணம் ஆகியவற்றுக்காக பக்தர்கள் தரிசிக்கின்றனர்."
    ),
    quickFacts: [
      { label: b("Graha / deity", "கிரகம் / தெய்வம்"), value: b("Chandran (the Moon)", "சந்திரன்") },
      { label: b("Sthalam", "ஸ்தலம்"), value: b("Navagraha temple for the Moon", "சந்திரனுக்குரிய நவகிரக கோயில்") },
      { label: b("Best time", "சிறந்த நேரம்"), value: b("Monday", "திங்கள்") },
      { label: b("Visit for", "எதற்காக"), value: b("Calm mind, emotions, mother, sleep", "மன அமைதி, உணர்ச்சி, தாய், தூக்கம்") },
    ],
    sections: [
      {
        heading: b("What it is", "என்ன என்பது"),
        body: [
          b("Thingalur is the Navagraha sthalam for Chandran, the Moon. The Moon rules the mind, memory, mother, nourishment, sleep and emotional flow — and in Tamil astrology the Moon-sign (rasi) is central to dasha, transits and daily guidance.", "திங்களூர் சந்திரனுக்குரிய நவகிரக ஸ்தலம். சந்திரன் மனம், நினைவு, தாய், பராமரிப்பு, தூக்கம், உணர்ச்சி ஓட்டம் ஆகியவற்றை ஆளுகிறார் — தமிழ் ஜோதிடத்தில் சந்திர ராசி தசை, கோச்சாரம், தினசரி வழிகாட்டலுக்கு மையமானது."),
        ],
      },
      {
        heading: b("What it brings", "என்ன அருளும்"),
        body: [
          b("Worship here is for calmness of mind, emotional steadiness, restful sleep, mother-related blessings, and relief during phases when the Moon feels pressured — including Chandrashtama days.", "மன அமைதி, உணர்ச்சி சமநிலை, நிம்மதியான தூக்கம், தாய் தொடர்பான ஆசீர்வாதம், சந்திரன் அழுத்தத்தில் உள்ள காலங்களில் — சந்திராஷ்டம நாட்கள் உட்பட — நிவாரணம் ஆகியவற்றுக்காக இங்கு வழிபடப்படுகிறது."),
        ],
      },
      {
        heading: b("Who should visit", "யார் தரிசிக்க வேண்டும்"),
        body: [
          b("Often visited when the Moon is weak or under pressure from Saturn, Rahu, Ketu or Mars, during anxiety, sleeplessness or mood swings, for the mother's wellbeing, or while running a difficult Moon period.", "சந்திரன் பலவீனமாக அல்லது சனி, ராகு, கேது, செவ்வாய் அழுத்தத்தில் இருக்கும்போது, கவலை, தூக்கமின்மை அல்லது மனநிலை ஏற்ற-இறக்கங்களின்போது, தாயின் நலனுக்காக, அல்லது கடினமான சந்திர காலத்தை நடத்தும்போது அடிக்கடி தரிசிக்கப்படுகிறது."),
        ],
      },
    ],
    remedies: {
      heading: b("How to worship & plan a visit", "வழிபாடு & தரிசன திட்டம்"),
      intro: b("Moon worship is gentle and calming; a quiet, unhurried prayer suits this deity best.", "சந்திர வழிபாடு மென்மையும் அமைதியும் கொண்டது; அமைதியான, அவசரமற்ற பிரார்த்தனையே இத்தெய்வத்திற்கு ஏற்றது."),
      items: [
        b("Worship on Mondays with white offerings (rice, milk) and the Chandra mantra.", "திங்கள்களில் வெள்ளை நைவேத்யம் (அரிசி, பால்) மற்றும் சந்திர மந்திரத்துடன் வழிபடுங்கள்."),
        b("For a personal visit, check the tithi, nakshathiram and your Chandrashtama status that day.", "தனிப்பட்ட தரிசனத்திற்கு, அன்றைய திதி, நட்சத்திரம், உங்கள் சந்திராஷ்டம நிலை ஆகியவற்றைப் பாருங்கள்."),
        b("Support the Moon in daily life too — steady sleep, calm routines and time near water.", "தினசரி வாழ்விலும் சந்திரனை ஆதரியுங்கள் — நிலையான தூக்கம், அமைதியான வழக்கங்கள், நீர் அருகே நேரம்."),
      ],
    },
    slokam: {
      label: b("Chandra Beeja Mantra", "சந்திர பீஜ மந்திரம்"),
      text: b("Om Sraam Sreem Sraum Sah Chandraaya Namah", "ஓம் ஸ்ராம் ஸ்ரீம் ஸ்ரௌம் சஹ சந்திராய நமஹ"),
      meaning: b(
        "Salutation to Chandra, who bestows calmness, nourishment and emotional peace. Recited on Mondays or during Chandrashtama.",
        "அமைதி, பராமரிப்பு, உணர்ச்சி சமாதானம் அருளும் சந்திரனுக்கு வணக்கம். திங்கள்களில் அல்லது சந்திராஷ்டம காலத்தில் ஓதப்படுகிறது."
      ),
    },
    faq: [
      { q: b("What is Chandrashtama and is it linked here?", "சந்திராஷ்டமம் என்றால் என்ன, இங்கே தொடர்பா?"), a: b("Chandrashtama is the period when the Moon transits the 8th from your birth Moon-sign, often felt as restlessness. Many devotees pray at Thingalur to steady the mind through such phases.", "சந்திராஷ்டமம் என்பது உங்கள் ஜனன ராசியிலிருந்து 8-ஆம் இடத்தில் சந்திரன் கோச்சாரம் செய்யும் காலம், பெரும்பாலும் அமைதியின்மையாக உணரப்படும். இதுபோன்ற காலங்களில் மனதை அமைதிப்படுத்த பலர் திங்களூரில் பிரார்த்திக்கின்றனர்.") },
      { q: b("Can it help with anxiety and sleep?", "கவலை மற்றும் தூக்கத்திற்கு உதவுமா?"), a: b("Moon worship is traditionally for emotional steadiness and restful sleep, and many find it calming. For persistent anxiety or insomnia, pair devotion with proper medical or counselling support.", "சந்திர வழிபாடு பாரம்பரியமாக உணர்ச்சி சமநிலை மற்றும் நிம்மதியான தூக்கத்திற்கானது; பலருக்கு அமைதி தருகிறது. தொடர்ந்த கவலை அல்லது தூக்கமின்மைக்கு, பக்தியை முறையான மருத்துவ அல்லது ஆலோசனை ஆதரவுடன் சேருங்கள்.") },
      { q: b("Which day is best to visit?", "தரிசிக்க சிறந்த நாள் எது?"), a: b("Monday is the Moon's day. Beyond that, a tithi and nakshathiram favourable to your chart, avoiding a personal Chandrashtama day for major prayers, refines the visit.", "திங்கள் சந்திரனின் நாள். அதையும் தாண்டி, உங்கள் ஜாதகத்திற்கு சாதகமான திதி & நட்சத்திரம், முக்கிய பிரார்த்தனைகளுக்கு தனிப்பட்ட சந்திராஷ்டம நாளைத் தவிர்ப்பது தரிசனத்தை நுணுக்கமாக்கும்.") },
    ],
    ctaVariant: "temple",
    related: [
      { href: "/learn/what-is-chandrashtama", label: b("Chandrashtama guide", "சந்திராஷ்டம வழிகாட்டி") },
      { href: "/tools/daily-panchangam-planner", label: b("Daily panchangam", "தின பஞ்சாங்கம்") },
      { href: "/temples", label: b("Temples", "கோயில்கள்") },
    ],
  },
  "vaitheeswaran-koil": {
    slug: "vaitheeswaran-koil",
    kind: "temple",
    topic: "temple",
    eyebrow: b("Temple guide · Mars", "கோயில் வழிகாட்டி · செவ்வாய்"),
    title: b("Vaitheeswaran Koil", "வைத்தீஸ்வரன் கோயில்"),
    lead: b(
      "Vaitheeswaran Koil is associated with healing and Angaraka / Sevvai. It is traditionally visited for health, courage, surgery-related concerns, and Sevvai dosham pariharam.",
      "வைத்தீஸ்வரன் கோயில் வைத்தியம் மற்றும் அங்காரகன் / செவ்வாயுடன் தொடர்புடையது. ஆரோக்கியம், தைரியம், அறுவை சிகிச்சை தொடர்பான கவலை, செவ்வாய் தோஷ பரிகாரம் ஆகியவற்றுக்காக தரிசிக்கப்படுகிறது."
    ),
    quickFacts: [
      { label: b("Graha / deity", "கிரகம் / தெய்வம்"), value: b("Sevvai (Mars); Shiva as Vaidyanatha", "செவ்வாய்; சிவன் வைத்தியநாதர்") },
      { label: b("Known for", "புகழ்"), value: b("Healing & Mars-related prayers", "வைத்தியம் & செவ்வாய் பிரார்த்தனை") },
      { label: b("Best time", "சிறந்த நேரம்"), value: b("Tuesday", "செவ்வாய் கிழமை") },
      { label: b("Visit for", "எதற்காக"), value: b("Health, courage, Sevvai dosham relief", "ஆரோக்கியம், தைரியம், செவ்வாய் தோஷ நிவாரணம்") },
    ],
    sections: [
      {
        heading: b("What it is", "என்ன என்பது"),
        body: [
          b("Vaitheeswaran Koil is the famed healing temple where Lord Shiva is worshipped as Vaidyanatha, the divine physician. It is closely tied to Angaraka (Sevvai/Mars), who governs blood, heat, courage, siblings, land and decisive action.", "வைத்தீஸ்வரன் கோயில் சிவபெருமான் வைத்தியநாதராக — தெய்வ வைத்தியராக — வழிபடப்படும் புகழ்பெற்ற வைத்திய ஸ்தலம். இது இரத்தம், வெப்பம், தைரியம், சகோதரர், நிலம், முடிவான செயல் ஆகியவற்றை ஆளும் அங்காரகன் (செவ்வாய்) உடன் நெருக்கமாக இணைந்தது."),
        ],
      },
      {
        heading: b("What it brings", "என்ன அருளும்"),
        body: [
          b("Devotees come for healing and good health, courage and steadiness, relief from Sevvai dosham, and calm before surgery or recovery. The sacred ash (thiruchandhu) here is traditionally taken as a blessing for wellbeing.", "வைத்தியம் & நல்ல ஆரோக்கியம், தைரியம் & மன உறுதி, செவ்வாய் தோஷ நிவாரணம், அறுவை சிகிச்சை அல்லது குணமடைதலுக்கு முன் அமைதி ஆகியவற்றுக்காக பக்தர்கள் வருகின்றனர். இங்குள்ள புனித திருச்சாந்து நலனுக்கான ஆசீர்வாதமாகப் பெறப்படுகிறது."),
        ],
      },
      {
        heading: b("Who should visit", "யார் தரிசிக்க வேண்டும்"),
        body: [
          b("Often visited with Mars affliction or Sevvai dosham, during health concerns and the 6th house of illness, before or after surgery, in land or sibling disputes, or while running Mars dasha. Strength and cancellations should be read before assuming the dosham is severe.", "செவ்வாய் பாதிப்பு அல்லது செவ்வாய் தோஷம், ஆரோக்கிய கவலை மற்றும் நோய் தரும் 6-ஆம் பாவம், அறுவை சிகிச்சைக்கு முன்/பின், நிலம் அல்லது சகோதர தகராறு, அல்லது செவ்வாய் தசையின்போது அடிக்கடி தரிசிக்கப்படுகிறது. தோஷம் கடுமை என எண்ணும் முன் பலமும் ரத்து காரணங்களும் பார்க்கப்பட வேண்டும்."),
        ],
      },
    ],
    remedies: {
      heading: b("How to worship & plan a visit", "வழிபாடு & தரிசன திட்டம்"),
      intro: b("Mars worship is for steadiness as much as health; approach it with calm intent rather than fear.", "செவ்வாய் வழிபாடு ஆரோக்கியத்துடன் மன உறுதிக்கும்; பயத்தை விட அமைதியான எண்ணத்துடன் அணுகுங்கள்."),
      items: [
        b("Worship on Tuesdays with red offerings and the Angaraka / Mars mantra; take the temple's sacred ash with a health sankalpam.", "செவ்வாய்க்கிழமைகளில் சிவப்பு நைவேத்யம் மற்றும் அங்காரக / செவ்வாய் மந்திரத்துடன் வழிபடுங்கள்; ஆரோக்கிய சங்கல்பத்துடன் கோயில் திருநீற்றைப் பெறுங்கள்."),
        b("Pair the visit with Murugan worship for courage if Sevvai dosham is the concern.", "செவ்வாய் தோஷம் கவலையாக இருந்தால், தைரியத்திற்காக முருகன் வழிபாட்டையும் தரிசனத்துடன் சேருங்கள்."),
        b("Use panchangam to choose a calm day, and always keep medical treatment going alongside.", "அமைதியான நாளைத் தேர்வு செய்ய பஞ்சாங்கத்தைப் பயன்படுத்துங்கள்; மருத்துவ சிகிச்சையை எப்போதும் இணையாகத் தொடருங்கள்."),
      ],
    },
    slokam: {
      label: b("Angaraka (Sevvai) Beeja Mantra", "அங்காரக (செவ்வாய்) பீஜ மந்திரம்"),
      text: b("Om Kraam Kreem Kraum Sah Bhaumaaya Namah", "ஓம் க்ராம் க்ரீம் க்ரௌம் சஹ பௌமாய நமஹ"),
      meaning: b(
        "Salutation to Bhouma / Sevvai, who grants courage, healing energy and the strength to act decisively. Recited on Tuesdays.",
        "தைரியம், வைத்திய சக்தி, முடிவான செயல் திறன் தரும் பௌம / செவ்வாய்க்கு வணக்கம். செவ்வாய்க்கிழமைகளில் ஓதப்படுகிறது."
      ),
    },
    faq: [
      { q: b("Is Vaitheeswaran Koil only for Sevvai dosham?", "வைத்தீஸ்வரன் கோயில் செவ்வாய் தோஷத்திற்கு மட்டுமா?"), a: b("No. It is primarily a healing temple sought for health and recovery of all kinds. Its Mars connection also makes it a common stop for Sevvai dosham relief and courage.", "இல்லை. இது முதன்மையாக எல்லா வகை ஆரோக்கியம் & குணமடைதலுக்காகத் தேடப்படும் வைத்திய ஸ்தலம். அதன் செவ்வாய் தொடர்பு செவ்வாய் தோஷ நிவாரணம் & தைரியத்திற்கும் பொதுவான இடமாக்குகிறது.") },
      { q: b("Can it cure illness on its own?", "இது தானாக நோயைக் குணப்படுத்துமா?"), a: b("Devotion supports hope and steadiness, but it is not a substitute for treatment. Take it as faith alongside a qualified doctor, never instead of medicine.", "பக்தி நம்பிக்கையையும் மன உறுதியையும் ஆதரிக்கிறது; ஆனால் சிகிச்சைக்கு மாற்றல்ல. தகுதியான மருத்துவருடன் சேர்ந்த நம்பிக்கையாகக் கொள்ளுங்கள்; மருந்துக்கு மாற்றாக அல்ல.") },
      { q: b("What day should I visit?", "எந்த நாளில் தரிசிக்க வேண்டும்?"), a: b("Tuesday is Mars's day and traditional here. Choose a panchangam day suited to your chart, especially if visiting for a specific health or dosham concern.", "செவ்வாய் கிழமை செவ்வாயின் நாள், இங்கே பாரம்பரியம். குறிப்பிட்ட ஆரோக்கியம் அல்லது தோஷ கவலைக்காக வந்தால், உங்கள் ஜாதகத்திற்கு ஏற்ற பஞ்சாங்க நாளைத் தேர்வு செய்யுங்கள்.") },
    ],
    ctaVariant: "temple",
    related: [
      { href: "/dosham/sevvai-dosham", label: b("Sevvai Dosham", "செவ்வாய் தோஷம்") },
      { href: "/pariharam", label: b("Pariharam", "பரிகாரம்") },
      { href: "/temples", label: b("Navagraha temples", "நவகிரக கோயில்கள்") },
    ],
  },
  thiruvenkadu: {
    slug: "thiruvenkadu",
    kind: "temple",
    topic: "temple",
    eyebrow: b("Temple guide · Mercury", "கோயில் வழிகாட்டி · புதன்"),
    title: b("Thiruvenkadu Budhan Temple", "திருவெண்காடு புதன் கோயில்"),
    lead: b(
      "Thiruvenkadu is associated with Budhan, Mercury. It is sought for speech, learning, business clarity, calculation, memory, and relief from Mercury-related weakness.",
      "திருவெண்காடு புதனுக்குரிய ஸ்தலம். பேச்சு, கல்வி, வணிக தெளிவு, கணக்கு, நினைவாற்றல், புதன் பலவீன நிவாரணம் ஆகியவற்றுக்காக தரிசிக்கப்படுகிறது."
    ),
    quickFacts: [
      { label: b("Graha / deity", "கிரகம் / தெய்வம்"), value: b("Budhan (Mercury)", "புதன்") },
      { label: b("Sthalam", "ஸ்தலம்"), value: b("Navagraha temple for Mercury", "புதனுக்குரிய நவகிரக கோயில்") },
      { label: b("Best time", "சிறந்த நேரம்"), value: b("Wednesday", "புதன் கிழமை") },
      { label: b("Visit for", "எதற்காக"), value: b("Speech, learning, business, memory", "பேச்சு, கல்வி, வணிகம், நினைவாற்றல்") },
    ],
    sections: [
      {
        heading: b("What it is", "என்ன என்பது"),
        body: [
          b("Thiruvenkadu is the Navagraha sthalam for Budhan, Mercury — the planet of speech, intellect, trade, writing, mathematics and adaptability. A strong Mercury sharpens communication and practical intelligence.", "திருவெண்காடு புதனுக்குரிய நவகிரக ஸ்தலம் — பேச்சு, புத்தி, வணிகம், எழுத்து, கணிதம், மாற்றத்திறன் ஆகியவற்றின் கிரகம். பலமான புதன் தொடர்பையும் நடைமுறை அறிவையும் கூர்மையாக்குகிறார்."),
        ],
      },
      {
        heading: b("What it brings", "என்ன அருளும்"),
        body: [
          b("Worship here is for clear speech, success in education and exams, business and accounting clarity, sharp memory, and relief from a weak or stressed Mercury that shows as nervousness or confusion.", "தெளிவான பேச்சு, கல்வி & தேர்வு வெற்றி, வணிகம் & கணக்குத் தெளிவு, கூர்மையான நினைவாற்றல், நரம்பு பதற்றம் அல்லது குழப்பமாக வெளிப்படும் பலவீன புதன் நிவாரணம் ஆகியவற்றுக்காக இங்கு வழிபடப்படுகிறது."),
        ],
      },
      {
        heading: b("Who should visit", "யார் தரிசிக்க வேண்டும்"),
        body: [
          b("Considered when Mercury is weak, combust, afflicted or running its dasha — especially for students, those in business, accounts, writing or speaking professions, and anyone facing nervous strain or learning difficulty.", "புதன் பலவீனமாக, அஸ்தங்கமாக, பாதிப்புடன் அல்லது தசையில் இருக்கும்போது கருதப்படுகிறது — குறிப்பாக மாணவர்கள், வணிகம், கணக்கு, எழுத்து அல்லது பேச்சுத் தொழிலில் உள்ளவர்கள், நரம்பு அழுத்தம் அல்லது கற்றல் சிரமம் உள்ளவர்கள்."),
        ],
      },
    ],
    remedies: {
      heading: b("How to worship & plan a visit", "வழிபாடு & தரிசன திட்டம்"),
      intro: b("Mercury responds to discipline and study; remedies pair worship with consistent effort.", "புதன் ஒழுக்கம் & படிப்புக்கு பதிலளிக்கிறார்; பரிகாரங்கள் வழிபாட்டை தொடர்ந்த முயற்சியுடன் சேர்க்கின்றன."),
      items: [
        b("Worship on Wednesdays with green offerings and the Budha mantra.", "புதன்களில் பச்சை நைவேத்யம் மற்றும் புத மந்திரத்துடன் வழிபடுங்கள்."),
        b("Keep a steady study or practice routine — disciplined learning is itself a Mercury remedy.", "நிலையான படிப்பு அல்லது பயிற்சி வழக்கத்தை வையுங்கள் — ஒழுக்கமான கற்றலே ஒரு புதன் பரிகாரம்."),
        b("Time exams, launches, contracts and important communication to favourable Mercury periods.", "தேர்வு, தொடக்கங்கள், ஒப்பந்தங்கள், முக்கிய தொடர்புகளை சாதகமான புதன் காலங்களுக்கு அமைக்கவும்."),
      ],
    },
    slokam: {
      label: b("Budha Beeja Mantra", "புத பீஜ மந்திரம்"),
      text: b("Om Braam Breem Braum Sah Budhaaya Namah", "ஓம் ப்ராம் ப்ரீம் ப்ரௌம் சஹ புதாய நமஹ"),
      meaning: b(
        "Salutation to Budha, who sharpens speech, learning and intelligent action. Recited on Wednesdays for clarity and skill.",
        "பேச்சு, கல்வி, அறிவார்ந்த செயலைக் கூர்மையாக்கும் புதனுக்கு வணக்கம். தெளிவு & திறனுக்காக புதன்களில் ஓதப்படுகிறது."
      ),
    },
    faq: [
      { q: b("Is Thiruvenkadu good for students?", "திருவெண்காடு மாணவர்களுக்கு நல்லதா?"), a: b("Yes. As Mercury's temple it is popular for education, exams and clear thinking. Worship works best paired with steady study rather than as a replacement for it.", "ஆம். புதனின் கோயிலாக கல்வி, தேர்வு, தெளிவான சிந்தனைக்கு பிரபலம். வழிபாடு படிப்புக்கு மாற்றாக அல்ல, நிலையான படிப்புடன் சேரும்போது சிறப்பாகப் பயன்படும்.") },
      { q: b("My child stammers / lacks focus — will this help?", "என் குழந்தைக்கு திக்குவாய் / கவனக்குறைவு — இது உதவுமா?"), a: b("Mercury worship is traditionally for speech and focus and many families find it supportive. For clinical concerns, combine it with proper speech therapy or medical guidance.", "புதன் வழிபாடு பாரம்பரியமாக பேச்சு & கவனத்திற்கானது; பல குடும்பங்களுக்கு உதவியாக உள்ளது. மருத்துவ கவலைகளுக்கு, முறையான பேச்சு சிகிச்சை அல்லது மருத்துவ ஆலோசனையுடன் சேருங்கள்.") },
      { q: b("Which day is best?", "சிறந்த நாள் எது?"), a: b("Wednesday is Mercury's day. Choose a panchangam day suited to your chart for a focused visit, especially before exams or a business start.", "புதன் கிழமை புதனின் நாள். குறிப்பாக தேர்வு அல்லது வணிகத் தொடக்கத்திற்கு முன், கவனம் செலுத்திய தரிசனத்திற்கு உங்கள் ஜாதகத்திற்கு ஏற்ற பஞ்சாங்க நாளைத் தேர்வு செய்யுங்கள்.") },
    ],
    ctaVariant: "temple",
    related: [
      { href: "/yogam/budha-aditya-yogam", label: b("Budha-Aditya Yogam", "புத-ஆதித்ய யோகம்") },
      { href: "/tools/jadhagam-generator", label: b("Generate chart", "ஜாதகம் உருவாக்கு") },
      { href: "/temples", label: b("Temples", "கோயில்கள்") },
    ],
  },
  alangudi: {
    slug: "alangudi",
    kind: "temple",
    topic: "temple",
    eyebrow: b("Temple guide · Jupiter", "கோயில் வழிகாட்டி · குரு"),
    title: b("Alangudi Guru Temple", "ஆலங்குடி குரு கோயில்"),
    lead: b(
      "Alangudi is associated with Guru / Jupiter. Devotees seek wisdom, marriage blessings, children, teaching grace, protection, and relief during difficult Jupiter periods.",
      "ஆலங்குடி குருவுக்குரிய ஸ்தலம். ஞானம், திருமண ஆசீர்வாதம், சந்தானம், கற்பித்தல் அருள், பாதுகாப்பு, குரு கால சிரம நிவாரணம் ஆகியவற்றுக்காக தரிசிக்கப்படுகிறது."
    ),
    quickFacts: [
      { label: b("Graha / deity", "கிரகம் / தெய்வம்"), value: b("Guru (Jupiter)", "குரு") },
      { label: b("Sthalam", "ஸ்தலம்"), value: b("Navagraha temple for Jupiter", "குருவுக்குரிய நவகிரக கோயில்") },
      { label: b("Best time", "சிறந்த நேரம்"), value: b("Thursday", "வியாழன்") },
      { label: b("Visit for", "எதற்காக"), value: b("Wisdom, marriage, children, protection", "ஞானம், திருமணம், சந்தானம், பாதுகாப்பு") },
    ],
    sections: [
      {
        heading: b("What it is", "என்ன என்பது"),
        body: [
          b("Alangudi is the Navagraha sthalam for Guru, Jupiter — the great benefic. Jupiter stands for wisdom, dharma, children, teachers, marriage blessings (especially for women), ethics and protection. A strong Guru softens many difficulties in a chart.", "ஆலங்குடி குருவுக்குரிய நவகிரக ஸ்தலம் — பெரும் சுபக்கிரகம். குரு ஞானம், தர்மம், குழந்தைகள், ஆசிரியர், திருமண ஆசீர்வாதம் (குறிப்பாக பெண்களுக்கு), ஒழுக்கம், பாதுகாப்பு ஆகியவற்றைக் குறிக்கிறார். பலமான குரு ஜாதகத்தின் பல சிரமங்களை மென்மையாக்குகிறார்."),
        ],
      },
      {
        heading: b("What it brings", "என்ன அருளும்"),
        body: [
          b("Devotees pray for wisdom and good judgement, timely marriage and harmony, the blessing of children, success in teaching and study, ethical finances, and protection through difficult Jupiter periods.", "ஞானம் & நல்ல தீர்மானம், காலத்தில் திருமணம் & ஒற்றுமை, சந்தான பாக்கியம், கற்பித்தல் & கல்வி வெற்றி, ஒழுக்கமான நிதி, கடினமான குரு காலங்களில் பாதுகாப்பு ஆகியவற்றுக்காக பக்தர்கள் பிரார்த்திக்கின்றனர்."),
        ],
      },
      {
        heading: b("Who should visit", "யார் தரிசிக்க வேண்டும்"),
        body: [
          b("Often visited when Jupiter is weak, afflicted or running its dasha, when 5th/7th/9th house themes — children, marriage, fortune — need support, before Guru peyarchi, or for blessings around teaching, higher study and family wellbeing.", "குரு பலவீனமாக, பாதிப்புடன் அல்லது தசையில் இருக்கும்போது, 5/7/9-ஆம் பாவத் தலைப்புகள் — சந்தானம், திருமணம், பாக்கியம் — ஆதரவு தேவைப்படும்போது, குரு பெயர்ச்சிக்கு முன், அல்லது கற்பித்தல், உயர் கல்வி, குடும்ப நலனுக்கான ஆசீர்வாதத்திற்காக அடிக்கடி தரிசிக்கப்படுகிறது."),
        ],
      },
    ],
    remedies: {
      heading: b("How to worship & plan a visit", "வழிபாடு & தரிசன திட்டம்"),
      intro: b("Jupiter blesses respect, generosity and learning; worship is best paired with those values in daily life.", "குரு மரியாதை, தாராளம், கற்றலை ஆசீர்வதிக்கிறார்; தினசரி வாழ்வில் அந்த மதிப்புகளுடன் வழிபாடு சேரும்போது சிறந்தது."),
      items: [
        b("Worship on Thursdays with yellow offerings, the Guru mantra, and respect to teachers and elders.", "வியாழன்களில் மஞ்சள் நைவேத்யம், குரு மந்திரம், ஆசிரியர் & பெரியோர் மரியாதையுடன் வழிபடுங்கள்."),
        b("Time the visit around Guru peyarchi or your Jupiter dasha for the strongest guidance.", "மிக வலுவான வழிகாட்டலுக்கு குரு பெயர்ச்சி அல்லது உங்கள் குரு தசையைச் சுற்றி தரிசனத்தை அமைக்கவும்."),
        b("For marriage or children, pair Alangudi with Thirumananjeri and a proper porutham check.", "திருமணம் அல்லது சந்தானத்திற்கு, ஆலங்குடியை திருமணஞ்சேரி மற்றும் முறையான பொருத்தம் பார்த்தலுடன் சேருங்கள்."),
      ],
    },
    slokam: {
      label: b("Guru Beeja Mantra", "குரு பீஜ மந்திரம்"),
      text: b("Om Graam Greem Graum Sah Gurave Namah", "ஓம் க்ராம் க்ரீம் க்ரௌம் சஹ குரவே நமஹ"),
      meaning: b(
        "Salutation to Guru, the great teacher who bestows wisdom, protection and grace. Recited on Thursdays with sincere intent.",
        "ஞானம், பாதுகாப்பு, அருள் தரும் பெரும் குருவுக்கு வணக்கம். வியாழன்களில் மனமார்ந்த எண்ணத்துடன் ஓதப்படுகிறது."
      ),
    },
    faq: [
      { q: b("Why is Alangudi linked to marriage and children?", "ஆலங்குடி ஏன் திருமணம் & சந்தானத்துடன் இணைக்கப்படுகிறது?"), a: b("Jupiter is the karaka (significator) for marriage blessings — especially for women — and for children through the 5th house. As Jupiter's temple, Alangudi is a natural place to pray for both.", "குரு திருமண ஆசீர்வாதத்திற்கு — குறிப்பாக பெண்களுக்கு — மற்றும் 5-ஆம் பாவம் மூலம் சந்தானத்திற்கு காரகன். குருவின் கோயிலாக, ஆலங்குடி இரண்டிற்கும் பிரார்த்திக்க இயல்பான இடம்.") },
      { q: b("What is Guru peyarchi and why does it matter?", "குரு பெயர்ச்சி என்றால் என்ன, ஏன் முக்கியம்?"), a: b("Guru peyarchi is Jupiter's transit from one sign to the next, roughly yearly. It shifts fortune across houses, so many devotees visit Jupiter temples around it to align with the new period.", "குரு பெயர்ச்சி என்பது குரு ஒரு ராசியிலிருந்து அடுத்ததற்கு மாறும் கோச்சாரம், ஏறக்குறைய ஆண்டுக்கு ஒருமுறை. இது பாக்கியத்தை பாவங்களில் மாற்றுகிறது; எனவே பலர் புதிய காலத்துடன் இணைய அதைச் சுற்றி குரு கோயில்களைத் தரிசிக்கின்றனர்.") },
      { q: b("Best day to visit?", "தரிசிக்க சிறந்த நாள்?"), a: b("Thursday is Jupiter's day. A panchangam day suited to your chart, or a date close to Guru peyarchi, makes the visit especially meaningful.", "வியாழன் குருவின் நாள். உங்கள் ஜாதகத்திற்கு ஏற்ற பஞ்சாங்க நாள், அல்லது குரு பெயர்ச்சிக்கு அருகிலான தேதி, தரிசனத்தை மிகவும் பொருள் பொதிந்ததாக்கும்.") },
    ],
    ctaVariant: "temple",
    related: [
      { href: "/yogam/gaja-kesari-yogam", label: b("Gaja Kesari Yogam", "கஜகேசரி யோகம்") },
      { href: "/pariharam/thirumana-thadai", label: b("Marriage pariharam", "திருமண பரிகாரம்") },
      { href: "/temples", label: b("Temples", "கோயில்கள்") },
    ],
  },
  kanjanur: {
    slug: "kanjanur",
    kind: "temple",
    topic: "temple",
    eyebrow: b("Temple guide · Venus", "கோயில் வழிகாட்டி · சுக்கிரன்"),
    title: b("Kanjanur Sukran Temple", "காஞ்சனூர் சுக்கிரன் கோயில்"),
    lead: b(
      "Kanjanur is associated with Sukran, Venus. It is traditionally connected with marriage harmony, comfort, beauty, arts, vehicles, relationships, and material ease.",
      "காஞ்சனூர் சுக்கிரனுக்குரிய ஸ்தலம். திருமண ஒற்றுமை, சுகம், அழகு, கலை, வாகனம், உறவுகள், பொருள் வசதி ஆகியவற்றுடன் பாரம்பரியமாக தொடர்புடையது."
    ),
    quickFacts: [
      { label: b("Graha / deity", "கிரகம் / தெய்வம்"), value: b("Sukran (Venus)", "சுக்கிரன்") },
      { label: b("Sthalam", "ஸ்தலம்"), value: b("Navagraha temple for Venus", "சுக்கிரனுக்குரிய நவகிரக கோயில்") },
      { label: b("Best time", "சிறந்த நேரம்"), value: b("Friday", "வெள்ளி") },
      { label: b("Visit for", "எதற்காக"), value: b("Marriage comfort, harmony, arts, ease", "திருமண சுகம், ஒற்றுமை, கலை, வசதி") },
    ],
    sections: [
      {
        heading: b("What it is", "என்ன என்பது"),
        body: [
          b("Kanjanur is the Navagraha sthalam for Sukran, Venus — the planet of love, marriage comfort, beauty, art, luxury, vehicles and relationships. A strong Venus supports harmony, pleasure and a refined, comfortable life.", "காஞ்சனூர் சுக்கிரனுக்குரிய நவகிரக ஸ்தலம் — காதல், திருமண சுகம், அழகு, கலை, ஆடம்பரம், வாகனம், உறவுகளின் கிரகம். பலமான சுக்கிரன் ஒற்றுமை, இன்பம், நயமுள்ள வசதியான வாழ்க்கையை ஆதரிக்கிறார்."),
        ],
      },
      {
        heading: b("What it brings", "என்ன அருளும்"),
        body: [
          b("Worship here is for marriage harmony and spousal comfort, success in arts and creative work, vehicles and material ease, financial comfort, and relief from a weak or stressed Venus that shows as relationship friction.", "திருமண ஒற்றுமை & துணை வசதி, கலை & படைப்புப் பணியில் வெற்றி, வாகனம் & பொருள் வசதி, நிதி சுகம், உறவு உராய்வாக வெளிப்படும் பலவீன சுக்கிரன் நிவாரணம் ஆகியவற்றுக்காக இங்கு வழிபடப்படுகிறது."),
        ],
      },
      {
        heading: b("Who should visit", "யார் தரிசிக்க வேண்டும்"),
        body: [
          b("Considered when Venus is weak, afflicted or running its dasha, in matters of marriage, comfort, finance, art or relationships, and when seeking harmony with a spouse. For marriage questions the porutham and navamsa should be read together.", "சுக்கிரன் பலவீனமாக, பாதிப்புடன் அல்லது தசையில் இருக்கும்போது, திருமணம், சுகம், நிதி, கலை அல்லது உறவு விஷயங்களில், துணையுடன் ஒற்றுமை தேடும்போது கருதப்படுகிறது. திருமண கேள்விகளுக்கு பொருத்தமும் நவாம்சமும் சேர்த்துப் பார்க்க வேண்டும்."),
        ],
      },
    ],
    remedies: {
      heading: b("How to worship & plan a visit", "வழிபாடு & தரிசன திட்டம்"),
      intro: b("Venus blesses grace and harmony; worship is gentle and best matched with kindness in relationships.", "சுக்கிரன் நயத்தையும் ஒற்றுமையையும் ஆசீர்வதிக்கிறார்; வழிபாடு மென்மையானது, உறவுகளில் கனிவுடன் சேரும்போது சிறந்தது."),
      items: [
        b("Worship on Fridays with white or fragrant offerings and the Sukra mantra.", "வெள்ளிகளில் வெள்ளை அல்லது மணமுள்ள நைவேத்யம் மற்றும் சுக்கிர மந்திரத்துடன் வழிபடுங்கள்."),
        b("For marriage harmony, pair the visit with honest communication and a proper porutham check.", "திருமண ஒற்றுமைக்கு, தரிசனத்தை நேர்மையான பேச்சு மற்றும் முறையான பொருத்தம் பார்த்தலுடன் சேருங்கள்."),
        b("Use Venus periods for relationships, creative work, vehicle purchase and comfort-related decisions.", "உறவுகள், படைப்புப் பணி, வாகனம் வாங்குதல், வசதி சார்ந்த முடிவுகளுக்கு சுக்கிர காலங்களைப் பயன்படுத்துங்கள்."),
      ],
    },
    slokam: {
      label: b("Sukra Beeja Mantra", "சுக்கிர பீஜ மந்திரம்"),
      text: b("Om Draam Dreem Draum Sah Sukraaya Namah", "ஓம் த்ராம் த்ரீம் த்ரௌம் சஹ சுக்ராய நமஹ"),
      meaning: b(
        "Salutation to Sukra, who grants beauty, comfort, love and graceful living. Recited on Fridays for harmony and ease.",
        "அழகு, சுகம், காதல், நயமுள்ள வாழ்வு தரும் சுக்கிரனுக்கு வணக்கம். ஒற்றுமை & வசதிக்காக வெள்ளிகளில் ஓதப்படுகிறது."
      ),
    },
    faq: [
      { q: b("Is Kanjanur only for marriage matters?", "காஞ்சனூர் திருமண விஷயங்களுக்கு மட்டுமா?"), a: b("No. As Venus's temple it also covers arts, comfort, vehicles and finances. But marriage harmony and spousal comfort are among the most common reasons devotees visit.", "இல்லை. சுக்கிரனின் கோயிலாக கலை, வசதி, வாகனம், நிதியையும் உள்ளடக்குகிறது. ஆனால் திருமண ஒற்றுமை & துணை வசதியே பக்தர்கள் தரிசிக்கும் பொதுவான காரணங்களில் உள்ளன.") },
      { q: b("Can it help a strained marriage?", "சிக்கலான திருமணத்திற்கு உதவுமா?"), a: b("Venus worship is traditionally for harmony and many find it calming. Lasting change also needs honest communication and effort from both partners, so use devotion alongside that.", "சுக்கிர வழிபாடு பாரம்பரியமாக ஒற்றுமைக்கானது; பலருக்கு அமைதி தருகிறது. நீடித்த மாற்றத்திற்கு இருவரின் நேர்மையான பேச்சும் முயற்சியும் தேவை; எனவே பக்தியை அதனுடன் சேர்த்துப் பயன்படுத்துங்கள்.") },
      { q: b("Best day to visit?", "தரிசிக்க சிறந்த நாள்?"), a: b("Friday is Venus's day. A panchangam day suited to your chart refines the timing, especially for marriage or relationship prayers.", "வெள்ளி சுக்கிரனின் நாள். உங்கள் ஜாதகத்திற்கு ஏற்ற பஞ்சாங்க நாள், குறிப்பாக திருமணம் அல்லது உறவு பிரார்த்தனைகளுக்கு நேரத்தை நுணுக்கமாக்கும்.") },
    ],
    ctaVariant: "temple",
    related: [
      { href: "/tools/marriage-porutham-calculator", label: b("Marriage Porutham", "திருமண பொருத்தம்") },
      { href: "/dosham/kalathra-dosham", label: b("Kalathra Dosham", "களத்திர தோஷம்") },
      { href: "/temples", label: b("Temples", "கோயில்கள்") },
    ],
  },
  thirunageswaram: {
    slug: "thirunageswaram",
    kind: "temple",
    topic: "temple",
    eyebrow: b("Temple guide · Rahu", "கோயில் வழிகாட்டி · ராகு"),
    title: b("Thirunageswaram Rahu Temple", "திருநாகேஸ்வரம் ராகு கோயில்"),
    lead: b(
      "Thirunageswaram is associated with Rahu. Devotees seek relief from Rahu afflictions, naga dosham, confusion, sudden obstacles, and worldly ambition that feels difficult to control.",
      "திருநாகேஸ்வரம் ராகுவுக்குரிய ஸ்தலம். ராகு பாதிப்பு, நாக தோஷம், குழப்பம், திடீர் தடைகள், கட்டுப்படுத்த கடினமான உலக ஆசை ஆகியவற்றிலிருந்து நிவாரணம் தேடி பக்தர்கள் தரிசிக்கின்றனர்."
    ),
    quickFacts: [
      { label: b("Graha / deity", "கிரகம் / தெய்வம்"), value: b("Rahu (north lunar node)", "ராகு (வடக்கு சந்திப்பு)") },
      { label: b("Sthalam", "ஸ்தலம்"), value: b("Navagraha temple for Rahu", "ராகுவுக்குரிய நவகிரக கோயில்") },
      { label: b("Known for", "புகழ்"), value: b("Milk abhishekam turning blue", "பால் அபிஷேகம் நீலமாதல்") },
      { label: b("Visit for", "எதற்காக"), value: b("Naga dosham, confusion, sudden obstacles", "நாக தோஷம், குழப்பம், திடீர் தடைகள்") },
    ],
    sections: [
      {
        heading: b("What it is", "என்ன என்பது"),
        body: [
          b("Thirunageswaram is the Navagraha sthalam for Rahu, the north lunar node. Rahu signifies ambition, foreign and unconventional paths, sudden rise, illusion and karmic hunger — disruptive when unmanaged, but a source of worldly success when disciplined.", "திருநாகேஸ்வரம் வடக்கு சந்திப்பு புள்ளியான ராகுவுக்குரிய நவகிரக ஸ்தலம். ராகு ஆசை, வெளிநாட்டு & வழக்கத்திற்கு மாறான பாதை, திடீர் உயர்வு, மாயை, கர்ம பசி ஆகியவற்றைக் குறிக்கிறார் — கட்டுப்படுத்தாதபோது குழப்பம், ஒழுக்கத்துடன் உலக வெற்றியின் ஆதாரம்."),
        ],
      },
      {
        heading: b("What it brings", "என்ன அருளும்"),
        body: [
          b("Devotees seek relief from Rahu afflictions and naga dosham, a clearer mind amid confusion, protection from sudden obstacles, and the steadiness to channel restless ambition into real achievement.", "ராகு பாதிப்பு & நாக தோஷ நிவாரணம், குழப்பத்தில் தெளிவான மனம், திடீர் தடைகளிலிருந்து பாதுகாப்பு, அமைதியற்ற ஆசையை உண்மையான சாதனையாக மாற்றும் மன உறுதி ஆகியவற்றை பக்தர்கள் தேடுகின்றனர்."),
        ],
      },
      {
        heading: b("Who should visit", "யார் தரிசிக்க வேண்டும்"),
        body: [
          b("Considered during Rahu dasha, Rahu affliction to the Lagna, Moon, 5th or 7th house, when Sarpa or Kala Sarpa patterns are active, or amid sudden confusion, addictions and unexplained obstacles. Prayer should be steady, not fear-driven.", "ராகு தசை, லக்னம், சந்திரன், 5 அல்லது 7-ஆம் பாவத்திற்கு ராகு பாதிப்பு, சர்ப்ப அல்லது கால சர்ப்ப அமைப்பு செயல்படும்போது, அல்லது திடீர் குழப்பம், அடிமைத்தனம், காரணமற்ற தடைகளின்போது கருதப்படுகிறது. பிரார்த்தனை பயத்தால் அல்ல, நிலைத்த மனதுடன் இருக்க வேண்டும்."),
        ],
      },
    ],
    remedies: {
      heading: b("How to worship & plan a visit", "வழிபாடு & தரிசன திட்டம்"),
      intro: b("Rahu worship is about steadiness and clarity; keep it calm and disciplined rather than anxious.", "ராகு வழிபாடு மன உறுதி & தெளிவு பற்றியது; பதற்றம் அல்ல, அமைதியும் ஒழுக்கமும் வையுங்கள்."),
      items: [
        b("Offer milk abhishekam (famous here for turning bluish) with naga prarthana and the Rahu mantra.", "நாக பிரார்த்தனை மற்றும் ராகு மந்திரத்துடன் பால் அபிஷேகம் (இங்கே நீலமாவது புகழ்) செய்யுங்கள்."),
        b("Pair with Ketu worship at Keezhaperumpallam, especially for Sarpa / Kala Sarpa concerns.", "குறிப்பாக சர்ப்ப / கால சர்ப்ப கவலைகளுக்கு, கீழப்பெரும்பள்ளம் கேது வழிபாட்டுடன் சேருங்கள்."),
        b("Use personal panchangam rather than fear of Rahu kalam, and channel the energy into focused work.", "ராகு கால பயத்தை விட தனிப்பட்ட பஞ்சாங்கத்தைப் பயன்படுத்துங்கள்; சக்தியை கவனம் செலுத்திய உழைப்பாக மாற்றுங்கள்."),
      ],
    },
    slokam: {
      label: b("Rahu Beeja Mantra", "ராகு பீஜ மந்திரம்"),
      text: b("Om Braam Breem Braum Sah Raahave Namah", "ஓம் ப்ராம் ப்ரீம் ப்ரௌம் சஹ ராஹவே நமஹ"),
      meaning: b(
        "Salutation to Rahu, who transforms restless ambition into focused power. Recited with steady, disciplined intent rather than fear.",
        "அமைதியற்ற ஆசையை கவனம் செலுத்திய சக்தியாக மாற்றும் ராகுவுக்கு வணக்கம். பயத்தை விட நிலைத்த, ஒழுக்கமான எண்ணத்துடன் ஓதப்படுகிறது."
      ),
    },
    faq: [
      { q: b("Should I worship Rahu only during Rahu kalam?", "ராகு காலத்தில் மட்டும் ராகுவை வழிபட வேண்டுமா?"), a: b("Rahu kalam worship is a tradition, but it is not compulsory. A panchangam day and time suited to your chart, with steady devotion, matters more than fear of a particular hour.", "ராகு கால வழிபாடு ஒரு மரபு; ஆனால் கட்டாயமல்ல. ஒரு குறிப்பிட்ட நேரத்தின் பயத்தை விட உங்கள் ஜாதகத்திற்கு ஏற்ற பஞ்சாங்க நாள் & நேரம், நிலைத்த பக்தியுடன், முக்கியம்.") },
      { q: b("What does the milk turning blue mean?", "பால் நீலமாவது எதைக் குறிக்கிறது?"), a: b("It is a renowned feature of the abhishekam here, taken by devotees as Rahu's presence and grace. Treat it as a devotional experience rather than a forecast.", "இங்கே அபிஷேகத்தின் புகழ்பெற்ற அம்சம், பக்தர்களால் ராகுவின் இருப்பு & அருளாகக் கொள்ளப்படுகிறது. கணிப்பாக அல்ல, பக்தி அனுபவமாகக் கொள்ளுங்கள்.") },
      { q: b("Is Rahu always harmful?", "ராகு எப்போதும் தீங்கானதா?"), a: b("No. Rahu can give remarkable worldly success when disciplined and well-placed. Worship aims to steady its restless energy so it builds rather than disrupts.", "இல்லை. ஒழுக்கத்துடனும் நல்ல இடத்திலும் இருந்தால் ராகு குறிப்பிடத்தக்க உலக வெற்றியைத் தரலாம். வழிபாடு அதன் அமைதியற்ற சக்தியை அமைதிப்படுத்தி, குலைப்பதை விட கட்டமைக்க உதவுகிறது.") },
    ],
    ctaVariant: "temple",
    related: [
      { href: "/dosham/naga-sarpa-dosham", label: b("Naga / Sarpa Dosham", "நாக / சர்ப்ப தோஷம்") },
      { href: "/dosham/kala-sarpa-dosham", label: b("Kala Sarpa Dosham", "கால சர்ப்ப தோஷம்") },
      { href: "/temples/keezhaperumpallam", label: b("Ketu temple", "கேது கோயில்") },
    ],
  },
  keezhaperumpallam: {
    slug: "keezhaperumpallam",
    kind: "temple",
    topic: "temple",
    eyebrow: b("Temple guide · Ketu", "கோயில் வழிகாட்டி · கேது"),
    title: b("Keezhaperumpallam Ketu Temple", "கீழப்பெரும்பள்ளம் கேது கோயில்"),
    lead: b(
      "Keezhaperumpallam is associated with Ketu. It is traditionally visited for detachment, spiritual clarity, serpent-related dosham relief, and release from past karmic knots.",
      "கீழப்பெரும்பள்ளம் கேதுவுக்குரிய ஸ்தலம். பற்றற்ற நிலை, ஆன்ம தெளிவு, சர்ப்ப தோஷ நிவாரணம், கடந்த கர்ம முடிச்சிலிருந்து விடுதல் ஆகியவற்றுக்காக தரிசிக்கப்படுகிறது."
    ),
    quickFacts: [
      { label: b("Graha / deity", "கிரகம் / தெய்வம்"), value: b("Ketu (south lunar node)", "கேது (தெற்கு சந்திப்பு)") },
      { label: b("Sthalam", "ஸ்தலம்"), value: b("Navagraha temple for Ketu", "கேதுவுக்குரிய நவகிரக கோயில்") },
      { label: b("Theme", "தலைப்பு"), value: b("Detachment & spiritual release", "பற்றின்மை & ஆன்ம விடுதலை") },
      { label: b("Visit for", "எதற்காக"), value: b("Sarpa dosham, clarity, letting go", "சர்ப்ப தோஷம், தெளிவு, விடுதல்") },
    ],
    sections: [
      {
        heading: b("What it is", "என்ன என்பது"),
        body: [
          b("Keezhaperumpallam is the Navagraha sthalam for Ketu, the south lunar node. Ketu signifies detachment, moksha, sharp intuition, past-life skill and separation — energies that can feel confusing until their spiritual lesson is understood.", "கீழப்பெரும்பள்ளம் தெற்கு சந்திப்பு புள்ளியான கேதுவுக்குரிய நவகிரக ஸ்தலம். கேது பற்றின்மை, மோட்சம், கூர்மையான உள்ளுணர்வு, பூர்வஜன்ம திறன், பிரிவு ஆகியவற்றைக் குறிக்கிறார் — அதன் ஆன்ம பாடம் புரியும் வரை குழப்பமாக உணரக்கூடிய சக்திகள்."),
        ],
      },
      {
        heading: b("What it brings", "என்ன அருளும்"),
        body: [
          b("Worship here is for relief from serpent-related dosham, calm during spiritual crisis, freedom from old karmic knots, sharper intuition, and the grace to let go of what no longer serves.", "சர்ப்ப தொடர்பான தோஷ நிவாரணம், ஆன்ம சிக்கலின்போது அமைதி, பழைய கர்ம முடிச்சிலிருந்து விடுதலை, கூர்மையான உள்ளுணர்வு, தேவையற்றதை விடும் அருள் ஆகியவற்றுக்காக இங்கு வழிபடப்படுகிறது."),
        ],
      },
      {
        heading: b("Who should visit", "யார் தரிசிக்க வேண்டும்"),
        body: [
          b("Considered during Ketu dasha, Ketu affliction to the Moon or Lagna, spiritual restlessness or crisis, repeated separations, or when Sarpa dosham appears with the 5th house or Jupiter. It is also part of a full Navagraha pilgrimage.", "கேது தசை, சந்திரன் அல்லது லக்னத்திற்கு கேது பாதிப்பு, ஆன்ம அமைதியின்மை அல்லது சிக்கல், மீண்டும் வரும் பிரிவுகள், அல்லது 5-ஆம் பாவம் அல்லது குருவுடன் சர்ப்ப தோஷம் தோன்றும்போது கருதப்படுகிறது. முழு நவகிரக யாத்திரையின் ஒரு பகுதியும் ஆகும்."),
        ],
      },
    ],
    remedies: {
      heading: b("How to worship & plan a visit", "வழிபாடு & தரிசன திட்டம்"),
      intro: b("Ketu responds to humility and simplicity; quiet, sincere prayer suits this deity.", "கேது தாழ்மை & எளிமைக்கு பதிலளிக்கிறார்; அமைதியான, மனமார்ந்த பிரார்த்தனை இத்தெய்வத்திற்கு ஏற்றது."),
      items: [
        b("Worship simply with the Ketu mantra and a sankalpam to release old karmic burdens.", "கேது மந்திரம் மற்றும் பழைய கர்ம சுமைகளை விடும் சங்கல்பத்துடன் எளிமையாக வழிபடுங்கள்."),
        b("Pair with Rahu worship at Thirunageswaram for Sarpa / Kala Sarpa concerns.", "சர்ப்ப / கால சர்ப்ப கவலைகளுக்கு திருநாகேஸ்வரம் ராகு வழிபாட்டுடன் சேருங்கள்."),
        b("Let panchangam, nakshathiram and your Ketu dasha guide the timing of the visit.", "பஞ்சாங்கம், நட்சத்திரம், உங்கள் கேது தசை தரிசன நேரத்தை வழிநடத்தட்டும்."),
      ],
    },
    slokam: {
      label: b("Ketu Beeja Mantra", "கேது பீஜ மந்திரம்"),
      text: b("Om Straam Streem Straum Sah Ketave Namah", "ஓம் ஸ்த்ராம் ஸ்த்ரீம் ஸ்த்ரௌம் சஹ கேதவே நமஹ"),
      meaning: b(
        "Salutation to Ketu, who loosens worldly attachments and opens the path to inner wisdom and liberation.",
        "உலக பற்றுகளை தளர்த்தி உள்ளார்ந்த ஞானம் & விடுதலையின் பாதையைத் திறக்கும் கேதுவுக்கு வணக்கம்."
      ),
    },
    faq: [
      { q: b("Why are Rahu and Ketu temples visited together?", "ராகு & கேது கோயில்கள் ஏன் சேர்ந்து தரிசிக்கப்படுகின்றன?"), a: b("They are two ends of the same nodal axis, so Sarpa and Kala Sarpa concerns usually involve both. Many pilgrims visit Thirunageswaram and Keezhaperumpallam on the same trip.", "அவை அதே சந்திப்பு அச்சின் இரு முனைகள்; எனவே சர்ப்ப & கால சர்ப்ப கவலைகள் வழக்கமாக இரண்டையும் உள்ளடக்கும். பல யாத்ரீகர்கள் ஒரே பயணத்தில் திருநாகேஸ்வரம் & கீழப்பெரும்பள்ளத்தை தரிசிக்கின்றனர்.") },
      { q: b("Is Ketu's influence always negative?", "கேதுவின் தாக்கம் எப்போதும் எதிர்மறையா?"), a: b("No. Ketu gives intuition, detachment and spiritual depth. Once its lesson of letting go is understood, the same energy supports wisdom and inner freedom.", "இல்லை. கேது உள்ளுணர்வு, பற்றின்மை, ஆன்ம ஆழத்தைத் தருகிறார். விடுதலின் பாடம் புரிந்தவுடன், அதே சக்தி ஞானத்தையும் உள்ளார்ந்த விடுதலையையும் ஆதரிக்கிறது.") },
      { q: b("What should I pray for here?", "இங்கே எதற்காக பிரார்த்திக்க வேண்டும்?"), a: b("Commonly for relief from Sarpa dosham, clarity in confusion, and the strength to release old attachments or karmic patterns. Keep the prayer humble and sincere.", "பொதுவாக சர்ப்ப தோஷ நிவாரணம், குழப்பத்தில் தெளிவு, பழைய பற்றுகள் அல்லது கர்ம அமைப்புகளை விடும் பலத்திற்காக. பிரார்த்தனையை தாழ்மையாகவும் மனமார்ந்ததாகவும் வையுங்கள்.") },
    ],
    ctaVariant: "temple",
    related: [
      { href: "/dosham/naga-sarpa-dosham", label: b("Naga / Sarpa Dosham", "நாக / சர்ப்ப தோஷம்") },
      { href: "/temples/thirunageswaram", label: b("Rahu temple", "ராகு கோயில்") },
      { href: "/pariharam", label: b("Pariharam", "பரிகாரம்") },
    ],
  },
  thirumananjeri: {
    slug: "thirumananjeri",
    kind: "temple",
    topic: "temple",
    eyebrow: b("Temple guide · marriage blessing", "கோயில் வழிகாட்டி · திருமண வரம்"),
    title: b("Thirumananjeri", "திருமணஞ்சேரி"),
    lead: b(
      "Thirumananjeri is a famed Shiva-Parvati sthalam sought for timely marriage, harmony, and blessings for a suitable spouse. It is often connected with 7th house and Venus/Jupiter concerns.",
      "திருமணஞ்சேரி சிவன்-பார்வதி ஸ்தலம்; காலத்தில் திருமணம், ஒற்றுமை, நல்ல துணை வரம் ஆகியவற்றுக்காக புகழ்பெற்றது. இது 7-ஆம் பாவம், சுக்கிரன்/குரு கவலைகளுடன் தொடர்புபடுத்தப்படுகிறது."
    ),
    quickFacts: [
      { label: b("Deity", "தெய்வம்"), value: b("Shiva & Parvati (Kalyana Sundarar)", "சிவன் & பார்வதி (கல்யாண சுந்தரர்)") },
      { label: b("Famous for", "புகழ்"), value: b("Removing marriage delay", "திருமணத் தடை நீக்கம்") },
      { label: b("Best time", "சிறந்த நேரம்"), value: b("Friday / auspicious tithi", "வெள்ளி / நல்ல திதி") },
      { label: b("Visit for", "எதற்காக"), value: b("Timely marriage & a good spouse", "காலத்தில் திருமணம் & நல்ல துணை") },
    ],
    sections: [
      {
        heading: b("What it is", "என்ன என்பது"),
        body: [
          b("Thirumananjeri is a celebrated Shiva-Parvati sthalam famed for blessing timely marriage. The Lord is worshipped here as Kalyana Sundarar, who gave Parvati in marriage — making it one of Tamil Nadu's most sought temples for marriage prayers.", "திருமணஞ்சேரி காலத்தில் திருமணத்தை ஆசீர்வதிப்பதில் புகழ்பெற்ற சிவன்-பார்வதி ஸ்தலம். இங்கு இறைவன் கல்யாண சுந்தரராக — பார்வதியை மணமுடித்து வைத்தவராக — வழிபடப்படுகிறார்; இது தமிழ்நாட்டின் திருமண பிரார்த்தனைகளுக்கு மிகவும் தேடப்படும் கோயில்களில் ஒன்று."),
        ],
      },
      {
        heading: b("What it brings", "என்ன அருளும்"),
        body: [
          b("Devotees pray for removal of marriage delay, a suitable and timely alliance, emotional readiness for marriage, harmony with the spouse, and grace for a settled married life. A small ritual of taking turmeric/kumkum is traditional here.", "திருமணத் தடை நீங்க, பொருத்தமான காலத்தில் வரன், திருமணத்திற்கு மன தயாரிப்பு, துணையுடன் ஒற்றுமை, நிலையான திருமண வாழ்க்கைக்கு அருள் ஆகியவற்றுக்காக பக்தர்கள் பிரார்த்திக்கின்றனர். இங்கு மஞ்சள்/குங்குமம் எடுத்துச்செல்லும் சிறு சடங்கு பாரம்பரியம்."),
        ],
      },
      {
        heading: b("Who should visit", "யார் தரிசிக்க வேண்டும்"),
        body: [
          b("Often visited by those facing marriage delay, repeated broken alliances, or charts flagging the 7th house, Venus, Jupiter, navamsa, or Sevvai/Kalathra dosham. It is best approached alongside honest family communication and a proper porutham check.", "திருமணத் தடை, மீண்டும் உடையும் வரன்கள், அல்லது 7-ஆம் பாவம், சுக்கிரன், குரு, நவாம்சம், அல்லது செவ்வாய்/களத்திர தோஷத்தைச் சுட்டிக்காட்டும் ஜாதகங்கள் உள்ளவர்கள் அடிக்கடி தரிசிக்கின்றனர். நேர்மையான குடும்பப் பேச்சு மற்றும் முறையான பொருத்தம் பார்த்தலுடன் அணுகுவதே சிறந்தது."),
        ],
      },
    ],
    remedies: {
      heading: b("How to worship & plan a visit", "வழிபாடு & தரிசன திட்டம்"),
      intro: b("Marriage prayers work best as devotion plus practical effort — temple grace and a good match go together.", "திருமண பிரார்த்தனைகள் பக்தி + நடைமுறை முயற்சியாக சிறப்பாகப் பயன்படுகின்றன — கோயில் அருளும் நல்ல பொருத்தமும் சேர்ந்தே."),
      items: [
        b("Worship on a Friday or auspicious tithi; take the turmeric/kumkum prasadam with a marriage sankalpam.", "வெள்ளி அல்லது நல்ல திதியில் வழிபடுங்கள்; திருமண சங்கல்பத்துடன் மஞ்சள்/குங்கும பிரசாதத்தைப் பெறுங்கள்."),
        b("Pair the visit with Venus (Friday) and Jupiter (Thursday) worship for harmony and timing.", "ஒற்றுமை & காலத்திற்காக சுக்கிரன் (வெள்ளி) மற்றும் குரு (வியாழன்) வழிபாட்டுடன் தரிசனத்தைச் சேருங்கள்."),
        b("Run a proper marriage porutham and keep family conversation open while you pray.", "முறையான திருமணப் பொருத்தம் பாருங்கள்; பிரார்த்திக்கும்போது குடும்பப் பேச்சைத் திறந்து வையுங்கள்."),
      ],
    },
    faq: [
      { q: b("Is Thirumananjeri really effective for marriage delay?", "திருமணஞ்சேரி திருமணத் தடைக்கு உண்மையில் பயனளிக்குமா?"), a: b("It is one of the most trusted temples for marriage prayers, and many families visit with faith. Its blessing works best alongside practical steps — proper matching and open family communication.", "திருமண பிரார்த்தனைகளுக்கு மிகவும் நம்பப்படும் கோயில்களில் ஒன்று; பல குடும்பங்கள் நம்பிக்கையுடன் தரிசிக்கின்றன. அதன் அருள் நடைமுறை படிகளுடன் — முறையான பொருத்தம் & திறந்த குடும்பப் பேச்சு — சேரும்போது சிறப்பாகப் பயன்படுகிறது.") },
      { q: b("What is the turmeric ritual here?", "இங்குள்ள மஞ்சள் சடங்கு என்ன?"), a: b("Devotees traditionally take blessed turmeric or kumkum from the temple as prasadam, carrying it home as a token of the marriage blessing. Practices vary, so follow the temple's current guidance.", "பக்தர்கள் பாரம்பரியமாக கோயிலிலிருந்து ஆசீர்வதிக்கப்பட்ட மஞ்சள் அல்லது குங்குமத்தை பிரசாதமாகப் பெற்று, திருமண ஆசீர்வாதத்தின் அடையாளமாக வீட்டிற்கு எடுத்துச் செல்கின்றனர். நடைமுறைகள் மாறுபடும்; கோயிலின் தற்போதைய வழிகாட்டலைப் பின்பற்றுங்கள்.") },
      { q: b("Should both families visit?", "இரு குடும்பங்களும் தரிசிக்க வேண்டுமா?"), a: b("It is commonly visited by the person seeking marriage and their family. There is no strict rule — sincerity matters more than who attends.", "திருமணம் தேடுபவரும் அவர்களின் குடும்பமும் பொதுவாக தரிசிக்கின்றனர். கடுமையான விதி இல்லை — யார் வருகிறார்கள் என்பதை விட மனத்தூய்மை முக்கியம்.") },
    ],
    ctaVariant: "marriage-pariharam",
    related: [
      { href: "/pariharam/thirumana-thadai", label: b("Marriage delay pariharam", "திருமணத் தடை பரிகாரம்") },
      { href: "/tools/marriage-porutham-calculator", label: b("Marriage Porutham", "திருமண பொருத்தம்") },
      { href: "/dosham/kalathra-dosham", label: b("Kalathra Dosham", "களத்திர தோஷம்") },
    ],
  },
  "pancha-bhoota-sthalams": {
    slug: "pancha-bhoota-sthalams",
    kind: "temple",
    topic: "temple",
    eyebrow: b("Temple guide · five elements", "கோயில் வழிகாட்டி · ஐந்து பூதங்கள்"),
    title: b("Pancha Bhoota Sthalams", "பஞ்ச பூத ஸ்தலங்கள்"),
    lead: b(
      "The Pancha Bhoota Sthalams are five Shiva temples representing earth, water, fire, air, and space. They are read as sacred reminders of balance between body, mind, karma, and spirit.",
      "பஞ்ச பூத ஸ்தலங்கள் நிலம், நீர், அக்னி, காற்று, ஆகாசம் ஆகிய ஐந்து பூதங்களைக் குறிக்கும் சிவ ஸ்தலங்கள். உடல், மனம், கர்மம், ஆன்மா ஆகியவற்றின் சமநிலையை நினைவூட்டும் புனித இடங்களாக பார்க்கப்படுகின்றன."
    ),
    quickFacts: [
      { label: b("What", "என்ன"), value: b("Five Shiva temples of the elements", "பூதங்களின் ஐந்து சிவ ஸ்தலங்கள்") },
      { label: b("Elements", "பூதங்கள்"), value: b("Earth, water, fire, air, space", "நிலம், நீர், அக்னி, காற்று, ஆகாசம்") },
      { label: b("Theme", "தலைப்பு"), value: b("Inner balance of body & mind", "உடல் & மனதின் உள் சமநிலை") },
      { label: b("Visit for", "எதற்காக"), value: b("Steadiness, contemplation, grace", "நிலைத்தன்மை, தியானம், அருள்") },
    ],
    sections: [
      {
        heading: b("What it is", "என்ன என்பது"),
        body: [
          b("The Pancha Bhoota Sthalams are five Shiva temples that each embody one of the five great elements — earth (Kanchipuram), water (Thiruvanaikaval), fire (Thiruvannamalai), air (Srikalahasti) and space (Chidambaram). Together they map the forces that make up body, mind and creation.", "பஞ்ச பூத ஸ்தலங்கள் ஐந்து பெரும் பூதங்களில் ஒவ்வொன்றையும் உள்ளடக்கிய ஐந்து சிவ ஸ்தலங்கள் — நிலம் (காஞ்சிபுரம்), நீர் (திருவானைக்கா), அக்னி (திருவண்ணாமலை), காற்று (ஸ்ரீகாளஹஸ்தி), ஆகாசம் (சிதம்பரம்). சேர்ந்து, உடல், மனம், படைப்பை உருவாக்கும் சக்திகளை அவை வரைபடமாக்குகின்றன."),
        ],
      },
      {
        heading: b("What it brings", "என்ன அருளும்"),
        body: [
          b("Each element offers a quality to contemplate: earth gives stability, water gives flow, fire gives transformation, air gives movement, and space gives awareness. Worship here is for inner balance and grounding rather than a single material wish.", "ஒவ்வொரு பூதமும் சிந்திக்க ஒரு குணத்தைத் தருகிறது: நிலம் நிலைத்தன்மை, நீர் ஓட்டம், அக்னி மாற்றம், காற்று இயக்கம், ஆகாசம் விழிப்புணர்வு. இங்கு வழிபாடு ஒரே பொருள் விருப்பத்தை விட உள் சமநிலை & நிலைப்புக்கானது."),
        ],
      },
      {
        heading: b("Who should visit", "யார் தரிசிக்க வேண்டும்"),
        body: [
          b("These are for devotees seeking spiritual depth, inner steadiness, and a sense of balance across body and mind. In astrology, elemental tendencies are read through rasi and graha nature — elemental worship supports the chart rather than replacing a specific graha pariharam.", "ஆன்ம ஆழம், உள் நிலைத்தன்மை, உடல் & மனதின் சமநிலை உணர்வு தேடும் பக்தர்களுக்கானவை. ஜோதிடத்தில் பூதப் போக்குகள் ராசி & கிரக தன்மை மூலம் படிக்கப்படுகின்றன — பூத வழிபாடு குறிப்பிட்ட கிரக பரிகாரத்திற்கு மாற்றாக அல்ல, ஜாதகத்தை ஆதரிக்கிறது."),
        ],
      },
    ],
    remedies: {
      heading: b("How to approach a visit", "தரிசனத்தை எப்படி அணுகுவது"),
      intro: b("There is no fixed order; choose by devotion, family tradition, or the quality you most need to steady.", "நிலையான வரிசை இல்லை; பக்தி, குடும்ப மரபு, அல்லது நீங்கள் மிகவும் நிலைப்படுத்த விரும்பும் குணத்தின் அடிப்படையில் தேர்வு செய்யுங்கள்."),
      items: [
        b("Pick the element you most need — e.g. fire (Thiruvannamalai) for transformation, water (Thiruvanaikaval) for emotional flow.", "உங்களுக்கு மிகத் தேவையான பூதத்தைத் தேர்ந்தெடுக்கவும் — எ.கா. மாற்றத்திற்கு அக்னி (திருவண்ணாமலை), உணர்ச்சி ஓட்டத்திற்கு நீர் (திருவானைக்கா)."),
        b("Plan travel and worship with panchangam timing, treating each visit as contemplation, not a checklist.", "பயணம் & வழிபாட்டை பஞ்சாங்க நேரத்துடன் திட்டமிடுங்கள்; ஒவ்வொரு தரிசனத்தையும் பட்டியல் அல்ல, தியானமாகக் கொள்ளுங்கள்."),
        b("Pair the pilgrimage with steady daily practice so the inner balance carries into ordinary life.", "உள் சமநிலை சாதாரண வாழ்வில் தொடர, யாத்திரையை நிலையான தினசரி நடைமுறையுடன் சேருங்கள்."),
      ],
    },
    faq: [
      { q: b("Do I have to visit all five temples?", "ஐந்து கோயில்களையும் தரிசிக்க வேண்டுமா?"), a: b("No. Many devotees visit one or a few, choosing the element they most need. Completing all five is a meaningful pilgrimage but not a requirement.", "இல்லை. பல பக்தர்கள் மிகத் தேவையான பூதத்தைத் தேர்ந்து, ஒன்றை அல்லது சிலவற்றைத் தரிசிக்கின்றனர். ஐந்தையும் முடிப்பது பொருள்மிக்க யாத்திரை; ஆனால் கட்டாயமல்ல.") },
      { q: b("Are these linked to a particular planet?", "இவை குறிப்பிட்ட கிரகத்துடன் இணைந்தவையா?"), a: b("Not directly — they represent the five elements rather than the navagrahas. They support overall elemental balance and are read as complementary to chart-specific graha remedies.", "நேரடியாக அல்ல — அவை நவகிரகங்களை விட ஐந்து பூதங்களைக் குறிக்கின்றன. அவை ஒட்டுமொத்த பூத சமநிலையை ஆதரித்து, ஜாதக கிரக பரிகாரங்களுக்கு துணையாகப் படிக்கப்படுகின்றன.") },
      { q: b("What order should I visit them in?", "எந்த வரிசையில் தரிசிக்க வேண்டும்?"), a: b("There is no mandatory order. Devotion, convenience and the quality you wish to strengthen are the usual guides; plan practical travel by region and panchangam.", "கட்டாய வரிசை இல்லை. பக்தி, வசதி, நீங்கள் வலுப்படுத்த விரும்பும் குணம் வழக்கமான வழிகாட்டிகள்; பகுதி & பஞ்சாங்கப்படி நடைமுறைப் பயணத்தைத் திட்டமிடுங்கள்.") },
    ],
    ctaVariant: "temple",
    related: [
      { href: "/temples", label: b("Temple index", "கோயில் பட்டியல்") },
      { href: "/tools/daily-panchangam-planner", label: b("Panchangam planner", "பஞ்சாங்க திட்டம்") },
      { href: "/features/timing-and-decisions", label: b("Timing guidance", "நேர வழிகாட்டல்") },
    ],
  },
  "arupadai-veedu": {
    slug: "arupadai-veedu",
    kind: "temple",
    topic: "temple",
    eyebrow: b("Temple guide · Murugan", "கோயில் வழிகாட்டி · முருகன்"),
    title: b("Arupadai Veedu", "அறுபடை வீடு"),
    lead: b(
      "Arupadai Veedu refers to the six sacred abodes of Lord Murugan. Devotees seek courage, victory, wisdom, protection, and grace for overcoming Mars-like struggle.",
      "அறுபடை வீடு என்பது முருகப்பெருமானின் ஆறு புனித ஸ்தலங்களை குறிக்கிறது. தைரியம், வெற்றி, ஞானம், பாதுகாப்பு, செவ்வாய் போன்ற போராட்டங்களை கடக்கும் அருள் ஆகியவற்றுக்காக பக்தர்கள் தரிசிக்கின்றனர்."
    ),
    quickFacts: [
      { label: b("What", "என்ன"), value: b("Six sacred abodes of Lord Murugan", "முருகனின் ஆறு புனித ஸ்தலங்கள்") },
      { label: b("Deity", "தெய்வம்"), value: b("Murugan (Skanda / Kartikeya)", "முருகன் (ஸ்கந்தன் / கார்த்திகேயன்)") },
      { label: b("Best time", "சிறந்த நேரம்"), value: b("Tuesday, Krittika, Shashti", "செவ்வாய், கார்த்திகை, சஷ்டி") },
      { label: b("Visit for", "எதற்காக"), value: b("Courage, victory, protection, focus", "தைரியம், வெற்றி, பாதுகாப்பு, கவனம்") },
    ],
    sections: [
      {
        heading: b("What it is", "என்ன என்பது"),
        body: [
          b("Arupadai Veedu refers to the six sacred battle-camps (abodes) of Lord Murugan in Tamil Nadu — Thiruparankundram, Thiruchendur, Palani, Swamimalai, Thiruthani and Pazhamudircholai. Together they form the heart of Tamil Murugan devotion.", "அறுபடை வீடு என்பது தமிழ்நாட்டில் உள்ள முருகப்பெருமானின் ஆறு புனித படை வீடுகள் — திருப்பரங்குன்றம், திருச்செந்தூர், பழனி, சுவாமிமலை, திருத்தணி, பழமுதிர்ச்சோலை. சேர்ந்து, தமிழ் முருக பக்தியின் இதயத்தை அவை உருவாக்குகின்றன."),
        ],
      },
      {
        heading: b("What it brings", "என்ன அருளும்"),
        body: [
          b("Murugan blesses courage, discipline, wisdom and youthful energy, victory over inner confusion and outer obstacles, and protection in difficult times. Each abode carries its own story — from Palani's renunciation to Thiruchendur's victory over evil.", "முருகன் தைரியம், ஒழுக்கம், ஞானம், இளமைச் சக்தி, உள் குழப்பம் & வெளித் தடைகளின் மீது வெற்றி, கடின காலங்களில் பாதுகாப்பு ஆகியவற்றை ஆசீர்வதிக்கிறார். ஒவ்வொரு ஸ்தலமும் தனிக் கதையைக் கொண்டது — பழனியின் துறவிலிருந்து திருச்செந்தூரின் தீமை மீதான வெற்றி வரை."),
        ],
      },
      {
        heading: b("Who should visit", "யார் தரிசிக்க வேண்டும்"),
        body: [
          b("Often visited for courage and confidence, success in competition and exams, protection during a difficult dasha, sibling matters, and as a Mars-related devotional support — Murugan being closely linked to the strength and discipline of Sevvai.", "தைரியம் & நம்பிக்கை, போட்டி & தேர்வு வெற்றி, கடின தசையில் பாதுகாப்பு, சகோதர விஷயம், செவ்வாய் தொடர்பான பக்தி ஆதரவு ஆகியவற்றுக்காக அடிக்கடி தரிசிக்கப்படுகிறது — முருகன் செவ்வாயின் பலம் & ஒழுக்கத்துடன் நெருக்கமாக இணைந்தவர்."),
        ],
      },
    ],
    remedies: {
      heading: b("How to worship & plan a visit", "வழிபாடு & தரிசன திட்டம்"),
      intro: b("Murugan worship rewards discipline and devotion; vows (vratham) and simple offerings are central.", "முருகன் வழிபாடு ஒழுக்கம் & பக்திக்கு வெகுமதி அளிக்கிறது; விரதம் & எளிய நைவேத்யம் மையமானவை."),
      items: [
        b("Worship on Tuesdays, Krittika nakshathiram, Shashti, and Murugan festivals like Thaipusam and Skanda Shashti.", "செவ்வாய், கார்த்திகை நட்சத்திரம், சஷ்டி, தைப்பூசம் & கந்த சஷ்டி போன்ற முருகன் திருவிழாக்களில் வழிபடுங்கள்."),
        b("Keep a simple Shashti vratham or Kavadi vow for courage and to fulfil a heartfelt prayer.", "தைரியத்திற்கும் மனமார்ந்த பிரார்த்தனை நிறைவேறவும் எளிய சஷ்டி விரதம் அல்லது காவடி நேர்த்திக்கடனை வையுங்கள்."),
        b("Choose the abode by family tradition, the prayer's nature, or practical travel — there is no fixed order.", "ஸ்தலத்தை குடும்ப மரபு, பிரார்த்தனையின் தன்மை, அல்லது நடைமுறைப் பயணத்தால் தேர்ந்தெடுங்கள் — நிலையான வரிசை இல்லை."),
      ],
    },
    faq: [
      { q: b("Do I need to visit all six abodes?", "ஆறு படை வீடுகளையும் தரிசிக்க வேண்டுமா?"), a: b("No. Completing all six is a cherished pilgrimage, but most devotees visit the abodes closest to them or tied to their family tradition. Sincerity matters more than completeness.", "இல்லை. ஆறையும் முடிப்பது போற்றப்படும் யாத்திரை; ஆனால் பெரும்பாலான பக்தர்கள் தங்களுக்கு அருகிலான அல்லது குடும்ப மரபுடன் இணைந்த ஸ்தலங்களைத் தரிசிக்கின்றனர். முழுமையை விட மனத்தூய்மை முக்கியம்.") },
      { q: b("Why is Murugan linked to Mars in astrology?", "ஜோதிடத்தில் முருகன் ஏன் செவ்வாயுடன் இணைக்கப்படுகிறார்?"), a: b("Murugan embodies courage, discipline and victory — the higher qualities of Mars (Sevvai). His worship is therefore a common devotional support for Sevvai strength and Sevvai dosham concerns.", "முருகன் தைரியம், ஒழுக்கம், வெற்றியை — செவ்வாயின் உயர் குணங்களை — உள்ளடக்குகிறார். எனவே அவரது வழிபாடு செவ்வாய் பலம் & செவ்வாய் தோஷ கவலைகளுக்கு பொதுவான பக்தி ஆதரவு.") },
      { q: b("When are the best festivals to visit?", "தரிசிக்க சிறந்த திருவிழாக்கள் எப்போது?"), a: b("Thaipusam, Skanda Shashti, Panguni Uthiram and Krittika days draw huge devotion, though they are also crowded. Tuesdays and Shashti tithis are good for quieter regular worship.", "தைப்பூசம், கந்த சஷ்டி, பங்குனி உத்திரம், கார்த்திகை நாட்கள் பெரும் பக்தியை ஈர்க்கின்றன; ஆனால் கூட்டமாகவும் இருக்கும். அமைதியான வழக்கமான வழிபாட்டுக்கு செவ்வாய் & சஷ்டி திதிகள் நல்லவை.") },
    ],
    ctaVariant: "temple",
    related: [
      { href: "/dosham/sevvai-dosham", label: b("Sevvai Dosham", "செவ்வாய் தோஷம்") },
      { href: "/temples/vaitheeswaran-koil", label: b("Vaitheeswaran Koil", "வைத்தீஸ்வரன் கோயில்") },
      { href: "/pariharam", label: b("Pariharam", "பரிகாரம்") },
    ],
  },
};

export const PARIHARAM_DETAILS: Record<string, GuideDetail> = {
  "rahu-ketu-pariharam": {
    slug: "rahu-ketu-pariharam",
    kind: "pariharam",
    topic: "pariharam",
    eyebrow: b("Pariharam guide · Rahu-Ketu", "பரிகார வழிகாட்டி · ராகு-கேது"),
    title: b("Rahu-Ketu Pariharam", "ராகு-கேது பரிகாரம்"),
    lead: b(
      "Rahu-Ketu pariharam is devotional practice taken up when the nodal axis is afflicting the chart through dasha, transit, or sensitive houses. It is meant to bring steadiness, not to chase fear away.",
      "தசை, கோச்சாரம் அல்லது முக்கிய பாவங்கள் வழியாக ராகு-கேது அச்சு ஜாதகத்தை பாதிக்கும் போது மேற்கொள்ளப்படும் பக்தி நடைமுறையே ராகு-கேது பரிகாரம். இது பயத்தை விரட்ட அல்ல; மன உறுதியை தர."
    ),
    quickFacts: [
      { label: b("For", "எதற்கு"), value: b("Rahu-Ketu affliction & nodal pressure", "ராகு-கேது பாதிப்பு & அச்சு அழுத்தம்") },
      { label: b("Planets", "கிரகங்கள்"), value: b("Rahu & Ketu (the nodes)", "ராகு & கேது (நோடுகள்)") },
      { label: b("Main remedies", "முக்கிய பரிகாரம்"), value: b("Node temple worship, naga prarthana", "நோடு கோயில் வழிபாடு, நாக பிரார்த்தனை") },
      { label: b("Most needed in", "மிகத் தேவை"), value: b("Rahu/Ketu dasha-bhukti", "ராகு/கேது தசை-புத்தி") },
    ],
    sections: [
      {
        heading: b("What it is", "என்ன என்பது"),
        body: [
          b("Rahu-Ketu pariharam is devotional practice taken up when the lunar nodes pressure the chart — through their dasha, transits, or contact with sensitive houses. Its aim is steadiness and clarity, not chasing away fear.",
            "தசை, கோச்சாரம் அல்லது முக்கிய பாவத் தொடர்பு வழியாக சந்திப்பு புள்ளிகள் ஜாதகத்தை அழுத்தும்போது மேற்கொள்ளப்படும் பக்தி நடைமுறையே ராகு-கேது பரிகாரம். அதன் இலக்கு பயத்தை விரட்டுவது அல்ல, மன உறுதியும் தெளிவும்."),
        ],
      },
      {
        heading: b("What it helps with", "எதற்கு உதவுகிறது"),
        body: [
          b("It is used to ease confusion and restlessness, sudden obstacles, naga dosham, and the disruptive side of Rahu-Ketu, while helping the person channel the nodes' intensity into focus and disciplined ambition.",
            "குழப்பம் & அமைதியின்மை, திடீர் தடைகள், நாக தோஷம், ராகு-கேதுவின் குலைக்கும் பக்கம் ஆகியவற்றை இலகுவாக்க இது பயன்படுகிறது; அதே நேரம் நோடுகளின் தீவிரத்தை கவனம் & ஒழுக்கமான லட்சியமாக மாற்ற உதவுகிறது."),
        ],
      },
      {
        heading: b("Who should consider it", "யார் கருத வேண்டும்"),
        body: [
          b("Usually taken up during Rahu or Ketu dasha-bhukti, when the nodes afflict the Lagna, Moon, 5th or 7th house, or when Sarpa / Kala Sarpa patterns are active. Read the chart first so the practice matches the actual pressure, not fear.",
            "வழக்கமாக ராகு அல்லது கேது தசை-புத்தியில், நோடுகள் லக்னம், சந்திரன், 5 அல்லது 7-ஆம் பாவத்தைப் பாதிக்கும்போது, அல்லது சர்ப்ப / கால சர்ப்ப அமைப்பு செயல்படும்போது மேற்கொள்ளப்படுகிறது. பயத்தை அல்ல, உண்மையான அழுத்தத்தைப் பரிகாரம் பொருந்த, முதலில் ஜாதகத்தைப் பாருங்கள்."),
        ],
      },
    ],
    remedies: {
      heading: b("The remedies", "பரிகாரங்கள்"),
      intro: b("These work best as steady, consistent devotion matched to the active node — discipline, not panic.", "செயல்படும் நோடுக்கு ஏற்ற, நிலையான தொடர்ச்சியான பக்தியாக இவை சிறப்பாகப் பயன்படுகின்றன — பதற்றம் அல்ல, ஒழுக்கம்."),
      items: [
        b("Worship Rahu at Thirunageswaram and Ketu at Keezhaperumpallam, with naga prarthana.", "திருநாகேஸ்வரத்தில் ராகுவையும் கீழப்பெரும்பள்ளத்தில் கேதுவையும் நாக பிரார்த்தனையுடன் வழிபடுங்கள்."),
        b("Add Durga or Bhairava worship and a steady mantra recitation handed down in the family.", "துர்கா அல்லது பைரவர் வழிபாடு மற்றும் குடும்பத்தில் வழங்கப்படும் தொடர்ந்த மந்திர ஜெபத்தைச் சேருங்கள்."),
        b("Keep the practice consistent through the nodal period and pair it with focused, disciplined work.", "நோடு காலம் முழுவதும் நடைமுறையை தொடர்ந்து வைத்து, கவனம் செலுத்திய ஒழுக்கமான உழைப்புடன் சேருங்கள்."),
      ],
    },
    faq: [
      { q: b("Which node's remedy do I need — Rahu or Ketu?", "எந்த நோடின் பரிகாரம் தேவை — ராகு அல்லது கேது?"), a: b("It depends on which node is stronger or more afflicting in your chart and which dasha is running. Both are often addressed together since they share one axis, but the emphasis follows the active node.", "உங்கள் ஜாதகத்தில் எந்த நோடு வலுவாக அல்லது அதிகம் பாதிக்கிறது, எந்த தசை நடக்கிறது என்பதைப் பொறுத்தது. ஒரே அச்சைப் பகிர்வதால் இரண்டும் சேர்த்துக் கையாளப்படும்; ஆனால் முக்கியத்துவம் செயல்படும் நோடைப் பின்தொடரும்.") },
      { q: b("How long should I continue?", "எவ்வளவு காலம் தொடர வேண்டும்?"), a: b("Treat it as steady devotion through the Rahu-Ketu period rather than a one-time ritual. Consistency over months matters more than an elaborate single ceremony.", "ஒரே சடங்காக அல்ல, ராகு-கேது காலம் முழுவதும் நிலையான பக்தியாகக் கொள்ளுங்கள். விரிவான ஒற்றை சடங்கை விட மாதங்களாக தொடர்ச்சியே முக்கியம்.") },
      { q: b("Will it remove all my problems instantly?", "இது என் எல்லா பிரச்சினைகளையும் உடனே நீக்குமா?"), a: b("No remedy is an instant fix. Pariharam steadies the mind and supports better choices; combine it with practical action in the affected area of life.", "எந்த பரிகாரமும் உடனடித் தீர்வு அல்ல. பரிகாரம் மனதை அமைதிப்படுத்தி சிறந்த தேர்வுகளை ஆதரிக்கிறது; பாதிக்கப்பட்ட வாழ்க்கைத் துறையில் நடைமுறை செயலுடன் சேருங்கள்.") },
    ],
    ctaVariant: "pariharam",
    related: [
      { href: "/dosham/naga-sarpa-dosham", label: b("Naga / Sarpa Dosham", "நாக / சர்ப்ப தோஷம்") },
      { href: "/temples/thirunageswaram", label: b("Thirunageswaram Rahu temple", "திருநாகேஸ்வரம் ராகு கோயில்") },
      { href: "/temples/keezhaperumpallam", label: b("Keezhaperumpallam Ketu temple", "கீழப்பெரும்பள்ளம் கேது கோயில்") },
    ],
  },
  "sevvai-dosha-pariharam": {
    slug: "sevvai-dosha-pariharam",
    kind: "pariharam",
    topic: "pariharam",
    eyebrow: b("Pariharam guide · Mars", "பரிகார வழிகாட்டி · செவ்வாய்"),
    title: b("Sevvai Dosham Pariharam", "செவ்வாய் தோஷ பரிகாரம்"),
    lead: b(
      "Sevvai dosham pariharam is devotional practice for softening Mars affliction in marriage, health, or temperament. It should follow a real reading of how strong the dosham is, and whether it is cancelled.",
      "திருமணம், ஆரோக்கியம் அல்லது குணத்தில் செவ்வாய் பாதிப்பை மென்மையாக்கும் பக்தி நடைமுறையே செவ்வாய் தோஷ பரிகாரம். தோஷம் எவ்வளவு வலிமையானது, ரத்தாகிறதா என்பதை உண்மையாகப் படித்த பிறகே மேற்கொள்ள வேண்டும்."
    ),
    quickFacts: [
      { label: b("For", "எதற்கு"), value: b("Mars affliction in marriage, health, temper", "திருமணம், ஆரோக்கியம், குணத்தில் செவ்வாய் பாதிப்பு") },
      { label: b("Planet", "கிரகம்"), value: b("Sevvai / Angaraka (Mars)", "செவ்வாய் / அங்காரகன்") },
      { label: b("Main remedies", "முக்கிய பரிகாரம்"), value: b("Murugan & Angaraka worship, Vaitheeswaran Koil", "முருகன் & அங்காரக வழிபாடு, வைத்தீஸ்வரன் கோயில்") },
      { label: b("First step", "முதல் படி"), value: b("Confirm the dosham & check cancellation", "தோஷத்தை உறுதி & ரத்து பார்த்தல்") },
    ],
    sections: [
      {
        heading: b("What it is", "என்ன என்பது"),
        body: [
          b("Sevvai (Mangal) dosham pariharam is devotional practice for softening Mars's pressure on marriage, health or temperament. Crucially, it should follow a real reading of how strong the dosham is — and whether it is already cancelled.",
            "திருமணம், ஆரோக்கியம் அல்லது குணத்தில் செவ்வாயின் அழுத்தத்தை மென்மையாக்கும் பக்தி நடைமுறையே செவ்வாய் (மங்கள) தோஷ பரிகாரம். முக்கியமாக, தோஷம் எவ்வளவு வலிமையானது — ஏற்கனவே ரத்தாகிறதா — என்பதை உண்மையாகப் படித்த பிறகே மேற்கொள்ள வேண்டும்."),
        ],
      },
      {
        heading: b("What it helps with", "எதற்கு உதவுகிறது"),
        body: [
          b("It is used to ease marriage delay or friction linked to Mars, to support health where Sevvai is involved, and to channel a fiery temperament into courage and steadiness. The remedy brings confidence rather than removing marriage from the table.",
            "செவ்வாயுடன் தொடர்புடைய திருமணத் தாமதம் அல்லது உராய்வை இலகுவாக்க, செவ்வாய் சம்பந்தப்பட்ட ஆரோக்கியத்தை ஆதரிக்க, தீ போன்ற குணத்தை தைரியம் & மன உறுதியாக மாற்ற இது பயன்படுகிறது. பரிகாரம் திருமணத்தை நீக்காமல் நம்பிக்கையைத் தருகிறது."),
        ],
      },
      {
        heading: b("Who should consider it", "யார் கருத வேண்டும்"),
        body: [
          b("Consider it once the chart confirms Mars genuinely afflicts the marriage houses (1, 2, 4, 7, 8, 12), and after checking whether strength, aspects or matching cancellations already reduce it. Many Sevvai dosham cases turn out mild or cancelled.",
            "செவ்வாய் உண்மையில் திருமண பாவங்களை (1, 2, 4, 7, 8, 12) பாதிக்கிறது என ஜாதகம் உறுதி செய்தபின், பலம், பார்வை அல்லது பொருத்த ரத்து ஏற்கனவே அதைக் குறைக்கிறதா எனப் பார்த்தபின் கருதுங்கள். பல செவ்வாய் தோஷ வழக்குகள் மிதமானவை அல்லது ரத்தானவையாக மாறுகின்றன."),
        ],
      },
    ],
    remedies: {
      heading: b("The remedies", "பரிகாரங்கள்"),
      intro: b("Use these only when Mars is genuinely the active pressure; pair marriage prayers with proper porutham, not the dosham label alone.", "செவ்வாய் உண்மையில் செயல்படும் அழுத்தமாக இருந்தால் மட்டுமே இவற்றைப் பயன்படுத்துங்கள்; திருமண பிரார்த்தனைகளை தோஷ முத்திரையை மட்டும் அல்ல, முறையான பொருத்தத்துடன் சேருங்கள்."),
      items: [
        b("Worship Murugan or Angaraka on Tuesdays with red offerings; visit Vaitheeswaran Koil.", "செவ்வாய்க்கிழமைகளில் முருகன் அல்லது அங்காரகரை சிவப்பு நைவேத்யத்துடன் வழிபடுங்கள்; வைத்தீஸ்வரன் கோயிலைத் தரிசியுங்கள்."),
        b("Add Hanuman worship for courage and a steady Mars mantra recitation.", "தைரியத்திற்காக அனுமன் வழிபாடு மற்றும் தொடர்ந்த செவ்வாய் மந்திர ஜெபத்தைச் சேருங்கள்."),
        b("For marriage, run a full porutham and weigh maturity and compatibility, not the dosham in isolation.", "திருமணத்திற்கு, முழு பொருத்தம் பாருங்கள்; தோஷத்தைத் தனியாக அல்ல, முதிர்ச்சி & பொருத்தத்தை எடைபோடுங்கள்."),
      ],
    },
    faq: [
      { q: b("Must both partners have Sevvai dosham to marry?", "திருமணம் செய்ய இருவருக்கும் செவ்வாய் தோஷம் இருக்க வேண்டுமா?"), a: b("That is a common belief, but matching is more nuanced. A dosham in one chart can be balanced by the other's strength or a matching dosham. A proper porutham, not a single label, should guide the decision.", "இது பொதுவான நம்பிக்கை; ஆனால் பொருத்தம் நுணுக்கமானது. ஒரு ஜாதகத்தில் உள்ள தோஷம் மற்றொன்றின் பலத்தால் அல்லது பொருந்தும் தோஷத்தால் சமன் செய்யப்படலாம். ஒற்றை முத்திரை அல்ல, முறையான பொருத்தமே முடிவை வழிநடத்த வேண்டும்.") },
      { q: b("Does the dosham reduce with age?", "வயதுடன் தோஷம் குறையுமா?"), a: b("It is traditionally held that Mars's intensity eases somewhat after a certain age, and maturity helps. Still, the chart's strength and cancellations matter more than age alone.", "ஒரு குறிப்பிட்ட வயதுக்குப் பின் செவ்வாயின் தீவிரம் ஓரளவு குறையும், முதிர்ச்சி உதவும் என்று பாரம்பரியமாகக் கருதப்படுகிறது. இருப்பினும், வயதை விட ஜாதகத்தின் பலமும் ரத்தும் முக்கியம்.") },
      { q: b("Can remedies fully cancel Sevvai dosham?", "பரிகாரங்கள் செவ்வாய் தோஷத்தை முழுமையாக ரத்து செய்யுமா?"), a: b("Remedies bring steadiness and confidence rather than erasing a placement. Where the chart already has natural cancellation, the concern is small to begin with; devotion then supports a calm, mature marriage.", "பரிகாரங்கள் ஒரு அமைப்பை அழிப்பதை விட மன உறுதியையும் நம்பிக்கையையும் தருகின்றன. ஜாதகத்தில் ஏற்கனவே இயற்கை ரத்து இருந்தால், கவலை தொடக்கத்திலேயே சிறியது; பக்தி அமைதியான முதிர்ந்த திருமணத்தை ஆதரிக்கிறது.") },
    ],
    ctaVariant: "pariharam",
    related: [
      { href: "/dosham/sevvai-dosham", label: b("Sevvai Dosham", "செவ்வாய் தோஷம்") },
      { href: "/temples/vaitheeswaran-koil", label: b("Vaitheeswaran Koil", "வைத்தீஸ்வரன் கோயில்") },
      { href: "/tools/marriage-porutham-calculator", label: b("Marriage Porutham", "திருமண பொருத்தம்") },
    ],
  },
  "naga-dosha-pariharam": {
    slug: "naga-dosha-pariharam",
    kind: "pariharam",
    topic: "pariharam",
    eyebrow: b("Pariharam guide · serpent dosham", "பரிகார வழிகாட்டி · சர்ப்ப தோஷம்"),
    title: b("Naga Dosham Pariharam", "நாக தோஷ பரிகாரம்"),
    lead: b(
      "Naga dosham pariharam is taken up for serpent-related afflictions often linked with childbirth delay, the 5th house, and Rahu-Ketu. It is devotional and patient, not a one-day fix.",
      "சந்தான தாமதம், 5-ஆம் பாவம், ராகு-கேது ஆகியவற்றுடன் தொடர்புடைய சர்ப்ப பாதிப்புகளுக்கு மேற்கொள்ளப்படும் பரிகாரமே நாக தோஷ பரிகாரம். இது பக்தியுடன், பொறுமையுடன் செய்வது; ஒரே நாள் தீர்வு அல்ல."
    ),
    quickFacts: [
      { label: b("For", "எதற்கு"), value: b("Serpent dosham, often childbirth delay", "சர்ப்ப தோஷம், பெரும்பாலும் சந்தான தாமதம்") },
      { label: b("Houses watched", "பார்க்கும் பாவங்கள்"), value: b("5th house, 5th lord, Jupiter, Rahu-Ketu", "5-ஆம் பாவம், 5-ஆம் அதிபதி, குரு, ராகு-கேது") },
      { label: b("Main remedies", "முக்கிய பரிகாரம்"), value: b("Naga prarthana, abhishekam, node temples", "நாக பிரார்த்தனை, அபிஷேகம், நோடு கோயில்கள்") },
      { label: b("Approach", "அணுகுமுறை"), value: b("Patient devotion + medical care", "பொறுமை + மருத்துவம்") },
    ],
    sections: [
      {
        heading: b("What it is", "என்ன என்பது"),
        body: [
          b("Naga dosham pariharam is devotional practice for serpent-related afflictions, most often linked with childbirth delay, the 5th house and the Rahu-Ketu axis. It is a patient, ongoing practice rather than a one-day fix.",
            "சர்ப்ப தொடர்பான பாதிப்புகளுக்கு — பெரும்பாலும் சந்தான தாமதம், 5-ஆம் பாவம், ராகு-கேது அச்சுடன் இணைந்த — மேற்கொள்ளப்படும் பக்தி நடைமுறையே நாக தோஷ பரிகாரம். இது ஒரே நாள் தீர்வு அல்ல, பொறுமையான தொடர் நடைமுறை."),
        ],
      },
      {
        heading: b("What it helps with", "எதற்கு உதவுகிறது"),
        body: [
          b("It is taken up mainly to support childbirth and the 5th house of children and good fortune, and to ease recurring family obstacles tied to serpent dosham. It brings hope and steadiness while the chart and medical timing do their part.",
            "முக்கியமாக சந்தானம் மற்றும் சந்தானம் & பாக்கியம் தரும் 5-ஆம் பாவத்தை ஆதரிக்க, சர்ப்ப தோஷத்துடன் தொடர்புடைய மீண்டும் வரும் குடும்பத் தடைகளை இலகுவாக்க மேற்கொள்ளப்படுகிறது. ஜாதகமும் மருத்துவ காலமும் தங்கள் பங்கை செய்யும்போது இது நம்பிக்கையையும் மன உறுதியையும் தருகிறது."),
        ],
      },
      {
        heading: b("Who should consider it", "யார் கருத வேண்டும்"),
        body: [
          b("Consider it when the 5th house, 5th lord, Jupiter or Rahu-Ketu show serpent-dosham patterns, especially alongside childbirth concerns or repeated family obstacles. A strong 5th house or benefic Jupiter often softens the dosham, so set expectations from the full chart.",
            "5-ஆம் பாவம், 5-ஆம் அதிபதி, குரு அல்லது ராகு-கேது சர்ப்ப தோஷ அமைப்பைக் காட்டும்போது, குறிப்பாக சந்தான கவலை அல்லது மீண்டும் வரும் குடும்பத் தடைகளுடன் இருக்கும்போது கருதுங்கள். வலிமையான 5-ஆம் பாவம் அல்லது சுப குரு பெரும்பாலும் தோஷத்தை மென்மையாக்குகிறது; எனவே முழு ஜாதகத்திலிருந்து எதிர்பார்ப்பை அமையுங்கள்."),
        ],
      },
    ],
    remedies: {
      heading: b("The remedies", "பரிகாரங்கள்"),
      intro: b("Keep them patient and devotional, and — for childbirth concerns — always alongside proper medical care.", "இவற்றை பொறுமையாகவும் பக்தியுடனும் வையுங்கள்; சந்தான கவலைகளுக்கு எப்போதும் முறையான மருத்துவ பராமரிப்புடன் சேருங்கள்."),
      items: [
        b("Offer naga prarthana and milk abhishekam to naga deities; worship at Thirunageswaram and Keezhaperumpallam.", "நாக பிரார்த்தனை மற்றும் நாக தெய்வங்களுக்கு பால் அபிஷேகம் செய்யுங்கள்; திருநாகேஸ்வரம் & கீழப்பெரும்பள்ளத்தில் வழிபடுங்கள்."),
        b("Where family tradition prescribes it, perform Sarpa Samskara, with steady family prayer on Panchami days.", "குடும்ப மரபு கூறும் இடத்தில் சர்ப்ப சம்ஸ்காரம் செய்யுங்கள்; பஞ்சமி நாட்களில் தொடர்ந்த குடும்ப பிரார்த்தனையுடன்."),
        b("Strengthen Jupiter for the 5th house, and for childbirth combine devotion with medical guidance.", "5-ஆம் பாவத்திற்கு குருவை பலப்படுத்துங்கள்; சந்தானத்திற்கு பக்தியை மருத்துவ ஆலோசனையுடன் சேருங்கள்."),
      ],
    },
    faq: [
      { q: b("Will Naga dosham pariharam help us conceive?", "நாக தோஷ பரிகாரம் கருத்தரிக்க உதவுமா?"), a: b("Many families take it up with faith for childbirth blessings. It supports hope and steadiness, but it should always go alongside proper medical care, not replace it.", "சந்தான ஆசீர்வாதத்திற்காக பல குடும்பங்கள் நம்பிக்கையுடன் இதை மேற்கொள்கின்றன. இது நம்பிக்கையையும் மன உறுதியையும் ஆதரிக்கிறது; ஆனால் எப்போதும் முறையான மருத்துவ பராமரிப்புடன் சேர வேண்டும், மாற்றாக அல்ல.") },
      { q: b("What is Sarpa Samskara?", "சர்ப்ப சம்ஸ்காரம் என்றால் என்ன?"), a: b("It is a specific serpent-dosham ritual prescribed in some traditions (notably at certain temples). Whether it applies depends on the chart and family practice, so seek proper guidance before undertaking it.", "இது சில மரபுகளில் (குறிப்பாக சில கோயில்களில்) பரிந்துரைக்கப்படும் குறிப்பிட்ட சர்ப்ப தோஷ சடங்கு. இது பொருந்துமா என்பது ஜாதகம் & குடும்ப நடைமுறையைப் பொறுத்தது; எனவே மேற்கொள்வதற்கு முன் முறையான வழிகாட்டலைப் பெறுங்கள்.") },
      { q: b("How soon will we see results?", "எவ்வளவு விரைவில் பலன் தெரியும்?"), a: b("There is no fixed timeline. The dosham eases as the supportive dasha and the 5th house come into play; patience and consistency are part of the practice.", "நிலையான கால அட்டவணை இல்லை. ஆதரவான தசையும் 5-ஆம் பாவமும் செயல்படும்போது தோஷம் இலகுவாகிறது; பொறுமையும் தொடர்ச்சியும் நடைமுறையின் பகுதி.") },
    ],
    ctaVariant: "pariharam",
    related: [
      { href: "/dosham/naga-sarpa-dosham", label: b("Naga / Sarpa Dosham", "நாக / சர்ப்ப தோஷம்") },
      { href: "/pariharam/puthra-pariharam", label: b("Puthra pariharam", "புத்திர பரிகாரம்") },
      { href: "/temples/keezhaperumpallam", label: b("Ketu temple", "கேது கோயில்") },
    ],
  },
  "kadan-pariharam": {
    slug: "kadan-pariharam",
    kind: "pariharam",
    topic: "pariharam",
    eyebrow: b("Pariharam guide · debt relief", "பரிகார வழிகாட்டி · கடன் நிவாரணம்"),
    title: b("Kadan (Debt) Pariharam", "கடன் பரிகாரம்"),
    lead: b(
      "Kadan pariharam is devotional support for relief from debt and money strain, read through the 6th, 8th, 11th, and 2nd houses along with practical financial discipline.",
      "6, 8, 11, 2-ஆம் பாவங்கள் மூலம் படிக்கப்படும் கடன் மற்றும் பண நெருக்கடியில் இருந்து நிவாரணம் தர மேற்கொள்ளப்படும் பக்தி ஆதரவே கடன் பரிகாரம்; நடைமுறை நிதி ஒழுக்கத்துடன் சேர்ந்தது."
    ),
    quickFacts: [
      { label: b("For", "எதற்கு"), value: b("Debt & money strain", "கடன் & பண நெருக்கடி") },
      { label: b("Houses watched", "பார்க்கும் பாவங்கள்"), value: b("6th, 8th, 2nd, 11th & their lords", "6, 8, 2, 11 & அவற்றின் அதிபதிகள்") },
      { label: b("Main remedies", "முக்கிய பரிகாரம்"), value: b("Rina Vimochana & Lakshmi-Kubera worship", "ரிண விமோசன & லட்சுமி-குபேர வழிபாடு") },
      { label: b("Pair with", "சேர்க்க"), value: b("Budgeting & repayment discipline", "வரவு-செலவு & திருப்பிச் செலுத்தும் ஒழுக்கம்") },
    ],
    sections: [
      {
        heading: b("What it is", "என்ன என்பது"),
        body: [
          b("Kadan pariharam is devotional support for relief from debt and money strain. In the chart, debt is read through the 6th house (loans and liabilities), 8th house (sudden losses) and the 2nd and 11th (income and gains) — and the remedy is meant to work hand-in-hand with practical financial discipline.",
            "கடன் மற்றும் பண நெருக்கடியில் இருந்து நிவாரணம் தர மேற்கொள்ளப்படும் பக்தி ஆதரவே கடன் பரிகாரம். ஜாதகத்தில் கடன் 6-ஆம் பாவம் (கடன் & பொறுப்பு), 8-ஆம் பாவம் (திடீர் இழப்பு), 2 & 11 (வருமானம் & லாபம்) மூலம் படிக்கப்படுகிறது — பரிகாரம் நடைமுறை நிதி ஒழுக்கத்துடன் கைகோர்த்து செயல்படும்."),
        ],
      },
      {
        heading: b("What it helps with", "எதற்கு உதவுகிறது"),
        body: [
          b("It is taken up to ease the mental weight of debt, to invite gains and steady income, and to bring the calm and discipline needed to climb out of liabilities. The devotion supports clear thinking; the repayment is still your work.",
            "கடனின் மன எடையை இலகுவாக்க, லாபம் & நிலையான வருமானத்தை வரவழைக்க, பொறுப்புகளிலிருந்து மீள தேவையான அமைதி & ஒழுக்கத்தைத் தர இது மேற்கொள்ளப்படுகிறது. பக்தி தெளிவான சிந்தனையை ஆதரிக்கிறது; திருப்பிச் செலுத்துதல் இன்னும் உங்கள் பணியே."),
        ],
      },
      {
        heading: b("Who should consider it", "யார் கருத வேண்டும்"),
        body: [
          b("Consider it when debt feels persistent, during a dasha that stresses the 6th or 8th house, or when income and savings (2nd, 11th) are under pressure. It is most effective for those ready to also change financial habits.",
            "கடன் தொடர்ந்து உணரும்போது, 6 அல்லது 8-ஆம் பாவத்தை அழுத்தும் தசையின்போது, அல்லது வருமானம் & சேமிப்பு (2, 11) அழுத்தத்தில் இருக்கும்போது கருதுங்கள். நிதிப் பழக்கங்களையும் மாற்றத் தயாராக உள்ளவர்களுக்கு இது மிகவும் பயனுள்ளது."),
        ],
      },
    ],
    remedies: {
      heading: b("The remedies", "பரிகாரங்கள்"),
      intro: b("Devotion steadies the mind; lasting relief comes when it is paired with disciplined money management.", "பக்தி மனதை அமைதிப்படுத்துகிறது; ஒழுக்கமான பண மேலாண்மையுடன் சேரும்போது நீடித்த நிவாரணம் வருகிறது."),
      items: [
        b("Worship at Rina Vimochana (debt-relief) temples and offer Lakshmi-Kubera prayers, especially on Fridays.", "ரிண விமோசன (கடன் நீக்க) தலங்களில் வழிபடுங்கள்; குறிப்பாக வெள்ளிகளில் லட்சுமி-குபேர பிரார்த்தனை செய்யுங்கள்."),
        b("Keep the Sankata Hara Chaturthi vratham and give charity as you are able.", "சங்கடஹர சதுர்த்தி விரதத்தை வையுங்கள்; உங்களால் முடிந்த அளவு தானம் செய்யுங்கள்."),
        b("Budget honestly, avoid new high-interest debt, and time big financial decisions away from stressful dasha periods.", "நேர்மையாக வரவு-செலவு திட்டமிடுங்கள், புதிய அதிக வட்டி கடனைத் தவிர்த்து, பெரிய நிதி முடிவுகளை கடின தசை காலங்களிலிருந்து விலக்கி அமையுங்கள்."),
      ],
    },
    faq: [
      { q: b("Can pariharam clear my debt by itself?", "பரிகாரம் தானாக என் கடனை அழிக்குமா?"), a: b("No. It steadies the mind and supports better decisions, but real relief comes from budgeting, repayment and avoiding new high-interest debt. Use devotion to strengthen discipline, not to replace it.", "இல்லை. இது மனதை அமைதிப்படுத்தி சிறந்த முடிவுகளை ஆதரிக்கிறது; ஆனால் உண்மையான நிவாரணம் வரவு-செலவு, திருப்பிச் செலுத்தல், புதிய அதிக வட்டி கடன் தவிர்ப்பிலிருந்து வருகிறது. ஒழுக்கத்தை வலுப்படுத்த பக்தியைப் பயன்படுத்துங்கள், மாற்றாக அல்ல.") },
      { q: b("Which temples are best for debt relief?", "கடன் நிவாரணத்திற்கு சிறந்த கோயில்கள் எவை?"), a: b("Rina Vimochana (debt-clearing) shrines and Lakshmi-Kubera temples are traditional. Choose by accessibility and devotion, and keep the worship steady rather than one-off.", "ரிண விமோசன (கடன் நீக்க) தலங்கள் மற்றும் லட்சுமி-குபேர கோயில்கள் பாரம்பரியம். அணுகல் & பக்தியின் அடிப்படையில் தேர்வு செய்து, வழிபாட்டை ஒரே முறை அல்ல, நிலையாக வையுங்கள்.") },
      { q: b("When will money pressure ease?", "பண அழுத்தம் எப்போது இலகுவாகும்?"), a: b("Often as a stressful 6th/8th-house dasha passes and supportive income periods (2nd, 11th) begin. Disciplined steps now position you to recover faster when that timing turns.", "பெரும்பாலும் அழுத்தமான 6/8-ஆம் பாவ தசை கடந்து, ஆதரவான வருமான காலங்கள் (2, 11) தொடங்கும்போது. இப்போதைய ஒழுக்கமான படிகள், அந்த காலம் திரும்பும்போது விரைவாக மீள உங்களை தயார்ப்படுத்துகின்றன.") },
    ],
    ctaVariant: "pariharam",
    related: [
      { href: "/features/chart-guidance", label: b("Chart guidance", "ஜாதக வழிகாட்டல்") },
      { href: "/tools/jadhagam-generator", label: b("Generate jadhagam", "ஜாதகம் உருவாக்கு") },
      { href: "/pariharam", label: b("Pariharam", "பரிகாரம்") },
    ],
  },
  "puthra-pariharam": {
    slug: "puthra-pariharam",
    kind: "pariharam",
    topic: "pariharam",
    eyebrow: b("Pariharam guide · childbirth", "பரிகார வழிகாட்டி · சந்தானம்"),
    title: b("Puthra (Childbirth) Pariharam", "புத்திர பரிகாரம்"),
    lead: b(
      "Puthra pariharam is devotional practice for child blessings, read through the 5th house, Jupiter, and supportive grahas. It is most meaningful alongside medical guidance and patience.",
      "5-ஆம் பாவம், குரு, ஆதரவு கிரகங்கள் மூலம் படிக்கப்படும் சந்தான ஆசீர்வாதத்திற்கான பக்தி நடைமுறையே புத்திர பரிகாரம். மருத்துவ ஆலோசனை மற்றும் பொறுமையுடன் சேரும் போதே இது மிகவும் பொருள் பெறும்."
    ),
    quickFacts: [
      { label: b("For", "எதற்கு"), value: b("Child blessings & childbirth delay", "சந்தான பாக்கியம் & சந்தான தாமதம்") },
      { label: b("Houses watched", "பார்க்கும் பாவங்கள்"), value: b("5th house & lord, Jupiter, Moon", "5-ஆம் பாவம் & அதிபதி, குரு, சந்திரன்") },
      { label: b("Main remedies", "முக்கிய பரிகாரம்"), value: b("Santana Gopala & Garbharakshambigai worship", "சந்தான கோபால & கர்பரக்ஷாம்பிகை வழிபாடு") },
      { label: b("Approach", "அணுகுமுறை"), value: b("Devotion + medical guidance", "பக்தி + மருத்துவ ஆலோசனை") },
    ],
    sections: [
      {
        heading: b("What it is", "என்ன என்பது"),
        body: [
          b("Puthra pariharam is devotional practice for child blessings — read in the chart through the 5th house, its lord, Jupiter (the natural significator of children) and the Moon. It is most meaningful taken up patiently and alongside medical guidance.",
            "சந்தான ஆசீர்வாதத்திற்கான பக்தி நடைமுறையே புத்திர பரிகாரம் — ஜாதகத்தில் 5-ஆம் பாவம், அதன் அதிபதி, குரு (சந்தானத்தின் இயற்கை காரகன்), சந்திரன் மூலம் படிக்கப்படுகிறது. பொறுமையாக, மருத்துவ ஆலோசனையுடன் மேற்கொள்ளும்போது மிகவும் பொருள் பெறுகிறது."),
        ],
      },
      {
        heading: b("What it helps with", "எதற்கு உதவுகிறது"),
        body: [
          b("It is taken up to support conception and a healthy pregnancy, to strengthen the 5th house of children, and to bring hope and calm to couples facing delay. The devotion steadies the heart while the chart's timing and medical care do their part.",
            "கருத்தரிப்பு & ஆரோக்கியமான கர்ப்பத்தை ஆதரிக்க, சந்தானம் தரும் 5-ஆம் பாவத்தை பலப்படுத்த, தாமதத்தை எதிர்கொள்ளும் தம்பதியருக்கு நம்பிக்கையும் அமைதியும் தர மேற்கொள்ளப்படுகிறது. ஜாதக காலமும் மருத்துவ பராமரிப்பும் தங்கள் பங்கை செய்யும்போது பக்தி இதயத்தை அமைதிப்படுத்துகிறது."),
        ],
      },
      {
        heading: b("Who should consider it", "யார் கருத வேண்டும்"),
        body: [
          b("Consider it when the 5th house, its lord or Jupiter are weak or afflicted, when Rahu-Ketu or Sarpa patterns touch the 5th house, or during a child-bearing dasha window. A strong 5th house or benefic Jupiter encourages hope; the chart should set realistic timing.",
            "5-ஆம் பாவம், அதன் அதிபதி அல்லது குரு பலவீனமாக அல்லது பாதிப்புடன் இருக்கும்போது, ராகு-கேது அல்லது சர்ப்ப அமைப்பு 5-ஆம் பாவத்தைத் தொடும்போது, அல்லது சந்தான தசை காலத்தில் கருதுங்கள். வலிமையான 5-ஆம் பாவம் அல்லது சுப குரு நம்பிக்கையை ஊக்குவிக்கிறது; யதார்த்தமான காலத்தை ஜாதகம் அமைக்க வேண்டும்."),
        ],
      },
    ],
    remedies: {
      heading: b("The remedies", "பரிகாரங்கள்"),
      intro: b("Keep these gentle and patient, and always alongside proper medical support for conception and pregnancy.", "இவற்றை மென்மையாகவும் பொறுமையாகவும் வையுங்கள்; கருத்தரிப்பு & கர்ப்பத்திற்கு எப்போதும் முறையான மருத்துவ ஆதரவுடன் சேருங்கள்."),
      items: [
        b("Worship Santana Gopala (Krishna for children) and at Garbharakshambigai-type temples.", "சந்தான கோபால (குழந்தைகளுக்கான கிருஷ்ணர்) மற்றும் கர்பரக்ஷாம்பிகை வகை தலங்களில் வழிபடுங்கள்."),
        b("Strengthen Jupiter on Thursdays; where family tradition prescribes it, keep the Putra Kameshti tradition.", "வியாழன்களில் குருவை பலப்படுத்துங்கள்; குடும்ப மரபு கூறும் இடத்தில் புத்திர காமேஷ்டி மரபை வையுங்கள்."),
        b("If naga dosham is indicated, add naga dosham relief — and always continue medical care.", "நாக தோஷம் சுட்டிக்காட்டப்பட்டால், நாக தோஷ நிவாரணத்தைச் சேருங்கள் — மருத்துவ பராமரிப்பை எப்போதும் தொடருங்கள்."),
      ],
    },
    faq: [
      { q: b("Can puthra pariharam alone help us conceive?", "புத்திர பரிகாரம் மட்டும் கருத்தரிக்க உதவுமா?"), a: b("It is taken up with faith for child blessings, but it should always go with proper medical evaluation and care, never as a replacement. Devotion supports hope and calm through the journey.", "சந்தான ஆசீர்வாதத்திற்காக நம்பிக்கையுடன் மேற்கொள்ளப்படுகிறது; ஆனால் எப்போதும் முறையான மருத்துவ மதிப்பீடு & பராமரிப்புடன் சேர வேண்டும், மாற்றாக அல்ல. பக்தி பயணம் முழுவதும் நம்பிக்கையையும் அமைதியையும் ஆதரிக்கிறது.") },
      { q: b("How long should we continue the worship?", "வழிபாட்டை எவ்வளவு காலம் தொடர வேண்டும்?"), a: b("As steady, patient devotion rather than a single ritual — many couples continue through the supportive dasha window. Consistency and calm matter more than elaborate ceremony.", "ஒரே சடங்காக அல்ல, நிலையான பொறுமையான பக்தியாக — பல தம்பதியர் ஆதரவான தசை காலம் வரை தொடர்கின்றனர். விரிவான சடங்கை விட தொடர்ச்சியும் அமைதியும் முக்கியம்.") },
      { q: b("Does a 'weak 5th house' mean we can't have children?", "'பலவீன 5-ஆம் பாவம்' என்றால் குழந்தை பெற முடியாதா?"), a: b("No. It may indicate delay or extra care, not impossibility. A benefic Jupiter, supportive dasha and medical help often open the way; the full chart sets realistic expectations.", "இல்லை. இது தாமதம் அல்லது கூடுதல் கவனத்தைக் குறிக்கலாம்; சாத்தியமற்றது அல்ல. சுப குரு, ஆதரவான தசை, மருத்துவ உதவி பெரும்பாலும் வழியைத் திறக்கின்றன; முழு ஜாதகம் யதார்த்தமான எதிர்பார்ப்பை அமைக்கிறது.") },
    ],
    ctaVariant: "pariharam",
    related: [
      { href: "/pariharam/naga-dosha-pariharam", label: b("Naga dosham pariharam", "நாக தோஷ பரிகாரம்") },
      { href: "/temples/alangudi", label: b("Alangudi Guru temple", "ஆலங்குடி குரு கோயில்") },
      { href: "/tools/jadhagam-generator", label: b("Generate jadhagam", "ஜாதகம் உருவாக்கு") },
    ],
  },
  "ayul-pariharam": {
    slug: "ayul-pariharam",
    kind: "pariharam",
    topic: "pariharam",
    eyebrow: b("Pariharam guide · health", "பரிகார வழிகாட்டி · ஆரோக்கியம்"),
    title: b("Health (Ayul) Pariharam", "ஆயுள் / ஆரோக்கிய பரிகாரம்"),
    lead: b(
      "Health pariharam is devotional support for wellbeing and longevity, read through the Lagna, 6th, 8th, and Ascendant lord. It complements, and never replaces, proper medical care.",
      "லக்னம், 6, 8-ஆம் பாவங்கள், லக்னாதிபதி மூலம் படிக்கப்படும் நலன் மற்றும் ஆயுளுக்கான பக்தி ஆதரவே ஆரோக்கிய பரிகாரம். இது முறையான மருத்துவ பராமரிப்புக்கு துணை; ஒருபோதும் மாற்று அல்ல."
    ),
    quickFacts: [
      { label: b("For", "எதற்கு"), value: b("Health, vitality & longevity", "ஆரோக்கியம், உயிர்சக்தி & ஆயுள்") },
      { label: b("Houses watched", "பார்க்கும் பாவங்கள்"), value: b("Lagna & lord, 6th, 8th, Moon, Sun", "லக்னம் & அதிபதி, 6, 8, சந்திரன், சூரியன்") },
      { label: b("Main remedies", "முக்கிய பரிகாரம்"), value: b("Vaitheeswaran Koil, Mrityunjaya worship", "வைத்தீஸ்வரன் கோயில், மிருத்யுஞ்சய வழிபாடு") },
      { label: b("Golden rule", "தங்க விதி"), value: b("Never replaces a doctor", "மருத்துவருக்கு மாற்றல்ல") },
    ],
    sections: [
      {
        heading: b("What it is", "என்ன என்பது"),
        body: [
          b("Health (Ayul) pariharam is devotional support for wellbeing and longevity. In the chart, health is read through the Lagna and its lord, the 6th house (illness), the 8th house (longevity and crises), and the Moon and Sun for body and mind. It complements — and never replaces — proper medical care.",
            "நலன் & ஆயுளுக்கான பக்தி ஆதரவே ஆரோக்கிய (ஆயுள்) பரிகாரம். ஜாதகத்தில் ஆரோக்கியம் லக்னம் & அதன் அதிபதி, 6-ஆம் பாவம் (நோய்), 8-ஆம் பாவம் (ஆயுள் & நெருக்கடி), உடல்-மனத்திற்கு சந்திரன் & சூரியன் மூலம் படிக்கப்படுகிறது. இது முறையான மருத்துவ பராமரிப்புக்கு துணை — ஒருபோதும் மாற்றல்ல."),
        ],
      },
      {
        heading: b("What it helps with", "எதற்கு உதவுகிறது"),
        body: [
          b("It is taken up to support recovery and resilience, to bring calm and courage during illness or treatment, and to strengthen vitality through a difficult health dasha. The devotion steadies the mind so the body can heal with proper care.",
            "குணமடைதல் & மன உறுதியை ஆதரிக்க, நோய் அல்லது சிகிச்சையின்போது அமைதி & தைரியத்தைத் தர, கடினமான ஆரோக்கிய தசையில் உயிர்சக்தியை பலப்படுத்த மேற்கொள்ளப்படுகிறது. முறையான பராமரிப்புடன் உடல் குணமாக, பக்தி மனதை அமைதிப்படுத்துகிறது."),
        ],
      },
      {
        heading: b("Who should consider it", "யார் கருத வேண்டும்"),
        body: [
          b("Consider it during a stressful Lagna, 6th or 8th house dasha, alongside ongoing treatment, for an elderly family member's wellbeing, or for general resilience. Always treat it as faith and discipline beside medicine, not in place of it.",
            "அழுத்தமான லக்னம், 6 அல்லது 8-ஆம் பாவ தசையின்போது, தொடரும் சிகிச்சையுடன், முதிய குடும்ப உறுப்பினரின் நலனுக்காக, அல்லது பொது மன உறுதிக்காக கருதுங்கள். எப்போதும் மருந்துக்கு பதிலாக அல்ல, அதனுடன் நம்பிக்கை & ஒழுக்கமாகக் கொள்ளுங்கள்."),
        ],
      },
    ],
    remedies: {
      heading: b("The remedies", "பரிகாரங்கள்"),
      intro: b("These support calmness and steadiness during treatment — keep them strictly alongside a qualified doctor's care.", "இவை சிகிச்சையின்போது அமைதியையும் மன உறுதியையும் ஆதரிக்கின்றன — தகுதியான மருத்துவரின் பராமரிப்புடன் கண்டிப்பாக சேர்த்து வையுங்கள்."),
      items: [
        b("Visit Vaitheeswaran Koil and offer Mrityunjaya (Maha Mrityunjaya) worship for health and protection.", "வைத்தீஸ்வரன் கோயிலைத் தரிசித்து, ஆரோக்கியம் & பாதுகாப்பிற்காக மிருத்யுஞ்சய (மகா மிருத்யுஞ்சய) வழிபாடு செய்யுங்கள்."),
        b("Where tradition prescribes it, perform Ayushya Homam, and strengthen the relevant graha for the body part involved.", "மரபு கூறும் இடத்தில் ஆயுஷ்ய ஹோமம் செய்து, சம்பந்தப்பட்ட உடல் உறுப்புக்கான கிரகத்தை பலப்படுத்துங்கள்."),
        b("Keep a disciplined daily routine — diet, rest and practice — as part of the remedy, and continue all medical treatment.", "ஒழுக்கமான தினசரி வழக்கத்தை — உணவு, ஓய்வு, நடைமுறை — பரிகாரத்தின் பகுதியாக வையுங்கள்; எல்லா மருத்துவ சிகிச்சையையும் தொடருங்கள்."),
      ],
    },
    faq: [
      { q: b("Can health pariharam replace medical treatment?", "ஆரோக்கிய பரிகாரம் மருத்துவ சிகிச்சைக்கு மாற்றா?"), a: b("Absolutely not. It is faith and discipline that support you through treatment. Any health concern needs a qualified doctor — use devotion alongside medicine, never instead of it.", "முற்றிலும் இல்லை. இது சிகிச்சையின் வழியாக உங்களை ஆதரிக்கும் நம்பிக்கை & ஒழுக்கம். எந்த ஆரோக்கிய கவலைக்கும் தகுதியான மருத்துவர் தேவை — பக்தியை மருந்துடன் சேர்த்துப் பயன்படுத்துங்கள், மாற்றாக அல்ல.") },
      { q: b("What is Mrityunjaya worship?", "மிருத்யுஞ்சய வழிபாடு என்றால் என்ன?"), a: b("It is worship of Shiva as the conqueror of death (Maha Mrityunjaya), traditionally done for health, healing and protection. It is a common, gentle devotional support during illness.", "இது சிவனை மரணத்தை வென்றவராக (மகா மிருத்யுஞ்சயர்) வழிபடுவது, பாரம்பரியமாக ஆரோக்கியம், குணமடைதல், பாதுகாப்பிற்காக. நோயின்போது பொதுவான, மென்மையான பக்தி ஆதரவு.") },
      { q: b("Is it only for serious illness?", "இது கடுமையான நோய்க்கு மட்டுமா?"), a: b("No. It is also taken up for general vitality, resilience, and an elderly relative's wellbeing. Whatever the concern, keep it paired with appropriate medical guidance.", "இல்லை. பொது உயிர்சக்தி, மன உறுதி, முதிய உறவினரின் நலனுக்காகவும் மேற்கொள்ளப்படுகிறது. கவலை எதுவாயினும், பொருத்தமான மருத்துவ ஆலோசனையுடன் சேர்த்து வையுங்கள்.") },
    ],
    ctaVariant: "pariharam",
    related: [
      { href: "/temples/vaitheeswaran-koil", label: b("Vaitheeswaran Koil", "வைத்தீஸ்வரன் கோயில்") },
      { href: "/features/chart-guidance", label: b("Chart guidance", "ஜாதக வழிகாட்டல்") },
      { href: "/pariharam", label: b("Pariharam", "பரிகாரம்") },
    ],
  },
};

export function getGuideDetail(kind: GuideKind, slug: string): GuideDetail | undefined {
  if (kind === "dosham") return DOSHAM_DETAILS[slug];
  if (kind === "yogam") return YOGAM_DETAILS[slug];
  if (kind === "pariharam") return PARIHARAM_DETAILS[slug];
  return TEMPLE_DETAILS[slug];
}

const GUIDE_VERIFY_NOTE: Record<GuideKind, BiText> = {
  dosham: b(
    "How an astrologer confirms this: the exact graha, house and strength are checked in your Thirukanitham chart, then cancellations and the running dasha are weighed before any dosham is called strong — never from a name alone.",
    "ஒரு ஜோதிடர் இதை எப்படி உறுதி செய்வார்: உங்கள் திருக்கணித ஜாதகத்தில் சரியான கிரகம், பாவம், பலம் பார்க்கப்பட்டு, பின்பு ரத்து காரணங்களும் நடக்கும் தசையும் எடை போடப்படுகின்றன — பெயரை மட்டும் வைத்து எந்த தோஷமும் கடுமை என்று சொல்லப்படுவதில்லை."
  ),
  yogam: b(
    "How an astrologer confirms this: the yoga is read from its exact formula, the strength and dignity of the planets, and whether the dasha activates them — a named yoga is only as real as the chart behind it.",
    "ஒரு ஜோதிடர் இதை எப்படி உறுதி செய்வார்: யோகம் அதன் சரியான சூத்திரம், கிரகங்களின் பலம் மற்றும் நிலை, தசை அதை செயல்படுத்துகிறதா என்பதன் மூலம் பார்க்கப்படுகிறது — பெயருக்குப் பின்னால் உள்ள ஜாதகம் எவ்வளவோ அவ்வளவே யோகமும் உண்மை."
  ),
  temple: b(
    "How an astrologer matches this: the temple is suggested from the afflicted or active graha, the running dasha and the life area in your chart — devotion and panchangam timing then refine the visit.",
    "ஒரு ஜோதிடர் இதை எப்படி பொருத்துவார்: பாதிக்கப்பட்ட அல்லது செயல்படும் கிரகம், நடக்கும் தசை, ஜாதகத்தின் வாழ்க்கைத் துறை ஆகியவற்றிலிருந்து கோயில் பரிந்துரைக்கப்படுகிறது — பக்தியும் பஞ்சாங்க நேரமும் தரிசனத்தை நுணுக்கமாக்குகின்றன."
  ),
  pariharam: b(
    "How an astrologer matches this: the remedy is chosen from the active graha, dosham and dasha in your chart, and is meant as devotion and discipline alongside medical, legal or financial help — never instead of it.",
    "ஒரு ஜோதிடர் இதை எப்படி பொருத்துவார்: உங்கள் ஜாதகத்தில் செயல்படும் கிரகம், தோஷம், தசை ஆகியவற்றிலிருந்து பரிகாரம் தேர்வு செய்யப்படுகிறது; இது மருத்துவம், சட்டம் அல்லது நிதி உதவியுடன் சேர்ந்த பக்தி மற்றும் ஒழுக்கம் — அதற்கு மாற்றாக அல்ல."
  ),
};

export function getGuideVerifyNote(content: Pick<GuideDetail, "kind">): BiText {
  return GUIDE_VERIFY_NOTE[content.kind];
}

const KIND_BREADCRUMB: Record<GuideKind, { name: string; path: string }> = {
  dosham: { name: "Dosham", path: "/dosham" },
  yogam: { name: "Yogam", path: "/yogam" },
  temple: { name: "Temples", path: "/temples" },
  pariharam: { name: "Pariharam", path: "/pariharam" },
};

/**
 * Builds Article + BreadcrumbList JSON-LD for a guide detail page so the
 * dosham / yogam / temple / pariharam pages are eligible for rich results.
 */
export function guideJsonLd(content: GuideDetail, url: string) {
  const crumb = KIND_BREADCRUMB[content.kind];
  const sectionBody = content.sections
    .map((section) => `${section.heading.en}. ${section.body.map((p) => p.en).join(" ")}`)
    .join("\n\n");
  const remedyBody = content.remedies
    ? `\n\n${content.remedies.heading.en}. ${content.remedies.intro.en} ${content.remedies.items
        .map((item) => item.en)
        .join(" ")}`
    : "";
  const verifyNote = getGuideVerifyNote(content).en;

  const graph: Record<string, unknown>[] = [
    {
      "@type": "Article",
      headline: content.title.en,
      description: content.lead.en,
      articleBody: `${sectionBody}${remedyBody}\n\n${verifyNote}`,
      about: content.title.en,
      inLanguage: ["en", "ta"],
      url,
      mainEntityOfPage: url,
      isPartOf: { "@type": "WebSite", name: "Vinaadi", url: "https://vinaadi.com" },
      publisher: { "@type": "Organization", name: "Vinaadi", url: "https://vinaadi.com" },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://vinaadi.com" },
        { "@type": "ListItem", position: 2, name: crumb.name, item: `https://vinaadi.com${crumb.path}` },
        { "@type": "ListItem", position: 3, name: content.title.en, item: url },
      ],
    },
  ];

  if (content.faq && content.faq.length > 0) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: content.faq.map((item) => ({
        "@type": "Question",
        name: item.q.en,
        acceptedAnswer: { "@type": "Answer", text: item.a.en },
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}
