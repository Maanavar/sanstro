import type { Metadata } from "next";
import { withTamilTwin } from "@/lib/localized-metadata";
import { withDasaTimingHold } from "@/lib/natchathiram-dasa-hold";
import { dasaTimingsFor } from "@/lib/natchathiram-dasa-timings";
import { nakshatraDisplayName } from "@/lib/nakshatra-display-name";
import { natchathiramVisualTa } from "@/lib/marketing-seo-ta";
import { REVATHI } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

const EN_METADATA: Metadata = {
  title: `${nakshatraDisplayName(REVATHI.number, "en")} — Visual Profile`,
  description: "Visual profile of Revathi Nakshathiram: personality traits, career strengths, dasa timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/revati/visual" },
  openGraph: {
    title: `${nakshatraDisplayName(REVATHI.number, "en")} — Visual Profile`,
    description: "Visual profile of Revathi Nakshathiram: personality traits, career strengths, dasa timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/revati/visual",
    type: "article",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withDasaTimingHold(await withTamilTwin(EN_METADATA, "/natchathiram/revati/visual", natchathiramVisualTa("revati")!), "revati");
}

const REVATI_VISUAL: NatchathiramVisualData = {
  atAGlance: [
    { label: "Nourishing Presence",      score: 98 },
    { label: "Safe Passage Guidance",    score: 97 },
    { label: "Inclusive Compassion",     score: 98 },
    { label: "Pushan's Abundance",       score: 96 },
    { label: "Jupiter-Meena Wisdom",     score: 97 },
  ],

  radar: {
    labels: ["Nourishment", "Guidance", "Compassion", "Abundance", "Wisdom", "Completion"],
    values: [98, 97, 98, 96, 97, 96],
  },

  coreStrengths: [
    { symbol: "◎", label: "Nourishing Presence",     score: 98, desc: "Pushan — the god of nourishment, the shepherd who guides the lost, the deity who ensures safe arrival — is Revati's presiding deity. The Revati quality is nutritive: the capacity to make others feel fed, welcomed, and genuinely cared for, regardless of what the external circumstances may be." },
    { symbol: "◈", label: "Safe Passage Guidance",   score: 97, desc: "Pushan is the guide of souls — the one who accompanies the traveller at the threshold between here and there, between one state and the next. Revati carries this function: the capacity to guide others through transitions, thresholds, and the unknown territory between what was and what will be." },
    { symbol: "⚡", label: "Inclusive Compassion",    score: 98, desc: "The last nakshathiram — the completion of the zodiacal cycle — carries the inclusive compassion of one who has witnessed the entire spectrum of human experience and finds, in that witnessing, not judgment but the patient love of the shepherd who does not abandon any member of the flock." },
    { symbol: "♥", label: "Pushan's Abundance",      score: 96, desc: "Pushan gives abundance — not the abundance of wealth alone but the abundance of nourishment, of welcome, of the sense that there is always enough. The Revati quality of abundance is not acquisitive but distributive: it flows toward those who need it." },
    { symbol: "△", label: "Jupiter-Meena Wisdom",    score: 97, desc: "Meena is Jupiter's own rasi — and the philosophical expansiveness, compassion, and intuitive wisdom that Jupiter gives to Meena-born Revati is the rasi quality that suffuses the entire life. Jupiter's dasa arrives at ages 85-101 as the life's culminating philosophical harvest." },
    { symbol: "☽", label: "Completion Intelligence", score: 96, desc: "Being the last nakshathiram gives Revati the capacity to recognise endings, to honour completions, and to facilitate the transitions that move something from its completion to its new beginning — the shepherd at the threshold." },
  ],

  careerAbilities: [
    { label: "Teaching & Wisdom Transmission",  score: 98 },
    { label: "Counselling & Compassionate Care", score: 97 },
    { label: "Spiritual Practice & Ministry",   score: 98 },
    { label: "Social Work & Humanitarian Service", score: 96 },
    { label: "Arts & Creative Nourishment",     score: 95 },
  ],
  careerNote: "Revati excels wherever the capacity to nourish, to guide safely through transitions, and to maintain the inclusive compassion that does not abandon anyone — regardless of how difficult or complex the situation — are the central professional requirements.",

  careerClusters: [
    { symbol: "◎", title: "Spiritual Teaching & Ministry",       desc: "Spiritual guidance, religious ministry, the transmission of the wisdom traditions that nourish souls across the threshold of understanding — Pushan's guidance function applied to the sacred." },
    { symbol: "◈", title: "Counselling, Therapy & Safe Passage", desc: "Counselling, grief therapy, hospice care, the guidance of people through the most difficult transitions of their lives — the shepherd at the threshold." },
    { symbol: "⚡", title: "Humanitarian Work & Social Service",  desc: "Humanitarian work, social service, the care of the most vulnerable — Revati's inclusive compassion and Pushan's distributive abundance applied to the domain of collective need." },
    { symbol: "♥", title: "Teaching & Educational Nourishment",  desc: "Teaching at all levels — the teacher who nourishes the whole student, not just the intellectual capacity — the educator who ensures safe passage through the learning process." },
    { symbol: "△", title: "Arts & Creative Expression",          desc: "Fine arts, music, poetry, and the creative arts that nourish the human spirit — Revati's abundance and Pushan's beauty applied to the domain of aesthetic creation." },
    { symbol: "☽", title: "International Work & Cross-Cultural Service", desc: "International development, cross-cultural humanitarian work, the care of those who are between worlds — the shepherd whose flock crosses borders." },
  ],

  modernApps: [
    { symbol: "◎", title: "Spiritual Guidance Technology",         desc: "Spiritual guidance platforms, religious ministry technology, wisdom tradition transmission applications." },
    { symbol: "◈", title: "Counselling & Transition Care Technology", desc: "Grief counselling platforms, hospice care technology, life transition guidance applications." },
    { symbol: "⚡", title: "Humanitarian & Social Service Technology", desc: "Humanitarian aid platforms, social service technology, vulnerable population care applications." },
    { symbol: "♥", title: "Education & Nourishing Teaching Technology", desc: "Whole-student education platforms, nourishing pedagogy technology, safe learning environment applications." },
    { symbol: "△", title: "Arts & Creative Nourishment Technology", desc: "Arts therapy platforms, creative expression technology, spiritual nourishment through arts applications." },
    { symbol: "☽", title: "International Development Technology",   desc: "International development platforms, cross-cultural care technology, border-crossing humanitarian applications." },
  ],

  dashaTimeline: [
    {
      planet: "Mercury", theme: "Born to Communicate the Nourishment",
      detail: {
        expect: "Revati opens in Mercury dasa — a beginning of unusual communicative sensitivity, relational intelligence, and the capacity to perceive and articulate what others are experiencing. Mercury's is a long opening dasa, and the balance left at birth runs from long for births in the first pada to short for the fourth; the range shown for this dasa gives it. The Revati child in Mercury dasa has an early gift for language, for storytelling, and for the kind of communication that makes others feel seen and understood. Where the balance runs through the school years, the result is a student whose intelligence is characteristically inclusive — not the student who excels by outperforming others but the one who ensures that the learning is shared and that no one is left behind. The first significant artistic, communicative, or relational passion typically crystallises in Mercury's opening years. The Mercury–Jupiter bhukti (the table below gives when it begins and how long it lasts) is a rasi lord sub-period flag: Jupiter is the lord of your rasi, Meena, and this is the first major encounter with the Jupiter quality — the rasi lord's philosophical grace and expansive wisdom.",
        navigate: "Mercury's primary challenge for Revati is the risk of dispersal — the person whose natural quality is to communicate what others need to hear, available to everyone, can find Mercury's breadth producing a certain lack of depth in the early communications. The Pushan guidance function requires knowing where one is going as well as being available to help others find their way. The Mercury–Jupiter bhukti is a rasi lord flag: a first, luminous encounter with the Jupiter quality that will govern the life's final philosophical harvest.",
        focus: "Wednesday Mercury worship and the early cultivation of communication in service of depth — the relational intelligence grounded in genuine understanding rather than quick empathy. The Mercury–Jupiter bhukti (the bhukti table below gives when it begins and how long it lasts) is a rasi lord flag: a philosophical opening, an encounter with a wise teacher, or the first serious engagement with the wisdom tradition that will accompany the Revati life.",
      },
    },
    {
      planet: "Ketu", theme: "The Inner Threshold",
      detail: {
        expect: "Ketu dasa brings the great inward turn — after Mercury's communicative opening, Ketu invites Revati to discover that the guidance function requires first a genuine internal navigation. It falls in very different years by pada: in childhood and early adolescence for the later padas, in late adolescence and early adulthood for the first. For the first pada, university years and the first independent adult experiences run through it; the separation from the family of origin, the first encounters with loss, and the discovery of the limits of what the communicative empathy alone can provide are the formative experiences of Ketu dasa. For the later padas, the same lessons arrive earlier and in simpler forms. The Pushan function — guiding others through thresholds — requires that the guide know the threshold from the inside. Ketu provides that internal encounter.",
        navigate: "Ketu's primary challenge for Revati is the encounter with the limits of nourishment — the person whose nature is to provide Pushan's abundance discovering that not every situation can be nourished, not every transition can be smoothed, not every threshold can be guided through without loss. The Ketu–Jupiter bhukti (the table below gives when it begins and how long it lasts) is a rasi lord sub-period flag: Jupiter arrives in Ketu's simplifying field as a philosophical, expansive, and possibly spiritually decisive sub-period.",
        focus: "Pitru tharpanam and ancestral rites. The Ketu–Jupiter bhukti (the bhukti table below gives when it begins and how long it lasts) is a rasi lord flag: a philosophical opening, a potential encounter with the teacher or wisdom tradition that provides the framework for the life's spiritual path, or a decisive moment of inner clarity about the Revati vocation.",
      },
    },
    {
      planet: "Venus", theme: "The Nourishing Abundance",
      detail: {
        expect: "Venus dasa brings the full flowering of Revati's nourishing and guiding capacities in the professional and relational world; it begins anywhere from childhood's close to early adulthood, by pada, and runs through the long middle of life. Career foundations are established; the unique combination of Revati's compassion, Mercury's articulativeness, and the depth earned in Ketu's threshold is now available in the world's fullness. Marriage and family formation, where they fall in this dasa, are read from Venus, Jupiter and the seventh house of the horoscope rather than from one fixed bhukti. Children arrive; the Revati parent's quality of presence — nourishing without smothering, guiding without controlling — is the distinctive contribution to the next generation. Professional recognition in the teaching, healing, or creative domain reaches its first peak. The Venus–Jupiter bhukti (the table below gives when it begins and how long it lasts) is a significant rasi lord sub-period flag.",
        navigate: "Venus's primary challenge for Revati is the temptation to provide too much — the nourishing person whose abundance instinct meets the world's real needs can begin to deplete the internal resource through over-giving. Pushan nourishes others because Pushan is itself nourished from an inexhaustible source; the Revati equivalent is the deliberate maintenance of the inner source through contemplative practice alongside the outer giving. The Venus–Jupiter bhukti is a major rasi lord flag.",
        focus: "Friday Lakshmi worship and the deliberate cultivation of the inner source alongside the outer giving. The Venus–Jupiter bhukti (the bhukti table below gives when it begins and how long it lasts) is a major rasi lord flag: Jupiter arrives within Venus's long dasa as one of its most expansive and philosophically significant sub-periods, often marking the beginning of the most important adult relationship or the crystallisation of the life's central vocation.",
      },
    },
    {
      planet: "Sun", theme: "The Solar Guide",
      detail: {
        expect: "Sun dasa, in mid-life, brings the solar clarity and authority to Revati's compassionate and nourishing character. The guide who has been accompanying others through transitions now stands in the solar light of acknowledged authority — not the authority of power but the authority of trustworthiness, the kind of authority that comes from having genuinely seen people through the difficult passages. Leadership in the professional domain; widening recognition; the public expression of what the Revati wisdom has accumulated.",
        navigate: "Sun's primary challenge for Revati is the encounter between the solar demand for singularity and the Revati inclusive compassion that does not privilege any one over another. The shepherd who also stands in the solar spotlight must remember that the spotlight is in service of the flock, not the other way around. The Sun–Jupiter bhukti (the table below gives when it begins and how long it lasts) brings a rasi lord sub-period: Jupiter arrives in the solar authority field as a warm, expansive, and philosophically rich sub-period.",
        focus: "Sunday Surya worship. The Sun–Jupiter bhukti (the bhukti table below gives when it begins and how long it lasts) is a rasi lord flag: a period of philosophical expansiveness and possible spiritual or professional breakthrough in the midst of Sun's solar authority.",
      },
    },
    {
      planet: "Moon", theme: "The Emotional Shepherd",
      detail: {
        expect: "Moon dasa, in the later working years, brings the full depth of emotional nourishment and compassionate presence to Revati's mature expression. The compassionate guidance function that has been developing since Mercury's opening now operates from the most emotionally present and responsive place available. Family relationships deepen; the Revati elder parent is the emotional ground for adult children navigating their own transitions. Professional work in counselling, healing, or teaching reaches its most emotionally resonant and effective expression. The Moon–Jupiter bhukti (the table below gives when it begins and how long it lasts) is a significant rasi lord sub-period flag.",
        navigate: "Moon's primary challenge for Revati is the risk of emotional merger — the shepherd whose compassion is so complete that the boundaries between self and other begin to dissolve. Pushan guides the flock from a position of knowing where the path goes; the guide who has no separate position from the flock cannot guide. The Moon–Jupiter bhukti is a major rasi lord flag: one of the most expansive and philosophically significant Jupiter presences in the sequence before the Jupiter dasa itself.",
        focus: "Monday Moon worship and the deliberate cultivation of compassionate boundaries — the capacity to be fully present with others' suffering without being absorbed into it. The Moon–Jupiter bhukti (the bhukti table below gives when it begins and how long it lasts) is a major rasi lord flag: Jupiter arrives in Moon's emotional field as the most philosophically expansive and wise sub-period of the Moon dasa.",
      },
    },
    {
      planet: "Mars", theme: "The Vigorous Elder",
      detail: {
        expect: "Mars dasa, in the later years, brings directed energy and physical vitality to Revati's compassionate elder years. After Moon's emotional depth, Mars is invigorating — the elder guide who still has the directness and physical engagement that the early years of guidance lacked. For many Revati, Mars dasa produces a period of surprising professional productivity — the directed energy of Mars joined to the accumulated wisdom of a lifetime produces decisive, effective work.",
        navigate: "Mars's primary challenge for Revati is the encounter between the directed energy and the inclusive compassion — Mars wants to direct, and the Revati compassion wants to include everyone. The vigorous elder who uses Mars's energy in service of the nourishing function is the ideal; the elder who becomes directive rather than guiding is the shadow. The Mars–Jupiter bhukti (the table below gives when it begins and how long it lasts) brings a rasi lord sub-period.",
        focus: "Tuesday Mars shrine prayers. The Mars–Jupiter bhukti (the bhukti table below gives when it begins and how long it lasts) is a rasi lord flag: Jupiter arrives in Mars's vigorous field as a philosophically expansive and wise sub-period in the elder guide's most active period.",
      },
    },
    {
      planet: "Rahu", theme: "The Wide Shepherd",
      detail: {
        expect: "Rahu dasa, running well into later life, brings the great expansion of Revati's nourishing and guiding capacities to the widest possible field. The inclusive compassion that has been developing since Mercury's opening is now available at the scale of communities, institutions, and the wider world. International work, cross-cultural service, and the encounter with the full diversity of human need are common in Rahu's long span. The Revati elder who navigates Rahu dasa with the wisdom accumulated through the previous dasas becomes a figure of remarkable universal compassion — Pushan's shepherd at the largest possible scale.",
        navigate: "Rahu's primary challenge for Revati is the expansion of the nourishing instinct beyond the capacity of the individual to provide — the shepherd whose flock has become too large for any individual guide. The Revati response is to train other shepherds — to transmit the guidance function itself. The Rahu–Jupiter bhukti (the table below gives when it begins and how long it lasts) is a major rasi lord sub-period flag: one of the most significant Jupiter encounters in the Revati life sequence.",
        focus: "Saturday Rahu shrine prayers and the deliberate transmission of the guidance function to others. The Rahu–Jupiter bhukti (the bhukti table below gives when it begins and how long it lasts) is a major rasi lord flag: Jupiter arrives in Rahu's expansive field as a window of major philosophical, spiritual, and wisdom-deepening significance — one of the final major Jupiter encounters before the rasi lord's own dasa.",
      },
    },
    {
      planet: "Jupiter", theme: "Rasi Lord — The Philosopher-Shepherd's Harvest",
      detail: {
        expect: "Jupiter dasa, in very advanced age, is the rasi lord's arrival for Revati — the planet that rules your rasi, Meena, now governs your dasa. For the Revati native who has spent a lifetime nourishing, guiding, and providing Pushan's inclusive compassion to all who sought them, Jupiter dasa is the culminating harvest — the period in which the wisdom of a full life of compassionate service radiates with the philosophical completeness that only age and genuine depth can produce. Those around the Revati elder in Jupiter dasa experience a quality of presence that is difficult to describe — the warmth of the shepherd who has genuinely seen the flock home, now resting in the awareness of what the journey was for. Jupiter dasa is the ending that is also a beginning: Revati, the last nakshathiram, circles back to the first; the shepherd at the boundary is also the one who opens the gate for the new cycle.",
        navigate: "Jupiter's primary shadow in the rasi lord dasa for Revati is the philosophical sentimentality of the completion — the wisdom that has been earned through genuine service beginning to present itself as a comfortable resting place rather than the continuing orientation toward what is real and what is needed. Pushan nourishes at every threshold, including the final one; the Revati elder in Jupiter dasa is called to remain available to what is present rather than dwelling in what has been. Physical care and the gentle management of the body's needs are the primary practical concerns.",
        focus: "Thursday Brihaspati and Dakshinamurthy worship — the cosmic teacher who transmits by presence, who sits at the boundary between what is known and what is beyond. Jupiter dasa is the fullness of the life's nourishing wisdom; give it freely, without holding, to whoever comes to the threshold. The shepherd's work is never finished — even in Jupiter dasa, at the end of the zodiac, there is always someone who needs the safe passage that only Pushan's guide can provide.",
      },
    },
  ],

  spirituality: [
    {
      title: "Pushan Worship & Safe Passage Traditions",
      desc: "Pushan — the god of nourishment, safe passage, and the shepherding of souls — is Revati's presiding deity. Offerings of grain and nourishment (Pushan's sacred domain), prayers for safe passage before journeys and transitions, and the practice of Pushan Sukta recitation are Revati's most resonant spiritual expressions. The care of animals, particularly cattle (Pushan's sacred flock), and the service of those who are between states — travellers, the bereaved, those in transition — are the devotional acts most aligned with Pushan's nature.",
    },
    {
      title: "Jupiter Devotion & Meena Wisdom Traditions",
      desc: "Jupiter — the lord of Meena — governs Revati's rasi throughout the entire life. Thursday Brihaspati worship, Dakshinamurthy devotion, and the sustained engagement with the Vedantic and bhakti wisdom traditions are the most important spiritual structures for the Revati life. Every Jupiter antardasa in the dasa sequence is a significant spiritual event; the arrival of Jupiter's own dasa at 85-101 is the life's spiritual culmination.",
    },
    {
      title: "Service as Devotion & Completion Practice",
      desc: "For Revati, the act of nourishing service — of being genuinely present for those who are in need, in transition, or at a threshold — is the highest form of devotional practice. The Vedantic teaching that the divine is present in all beings is, for Revati, not an abstract philosophy but a lived reality: every person who comes to the threshold is Pushan's flock, and the service to them is the worship of Pushan.",
    },
  ],

  guidance: "You are the last star and the first — the shepherd at the boundary who holds the gate between one cycle and the next. The nourishment you provide is not yours; it flows through you from the inexhaustible abundance that Pushan tends. Do not measure your giving by what you accumulate but by what you distribute; the shepherd's wealth is not in the storehouse but in the health of the flock. The safe passage you guide is itself the sacred act; you do not need to arrive at any particular destination to have done what you came to do. Every threshold you have helped another cross is a completion of the zodiacal cycle; every completion opens the next beginning. Rest in the abundance, give from the abundance, and let Pushan's nourishment flow where it is needed.",

  compatibleEn: ["Aswini", "Uthirattathi", "Rohini", "Poorattathi", "Poosam"],
  compatibleNote: "These nakshatras complement Revati's nourishing presence, safe passage guidance, and inclusive compassion with vitality, contemplative depth, and devotional warmth.",

  ta: {
    atAGlanceLabels: ["வளர்க்கும் இருப்பு", "பாதுகாப்பான கடவு வழிகாட்டுதல்", "உள்ளடக்கிய இரக்கம்", "பூஷனின் செழிப்பு", "குரு-மீன ஞானம்"],
    radarLabels: ["வளர்ப்பு", "வழிகாட்டுதல்", "இரக்கம்", "செழிப்பு", "ஞானம்", "முடிவு"],
    coreStrengths: [
      { label: "வளர்க்கும் இருப்பு",      desc: "பூஷன் — வளர்ப்பின் கடவுள், தொலைந்தவர்களை வழிகாட்டும் ஆட்டிடையன், பாதுகாப்பான வருகையை உறுதிசெய்யும் தெய்வம் — ரேவதியின் தலைமை தெய்வம். ரேவதி குணம் ஊட்டமளிக்கும்: வெளிப்புற சூழ்நிலைகள் என்னவாக இருந்தாலும் மற்றவர்களை ஊட்டமளிக்கப்பட்டு, வரவேற்கப்பட்டு, உண்மையாக கவனிக்கப்படுவதாக உணரவைக்கும் திறன்." },
      { label: "பாதுகாப்பான கடவு வழிகாட்டுதல்", desc: "பூஷன் ஆன்மாக்களின் வழிகாட்டி — இங்கிருந்து அங்கே இடையே, ஒரு நிலையிலிருந்து அடுத்ததிற்கு இடையே வரம்பில் பயணிக்கும் வழிகாட்டி. ரேவதி இந்த செயல்பாட்டை சுமக்கிறது: மாற்றங்கள், வரம்புகள் மற்றும் என்னவாக இருந்தது மற்றும் என்னவாக இருக்கும் ஆகியவற்றுக்கிடையே தெரியாத நிலத்தில் மற்றவர்களை வழிகாட்டும் திறன்." },
      { label: "உள்ளடக்கிய இரக்கம்",     desc: "கடைசி நட்சத்திரம் — ராசிச் சுழற்சியின் முடிவு — மனித அனுபவத்தின் முழு வீச்சை சாட்சியாக கண்ட ஒருவரின் உள்ளடக்கிய இரக்கத்தை சுமக்கிறது மற்றும் அந்த சாட்சியத்தில் தீர்ப்பு அல்ல ஆனால் எந்த கூட்டத்தின் உறுப்பினரையும் கைவிடாத ஆட்டிடையனின் பொறுமையான அன்பை காண்கிறது." },
      { label: "பூஷனின் செழிப்பு",       desc: "பூஷன் செழிப்பை கொடுக்கிறது — செல்வம் மட்டுமல்ல ஆனால் ஊட்டம், வரவேற்பு, எப்போதும் போதுமான அளவு இருக்கிறது என்ற உணர்வு. ரேவதியின் செழிப்பு குணம் சேர்க்கும் அல்ல ஆனால் விநியோகிக்கும்: அதற்கு தேவையானவர்களை நோக்கி பாய்கிறது." },
      { label: "குரு-மீன ஞானம்",        desc: "மீனம் குருவின் சொந்த ராசி — மற்றும் குரு மீனத்தில் பிறந்த ரேவதிக்கு கொடுக்கும் தத்துவ விரிவாக்கம், இரக்கம், மற்றும் உள்ளுணர்வு ஞானம் ஆகியவை முழு வாழ்க்கையை நிறைத்துகொள்ளும் ராசி குணம். குருவின் தசை 85-101 வயதில் வாழ்க்கையின் உச்சகட்ட தத்துவ அறுவடையாக வருகிறது." },
      { label: "முடிவு நுண்ணறிவு",       desc: "கடைசி நட்சத்திரமாக இருப்பது ரேவதிக்கு முடிவுகளை அங்கீகரிக்கும், முடிவுகளை கௌரவிக்கும், மற்றும் ஒரு விஷயம் அதன் முடிவிலிருந்து புதிய தொடக்கத்திற்கு நகரும் மாற்றங்களை எளிதாக்கும் திறனை கொடுக்கிறது." },
    ],
    careerAbilityLabels: ["கற்பித்தல் & ஞான பரிமாற்றம்", "ஆலோசனை & இரக்கமான பராமரிப்பு", "ஆன்மீக நடைமுறை & ஊழியம்", "சமூக வேலை & மனிதாபிமான சேவை", "கலைகள் & படைப்பு ஊட்டம்"],
    careerClusters: [
      { title: "ஆன்மீக கற்பித்தல் & ஊழியம்",          desc: "ஆன்மீக வழிகாட்டுதல், மத ஊழியம், ஆன்மாக்களை புரிதலின் வரம்பில் கடந்து ஊட்டும் ஞான மரபுகளின் பரிமாற்றம்." },
      { title: "ஆலோசனை, சிகிச்சை & பாதுகாப்பான கடவு", desc: "ஆலோசனை, துக்க சிகிச்சை, ஹாஸ்பிஸ் பராமரிப்பு, தங்கள் வாழ்க்கையின் மிகவும் கஷ்டமான மாற்றங்களில் மக்களை வழிகாட்டுதல் — வரம்பில் ஆட்டிடையன்." },
      { title: "மனிதாபிமான வேலை & சமூக சேவை",         desc: "மனிதாபிமான வேலை, சமூக சேவை, மிகவும் பாதிக்கப்படக்கூடியவர்களின் பராமரிப்பு." },
      { title: "கற்பித்தல் & கல்வி ஊட்டம்",            desc: "எல்லா நிலைகளிலும் கற்பித்தல் — முழு மாணவரை ஊட்டும் ஆசிரியர், அறிவு திறன் மட்டுமல்ல." },
      { title: "கலைகள் & படைப்பு வெளிப்பாடு",         desc: "நுண்கலை, இசை, கவிதை, மற்றும் மனித ஆவியை ஊட்டும் படைப்பு கலைகள்." },
      { title: "சர்வதேச வேலை & கலாச்சாரங்களுக்கு இடையிலான சேவை", desc: "சர்வதேச வளர்ச்சி, கலாச்சாரங்களுக்கு இடையிலான மனிதாபிமான வேலை, உலகங்களுக்கிடையே உள்ளவர்களின் பராமரிப்பு." },
    ],
    modernApps: [
      { title: "ஆன்மீக வழிகாட்டுதல் தொழில்நுட்பம்",       desc: "ஆன்மீக வழிகாட்டுதல் தளங்கள், மத ஊழியம் தொழில்நுட்பம், ஞான மரபு பரிமாற்றம் பயன்பாடுகள்." },
      { title: "ஆலோசனை & மாற்றம் பராமரிப்பு தொழில்நுட்பம்", desc: "துக்க ஆலோசனை தளங்கள், ஹாஸ்பிஸ் பராமரிப்பு தொழில்நுட்பம், வாழ்க்கை மாற்றம் வழிகாட்டுதல் பயன்பாடுகள்." },
      { title: "மனிதாபிமான & சமூக சேவை தொழில்நுட்பம்",    desc: "மனிதாபிமான உதவி தளங்கள், சமூக சேவை தொழில்நுட்பம், பாதிக்கப்படக்கூடிய மக்கள் பராமரிப்பு பயன்பாடுகள்." },
      { title: "கல்வி & ஊட்டம் கற்பித்தல் தொழில்நுட்பம்",  desc: "முழு-மாணவர் கல்வி தளங்கள், ஊட்டும் கல்வியியல் தொழில்நுட்பம், பாதுகாப்பான கற்றல் சூழல் பயன்பாடுகள்." },
      { title: "கலைகள் & படைப்பு ஊட்டம் தொழில்நுட்பம்",   desc: "கலைகள் சிகிச்சை தளங்கள், படைப்பு வெளிப்பாடு தொழில்நுட்பம், கலைகள் மூலம் ஆன்மீக ஊட்டம் பயன்பாடுகள்." },
      { title: "சர்வதேச வளர்ச்சி தொழில்நுட்பம்",           desc: "சர்வதேச வளர்ச்சி தளங்கள், கலாச்சாரங்களுக்கு இடையிலான பராமரிப்பு தொழில்நுட்பம், எல்லை கடக்கும் மனிதாபிமான பயன்பாடுகள்." },
    ],
    dashaThemes: [
      "ஊட்டத்தைத் தொடர்புகொள்ளப் பிறந்தவர் — புதன் ஆரம்பம், முதல் குரு சந்திப்பு",
      "உள் வாயில் — கேது தீவிர வளர்ச்சி, குருவின் ஞானத் திறப்பு",
      "ஊட்டும் செழிப்பு — சுக்கிர மலர்ச்சி, குருவின் முக்கிய சாளரம்",
      "சூரிய வழிகாட்டி — சூரியன் வளர்ந்த அதிகாரம், குருவின் அரவணைப்பு",
      "உணர்வு ஆட்டிடையன் — சந்திர இரக்கம், குருவின் ஆழ்ந்த சாளரம்",
      "உற்சாக மூத்தவர் — செவ்வாய் உயிர்சக்தி, குருவின் ஞானம்",
      "பரந்த ஆட்டிடையன் — ராகுவின் மிகவும் பரந்த இரக்கம், குருவின் இறுதி முக்கிய சாளரம்",
      "ராசி அதிபதி — தத்துவஞானி-ஆட்டிடையனின் அறுவடை — குரு தசை மீன ராசிக்கு",
    ],
    dashaDetails: [
      {
        expect: "ரேவதி புதன் தசையில் தொடங்குகிறது — அசாதாரண தொடர்பு உணர்திறன், உறவு நுண்ணறிவு, மற்றவர்கள் அனுபவிப்பதை உணர்ந்து வெளிப்படுத்தும் திறன் ஆகியவற்றின் தொடக்கம். புதன் நீண்ட தொடக்க தசை; பிறக்கும்போது மீதமுள்ள இருப்பு முதல் பாதத்தில் நீளமாகவும் நான்காம் பாதத்தில் குறுகியதாகவும் இருக்கும் — இந்த தசைக்குக் காட்டப்படும் வரம்பு அதைச் சொல்கிறது. புதன் தசையில் ரேவதிக் குழந்தைக்கு மொழி, கதை சொல்லல், பிறர் தாம் பார்க்கப்பட்டு புரிந்துகொள்ளப்படுவதாக உணரச் செய்யும் தொடர்பு ஆகியவற்றில் ஆரம்பகாலக் கொடை உண்டு. இருப்பு பள்ளிக் காலம் முழுவதும் நீளுமானால், அறிவு இயல்பாகவே அனைவரையும் உள்ளடக்கும் மாணவர் உருவாகிறார் — பிறரை விஞ்சுவதால் சிறப்பவர் அல்ல, கற்றல் பகிரப்படுவதையும் யாரும் பின்தங்காததையும் உறுதிசெய்பவர். முதல் குறிப்பிடத்தக்க கலை, தொடர்பு அல்லது உறவு ஆர்வம் பொதுவாக புதனின் தொடக்க ஆண்டுகளில் படிகமாகிறது. புதன்–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு ராசி அதிபதி அடையாளம்: குரு உங்கள் ராசியான மீனத்தின் அதிபதி; இது குருவின் தன்மையுடன் — ராசி அதிபதியின் தத்துவ அருள், விரிந்த ஞானத்துடன் — முதல் பெரிய சந்திப்பு.",
        navigate: "ரேவதிக்கு புதனின் முதன்மைச் சவால் சிதறல் அபாயம் — பிறர் கேட்க வேண்டியதைத் தொடர்புகொள்வதே இயல்பான தரமாகக் கொண்ட, எல்லோருக்கும் கிடைக்கும் நபர், புதனின் அகலம் ஆரம்பகாலத் தொடர்புகளில் ஆழமின்மையை உருவாக்குவதைக் காணலாம். பூஷனின் வழிகாட்டும் பணி, பிறர் வழி கண்டடைய உதவுவதோடு தானும் எங்கே போகிறோம் என்று அறிந்திருப்பதைக் கோருகிறது. புதன்–குரு புக்தி ஒரு ராசி அதிபதி அடையாளம்: வாழ்வின் இறுதி தத்துவ அறுவடையை ஆளப்போகும் குருவின் தன்மையுடன் முதல், ஒளிரும் சந்திப்பு.",
        focus: "புதன்கிழமை புதன் வழிபாடும், ஆழத்துக்குச் சேவை செய்யும் தொடர்பை — விரைவான பச்சாதாபத்தில் அல்ல, உண்மையான புரிதலில் அடித்தளமிட்ட உறவு நுண்ணறிவை — ஆரம்பத்திலேயே வளர்ப்பதும். புதன்–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு ராசி அதிபதி அடையாளம்: தத்துவத் திறப்பு, ஞானமுள்ள ஆசிரியருடன் சந்திப்பு, அல்லது ரேவதி வாழ்வுடன் வரப்போகும் ஞான மரபுடன் முதல் தீவிர ஈடுபாடு.",
      },
      {
        expect: "கேது தசை மாபெரும் உள்நோக்கிய திருப்பத்தைக் கொண்டுவருகிறது — புதனின் தொடர்புத் தொடக்கத்துக்குப் பிறகு, வழிகாட்டும் பணி முதலில் உண்மையான உள் வழிசெலுத்தலைக் கோருகிறது என்பதைக் கண்டடைய இளம் ரேவதியை கேது அழைக்கிறது. இது பாதத்தைப் பொறுத்து மிகவும் வேறுபட்ட வயதுகளில் வருகிறது: பிந்தைய பாதங்களில் குழந்தைப் பருவத்திலும் வளரிளம் பருவத்தின் தொடக்கத்திலும், முதல் பாதத்தில் வளரிளம் பருவத்தின் முடிவிலும் இளம் வயது வந்த காலத்திலும். முதல் பாதத்தில் பல்கலைக்கழக ஆண்டுகளும் முதல் சுதந்திரமான வயது வந்த அனுபவங்களும் இதன் வழியாகச் செல்கின்றன; பிறந்த குடும்பத்திலிருந்து பிரிவு, இழப்புடன் முதல் சந்திப்புகள், தொடர்பு பச்சாதாபம் மட்டும் தர முடியாதவற்றின் எல்லைகளைக் கண்டுபிடித்தல் ஆகியவை கேது தசையின் உருவாக்கும் அனுபவங்கள். பிந்தைய பாதங்களில் அதே பாடங்கள் முன்பே, எளிய வடிவங்களில் வருகின்றன. பிறரை வாயில்களைக் கடக்க வழிநடத்தும் பூஷனின் பணிக்கு, வழிகாட்டி அந்த வாயிலை உள்ளிருந்து அறிந்திருக்க வேண்டும். கேது அந்த உள் சந்திப்பைத் தருகிறது.",
        navigate: "ரேவதிக்கு கேதுவின் முதன்மைச் சவால் ஊட்டத்தின் எல்லைகளுடனான சந்திப்பு — பூஷனின் செழிப்பை வழங்குவதே இயல்பாகக் கொண்டவர், எல்லாச் சூழ்நிலையையும் ஊட்ட முடியாது, எல்லா மாற்றத்தையும் எளிதாக்க முடியாது, இழப்பின்றி எல்லா வாயிலையும் கடக்க வழிநடத்த முடியாது என்பதைக் கண்டுபிடிப்பது. கேது–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு ராசி அதிபதி அடையாளம்: கேதுவின் எளிமைப்படுத்தும் களத்தில் குரு தத்துவ, விரிந்த, ஒருவேளை ஆன்மீக ரீதியில் தீர்மானமான துணைக் காலமாக வருகிறார்.",
        focus: "பித்ரு தர்ப்பணம், முன்னோர் சடங்குகள். கேது–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு ராசி அதிபதி அடையாளம்: தத்துவத் திறப்பு, வாழ்வின் ஆன்மீகப் பாதைக்கு சட்டகம் தரும் ஆசிரியர் அல்லது ஞான மரபுடன் சாத்தியமான சந்திப்பு, அல்லது ரேவதியின் அழைப்பைப் பற்றிய உள் தெளிவின் தீர்மானமான தருணம்.",
      },
      {
        expect: "சுக்கிர தசை தொழில்முறை, உறவு உலகில் ரேவதியின் ஊட்டும், வழிகாட்டும் திறன்களின் முழு மலர்ச்சியைக் கொண்டுவருகிறது; பாதத்தைப் பொறுத்து குழந்தைப் பருவத்தின் முடிவிலிருந்து இளம் வயது வந்த காலம் வரை எங்கும் தொடங்கி, வாழ்வின் நீண்ட நடுப்பகுதி வழியாகச் செல்கிறது. தொழில் அடித்தளம் நிறுவப்படுகிறது; ரேவதியின் இரக்கம், புதனின் தெளிவான வெளிப்பாடு, கேதுவின் வாயிலில் ஈட்டிய ஆழம் ஆகியவற்றின் தனித்துவ இணைப்பு இப்போது உலகின் முழுமையில் கிடைக்கிறது. திருமணமும் குடும்ப அமைவும் இந்த தசைக்குள் வருமானால், ஒரு குறிப்பிட்ட புக்தியால் அல்ல, சுக்கிரன், குரு, ஜாதகத்தின் ஏழாம் வீட்டைக் கொண்டு பார்க்கப்படுகின்றன. குழந்தைகள் வருகிறார்கள்; ரேவதிப் பெற்றோரின் இருப்புத் தரம் — அடக்காமல் ஊட்டுவது, கட்டுப்படுத்தாமல் வழிகாட்டுவது — அடுத்த தலைமுறைக்கான தனித்துவப் பங்களிப்பு. கற்பித்தல், குணப்படுத்துதல் அல்லது படைப்புத் துறையில் தொழில்முறை அங்கீகாரம் தன் முதல் உச்சத்தை அடைகிறது. சுக்கிர–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு முக்கியமான ராசி அதிபதி அடையாளம்.",
        navigate: "ரேவதிக்கு சுக்கிரனின் முதன்மைச் சவால் அதிகமாக வழங்கும் சோதனை — உலகின் உண்மைத் தேவைகளைச் சந்திக்கும் செழிப்பு உள்ளுணர்வு கொண்ட ஊட்டும் நபர், அதிகக் கொடுப்பால் உள் வளத்தைக் காலி செய்யத் தொடங்கலாம். பூஷன் பிறரை ஊட்டுவது தான் குறையாத மூலத்திலிருந்து ஊட்டப்படுவதால்; ரேவதியின் சமமான பணி, வெளிக்கொடுப்புடன் தியானப் பயிற்சி மூலம் உள் மூலத்தை வேண்டுமென்றே பராமரிப்பது. சுக்கிர–குரு புக்தி ஒரு முக்கிய ராசி அதிபதி அடையாளம்.",
        focus: "வெள்ளிக்கிழமை லட்சுமி வழிபாடும், வெளிக்கொடுப்புடன் உள் மூலத்தை வேண்டுமென்றே வளர்ப்பதும். சுக்கிர–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு முக்கிய ராசி அதிபதி அடையாளம்: சுக்கிரனின் நீண்ட தசைக்குள் குரு அதன் மிக விரிந்த, தத்துவ ரீதியில் முக்கியமான துணைக் காலங்களில் ஒன்றாக வருகிறார்; பெரும்பாலும் மிக முக்கியமான வயது வந்த உறவின் தொடக்கத்தையோ வாழ்வின் மைய அழைப்பின் படிகமாதலையோ குறிக்கிறது.",
      },
      {
        expect: "நடுவயதில் வரும் சூரிய தசை ரேவதியின் இரக்கமுள்ள, ஊட்டும் இயல்புக்கு சூரியத் தெளிவையும் அதிகாரத்தையும் கொண்டுவருகிறது. பிறரை மாற்றங்கள் வழியாக உடனிருந்து அழைத்துச் சென்ற வழிகாட்டி, இப்போது அங்கீகரிக்கப்பட்ட அதிகாரத்தின் சூரிய ஒளியில் நிற்கிறார் — ஆற்றலின் அதிகாரம் அல்ல, நம்பகத்தன்மையின் அதிகாரம்; மனிதர்களை கடினமான பாதைகளைக் கடக்க உண்மையில் துணைநின்றதால் வரும் அதிகாரம். தொழில் துறையில் தலைமை, விரியும் அங்கீகாரம், ரேவதி ஞானம் திரட்டியதன் பொது வெளிப்பாடு.",
        navigate: "ரேவதிக்கு சூரியனின் முதன்மைச் சவால், ஒருமை கோரும் சூரியனுக்கும் யாரையும் மற்றவர்களை விட உயர்த்தாத ரேவதியின் உள்ளடக்கும் இரக்கத்துக்கும் இடையிலான சந்திப்பு. சூரிய ஒளியிலும் நிற்கும் ஆட்டிடையன், ஒளிவட்டம் மந்தைக்குச் சேவை செய்கிறது, மந்தை அதற்கல்ல என்பதை நினைவில் கொள்ள வேண்டும். சூரிய–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு ராசி அதிபதி துணைக் காலத்தைக் கொண்டுவருகிறது: சூரிய அதிகாரக் களத்தில் குரு அரவணைப்பான, விரிந்த, தத்துவ ரீதியில் வளமான துணைக் காலமாக வருகிறார்.",
        focus: "ஞாயிற்றுக்கிழமை சூரிய வழிபாடு. சூரிய–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு ராசி அதிபதி அடையாளம்: சூரிய அதிகாரத்தின் நடுவே தத்துவ விரிவும் சாத்தியமான ஆன்மீக அல்லது தொழில்முறைத் திருப்புமுனையுமான காலம்.",
      },
      {
        expect: "பிற்கால பணி ஆண்டுகளில் வரும் சந்திர தசை, முதிர்ந்த ரேவதிக்கு உணர்வு ஊட்டத்தின் முழு ஆழத்தையும் இரக்கமுள்ள இருப்பையும் கொண்டுவருகிறது. புதனின் தொடக்கத்திலிருந்து வளர்ந்து வந்த இரக்கமுள்ள வழிகாட்டும் பணி இப்போது கிடைக்கும் மிக உணர்வுப்பூர்வ, பதிலளிக்கும் இடத்திலிருந்து செயல்படுகிறது. குடும்ப உறவுகள் ஆழமடைகின்றன; ரேவதி மூத்த பெற்றோர், தம் சொந்த மாற்றங்களைக் கடக்கும் வயது வந்த குழந்தைகளுக்கு உணர்வு அடித்தளம். ஆலோசனை, குணப்படுத்துதல் அல்லது கற்பித்தல் தொழில் தன் மிக உணர்வுபூர்வமாக எதிரொலிக்கும், பயனுள்ள வெளிப்பாட்டை அடைகிறது. சந்திர–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு முக்கியமான ராசி அதிபதி அடையாளம்.",
        navigate: "ரேவதிக்கு சந்திரனின் முதன்மைச் சவால் உணர்வு இணைவு அபாயம் — இரக்கம் முழுமையாகிவிட்டதால் தன்னுக்கும் பிறருக்கும் இடையிலான எல்லைகள் கரையத் தொடங்கும் ஆட்டிடையன். பூஷன் பாதை எங்கே செல்கிறது என்பதை அறிந்த இடத்திலிருந்து மந்தையை வழிநடத்துகிறார்; மந்தையிலிருந்து தனி நிலை இல்லாத வழிகாட்டியால் வழிகாட்ட முடியாது. சந்திர–குரு புக்தி ஒரு முக்கிய ராசி அதிபதி அடையாளம்: குரு தசைக்கு முந்தைய வரிசையில் மிக விரிந்த, தத்துவ ரீதியில் முக்கியமான குரு இருப்புகளில் ஒன்று.",
        focus: "திங்கட்கிழமை சந்திர வழிபாடும், இரக்கமுள்ள எல்லைகளை வேண்டுமென்றே வளர்ப்பதும் — பிறரின் துன்பத்துடன் முழுமையாக இருந்தும் அதில் உள்வாங்கப்படாமல் இருக்கும் ஆற்றல். சந்திர–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு முக்கிய ராசி அதிபதி அடையாளம்: சந்திர தசையின் மிகத் தத்துவ ரீதியில் விரிந்த, ஞானமுள்ள துணைக் காலமாக சந்திரனின் உணர்வுக் களத்தில் குரு வருகிறார்.",
      },
      {
        expect: "பிற்கால ஆண்டுகளில் வரும் செவ்வாய் தசை, ரேவதியின் இரக்கமுள்ள மூத்த ஆண்டுகளுக்கு திசைப்பட்ட ஆற்றலையும் உடல் உயிர்ச்சக்தியையும் கொண்டுவருகிறது. சந்திரனின் உணர்வு ஆழத்துக்குப் பிறகு செவ்வாய் புத்துணர்வூட்டுகிறது — வழிகாட்டலின் ஆரம்ப ஆண்டுகளில் இல்லாத நேரடித்தன்மையையும் உடல் ஈடுபாட்டையும் இன்னும் கொண்டிருக்கும் மூத்த வழிகாட்டி. பல ரேவதி நேயர்களுக்கு, செவ்வாய் தசை வியக்கத்தக்க தொழில்முறை உற்பத்தித்திறனின் காலத்தை உருவாக்குகிறது — செவ்வாயின் திசைப்பட்ட ஆற்றல் ஒரு வாழ்நாள் திரட்டிய ஞானத்துடன் இணைந்து தீர்க்கமான, பயனுள்ள வேலையைத் தருகிறது.",
        navigate: "ரேவதிக்கு செவ்வாயின் முதன்மைச் சவால் திசைப்பட்ட ஆற்றலுக்கும் உள்ளடக்கும் இரக்கத்துக்கும் இடையிலான சந்திப்பு — செவ்வாய் வழிநடத்த விரும்புகிறது, ரேவதியின் இரக்கம் எல்லோரையும் சேர்க்க விரும்புகிறது. செவ்வாயின் ஆற்றலை ஊட்டும் பணிக்குச் சேவை செய்ய பயன்படுத்தும் உற்சாக மூத்தவரே இலட்சியம்; வழிகாட்டுவதற்குப் பதிலாக கட்டளையிடும் மூத்தவர் நிழல். செவ்வாய்–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு ராசி அதிபதி துணைக் காலத்தைக் கொண்டுவருகிறது.",
        focus: "செவ்வாய்க்கிழமை செவ்வாய் சன்னதி வழிபாடு. செவ்வாய்–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு ராசி அதிபதி அடையாளம்: மூத்த வழிகாட்டியின் மிகச் செயலில் உள்ள காலத்தில், செவ்வாயின் உற்சாகக் களத்தில் குரு தத்துவ ரீதியில் விரிந்த, ஞானமுள்ள துணைக் காலமாக வருகிறார்.",
      },
      {
        expect: "முதிர்ந்த வயதுக்குள் நீளும் ராகு தசை, ரேவதியின் ஊட்டும், வழிகாட்டும் திறன்களை மிகப் பரந்த சாத்தியமான களத்துக்கு விரிவாக்குகிறது. புதனின் தொடக்கத்திலிருந்து வளர்ந்து வந்த உள்ளடக்கும் இரக்கம் இப்போது சமூகங்கள், நிறுவனங்கள், பரந்த உலகத்தின் அளவில் கிடைக்கிறது. சர்வதேசப் பணி, பண்பாடுகளுக்கிடையிலான சேவை, மனிதத் தேவையின் முழு வேறுபாட்டுடன் சந்திப்பு ராகுவின் நீண்ட காலத்தில் பொதுவானவை. முந்தைய தசைகள் வழியாகத் திரண்ட ஞானத்துடன் ராகு தசையைக் கடக்கும் ரேவதி மூத்தவர் குறிப்பிடத்தக்க உலகளாவிய இரக்கத்தின் உருவமாகிறார் — சாத்தியமான மிகப் பெரிய அளவில் பூஷனின் ஆட்டிடையன்.",
        navigate: "ரேவதிக்கு ராகுவின் முதன்மைச் சவால், தனிநபரால் வழங்க முடிந்ததற்கு அப்பால் ஊட்டும் உள்ளுணர்வு விரிவடைவது — எந்த ஒரு வழிகாட்டியாலும் கையாள முடியாத அளவு பெரிதான மந்தை கொண்ட ஆட்டிடையன். ரேவதியின் பதில், மற்ற ஆட்டிடையர்களைப் பயிற்றுவிப்பது — வழிகாட்டும் பணியையே கடத்துவது. ராகு–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு முக்கிய ராசி அதிபதி அடையாளம்: ரேவதி வாழ்வு வரிசையில் மிகக் குறிப்பிடத்தக்க குரு சந்திப்புகளில் ஒன்று.",
        focus: "சனிக்கிழமை ராகு சன்னதி வழிபாடும், வழிகாட்டும் பணியைப் பிறருக்கு வேண்டுமென்றே கடத்துவதும். ராகு–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு முக்கிய ராசி அதிபதி அடையாளம்: ராகுவின் விரிந்த களத்தில் குரு பெரிய தத்துவ, ஆன்மீக, ஞானம் ஆழமாக்கும் முக்கியத்துவம் கொண்ட சாளரமாக வருகிறார் — ராசி அதிபதியின் சொந்த தசைக்கு முந்தைய கடைசி முக்கிய குரு சந்திப்புகளில் ஒன்று.",
      },
      {
        expect: "மிக முதிர்ந்த வயதில் வரும் குரு தசை ரேவதிக்கு ராசி அதிபதியின் வருகை — உங்கள் ராசியான மீனத்தை ஆளும் கிரகம் இப்போது உங்கள் தசையை நிர்வகிக்கிறது. ஒரு வாழ்நாள் ஊட்டுவதற்கும், வழிகாட்டுவதற்கும், தேடியவர்கள் அனைவருக்கும் பூஷனின் உள்ளடக்கும் இரக்கத்தை வழங்குவதற்கும் செலவிட்ட ரேவதி நேயருக்கு, குரு தசை உச்சகட்ட அறுவடை — இரக்கமுள்ள சேவையின் முழு வாழ்வின் ஞானம், வயதும் உண்மையான ஆழமும் மட்டுமே தரக்கூடிய தத்துவ முழுமையுடன் ஒளிரும் காலம். குரு தசையில் ரேவதி மூத்தவரைச் சுற்றியுள்ளவர்கள் விவரிக்கக் கடினமான இருப்புத் தரத்தை அனுபவிக்கிறார்கள் — மந்தையை உண்மையாக வீடு சேர்த்த ஆட்டிடையனின் அரவணைப்பு, பயணம் எதற்காக என்ற விழிப்பில் இப்போது ஓய்வெடுக்கிறது. குரு தசை முடிவான தொடக்கம்: கடைசி நட்சத்திரமான ரேவதி முதல் நட்சத்திரத்துக்குத் திரும்புகிறது; எல்லையில் உள்ள ஆட்டிடையன் புதிய சுழற்சிக்கான வாயிலைத் திறப்பவரும் ஆகிறார்.",
        navigate: "ரேவதிக்கு ராசி அதிபதி தசையில் குருவின் முதன்மையான நிழல் முடிவின் தத்துவ ஒழுக்கம் — உண்மையான சேவையின் மூலம் சம்பாதித்த ஞானம் தொடர்ந்து நவீனதாக்குவதை விட வசதியான ஓய்விடமாக தன்னை சமர்ப்பிக்கத் தொடங்குகிறது. உடல் பராமரிப்பு மற்றும் உடலின் தேவைகளின் மென்மையான மேலாண்மை முதன்மையான நடைமுறை கவலைகள்.",
        focus: "வியாழக்கிழமை பிரஹஸ்பதி மற்றும் தட்சிணாமூர்த்தி வழிபாடு — அறியப்பட்டது மற்றும் அதற்கு அப்பால் உள்ளது ஆகியவற்றுக்கிடையே வரம்பில் அமர்ந்திருக்கும் பிரபஞ்ச ஆசிரியர். குரு தசை வாழ்க்கையின் ஊட்டும் ஞானத்தின் முழுமை; யாரும் வரம்பில் வந்தாலும், வைத்திருக்காமல் சுதந்திரமாக கொடுங்கள்.",
      },
    ],
    spirituality: [
      { title: "பூஷன் வழிபாடு & பாதுகாப்பான கடவு மரபுகள்",  desc: "பூஷன் — ஊட்டம், பாதுகாப்பான கடவு மற்றும் ஆன்மாக்களை ஆட்டிடைவிடுவதின் கடவுள் — ரேவதியின் தலைமை தெய்வம். தானியம் மற்றும் ஊட்டத்தின் காணிக்கைகள் (பூஷனின் புனித தளம்), பயணங்கள் மற்றும் மாற்றங்களுக்கு முன்பு பாதுகாப்பான கடவுக்கான வழிபாடுகள், மற்றும் பூஷன் சூக்தம் பாராயணம் ஆகியவை ரேவதியின் மிகவும் ஒத்தொலிக்கும் ஆன்மீக வெளிப்பாடுகள்." },
      { title: "குரு பக்தி & மீன ஞான மரபுகள்",              desc: "குரு — மீனத்தின் அதிபதி — ரேவதியின் ராசியை முழு வாழ்க்கை முழுவதும் நிர்வகிக்கிறது. வியாழக்கிழமை பிரஹஸ்பதி வழிபாடு, தட்சிணாமூர்த்தி பக்தி, மற்றும் வேதாந்த மற்றும் பக்தி ஞான மரபுகளுடன் நீடித்த ஈடுபாடு ஆகியவை ரேவதி வாழ்க்கையின் மிகவும் முக்கியமான ஆன்மீக கட்டமைப்புகள்." },
      { title: "சேவை பக்தியாக & முடிவு நடைமுறையாக",         desc: "ரேவதிக்கு, ஊட்டும் சேவையின் செயல் — தேவையில், மாற்றத்தில், அல்லது ஒரு வரம்பில் உள்ளவர்களுக்கு உண்மையில் இருப்பது — மிக உயர்ந்த வடிவ பக்தி நடைமுறை. தெய்வீகம் எல்லா உயிர்களிலும் இருக்கிறது என்ற வேதாந்த போதனை ரேவதிக்கு ஒரு சுருக்க தத்துவம் அல்ல ஆனால் வாழ்க்கை யதார்த்தம்." },
    ],
    guidance: "நீங்கள் கடைசி நட்சத்திரம் மற்றும் முதல் நட்சத்திரம் — ஒரு சுழற்சிக்கும் அடுத்ததற்கும் இடையே வரம்பில் ஆட்டிடையன், வாயிலை வைத்திருப்பவர். நீங்கள் வழங்கும் ஊட்டம் உங்களுடையது அல்ல; அது பூஷன் கவனிக்கும் தீர்வற்ற செழிப்பிலிருந்து உங்கள் மூலம் பாய்கிறது. உங்கள் கொடுப்பை நீங்கள் திரட்டுவதால் அல்ல ஆனால் நீங்கள் விநியோகிப்பதால் அளவிடுங்கள்; ஆட்டிடையனின் செல்வம் கொள்ளகத்தில் அல்ல ஆனால் கூட்டத்தின் ஆரோக்கியத்தில். நீங்கள் வழிகாட்டும் பாதுகாப்பான கடவு தன்னே புனித செயல்; நீங்கள் செய்ய வந்ததை செய்ய எந்த குறிப்பிட்ட இலக்கும் வர வேண்டியதில்லை. நீங்கள் மற்றொருவரை கடக்க உதவிய ஒவ்வொரு வரம்பும் ராசிச் சுழற்சியின் முடிவு; ஒவ்வொரு முடிவும் அடுத்த தொடக்கத்தை திறக்கிறது. செழிப்பில் ஓய்ந்திருங்கள், செழிப்பிலிருந்து கொடுங்கள், மற்றும் பூஷனின் ஊட்டம் தேவைப்படும் இடங்களுக்கு பாய்ய விடுங்கள்.",
    careerNote: "ஊட்டுவதற்கும், மாற்றங்களில் பாதுகாப்பாக வழிகாட்டுவதற்கும், யாரையும் கைவிடாத உள்ளடக்கிய இரக்கத்தை பராமரிப்பதற்கும் மையமான தொழில்முறை தேவைகளாக இருக்கும் இடங்களில் ரேவதி சிறப்பாக செயல்படுகிறது.",
    modernLead: "ரேவதியின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "வளர்க்கும் இருப்பு, பாதுகாப்பான கடவு வழிகாட்டுதல், உள்ளடக்கிய இரக்கம் ரேவதியின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function RevatiVisualPage() {
  return <NatchathiramVisualContent data={REVATHI} visual={REVATI_VISUAL} timings={dasaTimingsFor(REVATHI.number)} />;
}
