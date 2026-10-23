import type { Metadata } from "next";
import { withTamilTwin } from "@/lib/localized-metadata";
import { withDasaTimingHold } from "@/lib/natchathiram-dasa-hold";
import { dasaTimingsFor } from "@/lib/natchathiram-dasa-timings";
import { nakshatraDisplayName } from "@/lib/nakshatra-display-name";
import { natchathiramVisualTa } from "@/lib/marketing-seo-ta";
import { BHARANI } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

const EN_METADATA: Metadata = {
  title: `${nakshatraDisplayName(BHARANI.number, "en")} — Visual Profile`,
  description: "Visual profile of Bharani Nakshathiram: personality traits, career strengths, dasa timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/bharani/visual" },
  openGraph: {
    title: `${nakshatraDisplayName(BHARANI.number, "en")} — Visual Profile`,
    description: "Visual profile of Bharani Nakshathiram: personality traits, career strengths, dasa timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/bharani/visual",
    type: "article",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withDasaTimingHold(await withTamilTwin(EN_METADATA, "/natchathiram/bharani/visual", natchathiramVisualTa("bharani")!), "bharani");
}

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
      planet: "Venus", theme: "The World Arrives at Once",
      detail: {
        expect: "Bharani is born inside Venus's dasa — the longest dasa of the Vimshottari cycle. The balance left at birth is longest for births in the first pada and shortens through each pada after it; the range shown for this dasa gives it. While it runs, this child lives in sensory wonder: music, colour, texture, and beauty register at an intensity most people never feel. Where the balance reaches the school years, creative gifts emerge early — arts, dance, literature, or dramatic performance surface naturally — and the social circle is warm and wide, because Bharani children draw people effortlessly. Where the balance runs on into adolescence, the full force of Bharani's magnetism shows: romantic attraction arrives young, the desire for independence sharpens against parental authority, and career instincts — toward arts, medicine, beauty, or business — become unmistakably clear. A serious relationship that changes the person is common in this stretch.",
        navigate: "Venus ruling the birth dasa carries both the gift and the burden of excess. Love affairs beginning too young can bind Bharani before they are ready — emotional depth without life experience creates dependency patterns that are hard to exit. Financial recklessness — spending on beauty, pleasure, and social display before income is established — can drain the early foundation. The Venus–Rahu bhukti (the table below gives when it begins and how long it lasts; for the shorter balances it falls before birth) carries the highest risk of unhealthy romantic entanglement or harmful peer-group influence. Skin health, hormonal development, and reproductive care deserve proactive attention throughout this period.",
        focus: "Friday worship of Goddess Meenakshi (Madurai) or any Shakthi shrine, rose and jasmine offerings, and respecting women unconditionally activates Venus at its highest frequency. Do not defer artistic training past Venus dasa — any skill established now becomes a professional pillar in every decade that follows. Also watch the Venus–Mars bhukti within this dasa (the bhukti table below gives when it begins and how long it lasts). Mars is the lord of your rasi, Mesha — this short but potent window is the first stirring of Bharani's fierce independence. Where it falls after birth, a child who suddenly refuses compromise, claims space, and pushes limits is simply becoming Bharani. Channel this energy — do not suppress it.",
      },
    },
    {
      planet: "Sun", theme: "Authority Declared",
      detail: {
        expect: "Sun dasa wears two faces, depending on the pada. For the later padas, where Venus's balance is short, it begins in childhood and runs through the school years: a child who stands out for confidence, takes the lead among peers, and has an early, charged relationship with authority — father, teacher, institution. For the first pada, where Venus's balance is longest, it comes as school gives way to adulthood: education completing or turning into professional identity, a first job of consequence, a mentor figure in authority, institutional recognition. Government connections, academic credentials, or visible leadership in the peer group consolidate. In either case this is the compact dasa, and its mark is self-confidence — this is when Bharani's presence begins to command rooms rather than simply occupy them.",
        navigate: "Sun amplifies Bharani's natural confidence into occasional arrogance — and the combination of Aries fire plus Yama's intensity can produce confrontational dynamics with superiors. One ego-driven incident in the workplace or the classroom can cost years of carefully built credibility. Father's health and the relationship with authority figures deserve careful attention; cardiac screening and eye health are specific concerns if family history warrants. This dasa closes with unusual speed — do not waste the window in unnecessary conflict or directionless exploration.",
        focus: "Daily offering of water to the rising sun, recitation of Aditya Hridayam, and deliberately seeking institutional recognition — a government examination, a credential, a formal role — multiplies Sun dasa's return. Bharani's natural tendency is to create outside structures; Sun dasa rewards the opposite: entering and excelling within established institutions. Any government-sector connection made in this dasa, once the person is of working age, typically endures and compounds for decades.",
      },
    },
    {
      planet: "Moon", theme: "Relationships & Roots",
      detail: {
        // Marriage: the astrologer's ruled sentence, verbatim (owner rulings, fourth round). Do not reword.
        expect: "Moon dasa falls in very different years depending on the pada. In the later padas it carries Bharani through adolescence — emotional intensity, deep friendships, a pronounced bond with the mother, a sensitivity that needs steady handling. In the earlier padas it arrives in young adulthood and covers the fullness of adult life: career is establishing, relationships are deepening, and family is often forming. Where marriage falls within this dasa, it is read from the seventh house and its lord, with Venus and Jupiter as the natural significators, and judged from the individual horoscope as a tendency rather than a fixed time. A first child commonly arrives in this dasa. Business dealing with the public — hospitality, retail, beauty, healthcare, or education — gains natural momentum. Relocation to a new city or significant expansion of the social world is common, and public recognition in professional circles grows steadily.",
        navigate: "Moon rules emotions and Bharani already carries Yama's intensity — Moon dasa amplifies both the gifts of emotional intelligence and the vulnerability to emotional overwhelm. The Moon–Rahu bhukti (the table below gives when it begins and how long it lasts) is the highest-risk sub-period: decisions made impulsively during it often require years of correction. Mother's health requires close monitoring during this window. Bharani's deep sensitivity can translate into anxiety and sleep disturbance during Moon dasa low phases; where these persist, treat them as health concerns. Do not mistake restlessness for dissatisfaction and make unnecessary career pivots mid-dasa.",
        focus: "Monday worship, Ekadasi and Chaturdasi fasting, white flowers and arghya offered to the Moon, and Parvati or Annapurani worship stabilise Moon dasa's emotional tides. This is the best dasa for Bharani to build a family foundation, invest in relationships, and root down in a physical home. The emotional investments made in Moon dasa — in children, in friendships, in community — return compounded in Jupiter and Saturn dasas. Do not mistake Moon's restlessness for dissatisfaction; the urge to constantly shift is Moon's nature, not a life directive.",
      },
    },
    {
      planet: "Mars", theme: "Rasi Lord Arrives — Build Now",
      detail: {
        expect: "Mars dasa arrives in the years of Bharani's practical authority — early adult life for the later padas, nearer mid-life for the first pada — and for Bharani, it carries a weight no other nakshathiram's Mars dasa carries. Mars is the lord of your rasi, Mesha — this makes his dasa doubly charged for Bharani natives. Where other nakshathirams experience Mars dasa as one planetary period among nine, for Bharani it is the rasi lord himself taking the wheel directly. Every Martian theme amplifies: the property instinct becomes urgent, physical authority reaches its clearest expression, and the drive to build permanent legacy — a business, a home, a reputation — peaks. Once the person is earning and settled, property acquisition, construction, vehicle purchase, and real estate decisions are strongly favoured. Sibling relationships activate — either as business allies or as friction points requiring resolution.",
        navigate: "Mars dasa carries the highest accident, surgical, and legal risk in Bharani's cycle. Blood pressure, cardiac health, and inflammatory conditions require proactive management. Avoid risky physical activities or financially impulsive decisions during the Mars–Rahu bhukti (the table below gives when it begins and how long it lasts). Legal disputes initiated in Mars dasa almost always drain more than they return — resolve through negotiation rather than litigation. Anger is Mars's primary weapon against your own interests; every unchecked outburst carries disproportionate consequence here.",
        focus: "Tuesday worship at Murugan or Hanuman temples, offering red flowers and red cloth, and chanting Karthikeya Shashthi Kavacham disciplines Mars's fire and channels the rasi lord's energy constructively. If property purchase was deferred from Venus or Moon dasa, Mars dasa is the correct window — do not defer again. Fixed assets, not financial instruments, are the right investment here. Channel Mars's urgency into building, not confrontation. The Mesha identity is at its fullest expression — use it to construct rather than to destroy.",
      },
    },
    {
      planet: "Rahu", theme: "The Great Acceleration",
      detail: {
        expect: "Rahu's long arc is the most complex and consequential dasa of Bharani's adult life; for the later padas it begins in young adulthood, for the first pada in middle age. Foreign connections intensify — children may settle abroad, business expands internationally, or technology opens doors that conventional training never anticipated. Bharani's artistic and creative gifts find unexpected commercial channels during Rahu dasa; unconventional routes often deliver the most financially significant breakthroughs of the entire life. The first half of the dasa is turbulent: status changes, reputation fluctuations, identity recalibration. The second half stabilises as Rahu matures and the person integrates the transformation.",
        navigate: "Rahu's greatest weapon against Bharani is the illusion of a shortcut. Any investment, business deal, or alliance that appears unusually attractive — especially if foreign, technology-driven, or entertainment-related — demands exceptional scrutiny before commitment. The Rahu–Jupiter bhukti (the table below gives when it begins and how long it lasts) is specifically sensitive; no irreversible financial or legal decision should be finalised during exact planetary conjunctions. Health: nervous system conditions, mysterious skin ailments, and respiratory disruptions surface under Rahu. A period of spiritual questioning is normal and expected — remain grounded without becoming rigid.",
        focus: "Saturday prayers at a Rahu shrine, coconut and black sesame offerings at crossroads, and Durga ashtami worship provide essential grounding through this long transit. At the dasa's start, consult an experienced Jothida practitioner for a full bhukti roadmap — this dasa is too complex and consequential to navigate without a map. Bharani's emotional intelligence and creative instincts are exactly what Rahu rewards; the unconventional path is frequently the correct one in this period.",
      },
    },
    {
      planet: "Jupiter", theme: "The Harvest of Grace",
      detail: {
        expect: "Jupiter dasa, arriving in the second half of life, is Bharani's harvest — the dignified return on a lifetime of dharmic living through intensity and transformation. Grandchildren often arrive and bring a quality of joy that no earlier dasa prepares the person for. Teaching, mentoring, and guiding roles become effortless and deeply satisfying. Long-standing investments and properties begun in Venus, Mars, and Rahu dasas typically produce their most stable returns here. Pilgrimages, scriptural study, and charitable work become genuine pleasure rather than obligation. Bharani's lifelong emotional depth finds its highest expression in Jupiter dasa — the wisdom of having felt everything fully now becomes an instrument of compassion.",
        navigate: "Jupiter dasa's trap for Bharani is complacency — the belief that all decisions are automatically right because life has rewarded dharmic living. Liver health, weight management, and joint care require active attention. The relationship with adult children and grandchildren deserves careful stewardship; Bharani's intensity does not diminish with age and must be channelled into grace, not control. Jupiter dasa is not only personal harvest — it is the period in which your legacy is sealed in the minds of those who carry your name forward.",
        focus: "Thursday worship of Dakshinamurthy or Brihaspati, unconditional generosity with time, knowledge, and wealth, and making space for both elders and juniors — these are the deepest remedies for Jupiter dasa. Write down what you have lived and learned. Teach openly without demanding return. Guru Pushyami days — when Pushya nakshatra falls on Thursday — are extraordinarily auspicious for any significant initiative in this period. Enter Jupiter dasa fully conscious of its rarity and its finality as an expansive dasa.",
      },
    },
    {
      planet: "Saturn", theme: "The Long Completion",
      detail: {
        expect: "Saturn dasa, reaching into advanced age, is experienced in full measure by very few, but those who reach it carry the weight of a complete life well-lived. From Bharani's Mesha rasi perspective, Saturn rules the tenth house (career legacy) and the eleventh house (gains and fulfilment from Aries) — making this dasa one of final institutional recognition and karmic completion. Community respect, family legacy, and the quiet acknowledgment of a life's work arrive without fanfare but with deep permanence. Daily routine becomes medicine. Children and grandchildren provide natural support to those who invested in relationships through the active earlier decades.",
        navigate: "Saturn accepts no shortcuts and permits no delays — and Bharani, who has lived at high intensity for decades, must learn the grace of slowing down. Physical dependence on others, met with grace rather than resistance, brings peace rather than loss. The body's requirements are non-negotiable: regular meals, movement within capacity, adequate warmth, and avoidance of cold and damp. Unresolved family tensions or karmic obligations must be addressed with urgency — Saturn's dasa does not wait for perfect timing or convenient emotion.",
        focus: "Saturday oil baths, Shani temple worship, Hanuman worship, service to the elderly and disabled (even as a recipient of such service), and completion of pending pitru karma close the karmic circuit. Any family obligations — ceremonies, donations, ancestral rituals — deferred through the active decades must now be fulfilled. Bharani's lifelong capacity for transformation finds its final expression here: turning dependence into dignity and ending into grace.",
      },
    },
    {
      planet: "Mercury", theme: "Ancient Clarity",
      detail: {
        expect: "Mercury dasa, reached by very few, is the final completion of the Vimshottari cycle for Bharani. At this very advanced age, clarity of mind — if Mercury is strong in the natal chart — remains astonishing. The intellect, sharpened by a lifetime of creative and emotional experience, produces insight that younger minds cannot access. Conversations with great-grandchildren or spiritual seekers carry a quality of transmission that cannot be taught. This dasa is not experienced by most Bharani natives in the normal course; those who reach it do so as a grace beyond expectation.",
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

  compatibleEn: ["Aswini", "Hastham", "Rohini", "Revathi", "Uthiram"],
  compatibleNote: "These nakshatras complement Bharani's intensity, emotional depth, and creative force for meaningful and enduring bonds.",

  ta: {
    atAGlanceLabels: ["கலை வலிமை", "உணர்வு ஆழம்", "உறுதி", "தர்ம உணர்வு", "புலன் நுட்பம்"],
    radarLabels: ["படைப்பாற்றல்", "உறுதி", "உணர்வு ஆழம்", "தர்மம்", "மனத்திடம்", "அழகுணர்வு"],
    coreStrengths: [
      { label: "கலை தேர்ச்சி",        desc: "மேஷத்தில் சுக்கிரனின் பிரசாதம் — அழகும் படைப்பாற்றலும் ஆத்மாவில் பதிந்தவை." },
      { label: "மறுபடைப்பு சக்தி",     desc: "யமனின் முத்திரை — பரணி ஜாதகர்கள் தொட்டதை எல்லாம், தன்னையும் சேர்த்து, மாற்றுகிறார்கள்." },
      { label: "இரும்பு உறுதி",         desc: "மேஷ நெருப்பும் சுக்கிர ஆசையும் சேர்ந்து முடிவெடுத்தால் தடுக்க முடியாது." },
      { label: "உணர்வு ஆழம்",           desc: "எல்லாவற்றையும் முழுமையாக உணர்கிறார்கள் — உறவிலும் கலையிலும் இது பெரும் வரம்." },
      { label: "தர்ம திசைகாட்டி",       desc: "யமன் தாக்கம் — அழுத்தத்தில் கூட சரி-தவறை இயல்பாகவே அறிகிறார்கள்." },
      { label: "புலன் நுண்ணறிவு",       desc: "நேர்த்தியான அழகுணர்வு — தரம், கலை, அழகை நுண்ணிய மட்டத்தில் உணர்கிறார்கள்." },
    ],
    careerAbilityLabels: ["கலை & படைப்பு துறை", "மருத்துவம் & அறுவை சிகிச்சை", "வணிகம் & நிர்வாகம்", "சட்டம் & நீதி", "நிதி & செல்வம்"],
    careerClusters: [
      { title: "கலை & நிகழ்த்துகலை",   desc: "நடனம், திரைப்படம், இசை, வடிவமைப்பு, நாடகம் — படைப்பாற்றலில் பரணி ஜாதகர்கள் மலர்கிறார்கள்." },
      { title: "மருத்துவம் & அறுவை",   desc: "மகப்பேறு, அறுவை சிகிச்சை, புற்றுநோய் சிகிச்சை — மாற்றமும் குணமும் சேரும் இடம்." },
      { title: "சட்டம் & நீதி",         desc: "குற்றவியல் சட்டம், நடுவர்மன்றம் — யமனின் தளத்தில் பரணி ஜாதகர்கள் செழிக்கிறார்கள்." },
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
      "அதிகாரம் பிரகடனம் — தன்னம்பிக்கை, நிறுவன அங்கீகாரம்",
      "உறவுகள் & வேர்கள் — உணர்வு, குடும்பம், பொது வணிகம்",
      "ராசி அதிபதி வருகிறார் — சொத்து, கட்டுவது, மேஷ அடையாளம்",
      "மாபெரும் வேக மாற்றம் — வெளிநாடு, தொழில்நுட்பம், படைப்பு வாய்ப்பு",
      "கருணையின் அறுவடை — குரு, பேரன்கள், ஆன்மீக முதிர்ச்சி",
      "நீண்ட நிறைவு — கர்மம், குடும்ப மரபு, அமைதி",
      "பண்டைய தெளிவு — இறுதி ஞானம், மாற்றத்தின் நிறைவு",
    ],
    dashaDetails: [
      {
        expect: "பரணி ஜாதகர் சுக்கிர தசையின் நடுவில் பிறக்கிறார் — விம்சோத்தரி சுழற்சியின் மிக நீண்ட தசை. முதல் பாதத்தில் பிறப்பவருக்கு இருப்பு மிக நீளம்; ஒவ்வொரு பாதத்திலும் அது குறைந்து செல்லும். இந்த தசைக்குக் காட்டப்படும் வரம்பு அதைச் சொல்கிறது. தசை நடக்கும் வரை இந்த குழந்தை புலன் வியப்பில் வாழ்கிறது — இசை, நிறம், தொடு உணர்வு, அழகு ஆகியவை பெரும்பாலான மக்கள் உணர்வதை விட தீவிரமாக பதிவாகும். இருப்பு பள்ளிக் காலத்தை எட்டும்போது கலை, நடனம், இலக்கியம் அல்லது நாடகத்தில் திறமை இயல்பாக வெளிப்படும்; பரணிக் குழந்தைகள் மக்களை எளிதில் ஈர்ப்பதால் நட்பு வட்டமும் அரவணைப்பாகவும் அகலமாகவும் இருக்கும். இருப்பு வளரிளம் பருவம் வரை நீளுமானால் பரணியின் கவர்ச்சி முழுமையாக வெளிப்படும் — இளம் வயதிலேயே காதல் ஈர்ப்பு, பெற்றோர் அதிகாரத்துக்கு எதிரான சுதந்திர ஆசை, மருத்துவம், கலை, அழகு அல்லது வணிகம் நோக்கி தொழில் ஈர்ப்பு தெளிவாகும். ஆளையே மாற்றும் ஒரு தீவிர உறவு இந்த கட்டத்தில் பொதுவானது.",
        navigate: "பிறப்பு தசையாக சுக்கிரன் வருவது கொடையுடன் மிகையின் சுமையையும் கொண்டுவருகிறது. மிக இளம் வயதில் தொடங்கும் காதல் உறவுகள் பரணியைத் தயாராகும் முன்பே கட்டிப்போடலாம் — வாழ்க்கை அனுபவம் இல்லாத உணர்வு ஆழம் விடுபட கடினமான சார்புநிலையை உருவாக்கும். வருமானம் உருவாகும் முன் அழகு, பொழுதுபோக்கு, சமூக அந்தஸ்துக்காகச் செலவழிப்பது ஆரம்ப அடித்தளத்தை இழக்கச் செய்யும். சுக்கிர–ராகு புக்தியில் (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்; இருப்பு குறைவாக இருந்தால் அது பிறப்புக்கு முன்பே வந்துவிடும்) ஆரோக்கியமற்ற உறவு அல்லது தவறான நட்பு வட்டத்தின் தாக்கம் அதிக அபாயம். தோல், ஹார்மோன் வளர்ச்சி, இனப்பெருக்க ஆரோக்கியம் கவனிக்க வேண்டும்.",
        focus: "வெள்ளிக்கிழமை மீனாட்சி அம்மன் (மதுரை) அல்லது எந்த சக்தி தலத்திலும் வழிபாடு, ரோஜா மற்றும் மல்லிகை அர்ப்பணம், பெண்களை நிபந்தனையின்றி மரியாதையுடன் நடத்துவது — சுக்கிரனின் உயர்ந்த அதிர்வலையை செயல்படுத்துகிறது. கலை பயிற்சியை இந்த தசையைக் கடந்து தள்ளிப்போடாதீர்கள் — இப்போது உருவாகும் திறன் வரும் ஒவ்வொரு தசகத்திலும் தொழில் தூணாக மாறும். கவனிக்கவும்: சுக்கிர–செவ்வாய் புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்). செவ்வாய் உங்கள் ராசியான மேஷத்தின் அதிபதி — இந்த குறுகிய ஆனால் சக்திவாய்ந்த சாளரம் பரணியின் தீவிர சுதந்திர உணர்வின் முதல் விழிப்பு. இது பிறப்புக்குப் பின் வருமானால், திடீரென சமரசத்தை மறுக்கும், இடம் கோரும், எல்லைகளைச் சோதிக்கும் குழந்தை பரணியாக மாறிக்கொண்டிருக்கிறது என்றே பொருள். இந்த ஆற்றலை அடக்காதீர்கள் — வழிப்படுத்துங்கள்.",
      },
      {
        expect: "சூரிய தசைக்கு பாதத்தைப் பொறுத்து இரண்டு முகங்கள். சுக்கிர இருப்பு குறைவான பிந்தைய பாதங்களில் இது குழந்தைப் பருவத்தில் தொடங்கி பள்ளிக் காலம் முழுவதும் நீடிக்கும்: நம்பிக்கையால் தனித்து நிற்கும், தோழர்களிடையே முன்னிற்கும், அதிகாரத்துடன் — தந்தை, ஆசிரியர், நிறுவனம் — ஆரம்பத்திலேயே உணர்வுப்பூர்வமான உறவு கொள்ளும் குழந்தை. சுக்கிர இருப்பு மிக நீண்ட முதல் பாதத்தில், பள்ளி வாழ்க்கை வயது வந்த வாழ்க்கையாக மாறும் தருணத்தில் இது வருகிறது: கல்வி முடிவடைவது அல்லது தொழில் அடையாளமாக மாறுவது, ஒரு முக்கியமான முதல் வேலை, அதிகாரத்தில் ஒரு வழிகாட்டி, நிறுவன அங்கீகாரம். அரசு தொடர்புகள், கல்விச் சான்றிதழ்கள், சகாக்களிடையே தலைமை ஆகியவை உறுதியாகும். எவ்வாறாயினும் இது குறுகிய தசை; அதன் முத்திரை தன்னம்பிக்கை — பரணியின் இருப்பு அறையை வெறுமனே நிரப்பாமல் ஆட்கொள்ளத் தொடங்குவது இப்போதுதான்.",
        navigate: "சூரியன் பரணியின் இயல்பான நம்பிக்கையை சில நேரங்களில் அகந்தையாக மாற்றும் — மேஷ நெருப்பும் யம தீவிரமும் சேர்ந்து மேலதிகாரிகளுடன் மோதல் சாத்தியம். வேலையிடத்திலோ வகுப்பிலோ நிகழும் ஒரு அகந்தை சம்பவம் ஆண்டுகளாக கட்டிய நற்பெயரை கெடுக்கும். தந்தை ஆரோக்கியம், அதிகாரமுள்ளவர்களுடனான உறவு கவனமாக பார்க்கப்பட வேண்டும்; குடும்ப வரலாறு இருந்தால் இதயப் பரிசோதனை, கண் நலம் குறிப்பிட்ட கவலைகள். இந்த தசை அசாதாரண வேகத்தில் முடிகிறது — தேவையற்ற மோதலிலும் திசையற்ற தேடலிலும் சாளரத்தை வீணாக்காதீர்கள்.",
        focus: "தினமும் உதய சூரியனுக்கு நீர் அர்ப்பணம், ஆதித்ய ஹ்ருதயம் பாராயணம், நிறுவன அங்கீகாரத்தை — அரசு தேர்வு, சான்றிதழ், அதிகாரபூர்வ பதவி — திட்டமிட்டுத் தேடுவது சூரிய தசையின் பலனை மடங்காக்கும். பரணியின் இயல்பான போக்கு வெளியே அமைப்புகளை உருவாக்குவது; சூரிய தசை அதற்கு எதிர்மாறை வெகுமதியாகத் தருகிறது: நிறுவப்பட்ட நிறுவனங்களுக்குள் நுழைந்து சிறப்பது. பணி வயதை எட்டிய பிறகு இந்த தசையில் ஏற்படும் அரசு தொடர்பு பொதுவாக பல பத்தாண்டுகள் நீடித்து பெருகும்.",
      },
      {
        // Marriage: the astrologer's ruled sentence, verbatim (owner rulings, fourth round). Do not reword.
        expect: "சந்திர தசை எந்த வயதில் வருகிறது என்பது பாதத்தைப் பொறுத்து மாறுபடும். பிந்தைய பாதங்களில் இது பரணியை வளரிளம் பருவம் வழியாக அழைத்துச் செல்கிறது — உணர்வுத் தீவிரம், ஆழமான நட்புகள், தாயுடன் மிக நெருங்கிய பிணைப்பு, நிதானமாகக் கையாள வேண்டிய நுட்ப உணர்திறன். முந்தைய பாதங்களில் இது இளம் வயது வந்த காலத்தில் வந்து வயது வந்த வாழ்வின் நிறைவை உள்ளடக்குகிறது: தொழில் நிலைபெறுகிறது, உறவுகள் ஆழமடைகின்றன, குடும்பம் அடிக்கடி உருவாகிறது. இந்தத் தசைக்குள் திருமணம் அமைந்தால், அது ஜாதகத்தின் ஏழாம் வீட்டையும் அதன் அதிபதியையும் கொண்டு பார்க்கப்படுகிறது; சுக்கிரனும் குருவும் அதன் இயல்பான காரகர்கள். அது ஒரு நிலையான காலம் அல்ல, ஒரு போக்கே. முதல் குழந்தை பொதுவாக இந்த தசையில் வரும். விருந்தோம்பல், சில்லறை வர்த்தகம், அழகு, சுகாதாரம், கல்வி போன்ற பொது சேவை வணிகங்கள் இயல்பான வேகம் பெறும். புதிய நகர இடமாற்றம், சமூக வட்டம் விரிவடைதல் பொதுவானது; தொழில் வட்டாரத்தில் பொது அங்கீகாரம் படிப்படியாக வளரும்.",
        navigate: "சந்திரன் உணர்வுகளை ஆட்சி செய்கிறார், பரணி ஜாதகர் ஏற்கனவே யம தீவிரம் கொண்டிருக்கிறார் — சந்திர தசை உணர்வு நுண்ணறிவின் கொடையையும் உணர்வு மூழ்கடிப்பின் பாதிப்பையும் ஒருசேர அதிகரிக்கும். சந்திர–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) அதிக அபாயமுள்ள துணைக் காலம்: இதில் உந்துதலில் எடுக்கும் முடிவுகளை ஆண்டுகளாக சரிசெய்ய வேண்டியிருக்கும். தாயின் ஆரோக்கியம் இந்த காலத்தில் கூர்ந்து கவனிக்கப்பட வேண்டும். பரணியின் ஆழ்ந்த உணர்திறன் சந்திர தசையின் தாழ்வான கட்டங்களில் பதற்றமாகவும் தூக்கக் கலக்கமாகவும் வெளிப்படலாம்; அவை தொடர்ந்தால், உடல்நலக் கவலையாகவே கவனியுங்கள். சந்திரனின் அமைதியின்மையை அதிருப்தி என்று தவறாக புரிந்துகொண்டு அனாவசிய தொழில் மாற்றங்கள் செய்யாதீர்கள்.",
        focus: "திங்கட்கிழமை வழிபாடு, ஏகாதசி மற்றும் சதுர்தசி விரதம், சந்திரனுக்கு வெள்ளை மலர்களும் அர்க்கியமும், பார்வதி அல்லது அன்னபூரணி வழிபாடு — சந்திரனின் உணர்வு அலைகளை நிலைப்படுத்தும். குடும்ப அடித்தளம், வீடு, உறவு நலன்களில் முதலீடு செய்ய இந்த தசை சிறந்தது. இங்கு விதைக்கும் உறவுகள் குரு மற்றும் சனி தசைகளில் பழமாக திரும்பும். சந்திரனின் அமைதியின்மையை அதிருப்தி என்று தவறாகப் புரிந்துகொள்ளாதீர்கள்; தொடர்ந்து இடம் மாற வேண்டும் என்ற உந்துதல் சந்திரனின் இயல்பு, வாழ்க்கைக் கட்டளை அல்ல.",
      },
      {
        expect: "செவ்வாய் தசை பரணியின் நடைமுறை அதிகார ஆண்டுகளில் வருகிறது — பிந்தைய பாதங்களில் இளம் வயது வந்த காலத்தில், முதல் பாதத்தில் நடுவயதை நெருங்கி — மேலும் வேறு எந்த நட்சத்திரத்தின் செவ்வாய் தசையையும் விட பரணிக்கு அதிக சுமை கொண்டது. செவ்வாய் உங்கள் ராசியான மேஷத்தின் அதிபதி — இது பரணிக்கு இரட்டை வலிமையுடன் வருகிறது. மற்ற நட்சத்திரங்கள் செவ்வாய் தசையை ஒன்பது கிரக காலங்களில் ஒன்றாக அனுபவிக்கும்போது, பரணிக்கு இது ராசி அதிபதியே வாழ்க்கையை நேரடியாக கையில் எடுத்துக்கொள்வது. ஒவ்வொரு செவ்வாய் அம்சமும் பெருகும்: சொத்து உள்ளுணர்வு அவசரமாகும், உடல் அதிகாரம் தெளிவாக வெளிப்படும், நிரந்தர மரபை — தொழில், வீடு, நற்பெயர் — கட்டும் உந்துதல் உச்சம் அடையும். சம்பாதித்து நிலைபெற்ற பிறகு சொத்து வாங்குவது, கட்டுவது, வாகனம் வாங்குவது, ரியல் எஸ்டேட் முடிவுகள் வலுவாக சாதகம். சகோதர உறவுகள் வணிக கூட்டாளிகளாக அல்லது தீர்க்க வேண்டிய மோதல் புள்ளிகளாக முன்னணிக்கு வருகின்றன.",
        navigate: "செவ்வாய் தசையில் பரணியின் சுழற்சியிலேயே விபத்து, அறுவை சிகிச்சை, சட்ட அபாயம் அதிகம். இரத்த அழுத்தம், இதயம், அழற்சி நிலைகள் தீவிர கவனம் தேவை. செவ்வாய்–ராகு புக்தியில் (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஆபத்தான உடல் செயல்களையும் நிதி சார்ந்த அவசர முடிவுகளையும் தவிருங்கள். நீதிமன்ற வழக்குகள் செவ்வாய் தசையில் தொடங்கினால் ஆண்டுகளாக ஆற்றலை வடிக்கட்டும் — வழக்காடுவதை விட பேச்சுவார்த்தையில் தீர்வு காணுங்கள். கோபம் உங்கள் சொந்த நலனுக்கு எதிரான செவ்வாயின் முதன்மை ஆயுதம்; இங்கு கட்டுப்படுத்தப்படாத ஒவ்வொரு கோப வெடிப்பும் அளவுக்கு மீறிய விளைவைக் கொண்டுவரும்.",
        focus: "செவ்வாய்க்கிழமை முருகன் அல்லது ஹனுமான் கோவில் வழிபாடு, சிவப்பு மலர் மற்றும் சிவப்பு துணி அர்ப்பணம், கார்த்திகேய ஷஷ்டி கவசம் பாராயணம் — செவ்வாயின் நெருப்பைக் கட்டுப்படுத்தி, ராசி அதிபதியின் ஆற்றலை ஆக்கபூர்வமாகச் செலுத்தும். சுக்கிர அல்லது சந்திர தசையில் சொத்து வாங்குவது தள்ளிப்போயிருந்தால், செவ்வாய் தசையே சரியான சாளரம் — மீண்டும் தள்ளிப்போடாதீர்கள். இங்கு சரியான முதலீடு நிலையான சொத்துகளே, நிதிக் கருவிகள் அல்ல. செவ்வாயின் அவசரத்தை மோதலுக்கு அல்ல, கட்டுவதற்குச் செலுத்துங்கள். மேஷ அடையாளம் அதன் முழு வெளிப்பாட்டில் உள்ளது — அதை அழிக்க அல்ல, கட்டப் பயன்படுத்துங்கள்.",
      },
      {
        expect: "ராகுவின் நீண்ட பயணம் பரணியின் வயது வந்த வாழ்வின் மிக சிக்கலான, முக்கியமான தசை; பிந்தைய பாதங்களில் இது இளம் வயது வந்த காலத்திலும், முதல் பாதத்தில் நடுவயதிலும் தொடங்குகிறது. வெளிநாட்டு தொடர்புகள் தீவிரமடைகின்றன — குழந்தைகள் வெளிநாட்டில் குடியேறலாம், வணிகம் சர்வதேசமாகலாம், தொழில்நுட்பம் பாரம்பரியப் பயிற்சி எதிர்பார்க்காத புதிய கதவுகளைத் திறக்கலாம். பரணியின் கலை மற்றும் படைப்பு கொடைகள் ராகு தசையில் எதிர்பாராத வணிக வழிகளை கண்டுபிடிக்கும்; வழக்கத்துக்கு மாறான பாதைகள் பெரும்பாலும் முழு வாழ்வின் மிக முக்கிய நிதித் திருப்புமுனைகளைத் தருகின்றன. தசையின் முதல் பாதி கலக்கமானது: நிலை மாற்றங்கள், நற்பெயர் ஏற்றத்தாழ்வுகள், அடையாள மறுசீரமைப்பு. இரண்டாம் பாதி ராகு முதிர்ந்து, நபர் மாற்றத்தை உள்வாங்கும்போது நிலையாகும்.",
        navigate: "ராகுவின் முக்கிய ஆயுதம் குறுக்கு வழி மோகம். வரும் எந்த முதலீட்டு வாய்ப்பும் — குறிப்பாக வெளிநாட்டிலிருந்தோ, தொழில்நுட்பம் அல்லது பொழுதுபோக்கு தொடர்பிலிருந்தோ — ஒப்புக்கொள்ளும் முன் அசாதாரண கூர்மையுடன் ஆய்வு செய்யுங்கள். ராகு–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மிக உணர்திறன் நிறைந்தது — கிரகச் சேர்க்கை துல்லியமாக நிகழும் நேரத்தில் திரும்பல் முடியாத நிதி அல்லது சட்ட முடிவுகள் வேண்டாம். நரம்பு மண்டலம், விளக்கமுடியாத தோல் நோய்கள், சுவாசத் தடங்கல்கள் ராகுவின் கீழ் கவனிக்கப்பட வேண்டும். ஆன்மீகக் கேள்விகள் எழுவது இயல்பு — இறுக்கமாகாமல் நிலைத்து நில்லுங்கள்.",
        focus: "சனிக்கிழமை ராகு சன்னதியில் வழிபாடு, குறுக்குச்சாலைகளில் தேங்காய் மற்றும் கருப்பு எள் அர்ப்பணம், துர்கா அஷ்டமி வழிபாடு — இந்த நீண்ட பயணத்தில் அவசியமான நிலைப்பை தருகின்றன. தசை தொடங்கும்போதே அனுபவமிக்க ஜோதிடரிடம் முழு புக்தி வரைபடம் பெறுங்கள் — இவ்வளவு சிக்கலான, முக்கியமான தசையை வரைபடம் இல்லாமல் கடக்க முடியாது. பரணியின் உணர்வு நுண்ணறிவும் படைப்பாற்றலும் ராகு மிக அதிகமாக வெகுமதி தருபவை; இந்த காலத்தில் வழக்கத்துக்கு மாறான பாதையே பெரும்பாலும் சரியானது.",
      },
      {
        expect: "வாழ்வின் இரண்டாம் பாதியில் வரும் குரு தசை பரணியின் அறுவடை — தீவிரமும் மாற்றமும் நிறைந்த வாழ்நாளின் கண்ணியமான திரும்பல். பேரன் பேத்திகள் பெரும்பாலும் வருகிறார்கள்; எந்த முந்தைய தசையும் தயார்படுத்தாத மகிழ்ச்சியை தருகிறார்கள். கற்பித்தல், வழிகாட்டல் பணிகள் இயல்பாகவும் ஆழ்ந்த திருப்தியுடனும் வருகின்றன. சுக்கிர, செவ்வாய், ராகு தசைகளில் தொடங்கிய சொத்துகள் மற்றும் வணிகங்கள் இங்கு பொதுவாக மிக நிலையான வருவாயை தருகின்றன. திருத்தல பயணம், வேதாகம படிப்பு, தான தர்மம் கடமையாக அல்லாமல் உண்மையான இன்பமாக மாறுகின்றன. எல்லாவற்றையும் முழுமையாக உணர்ந்த ஞானம் இப்போது கருணையின் கருவியாகிறது.",
        navigate: "குரு தசையின் ஆபத்து — ஆசீர்வாத அலட்சியம். கல்லீரல் ஆரோக்கியம், உடல் எடை, மூட்டு கவனம் தேவை. வயது வந்த குழந்தைகள் மற்றும் பேரன் பேத்திகளுடனான உறவு கவனமாக பேணப்பட வேண்டும். பரணியின் தீவிரம் வயதுடன் குறையாது — கட்டுப்படுத்தல் அல்ல, கருணையாக மாறட்டும்.",
        focus: "வியாழக்கிழமை தட்சிணாமூர்த்தி அல்லது பிருஹஸ்பதி வழிபாடு, நேரம், ஞானம், செல்வம் ஆகியவற்றில் நிபந்தனையற்ற தாராளம், மூத்தோருக்கும் இளையோருக்கும் இடம் அளித்தல் — இவையே குரு தசையின் ஆழமான பரிகாரங்கள். வாழ்ந்ததையும் கற்றதையும் எழுதி வையுங்கள். பதிலுக்கு எதையும் எதிர்பார்க்காமல் திறந்த மனதுடன் கற்பியுங்கள். குரு புஷ்யமி நாட்கள் — பூச நட்சத்திரம் வியாழக்கிழமையில் வரும் நாட்கள் — இந்தக் காலத்தில் எந்த முக்கிய முயற்சிக்கும் அசாதாரண சுபமானவை. குரு தசையின் அரிதான தன்மையையும், விரிவாக்கும் தசையாக அது இறுதியானது என்பதையும் முழு உணர்வுடன் அதற்குள் நுழையுங்கள்.",
      },
      {
        expect: "சனி தசை முதிர்ந்த வயதுக்குள் நீள்கிறது; மிகச் சிலரே முழுமையாக அனுபவிக்கிறார்கள் — ஆனால் அடைவோர் நிறைவாக வாழ்ந்த ஒரு முழு வாழ்வின் எடையைச் சுமந்திருப்பார்கள். மேஷ ராசியிலிருந்து சனி பத்தாம் வீட்டை (தொழில் மரபு) மற்றும் பதினொன்றாம் வீட்டை (ஆதாயம், நிறைவு) ஆட்சி செய்கிறார் — இது இறுதி நிறுவன அங்கீகாரம் மற்றும் கர்ம நிறைவின் காலம். சமுதாய மரியாதை, குடும்ப மரபு, ஒரு வாழ்நாள் உழைப்பின் அமைதியான அங்கீகாரம் ஆரவாரமின்றி ஆனால் ஆழ்ந்த நிரந்தரத்துடன் வருகின்றன. தினசரி வழக்கம் மருந்தாகிறது. செயல்பாடுள்ள முந்தைய ஆண்டுகளில் உறவுகளில் முதலீடு செய்தவர்களுக்கு குழந்தைகளும் பேரக்குழந்தைகளும் இயல்பான ஆதரவு தருகிறார்கள்.",
        navigate: "சனி குறுக்குவழிகளை ஏற்காது. பரணி, தீவிரமாக வாழ்ந்தவர், மெதுவாக்குவதின் அருளை கற்க வேண்டும். உடலின் தேவைகள் மாற்ற இயலாதவை. தீர்க்கப்படாத குடும்ப பதட்டங்கள் அல்லது கர்ம கடமைகள் இப்போது நிவர்த்தி செய்யப்பட வேண்டும்.",
        focus: "சனிக்கிழமை எண்ணெய் குளியல், சனி கோவில் வழிபாடு, ஆஞ்சநேயர் வழிபாடு, முதியோர் மற்றும் ஊனமுற்றோருக்கு சேவை, எஞ்சிய பித்ரு கர்மம் நிறைவேற்றுவது — கர்ம சுழற்சியை நிறைவு செய்கிறது. தாமதிக்கப்பட்ட குடும்பக் கடமைகள் — சடங்குகள், தானங்கள், முன்னோர் சடங்குகள் — இப்போது நிறைவேற்றப்பட வேண்டும். பரணியின் வாழ்நாள் மாற்றும் திறன் இங்கு தன் இறுதி வெளிப்பாட்டைக் காண்கிறது: சார்பைக் கண்ணியமாகவும், முடிவை அருளாகவும் மாற்றுவது.",
      },
      {
        expect: "புதன் தசையை மிகச் சிலரே அடைகிறார்கள் — பரணிக்கு விம்சோத்தரி சுழற்சியின் இறுதி நிறைவு. இந்த மிக முதிர்ந்த வயதில், புதன் ஜாதகத்தில் வலுவாக இருந்தால், மன தெளிவு ஆச்சரியமாக இருக்கும். படைப்பு மற்றும் உணர்வு அனுபவத்தால் கூர்மை பெற்ற அறிவு இளைஞர்கள் அணுக முடியாத நுண்ணறிவை தருகிறது. கொள்ளுப் பேரக்குழந்தைகள் அல்லது ஆன்மீகத் தேடுபவர்களுடனான உரையாடல்கள் கற்பிக்க இயலாத ஒரு கடத்தல் தன்மையைக் கொண்டிருக்கும். இந்த தசை பெரும்பாலான பரணி ஜாதகர்களால் சாதாரண போக்கில் அனுபவிக்கப்படாது; அடைவோர் எதிர்பாராத அருளாகவே அடைகிறார்கள்.",
        navigate: "புதன் நரம்பு மண்டலம் மற்றும் தகவல் தொடர்பை நிர்வகிக்கிறார் — இந்த வயதில் தெளிவான பேச்சு, நினைவாற்றல், ஒருங்கிணைப்பு பராமரிப்பது முக்கிய கவலை. இலகுவான, தூண்டும் அறிவார்ந்த செயல்பாடு — வாசிப்பு, உரையாடல், இசை — ஈடுபாடின்மையை விட புதனின் திறனை நீண்டகாலம் உயிர்ப்புடன் வைக்கும். மனத் தெளிவை மங்கச் செய்யும் குளிர், ஈரமான சூழல்களையும் சுவாசச் சிரமத்தையும் தவிருங்கள்.",
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
  return <NatchathiramVisualContent data={BHARANI} visual={BHARANI_VISUAL} timings={dasaTimingsFor(BHARANI.number)} />;
}
