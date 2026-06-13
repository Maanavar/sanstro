import type { Metadata } from "next";
import { MRIGASHIRA } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

export const metadata: Metadata = {
  title: "Mrigashira Nakshathiram — Visual Profile | Vinaadi",
  description: "Visual profile of Mrigashira Nakshathiram: personality traits, career strengths, dasha timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/mrigashira/visual" },
  openGraph: {
    title: "Mrigashira Nakshathiram — Visual Profile",
    description: "Visual profile of Mrigashira Nakshathiram: personality traits, career strengths, dasha timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/mrigashira/visual",
    type: "article",
  },
};

const MRIGASHIRA_VISUAL: NatchathiramVisualData = {
  atAGlance: [
    { label: "Creative Versatility", score: 92 },
    { label: "Intellectual Curiosity", score: 90 },
    { label: "Aesthetic Sensibility", score: 88 },
    { label: "Communicative Skill",   score: 87 },
    { label: "Gentle Magnetism",      score: 85 },
  ],

  radar: {
    labels: ["Creativity", "Curiosity", "Aesthetics", "Communication", "Grace", "Adaptability"],
    values: [92, 90, 88, 87, 85, 89],
  },

  coreStrengths: [
    { symbol: "◎", label: "Creative Versatility",   score: 92, desc: "Soma's gentle eye — Mrigashira creates across art, music, writing, and craft with equal ease." },
    { symbol: "◈", label: "Intellectual Search",     score: 90, desc: "The deer eternally seeking — an enquiring mind that never accepts the first answer." },
    { symbol: "⚡", label: "Aesthetic Intelligence", score: 88, desc: "Exquisite taste in beauty, music, fragrance, texture — a heightened sensory world." },
    { symbol: "♥", label: "Communicative Grace",     score: 87, desc: "Fluid, charming expression — they explain, connect, and persuade with natural ease." },
    { symbol: "△", label: "Gentle Magnetism",        score: 85, desc: "Like the deer — attractive and graceful, drawing others without force." },
    { symbol: "☽", label: "Restless Exploration",    score: 89, desc: "Perpetually searching for what lies just beyond — this restlessness is the engine of creativity." },
  ],

  careerAbilities: [
    { label: "Arts & Music",             score: 92 },
    { label: "Writing & Communication",  score: 90 },
    { label: "Research & Exploration",   score: 88 },
    { label: "Beauty & Fashion",         score: 87 },
    { label: "Business & Trade",         score: 83 },
  ],
  careerNote: "Thrives where curiosity, creative expression, and communication intersect — roles that reward versatility, aesthetic intelligence, and the ability to connect ideas across domains.",

  careerClusters: [
    { symbol: "◎", title: "Arts & Music",           desc: "Classical music, fine arts, dance, craft — Soma's sensitivity finds form here." },
    { symbol: "◈", title: "Writing & Journalism",   desc: "Storytelling, poetry, reporting, content — Mrigashira's searching mind in words." },
    { symbol: "⚡", title: "Research & Science",    desc: "Investigation, fieldwork, discovery — the perpetual search made productive." },
    { symbol: "♥", title: "Fashion & Beauty",       desc: "Textile design, styling, aesthetics — refined taste meeting commercial application." },
    { symbol: "△", title: "Business & Commerce",    desc: "Trade, marketing, negotiations — Mrigashira's communication gifts applied to commerce." },
    { symbol: "☽", title: "Travel & Exploration",  desc: "Tourism, geography, adventure — the deer's perpetual movement as vocation." },
  ],

  modernApps: [
    { symbol: "◎", title: "Digital Art & Music",       desc: "Music production, digital illustration, creative media — the aesthetic gift on platforms." },
    { symbol: "◈", title: "Content & Media Creation",  desc: "Podcasting, blogging, video storytelling — Mrigashira's communication in new forms." },
    { symbol: "⚡", title: "Market Research & Insights", desc: "Consumer behaviour research, data journalism, investigative analytics." },
    { symbol: "♥", title: "Lifestyle & Beauty Brands",  desc: "Aesthetic product design, curated fashion, fragrance, wellness." },
    { symbol: "△", title: "Travel Tech & Experiences",  desc: "Curated travel, experiential tourism, cross-cultural connection platforms." },
    { symbol: "☽", title: "Education & E-Learning",     desc: "Creative curriculum design, artistic education, cross-disciplinary learning." },
  ],

  dashaTimeline: [
    {
      planet: "Mars", period: "7 yrs", ageRange: "Age 0–7", theme: "The Searching Begins",
      detail: {
        expect: "Mrigashira is born into Mars dasha — an energetic, active opening for a nakshathiram whose nature is inherently gentle and searching. This child arrives with unusual physical vitality and a restlessness that can be mistaken for difficulty; they are simply the deer in motion from the first breath. The bond with elder siblings or cousins is often defining in these early years. School entry (ages 5–7) comes easily for some Mrigashira children and with resistance for others — this depends heavily on whether the school environment rewards curiosity over conformity. Health is generally robust but inflammatory conditions — fevers, skin issues, head injuries — are Mars's typical presentation. Most born in Mrigashira will experience only a partial Mars dasha, depending on exact birth position.",
        navigate: "Mars's physical energy without adequate channelling becomes restless aggression in young children. Parental management of this energy through structured physical play, early sport, or outdoor exploration is essential. Accidents and head injuries are the primary physical risks in Mars dasha infancy and early childhood. The family's stability and the father's health and presence are directly reflected in this child's sense of security.",
        focus: "Tuesday Murugan worship and introducing the child to physical outdoor environments — gardens, forests, open spaces — channels Mars's energy in Mrigashira's natural direction of seeking. Any creative or artistic activity introduced in Mars dasha will be remembered and returned to; the deer's eyes are always open. Visiting Murugan temples at Tiruchendur or Palani establishes an early protective connection.",
      },
    },
    {
      planet: "Rahu", period: "18 yrs", ageRange: "Age 7–25", theme: "The Wide World Beckons",
      detail: {
        expect: "Rahu dasha from 7 to 25 spans Mrigashira's entire schooling, adolescence, and early adulthood. This is when the searching nature finds its first serious object of pursuit — an academic interest, a creative passion, a relationship, or an ambition. School performance in Rahu dasha tends to be uneven: brilliant in subjects that capture the imagination, indifferent in those that don't. By college age (17–22), the creative or intellectual direction that will define the person's life typically crystallises. Foreign influence — exchange programs, internationally-connected mentors, online communities — accelerates Mrigashira's development. First significant romantic relationship arrives, often intensely and unexpectedly.",
        navigate: "Rahu's amplification of Mrigashira's natural restlessness can produce a person who changes direction too frequently — academic streams, career paths, relationships — before depth is built anywhere. The most critical risk between ages 17 and 24 is scattered pursuit: doing many things superficially instead of one thing deeply. Rahu–Saturn antardasha (approximately ages 20–22) is the most demanding sub-period; identity consolidation must happen here even as external instability peaks.",
        focus: "Saturday Rahu shrine prayers and establishing one clear creative or intellectual discipline to pursue through the entire Rahu dasha yields far better results than experimentation. Also watch the Rahu–Mercury antardasha within this dasha (arriving approximately in the 2nd year of Rahu dasha, around age 9). For Mithuna-pada (padas 3–4) Mrigashira, Mercury is the rasi lord — this early window within Rahu dasha carries the rasi lord's amplified quality: unusual verbal and creative intelligence, early writing or musical gifts, and a precocious ability to communicate ideas. Parents and teachers who notice this in the child should invest immediately — training begun at age 9 in Mrigashira's Mercury window becomes the professional foundation.",
      },
    },
    {
      planet: "Jupiter", period: "16 yrs", ageRange: "Age 25–41", theme: "Creative & Intellectual Harvest",
      detail: {
        expect: "Jupiter dasha from 25 to 41 finds Mrigashira in the fullest expression of creative and intellectual life. Career establishes and deepens — the artist, writer, researcher, or communicator finds their audience. Marriage may arrive in Jupiter–Mars antardasha (approximately ages 28–30) or Jupiter–Venus (approximately ages 35–37). Children may come. Property acquisition becomes feasible in the mid-thirties. Mrigashira's restlessness — which was a disadvantage in youth — becomes an asset in Jupiter dasha: the broad curiosity and cross-domain exploration produces creative work that narrowly specialised people cannot match. Teaching and mentoring impulses emerge.",
        navigate: "Jupiter's abundance can deepen Mrigashira's natural tendency to search perpetually for 'what's next' — the result is commitment avoidance in relationships and career that prevents the depth Jupiter is actually offering. Liver health and metabolic management become relevant in the mid-thirties. The temptation to pursue every interesting opportunity that Jupiter dasha generates must be resisted in favour of depth in the two or three areas that truly matter.",
        focus: "Thursday Dakshinamurthy worship and deliberate investment in one primary creative or professional discipline amplifies Jupiter's abundance. Also watch the Jupiter–Mercury antardasha within this dasha (arriving approximately in the 10th year of Jupiter dasha, around age 35). For Mithuna-pada Mrigashira, this is the rasi lord Mercury's antardasha within Jupiter — a window of extraordinary communicative, creative, and intellectual fertility. The most significant piece of work, professional recognition, or educational achievement in Jupiter dasha tends to land in this 11-month window. Plan the most important professional deliverable for this sub-period.",
      },
    },
    {
      planet: "Saturn", period: "19 yrs", ageRange: "Age 41–60", theme: "Depth Over Breadth",
      detail: {
        expect: "Saturn dasha from 41 to 60 is Mrigashira's most testing period — not because Saturn is malefic for Mrigashira, but because Saturn's demand for sustained commitment and delayed gratification sits in deliberate tension with the searching, exploring nature that defines this nakshathiram. Those who found their true depth in Jupiter dasha discover that Saturn rewards it generously. Property consolidation, institutional recognition, and mature creative mastery characterise the productive phase of this dasha. Children enter adulthood. The domestic environment stabilises.",
        navigate: "Mrigashira's most difficult Saturn dasha experience is the loss of the freedom to search — Saturn demands one path, committed to. Depression or creative dryness can appear if the native has not found a genuine deep calling by the time Saturn dasha begins. Saturn–Rahu antardasha (approximately ages 50–53) is the most turbulent sub-period; financial, legal, and health challenges can converge acutely. Joint care, cardiovascular monitoring, and respiratory health require active attention from the mid-forties.",
        focus: "Saturday oil bath and Shani temple worship are essential stabilisers. Also watch the Saturn–Mercury antardasha within this dasha (arriving approximately in the 10th year of Saturn dasha, around age 51). For Mithuna-pada Mrigashira, this is the rasi lord Mercury arriving within Saturn's demanding arc — a window of unusual creative clarity and communicative power amidst Saturn's austerity. Any significant creative publication, educational contribution, or communicative achievement in Saturn dasha will most likely land in this sub-period. Prepare, plan, and protect this window.",
      },
    },
    {
      planet: "Mercury", period: "17 yrs", ageRange: "Age 60–77", theme: "Rasi Lord — The Great Communication",
      detail: {
        expect: "Mercury dasha from 60 to 77 is the rasi lord's arrival for Mithuna-pada (padas 3–4) Mrigashira natives. Mercury is the lord of your rasi, Mithuna — this makes his dasha doubly charged for these natives. Where other nakshathirams experience Mercury dasha as one planetary period among many, for Mithuna Mrigashira it is the rasi lord himself taking the wheel in the final active decades. Writing, teaching, intellectual legacy-building, and communicative mastery reach their lifetime peak. The accumulated searching of fifty years crystallises into insight that is genuinely irreplaceable. For Rishabam-pada (padas 1–2) Mrigashira, Mercury dasha is still rich — intellectual clarity and social connection remain strong — but the rasi lord's amplification is reserved for Venus dasha (which follows).",
        navigate: "Mercury's primary health concerns at this age are nervous system, respiratory, and fine motor coordination. Mental agility, maintained through active intellectual engagement — writing, conversation, analysis — outlasts physical agility. Mrigashira's perpetual searching nature, having found its deepest object by now, must settle into transmission rather than perpetual exploration. The temptation to keep searching for new things must give way to sharing what has already been found.",
        focus: "Wednesday worship, green offerings, and active intellectual engagement — writing, teaching, correspondence — are Mercury's primary remedies. If any significant written work, educational contribution, or communicative legacy has been deferred from earlier decades — Mercury dasha is the non-negotiable window. Vishnu Sahasranama recitation and regular Vedic study maintain Mercury's natural affinity with sacred knowledge.",
      },
    },
    {
      planet: "Ketu", period: "7 yrs", ageRange: "Age 77–84", theme: "The Deer Comes Home",
      detail: {
        expect: "Ketu dasha from 77 to 84 is Mrigashira's turning inward — the deer that spent a lifetime searching finally recognises that what was sought was never external. A deep spiritual quietude settles. Grandchildren and great-grandchildren become the new focus of gentle, unconditional love. Creative work, if still pursued, takes on a quality of absolute simplicity — a single melody, a brief poem, a carefully made object — that contains everything earlier complexity could not.",
        navigate: "Physical dependence increases and must be met with the grace that Mrigashira has extended to others throughout life. The restlessness that characterised earlier decades tends to quiet in Ketu dasha for Mrigashira — if it does not, it is a signal to deepen spiritual practice. Ketu's connection to ancestral worlds means dreams, spiritual intuitions, and awareness of subtle presences may intensify.",
        focus: "Ketu shrine visits, pitru tharpanam, and black sesame offerings complete ancestral obligations. Daily meditation or quiet sitting — even 20 minutes — grounds Ketu dasha's subtle energy. The Brihadaranyaka or Aitareya Upanishad, with their tone of gentle cosmic inquiry, are the most resonant scriptural companions for this period.",
      },
    },
    {
      planet: "Venus", period: "20 yrs", ageRange: "Age 84–104", theme: "Rasi Lord — Beauty's Final Statement",
      detail: {
        expect: "Venus dasha from 84 onward is the rasi lord's arrival for Rishabam-pada (padas 1–2) Mrigashira natives. Venus is the lord of your rasi, Rishabam — this makes her dasha doubly charged for these natives. Where other nakshathirams experience Venus dasha as one planetary period among many, for Rishabam Mrigashira it is the rasi lord herself arriving in the final chapter of life. Beauty, grace, and the pleasures of the senses — music heard more deeply than ever before, the fragrance of flowers, the warmth of family — take on their most essential quality. The person lives in a state of refined abundance that mirrors in miniature the Venusian gifts they shared across a lifetime of creative and aesthetic contribution.",
        navigate: "At this extreme age, physical care is complete and simple: warmth, gentle nourishment, beauty in the immediate environment, steady companionship. The mind, if Venus is strong in the natal chart, can remain astonishingly present and aesthetically alive. Avoid sensory harshness and emotional disruption.",
        focus: "Friday Goddess Lakshmi worship, rose and jasmine offerings, and surrounding the person with music, flowers, and the presence of those they love — this is the most appropriate care. A life of searching through beauty has arrived at the source of beauty itself.",
      },
    },
    {
      planet: "Sun", period: "6 yrs", ageRange: "Age 104–110", theme: "Final Solar Clarity",
      detail: {
        expect: "Sun dasha from 104 to 110 is reached by virtually none. For those rare souls who arrive here, the Sun brings its final gift — absolute clarity of identity, a settled luminosity that needs no search because it has become the light itself. The searching deer has merged with the moon's reflection in the water.",
        navigate: "Physical care at this age is complete and tender. The body's requirements are minimal and specific. Warmth, light, familiar sounds, and beloved presence are everything.",
        focus: "Sunday Surya worship, Aditya Hridayam, and offering the light of a lamp to the rising sun — these are the last of life's devotional gestures. A conscious, peaceful, and light-surrounded completion is the final gift of Soma's gentle star.",
      },
    },
  ],

  spirituality: [
    {
      title: "Soma & Chandra Worship",
      desc: "Mrigashira's presiding deity is Soma (the Moon god) — Monday worship, moonlit prayers, and reverence for water bodies are the most natural spiritual practices.",
    },
    {
      title: "Creative Work as Sadhana",
      desc: "For Mrigashira, artistic creation is not separate from spiritual practice — sustained creative discipline is its own form of worship and the most authentic path to the divine.",
    },
    {
      title: "Pilgrimage & Seeking",
      desc: "The sacred journey resonates deeply with Mrigashira's deer nature — pilgrimage to mountain shrines, river banks, and forest temples fulfils the eternal searching in the most auspicious direction.",
    },
  ],

  guidance: "Your searching is your strength — never suppress it, only direct it. Find one creative or intellectual discipline worth a lifetime of depth, let that discipline be your temple, and Mrigashira's restless intelligence will produce work that outlasts the search itself.",

  compatibleEn: ["Rohini", "Ashwini", "Chitra", "Swati", "Revati"],
  compatibleNote: "These nakshatras complement Mrigashira's searching curiosity, creative intelligence, and gentle magnetism with warmth, stability, and aesthetic resonance.",

  ta: {
    atAGlanceLabels: ["படைப்பு பன்முகத்தன்மை", "அறிவு ஆர்வம்", "அழகு உணர்வு", "தொடர்பு திறன்", "மென்மையான காந்தம்"],
    radarLabels: ["படைப்பாற்றல்", "ஆர்வம்", "அழகுணர்வு", "தொடர்பு", "அழகிய நடை", "தகவமைப்பு"],
    coreStrengths: [
      { label: "படைப்பு பன்முகத்தன்மை",  desc: "சோமனின் மென்மையான கண்கள் — மிருகசீரிடம் கலை, இசை, எழுத்து, கைவினையில் சமனாக படைக்கிறார்கள்." },
      { label: "அறிவு தேடல்",             desc: "என்றும் தேடும் மான் — விசாரிக்கும் மனம் முதல் பதிலை ஒருபோதும் ஏற்காது." },
      { label: "அழகு நுண்ணறிவு",          desc: "அழகு, இசை, வாசம், தொடு உணர்வில் மிகவும் நுண்மையான சுவை — உயர்ந்த புலன் உலகம்." },
      { label: "தொடர்பு அழகு",            desc: "சரளமான, கவர்ச்சியான வெளிப்பாடு — விளக்கம், தொடர்பு, நம்பிக்கை இயல்பான எளிமையுடன்." },
      { label: "மென்மையான காந்தம்",       desc: "மானைப் போல — வலிமையின்றி மற்றவர்களை ஈர்க்கும் அழகும் இனிமையும்." },
      { label: "அமைதியற்ற ஆய்வு",         desc: "எப்போதும் அடுத்து என்ன இருக்கிறது என்று தேடுதல் — இந்த அமைதியின்மையே படைப்பாற்றலின் இயந்திரம்." },
    ],
    careerAbilityLabels: ["கலை & இசை", "எழுத்து & தொடர்பு", "ஆராய்ச்சி & ஆய்வு", "அழகு & நாடி", "வணிகம் & வர்த்தகம்"],
    careerClusters: [
      { title: "கலை & இசை",              desc: "பாரம்பரிய இசை, நுண் கலை, நடனம், கைவினை — சோமன் உணர்திறன் வடிவம் பெறும் இடம்." },
      { title: "எழுத்து & பத்திரிகை",     desc: "கதை சொல்லல், கவிதை, அறிக்கையிடல் — மிருகசீரிடத்தின் தேடும் மனம் வார்த்தைகளில்." },
      { title: "ஆராய்ச்சி & அறிவியல்",   desc: "விசாரணை, வயல் ஆய்வு, கண்டுபிடிப்பு — நிரந்தர தேடல் உற்பத்தியாகும்." },
      { title: "நாடி & அழகு",            desc: "ஜவுளி வடிவமைப்பு, ஸ்டைலிங், அழகியல் — நுண்மையான சுவை வணிக பயன்பாட்டில்." },
      { title: "வணிகம் & வர்த்தகம்",     desc: "வர்த்தகம், சந்தைப்படுத்தல், பேச்சுவார்த்தைகள் — தொடர்பு கொடைகள் வணிகத்தில்." },
      { title: "பயணம் & ஆய்வு",          desc: "சுற்றுலா, புவியியல், சாகசம் — மானின் நிரந்தர இயக்கம் தொழிலாக." },
    ],
    modernApps: [
      { title: "டிஜிட்டல் கலை & இசை",     desc: "இசை தயாரிப்பு, டிஜிட்டல் ஓவியம், படைப்பு ஊடகம் — தளங்களில் அழகு கொடை." },
      { title: "உள்ளடக்க & ஊடக படைப்பு",  desc: "போட்காஸ்டிங், வலைப்பதிவு, காணொளி கதை சொல்லல்." },
      { title: "சந்தை ஆராய்ச்சி & நுண்ணறிவு", desc: "நுகர்வோர் நடத்தை ஆராய்ச்சி, தரவு பத்திரிகை, விசாரணை பகுப்பாய்வு." },
      { title: "வாழ்க்கை & அழகு பிராண்டுகள்", desc: "அழகியல் பொருள் வடிவமைப்பு, கலைஞர் நாடி, வாசம், நலன்." },
      { title: "பயண தொழில்நுட்பம் & அனுபவங்கள்", desc: "திட்டமிட்ட பயணம், அனுபவ சுற்றுலா, கலாச்சார தொடர்பு தளங்கள்." },
      { title: "கல்வி & e-Learning",         desc: "படைப்பு பாடத்திட்ட வடிவமைப்பு, கலை கல்வி, குறுக்கு-ஒழுக்கம் கற்றல்." },
    ],
    dashaThemes: [
      "தேடல் தொடங்குகிறது — மார்ஸ் ஆற்றல், ஆரம்பகால ஆர்வம்",
      "பரந்த உலகம் அழைக்கிறது — பள்ளி, படைப்பு கண்டுபிடிப்பு, முதல் திசை",
      "படைப்பு & அறிவு அறுவடை — தொழில், திருமணம், முதிர்ச்சி",
      "ஆழம் பரப்பை மீறுகிறது — சனி, உறுதி, நிரந்தர கட்டமைப்பு",
      "ராசி அதிபதி — மாபெரும் தொடர்பு — புதன் தசை மிதுன பாதத்திற்கு",
      "மான் வீடு திரும்புகிறது — ஆன்மீக திரும்பல், அமைதி, பேரன்கள்",
      "ராசி அதிபதி — அழகின் இறுதி அறிக்கை — சுக்கிரன் ரிஷப பாதத்திற்கு",
      "இறுதி சூரிய தெளிவு — ஒளியில் ஒன்றிணைவு",
    ],
    dashaDetails: [
      {
        expect: "மிருகசீரிடம் செவ்வாய் தசையில் பிறக்கிறார் — இயல்பில் மென்மையான மற்றும் தேடும் நட்சத்திரத்திற்கு உற்சாக, செயல்திறன் மிக்க திறப்பு. இந்த குழந்தை அசாதாரண உடல் சக்தியுடன் வருகிறது மற்றும் ஒரு அமைதியின்மை கொண்டுள்ளது. மூத்த சகோதரர்கள் அல்லது உறவினர்களுடன் பிணைப்பு இந்த ஆரம்ப ஆண்டுகளில் அடிக்கடி வரையறுக்கும். பள்ளி நுழைவு (5–7 வயது) சில மிருகசீரிட குழந்தைகளுக்கு எளிதாகவும் மற்றவர்களுக்கு எதிர்ப்புடனும் வருகிறது.",
        navigate: "செவ்வாயின் உடல் ஆற்றல் போதுமான திசைமாற்றல் இல்லாமல் சிறு குழந்தைகளில் அமைதியற்ற ஆக்கிரமிப்பாக மாறும். விபத்துகள் மற்றும் தலை காயங்கள் செவ்வாய் தசை குழந்தை பருவத்தில் முதன்மையான உடல் அபாயங்கள். கட்டமைக்கப்பட்ட உடல் விளையாட்டு, ஆரம்பகால விளையாட்டு, அல்லது வெளிப்புற ஆய்வு மூலம் பெற்றோர் இந்த சக்தியை நிர்வகிக்க வேண்டும்.",
        focus: "செவ்வாய்க்கிழமை முருகன் வழிபாடும் குழந்தையை உடல் வெளிப்புற சூழல்களுக்கு அறிமுகப்படுத்துவதும் செவ்வாயின் சக்தியை மிருகசீரிடத்தின் இயல்பான தேடும் திசையில் செலுத்துகிறது. செவ்வாய் தசையில் அறிமுகப்படுத்தப்படும் எந்த படைப்பு அல்லது கலை செயல்பாடும் நினைவில் இருக்கும் மற்றும் திரும்பி வரும்.",
      },
      {
        expect: "ராகு தசை 7 முதல் 25 வயது வரை மிருகசீரிடத்தின் முழு பள்ளிக்கல்வி, பருவமடைதல், ஆரம்பகால வயது வந்த வாழ்வை உள்ளடக்குகிறது. தேடும் இயல்பு இப்போது அதன் முதல் தீவிரமான தொடர்பு பொருளை கண்டுபிடிக்கிறது — ஒரு கல்வி ஆர்வம், படைப்பு காதல், அல்லது ஒரு முக்கியமான உறவு. கல்லூரி வயதில் (17–22), வாழ்க்கையை வரையறுக்கும் படைப்பு அல்லது அறிவார்ந்த திசை பொதுவாக தெளிவாகும். வெளிநாட்டு தாக்கம் வளர்ச்சியை துரிதப்படுத்துகிறது.",
        navigate: "ராகுவின் மிருகசீரிடத்தின் இயல்பான அமைதியின்மையை அதிகரிப்பது அடிக்கடி திசைமாற்றல் செய்யும் நபரை உருவாக்கலாம். 17 முதல் 24 வயதுக்கு இடையே மிகவும் முக்கியமான அபாயம் சிதறிய தொடர்பு — ஆழம் கட்டாமல் பல விஷயங்களை மேலோட்டமாக செய்வது. ராகு–சனி அந்தர்தசை (சுமார் 20–22 வயது) அதிகமாக கோரும் துணை காலம்.",
        focus: "சனிக்கிழமை ராகு சன்னதி வழிபாடும் முழு ராகு தசை வழியாக தொடர ஒரு தெளிவான படைப்பு அல்லது அறிவார்ந்த ஒழுக்கத்தை நிறுவுவதும் உகந்த முடிவுகளை தருகிறது. கவனிக்கவும்: ராகு–புதன் அந்தர்தசை (ராகு தசையின் சுமார் 2வது ஆண்டில், சுமார் 9 வயது). மிதுன பாத மிருகசீரிடத்திற்கு, புதன் ராசி அதிபதி — இந்த ஆரம்பகால சாளரம் அசாதாரண மொழி மற்றும் படைப்பு நுண்ணறிவை கொண்டு வருகிறது. 9 வயதில் தொடங்கும் பயிற்சி தொழில் அடித்தளமாக மாறும்.",
      },
      {
        expect: "குரு தசை 25 முதல் 41 வயது வரை மிருகசீரிடத்தை படைப்பு மற்றும் அறிவு வாழ்வின் முழு வெளிப்பாட்டில் கண்டுபிடிக்கிறது. தொழில் நிலைபெறுகிறது மற்றும் ஆழமடைகிறது. திருமணம் பொதுவாக குரு–செவ்வாய் அந்தர்தசையில் (சுமார் 28–30 வயது) வருகிறது. மிருகசீரிடத்தின் அமைதியின்மை — இளமையில் ஒரு தீமை — குரு தசையில் சொத்தாக மாறுகிறது.",
        navigate: "குரு செழிப்பு மிருகசீரிடத்தின் இயல்பான 'அடுத்து என்ன' என்று தேடும் போக்கை ஆழமடைக்கலாம் — முடிவு தவிர்த்தல் உறவுகளிலும் தொழிலிலும். கல்லீரல் ஆரோக்யம் முப்பதுகளின் நடுவில் கவனிக்க வேண்டும்.",
        focus: "வியாழக்கிழமை தட்சிணாமூர்த்தி வழிபாடும் ஒரு முதன்மையான படைப்பு அல்லது தொழில் ஒழுக்கத்தில் வேண்டுமென்றே முதலீடும் குரு செழிப்பை வலுப்படுத்துகிறது. கவனிக்கவும்: குரு–புதன் அந்தர்தசை (குரு தசையின் சுமார் 10வது ஆண்டில், சுமார் 35 வயது). மிதுன பாத மிருகசீரிடத்திற்கு, இது ராசி அதிபதி புதனின் அந்தர்தசை — அசாதாரண தொடர்பு, படைப்பு, அறிவார்ந்த வளத்தின் சாளரம். குரு தசையில் மிகவும் முக்கியமான தொழில் பணி பொதுவாக இந்த 11 மாத சாளரத்தில் வருகிறது.",
      },
      {
        expect: "சனி தசை 41 முதல் 60 வயது வரை மிருகசீரிடத்தின் மிகவும் சோதனை செய்யும் காலம். சனியின் நீடித்த அர்ப்பணிப்பு மற்றும் தாமதமான திருப்பத்தின் கோரிக்கை இந்த நட்சத்திரத்தை வரையறுக்கும் தேடும், ஆய்வு செய்யும் இயல்புடன் வேண்டுமென்றே மோதுகிறது. குரு தசையில் அவர்களின் உண்மையான ஆழமான அழைப்பை கண்டுபிடித்தவர்கள் சனி அதை தாராளமாக வெகுமதி தருவதை கண்டுபிடிக்கிறார்கள்.",
        navigate: "மிருகசீரிடத்தின் மிகவும் கடினமான சனி தசை அனுபவம் தேடுவதற்கான சுதந்திரம் இழப்பு. சனி–ராகு அந்தர்தசை (சுமார் 50–53 வயது) அதிகமாக கலக்கமான துணை காலம். மூட்டு பராமரிப்பு, இதயம், சுவாச ஆரோக்யம் நாற்பதுகளின் நடுவிலிருந்து தீவிர கவனம் தேவை.",
        focus: "சனிக்கிழமை எண்ணெய் குளியல் மற்றும் சனி கோவில் வழிபாடு அவசியம். கவனிக்கவும்: சனி–புதன் அந்தர்தசை (சனி தசையின் சுமார் 10வது ஆண்டில், சுமார் 51 வயது). மிதுன பாத மிருகசீரிடத்திற்கு, இது சனியின் கண்டிப்பான வளைவில் ராசி அதிபதி புதன் வரும் சாளரம் — அசாதாரண படைப்பு தெளிவு மற்றும் தொடர்பு சக்தியின் சாளரம். சனி தசையில் எந்த முக்கியமான படைப்பு வெளியீடும், கல்வி பங்களிப்பும் பெரும்பாலும் இந்த துணை காலத்தில் வரும்.",
      },
      {
        expect: "புதன் தசை 60 முதல் 77 வயது வரை மிதுன பாத (பாதங்கள் 3–4) மிருகசீரிட நேயர்களுக்கு ராசி அதிபதியின் வருகை. புதன் உங்கள் ராசியான மிதுனத்தின் அதிபதி — இது இந்த நேயர்களுக்கு இரட்டை வலிமையுடன் வருகிறது. எழுத்து, கற்பித்தல், அறிவார்ந்த மரபு கட்டுவது, தொடர்பு தேர்ச்சி வாழ்நாளில் உச்சம் அடைகின்றன. ஐம்பது ஆண்டுகள் தேடுதலின் திரட்டப்பட்ட தேடல் மாற்றவியலாத நுண்ணறிவாக படிகமாகிறது.",
        navigate: "புதன் முதன்மையான ஆரோக்ய கவலைகள் நரம்பு மண்டலம், சுவாசம், நுட்பமான மோட்டார் ஒருங்கிணைப்பு. மிருகசீரிடத்தின் நிரந்தர தேடும் இயல்பு, இப்போது ஆழமான பொருளை கண்டுபிடித்திருக்க வேண்டும், கண்டுபிடிக்கப்பட்டதை பகிர்வுக்கு வழங்க வேண்டும்.",
        focus: "புதன்கிழமை வழிபாடு, பசுமை அர்ப்பணங்கள், செயல்படும் அறிவார்ந்த ஈடுபாடு — எழுத்து, கற்பித்தல், கடிதத்தொடர்பு — புதனின் நிவாரணங்கள். எந்த முக்கியமான எழுத்து படைப்பும், கல்வி பங்களிப்பும், தொடர்பு மரபும் முந்தைய தசகங்களிலிருந்து தாமதிக்கப்பட்டிருந்தால் — புதன் தசை மறுக்க முடியாத சாளரம்.",
      },
      {
        expect: "கேது தசை 77 முதல் 84 வயது வரை மிருகசீரிடத்தின் உள்நோக்கிய திரும்பல் — ஒரு வாழ்நாள் தேடிய மான் இறுதியில் தேடப்பட்டது ஒருபோதும் வெளிப்புறமில்லை என்று உணர்கிறது. ஒரு ஆழமான ஆன்மீக நிறைவு குடியேறுகிறது. படைப்பு வேலை, இன்னும் தொடர்ந்தால், முழுமையான எளிமையின் தரத்தை எடுத்துக்கொள்கிறது.",
        navigate: "உடல் சார்பு அதிகரிக்கிறது மற்றும் மிருகசீரிடம் மற்றவர்களுக்கு நீட்டிக்கப்பட்ட அதே அனுகூலத்துடன் சந்திக்கப்பட வேண்டும். கேதுவின் நுட்பமான உலகங்களுடன் இணைப்பு கனவுகள், ஆன்மீக உள்ளுணர்வுகளை தீவிரப்படுத்தலாம்.",
        focus: "கேது சன்னதி வழிபாடு, பித்ரு தர்ப்பணம், கருப்பு எள் அர்ப்பணங்கள் முன்னோர் கடமைகளை நிறைவு செய்கின்றன. தினசரி தியானம் அல்லது அமைதியான அமர்வு கேது தசையின் நுட்பமான சக்தியை தரையிறக்குகிறது.",
      },
      {
        expect: "சுக்கிர தசை 84 வயதிலிருந்து ரிஷப பாத (பாதங்கள் 1–2) மிருகசீரிட நேயர்களுக்கு ராசி அதிபதியின் வருகை. சுக்கிரன் உங்கள் ராசியான ரிஷபத்தின் அதிபதி — இது இந்த நேயர்களுக்கு இரட்டை வலிமையுடன் வருகிறது. அழகு, அனுகூலம், புலன்களின் இன்பங்கள் — முன்பை விட ஆழமாக கேட்கும் இசை, மலர்களின் வாசம், குடும்பத்தின் அரவணைப்பு — தங்கள் மிகவும் சாரமான தரத்தை எடுத்துக்கொள்கின்றன.",
        navigate: "இந்த தீவிர வயதில், உடல் பராமரிப்பு முழுமை மற்றும் எளிமை. மனம், சுக்கிரன் நட்சத்திர சாட்டத்தில் வலுவாக இருந்தால், ஆச்சரியமான இருப்பு மற்றும் அழகு உணர்வுடன் இருக்கலாம்.",
        focus: "வெள்ளிக்கிழமை அன்னை லட்சுமி வழிபாடு, ரோஜா மற்றும் மல்லிகை அர்ப்பணம், நபரை இசை, மலர்கள், அன்பானவர்களின் இருப்புடன் சூழ்வது — மிகவும் பொருத்தமான பராமரிப்பு. அழகை தேடி கண்டுபிடித்த வாழ்க்கை அழகின் ஆதாரத்திலேயே வந்து முடிகிறது.",
      },
      {
        expect: "சூரியன் தசை 104 முதல் 110 வயது வரை நடைமுறையில் எவராலும் அடையப்படுவதில்லை. இந்த அரிய ஆத்மாக்களுக்கு, சூரியன் அதன் இறுதி கொடையை கொண்டு வருகிறது — முழுமையான அடையாள தெளிவு, தேடல் தேவையில்லாத நிலையான ஒளி ஏனென்றால் அது ஒளியாகவே மாறிவிட்டது.",
        navigate: "இந்த வயதில் உடல் பராமரிப்பு முழுமையான மற்றும் மென்மையானது. உடலின் தேவைகள் குறைவான மற்றும் குறிப்பிட்டவை. அரவணைப்பு, ஒளி, பரிச்சயமான ஒலிகள் எல்லாமே.",
        focus: "ஞாயிற்றுக்கிழமை சூரிய வழிபாடு, ஆதித்ய ஹ்ருதயம், உதய சூரியனுக்கு விளக்கின் ஒளி வழங்குவது — வாழ்வின் கடைசி பக்தி சைகைகள். நிலைத்தன்மை கொண்ட, அமைதியான, ஒளியில் சூழப்பட்ட நிறைவு சோமனின் மென்மையான நட்சத்திரத்தின் இறுதி கொடை.",
      },
    ],
    spirituality: [
      { title: "சோம & சந்திர வழிபாடு",   desc: "மிருகசீரிடத்தின் தலைமை தெய்வம் சோமன் (சந்திர தெய்வம்) — திங்கள் வழிபாடு, நிலா நேர வேண்டுதல்கள், நீர் நிலைகளுக்கு மரியாதை மிகவும் இயல்பான ஆன்மீக நடைமுறைகள்." },
      { title: "படைப்பு வேலை சாதனையாக",  desc: "மிருகசீரிடத்திற்கு, கலை படைப்பு ஆன்மீக நடைமுறையிலிருந்து தனியாக இல்லை — நீடித்த படைப்பு ஒழுக்கம் அதுவே வழிபாட்டின் வடிவம்." },
      { title: "திருத்தல & தேடல்",        desc: "மலை தலங்கள், ஆற்றங்கரைகள், வனக் கோயில்களுக்கு திருத்தல் மிருகசீரிடத்தின் மான் இயல்புடன் ஆழமாக ஒத்துப்போகிறது — நிரந்தர தேடலை மிகவும் சுப திசையில் நிறைவேற்றுகிறது." },
    ],
    guidance: "உங்கள் தேடல் உங்கள் வலிமை — ஒருபோதும் அடக்காதீர்கள், திசைமாற்றுங்கள். ஒரு வாழ்நாள் ஆழத்திற்கு மதிப்புள்ள ஒரு படைப்பு அல்லது அறிவார்ந்த ஒழுக்கத்தை கண்டுபிடியுங்கள், அந்த ஒழுக்கம் உங்கள் கோவிலாக இருக்கட்டும் — மிருகசீரிடத்தின் அமைதியற்ற நுண்ணறிவு தேடலை தாண்டிய பணியை உருவாக்கும்.",
    compatibleNote: "இந்த நட்சத்திரங்கள் மிருகசீரிடத்தின் தேடும் ஆர்வம், படைப்பு நுண்ணறிவு, மென்மையான காந்தம் ஆகியவற்றை அரவணைப்பு, நிலைத்தன்மை, அழகு ஒத்தொலிப்புடன் நிரப்புகின்றன.",
    careerNote: "ஆர்வம், படைப்பு வெளிப்பாடு, தொடர்பு சந்திக்கும் இடங்களில் சிறப்பாக செயல்படுகிறார்கள் — பன்முகத்தன்மை, அழகு நுண்ணறிவு, கோட்பாடுகளை பல தளங்களில் இணைக்கும் திறனை வெகுமதி தரும் பணிகளில்.",
    modernLead: "மிருகசீரிடத்தின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "படைப்பு ஆழம், தொடர்பு நுட்பம், மென்மையான விசுவாசம் மிருகசீரிடத்தின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function MrigashiraVisualPage() {
  return <NatchathiramVisualContent data={MRIGASHIRA} visual={MRIGASHIRA_VISUAL} />;
}
