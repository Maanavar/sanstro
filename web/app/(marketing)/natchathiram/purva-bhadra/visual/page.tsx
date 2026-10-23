import type { Metadata } from "next";
import { withTamilTwin } from "@/lib/localized-metadata";
import { withDasaTimingHold } from "@/lib/natchathiram-dasa-hold";
import { dasaTimingsFor } from "@/lib/natchathiram-dasa-timings";
import { nakshatraDisplayName } from "@/lib/nakshatra-display-name";
import { natchathiramVisualTa } from "@/lib/marketing-seo-ta";
import { POORATTATHI } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

const EN_METADATA: Metadata = {
  title: `${nakshatraDisplayName(POORATTATHI.number, "en")} — Visual Profile`,
  description: "Visual profile of Poorattathi Nakshathiram: personality traits, career strengths, dasa timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/purva-bhadra/visual" },
  openGraph: {
    title: `${nakshatraDisplayName(POORATTATHI.number, "en")} — Visual Profile`,
    description: "Visual profile of Poorattathi Nakshathiram: personality traits, career strengths, dasa timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/purva-bhadra/visual",
    type: "article",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withDasaTimingHold(await withTamilTwin(EN_METADATA, "/natchathiram/purva-bhadra/visual", natchathiramVisualTa("purva-bhadra")!), "purva-bhadra");
}

const PURVA_BHADRA_VISUAL: NatchathiramVisualData = {
  atAGlance: [
    { label: "Fiery Transformation",      score: 97 },
    { label: "Intense Idealism",          score: 96 },
    { label: "Spiritual Fire",            score: 98 },
    { label: "Jupiter or Saturn Depth",   score: 95 },
    { label: "Visionary Intelligence",    score: 96 },
  ],

  radar: {
    labels: ["Transformation", "Idealism", "Spirit", "Depth", "Vision", "Intensity"],
    values: [97, 96, 98, 95, 96, 97],
  },

  coreStrengths: [
    { symbol: "◎", label: "Fiery Transformation",    score: 97, desc: "Aja Ekapada — the one-footed one of fire — is Purva Bhadra's presiding deity. This is the fire that transforms: not the constructive fire of creation but the consuming fire that burns what must not remain, so that what is true can emerge from the ash." },
    { symbol: "◈", label: "Intense Idealism",        score: 96, desc: "Jupiter's optimism and philosophical reach in Kumbha and Meena — Purva Bhadra carries ideals with an unusual intensity, willing to endure significant personal cost in order to remain true to the vision of what ought to be." },
    { symbol: "⚡", label: "Spiritual Fire",          score: 98, desc: "The combination of Jupiter's expansive wisdom and Aja Ekapada's transformative fire creates the capacity for spiritual intensity that few other nakshathirams can match — the yogi, the mystic, the one who has genuinely entered the fire and come through." },
    { symbol: "♥", label: "Rasi-Dual Depth",         score: 95, desc: "Spanning Kumbha (the first three padas) and Meena (the fourth pada) — both Saturn and Jupiter govern Purva Bhadra's rasi as the life unfolds. The Kumbha-born carry Saturn's structural discipline; the Meena-born open directly in Jupiter's philosophical abundance." },
    { symbol: "△", label: "Visionary Intelligence",  score: 96, desc: "Purva Bhadra sees beyond the present arrangement of reality to what is genuinely possible — the vision is not escapism but the directional intelligence that knows where the transformation must move in order to serve what is true." },
    { symbol: "☽", label: "Transformative Endurance", score: 97, desc: "The one-footed deity stands firm in the fire — Purva Bhadra's capacity to endure the transformative process without fleeing is the characteristic that makes their contribution genuinely lasting rather than momentarily impressive." },
  ],

  careerAbilities: [
    { label: "Spiritual Teaching & Leadership", score: 98 },
    { label: "Transformative Therapy & Healing", score: 97 },
    { label: "Philosophy & Visionary Writing",  score: 96 },
    { label: "Social Reform & Activism",        score: 95 },
    { label: "Occult Sciences & Tantra",        score: 97 },
  ],
  careerNote: "Purva Bhadra excels wherever the willingness to endure the transformative fire — in oneself and in the situations one engages with — and the capacity to remain true to the vision of what ought to be, even when the present reality strongly disagrees, are the central professional requirements.",

  careerClusters: [
    { symbol: "◎", title: "Spiritual Teaching & Ashram Leadership", desc: "Guruhood, ashram direction, spiritual community leadership — the transformative fire and the philosophical depth applied to the domain of awakening others." },
    { symbol: "◈", title: "Transformative Therapy & Healing",       desc: "Psychotherapy, energy healing, shadow work, intensive transformative modalities — the fire that burns the dross to reveal the gold applied to the therapeutic domain." },
    { symbol: "⚡", title: "Philosophy & Visionary Writing",         desc: "Philosophical writing, visionary literature, the articulation of what ought to be — Purva Bhadra's combination of Jupiter's breadth and the fire's intensity producing work that challenges and transforms." },
    { symbol: "♥", title: "Social Reform & Transformative Activism", desc: "Social reform, policy advocacy, the sustained commitment to making the world more aligned with what is true — the idealism of Purva Bhadra applied to collective transformation." },
    { symbol: "△", title: "Occult Sciences & Deep Tantra",          desc: "Jothidam, Tantra, depth esoteric traditions — the sacred fire of Aja Ekapada as professional wisdom and spiritual practice." },
    { symbol: "☽", title: "Academic Philosophy & Research",         desc: "Academic philosophy, depth research, the sustained investigation of fundamental questions — Jupiter's philosophical range joined to the fire's transformative capacity." },
  ],

  modernApps: [
    { symbol: "◎", title: "Spiritual Community & Teaching Technology", desc: "Spiritual community platforms, teaching technology, ashram and retreat management applications." },
    { symbol: "◈", title: "Transformative Therapy Technology",        desc: "Intensive therapy platforms, transformative healing technology, shadow work applications." },
    { symbol: "⚡", title: "Philosophy & Visionary Content Technology", desc: "Philosophical content platforms, visionary writing technology, transformative ideas applications." },
    { symbol: "♥", title: "Social Reform & Advocacy Technology",      desc: "Social reform platforms, advocacy technology, collective transformation tools." },
    { symbol: "△", title: "Esoteric Sciences Technology",             desc: "Jothidam platforms, Tantra and esoteric sciences technology, sacred fire traditions applications." },
    { symbol: "☽", title: "Academic Research Technology",            desc: "Depth research platforms, philosophical investigation tools, fundamental questions technology." },
  ],

  dashaTimeline: [
    {
      planet: "Jupiter", theme: "Born in Wisdom (Meena) or Structural Opening (Kumbha)",
      detail: {
        expect: "Purva Bhadra opens in Jupiter dasa — and the character of this opening is fundamentally different depending on which pada was occupied at birth. For Meena pada (fourth pada) natives, Jupiter is your rasi lord — and this makes the opening dasa the rasi lord's own period, charged with Jupiter's full philosophical abundance, expansive wisdom, and optimistic grace from the very beginning. The Meena-born Purva Bhadra child has a quality of wisdom and openness that is immediately apparent; the philosophical and spiritual dimensions of experience are available from the earliest years with unusual naturalness. For Kumbha padas (first to third pada) natives, Jupiter dasa is a supportive, expansive opening before the rasi lord Saturn's arrival — the philosophical breadth that will later be structured and disciplined. Purva Bhadra is born inside this dasa, so only the balance remaining at birth is lived; the pada decides how much, and the range shown for this dasa gives it.",
        navigate: "Jupiter's primary challenge for Purva Bhadra is the very expansiveness of the opening — the child born in philosophical abundance can develop a certain resistance to the limitations and disciplines that are necessary for the expansive vision to find its effective expression in the world. For Meena pada: the rasi lord's own dasa requires the early cultivation of grounded structure alongside the natural philosophical openness. For Kumbha padas: the Jupiter–Saturn bhukti (the table below gives when it begins and how long it lasts) is a rasi lord sub-period flag: a brief but important early encounter with the Saturn discipline that will govern the next major period.",
        focus: "Thursday Brihaspati worship and the early provision of philosophical and spiritual education that matches the Purva Bhadra child's genuine depth. For Meena pada: this entire dasa is the rasi lord's expression — give it the fullest philosophical, spiritual, and visionary engagement available. For Kumbha padas: the Jupiter–Saturn bhukti (the bhukti table below gives when it begins and how long it lasts) is a rasi lord flag: an early encounter with the structural discipline and patient long game that defines the mature Kumbha-Purva Bhadra.",
      },
    },
    {
      planet: "Saturn", theme: "Rasi Lord (Kumbha) — The Fire Structured / Rasi Support (Meena)",
      detail: {
        expect: "Saturn dasa is the rasi lord's arrival for Kumbha-pada (first to third pada) Purva Bhadra. It begins anywhere from infancy to adolescence, by pada, and runs on into young adult life; depending on the pada it covers some part of schooling, university and early career, and the establishment of the professional and personal foundations. Where marriage falls within this dasa, it is read from the seventh house and its lord, with Venus and Jupiter as the natural significators, and judged from the individual horoscope as a tendency rather than a fixed time. The transformative fire and the intense idealism of Purva Bhadra now receive the structural governance of the Saturn rasi lord — the vision is not abandoned but disciplined; the fire is not extinguished but channelled. The combination of Jupiter's philosophical depth (from the opening dasa) and Saturn's structural patience (in the rasi lord dasa) is what makes the Kumbha Purva Bhadra's contribution genuinely lasting. For Meena pada (fourth pada) Purva Bhadra, Saturn dasa is a period of powerful structural support — disciplining the philosophical abundance of Jupiter's opening into the forms that can carry the vision into the world.",
        navigate: "Saturn's primary challenge for Purva Bhadra is the encounter between the transformative fire's urgency and Saturn's long-game patience. The intense idealist who wants transformation now finds, in Saturn's structural governance, that the transformations that last require the time they require. The Saturn–Jupiter bhukti, which closes this dasa (the table below gives when it begins and how long it lasts), is a significant sub-period for both Kumbha and Meena padas: for Kumbha, it is the rasi lord Saturn met by Jupiter's expansive support; for Meena, it is the Jupiter rasi lord appearing in Saturn's structuring field.",
        focus: "Saturday Saturn worship, Hanuman worship, and the deliberate cultivation of patience alongside the intensity. For Kumbha padas: Saturn dasa is the rasi lord's governance of the most important establishment period of the life — give the transformative fire the discipline it needs to become the work that lasts. For Meena pada: receive Saturn's structural discipline as the necessary container for Jupiter's philosophical abundance. The Saturn–Jupiter bhukti is a significant rasi lord-flavoured sub-period for all Purva Bhadra.",
      },
    },
    {
      planet: "Mercury", theme: "The Articulate Vision",
      detail: {
        expect: "Mercury dasa, running through the working middle of life, brings the mind's precision and articulateness to Purva Bhadra's fiery and idealistic character. The transformative vision — which has been felt and inhabiting since the beginning — now finds in Mercury the capacity for clear articulation. Writing, teaching, and the transmission of the Purva Bhadra understanding reach their most publicly effective expression in Mercury dasa. The Mercury–Jupiter bhukti (the table below gives when it begins and how long it lasts) is a significant sub-period: for Meena pada, Jupiter is the rasi lord appearing in Mercury's articulative field — a period of philosophical writing or teaching breakthrough; for Kumbha padas, Jupiter as a major benefic brings philosophical depth to Mercury's articulation.",
        navigate: "Mercury's primary challenge for Purva Bhadra is the articulation of transformative intensity in language accessible to those who have not had the same experience. The intensity of the fire can produce writing or teaching that is profound but inaccessible — the challenge is to transmit the heat without burning the audience. The Mercury–Jupiter bhukti is a significant rasi lord sub-period for Meena pada.",
        focus: "Wednesday Mercury worship and the deliberate cultivation of accessible articulation — the transformative vision expressed in language that invites rather than demands. The Mercury–Jupiter bhukti (the bhukti table below gives when it begins and how long it lasts) is the rasi lord flag for Meena pada.",
      },
    },
    {
      planet: "Ketu", theme: "The Fire Stripped",
      detail: {
        expect: "Ketu dasa strips the Purva Bhadra identity of everything that has accumulated around the transformative vision. The career achievements, the philosophical frameworks, the articulated teachings — all the things that Mercury dasa produced — now undergo Ketu's great simplification. For those who have genuinely entered the transformative fire and come through, Ketu dasa is among the most profound and honest periods of the Purva Bhadra life: the willingness to release what has been built, to let the fire do its work again, to discover what remains when the accumulation is gone.",
        navigate: "Ketu's primary challenge for Purva Bhadra is the attachment to the transformative identity — the one who has undergone the fire and survived can become attached to the survivor-identity, to the accumulated wisdom, to the position of the transformed elder. Ketu asks for the release of this, too. Physical concerns: nervous system, autoimmune function, the accumulated intensity of decades of fiery engagement.",
        focus: "Ganapati worship, pitru tharpanam and ancestral rites. The Ketu–Jupiter bhukti (the table below gives when it begins and how long it lasts) is a rasi lord sub-period flag for Meena pada: Jupiter arrives in Ketu's simplifying field as a brief but luminous encounter with the rasi lord's philosophical grace.",
      },
    },
    {
      planet: "Venus", theme: "The Beautiful Second Flowering",
      detail: {
        expect: "Venus dasa, in later life, brings a second flowering — one of beauty, abundance, and relational warmth — after Ketu's great simplification. For Purva Bhadra, whose intensity can sometimes overshadow the beauty of what is right in front of them, Venus dasa offers the gift of the present — the pleasure of what exists rather than the urgency of what must be transformed. Late-career work reaches the widest audience; grandchildren arrive; the relationships that have survived the fires of the Purva Bhadra life are experienced in their full depth. The Venus–Jupiter bhukti (the table below gives when it begins and how long it lasts) is a rasi lord sub-period for Meena pada — a beautiful, philosophical window within Venus's long dasa.",
        navigate: "Venus's primary challenge for Purva Bhadra is the temptation toward comfort after the long fires — the intense idealist discovering pleasure and beginning to prefer comfort to the transformative engagement that is their nature. Ketu's stripping has prepared the ground for genuine enjoyment; the challenge is to let the enjoyment be genuine rather than a retreat from the fire that remains available.",
        focus: "Friday Lakshmi worship and the deliberate enjoyment of beauty, abundance, and relational warmth. The Venus–Jupiter bhukti (the bhukti table below gives when it begins and how long it lasts) is a rasi lord flag for Meena pada: an expansive, philosophically beautiful window within Venus's long dasa.",
      },
    },
    {
      planet: "Sun", theme: "Final Solar Authority",
      detail: {
        expect: "Sun dasa, in advanced age, brings the final crystallisation of the Purva Bhadra authority. The transformative wisdom, the philosophical depth, the endurance of the long fires — all of it is now expressed through the solar clarity of an elder who has been through the fire and stands in it freely.",
        navigate: "Complete and gentle physical care. The Sun dasa elder's authority is the authority of presence — it requires no assertion.",
        focus: "Sunday Surya worship. The solar authority of the transformed elder is given to the world by being present to it, not by demanding it.",
      },
    },
    {
      planet: "Moon", theme: "The Emotional Ocean",
      detail: {
        expect: "Moon dasa, in very advanced age, brings the emotional ocean to the Purva Bhadra elder. After the long fires and the solar authority, Moon invites the return of the feeling dimension — the emotional depth that the intense idealism sometimes bypassed in the service of the vision.",
        navigate: "Complete and devoted physical care. The emotional depth of Moon dasa at this age requires the physical environment to support the emotional openness.",
        focus: "Monday Moon worship and the presence of those who love this person deeply. The Moon–Jupiter bhukti (the bhukti table below gives when it begins and how long it lasts) is a brief rasi lord presence for Meena pada.",
      },
    },
    {
      planet: "Mars", theme: "Final Fire",
      detail: {
        expect: "Mars dasa, the last in this sequence, is reached by extraordinarily few Purva Bhadra souls. For those who arrive, Mars brings the final flaring of the transformative fire — the energy of the one-footed deity in its most distilled form: the will to continue, the capacity to stand in the flame.",
        navigate: "Complete and devoted physical care at this extreme age.",
        focus: "Aja Ekapada's flame burns in Mars dasa as the final vitality of the one who stood in the fire across a long life. The flame that has transformed returns, at last, to the one who carried it.",
      },
    },
  ],

  spirituality: [
    {
      title: "Aja Ekapada & Sacred Fire Worship",
      desc: "Aja Ekapada — the one-footed one of transformative fire — is Purva Bhadra's presiding deity. Sacred fire worship (Agni Hotra), fire rituals (Yagnas), and the practice of sitting with the inner fire of transformation — allowing it to do its work without fleeing — are Purva Bhadra's most resonant spiritual expressions.",
    },
    {
      title: "Jupiter (Meena) / Saturn (Kumbha) Devotion",
      desc: "For Meena pada: Thursday Brihaspati–Dakshinamurthy worship and the devotional relationship with a living guru or wisdom tradition — Jupiter's philosophical grace as the primary spiritual register. For Kumbha padas: Saturday Shani puja and the deliberate cultivation of structured, long-game devotion — Saturn's patience as the container for the fire.",
    },
    {
      title: "Tapas & Transformative Austerity",
      desc: "The spiritual tradition of tapas — the deliberate embracing of transformative heat, the willingness to sit in the fire of purification — is Purva Bhadra's most authentic devotional practice. The one who endures the fire becomes the one who can guide others through it.",
    },
  ],

  guidance: "The fire that Aja Ekapada placed in you is not a punishment — it is the instrument of the transformation that the world needs and that you came to be. The one-footed deity stands on one foot because the other foot is in the invisible: the steadiness that allows standing in the fire comes not from the visible world's support but from the root in what is true and unchanging. Stand in your fire with that steadiness. What is burned away was never what you were; what remains when the burning is done is what you always were.",

  compatibleEn: ["Uthirattathi", "Sadayam", "Revathi", "Thiruvathirai", "Moolam"],
  compatibleNote: "These nakshatras complement Purva Bhadra's transformative fire, intense idealism, and spiritual depth with mystical wisdom, healing power, and philosophical resonance.",

  ta: {
    atAGlanceLabels: ["நெருப்பு மாற்றம்", "தீவிர இலட்சியவாதம்", "ஆன்மீக நெருப்பு", "குரு அல்லது சனி ஆழம்", "தொலைநோக்கு நுண்ணறிவு"],
    radarLabels: ["மாற்றம்", "இலட்சியவாதம்", "ஆவி", "ஆழம்", "பார்வை", "தீவிரம்"],
    coreStrengths: [
      { label: "நெருப்பு மாற்றம்",        desc: "மாற்றும் நெருப்புக்குரிய, ஒற்றைக் காலுடைய அஜ ஏகபாதமே பூரட்டாதியின் தலைமை தெய்வம். இது மாற்றும் நெருப்பு: படைக்கும் நெருப்பு அல்ல; இருக்கக்கூடாதவற்றை எரிக்கும் நுகரும் நெருப்பு, இதனால் உண்மையானது சாம்பலிலிருந்து வெளிப்படலாம்." },
      { label: "தீவிர இலட்சியவாதம்",     desc: "கும்பம் மற்றும் மீனில் குருவின் நம்பிக்கையும் தத்துவப் பரப்பும் — பூரட்டாதி என்னவாக இருக்க வேண்டும் என்ற பார்வைக்கு உண்மையாக இருக்க குறிப்பிடத்தக்க தனிப்பட்ட விலையை தாங்கும் விருப்பத்துடன் அசாதாரண தீவிரத்துடன் இலட்சியங்களை சுமக்கிறது." },
      { label: "ஆன்மீக நெருப்பு",        desc: "குருவின் விரிவான ஞானம் மற்றும் அஜ ஏகபாதத்தின் மாற்றும் நெருப்பின் கலவை ஆன்மீக தீவிரத்தின் திறனை உருவாக்குகிறது — யோகி, மறைஞானி, உண்மையில் நெருப்பில் நுழைந்து வெளியே வந்தவர்." },
      { label: "ராசி-இரண்டு ஆழம்",      desc: "கும்பம் (முதல் மூன்று பாதங்கள்), மீனம் (நான்காம் பாதம்) ஆகிய இரண்டையும் இணைக்கிறது — சனி மற்றும் குரு இருவரும் வாழ்க்கை உருவாகும்போது பூரட்டாதியின் ராசியை நிர்வகிக்கிறார்கள்." },
      { label: "தொலைநோக்கு நுண்ணறிவு",  desc: "பூரட்டாதி உண்மையில் சாத்தியமானதை நோக்கி யதார்த்தத்தின் தற்போதைய ஏற்பாட்டிற்கு அப்பால் பார்க்கிறது — இந்தப் பார்வை தப்பித்தல் அல்ல; திசைகாட்டும் நுண்ணறிவு." },
      { label: "மாற்றும் சகிப்புத்தன்மை", desc: "ஒற்றை கால் தெய்வம் நெருப்பில் உறுதியாக நிற்கிறது — மாற்றும் செயல்முறையை ஓடாமல் தாங்கும் பூரட்டாதியின் திறன் அவர்களின் பங்களிப்பை உண்மையில் நீடிக்கச் செய்யும் குணம்." },
    ],
    careerAbilityLabels: ["ஆன்மீக கற்பித்தல் & தலைமை", "மாற்றும் சிகிச்சை & குணப்படுத்துதல்", "தத்துவம் & தொலைநோக்கு எழுத்து", "சமூக சீர்திருத்தம் & செயல்பாடு", "மறைஞான அறிவியல்கள் & தந்திரம்"],
    careerClusters: [
      { title: "ஆன்மீக கற்பித்தல் & ஆசிரம் தலைமை",  desc: "குருத்துவம், ஆசிரம் இயக்கம், ஆன்மீக சமூக தலைமை — மாற்றும் நெருப்பு மற்றும் தத்துவ ஆழம் மற்றவர்களை எழுப்பும் தளத்தில் பயன்படுத்தப்படுகிறது." },
      { title: "மாற்றும் சிகிச்சை & குணப்படுத்துதல்", desc: "மனோசிகிச்சை, ஆற்றல் குணப்படுத்துதல், நிழல் வேலை, தீவிர மாற்றும் முறைகள் — தங்க நிறத்தை வெளிப்படுத்த களிமண்ணை எரிக்கும் நெருப்பு." },
      { title: "தத்துவம் & தொலைநோக்கு எழுத்து",     desc: "தத்துவ எழுத்து, தொலைநோக்கு இலக்கியம், என்னவாக இருக்க வேண்டும் என்பதன் வெளிப்பாடு." },
      { title: "சமூக சீர்திருத்தம் & மாற்றும் செயல்பாடு", desc: "சமூக சீர்திருத்தம், கொள்கை வாதப்படுதல், உலகை உண்மையானதுடன் அதிக ஒத்துப்போகும்படி செய்ய நீடித்த அர்ப்பணிப்பு." },
      { title: "மறைஞான அறிவியல்கள் & ஆழ தந்திரம்",   desc: "ஜ்யோதிஷ், தந்திரம், மறைஞான மரபுகள் — தொழில்முறை ஞானமாகவும் ஆன்மீகப் பயிற்சியாகவும் அஜ ஏகபாதத்தின் புனித நெருப்பு." },
      { title: "கல்வி தத்துவம் & ஆராய்ச்சி",        desc: "கல்வி தத்துவம், ஆழ ஆராய்ச்சி, அடிப்படை கேள்விகளின் நீடித்த விசாரணை." },
    ],
    modernApps: [
      { title: "ஆன்மீக சமூகம் & கற்பித்தல் தொழில்நுட்பம்", desc: "ஆன்மீக சமூக தளங்கள், கற்பித்தல் தொழில்நுட்பம், ஆசிரம் மற்றும் திரும்பி செல்வதற்கான மேலாண்மை பயன்பாடுகள்." },
      { title: "மாற்றும் சிகிச்சை தொழில்நுட்பம்",         desc: "தீவிர சிகிச்சை தளங்கள், மாற்றும் குணப்படுத்துதல் தொழில்நுட்பம், நிழல் வேலை பயன்பாடுகள்." },
      { title: "தத்துவம் & தொலைநோக்கு உள்ளடக்கம் தொழில்நுட்பம்", desc: "தத்துவ உள்ளடக்கம் தளங்கள், தொலைநோக்கு எழுத்து தொழில்நுட்பம், மாற்றும் யோசனைகள் பயன்பாடுகள்." },
      { title: "சமூக சீர்திருத்தம் & வாதப்படுதல் தொழில்நுட்பம்", desc: "சமூக சீர்திருத்தம் தளங்கள், வாதப்படுதல் தொழில்நுட்பம், கூட்டு மாற்றம் கருவிகள்." },
      { title: "மறைஞான அறிவியல்கள் தொழில்நுட்பம்",         desc: "ஜ்யோதிஷ் தளங்கள், தந்திரம் மற்றும் மறைஞான அறிவியல்கள் தொழில்நுட்பம், புனித நெருப்பு மரபுகள் பயன்பாடுகள்." },
      { title: "கல்வி ஆராய்ச்சி தொழில்நுட்பம்",           desc: "ஆழ ஆராய்ச்சி தளங்கள், தத்துவ விசாரணை கருவிகள், அடிப்படை கேள்விகள் தொழில்நுட்பம்." },
    ],
    dashaThemes: [
      "ஞானத்தில் பிறப்பு (மீனம்) அல்லது கட்டமைப்பு திறப்பு (கும்பம்) — குரு ஆரம்பம்",
      "ராசி அதிபதி (கும்பம்) நெருப்பு கட்டமைக்கப்படுகிறது / ராசி ஆதரவு (மீனம்) — சனி தசை",
      "வெளிப்படுத்திய பார்வை — புதன் தெளிவான வெளிப்பாடு",
      "நெருப்பு எளிமைப்படுத்தப்படுகிறது — கேது திரட்டல் விடுதல்",
      "அழகான இரண்டாவது மலர்ச்சி — சுக்கிர செழிப்பு",
      "இறுதி சூரிய அதிகாரம் — சூரியன் மாற்றப்பட்ட மூத்தவர்",
      "உணர்வுக் கடல் — சந்திர ஆழம்",
      "இறுதி நெருப்பு — செவ்வாய் இறுதி உயிர்சக்தி",
    ],
    dashaDetails: [
      {
        expect: "பூரட்டாதி குரு தசையில் தொடங்குகிறது — பிறக்கும்போது எந்தப் பாதம் என்பதைப் பொறுத்து இந்தத் தொடக்கத்தின் தன்மை அடிப்படையிலேயே வேறுபடுகிறது. மீன பாத (நான்காம் பாதம்) ஜாதகர்களுக்கு, குரு உங்கள் ராசி அதிபதி — இதனால் தொடக்க தசையே ராசி அதிபதியின் சொந்தக் காலம்; தொடக்கத்திலிருந்தே குருவின் முழு தத்துவச் செழிப்பு, விரிந்த ஞானம், நம்பிக்கை நிறைந்த அருளுடன். மீனத்தில் பிறந்த பூரட்டாதிக் குழந்தைக்கு உடனே தெரியும் ஞானமும் திறந்த மனமும் உண்டு; அனுபவத்தின் தத்துவ, ஆன்மீகப் பரிமாணங்கள் ஆரம்ப ஆண்டுகளிலிருந்தே அசாதாரண இயல்புத்தன்மையுடன் கிடைக்கின்றன. கும்ப பாத (முதல் மூன்று பாதங்கள்) ஜாதகர்களுக்கு, குரு தசை ராசி அதிபதி சனியின் வருகைக்கு முன் ஆதரவான, விரிந்த தொடக்கம் — பின்னர் கட்டமைக்கப்பட்டு ஒழுக்கப்படுத்தப்படப்போகும் தத்துவ அகலம். பூரட்டாதி இந்த தசையின் நடுவிலேயே பிறப்பதால், பிறக்கும்போது மீதமுள்ள இருப்பு மட்டுமே வாழப்படுகிறது; அது பாதத்தைப் பொறுத்தது — இந்த தசைக்குக் காட்டப்படும் வரம்பு அதைச் சொல்கிறது.",
        navigate: "பூரட்டாதிக்கு குருவின் முதன்மைச் சவால் தொடக்கத்தின் விரிவே — தத்துவச் செழிப்பில் பிறந்த குழந்தை, விரிந்த நோக்கு உலகில் பயனுள்ள வெளிப்பாட்டைக் காணத் தேவையான வரம்புகளுக்கும் ஒழுக்கங்களுக்கும் ஒரு குறிப்பிட்ட எதிர்ப்பை வளர்த்துக்கொள்ளலாம். மீனம்: ராசி அதிபதியின் சொந்த தசைக்கு, இயல்பான தத்துவத் திறந்த மனதுடன் சேர்ந்து நிலைபெற்ற கட்டமைப்பை ஆரம்பத்திலேயே வளர்க்க வேண்டும். கும்ப பாதங்கள்: குரு–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு ராசி அதிபதி அடையாளம்: அடுத்த பெரிய காலத்தை நிர்வகிக்கப்போகும் சனியின் ஒழுக்கத்துடன் சுருக்கமான ஆனால் முக்கியமான ஆரம்பகால சந்திப்பு.",
        focus: "வியாழக்கிழமை பிருஹஸ்பதி வழிபாடும், பூரட்டாதிக் குழந்தையின் உண்மையான ஆழத்துக்கு ஏற்ற தத்துவ, ஆன்மீகக் கல்வியை ஆரம்பத்திலேயே வழங்குவதும். மீனம்: இந்த முழு தசையும் ராசி அதிபதியின் வெளிப்பாடு — கிடைக்கும் மிக முழுமையான தத்துவ, ஆன்மீக, தொலைநோக்கு ஈடுபாட்டை வழங்குங்கள். கும்ப பாதங்கள்: குரு–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு ராசி அதிபதி அடையாளம்: முதிர்ந்த கும்ப-பூரட்டாதியை வரையறுக்கும் கட்டமைப்பு ஒழுக்கம், பொறுமையான நீண்டகாலப் பார்வையுடன் ஆரம்பகாலச் சந்திப்பு.",
      },
      {
        expect: "சனி தசை கும்ப பாத (முதல் மூன்று பாதங்கள்) பூரட்டாதிக்கு ராசி அதிபதியின் வருகை. இது பாதத்தைப் பொறுத்து கைக்குழந்தைப் பருவத்திலோ வளரிளம் பருவத்திலோ தொடங்கி, இளம் வயது வந்த வாழ்வுக்குள் நீள்கிறது; பாதத்துக்கு ஏற்ப, பள்ளிக் கல்வி, பல்கலைக்கழகம், ஆரம்பத் தொழில் ஆகியவற்றின் ஒரு பகுதியையும், தொழில்முறை, தனிப்பட்ட அடித்தளங்களின் நிறுவலையும் அது உள்ளடக்குகிறது. இந்தத் தசைக்குள் திருமணம் அமைந்தால், அது ஜாதகத்தின் ஏழாம் வீட்டையும் அதன் அதிபதியையும் கொண்டு பார்க்கப்படுகிறது; சுக்கிரனும் குருவும் அதன் இயல்பான காரகர்கள். அது ஒரு நிலையான காலம் அல்ல, ஒரு போக்கே. பூரட்டாதியின் மாற்றும் நெருப்பும் தீவிர இலட்சியவாதமும் இப்போது சனி ராசி அதிபதியின் கட்டமைப்பு ஆட்சியைப் பெறுகின்றன — நோக்கு கைவிடப்படுவதில்லை, ஒழுக்கப்படுத்தப்படுகிறது; நெருப்பு அணைக்கப்படுவதில்லை, திசைப்படுத்தப்படுகிறது. குருவின் தத்துவ ஆழமும் (தொடக்க தசையிலிருந்து) சனியின் கட்டமைப்புப் பொறுமையும் (ராசி அதிபதி தசையில்) இணைவதே கும்ப-பூரட்டாதியின் பங்களிப்பை உண்மையிலேயே நீடிக்கச் செய்கிறது. மீன பாத (நான்காம் பாதம்) பூரட்டாதிக்கு, சனி தசை சக்திவாய்ந்த கட்டமைப்பு ஆதரவின் காலம் — குருவின் தொடக்கத் தத்துவச் செழிப்பை, நோக்கை உலகுக்குக் கொண்டுசெல்லக்கூடிய வடிவங்களாக ஒழுக்கப்படுத்துகிறது.",
        navigate: "பூரட்டாதிக்கு சனியின் முதன்மைச் சவால், மாற்றும் நெருப்பின் அவசரத்துக்கும் சனியின் நீண்டகாலப் பொறுமைக்கும் இடையிலான சந்திப்பு. இப்போதே மாற்றம் வேண்டும் என்ற தீவிர இலட்சியவாதி, சனியின் கட்டமைப்பு ஆட்சியில், நிலைக்கும் மாற்றங்களுக்கு அவை கோரும் நேரம் தேவை என்பதைக் காண்கிறார். இந்த தசையை நிறைவு செய்யும் சனி–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) கும்ப, மீன பாதங்கள் இரண்டுக்கும் முக்கியமான துணைக் காலம்: கும்பத்துக்கு ராசி அதிபதி சனியைக் குருவின் விரிந்த ஆதரவு சந்திக்கிறது; மீனத்துக்கு சனியின் கட்டமைக்கும் களத்தில் ராசி அதிபதி குரு தோன்றுகிறார்.",
        focus: "சனிக்கிழமை சனி வழிபாடும், ஆஞ்சநேயர் வழிபாடும், தீவிரத்துடன் பொறுமையையும் வேண்டுமென்றே வளர்ப்பதும். கும்ப பாதங்கள்: சனி தசை வாழ்வின் மிக முக்கியமான நிறுவுதல் காலத்தின் மீது ராசி அதிபதியின் ஆட்சி — மாற்றும் நெருப்புக்கு நிலைக்கும் வேலையாக மாறத் தேவையான ஒழுக்கத்தைக் கொடுங்கள். மீன பாதம்: குருவின் தத்துவச் செழிப்புக்குத் தேவையான கொள்கலனாக சனியின் கட்டமைப்பு ஒழுக்கத்தை ஏற்றுக்கொள்ளுங்கள். சனி–குரு புக்தி எல்லா பூரட்டாதிக்கும் ராசி அதிபதி சாயல் கொண்ட முக்கிய துணைக் காலம்.",
      },
      {
        expect: "வாழ்வின் பணி நடுப்பகுதி வழியாகச் செல்லும் புதன் தசை, பூரட்டாதியின் நெருப்பான, இலட்சியவாத இயல்புக்கு மனதின் துல்லியத்தையும் தெளிவாக வெளிப்படுத்தும் திறனையும் கொண்டுவருகிறது. தொடக்கத்திலிருந்தே உணரப்பட்டு உள்ளிருக்கும் மாற்றும் நோக்கு இப்போது புதனில் தெளிவான வெளிப்பாட்டுத் திறனைக் காண்கிறது. எழுத்து, கற்பித்தல், பூரட்டாதியின் புரிதலைக் கடத்துதல் ஆகியவை புதன் தசையில் தங்கள் மிகப் பொதுவில் பயனுள்ள வெளிப்பாட்டை அடைகின்றன. புதன்–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) முக்கியமான துணைக் காலம்: மீன பாதத்துக்கு, புதனின் வெளிப்பாட்டுக் களத்தில் ராசி அதிபதி குரு தோன்றுகிறார் — தத்துவ எழுத்து அல்லது கற்பித்தல் திருப்புமுனையின் காலம்; கும்ப பாதங்களுக்கு, முக்கிய சுப கிரகமாக குரு புதனின் வெளிப்பாட்டுக்கு தத்துவ ஆழத்தைத் தருகிறார்.",
        navigate: "பூரட்டாதிக்கு புதனின் முதன்மைச் சவால், அதே அனுபவம் இல்லாதவர்களும் அணுகக்கூடிய மொழியில் மாற்றும் தீவிரத்தை வெளிப்படுத்துவது. நெருப்பின் தீவிரம் ஆழமான ஆனால் அணுக முடியாத எழுத்தையோ கற்பித்தலையோ உருவாக்கலாம் — பார்வையாளரை எரிக்காமல் வெப்பத்தைக் கடத்துவதே சவால். புதன்–குரு புக்தி மீன பாதத்துக்கு முக்கியமான ராசி அதிபதி துணைக் காலம்.",
        focus: "புதன்கிழமை புதன் வழிபாடும், அணுகத்தக்க வெளிப்பாட்டை வேண்டுமென்றே வளர்ப்பதும் — கட்டளையிடாமல் அழைக்கும் மொழியில் மாற்றும் நோக்கை வெளிப்படுத்துதல். புதன்–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மீன பாதத்துக்கான ராசி அதிபதி அடையாளம்.",
      },
      {
        expect: "கேது தசை மாற்றும் நோக்கைச் சுற்றித் திரண்ட அனைத்தையும் பூரட்டாதி அடையாளத்திலிருந்து உரிக்கிறது. தொழில் சாதனைகள், தத்துவச் சட்டகங்கள், வெளிப்படுத்திய போதனைகள் — புதன் தசை உருவாக்கிய அனைத்தும் — இப்போது கேதுவின் மாபெரும் எளிமைப்படுத்தலுக்கு உட்படுகின்றன. மாற்றும் நெருப்புக்குள் உண்மையிலேயே நுழைந்து கடந்து வந்தவர்களுக்கு, கேது தசை பூரட்டாதி வாழ்வின் மிக ஆழ்ந்த, நேர்மையான காலங்களில் ஒன்று: கட்டியதை விட்டுவிடும் மனம், நெருப்பு மீண்டும் தன் வேலையைச் செய்யட்டும் என்ற விடுதல், திரட்டு போன பிறகு எஞ்சுவதைக் கண்டுபிடித்தல்.",
        navigate: "பூரட்டாதிக்கு கேதுவின் முதன்மைச் சவால் மாற்றும் அடையாளத்தின் மீதான பற்று — நெருப்பைக் கடந்து பிழைத்தவர், பிழைத்தவர் என்ற அடையாளத்தின் மீதும், திரட்டிய ஞானத்தின் மீதும், மாறிய மூத்தவரின் நிலையின் மீதும் பற்றுக்கொள்ளலாம். இதையும் விடுமாறு கேது கேட்கிறது. உடல் கவலைகள்: நரம்பு மண்டலம், தன்னெதிர்ப்பு செயல்பாடு, பல தசகங்கள் நெருப்பு ஈடுபாட்டின் திரண்ட தீவிரம்.",
        focus: "விநாயகர் வழிபாடு, பித்ரு தர்ப்பணம், முன்னோர் சடங்குகள். கேது–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மீன பாதத்துக்கான ராசி அதிபதி அடையாளம்: கேதுவின் எளிமைப்படுத்தும் களத்தில் குரு ராசி அதிபதியின் தத்துவ அருளுடன் சுருக்கமான ஆனால் ஒளிரும் சந்திப்பாக வருகிறார்.",
      },
      {
        expect: "பிற்கால வாழ்வில் வரும் சுக்கிர தசை, கேதுவின் மாபெரும் எளிமைப்படுத்தலுக்குப் பிறகு, அழகு, செழிப்பு, உறவு அரவணைப்பின் இரண்டாவது மலர்ச்சியைக் கொண்டுவருகிறது. தீவிரம் சில நேரம் தன் முன்னால் உள்ள அழகை மறைக்கும் பூரட்டாதிக்கு, சுக்கிர தசை நிகழ்காலத்தின் கொடையை அளிக்கிறது — மாற்றப்பட வேண்டியதன் அவசரத்தை விட இருப்பதன் இன்பம். பிற்காலப் பணி மிக அகன்ற பார்வையாளர்களை அடைகிறது; பேரக்குழந்தைகள் வருகிறார்கள்; பூரட்டாதி வாழ்வின் நெருப்புகளைத் தாண்டி வந்த உறவுகள் முழு ஆழத்தில் அனுபவிக்கப்படுகின்றன. சுக்கிர–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மீன பாதத்துக்கான ராசி அதிபதி துணைக் காலம் — சுக்கிரனின் நீண்ட தசைக்குள் அழகான, தத்துவச் சாளரம்.",
        navigate: "பூரட்டாதிக்கு சுக்கிரனின் முதன்மைச் சவால், நீண்ட நெருப்புகளுக்குப் பிறகு வசதி நோக்கிய சோதனை — தீவிர இலட்சியவாதி இன்பத்தைக் கண்டுபிடித்து, தன் இயல்பான மாற்றும் ஈடுபாட்டை விட வசதியை விரும்பத் தொடங்குவது. கேதுவின் உரித்தல் உண்மையான இன்பத்துக்கு நிலத்தைத் தயார் செய்துள்ளது; சவால், இன்பம் இன்னும் கிடைக்கும் நெருப்பிலிருந்து பின்வாங்குவதாக அல்லாமல் உண்மையாக இருக்கச் செய்வது.",
        focus: "வெள்ளிக்கிழமை லட்சுமி வழிபாடும், அழகு, செழிப்பு, உறவு அரவணைப்பை வேண்டுமென்றே இன்புறுவதும். சுக்கிர–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மீன பாதத்துக்கான ராசி அதிபதி அடையாளம்: சுக்கிரனின் நீண்ட தசைக்குள் விரிந்த, தத்துவ ரீதியாக அழகான சாளரம்.",
      },
      {
        expect: "முதிர்ந்த வயதில் வரும் சூரிய தசை பூரட்டாதி அதிகாரத்தின் இறுதிப் படிகமாதலைக் கொண்டுவருகிறது. மாற்றும் ஞானம், தத்துவ ஆழம், நீண்ட நெருப்புகளின் சகிப்புத்தன்மை — அனைத்தும் இப்போது நெருப்பைக் கடந்து அதில் சுதந்திரமாக நிற்கும் மூத்தவரின் சூரியத் தெளிவு வழியாக வெளிப்படுகின்றன.",
        navigate: "முழுமையான மற்றும் மென்மையான உடல் பராமரிப்பு. சூரியன் தசை மூத்தவரின் அதிகாரம் இருப்பின் அதிகாரம் — வலியுறுத்தல் தேவையில்லை.",
        focus: "ஞாயிற்றுக்கிழமை சூரிய வழிபாடு. மாற்றப்பட்ட மூத்தவரின் சூரிய அதிகாரம் அதைக் கோருவதன் மூலம் அல்ல, அதில் நிலைத்திருப்பதன் மூலம் உலகிற்கு கொடுக்கப்படுகிறது.",
      },
      {
        expect: "மிக முதிர்ந்த வயதில் வரும் சந்திர தசை பூரட்டாதி மூத்தவருக்கு உணர்வுக் கடலைக் கொண்டுவருகிறது. நீண்ட நெருப்புகளுக்கும் சூரிய அதிகாரத்துக்கும் பிறகு, தீவிர இலட்சியவாதம் நோக்கின் சேவையில் சில நேரம் கடந்துவிட்ட உணர்வு ஆழம் — உணர்வுப் பரிமாணத்தின் திரும்புதலை சந்திரன் அழைக்கிறது.",
        navigate: "முழுமையான மற்றும் அர்ப்பணிக்கப்பட்ட உடல் பராமரிப்பு. இந்த வயதில் சந்திர தசையின் உணர்வு ஆழத்துக்கு, அந்த உணர்வுத் திறப்பைத் தாங்கும் உடல் சூழல் தேவை.",
        focus: "திங்கட்கிழமை சந்திர வழிபாடும், இந்த நபரை ஆழமாக நேசிப்பவர்களின் இருப்பும். சந்திர–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மீன பாதத்துக்கான சுருக்கமான ராசி அதிபதி இருப்பு.",
      },
      {
        expect: "இந்த வரிசையின் கடைசி தசையான செவ்வாய் தசையை அசாதாரணமாகச் சில பூரட்டாதி ஆத்மாக்கள் மட்டுமே அடைகின்றன. அடைபவர்களுக்கு, செவ்வாய் மாற்றும் நெருப்பின் இறுதிச் சுடரைக் கொண்டுவருகிறது — ஒற்றைக்கால் தெய்வத்தின் ஆற்றல் அதன் மிகக் காய்ச்சி வடித்த வடிவில்: தொடர்ந்து செல்லும் மன உறுதி, சுடரில் நிற்கும் திறன்.",
        navigate: "இந்த மிக முதிர்ந்த வயதில் முழுமையான, அர்ப்பணிப்புடன் கூடிய உடல் பராமரிப்பு.",
        focus: "அஜ ஏகபாதத்தின் சுடர் செவ்வாய் தசையில் நீண்ட வாழ்வு முழுவதும் நெருப்பில் நின்றவரின் இறுதி உயிர்ச்சக்தியாக எரிகிறது. மாற்றிய சுடர், இறுதியில், அதைச் சுமந்தவரிடமே திரும்புகிறது.",
      },
    ],
    spirituality: [
      { title: "அஜ ஏகபாதம் & புனித நெருப்பு வழிபாடு",  desc: "மாற்றும் நெருப்புக்குரிய, ஒற்றைக் காலுடைய அஜ ஏகபாதமே பூரட்டாதியின் தலைமை தெய்வம். புனித நெருப்பு வழிபாடு (அக்னி ஹோத்ர), நெருப்பு சடங்குகள் (யஜ்ஞங்கள்), மற்றும் மாற்றும் நெருப்பின் உள்ளே அமர்ந்திருக்கும் பயிற்சி." },
      { title: "குரு (மீனம்) / சனி (கும்பம்) பக்தி",     desc: "மீன பாதம்: வியாழக்கிழமை பிரஹஸ்பதி–தட்சிணாமூர்த்தி வழிபாடு மற்றும் ஒரு வாழும் குரு அல்லது ஞான மரபுடன் பக்தி உறவு. கும்ப பாதங்கள்: சனிக்கிழமை சனி பூஜை மற்றும் கட்டமைக்கப்பட்ட, நீண்ட-விளையாட்டு பக்தியின் வேண்டுமென்து வளர்ப்பு." },
      { title: "தபஸ் & மாற்றும் கடினமான நோன்பு",         desc: "தபஸின் ஆன்மீக மரபு — மாற்றும் வெப்பத்தை வேண்டுமென்று தழுவிக்கொள்வது, சுத்திகரிப்பு நெருப்பில் அமர்ந்திருக்கும் விருப்பம் — பூரட்டாதியின் மிகவும் உண்மையான பக்திப் பயிற்சி." },
    ],
    guidance: "அஜ ஏகபாதம் உங்களில் வைத்த நெருப்பு தண்டனை அல்ல — அது உலகுக்கு தேவையான மற்றும் நீங்கள் வர தயாரான மாற்றத்தின் கருவி. ஒற்றை கால் தெய்வம் ஒரு காலில் நிற்கிறது, ஏனென்றால் மற்ற காலு கண்ணுக்கு தெரியாதவற்றில் உள்ளது: நெருப்பில் நிற்க அனுமதிக்கும் நிலைத்தன்மை காணக்கூடிய உலகின் ஆதரவிலிருந்து வரவில்லை ஆனால் உண்மையானதிலும் மாறாதவற்றிலும் உள்ள வேரிலிருந்து வருகிறது. அந்த நிலைத்தன்மையுடன் உங்கள் நெருப்பில் நிற்கவும். எரிக்கப்பட்டது நீங்கள் என்றும் இல்லை; எரிவது முடிந்தவுடன் எஞ்சுவது நீங்கள் எப்போதும் இருந்தது.",
    careerNote: "மாற்றும் நெருப்பை தாங்கும் விருப்பம் — தன்னிலும் ஈடுபடும் சூழ்நிலைகளிலும் — மற்றும் தற்போதைய யதார்த்தம் கடுமையாக மறுக்கும்போதும் என்னவாக இருக்க வேண்டும் என்ற பார்வைக்கு உண்மையாக இருக்கும் திறன் மையமான தொழில்முறை தேவைகளாக இருக்கும் இடங்களில் பூரட்டாதி சிறப்பாக செயல்படுகிறது.",
    modernLead: "பூரட்டாதியின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "நெருப்பு மாற்றம், தீவிர இலட்சியவாதம், ஆன்மீக நெருப்பு பூரட்டாதியின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function PurvaBhadraVisualPage() {
  return <NatchathiramVisualContent data={POORATTATHI} visual={PURVA_BHADRA_VISUAL} timings={dasaTimingsFor(POORATTATHI.number)} />;
}
