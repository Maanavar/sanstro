import type { Metadata } from "next";
import { withTamilTwin } from "@/lib/localized-metadata";
import { withDasaTimingHold } from "@/lib/natchathiram-dasa-hold";
import { dasaTimingsFor } from "@/lib/natchathiram-dasa-timings";
import { nakshatraDisplayName } from "@/lib/nakshatra-display-name";
import { natchathiramVisualTa } from "@/lib/marketing-seo-ta";
import { SATHAYAM } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

const EN_METADATA: Metadata = {
  title: `${nakshatraDisplayName(SATHAYAM.number, "en")} — Visual Profile`,
  description: "Visual profile of Sadayam Nakshathiram: personality traits, career strengths, dasa timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/shatabhisha/visual" },
  openGraph: {
    title: `${nakshatraDisplayName(SATHAYAM.number, "en")} — Visual Profile`,
    description: "Visual profile of Sadayam Nakshathiram: personality traits, career strengths, dasa timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/shatabhisha/visual",
    type: "article",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withDasaTimingHold(await withTamilTwin(EN_METADATA, "/natchathiram/shatabhisha/visual", natchathiramVisualTa("shatabhisha")!), "shatabhisha");
}

const SHATABHISHA_VISUAL: NatchathiramVisualData = {
  atAGlance: [
    { label: "Healing Intelligence",     score: 98 },
    { label: "Mystical Depth",           score: 97 },
    { label: "Independent Vision",       score: 96 },
    { label: "Varuna's Cosmic Law",      score: 95 },
    { label: "Saturn-Kumbha Discipline", score: 94 },
  ],

  radar: {
    labels: ["Healing", "Mysticism", "Independence", "Ethics", "Research", "Innovation"],
    values: [98, 97, 96, 95, 95, 94],
  },

  coreStrengths: [
    { symbol: "◎", label: "Healing Intelligence",     score: 98, desc: "Shatabhisha means 'a hundred healers' or 'hundred medicines' — and this healer is not the conventional practitioner but the one who goes to the invisible root of illness, the energetic and karmic substrate of physical disease." },
    { symbol: "◈", label: "Mystical Depth",           score: 97, desc: "Ruled by Rahu and presided over by Varuna — the god of cosmic law, the depths of the ocean, and the hidden order — Shatabhisha sees what others cannot see, knows what others cannot know, and operates in the domain where the visible and invisible intersect." },
    { symbol: "⚡", label: "Independent Vision",       score: 96, desc: "The nakshathiram of the solitary healer and the independent mystic. Shatabhisha does not require the approval of existing frameworks — the cosmic law that Varuna guards is older and truer than any human institution." },
    { symbol: "♥", label: "Varuna's Cosmic Law",      score: 95, desc: "Varuna — the god who sees all, who governs the hidden order behind appearances, who holds the karmic thread — gives Shatabhisha the capacity to perceive the underlying law that organises visible events." },
    { symbol: "△", label: "Saturn-Kumbha Discipline", score: 94, desc: "Kumbha is Saturn's own rasi, and Saturn as rasi lord gives Shatabhisha the structural patience and long-game discipline that the healer's work requires. The mystical vision without the discipline becomes untethered; Saturn provides the tether." },
    { symbol: "☽", label: "Innovative Research",      score: 94, desc: "Shatabhisha's combination of mystical depth, independent vision, and Saturn's structural discipline produces the innovative researcher — the one who looks where others have not looked and finds what others have not found." },
  ],

  careerAbilities: [
    { label: "Medicine & Alternative Healing",  score: 98 },
    { label: "Astrology & Occult Sciences",     score: 97 },
    { label: "Scientific Research & Innovation", score: 95 },
    { label: "Psychology & Depth Therapy",      score: 96 },
    { label: "Technology & Systems Innovation", score: 94 },
  ],
  careerNote: "Shatabhisha excels wherever the invisible dimension of reality — whether in the domain of health, consciousness, cosmic law, or scientific structure — must be engaged directly, honestly, and with the willingness to stand alone in the understanding that has been reached.",

  careerClusters: [
    { symbol: "◎", title: "Medicine, Healing & Alternative Therapies", desc: "Conventional medicine, Ayurveda, energy healing, herbalism — the 'hundred healers' star applied to the professional domain of health and recovery." },
    { symbol: "◈", title: "Astrology & Occult Sciences",              desc: "Jothidam, Tantra, esoteric traditions — Varuna's domain of hidden order and cosmic law engaged as professional wisdom." },
    { symbol: "⚡", title: "Scientific Research & Innovation",         desc: "Independent scientific research, paradigm-breaking investigation, the pursuit of what existing frameworks have missed — Shatabhisha's independent vision in the domain of knowledge." },
    { symbol: "♥", title: "Psychology & Depth Therapy",               desc: "Depth psychology, energy psychology, the therapies that address the invisible roots of visible symptoms — the hundred healers' capacity applied to the psyche." },
    { symbol: "△", title: "Technology & Systems Innovation",          desc: "Technology research, systems innovation, the design of structures that reflect the hidden order of things — Saturn's discipline and Rahu's innovative energy in the domain of technology." },
    { symbol: "☽", title: "Environmental & Oceanic Sciences",         desc: "Oceanography, environmental research, the study of Varuna's physical domain — the god of cosmic waters expressing through professional science." },
  ],

  modernApps: [
    { symbol: "◎", title: "Health Technology & Healing Platforms",  desc: "Integrative medicine platforms, alternative healing technology, holistic health applications — the hundred healers at digital scale." },
    { symbol: "◈", title: "Astrology & Esoteric Technology",         desc: "Jothidam platforms, esoteric wisdom technology, cosmic law intelligence applications." },
    { symbol: "⚡", title: "Scientific Research Technology",         desc: "Independent research platforms, paradigm-innovation tools, open-science investigation technology." },
    { symbol: "♥", title: "Psychology & Depth Therapy Technology",   desc: "Energy psychology platforms, depth therapy applications, invisible-root health technology." },
    { symbol: "△", title: "Systems Innovation & Technology Research", desc: "Systems innovation platforms, hidden order research technology, structural intelligence applications." },
    { symbol: "☽", title: "Environmental & Ocean Technology",        desc: "Oceanographic research platforms, environmental intelligence technology, Varuna's domain in digital science." },
  ],

  dashaTimeline: [
    {
      planet: "Rahu", theme: "Born into the Invisible",
      detail: {
        expect: "Shatabhisha opens in Rahu dasa — a beginning of unusual perceptual range, unconventional intelligence, and the sense that the invisible dimension of experience is as real, or more real, than the visible. Rahu's is a long opening dasa, and the balance left at birth runs from long for births in the first pada to short for the fourth; the range shown for this dasa gives it. The Shatabhisha child born into Rahu's domain has an uncanny quality from the earliest years: the awareness of what is not said, what is not shown, what operates beneath the surface of family and social life. Early encounters with the mystical, the medical, or the scientifically unconventional are common in Rahu's opening. Where the balance runs through the school years, the child engages the educational system with a mixture of genuine intellectual brilliance and difficulty with conventional frameworks — the Shatabhisha mind is too wide and too deep for most curricula. The Rahu–Saturn bhukti (the table below gives when it begins and how long it lasts; for the shorter balances it falls before birth) is a critical rasi lord sub-period flag: the structural discipline and long-game patience that Saturn will govern in its own dasa arrives as an early formative encounter.",
        navigate: "Rahu's primary challenge for the young Shatabhisha is the intensity of the perceptual range — the child who sees the invisible is also exposed to it without the maturity to integrate what is perceived. The unconventional intelligence needs unconventional educational support; forcing the Shatabhisha child into purely conventional frameworks produces frustration and often apparent underperformance in a highly capable person. The Rahu–Saturn bhukti is a rasi lord flag: a pivotal early encounter with the discipline and structure that will be the framework for the mature Shatabhisha life.",
        focus: "Saturday Rahu shrine prayers and the provision of educational environments that honour and challenge the unconventional intelligence. The Rahu–Saturn bhukti (the bhukti table below gives when it begins and how long it lasts) is a major rasi lord flag: Saturn arrives in Rahu's opening field as the first serious encounter with the structural discipline that the mature healer or mystic must inhabit — where it falls after birth, this sub-period is often the moment of the decisive early commitment to a discipline.",
      },
    },
    {
      planet: "Jupiter", theme: "The Philosophical Opening",
      detail: {
        expect: "Jupiter dasa brings the philosophical breadth and wisdom that contextualises Shatabhisha's mystical and healing intelligence within a larger tradition of understanding. For the later padas it begins in childhood and carries through schooling and higher education; for the first pada it begins as school closes and runs on through the first working years. Higher education, the first serious encounter with the healing or occult tradition that becomes the life's work, and the philosophical framework within which the unconventional intelligence operates are all established in Jupiter's long span. The teacher who becomes the defining guide of the Shatabhisha professional life typically enters in the Jupiter–Venus or Jupiter–Saturn bhukti. The first serious healing or research practice is established.",
        navigate: "Jupiter's primary challenge for Shatabhisha is the temptation to systematise the mystical — to turn the living, fluid intelligence of Varuna's domain into a fixed philosophical system that loses the living quality. The 'hundred healers' does not work from a single system but from the capacity to find the appropriate medicine for the specific situation. The Jupiter–Saturn bhukti (the table below gives when it begins and how long it lasts) is a major rasi lord sub-period flag — the most significant encounter with the Saturn structural discipline in Jupiter's expansive field.",
        focus: "Thursday Brihaspati worship and the deliberate cultivation of philosophical breadth alongside the mystical depth. The Jupiter–Saturn bhukti (the bhukti table below gives when it begins and how long it lasts) is a rasi lord flag: Saturn arrives in Jupiter's wise field as a powerful structuring encounter that establishes the discipline framework for the mature Shatabhisha practice.",
      },
    },
    {
      planet: "Saturn", theme: "Rasi Lord — The Healer's Mastery",
      detail: {
        expect: "Saturn dasa is the rasi lord's arrival for Shatabhisha. Saturn is the lord of your rasi, Kumbha — and his long dasa, arriving anywhere from late adolescence to the settled working years by pada, is the most structurally complete, disciplined, and professionally authoritative period of the Shatabhisha life. The healing, research, or mystical practice that has been developing since Rahu's opening and deepened through Jupiter's philosophical breadth now receives the full structural governance of Saturn's long-game patience. Independent practice is established; the reputation of the 'hundred healers' begins to be known in the wider world; the research or healing work reaches a quality of structural mastery that earlier periods, however inspired, could not achieve. This is the dasa of the established healer, the authoritative researcher, the master of the hidden order.",
        navigate: "Saturn's primary challenge in the rasi lord dasa is the institutionalisation of the independent vision — the healer who has always operated from the invisible root of illness discovering the temptation to create a fixed system and defend it as the only correct approach. Varuna's domain has a hundred medicines because illness is various and the healing intelligence must remain flexible. Physical care is important across this long dasa.",
        focus: "Saturday Saturn worship, Shani puja, Hanuman worship, and the deliberate maintenance of the independence of vision within the discipline of practice. The Saturn rasi lord's long dasa is best expressed as the humble master who knows that the hundred medicines is not a finite list — it grows with each new encounter between the healer's intelligence and the specific situation that presents itself.",
      },
    },
    {
      planet: "Mercury", theme: "The Articulate Mystery",
      detail: {
        expect: "Mercury dasa, in the later working years, brings the mind's precision and articulative capacity to Shatabhisha's mystical and healing mastery. The hidden knowledge that has been operating as practice and presence since Rahu's opening now finds in Mercury the capacity for clear, precise articulation — the healer who can explain what they do, the mystic who can write what they know, the researcher who can publish what they have found. Teaching, writing, and the transmission of the Shatabhisha understanding are the primary professional expressions of Mercury dasa.",
        navigate: "Mercury's primary challenge for Shatabhisha is the articulation of what is genuinely ineffable — the domain of Varuna's hidden order does not always translate cleanly into Mercury's precise language. The risk is either the over-simplification that loses the depth or the deliberate obscurity that protects the depth but fails to transmit it. Physical care and energy management are important.",
        focus: "Wednesday Mercury worship and the deliberate practice of writing and articulating the accumulated mystical and healing understanding at the level of depth that the material requires — neither over-simplified nor unnecessarily obscure.",
      },
    },
    {
      planet: "Ketu", theme: "The Mystery Returns",
      detail: {
        expect: "Ketu dasa, in later life, brings the great simplification of the knowledge domain. After Mercury's articulative fullness, Ketu returns Shatabhisha to the source — the invisible dimension from which the healing and mystical intelligence has always drawn its authority. The 'hundred healers' discovers, in Ketu's simplification, that the final medicine is not a specific herb or a specific practice but the presence itself — the quality of attentiveness that Varuna's awareness grants.",
        navigate: "Complete and gentle physical care. Ketu at this age is the invitation to be present to what is, without the healer's need to fix it — the deepest expression of the 'hundred healers' intelligence in its most distilled form.",
        focus: "Ganapati worship, pitru tharpanam and ancestral rites. Varuna's servant has healed many; now the healer rests in the healing that needs no particular instrument.",
      },
    },
    {
      planet: "Venus", theme: "The Beautiful Healing",
      detail: {
        expect: "Venus dasa, in advanced age, brings the aesthetic grace and abundant warmth of Venus to the late life of the Shatabhisha elder. The mystical depth and healing mastery of the previous dasas are now accompanied by Venus's gift of beauty — the quality that makes the elder's presence itself a form of nourishment.",
        navigate: "Complete and devoted physical care across Venus's long dasa at this age. The body requires consistent, gentle attention.",
        focus: "Friday Venus worship and the deliberate enjoyment of beauty — music, nature, relationships, the aesthetic pleasures of a long life well lived. Venus as the closing dasa of this sequence is the gift of grace: the hundred healers receives, in very old age, the beauty that healing has always been serving.",
      },
    },
    {
      planet: "Sun", theme: "Final Solar Clarity",
      detail: {
        expect: "Sun dasa, in very advanced age, is reached by very few Shatabhisha souls. For those who arrive, Sun brings the final solar clarity — the distilled authority of the hundred healers in its most luminous form.",
        navigate: "Complete and devoted physical care.",
        focus: "The solar authority of the healer elder — the light that has seen through the invisible to the real, and now simply illuminates without the need for instruments or systems.",
      },
    },
    {
      planet: "Moon", theme: "Final Emotional Ocean",
      detail: {
        expect: "Moon dasa, the last in this sequence, is reached by extraordinarily few Shatabhisha souls. For those who arrive, Moon brings the final return to the emotional ocean — the feeling dimension of Varuna's cosmic waters in their most direct and unmediated form.",
        navigate: "Complete and devoted physical care at this extreme age.",
        focus: "The healer who has spent a lifetime attending to others now receives the full depth of care from those who love them. The invisible becomes visible; the cosmic waters are also the waters of emotion, of relationship, of love.",
      },
    },
  ],

  spirituality: [
    {
      title: "Varuna Worship & Cosmic Law",
      desc: "Varuna — the god of cosmic waters, hidden order, and the karmic law that governs invisible reality — is Shatabhisha's presiding deity. Varuna Sukta recitation (from the Rigveda), water rituals honouring the cosmic ocean, and the practice of impeccable ethical alignment (living within Varuna's cosmic law) are Shatabhisha's deepest spiritual expressions.",
    },
    {
      title: "Saturn & Kumbha Devotion",
      desc: "Saturn — the rasi lord of Kumbha — is Shatabhisha's governing planet. Saturday Shani puja, the practice of patient, long-game devotion, and the deliberate cultivation of structural simplicity are the primary spiritual disciplines of the Shatabhisha life.",
    },
    {
      title: "Healing as Sacred Service",
      desc: "For Shatabhisha, the act of healing — of bringing the hidden order of Varuna's cosmic law into contact with the visible disorder of illness or suffering — is itself the highest spiritual practice. The hundred healers is not a professional but a sacred function; the healing work and the devotional life are the same life.",
    },
  ],

  guidance: "The hundred healers know that no single medicine is always right and no single system is always complete — because the disease is various and the hidden order behind it is deeper than any one formulation. The independence of vision that Varuna gave you is not arrogance but fidelity: the willingness to see what is actually there, rather than what the existing framework says should be there. Trust the invisible root; be disciplined in the practice; and let the hundred medicines emerge from the genuine encounter between your attentiveness and the specific situation that seeks your help.",

  compatibleEn: ["Thiruvathirai", "Swathi", "Poorattathi", "Avittam", "Ayilyam"],
  compatibleNote: "These nakshatras complement Shatabhisha's healing intelligence, mystical depth, and independent vision with transformative power, social grace, and deep wisdom.",

  ta: {
    atAGlanceLabels: ["குணப்படுத்தும் நுண்ணறிவு", "மறைஞான ஆழம்", "சுதந்திரமான பார்வை", "வருணனின் பிரபஞ்ச சட்டம்", "சனி-கும்ப ஒழுக்கம்"],
    radarLabels: ["குணப்படுத்துதல்", "மறைஞானம்", "சுதந்திரம்", "நெறிமுறைகள்", "ஆராய்ச்சி", "கண்டுபிடிப்பு"],
    coreStrengths: [
      { label: "குணப்படுத்தும் நுண்ணறிவு",  desc: "சதயம் என்றால் 'நூறு குணப்படுத்துபவர்கள்' அல்லது 'நூறு மருந்துகள்' — இந்த குணப்படுத்துபவர் வழக்கமான நிபுணர் அல்ல ஆனால் நோயின் கண்ணுக்கு தெரியாத வேருக்கு செல்பவர்." },
      { label: "மறைஞான ஆழம்",              desc: "ராகு மற்றும் வருணனால் தலைமை தாங்கப்படுகிறது — பிரபஞ்ச சட்டம், கடலின் ஆழங்கள், மறைந்திருக்கும் வரிசை ஆகியவற்றின் கடவுள் — சதயம் மற்றவர்களால் காண முடியாததை பார்க்கிறது." },
      { label: "சுதந்திரமான பார்வை",        desc: "தனிமையான குணப்படுத்துபவர் மற்றும் சுதந்திர மறைஞானி நட்சத்திரம். சதயம் ஏற்கனவே உள்ள கட்டமைப்புகளின் ஒப்புதலை கோரவில்லை — வருணன் காக்கும் பிரபஞ்ச சட்டம் எந்த மனித நிறுவனத்தையும் விட பழமையானது மற்றும் உண்மையானது." },
      { label: "வருணனின் பிரபஞ்ச சட்டம்",  desc: "வருணன் — எல்லாவற்றையும் பார்க்கும் கடவுள், தோற்றங்களுக்கு பின்னால் உள்ள மறைந்திருக்கும் வரிசையை நிர்வகிக்கும், கர்ம நூலை வைத்திருக்கும் — சதயம்க்கு காணக்கூடிய நிகழ்வுகளை ஒழுங்கமைக்கும் அடிப்படை சட்டத்தை கண்காணிக்கும் திறன் கொடுக்கிறது." },
      { label: "சனி-கும்ப ஒழுக்கம்",        desc: "கும்பம் சனியின் சொந்த ராசி, மற்றும் சனி ராசி அதிபதியாக சதயம்க்கு கட்டமைப்பு பொறுமை மற்றும் நீண்ட-விளையாட்டு ஒழுக்கம் கொடுக்கிறது. ஒழுக்கமின்றி மறைஞானப் பார்வை கட்டுப்படுத்தப்படாமல் போகும்; சனி கட்டுப்பாட்டை வழங்குகிறது." },
      { label: "புதுமையான ஆராய்ச்சி",       desc: "சதயத்தின் மறைஞான ஆழம், சுதந்திர பார்வை, சனியின் கட்டமைப்பு ஒழுக்கம் ஆகியவற்றின் கலவை புதுமையான ஆராய்ச்சியாளரை உருவாக்குகிறது — மற்றவர்கள் பார்க்காத இடங்களில் பார்த்து மற்றவர்கள் காணாதவற்றை காண்பவர்." },
    ],
    careerAbilityLabels: ["மருத்துவம் & மாற்று குணப்படுத்துதல்", "ஜோதிடம் & மறைஞான அறிவியல்கள்", "அறிவியல் ஆராய்ச்சி & கண்டுபிடிப்பு", "மனோவியல் & ஆழ சிகிச்சை", "தொழில்நுட்பம் & முறைமை கண்டுபிடிப்பு"],
    careerClusters: [
      { title: "மருத்துவம், குணப்படுத்துதல் & மாற்று சிகிச்சைகள்", desc: "வழக்கமான மருத்துவம், ஆயுர்வேதம், ஆற்றல் குணப்படுத்துதல், மூலிகையியல் — தொழில்முறை சுகாதார மற்றும் மீட்பு தளத்தில் பயன்படுத்தப்படும் 'நூறு குணப்படுத்துபவர்கள்' நட்சத்திரம்." },
      { title: "ஜோதிடம் & மறைஞான அறிவியல்கள்",                     desc: "ஜ்யோதிஷ், தந்திரம், மறைஞான மரபுகள் — தொழில்முறை ஞானமாக ஈடுபடும் வருணனின் மறைந்திருக்கும் வரிசை மற்றும் பிரபஞ்ச சட்டத்தின் தளம்." },
      { title: "அறிவியல் ஆராய்ச்சி & கண்டுபிடிப்பு",             desc: "சுதந்திர அறிவியல் ஆராய்ச்சி, முன்னுதாரண-உடைக்கும் விசாரணை — ஞான தளத்தில் சதயத்தின் சுதந்திர பார்வை." },
      { title: "மனோவியல் & ஆழ சிகிச்சை",                         desc: "ஆழ மனோவியல், ஆற்றல் மனோவியல், காணக்கூடிய அறிகுறிகளின் கண்ணுக்கு தெரியாத வேர்களை தீர்க்கும் சிகிச்சைகள்." },
      { title: "தொழில்நுட்பம் & முறைமை கண்டுபிடிப்பு",           desc: "தொழில்நுட்ப ஆராய்ச்சி, முறைமை கண்டுபிடிப்பு, தொழில்நுட்பத்தின் தளத்தில் சனியின் ஒழுக்கம் மற்றும் ராகுவின் புதுமையான ஆற்றல்." },
      { title: "சுற்றுச்சூழல் & கடல் அறிவியல்கள்",               desc: "கடல் ஆராய்ச்சி, சுற்றுச்சூழல் ஆராய்ச்சி, வருணனின் உடல் தளத்தின் ஆய்வு — தொழில்முறை அறிவியல் மூலம் வெளிப்படும் பிரபஞ்ச நீர்களின் கடவுள்." },
    ],
    modernApps: [
      { title: "சுகாதார தொழில்நுட்பம் & குணப்படுத்துதல் தளங்கள்", desc: "ஒருங்கிணைந்த மருத்துவ தளங்கள், மாற்று குணப்படுத்துதல் தொழில்நுட்பம், முழுமையான சுகாதார பயன்பாடுகள்." },
      { title: "ஜோதிடம் & மறைஞானத் தொழில்நுட்பம்",                  desc: "ஜ்யோதிஷ் தளங்கள், மறைஞானத் தொழில்நுட்பம், பிரபஞ்ச சட்ட நுண்ணறிவு பயன்பாடுகள்." },
      { title: "அறிவியல் ஆராய்ச்சி தொழில்நுட்பம்",               desc: "சுதந்திர ஆராய்ச்சி தளங்கள், முன்னுதாரண-கண்டுபிடிப்பு கருவிகள், திறந்த-அறிவியல் விசாரணை தொழில்நுட்பம்." },
      { title: "மனோவியல் & ஆழ சிகிச்சை தொழில்நுட்பம்",          desc: "ஆற்றல் மனோவியல் தளங்கள், ஆழ சிகிச்சை பயன்பாடுகள், கண்ணுக்கு தெரியாத-வேர் சுகாதார தொழில்நுட்பம்." },
      { title: "முறைமை கண்டுபிடிப்பு & தொழில்நுட்ப ஆராய்ச்சி",  desc: "முறைமை கண்டுபிடிப்பு தளங்கள், மறைந்திருக்கும் வரிசை ஆராய்ச்சி தொழில்நுட்பம், கட்டமைப்பு நுண்ணறிவு பயன்பாடுகள்." },
      { title: "சுற்றுச்சூழல் & கடல் தொழில்நுட்பம்",             desc: "கடல் ஆராய்ச்சி தளங்கள், சுற்றுச்சூழல் நுண்ணறிவு தொழில்நுட்பம், வருணனின் தளம் டிஜிட்டல் அறிவியலில்." },
    ],
    dashaThemes: [
      "கண்ணுக்குத் தெரியாதவற்றில் பிறப்பு — ராகு ஆரம்பம், மறைபொருள் உணர்திறன்",
      "தத்துவத் திறப்பு — குரு ஞானம், குணப்படுத்தும் மரபு",
      "ராசி அதிபதி — குணப்படுத்துபவரின் தேர்ச்சி — சனி தசை கும்ப ராசிக்கு",
      "வெளிப்படுத்திய மர்மம் — புதன் எழுத்து, மரபு பரிமாற்றம்",
      "மர்மம் திரும்புகிறது — கேது எளிமை, ஆழ்ந்த கவனம்",
      "அழகான குணப்படுத்துதல் — சுக்கிர கருணை, மூத்த செழிப்பு",
      "இறுதி சூரிய தெளிவு — சூரியன் ஒளி",
      "இறுதி உணர்வுக் கடல் — சந்திர முடிவு",
    ],
    dashaDetails: [
      {
        expect: "சதயம் ராகு தசையில் தொடங்குகிறது — அசாதாரண உணர்தல் வரம்பு, வழக்கத்துக்கு மாறான நுண்ணறிவு, அனுபவத்தின் கண்ணுக்குத் தெரியாத பரிமாணம் தெரிவதைப் போலவே உண்மையானது, அல்லது அதைவிட உண்மையானது என்ற உணர்வு ஆகியவற்றின் தொடக்கம். ராகு நீண்ட தொடக்க தசை; பிறக்கும்போது மீதமுள்ள இருப்பு முதல் பாதத்தில் நீளமாகவும் நான்காம் பாதத்தில் குறுகியதாகவும் இருக்கும் — இந்த தசைக்குக் காட்டப்படும் வரம்பு அதைச் சொல்கிறது. ராகுவின் களத்தில் பிறந்த சதயக் குழந்தைக்கு ஆரம்ப ஆண்டுகளிலிருந்தே விசித்திரமான தன்மை உண்டு: சொல்லப்படாதது, காட்டப்படாதது, குடும்ப, சமூக வாழ்வின் மேற்பரப்புக்குக் கீழே செயல்படுவது பற்றிய விழிப்புணர்வு. மறைஞானம், மருத்துவம், அல்லது அறிவியல் ரீதியாக வழக்கத்துக்கு மாறானவற்றுடன் ஆரம்பச் சந்திப்புகள் ராகுவின் தொடக்கத்தில் பொதுவானவை. இருப்பு பள்ளிக் காலம் முழுவதும் நீளுமானால், உண்மையான அறிவுப் பிரகாசமும் வழக்கமான சட்டகங்களுடன் சிரமமும் கலந்து குழந்தை கல்வி முறையுடன் ஈடுபடுகிறது — சதய மனம் பெரும்பாலான பாடத்திட்டங்களுக்கு மிக அகலமானது, மிக ஆழமானது. ராகு–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்; குறைந்த இருப்பில் அது பிறப்புக்கு முன்பே வந்துவிடும்) ஒரு முக்கியமான ராசி அதிபதி அடையாளம்: சனி தன் சொந்த தசையில் ஆளப்போகும் கட்டமைப்பு ஒழுக்கமும் நீண்டகாலப் பொறுமையும் ஆரம்பகால உருவாக்கும் சந்திப்பாக வருகிறது.",
        navigate: "இளம் சதயத்திற்கு ராகுவின் முதன்மைச் சவால் உணர்தல் வரம்பின் தீவிரம் — கண்ணுக்குத் தெரியாததைப் பார்க்கும் குழந்தை, உணர்ந்ததை ஒருங்கிணைக்கும் முதிர்ச்சியின்றி அதற்கு ஆளாகிறது. வழக்கத்துக்கு மாறான நுண்ணறிவுக்கு வழக்கத்துக்கு மாறான கல்வி ஆதரவு தேவை; சதயக் குழந்தையை முற்றிலும் வழக்கமான சட்டகங்களுக்குள் தள்ளுவது விரக்தியையும், மிகத் திறமையான நபரில் வெளிப்படையான குறைந்த செயல்திறனையும் தருகிறது. ராகு–சனி புக்தி ஒரு ராசி அதிபதி அடையாளம்: முதிர்ந்த சதய வாழ்வின் சட்டகமாக இருக்கப்போகும் ஒழுக்கமும் கட்டமைப்பும் உடன் ஒரு திருப்புமுனை ஆரம்பகாலச் சந்திப்பு.",
        focus: "சனிக்கிழமை ராகு சன்னதி வழிபாடும், வழக்கத்துக்கு மாறான நுண்ணறிவை மதித்து அதற்குச் சவால் விடும் கல்விச் சூழல்களை வழங்குவதும். ராகு–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு முக்கிய ராசி அதிபதி அடையாளம்: முதிர்ந்த குணப்படுத்துபவர் அல்லது மறைஞானி வாழ வேண்டிய கட்டமைப்பு ஒழுக்கத்துடன் முதல் தீவிரச் சந்திப்பாக ராகுவின் தொடக்கக் களத்தில் சனி வருகிறார் — இது பிறப்புக்குப் பின் வருமானால், ஒரு ஒழுக்கத்துக்கான தீர்மானமான ஆரம்ப அர்ப்பணத்தின் தருணம் இதுவாகவே பெரும்பாலும் இருக்கும்.",
      },
      {
        expect: "குரு தசை, சதயத்தின் மறைஞான, குணப்படுத்தும் நுண்ணறிவை புரிதலின் பெரிய மரபுக்குள் சூழலில் வைக்கும் தத்துவ அகலத்தையும் ஞானத்தையும் கொண்டுவருகிறது. பிந்தைய பாதங்களில் இது குழந்தைப் பருவத்தில் தொடங்கி பள்ளி, உயர்கல்வி வழியாகச் செல்கிறது; முதல் பாதத்தில் பள்ளி முடியும் தருணத்தில் தொடங்கி முதல் பணி ஆண்டுகள் வரை நீள்கிறது. உயர் கல்வி, வாழ்வின் பணியாகப்போகும் குணப்படுத்தும் அல்லது மறைபொருள் மரபுடன் முதல் தீவிரச் சந்திப்பு, வழக்கத்துக்கு மாறான நுண்ணறிவு செயல்படும் தத்துவச் சட்டகம் ஆகிய அனைத்தும் குருவின் நீண்ட காலத்தில் நிறுவப்படுகின்றன. சதயத்தின் தொழில் வாழ்வின் வரையறுக்கும் வழிகாட்டியாகும் ஆசிரியர் பொதுவாக குரு–சுக்கிர அல்லது குரு–சனி புக்தியில் நுழைகிறார். முதல் தீவிர குணப்படுத்தும் அல்லது ஆராய்ச்சிப் பயிற்சி நிறுவப்படுகிறது.",
        navigate: "சதயத்திற்கு குருவின் முதன்மைச் சவால், மறைஞானத்தை முறைமைப்படுத்தும் சோதனை — வருணனின் களத்தின் உயிர்ப்பான, நெகிழ்வான நுண்ணறிவை, உயிர்த்தன்மையை இழக்கும் நிலையான தத்துவ அமைப்பாக மாற்றுவது. 'நூறு குணப்படுத்துபவர்கள்' ஒற்றை அமைப்பிலிருந்து அல்ல, குறிப்பிட்ட சூழ்நிலைக்குப் பொருத்தமான மருந்தைக் கண்டடையும் ஆற்றலிலிருந்து செயல்படுகிறார்கள். குரு–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு முக்கிய ராசி அதிபதி துணைக் காலம் — குருவின் விரிந்த களத்தில் சனியின் கட்டமைப்பு ஒழுக்கத்துடன் மிகக் குறிப்பிடத்தக்க சந்திப்பு.",
        focus: "வியாழக்கிழமை பிருஹஸ்பதி வழிபாடும், மறைஞான ஆழத்துடன் தத்துவ அகலத்தையும் வேண்டுமென்றே வளர்ப்பதும். குரு–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு ராசி அதிபதி அடையாளம்: முதிர்ந்த சதயப் பயிற்சிக்கான ஒழுக்கச் சட்டகத்தை நிறுவும் சக்திவாய்ந்த கட்டமைப்புச் சந்திப்பாக குருவின் ஞானக் களத்தில் சனி வருகிறார்.",
      },
      {
        expect: "சனி தசை சதயத்திற்கு ராசி அதிபதியின் வருகை. சனி உங்கள் ராசியான கும்பத்தின் அதிபதி — பாதத்தைப் பொறுத்து வளரிளம் பருவத்தின் முடிவிலோ நிலைபெற்ற பணி ஆண்டுகளிலோ தொடங்கும் அவரது நீண்ட தசை, சதய வாழ்வின் கட்டமைப்பு ரீதியாக மிக முழுமையான, ஒழுக்கமான, தொழில்முறையில் மிக அதிகாரமுள்ள காலம். ராகுவின் தொடக்கத்திலிருந்து வளர்ந்து குருவின் தத்துவ அகலத்தால் ஆழமான குணப்படுத்தும், ஆராய்ச்சி, அல்லது மறைஞானப் பயிற்சி இப்போது சனியின் நீண்டகாலப் பொறுமையின் முழு கட்டமைப்பு ஆட்சியைப் பெறுகிறது. சுதந்திரப் பயிற்சி நிறுவப்படுகிறது; 'நூறு குணப்படுத்துபவர்களின்' புகழ் பரந்த உலகில் அறியப்படத் தொடங்குகிறது; ஆராய்ச்சி அல்லது குணப்படுத்தும் பணி, முந்தைய காலங்கள் — எவ்வளவு ஊக்கமளித்ததாயினும் — எட்ட முடியாத கட்டமைப்புத் தேர்ச்சித் தரத்தை அடைகிறது. இது நிறுவப்பட்ட குணப்படுத்துபவர், அதிகாரபூர்வ ஆராய்ச்சியாளர், மறைந்த ஒழுங்கின் தேர்ச்சியாளரின் தசை.",
        navigate: "ராசி அதிபதி தசையில் சனியின் முதன்மைச் சவால், சுதந்திரக் கண்ணோட்டத்தை நிறுவனமயமாக்குவது — நோயின் கண்ணுக்குத் தெரியாத வேரிலிருந்து எப்போதும் செயல்பட்ட குணப்படுத்துபவர், நிலையான அமைப்பை உருவாக்கி அதையே ஒரே சரியான அணுகுமுறையாகப் பாதுகாக்கும் சோதனையைக் கண்டுபிடிப்பது. நோய் பலவகை என்பதால், வருணனின் களத்துக்கு நூறு மருந்துகள் உள்ளன; குணப்படுத்தும் நுண்ணறிவு நெகிழ்வாக இருக்க வேண்டும். இந்த நீண்ட தசை முழுவதும் உடல் பராமரிப்பு முக்கியம்.",
        focus: "சனிக்கிழமை சனி வழிபாடு, சனி பூஜை, ஆஞ்சநேயர் வழிபாடு, பயிற்சியின் ஒழுக்கத்துக்குள் கண்ணோட்டத்தின் சுதந்திரத்தை வேண்டுமென்றே பேணுவது. சனி ராசி அதிபதியின் நீண்ட தசை, நூறு மருந்துகள் வரையறுக்கப்பட்ட பட்டியல் அல்ல என்று அறிந்த தாழ்மையான குருநாதராக வெளிப்படுவதே சிறந்தது — குணப்படுத்துபவரின் நுண்ணறிவுக்கும் எதிர்ப்படும் குறிப்பிட்ட சூழ்நிலைக்கும் இடையிலான ஒவ்வொரு புதிய சந்திப்புடனும் அது வளர்கிறது.",
      },
      {
        expect: "பிற்கால பணி ஆண்டுகளில் வரும் புதன் தசை, சதயத்தின் மறைஞான, குணப்படுத்தும் தேர்ச்சிக்கு மனதின் துல்லியத்தையும் தெளிவாக வெளிப்படுத்தும் திறனையும் கொண்டுவருகிறது. ராகுவின் தொடக்கத்திலிருந்து பயிற்சியாகவும் இருப்பாகவும் செயல்பட்ட மறைந்த அறிவு, இப்போது புதனில் தெளிவான, துல்லியமான வெளிப்பாட்டுக்கான திறனைக் காண்கிறது — தான் செய்வதை விளக்கக்கூடிய குணப்படுத்துபவர், தான் அறிந்ததை எழுதக்கூடிய மறைஞானி, தான் கண்டுபிடித்ததை வெளியிடக்கூடிய ஆராய்ச்சியாளர். கற்பித்தல், எழுத்து, சதயப் புரிதலைக் கடத்துதல் ஆகியவை புதன் தசையின் முதன்மைத் தொழில் வெளிப்பாடுகள்.",
        navigate: "சதயத்திற்கு புதனின் முதன்மைச் சவால், உண்மையிலேயே சொல்ல முடியாதவற்றின் வெளிப்பாடு — வருணனின் மறைந்த ஒழுங்கின் களம் புதனின் துல்லிய மொழியில் எப்போதும் தெளிவாக மொழிபெயர்க்கப்படுவதில்லை. அபாயம் ஆழத்தை இழக்கும் மிகை எளிமைப்படுத்தலோ, ஆழத்தைக் காக்கும் ஆனால் கடத்தத் தவறும் வேண்டுமென்றே மறைத்தலோ. உடல் பராமரிப்பும் ஆற்றல் மேலாண்மையும் முக்கியம்.",
        focus: "புதன்கிழமை புதன் வழிபாடு. திரட்டப்பட்ட மறைஞான, குணப்படுத்தும் புரிதலைக் கற்பித்தலிலும் வெளிப்படுத்தலிலும் வேண்டுமென்ற ஈடுபாடு.",
      },
      {
        expect: "பிற்கால வாழ்வில் வரும் கேது தசை அறிவுத் தளத்தின் மாபெரும் எளிமையைக் கொண்டுவருகிறது. புதனின் வெளிப்படுத்தும் முழுமைக்குப் பிறகு, கேது சதயத்தை மூலத்துக்குத் திருப்புகிறது — குணப்படுத்தும், மறைஞான நுண்ணறிவு எப்போதும் தன் அதிகாரத்தைப் பெற்ற கண்ணுக்குத் தெரியாத பரிமாணம். 'நூறு குணப்படுத்துபவர்கள்', கேதுவின் எளிமையில், இறுதி மருந்து ஒரு குறிப்பிட்ட மூலிகையோ பயிற்சியோ அல்ல, இருப்பே — வருணனின் விழிப்புணர்வு தரும் கவனத்தின் தரமே என்று கண்டுபிடிக்கிறார்கள்.",
        navigate: "முழுமையான மற்றும் மென்மையான உடல் பராமரிப்பு. இந்த வயதில் கேது அது குணப்படுத்துபவரின் கருவி தேவையின்றி இருக்கும் குணப்படுத்துதலில் இருக்க அழைப்பு.",
        focus: "விநாயகர் வழிபாடு, பித்ரு தர்ப்பணம், முன்னோர் சடங்குகள். வருணனின் சேவகர் பலரை குணப்படுத்தினார்; இப்போது குணப்படுத்துபவர் குறிப்பிட்ட கருவி தேவையில்லாத குணப்படுத்துதலில் ஓய்கிறார்.",
      },
      {
        expect: "முதிர்ந்த வயதில் வரும் சுக்கிர தசை சதய மூத்தவரின் பிற்கால வாழ்வுக்கு சுக்கிரனின் அழகியல் நளினத்தையும் செழிப்பான அரவணைப்பையும் கொண்டுவருகிறது. முந்தைய தசைகளின் மறைஞான ஆழமும் குணப்படுத்தும் தேர்ச்சியும் இப்போது சுக்கிரனின் அழகுக் கொடையுடன் இணைகின்றன — மூத்தவரின் இருப்பையே ஒரு வகை ஊட்டமாக்கும் தரம்.",
        navigate: "இந்த வயதில் சுக்கிரனின் நீண்ட தசை முழுவதும் முழுமையான, அர்ப்பணிப்புடன் கூடிய உடல் பராமரிப்பு. உடல் தொடர்ந்த, மென்மையான கவனத்தைக் கோருகிறது.",
        focus: "வெள்ளிக்கிழமை சுக்கிர வழிபாடு, அழகை வேண்டுமென்றே அனுபவித்தல் — இசை, இயற்கை, உறவுகள், நன்கு வாழ்ந்த நீண்ட வாழ்வின் அழகியல் இன்பங்கள். இந்த வரிசையின் இறுதி தசையாகச் சுக்கிரன் அருளின் கொடை: சதய ஜாதகர், மிக முதிர்ந்த வயதில், குணப்படுத்துதல் எப்போதும் சேவித்து வந்த அழகைப் பெறுகிறார்.",
      },
      {
        expect: "மிக முதிர்ந்த வயதில் வரும் சூரிய தசையை மிகச் சில சதய ஆத்மாக்களே அடைகின்றன. வருபவர்களுக்கு, சூரியன் இறுதி சூரியத் தெளிவைக் கொண்டுவருகிறார் — நூறு குணப்படுத்துபவர்களின் காய்ச்சி வடித்த அதிகாரம் அதன் மிக ஒளிரும் வடிவில்.",
        navigate: "முழுமையான மற்றும் அர்ப்பணிக்கப்பட்ட உடல் பராமரிப்பு.",
        focus: "குணப்படுத்துபவர் மூத்தவரின் சூரிய அதிகாரம் — கண்ணுக்கு தெரியாதவற்றை வழியாக உண்மையைக் கண்ட ஒளி, இப்போது கருவிகள் அல்லது முறைமைகள் தேவையின்றி வெறுமனே ஒளிர்கிறது.",
      },
      {
        expect: "இந்த வரிசையின் கடைசி தசையான சந்திர தசையை அசாதாரணமாகச் சில சதய ஆத்மாக்கள் மட்டுமே அடைகின்றன. வருபவர்களுக்கு, சந்திரன் உணர்வுக் கடலுக்கான இறுதித் திரும்புதலைக் கொண்டுவருகிறார் — வருணனின் பிரபஞ்ச நீர்களின் உணர்வுப் பரிமாணம் அதன் மிக நேரடியான, இடைநிலையற்ற வடிவில்.",
        navigate: "இந்த மிக முதிர்ந்த வயதில் முழுமையான, அர்ப்பணிப்புடன் கூடிய உடல் பராமரிப்பு.",
        focus: "ஒரு வாழ்நாள் பிறரைக் கவனித்த குணப்படுத்துபவர் இப்போது தன்னை நேசிப்பவர்களிடமிருந்து ஆழ்ந்த அக்கறையைப் பெறுகிறார். கண்ணுக்குத் தெரியாதது தெரிவதாகிறது; பிரபஞ்ச நீர்கள் உணர்வின், உறவின், அன்பின் நீர்களும் கூட.",
      },
    ],
    spirituality: [
      { title: "வருண வழிபாடு & பிரபஞ்ச சட்டம்",            desc: "வருணன் — பிரபஞ்ச நீர்களின் கடவுள், மறைந்திருக்கும் வரிசை, மற்றும் கண்ணுக்கு தெரியாத யதார்த்தத்தை நிர்வகிக்கும் கர்ம சட்டம் — சதயத்தின் தலைமை தெய்வம். வருண சூக்த பாராயணம் (ரிக் வேதத்திலிருந்து), பிரபஞ்ச கடலை கௌரவிக்கும் நீர் சடங்குகள்." },
      { title: "சனி & கும்ப பக்தி",                         desc: "சனி — கும்பத்தின் ராசி அதிபதி — சதயத்தின் ஆளும் கிரகம். சனிக்கிழமை சனி பூஜை, பொறுமையான, நீண்ட-விளையாட்டு பக்தியின் நடைமுறை, கட்டமைப்பு எளிமையின் வேண்டுமென்து வளர்ப்பு." },
      { title: "புனித சேவையாக குணப்படுத்துதல்",            desc: "சதயத்திற்கு, குணப்படுத்துதலின் செயல் — வருணனின் பிரபஞ்ச சட்டத்தின் மறைந்திருக்கும் வரிசையை நோய் அல்லது துன்பத்தின் காணக்கூடிய குழப்பத்துடன் தொடர்பு கொண்டு வருவது — தன்னே மிக உயர்ந்த ஆன்மீக நடைமுறை. நூறு குணப்படுத்துபவர்கள் ஒரு தொழில்முறை அல்ல ஆனால் புனிதமான செயல்பாடு." },
    ],
    guidance: "நூறு குணப்படுத்துபவர்கள் எந்த ஒரு மருந்தும் எப்போதும் சரியானது அல்ல, எந்த ஒரு முறைமையும் எப்போதும் முழுமையானது அல்ல என்று அறிவார்கள் — ஏனென்றால் நோய் பல்வேறு மற்றும் அதன் பின்னால் உள்ள மறைந்திருக்கும் வரிசை எந்த ஒரு சூத்திரத்தையும் விட ஆழமானது. வருணன் உங்களுக்கு கொடுத்த பார்வையின் சுதந்திரம் ஆணவம் அல்ல ஆனால் நம்பகத்தன்மை: ஏற்கனவே உள்ள கட்டமைப்பு என்ன இருக்க வேண்டும் என்று சொல்கிறதை விட உண்மையில் என்ன இருக்கிறது என்று பார்க்கும் விருப்பம். கண்ணுக்கு தெரியாத வேரை நம்புங்கள்; நடைமுறையில் ஒழுக்கமாக இருங்கள்; மற்றும் நூறு மருந்துகள் உங்கள் கவனத்துடனும் உதவி தேடும் குறிப்பிட்ட சூழ்நிலையுடனும் உண்மையான சந்திப்பிலிருந்து வெளிப்படட்டும்.",
    careerNote: "உடல் நலம், நனவு, பிரபஞ்ச சட்டம் அல்லது அறிவியல் கட்டமைப்பு ஆகியவற்றின் தளத்தில் — யதார்த்தத்தின் கண்ணுக்கு தெரியாத பரிமாணம் நேரடியாக, நேர்மையாக மற்றும் அடையப்பட்ட புரிதலில் தனிமையாக நிற்கும் விருப்பத்துடன் ஈடுபட வேண்டும் என்ற இடங்களில் சதயம் சிறப்பாக செயல்படுகிறது.",
    modernLead: "சதயத்தின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "குணப்படுத்தும் நுண்ணறிவு, மறைஞான ஆழம், சுதந்திரமான பார்வை சதயத்தின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function ShatabhishaVisualPage() {
  return <NatchathiramVisualContent data={SATHAYAM} visual={SHATABHISHA_VISUAL} timings={dasaTimingsFor(SATHAYAM.number)} />;
}
