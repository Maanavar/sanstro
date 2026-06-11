import type { Metadata } from "next";
import { MAGHA } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

export const metadata: Metadata = {
  title: "Magha Nakshathiram — Visual Profile | Vinaadi",
  description: "Visual profile of Magha Nakshathiram: personality traits, career strengths, dasha timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/magha/visual" },
  openGraph: {
    title: "Magha Nakshathiram — Visual Profile",
    description: "Visual profile of Magha Nakshathiram: personality traits, career strengths, dasha timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/magha/visual",
    type: "article",
  },
};

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
    { symbol: "♥", title: "Astrology & Ancestral Healing",     desc: "Jyotish, pitru karma resolution, family constellation work — Magha's Ketu-Pitru connection gives rare depth to ancestral spiritual work." },
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
      planet: "Ketu", period: "7 yrs", ageRange: "Age 0–7", theme: "Born to the Ancestors",
      detail: {
        expect: "Magha opens life in Ketu dasha — a fitting beginning for the nakshathiram of the ancestral throne. Childhood under Ketu's influence is often marked by an unusual awareness of lineage: the child who is particularly attached to grandparents, who shows an instinctive respect for elders, who seems to carry the family's stories as personal memory. In many Magha families, the birth itself is accompanied by a significant ancestral event — the death or illness of an elder, a family gathering, or a moment that marks the arrival of a new lineage-carrier. The child may be precociously serious, bearing a quality of gravity that sets them apart from their peers.",
        navigate: "Ketu dasha's challenge for young Magha is the weight it carries from birth. The child who takes on ancestral responsibility before they understand it can become prematurely burdened. Parents who notice this pattern should ensure the child also experiences the full lightness of childhood — play, spontaneity, and freedom from inherited expectation. Ketu–Venus antardasha (approximately ages 2–3) brings a welcome interval of warmth and sensory pleasure. Ketu–Mercury (approximately ages 5–6) awakens the first analytical intelligence.",
        focus: "Pitru tharpanam performed by the family during Ketu dasha establishes the most important spiritual foundation for Magha's life. The ancestors who are invoked at this threshold are the presiding powers of the entire journey. Navagraha worship and Ketu shrine offerings provide additional grounding.",
      },
    },
    {
      planet: "Venus", period: "20 yrs", ageRange: "Age 7–27", theme: "The Young Regent",
      detail: {
        expect: "Venus dasha from 7 to 27 is Magha's formation — twenty years of education, creative development, and the first flowering of the personal authority that is the nakshathiram's birthright. School years produce a student who naturally takes leadership roles: the class representative, the sports captain, the one whose opinion carries weight. The instinct to stand at the front is not arrogance but constitutional — Magha simply orients toward the head of any gathering. Higher education or professional training follows, typically in a field that carries some form of authority or public service. Love relationships begin in Venus–Mars antardasha (approximately ages 15–17) and deepen; marriage may arrive toward the end of Venus dasha, in Venus–Saturn (approximately ages 25–27) or Venus–Mercury (approximately ages 21–23).",
        navigate: "Venus dasha's challenge for Magha is managing the gap between the authority they feel entitled to and the experience they have actually accumulated. The young regent who acts as king before coronation invites resistance that patient development would avoid. Venus–Rahu antardasha (~yr 8, ~ages 15–16) is the most volatile sub-period; the temptation toward shortcuts, sudden reversals, or reckless expressions of independence must be consciously managed. Physical concerns: skin, kidneys, sweet consumption and metabolic health.",
        focus: "Friday Lakshmi worship and the deliberate cultivation of Venus's social intelligence alongside Leo's natural authority. Also watch Venus–Moon antardasha within this dasha (arriving approximately in the 14th year of Venus dasha, around age 21). Moon governs the 12th house from Magha's natal Leo placement, making this 10-month window one of inward reflection and spiritual grounding that paradoxically strengthens the outward authority being built.",
      },
    },
    {
      planet: "Sun", period: "6 yrs", ageRange: "Age 27–33", theme: "The Coronation",
      detail: {
        expect: "Sun dasha from 27 to 33 is Magha's coronation — the most naturally aligned dasha for this Leo nakshathiram. Sun is the ruler of Leo and the natural king of the planetary cabinet; in Sun dasha, Magha's authority, presence, and institutional standing reach their first peak. Career establishes its trajectory; leadership positions arrive or are consolidated; the name that will define the professional identity for the next thirty years is being written. Government connections, official recognition, and institutional trust all increase. Relationships that were established in Venus dasha clarify: serious commitments deepen, unsuitable ones resolve. Children may arrive, beginning the lineage that Magha will guard with ancestral gravity.",
        navigate: "Sun dasha's primary challenge for Magha is the temptation toward pride. The Leo king, newly crowned, can mistake the authority that was given (by lineage, by Ketu's karma, by Venus's development) for authority that was self-created. Genuine leadership is always in service of something beyond the self; Sun dasha tests whether Magha has learned this. Sun–Saturn antardasha (~yr 4 of Sun, ~ages 30–31) is the most demanding sub-period: the planet of authority encounters the planet of accountability, and the result is either a disciplined deepening or a painful correction. Physical care: heart, eyes, circulatory health.",
        focus: "Sunday Surya worship, Aditya Hridayam recitation, and regular pitru tharpanam — honouring the source of the authority that Sun dasha makes visible. The coronation is meaningful only because the ancestors who sat on this throne before are being honoured.",
      },
    },
    {
      planet: "Moon", period: "10 yrs", ageRange: "Age 33–43", theme: "The King's Heart",
      detail: {
        expect: "Moon dasha from 33 to 43 introduces the emotional dimension of authority that Sun dasha's solar clarity can overshadow. The ruler who has been defined by command and presence now discovers that the most effective leadership is rooted in genuine care for those being led. Family life deepens: the children born in Sun dasha grow; the domestic sphere, which Magha has sometimes treated as secondary to the public role, demands and rewards genuine emotional presence. For many Magha natives, Moon dasha brings the recognition that the lineage they are building requires not only achievement but warmth — a legacy that others will want to carry forward.",
        navigate: "Moon dasha's health concerns in this age band are digestive, emotional, and related to fluid balance. The Ketu influence that opened life now re-emerges in Moon dasha through Ketu's opposite relationship with Moon — emotional restlessness, difficulty settling, or a recurring sense of existential incompleteness may surface and must be addressed through practice rather than suppressed. Moon–Ketu antardasha (~yr 8 of Moon, ~ages 40–41) is the most internally turbulent sub-period; ancestral karma and pitru issues may resurface for resolution.",
        focus: "Monday Moon worship, water offerings, and the pitru tharpanam that is most natural to Magha's practice. Also watch Moon–Sun antardasha within this dasha (arriving approximately in the 2nd year of Moon dasha, around age 35). This 6-month interval brings the solar confidence of Sun dasha's coronation into a softer and more relationally attuned expression — the perfect sub-period for the king to walk among the people.",
      },
    },
    {
      planet: "Mars", period: "7 yrs", ageRange: "Age 43–50", theme: "The Warrior Phase",
      detail: {
        expect: "Mars dasha from 43 to 50 brings Magha's midlife authority into its most direct and decisive expression. The administrator becomes the commander; the corporate leader makes the defining strategic moves; the public official acts with the boldness that their position now warrants. Career reaches a peak of decisive action: major deals, significant hires or restructurings, institutional contests that will define the legacy. Physical vitality, which may have shown signs of stress in Moon dasha, is restored under Mars's energising influence. The ancestral warrior dimension of Magha — the lineage that defended its territory, the family that held its position against competition — finds its contemporary expression.",
        navigate: "Mars dasha's primary challenge is the management of pride and combativeness that can accompany this period of peak authority. Magha's Leo intensity, amplified by Mars, can make this a period of unnecessary battles — the king who fights wars that need not be fought depletes the treasury needed for the legacy. Mars–Rahu antardasha (~yr 2 of Mars, ~ages 45–46) is the most volatile sub-period; significant risks should be evaluated with unusual care in this window. Physical care: blood pressure, accident prevention, cardiac monitoring.",
        focus: "Tuesday Mars shrine worship, red flower offerings, and the deliberate practice of strategic patience. The warrior who chooses battles carefully wins more than the warrior who contests everything.",
      },
    },
    {
      planet: "Rahu", period: "18 yrs", ageRange: "Age 50–68", theme: "The Expanding Kingdom",
      detail: {
        expect: "Rahu dasha from 50 to 68 is Magha's most expansive and potentially most consequential period. Rahu disrupts the established order — which for Magha, whose identity is rooted in tradition and lineage, can feel destabilising. But Rahu's expansion is necessary: the kingdom that has been built over five decades must evolve or calcify, and Rahu provides the disruption that forces evolution. International connections, unexpected alliances, technological adaptation, or a late-career pivot into an entirely new domain may arrive. The Pitru inheritance that Ketu brought at birth now encounters Rahu's shadowy opposite — the question of which traditions deserve to be carried forward and which must be released is faced directly.",
        navigate: "Rahu's 18-year span spans the most consequential chapter of Magha's public life. Rahu–Ketu antardasha (~yr 9 of Rahu, ~age 59) is a significant eclipse point — a full cycle of karmic reckoning in which the entire lineage inheritance and the entire public life are held in balance simultaneously. Health concerns in this age band are primarily cardiovascular, orthopedic, and metabolic; Rahu's intensity requires deliberate physical management.",
        focus: "Rahu shrine prayers, coconut offerings, and regular pitru tharpanam to maintain the ancestral grounding that Rahu's expansion can otherwise loosen. The expanding kingdom remains legitimate only when the throne's ancestral foundation is continuously honoured.",
      },
    },
    {
      planet: "Jupiter", period: "16 yrs", ageRange: "Age 68–84", theme: "The Elder King",
      detail: {
        expect: "Jupiter dasha from 68 to 84 is Magha's most naturally wise and generous period. Jupiter, the guru of the gods, brings an expansive benediction to the life of one who has carried authority with discipline and honoured the ancestors with care. These sixteen years are characterised by a quality of regal generosity: the giving away of what has been accumulated, the mentoring of successors, the transmission of lineage wisdom. Grandchildren receive an extraordinary quality of ancestral attention. For those in spiritual or institutional roles, Jupiter dasha produces the most authoritative and grace-filled work of the entire life.",
        navigate: "Physical care in this age band is primarily orthopedic, circulatory, and metabolic. Jupiter's expansive optimism can occasionally push the body beyond its reduced capacity; deliberate and gentle management of energy reserves is essential. Jupiter–Saturn antardasha (~yr 9 of Jupiter, ~ages 77–79) demands a careful reduction in scope.",
        focus: "Thursday Jupiter worship, Guru Puja, and the deliberate transmission — through writing, speech, or action — of what this life has learned about authority, lineage, and the responsibility of the throne.",
      },
    },
    {
      planet: "Saturn", period: "19 yrs", ageRange: "Age 84–103", theme: "The Final Accountability",
      detail: {
        expect: "Saturn dasha from 84 to 103 is reached by very few. For those Magha souls who arrive here — having carried the throne through a full lifetime of authority and ancestral service — Saturn brings the final reckoning: the king who governed well is seen clearly; the inheritance that was protected is complete. Saturn in Leo, the sign of solar authority, is in a complex relationship; but for Magha, who has learned through long experience that genuine authority serves rather than commands, Saturn's accountability is ultimately vindicating.",
        navigate: "Complete physical care and a willingness to receive rather than give — the throne that has given its entire life to others now allows others to give. This is the final teaching of the Pitrus: authority that has truly served completes its cycle and returns to the source.",
        focus: "Saturday Saturn worship, sesame offerings, and the simple dignity of one whose throne was honoured. The Pitrus receive the life that was lived in their name.",
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

  compatibleEn: ["Ashwini", "Mula", "Purva Phalguni", "Uttara Phalguni", "Anuradha"],
  compatibleNote: "These nakshatras complement Magha's regal authority and ancestral depth with vitality, rootedness, creativity, and heartfelt devotion.",

  ta: {
    atAGlanceLabels: ["அரச அதிகாரம்", "முன்னோர் ஞானம்", "கம்பீரமான இருப்பு", "கர்ம ஆழம்", "மரபு கட்டுதல்"],
    radarLabels: ["அதிகாரம்", "முன்னோர்", "தலைமை", "கர்மம்", "மரபு", "கண்ணியம்"],
    coreStrengths: [
      { label: "அரச அதிகாரம்",     desc: "சிம்மாசனம் மகத்தின் சின்னமும் இயல்பும் — இந்த நட்சத்திரம் கோரிக்கை இல்லாமல் மரியாதையை கட்டளையிடும் இயல்பான அதிகாரத்தை கொண்டுள்ளது." },
      { label: "மரபு கட்டுதல்",     desc: "பித்ரு தேவதைகள் ஆட்சி செய்கிறார்கள் — மகம் தற்போதைக்கு மட்டும் வாழவில்லை, வம்சாவளிக்காக வாழ்கிறது." },
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
        expect: "மகம் கேது தசையில் வாழ்க்கையை திறக்கிறது — முன்னோர் சிம்மாசனத்திற்கான பொருத்தமான ஆரம்பம். குழந்தை பருவம் வம்சாவளி பற்றிய அசாதாரண விழிப்புணர்வால் குறிக்கப்படுகிறது: தாத்தா-பாட்டியிடம் குறிப்பாக இணைந்திருக்கும் குழந்தை, முதியோர்களை மரியாதையுடன் காட்டும் குழந்தை.",
        navigate: "இளம் மகத்திற்கு கேது தசையின் சவால் பிறப்பிலிருந்து சுமக்கும் எடை. கேது–சுக்கிர அந்தர்தசை (~2–3 வயது) வரவேற்கத்தக்க வெப்பமும் உணர்வு இன்பமும் கொண்டு வருகிறது.",
        focus: "கேது தசையில் குடும்பத்தால் செய்யப்படும் பித்ரு தர்ப்பணம் மகத்தின் வாழ்க்கையின் மிக முக்கியமான ஆன்மீக அடித்தளத்தை நிறுவுகிறது.",
      },
      {
        expect: "சுக்கிர தசை 7 முதல் 27 வயது வரை மகத்தின் உருவாக்கம் — கல்வி, படைப்பு வளர்ச்சி, தலைமைத்துவ திறனின் முதல் மலர்ச்சி. பள்ளி ஆண்டுகள் இயல்பாகவே தலைமை பங்கில் நிற்கும் மாணவரை உருவாக்குகின்றன. திருமணம் சுக்கிர–சனி (~25–27 வயது) அல்லது சுக்கிர–புதன் (~21–23 வயது) அந்தர்தசையில் வரலாம்.",
        navigate: "சுக்கிர தசையின் சவால் உணர்வு செய்யும் உரிமைக்கும் உண்மையில் திரட்டப்பட்ட அனுபவத்திற்கும் இடையே உள்ள இடைவெளியை நிர்வகிப்பது. சுக்கிர–ராகு அந்தர்தசை (~yr 8, ~15–16 வயது) மிகவும் ஆவேசமான துணைக் காலம்.",
        focus: "வெள்ளிக்கிழமை லட்சுமி வழிபாடு மற்றும் சூரியனின் இயல்பான அதிகாரத்துடன் சுக்கிரனின் சமூக நுண்ணறிவின் வேண்டுமென்றே வளர்ச்சி.",
      },
      {
        expect: "சூரியன் தசை 27 முதல் 33 வயது வரை மகத்தின் முடிசூட்டு — இந்த சிம்ம நட்சத்திரத்திற்கு மிகவும் இயல்பாக சீரமைந்த தசை. சூரியன் சிம்மத்தின் அதிபதி. சூரியன் தசையில் மகத்தின் அதிகாரம், இருப்பு, நிறுவன நிலை முதல் உச்சத்தை அடைகின்றன.",
        navigate: "சூரியன் தசையின் முதன்மையான சவால் அகங்காரத்தை நோக்கிய சோதனை. சூரியன்–சனி அந்தர்தசை (~30–31 வயது) மிகவும் கோரும் துணைக் காலம். உடல் கவனம்: இதயம், கண்கள்.",
        focus: "ஞாயிற்றுக்கிழமை சூரிய வழிபாடு, ஆதித்ய ஹ்ருதயம் பாராயணம், வழக்கமான பித்ரு தர்ப்பணம். முடிசூட்டு பொருளுள்ளது, ஏனென்றால் முன்னே அமர்ந்தவர்கள் கௌரவிக்கப்படுகிறார்கள்.",
      },
      {
        expect: "சந்திர தசை 33 முதல் 43 வயது வரை சூரியன் தசையின் சூரிய தெளிவால் நிழலில் போகக்கூடும் அதிகாரத்தின் உணர்வு பரிமாணத்தை அறிமுகப்படுத்துகிறது. குடும்ப வாழ்க்கை ஆழமடைகிறது.",
        navigate: "ஆரோக்ய கவலைகள்: செரிமானம், உணர்வு, திரவ சமநிலை. சந்திர–கேது அந்தர்தசை (~40–41 வயது) உள்ளுக்குள் மிகவும் கலக்கமான துணைக் காலம்.",
        focus: "திங்கட்கிழமை சந்திர வழிபாடு மற்றும் வழக்கமான பித்ரு தர்ப்பணம். சந்திர–சூரியன் அந்தர்தசை (~35 வயது) சூரியன் தசையின் முடிசூட்டு நம்பிக்கையை மென்மையான வெளிப்பாட்டில் கொண்டு வருகிறது.",
      },
      {
        expect: "செவ்வாய் தசை 43 முதல் 50 வயது வரை மகத்தின் நடு வாழ்க்கை அதிகாரத்தை அதன் மிகவும் நேரடியான மற்றும் தீர்க்கமான வெளிப்பாட்டில் கொண்டு வருகிறது. வாழ்க்கையின் தீர்க்கமான நகர்வுகள் செய்யப்படுகின்றன.",
        navigate: "செவ்வாய்–ராகு அந்தர்தசை (~45–46 வயது) மிகவும் ஆவேசமான துணைக் காலம். உடல் கவனம்: இரத்த அழுத்தம், இதய கண்காணிப்பு.",
        focus: "செவ்வாய்க்கிழமை செவ்வாய் சன்னதி வழிபாடு மற்றும் மூலோபாய பொறுமையின் வேண்டுமென்றே நடைமுறை.",
      },
      {
        expect: "ராகு தசை 50 முதல் 68 வயது வரை மகத்தின் மிகவும் விரிவடையும் மற்றும் விளைவுகரமான காலம். ராகு நிலைபெற்ற ஒழுங்கை சீர்குலைக்கிறது — மகத்திற்கு, வம்சாவளி மற்றும் மரபில் வேரூன்றிய, இது உறுதிப்படுத்தலை அசைக்கக்கூடும். ஆனால் விரிவாக்கம் தேவையானது.",
        navigate: "ராகு–கேது அந்தர்தசை (~yr 9, ~59 வயது) ஒரு குறிப்பிடத்தக்க கர்ம மதிப்பீட்டு புள்ளி. ஆரோக்ய கவலைகள்: இதய-வாஸ்குலர், எலும்பியல்.",
        focus: "ராகு சன்னதி வழிபாடு, தேங்காய் அர்ப்பணம், வழக்கமான பித்ரு தர்ப்பணம். விரிவடையும் ராஜ்யம் முன்னோர் அடித்தளம் தொடர்ந்து கௌரவிக்கப்படும்போது மட்டுமே சட்டபூர்வமானது.",
      },
      {
        expect: "குரு தசை 68 முதல் 84 வயது வரை மகத்தின் மிகவும் இயல்பாக ஞானமுள்ள மற்றும் தாராளமான காலம். இந்த பதினாறு ஆண்டுகள் அரச தாராளத்தின் தரத்தால் வகைப்படுத்தப்படுகின்றன: திரட்டப்பட்டவற்றை கொடுத்தல், வாரிசுகளை வழிகாட்டுதல், வம்சாவளி ஞானத்தை பரிமாறுதல்.",
        navigate: "உடல் கவனம் முக்கியமாக எலும்பியல், சுழற்சி. குரு–சனி அந்தர்தசை (~77–79 வயது) நோக்கத்தில் கவனமான குறைப்பை கோருகிறது.",
        focus: "வியாழக்கிழமை குரு வழிபாடு, குரு பூஜை, மற்றும் வேண்டுமென்றே பரிமாற்றம் — இந்த வாழ்க்கை அதிகாரம், வம்சாவளி, சிம்மாசனத்தின் பொறுப்பு பற்றி கற்றதை.",
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
  return <NatchathiramVisualContent data={MAGHA} visual={MAGHA_VISUAL} />;
}
