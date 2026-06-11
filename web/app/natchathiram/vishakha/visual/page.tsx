import type { Metadata } from "next";
import { VISHAKHA } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

export const metadata: Metadata = {
  title: "Vishakha Nakshathiram — Visual Profile | Vinaadi",
  description: "Visual profile of Vishakha Nakshathiram: personality traits, career strengths, dasha timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/vishakha/visual" },
  openGraph: {
    title: "Vishakha Nakshathiram — Visual Profile",
    description: "Visual profile of Vishakha Nakshathiram: personality traits, career strengths, dasha timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/vishakha/visual",
    type: "article",
  },
};

const VISHAKHA_VISUAL: NatchathiramVisualData = {
  atAGlance: [
    { label: "Goal Determination",    score: 97 },
    { label: "Transformative Power",  score: 94 },
    { label: "Focused Ambition",      score: 95 },
    { label: "Leadership Intensity",  score: 92 },
    { label: "Spiritual Hunger",      score: 90 },
  ],

  radar: {
    labels: ["Determination", "Transformation", "Ambition", "Leadership", "Spirituality", "Persistence"],
    values: [97, 94, 95, 92, 90, 93],
  },

  coreStrengths: [
    { symbol: "◎", label: "Goal Determination",       score: 97, desc: "Indra-Agni's dual fire — Vishakha fixes on a goal with the certainty of lightning and the sustained heat of fire." },
    { symbol: "◈", label: "Transformative Power",      score: 94, desc: "The forked branch — Vishakha navigates forks in the road with unusual courage, willing to transform completely when the goal requires it." },
    { symbol: "⚡", label: "Focused Ambition",         score: 95, desc: "The arrow aimed at a single target — Vishakha in focused mode outperforms most competitors because the goal is never lost from sight." },
    { symbol: "♥", label: "Leadership by Example",    score: 92, desc: "Vishakha does not ask others to go where they have not gone themselves — the intensity of personal commitment inspires those around them." },
    { symbol: "△", label: "Spiritual Hunger",         score: 90, desc: "Indra's restless seeking — Vishakha is never satisfied with surface explanations and drives toward ultimate understanding in every domain." },
    { symbol: "☽", label: "Persistent Resilience",    score: 93, desc: "The goal reached — eventually. Vishakha may be delayed, opposed, or diverted, but the arrow finds its mark in the end." },
  ],

  careerAbilities: [
    { label: "Leadership & Strategy",   score: 97 },
    { label: "Politics & Governance",   score: 94 },
    { label: "Research & Investigation", score: 93 },
    { label: "Spiritual & Philosophical Work", score: 90 },
    { label: "Business & Commerce",     score: 91 },
  ],
  careerNote: "Vishakha thrives wherever a single, clear goal must be pursued through complexity, opposition, and sustained effort — the political leader, the strategic researcher, the reformer who finishes what they started.",

  careerClusters: [
    { symbol: "◎", title: "Politics & Public Leadership",    desc: "Government, political strategy, public administration — Vishakha's goal-determination at societal scale." },
    { symbol: "◈", title: "Research & Strategic Investigation", desc: "Deep research, intelligence work, strategic analysis — the focused arrow of Vishakha's intelligence." },
    { symbol: "⚡", title: "Business Leadership & Strategy", desc: "CEO, strategic consultant, business founder — Vishakha's ambition and resilience at organisational scale." },
    { symbol: "♥", title: "Spiritual & Philosophical Work",  desc: "Vedanta, intensive spiritual practice, philosophical inquiry — Indra's restless seeking finding its highest object." },
    { symbol: "△", title: "Law & Social Reform",            desc: "Legal practice, social reform, activism — Vishakha's fire directed at injustice with sustained commitment." },
    { symbol: "☽", title: "Martial Arts & Competitive Sport", desc: "Competitive domains requiring goal-focus, sustained effort, and the capacity to withstand opposition." },
  ],

  modernApps: [
    { symbol: "◎", title: "GovTech & Political Strategy",    desc: "Democratic technology, civic engagement platforms, strategic governance tools." },
    { symbol: "◈", title: "Strategic Intelligence & Analysis", desc: "Competitive intelligence, strategic research platforms, analytical decision tools." },
    { symbol: "⚡", title: "Startup Founding & Scale-up",    desc: "Entrepreneurship, growth strategy, market disruption — Vishakha's ambition building new institutions." },
    { symbol: "♥", title: "Spiritual Tech & Deep Learning",  desc: "Contemplative technology, philosophical AI, wisdom knowledge platforms." },
    { symbol: "△", title: "Legal Reform & Advocacy Tech",    desc: "Legal innovation platforms, social justice technology, advocacy and reform tools." },
    { symbol: "☽", title: "Sports & Performance Analytics",  desc: "Athletic performance platforms, competitive strategy tools, performance optimisation." },
  ],

  dashaTimeline: [
    {
      planet: "Jupiter", period: "16 yrs", ageRange: "Age 0–16", theme: "The Goal is Set",
      detail: {
        expect: "Vishakha opens in Jupiter dasha — a wise, expansive beginning that sets the philosophical and ethical foundation for a lifetime of purposeful pursuit. Childhood (0–8) is typically characterised by an unusual earnestness: the Vishakha child has opinions, positions, and a sense of what matters that adults find surprising. Brihaspati's influence gives the young Vishakha access to principles — right and wrong, fair and unfair, worthy and unworthy — before most peers have even formed the questions. School years (8–16) produce the student who has already decided what they want and is using education as the instrument for getting there. The first serious life goal — a career ambition, a philosophical conviction, a sporting or competitive dream — crystallises in Jupiter dasha.",
        navigate: "Jupiter's generosity can produce in the young Vishakha a degree of righteousness — the certainty of one's own correctness — that alienates peers and teachers who feel judged by the standard being applied. The Indra-Agni fire that is Vishakha's gift requires the warmth of Jupiter's wisdom to channel it productively rather than abrasively. Jupiter–Rahu antardasha (~yr 12 of Jupiter, ~age 12) can bring an early identity disruption or philosophical crisis that is ultimately clarifying.",
        focus: "Thursday Brihaspati worship and early exposure to ethical, philosophical, and strategic thought — stories of great leaders, religious and philosophical texts, biographical study of people who achieved significant goals. The goal that Vishakha sets in Jupiter dasha tends to be the organising principle of the rest of the life; make sure the environment that forms it is worthy.",
      },
    },
    {
      planet: "Saturn", period: "19 yrs", ageRange: "Age 16–35", theme: "The Long Work Toward the Goal",
      detail: {
        expect: "Saturn dasha from 16 to 35 is the great test of Vishakha's goal-determination. The ambition set in Jupiter dasha now meets reality — the long, demanding, sometimes discouraging work of actually becoming what was envisioned. Higher education or professional training; the first career steps; marriage and family formation (typically ages 25–30); the first significant achievement that validates the direction — all run through Saturn's nineteen years. Vishakha in Saturn dasha discovers whether the goal-determination is genuine or merely the enthusiasm of youth. For most, it is genuine, and Saturn's demands forge it into steel.",
        navigate: "Saturn's primary test for Vishakha is patience with the pace of progress. Indra-Agni's fire wants the goal now; Saturn insists on the full journey. The frustration that produces — the talent that is not yet matched by opportunity, the ambition that outpaces the circumstances — is Saturn's teaching. Saturn–Rahu antardasha (~yr 12 of Saturn, ~ages 28–30) is the most demanding sub-period; career stagnation, relationship pressure, and value conflicts can all peak simultaneously.",
        focus: "Saturday Shani worship and deliberate cultivation of patience. For Tula-pada Vishakha, watch Saturn–Venus antardasha (~yr 10 of Saturn, ~ages 26–28): Venus as rasi lord brings a 20-month window of relational, aesthetic, and commercial achievement in the midst of Saturn's demands. For Vrischika-pada, watch Saturn–Mars antardasha (~yr 5 of Saturn, ~age 21): Mars as rasi lord brings an early period of intense drive and assertive breakthrough.",
      },
    },
    {
      planet: "Mercury", period: "17 yrs", ageRange: "Age 35–52", theme: "Strategic Intelligence",
      detail: {
        expect: "Mercury dasha from 35 to 52 brings Vishakha's analytical and communicative intelligence into full service of the goal. The strategic mind — the capacity to understand systems, identify leverage points, and communicate the goal in ways that recruit others to it — reaches its peak expression. Career advances significantly; leadership recognition comes; the social and professional network that Vishakha has been building since Jupiter dasha now has enough critical mass to accelerate progress toward the primary objective. For those in political, legal, research, or leadership roles, the most significant professional contributions of the life typically fall in Mercury dasha.",
        navigate: "Mercury's primary challenge for Vishakha is not the goal but the method — the risk of becoming purely strategic, treating people as instruments for achieving objectives rather than as ends in themselves. The intensity that serves the goal can corrode relationships and alliances if Mercury's rationality is not balanced by Jupiter's warmth. Physical concerns: nervous system, respiratory, and the tension-related conditions that sustained ambitious focus produces.",
        focus: "Wednesday worship and deliberate relationship investment alongside strategic work. For Tula-pada Vishakha, Mercury–Venus antardasha (~yr 1 of Mercury, ~ages 35–37): Venus as rasi lord opens this dasha with a significant relational and commercial window.",
      },
    },
    {
      planet: "Ketu", period: "7 yrs", ageRange: "Age 52–59", theme: "The Arrow Turns Inward",
      detail: {
        expect: "Ketu dasha from 52 to 59 redirects Vishakha's arrow toward the interior. The external goals that have organised the life are either achieved, abandoned, or transformed; Ketu demands an honest accounting of what was worth the sustained pursuit and what was not. Spiritual depth that has been deferred by the urgency of goal-pursuit surfaces with unusual force. For many Vishakha, Ketu dasha is the period in which the philosophical hunger that Jupiter first awakened finally receives the sustained attention it has always deserved.",
        navigate: "Ketu's inward demand can feel profoundly disorienting to a person whose entire identity has been organised around external achievement. The fire that burned toward the goal for forty years does not simply extinguish; it transforms into the fire of inquiry, practice, and ultimate seeking. Physical concerns: nervous system, autoimmune vulnerabilities, and the physical cost of decades of sustained intense effort.",
        focus: "Ketu shrine visits, pitru tharpanam, sustained meditation, and philosophical study of the deepest kind — Upanishads, Vedanta, Shaiva or Vaishnava scripture. The arrow aimed at the ultimate target is Ketu's defining spiritual metaphor for Vishakha.",
      },
    },
    {
      planet: "Venus", period: "20 yrs", ageRange: "Age 59–79", theme: "Rasi Lord for Tula-born — The Beautiful Achievement",
      detail: {
        expect: "Venus dasha from 59 to 79 is the rasi lord's arrival for Tula-pada Vishakha. Venus is the lord of your rasi, Tula — this makes her dasha doubly charged for Tula-born Vishakha natives. The beauty, relational warmth, and aesthetic richness that Tula's Venus offers now flow without the goal-urgency that characterised the earlier decades. Career legacy is established; grandchildren arrive; the achieved life is enjoyed rather than driven. Creative expression — music, art, garden, writing — re-emerges with the freedom that achievement provides. For Vrischika-pada Vishakha, Venus dasha brings a prolonged period of aesthetic and relational abundance.",
        navigate: "Venus dasha's health concerns in this age band are cardiovascular, kidney function, and hormonal. The intensity that defined Vishakha's earlier decades requires deliberate release in Venus dasha — the fire is allowed to warm rather than burn. Venus–Saturn antardasha (~yr 14 of Venus, ~ages 73–75) demands careful pacing.",
        focus: "Friday Lakshmi worship, rose and jasmine offerings, music, natural beauty. The determination that aimed the arrow for five decades now simply rests in the landscape it created.",
      },
    },
    {
      planet: "Sun", period: "6 yrs", ageRange: "Age 79–85", theme: "Solar Recognition",
      detail: {
        expect: "Sun dasha from 79 to 85 brings a final quality of radiant recognition — the goals pursued across a lifetime are seen clearly and acknowledged, both by Vishakha and by those who have witnessed the pursuit. The Indra-Agni fire settles into pure solar warmth: the authority of one who has arrived.",
        navigate: "Physical care focuses on heart and general vitality. The recognition of Sun dasha should not reawaken the achieving drive at the expense of physical care — the body needs rest, warmth, and gentle living now.",
        focus: "Sunday Surya worship and Aditya Hridayam recitation. Indra's archer rests in the light.",
      },
    },
    {
      planet: "Moon", period: "10 yrs", ageRange: "Age 85–95", theme: "Tidal Completion",
      detail: {
        expect: "Moon dasha from 85 to 95 brings the tidal completion — the emotional ocean that the fire of Vishakha's life was always also flowing through. Grandchildren and great-grandchildren receive the most fully present version of this person. The spiritual hunger of a lifetime resolves into the oceanic feeling of the Moon.",
        navigate: "At this age, physical care is the primary requirement. Moon dasha amplifies the need for consistent, loving human presence and gentle routine.",
        focus: "Monday Moon worship, water offerings, white flowers, and the company of those who have been the beneficiaries of Vishakha's lifelong determined love.",
      },
    },
    {
      planet: "Mars", period: "7 yrs", ageRange: "Age 95–102", theme: "Rasi Lord for Vrischika-born — The Final Fire",
      detail: {
        expect: "Mars dasha from 95 to 102 is the rasi lord's arrival for Vrischika-pada Vishakha. Mars is the lord of your rasi, Vrischika — this makes his dasha doubly charged for Vrischika-born Vishakha natives. The fire that has defined this person's entire life returns in its purest form — not the ambitious drive of youth but the clarified, essential will of one who has completed a great journey. For Tula-pada Vishakha, Mars dasha at this extreme age brings one final quality of decisive presence.",
        navigate: "Complete physical care. Mars at this age is will, not energy; clarity, not force. Treat this person's last years with the respect owed to one who has pursued a great goal with a great fire.",
        focus: "Tuesday Mars shrine prayers, red offerings, and the presence of those who understand the magnitude of the journey this person has made. The arrow has found its mark.",
      },
    },
  ],

  spirituality: [
    {
      title: "Indra & Agni Worship",
      desc: "Vishakha's presiding deities are Indra and Agni — Thursday Indra puja, Tuesday fire ritual (Agni homa), and the Indra Sukta from the Rig Veda are the most resonant devotional expressions.",
    },
    {
      title: "Goal-Directed Spiritual Practice",
      desc: "Vishakha's spirituality must be goal-directed — not diffuse devotion but intense, focused practice. Intensive retreat, specific vow-keeping (vratas), and the identification of a single ultimate spiritual goal to pursue with the same determination applied to worldly goals are the most authentic spiritual expressions.",
    },
    {
      title: "Kartikeya & Warrior Temples",
      desc: "Kartikeya (Murugan), the god of focused will and the spear that never misses, carries profound resonance for Vishakha. Murugan temples — Palani, Tiruchendur, Swamimalai — are powerful pilgrimage destinations.",
    },
  ],

  guidance: "The arrow never misses if the target is real. The question Vishakha must ask in every decade is not 'Can I achieve this?' but 'Is this worth achieving?' The fire that never goes out is a gift only if it is aimed at what is genuinely worth the burning. Indra-Agni's dual nature — the lord of heaven seeking the ultimate, the fire that transforms without consuming — is your complete instruction.",

  compatibleEn: ["Chitra", "Anuradha", "Ashwini", "Jyeshtha", "Punarvasu"],
  compatibleNote: "These nakshatras complement Vishakha's goal-determination, transformative power, and spiritual hunger with creativity, depth, and complementary fire.",

  ta: {
    atAGlanceLabels: ["இலக்கு உறுதி", "மாற்றும் சக்தி", "கவனம் செலுத்திய உறுதி", "தலைமை தீவிரம்", "ஆன்மீக பசி"],
    radarLabels: ["உறுதி", "மாற்றம்", "உறுதி", "தலைமை", "ஆன்மீகம்", "தொடர்ச்சி"],
    coreStrengths: [
      { label: "இலக்கு உறுதி",          desc: "இந்திர-அக்னியின் இரட்டை நெருப்பு — விசாகம் மின்னலின் நிச்சயத்துடன் ஒரு இலக்கில் நிலைநிறுத்துகிறார் மற்றும் நெருப்பின் நீடித்த வெப்பத்துடன்." },
      { label: "மாற்றும் சக்தி",         desc: "பிரிந்த கிளை — விசாகம் வழியில் உள்ள முட்டுக்கட்டைகளை அசாதாரண தைரியத்துடன் வழிநடத்துகிறார், இலக்கு கோரும் போது முழுமையாக மாற விரும்புகிறார்." },
      { label: "கவனம் செலுத்திய உறுதி", desc: "ஒரு இலக்கை நோக்கிய அம்பு — கவனமூட்டப்பட்ட முறையில் விசாகம் பெரும்பாலான போட்டியாளர்களை மிஞ்சுகிறார் ஏனெனில் இலக்கு ஒருபோதும் பார்வையிலிருந்து விலகுவதில்லை." },
      { label: "உதாரணத்தால் தலைமை",     desc: "விசாகம் தாங்களே போகாத இடங்களுக்கு மற்றவர்களை அனுப்புவதில்லை — தனிப்பட்ட அர்ப்பணத்தின் தீவிரம் சுற்றியிருப்பவர்களை ஊக்குவிக்கிறது." },
      { label: "ஆன்மீக பசி",            desc: "இந்திரனின் அமைதியற்ற தேடல் — விசாகம் மேல்நிலை விளக்கங்களில் திருப்தியடைவதில்லை மற்றும் ஒவ்வொரு தளத்திலும் இறுதி புரிதலை நோக்கி நகர்கிறார்." },
      { label: "தொடர்ந்த மீள்தன்மை",    desc: "இலக்கு அடையப்படுகிறது — இறுதியில். விசாகம் தாமதப்படுத்தப்படலாம், எதிர்க்கப்படலாம், திசைமாற்றப்படலாம், ஆனால் அம்பு இறுதியில் தன் இலக்கை காண்கிறது." },
    ],
    careerAbilityLabels: ["தலைமை & மூலோபாயம்", "அரசியல் & ஆட்சி", "ஆராய்ச்சி & விசாரணை", "ஆன்மீக & தாத்விக வேலை", "வணிகம் & வாணிஜ்யம்"],
    careerClusters: [
      { title: "அரசியல் & பொது தலைமை",    desc: "அரசு, அரசியல் மூலோபாயம், பொது நிர்வாகம் — சமூக அளவில் விசாகத்தின் இலக்கு-உறுதி." },
      { title: "ஆராய்ச்சி & மூலோபாய விசாரணை", desc: "ஆழமான ஆராய்ச்சி, நுண்ணறிவு வேலை, மூலோபாய பகுப்பாய்வு — விசாகத்தின் நுண்ணறிவின் கவனமான அம்பு." },
      { title: "வணிக தலைமை & மூலோபாயம்", desc: "CEO, மூலோபாய ஆலோசகர், வணிக நிறுவனர் — நிறுவன அளவில் விசாகத்தின் உறுதி மற்றும் மீள்தன்மை." },
      { title: "ஆன்மீக & தாத்விக வேலை",  desc: "வேதாந்தம், தீவிர ஆன்மீக நடைமுறை, தாத்விக விசாரணை — அதன் மிக உயர்ந்த பொருளை கண்டுபிடிக்கும் இந்திரனின் அமைதியற்ற தேடல்." },
      { title: "சட்டம் & சமூக சீர்திருத்தம்", desc: "சட்ட நடைமுறை, சமூக சீர்திருத்தம், செயல்திட்டவாதம் — நீடித்த அர்ப்பணத்துடன் அநீதியை நோக்கிய விசாகத்தின் நெருப்பு." },
      { title: "போர்க்கலை & போட்டி விளையாட்டு", desc: "இலக்கு-கவனம், நீடித்த முயற்சி, எதிர்ப்பை தாங்கும் திறன் கோரும் போட்டி தளங்கள்." },
    ],
    modernApps: [
      { title: "ஆட்சி தொழில்நுட்பம் & அரசியல் மூலோபாயம்", desc: "ஜனநாயக தொழில்நுட்பம், குடிமை ஈடுபாடு தளங்கள், மூலோபாய ஆட்சி கருவிகள்." },
      { title: "மூலோபாய நுண்ணறிவு & பகுப்பாய்வு", desc: "போட்டி நுண்ணறிவு, மூலோபாய ஆராய்ச்சி தளங்கள், பகுப்பாய்வு முடிவெடுக்கும் கருவிகள்." },
      { title: "தொடக்க நிறுவனம் & வளர்ச்சி",   desc: "தொழில்முனைவு, வளர்ச்சி மூலோபாயம், சந்தை இடையூறு — புதிய நிறுவனங்களை கட்டும் விசாகத்தின் உறுதி." },
      { title: "ஆன்மீக தொழில்நுட்பம் & ஆழமான கற்றல்", desc: "சிந்தனா தொழில்நுட்பம், தாத்விக AI, ஞான அறிவுத் தளங்கள்." },
      { title: "சட்ட சீர்திருத்தம் & வழக்காடல் தொழில்நுட்பம்", desc: "சட்ட கண்டுபிடிப்பு தளங்கள், சமூக நீதி தொழில்நுட்பம், வழக்காடல் மற்றும் சீர்திருத்த கருவிகள்." },
      { title: "விளையாட்டு & செயல்திறன் பகுப்பாய்வு", desc: "விளையாட்டு செயல்திறன் தளங்கள், போட்டி மூலோபாய கருவிகள், செயல்திறன் உகப்பாக்கம்." },
    ],
    dashaThemes: [
      "இலக்கு நிர்ணயிக்கப்படுகிறது — குரு தத்துவம், ஆரம்பகால நோக்கம்",
      "இலக்கை நோக்கிய நீண்ட வேலை — சனி சோதனை, உறுதி நிரூபணம்",
      "மூலோபாய நுண்ணறிவு — புதன் தொழில் உச்சம்",
      "அம்பு உள்நோக்கி திரும்புகிறது — கேது ஆன்மீக திரும்பல்",
      "துலா ராசி அதிபதி — அழகான சாதனை — சுக்கிர தசை",
      "சூரிய அங்கீகாரம் — ஒளிர்ந்த அடையாளம்",
      "கோடை நிறைவு — சந்திர அலை",
      "விருச்சிக ராசி அதிபதி — இறுதி நெருப்பு — செவ்வாய் தசை",
    ],
    dashaDetails: [
      {
        expect: "விசாகம் குரு தசையில் திறக்கிறார் — நோக்கம் நிறைந்த வாழ்நாளுக்கு தத்துவ மற்றும் நெறியியல் அடித்தளத்தை நிறுவும் ஞானமான, விரிவான ஆரம்பம். குழந்தை பருவம் (0–8) அசாதாரண தீவிரத்தால் வரையறுக்கப்படுகிறது: கருத்துக்கள், நிலைப்பாடுகள், முக்கியத்துவம் உள்ளது என்ற உணர்வு கொண்ட விசாக குழந்தை. முதல் தீவிரமான வாழ்க்கை இலக்கு — ஒரு தொழில் உறுதி, ஒரு தாத்விக நம்பிக்கை — குரு தசையில் படிகமாகிறது.",
        navigate: "குருவின் தாராளத்தன்மை இளம் விசாகத்தில் ஒரு அளவிலான நீதிமான்-தன்மையை உருவாக்கலாம் — சகமாணவர்கள் மற்றும் ஆசிரியர்களை அந்நியப்படுத்தும் சொந்த சரியான தன்மையின் நிச்சயம். குரு–ராகு (~yr 12, ~12 வயது) ஒரு ஆரம்பகால அடையாள இடையூறு.",
        focus: "வியாழக்கிழமை பிருஹஸ்பதி வழிபாடு மற்றும் நெறியியல் மற்றும் மூலோபாய சிந்தனைக்கான ஆரம்பகால வெளிப்பாடு. விசாகம் குரு தசையில் நிர்ணயிக்கும் இலக்கு வாழ்க்கையின் ஒழுங்கமைக்கும் கொள்கையாக இருக்கும்.",
      },
      {
        expect: "சனி தசை 16 முதல் 35 வரை விசாகத்தின் இலக்கு-உறுதியின் மாபெரும் சோதனை. குரு தசையில் நிர்ணயிக்கப்பட்ட உறுதி இப்போது யதார்த்தத்தை சந்திக்கிறது — உண்மையில் கண்கண்ட நீண்ட, கோரும், சில நேரங்களில் ஊக்கமிழக்கச் செய்யும் வேலை. திருமணம் 25–30 வயதுக்கு இடையே.",
        navigate: "விசாகத்திற்கு சனியின் முதன்மையான சோதனை முன்னேற்றத்தின் வேகத்தில் பொறுமை. சனி–ராகு (~yr 12, ~28–30 வயது) மிகவும் கோரும் துணை காலம். துலா பாதம்: சனி–சுக்கிர (~yr 10, ~26–28 வயது) கவனிக்கவும். விருச்சிக பாதம்: சனி–செவ்வாய் (~yr 5, ~21 வயது) கவனிக்கவும் — ராசி அதிபதியின் ஆரம்பகால தீவிர வேகம்.",
        focus: "சனிக்கிழமை சனி வழிபாடு மற்றும் வேண்டுமென்றே பொறுமை வளர்ப்பு. இந்திர-அக்னியின் நெருப்பு சனி தசையில் எஃகாக கட்டப்படுகிறது.",
      },
      {
        expect: "புதன் தசை 35 முதல் 52 வரை விசாகத்தின் பகுப்பாய்வு மற்றும் தொடர்பு நுண்ணறிவை இலக்கிற்கு முழு சேவையில் கொண்டு வருகிறது. தொழில் கணிசமாக முன்னேறுகிறது; தலைமை அங்கீகாரம் வருகிறது. மிகவும் முக்கியமான தொழில்முறை பங்களிப்புகள் இங்கே விழுகின்றன.",
        navigate: "புதன் விசாகத்திற்கு முறை சம்பந்தமான சவாலை கொண்டு வருகிறது — மனிதர்களை இலக்குகளை அடைவதற்கான கருவிகளாக நடத்துவதற்கான அபாயம். துலா பாதம்: புதன்–சுக்கிர (~yr 1, ~35–37 வயது) — ராசி அதிபதி இந்த தசையை முக்கியமான உறவு சாளரத்துடன் திறக்கிறார்.",
        focus: "புதன்கிழமை வழிபாடு மற்றும் மூலோபாய வேலையுடன் வேண்டுமென்றே உறவு முதலீடு.",
      },
      {
        expect: "கேது தசை 52 முதல் 59 வரை விசாகத்தின் அம்பை உள்நோக்கி திசைதிருப்புகிறது. வெளிப்புற இலக்குகள் எதிர்கொள்கின்றன — அடையப்பட்டது, கைவிடப்பட்டது, அல்லது மாற்றப்பட்டது. பல விசாகத்திற்கு, கேது தசை குரு முதலில் தூண்டிய தாத்விக பசி இறுதியாக நீடித்த கவனம் பெறும் காலம்.",
        navigate: "வெளிப்புற சாதனையை சுற்றி அமைந்த அடையாளத்திற்கு கேதுவின் உள்நோக்கிய கோரிக்கை ஆழமாக திசைமாறி உணர்லலாம். நாற்பது ஆண்டுகளாக இலக்கை நோக்கி எரிந்த நெருப்பு வெறுமனே அணைவதில்லை; அது விசாரணை, நடைமுறை, இறுதி தேடலின் நெருப்பாக மாறுகிறது.",
        focus: "கேது சன்னதி வழிபாடு, பித்ரு தர்ப்பணம், உபநிஷதங்கள், வேதாந்தம், சைவ அல்லது வைஷ்ணவ நூல்களின் ஆழமான ஆய்வு.",
      },
      {
        expect: "சுக்கிர தசை 59 முதல் 79 வரை துலா-பாத விசாகத்திற்கு ராசி அதிபதியின் வருகை. சுக்கிரன் உங்கள் ராசியான துலாவின் அதிபதி — இது துலா-பிறந்த விசாகம் நேயர்களுக்கு இரட்டை வலிமையுடன் வருகிறது. அழகு, உறவு அரவணைப்பு, அழகியல் செழிப்பு இலக்கு-அவசரம் இல்லாமல் பாய்கின்றன. தொழில் மரபு நிறுவப்பட்டது; பேரக்குழந்தைகள் வருகிறார்கள். சுக்கிர–குரு (~yr 4, ~63–64 வயது) விசாகத்தின் இரண்டு மிகவும் இயல்பாக சீரமைந்த கிரக ஆற்றல்களை இணைக்கிறது.",
        navigate: "இந்த வயது பட்டையில் சுக்கிரனின் ஆரோக்ய கவலைகள் இதய-வாஸ்குலர், சிறுநீரக செயல்பாடு. சுக்கிர–சனி (~yr 14, ~73–75 வயது) கவனமான வேகத்தை கோருகிறது.",
        focus: "வெள்ளிக்கிழமை லட்சுமி வழிபாடு, ரோஜா மற்றும் மல்லிகை அர்ப்பணம். ஐந்து தசகங்கள் அம்பை நோக்கிய உறுதி இப்போது உருவாக்கிய நிலப்பரப்பில் ஓய்கிறது.",
      },
      {
        expect: "சூரியன் தசை 79 முதல் 85 வரை ஒளிர்ந்த அங்கீகாரத்தின் இறுதி தரத்தை கொண்டு வருகிறது. ஒரு வாழ்நாளில் நடைபெற்ற இலக்குகள் தெளிவாக பார்க்கப்பட்டு அங்கீகரிக்கப்படுகின்றன. இந்திர-அக்னி நெருப்பு தூய சூரிய அரவணைப்பில் நிலைகொள்கிறது.",
        navigate: "இதயம் மற்றும் பொது உயிர்சக்தியில் உடல் கவனம். சூரியன் தசையின் அங்கீகாரம் உடல் பராமரிப்பை விட சாதனை வேகத்தை மீண்டும் தூண்டக்கூடாது.",
        focus: "ஞாயிற்றுக்கிழமை சூரிய வழிபாடு மற்றும் ஆதித்ய ஹ்ருதயம் பாராயணம். இந்திரனின் வில்லாளி ஒளியில் ஓய்கிறார்.",
      },
      {
        expect: "சந்திர தசை 85 முதல் 95 வரை கோடை நிறைவை கொண்டு வருகிறது — விசாகத்தின் வாழ்க்கையின் நெருப்பு எப்போதும் பாய்ந்திருந்த உணர்வு கடல். பேரக்குழந்தைகள் மற்றும் கொள்ளுப்பேரக்குழந்தைகள் இந்த நபரின் மிகவும் முழுமையாக இருக்கும் பதிப்பை பெறுகிறார்கள்.",
        navigate: "இந்த வயதில், உடல் பராமரிப்பு முதன்மை. சந்திர தசை நிலையான, அன்பான மனித இருப்பின் தேவையை அதிகரிக்கிறது.",
        focus: "திங்கட்கிழமை சந்திர வழிபாடு, நீர் அர்ப்பணம், வெள்ளை பூக்கள். விசாகத்தின் தொடர்ந்த நேர்மையான அன்பின் பலனாளர்களான நபர்களின் நிறுவனம்.",
      },
    ],
    spirituality: [
      { title: "இந்திர & அக்னி வழிபாடு",         desc: "விசாகத்தின் தலைமை தெய்வங்கள் இந்திரன் மற்றும் அக்னி — வியாழக்கிழமை இந்திர பூஜை, செவ்வாய் நெருப்பு சடங்கு (அக்னி ஹோமம்), ரிக் வேதத்திலிருந்து இந்திர சூக்தம் மிகவும் ஒத்தொலிக்கும் பக்தி வெளிப்பாடுகள்." },
      { title: "இலக்கு-நோக்கிய ஆன்மீக நடைமுறை", desc: "விசாகத்தின் ஆன்மீகம் இலக்கு-நோக்கியதாக இருக்க வேண்டும் — பரவிய பக்தி அல்ல, ஆனால் தீவிரமான, கவனமான நடைமுறை. தீவிர ஒய்வு, குறிப்பிட்ட விரத-அனுஷ்டானம் (விரதங்கள்), உலகியல் இலக்குகளுக்கு பயன்படுத்தப்படும் அதே உறுதியுடன் ஒரு இறுதி ஆன்மீக இலக்கை தேர்ந்தெடுப்பது மிகவும் உண்மையான ஆன்மீக வெளிப்பாடுகள்." },
      { title: "கார்த்திகேய & போர்க்கலை கோவில்கள்", desc: "கார்த்திகேய (முருகன்), கவனமான விருப்பத்தின் கடவுள் மற்றும் தவறாத ஈட்டி, விசாகத்திற்கு ஆழமான ஒத்தொலிப்பு கொண்டது. முருகன் கோவில்கள் — பழனி, திருச்செந்தூர், சுவாமிமலை — சக்திவாய்ந்த யாத்திரை இலக்குகள்." },
    ],
    guidance: "இலக்கு உண்மையானது என்றால் அம்பு ஒருபோதும் தவறாது. ஒவ்வொரு தசகத்திலும் விசாகம் கேட்க வேண்டிய கேள்வி 'நான் இதை அடைய முடியுமா?' அல்ல, 'இது அடைவதற்கு மதிப்புள்ளதா?' என்பது. என்றும் அணையாத நெருப்பு ஒரு கொடை — ஒரு கொடை மட்டுமே — எரிவதற்கு உண்மையில் தகுதியானதை நோக்கி நோக்கப்பட்டால். இந்திர-அக்னியின் இரட்டை இயல்பு — இறுதியை தேடும் சொர்க்கத்தின் அதிபதி, அழிக்காமல் மாற்றும் நெருப்பு — உங்கள் முழுமையான வழிமுறை.",
    careerNote: "சிக்கல், எதிர்ப்பு, நீடித்த முயற்சி மூலம் ஒரு தெளிவான இலக்கை நடைமுறைப்படுத்த வேண்டிய இடங்களில் விசாகம் சிறப்பாக செயல்படுகிறார்.",
    modernLead: "விசாகத்தின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "இலக்கு உறுதி, மாற்றும் சக்தி, ஆன்மீக பசி விசாகத்தின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function VishakhaVisualPage() {
  return <NatchathiramVisualContent data={VISHAKHA} visual={VISHAKHA_VISUAL} />;
}
