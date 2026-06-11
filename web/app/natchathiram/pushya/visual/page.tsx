import type { Metadata } from "next";
import { PUSHYA } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

export const metadata: Metadata = {
  title: "Pushya Nakshathiram — Visual Profile | Vinaadi",
  description: "Visual profile of Pushya Nakshathiram: personality traits, career strengths, dasha timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/pushya/visual" },
  openGraph: {
    title: "Pushya Nakshathiram — Visual Profile",
    description: "Visual profile of Pushya Nakshathiram: personality traits, career strengths, dasha timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/pushya/visual",
    type: "article",
  },
};

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
      planet: "Saturn", period: "19 yrs", ageRange: "Age 0–19", theme: "Born into Discipline",
      detail: {
        expect: "Pushya opens life in Saturn dasha — a serious, formative beginning that belies the warmth at this nakshathiram's core. Childhood (0–8) often involves early responsibility: a household that requires the child's maturity, a family circumstance that cultivates patience before its time, or an environment where spiritual observance is taught as seriously as schoolwork. Brihaspati's flower grows steadily in Saturn's structured soil. School years (8–16) produce a diligent student who may not be the most spontaneous but is consistently reliable, well-liked by teachers, and trusted by peers. The instinct to care for others — to share the lunch box, to include the left-out child, to take responsibility — emerges naturally and early.",
        navigate: "Saturn's 19-year opening gives Pushya an early seriousness that can shade into a tendency to carry too much too early. The child who takes on parental emotional burdens, the teenager who works to support family finances, the young adult who delays personal joy for others' stability — these patterns establish in Saturn dasha and must be consciously redressed in later periods. Physical concerns in Saturn dasha's childhood and adolescence: spine, joints, skin, and the cold-related illnesses Saturn governs. Saturn–Rahu antardasha (approximately ages 14–16) is the most turbulent sub-period; authority conflicts, academic pressure, and family instability can peak.",
        focus: "Saturday Saturn worship, sesame seed offerings, and consistent care routines are the most stabilising influences for Pushya's childhood. The most important parental investment is ensuring the child experiences receiving care as naturally as giving it — Pushya's lifelong tendency to over-give begins here, and the counterbalance of being genuinely nurtured is what makes the later giving sustainable.",
      },
    },
    {
      planet: "Mercury", period: "17 yrs", ageRange: "Age 19–36", theme: "The Mind Finds Its Service",
      detail: {
        expect: "Mercury dasha from 19 to 36 brings Pushya's analytical and communicative intelligence into full flower. Higher education or professional training establishes; medicine, education, social work, theology, or agriculture naturally attract. Career foundations are laid with unusual purposefulness — Pushya at this age tends to choose work that matters, not merely work that pays. Marriage enters in Mercury–Venus antardasha (approximately ages 27–29) or Mercury–Jupiter (approximately ages 23–25). Children arrive; the family that Pushya will nurture for life takes shape. Community roles and responsibilities beyond the household begin to accumulate — neighbourhood association, temple committee, school parent council.",
        navigate: "Mercury dasha's primary challenge for Pushya is not finding meaningful work but maintaining sustainable boundaries around it. The natural servant tendency can produce over-commitment, professional boundary erosion, and a gradual neglect of personal needs in service of others'. Mercury–Rahu antardasha (~yr 2 of Mercury, ~ages 21–22) can bring unusual professional opportunities or disruptions; navigate thoughtfully without overcommitting. Physical concerns: nervous system, respiratory function, digestive sensitivities.",
        focus: "Wednesday worship and green flower offerings channel Mercury's analytical gifts. Also watch Mercury–Moon antardasha within this dasha (arriving approximately in the 11th year of Mercury dasha, around age 30). Moon is the lord of your rasi, Kadagam — this sub-period carries the rasi lord's amplified nurturing, emotional clarity, and maternal intelligence. Family milestones, a deepening of the primary emotional bond, or significant community care contributions typically land in this 10-month window. Prepare the most important relational or community commitment for this period.",
      },
    },
    {
      planet: "Ketu", period: "7 yrs", ageRange: "Age 36–43", theme: "Inward Nourishment",
      detail: {
        expect: "Ketu dasha from 36 to 43 interrupts the outward service momentum of Mercury dasha with a necessary inward turn. Brihaspati's wisdom calls Pushya to nourish the inner life with the same diligence they have applied to nourishing others. Spiritual practice deepens with unusual intensity — temple routines, scripture study, or meditation practice that previously fitted around the schedule now begins to organise it. Children are in school; career is established; this is the season for the roots to go deeper before the tree grows taller. Ancestral connections, pitru karma, and the lineage's spiritual heritage come into focus.",
        navigate: "Ketu's detachment can create a sense of disconnection from the social warmth that is Pushya's natural element — this is appropriate, not pathological. The person who has been giving generously for 36 years needs the renewing emptiness that Ketu provides. Physical concerns: autoimmune vulnerabilities, digestive function, and nervous system sensitivity. Ketu–Venus antardasha (~yr 3 of Ketu, ~age 39) brings a period of creative warmth and relational depth that provides welcome counterpoint to Ketu's asceticism.",
        focus: "Ketu shrine visits, pitru tharpanam, black sesame offerings, and sustained sacred study are the core practices. Aditi's quiver is being refilled; the next three dashas — Venus, Sun, and Moon — will bring the most outwardly productive decades of Pushya's life, and this inward preparation is their foundation.",
      },
    },
    {
      planet: "Venus", period: "20 yrs", ageRange: "Age 43–63", theme: "The Flowering",
      detail: {
        expect: "Venus dasha from 43 to 63 is Pushya's grand flowering — twenty years of outward abundance, creative expression, and deeply satisfying relationships. Career reaches its fullest professional expression; leadership roles in service, healthcare, education, or spiritual communities become the natural terrain. Children are growing and achieving; grandchildren may arrive toward the end of this period. Financial comfort consolidates; the home becomes a place of genuine beauty and hospitality. Creative expression that was deferred by earlier service obligations — music, art, gardening, writing — re-emerges with surprising vitality. Venus–Jupiter antardasha (~yr 4 of Venus, ~ages 47–48) is an exceptional peak; Pushya's two most naturally aligned planetary energies combine in a period of extraordinary abundance, recognition, and joy.",
        navigate: "Venus dasha's primary health concerns for Pushya in this age band are cardiovascular, kidney function, and hormonal. The generous expenditure of energy that Venus enables must be balanced with deliberate rest. Venus–Saturn antardasha (~yr 15 of Venus, ~ages 58–60) demands a careful reduction in pace; do not resist the slowing.",
        focus: "Friday Lakshmi worship, white and rose offerings, and beautiful surroundings are Venus's primary remedies and amplifiers. Also watch Venus–Moon antardasha within this dasha (arriving approximately in the 6th year of Venus dasha, around age 49). Moon is the lord of your rasi, Kadagam — this sub-period brings the rasi lord's amplified nurturing force, emotional depth, and maternal warmth to its most outwardly expressed form. The most significant community care contribution, the deepest family milestone, or the peak of Pushya's service legacy often crystallises in this 10-month window. Give it your full attention.",
      },
    },
    {
      planet: "Sun", period: "6 yrs", ageRange: "Age 63–69", theme: "Solar Benediction",
      detail: {
        expect: "Sun dasha from 63 to 69 brings a golden quality of solar recognition to the decades of quiet, consistent service Pushya has rendered. Professional honours, community recognition, or simply the deep regard of those who have been touched by Pushya's care arrive with unusual visibility in these six years. The authority that Brihaspati confers on his devotees finds its solar expression — Pushya speaks, and the community listens, not because they demand authority but because they have earned trust.",
        navigate: "Physical care focuses on heart, eyes, and general vitality. Sun dasha's intensity can occasionally revive old ambitions or competitive impulses that have been dormant — Pushya should monitor for this and return to the service orientation that is most authentic. Sun–Saturn antardasha (~yr 4 of Sun, ~ages 66–67) requires deliberate pacing.",
        focus: "Sunday Surya worship and Aditya Hridayam recitation amplify the Sun's benediction. Pushya should use the visibility and trust that Sun dasha confers to make the most lasting institutional contribution possible — a bequest, a programme, a foundation, a tradition that will outlast this person's direct involvement.",
      },
    },
    {
      planet: "Moon", period: "10 yrs", ageRange: "Age 69–79", theme: "Rasi Lord — The Deep Nourishing",
      detail: {
        expect: "Moon dasha from 69 to 79 is the rasi lord's arrival for Pushya. Moon is the lord of your rasi, Kadagam — this makes her dasha doubly charged for Pushya natives. The emotional depth, nurturing completeness, and tidal presence that are Pushya's core nature reach their most concentrated and fully expressed form. Grandchildren receive a quality of loving attention of unusual depth. The capacity to simply be with another person — without agenda, without urgency, with complete emotional presence — is this dasha's supreme gift. For those in spiritual or pastoral roles, Moon dasha produces the most profound accompaniment work of the entire lifetime.",
        navigate: "Moon dasha's health concerns in this age band are primarily fluid balance, memory, and emotional sensitivity. The deep feeling that Moon amplifies can occasionally overwhelm; Pushya in Moon dasha benefits from daily structured practice — prayer, morning ritual, gentle physical care — that provides continuity through the tidal variations. Moon–Saturn antardasha (~yr 6 of Moon, ~ages 74–76) is the most physically demanding sub-period; rest and reduced obligation are essential.",
        focus: "Monday Moon worship, water offerings, white flowers, and sustained presence with those who need to receive without giving back. Pushya in Moon dasha is not a role to perform; it is what this person fundamentally is — and the rasi lord's amplification simply removes the last veil between who Pushya has always been and how they are now able to live.",
      },
    },
    {
      planet: "Mars", period: "7 yrs", ageRange: "Age 79–86", theme: "Resolve at Twilight",
      detail: {
        expect: "Mars dasha from 79 to 86 brings a final quality of resolve and directness to Pushya's late life. The patience that Saturn instilled at the opening of life, and the nourishment that every subsequent dasha expressed, now meets Mars's clarity of will. Pushya in this period often surprises younger family members with the sharpness of their conviction — there is no time now for diplomatic circumlocution; what is true is said directly and with warmth.",
        navigate: "Physical care at this age is primary. Mars's energy manifests as mental clarity and willful presence rather than physical vigour; do not confuse them and push the body beyond its capacity. Mars–Rahu antardasha (~yr 2 of Mars, ~age 81) can bring a brief period of unusual restlessness or family friction; navigate with Pushya's characteristic patience.",
        focus: "Tuesday Mars shrine prayers, red flower offerings, and the protection of those in the immediate care environment. The resolve Pushya brings in these final years is a form of love as true as the early patient nourishing — it is the same river in a narrower channel, running clearer and faster.",
      },
    },
    {
      planet: "Rahu", period: "18 yrs", ageRange: "Age 86–104", theme: "Dissolution into Mystery",
      detail: {
        expect: "Rahu dasha from 86 to 104 is reached by very few. For those Pushya souls who arrive here — and Pushya's constitutional patience and careful living give them every statistical advantage — Rahu brings the final dissolution of the boundaries between the self and the world that Pushya has nourished for nearly a century. What was always felt intuitively — that the separation between self and other is ultimately illusory — becomes a lived experience.",
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

  compatibleEn: ["Rohini", "Punarvasu", "Anuradha", "Shravana", "Uttara Phalguni"],
  compatibleNote: "These nakshatras complement Pushya's nurturing depth, spiritual wisdom, and patient devotion with vitality, renewal, and emotional resonance.",

  ta: {
    atAGlanceLabels: ["ஊட்டமளிக்கும் ஆழம்", "ஆன்மீக ஞானம்", "பாதுகாப்பு வலிமை", "ஒழுக்கமான பக்தி", "சமூக பராமரிப்பு"],
    radarLabels: ["ஊட்டமளித்தல்", "ஆன்மீகம்", "பாதுகாப்பு", "ஒழுக்கம்", "சமூகம்", "பொறுமை"],
    coreStrengths: [
      { label: "ஊட்டமளிக்கும் ஆழம்",    desc: "பிருஹஸ்பதியின் பிள்ளை — பூசம் ஊட்டுகிறார், பாதுகாக்கிறார், எதுவும் யாரும் தேவையிருக்காத விதத்தில் முழுமையாக வளர்க்கிறார்." },
      { label: "ஆன்மீக ஞானம்",          desc: "வானத்தின் மலர் — பூசத்தின் ஆன்மீக நுண்ணறிவு கற்றதல்ல, இயல்பானது, இருப்பின் மூலம் பரிமாற்றப்படுகிறது." },
      { label: "பாதுகாப்பு வலிமை",       desc: "பசுவின் மடி넘쳐 ஓடுகிறது — பூசம் நிபந்தனையின்றி கொடுக்கிறார் மற்றும் அசாதாரண உறுதியுடன் தன் பராமரிப்பில் உள்ளவர்களை காப்பாற்றுவார்." },
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
      { title: "ஆரோக்யம் & ஒட்டுமொத்த சுகாதாரம்", desc: "யோகா ஆப்கள், ஆயுர்வேத தளங்கள், மன-உடல் ஆரோக்ய கருவிகள் — நவீன உலகிற்கான ஊட்டச்சத்து." },
      { title: "முதியோர் பராமரிப்பு & ஆன்மீக தொழில்நுட்பம்", desc: "பராமரிப்பு ஒருங்கிணைப்பு தளங்கள், துக்க ஆதரவு பயன்பாடுகள், சமூக சேர்தல் கருவிகள்." },
    ],
    dashaThemes: [
      "ஒழுக்கத்தில் பிறப்பு — சனி ஆரம்பம், ஆரம்பகால பொறுப்பு, ஆன்மீக அடித்தளம்",
      "மனம் தன் சேவையை கண்டுபிடிக்கிறது — புதன் நுண்ணறிவு, தொழில் ஆரம்பம், திருமணம்",
      "உள்நோக்கிய ஊட்டம் — கேது ஒருங்கிணைப்பு, ஆன்மீக ஆழம்",
      "மலர்ச்சி — சுக்கிர செழிப்பு, முழுமையான தொழில், சமூக தலைமை",
      "சூரிய வரம் — சமூக அங்கீகாரம், மரபு கட்டுவது",
      "ராசி அதிபதி — ஆழமான ஊட்டம் — சந்திர தசை கடக ராசிக்கு",
      "அந்திவெயிலில் உறுதி — செவ்வாய் தெளிவு, நேரடி அன்பு",
      "மர்மத்தில் கரைதல் — ராகு இறுதி முடிவு",
    ],
    dashaDetails: [
      {
        expect: "பூசம் சனி தசையில் வாழ்க்கையை திறக்கிறார் — இந்த நட்சத்திரத்தின் மையத்தில் உள்ள அரவணைப்பை பொய்யாக்கும் தீவிரமான, உருவாக்கும் ஆரம்பம். குழந்தை பருவம் (0–8) அடிக்கடி ஆரம்பகால பொறுப்பை உள்ளடக்குகிறது. பள்ளி ஆண்டுகள் (8–16) ஒரு உழைக்கும் மாணவரை உருவாக்குகின்றன, ஆசிரியர்களால் நம்பகமான, சகமாணவர்களால் நம்பப்படுகிறார்.",
        navigate: "சனியின் 19 ஆண்டு திறப்பு பூசத்திற்கு அதிக சீக்கிரமாக அதிக தூக்கும் ஆரம்ப தீவிரத்தை கொடுக்கிறது. சனி–ராகு அந்தர்தசை (சுமார் 14–16 வயது) மிகவும் கலக்கமான துணை காலம். உடல் கவலைகள்: முதுகெலும்பு, மூட்டுகள், தோல்.",
        focus: "சனிக்கிழமை சனி வழிபாடு, எள் அர்ப்பணம். முக்கியமான பெற்றோரின் முதலீடு குழந்தையை பெறுவது இயல்பாக அனுபவிப்பதை உறுதி செய்வது — பூசத்தின் வாழ்நாள் அதிகப்படியான கொடுக்கும் போக்கு இங்கே தொடங்குகிறது.",
      },
      {
        expect: "புதன் தசை 19 முதல் 36 வயது வரை பூசத்தின் பகுப்பாய்வு மற்றும் தொடர்பு நுண்ணறிவை முழுமையாக மலரச் செய்கிறது. உயர் கல்வி அல்லது தொழில் பயிற்சி நிறுவுகிறது; மருத்துவம், கல்வி, சமூக வேலை, இறையியல் இயல்பாக ஈர்க்கின்றன. திருமணம் புதன்–சுக்கிர அந்தர்தசையில் (சுமார் 27–29 வயது) வருகிறது.",
        navigate: "புதன் தசையின் முதன்மையான சவால் பொருளர்த்தமான வேலையை கண்டுபிடிப்பதல்ல, ஆனால் அதைச் சுற்றி நிலையான வரம்புகளை பராமரிப்பது. புதன்–ராகு அந்தர்தசை (~yr 2 of Mercury, ~21–22 வயது) அசாதாரண வாய்ப்புகள் அல்லது இடையூறுகளை கொண்டு வரலாம். உடல் கவலைகள்: நரம்பு மண்டலம், சுவாசம்.",
        focus: "புதன்கிழமை வழிபாடு மற்றும் பசுமை பூ அர்ப்பணம். கவனிக்கவும்: புதன்–சந்திர அந்தர்தசை (புதன் தசையின் சுமார் 11வது ஆண்டில், சுமார் 30 வயது). சந்திர உங்கள் ராசியான கடகத்தின் அதிபதி — இந்த சாளரம் ஊட்டமளிக்கும் முழுமை, உணர்வு தெளிவு, குடும்ப மைல்கற்கல் கொண்டு வருகிறது. இந்த 10 மாத சாளரத்திற்கு முக்கியமான குடும்ப அல்லது சமூக அர்ப்பணத்தை திட்டமிடுங்கள்.",
      },
      {
        expect: "கேது தசை 36 முதல் 43 வயது வரை புதனின் வெளிப்புற சேவை வேகத்தை தேவையான உள்நோக்கிய திரும்புதலுடன் குறுக்கிடுகிறது. பிருஹஸ்பதியின் ஞானம் பூசத்தை மற்றவர்களை ஊட்டிய அதே முனைப்புடன் உள் வாழ்க்கையை ஊட்ட அழைக்கிறது. ஆன்மீக நடைமுறை அசாதாரண தீவிரத்துடன் ஆழமடைகிறது.",
        navigate: "கேதுவின் விலகல் பூசத்தின் இயல்பான சமூக அரவணைப்பிலிருந்து இணைப்பு துண்டிப்பின் உணர்வை உருவாக்கலாம் — இது பொருத்தமானது. உடல் கவலைகள்: தன்னெதிர்ப் பாதிப்புகள், செரிமான செயல்பாடு, நரம்பு மண்டல உணர்திறன்.",
        focus: "கேது சன்னதி வழிபாடு, பித்ரு தர்ப்பணம், கருப்பு எள் அர்ப்பணம், நீடித்த புனித ஆய்வு. வருவிக்கும் காலி நிறை சுக்கிர தசையை தயார்படுத்துகிறது.",
      },
      {
        expect: "சுக்கிர தசை 43 முதல் 63 வயது வரை பூசத்தின் மாபெரும் மலர்ச்சி — சேவையின் இருபது ஆண்டுகள், ஆரோக்யமான வெளிப்புற செழிப்பு, ஆழமாக திருப்திகரமான உறவுகள். தொழில் மிகவும் முழுமையான தொழில் வெளிப்பாட்டை அடைகிறது. சுக்கிர–குரு அந்தர்தசை (~yr 4 of Venus, ~47–48 வயது) ஒரு விதிவிலக்கான உச்சம்; பூசத்தின் இரண்டு மிகவும் இயல்பாக சீரமைந்த கிரக ஆற்றல்கள் இணைகின்றன.",
        navigate: "சுக்கிரனின் முதன்மையான ஆரோக்ய கவலைகள் இதய-வாஸ்குலர், சிறுநீரக செயல்பாடு. சுக்கிர–சனி அந்தர்தசை (~yr 15 of Venus, ~58–60 வயது) கவனமான வேக குறைப்பை கோருகிறது.",
        focus: "வெள்ளிக்கிழமை லட்சுமி வழிபாடு, வெள்ளை மற்றும் ரோஜா அர்ப்பணம். கவனிக்கவும்: சுக்கிர–சந்திர அந்தர்தசை (சுக்கிர தசையின் சுமார் 6வது ஆண்டில், சுமார் 49 வயது). சந்திர ராசி அதிபதி — இந்த துணை காலம் பூசத்தின் ஊட்டும் வலிமை, உணர்வு ஆழம், சமூக பராமரிப்பு மரபு ஆகியவற்றை அதன் மிகவும் வெளிப்படையாக வெளிப்படுத்தப்பட்ட வடிவத்தில் கொண்டு வருகிறது. இந்த சாளரத்திற்கு முழு கவனம் கொடுங்கள்.",
      },
      {
        expect: "சூரியன் தசை 63 முதல் 69 வயது வரை பூசம் வழங்கிய அமைதியான, நிலையான சேவையின் தசகங்களுக்கு சூரிய அங்கீகாரத்தின் தங்க தரத்தை கொண்டு வருகிறது. தொழில் கௌரவங்கள், சமூக அங்கீகாரம் இந்த ஆறு ஆண்டுகளில் அசாதாரண தெரிவுநிலையுடன் வருகின்றன.",
        navigate: "இதயம், கண்கள், பொது உயிர்சக்தியில் உடல் கவனம். சூரியன்–சனி அந்தர்தசை (~yr 4 of Sun, ~66–67 வயது) வேண்டுமென்றே வேகத்தை குறைக்க கோருகிறது.",
        focus: "ஞாயிற்றுக்கிழமை சூரிய வழிபாடு மற்றும் ஆதித்ய ஹ்ருதயம் பாராயணம். சூரியன் தசை வழங்கும் தெரிவுநிலை மற்றும் நம்பகத்தன்மை நீடித்த நிறுவன பங்களிப்பை செய்ய பயன்படுத்தப்பட வேண்டும்.",
      },
      {
        expect: "சந்திர தசை 69 முதல் 79 வயது வரை பூசத்திற்கு ராசி அதிபதியின் வருகை. சந்திர உங்கள் ராசியான கடகத்தின் அதிபதி — இது பூசம் நேயர்களுக்கு இரட்டை வலிமையுடன் வருகிறது. பேரக்குழந்தைகள் அசாதாரண ஆழத்தின் அன்பான கவனத்தை பெறுகிறார்கள். ஆன்மீக அல்லது ஆசாரிய பங்கில் உள்ளவர்களுக்கு, சந்திர தசை முழு வாழ்நாளின் மிகவும் ஆழமான துணை வேலையை உருவாக்குகிறது.",
        navigate: "சந்திர தசையின் ஆரோக்ய கவலைகள் திரவ சமநிலை, நினைவாற்றல், உணர்வு உணர்திறன். சந்திர–சனி அந்தர்தசை (~yr 6 of Moon, ~74–76 வயது) மிகவும் உடல் ரீதியாக கோரும் துணை காலம்.",
        focus: "திங்கட்கிழமை சந்திர வழிபாடு, நீர் அர்ப்பணம், வெள்ளை பூக்கள், மீண்டும் கொடுக்காமல் பெற வேண்டியவர்களுடன் நீடித்த இருப்பு. பூசம் சந்திர தசையில் — இது நிறைவேற்ற ஒரு பங்கு அல்ல; இது இந்த நபர் அடிப்படையில் என்னவர் என்பது.",
      },
      {
        expect: "செவ்வாய் தசை 79 முதல் 86 வயது வரை பூசத்தின் இறுதி வாழ்க்கையில் உறுதி மற்றும் நேரடித்தன்மையின் கடைசி தரத்தை கொண்டு வருகிறது. இந்த காலகட்டத்தில் பூசம் இளைய குடும்ப உறுப்பினர்களை தங்கள் நம்பிக்கையின் கூர்மையால் ஆச்சரியப்படுத்துகிறார்.",
        navigate: "இந்த வயதில் உடல் பராமரிப்பு முதன்மை. செவ்வாயின் ஆற்றல் மனத் தெளிவாக வெளிப்படுகிறது, உடல் சக்தியாக அல்ல. செவ்வாய்–ராகு அந்தர்தசை (~yr 2 of Mars, ~81 வயது) ஒரு சிறிய கலக்கத்தை கொண்டு வரலாம்.",
        focus: "செவ்வாய்க்கிழமை செவ்வாய் சன்னதி வழிபாடு, சிவப்பு பூ அர்ப்பணம். இறுதி ஆண்டுகளில் பூசம் கொண்டு வரும் உறுதி ஆரம்பகால பொறுமையான ஊட்டச்சத்து போல் உண்மையான அன்பு — ஒரு குறுகிய சேனலில் இயங்கும் அதே நதி.",
      },
    ],
    spirituality: [
      { title: "பிருஹஸ்பதி & குரு வழிபாடு",  desc: "பூசத்தின் தலைமை தெய்வம் பிருஹஸ்பதி, தேவர்களின் குரு — வியாழக்கிழமை குரு பூஜை, தட்சிணாமூர்த்தி வழிபாடு, பிருஹஸ்பதி ஸ்தோத்திர பாராயணம் ஆழமான ஆன்மீக நடைமுறைகள்." },
      { title: "சிவ & சனி பக்தி",              desc: "பூசம் சனியின் ஒழுக்கத்தை கொண்டு வருகிறார் — சனிக்கிழமை சனி வழிபாடு, திங்கள் சிவ பூஜை, சிவ சஹஸ்ரநாம பாராயணம் குருவின் செழிப்பிற்கு கட்டமைப்பு எதிர் இசையை வழங்குகிறது." },
      { title: "கோவில் சேவை & புனித ஊட்டல்",  desc: "அன்னதானம் — சமூகத்திற்கு புனித ஊட்டல் — பூசத்திற்கு மிக உயர்ந்த ஆன்மீக நடைமுறை. கோவில்களில் வழக்கமான உணவு அர்ப்பணங்கள், ஏழைகளுக்கு ஊட்டல் முதல் தரத்தின் பக்தி செயல்கள்." },
    ],
    guidance: "மடி ஒருபோதும் வற்றாத பசு குறைவடையவில்லை — நிறைவடைகிறது. முழுமையாக கொடுங்கள், ஆனால் நிரப்பப்பட்ட பாத்திரத்திலிருந்து கொடுங்கள். பிறப்பில் சனி கற்பித்த ஒழுக்கமும் பிருஹஸ்பதி உங்கள் இயல்பில் வைத்த ஞானமும் இரண்டும் ஒரே உண்மையை சுட்டுகின்றன: நிலையான ஊட்டம் கொடுத்தல் அகலமான அளவிற்கு ஆழமான வேர் அமைப்பை கோருகிறது. மற்றவர்களை உங்களை பராமரிக்கவிடுங்கள், சில நேரங்களிலாவது. அதுவும் தர்மம்.",
    careerNote: "மக்கள் ஊட்டப்பட, குணமடைய, பாதுகாக்கப்பட, அல்லது ஆன்மீகமாக வளர்க்கப்படும் இடங்களில் பூசம் சிறப்பாக செயல்படுகிறார்.",
    modernLead: "பூசத்தின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "ஊட்டமளிக்கும் ஆழம், ஆன்மீக ஞானம், பொறுமையான பக்தி பூசத்தின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function PushyaVisualPage() {
  return <NatchathiramVisualContent data={PUSHYA} visual={PUSHYA_VISUAL} />;
}
