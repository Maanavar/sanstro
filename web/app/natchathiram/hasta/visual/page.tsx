import type { Metadata } from "next";
import { HASTA } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

export const metadata: Metadata = {
  title: "Hasta Nakshathiram — Visual Profile | Vinaadi",
  description: "Visual profile of Hasta Nakshathiram: personality traits, career strengths, dasha timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/hasta/visual" },
  openGraph: {
    title: "Hasta Nakshathiram — Visual Profile",
    description: "Visual profile of Hasta Nakshathiram: personality traits, career strengths, dasha timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/hasta/visual",
    type: "article",
  },
};

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
      planet: "Moon", period: "10 yrs", ageRange: "Age 0–10", theme: "Born in the Healing Stream",
      detail: {
        expect: "Hasta opens in Moon dasha — the first ten years bathed in emotional sensitivity and the early flowering of the hands' intelligence. Infancy (0–3) often shows unusual motor development — Hasta babies are noted for the purposeful precision of their hand movements before language appears. Early childhood (3–10) produces a child who learns through making, touching, and fixing: the one who takes toys apart to understand them, who draws with unusual accuracy, who helps in the kitchen with a child's seriousness. School begins in Moon dasha, and Hasta's social ease and natural wit emerge — the child who makes the class laugh while also finishing the task first.",
        navigate: "Moon dasha's primary vulnerabilities for Hasta in childhood are emotional sensitivity, digestive function, and cold-related illness. The hands' intelligence developing in Moon dasha can produce frustration when the child's manual capabilities exceed their verbal expression — give Hasta children craft, art, and physical activity rather than only sedentary learning. Moon–Rahu antardasha (~yr 7 of Moon, ~age 7) can bring a brief period of social or family turbulence.",
        focus: "Monday Moon worship, white flower offerings, and giving the Hasta child abundant hands-on creative materials — clay, craft, instruments, basic tools — are the most formative investments. The hands that will later heal, create, or engineer are learning their intelligence here.",
      },
    },
    {
      planet: "Mars", period: "7 yrs", ageRange: "Age 10–17", theme: "The Hands Find Their Force",
      detail: {
        expect: "Mars dasha from 10 to 17 brings energy, drive, and the first serious testing of Hasta's manual intelligence. Sports, crafts, martial arts, mechanical hobbies, or early musical instrument practice all intensify in Mars dasha — Hasta at this age discovers the domains where their hands' precision becomes something formidable. Academic performance, especially in practical subjects, often exceeds that of peers in these years. The first serious ambition takes shape.",
        navigate: "Mars's energy in adolescence for Hasta can produce impatience with slower-moving peers and teachers, and occasionally impulsive commitments. Physical concerns: injury to hands and fingers deserves particular attention — Hasta's primary instrument must be protected. Mars–Saturn antardasha (~yr 5 of Mars, ~age 15) brings a period of useful discipline but also frustration.",
        focus: "Tuesday Mars shrine prayers and red offerings. Channel Mars's drive into one well-chosen manual or craft discipline — the commitment made to a skill in Mars dasha tends to be the technical foundation that sustains the rest of the life.",
      },
    },
    {
      planet: "Rahu", period: "18 yrs", ageRange: "Age 17–35", theme: "The World Receives the Hands",
      detail: {
        expect: "Rahu dasha from 17 to 35 is when Hasta's hands meet the world at scale. Advanced education or professional training establishes the technical domain; medicine, engineering, design, finance, or performance all emerge as natural professional homes. Career foundations are laid and early professional recognition arrives — Hasta's precision and adaptability distinguish them in almost any field they choose. Marriage and family formation typically occur between ages 25 and 31. Social networks widen; the wit and ease that Moon dasha cultivated and Mars dasha sharpened now serves Hasta brilliantly in professional social contexts.",
        navigate: "Rahu's 18-year expansion through the professional formation years can produce overcommitment to multiple domains. Hasta's natural adaptability is an asset; its shadow is the person who is technically excellent at many things but does not master any one. Rahu–Saturn antardasha (~yr 12 of Rahu, ~ages 29–31) is the most demanding sub-period. Physical concerns specific to Hasta in Rahu dasha: repetitive strain injuries, wrist and hand conditions from overwork.",
        focus: "Saturday Rahu shrine and deliberate depth-over-breadth choices in the technical domain. Also watch Rahu–Mercury antardasha (~yr 15 of Rahu, ~ages 32–34) — Mercury is the lord of your rasi, Kanya; this sub-period carries the rasi lord's amplified analytical and communicative precision. Exceptional professional output — the breakthrough technical contribution, the significant analytical publication, or the precision performance that defines a career — often lands here.",
      },
    },
    {
      planet: "Jupiter", period: "16 yrs", ageRange: "Age 35–51", theme: "Mastery Recognised",
      detail: {
        expect: "Jupiter dasha from 35 to 51 is when Hasta's technical mastery reaches professional peak and begins to be transmitted as wisdom. Leadership in the chosen field — senior surgeon, master craftsperson, principal engineer, head of a creative studio — becomes the natural terrain. Mentoring younger practitioners arrives naturally; Hasta discovers that teaching the hands' intelligence is as satisfying as exercising it. Family life is in full flower; children are in school; the home life Hasta builds is often one of unusual practical beauty — well-made things, well-maintained spaces.",
        navigate: "Jupiter's expansion can produce over-commitment to mentoring and teaching at the expense of Hasta's own technical practice. The hands must keep working, not only directing. Cardiovascular and liver health deserve attention from the late thirties. Jupiter–Rahu antardasha (~yr 12 of Jupiter, ~ages 47–49) can bring unusual disruptions or breakthroughs.",
        focus: "Thursday Brihaspati worship and sustained personal technical practice alongside mentoring. Jupiter–Mercury antardasha (~yr 14 of Jupiter, ~age 49) is worth preparing for: Mercury as rasi lord in Jupiter's generous context produces one of the most intellectually and technically fertile 11-month windows of Hasta's life.",
      },
    },
    {
      planet: "Saturn", period: "19 yrs", ageRange: "Age 51–70", theme: "The Long Patient Work",
      detail: {
        expect: "Saturn dasha from 51 to 70 brings the long, patient, deepening work that is the hallmark of a mature Hasta. Career transitions from active production toward architectural influence — the senior practitioner who sets standards, trains successors, and builds institutions. Retirement from primary professional work may come in the late sixties, but Hasta's hands never fully stop: hobbies, crafts, garden, grandchildren's projects all become the new technical territory. Financial and property matters consolidate; the life simplifies without diminishing.",
        navigate: "Saturn's primary health concerns for Hasta between 51 and 70 are musculoskeletal (particularly hands, wrists, and fingers), cardiovascular, and respiratory. Repetitive strain from decades of precise manual work may require specific physiotherapeutic attention. Saturn–Rahu antardasha (~yr 12 of Saturn, ~ages 63–65) is the most demanding sub-period.",
        focus: "Saturday oil bath and Shani worship are essential. Specific attention to hand and wrist maintenance — gentle exercise, appropriate rest, and protective measures — is the most important physical self-care for Hasta in Saturn dasha.",
      },
    },
    {
      planet: "Mercury", period: "17 yrs", ageRange: "Age 70–87", theme: "Rasi Lord — The Great Precision",
      detail: {
        expect: "Mercury dasha from 70 to 87 is the rasi lord's arrival for Hasta. Mercury is the lord of your rasi, Kanya — this makes his dasha doubly charged for Hasta natives. The analytical intelligence, communicative precision, and systematic wisdom accumulated across seven decades now find their fullest and most refined expression. Writing — a memoir of technical mastery, a guide to craft, a systematic account of the healing art — becomes the primary mode of transmission. Wit, which has been present throughout the life, reaches a particular crystalline quality in Mercury dasha; Hasta in their seventies and eighties are often the most amusing and perceptive people in any room.",
        navigate: "Mercury's health concerns at this age are primarily nervous system and respiratory. Mental agility maintained through active intellectual and communicative engagement outlasts physical capacity. Mercury dasha's primary shadow for Hasta is the temptation to scatter across too many final projects; choose one significant communicative or technical legacy work and complete it.",
        focus: "Wednesday worship, green offerings, and sustained writing or teaching practice are Mercury's primary remedies. Vishnu Sahasranama and Gayatri Mantra are the most resonant recitations. The hands that have healed and created for seven decades now transmit their wisdom in words.",
      },
    },
    {
      planet: "Ketu", period: "7 yrs", ageRange: "Age 87–94", theme: "Still Hands, Full Heart",
      detail: {
        expect: "Ketu dasha from 87 to 94 calls Hasta into a stillness the hands have never fully known. The making and the healing that have defined seven decades gradually yield to the receiving — of care, of presence, of the accumulated love that Hasta's hands have built over a lifetime. Spiritual depth surfaces with unusual clarity. The wit remains; the precision remains in perception if not in physical expression; the healing intelligence simply rests in its own completeness.",
        navigate: "Complete physical care from attentive caregivers is the primary requirement. Ketu's natural withdrawal is appropriate at this age; ensure spiritual companionship alongside physical care. The hands may no longer build, but the wisdom they accumulated for nine decades is entire.",
        focus: "Ketu shrine visits, pitru tharpanam, and black sesame offerings. Savitar's gift — the hand extended in healing and creation — has completed its arc. What remains is the warmth of everything it touched.",
      },
    },
    {
      planet: "Venus", period: "20 yrs", ageRange: "Age 94–114", theme: "Beauty Without End",
      detail: {
        expect: "Venus dasha from 94 to 114 is reached by virtually none. For the rare Hasta soul who arrives here, Venus brings the final flowering of beauty — the recognition that the precision and craft that defined nine decades was itself a form of love, and that love, in Venus's dasha, simply continues.",
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

  compatibleEn: ["Uttara Phalguni", "Swati", "Shravana", "Anuradha", "Rohini"],
  compatibleNote: "These nakshatras complement Hasta's precision, healing intelligence, and adaptive wit with warmth, depth, and complementary service orientation.",

  ta: {
    atAGlanceLabels: ["கை திறன்", "குணப்படுத்தும் தொடு", "துல்லியம் & கைவினை", "நகைச்சுவை & இலகுவான தன்மை", "தகவமைப்பு நுண்ணறிவு"],
    radarLabels: ["கை திறன்", "குணப்படுத்தல்", "துல்லியம்", "நகைச்சுவை", "தகவமைப்பு", "உழைப்பு"],
    coreStrengths: [
      { label: "கை திறன்",               desc: "சவிதாரின் கொடை — குணப்படுத்தும், படைக்கும், அல்லது செய்யும் கை மனம் மட்டுமே ஒருபோதும் நிர்வகிக்க முடியாத துல்லியத்தை அடைகிறது." },
      { label: "குணப்படுத்தும் நுண்ணறிவு", desc: "மருத்துவரின் கை நீட்டியது — ஆஸ்தா இயல்பாக எங்கே தொட, சரிசெய், மீட்டெடுக்க என்று தெரிகிறது." },
      { label: "துல்லியம் & கைவினை",      desc: "எளிதாக காட்டும் கைவினைஞர் — ஆஸ்தாவின் கை அசைவுகள் ஒவ்வொன்றும் மனசாட்சி கணக்கீடு இல்லாமல் சீரமைக்கப்படுகின்றன." },
      { label: "நகைச்சுவை & சமூக இலகுவான தன்மை", desc: "சூரியனின் சிரிக்கும் கை — ஆஸ்தா நகைச்சுவையால் இலட்சணப்படுத்துகிறார் மற்றும் இயல்பான இலகுவுடன் சமூக இடங்களில் நகர்கிறார்." },
      { label: "தகவமைப்பு நுண்ணறிவு",     desc: "புதனின் கன்னி ராசி — ஆஸ்தா ஒரு சூழ்நிலையை படிக்கிறார் மற்றும் கைவினைஞர் ஒரு கருவியை மீட்டமைக்கும் வேகம் மற்றும் துல்லியத்துடன் அணுகுமுறையை மாற்றுகிறார்." },
      { label: "உழைப்பு பயன்பாடு",        desc: "ஓயாத கைகள் — ஆஸ்தாவின் உற்பத்தித்திறன் இயக்கப்படவில்லை, இது இயல்பானது; அவர்கள் வேலை செய்யாமல் இருக்க முடியாது." },
    ],
    careerAbilityLabels: ["அறுவை சிகிச்சை & கை மருத்துவம்", "கைவினை & நுண்கலை", "தொழில்நுட்பம் & பொறியியல்", "நிதி பகுப்பாய்வு", "நகைச்சுவை & செயல்திறன்"],
    careerClusters: [
      { title: "அறுவை சிகிச்சை & மருத்துவ நடைமுறை", desc: "அறுவை சிகிச்சை சிறப்புகள், மருந்தியல் சிகிச்சை, கை மருத்துவம் — சவிதாரின் குணப்படுத்தும் கை உருவகமானது." },
      { title: "கைவினை, கலை & நகை",          desc: "நுண் கைவினை, துணிக்கலை, நகை வடிவமைப்பு, சிற்பம் — ஆஸ்தாவின் கைகளின் துல்லியம் அழகாக." },
      { title: "தொழில்நுட்பம் & பொறியியல்",   desc: "இயந்திர மற்றும் மின்னணு பொறியியல், துல்லிய உற்பத்தி, இயங்கியல்." },
      { title: "நிதி & கணக்கியல்",             desc: "விரிவான நிதி பகுப்பாய்வு, கணக்காய்வு, வர்த்தகம் — சூரியனின் அதிகாரத்தை சந்திக்கும் புதன்-துல்லியம்." },
      { title: "நகைச்சுவை & தொடர்பு",         desc: "செயல்திறன், ஸ்டாண்ட்-அப் நகைச்சுவை, எழுத்து, ஒளிபரப்பு — சிரிக்கும் கை பொது வெளிப்பாட்டிற்கு நீட்டியது." },
      { title: "குணப்படுத்தல் & உடல் வேலை",   desc: "மசாஜ், குத்தூசி மருத்துவம், சிரோபிராக்டிக், மருந்தியல் சிகிச்சை — கைகளின் மூலம் அறியப்படும் உடல்." },
    ],
    modernApps: [
      { title: "மெட்டெக் & அறுவை சிகிச்சை கண்டுபிடிப்பு", desc: "அறுவை சிகிச்சை இயங்கியல், மருத்துவ சாதன பொறியியல், துல்லிய சுகாதார தளங்கள்." },
      { title: "டிஜிட்டல் கலை & வடிவமைப்பு",    desc: "கிராபிக் வடிவமைப்பு, டிஜிட்டல் கைவினை, UI/UX வடிவமைப்பு — டிஜிட்டல் ஊடகத்தில் ஆஸ்தாவின் கைகள்." },
      { title: "வன்பொருள் & இயங்கியல்",          desc: "துல்லிய பொறியியல் தளங்கள், இயங்கு அமைப்புகள், IoT வளர்ச்சி." },
      { title: "நிதி தொழில்நுட்பம் & அளவு நிதி", desc: "வர்த்தக அல்காரிதம்கள், நிதி மாதிரியாக்கம், துல்லிய பகுப்பாய்வு தளங்கள்." },
      { title: "நகைச்சுவை & உள்ளடக்க உருவாக்கம்", desc: "நகைச்சுவை உள்ளடக்கம், வைரல் குறும்படம், துள்ளிப்பரவும் பிராண்ட் தொடர்பு." },
      { title: "ஆரோக்ய தொழில்நுட்பம் & உடல் வேலை", desc: "டிஜிட்டல் ஆரோக்ய தளங்கள், மருந்தியல் சிகிச்சை ஆப்கள், உடல்-நுண்ணறிவு கருவிகள்." },
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
        expect: "ஆஸ்தா சந்திர தசையில் திறக்கிறார் — குணப்படுத்தும் ஓட்டத்தில் குளிக்கும் முதல் பத்து ஆண்டுகள். குழந்தை பருவம் (3–10) கற்றல், தொடுவது, சரிசெய்வதன் மூலம் கற்கும் குழந்தையை உருவாக்குகிறது: பொம்மைகளை புரிந்துகொள்ள பிரிப்பவர், அசாதாரண துல்லியத்துடன் வரைபவர். சமூக இலகுவான தன்மையும் இயல்பான நகைச்சுவையும் தோன்றுகின்றன.",
        navigate: "சந்திர தசையின் முதன்மையான பாதிப்புகள் உணர்வு உணர்திறன், செரிமான செயல்பாடு. கை நுண்ணறிவு வளரும் சந்திர தசையில் குழந்தையின் கை திறன்கள் அவர்களின் வாய்மொழி வெளிப்பாட்டை மீறும் போது விரக்தியை உருவாக்கலாம்.",
        focus: "திங்கட்கிழமை சந்திர வழிபாடு, வெள்ளை பூ அர்ப்பணம். ஆஸ்தா குழந்தைக்கு ஏராளமான கைகளால் செய்யும் படைப்பு பொருட்களை கொடுங்கள் — களிமண், கைவினை, கருவிகள்.",
      },
      {
        expect: "செவ்வாய் தசை 10 முதல் 17 வரை ஆஸ்தாவின் கை நுண்ணறிவுக்கு ஆற்றல், வேகம், முதல் தீவிர சோதனையை கொண்டு வருகிறது. விளையாட்டு, கைவினை, கலை, இயந்திர பொழுதுபோக்கு எல்லாம் செவ்வாய் தசையில் தீவிரமடைகின்றன.",
        navigate: "செவ்வாயின் ஆற்றல் பதின்வயதில் ஆஸ்தாவுக்கு மெதுவாக நகரும் சகமாணவர்கள் மற்றும் ஆசிரியர்களிடம் பொறுமையின்மையை உருவாக்கலாம். உடல் கவலைகள்: கைகள் மற்றும் விரல்களுக்கு காயம் குறிப்பிட்ட கவனம் தேவை.",
        focus: "செவ்வாய்க்கிழமை செவ்வாய் சன்னதி வழிபாடு. ஒரு நல்ல கை அல்லது கைவினை ஒழுக்கத்தில் செவ்வாயின் வேகத்தை திசைப்படுத்துங்கள் — இந்த தசையில் ஒரு திறமைக்கான அர்ப்பணம் ஆயுள் நடைமுறையாக மாறுகிறது.",
      },
      {
        expect: "ராகு தசை 17 முதல் 35 வரை ஆஸ்தாவின் கைகள் அளவில் உலகை சந்திக்கும் போது. உயர் கல்வி அல்லது தொழில்முறை பயிற்சி தொழில்நுட்ப தளத்தை நிறுவுகிறது. திருமணம் மற்றும் குடும்ப அமைவு 25 மற்றும் 31 வயதுக்கு இடையே.",
        navigate: "ராகுவின் 18 ஆண்டு விரிவாக்கம் பல தளங்களில் அதிக அர்ப்பணத்தை உருவாக்கலாம். ஆஸ்தாவின் இயல்பான தகவமைப்பு திறன் ஒரு சொத்து; அதன் நிழல் பல விஷயங்களில் தொழில்நுட்பமாக சிறந்தவர் ஆனால் எதிலும் தேர்ச்சி பெறாதவர். ராகு–சனி அந்தர்தசை (~yr 12, ~29–31 வயது) மிகவும் கோரும் துணை காலம்.",
        focus: "சனிக்கிழமை ராகு சன்னதி. கவனிக்கவும்: ராகு–புதன் (~yr 15, ~32–34 வயது) — ராசி அதிபதி புதன் இந்த துணை காலத்தில் விதிவிலக்கான தொழில் வெளிப்பாட்டை கொண்டு வருகிறார்.",
      },
      {
        expect: "குரு தசை 35 முதல் 51 வரை ஆஸ்தாவின் தொழில்நுட்ப தேர்ச்சி தொழில்முறை உச்சம் அடைகிறது மற்றும் ஞானமாக பரிமாற்றப்படத் தொடங்குகிறது. தேர்ந்த தளத்தில் தலைமை — மூத்த அறுவை சிகிச்சை நிபுணர், கைவினை ஆசான், தலைமை பொறியாளர் — இயல்பான நிலமாக மாறுகிறது. இளைய நடைமுறையாளர்களுக்கு வழிகாட்டல் இயல்பாக வருகிறது.",
        navigate: "குருவின் விரிவாக்கம் ஆஸ்தாவின் சொந்த தொழில்நுட்ப நடைமுறையை வழிகாட்டல் மற்றும் கற்பித்தலுக்கு அதிகமாக செலவழிப்பதை உருவாக்கலாம். கைகள் வேலை செய்ய வேண்டும், வழிநடத்துவது மட்டுமல்ல. குரு–புதன் (~yr 14, ~49 வயது) தயார்படுங்கள் — ஆஸ்தா வாழ்நாளில் மிகவும் விளைவு மிக்க 11 மாத சாளரங்களில் ஒன்று.",
        focus: "வியாழக்கிழமை பிருஹஸ்பதி வழிபாடு மற்றும் நிலையான தனிப்பட்ட தொழில்நுட்ப நடைமுறை வழிகாட்டலுடன் சேர்ந்து.",
      },
      {
        expect: "சனி தசை 51 முதல் 70 வரை ஒரு முதிர்ந்த ஆஸ்தாவின் தனிச்சிறப்பான நீண்ட, பொறுமையான, ஆழமடையும் வேலையை கொண்டு வருகிறது. தொழில் செயலில் உற்பத்தியிலிருந்து கட்டமைப்பு செல்வாக்கிற்கு நகர்கிறது. ஓய்வு 60களின் இறுதியில் வரலாம், ஆனால் ஆஸ்தாவின் கைகள் ஒருபோதும் முழுமையாக நிற்காது.",
        navigate: "57 முதல் 70 வரை சனியின் முதன்மையான ஆரோக்ய கவலைகள் தசை எலும்பு மண்டலம் (குறிப்பாக கைகள், மணிக்கட்டுகள்), இதய-வாஸ்குலர், சுவாசம். ஆண்டுகளான துல்லியமான கை வேலையிலிருந்து திரும்பும் திரிபு குறிப்பிட்ட மருந்தியல் கவனம் தேவைப்படலாம்.",
        focus: "சனிக்கிழமை எண்ணெய் குளியல் மற்றும் சனி வழிபாடு. கை மற்றும் மணிக்கட்டு பராமரிப்பில் குறிப்பிட்ட கவனம் — மென்மையான உடற்பயிற்சி, பொருத்தமான ஓய்வு — ஆஸ்தாவுக்கு சனி தசையில் மிக முக்கியமான உடல் சுய-பராமரிப்பு.",
      },
      {
        expect: "புதன் தசை 70 முதல் 87 வரை ஆஸ்தாவுக்கு ராசி அதிபதியின் வருகை. புதன் உங்கள் ராசியான கன்னியின் அதிபதி — இது ஆஸ்தா நேயர்களுக்கு இரட்டை வலிமையுடன் வருகிறது. எழுத்து — தொழில்நுட்ப தேர்ச்சியின் நினைவுக் குறிப்பு, கைவினைக்கு வழிகாட்டி, குணப்படுத்தும் கலையின் முறையான கணக்கு — முதன்மையான பரிமாற்ற முறையாக மாறுகிறது. நகைச்சுவை குறிப்பிட்ட படிக தரத்தை அடைகிறது.",
        navigate: "புதன் ஆரோக்ய கவலைகள் நரம்பு மண்டலம் மற்றும் சுவாசம். மனத் சுறுசுறுப்பு செயலில் அறிவார்ந்த ஈடுபாட்டின் மூலம் பராமரிக்கப்படுகிறது. ஒரு முக்கியமான தொடர்பு அல்லது தொழில்நுட்ப மரபு வேலையை தேர்ந்தெடுத்து நிறைவு செய்யுங்கள்.",
        focus: "புதன்கிழமை வழிபாடு, பசுமை அர்ப்பணம், எழுத்து அல்லது கற்பித்தல் நடைமுறை. விஷ்ணு சஹஸ்ரநாம மற்றும் காயத்ரி மந்திரம் மிகவும் ஒத்தொலிக்கும் பாராயணங்கள்.",
      },
      {
        expect: "கேது தசை 87 முதல் 94 வரை ஆஸ்தாவை கைகள் ஒருபோதும் முழுமையாக அறியாத அமைதிக்கு அழைக்கிறது. ஏழு தசகங்களை வரையறுத்த செய்தல் மற்றும் குணப்படுத்தல் படிப்படியாக பெறுவதற்கு வழங்குகிறது. ஆன்மீக ஆழம் அசாதாரண தெளிவுடன் மேலோங்குகிறது.",
        navigate: "கவனமான பராமரிப்பாளர்களிடமிருந்து முழுமையான உடல் பராமரிப்பு. கேதுவின் இயல்பான திரும்பல் இந்த வயதில் பொருத்தமானது. கைகள் இனி கட்டமைக்கப்படாமல் இருக்கலாம், ஆனால் அவை ஒன்பது தசகங்களில் குவித்த ஞானம் முழுமையானது.",
        focus: "கேது சன்னதி வழிபாடு, பித்ரு தர்ப்பணம், கருப்பு எள் அர்ப்பணம். சவிதாரின் கொடை — குணப்படுத்தல் மற்றும் படைப்பில் நீட்டப்பட்ட கை — அதன் வில்லை முடித்துவிட்டது.",
      },
    ],
    spirituality: [
      { title: "சவிதார் & சூரிய வழிபாடு",      desc: "தங்க-கைகளுடன் கூடிய சூரிய கடவுளான சவிதார் ஆஸ்தாவின் தலைமை தெய்வம் — ஞாயிற்றுக்கிழமை சூரிய வழிபாடு, ஆதித்ய ஹ்ருதயம் பாராயணம், விடியலில் அர்ப்பணங்கள் ஆஸ்தாவை அவர்களின் கைகளின் நுண்ணறிவின் ஆதாரத்துடன் இணைக்கின்றன." },
      { title: "புதன் & கைவினை பக்தி",         desc: "கன்னியின் புதன் ஆஸ்தாவின் துல்லியத்தை அதிகரிக்கிறார் — புதன்கிழமை வழிபாடு, விஷ்ணு சஹஸ்ரநாம, மற்றும் ஒரு கைவினை அல்லது குணப்படுத்தல் ஒழுக்கத்தை ஆன்மீக செயலாக நடைமுறைப்படுத்துவது ஆழமாக ஒத்தொலிக்கும்." },
      { title: "குணப்படுத்தும் தலங்கள் & தன்வந்தரி", desc: "தன்வந்தரி வழிபாடு — தெய்வீக மருத்துவர் — மற்றும் குணப்படுத்தும் கலைகளுடன் தொடர்புடைய கோவில்கள் ஆஸ்தாவுக்கு குறிப்பிட்ட ஒத்தொலிப்பு கொண்டுள்ளன. கைகளால் சேவை செய்வது (அன்னதானம், சேவை, மருத்துவ தன்னார்வ வேலை) பக்தி நடைமுறையாக மிக உயர்ந்த ஆஸ்தா வெளிப்பாடு." },
    ],
    guidance: "குணப்படுத்தும் கை மனம் முழுமையாக சொல்ல முடியாத ஒன்றை அறிகிறது. அந்த அறிவை நம்புங்கள் — துல்லியம், நகைச்சுவை, குணப்படுத்தும் தொடு — மற்றும் அதை வழிநடத்கட்டும். கன்னியின் பகுப்பாய்வு மனம் மற்றும் சவிதாரின் சூரிய மகிழ்ச்சி தனித்தனி திறன்கள் அல்ல; அவை ஒரு கருவி. அவை ஒன்றாக வேலை செய்யும் போது, ஆஸ்தா உலகம் மறக்காத விஷயங்களை படைக்கிறார்.",
    careerNote: "திறமையான கைகள், துல்லிய நுண்ணறிவு, தகவமைப்பு சிக்கல்-தீர்க்கும் திறன் இணையும் இடங்களில் ஆஸ்தா சிறப்பாக செயல்படுகிறார்.",
    modernLead: "ஆஸ்தாவின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "கை திறன், குணப்படுத்தும் நுண்ணறிவு, தகவமைப்பு நகைச்சுவை ஆஸ்தாவின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function HastaVisualPage() {
  return <NatchathiramVisualContent data={HASTA} visual={HASTA_VISUAL} />;
}
