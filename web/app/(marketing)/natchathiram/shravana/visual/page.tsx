import type { Metadata } from "next";
import { withTamilTwin } from "@/lib/localized-metadata";
import { withDasaTimingHold } from "@/lib/natchathiram-dasa-hold";
import { dasaTimingsFor } from "@/lib/natchathiram-dasa-timings";
import { nakshatraDisplayName } from "@/lib/nakshatra-display-name";
import { natchathiramVisualTa } from "@/lib/marketing-seo-ta";
import { THIRUVONAM } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

const EN_METADATA: Metadata = {
  title: `${nakshatraDisplayName(THIRUVONAM.number, "en")} — Visual Profile`,
  description: "Visual profile of Thiruvonam Nakshathiram: personality traits, career strengths, dasa timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/shravana/visual" },
  openGraph: {
    title: `${nakshatraDisplayName(THIRUVONAM.number, "en")} — Visual Profile`,
    description: "Visual profile of Thiruvonam Nakshathiram: personality traits, career strengths, dasa timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/shravana/visual",
    type: "article",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withDasaTimingHold(await withTamilTwin(EN_METADATA, "/natchathiram/shravana/visual", natchathiramVisualTa("shravana")!), "shravana");
}

const SHRAVANA_VISUAL: NatchathiramVisualData = {
  atAGlance: [
    { label: "Deep Listening",           score: 98 },
    { label: "Wisdom Retention",         score: 97 },
    { label: "Devotional Intelligence",  score: 96 },
    { label: "Makara Discipline",        score: 95 },
    { label: "Vishnu's Grace",           score: 97 },
  ],

  radar: {
    labels: ["Listening", "Wisdom", "Devotion", "Discipline", "Service", "Patience"],
    values: [98, 97, 96, 95, 94, 96],
  },

  coreStrengths: [
    { symbol: "◎", label: "Deep Listening",           score: 98, desc: "Shravana means 'hearing' — and this is not the passive reception of sound but the active, devotional attention that hears not just words but the meaning beneath words, the silence between phrases, the deeper message that ordinary attention misses." },
    { symbol: "◈", label: "Wisdom Retention",         score: 97, desc: "What Shravana hears is not forgotten. The combination of deep listening and excellent retention produces the scholar who can reproduce and transmit what the wisdom tradition actually said, not a paraphrase or a reconstruction." },
    { symbol: "⚡", label: "Devotional Intelligence",  score: 96, desc: "Vishnu's nakshathiram — the preserver god's energy expressed as the intelligence that listens, retains, and transmits in order to preserve what is true and good across time." },
    { symbol: "♥", label: "Makara Discipline",        score: 95, desc: "Saturn's rasi gives Shravana the long-game patience and structural discipline that the work of listening and transmission requires. The scholar who hears everything and retains everything also has the patience to work with that material across decades." },
    { symbol: "△", label: "Vishnu's Preserving Grace", score: 97, desc: "The preserving aspect of the divine — not the creating fire of Brahma or the destroying force of Shiva but the sustaining, maintaining, protecting quality that keeps what is good alive across time — is Shravana's deepest function." },
    { symbol: "☽", label: "Humble Authority",         score: 94, desc: "The one who has truly listened to the great teachers carries an authority that is paradoxically humble — the deep knower who understands how much more there is to know, and who transmits not from ego but from genuine devotion to the tradition." },
  ],

  careerAbilities: [
    { label: "Academic Scholarship & Research",  score: 98 },
    { label: "Teaching & Knowledge Transmission", score: 97 },
    { label: "Counselling & Deep Listening",     score: 96 },
    { label: "Religious & Spiritual Service",    score: 97 },
    { label: "Music & Sound Arts",               score: 95 },
  ],
  careerNote: "Shravana excels wherever the capacity to truly listen — to hear what is actually being said beneath the surface — and to retain and transmit what has been heard with fidelity and care are the central requirements. They are the scholars, counsellors, religious transmitters, and musical intelligence workers who preserve and pass forward what the tradition has understood.",

  careerClusters: [
    { symbol: "◎", title: "Academic Scholarship & Research",  desc: "University scholarship, textual research, the careful transmission of what the tradition actually said — Shravana's deep listening and excellent retention at their most systematic." },
    { symbol: "◈", title: "Teaching & Knowledge Transmission", desc: "Teaching at all levels, particularly where the transmission of a tradition — rather than the innovation of new ideas — is the primary function. The teacher who has truly heard." },
    { symbol: "⚡", title: "Counselling & Psychotherapy",      desc: "Counselling, psychotherapy, and all forms of listening-based care — the Shravana gift of hearing what is actually being said, beneath the presented narrative." },
    { symbol: "♥", title: "Religious & Spiritual Service",    desc: "Priesthood, temple service, ashram work, and the institutional maintenance of religious traditions — Vishnu's preserving function applied to the sacred." },
    { symbol: "△", title: "Music, Sound, & Oral Transmission", desc: "Classical music, oral tradition transmission, sound healing — the nakshathiram of hearing finds its most direct expression in the domain of sound as preservation of meaning." },
    { symbol: "☽", title: "Library & Knowledge Systems",      desc: "Archival work, library science, knowledge management systems — the institutional structures that preserve what has been heard across generations." },
  ],

  modernApps: [
    { symbol: "◎", title: "Academic & Research Technology",    desc: "Scholarly research platforms, textual analysis tools, knowledge tradition preservation technology." },
    { symbol: "◈", title: "Education & Knowledge Transmission Tech", desc: "Teaching platforms, tradition transmission technology, educational continuity tools." },
    { symbol: "⚡", title: "Counselling & Mental Health Technology", desc: "Listening-based therapy platforms, counselling technology, deep attention mental health tools." },
    { symbol: "♥", title: "Religious & Spiritual Technology",  desc: "Temple management platforms, religious tradition technology, spiritual service applications." },
    { symbol: "△", title: "Music & Sound Technology",         desc: "Classical music platforms, oral tradition recording and preservation technology, sound healing applications." },
    { symbol: "☽", title: "Archive & Knowledge Systems Technology", desc: "Digital archival platforms, library technology, knowledge management and preservation systems." },
  ],

  dashaTimeline: [
    {
      planet: "Moon", theme: "Born to Listen",
      detail: {
        expect: "Shravana opens in Moon dasa — a beginning of unusual emotional receptivity, sensitivity, and the capacity to absorb the environment. Moon's is a short opening dasa, and the balance left at birth runs from long for births in the first pada to brief for the fourth; the range shown for this dasa gives it. The Shravana child hears everything: not just words but tones, undercurrents, the emotional textures of the household environment. This is the nakshathiram of hearing, and in Moon dasa the hearing function develops in its most absorptive and impressionable form. The family stories, the religious traditions, the songs and prayers of the household — everything heard in Moon dasa leaves a permanent impression on Shravana's memory and character. The first teacher who truly sees this child is a formative encounter; what they transmit in these years is retained across a lifetime.",
        navigate: "Moon's primary challenge for the young Shravana is the permeability that comes with deep listening — the child who hears everything also absorbs the emotional distortions, conflicts, and unresolved material of the environment as readily as the wisdom and the beauty. The family environment's emotional quality is more formative for Shravana in Moon dasa than for almost any other nakshathiram. The Moon–Saturn bhukti (the table below gives when it begins and how long it lasts) is a rasi lord sub-period flag: the early encounter with the patience, discipline, and structural intelligence that Saturn will govern in its own dasa later in life.",
        focus: "Monday Moon worship and deliberate provision of beautiful, wise, and emotionally healthy sound environments for the young Shravana. Scriptural recitation, classical music, and devotional singing in the home are uniquely formative. The Moon–Saturn bhukti (the bhukti table below gives when it begins and how long it lasts) is a rasi lord flag: a brief but memorable experience of Saturn's structuring quality — possibly a teacher, an encounter with institutional life, or the first serious encounter with the discipline that deep learning requires.",
      },
    },
    {
      planet: "Mars", theme: "Active Engagement",
      detail: {
        expect: "Mars dasa brings the directed fire and competitive energy of childhood's end and adolescence to Shravana's otherwise receptive and contemplative nature; it falls in childhood for the later padas and reaches into adolescence for the first. School years are engaged with Mars's characteristic intensity: the student who has been absorbing quietly in Moon dasa now applies that material with directed effort. The listening capacity is not lost in Mars dasa but gains an active dimension — the scholar who can also debate, defend, and apply what they have heard. Physical activity, sports, and the social competition of the school years all engage Shravana through Mars.",
        navigate: "Mars's primary challenge for Shravana is the tension between the receptive, listening character and the active, assertive energy Mars brings. The deep listener who is pushed by Mars to express, assert, and compete can find the directness of Mars's communication style genuinely uncomfortable — not because they cannot communicate but because the depth and care of what they want to say requires more space than Mars's pace allows. The Mars–Saturn bhukti (the table below gives when it begins and how long it lasts) carries the rasi lord's quality — a brief but significant encounter with discipline, patience, or the first serious institutional experience.",
        focus: "Tuesday Mars shrine prayers and the active cultivation of verbal expression and assertive communication alongside the deep listening that is Shravana's nature. The Mars–Saturn bhukti (the bhukti table below gives when it begins and how long it lasts) is a rasi lord flag: an early encounter with the patient, structured discipline that will define the Saturn dasa, the rasi lord's own period, later in life.",
      },
    },
    {
      planet: "Rahu", theme: "The Wide Hearing",
      detail: {
        expect: "Rahu dasa expands Shravana's listening and wisdom-retention capacities into the broadest possible field; it carries Shravana from school and adolescence into the first decades of adult life. University education — particularly in traditions that require deep engagement with texts, teachers, and the accumulated wisdom of a lineage — is the ideal domain for Rahu's expansion of Shravana's receptive intelligence. International study, cross-cultural exposure, and the encounter with traditions outside the birth lineage are common in Rahu dasa. Marriage and first professional establishment may fall within this dasa. A node carries no marriage significator of its own: where marriage falls in Rahu's dasa, it is read from Rahu's dispositor and from the seventh house and its lord, with Venus and Jupiter as the significators, not from Rahu itself, and judged from the individual horoscope as a tendency rather than a fixed time. The Rahu–Saturn bhukti (the table below gives when it begins and how long it lasts) is a particularly significant rasi lord sub-period flag.",
        navigate: "Rahu's primary challenge for Shravana is the expansion of the listening capacity into domains where the depth of hearing cannot be guaranteed — the person who has learned to hear deeply in a lineage context now encountering the noise and superficiality of the broader world, and the risk of hearing more volume with less depth. The Rahu–Saturn bhukti is a rasi lord flag — a significant encounter with Saturn's structuring, disciplining, and institutionalising quality.",
        focus: "Saturday Rahu shrine prayers and the deliberate maintenance of depth over breadth in the listening field. The Rahu–Saturn bhukti (the bhukti table below gives when it begins and how long it lasts) is a major rasi lord flag: Saturn arrives in Rahu's expansive field as a significant structuring encounter — a period of institutional engagement, major discipline, or the first serious encounter with the patient long game that defines the Shravana adult life.",
      },
    },
    {
      planet: "Jupiter", theme: "The Wisdom Distillation",
      detail: {
        expect: "Jupiter dasa, in mid-life, brings the great distillation of what Shravana has heard across decades of listening. The scholar and teacher now reaches the fullness of their first mature transmission period: the work that has been accumulated in Moon, Mars, and Rahu dasas is now organised, deepened, and transmitted with the authority of Jupiter's philosophical breadth and wisdom. Senior teaching positions, major publications, and the construction of the institutional frameworks that will carry Shravana's contribution forward are the natural expressions of Jupiter dasa. The Jupiter–Saturn bhukti (the table below gives when it begins and how long it lasts) is a major rasi lord sub-period flag — the most significant sub-period of Jupiter dasa for Shravana.",
        navigate: "Jupiter's primary challenge for Shravana is the philosophical inflation that can come with the authority of accumulated wisdom — the deep listener who has heard everything beginning to believe that they now know everything. The Shravana humility — the understanding that deep listening reveals how much more there is to hear — must be maintained even in Jupiter's fullness. The Jupiter–Saturn bhukti is a rasi lord flag — a period of major structural consolidation, institutional building, or the decisive encounter with the patient discipline that will characterise the rasi lord's own dasa.",
        focus: "Thursday Brihaspati worship and the deliberate maintenance of listening alongside transmission — the teacher who continues to hear. The Jupiter–Saturn bhukti (the bhukti table below gives when it begins and how long it lasts) is a major rasi lord flag: Saturn arrives in Jupiter's wise field as a powerful structuring, consolidating, and institutionally formative sub-period.",
      },
    },
    {
      planet: "Saturn", theme: "Rasi Lord — The Preservation Mastery",
      detail: {
        expect: "Saturn dasa is the rasi lord's arrival for Shravana. Saturn is the lord of your rasi, Makara — and his long dasa, arriving as Shravana enters the elder years of professional authority, is the period in which the patient, structured, long-game mastery of the preservation function reaches its fullness. The institutional work of preserving what has been heard — the academic institution, the religious tradition, the musical lineage, the counselling practice — now receives the full weight of Saturn's structural governance. Shravana in Saturn dasa is the elder scholar, the established teacher, the institutional guardian who has the patience to do the preservation work not for the immediate reward but for the generations who will come after.",
        navigate: "Saturn's primary challenge in the rasi lord dasa is the institutionalisation of what must remain alive — the preservation function becoming the controlling function, the guardian of the tradition becoming the one who refuses to let the tradition breathe or develop. The tradition must be preserved, but preserved in a living way — and this requires Saturn's discipline to include the willingness to let the tradition encounter the living present. Physical care and energy management are increasingly important across Saturn's long dasa.",
        focus: "Saturday Saturn worship, Shani puja, Hanuman worship, and the deliberate practice of serving the tradition rather than controlling it. The rasi lord's long dasa is best spent in active, humble transmission — the elder who continues to listen even while transmitting, who preserves by remaining genuinely open to what is being preserved.",
      },
    },
    {
      planet: "Mercury", theme: "The Articulate Elder",
      detail: {
        expect: "Mercury dasa, in the late years, brings the mind's precision and articulative capacity to Shravana's elder transmission. After Saturn's long institutional governance, Mercury offers the return of the scholar's pleasure in language, in the exact word, in the precise formulation. The listening capacity and the wisdom retention that have been accumulating since Moon's opening now express through Mercury's gift for clear, concise, and memorable articulation. For many Shravana, Mercury dasa produces the most enduring written or oral works of the life — the works that will still be heard after the person is gone.",
        navigate: "Physical care and the management of the nervous system's demands at this age. Mercury's pace can be demanding; deliberate rest and energy management are important. The Mercury–Saturn bhukti (the table below gives when it begins and how long it lasts) brings a brief rasi lord presence in the elder articulative period.",
        focus: "Wednesday Mercury worship and the active practice of writing, recording, and articulating the accumulated wisdom. The listening life speaks most clearly in Mercury dasa.",
      },
    },
    {
      planet: "Ketu", theme: "The Silence Returns",
      detail: {
        expect: "Ketu dasa, in very advanced age, brings the return of the silence from which the listening begins. After Mercury's articulative fullness, Ketu invites the elder Shravana to rest in the hearing without the transmission — to be present to what is, without the scholar's need to organise, retain, and pass it forward. For those who navigate this transition with Shravana's characteristic devotional grace, Ketu dasa is among the most spacious and deeply restful periods of the entire life.",
        navigate: "Complete and gentle physical care. Ketu at this age is a gift of simplicity — the stripping away of everything that was instrumental in service of the listening itself, leaving the listening alone.",
        focus: "Ganapati worship, pitru tharpanam and ancestral rites. The one who has spent a lifetime hearing now rests in the hearing that needs no content — the pure attention that Vishnu's nakshathiram always pointed toward.",
      },
    },
    {
      planet: "Venus", theme: "Final Beauty",
      detail: {
        expect: "Venus dasa, the last in this sequence, is reached by extraordinarily few Shravana souls. For those who arrive, Venus brings the final gift of beauty — the aesthetic grace and abundant warmth that make the elder's presence itself a form of generosity.",
        navigate: "Complete and devoted physical care. Venus at this extreme age is pure luminosity.",
        focus: "The beauty of the listening life, in its most distilled form, is simply the quality of attention — the presence that hears completely, without agenda, without judgment, without the need for anything other than what is.",
      },
    },
  ],

  spirituality: [
    {
      title: "Vishnu Worship & Preservation Traditions",
      desc: "Vishnu — the preserver, the sustainer, the one who holds what is good across time — is Shravana's presiding deity. Vishnu Sahasranama recitation, Ekadashi fasting, and the Vaishnava devotional traditions are Shravana's deepest spiritual expressions. The listening that Shravana practises professionally is practised devotionally in Vishnu worship as the listening to the thousand names of the divine.",
    },
    {
      title: "Guru Devotion & Lineage Transmission",
      desc: "The guru-shishya relationship — the student who listens with such depth that the transmission of the teacher's understanding can occur without distortion — is the highest expression of Shravana's spiritual capacity. The lineage itself is the sacred object of Shravana's devotion; the preservation of what the teacher truly transmitted is the devotional act.",
    },
    {
      title: "Classical Music & Sacred Sound",
      desc: "For Shravana, music — particularly the classical traditions of preserved, transmitted sound — is among the highest spiritual practices available. The raga, the mantra, the recited Vedic text: all are forms of sacred hearing that align with Shravana's deepest nature.",
    },
  ],

  guidance: "The one who hears truly hears not just what is said but what is meant, and not just what is meant but what is real. The listening that you carry is a form of love — the willingness to attend so completely to another that the other is genuinely known, not just processed. Vishnu preserves not by controlling but by sustaining: by remaining present through all the changes, by holding what is true across all the transformations. Be the one who hears — in your relationships, in your scholarship, in your devotion — and what you preserve will outlast you.",

  compatibleEn: ["Uthiradam", "Rohini", "Avittam", "Poosam", "Hastham"],
  compatibleNote: "These nakshatras complement Shravana's deep listening, wisdom retention, and devotional intelligence with structure, nurturing, and resonant devotion.",

  ta: {
    atAGlanceLabels: ["ஆழமான கேட்கும் திறன்", "ஞான தக்கவைப்பு", "பக்தி நுண்ணறிவு", "மகர ஒழுக்கம்", "விஷ்ணுவின் அருள்"],
    radarLabels: ["கேட்கும் திறன்", "ஞானம்", "பக்தி", "ஒழுக்கம்", "சேவை", "பொறுமை"],
    coreStrengths: [
      { label: "ஆழமான கேட்கும் திறன்",   desc: "திருவோணம் என்றால் 'கேட்கும் திறன்' — இது ஒலியின் செயலற்ற வரவேற்பு அல்ல ஆனால் வார்த்தைகளை மட்டுமல்ல வார்த்தைகளுக்கு கீழ் உள்ள அர்த்தம், சொற்றொடர்களுக்கு இடையிலான அமைதி, சாதாரண கவனம் தவறவிடும் ஆழமான செய்தியை கேட்கும் செயலில், பக்தியான கவனம்." },
      { label: "ஞான தக்கவைப்பு",           desc: "திருவோணம் கேட்பது மறக்கப்படவில்லை. ஆழமான கேட்கும் திறன் மற்றும் சிறந்த தக்கவைப்பு ஆகியவற்றின் கலவை ஞான மரபு உண்மையில் சொன்னதை, ஒரு சுருக்கம் அல்லது மறுகட்டுமானம் அல்ல, இனப்பெருக்கம் செய்யும் மற்றும் பரிமாறும் அறிஞரை உருவாக்குகிறது." },
      { label: "பக்தி நுண்ணறிவு",          desc: "விஷ்ணுவின் நட்சத்திரம் — காக்கும் கடவுளின் ஆற்றல் காலம் முழுவதும் உண்மையானதையும் நல்லதையும் பாதுகாக்க கேட்கும், தக்கவைக்கும் மற்றும் பரிமாறும் நுண்ணறிவாக வெளிப்படுகிறது." },
      { label: "மகர ஒழுக்கம்",             desc: "சனியின் ராசி திருவோணத்திற்கு நீண்ட-விளையாட்டு பொறுமை மற்றும் கட்டமைப்பு ஒழுக்கம் கொடுக்கிறது. கேட்கும் மற்றும் பரிமாற்றும் வேலை தசகங்களாக அந்த பொருட்களுடன் வேலை செய்யும் பொறுமையையும் கோருகிறது." },
      { label: "விஷ்ணுவின் காக்கும் அருள்", desc: "தெய்வீகத்தின் பாதுகாக்கும் அம்சம் — பிரம்மாவின் படைக்கும் நெருப்பு அல்ல அல்லது சிவாவின் அழிக்கும் சக்தி அல்ல ஆனால் நல்லதை காலம் முழுவதும் உயிரோடு வைத்திருக்கும் நிலைத்திருக்கும், பராமரிக்கும், பாதுகாக்கும் தரம் — திருவோணத்தின் ஆழமான செயல்பாடு." },
      { label: "தாழ்மையான அதிகாரம்",      desc: "மாபெரும் ஆசிரியர்களை உண்மையில் கேட்டவர் முரண்பாடாக தாழ்மையான அதிகாரத்தை சுமக்கிறார் — தெரிய எவ்வளவு அதிகம் உள்ளது என்பதை புரிந்துகொள்ளும் ஆழமான அறிந்தவர், மற்றும் அகங்காரத்திலிருந்து அல்ல ஆனால் மரபுக்கான உண்மையான பக்தியிலிருந்து பரிமாறுபவர்." },
    ],
    careerAbilityLabels: ["கல்வி அறிவியல் & ஆராய்ச்சி", "கற்பித்தல் & ஞான பரிமாற்றம்", "ஆலோசனை & ஆழமான கேட்கும் திறன்", "மத & ஆன்மீக சேவை", "இசை & ஒலி கலைகள்"],
    careerClusters: [
      { title: "கல்வி அறிவியல் & ஆராய்ச்சி",  desc: "பல்கலைக்கழக அறிவியல், நூலாசிரியர் ஆராய்ச்சி, மரபு உண்மையில் சொன்னதை கவனமாக பரிமாற்றுவது." },
      { title: "கற்பித்தல் & ஞான பரிமாற்றம்", desc: "எல்லா நிலைகளிலும் கற்பித்தல், குறிப்பாக ஒரு மரபின் பரிமாற்றம் — புதிய யோசனைகளின் கண்டுபிடிப்பை விட — முதன்மையான செயல்பாடு." },
      { title: "ஆலோசனை & மனோசிகிச்சை",    desc: "ஆலோசனை, மனோசிகிச்சை, மற்றும் கேட்கும் திறன் அடிப்படையிலான பராமரிப்பின் அனைத்து வடிவங்கள் — உண்மையில் சொல்லப்படுவதை கேட்கும் திருவோணம் கொடை." },
      { title: "மத & ஆன்மீக சேவை",         desc: "பாதிரியம், கோவில் சேவை, ஆசிரம் வேலை, மற்றும் மத மரபுகளின் நிறுவன பராமரிப்பு — புனிதமானதில் பயன்படுத்தப்படும் விஷ்ணுவின் காக்கும் செயல்பாடு." },
      { title: "இசை, ஒலி, & வாய்மொழி பரிமாற்றம்", desc: "பாரம்பரிய இசை, வாய்மொழி மரபு பரிமாற்றம், ஒலி சிகிச்சை — கேட்கும் திறன் நட்சத்திரம் அர்த்தத்தின் பாதுகாப்பாக ஒலியின் தளத்தில் மிகவும் நேரடியான வெளிப்பாடு காண்கிறது." },
      { title: "நூலகம் & ஞான அமைப்புகள்",  desc: "காப்பகம் வேலை, நூலக அறிவியல், ஞான மேலாண்மை அமைப்புகள் — தலைமுறைகளாக கேட்கப்பட்டதை பாதுகாக்கும் நிறுவன கட்டமைப்புகள்." },
    ],
    modernApps: [
      { title: "கல்வி & ஆராய்ச்சி தொழில்நுட்பம்",     desc: "அறிவியல் ஆராய்ச்சி தளங்கள், நூலாசிரியர் பகுப்பாய்வு கருவிகள், ஞான மரபு பாதுகாப்பு தொழில்நுட்பம்." },
      { title: "கல்வி & ஞான பரிமாற்றம் தொழில்நுட்பம்", desc: "கற்பித்தல் தளங்கள், மரபு பரிமாற்றம் தொழில்நுட்பம், கல்வி தொடர்ச்சி கருவிகள்." },
      { title: "ஆலோசனை & மனநல தொழில்நுட்பம்",      desc: "கேட்கும் திறன் அடிப்படையிலான சிகிச்சை தளங்கள், ஆலோசனை தொழில்நுட்பம், ஆழ கவனம் மனநல கருவிகள்." },
      { title: "மத & ஆன்மீக தொழில்நுட்பம்",          desc: "கோவில் மேலாண்மை தளங்கள், மத மரபு தொழில்நுட்பம், ஆன்மீக சேவை பயன்பாடுகள்." },
      { title: "இசை & ஒலி தொழில்நுட்பம்",            desc: "பாரம்பரிய இசை தளங்கள், வாய்மொழி மரபு பதிவு மற்றும் பாதுகாப்பு தொழில்நுட்பம், ஒலி சிகிச்சை பயன்பாடுகள்." },
      { title: "காப்பகம் & ஞான அமைப்புகள் தொழில்நுட்பம்", desc: "டிஜிட்டல் காப்பக தளங்கள், நூலக தொழில்நுட்பம், ஞான மேலாண்மை மற்றும் பாதுகாப்பு அமைப்புகள்." },
    ],
    dashaThemes: [
      "கேட்பதற்குப் பிறந்தவர் — சந்திர ஆரம்பம், உள்வாங்கும் உணர்திறன்",
      "செயலில் ஈடுபாடு — செவ்வாய் வெளிப்பாடு, விவாதிக்கும் திறன்",
      "விரிவான கேட்கும் திறன் — ராகு கல்வி, சர்வதேச வெளிப்பாடு",
      "ஞான வடிகட்டல் — குரு கற்பித்தல், முதிர் பரிமாற்றம்",
      "ராசி அதிபதி — பாதுகாப்புத் தேர்ச்சி — சனி தசை மகர ராசிக்கு",
      "தெளிவாக வெளிப்படுத்தும் மூத்தவர் — புதன் எழுத்து, மரபு",
      "அமைதி திரும்புகிறது — கேது கேட்கும் தனிமை",
      "இறுதி அழகு — சுக்கிர ஒளிர்வு",
    ],
    dashaDetails: [
      {
        expect: "திருவோணம் சந்திர தசையில் தொடங்குகிறது — அசாதாரண உணர்வு ஏற்புத்திறன், உணர்திறன், சூழலை உள்வாங்கும் ஆற்றல் ஆகியவற்றின் தொடக்கம். சந்திரன் குறுகிய தொடக்க தசை; பிறக்கும்போது மீதமுள்ள இருப்பு முதல் பாதத்தில் நீளமாகவும் நான்காம் பாதத்தில் சிறிதாகவும் இருக்கும் — இந்த தசைக்குக் காட்டப்படும் வரம்பு அதைச் சொல்கிறது. திருவோணக் குழந்தை எல்லாவற்றையும் கேட்கிறது: சொற்களை மட்டுமல்ல, தொனிகளை, அடியோட்டங்களை, வீட்டுச் சூழலின் உணர்வு அமைப்புகளை. இது கேட்கும் நட்சத்திரம்; சந்திர தசையில் கேட்கும் திறன் அதன் மிக உள்வாங்கும், மிகத் தாக்கம் ஏற்கும் வடிவில் வளர்கிறது. குடும்பக் கதைகள், சமய மரபுகள், வீட்டின் பாடல்களும் வழிபாடுகளும் — சந்திர தசையில் கேட்கப்படும் அனைத்தும் திருவோணத்தின் நினைவிலும் குணத்திலும் நிரந்தரத் தடம் பதிக்கின்றன. இந்தக் குழந்தையை உண்மையாகப் பார்க்கும் முதல் ஆசிரியர் ஒரு உருவாக்கும் சந்திப்பு; இந்த ஆண்டுகளில் அவர் கடத்துவது வாழ்நாள் முழுவதும் நினைவில் நிற்கிறது.",
        navigate: "இளம் திருவோணத்திற்கு சந்திரனின் முதன்மைச் சவால், ஆழ்ந்த கேட்பதுடன் வரும் ஊடுருவும் தன்மை — எல்லாவற்றையும் கேட்கும் குழந்தை, சூழலின் ஞானத்தையும் அழகையும் போலவே அதன் உணர்வு வக்கிரங்களையும் மோதல்களையும் தீராத விஷயங்களையும் எளிதில் உள்வாங்குகிறது. குடும்பச் சூழலின் உணர்வுத் தரம் சந்திர தசையில் திருவோணத்தை மற்ற எந்த நட்சத்திரத்தையும் விட அதிகமாக வடிவமைக்கிறது. சந்திர–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு ராசி அதிபதி துணைக் காலம் அடையாளம்: சனி பிற்காலத்தில் தன் சொந்த தசையில் ஆளப்போகும் பொறுமை, ஒழுக்கம், கட்டமைப்பு நுண்ணறிவுடன் ஆரம்பகாலச் சந்திப்பு.",
        focus: "திங்கட்கிழமை சந்திர வழிபாடும், இளம் திருவோணத்திற்கு அழகான, ஞானமுள்ள, உணர்வு ரீதியாக ஆரோக்கியமான ஒலிச் சூழலை வேண்டுமென்றே வழங்குவதும். வீட்டில் வேத பாராயணம், பாரம்பரிய இசை, பக்திப் பாடல் தனித்துவ வடிவமைப்பு விளைவுடையவை. சந்திர–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு ராசி அதிபதி அடையாளம்: சனியின் கட்டமைக்கும் தன்மையின் சுருக்கமான ஆனால் மறக்க முடியாத அனுபவம் — ஒருவேளை ஒரு ஆசிரியர், நிறுவன வாழ்வுடன் சந்திப்பு, அல்லது ஆழ்ந்த கற்றல் கோரும் ஒழுக்கத்துடன் முதல் தீவிரச் சந்திப்பு.",
      },
      {
        expect: "செவ்வாய் தசை திருவோணத்தின் மற்றபடி ஏற்கும், சிந்திக்கும் இயல்புக்கு குழந்தைப் பருவ முடிவு, வளரிளம் பருவத்தின் திசைப்பட்ட நெருப்பையும் போட்டி ஆற்றலையும் கொண்டுவருகிறது; பிந்தைய பாதங்களில் குழந்தைப் பருவத்திலும், முதல் பாதத்தில் வளரிளம் பருவம் வரையிலும் வருகிறது. பள்ளி ஆண்டுகள் செவ்வாயின் தனித்துவத் தீவிரத்துடன் ஈடுபடுகின்றன: சந்திர தசையில் அமைதியாக உள்வாங்கிய மாணவர் இப்போது அந்தப் பொருளை திசைப்பட்ட முயற்சியுடன் பயன்படுத்துகிறார். கேட்கும் ஆற்றல் செவ்வாய் தசையில் இழக்கப்படுவதில்லை; அது செயல்படும் பரிமாணத்தைப் பெறுகிறது — கேட்டதை விவாதிக்கவும், பாதுகாக்கவும், பயன்படுத்தவும் முடியும் அறிஞர். உடல் செயல்பாடு, விளையாட்டு, பள்ளிக் காலத்தின் சமூகப் போட்டி எல்லாம் செவ்வாய் வழியாக திருவோணத்தை ஈடுபடுத்துகின்றன.",
        navigate: "திருவோணத்திற்கு செவ்வாயின் முதன்மைச் சவால், ஏற்கும், கேட்கும் இயல்புக்கும் செவ்வாய் கொண்டுவரும் செயலில், உறுதியான ஆற்றலுக்கும் இடையிலான பதற்றம். வெளிப்படுத்த, வலியுறுத்த, போட்டியிடச் செவ்வாயால் தள்ளப்படும் ஆழ்ந்த கேட்பவர், செவ்வாயின் தொடர்பு பாணியின் நேரடித்தன்மையை உண்மையில் சங்கடமாகக் காணலாம் — அவர் தொடர்புகொள்ள முடியாததால் அல்ல, சொல்ல விரும்புவதன் ஆழமும் அக்கறையும் செவ்வாயின் வேகம் தரும் இடத்தை விட அதிக இடத்தைக் கோருவதால். செவ்வாய்–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ராசி அதிபதியின் தன்மையைக் கொண்டுவருகிறது — ஒழுக்கம், பொறுமை, அல்லது முதல் தீவிர நிறுவன அனுபவத்துடன் சுருக்கமான ஆனால் முக்கியமான சந்திப்பு.",
        focus: "செவ்வாய்க்கிழமை செவ்வாய் சன்னதி வழிபாடும், திருவோணத்தின் இயல்பான ஆழ்ந்த கேட்கும் திறனுடன் வாய்மொழி வெளிப்பாடு, உறுதியான தொடர்பைச் செயலில் வளர்ப்பதும். செவ்வாய்–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு ராசி அதிபதி அடையாளம்: பிற்காலத்தில் ராசி அதிபதியின் சொந்தக் காலமான சனி தசையை வரையறுக்கும் பொறுமையான, கட்டமைக்கப்பட்ட ஒழுக்கத்துடன் ஆரம்பகாலச் சந்திப்பு.",
      },
      {
        expect: "ராகு தசை திருவோணத்தின் கேட்கும், ஞானம் தக்கவைக்கும் ஆற்றல்களை மிகப் பரந்த சாத்தியமான களத்துக்கு விரிவாக்குகிறது; பள்ளி, வளரிளம் பருவத்திலிருந்து வயது வந்த வாழ்வின் முதல் தசகங்களுக்கு அழைத்துச் செல்கிறது. பல்கலைக்கழகக் கல்வி — குறிப்பாக நூல்கள், ஆசிரியர்கள், ஒரு பரம்பரையின் திரண்ட ஞானத்துடன் ஆழ்ந்த ஈடுபாடு கோரும் மரபுகளில் — திருவோணத்தின் ஏற்கும் நுண்ணறிவை ராகு விரிவாக்க ஏற்ற களம். சர்வதேசக் கல்வி, பண்பாடுகளுக்கிடையிலான வெளிப்பாடு, பிறந்த பரம்பரைக்கு வெளியே உள்ள மரபுகளுடன் சந்திப்பு ராகு தசையில் பொதுவானவை. திருமணமும் முதல் தொழில் நிறுவலும் இந்தத் தசைக்குள் அமையலாம். சாயாக் கிரகத்துக்குத் திருமணக் காரகத்துவம் இல்லை. ராகு தசைக்குள் திருமணம் அமைந்தால், அது ராகுவைக் கொண்டு அல்ல — ராகு நின்ற ராசியின் அதிபதி, ஜாதகத்தின் ஏழாம் வீடு, அதன் அதிபதி ஆகியவற்றைக் கொண்டு, சுக்கிரனையும் குருவையும் காரகர்களாகக் கொண்டு பார்க்கப்படுகிறது. அது ஒரு நிலையான காலம் அல்ல, ஒரு போக்கே. ராகு–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) குறிப்பாக முக்கியமான ராசி அதிபதி துணைக் காலம்.",
        navigate: "திருவோணத்திற்கு ராகுவின் முதன்மைச் சவால், கேட்கும் ஆற்றல் ஆழத்தை உத்தரவாதப்படுத்த முடியாத தளங்களுக்கு விரிவடைவது — பரம்பரைச் சூழலில் ஆழமாகக் கேட்கக் கற்றவர் இப்போது பரந்த உலகின் இரைச்சலையும் மேலோட்டத்தையும் சந்திப்பது; அதிக ஒலியளவு, குறைந்த ஆழத்துடன் கேட்கும் அபாயம். ராகு–சனி புக்தி ஒரு ராசி அதிபதி அடையாளம் — சனியின் கட்டமைக்கும், ஒழுங்குபடுத்தும், நிறுவனமயமாக்கும் தன்மையுடன் ஒரு முக்கிய சந்திப்பு.",
        focus: "சனிக்கிழமை ராகு சன்னதி வழிபாடும், கேட்கும் களத்தில் அகலத்தை விட ஆழத்தை வேண்டுமென்றே பேணுவதும். ராகு–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு முக்கிய ராசி அதிபதி அடையாளம்: ராகுவின் விரிந்த களத்தில் சனி ஒரு குறிப்பிடத்தக்க கட்டமைப்புச் சந்திப்பாக வருகிறார் — நிறுவன ஈடுபாடு, பெரிய ஒழுக்கம், அல்லது திருவோண வயது வந்த வாழ்வை வரையறுக்கும் பொறுமையான நீண்டகாலப் பார்வையுடன் முதல் தீவிரச் சந்திப்பின் காலம்.",
      },
      {
        expect: "நடுவயதில் வரும் குரு தசை, திருவோணம் பல தசகங்களாகக் கேட்டதன் மாபெரும் வடிகட்டலைக் கொண்டுவருகிறது. அறிஞரும் ஆசிரியரும் இப்போது தங்கள் முதல் முதிர்ந்த கடத்தல் காலத்தின் முழுமையை அடைகிறார்கள்: சந்திரன், செவ்வாய், ராகு தசைகளில் திரண்ட பணி இப்போது குருவின் தத்துவ அகலம், ஞானத்தின் அதிகாரத்துடன் ஒழுங்கமைக்கப்பட்டு, ஆழமாக்கப்பட்டு, கடத்தப்படுகிறது. மூத்த கற்பித்தல் பதவிகள், முக்கிய வெளியீடுகள், திருவோணத்தின் பங்களிப்பை முன்னெடுக்கும் நிறுவனச் சட்டகங்களைக் கட்டுதல் ஆகியவை குரு தசையின் இயல்பான வெளிப்பாடுகள். குரு–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு முக்கிய ராசி அதிபதி துணைக் காலம் — திருவோணத்திற்கு குரு தசையின் மிகக் குறிப்பிடத்தக்க துணைக் காலம்.",
        navigate: "திருவோணத்திற்கு குருவின் முதன்மைச் சவால், திரண்ட ஞானத்தின் அதிகாரத்துடன் வரும் தத்துவப் பெருக்கம் — எல்லாவற்றையும் கேட்ட ஆழ்ந்த கேட்பவர், இப்போது எல்லாவற்றையும் அறிந்துவிட்டதாக நம்பத் தொடங்குவது. ஆழ்ந்த கேட்பு இன்னும் எவ்வளவு கேட்க இருக்கிறது என்பதை வெளிப்படுத்துகிறது என்ற திருவோணப் பணிவு, குருவின் முழுமையிலும் பேணப்பட வேண்டும். குரு–சனி புக்தி ஒரு ராசி அதிபதி அடையாளம் — பெரிய கட்டமைப்பு ஒருங்கிணைப்பு, நிறுவனம் கட்டுதல், அல்லது ராசி அதிபதியின் சொந்த தசையை வகைப்படுத்தப்போகும் பொறுமையான ஒழுக்கத்துடன் தீர்மானமான சந்திப்பின் காலம்.",
        focus: "வியாழக்கிழமை பிருஹஸ்பதி வழிபாடும், கடத்துதலுடன் கேட்பதையும் வேண்டுமென்றே பேணுவதும் — தொடர்ந்து கேட்கும் ஆசிரியர். குரு–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு முக்கிய ராசி அதிபதி அடையாளம்: குருவின் ஞானக் களத்தில் சனி சக்திவாய்ந்த கட்டமைக்கும், ஒருங்கிணைக்கும், நிறுவன ரீதியாக வடிவமைக்கும் துணைக் காலமாக வருகிறார்.",
      },
      {
        expect: "சனி தசை திருவோணத்திற்கு ராசி அதிபதியின் வருகை. சனி உங்கள் ராசியான மகரத்தின் அதிபதி — தொழில்முறை அதிகாரத்தின் மூத்த ஆண்டுகளில் திருவோணம் நுழையும்போது வரும் அவரது நீண்ட தசை, பாதுகாக்கும் பணியின் பொறுமையான, கட்டமைக்கப்பட்ட, நீண்டகாலத் தேர்ச்சி தன் முழுமையை அடையும் காலம். கேட்டவற்றைப் பாதுகாக்கும் நிறுவனப் பணி — கல்வி நிறுவனம், சமய மரபு, இசைப் பரம்பரை, ஆலோசனைப் பயிற்சி — இப்போது சனியின் கட்டமைப்பு ஆட்சியின் முழு எடையைப் பெறுகிறது. சனி தசையில் திருவோணம் மூத்த அறிஞர், நிறுவப்பட்ட ஆசிரியர், உடனடி பலனுக்காக அல்ல, வரப்போகும் தலைமுறைகளுக்காகப் பாதுகாக்கும் பணியைச் செய்யும் பொறுமை கொண்ட நிறுவன காவலர்.",
        navigate: "ராசி அதிபதி தசையில் சனியின் முதன்மைச் சவால், உயிருடன் இருக்க வேண்டியதை நிறுவனமயமாக்குவது — பாதுகாக்கும் பணி கட்டுப்படுத்தும் பணியாக மாறுவது, மரபின் காவலர் மரபு சுவாசிக்கவோ வளரவோ விடாமல் மறுப்பவராக மாறுவது. மரபு பாதுகாக்கப்பட வேண்டும், ஆனால் உயிருடன் பாதுகாக்கப்பட வேண்டும் — இதற்கு சனியின் ஒழுக்கம் மரபு உயிருள்ள நிகழ்காலத்தைச் சந்திக்க அனுமதிக்கும் மனதையும் உள்ளடக்க வேண்டும். சனியின் நீண்ட தசை முழுவதும் உடல் பராமரிப்பும் ஆற்றல் மேலாண்மையும் அதிகரித்து முக்கியமாகின்றன.",
        focus: "சனிக்கிழமை சனி வழிபாடு, சனி பூஜை, ஆஞ்சநேயர் வழிபாடு, மரபை ஆள்வதை விட அதற்குச் சேவை செய்யும் வேண்டுமென்ற பழக்கம். ராசி அதிபதியின் நீண்ட தசை செயலில், தாழ்மையான கடத்தலில் சிறப்பாகச் செலவிடப்படுகிறது — கடத்தும்போதும் தொடர்ந்து கேட்கும் மூத்தவர், பாதுகாக்கப்படுவதற்குத் தொடர்ந்து உண்மையாகத் திறந்திருப்பதன் மூலம் பாதுகாப்பவர்.",
      },
      {
        expect: "பிற்கால ஆண்டுகளில் வரும் புதன் தசை, திருவோணத்தின் மூத்த கடத்தலுக்கு மனதின் துல்லியத்தையும் தெளிவாக வெளிப்படுத்தும் திறனையும் கொண்டுவருகிறது. சனியின் நீண்ட நிறுவன ஆட்சிக்குப் பிறகு, புதன் அறிஞரின் மொழி இன்பம், சரியான சொல், துல்லிய வடிவம் ஆகியவற்றின் திரும்புதலை வழங்குகிறது. சந்திரனின் தொடக்கத்திலிருந்து திரண்டு வந்த கேட்கும் ஆற்றலும் ஞானத் தக்கவைப்பும் இப்போது புதனின் தெளிவான, சுருக்கமான, நினைவில் நிற்கும் வெளிப்பாட்டுக் கொடை வழியாக வெளிப்படுகின்றன. பல திருவோணங்களுக்கு, புதன் தசை வாழ்வின் மிக நீடித்த எழுத்து அல்லது வாய்மொழிப் படைப்புகளை உருவாக்குகிறது — நபர் போன பிறகும் கேட்கப்படும் படைப்புகள்.",
        navigate: "இந்த வயதில் உடல் பராமரிப்பும் நரம்பு மண்டலத்தின் கோரிக்கைகளின் மேலாண்மையும். புதனின் வேகம் கோருவதாக இருக்கலாம்; வேண்டுமென்றே ஓய்வும் ஆற்றல் மேலாண்மையும் முக்கியம். புதன்–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மூத்த வெளிப்படுத்தும் காலத்தில் சுருக்கமான ராசி அதிபதி இருப்பைக் கொண்டுவருகிறது.",
        focus: "புதன்கிழமை புதன் வழிபாடு. திரட்டப்பட்ட ஞானத்தை எழுத்து, பதிவு செய்தல், வெளிப்படுத்தல் ஆகியவற்றில் தீவிர ஈடுபாடு.",
      },
      {
        expect: "மிக முதிர்ந்த வயதில் வரும் கேது தசை, கேட்கும் திறன் தொடங்கும் அமைதியின் திரும்புதலைக் கொண்டுவருகிறது. புதனின் வெளிப்படுத்தும் முழுமைக்குப் பிறகு, கடத்தல் இல்லாமல் கேட்பதில் ஓய்வெடுக்க — இருப்பதோடு இருக்க, ஒழுங்கமைக்கவும் தக்கவைக்கவும் முன்னெடுக்கவும் அறிஞர் உணரும் தேவையின்றி — மூத்த திருவோணத்தைக் கேது அழைக்கிறது. திருவோணத்தின் இயல்பான பக்தி அருளுடன் இந்த மாற்றத்தைக் கடப்பவர்களுக்கு, கேது தசை முழு வாழ்வின் மிக விசாலமான, ஆழ்ந்த ஓய்வு தரும் காலங்களில் ஒன்று.",
        navigate: "முழுமையான மற்றும் மென்மையான உடல் பராமரிப்பு. இந்த வயதில் கேது எளிமையின் கொடை.",
        focus: "விநாயகர் வழிபாடு, பித்ரு தர்ப்பணம், முன்னோர் சடங்குகள். ஒரு வாழ்நாள் கேட்பவர் இப்போது உள்ளடக்கம் தேவையில்லாத கேட்கும் திறனில் ஓய்கிறார்.",
      },
      {
        expect: "இந்த வரிசையின் கடைசி தசையான சுக்கிர தசையை அசாதாரணமாகச் சில திருவோண ஆத்மாக்கள் மட்டுமே அடைகின்றன. வருபவர்களுக்கு, சுக்கிரன் அழகின் இறுதிக் கொடையைக் கொண்டுவருகிறார் — மூத்தவரின் இருப்பையே தாராளத்தின் ஒரு வடிவமாக்கும் அழகியல் நளினமும் செழிப்பான அரவணைப்பும்.",
        navigate: "முழுமையான, அர்ப்பணிப்புடன் கூடிய உடல் பராமரிப்பு. இந்த மிக முதிர்ந்த வயதில் சுக்கிரன் தூய ஒளிர்வு.",
        focus: "கேட்கும் வாழ்வின் அழகு, அதன் மிகக் காய்ச்சி வடித்த வடிவில், வெறுமனே கவனத்தின் தரம் — எதிர்பார்ப்பின்றி, தீர்ப்பின்றி, இருப்பதைத் தவிர வேறு எதுவும் தேவையின்றி முழுமையாகக் கேட்கும் இருப்பு.",
      },
    ],
    spirituality: [
      { title: "விஷ்ணு வழிபாடு & பாதுகாப்பு மரபுகள்",  desc: "விஷ்ணு — காப்பவர், தாங்குபவர், காலம் முழுவதும் நல்லதை வைத்திருப்பவர் — திருவோணத்தின் தலைமை தெய்வம். விஷ்ணு சஹஸ்ரநாம பாராயணம், ஏகாதசி விரதம், மற்றும் வைஷ்ணவ பக்தி மரபுகள் திருவோணத்தின் ஆழமான ஆன்மீக வெளிப்பாடுகள்." },
      { title: "குரு பக்தி & வம்சம் பரிமாற்றம்",        desc: "குரு-சிஷ்ய உறவு — ஆசிரியரின் புரிதலின் பரிமாற்றம் திரிபு இல்லாமல் ஏற்படும் வகையில் மிகவும் ஆழமாக கேட்கும் மாணவர் — திருவோணத்தின் ஆன்மீக திறனின் உயர்ந்த வெளிப்பாடு." },
      { title: "பாரம்பரிய இசை & புனித ஒலி",            desc: "திருவோணத்திற்கு, இசை — குறிப்பாக பாதுகாக்கப்பட்ட, பரிமாற்றப்பட்ட ஒலியின் பாரம்பரிய மரபுகள் — கிடைக்கும் மிக உயர்ந்த ஆன்மீக நடைமுறைகளில் ஒன்று. ராகம், மந்திரம், பாராயணம் செய்யப்பட்ட வேத நூல்: அனைத்தும் திருவோணத்தின் ஆழமான தன்மையுடன் இணங்கும் புனித கேட்கும் வடிவங்கள்." },
    ],
    guidance: "உண்மையில் கேட்பவர் சொல்லப்படுவதை மட்டுமல்ல அர்த்தப்படுத்தப்படுவதையும், அர்த்தப்படுத்தப்படுவதை மட்டுமல்ல உண்மையானதையும் கேட்கிறார். நீங்கள் சுமக்கும் கேட்கும் திறன் அன்பின் ஒரு வடிவம் — மற்றொருவரிடம் மிகவும் முழுமையாக கவனிக்கும் விருப்பம், இதனால் மற்றவர் உண்மையில் அறியப்படுகிறார், வெறும் செயலாக்கப்படுவதில்லை. விஷ்ணு கட்டுப்படுத்துவதன் மூலம் அல்ல ஆனால் நிலைத்திருப்பதன் மூலம் பாதுகாக்கிறார்: எல்லா மாற்றங்களிலும் நிகழ்காலத்தில் இருப்பதன் மூலம், எல்லா மாற்றங்களிலும் உண்மையானதை வைத்திருப்பதன் மூலம். கேட்பவராக இருங்கள் — உங்கள் உறவுகளில், உங்கள் அறிவியலில், உங்கள் பக்தியில் — மற்றும் நீங்கள் பாதுகாப்பது உங்களை விட நீடிக்கும்.",
    careerNote: "உண்மையில் கேட்கும் திறன் — மேற்பரப்பிற்கு கீழ் உண்மையில் சொல்லப்படுவதை கேட்பது — மற்றும் கேட்கப்பட்டதை நம்பகத்தன்மையுடன் மற்றும் கவனத்துடன் தக்கவைத்து பரிமாறும் திறன் ஆகியவை மையத் தேவைகளாக இருக்கும் இடங்களில் திருவோணம் சிறப்பாக செயல்படுகிறது.",
    modernLead: "திருவோணத்தின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "ஆழமான கேட்கும் திறன், ஞான தக்கவைப்பு, பக்தி நுண்ணறிவு திருவோணத்தின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function ShravanaVisualPage() {
  return <NatchathiramVisualContent data={THIRUVONAM} visual={SHRAVANA_VISUAL} timings={dasaTimingsFor(THIRUVONAM.number)} />;
}
