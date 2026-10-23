import type { Metadata } from "next";
import { withTamilTwin } from "@/lib/localized-metadata";
import { withDasaTimingHold } from "@/lib/natchathiram-dasa-hold";
import { dasaTimingsFor } from "@/lib/natchathiram-dasa-timings";
import { nakshatraDisplayName } from "@/lib/nakshatra-display-name";
import { natchathiramVisualTa } from "@/lib/marketing-seo-ta";
import { PUSHYA } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

const EN_METADATA: Metadata = {
  title: `${nakshatraDisplayName(PUSHYA.number, "en")} — Visual Profile`,
  description: "Visual profile of Poosam Nakshathiram: personality traits, career strengths, dasa timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/pushya/visual" },
  openGraph: {
    title: `${nakshatraDisplayName(PUSHYA.number, "en")} — Visual Profile`,
    description: "Visual profile of Poosam Nakshathiram: personality traits, career strengths, dasa timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/pushya/visual",
    type: "article",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withDasaTimingHold(await withTamilTwin(EN_METADATA, "/natchathiram/pushya/visual", natchathiramVisualTa("pushya")!), "pushya");
}

const PUSHYA_VISUAL: NatchathiramVisualData = {
  atAGlance: [
    { label: "Nurturing Depth",       score: 96 },
    { label: "Spiritual Wisdom",      score: 93 },
    { label: "Protective Strength",   score: 91 },
    { label: "Disciplined Devotion",  score: 89 },
    { label: "Community Care",        score: 92 },
  ],

  radar: {
    labels: ["Nurturing", "Spirituality", "Protection", "Discipline", "Community", "Patience"],
    values: [96, 93, 91, 89, 92, 90],
  },

  coreStrengths: [
    { symbol: "◎", label: "Nurturing Depth",        score: 96, desc: "Brihaspati's child — Pushya feeds, protects, and nourishes with a completeness that nothing and no one is left wanting." },
    { symbol: "◈", label: "Spiritual Wisdom",        score: 93, desc: "The flower of the heavens — Pushya's spiritual intelligence is not studied but innate, transmitted through presence." },
    { symbol: "⚡", label: "Protective Strength",    score: 91, desc: "The cow's udder overflows — Pushya gives unconditionally and will guard those in its care with extraordinary resolve." },
    { symbol: "♥", label: "Disciplined Devotion",   score: 89, desc: "Saturn's discipline meeting Jupiter's devotion — Pushya's practice is consistent, patient, and deeply sincere." },
    { symbol: "△", label: "Community Stewardship",  score: 92, desc: "The village elder who ensures no one goes hungry — Pushya's care extends beyond the personal to the collective." },
    { symbol: "☽", label: "Patient Endurance",      score: 90, desc: "Saturn's long view governs Pushya's temperament — they plant seeds and wait, with full confidence in the harvest." },
  ],

  careerAbilities: [
    { label: "Spiritual & Religious Work",  score: 96 },
    { label: "Healing & Medicine",          score: 93 },
    { label: "Education & Child Care",      score: 91 },
    { label: "Community Service & NGO",     score: 92 },
    { label: "Agriculture & Nourishment",   score: 88 },
  ],
  careerNote: "Pushya thrives wherever people must be fed, healed, protected, or spiritually nourished — the priest, the doctor, the teacher, the social worker, and the farmer all express Pushya's essential nature.",

  careerClusters: [
    { symbol: "◎", title: "Spiritual & Priestly Work",  desc: "Temple service, religious instruction, sacred ritual — Brihaspati's domain is Pushya's natural home." },
    { symbol: "◈", title: "Healing & Medicine",         desc: "Doctors, nurses, Ayurvedic practitioners, therapists — the impulse to heal is constitutional for Pushya." },
    { symbol: "⚡", title: "Education & Childcare",     desc: "Teachers, early childhood educators, school administration — nourishing young minds." },
    { symbol: "♥", title: "Community & Social Work",   desc: "NGOs, social enterprise, community development — the village elder caring for all." },
    { symbol: "△", title: "Agriculture & Food Systems", desc: "Farming, food production, nutrition, food security — the cow's udder of sustenance." },
    { symbol: "☽", title: "Counselling & Pastoral Care", desc: "Grief counselling, hospice care, spiritual accompaniment — Pushya's patience meets others' deepest needs." },
  ],

  modernApps: [
    { symbol: "◎", title: "Spiritual Tech & EdTech",    desc: "Sacred text apps, spiritual learning platforms, devotional technology — Pushya's wisdom digitised." },
    { symbol: "◈", title: "Healthcare & MedTech",        desc: "Patient care platforms, medical technology, mental health applications." },
    { symbol: "⚡", title: "Food Security & AgriTech",   desc: "Food systems technology, agricultural platforms, nutritional science applications." },
    { symbol: "♥", title: "Non-profit & Social Impact",  desc: "Community platforms, social welfare systems, humanitarian technology." },
    { symbol: "△", title: "Wellness & Holistic Health",  desc: "Yoga apps, Ayurvedic platforms, mind-body wellness tools — nourishment for the modern world." },
    { symbol: "☽", title: "Elder Care & Pastoral Tech",  desc: "Care coordination platforms, grief support applications, community belonging tools." },
  ],

  dashaTimeline: [
    {
      planet: "Saturn", theme: "Born into Discipline",
      detail: {
        expect: "Pushya opens life in Saturn dasa — a serious, formative beginning that belies the warmth at this nakshathiram's core. Saturn's is a long opening dasa, and the balance left at birth runs from long for births in the first pada to short for the fourth; the range shown for this dasa gives it. Childhood often involves early responsibility: a household that requires the child's maturity, a family circumstance that cultivates patience before its time, or an environment where spiritual observance is taught as seriously as schoolwork. Brihaspati's flower grows steadily in Saturn's structured soil. Where the balance runs through the school years, they produce a diligent student who may not be the most spontaneous but is consistently reliable, well-liked by teachers, and trusted by peers. The instinct to care for others — to share the lunch box, to include the left-out child, to take responsibility — emerges naturally and early.",
        navigate: "Saturn's long opening gives Pushya an early seriousness that can shade into a tendency to carry too much too early. The child who takes on parental emotional burdens, the teenager who works to support family finances, the young adult who delays personal joy for others' stability — these patterns establish in Saturn dasa and must be consciously redressed in later periods. Physical concerns in Saturn dasa's childhood and adolescence: spine, joints, skin, and the cold-related illnesses Saturn governs. The Saturn–Rahu bhukti (the table below gives when it begins and how long it lasts; for the shorter balances it falls before birth) is the most turbulent sub-period; authority conflicts, academic pressure, and family instability can peak.",
        focus: "Saturday Saturn worship, Hanuman worship, sesame seed offerings, and consistent care routines are the most stabilising influences for Pushya's childhood. The most important parental investment is ensuring the child experiences receiving care as naturally as giving it — Pushya's lifelong tendency to over-give begins here, and the counterbalance of being genuinely nurtured is what makes the later giving sustainable.",
      },
    },
    {
      planet: "Mercury", theme: "The Mind Finds Its Service",
      detail: {
        expect: "Mercury dasa brings Pushya's analytical and communicative intelligence into full flower; it begins anywhere from childhood to the close of adolescence, by pada, and runs on through the formative years of adult life. Higher education or professional training establishes; medicine, education, social work, theology, or agriculture naturally attract. Career foundations are laid with unusual purposefulness — Pushya tends to choose work that matters, not merely work that pays. Where marriage falls within this dasa, it is read from the seventh house and its lord, with Venus and Jupiter as the natural significators, and judged from the individual horoscope as a tendency rather than a fixed time. Children arrive; the family that Pushya will nurture for life takes shape. Community roles and responsibilities beyond the household begin to accumulate — neighbourhood association, temple committee, school parent council.",
        navigate: "Mercury dasa's primary challenge for Pushya is not finding meaningful work but maintaining sustainable boundaries around it. The natural servant tendency can produce over-commitment, professional boundary erosion, and a gradual neglect of personal needs in service of others'. The Mercury–Rahu bhukti (the table below gives when it begins and how long it lasts) can bring unusual professional opportunities or disruptions; navigate thoughtfully without overcommitting. Physical concerns: nervous system, respiratory function, digestive sensitivities.",
        focus: "Wednesday worship and green flower offerings channel Mercury's analytical gifts. Also watch the Mercury–Moon bhukti within this dasa (the bhukti table below gives when it begins and how long it lasts). Moon is the lord of your rasi, Kadagam — this sub-period carries the rasi lord's amplified nurturing, emotional clarity, and maternal intelligence. Family milestones, a deepening of the primary emotional bond, or significant community care contributions typically land in this window. Prepare the most important relational or community commitment for this period.",
      },
    },
    {
      planet: "Ketu", theme: "Inward Nourishment",
      detail: {
        expect: "Ketu dasa interrupts the outward service momentum of Mercury dasa with a necessary inward turn. Brihaspati's wisdom calls Pushya to nourish the inner life with the same diligence they have applied to nourishing others. Spiritual practice deepens with unusual intensity — temple routines, scripture study, or meditation practice that previously fitted around the schedule now begins to organise it. Career is established and children are growing; this is the season for the roots to go deeper before the tree grows taller. Ancestral connections, pitru karma, and the lineage's spiritual heritage come into focus.",
        navigate: "Ketu's detachment can create a sense of disconnection from the social warmth that is Pushya's natural element; that is natural to Ketu, though low mood that persists should be treated as a health concern. The person who has been giving generously for decades needs the renewing emptiness that Ketu provides. Physical concerns: autoimmune vulnerabilities, digestive function, and nervous system sensitivity. The Ketu–Venus bhukti (the table below gives when it begins and how long it lasts) brings a period of creative warmth and relational depth that provides welcome counterpoint to Ketu's asceticism.",
        focus: "Ganapati worship, Ketu shrine visits, pitru tharpanam, black sesame offerings, and sustained sacred study are the core practices. Aditi's quiver is being refilled; the next three dasas — Venus, Sun, and Moon — will bring the most outwardly productive decades of Pushya's life, and this inward preparation is their foundation.",
      },
    },
    {
      planet: "Venus", theme: "The Flowering",
      detail: {
        expect: "Venus dasa, running through mid-life, is Pushya's grand flowering — a long stretch of outward abundance, creative expression, and deeply satisfying relationships. Career reaches its fullest professional expression; leadership roles in service, healthcare, education, or spiritual communities become the natural terrain. Children are growing and achieving; where the dasa runs late, grandchildren may arrive toward its end. Financial comfort consolidates; the home becomes a place of genuine beauty and hospitality. Creative expression that was deferred by earlier service obligations — music, art, gardening, writing — re-emerges with surprising vitality. The Venus–Jupiter bhukti (the table below gives when it begins and how long it lasts) is an exceptional peak; Pushya's two most naturally aligned planetary energies combine in a period of extraordinary abundance, recognition, and joy.",
        navigate: "Venus dasa's primary health concerns for Pushya in this stage are cardiovascular, kidney function, and hormonal. The generous expenditure of energy that Venus enables must be balanced with deliberate rest. The Venus–Saturn bhukti (the table below gives when it begins and how long it lasts) demands a careful reduction in pace; do not resist the slowing.",
        focus: "Friday Lakshmi worship, white and rose offerings, and beautiful surroundings are Venus's primary remedies and amplifiers. Also watch the Venus–Moon bhukti within this dasa (the bhukti table below gives when it begins and how long it lasts). Moon is the lord of your rasi, Kadagam — this sub-period brings the rasi lord's amplified nurturing force, emotional depth, and maternal warmth to its most outwardly expressed form. The most significant community care contribution, the deepest family milestone, or the peak of Pushya's service legacy often crystallises in this window. Give it your full attention.",
      },
    },
    {
      planet: "Sun", theme: "Solar Benediction",
      detail: {
        expect: "Sun dasa, in the later years, brings a golden quality of solar recognition to the decades of quiet, consistent service Pushya has rendered. Professional honours, community recognition, or simply the deep regard of those who have been touched by Pushya's care arrive with unusual visibility in this short dasa. The authority that Brihaspati confers on his devotees finds its solar expression — Pushya speaks, and the community listens, not because they demand authority but because they have earned trust.",
        navigate: "Physical care focuses on heart, eyes, and general vitality. Sun dasa's intensity can occasionally revive old ambitions or competitive impulses that have been dormant — Pushya should monitor for this and return to the service orientation that is most authentic. The Sun–Saturn bhukti (the table below gives when it begins and how long it lasts) requires deliberate pacing.",
        focus: "Sunday Surya worship and Aditya Hridayam recitation amplify the Sun's benediction. Pushya should use the visibility and trust that Sun dasa confers to make the most lasting institutional contribution possible — a bequest, a programme, a foundation, a tradition that will outlast this person's direct involvement.",
      },
    },
    {
      planet: "Moon", theme: "Rasi Lord — The Deep Nourishing",
      detail: {
        expect: "Moon dasa, in advanced age, is the rasi lord's arrival for Pushya. Moon is the lord of your rasi, Kadagam — this makes her dasa doubly charged for Pushya natives. The emotional depth, nurturing completeness, and tidal presence that are Pushya's core nature reach their most concentrated and fully expressed form. Grandchildren receive a quality of loving attention of unusual depth. The capacity to simply be with another person — without agenda, without urgency, with complete emotional presence — is this dasa's supreme gift. For those in spiritual or pastoral roles, Moon dasa produces the most profound accompaniment work of the entire lifetime.",
        navigate: "Moon dasa's health concerns at this stage are primarily fluid balance, memory, and emotional sensitivity. The deep feeling that Moon amplifies can occasionally overwhelm; Pushya in Moon dasa benefits from daily structured practice — prayer, morning ritual, gentle physical care — that provides continuity through the tidal variations. The Moon–Saturn bhukti (the table below gives when it begins and how long it lasts) is the most physically demanding sub-period; rest and reduced obligation are essential.",
        focus: "Monday Moon worship, water offerings, white flowers, and sustained presence with those who need to receive without giving back. Pushya in Moon dasa is not a role to perform; it is what this person fundamentally is — and the rasi lord's amplification simply removes the last veil between who Pushya has always been and how they are now able to live.",
      },
    },
    {
      planet: "Mars", theme: "Resolve at Twilight",
      detail: {
        expect: "Mars dasa, in advanced age, brings a final quality of resolve and directness to Pushya's late life. The patience that Saturn instilled at the opening of life, and the nourishment that every subsequent dasa expressed, now meets Mars's clarity of will. Pushya in this period often surprises younger family members with the sharpness of their conviction — there is no time now for diplomatic circumlocution; what is true is said directly and with warmth.",
        navigate: "Physical care at this age is primary. Mars's energy manifests as mental clarity and willful presence rather than physical vigour; do not confuse them and push the body beyond its capacity. The Mars–Rahu bhukti (the table below gives when it begins and how long it lasts) can bring a brief period of unusual restlessness or family friction; navigate with Pushya's characteristic patience.",
        focus: "Tuesday Mars shrine prayers, red flower offerings, and the protection of those in the immediate care environment. The resolve Pushya brings in these final years is a form of love as true as the early patient nourishing — it is the same river in a narrower channel, running clearer and faster.",
      },
    },
    {
      planet: "Rahu", theme: "Dissolution into Mystery",
      detail: {
        expect: "Rahu dasa, in very advanced age, is reached by very few. For those Pushya souls who arrive here — and Pushya's constitutional patience and careful living give them every statistical advantage — Rahu brings the final dissolution of the boundaries between the self and the world that Pushya has nourished for nearly a century. What was always felt intuitively — that the separation between self and other is ultimately illusory — becomes a lived experience.",
        navigate: "Complete, gentle physical care. Rahu at this age dissolves rather than disrupts; the unusual circumstances that Rahu brings in youth become, at this age, the unusual grace of a consciousness that has completed its work and rests in the mystery.",
        focus: "Rahu shrine prayers, coconut offerings, and the presence of those who understand that this person's dissolution into mystery is not a loss but a completion. Brihaspati's flower has bloomed, seeded, and now returns to the soil it came from.",
      },
    },
  ],

  spirituality: [
    {
      title: "Brihaspati & Jupiter Worship",
      desc: "Pushya's presiding deity is Brihaspati, guru of the gods — Thursday Jupiter worship, Guru Puja, Dakshinamurthy worship, and Brihaspati Stotra recitation are the deepest spiritual practices.",
    },
    {
      title: "Shiva & Saturn Devotion",
      desc: "Pushya carries Saturn's discipline as a gift — Saturday Shani worship, Monday Shiva puja, and the recitation of Shiva Sahasranama provide the structural counterpoint to Jupiter's abundance.",
    },
    {
      title: "Temple Service & Sacred Feeding",
      desc: "Annadanam — the sacred feeding of the community — is the highest spiritual practice for Pushya. Regular food offerings at temples, feeding the poor, and nourishing those who cannot nourish themselves are devotional acts of the first order.",
    },
  ],

  guidance: "The cow whose udder never runs dry is not depleted — it is fulfilled. Give fully, but give from a filled vessel. The discipline Saturn taught you at birth and the wisdom Brihaspati placed in your nature are both pointing to the same truth: sustainable nourishment requires a root system as deep as the giving is wide. Let others care for you, at least sometimes. That too is dharma.",

  compatibleEn: ["Rohini", "Punarpoosam", "Anusham", "Thiruvonam", "Uthiram"],
  compatibleNote: "These nakshatras complement Pushya's nurturing depth, spiritual wisdom, and patient devotion with vitality, renewal, and emotional resonance.",

  ta: {
    atAGlanceLabels: ["ஊட்டமளிக்கும் ஆழம்", "ஆன்மீக ஞானம்", "பாதுகாப்பு வலிமை", "ஒழுக்கமான பக்தி", "சமூக பராமரிப்பு"],
    radarLabels: ["ஊட்டமளித்தல்", "ஆன்மீகம்", "பாதுகாப்பு", "ஒழுக்கம்", "சமூகம்", "பொறுமை"],
    coreStrengths: [
      { label: "ஊட்டமளிக்கும் ஆழம்",    desc: "பிருஹஸ்பதியின் பிள்ளை — பூச ஜாதகர் ஊட்டுகிறார், பாதுகாக்கிறார், எதுவும் யாரும் தேவையிருக்காத விதத்தில் முழுமையாக வளர்க்கிறார்." },
      { label: "ஆன்மீக ஞானம்",          desc: "வானத்தின் மலர் — பூசத்தின் ஆன்மீக நுண்ணறிவு கற்றதல்ல, இயல்பானது, இருப்பின் மூலம் பரிமாற்றப்படுகிறது." },
      { label: "பாதுகாப்பு வலிமை",       desc: "பசுவின் மடி நிரம்பி வழிகிறது — பூச ஜாதகர் நிபந்தனையின்றி கொடுக்கிறார் மற்றும் அசாதாரண உறுதியுடன் தன் பராமரிப்பில் உள்ளவர்களை காப்பாற்றுவார்." },
      { label: "ஒழுக்கமான பக்தி",        desc: "சனியின் ஒழுக்கம் குருவின் பக்தியை சந்திக்கிறது — பூசத்தின் நடைமுறை நிலையான, பொறுமையான, ஆழமாக நேர்மையான." },
      { label: "சமூக பொறுப்பாண்மை",     desc: "யாரும் பசியாக போகாமல் உறுதி செய்யும் கிராம முதியவர் — பூசத்தின் பராமரிப்பு தனிப்பட்டதை தாண்டி கூட்டுவாக விரிகிறது." },
      { label: "பொறுமையான சகிப்புத்தன்மை", desc: "சனியின் நீண்ட கண்ணோட்டம் பூசத்தின் மனோபாவத்தை நிர்வகிக்கிறது — விதைகளை விதைத்து, அறுவடையில் முழு நம்பிக்கையுடன் காத்திருக்கிறார்கள்." },
    ],
    careerAbilityLabels: ["ஆன்மீக & மத வேலை", "குணப்படுத்தல் & மருத்துவம்", "கல்வி & குழந்தை பராமரிப்பு", "சமூக சேவை & NGO", "விவசாயம் & ஊட்டச்சத்து"],
    careerClusters: [
      { title: "ஆன்மீக & ஆசாரிய வேலை",   desc: "கோவில் சேவை, மத அறிவுறுத்தல், புனித சடங்கு — பிருஹஸ்பதியின் தளம் பூசத்தின் இயல்பான வீடு." },
      { title: "குணப்படுத்தல் & மருத்துவம்", desc: "மருத்துவர்கள், செவிலியர்கள், ஆயுர்வேத பயிற்சியாளர்கள், சிகிச்சையாளர்கள் — குணப்படுத்தும் உந்துதல் பூசத்திற்கு இயல்பானது." },
      { title: "கல்வி & குழந்தை பராமரிப்பு", desc: "ஆசிரியர்கள், ஆரம்பகால குழந்தை கல்வியாளர்கள், பள்ளி நிர்வாகம் — இளம் மனங்களை ஊட்டுவது." },
      { title: "சமூகம் & சமூக வேலை",      desc: "NGOகள், சமூக நிறுவனம், சமூக வளர்ச்சி — அனைவரையும் பராமரிக்கும் கிராம முதியவர்." },
      { title: "விவசாயம் & உணவு அமைப்புகள்", desc: "விவசாயம், உணவு உற்பத்தி, ஊட்டச்சத்து, உணவு பாதுகாப்பு — வாழ்வாதார பசுவின் மடி." },
      { title: "ஆலோசனை & ஆன்மீக பராமரிப்பு", desc: "துக்க ஆலோசனை, ஓய்வுராம சேவை, ஆன்மீக துணை — பூசத்தின் பொறுமை மற்றவர்களின் ஆழமான தேவைகளை சந்திக்கிறது." },
    ],
    modernApps: [
      { title: "ஆன்மீக தொழில்நுட்பம் & எட்டெக்", desc: "புனித நூல் ஆப்கள், ஆன்மீக கற்றல் தளங்கள், பக்தி தொழில்நுட்பம் — பூசத்தின் ஞானம் டிஜிட்டல் ஆனது." },
      { title: "சுகாதாரம் & மெட்டெக்",            desc: "நோயாளி பராமரிப்பு தளங்கள், மருத்துவ தொழில்நுட்பம், மனநல பயன்பாடுகள்." },
      { title: "உணவு பாதுகாப்பு & அக்ரிடெக்",     desc: "உணவு அமைப்பு தொழில்நுட்பம், விவசாய தளங்கள், ஊட்டச்சத்து அறிவியல் பயன்பாடுகள்." },
      { title: "இலாப நோக்கற்ற & சமூக தாக்கம்",    desc: "சமூக தளங்கள், சமூக நலன் அமைப்புகள், மனிதாபிமான தொழில்நுட்பம்." },
      { title: "ஆரோக்கியம் & ஒட்டுமொத்த சுகாதாரம்", desc: "யோகா ஆப்கள், ஆயுர்வேத தளங்கள், மன-உடல் ஆரோக்கிய கருவிகள் — நவீன உலகிற்கான ஊட்டச்சத்து." },
      { title: "முதியோர் பராமரிப்பு & ஆன்மீக தொழில்நுட்பம்", desc: "பராமரிப்பு ஒருங்கிணைப்பு தளங்கள், துக்க ஆதரவு பயன்பாடுகள், சமூக சேர்தல் கருவிகள்." },
    ],
    dashaThemes: [
      "ஒழுக்கத்தில் பிறப்பு — சனி ஆரம்பம், ஆரம்பகால பொறுப்பு, ஆன்மீக அடித்தளம்",
      "மனம் தன் சேவையை கண்டுபிடிக்கிறது — புதன் நுண்ணறிவு, தொழில் ஆரம்பம், குடும்ப அமைவு",
      "உள்நோக்கிய ஊட்டம் — கேது ஒருங்கிணைப்பு, ஆன்மீக ஆழம்",
      "மலர்ச்சி — சுக்கிர செழிப்பு, முழுமையான தொழில், சமூக தலைமை",
      "சூரிய வரம் — சமூக அங்கீகாரம், மரபு கட்டுவது",
      "ராசி அதிபதி — ஆழமான ஊட்டம் — சந்திர தசை கடக ராசிக்கு",
      "அந்திவெயிலில் உறுதி — செவ்வாய் தெளிவு, நேரடி அன்பு",
      "மர்மத்தில் கரைதல் — ராகு இறுதி முடிவு",
    ],
    dashaDetails: [
      {
        expect: "பூசம் சனி தசையில் வாழ்க்கையைத் தொடங்குகிறது — இந்த நட்சத்திரத்தின் மையத்தில் உள்ள அரவணைப்புக்கு மாறான தீவிரமான, உருவாக்கும் தொடக்கம். சனி நீண்ட தொடக்க தசை; பிறக்கும்போது மீதமுள்ள இருப்பு முதல் பாதத்தில் நீளமாகவும் நான்காம் பாதத்தில் குறுகியதாகவும் இருக்கும் — இந்த தசைக்குக் காட்டப்படும் வரம்பு அதைச் சொல்கிறது. குழந்தைப் பருவம் அடிக்கடி ஆரம்பகாலப் பொறுப்பை உள்ளடக்குகிறது: குழந்தையின் முதிர்ச்சியைக் கோரும் வீடு, காலத்துக்கு முன்பே பொறுமையை வளர்க்கும் குடும்பச் சூழல், அல்லது ஆன்மீக அனுஷ்டானம் பள்ளிப் படிப்பைப் போலவே தீவிரமாகக் கற்பிக்கப்படும் சூழல். பிருஹஸ்பதியின் மலர் சனியின் கட்டமைக்கப்பட்ட மண்ணில் நிலையாக வளர்கிறது. இருப்பு பள்ளிக் காலம் முழுவதும் நீளுமானால், மிகவும் தன்னிச்சையானவர் இல்லையென்றாலும் தொடர்ந்து நம்பகமான, ஆசிரியர்களால் விரும்பப்படும், சகாக்களால் நம்பப்படும் உழைக்கும் மாணவர் உருவாகிறார். பிறரைப் பராமரிக்கும் உள்ளுணர்வு — மதிய உணவைப் பகிர்வது, ஒதுக்கப்பட்ட குழந்தையைச் சேர்த்துக்கொள்வது, பொறுப்பேற்பது — இயல்பாகவும் ஆரம்பத்திலேயும் எழுகிறது.",
        navigate: "சனியின் நீண்ட தொடக்கம் பூசத்துக்கு, அதிகமாக, சீக்கிரமாகச் சுமக்கும் போக்காக மாறக்கூடிய ஆரம்பகாலத் தீவிரத்தைத் தருகிறது. பெற்றோரின் உணர்வுச் சுமைகளை ஏற்கும் குழந்தை, குடும்பப் பணத்துக்காக உழைக்கும் இளையவர், பிறரின் நிலைத்தன்மைக்காகத் தன் மகிழ்ச்சியைத் தள்ளிவைக்கும் இளம் வயது வந்தவர் — இந்த வடிவங்கள் சனி தசையில் நிறுவப்படுகின்றன; பிந்தைய காலங்களில் உணர்வுடன் சரிசெய்யப்பட வேண்டும். சனி தசையின் குழந்தைப் பருவ, வளரிளம் பருவ உடல் கவலைகள்: முதுகெலும்பு, மூட்டுகள், தோல், சனி ஆளும் குளிர் தொடர்பான நோய்கள். சனி–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்; குறைந்த இருப்பில் அது பிறப்புக்கு முன்பே வந்துவிடும்) மிகவும் கலக்கமான துணைக் காலம்; அதிகாரத்துடன் மோதல், கல்வி அழுத்தம், குடும்ப நிலையின்மை உச்சமடையலாம்.",
        focus: "சனிக்கிழமை சனி வழிபாடு, ஆஞ்சநேயர் வழிபாடு, எள் அர்ப்பணம். முக்கியமான பெற்றோரின் முதலீடு குழந்தையை பெறுவது இயல்பாக அனுபவிப்பதை உறுதி செய்வது — பூசத்தின் வாழ்நாள் அதிகப்படியான கொடுக்கும் போக்கு இங்கே தொடங்குகிறது.",
      },
      {
        expect: "புதன் தசை பூசத்தின் பகுப்பாய்வு, தொடர்பு நுண்ணறிவை முழு மலர்ச்சிக்குக் கொண்டுவருகிறது; பாதத்தைப் பொறுத்து குழந்தைப் பருவத்திலோ வளரிளம் பருவத்தின் முடிவிலோ தொடங்கி, வயது வந்த வாழ்வின் உருவாக்க ஆண்டுகள் வழியாகச் செல்கிறது. உயர் கல்வி அல்லது தொழில் பயிற்சி நிறுவுகிறது; மருத்துவம், கல்வி, சமூகப் பணி, இறையியல், விவசாயம் இயல்பாக ஈர்க்கின்றன. அசாதாரண நோக்கத்துடன் தொழில் அடித்தளம் இடப்படுகிறது — பூசம் ஊதியம் தரும் வேலையை மட்டுமல்ல, முக்கியமான வேலையைத் தேர்ந்தெடுக்க முனைகிறது. இந்தத் தசைக்குள் திருமணம் அமைந்தால், அது ஜாதகத்தின் ஏழாம் வீட்டையும் அதன் அதிபதியையும் கொண்டு பார்க்கப்படுகிறது; சுக்கிரனும் குருவும் அதன் இயல்பான காரகர்கள். அது ஒரு நிலையான காலம் அல்ல, ஒரு போக்கே. குழந்தைகள் வருகிறார்கள்; பூசம் வாழ்நாள் முழுவதும் போஷிக்கும் குடும்பம் வடிவம் பெறுகிறது. வீட்டுக்கு அப்பாற்பட்ட சமூகப் பங்குகளும் பொறுப்புகளும் குவியத் தொடங்குகின்றன — தெரு சங்கம், கோவில் குழு, பள்ளிப் பெற்றோர் குழு.",
        navigate: "பூசத்திற்கு புதன் தசையின் முதன்மைச் சவால், பொருளுள்ள வேலையைக் கண்டுபிடிப்பது அல்ல, அதைச் சுற்றி நிலையான எல்லைகளைப் பேணுவது. இயல்பான சேவை மனப்பான்மை அதீத அர்ப்பணிப்பு, தொழில்முறை எல்லை அரிப்பு, பிறரின் சேவையில் தன் தேவைகளை படிப்படியாக புறக்கணித்தல் ஆகியவற்றை உருவாக்கலாம். புதன்–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) அசாதாரண தொழில் வாய்ப்புகளையோ தடங்கல்களையோ கொண்டுவரலாம்; மிகை அர்ப்பணிப்பின்றி சிந்தனையுடன் கடக்கவும். உடல் கவலைகள்: நரம்பு மண்டலம், சுவாச செயல்பாடு, செரிமான உணர்திறன்.",
        focus: "புதன்கிழமை வழிபாடும் பச்சை மலர் அர்ப்பணமும் புதனின் பகுப்பாய்வுக் கொடைகளை நெறிப்படுத்துகின்றன. கவனிக்கவும்: இந்த தசைக்குள் புதன்–சந்திர புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்). சந்திரன் உங்கள் ராசியான கடகத்தின் அதிபதி — இந்த துணைக் காலம் ராசி அதிபதியின் பெருக்கப்பட்ட ஊட்டும் தன்மை, உணர்வுத் தெளிவு, தாய்மை நுண்ணறிவைக் கொண்டுவருகிறது. குடும்ப மைல்கற்கள், முதன்மை உணர்வுப் பிணைப்பின் ஆழமாதல், அல்லது குறிப்பிடத்தக்க சமூகப் பராமரிப்புப் பங்களிப்புகள் பொதுவாக இந்த சாளரத்தில் வரும். மிக முக்கியமான உறவு அல்லது சமூக அர்ப்பணத்தை இந்தக் காலத்துக்குத் தயார் செய்யுங்கள்.",
      },
      {
        expect: "கேது தசை புதன் தசையின் வெளிப்புற சேவை வேகத்தை அவசியமான உள்நோக்கிய திருப்பத்துடன் குறுக்கிடுகிறது. பிருஹஸ்பதியின் ஞானம், பிறரை ஊட்டுவதில் காட்டிய அதே முனைப்புடன் உள் வாழ்வை ஊட்டுமாறு பூசத்தை அழைக்கிறது. ஆன்மீகப் பயிற்சி அசாதாரண தீவிரத்துடன் ஆழமடைகிறது — முன்பு கால அட்டவணைக்குள் பொருந்திய கோவில் வழக்கங்கள், நூல் படிப்பு, தியானம் இப்போது அட்டவணையையே ஒழுங்கமைக்கத் தொடங்குகின்றன. தொழில் நிலைபெற்றுள்ளது, குழந்தைகள் வளர்கிறார்கள்; மரம் உயரமாக வளரும் முன் வேர்கள் ஆழமாகச் செல்லும் பருவம் இது. முன்னோர் தொடர்புகள், பித்ரு கர்மம், வம்சத்தின் ஆன்மீக மரபு கவனத்துக்கு வருகின்றன.",
        navigate: "கேதுவின் விலகல் பூசத்தின் இயல்பான சூழலான சமூக அரவணைப்பிலிருந்து துண்டிக்கப்பட்ட உணர்வை உருவாக்கலாம்; அது கேதுவின் இயல்பே — ஆயினும் தொடரும் மனச்சோர்வை உடல்நலக் கவலையாகவே கவனியுங்கள். பல தசகங்களாகத் தாராளமாகக் கொடுத்தவருக்கு கேது தரும் புத்துணர்வூட்டும் வெறுமை தேவை. உடல் கவலைகள்: தன்னெதிர்ப்பு பாதிப்புகள், செரிமான செயல்பாடு, நரம்பு மண்டல உணர்திறன். கேது–சுக்கிர புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) கேதுவின் துறவு நிலைக்கு வரவேற்கத்தக்க எதிர்ப்புள்ளியாக படைப்பு அரவணைப்பும் உறவு ஆழமும் தரும் காலத்தைக் கொண்டுவருகிறது.",
        focus: "விநாயகர் வழிபாடு, கேது சன்னதி வழிபாடு, பித்ரு தர்ப்பணம், கருப்பு எள் அர்ப்பணம், நீடித்த புனித ஆய்வு. வருவிக்கும் காலி நிறை சுக்கிர தசையை தயார்படுத்துகிறது.",
      },
      {
        expect: "நடுவயது வழியாகச் செல்லும் சுக்கிர தசை பூசத்தின் மாபெரும் மலர்ச்சி — வெளிப்புறச் செழிப்பு, படைப்பு வெளிப்பாடு, ஆழ்ந்த திருப்தி தரும் உறவுகளின் நீண்ட காலம். தொழில் தன் மிக முழுமையான தொழில்முறை வெளிப்பாட்டை அடைகிறது; சேவை, சுகாதாரம், கல்வி அல்லது ஆன்மீக சமூகங்களில் தலைமைப் பங்குகள் இயல்பான நிலமாகின்றன. குழந்தைகள் வளர்ந்து சாதிக்கிறார்கள்; தசை பிற்பகுதிக்கு நீளுமானால், அதன் முடிவை நோக்கிப் பேரக்குழந்தைகள் வரலாம். நிதி வசதி உறுதிப்படுகிறது; வீடு உண்மையான அழகும் விருந்தோம்பலும் கொண்ட இடமாகிறது. முந்தைய சேவைக் கடமைகளால் தள்ளிவைக்கப்பட்ட படைப்பு வெளிப்பாடு — இசை, கலை, தோட்டம், எழுத்து — வியக்கத்தக்க உயிர்ப்புடன் மீண்டும் எழுகிறது. சுக்கிர–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு விதிவிலக்கான உச்சம்; பூசத்தின் இரண்டு மிக இயல்பாக இணைந்த கிரக ஆற்றல்கள் அசாதாரண செழிப்பு, அங்கீகாரம், மகிழ்ச்சியின் காலத்தில் இணைகின்றன.",
        navigate: "வாழ்வின் இந்த கட்டத்தில் பூசத்துக்கு சுக்கிர தசையின் முதன்மை ஆரோக்கிய கவலைகள் இதய-இரத்தக் குழாய், சிறுநீரக செயல்பாடு, ஹார்மோன். சுக்கிரன் சாத்தியமாக்கும் தாராளமான ஆற்றல் செலவு, வேண்டுமென்ற ஓய்வுடன் சமநிலைப்படுத்தப்பட வேண்டும். சுக்கிர–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) வேகத்தில் கவனமான குறைப்பைக் கோருகிறது; மெதுவாவதை எதிர்க்காதீர்கள்.",
        focus: "வெள்ளிக்கிழமை லட்சுமி வழிபாடு, வெண்மை, இளஞ்சிவப்பு அர்ப்பணம், அழகான சுற்றுப்புறம் சுக்கிரனின் முதன்மைப் பரிகாரங்களும் பெருக்கிகளும். இந்த தசைக்குள் சுக்கிர–சந்திர புக்தியையும் கவனிக்கவும் (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்). சந்திரன் உங்கள் ராசியான கடகத்தின் அதிபதி — இந்த துணைக் காலம் ராசி அதிபதியின் பெருக்கப்பட்ட ஊட்டும் வலிமை, உணர்வு ஆழம், தாய்மை அரவணைப்பை அவற்றின் மிகவும் வெளிப்படையாக வெளிப்படுத்தப்பட்ட வடிவில் கொண்டுவருகிறது. மிக முக்கியமான சமூகப் பராமரிப்புப் பங்களிப்பு, ஆழ்ந்த குடும்ப மைல்கல், அல்லது பூசத்தின் சேவை மரபின் உச்சம் பெரும்பாலும் இந்த சாளரத்தில் படிகமாகிறது. இதற்கு முழு கவனம் கொடுங்கள்.",
      },
      {
        expect: "பிற்கால ஆண்டுகளில் வரும் சூரிய தசை, பூசம் ஆற்றிய பல தசகங்களின் அமைதியான, நிலையான சேவைக்கு சூரிய அங்கீகாரத்தின் தங்கத் தரத்தைக் கொண்டுவருகிறது. தொழில் கௌரவங்கள், சமூக அங்கீகாரம், அல்லது பூசத்தின் அக்கறையால் தொடப்பட்டவர்களின் ஆழ்ந்த மதிப்பு இந்த குறுகிய தசையில் அசாதாரண தெரிவுநிலையுடன் வருகின்றன. பிருஹஸ்பதி தன் பக்தர்களுக்கு வழங்கும் அதிகாரம் தன் சூரிய வெளிப்பாட்டைக் காண்கிறது — பூச ஜாதகர் பேசுகிறார், சமூகம் கேட்கிறது; அவர் அதிகாரம் கோருவதால் அல்ல, நம்பிக்கையை ஈட்டியதால்.",
        navigate: "உடல் கவனம் இதயம், கண்கள், பொது உயிர்ச்சக்தியில். சூரிய தசையின் தீவிரம் சில நேரம் உறங்கிக்கிடந்த பழைய இலட்சியங்களையோ போட்டி உந்துதல்களையோ உயிர்ப்பிக்கலாம் — பூசம் இதைக் கவனித்து, மிக உண்மையான சேவை நோக்குக்குத் திரும்ப வேண்டும். சூரிய–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) வேண்டுமென்றே வேகத்தைக் குறைக்கக் கோருகிறது.",
        focus: "ஞாயிற்றுக்கிழமை சூரிய வழிபாடு மற்றும் ஆதித்ய ஹ்ருதயம் பாராயணம். சூரியன் தசை வழங்கும் தெரிவுநிலை மற்றும் நம்பகத்தன்மை நீடித்த நிறுவன பங்களிப்பை செய்ய பயன்படுத்தப்பட வேண்டும்.",
      },
      {
        expect: "முதிர்ந்த வயதில் வரும் சந்திர தசை பூசத்துக்கு ராசி அதிபதியின் வருகை. சந்திரன் உங்கள் ராசியான கடகத்தின் அதிபதி — இது பூச ஜாதகர்களுக்கு இரட்டை வலிமையுடன் வருகிறது. பூசத்தின் மைய இயல்பான உணர்வு ஆழம், ஊட்டும் முழுமை, அலை போன்ற இருப்பு ஆகியவை தங்கள் மிகக் குவிந்த, முழுமையாக வெளிப்படுத்தப்பட்ட வடிவை அடைகின்றன. பேரக்குழந்தைகள் அசாதாரண ஆழமுள்ள அன்பான கவனத்தைப் பெறுகிறார்கள். எதிர்பார்ப்பின்றி, அவசரமின்றி, முழு உணர்வு இருப்புடன் இன்னொருவருடன் வெறுமனே இருக்கும் ஆற்றல் இந்த தசையின் உயரிய கொடை. ஆன்மீக அல்லது ஆசாரியப் பணியில் உள்ளவர்களுக்கு, சந்திர தசை முழு வாழ்நாளின் மிக ஆழ்ந்த துணை நிற்கும் பணியை உருவாக்குகிறது.",
        navigate: "வாழ்வின் இந்த கட்டத்தில் சந்திர தசையின் ஆரோக்கிய கவலைகள் முதன்மையாக திரவ சமநிலை, நினைவாற்றல், உணர்வு உணர்திறன். சந்திரன் பெருக்கும் ஆழ்ந்த உணர்வு சில நேரம் மூழ்கடிக்கலாம்; சந்திர தசையில் பூச ஜாதகர், அலை ஏற்றத்தாழ்வுகளுக்கு நடுவே தொடர்ச்சி தரும் தினசரி கட்டமைப்புப் பயிற்சி — வழிபாடு, காலைச் சடங்கு, மென்மையான உடல் பராமரிப்பு — மூலம் பயனடைகிறார். சந்திர–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மிகவும் உடல் ரீதியாகக் கோரும் துணைக் காலம்; ஓய்வும் குறைந்த கடமையும் அவசியம்.",
        focus: "திங்கட்கிழமை சந்திர வழிபாடு, நீர் அர்ப்பணம், வெள்ளை பூக்கள், திருப்பிக் கொடுக்காமல் பெற வேண்டியவர்களுடன் நீடித்த இருப்பு. சந்திர தசையில் பூசம் ஆற்ற வேண்டிய பங்கு அல்ல; அது இந்த நபர் அடிப்படையில் என்ன என்பதே — ராசி அதிபதியின் பெருக்கம், பூசம் எப்போதும் யாராக இருந்தாரோ அதற்கும் இப்போது எப்படி வாழ முடிகிறது என்பதற்கும் இடையிலான கடைசித் திரையை அகற்றுகிறது.",
      },
      {
        expect: "முதிர்ந்த வயதில் வரும் செவ்வாய் தசை பூசத்தின் பிற்கால வாழ்வுக்கு உறுதி, நேரடித்தன்மையின் இறுதித் தரத்தைக் கொண்டுவருகிறது. வாழ்வின் தொடக்கத்தில் சனி விதைத்த பொறுமையும், அடுத்து வந்த ஒவ்வொரு தசையும் வெளிப்படுத்திய ஊட்டமும் இப்போது செவ்வாயின் மன உறுதித் தெளிவைச் சந்திக்கின்றன. இந்த காலத்தில் பூச ஜாதகர் தன் நம்பிக்கையின் கூர்மையால் இளைய குடும்ப உறுப்பினர்களை அடிக்கடி வியக்க வைக்கிறார் — இப்போது சுற்றிவளைப்புக்கு நேரமில்லை; உண்மையானது நேரடியாகவும் அரவணைப்புடனும் சொல்லப்படுகிறது.",
        navigate: "இந்த வயதில் உடல் பராமரிப்பு முதன்மை. செவ்வாயின் ஆற்றல் உடல் வலிமையாக அல்ல, மனத் தெளிவாகவும் விருப்ப இருப்பாகவும் வெளிப்படுகிறது; இரண்டையும் குழப்பிக்கொண்டு உடலை அதன் திறனுக்கு அப்பால் தள்ளாதீர்கள். செவ்வாய்–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) சுருக்கமான அசாதாரண அமைதியின்மையையோ குடும்ப உரசலையோ கொண்டுவரலாம்; பூசத்தின் இயல்பான பொறுமையுடன் கடக்கவும்.",
        focus: "செவ்வாய்க்கிழமை செவ்வாய் சன்னதி வழிபாடு, சிவப்பு பூ அர்ப்பணம். இறுதி ஆண்டுகளில் பூசம் கொண்டு வரும் உறுதி ஆரம்பகால பொறுமையான ஊட்டச்சத்து போல் உண்மையான அன்பு — ஒரு குறுகிய சேனலில் இயங்கும் அதே நதி.",
      },
      {
        expect: "மிக முதிர்ந்த வயதில் வரும் ராகு தசையை மிகச் சிலரே அடைகிறார்கள். இங்கு வரும் பூச ஆத்மாக்களுக்கு — பூசத்தின் இயல்பான பொறுமையும் கவனமான வாழ்வும் அவர்களுக்கு எல்லா வாய்ப்பையும் தருகின்றன — ராகு, பூச ஜாதகர் ஏறத்தாழ ஒரு நூற்றாண்டாக ஊட்டி வளர்த்த தனக்கும் உலகுக்கும் இடையிலான எல்லைகளின் இறுதிக் கரைவைக் கொண்டுவருகிறார். தனக்கும் பிறருக்கும் இடையிலான பிரிவு இறுதியில் மாயை என்று எப்போதும் உள்ளுணர்வால் உணரப்பட்டது வாழ்ந்த அனுபவமாகிறது.",
        navigate: "முழுமையான, மென்மையான உடல் பராமரிப்பு. இந்த வயதில் ராகு குலைப்பதற்குப் பதிலாக கரைக்கிறது; இளமையில் ராகு கொண்டுவரும் அசாதாரண சூழ்நிலைகள் இந்த வயதில், தன் பணியை முடித்து மர்மத்தில் ஓயும் உணர்வு நிலையின் அசாதாரண அருளாகின்றன.",
        focus: "ராகு சன்னதி வழிபாடு, தேங்காய் அர்ப்பணம், இந்த நபர் மர்மத்தில் கரைவது இழப்பு அல்ல, நிறைவு என்று புரிந்தவர்களின் இருப்பு. பிருஹஸ்பதியின் மலர் மலர்ந்து, விதை தந்து, இப்போது தான் வந்த மண்ணுக்கே திரும்புகிறது.",
      },
    ],
    spirituality: [
      { title: "பிருஹஸ்பதி & குரு வழிபாடு",  desc: "பூசத்தின் தலைமை தெய்வம் பிருஹஸ்பதி, தேவர்களின் குரு — வியாழக்கிழமை குரு பூஜை, தட்சிணாமூர்த்தி வழிபாடு, பிருஹஸ்பதி ஸ்தோத்திர பாராயணம் ஆழமான ஆன்மீக நடைமுறைகள்." },
      { title: "சிவ & சனி பக்தி",              desc: "பூச ஜாதகர் சனியின் ஒழுக்கத்தை கொண்டு வருகிறார் — சனிக்கிழமை சனி வழிபாடு, திங்கள் சிவ பூஜை, சிவ சஹஸ்ரநாம பாராயணம் குருவின் செழிப்பிற்கு கட்டமைப்பு எதிர் இசையை வழங்குகிறது." },
      { title: "கோவில் சேவை & புனித ஊட்டல்",  desc: "அன்னதானம் — சமூகத்திற்கு புனித ஊட்டல் — பூசத்திற்கு மிக உயர்ந்த ஆன்மீக நடைமுறை. கோவில்களில் வழக்கமான உணவு அர்ப்பணங்கள், ஏழைகளுக்கு ஊட்டல் முதல் தரத்தின் பக்தி செயல்கள்." },
    ],
    guidance: "மடி ஒருபோதும் வற்றாத பசு குறைவடையவில்லை — நிறைவடைகிறது. முழுமையாக கொடுங்கள், ஆனால் நிரப்பப்பட்ட பாத்திரத்திலிருந்து கொடுங்கள். பிறப்பில் சனி கற்பித்த ஒழுக்கமும் பிருஹஸ்பதி உங்கள் இயல்பில் வைத்த ஞானமும் இரண்டும் ஒரே உண்மையை சுட்டுகின்றன: நிலையான ஊட்டம் கொடுத்தல் அகலமான அளவிற்கு ஆழமான வேர் அமைப்பை கோருகிறது. மற்றவர்களை உங்களை பராமரிக்கவிடுங்கள், சில நேரங்களிலாவது. அதுவும் தர்மம்.",
    careerNote: "மக்கள் ஊட்டப்பட, குணமடைய, பாதுகாக்கப்பட, அல்லது ஆன்மீகமாக வளர்க்கப்படும் இடங்களில் பூச ஜாதகர் சிறப்பாக செயல்படுகிறார்.",
    modernLead: "பூசத்தின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "ஊட்டமளிக்கும் ஆழம், ஆன்மீக ஞானம், பொறுமையான பக்தி பூசத்தின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function PushyaVisualPage() {
  return <NatchathiramVisualContent data={PUSHYA} visual={PUSHYA_VISUAL} timings={dasaTimingsFor(PUSHYA.number)} />;
}
