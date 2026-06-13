import type { Metadata } from "next";
import { ARDRA } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

export const metadata: Metadata = {
  title: "Ardra Nakshathiram — Visual Profile | Vinaadi",
  description: "Visual profile of Ardra Nakshathiram: personality traits, career strengths, dasha timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/ardra/visual" },
  openGraph: {
    title: "Ardra Nakshathiram — Visual Profile",
    description: "Visual profile of Ardra Nakshathiram: personality traits, career strengths, dasha timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/ardra/visual",
    type: "article",
  },
};

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
      planet: "Rahu", period: "18 yrs", ageRange: "Age 0–18", theme: "Born into the Storm",
      detail: {
        expect: "Ardra is born into Rahu dasha — a turbulent but potent opening for a nakshathiram whose nature is itself the embodiment of Rudra's storm. Early childhood (0–7) often includes unusual circumstances: a family disruption, a dramatic relocation, a health challenge that resolves but leaves a mark, or an unusual intellectual precocity that adults cannot easily place. School years (7–14) see Ardra's analytical intelligence beginning to distinguish itself — mathematics, science, and language all attract, but the tendency to question rather than accept is already visible. Adolescence (14–18) brings the first serious confrontation with the world's imperfections, and often the first sustained passion for a subject, cause, or technology.",
        navigate: "Rahu's 18-year opening means Ardra arrives at adulthood without the stable childhood that other nakshatrams' slower dashas provide. The lack of a settled emotional foundation in early life can produce volatility, distrust of authority, or a compensatory intellectual arrogance. Health: Rahu dasha children are particularly vulnerable to skin conditions, unexplained fevers, and nervous system hypersensitivity. Rahu–Saturn antardasha (approximately ages 14–16) is the most demanding sub-period; existential questioning, academic pressure, and family conflict can peak simultaneously.",
        focus: "Saturday Rahu shrine prayers and coconut offerings stabilise the family's energy in Ardra's childhood. Channelling the child's analytical intensity into structured science, mathematics, or technology education is the most important parental investment. Also watch the Rahu–Mercury antardasha within this dasha (arriving approximately in the 13th year of Rahu dasha, around age 13). Mercury is the lord of your rasi, Mithuna — this sub-period, brief but potent, carries the rasi lord's amplified communicative and analytical intelligence. An unusual academic achievement, a writing or science competition win, or a period of exceptional intellectual productivity in the teenage years typically lands in this window. Do not miss it.",
      },
    },
    {
      planet: "Jupiter", period: "16 yrs", ageRange: "Age 18–34", theme: "The Analytical Mind Finds Its Work",
      detail: {
        expect: "Jupiter dasha from 18 to 34 is when Ardra's storm-forged intelligence finds its proper professional application. Higher education or vocational training establishes — sciences, technology, medicine, law, or social research are the most natural domains. Career launches with unusual analytical capability, and early recognition — a research publication, a technology breakthrough, an investigative piece that matters — may arrive between ages 22 and 28. Marriage may enter the picture in Jupiter–Venus antardasha (approximately ages 28–30) or Jupiter–Mars (approximately ages 25–27). Children, if sought, may come. The first stable home and professional identity consolidate.",
        navigate: "Jupiter's generosity can amplify Ardra's natural intensity into intellectual arrogance — the belief that analytical superiority justifies dismissiveness toward those whose thinking is less rigorous. Relationships outside the intellectual or professional domain can feel unfamiliar; the emotional intelligence that Ardra carries from Rahu dasha's turbulence needs conscious cultivation, not avoidance. Liver health and overwork accumulation deserve attention by the early thirties.",
        focus: "Thursday Brihaspati or Dakshinamurthy worship amplifies Jupiter's abundance. This is the window for Ardra to complete the education, publish the research, and build the professional reputation that will serve for decades. Also watch the Jupiter–Mercury antardasha within this dasha (arriving approximately in the 12th year of Jupiter dasha, around age 30). Mercury as rasi lord makes this one of the most intellectually fertile sub-periods of Ardra's entire life — analytical work completed, communicative contributions made, or professional milestones reached in these 11 months carry the rasi lord's amplification. Prepare the most significant professional deliverable for this window.",
      },
    },
    {
      planet: "Saturn", period: "19 yrs", ageRange: "Age 34–53", theme: "The Reformer's Long Work",
      detail: {
        expect: "Saturn dasha from 34 to 53 tests every system Ardra has built — and rewards those built on genuine rigor. Career reaches institutional depth; leadership roles, research leadership, senior editorial positions, or advanced medical or legal practice become the terrain. Family life stabilises fully; children enter school and adolescence. Property acquisition and financial consolidation typically occur in the early forties. The social reformer in Ardra — always present but sometimes submerged by pragmatism — re-emerges with force in Saturn dasha, often producing Ardra's most enduring contribution to a field or a community.",
        navigate: "Saturn's primary physical concerns for Ardra between 34 and 53 are musculoskeletal, respiratory, and cardiovascular. Chronic overwork — Ardra's constitutional tendency — accumulates in Saturn dasha and must be managed with deliberate rest. Saturn–Rahu antardasha (approximately ages 46–48) is the most turbulent sub-period; career pressures, family obligations, and health can converge acutely. Relationships that survived Rahu and Jupiter dashas must now survive Saturn's demand for sustained depth rather than intellectual excitement.",
        focus: "Saturday oil bath and Shani temple worship are essential. The reformist impulse that Saturn dasha activates in Ardra must be channelled into sustained systemic work — not reactive confrontation. One well-chosen institutional contribution, made with patience and persistence through the full arc of Saturn dasha, produces more lasting change than many brilliant interventions.",
      },
    },
    {
      planet: "Mercury", period: "17 yrs", ageRange: "Age 53–70", theme: "Rasi Lord — The Great Analysis",
      detail: {
        expect: "Mercury dasha from 53 to 70 is the rasi lord's arrival for Ardra. Mercury is the lord of your rasi, Mithuna — this makes his dasha doubly charged for Ardra natives. Where other nakshathirams experience Mercury dasha as one planetary period among many, for Ardra it is the rasi lord himself taking the wheel in the final active professional decades. Analytical writing, intellectual legacy-building, teaching, and communicative mastery reach their lifetime peak. The accumulated research, the years of systematic investigation, the disciplined thinking — all of it crystallises into work that will outlast its author. For those in teaching, science, or writing, the most significant works of a lifetime land here.",
        navigate: "Mercury's primary health concerns at this age are nervous system and respiratory. Mental agility, maintained through active analytical engagement, outlasts physical agility. The intensity that has characterised Ardra's entire intellectual life must now be channelled into transmission rather than perpetual investigation — the storm has produced its rain; now let the earth use it.",
        focus: "Wednesday worship, green offerings, and sustained intellectual engagement — writing, teaching, research leadership — are Mercury's primary remedies for Ardra. Any significant written work, scientific contribution, or communicative legacy that has been deferred from earlier decades must be completed in Mercury dasha. Vishnu Sahasranama recitation provides Mercury's natural stabilising counterpoint to Ardra's intensity.",
      },
    },
    {
      planet: "Ketu", period: "7 yrs", ageRange: "Age 70–77", theme: "After the Storm — Stillness",
      detail: {
        expect: "Ketu dasha from 70 to 77 calls Ardra into the deep interior — the storm that has raged for a lifetime finally grows quiet, and in the silence, Shiva's true nature emerges. Spiritual depth that has been deferred by the urgency of analytical work surfaces with unusual force. Grandchildren and great-grandchildren receive a quality of loving attention that the professional years could not always provide. Creative or contemplative work — writing that is not analysis but poetry, practice that is not investigation but devotion — becomes possible for the first time.",
        navigate: "Ketu's natural withdrawal tendency is amplified by age; avoid the extreme of complete social isolation which can accelerate decline. Physical needs are specific: warmth, regular nourishment, gentle movement, and the company of those who understand depth. Spiritual companions are more important in Ketu dasha than most other support.",
        focus: "Ketu shrine visits, pitru tharpanam, and black sesame offerings complete ancestral obligations. The Shaiva scriptures — Tirukural, Thirumantiram, or any Shiva-devotional text — are the most resonant companions for this period. Ardra's long relationship with Rudra reaches its most intimate expression in Ketu dasha.",
      },
    },
    {
      planet: "Venus", period: "20 yrs", ageRange: "Age 77–97", theme: "Unexpected Beauty",
      detail: {
        expect: "Venus dasha from 77 to 97 brings an unexpected softening to Ardra's lifelong storm. Beauty — music, art, relationship, the sensory richness of life — arrives with a gentleness that the analytical intellect could not previously access. Family bonds deepen. Grandchildren and great-grandchildren become the primary joy. Creative work in this period, if pursued, has a quality of serene completion that contrasts beautifully with the intensity of everything that preceded it.",
        navigate: "At this age, physical care is primary: warmth, adequate nourishment, gentle movement, and steady companionship. The nervous system and respiratory system deserve particular attention through the eighties. Venus's natural affinity with comfort and beauty should be actively supported in the living environment.",
        focus: "Friday Lakshmi worship, rose and jasmine offerings, and surrounding the person with music, natural beauty, and affectionate presence are the most appropriate care and remedy. A life of storm and depth arriving at beauty and grace is Ardra's most elegant completion.",
      },
    },
    {
      planet: "Sun", period: "6 yrs", ageRange: "Age 97–103", theme: "Final Solar Clarity",
      detail: {
        expect: "Sun dasha from 97 to 103 is reached by very few. For those who arrive here, the Sun brings a final gift of radiant clarity — the analytical intelligence that has pierced problems for seven decades now simply rests in its own luminous awareness. Identity is settled; the storm has long since passed; what remains is pure solar presence.",
        navigate: "Physical care at this age is complete and tender. Warmth, light, familiar sounds, and the presence of those who understand the depth of this person's life — these are everything.",
        focus: "Sunday Surya worship and Aditya Hridayam recitation are the final devotional gestures. Rudra's child, having raged and researched and transformed, ends in light.",
      },
    },
    {
      planet: "Moon", period: "10 yrs", ageRange: "Age 103–113", theme: "Oceanic Rest",
      detail: {
        expect: "Moon dasha at this extreme age is reached by virtually none. For those rare souls who persist here, the Moon brings the tidal completeness — the full emotional ocean that Ardra's storm always promised. The analytical fire is long quiet; what remains is the cool, vast feeling of water after rain.",
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

  compatibleEn: ["Punarvasu", "Swati", "Shatabhisha", "Jyeshtha", "Vishakha"],
  compatibleNote: "These nakshatras complement Ardra's analytical intensity, transformative power, and communicative precision with stability, warmth, and intellectual resonance.",

  ta: {
    atAGlanceLabels: ["பகுப்பாய்வு ஆழம்", "மாற்றும் சக்தி", "அறிவியல் நுண்ணறிவு", "உணர்வு தீவிரம்", "தொடர்பு வலிமை"],
    radarLabels: ["பகுப்பாய்வு", "மாற்றம்", "அறிவியல்", "உணர்வு", "தொடர்பு", "தொடர்ச்சி"],
    coreStrengths: [
      { label: "பகுப்பாய்வு ஆழம்",     desc: "ருத்ரனின் பிள்ளை — எந்த பிரச்சினையின் வேரையும் சிவனின் ஊடுருவும் தெளிவுடன் வெட்டுகிறார்கள்." },
      { label: "மாற்றும் சக்தி",        desc: "புதுப்பிக்கும் புயல் — திருவாதிரை கட்டவிழ்க்கும், உண்மையானதை மட்டும் மீண்டும் கட்டமைக்கும்." },
      { label: "அறிவியல் நுண்ணறிவு",   desc: "ஆராய்ச்சி, தரவு, தொழில்நுட்பம், முறையான விசாரணைக்கான அசாதாரண திறன்." },
      { label: "உணர்வு தீவிரம்",        desc: "ஆழத்தின் சின்னமான கண்ணீர் — திருவாதிரை முழுமையாக உணர்கிறார்கள் மற்றும் அந்த உணர்வின் மூலம் மாறுகிறார்கள்." },
      { label: "தொடர்பு வலிமை",        desc: "கூர்மையான, துல்லியமான, நேரடியான — அவர்களின் வார்த்தைகள் அசாதாரண தாக்கத்துடன் தரையிறங்குகின்றன." },
      { label: "புத்துயிர் தொடர்ச்சி",  desc: "ஒவ்வொரு புயலுக்கும் பிறகு, திருவாதிரை மீண்டும் கட்டமைக்கிறார் — மீள்தன்மை இவர்களின் வரையறுக்கும் குணம்." },
    ],
    careerAbilityLabels: ["ஆராய்ச்சி & அறிவியல்", "தொழில்நுட்பம் & பொறியியல்", "எழுத்து & பகுப்பாய்வு", "மருத்துவம் & குணப்படுத்தல்", "சமூக சீர்திருத்தம் & வழக்காடல்"],
    careerClusters: [
      { title: "ஆராய்ச்சி & அறிவியல்",     desc: "ஆய்வகம், விசாரணை, முறையான கண்டுபிடிப்பு — ருத்ரனின் பகுப்பாய்வு துல்லியம்." },
      { title: "தொழில்நுட்பம் & பொறியியல்", desc: "மென்பொருள், அமைப்பு வடிவமைப்பு, உள்கட்டமைப்பு — திருவாதிரை மீள்திறன் மிக்க கட்டமைப்புகளை கட்டுகிறார்." },
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
      "பகுப்பாய்வு மனம் தன் வேலையை கண்டுபிடிக்கிறது — தொழில், திருமணம், முதல் முக்கிய பங்களிப்பு",
      "சீர்திருத்தகரின் நீண்ட வேலை — நிறுவன ஆழம், மரபு கட்டுவது",
      "ராசி அதிபதி — மாபெரும் பகுப்பாய்வு — புதன் தசை மிதுன ராசிக்கு",
      "புயலுக்கு பிறகு — அமைதி, ஆன்மீக திரும்பல், ருத்ரன் வெளிப்பாடு",
      "எதிர்பாராத அழகு — சுக்கிர மென்மை, குடும்ப ஆழம், படைப்பு நிறைவு",
      "இறுதி சூரிய தெளிவு — ஒளியில் மூழ்குதல்",
      "கடல் ஓய்வு — வட்டம் நிறைவடைகிறது",
    ],
    dashaDetails: [
      {
        expect: "திருவாதிரை ராகு தசையில் பிறக்கிறார் — இயல்பில் ருத்ரனின் புயலை உள்ளடக்கும் நட்சத்திரத்திற்கு கலக்கமான ஆனால் சக்திவாய்ந்த திறப்பு. ஆரம்பகால குழந்தை பருவம் (0–7) அடிக்கடி அசாதாரண சூழ்நிலைகளை உள்ளடக்குகிறது: குடும்ப கலைச்சல், குடிமாற்றம், ஆரோக்ய சவால். பள்ளி ஆண்டுகள் (7–14) திருவாதிரையின் பகுப்பாய்வு நுண்ணறிவு கணிதம், அறிவியல், மொழியில் தன்னை வேறுபடுத்திக்கொள்ள தொடங்குகிறது.",
        navigate: "ராகுவின் 18 ஆண்டு திறப்பு திருவாதிரை மற்ற நட்சத்திரங்களின் மெதுவான தசைகள் வழங்கும் நிலையான குழந்தை பருவம் இல்லாமல் வயது வந்த நிலைக்கு வருவதை அர்த்தப்படுத்துகிறது. ஆரோக்யம்: ராகு தசை குழந்தைகள் தோல் நிலைகள், விளக்கமுடியாத காய்ச்சல்கள், நரம்பு மண்டல உணர்திறன் ஆகியவற்றிற்கு குறிப்பாக பாதிக்கப்படக்கூடியவர்கள். ராகு–சனி அந்தர்தசை (சுமார் 14–16 வயது) மிகவும் கோரும் துணை காலம்.",
        focus: "சனிக்கிழமை ராகு சன்னதி வழிபாடும் தேங்காய் அர்ப்பணமும் குடும்ப சக்தியை நிலைப்படுத்துகிறது. கவனிக்கவும்: ராகு–புதன் அந்தர்தசை (ராகு தசையின் சுமார் 13வது ஆண்டில், சுமார் 13 வயது). புதன் உங்கள் ராசியான மிதுனத்தின் அதிபதி — இந்த சாளரம் அசாதாரண தொடர்பு மற்றும் பகுப்பாய்வு நுண்ணறிவை கொண்டு வருகிறது. இந்த சாளரத்தை தவறவிடாதீர்கள்.",
      },
      {
        expect: "குரு தசை 18 முதல் 34 வயது வரை திருவாதிரையின் புயல் நெருப்பால் செதுக்கப்பட்ட நுண்ணறிவு அதன் சரியான தொழில் பயன்பாட்டை கண்டுபிடிக்கும் போது. உயர் கல்வி அல்லது தொழில் பயிற்சி நிறுவுகிறது — அறிவியல், தொழில்நுட்பம், மருத்துவம், சட்டம் அல்லது சமூக ஆராய்ச்சி மிகவும் இயல்பான தளங்கள். திருமணம் குரு–சுக்கிர அந்தர்தசையில் (சுமார் 28–30 வயது) வருகிறது.",
        navigate: "குரு தாராளத்தன்மை திருவாதிரையின் இயல்பான தீவிரத்தை அறிவார்ந்த அகந்தையாக அதிகரிக்கலாம். ஈரல் ஆரோக்யமும் அதிக வேலை குவிப்பும் முப்பதுகளின் ஆரம்பத்தில் கவனிக்க வேண்டும்.",
        focus: "வியாழக்கிழமை பிருஹஸ்பதி அல்லது தட்சிணாமூர்த்தி வழிபாடு. கவனிக்கவும்: குரு–புதன் அந்தர்தசை (குரு தசையின் சுமார் 12வது ஆண்டில், சுமார் 30 வயது). புதன் ராசி அதிபதி என்பதால் திருவாதிரையின் முழு வாழ்நாளில் மிகவும் அறிவார்ந்த வளமான துணை காலம் இது — இந்த 11 மாத சாளரத்திற்கு மிக முக்கியமான தொழில் பணியை திட்டமிடுங்கள்.",
      },
      {
        expect: "சனி தசை 34 முதல் 53 வயது வரை திருவாதிரை கட்டிய ஒவ்வொரு அமைப்பையும் சோதிக்கிறது — உண்மையான கடுமையில் கட்டியவற்றை வெகுமதி தருகிறது. தொழில் நிறுவன ஆழத்தை அடைகிறது. குடும்ப வாழ்க்கை முழுமையாக நிலைபெறுகிறது. சொத்து வாங்குவது மற்றும் நிதி ஒருங்கிணைப்பு நாற்பதுகளின் ஆரம்பத்தில் நடக்கும்.",
        navigate: "சனியின் முதன்மையான உடல் கவலைகள் 34 முதல் 53 வயதுக்கு இடையே தசை எலும்பு மண்டலம், சுவாசம், இதயம். நாள்பட்ட அதிக வேலை — திருவாதிரையின் இயல்பு போக்கு — சனி தசையில் குவிகிறது. சனி–ராகு அந்தர்தசை (சுமார் 46–48 வயது) மிகவும் கலக்கமான துணை காலம்.",
        focus: "சனிக்கிழமை எண்ணெய் குளியல் மற்றும் சனி கோவில் வழிபாடு அவசியம். சீர்திருத்தவாத மனம் நீடித்த முறையான வேலையில் திசைமாற்றப்பட வேண்டும் — எதிர்வினை மோதல்கள் அல்ல.",
      },
      {
        expect: "புதன் தசை 53 முதல் 70 வயது வரை திருவாதிரைக்கு ராசி அதிபதியின் வருகை. புதன் உங்கள் ராசியான மிதுனத்தின் அதிபதி — இது திருவாதிரை நேயர்களுக்கு இரட்டை வலிமையுடன் வருகிறது. பகுப்பாய்வு எழுத்து, அறிவார்ந்த மரபு கட்டுவது, கற்பித்தல், தொடர்பு தேர்ச்சி வாழ்நாளில் உச்சம் அடைகின்றன. திரட்டப்பட்ட ஆராய்ச்சி, ஆண்டுகளான முறையான விசாரணை, ஒழுக்கமான சிந்தனை — எல்லாமே அதன் ஆசிரியரை தாண்டிய படைப்பாக படிகமாகிறது.",
        navigate: "புதன் முதன்மையான ஆரோக்ய கவலைகள் நரம்பு மண்டலம் மற்றும் சுவாசம். திருவாதிரையை வாழ்நாளில் வரையறுத்த தீவிரம் இப்போது நிரந்தர விசாரணையை விட பரிமாற்றத்திற்கு திசைமாற்றப்பட வேண்டும்.",
        focus: "புதன்கிழமை வழிபாடு, பசுமை அர்ப்பணங்கள், செயல்படும் அறிவார்ந்த ஈடுபாடு — எழுத்து, கற்பித்தல், ஆராய்ச்சி தலைமை — புதனின் நிவாரணங்கள். முந்தைய தசகங்களிலிருந்து தாமதிக்கப்பட்ட எந்த முக்கியமான எழுத்தும், அறிவியல் பங்களிப்பும் இந்த தசையில் நிறைவு செய்யப்பட வேண்டும்.",
      },
      {
        expect: "கேது தசை 70 முதல் 77 வயது வரை திருவாதிரையை ஆழமான உள்நோக்கிய பயணத்திற்கு அழைக்கிறது — ஒரு வாழ்நாள் ரேகும் புயல் இறுதியில் அமைதியடைகிறது, மற்றும் மவுனத்தில் சிவனின் உண்மையான இயல்பு வெளிப்படுகிறது. தொழில் வருடங்கள் ஒத்திவைத்த ஆன்மீக ஆழம் அசாதாரண வலிமையுடன் மேலோங்குகிறது.",
        navigate: "கேதுவின் இயல்பான திரும்பல் போக்கு வயதால் அதிகரிக்கிறது; முழுமையான சமூக தனிமை தவிர்க்க வேண்டும். ஆன்மீக துணை இந்த தசையில் மருத்துவ ஆதரவை விட முக்கியமானது.",
        focus: "கேது சன்னதி வழிபாடு, பித்ரு தர்ப்பணம், கருப்பு எள் அர்ப்பணங்கள் முன்னோர் கடமைகளை நிறைவு செய்கின்றன. சைவ நூல்கள் — திருக்குறள், திருமந்திரம் — இந்த காலகட்டத்திற்கான மிகவும் பொருத்தமான துணை.",
      },
      {
        expect: "சுக்கிர தசை 77 முதல் 97 வயது வரை திருவாதிரையின் வாழ்நாள் புயலுக்கு எதிர்பாராத மென்மையை கொண்டு வருகிறது. அழகு — இசை, கலை, உறவு, வாழ்வின் புலன் செழிப்பு — பகுப்பாய்வு நுண்ணறிவு முன்பு அணுக முடியாத மென்மையுடன் வருகிறது. குடும்ப பிணைப்புகள் ஆழமடைகின்றன.",
        navigate: "இந்த வயதில், உடல் பராமரிப்பு முதன்மை: அரவணைப்பு, போதுமான ஊட்டச்சத்து, மெல்லிய அசைவு, நிலையான துணை. நரம்பு மண்டலம் மற்றும் சுவாச அமைப்பு எண்பதுகளில் குறிப்பிட்ட கவனம் தேவை.",
        focus: "வெள்ளிக்கிழமை லட்சுமி வழிபாடு, ரோஜா மற்றும் மல்லிகை அர்ப்பணம், இசை, இயற்கை அழகு, அன்பான இருப்புடன் நபரை சூழ்வது — மிகவும் பொருத்தமான பராமரிப்பு. புயல் மற்றும் ஆழத்தின் வாழ்க்கை அழகிலும் அனுகூலத்திலும் வந்து முடிகிறது.",
      },
      {
        expect: "சூரியன் தசை 97 முதல் 103 வயது வரை மிகச் சிலரால் அடையப்படுகிறது. இந்த அரிய ஆத்மாக்களுக்கு, சூரியன் இறுதி கொடையை கொண்டு வருகிறது — தீவிர வாழ்நாளில் வெட்டிய பகுப்பாய்வு நுண்ணறிவு இப்போது தன் சொந்த ஒளிர்ந்த விழிப்புணர்வில் ஓய்கிறது. அடையாளம் நிலைபெற்றது; புயல் நீண்ட காலமாக கடந்தது; இப்போது தூய சூரிய இருப்பு மட்டுமே.",
        navigate: "இந்த வயதில் உடல் பராமரிப்பு முழுமையான மற்றும் மென்மையானது. அரவணைப்பு, ஒளி, பரிச்சயமான ஒலிகள், இந்த நபரின் வாழ்நாளின் ஆழத்தை புரிந்துகொள்பவர்களின் இருப்பு — இவை எல்லாமே.",
        focus: "ஞாயிற்றுக்கிழமை சூரிய வழிபாடு மற்றும் ஆதித்ய ஹ்ருதயம் பாராயணம் இறுதி பக்தி சைகைகள். ருத்ரனின் பிள்ளை, சீற்றமடைந்து ஆராய்ந்து மாற்றியதற்கு பிறகு, ஒளியில் முடிகிறது.",
      },
    ],
    spirituality: [
      { title: "ருத்ர & சிவ வழிபாடு",        desc: "திருவாதிரையின் தலைமை தெய்வம் ருத்ரன் — திங்கள் சிவ வழிபாடு, பிரதோஷ அனுஷ்டானம், அபிஷேகம், ருத்ராஷ்டாத்யாயி பாராயணம் ஆழமான ஆன்மீக நடைமுறைகள்." },
      { title: "மாற்றும் சாதனை",              desc: "திருவாதிரைக்கு ஆன்மீக நடைமுறை மாற்றத்தை உள்ளடக்க வேண்டும் — வெறும் பக்தி அல்ல. விரதங்கள், நேர்ச்சைகள், உண்மையில் வசதியை சவாலாக்கும் நடைமுறைகள் ருத்ரனின் இயல்புடன் ஒத்துப்போகின்றன." },
      { title: "புனித புயல் தலங்கள்",         desc: "சிதம்பரம் நடராஜர், திருவண்ணாமலை (அண்ணாமலை), புயல் மற்றும் மின்னலுடன் இணைக்கப்பட்ட வன சிவ கோவில்கள் திருவாதிரை நேயர்களுக்கு சிறப்பு ஒத்தொலிப்பு கொண்டுள்ளன." },
    ],
    guidance: "உங்கள் புயல் உங்கள் கருவி — உங்கள் எதிரி அல்ல. பகுப்பாய்வு நெருப்பை பொய்யை எரிக்கட்டும், சுற்றியிருப்பவர்களை அல்ல. உலகிற்கு ருத்ரனின் சீர்திருத்தம் தேவை; நீடித்த, கடுமையான, கருணையான வடிவத்தை கொடுங்கள் — திருவாதிரையின் அரிய நுண்ணறிவு நிரந்தரமான தடம் விட்டுச் செல்லும்.",
    compatibleNote: "இந்த நட்சத்திரங்கள் திருவாதிரையின் பகுப்பாய்வு தீவிரம், மாற்றும் சக்தி, தொடர்பு துல்லியம் ஆகியவற்றை நிலைத்தன்மை, அரவணைப்பு, அறிவார்ந்த ஒத்தொலிப்புடன் நிரப்புகின்றன.",
    careerNote: "ஆழமான பகுப்பாய்வு, முறையான விசாரணை, முறிந்த அமைப்புகளை மாற்றும் தைரியம் சந்திக்கும் இடங்களில் சிறப்பாக செயல்படுகிறார்கள்.",
    modernLead: "திருவாதிரையின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "பகுப்பாய்வு ஆழம், மாற்றும் சக்தி, நேர்மையான தொடர்பு திருவாதிரையின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function ArdraVisualPage() {
  return <NatchathiramVisualContent data={ARDRA} visual={ARDRA_VISUAL} />;
}
