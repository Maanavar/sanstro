import type { Metadata } from "next";
import { withTamilTwin } from "@/lib/localized-metadata";
import { withDasaTimingHold } from "@/lib/natchathiram-dasa-hold";
import { dasaTimingsFor } from "@/lib/natchathiram-dasa-timings";
import { nakshatraDisplayName } from "@/lib/nakshatra-display-name";
import { natchathiramVisualTa } from "@/lib/marketing-seo-ta";
import { JYESHTHA } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

const EN_METADATA: Metadata = {
  title: `${nakshatraDisplayName(JYESHTHA.number, "en")} — Visual Profile`,
  description: "Visual profile of Kettai Nakshathiram: personality traits, career strengths, dasa timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/jyeshtha/visual" },
  openGraph: {
    title: `${nakshatraDisplayName(JYESHTHA.number, "en")} — Visual Profile`,
    description: "Visual profile of Kettai Nakshathiram: personality traits, career strengths, dasa timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/jyeshtha/visual",
    type: "article",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withDasaTimingHold(await withTamilTwin(EN_METADATA, "/natchathiram/jyeshtha/visual", natchathiramVisualTa("jyeshtha")!), "jyeshtha");
}

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
    { symbol: "⚡", title: "Occult Sciences & Astrology",    desc: "Jothidam, Tantra, depth spiritual sciences — Indra's knowledge joined to Scorpio's access." },
    { symbol: "♥", title: "Psychology & Deep Therapy",      desc: "Depth psychology, trauma work, intensive psychiatric care — the willingness to accompany others into the deepest waters." },
    { symbol: "△", title: "Strategic Consulting & Planning", desc: "High-stakes strategy, crisis management, complex problem solving — Jyeshtha's senior analytical judgment." },
    { symbol: "☽", title: "Medicine & Surgical Practice",   desc: "Surgery, emergency medicine, critical care — the combination of authority, precision, and courage under pressure." },
  ],

  modernApps: [
    { symbol: "◎", title: "Executive Leadership & Strategy", desc: "C-suite advisory, organisational transformation, institutional reform — Jyeshtha's senior authority." },
    { symbol: "◈", title: "Cyber Intelligence & Forensics",  desc: "Cybersecurity investigation, digital forensics, intelligence platforms — Vrischika's penetrating depth in the digital domain." },
    { symbol: "⚡", title: "Astrology & Vedic Sciences Tech", desc: "Jothidam platforms, spiritual sciences applications, depth wisdom technology." },
    { symbol: "♥", title: "Mental Health & Trauma Tech",    desc: "Depth therapy platforms, trauma recovery applications, intensive mental health technology." },
    { symbol: "△", title: "Crisis Management & Risk Tech",   desc: "Risk intelligence platforms, crisis simulation, strategic decision tools under pressure." },
    { symbol: "☽", title: "Surgical & Critical Care Tech",  desc: "Surgical innovation platforms, critical care technology, precision medical applications." },
  ],

  dashaTimeline: [
    {
      planet: "Mercury", theme: "Born with the Elder's Intelligence",
      detail: {
        expect: "Jyeshtha opens in Mercury dasa — a beginning charged with the peculiar intelligence of Vrischika and the precision of Mercury. Mercury's is a long dasa, and the balance left at birth runs from long for births in the first pada to short for the fourth; the range shown for this dasa gives it. Early childhood often shows an unusual observational capacity: the Jyeshtha child watches, processes, and understands adult dynamics before they have the words to describe them. The awareness of power — who has it, how it works, where it can be trusted — develops in Mercury's first years with a sophistication that surprises caregivers. Where the balance runs through the school years, the result is a student of depth and precision: not necessarily the fastest or the most spontaneous, but consistently the most penetrating. The first significant intellectual passion — mathematics, language, psychology, or any domain where the hidden structure of things is revealed — establishes in Mercury dasa.",
        navigate: "Mercury's primary shadow for the young Jyeshtha is the gap between perception and expression — seeing deeply into situations that cannot yet be articulated, knowing truths that the social environment will not accept. This can produce either precocious confidence or a strategic withholding that becomes habitual. Physical concerns: nervous system hypersensitivity, respiratory function, and digestive sensitivity. The Mercury–Rahu bhukti (the table below gives when it begins and how long it lasts; for the shorter balances it falls before birth) can produce an unsettled early period.",
        focus: "Wednesday worship and the provision of intellectual challenge — advanced reading, complex puzzles, depth conversations — that matches the young Jyeshtha's actual perceptual capacity rather than their age. Also watch the Mercury–Mars bhukti (the bhukti table below gives when it begins and how long it lasts; it falls in childhood for the longer balances and has passed before birth for the shorter ones). Mars is the lord of your rasi, Vrischika — this sub-period carries the rasi lord's drive, assertion, and transformative intensity. Where it falls after birth, a period of unusual confidence, competitive breakthrough, or strategic clarity typically lands in this window.",
      },
    },
    {
      planet: "Ketu", theme: "The Inward Forge",
      detail: {
        expect: "Ketu dasa is the inward forge — the period in which Jyeshtha's unusual intelligence and perceptual depth are tested in the fire of real-world experience and stripped of the naivety that Mercury's analytical confidence can sometimes carry. For the first pada it falls at the turn from school to adult life: higher secondary education, the first career steps, and the initial encounters with adult authority — professional, institutional, and familial. For the later padas it comes earlier, in childhood and early adolescence, and the same lesson arrives young: the child who discovers that adults are not always fair. For many Jyeshtha, Ketu dasa is the period of the first real disillusionment: the discovery that authority is not always legitimate, that intelligence is not always rewarded, that depth is sometimes more burden than advantage.",
        navigate: "Ketu's primary challenge in this period is the risk of bitterness — the perceptive young person who sees too clearly and responds with cynicism rather than the wisdom that understanding also makes possible. The disillusionment of Ketu dasa is not a mistake; it is the fire that burns away sentimentality and produces the unsentimental courage that defines Jyeshtha's mature intelligence. Physical concerns: nervous system, autoimmune function, and the physical cost of intensity.",
        focus: "Ganapati worship, Ketu shrine visits and pitru tharpanam. The disillusionment of Ketu dasa is the most important formative experience of Jyeshtha's life — not to be avoided but to be moved through with the awareness that what is being burned away is not truth but illusion. The elder's wisdom always costs the price of disillusionment.",
      },
    },
    {
      planet: "Venus", theme: "Authority Meets Abundance",
      detail: {
        expect: "Venus dasa brings Jyeshtha's intelligence and depth into the most abundant and expansive professional and relational context of the life so far; it begins anywhere from adolescence to early adulthood, by pada, and runs through the long working middle of life. Career foundations build rapidly; the combination of Jyeshtha's perceptual accuracy, strategic intelligence, and unsentimental courage distinguishes them in almost any professional domain they choose to enter seriously. Where marriage falls within this dasa, it is read from the seventh house and its lord, with Venus and Jupiter as the natural significators, and judged from the individual horoscope as a tendency rather than a fixed time. Children may arrive; the family unit that Jyeshtha will protect and provide for through decades may form. Financial progress is often notable in Venus dasa — the intelligence applied to resources tends to produce results.",
        navigate: "Venus's abundance can produce in Jyeshtha a certain professional over-confidence — the intelligence that has correctly assessed most situations developing a blind spot around the situations it cannot. The perceptive person who believes their perception is complete is more dangerous than the one who knows its limits. The Venus–Saturn bhukti (the table below gives when it begins and how long it lasts) can bring a significant reality check and recalibration.",
        focus: "Friday Lakshmi worship and deliberate cultivation of epistemic humility — the knowledge that even Jyeshtha's depth perception has limits. Also watch the Venus–Mars bhukti (the bhukti table below gives when it begins and how long it lasts). Mars as rasi lord brings a potent window of intense professional drive, strategic breakthrough, and transformative capacity in the midst of Venus's abundance. The most ambitious professional commitment of the Venus dasa often crystallises in this window.",
      },
    },
    {
      planet: "Sun", theme: "The Elder Rises",
      detail: {
        expect: "Sun dasa, in mid-life, is the formal ascent of Jyeshtha's authority. The intelligence that has been accumulating since Mercury opened the life, tested in Ketu, and built through Venus, now takes its place in full solar visibility. Senior leadership positions — head of department, principal investigator, senior partner, authority figure in a community or institution — are the natural terrain. The name 'Jyeshtha' — the eldest — finds its expression in Sun dasa; others begin to defer, seek guidance, and position Jyeshtha as the senior voice.",
        navigate: "The authority of Sun dasa can produce the authoritarian shadow of Jyeshtha's nature — the protective elder who begins to control rather than guide. The difference between authority that serves and authority that dominates is the ongoing test of Sun dasa. Physical concerns: heart, eyes, and the accumulated tension of decades of intense engagement. The Sun–Rahu bhukti (the table below gives when it begins and how long it lasts) can bring disruption or challenge to the newly established authority.",
        focus: "Sunday Surya worship and Indra Sukta recitation. The elder who has earned authority has a responsibility to use it in service of those who cannot yet protect themselves — this is Indra's requirement and Jyeshtha's highest Sun dasa expression.",
      },
    },
    {
      planet: "Moon", theme: "Depth Emotion",
      detail: {
        expect: "Moon dasa, in the later working years, brings the emotional ocean to Jyeshtha's surface. The intelligence and authority of Mercury, Ketu, Venus, and Sun have been primarily outward expressions; Moon dasa insists on the interior. Family relationships deepen significantly. Children are growing into adulthood; the relationship between Jyeshtha as parent and these young adults requires the emotional intelligence that Moon dasa develops. For some Jyeshtha, the experience of being genuinely emotionally known by another person — not just intellectually respected — is most fully available in Moon dasa.",
        navigate: "Moon's primary challenge for Jyeshtha is the discomfort of emotional vulnerability. The protective elder who has been the strong one for decades may find the emotional depth of Moon dasa genuinely unfamiliar. Physical concerns: fluid balance, memory changes, and the emotional body's longstanding accumulated tension. The Moon–Rahu bhukti (the table below gives when it begins and how long it lasts) can bring turbulence.",
        focus: "Monday Moon worship and deliberate emotional presence — relationships where Jyeshtha receives care as well as giving it. Also watch the Moon–Mars bhukti (the bhukti table below gives when it begins and how long it lasts). Mars as rasi lord brings a potent window of intense clarity, protective drive, and transformative energy within Moon's otherwise introspective period.",
      },
    },
    {
      planet: "Mars", theme: "Rasi Lord — The Great Transformation",
      detail: {
        expect: "Mars dasa, in the later years, is the rasi lord's arrival for Jyeshtha. Mars is the lord of your rasi, Vrischika — this makes his dasa doubly charged for Jyeshtha natives. The Vrischika transformation that has characterised this person's entire life — the capacity to enter the deepest waters and emerge changed — now reaches its most concentrated and deliberately chosen expression. The authority accumulated in Sun dasa and the emotional depth opened in Moon dasa converge in Mars's transformative fire. For those in spiritual or investigative work, the most penetrating and enduring contributions of a lifetime typically fall in Mars dasa. For those in leadership, this is the period of the legacy decision — the single most important contribution to the institution, community, or domain they have built.",
        navigate: "Mars's primary shadow in this period is the temptation toward the absolute — the transformed elder who believes their understanding is now complete and becomes closed to further development. The greatest Jyeshtha are those who remain open to transformation even in the dasa of the rasi lord, understanding that Vrischika's depths have no final floor. Physical concerns: cardiovascular, musculoskeletal, and the accumulated intensity of a lifetime of deep engagement require deliberate care.",
        focus: "Tuesday Mars shrine prayers, red flower offerings, and Kartikeya (Murugan) worship — the deity of focused will and the spear that finds its true mark. The Mars dasa legacy work — whatever it is — must be done with the full depth of Vrischika's intelligence and the full force of the rasi lord's fire.",
      },
    },
    {
      planet: "Rahu", theme: "The Elder Dissolves",
      detail: {
        expect: "Rahu dasa, running well into advanced age, brings the great dissolution of the identity that Jyeshtha has built. The authority, the intelligence, the protective function — all the things that have defined this person from Mercury's opening — gradually give way to the recognition that these were instruments, not the self. Grandchildren and great-grandchildren receive an elder of unusual depth. For those who navigate the transition from identity to essence with Jyeshtha's characteristic unsentimental intelligence, Rahu dasa produces the most spacious and genuinely wise period of the entire life.",
        navigate: "Rahu's expansiveness in old age can manifest as either wisdom or grandiosity — the elder who has seen everything either shares it as light or wields it as control. The physical demands of Rahu dasa at this age require deliberate, consistent care: nervous system, musculoskeletal, and cardiovascular. The Rahu–Saturn bhukti (the table below gives when it begins and how long it lasts) is the most demanding sub-period.",
        focus: "Saturday Rahu shrine prayers and the deliberate practice of releasing the elder identity into the larger wisdom it has always been serving. Indra's eldest, who has protected and guided through a lifetime, discovers in Rahu dasa that the deepest protection is the willingness to let go.",
      },
    },
    {
      planet: "Jupiter", theme: "Final Wisdom",
      detail: {
        expect: "Jupiter dasa, in very advanced age, is reached by very few Jyeshtha souls. For those who arrive, Jupiter brings the closing gift of wisdom — the full-circle return to the quality of understanding that Indra's protection was always serving. The disillusionment of Ketu, the authority of Sun, the transformation of Mars, the dissolution of Rahu: all of it lands, in Jupiter's dasa, as the wholeness that it always was.",
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
      desc: "Jothidam, Vedanta, and the investigative wisdom traditions that require the same penetrating honesty that Jyeshtha applies to professional problems are the most authentic spiritual homes. The willingness to see clearly — including about oneself — is Jyeshtha's primary spiritual practice.",
    },
  ],

  guidance: "The eldest is not the one who knows everything — it is the one who has learned what cannot be known without experience, and who offers that knowing without demanding it be received. The protective authority you carry is only as trustworthy as your willingness to be transformed by it. Vrischika's depth has no final floor; remain open to the next descent. The intelligence that serves the whole, rather than confirming the self, is Indra's highest attribute, and it is yours.",

  compatibleEn: ["Anusham", "Visakam", "Ayilyam", "Moolam", "Thiruvathirai"],
  compatibleNote: "These nakshatras complement Jyeshtha's protective authority, transformative depth, and penetrating intelligence with devotion, ambition, and resonant power.",

  ta: {
    atAGlanceLabels: ["பாதுகாப்பு அதிகாரம்", "நுண்ணறிவு ஆழம்", "மூத்தோர் ஞானம்", "மாற்றும் சக்தி", "மூலோபாய தேர்ச்சி"],
    radarLabels: ["அதிகாரம்", "நுண்ணறிவு", "ஞானம்", "மாற்றம்", "மூலோபாயம்", "மீள்தன்மை"],
    coreStrengths: [
      { label: "பாதுகாப்பு அதிகாரம்",   desc: "இந்திரனின் மூத்தவர் — கேட்டை எல்லாவற்றையும் பார்த்தவர், எல்லாரையும் பாதுகாத்தவர், முன்னால் நிற்பவரின் அதிகாரத்தை கொண்டுள்ளார்." },
      { label: "நுண்ணறிவு ஆழம்",        desc: "விருச்சிகத்தின் ஆழங்கள் புதனின் துல்லியத்துடன் சேரும் — கேட்டை எந்த சூழ்நிலையிலும் உண்மையை பார்க்க கவலைப்படும் துல்லியத்துடன் ஊடுருவுகிறார்." },
      { label: "மூத்தோர் ஞானம்",        desc: "தங்கள் நிலையை அனுபவத்தின் மூலம் பெற்ற மூத்தவர் — கேட்டையின் அதிகாரம் கோரப்படவில்லை, ஆண்டாண்டாய் திரட்டப்பட்டது." },
      { label: "மாற்றும் சக்தி",         desc: "விருச்சிகத்தின் உயர்ந்த சிறப்பியல்பு — கேட்டை கஷ்டங்களின் மூலம் மாறுகிறார், ஒவ்வொரு ஆழத்திலிருந்தும் நுழைந்தபோது இல்லாத திறன்களுடன் வெளிவருகிறார்." },
      { label: "மூலோபாய நுண்ணறிவு",    desc: "விருச்சிகத்தில் புதனும் செவ்வாயும் — பகுப்பாய்வு மனம் மற்றும் மூலோபாய விருப்பம் ஆழமான சேனலில் வேலை செய்கிறது." },
      { label: "உணர்வற்ற தைரியம்",      desc: "கேட்டை கஷ்டத்திலிருந்து விலகுவதில்லை — உணர்வு இல்லாததால் அல்ல; விலகுவது உதவாது என்று கற்றுக்கொண்டதால்." },
    ],
    careerAbilityLabels: ["தலைமை & பாதுகாப்பு", "விசாரணை & நுண்ணறிவு", "ஆன்மீக & மறைஞான அறிவியல்கள்", "மூலோபாய மேலாண்மை", "மருத்துவம் & ஆழ மனோவியல்"],
    careerClusters: [
      { title: "மூத்த தலைமை & ஆட்சி",       desc: "நிறுவன மற்றும் நிறுவனத்தின் தலைமை — எடையை சுமக்கும் மற்றும் அதிகாரத்தை பெறும் மூத்தவர்." },
      { title: "விசாரணை & நுண்ணறிவு வேலை",   desc: "நுண்ணறிவு பகுப்பாய்வு, தடயவியல் வேலை, விசாரணை ஆராய்ச்சி — தொழில்முறையாக பயன்படுத்தப்படும் விருச்சிகத்தின் ஊடுருவும் ஆழம்." },
      { title: "மறைஞான அறிவியல்கள் & ஜோதிடம்", desc: "ஜ்யோதிஷ், தந்திரம், ஆழ ஆன்மீக அறிவியல்கள் — இந்திரனின் ஞானம் விருச்சிகத்தின் அணுகலுடன்." },
      { title: "மனோவியல் & ஆழ சிகிச்சை",    desc: "ஆழ மனோவியல், மனக்காயம் வேலை, தீவிர மனநல பராமரிப்பு — ஆழமான நீரில் மற்றவர்களை துணை செய்ய விருப்பம்." },
      { title: "மூலோபாய ஆலோசனை & திட்டமிடல்", desc: "உயர்-பங்கு மூலோபாயம், நெருக்கடி மேலாண்மை, சிக்கலான சிக்கல் தீர்வு." },
      { title: "மருத்துவம் & அறுவை சிகிச்சை நடைமுறை", desc: "அறுவை சிகிச்சை, அவசர மருத்துவம், விமர்சன பராமரிப்பு — அழுத்தத்தில் அதிகாரம், துல்லியம், தைரியம் ஒன்றிணைவது." },
    ],
    modernApps: [
      { title: "நிர்வாக தலைமை & மூலோபாயம்",   desc: "உயர்நிலை நிர்வாக ஆலோசனை, நிறுவன மாற்றம், நிறுவன சீர்திருத்தம் — கேட்டையின் மூத்த அதிகாரம்." },
      { title: "சைபர் நுண்ணறிவு & தடயவியல்",   desc: "சைபர் பாதுகாப்பு விசாரணை, டிஜிட்டல் தடயவியல், நுண்ணறிவு தளங்கள் — டிஜிட்டல் தளத்தில் விருச்சிகத்தின் ஊடுருவும் ஆழம்." },
      { title: "ஜோதிட & வேத அறிவியல் தொழில்நுட்பம்", desc: "ஜ்யோதிஷ் தளங்கள், ஆன்மீக அறிவியல் பயன்பாடுகள், ஆழ ஞான தொழில்நுட்பம்." },
      { title: "மனநல & மனக்காயம் தொழில்நுட்பம்", desc: "ஆழ சிகிச்சை தளங்கள், மனக்காயம் மீட்பு பயன்பாடுகள், தீவிர மனநல தொழில்நுட்பம்." },
      { title: "நெருக்கடி மேலாண்மை & அபாய தொழில்நுட்பம்", desc: "அபாய நுண்ணறிவு தளங்கள், நெருக்கடி உருவகப்படுத்தல், அழுத்தத்தின் கீழ் மூலோபாய முடிவு கருவிகள்." },
      { title: "அறுவை சிகிச்சை & விமர்சன பராமரிப்பு தொழில்நுட்பம்", desc: "அறுவை சிகிச்சை கண்டுபிடிப்பு தளங்கள், விமர்சன பராமரிப்பு தொழில்நுட்பம், துல்லிய மருத்துவ பயன்பாடுகள்." },
    ],
    dashaThemes: [
      "மூத்தோரின் நுண்ணறிவுடன் பிறப்பு — புதன் ஆரம்பம், விருச்சிக ஆழம்",
      "உள்நோக்கிய உலை — கேது சோதனை, மாயை கரைவது",
      "அதிகாரம் செழிப்பை சந்திக்கிறது — சுக்கிர வளர்ச்சி, தொழில் நிறுவல்",
      "மூத்தவர் உயர்கிறார் — சூரியன் மூத்த அதிகாரம்",
      "ஆழம் திறக்கிறது — சந்திர உணர்வு கடல்",
      "ராசி அதிபதி — மாபெரும் மாற்றம் — செவ்வாய் தசை விருச்சிக ராசிக்கு",
      "மூத்தவர் கரைகிறார் — ராகு அடையாள விடுதல்",
      "இறுதி ஞானம் — குரு முடிவு",
    ],
    dashaDetails: [
      {
        expect: "கேட்டை புதன் தசையில் தொடங்குகிறது — விருச்சிகத்தின் தனிச்சிறப்பான நுண்ணறிவும் புதனின் துல்லியமும் நிறைந்த தொடக்கம். புதன் நீண்ட தசை; பிறக்கும்போது மீதமுள்ள இருப்பு முதல் பாதத்தில் நீளமாகவும் நான்காம் பாதத்தில் குறுகியதாகவும் இருக்கும் — இந்த தசைக்குக் காட்டப்படும் வரம்பு அதைச் சொல்கிறது. ஆரம்பக் குழந்தைப் பருவம் அடிக்கடி அசாதாரண கவனிக்கும் திறனைக் காட்டுகிறது: கேட்டைக் குழந்தை பெரியவர்களின் இயக்கவியலை விளக்கும் சொற்கள் வருவதற்கு முன்பே பார்க்கிறது, புரிந்துகொள்கிறது. அதிகாரம் பற்றிய விழிப்புணர்வு — யாரிடம் இருக்கிறது, எப்படிச் செயல்படுகிறது, எங்கே நம்பலாம் — புதனின் முதல் ஆண்டுகளில் பராமரிப்பாளர்களை வியக்க வைக்கும் நுட்பத்துடன் வளர்கிறது. இருப்பு பள்ளிக் காலம் முழுவதும் நீண்டால் ஆழமும் துல்லியமும் கொண்ட மாணவர் உருவாகிறார்: வேகமானவர் அல்லது தன்னிச்சையானவர் என்று அவசியமில்லை, ஆனால் தொடர்ந்து மிகவும் ஊடுருவுபவர். முதல் முக்கியமான அறிவு ஆர்வம் — கணிதம், மொழி, உளவியல், பொருட்களின் மறைவான அமைப்பு வெளிப்படும் எந்தத் துறையும் — புதன் தசையில் நிறுவப்படுகிறது.",
        navigate: "இளம் கேட்டைக்கு புதனின் முதன்மை நிழல், உணர்வதற்கும் வெளிப்படுத்துவதற்கும் இடையிலான இடைவெளி — இன்னும் சொல்ல முடியாத சூழ்நிலைகளுக்குள் ஆழமாகப் பார்ப்பது, சமூகச் சூழல் ஏற்காத உண்மைகளை அறிவது. இது முன்கூட்டிய தன்னம்பிக்கையையோ, பழக்கமாகிவிடும் உத்தி சார்ந்த மறைத்தலையோ உருவாக்கலாம். உடல் கவலைகள்: நரம்பு மண்டல மிகை உணர்திறன், சுவாச செயல்பாடு, செரிமான உணர்திறன். புதன்–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்; குறைந்த இருப்பில் அது பிறப்புக்கு முன்பே வந்துவிடும்) நிலையற்ற ஆரம்பகாலத்தை உருவாக்கலாம்.",
        focus: "புதன்கிழமை வழிபாடும், இளம் கேட்டையின் வயதுக்கு அல்ல, அவரது உண்மையான புலனுணர்வு ஆற்றலுக்கு ஏற்ற அறிவுச் சவாலை — மேம்பட்ட வாசிப்பு, சிக்கலான புதிர்கள், ஆழமான உரையாடல்கள் — வழங்குவதும். கவனிக்கவும்: புதன்–செவ்வாய் புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்; நீண்ட இருப்பில் அது குழந்தைப் பருவத்திலும், குறைந்த இருப்பில் பிறப்புக்கு முன்பும் வரும்). செவ்வாய் உங்கள் ராசியான விருச்சிகத்தின் அதிபதி — இந்த துணைக் காலம் ராசி அதிபதியின் உந்துதல், உறுதிப்பாடு, மாற்றும் தீவிரத்தைக் கொண்டுவருகிறது. இது பிறப்புக்குப் பின் வருமானால், அசாதாரண தன்னம்பிக்கை, போட்டித் திருப்புமுனை அல்லது உத்தித் தெளிவின் காலம் பொதுவாக இந்த சாளரத்தில் வரும்.",
      },
      {
        expect: "கேது தசை உள்நோக்கிய உலை — கேட்டையின் அசாதாரண நுண்ணறிவும் புலனுணர்வு ஆழமும் உண்மை உலக அனுபவத்தின் நெருப்பில் சோதிக்கப்பட்டு, புதனின் பகுப்பாய்வு நம்பிக்கை சில நேரம் சுமக்கும் அப்பாவித்தனத்திலிருந்து விடுவிக்கப்படும் காலம். முதல் பாதத்தில் இது பள்ளியிலிருந்து வயது வந்த வாழ்வுக்குத் திரும்பும் தருணத்தில் வருகிறது: மேல்நிலைக் கல்வி, முதல் தொழில் அடிகள், வயது வந்தோர் அதிகாரத்துடன் — தொழில்முறை, நிறுவனம், குடும்பம் — முதல் சந்திப்புகள். பிந்தைய பாதங்களில் இது முன்பே, குழந்தைப் பருவத்திலும் வளரிளம் பருவத்தின் தொடக்கத்திலும் வருகிறது; அதே பாடம் இளம் வயதிலேயே கிடைக்கிறது: பெரியவர்கள் எப்போதும் நியாயமானவர்கள் அல்ல என்று கண்டுபிடிக்கும் குழந்தை. பல கேட்டை ஜாதகர்களுக்கு கேது தசை முதல் உண்மையான மாயவிலக்கின் காலம்: அதிகாரம் எப்போதும் முறையானதல்ல, நுண்ணறிவு எப்போதும் வெகுமதி பெறாது, ஆழம் சில நேரம் சாதகத்தை விட சுமை என்ற கண்டுபிடிப்பு.",
        navigate: "இந்தக் காலத்தில் கேதுவின் முதன்மைச் சவால் கசப்புணர்வு அபாயம் — மிகத் தெளிவாகப் பார்க்கும் நுண்ணுணர்வுள்ள இளைஞர், புரிதல் சாத்தியமாக்கும் ஞானத்துக்குப் பதிலாக நம்பிக்கையற்ற ஏளனத்துடன் எதிர்வினையாற்றுவது. கேது தசையின் மாயவிலக்கு தவறு அல்ல; அது மிகை உணர்ச்சியை எரித்து, கேட்டையின் முதிர்ந்த நுண்ணறிவை வரையறுக்கும் உணர்ச்சிவசப்படாத துணிவை உருவாக்கும் நெருப்பு. உடல் கவலைகள்: நரம்பு மண்டலம், தன்னெதிர்ப்புச் செயல்பாடு, தீவிரத்தின் உடல் விலை.",
        focus: "விநாயகர் வழிபாடு, கேது சன்னதி வழிபாடு, பித்ரு தர்ப்பணம். கேது தசையின் மாயவிலக்கு கேட்டை வாழ்க்கையின் மிக முக்கியமான உருவாக்கும் அனுபவம் — தவிர்க்க வேண்டியது அல்ல; எரிந்து விலகுவது உண்மை அல்ல, மாயையே என்ற உணர்வுடன் கடந்து செல்ல வேண்டியது. மூத்தவரின் ஞானம் எப்போதும் மாயவிலக்கின் விலையைக் கொடுத்தே கிடைக்கிறது.",
      },
      {
        expect: "சுக்கிர தசை கேட்டையின் நுண்ணறிவையும் ஆழத்தையும் இதுவரையிலான வாழ்வின் மிகச் செழிப்பான, விரிவான தொழில்முறை மற்றும் உறவுச் சூழலுக்குக் கொண்டுவருகிறது; பாதத்தைப் பொறுத்து வளரிளம் பருவத்திலோ இளம் வயது வந்த காலத்திலோ தொடங்கி, வாழ்வின் நீண்ட பணி நடுப்பகுதி வழியாகச் செல்கிறது. தொழில் அடித்தளம் விரைவாக அமைகிறது; கேட்டையின் உணர்தல் துல்லியம், உத்தி நுண்ணறிவு, உணர்ச்சிவசப்படாத துணிவு ஆகியவற்றின் சேர்க்கை அவர் தீவிரமாக நுழையத் தேர்ந்தெடுக்கும் எந்தத் தொழில் துறையிலும் அவரைத் தனித்துக்காட்டுகிறது. இந்தத் தசைக்குள் திருமணம் அமைந்தால், அது ஜாதகத்தின் ஏழாம் வீட்டையும் அதன் அதிபதியையும் கொண்டு பார்க்கப்படுகிறது; சுக்கிரனும் குருவும் அதன் இயல்பான காரகர்கள். அது ஒரு நிலையான காலம் அல்ல, ஒரு போக்கே. குழந்தைகள் வரலாம்; பல தசகங்களாகக் கேட்டை பாதுகாத்துப் போஷிக்கும் குடும்ப அமைப்பு உருவாகலாம். சுக்கிர தசையில் நிதி முன்னேற்றம் பெரும்பாலும் குறிப்பிடத்தக்கது — வளங்களுக்குப் பயன்படுத்தப்படும் நுண்ணறிவு பலன் தருகிறது.",
        navigate: "சுக்கிரனின் செழிப்பு கேட்டையில் ஒரு வகையான தொழில்முறை அதீத நம்பிக்கையை உருவாக்கலாம் — பெரும்பாலான சூழ்நிலைகளை சரியாக மதிப்பிட்ட நுண்ணறிவு, அதனால் மதிப்பிட முடியாத சூழ்நிலைகளைப் பற்றிய குருட்டுப் புள்ளியை வளர்த்துக்கொள்வது. தன் உணர்தல் முழுமையானது என்று நம்புபவர், அதன் எல்லையை அறிந்தவரை விட ஆபத்தானவர். சுக்கிர–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) குறிப்பிடத்தக்க யதார்த்தச் சரிபார்ப்பையும் மறுசீரமைப்பையும் கொண்டுவரலாம்.",
        focus: "வெள்ளிக்கிழமை லட்சுமி வழிபாடும், அறிவு வினயத்தை வேண்டுமென்றே வளர்ப்பதும் — கேட்டையின் ஆழ்ந்த உணர்தலுக்கும் எல்லைகள் உண்டு என்ற அறிவு. கவனிக்கவும்: சுக்கிர–செவ்வாய் புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்). ராசி அதிபதி செவ்வாய் சுக்கிரனின் செழிப்பின் நடுவே தீவிர தொழில்முறை உந்துதல், உத்தித் திருப்புமுனை, மாற்றும் ஆற்றலின் சக்திவாய்ந்த சாளரத்தைக் கொண்டுவருகிறார். சுக்கிர தசையின் மிக இலட்சியமான தொழில்முறை அர்ப்பணம் பெரும்பாலும் இந்த சாளரத்தில் படிகமாகிறது.",
      },
      {
        expect: "நடுவயதில் வரும் சூரிய தசை கேட்டையின் அதிகாரத்தின் முறையான உயர்வு. புதன் வாழ்வைத் தொடங்கியதிலிருந்து திரண்டு, கேதுவில் சோதிக்கப்பட்டு, சுக்கிரன் வழியாகக் கட்டப்பட்ட நுண்ணறிவு, இப்போது முழுச் சூரியத் தெரிவுநிலையில் தன் இடத்தைப் பெறுகிறது. மூத்த தலைமை நிலைகள் — துறைத் தலைவர், முதன்மை ஆய்வாளர், மூத்த கூட்டாளி, சமூகம் அல்லது நிறுவனத்தின் அதிகார உருவம் — இயல்பான நிலம். 'கேட்டை' — மூத்தவர் — என்ற பெயர் சூரிய தசையில் வெளிப்பாடு காண்கிறது; மற்றவர்கள் மதித்து ஒதுங்கி, வழிகாட்டுதலை நாடி, கேட்டையை மூத்த குரலாக நிறுத்தத் தொடங்குகிறார்கள்.",
        navigate: "சூரிய தசையின் அதிகாரம் கேட்டையின் இயல்பில் சர்வாதிகார நிழலை உருவாக்கலாம் — வழிகாட்டுவதற்குப் பதிலாக கட்டுப்படுத்தத் தொடங்கும் பாதுகாக்கும் மூத்தவர். சேவை செய்யும் அதிகாரத்துக்கும் ஆதிக்கம் செலுத்தும் அதிகாரத்துக்கும் உள்ள வேறுபாடு சூரிய தசையின் தொடர்ந்த சோதனை. உடல் கவலைகள்: இதயம், கண்கள், பல தசகங்களாகத் தீவிரமாக ஈடுபட்டதன் திரண்ட பதற்றம். சூரிய–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) புதிதாக நிறுவப்பட்ட அதிகாரத்துக்கு தடங்கலையோ சவாலையோ கொண்டுவரலாம்.",
        focus: "ஞாயிற்றுக்கிழமை சூரிய வழிபாடு மற்றும் இந்திர சூக்த பாராயணம். அதிகாரத்தை பெற்றவர் பாதுகாக்க முடியாதவர்களுக்கு சேவையில் பயன்படுத்த கடமைப்படுகிறார்.",
      },
      {
        expect: "பிற்கால பணி ஆண்டுகளில் வரும் சந்திர தசை உணர்வுக் கடலை கேட்டையின் மேற்பரப்புக்குக் கொண்டுவருகிறது. புதன், கேது, சுக்கிரன், சூரியன் ஆகியோரின் நுண்ணறிவும் அதிகாரமும் முதன்மையாக வெளிப்புற வெளிப்பாடுகளாக இருந்தன; சந்திர தசை உள்ளார்ந்ததை வலியுறுத்துகிறது. குடும்ப உறவுகள் கணிசமாக ஆழமடைகின்றன. குழந்தைகள் வயது வந்தோராக வளர்கிறார்கள்; பெற்றோராக கேட்டைக்கும் இந்த இளம் வயது வந்தவர்களுக்கும் இடையிலான உறவு சந்திர தசை வளர்க்கும் உணர்வு நுண்ணறிவைக் கோருகிறது. சில கேட்டை ஜாதகர்களுக்கு, அறிவால் மட்டுமின்றி, உண்மையாக உணர்வுபூர்வமாக இன்னொருவரால் அறியப்படும் அனுபவம் சந்திர தசையில் மிக முழுமையாகக் கிடைக்கிறது.",
        navigate: "கேட்டைக்கு சந்திரனின் முதன்மைச் சவால் உணர்வு பாதிப்படைதலின் அசௌகரியம். பல தசகங்களாக வலிமையானவராக இருந்த பாதுகாக்கும் மூத்தவர் சந்திர தசையின் உணர்வு ஆழத்தை உண்மையிலேயே அறிமுகமற்றதாகக் காணலாம். உடல் கவலைகள்: திரவ சமநிலை, நினைவாற்றல் மாற்றங்கள், உணர்வு உடலில் நீண்டகாலம் திரண்ட பதற்றம். சந்திர–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) கலக்கத்தைக் கொண்டுவரலாம்.",
        focus: "திங்கட்கிழமை சந்திர வழிபாடும், வேண்டுமென்றே உணர்வு இருப்பும் — கேட்டை அக்கறையைக் கொடுப்பதோடு பெறவும் செய்யும் உறவுகள். கவனிக்கவும்: சந்திர–செவ்வாய் புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்). ராசி அதிபதி செவ்வாய் சந்திரனின் மற்றபடி உள்நோக்கிய காலத்துக்குள் தீவிரத் தெளிவு, பாதுகாக்கும் உந்துதல், மாற்றும் ஆற்றலின் சக்திவாய்ந்த சாளரத்தைக் கொண்டுவருகிறார்.",
      },
      {
        expect: "பிற்கால ஆண்டுகளில் வரும் செவ்வாய் தசை கேட்டைக்கு ராசி அதிபதியின் வருகை. செவ்வாய் உங்கள் ராசியான விருச்சிகத்தின் அதிபதி — இது கேட்டை ஜாதகர்களுக்கு இரட்டை வலிமையுடன் வருகிறது. இந்த நபரின் முழு வாழ்வையும் வரையறுத்த விருச்சிக மாற்றம் — ஆழ்ந்த நீருக்குள் நுழைந்து மாறி வெளிவரும் ஆற்றல் — இப்போது தன் மிகக் குவிந்த, வேண்டுமென்றே தேர்ந்தெடுத்த வெளிப்பாட்டை அடைகிறது. சூரிய தசையில் திரண்ட அதிகாரமும் சந்திர தசையில் திறந்த உணர்வு ஆழமும் செவ்வாயின் மாற்றும் நெருப்பில் சங்கமிக்கின்றன. ஆன்மீக அல்லது விசாரணைப் பணியில் உள்ளவர்களுக்கு, ஒரு வாழ்நாளின் மிக ஊடுருவும், நீடித்த பங்களிப்புகள் பொதுவாக செவ்வாய் தசையில் அமைகின்றன. தலைமைப் பொறுப்பில் உள்ளவர்களுக்கு இது மரபு முடிவின் காலம் — தாம் கட்டிய நிறுவனம், சமூகம் அல்லது துறைக்கான மிக முக்கியமான ஒற்றைப் பங்களிப்பு.",
        navigate: "இந்த காலத்தில் செவ்வாயின் முதன்மை நிழல் முழுமை நோக்கிய சோதனை — மாறிய மூத்தவர் தன் புரிதல் இப்போது முழுமையானது என்று நம்பி மேலும் வளர்ச்சிக்கு மூடிக்கொள்வது. சிறந்த கேட்டை ஜாதகர்கள், ராசி அதிபதியின் தசையிலும் மாற்றத்துக்குத் திறந்திருப்பவர்கள் — விருச்சிகத்தின் ஆழங்களுக்கு இறுதித் தரை இல்லை என்பதைப் புரிந்தவர்கள். உடல் கவலைகள்: இதய-இரத்தக் குழாய், எலும்பு–மூட்டு–தசைநார் அமைப்பு, ஒரு வாழ்நாள் ஆழ்ந்த ஈடுபாட்டின் திரண்ட தீவிரம் வேண்டுமென்றே பராமரிப்பைக் கோருகின்றன.",
        focus: "செவ்வாய்க்கிழமை செவ்வாய் சன்னதி வழிபாடு மற்றும் கார்த்திகேய (முருகன்) வழிபாடு. செவ்வாய் தசை மரபு வேலை விருச்சிகத்தின் நுண்ணறிவின் முழு ஆழத்துடன் மற்றும் ராசி அதிபதியின் நெருப்பின் முழு வலிமையுடன் செய்யப்பட வேண்டும்.",
      },
      {
        expect: "முதிர்ந்த வயதுக்குள் நீளும் ராகு தசை கேட்டை கட்டிய அடையாளத்தின் மாபெரும் கரைவைக் கொண்டுவருகிறது. அதிகாரம், நுண்ணறிவு, பாதுகாக்கும் பணி — புதன் தசையின் தொடக்கத்திலிருந்து இந்த நபரை வரையறுத்த அனைத்தும் — இவை கருவிகள், ஆன்மா அல்ல என்ற அங்கீகாரத்துக்குப் படிப்படியாக வழிவிடுகின்றன. பேரக்குழந்தைகளும் கொள்ளுப் பேரக்குழந்தைகளும் அசாதாரண ஆழமுள்ள மூத்தவரைப் பெறுகிறார்கள். அடையாளத்திலிருந்து சாரத்துக்கு மாறும் இந்தப் பயணத்தை கேட்டையின் உணர்ச்சிவசப்படாத நுண்ணறிவுடன் கடப்பவர்களுக்கு, ராகு தசை முழு வாழ்வின் மிக விசாலமான, உண்மையில் ஞானமான காலத்தை உருவாக்குகிறது.",
        navigate: "முதுமையில் ராகுவின் விரிவு ஞானமாகவோ ஆடம்பரமாகவோ வெளிப்படலாம் — எல்லாவற்றையும் பார்த்த மூத்தவர் அதை ஒளியாகப் பகிர்கிறாரா, கட்டுப்பாடாகப் பயன்படுத்துகிறாரா என்பது. இந்த வயதில் ராகு தசையின் உடல் தேவைகள் வேண்டுமென்றே, நிலையான பராமரிப்பைக் கோருகின்றன: நரம்பு மண்டலம், எலும்பு–மூட்டு–தசைநார், இதய-இரத்தக் குழாய். ராகு–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மிகவும் கோரும் துணைக் காலம்.",
        focus: "சனிக்கிழமை ராகு சன்னதி வழிபாடு. இந்திரனின் மூத்தவர், தொடர்ந்து பாதுகாத்து வழிநடத்திய பிறகு, ஆழமான பாதுகாப்பு விடுவிக்கும் விருப்பம் என்று கண்டுபிடிக்கிறார்.",
      },
      {
        expect: "மிக முதிர்ந்த வயதில் வரும் குரு தசையை மிகச் சில கேட்டை ஆத்மாக்களே அடைகின்றன. வருபவர்களுக்கு, குரு ஞானத்தின் இறுதிக் கொடையைக் கொண்டுவருகிறார் — இந்திரனின் பாதுகாப்பு எப்போதும் சேவை செய்துவந்த புரிதலின் தரத்துக்கு முழு வட்டமாகத் திரும்புதல். கேதுவின் மாயவிலக்கு, சூரியனின் அதிகாரம், செவ்வாயின் மாற்றம், ராகுவின் கரைவு: எல்லாமும் குரு தசையில் அது எப்போதும் இருந்த முழுமையாக வந்து இறங்குகின்றன.",
        navigate: "முழுமையான, மென்மையான உடல் பராமரிப்பு. இந்த மிக முதிர்ந்த வயதில் குரு என்பது இருப்பின் கொடை — அருகில் இருப்பதே பிறருக்குப் போஷிப்பாகத் தோன்றும் ஒரு அரவணைப்பும் ஒளிர்வும்.",
        focus: "வியாழக்கிழமை பிருஹஸ்பதி வழிபாடும், இந்த நபரை நேசிப்பவர்களின் இருப்பும். மூத்தவர் ஞானியாகி, ஞானி மிக எளிதில் அணுகத்தக்கவராகியிருக்கிறார். இந்திரனின் பிள்ளை குருவின் ஒளியில் ஓய்கிறது.",
      },
    ],
    spirituality: [
      { title: "இந்திர & மூத்தோர் கடவுள் வழிபாடு",  desc: "தேவர்களின் ராஜாவான இந்திரன் மற்றும் கேட்டையின் தலைமை தெய்வம் — வியாழக்கிழமை இந்திர பூஜை, செவ்வாய் நெருப்பு சடங்கு (அக்னி ஹோமம்), ரிக் வேதத்திலிருந்து இந்திர சூக்த பாராயணம் மிகவும் ஒத்திசையும் பக்தி வெளிப்பாடுகள்." },
      { title: "விருச்சிக ஆழப் பயிற்சிகள்",          desc: "விருச்சிகத்தின் மாற்றும் ஆற்றல் — காளி வழிபாடு, கார்த்திகேய பக்தி, தீவிர ஆழப் பயிற்சிகள் (இரவு விழிப்புகள், சாஸ்திர பாராயணம், தகுதிவாய்ந்த வழிகாட்டுதலின் கீழ் தந்திரம்) — கேட்டையின் மிகவும் சக்திவாய்ந்த ஆன்மீக வழிகள்." },
      { title: "விசாரணை ஞான மரபுகள்",                desc: "ஜ்யோதிஷ், வேதாந்தம், விசாரணை ஞான மரபுகள் கேட்டை தொழில்முறை பிரச்சினைகளுக்கு பயன்படுத்தும் அதே ஊடுருவும் நேர்மையை கோருவதாகும். தெளிவாக பார்க்கும் விருப்பம் — தன்னை பற்றியும் — கேட்டையின் முதன்மையான ஆன்மீகப் பயிற்சி." },
    ],
    guidance: "மூத்தவர் எல்லாவற்றையும் அறிந்தவர் அல்ல — அனுபவம் இல்லாமல் அறிய முடியாதவற்றை கற்றுக்கொண்டவர், மற்றும் அந்த அறிவை பெறப்பட வேண்டும் என்று கோரிக்கையிடாமல் கொடுப்பவர். நீங்கள் சுமக்கும் பாதுகாப்பு அதிகாரம் உங்கள் மாற்றப்படும் விருப்பத்தளவு மட்டுமே நம்பகமானது. விருச்சிகத்தின் ஆழத்திற்கு இறுதி தரை இல்லை; அடுத்த இறங்குதலுக்கு திறந்திருங்கள். முழுமையை உறுதிப்படுத்துவதை விட முழுமைக்கு சேவை செய்யும் நுண்ணறிவு இந்திரனின் மிக உயர்ந்த குணம், மற்றும் அது உங்களுடையது.",
    careerNote: "அதிகாரம், பாதுகாப்பு நுண்ணறிவு, மற்றவர்கள் செல்லாத இடங்களுக்கு செல்ல விருப்பம் — கஷ்டமான உண்மை, சிக்கலான விசாரணை, கோரும் தலைமை பங்கு — மையத் தேவைகளாக இருக்கும் இடங்களில் கேட்டை சிறப்பாக செயல்படுகிறார்.",
    modernLead: "கேட்டையின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "பாதுகாப்பு அதிகாரம், நுண்ணறிவு ஆழம், மாற்றும் சக்தி கேட்டையின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function JyeshthaVisualPage() {
  return <NatchathiramVisualContent data={JYESHTHA} visual={JYESHTHA_VISUAL} timings={dasaTimingsFor(JYESHTHA.number)} />;
}
