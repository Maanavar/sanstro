import type { Metadata } from "next";
import { withTamilTwin } from "@/lib/localized-metadata";
import { withDasaTimingHold } from "@/lib/natchathiram-dasa-hold";
import { dasaTimingsFor } from "@/lib/natchathiram-dasa-timings";
import { nakshatraDisplayName } from "@/lib/nakshatra-display-name";
import { natchathiramVisualTa } from "@/lib/marketing-seo-ta";
import { AVITTAM } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

const EN_METADATA: Metadata = {
  title: `${nakshatraDisplayName(AVITTAM.number, "en")} — Visual Profile`,
  description: "Visual profile of Avittam Nakshathiram: personality traits, career strengths, dasa timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/dhanishtha/visual" },
  openGraph: {
    title: `${nakshatraDisplayName(AVITTAM.number, "en")} — Visual Profile`,
    description: "Visual profile of Avittam Nakshathiram: personality traits, career strengths, dasa timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/dhanishtha/visual",
    type: "article",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withDasaTimingHold(await withTamilTwin(EN_METADATA, "/natchathiram/dhanishtha/visual", natchathiramVisualTa("dhanishtha")!), "dhanishtha");
}

const DHANISHTHA_VISUAL: NatchathiramVisualData = {
  atAGlance: [
    { label: "Wealth & Abundance",        score: 97 },
    { label: "Rhythmic Intelligence",     score: 98 },
    { label: "Mars-Powered Drive",        score: 96 },
    { label: "Musical & Arts Mastery",    score: 97 },
    { label: "Saturn's Structural Depth", score: 95 },
  ],

  radar: {
    labels: ["Wealth", "Rhythm", "Drive", "Music", "Structure", "Generosity"],
    values: [97, 98, 96, 97, 95, 93],
  },

  coreStrengths: [
    { symbol: "◎", label: "Wealth & Abundance",        score: 97, desc: "Dhanishtha means 'the most wealthy' or 'the richest star' — and this wealth is not only financial but includes the abundance of rhythm, sound, vitality, and generous sharing that the Ashta Vasus (the eight wealth-gods) bestow." },
    { symbol: "◈", label: "Rhythmic Intelligence",     score: 98, desc: "The nakshathiram of the drum (Mridangam) and the Ashta Vasus — Dhanishtha carries an intelligence that is fundamentally rhythmic: the capacity to perceive, inhabit, and create within the patterns and pulses of natural cycles, music, and time." },
    { symbol: "⚡", label: "Mars-Powered Drive",        score: 96, desc: "Mars's ruling energy gives Dhanishtha an unusual combination of the warrior's drive and the musician's sensitivity — the directed force that can build, compete, and achieve, joined to the receptive attunement that makes great music and great generosity possible." },
    { symbol: "♥", label: "Musical & Arts Mastery",    score: 97, desc: "The Ashta Vasus' gift of rhythm and sound — Dhanishtha's aesthetic intelligence is specifically rhythmic. Percussion, dance, the physical arts, and any domain where timing is the central intelligence find their finest expression in Dhanishtha." },
    { symbol: "△", label: "Saturn's Structural Depth", score: 95, desc: "Both Makara (padas 1-2) and Kumbha (padas 3-4) are Saturn-ruled rasis — and Saturn's structural patience and long-game discipline are available to Dhanishtha as the framework within which the rhythmic abundance operates." },
    { symbol: "☽", label: "Generous Sharing",          score: 93, desc: "The most wealthy star shares its wealth. Dhanishtha's natural generosity — the impulse to give what has been received, to share the abundance, to bring others into the rhythm — is the social expression of the Ashta Vasus' gift." },
  ],

  careerAbilities: [
    { label: "Music, Percussion & Rhythm Arts", score: 98 },
    { label: "Wealth Creation & Finance",        score: 97 },
    { label: "Physical Arts & Dance",            score: 96 },
    { label: "Engineering & Technical Mastery",  score: 95 },
    { label: "Medical Sciences & Vitality",      score: 94 },
  ],
  careerNote: "Dhanishtha excels wherever rhythm, timing, abundance, and the combination of Mars-powered drive and Saturn-structured patience are the central requirements. They are the musicians, wealth builders, engineers, and physical arts masters who create abundance through the disciplined inhabiting of natural cycles and patterns.",

  careerClusters: [
    { symbol: "◎", title: "Classical Music & Percussion Arts", desc: "Mridangam, tabla, all rhythm-based classical arts — the Ashta Vasus' most direct domain. Dhanishtha's rhythmic intelligence applied to the highest musical traditions." },
    { symbol: "◈", title: "Finance, Investment & Wealth Creation", desc: "Wealth management, investment, financial engineering — the 'most wealthy star' applied to the professional domain of abundance creation." },
    { symbol: "⚡", title: "Dance & Physical Arts",              desc: "Classical dance (particularly Bharatanatyam), physical performance arts, movement-based expression — the rhythmic body intelligence of Dhanishtha." },
    { symbol: "♥", title: "Engineering & Technical Precision",  desc: "Civil, mechanical, and electrical engineering — Saturn's structural patience and Mars's directed energy producing precise, long-lasting work." },
    { symbol: "△", title: "Medical Sciences & Vitality",       desc: "Medicine (particularly sports medicine, physical rehabilitation, rhythmic body systems) — the Ashta Vasus' domain of physical vitality joined to Saturn's structural precision." },
    { symbol: "☽", title: "Military & Protective Service",     desc: "Military leadership, protective service, the physical disciplines of security — Mars's warrior energy structured by Saturn's long-game patience." },
  ],

  modernApps: [
    { symbol: "◎", title: "Music Technology & Rhythm Intelligence", desc: "Percussion and rhythm-based music technology, AI-powered rhythm analysis, classical music platforms." },
    { symbol: "◈", title: "Financial Technology & Wealth Platforms", desc: "Fintech, investment platforms, algorithmic trading — the most wealthy star's domain in digital financial architecture." },
    { symbol: "⚡", title: "Movement & Physical Arts Technology",    desc: "Dance technology platforms, movement analysis tools, physical performance technology." },
    { symbol: "♥", title: "Engineering & Precision Technology",     desc: "Precision engineering platforms, structural analysis tools, long-duration technical project management." },
    { symbol: "△", title: "Sports Medicine & Vitality Technology",  desc: "Sports medicine technology, physical rehabilitation platforms, vitality and rhythmic body system applications." },
    { symbol: "☽", title: "Security & Protective Technology",       desc: "Security intelligence platforms, military technology applications, protective service tools." },
  ],

  dashaTimeline: [
    {
      planet: "Mars", theme: "Born to the Drummer's Fire",
      detail: {
        expect: "Dhanishtha opens in Mars dasa — a beginning of unusual vitality, physical energy, and the kind of bold presence that the combination of Mars and the Ashta Vasus produces. The Dhanishtha child is physically alive in a particular way: the body is responsive, rhythmic, and energetic. The early years often show unusual physical coordination — a child who takes to music, rhythm, or physical movement with a naturalness that surprises. The family environment's relationship to music, physical vitality, and abundance is formative in Mars's opening. The Mars–Saturn bhukti (the table below gives when it begins and how long it lasts) is a notable rasi lord flag: even in early childhood, the structural discipline and patient long game that Saturn represents makes a brief appearance. Dhanishtha is born inside this dasa, so only the balance remaining at birth is lived; the pada decides how much, and the range shown for this dasa gives it.",
        navigate: "Mars's primary challenge for the young Dhanishtha is the directed force finding appropriate expression — the physically energetic, rhythmically alive child needs channels for the Mars vitality that are constructive rather than disruptive. The Mars–Saturn bhukti is a rasi lord flag: a brief but memorable early encounter with the patience and structure that will govern Saturn's own dasa later in life.",
        focus: "Tuesday Mars shrine prayers and the early provision of physical outlets, musical instruments, and rhythmic activities that match the Dhanishtha child's natural vitality. Mridangam or tabla exposure in early childhood, if available, can establish the life's central artistic intelligence in Mars's opening window.",
      },
    },
    {
      planet: "Rahu", theme: "The Expanding World",
      detail: {
        expect: "Rahu dasa brings the great expansion of Dhanishtha's rhythmic and abundant nature into the broader world; it carries Dhanishtha through school and adolescence and, for the longer balances, into the college years. The school years see the rhythmic intelligence engaging with formal education — the Dhanishtha student finds the subjects that have pattern, rhythm, and structural elegance more naturally than those that require purely verbal or abstract reasoning. The musical or physical arts training that began in Mars dasa deepens significantly in Rahu's first half. Higher education brings the first professional-level engagements with the Dhanishtha domain — serious music study, engineering or finance education, or physical arts training at a competitive level. The Rahu–Saturn bhukti (the table below gives when it begins and how long it lasts) is a significant rasi lord flag.",
        navigate: "Rahu's primary challenge for Dhanishtha is the expansion of the rhythmic abundance instinct beyond what the discipline can yet contain — the young person whose natural wealth-creating and rhythm-inhabiting capacity runs ahead of the Saturn-structured patience that will eventually govern it with full mastery. The Rahu–Saturn bhukti is a rasi lord flag: a significant encounter with the patient, structured discipline that defines the Dhanishtha mature period.",
        focus: "Saturday Rahu shrine prayers and the deliberate cultivation of structured practice disciplines — the musician who practices with a metronome, the finance professional who studies the fundamentals, the engineer who masters the mathematics. The Rahu–Saturn bhukti (the bhukti table below gives when it begins and how long it lasts) is a rasi lord flag: a period of significant structural encounter, disciplined expansion, or the first serious experience of Saturn's long-game requirements.",
      },
    },
    {
      planet: "Jupiter", theme: "The Philosophical Foundation",
      detail: {
        expect: "Jupiter dasa, in early adult life and mid-life, brings philosophical breadth, wisdom, and the expansive generosity of the teacher-philosopher to Dhanishtha's rhythmic and driven nature. The professional foundations established in Rahu dasa are now deepened with Jupiter's wisdom and expanded with Jupiter's range. Marriage and family formation, where they fall in this dasa, are read from Jupiter, Venus and the seventh house of the horoscope rather than from one fixed bhukti. The wealth-creating intelligence of Dhanishtha finds in Jupiter dasa the philosophical framework — the understanding of why abundance is generated and how it serves the whole — that makes the wealth not merely accumulation but genuine generosity. The Jupiter–Saturn bhukti (the table below gives when it begins and how long it lasts) is a significant rasi lord flag.",
        navigate: "Jupiter's primary challenge for Dhanishtha is the philosophical over-extension — the rhythmically intelligent, wealth-generating person who, in Jupiter's expansion, begins to believe that the abundance will always flow without the Saturnine discipline that actually sustains it. The Jupiter–Saturn bhukti is a rasi lord flag: a period of structural testing and the decisive encounter with the patient discipline that will govern the rasi lord dasa.",
        focus: "Thursday Brihaspati worship and the deliberate cultivation of philosophical depth alongside the rhythmic and wealth-generating intelligence. The Jupiter–Saturn bhukti (the bhukti table below gives when it begins and how long it lasts) is a major rasi lord flag: Saturn arrives in Jupiter's expansive field as a structuring, disciplining force that prepares Dhanishtha for the rasi lord's own dasa that follows.",
      },
    },
    {
      planet: "Saturn", theme: "Rasi Lord — The Wealth Master",
      detail: {
        expect: "Saturn dasa, running through mid-life into the later working years, is the rasi lord's arrival for Dhanishtha — Saturn is the lord of both Makara (first and second pada) and Kumbha (third and fourth pada), making every Dhanishtha native a Saturn-rasi person, and making this long dasa uniquely charged for all Dhanishtha. The rhythmic intelligence, Mars-powered drive, and Ashta Vasus' wealth instinct that have been developing since the life's opening now receive the full structural governance of the rasi lord's own dasa. Wealth creation peaks: the patient, structured, long-game approach that Saturn demands, applied to the abundance instinct that the Ashta Vasus gave, produces the most reliable and significant financial results of the entire life. The musical or artistic mastery, if cultivated since Mars's opening, reaches its fullest expression — the seasoned performer, the established master, the artist who has practised long enough that the Saturn discipline and the Ashta Vasus' rhythm have become one.",
        navigate: "Saturn's primary challenge in the rasi lord dasa is the rigidity of the structural master — the patient long-game person who has correctly identified the right approach beginning to insist that only their approach is right. The 'most wealthy star' shares its wealth; the Saturn rasi lord's governance requires that the wealth — financial, musical, vitality-based — be genuinely shared rather than hoarded. Physical care is important across this long dasa: the body's rhythmic systems, the cardiovascular function, and the musculoskeletal structure all require consistent attention.",
        focus: "Saturday Saturn worship, Shani puja, and deliberate practices of generous sharing — the acknowledgement that the Ashta Vasus gave wealth to be distributed, not accumulated. The Saturn rasi lord's long dasa is best expressed as the elder master who teaches, the established musician who transmits the rhythm to the next generation, and the wealth creator who ensures the abundance serves the community.",
      },
    },
    {
      planet: "Mercury", theme: "The Articulate Master",
      detail: {
        expect: "Mercury dasa, in the later years, brings the mind's precision and articulateness to Dhanishtha's already rhythmically and structurally mature character. The rhythmic intelligence — which has always been primarily non-verbal, bodily, and musical — now finds in Mercury the capacity for precise articulation: the elder musician who can explain the rhythm they inhabit, the experienced engineer who can teach the principles they have practised, the wealth master who can transmit the understanding behind the abundance creation. Teaching, writing, and the verbal transmission of what has been mastered through Mars, Rahu, Jupiter, and Saturn become the primary professional expressions.",
        navigate: "Mercury's pace can challenge the Saturn-governed patience of the mature Dhanishtha — the fast-moving analytical mind meeting the slow and deliberate rhythmic wisdom. Physical care and energy management are important. The Mercury–Saturn bhukti (the table below gives when it begins and how long it lasts) is a brief but notable rasi lord sub-period.",
        focus: "Wednesday Mercury worship and the active practice of teaching and articulating the accumulated rhythmic and structural mastery. The most wealthy star shares its knowledge as readily as its wealth.",
      },
    },
    {
      planet: "Ketu", theme: "The Rhythm Without Form",
      detail: {
        expect: "Ketu dasa, in advanced age, brings the great simplification of Dhanishtha's richly rhythmic and abundant life. The rhythmic intelligence — which has been expressed through music, through wealth creation, through physical vitality, through structural mastery — now returns to its source in the rhythm that needs no particular form: the pulse that is present before any specific beat is struck.",
        navigate: "Complete and gentle physical care. Ketu at this age is the invitation to rest in the rhythm rather than play it — the deep listening that underlies all the Dhanishtha expression across a lifetime.",
        focus: "Pitru tharpanam and ancestral rites. The Ashta Vasus' child returns to the silence from which all rhythm emerges.",
      },
    },
    {
      planet: "Venus", theme: "The Beauty of Abundance",
      detail: {
        expect: "Venus dasa, beginning only in very advanced age, is reached by very few Dhanishtha souls. For those who arrive, Venus brings the final gift of beauty — the aesthetic grace and luminous warmth that make a very long life's fullness visible to those who are present with the elder.",
        navigate: "Complete and devoted physical care. Venus at this extreme age is the abundance of the 'most wealthy star' arriving in its most distilled form — not financial wealth but the wealth of presence.",
        focus: "The Ashta Vasus gave wealth. Venus reveals that the deepest wealth is the quality of beauty in a human life fully lived — the rhythm that was heard from the first beat to the last.",
      },
    },
    {
      planet: "Sun", theme: "Final Solar Clarity",
      detail: {
        expect: "Sun dasa, the last in this sequence, is reached only by extraordinarily few Dhanishtha souls — among the longest-lived of all nakshathirams. For those who arrive, Sun brings the final solar clarity, the authority that distils a lifetime of rhythmic mastery into simple, luminous presence.",
        navigate: "Complete and devoted physical care at this extreme age.",
        focus: "The solar authority of the 'most wealthy star' elder — the presence that illuminates without effort, that gives without holding, that completes the great rhythm begun in Mars's opening fire.",
      },
    },
  ],

  spirituality: [
    {
      title: "Ashta Vasus Worship & Wealth Traditions",
      desc: "The Ashta Vasus — the eight wealth-gods who govern the material abundance and rhythmic vitality of the natural world — are Dhanishtha's presiding deities. Their worship through Vedic rituals, the offering of rhythm (drum beats, music) as devotional acts, and the practice of genuine generosity (dana) as the spiritual expression of what the Vasus gave are Dhanishtha's deepest spiritual expressions.",
    },
    {
      title: "Saturn & Shiva Devotion",
      desc: "Saturn — the rasi lord of both Makara and Kumbha — is Dhanishtha's governing planet. Saturday Shani puja, Shiva worship (Saturn and Shiva share the quality of discipline and dissolution), and the practice of patient, long-game devotion are the primary spiritual structures of Dhanishtha's life.",
    },
    {
      title: "Music as Spiritual Practice",
      desc: "For Dhanishtha, the making and receiving of music — particularly rhythmic, percussive, classical music — is not separate from spiritual practice but is its highest form. The drum is the instrument of Shiva; the rhythm is the pulse of the cosmos; the musician who inhabits it devotionally is engaged in the most authentic form of Dhanishtha worship.",
    },
  ],

  guidance: "The most wealthy star does not hoard its wealth — it distributes it. The rhythm you carry is not yours; it was given to you by the eight gods of abundance, and its nature is to be shared. The drum's sound is most beautiful when it is given to the room, not kept in the hands. Play your rhythm generously — in your music, in your wealth, in your vitality, in your time — and the Ashta Vasus' promise is that what is given returns, amplified, in the natural cycle of abundance. The discipline that Saturn requires is not the opposite of the rhythm — it is the structure that makes the rhythm sustainable across a long life.",

  compatibleEn: ["Thiruvonam", "Rohini", "Uthiradam", "Anusham", "Aswini"],
  compatibleNote: "These nakshatras complement Dhanishtha's rhythmic wealth, Mars-powered drive, and generous abundance with listening depth, devotion, and structured resonance.",

  ta: {
    atAGlanceLabels: ["செல்வம் & செழிப்பு", "தாளக் கும்ணம்", "செவ்வாய்-சக்தி உந்துதல்", "இசை & கலை தேர்ச்சி", "சனியின் கட்டமைப்பு ஆழம்"],
    radarLabels: ["செல்வம்", "தாளம்", "உந்துதல்", "இசை", "கட்டமைப்பு", "தாராளம்"],
    coreStrengths: [
      { label: "செல்வம் & செழிப்பு",         desc: "அவிட்டம் என்றால் 'மிகவும் செல்வமான' அல்லது 'செல்வந்தான நட்சத்திரம்' — இந்த செல்வம் நிதியளவில் மட்டுமல்ல ஆனால் அஷ்ட வசுக்கள் (எட்டு செல்வக் கடவுள்கள்) கொடுக்கும் தாளம், ஒலி, உயிர்சக்தி, தாராள பகிர்வு ஆகியவற்றின் செழிப்பை உள்ளடக்கியது." },
      { label: "தாளக் கும்ணம்",              desc: "மிருதங்கம் மற்றும் அஷ்ட வசுக்களின் நட்சத்திரம் — அவிட்டம் அடிப்படையில் தாளமான நுண்ணறிவை சுமக்கிறது: இயற்கை சுழல்கள், இசை மற்றும் காலத்தின் வடிவங்கள் மற்றும் துடிப்புகளில் கண்காணிக்கும், வசிக்கும் மற்றும் படைக்கும் திறன்." },
      { label: "செவ்வாய்-சக்தி உந்துதல்",   desc: "செவ்வாயின் ஆளும் ஆற்றல் அவிட்டத்திற்கு போர்வீரனின் உந்துதல் மற்றும் இசைக்கலைஞரின் உணர்திறன் ஆகியவற்றின் அசாதாரண கலவையை கொடுக்கிறது." },
      { label: "இசை & கலை தேர்ச்சி",        desc: "அஷ்ட வசுக்களின் தாளம் மற்றும் ஒலியின் கொடை — அவிட்டத்தின் அழகியல் நுண்ணறிவு குறிப்பாக தாளமானது. தாளவாத்தியம், நடனம், உடல் கலைகள் மிகச் சிறந்த வெளிப்பாட்டை காண்கின்றன." },
      { label: "சனியின் கட்டமைப்பு ஆழம்",   desc: "மகர (பாதங்கள் 1-2) மற்றும் கும்ப (பாதங்கள் 3-4) இரண்டும் சனி-ஆளும் ராசிகள் — சனியின் கட்டமைப்பு பொறுமை மற்றும் நீண்ட-விளையாட்டு ஒழுக்கம் தாள செழிப்பு செயல்படும் கட்டமைப்பாக கிடைக்கிறது." },
      { label: "தாராள பகிர்வு",              desc: "மிகவும் செல்வமான நட்சத்திரம் தன் செல்வத்தை பகிர்கிறது. அவிட்டத்தின் இயற்கையான தாராளம் — கிடைத்ததை கொடுக்கும், செழிப்பை பகிரும், மற்றவர்களை தாளத்தில் கொண்டு வரும் உந்துவிசை — அஷ்ட வசுக்களின் கொடையின் சமூக வெளிப்பாடு." },
    ],
    careerAbilityLabels: ["இசை, தாளவாத்தியம் & தாளக் கலைகள்", "செல்வம் உருவாக்கல் & நிதி", "உடல் கலைகள் & நடனம்", "பொறியியல் & தொழில்நுட்ப தேர்ச்சி", "மருத்துவ அறிவியல்கள் & உயிர்சக்தி"],
    careerClusters: [
      { title: "பாரம்பரிய இசை & தாளவாத்தியம்",   desc: "மிருதங்கம், தபேலா, அனைத்து தாளம் அடிப்படையிலான பாரம்பரிய கலைகள் — அஷ்ட வசுக்களின் மிகவும் நேரடியான தளம்." },
      { title: "நிதி, முதலீடு & செல்வம் உருவாக்கல்", desc: "செல்வ மேலாண்மை, முதலீடு, நிதி பொறியியல் — தொழில்முறை செழிப்பு உருவாக்கல் தளத்தில் பயன்படுத்தப்படும் 'மிகவும் செல்வமான நட்சத்திரம்'." },
      { title: "நடனம் & உடல் கலைகள்",             desc: "பரதநாட்டியம் உட்பட பாரம்பரிய நடனம், உடல் இயக்க கலைகள் — அவிட்டத்தின் தாளமான உடல் நுண்ணறிவு." },
      { title: "பொறியியல் & தொழில்நுட்ப துல்லியம்", desc: "சிவில், மெக்கானிக்கல், மற்றும் எலக்ட்ரிக்கல் பொறியியல் — சனியின் கட்டமைப்பு பொறுமை மற்றும் செவ்வாயின் திசைப்பட்ட ஆற்றல்." },
      { title: "மருத்துவ அறிவியல்கள் & உயிர்சக்தி", desc: "மருத்துவம் (குறிப்பாக விளையாட்டு மருத்துவம், உடல் மறுவாழ்வு, தாளமான உடல் அமைப்புகள்)." },
      { title: "இராணுவம் & பாதுகாப்பு சேவை",      desc: "இராணுவ தலைமை, பாதுகாப்பு சேவை, பாதுகாப்பு உடல் ஒழுக்கங்கள் — சனியின் நீண்ட-விளையாட்டு பொறுமையால் கட்டமைக்கப்பட்ட செவ்வாயின் போர்வீர ஆற்றல்." },
    ],
    modernApps: [
      { title: "இசை தொழில்நுட்பம் & தாள நுண்ணறிவு",    desc: "தாளவாத்தியம் மற்றும் தாளம் அடிப்படையிலான இசை தொழில்நுட்பம், AI-சக்தி வாய்ந்த தாள பகுப்பாய்வு, பாரம்பரிய இசை தளங்கள்." },
      { title: "நிதி தொழில்நுட்பம் & செல்வம் தளங்கள்",   desc: "Fintech, முதலீடு தளங்கள், நிரல்பட வர்த்தகம் — டிஜிட்டல் நிதி கட்டிடக்கலையில் மிகவும் செல்வமான நட்சத்திரத்தின் தளம்." },
      { title: "இயக்கம் & உடல் கலைகள் தொழில்நுட்பம்",   desc: "நடனம் தொழில்நுட்பம் தளங்கள், இயக்கம் பகுப்பாய்வு கருவிகள், உடல் செயல்திறன் தொழில்நுட்பம்." },
      { title: "பொறியியல் & துல்லிய தொழில்நுட்பம்",      desc: "துல்லிய பொறியியல் தளங்கள், கட்டமைப்பு பகுப்பாய்வு கருவிகள், நீண்ட-கால தொழில்நுட்ப திட்ட மேலாண்மை." },
      { title: "விளையாட்டு மருத்துவம் & உயிர்சக்தி தொழில்நுட்பம்", desc: "விளையாட்டு மருத்துவம் தொழில்நுட்பம், உடல் மறுவாழ்வு தளங்கள், உயிர்சக்தி மற்றும் தாளமான உடல் அமைப்பு பயன்பாடுகள்." },
      { title: "பாதுகாப்பு & காப்பு தொழில்நுட்பம்",      desc: "பாதுகாப்பு நுண்ணறிவு தளங்கள், இராணுவ தொழில்நுட்பம் பயன்பாடுகள், காப்பு சேவை கருவிகள்." },
    ],
    dashaThemes: [
      "மேளக்காரனின் நெருப்புடன் பிறப்பு — செவ்வாய் ஆரம்பம், தாள உயிர்சக்தி",
      "விரிவடையும் உலகு — ராகு கல்வி, இசை ஆழப்படுத்தல்",
      "தத்துவ அடித்தளம் — குரு ஞானம், செழிப்பு சட்டகம்",
      "ராசி அதிபதி — செல்வத் தேர்ச்சி — சனி தசை மகர/கும்ப ராசிக்கு",
      "தெளிவாக வெளிப்படுத்தும் குருநாதர் — புதன் கற்பித்தல், மரபு பரிமாற்றம்",
      "வடிவமில்லா தாளம் — கேது ஆழ எளிமை",
      "செழிப்பின் அழகு — சுக்கிர இறுதி நிறைவு",
      "இறுதி சூரிய தெளிவு — சூரியன் முடிவு",
    ],
    dashaDetails: [
      {
        expect: "அவிட்டம் செவ்வாய் தசையில் தொடங்குகிறது — அசாதாரண உயிர்சக்தி, உடல் ஆற்றல், செவ்வாயும் அஷ்ட வசுக்களும் சேரும்போது உருவாகும் துணிவான இருப்பு ஆகியவற்றின் தொடக்கம். அவிட்டக் குழந்தை ஒரு தனி விதத்தில் உடலால் உயிர்ப்புடன் இருக்கிறது: உடல் துலங்குவதாகவும், தாளமுள்ளதாகவும், சுறுசுறுப்பாகவும் இருக்கிறது. ஆரம்ப ஆண்டுகளில் அசாதாரண உடல் ஒருங்கிணைப்பு பெரும்பாலும் தெரியும் — இசை, தாளம் அல்லது உடல் இயக்கத்தை வியக்கும் இயல்புடன் எடுத்துக்கொள்ளும் குழந்தை. இசை, உடல் வலிமை, செழிப்புடனான குடும்பச் சூழலின் உறவு செவ்வாயின் தொடக்கத்தில் வடிவமைக்கும் தன்மை கொண்டது. செவ்வாய்–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு குறிப்பிடத்தக்க ராசி அதிபதி அடையாளம்: ஆரம்பக் குழந்தைப் பருவத்திலும் சனி குறிக்கும் கட்டமைப்பு ஒழுக்கமும் பொறுமையான நீண்டகாலப் பார்வையும் சிறிது தலைகாட்டுகின்றன. அவிட்டம் இந்த தசையின் நடுவிலேயே பிறப்பதால், பிறக்கும்போது மீதமுள்ள இருப்பு மட்டுமே வாழப்படுகிறது; அது பாதத்தைப் பொறுத்தது — இந்த தசைக்குக் காட்டப்படும் வரம்பு அதைச் சொல்கிறது.",
        navigate: "இளம் அவிட்டத்திற்கு செவ்வாயின் முதன்மைச் சவால், திசைப்பட்ட வலிமை பொருத்தமான வெளிப்பாட்டைக் காண்பது — உடல் ஆற்றல் மிக்க, தாளத்தில் துடிப்புள்ள குழந்தைக்கு செவ்வாய் உயிர்ச்சக்தி குலைப்பதாக அல்லாமல் ஆக்கபூர்வமாகப் பாய வழிகள் தேவை. செவ்வாய்–சனி புக்தி ஒரு ராசி அதிபதி அடையாளம்: பிற்கால வாழ்வில் சனியின் சொந்த தசையை நிர்வகிக்கப்போகும் பொறுமை, கட்டமைப்புடன் சுருக்கமான ஆனால் மறக்க முடியாத ஆரம்பகாலச் சந்திப்பு.",
        focus: "செவ்வாய்க்கிழமை செவ்வாய் சன்னதி வழிபாடு. இளம் அவிட்டத்திற்கு மிருதங்கம் அல்லது தபேலா வெளிப்பாடு, இசை கருவிகள் மற்றும் தாள நடவடிக்கைகள் வழங்கவும்.",
      },
      {
        expect: "ராகு தசை அவிட்டத்தின் தாளமான, செழிப்பான இயல்பை பரந்த உலகிற்கு விரிவாக்குகிறது; பள்ளி, வளரிளம் பருவம் வழியாகவும், நீண்ட இருப்பில் கல்லூரி ஆண்டுகள் வரையிலும் அழைத்துச் செல்கிறது. பள்ளி ஆண்டுகளில் தாள நுண்ணறிவு முறையான கல்வியுடன் ஈடுபடுகிறது — முற்றிலும் மொழி சார்ந்த அல்லது அருவச் சிந்தனை தேவைப்படும் பாடங்களை விட, வடிவம், தாளம், கட்டமைப்பு நேர்த்தி உள்ள பாடங்களை அவிட்ட மாணவர் இயல்பாகக் கண்டுகொள்கிறார். செவ்வாய் தசையில் தொடங்கிய இசை அல்லது உடல் கலைப் பயிற்சி ராகுவின் முதல் பாதியில் கணிசமாக ஆழமடைகிறது. உயர் கல்வி அவிட்டத்தின் துறையில் முதல் தொழில்முறை ஈடுபாடுகளைக் கொண்டுவருகிறது — தீவிர இசைப் படிப்பு, பொறியியல் அல்லது நிதிக் கல்வி, அல்லது போட்டி நிலை உடல் கலைப் பயிற்சி. ராகு–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு முக்கியமான ராசி அதிபதி அடையாளம்.",
        navigate: "அவிட்டத்திற்கு ராகுவின் முதன்மைச் சவால், தாளமான செழிப்பு உள்ளுணர்வு ஒழுக்கம் இன்னும் தாங்கக்கூடிய அளவுக்கு அப்பால் விரிவடைவது — செல்வம் உருவாக்கும், தாளத்தில் வாழும் இயல்பான திறன், இறுதியில் அதை முழுத் தேர்ச்சியுடன் ஆளப்போகும் சனியின் கட்டமைக்கப்பட்ட பொறுமையை முந்திச் செல்லும் இளையவர். ராகு–சனி புக்தி ஒரு ராசி அதிபதி அடையாளம்: அவிட்டத்தின் முதிர்ந்த காலத்தை வரையறுக்கும் பொறுமையான, கட்டமைக்கப்பட்ட ஒழுக்கத்துடன் ஒரு முக்கியமான சந்திப்பு.",
        focus: "சனிக்கிழமை ராகு சன்னதி வழிபாடும், கட்டமைக்கப்பட்ட பயிற்சி ஒழுக்கங்களை வேண்டுமென்றே வளர்ப்பதும் — மெட்ரோனோமுடன் பயிலும் இசைக்கலைஞர், அடிப்படைகளைப் படிக்கும் நிதி நிபுணர், கணிதத்தில் தேர்ச்சி பெறும் பொறியாளர். ராகு–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு ராசி அதிபதி அடையாளம்: குறிப்பிடத்தக்க கட்டமைப்புச் சந்திப்பு, ஒழுக்கமான விரிவாக்கம், அல்லது சனியின் நீண்டகாலத் தேவைகளின் முதல் தீவிர அனுபவத்தின் காலம்.",
      },
      {
        expect: "இளம் வயது வந்த காலத்திலும் நடுவயதிலும் வரும் குரு தசை அவிட்டத்தின் தாளமான, உந்தப்பட்ட இயல்புக்கு தத்துவ அகலம், ஞானம், ஆசிரியர்-தத்துவஞானியின் விரிந்த தாராளம் ஆகியவற்றைக் கொண்டுவருகிறது. ராகு தசையில் நிறுவப்பட்ட தொழில்முறை அடித்தளங்கள் இப்போது குருவின் ஞானத்தால் ஆழமாக்கப்பட்டு, குருவின் பரப்பால் விரிவடைகின்றன. திருமணமும் குடும்ப உருவாக்கமும் இந்த தசைக்குள் வருமானால், ஒரு குறிப்பிட்ட புக்தியால் அல்ல, குரு, சுக்கிரன், ஜாதகத்தின் ஏழாம் வீடு ஆகியவற்றைக் கொண்டு பார்க்கப்படுகின்றன. அவிட்டத்தின் செல்வம் உருவாக்கும் நுண்ணறிவு குரு தசையில் தத்துவச் சட்டகத்தைக் காண்கிறது — செழிப்பு ஏன் உருவாகிறது, அது முழுமைக்கு எவ்வாறு சேவை செய்கிறது என்ற புரிதல் — அது செல்வத்தை வெறும் சேர்க்கையாக அல்லாமல் உண்மையான தாராளமாக மாற்றுகிறது. குரு–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு முக்கியமான ராசி அதிபதி அடையாளம்.",
        navigate: "அவிட்டத்திற்கு குருவின் முதன்மைச் சவால் தத்துவ அதிக-விரிவாக்கம் — தாள நுண்ணறிவும் செல்வம் உருவாக்கும் திறனும் உள்ள நபர், குருவின் விரிவில், உண்மையில் செழிப்பைத் தாங்கும் சனி ஒழுக்கம் இல்லாமலேயே செழிப்பு எப்போதும் பாயும் என்று நம்பத் தொடங்குவது. குரு–சனி புக்தி ஒரு ராசி அதிபதி அடையாளம்: கட்டமைப்புச் சோதனையின் காலம், ராசி அதிபதி தசையை நிர்வகிக்கப்போகும் பொறுமையான ஒழுக்கத்துடன் தீர்மானமான சந்திப்பு.",
        focus: "வியாழக்கிழமை பிருஹஸ்பதி வழிபாடும், தாளமான, செல்வம் உருவாக்கும் நுண்ணறிவுடன் தத்துவ ஆழத்தை வேண்டுமென்றே வளர்ப்பதும். குரு–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு முக்கிய ராசி அதிபதி அடையாளம்: குருவின் விரிந்த தளத்தில் சனி கட்டமைக்கும், ஒழுங்குபடுத்தும் சக்தியாக வந்து, தொடர்ந்து வரும் ராசி அதிபதியின் சொந்த தசைக்கு அவிட்டத்தைத் தயார்படுத்துகிறது.",
      },
      {
        expect: "நடுவயதிலிருந்து பிற்கால பணி ஆண்டுகள் வரை செல்லும் சனி தசை அவிட்டத்திற்கு ராசி அதிபதியின் வருகை — சனி மகரம் (முதல், இரண்டாம் பாதம்), கும்பம் (மூன்றாம், நான்காம் பாதம்) இரண்டிற்கும் அதிபதி; ஒவ்வொரு அவிட்ட நேயரையும் சனி-ராசி நபராக்கி, இந்த நீண்ட தசையை அனைத்து அவிட்டத்திற்கும் தனிச்சிறப்புடன் வலிமையாக்குகிறது. வாழ்வின் தொடக்கத்திலிருந்து வளர்ந்து வந்த தாள நுண்ணறிவு, செவ்வாயின் உந்துதல், அஷ்ட வசுக்களின் செல்வ உள்ளுணர்வு ஆகியவை இப்போது ராசி அதிபதியின் சொந்த தசையின் முழு கட்டமைப்பு ஆட்சியைப் பெறுகின்றன. செல்வம் உருவாக்கல் உச்சமடைகிறது: சனி கோரும் பொறுமையான, கட்டமைக்கப்பட்ட, நீண்டகாலப் பார்வை, அஷ்ட வசுக்கள் தந்த செழிப்பு உள்ளுணர்வில் பயன்படுத்தப்படும்போது, முழு வாழ்விலும் மிக நம்பகமான, மிக முக்கியமான நிதி பலன்களைத் தருகிறது. செவ்வாயின் தொடக்கத்திலிருந்து வளர்க்கப்பட்டிருந்தால், இசை அல்லது கலைத் தேர்ச்சி தன் முழு வெளிப்பாட்டை அடைகிறது — சனி ஒழுக்கமும் அஷ்ட வசுக்களின் தாளமும் ஒன்றாகும் அளவுக்கு நீண்ட காலம் பயின்ற அனுபவமிக்க கலைஞர், நிறுவப்பட்ட குருநாதர்.",
        navigate: "ராசி அதிபதி தசையில் சனியின் முதன்மைச் சவால், கட்டமைப்புத் தேர்ச்சியாளரின் இறுக்கம் — சரியான அணுகுமுறையை சரியாகக் கண்டறிந்த பொறுமையான, நீண்டகாலப் பார்வை கொண்டவர், தன் அணுகுமுறையே சரி என்று வலியுறுத்தத் தொடங்குவது. 'மிகவும் செல்வமான நட்சத்திரம்' தன் செல்வத்தைப் பகிர்கிறது; சனி ராசி அதிபதியின் ஆட்சி, செல்வம் — நிதி, இசை, உயிர்ச்சக்தி சார்ந்தது — பதுக்கப்படாமல் உண்மையாகப் பகிரப்பட வேண்டும் என்று கோருகிறது. இந்த நீண்ட தசை முழுவதும் உடல் பராமரிப்பு முக்கியம்: உடலின் தாள அமைப்புகள், இதய செயல்பாடு, தசை-எலும்பு அமைப்பு எல்லாவற்றுக்கும் நிலையான கவனம் தேவை.",
        focus: "சனிக்கிழமை சனி வழிபாடு, சனி பூஜை, தாராளமாகப் பகிரும் வேண்டுமென்றே பழக்கங்கள் — அஷ்ட வசுக்கள் செல்வத்தை வழங்கியது பகிர்ந்தளிக்கவே, சேர்த்துவைக்க அல்ல என்ற ஒப்புதல். சனி ராசி அதிபதியின் நீண்ட தசை கற்பிக்கும் மூத்த குருநாதராக, அடுத்த தலைமுறைக்கு தாளத்தைக் கடத்தும் நிறுவப்பட்ட இசைக்கலைஞராக, செழிப்பு சமூகத்துக்குப் பயன்படுவதை உறுதிசெய்யும் செல்வம் உருவாக்குபவராக வெளிப்படுவதே சிறந்தது.",
      },
      {
        expect: "பிற்கால ஆண்டுகளில் வரும் புதன் தசை, ஏற்கனவே தாளத்திலும் கட்டமைப்பிலும் முதிர்ந்த அவிட்டத்தின் இயல்புக்கு மனதின் துல்லியத்தையும் தெளிவாக வெளிப்படுத்தும் திறனையும் கொண்டுவருகிறது. எப்போதும் முதன்மையாக மொழியற்ற, உடலால் உணரும், இசைசார்ந்த தாள நுண்ணறிவு, இப்போது புதனில் துல்லியமாக வெளிப்படுத்தும் ஆற்றலைக் காண்கிறது: தான் வாழும் தாளத்தை விளக்கக்கூடிய மூத்த இசைக்கலைஞர், தான் பயின்ற கொள்கைகளைக் கற்பிக்கக்கூடிய அனுபவமிக்க பொறியாளர், செழிப்பு உருவாக்கத்தின் பின்னுள்ள புரிதலைக் கடத்தக்கூடிய செல்வத் தேர்ச்சியாளர். செவ்வாய், ராகு, குரு, சனி வழியாகத் தேர்ச்சி பெற்றதைக் கற்பித்தல், எழுதுதல், வாய்மொழியாகக் கடத்துதல் ஆகியவை முதன்மைத் தொழில் வெளிப்பாடுகளாகின்றன.",
        navigate: "புதனின் வேகம் முதிர்ந்த அவிட்டத்தின் சனி ஆளும் பொறுமைக்கு சவாலாக இருக்கலாம் — வேகமாக நகரும் பகுப்பாய்வு மனம் மெதுவான, நிதானமான தாள ஞானத்தைச் சந்திப்பது. உடல் பராமரிப்பும் ஆற்றல் மேலாண்மையும் முக்கியம். புதன்–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு சுருக்கமான ஆனால் குறிப்பிடத்தக்க ராசி அதிபதி துணைக் காலம்.",
        focus: "புதன்கிழமை புதன் வழிபாடு. திரட்டப்பட்ட தாளமான மற்றும் கட்டமைப்பு தேர்ச்சியை கற்பித்தல் மற்றும் வெளிப்படுத்தலின் தீவிர நடைமுறை.",
      },
      {
        expect: "முதிர்ந்த வயதில் வரும் கேது தசை அவிட்டத்தின் வளமான தாளமான, செழிப்பான வாழ்வுக்கு மாபெரும் எளிமையைக் கொண்டுவருகிறது. இசை, செல்வம் உருவாக்கல், உடல் உயிர்ச்சக்தி, கட்டமைப்புத் தேர்ச்சி வழியாக வெளிப்பட்ட தாள நுண்ணறிவு, இப்போது குறிப்பிட்ட வடிவம் தேவையில்லாத தாளத்தில் தன் மூலத்துக்குத் திரும்புகிறது: எந்தத் துல்லியத் துடிப்பும் அடிக்கப்படுவதற்கு முன்பே இருக்கும் நாடித்துடிப்பு.",
        navigate: "முழுமையான மற்றும் மென்மையான உடல் பராமரிப்பு. இந்த வயதில் கேது ஆழமான கேட்கும் திறனுக்கான அழைப்பு — அவிட்டம் வெளிப்பாடு முழுவதையும் அடிப்படையாக கொண்ட ஆழமான கேட்கும் திறன்.",
        focus: "பித்ரு தர்ப்பணம் மற்றும் முன்னோர் சடங்குகள். அஷ்ட வசுக்களின் குழந்தை எல்லா தாளமும் உருவாகும் அமைதிக்கு திரும்புகிறது.",
      },
      {
        expect: "மிகமிக முதிர்ந்த வயதில் மட்டுமே தொடங்கும் சுக்கிர தசை மிகச் சில அவிட்ட ஆன்மாக்களால் அடையப்படுகிறது. வருபவர்களுக்கு, சுக்கிரன் அழகின் இறுதிக் கொடையைக் கொண்டுவருகிறார் — மிக நீண்ட வாழ்க்கையின் முழுமையை மூத்தவருடன் இருப்பவர்களுக்கு கண்ணுக்குத் தெரியச் செய்யும் அழகியல் கருணையும் ஒளிரும் அரவணைப்பும்.",
        navigate: "முழுமையான, அர்ப்பணிப்புடன் கூடிய உடல் பராமரிப்பு. இந்த தீவிர வயதில் சுக்கிரன் என்பது 'மிகவும் செல்வமான நட்சத்திரத்தின்' செழிப்பு அதன் மிகத் தூய வடிவில் வருவது — நிதிச் செல்வம் அல்ல, இருப்பின் செல்வம்.",
        focus: "அஷ்ட வசுக்கள் செல்வம் கொடுத்தனர். சுக்கிரன் ஆழமான செல்வம் முழுமையாக வாழப்பட்ட மனித வாழ்க்கையில் அழகின் தரம் என்று வெளிப்படுகிறது — முதல் அடிப்படையிலிருந்து கடைசி வரை கேட்கப்பட்ட தாளம்.",
      },
      {
        expect: "இந்த வரிசையின் கடைசி தசையான சூரிய தசை அசாதாரணமாகச் சில அவிட்ட ஆன்மாக்களால் மட்டுமே அடையப்படுகிறது — எல்லா நட்சத்திரங்களிலும் நீண்ட ஆயுள் கொண்டவர்களில் அவர்களும் ஒருவர். வருபவர்களுக்கு, சூரியன் இறுதி சூரியத் தெளிவைக் கொண்டுவருகிறார் — ஒரு வாழ்நாள் தாளத் தேர்ச்சியை எளிய, ஒளிரும் இருப்பாகக் காய்ச்சி வடிக்கும் அதிகாரம்.",
        navigate: "இந்த தீவிர வயதில் முழுமையான, அர்ப்பணிப்புடன் கூடிய உடல் பராமரிப்பு.",
        focus: "'மிகவும் செல்வமான நட்சத்திர' மூத்தவரின் சூரிய அதிகாரம் — முயற்சியின்றி ஒளியூட்டும், பற்றின்றிக் கொடுக்கும், செவ்வாயின் தொடக்க நெருப்பில் தொடங்கிய மாபெரும் தாளத்தை நிறைவு செய்யும் இருப்பு.",
      },
    ],
    spirituality: [
      { title: "அஷ்ட வசுக்கள் வழிபாடு & செல்வம் மரபுகள்",  desc: "அஷ்ட வசுக்கள் — இயற்கை உலகின் பொருட்டு செழிப்பு மற்றும் தாள உயிர்சக்தியை ஆளும் எட்டு செல்வக் கடவுள்கள் — அவிட்டத்தின் தலைமை தெய்வங்கள். வேத சடங்குகள் மூலம் அவர்களின் வழிபாடு, பக்தி செயல்களாக தாளத்தின் (மேள பிரகாரம், இசை) காணிக்கை, மற்றும் உண்மையான தாராளம் (தானம்) நடைமுறை ஆகியவை." },
      { title: "சனி & சிவ பக்தி",                            desc: "சனி — மகர மற்றும் கும்ப இரண்டின் ராசி அதிபதி — அவிட்டத்தின் ஆளும் கிரகம். சனிக்கிழமை சனி பூஜை, சிவ வழிபாடு (சனியும் சிவனும் ஒழுக்கம் மற்றும் கரைவின் தரத்தை பகிர்கிறார்கள்), பொறுமையான, நீண்ட-விளையாட்டு பக்தியின் நடைமுறை." },
      { title: "ஆன்மீக நடைமுறையாக இசை",                    desc: "அவிட்டத்திற்கு, இசையை செய்வது மற்றும் பெறுவது — குறிப்பாக தாளமான, தாளவாத்திய, பாரம்பரிய இசை — ஆன்மீக நடைமுறையிலிருந்து தனிப்பட்டதல்ல ஆனால் அதன் மிக உயர்ந்த வடிவம். மேளம் சிவனின் கருவி; தாளம் பிரபஞ்சத்தின் துடிப்பு; பக்தியுடன் அதை வசிக்கும் இசைக்கலைஞர் மிகவும் உண்மையான அவிட்டம் வழிபாட்டில் ஈடுபட்டுள்ளார்." },
    ],
    guidance: "மிகவும் செல்வமான நட்சத்திரம் தன் செல்வத்தை சேமிக்கவில்லை — அதை விநியோகிக்கிறது. நீங்கள் சுமக்கும் தாளம் உங்களுடையது அல்ல; அது எட்டு செழிப்பின் கடவுள்களால் உங்களுக்கு கொடுக்கப்பட்டது, மற்றும் அதன் தன்மை பகிரப்படுவது. மேளத்தின் ஒலி கையில் வைத்திருக்கும்போது அல்ல அறையில் கொடுக்கும்போது மிகவும் அழகானது. உங்கள் தாளத்தை தாராளமாக இசைக்கவும் — உங்கள் இசையில், உங்கள் செல்வத்தில், உங்கள் உயிர்சக்தியில், உங்கள் நேரத்தில் — மற்றும் அஷ்ட வசுக்களின் வாக்குறுதி என்னவென்றால் கொடுக்கப்படுவது, செழிப்பின் இயற்கையான சுழற்சியில், பெருக்கப்பட்டு திரும்புகிறது.",
    careerNote: "தாளம், நேரம், செழிப்பு, மற்றும் செவ்வாய்-சக்தி உந்துதல் மற்றும் சனி-கட்டமைக்கப்பட்ட பொறுமை ஆகியவற்றின் கலவை மையத் தேவைகளாக இருக்கும் இடங்களில் அவிட்டம் சிறப்பாக செயல்படுகிறது.",
    modernLead: "அவிட்டத்தின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "செல்வம் & செழிப்பு, தாளக் கும்ணம், செவ்வாய்-சக்தி உந்துதல் அவிட்டத்தின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function DhanishthiaVisualPage() {
  return <NatchathiramVisualContent data={AVITTAM} visual={DHANISHTHA_VISUAL} timings={dasaTimingsFor(AVITTAM.number)} />;
}
