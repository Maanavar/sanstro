import type { Metadata } from "next";
import { ASHWINI } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

export const metadata: Metadata = {
  title: "Aswini Nakshathiram — Visual Profile | Vinaadi",
  description: "Visual profile of Aswini Nakshathiram: personality traits, career strengths, dasha timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/ashwini/visual" },
  openGraph: {
    title: "Aswini Nakshathiram — Visual Profile",
    description: "Visual profile of Aswini Nakshathiram: personality traits, career strengths, dasha timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/ashwini/visual",
    type: "article",
  },
};

// ── Visual data for Ashwini ────────────────────────────────────────────────
// Scores derived from the qualitative descriptions in natchathiram-data-en.ts.
// Update when content changes.

const ASHWINI_VISUAL: NatchathiramVisualData = {
  // "At a Glance" — shown in the hero card
  atAGlance: [
    { label: "Self-Learning",   score: 92 },
    { label: "Spirituality",    score: 88 },
    { label: "Technical Skill", score: 85 },
    { label: "Healing Impulse", score: 82 },
    { label: "Emotional Depth", score: 75 },
  ],

  // Radar / spider chart (6 axes)
  radar: {
    labels: ["Spirituality", "Curiosity", "Technical", "Healing", "Independence", "Leadership"],
    values: [88, 90, 85, 82, 87, 70],
  },

  // Core Strengths with unicode symbol, bar score, and short description
  coreStrengths: [
    { symbol: "◎", label: "Curiosity & Research",  score: 90, desc: "Naturally asks 'What does this mean?' — drawn to deeper truths." },
    { symbol: "◈", label: "Self-Learning",          score: 92, desc: "Masters new skills independently without waiting for a teacher." },
    { symbol: "⚙", label: "Technical Excellence",  score: 85, desc: "Strong aptitude for computers, engineering, and mathematics." },
    { symbol: "✚", label: "Healing Impulse",        score: 82, desc: "Inherited from the Ashwini Kumaras — divine physicians of the gods." },
    { symbol: "△", label: "Manual Dexterity",       score: 80, desc: "Gifted hands — surgery, sculpture, kolam, code, and craft." },
    { symbol: "☽", label: "Spiritual Depth",        score: 88, desc: "Ketu's child — wisdom and liberation run through the lineage." },
  ],

  // Career ability bars
  careerAbilities: [
    { label: "Technology / Engineering", score: 92 },
    { label: "Medicine & Healing",       score: 88 },
    { label: "Research & Science",       score: 85 },
    { label: "Arts & Manual Crafts",     score: 80 },
    { label: "Public Service",           score: 72 },
  ],
  careerNote: "Excels where self-learning, healing, and technical depth meet — roles that reward curiosity and hands-on mastery.",

  // Career cluster cards (symbol + title + short desc)
  careerClusters: [
    { symbol: "⚙", title: "Technology & Engineering",  desc: "Software, hardware, architecture, mathematics." },
    { symbol: "✚", title: "Medicine & Healing",         desc: "Doctor, pharmacist, naturopath, Siddha medicine." },
    { symbol: "◎", title: "Research & Science",         desc: "Data science, independent research, investigation." },
    { symbol: "◈", title: "Arts & Crafts",              desc: "Design, sculpture, embroidery, digital illustration." },
    { symbol: "△", title: "Education & Coaching",       desc: "Online educator, content creator, life coach." },
    { symbol: "☽", title: "Spirituality & Wellness",    desc: "Mindfulness, siddha tradition, spiritual guidance." },
  ],

  // Modern application cards
  modernApps: [
    { symbol: "◈", title: "Self-taught Developer",     desc: "YouTube, Coursera & Udemy suit this star perfectly." },
    { symbol: "✚", title: "Health Tech & Med Devices", desc: "AI diagnostics, telemedicine, bioinformatics." },
    { symbol: "◎", title: "Data Science & ML",         desc: "Pattern recognition, research, and analytics roles." },
    { symbol: "△", title: "UI/UX & Digital Art",       desc: "3D modeling, motion graphics, digital illustration." },
    { symbol: "☽", title: "Wellness & Mindfulness",    desc: "Apps, podcasting, spiritual content, life coaching." },
    { symbol: "◉", title: "Online Education",          desc: "Independent courses, tutorials, content creation." },
  ],

  // Dasha timeline — Ashwini born in Ketu dasha (Vimshottari order)
  // Ages are from birth assuming full dasha balance; actual first dasha is usually shorter.
  dashaTimeline: [
    {
      planet: "Ketu", period: "7 yrs", ageRange: "Age 0–7", theme: "The Soul's First Print",
      detail: {
        expect: "Born under Ketu, Ashwini children carry the mark of a refined soul. The first years often include at least one notable health challenge — fever, respiratory trouble, or a mysterious illness that resolves faster than the doctor expects. This child tends toward quietness, drawn to elders over peers, and may display premature wisdom that unsettles adults. Academic entry (ages 5–7) starts slowly — not from lack of ability, but because Ketu's children learn through inner absorption, not repetition. One grandparent or elderly relative typically becomes a spiritual anchor. Most born in Ashwini will not experience the full 7 years — the balance depends on exact birth position.",
        navigate: "Monitor for recurrent fevers, skin conditions, or unexplained crying in infancy — do not miss vaccination schedules. At the family level, Ketu dasha at birth often coincides with a household disruption: a financial setback, a parent's absence, or a move. This is ancestral karma clearing, not punishment. If pitru dosha is present in the family chart, it surfaces now. Unusual behavioral patterns in the child — night fears, sensitivity to unseen presences — are spiritual awareness, not illness.",
        focus: "Naming ceremony (namakaranam) near a Ketu shrine provides lifelong protection. Saturday oil baths, pitru tharpanam by the family, and black sesame offerings at a Perumal temple guard the child's health. If the child shows unusual spiritual sensitivity, channel it with a home pooja — do not suppress it. Visiting Keezhaperumpallam (the primary Ketu talam) at least once in this period is highly beneficial for the entire family.",
      },
    },
    {
      planet: "Venus", period: "20 yrs", ageRange: "Age 7–27", theme: "The Golden Stretch",
      detail: {
        expect: "The longest and most consequential dasha in Ashwini's life — 20 years spanning everything from classroom to career to courtship. In school years (7–14) friendships come naturally, talents in arts, music, sport, or design surface, and confidence builds steadily. College years (17–22) bring Ashwini into full social bloom — charm, romance, and often a serious relationship that transforms the person. Marriage is most likely in the Venus–Moon or Venus–Jupiter antardasha window, typically between ages 21 and 26. Career in medicine, technology, or creative fields establishes. First savings or property gesture may happen before this dasha closes.",
        navigate: "Venus rules both the lagna and 6th house for Aries ascendant — its gifts come wrapped in subtle tests. Venus–Rahu antardasha (roughly ages 20–22) carries the highest risk: a relationship that appears ideal may conceal instability, or a career shortcut may compromise long-term integrity. Reproductive health, kidney function, and hormonal balance should not be ignored. Do not let Venus's abundance breed complacency — financial discipline formed now determines comfort in every dasha that follows.",
        focus: "Friday worship of Goddess Lakshmi or Parvati, wearing white or rose tones on Fridays, and respecting women without exception activates Venus fully. Use this dasha to complete education, acquire skills, make the foundational life decisions — career direction, life partner, home base. Do not defer marriage indefinitely past Venus dasha without strong reason; subsequent dashas lack its matchmaking grace. Also watch the Venus–Mars antardasha within this dasha (the 4th sub-period, lasting about 14 months, arriving roughly in the 7th year of Venus dasha) — Mars as your rasi lord makes this the first powerful assertion of your Mesha identity. Physical competitiveness, early independence from parents, and the first spark of 'I will do this myself' tend to surface sharply here.",
      },
    },
    {
      planet: "Sun", period: "6 yrs", ageRange: "Age 27–33", theme: "Career Crystallises",
      detail: {
        expect: "A compact but pivotal 6-year window. Career trajectory sharpens — a first major promotion, a government connection, or a senior mentor relationship defines this period. The person's professional identity becomes unmistakable. In medicine or research, a specialization credential arrives. In technology or engineering, the first leadership role crystallizes. Government sectors, corporate hierarchies, and institutional bodies strongly favor Ashwini here. Self-confidence peaks and the person commands a room in a way their 20s never allowed.",
        navigate: "Sun amplifies Ashwini's natural confidence into occasional arrogance — choose battles with superiors with great care. One ego-driven confrontation can derail years of carefully built reputation. Father's health deserves proactive attention; cardiac screening is advisable if family history warrants it. Eye strain from screens and overwork accumulates silently. The 6-year window closes fast — do not waste it in unnecessary conflict.",
        focus: "Daily recitation of Aditya Hridayam, offering water to the rising sun, and actively seeking one government contact or institutional recognition yields measurable return. If a government examination, tender, or institutional credential is within reach — pursue it now. This is the narrowest window in the entire 120-year cycle for such access, and it does not repeat.",
      },
    },
    {
      planet: "Moon", period: "10 yrs", ageRange: "Age 33–43", theme: "Family, Public & Travel",
      detail: {
        expect: "Moon dasha in the mid-thirties finds Ashwini managing a full life — career, family, and community simultaneously. Children (if married in Venus dasha) are now school-age; the emotional investment in family deepens. Business dealing with the public — food, healthcare, real estate, education, or hospitality — gains natural momentum. Relocation to a new city, or significant travel for work, is common. A second child or major family transition (elderly parent, adoption) frequently occurs. Public recognition in professional circles builds steadily.",
        navigate: "Moon dasha brings emotional tides that can catch even steady Ashwini off guard. Moon–Rahu antardasha (roughly ages 38–40) is the most unstable sub-period — decisions made impulsively here often require years of correction. Mother's health requires close monitoring, particularly in this window. Sleep disturbances and anxiety during low phases (especially around new and full moons) are Moon's signal, not a medical disorder. Do not mistake restlessness for dissatisfaction and make unnecessary career pivots mid-dasha.",
        focus: "Monday worship, Ekadasi and Chaturdasi fasting, and daily water offerings to ancestors stabilize Moon dasha's undertow. This is the single best dasha for Ashwini to build a public-facing business, invest in relationships, and lay roots that will sustain the second half of life. What you nurture here — people, health, and emotional intelligence — returns double in Jupiter dasha. Also note: Moon–Mars antardasha arrives early in Moon dasha (the 2nd sub-period, lasting 7 months, beginning roughly 10 months after Moon dasha starts). Brief as it is, Mars as your rasi lord makes this a disproportionately high-energy window — property decisions, bold moves, and physical action carry unusual force here. Do not miss this sub-period window for any pending real-estate or land action.",
      },
    },
    {
      planet: "Mars", period: "7 yrs", ageRange: "Age 43–50", theme: "Property & Power",
      detail: {
        expect: "Mars dasha arrives when Ashwini is at the height of practical authority. Critically, Mars is the lord of your rasi, Mesha — this makes his dasha doubly charged for Ashwini natives. Where other nakshathirams experience Mars dasha as one planetary period among nine, for Ashwini it is the rasi lord himself taking the wheel. Every Martian theme is amplified: the property instinct is stronger, the physical authority more pronounced, the urge to build permanent legacy reaches its lifetime peak. This is the traditional 'buy your land' dasha in Tamil astrology — property acquisition, construction, vehicle purchase, and major real estate decisions are all strongly favored. Sibling relationships — dormant for years — become active, either as business allies or as sources of friction. Physical energy remains high even as the body needs more deliberate care.",
        navigate: "Mars dasha carries the highest accident and surgical risk in Ashwini's cycle — ages 43–50 in men particularly call for cardiac and blood pressure awareness. Avoid risky physical activities or hasty decisions in Mars–Rahu antardasha (approximately ages 44–45). Legal disputes initiated during Mars dasha almost always drain more than they return — negotiate instead of litigate. Anger is Mars's principal weapon against your own interests; every impulsive outburst carries disproportionate consequence here.",
        focus: "Tuesday worship at Murugan or Hanuman temples, offering red flowers, and chanting Karthikeya Shashthi Kavacham disciplines Mars's fire. If property purchase was deferred from Venus dasha — this is the final favorable window. Fixed assets, not financial instruments, are the right investment here. Channel urgency into building, not confrontation.",
      },
    },
    {
      planet: "Rahu", period: "18 yrs", ageRange: "Age 50–68", theme: "The Great Reshaping",
      detail: {
        expect: "No dasha reshapes Ashwini more completely than Rahu's 18-year arc. Everything accelerates, complicates, and eventually clarifies. Foreign connections intensify — a child settles abroad, business expands internationally, or technology opens doors conventional training never anticipated. For those with strong technical inclination, Rahu dasha can deliver the most financially significant breakthrough of the entire life — through unconventional routes. The first half (ages 50–59) is turbulent: status fluctuations, reputation pressures, identity confusion. The second half (ages 59–68) stabilizes as Rahu matures and the person adapts.",
        navigate: "Rahu's greatest weapon against Ashwini is the illusion of a shortcut. Any investment, deal, or alliance that appears unusually promising demands exceptional scrutiny — especially if foreign or technology-driven. Rahu–Jupiter antardasha (approximately ages 57–60) is specifically sensitive; no irreversible financial or legal decision should be finalized during exact transit conjunctions. Health: nervous system, skin, and respiratory conditions surface under Rahu. A period of spiritual doubt is normal — remain rooted without becoming rigid.",
        focus: "Saturday prayers at a Rahu shrine, coconut and black sesame offerings, and Durga ashtami worship provide essential grounding. At the dasha's start (age 50), consult an experienced jyotishi for a full antardasha roadmap — 18 years is too long and too complex to navigate without a map. Rahu rewards Ashwini's research instincts and adaptability above all; the unconventional path is frequently the correct one.",
      },
    },
    {
      planet: "Jupiter", period: "16 yrs", ageRange: "Age 68–84", theme: "The Harvest",
      detail: {
        expect: "Jupiter dasha in the final decades is the harvest — the quiet, dignified return on a lifetime of dharmic living. Grandchildren bring a joy that no earlier dasha prepared you for. Teaching, writing, and mentoring roles become effortless; accumulated wisdom finally finds an audience ready to receive it. Long-standing investments, properties, and businesses begun in Venus and Mars dashas often produce their most stable returns here. Pilgrimage travel, scriptural study, and charitable activity become genuine pleasure rather than obligation. The body, while aging, tends to remain more resilient than feared when Jupiter is well-placed.",
        navigate: "The trap of Jupiter dasha is complacency born of blessing — believing all decisions are automatically right because things have generally gone well. Health: liver, pancreas, and weight management require ongoing attention. Relationship with adult children and grandchildren deserves careful stewardship — Jupiter dasha is not only personal harvest, it is the period in which your legacy is shaped in the minds of those who will carry it forward.",
        focus: "Thursday worship of Dakshinamurthy, unconditional generosity in time, knowledge, and wealth, and making space for wisdom of both elders and juniors is the deepest remedy for Jupiter dasha. Write down what you have learned. Teach openly. Guru Pushyami days — when Pushya nakshatra falls on Thursday — are extraordinarily auspicious for any significant initiative. This is the final expansive dasha; enter it fully conscious.",
      },
    },
    {
      planet: "Saturn", period: "19 yrs", ageRange: "Age 84–103", theme: "Completion & Legacy",
      detail: {
        expect: "Saturn dasha in advanced age is experienced in full measure by few, but those who reach it carry the weight of a complete life. For Ashwini, Saturn rules the 10th house (career legacy) and 11th house (gains and fulfillment) from Aries — making this dasha one of final recognition and karmic completion. Institutional honors, community respect, and family legacy acknowledgment arrive quietly but distinctly. Daily routine becomes not obligation but medicine. Family support from children and grandchildren flows naturally to those who invested in relationships in earlier dashas.",
        navigate: "Saturn accepts no shortcuts and permits no delays. Physical dependence on others, encountered with grace rather than resistance, brings deep peace. The body's requirements are specific and non-negotiable — regular meals, movement within capacity, adequate rest, and avoidance of cold. Rigidity of thought or refusal to release past roles accelerates decline. Any unresolved family disputes that remain should be addressed with urgency — Saturn's dasha does not wait for perfect timing.",
        focus: "Saturday oil bath, Shani worship, and service to elders and the disabled — even as a recipient of such service — completes the karmic circuit. Final obligations such as pending family events, pitru karma, and donations to trusted causes are the last great spiritual investments available. A life lived with honesty and dharma in earlier dashas makes Saturn dasha serene. This is not an ending — it is Ketu's echo, the completion of the same circle that Ashwini began.",
      },
    },
  ],

  // Spirituality cards
  spirituality: [
    {
      title: "Ganesha Worship",
      desc: "Yugala Vinayaka (twin Ganesha) brings swift blessings. Especially beneficial during career challenges, debt, and difficult periods.",
    },
    {
      title: "Siddha Shrine Visits",
      desc: "Jeevasamadhis of great masters and siddha temples bring quick mental peace and clarity.",
    },
    {
      title: "Ancestral Duties",
      desc: "Fulfilling pitru karma and respecting elders is non-negotiable — ancestral blessings unlock steady progress.",
    },
  ],

  // Key guidance quote (from summary section of natchathiram-data-en.ts)
  guidance: "Your self-learning nature is your greatest gift. Master technology and medicine, honor your elders without fail, walk the spiritual path — and Ashwini's remarkable potential will fully unfold.",

  compatibleEn: ["Bharani", "Rohini", "Ardra", "Pushya", "Ashlesha", "Purva Phalguni"],
  compatibleNote: "These nakshatras complement Ashwini's curiosity, independence, and spiritual depth for meaningful bonds.",

  // ── Tamil translations ─────────────────────────────────────────────────
  ta: {
    atAGlanceLabels: ["சுய கற்றல்", "ஆன்மீகம்", "தொழில்நுட்ப திறன்", "குணப்படுத்தும் ஆர்வம்", "உணர்வு ஆழம்"],
    radarLabels:     ["ஆன்மீகம்", "ஆர்வம்", "தொழில்நுட்பம்", "சிகிச்சை", "சுதந்திரம்", "தலைமை"],
    coreStrengths: [
      { label: "ஆர்வம் & ஆராய்ச்சி",  desc: "இது என்ன என்று இயல்பாகவே கேட்கிறார்கள் — ஆழமான உண்மைகளை நோக்கி ஈர்க்கப்படுகிறார்கள்." },
      { label: "சுய கற்றல்",            desc: "ஆசிரியர் இல்லாமல் சுதந்திரமாக புதிய திறன்களை கற்றுக்கொள்கிறார்கள்." },
      { label: "தொழில்நுட்ப சிறப்பு",  desc: "கணினி, பொறியியல் மற்றும் கணிதத்தில் வலுவான திறன்." },
      { label: "குணப்படுத்தும் ஆர்வம்", desc: "அஸ்வினி குமாரர்களிடம் இருந்து கிடைத்தது — தெய்வீக வைத்தியர்களின் மரபு." },
      { label: "கைத்திறன்",             desc: "வல்லமையான கைகள் — அறுவை சிகிச்சை, சிற்பம், கோலம், குறியீடு மற்றும் கைவினை." },
      { label: "ஆன்மீக ஆழம்",           desc: "கேதுவின் பிள்ளை — ஞானமும் விடுதலையும் வம்சாவளியில் ஓடுகின்றன." },
    ],
    careerAbilityLabels: ["தொழில்நுட்பம் / பொறியியல்", "மருத்துவம் & குணப்படுத்தல்", "ஆராய்ச்சி & அறிவியல்", "கலை & கைவினை", "பொது சேவை"],
    careerClusters: [
      { title: "தொழில்நுட்பம் & பொறியியல்", desc: "மென்பொருள், வன்பொருள், கட்டமைப்பு, கணிதம்." },
      { title: "மருத்துவம் & குணப்படுத்தல்", desc: "மருத்துவர், மருந்தாளுவோர், நாட்டுரோபத், சித்த மருத்துவம்." },
      { title: "ஆராய்ச்சி & அறிவியல்",      desc: "தரவு அறிவியல், சுதந்திர ஆராய்ச்சி, விசாரணை." },
      { title: "கலை & கைவினை",              desc: "வடிவமைப்பு, சிற்பம், கசூரி, டிஜிட்டல் ஓவியம்." },
      { title: "கல்வி & பயிற்சி",            desc: "ஆன்லைன் ஆசிரியர், உள்ளடக்க படைப்பாளி, வாழ்க்கை பயிற்சியாளர்." },
      { title: "ஆன்மீகம் & நலன்",           desc: "மனநிறைவு, சித்த மரபு, ஆன்மீக வழிகாட்டல்." },
    ],
    modernApps: [
      { title: "சுய-கற்ற டெவலப்பர்",    desc: "YouTube, Coursera & Udemy இந்த நட்சத்திரத்திற்கு மிகவும் பொருத்தமானவை." },
      { title: "சுகாதார தொழில்நுட்பம்", desc: "AI நோயறிதல், தொலை மருத்துவம், உயிரி தகவலியல்." },
      { title: "தரவு அறிவியல் & ML",      desc: "மாதிரி அங்கீகாரம், ஆராய்ச்சி மற்றும் பகுப்பாய்வு பணிகள்." },
      { title: "UI/UX & டிஜிட்டல் கலை",  desc: "3D மாதிரியாக்கம், இயக்க வரைகலை, டிஜிட்டல் ஓவியம்." },
      { title: "நலன் & மனநிறைவு",         desc: "ஆப்கள், போட்காஸ்டிங், ஆன்மீக உள்ளடக்கம், வாழ்க்கை பயிற்சி." },
      { title: "ஆன்லைன் கல்வி",           desc: "சுதந்திர பாடநெறிகள், பயிற்சிகள், உள்ளடக்க உருவாக்கம்." },
    ],
    dashaThemes: [
      "ஆத்மாவின் முதல் முத்திரை",
      "பொன் காலம் — படிப்பு, காதல், திருமணம்",
      "தொழில் உறுதியாகும் — அங்கீகாரம், அதிகாரம்",
      "குடும்பம், பயணம், பொது சேவை",
      "சொத்து, செயல், உடல் வலிமை",
      "மாபெரும் மறுவடிவம் — வெளிநாடு, தொழில்நுட்பம்",
      "அறுவடை — ஞானம், பேரன்கள், ஆன்மீக மலர்ச்சி",
      "நிறைவு — தர்மம், மரபு, கர்ம முடிவு",
    ],
    dashaDetails: [
      {
        expect: "கேதுவின் முத்திரையுடன் பிறந்த அஸ்வினி குழந்தை உள்ளார்ந்த ஆற்றல் கொண்டது. முதல் ஆண்டுகளில் காய்ச்சல், சுவாசப் பிரச்சினை அல்லது விளக்கமுடியாத நோய் வரலாம் — ஆனால் மருத்துவர் எதிர்பார்ப்பதை விட விரைவாக குணமடையும். இந்த குழந்தை அமைதியாக இருக்கும், முதியோரை விரும்பும், வயதிற்கு மீறிய முதிர்ச்சியை காட்டும். படிப்பு ஆரம்பம் (5–7 வயது) மெதுவாக இருக்கும் — திறமை இல்லாமல் அல்ல, கேதுவின் பிள்ளைகள் உள் ஞானத்தால் கற்கிறார்கள். ஒரு தாத்தா, பாட்டி அல்லது ஆன்மீக பெரியவர் இந்த குழந்தைக்கு முக்கிய ஆதாரமாக இருப்பார்.",
        navigate: "மீண்டும் மீண்டும் வரும் காய்ச்சல், தோல் பிரச்சினை, அல்லது காரணமில்லாத அழுகை — தடுப்பூசி காலவரிசையை தவறவிடாதீர்கள். கேது தசையில் பிறந்த குழந்தையின் குடும்பத்தில் ஒரு குழப்பம் — நிதி இடர், பெற்றோரின் பிரிவு, இடம் மாற்றம் — அடிக்கடி நடக்கும். இது பூர்வஜன்ம கர்மம் தெளிவடைவதன் அறிகுறி. குழந்தையின் இரவு நேர பயம் அல்லது ஆன்மீக உணர்திறன் நோய் அல்ல — அதை அடக்காதீர்கள்.",
        focus: "கேது தலத்தில் (கீழப்பெரும்பள்ளம்) நாமகரண சடங்கு செய்வது ஆயுள் முழுவதும் பாதுகாப்பு தரும். சனிக்கிழமை எள்ளெண்ணெய் குளியல், குடும்பத்தினர் செய்யும் பித்ரு தர்ப்பணம், பெருமாள் கோயிலில் கருப்பு எள் சமர்பணம் — இவை குழந்தையின் ஆரோக்யத்தை காக்கும். குழந்தை ஆன்மீக ஆர்வம் காட்டினால் வீட்டில் பூஜை வழிமுறையில் வழிப்படுத்துங்கள்.",
      },
      {
        expect: "அஸ்வினியின் வாழ்வில் மிக நீண்ட மற்றும் மிக முக்கியமான தசை — 20 ஆண்டுகள் பள்ளி முதல் திருமணம் வரை. பள்ளி காலத்தில் (7–14 வயது) நண்பர்கள் இயல்பாக வருவார்கள், கலை, இசை, விளையாட்டு திறன் வெளிப்படும். கல்லூரி காலத்தில் (17–22 வயது) காதல் கிட்டத்தட்ட உறுதி. திருமணம் பெரும்பாலும் சுக்கிர–சந்திர அல்லது சுக்கிர–குரு அந்தர்தசையில் (21–26 வயது) நடக்கும். மருத்துவம், தொழில்நுட்பம், அல்லது படைப்புத்துறையில் தொழில் நிலைபெறும். முதல் சேமிப்பு அல்லது சொத்து முயற்சி இந்த தசை முடிவதற்குள் நடக்கலாம்.",
        navigate: "சுக்கிரன் லக்னம் மற்றும் 6ம் வீட்டை ஆட்சி செய்வதால் பரிசு உள்ளே சவாலுடன் வருகிறது. சுக்கிர–ராகு அந்தர்தசையில் (20–22 வயது) அதிக கவனம் தேவை — சிறந்தது போல் தெரியும் உறவு அல்லது தொழில் வழி நம்பகத்தன்மையை குலைக்கலாம். இனப்பெருக்க ஆரோக்யம், சிறுநீரகம், தோல் — இவற்றை புறக்கணிக்காதீர்கள். இந்த தசையின் நிதி ஒழுக்கம் எஞ்சிய அனைத்து தசைகளையும் தீர்மானிக்கும்.",
        focus: "வெள்ளிக்கிழமை லட்சுமி அல்லது பார்வதி வழிபாடு, வெண்மை அல்லது இளஞ்சிவப்பு அணிவது, பெண்களை மரியாதையுடன் நடத்துவது — இவை சுக்கிரனின் முழு ஆசீர்வாதத்தை தருகின்றன. படிப்பு முடிக்கவும், திறன்கள் வளர்க்கவும், வாழ்க்கை முடிவுகள் எடுக்கவும் இந்த தசையை பயன்படுத்துங்கள். திருமணத்தை சுக்கிர தசை கடந்து தாமதிக்காதீர்கள். சுக்கிர தசையில் சுக்கிர–செவ்வாய் அந்தர்தசையையும் கவனிக்கவும் (சுக்கிரனுக்குள் 4வது துணை காலம், சுமார் 14 மாதங்கள், சுக்கிர தசையின் 7வது ஆண்டில் வருகிறது) — செவ்வாய் உங்கள் ராசி அதிபதி என்பதால் இந்த துணை காலம் மேஷ அடையாளத்தின் முதல் வலிமையான வெளிப்பாடு. உடல் திறன் உணர்வு, பெற்றோரிடம் இருந்து சுதந்திரம், 'இதை நான் தனியாக செய்வேன்' என்ற மேஷ உந்துதல் இங்கு முதல்முறையாக தீவிரமாக வெளிப்படும்.",
      },
      {
        expect: "குறுகிய ஆனால் திட்டமான 6 ஆண்டுகள். தொழில் திசை தெளிவாகும் — முதல் பெரிய பதவி உயர்வு, அரசு தொடர்பு, அல்லது மூத்த வழிகாட்டி உறவு இந்த காலத்தை வரையறுக்கும். மருத்துவம் அல்லது ஆராய்ச்சியில் சிறப்பு சான்றிதழ் கிடைக்கும். தொழில்நுட்பத்தில் முதல் தலைமைப் பதவி தெளிவாகும். அரசு, நிறுவன தொடர்புகள் சக்திவாய்ந்ததாக மாறும். சுய நம்பிக்கை உச்சம் தொடும்.",
        navigate: "சூரியன் அஸ்வினியின் இயல்பான நம்பிக்கையை சில நேரங்களில் அகந்தையாக மாற்றும் — மேலதிகாரிகளுடன் மோதலை தவிர்க்கவும். ஒரு அகந்தை சண்டை பல ஆண்டுகளாக கட்டிய பெயரை கெடுக்கும். தந்தையின் ஆரோக்யம் — குறிப்பாக இதயம் — கவனிக்க வேண்டும். கண் நலம் மற்றும் அதிக வேலையின் தாக்கம் அமைதியாக தேங்கும்.",
        focus: "ஆதித்ய ஹ்ருதயம் தினமும் பாராயணம், உதய சூரியனுக்கு நீர் அர்ப்பணம், ஒரு அரசு தொடர்பு அல்லது நிறுவன அங்கீகாரம் நோக்கி செயலில் இறங்குவது — இவை அளவிட முடியாத பலன் தரும். அரசு தேர்வு, ஒப்பந்தம், அல்லது சான்றிதழ் வாய்ப்பு இருந்தால் இப்போதே செயல்படுங்கள் — இந்த சாளரம் 6 ஆண்டுகள் மட்டுமே.",
      },
      {
        expect: "முப்பதுகளின் நடுவில் சந்திர தசை வரும்போது அஸ்வினி வாழ்க்கை முழுவதும் — தொழில், குடும்பம், சமுதாயம் — ஒரே நேரத்தில் நடக்கும். சுக்கிர தசையில் திருமணம் ஆனவர்களுக்கு குழந்தைகள் பள்ளி வயதில் இருப்பார்கள் — குடும்ப கவலை ஆழமாகும். உணவு, சுகாதாரம், ரியல் எஸ்டேட், கல்வி தொடர்பான பொது சேவை வணிகங்கள் இயல்பாக மேம்படும். புதிய நகரம் அல்லது வெளிநாட்டிற்கு இடம் மாற்றம் பொதுவானது. இரண்டாவது குழந்தை அல்லது முக்கிய குடும்ப மாற்றம் அடிக்கடி நடக்கும்.",
        navigate: "சந்திர தசை அஸ்வினியை எதிர்பாராத உணர்வு அலைகளில் ஆட்டலாம். சந்திர–ராகு அந்தர்தசையில் (38–40 வயது) எடுக்கும் உந்துவித முடிவுகள் ஆண்டுகளாக சரிசெய்ய வேண்டியிருக்கும். தாயின் ஆரோக்யம் இந்த காலகட்டத்தில் கவனமாக கவனிக்க வேண்டும். அமாவாசை, பௌர்ணமி நேர உணர்வு ஏற்றத்தாழ்வை நோய் என்று தவறாக புரிந்துகொள்ளாதீர்கள்.",
        focus: "திங்கள் வழிபாடு, ஏகாதசி மற்றும் சதுர்தசி விரதம், முன்னோர்களுக்கு தினமும் நீர் அர்ப்பணம் — இவை சந்திரனின் உணர்வு சுழற்சியை நிலைப்படுத்தும். பொது சேவை வணிகம் தொடங்க, உறவுகளில் முதலீடு செய்ய, வாழ்வின் இரண்டாம் பாதிக்கு அடித்தளம் போட இது சிறந்த தசை. இங்கு வளர்க்கும் உறவுகள் குரு தசையில் இரட்டிப்பாக திரும்பும். கவனிக்கவும்: சந்திர–செவ்வாய் அந்தர்தசை சந்திர தசையின் ஆரம்பத்திலேயே வருகிறது (2வது துணை காலம், சுமார் 7 மாதங்கள், சந்திர தசை தொடங்கி 10 மாதங்களில்). குறுகியதாக இருந்தாலும் செவ்வாய் ராசி அதிபதி என்பதால் சொத்து முடிவுகள், துணிச்சலான நகர்வுகள், உடல் செயல்களுக்கு எதிர்பாராத தீவிர ஆற்றல் தரும் — அமைதியான சந்திர தசையில் ஒரு மேஷ கணம். நிலுவையிலுள்ள சொத்து அல்லது நிலம் தொடர்பான எந்த நடவடிக்கையும் இந்த துணை காலத்தை தவறவிடாதீர்கள்.",
      },
      {
        expect: "செவ்வாய் தசை வரும்போது அஸ்வினி தன் தொழில் உச்சத்தில் இருப்பார். மிக முக்கியமான உண்மை: செவ்வாய் அஸ்வினியின் ராசியான மேஷத்தின் அதிபதி — இதனால் இந்த தசை அஸ்வினிக்கு இரட்டை வலிமையுடன் வருகிறது. மற்ற நட்சத்திரங்கள் செவ்வாய் தசையை ஒரு சாதாரண கிரக காலமாக அனுபவிக்கும்போது, அஸ்வினிக்கு இது ராசி அதிபதியே வாழ்க்கையை நேரடியாக கையில் எடுத்துக்கொள்வது. சொத்து உள்ளுணர்வு வலுவாகும், உடல் அதிகாரம் தெளிவாகும், நிரந்தர மரபை கட்டும் ஆசை ஆயுளில் உச்சம் அடைகிறது. இது தமிழ் ஜோதிடத்தில் 'நிலம் வாங்கும் தசை' — சொத்து வாங்குவது, கட்டுவது, வாகனம் வாங்குவது, ரியல் எஸ்டேட் முடிவுகள் இப்போது சாதகம். ஆண்டுகளாக அமைதியாக இருந்த சகோதர உறவுகள் — கூட்டு வணிகமாகவோ, சச்சரவாகவோ — முன்னணிக்கு வரும்.",
        navigate: "செவ்வாய் தசையில் அஸ்வினியின் வாழ்க்கையில் விபத்து, நோய், அறுவை சிகிச்சை அபாயம் அதிகம் — குறிப்பாக 43–50 வயது ஆண்களுக்கு இரத்த அழுத்தம், இதயம் கவனிக்க வேண்டும். செவ்வாய்–ராகு அந்தர்தசை (சுமார் 44–45 வயது) அதிக கவனம் தேவை. நீதிமன்ற வழக்குகள் செவ்வாய் தசையில் தொடங்கினால் ஆண்டுகளாக ஆற்றலை வடிக்கட்டும் — பேச்சுவார்த்தை சிறந்தது. கோபம் செவ்வாயின் முக்கிய ஆயுதம்.",
        focus: "செவ்வாய்க்கிழமை முருகன் அல்லது ஹனுமான் கோவிலில் வழிபாடு, சிவப்பு மலர் அர்ப்பணம், கார்த்திகேய ஷஷ்டி கவசம் பாராயணம் — செவ்வாயை கட்டுக்குள் வைக்கும். சுக்கிர தசையில் நிலம் வாங்காவிட்டால் — இதுவே கடைசி சாதகமான சாளரம். நிலையான சொத்துகளில் முதலீடு, நிதி கருவிகளில் அல்ல.",
      },
      {
        expect: "எந்த தசையும் அஸ்வினியை ராகுவின் 18 ஆண்டு பயணத்தை போல் மாற்றாது. எல்லாமே வேகமாகும், சிக்கல்படும், இறுதியில் தெளிவடையும். வெளிநாட்டு தொடர்புகள் தீவிரமடையும் — குழந்தை வெளிநாடு செல்வார், வணிகம் சர்வதேசமாகும், தொழில்நுட்பம் புதிய கதவுகள் திறக்கும். தொழில்நுட்ப நோக்குடையவர்களுக்கு, இந்த தசை முழு வாழ்வின் மிக முக்கிய நிதி திருப்புமுனையை தரலாம் — எதிர்பாராத வழியில். முதல் பாதி (50–59 வயது) கலக்கமாக இருக்கும். இரண்டாம் பாதி (59–68 வயது) நிலையாகும்.",
        navigate: "ராகுவின் முக்கிய ஆயுதம் குறுக்கு வழி மோகம். இந்த தசையில் வரும் எந்த முதலீட்டு திட்டமும், வணிக ஒப்பந்தமும் — குறிப்பாக வெளிநாட்டிலிருந்து வருவது — அசாதாரண கூர்மையுடன் ஆய்வு செய்யுங்கள். ராகு–குரு அந்தர்தசை (சுமார் 57–60 வயது) மிகவும் உணர்திறன் நிறைந்தது — திருப்புமுனை ட்ரான்ஸிட்டில் திரும்பல் முடியாத முடிவுகள் வேண்டாம். நரம்பு மண்டலம், தோல், சுவாசம் ஆகியவை ராகு காலத்தில் கவனிக்கப்பட வேண்டும்.",
        focus: "சனிக்கிழமை ராகு சன்னதியில் வழிபாடு, தேங்காய் மற்றும் கருப்பு எள் அர்ப்பணம், துர்கா அஷ்டமி வழிபாடு — அவசியம். தசை தொடங்கும்போதே (50 வயது) ஒரு அனுபவமிக்க ஜோதிடரிடம் முழு அந்தர்தசை வரைப்படம் பெறுங்கள் — 18 ஆண்டுகள் வரைப்படம் இல்லாமல் நடக்க முடியாதது. ராகு அஸ்வினியின் ஆராய்ச்சி நுண்ணறிவையும் தகவமைக்கும் திறனையும் மிக அதிகமாக வெகுமதி தருகிறது.",
      },
      {
        expect: "குரு தசை கடைசி தசைகளில் வரும்போது அது அறுவடை — ஒரு வாழ்நாள் தர்மத்துடன் வாழ்ந்ததின் அமைதியான, கண்ணியமான திரும்பல். பேரன் பேத்திகள் எந்த முந்தைய தசையும் தயார்படுத்தாத மகிழ்ச்சியை தருவார்கள். கற்பித்தல், எழுத்து, வழிகாட்டும் பணிகள் இயல்பாக வருகின்றன. சுக்கிர மற்றும் செவ்வாய் தசைகளில் தொடங்கிய சொத்துகள் மற்றும் வணிகங்கள் இப்போது மிக நிலையான வருவாயை தருகின்றன. திருத்தல பயணம், வேதாகம படிப்பு, தான தர்மம் — இவை உண்மையான இன்பமாக மாறுகின்றன.",
        navigate: "குரு தசையின் ஆபத்து — ஆசீர்வாதத்திலிருந்து பிறக்கும் அலட்சியம். எல்லா முடிவுகளும் தானாகவே சரியாக இருக்கும் என்று நம்புவது தவறு. கல்லீரல், கணையம், உடல் எடை — இவை தொடர்ந்த கவனம் தேவைப்படுகின்றன. வயது வந்த குழந்தைகள் மற்றும் பேரன் பேத்திகளுடனான உறவு கவனமாக பேணப்பட வேண்டும் — குரு தசை தனிப்பட்ட அறுவடை மட்டுமல்ல, உங்கள் மரபு எப்படி நினைவுகூரப்படும் என்பதை வடிவமைக்கும் காலம்.",
        focus: "வியாழக்கிழமை தட்சிணாமூர்த்தி வழிபாடு, நேரம், ஞானம், செல்வம் ஆகியவற்றில் நிபந்தனையற்ற தாராளம் — குரு தசையின் ஆழமான நிவாரணம். கற்றதை எழுதுங்கள். திறந்த மனதுடன் கற்பியுங்கள். குரு புஷ்யமி நாட்களில் (புஷ்ய நட்சத்திரம் வியாழக்கிழமை வரும்போது) எந்த முக்கிய முயற்சியும் அசாதாரண பலன் தரும். இந்த தசையை முழு விழிப்புடன் நுழையுங்கள்.",
      },
      {
        expect: "சனி தசை கடந்த வயதில் முழுமையாக அனுபவிப்பவர்கள் அரிது — ஆனால் அடைவோர் ஒரு முழு வாழ்வின் கர்மப் பதிவை சுமந்திருப்பார்கள். அஸ்வினிக்கு சனி 10ம் வீடு (தொழில் மரபு) மற்றும் 11ம் வீட்டை (ஆதாயம், நிறைவு) ஆட்சி செய்வதால் இது இறுதி அங்கீகாரம் மற்றும் கர்ம நிறைவின் காலம். நிறுவன கௌரவம், சமுதாய மரியாதை, குடும்ப மரபு அங்கீகாரம் — இவை அமைதியாக ஆனால் தெளிவாக வருகின்றன. தினசரி வழக்கம் மருந்தாகிறது.",
        navigate: "சனி குறுக்குவழிகளை ஏற்காது, தாமதங்களை மன்னிக்காது. மற்றவர்களை நம்பி வாழ்வது, கருணையுடன் ஏற்றுக்கொண்டால், ஆழமான அமைதியை தரும். உடலின் தேவைகள் குறிப்பிட்டவை மற்றும் மாற்ற இயலாதவை — ஒழுங்கான உணவு, திறனுக்கு ஏற்ற அசைவு, போதுமான ஓய்வு. எண்ண நெகிழ்வற்ற தன்மை அல்லது பழைய பாத்திரங்களை விட மறுப்பது உடல் வீழ்ச்சியை விரைவுபடுத்தும்.",
        focus: "சனிக்கிழமை எண்ணெய் குளியல், சனி வழிபாடு, முதியோர் மற்றும் ஊனமுற்றோருக்கு சேவை — கர்ம சுழற்சியை நிறைவு செய்கிறது. எஞ்சிய குடும்பக் கடமைகள், பித்ரு கர்மம், நம்பகமான காரணங்களுக்கு தானம் — இவை கடைசி மாபெரும் ஆன்மீக முதலீடுகள். முந்தைய தசைகளில் நேர்மையுடன் தர்மத்துடன் வாழ்ந்தவர்களுக்கு சனி தசை அமைதியானது. இது முடிவல்ல — இது கேதுவின் எதிரொலி, அஸ்வினி தொடங்கிய அதே வட்டத்தின் நிறைவு.",
      },
    ],
    spirituality: [
      { title: "கணேஷ வழிபாடு",        desc: "யுகள விநாயகர் (இரட்டை கணேஷ்) விரைவான ஆசீர்வாதங்களை தருகிறார். தொழில் சவால்கள், கடன் மற்றும் கடினமான காலங்களில் குறிப்பாக பயனுள்ளது." },
      { title: "சித்த திருத்தல வழிபாடு", desc: "மகான்களின் ஜீவசமாதிகள் மற்றும் சித்த கோயில்கள் விரைவான மன அமைதியும் தெளிவும் தருகின்றன." },
      { title: "முன்னோர் கடமைகள்",     desc: "பித்ரு கர்மத்தை நிறைவேற்றுவது மற்றும் மூத்தோரை மதிப்பது கட்டாயம் — முன்னோர்களின் ஆசீர்வாதங்கள் நிலையான முன்னேற்றத்தை திறக்கின்றன." },
    ],
    guidance: "சுய கற்றல் உங்கள் மிகப்பெரிய வரம். தொழில்நுட்பம் மற்றும் மருத்துவத்தை தேர்ச்சி பெறுங்கள், மூத்தோரை மரியாதையுடன் நடத்துங்கள், ஆன்மீக பாதையில் நடங்கள் — அப்போது அஸ்வினியின் குறிப்பிடத்தக்க திறன் முழுமையாக வெளிப்படும்.",
    compatibleNote: "இந்த நட்சத்திரங்கள் அஸ்வினியின் ஆர்வம், சுதந்திரம் மற்றும் ஆன்மீக ஆழத்தை நிரப்புகின்றன.",
    careerNote: "சுய கற்றல், குணப்படுத்தல் மற்றும் தொழில்நுட்ப ஆழம் சந்திக்கும் இடங்களில் சிறப்பாக செயல்படுகிறார்கள் — ஆர்வம் மற்றும் நடைமுறை திறனை வெகுமதி அளிக்கும் பணிகளில்.",
    modernLead: "அஸ்வினியின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "ஆழமான பிணைப்பு, நம்பகத்தன்மை மற்றும் உணர்வுப்பூர்வ விசுவாசம் அஸ்வினியின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function AshwiniVisualPage() {
  return <NatchathiramVisualContent data={ASHWINI} visual={ASHWINI_VISUAL} />;
}
