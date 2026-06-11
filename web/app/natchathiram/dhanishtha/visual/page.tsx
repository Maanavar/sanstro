import type { Metadata } from "next";
import { AVITTAM } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

export const metadata: Metadata = {
  title: "Dhanishtha Nakshathiram — Visual Profile | Vinaadi",
  description: "Visual profile of Dhanishtha Nakshathiram: personality traits, career strengths, dasha timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/dhanishtha/visual" },
  openGraph: {
    title: "Dhanishtha Nakshathiram — Visual Profile",
    description: "Visual profile of Dhanishtha Nakshathiram: personality traits, career strengths, dasha timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/dhanishtha/visual",
    type: "article",
  },
};

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
      planet: "Mars", period: "7 yrs", ageRange: "Age 0–7", theme: "Born to the Drummer's Fire",
      detail: {
        expect: "Dhanishtha opens in Mars dasha — a beginning of unusual vitality, physical energy, and the kind of bold presence that the combination of Mars and the Ashta Vasus produces. The Dhanishtha child is physically alive in a particular way: the body is responsive, rhythmic, and energetic. The first seven years often show unusual physical coordination — a child who takes to music, rhythm, or physical movement with a naturalness that surprises. The family environment's relationship to music, physical vitality, and abundance is formative in Mars's opening. Mars–Saturn antardasha (~yr 6 of Mars, ~age 5-6) is a notable rasi lord sub-period flag: even in early childhood, the structural discipline and patient long-game that Saturn represents makes a brief appearance.",
        navigate: "Mars's primary challenge for the young Dhanishtha is the directed force finding appropriate expression — the physically energetic, rhythmically alive child needs channels for the Mars vitality that are constructive rather than disruptive. Mars–Saturn (~yr 6, ~ages 5-6) is a rasi lord antardasha flag: a brief but memorable early encounter with the patience and structure that will govern the major dasha at ages 41-60.",
        focus: "Tuesday Mars shrine prayers and the early provision of physical outlets, musical instruments, and rhythmic activities that match the Dhanishtha child's natural vitality. Mridangam or tabla exposure in early childhood, if available, can establish the life's central artistic intelligence in Mars's opening window.",
      },
    },
    {
      planet: "Rahu", period: "18 yrs", ageRange: "Age 7–25", theme: "The Expanding World",
      detail: {
        expect: "Rahu dasha from 7 to 25 brings the great expansion of Dhanishtha's rhythmic and abundant nature into the broader world. School years (7-14) see the rhythmic intelligence engaging with formal education — the Dhanishtha student finds the subjects that have pattern, rhythm, and structural elegance more naturally than those that require purely verbal or abstract reasoning. The musical or physical arts training that began in Mars dasha deepens significantly in Rahu's first decade. Higher education (14-22) brings the first professional-level engagements with the Dhanishtha domain — serious music study, engineering or finance education, or physical arts training at a competitive level. Rahu–Saturn antardasha (~yr 15 of Rahu, ~ages 22-24) is a significant rasi lord sub-period flag.",
        navigate: "Rahu's primary challenge for Dhanishtha is the expansion of the rhythmic abundance instinct beyond what the discipline can yet contain — the young person whose natural wealth-creating and rhythm-inhabiting capacity runs ahead of the Saturn-structured patience that will eventually govern it with full mastery. Rahu–Saturn (~yr 15, ~ages 22-24) is a rasi lord flag: a significant encounter with the patient, structured discipline that defines the Dhanishtha mature period.",
        focus: "Saturday Rahu shrine prayers and the deliberate cultivation of structured practice disciplines — the musician who practices with a metronome, the finance professional who studies the fundamentals, the engineer who masters the mathematics. Rahu–Saturn (~yr 15, ~ages 22-24) is a rasi lord antardasha flag: a period of significant structural encounter, disciplined expansion, or the first serious experience of Saturn's long-game requirements.",
      },
    },
    {
      planet: "Jupiter", period: "16 yrs", ageRange: "Age 25–41", theme: "The Philosophical Foundation",
      detail: {
        expect: "Jupiter dasha from 25 to 41 brings philosophical breadth, wisdom, and the expansive generosity of the teacher-philosopher to Dhanishtha's rhythmic and driven nature. The professional foundations established in Rahu dasha are now deepened with Jupiter's wisdom and expanded with Jupiter's range. Marriage and family formation typically occur in Jupiter–Venus antardasha (~yr 4 of Jupiter, ~ages 29-30) or Jupiter–Mercury (~yr 14, ~ages 39-40). The wealth-creating intelligence of Dhanishtha finds in Jupiter dasha the philosophical framework — the understanding of why abundance is generated and how it serves the whole — that makes the wealth not merely accumulation but genuine generosity. Jupiter–Saturn antardasha (~yr 13 of Jupiter, ~ages 38-40) is a significant rasi lord sub-period flag.",
        navigate: "Jupiter's primary challenge for Dhanishtha is the philosophical over-extension — the rhythmically intelligent, wealth-generating person who, in Jupiter's expansion, begins to believe that the abundance will always flow without the Saturnine discipline that actually sustains it. Jupiter–Saturn (~yr 13, ~ages 38-40) is a rasi lord flag: a period of structural testing and the decisive encounter with the patient discipline that will govern the rasi lord dasha.",
        focus: "Thursday Brihaspati worship and the deliberate cultivation of philosophical depth alongside the rhythmic and wealth-generating intelligence. Jupiter–Saturn (~yr 13, ~ages 38-40) is a major rasi lord antardasha flag: Saturn arrives in Jupiter's expansive field as a structuring, disciplining force that prepares Dhanishtha for the rasi lord's own dasha at ages 41-60.",
      },
    },
    {
      planet: "Saturn", period: "19 yrs", ageRange: "Age 41–60", theme: "Rasi Lord — The Wealth Master",
      detail: {
        expect: "Saturn dasha from 41 to 60 is the rasi lord's arrival for Dhanishtha — Saturn is the lord of both Makara (padas 1-2) and Kumbha (padas 3-4), making every Dhanishtha native a Saturn-rasi person, and making this 19-year dasha uniquely charged for all Dhanishtha. The rhythmic intelligence, Mars-powered drive, and Ashta Vasus' wealth instinct that have been developing since the life's opening now receive the full structural governance of the rasi lord's own dasha. Wealth creation peaks: the patient, structured, long-game approach that Saturn demands, applied to the abundance instinct that the Ashta Vasus gave, produces the most reliable and significant financial results of the entire life. The musical or artistic mastery, if cultivated since Mars's opening, reaches its fullest expression — the seasoned performer, the established master, the artist who has practised long enough that the Saturn discipline and the Ashta Vasus' rhythm have become one.",
        navigate: "Saturn's primary challenge in the rasi lord dasha is the rigidity of the structural master — the patient long-game person who has correctly identified the right approach beginning to insist that only their approach is right. The 'most wealthy star' shares its wealth; the Saturn rasi lord's governance requires that the wealth — financial, musical, vitality-based — be genuinely shared rather than hoarded. Physical care is important across the long 19-year dasha: the body's rhythmic systems, the cardiovascular function, and the musculoskeletal structure all require consistent attention.",
        focus: "Saturday Saturn worship, Shani puja, and deliberate practices of generous sharing — the acknowledgement that the Ashta Vasus gave wealth to be distributed, not accumulated. The Saturn rasi lord's 19 years are best expressed as the elder master who teaches, the established musician who transmits the rhythm to the next generation, and the wealth creator who ensures the abundance serves the community.",
      },
    },
    {
      planet: "Mercury", period: "17 yrs", ageRange: "Age 60–77", theme: "The Articulate Master",
      detail: {
        expect: "Mercury dasha from 60 to 77 brings the mind's precision and articulativeness to Dhanishtha's already rhythmically and structurally mature character. The rhythmic intelligence — which has always been primarily non-verbal, bodily, and musical — now finds in Mercury the capacity for precise articulation: the elder musician who can explain the rhythm they inhabit, the experienced engineer who can teach the principles they have practised, the wealth master who can transmit the understanding behind the abundance creation. Teaching, writing, and the verbal transmission of what has been mastered through Mars, Rahu, Jupiter, and Saturn become the primary professional expressions.",
        navigate: "Mercury's pace can challenge the Saturn-governed patience of the mature Dhanishtha — the fast-moving analytical mind meeting the slow and deliberate rhythmic wisdom. Physical care and energy management are important. Mercury–Saturn (~yr 14 of Mercury, ~ages 74-75) brings a brief but notable rasi lord sub-period.",
        focus: "Wednesday Mercury worship and the active practice of teaching and articulating the accumulated rhythmic and structural mastery. The most wealthy star shares its knowledge as readily as its wealth.",
      },
    },
    {
      planet: "Ketu", period: "7 yrs", ageRange: "Age 77–84", theme: "The Rhythm Without Form",
      detail: {
        expect: "Ketu dasha from 77 to 84 brings the great simplification of Dhanishtha's richly rhythmic and abundant life. The rhythmic intelligence — which has been expressed through music, through wealth creation, through physical vitality, through structural mastery — now returns to its source in the rhythm that needs no particular form: the pulse that is present before any specific beat is struck.",
        navigate: "Complete and gentle physical care. Ketu at this age is the invitation to rest in the rhythm rather than play it — the deep listening that underlies all the Dhanishtha expression across a lifetime.",
        focus: "Pitru tharpanam and ancestral rites. The Ashta Vasus' child returns to the silence from which all rhythm emerges.",
      },
    },
    {
      planet: "Venus", period: "20 yrs", ageRange: "Age 84–104", theme: "The Beauty of Abundance",
      detail: {
        expect: "Venus dasha from 84 to 104 is reached by very few Dhanishtha souls. For those who arrive, Venus brings the final gift of beauty — the aesthetic grace and luminous warmth that make a very long life's fullness visible to those who are present with the elder.",
        navigate: "Complete and devoted physical care. Venus at this extreme age is the abundance of the 'most wealthy star' arriving in its most distilled form — not financial wealth but the wealth of presence.",
        focus: "The Ashta Vasus gave wealth. Venus reveals that the deepest wealth is the quality of beauty in a human life fully lived — the rhythm that was heard from the first beat to the last.",
      },
    },
    {
      planet: "Sun", period: "6 yrs", ageRange: "Age 104–110", theme: "Final Solar Clarity",
      detail: {
        expect: "Sun dasha from 104 to 110 is reached only by extraordinarily few Dhanishtha souls — among the longest-lived of all nakshathirams. For those who arrive, Sun brings the final solar clarity, the authority that distils nine decades of rhythmic mastery into simple, luminous presence.",
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

  compatibleEn: ["Shravana", "Rohini", "Uttara Ashadha", "Anuradha", "Ashwini"],
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
      "ராசி அதிபதி — செல்வ தேர்ச்சி — சனி தசை மகர/கும்ப ராசிக்கு",
      "வெளிப்படுத்தும் மாஸ்டர் — புதன் கற்பித்தல், மரபு பரிமாற்றம்",
      "வடிவமில்லா தாளம் — கேது ஆழ எளிமை",
      "செழிப்பின் அழகு — சுக்கிர இறுதி நிறைவு",
      "இறுதி சூரிய தெளிவு — சூரியன் முடிவு",
    ],
    dashaDetails: [
      {
        expect: "அவிட்டம் செவ்வாய் தசையில் திறக்கிறது — அசாதாரண உயிர்சக்தி, உடல் ஆற்றல் மற்றும் செவ்வாய் மற்றும் அஷ்ட வசுக்களின் கலவை உருவாக்கும் தைரியமான இருப்பின் தொடக்கம். செவ்வாய்–சனி (~yr 6, ~5-6 வயது): ஒரு குறிப்பிடத்தக்க ராசி அதிபதி கொடியாளி — ஆரம்பகால குழந்தை பருவத்திலும், சனி பிரதிநிதிக்கும் கட்டமைப்பு ஒழுக்கம் மற்றும் பொறுமையான நீண்ட-விளையாட்டு சிறிய தோற்றம் தருகிறது.",
        navigate: "இளம் அவிட்டத்திற்கு செவ்வாயின் முதன்மையான சவால் திசைப்பட்ட வலிமை சரியான வெளிப்பாடு காண்பது. செவ்வாய்–சனி: ராசி அதிபதி கொடியாளி சாளரம் — 41-60 வயதில் முக்கிய தசையை நிர்வகிக்கும் பொறுமை மற்றும் கட்டமைப்புடன் ஆரம்பகால சந்திப்பு.",
        focus: "செவ்வாய்க்கிழமை செவ்வாய் சன்னதி வழிபாடு. இளம் அவிட்டத்திற்கு மிருதங்கம் அல்லது தபேலா வெளிப்பாடு, இசை கருவிகள் மற்றும் தாள நடவடிக்கைகள் வழங்கவும்.",
      },
      {
        expect: "ராகு தசை 7 முதல் 25 வரை அவிட்டத்தின் தாளமான மற்றும் செழிப்பான தன்மையை பரந்த உலகிற்கு விரிவாக்குகிறது. ராகு–சனி (~yr 15, ~22-24 வயது): குறிப்பிடத்தக்க ராசி அதிபதி கொடியாளி — பொறுமையான, கட்டமைக்கப்பட்ட ஒழுக்கத்துடன் குறிப்பிடத்தக்க சந்திப்பு.",
        navigate: "ராகுவின் முதன்மையான சவால் அவிட்டத்திற்கு தாளமான செழிப்பு உள்ளுணர்வின் விரிவாக்கம் ஒழுக்கம் இன்னும் கொண்டிருக்கும் அளவிற்கு அப்பால் செல்வது. ராகு–சனி: ராசி அதிபதி கொடியாளி — குறிப்பிடத்தக்க ஒழுக்கமான விரிவாக்கம் அல்லது சனியின் நீண்ட-விளையாட்டு தேவைகளின் முதல் தீவிரமான அனுபவம்.",
        focus: "சனிக்கிழமை ராகு சன்னதி வழிபாடு. கட்டமைக்கப்பட்ட பயிற்சி ஒழுக்கங்களை வேண்டுமென்று வளர்க்கவும். ராகு–சனி: ராசி அதிபதி அந்தர்தசை கொடியாளி.",
      },
      {
        expect: "குரு தசை 25 முதல் 41 வரை அவிட்டத்தின் தாளமான மற்றும் உந்தப்பட்ட தன்மைக்கு தத்துவ அகலம், ஞானம் மற்றும் ஆசிரியர்-தத்துவஞானியின் விரிவான தாராளம் கொண்டு வருகிறது. குரு–சனி (~yr 13, ~38-40 வயது): குறிப்பிடத்தக்க ராசி அதிபதி கொடியாளி — கட்டமைப்பு சோதனை மற்றும் ராசி அதிபதி தசையில் ஆட்சி செய்யும் பொறுமையான ஒழுக்கத்துடன் தீர்க்கமான சந்திப்பு.",
        navigate: "குருவின் முதன்மையான சவால் அவிட்டத்திற்கு தத்துவ அதிகப்படியான விரிவாக்கம். குரு–சனி: ராசி அதிபதி கொடியாளி — அவிட்டத்தை ராசி அதிபதியின் சொந்த தசைக்கு தயார்படுத்தும் கட்டமைப்பு, ஒழுக்கமிக்க சக்தியாக சனி குருவின் விரிவான தளத்தில் வருகிறது.",
        focus: "வியாழக்கிழமை பிரஹஸ்பதி வழிபாடு. தாளமான மற்றும் செல்வம் உருவாக்கும் நுண்ணறிவுடன் தத்துவ ஆழத்தை வேண்டுமென்று வளர்க்கவும். குரு–சனி: முக்கிய ராசி அதிபதி அந்தர்தசை கொடியாளி.",
      },
      {
        expect: "சனி தசை 41 முதல் 60 வரை அவிட்டத்திற்கு ராசி அதிபதியின் வருகை — சனி மகர (பாதங்கள் 1-2) மற்றும் கும்ப (பாதங்கள் 3-4) இரண்டின் அதிபதி, ஒவ்வொரு அவிட்டம் நேயரையும் சனி-ராசி நபராக்குகிறது, இந்த 19-வருட தசையை அனைத்து அவிட்டத்திற்கும் தனிச்சிறப்பாக வலிமையாக்குகிறது. செல்வம் உருவாக்கல் உச்சமடைகிறது. இசை அல்லது கலை தேர்ச்சி, செவ்வாயின் திறப்பிலிருந்து வளர்க்கப்பட்டிருந்தால், அதன் மிகவும் முழுமையான வெளிப்பாடை அடைகிறது.",
        navigate: "ராசி அதிபதி தசையில் சனியின் முதன்மையான சவால் கட்டமைப்பு மாஸ்டரின் கடினத்தன்மை. 'மிகவும் செல்வமான நட்சத்திரம்' தன் செல்வத்தை பகிர்கிறது; சனி ராசி அதிபதியின் ஆட்சி செல்வம் — நிதி, இசை, உயிர்சக்தி-அடிப்படையிலான — உண்மையாகவே பகிரப்படுகிறது என்று கோருகிறது. நீண்ட 19-வருட தசை முழுவதும் உடல் பராமரிப்பு முக்கியம்.",
        focus: "சனிக்கிழமை சனி வழிபாடு மற்றும் தாராள பகிர்வின் வேண்டுமென்து நடைமுறைகள். சனி ராசி அதிபதியின் 19 வருடங்கள் மூத்த மாஸ்டராக கற்பிப்பவராக, நிறுவப்பட்ட இசைக்கலைஞராக அடுத்த தலைமுறைக்கு தாளத்தை பரிமாறுபவராக வெளிப்படுகின்றன.",
      },
      {
        expect: "புதன் தசை 60 முதல் 77 வரை அவிட்டத்தின் ஏற்கனவே தாளமாக மற்றும் கட்டமைப்பு ரீதியாக முதிர்ந்த குணத்திற்கு மனதின் துல்லியம் மற்றும் வெளிப்படுத்தும் திறனை கொண்டு வருகிறது. மூத்த இசைக்கலைஞர் தாங்கள் வசிக்கும் தாளத்தை விளக்கலாம், அனுபவமிக்க பொறியாளர் தாங்கள் பயிற்சி செய்த கொள்கைகளை கற்பிக்கலாம்.",
        navigate: "புதனின் வேகம் முதிர் அவிட்டத்தின் சனி-ஆளப்படும் பொறுமையை சவாலிட முடியும். உடல் பராமரிப்பு மற்றும் ஆற்றல் மேலாண்மை முக்கியம். புதன்–சனி (~yr 14, ~74-75 வயது): சிறிய ஆனால் குறிப்பிடத்தக்க ராசி அதிபதி அந்தர்தசை.",
        focus: "புதன்கிழமை புதன் வழிபாடு. திரட்டப்பட்ட தாளமான மற்றும் கட்டமைப்பு தேர்ச்சியை கற்பித்தல் மற்றும் வெளிப்படுத்தலின் தீவிர நடைமுறை.",
      },
      {
        expect: "கேது தசை 77 முதல் 84 வரை அவிட்டத்தின் வளமையான தாளமான மற்றும் செழிப்பான வாழ்க்கையின் மாபெரும் எளிமையை கொண்டு வருகிறது. தாள நுண்ணறிவு — இசை மூலம், செல்வம் உருவாக்கல் மூலம், உடல் உயிர்சக்தி மூலம், கட்டமைப்பு தேர்ச்சி மூலம் வெளிப்படுத்தப்பட்டது — இப்போது குறிப்பிட்ட வடிவம் தேவையில்லாத தாளத்தில் தன் மூலத்திற்கு திரும்புகிறது.",
        navigate: "முழுமையான மற்றும் மென்மையான உடல் பராமரிப்பு. இந்த வயதில் கேது ஆழமான கேட்கும் திறனுக்கான அழைப்பு — அவிட்டம் வெளிப்பாடு முழுவதையும் அடிப்படையாக கொண்ட ஆழமான கேட்கும் திறன்.",
        focus: "பித்ரு தர்ப்பணம் மற்றும் முன்னோர் சடங்குகள். அஷ்ட வசுக்களின் குழந்தை எல்லா தாளமும் உருவாகும் அமைதிக்கு திரும்புகிறது.",
      },
      {
        expect: "சுக்கிர தசை 84 முதல் 104 வரை மிகவும் சில அவிட்டம் ஆன்மாக்களால் அடையப்படுகிறது. வந்தவர்களுக்கு, சுக்கிரன் இறுதி அழகின் கொடையை கொண்டு வருகிறது — மிக நீண்ட வாழ்க்கையின் முழுமையை மூத்தவரோடு இருப்பவர்களுக்கு கண்ணுக்கு தெரியும் அழகியல் கருணை மற்றும் ஒளிரும்온기.",
        navigate: "முழுமையான மற்றும் அர்ப்பணிக்கப்பட்ட உடல் பராமரிப்பு. இந்த தீவிர வயதில் சுக்கிரன் தூய ஒளி.",
        focus: "அஷ்ட வசுக்கள் செல்வம் கொடுத்தனர். சுக்கிரன் ஆழமான செல்வம் முழுமையாக வாழப்பட்ட மனித வாழ்க்கையில் அழகின் தரம் என்று வெளிப்படுகிறது — முதல் அடிப்படையிலிருந்து கடைசி வரை கேட்கப்பட்ட தாளம்.",
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
  return <NatchathiramVisualContent data={AVITTAM} visual={DHANISHTHA_VISUAL} />;
}
