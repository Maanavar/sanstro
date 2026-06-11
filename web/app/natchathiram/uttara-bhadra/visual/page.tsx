import type { Metadata } from "next";
import { UTTIRATATHI } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

export const metadata: Metadata = {
  title: "Uttara Bhadra Nakshathiram — Visual Profile | Vinaadi",
  description: "Visual profile of Uttara Bhadra Nakshathiram: personality traits, career strengths, dasha timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/uttara-bhadra/visual" },
  openGraph: {
    title: "Uttara Bhadra Nakshathiram — Visual Profile",
    description: "Visual profile of Uttara Bhadra Nakshathiram: personality traits, career strengths, dasha timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/uttara-bhadra/visual",
    type: "article",
  },
};

const UTTARA_BHADRA_VISUAL: NatchathiramVisualData = {
  atAGlance: [
    { label: "Contemplative Depth",    score: 98 },
    { label: "Serpent Wisdom",         score: 97 },
    { label: "Patient Groundedness",   score: 96 },
    { label: "Meena Jupiter Grace",    score: 97 },
    { label: "Cosmic Stability",       score: 95 },
  ],

  radar: {
    labels: ["Contemplation", "Wisdom", "Patience", "Grace", "Stability", "Compassion"],
    values: [98, 97, 96, 97, 95, 96],
  },

  coreStrengths: [
    { symbol: "◎", label: "Contemplative Depth",    score: 98, desc: "Ahir Budhnya — the serpent of the depths, the dragon of the cosmic waters' foundation — gives Uttara Bhadra the capacity to inhabit the deepest levels of contemplation, to remain with what is difficult to understand until understanding arrives." },
    { symbol: "◈", label: "Serpent Wisdom",         score: 97, desc: "The wisdom of the depths: not the quick wisdom of the surface but the slow, complete, irreversible wisdom that comes from having genuinely stayed with the hard questions long enough for them to yield their answers." },
    { symbol: "⚡", label: "Patient Groundedness",   score: 96, desc: "Saturn's rasi (Meena is Jupiter's rasi, but Uttara Bhadra opens in Saturn dasha) joined to Jupiter's grace — the combination of Saturn's structural patience and Jupiter's philosophical expansiveness produces a groundedness that neither impatience nor superficiality can penetrate." },
    { symbol: "♥", label: "Meena Jupiter Grace",    score: 97, desc: "Meena is Jupiter's own rasi — and the grace, compassion, and philosophical abundance that Jupiter gives to Meena-born Uttara Bhadra is unusually available, even though the Jupiter dasha itself lies beyond the typical life span. Jupiter's influence is felt through antardasha presences and through the rasi quality that suffuses the entire life." },
    { symbol: "△", label: "Cosmic Stability",       score: 95, desc: "Ahir Budhnya is the serpent that holds up the cosmos from below — and this giving of foundation, this being the stable ground from which others can build, is Uttara Bhadra's distinctive contribution to every group and relationship they inhabit." },
    { symbol: "☽", label: "Deep Compassion",        score: 96, desc: "Meena's empathy joined to the contemplative depth of Ahir Budhnya's domain — Uttara Bhadra's compassion is not the sentimental response to surface suffering but the deep recognition of what suffering actually is and what it actually requires." },
  ],

  careerAbilities: [
    { label: "Spiritual Practice & Meditation",  score: 98 },
    { label: "Depth Scholarship & Research",     score: 97 },
    { label: "Counselling & Deep Compassion",    score: 96 },
    { label: "Philosophy & Wisdom Teaching",     score: 97 },
    { label: "Water Sciences & Marine Biology",  score: 94 },
  ],
  careerNote: "Uttara Bhadra excels wherever depth — the willingness to stay with what is difficult or obscure until genuine understanding arrives — is the central requirement. They are the scholars, meditators, counsellors, and wisdom teachers who provide the stable, patient ground from which others can build.",

  careerClusters: [
    { symbol: "◎", title: "Spiritual Practice & Contemplative Leadership", desc: "Deep meditation practice, contemplative community leadership, the sustained cultivation and teaching of the inner life — Ahir Budhnya's domain of the depths applied to the spiritual vocation." },
    { symbol: "◈", title: "Depth Scholarship & Academic Research",        desc: "Academic research requiring extended contemplation, the investigation of deep questions, textual scholarship — the serpent-depth wisdom expressed as sustained scholarly engagement." },
    { symbol: "⚡", title: "Counselling, Therapy & Deep Listening",        desc: "Counselling and therapy requiring deep compassion and extended patience — the capacity to remain with what is difficult in another person until the understanding that serves them arrives." },
    { symbol: "♥", title: "Philosophy & Wisdom Teaching",                  desc: "The teaching of philosophical and contemplative traditions — the patient transmission of what the depths have revealed, without simplification or urgency." },
    { symbol: "△", title: "Social Work & Compassionate Service",           desc: "Social work, poverty alleviation, service to those in the deepest need — Uttara Bhadra's cosmic stability expressed as the willingness to serve from the ground up." },
    { symbol: "☽", title: "Water, Marine & Environmental Sciences",       desc: "Oceanography, hydrology, marine biology — Ahir Budhnya's domain of the cosmic waters translated into professional science." },
  ],

  modernApps: [
    { symbol: "◎", title: "Contemplative Practice Technology",         desc: "Meditation platforms, contemplative practice technology, deep inner life cultivation applications." },
    { symbol: "◈", title: "Depth Research & Academic Technology",      desc: "Deep research platforms, long-term academic investigation tools, contemplative scholarship technology." },
    { symbol: "⚡", title: "Counselling & Compassionate Care Technology", desc: "Deep counselling platforms, compassionate care technology, extended-patience therapy applications." },
    { symbol: "♥", title: "Wisdom Teaching Technology",                desc: "Contemplative tradition teaching platforms, philosophical wisdom transmission technology, depth teaching applications." },
    { symbol: "△", title: "Social Service & Compassion Technology",    desc: "Social work platforms, poverty alleviation technology, ground-up compassionate service applications." },
    { symbol: "☽", title: "Marine & Environmental Science Technology", desc: "Oceanographic research platforms, marine biology technology, Ahir Budhnya's domain in digital science." },
  ],

  dashaTimeline: [
    {
      planet: "Saturn", period: "19 yrs", ageRange: "Age 0–19", theme: "Born into the Deep Patience",
      detail: {
        expect: "Uttara Bhadra opens in Saturn dasha — a beginning of unusual depth, patience, and the quality of having already been through much before the life has formally begun. The Uttara Bhadra child in Saturn dasha has a gravitas that strikes caregivers early: the seriousness, the depth of attention, the capacity for sustained contemplation that are not typical of very young children. Saturn's nineteen years cover infancy, childhood, and early adolescence — the entire formative period is structured by Saturn's long-game governance. The educational path is typically marked by the depth of engagement rather than the breadth — the Uttara Bhadra student who studies one thing until it is fully understood, rather than moving quickly across many things. Saturn–Jupiter antardasha (~yr 13 of Saturn, ~ages 13-14) is a critical rasi lord sub-period flag: Jupiter is the lord of your rasi, Meena, and this 11-month sub-period in early adolescence brings the rasi lord's philosophical abundance, grace, and expansive wisdom as the first significant encounter with the Jupiter quality that governs the entire life.",
        navigate: "Saturn's primary challenge for the young Uttara Bhadra is the weight of the deep patience in the social environment of childhood — the contemplative child who is not quick, not light, not easily animated by the social entertainments of their peers, can find the early social environment genuinely difficult. The depth is real and valuable; the challenge is to provide the young Uttara Bhadra with relationships and environments that honour the depth rather than demanding the performance of lightness. Saturn–Jupiter (~yr 13, ~ages 13-14) is a major rasi lord antardasha flag: this is the first, brief, formative encounter with the Jupiter quality that defines the Uttara Bhadra nature.",
        focus: "Saturday Saturn worship and the early cultivation of contemplative practices — simple meditation, deep reading, the practices that allow the Uttara Bhadra depth to find its appropriate expression from the earliest years. Saturn–Jupiter (~yr 13, ~ages 13-14) is a major rasi lord flag: provide the adolescent Uttara Bhadra with genuine philosophical and spiritual education in this sub-period, and the encounter with the teacher or tradition that will be most formative for the life's wisdom path often occurs here.",
      },
    },
    {
      planet: "Mercury", period: "17 yrs", ageRange: "Age 19–36", theme: "The Depth Finds Its Voice",
      detail: {
        expect: "Mercury dasha from 19 to 36 brings the capacity for articulation to Uttara Bhadra's depth. The contemplative intelligence that has been developing through Saturn's nineteen years now finds in Mercury the ability to express, to articulate, to communicate what has been understood from the depths. University education and the first professional steps are taken in Mercury's field; the academic or philosophical career begins to take shape. The depth of engagement that Uttara Bhadra brings to any intellectual domain they inhabit produces, in Mercury dasha, the work that begins to distinguish them within their chosen field. Mercury–Jupiter antardasha (~yr 14 of Mercury, ~ages 33-34) is a significant rasi lord sub-period flag: Jupiter arrives in Mercury's articulative field as the most expansive and philosophically rich sub-period of the Mercury dasha.",
        navigate: "Mercury's primary challenge for Uttara Bhadra is the pace difference between the contemplative depth and Mercury's quick analytical movement — the deep thinker finding Mercury's speed genuinely challenging to inhabit while maintaining the quality of contemplation that gives the thought its depth. Mercury–Jupiter (~yr 14, ~ages 33-34) is a rasi lord antardasha flag: Jupiter's arrival in Mercury's field as a significant philosophical expansion and possible wisdom breakthrough.",
        focus: "Wednesday Mercury worship and the deliberate cultivation of articulation at the pace that maintains depth — not quick formulation but careful, considered expression. Mercury–Jupiter (~yr 14, ~ages 33-34) is a major rasi lord flag: a period of philosophical expansion, possible encounter with the teacher or tradition that deepens the life's wisdom path, or a significant writing or teaching breakthrough.",
      },
    },
    {
      planet: "Ketu", period: "7 yrs", ageRange: "Age 36–43", theme: "The Inward Return",
      detail: {
        expect: "Ketu dasha from 36 to 43 brings the great inward return — after Saturn's deep patience and Mercury's articulative engagement, Ketu strips the accumulated constructions and invites the return to the source. For Uttara Bhadra, whose nature is already contemplative and depth-oriented, Ketu's inward movement is not a radical disruption but a deepening: the contemplative returns to the contemplative, the depth to the depths. For many Uttara Bhadra, Ketu dasha is a period of significant spiritual practice deepening — a retreat, a period of dedicated practice, or the decisive encounter with the teacher or tradition that provides the framework for the life's remaining decades. Ketu–Jupiter antardasha (~yr 5 of Ketu, ~ages 41-42) is a significant rasi lord sub-period flag.",
        navigate: "Ketu's primary challenge for Uttara Bhadra is the risk of withdrawal beyond what serves — the contemplative person who uses Ketu's inward pull to avoid the engagement that the wisdom requires. Ahir Budhnya holds the cosmos from below; the depth is in service of what is above, not a retreat from it. Ketu–Jupiter (~yr 5, ~ages 41-42) is a rasi lord flag: the most significant sub-period of Ketu dasha for Uttara Bhadra.",
        focus: "Pitru tharpanam and ancestral rites. Ketu–Jupiter (~yr 5, ~ages 41-42) is a major rasi lord antardasha flag: Jupiter arrives in Ketu's simplifying field as a luminous, expansive, philosophically rich sub-period — one of the most significant encounters with the rasi lord's quality in the pre-Jupiter-dasha sequence. This is often the period of the major spiritual deepening or the decisive encounter with the life's wisdom tradition.",
      },
    },
    {
      planet: "Venus", period: "20 yrs", ageRange: "Age 43–63", theme: "The Beautiful Deepening",
      detail: {
        expect: "Venus dasha from 43 to 63 brings beauty, abundance, and relational warmth to Uttara Bhadra's otherwise contemplative and depth-oriented life. The wisdom that has been accumulating since Saturn's opening now meets the world's beauty in a way that the deep person can genuinely receive and share. Professional recognition reaches its widest scope; teaching and transmission of the Uttara Bhadra wisdom becomes the primary professional expression; grandchildren may arrive for those who have married. Venus–Jupiter antardasha (~yr 1 of Venus, ~ages 43-44) is a significant rasi lord sub-period flag: Jupiter arrives very early in Venus's long dasha as a luminous, expansive philosophical opening to the entire twenty-year period.",
        navigate: "Venus's primary challenge for Uttara Bhadra is the temptation to dilute the depth in service of the beautiful — the contemplative whose wisdom is packaged for wider consumption at the cost of the depth that made it valuable. The beauty that Venus offers is the beauty of the depths made accessible, not the beauty of the surface substituting for the depths. Venus–Jupiter (~yr 1, ~ages 43-44) is a major rasi lord flag.",
        focus: "Friday Lakshmi worship and the deliberate cultivation of the beauty of depth — the aesthetic that honours the contemplative rather than simplifying it. Venus–Jupiter (~yr 1, ~ages 43-44) is a major rasi lord antardasha flag: Jupiter arrives at the very opening of Venus's dasha, setting the tone for the entire twenty years — this is one of the most significant Jupiter encounters in the Uttara Bhadra dasha sequence.",
      },
    },
    {
      planet: "Sun", period: "6 yrs", ageRange: "Age 63–69", theme: "The Solar Elder",
      detail: {
        expect: "Sun dasha from 63 to 69 brings the solar clarity of authority to Uttara Bhadra's depth wisdom. The contemplative who has inhabited the depths across six decades now stands in the solar light — not with the solar fire's urgency but with the settled authority of one who has seen to the bottom and come back. Teaching and transmission reach their most authoritative expression; the elder's presence itself is the teaching.",
        navigate: "Sun's primary challenge for Uttara Bhadra is the encounter between the solar demand for visibility and the contemplative's preference for the depths. Sun–Jupiter (~yr 3 of Sun, ~ages 65-66) brings a brief but notable rasi lord presence — Jupiter arrives as a warm, expansive sub-period in the solar authority field.",
        focus: "Sunday Surya worship and the deliberate offering of the depth wisdom in accessible, luminous form. Sun–Jupiter (~yr 3, ~ages 65-66) is a rasi lord sub-period flag: the rasi lord's philosophical grace and expansive warmth in the midst of Sun's solar authority.",
      },
    },
    {
      planet: "Moon", period: "10 yrs", ageRange: "Age 69–79", theme: "The Emotional Ocean",
      detail: {
        expect: "Moon dasha from 69 to 79 brings the emotional ocean to Uttara Bhadra's depth wisdom. The contemplative who has inhabited the deeper-than-emotional dimension of experience now descends into the feeling dimension — the emotional depth that Meena naturally carries, and that the Uttara Bhadra character has perhaps held below the surface through the earlier decades of committed depth work. Family relationships, the bonds of decades, and the emotional richness of a life deeply lived are the primary gifts of Moon's ten years. Moon–Jupiter (~yr 7 of Moon, ~ages 75-77) brings a significant rasi lord sub-period — one of the most expansive Jupiter presences in the Uttara Bhadra sequence.",
        navigate: "Moon's primary challenge for Uttara Bhadra is the encounter with emotional vulnerability — the person whose depth has been primarily in the contemplative domain discovering the ocean of feeling as a distinct and sometimes overwhelming dimension. Moon–Jupiter (~yr 7, ~ages 75-77) is a major rasi lord flag: Jupiter arrives in Moon's emotional field as a warm, philosophically expansive, and possibly the most profound Jupiter encounter in the pre-Jupiter-dasha sequence.",
        focus: "Monday Moon worship and the deliberate cultivation of emotional presence — feeling the depth of relationship and love that the contemplative life has been serving. Moon–Jupiter (~yr 7, ~ages 75-77) is a major rasi lord antardasha flag: one of the most significant Jupiter presences in the Uttara Bhadra dasha sequence before the rasi lord's own dasha.",
      },
    },
    {
      planet: "Mars", period: "7 yrs", ageRange: "Age 79–86", theme: "The Final Fire",
      detail: {
        expect: "Mars dasha from 79 to 86 brings the directed fire and vital energy of Mars to the Uttara Bhadra elder. After Moon's emotional ocean, Mars is a sudden, vitalising presence — the body's energy and the will's directedness in an unexpected late-life appearance. Mars–Jupiter (~yr 3 of Mars, ~ages 81-82) brings a rasi lord sub-period: a brief but luminous encounter with the Jupiter quality in Mars's vital field.",
        navigate: "Complete and gentle physical care. Mars's vitality at this age requires careful management — the fire is real, but the body requires deliberate protection. Mars–Jupiter (~yr 3, ~ages 81-82): rasi lord sub-period flag.",
        focus: "Tuesday Mars shrine prayers. Mars–Jupiter (~yr 3, ~ages 81-82) is a rasi lord sub-period flag: a brief, expansive, philosophically warm sub-period in the elder's final vital period.",
      },
    },
    {
      planet: "Rahu", period: "18 yrs", ageRange: "Age 86–104", theme: "The Final Expansion",
      detail: {
        expect: "Rahu dasha from 86 to 104 brings the great expansion and dissolution of identity to Uttara Bhadra's elder years. The contemplative depth and the cosmic stability that have defined this person across nine decades now meet Rahu's insistent expansion — the recognition that what has been the individual form of wisdom is part of a much larger field. Rahu–Jupiter (~yr 3 of Rahu, ~ages 88-90) brings a major rasi lord antardasha: the most significant Jupiter presence in the entire Uttara Bhadra life sequence, occurring in the late elder years as a profound philosophical expansion and possible completion.",
        navigate: "Complete and devoted physical care. Rahu at this extreme age is the dissolution of what was always already larger than the individual form. Rahu–Jupiter (~yr 3, ~ages 88-90) is the single most significant rasi lord antardasha in the Uttara Bhadra life — Jupiter as rasi lord arriving in Rahu's expansive, dissolving field.",
        focus: "Saturday Rahu shrine prayers. Rahu–Jupiter (~yr 3, ~ages 88-90) is the major rasi lord antardasha flag — the rasi lord's philosophical grace, expansiveness, and cosmic wisdom arriving as the most significant single sub-period in the Uttara Bhadra dasha sequence. For those who reach this age, this 11-month window is an extraordinary encounter with the Meena rasi lord in the final life arc.",
      },
    },
  ],

  spirituality: [
    {
      title: "Ahir Budhnya & Cosmic Depth Worship",
      desc: "Ahir Budhnya — the serpent of the cosmic depths, the dragon who holds the foundation of the universe — is Uttara Bhadra's presiding deity. Deep contemplative practice, the Markandeya Purana traditions, and the cultivation of the inner stillness that allows the depths to be inhabited without drowning are Uttara Bhadra's most resonant spiritual expressions.",
    },
    {
      title: "Jupiter Devotion & Guru Tradition",
      desc: "Jupiter — the lord of Meena, Uttara Bhadra's rasi — governs the entire life as the rasi lord even though his dasha lies beyond the typical lifespan. Thursday Brihaspati worship, Dakshinamurthy devotion, and the sustained relationship with a guru or wisdom tradition are the most important spiritual structures for Uttara Bhadra. Every Jupiter antardasha in the life sequence is a significant devotional event.",
    },
    {
      title: "Silent Meditation & Depth Contemplation",
      desc: "The practice of silent meditation — the sustained, patient return to the depths that Ahir Budhnya governs — is Uttara Bhadra's most authentic spiritual practice. The wisdom of the depths does not arrive quickly; it arrives when the contemplative has remained long enough for the question and the answer to become the same.",
    },
  ],

  guidance: "Ahir Budhnya holds the universe from below — and this is the most invisible of all services, the most anonymous of all contributions, and the most necessary. The depth you inhabit is not a withdrawal from the world but the foundation from which the world receives its stability. Do not measure your contribution by what is visible above the surface; measure it by the quality of the ground you provide. The rasi lord Jupiter — who governs your entire life from Meena's depths — arrives in antardasha after antardasha as the philosophical grace that reveals what the contemplation has been serving. Trust the depths; stay with the difficult question; and let the wisdom that Ahir Budhnya holds arrive in the fullness of its own time.",

  compatibleEn: ["Purva Bhadra", "Revati", "Uttara Ashadha", "Rohini", "Pushya"],
  compatibleNote: "These nakshatras complement Uttara Bhadra's contemplative depth, serpent wisdom, and cosmic stability with fire, nourishment, and philosophical resonance.",

  ta: {
    atAGlanceLabels: ["சிந்தனை ஆழம்", "பாம்பு ஞானம்", "பொறுமையான நிலைப்பாடு", "மீன குரு அருள்", "பிரபஞ்ச நிலைத்தன்மை"],
    radarLabels: ["சிந்தனை", "ஞானம்", "பொறுமை", "அருள்", "நிலைத்தன்மை", "இரக்கம்"],
    coreStrengths: [
      { label: "சிந்தனை ஆழம்",       desc: "அஹிர் புத்நியா — ஆழங்களின் பாம்பு, பிரபஞ்ச நீர்களின் அடித்தளத்தின் டிராகன் — உத்திரட்டாதிக்கு சிந்தனையின் ஆழமான நிலைகளில் வசிக்கும் திறனை கொடுக்கிறது, புரிதல் வரும் வரை கஷ்டமாக புரிந்துகொள்வதில் நிலைத்திருக்கும் திறன்." },
      { label: "பாம்பு ஞானம்",       desc: "ஆழங்களின் ஞானம்: மேற்பரப்பின் விரைவான ஞானம் அல்ல ஆனால் கடினமான கேள்விகளுடன் உண்மையில் நீண்ட போதும் நிலைத்திருந்ததிலிருந்து வரும் மெதுவான, முழுமையான, மாற்ற முடியாத ஞானம்." },
      { label: "பொறுமையான நிலைப்பாடு", desc: "சனியின் ராசி (மீனம் குருவின் ராசி, ஆனால் உத்திரட்டாதி சனி தசையில் திறக்கிறது) குருவின் அருளுடன் — சனியின் கட்டமைப்பு பொறுமை மற்றும் குருவின் தத்துவ விரிவாக்கம் ஆகியவற்றின் கலவை பொறுமையின்மை அல்லது மேலோட்டம் ஊடுருவ முடியாத நிலைப்பாட்டை உருவாக்குகிறது." },
      { label: "மீன குரு அருள்",     desc: "மீனம் குருவின் சொந்த ராசி — மற்றும் குரு மீனத்தில் பிறந்த உத்திரட்டாதிக்கு கொடுக்கும் அருள், இரக்கம், தத்துவ செழிப்பு ஆகியவை அசாதாரணமாக கிடைக்கிறது, குரு தசை தானே வழக்கமான ஆயுட்காலத்திற்கு அப்பால் இருந்தாலும்." },
      { label: "பிரபஞ்ச நிலைத்தன்மை", desc: "அஹிர் புத்நியா கீழிருந்து பிரபஞ்சத்தை தாங்குகிறது — மற்றும் இந்த அடித்தளம் கொடுப்பது, மற்றவர்கள் கட்டக்கூடிய நிலையான தரை வழங்குவது, உத்திரட்டாதியின் தனிச்சிறப்பான பங்களிப்பு." },
      { label: "ஆழமான இரக்கம்",       desc: "மீனத்தின் பச்சாதாபம் அஹிர் புத்நியாவின் சிந்தனை ஆழத்துடன் சேர்ந்தது — உத்திரட்டாதியின் இரக்கம் மேலோட்டமான துன்பத்திற்கான உணர்வு ரீதியான பதில் அல்ல ஆனால் துன்பம் உண்மையில் என்னவென்று மற்றும் உண்மையில் என்ன தேவை என்பதன் ஆழமான அங்கீகாரம்." },
    ],
    careerAbilityLabels: ["ஆன்மீக நடைமுறை & தியானம்", "ஆழ அறிவியல் & ஆராய்ச்சி", "ஆலோசனை & ஆழமான இரக்கம்", "தத்துவம் & ஞான கற்பித்தல்", "நீர் அறிவியல்கள் & கடல் உயிரியல்"],
    careerClusters: [
      { title: "ஆன்மீக நடைமுறை & சிந்தனை தலைமை", desc: "ஆழ தியான நடைமுறை, சிந்தனை சமூக தலைமை, உள் வாழ்க்கையை நீடித்த வளர்ப்பு மற்றும் கற்பித்தல்." },
      { title: "ஆழ அறிவியல் & கல்வி ஆராய்ச்சி",   desc: "நீட்டிக்கப்பட்ட சிந்தனை தேவைப்படும் கல்வி ஆராய்ச்சி, ஆழமான கேள்விகளின் விசாரணை, நூலாசிரியர் அறிவியல்." },
      { title: "ஆலோசனை, சிகிச்சை & ஆழமான கேட்கும் திறன்", desc: "ஆழமான இரக்கம் மற்றும் நீட்டிக்கப்பட்ட பொறுமை தேவைப்படும் ஆலோசனை மற்றும் சிகிச்சை." },
      { title: "தத்துவம் & ஞான கற்பித்தல்",         desc: "தத்துவ மற்றும் சிந்தனை மரபுகளின் கற்பித்தல் — எளிமைப்படுத்தல் அல்லது அவசரம் இல்லாமல் ஆழங்கள் வெளிப்படுத்தியதின் பொறுமையான பரிமாற்றம்." },
      { title: "சமூக வேலை & இரக்கமான சேவை",       desc: "சமூக வேலை, வறுமை தணிப்பு, ஆழமான தேவையில் உள்ளவர்களுக்கு சேவை." },
      { title: "நீர், கடல் & சுற்றுச்சூழல் அறிவியல்கள்", desc: "கடல் ஆராய்ச்சி, நீரியல், கடல் உயிரியல் — தொழில்முறை அறிவியலில் மொழிபெயர்க்கப்பட்ட அஹிர் புத்நியாவின் பிரபஞ்ச நீர்களின் தளம்." },
    ],
    modernApps: [
      { title: "சிந்தனை நடைமுறை தொழில்நுட்பம்",         desc: "தியானம் தளங்கள், சிந்தனை நடைமுறை தொழில்நுட்பம், ஆழமான உள் வாழ்க்கை வளர்ப்பு பயன்பாடுகள்." },
      { title: "ஆழ ஆராய்ச்சி & கல்வி தொழில்நுட்பம்",    desc: "ஆழ ஆராய்ச்சி தளங்கள், நீண்ட-கால கல்வி விசாரணை கருவிகள், சிந்தனை அறிவியல் தொழில்நுட்பம்." },
      { title: "ஆலோசனை & இரக்கமான பராமரிப்பு தொழில்நுட்பம்", desc: "ஆழ ஆலோசனை தளங்கள், இரக்கமான பராமரிப்பு தொழில்நுட்பம், நீட்டிக்கப்பட்ட பொறுமை சிகிச்சை பயன்பாடுகள்." },
      { title: "ஞான கற்பித்தல் தொழில்நுட்பம்",           desc: "சிந்தனை மரபு கற்பித்தல் தளங்கள், தத்துவ ஞான பரிமாற்றம் தொழில்நுட்பம், ஆழ கற்பித்தல் பயன்பாடுகள்." },
      { title: "சமூக சேவை & இரக்கம் தொழில்நுட்பம்",     desc: "சமூக வேலை தளங்கள், வறுமை தணிப்பு தொழில்நுட்பம், கீழிருந்து மேலான இரக்கமான சேவை பயன்பாடுகள்." },
      { title: "கடல் & சுற்றுச்சூழல் அறிவியல் தொழில்நுட்பம்", desc: "கடல் ஆராய்ச்சி தளங்கள், கடல் உயிரியல் தொழில்நுட்பம், டிஜிட்டல் அறிவியலில் அஹிர் புத்நியாவின் தளம்." },
    ],
    dashaThemes: [
      "ஆழமான பொறுமையில் பிறப்பு — சனி ஆரம்பம், குரு கொடியாளி (~13 வயது)",
      "ஆழம் குரல் காண்கிறது — புதன் வெளிப்பாடு, குரு கொடியாளி (~33-34 வயது)",
      "உள்நோக்கிய திரும்பல் — கேது எளிமை, குரு கொடியாளி (~41-42 வயது)",
      "அழகான ஆழப்படுத்தல் — சுக்கிர செழிப்பு, குரு கொடியாளி (~43-44 வயது)",
      "சூரிய மூத்தவர் — சூரியன் தெளிவான அதிகாரம், குரு கொடியாளி (~65-66 வயது)",
      "உணர்வு கடல் — சந்திர ஆழம், முக்கிய குரு கொடியாளி (~75-77 வயது)",
      "இறுதி நெருப்பு — செவ்வாய் உயிர்சக்தி, குரு கொடியாளி (~81-82 வயது)",
      "இறுதி விரிவாக்கம் — ராகு கரைவு, முக்கிய குரு கொடியாளி (~88-90 வயது)",
    ],
    dashaDetails: [
      {
        expect: "உத்திரட்டாதி சனி தசையில் திறக்கிறது — அசாதாரண ஆழம், பொறுமை மற்றும் வாழ்க்கை முறையாக தொடங்குவதற்கு முன்பே அதிகம் சென்றதன் தரத்தின் தொடக்கம். சனியின் பத்தொன்பது வருடங்கள் குழந்தைப்பருவம், குழந்தைத்தனம் மற்றும் ஆரம்ப இளமை ஆகியவற்றை உள்ளடக்குகிறது. சனி–குரு (~yr 13, ~13-14 வயது): குரு உங்கள் ராசி அதிபதி, மீனம் — இந்த முக்கிய ஆரம்பகால பருவம் கொடியாளி சாளரம்.",
        navigate: "இளம் உத்திரட்டாதிக்கு சனியின் முதன்மையான சவால் குழந்தைப்பருவத்தின் சமூக சூழலில் ஆழமான பொறுமையின் எடை. சனி–குரு (~yr 13, ~13-14 வயது): இந்த வாழ்க்கையின் ஞான பாதையை மிகவும் வடிவமைக்கும் ஆசிரியர் அல்லது மரபுடன் முதல், சிறிய, வடிவமைக்கும் சந்திப்பு.",
        focus: "சனிக்கிழமை சனி வழிபாடு மற்றும் சிந்தனை நடைமுறைகளின் ஆரம்பகால வளர்ப்பு. சனி–குரு (~yr 13, ~13-14 வயது): முக்கிய ராசி அதிபதி கொடியாளி — கவனமாக கவனிக்கவும்.",
      },
      {
        expect: "புதன் தசை 19 முதல் 36 வரை உத்திரட்டாதியின் ஆழத்திற்கு வெளிப்படுத்தும் திறனை கொண்டு வருகிறது. சனியின் பத்தொன்பது வருடங்களில் வளர்ந்த சிந்தனை நுண்ணறிவு இப்போது புதனில் வெளிப்படுத்தும், கூறும், கையாளும் திறனை காண்கிறது. புதன்–குரு (~yr 14, ~33-34 வயது): புதன் தசையின் மிகவும் விரிவான மற்றும் தத்துவ ரீதியில் வளமான அந்தர்தசை — குறிப்பிடத்தக்க ராசி அதிபதி கொடியாளி.",
        navigate: "உத்திரட்டாதிக்கு புதனின் முதன்மையான சவால் சிந்தனை ஆழம் மற்றும் புதனின் விரைவான பகுப்பாய்வு இயக்கம் ஆகியவற்றுக்கிடையே வேகம் வேறுபாடு. புதன்–குரு: முக்கிய ராசி அதிபதி கொடியாளி — குருவின் வருகை தத்துவ விரிவாக்கம் மற்றும் ஞான திட்டுமிட்டானாக.",
        focus: "புதன்கிழமை புதன் வழிபாடு. புதன்–குரு (~yr 14, ~33-34 வயது): முக்கிய ராசி அதிபதி கொடியாளி.",
      },
      {
        expect: "கேது தசை 36 முதல் 43 வரை மாபெரும் உள்நோக்கிய திரும்பலை கொண்டு வருகிறது. கேது–குரு (~yr 5, ~41-42 வயது): முக்கிய ராசி அதிபதி கொடியாளி — கேது தசையில் உத்திரட்டாதிக்கு மிகவும் குறிப்பிடத்தக்க அந்தர்தசை. இது அடிக்கடி முக்கிய ஆன்மீக ஆழப்படுத்தல் அல்லது வாழ்க்கையின் ஞான மரபுடன் தீர்க்கமான சந்திப்பின் காலம்.",
        navigate: "உத்திரட்டாதிக்கு கேதுவின் முதன்மையான சவால் சேவை கோரும் ஈடுபாட்டிற்கு அப்பால் திரும்பி செல்லும் அபாயம். கேது–குரு (~yr 5, ~41-42 வயது): முக்கிய ராசி அதிபதி கொடியாளி.",
        focus: "பித்ரு தர்ப்பணம். கேது–குரு (~yr 5, ~41-42 வயது): முக்கிய ராசி அதிபதி அந்தர்தசை கொடியாளி — குரு–தசைக்கு முந்தைய வரிசையில் ஒன்று மிகவும் குறிப்பிடத்தக்க குரு சந்திப்புகளில் ஒன்று.",
      },
      {
        expect: "சுக்கிர தசை 43 முதல் 63 வரை அழகு, செழிப்பு மற்றும் உறவு அனுதாபத்தை உத்திரட்டாதியின் சிந்தனை மற்றும் ஆழம் சார்ந்த வாழ்க்கைக்கு கொண்டு வருகிறது. சுக்கிர–குரு (~yr 1, ~43-44 வயது): சுக்கிரனின் நீண்ட தசையின் மிகவும் முக்கியமான ராசி அதிபதி கொடியாளி — குரு சுக்கிர தசையின் முற்பகுதியிலேயே வந்து முழு இருபது வருட காலத்திற்கும் தொனி நிறுவுகிறது.",
        navigate: "உத்திரட்டாதிக்கு சுக்கிரனின் முதன்மையான சவால் அழகின் சேவையில் ஆழத்தை நீர்க்கச் செய்யும் சோதனை. சுக்கிர–குரு (~yr 1, ~43-44 வயது): முக்கிய ராசி அதிபதி கொடியாளி — தசா வரிசையில் மிகவும் குறிப்பிடத்தக்க ஆரம்ப குரு சந்திப்புகளில் ஒன்று.",
        focus: "வெள்ளிக்கிழமை லட்சுமி வழிபாடு. ஆழத்தின் அழகின் வேண்டுமென்து வளர்ப்பு. சுக்கிர–குரு (~yr 1, ~43-44 வயது): முக்கிய ராசி அதிபதி அந்தர்தசை கொடியாளி.",
      },
      {
        expect: "சூரியன் தசை 63 முதல் 69 வரை உத்திரட்டாதியின் ஆழ ஞானத்திற்கு அதிகாரத்தின் சூரிய தெளிவை கொண்டு வருகிறது. சூரியன்–குரு (~yr 3, ~65-66 வயது): சூரிய அதிகார தளத்தில் குறிய ஆனால் குறிப்பிடத்தக்க ராசி அதிபதி இருப்பு.",
        navigate: "சூரியனின் முதன்மையான சவால் உத்திரட்டாதிக்கு சூரியனின் புலப்படும் தன்மைக்கான கோரிக்கை மற்றும் சிந்தனையாளரின் ஆழங்களுக்கான விருப்பம் ஆகியவற்றுக்கிடையே சந்திப்பு. சூரியன்–குரு (~yr 3, ~65-66 வயது): ராசி அதிபதி கொடியாளி.",
        focus: "ஞாயிற்றுக்கிழமை சூரிய வழிபாடு. சூரியன்–குரு: ராசி அதிபதி கொடியாளி — சூரிய அதிகாரத்தின் நடுவில் ராசி அதிபதியின் தத்துவ அருள் மற்றும் விரிவான அனுதாபம்.",
      },
      {
        expect: "சந்திர தசை 69 முதல் 79 வரை உத்திரட்டாதியின் ஆழ ஞானத்திற்கு உணர்வு கடலை கொண்டு வருகிறது. சந்திர–குரு (~yr 7, ~75-77 வயது): குரு–தசைக்கு முந்தைய வரிசையில் மிகவும் விரிவான குரு இருப்புகளில் ஒன்று — முக்கிய ராசி அதிபதி கொடியாளி.",
        navigate: "உத்திரட்டாதிக்கு சந்திரனின் முதன்மையான சவால் உணர்வு பாதிப்புடன் சந்திப்பு. சந்திர–குரு (~yr 7, ~75-77 வயது): முக்கிய ராசி அதிபதி கொடியாளி — குரு–தசைக்கு முந்தைய வரிசையில் மிகவும் குறிப்பிடத்தக்க குரு சந்திப்புகளில் ஒன்று.",
        focus: "திங்கட்கிழமை சந்திர வழிபாடு. சந்திர–குரு (~yr 7, ~75-77 வயது): முக்கிய ராசி அதிபதி அந்தர்தசை கொடியாளி.",
      },
      {
        expect: "செவ்வாய் தசை 79 முதல் 86 வரை உத்திரட்டாதி மூத்தவருக்கு செவ்வாயின் திசைப்பட்ட நெருப்பு மற்றும் உயிர் ஆற்றலை கொண்டு வருகிறது. செவ்வாய்–குரு (~yr 3, ~81-82 வயது): செவ்வாயின் உயிர் தளத்தில் ஒரு சிறிய ஆனால் ஒளிமிக்க ராசி அதிபதி சந்திப்பு.",
        navigate: "முழுமையான மற்றும் மென்மையான உடல் பராமரிப்பு. செவ்வாய்–குரு (~yr 3, ~81-82 வயது): ராசி அதிபதி கொடியாளி.",
        focus: "செவ்வாய்க்கிழமை செவ்வாய் சன்னதி வழிபாடு. செவ்வாய்–குரு (~yr 3, ~81-82 வயது): ராசி அதிபதி கொடியாளி சாளரம்.",
      },
    ],
    spirituality: [
      { title: "அஹிர் புத்நியா & பிரபஞ்ச ஆழம் வழிபாடு",  desc: "அஹிர் புத்நியா — பிரபஞ்ச ஆழங்களின் பாம்பு, பிரபஞ்சத்தின் அடித்தளத்தை வைத்திருக்கும் டிராகன் — உத்திரட்டாதியின் தலைமை தெய்வம். ஆழமான சிந்தனை நடைமுறை, மார்க்கண்டேய புராண மரபுகள், மற்றும் ஆழங்களில் மூழ்காமல் வசிக்க அனுமதிக்கும் உள் அமைதியின் வளர்ப்பு." },
      { title: "குரு பக்தி & குரு மரபு",                    desc: "குரு — மீனத்தின் அதிபதி, உத்திரட்டாதியின் ராசி — தன் தசை வழக்கமான ஆயுட்காலத்திற்கு அப்பால் இருந்தாலும் ராசி அதிபதியாக முழு வாழ்க்கையை நிர்வகிக்கிறது. வியாழக்கிழமை பிரஹஸ்பதி வழிபாடு, தட்சிணாமூர்த்தி பக்தி, மற்றும் குரு அல்லது ஞான மரபுடன் நீடித்த உறவு." },
      { title: "அமைதியான தியானம் & ஆழ சிந்தனை",           desc: "அமைதியான தியானத்தின் நடைமுறை — அஹிர் புத்நியா நிர்வகிக்கும் ஆழங்களுக்கு நீடித்த, பொறுமையான திரும்பல் — உத்திரட்டாதியின் மிகவும் உண்மையான ஆன்மீக நடைமுறை." },
    ],
    guidance: "அஹிர் புத்நியா பிரபஞ்சத்தை கீழிருந்து தாங்குகிறது — இது அனைத்து சேவைகளிலும் மிகவும் கண்ணுக்கு தெரியாதது, அனைத்து பங்களிப்புகளிலும் மிகவும் பெயரற்றது, மற்றும் மிகவும் அவசியமானது. நீங்கள் வசிக்கும் ஆழம் உலகிலிருந்து விலகுதல் அல்ல ஆனால் உலகம் தன் நிலைத்தன்மையை பெறும் அடித்தளம். மேற்பரப்பிற்கு மேல் என்ன காணக்கூடியது என்பதால் உங்கள் பங்களிப்பை அளவிட வேண்டாம்; நீங்கள் வழங்கும் தரையின் தரத்தால் அளவிடுங்கள். உங்கள் முழு வாழ்க்கையை மீனத்தின் ஆழங்களிலிருந்து நிர்வகிக்கும் ராசி அதிபதி குரு — அந்தர்தசையிலிருந்து அந்தர்தசைக்கு சிந்தனை சேவித்து வந்ததை வெளிப்படுத்தும் தத்துவ அருளாக வருகிறார். ஆழங்களை நம்புங்கள்; கஷ்டமான கேள்வியுடன் நிலைத்திருங்கள்; மற்றும் அஹிர் புத்நியா வைத்திருக்கும் ஞானம் தன்னுடைய காலத்தின் முழுமையில் வரட்டும்.",
    careerNote: "ஆழம் — கஷ்டமான அல்லது தெளிவற்றவற்றுடன் உண்மையான புரிதல் வரும் வரை நிலைத்திருக்கும் விருப்பம் — மையத் தேவையாக இருக்கும் இடங்களில் உத்திரட்டாதி சிறப்பாக செயல்படுகிறது.",
    modernLead: "உத்திரட்டாதியின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "சிந்தனை ஆழம், பாம்பு ஞானம், பொறுமையான நிலைப்பாடு உத்திரட்டாதியின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function UttaraBhadraVisualPage() {
  return <NatchathiramVisualContent data={UTTIRATATHI} visual={UTTARA_BHADRA_VISUAL} />;
}
