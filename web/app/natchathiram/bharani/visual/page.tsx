import type { Metadata } from "next";
import { BHARANI } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

export const metadata: Metadata = {
  title: "Bharani Nakshathiram — Visual Profile | Vinaadi",
  description: "Visual profile of Bharani Nakshathiram: personality traits, career strengths, dasha timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/bharani/visual" },
  openGraph: {
    title: "Bharani Nakshathiram — Visual Profile",
    description: "Visual profile of Bharani Nakshathiram: personality traits, career strengths, dasha timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/bharani/visual",
    type: "article",
  },
};

const BHARANI_VISUAL: NatchathiramVisualData = {
  atAGlance: [
    { label: "Artistic Power",     score: 94 },
    { label: "Emotional Depth",    score: 90 },
    { label: "Determination",      score: 88 },
    { label: "Dharmic Sense",      score: 85 },
    { label: "Sensory Refinement", score: 82 },
  ],

  radar: {
    labels: ["Creativity", "Willpower", "Emotional Depth", "Dharma", "Resilience", "Beauty"],
    values: [94, 88, 90, 85, 82, 92],
  },

  coreStrengths: [
    { symbol: "◎", label: "Artistic Mastery",     score: 94, desc: "Born under Venus in Aries — beauty and creative force are woven into the soul." },
    { symbol: "◈", label: "Transformative Power", score: 90, desc: "Bharani carries Yama's mark — they transform everything they touch, including themselves." },
    { symbol: "⚡", label: "Iron Will",             score: 88, desc: "Mesha's fire and Venus's desire fuse into unstoppable determination once committed." },
    { symbol: "♥", label: "Emotional Depth",       score: 90, desc: "They feel everything fully — a profound gift in relationships, art, and healing work." },
    { symbol: "⚖", label: "Dharmic Compass",       score: 85, desc: "Yama's influence — they instinctively recognise right from wrong even under sustained pressure." },
    { symbol: "△", label: "Sensory Intelligence",  score: 82, desc: "Fine-tuned aesthetic sensibility — quality, beauty, and art register at a refined level." },
  ],

  careerAbilities: [
    { label: "Arts & Creative Fields",    score: 94 },
    { label: "Medicine & Surgery",        score: 88 },
    { label: "Business & Management",     score: 85 },
    { label: "Law & Justice",             score: 83 },
    { label: "Finance & Wealth Creation", score: 80 },
  ],
  careerNote: "Excels wherever transformation, aesthetic mastery, and determined leadership intersect — roles that reward emotional intelligence and creative vision.",

  careerClusters: [
    { symbol: "◎", title: "Arts & Performance",      desc: "Dance, cinema, music, design, fashion — Bharani thrives in creative expression." },
    { symbol: "✚", title: "Medicine & Surgery",       desc: "Obstetrics, surgery, oncology — where transformation and healing meet." },
    { symbol: "⚖", title: "Law & Justice",            desc: "Criminal law, arbitration, ethics boards — aligned with Yama's domain." },
    { symbol: "◈", title: "Business & Commerce",      desc: "Retail, beauty, luxury goods, hospitality — Venusian industries suit Bharani." },
    { symbol: "⚡", title: "Leadership & Management",  desc: "Bharani leads by force of personality — respected when dharma is chosen over ego." },
    { symbol: "△", title: "Spirituality & Dharma",    desc: "Ritual, devotional traditions, transformational healing — the deeper Yama path." },
  ],

  modernApps: [
    { symbol: "◎", title: "Creative Industries",       desc: "Streaming, brand design, visual storytelling, high-impact content creation." },
    { symbol: "✚", title: "Healthcare Leadership",     desc: "Hospital administration, reproductive health technology, surgical innovation." },
    { symbol: "⚖", title: "Legal Tech & Ethics",       desc: "Compliance, AI ethics, legal consulting — modern dharma roles." },
    { symbol: "◈", title: "Luxury & Lifestyle",        desc: "Beauty tech, premium retail, event design, hospitality brands." },
    { symbol: "⚡", title: "Entrepreneurship",          desc: "Bharani's will and creative vision make them natural business founders." },
    { symbol: "△", title: "Transformational Coaching", desc: "Life coaching, grief counselling, trauma therapy — Yama's gift to heal." },
  ],

  dashaTimeline: [
    {
      planet: "Venus", period: "20 yrs", ageRange: "Age 0–20", theme: "The World Arrives at Once",
      detail: {
        expect: "Bharani is born into Venus's 20-year embrace — the longest and richest opening gift in the Vimshottari cycle. From infancy through age 7, this child lives in sensory wonder: music, colour, texture, and beauty register at an intensity most people never feel. School years (7–14) are marked by creative gifts emerging early — arts, dance, literature, or dramatic performance surface naturally. The social circle is warm and wide; Bharani children draw people effortlessly. Ages 14–20 bring the full force of Bharani's magnetism: romantic attraction arrives young, the desire for independence sharpens against parental authority, and career instincts — toward arts, medicine, beauty, or business — become unmistakably clear. Marriage is typically not yet required in Venus dasha, but a serious relationship that transforms the person is almost certain by age 18–20.",
        navigate: "Venus ruling the birth dasha carries both the gift and the burden of excess. Love affairs beginning too young (before 17) can bind Bharani before they are ready — emotional depth without life experience creates dependency patterns that are hard to exit. Financial recklessness — spending on beauty, pleasure, and social display before income is established — can drain the early foundation. Venus–Rahu antardasha (approximately years 12–14 of the dasha, around ages 12–14) carries the highest risk of unhealthy romantic entanglement or harmful peer-group influence. Skin health, hormonal development, and reproductive care deserve proactive attention throughout this period.",
        focus: "Friday worship of Goddess Meenakshi (Madurai) or any Shakthi shrine, rose and jasmine offerings, and respecting women unconditionally activates Venus at its highest frequency. Do not defer artistic training past Venus dasha — any skill established now becomes a professional pillar in every decade that follows. Also watch the Venus–Mars antardasha within this dasha (the 4th sub-period, lasting about 14 months, arriving roughly in the 7th year of Venus dasha, around age 7). Mars is the lord of your rasi, Mesha — this short but potent window is the first stirring of Bharani's fierce independence. A child who suddenly refuses compromise, claims space, and pushes limits is simply becoming Bharani. Channel this energy — do not suppress it.",
      },
    },
    {
      planet: "Sun", period: "6 yrs", ageRange: "Age 20–26", theme: "Authority Declared",
      detail: {
        expect: "Sun dasha lands precisely at the threshold of adulthood — ages 20 to 26. Education is completing or translating into professional identity. Career direction crystallises with unusual confidence; Bharani at 20 has already felt the world intensely and now turns that emotional intelligence toward professional purpose. A first job of consequence, a mentor figure in authority, or institutional recognition defines this compact period. Government connections, academic credentials, or visible leadership in the peer group consolidate. Self-confidence peaks early — this is when Bharani's presence begins to command rooms rather than simply occupy them.",
        navigate: "Sun amplifies Bharani's natural confidence into occasional arrogance — and the combination of Aries fire plus Yama's intensity can produce confrontational dynamics with superiors. One ego-driven incident in the workplace can cost years of carefully built credibility. Father's health and the relationship with authority figures deserve careful attention; cardiac screening and eye health are specific concerns if family history warrants. Sun dasha's six years close with unusual speed — do not waste the window in unnecessary conflict or directionless exploration.",
        focus: "Daily offering of water to the rising sun, recitation of Aditya Hridayam, and deliberately seeking institutional recognition — a government examination, a credential, a formal role — multiplies Sun dasha's return. Bharani's natural tendency is to create outside structures; Sun dasha rewards the opposite: entering and excelling within established institutions. Any government-sector connection made between ages 20 and 26 typically endures and compounds for decades.",
      },
    },
    {
      planet: "Moon", period: "10 yrs", ageRange: "Age 26–36", theme: "Relationships & Roots",
      detail: {
        expect: "Moon dasha in the late twenties and early thirties lands Bharani in the fullness of adult life — career is established, relationships are deepening, and family is often forming. Marriage, if not completed in Venus dasha, becomes strongly likely between ages 26–30; Moon–Jupiter antardasha (approximately ages 31–33) is the secondary marriage window. A first child arrives during this period for most. Business dealing with the public — hospitality, retail, beauty, healthcare, or education — gains natural momentum. Relocation to a new city or significant expansion of the social world is common. Public recognition in professional circles grows steadily through the mid-thirties.",
        navigate: "Moon rules emotions and Bharani already carries Yama's intensity — Moon dasha amplifies both the gifts of emotional intelligence and the vulnerability to emotional overwhelm. Moon–Rahu antardasha (approximately ages 33–34) is the highest-risk sub-period: decisions made impulsively during this 18-month window often require years of correction. Mother's health requires close monitoring during this window. Bharani's deep sensitivity can translate into anxiety and sleep disturbance during Moon dasha low phases — these are signals, not disorders. Do not mistake restlessness for dissatisfaction and make unnecessary career pivots mid-dasha.",
        focus: "Monday worship, Ekadasi and Chaturdasi fasting, and daily water offerings to ancestors stabilise Moon dasha's emotional tides. This is the best dasha for Bharani to build a family foundation, invest in relationships, and root down in a physical home. The emotional investments made in Moon dasha — in children, in friendships, in community — return compounded in Jupiter and Saturn dashas. Do not mistake Moon's restlessness for dissatisfaction; the urge to constantly shift is Moon's nature, not a life directive.",
      },
    },
    {
      planet: "Mars", period: "7 yrs", ageRange: "Age 36–43", theme: "Rasi Lord Arrives — Build Now",
      detail: {
        expect: "Mars dasha lands precisely at Bharani's mid-life peak of practical authority — and for Bharani, it carries a weight no other nakshathiram's Mars dasha carries. Mars is the lord of your rasi, Mesha — this makes his dasha doubly charged for Bharani natives. Where other nakshathirams experience Mars dasha as one planetary period among nine, for Bharani it is the rasi lord himself taking the wheel directly. Every Martian theme amplifies: the property instinct becomes urgent, physical authority reaches its clearest expression, and the drive to build permanent legacy — a business, a home, a reputation — peaks. Property acquisition, construction, vehicle purchase, and real estate decisions are strongly favoured. Sibling relationships activate — either as business allies or as friction points requiring resolution.",
        navigate: "Mars dasha carries the highest accident, surgical, and legal risk in Bharani's cycle — ages 36–43. Blood pressure, cardiac health, and inflammatory conditions require proactive management. Avoid risky physical activities or financially impulsive decisions during Mars–Rahu antardasha (approximately ages 37–38). Legal disputes initiated in Mars dasha almost always drain more than they return — resolve through negotiation rather than litigation. Anger is Mars's primary weapon against your own interests; every unchecked outburst carries disproportionate consequence here.",
        focus: "Tuesday worship at Murugan or Hanuman temples, offering red flowers and red cloth, and chanting Karthikeya Shashthi Kavacham disciplines Mars's fire and channels the rasi lord's energy constructively. If property purchase was deferred from Venus or Moon dasha, Mars dasha is the correct window — do not defer again. Fixed assets, not financial instruments, are the right investment here. Channel Mars's urgency into building, not confrontation. The Mesha identity is at its fullest expression — use it to construct rather than to destroy.",
      },
    },
    {
      planet: "Rahu", period: "18 yrs", ageRange: "Age 43–61", theme: "The Great Acceleration",
      detail: {
        expect: "Rahu's 18-year arc from age 43 to 61 is the most complex and consequential dasha of Bharani's later life. Foreign connections intensify — children may settle abroad, business expands internationally, or technology opens doors that conventional training never anticipated. Bharani's artistic and creative gifts find unexpected commercial channels during Rahu dasha; unconventional routes often deliver the most financially significant breakthroughs of the entire life. The first half (43–52) is turbulent: status changes, reputation fluctuations, identity recalibration. The second half (52–61) stabilises as Rahu matures and the person integrates the transformation.",
        navigate: "Rahu's greatest weapon against Bharani is the illusion of a shortcut. Any investment, business deal, or alliance that appears unusually attractive — especially if foreign, technology-driven, or entertainment-related — demands exceptional scrutiny before commitment. Rahu–Jupiter antardasha (approximately ages 55–57) is specifically sensitive; no irreversible financial or legal decision should be finalised during exact planetary conjunctions. Health: nervous system conditions, mysterious skin ailments, and respiratory disruptions surface under Rahu. A period of spiritual questioning is normal and expected — remain grounded without becoming rigid.",
        focus: "Saturday prayers at a Rahu shrine, coconut and black sesame offerings at crossroads, and Durga ashtami worship provide essential grounding through this long transit. At the dasha's start (age 43), consult an experienced jyotishi for a full antardasha roadmap — 18 years is too complex and consequential to navigate without a map. Bharani's emotional intelligence and creative instincts are exactly what Rahu rewards; the unconventional path is frequently the correct one in this period.",
      },
    },
    {
      planet: "Jupiter", period: "16 yrs", ageRange: "Age 61–77", theme: "The Harvest of Grace",
      detail: {
        expect: "Jupiter dasha from 61 to 77 is Bharani's harvest — the dignified return on a lifetime of dharmic living through intensity and transformation. Grandchildren arrive and bring a quality of joy that no earlier dasha prepares the person for. Teaching, mentoring, and guiding roles become effortless and deeply satisfying. Long-standing investments and properties begun in Venus, Mars, and Rahu dashas typically produce their most stable returns here. Pilgrimages, scriptural study, and charitable work become genuine pleasure rather than obligation. Bharani's lifelong emotional depth finds its highest expression in Jupiter dasha — the wisdom of having felt everything fully now becomes an instrument of compassion.",
        navigate: "Jupiter dasha's trap for Bharani is complacency — the belief that all decisions are automatically right because life has rewarded dharmic living. Liver health, weight management, and joint care require active attention. The relationship with adult children and grandchildren deserves careful stewardship; Bharani's intensity does not diminish with age and must be channelled into grace, not control. Jupiter dasha is not only personal harvest — it is the period in which your legacy is sealed in the minds of those who carry your name forward.",
        focus: "Thursday worship of Dakshinamurthy or Brihaspati, unconditional generosity with time, knowledge, and wealth, and making space for both elders and juniors — these are the deepest remedies for Jupiter dasha. Write down what you have lived and learned. Teach openly without demanding return. Guru Pushyami days — when Pushya nakshatra falls on Thursday — are extraordinarily auspicious for any significant initiative in this period. Enter Jupiter dasha fully conscious of its rarity and its finality as an expansive dasha.",
      },
    },
    {
      planet: "Saturn", period: "19 yrs", ageRange: "Age 77–96", theme: "The Long Completion",
      detail: {
        expect: "Saturn dasha from 77 to 96 is experienced in full measure by very few, but those who reach it carry the weight of a complete life well-lived. From Bharani's Mesha rasi perspective, Saturn rules the 10th house (career legacy) and 11th house (gains and fulfilment from Aries) — making this dasha one of final institutional recognition and karmic completion. Community respect, family legacy, and the quiet acknowledgment of a life's work arrive without fanfare but with deep permanence. Daily routine becomes medicine. Children and grandchildren provide natural support to those who invested in relationships through the active earlier decades.",
        navigate: "Saturn accepts no shortcuts and permits no delays — and Bharani, who has lived at high intensity for decades, must learn the grace of slowing down. Physical dependence on others, met with grace rather than resistance, brings peace rather than loss. The body's requirements are non-negotiable: regular meals, movement within capacity, adequate warmth, and avoidance of cold and damp. Unresolved family tensions or karmic obligations must be addressed with urgency — Saturn's dasha does not wait for perfect timing or convenient emotion.",
        focus: "Saturday oil baths, Shani temple worship, service to the elderly and disabled (even as a recipient of such service), and completion of pending pitru karma close the karmic circuit. Any family obligations — ceremonies, donations, ancestral rituals — deferred through the active decades must now be fulfilled. Bharani's lifelong capacity for transformation finds its final expression here: turning dependence into dignity and ending into grace.",
      },
    },
    {
      planet: "Mercury", period: "17 yrs", ageRange: "Age 96–113", theme: "Ancient Clarity",
      detail: {
        expect: "Mercury dasha, reached by very few, is the final completion of the Vimshottari cycle for Bharani. At this advanced age, clarity of mind — if Mercury is strong in the natal chart — remains astonishing. The intellect, sharpened by a lifetime of creative and emotional experience, produces insight that younger minds cannot access. Conversations with great-grandchildren or spiritual seekers carry a quality of transmission that cannot be taught. This dasha is not experienced by most Bharani natives in the normal course; those who reach it do so as a grace beyond expectation.",
        navigate: "Mercury governs the nervous system and communication — at this age, the primary concern is maintaining clarity of speech, memory, and coordination. Light, stimulating intellectual activity — reading, conversation, music — keeps Mercury's faculty alive longer than disengagement. Avoid cold and damp conditions and respiratory strain that can cloud mental alertness.",
        focus: "Wednesday prayers, green offerings, and recitation of Vishnu Sahasranama or any Vedic text that has been a lifelong companion maintain Mercury's vitality. Final charitable bequests, the transfer of knowledge and property to the next generation, and a peaceful, prepared departure are the last great acts of Bharani's transformation.",
      },
    },
  ],

  spirituality: [
    {
      title: "Yama Worship & Dharmic Living",
      desc: "Bharani's presiding deity is Yama — dharmic conduct, truth-telling, and honouring commitments are the primary spiritual practice.",
    },
    {
      title: "Shakthi Shrine Devotion",
      desc: "Goddess temples — Meenakshi (Madurai), Kamakshi (Kanchipuram), and local Amman shrines — bring swift grace and emotional protection.",
    },
    {
      title: "Ancestral Rituals",
      desc: "Pitru karma and Mahalaya Amavasya observances are non-negotiable for Bharani — Yama's blessing flows through honoured ancestors.",
    },
  ],

  guidance: "Your intensity is your instrument — never a curse. Master one creative or professional skill completely, honour your commitments to family and dharma without exception, and Bharani's transformative power will deliver a life of lasting impact.",

  compatibleEn: ["Ashwini", "Hasta", "Rohini", "Revati", "Uttara Phalguni"],
  compatibleNote: "These nakshatras complement Bharani's intensity, emotional depth, and creative force for meaningful and enduring bonds.",

  ta: {
    atAGlanceLabels: ["கலை வலிமை", "உணர்வு ஆழம்", "உறுதி", "தர்ம உணர்வு", "புலன் நுட்பம்"],
    radarLabels: ["படைப்பாற்றல்", "உறுதி", "உணர்வு ஆழம்", "தர்மம்", "மனத்திடம்", "அழகுணர்வு"],
    coreStrengths: [
      { label: "கலை தேர்ச்சி",        desc: "மேஷத்தில் சுக்கிரனின் பிரசாதம் — அழகும் படைப்பாற்றலும் ஆத்மாவில் பதிந்தவை." },
      { label: "மறுபடைப்பு சக்தி",     desc: "யமனின் முத்திரை — பரணி தொட்டதை எல்லாம், தன்னையும் சேர்த்து, மாற்றுகிறார்கள்." },
      { label: "இரும்பு உறுதி",         desc: "மேஷ நெருப்பும் சுக்கிர ஆசையும் சேர்ந்து முடிவெடுத்தால் தடுக்க முடியாது." },
      { label: "உணர்வு ஆழம்",           desc: "எல்லாவற்றையும் முழுமையாக உணர்கிறார்கள் — உறவிலும் கலையிலும் இது பெரும் வரம்." },
      { label: "தர்ம திசைகாட்டி",       desc: "யமன் தாக்கம் — அழுத்தத்தில் கூட சரி-தவறை இயல்பாகவே அறிகிறார்கள்." },
      { label: "புலன் நுண்ணறிவு",       desc: "நேர்த்தியான அழகுணர்வு — தரம், கலை, அழகை நுண்ணிய மட்டத்தில் உணர்கிறார்கள்." },
    ],
    careerAbilityLabels: ["கலை & படைப்பு துறை", "மருத்துவம் & அறுவை சிகிச்சை", "வணிகம் & நிர்வாகம்", "சட்டம் & நீதி", "நிதி & செல்வம்"],
    careerClusters: [
      { title: "கலை & நிகழ்த்துகலை",   desc: "நடனம், திரைப்படம், இசை, வடிவமைப்பு, நாடகம் — படைப்பாற்றலில் பரணி மலர்கிறார்கள்." },
      { title: "மருத்துவம் & அறுவை",   desc: "மகப்பேறு, அறுவை சிகிச்சை, புற்றுநோய் சிகிச்சை — மாற்றமும் குணமும் சேரும் இடம்." },
      { title: "சட்டம் & நீதி",         desc: "குற்றவியல் சட்டம், நடுவர்மன்றம் — யமனின் தளத்தில் பரணி செழிக்கிறார்கள்." },
      { title: "வணிகம் & வர்த்தகம்",   desc: "ஆடை, அழகு, ஆடம்பரம், விருந்தோம்பல் — சுக்கிர தொழில்கள்." },
      { title: "தலைமை & நிர்வாகம்",    desc: "ஆளுமை மூலம் தலைமை — தர்மத்தை தேர்ந்தால் மதிக்கப்படுவார்கள்." },
      { title: "ஆன்மீகம் & தர்மம்",    desc: "சடங்கு, பக்தி மரபு, மறுபடைப்பு சிகிச்சை — ஆழமான யம பாதை." },
    ],
    modernApps: [
      { title: "படைப்புத் துறைகள்",   desc: "ஸ்ட்ரீமிங் தளங்கள், பிராண்ட் வடிவமைப்பு, காட்சி கதை சொல்லல்." },
      { title: "சுகாதார தலைமை",        desc: "மருத்துவமனை நிர்வாகம், இனப்பெருக்க சுகாதாரம், அறுவை தொழில்நுட்பம்." },
      { title: "சட்ட தொழில்நுட்பம்",   desc: "இணக்கம், AI நெறிமுறை, சட்ட ஆலோசனை — நவீன தர்ம பாத்திரங்கள்." },
      { title: "ஆடம்பரம் & வாழ்க்கை", desc: "அழகு தொழில்நுட்பம், பிரீமியம் சில்லறை வர்த்தகம், நிகழ்வு வடிவமைப்பு." },
      { title: "தொழில்முனைவு",         desc: "பரணியின் உறுதியும் தொலைநோக்கும் இயல்பான வணிக நிறுவனர்களாக்குகிறது." },
      { title: "மாற்றும் பயிற்சி",      desc: "வாழ்க்கை பயிற்சி, துக்க கவுன்சலிங், மனக்காயம் சிகிச்சை." },
    ],
    dashaThemes: [
      "உலகம் ஒரேயடியாக வருகிறது — கலை, காதல், இயல்பு",
      "அதிகாரம் பிரகடனம் — தொழில் திசை, நிறுவன அங்கீகாரம்",
      "உறவுகள் & வேர்கள் — திருமணம், குடும்பம், பொது வணிகம்",
      "ராசி அதிபதி வருகிறார் — சொத்து, கட்டுவது, மேஷ அடையாளம்",
      "மாபெரும் வேக மாற்றம் — வெளிநாடு, தொழில்நுட்பம், படைப்பு வாய்ப்பு",
      "கருணையின் அறுவடை — குரு, பேரன்கள், ஆன்மீக முதிர்ச்சி",
      "நீண்ட நிறைவு — கர்மம், குடும்ப மரபு, அமைதி",
      "பண்டைய தெளிவு — இறுதி ஞானம், மாற்றத்தின் நிறைவு",
    ],
    dashaDetails: [
      {
        expect: "பரணி சுக்கிரனின் 20 ஆண்டு தழுவலில் பிறக்கிறார் — விம்சோத்தரி சுழற்சியின் மிக நீண்ட திறப்பு பரிசு. குழந்தை பருவம் முதல் 7 வயது வரை இந்த குழந்தை புலன் வியப்பில் வாழ்கிறது — இசை, நிறம், தொடு உணர்வு, அழகு ஆகியவை பெரும்பாலான மக்கள் உணர்வதை விட தீவிரமாக பதிவாகும். பள்ளி காலத்தில் (7–14) கலை, நடனம், இலக்கியம் அல்லது நாடகத்தில் திறமை இயல்பாக வெளிப்படும். 14–20 வயதில் பரணியின் கவர்ச்சி முழுமையாக வெளிப்படும் — இளம் காதல், சுதந்திர ஆசை, மருத்துவம், கலை அல்லது வணிகம் நோக்கி தொழில் ஈர்ப்பு தெளிவாகும். திருமணம் பெரும்பாலும் இந்த தசையில் தேவையில்லை, ஆனால் ஒரு மாற்றும் உறவு 18–20 வயதில் கிட்டத்தட்ட உறுதி.",
        navigate: "பிறப்பு தசையாக சுக்கிரன் வருவது அதிகப்படியான ஆபத்துடன் வருகிறது. 17 வயதுக்கு முன்பே தொடங்கும் காதல் உறவுகள் தனிமனித வளர்ச்சியை தடை செய்யலாம். நிதி ஒழுக்கமின்மை — அழகு, பொழுதுபோக்கு, சமூக அந்தஸ்து கோசம் செலவழிப்பது — ஆரம்ப அடித்தளத்தை இழக்கச் செய்யும். சுக்கிர–ராகு அந்தர்தசையில் (தசையின் 12–14 ஆண்டுகளில், சுமார் 12–14 வயது) ஆரோக்கியமற்ற உறவு அல்லது தவறான சமூக தாக்கம் அதிக அபாயம். தோல், ஹார்மோன் ஆரோக்யம் கவனிக்க வேண்டும்.",
        focus: "வெள்ளிக்கிழமை மீனாட்சி அம்மன் (மதுரை) அல்லது எந்த சக்தி தலத்திலும் வழிபாடு, ரோஜா மற்றும் மல்லிகை அர்ப்பணம், பெண்களை மரியாதையுடன் நடத்துவது — சுக்கிரனின் உயர்ந்த அதிர்வலையை செயல்படுத்துகிறது. இந்த தசைக்குள் கலை பயிற்சியை தொடங்குங்கள் — இது ஒவ்வொரு தசகத்திலும் தொழில் தூண்களாக மாறும். கவனிக்கவும்: சுக்கிர–செவ்வாய் அந்தர்தசை (4வது துணை காலம், சுமார் 14 மாதங்கள், சுக்கிர தசையின் 7வது ஆண்டில், சுமார் 7 வயது). செவ்வாய் உங்கள் ராசி அதிபதி மேஷத்தின் அதிபதி — இந்த குறுகிய ஆனால் சக்திவாய்ந்த சாளரம் பரணியின் மேஷ சுதந்திர உணர்வின் முதல் விழிப்பு. இதை அடக்காதீர்கள் — வழிப்படுத்துங்கள்.",
      },
      {
        expect: "சூரியன் தசை சரியாக வயது வந்த இளமை வாயிலில் வருகிறது — 20 முதல் 26 வயது. கல்வி முடிவடைகிறது அல்லது தொழில் அடையாளமாக மாற்றப்படுகிறது. தொழில் திசை அசாதாரண நம்பிக்கையுடன் தெளிவாகும். ஒரு முக்கியமான முதல் வேலை, அதிகாரத்தில் ஒரு வழிகாட்டி ஆகியவை இந்த குறுகிய காலத்தை வரையறுக்கும். அரசு தொடர்புகள், கல்வி சான்றிதழ்கள், சகர்களில் தலைமை ஆகியவை உறுதியாகும். சுய நம்பிக்கை ஆரம்ப வாழ்க்கையில் உச்சத்தில் உள்ளது.",
        navigate: "சூரியன் பரணியின் இயல்பான நம்பிக்கையை சில நேரங்களில் அகந்தையாக மாற்றும் — மேஷ நெருப்பும் யம தீவிரமும் சேர்ந்து மேலதிகாரிகளுடன் மோதல் சாத்தியம். ஒரு அகந்தை சம்பவம் ஆண்டுகளாக கட்டிய நற்பெயரை கெடுக்கும். தந்தை ஆரோக்யம் — குறிப்பாக இதயம், கண்கள் — கவனிக்க வேண்டும்.",
        focus: "தினமும் உதய சூரியனுக்கு நீர் அர்ப்பணம், ஆதித்ய ஹ்ருதயம் பாராயணம், நிறுவன அங்கீகாரம் தேடுவது — சூரிய தசையின் பலனை மடக்கும். அரசு தேர்வு, ஒப்பந்தம், அல்லது உத்தியோகபூர்வ பதவி வாய்ப்பு இருந்தால் இப்போதே செயல்படுங்கள் — இந்த சாளரம் 6 ஆண்டுகள் மட்டுமே.",
      },
      {
        expect: "சந்திர தசை 26 முதல் 36 வயது வரை பரணியை முழு வயது வந்த வாழ்வின் நிரம்ப நிலையில் கொண்டு வருகிறது. தொழில் நிலைபெற்றுள்ளது, உறவுகள் ஆழமடைகின்றன, குடும்பம் அடிக்கடி உருவாகிறது. திருமணம் 26–30 வயதில் வலுவாக நிகழும். ஒரு முதல் குழந்தை இந்த காலத்தில் பெரும்பாலும் வருவார்கள். பொது சேவை வணிகங்கள் — விருந்தோம்பல், சில்லறை வர்த்தகம், சுகாதாரம் — இயல்பான வேகம் பெறும். புதிய நகர இடமாற்றம் பொதுவானது.",
        navigate: "சந்திரன் உணர்வுகளை ஆட்சி செய்கிறார், பரணி ஏற்கனவே யம தீவிரம் கொண்டிருக்கிறார் — சந்திர தசை உணர்வு மேலாண்மையின் கொடை மற்றும் பாதிப்பை அதிகரிக்கும். சந்திர–ராகு அந்தர்தசை (சுமார் 33–34 வயது) அதிக கவனம் தேவை. தாயின் ஆரோக்யம் கூர்ந்து கவனிக்க வேண்டும். சந்திரனின் அமைதியின்மையை அதிருப்தி என்று தவறாக புரிந்துகொண்டு அனாவசிய வாழ்க்கை மாற்றங்கள் செய்யாதீர்கள்.",
        focus: "திங்கள் வழிபாடு, ஏகாதசி விரதம், முன்னோர்களுக்கு தினமும் நீர் அர்ப்பணம் — சந்திரனின் உணர்வு அலைகளை நிலைப்படுத்தும். குடும்ப அடித்தளம், வீடு, உறவு நலன்களில் முதலீடு செய்ய இந்த தசை சிறந்தது. இங்கு விதைக்கும் உறவுகள் குரு மற்றும் சனி தசைகளில் பழமாக திரும்பும்.",
      },
      {
        expect: "செவ்வாய் தசை 36–43 வயதில் பரணியின் நடுவயது செயல் உச்சத்தில் வருகிறது — மற்றும் பரணிக்கு இது வேறு எந்த நட்சத்திரத்தின் செவ்வாய் தசையையும் விட அதிக சுமை கொண்டது. செவ்வாய் உங்கள் ராசியான மேஷத்தின் அதிபதி — இது பரணிக்கு இரட்டை வலிமையுடன் வருகிறது. மற்ற நட்சத்திரங்கள் செவ்வாய் தசையை ஒரு சாதாரண கிரக காலமாக அனுபவிக்கும்போது, பரணிக்கு இது ராசி அதிபதியே வாழ்க்கையை நேரடியாக கையில் எடுத்துக்கொள்வது. சொத்து வாங்குவது, கட்டுவது, வாகனம் வாங்குவது வலுவாக சாதகம். சகோதர உறவுகள் வணிக கூட்டாளிகளாக அல்லது மோதல் ஆதாரங்களாக முன்னணிக்கு வருகின்றன.",
        navigate: "செவ்வாய் தசையில் விபத்து, அறுவை சிகிச்சை, சட்ட அபாயம் அதிகம் — 36–43 வயது. இரத்த அழுத்தம், இதயம், அழற்சி நிலைகள் தீவிர கவனம் தேவை. செவ்வாய்–ராகு அந்தர்தசை (சுமார் 37–38 வயது) கவனமாக இருக்க வேண்டும். நீதிமன்ற வழக்குகள் செவ்வாய் தசையில் தொடங்கினால் ஆண்டுகளாக ஆற்றலை வடிக்கட்டும்.",
        focus: "செவ்வாய்க்கிழமை முருகன் அல்லது ஹனுமான் கோவில் வழிபாடு, சிவப்பு மலர் மற்றும் சிவப்பு துணி அர்ப்பணம், கார்த்திகேய ஷஷ்டி கவசம் பாராயணம் — செவ்வாயை கட்டுப்படுத்தும். சுக்கிர அல்லது சந்திர தசையில் சொத்து வாங்காவிட்டால் — இதுவே சரியான சாளரம். மேஷ அடையாளம் முழுமையான வெளிப்பாட்டில் உள்ளது — கட்ட பயன்படுத்துங்கள், அழிக்க அல்ல.",
      },
      {
        expect: "ராகுவின் 18 ஆண்டு பயணம் 43 முதல் 61 வயது வரை பரணியின் நடுவயது மற்றும் தாமத வாழ்வின் மிக சிக்கலான மற்றும் முக்கியமான தசை. வெளிநாட்டு தொடர்புகள் தீவிரமடைகின்றன. பரணியின் கலை மற்றும் படைப்பு கொடைகள் ராகு தசையில் எதிர்பாராத வணிக வழிகளை கண்டுபிடிக்கும். முதல் பாதி (43–52) கலக்கமாக இருக்கும், இரண்டாம் பாதி (52–61) நிலையாகும்.",
        navigate: "ராகுவின் முக்கிய ஆயுதம் குறுக்கு வழி மோகம். வரும் எந்த முதலீட்டு வாய்ப்பும் — குறிப்பாக வெளிநாட்டிலிருந்தோ, கலை-தொழில்நுட்ப தொடர்பிலிருந்தோ — அசாதாரண கூர்மையுடன் ஆய்வு செய்யுங்கள். ராகு–குரு அந்தர்தசை (சுமார் 55–57 வயது) மிக உணர்திறன் நிறைந்தது. நரம்பு மண்டலம், தோல், சுவாச நிலைகள் ராகுவின் கீழ் கவனிக்க வேண்டும்.",
        focus: "சனிக்கிழமை ராகு சன்னதியில் வழிபாடு, தேங்காய் மற்றும் கருப்பு எள் அர்ப்பணம், துர்கா அஷ்டமி வழிபாடு — அவசியம். தசை தொடங்கும் 43 வயதில் அனுபவமிக்க ஜோதிடரிடம் முழு அந்தர்தசை வரைப்படம் பெறுங்கள். பரணியின் உணர்வு நுண்ணறிவும் படைப்பாற்றலும் ராகு மிக அதிகமாக வெகுமதி தருகிறது.",
      },
      {
        expect: "குரு தசை 61 முதல் 77 வயது வரை பரணியின் அறுவடை — தீவிரமும் மாற்றமும் நிறைந்த வாழ்நாளின் கண்ணியமான திரும்பல். பேரன் பேத்திகள் வருகிறார்கள். கற்பித்தல், வழிகாட்டல் பணிகள் இயல்பாக வருகின்றன. சுக்கிர, செவ்வாய், ராகு தசைகளில் தொடங்கிய சொத்துகள் மற்றும் வணிகங்கள் நிலையான வருவாயை தருகின்றன. திருத்தல பயணம், வேதாகம படிப்பு, தான தர்மம் உண்மையான இன்பமாக மாறுகின்றன.",
        navigate: "குரு தசையின் ஆபத்து — ஆசீர்வாத அலட்சியம். கல்லீரல் ஆரோக்யம், உடல் எடை, மூட்டு கவனம் தேவை. வயது வந்த குழந்தைகள் மற்றும் பேரன் பேத்திகளுடனான உறவு கவனமாக பேணப்பட வேண்டும். பரணியின் தீவிரம் வயதுடன் குறையாது — கட்டுப்படுத்தல் அல்ல, கருணையாக மாறட்டும்.",
        focus: "வியாழக்கிழமை தட்சிணாமூர்த்தி வழிபாடு, நேரம், ஞானம், செல்வம் ஆகியவற்றில் தாராளம் — குரு தசையின் ஆழமான நிவாரணம். கற்றதை எழுதுங்கள், திறந்த மனதுடன் கற்பியுங்கள். குரு புஷ்யமி நாட்களில் எந்த முக்கிய முயற்சியும் அசாதாரண பலன் தரும்.",
      },
      {
        expect: "சனி தசை 77 முதல் 96 வயது வரை மிகச் சிலரால் முழுமையாக அனுபவிக்கப்படுகிறது — ஆனால் அடைவோர் ஒரு முழு வாழ்வின் கர்மப் பதிவு சுமந்திருப்பார்கள். மேஷ ராசியிலிருந்து சனி 10வது வீட்டை (தொழில் மரபு) மற்றும் 11வது வீட்டை (ஆதாயம்) ஆட்சி செய்கிறார். நிறுவன கௌரவம், சமுதாய மரியாதை, குடும்ப மரபு அங்கீகாரம் அமைதியாக ஆனால் நிரந்தரமாக வருகின்றன. தினசரி வழக்கம் மருந்தாகிறது.",
        navigate: "சனி குறுக்குவழிகளை ஏற்காது. பரணி, தீவிரமாக வாழ்ந்தவர், மெதுவாக்குவதின் அருளை கற்க வேண்டும். உடலின் தேவைகள் மாற்ற இயலாதவை. தீர்க்கப்படாத குடும்ப பதட்டங்கள் அல்லது கர்ம கடமைகள் இப்போது நிவர்த்தி செய்யப்பட வேண்டும்.",
        focus: "சனிக்கிழமை எண்ணெய் குளியல், சனி கோவில் வழிபாடு, முதியோர் மற்றும் ஊனமுற்றோருக்கு சேவை, எஞ்சிய பித்ரு கர்மம் நிறைவேற்றுவது — கர்ம சுழற்சியை நிறைவு செய்கிறது. தாமதிக்கப்பட்ட குடும்பக் கடமைகள் — சடங்குகள், தானங்கள், முன்னோர் சடங்குகள் — இப்போது நிறைவேற்றப்பட வேண்டும்.",
      },
      {
        expect: "புதன் தசை மிகச் சிலரால் அடையப்படுகிறது — பரணியின் விம்சோத்தரி சுழற்சியின் இறுதி நிறைவு. இந்த மேம்பட்ட வயதில், புதன் நட்சத்திர சாட்டத்தில் வலுவாக இருந்தால், மன தெளிவு ஆச்சரியமாக இருக்கும். படைப்பு மற்றும் உணர்வு அனுபவத்தால் கூர்மை பெற்ற அறிவு இப்போது இளைஞர்கள் அணுக முடியாத நுண்ணறிவை தருகிறது. இந்த தசை பெரும்பாலான பரணி நேயர்களால் சாதாரண போக்கில் அனுபவிக்கப்படாது.",
        navigate: "புதன் நரம்பு மண்டலம் மற்றும் தகவல் தொடர்பை நிர்வகிக்கிறார் — இந்த வயதில் தெளிவான பேச்சு, நினைவாற்றல், ஒருங்கிணைப்பு பராமரிப்பது முக்கிய கவலை. இலகுவான, தூண்டும் அறிவார்ந்த செயல்பாடு — வாசிப்பு, உரையாடல், இசை — புதன் ஆயுளை நீட்டிக்கும்.",
        focus: "புதன்கிழமை வழிபாடு, பசுமை அர்ப்பணங்கள், விஷ்ணு சஹஸ்ரநாமம் பாராயணம் — புதன் சக்தியை பேணுகின்றன. இறுதி தொண்டு உதவிகள், அடுத்த தலைமுறைக்கு ஞானம் மற்றும் சொத்தின் பரிமாற்றம் — இவை பரணியின் மாற்றத்தின் கடைசி செயல்கள்.",
      },
    ],
    spirituality: [
      { title: "யம வழிபாடு & தர்ம வாழ்வு", desc: "பரணியின் தலைமை தெய்வம் யமன் — தர்ம நடத்தை, உண்மை பேசுவது, உறுதிமொழிகளை நிறைவேற்றுவது முக்கிய ஆன்மீக நடைமுறை." },
      { title: "சக்தி தலம் பக்தி",          desc: "மீனாட்சி (மதுரை), காமாட்சி (காஞ்சிபுரம்) கோவில்கள் விரைவான அருளும் உணர்வு பாதுகாப்பும் தருகின்றன." },
      { title: "முன்னோர் சடங்குகள்",        desc: "பித்ரு கர்மம் மற்றும் மகாளய அமாவாசை பரணிக்கு கட்டாயம் — யமன் ஆசீர்வாதம் மதிக்கப்பட்ட முன்னோர்கள் வழியாக வருகிறது." },
    ],
    guidance: "உங்கள் தீவிரம் ஒரு சாபம் அல்ல — அது உங்கள் கருவி. ஒரு படைப்பு அல்லது தொழில் திறனை முழுமையாக தேர்ச்சி பெறுங்கள், குடும்பம் மற்றும் தர்மத்தில் உங்கள் உறுதிமொழிகளை விதிவிலக்கின்றி மதியுங்கள் — பரணியின் மாற்றும் சக்தி நீடித்த தாக்கம் கொண்ட வாழ்க்கையை வழங்கும்.",
    compatibleNote: "இந்த நட்சத்திரங்கள் பரணியின் தீவிரம், உணர்வு ஆழம், படைப்பாற்றல் ஆகியவற்றை நிரப்புகின்றன.",
    careerNote: "மாற்றம், அழகு தேர்ச்சி, உறுதியான தலைமை ஆகியவை சந்திக்கும் இடங்களில் சிறப்பாக செயல்படுகிறார்கள்.",
    modernLead: "பரணியின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "ஆழமான பிணைப்பு, தர்மம் மற்றும் தீவிர விசுவாசம் பரணியின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function BharaniVisualPage() {
  return <NatchathiramVisualContent data={BHARANI} visual={BHARANI_VISUAL} />;
}
