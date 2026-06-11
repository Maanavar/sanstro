import type { Metadata } from "next";
import { REVATHI } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

export const metadata: Metadata = {
  title: "Revati Nakshathiram — Visual Profile | Vinaadi",
  description: "Visual profile of Revati Nakshathiram: personality traits, career strengths, dasha timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/revati/visual" },
  openGraph: {
    title: "Revati Nakshathiram — Visual Profile",
    description: "Visual profile of Revati Nakshathiram: personality traits, career strengths, dasha timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/revati/visual",
    type: "article",
  },
};

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
    { symbol: "△", label: "Jupiter-Meena Wisdom",    score: 97, desc: "Meena is Jupiter's own rasi — and the philosophical expansiveness, compassion, and intuitive wisdom that Jupiter gives to Meena-born Revati is the rasi quality that suffuses the entire life. Jupiter's dasha arrives at ages 85-101 as the life's culminating philosophical harvest." },
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
      planet: "Mercury", period: "17 yrs", ageRange: "Age 0–17", theme: "Born to Communicate the Nourishment",
      detail: {
        expect: "Revati opens in Mercury dasha — a beginning of unusual communicative sensitivity, relational intelligence, and the capacity to perceive and articulate what others are experiencing. The Revati child in Mercury dasha has an early gift for language, for storytelling, and for the kind of communication that makes others feel seen and understood. School years (7-14) produce a student whose intelligence is characteristically inclusive — not the student who excels by outperforming others but the one who ensures that the learning is shared and that no one is left behind. The first significant artistic, communicative, or relational passion typically crystallises in Mercury's first decade. Mercury–Jupiter antardasha (~yr 14 of Mercury, ~ages 14-15) is a rasi lord sub-period flag: Jupiter is the lord of your rasi, Meena, and this first significant Jupiter antardasha in adolescence brings the rasi lord's philosophical grace and expansive wisdom as the first major encounter with the Jupiter quality.",
        navigate: "Mercury's primary challenge for Revati is the risk of dispersal — the person whose natural quality is to communicate what others need to hear, available to everyone, can find Mercury's breadth producing a certain lack of depth in the early communications. The Pushan guidance function requires knowing where one is going as well as being available to help others find their way. Mercury–Jupiter (~yr 14, ~ages 14-15) is a rasi lord flag: a first, luminous encounter with the Jupiter quality that will govern the life's final philosophical harvest.",
        focus: "Wednesday Mercury worship and the early cultivation of communication in service of depth — the relational intelligence grounded in genuine understanding rather than quick empathy. Mercury–Jupiter (~yr 14, ~ages 14-15) is a rasi lord antardasha flag: a philosophical opening, an encounter with a wise teacher, or the first serious engagement with the wisdom tradition that will accompany the Revati life.",
      },
    },
    {
      planet: "Ketu", period: "7 yrs", ageRange: "Age 17–24", theme: "The Inner Threshold",
      detail: {
        expect: "Ketu dasha from 17 to 24 brings the great inward turn — after Mercury's communicative opening, Ketu invites the young Revati to discover that the guidance function requires first a genuine internal navigation. University years and the first independent adult experiences run through Ketu's seven years; the separation from the family of origin, the first encounters with loss, and the discovery of the limits of what the communicative empathy alone can provide are the formative experiences of Ketu dasha. The Pushan function — guiding others through thresholds — requires that the guide know the threshold from the inside. Ketu provides that internal encounter.",
        navigate: "Ketu's primary challenge for Revati is the encounter with the limits of nourishment — the person whose nature is to provide Pushan's abundance discovering that not every situation can be nourished, not every transition can be smoothed, not every threshold can be guided through without loss. Ketu–Jupiter (~yr 5 of Ketu, ~ages 22-23) is a rasi lord sub-period flag: Jupiter arrives in Ketu's simplifying field as a philosophical, expansive, and possibly spiritually decisive sub-period.",
        focus: "Pitru tharpanam and ancestral rites. Ketu–Jupiter (~yr 5, ~ages 22-23) is a rasi lord antardasha flag: a philosophical opening, a potential encounter with the teacher or wisdom tradition that provides the framework for the life's spiritual path, or a decisive moment of inner clarity about the Revati vocation.",
      },
    },
    {
      planet: "Venus", period: "20 yrs", ageRange: "Age 24–44", theme: "The Nourishing Abundance",
      detail: {
        expect: "Venus dasha from 24 to 44 brings the full flowering of Revati's nourishing and guiding capacities in the professional and relational world. Career foundations are established; the unique combination of Revati's compassion, Mercury's articulativeness, and the depth earned in Ketu's threshold is now available in the world's fullness. Marriage and family formation typically occur in Venus–Jupiter antardasha (~yr 1 of Venus, ~ages 24-25) or Venus–Mercury (~yr 8, ~ages 32-33). Children arrive; the Revati parent's quality of presence — nourishing without smothering, guiding without controlling — is the distinctive contribution to the next generation. Professional recognition in the teaching, healing, or creative domain reaches its first peak. Venus–Jupiter antardasha (~yr 1 of Venus, ~ages 24-25) is a significant rasi lord sub-period flag.",
        navigate: "Venus's primary challenge for Revati is the temptation to provide too much — the nourishing person whose abundance instinct meets the world's real needs can begin to deplete the internal resource through over-giving. Pushan nourishes others because Pushan is itself nourished from an inexhaustible source; the Revati equivalent is the deliberate maintenance of the inner source through contemplative practice alongside the outer giving. Venus–Jupiter (~yr 1, ~ages 24-25) is a major rasi lord flag.",
        focus: "Friday Lakshmi worship and the deliberate cultivation of the inner source alongside the outer giving. Venus–Jupiter (~yr 1, ~ages 24-25) is a major rasi lord antardasha flag: Jupiter arrives at the very opening of Venus's long dasha — this is one of the most expansive and philosophically significant sub-periods in the early Venus dasha, often marking the beginning of the most important adult relationship or the crystallisation of the life's central vocation.",
      },
    },
    {
      planet: "Sun", period: "6 yrs", ageRange: "Age 44–50", theme: "The Solar Guide",
      detail: {
        expect: "Sun dasha from 44 to 50 brings the solar clarity and authority to Revati's compassionate and nourishing character. The guide who has been accompanying others through transitions now stands in the solar light of acknowledged authority — not the authority of power but the authority of trustworthiness, the kind of authority that comes from having genuinely seen people through the difficult passages. Leadership in the professional domain; widening recognition; the public expression of what the Revati wisdom has accumulated.",
        navigate: "Sun's primary challenge for Revati is the encounter between the solar demand for singularity and the Revati inclusive compassion that does not privilege any one over another. The shepherd who also stands in the solar spotlight must remember that the spotlight is in service of the flock, not the other way around. Sun–Jupiter (~yr 3 of Sun, ~ages 46-47) brings a rasi lord sub-period: Jupiter arrives in the solar authority field as a warm, expansive, and philosophically rich sub-period.",
        focus: "Sunday Surya worship. Sun–Jupiter (~yr 3, ~ages 46-47) is a rasi lord antardasha flag: a period of philosophical expansiveness and possible spiritual or professional breakthrough in the midst of Sun's solar authority.",
      },
    },
    {
      planet: "Moon", period: "10 yrs", ageRange: "Age 50–60", theme: "The Emotional Shepherd",
      detail: {
        expect: "Moon dasha from 50 to 60 brings the full depth of emotional nourishment and compassionate presence to Revati's mature expression. The compassionate guidance function that has been developing since Mercury's opening now operates from the most emotionally present and responsive place available. Family relationships deepen; the Revati elder parent is the emotional ground for adult children navigating their own transitions. Professional work in counselling, healing, or teaching reaches its most emotionally resonant and effective expression. Moon–Jupiter (~yr 7 of Moon, ~ages 56-58) is a significant rasi lord sub-period flag.",
        navigate: "Moon's primary challenge for Revati is the risk of emotional merger — the shepherd whose compassion is so complete that the boundaries between self and other begin to dissolve. Pushan guides the flock from a position of knowing where the path goes; the guide who has no separate position from the flock cannot guide. Moon–Jupiter (~yr 7, ~ages 56-58) is a major rasi lord flag: one of the most expansive and philosophically significant Jupiter presences in the pre-Jupiter-dasha sequence.",
        focus: "Monday Moon worship and the deliberate cultivation of compassionate boundaries — the capacity to be fully present with others' suffering without being absorbed into it. Moon–Jupiter (~yr 7, ~ages 56-58) is a major rasi lord antardasha flag: Jupiter arrives in Moon's emotional field as the most philosophically expansive and wise sub-period of the Moon dasha.",
      },
    },
    {
      planet: "Mars", period: "7 yrs", ageRange: "Age 60–67", theme: "The Vigorous Elder",
      detail: {
        expect: "Mars dasha from 60 to 67 brings directed energy and physical vitality to Revati's compassionate elder years. After Moon's emotional depth, Mars is invigorating — the elder guide who still has the directness and physical engagement that the early years of guidance lacked. For many Revati, Mars dasha produces a period of surprising professional productivity — the directed energy of Mars joined to the accumulated wisdom of six decades produces decisive, effective work.",
        navigate: "Mars's primary challenge for Revati is the encounter between the directed energy and the inclusive compassion — Mars wants to direct, and the Revati compassion wants to include everyone. The vigorous elder who uses Mars's energy in service of the nourishing function is the ideal; the elder who becomes directive rather than guiding is the shadow. Mars–Jupiter (~yr 3 of Mars, ~ages 62-63) brings a rasi lord sub-period.",
        focus: "Tuesday Mars shrine prayers. Mars–Jupiter (~yr 3, ~ages 62-63) is a rasi lord antardasha flag: Jupiter arrives in Mars's vigorous field as a philosophically expansive and wise sub-period in the elder guide's most active period.",
      },
    },
    {
      planet: "Rahu", period: "18 yrs", ageRange: "Age 67–85", theme: "The Wide Shepherd",
      detail: {
        expect: "Rahu dasha from 67 to 85 brings the great expansion of Revati's nourishing and guiding capacities to the widest possible field. The inclusive compassion that has been developing since Mercury's opening is now available at the scale of communities, institutions, and the wider world. International work, cross-cultural service, and the encounter with the full diversity of human need are common in Rahu's eighteen years. The Revati elder who navigates Rahu dasha with the wisdom accumulated through the previous six dashas becomes a figure of remarkable universal compassion — Pushan's shepherd at the largest possible scale.",
        navigate: "Rahu's primary challenge for Revati is the expansion of the nourishing instinct beyond the capacity of the individual to provide — the shepherd whose flock has become too large for any individual guide. The Revati response is to train other shepherds — to transmit the guidance function itself. Rahu–Jupiter (~yr 3 of Rahu, ~ages 70-71) is a major rasi lord sub-period flag: one of the most significant Jupiter encounters in the Revati life sequence.",
        focus: "Saturday Rahu shrine prayers and the deliberate transmission of the guidance function to others. Rahu–Jupiter (~yr 3, ~ages 70-71) is a major rasi lord antardasha flag: Jupiter arrives in Rahu's expansive field as a 11-month window of major philosophical, spiritual, and wisdom-deepening significance — one of the final major Jupiter encounters before the rasi lord's own dasha.",
      },
    },
    {
      planet: "Jupiter", period: "16 yrs", ageRange: "Age 85–101", theme: "Rasi Lord — The Philosopher-Shepherd's Harvest",
      detail: {
        expect: "Jupiter dasha from 85 to 101 is the rasi lord's arrival for Revati — the planet that rules your rasi, Meena, now governs your dasha. For the Revati native who has spent eight decades nourishing, guiding, and providing Pushan's inclusive compassion to all who sought them, Jupiter dasha is the culminating harvest — the period in which the wisdom of a full life of compassionate service radiates with the philosophical completeness that only age and genuine depth can produce. Those around the Revati elder in Jupiter dasha experience a quality of presence that is difficult to describe — the warmth of the shepherd who has genuinely seen the flock home, now resting in the awareness of what the journey was for. Jupiter dasha is the ending that is also a beginning: Revati, the last nakshathiram, circles back to the first; the shepherd at the boundary is also the one who opens the gate for the new cycle.",
        navigate: "Jupiter's primary shadow in the rasi lord dasha for Revati is the philosophical sentimentality of the completion — the wisdom that has been earned through genuine service beginning to present itself as a comfortable resting place rather than the continuing orientation toward what is real and what is needed. Pushan nourishes at every threshold, including the final one; the Revati elder in Jupiter dasha is called to remain available to what is present rather than dwelling in what has been. Physical care and the gentle management of the body's needs are the primary practical concerns.",
        focus: "Thursday Brihaspati and Dakshinamurthy worship — the cosmic teacher who transmits by presence, who sits at the boundary between what is known and what is beyond. Jupiter dasha is the fullness of the life's nourishing wisdom; give it freely, without holding, to whoever comes to the threshold. The shepherd's work is never finished — even in Jupiter dasha, at the end of the zodiac, there is always someone who needs the safe passage that only Pushan's guide can provide.",
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
      desc: "Jupiter — the lord of Meena — governs Revati's rasi throughout the entire life. Thursday Brihaspati worship, Dakshinamurthy devotion, and the sustained engagement with the Vedantic and bhakti wisdom traditions are the most important spiritual structures for the Revati life. Every Jupiter antardasha in the dasha sequence is a significant spiritual event; the arrival of Jupiter's own dasha at 85-101 is the life's spiritual culmination.",
    },
    {
      title: "Service as Devotion & Completion Practice",
      desc: "For Revati, the act of nourishing service — of being genuinely present for those who are in need, in transition, or at a threshold — is the highest form of devotional practice. The Vedantic teaching that the divine is present in all beings is, for Revati, not an abstract philosophy but a lived reality: every person who comes to the threshold is Pushan's flock, and the service to them is the worship of Pushan.",
    },
  ],

  guidance: "You are the last star and the first — the shepherd at the boundary who holds the gate between one cycle and the next. The nourishment you provide is not yours; it flows through you from the inexhaustible abundance that Pushan tends. Do not measure your giving by what you accumulate but by what you distribute; the shepherd's wealth is not in the storehouse but in the health of the flock. The safe passage you guide is itself the sacred act; you do not need to arrive at any particular destination to have done what you came to do. Every threshold you have helped another cross is a completion of the zodiacal cycle; every completion opens the next beginning. Rest in the abundance, give from the abundance, and let Pushan's nourishment flow where it is needed.",

  compatibleEn: ["Ashwini", "Uttara Bhadra", "Rohini", "Purva Bhadra", "Pushya"],
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
      "ஊட்டத்தை தொடர்பு கொள்ள பிறந்தவர் — புதன் ஆரம்பம், குரு கொடியாளி (~14 வயது)",
      "உள் வரம்பு — கேது தீவிரமான வளர்ச்சி, குரு கொடியாளி (~22-23 வயது)",
      "ஊட்டும் செழிப்பு — சுக்கிர மலர்ச்சி, குரு கொடியாளி (~24-25 வயது)",
      "சூரிய வழிகாட்டி — சூரியன் வளர்ந்த அதிகாரம், குரு கொடியாளி (~46-47 வயது)",
      "உணர்வு ஆட்டிடையன் — சந்திர இரக்கம், குரு கொடியாளி (~56-58 வயது)",
      "உற்சாக மூத்தவர் — செவ்வாய் உயிர்சக்தி, குரு கொடியாளி (~62-63 வயது)",
      "பரந்த ஆட்டிடையன் — ராகு மிகவும் பரந்த இரக்கம், குரு கொடியாளி (~70-71 வயது)",
      "ராசி அதிபதி — தத்துவஞானி-ஆட்டிடையனின் அறுவடை — குரு தசை மீன ராசிக்கு",
    ],
    dashaDetails: [
      {
        expect: "ரேவதி புதன் தசையில் திறக்கிறது — அசாதாரண தொடர்பு உணர்திறன், உறவு நுண்ணறிவு மற்றும் மற்றவர்கள் அனுபவிப்பதை கண்காணிக்கும் மற்றும் வெளிப்படுத்தும் திறன் ஆகியவற்றின் தொடக்கம். புதன்–குரு (~yr 14, ~14-15 வயது): முதல் குறிப்பிடத்தக்க குரு அந்தர்தசை — ராசி அதிபதி கொடியாளி.",
        navigate: "ரேவதிக்கு புதனின் முதன்மையான சவால் சிதறல் அபாயம். புதன்–குரு (~yr 14, ~14-15 வயது): குரு குணத்துடன் ஒரு முதல், ஒளிமிக்க சந்திப்பு — ராசி அதிபதி கொடியாளி.",
        focus: "புதன்கிழமை புதன் வழிபாடு. புதன்–குரு (~yr 14, ~14-15 வயது): ஒரு தத்துவ திறப்பு, ஞானமிக்க ஆசிரியருடன் சந்திப்பு, அல்லது ரேவதி வாழ்க்கையை சேர்க்கும் ஞான மரபுடன் முதல் தீவிரமான ஈடுபாடு.",
      },
      {
        expect: "கேது தசை 17 முதல் 24 வரை மாபெரும் உள்நோக்கிய திரும்பலை கொண்டு வருகிறது. கேது–குரு (~yr 5, ~22-23 வயது): ராசி அதிபதி கொடியாளி — ஒரு தத்துவ திறப்பு, ஆசிரியர் அல்லது ஞான மரபுடன் சாத்தியமான சந்திப்பு.",
        navigate: "ரேவதிக்கு கேதுவின் முதன்மையான சவால் ஊட்டத்தின் வரம்புகளுடன் சந்திப்பு. கேது–குரு (~yr 5, ~22-23 வயது): ராசி அதிபதி கொடியாளி.",
        focus: "பித்ரு தர்ப்பணம். கேது–குரு (~yr 5, ~22-23 வயது): ராசி அதிபதி அந்தர்தசை கொடியாளி.",
      },
      {
        expect: "சுக்கிர தசை 24 முதல் 44 வரை தொழில்முறை மற்றும் உறவு உலகில் ரேவதியின் ஊட்டும் மற்றும் வழிகாட்டும் திறன்களின் முழு மலர்ச்சியை கொண்டு வருகிறது. சுக்கிர–குரு (~yr 1, ~24-25 வயது): முக்கிய ராசி அதிபதி கொடியாளி — சுக்கிர தசையின் மிகவும் முக்கியமான ஆரம்பகால அந்தர்தசை.",
        navigate: "ரேவதிக்கு சுக்கிரனின் முதன்மையான சோதனை அதிகமாக கொடுக்கும் சோதனை. சுக்கிர–குரு (~yr 1, ~24-25 வயது): முக்கிய ராசி அதிபதி கொடியாளி.",
        focus: "வெள்ளிக்கிழமை லட்சுமி வழிபாடு. வெளி கொடுப்புடன் உள் ஆதாரத்தை வேண்டுமென்து வளர்க்கவும். சுக்கிர–குரு (~yr 1, ~24-25 வயது): முக்கிய ராசி அதிபதி அந்தர்தசை கொடியாளி.",
      },
      {
        expect: "சூரியன் தசை 44 முதல் 50 வரை ரேவதியின் இரக்கமான மற்றும் ஊட்டும் குணத்திற்கு சூரிய தெளிவு மற்றும் அதிகாரம் கொண்டு வருகிறது. சூரியன்–குரு (~yr 3, ~46-47 வயது): ஒரு வெப்பமான, விரிவான, தத்துவ ரீதியில் வளமான அந்தர்தசை.",
        navigate: "ரேவதிக்கு சூரியனின் முதன்மையான சவால் சூரியனின் ஒற்றுமை கோரிக்கை மற்றும் ரேவதி உள்ளடக்கிய இரக்கம் ஆகியவற்றுக்கிடையே சந்திப்பு. சூரியன்–குரு (~yr 3, ~46-47 வயது): ராசி அதிபதி கொடியாளி.",
        focus: "ஞாயிற்றுக்கிழமை சூரிய வழிபாடு. சூரியன்–குரு: ராசி அதிபதி கொடியாளி — சூரிய அதிகாரத்தின் நடுவில் தத்துவ விரிவாக்கம்.",
      },
      {
        expect: "சந்திர தசை 50 முதல் 60 வரை முழுமையான உணர்வு ஊட்டம் மற்றும் இரக்கமான இருப்பை ரேவதியின் முதிர் வெளிப்பாட்டிற்கு கொண்டு வருகிறது. சந்திர–குரு (~yr 7, ~56-58 வயது): குரு–தசைக்கு முந்தைய வரிசையில் மிகவும் விரிவான மற்றும் தத்துவ ரீதியில் குறிப்பிடத்தக்க குரு இருப்புகளில் ஒன்று — முக்கிய ராசி அதிபதி கொடியாளி.",
        navigate: "ரேவதிக்கு சந்திரனின் முதன்மையான சவால் உணர்வு இணைவு அபாயம். சந்திர–குரு (~yr 7, ~56-58 வயது): முக்கிய ராசி அதிபதி கொடியாளி.",
        focus: "திங்கட்கிழமை சந்திர வழிபாடு. சந்திர–குரு (~yr 7, ~56-58 வயது): முக்கிய ராசி அதிபதி அந்தர்தசை கொடியாளி.",
      },
      {
        expect: "செவ்வாய் தசை 60 முதல் 67 வரை ரேவதியின் இரக்கமான மூத்த வருடங்களுக்கு திசைப்பட்ட ஆற்றல் மற்றும் உடல் உயிர்சக்தியை கொண்டு வருகிறது. செவ்வாய்–குரு (~yr 3, ~62-63 வயது): ராசி அதிபதி கொடியாளி.",
        navigate: "ரேவதிக்கு செவ்வாயின் முதன்மையான சவால் திசைப்பட்ட ஆற்றல் மற்றும் உள்ளடக்கிய இரக்கம் ஆகியவற்றுக்கிடையே சந்திப்பு. செவ்வாய்–குரு (~yr 3, ~62-63 வயது): ராசி அதிபதி கொடியாளி.",
        focus: "செவ்வாய்க்கிழமை செவ்வாய் சன்னதி வழிபாடு. செவ்வாய்–குரு: ராசி அதிபதி கொடியாளி சாளரம்.",
      },
      {
        expect: "ராகு தசை 67 முதல் 85 வரை ரேவதியின் ஊட்டும் மற்றும் வழிகாட்டும் திறன்களை மிகவும் பரந்த சாத்தியமான தளத்திற்கு விரிவாக்குகிறது. ராகு–குரு (~yr 3, ~70-71 வயது): முக்கிய ராசி அதிபதி கொடியாளி — குரு–தசைக்கு முந்தைய வரிசையில் மிகவும் குறிப்பிடத்தக்க குரு சந்திப்புகளில் ஒன்று.",
        navigate: "ரேவதிக்கு ராகுவின் முதன்மையான சவால் தனிநபரால் வழங்க முடிந்ததற்கு அப்பால் ஊட்டும் உள்ளுணர்வின் விரிவாக்கம். ராகு–குரு (~yr 3, ~70-71 வயது): முக்கிய ராசி அதிபதி கொடியாளி.",
        focus: "சனிக்கிழமை ராகு சன்னதி வழிபாடு. ராகு–குரு (~yr 3, ~70-71 வயது): முக்கிய ராசி அதிபதி அந்தர்தசை கொடியாளி — குரு–தசைக்கு முந்தைய இறுதி முக்கிய குரு சந்திப்புகளில் ஒன்று.",
      },
      {
        expect: "குரு தசை 85 முதல் 101 வரை ரேவதிக்கு ராசி அதிபதியின் வருகை — உங்கள் ராசியான மீனத்தை ஆளும் கிரகம் இப்போது உங்கள் தசையை நிர்வகிக்கிறது. எட்டு தசகங்கள் ஊட்டுவதற்கும், வழிகாட்டுவதற்கும், பூஷனின் உள்ளடக்கிய இரக்கத்தை தேடியவர்களுக்கு எல்லாம் வழங்குவதற்கும் செலவிட்ட ரேவதி நேயருக்கு, குரு தசை உச்சகட்ட அறுவடை — இரக்கமான சேவையின் முழு வாழ்க்கையின் ஞானம் மிகவும் பூரணமான தத்துவ முழுமையுடன் வெளிவிடும் காலம். ரேவதி, கடைசி நட்சத்திரம், முதல் நட்சத்திரத்திற்கு திரும்புகிறது; வரம்பில் ஆட்டிடையன் புதிய சுழற்சிக்கான வாயிலை திறக்கும் ஒருவர் ஆகிறார்.",
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
  return <NatchathiramVisualContent data={REVATHI} visual={REVATI_VISUAL} />;
}
