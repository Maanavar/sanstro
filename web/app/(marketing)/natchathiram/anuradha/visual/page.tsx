import type { Metadata } from "next";
import { withTamilTwin } from "@/lib/localized-metadata";
import { withDasaTimingHold } from "@/lib/natchathiram-dasa-hold";
import { dasaTimingsFor } from "@/lib/natchathiram-dasa-timings";
import { nakshatraDisplayName } from "@/lib/nakshatra-display-name";
import { natchathiramVisualTa } from "@/lib/marketing-seo-ta";
import { ANURADHA } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

const EN_METADATA: Metadata = {
  title: `${nakshatraDisplayName(ANURADHA.number, "en")} — Visual Profile`,
  description: "Visual profile of Anusham Nakshathiram: personality traits, career strengths, dasa timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/anuradha/visual" },
  openGraph: {
    title: `${nakshatraDisplayName(ANURADHA.number, "en")} — Visual Profile`,
    description: "Visual profile of Anusham Nakshathiram: personality traits, career strengths, dasa timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/anuradha/visual",
    type: "article",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withDasaTimingHold(await withTamilTwin(EN_METADATA, "/natchathiram/anuradha/visual", natchathiramVisualTa("anuradha")!), "anuradha");
}

const ANURADHA_VISUAL: NatchathiramVisualData = {
  atAGlance: [
    { label: "Devotional Depth",        score: 96 },
    { label: "Friendship & Loyalty",    score: 95 },
    { label: "Organisational Mastery",  score: 92 },
    { label: "Spiritual Intelligence",  score: 93 },
    { label: "Transformative Resilience", score: 91 },
  ],

  radar: {
    labels: ["Devotion", "Friendship", "Organisation", "Spirituality", "Resilience", "Balance"],
    values: [96, 95, 92, 93, 91, 90],
  },

  coreStrengths: [
    { symbol: "◎", label: "Devotional Depth",           score: 96, desc: "Mitra's child — Anuradha's capacity for friendship, loyalty, and devotion is not a personality trait but a spiritual gift." },
    { symbol: "◈", label: "Loyalty & Friendship",       score: 95, desc: "The friend who stays — in every season of life, in every circumstance, Anuradha honours the covenant of relationship." },
    { symbol: "⚡", label: "Organisational Intelligence", score: 92, desc: "The group that Anuradha builds — whether family, team, or community — works because Anuradha attends to the relational fabric that holds it." },
    { symbol: "♥", label: "Spiritual Intelligence",     score: 93, desc: "Scorpio's depth joined to Mitra's light — Anuradha's spiritual perception reaches into dimensions others do not easily access." },
    { symbol: "△", label: "Transformative Resilience",  score: 91, desc: "The lotus blooms in deep water — Anuradha transforms through difficulty rather than being broken by it." },
    { symbol: "☽", label: "Diplomatic Balance",         score: 90, desc: "Mitra is the god of agreements — Anuradha brings people into covenant, holds them there with love, and mediates when the covenant is stressed." },
  ],

  careerAbilities: [
    { label: "Leadership & Group Facilitation", score: 96 },
    { label: "Counselling & Spiritual Work",    score: 95 },
    { label: "International Relations",         score: 92 },
    { label: "Research & Investigation",        score: 91 },
    { label: "Medicine & Healing",              score: 93 },
  ],
  careerNote: "Anuradha thrives wherever building covenants of trust, holding groups together through difficulty, and applying deep devotional intelligence to human relationships and systems are the central work.",

  careerClusters: [
    { symbol: "◎", title: "Leadership & Community Building", desc: "Organisations, communities, groups — Anuradha's relational intelligence building what lasts." },
    { symbol: "◈", title: "Counselling & Spiritual Guidance", desc: "Therapy, pastoral care, spiritual direction — the depth of Mitra's devotion meeting human need." },
    { symbol: "⚡", title: "International Relations & Diplomacy", desc: "Cross-cultural work, international partnerships, diplomatic service." },
    { symbol: "♥", title: "Research & Investigative Work",   desc: "Depth research, psychological investigation, the pursuit of hidden truth." },
    { symbol: "△", title: "Medicine & Healing Arts",         desc: "Medical practice, psychiatric care, integrative healing — the Vrischika depth applied to restoration." },
    { symbol: "☽", title: "Performing Arts & Devotional Music", desc: "Music, dance, devotional arts — the expression of Mitra's covenant in aesthetic form." },
  ],

  modernApps: [
    { symbol: "◎", title: "Community Platforms & Social Impact", desc: "Community building technology, social impact platforms, group facilitation tools." },
    { symbol: "◈", title: "Mental Health & Counselling Tech",    desc: "Therapy platforms, pastoral care applications, spiritual community technology." },
    { symbol: "⚡", title: "International Collaboration Tools",  desc: "Cross-cultural partnership platforms, diplomatic technology, international community tools." },
    { symbol: "♥", title: "Research & Deep Investigation",       desc: "Investigative research platforms, psychological analysis tools, truth-seeking technology." },
    { symbol: "△", title: "Integrative Healthcare",              desc: "Holistic health platforms, psychiatric care technology, depth healing applications." },
    { symbol: "☽", title: "Devotional Music & Arts Tech",        desc: "Sacred music platforms, devotional content creation, spiritual performing arts." },
  ],

  dashaTimeline: [
    {
      planet: "Saturn", theme: "Born into the Covenant",
      detail: {
        expect: "Anuradha opens in Saturn dasa — a formative, serious, and character-building beginning for the nakshathiram of Mitra, whose gift is the covenant of friendship and devotion. Saturn's is a long dasa, and the balance left at birth runs from long for births in the first pada to short for the fourth; the range shown for this dasa gives it. Childhood often involves early exposure to responsibility, community obligation, or the seriousness of care — a family environment that expects maturity, a household where service and loyalty are not merely values but lived practice. Brihaspati's lotus and Mitra's bond are planted together in Saturn's disciplined soil. Where the balance runs through the school years, the result is a student of unusual depth of friendship — the person who remembers birthdays, who checks on the quiet child, who maintains relationships across years when others lose touch. Where it reaches adolescence, the first serious tests of loyalty arrive and the deepest early friendships form.",
        navigate: "Saturn's long opening can produce in Anuradha an early gravity — the child who feels the weight of relationship more keenly than their years justify, who carries others' pain with a thoroughness that is as depleting as it is beautiful. The capacity for devotion that Saturn develops is Anuradha's supreme gift and also its primary vulnerability: the person who gives devotion so completely that they are left depleted when it is not reciprocated. Physical concerns: spine, joints, cold-related conditions, and skin. The Saturn–Rahu bhukti (the table below gives when it begins and how long it lasts; for the shorter balances it falls before birth) is the most turbulent sub-period.",
        focus: "Saturday Saturn worship, Hanuman worship and deliberate cultivation of boundaries around the devotional capacity — learning that Mitra's covenant is honoured best when both parties give and receive, not when one gives completely and the other merely takes. Also watch the Saturn–Mars bhukti (the bhukti table below gives when it begins and how long it lasts; for the shorter balances it has already passed before birth). Mars is the lord of your rasi, Vrischika — this sub-period carries the rasi lord's intensity, assertiveness, and transformative energy to its first expression. Where it falls after birth, a dramatic period of unusual energy, assertiveness, or family transformation often lands in this window.",
      },
    },
    {
      planet: "Mercury", theme: "The Covenant Finds Its Voice",
      detail: {
        expect: "Mercury dasa brings Anuradha's relational intelligence into communicative and analytical expression; it begins anywhere from childhood to the close of adolescence, by pada, and runs on through the formative years of adult life. Higher education establishes in psychology, medicine, international relations, counselling, social work, or research — all domains where Anuradha's depth of human understanding finds professional application. Career foundations are laid with the characteristic combination of analytical precision and relational warmth. Where marriage falls within this dasa, it is read from the seventh house and its lord, with Venus and Jupiter as the natural significators, and judged from the individual horoscope as a tendency rather than a fixed time. The community and professional network Anuradha builds in Mercury dasa — through the quality of friendship extended and the reputation for loyalty established — serves as the social foundation for everything that follows.",
        navigate: "Mercury's primary challenge for Anuradha is not intellect but discernment: the capacity to apply the same analytical precision to relationships that they apply to professional problems. The tendency to forgive too quickly, to maintain loyalty past the point where the other person has honoured their side of the covenant, must be tempered by Mercury's discernment. The Mercury–Rahu bhukti (the table below gives when it begins and how long it lasts) can bring unusual professional developments.",
        focus: "Wednesday worship and deliberate cultivation of relational discernment — the wisdom to know when a covenant has been broken and when holding it further serves neither party. Also watch the Mercury–Mars bhukti (the bhukti table below gives when it begins and how long it lasts). Mars as rasi lord brings a brief but potent window of intense drive, assertive professional action, and transformative energy to Mercury dasa. Position the most ambitious early career commitment for this window.",
      },
    },
    {
      planet: "Ketu", theme: "The Inward Covenant",
      detail: {
        expect: "Ketu dasa redirects the devotional capacity of Anuradha's first decades toward the ultimate covenant — the relationship with the divine. The same intensity that has been applied to friendship and professional relationship turns inward; Anuradha in Ketu dasa often discovers a depth of spiritual practice that surprises even themselves. For those who have been intermittently spiritual, Ketu dasa produces a sustained commitment. For those already committed, it produces a deepening that reaches dimensions previously inaccessible.",
        navigate: "Ketu's withdrawal from social engagement can feel disorienting to Anuradha, whose entire identity has been relational. The person whose gift is the covenant of friendship must navigate a period in which the deepest covenant is interior. Physical concerns: nervous system, autoimmune vulnerabilities, and digestive sensitivity. The Ketu–Venus bhukti (the table below gives when it begins and how long it lasts) brings relational warmth and creative expression as a counterpoint to the austerity.",
        focus: "Ganapati worship, Ketu shrine visits, pitru tharpanam, and intense sacred practice — scripture study, devotional music, sustained meditation, or a formal spiritual commitment. The inward covenant Anuradha discovers in Ketu dasa is not a retreat from Mitra's relational nature but its most intimate expression.",
      },
    },
    {
      planet: "Venus", theme: "The Flowering Covenant",
      detail: {
        expect: "Venus dasa brings the most outwardly abundant and relationally rich period of Anuradha's life. The devotional depth of Saturn, the analytical intelligence of Mercury, and the spiritual intensity of Ketu all converge in Venus's abundant relational expression. Career leadership in the chosen domain reaches its peak; the community and professional network built across the earlier decades now manifests its full generative power. Where the dasa runs late into life, grandchildren may arrive toward its end; the family that Anuradha has been the relational anchor of reflects back the years of sustained devotion. Creative or devotional artistic expression — music, writing, community service as art — reaches its fullest form.",
        navigate: "Venus dasa's primary health concerns for Anuradha are cardiovascular, kidney function, and hormonal. The relational warmth that Venus amplifies must be balanced with personal boundaries that the earlier dedication to others may have not always maintained. The Venus–Saturn bhukti (the table below gives when it begins and how long it lasts) demands careful pacing.",
        focus: "Friday Lakshmi worship, rose and jasmine offerings, and the deliberate enjoyment of beauty and relational warmth as spiritual practice in its own right. Also watch the Venus–Mars bhukti (the bhukti table below gives when it begins and how long it lasts). Mars as rasi lord brings a brief window of intense, transformative relational and professional energy in the midst of Venus's otherwise smooth abundance. Significant career transformation, a major relational milestone, or a health matter requiring attention often arrives in this window.",
      },
    },
    {
      planet: "Sun", theme: "Solar Recognition",
      detail: {
        expect: "Sun dasa, in the later years, brings a final, radiant quality of recognition — the covenants of friendship and devotion that Anuradha has honoured across the decades are seen clearly and appreciated by those who have benefited. Professional honours, community recognition, and the particular gratitude of those who have been loved well by Anuradha arrive in this short dasa.",
        navigate: "Cardiovascular and general vitality deserve particular physical attention in Sun dasa. The recognition that arrives should not be allowed to reawaken the achieving drive at the expense of rest. The Sun–Saturn bhukti (the table below gives when it begins and how long it lasts) demands deliberate pacing.",
        focus: "Sunday Surya worship and Aditya Hridayam recitation. Mitra's child, who has honoured friendship and devotion with Scorpio's depth, arrives in the Sun's recognition having fulfilled the deepest purpose.",
      },
    },
    {
      planet: "Moon", theme: "Tidal Devotion",
      detail: {
        expect: "Moon dasa, in advanced age, brings the tidal, oceanic expression of Anuradha's lifelong devotional capacity. Grandchildren and great-grandchildren receive a quality of presence — completely available, completely attentive, completely loving — that is the distillation of a lifetime of Mitra's covenant. For those in spiritual or pastoral roles, Moon dasa produces the most deeply received ministry of the entire lifetime.",
        navigate: "Moon dasa's health concerns at this age are fluid balance, memory, and emotional sensitivity. The deep feeling that Moon amplifies in Anuradha must be supported with daily structure — morning prayer, regular rhythm, and the consistent presence of loving caregivers. The Moon–Saturn bhukti (the table below gives when it begins and how long it lasts) is the most physically demanding sub-period.",
        focus: "Monday Moon worship, water offerings, white flowers, and sustained presence with those who need to receive without giving back. The covenant Anuradha has honoured all their life is, in Moon dasa, given its most complete expression.",
      },
    },
    {
      planet: "Mars", theme: "Rasi Lord — The Final Transformation",
      detail: {
        expect: "Mars dasa, in advanced age, is the rasi lord's arrival for Anuradha. Mars is the lord of your rasi, Vrischika — this makes his dasa doubly charged for Anuradha natives. The Vrischika depth, the capacity to transform through the most difficult waters, and the Mars-fire that has energised Anuradha's devotion throughout the life now reach their most concentrated and essential form. The final transformation is not a physical one but a spiritual one — the recognition of what the covenant was always about. Friends and family members receive from Anuradha in Mars dasa a quality of loving directness — the warmth of Mitra with the clarity of Vrischika's fire — that is among the rarest and most precious gifts a person can offer.",
        navigate: "Physical care at this age is primary. Mars dasa's energy manifests as clarity of will and loving directness, not physical vigour. The Mars–Rahu bhukti (the table below gives when it begins and how long it lasts) can bring a brief period of unusual restlessness or family complexity; navigate with Anuradha's characteristic patient depth.",
        focus: "Tuesday Mars shrine prayers and red flower offerings. The rasi lord's final dasa is not a closing but a completion — the full expression of Vrischika's transformative capacity in the form of love that does not flinch.",
      },
    },
    {
      planet: "Rahu", theme: "Dissolution into the Covenant",
      detail: {
        expect: "Rahu dasa, in very advanced age, is reached by few. For those Anuradha souls who arrive here, Rahu brings the final dissolution — not of the covenant but of the separation between the one who makes covenants and the one with whom all covenants are ultimately made. Mitra's child returns to Mitra.",
        navigate: "Complete, gentle physical care. The unusual circumstances that Rahu brings in youth become, at this age, the unusual grace of a consciousness that has loved deeply and is now releasing into the love that underlies all covenants.",
        focus: "Rahu shrine prayers, coconut offerings, and the presence of those who have been Anuradha's deepest friends and devotees. The lotus closes, the deep water receives it, and the covenant continues beyond form.",
      },
    },
  ],

  spirituality: [
    {
      title: "Mitra & Sun Worship",
      desc: "Mitra, the Aditya of friendship and agreement, is Anuradha's presiding deity — Sunday Surya worship, Mitra Mantra recitation, and the practice of friendship and devotion as an explicitly spiritual act are the deepest devotional expressions.",
    },
    {
      title: "Vrischika Depth Practices",
      desc: "Scorpio's Mars governs Anuradha's transformative power — Kartikeya worship, Kali devotion, and depth practices (intensive fasting, night-vigil prayer, esoteric study) that match the Vrischika nature are powerfully resonant.",
    },
    {
      title: "Lotus Temples & Deep Water Shrines",
      desc: "Temples associated with the lotus — Padmanabhaswamy, Padmavathi, and water-source Devi shrines — carry special resonance for Anuradha. The practice of offering flowers — especially the lotus — at sacred water sources is Mitra's devotional signature.",
    },
  ],

  guidance: "The covenant you keep with others is a reflection of the covenant you keep with yourself. Mitra's gift is only fully expressed when the friendship you extend to the world is first extended to your own deepest nature. Love with Scorpio's depth — completely, without reservation, and with the clear-eyed awareness that transformation is the nature of all deep water. The lotus blooms precisely because it grows in the deep.",

  compatibleEn: ["Visakam", "Uthiram", "Poosam", "Kettai", "Hastham"],
  compatibleNote: "These nakshatras complement Anuradha's devotional depth, loyalty, and spiritual intelligence with goal-determination, nurturing warmth, and complementary depth.",

  ta: {
    atAGlanceLabels: ["பக்தி ஆழம்", "நட்பு & விசுவாசம்", "நிறுவன தேர்ச்சி", "ஆன்மீக நுண்ணறிவு", "மாற்றும் மீள்தன்மை"],
    radarLabels: ["பக்தி", "நட்பு", "நிறுவனம்", "ஆன்மீகம்", "மீள்தன்மை", "சமநிலை"],
    coreStrengths: [
      { label: "பக்தி ஆழம்",             desc: "மித்ரனின் பிள்ளை — அனுஷத்தின் நட்பு, விசுவாசம், பக்தி திறன் ஒரு ஆளுமை குணம் அல்ல, ஒரு ஆன்மீக கொடை." },
      { label: "விசுவாசம் & நட்பு",       desc: "நிலைத்திருக்கும் நண்பர் — வாழ்வின் ஒவ்வொரு பருவத்திலும், ஒவ்வொரு சூழ்நிலையிலும், அனுஷம் உறவின் உடன்படிக்கையை மதிக்கிறார்." },
      { label: "நிறுவன நுண்ணறிவு",       desc: "அனுஷ ஜாதகர் அதை இயக்கும் உறவுப் பின்னலைக் கவனித்துக்கொள்வதால், அவர் கட்டும் குழு — குடும்பம், குழு, அல்லது சமூகம் — செயல்படுகிறது." },
      { label: "ஆன்மீக நுண்ணறிவு",        desc: "விருச்சிகத்தின் ஆழம் மித்ரனின் ஒளியுடன் சேரும் — அனுஷத்தின் ஆன்மீக கண்ணோட்டம் மற்றவர்கள் எளிதில் அணுகாத பரிமாணங்களில் ஆழ்கிறது." },
      { label: "மாற்றும் மீள்தன்மை",     desc: "தாமரை ஆழமான நீரில் மலர்கிறது — அனுஷம் கஷ்டங்களால் உடைக்கப்படுவதற்கு பதில் அவற்றின் மூலம் மாறுகிறார்." },
      { label: "இராஜதந்திர சமநிலை",      desc: "மித்ரன் ஒப்பந்தங்களின் கடவுள் — அனுஷம் மக்களை உடன்படிக்கைக்கு கொண்டு வருகிறார், அன்புடன் அங்கே நடத்துகிறார், உடன்படிக்கை மன அழுத்தத்திற்கு உட்படும் போது மத்தியஸ்தம் செய்கிறார்." },
    ],
    careerAbilityLabels: ["தலைமை & குழு வழிகாட்டல்", "ஆலோசனை & ஆன்மீக வேலை", "சர்வதேச உறவுகள்", "ஆராய்ச்சி & விசாரணை", "மருத்துவம் & குணப்படுத்தல்"],
    careerClusters: [
      { title: "தலைமை & சமூக கட்டுவது",   desc: "நிறுவனங்கள், சமூகங்கள், குழுக்கள் — நீடிக்கும் கட்டமைப்பை கட்டும் அனுஷத்தின் உறவு நுண்ணறிவு." },
      { title: "ஆலோசனை & ஆன்மீக வழிகாட்டல்", desc: "சிகிச்சை, ஆசாரிய பராமரிப்பு, ஆன்மீக திசை — மனித தேவையை சந்திக்கும் மித்ரனின் பக்தியின் ஆழம்." },
      { title: "சர்வதேச உறவுகள் & இராஜதந்திரம்", desc: "கலாசார குறுக்கு வேலை, சர்வதேச கூட்டாண்மைகள், இராஜதந்திர சேவை." },
      { title: "ஆராய்ச்சி & விசாரணை வேலை", desc: "ஆழமான ஆராய்ச்சி, உளவியல் விசாரணை, மறைந்த உண்மையை தேடல்." },
      { title: "மருத்துவம் & குணப்படுத்தல் கலைகள்", desc: "மருத்துவ நடைமுறை, மனநல பராமரிப்பு, ஒருங்கிணைந்த குணப்படுத்தல் — மீட்டெடுத்தலுக்கு பயன்படுத்தப்படும் விருச்சிக ஆழம்." },
      { title: "செயல்திறன் கலை & பக்தி இசை", desc: "இசை, நடனம், பக்தி கலைகள் — அழகியல் வடிவில் மித்ரனின் உடன்படிக்கையின் வெளிப்பாடு." },
    ],
    modernApps: [
      { title: "சமூக தளங்கள் & சமூக தாக்கம்", desc: "சமூக கட்டுவது தொழில்நுட்பம், சமூக தாக்க தளங்கள், குழு வழிகாட்டல் கருவிகள்." },
      { title: "மனநல & ஆலோசனை தொழில்நுட்பம்", desc: "சிகிச்சை தளங்கள், ஆசாரிய பராமரிப்பு பயன்பாடுகள், ஆன்மீக சமூக தொழில்நுட்பம்." },
      { title: "சர்வதேச ஒத்துழைப்பு கருவிகள்", desc: "கலாசார குறுக்கு கூட்டாண்மை தளங்கள், இராஜதந்திர தொழில்நுட்பம், சர்வதேச சமூக கருவிகள்." },
      { title: "ஆராய்ச்சி & ஆழமான விசாரணை",   desc: "விசாரணை ஆராய்ச்சி தளங்கள், உளவியல் பகுப்பாய்வு கருவிகள், உண்மை-தேடும் தொழில்நுட்பம்." },
      { title: "ஒருங்கிணைந்த சுகாதாரம்",        desc: "ஒட்டுமொத்த சுகாதார தளங்கள், மனநல பராமரிப்பு தொழில்நுட்பம், ஆழமான குணப்படுத்தல் பயன்பாடுகள்." },
      { title: "பக்தி இசை & கலை தொழில்நுட்பம்", desc: "புனித இசை தளங்கள், பக்தி உள்ளடக்க படைப்பு, ஆன்மீக செயல்திறன் கலை." },
    ],
    dashaThemes: [
      "உடன்படிக்கையில் பிறப்பு — சனி ஆரம்பம், ஆரம்பகால விசுவாசம், பக்தி அடித்தளம்",
      "உடன்படிக்கை குரல் காண்கிறது — புதன் தொடர்பு, தொழில் நிறுவல்",
      "உள்நோக்கிய உடன்படிக்கை — கேது ஆன்மீக ஆழம், பக்தி திரும்பல்",
      "மலர்ந்த உடன்படிக்கை — சுக்கிர செழிப்பு, தொழில் உச்சம்",
      "சூரிய அங்கீகாரம் — ஒளிர்ந்த விசுவாசம்",
      "அலைபோல் எழும் பக்தி — சந்திரனின் கடல் வெளிப்பாடு",
      "ராசி அதிபதி — இறுதி மாற்றம் — செவ்வாய் தசை விருச்சிக ராசிக்கு",
      "உடன்படிக்கையில் கரைதல் — ராகு இறுதி முடிவு",
    ],
    dashaDetails: [
      {
        expect: "அனுஷம் சனி தசையில் தொடங்குகிறார் — நட்பு, பக்தி என்ற உடன்படிக்கையைக் கொடையாகக் கொண்ட மித்ரனின் நட்சத்திரத்துக்கு உருவாக்கும், தீவிரமான, குணம் கட்டும் தொடக்கம். சனி நீண்ட தசை; பிறக்கும்போது மீதமுள்ள இருப்பு முதல் பாதத்தில் நீளமாகவும் நான்காம் பாதத்தில் குறுகியதாகவும் இருக்கும் — இந்த தசைக்குக் காட்டப்படும் வரம்பு அதைச் சொல்கிறது. குழந்தைப் பருவம் அடிக்கடி ஆரம்பகாலப் பொறுப்பு, சமூகக் கடமை, அக்கறையின் தீவிரத்துடன் வருகிறது — முதிர்ச்சியை எதிர்பார்க்கும் குடும்பச் சூழல், சேவையும் விசுவாசமும் மதிப்புகளாக மட்டுமல்லாமல் வாழ்ந்து காட்டப்படும் வீடு. பிருஹஸ்பதியின் தாமரையும் மித்ரனின் பிணைப்பும் சனியின் ஒழுக்க மண்ணில் ஒன்றாக விதைக்கப்படுகின்றன. இருப்பு பள்ளிக் காலம் முழுவதும் நீளுமானால் அசாதாரண நட்பு ஆழம் கொண்ட மாணவர் உருவாகிறார் — பிறந்தநாள்களை நினைவில் வைப்பவர், அமைதியான குழந்தையை விசாரிப்பவர், மற்றவர்கள் தொடர்பிழக்கும்போதும் ஆண்டுகள் கடந்து உறவுகளைப் பேணுபவர். வளரிளம் பருவம் வரை நீண்டால் விசுவாசத்தின் முதல் தீவிரச் சோதனைகள் வந்து, ஆழமான ஆரம்பகால நட்புகள் உருவாகின்றன.",
        navigate: "சனியின் நீண்ட தொடக்கம் அனுஷத்திடம் ஆரம்பகால கனத்தை உருவாக்கலாம் — தன் வயதுக்கு மீறிய அளவு உறவின் எடையை உணரும் குழந்தை, மற்றவர்களின் வலியை அழகாகவும் களைப்பாகவும் ஒருசேர முழுமையாகச் சுமக்கும் குழந்தை. சனி வளர்க்கும் பக்தித் திறன் அனுஷத்தின் மிக உயர்ந்த கொடை; அதுவே முதன்மையான பாதிப்பும் — பக்தியை முழுமையாகக் கொடுத்து, அது திருப்பித் தரப்படாதபோது வற்றிப்போகும் நபர். உடல் கவலைகள்: முதுகெலும்பு, மூட்டுகள், குளிர் தொடர்பான நிலைகள், தோல். சனி–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்; குறைந்த இருப்பில் அது பிறப்புக்கு முன்பே வந்துவிடும்) மிகவும் கலக்கமான துணைக் காலம்.",
        focus: "சனிக்கிழமை சனி வழிபாடு, ஆஞ்சநேயர் வழிபாடு, பக்தித் திறனைச் சுற்றி வேண்டுமென்றே வரம்புகளை வளர்ப்பது — மித்ரனின் உடன்படிக்கை ஒருவர் முழுமையாகக் கொடுத்து மற்றவர் எடுத்துக்கொள்வதில் அல்ல, இரு தரப்பும் கொடுத்துப் பெறும்போதுதான் சிறப்பாக மதிக்கப்படுகிறது என்பதைக் கற்றல். கவனிக்கவும்: சனி–செவ்வாய் புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்; குறைந்த இருப்பில் அது பிறப்புக்கு முன்பே கடந்துவிடும்). செவ்வாய் உங்கள் ராசியான விருச்சிகத்தின் அதிபதி — இந்த துணைக் காலம் ராசி அதிபதியின் தீவிரம், உறுதிப்பாடு, மாற்றும் ஆற்றலை முதல் முறையாக வெளிப்படுத்துகிறது. இது பிறப்புக்குப் பின் வருமானால், அசாதாரண ஆற்றல், உறுதி அல்லது குடும்ப மாற்றத்தின் நாடகத்தனமான காலம் இந்த சாளரத்தில் அடிக்கடி வரும்.",
      },
      {
        expect: "புதன் தசை அனுஷத்தின் உறவு நுண்ணறிவை தொடர்பு, பகுப்பாய்வு வெளிப்பாட்டுக்குக் கொண்டுவருகிறது; பாதத்தைப் பொறுத்து குழந்தைப் பருவத்திலோ வளரிளம் பருவத்தின் முடிவிலோ தொடங்கி, வயது வந்த வாழ்வின் உருவாக்க ஆண்டுகள் வழியாகச் செல்கிறது. உயர் கல்வி உளவியல், மருத்துவம், சர்வதேச உறவுகள், ஆலோசனை, சமூகப் பணி அல்லது ஆராய்ச்சியில் நிலைபெறுகிறது — அனுஷத்தின் மனித புரிதலின் ஆழம் தொழில் பயன்பாட்டைக் காணும் துறைகள் இவை. பகுப்பாய்வுத் துல்லியமும் உறவு அரவணைப்பும் இணைந்த இயல்புடன் தொழில் அடித்தளம் இடப்படுகிறது. இந்தத் தசைக்குள் திருமணம் அமைந்தால், அது ஜாதகத்தின் ஏழாம் வீட்டையும் அதன் அதிபதியையும் கொண்டு பார்க்கப்படுகிறது; சுக்கிரனும் குருவும் அதன் இயல்பான காரகர்கள். அது ஒரு நிலையான காலம் அல்ல, ஒரு போக்கே. புதன் தசையில் அனுஷம் கட்டும் சமூக, தொழில் வலைப்பின்னல் — அவர் நீட்டிய நட்பின் தரம், நிலைநாட்டிய விசுவாசப் புகழ் — அடுத்து வரும் அனைத்துக்கும் சமூக அடித்தளமாகிறது.",
        navigate: "அனுஷத்துக்கு புதனின் முதன்மைச் சவால் அறிவு அல்ல, பகுத்தறிவு: தொழில் பிரச்சினைகளுக்குப் பயன்படுத்தும் அதே பகுப்பாய்வுத் துல்லியத்தை உறவுகளுக்கும் பயன்படுத்தும் ஆற்றல். மிக விரைவாக மன்னிப்பதும், மற்றவர் தன் பங்கை நிறைவேற்றாத நிலையைத் தாண்டியும் விசுவாசத்தைப் பேணுவதும் புதனின் பகுத்தறிவால் சமன் செய்யப்பட வேண்டும். புதன்–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) அசாதாரண தொழில் மாற்றங்களைக் கொண்டுவரலாம்.",
        focus: "புதன்கிழமை வழிபாடும், உறவு பகுத்தறிவை வேண்டுமென்றே வளர்ப்பதும் — ஒரு உடன்படிக்கை எப்போது முறிந்தது, அதை மேலும் பிடித்துக்கொள்வது இரு தரப்புக்கும் பயன் தராது என்பதை அறியும் ஞானம். கவனிக்கவும்: புதன்–செவ்வாய் புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்). செவ்வாய் ராசி அதிபதியாக புதன் தசைக்குள் தீவிர உந்துதல், உறுதியான தொழில் செயல்பாடு, மாற்றும் ஆற்றலின் குறுகிய ஆனால் சக்திவாய்ந்த சாளரத்தைக் கொண்டுவருகிறது. மிகவும் இலட்சியமான ஆரம்பகால தொழில் அர்ப்பணத்தை இந்த சாளரத்துக்கு நிலைநிறுத்துங்கள்.",
      },
      {
        expect: "கேது தசை அனுஷத்தின் முதல் தசகங்களின் பக்தித் திறனை இறுதி உடன்படிக்கை — தெய்வத்துடனான உறவு — நோக்கித் திருப்புகிறது. நட்புக்கும் தொழில் உறவுக்கும் பயன்படுத்திய அதே தீவிரம் உள்நோக்கித் திரும்புகிறது; கேது தசையில் அனுஷம் தாமே வியக்கும் ஆன்மீகப் பயிற்சியின் ஆழத்தைக் கண்டுபிடிக்கிறார். இடைவிட்டு ஆன்மீகத்தில் இருந்தவர்களுக்கு கேது தசை நீடித்த அர்ப்பணிப்பைத் தருகிறது; ஏற்கனவே உறுதியுடன் இருப்பவர்களுக்கு முன்பு எட்ட முடியாத பரிமாணங்களை அடையும் ஆழத்தைத் தருகிறது.",
        navigate: "சமூக ஈடுபாட்டிலிருந்து கேதுவின் விலகல், அடையாளம் முழுவதும் உறவு சார்ந்த அனுஷத்துக்கு திசைமாறிய உணர்வைத் தரலாம். நட்பு என்ற உடன்படிக்கையைக் கொடையாகக் கொண்டவர், ஆழ்ந்த உடன்படிக்கை உள்ளே இருக்கும் காலத்தைக் கடக்க வேண்டும். உடல் கவலைகள்: நரம்பு மண்டலம், தன்னெதிர்ப்பு பாதிப்புகள், செரிமான உணர்திறன். கேது–சுக்கிர புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) கடுமைக்கு எதிர்ப்புள்ளியாக உறவு அரவணைப்பையும் படைப்பு வெளிப்பாட்டையும் கொண்டுவருகிறது.",
        focus: "விநாயகர் வழிபாடு, கேது சன்னதி வழிபாடு, பித்ரு தர்ப்பணம், தீவிர புனித அனுஷ்டானம். அனுஷம் கேது தசையில் கண்டுபிடிக்கும் உள்நோக்கிய உடன்படிக்கை மித்ரனின் உறவு இயல்பிலிருந்து திரும்புவது அல்ல, அதன் மிகவும் நெருக்கமான வெளிப்பாடு.",
      },
      {
        expect: "சுக்கிர தசை அனுஷத்தின் வாழ்க்கையின் வெளிப்படையாக மிகச் செழிப்பான, உறவுகளால் வளமான காலத்தைக் கொண்டுவருகிறது. சனியின் பக்தி ஆழம், புதனின் பகுப்பாய்வு நுண்ணறிவு, கேதுவின் ஆன்மீகத் தீவிரம் அனைத்தும் சுக்கிரனின் செழிப்பான உறவு வெளிப்பாட்டில் ஒன்றுசேர்கின்றன. தேர்ந்த துறையில் தொழில் தலைமை உச்சம் அடைகிறது; முந்தைய தசகங்களில் கட்டிய சமூக, தொழில் வலைப்பின்னல் இப்போது தன் முழு உருவாக்கும் சக்தியை வெளிப்படுத்துகிறது. தசை வாழ்வின் பிற்பகுதிக்கு நீளுமானால், அதன் முடிவை நோக்கி பேரக்குழந்தைகள் வரலாம்; அனுஷம் உறவு நங்கூரமாக இருந்த குடும்பம் ஆண்டுகளான நீடித்த பக்தியை எதிரொலிக்கிறது. படைப்பு அல்லது பக்தி கலை வெளிப்பாடு — இசை, எழுத்து, கலையாக சமூகப் பணி — தன் முழு வடிவத்தை அடைகிறது.",
        navigate: "அனுஷத்துக்கு சுக்கிர தசையின் முதன்மை ஆரோக்கிய கவலைகள் இதய-இரத்தக் குழாய், சிறுநீரக செயல்பாடு, ஹார்மோன். சுக்கிரன் பெருக்கும் உறவு அரவணைப்பு, பிறருக்கான முந்தைய அர்ப்பணிப்பு எப்போதும் காக்காத தனிப்பட்ட எல்லைகளுடன் சமநிலைப்படுத்தப்பட வேண்டும். சுக்கிர–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) கவனமான வேகத்தைக் கோருகிறது.",
        focus: "வெள்ளிக்கிழமை லட்சுமி வழிபாடு, ரோஜா, மல்லிகை அர்ப்பணம், அழகையும் உறவு அரவணைப்பையும் அவையே ஆன்மீகப் பயிற்சியாக வேண்டுமென்றே அனுபவிப்பது. கவனிக்கவும்: சுக்கிர–செவ்வாய் புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்). ராசி அதிபதி செவ்வாய் சுக்கிரனின் மற்றபடி சீரான செழிப்பின் நடுவே தீவிரமான, மாற்றும் உறவு மற்றும் தொழில் ஆற்றலின் குறுகிய சாளரத்தைக் கொண்டுவருகிறார். முக்கியமான தொழில் மாற்றம், ஒரு பெரிய உறவு மைல்கல், அல்லது கவனம் தேவைப்படும் ஆரோக்கிய விஷயம் இந்த சாளரத்தில் அடிக்கடி வரும்.",
      },
      {
        expect: "பிற்கால ஆண்டுகளில் வரும் சூரிய தசை அங்கீகாரத்தின் இறுதி, ஒளிரும் தரத்தைக் கொண்டுவருகிறது — அனுஷம் பல தசகங்களாக மதித்த நட்பு, பக்தி உடன்படிக்கைகள் பயனடைந்தவர்களால் தெளிவாகப் பார்க்கப்பட்டுப் பாராட்டப்படுகின்றன. தொழில் கௌரவம், சமூக அங்கீகாரம், அனுஷத்தால் நன்கு நேசிக்கப்பட்டவர்களின் தனிப்பட்ட நன்றி — இந்த குறுகிய தசையில் வருகின்றன.",
        navigate: "சூரிய தசையில் இதய-இரத்தக் குழாய் ஆரோக்கியம், பொதுவான உயிர்ச்சக்தி குறிப்பிட்ட உடல் கவனம் தேவை. வரும் அங்கீகாரம் ஓய்வை இழந்து சாதிக்கும் உந்துதலை மீண்டும் எழுப்ப விடக்கூடாது. சூரிய–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) வேண்டுமென்றே வேகத்தைக் குறைக்கக் கோருகிறது.",
        focus: "ஞாயிற்றுக்கிழமை சூரிய வழிபாடு. மித்ரனின் பிள்ளை, நட்பு மற்றும் பக்தியை விருச்சிகத்தின் ஆழத்துடன் மதித்தவர், சூரியனின் அங்கீகாரத்தில் வந்து சேர்கிறார்.",
      },
      {
        expect: "முதிர்ந்த வயதில் வரும் சந்திர தசை அனுஷத்தின் வாழ்நாள் பக்தித் திறனின் அலைபோன்ற, கடல்போன்ற வெளிப்பாட்டைக் கொண்டுவருகிறது. பேரக்குழந்தைகளும் கொள்ளுப் பேரக்குழந்தைகளும் — முழுமையாகக் கிடைக்கும், முழுமையாகக் கவனிக்கும், முழுமையாக நேசிக்கும் — ஒரு இருப்பைப் பெறுகிறார்கள்; அது ஒரு வாழ்நாள் மித்ரன் உடன்படிக்கையின் சாரம். ஆன்மீக அல்லது மேய்ப்புப் பணிகளில் உள்ளவர்களுக்கு சந்திர தசை ஒரு வாழ்நாளிலேயே மிக ஆழமாக ஏற்கப்படும் சேவையை உருவாக்குகிறது.",
        navigate: "இந்த வயதில் சந்திர தசையின் ஆரோக்கிய கவலைகள் திரவ சமநிலை, நினைவாற்றல், உணர்வு உணர்திறன். சந்திரன் அனுஷத்தில் பெருக்கும் ஆழ்ந்த உணர்வு தினசரி கட்டமைப்பால் — காலை வழிபாடு, ஒழுங்கான தாளம், அன்பான பராமரிப்பாளர்களின் நிலையான இருப்பு — ஆதரிக்கப்பட வேண்டும். சந்திர–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மிகவும் உடல் ரீதியாகக் கோரும் துணைக் காலம்.",
        focus: "திங்கட்கிழமை சந்திர வழிபாடு, நீர் அர்ப்பணம், வெள்ளை பூக்கள். அனுஷம் வாழ்நாளில் மதித்த உடன்படிக்கை சந்திர தசையில் அதன் மிகவும் முழுமையான வெளிப்பாட்டை பெறுகிறது.",
      },
      {
        expect: "முதிர்ந்த வயதில் வரும் செவ்வாய் தசை அனுஷத்துக்கு ராசி அதிபதியின் வருகை. செவ்வாய் உங்கள் ராசியான விருச்சிகத்தின் அதிபதி — இது அனுஷம் ஜாதகர்களுக்கு இரட்டை வலிமையுடன் வருகிறது. விருச்சிக ஆழம், மிகக் கடினமான நீர்களிலும் மாறும் திறன், வாழ்நாள் முழுவதும் அனுஷத்தின் பக்தியை ஊக்குவித்த செவ்வாய் நெருப்பு ஆகியவை இப்போது தங்கள் மிகவும் குவிந்த, அத்தியாவசிய வடிவத்தை அடைகின்றன. இறுதி மாற்றம் உடல் மாற்றம் அல்ல, ஆன்மீக மாற்றம் — உடன்படிக்கை எப்போதும் எதைப் பற்றியது என்ற உணர்தல். செவ்வாய் தசையில் அனுஷம் நண்பர்களுக்கும் குடும்பத்தினருக்கும் அன்பான நேரடித்தன்மையைத் தருகிறார் — மித்ரனின் அரவணைப்புடன் விருச்சிக நெருப்பின் தெளிவு; ஒருவர் தரக்கூடிய அரிதான, மிக விலைமதிப்பற்ற கொடைகளில் ஒன்று.",
        navigate: "இந்த வயதில் உடல் பராமரிப்பு முதன்மை. செவ்வாய் தசையின் ஆற்றல் உடல் வலிமையாக அல்ல, விருப்பத் தெளிவாகவும் அன்பான நேரடித்தன்மையாகவும் வெளிப்படுகிறது. செவ்வாய்–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) சுருக்கமான அசாதாரண அமைதியின்மை அல்லது குடும்பச் சிக்கலைக் கொண்டுவரலாம்; அனுஷத்தின் இயல்பான பொறுமையான ஆழத்துடன் அதைக் கடக்கவும்.",
        focus: "செவ்வாய்க்கிழமை செவ்வாய் சன்னதி வழிபாடு மற்றும் சிவப்பு பூ அர்ப்பணம். ராசி அதிபதியின் இறுதி தசை ஒரு முடிவு அல்ல, ஒரு நிறைவு — விருச்சிகத்தின் மாற்றும் திறனின் முழு வெளிப்பாடு அன்பு வடிவில்.",
      },
      {
        expect: "மிகமிக முதிர்ந்த வயதில் வரும் ராகு தசையைச் சிலர் மட்டுமே அடைகிறார்கள். இங்கு வரும் அனுஷம் ஆத்மாக்களுக்கு, ராகு இறுதிக் கரைதலைக் கொண்டுவருகிறார் — உடன்படிக்கையின் கரைதல் அல்ல, உடன்படிக்கை செய்பவருக்கும் எல்லா உடன்படிக்கைகளும் இறுதியில் யாருடன் செய்யப்படுகின்றனவோ அவருக்கும் இடையிலான பிரிவின் கரைதல். மித்ரனின் பிள்ளை மித்ரனிடமே திரும்புகிறது.",
        navigate: "முழுமையான, மென்மையான உடல் பராமரிப்பு. இளமையில் ராகு கொண்டுவரும் அசாதாரண சூழ்நிலைகள் இந்த வயதில், ஆழமாக நேசித்து இப்போது எல்லா உடன்படிக்கைகளுக்கும் அடியில் உள்ள அன்பில் விடுபடும் ஒரு உணர்வு நிலையின் அசாதாரண அருளாக மாறுகின்றன.",
        focus: "ராகு சன்னதி வழிபாடு, தேங்காய் அர்ப்பணம், அனுஷத்தின் ஆழ்ந்த நண்பர்களும் பக்தர்களுமான மனிதர்களின் இருப்பு. தாமரை மூடுகிறது, ஆழ்ந்த நீர் அதை ஏற்கிறது, உடன்படிக்கை வடிவத்தைக் கடந்தும் தொடர்கிறது.",
      },
    ],
    spirituality: [
      { title: "மித்ர & சூரிய வழிபாடு",          desc: "நட்பு மற்றும் ஒப்பந்தத்தின் ஆதித்யனான மித்ரன் அனுஷத்தின் தலைமை தெய்வம் — ஞாயிற்றுக்கிழமை சூரிய வழிபாடு, மித்ர மந்திர பாராயணம், நட்பு மற்றும் பக்தியை வெளிப்படையான ஆன்மீகச் செயலாகக் கடைப்பிடிப்பது ஆழமான பக்தி வெளிப்பாடுகள்." },
      { title: "விருச்சிக ஆழப் பயிற்சிகள்",       desc: "விருச்சிகத்தின் செவ்வாய் அனுஷத்தின் மாற்றும் சக்தியை நிர்வகிக்கிறார் — கார்த்திகேய வழிபாடு, காளி பக்தி, ஆழமான பயிற்சிகள் (தீவிர விரதம், இரவு விழிப்பு பிரார்த்தனை, சாஸ்திர பாராயணம்) ஆகியவை ஆழமாக ஒத்திசைகின்றன." },
      { title: "தாமரை கோவில்கள் & ஆழமான நீர் தலங்கள்", desc: "தாமரையுடன் தொடர்புடைய கோவில்கள் — பத்மநாபஸ்வாமி, பத்மாவதி, நீர்-ஆதார தேவி சன்னதிகள் — அனுஷத்துக்குச் சிறப்புத் தொடர்பு கொண்டுள்ளன. புனித நீர் நிலைகளில் மலர்கள் — குறிப்பாக தாமரை — அர்ப்பணிப்பது மித்ரனின் பக்தி அடையாளம்." },
    ],
    guidance: "மற்றவர்களுடன் நீங்கள் வைத்திருக்கும் உடன்படிக்கை உங்களுடன் நீங்கள் வைத்திருக்கும் உடன்படிக்கையின் பிரதிபலிப்பு. மித்ரனின் கொடை முழுமையாக வெளிப்படுகிறது விரிந்து செல்லும் நட்பு முதலில் உங்கள் சொந்த ஆழமான இயல்பிற்கு விரிவடையும் போது. விருச்சிகத்தின் ஆழத்துடன் நேசியுங்கள் — முழுமையாக, தடையின்றி, ஆழமான நீரின் இயல்பு மாற்றம் என்ற தெளிவான கண்ணோட்டத்துடன். தாமரை ஆழத்தில் வளருவதால் மட்டுமே மலர்கிறது.",
    careerNote: "நம்பிக்கையின் உடன்படிக்கைகளை கட்டுவது, கஷ்டங்களில் குழுக்களை ஒன்றாக நடத்துவது, மனித உறவுகள் மற்றும் அமைப்புகளுக்கு ஆழமான பக்தி நுண்ணறிவை பயன்படுத்துவது மையப் பணிகளாக இருக்கும் இடங்களில் அனுஷம் சிறப்பாக செயல்படுகிறார்.",
    modernLead: "அனுஷத்தின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "பக்தி ஆழம், விசுவாசம், ஆன்மீக நுண்ணறிவு அனுஷத்தின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function AnuradhaVisualPage() {
  return <NatchathiramVisualContent data={ANURADHA} visual={ANURADHA_VISUAL} timings={dasaTimingsFor(ANURADHA.number)} />;
}
