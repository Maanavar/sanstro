import type { Metadata } from "next";
import { withTamilTwin } from "@/lib/localized-metadata";
import { withDasaTimingHold } from "@/lib/natchathiram-dasa-hold";
import { dasaTimingsFor } from "@/lib/natchathiram-dasa-timings";
import { nakshatraDisplayName } from "@/lib/nakshatra-display-name";
import { natchathiramVisualTa } from "@/lib/marketing-seo-ta";
import { CHITRA } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

const EN_METADATA: Metadata = {
  title: `${nakshatraDisplayName(CHITRA.number, "en")} — Visual Profile`,
  description: "Visual profile of Chithirai Nakshathiram: personality traits, career strengths, dasa timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/chitra/visual" },
  openGraph: {
    title: `${nakshatraDisplayName(CHITRA.number, "en")} — Visual Profile`,
    description: "Visual profile of Chithirai Nakshathiram: personality traits, career strengths, dasa timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/chitra/visual",
    type: "article",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withDasaTimingHold(await withTamilTwin(EN_METADATA, "/natchathiram/chitra/visual", natchathiramVisualTa("chitra")!), "chitra");
}

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
      planet: "Mars", theme: "Born in the Maker's Fire",
      detail: {
        expect: "Chitra opens in Mars dasa — a fiery, purposeful beginning that establishes the creative drive from the very first years. Infancy and earliest childhood show the hallmarks: the child who insists on arranging, the one who is unsatisfied with approximation, the young person whose attention to the visual and spatial detail of their environment is noticed by everyone around them. Mars gives Chitra an early confidence in making that plants the root of a lifetime's creative ambition. The family environment in these early years — its aesthetic quality, the access to creative materials, the degree to which the child's visual intelligence is recognised and nurtured — shapes the entire life. Chitra is born inside this dasa, so only the balance remaining at birth is lived; the pada decides how much, and the range shown for this dasa gives it.",
        navigate: "Mars dasa in infancy and early childhood for Chitra can produce frustration when the making capacity exceeds the motor control — the inner vision outpacing the hands' current ability. Physical concerns in Mars dasa childhood: accidents, inflammatory conditions, and the high-energy vulnerability of Mars's impulsive physicality. The Mars–Saturn bhukti (the table below gives when it begins and how long it lasts) can bring a brief but noticeable period of constraint.",
        focus: "Tuesday Mars shrine prayers, red offerings, and abundant creative materials in the home — clay, paint, building blocks, fabric — are the most important parental investments. The aesthetic standard the family maintains in the child's living environment is silently absorbed into Chitra's forming aesthetic intelligence.",
      },
    },
    {
      planet: "Rahu", theme: "The Vision Expands",
      detail: {
        expect: "Rahu dasa is the great expansion of Chitra's creative world; it carries Chitra through school and adolescence and, for the longer balances, into higher education and the first working years. School establishes artistic and design interests formally; Chitra distinguishes themselves in visual art, geometry, and any subject with a spatial or aesthetic dimension. Adolescence brings the first serious creative ambition and often a passionate identification with a specific aesthetic domain — architecture, fashion, design, or performance. Where the dasa runs on, higher education or professional training launches the career and gives Chitra the technical vocabulary to match the vision. The magnetic quality that defines Chitra's adult presence begins to be noticed by peers and teachers in Rahu dasa.",
        navigate: "Rahu's expansion through adolescence and early adulthood can produce aesthetic absolutism in Chitra — the belief that their vision is correct and others' is inferior. This is both a creative strength (it maintains standard) and a social vulnerability (it alienates collaborators). The Rahu–Saturn bhukti (the table below gives when it begins and how long it lasts) is the most demanding sub-period — career uncertainty and relationship tension can peak. Physical concerns: skin conditions, nervous system sensitivity, and eye strain.",
        focus: "Saturday Rahu shrine and deliberate cultivation of aesthetic generosity — learning from makers whose vision differs from Chitra's own. Also watch the Rahu–Mercury bhukti (the bhukti table below gives when it begins and how long it lasts) for Kanya-pada (first and second pada) Chitra: Mercury as rasi lord brings exceptional analytical design capability and communicative breakthrough.",
      },
    },
    {
      planet: "Jupiter", theme: "The Work Finds Its Scale",
      detail: {
        expect: "Jupiter dasa, running from early adult life into mid-life, is when Chitra's creative work finds the scale it deserves. Professional establishment, first significant commissions or collections, career recognition, and the building of a creative reputation all consolidate in Jupiter's opening years. Where marriage falls within this dasa, it is read from the seventh house and its lord, with Venus and Jupiter as the natural significators, and judged from the individual horoscope as a tendency rather than a fixed time. Children may arrive; a home that expresses Chitra's aesthetic intelligence fully becomes possible. By the dasa's second half, Chitra's work is known — within a field, within a city, or more broadly — and the question shifts from establishing to deepening.",
        navigate: "Jupiter's generosity can produce over-ambition — Chitra taking on creative projects that exceed the current capacity for execution, driven by the vision that Jupiter amplifies. The gap between what Chitra sees and what currently exists is both the creative engine and a source of perpetual mild dissatisfaction. The Jupiter–Saturn bhukti (the table below gives when it begins and how long it lasts) requires disciplined reduction of scope.",
        focus: "Thursday Brihaspati worship and one major creative project of genuine scale pursued with full focus. For Kanya-pada Chitra, the Jupiter–Mercury bhukti (the bhukti table below gives when it begins and how long it lasts) is a peak of analytical design clarity; prepare the most technically ambitious creative work for this window.",
      },
    },
    {
      planet: "Saturn", theme: "The Architect's Long Work",
      detail: {
        expect: "Saturn dasa brings Chitra into the long, sustained, reputation-defining work of the mature creative. The designs, buildings, collections, or performances of Saturn dasa tend to be Chitra's most enduring contributions — not the most exciting, but the most structurally sound, the most carefully considered, the most professionally complete. Institutional recognition and legacy-building work arrive. Teaching and mentoring younger designers, architects, or artists becomes an increasingly significant part of the creative life.",
        navigate: "Saturn's discipline can feel constraining to Chitra's natural aesthetic freedom — the requirement to complete, to deliver within constraints, to serve a client rather than a pure vision. This tension is productive if managed: the best creative work typically emerges from disciplined constraint rather than unlimited freedom. Physical concerns: spine, joints, eyes, and cardiovascular. The Saturn–Rahu bhukti (the table below gives when it begins and how long it lasts) is the most turbulent sub-period.",
        focus: "Saturday oil bath, Shani worship and Hanuman worship. The long creative work of Saturn dasa — the building that stands for a century, the design language that becomes a reference — requires exactly the sustained commitment Saturn demands. Embrace the constraint as the condition of enduring work.",
      },
    },
    {
      planet: "Mercury", theme: "Rasi Lord for Kanya-born — The Great Design",
      detail: {
        expect: "Mercury dasa, in the later working years, is the rasi lord's arrival for Kanya-pada Chitra. Mercury is the lord of your rasi, Kanya — this makes his dasa doubly charged for Kanya-born Chitra natives. The analytical precision, communicative mastery, and systematic intelligence that Mercury brings amplify exactly the capacities that have made Chitra's creative work distinctive — the ability to understand why a design works, to articulate aesthetic principle, to teach the logic of beauty. Writing about design, teaching the design process, or producing analytical work that interprets Chitra's field reach their lifetime peak. For Tula-pada (third and fourth pada) Chitra, Mercury dasa is a late-life gift of precision and articulate wisdom.",
        navigate: "Mercury's health concerns at this age are nervous system and respiratory. The perfectionism that has driven Chitra's entire creative life requires calibration at this age — the standard should be as high as ever, but the physical energy available is finite. The Mercury–Rahu bhukti (the table below gives when it begins and how long it lasts) can bring unusual late-career opportunities or disruptions.",
        focus: "Wednesday worship, green offerings, and writing about design or aesthetic philosophy. The analytical account of a creative life's principles — why certain forms are beautiful, what makes a design endure, the logic beneath the aesthetic — is Chitra's most distinctive possible Mercury dasa contribution.",
      },
    },
    {
      planet: "Ketu", theme: "The Vision Turns Inward",
      detail: {
        expect: "Ketu dasa, in advanced age, turns Chitra's lifelong outward creative vision inward. The making impulse does not cease — but the scale simplifies, the audience narrows to the essential, and the purpose clarifies from reputation to expression. Spiritual depth that has always underlain Chitra's aesthetic sense now surfaces directly: the recognition that Tvashta's creative act and the divine's self-expression are ultimately the same thing.",
        navigate: "Ketu's withdrawal from social and professional engagement is appropriate; ensure it does not become complete isolation. The aesthetic intelligence of a lifetime is still fully present and still valuable; small-scale creative acts — a drawing, a garden arrangement, a piece of jewellery made for a grandchild — maintain the hands' intelligence without requiring the full professional apparatus.",
        focus: "Ganapati worship, Ketu shrine visits, pitru tharpanam, and simple, beautiful creative practices as daily devotional acts. Tvashta's child, having built and designed across a lifetime, now makes in the most personal and intimate register.",
      },
    },
    {
      planet: "Venus", theme: "Rasi Lord for Tula-born — The Beautiful Completion",
      detail: {
        expect: "Venus dasa, beginning only in very advanced age, is the rasi lord's arrival for Tula-pada Chitra. Venus is the lord of your rasi, Tula — this makes her dasa doubly charged for Tula-born Chitra natives. Beauty, love, aesthetic refinement, and the warmth of creative connection reach their most freely expressed form at this age. The decades of discipline — Saturn's long constraint, Mercury's analytical rigour — have produced a capacity for pure aesthetic joy that is now fully available. For Kanya-pada Chitra, Venus dasa at this extreme age brings the final flourishing of sensory beauty.",
        navigate: "At this age, physical care is primary: warmth, music, beauty in the immediate environment, and the presence of those who understand and appreciate Chitra's life's work. The nervous system and cardiovascular system need gentle, consistent support.",
        focus: "Friday Lakshmi worship, rose and jasmine offerings, music, art, and the beauty of natural forms — flowers, water, light — are Venus's primary companions. Tvashta's heir ends in Venus's garden, surrounded by the beauty that was always the purpose.",
      },
    },
    {
      planet: "Sun", theme: "Final Solar Light",
      detail: {
        expect: "Sun dasa, the last in this sequence, is reached by almost none. For those transcendent Chitra souls who arrive, the Sun brings the final quality of radiant clarity — the creative vision and its source recognised as one. The bright jewel (Chitra's symbol) is indistinguishable from the light it reflects.",
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

  compatibleEn: ["Visakam", "Uthiram", "Swathi", "Aswini", "Mirugaseeridam"],
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
      { title: "கிராபிக் & டிஜிட்டல் வடிவமைப்பு", desc: "காட்சி தொடர்பு, பிராண்டிங், இடைமுக–பயனர் அனுபவ வடிவமைப்பு — திரை அளவில் அழகை சீரமைக்கும் சித்திரையின் கண்." },
      { title: "பொறியியல் & கட்டுமானம்",      desc: "சிவில், கட்டமைப்பு, இயந்திர பொறியியல் — அழகியமாக இருக்கும் கட்டமைப்பு." },
      { title: "செயல்திறன் கலை & திரைப்படம்", desc: "நடிப்பு, திசை, திரைக்காட்சியியல், நடனம் — செயல்திறனில் சித்திரையின் காந்த இருப்பு." },
      { title: "நுண்கலை & சிற்பம்",           desc: "ஓவியம், சிற்பம், நிறுவல் — தரிசனத்திலிருந்து வடிவத்தை உருவாக்கும் தூய படைப்பு செயல்." },
    ],
    modernApps: [
      { title: "கட்டிடக்கலை தொழில்நுட்பம் & PropTech", desc: "BIM மென்பொருள், டிஜிட்டல் இரட்டை தளங்கள், பரமேட்ரிக் வடிவமைப்பு கருவிகள் — டிஜிட்டல் பரிமாணத்தில் கட்டும் சித்திரை." },
      { title: "ஃபேஷன் தொழில்நுட்பம் & அணியக்கூடிய வடிவமைப்பு", desc: "நிலையான நகை தளங்கள், டிஜிட்டல் நகை, அணியக்கூடிய தொழில்நுட்ப வடிவமைப்பு." },
      { title: "இடைமுக, பயனர் அனுபவ & தயாரிப்பு வடிவமைப்பு", desc: "டிஜிட்டல் தயாரிப்பு வடிவமைப்பு, பயனர் அனுபவ தளங்கள், தொடர்பு வடிவமைப்பு கருவிகள்." },
      { title: "3D அச்சிடல் & டிஜிட்டல் செய்தல்", desc: "கூடுதல் உற்பத்தி, டிஜிட்டல் தயாரிப்பு, தயாரிப்பாளர் தொழில்நுட்பம் — டிஜிட்டல் பட்டறையில் திவஷ்டா." },
      { title: "ஸ்ட்ரீமிங் & காட்சி உள்ளடக்கம்", desc: "வீடியோ உற்பத்தி, திரைக்காட்சியியல் தளங்கள், காட்சி கதைசொல்லல் ஊடகம்." },
      { title: "ஆடம்பர & பிராண்ட் வடிவமைப்பு",  desc: "ஆடம்பர பிராண்ட் வளர்ச்சி, முத்திரை காட்சி அடையாளம், உயர்தர அழகியல் ஆலோசனை." },
    ],
    dashaThemes: [
      "படைப்பாளியின் நெருப்பில் பிறப்பு — செவ்வாய் படைப்பு வேகம், அழகியல் விழிப்பு",
      "நோக்கு விரிவடைகிறது — ராகு தொழில்முறை நிறுவல், கலை முதிர்ச்சி",
      "வேலை அதன் அளவை கண்டுபிடிக்கிறது — குரு அங்கீகாரம், படைப்பு மரபு",
      "கட்டிடக்கலை நீண்ட வேலை — சனி முதிர்ந்த படைப்பு",
      "கன்னி ராசி அதிபதி — மாபெரும் வடிவமைப்பு — புதன் தசை",
      "பார்வை உள்நோக்கித் திரும்புகிறது — கேது படைப்பு ஆன்மீகம்",
      "துலா ராசி அதிபதி — அழகான நிறைவு — சுக்கிர தசை",
      "இறுதி சூரிய ஒளி — படைப்பாளனும் தெய்வீக படைப்பாளனும் ஒன்று",
    ],
    dashaDetails: [
      {
        expect: "சித்திரை செவ்வாய் தசையில் தொடங்குகிறார் — முதல் ஆண்டுகளிலிருந்தே படைப்பு உந்துதலை நிறுவும் நெருப்பான, நோக்கம் நிறைந்த தொடக்கம். குழந்தைப் பருவ அடையாளங்கள்: ஒழுங்கமைக்க வலியுறுத்தும் குழந்தை, தோராயமான முடிவில் திருப்தியடையாதவர், சுற்றுச்சூழலின் காட்சி, இடஞ்சார்ந்த விவரங்களில் சுற்றியிருப்பவர் அனைவரும் கவனிக்கும் அளவு அசாதாரண கவனம் காட்டும் இளையவர். செவ்வாய் சித்திரைக்கு உருவாக்குவதில் ஆரம்பகால நம்பிக்கையைத் தருகிறது; அதுவே ஒரு வாழ்நாள் படைப்பு இலட்சியத்தின் வேர். இந்த ஆரம்ப ஆண்டுகளில் குடும்பச் சூழல் — அதன் அழகியல் தரம், படைப்புப் பொருட்களின் கிடைப்பு, குழந்தையின் காட்சி நுண்ணறிவு எவ்வளவு அங்கீகரிக்கப்பட்டு வளர்க்கப்படுகிறது என்பது — முழு வாழ்வையும் வடிவமைக்கிறது. சித்திரை இந்த தசையின் நடுவிலேயே பிறப்பதால், பிறக்கும்போது மீதமுள்ள இருப்பு மட்டுமே வாழப்படுகிறது; அது பாதத்தைப் பொறுத்தது — இந்த தசைக்குக் காட்டப்படும் வரம்பு அதைச் சொல்கிறது.",
        navigate: "சித்திரைக்கு குழந்தைப் பருவ செவ்வாய் தசையில், உருவாக்கும் ஆற்றல் கைகளின் கட்டுப்பாட்டை மீறும்போது — மனக்காட்சி கைகளின் தற்போதைய திறனை முந்தும்போது — விரக்தி உருவாகலாம். செவ்வாய் தசைக் குழந்தைப் பருவத்தின் உடல் கவலைகள்: விபத்துகள், அழற்சி நிலைகள், செவ்வாயின் உந்துவிசை உடலியலின் அதிக ஆற்றல் பாதிப்பு. செவ்வாய்–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) சுருக்கமான ஆனால் கவனிக்கத்தக்க கட்டுப்பாட்டுக் காலத்தைக் கொண்டுவரலாம்.",
        focus: "செவ்வாய்க்கிழமை செவ்வாய் சன்னதி வழிபாடு, சிவப்பு அர்ப்பணம். வீட்டில் ஏராளமான படைப்பு பொருட்கள் — களிமண், வண்ணம், கட்டிட தொகுதிகள் — மிக முக்கியமான பெற்றோரின் முதலீடு.",
      },
      {
        expect: "ராகு தசை சித்திரையின் படைப்பு உலகின் மாபெரும் விரிவாக்கம்; பள்ளி, வளரிளம் பருவம் வழியாகவும், நீண்ட இருப்பில் உயர் கல்வி, முதல் பணி ஆண்டுகள் வரையிலும் அழைத்துச் செல்கிறது. பள்ளி கலை, வடிவமைப்பு ஆர்வங்களை முறையாக நிறுவுகிறது; காட்சிக் கலை, வடிவியல், இடஞ்சார்ந்த அல்லது அழகியல் பரிமாணம் கொண்ட எந்தப் பாடத்திலும் சித்திரை தனித்து நிற்கிறார். வளரிளம் பருவம் முதல் தீவிரமான படைப்பு இலட்சியத்தையும், ஒரு குறிப்பிட்ட அழகியல் துறையுடன் — கட்டிடக்கலை, ஃபேஷன், வடிவமைப்பு, நிகழ்த்துகலை — உணர்ச்சிமயமான அடையாளத்தையும் அடிக்கடி கொண்டுவருகிறது. தசை தொடர்ந்தால், உயர் கல்வி அல்லது தொழில்முறை பயிற்சி தொழிலைத் தொடங்கி, மனக்காட்சிக்குப் பொருந்தும் தொழில்நுட்பச் சொல்வளத்தை சித்திரைக்குத் தருகிறது. சித்திரையின் வயது வந்த ஆளுமையை வரையறுக்கும் காந்த இயல்பு ராகு தசையில் சகாக்களாலும் ஆசிரியர்களாலும் கவனிக்கப்படத் தொடங்குகிறது.",
        navigate: "ராகுவின் விரிவாக்கம் வளரிளம் பருவத்திலும் இளம் வயது வந்த காலத்திலும் சித்திரையில் அழகியல் முழுமைவாதத்தை உருவாக்கலாம் — தன் கண்ணோட்டமே சரி, மற்றவரது தாழ்ந்தது என்ற நம்பிக்கை. இது படைப்பு பலமும் (தரத்தைக் காக்கிறது) சமூகப் பாதிப்பும் (ஒத்துழைப்பவர்களை விலக்குகிறது). ராகு–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மிகவும் கோரும் துணைக் காலம் — தொழில் நிச்சயமின்மையும் உறவு பதற்றமும் உச்சமடையலாம். உடல் கவலைகள்: தோல் நிலைகள், நரம்பு மண்டல உணர்திறன், கண் அழுத்தம்.",
        focus: "சனிக்கிழமை ராகு சன்னதி வழிபாடும், தம் பார்வையிலிருந்து வேறுபடும் படைப்பாளிகளிடமிருந்து கற்கும் அழகியல் தாராளத்தை வேண்டுமென்றே வளர்ப்பதும். கன்னி பாத (முதல், இரண்டாம் பாதம்) சித்திரைக்கு ராகு–புதன் புக்தியையும் கவனிக்கவும் (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்): ராசி அதிபதி புதன் விதிவிலக்கான பகுப்பாய்வு வடிவமைப்புத் திறனையும் தொடர்புத் திருப்புமுனையையும் கொண்டுவருகிறார்.",
      },
      {
        expect: "இளம் வயது வந்த காலத்திலிருந்து நடுவயது வரை செல்லும் குரு தசையில்தான் சித்திரையின் படைப்பு வேலை தனக்குத் தகுந்த அளவைக் கண்டுபிடிக்கிறது. தொழில்முறை நிறுவல், முதல் முக்கியமான படைப்பு ஒப்படைப்புகள் அல்லது தொகுப்புகள், தொழில் அங்கீகாரம், படைப்பு நற்பெயரைக் கட்டுதல் ஆகியவை குரு தசையின் தொடக்க ஆண்டுகளில் நிலைபெறுகின்றன. இந்தத் தசைக்குள் திருமணம் அமைந்தால், அது ஜாதகத்தின் ஏழாம் வீட்டையும் அதன் அதிபதியையும் கொண்டு பார்க்கப்படுகிறது; சுக்கிரனும் குருவும் அதன் இயல்பான காரகர்கள். அது ஒரு நிலையான காலம் அல்ல, ஒரு போக்கே. குழந்தைகள் வரலாம்; சித்திரையின் அழகியல் நுண்ணறிவை முழுமையாக வெளிப்படுத்தும் வீடு சாத்தியமாகிறது. தசையின் இரண்டாம் பாதியில் சித்திரையின் வேலை ஒரு துறைக்குள், ஒரு நகரத்துக்குள் அல்லது இன்னும் பரவலாக அறியப்படுகிறது; கேள்வி நிறுவுவதிலிருந்து ஆழப்படுத்துவதாக மாறுகிறது.",
        navigate: "குருவின் தாராளத்தன்மை அதிக-உறுதியை உருவாக்கலாம் — குரு பெருக்கும் மனக்காட்சியால் உந்தப்பட்டு, தற்போதைய செயல்படுத்தும் திறனை மீறும் படைப்புத் திட்டங்களை சித்திரை எடுத்துக்கொள்வது. சித்திரை காண்பதற்கும் தற்போது இருப்பதற்கும் இடையிலான இடைவெளி படைப்பு இயந்திரமும், நிரந்தர லேசான அதிருப்தியின் மூலமும் ஆகும். குரு–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒழுக்கத்துடன் நோக்கத்தைக் குறைக்கக் கோருகிறது.",
        focus: "வியாழக்கிழமை பிருஹஸ்பதி வழிபாடும், முழு கவனத்துடன் தொடரப்படும் உண்மையான அளவுள்ள ஒரு பெரிய படைப்புத் திட்டமும். கன்னி பாத சித்திரைக்கு குரு–புதன் புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) பகுப்பாய்வு வடிவமைப்புத் தெளிவின் உச்சம்; மிகவும் தொழில்நுட்ப இலட்சியமான படைப்பை இந்த சாளரத்துக்குத் தயார் செய்யுங்கள்.",
      },
      {
        expect: "சனி தசை சித்திரையை முதிர்ந்த படைப்பாளியின் நீண்ட, நிலையான, நற்பெயரை வரையறுக்கும் பணிக்குக் கொண்டுவருகிறது. சனி தசையின் வடிவமைப்புகள், கட்டிடங்கள், தொகுப்புகள் அல்லது நிகழ்ச்சிகள் சித்திரையின் மிக நீடித்த பங்களிப்பாக இருக்கும் — மிக உற்சாகமானவையாக இல்லாவிட்டாலும், கட்டமைப்பில் மிக உறுதியானவை, மிக கவனமாக யோசிக்கப்பட்டவை, தொழில்முறையில் மிக முழுமையானவை. நிறுவன அங்கீகாரமும் மரபு கட்டும் பணியும் வருகின்றன. இளைய வடிவமைப்பாளர்கள், கட்டிடக் கலைஞர்கள் அல்லது கலைஞர்களுக்குக் கற்பித்தலும் வழிகாட்டலும் படைப்பு வாழ்வின் மேலும் முக்கிய பகுதியாகிறது.",
        navigate: "சனியின் ஒழுக்கம் சித்திரையின் இயல்பான அழகியல் சுதந்திரத்தைக் கட்டுப்படுத்துவதாக உணரலாம் — முடிக்க வேண்டும், கட்டுப்பாடுகளுக்குள் ஒப்படைக்க வேண்டும், தூய மனக்காட்சிக்குப் பதில் வாடிக்கையாளருக்கு சேவை செய்ய வேண்டும் என்ற கோரிக்கை. இந்த பதற்றம் நிர்வகிக்கப்பட்டால் ஆக்கப்பூர்வமானது: சிறந்த படைப்பு பொதுவாக வரம்பற்ற சுதந்திரத்தை விட ஒழுக்கமான கட்டுப்பாட்டிலிருந்தே வருகிறது. உடல் கவலைகள்: முதுகெலும்பு, மூட்டுகள், கண்கள், இதய-இரத்தக் குழாய். சனி–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மிகவும் கலக்கமான துணைக் காலம்.",
        focus: "சனிக்கிழமை எண்ணெய் குளியல், சனி வழிபாடு, ஆஞ்சநேயர் வழிபாடு. சனி தசையின் நீண்ட படைப்பு வேலை — ஒரு நூற்றாண்டு நிற்கும் கட்டிடம், மற்றவர்களுக்கு முன்மாதிரியாகும் வடிவமைப்பு மொழி — சனி கோரும் நீடித்த அர்ப்பணத்தையே கோருகிறது. கட்டுப்பாட்டை நீடித்த படைப்புக்கான நிபந்தனையாக ஏற்றுக்கொள்ளுங்கள்.",
      },
      {
        expect: "பிற்கால பணி ஆண்டுகளில் வரும் புதன் தசை கன்னி-பாத சித்திரைக்கு ராசி அதிபதியின் வருகை. புதன் உங்கள் ராசியான கன்னியின் அதிபதி — இது கன்னியில் பிறந்த சித்திரை ஜாதகர்களுக்கு இரட்டை வலிமையுடன் வருகிறது. புதன் தரும் பகுப்பாய்வுத் துல்லியம், தொடர்புத் தேர்ச்சி, முறைசார் நுண்ணறிவு ஆகியவை சித்திரையின் படைப்பை தனித்துவமாக்கிய திறன்களையே பெருக்குகின்றன — ஒரு வடிவமைப்பு ஏன் வேலை செய்கிறது என்பதைப் புரிந்துகொள்வது, அழகியல் கொள்கையை எடுத்துரைப்பது, அழகின் தர்க்கத்தைக் கற்பிப்பது. வடிவமைப்பைப் பற்றி எழுதுவது, வடிவமைப்புச் செயல்முறையைக் கற்பிப்பது, அல்லது சித்திரையின் துறையை விளக்கும் பகுப்பாய்வுப் பணி வாழ்நாள் உச்சத்தை அடைகிறது. துலா-பாத (மூன்றாம், நான்காம் பாதம்) சித்திரைக்கு புதன் தசை பிற்கால வாழ்வின் துல்லியம், தெளிவான ஞானத்தின் கொடை.",
        navigate: "இந்த வயதில் புதனின் ஆரோக்கிய கவலைகள் நரம்பு மண்டலம், சுவாசம். சித்திரையின் முழு படைப்பு வாழ்வையும் இயக்கிய முழுமைவாதம் இந்த வயதில் சமநிலைப்படுத்தப்பட வேண்டும் — தரம் எப்போதும் போலவே உயர்ந்ததாக இருக்கட்டும், ஆனால் கிடைக்கும் உடல் சக்தி எல்லைக்குட்பட்டது. புதன்–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) அசாதாரண பிற்கால தொழில் வாய்ப்புகளையோ தடங்கல்களையோ கொண்டுவரலாம்.",
        focus: "புதன்கிழமை வழிபாடு, பசுமை அர்ப்பணம். வடிவமைப்பு பற்றிய அல்லது அழகியல் தத்துவம் பற்றிய எழுத்து.",
      },
      {
        expect: "முதிர்ந்த வயதில் வரும் கேது தசை சித்திரையின் வாழ்நாள் வெளிப்புறப் படைப்புப் பார்வையை உள்நோக்கித் திருப்புகிறது. உருவாக்கும் உந்துதல் நிற்காது — ஆனால் அளவு எளிமைப்படுகிறது, பார்வையாளர் சாரத்துக்குச் சுருங்குகிறார், நோக்கம் நற்பெயரிலிருந்து வெளிப்பாட்டுக்குத் தெளிவடைகிறது. சித்திரையின் அழகியல் உணர்வுக்கு எப்போதும் அடியில் இருந்த ஆன்மீக ஆழம் இப்போது நேரடியாக மேலெழுகிறது: த்வஷ்டாவின் படைப்புச் செயலும் தெய்வத்தின் சுய வெளிப்பாடும் இறுதியில் ஒன்றே என்ற உணர்தல்.",
        navigate: "சமூக மற்றும் தொழில்முறை ஈடுபாட்டிலிருந்து கேதுவின் திரும்பல் பொருத்தமானது; அது முழுமையான தனிமையாக மாறாமல் உறுதி செய்யுங்கள். ஒரு பேரக்குழந்தைக்கு செய்யப்பட்ட ஒரு நகை போன்ற சிறிய அளவிலான படைப்பு செயல்கள் கை நுண்ணறிவை பராமரிக்கின்றன.",
        focus: "விநாயகர் வழிபாடு, கேது சன்னதி வழிபாடு, பித்ரு தர்ப்பணம், தினசரி பக்திச் செயல்களாக எளிய, அழகான படைப்புப் பயிற்சிகள். த்வஷ்டாவின் பிள்ளை, ஒரு வாழ்நாள் கட்டி வடிவமைத்தபின், இப்போது மிகவும் தனிப்பட்ட, அந்தரங்கமான பதிவில் படைக்கிறார்.",
      },
      {
        expect: "மிக முதிர்ந்த வயதில் மட்டுமே தொடங்கும் சுக்கிர தசை துலா-பாத சித்திரைக்கு ராசி அதிபதியின் வருகை. சுக்கிரன் உங்கள் ராசியான துலாவின் அதிபதி — இது துலாவில் பிறந்த சித்திரை ஜாதகர்களுக்கு இரட்டை வலிமையுடன் வருகிறது. அழகு, அன்பு, அழகியல் செம்மை, படைப்பு இணைப்பின் அரவணைப்பு ஆகியவை இந்த வயதில் மிகவும் சுதந்திரமாக வெளிப்படும் வடிவத்தை அடைகின்றன. சனியின் நீண்ட கட்டுப்பாடு, புதனின் பகுப்பாய்வுக் கடுமை ஆகிய ஒழுக்கத்தின் பல தசகங்கள் தூய அழகியல் மகிழ்ச்சிக்கான ஆற்றலை உருவாக்கியுள்ளன; அது இப்போது முழுமையாகக் கிடைக்கிறது. கன்னி-பாத சித்திரைக்கு இந்த மிக முதிர்ந்த வயதில் சுக்கிர தசை புலன் அழகின் இறுதி மலர்ச்சியைக் கொண்டுவருகிறது.",
        navigate: "இந்த வயதில், உடல் பராமரிப்பு முதன்மை: அரவணைப்பு, இசை, உடனடி சூழலில் அழகு, சித்திரையின் வாழ்நாள் பணியைப் புரிந்து மதிப்பவர்களின் இருப்பு. நரம்பு மண்டலமும் இதய-இரத்தக் குழாய் அமைப்பும் மென்மையான, நிலையான ஆதரவைக் கோருகின்றன.",
        focus: "வெள்ளிக்கிழமை லட்சுமி வழிபாடு, ரோஜா, மல்லிகை அர்ப்பணம், இசை, கலை, இயற்கை வடிவங்களின் அழகு — மலர்கள், நீர், ஒளி — சுக்கிரனின் முதன்மைத் துணைகள். த்வஷ்டாவின் வாரிசு எப்போதும் நோக்கமாக இருந்த அழகால் சூழப்பட்டு சுக்கிரனின் தோட்டத்தில் முடிகிறார்.",
      },
      {
        expect: "இந்த வரிசையின் கடைசி தசையான சூரிய தசையைக் கிட்டத்தட்ட யாரும் அடைவதில்லை. அடையும் அந்த உன்னத சித்திரை ஆத்மாக்களுக்கு, சூரியன் ஒளிரும் தெளிவின் இறுதித் தரத்தைக் கொண்டுவருகிறான் — படைப்பு மனக்காட்சியும் அதன் மூலமும் ஒன்றே என்ற உணர்தல். சித்திரையின் சின்னமான பிரகாசமான இரத்தினம் அது பிரதிபலிக்கும் ஒளியிலிருந்து பிரித்தறிய முடியாதது.",
        navigate: "முழுமையான, மென்மையான பராமரிப்பு. இந்த வயதில் உள்ளவர் சாத்தியமான மிகச் செழுமையான படைப்பு வாழ்வுகளில் ஒன்றை நிறைவு செய்திருக்கிறார்; அவருக்குத் தேவை அரவணைப்பு, ஒளி, அன்பான இருப்பு.",
        focus: "ஞாயிற்றுக்கிழமை சூரிய வழிபாடு, ஆதித்ய ஹ்ருதயம் பாராயணம். கைவினைஞரும் தெய்வீகக் கைவினைஞரும் இறுதியில் எப்போதும் ஒருவரே.",
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
  return <NatchathiramVisualContent data={CHITRA} visual={CHITRA_VISUAL} timings={dasaTimingsFor(CHITRA.number)} />;
}
