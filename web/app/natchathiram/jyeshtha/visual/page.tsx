import type { Metadata } from "next";
import { JYESHTHA } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

export const metadata: Metadata = {
  title: "Jyeshtha Nakshathiram — Visual Profile | Vinaadi",
  description: "Visual profile of Jyeshtha Nakshathiram: personality traits, career strengths, dasha timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/jyeshtha/visual" },
  openGraph: {
    title: "Jyeshtha Nakshathiram — Visual Profile",
    description: "Visual profile of Jyeshtha Nakshathiram: personality traits, career strengths, dasha timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/jyeshtha/visual",
    type: "article",
  },
};

const JYESHTHA_VISUAL: NatchathiramVisualData = {
  atAGlance: [
    { label: "Protective Authority",   score: 97 },
    { label: "Depth of Intelligence",  score: 95 },
    { label: "Elder Wisdom",           score: 93 },
    { label: "Transformative Power",   score: 94 },
    { label: "Strategic Mastery",      score: 92 },
  ],

  radar: {
    labels: ["Authority", "Intelligence", "Wisdom", "Transformation", "Strategy", "Resilience"],
    values: [97, 95, 93, 94, 92, 91],
  },

  coreStrengths: [
    { symbol: "◎", label: "Protective Authority",     score: 97, desc: "Indra's eldest — Jyeshtha carries the authority of the one who has seen everything, protected everyone, and stands at the front." },
    { symbol: "◈", label: "Depth of Intelligence",    score: 95, desc: "Vrischika's depths joined to Mercury's precision — Jyeshtha penetrates to the truth of any situation with an accuracy that is uncomfortable to witness." },
    { symbol: "⚡", label: "Elder Wisdom",             score: 93, desc: "The senior who earned their position through experience — Jyeshtha's authority is not claimed but accumulated, earned year by year." },
    { symbol: "♥", label: "Transformative Power",     score: 94, desc: "Scorpio's supreme signature — Jyeshtha transforms through difficulty, emerging from every depth with capacities they did not have when they entered." },
    { symbol: "△", label: "Strategic Intelligence",   score: 92, desc: "Mercury and Mars in Scorpio — the analytical mind and the strategic will working in the deepest possible channel." },
    { symbol: "☽", label: "Unsentimental Courage",    score: 91, desc: "Jyeshtha does not look away from difficulty — not because they are without feeling but because they have learned that looking away does not help." },
  ],

  careerAbilities: [
    { label: "Leadership & Protection",       score: 97 },
    { label: "Investigation & Intelligence",   score: 95 },
    { label: "Spiritual & Occult Sciences",   score: 94 },
    { label: "Strategic Management",           score: 92 },
    { label: "Medicine & Deep Psychology",    score: 91 },
  ],
  careerNote: "Jyeshtha thrives wherever authority, protective intelligence, and the willingness to go where others will not — into the difficult truth, the complex investigation, the demanding leadership role — are the central requirements.",

  careerClusters: [
    { symbol: "◎", title: "Senior Leadership & Governance",  desc: "Organisational and institutional leadership — the eldest who carries the weight and earns the authority." },
    { symbol: "◈", title: "Investigation & Intelligence Work", desc: "Intelligence analysis, forensic work, investigative research — the penetrating depth of Vrischika applied professionally." },
    { symbol: "⚡", title: "Occult Sciences & Astrology",    desc: "Jyotish, Tantra, depth spiritual sciences — Indra's knowledge joined to Scorpio's access." },
    { symbol: "♥", title: "Psychology & Deep Therapy",      desc: "Depth psychology, trauma work, intensive psychiatric care — the willingness to accompany others into the deepest waters." },
    { symbol: "△", title: "Strategic Consulting & Planning", desc: "High-stakes strategy, crisis management, complex problem solving — Jyeshtha's senior analytical judgment." },
    { symbol: "☽", title: "Medicine & Surgical Practice",   desc: "Surgery, emergency medicine, critical care — the combination of authority, precision, and courage under pressure." },
  ],

  modernApps: [
    { symbol: "◎", title: "Executive Leadership & Strategy", desc: "C-suite advisory, organisational transformation, institutional reform — Jyeshtha's senior authority." },
    { symbol: "◈", title: "Cyber Intelligence & Forensics",  desc: "Cybersecurity investigation, digital forensics, intelligence platforms — Vrischika's penetrating depth in the digital domain." },
    { symbol: "⚡", title: "Astrology & Vedic Sciences Tech", desc: "Jyotish platforms, spiritual sciences applications, depth wisdom technology." },
    { symbol: "♥", title: "Mental Health & Trauma Tech",    desc: "Depth therapy platforms, trauma recovery applications, intensive mental health technology." },
    { symbol: "△", title: "Crisis Management & Risk Tech",   desc: "Risk intelligence platforms, crisis simulation, strategic decision tools under pressure." },
    { symbol: "☽", title: "Surgical & Critical Care Tech",  desc: "Surgical innovation platforms, critical care technology, precision medical applications." },
  ],

  dashaTimeline: [
    {
      planet: "Mercury", period: "17 yrs", ageRange: "Age 0–17", theme: "Born with the Elder's Intelligence",
      detail: {
        expect: "Jyeshtha opens in Mercury dasha — a beginning charged with the peculiar intelligence of Vrischika and the precision of Mercury. Early childhood (0–7) often shows an unusual observational capacity: the Jyeshtha child watches, processes, and understands adult dynamics before they have the words to describe them. The awareness of power — who has it, how it works, where it can be trusted — develops in Mercury's first years with a sophistication that surprises caregivers. School years (7–14) produce a student of depth and precision: not necessarily the fastest or the most spontaneous, but consistently the most penetrating. The first significant intellectual passion — mathematics, language, psychology, or any domain where the hidden structure of things is revealed — establishes in Mercury dasha.",
        navigate: "Mercury's primary shadow for the young Jyeshtha is the gap between perception and expression — seeing deeply into situations that cannot yet be articulated, knowing truths that the social environment will not accept. This can produce either precocious confidence or a strategic withholding that becomes habitual. Physical concerns: nervous system hypersensitivity, respiratory function, and digestive sensitivity. Mercury–Rahu antardasha (~yr 2 of Mercury, ~age 2) can produce an unsettled early period.",
        focus: "Wednesday worship and the provision of intellectual challenge — advanced reading, complex puzzles, depth conversations — that matches the young Jyeshtha's actual perceptual capacity rather than their age. Also watch Mercury–Mars antardasha (~yr 14 of Mercury, ~ages 14–15). Mars is the lord of your rasi, Vrischika — this sub-period, arriving in adolescence, carries the rasi lord's drive, assertion, and transformative intensity. A period of unusual confidence, competitive breakthrough, or strategic clarity in the early teens typically lands in this 7-month window.",
      },
    },
    {
      planet: "Ketu", period: "7 yrs", ageRange: "Age 17–24", theme: "The Inward Forge",
      detail: {
        expect: "Ketu dasha from 17 to 24 is the inward forge — the period in which Jyeshtha's unusual intelligence and perceptual depth are tested in the fire of real-world experience and stripped of the naivety that Mercury's analytical confidence can sometimes carry. Higher secondary education, the first career steps, and the initial encounters with adult authority — professional, institutional, and familial — all run through Ketu's seven years. For many Jyeshtha, Ketu dasha is the period of the first real disillusionment: the discovery that authority is not always legitimate, that intelligence is not always rewarded, that depth is sometimes more burden than advantage.",
        navigate: "Ketu's primary challenge in this period is the risk of bitterness — the perceptive young person who sees too clearly and responds with cynicism rather than the wisdom that understanding also makes possible. The disillusionment of Ketu dasha is not a mistake; it is the fire that burns away sentimentality and produces the unsentimental courage that defines Jyeshtha's mature intelligence. Physical concerns: nervous system, autoimmune function, and the physical cost of intensity.",
        focus: "Ketu shrine visits and pitru tharpanam. The disillusionment of Ketu dasha is the most important formative experience of Jyeshtha's life — not to be avoided but to be moved through with the awareness that what is being burned away is not truth but illusion. The elder's wisdom always costs the price of disillusionment.",
      },
    },
    {
      planet: "Venus", period: "20 yrs", ageRange: "Age 24–44", theme: "Authority Meets Abundance",
      detail: {
        expect: "Venus dasha from 24 to 44 brings Jyeshtha's intelligence and depth into the most abundant and expansive professional and relational context of the early life. Career foundations build rapidly; the combination of Jyeshtha's perceptual accuracy, strategic intelligence, and unsentimental courage distinguishes them in almost any professional domain they choose to enter seriously. Marriage typically enters in Venus–Jupiter antardasha (~yr 3 of Venus, ~ages 27–28) or Venus–Saturn (~yr 10 of Venus, ~ages 34–35). Children arrive; the family unit that Jyeshtha will protect and provide for through decades forms. Financial growth is typically strong in Venus dasha — the intelligence applied to resources produces reliable returns.",
        navigate: "Venus's abundance can produce in Jyeshtha a certain professional over-confidence — the intelligence that has correctly assessed most situations developing a blind spot around the situations it cannot. The perceptive person who believes their perception is complete is more dangerous than the one who knows its limits. Venus–Saturn antardasha (~yr 10 of Venus, ~ages 34–35) can bring a significant reality check and recalibration.",
        focus: "Friday Lakshmi worship and deliberate cultivation of epistemic humility — the knowledge that even Jyeshtha's depth perception has limits. Also watch Venus–Mars antardasha (~yr 7 of Venus, ~ages 31–32). Mars as rasi lord brings a potent 7-month window of intense professional drive, strategic breakthrough, and transformative capacity in the midst of Venus's abundance. The most ambitious professional commitment of the Venus decade often crystallises in this window.",
      },
    },
    {
      planet: "Sun", period: "6 yrs", ageRange: "Age 44–50", theme: "The Elder Rises",
      detail: {
        expect: "Sun dasha from 44 to 50 is the formal ascent of Jyeshtha's authority. The intelligence that has been accumulating since Mercury opened the life, tested in Ketu, and built through Venus, now takes its place in full solar visibility. Senior leadership positions — head of department, principal investigator, senior partner, authority figure in a community or institution — are the natural terrain. The name 'Jyeshtha' — the eldest — finds its expression in Sun dasha; others begin to defer, seek guidance, and position Jyeshtha as the senior voice.",
        navigate: "The authority of Sun dasha can produce the authoritarian shadow of Jyeshtha's nature — the protective elder who begins to control rather than guide. The difference between authority that serves and authority that dominates is the ongoing test of Sun dasha. Physical concerns: heart, eyes, and the accumulated tension of decades of intense engagement. Sun–Rahu antardasha (~yr 3 of Sun, ~ages 46–47) can bring disruption or challenge to the newly established authority.",
        focus: "Sunday Surya worship and Indra Sukta recitation. The elder who has earned authority has a responsibility to use it in service of those who cannot yet protect themselves — this is Indra's requirement and Jyeshtha's highest Sun dasha expression.",
      },
    },
    {
      planet: "Moon", period: "10 yrs", ageRange: "Age 50–60", theme: "Depth Emotion",
      detail: {
        expect: "Moon dasha from 50 to 60 brings the emotional ocean to Jyeshtha's surface. The intelligence and authority of Mercury, Ketu, Venus, and Sun have been primarily outward expressions; Moon dasha insists on the interior. Family relationships deepen significantly. Children are entering adulthood; the relationship between Jyeshtha as parent and these young adults requires the emotional intelligence that Moon dasha develops. For some Jyeshtha, the experience of being genuinely emotionally known by another person — not just intellectually respected — is most fully available in Moon dasha.",
        navigate: "Moon's primary challenge for Jyeshtha is the discomfort of emotional vulnerability. The protective elder who has been the strong one for decades may find the emotional depth of Moon dasha genuinely unfamiliar. Physical concerns: fluid balance, memory changes, and the emotional body's longstanding accumulated tension. Moon–Rahu antardasha (~yr 7 of Moon, ~ages 56–57) can bring turbulence.",
        focus: "Monday Moon worship and deliberate emotional presence — relationships where Jyeshtha receives care as well as giving it. Also watch Moon–Mars antardasha (~yr 4 of Moon, ~ages 54–55). Mars as rasi lord brings a potent 7-month window of intense clarity, protective drive, and transformative energy within Moon's otherwise introspective period.",
      },
    },
    {
      planet: "Mars", period: "7 yrs", ageRange: "Age 60–67", theme: "Rasi Lord — The Great Transformation",
      detail: {
        expect: "Mars dasha from 60 to 67 is the rasi lord's arrival for Jyeshtha. Mars is the lord of your rasi, Vrischika — this makes his dasha doubly charged for Jyeshtha natives. The Vrischika transformation that has characterised this person's entire life — the capacity to enter the deepest waters and emerge changed — now reaches its most concentrated and deliberately chosen expression. The authority accumulated in Sun dasha and the emotional depth opened in Moon dasha converge in Mars's transformative fire. For those in spiritual or investigative work, the most penetrating and enduring contributions of a lifetime typically fall in Mars dasha. For those in leadership, this is the period of the legacy decision — the single most important contribution to the institution, community, or domain they have built.",
        navigate: "Mars's primary shadow in this period is the temptation toward the absolute — the transformed elder who believes their understanding is now complete and becomes closed to further development. The greatest Jyeshtha are those who remain open to transformation even in the dasha of the rasi lord, understanding that Vrischika's depths have no final floor. Physical concerns: cardiovascular, musculoskeletal, and the accumulated intensity of six decades of deep engagement require deliberate care.",
        focus: "Tuesday Mars shrine prayers, red flower offerings, and Kartikeya (Murugan) worship — the deity of focused will and the spear that finds its true mark. The Mars dasha legacy work — whatever it is — must be done with the full depth of Vrischika's intelligence and the full force of the rasi lord's fire.",
      },
    },
    {
      planet: "Rahu", period: "18 yrs", ageRange: "Age 67–85", theme: "The Elder Dissolves",
      detail: {
        expect: "Rahu dasha from 67 to 85 brings the great dissolution of the identity that Jyeshtha has built. The authority, the intelligence, the protective function — all the things that have defined this person from Mercury's opening — gradually give way to the recognition that these were instruments, not the self. Grandchildren and great-grandchildren receive an elder of unusual depth. For those who navigate the transition from identity to essence with Jyeshtha's characteristic unsentimental intelligence, Rahu dasha produces the most spacious and genuinely wise period of the entire life.",
        navigate: "Rahu's expansiveness in old age can manifest as either wisdom or grandiosity — the elder who has seen everything either shares it as light or wields it as control. The physical demands of Rahu dasha at this age require deliberate, consistent care: nervous system, musculoskeletal, and cardiovascular. Rahu–Saturn antardasha (~yr 10 of Rahu, ~ages 77–79) is the most demanding sub-period.",
        focus: "Saturday Rahu shrine prayers and the deliberate practice of releasing the elder identity into the larger wisdom it has always been serving. Indra's eldest, who has protected and guided through a lifetime, discovers in Rahu dasha that the deepest protection is the willingness to let go.",
      },
    },
    {
      planet: "Jupiter", period: "16 yrs", ageRange: "Age 85–101", theme: "Final Wisdom",
      detail: {
        expect: "Jupiter dasha from 85 to 101 is reached by very few Jyeshtha souls. For those who arrive, Jupiter brings the closing gift of wisdom — the full-circle return to the quality of understanding that Indra's protection was always serving. The disillusionment of Ketu, the authority of Sun, the transformation of Mars, the dissolution of Rahu: all of it lands, in Jupiter's dasha, as the wholeness that it always was.",
        navigate: "Complete and gentle physical care. Jupiter at this extreme age is a gift of presence — a warmth and luminosity in the person that others find nourishing simply to be near.",
        focus: "Thursday Brihaspati worship and the presence of those who love this person. The eldest has become the wisest, and the wisest has become the most available. Indra's child rests in Jupiter's light.",
      },
    },
  ],

  spirituality: [
    {
      title: "Indra & Elder God Worship",
      desc: "Indra, the king of the gods and Jyeshtha's presiding deity — Indra Sukta recitation, offerings to Indra on Thursdays, and the practice of protective service (guarding those weaker) as explicitly devotional acts are Jyeshtha's deepest spiritual expressions.",
    },
    {
      title: "Vrischika Depth Practices",
      desc: "Scorpio's transformative energy — Kali worship, Kartikeya devotion, and intensive depth practices (night vigils, esoteric study, Tantra under qualified guidance) — are Jyeshtha's most powerful spiritual pathways.",
    },
    {
      title: "Investigative Wisdom Traditions",
      desc: "Jyotish, Vedanta, and the investigative wisdom traditions that require the same penetrating honesty that Jyeshtha applies to professional problems are the most authentic spiritual homes. The willingness to see clearly — including about oneself — is Jyeshtha's primary spiritual practice.",
    },
  ],

  guidance: "The eldest is not the one who knows everything — it is the one who has learned what cannot be known without experience, and who offers that knowing without demanding it be received. The protective authority you carry is only as trustworthy as your willingness to be transformed by it. Vrischika's depth has no final floor; remain open to the next descent. The intelligence that serves the whole, rather than confirming the self, is Indra's highest attribute, and it is yours.",

  compatibleEn: ["Anuradha", "Vishakha", "Ashlesha", "Mula", "Ardra"],
  compatibleNote: "These nakshatras complement Jyeshtha's protective authority, transformative depth, and penetrating intelligence with devotion, ambition, and resonant power.",

  ta: {
    atAGlanceLabels: ["பாதுகாப்பு அதிகாரம்", "நுண்ணறிவு ஆழம்", "மூத்தோர் ஞானம்", "மாற்றும் சக்தி", "மூலோபாய தேர்ச்சி"],
    radarLabels: ["அதிகாரம்", "நுண்ணறிவு", "ஞானம்", "மாற்றம்", "மூலோபாயம்", "மீள்தன்மை"],
    coreStrengths: [
      { label: "பாதுகாப்பு அதிகாரம்",   desc: "இந்திரனின் மூத்தவர் — ஜ்யேஷ்டா எல்லாவற்றையும் பார்த்தவர், எல்லாரையும் பாதுகாத்தவர், முன்னால் நிற்பவரின் அதிகாரத்தை கொண்டுள்ளார்." },
      { label: "நுண்ணறிவு ஆழம்",        desc: "விருச்சிகத்தின் ஆழங்கள் புதனின் துல்லியத்துடன் சேரும் — ஜ்யேஷ்டா எந்த சூழ்நிலையிலும் உண்மையை பார்க்க கவலைப்படும் துல்லியத்துடன் ஊடுருவுகிறார்." },
      { label: "மூத்தோர் ஞானம்",        desc: "தங்கள் நிலையை அனுபவத்தின் மூலம் பெற்ற மூத்தவர் — ஜ்யேஷ்டாவின் அதிகாரம் கோரப்படவில்லை, வருடத்திற்கு வருடம் திரட்டப்பட்டது." },
      { label: "மாற்றும் சக்தி",         desc: "விருச்சிகத்தின் உயர்ந்த கையெழுத்து — ஜ்யேஷ்டா கஷ்டங்களின் மூலம் மாறுகிறார், ஒவ்வொரு ஆழத்திலிருந்தும் நுழைந்தபோது இல்லாத திறன்களுடன் வெளிவருகிறார்." },
      { label: "மூலோபாய நுண்ணறிவு",    desc: "விருச்சிகத்தில் புதனும் செவ்வாயும் — பகுப்பாய்வு மனம் மற்றும் மூலோபாய விருப்பம் ஆழமான சேனலில் வேலை செய்கிறது." },
      { label: "உணர்வற்ற தைரியம்",      desc: "ஜ்யேஷ்டா கஷ்டத்திலிருந்து விலகுவதில்லை — உணர்வு இல்லாமல் அல்ல ஆனால் விலகுவது உதவாது என்று கற்றுக்கொண்டதால்." },
    ],
    careerAbilityLabels: ["தலைமை & பாதுகாப்பு", "விசாரணை & நுண்ணறிவு", "ஆன்மீக & நிரல் அறிவியல்கள்", "மூலோபாய மேலாண்மை", "மருத்துவம் & ஆழ மனோவியல்"],
    careerClusters: [
      { title: "மூத்த தலைமை & ஆட்சி",       desc: "நிறுவன மற்றும் நிறுவனத்தின் தலைமை — எடையை சுமக்கும் மற்றும் அதிகாரத்தை பெறும் மூத்தவர்." },
      { title: "விசாரணை & நுண்ணறிவு வேலை",   desc: "நுண்ணறிவு பகுப்பாய்வு, தடயவியல் வேலை, விசாரணை ஆராய்ச்சி — தொழில்முறையாக பயன்படுத்தப்படும் விருச்சிகத்தின் ஊடுருவும் ஆழம்." },
      { title: "நிரல் அறிவியல்கள் & ஜோதிடம்", desc: "ஜ்யோதிஷ், தந்திரம், ஆழ ஆன்மீக அறிவியல்கள் — இந்திரனின் ஞானம் விருச்சிகத்தின் அணுகலுடன்." },
      { title: "மனோவியல் & ஆழ சிகிச்சை",    desc: "ஆழ மனோவியல், மனக்காயம் வேலை, தீவிர மனநல பராமரிப்பு — ஆழமான நீரில் மற்றவர்களை துணை செய்ய விருப்பம்." },
      { title: "மூலோபாய ஆலோசனை & திட்டமிடல்", desc: "உயர்-பங்கு மூலோபாயம், நெருக்கடி மேலாண்மை, சிக்கலான சிக்கல் தீர்வு." },
      { title: "மருத்துவம் & அறுவை சிகிச்சை நடைமுறை", desc: "அறுவை சிகிச்சை, அவசர மருத்துவம், விமர்சன பராமரிப்பு — அழுத்தத்தில் அதிகாரம், துல்லியம், தைரியம் ஒன்றிணைவது." },
    ],
    modernApps: [
      { title: "நிர்வாக தலைமை & மூலோபாயம்",   desc: "C-suite ஆலோசனை, நிறுவன மாற்றம், நிறுவன சீர்திருத்தம் — ஜ்யேஷ்டாவின் மூத்த அதிகாரம்." },
      { title: "சைபர் நுண்ணறிவு & தடயவியல்",   desc: "சைபர் பாதுகாப்பு விசாரணை, டிஜிட்டல் தடயவியல், நுண்ணறிவு தளங்கள் — டிஜிட்டல் தளத்தில் விருச்சிகத்தின் ஊடுருவும் ஆழம்." },
      { title: "ஜோதிட & வேத அறிவியல் தொழில்நுட்பம்", desc: "ஜ்யோதிஷ் தளங்கள், ஆன்மீக அறிவியல் பயன்பாடுகள், ஆழ ஞான தொழில்நுட்பம்." },
      { title: "மனநல & மனக்காயம் தொழில்நுட்பம்", desc: "ஆழ சிகிச்சை தளங்கள், மனக்காயம் மீட்பு பயன்பாடுகள், தீவிர மனநல தொழில்நுட்பம்." },
      { title: "நெருக்கடி மேலாண்மை & அபாய தொழில்நுட்பம்", desc: "அபாய நுண்ணறிவு தளங்கள், நெருக்கடி உருவகப்படுத்தல், அழுத்தத்தின் கீழ் மூலோபாய முடிவு கருவிகள்." },
      { title: "அறுவை சிகிச்சை & விமர்சன பராமரிப்பு தொழில்நுட்பம்", desc: "அறுவை சிகிச்சை கண்டுபிடிப்பு தளங்கள், விமர்சன பராமரிப்பு தொழில்நுட்பம், துல்லிய மருத்துவ பயன்பாடுகள்." },
    ],
    dashaThemes: [
      "மூத்தோரின் நுண்ணறிவுடன் பிறப்பு — புதன் ஆரம்பம், விருச்சிக ஆழம்",
      "உள்நோக்கிய தொட்டி — கேது சோதனை, மாயை கரைவது",
      "அதிகாரம் செழிப்பை சந்திக்கிறது — சுக்கிர வளர்ச்சி, தொழில் நிறுவல்",
      "மூத்தவர் உயர்கிறார் — சூரியன் மூத்த அதிகாரம்",
      "ஆழம் திறக்கிறது — சந்திர உணர்வு கடல்",
      "ராசி அதிபதி — மாபெரும் மாற்றம் — செவ்வாய் தசை விருச்சிக ராசிக்கு",
      "மூத்தவர் கரைகிறார் — ராகு அடையாள விடுதல்",
      "இறுதி ஞானம் — குரு முடிவு",
    ],
    dashaDetails: [
      {
        expect: "ஜ்யேஷ்டா புதன் தசையில் திறக்கிறார் — விருச்சிக மற்றும் புதனின் துல்லியத்தின் தனிச்சிறப்பான நுண்ணறிவுடன் கூடிய ஆரம்பம். ஆரம்பகால குழந்தை பருவம் (0–7) அடிக்கடி அசாதாரண கண்காணிப்பு திறனை காட்டுகிறது. முதல் முக்கியமான அறிவு ஆர்வம் — கணிதம், மொழி, மனோவியல் — புதன் தசையில் நிறுவப்படுகிறது.",
        navigate: "இளம் ஜ்யேஷ்டாவுக்கு புதனின் முதன்மையான நிழல் கண்ணோட்டம் மற்றும் வெளிப்பாட்டுக்கிடையே உள்ள இடைவெளி. புதன்–ராகு (~yr 2, ~2 வயது) ஒரு குழப்பமான ஆரம்பகால காலத்தை உருவாக்கலாம். புதன்–செவ்வாய் (~yr 14, ~14–15 வயது) கவனிக்கவும் — ராசி அதிபதியின் உறுதி, வலியுறுத்தல், ஆரம்பகால பதின்வயதில் மாற்றும் தீவிரம்.",
        focus: "புதன்கிழமை வழிபாடு மற்றும் இளம் ஜ்யேஷ்டாவின் உண்மையான கண்ணோட்ட திறனை பொருந்திய அறிவு சவால் வழங்குவது.",
      },
      {
        expect: "கேது தசை 17 முதல் 24 வரை உள்நோக்கிய தொட்டி — ஜ்யேஷ்டாவின் அசாதாரண நுண்ணறிவும் கண்ணோட்ட ஆழமும் உண்மையான-உலக அனுபவத்தின் நெருப்பில் சோதிக்கப்பட்டு மாயைகளிலிருந்து விடுவிக்கப்படும் காலம். பல ஜ்யேஷ்டாவுக்கு, கேது தசை முதல் உண்மையான மாயவிலக்கின் காலம்.",
        navigate: "இந்த காலத்தில் கேதுவின் முதன்மையான சவால் கசப்பு அபாயம் — மிகவும் தெளிவாக பார்க்கும் ஞானமுள்ள இளம் நபர் ஞானத்தை கூட சாத்தியமாக்கும் புரிதலுக்கு பதில் சினிசிசத்துடன் பதிலளிக்கிறார்.",
        focus: "கேது சன்னதி வழிபாடு மற்றும் பித்ரு தர்ப்பணம். கேது தசையின் மாயவிலக்கு ஜ்யேஷ்டா வாழ்க்கையின் மிகவும் முக்கியமான உருவாக்கும் அனுபவம் — தவிர்க்கப்பட வேண்டியதில்லை.",
      },
      {
        expect: "சுக்கிர தசை 24 முதல் 44 வரை ஜ்யேஷ்டாவின் நுண்ணறிவையும் ஆழத்தையும் மிகவும் செழிப்பான மற்றும் விரிவான தொழில்முறை மற்றும் உறவு சூழலுக்கு கொண்டு வருகிறது. திருமணம் சுக்கிர–குரு (~yr 3, ~27–28 வயது) அல்லது சுக்கிர–சனி (~yr 10, ~34–35 வயது). நிதி வளர்ச்சி பொதுவாக சுக்கிர தசையில் வலுவானது.",
        navigate: "சுக்கிரனின் செழிப்பு ஜ்யேஷ்டாவில் தொழில்முறை அதிக நம்பிக்கையை உருவாக்கலாம். சுக்கிர–சனி (~yr 10, ~34–35 வயது) குறிப்பிட்ட யதார்த்த சரிபார்ப்பை கொண்டு வரலாம். சுக்கிர–செவ்வாய் (~yr 7, ~31–32 வயது): ராசி அதிபதியின் சக்திவாய்ந்த 7 மாத தொழில்முறை திட்டவட்டமான தாக்கம் சாளரம்.",
        focus: "வெள்ளிக்கிழமை லட்சுமி வழிபாடு. சுக்கிர–செவ்வாய் சாளரத்திற்கு மிகவும் முனைப்பான தொழில்முறை அர்ப்பணத்தை திட்டமிடுங்கள்.",
      },
      {
        expect: "சூரியன் தசை 44 முதல் 50 வரை ஜ்யேஷ்டாவின் அதிகாரத்தின் முறையான உயர்வு. சூரியன் தசையில் மூத்த தலைமை நிலைகள் இயல்பான நிலம்; 'ஜ்யேஷ்டா' — மூத்தவர் — என்ற பெயர் சூரியன் தசையில் வெளிப்பாடு காண்கிறது.",
        navigate: "சூரியன் தசையின் அதிகாரம் ஜ்யேஷ்டாவின் இயல்பின் சர்வாதிகார நிழலை உருவாக்கலாம். வழிகாட்டும் அதிகாரம் மற்றும் ஆதிக்கம் செலுத்தும் அதிகாரம் ஆகியவற்றுக்கிடையே வேறுபாடு சூரியன் தசையின் தொடர்ந்த சோதனை. சூரியன்–ராகு (~yr 3, ~46–47 வயது) குழப்பம் கொண்டு வரலாம்.",
        focus: "ஞாயிற்றுக்கிழமை சூரிய வழிபாடு மற்றும் இந்திர சூக்த பாராயணம். அதிகாரத்தை பெற்றவர் பாதுகாக்க முடியாதவர்களுக்கு சேவையில் பயன்படுத்த கடமைப்படுகிறார்.",
      },
      {
        expect: "சந்திர தசை 50 முதல் 60 வரை ஜ்யேஷ்டாவின் மேற்பரப்பிற்கு உணர்வு கடலை கொண்டு வருகிறது. குடும்ப உறவுகள் கணிசமாக ஆழமடைகின்றன. சில ஜ்யேஷ்டாவுக்கு, மற்றொரு நபரால் உண்மையாக உணர்வு ரீதியாக அறியப்படுவதன் அனுபவம் சந்திர தசையில் மிகவும் முழுமையாக கிடைக்கிறது.",
        navigate: "ஜ்யேஷ்டாவுக்கு சந்திரனின் முதன்மையான சவால் உணர்வு பாதிப்பின் அசௌகரியம். சந்திர–ராகு (~yr 7, ~56–57 வயது) கலக்கத்தை கொண்டு வரலாம். சந்திர–செவ்வாய் (~yr 4, ~54–55 வயது): ராசி அதிபதியின் சக்திவாய்ந்த 7 மாத தெளிவு சாளரம்.",
        focus: "திங்கட்கிழமை சந்திர வழிபாடு மற்றும் வேண்டுமென்றே உணர்வு இருப்பு. சந்திர–செவ்வாய் சாளரத்திற்கு கவனம் செலுத்துங்கள்.",
      },
      {
        expect: "செவ்வாய் தசை 60 முதல் 67 வரை ஜ்யேஷ்டாவுக்கு ராசி அதிபதியின் வருகை. செவ்வாய் உங்கள் ராசியான விருச்சிகத்தின் அதிபதி — இது ஜ்யேஷ்டா நேயர்களுக்கு இரட்டை வலிமையுடன் வருகிறது. ஆன்மீக அல்லது விசாரணை வேலையில் உள்ளவர்களுக்கு, வாழ்நாளின் மிகவும் ஊடுருவும் மற்றும் நீடித்த பங்களிப்புகள் செவ்வாய் தசையில் விழுகின்றன. மரபு முடிவு — நிறுவனம், சமூகம் அல்லது தளத்திற்கான ஒற்றை மிகவும் முக்கியமான பங்களிப்பு — இங்கே வருகிறது.",
        navigate: "செவ்வாயின் முதன்மையான நிழல் இந்த காலத்தில் முழுமையின் நோக்கிய சோதனை — மாற்றப்பட்ட மூத்தவர் தங்கள் புரிதல் இப்போது முழுமையானது என்று நம்பி மேலும் வளர்ச்சிக்கு மூடுகிறார். உடல் கவலைகள்: இதய-வாஸ்குலர், தசை எலும்பு மண்டலம், ஆறு தசகங்கள் ஆழ ஈடுபாட்டின் திரட்டப்பட்ட தீவிரம்.",
        focus: "செவ்வாய்க்கிழமை செவ்வாய் சன்னதி வழிபாடு மற்றும் கார்த்திகேய (முருகன்) வழிபாடு. செவ்வாய் தசை மரபு வேலை விருச்சிகத்தின் நுண்ணறிவின் முழு ஆழத்துடன் மற்றும் ராசி அதிபதியின் நெருப்பின் முழு வலிமையுடன் செய்யப்பட வேண்டும்.",
      },
      {
        expect: "ராகு தசை 67 முதல் 85 வரை ஜ்யேஷ்டா கட்டிய அடையாளத்தின் மாபெரும் கரைவதை கொண்டு வருகிறது. அதிகாரம், நுண்ணறிவு, பாதுகாப்பு செயல்பாடு — இந்த நபரை வரையறுத்த அனைத்தும் — படிப்படியாக இவை கருவிகளாக இருந்தன, ஆன்மாவாக அல்ல என்ற அங்கீகாரத்திற்கு வழிவிடுகிறது.",
        navigate: "முதுமையில் ராகுவின் விரிவாக்கம் ஞானமாக அல்லது ஆடம்பரமாக வெளிப்படலாம். ராகு–சனி (~yr 10, ~77–79 வயது) மிகவும் கோரும் துணை காலம்.",
        focus: "சனிக்கிழமை ராகு சன்னதி வழிபாடு. இந்திரனின் மூத்தவர், தொடர்ந்து பாதுகாத்து வழிநடத்திய பிறகு, ஆழமான பாதுகாப்பு விடுவிக்கும் விருப்பம் என்று கண்டுபிடிக்கிறார்.",
      },
    ],
    spirituality: [
      { title: "இந்திர & மூத்தோர் கடவுள் வழிபாடு",  desc: "தேவர்களின் ராஜாவான இந்திரன் மற்றும் ஜ்யேஷ்டாவின் தலைமை தெய்வம் — வியாழக்கிழமை இந்திர பூஜை, செவ்வாய் நெருப்பு சடங்கு (அக்னி ஹோமம்), ரிக் வேதத்திலிருந்து இந்திர சூக்த பாராயணம் மிகவும் ஒத்தொலிக்கும் பக்தி வெளிப்பாடுகள்." },
      { title: "விருச்சிக ஆழம் நடைமுறைகள்",          desc: "விருச்சிகத்தின் மாற்றும் ஆற்றல் — காளி வழிபாடு, கார்த்திகேய பக்தி, தீவிர ஆழம் நடைமுறைகள் (இரவு விழிப்புகள், நிரல் ஆய்வு, தகுதிவாய்ந்த வழிகாட்டுதலின் கீழ் தந்திரம்) — ஜ்யேஷ்டாவின் மிகவும் சக்திவாய்ந்த ஆன்மீக வழிகள்." },
      { title: "விசாரணை ஞான மரபுகள்",                desc: "ஜ்யோதிஷ், வேதாந்தம், விசாரணை ஞான மரபுகள் ஜ்யேஷ்டா தொழில்முறை பிரச்சினைகளுக்கு பயன்படுத்தும் அதே ஊடுருவும் நேர்மையை கோருவதாகும். தெளிவாக பார்க்கும் விருப்பம் — தன்னை பற்றியும் — ஜ்யேஷ்டாவின் முதன்மையான ஆன்மீக நடைமுறை." },
    ],
    guidance: "மூத்தவர் எல்லாவற்றையும் அறிந்தவர் அல்ல — அனுபவம் இல்லாமல் அறிய முடியாதவற்றை கற்றுக்கொண்டவர், மற்றும் அந்த அறிவை பெறப்பட வேண்டும் என்று கோரிக்கையிடாமல் கொடுப்பவர். நீங்கள் சுமக்கும் பாதுகாப்பு அதிகாரம் உங்கள் மாற்றப்படும் விருப்பத்தளவு மட்டுமே நம்பகமானது. விருச்சிகத்தின் ஆழத்திற்கு இறுதி தரை இல்லை; அடுத்த இறங்குதலுக்கு திறந்திருங்கள். முழுமையை உறுதிப்படுத்துவதை விட முழுமைக்கு சேவை செய்யும் நுண்ணறிவு இந்திரனின் மிக உயர்ந்த குணம், மற்றும் அது உங்களுடையது.",
    careerNote: "அதிகாரம், பாதுகாப்பு நுண்ணறிவு, மற்றவர்கள் செல்லாத இடங்களுக்கு செல்ல விருப்பம் — கஷ்டமான உண்மை, சிக்கலான விசாரணை, கோரும் தலைமை பங்கு — மையத் தேவைகளாக இருக்கும் இடங்களில் ஜ்யேஷ்டா சிறப்பாக செயல்படுகிறார்.",
    modernLead: "ஜ்யேஷ்டாவின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "பாதுகாப்பு அதிகாரம், நுண்ணறிவு ஆழம், மாற்றும் சக்தி ஜ்யேஷ்டாவின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function JyeshthaVisualPage() {
  return <NatchathiramVisualContent data={JYESHTHA} visual={JYESHTHA_VISUAL} />;
}
