import type { Metadata } from "next";
import { withTamilTwin } from "@/lib/localized-metadata";
import { withDasaTimingHold } from "@/lib/natchathiram-dasa-hold";
import { dasaTimingsFor } from "@/lib/natchathiram-dasa-timings";
import { nakshatraDisplayName } from "@/lib/nakshatra-display-name";
import { natchathiramVisualTa } from "@/lib/marketing-seo-ta";
import { HASTA } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

const EN_METADATA: Metadata = {
  title: `${nakshatraDisplayName(HASTA.number, "en")} — Visual Profile`,
  description: "Visual profile of Hastham Nakshathiram: personality traits, career strengths, dasa timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/hasta/visual" },
  openGraph: {
    title: `${nakshatraDisplayName(HASTA.number, "en")} — Visual Profile`,
    description: "Visual profile of Hastham Nakshathiram: personality traits, career strengths, dasa timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/hasta/visual",
    type: "article",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withDasaTimingHold(await withTamilTwin(EN_METADATA, "/natchathiram/hasta/visual", natchathiramVisualTa("hasta")!), "hasta");
}

const HASTA_VISUAL: NatchathiramVisualData = {
  atAGlance: [
    { label: "Manual Dexterity",      score: 97 },
    { label: "Healing Touch",         score: 94 },
    { label: "Precision & Craft",     score: 93 },
    { label: "Wit & Humour",          score: 91 },
    { label: "Adaptive Intelligence", score: 90 },
  ],

  radar: {
    labels: ["Dexterity", "Healing", "Precision", "Wit", "Adaptability", "Industriousness"],
    values: [97, 94, 93, 91, 90, 92],
  },

  coreStrengths: [
    { symbol: "◎", label: "Manual Dexterity",        score: 97, desc: "Savitar's gift — the hand that heals, creates, or performs reaches a precision that the mind alone could never direct." },
    { symbol: "◈", label: "Healing Intelligence",     score: 94, desc: "The physician's hand extended — Hasta instinctively knows where to touch, adjust, and restore." },
    { symbol: "⚡", label: "Precision & Craft",       score: 93, desc: "The craftsperson who makes it look easy — every movement of Hasta's hands is calibrated without conscious calculation." },
    { symbol: "♥", label: "Wit & Social Ease",       score: 91, desc: "The laughing hand of the Sun — Hasta disarms with humour and moves through social spaces with natural lightness." },
    { symbol: "△", label: "Adaptive Intelligence",   score: 90, desc: "Mercury's Kanya rasi — Hasta reads a situation and adapts the approach with the speed and precision of a craftsperson resetting a tool." },
    { symbol: "☽", label: "Industrious Application", score: 92, desc: "Hands that do not rest — Hasta's productivity is not driven, it is constitutional; they simply cannot not work." },
  ],

  careerAbilities: [
    { label: "Surgery & Manual Medicine",  score: 97 },
    { label: "Crafts & Fine Arts",         score: 94 },
    { label: "Technology & Engineering",   score: 93 },
    { label: "Financial Analysis",         score: 90 },
    { label: "Comedy & Performance",       score: 89 },
  ],
  careerNote: "Hasta thrives wherever skilled hands, precision intelligence, and adaptive problem-solving combine — the surgeon, the jeweller, the software engineer, the comedian who lands every timing perfectly.",

  careerClusters: [
    { symbol: "◎", title: "Surgery & Medical Practice",  desc: "Surgical specialties, physiotherapy, manual medicine — Savitar's healing hand embodied." },
    { symbol: "◈", title: "Crafts, Art & Jewellery",     desc: "Fine craftsmanship, textile arts, jewellery design, sculpture — the precision of Hasta's hands as beauty." },
    { symbol: "⚡", title: "Technology & Engineering",   desc: "Mechanical and electronic engineering, precision manufacturing, robotics." },
    { symbol: "♥", title: "Finance & Accounting",       desc: "Detailed financial analysis, auditing, trading — Mercury-precision meeting the Sun's authority." },
    { symbol: "△", title: "Comedy & Communication",     desc: "Performance, stand-up comedy, writing, broadcasting — the laughing hand extended into public expression." },
    { symbol: "☽", title: "Healing & Bodywork",         desc: "Massage, acupuncture, chiropractic, physiotherapy — the body known through the hands." },
  ],

  modernApps: [
    { symbol: "◎", title: "MedTech & Surgical Innovation", desc: "Surgical robotics, medical device engineering, precision healthcare platforms." },
    { symbol: "◈", title: "Digital Art & Design",          desc: "Graphic design, digital craftsmanship, UI/UX design — Hasta's hands in the digital medium." },
    { symbol: "⚡", title: "Hardware & Robotics",           desc: "Precision engineering platforms, robotic systems, IoT development." },
    { symbol: "♥", title: "FinTech & Quantitative Finance", desc: "Trading algorithms, financial modelling, precision analytics platforms." },
    { symbol: "△", title: "Comedy & Content Creation",     desc: "Comedic content, viral short-form media, witty brand communication." },
    { symbol: "☽", title: "Wellness Tech & Bodywork",      desc: "Digital wellness platforms, physical therapy apps, body-intelligence tools." },
  ],

  dashaTimeline: [
    {
      planet: "Moon", theme: "Born in the Healing Stream",
      detail: {
        expect: "Hasta opens in Moon dasa — childhood bathed in emotional sensitivity and the early flowering of the hands' intelligence. Moon's is a short opening dasa, and the balance left at birth runs from long for births in the first pada to brief for the fourth; the range shown for this dasa gives it. Infancy often shows unusual motor development — Hasta babies are noted for the purposeful precision of their hand movements before language appears. Where the balance runs on into early childhood, it produces a child who learns through making, touching, and fixing: the one who takes toys apart to understand them, who draws with unusual accuracy, who helps in the kitchen with a child's seriousness. Where the dasa reaches the school years, Hasta's social ease and natural wit emerge — the child who makes the class laugh while also finishing the task first.",
        navigate: "Moon dasa's primary vulnerabilities for Hasta in childhood are emotional sensitivity, digestive function, and cold-related illness. The hands' intelligence developing in Moon dasa can produce frustration when the child's manual capabilities exceed their verbal expression — give Hasta children craft, art, and physical activity rather than only sedentary learning. The Moon–Rahu bhukti (the table below gives when it begins and how long it lasts; for the shorter balances it falls before birth) can bring a brief period of social or family turbulence.",
        focus: "Monday Moon worship, white flower offerings, and giving the Hasta child abundant hands-on creative materials — clay, craft, instruments, basic tools — are the most formative investments. The hands that will later heal, create, or engineer are learning their intelligence here.",
      },
    },
    {
      planet: "Mars", theme: "The Hands Find Their Force",
      detail: {
        expect: "Mars dasa brings energy, drive, and the first serious testing of Hasta's manual intelligence; it falls in childhood for the later padas and reaches into adolescence for the first. Sports, crafts, martial arts, mechanical hobbies, or early musical instrument practice all intensify in Mars dasa — Hasta at this stage discovers the domains where their hands' precision becomes something formidable. Academic performance, especially in practical subjects, often exceeds that of peers in these years. The first serious ambition takes shape.",
        navigate: "Mars's energy in childhood and adolescence for Hasta can produce impatience with slower-moving peers and teachers, and occasionally impulsive commitments. Physical concerns: injury to hands and fingers deserves particular attention — Hasta's primary instrument must be protected. The Mars–Saturn bhukti (the table below gives when it begins and how long it lasts) brings a period of useful discipline but also frustration.",
        focus: "Tuesday Mars shrine prayers and red offerings. Channel Mars's drive into one well-chosen manual or craft discipline — the commitment made to a skill in Mars dasa tends to be the technical foundation that sustains the rest of the life.",
      },
    },
    {
      planet: "Rahu", theme: "The World Receives the Hands",
      detail: {
        expect: "Rahu dasa is when Hasta's hands meet the world at scale; it carries Hasta from school and adolescence into the first working years of adult life. Advanced education or professional training establishes the technical domain; medicine, engineering, design, finance, or performance all emerge as natural professional homes. Career foundations are laid and early professional recognition arrives — Hasta's precision and adaptability distinguish them in almost any field they choose. Marriage and family formation may fall within this dasa. A node carries no marriage significator of its own: where marriage falls in Rahu's dasa, it is read from Rahu's dispositor and from the seventh house and its lord, with Venus and Jupiter as the significators, not from Rahu itself, and judged from the individual horoscope as a tendency rather than a fixed time. Social networks widen; the wit and ease that Moon dasa cultivated and Mars dasa sharpened now serves Hasta brilliantly in professional social contexts.",
        navigate: "Rahu's long expansion through the professional formation years can produce overcommitment to multiple domains. Hasta's natural adaptability is an asset; its shadow is the person who is technically excellent at many things but does not master any one. The Rahu–Saturn bhukti (the table below gives when it begins and how long it lasts) is the most demanding sub-period. Physical concerns specific to Hasta in Rahu dasa: repetitive strain injuries, wrist and hand conditions from overwork.",
        focus: "Saturday Rahu shrine and deliberate depth-over-breadth choices in the technical domain. Also watch the Rahu–Mercury bhukti (the bhukti table below gives when it begins and how long it lasts) — Mercury is the lord of your rasi, Kanya; this sub-period carries the rasi lord's amplified analytical and communicative precision. Exceptional professional output — the breakthrough technical contribution, the significant analytical publication, or the precision performance that defines a career — often lands here.",
      },
    },
    {
      planet: "Jupiter", theme: "Mastery Recognised",
      detail: {
        expect: "Jupiter dasa, in mid-life, is when Hasta's technical mastery reaches professional peak and begins to be transmitted as wisdom. Leadership in the chosen field — senior surgeon, master craftsperson, principal engineer, head of a creative studio — becomes the natural terrain. Mentoring younger practitioners arrives naturally; Hasta discovers that teaching the hands' intelligence is as satisfying as exercising it. Family life is in full flower; the home life Hasta builds is often one of unusual practical beauty — well-made things, well-maintained spaces.",
        navigate: "Jupiter's expansion can produce over-commitment to mentoring and teaching at the expense of Hasta's own technical practice. The hands must keep working, not only directing. Cardiovascular and liver health deserve attention as this dasa advances. The Jupiter–Rahu bhukti (the table below gives when it begins and how long it lasts) can bring unusual disruptions or breakthroughs.",
        focus: "Thursday Brihaspati worship and sustained personal technical practice alongside mentoring. The Jupiter–Mercury bhukti (the bhukti table below gives when it begins and how long it lasts) is worth preparing for: Mercury as rasi lord in Jupiter's generous context produces one of the most intellectually and technically fertile windows of Hasta's life.",
      },
    },
    {
      planet: "Saturn", theme: "The Long Patient Work",
      detail: {
        expect: "Saturn dasa, running into the later years, brings the long, patient, deepening work that is the hallmark of a mature Hasta. Career transitions from active production toward architectural influence — the senior practitioner who sets standards, trains successors, and builds institutions. Retirement from primary professional work may come toward the close of this dasa, but Hasta's hands never fully stop: hobbies, crafts, garden, grandchildren's projects all become the new technical territory. Financial and property matters consolidate; the life simplifies without diminishing.",
        navigate: "Saturn's primary health concerns for Hasta in this dasa are musculoskeletal (particularly hands, wrists, and fingers), cardiovascular, and respiratory. Repetitive strain from decades of precise manual work may require specific physiotherapeutic attention. The Saturn–Rahu bhukti (the table below gives when it begins and how long it lasts) is the most demanding sub-period.",
        focus: "Saturday oil bath, Shani worship and Hanuman worship are essential. Specific attention to hand and wrist maintenance — gentle exercise, appropriate rest, and protective measures — is the most important physical self-care for Hasta in Saturn dasa.",
      },
    },
    {
      planet: "Mercury", theme: "Rasi Lord — The Great Precision",
      detail: {
        expect: "Mercury dasa, in the late years, is the rasi lord's arrival for Hasta. Mercury is the lord of your rasi, Kanya — this makes his dasa doubly charged for Hasta natives. The analytical intelligence, communicative precision, and systematic wisdom accumulated across a lifetime now find their fullest and most refined expression. Writing — a memoir of technical mastery, a guide to craft, a systematic account of the healing art — becomes the primary mode of transmission. Wit, which has been present throughout the life, reaches a particular crystalline quality in Mercury dasa; Hasta in these late years are often the most amusing and perceptive people in any room.",
        navigate: "Mercury's health concerns at this age are primarily nervous system and respiratory. Mental agility maintained through active intellectual and communicative engagement outlasts physical capacity. Mercury dasa's primary shadow for Hasta is the temptation to scatter across too many final projects; choose one significant communicative or technical legacy work and complete it.",
        focus: "Wednesday worship, green offerings, and sustained writing or teaching practice are Mercury's primary remedies. Vishnu Sahasranama and Gayatri Mantra are the most resonant recitations. The hands that have healed and created across a lifetime now transmit their wisdom in words.",
      },
    },
    {
      planet: "Ketu", theme: "Still Hands, Full Heart",
      detail: {
        expect: "Ketu dasa, in very advanced age, calls Hasta into a stillness the hands have never fully known. The making and the healing that have defined a lifetime gradually yield to the receiving — of care, of presence, of the accumulated love that Hasta's hands have built. Spiritual depth surfaces with unusual clarity. The wit remains; the precision remains in perception if not in physical expression; the healing intelligence simply rests in its own completeness.",
        navigate: "Complete physical care from attentive caregivers is the primary requirement. Ketu's natural withdrawal is appropriate at this age; ensure spiritual companionship alongside physical care. The hands may no longer build, but the wisdom they accumulated over a lifetime is entire.",
        focus: "Ganapati worship, Ketu shrine visits, pitru tharpanam, and black sesame offerings. Savitar's gift — the hand extended in healing and creation — has completed its arc. What remains is the warmth of everything it touched.",
      },
    },
    {
      planet: "Venus", theme: "Beauty Without End",
      detail: {
        expect: "Venus dasa, the last in this sequence, is reached by virtually none. For the rare Hasta soul who arrives here, Venus brings the final flowering of beauty — the recognition that the precision and craft that defined a lifetime was itself a form of love, and that love, in Venus's dasa, simply continues.",
        navigate: "Complete and tender physical care. The body's requirements are simple; the person's spiritual and relational needs are profound.",
        focus: "Friday Lakshmi worship, rose and jasmine offerings, and the presence of music and natural beauty. Savitar's child ends in Venus's garden of light.",
      },
    },
  ],

  spirituality: [
    {
      title: "Savitar & Sun Worship",
      desc: "Savitar, the golden-handed sun god, is Hasta's presiding deity — Sunday Surya worship, Aditya Hridayam recitation, and offerings at dawn connect Hasta to the source of their hands' intelligence.",
    },
    {
      title: "Mercury & Craft Devotion",
      desc: "Kanya's Mercury amplifies Hasta's precision — Wednesday worship, Vishnu Sahasranama, and the practice of a single craft or healing discipline as a spiritual act are deeply resonant practices.",
    },
    {
      title: "Healing Shrines & Dhanvantari",
      desc: "Dhanvantari worship — the divine physician — and temples associated with healing arts carry particular resonance for Hasta. Performing service with the hands (annadanam, seva, medical volunteer work) as devotional practice is the highest Hasta expression.",
    },
  ],

  guidance: "The hand that heals knows something the mind cannot fully articulate. Trust that knowing — the precision, the wit, the healing touch — and let it lead. The analytical mind of Kanya and the solar joy of Savitar are not separate capacities; they are one instrument. When they work together, Hasta creates things the world does not forget.",

  compatibleEn: ["Uthiram", "Swathi", "Thiruvonam", "Anusham", "Rohini"],
  compatibleNote: "These nakshatras complement Hasta's precision, healing intelligence, and adaptive wit with warmth, depth, and complementary service orientation.",

  ta: {
    atAGlanceLabels: ["கை திறன்", "குணப்படுத்தும் தொடு", "துல்லியம் & கைவினை", "நகைச்சுவை & இலகுவான தன்மை", "தகவமைப்பு நுண்ணறிவு"],
    radarLabels: ["கை திறன்", "குணப்படுத்தல்", "துல்லியம்", "நகைச்சுவை", "தகவமைப்பு", "உழைப்பு"],
    coreStrengths: [
      { label: "கை திறன்",               desc: "சவிதாவின் கொடை — குணப்படுத்தும், படைக்கும், அல்லது செய்யும் கை மனம் மட்டுமே ஒருபோதும் நிர்வகிக்க முடியாத துல்லியத்தை அடைகிறது." },
      { label: "குணப்படுத்தும் நுண்ணறிவு", desc: "மருத்துவரின் கை நீட்டியது — ஹஸ்தம் இயல்பாக எங்கே தொட, சரிசெய், மீட்டெடுக்க என்று தெரிகிறது." },
      { label: "துல்லியம் & கைவினை",      desc: "எளிதாக காட்டும் கைவினைஞர் — ஹஸ்தத்தின் கை அசைவுகள் ஒவ்வொன்றும் மனசாட்சி கணக்கீடு இல்லாமல் சீரமைக்கப்படுகின்றன." },
      { label: "நகைச்சுவை & சமூக இலகுவான தன்மை", desc: "சூரியனின் சிரிக்கும் கை — ஹஸ்த ஜாதகர் நகைச்சுவையால் சூழலை இலகுவாக்குகிறார் மற்றும் இயல்பான இலகுவுடன் சமூக இடங்களில் நகர்கிறார்." },
      { label: "தகவமைப்பு நுண்ணறிவு",     desc: "புதனின் கன்னி ராசி — ஹஸ்த ஜாதகர் ஒரு சூழ்நிலையை படிக்கிறார் மற்றும் கைவினைஞர் ஒரு கருவியை மீட்டமைக்கும் வேகம் மற்றும் துல்லியத்துடன் அணுகுமுறையை மாற்றுகிறார்." },
      { label: "உழைப்பு பயன்பாடு",        desc: "ஓயாத கைகள் — ஹஸ்தத்தின் உற்பத்தித்திறன் இயக்கப்படவில்லை, இது இயல்பானது; அவர்கள் வேலை செய்யாமல் இருக்க முடியாது." },
    ],
    careerAbilityLabels: ["அறுவை சிகிச்சை & கை மருத்துவம்", "கைவினை & நுண்கலை", "தொழில்நுட்பம் & பொறியியல்", "நிதி பகுப்பாய்வு", "நகைச்சுவை & செயல்திறன்"],
    careerClusters: [
      { title: "அறுவை சிகிச்சை & மருத்துவ நடைமுறை", desc: "அறுவை சிகிச்சை சிறப்புகள், மருந்தியல் சிகிச்சை, கை மருத்துவம் — சவிதாவின் குணப்படுத்தும் கை உருவகமானது." },
      { title: "கைவினை, கலை & நகை",          desc: "நுண் கைவினை, துணிக்கலை, நகை வடிவமைப்பு, சிற்பம் — ஹஸ்தத்தின் கைகளின் துல்லியம் அழகாக." },
      { title: "தொழில்நுட்பம் & பொறியியல்",   desc: "இயந்திர மற்றும் மின்னணு பொறியியல், துல்லிய உற்பத்தி, இயங்கியல்." },
      { title: "நிதி & கணக்கியல்",             desc: "விரிவான நிதி பகுப்பாய்வு, கணக்காய்வு, வர்த்தகம் — சூரியனின் அதிகாரத்தை சந்திக்கும் புதன்-துல்லியம்." },
      { title: "நகைச்சுவை & தொடர்பு",         desc: "செயல்திறன், ஸ்டாண்ட்-அப் நகைச்சுவை, எழுத்து, ஒளிபரப்பு — சிரிக்கும் கை பொது வெளிப்பாட்டிற்கு நீட்டியது." },
      { title: "குணப்படுத்தல் & உடல் வேலை",   desc: "மசாஜ், குத்தூசி மருத்துவம், சிரோபிராக்டிக், மருந்தியல் சிகிச்சை — கைகளின் மூலம் அறியப்படும் உடல்." },
    ],
    modernApps: [
      { title: "மெட்டெக் & அறுவை சிகிச்சை கண்டுபிடிப்பு", desc: "அறுவை சிகிச்சை இயங்கியல், மருத்துவ சாதன பொறியியல், துல்லிய சுகாதார தளங்கள்." },
      { title: "டிஜிட்டல் கலை & வடிவமைப்பு",    desc: "கிராபிக் வடிவமைப்பு, டிஜிட்டல் கைவினை, இடைமுக–பயனர் அனுபவ வடிவமைப்பு — டிஜிட்டல் ஊடகத்தில் ஹஸ்தத்தின் கைகள்." },
      { title: "வன்பொருள் & இயங்கியல்",          desc: "துல்லிய பொறியியல் தளங்கள், இயங்கு அமைப்புகள், IoT வளர்ச்சி." },
      { title: "நிதி தொழில்நுட்பம் & அளவு நிதி", desc: "வர்த்தக அல்காரிதம்கள், நிதி மாதிரியாக்கம், துல்லிய பகுப்பாய்வு தளங்கள்." },
      { title: "நகைச்சுவை & உள்ளடக்க உருவாக்கம்", desc: "நகைச்சுவை உள்ளடக்கம், வைரல் குறும்படம், துள்ளிப்பரவும் பிராண்ட் தொடர்பு." },
      { title: "ஆரோக்கிய தொழில்நுட்பம் & உடல் வேலை", desc: "டிஜிட்டல் ஆரோக்கிய தளங்கள், மருந்தியல் சிகிச்சை ஆப்கள், உடல்-நுண்ணறிவு கருவிகள்." },
    ],
    dashaThemes: [
      "குணப்படுத்தும் நீரோட்டத்தில் பிறப்பு — சந்திர உணர்திறன், கை நுண்ணறிவு தொடக்கம்",
      "கைகள் தங்கள் வலிமையை கண்டுபிடிக்கின்றன — செவ்வாய் ஆற்றல், முதல் தொழில்நுட்ப அர்ப்பணம்",
      "உலகம் கைகளை பெறுகிறது — ராகு விரிவாக்கம், தொழில் நிறுவல்",
      "தேர்ச்சி அங்கீகரிக்கப்படுகிறது — குரு தலைமை, வழிகாட்டல்",
      "நீண்ட பொறுமையான வேலை — சனி முதிர்ந்த தசகங்கள்",
      "கன்னி ராசி அதிபதி — மாபெரும் துல்லியம் — புதன் தசை",
      "அமைதியான கைகள், நிரம்பிய இதயம் — கேது நிறைவு",
      "முடிவில்லாத அழகு — சுக்கிர இறுதி மலர்ச்சி",
    ],
    dashaDetails: [
      {
        expect: "ஹஸ்தம் சந்திர தசையில் தொடங்குகிறது — உணர்வு நுட்பத்திலும் கை நுண்ணறிவின் ஆரம்ப மலர்ச்சியிலும் தோய்ந்த குழந்தைப் பருவம். சந்திரன் குறுகிய தொடக்க தசை; பிறக்கும்போது மீதமுள்ள இருப்பு முதல் பாதத்தில் நீளமாகவும் நான்காம் பாதத்தில் சிறிதாகவும் இருக்கும் — இந்த தசைக்குக் காட்டப்படும் வரம்பு அதைச் சொல்கிறது. குழந்தைப் பருவத்தின் தொடக்கத்தில் அசாதாரண இயக்க வளர்ச்சி பெரும்பாலும் தெரியும் — ஹஸ்தக் குழந்தைகள் மொழி வருவதற்கு முன்பே தம் கை அசைவுகளின் நோக்கமுள்ள துல்லியத்துக்காகக் குறிப்பிடப்படுகிறார்கள். இருப்பு ஆரம்பக் குழந்தைப் பருவம் வரை நீண்டால், தொட்டுப் பார்த்தும் செய்தும் சரிசெய்தும் கற்கும் குழந்தை உருவாகிறது: பொம்மைகளைப் புரிந்துகொள்ள பிரித்துப் பார்ப்பவர், அசாதாரணத் துல்லியத்துடன் வரைபவர், குழந்தையின் தீவிரத்துடன் சமையலறையில் உதவுபவர். தசை பள்ளிக் காலத்தை எட்டினால் ஹஸ்தத்தின் சமூக இலகுத்தன்மையும் இயல்பான நகைச்சுவையும் வெளிப்படுகின்றன — வகுப்பைச் சிரிக்க வைத்தபடியே முதலில் வேலையை முடிக்கும் குழந்தை.",
        navigate: "குழந்தைப் பருவத்தில் ஹஸ்தத்திற்கு சந்திர தசையின் முதன்மைப் பாதிப்புகள் உணர்வு உணர்திறன், செரிமான செயல்பாடு, குளிர் தொடர்பான நோய். சந்திர தசையில் வளரும் கை நுண்ணறிவு, குழந்தையின் கைத்திறன் அதன் வாய்மொழி வெளிப்பாட்டை மீறும்போது விரக்தியை உருவாக்கலாம் — ஹஸ்தக் குழந்தைகளுக்கு உட்கார்ந்த கற்றலை மட்டும் அல்லாமல் கைவினை, கலை, உடல் செயல்பாடுகளையும் கொடுங்கள். சந்திர–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்; குறைந்த இருப்பில் அது பிறப்புக்கு முன்பே வந்துவிடும்) சுருக்கமான சமூக அல்லது குடும்பக் கலக்கத்தைக் கொண்டுவரலாம்.",
        focus: "திங்கட்கிழமை சந்திர வழிபாடு, வெள்ளை பூ அர்ப்பணம். ஹஸ்த குழந்தைக்கு ஏராளமான கைகளால் செய்யும் படைப்பு பொருட்களை கொடுங்கள் — களிமண், கைவினை, கருவிகள்.",
      },
      {
        expect: "செவ்வாய் தசை ஹஸ்தத்தின் கை நுண்ணறிவுக்கு ஆற்றல், வேகம், முதல் தீவிரச் சோதனையைக் கொண்டுவருகிறது; பிந்தைய பாதங்களில் இது குழந்தைப் பருவத்திலும், முதல் பாதத்தில் வளரிளம் பருவம் வரையிலும் வருகிறது. விளையாட்டு, கைவினை, தற்காப்புக் கலை, இயந்திரப் பொழுதுபோக்குகள், ஆரம்பகால இசைக்கருவிப் பயிற்சி எல்லாம் செவ்வாய் தசையில் தீவிரமடைகின்றன — இந்த கட்டத்தில் ஹஸ்த ஜாதகர் தன் கைகளின் துல்லியம் வலிமையான ஒன்றாக மாறும் துறைகளைக் கண்டுபிடிக்கிறார். இந்த ஆண்டுகளில் கல்விச் செயல்திறன், குறிப்பாக செய்முறைப் பாடங்களில், சகாக்களை விட அடிக்கடி மேலோங்கும். முதல் தீவிர இலட்சியம் உருவாகிறது.",
        navigate: "குழந்தைப் பருவத்திலும் வளரிளம் பருவத்திலும் ஹஸ்தத்தில் செவ்வாயின் ஆற்றல், மெதுவாக நகரும் சகாக்கள், ஆசிரியர்களிடம் பொறுமையின்மையையும் சில நேரம் அவசர உறுதிமொழிகளையும் உருவாக்கலாம். உடல் கவலைகள்: கைகள், விரல்களுக்கு ஏற்படும் காயத்துக்கு குறிப்பிட்ட கவனம் தேவை — ஹஸ்தத்தின் முதன்மைக் கருவி பாதுகாக்கப்பட வேண்டும். செவ்வாய்–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) பயனுள்ள ஒழுக்கத்தையும் விரக்தியையும் ஒருசேரக் கொண்டுவருகிறது.",
        focus: "செவ்வாய்க்கிழமை செவ்வாய் சன்னதி வழிபாடு. ஒரு நல்ல கை அல்லது கைவினை ஒழுக்கத்தில் செவ்வாயின் வேகத்தை திசைப்படுத்துங்கள் — இந்த தசையில் ஒரு திறமைக்கான அர்ப்பணம் ஆயுள் முழுவதுமான பயிற்சியாக மாறுகிறது.",
      },
      {
        expect: "ராகு தசையில்தான் ஹஸ்தத்தின் கைகள் உலகை பெரிய அளவில் சந்திக்கின்றன; பள்ளி, வளரிளம் பருவத்திலிருந்து வயது வந்த வாழ்வின் முதல் பணி ஆண்டுகளுக்கு அழைத்துச் செல்கிறது. உயர் கல்வி அல்லது தொழில்முறைப் பயிற்சி தொழில்நுட்பத் துறையை நிறுவுகிறது; மருத்துவம், பொறியியல், வடிவமைப்பு, நிதி, நிகழ்த்துகலை அனைத்தும் இயல்பான தொழில் இல்லங்களாக எழுகின்றன. தொழில் அடித்தளம் இடப்பட்டு ஆரம்பகால தொழில் அங்கீகாரம் வருகிறது — ஹஸ்தத்தின் துல்லியமும் தகவமைப்பும் அவர் தேர்ந்தெடுக்கும் எந்தத் துறையிலும் அவரைத் தனித்துக்காட்டுகின்றன. திருமணமும் குடும்ப அமைவும் இந்தத் தசைக்குள் அமையலாம். சாயாக் கிரகத்துக்குத் திருமணக் காரகத்துவம் இல்லை. ராகு தசைக்குள் திருமணம் அமைந்தால், அது ராகுவைக் கொண்டு அல்ல — ராகு நின்ற ராசியின் அதிபதி, ஜாதகத்தின் ஏழாம் வீடு, அதன் அதிபதி ஆகியவற்றைக் கொண்டு, சுக்கிரனையும் குருவையும் காரகர்களாகக் கொண்டு பார்க்கப்படுகிறது. அது ஒரு நிலையான காலம் அல்ல, ஒரு போக்கே. சமூக வலைப்பின்னல்கள் விரிவடைகின்றன; சந்திர தசை வளர்த்து செவ்வாய் தசை கூர்மையாக்கிய நகைச்சுவையும் இலகுத்தன்மையும் இப்போது தொழில்முறைச் சமூகச் சூழல்களில் ஹஸ்தத்துக்கு அருமையாகப் பயன்படுகின்றன.",
        navigate: "தொழில் உருவாக்க ஆண்டுகள் வழியாக ராகுவின் நீண்ட விரிவாக்கம் பல துறைகளில் அதிக அர்ப்பணத்தை உருவாக்கலாம். ஹஸ்தத்தின் இயல்பான தகவமைப்புத் திறன் ஒரு சொத்து; அதன் நிழல் பல விஷயங்களில் தொழில்நுட்பமாகச் சிறந்தவர், ஆனால் எதிலும் தேர்ச்சி பெறாதவர். ராகு–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மிகவும் கோரும் துணைக் காலம். ராகு தசையில் ஹஸ்தத்துக்கு உரிய உடல் கவலைகள்: திரும்பத் திரும்ப ஏற்படும் திரிபு காயங்கள், அதிக வேலையால் மணிக்கட்டு, கை நிலைகள்.",
        focus: "சனிக்கிழமை ராகு சன்னதி வழிபாடும், தொழில்நுட்பத் துறையில் பரப்பை விட ஆழத்தைத் தேர்ந்தெடுக்கும் வேண்டுமென்ற முடிவுகளும். கவனிக்கவும்: ராகு–புதன் புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) — புதன் உங்கள் ராசியான கன்னியின் அதிபதி; இந்த துணைக் காலம் ராசி அதிபதியின் மிகைப்படுத்தப்பட்ட பகுப்பாய்வு, தொடர்புத் துல்லியத்தைக் கொண்டுவருகிறது. விதிவிலக்கான தொழில்முறை வெளிப்பாடு — தொழில்நுட்பத் திருப்புமுனைப் பங்களிப்பு, முக்கியமான பகுப்பாய்வு வெளியீடு, அல்லது ஒரு தொழிலை வரையறுக்கும் துல்லிய நிகழ்ச்சி — பெரும்பாலும் இங்கு வரும்.",
      },
      {
        expect: "நடுவயதில் வரும் குரு தசையில் ஹஸ்தத்தின் தொழில்நுட்பத் தேர்ச்சி தொழில்முறை உச்சத்தை அடைந்து ஞானமாகக் கடத்தப்படத் தொடங்குகிறது. தேர்ந்த துறையில் தலைமை — மூத்த அறுவை சிகிச்சை நிபுணர், கைவினை ஆசான், தலைமைப் பொறியாளர், படைப்பு நிறுவனத் தலைவர் — இயல்பான நிலமாகிறது. இளைய பயிற்சியாளர்களுக்கு வழிகாட்டுதல் இயல்பாக வருகிறது; கைகளின் நுண்ணறிவைக் கற்பிப்பது அதைச் செயல்படுத்துவதைப் போலவே திருப்தி தருவதை ஹஸ்த ஜாதகர் கண்டுபிடிக்கிறார். குடும்ப வாழ்க்கை முழு மலர்ச்சியில் இருக்கும்; ஹஸ்தம் கட்டும் வீட்டு வாழ்க்கை பெரும்பாலும் அசாதாரண நடைமுறை அழகு கொண்டது — நன்கு செய்யப்பட்ட பொருட்கள், நன்கு பராமரிக்கப்பட்ட இடங்கள்.",
        navigate: "குருவின் விரிவாக்கம் ஹஸ்தத்தின் சொந்த தொழில்நுட்பப் பயிற்சியின் இழப்பில் வழிகாட்டல், கற்பித்தலில் அதிக ஈடுபாட்டை உருவாக்கலாம். கைகள் வழிநடத்துவதோடு நின்றுவிடாமல் வேலை செய்து கொண்டிருக்க வேண்டும். இந்த தசை முன்னேறும்போது இதய-இரத்தக் குழாய், கல்லீரல் ஆரோக்கியம் கவனம் பெற வேண்டும். குரு–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) அசாதாரண தடங்கல்களையோ திருப்புமுனைகளையோ கொண்டுவரலாம்.",
        focus: "வியாழக்கிழமை பிருஹஸ்பதி வழிபாடும், வழிகாட்டுதலுடன் இணைந்த நிலையான தனிப்பட்ட தொழில்நுட்பப் பயிற்சியும். குரு–புதன் புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) தயாராக வேண்டியது: குருவின் தாராளச் சூழலில் ராசி அதிபதி புதன், ஹஸ்தத்தின் வாழ்வில் அறிவு, தொழில்நுட்பம் இரண்டிலும் மிக வளமான சாளரங்களில் ஒன்றை உருவாக்குகிறார்.",
      },
      {
        expect: "பிற்கால ஆண்டுகளுக்குள் நீளும் சனி தசை, முதிர்ந்த ஹஸ்தத்தின் தனிச்சிறப்பான நீண்ட, பொறுமையான, ஆழமடையும் பணியைக் கொண்டுவருகிறது. தொழில் செயலில் உற்பத்தியிலிருந்து கட்டமைப்புச் செல்வாக்கு நோக்கி நகர்கிறது — தரங்களை நிர்ணயிக்கும், வாரிசுகளைப் பயிற்றுவிக்கும், நிறுவனங்களைக் கட்டும் மூத்த பயிற்சியாளர். முதன்மைத் தொழில் பணியிலிருந்து ஓய்வு இந்த தசையின் முடிவை நோக்கி வரலாம்; ஆனால் ஹஸ்தத்தின் கைகள் ஒருபோதும் முழுமையாக நிற்பதில்லை: பொழுதுபோக்குகள், கைவினை, தோட்டம், பேரக்குழந்தைகளின் திட்டங்கள் எல்லாம் புதிய தொழில்நுட்பத் தளமாகின்றன. நிதி மற்றும் சொத்து விஷயங்கள் ஒருங்கிணைகின்றன; வாழ்வு குறையாமல் எளிமையாகிறது.",
        navigate: "இந்த தசையில் ஹஸ்தத்துக்கு சனியின் முதன்மை ஆரோக்கிய கவலைகள் எலும்பு–மூட்டு–தசைநார் அமைப்பு (குறிப்பாக கைகள், மணிக்கட்டுகள், விரல்கள்), இதய-இரத்தக் குழாய், சுவாசம். பல தசகங்களாக துல்லியமான கை வேலை செய்ததிலிருந்து ஏற்படும் திரிபுக்கு குறிப்பிட்ட இயன்முறை மருத்துவக் கவனம் தேவைப்படலாம். சனி–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மிகவும் கோரும் துணைக் காலம்.",
        focus: "சனிக்கிழமை எண்ணெய் குளியல், சனி வழிபாடு, ஆஞ்சநேயர் வழிபாடு. கை மற்றும் மணிக்கட்டு பராமரிப்பில் குறிப்பிட்ட கவனம் — மென்மையான உடற்பயிற்சி, பொருத்தமான ஓய்வு — ஹஸ்தத்துக்கு சனி தசையில் மிக முக்கியமான உடல் சுய-பராமரிப்பு.",
      },
      {
        expect: "பிற்கால ஆண்டுகளில் வரும் புதன் தசை ஹஸ்தத்துக்கு ராசி அதிபதியின் வருகை. புதன் உங்கள் ராசியான கன்னியின் அதிபதி — இது ஹஸ்த ஜாதகர்களுக்கு இரட்டை வலிமையுடன் வருகிறது. ஒரு வாழ்நாள் திரட்டிய பகுப்பாய்வு நுண்ணறிவு, தொடர்புத் துல்லியம், முறைசார் ஞானம் இப்போது தங்கள் மிக முழுமையான, மிக நுட்பமான வெளிப்பாட்டைக் காண்கின்றன. எழுத்து — தொழில்நுட்பத் தேர்ச்சியின் நினைவுக் குறிப்பு, கைவினை வழிகாட்டி, குணப்படுத்தும் கலையின் முறையான கணக்கு — முதன்மைக் கடத்தல் முறையாகிறது. வாழ்நாள் முழுவதும் இருந்த நகைச்சுவை புதன் தசையில் ஒரு குறிப்பிட்ட படிகத் தெளிவை அடைகிறது; இந்த பிற்கால ஆண்டுகளில் ஹஸ்த ஜாதகர்கள் எந்த அறையிலும் மிகவும் நகைச்சுவையான, நுணுக்கமான கவனிப்பாளர்களாக இருப்பார்கள்.",
        navigate: "புதன் ஆரோக்கிய கவலைகள் நரம்பு மண்டலம் மற்றும் சுவாசம். மனத் சுறுசுறுப்பு செயலில் அறிவார்ந்த ஈடுபாட்டின் மூலம் பராமரிக்கப்படுகிறது. ஒரு முக்கியமான தொடர்பு அல்லது தொழில்நுட்ப மரபு வேலையை தேர்ந்தெடுத்து நிறைவு செய்யுங்கள்.",
        focus: "புதன்கிழமை வழிபாடு, பசுமை அர்ப்பணம், தொடர்ந்த எழுத்து அல்லது கற்பித்தல் பயிற்சி — புதனின் முதன்மைப் பரிகாரங்கள். விஷ்ணு சஹஸ்ரநாமமும் காயத்ரி மந்திரமும் மிகவும் ஒத்திசையும் பாராயணங்கள். ஒரு வாழ்நாள் குணப்படுத்தி உருவாக்கிய கைகள் இப்போது தம் ஞானத்தைச் சொற்களில் கடத்துகின்றன.",
      },
      {
        expect: "மிக முதிர்ந்த வயதில் வரும் கேது தசை, கைகள் ஒருபோதும் முழுமையாக அறியாத அமைதிக்கு ஹஸ்தத்தை அழைக்கிறது. ஒரு வாழ்நாளை வரையறுத்த செய்தலும் குணப்படுத்தலும் படிப்படியாக பெறுவதற்கு வழிவிடுகின்றன — அக்கறையையும் இருப்பையும் ஹஸ்தத்தின் கைகள் கட்டிய திரண்ட அன்பையும் பெறுவது. ஆன்மீக ஆழம் அசாதாரண தெளிவுடன் மேலோங்குகிறது. நகைச்சுவை நிலைத்திருக்கிறது; உடல் வெளிப்பாட்டில் இல்லாவிட்டாலும் உணர்தலில் துல்லியம் நிலைத்திருக்கிறது; குணப்படுத்தும் நுண்ணறிவு தன் முழுமையிலேயே ஓய்கிறது.",
        navigate: "கவனமான பராமரிப்பாளர்களிடமிருந்து முழுமையான உடல் பராமரிப்பே முதன்மைத் தேவை. கேதுவின் இயல்பான விலகல் இந்த வயதில் பொருத்தமானது; உடல் பராமரிப்புடன் ஆன்மீகத் துணையையும் உறுதிசெய்யுங்கள். கைகள் இனி கட்டாமல் போகலாம், ஆனால் ஒரு வாழ்நாளில் அவை திரட்டிய ஞானம் முழுமையானது.",
        focus: "விநாயகர் வழிபாடு, கேது சன்னதி வழிபாடு, பித்ரு தர்ப்பணம், கருப்பு எள் அர்ப்பணம். சவிதாவின் கொடை — குணப்படுத்தலிலும் படைப்பிலும் நீட்டப்பட்ட கை — தன் பயணத்தை நிறைவு செய்துவிட்டது. எஞ்சியிருப்பது அது தொட்ட அனைத்தின் அரவணைப்பே.",
      },
      {
        expect: "இந்த வரிசையின் கடைசி தசையான சுக்கிர தசையை நடைமுறையில் யாரும் அடைவதில்லை. இங்கு வரும் அரிய ஹஸ்த ஆத்மாவுக்கு, சுக்கிரன் அழகின் இறுதி மலர்ச்சியைக் கொண்டுவருகிறார் — ஒரு வாழ்நாளை வரையறுத்த துல்லியமும் கைவினையும் தாமே அன்பின் ஒரு வடிவம் என்ற உணர்தல்; அந்த அன்பு சுக்கிர தசையில் வெறுமனே தொடர்கிறது.",
        navigate: "முழுமையான, மென்மையான உடல் பராமரிப்பு. உடலின் தேவைகள் எளிமையானவை; அந்த நபரின் ஆன்மீக, உறவுத் தேவைகள் ஆழமானவை.",
        focus: "வெள்ளிக்கிழமை லட்சுமி வழிபாடு, ரோஜா, மல்லிகை அர்ப்பணம், இசையும் இயற்கை அழகும் சூழ்ந்த இருப்பு. சவிதாவின் பிள்ளை சுக்கிரனின் ஒளித் தோட்டத்தில் நிறைவடைகிறது.",
      },
    ],
    spirituality: [
      { title: "சவிதா & சூரிய வழிபாடு",      desc: "தங்க-கைகளுடன் கூடிய சூரிய கடவுளான சவிதா ஹஸ்தத்தின் தலைமை தெய்வம் — ஞாயிற்றுக்கிழமை சூரிய வழிபாடு, ஆதித்ய ஹ்ருதயம் பாராயணம், விடியலில் அர்ப்பணங்கள் ஹஸ்தத்தை அவர்களின் கைகளின் நுண்ணறிவின் ஆதாரத்துடன் இணைக்கின்றன." },
      { title: "புதன் & கைவினை பக்தி",         desc: "கன்னியின் புதன் ஹஸ்தத்தின் துல்லியத்தை அதிகரிக்கிறார் — புதன்கிழமை வழிபாடு, விஷ்ணு சஹஸ்ரநாம, மற்றும் ஒரு கைவினை அல்லது குணப்படுத்தல் ஒழுக்கத்தை ஆன்மீகச் செயலாகக் கடைப்பிடிப்பது ஆழமாக ஒத்திசையும்." },
      { title: "குணப்படுத்தும் தலங்கள் & தன்வந்தரி", desc: "தன்வந்தரி வழிபாடு — தெய்வீக மருத்துவர் — மற்றும் குணப்படுத்தும் கலைகளுடன் தொடர்புடைய கோவில்கள் ஹஸ்தத்துக்குக் குறிப்பிட்ட தொடர்பு கொண்டுள்ளன. கைகளால் சேவை செய்வது (அன்னதானம், சேவை, மருத்துவ தன்னார்வ வேலை) பக்திப் பயிற்சியாக மிக உயர்ந்த ஹஸ்த வெளிப்பாடு." },
    ],
    guidance: "குணப்படுத்தும் கை மனம் முழுமையாக சொல்ல முடியாத ஒன்றை அறிகிறது. அந்த அறிவை நம்புங்கள் — துல்லியம், நகைச்சுவை, குணப்படுத்தும் தொடு — மற்றும் அதை வழிநடத்தட்டும். கன்னியின் பகுப்பாய்வு மனம் மற்றும் சவிதாவின் சூரிய மகிழ்ச்சி தனித்தனி திறன்கள் அல்ல; அவை ஒரு கருவி. அவை ஒன்றாக வேலை செய்யும் போது, ஹஸ்த ஜாதகர் உலகம் மறக்காத விஷயங்களை படைக்கிறார்.",
    careerNote: "திறமையான கைகள், துல்லிய நுண்ணறிவு, தகவமைப்பு சிக்கல்-தீர்க்கும் திறன் இணையும் இடங்களில் ஹஸ்த ஜாதகர் சிறப்பாக செயல்படுகிறார்.",
    modernLead: "ஹஸ்தத்தின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "கை திறன், குணப்படுத்தும் நுண்ணறிவு, தகவமைப்பு நகைச்சுவை ஹஸ்தத்தின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function HastaVisualPage() {
  return <NatchathiramVisualContent data={HASTA} visual={HASTA_VISUAL} timings={dasaTimingsFor(HASTA.number)} />;
}
