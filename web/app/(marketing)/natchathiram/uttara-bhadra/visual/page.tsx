import type { Metadata } from "next";
import { withTamilTwin } from "@/lib/localized-metadata";
import { withDasaTimingHold } from "@/lib/natchathiram-dasa-hold";
import { dasaTimingsFor } from "@/lib/natchathiram-dasa-timings";
import { nakshatraDisplayName } from "@/lib/nakshatra-display-name";
import { natchathiramVisualTa } from "@/lib/marketing-seo-ta";
import { UTTIRATATHI } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

const EN_METADATA: Metadata = {
  title: `${nakshatraDisplayName(UTTIRATATHI.number, "en")} — Visual Profile`,
  description: "Visual profile of Uthirattathi Nakshathiram: personality traits, career strengths, dasa timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/uttara-bhadra/visual" },
  openGraph: {
    title: `${nakshatraDisplayName(UTTIRATATHI.number, "en")} — Visual Profile`,
    description: "Visual profile of Uthirattathi Nakshathiram: personality traits, career strengths, dasa timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/uttara-bhadra/visual",
    type: "article",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withDasaTimingHold(await withTamilTwin(EN_METADATA, "/natchathiram/uttara-bhadra/visual", natchathiramVisualTa("uttara-bhadra")!), "uttara-bhadra");
}

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
    { symbol: "⚡", label: "Patient Groundedness",   score: 96, desc: "Saturn's rasi (Meena is Jupiter's rasi, but Uttara Bhadra opens in Saturn dasa) joined to Jupiter's grace — the combination of Saturn's structural patience and Jupiter's philosophical expansiveness produces a groundedness that neither impatience nor superficiality can penetrate." },
    { symbol: "♥", label: "Meena Jupiter Grace",    score: 97, desc: "Meena is Jupiter's own rasi — and the grace, compassion, and philosophical abundance that Jupiter gives to Meena-born Uttara Bhadra is unusually available, even though the Jupiter dasa itself lies beyond the typical life span. Jupiter's influence is felt through antardasa presences and through the rasi quality that suffuses the entire life." },
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
      planet: "Saturn", theme: "Born into the Deep Patience",
      detail: {
        expect: "Uttara Bhadra opens in Saturn dasa — a beginning of unusual depth, patience, and the quality of having already been through much before the life has formally begun. The Uttara Bhadra child in Saturn dasa has a gravitas that strikes caregivers early: the seriousness, the depth of attention, the capacity for sustained contemplation that are not typical of very young children. Saturn's is a long opening dasa, and the balance left at birth runs from long for births in the first pada to short for the fourth; the range shown for this dasa gives it. Where it runs through childhood and the school years, the formative period is structured by Saturn's long-game governance, and the educational path is typically marked by the depth of engagement rather than the breadth — the Uttara Bhadra student who studies one thing until it is fully understood, rather than moving quickly across many things. The Saturn–Jupiter bhukti, which closes this dasa (the table below gives when it begins and how long it lasts), is a critical rasi lord sub-period flag: Jupiter is the lord of your rasi, Meena, and this sub-period brings the rasi lord's philosophical abundance, grace, and expansive wisdom as the first significant encounter with the Jupiter quality that governs the entire life.",
        navigate: "Saturn's primary challenge for the young Uttara Bhadra is the weight of the deep patience in the social environment of childhood — the contemplative child who is not quick, not light, not easily animated by the social entertainments of their peers, can find the early social environment genuinely difficult. The depth is real and valuable; the challenge is to provide the young Uttara Bhadra with relationships and environments that honour the depth rather than demanding the performance of lightness. The Saturn–Jupiter bhukti is a major rasi lord flag: this is the first, brief, formative encounter with the Jupiter quality that defines the Uttara Bhadra nature.",
        focus: "Saturday Saturn worship, Hanuman worship, and the early cultivation of contemplative practices — simple meditation, deep reading, the practices that allow the Uttara Bhadra depth to find its appropriate expression from the earliest years. The Saturn–Jupiter bhukti (the bhukti table below gives when it begins and how long it lasts) is a major rasi lord flag: provide the young Uttara Bhadra with genuine philosophical and spiritual education in this sub-period, and the encounter with the teacher or tradition that will be most formative for the life's wisdom path often occurs here.",
      },
    },
    {
      planet: "Mercury", theme: "The Depth Finds Its Voice",
      detail: {
        expect: "Mercury dasa brings the capacity for articulation to Uttara Bhadra's depth; it begins anywhere from childhood to the close of adolescence, by pada, and runs on through the formative years of adult life. The contemplative intelligence that has been developing through Saturn's long opening now finds in Mercury the ability to express, to articulate, to communicate what has been understood from the depths. University education and the first professional steps are taken in Mercury's field; the academic or philosophical career begins to take shape. The depth of engagement that Uttara Bhadra brings to any intellectual domain they inhabit produces, in Mercury dasa, the work that begins to distinguish them within their chosen field. The Mercury–Jupiter bhukti (the table below gives when it begins and how long it lasts) is a significant rasi lord sub-period flag: Jupiter arrives in Mercury's articulative field as the most expansive and philosophically rich sub-period of the Mercury dasa.",
        navigate: "Mercury's primary challenge for Uttara Bhadra is the pace difference between the contemplative depth and Mercury's quick analytical movement — the deep thinker finding Mercury's speed genuinely challenging to inhabit while maintaining the quality of contemplation that gives the thought its depth. The Mercury–Jupiter bhukti is a rasi lord flag: Jupiter's arrival in Mercury's field as a significant philosophical expansion and possible wisdom breakthrough.",
        focus: "Wednesday Mercury worship and the deliberate cultivation of articulation at the pace that maintains depth — not quick formulation but careful, considered expression. The Mercury–Jupiter bhukti (the bhukti table below gives when it begins and how long it lasts) is a major rasi lord flag: a period of philosophical expansion, possible encounter with the teacher or tradition that deepens the life's wisdom path, or a significant writing or teaching breakthrough.",
      },
    },
    {
      planet: "Ketu", theme: "The Inward Return",
      detail: {
        expect: "Ketu dasa brings the great inward return — after Saturn's deep patience and Mercury's articulative engagement, Ketu strips the accumulated constructions and invites the return to the source. For Uttara Bhadra, whose nature is already contemplative and depth-oriented, Ketu's inward movement is not a radical disruption but a deepening: the contemplative returns to the contemplative, the depth to the depths. For many Uttara Bhadra, Ketu dasa is a period of significant spiritual practice deepening — a retreat, a period of dedicated practice, or the decisive encounter with the teacher or tradition that provides the framework for the life's remaining decades. The Ketu–Jupiter bhukti (the table below gives when it begins and how long it lasts) is a significant rasi lord sub-period flag.",
        navigate: "Ketu's primary challenge for Uttara Bhadra is the risk of withdrawal beyond what serves — the contemplative person who uses Ketu's inward pull to avoid the engagement that the wisdom requires. Ahir Budhnya holds the cosmos from below; the depth is in service of what is above, not a retreat from it. The Ketu–Jupiter bhukti is a rasi lord flag: the most significant sub-period of Ketu dasa for Uttara Bhadra.",
        focus: "Ganapati worship, pitru tharpanam and ancestral rites. The Ketu–Jupiter bhukti (the bhukti table below gives when it begins and how long it lasts) is a major rasi lord flag: Jupiter arrives in Ketu's simplifying field as a luminous, expansive, philosophically rich sub-period — one of the most significant encounters with the rasi lord's quality in the sequence before the Jupiter dasa. This is often the period of the major spiritual deepening or the decisive encounter with the life's wisdom tradition.",
      },
    },
    {
      planet: "Venus", theme: "The Beautiful Deepening",
      detail: {
        expect: "Venus dasa, running through the long middle of life, brings beauty, abundance, and relational warmth to Uttara Bhadra's otherwise contemplative and depth-oriented life. The wisdom that has been accumulating since Saturn's opening now meets the world's beauty in a way that the deep person can genuinely receive and share. Professional recognition reaches its widest scope; teaching and transmission of the Uttara Bhadra wisdom becomes the primary professional expression; where the dasa runs late, grandchildren may arrive for those who have married. The Venus–Jupiter bhukti (the table below gives when it begins and how long it lasts) is a significant rasi lord sub-period flag: Jupiter arrives within Venus's long dasa as a luminous, expansive philosophical window.",
        navigate: "Venus's primary challenge for Uttara Bhadra is the temptation to dilute the depth in service of the beautiful — the contemplative whose wisdom is packaged for wider consumption at the cost of the depth that made it valuable. The beauty that Venus offers is the beauty of the depths made accessible, not the beauty of the surface substituting for the depths. The Venus–Jupiter bhukti is a major rasi lord flag.",
        focus: "Friday Lakshmi worship and the deliberate cultivation of the beauty of depth — the aesthetic that honours the contemplative rather than simplifying it. The Venus–Jupiter bhukti (the bhukti table below gives when it begins and how long it lasts) is a major rasi lord flag: one of the most significant Jupiter encounters in the Uttara Bhadra dasa sequence.",
      },
    },
    {
      planet: "Sun", theme: "The Solar Elder",
      detail: {
        expect: "Sun dasa, in the later years, brings the solar clarity of authority to Uttara Bhadra's depth wisdom. The contemplative who has inhabited the depths across a lifetime now stands in the solar light — not with the solar fire's urgency but with the settled authority of one who has seen to the bottom and come back. Teaching and transmission reach their most authoritative expression; the elder's presence itself is the teaching.",
        navigate: "Sun's primary challenge for Uttara Bhadra is the encounter between the solar demand for visibility and the contemplative's preference for the depths. The Sun–Jupiter bhukti (the table below gives when it begins and how long it lasts) brings a brief but notable rasi lord presence — Jupiter arrives as a warm, expansive sub-period in the solar authority field.",
        focus: "Sunday Surya worship and the deliberate offering of the depth wisdom in accessible, luminous form. The Sun–Jupiter bhukti (the bhukti table below gives when it begins and how long it lasts) is a rasi lord sub-period flag: the rasi lord's philosophical grace and expansive warmth in the midst of Sun's solar authority.",
      },
    },
    {
      planet: "Moon", theme: "The Emotional Ocean",
      detail: {
        expect: "Moon dasa, in advanced age, brings the emotional ocean to Uttara Bhadra's depth wisdom. The contemplative who has inhabited the deeper-than-emotional dimension of experience now descends into the feeling dimension — the emotional depth that Meena naturally carries, and that the Uttara Bhadra character has perhaps held below the surface through the earlier decades of committed depth work. Family relationships, the bonds of decades, and the emotional richness of a life deeply lived are the primary gifts of Moon dasa. The Moon–Jupiter bhukti (the table below gives when it begins and how long it lasts) brings a significant rasi lord sub-period — one of the most expansive Jupiter presences in the Uttara Bhadra sequence.",
        navigate: "Moon's primary challenge for Uttara Bhadra is the encounter with emotional vulnerability — the person whose depth has been primarily in the contemplative domain discovering the ocean of feeling as a distinct and sometimes overwhelming dimension. The Moon–Jupiter bhukti is a major rasi lord flag: Jupiter arrives in Moon's emotional field as a warm, philosophically expansive, and possibly the most profound Jupiter encounter in the sequence before the Jupiter dasa.",
        focus: "Monday Moon worship and the deliberate cultivation of emotional presence — feeling the depth of relationship and love that the contemplative life has been serving. The Moon–Jupiter bhukti (the bhukti table below gives when it begins and how long it lasts) is a major rasi lord flag: one of the most significant Jupiter presences in the Uttara Bhadra dasa sequence before the rasi lord's own dasa.",
      },
    },
    {
      planet: "Mars", theme: "The Final Fire",
      detail: {
        expect: "Mars dasa, in advanced age, brings the directed fire and vital energy of Mars to the Uttara Bhadra elder. After Moon's emotional ocean, Mars is a sudden, vitalising presence — the body's energy and the will's directedness in an unexpected late-life appearance. The Mars–Jupiter bhukti (the table below gives when it begins and how long it lasts) brings a rasi lord sub-period: a brief but luminous encounter with the Jupiter quality in Mars's vital field.",
        navigate: "Complete and gentle physical care. Mars's vitality at this age requires careful management — the fire is real, but the body requires deliberate protection. The Mars–Jupiter bhukti is a rasi lord sub-period flag.",
        focus: "Tuesday Mars shrine prayers. The Mars–Jupiter bhukti (the bhukti table below gives when it begins and how long it lasts) is a rasi lord sub-period flag: a brief, expansive, philosophically warm sub-period in the elder's final vital period.",
      },
    },
    {
      planet: "Rahu", theme: "The Final Expansion",
      detail: {
        expect: "Rahu dasa, in very advanced age, brings the great expansion and dissolution of identity to Uttara Bhadra's elder years. The contemplative depth and the cosmic stability that have defined this person across a lifetime now meet Rahu's insistent expansion — the recognition that what has been the individual form of wisdom is part of a much larger field. The Rahu–Jupiter bhukti (the table below gives when it begins and how long it lasts) brings a major rasi lord sub-period: the most significant Jupiter presence in the entire Uttara Bhadra life sequence, occurring in the late elder years as a profound philosophical expansion and possible completion.",
        navigate: "Complete and devoted physical care. Rahu at this extreme age is the dissolution of what was always already larger than the individual form. The Rahu–Jupiter bhukti is the single most significant rasi lord sub-period in the Uttara Bhadra life — Jupiter as rasi lord arriving in Rahu's expansive, dissolving field.",
        focus: "Saturday Rahu shrine prayers. The Rahu–Jupiter bhukti (the bhukti table below gives when it begins and how long it lasts) is the major rasi lord flag — the rasi lord's philosophical grace, expansiveness, and cosmic wisdom arriving as the most significant single sub-period in the Uttara Bhadra dasa sequence. For those who reach this stage, this window is an extraordinary encounter with the Meena rasi lord in the final life arc.",
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
      desc: "Jupiter — the lord of Meena, Uttara Bhadra's rasi — governs the entire life as the rasi lord even though his dasa lies beyond the typical lifespan. Thursday Brihaspati worship, Dakshinamurthy devotion, and the sustained relationship with a guru or wisdom tradition are the most important spiritual structures for Uttara Bhadra. Every Jupiter antardasa in the life sequence is a significant devotional event.",
    },
    {
      title: "Silent Meditation & Depth Contemplation",
      desc: "The practice of silent meditation — the sustained, patient return to the depths that Ahir Budhnya governs — is Uttara Bhadra's most authentic spiritual practice. The wisdom of the depths does not arrive quickly; it arrives when the contemplative has remained long enough for the question and the answer to become the same.",
    },
  ],

  guidance: "Ahir Budhnya holds the universe from below — and this is the most invisible of all services, the most anonymous of all contributions, and the most necessary. The depth you inhabit is not a withdrawal from the world but the foundation from which the world receives its stability. Do not measure your contribution by what is visible above the surface; measure it by the quality of the ground you provide. The rasi lord Jupiter — who governs your entire life from Meena's depths — arrives in antardasa after antardasa as the philosophical grace that reveals what the contemplation has been serving. Trust the depths; stay with the difficult question; and let the wisdom that Ahir Budhnya holds arrive in the fullness of its own time.",

  compatibleEn: ["Poorattathi", "Revathi", "Uthiradam", "Rohini", "Poosam"],
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
      "ஆழமான பொறுமையில் பிறப்பு — சனி ஆரம்பம், முதல் குரு சந்திப்பு",
      "ஆழம் குரல் காண்கிறது — புதன் வெளிப்பாடு, குருவின் ஞானத் திறப்பு",
      "உள்நோக்கிய திரும்பல் — கேது எளிமை, குருவின் ஆன்மீக ஆழம்",
      "அழகான ஆழப்படுத்தல் — சுக்கிர செழிப்பு, குருவின் முக்கிய சாளரம்",
      "சூரிய மூத்தவர் — சூரியன் தெளிவான அதிகாரம், குருவின் அரவணைப்பு",
      "உணர்வுக் கடல் — சந்திர ஆழம், முக்கிய குரு சாளரம்",
      "இறுதி நெருப்பு — செவ்வாய் உயிர்சக்தி, குருவின் ஒளி",
      "இறுதி விரிவாக்கம் — ராகு கரைவு, குருவின் மிக முக்கிய சாளரம்",
    ],
    dashaDetails: [
      {
        expect: "உத்திரட்டாதி சனி தசையில் தொடங்குகிறது — அசாதாரண ஆழம், பொறுமை, வாழ்வு முறையாகத் தொடங்கும் முன்பே பலவற்றைக் கடந்து வந்த தன்மை ஆகியவற்றின் தொடக்கம். சனி தசையில் உத்திரட்டாதிக் குழந்தைக்கு, பராமரிப்பாளர்களை ஆரம்பத்திலேயே தாக்கும் கம்பீரம் உண்டு: மிக இளம் குழந்தைகளுக்குப் பொதுவல்லாத தீவிரம், கவனத்தின் ஆழம், நீடித்த சிந்தனைத் திறன். சனி நீண்ட தொடக்க தசை; பிறக்கும்போது மீதமுள்ள இருப்பு முதல் பாதத்தில் நீளமாகவும் நான்காம் பாதத்தில் குறுகியதாகவும் இருக்கும் — இந்த தசைக்குக் காட்டப்படும் வரம்பு அதைச் சொல்கிறது. அது குழந்தைப் பருவம், பள்ளிக் காலம் வழியாக நீளுமானால், உருவாக்கும் காலம் சனியின் நீண்டகால ஆட்சியால் கட்டமைக்கப்படுகிறது; கல்விப் பாதை பொதுவாக அகலத்தை விட ஈடுபாட்டின் ஆழத்தால் குறிக்கப்படுகிறது — பலவற்றை விரைவாகக் கடப்பதற்குப் பதிலாக, ஒன்றை முழுமையாகப் புரியும் வரை பயிலும் உத்திரட்டாதி மாணவர். இந்த தசையை நிறைவு செய்யும் சனி–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு முக்கியமான ராசி அதிபதி அடையாளம்: குரு உங்கள் ராசியான மீனத்தின் அதிபதி; இந்த துணைக் காலம் முழு வாழ்வையும் ஆளும் குருவின் தன்மையுடன் முதல் குறிப்பிடத்தக்க சந்திப்பாக, ராசி அதிபதியின் தத்துவச் செழிப்பு, அருள், விரிந்த ஞானத்தைக் கொண்டுவருகிறது.",
        navigate: "இளம் உத்திரட்டாதிக்கு சனியின் முதன்மைச் சவால், குழந்தைப் பருவத்தின் சமூகச் சூழலில் ஆழ்ந்த பொறுமையின் எடை — வேகமாக இல்லாத, இலகுவாக இல்லாத, சகாக்களின் சமூகப் பொழுதுபோக்குகளால் எளிதில் உற்சாகமடையாத சிந்திக்கும் குழந்தை, ஆரம்பகாலச் சமூகச் சூழலை உண்மையில் கடினமாகக் காணலாம். ஆழம் உண்மையானது, மதிப்புமிக்கது; இலகுத்தன்மையை நடிக்கக் கோராமல் ஆழத்தை மதிக்கும் உறவுகளையும் சூழல்களையும் இளம் உத்திரட்டாதிக்கு வழங்குவதே சவால். சனி–குரு புக்தி ஒரு முக்கிய ராசி அதிபதி அடையாளம்: உத்திரட்டாதியின் இயல்பை வரையறுக்கும் குருவின் தன்மையுடன் முதல், சுருக்கமான, உருவாக்கும் சந்திப்பு.",
        focus: "சனிக்கிழமை சனி வழிபாடும், ஆஞ்சநேயர் வழிபாடும், சிந்தனைப் பயிற்சிகளின் ஆரம்பகால வளர்ப்பும் — எளிய தியானம், ஆழ்ந்த வாசிப்பு, உத்திரட்டாதியின் ஆழம் ஆரம்ப ஆண்டுகளிலிருந்தே தகுந்த வெளிப்பாட்டைக் காண அனுமதிக்கும் பயிற்சிகள். சனி–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு முக்கிய ராசி அதிபதி அடையாளம்: இந்த துணைக் காலத்தில் இளம் உத்திரட்டாதிக்கு உண்மையான தத்துவ, ஆன்மீகக் கல்வியை வழங்குங்கள்; வாழ்வின் ஞானப் பாதைக்கு மிகவும் உருவாக்கும் ஆசிரியர் அல்லது மரபுடனான சந்திப்பு பெரும்பாலும் இங்கு நிகழ்கிறது.",
      },
      {
        expect: "புதன் தசை உத்திரட்டாதியின் ஆழத்துக்கு வெளிப்படுத்தும் திறனைக் கொண்டுவருகிறது; பாதத்தைப் பொறுத்து குழந்தைப் பருவத்திலோ வளரிளம் பருவத்தின் முடிவிலோ தொடங்கி, வயது வந்த வாழ்வின் உருவாக்க ஆண்டுகள் வழியாகச் செல்கிறது. சனியின் நீண்ட தொடக்கத்தில் வளர்ந்த சிந்தனை நுண்ணறிவு இப்போது புதனில், ஆழங்களிலிருந்து புரிந்துகொண்டதை வெளிப்படுத்தும், எடுத்துரைக்கும், தெரிவிக்கும் திறனைக் காண்கிறது. பல்கலைக்கழகக் கல்வியும் முதல் தொழில் அடிகளும் புதனின் களத்தில் எடுக்கப்படுகின்றன; கல்வி அல்லது தத்துவத் தொழில் வடிவம் பெறத் தொடங்குகிறது. உத்திரட்டாதி தான் வாழும் எந்த அறிவுத் துறையிலும் கொண்டுவரும் ஈடுபாட்டின் ஆழம், புதன் தசையில் அவரைத் தம் துறைக்குள் தனித்துக்காட்டத் தொடங்கும் வேலையை உருவாக்குகிறது. புதன்–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு முக்கியமான ராசி அதிபதி துணைக் காலம்: புதனின் வெளிப்பாட்டுக் களத்தில் குரு, புதன் தசையின் மிக விரிந்த, தத்துவ ரீதியில் வளமான துணைக் காலமாக வருகிறார்.",
        navigate: "உத்திரட்டாதிக்கு புதனின் முதன்மைச் சவால், சிந்தனை ஆழத்துக்கும் புதனின் விரைவான பகுப்பாய்வு இயக்கத்துக்கும் இடையிலான வேக வேறுபாடு — சிந்தனைக்கு ஆழம் தரும் தியானத் தரத்தைப் பேணிக்கொண்டே புதனின் வேகத்தில் வாழ்வதை உண்மையில் சவாலாகக் காணும் ஆழ்ந்த சிந்தனையாளர். புதன்–குரு புக்தி ஒரு ராசி அதிபதி அடையாளம்: புதனின் களத்தில் குருவின் வருகை, முக்கியமான தத்துவ விரிவாக்கமும் சாத்தியமான ஞானத் திருப்புமுனையும்.",
        focus: "புதன்கிழமை புதன் வழிபாடும், ஆழத்தைப் பேணும் வேகத்தில் வெளிப்பாட்டை வேண்டுமென்றே வளர்ப்பதும் — விரைவான வடிவமைப்பு அல்ல, கவனமான, யோசித்த வெளிப்பாடு. புதன்–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு முக்கிய ராசி அதிபதி அடையாளம்: தத்துவ விரிவாக்கத்தின் காலம், வாழ்வின் ஞானப் பாதையை ஆழமாக்கும் ஆசிரியர் அல்லது மரபுடன் சாத்தியமான சந்திப்பு, அல்லது குறிப்பிடத்தக்க எழுத்து அல்லது கற்பித்தல் திருப்புமுனை.",
      },
      {
        expect: "கேது தசை மாபெரும் உள்நோக்கிய திரும்புதலைக் கொண்டுவருகிறது — சனியின் ஆழ்ந்த பொறுமைக்கும் புதனின் வெளிப்படுத்தும் ஈடுபாட்டுக்கும் பிறகு, கேது திரண்ட கட்டுமானங்களை உரித்து மூலத்துக்குத் திரும்ப அழைக்கிறது. இயல்பாகவே சிந்தனையும் ஆழமும் நிறைந்த உத்திரட்டாதிக்கு, கேதுவின் உள்நோக்கிய இயக்கம் தீவிரக் குலைவு அல்ல, ஆழமாதல்: சிந்தனையாளர் சிந்தனைக்கும், ஆழம் ஆழங்களுக்கும் திரும்புகிறது. பல உத்திரட்டாதிகளுக்கு, கேது தசை ஆன்மீகப் பயிற்சி ஆழமாகும் குறிப்பிடத்தக்க காலம் — தனிமையில் தங்குதல், அர்ப்பணிப்புப் பயிற்சியின் காலம், அல்லது வாழ்வின் மீதமுள்ள தசகங்களுக்கான சட்டகத்தைத் தரும் ஆசிரியர் அல்லது மரபுடனான தீர்மானமான சந்திப்பு. கேது–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு முக்கியமான ராசி அதிபதி அடையாளம்.",
        navigate: "உத்திரட்டாதிக்கு கேதுவின் முதன்மைச் சவால், சேவை செய்வதற்கு அப்பால் விலகிச்செல்லும் அபாயம் — ஞானம் கோரும் ஈடுபாட்டைத் தவிர்க்க கேதுவின் உள்நோக்கிய இழுப்பைப் பயன்படுத்தும் சிந்தனையாளர். அஹிர்புத்னியன் அண்டத்தைக் கீழிருந்து தாங்குகிறார்; ஆழம் மேலே உள்ளதற்கான சேவை, அதிலிருந்து பின்வாங்கல் அல்ல. கேது–குரு புக்தி ஒரு ராசி அதிபதி அடையாளம்: உத்திரட்டாதிக்கு கேது தசையின் மிகக் குறிப்பிடத்தக்க துணைக் காலம்.",
        focus: "விநாயகர் வழிபாடு, பித்ரு தர்ப்பணம், முன்னோர் சடங்குகள். கேது–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு முக்கிய ராசி அதிபதி அடையாளம்: கேதுவின் எளிமைப்படுத்தும் களத்தில் குரு ஒளிரும், விரிந்த, தத்துவ ரீதியில் வளமான துணைக் காலமாக வருகிறார் — குரு தசைக்கு முந்தைய வரிசையில் ராசி அதிபதியின் தன்மையுடனான மிகக் குறிப்பிடத்தக்க சந்திப்புகளில் ஒன்று. இது பெரும்பாலும் முக்கிய ஆன்மீக ஆழமாதல் அல்லது வாழ்வின் ஞான மரபுடனான தீர்மானமான சந்திப்பின் காலம்.",
      },
      {
        expect: "வாழ்வின் நீண்ட நடுப்பகுதி வழியாகச் செல்லும் சுக்கிர தசை, உத்திரட்டாதியின் மற்றபடி சிந்தனை, ஆழம் சார்ந்த வாழ்வுக்கு அழகு, செழிப்பு, உறவு அரவணைப்பைக் கொண்டுவருகிறது. சனியின் தொடக்கத்திலிருந்து திரண்ட ஞானம் இப்போது ஆழ்ந்த நபர் உண்மையில் ஏற்றுப் பகிரக்கூடிய விதத்தில் உலகின் அழகைச் சந்திக்கிறது. தொழில்முறை அங்கீகாரம் தன் மிக அகன்ற எல்லையை அடைகிறது; உத்திரட்டாதி ஞானத்தைக் கற்பித்தலும் கடத்தலும் முதன்மைத் தொழில் வெளிப்பாடாகிறது; தசை பிற்பகுதிக்கு நீளுமானால், திருமணமானவர்களுக்குப் பேரக்குழந்தைகள் வரலாம். சுக்கிர–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு முக்கிய ராசி அதிபதி அடையாளம்: சுக்கிரனின் நீண்ட தசைக்குள் குரு ஒளிரும், விரிந்த தத்துவச் சாளரமாக வருகிறார்.",
        navigate: "உத்திரட்டாதிக்கு சுக்கிரனின் முதன்மைச் சவால், அழகுக்குச் சேவையாக ஆழத்தை நீர்க்கச் செய்யும் சோதனை — ஞானம் மதிப்புள்ளதாக இருந்த ஆழத்தை இழந்து பரவலான பயன்பாட்டுக்கு தொகுக்கப்படும் சிந்தனையாளர். சுக்கிரன் தரும் அழகு ஆழங்கள் அணுகத்தக்கதாக ஆக்கப்படும் அழகு, ஆழங்களுக்குப் பதிலாக மேற்பரப்பு நிற்கும் அழகு அல்ல. சுக்கிர–குரு புக்தி ஒரு முக்கிய ராசி அதிபதி அடையாளம்.",
        focus: "வெள்ளிக்கிழமை லட்சுமி வழிபாடும், ஆழத்தின் அழகை வேண்டுமென்றே வளர்ப்பதும் — சிந்தனையாளரை எளிமைப்படுத்தாமல் மதிக்கும் அழகியல். சுக்கிர–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு முக்கிய ராசி அதிபதி அடையாளம்: உத்திரட்டாதியின் தசை வரிசையில் மிகக் குறிப்பிடத்தக்க குரு சந்திப்புகளில் ஒன்று.",
      },
      {
        expect: "பிற்கால ஆண்டுகளில் வரும் சூரிய தசை உத்திரட்டாதியின் ஆழ ஞானத்துக்கு அதிகாரத்தின் சூரியத் தெளிவைக் கொண்டுவருகிறது. ஒரு வாழ்நாள் ஆழங்களில் வாழ்ந்த சிந்தனையாளர் இப்போது சூரிய ஒளியில் நிற்கிறார் — சூரிய நெருப்பின் அவசரத்துடன் அல்ல, அடிவரை சென்று திரும்பியவரின் நிலைபெற்ற அதிகாரத்துடன். கற்பித்தலும் கடத்தலும் தங்கள் மிக அதிகாரபூர்வ வெளிப்பாட்டை அடைகின்றன; மூத்தவரின் இருப்பே போதனை.",
        navigate: "உத்திரட்டாதிக்கு சூரியனின் முதன்மைச் சவால், தெரிவுநிலையைக் கோரும் சூரியனுக்கும் ஆழங்களை விரும்பும் சிந்தனையாளருக்கும் இடையிலான சந்திப்பு. சூரிய–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) சுருக்கமான ஆனால் குறிப்பிடத்தக்க ராசி அதிபதி இருப்பைக் கொண்டுவருகிறது — சூரிய அதிகாரக் களத்தில் குரு அரவணைப்பான, விரிந்த துணைக் காலமாக வருகிறார்.",
        focus: "ஞாயிற்றுக்கிழமை சூரிய வழிபாடும், ஆழ ஞானத்தை அணுகத்தக்க, ஒளிரும் வடிவில் வேண்டுமென்றே அளிப்பதும். சூரிய–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு ராசி அதிபதி அடையாளம்: சூரிய அதிகாரத்தின் நடுவே ராசி அதிபதியின் தத்துவ அருளும் விரிந்த அரவணைப்பும்.",
      },
      {
        expect: "முதிர்ந்த வயதில் வரும் சந்திர தசை உத்திரட்டாதியின் ஆழ ஞானத்துக்கு உணர்வுக் கடலைக் கொண்டுவருகிறது. அனுபவத்தின் உணர்வுக்கும் ஆழமான பரிமாணத்தில் வாழ்ந்த சிந்தனையாளர் இப்போது உணர்வுப் பரிமாணத்துக்குள் இறங்குகிறார் — மீனம் இயல்பாகச் சுமக்கும், ஆழமான பணியில் ஈடுபட்ட முந்தைய தசகங்களில் உத்திரட்டாதிக் குணம் ஒருவேளை மேற்பரப்புக்குக் கீழே வைத்திருந்த உணர்வு ஆழம். குடும்ப உறவுகள், தசகங்களின் பிணைப்புகள், ஆழமாக வாழ்ந்த வாழ்வின் உணர்வுச் செழுமை சந்திர தசையின் முதன்மைக் கொடைகள். சந்திர–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு முக்கியமான ராசி அதிபதி துணைக் காலம் — உத்திரட்டாதி வரிசையில் மிக விரிந்த குரு இருப்புகளில் ஒன்று.",
        navigate: "உத்திரட்டாதிக்கு சந்திரனின் முதன்மைச் சவால், உணர்வு பாதிப்படைதலுடனான சந்திப்பு — ஆழம் முதன்மையாக சிந்தனைத் துறையில் இருந்த நபர், உணர்வுக் கடலை தனித்துவமான, சில நேரம் மூழ்கடிக்கும் பரிமாணமாகக் கண்டுபிடிப்பது. சந்திர–குரு புக்தி ஒரு முக்கிய ராசி அதிபதி அடையாளம்: சந்திரனின் உணர்வுக் களத்தில் குரு அரவணைப்பான, தத்துவ ரீதியில் விரிந்த, குரு தசைக்கு முந்தைய வரிசையில் ஒருவேளை மிக ஆழ்ந்த குரு சந்திப்பாக வருகிறார்.",
        focus: "திங்கட்கிழமை சந்திர வழிபாடும், உணர்வு இருப்பை வேண்டுமென்றே வளர்ப்பதும் — சிந்தனை வாழ்வு சேவை செய்து வந்த உறவு, அன்பின் ஆழத்தை உணர்தல். சந்திர–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு முக்கிய ராசி அதிபதி அடையாளம்: ராசி அதிபதியின் சொந்த தசைக்கு முந்தைய உத்திரட்டாதி தசை வரிசையில் மிகக் குறிப்பிடத்தக்க குரு இருப்புகளில் ஒன்று.",
      },
      {
        expect: "முதிர்ந்த வயதில் வரும் செவ்வாய் தசை உத்திரட்டாதி மூத்தவருக்கு செவ்வாயின் திசைப்பட்ட நெருப்பையும் உயிர் ஆற்றலையும் கொண்டுவருகிறது. சந்திரனின் உணர்வுக் கடலுக்குப் பிறகு, செவ்வாய் திடீர், உயிர்ப்பூட்டும் இருப்பு — பிற்கால வாழ்வில் எதிர்பாராமல் தோன்றும் உடலின் ஆற்றலும் மன உறுதியின் திசையும். செவ்வாய்–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு ராசி அதிபதி துணைக் காலத்தைக் கொண்டுவருகிறது: செவ்வாயின் உயிர்க் களத்தில் குருவின் தன்மையுடன் சுருக்கமான ஆனால் ஒளிரும் சந்திப்பு.",
        navigate: "முழுமையான, மென்மையான உடல் பராமரிப்பு. இந்த வயதில் செவ்வாயின் உயிர்ப்புக்கு கவனமான மேலாண்மை தேவை — நெருப்பு உண்மையானது, ஆனால் உடலுக்கு வேண்டுமென்ற பாதுகாப்பு தேவை. செவ்வாய்–குரு புக்தி ஒரு ராசி அதிபதி துணைக் கால அடையாளம்.",
        focus: "செவ்வாய்க்கிழமை செவ்வாய் சன்னதி வழிபாடு. செவ்வாய்–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு ராசி அதிபதி துணைக் கால அடையாளம்: மூத்தவரின் இறுதி உயிர்ப்புக் காலத்தில் சுருக்கமான, விரிந்த, தத்துவ ரீதியாக அரவணைப்பான துணைக் காலம்.",
      },
      {
        expect: "மிக முதிர்ந்த வயதில் வரும் ராகு தசை உத்திரட்டாதியின் மூத்த ஆண்டுகளுக்கு அடையாளத்தின் மாபெரும் விரிவாக்கத்தையும் கரைவையும் கொண்டுவருகிறது. ஒரு வாழ்நாள் இந்த நபரை வரையறுத்த சிந்தனை ஆழமும் அண்ட நிலைத்தன்மையும் இப்போது ராகுவின் விடாப்பிடியான விரிவாக்கத்தைச் சந்திக்கின்றன — ஞானத்தின் தனிப்பட்ட வடிவமாக இருந்தது மிகப் பெரிய களத்தின் ஒரு பகுதி என்ற உணர்தல். ராகு–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு முக்கிய ராசி அதிபதி துணைக் காலத்தைக் கொண்டுவருகிறது: உத்திரட்டாதி வாழ்வு வரிசை முழுவதிலும் மிகக் குறிப்பிடத்தக்க குரு இருப்பு; பிற்கால மூத்த ஆண்டுகளில் ஆழ்ந்த தத்துவ விரிவாகவும் சாத்தியமான நிறைவாகவும் நிகழ்கிறது.",
        navigate: "முழுமையான, அர்ப்பணிப்புடன் கூடிய உடல் பராமரிப்பு. இந்த மிக முதிர்ந்த வயதில் ராகு என்பது எப்போதும் தனிநபர் வடிவை விடப் பெரியதாக இருந்ததன் கரைவு. ராகு–குரு புக்தி உத்திரட்டாதி வாழ்வின் ஒற்றை மிகக் குறிப்பிடத்தக்க ராசி அதிபதி துணைக் காலம் — ராசி அதிபதி குரு ராகுவின் விரிந்த, கரைக்கும் களத்தில் வருகிறார்.",
        focus: "சனிக்கிழமை ராகு சன்னதி வழிபாடு. ராகு–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) முக்கிய ராசி அதிபதி அடையாளம் — ராசி அதிபதியின் தத்துவ அருள், விரிவு, அண்ட ஞானம் உத்திரட்டாதி தசை வரிசையின் ஒற்றை மிகக் குறிப்பிடத்தக்க துணைக் காலமாக வருகிறது. இந்த கட்டத்தை எட்டுபவர்களுக்கு, இறுதி வாழ்வு வளைவில் மீன ராசி அதிபதியுடன் இது ஒரு அசாதாரணச் சந்திப்பு.",
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
  return <NatchathiramVisualContent data={UTTIRATATHI} visual={UTTARA_BHADRA_VISUAL} timings={dasaTimingsFor(UTTIRATATHI.number)} />;
}
