import type { Metadata } from "next";
import { withTamilTwin } from "@/lib/localized-metadata";
import { withDasaTimingHold } from "@/lib/natchathiram-dasa-hold";
import { dasaTimingsFor } from "@/lib/natchathiram-dasa-timings";
import { nakshatraDisplayName } from "@/lib/nakshatra-display-name";
import { natchathiramVisualTa } from "@/lib/marketing-seo-ta";
import { SWATI } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

const EN_METADATA: Metadata = {
  title: `${nakshatraDisplayName(SWATI.number, "en")} — Visual Profile`,
  description: "Visual profile of Swathi Nakshathiram: personality traits, career strengths, dasa timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/swati/visual" },
  openGraph: {
    title: `${nakshatraDisplayName(SWATI.number, "en")} — Visual Profile`,
    description: "Visual profile of Swathi Nakshathiram: personality traits, career strengths, dasa timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/swati/visual",
    type: "article",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withDasaTimingHold(await withTamilTwin(EN_METADATA, "/natchathiram/swati/visual", natchathiramVisualTa("swati")!), "swati");
}

const SWATI_VISUAL: NatchathiramVisualData = {
  atAGlance: [
    { label: "Diplomatic Intelligence",  score: 95 },
    { label: "Independent Spirit",       score: 94 },
    { label: "Social Grace",             score: 92 },
    { label: "Business Acumen",          score: 91 },
    { label: "Adaptive Resilience",      score: 93 },
  ],

  radar: {
    labels: ["Diplomacy", "Independence", "Social Grace", "Business", "Resilience", "Balance"],
    values: [95, 94, 92, 91, 93, 90],
  },

  coreStrengths: [
    { symbol: "◎", label: "Diplomatic Intelligence", score: 95, desc: "Vayu's wind — Swati reads every room, adjusts every response, and finds the equilibrium that allows all parties to breathe." },
    { symbol: "◈", label: "Independent Spirit",      score: 94, desc: "The reed that bends in the storm but does not break — Swati's independence is not stubbornness but an unshakeable centre." },
    { symbol: "⚡", label: "Social Grace",            score: 92, desc: "Libra's natural ease in human terrain — Swati moves through complex social situations with a lightness others labour to produce." },
    { symbol: "♥", label: "Business Intelligence",   score: 91, desc: "The merchant who reads the wind — Swati's instinct for commerce, negotiation, and the timing of trade is constitutional." },
    { symbol: "△", label: "Adaptive Resilience",     score: 93, desc: "Bent but never broken — every storm that passes through Swati's life becomes the source of a finer balance." },
    { symbol: "☽", label: "Aesthetic Refinement",    score: 90, desc: "Tula's Venus — Swati naturally gravitates toward beauty in all its forms: music, design, fashion, and human relationship." },
  ],

  careerAbilities: [
    { label: "Diplomacy & Negotiation",    score: 95 },
    { label: "Business & Commerce",        score: 94 },
    { label: "Law & Mediation",            score: 92 },
    { label: "Arts & Aesthetics",          score: 91 },
    { label: "Communication & Media",      score: 90 },
  ],
  careerNote: "Swati thrives wherever finding the balance between competing interests, navigating complex human dynamics, and building relationships that generate sustainable value are the central tasks.",

  careerClusters: [
    { symbol: "◎", title: "Diplomacy & International Relations", desc: "Embassies, international organisations, cross-cultural negotiation — Vayu's diplomatic intelligence." },
    { symbol: "◈", title: "Business & Trading",                  desc: "Commerce, international trade, financial markets — Swati's intuitive timing and negotiation mastery." },
    { symbol: "⚡", title: "Law & Mediation",                    desc: "Legal practice, alternative dispute resolution, mediation — restoring balance between competing claims." },
    { symbol: "♥", title: "Arts, Design & Fashion",             desc: "Aesthetic creation, fashion, music, design — Tula's natural domain." },
    { symbol: "△", title: "Communication & Journalism",         desc: "Media, broadcasting, public relations — Swati's social ease and communicative precision." },
    { symbol: "☽", title: "Yoga, Wellness & Healing",           desc: "Yoga instruction, Ayurveda, alternative healing — the balance of wind as restoration of health." },
  ],

  modernApps: [
    { symbol: "◎", title: "International Business Platforms",    desc: "Global trade facilitation, cross-border commerce tools, international partnership platforms." },
    { symbol: "◈", title: "LegalTech & Dispute Resolution",      desc: "Online dispute resolution, contract management, mediation platforms." },
    { symbol: "⚡", title: "Fashion & Luxury Tech",              desc: "Sustainable fashion platforms, luxury brand management, aesthetic content tools." },
    { symbol: "♥", title: "Social Media & Communication Tools",  desc: "Community platforms, professional networking, social intelligence tools." },
    { symbol: "△", title: "Wellness & Balance Apps",             desc: "Yoga platforms, mindfulness apps, holistic wellness tools — Vayu's balance in digital form." },
    { symbol: "☽", title: "Trading & FinTech",                  desc: "Investment platforms, commodity trading, financial advisory — Swati's business intuition digitalised." },
  ],

  dashaTimeline: [
    {
      planet: "Rahu", theme: "Born into the Wind",
      detail: {
        expect: "Swati opens in Rahu dasa — a wide, complex, and formative beginning for the nakshathiram of Vayu, the wind that bends without breaking. Rahu's is a long opening dasa, and the balance left at birth runs from long for births in the first pada to short for the fourth; the range shown for this dasa gives it. Childhood often involves unusual circumstances: a cosmopolitan family environment, significant travel or cultural crossing, a family business context, or an early exposure to the complexity of human relationships that other children do not encounter. Where the balance runs through the school years, they produce a socially intelligent and diplomatically gifted child — the one who mediates playground conflicts, who navigates different social groups with ease, who reads adults' dynamics before the adults themselves notice. Where it reaches adolescence, the first serious encounters with the world's unfairness arrive, with the development of Swati's characteristic response: not confrontation, but repositioning.",
        navigate: "Rahu's long opening gives Swati an early sophistication that can shade into a lack of rootedness — the wind that knows every direction but has no fixed home. The independence that is Swati's greatest strength has its shadow: the difficulty of commitment, the reluctance to be fully known, the diplomatic personality that occasionally sacrifices authenticity for social ease. The Rahu–Saturn bhukti (the table below gives when it begins and how long it lasts; for the shorter balances it falls before birth) is the most demanding sub-period; the young Swati faces the sharpest test of whether their adaptive intelligence serves genuine balance or merely personal survival.",
        focus: "Saturday Rahu shrine prayers and the cultivation of one deep, sustained commitment — a practice, a relationship, a discipline — that anchors Swati's naturally mobile intelligence. Also watch the Rahu–Venus bhukti within this dasa (the bhukti table below gives when it begins and how long it lasts). Venus is the lord of your rasi, Tula — this sub-period carries the rasi lord's warmth, aesthetic sensitivity, and social ease. Where it falls after birth, a particularly happy, affectionate, or aesthetically rich phase typically arrives in this window.",
      },
    },
    {
      planet: "Jupiter", theme: "Wisdom Guides the Wind",
      detail: {
        expect: "Jupiter dasa brings the philosophical and ethical grounding that Rahu's expansion lacked; for the later padas it begins in childhood and carries through school and college, for the first pada it begins as school closes and covers the first working years. Higher education establishes in law, business, international relations, communication, or the arts — all natural Swati territories. Career foundations are laid with the combination of social intelligence and principled conduct that Jupiter amplifies. Where marriage falls within this dasa, it is read from the seventh house and its lord, with Venus and Jupiter as the natural significators, and judged from the individual horoscope as a tendency rather than a fixed time. Travel, if not already a fixed feature, becomes so in Jupiter dasa — Swati's natural affinity for encountering different cultures and commercial contexts expresses fully here.",
        navigate: "Jupiter's generosity can produce over-commitment in young adulthood — Swati's diplomat instinct agreeing to things that the calendar and the body cannot sustain. The tendency to keep options open — another facet of Vayu's independence — must be balanced in Jupiter dasa by deliberate commitment to specific professional and relational paths. Liver health and overextension deserve attention.",
        focus: "Thursday Brihaspati worship and deliberate philosophical study — ethics, law, international affairs — that grounds Swati's natural social intelligence in principled frameworks. Also watch the Jupiter–Venus bhukti (the bhukti table below gives when it begins and how long it lasts): Venus as rasi lord brings relational, aesthetic, and commercial abundance to its first significant peak in this window.",
      },
    },
    {
      planet: "Saturn", theme: "The Wind Settles",
      detail: {
        expect: "Saturn dasa is the great settling and deepening of Swati's career and life; it begins in late adolescence or early adulthood for the later padas and in the settled working years for the first, and runs through the long middle of life. The professional reputation built in Rahu and Jupiter dasas now carries institutional weight; leadership, senior advisory, or principal partnership roles become the terrain. Family life is fully established; the responsibilities of the mature generation are assumed. The diplomat, the businessperson, or the artist of Saturn dasa is no longer the charming newcomer but the experienced practitioner whose judgement others seek.",
        navigate: "Saturn's primary tests for Swati are patience and the willingness to work within constraints. The wind does not like to be bounded by walls, but the most enduring contributions require the sustained, systematic effort that walls — structure, commitment, process — enable. The Saturn–Rahu bhukti (the table below gives when it begins and how long it lasts) is the most demanding sub-period; professional and personal pressure can converge acutely. Physical concerns: musculoskeletal, cardiovascular, and respiratory as the dasa advances.",
        focus: "Saturday oil bath, Shani worship and Hanuman worship are essential. Also watch the Saturn–Venus bhukti (the bhukti table below gives when it begins and how long it lasts): Venus as rasi lord brings a significant window of relational warmth, commercial success, and aesthetic satisfaction in the midst of Saturn's otherwise disciplined demands. Major financial milestones, the deepest relationship strengthening of the dasa, or a significant creative or commercial achievement typically lands here.",
      },
    },
    {
      planet: "Mercury", theme: "The Articulate Wind",
      detail: {
        expect: "Mercury dasa, in the later working years, brings Swati's communicative and analytical intelligence to its sharpest and most refined expression. The accumulated social and professional wisdom of a lifetime now finds voice in teaching, writing, advisory work, or the kind of negotiation and mediation that only experience produces. Mercury's affinity with commerce amplifies Swati's business intelligence; financial management, advisory, and the oversight of complex commercial relationships reach their most sophisticated form. For those in the arts, Mercury dasa produces the most analytically self-aware creative work of the life.",
        navigate: "Mercury's primary health concerns for Swati in this period are nervous system and respiratory. The tendency to scatter across too many simultaneous engagements — a lifelong Swati risk — is amplified by Mercury's naturally wide-ranging intelligence; conscious prioritisation becomes more important than ever. The Mercury–Rahu bhukti (the table below gives when it begins and how long it lasts) can bring unusual professional developments.",
        focus: "Wednesday worship, green offerings, and sustained engagement in one significant communicative or analytical legacy project. Also watch the Mercury–Venus bhukti (the bhukti table below gives when it begins and how long it lasts): Venus as rasi lord makes this window one of the most commercially and relationally fertile periods of Mercury dasa — begin the most significant project of the dasa in this window.",
      },
    },
    {
      planet: "Ketu", theme: "The Wind Grows Still",
      detail: {
        expect: "Ketu dasa, in later life, brings Swati to the stillness that the wind has always been moving toward. The social intelligence and diplomatic mastery that characterised the long years of active engagement gradually yield to a quality of inward presence — the wind that knows where it has been and rests in the knowing. Spiritual depth surfaces with unusual directness; the Vayu connection that underlies Swati's entire nature expresses through meditation, pranayama, or sacred study. Grandchildren receive a quality of undistracted presence that the working decades could not always provide.",
        navigate: "Ketu's natural withdrawal tendency at this age is appropriate; ensure it does not become complete social isolation. Physical concerns: nervous system, autoimmune, and digestive sensitivities. Spiritual companionship is as important as physical care.",
        focus: "Ganapati worship, Ketu shrine visits, pitru tharpanam, and pranayama or breathing practice as daily devotional acts. Vayu's child — the wind — finds in Ketu's stillness the source that all movement ultimately springs from.",
      },
    },
    {
      planet: "Venus", theme: "Rasi Lord — The Great Beauty",
      detail: {
        expect: "Venus dasa, in advanced age, is the rasi lord's arrival for Swati. Venus is the lord of your rasi, Tula — this makes her dasa doubly charged for Swati natives. The beauty, love, aesthetic richness, and relational warmth that have been present throughout the life now reach their fullest and most freely expressed form. Where the earlier decades required Swati to navigate, negotiate, and balance, Venus dasa simply allows the experience of beauty — music, gardens, grandchildren, art, the texture of human love. Creative work at this age has a quality of serene completion. The diplomat who has balanced competing interests across a lifetime discovers, in Venus's dasa, that balance was never the goal but only the means — the goal was beauty, and it was always here.",
        navigate: "Physical care at this age is primary: warmth, aesthetic comfort, music, and the presence of loving people. Cardiovascular and hormonal health needs gentle, consistent care. The Venus–Saturn bhukti (the table below gives when it begins and how long it lasts) demands reduced pace and careful physical management.",
        focus: "Friday Lakshmi worship, rose and jasmine offerings, music, gardens, and the sustained presence of beauty in all its forms. Vayu's child — who bent in every storm and never broke — arrives at last in the garden that was always waiting.",
      },
    },
    {
      planet: "Sun", theme: "Final Solar Balance",
      detail: {
        expect: "Sun dasa, in very advanced age, is reached by very few. For those rare Swati souls who arrive here, the Sun brings a final gift of radiant clarity — the identity that Swati's wind has carried through every storm, fully luminous. The diplomat, the merchant, the artist: all have been expressions of the same solar selfhood.",
        navigate: "Complete physical care and warmth. The clarity of identity that Sun dasa brings at this age is not an achievement but a recognition — Swati was always this.",
        focus: "Sunday Surya worship and Aditya Hridayam recitation. Tula's child ends in the Sun's clarity, balanced and whole.",
      },
    },
    {
      planet: "Moon", theme: "Tidal Completion",
      detail: {
        expect: "Moon dasa, the last in this sequence, is reached by virtually none. For those extraordinary few, the Moon brings the final tidal completion — the wind, the balance, and the love all dissolving into the oceanic feeling of a life that moved through the world with grace.",
        navigate: "Complete and tender care. The body's needs are simple; the person's spiritual presence is vast.",
        focus: "Monday worship, water offerings, and the presence of flowing water or music. Vayu's child completes in the Moon's tidal embrace.",
      },
    },
  ],

  spirituality: [
    {
      title: "Vayu & Wind Worship",
      desc: "Vayu, the wind god, is Swati's presiding deity — Hanuman worship (Vayu's son), Tuesday Anjaneya puja, and pranayama practice as daily devotional discipline are Swati's deepest spiritual connections.",
    },
    {
      title: "Tula Venus Devotion",
      desc: "Lakshmi and Tula's Venus govern Swati's aesthetic and relational nature — Friday Lakshmi worship, lotus and rose offerings, and the cultivation of beauty in daily life as spiritual practice are deeply resonant.",
    },
    {
      title: "Balance Shrines & Sacred Wind",
      desc: "Temples associated with Hanuman, Vayu, and the balance of dharma carry special resonance for Swati. The practice of yoga, particularly pranayama and balancing postures, is Vayu's devotional gift.",
    },
  ],

  guidance: "The reed that bends is not the reed that breaks. Your independence is your gift; do not mistake rootlessness for freedom. Let the wind carry you to what is genuine — genuine work, genuine love, genuine balance — and release everything that only looks like stability but isn't. Venus, your rasi lord, is the destination the wind has always been moving toward. Beauty is not the reward at the end; it is what the balanced life is made of.",

  compatibleEn: ["Thiruvathirai", "Hastham", "Visakam", "Sadayam", "Mirugaseeridam"],
  compatibleNote: "These nakshatras complement Swati's diplomatic intelligence, independent spirit, and aesthetic refinement with depth, precision, and resonant vitality.",

  ta: {
    atAGlanceLabels: ["இராஜதந்திர நுண்ணறிவு", "சுதந்திர மனப்பான்மை", "சமூக நடை", "வணிக நுண்ணறிவு", "தகவமைப்பு மீள்தன்மை"],
    radarLabels: ["இராஜதந்திரம்", "சுதந்திரம்", "சமூக நடை", "வணிகம்", "மீள்தன்மை", "சமநிலை"],
    coreStrengths: [
      { label: "இராஜதந்திர நுண்ணறிவு",  desc: "வாயுவின் காற்று — சுவாதி ஒவ்வொரு சூழலையும் படிக்கிறார், ஒவ்வொரு பதிலையும் சரிசெய்கிறார், மற்றும் எல்லா தரப்பினரும் சுவாசிக்க அனுமதிக்கும் சமநிலையை காண்கிறார்." },
      { label: "சுதந்திர மனப்பான்மை",    desc: "புயலில் வளைகிறது ஆனால் உடைவதில்லை — சுவாதியின் சுதந்திரம் பிடிவாதம் அல்ல, நடுங்காத மையம்." },
      { label: "சமூக நடை",              desc: "மனித நிலத்தில் துலாவின் இயல்பான இலகுவான தன்மை — சுவாதி மற்றவர்கள் உழைக்கும் சிக்கலான சமூக சூழ்நிலைகளில் மெல்ல நகர்கிறார்." },
      { label: "வணிக நுண்ணறிவு",        desc: "காற்றை படிக்கும் வணிகர் — வாணிஜ்யம், பேச்சுவார்த்தை, வர்த்தகத்தின் நேரம் ஆகியவற்றில் சுவாதியின் உள்ளுணர்வு இயல்பானது." },
      { label: "தகவமைப்பு மீள்தன்மை",  desc: "வளைந்தது ஆனால் ஒருபோதும் உடையவில்லை — சுவாதியின் வாழ்க்கையில் கடந்து செல்லும் ஒவ்வொரு புயலும் சுத்திகரிக்கப்பட்ட சமநிலையின் ஆதாரமாக மாறுகிறது." },
      { label: "அழகியல் செம்மைப்படுத்தல்", desc: "துலாவின் சுக்கிரன் — சுவாதி இசை, வடிவமைப்பு, நகை, மனித உறவு என அனைத்து வடிவங்களிலும் அழகை நோக்கி இயல்பாக ஈர்க்கிறார்." },
    ],
    careerAbilityLabels: ["இராஜதந்திரம் & பேச்சுவார்த்தை", "வணிகம் & வாணிஜ்யம்", "சட்டம் & மத்தியஸ்தம்", "கலை & அழகியல்", "தொடர்பு & ஊடகம்"],
    careerClusters: [
      { title: "இராஜதந்திரம் & சர்வதேச உறவுகள்", desc: "தூதரகங்கள், சர்வதேச நிறுவனங்கள், கலாசார குறுக்கு பேச்சுவார்த்தை — வாயுவின் இராஜதந்திர நுண்ணறிவு." },
      { title: "வணிகம் & வர்த்தகம்",              desc: "வாணிஜ்யம், சர்வதேச வர்த்தகம், நிதி சந்தைகள் — சுவாதியின் உள்ளுணர்வு நேரம் மற்றும் பேச்சுவார்த்தை தேர்ச்சி." },
      { title: "சட்டம் & மத்தியஸ்தம்",            desc: "சட்ட நடைமுறை, மாற்று சர்ச்சை தீர்வு, மத்தியஸ்தம் — போட்டி கூற்றுகளுக்கிடையே சமநிலை மீட்டெடுத்தல்." },
      { title: "கலை, வடிவமைப்பு & நகை",          desc: "அழகியல் படைப்பு, நகை, இசை, வடிவமைப்பு — துலாவின் இயல்பான தளம்." },
      { title: "தொடர்பு & பத்திரிகை",             desc: "ஊடகம், ஒளிபரப்பு, மக்கள் தொடர்பு — சுவாதியின் சமூக இலகுவான தன்மை மற்றும் தொடர்பு துல்லியம்." },
      { title: "யோகா, ஆரோக்கியம் & குணப்படுத்தல்", desc: "யோகா கற்பித்தல், ஆயுர்வேதம், மாற்று சிகிச்சை — ஆரோக்கியத்தின் மீட்டெடுத்தலாக காற்றின் சமநிலை." },
    ],
    modernApps: [
      { title: "சர்வதேச வணிக தளங்கள்",      desc: "உலகளாவிய வர்த்தக வசதி, எல்லை கடந்த வாணிஜ்ய கருவிகள், சர்வதேச கூட்டாண்மை தளங்கள்." },
      { title: "சட்டத்தொழில்நுட்பம் & சர்ச்சை தீர்வு", desc: "ஆன்லைன் சர்ச்சை தீர்வு, ஒப்பந்த மேலாண்மை, மத்தியஸ்த தளங்கள்." },
      { title: "நகை & ஆடம்பர தொழில்நுட்பம்",  desc: "நிலையான நகை தளங்கள், ஆடம்பர பிராண்ட் மேலாண்மை, அழகியல் உள்ளடக்க கருவிகள்." },
      { title: "சமூக ஊடகம் & தொடர்பு கருவிகள்", desc: "சமூக தளங்கள், தொழில்முறை நெட்வொர்க்கிங், சமூக நுண்ணறிவு கருவிகள்." },
      { title: "ஆரோக்கியம் & சமநிலை ஆப்கள்",     desc: "யோகா தளங்கள், மனநிறைவு ஆப்கள், ஒட்டுமொத்த ஆரோக்கிய கருவிகள் — டிஜிட்டல் வடிவில் வாயுவின் சமநிலை." },
      { title: "வர்த்தகம் & நிதி தொழில்நுட்பம்", desc: "முதலீட்டு தளங்கள், பொருட்கள் வர்த்தகம், நிதி ஆலோசனை — சுவாதியின் வணிக உள்ளுணர்வு, டிஜிட்டல் வடிவில்." },
    ],
    dashaThemes: [
      "காற்றில் பிறப்பு — ராகு விரிவாக்கம், சமூக நுண்ணறிவு, ஆரம்பகால இராஜதந்திரம்",
      "ஞானம் காற்றை வழிநடத்துகிறது — குரு தத்துவம், தொழில் நிறுவல்",
      "காற்று நிலைகொள்கிறது — சனி ஆழம், நிறுவன அங்கீகாரம்",
      "தெளிவாகப் பேசும் காற்று — புதன் தொடர்பு உச்சம்",
      "காற்று அமைதியடைகிறது — கேது ஆன்மீகம், உள்நோக்கிய இருப்பு",
      "ராசி அதிபதி — மாபெரும் அழகு — சுக்கிர தசை துலா ராசிக்கு",
      "இறுதி சூரிய சமநிலை — ஒளிர்ந்த அடையாளம்",
      "அலை நிறைவு — சந்திர இறுதி அலை",
    ],
    dashaDetails: [
      {
        expect: "சுவாதி ராகு தசையில் தொடங்குகிறது — வளையும் ஆனால் உடையாத காற்றான வாயுவின் நட்சத்திரத்துக்கு பரந்த, சிக்கலான, உருவாக்கும் தொடக்கம். ராகு நீண்ட தொடக்க தசை; பிறக்கும்போது மீதமுள்ள இருப்பு முதல் பாதத்தில் நீளமாகவும் நான்காம் பாதத்தில் குறுகியதாகவும் இருக்கும் — இந்த தசைக்குக் காட்டப்படும் வரம்பு அதைச் சொல்கிறது. குழந்தைப் பருவம் அடிக்கடி அசாதாரண சூழ்நிலைகளை உள்ளடக்குகிறது: பல பண்பாடுகள் கலந்த குடும்பச் சூழல், கணிசமான பயணம் அல்லது பண்பாட்டுக் கடப்பு, குடும்பத் தொழில் பின்னணி, அல்லது மற்ற குழந்தைகள் சந்திக்காத மனித உறவுகளின் சிக்கலுடன் ஆரம்பகால வெளிப்பாடு. இருப்பு பள்ளிக் காலம் முழுவதும் நீளுமானால், சமூக நுண்ணறிவும் இராஜதந்திரத் திறனும் கொண்ட குழந்தை உருவாகிறது — விளையாட்டுத் திடலின் மோதல்களுக்கு நடுவராகும், வெவ்வேறு சமூகக் குழுக்களை எளிதாகக் கடக்கும், பெரியவர்கள் கவனிக்கும் முன்பே அவர்களின் இயக்கவியலைப் படிக்கும் குழந்தை. வளரிளம் பருவம் வரை நீண்டால் உலகின் அநியாயத்துடன் முதல் தீவிரச் சந்திப்புகள் வருகின்றன; சுவாதியின் தனித்துவ பதிலும் வளர்கிறது: மோதல் அல்ல, மறுநிலைப்படுத்தல்.",
        navigate: "ராகுவின் நீண்ட தொடக்கம் சுவாதிக்கு, வேரின்மையாக மாறக்கூடிய ஆரம்பகால நுட்பத்தைத் தருகிறது — எல்லா திசைகளையும் அறிந்தும் நிலையான வீடு இல்லாத காற்று. சுவாதியின் மிகப் பெரிய பலமான சுதந்திரத்துக்கும் நிழல் உண்டு: உறுதிப்பாட்டில் சிரமம், முழுமையாக அறியப்படுவதில் தயக்கம், சில நேரம் சமூக இலகுவுக்காக நம்பகத்தன்மையைத் தியாகம் செய்யும் இராஜதந்திர ஆளுமை. ராகு–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்; குறைந்த இருப்பில் அது பிறப்புக்கு முன்பே வந்துவிடும்) மிகவும் கோரும் துணைக் காலம்; தன் தகவமைக்கும் நுண்ணறிவு உண்மையான சமநிலைக்குச் சேவை செய்கிறதா, வெறும் தனிப்பட்ட உயிர்வாழ்வுக்கா என்ற கூர்மையான சோதனையை இளம் சுவாதி எதிர்கொள்கிறது.",
        focus: "சனிக்கிழமை ராகு சன்னதி வழிபாடும், சுவாதியின் இயல்பாகவே நகரும் நுண்ணறிவை நங்கூரமிடும் ஒரு ஆழ்ந்த, நீடித்த அர்ப்பணத்தை — ஒரு பயிற்சி, ஒரு உறவு, ஒரு ஒழுக்கம் — வளர்ப்பதும். கவனிக்கவும்: இந்த தசைக்குள் ராகு–சுக்கிர புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்). சுக்கிரன் உங்கள் ராசியான துலாவின் அதிபதி — இந்த துணைக் காலம் ராசி அதிபதியின் அரவணைப்பு, அழகியல் உணர்திறன், சமூக இலகுத்தன்மையைக் கொண்டுவருகிறது. இது பிறப்புக்குப் பின் வருமானால், குறிப்பாக மகிழ்ச்சியான, அன்பான, அல்லது அழகியல் ரீதியாக வளமான கட்டம் பொதுவாக இந்த சாளரத்தில் வரும்.",
      },
      {
        expect: "குரு தசை ராகுவின் விரிவாக்கத்தில் இல்லாத தத்துவ, நெறி அடித்தளத்தைக் கொண்டுவருகிறது; பிந்தைய பாதங்களில் குழந்தைப் பருவத்தில் தொடங்கி பள்ளி, கல்லூரி வழியாகச் செல்கிறது; முதல் பாதத்தில் பள்ளி முடியும் தருணத்தில் தொடங்கி முதல் பணி ஆண்டுகளை உள்ளடக்குகிறது. சட்டம், வணிகம், சர்வதேச உறவுகள், தொடர்பு அல்லது கலைகளில் உயர் கல்வி நிலைபெறுகிறது — இவை அனைத்தும் சுவாதியின் இயல்பான களங்கள். குரு பெருக்கும் சமூக நுண்ணறிவும் கொள்கைப் பிடிப்புள்ள நடத்தையும் இணைந்த தன்மையுடன் தொழில் அடித்தளம் இடப்படுகிறது. இந்தத் தசைக்குள் திருமணம் அமைந்தால், அது ஜாதகத்தின் ஏழாம் வீட்டையும் அதன் அதிபதியையும் கொண்டு பார்க்கப்படுகிறது; சுக்கிரனும் குருவும் அதன் இயல்பான காரகர்கள். அது ஒரு நிலையான காலம் அல்ல, ஒரு போக்கே. பயணம் ஏற்கனவே நிலையான அம்சமாக இல்லையென்றால், குரு தசையில் அது ஆகிறது — வெவ்வேறு பண்பாடுகளையும் வணிகச் சூழல்களையும் சந்திக்கும் சுவாதியின் இயல்பான ஈர்ப்பு இங்கே முழுமையாக வெளிப்படுகிறது.",
        navigate: "குருவின் தாராளத்தன்மை இளம் வயது வந்த காலத்தில் அதீத அர்ப்பணத்தை உருவாக்கலாம் — நாட்காட்டியும் உடலும் தாங்க முடியாதவற்றுக்கு ஒப்புக்கொள்ளும் சுவாதியின் இராஜதந்திர உள்ளுணர்வு. வாயுவின் சுதந்திரத்தின் இன்னொரு பக்கமான விருப்பங்களைத் திறந்து வைக்கும் போக்கு, குரு தசையில் குறிப்பிட்ட தொழில், உறவுப் பாதைகளுக்கான வேண்டுமென்ற அர்ப்பணத்தால் சமன் செய்யப்பட வேண்டும். கல்லீரல் ஆரோக்கியமும் அதிகச் சுமையும் கவனம் பெற வேண்டும்.",
        focus: "வியாழக்கிழமை பிருஹஸ்பதி வழிபாடும், சுவாதியின் இயல்பான சமூக நுண்ணறிவைக் கொள்கைச் சட்டகங்களில் அடித்தளமிடும் வேண்டுமென்ற தத்துவ ஆய்வும் — நெறியியல், சட்டம், சர்வதேச விவகாரங்கள். கவனிக்கவும்: குரு–சுக்கிர புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்): ராசி அதிபதி சுக்கிரன் உறவு, அழகியல், வணிகச் செழிப்பை இந்த சாளரத்தில் அதன் முதல் குறிப்பிடத்தக்க உச்சத்துக்குக் கொண்டுவருகிறார்.",
      },
      {
        expect: "சனி தசை சுவாதியின் தொழிலுக்கும் வாழ்வுக்கும் மாபெரும் நிலைபெறுதலும் ஆழமாதலும்; பிந்தைய பாதங்களில் வளரிளம் பருவத்தின் முடிவிலோ இளம் வயது வந்த காலத்திலோ, முதல் பாதத்தில் நிலைபெற்ற பணி ஆண்டுகளிலோ தொடங்கி, வாழ்வின் நீண்ட நடுப்பகுதி வழியாகச் செல்கிறது. ராகு, குரு தசைகளில் கட்டிய தொழில்முறை நற்பெயர் இப்போது நிறுவன எடை கொண்டுள்ளது; தலைமை, மூத்த ஆலோசகர், அல்லது முதன்மைக் கூட்டாளிப் பங்குகள் நிலமாகின்றன. குடும்ப வாழ்க்கை முழுமையாக நிலைபெற்றுள்ளது; முதிர்ந்த தலைமுறையின் பொறுப்புகள் ஏற்கப்படுகின்றன. சனி தசையின் இராஜதந்திரி, வணிகர், அல்லது கலைஞர் இனி வசீகரமான புதியவர் அல்ல, மற்றவர்கள் தீர்ப்பை நாடும் அனுபவமிக்க பயிற்சியாளர்.",
        navigate: "சுவாதிக்கு சனியின் முதன்மைச் சோதனைகள் பொறுமையும் கட்டுப்பாடுகளுக்குள் வேலை செய்யும் மனமும். காற்று சுவர்களால் கட்டுப்படுவதை விரும்பாது, ஆனால் மிக நீடித்த பங்களிப்புகளுக்கு சுவர்கள் — கட்டமைப்பு, அர்ப்பணிப்பு, செயல்முறை — சாத்தியமாக்கும் நீடித்த, முறையான முயற்சி தேவை. சனி–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மிகவும் கோரும் துணைக் காலம்; தொழில்முறை, தனிப்பட்ட அழுத்தம் தீவிரமாக ஒன்றுசேரலாம். உடல் கவலைகள்: எலும்பு–மூட்டு–தசைநார், இதய-இரத்தக் குழாய், சுவாசம் — தசை முன்னேறும்போது.",
        focus: "சனிக்கிழமை எண்ணெய் குளியல், சனி வழிபாடு, ஆஞ்சநேயர் வழிபாடு அவசியம். சனி–சுக்கிர புக்தியையும் கவனிக்கவும் (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்): ராசி அதிபதி சுக்கிரன் சனியின் மற்றபடி ஒழுக்கமான கோரிக்கைகளின் நடுவே உறவு அரவணைப்பு, வணிக வெற்றி, அழகியல் திருப்தியின் குறிப்பிடத்தக்க சாளரத்தைக் கொண்டுவருகிறார். முக்கியமான நிதி மைல்கற்கள், இந்த தசையின் ஆழ்ந்த உறவு வலுப்படுத்தல், அல்லது குறிப்பிடத்தக்க படைப்பு அல்லது வணிகச் சாதனை பொதுவாக இங்கு வரும்.",
      },
      {
        expect: "பிற்கால பணி ஆண்டுகளில் வரும் புதன் தசை, சுவாதியின் தொடர்பு, பகுப்பாய்வு நுண்ணறிவை அதன் மிகக் கூர்மையான, மிக மெருகேறிய வெளிப்பாட்டுக்குக் கொண்டுவருகிறது. ஒரு வாழ்நாள் திரண்ட சமூக, தொழில்முறை ஞானம் இப்போது கற்பித்தல், எழுத்து, ஆலோசனைப் பணி, அல்லது அனுபவம் மட்டுமே தரும் பேச்சுவார்த்தை, மத்தியஸ்தம் ஆகியவற்றில் குரல் காண்கிறது. புதனின் வணிகத் தொடர்பு சுவாதியின் வணிக நுண்ணறிவைப் பெருக்குகிறது; நிதி மேலாண்மை, ஆலோசனை, சிக்கலான வணிக உறவுகளின் மேற்பார்வை தங்கள் மிக நுட்ப வடிவை அடைகின்றன. கலைகளில் உள்ளவர்களுக்கு, புதன் தசை வாழ்வின் மிகப் பகுப்பாய்வு சுய-விழிப்புள்ள படைப்பு வேலையை உருவாக்குகிறது.",
        navigate: "இந்த காலத்தில் சுவாதிக்கு புதனின் முதன்மை ஆரோக்கிய கவலைகள் நரம்பு மண்டலம், சுவாசம். ஒரே நேரத்தில் பல ஈடுபாடுகளில் சிதறும் போக்கு — வாழ்நாள் சுவாதி அபாயம் — புதனின் இயல்பாகவே பரந்த நுண்ணறிவால் பெருகுகிறது; உணர்வுடன் முன்னுரிமை நிர்ணயிப்பது முன்பை விட முக்கியமாகிறது. புதன்–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) அசாதாரண தொழில்முறை வளர்ச்சிகளைக் கொண்டுவரலாம்.",
        focus: "புதன்கிழமை வழிபாடு, பசுமை அர்ப்பணம், ஒரு முக்கிய தொடர்பு அல்லது பகுப்பாய்வு மரபுத் திட்டத்தில் நீடித்த ஈடுபாடு. கவனிக்கவும்: புதன்–சுக்கிர புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்): ராசி அதிபதி சுக்கிரன் இந்த சாளரத்தை புதன் தசையின் மிக வணிக ரீதியாகவும் உறவு ரீதியாகவும் வளமான காலங்களில் ஒன்றாக்குகிறார் — தசையின் மிக முக்கியமான திட்டத்தை இந்த சாளரத்தில் தொடங்குங்கள்.",
      },
      {
        expect: "பிற்கால வாழ்வில் வரும் கேது தசை, காற்று எப்போதும் நோக்கி நகர்ந்திருந்த அமைதிக்கு சுவாதியைக் கொண்டுவருகிறது. நீண்ட செயலில் ஈடுபாட்டு ஆண்டுகளை வரையறுத்த சமூக நுண்ணறிவும் இராஜதந்திரத் தேர்ச்சியும் படிப்படியாக உள்நோக்கிய இருப்புக்கு வழிவிடுகின்றன — தான் எங்கே இருந்தது என்பதை அறிந்து அந்த அறிவில் ஓய்வெடுக்கும் காற்று. ஆன்மீக ஆழம் அசாதாரண நேரடித்தன்மையுடன் மேலோங்குகிறது; சுவாதியின் முழு இயல்பிலும் அடியில் இருக்கும் வாயு இணைப்பு தியானம், பிராணாயாமம், அல்லது புனித ஆய்வு வழியாக வெளிப்படுகிறது. பேரக்குழந்தைகள், பணி தசகங்கள் எப்போதும் தர முடியாத கவனச்சிதறலற்ற இருப்பின் தரத்தைப் பெறுகிறார்கள்.",
        navigate: "இந்த வயதில் கேதுவின் இயல்பான விலகல் போக்கு பொருத்தமானதே; அது முழுமையான சமூகத் தனிமையாக மாறாமல் பார்த்துக்கொள்ளுங்கள். உடல் கவலைகள்: நரம்பு மண்டலம், தன்னெதிர்ப்பு, செரிமான உணர்திறன்கள். ஆன்மீகத் துணை உடல் பராமரிப்பைப் போலவே முக்கியம்.",
        focus: "விநாயகர் வழிபாடு, கேது சன்னதி வழிபாடு, பித்ரு தர்ப்பணம், பிராணாயாமம் அல்லது சுவாசப் பயிற்சி. வாயுவின் பிள்ளை — காற்று — கேதுவின் அமைதியில் அனைத்து இயக்கமும் இறுதியில் முளைக்கும் மூலத்தை காண்கிறார்.",
      },
      {
        expect: "முதிர்ந்த வயதில் வரும் சுக்கிர தசை சுவாதிக்கு ராசி அதிபதியின் வருகை. சுக்கிரன் உங்கள் ராசியான துலாவின் அதிபதி — இது சுவாதி ஜாதகர்களுக்கு இரட்டை வலிமையுடன் வருகிறது. வாழ்நாள் முழுவதும் இருந்த அழகு, அன்பு, அழகியல் செழிப்பு, உறவு அரவணைப்பு இப்போது தங்கள் மிக முழுமையான, மிகச் சுதந்திரமாக வெளிப்படுத்தப்பட்ட வடிவை அடைகின்றன. முந்தைய தசகங்களில் வழிசெலுத்தவும் பேச்சுவார்த்தை நடத்தவும் சமநிலைப்படுத்தவும் சுவாதி தேவைப்பட்ட இடத்தில், சுக்கிர தசை வெறுமனே அழகின் அனுபவத்தை அனுமதிக்கிறது — இசை, தோட்டங்கள், பேரக்குழந்தைகள், கலை, மனித அன்பின் அமைப்பு. இந்த வயதில் படைப்புப் பணி அமைதியான நிறைவின் தரம் கொண்டது. ஒரு வாழ்நாள் போட்டி நலன்களைச் சமநிலைப்படுத்திய இராஜதந்திரி, சுக்கிர தசையில் சமநிலை ஒருபோதும் இலக்கல்ல, வெறும் வழிமுறை மட்டுமே என்று கண்டுபிடிக்கிறார் — இலக்கு அழகு, அது எப்போதும் இங்கேயே இருந்தது.",
        navigate: "இந்த வயதில் உடல் பராமரிப்பு முதன்மை: அரவணைப்பு, அழகியல் வசதி, இசை, அன்பான மனிதர்களின் இருப்பு. இதய-இரத்தக் குழாய், ஹார்மோன் ஆரோக்கியத்துக்கு மென்மையான, நிலையான பராமரிப்பு தேவை. சுக்கிர–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) குறைந்த வேகத்தையும் கவனமான உடல் மேலாண்மையையும் கோருகிறது.",
        focus: "வெள்ளிக்கிழமை லட்சுமி வழிபாடு, ரோஜா மற்றும் மல்லிகை அர்ப்பணம். வாயுவின் பிள்ளை — ஒவ்வொரு புயலிலும் வளைந்து ஒருபோதும் உடையாதவர் — எப்போதும் காத்திருந்த தோட்டத்தில் வந்து சேர்கிறார்.",
      },
      {
        expect: "மிக முதிர்ந்த வயதில் வரும் சூரிய தசையை மிகச் சிலரே அடைகிறார்கள். இங்கு வரும் அரிய சுவாதி ஆத்மாக்களுக்கு, சூரியன் ஒளிரும் தெளிவின் இறுதிக் கொடையைக் கொண்டுவருகிறார் — சுவாதியின் காற்று ஒவ்வொரு புயலிலும் சுமந்து வந்த அடையாளம், முழுமையாக ஒளிர்கிறது. இராஜதந்திரி, வணிகர், கலைஞர் — அனைவரும் ஒரே சூரிய சுயத்தின் வெளிப்பாடுகளே.",
        navigate: "முழுமையான உடல் பராமரிப்பும் அரவணைப்பும். சுவாதி எப்போதும் இது தான் என்ற அடையாள தெளிவு.",
        focus: "ஞாயிற்றுக்கிழமை சூரிய வழிபாடு மற்றும் ஆதித்ய ஹ்ருதயம் பாராயணம். துலாவின் பிள்ளை சூரியனின் தெளிவில் சமநிலையாகவும் முழுமையாகவும் முடிகிறார்.",
      },
      {
        expect: "இந்த வரிசையின் கடைசி தசையான சந்திர தசையை நடைமுறையில் யாரும் அடைவதில்லை. அந்த அசாதாரணச் சிலருக்கு, சந்திரன் இறுதி அலை நிறைவைக் கொண்டுவருகிறார் — காற்றும் சமநிலையும் அன்பும் அருளுடன் உலகில் நகர்ந்த ஒரு வாழ்வின் கடல் உணர்வில் கரைகின்றன.",
        navigate: "முழுமையான, மென்மையான பராமரிப்பு. உடலின் தேவைகள் எளிமையானவை; அந்த நபரின் ஆன்மீக இருப்பு பரந்தது.",
        focus: "திங்கட்கிழமை வழிபாடு, நீர் அர்ப்பணம், ஓடும் நீர் அல்லது இசையின் இருப்பு. வாயுவின் பிள்ளை சந்திரனின் அலை அணைப்பில் நிறைவடைகிறது.",
      },
    ],
    spirituality: [
      { title: "வாயு & காற்று வழிபாடு",      desc: "வாயு, காற்று கடவுள், சுவாதியின் தலைமை தெய்வம் — ஆஞ்சநேயர் வழிபாடு (வாயுவின் மகன்), செவ்வாய்க்கிழமை ஆஞ்சநேயர் பூஜை, அன்றாட பக்திப் பயிற்சியாகப் பிராணாயாமம் ஆகியவை சுவாதியின் ஆழமான ஆன்மீக இணைப்புகள்." },
      { title: "துலா சுக்கிர பக்தி",         desc: "லட்சுமி மற்றும் துலாவின் சுக்கிரன் சுவாதியின் அழகியல் மற்றும் உறவு இயல்பை நிர்வகிக்கிறார்கள் — வெள்ளிக்கிழமை லட்சுமி வழிபாடு, தாமரை மற்றும் ரோஜா அர்ப்பணம்." },
      { title: "சமநிலை தலங்கள் & புனித காற்று", desc: "ஆஞ்சநேயர், வாயு, தர்மத்தின் சமநிலையுடன் தொடர்புடைய கோவில்கள் சுவாதிக்குச் சிறப்புத் தொடர்பு கொண்டுள்ளன. யோகப் பயிற்சி, குறிப்பாக பிராணாயாமமும் சமநிலை ஆசனங்களும், வாயுவுக்கான பக்தி வெளிப்பாடுகள்." },
    ],
    guidance: "வளைகிற நாணல் உடைகிற நாணல் அல்ல. உங்கள் சுதந்திரம் உங்கள் கொடை; வேரின்மையை சுதந்திரம் என்று தவறாக நினைக்காதீர்கள். காற்றை உண்மையானதற்கு கொண்டு செல்லட்டும் — உண்மையான வேலை, உண்மையான அன்பு, உண்மையான சமநிலை. சுக்கிரன், உங்கள் ராசி அதிபதி, காற்று எப்போதும் நோக்கி நகர்ந்திருந்த இலக்கு. அழகு இறுதியில் வரும் பரிசு அல்ல; அது சமநிலை வாழ்க்கை உருவாக்கப்பட்டதிலிருந்து.",
    careerNote: "போட்டி நலன்களுக்கிடையே சமநிலை காண்பது, சிக்கலான மனித இயக்கவியலை வழிநடத்துவது, நிலையான மதிப்பை உருவாக்கும் உறவுகளை கட்டுவது ஆகியவை மையப் பணிகளாக இருக்கும் இடங்களில் சுவாதி சிறப்பாக செயல்படுகிறார்.",
    modernLead: "சுவாதியின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "இராஜதந்திர நுண்ணறிவு, சுதந்திர மனப்பான்மை, அழகியல் செம்மைப்படுத்தல் சுவாதியின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function SwatiVisualPage() {
  return <NatchathiramVisualContent data={SWATI} visual={SWATI_VISUAL} timings={dasaTimingsFor(SWATI.number)} />;
}
