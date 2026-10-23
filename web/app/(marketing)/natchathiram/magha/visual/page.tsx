import type { Metadata } from "next";
import { withTamilTwin } from "@/lib/localized-metadata";
import { withDasaTimingHold } from "@/lib/natchathiram-dasa-hold";
import { dasaTimingsFor } from "@/lib/natchathiram-dasa-timings";
import { nakshatraDisplayName } from "@/lib/nakshatra-display-name";
import { natchathiramVisualTa } from "@/lib/marketing-seo-ta";
import { MAGHA } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

const EN_METADATA: Metadata = {
  title: `${nakshatraDisplayName(MAGHA.number, "en")} — Visual Profile`,
  description: "Visual profile of Magam Nakshathiram: personality traits, career strengths, dasa timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/magha/visual" },
  openGraph: {
    title: `${nakshatraDisplayName(MAGHA.number, "en")} — Visual Profile`,
    description: "Visual profile of Magam Nakshathiram: personality traits, career strengths, dasa timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/magha/visual",
    type: "article",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withDasaTimingHold(await withTamilTwin(EN_METADATA, "/natchathiram/magha/visual", natchathiramVisualTa("magha")!), "magha");
}

const MAGHA_VISUAL: NatchathiramVisualData = {
  atAGlance: [
    { label: "Regal Authority",       score: 96 },
    { label: "Ancestral Wisdom",      score: 94 },
    { label: "Commanding Presence",   score: 93 },
    { label: "Karmic Depth",          score: 92 },
    { label: "Legacy Building",       score: 95 },
  ],

  radar: {
    labels: ["Authority", "Ancestry", "Leadership", "Karma", "Legacy", "Dignity"],
    values: [96, 94, 93, 92, 95, 91],
  },

  coreStrengths: [
    { symbol: "◎", label: "Regal Authority",       score: 96, desc: "The throne is Magha's symbol and its birthright — this nakshathiram carries a natural authority that commands respect without demanding it." },
    { symbol: "◈", label: "Legacy Building",        score: 95, desc: "The Pitru deities preside — Magha does not live only for the present but for the lineage: what is built now must outlast the builder." },
    { symbol: "⚡", label: "Ancestral Wisdom",      score: 94, desc: "Ketu's access to past-life memory and the Pitrus' accumulated knowledge give Magha an unusual historical and karmic depth of understanding." },
    { symbol: "♥", label: "Commanding Presence",   score: 93, desc: "Leo's solar radiance combined with Ketu's spiritual gravity — Magha walks into a room and is felt before being seen." },
    { symbol: "△", label: "Karmic Depth",           score: 92, desc: "Ketu strips away the inessential; Magha carries the accumulated weight of lineage karma and the clarity to resolve what others inherited." },
    { symbol: "☽", label: "Royal Dignity",          score: 91, desc: "The palanquin is borne by those who serve the throne — Magha instinctively maintains dignity, ceremony, and the proprieties that mark genuine leadership." },
  ],

  careerAbilities: [
    { label: "Government & Administration", score: 96 },
    { label: "Military & Law Enforcement",  score: 93 },
    { label: "Executive Leadership",        score: 95 },
    { label: "Astrology & Spiritual Work",  score: 92 },
    { label: "Heritage & Cultural Research", score: 91 },
  ],
  careerNote: "Magha thrives wherever authority, lineage, and the weight of tradition must be carried with dignity — the executive, the officer, the judge, the astrologer, and the keeper of cultural memory all embody Magha's essential nature.",

  careerClusters: [
    { symbol: "◎", title: "Government & Public Administration", desc: "Civil service, policy making, judicial positions — the throne of public authority is Magha's natural seat." },
    { symbol: "◈", title: "Military & Law Enforcement",         desc: "Command structures, protective authority, institutional discipline — Magha upholds order with genuine conviction." },
    { symbol: "⚡", title: "Executive Corporate Leadership",    desc: "CEO, Managing Director, Board positions — the palanquin is carried by many; Magha provides the direction." },
    { symbol: "♥", title: "Astrology & Ancestral Healing",     desc: "Jothidam, pitru karma resolution, family constellation work — Magha's Ketu-Pitru connection gives rare depth to ancestral spiritual work." },
    { symbol: "△", title: "Heritage & Cultural Preservation",  desc: "Archaeology, museum leadership, cultural institutions, historical research — Magha guards what must not be lost." },
    { symbol: "☽", title: "Legal & Judicial Work",             desc: "Law, courts, regulatory authority, arbitration — Magha's dignity and authority lend natural weight to the judicial function." },
  ],

  modernApps: [
    { symbol: "◎", title: "Governance Technology",            desc: "E-government platforms, public sector digital transformation, policy analytics — authority in the digital age." },
    { symbol: "◈", title: "Corporate Leadership Platforms",   desc: "Executive coaching tech, board management software, organisational leadership tools." },
    { symbol: "⚡", title: "Genealogy & Ancestry Technology", desc: "DNA ancestry platforms, family history apps, lineage research tools — Magha's Pitru connection at digital scale." },
    { symbol: "♥", title: "Cultural Heritage Platforms",      desc: "Digital museums, heritage preservation technology, historical AI — guarding what must not be lost." },
    { symbol: "△", title: "Legal Technology",                 desc: "Legal research platforms, court management systems, regulatory compliance tools — the throne of law." },
    { symbol: "☽", title: "Ancestral Healing Technology",    desc: "Family constellation apps, pitru karma platforms, ancestral memory tools — the Pitrus in the digital world." },
  ],

  dashaTimeline: [
    {
      planet: "Ketu", theme: "Born to the Ancestors",
      detail: {
        expect: "Magha opens life in Ketu dasa — a fitting beginning for the nakshathiram of the ancestral throne. Ketu's is a short opening dasa, and the balance left at birth runs from long for births in the first pada to brief for the fourth; the range shown for this dasa gives it. Childhood under Ketu's influence is often marked by an unusual awareness of lineage: the child who is particularly attached to grandparents, who shows an instinctive respect for elders, who seems to carry the family's stories as personal memory. In many Magha families, the birth itself is accompanied by a significant ancestral event — the death or illness of an elder, a family gathering, or a moment that marks the arrival of a new lineage-carrier. The child may be precociously serious, bearing a quality of gravity that sets them apart from their peers.",
        navigate: "Ketu dasa's challenge for young Magha is the weight it carries from birth. The child who takes on ancestral responsibility before they understand it can become prematurely burdened. Parents who notice this pattern should ensure the child also experiences the full lightness of childhood — play, spontaneity, and freedom from inherited expectation. The Ketu–Venus bhukti brings a welcome interval of warmth and sensory pleasure; the Ketu–Mercury bhukti, which closes the dasa, awakens the first analytical intelligence (the table below gives when each begins and how long it lasts; for the shorter balances the first falls before birth).",
        focus: "Pitru tharpanam performed by the family during Ketu dasa establishes the most important spiritual foundation for Magha's life. The ancestors who are invoked at this threshold are the presiding powers of the entire journey. Ganapati worship, the principal Ketu remedy, with Navagraha worship and Ketu shrine offerings, provides additional grounding.",
      },
    },
    {
      planet: "Venus", theme: "The Young Regent",
      detail: {
        expect: "Venus dasa is Magha's formation — a long stretch of education, creative development, and the first flowering of the personal authority that is the nakshathiram's birthright. It opens in childhood and carries through school and college, running on toward the start of working life. The school years produce a student who naturally takes leadership roles: the class representative, the sports captain, the one whose opinion carries weight. The instinct to stand at the front is not arrogance but constitutional — Magha simply orients toward the head of any gathering. Higher education or professional training follows, typically in a field that carries some form of authority or public service. Love relationships begin in the later school and college years and deepen. Where marriage falls within this dasa, it is read from the seventh house and its lord, with Venus and Jupiter as the natural significators, and judged from the individual horoscope as a tendency rather than a fixed time.",
        navigate: "Venus dasa's challenge for Magha is managing the gap between the authority they feel entitled to and the experience they have actually accumulated. The young regent who acts as king before coronation invites resistance that patient development would avoid. The Venus–Rahu bhukti (the table below gives when it begins and how long it lasts) is the most volatile sub-period; the temptation toward shortcuts, sudden reversals, or reckless expressions of independence must be consciously managed. Physical concerns: skin, kidneys, sweet consumption and metabolic health.",
        focus: "Friday Lakshmi worship and the deliberate cultivation of Venus's social intelligence alongside Leo's natural authority. Also watch the Venus–Moon bhukti within this dasa (the bhukti table below gives when it begins and how long it lasts). Moon governs the twelfth house from Magha's natal Leo placement, making this window one of inward reflection and spiritual grounding that paradoxically strengthens the outward authority being built.",
      },
    },
    {
      planet: "Sun", theme: "The Coronation",
      detail: {
        expect: "Sun dasa is Magha's coronation — the most naturally aligned dasa for this Leo nakshathiram, and the rasi lord's own dasa. Sun is the ruler of Leo and the natural king of the planetary cabinet; in Sun dasa, Magha's authority, presence, and institutional standing reach their first peak. It falls in young adulthood, and career establishes its trajectory; leadership positions arrive or are consolidated; the name that will define the professional identity for decades is being written. Government connections, official recognition, and institutional trust all increase. Relationships that were established in Venus dasa clarify: serious commitments deepen, unsuitable ones resolve. Children may arrive, beginning the lineage that Magha will guard with ancestral gravity.",
        navigate: "Sun dasa's primary challenge for Magha is the temptation toward pride. The Leo king, newly crowned, can mistake the authority that was given (by lineage, by Ketu's karma, by Venus's development) for authority that was self-created. Genuine leadership is always in service of something beyond the self; Sun dasa tests whether Magha has learned this. The Sun–Saturn bhukti (the table below gives when it begins and how long it lasts) is the most demanding sub-period: the planet of authority encounters the planet of accountability, and the result is either a disciplined deepening or a painful correction. Physical care: heart, eyes, circulatory health.",
        focus: "Sunday Surya worship, Aditya Hridayam recitation, and regular pitru tharpanam — honouring the source of the authority that Sun dasa makes visible. The coronation is meaningful only because the ancestors who sat on this throne before are being honoured.",
      },
    },
    {
      planet: "Moon", theme: "The King's Heart",
      detail: {
        expect: "Moon dasa introduces the emotional dimension of authority that Sun dasa's solar clarity can overshadow. The ruler who has been defined by command and presence now discovers that the most effective leadership is rooted in genuine care for those being led. Family life deepens: the children born in Sun dasa grow; the domestic sphere, which Magha has sometimes treated as secondary to the public role, demands and rewards genuine emotional presence. For many Magha natives, Moon dasa brings the recognition that the lineage they are building requires not only achievement but warmth — a legacy that others will want to carry forward.",
        navigate: "Moon dasa's health concerns at this stage of life are digestive, emotional, and related to fluid balance. The Ketu influence that opened life now re-emerges in Moon dasa through Ketu's opposite relationship with Moon — emotional restlessness, difficulty settling, or a recurring sense of existential incompleteness may surface and must be addressed through practice rather than suppressed. The Moon–Ketu bhukti (the table below gives when it begins and how long it lasts) is the most internally turbulent sub-period; ancestral karma and pitru issues may resurface for resolution.",
        focus: "Monday Moon worship, water offerings, and the pitru tharpanam that is most natural to Magha's practice. Also watch the Moon–Sun bhukti, which closes this dasa (the bhukti table below gives when it begins and how long it lasts). This brief interval brings the solar confidence of Sun dasa's coronation into a softer and more relationally attuned expression — the perfect sub-period for the king to walk among the people.",
      },
    },
    {
      planet: "Mars", theme: "The Warrior Phase",
      detail: {
        expect: "Mars dasa brings Magha's midlife authority into its most direct and decisive expression. The administrator becomes the commander; the corporate leader makes the defining strategic moves; the public official acts with the boldness that their position now warrants. Career reaches a peak of decisive action: major deals, significant hires or restructurings, institutional contests that will define the legacy. Physical vitality, which may have shown signs of stress in Moon dasa, is restored under Mars's energising influence. The ancestral warrior dimension of Magha — the lineage that defended its territory, the family that held its position against competition — finds its contemporary expression.",
        navigate: "Mars dasa's primary challenge is the management of pride and combativeness that can accompany this period of peak authority. Magha's Leo intensity, amplified by Mars, can make this a period of unnecessary battles — the king who fights wars that need not be fought depletes the treasury needed for the legacy. The Mars–Rahu bhukti (the table below gives when it begins and how long it lasts) is the most volatile sub-period; significant risks should be evaluated with unusual care in this window. Physical care: blood pressure, accident prevention, cardiac monitoring.",
        focus: "Tuesday Mars shrine worship, red flower offerings, and the deliberate practice of strategic patience. The warrior who chooses battles carefully wins more than the warrior who contests everything.",
      },
    },
    {
      planet: "Rahu", theme: "The Expanding Kingdom",
      detail: {
        expect: "Rahu dasa, running from mid-life into later life, is Magha's most expansive and potentially most consequential period. Rahu disrupts the established order — which for Magha, whose identity is rooted in tradition and lineage, can feel destabilising. But Rahu's expansion is necessary: the kingdom that has been built over a lifetime must evolve or calcify, and Rahu provides the disruption that forces evolution. International connections, unexpected alliances, technological adaptation, or a late-career pivot into an entirely new domain may arrive. The Pitru inheritance that Ketu brought at birth now encounters Rahu's shadowy opposite — the question of which traditions deserve to be carried forward and which must be released is faced directly.",
        navigate: "Rahu's long span covers the most consequential chapter of Magha's public life. The Rahu–Ketu bhukti (the table below gives when it begins and how long it lasts) is a significant eclipse point — a full cycle of karmic reckoning in which the entire lineage inheritance and the entire public life are held in balance simultaneously. Health concerns in this stage are primarily cardiovascular, orthopedic, and metabolic; Rahu's intensity requires deliberate physical management.",
        focus: "Rahu shrine prayers, coconut offerings, and regular pitru tharpanam to maintain the ancestral grounding that Rahu's expansion can otherwise loosen. The expanding kingdom remains legitimate only when the throne's ancestral foundation is continuously honoured.",
      },
    },
    {
      planet: "Jupiter", theme: "The Elder King",
      detail: {
        expect: "Jupiter dasa, in later life, is Magha's most naturally wise and generous period. Jupiter, the guru of the gods, brings an expansive benediction to the life of one who has carried authority with discipline and honoured the ancestors with care. This long dasa is characterised by a quality of regal generosity: the giving away of what has been accumulated, the mentoring of successors, the transmission of lineage wisdom. Grandchildren receive an extraordinary quality of ancestral attention. For those in spiritual or institutional roles, Jupiter dasa produces the most authoritative and grace-filled work of the entire life.",
        navigate: "Physical care in this stage is primarily orthopedic, circulatory, and metabolic. Jupiter's expansive optimism can occasionally push the body beyond its reduced capacity; deliberate and gentle management of energy reserves is essential. The Jupiter–Saturn bhukti (the table below gives when it begins and how long it lasts) demands a careful reduction in scope.",
        focus: "Thursday Jupiter worship, Guru Puja, and the deliberate transmission — through writing, speech, or action — of what this life has learned about authority, lineage, and the responsibility of the throne.",
      },
    },
    {
      planet: "Saturn", theme: "The Final Accountability",
      detail: {
        expect: "Saturn dasa, in very advanced age, is reached by very few. For those Magha souls who arrive here — having carried the throne through a full lifetime of authority and ancestral service — Saturn brings the final reckoning: the king who governed well is seen clearly; the inheritance that was protected is complete. Saturn in Leo, the sign of solar authority, is in a complex relationship; but for Magha, who has learned through long experience that genuine authority serves rather than commands, Saturn's accountability is ultimately vindicating.",
        navigate: "Complete physical care and a willingness to receive rather than give — the throne that has given its entire life to others now allows others to give. This is the final teaching of the Pitrus: authority that has truly served completes its cycle and returns to the source.",
        focus: "Saturday Saturn worship, Hanuman worship, sesame offerings, and the simple dignity of one whose throne was honoured. The Pitrus receive the life that was lived in their name.",
      },
    },
  ],

  spirituality: [
    {
      title: "Pitru Devata Worship & Tharpanam",
      desc: "The ancestral deities are Magha's presiding powers. Regular pitru tharpanam, Gaya pilgrimage, Rameswaram offerings, and shraddha ceremonies are the most essential spiritual practices — honouring the source of the authority that Magha carries.",
    },
    {
      title: "Sun Worship & Aditya Hridayam",
      desc: "Leo's solar king demands solar devotion. Sunday Surya worship, Aditya Hridayam recitation, Surya namaskar, and Ramapattabhishekam puja are Magha's primary practices for maintaining the regal clarity that Leo Sun provides.",
    },
    {
      title: "Ketu & Liberation Sadhana",
      desc: "Ketu rules Magha and governs its deepest spiritual inheritance. Ketu shrine worship, Ayyappa devotion, liberation-oriented practices, and ancestral karma resolution work address the spiritual depth that the throne requires.",
    },
  ],

  guidance: "The throne is not yours — it was given to you by those who sat on it before, and your task is to give it to those who will sit on it after. Authority without ancestral gratitude is ambition. Authority with ancestral gratitude is legacy. Honour the Pitrus in everything you do, and the throne will hold you as firmly as you hold it.",

  compatibleEn: ["Aswini", "Moolam", "Pooram", "Uthiram", "Anusham"],
  compatibleNote: "These nakshatras complement Magha's regal authority and ancestral depth with vitality, rootedness, creativity, and heartfelt devotion.",

  ta: {
    atAGlanceLabels: ["அரச அதிகாரம்", "முன்னோர் ஞானம்", "கம்பீரமான இருப்பு", "கர்ம ஆழம்", "மரபு கட்டுதல்"],
    radarLabels: ["அதிகாரம்", "முன்னோர்", "தலைமை", "கர்மம்", "மரபு", "கண்ணியம்"],
    coreStrengths: [
      { label: "அரச அதிகாரம்",     desc: "சிம்மாசனம் மகத்தின் சின்னமும் இயல்பும் — இந்த நட்சத்திரம் கோரிக்கை இல்லாமல் மரியாதையை கட்டளையிடும் இயல்பான அதிகாரத்தை கொண்டுள்ளது." },
      { label: "மரபு கட்டுதல்",     desc: "பித்ரு தேவதைகள் ஆட்சி செய்கிறார்கள் — மக ஜாதகர் தற்போதைக்கு மட்டும் வாழ்வதில்லை, வம்சாவளிக்காக வாழ்கிறார்." },
      { label: "முன்னோர் ஞானம்",   desc: "கேதுவின் முன்வாழ்வு நினைவு மற்றும் பித்ருக்களின் திரட்டப்பட்ட அறிவு மகத்திற்கு அசாதாரண வரலாற்று மற்றும் கர்ம புரிதல் ஆழத்தை கொடுக்கின்றன." },
      { label: "கம்பீரமான இருப்பு", desc: "சிம்மத்தின் சூரிய கதிர்வீச்சும் கேதுவின் ஆன்மீக கனமும் இணைந்தது — மகம் அறைக்குள் நுழைகிறது, பார்க்கப்படுவதற்கு முன்பே உணரப்படுகிறது." },
      { label: "கர்ம ஆழம்",         desc: "கேது இன்றியமையாதவற்றை நீக்குகிறது — மகம் வம்சாவளி கர்மத்தின் திரட்டப்பட்ட எடையை கொண்டுள்ளது மற்றும் மற்றவர்கள் பெற்றவற்றை தீர்க்கும் தெளிவையும் கொண்டுள்ளது." },
      { label: "அரச கண்ணியம்",      desc: "பல்லக்கு சிம்மாசனத்திற்கு சேவை செய்பவர்களால் சுமக்கப்படுகிறது — மகம் உண்மையான தலைமையை குறிக்கும் கண்ணியம், சடங்கு, ஆசாரங்களை இயல்பாகவே பராமரிக்கிறது." },
    ],
    careerAbilityLabels: ["அரசு & நிர்வாகம்", "ராணுவம் & சட்டம்", "நிர்வாக தலைமை", "ஜோதிடம் & ஆன்மீக வேலை", "பாரம்பரிய & கலாச்சார ஆராய்ச்சி"],
    careerClusters: [
      { title: "அரசு & பொது நிர்வாகம்",    desc: "சிவில் சேவை, கொள்கை வகுப்பு, நீதித்துறை பதவிகள் — பொது அதிகாரத்தின் சிம்மாசனம் மகத்தின் இயல்பான இருக்கை." },
      { title: "ராணுவம் & சட்டம் அமலாக்கம்", desc: "கட்டளை கட்டமைப்புகள், பாதுகாப்பு அதிகாரம் — மகம் உண்மையான நம்பிக்கையுடன் ஒழுங்கை காப்பாற்றுகிறது." },
      { title: "நிர்வாக நிறுவன தலைமை",     desc: "CEO, தலைமை இயக்குனர், வாரியம் — பல்லக்கு பலரால் சுமக்கப்படுகிறது; மகம் திசை வழங்குகிறது." },
      { title: "ஜோதிடம் & முன்னோர் குணப்படுத்தல்", desc: "ஜோதிடம், பித்ரு கர்ம தீர்வு, குடும்ப நட்சத்திர வேலை — மகத்தின் கேது-பித்ரு தொடர்பு முன்னோர் ஆன்மீக வேலைக்கு அரிய ஆழத்தை கொடுக்கிறது." },
      { title: "பாரம்பரிய & கலாச்சார பாதுகாப்பு", desc: "தொல்லியல், அருங்காட்சியக தலைமை, கலாச்சார நிறுவனங்கள் — மகம் இழக்கக்கூடாதவற்றை காவல் செய்கிறது." },
      { title: "சட்ட & நீதித்துறை வேலை",   desc: "சட்டம், நீதிமன்றங்கள், ஒழுங்குமுறை அதிகாரம் — மகத்தின் கண்ணியம் மற்றும் அதிகாரம் நீதித்துறை செயல்பாட்டிற்கு இயல்பான எடையை கொடுக்கின்றன." },
    ],
    modernApps: [
      { title: "ஆட்சி தொழில்நுட்பம்",         desc: "மின்-அரசு தளங்கள், பொதுத் துறை டிஜிட்டல் மாற்றம் — டிஜிட்டல் யுகத்தில் அதிகாரம்." },
      { title: "நிறுவன தலைமை தளங்கள்",         desc: "நிர்வாக பயிற்சி தொழில்நுட்பம், வாரிய மேலாண்மை மென்பொருள்." },
      { title: "வம்சாவளி & முன்னோர் தொழில்நுட்பம்", desc: "DNA வம்சாவளி தளங்கள், குடும்ப வரலாற்று ஆப்கள் — டிஜிட்டல் அளவில் மகத்தின் பித்ரு தொடர்பு." },
      { title: "கலாச்சார பாரம்பரிய தளங்கள்",   desc: "டிஜிட்டல் அருங்காட்சியகங்கள், பாரம்பரிய பாதுகாப்பு தொழில்நுட்பம் — இழக்கக்கூடாதவற்றை காவல் செய்தல்." },
      { title: "சட்டல் தொழில்நுட்பம்",          desc: "சட்ட ஆராய்ச்சி தளங்கள், நீதிமன்ற மேலாண்மை அமைப்புகள் — சட்டத்தின் சிம்மாசனம்." },
      { title: "முன்னோர் குணப்படுத்தல் தொழில்நுட்பம்", desc: "குடும்ப நட்சத்திர ஆப்கள், பித்ரு கர்ம தளங்கள் — டிஜிட்டல் உலகில் பித்ருக்கள்." },
    ],
    dashaThemes: [
      "முன்னோர்களிடம் பிறப்பு — கேது திறப்பு, முன்னோர் விழிப்புணர்வு, வம்சாவளி கர்மம்",
      "இளம் ஆட்சியாளர் — சுக்கிர கல்வி, தலைமை வளர்ச்சி, முதல் அதிகாரம்",
      "முடிசூட்டு — சூரியன் உச்சம், நிறுவன நிலை, அரசு அங்கீகாரம்",
      "அரசனின் இதயம் — சந்திர உணர்வு ஆழம், குடும்ப செழிப்பு",
      "போர்வீரன் கட்டம் — செவ்வாய் தீர்க்கமான நடவடிக்கை, நிறுவன உச்சம்",
      "விரிவடையும் ராஜ்யம் — ராகு பரிணாமம், மரபு மாறுகிறது",
      "முதியோர் அரசன் — குரு ஞானம், தலைமுறை ஆசீர்வாதம்",
      "இறுதி பொறுப்புக்கூறல் — சனி கர்ம நிறைவு",
    ],
    dashaDetails: [
      {
        expect: "மகம் கேது தசையில் வாழ்க்கையைத் தொடங்குகிறது — முன்னோரின் சிம்மாசனத்தின் நட்சத்திரத்துக்குப் பொருத்தமான தொடக்கம். கேது குறுகிய தொடக்க தசை; பிறக்கும்போது மீதமுள்ள இருப்பு முதல் பாதத்தில் நீளமாகவும் நான்காம் பாதத்தில் சிறிதாகவும் இருக்கும் — இந்த தசைக்குக் காட்டப்படும் வரம்பு அதைச் சொல்கிறது. கேதுவின் தாக்கத்தில் குழந்தைப் பருவம் வம்சாவளி பற்றிய அசாதாரண விழிப்புணர்வால் குறிக்கப்படுகிறது: தாத்தா-பாட்டியிடம் குறிப்பாக ஒட்டிக்கொள்ளும் குழந்தை, இயல்பாகவே பெரியவர்களுக்கு மரியாதை காட்டும் குழந்தை, குடும்பக் கதைகளைத் தன் சொந்த நினைவாகச் சுமப்பது போல் தோன்றும் குழந்தை. பல மகம் குடும்பங்களில், பிறப்பே ஒரு முக்கியமான முன்னோர் நிகழ்வுடன் வருகிறது — ஒரு மூத்தவரின் மரணம் அல்லது நோய், குடும்பக் கூடுகை, அல்லது புதிய வம்சம் தாங்குபவரின் வருகையைக் குறிக்கும் தருணம். குழந்தை வயதுக்கு மீறி கனமான தன்மையுடன், சகாக்களிடமிருந்து வேறுபடுத்தும் கம்பீரத்துடன் இருக்கலாம்.",
        navigate: "இளம் மகத்திற்கு கேது தசையின் சவால் பிறப்பிலிருந்தே அது சுமக்கும் எடை. முன்னோர் பொறுப்பை புரிந்துகொள்ளும் முன்பே ஏற்கும் குழந்தை முன்கூட்டியே சுமையடையலாம். இந்த முறையைக் கவனிக்கும் பெற்றோர், குழந்தை குழந்தைப் பருவத்தின் முழு இலகுத்தன்மையையும் — விளையாட்டு, தன்னிச்சை, பரம்பரை எதிர்பார்ப்பிலிருந்து விடுதலை — அனுபவிப்பதை உறுதிசெய்ய வேண்டும். கேது–சுக்கிர புக்தி வரவேற்கத்தக்க அரவணைப்பும் புலன் இன்பமும் கொண்டுவருகிறது; இந்த தசையை நிறைவு செய்யும் கேது–புதன் புக்தி முதல் பகுப்பாய்வு நுண்ணறிவை எழுப்புகிறது (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்; குறைந்த இருப்பில் முதலாவது பிறப்புக்கு முன்பே வந்துவிடும்).",
        focus: "கேது தசையில் குடும்பத்தால் செய்யப்படும் பித்ரு தர்ப்பணம் மகத்தின் வாழ்க்கையின் மிக முக்கியமான ஆன்மீக அடித்தளத்தை நிறுவுகிறது. இந்த வாசலில் அழைக்கப்படும் முன்னோர்களே முழுப் பயணத்தின் தலைமைச் சக்திகள். கேதுவின் முதன்மைப் பரிகாரமான விநாயகர் வழிபாடும், நவக்கிரக வழிபாடும், கேது சன்னதி அர்ப்பணங்களும் கூடுதல் அடித்தளம் தருகின்றன.",
      },
      {
        expect: "சுக்கிர தசை மகத்தின் உருவாக்க காலம் — கல்வி, படைப்பு வளர்ச்சி, நட்சத்திரத்தின் பிறப்புரிமையான தனிப்பட்ட அதிகாரத்தின் முதல் மலர்ச்சி ஆகியவற்றின் நீண்ட காலம். இது குழந்தைப் பருவத்தில் தொடங்கி, பள்ளி, கல்லூரி வழியாக வேலை வாழ்வின் தொடக்கம் நோக்கிச் செல்கிறது. பள்ளி ஆண்டுகள் இயல்பாகவே தலைமைப் பங்கில் நிற்கும் மாணவரை உருவாக்குகின்றன: வகுப்புப் பிரதிநிதி, விளையாட்டுத் தலைவர், கருத்துக்கு எடை உள்ளவர். முன்னே நிற்கும் உந்துதல் அகந்தை அல்ல, இயல்புக்குரியது — எந்தக் கூட்டத்திலும் தலைமை நோக்கியே மகம் இயல்பாகத் திரும்புகிறது. உயர் கல்வி அல்லது தொழில் பயிற்சி தொடர்கிறது, பொதுவாக அதிகாரம் அல்லது பொதுச் சேவை சார்ந்த துறையில். காதல் உறவுகள் பிந்திய பள்ளி, கல்லூரி ஆண்டுகளில் தொடங்கி ஆழமடைகின்றன. இந்தத் தசைக்குள் திருமணம் அமைந்தால், அது ஜாதகத்தின் ஏழாம் வீட்டையும் அதன் அதிபதியையும் கொண்டு பார்க்கப்படுகிறது; சுக்கிரனும் குருவும் அதன் இயல்பான காரகர்கள். அது ஒரு நிலையான காலம் அல்ல, ஒரு போக்கே.",
        navigate: "மகத்திற்கு சுக்கிர தசையின் சவால், தனக்கு உரிமை உண்டு என்று உணரும் அதிகாரத்துக்கும் உண்மையில் திரட்டிய அனுபவத்துக்கும் இடையிலான இடைவெளியை நிர்வகிப்பது. முடிசூட்டுக்கு முன்பே அரசனாகச் செயல்படும் இளம் ஆட்சியாளர், பொறுமையான வளர்ச்சி தவிர்த்திருக்கக்கூடிய எதிர்ப்பை அழைக்கிறார். சுக்கிர–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மிகவும் ஆவேசமான துணைக் காலம்; குறுக்கு வழி மோகம், திடீர் தலைகீழ் மாற்றங்கள், கவனமற்ற சுதந்திர வெளிப்பாடுகளை உணர்வுடன் நிர்வகிக்க வேண்டும். உடல் கவலைகள்: தோல், சிறுநீரகங்கள், இனிப்பு உட்கொள்ளல், வளர்சிதை மாற்ற ஆரோக்கியம்.",
        focus: "வெள்ளிக்கிழமை லட்சுமி வழிபாடும், சிம்மத்தின் இயல்பான அதிகாரத்துடன் சுக்கிரனின் சமூக நுண்ணறிவையும் வேண்டுமென்றே வளர்ப்பதும். சுக்கிர தசையில் சுக்கிர–சந்திர புக்தியையும் கவனிக்கவும் (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்). மகத்தின் சிம்ம நிலையிலிருந்து சந்திரன் பன்னிரண்டாம் வீட்டை ஆள்கிறார்; இதனால் இந்த சாளரம் உள்நோக்கிய சிந்தனையும் ஆன்மீக அடித்தளமுமாக அமைந்து, முரண்பாடாக கட்டப்படும் வெளிப்புற அதிகாரத்தை வலுப்படுத்துகிறது.",
      },
      {
        expect: "சூரிய தசை மகத்தின் முடிசூட்டு — இந்த சிம்ம நட்சத்திரத்துக்கு மிகவும் இயல்பாக இணைந்த தசை; ராசி அதிபதியின் சொந்த தசையும். சூரியன் சிம்மத்தின் அதிபதி, கிரகச் சபையின் இயல்பான அரசன்; சூரிய தசையில் மகத்தின் அதிகாரம், இருப்பு, நிறுவன நிலை தங்கள் முதல் உச்சத்தை அடைகின்றன. இது இளம் வயது வந்த காலத்தில் வருகிறது; தொழில் தன் பாதையை நிறுவுகிறது; தலைமைப் பதவிகள் வருகின்றன அல்லது உறுதிப்படுகின்றன; பல பத்தாண்டுகளுக்கு தொழில்முறை அடையாளத்தை வரையறுக்கும் பெயர் எழுதப்படுகிறது. அரசு தொடர்புகள், அதிகாரபூர்வ அங்கீகாரம், நிறுவன நம்பிக்கை எல்லாம் உயர்கின்றன. சுக்கிர தசையில் நிறுவப்பட்ட உறவுகள் தெளிவடைகின்றன: தீவிர அர்ப்பணிப்புகள் ஆழமடைகின்றன, பொருந்தாதவை தீர்கின்றன. குழந்தைகள் வரலாம்; மகம் முன்னோர் கம்பீரத்துடன் காக்கப்போகும் வம்சம் தொடங்குகிறது.",
        navigate: "மகத்திற்கு சூரிய தசையின் முதன்மைச் சவால் செருக்கு நோக்கிய சோதனை. புதிதாக முடிசூட்டப்பட்ட சிம்ம அரசன், (வம்சத்தாலும் கேதுவின் கர்மத்தாலும் சுக்கிரனின் வளர்ச்சியாலும்) தரப்பட்ட அதிகாரத்தை தானாக உருவாக்கிய அதிகாரம் என்று தவறாக எண்ணலாம். உண்மையான தலைமை எப்போதும் தன்னைத் தாண்டிய ஒன்றுக்குச் சேவை செய்கிறது; மகம் இதைக் கற்றுக்கொண்டாரா என்பதை சூரிய தசை சோதிக்கிறது. சூரிய–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மிகவும் கோரும் துணைக் காலம்: அதிகாரத்தின் கிரகம் பொறுப்புக்கூறலின் கிரகத்தை சந்திக்கிறது; விளைவு ஒழுக்கமான ஆழமாதலோ வலி தரும் திருத்தமோ. உடல் கவனம்: இதயம், கண்கள், இரத்த ஓட்டம்.",
        focus: "ஞாயிற்றுக்கிழமை சூரிய வழிபாடு, ஆதித்ய ஹ்ருதயம் பாராயணம், வழக்கமான பித்ரு தர்ப்பணம். முடிசூட்டு பொருளுள்ளது, ஏனென்றால் முன்னே அமர்ந்தவர்கள் கௌரவிக்கப்படுகிறார்கள்.",
      },
      {
        expect: "சந்திர தசை, சூரிய தசையின் சூரியத் தெளிவு நிழலிடக்கூடிய அதிகாரத்தின் உணர்வுப் பரிமாணத்தை அறிமுகப்படுத்துகிறது. கட்டளையாலும் இருப்பாலும் வரையறுக்கப்பட்ட ஆட்சியாளர், மிகச் சிறந்த தலைமை வழிநடத்தப்படுபவர்கள் மீதான உண்மையான அக்கறையில் வேரூன்றியது என்பதை இப்போது கண்டுபிடிக்கிறார். குடும்ப வாழ்க்கை ஆழமடைகிறது: சூரிய தசையில் பிறந்த குழந்தைகள் வளர்கிறார்கள்; பொது பாத்திரத்துக்கு இரண்டாம் பட்சமாக மகம் சில நேரம் நடத்திய வீட்டுக் களம், உண்மையான உணர்வு இருப்பைக் கோருகிறது, அதற்கு வெகுமதியும் அளிக்கிறது. பல மக ஜாதகர்களுக்கு, சந்திர தசை, தாங்கள் கட்டும் வம்சத்துக்கு சாதனை மட்டுமல்ல, அரவணைப்பும் — பிறர் முன்னெடுக்க விரும்பும் மரபு — தேவை என்ற உணர்தலைக் கொண்டுவருகிறது.",
        navigate: "வாழ்வின் இந்த கட்டத்தில் சந்திர தசையின் ஆரோக்கிய கவலைகள் செரிமானம், உணர்வு, திரவ சமநிலை சார்ந்தவை. வாழ்வைத் தொடங்கிய கேதுவின் தாக்கம், சந்திரனுடன் கேதுவுக்கு உள்ள எதிர் உறவு வழியாக சந்திர தசையில் மீண்டும் எழுகிறது — உணர்வு அமைதியின்மை, நிலைபெற சிரமம், அல்லது இருத்தல் குறித்த நிறைவின்மை உணர்வு எழலாம்; அதை அடக்காமல் பயிற்சியால் எதிர்கொள்ள வேண்டும். சந்திர–கேது புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) உள்ளுக்குள் மிகவும் கலக்கமான துணைக் காலம்; முன்னோர் கர்மமும் பித்ரு பிரச்சினைகளும் தீர்வுக்காக மீண்டும் எழலாம்.",
        focus: "திங்கட்கிழமை சந்திர வழிபாடு, நீர் அர்ப்பணம், மகத்தின் வழக்கத்துக்கு மிகவும் இயல்பான பித்ரு தர்ப்பணம். இந்த தசையை நிறைவு செய்யும் சந்திர–சூரிய புக்தியையும் கவனிக்கவும் (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்). இந்த குறுகிய இடைவெளி சூரிய தசையின் முடிசூட்டு சூரிய நம்பிக்கையை மென்மையான, உறவுகளுக்கு இணக்கமான வெளிப்பாட்டுக்குக் கொண்டுவருகிறது — அரசன் மக்களிடையே நடக்கச் சிறந்த துணைக் காலம்.",
      },
      {
        expect: "செவ்வாய் தசை மகத்தின் நடுவயது அதிகாரத்தை அதன் மிக நேரடியான, தீர்க்கமான வெளிப்பாட்டுக்குக் கொண்டுவருகிறது. நிர்வாகி தளபதியாகிறார்; நிறுவனத் தலைவர் வரையறுக்கும் உத்தி நகர்வுகளைச் செய்கிறார்; பொது அதிகாரி இப்போது தன் பதவி உரிமையாக்கும் துணிச்சலுடன் செயல்படுகிறார். தொழில் தீர்க்கமான செயல்பாட்டின் உச்சத்தை அடைகிறது: பெரும் ஒப்பந்தங்கள், முக்கியமான நியமனங்கள் அல்லது மறுகட்டமைப்புகள், மரபை வரையறுக்கும் நிறுவனப் போட்டிகள். சந்திர தசையில் அழுத்தத்தின் அறிகுறிகளைக் காட்டியிருக்கக்கூடிய உடல் உயிர்ச்சக்தி, செவ்வாயின் ஆற்றல் தரும் தாக்கத்தில் மீண்டு வருகிறது. மகத்தின் முன்னோர் போர்வீரப் பரிமாணம் — தன் நிலத்தைக் காத்த வம்சம், போட்டிக்கு எதிராகத் தன் நிலையைக் காத்த குடும்பம் — தன் சமகால வெளிப்பாட்டைக் காண்கிறது.",
        navigate: "செவ்வாய் தசையின் முதன்மைச் சவால், உச்ச அதிகாரத்தின் இந்தக் காலத்தில் உடன்வரும் செருக்கு மற்றும் போர்க்குணத்தை நிர்வகிப்பது. செவ்வாயால் பெருக்கப்படும் மகத்தின் சிம்மத் தீவிரம் இதை தேவையற்ற போர்களின் காலமாக்கலாம் — நடத்த வேண்டாத போர்களை நடத்தும் அரசன் மரபுக்குத் தேவையான கருவூலத்தைக் காலி செய்கிறான். செவ்வாய்–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மிகவும் ஆவேசமான துணைக் காலம்; இந்த சாளரத்தில் குறிப்பிடத்தக்க அபாயங்களை அசாதாரண கவனத்துடன் மதிப்பிட வேண்டும். உடல் கவனம்: இரத்த அழுத்தம், விபத்துத் தடுப்பு, இதயக் கண்காணிப்பு.",
        focus: "செவ்வாய்க்கிழமை செவ்வாய் சன்னதி வழிபாடு, சிவப்பு மலர் அர்ப்பணம், மூலோபாயப் பொறுமையை வேண்டுமென்றே பழகுதல். போர்களைக் கவனமாகத் தேர்ந்தெடுக்கும் வீரன், எல்லாவற்றையும் எதிர்க்கும் வீரனை விட அதிகம் வெல்கிறான்.",
      },
      {
        expect: "நடுவயதிலிருந்து பிற்கால வாழ்வுக்குள் நீளும் ராகு தசை மகத்தின் மிக விரிவான, ஒருவேளை மிக விளைவுமிக்க காலம். ராகு நிலைபெற்ற ஒழுங்கைக் குலைக்கிறது — பாரம்பரியத்திலும் வம்சத்திலும் அடையாளம் வேரூன்றிய மகத்துக்கு அது நிலைகுலைவாக உணரப்படலாம். ஆனால் ராகுவின் விரிவாக்கம் அவசியம்: ஒரு வாழ்நாளில் கட்டிய ராஜ்யம் பரிணமிக்க வேண்டும் அல்லது இறுகிவிடும்; பரிணாமத்தை கட்டாயப்படுத்தும் குலைவை ராகு தருகிறது. சர்வதேச தொடர்புகள், எதிர்பாராத கூட்டணிகள், தொழில்நுட்பத் தகவமைப்பு, அல்லது முற்றிலும் புதிய துறையில் பிற்கால தொழில் திருப்பம் வரலாம். கேது பிறப்பில் கொண்டுவந்த பித்ரு வழி மரபு இப்போது ராகுவின் நிழல் எதிரிடையைச் சந்திக்கிறது — எந்த மரபுகள் முன்னெடுக்கத் தகுதியானவை, எவற்றை விட வேண்டும் என்ற கேள்வி நேரடியாக எதிர்கொள்ளப்படுகிறது.",
        navigate: "ராகுவின் நீண்ட காலம் மகத்தின் பொது வாழ்வின் மிக விளைவுமிக்க அத்தியாயத்தை உள்ளடக்குகிறது. ராகு–கேது புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு முக்கிய கிரகண புள்ளி — முழு வம்ச மரபும் முழு பொது வாழ்வும் ஒரே நேரத்தில் சமநிலையில் வைக்கப்படும் கர்ம மதிப்பீட்டின் முழுச் சுழற்சி. இந்த கட்டத்தின் ஆரோக்கிய கவலைகள் முதன்மையாக இதய-இரத்தக் குழாய், எலும்பியல், வளர்சிதை மாற்றம்; ராகுவின் தீவிரத்துக்கு வேண்டுமென்றே உடல் நிர்வாகம் தேவை.",
        focus: "ராகு சன்னதி வழிபாடு, தேங்காய் அர்ப்பணம், வழக்கமான பித்ரு தர்ப்பணம். விரிவடையும் ராஜ்யம் முன்னோர் அடித்தளம் தொடர்ந்து கௌரவிக்கப்படும்போது மட்டுமே சட்டபூர்வமானது.",
      },
      {
        expect: "பிற்கால வாழ்வில் வரும் குரு தசை மகத்தின் மிக இயல்பாக ஞானமுள்ள, தாராளமான காலம். தேவர்களின் குருவான குரு, அதிகாரத்தை ஒழுக்கத்துடன் சுமந்து முன்னோர்களை அக்கறையுடன் மதித்தவரின் வாழ்வுக்கு விரிந்த ஆசீர்வாதத்தைக் கொண்டுவருகிறார். இந்த நீண்ட தசை அரச தாராளத்தின் தரத்தால் வகைப்படுத்தப்படுகிறது: திரட்டியதைக் கொடுத்தல், வாரிசுகளுக்கு வழிகாட்டுதல், வம்ச ஞானத்தைக் கடத்துதல். பேரக்குழந்தைகள் அசாதாரணமான முன்னோர் கவனத்தைப் பெறுகிறார்கள். ஆன்மீக அல்லது நிறுவனப் பொறுப்புகளில் இருப்பவர்களுக்கு, குரு தசை முழு வாழ்வின் மிக அதிகாரபூர்வமான, அருள் நிறைந்த பணியை உருவாக்குகிறது.",
        navigate: "இந்த கட்டத்தில் உடல் பராமரிப்பு முதன்மையாக எலும்பியல், இரத்த ஓட்டம், வளர்சிதை மாற்றம் சார்ந்தது. குருவின் விரிந்த நம்பிக்கை சில நேரம் உடலை அதன் குறைந்த திறனைத் தாண்டித் தள்ளலாம்; ஆற்றல் இருப்புகளை வேண்டுமென்றும் மென்மையாகவும் நிர்வகிப்பது அவசியம். குரு–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) நோக்கத்தில் கவனமான குறைப்பைக் கோருகிறது.",
        focus: "வியாழக்கிழமை குரு வழிபாடு, குரு பூஜை, மற்றும் வேண்டுமென்றே பரிமாற்றம் — இந்த வாழ்க்கை அதிகாரம், வம்சாவளி, சிம்மாசனத்தின் பொறுப்பு பற்றி கற்றதை.",
      },
      {
        expect: "மிக முதிர்ந்த வயதில் வரும் சனி தசையை மிகச் சிலரே அடைகிறார்கள். முழு வாழ்நாள் அதிகாரத்தையும் முன்னோர் சேவையையும் சுமந்து சிம்மாசனத்தைக் கொண்டு வந்த மக ஆத்மாக்களுக்கு, சனி இறுதி மதிப்பீட்டைக் கொண்டுவருகிறார்: நன்றாக ஆண்ட அரசன் தெளிவாகக் காணப்படுகிறார்; காக்கப்பட்ட மரபு முழுமையடைகிறது. சூரிய அதிகாரத்தின் ராசியான சிம்மத்தில் சனி சிக்கலான உறவில் இருக்கிறார்; ஆனால் உண்மையான அதிகாரம் ஆணையிடாமல் சேவை செய்கிறது என்று நீண்ட அனுபவத்தால் கற்ற மகத்துக்கு, சனியின் பொறுப்புக்கூறல் இறுதியில் நியாயப்படுத்துவதாகவே அமைகிறது.",
        navigate: "முழுமையான உடல் பராமரிப்பும், கொடுப்பதை விட பெறுவதற்கான மனமும் — தன் முழு வாழ்வையும் பிறருக்குக் கொடுத்த சிம்மாசனம் இப்போது பிறர் கொடுக்க அனுமதிக்கிறது. இதுவே பித்ருக்களின் இறுதிப் போதனை: உண்மையாகச் சேவை செய்த அதிகாரம் தன் சுழற்சியை நிறைவு செய்து மூலத்துக்குத் திரும்புகிறது.",
        focus: "சனிக்கிழமை சனி வழிபாடு, ஆஞ்சநேயர் வழிபாடு, எள் அர்ப்பணம், சிம்மாசனம் மதிக்கப்பட்ட ஒருவரின் எளிய கண்ணியம். பித்ருக்கள் தங்கள் பெயரில் வாழப்பட்ட வாழ்க்கையை ஏற்றுக்கொள்கிறார்கள்.",
      },
    ],
    spirituality: [
      { title: "பித்ரு தேவதை வழிபாடு & தர்ப்பணம்", desc: "முன்னோர் தேவதைகள் மகத்தின் ஆளும் சக்திகள். வழக்கமான பித்ரு தர்ப்பணம், கயா யாத்திரை, ராமேஸ்வரம் அர்ப்பணங்கள் — மகம் சுமக்கும் அதிகாரத்தின் மூலத்தை கௌரவிக்கும் மிக முக்கியமான ஆன்மீக நடைமுறைகள்." },
      { title: "சூரிய வழிபாடு & ஆதித்ய ஹ்ருதயம்", desc: "சிம்மத்தின் சூரிய அரசன் சூரிய பக்தியை கோருகிறது. ஞாயிற்றுக்கிழமை சூரிய வழிபாடு, ஆதித்ய ஹ்ருதயம் பாராயணம், சூரிய நமஸ்காரம் மகத்தின் முதன்மையான நடைமுறைகள்." },
      { title: "கேது & விடுதலை சாதனை",            desc: "கேது மகத்தை ஆட்சி செய்கிறது மற்றும் அதன் ஆழமான ஆன்மீக மரபை நிர்வகிக்கிறது. கேது சன்னதி வழிபாடு, அய்யப்பன் பக்தி, முன்னோர் கர்ம தீர்வு வேலை." },
    ],
    guidance: "சிம்மாசனம் உங்களுடையது அல்ல — அதற்கு முன் அமர்ந்தவர்களால் உங்களுக்கு கொடுக்கப்பட்டது, உங்கள் பணி அதை அதற்கு பின் அமர்பவர்களுக்கு கொடுப்பதே. முன்னோர் கிருபையற்ற அதிகாரம் லட்சியம். முன்னோர் கிருபையுடன் கூடிய அதிகாரம் மரபு. எல்லாவற்றிலும் பித்ருக்களை கௌரவியுங்கள், சிம்மாசனம் நீங்கள் அதை பிடித்திருப்பதைப் போல் உங்களை பிடித்திருக்கும்.",
    careerNote: "மகம் எங்கும் அதிகாரம், வம்சாவளி, மரபின் எடை கண்ணியத்துடன் சுமக்கப்பட வேண்டும் என்ற இடத்தில் சிறப்பாக செயல்படுகிறது.",
    modernLead: "மகத்தின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "அரச அதிகாரம், முன்னோர் ஞானம், கம்பீரமான இருப்பு ஆகியவை மகத்தின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function MaghaVisualPage() {
  return <NatchathiramVisualContent data={MAGHA} visual={MAGHA_VISUAL} timings={dasaTimingsFor(MAGHA.number)} />;
}
