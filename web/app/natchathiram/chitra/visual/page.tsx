import type { Metadata } from "next";
import { CHITRA } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

export const metadata: Metadata = {
  title: "Chitra Nakshathiram — Visual Profile | Vinaadi",
  description: "Visual profile of Chitra Nakshathiram: personality traits, career strengths, dasha timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/chitra/visual" },
  openGraph: {
    title: "Chitra Nakshathiram — Visual Profile",
    description: "Visual profile of Chitra Nakshathiram: personality traits, career strengths, dasha timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/chitra/visual",
    type: "article",
  },
};

const CHITRA_VISUAL: NatchathiramVisualData = {
  atAGlance: [
    { label: "Aesthetic Vision",      score: 97 },
    { label: "Design Mastery",        score: 95 },
    { label: "Structural Intelligence", score: 93 },
    { label: "Magnetic Presence",     score: 91 },
    { label: "Creative Ambition",     score: 92 },
  ],

  radar: {
    labels: ["Aesthetics", "Design", "Structure", "Magnetism", "Ambition", "Precision"],
    values: [97, 95, 93, 91, 92, 90],
  },

  coreStrengths: [
    { symbol: "◎", label: "Aesthetic Vision",          score: 97, desc: "Tvashta's heir — Chitra sees the form that is not yet visible and brings it into existence with the divine craftsperson's certainty." },
    { symbol: "◈", label: "Design Mastery",             score: 95, desc: "Architecture, fashion, jewellery, digital design — Chitra's eye calibrates beauty with an accuracy that others can only approximate." },
    { symbol: "⚡", label: "Structural Intelligence",   score: 93, desc: "Beauty and function as one — Chitra never sacrifices the one for the other; the best design is both completely beautiful and completely right." },
    { symbol: "♥", label: "Magnetic Presence",         score: 91, desc: "The bright jewel — Chitra draws attention without seeking it, a natural luminosity that other people simply notice." },
    { symbol: "△", label: "Creative Ambition",         score: 92, desc: "Mars and Tvashta together — Chitra wants to make something that matters, and they have the drive to see it through." },
    { symbol: "☽", label: "Precise Execution",         score: 90, desc: "The craftsperson who does not release work until it is right — Chitra's perfectionism is not neurosis but professional standard." },
  ],

  careerAbilities: [
    { label: "Architecture & Spatial Design",  score: 97 },
    { label: "Fashion & Jewellery Design",     score: 95 },
    { label: "Graphic & Digital Design",       score: 93 },
    { label: "Engineering & Construction",     score: 91 },
    { label: "Performing & Visual Arts",       score: 92 },
  ],
  careerNote: "Chitra thrives wherever beauty, structure, and the maker's intelligence combine — the architect who builds enduring forms, the designer who makes the world more beautiful, the engineer whose structures are also elegant.",

  careerClusters: [
    { symbol: "◎", title: "Architecture & Spatial Design",  desc: "Buildings, interiors, urban design — Tvashta's divine architecture expressed through Chitra's hands." },
    { symbol: "◈", title: "Fashion & Jewellery",            desc: "Clothing design, textile arts, jewellery — the personal aesthetic made into wearable form." },
    { symbol: "⚡", title: "Graphic & Digital Design",      desc: "Visual communication, branding, UI/UX — Chitra's eye calibrating beauty at screen scale." },
    { symbol: "♥", title: "Engineering & Construction",    desc: "Civil, structural, mechanical engineering — the structure that is also beautiful." },
    { symbol: "△", title: "Performing Arts & Film",        desc: "Acting, direction, cinematography, dance — Chitra's magnetic presence in performance." },
    { symbol: "☽", title: "Fine Art & Sculpture",          desc: "Painting, sculpture, installation — the pure creative act of making form from vision." },
  ],

  modernApps: [
    { symbol: "◎", title: "Architectural Tech & PropTech",  desc: "BIM software, digital twin platforms, parametric design tools — Chitra building in the digital dimension." },
    { symbol: "◈", title: "Fashion Tech & Wearable Design", desc: "Sustainable fashion platforms, digital fashion, wearable technology design." },
    { symbol: "⚡", title: "UI/UX & Product Design",        desc: "Digital product design, user experience platforms, interaction design tools." },
    { symbol: "♥", title: "3D Printing & Digital Making",   desc: "Additive manufacturing, digital fabrication, maker technology — Tvashta in the digital workshop." },
    { symbol: "△", title: "Streaming & Visual Content",     desc: "Video production, cinematography platforms, visual storytelling media." },
    { symbol: "☽", title: "Luxury & Brand Design",          desc: "Luxury brand development, premium visual identity, high-end aesthetic consulting." },
  ],

  dashaTimeline: [
    {
      planet: "Mars", period: "7 yrs", ageRange: "Age 0–7", theme: "Born in the Maker's Fire",
      detail: {
        expect: "Chitra opens in Mars dasha — a fiery, purposeful beginning that establishes the creative drive from the very first years. Infancy and earliest childhood show the hallmarks: the child who insists on arranging, the one who is unsatisfied with approximation, the young person whose attention to the visual and spatial detail of their environment is noticed by everyone around them. Mars gives Chitra an early confidence in making that plants the root of a lifetime's creative ambition. The family environment in these seven years — its aesthetic quality, the access to creative materials, the degree to which the child's visual intelligence is recognised and nurtured — shapes the entire life.",
        navigate: "Mars dasha in infancy and early childhood for Chitra can produce frustration when the making capacity exceeds the motor control — the inner vision outpacing the hands' current ability. Physical concerns in Mars dasha childhood: accidents, inflammatory conditions, and the high-energy vulnerability of Mars's impulsive physicality. Mars–Saturn antardasha (~yr 5 of Mars, ~age 5) can bring a brief but noticeable period of constraint.",
        focus: "Tuesday Mars shrine prayers, red offerings, and abundant creative materials in the home — clay, paint, building blocks, fabric — are the most important parental investments. The aesthetic standard the family maintains in the child's living environment is silently absorbed into Chitra's forming aesthetic intelligence.",
      },
    },
    {
      planet: "Rahu", period: "18 yrs", ageRange: "Age 7–25", theme: "The Vision Expands",
      detail: {
        expect: "Rahu dasha from 7 to 25 is the great expansion of Chitra's creative world. School (7–14) establishes artistic and design interests formally; Chitra distinguishes themselves in visual art, geometry, and any subject with a spatial or aesthetic dimension. Adolescence (14–18) brings the first serious creative ambition and often a passionate identification with a specific aesthetic domain — architecture, fashion, design, or performance. Higher education or professional training (18–25) launches the career and gives Chitra the technical vocabulary to match the vision. The magnetic quality that defines Chitra's adult presence begins to be noticed by peers and teachers in Rahu dasha.",
        navigate: "Rahu's expansion through adolescence and early adulthood can produce aesthetic absolutism in Chitra — the belief that their vision is correct and others' is inferior. This is both a creative strength (it maintains standard) and a social vulnerability (it alienates collaborators). Rahu–Saturn antardasha (~yr 12 of Rahu, ~ages 19–21) is the most demanding sub-period — career uncertainty and relationship tension can peak. Physical concerns: skin conditions, nervous system sensitivity, and eye strain.",
        focus: "Saturday Rahu shrine and deliberate cultivation of aesthetic generosity — learning from makers whose vision differs from Chitra's own. Also watch Rahu–Mercury antardasha (~yr 15 of Rahu, ~ages 22–24) for Kanya-pada Chitra: Mercury as rasi lord brings exceptional analytical design capability and communicative breakthrough.",
      },
    },
    {
      planet: "Jupiter", period: "16 yrs", ageRange: "Age 25–41", theme: "The Work Finds Its Scale",
      detail: {
        expect: "Jupiter dasha from 25 to 41 is when Chitra's creative work finds the scale it deserves. Professional establishment, first significant commissions or collections, career recognition, and the building of a creative reputation all consolidate in Jupiter's opening decade. Marriage enters in Jupiter–Venus antardasha (~yr 4, ~ages 29–30) for most; children arrive; a home that expresses Chitra's aesthetic intelligence fully becomes possible. By the mid-thirties, Chitra's work is known — within a field, within a city, or more broadly — and the question shifts from establishing to deepening.",
        navigate: "Jupiter's generosity can produce over-ambition — Chitra taking on creative projects that exceed the current capacity for execution, driven by the vision that Jupiter amplifies. The gap between what Chitra sees and what currently exists is both the creative engine and a source of perpetual mild dissatisfaction. Jupiter–Saturn antardasha (~yr 13 of Jupiter, ~ages 38–40) requires disciplined reduction of scope.",
        focus: "Thursday Brihaspati worship and one major creative project of genuine scale pursued with full focus. For Kanya-pada Chitra, Jupiter–Mercury antardasha (~yr 14, ~age 39) is a peak of analytical design clarity; prepare the most technically ambitious creative work for this window.",
      },
    },
    {
      planet: "Saturn", period: "19 yrs", ageRange: "Age 41–60", theme: "The Architect's Long Work",
      detail: {
        expect: "Saturn dasha from 41 to 60 brings Chitra into the long, sustained, reputation-defining work of the mature creative. The designs, buildings, collections, or performances of Saturn dasha tend to be Chitra's most enduring contributions — not the most exciting, but the most structurally sound, the most carefully considered, the most professionally complete. Institutional recognition and legacy-building work arrive. Teaching and mentoring younger designers, architects, or artists becomes an increasingly significant part of the creative life.",
        navigate: "Saturn's discipline can feel constraining to Chitra's natural aesthetic freedom — the requirement to complete, to deliver within constraints, to serve a client rather than a pure vision. This tension is productive if managed: the best creative work typically emerges from disciplined constraint rather than unlimited freedom. Physical concerns: spine, joints, eyes, and cardiovascular. Saturn–Rahu antardasha (~yr 12, ~ages 53–55) is the most turbulent sub-period.",
        focus: "Saturday oil bath and Shani worship. The long creative work of Saturn dasha — the building that stands for a century, the design language that becomes a reference — requires exactly the sustained commitment Saturn demands. Embrace the constraint as the condition of enduring work.",
      },
    },
    {
      planet: "Mercury", period: "17 yrs", ageRange: "Age 60–77", theme: "Rasi Lord for Kanya-born — The Great Design",
      detail: {
        expect: "Mercury dasha from 60 to 77 is the rasi lord's arrival for Kanya-pada Chitra. Mercury is the lord of your rasi, Kanya — this makes his dasha doubly charged for Kanya-born Chitra natives. The analytical precision, communicative mastery, and systematic intelligence that Mercury brings amplify exactly the capacities that have made Chitra's creative work distinctive — the ability to understand why a design works, to articulate aesthetic principle, to teach the logic of beauty. Writing about design, teaching the design process, or producing analytical work that interprets Chitra's field reach their lifetime peak. For Tula-pada Chitra, Mercury dasha is a late-life gift of precision and articulate wisdom.",
        navigate: "Mercury's health concerns at this age are nervous system and respiratory. The perfectionism that has driven Chitra's entire creative life requires calibration at this age — the standard should be as high as ever, but the physical energy available is finite. Mercury–Rahu antardasha (~yr 2 of Mercury, ~ages 62–63) can bring unusual late-career opportunities or disruptions.",
        focus: "Wednesday worship, green offerings, and writing about design or aesthetic philosophy. The analytical account of a creative life's principles — why certain forms are beautiful, what makes a design endure, the logic beneath the aesthetic — is Chitra's most distinctive possible Mercury dasha contribution.",
      },
    },
    {
      planet: "Ketu", period: "7 yrs", ageRange: "Age 77–84", theme: "The Vision Turns Inward",
      detail: {
        expect: "Ketu dasha from 77 to 84 turns Chitra's lifelong outward creative vision inward. The making impulse does not cease — but the scale simplifies, the audience narrows to the essential, and the purpose clarifies from reputation to expression. Spiritual depth that has always underlain Chitra's aesthetic sense now surfaces directly: the recognition that Tvashta's creative act and the divine's self-expression are ultimately the same thing.",
        navigate: "Ketu's withdrawal from social and professional engagement is appropriate; ensure it does not become complete isolation. The aesthetic intelligence of a lifetime is still fully present and still valuable; small-scale creative acts — a drawing, a garden arrangement, a piece of jewellery made for a grandchild — maintain the hands' intelligence without requiring the full professional apparatus.",
        focus: "Ketu shrine visits, pitru tharpanam, and simple, beautiful creative practices as daily devotional acts. Tvashta's child, having built and designed for seven decades, now makes in the most personal and intimate register.",
      },
    },
    {
      planet: "Venus", period: "20 yrs", ageRange: "Age 84–104", theme: "Rasi Lord for Tula-born — The Beautiful Completion",
      detail: {
        expect: "Venus dasha from 84 to 104 is the rasi lord's arrival for Tula-pada Chitra. Venus is the lord of your rasi, Tula — this makes her dasha doubly charged for Tula-born Chitra natives. Beauty, love, aesthetic refinement, and the warmth of creative connection reach their most freely expressed form at this age. The decades of discipline — Saturn's long constraint, Mercury's analytical rigour — have produced a capacity for pure aesthetic joy that is now fully available. For Kanya-pada Chitra, Venus dasha at this extreme age brings the final flourishing of sensory beauty.",
        navigate: "At this age, physical care is primary: warmth, music, beauty in the immediate environment, and the presence of those who understand and appreciate Chitra's life's work. The nervous system and cardiovascular system need gentle, consistent support.",
        focus: "Friday Lakshmi worship, rose and jasmine offerings, music, art, and the beauty of natural forms — flowers, water, light — are Venus's primary companions. Tvashta's heir ends in Venus's garden, surrounded by the beauty that was always the purpose.",
      },
    },
    {
      planet: "Sun", period: "6 yrs", ageRange: "Age 104–110", theme: "Final Solar Light",
      detail: {
        expect: "Sun dasha from 104 to 110 is reached by almost none. For those transcendent Chitra souls who arrive, the Sun brings the final quality of radiant clarity — the creative vision and its source recognised as one. The bright jewel (Chitra's symbol) is indistinguishable from the light it reflects.",
        navigate: "Complete, tender care. The person at this age has completed one of the richest creative lives possible; what they need is warmth, light, and loving presence.",
        focus: "Sunday Surya worship and Aditya Hridayam recitation. The craftsperson and the divine craftsperson have, in the end, always been the same.",
      },
    },
  ],

  spirituality: [
    {
      title: "Tvashta & Vishwakarma Worship",
      desc: "Chitra's presiding deity is Tvashta, the divine craftsperson — worship of Vishwakarma (the architect of the gods), Thursday offerings, and observing Vishwakarma Puja with sincere creative intention are Chitra's deepest devotional expressions.",
    },
    {
      title: "Mars & Creative Fire",
      desc: "Mars governs Chitra's creative fire — Tuesday Mars worship, Kartikeya reverence, and the practice of disciplined creative effort as a form of tapas align with this nakshathiram's nature.",
    },
    {
      title: "Temples of Architectural Splendour",
      desc: "Brihadeeswarar (Thanjavur), Meenakshi Amman (Madurai), Ranganathaswamy (Srirangam) — the great temples of South Indian architectural genius — carry particular resonance for Chitra as both pilgrimage and aesthetic inspiration.",
    },
  ],

  guidance: "The form you see before it exists is not imagination — it is Tvashta's signal. Trust the vision. But let Saturn's long patience and Mercury's structural clarity serve the vision; the form that endures is the one built from both fire and rigour. Make things that are completely beautiful and completely right, and the world will remember them.",

  compatibleEn: ["Vishakha", "Uttara Phalguni", "Swati", "Ashwini", "Mrigashira"],
  compatibleNote: "These nakshatras complement Chitra's aesthetic vision, structural intelligence, and creative ambition with drive, intellectual depth, and complementary beauty.",

  ta: {
    atAGlanceLabels: ["அழகியல் தரிசனம்", "வடிவமைப்பு தேர்ச்சி", "கட்டமைப்பு நுண்ணறிவு", "காந்த இருப்பு", "படைப்பு உறுதி"],
    radarLabels: ["அழகியல்", "வடிவமைப்பு", "கட்டமைப்பு", "காந்தம்", "உறுதி", "துல்லியம்"],
    coreStrengths: [
      { label: "அழகியல் தரிசனம்",         desc: "திவஷ்டாவின் வாரிசு — சித்திரை இன்னும் தெரியாத வடிவத்தை பார்க்கிறார் மற்றும் தெய்வீக கைவினைஞரின் நிச்சயத்துடன் அதை இருப்பிற்கு கொண்டு வருகிறார்." },
      { label: "வடிவமைப்பு தேர்ச்சி",     desc: "கட்டிடக்கலை, நகை வடிவமைப்பு, டிஜிட்டல் வடிவமைப்பு — சித்திரையின் கண் மற்றவர்கள் மட்டுமே தோராயமாக கண்டறியக்கூடிய துல்லியத்துடன் அழகை சீரமைக்கிறது." },
      { label: "கட்டமைப்பு நுண்ணறிவு",    desc: "அழகும் செயல்பாடும் ஒன்றாக — சித்திரை ஒன்றை மற்றொன்றிற்காக ஒருபோதும் தியாகம் செய்வதில்லை; சிறந்த வடிவமைப்பு முழுமையாக அழகானது மற்றும் முழுமையாக சரியானது." },
      { label: "காந்த இருப்பு",            desc: "பிரகாசமான ரத்தினம் — சித்திரை தேடாமல் கவனத்தை ஈர்க்கிறார், மற்றவர்கள் உணரும் இயல்பான ஒளிர்வு." },
      { label: "படைப்பு உறுதி",            desc: "செவ்வாயும் திவஷ்டாவும் சேர்ந்து — சித்திரை முக்கியத்துவம் வாய்ந்த ஒன்றை உருவாக்க விரும்புகிறார், மற்றும் அதை செயல்படுத்த வேகம் உள்ளது." },
      { label: "துல்லியமான செயல்பாடு",    desc: "வேலை சரியாகும் வரை வெளியிடாத கைவினைஞர் — சித்திரையின் பரிபூரணவாதம் நரம்பு நோய் அல்ல, தொழில்முறை தரம்." },
    ],
    careerAbilityLabels: ["கட்டிடக்கலை & இட வடிவமைப்பு", "நகை & ஃபேஷன் வடிவமைப்பு", "கிராபிக் & டிஜிட்டல் வடிவமைப்பு", "பொறியியல் & கட்டுமானம்", "செயல்திறன் & காட்சி கலை"],
    careerClusters: [
      { title: "கட்டிடக்கலை & இட வடிவமைப்பு", desc: "கட்டிடங்கள், உட்புற வடிவமைப்பு, நகர வடிவமைப்பு — சித்திரையின் கைகளால் வெளிப்படுத்தப்பட்ட திவஷ்டாவின் தெய்வீக கட்டிடக்கலை." },
      { title: "நகை & ஃபேஷன்",               desc: "ஆடை வடிவமைப்பு, துணிக்கலை, நகை — தனிப்பட்ட அழகியல் அணியக்கூடிய வடிவமாக மாற்றப்பட்டது." },
      { title: "கிராபிக் & டிஜிட்டல் வடிவமைப்பு", desc: "காட்சி தொடர்பு, பிராண்டிங், UI/UX — திரை அளவில் அழகை சீரமைக்கும் சித்திரையின் கண்." },
      { title: "பொறியியல் & கட்டுமானம்",      desc: "சிவில், கட்டமைப்பு, இயந்திர பொறியியல் — அழகியமாக இருக்கும் கட்டமைப்பு." },
      { title: "செயல்திறன் கலை & திரைப்படம்", desc: "நடிப்பு, திசை, திரைக்காட்சியியல், நடனம் — செயல்திறனில் சித்திரையின் காந்த இருப்பு." },
      { title: "நுண்கலை & சிற்பம்",           desc: "ஓவியம், சிற்பம், நிறுவல் — தரிசனத்திலிருந்து வடிவத்தை உருவாக்கும் தூய படைப்பு செயல்." },
    ],
    modernApps: [
      { title: "கட்டிடக்கலை தொழில்நுட்பம் & PropTech", desc: "BIM மென்பொருள், டிஜிட்டல் இரட்டை தளங்கள், பரமேட்ரிக் வடிவமைப்பு கருவிகள் — டிஜிட்டல் பரிமாணத்தில் கட்டும் சித்திரை." },
      { title: "ஃபேஷன் தொழில்நுட்பம் & அணியக்கூடிய வடிவமைப்பு", desc: "நிலையான நகை தளங்கள், டிஜிட்டல் நகை, அணியக்கூடிய தொழில்நுட்ப வடிவமைப்பு." },
      { title: "UI/UX & தயாரிப்பு வடிவமைப்பு", desc: "டிஜிட்டல் தயாரிப்பு வடிவமைப்பு, பயனர் அனுபவ தளங்கள், தொடர்பு வடிவமைப்பு கருவிகள்." },
      { title: "3D அச்சிடல் & டிஜிட்டல் செய்தல்", desc: "கூடுதல் உற்பத்தி, டிஜிட்டல் தயாரிப்பு, தயாரிப்பாளர் தொழில்நுட்பம் — டிஜிட்டல் பட்டறையில் திவஷ்டா." },
      { title: "ஸ்ட்ரீமிங் & காட்சி உள்ளடக்கம்", desc: "வீடியோ உற்பத்தி, திரைக்காட்சியியல் தளங்கள், காட்சி கதைசொல்லல் ஊடகம்." },
      { title: "ஆடம்பர & பிராண்ட் வடிவமைப்பு",  desc: "ஆடம்பர பிராண்ட் வளர்ச்சி, முத்திரை காட்சி அடையாளம், உயர்தர அழகியல் ஆலோசனை." },
    ],
    dashaThemes: [
      "தயாரிப்பாளரின் நெருப்பில் பிறப்பு — செவ்வாய் படைப்பு வேகம், அழகியல் விழிப்பு",
      "தரிசனம் விரிவடைகிறது — ராகு தொழில்முறை நிறுவல், கலை முதிர்ச்சி",
      "வேலை அதன் அளவை கண்டுபிடிக்கிறது — குரு அங்கீகாரம், படைப்பு மரபு",
      "கட்டிடக்கலை நீண்ட வேலை — சனி முதிர்ந்த படைப்பு",
      "கன்னி ராசி அதிபதி — மாபெரும் வடிவமைப்பு — புதன் தசை",
      "தரிசனம் உள்நோக்கி திரும்புகிறது — கேது படைப்பு ஆன்மீகம்",
      "துலா ராசி அதிபதி — அழகான நிறைவு — சுக்கிர தசை",
      "இறுதி சூரிய ஒளி — படைப்பாளனும் தெய்வீக படைப்பாளனும் ஒன்று",
    ],
    dashaDetails: [
      {
        expect: "சித்திரை செவ்வாய் தசையில் திறக்கிறார் — ஆரம்பகால ஆண்டுகளிலிருந்தே படைப்பு வேகத்தை நிறுவும் நெருப்பான, நோக்கம் நிறைந்த ஆரம்பம். குழந்தை பருவ அடையாளங்கள்: ஒழுங்கமைக்க வலியுறுத்தும் குழந்தை, தோராயத்தில் திருப்தியடையாதவர், சுற்றுச்சூழலின் காட்சி விவரங்களுக்கு அசாதாரண கவனம்.",
        navigate: "கை கட்டுப்பாட்டை மீறும் கை திறன் சித்திரைக்கு விரக்தியை உருவாக்கலாம். செவ்வாய்–சனி அந்தர்தசை (~yr 5, ~5 வயது) கட்டுப்பாட்டின் சுருக்கமான காலம்.",
        focus: "செவ்வாய்க்கிழமை செவ்வாய் சன்னதி வழிபாடு, சிவப்பு அர்ப்பணம். வீட்டில் ஏராளமான படைப்பு பொருட்கள் — களிமண், வண்ணம், கட்டிட தொகுதிகள் — மிக முக்கியமான பெற்றோரின் முதலீடு.",
      },
      {
        expect: "ராகு தசை 7 முதல் 25 வரை சித்திரையின் படைப்பு உலகின் மாபெரும் விரிவாக்கம். பள்ளி (7–14) கலை மற்றும் வடிவமைப்பு ஆர்வங்களை முறையாக நிறுவுகிறது. பதின்வயது (14–18) முதல் தீவிரமான படைப்பு உறுதியை கொண்டு வருகிறது. உயர் கல்வி (18–25) தொழிலை தொடங்குகிறது.",
        navigate: "ராகுவின் விரிவாக்கம் பதின்வயது மற்றும் ஆரம்பகால வயதிலில் சித்திரையில் அழகியல் முழுமைவாதத்தை உருவாக்கலாம். ராகு–சனி (~yr 12, ~19–21 வயது) மிகவும் கோரும் துணை காலம்.",
        focus: "சனிக்கிழமை ராகு சன்னதி. கன்னி பாதம்: ராகு–புதன் (~yr 15, ~22–24 வயது) கவனிக்கவும் — ராசி அதிபதியின் விதிவிலக்கான பகுப்பாய்வு வடிவமைப்பு திறன்.",
      },
      {
        expect: "குரு தசை 25 முதல் 41 வரை சித்திரையின் படைப்பு வேலை அதற்கு தகுதியான அளவை கண்டுபிடிக்கும் போது. தொழில்முறை நிறுவல், முதல் முக்கியமான கமிஷன்கள் அல்லது தொகுப்புகள், தொழில் அங்கீகாரம் குரு தசையில் நிலைபெறுகின்றன. 30களின் நடுவில், சித்திரையின் வேலை — ஒரு தளத்திற்குள், ஒரு நகரத்திற்குள் — அறியப்படுகிறது.",
        navigate: "குரு அதிக-உறுதியை உருவாக்கலாம் — சித்திரை தற்போதைய செயல்படுத்தும் திறனை மீறும் படைப்பு திட்டங்களை எடுத்துக்கொள்கிறார். குரு–சனி (~yr 13, ~38–40 வயது) கவனமான நோக்கக் குறைப்பை கோருகிறது.",
        focus: "வியாழக்கிழமை பிருஹஸ்பதி வழிபாடு. கன்னி பாதம்: குரு–புதன் (~yr 14, ~39 வயது) — ராசி அதிபதியின் உச்ச பகுப்பாய்வு வடிவமைப்பு தெளிவு.",
      },
      {
        expect: "சனி தசை 41 முதல் 60 வரை சித்திரையை நீண்ட, நிலையான, நற்பெயரை வரையறுக்கும் முதிர்ந்த படைப்பாளியாக கொண்டு வருகிறது. சனி தசையின் வடிவமைப்புகள், கட்டிடங்கள், அல்லது தொகுப்புகள் சித்திரையின் மிகவும் நீடித்த பங்களிப்பாக இருக்கும். நிறுவன அங்கீகாரம் மற்றும் மரபு-கட்டுவது வருகிறது.",
        navigate: "சனியின் ஒழுக்கம் சித்திரையின் இயல்பான அழகியல் சுதந்திரத்திற்கு கட்டுப்படுவதாக உணரலாம். இந்த பதற்றம் ஆக்கப்பூர்வமானது: சிறந்த படைப்பு வேலை பொதுவாக ஒழுக்கமான கட்டுப்பாட்டிலிருந்து வருகிறது. சனி–ராகு (~yr 12, ~53–55 வயது) மிகவும் கலக்கமான துணை காலம்.",
        focus: "சனிக்கிழமை எண்ணெய் குளியல் மற்றும் சனி வழிபாடு. சனி தசையின் நீண்ட படைப்பு வேலை — ஒரு நூற்றாண்டு நிற்கும் கட்டிடம் — சனி கோரும் நீடித்த அர்ப்பணத்தை கோருகிறது.",
      },
      {
        expect: "புதன் தசை 60 முதல் 77 வரை கன்னி-பாத சித்திரைக்கு ராசி அதிபதியின் வருகை. புதன் உங்கள் ராசியான கன்னியின் அதிபதி — இது கன்னி-பிறந்த சித்திரை நேயர்களுக்கு இரட்டை வலிமையுடன் வருகிறது. அழகியல் கொள்கையை ஏன் வடிவமைப்பு வேலை செய்கிறது என்பதை புரிந்துகொண்டு, தொடர்பு மற்றும் முறையான நுண்ணறிவு உச்சம் அடைகின்றன.",
        navigate: "புதன் ஆரோக்ய கவலைகள் நரம்பு மண்டலம் மற்றும் சுவாசம். கிட்டத்தட்ட ஒரு படைப்பு வாழ்நாளின் கொள்கைகளின் பகுப்பாய்வு கணக்கு — ஏன் சில வடிவங்கள் அழகானது, வடிவமைப்பு என்ன நீடிக்கச் செய்கிறது — சித்திரையின் மிகவும் தனித்துவமான புதன் தசை பங்களிப்பு.",
        focus: "புதன்கிழமை வழிபாடு, பசுமை அர்ப்பணம். வடிவமைப்பு பற்றிய அல்லது அழகியல் தத்துவம் பற்றிய எழுத்து.",
      },
      {
        expect: "கேது தசை 77 முதல் 84 வரை சித்திரையின் வாழ்நாள் வெளிப்புற படைப்பு தரிசனத்தை உள்நோக்கி திருப்புகிறது. செய்யும் உந்துதல் நிற்காது — ஆனால் அளவு எளிமைப்படுகிறது, நோக்கம் கௌரவத்திலிருந்து வெளிப்பாட்டிற்கு தெளிவடைகிறது.",
        navigate: "சமூக மற்றும் தொழில்முறை ஈடுபாட்டிலிருந்து கேதுவின் திரும்பல் பொருத்தமானது; அது முழுமையான தனிமையாக மாறாமல் உறுதி செய்யுங்கள். ஒரு பேரக்குழந்தைக்கு செய்யப்பட்ட ஒரு நகை போன்ற சிறிய அளவிலான படைப்பு செயல்கள் கை நுண்ணறிவை பராமரிக்கின்றன.",
        focus: "கேது சன்னதி வழிபாடு, பித்ரு தர்ப்பணம். திவஷ்டாவின் பிள்ளை, ஏழு தசகங்கள் கட்டியதற்கும் வடிவமைத்ததற்கும் பிறகு, இப்போது மிகவும் தனிப்பட்ட மற்றும் அந்தரங்கமான பதிவில் படைக்கிறார்.",
      },
      {
        expect: "சுக்கிர தசை 84 முதல் 104 வரை துலா-பாத சித்திரைக்கு ராசி அதிபதியின் வருகை. சுக்கிரன் உங்கள் ராசியான துலாவின் அதிபதி — இது துலா-பிறந்த சித்திரை நேயர்களுக்கு இரட்டை வலிமையுடன் வருகிறது. அழகு, அன்பு, அழகியல் செம்மைப்படுத்தல் அதிக சுதந்திரமாக வெளிப்படுத்தப்பட்ட வடிவத்தை அடைகின்றன.",
        navigate: "இந்த வயதில், உடல் பராமரிப்பு முதன்மை: அரவணைப்பு, இசை, உடனடி சூழலில் அழகு. நரம்பு மண்டலம் மற்றும் இதய-வாஸ்குலர் மென்மையான, நிலையான ஆதரவு தேவை.",
        focus: "வெள்ளிக்கிழமை லட்சுமி வழிபாடு, ரோஜா மற்றும் மல்லிகை அர்ப்பணம், இசை, இயற்கை வடிவங்கள் — மலர்கள், நீர், ஒளி. திவஷ்டாவின் வாரிசு வீனஸின் தோட்டத்தில் முடிகிறார்.",
      },
    ],
    spirituality: [
      { title: "திவஷ்டா & விஸ்வகர்மா வழிபாடு", desc: "சித்திரையின் தலைமை தெய்வம் திவஷ்டா, தெய்வீக கைவினைஞர் — விஸ்வகர்மா வழிபாடு, வியாழக்கிழமை அர்ப்பணம், மற்றும் நேர்மையான படைப்பு நோக்கத்துடன் விஸ்வகர்மா பூஜை கொண்டாடுவது சித்திரையின் ஆழமான பக்தி வெளிப்பாடுகள்." },
      { title: "செவ்வாய் & படைப்பு நெருப்பு",    desc: "செவ்வாய் சித்திரையின் படைப்பு நெருப்பை நிர்வகிக்கிறார் — செவ்வாய்க்கிழமை செவ்வாய் வழிபாடு, கார்த்திகேய மரியாதை, மற்றும் தபஸாக ஒழுக்கமான படைப்பு முயற்சியின் நடைமுறை இந்த நட்சத்திரத்தின் இயல்புடன் சீரமைகிறது." },
      { title: "கட்டிடக்கலை சிறப்பின் கோவில்கள்", desc: "பிரகதீஸ்வரர் (தஞ்சாவூர்), மீனாட்சி அம்மன் (மதுரை), ரங்கநாதஸ்வாமி (ஸ்ரீரங்கம்) — தென்னிந்திய கட்டிடக்கலை மேதைமையின் மாபெரும் கோவில்கள் — சித்திரைக்கு யாத்திரை மற்றும் அழகியல் தூண்டுதல் இரண்டாகவும் சிறப்பு ஒத்தொலிப்பு கொண்டுள்ளன." },
    ],
    guidance: "நீங்கள் இல்லாமல் பார்க்கும் வடிவம் கற்பனை அல்ல — அது திவஷ்டாவின் சமிக்ஞை. தரிசனத்தை நம்புங்கள். ஆனால் சனியின் நீண்ட பொறுமை மற்றும் புதனின் கட்டமைப்பு தெளிவை தரிசனத்திற்கு சேவை செய்யட்டும்; நீடிக்கும் வடிவம் நெருப்பிலிருந்தும் கடுமையிலிருந்தும் கட்டப்பட்டது. முழுமையாக அழகான மற்றும் முழுமையாக சரியான விஷயங்களை உருவாக்குங்கள், உலகம் அவற்றை நினைவில் வைத்திருக்கும்.",
    careerNote: "அழகு, கட்டமைப்பு, தயாரிப்பாளரின் நுண்ணறிவு இணையும் இடங்களில் சித்திரை சிறப்பாக செயல்படுகிறார்.",
    modernLead: "சித்திரையின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "அழகியல் தரிசனம், கட்டமைப்பு நுண்ணறிவு, படைப்பு உறுதி சித்திரையின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function ChitraVisualPage() {
  return <NatchathiramVisualContent data={CHITRA} visual={CHITRA_VISUAL} />;
}
