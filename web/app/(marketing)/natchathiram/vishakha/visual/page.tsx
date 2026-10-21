import type { Metadata } from "next";
import { withTamilTwin } from "@/lib/localized-metadata";
import { withDasaTimingHold } from "@/lib/natchathiram-dasa-hold";
import { dasaTimingsFor } from "@/lib/natchathiram-dasa-timings";
import { nakshatraDisplayName } from "@/lib/nakshatra-display-name";
import { natchathiramVisualTa } from "@/lib/marketing-seo-ta";
import { VISHAKHA } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

const EN_METADATA: Metadata = {
  title: `${nakshatraDisplayName(VISHAKHA.number, "en")} — Visual Profile`,
  description: "Visual profile of Visakam Nakshathiram: personality traits, career strengths, dasa timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/vishakha/visual" },
  openGraph: {
    title: `${nakshatraDisplayName(VISHAKHA.number, "en")} — Visual Profile`,
    description: "Visual profile of Visakam Nakshathiram: personality traits, career strengths, dasa timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/vishakha/visual",
    type: "article",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withDasaTimingHold(await withTamilTwin(EN_METADATA, "/natchathiram/vishakha/visual", natchathiramVisualTa("vishakha")!), "vishakha");
}

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
      planet: "Jupiter", theme: "The Goal is Set",
      detail: {
        expect: "Vishakha opens in Jupiter dasa — a wise, expansive beginning that sets the philosophical and ethical foundation for a lifetime of purposeful pursuit. Jupiter's is a long opening dasa, and the balance left at birth runs from long for births in the first pada to brief for the fourth; the range shown for this dasa gives it. Childhood is typically characterised by an unusual earnestness: the Vishakha child has opinions, positions, and a sense of what matters that adults find surprising. Brihaspati's influence gives the young Vishakha access to principles — right and wrong, fair and unfair, worthy and unworthy — before most peers have even formed the questions. Where the balance runs through the school years, they produce the student who has already decided what they want and is using education as the instrument for getting there. The first serious life goal — a career ambition, a philosophical conviction, a sporting or competitive dream — crystallises in Jupiter dasa.",
        navigate: "Jupiter's generosity can produce in the young Vishakha a degree of righteousness — the certainty of one's own correctness — that alienates peers and teachers who feel judged by the standard being applied. The Indra-Agni fire that is Vishakha's gift requires the warmth of Jupiter's wisdom to channel it productively rather than abrasively. The Jupiter–Rahu bhukti, which closes this dasa (the table below gives when it begins and how long it lasts), can bring an early identity disruption or philosophical crisis that is ultimately clarifying.",
        focus: "Thursday Brihaspati worship and early exposure to ethical, philosophical, and strategic thought — stories of great leaders, religious and philosophical texts, biographical study of people who achieved significant goals. The goal that Vishakha sets in Jupiter dasa tends to be the organising principle of the rest of the life; make sure the environment that forms it is worthy.",
      },
    },
    {
      planet: "Saturn", theme: "The Long Work Toward the Goal",
      detail: {
        expect: "Saturn dasa is the great test of Vishakha's goal-determination; it falls in different seasons by pada, from childhood through the school and college years for the later padas, and from adolescence into the middle of young adulthood for the first. The ambition set in Jupiter dasa now meets reality — the long, demanding, sometimes discouraging work of actually becoming what was envisioned. Higher education or professional training; the first career steps; marriage and family formation, where they fall in this dasa (read from Venus and the seventh house of the horoscope); the first significant achievement that validates the direction — all run through Saturn's long span. Vishakha in Saturn dasa discovers whether the goal-determination is genuine or merely the enthusiasm of youth. For most, it is genuine, and Saturn's demands forge it into steel.",
        navigate: "Saturn's primary test for Vishakha is patience with the pace of progress. Indra-Agni's fire wants the goal now; Saturn insists on the full journey. The frustration that produces — the talent that is not yet matched by opportunity, the ambition that outpaces the circumstances — is Saturn's teaching. The Saturn–Rahu bhukti (the table below gives when it begins and how long it lasts) is the most demanding sub-period; career stagnation, relationship pressure, and value conflicts can all peak simultaneously.",
        focus: "Saturday Shani worship and deliberate cultivation of patience. For Tula-pada Vishakha, watch the Saturn–Venus bhukti: Venus as rasi lord brings a window of relational, aesthetic, and commercial achievement in the midst of Saturn's demands. For Vrischika-pada, watch the Saturn–Mars bhukti: Mars as rasi lord brings a period of intense drive and assertive breakthrough. The bhukti table below gives when each begins and how long it lasts.",
      },
    },
    {
      planet: "Mercury", theme: "Strategic Intelligence",
      detail: {
        expect: "Mercury dasa brings Vishakha's analytical and communicative intelligence into full service of the goal; it begins anywhere from the close of adolescence to the early working years and carries through the building years of adult life. The strategic mind — the capacity to understand systems, identify leverage points, and communicate the goal in ways that recruit others to it — reaches its peak expression. Career advances significantly; leadership recognition comes; the social and professional network that Vishakha has been building since Jupiter dasa now has enough critical mass to accelerate progress toward the primary objective. For those in political, legal, research, or leadership roles, the most significant professional contributions of the life typically fall in Mercury dasa.",
        navigate: "Mercury's primary challenge for Vishakha is not the goal but the method — the risk of becoming purely strategic, treating people as instruments for achieving objectives rather than as ends in themselves. The intensity that serves the goal can corrode relationships and alliances if Mercury's rationality is not balanced by Jupiter's warmth. Physical concerns: nervous system, respiratory, and the tension-related conditions that sustained ambitious focus produces.",
        focus: "Wednesday worship and deliberate relationship investment alongside strategic work. For Tula-pada Vishakha, watch the Mercury–Venus bhukti (the bhukti table below gives when it begins and how long it lasts): Venus as rasi lord brings a significant relational and commercial window within this dasa.",
      },
    },
    {
      planet: "Ketu", theme: "The Arrow Turns Inward",
      detail: {
        expect: "Ketu dasa redirects Vishakha's arrow toward the interior. The external goals that have organised the life are either achieved, abandoned, or transformed; Ketu demands an honest accounting of what was worth the sustained pursuit and what was not. Spiritual depth that has been deferred by the urgency of goal-pursuit surfaces with unusual force. For many Vishakha, Ketu dasa is the period in which the philosophical hunger that Jupiter first awakened finally receives the sustained attention it has always deserved.",
        navigate: "Ketu's inward demand can feel profoundly disorienting to a person whose entire identity has been organised around external achievement. The fire that burned toward the goal for decades does not simply extinguish; it transforms into the fire of inquiry, practice, and ultimate seeking. Physical concerns: nervous system, autoimmune vulnerabilities, and the physical cost of decades of sustained intense effort.",
        focus: "Ketu shrine visits, pitru tharpanam, sustained meditation, and philosophical study of the deepest kind — Upanishads, Vedanta, Shaiva or Vaishnava scripture. The arrow aimed at the ultimate target is Ketu's defining spiritual metaphor for Vishakha.",
      },
    },
    {
      planet: "Venus", theme: "Rasi Lord for Tula-born — The Beautiful Achievement",
      detail: {
        expect: "Venus dasa, in later life, is the rasi lord's arrival for Tula-pada Vishakha. Venus is the lord of your rasi, Tula — this makes her dasa doubly charged for Tula-born Vishakha natives. The beauty, relational warmth, and aesthetic richness that Tula's Venus offers now flow without the goal-urgency that characterised the earlier decades. Career legacy is established; grandchildren arrive; the achieved life is enjoyed rather than driven. Creative expression — music, art, garden, writing — re-emerges with the freedom that achievement provides. For Vrischika-pada Vishakha, Venus dasa brings a prolonged period of aesthetic and relational abundance. The Venus–Jupiter bhukti (the table below gives when it begins and how long it lasts) combines Vishakha's two most naturally aligned planetary energies.",
        navigate: "Venus dasa's health concerns at this stage are cardiovascular, kidney function, and hormonal. The intensity that defined Vishakha's earlier decades requires deliberate release in Venus dasa — the fire is allowed to warm rather than burn. The Venus–Saturn bhukti (the table below gives when it begins and how long it lasts) demands careful pacing.",
        focus: "Friday Lakshmi worship, rose and jasmine offerings, music, natural beauty. The determination that aimed the arrow for a lifetime now simply rests in the landscape it created.",
      },
    },
    {
      planet: "Sun", theme: "Solar Recognition",
      detail: {
        expect: "Sun dasa, in advanced age, brings a final quality of radiant recognition — the goals pursued across a lifetime are seen clearly and acknowledged, both by Vishakha and by those who have witnessed the pursuit. The Indra-Agni fire settles into pure solar warmth: the authority of one who has arrived.",
        navigate: "Physical care focuses on heart and general vitality. The recognition of Sun dasa should not reawaken the achieving drive at the expense of physical care — the body needs rest, warmth, and gentle living now.",
        focus: "Sunday Surya worship and Aditya Hridayam recitation. Indra's archer rests in the light.",
      },
    },
    {
      planet: "Moon", theme: "Tidal Completion",
      detail: {
        expect: "Moon dasa, in very advanced age, brings the tidal completion — the emotional ocean that the fire of Vishakha's life was always also flowing through. Grandchildren and great-grandchildren receive the most fully present version of this person. The spiritual hunger of a lifetime resolves into the oceanic feeling of the Moon.",
        navigate: "At this age, physical care is the primary requirement. Moon dasa amplifies the need for consistent, loving human presence and gentle routine.",
        focus: "Monday Moon worship, water offerings, white flowers, and the company of those who have been the beneficiaries of Vishakha's lifelong determined love.",
      },
    },
    {
      planet: "Mars", theme: "Rasi Lord for Vrischika-born — The Final Fire",
      detail: {
        expect: "Mars dasa, the last in this sequence, is the rasi lord's arrival for Vrischika-pada Vishakha. Mars is the lord of your rasi, Vrischika — this makes his dasa doubly charged for Vrischika-born Vishakha natives. The fire that has defined this person's entire life returns in its purest form — not the ambitious drive of youth but the clarified, essential will of one who has completed a great journey. For Tula-pada Vishakha, Mars dasa at this extreme age brings one final quality of decisive presence.",
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

  compatibleEn: ["Chithirai", "Anusham", "Aswini", "Kettai", "Punarpoosam"],
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
      "உத்தி நுண்ணறிவு — புதன் தொழில் உச்சம்",
      "அம்பு உள்நோக்கித் திரும்புகிறது — கேது ஆன்மீகத் திரும்பல்",
      "துலா ராசி அதிபதி — அழகான சாதனை — சுக்கிர தசை",
      "சூரிய அங்கீகாரம் — ஒளிர்ந்த அடையாளம்",
      "அலை நிறைவு — சந்திர அலை",
      "விருச்சிக ராசி அதிபதி — இறுதி நெருப்பு — செவ்வாய் தசை",
    ],
    dashaDetails: [
      {
        expect: "விசாகம் குரு தசையில் தொடங்குகிறது — நோக்கம் நிறைந்த வாழ்நாளுக்கான தத்துவ, நெறி அடித்தளத்தை நிறுவும் ஞானமுள்ள, விரிந்த தொடக்கம். குரு நீண்ட தொடக்க தசை; பிறக்கும்போது மீதமுள்ள இருப்பு முதல் பாதத்தில் நீளமாகவும் நான்காம் பாதத்தில் சிறிதாகவும் இருக்கும் — இந்த தசைக்குக் காட்டப்படும் வரம்பு அதைச் சொல்கிறது. குழந்தைப் பருவம் பொதுவாக அசாதாரண தீவிரத்தால் குறிக்கப்படுகிறது: பெரியவர்களை வியக்க வைக்கும் கருத்துகள், நிலைப்பாடுகள், எது முக்கியம் என்ற உணர்வு கொண்ட விசாகக் குழந்தை. பிருஹஸ்பதியின் தாக்கம் இளம் விசாகத்துக்கு — சரி-தவறு, நியாயம்-அநியாயம், தகுதி-தகுதியின்மை — என்ற கொள்கைகளை, பெரும்பாலான சகாக்கள் கேள்விகளையே உருவாக்கும் முன்பே அணுகத் தருகிறது. இருப்பு பள்ளிக் காலம் முழுவதும் நீளுமானால், தாம் எதை விரும்புகிறோம் என்று ஏற்கனவே முடிவு செய்து, கல்வியை அங்கு செல்லும் கருவியாகப் பயன்படுத்தும் மாணவர் உருவாகிறார். முதல் தீவிர வாழ்க்கை இலக்கு — ஒரு தொழில் இலட்சியம், ஒரு தத்துவ நம்பிக்கை, ஒரு விளையாட்டு அல்லது போட்டிக் கனவு — குரு தசையில் படிகமாகிறது.",
        navigate: "குருவின் தாராளத்தன்மை இளம் விசாகத்தில் ஒரு அளவு நீதிமான் தன்மையை — தன் சொந்த சரி மீதான நிச்சயத்தை — உருவாக்கலாம்; அது பயன்படுத்தப்படும் தரத்தால் தாம் மதிப்பிடப்படுவதாக உணரும் சகாக்களையும் ஆசிரியர்களையும் அந்நியப்படுத்தும். விசாகத்தின் கொடையான இந்திர-அக்னி நெருப்பு, உரசலாக அல்லாமல் பயனுள்ளதாகச் செலுத்தப்பட குருவின் ஞான அரவணைப்பு தேவை. இந்த தசையை நிறைவு செய்யும் குரு–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) இறுதியில் தெளிவு தரும் ஆரம்பகால அடையாளக் குலைவையோ தத்துவ நெருக்கடியையோ கொண்டுவரலாம்.",
        focus: "வியாழக்கிழமை பிருஹஸ்பதி வழிபாடும், நெறி, தத்துவ, உத்தி சிந்தனைக்கான ஆரம்பகால வெளிப்பாடும் — சிறந்த தலைவர்களின் கதைகள், சமய, தத்துவ நூல்கள், குறிப்பிடத்தக்க இலக்குகளை அடைந்தவர்களின் வாழ்க்கை வரலாற்று ஆய்வு. குரு தசையில் விசாகம் நிர்ணயிக்கும் இலக்கு பொதுவாக வாழ்வின் மீதமுள்ள காலத்தின் ஒழுங்கமைக்கும் கொள்கையாகிறது; அதை உருவாக்கும் சூழல் தகுதியானது என்பதை உறுதிசெய்யுங்கள்.",
      },
      {
        expect: "சனி தசை விசாகத்தின் இலக்கு-உறுதியின் மாபெரும் சோதனை; பாதத்தைப் பொறுத்து வெவ்வேறு பருவங்களில் வருகிறது — பிந்தைய பாதங்களில் குழந்தைப் பருவம் முதல் பள்ளி, கல்லூரி ஆண்டுகள் வரை, முதல் பாதத்தில் வளரிளம் பருவத்திலிருந்து இளம் வயது வந்த காலத்தின் நடுப்பகுதி வரை. குரு தசையில் நிர்ணயிக்கப்பட்ட இலட்சியம் இப்போது யதார்த்தத்தைச் சந்திக்கிறது — திட்டமிட்டதாக உண்மையில் மாறுவதற்கான நீண்ட, கோரும், சில நேரம் ஊக்கமிழக்கச் செய்யும் உழைப்பு. உயர் கல்வி அல்லது தொழில்முறைப் பயிற்சி; முதல் தொழில் அடிகள்; இந்த தசைக்குள் வருமானால் திருமணமும் குடும்ப அமைவும் (சுக்கிரனையும் ஜாதகத்தின் ஏழாம் வீட்டையும் கொண்டு பார்க்கப்படுகிறது); திசையை உறுதிப்படுத்தும் முதல் குறிப்பிடத்தக்க சாதனை — அனைத்தும் சனியின் நீண்ட காலம் வழியாகச் செல்கின்றன. சனி தசையில் விசாகம் தன் இலக்கு-உறுதி உண்மையானதா அல்லது இளமையின் உற்சாகம் மட்டுமா என்பதைக் கண்டுபிடிக்கிறது. பெரும்பாலோருக்கு அது உண்மையானது; சனியின் கோரிக்கைகள் அதை எஃகாகப் பதம் செய்கின்றன.",
        navigate: "விசாகத்திற்கு சனியின் முதன்மைச் சோதனை முன்னேற்றத்தின் வேகத்தில் பொறுமை. இந்திர-அக்னியின் நெருப்பு இலக்கை இப்போதே விரும்புகிறது; சனி முழுப் பயணத்தையும் வலியுறுத்துகிறது. அதனால் எழும் விரக்தி — வாய்ப்பால் இன்னும் ஈடுசெய்யப்படாத திறமை, சூழலை முந்தும் இலட்சியம் — சனியின் போதனை. சனி–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மிகவும் கோரும் துணைக் காலம்; தொழில் தேக்கம், உறவு அழுத்தம், மதிப்பு மோதல்கள் எல்லாம் ஒரே நேரத்தில் உச்சமடையலாம்.",
        focus: "சனிக்கிழமை சனி வழிபாடும், பொறுமையை வேண்டுமென்றே வளர்ப்பதும். துலா பாத விசாகத்துக்கு சனி–சுக்கிர புக்தியைக் கவனிக்கவும்: ராசி அதிபதி சுக்கிரன் சனியின் கோரிக்கைகளின் நடுவே உறவு, அழகியல், வணிகச் சாதனையின் சாளரத்தைக் கொண்டுவருகிறார். விருச்சிக பாதத்துக்கு சனி–செவ்வாய் புக்தியைக் கவனிக்கவும்: ராசி அதிபதி செவ்வாய் தீவிர உந்துதல், உறுதியான திருப்புமுனையின் காலத்தைக் கொண்டுவருகிறார். ஒவ்வொன்றும் எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில். இந்திர-அக்னியின் நெருப்பு சனி தசையில் எஃகாகக் கட்டப்படுகிறது.",
      },
      {
        expect: "புதன் தசை விசாகத்தின் பகுப்பாய்வு, தொடர்பு நுண்ணறிவை இலக்கின் முழுச் சேவையில் கொண்டுவருகிறது; வளரிளம் பருவத்தின் முடிவிலிருந்து ஆரம்பப் பணி ஆண்டுகள் வரை எங்கும் தொடங்கி வயது வந்த வாழ்வின் கட்டுமான ஆண்டுகள் வழியாகச் செல்கிறது. உத்தி மனம் — அமைப்புகளைப் புரிந்துகொள்ளும், ஆதார முனைகளைக் கண்டறியும், இலக்கை மற்றவர்களை அதில் சேர்க்கும் விதத்தில் தெரிவிக்கும் ஆற்றல் — தன் உச்ச வெளிப்பாட்டை அடைகிறது. தொழில் கணிசமாக முன்னேறுகிறது; தலைமை அங்கீகாரம் வருகிறது; குரு தசையிலிருந்து விசாகம் கட்டிவந்த சமூக, தொழில்முறை வலைப்பின்னல் இப்போது முதன்மை இலக்கை நோக்கி முன்னேற்றத்தை வேகப்படுத்தப் போதுமான திரள் எடையைக் கொண்டுள்ளது. அரசியல், சட்டம், ஆராய்ச்சி அல்லது தலைமைப் பங்குகளில் உள்ளவர்களுக்கு, வாழ்வின் மிக முக்கியமான தொழில்முறைப் பங்களிப்புகள் பொதுவாக புதன் தசையில் வருகின்றன.",
        navigate: "விசாகத்திற்கு புதனின் முதன்மைச் சவால் இலக்கு அல்ல, முறை — முற்றிலும் உத்தி சார்ந்தவராகி, மனிதர்களை அவர்கள் இலக்குகளாக அல்லாமல் நோக்கங்களை அடையும் கருவிகளாக நடத்தும் அபாயம். புதனின் பகுத்தறிவு குருவின் அரவணைப்புடன் சமன் செய்யப்படாவிட்டால், இலக்குக்குச் சேவை செய்யும் தீவிரம் உறவுகளையும் கூட்டணிகளையும் அரிக்கலாம். உடல் கவலைகள்: நரம்பு மண்டலம், சுவாசம், நீடித்த இலட்சியக் கவனம் உருவாக்கும் பதற்றம் தொடர்பான நிலைகள்.",
        focus: "புதன்கிழமை வழிபாடும், உத்திப் பணியுடன் வேண்டுமென்ற உறவு முதலீடும். துலா பாத விசாகத்துக்கு புதன்–சுக்கிர புக்தியைக் கவனிக்கவும் (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்): ராசி அதிபதி சுக்கிரன் இந்த தசைக்குள் குறிப்பிடத்தக்க உறவு, வணிகச் சாளரத்தைக் கொண்டுவருகிறார்.",
      },
      {
        expect: "கேது தசை விசாகத்தின் அம்பை உள்நோக்கித் திருப்புகிறது. வாழ்வை ஒழுங்கமைத்த வெளிப்புற இலக்குகள் அடையப்பட்டவை, கைவிடப்பட்டவை, அல்லது மாற்றப்பட்டவை; எது நீடித்த முயற்சிக்குத் தகுதியானது, எது அல்ல என்ற நேர்மையான கணக்கை கேது கோருகிறது. இலக்கைத் தொடரும் அவசரத்தால் தள்ளிப்போடப்பட்ட ஆன்மீக ஆழம் அசாதாரண வலிமையுடன் மேலெழுகிறது. பல விசாகங்களுக்கு, குரு முதலில் எழுப்பிய தத்துவப் பசி இறுதியாக எப்போதும் தகுதியான நீடித்த கவனத்தைப் பெறும் காலம் கேது தசை.",
        navigate: "வெளிப்புறச் சாதனையைச் சுற்றி அடையாளம் முழுவதும் ஒழுங்கமைந்த நபருக்கு கேதுவின் உள்நோக்கிய கோரிக்கை ஆழ்ந்த திசைமாறிய உணர்வைத் தரலாம். பல தசகங்களாக இலக்கை நோக்கி எரிந்த நெருப்பு வெறுமனே அணைவதில்லை; அது விசாரணை, பயிற்சி, இறுதித் தேடலின் நெருப்பாக மாறுகிறது. உடல் கவலைகள்: நரம்பு மண்டலம், தன்னெதிர்ப்பு பாதிப்புகள், பல தசகங்கள் நீடித்த தீவிர முயற்சியின் உடல் விலை.",
        focus: "கேது சன்னதி வழிபாடு, பித்ரு தர்ப்பணம், நீடித்த தியானம், மிக ஆழமான தத்துவ ஆய்வு — உபநிஷதங்கள், வேதாந்தம், சைவ அல்லது வைணவ நூல்கள். இறுதி இலக்கை நோக்கிய அம்பு, விசாகத்துக்கு கேதுவின் வரையறுக்கும் ஆன்மீக உருவகம்.",
      },
      {
        expect: "பிற்கால வாழ்வில் வரும் சுக்கிர தசை துலா-பாத விசாகத்திற்கு ராசி அதிபதியின் வருகை. சுக்கிரன் உங்கள் ராசியான துலாவின் அதிபதி — இது துலாவில் பிறந்த விசாக நேயர்களுக்கு இரட்டை வலிமையுடன் வருகிறது. துலாவின் சுக்கிரன் தரும் அழகு, உறவு அரவணைப்பு, அழகியல் செழிப்பு இப்போது முந்தைய தசகங்களை வரையறுத்த இலக்கு-அவசரம் இல்லாமல் பாய்கின்றன. தொழில் மரபு நிறுவப்பட்டுள்ளது; பேரக்குழந்தைகள் வருகிறார்கள்; அடையப்பட்ட வாழ்வு உந்தப்படாமல் அனுபவிக்கப்படுகிறது. படைப்பு வெளிப்பாடு — இசை, கலை, தோட்டம், எழுத்து — சாதனை தரும் சுதந்திரத்துடன் மீண்டும் எழுகிறது. விருச்சிக-பாத விசாகத்துக்கு, சுக்கிர தசை நீண்ட அழகியல், உறவுச் செழிப்பின் காலத்தைக் கொண்டுவருகிறது. சுக்கிர–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) விசாகத்தின் இரண்டு மிக இயல்பாக இணைந்த கிரக ஆற்றல்களை இணைக்கிறது.",
        navigate: "வாழ்வின் இந்த கட்டத்தில் சுக்கிரனின் ஆரோக்ய கவலைகள் இதயம்-இரத்தக் குழாய், சிறுநீரக செயல்பாடு, ஹார்மோன். முந்தைய தசகங்களில் விசாகத்தை வரையறுத்த தீவிரம் சுக்கிர தசையில் வேண்டுமென்று விடுவிக்கப்பட வேண்டும் — நெருப்பு எரிக்காமல் வெப்பப்படுத்த அனுமதிக்கப்படுகிறது. சுக்கிர–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) கவனமான வேகத்தைக் கோருகிறது.",
        focus: "வெள்ளிக்கிழமை லட்சுமி வழிபாடு, ரோஜா, மல்லிகை அர்ப்பணம், இசை, இயற்கை அழகு. ஒரு வாழ்நாள் அம்பை நோக்கிச் செலுத்திய உறுதி இப்போது தான் உருவாக்கிய நிலப்பரப்பில் வெறுமனே ஓய்வெடுக்கிறது.",
      },
      {
        expect: "முதிர்ந்த வயதில் வரும் சூரிய தசை ஒளிரும் அங்கீகாரத்தின் இறுதித் தரத்தைக் கொண்டுவருகிறது — ஒரு வாழ்நாள் தொடரப்பட்ட இலக்குகள் விசாகத்தாலும் அந்தத் தொடர்ச்சியைக் கண்டவர்களாலும் தெளிவாகக் காணப்பட்டு அங்கீகரிக்கப்படுகின்றன. இந்திர-அக்னி நெருப்பு தூய சூரிய அரவணைப்பில் நிலைகொள்கிறது: இலக்கை அடைந்தவரின் அதிகாரம்.",
        navigate: "இதயம் மற்றும் பொது உயிர்சக்தியில் உடல் கவனம். சூரியன் தசையின் அங்கீகாரம் உடல் பராமரிப்பை விட சாதனை வேகத்தை மீண்டும் தூண்டக்கூடாது.",
        focus: "ஞாயிற்றுக்கிழமை சூரிய வழிபாடு மற்றும் ஆதித்ய ஹ்ருதயம் பாராயணம். இந்திரனின் வில்லாளி ஒளியில் ஓய்கிறார்.",
      },
      {
        expect: "மிக முதிர்ந்த வயதில் வரும் சந்திர தசை அலை நிறைவைக் கொண்டுவருகிறது — விசாகத்தின் வாழ்க்கை நெருப்பு எப்போதும் பாய்ந்துகொண்டிருந்த உணர்வுக் கடல். பேரக்குழந்தைகளும் கொள்ளுப் பேரக்குழந்தைகளும் இந்த நபரின் மிக முழுமையாக இருக்கும் வடிவைப் பெறுகிறார்கள். ஒரு வாழ்நாள் ஆன்மீகப் பசி சந்திரனின் கடல் உணர்வில் தீர்கிறது.",
        navigate: "இந்த வயதில், உடல் பராமரிப்பு முதன்மை. சந்திர தசை நிலையான, அன்பான மனித இருப்பின் தேவையை அதிகரிக்கிறது.",
        focus: "திங்கட்கிழமை சந்திர வழிபாடு, நீர் அர்ப்பணம், வெள்ளை பூக்கள். விசாகத்தின் தொடர்ந்த நேர்மையான அன்பின் பலனாளர்களான நபர்களின் நிறுவனம்.",
      },
      {
        expect: "இந்த வரிசையின் கடைசி தசையான செவ்வாய் தசை விருச்சிக-பாத விசாகத்திற்கு ராசி அதிபதியின் வருகை. செவ்வாய் உங்கள் ராசியான விருச்சிகத்தின் அதிபதி — இது விருச்சிகத்தில் பிறந்த விசாக நேயர்களுக்கு இரட்டை வலிமையுடன் வருகிறது. இந்த நபரின் முழு வாழ்வையும் வரையறுத்த நெருப்பு அதன் தூய வடிவில் திரும்புகிறது — இளமையின் இலட்சிய உந்துதல் அல்ல, ஒரு மாபெரும் பயணத்தை நிறைவு செய்தவரின் தெளிவுபடுத்தப்பட்ட, அத்தியாவசிய மன உறுதி. துலா-பாத விசாகத்துக்கு இந்த தீவிர வயதில் செவ்வாய் தசை தீர்க்கமான இருப்பின் இறுதித் தரத்தைக் கொண்டுவருகிறது.",
        navigate: "முழுமையான உடல் பராமரிப்பு. இந்த வயதில் செவ்வாய் ஆற்றல் அல்ல, மன உறுதி; வலிமை அல்ல, தெளிவு. ஒரு மாபெரும் இலக்கை மாபெரும் நெருப்புடன் தொடர்ந்தவருக்குச் சேர வேண்டிய மரியாதையுடன் இந்த நபரின் கடைசி ஆண்டுகளை நடத்துங்கள்.",
        focus: "செவ்வாய்க்கிழமை செவ்வாய் சன்னதி வழிபாடு, சிவப்பு அர்ப்பணம், இந்த நபர் செய்த பயணத்தின் பெருமையைப் புரிந்தவர்களின் இருப்பு. அம்பு தன் குறியைக் கண்டுவிட்டது.",
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
  return <NatchathiramVisualContent data={VISHAKHA} visual={VISHAKHA_VISUAL} timings={dasaTimingsFor(VISHAKHA.number)} />;
}
