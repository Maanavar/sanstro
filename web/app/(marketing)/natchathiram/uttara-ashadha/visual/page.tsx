import type { Metadata } from "next";
import { withTamilTwin } from "@/lib/localized-metadata";
import { withDasaTimingHold } from "@/lib/natchathiram-dasa-hold";
import { dasaTimingsFor } from "@/lib/natchathiram-dasa-timings";
import { nakshatraDisplayName } from "@/lib/nakshatra-display-name";
import { natchathiramVisualTa } from "@/lib/marketing-seo-ta";
import { UTTARA_ASHADHA } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

const EN_METADATA: Metadata = {
  title: `${nakshatraDisplayName(UTTARA_ASHADHA.number, "en")} — Visual Profile`,
  description: "Visual profile of Uthiradam Nakshathiram: personality traits, career strengths, dasa timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/uttara-ashadha/visual" },
  openGraph: {
    title: `${nakshatraDisplayName(UTTARA_ASHADHA.number, "en")} — Visual Profile`,
    description: "Visual profile of Uthiradam Nakshathiram: personality traits, career strengths, dasa timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/uttara-ashadha/visual",
    type: "article",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withDasaTimingHold(await withTamilTwin(EN_METADATA, "/natchathiram/uttara-ashadha/visual", natchathiramVisualTa("uttara-ashadha")!), "uttara-ashadha");
}

const UTTARA_ASHADHA_VISUAL: NatchathiramVisualData = {
  atAGlance: [
    { label: "Undefeated Perseverance",   score: 98 },
    { label: "Stable Leadership",          score: 96 },
    { label: "Universal Vision",           score: 95 },
    { label: "Ethical Authority",          score: 97 },
    { label: "Long-Game Mastery",          score: 96 },
  ],

  radar: {
    labels: ["Perseverance", "Leadership", "Vision", "Ethics", "Strategy", "Stability"],
    values: [98, 96, 95, 97, 94, 96],
  },

  coreStrengths: [
    { symbol: "◎", label: "Undefeated Perseverance",  score: 98, desc: "Uttara Ashadha means 'the later victory' — the victory that comes from endurance, from the willingness to continue after the early victory has faded and the real work has begun. The Vishvedevas' gift is the persistence that cannot be exhausted." },
    { symbol: "◈", label: "Stable Leadership",         score: 96, desc: "The rarest combination — philosophical breadth (Dhanus pada 1) and structural mastery (Makara padas 2-4) both available as leadership registers. Uttara Ashadha leads from vision and from method, choosing the register the situation requires." },
    { symbol: "⚡", label: "Universal Vision",          score: 95, desc: "Presided over by the Vishvedevas — the all-gods, the universal pantheon — Uttara Ashadha carries the vision of the whole rather than the part, the universal rather than the sectarian, the long arc rather than the immediate moment." },
    { symbol: "♥", label: "Ethical Authority",         score: 97, desc: "The victory that Uttara Ashadha achieves is never won by compromise with what is right. The ethical spine — the unwillingness to advance at the cost of what is true or just — is the central defining characteristic of this nakshathiram." },
    { symbol: "△", label: "Long-Game Mastery",         score: 96, desc: "Saturn (Makara rasi lord) and Jupiter (Dhanus rasi lord) both contribute their long-cycle wisdom to Uttara Ashadha. The 30-year Saturn return and the 12-year Jupiter return are the natural planning horizons of this nakshathiram." },
    { symbol: "☽", label: "Resilient Dignity",         score: 94, desc: "Setbacks, obstacles, and delays — the natural terrain of the later victory — are met by Uttara Ashadha not with reactive emotion but with the quiet dignity of one who knows that the outcome is already determined by the quality of the effort." },
  ],

  careerAbilities: [
    { label: "Strategic Leadership & Governance", score: 98 },
    { label: "Law & Constitutional Authority",    score: 97 },
    { label: "Philosophy & Higher Teaching",      score: 95 },
    { label: "Long-Term Planning & Execution",    score: 96 },
    { label: "Military & Protective Service",     score: 94 },
  ],
  careerNote: "Uttara Ashadha excels wherever the long arc, the ethical spine, and the willingness to lead through sustained difficulty — rather than through the dramatic inspiration of the early victory — are the defining qualities of the work. They build institutions, articulate constitutions, and lead the campaigns that matter for decades, not days.",

  careerClusters: [
    { symbol: "◎", title: "Governance & Constitutional Authority", desc: "Government leadership, constitutional law, public administration — Uttara Ashadha's ethical authority and long-game vision applied to the structures that govern shared life." },
    { symbol: "◈", title: "Military & Protective Leadership",      desc: "Military command, police and judicial leadership, protective institutional service — the willingness to stand in difficult terrain for extended periods." },
    { symbol: "⚡", title: "Philosophy & Academic Leadership",      desc: "University leadership, philosophical tradition building, the long-term cultivation of intellectual institutions — the Vishvedevas' universal vision in academic service." },
    { symbol: "♥", title: "Strategic Corporate Leadership",        desc: "Long-horizon corporate strategy, institutional transformation, the CEO role in organisations that measure success in decades — Uttara Ashadha's long-game mastery." },
    { symbol: "△", title: "International Law & Justice",          desc: "International legal frameworks, justice institutions, ethical policy architecture — the universal vision applied to the domain of what is right." },
    { symbol: "☽", title: "Infrastructure & Long-Term Engineering", desc: "Civil engineering, infrastructure development, the physical construction of what will serve generations — Makara's structural mastery in its most tangible form." },
  ],

  modernApps: [
    { symbol: "◎", title: "Governance & Policy Technology",       desc: "Government digital transformation, policy analysis platforms, public administration technology — Uttara Ashadha's ethical authority at institutional scale." },
    { symbol: "◈", title: "Security & Justice Technology",        desc: "Criminal justice technology, security intelligence platforms, protective institutional applications." },
    { symbol: "⚡", title: "Academic & Research Institutions Tech", desc: "University technology platforms, research institution management, long-term academic intelligence tools." },
    { symbol: "♥", title: "Long-Horizon Strategy Technology",     desc: "Scenario planning platforms, multi-decade strategy tools, institutional long-game intelligence applications." },
    { symbol: "△", title: "Legal & International Framework Tech", desc: "International law platforms, justice framework technology, ethical policy intelligence tools." },
    { symbol: "☽", title: "Infrastructure & Engineering Technology", desc: "Infrastructure intelligence platforms, civil engineering technology, long-duration project management tools." },
  ],

  dashaTimeline: [
    {
      planet: "Sun", theme: "Born in the Solar Light",
      detail: {
        expect: "Uttara Ashadha opens in Sun dasa — a beginning of unusual solar clarity, authority, and purpose. Sun's is a short opening dasa; the balance left at birth runs from long for births in the first pada to brief for the fourth, and the range shown for this dasa gives it. For Dhanus pada (first pada) natives, the Sun dasa opening carries the quality of the Sun's early illumination of the Dhanus philosophical field: a childhood that is solar, purposeful, and often marked by an unusual sense of destiny or clarity about what the life is for. For Makara padas (second to fourth pada) natives, Sun dasa is a powerful but brief opening that precedes the Saturn governance of the rasi — a first solar experience before the long Saturn discipline begins.",
        navigate: "The Sun's authority in the infant and young child can produce a certain quality of demanding presence — the Uttara Ashadha child who knows what they want and knows why, and whose sense of self is already surprisingly clear. Physical concerns: heart, eyes, and the digestive fire. The Sun–Rahu bhukti (the table below gives when it begins and how long it lasts) can bring unexpected disruption to the early settled quality.",
        focus: "For Dhanus pada Uttara Ashadha: Sunday Surya worship and the cultivation of the philosophical range that Jupiter, your rasi lord, will govern. For Makara padas: Sunday Surya worship and the early establishment of the discipline, patience, and structured engagement with the world that Saturn, your rasi lord, will require. Sun dasa is the brief, bright overture before the long game begins.",
      },
    },
    {
      planet: "Moon", theme: "Emotional Deepening",
      detail: {
        expect: "Moon dasa carries Uttara Ashadha through the school years and brings the emotional ocean to an otherwise purposeful and structured beginning; for the shorter balances it reaches the middle of schooling, for the longer ones its close. The school years are marked by the development of the empathic and relational intelligence that Uttara Ashadha will need to lead effectively across a lifetime — not just the vision and the ethical spine, but the capacity to understand what others feel and to calibrate the leadership accordingly. For many Uttara Ashadha, Moon dasa is the period of the formation of the deepest friendship or the encounter with the teacher who sees clearly who this child genuinely is.",
        navigate: "Moon's primary challenge for Uttara Ashadha is the encounter with emotional ambiguity — the purposeful, structured character finding the emotional world's resistance to structure genuinely challenging. Physical concerns: digestive, lymphatic, and the body's fluid balance. The Moon–Saturn bhukti for Makara padas or the Moon–Jupiter bhukti for Dhanus pada (the table below gives when each begins and how long it lasts) are worth noting as rasi lord-flavoured sub-periods.",
        focus: "Monday Moon worship and deliberate cultivation of emotional intelligence alongside the purposeful and structured natural inclination. For Dhanus pada: the Moon–Jupiter bhukti is a rasi lord sub-period flag — a philosophical opening, an encounter with a wise teacher, or the first serious intellectual or spiritual influence. For Makara padas: the Moon–Saturn bhukti is a rasi lord sub-period flag — an early experience of the structured discipline and patient long game that will define the mature Uttara Ashadha.",
      },
    },
    {
      planet: "Mars", theme: "The First Campaign",
      detail: {
        expect: "Mars dasa brings the directed fire of competitive action to Uttara Ashadha's purposeful and structured character; it runs from adolescence toward early adulthood, and for the longer balances carries the university years and the first professional steps. The Uttara Ashadha character — the ethical authority, the long-game orientation, the universal vision — now encounters the immediate competitive realities of education and early career with Mars's focused intensity. For many Uttara Ashadha, Mars dasa contains the first serious test of the ethical spine: the situation that cannot be resolved by the right combination of persistence and integrity, where the compromise is offered and must be refused.",
        navigate: "Mars's primary challenge for Uttara Ashadha is the impatience of the directed fire meeting the patience of the long-game character. The victory of Uttara Ashadha is always the later victory; Mars dasa often delivers the first significant experience of having done everything right and still not won immediately — and the invitation to trust the long arc. The Mars–Jupiter bhukti for Dhanus pada or the Mars–Saturn bhukti for Makara padas (the table below gives when each begins and how long it lasts) carry rasi lord presence.",
        focus: "Tuesday Mars shrine prayers and the active cultivation of patience alongside determination — the understanding that the long game requires both qualities simultaneously, not in alternation. For Dhanus pada: the Mars–Jupiter bhukti is a rasi lord flag. For Makara padas: the Mars–Saturn bhukti is a rasi lord flag — an experience of the structured discipline, patient endurance, or significant institutional encounter that characterises Saturn's contribution to Uttara Ashadha.",
      },
    },
    {
      planet: "Rahu", theme: "The World Encounter",
      detail: {
        expect: "Rahu dasa is the period in which Uttara Ashadha's vision and ethical authority encounter the full complexity of the world — including the parts of the world that do not share Uttara Ashadha's ethical standards, long-game orientation, or universal vision. It begins in early adulthood and runs through the building years of working life. Career builds rapidly in Rahu dasa; professional recognition arrives; the combination of Uttara Ashadha's purposeful intelligence and Rahu's expansive ambition produces significant career achievements. Marriage and family formation may fall within this dasa. A node carries no marriage significator of its own: where marriage falls in Rahu's dasa, it is read from Rahu's dispositor and from the seventh house and its lord, with Venus and Jupiter as the significators, not from Rahu itself, and judged from the individual horoscope as a tendency rather than a fixed time.",
        navigate: "Rahu's primary challenge for Uttara Ashadha is the amplification of ambition beyond the ethical spine's comfort zone — the long-game person who discovers, in Rahu's expanding field, that the pace of the world is faster than the pace of their integrity. The later victory requires not losing the ethical standard in the face of the world's demands for compromise. The Rahu–Jupiter bhukti (the table below gives when it begins and how long it lasts) for Dhanus pada is a rasi lord window of major expansion and possible breakthrough.",
        focus: "Saturday Rahu shrine prayers and the deliberate maintenance of the ethical spine in the face of Rahu's expansive ambition. For Dhanus pada: the Rahu–Jupiter bhukti is a major rasi lord flag — a period of philosophical expansiveness, possible spiritual breakthrough, or major professional advance. For Makara padas: the Rahu–Saturn bhukti is a rasi lord flag — a period of structural discipline, institutional encounter, or the decisive testing of the long-game patience. The bhukti table below gives when each begins and how long it lasts.",
      },
    },
    {
      planet: "Jupiter", theme: "Rasi Lord (Dhanus) — The Philosophical Harvest / Supporting Wisdom (Makara)",
      detail: {
        expect: "Jupiter dasa, in the prime of professional life, is the rasi lord's arrival for Dhanus pada (first pada) Uttara Ashadha. For those born in Dhanus pada, Jupiter is your rasi lord — and his dasa is the most expansive, wise, and philosophically abundant period of the entire life. The Vishvedevas' universal vision, joined to Jupiter's philosophical breadth, produces the period of maximum teaching authority, institutional leadership, and wisdom transmission. Senior leadership positions, significant publications, and the widest reach of Uttara Ashadha's influence typically fall in Jupiter dasa for Dhanus pada natives. For Makara padas (second to fourth pada) Uttara Ashadha, Jupiter dasa is a period of powerful philosophical support — not the rasi lord, but a benefic and expansive influence that deepens the wisdom and broadens the vision of the long-game practitioner.",
        navigate: "Jupiter's primary shadow for Uttara Ashadha is the philosophical inflation of the universal visionary — the person whose vision has been validated across the Rahu dasa beginning to believe that their vision of the universal is itself universal. The Vishvedevas' gift requires remembering that they are many gods, not one — the universal vision is always a chorus, not a solo. The Jupiter–Saturn bhukti (the table below gives when it begins and how long it lasts) brings structural testing and refinement.",
        focus: "Thursday Brihaspati worship and deliberate engagement with the traditions and perspectives that challenge rather than confirm the Uttara Ashadha vision. For Dhanus pada: Jupiter dasa is the philosophical culmination of the first half of the life — give the teaching generously and hold the certainties lightly. For Makara padas: receive Jupiter's expansive philosophical support as the wisdom that broadens Saturn's structural discipline.",
      },
    },
    {
      planet: "Saturn", theme: "Rasi Lord (Makara) — The Long Discipline / Structural Mastery (Dhanus)",
      detail: {
        expect: "Saturn dasa, in the elder years, is the rasi lord's arrival for Makara padas (second to fourth pada) Uttara Ashadha. For those born in Makara, Saturn is your rasi lord — and his long dasa is the most structurally mastered, patiently disciplined, and institutionally powerful period of the life. The long-game wisdom that has been accumulating since Sun dasa's brief opening now governs; the institutions built through Rahu and Jupiter dasas enter their maturity; the leadership that Uttara Ashadha provides in Saturn dasa carries the authority of someone who has actually played the long game and arrived at its harvest. For Dhanus pada (first pada) Uttara Ashadha, Saturn dasa is a period of powerful structural support — not the rasi lord, but a disciplining and clarifying force that grounds the philosophical vision in practical reality.",
        navigate: "Saturn's primary challenge for Uttara Ashadha is the rigidity of the structural master — the patient person who has correctly identified the long-game approach beginning to insist that only the long game is correct. The universal vision requires flexibility as well as persistence. Physical care and energy management become increasingly important through Saturn's long dasa.",
        focus: "Saturday Saturn worship, Shani puja, Hanuman worship, and the deliberate cultivation of structural simplicity. For Makara padas: Saturn dasa is the harvest of the patience — the long-game has arrived at its later victory, and that victory is best served by the generous transmission of what has been learned. For Dhanus pada: receive Saturn's structural discipline as the grounding of the philosophical vision in what can actually be built and sustained.",
      },
    },
    {
      planet: "Mercury", theme: "The Clear Articulation",
      detail: {
        expect: "Mercury dasa, in very advanced age, brings the mind's precision and articulative capacity to Uttara Ashadha's elder years. The universal vision and the long-game wisdom now meet Mercury's gift for clear expression — the elder who speaks with the concision and precision that only comes from decades of having thought carefully about what to say. Writing, teaching, and the transmission of the institutional wisdom accumulated across the life are the natural expressions of Mercury dasa.",
        navigate: "Physical care and the management of the nervous system's accumulated demands. Mercury at this age requires consistent energy management and deliberate pacing.",
        focus: "Wednesday Mercury worship and the active practice of articulation — writing, recording, transmitting the long-game wisdom in forms that will outlast the person. The later victory's legacy is often written in Mercury dasa.",
      },
    },
    {
      planet: "Ketu", theme: "Final Release",
      detail: {
        expect: "Ketu dasa, the last in this sequence, is reached by very few Uttara Ashadha souls. For those who arrive, Ketu brings the final release of the identity that has been built across a lifetime of purposeful, ethical, long-game engagement. The undefeated one discovers, in Ketu's closing, that the victory was never personal — it was always in service of the universal.",
        navigate: "Complete and devoted physical care. Ketu at this extreme age is a gift of presence — the stripping away of everything that was never essential, leaving what always was.",
        focus: "Ganapati worship, pitru tharpanam and ancestral rites. The Vishvedevas receive one of their own back into the universal.",
      },
    },
  ],

  spirituality: [
    {
      title: "Vishvedevas Worship & Universal Pantheon",
      desc: "The Vishvedevas — the all-gods, the universal assembly of divine principles — are Uttara Ashadha's presiding deities. Worship of the Vishvedevas through Vedic hymns (the Vishvedeva Sukta), participation in yajnas that honour the full divine assembly, and the practice of universal rather than sectarian devotion are Uttara Ashadha's deepest spiritual expressions.",
    },
    {
      title: "Jupiter (Dhanus) / Saturn (Makara) Devotion",
      desc: "For Dhanus pada: Thursday Brihaspati–Dakshinamurthy worship and the philosophical wisdom traditions. For Makara padas: Saturday Shani puja and the practice of patient, structured devotion — the long-game approach applied to the spiritual life itself.",
    },
    {
      title: "Dharmic Practice as Spiritual Foundation",
      desc: "For Uttara Ashadha, the practice of dharma — the ethical action that serves the universal rather than the personal interest — is not separate from spiritual practice but is its highest expression. The undefeated victory is always a dharmic victory; the spiritual path and the ethical path are the same path.",
    },
  ],

  guidance: "The later victory comes not to the most talented or the most fortunate but to the one who was willing to continue — through the difficulty, the delay, the setback, the moment when the ethical standard required the refusal of the convenient shortcut. The Vishvedevas gave you the gift of persistence because they knew the world would require it. The long game is won by the one who never confuses the pace of the advance with the certainty of the outcome. Advance with patience, govern with ethics, and trust that the later victory, when it arrives, will be worth exactly what it cost.",

  compatibleEn: ["Uthiram", "Rohini", "Pooradam", "Thiruvonam", "Anusham"],
  compatibleNote: "These nakshatras complement Uttara Ashadha's undefeated perseverance, ethical authority, and long-game vision with beauty, devotion, and philosophical resonance.",

  ta: {
    atAGlanceLabels: ["தோற்கடிக்க முடியாத விடாமுயற்சி", "நிலையான தலைமை", "உலகளாவிய பார்வை", "நெறிமுறை அதிகாரம்", "நீண்ட-விளையாட்டு தேர்ச்சி"],
    radarLabels: ["விடாமுயற்சி", "தலைமை", "பார்வை", "நெறிமுறைகள்", "மூலோபாயம்", "நிலைத்தன்மை"],
    coreStrengths: [
      { label: "தோற்கடிக்க முடியாத விடாமுயற்சி", desc: "உத்தர ஆஷாடா என்றால் 'பிற்கால வெற்றி' — ஆரம்ப வெற்றி மங்கிய பிறகும் மற்றும் உண்மையான வேலை தொடங்கிய பிறகும் தொடர்வதற்கான விருப்பத்திலிருந்து வரும் விடாமுயற்சி." },
      { label: "நிலையான தலைமை",               desc: "அரிய கலவை — தத்துவ அகலம் (தனுசு பாதம் 1) மற்றும் கட்டமைப்பு தேர்ச்சி (மகர பாதங்கள் 2-4). உத்திராடம் பார்வை மற்றும் முறை இரண்டிலிருந்தும் வழிகாட்டுகிறது." },
      { label: "உலகளாவிய பார்வை",              desc: "விஸ்வதேவர்களால் தலைமை தாங்கப்படுகிறது — எல்லா-கடவுள்கள், உலகளாவிய பந்தயோன் — உத்திராடம் பகுதியை விட முழுவதின் பார்வையை சுமக்கிறது." },
      { label: "நெறிமுறை அதிகாரம்",            desc: "உத்திராடம் அடையும் வெற்றி சரியானதுடன் சமரசத்தால் ஒருபோதும் வெல்லப்படவில்லை. நெறிமுறை முதுகுத்தண்டு இந்த நட்சத்திரத்தின் மையமான வரையறுக்கும் குணம்." },
      { label: "நீண்ட-விளையாட்டு தேர்ச்சி",   desc: "சனி (மகர ராசி அதிபதி) மற்றும் குரு (தனுசு ராசி அதிபதி) இருவரும் தங்கள் நீண்ட-சுழற்சி ஞானத்தை உத்திராடத்துக்கு பங்களிக்கிறார்கள். 30-வருட சனி திரும்பல் மற்றும் 12-வருட குரு திரும்பல் இயற்கையான திட்டமிடல் அடிவானங்கள்." },
      { label: "மீள்திறன் கண்ணியம்",          desc: "தடைகள், இடையூறுகள், தாமதங்கள் — பிற்கால வெற்றியின் இயற்கையான நிலம் — உத்திராடத்தால் பதற்றமான எதிர்வினையுடன் அல்ல, முயற்சியின் தரத்தாலேயே முடிவு ஏற்கனவே தீர்மானிக்கப்பட்டது என்று அறிந்தவரின் அமைதியான கண்ணியத்துடன் சந்திக்கப்படுகிறது." },
    ],
    careerAbilityLabels: ["மூலோபாய தலைமை & ஆட்சி", "சட்டம் & அரசியலமைப்பு அதிகாரம்", "தத்துவம் & உயர் கற்பித்தல்", "நீண்ட-கால திட்டமிடல் & செயல்படுத்தல்", "இராணுவம் & பாதுகாப்பு சேவை"],
    careerClusters: [
      { title: "ஆட்சி & அரசியலமைப்பு அதிகாரம்", desc: "அரசாங்க தலைமை, அரசியலமைப்பு சட்டம், பொது நிர்வாகம் — பகிரப்பட்ட வாழ்க்கையை நிர்வகிக்கும் கட்டமைப்புகளுக்கு பயன்படுத்தப்படும் உத்திராடத்தின் நெறிமுறை அதிகாரம்." },
      { title: "இராணுவம் & பாதுகாப்பு தலைமை",   desc: "இராணுவ கட்டளை, காவல் மற்றும் நீதித்துறை தலைமை, பாதுகாப்பு நிறுவன சேவை — நீட்டிக்கப்பட்ட காலங்களுக்கு கஷ்டமான நிலத்தில் நிற்கும் விருப்பம்." },
      { title: "தத்துவம் & கல்வி தலைமை",        desc: "பல்கலைக்கழக தலைமை, தத்துவ மரபு கட்டிடம், அறிவு நிறுவனங்களின் நீண்ட-கால வளர்ச்சி." },
      { title: "மூலோபாய கார்ப்பரேட் தலைமை",    desc: "நீண்ட-அடிவான கார்ப்பரேட் மூலோபாயம், நிறுவன மாற்றம், தசகங்களில் வெற்றியை அளவிடும் நிறுவனங்களில் CEO பங்கு." },
      { title: "சர்வதேச சட்டம் & நீதி",        desc: "சர்வதேச சட்ட கட்டமைப்புகள், நீதி நிறுவனங்கள், நெறிமுறை கொள்கை கட்டிடக்கலை." },
      { title: "உள்கட்டமைப்பு & நீண்ட-கால பொறியியல்", desc: "சிவில் பொறியியல், உள்கட்டமைப்பு வளர்ச்சி, தலைமுறைகளுக்கு சேவை செய்வதை உடல் ரீதியாக கட்டுவது." },
    ],
    modernApps: [
      { title: "ஆட்சி & கொள்கை தொழில்நுட்பம்",  desc: "அரசாங்க டிஜிட்டல் மாற்றம், கொள்கை பகுப்பாய்வு தளங்கள், பொது நிர்வாக தொழில்நுட்பம்." },
      { title: "பாதுகாப்பு & நீதி தொழில்நுட்பம்", desc: "குற்றவியல் நீதி தொழில்நுட்பம், பாதுகாப்பு நுண்ணறிவு தளங்கள், பாதுகாப்பு நிறுவன பயன்பாடுகள்." },
      { title: "கல்வி & ஆராய்ச்சி நிறுவனங்கள் தொழில்நுட்பம்", desc: "பல்கலைக்கழக தொழில்நுட்பம் தளங்கள், ஆராய்ச்சி நிறுவன மேலாண்மை, நீண்ட-கால கல்வி நுண்ணறிவு கருவிகள்." },
      { title: "நீண்ட-அடிவான மூலோபாய தொழில்நுட்பம்", desc: "சூழல் திட்டமிடல் தளங்கள், பல-தசக மூலோபாய கருவிகள், நிறுவன நீண்ட-விளையாட்டு நுண்ணறிவு பயன்பாடுகள்." },
      { title: "சட்டம் & சர்வதேச கட்டமைப்பு தொழில்நுட்பம்", desc: "சர்வதேச சட்ட தளங்கள், நீதி கட்டமைப்பு தொழில்நுட்பம், நெறிமுறை கொள்கை நுண்ணறிவு கருவிகள்." },
      { title: "உள்கட்டமைப்பு & பொறியியல் தொழில்நுட்பம்", desc: "உள்கட்டமைப்பு நுண்ணறிவு தளங்கள், சிவில் பொறியியல் தொழில்நுட்பம், நீண்ட-கால திட்ட மேலாண்மை கருவிகள்." },
    ],
    dashaThemes: [
      "சூரிய ஒளியில் பிறப்பு — சூரியன் ஆரம்பம் (தனுசு பாதம்: ராசி அதிபதியின் அடையாளம்)",
      "உணர்வு ஆழப்படுத்தல் — சந்திர பள்ளிக் காலம், ராசி அதிபதி புக்திகள்",
      "முதல் போராட்டம் — செவ்வாய் போட்டி, நெறிமுறைச் சோதனை",
      "உலகச் சந்திப்பு — ராகு விரிவாக்கம், திருமணம், தொழில் கட்டுமானம்",
      "ராசி அதிபதி (தனுசு) / ஆதரவு ஞானம் (மகரம்) — குரு தசை",
      "ராசி அதிபதி (மகரம்) / கட்டமைப்புத் தேர்ச்சி (தனுசு) — சனி தசை",
      "தெளிவான வெளிப்பாடு — புதன் நீண்டகால மரபு",
      "இறுதி விடுதல் — கேது முடிவு",
    ],
    dashaDetails: [
      {
        expect: "உத்திராடம் சூரிய தசையில் தொடங்குகிறது — அசாதாரண சூரியத் தெளிவு, அதிகாரம், நோக்கத்தின் தொடக்கம். சூரியன் குறுகிய தொடக்க தசை; பிறக்கும்போது மீதமுள்ள இருப்பு முதல் பாதத்தில் நீளமாகவும் நான்காம் பாதத்தில் சிறிதாகவும் இருக்கும் — இந்த தசைக்குக் காட்டப்படும் வரம்பு அதைச் சொல்கிறது. தனுசு பாத (முதல் பாதம்) ஜாதகர்களுக்கு, சூரிய தசைத் தொடக்கம் தனுசு தத்துவக் களத்தை சூரியன் ஆரம்பத்திலேயே ஒளிரச் செய்யும் தரத்தைக் கொண்டுள்ளது: சூரியத்தன்மை கொண்ட, நோக்கமுள்ள, பெரும்பாலும் விதி பற்றிய அசாதாரண உணர்வு அல்லது வாழ்வு எதற்காக என்ற தெளிவால் குறிக்கப்படும் குழந்தைப் பருவம். மகர பாத (இரண்டாம் முதல் நான்காம் பாதம்) ஜாதகர்களுக்கு, சூரிய தசை ராசியின் சனி ஆட்சிக்கு முன்பான சக்திவாய்ந்த ஆனால் சிறிய தொடக்கம் — நீண்ட சனி ஒழுக்கம் தொடங்கும் முன் முதல் சூரிய அனுபவம்.",
        navigate: "கைக்குழந்தை, இளம் குழந்தையில் சூரியனின் அதிகாரம் ஒரு வகை கோரும் இருப்பை உருவாக்கலாம் — தான் என்ன விரும்புகிறோம், ஏன் என்று அறிந்த, சுயபோதம் ஏற்கனவே வியக்கத்தக்க தெளிவுடன் உள்ள உத்திராடக் குழந்தை. உடல் கவலைகள்: இதயம், கண்கள், செரிமான நெருப்பு. சூரிய–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஆரம்பகால நிலையான தன்மையில் எதிர்பாராத குலைவைக் கொண்டுவரலாம்.",
        focus: "தனுசு பாத உத்திராடத்திற்கு: ஞாயிற்றுக்கிழமை சூரிய வழிபாடும், உங்கள் ராசி அதிபதி குரு ஆளப்போகும் தத்துவ வரம்பை வளர்ப்பதும். மகர பாதங்களுக்கு: ஞாயிற்றுக்கிழமை சூரிய வழிபாடும், உங்கள் ராசி அதிபதி சனி கோரப்போகும் ஒழுக்கம், பொறுமை, கட்டமைக்கப்பட்ட உலக ஈடுபாட்டை ஆரம்பத்திலேயே நிறுவுவதும். நீண்ட ஆட்டம் தொடங்கும் முன்பான சுருக்கமான, பிரகாசமான முன்னுரை சூரிய தசை.",
      },
      {
        expect: "சந்திர தசை உத்திராடத்தை பள்ளிக் காலம் வழியாக அழைத்துச் சென்று, மற்றபடி நோக்கமுள்ள, கட்டமைக்கப்பட்ட தொடக்கத்துக்கு உணர்வுக் கடலைக் கொண்டுவருகிறது; குறைந்த இருப்பில் பள்ளிக் காலத்தின் நடுப்பகுதி வரை, நீண்ட இருப்பில் அதன் முடிவு வரை. வாழ்நாள் முழுவதும் திறம்படத் தலைமை தாங்க உத்திராடத்திற்குத் தேவையான பச்சாதாபமும் உறவு நுண்ணறிவும் — தொலைநோக்கும் நெறிமுறை முதுகெலும்பும் மட்டுமல்ல, பிறர் உணர்வதை புரிந்துகொண்டு அதற்கேற்ப தலைமையை அளவீடு செய்யும் ஆற்றல் — பள்ளி ஆண்டுகளில் வளர்கின்றன. பல உத்திராடங்களுக்கு, சந்திர தசை ஆழ்ந்த நட்பு உருவாகும் அல்லது இந்தக் குழந்தை உண்மையில் யார் என்பதைத் தெளிவாகக் காணும் ஆசிரியரைச் சந்திக்கும் காலம்.",
        navigate: "உத்திராடத்திற்கு சந்திரனின் முதன்மைச் சவால் உணர்வு குழப்பத்துடனான சந்திப்பு — நோக்கமுள்ள, கட்டமைக்கப்பட்ட குணம், உணர்வு உலகம் கட்டமைப்புக்கு எதிர்ப்புக் காட்டுவதை உண்மையில் சவாலாகக் காண்கிறது. உடல் கவலைகள்: செரிமானம், நிணநீர், உடலின் திரவ சமநிலை. மகர பாதங்களுக்கு சந்திர–சனி புக்தி அல்லது தனுசு பாதத்துக்கு சந்திர–குரு புக்தி (ஒவ்வொன்றும் எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ராசி அதிபதி சாயல் கொண்ட துணைக் காலங்களாகக் கவனிக்கத்தக்கவை.",
        focus: "திங்கட்கிழமை சந்திர வழிபாடும், நோக்கமுள்ள, கட்டமைக்கப்பட்ட இயல்பான சாய்வுடன் உணர்வு நுண்ணறிவையும் வேண்டுமென்றே வளர்ப்பதும். தனுசு பாதம்: சந்திர–குரு புக்தி ஒரு ராசி அதிபதி துணைக் கால அடையாளம் — தத்துவத் திறப்பு, ஞானமுள்ள ஆசிரியருடன் சந்திப்பு, அல்லது முதல் தீவிர அறிவு அல்லது ஆன்மீகத் தாக்கம். மகர பாதங்கள்: சந்திர–சனி புக்தி ஒரு ராசி அதிபதி துணைக் கால அடையாளம் — முதிர்ந்த உத்திராடத்தை வரையறுக்கப்போகும் கட்டமைக்கப்பட்ட ஒழுக்கமும் பொறுமையான நீண்டகாலப் பார்வையும் குறித்த ஆரம்ப அனுபவம்.",
      },
      {
        expect: "செவ்வாய் தசை உத்திராடத்தின் நோக்கமுள்ள, கட்டமைக்கப்பட்ட குணத்துக்கு போட்டிச் செயலின் திசைப்பட்ட நெருப்பைக் கொண்டுவருகிறது; இது வளரிளம் பருவத்திலிருந்து இளம் வயது வந்த காலம் நோக்கிச் செல்கிறது; நீண்ட இருப்பில் பல்கலைக்கழக ஆண்டுகளையும் முதல் தொழில் அடிகளையும் உள்ளடக்குகிறது. உத்திராட குணம் — நெறிமுறை அதிகாரம், நீண்டகாலப் பார்வை, உலகளாவிய நோக்கு — இப்போது செவ்வாயின் குவிந்த தீவிரத்துடன் கல்வி, ஆரம்பத் தொழிலின் உடனடிப் போட்டி யதார்த்தங்களைச் சந்திக்கிறது. பல உத்திராடங்களுக்கு, செவ்வாய் தசையில் நெறிமுறை முதுகெலும்பின் முதல் தீவிரச் சோதனை உள்ளது: விடாமுயற்சி, நேர்மையின் சரியான கலவையால் தீர்க்க முடியாத சூழ்நிலை, சமரசம் வழங்கப்படும்போது மறுக்க வேண்டியது.",
        navigate: "உத்திராடத்திற்கு செவ்வாயின் முதன்மைச் சவால், திசைப்பட்ட நெருப்பின் பொறுமையின்மை நீண்டகாலப் பார்வை கொண்ட குணத்தின் பொறுமையைச் சந்திப்பது. உத்திராடத்தின் வெற்றி எப்போதும் பிந்தைய வெற்றி; எல்லாவற்றையும் சரியாகச் செய்தும் உடனே வெல்லாத முதல் குறிப்பிடத்தக்க அனுபவத்தை செவ்வாய் தசை அடிக்கடி தருகிறது — நீண்ட வளைவை நம்புமாறு அழைப்பு. தனுசு பாதத்துக்கு செவ்வாய்–குரு புக்தி அல்லது மகர பாதங்களுக்கு செவ்வாய்–சனி புக்தி (ஒவ்வொன்றும் எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ராசி அதிபதி இருப்பைக் கொண்டுள்ளன.",
        focus: "செவ்வாய்க்கிழமை செவ்வாய் சன்னதி வழிபாடும், உறுதியுடன் பொறுமையையும் செயலில் வளர்ப்பதும் — நீண்ட ஆட்டத்துக்கு இரண்டு குணங்களும் மாறி மாறி அல்ல, ஒரே நேரத்தில் தேவை என்ற புரிதல். தனுசு பாதம்: செவ்வாய்–குரு புக்தி ஒரு ராசி அதிபதி அடையாளம். மகர பாதங்கள்: செவ்வாய்–சனி புக்தி ஒரு ராசி அதிபதி அடையாளம் — உத்திராடத்துக்கு சனி அளிக்கும் பங்களிப்பின் தன்மையான கட்டமைக்கப்பட்ட ஒழுக்கம், பொறுமையான சகிப்பு, அல்லது குறிப்பிடத்தக்க நிறுவனச் சந்திப்பின் அனுபவம்.",
      },
      {
        expect: "ராகு தசை, உத்திராடத்தின் நோக்கும் நெறிமுறை அதிகாரமும் உலகின் முழுச் சிக்கலையும் — உத்திராடத்தின் நெறிமுறைத் தரங்கள், நீண்டகாலப் பார்வை, உலகளாவிய நோக்கு ஆகியவற்றைப் பகிராத உலகின் பகுதிகளையும் — சந்திக்கும் காலம். இது இளம் வயது வந்த காலத்தில் தொடங்கி, பணி வாழ்வின் கட்டுமான ஆண்டுகள் வழியாகச் செல்கிறது. ராகு தசையில் தொழில் வேகமாகக் கட்டப்படுகிறது; தொழில்முறை அங்கீகாரம் வருகிறது; உத்திராடத்தின் நோக்கமுள்ள நுண்ணறிவும் ராகுவின் விரிந்த இலட்சியமும் இணைந்து குறிப்பிடத்தக்க தொழில் சாதனைகளை உருவாக்குகின்றன. திருமணமும் குடும்ப அமைவும் இந்தத் தசைக்குள் அமையலாம். சாயாக் கிரகத்துக்குத் திருமணக் காரகத்துவம் இல்லை. ராகு தசைக்குள் திருமணம் அமைந்தால், அது ராகுவைக் கொண்டு அல்ல — ராகு நின்ற ராசியின் அதிபதி, ஜாதகத்தின் ஏழாம் வீடு, அதன் அதிபதி ஆகியவற்றைக் கொண்டு, சுக்கிரனையும் குருவையும் காரகர்களாகக் கொண்டு பார்க்கப்படுகிறது. அது ஒரு நிலையான காலம் அல்ல, ஒரு போக்கே.",
        navigate: "உத்திராடத்திற்கு ராகுவின் முதன்மைச் சவால், நெறிமுறை முதுகெலும்பின் வசதி எல்லைக்கு அப்பால் இலட்சியம் பெருகுவது — ராகுவின் விரிவடையும் களத்தில் உலகின் வேகம் தன் நேர்மையின் வேகத்தை விட அதிகம் என்று கண்டுபிடிக்கும் நீண்டகாலப் பார்வை கொண்ட நபர். பிந்தைய வெற்றிக்கு, சமரசத்துக்கான உலகின் கோரிக்கைகளின் முன் நெறிமுறைத் தரத்தை இழக்காமல் இருக்க வேண்டும். தனுசு பாதத்துக்கு ராகு–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) பெரிய விரிவாக்கமும் சாத்தியமான திருப்புமுனையும் கொண்ட ராசி அதிபதி சாளரம்.",
        focus: "சனிக்கிழமை ராகு சன்னதி வழிபாடும், ராகுவின் விரிந்த இலட்சியத்தின் முன் நெறிமுறை முதுகெலும்பை வேண்டுமென்றே பேணுவதும். தனுசு பாதம்: ராகு–குரு புக்தி ஒரு முக்கிய ராசி அதிபதி அடையாளம் — தத்துவ விரிவு, சாத்தியமான ஆன்மீகத் திருப்புமுனை, அல்லது பெரிய தொழில்முறை முன்னேற்றத்தின் காலம். மகர பாதங்கள்: ராகு–சனி புக்தி ஒரு ராசி அதிபதி அடையாளம் — கட்டமைப்பு ஒழுக்கம், நிறுவனச் சந்திப்பு, அல்லது நீண்டகாலப் பொறுமையின் தீர்மானமான சோதனையின் காலம். ஒவ்வொன்றும் எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்.",
      },
      {
        expect: "தொழில் வாழ்வின் உச்சத்தில் வரும் குரு தசை தனுசு பாத (முதல் பாதம்) உத்திராடத்திற்கு ராசி அதிபதியின் வருகை. தனுசு பாதத்தில் பிறந்தவர்களுக்கு, குரு உங்கள் ராசி அதிபதி — அவரது தசை முழு வாழ்வின் மிக விரிந்த, ஞானமுள்ள, தத்துவ ரீதியாகச் செழிப்பான காலம். விஸ்வதேவர்களின் உலகளாவிய நோக்கு குருவின் தத்துவ அகலத்துடன் சேர்ந்து, அதிகபட்ச கற்பிக்கும் அதிகாரம், நிறுவனத் தலைமை, ஞானக் கடத்தலின் காலத்தை உருவாக்குகிறது. தனுசு பாத ஜாதகர்களுக்கு மூத்த தலைமைப் பதவிகள், குறிப்பிடத்தக்க வெளியீடுகள், உத்திராடத்தின் செல்வாக்கின் அகன்ற எல்லை பொதுவாக குரு தசையில் வருகின்றன. மகர பாத (இரண்டாம் முதல் நான்காம் பாதம்) உத்திராடத்திற்கு, குரு தசை சக்திவாய்ந்த தத்துவ ஆதரவின் காலம் — ராசி அதிபதி இல்லையெனினும், நீண்டகாலப் பார்வை கொண்ட பயிற்சியாளரின் ஞானத்தை ஆழமாக்கி, நோக்கை அகலமாக்கும் சுப, விரிந்த தாக்கம்.",
        navigate: "உத்திராடத்திற்கு குருவின் முதன்மை நிழல் உலகளாவிய நோக்கு கொண்டவரின் தத்துவப் பெருக்கம் — ராகு தசை முழுவதும் நோக்கு நிரூபிக்கப்பட்டவர், உலகளாவியது பற்றிய தன் நோக்கே உலகளாவியது என்று நம்பத் தொடங்குவது. விஸ்வதேவர்களின் கொடைக்கு, அவர்கள் ஒருவர் அல்ல, பல தெய்வங்கள் என்பதை நினைவில் கொள்ள வேண்டும் — உலகளாவிய நோக்கு எப்போதும் ஒரு குழுப்பாடல், தனிப்பாடல் அல்ல. குரு–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) கட்டமைப்புச் சோதனையையும் செம்மைப்படுத்தலையும் கொண்டுவருகிறது.",
        focus: "வியாழக்கிழமை பிரஹஸ்பதி வழிபாடு. தனுசு பாதம்: குரு தசை முதல் பாதி வாழ்க்கையின் தத்துவ முடிவு. மகர பாதங்கள்: சனியின் கட்டமைப்பு ஒழுக்கத்தை விரிவாக்கும் ஞானமாக குருவின் விரிவான தத்துவ ஆதரவை பெறுங்கள்.",
      },
      {
        expect: "மூத்த ஆண்டுகளில் வரும் சனி தசை மகர பாத (இரண்டாம் முதல் நான்காம் பாதம்) உத்திராடத்திற்கு ராசி அதிபதியின் வருகை. மகரத்தில் பிறந்தவர்களுக்கு, சனி உங்கள் ராசி அதிபதி — அவரது நீண்ட தசை வாழ்வின் கட்டமைப்பில் மிகத் தேர்ந்த, பொறுமையுடன் ஒழுக்கமான, நிறுவன ரீதியாக மிகச் சக்திவாய்ந்த காலம். சூரிய தசையின் சுருக்கமான தொடக்கத்திலிருந்து திரண்ட நீண்டகால ஞானம் இப்போது ஆள்கிறது; ராகு, குரு தசைகளில் கட்டிய நிறுவனங்கள் தங்கள் முதிர்ச்சியை அடைகின்றன; சனி தசையில் உத்திராடம் தரும் தலைமை, உண்மையில் நீண்ட ஆட்டத்தை ஆடி அதன் அறுவடையை அடைந்த ஒருவரின் அதிகாரத்தைச் சுமக்கிறது. தனுசு பாத (முதல் பாதம்) உத்திராடத்திற்கு, சனி தசை சக்திவாய்ந்த கட்டமைப்பு ஆதரவின் காலம் — ராசி அதிபதி இல்லையெனினும், தத்துவ தரிசனத்தை நடைமுறை யதார்த்தத்தில் அடித்தளமிடும் ஒழுக்கமூட்டும், தெளிவுபடுத்தும் சக்தி.",
        navigate: "உத்திராடத்திற்கு சனியின் முதன்மைச் சவால் கட்டமைப்புத் தேர்ச்சியாளரின் இறுக்கம் — நீண்டகால அணுகுமுறையைச் சரியாகக் கண்டறிந்த பொறுமையான நபர், நீண்ட ஆட்டமே சரி என்று வலியுறுத்தத் தொடங்குவது. உலகளாவிய நோக்குக்கு விடாமுயற்சியுடன் நெகிழ்வும் தேவை. சனியின் நீண்ட தசை முழுவதும் உடல் பராமரிப்பும் ஆற்றல் மேலாண்மையும் அதிகரித்து முக்கியமாகின்றன.",
        focus: "சனிக்கிழமை சனி வழிபாடு, ஆஞ்சநேயர் வழிபாடு. மகர பாதங்கள்: சனி தசை பொறுமையின் அறுவடை. தனுசு பாதம்: தத்துவ பார்வையை கட்டியும் பராமரிக்கும் வலிமையுள்ள கட்டமைப்பாக சனியின் கட்டமைப்பு ஒழுக்கத்தை பெறுங்கள்.",
      },
      {
        expect: "மிக முதிர்ந்த வயதில் வரும் புதன் தசை உத்திராடத்தின் மூத்த ஆண்டுகளுக்கு மனதின் துல்லியத்தையும் தெளிவாக வெளிப்படுத்தும் திறனையும் கொண்டுவருகிறது. உலகளாவிய நோக்கும் நீண்டகால ஞானமும் இப்போது புதனின் தெளிவான வெளிப்பாட்டுக் கொடையைச் சந்திக்கின்றன — என்ன சொல்ல வேண்டும் என்று பல தசகங்களாகக் கவனமாகச் சிந்தித்தவரிடமிருந்து மட்டும் வரும் சுருக்கமும் துல்லியமும் கொண்டு பேசும் மூத்தவர். எழுத்து, கற்பித்தல், வாழ்வு முழுவதும் திரண்ட நிறுவன ஞானத்தின் கடத்தல் ஆகியவை புதன் தசையின் இயல்பான வெளிப்பாடுகள்.",
        navigate: "உடல் பராமரிப்பு மற்றும் நரம்பு மண்டலத்தின் திரட்டப்பட்ட கோரிக்கைகளை நிர்வகிக்கவும். இந்த வயதில் புதனுக்கு நிலையான ஆற்றல் மேலாண்மையும் வேண்டுமென்ற நிதானமும் தேவை.",
        focus: "புதன்கிழமை புதன் வழிபாடு, வெளிப்படுத்தலின் செயலூக்கமான பயிற்சி — நீண்டகால ஞானத்தை, ஜாதகரைக் கடந்து நிலைக்கும் வடிவங்களில் எழுதுதல், பதிவு செய்தல், கடத்துதல். பிற்கால வெற்றியின் மரபு பெரும்பாலும் புதன் தசையில் எழுதப்படுகிறது.",
      },
      {
        expect: "இந்த வரிசையின் கடைசி தசையான கேது தசையை மிகச் சில உத்திராட ஆத்மாக்களே அடைகின்றன. வருபவர்களுக்கு, ஒரு வாழ்நாள் நோக்கமுள்ள, நெறிமுறையான, நீண்டகால ஈடுபாட்டால் கட்டிய அடையாளத்தின் இறுதி விடுதலையை கேது கொண்டுவருகிறார். தோற்கடிக்கப்படாதவர், கேதுவின் நிறைவில், வெற்றி ஒருபோதும் தனிப்பட்டதல்ல — அது எப்போதும் உலகளாவியதற்கான சேவையே என்று கண்டுபிடிக்கிறார்.",
        navigate: "முழுமையான, அர்ப்பணிப்புடன் கூடிய உடல் பராமரிப்பு. இந்த மிக முதிர்ந்த வயதில் கேது இருப்பின் கொடை — ஒருபோதும் அத்தியாவசியமாக இல்லாதவற்றை உரித்து, எப்போதும் இருந்ததை விட்டுச்செல்வது.",
        focus: "விநாயகர் வழிபாடு, பித்ரு தர்ப்பணம், முன்னோர் சடங்குகள். விஸ்வதேவர்கள் தங்களில் ஒருவரை உலகளாவியதற்குள் மீண்டும் ஏற்றுக்கொள்கிறார்கள்.",
      },
    ],
    spirituality: [
      { title: "விஸ்வதேவர்கள் வழிபாடு & உலகளாவிய பந்தயோன்",  desc: "விஸ்வதேவர்கள் — எல்லா-கடவுள்கள், தெய்வீக கொள்கைகளின் உலகளாவிய சட்டசபை — உத்திராடத்தின் தலைமை தெய்வங்கள். வேத ஸ்துதிகள் (விஸ்வதேவர்கள் சூக்தம்) மூலம் விஸ்வதேவர்கள் வழிபாடு, முழு தெய்வீக சட்டசபையை கௌரவிக்கும் யஜ்ஞங்களில் பங்கேற்பு." },
      { title: "குரு (தனுசு) / சனி (மகர) பக்தி",              desc: "தனுசு பாதம்: வியாழக்கிழமை பிரஹஸ்பதி–தட்சிணாமூர்த்தி வழிபாடு மற்றும் தத்துவ ஞான மரபுகள். மகர பாதங்கள்: சனிக்கிழமை சனி பூஜை மற்றும் பொறுமையான, கட்டமைக்கப்பட்ட பக்தியின் நடைமுறை." },
      { title: "தர்மத்தைக் கடைப்பிடித்தல் ஆன்மீக அடித்தளமாக",             desc: "உத்திராடத்துக்கு, தர்மத்தைக் கடைப்பிடித்தல் — தனிப்பட்ட நலனை விட உலகளாவியதற்கு சேவை செய்யும் நெறிமுறை நடவடிக்கை — ஆன்மீகப் பயிற்சியிலிருந்து தனியானதல்ல; அதன் மிக உயர்ந்த வெளிப்பாடே." },
    ],
    guidance: "பிற்கால வெற்றி மிகவும் திறமையானவர்களுக்கும் மிகவும் அதிர்ஷ்டமானவர்களுக்கும் வருவதில்லை ஆனால் தொடர்வதற்கு தயாராக இருந்தவர்களுக்கு — கஷ்டத்தில், தாமதத்தில், தடைகளில், நெறிமுறை தரம் வசதியான குறுக்குவழியை மறுக்க வேண்டும் என்ற தருணத்தில். விஸ்வதேவர்கள் உங்களுக்கு விடாமுயற்சியின் கொடையை கொடுத்தனர், ஏனென்றால் உலகுக்கு அது தேவைப்படும் என்று அவர்களுக்கு தெரியும். நீண்ட விளையாட்டை முன்னேற்றத்தின் வேகத்துடன் முடிவின் நிச்சயத்தை ஒருபோதும் குழப்பாதவர் வெல்கிறார். பொறுமையுடன் முன்னேறுங்கள், நெறிமுறைகளுடன் நிர்வகியுங்கள், மற்றும் பிற்கால வெற்றி வரும்போது அது சரியாக அதற்கு செலவாவதற்கு மதிப்புள்ளது என்று நம்புங்கள்.",
    careerNote: "நீண்ட பயணம், நெறிமுறை முதுகுத்தண்டு, மற்றும் ஆரம்ப வெற்றியின் திடீர் ஊக்கத்தின் மூலம் அல்லாமல் நீடித்த சிரமத்தின் மூலம் வழிகாட்டும் விருப்பம் ஆகியவை வரையறுக்கும் குணங்களாக இருக்கும் இடங்களில் உத்திராடம் சிறப்பாக செயல்படுகிறது.",
    modernLead: "உத்திராடத்தின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "தோற்கடிக்க முடியாத விடாமுயற்சி, நெறிமுறை அதிகாரம், நீண்ட-விளையாட்டு தேர்ச்சி உத்திராடத்தின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function UttaraAshadhaVisualPage() {
  return <NatchathiramVisualContent data={UTTARA_ASHADHA} visual={UTTARA_ASHADHA_VISUAL} timings={dasaTimingsFor(UTTARA_ASHADHA.number)} />;
}
