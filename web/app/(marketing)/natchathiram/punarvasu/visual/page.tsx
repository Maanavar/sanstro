import type { Metadata } from "next";
import { withTamilTwin } from "@/lib/localized-metadata";
import { withDasaTimingHold } from "@/lib/natchathiram-dasa-hold";
import { dasaTimingsFor } from "@/lib/natchathiram-dasa-timings";
import { nakshatraDisplayName } from "@/lib/nakshatra-display-name";
import { natchathiramVisualTa } from "@/lib/marketing-seo-ta";
import { PUNARVASU } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

const EN_METADATA: Metadata = {
  title: `${nakshatraDisplayName(PUNARVASU.number, "en")} — Visual Profile`,
  description: "Visual profile of Punarpoosam Nakshathiram: personality traits, career strengths, dasa timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/punarvasu/visual" },
  openGraph: {
    title: `${nakshatraDisplayName(PUNARVASU.number, "en")} — Visual Profile`,
    description: "Visual profile of Punarpoosam Nakshathiram: personality traits, career strengths, dasa timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/punarvasu/visual",
    type: "article",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withDasaTimingHold(await withTamilTwin(EN_METADATA, "/natchathiram/punarvasu/visual", natchathiramVisualTa("punarvasu")!), "punarvasu");
}

const PUNARVASU_VISUAL: NatchathiramVisualData = {
  atAGlance: [
    { label: "Renewal & Optimism",     score: 95 },
    { label: "Generosity of Spirit",   score: 92 },
    { label: "Teaching & Wisdom",      score: 90 },
    { label: "Travel & Exploration",   score: 88 },
    { label: "Philosophical Depth",    score: 86 },
  ],

  radar: {
    labels: ["Renewal", "Generosity", "Teaching", "Travel", "Philosophy", "Resilience"],
    values: [95, 92, 90, 88, 86, 91],
  },

  coreStrengths: [
    { symbol: "◎", label: "Renewal & Recovery",     score: 95, desc: "Aditi's light — Punarvasu returns to goodness no matter how far the detour, always finding the way back." },
    { symbol: "◈", label: "Generous Heart",          score: 92, desc: "The quiver refilled — Punarvasu gives freely, knowing abundance returns to those who share." },
    { symbol: "⚡", label: "Teaching & Mentoring",   score: 90, desc: "Born teachers — Punarvasu's joy is the moment understanding ignites in another person's eyes." },
    { symbol: "♥", label: "Optimistic Resilience",  score: 88, desc: "They fall, recollect, and begin again — the bow that fires anew regardless of how many arrows were spent." },
    { symbol: "△", label: "Travel & Exploration",   score: 88, desc: "Broad-ranging minds and feet — Punarvasu finds knowledge and meaning in distance and encounter." },
    { symbol: "☽", label: "Philosophical Depth",    score: 86, desc: "The eternal questioner — Punarvasu sits with big questions without needing them resolved too quickly." },
  ],

  careerAbilities: [
    { label: "Teaching & Education",         score: 95 },
    { label: "Counselling & Mentoring",      score: 92 },
    { label: "Travel, Diplomacy & Culture",  score: 90 },
    { label: "Philosophy & Spiritual Work",  score: 88 },
    { label: "Writing & Communication",      score: 86 },
  ],
  careerNote: "Punarvasu thrives wherever wisdom is passed from one mind to another — the teacher who changes a life, the guide who restores hope, the diplomat who finds the good in both sides.",

  careerClusters: [
    { symbol: "◎", title: "Education & Academia",          desc: "Schools, universities, curriculum design — Aditi's children love the transmission of understanding." },
    { symbol: "◈", title: "Counselling & Therapy",         desc: "Life coaching, counselling, mentoring — Punarvasu restores those who have lost their way." },
    { symbol: "⚡", title: "Travel & International Work",  desc: "Tourism, diplomacy, international organisations, cross-cultural exchange." },
    { symbol: "♥", title: "Philosophy & Spirituality",    desc: "Vedanta, Bhakti traditions, comparative religion, spiritual guidance." },
    { symbol: "△", title: "Writing & Publishing",         desc: "Books, journalism, content creation — Punarvasu's wisdom finds written form." },
    { symbol: "☽", title: "Healing & Wellness",           desc: "Yoga, Ayurveda, naturopathy, holistic therapies — restoring wholeness." },
  ],

  modernApps: [
    { symbol: "◎", title: "EdTech & Online Learning",     desc: "Educational platforms, MOOCs, digital learning tools — Punarvasu's teaching reaching global classrooms." },
    { symbol: "◈", title: "Life Coaching & Wellness Apps", desc: "Mindset platforms, personal growth apps, meditation and renewal tools." },
    { symbol: "⚡", title: "Travel & Cultural Platforms",  desc: "Cultural exchange apps, travel journalism, global community platforms." },
    { symbol: "♥", title: "Spiritual Content & Podcasting", desc: "Philosophy podcasts, Vedantic teaching channels, wisdom-sharing media." },
    { symbol: "△", title: "Non-profit & Social Enterprise", desc: "Restoration-focused organisations, community renewal, international development." },
    { symbol: "☽", title: "Integrative Healthcare",       desc: "Holistic health clinics, Ayurvedic apps, mind-body medicine platforms." },
  ],

  dashaTimeline: [
    {
      planet: "Jupiter", theme: "Born into Abundance",
      detail: {
        expect: "Punarvasu opens life in Jupiter dasa — a bountiful beginning for the nakshathiram of Aditi, the mother of abundance. Jupiter's is a long opening dasa, and the balance left at birth runs from long for births in the first pada to brief for the fourth; the range shown for this dasa gives it. Childhood is typically warm, nurturing, and intellectually stimulating; the family environment encourages curiosity, travel, and learning. Spiritual or philosophical exposure comes early — grandparents, teachers, or religious environments shape the young Punarvasu's sense of wonder. Where the balance runs through the school years, they produce a love of learning that distinguishes itself not through raw competitive drive but through genuine delight in understanding. Languages, social subjects, and storytelling attract; academic performance is typically above average without being the all-consuming focus.",
        navigate: "Jupiter's generosity in early childhood can produce a slight naivety about difficulty — Punarvasu's natural optimism, if unchallenged, can leave them underprepared for Saturn's demands when that dasa arrives. The body's Jupiter-associated vulnerabilities in childhood are liver function, weight management, and over-rich diet. The Jupiter–Rahu bhukti, which closes this dasa (the table below gives when it begins and how long it lasts), can introduce the first disruption to the otherwise smooth childhood — a school change, a family transition, or an early philosophical crisis that the young Punarvasu must navigate.",
        focus: "Thursday Brihaspati worship, banana or yellow flower offerings, and storytelling traditions within the family amplify Jupiter's gifts. The single most valuable investment for a Punarvasu child is wide, generous exposure: travel where possible, books in abundance, and spiritual or philosophical wisdom transmitted by loving elders. This foundation serves for the entire life.",
      },
    },
    {
      planet: "Saturn", theme: "The Test of Perseverance",
      detail: {
        expect: "Saturn dasa is the great character-forming period for Punarvasu — the teacher who must learn that wisdom requires discipline to deliver. It falls in different seasons by pada: for the later padas it carries the child through school and college, for the first pada it runs from adolescence into the middle of young adulthood. Higher education or vocational training establishes during it, and career foundations are laid in its working years. Saturn brings rigour that Jupiter's dasa did not insist upon, and Punarvasu either embraces the discipline or struggles against it. Where the dasa reaches adult life, marriage may enter and children may arrive; the responsibility of providing for a household teaches Punarvasu what generosity actually costs. Financial management becomes a necessary skill — Jupiter's easy abundance has a price in Saturn dasa.",
        navigate: "Saturn's primary lessons for Punarvasu are discipline, delayed gratification, and the value of systems. The natural optimism that Jupiter instilled must be balanced by Saturn's insistence on practical capacity. The Saturn–Rahu bhukti (the table below gives when it begins and how long it lasts) is the most turbulent sub-period; overextension, career pressure, and relationship strain can converge. Physical concerns: spine, joints, and respiratory function need attention through this dasa.",
        focus: "Saturday discipline — consistent Saturn worship, oil bath, and deliberate routine-building — are the most important self-management tools through this phase. Also watch for the rasi lord's bhukti within this period. If Mithuna-born, watch the Saturn–Mercury bhukti — Mercury as rasi lord amplifies communicative and teaching breakthroughs in this window. If Kadagam-born, watch the Saturn–Moon bhukti — Moon as rasi lord brings emotional clarity, family milestones, and maternal energy to its peak. The bhukti table below gives when each begins and how long it lasts; plan major commitments or transitions around these windows.",
      },
    },
    {
      planet: "Mercury", theme: "Rasi Lord for Mithuna-born — The Teacher Speaks",
      detail: {
        expect: "Mercury dasa, running through the working middle of life, is the rasi lord's arrival for Mithuna-pada Punarvasu. Mercury is the lord of your rasi, Mithuna — this makes his dasa doubly charged for Mithuna-born Punarvasu natives. Teaching, writing, communication, and intellectual contribution reach their lifetime peak in this period. The accumulated wisdom of Jupiter's childhood gift and Saturn's disciplined training now flows through Mercury's articulate channels — books, courses, lectures, or mentoring relationships that leave lasting marks on communities and fields. Professional recognition arrives. For Kadagam-pada Punarvasu, Mercury dasa is highly productive intellectually but serves as preparation for Moon's rasi lord arrival later.",
        navigate: "Mercury dasa's primary vulnerabilities are nervous system overstimulation, respiratory function, and the temptation to scatter across too many simultaneous intellectual projects. Punarvasu's natural generosity, in Mercury dasa, must be matched by careful prioritisation — the teacher who teaches everything teaches nothing. The Mercury–Rahu bhukti (the table below gives when it begins and how long it lasts) can bring unusual professional opportunities or disruptions; navigate thoughtfully.",
        focus: "Wednesday worship, green offerings, and sustained writing or teaching practice are Mercury's primary remedies and amplifiers. Punarvasu should commit the most significant communicative or pedagogical legacy work to Mercury dasa — a book, a course, an institutional programme that will serve long after this period ends.",
      },
    },
    {
      planet: "Ketu", theme: "Inward Turn",
      detail: {
        expect: "Ketu dasa interrupts the outward flow of Mercury's teaching period with a sharp inward pull. Punarvasu is called to consolidate rather than expand — to digest the wisdom accumulated across the working decades rather than continuing to dispense it. Spiritual practice deepens with unusual intensity. Travel, if it occurs, is towards sacred sites rather than professional destinations. Grandchildren may arrive; the shift from parent to grandparent carries its own quality of Ketu-flavored reflection.",
        navigate: "Ketu's withdrawal tendency can feel disorienting after Mercury's active engagement with the world. Social circles may narrow; this is appropriate, not pathological. Physical concerns: nervous system, digestive function, and autoimmune vulnerabilities deserve attention. The Ketu–Venus bhukti (the table below gives when it begins and how long it lasts) can bring unexpected relationship warmth or creative expression to what might otherwise be an ascetic period.",
        focus: "Ketu shrine visits, pitru tharpanam, and sustained meditation or study of sacred texts are the core practices. Aditi's child in Ketu dasa is collecting inward reserves for the rich outward expression that Venus dasa will enable.",
      },
    },
    {
      planet: "Venus", theme: "Second Flourishing",
      detail: {
        expect: "Venus dasa, in later life, is Punarvasu's second great flourishing — the quiver refilled after Ketu's emptying. Aditi's nature of renewal, which defines this nakshathiram, finds perfect expression in the late-life abundance that Venus brings. Creative work, aesthetic enjoyment, travel for pleasure, and relationship warmth all surge. Grandchildren become a primary joy. Financial comfort typically supports a quality of life that the working decades could not always provide. The Venus–Jupiter bhukti (the table below gives when it begins and how long it lasts) combines Punarvasu's two most natural planetary energies in a peak of generosity and wisdom-sharing.",
        navigate: "Venus's health concerns at this stage are primarily cardiovascular, hormonal, and reproductive (for those not yet past those concerns). The natural expansion of Venus dasa must be managed with appropriate physical care — generous living requires a healthy body to enjoy it. The Venus–Saturn bhukti (the table below gives when it begins and how long it lasts) demands more disciplined pacing; rest more, exert less.",
        focus: "Friday Lakshmi and Aditi worship, rose and jasmine offerings, music, and surrounded by beauty and affectionate presence are Venus's primary remedies. This is the period to complete creative legacy — the memoir, the garden, the art collection, the spiritual practice that expresses everything the decades accumulated.",
      },
    },
    {
      planet: "Sun", theme: "Solar Clarity",
      detail: {
        expect: "Sun dasa, in advanced age, brings a final gift of radiant clarity — the teaching light of a lifetime settling into a pure solar warmth. Identity is complete; Punarvasu's characteristic generosity now has a serene, luminous quality undimmed by ambition or obligation. Grandchildren and great-grandchildren receive the most distilled version of Punarvasu's wisdom.",
        navigate: "Physical care focuses on cardiovascular and general vitality. Warmth, light, regular nourishment, and the company of affectionate family and community are everything. The Sun–Saturn bhukti (the table below gives when it begins and how long it lasts) can bring a period requiring more rest and caution.",
        focus: "Sunday Surya worship and Aditya Hridayam recitation. Aditi's child, who came into the world in Jupiter's abundance and was tested by Saturn's discipline, arrives at the Sun's final clarity having fulfilled the nakshathiram's deepest promise: return, renewal, and the quiver always full.",
      },
    },
    {
      planet: "Moon", theme: "Rasi Lord for Kadagam-born — Tidal Completion",
      detail: {
        expect: "Moon dasa, in very advanced age, is the rasi lord's arrival for Kadagam-pada Punarvasu. Moon is the lord of your rasi, Kadagam — this makes her dasa doubly charged for Kadagam-born Punarvasu natives. Emotional fullness, maternal warmth, tidal presence, and the deepest loving connections of life surface with particular grace at this age. For Mithuna-pada Punarvasu, Moon dasa at this age brings tidal completion — the oceanic feeling of a life well and generously lived.",
        navigate: "At this age, physical care is the primary consideration — warmth, regular nourishment, gentle movement, and steady companionship. Emotional needs are equally important; Moon dasa amplifies the need for loving, consistent human presence. Avoiding isolation is essential.",
        focus: "Monday Moon worship, water offerings, white flowers, and the presence of those who have been the recipients of Punarvasu's lifelong generosity. The quiver is now empty in the most complete sense — given fully, with nothing held back.",
      },
    },
    {
      planet: "Mars", theme: "Final Strength",
      detail: {
        expect: "Mars dasa, the last in this sequence, is reached by very few. For those rare Punarvasu souls who arrive here, Mars brings a final gift of strength and presence — the ability to remain engaged, clear, and purposeful even at this extreme age. The quiver fires one last time.",
        navigate: "Physical care at this age is complete and tender. Mars's energy at this age manifests as clarity of will, not physical vigour — the conviction that each remaining day has meaning.",
        focus: "Tuesday Mars shrine prayers and red flower offerings. Aditi's child, who has renewed and renewed across a century, fires the final arrow in Mars's care.",
      },
    },
  ],

  spirituality: [
    {
      title: "Aditi & Mother Goddess Worship",
      desc: "Punarvasu's presiding deity is Aditi, mother of all — worship of Aditi, Devi, Parvati, and mother goddess forms resonates deeply. Monday worship and white flower offerings honour the motherly abundance.",
    },
    {
      title: "Renewal Practices",
      desc: "For Punarvasu, spiritual practice must include deliberate renewal — periodic fasting followed by abundant feasting, retreat followed by return, withdrawal followed by generous re-engagement with the world.",
    },
    {
      title: "Brihaspati & Guru Reverence",
      desc: "Jupiter presides over Punarvasu with special force; Thursday Brihaspati puja, guru vandanam, and seeking blessings from a living spiritual teacher amplify the nakshathiram's natural wisdom.",
    },
  ],

  guidance: "You were born to return — to goodness, to wisdom, to love, to begin again. The quiver is never truly empty for Punarvasu. Let every fall be a temporary angle, not a permanent destination. The teacher who keeps learning, the giver who keeps receiving, the traveller who always comes home — that is the fullest version of who you are.",

  compatibleEn: ["Aswini", "Visakam", "Uthiram", "Swathi", "Anusham"],
  compatibleNote: "These nakshatras complement Punarvasu's renewal energy, generous spirit, and philosophical depth with drive, grounded strength, and emotional resonance.",

  ta: {
    atAGlanceLabels: ["புதுப்பித்தல் & நம்பிக்கை", "ஈகையின் ஆவி", "கற்பித்தல் & ஞானம்", "பயணம் & ஆய்வு", "தாத்விக ஆழம்"],
    radarLabels: ["புதுப்பித்தல்", "ஈகை", "கற்பித்தல்", "பயணம்", "தத்துவம்", "மீள்தன்மை"],
    coreStrengths: [
      { label: "புதுப்பித்தல் & மீட்சி",   desc: "அதிதியின் ஒளி — புனர்பூசம் எவ்வளவு தூரம் சென்றாலும் நல்லதற்கு திரும்புகிறார்கள், எப்போதும் வழியை கண்டுபிடிக்கிறார்கள்." },
      { label: "ஈகையான இதயம்",            desc: "மீண்டும் நிரப்பப்பட்ட அம்பறாத்தூணி — புனர்பூசம் தாராளமாக கொடுக்கிறார்கள், ஏனெனில் செழிப்பு பகிர்ந்தவர்களிடம் திரும்புகிறது என்று அறிவார்கள்." },
      { label: "கற்பித்தல் & வழிகாட்டல்",  desc: "பிறந்த ஆசிரியர்கள் — புனர்பூசத்தின் மகிழ்ச்சி மற்றொரு நபரின் கண்களில் புரிதல் தூண்டப்படும் தருணம்." },
      { label: "நம்பிக்கையான மீள்தன்மை",  desc: "விழுகிறார்கள், சேகரிக்கிறார்கள், மீண்டும் தொடங்குகிறார்கள் — எத்தனை அம்புகள் செலவழிக்கப்பட்டாலும் மீண்டும் சுடும் வில்." },
      { label: "பயணம் & ஆய்வு",           desc: "பரந்த மனம் மற்றும் கால்கள் — புனர்பூசம் தூரம் மற்றும் சந்திப்பில் அறிவையும் அர்த்தத்தையும் கண்டுபிடிக்கிறார்கள்." },
      { label: "தாத்விக ஆழம்",            desc: "நித்திய கேள்வியாளர் — புனர்பூசம் பெரிய கேள்விகளுடன் அவற்றை அவசரமாக தீர்க்காமல் இருக்கிறார்கள்." },
    ],
    careerAbilityLabels: ["கற்பித்தல் & கல்வி", "ஆலோசனை & வழிகாட்டல்", "பயணம், இராஜதந்திரம் & கலாசாரம்", "தத்துவம் & ஆன்மீக வேலை", "எழுத்து & தொடர்பு"],
    careerClusters: [
      { title: "கல்வி & கல்விதுறை",        desc: "பள்ளிகள், பல்கலைக்கழகங்கள், பாடத்திட்ட வடிவமைப்பு — அதிதியின் பிள்ளைகள் புரிதலை பரிமாற்றுவதை விரும்புகிறார்கள்." },
      { title: "ஆலோசனை & சிகிச்சை",      desc: "வாழ்க்கை பயிற்சி, ஆலோசனை, வழிகாட்டல் — புனர்பூசம் வழி தவறியவர்களை மீட்கிறார்கள்." },
      { title: "பயணம் & சர்வதேச வேலை",    desc: "சுற்றுலா, இராஜதந்திரம், சர்வதேச நிறுவனங்கள், கலாசார பரிமாற்றம்." },
      { title: "தத்துவம் & ஆன்மீகம்",      desc: "வேதாந்தம், பக்தி மரபுகள், ஒப்பீட்டு மதம், ஆன்மீக வழிகாட்டல்." },
      { title: "எழுத்து & வெளியீடு",       desc: "புத்தகங்கள், பத்திரிகை, உள்ளடக்க உருவாக்கம் — புனர்பூசத்தின் ஞானம் எழுத்து வடிவம் காண்கிறது." },
      { title: "குணப்படுத்தல் & ஆரோக்யம்", desc: "யோகா, ஆயுர்வேதம், இயற்கை மருத்துவம், ஒட்டுமொத்த சிகிச்சைகள் — முழுமையை மீட்டெடுத்தல்." },
    ],
    modernApps: [
      { title: "எட்டெக் & ஆன்லைன் கற்றல்",     desc: "கல்வி தளங்கள், MOOCகள், டிஜிட்டல் கற்றல் கருவிகள் — புனர்பூசத்தின் கற்பித்தல் உலகளாவிய வகுப்பறைகளை அடைகிறது." },
      { title: "வாழ்க்கை பயிற்சி & ஆரோக்ய ஆப்கள்", desc: "மனநிலை தளங்கள், தனிப்பட்ட வளர்ச்சி ஆப்கள், தியானம் மற்றும் புதுப்பித்தல் கருவிகள்." },
      { title: "பயண & கலாசார தளங்கள்",         desc: "கலாசார பரிமாற்ற ஆப்கள், பயண பத்திரிகை, உலகளாவிய சமூக தளங்கள்." },
      { title: "ஆன்மீக உள்ளடக்கம் & பாட்காஸ்டிங்", desc: "தத்துவ பாட்காஸ்டுகள், வேதாந்த கற்பித்தல் சேனல்கள், ஞானம் பகிர்தல் ஊடகம்." },
      { title: "இலாப நோக்கற்ற & சமூக நிறுவனம்", desc: "மீட்சி-கவனம் கொண்ட நிறுவனங்கள், சமூக புதுப்பித்தல், சர்வதேச வளர்ச்சி." },
      { title: "ஒருங்கிணைந்த சுகாதாரம்",         desc: "ஒட்டுமொத்த சுகாதார கிளினிக்குகள், ஆயுர்வேத ஆப்கள், மன-உடல் மருத்துவ தளங்கள்." },
    ],
    dashaThemes: [
      "செழிப்பில் பிறப்பு — குரு வரம், ஞானம், அன்பான குழந்தை பருவம்",
      "விடாமுயற்சியின் சோதனை — சனி ஒழுக்கம், கல்வி, தொழில் அடித்தளம்",
      "மிதுன ராசி அதிபதி — ஆசிரியர் பேசுகிறார் — புதன் தசை",
      "உள்நோக்கிய திரும்பல் — கேது ஒருங்கிணைப்பு, ஆன்மீக ஆழம்",
      "இரண்டாம் மலர்ச்சி — சுக்கிர செழிப்பு, படைப்பு, குடும்ப மகிழ்ச்சி",
      "சூரிய தெளிவு — ஒளிர்ந்த ஞானம், இறுதிக் கொடை",
      "கடக ராசி அதிபதி — அலை போன்ற நிறைவு — சந்திர தசை",
      "இறுதி வலிமை — செவ்வாய் இறுதி நிலை",
    ],
    dashaDetails: [
      {
        expect: "புனர்பூசம் குரு தசையில் வாழ்க்கையைத் தொடங்குகிறது — செழிப்பின் தாயான அதிதியின் நட்சத்திரத்துக்கு தாராளமான தொடக்கம். குரு நீண்ட தொடக்க தசை; பிறக்கும்போது மீதமுள்ள இருப்பு முதல் பாதத்தில் நீளமாகவும் நான்காம் பாதத்தில் சிறிதாகவும் இருக்கும் — இந்த தசைக்குக் காட்டப்படும் வரம்பு அதைச் சொல்கிறது. குழந்தைப் பருவம் பொதுவாக அரவணைப்பானது, ஊட்டமளிப்பது, அறிவுத் தூண்டுதல் நிறைந்தது; குடும்பச் சூழல் ஆர்வம், பயணம், கற்றலை ஊக்குவிக்கிறது. ஆன்மீக அல்லது தத்துவ அறிமுகம் சீக்கிரமே வருகிறது — தாத்தா-பாட்டி, ஆசிரியர்கள், சமயச் சூழல்கள் இளம் புனர்பூசத்தின் வியப்பு உணர்வை வடிவமைக்கின்றன. இருப்பு பள்ளிக் காலத்தை எட்டினால், கற்றலின் மீது ஒரு காதல் உருவாகிறது; அது கடுமையான போட்டி உந்துதலால் அல்ல, புரிந்துகொள்வதில் உண்மையான மகிழ்ச்சியால் தனித்து நிற்கிறது. மொழிகள், சமூகப் பாடங்கள், கதை சொல்லல் ஈர்க்கின்றன; கல்விச் செயல்திறன் பொதுவாக சராசரிக்கு மேல், ஆனால் முழு கவனமாக இல்லை.",
        navigate: "குருவின் தாராளத்தன்மை ஆரம்பக் குழந்தைப் பருவத்தில் சிரமங்களைப் பற்றிய சிறிய அப்பாவித்தனத்தை உருவாக்கலாம் — புனர்பூசத்தின் இயல்பான நம்பிக்கை சவாலுக்கு உட்படாவிட்டால், சனி தசை வரும்போது அதன் கோரிக்கைகளுக்குத் தயாரற்றதாகலாம். குழந்தைப் பருவத்தில் குருவுடன் தொடர்புடைய உடல் பாதிப்புகள்: கல்லீரல் செயல்பாடு, எடை மேலாண்மை, அதிக வளமான உணவு. இந்த தசையை நிறைவு செய்யும் குரு–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மற்றபடி சீரான குழந்தைப் பருவத்தில் முதல் இடையூறைக் கொண்டுவரலாம் — பள்ளி மாற்றம், குடும்ப மாற்றம், அல்லது இளம் புனர்பூசம் கடக்க வேண்டிய ஆரம்பகால தத்துவ நெருக்கடி.",
        focus: "வியாழக்கிழமை பிருஹஸ்பதி வழிபாடு, வாழைப்பழம் அல்லது மஞ்சள் பூ அர்ப்பணம், குடும்பத்தில் கதை சொல்லும் மரபுகள் குருவின் கொடைகளைப் பெருக்குகின்றன. புனர்பூசக் குழந்தைக்கு ஒற்றை மிக மதிப்புமிக்க முதலீடு பரந்த, தாராளமான வெளிப்பாடு: சாத்தியமான இடத்தில் பயணம், ஏராளமான புத்தகங்கள், அன்பான மூத்தோர் கடத்தும் ஆன்மீக, தத்துவ ஞானம். இந்த அடித்தளம் முழு வாழ்க்கைக்கும் பயன்படுகிறது.",
      },
      {
        expect: "சனி தசை புனர்பூசத்திற்கு மாபெரும் குணம் உருவாக்கும் காலம் — ஞானத்தை வழங்க ஒழுக்கம் தேவை என்று கற்கவேண்டிய ஆசிரியர். இது பாதத்தைப் பொறுத்து வெவ்வேறு பருவங்களில் வருகிறது: பிந்தைய பாதங்களில் குழந்தையைப் பள்ளி, கல்லூரி வழியாக அழைத்துச் செல்கிறது; முதல் பாதத்தில் வளரிளம் பருவத்திலிருந்து இளம் வயது வந்த காலத்தின் நடுப்பகுதி வரை செல்கிறது. உயர் கல்வி அல்லது தொழில் பயிற்சி இந்த காலத்தில் நிறுவப்படுகிறது; பணி ஆண்டுகளில் தொழில் அடித்தளம் இடப்படுகிறது. குருவின் தசை வலியுறுத்தாத கடுமையை சனி கொண்டுவருகிறது; புனர்பூசம் ஒழுக்கத்தை ஏற்கிறது அல்லது அதற்கு எதிராகப் போராடுகிறது. தசை வயது வந்த வாழ்வை எட்டினால் திருமணம் வரலாம், குழந்தைகள் வரலாம்; குடும்பத்தைப் போஷிக்கும் பொறுப்பு தாராளத்துக்கு உண்மையில் என்ன விலை என்பதை புனர்பூசத்துக்குக் கற்பிக்கிறது. நிதி மேலாண்மை அவசியமான திறனாகிறது — சனி தசையில் குருவின் எளிய செழிப்புக்கு விலை உண்டு.",
        navigate: "புனர்பூசத்திற்கு சனியின் முதன்மைப் பாடங்கள்: ஒழுக்கம், தாமத திருப்தி, அமைப்புகளின் மதிப்பு. குரு விதைத்த இயல்பான நம்பிக்கை, நடைமுறைத் திறனுக்கான சனியின் வலியுறுத்தலுடன் சமன் செய்யப்பட வேண்டும். சனி–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மிகவும் கலக்கமான துணைக் காலம்; அதிகப்படியான விரிவாக்கம், தொழில் அழுத்தம், உறவுத் திரிபு ஒன்றுசேரலாம். உடல் கவலைகள்: இந்த தசை முழுவதும் முதுகெலும்பு, மூட்டுகள், சுவாச செயல்பாடு கவனம் பெற வேண்டும்.",
        focus: "சனிக்கிழமை ஒழுக்கம் — நிலையான சனி வழிபாடு, எண்ணெய் குளியல், வேண்டுமென்றே வழக்கங்களை உருவாக்குவது — இந்த கட்டத்தின் மிக முக்கிய சுய-மேலாண்மைக் கருவிகள். இந்த தசைக்குள் ராசி அதிபதியின் புக்தியையும் கவனிக்கவும். மிதுனத்தில் பிறந்தவர்கள் சனி–புதன் புக்தியைக் கவனிக்கவும் — ராசி அதிபதியாக புதன் இந்த சாளரத்தில் தொடர்பு, கற்பித்தல் திருப்புமுனைகளைப் பெருக்குகிறார். கடகத்தில் பிறந்தவர்கள் சனி–சந்திர புக்தியைக் கவனிக்கவும் — ராசி அதிபதியாக சந்திரன் உணர்வுத் தெளிவு, குடும்ப மைல்கற்கள், தாய்மை ஆற்றலை உச்சத்துக்குக் கொண்டுவருகிறார். ஒவ்வொன்றும் எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்; பெரிய அர்ப்பணங்களையோ மாற்றங்களையோ இந்த சாளரங்களைச் சுற்றித் திட்டமிடுங்கள்.",
      },
      {
        expect: "வாழ்வின் பணி நடுப்பகுதி வழியாகச் செல்லும் புதன் தசை மிதுன-பாத புனர்பூசத்திற்கு ராசி அதிபதியின் வருகை. புதன் உங்கள் ராசியான மிதுனத்தின் அதிபதி — இது மிதுனத்தில் பிறந்த புனர்பூச நேயர்களுக்கு இரட்டை வலிமையுடன் வருகிறது. கற்பித்தல், எழுத்து, தொடர்பு, அறிவுப் பங்களிப்பு இந்த காலத்தில் வாழ்நாள் உச்சம் அடைகின்றன. குருவின் குழந்தைப் பருவக் கொடையும் சனியின் ஒழுக்கமான பயிற்சியும் திரட்டிய ஞானம் இப்போது புதனின் தெளிவான வழிகள் வழியாகப் பாய்கிறது — சமூகங்களிலும் துறைகளிலும் நீடித்த தடம் பதிக்கும் நூல்கள், பாடநெறிகள், உரைகள் அல்லது வழிகாட்டும் உறவுகள். தொழில்முறை அங்கீகாரம் வருகிறது. கடக-பாத புனர்பூசத்திற்கு புதன் தசை அறிவு ரீதியாக மிக உற்பத்தியானது, ஆனால் பிற்காலத்தில் வரும் சந்திரனின் ராசி அதிபதி வருகைக்கான தயாரிப்பாகவும் அமைகிறது.",
        navigate: "புதன் தசையின் முதன்மைப் பாதிப்புகள் நரம்பு மண்டல மிகைத் தூண்டல், சுவாச செயல்பாடு, ஒரே நேரத்தில் பல அறிவுத் திட்டங்களில் சிதறும் சோதனை. புதன் தசையில் புனர்பூசத்தின் இயல்பான தாராளத்தன்மை கவனமான முன்னுரிமை நிர்ணயத்துடன் இணைய வேண்டும் — எல்லாவற்றையும் கற்பிக்கும் ஆசிரியர் எதையும் கற்பிப்பதில்லை. புதன்–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) அசாதாரண தொழில் வாய்ப்புகளையோ தடங்கல்களையோ கொண்டுவரலாம்; சிந்தனையுடன் கடக்கவும்.",
        focus: "புதன்கிழமை வழிபாடு, பசுமை அர்ப்பணம், நீடித்த எழுத்து அல்லது கற்பித்தல் நடைமுறை. புனர்பூசம் முக்கிய தொடர்பு அல்லது கற்பித்தல் மரபு வேலையை இந்த தசைக்கு ஒப்படைக்க வேண்டும்.",
      },
      {
        expect: "கேது தசை புதனின் கற்பிக்கும் காலத்தின் வெளிப்புற ஓட்டத்தை கூர்மையான உள்நோக்கிய இழுப்புடன் குறுக்கிடுகிறது. புனர்பூசம் விரிவாக்கத்தை விட ஒருங்கிணைப்புக்கு அழைக்கப்படுகிறார் — பணி தசகங்களில் குவிந்த ஞானத்தைத் தொடர்ந்து வழங்குவதை விட ஜீரணிக்க. ஆன்மீகப் பயிற்சி அசாதாரணத் தீவிரத்துடன் ஆழமடைகிறது. பயணம் நிகழ்ந்தால் அது தொழில் இடங்களை நோக்கி அல்ல, புனிதத் தலங்களை நோக்கி. பேரக்குழந்தைகள் வரலாம்; பெற்றோரிலிருந்து தாத்தா-பாட்டியாகும் மாற்றம் தனக்கே உரிய கேது சாயல் கொண்ட சிந்தனையைக் கொண்டுவருகிறது.",
        navigate: "கேதுவின் விலகல் போக்கு, புதனின் உலகுடனான செயலில் ஈடுபாட்டிற்குப் பிறகு திசைமாறிய உணர்வைத் தரலாம். சமூக வட்டங்கள் சுருங்கலாம்; இது பொருத்தமானது, நோய் அல்ல. உடல் கவலைகள்: நரம்பு மண்டலம், செரிமான செயல்பாடு, தன்னெதிர்ப்பு பாதிப்புகள் கவனம் பெற வேண்டும். கேது–சுக்கிர புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) இல்லையெனில் துறவு போன்ற காலத்துக்கு எதிர்பாராத உறவு அரவணைப்பையோ படைப்பு வெளிப்பாட்டையோ கொண்டுவரலாம்.",
        focus: "கேது சன்னதி வழிபாடு, பித்ரு தர்ப்பணம், நீடித்த தியானம். அதிதியின் பிள்ளை கேது தசையில் உள்நோக்கிய கையிருப்பை திரட்டுகிறார் — சுக்கிர தசை செயல்படுத்தும் தாராளமான வெளிப்புற வெளிப்பாட்டிற்காக.",
      },
      {
        expect: "பிற்கால வாழ்வில் வரும் சுக்கிர தசை புனர்பூசத்தின் இரண்டாம் பெரிய மலர்ச்சி — கேதுவின் வெறுமைக்குப் பிறகு மீண்டும் நிறையும் அம்பறாத்தூணி. இந்த நட்சத்திரத்தை வரையறுக்கும் அதிதியின் புதுப்பித்தல் இயல்பு, சுக்கிரன் தரும் பிற்கால செழிப்பில் சரியான வெளிப்பாட்டைக் காண்கிறது. படைப்பு வேலை, அழகியல் இன்பம், மகிழ்ச்சிக்கான பயணம், உறவு அரவணைப்பு எல்லாம் அதிகரிக்கின்றன. பேரக்குழந்தைகள் முதன்மை மகிழ்ச்சியாகிறார்கள். நிதி வசதி பொதுவாக பணி தசகங்கள் எப்போதும் தர முடியாத வாழ்க்கைத் தரத்தை ஆதரிக்கிறது. சுக்கிர–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) புனர்பூசத்தின் இரண்டு மிக இயல்பான கிரக ஆற்றல்களை தாராளம், ஞானப் பகிர்வின் உச்சத்தில் இணைக்கிறது.",
        navigate: "இந்த கட்டத்தில் சுக்கிரனின் ஆரோக்ய கவலைகள் முதன்மையாக இதய-இரத்தக் குழாய், ஹார்மோன், இனப்பெருக்கம் சார்ந்தவை (அந்தக் கவலைகளைக் கடக்காதவர்களுக்கு). சுக்கிர தசையின் இயல்பான விரிவு உரிய உடல் பராமரிப்புடன் நிர்வகிக்கப்பட வேண்டும் — தாராளமான வாழ்வை அனுபவிக்க ஆரோக்கியமான உடல் தேவை. சுக்கிர–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) அதிக ஒழுக்கமான வேகத்தைக் கோருகிறது; அதிகம் ஓய்வெடுங்கள், குறைவாக உழையுங்கள்.",
        focus: "வெள்ளிக்கிழமை லட்சுமி மற்றும் அதிதி வழிபாடு, ரோஜா மற்றும் மல்லிகை அர்ப்பணம், இசை, அழகுடன் சூழப்படுவது. படைப்பு மரபை நிறைவு செய்யுங்கள் — ஞாபகக் குறிப்பு, தோட்டம், கலை தொகுப்பு.",
      },
      {
        expect: "முதிர்ந்த வயதில் வரும் சூரிய தசை ஒளிரும் தெளிவின் இறுதிக் கொடையைக் கொண்டுவருகிறது — ஒரு வாழ்நாளின் கற்பிக்கும் ஒளி தூய சூரிய அரவணைப்பில் நிலைபெறுகிறது. அடையாளம் முழுமையானது; புனர்பூசத்தின் இயல்பான தாராளத்தன்மை இப்போது இலட்சியத்தாலும் கடமையாலும் மங்காத அமைதியான, ஒளிரும் தரம் கொண்டது. பேரக்குழந்தைகளும் கொள்ளுப் பேரக்குழந்தைகளும் புனர்பூசத்தின் ஞானத்தின் மிகக் காய்ச்சி வடித்த வடிவைப் பெறுகிறார்கள்.",
        navigate: "உடல் கவனம் இதய-இரத்தக் குழாய், பொது உயிர்ச்சக்தியில். அரவணைப்பு, ஒளி, வழக்கமான ஊட்டச்சத்து, அன்பான குடும்பத்தினர், சமூகத்தின் துணை — இவையே எல்லாம். சூரிய–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) அதிக ஓய்வும் எச்சரிக்கையும் தேவைப்படும் காலத்தைக் கொண்டுவரலாம்.",
        focus: "ஞாயிற்றுக்கிழமை சூரிய வழிபாடு மற்றும் ஆதித்ய ஹ்ருதயம் பாராயணம். அதிதியின் பிள்ளை, குருவின் செழிப்பில் வந்து சனியின் ஒழுக்கத்தால் சோதிக்கப்பட்டு, சூரியனின் இறுதி தெளிவை அடைகிறார்.",
      },
      {
        expect: "மிக முதிர்ந்த வயதில் வரும் சந்திர தசை கடக-பாத புனர்பூசத்திற்கு ராசி அதிபதியின் வருகை. சந்திரன் உங்கள் ராசியான கடகத்தின் அதிபதி — இது கடகத்தில் பிறந்த புனர்பூச நேயர்களுக்கு இரட்டை வலிமையுடன் வருகிறது. உணர்வு நிறைவு, தாய்மை அரவணைப்பு, அலை போன்ற இருப்பு, வாழ்வின் ஆழ்ந்த அன்பு இணைப்புகள் இந்த வயதில் தனி அருளுடன் மேலெழுகின்றன. மிதுன-பாத புனர்பூசத்திற்கு இந்த வயதில் சந்திர தசை அலை போன்ற நிறைவைக் கொண்டுவருகிறது — நன்றாகவும் தாராளமாகவும் வாழ்ந்த வாழ்வின் கடல் உணர்வு.",
        navigate: "இந்த வயதில், உடல் பராமரிப்பே முதன்மைக் கவனம். சந்திர தசை அன்பான, நிலையான மனித இருப்பின் தேவையை அதிகரிக்கிறது. தனிமையைத் தவிர்ப்பது அவசியம்.",
        focus: "திங்கட்கிழமை சந்திர வழிபாடு, நீர் அர்ப்பணம், வெள்ளை பூக்கள், புனர்பூசத்தின் வாழ்நாள் தாராளத்தைப் பெற்றவர்களின் இருப்பு. அம்பறாத்தூணி இப்போது மிக முழுமையான பொருளில் காலியாக உள்ளது — முழுமையாகக் கொடுக்கப்பட்டது, எதுவும் தடுத்து வைக்கப்படவில்லை.",
      },
      {
        expect: "இந்த வரிசையின் கடைசி தசையான செவ்வாய் தசை மிகச் சிலரால் அடையப்படுகிறது. இங்கு வரும் அரிய புனர்பூச ஆத்மாக்களுக்கு, செவ்வாய் வலிமை, இருப்பு என்ற இறுதிக் கொடையைக் கொண்டுவருகிறார் — இந்த தீவிர வயதிலும் ஈடுபாட்டுடன், தெளிவாக, நோக்கத்துடன் இருக்கும் ஆற்றல். அம்பறாத்தூணி கடைசி முறை அம்பு எய்கிறது.",
        navigate: "இந்த வயதில் உடல் பராமரிப்பு முழுமையானதும் மென்மையானதும். இந்த வயதில் செவ்வாயின் ஆற்றல் உடல் வலிமையாக அல்ல, விருப்பத் தெளிவாக வெளிப்படுகிறது — ஒவ்வொரு எஞ்சிய நாளுக்கும் பொருள் உண்டு என்ற உறுதி.",
        focus: "செவ்வாய்க்கிழமை செவ்வாய் சன்னதி வழிபாடு, சிவப்பு மலர் அர்ப்பணம். ஒரு நூற்றாண்டு முழுவதும் புதுப்பித்து புதுப்பித்து வந்த அதிதியின் பிள்ளை செவ்வாயின் பராமரிப்பில் இறுதி அம்பை எய்கிறது.",
      },
    ],
    spirituality: [
      { title: "அதிதி & தாய் தெய்வம் வழிபாடு",    desc: "புனர்பூசத்தின் தலைமை தெய்வம் அதிதி, அனைத்தின் தாய் — அதிதி, தேவி, பார்வதி வழிபாடு ஆழமாக ஒத்தொலிக்கிறது. திங்கள் வழிபாடும் வெள்ளை பூ அர்ப்பணமும் தாயாரின் செழிப்பை போற்றுகின்றன." },
      { title: "புதுப்பித்தல் நடைமுறைகள்",         desc: "புனர்பூசத்துக்கு ஆன்மீக நடைமுறை வேண்டுமென்றே புதுப்பித்தலை உள்ளடக்க வேண்டும் — ஆவணித்தல் பின்பு தாராளமான நடவடிக்கை, திரும்பல் பின்பு மீண்டும் ஈடுபாடு." },
      { title: "பிருஹஸ்பதி & குரு மரியாதை",        desc: "குரு புனர்பூசத்தில் சிறப்பு வலிமையுடன் ஆட்சி செய்கிறார்; வியாழக்கிழமை பிருஹஸ்பதி பூஜை, குரு வந்தனம், வாழும் ஆன்மீக ஆசிரியரிடம் ஆசி பெறுதல் இயல்பான ஞானத்தை அதிகரிக்கிறது." },
    ],
    guidance: "நீங்கள் திரும்புவதற்கு பிறந்தீர்கள் — நல்லதற்கு, ஞானத்திற்கு, அன்பிற்கு, மீண்டும் தொடங்குவதற்கு. அம்பறாத்தூணி புனர்பூசத்துக்கு உண்மையில் என்றும் காலியாவதில்லை. ஒவ்வொரு வீழ்ச்சியும் தற்காலிக கோணமாக இருக்கட்டும், நிரந்தர இடமாக அல்ல.",
    careerNote: "ஞானம் ஒரு மனதிலிருந்து மற்றொன்றுக்கு பரிமாற்றப்படும் இடங்களில் புனர்பூசம் சிறப்பாக செயல்படுகிறார்.",
    modernLead: "புனர்பூசத்தின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "புதுப்பித்தல், ஈகை, ஞானம் புனர்பூசத்தின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function PunarvasuVisualPage() {
  return <NatchathiramVisualContent data={PUNARVASU} visual={PUNARVASU_VISUAL} timings={dasaTimingsFor(PUNARVASU.number)} />;
}
