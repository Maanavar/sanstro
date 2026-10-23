import type { Metadata } from "next";
import { withTamilTwin } from "@/lib/localized-metadata";
import { withDasaTimingHold } from "@/lib/natchathiram-dasa-hold";
import { dasaTimingsFor } from "@/lib/natchathiram-dasa-timings";
import { nakshatraDisplayName } from "@/lib/nakshatra-display-name";
import { natchathiramVisualTa } from "@/lib/marketing-seo-ta";
import { MULA } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

const EN_METADATA: Metadata = {
  title: `${nakshatraDisplayName(MULA.number, "en")} — Visual Profile`,
  description: "Visual profile of Moolam Nakshathiram: personality traits, career strengths, dasa timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/mula/visual" },
  openGraph: {
    title: `${nakshatraDisplayName(MULA.number, "en")} — Visual Profile`,
    description: "Visual profile of Moolam Nakshathiram: personality traits, career strengths, dasa timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/mula/visual",
    type: "article",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withDasaTimingHold(await withTamilTwin(EN_METADATA, "/natchathiram/mula/visual", natchathiramVisualTa("mula")!), "mula");
}

const MULA_VISUAL: NatchathiramVisualData = {
  atAGlance: [
    { label: "Root-Level Investigation",   score: 97 },
    { label: "Transformative Dissolution",  score: 96 },
    { label: "Philosophical Depth",         score: 95 },
    { label: "Dhanus Idealism",             score: 93 },
    { label: "Regenerative Power",          score: 94 },
  ],

  radar: {
    labels: ["Investigation", "Dissolution", "Philosophy", "Idealism", "Regeneration", "Courage"],
    values: [97, 96, 95, 93, 94, 92],
  },

  coreStrengths: [
    { symbol: "◎", label: "Root-Level Investigation",    score: 97, desc: "Nirriti's authority to go to the absolute root — Mula natives do not stop at explanations; they dismantle until they reach the original cause, the founding assumption, the seed." },
    { symbol: "◈", label: "Transformative Dissolution",  score: 96, desc: "The nakshathiram of endings that make new beginnings possible — Mula's capacity to dissolve what must be dissolved, without sentimentality, is a rare and necessary power." },
    { symbol: "⚡", label: "Philosophical Depth",         score: 95, desc: "Dhanus and Ketu together — the arrow of philosophical inquiry combined with the capacity to look beyond the visible. Mula reaches for the ultimate questions with genuine commitment." },
    { symbol: "♥", label: "Dhanus Idealism",             score: 93, desc: "Jupiter's optimism and expansiveness in Dhanus — Mula carries a genuine belief in the possibility of transformation, even when they are the instrument of the dissolution that makes it necessary." },
    { symbol: "△", label: "Regenerative Power",          score: 94, desc: "What Mula dissolves is never the end — it is always the precondition for a more authentic emergence. The regenerative intelligence that follows Mula's destruction is its deepest gift." },
    { symbol: "☽", label: "Unconditioned Honesty",       score: 92, desc: "Mula does not maintain comfortable illusions — not from harshness but from a genuine understanding that honesty, however uncomfortable, is always more useful than the comfortable lie." },
  ],

  careerAbilities: [
    { label: "Research & Root Cause Analysis",  score: 97 },
    { label: "Philosophy & Spiritual Sciences", score: 95 },
    { label: "Psychology & Deep Therapy",       score: 94 },
    { label: "Strategic Dissolution & Reform",  score: 93 },
    { label: "Teaching & Higher Knowledge",     score: 92 },
  ],
  careerNote: "Mula thrives wherever going to the absolute root of a problem — the founding assumption, the original cause, the structural flaw — is not just permitted but required. They are the investigators, philosophers, reformers, and therapists who make genuine transformation possible.",

  careerClusters: [
    { symbol: "◎", title: "Root Cause Analysis & Investigation", desc: "Forensic investigation, systemic root cause analysis, founding assumption audits — Mula's unconditioned penetration applied professionally." },
    { symbol: "◈", title: "Philosophy & Vedic Sciences",         desc: "Academic philosophy, Vedanta, Jothidam, and any wisdom tradition that asks the questions that cannot be answered by the surface — Mula's natural domain." },
    { symbol: "⚡", title: "Systemic Reform & Restructuring",     desc: "Organisational dissolution and restructuring, institutional reform, policy transformation — the architect of necessary endings and better beginnings." },
    { symbol: "♥", title: "Psychology & Depth Therapy",         desc: "Depth psychology, trauma resolution, shadow work — the willingness to go to the root of the wound, not simply manage its symptoms." },
    { symbol: "△", title: "Academic Research & Higher Education", desc: "University-level research, doctoral investigation, the pursuit of first principles — the Dhanus love of higher knowledge in its most rigorous form." },
    { symbol: "☽", title: "Spiritual Teaching & Ashram Work",   desc: "Teaching the unconditioned wisdom traditions, ashram guidance, retreat leadership — the transmission of what cannot be packaged." },
  ],

  modernApps: [
    { symbol: "◎", title: "Systems Investigation & Forensic Tech", desc: "Root cause investigation platforms, systemic failure analysis tools, forensic intelligence technology — Mula's penetration in digital application." },
    { symbol: "◈", title: "Philosophy & Wisdom Tech",             desc: "Philosophical inquiry platforms, Vedic sciences technology, wisdom tradition apps." },
    { symbol: "⚡", title: "Organisational Reform & Strategy Tech", desc: "Restructuring intelligence platforms, institutional reform tools, dissolution-and-rebuild strategy technology." },
    { symbol: "♥", title: "Depth Psychology & Trauma Tech",       desc: "Shadow work platforms, root-cause therapy applications, depth psychology technology." },
    { symbol: "△", title: "Research & Education Tech",            desc: "Academic research platforms, higher education technology, first-principles investigation tools." },
    { symbol: "☽", title: "Spiritual & Retreat Technology",       desc: "Ashram management platforms, spiritual retreat applications, wisdom transmission technology." },
  ],

  dashaTimeline: [
    {
      planet: "Ketu", theme: "Born at the Root",
      detail: {
        expect: "Mula opens in Ketu dasa — among the most charged beginnings of all twenty-seven nakshathirams. The child born into Ketu's domain is already old: there is a quality of ancestral awareness, of having been here before, that caregivers notice from the earliest days. The family environment itself may carry unusual intensity — ancestral unresolved material, spiritual intensity, unexpected disruption, or the presence of genuine wisdom in the household. Early childhood may be marked by separations, encounters with the unfamiliar, or the unsettling sense that the obvious explanations for things are not the real explanations. This peculiar wisdom — born not from learning but from a pre-verbal understanding of how things actually work — is the gift Ketu places at Mula's foundation. Mula is born inside this dasa, so only the balance remaining at birth is lived; the pada decides how much, and the range shown for this dasa gives it.",
        navigate: "The physical constitution in Ketu dasa can show vulnerability in the areas Ketu governs: nervous system hypersensitivity, unexpected fevers, and the autoimmune domain. The family is the primary support structure; any instability in the family environment during these early years resonates through the Mula life structure with unusual amplitude. Pitru dosha in the family line, if present, often shows its effects in Mula's Ketu dasa infancy. The Ketu–Jupiter bhukti (the table below gives when it begins and how long it lasts; for the shorter balances it falls before birth) is noteworthy — Jupiter is the rasi lord, and even this brief sub-period in infancy can mark a moment of unusual brightness, a teacher figure, or a developmental leap.",
        focus: "Ancestral rites — pitru tharpanam and family shrine maintenance — and Ganapati worship are the most important spiritual supports of Ketu dasa. The Mula child thrives in environments that honour the invisible, acknowledge the ancestral, and do not demand premature rationalism. Avoid exposing the Ketu dasa Mula child to environments that demand conformity to surface explanations they already know are insufficient.",
      },
    },
    {
      planet: "Venus", theme: "Beauty as the Bridge",
      detail: {
        expect: "Venus dasa is the great civilising arc of Mula's early life; it opens in childhood and carries through school and college, running on toward the start of working life. After the intensity and ancestral weight of Ketu's opening, Venus offers beauty, relationship, creative expression, and worldly engagement as the training ground for the philosophical depth that Mula carries. The school years see a significant social and aesthetic opening: the Mula child who was perhaps withdrawn or unsettling in Ketu dasa begins to find their way into friendships, creative expression, and aesthetic engagement with the world. Higher education and the first serious romantic relationships develop in the later part of the dasa. The first major philosophical or spiritual influence — a teacher, a book, a tradition — typically enters in the Venus–Rahu or Venus–Jupiter bhukti.",
        navigate: "Venus's primary challenge for Mula is the temptation toward comfort — the person whose nature is dissolution discovering the pleasures of beauty and abundance and becoming, temporarily, attached to not-dissolving. This is not wrong; it is the necessary human experience of what it is to be attached before the real teaching of letting go can be understood from the inside. The Venus–Jupiter bhukti (the table below gives when it begins and how long it lasts) carries the rasi lord's presence in a luminous window — a philosophical opening, an encounter with a wise teacher, or the first serious questioning of received belief.",
        focus: "Friday Lakshmi and Saraswati worship — the beauty and wisdom aspects of Venus aligned with Mula's deeper nature. Watch the Venus–Jupiter bhukti (the bhukti table below gives when it begins and how long it lasts) as a rasi lord flag: where the Ketu balance at birth was short enough for the Ketu–Jupiter bhukti to fall before birth, this sub-period marks the first appearance of Jupiter's philosophical, wise, and expansive presence in Mula's dasa sequence after birth.",
      },
    },
    {
      planet: "Sun", theme: "The First Authority",
      detail: {
        expect: "Sun dasa is the first crystallisation of Mula's authority. In the years after university or early career exploration, the philosophical depth and root-level intelligence Mula carries begin to be recognised professionally and socially. Leadership positions are offered; the investigative or philosophical work deepens; the identity consolidates around what Mula genuinely knows rather than what they have learned to perform. For many Mula, Sun dasa is the period of the first major dissolution they choose rather than have imposed — the leaving of a career, relationship, or worldview that has been acknowledged as insufficient.",
        navigate: "Sun's primary shadow for Mula is the authority of one who knows the root — the person who has seen through the comfortable explanations can become intolerant of others who have not yet made that journey. The dissolution faculty needs to be applied to the self's certainties as readily as to external structures. The Sun–Rahu bhukti (the table below gives when it begins and how long it lasts) can bring disruption.",
        focus: "Sunday Surya worship. The authority of Sun dasa is best used in Mula's case as the authority to teach — to transmit the root-level understanding that has been accumulating since Ketu's opening, not to enforce it.",
      },
    },
    {
      planet: "Moon", theme: "The Emotional Root",
      detail: {
        expect: "Moon dasa brings the emotional dimension to Mula's investigative, philosophical intelligence. The root-level understanding that has been developing in the intellectual domain now meets the emotional roots: the family of origin patterns, the deepest relational needs and fears, the emotional inheritance that Ketu dasa began to reveal and Venus dasa began to civilise. Where marriage falls within this dasa, it is read from the seventh house and its lord, with Venus and Jupiter as the natural significators, and judged from the individual horoscope as a tendency rather than a fixed time. Children may arrive; the Mula native's role as a parent invites the question of what roots they will plant for another life. The emotional intelligence of Moon dasa, for Mula, is the intelligence of understanding the root causes of emotional experience — not just feeling them but understanding why they arise.",
        navigate: "Moon's primary challenge for Mula is the tendency to investigate rather than simply feel — the philosopher of dissolution who analyses their emotional experience rather than living inside it. Physical concerns: digestive, lymphatic, and the nervous system's accumulated tension. The Moon–Rahu bhukti (the table below gives when it begins and how long it lasts) can produce turbulence. The Moon–Jupiter bhukti is a brief but warm sub-period — the rasi lord's presence brings philosophical ease, emotional spaciousness, and possible spiritual community.",
        focus: "Monday Moon worship and the deliberate practice of emotional presence without analysis. The Moon–Jupiter bhukti (the bhukti table below gives when it begins and how long it lasts) is a rasi lord flag: Jupiter's philosophical, wise, and expansive presence arrives in the midst of Moon's emotional depth.",
      },
    },
    {
      planet: "Mars", theme: "The Dissolution Agent",
      detail: {
        expect: "Mars dasa activates the dissolution faculty of Mula's nature in its most direct and forceful expression. Where Venus offered beauty and Moon offered emotional depth, Mars offers the cutting instrument of necessary endings. For those whose professional domain is investigation, research, therapy, or philosophy, this is a period of decisive action: the publication of findings that challenge accepted structures, the therapeutic breakthrough that dissolves a long-standing wound, the philosophical formulation that dismantles a comfortable but false worldview. For those in organisational leadership, Mars dasa often brings the most significant restructuring work of the career.",
        navigate: "Mars's primary shadow for Mula is the righteous dismantler — the person who has identified the root cause of a structural problem and begins dismantling it without adequate attention to what must be preserved or the human cost of the dissolution. The Mars–Jupiter bhukti (the table below gives when it begins and how long it lasts) brings a brief but significant rasi lord sub-period — the philosophical wisdom and expansiveness of Jupiter moderating Mars's cutting edge.",
        focus: "Tuesday Mars shrine prayers. The Mars–Jupiter bhukti (the bhukti table below gives when it begins and how long it lasts) is a rasi lord flag: Jupiter arrives in Mars's forceful period as the moderating wisdom that ensures dissolution serves the larger good rather than simply satisfying the investigative impulse.",
      },
    },
    {
      planet: "Rahu", theme: "The Necessary Expansion",
      detail: {
        expect: "Rahu dasa, running from mid-life into later life, brings expansion, worldly engagement, and the testing of Mula's root-level intelligence in the broadest possible arena. The philosophical and investigative depth accumulated across Ketu, Venus, Sun, Moon, and Mars now engages with the world's complexity at scale. International work, cross-cultural philosophical exchange, or the encounter with traditions outside the birth culture are common in Rahu dasa. The Mula person who has spent decades investigating roots now discovers that roots run beneath cultures, beneath traditions, beneath the visible world — Rahu's globalising expansion is the arena in which this deeper understanding is tested.",
        navigate: "Rahu's primary shadow for Mula is the universalising of the dissolution faculty — the person who has identified patterns at their own cultural and personal root beginning to apply those patterns everywhere, without the humility that recognises the limits of any single perspective. The Rahu–Jupiter bhukti (the table below gives when it begins and how long it lasts) is the most significant sub-period — the rasi lord's presence is a major philosophical expansion and possible spiritual breakthrough.",
        focus: "Saturday Rahu shrine prayers and deliberate engagement with wisdom traditions outside the natal culture. The Rahu–Jupiter bhukti (the bhukti table below gives when it begins and how long it lasts) is a key rasi lord flag: Jupiter arrives in Rahu's expansive field as a window of major philosophical, spiritual, or wisdom-tradition deepening.",
      },
    },
    {
      planet: "Jupiter", theme: "Rasi Lord — The Philosopher's Harvest",
      detail: {
        expect: "Jupiter dasa, in later life, is the rasi lord's arrival for Mula — the planet that rules your rasi, Dhanus, now governs your dasa. For the Mula native who has spent a lifetime dissolving illusions, investigating roots, and building the understanding that comes from genuine philosophical commitment, Jupiter dasa is the harvest. The wisdom that has accumulated through Ketu's initiation, Venus's civilising, Sun's authority, Moon's emotional depth, Mars's decisive action, and Rahu's global expansion now radiates as the genuine wisdom of an elder who has actually been to the root. Teaching, transmission, grandchildren, and the building of institutions or communities that carry the root-level understanding forward are the natural expressions of Mula's Jupiter dasa.",
        navigate: "Jupiter's primary shadow in the rasi lord dasa is the temptation toward the final synthesis — the philosopher who has accumulated so much understanding that they begin to believe the synthesis is complete. For Mula, whose entire nature is to know that the root has no final floor, this is the deepest irony. The greatest Mula in Jupiter dasa are those who remain students even while transmitting. Physical care and deliberate simplicity are important.",
        focus: "Thursday Brihaspati and Dakshinamurthy worship — the guru of infinite wisdom who sits at the root of the cosmic banyan tree. Jupiter dasa is the life's philosophical culmination for Mula; give the transmission freely, hold the understanding lightly, and let the dissolution faculty continue to clarify your own certainties until the last breath.",
      },
    },
    {
      planet: "Saturn", theme: "Final Dissolution",
      detail: {
        expect: "Saturn dasa, in very advanced age, is reached by very few Mula souls. For those who arrive, Saturn brings the final, gentle dissolution of the identity that has been built across a lifetime of root-level investigation, philosophical depth, and wisdom transmission. The great dismantler meets the great disciplinarian; what remains is only what was always real.",
        navigate: "Complete and gentle physical care. Saturn at this extreme age requires consistent, devoted attention from those who love this person.",
        focus: "Saturn's dasa is the final root — the dissolution that Nirriti's nakshathiram has always been serving, now arriving as the inevitable and fully accepted completion of a life lived at depth.",
      },
    },
  ],

  spirituality: [
    {
      title: "Nirriti & Kali Worship",
      desc: "Nirriti — the deity of dissolution, the goddess who presides over endings and the releasing of what must go — is Mula's presiding deity. Kali worship, dark moon austerities, and the ancestral rites (pitru tharpanam) are Mula's deepest spiritual expressions.",
    },
    {
      title: "Vedanta & Root Wisdom Traditions",
      desc: "Vedanta — the investigation of what is ultimately real, beyond the layers of appearance — is the philosophical framework most resonant with Mula's root-seeking nature. Shankaracharya's tradition and the investigation of the Brahma Sutras are Mula's academic spiritual home.",
    },
    {
      title: "Guru Devotion & Jupiter Traditions",
      desc: "The guru lineage and the Brihaspati–Jupiter devotional tradition — Dakshinamurthy worship, the cosmic teacher who transmits by silence — are Mula's balancing spiritual practices. The dissolution of Nirriti requires the wisdom of Brihaspati to know what is worth preserving.",
    },
  ],

  guidance: "The root investigator discovers, at the root of every root, not emptiness but presence — the fullness that was there before the structures that were dissolved. You were given the faculty of dissolution not as a punishment but as a form of love: the love that refuses to allow comfortable illusions to persist when reality is available. Use the cutting faculty always in service of what is genuinely real, and remember that you yourself are also subject to dissolution — the investigation that does not include the investigator is incomplete.",

  compatibleEn: ["Thiruvathirai", "Ayilyam", "Kettai", "Pooradam", "Moolam"],
  compatibleNote: "These nakshatras complement Mula's root-seeking intelligence, philosophical depth, and transformative capacity with resonant investigation, depth wisdom, and philosophical companionship.",

  ta: {
    atAGlanceLabels: ["வேர் நிலை விசாரணை", "மாற்றும் கரைவு", "தத்துவ ஆழம்", "தனுசு இலட்சியவாதம்", "மீண்டும் உருவாக்கும் சக்தி"],
    radarLabels: ["விசாரணை", "கரைவு", "தத்துவம்", "இலட்சியவாதம்", "மீண்டும் உருவாக்கல்", "தைரியம்"],
    coreStrengths: [
      { label: "வேர் நிலை விசாரணை",    desc: "நிர்ருதியின் முழுமையான வேருக்கு செல்லும் அதிகாரம் — மூல ஜாதகர்கள் விளக்கங்களில் நிறுத்துவதில்லை; அசல் காரணம், நிறுவும் அனுமானம், விதை வரை அமைப்பை அகற்றுகிறார்கள்." },
      { label: "மாற்றும் கரைவு",        desc: "புதிய தொடக்கங்களை சாத்தியமாக்கும் முடிவுகளின் நட்சத்திரம் — மூலத்தின் திறன், உணர்வின்றி கரைய வேண்டியதை கரைக்கும், ஒரு அரிய மற்றும் அவசியமான சக்தி." },
      { label: "தத்துவ ஆழம்",           desc: "தனுசும் கேதுவும் சேர்ந்து — தத்துவ விசாரணையின் அம்பு காண முடியாத அப்பால் பார்க்கும் திறனுடன். மூலம் இறுதி கேள்விகளுக்கு உண்மையான அர்ப்பணிப்புடன் செல்கிறது." },
      { label: "தனுசு இலட்சியவாதம்",   desc: "குரு மகரத்தில் நம்பகத்தன்மை மற்றும் விரிவாக்கம் — மூலம் மாற்றத்தின் சாத்தியத்தில் உண்மையான நம்பிக்கையை சுமக்கிறது, தாங்களே தேவையான கரைவின் கருவியாக இருக்கும்போதும்." },
      { label: "மீண்டும் உருவாக்கும் சக்தி", desc: "மூலம் கரைப்பது ஒருபோதும் முடிவு அல்ல — இது எப்போதும் மிகவும் அசல் வெளிப்பாட்டுக்கான முன்நிலை. மூலத்தின் அழிவை பின்தொடரும் மீண்டும் உருவாக்கும் நுண்ணறிவு அதன் ஆழமான கொடை." },
      { label: "நிபந்தனையற்ற நேர்மை",   desc: "மூலம் வசதியான மாயைகளை பராமரிக்கவில்லை — கடுமையிலிருந்தல்ல ஆனால் நேர்மை, எவ்வளவு அசௌகரியமாக இருந்தாலும், வசதியான பொய்யை விட எப்போதும் பயனுள்ளது என்ற உண்மையான புரிதலிலிருந்து." },
    ],
    careerAbilityLabels: ["ஆராய்ச்சி & வேர் காரண பகுப்பாய்வு", "தத்துவம் & ஆன்மீக அறிவியல்கள்", "மனோவியல் & ஆழ சிகிச்சை", "மூலோபாய கரைவு & சீர்திருத்தம்", "கற்பித்தல் & உயர் அறிவு"],
    careerClusters: [
      { title: "வேர் காரண பகுப்பாய்வு & விசாரணை", desc: "தடயவியல் விசாரணை, முறைமை வேர் காரண பகுப்பாய்வு, நிறுவும் அனுமான தணிக்கைகள்." },
      { title: "தத்துவம் & வேத அறிவியல்கள்",       desc: "கல்வி தத்துவம், வேதாந்தம், ஜ்யோதிஷ், மற்றும் மேற்பரப்பால் பதிலளிக்க முடியாத கேள்விகளை கேட்கும் எந்த ஞான மரபும்." },
      { title: "முறைமை சீர்திருத்தம் & மறுகட்டமைப்பு", desc: "நிறுவன கரைவு மற்றும் மறுகட்டமைப்பு, நிறுவன சீர்திருத்தம், கொள்கை மாற்றம்." },
      { title: "மனோவியல் & ஆழ சிகிச்சை",          desc: "ஆழ மனோவியல், மனக்காயம் தீர்வு, நிழல் வேலை — காயத்தின் வேருக்கு செல்ல விருப்பம்." },
      { title: "கல்வி ஆராய்ச்சி & உயர்கல்வி",     desc: "பல்கலைக்கழக நிலை ஆராய்ச்சி, முனைவர் விசாரணை, முதல் கொள்கைகளின் தேடல்." },
      { title: "ஆன்மீக கற்பித்தல் & ஆசிரமம்",     desc: "நிபந்தனையற்ற ஞான மரபுகளை கற்பித்தல், ஆசிரம் வழிகாட்டுதல், திரும்பி செல்வதற்கான தலைமை." },
    ],
    modernApps: [
      { title: "முறைமை விசாரணை & தடயவியல் தொழில்நுட்பம்", desc: "வேர் காரண விசாரணை தளங்கள், முறைமை தோல்வி பகுப்பாய்வு கருவிகள், தடயவியல் நுண்ணறிவு தொழில்நுட்பம்." },
      { title: "தத்துவம் & ஞான தொழில்நுட்பம்",     desc: "தத்துவ விசாரணை தளங்கள், வேத அறிவியல் தொழில்நுட்பம், ஞான மரபு பயன்பாடுகள்." },
      { title: "நிறுவன சீர்திருத்தம் & மூலோபாய தொழில்நுட்பம்", desc: "மறுகட்டமைப்பு நுண்ணறிவு தளங்கள், நிறுவன சீர்திருத்த கருவிகள், கரைவு-மற்றும்-மீண்டும் கட்டுதல் மூலோபாய தொழில்நுட்பம்." },
      { title: "ஆழ மனோவியல் & மனக்காயம் தொழில்நுட்பம்", desc: "நிழல் வேலை தளங்கள், வேர் காரண சிகிச்சை பயன்பாடுகள், ஆழ மனோவியல் தொழில்நுட்பம்." },
      { title: "ஆராய்ச்சி & கல்வி தொழில்நுட்பம்",  desc: "கல்வி ஆராய்ச்சி தளங்கள், உயர்கல்வி தொழில்நுட்பம், முதல் கொள்கைகள் விசாரணை கருவிகள்." },
      { title: "ஆன்மீக & திரும்பி செல்வதற்கான தொழில்நுட்பம்", desc: "ஆசிரம் மேலாண்மை தளங்கள், ஆன்மீக திரும்பி செல்வதற்கான பயன்பாடுகள், ஞான பரிமாற்ற தொழில்நுட்பம்." },
    ],
    dashaThemes: [
      "வேரில் பிறப்பு — கேது ஆரம்பம், முன்னோர் அனுபவம்",
      "அழகு பாலமாக — சுக்கிர நாகரீகம், உலக ஈடுபாடு",
      "முதல் அதிகாரம் — சூரிய திறனாய்வு, கரைவு தொடங்குகிறது",
      "உணர்வு வேர் — சந்திர குடும்ப ஆழம்",
      "கரைவு முகவர் — செவ்வாய் முடிவுகள், அவசியமான முடிவுகள்",
      "அவசியமான விரிவாக்கம் — ராகு உலகீய ஈடுபாடு",
      "ராசி அதிபதி — தத்துவஞானியின் அறுவடை — குரு தசை தனுசு ராசிக்கு",
      "இறுதி கரைவு — சனி இறுதி முடிவு",
    ],
    dashaDetails: [
      {
        expect: "மூலம் கேது தசையில் தொடங்குகிறது — இருபத்தேழு நட்சத்திரங்களிலும் மிக வலிமையான தொடக்கங்களில் ஒன்று. கேதுவின் களத்தில் பிறந்த குழந்தை ஏற்கனவே பழையது: முன்னோர் விழிப்புணர்வின் தரம், முன்பு இங்கு இருந்ததுபோன்ற உணர்வு, ஆரம்ப நாட்களிலிருந்தே பராமரிப்பாளர்கள் கவனிக்கிறார்கள். குடும்பச் சூழலே அசாதாரண தீவிரத்தைக் கொண்டிருக்கலாம் — தீராத முன்னோர் விஷயங்கள், ஆன்மீகத் தீவிரம், எதிர்பாராத குலைவு, அல்லது வீட்டில் உண்மையான ஞானத்தின் இருப்பு. ஆரம்பக் குழந்தைப் பருவம் பிரிவுகள், அறிமுகமற்றவற்றுடன் சந்திப்புகள், அல்லது வெளிப்படையான விளக்கங்கள் உண்மையான விளக்கங்கள் அல்ல என்ற அமைதியற்ற உணர்வால் குறிக்கப்படலாம். கற்றலால் அல்ல, பொருட்கள் உண்மையில் எப்படிச் செயல்படுகின்றன என்ற சொல்லுக்கு முந்தைய புரிதலால் பிறந்த இந்த விசித்திர ஞானம் கேது மூலத்தின் அடித்தளத்தில் வைக்கும் கொடை. மூலம் இந்த தசையின் நடுவிலேயே பிறப்பதால், பிறக்கும்போது மீதமுள்ள இருப்பு மட்டுமே வாழப்படுகிறது; அது பாதத்தைப் பொறுத்தது — இந்த தசைக்குக் காட்டப்படும் வரம்பு அதைச் சொல்கிறது.",
        navigate: "கேது தசையில் உடல் அமைப்பு கேது ஆளும் பகுதிகளில் பாதிப்பைக் காட்டலாம்: நரம்பு மண்டல மிகை உணர்திறன், எதிர்பாராத காய்ச்சல்கள், தன்னெதிர்ப்புத் துறை. குடும்பம் முதன்மையான ஆதரவு கட்டமைப்பு; இந்த ஆரம்ப ஆண்டுகளில் குடும்பச் சூழலின் எந்த நிலையின்மையும் மூலத்தின் வாழ்க்கைக் கட்டமைப்பில் அசாதாரண அளவில் எதிரொலிக்கிறது. குடும்ப வழியில் பித்ரு தோஷம் இருந்தால், அதன் விளைவுகள் மூலத்தின் கேது தசைக் குழந்தைப் பருவத்தில் பெரும்பாலும் தெரியும். கேது–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்; குறைந்த இருப்பில் அது பிறப்புக்கு முன்பே வந்துவிடும்) குறிப்பிடத்தக்கது — குரு ராசி அதிபதி; குழந்தைப் பருவத்தின் இந்த குறுகிய துணைக் காலமும் அசாதாரண ஒளி, ஆசிரியர் உருவம் அல்லது வளர்ச்சித் தாவலின் தருணத்தைக் குறிக்கலாம்.",
        focus: "முன்னோர் சடங்குகளும் (பித்ரு தர்ப்பணம், குடும்ப சன்னதி பராமரிப்பு) விநாயகர் வழிபாடும் கேது தசையின் மிக முக்கியமான ஆன்மீக ஆதாரங்கள். மறைவானதை மதிக்கும், முன்னோர் மரபை ஏற்கும், முன்கூட்டிய பகுத்தறிவுவாதத்தைக் கோராத சூழல்களில் மூலக் குழந்தை செழிக்கிறது. மேலோட்டமான விளக்கங்கள் போதாது என்று ஏற்கனவே அறிந்த குழந்தையை, அந்த விளக்கங்களுக்கே இணங்குமாறு கோரும் சூழல்களுக்குக் கேது தசையில் உட்படுத்தாதீர்கள்.",
      },
      {
        expect: "சுக்கிர தசை மூலத்தின் ஆரம்ப வாழ்க்கையின் மாபெரும் நாகரிகமாக்கும் வில்; குழந்தைப் பருவத்தில் தொடங்கி பள்ளி, கல்லூரி வழியாக வேலை வாழ்வின் தொடக்கம் நோக்கிச் செல்கிறது. கேதுவின் தீவிரத்துக்கும் முன்னோர் சுமைக்கும் பிறகு, சுக்கிரன் அழகு, உறவு, படைப்பு வெளிப்பாடு, உலக ஈடுபாடு ஆகியவற்றை மூலம் சுமக்கும் தத்துவ ஆழத்துக்கான பயிற்சிக் களமாகத் தருகிறது. பள்ளி ஆண்டுகள் குறிப்பிடத்தக்க சமூக, அழகியல் திறப்பைக் காண்கின்றன: கேது தசையில் ஒருவேளை ஒதுங்கியிருந்த அல்லது அமைதியற்றதாகத் தோன்றிய மூலக் குழந்தை நட்புகள், படைப்பு வெளிப்பாடு, உலகுடனான அழகியல் ஈடுபாடு ஆகியவற்றுக்குள் தன் வழியைக் காணத் தொடங்குகிறது. உயர் கல்வியும் முதல் தீவிரக் காதல் உறவுகளும் தசையின் பிந்தைய பகுதியில் வளர்கின்றன. முதல் முக்கிய தத்துவ அல்லது ஆன்மீகத் தாக்கம் — ஆசிரியர், புத்தகம், மரபு — பொதுவாக சுக்கிர–ராகு அல்லது சுக்கிர–குரு புக்தியில் நுழைகிறது.",
        navigate: "மூலத்திற்கு சுக்கிரனின் முதன்மைச் சவால் வசதியின் சோதனை — கரைவே இயல்பாகக் கொண்ட நபர் அழகு, செழிப்பின் இன்பங்களைக் கண்டுபிடித்து, தற்காலிகமாக, கரையாமல் இருப்பதில் பற்றுக்கொள்வது. இது தவறல்ல; விடுதல் என்ற உண்மைப் போதனையை உள்ளிருந்து புரிந்துகொள்ளும் முன் பற்றுக்கொள்வது என்றால் என்ன என்பதைக் குறித்த அவசியமான மனித அனுபவம் இது. சுக்கிர–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒளிரும் சாளரத்தில் ராசி அதிபதியின் இருப்பைக் கொண்டுவருகிறது — தத்துவத் திறப்பு, ஞானமுள்ள ஆசிரியருடன் சந்திப்பு, அல்லது ஏற்றுக்கொண்ட நம்பிக்கையை முதன்முறையாக தீவிரமாகக் கேள்வி கேட்பது.",
        focus: "வெள்ளிக்கிழமை லட்சுமி, சரஸ்வதி வழிபாடு — மூலத்தின் ஆழ்ந்த இயல்புடன் இணைந்த சுக்கிரனின் அழகு, ஞான அம்சங்கள். சுக்கிர–குரு புக்தியை (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ராசி அதிபதி அடையாளமாகக் கவனியுங்கள்: கேது இருப்பு குறைவாக இருந்து கேது–குரு புக்தி பிறப்புக்கு முன்பே கடந்துவிட்டால், குருவின் தத்துவ, ஞான, விரிந்த இருப்பு பிறப்புக்குப் பிறகு மூலத்தின் தசை வரிசையில் முதன்முறையாகத் தோன்றுவதை இந்த துணைக் காலம் குறிக்கிறது.",
      },
      {
        expect: "சூரிய தசை மூலத்தின் அதிகாரத்தின் முதல் படிகமாதல். பல்கலைக்கழகத்துக்கும் ஆரம்பத் தொழில் ஆராய்ச்சிக்கும் பிறகான ஆண்டுகளில், மூலம் சுமக்கும் தத்துவ ஆழமும் வேர்-நிலை நுண்ணறிவும் தொழில்முறையிலும் சமூகத்திலும் அங்கீகரிக்கப்படத் தொடங்குகின்றன. தலைமைப் பதவிகள் வழங்கப்படுகின்றன; விசாரணை அல்லது தத்துவப் பணி ஆழமடைகிறது; தாம் காட்டக் கற்றுக்கொண்டதை அல்ல, மூலம் உண்மையில் அறிந்ததைச் சுற்றி அடையாளம் ஒருங்கிணைகிறது. பல மூல ஜாதகர்களுக்கு, சூரிய தசை திணிக்கப்படாமல் தாமே தேர்ந்தெடுக்கும் முதல் பெரிய கரைவின் காலம் — போதாதது என்று ஒப்புக்கொள்ளப்பட்ட தொழில், உறவு அல்லது உலகப் பார்வையை விடுதல்.",
        navigate: "மூலத்திற்கு சூரியனின் முதன்மை நிழல் வேரை அறிந்தவரின் அதிகாரம் — வசதியான விளக்கங்களை ஊடுருவிப் பார்த்தவர், அந்தப் பயணத்தை இன்னும் செய்யாத மற்றவர்களிடம் சகிப்பின்மை கொள்ளலாம். வெளிப்புற அமைப்புகளுக்குப் பயன்படுத்துவதைப் போலவே தன் சொந்த உறுதிப்பாடுகளுக்கும் கரைவுத் திறன் பயன்படுத்தப்பட வேண்டும். சூரிய–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) குலைவைக் கொண்டுவரலாம்.",
        focus: "ஞாயிற்றுக்கிழமை சூரிய வழிபாடு. சூரியன் தசையின் அதிகாரம் கற்பிக்கும் அதிகாரமாக பயன்படுத்தப்படும்போது மிகவும் நன்றாக சேவை செய்கிறது.",
      },
      {
        expect: "சந்திர தசை மூலத்தின் விசாரணை, தத்துவ நுண்ணறிவுக்கு உணர்வுப் பரிமாணத்தைக் கொண்டுவருகிறது. அறிவுத் துறையில் வளர்ந்து வந்த வேர்-நிலைப் புரிதல் இப்போது உணர்வு வேர்களைச் சந்திக்கிறது: பிறந்த குடும்பத்தின் வடிவங்கள், ஆழ்ந்த உறவுத் தேவைகளும் அச்சங்களும், கேது தசை வெளிப்படுத்தத் தொடங்கி சுக்கிர தசை நாகரிகமாக்கத் தொடங்கிய உணர்வு மரபு. இந்தத் தசைக்குள் திருமணம் அமைந்தால், அது ஜாதகத்தின் ஏழாம் வீட்டையும் அதன் அதிபதியையும் கொண்டு பார்க்கப்படுகிறது; சுக்கிரனும் குருவும் அதன் இயல்பான காரகர்கள். அது ஒரு நிலையான காலம் அல்ல, ஒரு போக்கே. குழந்தைகள் வரலாம்; பெற்றோராக மூலத்தின் பங்கு, இன்னொரு உயிருக்காக எந்த வேர்களை நடப்போகிறோம் என்ற கேள்வியை எழுப்புகிறது. மூலத்துக்கு சந்திர தசையின் உணர்வு நுண்ணறிவு என்பது உணர்வு அனுபவத்தின் அடிப்படைக் காரணங்களைப் புரிந்துகொள்ளும் நுண்ணறிவு — அவற்றை உணர்வது மட்டுமல்ல, அவை ஏன் எழுகின்றன என்பதைப் புரிந்துகொள்வது.",
        navigate: "மூலத்திற்கு சந்திரனின் முதன்மைச் சவால், வெறுமனே உணர்வதற்குப் பதிலாக விசாரிக்கும் போக்கு — தன் உணர்வு அனுபவத்துக்குள் வாழாமல் அதைப் பகுப்பாய்வு செய்யும் கரைவின் தத்துவஞானி. உடல் கவலைகள்: செரிமானம், நிணநீர், நரம்பு மண்டலத்தில் திரண்ட பதற்றம். சந்திர–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) கலக்கத்தை உருவாக்கலாம். சந்திர–குரு புக்தி குறுகிய ஆனால் அரவணைப்பான துணைக் காலம் — ராசி அதிபதியின் இருப்பு தத்துவ எளிமை, உணர்வு விசாலம், சாத்தியமான ஆன்மீக சமூகத்தைக் கொண்டுவருகிறது.",
        focus: "திங்கட்கிழமை சந்திர வழிபாடும், பகுப்பாய்வின்றி உணர்வு இருப்பை வேண்டுமென்றே பயிற்சி செய்வதும். சந்திர–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு ராசி அதிபதி அடையாளம்: சந்திரனின் உணர்வு ஆழத்தின் நடுவே குருவின் தத்துவ, ஞான, விரிந்த இருப்பு வருகிறது.",
      },
      {
        expect: "செவ்வாய் தசை மூலத்தின் இயல்பில் உள்ள கரைவுத் திறனை அதன் மிக நேரடியான, வலிமையான வெளிப்பாட்டில் செயல்படுத்துகிறது. சுக்கிரன் அழகையும் சந்திரன் உணர்வு ஆழத்தையும் தந்த இடத்தில், செவ்வாய் அவசியமான முடிவுகளின் வெட்டுக் கருவியைத் தருகிறது. விசாரணை, ஆராய்ச்சி, சிகிச்சை அல்லது தத்துவத்தைத் தொழில் துறையாகக் கொண்டவர்களுக்கு இது தீர்க்கமான செயலின் காலம்: ஏற்கப்பட்ட அமைப்புகளுக்குச் சவால் விடும் கண்டுபிடிப்புகளின் வெளியீடு, நீண்டகாலக் காயத்தைக் கரைக்கும் சிகிச்சைத் திருப்புமுனை, வசதியான ஆனால் தவறான உலகப் பார்வையைத் தகர்க்கும் தத்துவ வடிவம். நிறுவனத் தலைமையில் உள்ளவர்களுக்கு, செவ்வாய் தசை பெரும்பாலும் தொழிலின் மிக முக்கியமான மறுகட்டமைப்புப் பணியைக் கொண்டுவருகிறது.",
        navigate: "மூலத்திற்கு செவ்வாயின் முதன்மை நிழல் நீதிமானாகத் தகர்ப்பவர் — ஒரு கட்டமைப்புச் சிக்கலின் வேர்க் காரணத்தைக் கண்டறிந்தவர், எதைக் காக்க வேண்டும், கரைவின் மனித விலை என்ன என்பதில் போதுமான கவனம் இல்லாமல் அதைத் தகர்க்கத் தொடங்குவது. செவ்வாய்–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) சுருக்கமான ஆனால் முக்கியமான ராசி அதிபதி துணைக் காலத்தைக் கொண்டுவருகிறது — குருவின் தத்துவ ஞானமும் விரிவும் செவ்வாயின் வெட்டும் விளிம்பை மிதமாக்குகின்றன.",
        focus: "செவ்வாய்க்கிழமை செவ்வாய் சன்னதி வழிபாடு. செவ்வாய்–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு ராசி அதிபதி அடையாளம்: கரைவு, விசாரணை ஆர்வத்தை வெறுமனே திருப்தி செய்யாமல் பெரிய நன்மைக்குச் சேவை செய்வதை உறுதிசெய்யும் மிதப்படுத்தும் ஞானமாக, செவ்வாயின் வலிமையான காலத்தில் குரு வருகிறார்.",
      },
      {
        expect: "நடுவயதிலிருந்து பிற்கால வாழ்வுக்குள் நீளும் ராகு தசை, மூலத்தின் வேர்-நிலை நுண்ணறிவை மிகப் பரந்த அரங்கில் சோதிக்கும் விரிவாக்கத்தையும் உலக ஈடுபாட்டையும் கொண்டுவருகிறது. கேது, சுக்கிரன், சூரியன், சந்திரன், செவ்வாய் வழியாகத் திரண்ட தத்துவ, விசாரணை ஆழம் இப்போது உலகின் சிக்கலுடன் பெரிய அளவில் ஈடுபடுகிறது. சர்வதேசப் பணி, பண்பாடுகளுக்கிடையிலான தத்துவ பரிமாற்றம், பிறந்த பண்பாட்டுக்கு வெளியே உள்ள மரபுகளுடன் சந்திப்பு ராகு தசையில் பொதுவானவை. பல பத்தாண்டுகள் வேர்களை ஆராய்ந்த மூல ஜாதகர், வேர்கள் பண்பாடுகளுக்கு அடியிலும் மரபுகளுக்கு அடியிலும் கண்ணுக்குத் தெரியும் உலகுக்கு அடியிலும் ஓடுகின்றன என்று இப்போது கண்டுபிடிக்கிறார் — ராகுவின் உலகமயமாக்கும் விரிவாக்கமே இந்த ஆழ்ந்த புரிதல் சோதிக்கப்படும் களம்.",
        navigate: "மூலத்திற்கு ராகுவின் முதன்மை நிழல் கரைவுத் திறனை எங்கும் பொதுமைப்படுத்துவது — தம் சொந்த பண்பாட்டு, தனிப்பட்ட வேரில் வடிவங்களைக் கண்டறிந்தவர், எந்த ஒரு பார்வைக்கும் எல்லை உண்டு என்ற பணிவு இல்லாமல் அவற்றை எல்லா இடத்திலும் பயன்படுத்தத் தொடங்குவது. ராகு–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மிக முக்கியமான துணைக் காலம் — ராசி அதிபதியின் இருப்பு பெரிய தத்துவ விரிவாக்கமும் சாத்தியமான ஆன்மீகத் திருப்புமுனையும் ஆகும்.",
        focus: "சனிக்கிழமை ராகு சன்னதி வழிபாடும், பிறந்த பண்பாட்டுக்கு வெளியே உள்ள ஞான மரபுகளுடன் வேண்டுமென்றே ஈடுபடுவதும். ராகு–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு முக்கிய ராசி அதிபதி அடையாளம்: ராகுவின் விரிந்த களத்தில் குரு பெரிய தத்துவ, ஆன்மீக அல்லது ஞான மரபு ஆழமாதலின் சாளரமாக வருகிறார்.",
      },
      {
        expect: "பிற்கால வாழ்வில் வரும் குரு தசை மூலத்திற்கு ராசி அதிபதியின் வருகை — உங்கள் ராசியான தனுசை ஆளும் கிரகம் இப்போது உங்கள் தசையை நிர்வகிக்கிறது. ஒரு வாழ்நாள் மாயைகளைக் கரைத்து, வேர்களை ஆராய்ந்து, உண்மையான தத்துவ அர்ப்பணிப்பிலிருந்து வரும் புரிதலைக் கட்டிய மூலம் ஜாதகருக்கு, குரு தசை அறுவடை. கேதுவின் தொடக்கம், சுக்கிரனின் நாகரிகம், சூரியனின் அதிகாரம், சந்திரனின் உணர்வு ஆழம், செவ்வாயின் தீர்க்கமான செயல், ராகுவின் உலகளாவிய விரிவாக்கம் ஆகியவற்றின் வழியாகத் திரண்ட ஞானம் இப்போது உண்மையிலேயே வேர் வரை சென்ற ஒரு மூத்தவரின் உண்மையான ஞானமாக ஒளிர்கிறது. கற்பித்தல், கடத்தல், பேரக்குழந்தைகள், வேர்-நிலைப் புரிதலை முன்னெடுக்கும் நிறுவனங்களையோ சமூகங்களையோ கட்டுதல் ஆகியவை மூலத்தின் குரு தசையின் இயல்பான வெளிப்பாடுகள்.",
        navigate: "ராசி அதிபதி தசையில் குருவின் முதன்மையான நிழல் இறுதித் தொகுப்பின் சோதனை — தொகுப்பு முழுமையடைந்துவிட்டது என்று நம்பத் தொடங்கும் அளவுக்குப் புரிதலைத் திரட்டிய தத்துவஞானி. வேருக்கு இறுதி அடித்தளம் இல்லை என்பதை அறிவதையே முழு இயல்பாகக் கொண்ட மூலத்துக்கு, இதுவே ஆழமான முரண். குரு தசையில் சிறந்த மூல ஜாதகர்கள், கற்பிக்கும்போதும் மாணவர்களாகவே இருப்பவர்கள். உடல் பராமரிப்பும் வேண்டுமென்ற எளிமையும் முக்கியம்.",
        focus: "வியாழக்கிழமை பிரஹஸ்பதி மற்றும் தட்சிணாமூர்த்தி வழிபாடு. குரு தசை மூலத்திற்கு வாழ்க்கையின் தத்துவ முடிவு; பரிமாற்றத்தை சுதந்திரமாக கொடுங்கள், புரிதலை லேசாக வைத்திருங்கள்.",
      },
      {
        expect: "மிக முதிர்ந்த வயதில் வரும் சனி தசையை மிகச் சில மூல ஆத்மாக்களே அடைகின்றன. வருபவர்களுக்கு, ஒரு வாழ்நாள் வேர்-நிலை விசாரணை, தத்துவ ஆழம், ஞானக் கடத்தல் வழியாகக் கட்டிய அடையாளத்தின் இறுதியான, மென்மையான கரைவை சனி கொண்டுவருகிறார். மாபெரும் தகர்ப்பவர் மாபெரும் ஒழுக்கமூட்டுபவரைச் சந்திக்கிறார்; எஞ்சுவது எப்போதும் உண்மையாக இருந்தது மட்டுமே.",
        navigate: "முழுமையான, மென்மையான உடல் பராமரிப்பு. இந்த மிக முதிர்ந்த வயதில் சனி, இந்த நபரை நேசிப்பவர்களின் நிலையான, அர்ப்பணிப்புடன் கூடிய கவனத்தைக் கோருகிறது.",
        focus: "சனி தசை இறுதி வேர் — நிர்ருதியின் நட்சத்திரம் எப்போதும் சேவை செய்துவந்த கரைவு, இப்போது ஆழமாக வாழ்ந்த வாழ்வின் தவிர்க்க முடியாத, முழுமையாக ஏற்கப்பட்ட நிறைவாக வருகிறது.",
      },
    ],
    spirituality: [
      { title: "நிர்ருதி & காளி வழிபாடு",         desc: "நிர்ருதி — கரைவின் தேவதை, முடிவுகளுக்கும் போக வேண்டியவற்றை விடுவிக்கவும் தலைமை தாங்கும் தேவி — மூலத்தின் தலைமை தெய்வம். காளி வழிபாடு, இருண்ட நிலவு கடினமான நோன்புகள், மற்றும் முன்னோர் சடங்குகள் (பித்ரு தர்ப்பணம்) மூலத்தின் ஆழமான ஆன்மீக வெளிப்பாடுகள்." },
      { title: "வேதாந்தம் & வேர் ஞான மரபுகள்",    desc: "வேதாந்தம் — தோற்ற அடுக்குகளுக்கு அப்பால் இறுதியில் உண்மையானது என்ன என்ற விசாரணை — மூலத்தின் வேர் தேடும் தன்மையுடன் மிகவும் ஒத்தொலிக்கும் தத்துவ கட்டமைப்பு. சங்கராசார்யாவின் மரபு மூலத்தின் கல்வி ஆன்மீக வீடு." },
      { title: "குரு பக்தி & குரு மரபுகள்",       desc: "குரு வம்சம் மற்றும் பிரஹஸ்பதி–குரு பக்தி மரபு — அமைதியால் பரிமாறும் பிரபஞ்ச ஆசிரியரான தட்சிணாமூர்த்தி வழிபாடு — மூலத்தின் சமநிலைப்படுத்தும் ஆன்மீக நடைமுறைகள்." },
    ],
    guidance: "வேர் விசாரணையாளர் ஒவ்வொரு வேரின் வேரிலும் வெற்றிடத்தை அல்ல ஆனால் இருப்பை கண்டுபிடிக்கிறார் — கரைக்கப்பட்ட கட்டமைப்புகளுக்கு முன்பு இருந்த முழுமை. நீங்கள் கரைவின் திறனைப் பெற்றது தண்டனையாக அல்ல ஆனால் அன்பாக: வசதியான மாயைகள் தொடர்வதை அனுமதிக்க மறுக்கும் அன்பு, உண்மை கிடைக்கும்போது. வெட்டும் திறனை எப்போதும் உண்மையில் உண்மையானதின் சேவையில் பயன்படுத்துங்கள், மேலும் நீங்களும் கரைவுக்கு உட்பட்டவர் என்பதை நினைவில் வையுங்கள் — விசாரணையாளரை சேர்க்காத விசாரணை முழுமையற்றது.",
    careerNote: "ஒரு சிக்கலின் முழுமையான வேருக்கு செல்வது — நிறுவும் அனுமானம், அசல் காரணம், கட்டமைப்பு குறைபாடு — அனுமதிக்கப்படாது ஆனால் தேவைப்படும் இடங்களில் மூலம் சிறப்பாக செயல்படுகிறது.",
    modernLead: "மூலத்தின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "வேர் தேடும் நுண்ணறிவு, தத்துவ ஆழம், மாற்றும் திறன் மூலத்தின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function MulaVisualPage() {
  return <NatchathiramVisualContent data={MULA} visual={MULA_VISUAL} timings={dasaTimingsFor(MULA.number)} />;
}
