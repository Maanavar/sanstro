import type { Metadata } from "next";
import { SWATI } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

export const metadata: Metadata = {
  title: "Swati Nakshathiram — Visual Profile | Vinaadi",
  description: "Visual profile of Swati Nakshathiram: personality traits, career strengths, dasha timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/swati/visual" },
  openGraph: {
    title: "Swati Nakshathiram — Visual Profile",
    description: "Visual profile of Swati Nakshathiram: personality traits, career strengths, dasha timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/swati/visual",
    type: "article",
  },
};

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
      planet: "Rahu", period: "18 yrs", ageRange: "Age 0–18", theme: "Born into the Wind",
      detail: {
        expect: "Swati opens in Rahu dasha — a wide, complex, and formative beginning for the nakshathiram of Vayu, the wind that bends without breaking. Childhood (0–7) often involves unusual circumstances: a cosmopolitan family environment, significant travel or cultural crossing, a family business context, or an early exposure to the complexity of human relationships that other children do not encounter. School years (7–14) produce a socially intelligent and diplomatically gifted child — the one who mediates playground conflicts, who navigates different social groups with ease, who reads adults' dynamics before the adults themselves notice. Adolescence (14–18) brings the first serious encounters with the world's unfairness and the development of Swati's characteristic response: not confrontation, but repositioning.",
        navigate: "Rahu's 18-year opening gives Swati an early sophistication that can shade into a lack of rootedness — the wind that knows every direction but has no fixed home. The independence that is Swati's greatest strength has its shadow: the difficulty of commitment, the reluctance to be fully known, the diplomatic personality that occasionally sacrifices authenticity for social ease. Rahu–Saturn antardasha (~yr 12 of Rahu, ~ages 12–14) is the most demanding sub-period; the adolescent Swati faces the sharpest test of whether their adaptive intelligence serves genuine balance or merely personal survival.",
        focus: "Saturday Rahu shrine prayers and the cultivation of one deep, sustained commitment — a practice, a relationship, a discipline — that anchors Swati's naturally mobile intelligence. Also watch the Rahu–Venus antardasha within this dasha (arriving approximately in the 3rd year of Rahu, around age 3). Venus is the lord of your rasi, Tula — this sub-period carries the rasi lord's early warmth, aesthetic sensitivity, and social ease. A particularly happy, affectionate, or aesthetically rich early childhood phase typically arrives in this window.",
      },
    },
    {
      planet: "Jupiter", period: "16 yrs", ageRange: "Age 18–34", theme: "Wisdom Guides the Wind",
      detail: {
        expect: "Jupiter dasha from 18 to 34 brings the philosophical and ethical grounding that Rahu's expansion lacked. Higher education establishes in law, business, international relations, communication, or the arts — all natural Swati territories. Career foundations are laid with the combination of social intelligence and principled conduct that Jupiter amplifies. Marriage enters in Jupiter–Venus antardasha (~yr 4, ~ages 22–23) or Jupiter–Moon (~yr 7, ~ages 25–26). Travel, if not already a fixed feature, becomes so in Jupiter dasha — Swati's natural affinity for encountering different cultures and commercial contexts expresses fully here.",
        navigate: "Jupiter's generosity can produce over-commitment in young adulthood — Swati's diplomat instinct agreeing to things that the calendar and the body cannot sustain. The tendency to keep options open — another facet of Vayu's independence — must be balanced in Jupiter dasha by deliberate commitment to specific professional and relational paths. Liver health and overextension deserve attention.",
        focus: "Thursday Brihaspati worship and deliberate philosophical study — ethics, law, international affairs — that grounds Swati's natural social intelligence in principled frameworks. Also watch Jupiter–Venus antardasha (~yr 4, ~ages 22–23): Venus as rasi lord brings relational, aesthetic, and commercial abundance to its first significant peak in this 20-month window.",
      },
    },
    {
      planet: "Saturn", period: "19 yrs", ageRange: "Age 34–53", theme: "The Wind Settles",
      detail: {
        expect: "Saturn dasha from 34 to 53 is the great settling and deepening of Swati's career and life. The professional reputation built in Rahu and Jupiter dashas now carries institutional weight; leadership, senior advisory, or principal partnership roles become the terrain. Family life is fully established; children are in school and approaching adolescence; the responsibilities of the mature generation are assumed. The diplomat, the businessperson, or the artist of Saturn dasha is no longer the charming newcomer but the experienced practitioner whose judgement others seek.",
        navigate: "Saturn's primary tests for Swati are patience and the willingness to work within constraints. The wind does not like to be bounded by walls, but the most enduring contributions require the sustained, systematic effort that walls — structure, commitment, process — enable. Saturn–Rahu antardasha (~yr 12 of Saturn, ~ages 46–48) is the most demanding sub-period; professional and personal pressure can converge acutely. Physical concerns: musculoskeletal, cardiovascular, and respiratory from the early forties.",
        focus: "Saturday oil bath and Shani worship are essential. Also watch Saturn–Venus antardasha (~yr 10 of Saturn, ~ages 44–46): Venus as rasi lord brings a significant 20-month window of relational warmth, commercial success, and aesthetic satisfaction in the midst of Saturn's otherwise disciplined demands. Major financial milestones, the deepest relationship strengthening of the decade, or a significant creative or commercial achievement typically lands here.",
      },
    },
    {
      planet: "Mercury", period: "17 yrs", ageRange: "Age 53–70", theme: "The Articulate Wind",
      detail: {
        expect: "Mercury dasha from 53 to 70 brings Swati's communicative and analytical intelligence to its sharpest and most refined expression. The accumulated social and professional wisdom of five decades now finds voice in teaching, writing, advisory work, or the kind of negotiation and mediation that only experience produces. Mercury's affinity with commerce amplifies Swati's business intelligence; financial management, advisory, and the oversight of complex commercial relationships reach their most sophisticated form. For those in the arts, Mercury dasha produces the most analytically self-aware creative work of the life.",
        navigate: "Mercury's primary health concerns for Swati in this period are nervous system and respiratory. The tendency to scatter across too many simultaneous engagements — a lifelong Swati risk — is amplified by Mercury's naturally wide-ranging intelligence; conscious prioritisation becomes more important than ever. Mercury–Rahu antardasha (~yr 2 of Mercury, ~ages 55–56) can bring unusual professional developments.",
        focus: "Wednesday worship, green offerings, and sustained engagement in one significant communicative or analytical legacy project. Also watch Mercury–Venus antardasha (~yr 1 of Mercury, ~ages 53–55): Venus as rasi lord makes the opening 20 months of Mercury dasha one of the most commercially and relationally fertile periods of the decade — begin the most significant project of Mercury dasha in this window.",
      },
    },
    {
      planet: "Ketu", period: "7 yrs", ageRange: "Age 70–77", theme: "The Wind Grows Still",
      detail: {
        expect: "Ketu dasha from 70 to 77 brings Swati to the stillness that the wind has always been moving toward. The social intelligence and diplomatic mastery that characterised five decades of active engagement gradually yield to a quality of inward presence — the wind that knows where it has been and rests in the knowing. Spiritual depth surfaces with unusual directness; the Vayu connection that underlies Swati's entire nature expresses through meditation, pranayama, or sacred study. Grandchildren receive a quality of undistracted presence that the working decades could not always provide.",
        navigate: "Ketu's natural withdrawal tendency at this age is appropriate; ensure it does not become complete social isolation. Physical concerns: nervous system, autoimmune, and digestive sensitivities. Spiritual companionship is as important as physical care.",
        focus: "Ketu shrine visits, pitru tharpanam, and pranayama or breathing practice as daily devotional acts. Vayu's child — the wind — finds in Ketu's stillness the source that all movement ultimately springs from.",
      },
    },
    {
      planet: "Venus", period: "20 yrs", ageRange: "Age 77–97", theme: "Rasi Lord — The Great Beauty",
      detail: {
        expect: "Venus dasha from 77 to 97 is the rasi lord's arrival for Swati. Venus is the lord of your rasi, Tula — this makes her dasha doubly charged for Swati natives. The beauty, love, aesthetic richness, and relational warmth that have been present throughout the life now reach their fullest and most freely expressed form. Where the earlier decades required Swati to navigate, negotiate, and balance, Venus dasha simply allows the experience of beauty — music, gardens, grandchildren, art, the texture of human love. Creative work at this age has a quality of serene completion. The diplomat who has balanced competing interests for seven decades discovers, in Venus's dasha, that balance was never the goal but only the means — the goal was beauty, and it was always here.",
        navigate: "Physical care at this age is primary: warmth, aesthetic comfort, music, and the presence of loving people. Cardiovascular and hormonal health needs gentle, consistent care. Venus–Saturn antardasha (~yr 14 of Venus, ~ages 91–93) demands reduced pace and careful physical management.",
        focus: "Friday Lakshmi worship, rose and jasmine offerings, music, gardens, and the sustained presence of beauty in all its forms. Vayu's child — who bent in every storm and never broke — arrives at last in the garden that was always waiting.",
      },
    },
    {
      planet: "Sun", period: "6 yrs", ageRange: "Age 97–103", theme: "Final Solar Balance",
      detail: {
        expect: "Sun dasha from 97 to 103 is reached by very few. For those rare Swati souls who arrive here, the Sun brings a final gift of radiant clarity — the identity that Swati's wind has carried through every storm, fully luminous. The diplomat, the merchant, the artist: all have been expressions of the same solar selfhood.",
        navigate: "Complete physical care and warmth. The clarity of identity that Sun dasha brings at this age is not an achievement but a recognition — Swati was always this.",
        focus: "Sunday Surya worship and Aditya Hridayam recitation. Tula's child ends in the Sun's clarity, balanced and whole.",
      },
    },
    {
      planet: "Moon", period: "10 yrs", ageRange: "Age 103–113", theme: "Tidal Completion",
      detail: {
        expect: "Moon dasha from 103 to 113 is reached by virtually none. For those extraordinary few, the Moon brings the final tidal completion — the wind, the balance, and the love all dissolving into the oceanic feeling of a life that moved through the world with grace.",
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

  compatibleEn: ["Ardra", "Hasta", "Vishakha", "Shatabhisha", "Mrigashira"],
  compatibleNote: "These nakshatras complement Swati's diplomatic intelligence, independent spirit, and aesthetic refinement with depth, precision, and resonant vitality.",

  ta: {
    atAGlanceLabels: ["இராஜதந்திர நுண்ணறிவு", "சுதந்திர மனப்பான்மை", "சமூக நடை", "வணிக நுண்ணறிவு", "தகவமைப்பு மீள்தன்மை"],
    radarLabels: ["இராஜதந்திரம்", "சுதந்திரம்", "சமூக நடை", "வணிகம்", "மீள்தன்மை", "சமநிலை"],
    coreStrengths: [
      { label: "இராஜதந்திர நுண்ணறிவு",  desc: "வாயுவின் காற்று — சாதி ஒவ்வொரு அறையையும் படிக்கிறார், ஒவ்வொரு பதிலையும் சரிசெய்கிறார், மற்றும் எல்லா தரப்பினரும் சுவாசிக்க அனுமதிக்கும் சமநிலையை காண்கிறார்." },
      { label: "சுதந்திர மனப்பான்மை",    desc: "புயலில் வளைகிறது ஆனால் உடைவதில்லை — சாதியின் சுதந்திரம் பிடிவாதம் அல்ல, நடுங்காத மையம்." },
      { label: "சமூக நடை",              desc: "மனித நிலத்தில் துலாவின் இயல்பான இலகுவான தன்மை — சாதி மற்றவர்கள் உழைக்கும் சிக்கலான சமூக சூழ்நிலைகளில் மெல்ல நகர்கிறார்." },
      { label: "வணிக நுண்ணறிவு",        desc: "காற்றை படிக்கும் வணிகர் — வாணிஜ்யம், பேச்சுவார்த்தை, வர்த்தகத்தின் நேரம் ஆகியவற்றில் சாதியின் உள்ளுணர்வு இயல்பானது." },
      { label: "தகவமைப்பு மீள்தன்மை",  desc: "வளைந்தது ஆனால் ஒருபோதும் உடையவில்லை — சாதியின் வாழ்க்கையில் கடந்து செல்லும் ஒவ்வொரு புயலும் சுத்திகரிக்கப்பட்ட சமநிலையின் ஆதாரமாக மாறுகிறது." },
      { label: "அழகியல் செம்மைப்படுத்தல்", desc: "துலாவின் சுக்கிரன் — சாதி இசை, வடிவமைப்பு, நகை, மனித உறவு என அனைத்து வடிவங்களிலும் அழகை நோக்கி இயல்பாக ஈர்க்கிறார்." },
    ],
    careerAbilityLabels: ["இராஜதந்திரம் & பேச்சுவார்த்தை", "வணிகம் & வாணிஜ்யம்", "சட்டம் & மத்தியஸ்தம்", "கலை & அழகியல்", "தொடர்பு & ஊடகம்"],
    careerClusters: [
      { title: "இராஜதந்திரம் & சர்வதேச உறவுகள்", desc: "தூதரகங்கள், சர்வதேச நிறுவனங்கள், கலாசார குறுக்கு பேச்சுவார்த்தை — வாயுவின் இராஜதந்திர நுண்ணறிவு." },
      { title: "வணிகம் & வர்த்தகம்",              desc: "வாணிஜ்யம், சர்வதேச வர்த்தகம், நிதி சந்தைகள் — சாதியின் உள்ளுணர்வு நேரம் மற்றும் பேச்சுவார்த்தை தேர்ச்சி." },
      { title: "சட்டம் & மத்தியஸ்தம்",            desc: "சட்ட நடைமுறை, மாற்று சர்ச்சை தீர்வு, மத்தியஸ்தம் — போட்டி கூற்றுகளுக்கிடையே சமநிலை மீட்டெடுத்தல்." },
      { title: "கலை, வடிவமைப்பு & நகை",          desc: "அழகியல் படைப்பு, நகை, இசை, வடிவமைப்பு — துலாவின் இயல்பான தளம்." },
      { title: "தொடர்பு & பத்திரிகை",             desc: "ஊடகம், ஒளிபரப்பு, மக்கள் தொடர்பு — சாதியின் சமூக இலகுவான தன்மை மற்றும் தொடர்பு துல்லியம்." },
      { title: "யோகா, ஆரோக்யம் & குணப்படுத்தல்", desc: "யோகா கற்பித்தல், ஆயுர்வேதம், மாற்று சிகிச்சை — ஆரோக்யத்தின் மீட்டெடுத்தலாக காற்றின் சமநிலை." },
    ],
    modernApps: [
      { title: "சர்வதேச வணிக தளங்கள்",      desc: "உலகளாவிய வர்த்தக வசதி, எல்லை கடந்த வாணிஜ்ய கருவிகள், சர்வதேச கூட்டாண்மை தளங்கள்." },
      { title: "சட்டத்தொழில்நுட்பம் & சர்ச்சை தீர்வு", desc: "ஆன்லைன் சர்ச்சை தீர்வு, ஒப்பந்த மேலாண்மை, மத்தியஸ்த தளங்கள்." },
      { title: "நகை & ஆடம்பர தொழில்நுட்பம்",  desc: "நிலையான நகை தளங்கள், ஆடம்பர பிராண்ட் மேலாண்மை, அழகியல் உள்ளடக்க கருவிகள்." },
      { title: "சமூக ஊடகம் & தொடர்பு கருவிகள்", desc: "சமூக தளங்கள், தொழில்முறை நெட்வொர்க்கிங், சமூக நுண்ணறிவு கருவிகள்." },
      { title: "ஆரோக்யம் & சமநிலை ஆப்கள்",     desc: "யோகா தளங்கள், மனநிறைவு ஆப்கள், ஒட்டுமொத்த ஆரோக்ய கருவிகள் — டிஜிட்டல் வடிவில் வாயுவின் சமநிலை." },
      { title: "வர்த்தகம் & நிதி தொழில்நுட்பம்", desc: "முதலீட்டு தளங்கள், பொருட்கள் வர்த்தகம், நிதி ஆலோசனை — டிஜிட்டலாக்கப்பட்ட சாதியின் வணிக உள்ளுணர்வு." },
    ],
    dashaThemes: [
      "காற்றில் பிறப்பு — ராகு விரிவாக்கம், சமூக நுண்ணறிவு, ஆரம்பகால இராஜதந்திரம்",
      "ஞானம் காற்றை வழிநடத்துகிறது — குரு தத்துவம், தொழில் நிறுவல்",
      "காற்று நிலைகொள்கிறது — சனி ஆழம், நிறுவன அங்கீகாரம்",
      "சொல்லாட்சி காற்று — புதன் தொடர்பு உச்சம்",
      "காற்று அமைதியடைகிறது — கேது ஆன்மீகம், உள்நோக்கிய இருப்பு",
      "ராசி அதிபதி — மாபெரும் அழகு — சுக்கிர தசை துலா ராசிக்கு",
      "இறுதி சூரிய சமநிலை — ஒளிர்ந்த அடையாளம்",
      "கோடை நிறைவு — சந்திர இறுதி அலை",
    ],
    dashaDetails: [
      {
        expect: "சாதி ராகு தசையில் திறக்கிறார் — வாயுவின் நட்சத்திரத்திற்கு பரந்த, சிக்கலான, உருவாக்கும் ஆரம்பம். குழந்தை பருவம் (0–7) அடிக்கடி அசாதாரண சூழ்நிலைகளை உள்ளடக்குகிறது. பள்ளி ஆண்டுகள் (7–14) சமூகமாக நுண்ணறிவுமிக்க மற்றும் இராஜதந்திர திறனுள்ள குழந்தையை உருவாக்குகின்றன.",
        navigate: "ராகுவின் 18 ஆண்டு திறப்பு சாதிக்கு வேர்கொள்ளாமையை சேர்க்கும் ஆரம்பகால நட்புவட்டத்தை கொடுக்கிறது. ராகு–சனி (~yr 12, ~12–14 வயது) மிகவும் கோரும் துணை காலம். கவனிக்கவும்: ராகு–சுக்கிர (~yr 3, ~3 வயது) — ராசி அதிபதியின் ஆரம்பகால அழகியல் உணர்திறன் மற்றும் சமூக இலகுவான தன்மை.",
        focus: "சனிக்கிழமை ராகு சன்னதி வழிபாடு. ஒரு ஆழமான, நீடித்த அர்ப்பணத்தை வளர்ப்பது — சாதியின் இயல்பான நகரும் நுண்ணறிவை நங்கூரப்படுத்துகிறது.",
      },
      {
        expect: "குரு தசை 18 முதல் 34 வரை ராகுவின் விரிவாக்கத்திற்கு தத்துவ மற்றும் நெறியியல் அடித்தளத்தை கொண்டு வருகிறது. சட்டம், வணிகம், சர்வதேச உறவுகளில் உயர் கல்வி நிறுவுகிறது. திருமணம் குரு–சுக்கிர (~yr 4, ~22–23 வயது) அல்லது குரு–சந்திர (~yr 7, ~25–26 வயது). சாதியின் சமூக நுண்ணறிவும் நன்னடத்தையும் இணைவது குருவால் அதிகரிக்கப்படுகிறது.",
        navigate: "குருவின் தாராளத்தன்மை இளம் வயதிலில் அதிக அர்ப்பணத்தை உருவாக்கலாம். குரு–சுக்கிர (~yr 4, ~22–23 வயது): ராசி அதிபதி இணை, தொழில்முறை, அழகியல் செழிப்பை அதன் முதல் முக்கியமான உச்சத்திற்கு கொண்டு வருகிறார்.",
        focus: "வியாழக்கிழமை பிருஹஸ்பதி வழிபாடு மற்றும் நன்னடத்தை தத்துவ ஆய்வு — நெறியியல், சட்டம், சர்வதேச உறவுகள்.",
      },
      {
        expect: "சனி தசை 34 முதல் 53 வரை சாதியின் தொழில் மற்றும் வாழ்க்கையின் மாபெரும் நிலைபெறுதல் மற்றும் ஆழமடைதல். தொழில்முறை நற்பெயர் நிறுவன எடையை கொண்டுள்ளது; தலைமை, மூத்த ஆலோசக, அல்லது முதன்மை கூட்டாண்மை பங்குகள் நிலமாக மாறுகிறது.",
        navigate: "சனியின் முதன்மையான சோதனைகள் பொறுமை மற்றும் கட்டுப்பாடுகளுக்குள் வேலை செய்ய விருப்பம். ராகு–சனி (~yr 12, ~46–48 வயது) மிகவும் கோரும் துணை காலம். சனி–சுக்கிர (~yr 10, ~44–46 வயது): ராசி அதிபதி உறவு அரவணைப்பு, வணிக வெற்றி, முக்கியமான நிதி மைல்கற்கல் கொண்டு வருகிறார்.",
        focus: "சனிக்கிழமை எண்ணெய் குளியல் மற்றும் சனி வழிபாடு. சனி–சுக்கிர சாளரத்திற்கு திட்டமிடுங்கள்.",
      },
      {
        expect: "புதன் தசை 53 முதல் 70 வரை சாதியின் தொடர்பு மற்றும் பகுப்பாய்வு நுண்ணறிவை மிகவும் கூர்மையான மற்றும் செம்மைப்படுத்தப்பட்ட வெளிப்பாட்டிற்கு கொண்டு வருகிறது. கற்பித்தல், எழுத்து, ஆலோசக வேலை, பேச்சுவார்த்தை மற்றும் மத்தியஸ்தம் ஆகியவை உச்சம் அடைகின்றன.",
        navigate: "ஒரே நேரத்தில் பல ஈடுபாடுகளில் சிதறும் போக்கு — வாழ்நாள் சாதி அபாயம் — புதனின் பரந்த நுண்ணறிவால் அதிகரிக்கப்படுகிறது. புதன்–சுக்கிர (~yr 1, ~53–55 வயது): ராசி அதிபதி புதன் தசையின் திறப்பு 20 மாதங்களை மிகவும் வணிகமாகவும் உறவு ரீதியாகவும் வளமான செய்கிறார்.",
        focus: "புதன்கிழமை வழிபாடு, பசுமை அர்ப்பணம். புதன் தசையின் முக்கியமான திட்டத்தை சுக்கிர-புதன் சாளரத்தில் தொடங்குங்கள்.",
      },
      {
        expect: "கேது தசை 70 முதல் 77 வரை சாதியை காற்று எப்போதும் நோக்கி நகர்ந்திருந்த அமைதிக்கு கொண்டு வருகிறது. ஐந்து தசகங்களின் இராஜதந்திர தேர்ச்சி படிப்படியாக உள்நோக்கிய இருப்பிற்கு வழிவிடுகிறது. ஆன்மீக ஆழம் நேரடியாக மேலோங்குகிறது.",
        navigate: "கேதுவின் திரும்பல் இந்த வயதில் பொருத்தமானது. ஆன்மீக துணையும் உடல் பராமரிப்பும் சேர்ந்து உறுதிசெய்யுங்கள்.",
        focus: "கேது சன்னதி வழிபாடு, பித்ரு தர்ப்பணம், பிராணாயாமம் அல்லது சுவாச நடைமுறை. வாயுவின் பிள்ளை — காற்று — கேதுவின் அமைதியில் அனைத்து இயக்கமும் இறுதியில் முளைக்கும் மூலத்தை காண்கிறார்.",
      },
      {
        expect: "சுக்கிர தசை 77 முதல் 97 வரை சாதிக்கு ராசி அதிபதியின் வருகை. சுக்கிரன் உங்கள் ராசியான துலாவின் அதிபதி — இது சாதி நேயர்களுக்கு இரட்டை வலிமையுடன் வருகிறது. அழகு, அன்பு, அழகியல் செழிப்பு, உறவு அரவணைப்பு அதிக சுதந்திரமாக வெளிப்படுத்தப்பட்ட வடிவத்தை அடைகின்றன. இராஜதந்திரி ஏழு தசகங்கள் போட்டி நலன்களை சமநிலைப்படுத்தினார், சுக்கிர தசையில் சமநிலை இலக்கல்ல ஆனால் ஒரு வழிமுறை மட்டுமே என்று கண்டுபிடிக்கிறார் — இலக்கு அழகு, மற்றும் அது எப்போதும் இங்கே இருந்தது.",
        navigate: "இந்த வயதில் உடல் பராமரிப்பு முதன்மை. சுக்கிர–சனி (~yr 14, ~91–93 வயது) குறைந்த வேகம் மற்றும் கவனமான உடல் மேலாண்மையை கோருகிறது.",
        focus: "வெள்ளிக்கிழமை லட்சுமி வழிபாடு, ரோஜா மற்றும் மல்லிகை அர்ப்பணம். வாயுவின் பிள்ளை — ஒவ்வொரு புயலிலும் வளைந்து ஒருபோதும் உடையாதவர் — எப்போதும் காத்திருந்த தோட்டத்தில் வந்து சேர்கிறார்.",
      },
      {
        expect: "சூரியன் தசை 97 முதல் 103 வரை மிகச் சிலரால் அடையப்படுகிறது. இந்த அரிய சாதி ஆத்மாக்களுக்கு, சூரியன் இறுதி ஒளிர்ந்த தெளிவைக் கொண்டு வருகிறது.",
        navigate: "முழுமையான உடல் பராமரிப்பும் அரவணைப்பும். சாதி எப்போதும் இது தான் என்ற அடையாள தெளிவு.",
        focus: "ஞாயிற்றுக்கிழமை சூரிய வழிபாடு மற்றும் ஆதித்ய ஹ்ருதயம் பாராயணம். துலாவின் பிள்ளை சூரியனின் தெளிவில் சமநிலையாகவும் முழுமையாகவும் முடிகிறார்.",
      },
    ],
    spirituality: [
      { title: "வாயு & காற்று வழிபாடு",      desc: "வாயு, காற்று கடவுள், சாதியின் தலைமை தெய்வம் — அஞ்சனேயர் வழிபாடு (வாயுவின் மகன்), செவ்வாய் அஞ்சனேயர் பூஜை, பிராணாயாம நடைமுறை ஆகியவை சாதியின் ஆழமான ஆன்மீக இணைப்புகள்." },
      { title: "துலா சுக்கிர பக்தி",         desc: "லட்சுமி மற்றும் துலாவின் சுக்கிரன் சாதியின் அழகியல் மற்றும் உறவு இயல்பை நிர்வகிக்கிறார்கள் — வெள்ளிக்கிழமை லட்சுமி வழிபாடு, தாமரை மற்றும் ரோஜா அர்ப்பணம்." },
      { title: "சமநிலை தலங்கள் & புனித காற்று", desc: "அஞ்சனேயர், வாயு, தர்மத்தின் சமநிலையுடன் தொடர்புடைய கோவில்கள் சாதிக்கு சிறப்பு ஒத்தொலிப்பு கொண்டுள்ளன. யோகா நடைமுறை, குறிப்பாக பிராணாயாமம் மற்றும் சமநிலை ஆசனங்கள், வாயுவின் பக்தி கொடை." },
    ],
    guidance: "வளைகிற நாணல் உடைகிற நாணல் அல்ல. உங்கள் சுதந்திரம் உங்கள் கொடை; வேரின்மையை சுதந்திரம் என்று தவறாக நினைக்காதீர்கள். காற்றை உண்மையானதற்கு கொண்டு செல்லட்டும் — உண்மையான வேலை, உண்மையான அன்பு, உண்மையான சமநிலை. சுக்கிரன், உங்கள் ராசி அதிபதி, காற்று எப்போதும் நோக்கி நகர்ந்திருந்த இலக்கு. அழகு இறுதியில் வரும் பரிசு அல்ல; அது சமநிலை வாழ்க்கை உருவாக்கப்பட்டதிலிருந்து.",
    careerNote: "போட்டி நலன்களுக்கிடையே சமநிலை காண்பது, சிக்கலான மனித இயக்கவியலை வழிநடத்துவது, நிலையான மதிப்பை உருவாக்கும் உறவுகளை கட்டுவது ஆகியவை மையப் பணிகளாக இருக்கும் இடங்களில் சாதி சிறப்பாக செயல்படுகிறார்.",
    modernLead: "சாதியின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "இராஜதந்திர நுண்ணறிவு, சுதந்திர மனப்பான்மை, அழகியல் செம்மைப்படுத்தல் சாதியின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function SwatiVisualPage() {
  return <NatchathiramVisualContent data={SWATI} visual={SWATI_VISUAL} />;
}
