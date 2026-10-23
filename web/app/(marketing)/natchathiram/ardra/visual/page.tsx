import type { Metadata } from "next";
import { withTamilTwin } from "@/lib/localized-metadata";
import { withDasaTimingHold } from "@/lib/natchathiram-dasa-hold";
import { dasaTimingsFor } from "@/lib/natchathiram-dasa-timings";
import { nakshatraDisplayName } from "@/lib/nakshatra-display-name";
import { natchathiramVisualTa } from "@/lib/marketing-seo-ta";
import { ARDRA } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

const EN_METADATA: Metadata = {
  title: `${nakshatraDisplayName(ARDRA.number, "en")} — Visual Profile`,
  description: "Visual profile of Thiruvathirai Nakshathiram: personality traits, career strengths, dasa timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/ardra/visual" },
  openGraph: {
    title: `${nakshatraDisplayName(ARDRA.number, "en")} — Visual Profile`,
    description: "Visual profile of Thiruvathirai Nakshathiram: personality traits, career strengths, dasa timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/ardra/visual",
    type: "article",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withDasaTimingHold(await withTamilTwin(EN_METADATA, "/natchathiram/ardra/visual", natchathiramVisualTa("ardra")!), "ardra");
}

const ARDRA_VISUAL: NatchathiramVisualData = {
  atAGlance: [
    { label: "Analytical Depth",    score: 94 },
    { label: "Transformative Power", score: 92 },
    { label: "Scientific Insight",  score: 90 },
    { label: "Emotional Intensity",  score: 88 },
    { label: "Communicative Force",  score: 86 },
  ],

  radar: {
    labels: ["Analysis", "Transformation", "Science", "Emotion", "Communication", "Persistence"],
    values: [94, 92, 90, 88, 86, 89],
  },

  coreStrengths: [
    { symbol: "◎", label: "Analytical Depth",       score: 94, desc: "Rudra's child — they cut to the root of any problem with Shiva's piercing clarity." },
    { symbol: "◈", label: "Transformative Power",   score: 92, desc: "The storm that renews — Ardra destroys only to rebuild something truer and stronger." },
    { symbol: "⚡", label: "Scientific Intelligence", score: 90, desc: "Exceptional capacity for research, data, technology, and systematic investigation." },
    { symbol: "♥", label: "Emotional Intensity",    score: 88, desc: "Tears as symbols of depth — Ardra feels fully and transforms through that feeling." },
    { symbol: "△", label: "Communicative Force",    score: 86, desc: "Sharp, precise, direct — their words land with unusual impact and clarity." },
    { symbol: "☽", label: "Regenerative Persistence", score: 89, desc: "After every storm, Ardra rebuilds — resilience is their defining characteristic." },
  ],

  careerAbilities: [
    { label: "Research & Science",       score: 94 },
    { label: "Technology & Engineering", score: 92 },
    { label: "Writing & Analysis",       score: 90 },
    { label: "Medicine & Healing",       score: 87 },
    { label: "Social Reform & Advocacy", score: 85 },
  ],
  careerNote: "Thrives wherever deep analysis, systematic investigation, and the courage to transform broken systems intersect — the researcher, the reformer, the scientist who sees what others miss.",

  careerClusters: [
    { symbol: "◎", title: "Research & Science",       desc: "Laboratory, investigation, systematic discovery — Rudra's analytical precision." },
    { symbol: "◈", title: "Technology & Engineering",  desc: "Software, systems design, infrastructure — Ardra builds resilient structures." },
    { symbol: "⚡", title: "Writing & Journalism",     desc: "Investigative reporting, analysis, scientific writing — sharp communication." },
    { symbol: "♥", title: "Medicine & Psychology",    desc: "Psychiatry, research medicine, healing what conventional approaches miss." },
    { symbol: "△", title: "Social Reform & Law",      desc: "Policy, advocacy, legal reform — the storm of change directed at broken systems." },
    { symbol: "☽", title: "Philosophy & Spirituality", desc: "Shaiva philosophy, depth psychology, transformational spiritual practice." },
  ],

  modernApps: [
    { symbol: "◎", title: "Data Science & AI Research",   desc: "Machine learning, analytics, scientific computing — Ardra's domain of precision." },
    { symbol: "◈", title: "Cybersecurity & Systems",      desc: "Finding vulnerabilities, rebuilding secure systems — storm and renewal." },
    { symbol: "⚡", title: "Investigative Journalism",     desc: "Deep-dive reporting, fact-checking platforms, analytical media." },
    { symbol: "♥", title: "Mental Health Tech",           desc: "Psychology apps, trauma-informed platforms, therapeutic AI tools." },
    { symbol: "△", title: "Policy & Social Innovation",   desc: "Think tanks, NGOs, public systems reform, evidence-based policy." },
    { symbol: "☽", title: "Shaiva Heritage & Philosophy", desc: "Vedantic study, temple philosophy documentation, depth spiritual guidance." },
  ],

  dashaTimeline: [
    {
      planet: "Rahu", theme: "Born into the Storm",
      detail: {
        expect: "Ardra is born into Rahu dasa — a turbulent but potent opening for a nakshathiram whose nature is itself the embodiment of Rudra's storm. Rahu's is a long dasa, and the balance left at birth runs from long for births in the first pada to short for the fourth; the range shown for this dasa gives it. Early childhood often includes unusual circumstances: a family disruption, a dramatic relocation, a health challenge that resolves but leaves a mark, or an unusual intellectual precocity that adults cannot easily place. Where the balance reaches the school years, Ardra's analytical intelligence begins to distinguish itself — mathematics, science, and language all attract, but the tendency to question rather than accept is already visible. Where it runs on into adolescence, the first serious confrontation with the world's imperfections arrives, and often the first sustained passion for a subject, cause, or technology.",
        navigate: "Rahu's long opening means Ardra reaches adulthood without the stable childhood that other nakshatrams' slower dasas provide. The lack of a settled emotional foundation in early life can produce volatility, distrust of authority, or a compensatory intellectual arrogance. Health: Rahu dasa children are particularly vulnerable to skin conditions, unexplained fevers, and nervous system hypersensitivity. The Rahu–Saturn bhukti (the table below gives when it begins and how long it lasts; for the shorter balances it falls before birth) is the most demanding sub-period; existential questioning, academic pressure, and family conflict can peak simultaneously.",
        focus: "Saturday Rahu shrine prayers and coconut offerings stabilise the family's energy in Ardra's childhood. Channelling the child's analytical intensity into structured science, mathematics, or technology education is the most important parental investment. Also watch the Rahu–Mercury bhukti within this dasa (the bhukti table below gives when it begins and how long it lasts; for the shorter balances it has already passed before birth). Mercury is the lord of your rasi, Mithuna — this sub-period, brief but potent, carries the rasi lord's amplified communicative and analytical intelligence. Where it falls after birth, an unusual academic achievement, a writing or science competition win, or a period of exceptional intellectual productivity typically lands in this window. Do not miss it.",
      },
    },
    {
      planet: "Jupiter", theme: "The Analytical Mind Finds Its Work",
      detail: {
        expect: "Jupiter dasa is when Ardra's storm-forged intelligence finds its proper application. For the later padas it begins in childhood and carries Ardra through schooling and higher education into the first working years; for the first pada it begins as school closes, and covers higher education, the launch of a career, and the first stable home. Higher education or vocational training establishes — sciences, technology, medicine, law, or social research are the most natural domains. Career launches with unusual analytical capability, and early recognition — a research publication, a technology breakthrough, an investigative piece that matters — may arrive in the working years of this dasa. Where marriage falls within this dasa, it is read from the seventh house and its lord, with Venus and Jupiter as the natural significators, and judged from the individual horoscope as a tendency rather than a fixed time. Where it reaches adult life, children, if sought, may come. The first stable home and professional identity consolidate.",
        navigate: "Jupiter's generosity can amplify Ardra's natural intensity into intellectual arrogance — the belief that analytical superiority justifies dismissiveness toward those whose thinking is less rigorous. Relationships outside the intellectual or professional domain can feel unfamiliar; the emotional intelligence that Ardra carries from Rahu dasa's turbulence needs conscious cultivation, not avoidance. Liver health and overwork accumulation deserve attention as the working years begin.",
        focus: "Thursday Brihaspati or Dakshinamurthy worship amplifies Jupiter's abundance. This is the window for Ardra to complete the education, publish the research, and build the professional reputation that will serve for decades. Also watch the Jupiter–Mercury bhukti within this dasa (the bhukti table below gives when it begins and how long it lasts; depending on the pada it falls anywhere from childhood to the early working years). Mercury as rasi lord makes this one of the most intellectually fertile sub-periods of Ardra's entire life — analytical work completed, communicative contributions made, or milestones reached in this bhukti carry the rasi lord's amplification. Prepare the most significant deliverable of the time for this window.",
      },
    },
    {
      planet: "Saturn", theme: "The Reformer's Long Work",
      detail: {
        expect: "Saturn dasa falls in different seasons by pada — for the later padas it begins in late adolescence or early adulthood, for the first pada in the settled working years — and in every case it runs through the long middle of working life. It tests every system Ardra has built, and rewards those built on genuine rigor. Career reaches institutional depth; leadership roles, research leadership, senior editorial positions, or advanced medical or legal practice become the terrain. Family life stabilises fully; children enter school and adolescence. Property acquisition and financial consolidation typically occur once the person is established. The social reformer in Ardra — always present but sometimes submerged by pragmatism — re-emerges with force in Saturn dasa, often producing Ardra's most enduring contribution to a field or a community.",
        navigate: "Saturn's primary physical concerns for Ardra in this dasa are musculoskeletal, respiratory, and cardiovascular. Chronic overwork — Ardra's constitutional tendency — accumulates in Saturn dasa and must be managed with deliberate rest. The Saturn–Rahu bhukti (the table below gives when it begins and how long it lasts) is the most turbulent sub-period; career pressures, family obligations, and health can converge acutely. Relationships that survived Rahu and Jupiter dasas must now survive Saturn's demand for sustained depth rather than intellectual excitement.",
        focus: "Saturday oil bath, Shani temple worship and Hanuman worship are essential. The reformist impulse that Saturn dasa activates in Ardra must be channelled into sustained systemic work — not reactive confrontation. One well-chosen institutional contribution, made with patience and persistence through the full arc of Saturn dasa, produces more lasting change than many brilliant interventions.",
      },
    },
    {
      planet: "Mercury", theme: "Rasi Lord — The Great Analysis",
      detail: {
        expect: "Mercury dasa, in the later working years, is the rasi lord's arrival for Ardra. Mercury is the lord of your rasi, Mithuna — this makes his dasa doubly charged for Ardra natives. Where other nakshathirams experience Mercury dasa as one planetary period among many, for Ardra it is the rasi lord himself taking the wheel in the final active professional years. Analytical writing, intellectual legacy-building, teaching, and communicative mastery reach their lifetime peak. The accumulated research, the years of systematic investigation, the disciplined thinking — all of it crystallises into work that will outlast its author. For those in teaching, science, or writing, the most significant works of a lifetime land here.",
        navigate: "Mercury's primary health concerns at this age are nervous system and respiratory. Mental agility, maintained through active analytical engagement, outlasts physical agility. The intensity that has characterised Ardra's entire intellectual life must now be channelled into transmission rather than perpetual investigation — the storm has produced its rain; now let the earth use it.",
        focus: "Wednesday worship, green offerings, and sustained intellectual engagement — writing, teaching, research leadership — are Mercury's primary remedies for Ardra. Any significant written work, scientific contribution, or communicative legacy that has been deferred from earlier decades must be completed in Mercury dasa. Vishnu Sahasranama recitation provides Mercury's natural stabilising counterpoint to Ardra's intensity.",
      },
    },
    {
      planet: "Ketu", theme: "After the Storm — Stillness",
      detail: {
        expect: "Ketu dasa, in later life, calls Ardra into the deep interior — the storm that has raged for a lifetime finally grows quiet, and in the silence, Shiva's true nature emerges. Spiritual depth that has been deferred by the urgency of analytical work surfaces with unusual force. Grandchildren and great-grandchildren receive a quality of loving attention that the professional years could not always provide. Creative or contemplative work — writing that is not analysis but poetry, practice that is not investigation but devotion — becomes possible for the first time.",
        navigate: "Ketu's natural withdrawal tendency is amplified by age; avoid the extreme of complete social isolation which can accelerate decline. Physical needs are specific: warmth, regular nourishment, gentle movement, and the company of those who understand depth. Spiritual companions matter greatly in Ketu dasa, alongside medical care, not instead of it.",
        focus: "Ganapati worship and Ketu shrine visits; pitru tharpanam and black sesame offerings complete ancestral obligations. Shaiva texts such as the Thirumantiram, or any Shiva-devotional work, with the Tirukkural, the Tamil ethical classic, beside them, are the most resonant companions for this period. Ardra's long relationship with Rudra reaches its most intimate expression in Ketu dasa.",
      },
    },
    {
      planet: "Venus", theme: "Unexpected Beauty",
      detail: {
        expect: "Venus dasa, in advanced age, brings an unexpected softening to Ardra's lifelong storm. Beauty — music, art, relationship, the sensory richness of life — arrives with a gentleness that the analytical intellect could not previously access. Family bonds deepen. Grandchildren and great-grandchildren become the primary joy. Creative work in this period, if pursued, has a quality of serene completion that contrasts beautifully with the intensity of everything that preceded it.",
        navigate: "At this age, physical care is primary: warmth, adequate nourishment, gentle movement, and steady companionship. The nervous system and respiratory system deserve particular attention through these years. Venus's natural affinity with comfort and beauty should be actively supported in the living environment.",
        focus: "Friday Lakshmi worship, rose and jasmine offerings, and surrounding the person with music, natural beauty, and affectionate presence are the most appropriate care and remedy. A life of storm and depth arriving at beauty and grace is Ardra's most elegant completion.",
      },
    },
    {
      planet: "Sun", theme: "Final Solar Clarity",
      detail: {
        expect: "Sun dasa, in very advanced age, is reached by very few. For those who arrive here, the Sun brings a final gift of radiant clarity — the analytical intelligence that has pierced problems for a lifetime now simply rests in its own luminous awareness. Identity is settled; the storm has long since passed; what remains is pure solar presence.",
        navigate: "Physical care at this age is complete and tender. Warmth, light, familiar sounds, and the presence of those who understand the depth of this person's life — these are everything.",
        focus: "Sunday Surya worship and Aditya Hridayam recitation are the final devotional gestures. Rudra's child, having raged and researched and transformed, ends in light.",
      },
    },
    {
      planet: "Moon", theme: "Oceanic Rest",
      detail: {
        expect: "Moon dasa at this extreme age is reached by virtually none. For those rare souls who persist here, the Moon brings the tidal completeness — the full emotional ocean that Ardra's storm always promised. The analytical fire is long quiet; what remains is the cool, vast feeling of water after rain.",
        navigate: "Complete physical care and gentle emotional presence from caregivers who appreciate the depth of this rare person's life are everything. The body's requirements are simple.",
        focus: "Monday worship, water offerings, and the presence of flowing water or music — these are the appropriate final companions for Mithuna's Rudra child in Moon's final embrace.",
      },
    },
  ],

  spirituality: [
    {
      title: "Rudra & Shiva Worship",
      desc: "Ardra's presiding deity is Rudra — Monday Shiva worship, Pradosha observance, Abhishekam, and recitation of the Rudrashtadhyayi are the deepest spiritual practices.",
    },
    {
      title: "Transformational Sadhana",
      desc: "For Ardra, spiritual practice must include transformation — not mere devotion. Fasting, vows, and practices that genuinely challenge comfort align with Rudra's nature.",
    },
    {
      title: "Sacred Storm Shrines",
      desc: "Chidambaram Nataraja, Thiruvannamalai (Annamalai), and forest Shiva temples connected to storms and lightning carry special resonance for Ardra natives.",
    },
  ],

  guidance: "Your storm is your instrument — not your enemy. Let the analytical fire burn through pretence without burning the people around you. The world needs Rudra's reform; give it the sustained, rigorous, compassionate version, and Ardra's rare intelligence will leave a permanent mark.",

  compatibleEn: ["Punarpoosam", "Swathi", "Sadayam", "Kettai", "Visakam"],
  compatibleNote: "These nakshatras complement Ardra's analytical intensity, transformative power, and communicative precision with stability, warmth, and intellectual resonance.",

  ta: {
    atAGlanceLabels: ["பகுப்பாய்வு ஆழம்", "மாற்றும் சக்தி", "அறிவியல் நுண்ணறிவு", "உணர்வு தீவிரம்", "தொடர்பு வலிமை"],
    radarLabels: ["பகுப்பாய்வு", "மாற்றம்", "அறிவியல்", "உணர்வு", "தொடர்பு", "தொடர்ச்சி"],
    coreStrengths: [
      { label: "பகுப்பாய்வு ஆழம்",     desc: "ருத்ரனின் பிள்ளை — எந்த பிரச்சினையின் வேரையும் சிவனின் ஊடுருவும் தெளிவுடன் வெட்டுகிறார்கள்." },
      { label: "மாற்றும் சக்தி",        desc: "புதுப்பிக்கும் புயல் — திருவாதிரை கட்டவிழ்க்கும், உண்மையானதை மட்டும் மீண்டும் கட்டமைக்கும்." },
      { label: "அறிவியல் நுண்ணறிவு",   desc: "ஆராய்ச்சி, தரவு, தொழில்நுட்பம், முறையான விசாரணைக்கான அசாதாரண திறன்." },
      { label: "உணர்வு தீவிரம்",        desc: "ஆழத்தின் சின்னமான கண்ணீர் — திருவாதிரை ஜாதகர்கள் முழுமையாக உணர்கிறார்கள் மற்றும் அந்த உணர்வின் மூலம் மாறுகிறார்கள்." },
      { label: "தொடர்பு வலிமை",        desc: "கூர்மையான, துல்லியமான, நேரடியான — அவர்களின் வார்த்தைகள் அசாதாரண தாக்கத்துடன் தரையிறங்குகின்றன." },
      { label: "புத்துயிர் தொடர்ச்சி",  desc: "ஒவ்வொரு புயலுக்கும் பிறகு, திருவாதிரை ஜாதகர் மீண்டும் கட்டமைக்கிறார் — மீள்தன்மை இவர்களின் வரையறுக்கும் குணம்." },
    ],
    careerAbilityLabels: ["ஆராய்ச்சி & அறிவியல்", "தொழில்நுட்பம் & பொறியியல்", "எழுத்து & பகுப்பாய்வு", "மருத்துவம் & குணப்படுத்தல்", "சமூக சீர்திருத்தம் & வழக்காடல்"],
    careerClusters: [
      { title: "ஆராய்ச்சி & அறிவியல்",     desc: "ஆய்வகம், விசாரணை, முறையான கண்டுபிடிப்பு — ருத்ரனின் பகுப்பாய்வு துல்லியம்." },
      { title: "தொழில்நுட்பம் & பொறியியல்", desc: "மென்பொருள், அமைப்பு வடிவமைப்பு, உள்கட்டமைப்பு — திருவாதிரை ஜாதகர் மீள்திறன் மிக்க கட்டமைப்புகளை கட்டுகிறார்." },
      { title: "எழுத்து & பத்திரிகை",       desc: "விசாரணை அறிக்கையிடல், பகுப்பாய்வு, அறிவியல் எழுத்து — கூர்மையான தொடர்பு." },
      { title: "மருத்துவம் & உளவியல்",       desc: "உளநல சிகிச்சை, ஆராய்ச்சி மருத்துவம், வழக்கமான அணுகுமுறைகள் தவறவிட்டதை குணப்படுத்துதல்." },
      { title: "சமூக சீர்திருத்தம் & சட்டம்", desc: "கொள்கை, வழக்காடல், சட்ட சீர்திருத்தம் — முறிந்த அமைப்புகளில் மாற்றத்தின் புயல்." },
      { title: "தத்துவம் & ஆன்மீகம்",        desc: "சைவ தத்துவம், ஆழ மனோவியல், மாற்றும் ஆன்மீக நடைமுறை." },
    ],
    modernApps: [
      { title: "தரவு அறிவியல் & AI ஆராய்ச்சி", desc: "இயந்திர கற்றல், பகுப்பாய்வு, அறிவியல் கம்ப்யூட்டிங் — திருவாதிரையின் துல்லிய தளம்." },
      { title: "சைபர் பாதுகாப்பு & அமைப்புகள்", desc: "பாதிப்புகளை கண்டறிதல், பாதுகாப்பான அமைப்புகளை மீண்டும் கட்டமைத்தல் — புயலும் புதுப்பித்தலும்." },
      { title: "விசாரணை பத்திரிகை",            desc: "ஆழமான அறிக்கையிடல், உண்மை சரிபார்ப்பு தளங்கள், பகுப்பாய்வு ஊடகம்." },
      { title: "மனநல தொழில்நுட்பம்",          desc: "உளவியல் ஆப்கள், மனக்காயம் தகவல் தளங்கள், சிகிச்சை AI கருவிகள்." },
      { title: "கொள்கை & சமூக கண்டுபிடிப்பு",  desc: "ஆலோசனை குழுக்கள், NGOகள், பொது அமைப்பு சீர்திருத்தம், சான்று அடிப்படையிலான கொள்கை." },
      { title: "சைவ பாரம்பரியம் & தத்துவம்",    desc: "வேதாந்த ஆய்வுகள், கோவில் தத்துவம் ஆவணமாக்கல், ஆழ ஆன்மீக வழிகாட்டல்." },
    ],
    dashaThemes: [
      "புயலில் பிறப்பு — ராகு சக்தி, ஆரம்பகால மாற்றம், அறிவு விழிப்பு",
      "பகுப்பாய்வு மனம் தன் வேலையை கண்டுபிடிக்கிறது — கல்வி, தொழில், முதல் முக்கிய பங்களிப்பு",
      "சீர்திருத்தகரின் நீண்ட வேலை — நிறுவன ஆழம், மரபு கட்டுவது",
      "ராசி அதிபதி — மாபெரும் பகுப்பாய்வு — புதன் தசை மிதுன ராசிக்கு",
      "புயலுக்கு பிறகு — அமைதி, ஆன்மீக திரும்பல், ருத்ரன் வெளிப்பாடு",
      "எதிர்பாராத அழகு — சுக்கிர மென்மை, குடும்ப ஆழம், படைப்பு நிறைவு",
      "இறுதி சூரிய தெளிவு — ஒளியில் மூழ்குதல்",
      "கடல் ஓய்வு — வட்டம் நிறைவடைகிறது",
    ],
    dashaDetails: [
      {
        expect: "திருவாதிரை ஜாதகர் ராகு தசையில் பிறக்கிறார் — இயல்பில் ருத்ரனின் புயலையே உள்ளடக்கிய நட்சத்திரத்திற்கு கலக்கமான ஆனால் சக்திவாய்ந்த திறப்பு. ராகு நீண்ட தசை; பிறக்கும்போது மீதமுள்ள இருப்பு முதல் பாதத்தில் நீளமாகவும் நான்காம் பாதத்தில் குறுகியதாகவும் இருக்கும் — இந்த தசைக்குக் காட்டப்படும் வரம்பு அதைச் சொல்கிறது. ஆரம்பகாலக் குழந்தைப் பருவம் அடிக்கடி அசாதாரண சூழ்நிலைகளை உள்ளடக்குகிறது: குடும்பக் கலைச்சல், திடீர் குடிமாற்றம், தடம் பதிக்கும் ஆரோக்கிய சவால், அல்லது பெரியவர்கள் எளிதில் புரிந்துகொள்ள முடியாத அறிவு முதிர்ச்சி. இருப்பு பள்ளிக் காலத்தை எட்டினால் திருவாதிரையின் பகுப்பாய்வு நுண்ணறிவு கணிதம், அறிவியல், மொழியில் தன்னை வேறுபடுத்திக்கொள்ளத் தொடங்கும்; ஏற்றுக்கொள்வதற்குப் பதிலாகக் கேள்வி கேட்கும் போக்கு ஏற்கனவே தெரியும். வளரிளம் பருவம் வரை நீண்டால், உலகின் குறைகளுடன் முதல் தீவிர மோதல் வரும்; ஒரு பாடம், இலட்சியம் அல்லது தொழில்நுட்பத்தின் மீது முதல் நீடித்த ஆர்வமும் அடிக்கடி உருவாகும்.",
        navigate: "ராகுவின் நீண்ட திறப்பு, மற்ற நட்சத்திரங்களின் மெதுவான தசைகள் வழங்கும் நிலையான குழந்தைப் பருவம் இல்லாமல் திருவாதிரை வயது வந்த நிலைக்கு வருவதைக் குறிக்கிறது. ஆரம்ப வாழ்வில் நிலையான உணர்வு அடித்தளம் இல்லாதது நிலையற்ற மனப்பான்மை, அதிகாரத்தின் மீது அவநம்பிக்கை அல்லது ஈடுசெய்யும் அறிவார்ந்த அகந்தையை உருவாக்கலாம். ஆரோக்கியம்: ராகு தசையில் குழந்தைகள் தோல் நிலைகள், விளக்கமுடியாத காய்ச்சல்கள், நரம்பு மண்டல மிகை உணர்திறன் ஆகியவற்றுக்கு குறிப்பாக பாதிக்கப்படக்கூடியவர்கள். ராகு–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்; குறைந்த இருப்பில் அது பிறப்புக்கு முன்பே வந்துவிடும்) மிகவும் கோரும் துணைக் காலம்; வாழ்க்கையின் அடிப்படை பற்றிய கேள்விகள், கல்வி அழுத்தம், குடும்பப் பூசல் ஆகியவை ஒரே நேரத்தில் உச்சமடையலாம்.",
        focus: "சனிக்கிழமை ராகு சன்னதி வழிபாடும் தேங்காய் அர்ப்பணமும் திருவாதிரையின் குழந்தைப் பருவத்தில் குடும்ப சக்தியை நிலைப்படுத்துகின்றன. குழந்தையின் பகுப்பாய்வுத் தீவிரத்தை கட்டமைக்கப்பட்ட அறிவியல், கணிதம், தொழில்நுட்பக் கல்வியில் செலுத்துவதே பெற்றோரின் மிக முக்கிய முதலீடு. கவனிக்கவும்: இந்த தசைக்குள் ராகு–புதன் புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்; குறைந்த இருப்பில் அது பிறப்புக்கு முன்பே கடந்துவிடும்). புதன் உங்கள் ராசியான மிதுனத்தின் அதிபதி — இந்த குறுகிய ஆனால் சக்திவாய்ந்த துணைக் காலம் ராசி அதிபதியின் மிகைப்படுத்தப்பட்ட தொடர்பு, பகுப்பாய்வு நுண்ணறிவைக் கொண்டுவருகிறது. இது பிறப்புக்குப் பின் வருமானால், அசாதாரண கல்விச் சாதனை, எழுத்து அல்லது அறிவியல் போட்டி வெற்றி, அல்லது விதிவிலக்கான அறிவார்ந்த உற்பத்தித்திறன் இந்த சாளரத்தில் வரும். இதைத் தவறவிடாதீர்கள்.",
      },
      {
        expect: "குரு தசையில்தான் திருவாதிரையின் புயல் நெருப்பால் செதுக்கப்பட்ட நுண்ணறிவு தன் சரியான பயன்பாட்டைக் கண்டுபிடிக்கிறது. பிந்தைய பாதங்களில் இது குழந்தைப் பருவத்தில் தொடங்கி பள்ளிக்கல்வி, உயர்கல்வி வழியாக முதல் பணி ஆண்டுகள் வரை செல்கிறது; முதல் பாதத்தில் பள்ளி முடியும் தருணத்தில் தொடங்கி உயர்கல்வி, தொழில் தொடக்கம், முதல் நிலையான வீடு ஆகியவற்றை உள்ளடக்குகிறது. உயர் கல்வி அல்லது தொழில் பயிற்சி நிலைபெறும் — அறிவியல், தொழில்நுட்பம், மருத்துவம், சட்டம் அல்லது சமூக ஆராய்ச்சி மிக இயல்பான தளங்கள். தொழில் அசாதாரண பகுப்பாய்வுத் திறனுடன் தொடங்குகிறது; ஆராய்ச்சி வெளியீடு, தொழில்நுட்பத் திருப்புமுனை, முக்கியமான புலனாய்வுக் கட்டுரை போன்ற ஆரம்ப அங்கீகாரம் இந்த தசையின் பணி ஆண்டுகளில் வரலாம். இந்தத் தசைக்குள் திருமணம் அமைந்தால், அது ஜாதகத்தின் ஏழாம் வீட்டையும் அதன் அதிபதியையும் கொண்டு பார்க்கப்படுகிறது; சுக்கிரனும் குருவும் அதன் இயல்பான காரகர்கள். அது ஒரு நிலையான காலம் அல்ல, ஒரு போக்கே. இது வயது வந்த வாழ்வை எட்டினால், விரும்பினால் குழந்தைகளும் வரலாம்; முதல் நிலையான வீடும் தொழில் அடையாளமும் உறுதிப்படும்.",
        navigate: "குருவின் தாராளத்தன்மை திருவாதிரையின் இயல்பான தீவிரத்தை அறிவார்ந்த அகந்தையாகப் பெருக்கலாம் — பகுப்பாய்வு மேன்மை, குறைந்த கடுமையுடன் சிந்திப்பவர்களை அலட்சியம் செய்ய நியாயம் தருகிறது என்ற நம்பிக்கை. அறிவு அல்லது தொழில் துறைக்கு வெளியே உள்ள உறவுகள் அறிமுகமற்றதாகத் தோன்றலாம்; ராகு தசையின் கலக்கத்திலிருந்து திருவாதிரை சுமக்கும் உணர்வு நுண்ணறிவுக்கு தவிர்ப்பு அல்ல, உணர்வுபூர்வமான வளர்ப்பு தேவை. பணி ஆண்டுகள் தொடங்கும்போது ஈரல் ஆரோக்கியமும் அதிக வேலைக் குவிப்பும் கவனிக்கப்பட வேண்டும்.",
        focus: "வியாழக்கிழமை பிருஹஸ்பதி அல்லது தட்சிணாமூர்த்தி வழிபாடு குருவின் செழிப்பை வலுப்படுத்துகிறது. கல்வியை முடிக்கவும், ஆராய்ச்சியை வெளியிடவும், பல பத்தாண்டுகளுக்குப் பயன்படும் தொழில் நற்பெயரைக் கட்டவும் திருவாதிரைக்கு இதுவே சாளரம். கவனிக்கவும்: இந்த தசைக்குள் குரு–புதன் புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்; பாதத்தைப் பொறுத்து அது குழந்தைப் பருவத்திலோ ஆரம்பப் பணி ஆண்டுகளிலோ வரலாம்). புதன் ராசி அதிபதி என்பதால் இது திருவாதிரையின் முழு வாழ்நாளிலும் மிகவும் அறிவார்ந்த வளமான துணைக் காலங்களில் ஒன்று — இந்த புக்தியில் முடிக்கப்படும் பகுப்பாய்வு வேலை, செய்யப்படும் தொடர்புப் பங்களிப்பு, எட்டப்படும் மைல்கற்கள் ராசி அதிபதியின் மிகைப்படுத்தலைக் கொண்டிருக்கும். அந்த காலத்தின் மிக முக்கியமான பணியை இந்த சாளரத்துக்குத் தயார் செய்யுங்கள்.",
      },
      {
        expect: "சனி தசை பாதத்தைப் பொறுத்து வெவ்வேறு பருவங்களில் வருகிறது — பிந்தைய பாதங்களில் வளரிளம் பருவத்தின் முடிவிலோ இளம் வயதிலோ தொடங்கி, முதல் பாதத்தில் நிலைபெற்ற பணி ஆண்டுகளில் தொடங்கி — எந்த நிலையிலும் பணி வாழ்வின் நீண்ட நடுப்பகுதி வழியாகச் செல்கிறது. திருவாதிரை கட்டிய ஒவ்வொரு அமைப்பையும் அது சோதிக்கிறது; உண்மையான கடுமையில் கட்டியவற்றை வெகுமதி தருகிறது. தொழில் நிறுவன ஆழத்தை அடைகிறது; தலைமைப் பொறுப்புகள், ஆராய்ச்சித் தலைமை, மூத்த ஆசிரியர் பதவிகள், மேம்பட்ட மருத்துவ அல்லது சட்டப் பணி ஆகியவை தளமாகின்றன. குடும்ப வாழ்க்கை முழுமையாக நிலைபெறுகிறது; குழந்தைகள் பள்ளி, வளரிளம் பருவத்தில் நுழைகிறார்கள். நபர் நிலைபெற்ற பிறகு சொத்து வாங்குவதும் நிதி ஒருங்கிணைப்பும் நிகழும். திருவாதிரையில் எப்போதும் இருந்தாலும் நடைமுறைவாதத்தால் சில நேரம் மூழ்கிப்போகும் சமூகச் சீர்திருத்தவாதி சனி தசையில் வலுவாக மீண்டும் எழுகிறார்; பெரும்பாலும் ஒரு துறைக்கோ சமூகத்துக்கோ திருவாதிரையின் மிக நீடித்த பங்களிப்பை உருவாக்குகிறார்.",
        navigate: "இந்த தசையில் திருவாதிரைக்கு சனியின் முதன்மையான உடல் கவலைகள் எலும்பு–மூட்டு–தசைநார் அமைப்பு, சுவாசம், இதயம். நாள்பட்ட அதிக வேலை — திருவாதிரையின் இயல்புப் போக்கு — சனி தசையில் குவிந்து, வேண்டுமென்றே ஓய்வு எடுத்து நிர்வகிக்கப்பட வேண்டும். சனி–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மிகவும் கலக்கமான துணைக் காலம்; தொழில் அழுத்தம், குடும்பக் கடமைகள், ஆரோக்கியம் தீவிரமாக ஒன்றுசேரலாம். ராகு, குரு தசைகளைக் கடந்து வந்த உறவுகள் இப்போது அறிவார்ந்த உற்சாகத்தை அல்ல, நீடித்த ஆழத்தைக் கோரும் சனியைக் கடக்க வேண்டும்.",
        focus: "சனிக்கிழமை எண்ணெய் குளியல், சனி கோவில் வழிபாடு, ஆஞ்சநேயர் வழிபாடு அவசியம். சனி தசை திருவாதிரையில் தூண்டும் சீர்திருத்த உந்துதல் நீடித்த, முறையான பணியில் செலுத்தப்பட வேண்டும் — எதிர்வினை மோதல்களில் அல்ல. சனி தசையின் முழு நீளத்திலும் பொறுமையோடும் விடாமுயற்சியோடும் செய்யப்படும் நன்கு தேர்ந்த ஒரு நிறுவனப் பங்களிப்பு, பல அற்புதமான தலையீடுகளை விட நீடித்த மாற்றத்தை உருவாக்குகிறது.",
      },
      {
        expect: "பிற்கால பணி ஆண்டுகளில் வரும் புதன் தசை திருவாதிரைக்கு ராசி அதிபதியின் வருகை. புதன் உங்கள் ராசியான மிதுனத்தின் அதிபதி — இது திருவாதிரை ஜாதகர்களுக்கு இரட்டை வலிமையுடன் வருகிறது. மற்ற நட்சத்திரங்கள் புதன் தசையை பல கிரக காலங்களில் ஒன்றாக அனுபவிக்கும்போது, திருவாதிரைக்கு இது செயல்படும் இறுதி தொழில் ஆண்டுகளில் ராசி அதிபதியே வாழ்க்கையை நேரடியாகக் கையில் எடுப்பது. பகுப்பாய்வு எழுத்து, அறிவார்ந்த மரபு கட்டுவது, கற்பித்தல், தொடர்புத் தேர்ச்சி வாழ்நாள் உச்சம் அடைகின்றன. திரட்டிய ஆராய்ச்சி, ஆண்டுகளான முறையான விசாரணை, ஒழுக்கமான சிந்தனை — எல்லாமே அதன் ஆசிரியரைத் தாண்டி நிலைக்கும் படைப்பாக படிகமாகிறது. கற்பித்தல், அறிவியல், எழுத்துத் துறையில் உள்ளவர்களுக்கு ஒரு வாழ்நாளின் மிக முக்கிய படைப்புகள் இங்கு உருவாகின்றன.",
        navigate: "இந்த வயதில் புதனின் முதன்மையான ஆரோக்கியக் கவலைகள் நரம்பு மண்டலமும் சுவாசமும். செயலூக்கமான பகுப்பாய்வு ஈடுபாட்டால் பேணப்படும் மனச் சுறுசுறுப்பு உடல் சுறுசுறுப்பை விட நீடிக்கிறது. திருவாதிரையின் முழு அறிவு வாழ்வையும் வரையறுத்த தீவிரம் இப்போது முடிவற்ற ஆய்வை விட ஞானக் கடத்தலுக்குத் திசைமாற்றப்பட வேண்டும் — புயல் தன் மழையைத் தந்துவிட்டது; இனி நிலம் அதைப் பயன்படுத்தட்டும்.",
        focus: "புதன்கிழமை வழிபாடு, பசுமை அர்ப்பணங்கள், செயலூக்கமான அறிவார்ந்த ஈடுபாடு — எழுத்து, கற்பித்தல், ஆராய்ச்சித் தலைமை — திருவாதிரைக்குப் புதனின் முதன்மைப் பரிகாரங்கள். முந்தைய தசகங்களிலிருந்து தள்ளிப்போடப்பட்ட எந்த முக்கியமான எழுத்தும், அறிவியல் பங்களிப்பும், தொடர்பு மரபும் புதன் தசையில் நிறைவு செய்யப்பட வேண்டும். விஷ்ணு சஹஸ்ரநாம பாராயணம் திருவாதிரையின் தீவிரத்துக்குப் புதனின் இயல்பான நிலைப்படுத்தும் சமநிலையைத் தருகிறது.",
      },
      {
        expect: "பிற்கால வாழ்வில் வரும் கேது தசை திருவாதிரையை ஆழமான உள்நோக்கிய பயணத்திற்கு அழைக்கிறது — ஒரு வாழ்நாள் சீறிய புயல் இறுதியில் அமைதியடைகிறது, அந்த மவுனத்தில் சிவனின் உண்மையான இயல்பு வெளிப்படுகிறது. பகுப்பாய்வு வேலையின் அவசரத்தால் ஒத்திவைக்கப்பட்ட ஆன்மீக ஆழம் அசாதாரண வலிமையுடன் மேலோங்குகிறது. பணி ஆண்டுகள் எப்போதும் தர முடியாத அன்பான கவனத்தை பேரன் பேத்திகளும் கொள்ளுப் பேரக்குழந்தைகளும் பெறுகிறார்கள். படைப்பு அல்லது தியான வேலை — பகுப்பாய்வாக அல்லாமல் கவிதையாக எழுதுவது, விசாரணையாக அல்லாமல் பக்தியாகச் செய்யும் பயிற்சி — முதல் முறையாக சாத்தியமாகிறது.",
        navigate: "கேதுவின் இயல்பான விலகல் போக்கு வயதால் அதிகரிக்கிறது; தளர்ச்சியை விரைவுபடுத்தக்கூடிய முழுமையான சமூகத் தனிமையைத் தவிர்க்க வேண்டும். உடல் தேவைகள் குறிப்பானவை: அரவணைப்பு, முறையான ஊட்டம், மென்மையான உடலசைவு, ஆழத்தைப் புரிந்துகொள்பவர்களின் துணை. கேது தசையில் ஆன்மீகத் துணை மிக முக்கியமானது; மருத்துவ சிகிச்சைக்கு மாற்றாக அல்ல, அதனுடன் சேர்த்து.",
        focus: "விநாயகர் வழிபாடு, கேது சன்னதி வழிபாடு; பித்ரு தர்ப்பணமும் கருப்பு எள் அர்ப்பணங்களும் முன்னோர் கடமைகளை நிறைவு செய்கின்றன. திருமந்திரம் போன்ற சைவ நூல்களும் எந்தச் சிவபக்தி நூலும், அவற்றுடன் தமிழ் அறநூலான திருக்குறளும், இந்தக் காலத்துக்கான மிகப் பொருத்தமான துணைகள். ருத்ரனுடனான திருவாதிரையின் நீண்ட உறவு கேது தசையில் அதன் மிக நெருக்கமான வெளிப்பாட்டை அடைகிறது.",
      },
      {
        expect: "முதிர்ந்த வயதில் வரும் சுக்கிர தசை திருவாதிரையின் வாழ்நாள் புயலுக்கு எதிர்பாராத மென்மையைக் கொண்டு வருகிறது. அழகு — இசை, கலை, உறவு, வாழ்வின் புலன் செழிப்பு — பகுப்பாய்வு நுண்ணறிவு முன்பு அணுக முடியாத மென்மையுடன் வருகிறது. குடும்பப் பிணைப்புகள் ஆழமடைகின்றன. பேரக்குழந்தைகளும் கொள்ளுப் பேரக்குழந்தைகளும் முதன்மை மகிழ்ச்சியாகிறார்கள். இந்த காலத்தில் படைப்பு வேலை தொடர்ந்தால், அதற்கு முன் வந்த அனைத்தின் தீவிரத்துடன் அழகாக மாறுபடும் அமைதியான நிறைவின் தன்மை இருக்கும்.",
        navigate: "இந்த வயதில், உடல் பராமரிப்பு முதன்மை: அரவணைப்பு, போதுமான ஊட்டச்சத்து, மெல்லிய அசைவு, நிலையான துணை. நரம்பு மண்டலமும் சுவாச அமைப்பும் இந்த ஆண்டுகளில் குறிப்பிட்ட கவனம் பெற வேண்டும். சுக்கிரனின் இயல்பான வசதி, அழகு நாட்டத்தை வாழும் சூழலில் தீவிரமாக ஆதரிக்க வேண்டும்.",
        focus: "வெள்ளிக்கிழமை லட்சுமி வழிபாடு, ரோஜா மற்றும் மல்லிகை அர்ப்பணம், இசை, இயற்கை அழகு, அன்பான இருப்புடன் நபரை சூழ்வது — மிகவும் பொருத்தமான பராமரிப்பு. புயல் மற்றும் ஆழத்தின் வாழ்க்கை அழகிலும் அனுகூலத்திலும் வந்து முடிகிறது.",
      },
      {
        expect: "மிகமிக முதிர்ந்த வயதில் வரும் சூரிய தசையை மிகச் சிலரே அடைகிறார்கள். இந்த அரிய ஆத்மாக்களுக்கு, சூரியன் ஒளிரும் தெளிவு என்ற இறுதி கொடையை கொண்டு வருகிறது — வாழ்நாள் முழுவதும் பிரச்சினைகளைத் துளைத்த பகுப்பாய்வு நுண்ணறிவு இப்போது தன் சொந்த ஒளிர்ந்த விழிப்புணர்வில் ஓய்கிறது. அடையாளம் நிலைபெற்றது; புயல் நீண்ட காலமாக கடந்தது; இப்போது தூய சூரிய இருப்பு மட்டுமே.",
        navigate: "இந்த வயதில் உடல் பராமரிப்பு முழுமையான மற்றும் மென்மையானது. அரவணைப்பு, ஒளி, பரிச்சயமான ஒலிகள், இந்த நபரின் வாழ்நாளின் ஆழத்தை புரிந்துகொள்பவர்களின் இருப்பு — இவை எல்லாமே.",
        focus: "ஞாயிற்றுக்கிழமை சூரிய வழிபாடு மற்றும் ஆதித்ய ஹ்ருதயம் பாராயணம் இறுதி பக்தி சைகைகள். ருத்ரனின் பிள்ளை, சீற்றமடைந்து ஆராய்ந்து மாற்றியதற்கு பிறகு, ஒளியில் முடிகிறது.",
      },
      {
        expect: "இந்த மிக முதிர்ந்த வயதில் வரும் சந்திர தசையை நடைமுறையில் யாரும் அடைவதில்லை. இந்த அரிய ஆத்மாக்களுக்கு, திருவாதிரையின் புயல் எப்போதும் வாக்குறுதி அளித்த முழுமையான உணர்வுக் கடலின் அலை நிறைவை சந்திரன் கொண்டு வருகிறது. பகுப்பாய்வு நெருப்பு நீண்ட காலமாக அமைதியானது; எஞ்சியிருப்பது மழைக்குப் பிறகான நீரின் குளிர்ந்த, பரந்த உணர்வு.",
        navigate: "இந்த அரிய நபரின் வாழ்நாளின் ஆழத்தை மதிக்கும் பராமரிப்பாளர்களின் முழுமையான உடல் பராமரிப்பும் மென்மையான உணர்வு இருப்பும் எல்லாமே. உடலின் தேவைகள் எளிமையானவை.",
        focus: "திங்கட்கிழமை வழிபாடு, நீர் அர்ப்பணங்கள், ஓடும் நீர் அல்லது இசையின் இருப்பு — மிதுனத்தின் ருத்ரப் பிள்ளைக்கு சந்திரனின் இறுதி அணைப்பில் இவையே பொருத்தமான கடைசித் துணைகள்.",
      },
    ],
    spirituality: [
      { title: "ருத்ர & சிவ வழிபாடு",        desc: "திருவாதிரையின் தலைமை தெய்வம் ருத்ரன் — திங்கள் சிவ வழிபாடு, பிரதோஷ அனுஷ்டானம், அபிஷேகம், ருத்ராஷ்டாத்யாயி பாராயணம் ஆழமான ஆன்மீக நடைமுறைகள்." },
      { title: "மாற்றும் சாதனை",              desc: "திருவாதிரைக்கு ஆன்மீக நடைமுறை மாற்றத்தை உள்ளடக்க வேண்டும் — வெறும் பக்தி அல்ல. விரதங்கள், நேர்ச்சைகள், உண்மையில் வசதியை சவாலாக்கும் நடைமுறைகள் ருத்ரனின் இயல்புடன் ஒத்துப்போகின்றன." },
      { title: "புனித புயல் தலங்கள்",         desc: "சிதம்பரம் நடராஜர், திருவண்ணாமலை (அண்ணாமலை), புயல் மற்றும் மின்னலுடன் இணைக்கப்பட்ட வன சிவ கோவில்கள் திருவாதிரை ஜாதகர்களுக்கு சிறப்பு ஒத்தொலிப்பு கொண்டுள்ளன." },
    ],
    guidance: "உங்கள் புயல் உங்கள் கருவி — உங்கள் எதிரி அல்ல. பகுப்பாய்வு நெருப்பை பொய்யை எரிக்கட்டும், சுற்றியிருப்பவர்களை அல்ல. உலகிற்கு ருத்ரனின் சீர்திருத்தம் தேவை; நீடித்த, கடுமையான, கருணையான வடிவத்தை கொடுங்கள் — திருவாதிரையின் அரிய நுண்ணறிவு நிரந்தரமான தடம் விட்டுச் செல்லும்.",
    compatibleNote: "இந்த நட்சத்திரங்கள் திருவாதிரையின் பகுப்பாய்வு தீவிரம், மாற்றும் சக்தி, தொடர்பு துல்லியம் ஆகியவற்றை நிலைத்தன்மை, அரவணைப்பு, அறிவார்ந்த ஒத்தொலிப்புடன் நிரப்புகின்றன.",
    careerNote: "ஆழமான பகுப்பாய்வு, முறையான விசாரணை, முறிந்த அமைப்புகளை மாற்றும் தைரியம் சந்திக்கும் இடங்களில் சிறப்பாக செயல்படுகிறார்கள்.",
    modernLead: "திருவாதிரையின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "பகுப்பாய்வு ஆழம், மாற்றும் சக்தி, நேர்மையான தொடர்பு திருவாதிரையின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function ArdraVisualPage() {
  return <NatchathiramVisualContent data={ARDRA} visual={ARDRA_VISUAL} timings={dasaTimingsFor(ARDRA.number)} />;
}
