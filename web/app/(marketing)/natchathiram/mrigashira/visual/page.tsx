import type { Metadata } from "next";
import { withTamilTwin } from "@/lib/localized-metadata";
import { withDasaTimingHold } from "@/lib/natchathiram-dasa-hold";
import { dasaTimingsFor } from "@/lib/natchathiram-dasa-timings";
import { nakshatraDisplayName } from "@/lib/nakshatra-display-name";
import { natchathiramVisualTa } from "@/lib/marketing-seo-ta";
import { MRIGASHIRA } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

const EN_METADATA: Metadata = {
  title: `${nakshatraDisplayName(MRIGASHIRA.number, "en")} — Visual Profile`,
  description: "Visual profile of Mirugaseeridam Nakshathiram: personality traits, career strengths, dasa timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/mrigashira/visual" },
  openGraph: {
    title: `${nakshatraDisplayName(MRIGASHIRA.number, "en")} — Visual Profile`,
    description: "Visual profile of Mirugaseeridam Nakshathiram: personality traits, career strengths, dasa timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/mrigashira/visual",
    type: "article",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withDasaTimingHold(await withTamilTwin(EN_METADATA, "/natchathiram/mrigashira/visual", natchathiramVisualTa("mrigashira")!), "mrigashira");
}

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
      planet: "Mars", theme: "The Searching Begins",
      detail: {
        expect: "Mrigashira is born into Mars dasa — an energetic, active opening for a nakshathiram whose nature is inherently gentle and searching. This child arrives with unusual physical vitality and a restlessness that can be mistaken for difficulty; they are simply the deer in motion from the first breath. The bond with elder siblings or cousins is often defining in these early years. Where the balance at birth is long enough to reach school entry, school comes easily for some Mrigashira children and with resistance for others — this depends heavily on whether the school environment rewards curiosity over conformity. Health is generally robust but inflammatory conditions — fevers, skin issues, head injuries — are Mars's typical presentation. Mrigashira is born inside this dasa, so only the balance remaining at birth is lived; the pada decides how much, and the range shown for this dasa gives it.",
        navigate: "Mars's physical energy without adequate channelling becomes restless aggression in young children. Parental management of this energy through structured physical play, early sport, or outdoor exploration is essential. Accidents and head injuries are the primary physical risks in Mars dasa infancy and early childhood. The family's stability and the father's health and presence are directly reflected in this child's sense of security.",
        focus: "Tuesday Murugan worship and introducing the child to physical outdoor environments — gardens, forests, open spaces — channels Mars's energy in Mrigashira's natural direction of seeking. Any creative or artistic activity introduced in Mars dasa will be remembered and returned to; the deer's eyes are always open. Visiting Murugan temples at Tiruchendur or Palani establishes an early protective connection.",
      },
    },
    {
      planet: "Rahu", theme: "The Wide World Beckons",
      detail: {
        expect: "Rahu dasa carries Mrigashira through schooling and adolescence and, for the longer balances, into early adulthood. This is when the searching nature finds its first serious object of pursuit — an academic interest, a creative passion, a relationship, or an ambition. School performance in Rahu dasa tends to be uneven: brilliant in subjects that capture the imagination, indifferent in those that don't. By the college years, the creative or intellectual direction that will define the person's life typically crystallises. Foreign influence — exchange programs, internationally-connected mentors, online communities — accelerates Mrigashira's development. A first significant romantic relationship arrives, often intensely and unexpectedly.",
        navigate: "Rahu's amplification of Mrigashira's natural restlessness can produce a person who changes direction too frequently — academic streams, career paths, relationships — before depth is built anywhere. The most critical risk across the college and early working years is scattered pursuit: doing many things superficially instead of one thing deeply. The Rahu–Saturn bhukti (the table below gives when it begins and how long it lasts) is the most demanding sub-period; identity consolidation must happen here even as external instability peaks.",
        focus: "Saturday Rahu shrine prayers and establishing one clear creative or intellectual discipline to pursue through the entire Rahu dasa yields far better results than experimentation. Also watch the Rahu–Mercury bhukti within this dasa (the bhukti table below gives when it begins and how long it lasts); it falls in the school years. For Mithuna-pada (third and fourth pada) Mrigashira, Mercury is the rasi lord — this window within Rahu dasa carries the rasi lord's amplified quality: unusual verbal and creative intelligence, early writing or musical gifts, and a precocious ability to communicate ideas. Parents and teachers who notice this in the child should invest immediately — training begun in Mrigashira's Mercury window becomes the professional foundation.",
      },
    },
    {
      planet: "Jupiter", theme: "Creative & Intellectual Harvest",
      detail: {
        expect: "Jupiter dasa finds Mrigashira in the fullest expression of creative and intellectual life. Career establishes and deepens — the artist, writer, researcher, or communicator finds their audience. Where marriage falls within this dasa, it is read from the seventh house and its lord, with Venus and Jupiter as the natural significators, and judged from the individual horoscope as a tendency rather than a fixed time. Children may come. Property acquisition becomes feasible as the dasa advances. Mrigashira's restlessness — which was a disadvantage in youth — becomes an asset in Jupiter dasa: the broad curiosity and cross-domain exploration produces creative work that narrowly specialised people cannot match. Teaching and mentoring impulses emerge.",
        navigate: "Jupiter's abundance can deepen Mrigashira's natural tendency to search perpetually for 'what's next' — the result is commitment avoidance in relationships and career that prevents the depth Jupiter is actually offering. Liver health and metabolic management become relevant as the dasa advances. The temptation to pursue every interesting opportunity that Jupiter dasa generates must be resisted in favour of depth in the two or three areas that truly matter.",
        focus: "Thursday Dakshinamurthy worship and deliberate investment in one primary creative or professional discipline amplifies Jupiter's abundance. Also watch the Jupiter–Mercury bhukti within this dasa (the bhukti table below gives when it begins and how long it lasts). For Mithuna-pada Mrigashira, this is the rasi lord Mercury's bhukti within Jupiter — a window of extraordinary communicative, creative, and intellectual fertility. The most significant piece of work, professional recognition, or educational achievement in Jupiter dasa tends to land in this window. Plan the most important professional deliverable for this sub-period.",
      },
    },
    {
      planet: "Saturn", theme: "Depth Over Breadth",
      detail: {
        expect: "Saturn dasa, running through mid-life into the later working years, is Mrigashira's most testing period — not because Saturn is malefic for Mrigashira, but because Saturn's demand for sustained commitment and delayed gratification sits in deliberate tension with the searching, exploring nature that defines this nakshathiram. Those who found their true depth in Jupiter dasa discover that Saturn rewards it generously. Property consolidation, institutional recognition, and mature creative mastery characterise the productive phase of this dasa. Children enter adulthood. The domestic environment stabilises.",
        navigate: "Mrigashira's most difficult Saturn dasa experience is the loss of the freedom to search — Saturn demands one path, committed to. Depression or creative dryness can appear if the native has not found a genuine deep calling by the time Saturn dasa begins. The Saturn–Rahu bhukti (the table below gives when it begins and how long it lasts) is the most turbulent sub-period; financial, legal, and health challenges can converge acutely. Joint care, cardiovascular monitoring, and respiratory health require active attention as this dasa approaches and advances.",
        focus: "Saturday oil bath, Shani temple worship and Hanuman worship are essential stabilisers. Also watch the Saturn–Mercury bhukti within this dasa (the bhukti table below gives when it begins and how long it lasts). For Mithuna-pada Mrigashira, this is the rasi lord Mercury arriving within Saturn's demanding arc — a window of unusual creative clarity and communicative power amidst Saturn's austerity. Any significant creative publication, educational contribution, or communicative achievement in Saturn dasa will most likely land in this sub-period. Prepare, plan, and protect this window.",
      },
    },
    {
      planet: "Mercury", theme: "Rasi Lord — The Great Communication",
      detail: {
        expect: "Mercury dasa is the rasi lord's arrival for Mithuna-pada (third and fourth pada) Mrigashira natives. Mercury is the lord of your rasi, Mithuna — this makes his dasa doubly charged for these natives. Where other nakshathirams experience Mercury dasa as one planetary period among many, for Mithuna Mrigashira it is the rasi lord himself taking the wheel in the final active years. Writing, teaching, intellectual legacy-building, and communicative mastery reach their lifetime peak. The accumulated searching of a lifetime crystallises into insight that is genuinely irreplaceable. For Rishabam-pada (first and second pada) Mrigashira, Mercury dasa is still rich — intellectual clarity and social connection remain strong — but the rasi lord's amplification is reserved for Venus dasa (which follows much later).",
        navigate: "Mercury's primary health concerns at this age are nervous system, respiratory, and fine motor coordination. Mental agility, maintained through active intellectual engagement — writing, conversation, analysis — outlasts physical agility. Mrigashira's perpetual searching nature, having found its deepest object by now, must settle into transmission rather than perpetual exploration. The temptation to keep searching for new things must give way to sharing what has already been found.",
        focus: "Wednesday worship, green offerings, and active intellectual engagement — writing, teaching, correspondence — are Mercury's primary remedies. If any significant written work, educational contribution, or communicative legacy has been deferred from earlier decades — Mercury dasa is the non-negotiable window. Vishnu Sahasranama recitation and regular Vedic study maintain Mercury's natural affinity with sacred knowledge.",
      },
    },
    {
      planet: "Ketu", theme: "The Deer Comes Home",
      detail: {
        expect: "Ketu dasa, in advanced age, is Mrigashira's turning inward — the deer that spent a lifetime searching finally recognises that what was sought was never external. A deep spiritual quietude settles. Grandchildren and great-grandchildren become the new focus of gentle, unconditional love. Creative work, if still pursued, takes on a quality of absolute simplicity — a single melody, a brief poem, a carefully made object — that contains everything earlier complexity could not.",
        navigate: "Physical dependence increases and must be met with the grace that Mrigashira has extended to others throughout life. The restlessness that characterised earlier decades tends to quiet in Ketu dasa for Mrigashira — if it does not, it is a signal to deepen spiritual practice. Ketu's connection to ancestral worlds means dreams, spiritual intuitions, and awareness of subtle presences may intensify.",
        focus: "Ganapati worship and Ketu shrine visits; pitru tharpanam and black sesame offerings complete ancestral obligations. Daily meditation or quiet sitting — even a short while each day — grounds Ketu dasa's subtle energy. The Brihadaranyaka or Aitareya Upanishad, with their tone of gentle cosmic inquiry, are the most resonant scriptural companions for this period.",
      },
    },
    {
      planet: "Venus", theme: "Rasi Lord — Beauty's Final Statement",
      detail: {
        expect: "Venus dasa, beginning only in very advanced age, is the rasi lord's arrival for Rishabam-pada (first and second pada) Mrigashira natives. Venus is the lord of your rasi, Rishabam — this makes her dasa doubly charged for these natives. Where other nakshathirams experience Venus dasa as one planetary period among many, for Rishabam Mrigashira it is the rasi lord herself arriving in the final chapter of life. Beauty, grace, and the pleasures of the senses — music heard more deeply than ever before, the fragrance of flowers, the warmth of family — take on their most essential quality. The person lives in a state of refined abundance that mirrors in miniature the Venusian gifts they shared across a lifetime of creative and aesthetic contribution.",
        navigate: "At this extreme age, physical care is complete and simple: warmth, gentle nourishment, beauty in the immediate environment, steady companionship. The mind, if Venus is strong in the natal chart, can remain astonishingly present and aesthetically alive. Avoid sensory harshness and emotional disruption.",
        focus: "Friday Goddess Lakshmi worship, rose and jasmine offerings, and surrounding the person with music, flowers, and the presence of those they love — this is the most appropriate care. A life of searching through beauty has arrived at the source of beauty itself.",
      },
    },
    {
      planet: "Sun", theme: "Final Solar Clarity",
      detail: {
        expect: "Sun dasa, the last in this sequence, is reached by virtually none. For those rare souls who arrive here, the Sun brings its final gift — absolute clarity of identity, a settled luminosity that needs no search because it has become the light itself. The searching deer has merged with the moon's reflection in the water.",
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

  compatibleEn: ["Rohini", "Aswini", "Chithirai", "Swathi", "Revathi"],
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
      "தேடல் தொடங்குகிறது — செவ்வாய் ஆற்றல், ஆரம்பகால ஆர்வம்",
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
        expect: "மிருகசீரிடம் செவ்வாய் தசையில் பிறக்கிறார் — இயல்பில் மென்மையான, தேடும் நட்சத்திரத்திற்கு உற்சாகமான, செயல்திறன் மிக்க திறப்பு. இந்த குழந்தை அசாதாரண உடல் சக்தியுடனும், சிரமம் என்று தவறாகப் புரிந்துகொள்ளப்படக்கூடிய அமைதியின்மையுடனும் வருகிறது; முதல் மூச்சிலிருந்தே இயக்கத்தில் இருக்கும் மான் அது. மூத்த சகோதரர்கள் அல்லது உறவினர் குழந்தைகளுடனான பிணைப்பு இந்த ஆரம்ப ஆண்டுகளில் அடிக்கடி வரையறுக்கும். பிறக்கும்போது இருப்பு பள்ளி தொடக்கம் வரை நீளுமானால், பள்ளி சில மிருகசீரிடக் குழந்தைகளுக்கு எளிதாகவும் மற்றவர்களுக்கு எதிர்ப்புடனும் வரும் — இது பள்ளிச் சூழல் ஒத்துப்போகும் தன்மையை விட ஆர்வத்தை மதிக்கிறதா என்பதைப் பொறுத்தது. ஆரோக்கியம் பொதுவாக உறுதியானது; ஆனால் காய்ச்சல், தோல் பிரச்சினை, தலைக் காயம் போன்ற அழற்சி நிலைகள் செவ்வாயின் வழக்கமான வெளிப்பாடு. மிருகசீரிடம் இந்த தசையின் நடுவிலேயே பிறப்பதால், பிறக்கும்போது மீதமுள்ள இருப்பு மட்டுமே வாழப்படுகிறது; அது பாதத்தைப் பொறுத்தது — இந்த தசைக்குக் காட்டப்படும் வரம்பு அதைச் சொல்கிறது.",
        navigate: "செவ்வாயின் உடல் ஆற்றல் போதுமான திசைமாற்றல் இல்லாமல் சிறு குழந்தைகளில் அமைதியற்ற ஆக்கிரமிப்பாக மாறும். விபத்துகள் மற்றும் தலை காயங்கள் செவ்வாய் தசை குழந்தை பருவத்தில் முதன்மையான உடல் அபாயங்கள். கட்டமைக்கப்பட்ட உடல் விளையாட்டு, ஆரம்பகால விளையாட்டு, அல்லது வெளிப்புற ஆய்வு மூலம் பெற்றோர் இந்த சக்தியை நிர்வகிக்க வேண்டும். குடும்பத்தின் நிலைத்தன்மையும், தந்தையின் ஆரோக்கியமும் உடனிருப்பும் இந்தக் குழந்தையின் பாதுகாப்பு உணர்வில் நேரடியாகப் பிரதிபலிக்கின்றன.",
        focus: "செவ்வாய்க்கிழமை முருகன் வழிபாடும் குழந்தையை உடல் வெளிப்புற சூழல்களுக்கு அறிமுகப்படுத்துவதும் செவ்வாயின் சக்தியை மிருகசீரிடத்தின் இயல்பான தேடும் திசையில் செலுத்துகிறது. செவ்வாய் தசையில் அறிமுகப்படுத்தப்படும் எந்தப் படைப்பு அல்லது கலைச் செயல்பாடும் நினைவில் நின்று மீண்டும் தொடரப்படும்; மானின் கண்கள் எப்போதும் திறந்தே இருக்கின்றன. திருச்செந்தூர் அல்லது பழனி முருகன் கோவில்களுக்குச் செல்வது ஆரம்பத்திலேயே ஒரு பாதுகாப்புத் தொடர்பை நிறுவுகிறது.",
      },
      {
        expect: "ராகு தசை மிருகசீரிடத்தை பள்ளிக்கல்வி, வளரிளம் பருவம் வழியாகவும், நீண்ட இருப்பில் இளம் வயது வந்த காலம் வரையிலும் அழைத்துச் செல்கிறது. தேடும் இயல்பு இப்போது தன் முதல் தீவிரமான தேடல் பொருளை கண்டுபிடிக்கிறது — ஒரு கல்வி ஆர்வம், படைப்புக் காதல், ஒரு முக்கியமான உறவு அல்லது ஒரு இலட்சியம். ராகு தசையில் பள்ளிச் செயல்திறன் சீரற்றதாக இருக்கும்: கற்பனையைக் கவரும் பாடங்களில் பிரகாசம், மற்றவற்றில் அலட்சியம். கல்லூரிக் காலத்துக்குள் வாழ்க்கையை வரையறுக்கும் படைப்பு அல்லது அறிவார்ந்த திசை பொதுவாக தெளிவாகும். வெளிநாட்டு தாக்கம் — பரிமாற்றத் திட்டங்கள், சர்வதேச தொடர்புள்ள வழிகாட்டிகள், இணைய சமூகங்கள் — வளர்ச்சியை துரிதப்படுத்துகிறது. முதல் குறிப்பிடத்தக்க காதல் உறவு தீவிரமாகவும் எதிர்பாராமலும் வருகிறது.",
        navigate: "ராகு மிருகசீரிடத்தின் இயல்பான அமைதியின்மையை அதிகரிப்பதால், எங்கும் ஆழம் கட்டுவதற்கு முன்பே — கல்விப் பிரிவு, தொழில் பாதை, உறவுகள் — அடிக்கடி திசை மாற்றும் நபர் உருவாகலாம். கல்லூரிக் காலத்திலும் தொடக்கப் பணிக் காலத்திலும் மிகவும் முக்கியமான அபாயம் சிதறிய தேடல் — ஒன்றை ஆழமாகச் செய்வதற்குப் பதிலாக பலவற்றை மேலோட்டமாகச் செய்வது. ராகு–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மிகவும் கோரும் துணைக் காலம்; வெளிப்புற நிலையின்மை உச்சத்தில் இருக்கும்போதே அடையாள உறுதிப்பாடு இங்கு நிகழ வேண்டும்.",
        focus: "சனிக்கிழமை ராகு சன்னதி வழிபாடும், முழு ராகு தசை வழியாகத் தொடர ஒரு தெளிவான படைப்பு அல்லது அறிவார்ந்த ஒழுக்கத்தை நிறுவுவதும் பரிசோதனைகளை விட மிகச் சிறந்த பலன் தரும். கவனிக்கவும்: இந்த தசைக்குள் ராகு–புதன் புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்); இது பள்ளிக் காலத்தில் வருகிறது. மிதுன பாத (மூன்றாம், நான்காம் பாதம்) மிருகசீரிடத்திற்கு, புதன் ராசி அதிபதி — ராகு தசைக்குள் இந்த சாளரம் ராசி அதிபதியின் மிகைப்படுத்தப்பட்ட தரத்தை கொண்டு வருகிறது: அசாதாரண மொழி மற்றும் படைப்பு நுண்ணறிவு, ஆரம்பகால எழுத்து அல்லது இசைத் திறன், கருத்துகளைத் தெரிவிக்கும் முன்கூட்டிய ஆற்றல். குழந்தையிடம் இதைக் கவனிக்கும் பெற்றோரும் ஆசிரியர்களும் உடனே முதலீடு செய்ய வேண்டும் — மிருகசீரிடத்தின் புதன் சாளரத்தில் தொடங்கும் பயிற்சி தொழில் அடித்தளமாகும்.",
      },
      {
        expect: "குரு தசை மிருகசீரிடத்தை படைப்பு மற்றும் அறிவு வாழ்வின் முழு வெளிப்பாட்டில் காண்கிறது. தொழில் நிலைபெற்று ஆழமடைகிறது — கலைஞர், எழுத்தாளர், ஆராய்ச்சியாளர் அல்லது தகவல் தொடர்பாளர் தன் பார்வையாளர்களை கண்டுபிடிக்கிறார். இந்தத் தசைக்குள் திருமணம் அமைந்தால், அது ஜாதகத்தின் ஏழாம் வீட்டையும் அதன் அதிபதியையும் கொண்டு பார்க்கப்படுகிறது; சுக்கிரனும் குருவும் அதன் இயல்பான காரகர்கள். அது ஒரு நிலையான காலம் அல்ல, ஒரு போக்கே. குழந்தைகளும் வரலாம். தசை முன்னேறும்போது சொத்து வாங்குவது சாத்தியமாகிறது. இளமையில் குறைபாடாக இருந்த மிருகசீரிடத்தின் அமைதியின்மை குரு தசையில் சொத்தாக மாறுகிறது: பரந்த ஆர்வமும் பல துறைகளில் ஆராயும் இயல்பும் குறுகிய நிபுணர்களால் எட்ட முடியாத படைப்பு வேலையைத் தருகின்றன. கற்பிக்கும், வழிகாட்டும் உந்துதல்கள் எழுகின்றன.",
        navigate: "குரு செழிப்பு மிருகசீரிடத்தின் இயல்பான 'அடுத்து என்ன' என்று தேடும் போக்கை ஆழமாக்கலாம் — இதன் விளைவு உறவுகளிலும் தொழிலிலும் உறுதி தவிர்ப்பு; குரு உண்மையில் தரும் ஆழத்தைத் அது தடுக்கிறது. தசை முன்னேறும்போது கல்லீரல் ஆரோக்கியமும் வளர்சிதை மாற்ற மேலாண்மையும் முக்கியமாகின்றன. குரு தசை உருவாக்கும் ஒவ்வொரு சுவாரசிய வாய்ப்பையும் துரத்தும் ஆசையை எதிர்த்து, உண்மையில் முக்கியமான இரண்டு அல்லது மூன்று துறைகளில் ஆழம் காண வேண்டும்.",
        focus: "வியாழக்கிழமை தட்சிணாமூர்த்தி வழிபாடும் ஒரு முதன்மையான படைப்பு அல்லது தொழில் ஒழுக்கத்தில் வேண்டுமென்றே முதலீடும் குரு செழிப்பை வலுப்படுத்துகிறது. கவனிக்கவும்: இந்த தசைக்குள் குரு–புதன் புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்). மிதுன பாத மிருகசீரிடத்திற்கு, இது ராசி அதிபதி புதனின் புக்தி — அசாதாரண தொடர்பு, படைப்பு, அறிவார்ந்த வளத்தின் சாளரம். குரு தசையில் மிகவும் முக்கியமான படைப்பு, தொழில் அங்கீகாரம் அல்லது கல்விச் சாதனை பொதுவாக இந்த சாளரத்தில் வரும். மிக முக்கியமான தொழில் பணியை இந்த துணைக் காலத்துக்குத் திட்டமிடுங்கள்.",
      },
      {
        expect: "சனி தசை நடுவயதிலிருந்து பிற்கால பணி ஆண்டுகள் வரை செல்கிறது; மிருகசீரிடத்தின் மிகவும் சோதனையான காலம் — சனி மிருகசீரிடத்திற்கு தீயது என்பதால் அல்ல, சனியின் நீடித்த அர்ப்பணிப்பு, தாமத திருப்தியின் கோரிக்கை இந்த நட்சத்திரத்தை வரையறுக்கும் தேடும், ஆராயும் இயல்புடன் வேண்டுமென்றே பதற்றத்தில் நிற்பதால். குரு தசையில் தங்கள் உண்மையான ஆழத்தை கண்டவர்கள் சனி அதைத் தாராளமாக வெகுமதி தருவதை காண்பார்கள். சொத்து ஒருங்கிணைப்பு, நிறுவன அங்கீகாரம், முதிர்ந்த படைப்புத் தேர்ச்சி இந்த தசையின் பயனுள்ள கட்டத்தை வரையறுக்கின்றன. குழந்தைகள் வயது வந்தோராகிறார்கள்; வீட்டுச் சூழல் நிலைபெறுகிறது.",
        navigate: "மிருகசீரிடத்தின் மிகக் கடினமான சனி தசை அனுபவம் தேடும் சுதந்திரத்தை இழப்பது — சனி ஒரே பாதையைக் கோருகிறது, அதில் உறுதியாக இருக்கச் சொல்கிறது. சனி தசை தொடங்கும் நேரத்தில் உண்மையான ஆழ்ந்த அழைப்பை ஜாதகர் கண்டுபிடிக்கவில்லை என்றால் மனச்சோர்வோ படைப்பு வறட்சியோ தோன்றலாம். சனி–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மிகவும் கலக்கமான துணைக் காலம்; நிதி, சட்டம், ஆரோக்கிய சவால்கள் தீவிரமாக ஒன்றுசேரலாம். தசையை நெருங்கும் காலத்திலிருந்தே மூட்டு பராமரிப்பு, இதய கண்காணிப்பு, சுவாச ஆரோக்கியம் ஆகியவற்றில் தீவிர கவனம் தேவை.",
        focus: "சனிக்கிழமை எண்ணெய் குளியல், சனி கோவில் வழிபாடு, ஆஞ்சநேயர் வழிபாடு அவசியமான நிலைப்படுத்திகள். கவனிக்கவும்: இந்த தசைக்குள் சனி–புதன் புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்). மிதுன பாத மிருகசீரிடத்திற்கு, இது சனியின் கண்டிப்பான வளைவில் ராசி அதிபதி புதன் வரும் சாளரம் — சனியின் எளிமைக்கு நடுவே அசாதாரண படைப்பு தெளிவு மற்றும் தொடர்பு சக்தியின் சாளரம். சனி தசையில் எந்த முக்கியமான படைப்பு வெளியீடும், கல்வி பங்களிப்பும், தொடர்பு சாதனையும் பெரும்பாலும் இந்த துணைக் காலத்தில் வரும். இந்த சாளரத்தைத் தயாராகி, திட்டமிட்டு, பாதுகாத்துக்கொள்ளுங்கள்.",
      },
      {
        expect: "புதன் தசை மிதுன பாத (மூன்றாம், நான்காம் பாதம்) மிருகசீரிட ஜாதகர்களுக்கு ராசி அதிபதியின் வருகை. புதன் உங்கள் ராசியான மிதுனத்தின் அதிபதி — இது இந்த ஜாதகர்களுக்கு இரட்டை வலிமையுடன் வருகிறது. மற்ற நட்சத்திரங்கள் புதன் தசையை பல கிரக காலங்களில் ஒன்றாக அனுபவிக்கும்போது, மிதுன மிருகசீரிடத்திற்கு இது செயல்படும் இறுதி ஆண்டுகளில் ராசி அதிபதியே வாழ்க்கையை நேரடியாகக் கையில் எடுத்துக்கொள்வது. எழுத்து, கற்பித்தல், அறிவார்ந்த மரபு கட்டுவது, தொடர்புத் தேர்ச்சி வாழ்நாள் உச்சத்தை அடைகின்றன. ஒரு வாழ்நாள் தேடலின் திரட்டு மாற்றவியலாத நுண்ணறிவாக படிகமாகிறது. ரிஷப பாத (முதல், இரண்டாம் பாதம்) மிருகசீரிடத்திற்கும் புதன் தசை வளமானதே — அறிவுத் தெளிவும் சமூகத் தொடர்பும் வலுவாக இருக்கும் — ஆனால் ராசி அதிபதியின் மிகைப்படுத்தல் மிகவும் பிந்தி வரும் சுக்கிர தசைக்கே உரியது.",
        navigate: "இந்த வயதில் புதனின் முதன்மையான ஆரோக்கியக் கவலைகள் நரம்பு மண்டலம், சுவாசம், நுண்ணிய இயக்க ஒருங்கிணைப்பு. செயலூக்கமான அறிவார்ந்த ஈடுபாட்டால் — எழுத்து, உரையாடல், பகுப்பாய்வு — பேணப்படும் மனச் சுறுசுறுப்பு உடல் சுறுசுறுப்பை விட நீடிக்கிறது. இதற்குள் தன் ஆழமான பொருளைக் கண்டடைந்த மிருகசீரிடத்தின் தொடர் தேடல் இயல்பு, இனி முடிவற்ற ஆய்வில் அல்ல, ஞானக் கடத்தலில் நிலைகொள்ள வேண்டும். புதியவற்றைத் தொடர்ந்து தேடும் ஆசை, ஏற்கனவே கண்டடைந்ததைப் பகிர்வதற்கு வழிவிட வேண்டும்.",
        focus: "புதன்கிழமை வழிபாடு, பசுமை அர்ப்பணங்கள், செயல்படும் அறிவார்ந்த ஈடுபாடு — எழுத்து, கற்பித்தல், கடிதத்தொடர்பு — புதனின் முதன்மைப் பரிகாரங்கள். எந்த முக்கியமான எழுத்து படைப்பும், கல்வி பங்களிப்பும், தொடர்பு மரபும் முந்தைய தசகங்களிலிருந்து தாமதிக்கப்பட்டிருந்தால் — புதன் தசை மறுக்க முடியாத சாளரம். விஷ்ணு சஹஸ்ரநாம பாராயணமும் முறையான வேத அத்தியயனமும் புனித ஞானத்துடனான புதனின் இயல்பான நெருக்கத்தைப் பேணுகின்றன.",
      },
      {
        expect: "முதிர்ந்த வயதில் வரும் கேது தசை மிருகசீரிடத்தின் உள்நோக்கிய திரும்பல் — ஒரு வாழ்நாள் தேடிய மான் இறுதியில் தேடப்பட்டது ஒருபோதும் வெளிப்புறமில்லை என்று உணர்கிறது. ஆழமான ஆன்மீக அமைதி குடியேறுகிறது. பேரன் பேத்திகளும் கொள்ளுப் பேரக்குழந்தைகளும் மென்மையான, நிபந்தனையற்ற அன்பின் புதிய மையமாகிறார்கள். படைப்பு வேலை இன்னும் தொடர்ந்தால், முழுமையான எளிமையின் தரத்தை எடுத்துக்கொள்கிறது — ஒற்றை ராகம், சிறு கவிதை, கவனமாகச் செய்த ஒரு பொருள் — முந்தைய சிக்கல்கள் தர முடியாத அனைத்தையும் அது கொண்டிருக்கிறது.",
        navigate: "உடல் சார்பு அதிகரிக்கிறது; வாழ்நாள் முழுவதும் மற்றவர்களுக்கு மிருகசீரிட ஜாதகர் காட்டிய அதே கருணையுடன் அதை ஏற்க வேண்டும். முந்தைய தசகங்களை வகைப்படுத்திய அமைதியின்மை கேது தசையில் பொதுவாக அடங்குகிறது — அடங்காவிட்டால், ஆன்மீகப் பயிற்சியை ஆழப்படுத்த வேண்டும் என்பதற்கான அறிகுறி அது. முன்னோர் உலகங்களுடனான கேதுவின் தொடர்பால் கனவுகள், ஆன்மீக உள்ளுணர்வுகள், நுட்பமான இருப்புகள் பற்றிய உணர்வு தீவிரமடையலாம்.",
        focus: "விநாயகர் வழிபாடு, கேது சன்னதி வழிபாடு; பித்ரு தர்ப்பணமும் கருப்பு எள் அர்ப்பணங்களும் முன்னோர் கடமைகளை நிறைவு செய்கின்றன. தினசரி தியானம் அல்லது சிறிது நேர அமைதியான அமர்வு கேது தசையின் நுட்பமான சக்தியை தரையிறக்குகிறது. மென்மையான பிரபஞ்ச விசாரணையின் தொனியுடைய பிருஹதாரண்யக அல்லது ஐதரேய உபநிடதம் இந்த காலத்துக்கு மிகப் பொருத்தமான வேதத் துணை.",
      },
      {
        expect: "மிகமிக முதிர்ந்த வயதில் மட்டுமே தொடங்கும் சுக்கிர தசை ரிஷப பாத (முதல், இரண்டாம் பாதம்) மிருகசீரிட ஜாதகர்களுக்கு ராசி அதிபதியின் வருகை. சுக்கிரன் உங்கள் ராசியான ரிஷபத்தின் அதிபதி — இது இந்த ஜாதகர்களுக்கு இரட்டை வலிமையுடன் வருகிறது. மற்ற நட்சத்திரங்கள் சுக்கிர தசையை பல கிரக காலங்களில் ஒன்றாக அனுபவிக்கும்போது, ரிஷப மிருகசீரிடத்திற்கு இது வாழ்வின் இறுதி அத்தியாயத்தில் ராசி அதிபதியே வருவது. அழகு, அருள், புலன்களின் இன்பங்கள் — முன்பை விட ஆழமாகக் கேட்கும் இசை, மலர்களின் வாசம், குடும்பத்தின் அரவணைப்பு — தங்கள் மிகவும் சாரமான தரத்தை எடுத்துக்கொள்கின்றன. ஒரு வாழ்நாள் முழுவதும் பகிர்ந்த சுக்கிரனின் படைப்பு, அழகியல் கொடைகளை சிறிய அளவில் பிரதிபலிக்கும் நுட்பமான செழிப்பில் அந்த நபர் வாழ்கிறார்.",
        navigate: "இந்த மிக முதிர்ந்த வயதில், உடல் பராமரிப்பு முழுமையானதும் எளிமையானதும்: அரவணைப்பு, மென்மையான ஊட்டம், அருகிலுள்ள சூழலில் அழகு, நிலையான துணை. ஜாதகத்தில் சுக்கிரன் வலுவாக இருந்தால், மனம் வியக்கத்தக்க விழிப்புடனும் அழகுணர்வுடனும் இருக்கலாம். கடுமையான புலன் அனுபவங்களையும் உணர்வுக் குலைவையும் தவிருங்கள்.",
        focus: "வெள்ளிக்கிழமை அன்னை லட்சுமி வழிபாடு, ரோஜா மற்றும் மல்லிகை அர்ப்பணம், நபரை இசை, மலர்கள், அன்பானவர்களின் இருப்புடன் சூழ்வது — மிகவும் பொருத்தமான பராமரிப்பு. அழகை தேடி கண்டுபிடித்த வாழ்க்கை அழகின் ஆதாரத்திலேயே வந்து முடிகிறது.",
      },
      {
        expect: "இந்த வரிசையின் கடைசி தசையான சூரிய தசையை நடைமுறையில் யாரும் அடைவதில்லை. இந்த அரிய ஆத்மாக்களுக்கு, சூரியன் தன் இறுதி கொடையை கொண்டு வருகிறது — முழுமையான அடையாளத் தெளிவு, தேடல் தேவையில்லாத நிலையான ஒளி; ஏனென்றால் அவரே ஒளியாகிவிட்டார். தேடிய மான் நீரில் தெரியும் நிலவின் பிரதிபலிப்பில் கலந்துவிட்டது.",
        navigate: "இந்த வயதில் உடல் பராமரிப்பு முழுமையான மற்றும் மென்மையானது. உடலின் தேவைகள் குறைவான மற்றும் குறிப்பிட்டவை. அரவணைப்பு, ஒளி, பரிச்சயமான ஒலிகள் எல்லாமே.",
        focus: "ஞாயிற்றுக்கிழமை சூரிய வழிபாடு, ஆதித்ய ஹ்ருதயம், உதய சூரியனுக்கு விளக்கின் ஒளி வழங்குவது — வாழ்வின் கடைசி பக்தி சைகைகள். நிலைத்தன்மை கொண்ட, அமைதியான, ஒளியில் சூழப்பட்ட நிறைவு சோமனின் மென்மையான நட்சத்திரத்தின் இறுதி கொடை.",
      },
    ],
    spirituality: [
      { title: "சோம & சந்திர வழிபாடு",   desc: "மிருகசீரிடத்தின் தலைமை தெய்வம் சோமன் (சந்திர தெய்வம்) — திங்கட்கிழமை வழிபாடு, நிலா நேர வேண்டுதல்கள், நீர் நிலைகளுக்கு மரியாதை மிகவும் இயல்பான ஆன்மீக நடைமுறைகள்." },
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
  return <NatchathiramVisualContent data={MRIGASHIRA} visual={MRIGASHIRA_VISUAL} timings={dasaTimingsFor(MRIGASHIRA.number)} />;
}
