import type { Metadata } from "next";
import { withTamilTwin } from "@/lib/localized-metadata";
import { withDasaTimingHold } from "@/lib/natchathiram-dasa-hold";
import { dasaTimingsFor } from "@/lib/natchathiram-dasa-timings";
import { nakshatraDisplayName } from "@/lib/nakshatra-display-name";
import { natchathiramVisualTa } from "@/lib/marketing-seo-ta";
import { PURVA_PHALGUNI } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

const EN_METADATA: Metadata = {
  title: `${nakshatraDisplayName(PURVA_PHALGUNI.number, "en")} — Visual Profile`,
  description: "Visual profile of Pooram Nakshathiram: personality traits, career strengths, dasa timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/purva-phalguni/visual" },
  openGraph: {
    title: `${nakshatraDisplayName(PURVA_PHALGUNI.number, "en")} — Visual Profile`,
    description: "Visual profile of Pooram Nakshathiram: personality traits, career strengths, dasa timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/purva-phalguni/visual",
    type: "article",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withDasaTimingHold(await withTamilTwin(EN_METADATA, "/natchathiram/purva-phalguni/visual", natchathiramVisualTa("purva-phalguni")!), "purva-phalguni");
}

const PURVA_PHALGUNI_VISUAL: NatchathiramVisualData = {
  atAGlance: [
    { label: "Creative Radiance",     score: 97 },
    { label: "Magnetic Charm",        score: 95 },
    { label: "Artistic Mastery",      score: 94 },
    { label: "Joyful Generosity",     score: 93 },
    { label: "Relational Warmth",     score: 96 },
  ],

  radar: {
    labels: ["Creativity", "Charm", "Artistry", "Joy", "Warmth", "Leadership"],
    values: [97, 95, 94, 93, 96, 90],
  },

  coreStrengths: [
    { symbol: "◎", label: "Creative Radiance",   score: 97, desc: "Bhaga's blessing — Purva Phalguni is born to create, delight, and illuminate; the creative impulse is constitutional, not cultivated." },
    { symbol: "◈", label: "Relational Warmth",   score: 96, desc: "The hammock of rest and pleasure — Purva Phalguni draws people into a field of genuine warmth and enjoyment that makes everyone feel seen." },
    { symbol: "⚡", label: "Magnetic Charm",      score: 95, desc: "Leo's solar radiance fused with Venus's beauty — Purva Phalguni enters any gathering and becomes its natural centre without effort or agenda." },
    { symbol: "♥", label: "Artistic Mastery",    score: 94, desc: "Venus governs the aesthetic sense; Leo governs the stage — Purva Phalguni's artistry is not hobby but vocation, the primary language of the soul." },
    { symbol: "△", label: "Joyful Generosity",   score: 93, desc: "Bhaga is the deity of shared fortune — Purva Phalguni gives pleasure freely and genuinely, receiving as easily as it gives." },
    { symbol: "☽", label: "Regal Presence",      score: 90, desc: "The bed's front legs — the place where one rests in full comfort and dignity. Purva Phalguni commands respect while inviting ease." },
  ],

  careerAbilities: [
    { label: "Performing Arts & Entertainment", score: 97 },
    { label: "Fashion, Beauty & Design",        score: 95 },
    { label: "Hospitality & Events",            score: 93 },
    { label: "Brand Management & Media",        score: 94 },
    { label: "Creative Leadership",             score: 92 },
  ],
  careerNote: "Purva Phalguni thrives wherever beauty must be created, pleasure must be delivered, or people must be brought together in joy — the artist, the performer, the designer, the event creator, and the brand builder all live here.",

  careerClusters: [
    { symbol: "◎", title: "Performing Arts & Entertainment", desc: "Music, dance, cinema, theatre — the stage is Purva Phalguni's natural home; the spotlight is not sought but inevitable." },
    { symbol: "◈", title: "Fashion, Beauty & Design",        desc: "Clothing design, jewellery, interiors, aesthetics — Venus and Leo together produce the most refined taste in the nakshathiram spectrum." },
    { symbol: "⚡", title: "Hospitality & Event Creation",   desc: "Hotels, restaurants, weddings, luxury travel, events — Purva Phalguni creates environments of pleasure with instinctive skill." },
    { symbol: "♥", title: "Brand, Media & Communications",  desc: "Brand strategy, advertising, public relations, social media — Purva Phalguni knows instinctively what people will love." },
    { symbol: "△", title: "Creative & Executive Leadership", desc: "Creative directors, CMOs, arts administrators — Leo's authority governing Venus's creative department: the most natural pairing." },
    { symbol: "☽", title: "Wellness & Pleasure Economy",    desc: "Spas, wellness retreats, luxury experiences, lifestyle brands — Bhaga's economy of shared delight translated into business." },
  ],

  modernApps: [
    { symbol: "◎", title: "Content Creation & Influencer",  desc: "YouTube, Instagram, podcast, OTT — the stage has moved online; Purva Phalguni's natural magnetism is perfectly suited to these platforms." },
    { symbol: "◈", title: "Fashion Tech & Beauty Platforms", desc: "AI styling, virtual try-on, beauty apps, sustainable fashion — Venus's aesthetic intelligence at digital scale." },
    { symbol: "⚡", title: "Experience Economy & Events Tech", desc: "Virtual events, experience design platforms, luxury travel tech — creating joy and pleasure at scale." },
    { symbol: "♥", title: "Luxury Brand & Lifestyle Media",  desc: "Premium brand platforms, lifestyle media, cultural content — Purva Phalguni curates what others aspire to." },
    { symbol: "△", title: "Creative Leadership Platforms",   desc: "Design thinking tools, creative team management, arts administration technology." },
    { symbol: "☽", title: "Wellness & Holistic Living Tech", desc: "Spa apps, wellness retreats, luxury self-care platforms — Bhaga's economy of pleasure in the modern world." },
  ],

  dashaTimeline: [
    {
      planet: "Venus", theme: "Born into Beauty",
      detail: {
        expect: "Purva Phalguni opens life in Venus dasa — perhaps the most fortunate of all natal dasas. Venus is the longest dasa of the cycle, and the balance left at birth runs from long for births in the first pada to short for the fourth; the range shown for this dasa gives it. Childhood under it is typically characterised by unusual sensory richness: a home with beauty in it, an early love of music or dance or colour, a social ease with other children, and an instinctive delight in pleasure that adults find disarming and charming. The child who sings before they speak clearly, who arranges flowers before they can write, who remembers the aesthetics of a room before its contents — this is Purva Phalguni under Venus's opening governance. Where the balance reaches the school years, these gifts develop into recognisable talents: creative subjects attract; performance arts draw; the social world of school is navigated with natural ease. Where it runs on into adolescence, the first serious romantic attention arrives — Purva Phalguni's magnetic charm tends to attract admirers earlier and more persistently than most — and the transition to higher education or early career introduces the first discipline: Bhaga's festival of pleasure meets Saturn's insistence on structure, and the creative gifts that have flowered freely must now be directed. The Venus–Jupiter bhukti is a particularly auspicious sub-period — creative gifts flourish, recognition arrives, and the expansive quality of Jupiter amplifies Venus's natural grace (the table below gives when each begins).",
        navigate: "Venus dasa's primary challenge for Purva Phalguni is the cultivation of discipline alongside delight. The nakshathiram that opens life in Venus's bounty can develop a deep reluctance to engage with difficulty — the hammock is comfortable, and leaving it requires a motivation that pleasure alone cannot provide. The habit of living fully in the present, spending freely on what brings immediate joy, and deferring anything tedious until it becomes urgent must be consciously addressed before Venus dasa closes. The Venus–Rahu bhukti (the table below gives when it begins and how long it lasts) is the most volatile sub-period; unusual relationships, boundary-testing, and sudden artistic enthusiasms may arrive and require gentle guidance rather than suppression. Physical concerns: skin, kidneys, blood sugar, and the overconsumption of pleasure that Venus dasa can encourage.",
        focus: "Friday Lakshmi worship, white and rose offerings, and the deliberate development of one creative discipline to genuine depth — not spread across many interests but rooted in one. Venus dasa is the only time this life will be born; it is Bhaga's full blessing, and the capacity for sustained joy that it establishes is the foundation every subsequent dasa will draw upon. The most important investment in Venus dasa is learning what this soul is truly made to create.",
      },
    },
    {
      planet: "Sun", theme: "The Stage is Lit",
      detail: {
        expect: "Sun dasa is the rasi lord's own dasa for Purva Phalguni: Sun is the lord of your rasi, Simha — this makes his dasa doubly charged for Purva Phalguni natives. It wears two faces by pada. For the later padas it begins in childhood and runs through the school years, bringing an early solar confidence and a love of the stage to Venus's pleasure-rich opening. For the first pada it comes as school gives way to adulthood, and brings the first solar illumination of the creative gifts Venus dasa developed. Leo's ruler governs this phase; combined with Purva Phalguni's natal Leo placement, Sun dasa produces a period of unusual visibility and ambition. Career launches with a directness that surprises those who knew the more pleasure-focused Venus-dasa Purva Phalguni — there is now a clear desire for recognition, for a position, for a name. Where it falls in adult life, higher education or professional training is completed, the first significant career appointments or creative commissions arrive, and the identity that will define the public life for decades is being established. The Sun–Jupiter bhukti (the table below gives when it begins and how long it lasts) is the most expansive sub-period, often marking the debut or breakthrough moment — the first significant creative recognition, the institutional acceptance, the performance that is remembered.",
        navigate: "Sun dasa's challenge for Purva Phalguni is the management of the pride that Leo's solar quality can intensify. Bhaga's nakshathiram is naturally generous and socially warm; Leo's king-energy can temporarily overshadow this, producing a period of competitive self-assertion that alienates the very relationships that Purva Phalguni's charm built in Venus dasa. The recognition that arrives in Sun dasa is earned by Venus dasa's gifts, not by Sun dasa's ambition — keeping this perspective intact preserves the warmth that is Purva Phalguni's most valuable social currency. Physical care: heart, spine, eyes, and the circulation.",
        focus: "Sunday Surya worship, Aditya Hridayam recitation. Sun dasa is Purva Phalguni's coronation as a creative and public figure — receive the recognition with genuine gratitude rather than entitlement, and the stage will remain lit for a very long time.",
      },
    },
    {
      planet: "Moon", theme: "The Heart of Creation",
      detail: {
        expect: "Moon dasa falls in very different years by pada — in adolescence for the later padas, in young adulthood and the following years for the first. Where it falls in adult life, it is the most emotionally full stretch of Purva Phalguni's early adult life. Where marriage falls within this dasa, it is read from the seventh house and its lord, with Venus and Jupiter as the natural significators, and judged from the individual horoscope as a tendency rather than a fixed time. Bhaga's deity governs marital joy, and where this dasa falls in adult life, the central relationship of the life may be established or deepened in it. Children arrive; the domestic sphere, which receives less attention in the public-oriented Sun dasa, now comes into its warmth and fullness. The creative work of Sun dasa's career foundation is now rooted in a genuine emotional life — the artist who previously performed from talent now performs from experience, and the work deepens correspondingly. For those in the performing arts or creative industries, Moon dasa produces the most emotionally resonant and publicly beloved work of the career.",
        navigate: "Moon dasa's health concerns are digestive, hormonal, and related to emotional regulation. Purva Phalguni's natural generosity, in Moon dasa, can extend to emotional over-giving — investing emotional energy in relationships beyond what is returned, or carrying others' moods as personal responsibility. The boundary between warmth and absorption must be maintained. The Moon–Ketu bhukti (the table below gives when it begins and how long it lasts) is the most internally reflective sub-period; a spiritual deepening or temporary withdrawal from the public sphere typically occurs here, and is valuable rather than problematic.",
        focus: "Monday Moon worship, water offerings, and the deliberate cultivation of emotional depth as a creative resource rather than a vulnerability. Also watch the Moon–Sun bhukti, which closes this dasa (the bhukti table below gives when it begins and how long it lasts). This brief interval brings Leo's solar confidence into the emotional depth of Moon dasa — typically the moment when the central creative identity is fully claimed and publicly expressed for the first time with complete authenticity.",
      },
    },
    {
      planet: "Mars", theme: "Creative Command",
      detail: {
        expect: "Mars dasa introduces a quality of directed force and decisive action into a life that has been characterised by beauty and flow; it arrives in early adult life for the later padas and nearer mid-life for the first. Purva Phalguni in Mars dasa does not become aggressive — rather, the creative energy that has been expressing itself is now consolidated, focused, and deployed with strategic precision. Career decisions are made that define the legacy: the creative director who builds a studio, the performer who chooses the defining project, the entrepreneur who makes the founding investment. The discipline that Sun dasa called for and Moon dasa deepened is now expressed in committed action. For those who have been deferring a major creative or professional ambition, Mars dasa is when the hammock is finally vacated and the stage is taken — permanently.",
        navigate: "Mars dasa's primary challenge is physical energy management. Leo's constitution, energised by Mars, can push beyond what is sustainable; the body requires equal discipline to the career. The Mars–Rahu bhukti (the table below gives when it begins and how long it lasts) can bring a period of unusual volatility — significant creative risks, relationship friction, or a pivotal confrontation that defines the remaining career trajectory. Navigate this sub-period with deliberate care rather than reactive impulse. Physical concerns: blood pressure, inflammatory conditions, musculoskeletal health.",
        focus: "Tuesday Mars shrine worship, red flower offerings, and the completion of at least one major creative or professional project that will outlast this dasa and define the legacy. Mars gives Purva Phalguni the fires of creative decisiveness — use them to build something permanent.",
      },
    },
    {
      planet: "Rahu", theme: "The Grand Stage",
      detail: {
        expect: "Rahu dasa is Purva Phalguni's grandest and most expansive chapter — a long span of unusual visibility, unconventional success, and the complete expression of the creative identity that the preceding dasas built. Rahu amplifies everything it touches; for Purva Phalguni, whose natural medium is beauty, pleasure, and human connection, this amplification produces extraordinary creative output and public reach. International recognition, cross-cultural collaborations, technology-mediated platforms, and the kind of visibility that earlier generations would have considered impossible for a single lifetime — all of these characterise Rahu dasa for the most realised Purva Phalguni natives. The Rahu–Jupiter bhukti (the table below gives when it begins and how long it lasts) is the single most expansive sub-period — the peak of what this creative life can produce and be recognised for. Where the dasa reaches mid-life, children are establishing their own lives; the domestic sphere lightens; creative energy that was shared across family and career can now concentrate on the work itself.",
        navigate: "Rahu dasa is long enough to span a major physiological transition (from midlife vitality into senior health management), and the pace that Rahu encourages must be modulated accordingly. The pleasure-seeking that has characterised Purva Phalguni since Venus dasa can, in Rahu's amplification, extend into excess — dietary, sensory, or relational indulgences that the body of this age cannot sustain without consequence. The Rahu–Saturn bhukti (the table below gives when it begins and how long it lasts) is the most demanding sub-period; a deliberate reduction in pace and scope is required. Health concerns: cardiovascular, metabolic, and the hormonal changes of this life stage.",
        focus: "Rahu shrine prayers, coconut offerings, and regular Bhaga worship — the deity of shared pleasure and marital joy governs this nakshathiram, and Rahu dasa is when Bhaga's fullest blessing is available. The creative generosity that is Purva Phalguni's essential nature reaches its largest scale in this long dasa; give freely, create abundantly, and receive the recognition with the same warmth that Venus dasa first taught.",
      },
    },
    {
      planet: "Jupiter", theme: "The Elder's Grace",
      detail: {
        expect: "Jupiter dasa, in the second half of life, brings a philosophical depth and generous wisdom to the creative life that Purva Phalguni has been building across a lifetime. The artist whose work has always delighted now also instructs; the performer whose presence has always charmed now also moves; the creative leader whose taste has always refined now also reveals. Jupiter's long span is characterised by a quality of expansive giving — mentoring younger creative talents, contributing to cultural institutions, sharing the aesthetic wisdom that a lifetime of creative practice has accumulated. Grandchildren receive an extraordinary quality of joyful attention. Financial consolidation and comfortable stability characterise these years; Bhaga's fortune, which was shared so freely across Rahu dasa's peak, now settles into the dignified sufficiency that suits this season.",
        navigate: "Physical concerns in this stage are primarily hepatic, metabolic, and related to the management of the abundance that Jupiter encourages. The natural inclination toward rich food, pleasurable excess, and generous social spending must be moderated. The Jupiter–Saturn bhukti (the table below gives when it begins and how long it lasts) is a demanding sub-period; deliberate simplification of obligations and a gentle reduction in public commitments provide the necessary counterweight to Jupiter's expansive optimism.",
        focus: "Thursday Jupiter worship, Guru Puja, and the active transmission of creative wisdom to those who are ready to receive it. Purva Phalguni in Jupiter dasa completes a creative legacy — not by creating new work alone but by ensuring that what was learned through a life of beauty and delight is passed on.",
      },
    },
    {
      planet: "Saturn", theme: "Beauty Made Permanent",
      detail: {
        expect: "Saturn dasa, in advanced age, brings the final discipline of a life that has been, in its essence, devoted to the experience and creation of beauty. Saturn, the planet of structure and permanence, asks Purva Phalguni to consider what of the pleasure and creation of this life will endure. The hammock is folded; the stage lights dim to the quiet illumination of memory and presence. What remains is not performance but being — the quality of radiance that Purva Phalguni carries simply by existing, the warmth that surrounds them without effort, the beauty that inheres in their very presence.",
        navigate: "Complete physical care is primary. Saturn's energy at this age manifests as the quiet authority of one whose life has been fully lived — accept the limitation of the body without interpreting it as loss. The Saturn–Venus bhukti (the table below gives when it begins and how long it lasts) brings an interval of genuine creative warmth, perhaps a final artistic expression or a deep rekindling of the loving relationship that Bhaga first blessed.",
        focus: "Saturday Saturn worship, Hanuman worship, and the simple practice of being present with those who want to sit in Purva Phalguni's warmth. The hammock has rested many; it rests the one who made it now. This is not diminishment but completion.",
      },
    },
    {
      planet: "Mercury", theme: "The Last Song",
      detail: {
        expect: "Mercury dasa, in very advanced age, is reached by very few. For those Purva Phalguni souls who arrive here — having lived a full lifetime of beauty, creation, pleasure, and warmth — Mercury brings the final articulation: the story told clearly, the lesson expressed simply, the understanding that what was always felt can now be precisely named.",
        navigate: "Complete care and the grace of being surrounded by those who have been touched by this life's warmth.",
        focus: "Wednesday Mercury worship and the simple joy of words — the last song, the last story, the final and most honest expression of what Bhaga's blessing meant across this entire beautiful life.",
      },
    },
  ],

  spirituality: [
    {
      title: "Mahalakshmi & Venus Worship",
      desc: "Venus governs Purva Phalguni — Friday Mahalakshmi puja, Thiruvilakku worship, Lalita Sahasranama recitation, and white and rose offerings are the most naturally aligned spiritual practices.",
    },
    {
      title: "Bhaga Devata & Marital Joy",
      desc: "Bhaga, the deity of shared fortune and marital bliss, presides over Purva Phalguni. Worship at Meenakshi Amman, Thiruvarur Thyagesar, and temples associated with marital fulfilment honours the deity most directly.",
    },
    {
      title: "Saraswati Worship & Arts Sadhana",
      desc: "The creative gifts of Purva Phalguni are a form of sacred offering. Saraswati puja, dedicating creative work to the divine, and approaching the artistic practice as devotion rather than performance deepens both the art and the spiritual life simultaneously.",
    },
  ],

  guidance: "The hammock was made for rest and for joy — not for avoidance, but for the deep, deliberate pleasure of being alive. Create what only you can create. Give what only you can give. The beauty you bring into the world is not decoration — it is the world reminding itself that existence is worth celebrating. Bhaga blessed this life with delight; the only true failure would be to leave that blessing unopened.",

  compatibleEn: ["Magam", "Uthiram", "Swathi", "Bharani", "Poosam"],
  compatibleNote: "These nakshatras complement Purva Phalguni's creative radiance and relational warmth with regal depth, balance, vitality, and nourishing devotion.",

  ta: {
    atAGlanceLabels: ["படைப்பு கதிர்வீச்சு", "காந்த கவர்ச்சி", "கலை தேர்ச்சி", "மகிழ்ச்சியான தாராளம்", "உறவு அரவணைப்பு"],
    radarLabels: ["படைப்பாற்றல்", "கவர்ச்சி", "கலை", "மகிழ்ச்சி", "அரவணைப்பு", "தலைமை"],
    coreStrengths: [
      { label: "படைப்பு கதிர்வீச்சு",  desc: "பாகதேவனின் ஆசீர்வாதம் — பூரம் படைக்க, மகிழ்விக்க, ஒளிர்விக்க பிறந்தது; படைப்பு உந்துவிசை கட்டியெழுப்பப்படவில்லை, இயல்பானது." },
      { label: "உறவு அரவணைப்பு",        desc: "ஓய்வு மற்றும் இன்பத்தின் ஊஞ்சல் — பூரம் மக்களை உண்மையான வெப்பம் மற்றும் மகிழ்ச்சியின் களத்திற்கு இழுக்கிறது." },
      { label: "காந்த கவர்ச்சி",         desc: "சிம்மத்தின் சூரிய கதிர்வீச்சும் சுக்கிரனின் அழகும் இணைந்தது — பூரம் எந்த கூட்டத்திலும் நுழைந்து முயற்சி அல்லது நோக்கமின்றி அதன் இயல்பான மையமாக மாறுகிறது." },
      { label: "கலை தேர்ச்சி",           desc: "சுக்கிரன் அழகுணர்வை ஆட்சி செய்கிறது; சிம்மம் மேடையை ஆட்சி செய்கிறது — பூரத்தின் கலை பொழுதுபோக்கு அல்ல, ஆன்மாவின் முதன்மை மொழி." },
      { label: "மகிழ்ச்சியான தாராளம்",  desc: "பாகதேவன் பகிரப்பட்ட செல்வத்தின் தெய்வம் — பூரம் இன்பத்தை சுதந்திரமாகவும் உண்மையாகவும் கொடுக்கிறது, கொடுப்பது போல் எளிதாக பெறுகிறது." },
      { label: "அரச இருப்பு",            desc: "கட்டிலின் முன் கால்கள் — முழு வசதி மற்றும் கண்ணியத்துடன் ஓய்வெடுக்கும் இடம். பூரம் ஓய்வை அழைத்துக்கொண்டே மரியாதையை கட்டளையிடுகிறது." },
    ],
    careerAbilityLabels: ["கலை & பொழுதுபோக்கு", "ஃபேஷன், அழகு & வடிவமைப்பு", "விருந்தோம்பல் & நிகழ்வுகள்", "பிராண்ட் மேலாண்மை & மீடியா", "படைப்பு தலைமை"],
    careerClusters: [
      { title: "கலை & பொழுதுபோக்கு",     desc: "இசை, நடனம், சினிமா, நாடகம் — மேடை பூரத்தின் இயல்பான வீடு; கவனம் தேடப்படவில்லை, தவிர்க்க முடியாதது." },
      { title: "ஃபேஷன், அழகு & வடிவமைப்பு", desc: "ஆடை வடிவமைப்பு, நகை, உள்அலங்காரம் — சுக்கிரனும் சிம்மமும் சேர்ந்து நட்சத்திர நிறைவில் மிகவும் நுட்பமான ரசனையை உருவாக்குகின்றன." },
      { title: "விருந்தோம்பல் & நிகழ்வு படைப்பு", desc: "ஹோட்டல்கள், உணவகங்கள், திருமணங்கள், ஆடம்பர பயணம் — பூரம் இன்ப சூழல்களை உள்ளுணர்வு திறனுடன் உருவாக்குகிறது." },
      { title: "பிராண்ட், மீடியா & தகவல் தொடர்பு", desc: "பிராண்ட் மூலோபாயம், விளம்பரம், பொது உறவுகள் — மக்கள் எதை விரும்புவார்கள் என்பதை பூர ஜாதகர் உள்ளுணர்வால் அறிகிறார்." },
      { title: "படைப்பு & நிர்வாக தலைமை", desc: "படைப்பு இயக்குனர்கள், CMO — சுக்கிரனின் படைப்பு துறையை ஆட்சி செய்யும் சிம்மத்தின் அதிகாரம்: மிகவும் இயல்பான இணைப்பு." },
      { title: "ஆரோக்கிய & இன்ப பொருளாதாரம்", desc: "ஸ்பாக்கள், ஆரோக்கிய ஓய்விடங்கள், ஆடம்பர அனுபவங்கள் — பகிரப்பட்ட மகிழ்ச்சியின் பாகதேவன் பொருளாதாரம் வணிகமாக மாறுகிறது." },
    ],
    modernApps: [
      { title: "உள்ளடக்க படைப்பு & தாக்கம்", desc: "யூட்யூப், இன்ஸ்டாகிராம், பாட்கேஸ்ட் — மேடை ஆன்லைனில் நகர்ந்துள்ளது; பூரத்தின் காந்தியம் இந்த தளங்களுக்கு மிகவும் பொருத்தமானது." },
      { title: "ஃபேஷன் தொழில்நுட்பம் & அழகு தளங்கள்", desc: "AI ஸ்டைலிங், விர்ச்சுவல் டிரை-ஆன், அழகு ஆப்கள் — டிஜிட்டல் அளவில் சுக்கிரனின் அழகு நுண்ணறிவு." },
      { title: "அனுபவ பொருளாதாரம் & நிகழ்வு தொழில்நுட்பம்", desc: "மெய்நிகர் நிகழ்வுகள், அனுபவ வடிவமைப்பு தளங்கள் — அளவில் மகிழ்ச்சி மற்றும் இன்பம் உருவாக்குதல்." },
      { title: "ஆடம்பர பிராண்ட் & வாழ்க்கை முறை மீடியா", desc: "பிரீமியம் பிராண்ட் தளங்கள், வாழ்க்கை முறை மீடியா — பூரம் மற்றவர்கள் ஆசைப்படுவதை தொகுக்கிறது." },
      { title: "படைப்பு தலைமை தளங்கள்",       desc: "டிசைன் சிந்தனை கருவிகள், படைப்பு குழு மேலாண்மை." },
      { title: "ஆரோக்கிய & ஒட்டுமொத்த வாழ்வு தொழில்நுட்பம்", desc: "ஸ்பா ஆப்கள், ஆரோக்கிய ஓய்விடங்கள், ஆடம்பர சுய கவனிப்பு தளங்கள்." },
    ],
    dashaThemes: [
      "அழகில் பிறப்பு — சுக்கிர திறப்பு, படைப்பு வளர்ச்சி, ஆரம்பகால மகிழ்ச்சி",
      "மேடை ஒளிரும் — சூரியன் தெரிவுநிலை, தன்னம்பிக்கை, அங்கீகாரம்",
      "படைப்பின் இதயம் — சந்திர உணர்வு ஆழம், உறவு, குடும்பம்",
      "படைப்பு கட்டளை — செவ்வாய் திட்டவட்டமான நடவடிக்கை, மரபு கட்டுதல்",
      "மாபெரும் மேடை — ராகு விரிவாக்கம், உலகளாவிய அங்கீகாரம், உச்சகட்ட படைப்பு",
      "முதியோர் கருணை — குரு ஞானம், படைப்பு மரபு பரிமாற்றம்",
      "அழகு நிரந்தரமாகிறது — சனி இறுதி நிறைவு",
      "கடைசி பாடல் — புதன் இறுதி வெளிப்பாடு",
    ],
    dashaDetails: [
      {
        expect: "பூரம் சுக்கிர தசையில் வாழ்க்கையைத் தொடங்குகிறது — பிறப்பு தசைகள் அனைத்திலும் ஒருவேளை மிக அனுகூலமானது. சுக்கிரன் முழுச் சுழற்சியிலும் மிக நீண்ட தசை; பிறக்கும்போது மீதமுள்ள இருப்பு முதல் பாதத்தில் நீளமாகவும் நான்காம் பாதத்தில் குறுகியதாகவும் இருக்கும் — இந்த தசைக்குக் காட்டப்படும் வரம்பு அதைச் சொல்கிறது. இந்த தசையில் குழந்தைப் பருவம் பொதுவாக அசாதாரண புலன் செழிப்பால் குறிக்கப்படுகிறது: அழகு நிறைந்த வீடு, இசை, நடனம் அல்லது வண்ணத்தின் மீது ஆரம்பகால நேசம், மற்ற குழந்தைகளுடன் சமூக இலகுத்தன்மை, பெரியவர்களை நெகிழ்விக்கும் இன்பத்தின் இயல்பான மகிழ்ச்சி. தெளிவாகப் பேசுவதற்கு முன்பே பாடும் குழந்தை, எழுதுவதற்கு முன்பே பூக்களை அலங்கரிக்கும் குழந்தை, ஒரு அறையின் பொருட்களுக்கு முன் அதன் அழகியலை நினைவில் வைத்திருக்கும் குழந்தை — சுக்கிரனின் தொடக்க ஆட்சியில் பூரம் இதுவே. இருப்பு பள்ளிக் காலத்தை எட்டினால் இந்தக் கொடைகள் அடையாளம் காணத்தக்க திறமைகளாக வளர்கின்றன: படைப்புப் பாடங்கள் ஈர்க்கின்றன, நிகழ்த்துகலைகள் இழுக்கின்றன, பள்ளியின் சமூக உலகம் இயல்பான எளிமையுடன் கடக்கப்படுகிறது. வளரிளம் பருவம் வரை நீண்டால் முதல் தீவிர காதல் கவனம் வருகிறது — பூரத்தின் காந்த வசீகரம் பெரும்பாலானவர்களை விட முன்பாகவும் விடாப்பிடியாகவும் ரசிகர்களை ஈர்க்கிறது — உயர் கல்வி அல்லது ஆரம்பத் தொழிலுக்கான மாற்றம் முதல் ஒழுக்கத்தை அறிமுகப்படுத்துகிறது: பகாவின் இன்பத் திருவிழா சனியின் கட்டமைப்பு வலியுறுத்தலைச் சந்திக்கிறது; சுதந்திரமாக மலர்ந்த படைப்புக் கொடைகள் இப்போது திசைப்படுத்தப்பட வேண்டும். சுக்கிர–குரு புக்தி குறிப்பாக மங்களகரமான துணைக் காலம் — படைப்புக் கொடைகள் மலர்கின்றன, அங்கீகாரம் வருகிறது, குருவின் விரிந்த தரம் சுக்கிரனின் இயல்பான அருளைப் பெருக்குகிறது (ஒவ்வொன்றும் எப்போது என்பது கீழே உள்ள புக்தி அட்டவணையில்).",
        navigate: "பூரத்திற்கு சுக்கிர தசையின் முதன்மைச் சவால் மகிழ்ச்சியுடன் ஒழுக்கத்தை வளர்த்துக்கொள்வது. சுக்கிரனின் செழிப்பில் வாழ்வைத் தொடங்கும் நட்சத்திரம் சிரமத்தை எதிர்கொள்வதில் ஆழ்ந்த தயக்கத்தை வளர்த்துக்கொள்ளலாம் — ஊஞ்சல் வசதியானது, அதிலிருந்து இறங்க இன்பத்தால் மட்டும் தர முடியாத உந்துதல் தேவை. நிகழ்காலத்தில் முழுமையாக வாழும் பழக்கம், உடனடி மகிழ்ச்சி தருவதற்கு தாராளமாகச் செலவிடுதல், சலிப்பூட்டுவதை அவசரமாகும் வரை தள்ளிப்போடுதல் ஆகியவற்றை சுக்கிர தசை முடியும் முன் உணர்வுடன் கையாள வேண்டும். சுக்கிர–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மிகவும் ஆவேசமான துணைக் காலம்; அசாதாரண உறவுகள், எல்லை சோதனைகள், திடீர் கலை ஆர்வங்கள் வரலாம்; அடக்குவதை விட மென்மையான வழிகாட்டுதல் தேவை. உடல் கவலைகள்: தோல், சிறுநீரகங்கள், இரத்தச் சர்க்கரை, சுக்கிர தசை ஊக்குவிக்கும் இன்பத்தின் மிகை.",
        focus: "வெள்ளிக்கிழமை லட்சுமி வழிபாடு, வெண்மை, இளஞ்சிவப்பு அர்ப்பணம், பல ஆர்வங்களில் பரப்பாமல் ஒன்றில் வேரூன்றிய ஒரு படைப்பு ஒழுக்கத்தை உண்மையான ஆழத்துக்கு வளர்ப்பது. இந்த வாழ்க்கை பிறக்கும் ஒரே காலம் சுக்கிர தசை; இது பகாவின் முழு ஆசீர்வாதம்; அது நிறுவும் நீடித்த மகிழ்ச்சித் திறன் அடுத்து வரும் ஒவ்வொரு தசையும் சார்ந்திருக்கும் அடித்தளம். சுக்கிர தசையின் மிக முக்கிய முதலீடு, இந்த ஆத்மா உண்மையில் எதைப் படைக்கப் பிறந்தது என்பதைக் கற்றுக்கொள்வது.",
      },
      {
        expect: "சூரிய தசை பூரத்தின் ராசி அதிபதியின் சொந்த தசை: சூரியன் உங்கள் ராசியான சிம்மத்தின் அதிபதி — இது பூர ஜாதகர்களுக்கு இரட்டை வலிமையுடன் வருகிறது. இது பாதத்தைப் பொறுத்து இரண்டு முகங்கள் கொண்டது. பிந்தைய பாதங்களில் இது குழந்தைப் பருவத்தில் தொடங்கி பள்ளிக் காலம் முழுவதும் நீண்டு, சுக்கிரனின் இன்பம் நிறைந்த தொடக்கத்துக்கு ஆரம்பகால சூரிய நம்பிக்கையையும் மேடையின் மீதான காதலையும் தருகிறது. முதல் பாதத்தில் பள்ளி வாழ்வு வயது வந்த வாழ்வாக மாறும் தருணத்தில் வருகிறது; சுக்கிர தசை வளர்த்த படைப்புக் கொடைகளின் முதல் சூரிய ஒளிப்படலத்தைக் கொண்டுவருகிறது. சிம்மத்தின் அதிபதி இந்த கட்டத்தை ஆள்கிறார்; பூரத்தின் இயல்பான சிம்ம நிலையுடன் சேர்ந்து, சூரிய தசை அசாதாரண தெரிவுநிலையும் இலட்சியமும் கொண்ட காலத்தை உருவாக்குகிறது. இன்பத்தில் கவனம் செலுத்திய சுக்கிர தசைப் பூரத்தை அறிந்தவர்களை வியக்க வைக்கும் நேரடித்தன்மையுடன் தொழில் தொடங்குகிறது — இப்போது அங்கீகாரத்துக்கான, ஒரு நிலைக்கான, ஒரு பெயருக்கான தெளிவான ஆசை உள்ளது. இது வயது வந்த வாழ்வில் வருமானால், உயர் கல்வி அல்லது தொழில்முறைப் பயிற்சி முடிகிறது, முதல் குறிப்பிடத்தக்க தொழில் நியமனங்கள் அல்லது படைப்பு ஒப்படைப்புகள் வருகின்றன, பல பத்தாண்டுகளுக்கு பொது வாழ்வை வரையறுக்கும் அடையாளம் நிறுவப்படுகிறது. சூரிய–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மிகவும் விரிவடையும் துணைக் காலம்; பெரும்பாலும் அறிமுகம் அல்லது திருப்புமுனைத் தருணத்தைக் குறிக்கிறது — முதல் குறிப்பிடத்தக்க படைப்பு அங்கீகாரம், நிறுவன ஏற்பு, நினைவில் நிற்கும் நிகழ்ச்சி.",
        navigate: "சிம்ம சூரியனின் தரம் தீவிரப்படுத்தக்கூடிய செருக்கை நிர்வகிப்பதே பூரத்திற்கு சூரிய தசையின் சவால். பகாவின் நட்சத்திரம் இயல்பாகவே தாராளமானது, சமூக அரவணைப்பு மிக்கது; சிம்மத்தின் அரச ஆற்றல் இதைத் தற்காலிகமாக மறைத்து, சுக்கிர தசையில் பூரத்தின் வசீகரம் கட்டிய உறவுகளையே அந்நியப்படுத்தும் போட்டி சுய-வலியுறுத்தலின் காலத்தை உருவாக்கலாம். சூரிய தசையில் வரும் அங்கீகாரம் சுக்கிர தசையின் கொடைகளால் ஈட்டப்பட்டது, சூரிய தசையின் இலட்சியத்தால் அல்ல — இந்தப் பார்வையைக் காப்பது பூரத்தின் மிக மதிப்புமிக்க சமூகச் செல்வமான அரவணைப்பைப் பாதுகாக்கிறது. உடல் கவனம்: இதயம், முதுகெலும்பு, கண்கள், இரத்த ஓட்டம்.",
        focus: "ஞாயிற்றுக்கிழமை சூரிய வழிபாடு. சூரியன் தசை பூரத்தின் படைப்பு மற்றும் பொது உருவமாக முடிசூட்டுகிறது — உண்மையான நன்றியுடன் அங்கீகாரத்தை பெறவும்.",
      },
      {
        expect: "சந்திர தசை பாதத்தைப் பொறுத்து மிகவும் வேறுபட்ட வயதுகளில் வருகிறது — பிந்தைய பாதங்களில் வளரிளம் பருவத்தில், முதல் பாதத்தில் இளம் வயது வந்த காலத்திலும் அதைத் தொடரும் ஆண்டுகளிலும். வயது வந்த வாழ்வில் வருமானால், இது பூரத்தின் ஆரம்ப வயது வந்த வாழ்வின் மிக உணர்வு நிறைந்த காலம். இந்தத் தசைக்குள் திருமணம் அமைந்தால், அது ஜாதகத்தின் ஏழாம் வீட்டையும் அதன் அதிபதியையும் கொண்டு பார்க்கப்படுகிறது; சுக்கிரனும் குருவும் அதன் இயல்பான காரகர்கள். அது ஒரு நிலையான காலம் அல்ல, ஒரு போக்கே. பகாவின் தெய்வம் திருமண மகிழ்ச்சியை ஆள்கிறது; இந்த தசை வயது வந்த வாழ்வில் வருமானால், வாழ்வின் மையமான உறவு இதில் நிறுவப்படலாம் அல்லது ஆழமடையலாம். குழந்தைகள் வருகிறார்கள்; பொது நோக்குடைய சூரிய தசையில் குறைவான கவனம் பெற்ற வீட்டுக் களம் இப்போது தன் அரவணைப்பையும் நிறைவையும் அடைகிறது. சூரிய தசையின் தொழில் அடித்தளத்தின் படைப்பு வேலை இப்போது உண்மையான உணர்வு வாழ்க்கையில் வேரூன்றியுள்ளது — முன்பு திறமையால் நிகழ்த்திய கலைஞர் இப்போது அனுபவத்திலிருந்து நிகழ்த்துகிறார், வேலை அதற்கேற்ப ஆழமடைகிறது. நிகழ்த்துகலை அல்லது படைப்புத் தொழில்களில் உள்ளவர்களுக்கு, சந்திர தசை தொழிலின் மிக உணர்வுபூர்வமாக எதிரொலிக்கும், பொதுவில் மிகவும் நேசிக்கப்படும் வேலையை உருவாக்குகிறது.",
        navigate: "சந்திர தசையின் ஆரோக்கிய கவலைகள் செரிமானம், ஹார்மோன், உணர்வு ஒழுங்குமுறை. சந்திர தசையில் பூரத்தின் இயல்பான தாராளம் உணர்வு மிகைக்கொடுப்பாக நீளலாம் — திருப்பித் தரப்படுவதை விட அதிகமாக உறவுகளில் உணர்வு ஆற்றலை முதலீடு செய்வது, அல்லது மற்றவர்களின் மனநிலையைத் தனிப்பட்ட பொறுப்பாகச் சுமப்பது. அரவணைப்புக்கும் உள்வாங்கலுக்கும் இடையிலான எல்லை பேணப்பட வேண்டும். சந்திர–கேது புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மிகவும் உள்நோக்கிய துணைக் காலம்; ஆன்மீக ஆழமாதல் அல்லது பொது வெளியிலிருந்து தற்காலிக விலகல் இங்கு பொதுவாக நிகழ்கிறது; அது சிக்கல் அல்ல, மதிப்புமிக்கது.",
        focus: "திங்கட்கிழமை சந்திர வழிபாடு, நீர் அர்ப்பணம், உணர்வு ஆழத்தை பாதிப்பாக அல்லாமல் படைப்பு வளமாக வேண்டுமென்றே வளர்ப்பது. இந்த தசையை நிறைவு செய்யும் சந்திர–சூரிய புக்தியையும் கவனிக்கவும் (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்). இந்த சுருக்கமான இடைவெளி சிம்மத்தின் சூரிய நம்பிக்கையை சந்திர தசையின் உணர்வு ஆழத்துக்குள் கொண்டுவருகிறது — மையமான படைப்பு அடையாளம் முழுமையாகக் கோரப்பட்டு, முதன்முறையாக முழு நம்பகத்தன்மையுடன் பொதுவில் வெளிப்படும் தருணம் பொதுவாக இதுவே.",
      },
      {
        expect: "செவ்வாய் தசை அழகும் ஓட்டமும் வரையறுத்த வாழ்வுக்குள் திசைப்பட்ட வலிமையையும் தீர்க்கமான செயலையும் அறிமுகப்படுத்துகிறது; பிந்தைய பாதங்களில் இளம் வயது வந்த வாழ்விலும், முதல் பாதத்தில் நடுவயதை நெருங்கியும் வருகிறது. செவ்வாய் தசையில் பூரம் ஆக்கிரமிப்புள்ளவராக மாறுவதில்லை — மாறாக, இதுவரை வெளிப்பட்டுக்கொண்டிருந்த படைப்பு ஆற்றல் இப்போது ஒருங்கிணைக்கப்பட்டு, கவனம் செலுத்தப்பட்டு, உத்தித் துல்லியத்துடன் பயன்படுத்தப்படுகிறது. மரபை வரையறுக்கும் தொழில் முடிவுகள் எடுக்கப்படுகின்றன: ஸ்டுடியோ கட்டும் படைப்பு இயக்குநர், வரையறுக்கும் திட்டத்தைத் தேர்ந்தெடுக்கும் நிகழ்த்துபவர், நிறுவன முதலீட்டைச் செய்யும் தொழில்முனைவோர். சூரிய தசை கோரி சந்திர தசை ஆழமாக்கிய ஒழுக்கம் இப்போது உறுதியான செயலில் வெளிப்படுகிறது. ஒரு பெரிய படைப்பு அல்லது தொழில் இலட்சியத்தைத் தள்ளிப்போட்டவர்களுக்கு, செவ்வாய் தசையே ஊஞ்சல் இறுதியாகக் காலி செய்யப்பட்டு மேடை நிரந்தரமாக எடுக்கப்படும் காலம்.",
        navigate: "செவ்வாய் தசையின் முதன்மைச் சவால் உடல் ஆற்றல் மேலாண்மை. செவ்வாயால் ஊக்கப்படுத்தப்பட்ட சிம்ம உடலமைப்பு தாங்கக்கூடியதைத் தாண்டித் தள்ளக்கூடும்; தொழிலுக்குச் சமமான ஒழுக்கம் உடலுக்கும் தேவை. செவ்வாய்–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) அசாதாரண ஆவேசத்தின் காலத்தைக் கொண்டுவரலாம் — குறிப்பிடத்தக்க படைப்பு அபாயங்கள், உறவு உரசல், அல்லது எஞ்சிய தொழில் பாதையை வரையறுக்கும் திருப்புமுனை மோதல். இந்த துணைக் காலத்தை எதிர்வினை உந்துதலால் அல்ல, வேண்டுமென்றே கவனத்துடன் கடக்கவும். உடல் கவலைகள்: இரத்த அழுத்தம், அழற்சி நிலைகள், எலும்பு–மூட்டு–தசைநார் ஆரோக்கியம்.",
        focus: "செவ்வாய்க்கிழமை செவ்வாய் சன்னதி வழிபாடு, சிவப்பு மலர் அர்ப்பணம், இந்தத் தசையைக் கடந்து நிலைத்து மரபை வரையறுக்கும் குறைந்தது ஒரு பெரிய படைப்பு அல்லது தொழில்முறைத் திட்டத்தை நிறைவு செய்தல். செவ்வாய் பூரத்துக்குப் படைப்புத் தீர்மானத்தின் நெருப்பைத் தருகிறார் — நிலைத்து நிற்கும் ஒன்றைக் கட்ட அதைப் பயன்படுத்துங்கள்.",
      },
      {
        expect: "ராகு தசை பூரத்தின் மிக மகத்தான, மிக விரிவான அத்தியாயம் — அசாதாரண தெரிவுநிலை, வழக்கத்துக்கு மாறான வெற்றி, முந்தைய தசைகள் கட்டிய படைப்பு அடையாளத்தின் முழு வெளிப்பாடு ஆகியவற்றின் நீண்ட காலம். ராகு தொடும் அனைத்தையும் பெருக்குகிறது; இயல்பான ஊடகம் அழகு, இன்பம், மனித இணைப்பாக உள்ள பூரத்துக்கு இந்த பெருக்கம் அசாதாரண படைப்பு வெளியீட்டையும் பொது எல்லையையும் தருகிறது. சர்வதேச அங்கீகாரம், பண்பாடுகளுக்கிடையிலான ஒத்துழைப்பு, தொழில்நுட்பம் வழியான மேடைகள், முந்தைய தலைமுறைகள் ஒரு வாழ்நாளில் சாத்தியமற்றது என்று கருதியிருக்கக்கூடிய தெரிவுநிலை — இவை அனைத்தும் மிக நிறைவான பூர ஜாதகர்களின் ராகு தசையை வரையறுக்கின்றன. ராகு–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒற்றை மிக விரிவடையும் துணைக் காலம் — இந்தப் படைப்பு வாழ்வு உருவாக்கி அங்கீகரிக்கப்படக்கூடியவற்றின் உச்சம். தசை நடுவயதை எட்டினால், குழந்தைகள் தங்கள் சொந்த வாழ்வை நிறுவுகிறார்கள்; வீட்டுக் களம் இலகுவாகிறது; குடும்பத்துக்கும் தொழிலுக்கும் பகிரப்பட்ட படைப்பு ஆற்றல் இப்போது வேலையின் மீதே குவியலாம்.",
        navigate: "ராகு தசை ஒரு முக்கிய உடலியல் மாற்றத்தை — நடுவயது உயிர்ச்சக்தியிலிருந்து மூத்த ஆரோக்கிய மேலாண்மைக்கு — தாண்டும் அளவுக்கு நீளமானது; ராகு ஊக்குவிக்கும் வேகம் அதற்கேற்ப மட்டுப்படுத்தப்பட வேண்டும். சுக்கிர தசையிலிருந்தே பூரத்தின் இயல்பாக இருக்கும் இன்ப நாட்டம், ராகுவின் பெருக்கத்தில் மிகையாக நீளக்கூடும் — இந்த வயதின் உடல் விளைவின்றித் தாங்க முடியாத உணவு, புலன், உறவு சார்ந்த மிகைகள். ராகு–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மிகவும் கோரும் துணைக் காலம்; வேகத்தையும் நோக்கத்தையும் வேண்டுமென்றே குறைக்க வேண்டும். ஆரோக்கிய கவலைகள்: இதய-இரத்தக் குழாய், வளர்சிதை மாற்றம், வாழ்வின் இந்த கட்டத்தின் ஹார்மோன் மாற்றங்கள்.",
        focus: "ராகு சன்னதி வழிபாடு, தேங்காய் அர்ப்பணம், வழக்கமான பகா வழிபாடு — பகிரப்பட்ட இன்பம், திருமண மகிழ்ச்சியின் தெய்வம் இந்த நட்சத்திரத்தை ஆள்கிறது; ராகு தசையே பகாவின் முழு ஆசீர்வாதம் கிடைக்கும் காலம். பூரத்தின் அடிப்படை இயல்பான படைப்புத் தாராளம் இந்த நீண்ட தசையில் தன் மிகப் பெரிய அளவை அடைகிறது; தாராளமாகக் கொடுங்கள், ஏராளமாகப் படையுங்கள், சுக்கிர தசை முதலில் கற்பித்த அதே அரவணைப்புடன் அங்கீகாரத்தைப் பெறுங்கள்.",
      },
      {
        expect: "வாழ்வின் இரண்டாம் பாதியில் வரும் குரு தசை, பூரம் ஒரு வாழ்நாள் கட்டிய படைப்பு வாழ்வுக்குத் தத்துவ ஆழத்தையும் தாராளமான ஞானத்தையும் கொண்டுவருகிறது. எப்போதும் மகிழ்வித்த படைப்பாளி இப்போது கற்பிக்கவும் செய்கிறார்; எப்போதும் வசீகரித்த நிகழ்த்துபவர் இப்போது நெகிழவும் வைக்கிறார்; எப்போதும் ரசனையால் மெருகேற்றிய படைப்புத் தலைவர் இப்போது வெளிப்படுத்தவும் செய்கிறார். குருவின் நீண்ட காலம் விரிந்த கொடுப்பு என்ற தரத்தால் வகைப்படுத்தப்படுகிறது — இளம் படைப்புத் திறமைகளுக்கு வழிகாட்டுதல், பண்பாட்டு நிறுவனங்களுக்குப் பங்களித்தல், ஒரு வாழ்நாள் படைப்புப் பயிற்சி திரட்டிய அழகியல் ஞானத்தைப் பகிர்தல். பேரக்குழந்தைகள் அசாதாரணமான மகிழ்ச்சிக் கவனத்தைப் பெறுகிறார்கள். நிதி ஒருங்கிணைப்பும் வசதியான நிலைத்தன்மையும் இந்த ஆண்டுகளின் தன்மை; ராகு தசையின் உச்சத்தில் இவ்வளவு சுதந்திரமாகப் பகிரப்பட்ட பகாவின் செல்வம் இப்போது இந்தப் பருவத்துக்கு ஏற்ற கண்ணியமான போதுமான நிலைக்கு வந்து சேர்கிறது.",
        navigate: "இந்த கட்டத்தின் உடல் கவலைகள் முதன்மையாக கல்லீரல், வளர்சிதை மாற்றம், குரு ஊக்குவிக்கும் செழிப்பின் மேலாண்மை சார்ந்தவை. வளமான உணவு, இன்ப மிகை, தாராளமான சமூகச் செலவு நோக்கிய இயல்பான சாய்வு மட்டுப்படுத்தப்பட வேண்டும். குரு–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) கோரும் துணைக் காலம்; கடமைகளை வேண்டுமென்றே எளிமைப்படுத்துவதும் பொது அர்ப்பணங்களை மெதுவாகக் குறைப்பதும் குருவின் விரிந்த நம்பிக்கைக்குத் தேவையான எதிர்ச்சமநிலையைத் தருகின்றன.",
        focus: "வியாழக்கிழமை குரு வழிபாடு, குரு பூஜை, ஏற்கத் தயாரானவர்களுக்குப் படைப்பு ஞானத்தை வேண்டுமென்றே கடத்துதல். குரு தசையில் பூர ஜாதகர் ஒரு படைப்பு மரபை நிறைவு செய்கிறார் — புதிய படைப்புகளை உருவாக்குவதால் மட்டுமல்ல, அழகும் மகிழ்ச்சியும் நிறைந்த வாழ்வின் வழியாகக் கற்றது அடுத்தவர்களுக்குக் கடத்தப்படுவதை உறுதிசெய்வதாலும்.",
      },
      {
        expect: "முதிர்ந்த வயதில் வரும் சனி தசை, சாரத்தில் அழகின் அனுபவத்துக்கும் படைப்புக்கும் அர்ப்பணிக்கப்பட்ட வாழ்வுக்கு இறுதி ஒழுக்கத்தைக் கொண்டுவருகிறது. கட்டமைப்பு, நிரந்தரத்தின் கிரகமான சனி, இந்த வாழ்வின் இன்பத்திலும் படைப்பிலும் எது நிலைக்கும் என்பதைப் பரிசீலிக்குமாறு பூரத்தைக் கேட்கிறது. ஊஞ்சல் மடக்கப்படுகிறது; மேடை விளக்குகள் நினைவு, இருப்பின் அமைதியான ஒளியாகக் குறைகின்றன. எஞ்சுவது நிகழ்த்துதல் அல்ல, இருப்பு — பூரம் இருப்பதாலேயே சுமக்கும் கதிர்வீச்சு, முயற்சியின்றி அவரைச் சூழும் அரவணைப்பு, அவர் இருப்பிலேயே உறையும் அழகு.",
        navigate: "முழு உடல் பராமரிப்பே முதன்மை. இந்த வயதில் சனியின் ஆற்றல் முழுமையாக வாழ்ந்த வாழ்வின் அமைதியான அதிகாரமாக வெளிப்படுகிறது — உடலின் வரம்பை இழப்பாகப் பொருள்கொள்ளாமல் ஏற்றுக்கொள்ளுங்கள். சனி–சுக்கிர புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) உண்மையான படைப்பு அரவணைப்பின் இடைவெளியைக் கொண்டுவருகிறது — ஒருவேளை இறுதிக் கலை வெளிப்பாடு, அல்லது பகா முதலில் ஆசீர்வதித்த அன்பான உறவின் ஆழ்ந்த புத்துயிர்.",
        focus: "சனிக்கிழமை சனி வழிபாடு, ஆஞ்சநேயர் வழிபாடு, பூரத்தின் அரவணைப்பில் அமர விரும்புபவர்களுடன் நேரடி இருப்பின் எளிய பயிற்சி. ஊஞ்சல் பலருக்கு ஓய்வு தந்தது; இப்போது அதைச் செய்தவருக்கே ஓய்வு தருகிறது. இது குறைவு அல்ல, நிறைவு.",
      },
      {
        expect: "மிக முதிர்ந்த வயதில் வரும் புதன் தசையை மிகச் சிலரே அடைகிறார்கள். அழகு, படைப்பு, இன்பம், அரவணைப்பு நிறைந்த ஒரு முழு வாழ்நாளை வாழ்ந்து இங்கு வரும் பூர ஆத்மாக்களுக்கு, புதன் இறுதி வெளிப்பாட்டைக் கொண்டுவருகிறார்: தெளிவாகச் சொல்லப்படும் கதை, எளிமையாக வெளிப்படுத்தப்படும் பாடம், எப்போதும் உணரப்பட்டதை இப்போது துல்லியமாகப் பெயரிட முடியும் என்ற புரிதல்.",
        navigate: "முழுமையான பராமரிப்பும், இந்த வாழ்வின் அரவணைப்பால் தொடப்பட்டவர்களால் சூழப்படும் அருளும்.",
        focus: "புதன்கிழமை புதன் வழிபாடும், சொற்களின் எளிய மகிழ்ச்சியும் — கடைசிப் பாடல், கடைசிக் கதை, இந்த அழகிய வாழ்வு முழுவதிலும் பகாவின் ஆசீர்வாதம் எதைக் குறித்தது என்பதன் இறுதியான, மிக நேர்மையான வெளிப்பாடு.",
      },
    ],
    spirituality: [
      { title: "மகாலட்சுமி & சுக்கிர வழிபாடு",  desc: "சுக்கிரன் பூரத்தை ஆட்சி செய்கிறது — வெள்ளிக்கிழமை மகாலட்சுமி பூஜை, திருவிளக்கு வழிபாடு, லலிதா சஹஸ்ரநாம பாராயணம் மிகவும் இயல்பாக சீரமைந்த ஆன்மீக நடைமுறைகள்." },
      { title: "பாகதேவன் & திருமண ஆனந்த வழிபாடு", desc: "பகிரப்பட்ட செல்வம் மற்றும் திருமண பேரின்பத்தின் தெய்வம் பூரத்தின் ஆட்சி செய்கிறது. மீனாட்சி அம்மன், திருவாரூர் தியாகேசர் வழிபாடு தெய்வத்தை நேரடியாக கௌரவிக்கிறது." },
      { title: "சரஸ்வதி வழிபாடு & கலை சாதனை",  desc: "பூரத்தின் படைப்பு கொடைகள் புனித அர்ப்பணத்தின் ஒரு வடிவம். சரஸ்வதி பூஜை மற்றும் கலை நடைமுறையை பக்தியாக அணுகுவது கலையையும் ஆன்மீக வாழ்க்கையையும் ஒரே நேரத்தில் ஆழப்படுத்துகிறது." },
    ],
    guidance: "ஊஞ்சல் ஓய்விற்காகவும் மகிழ்ச்சிக்காகவும் செய்யப்பட்டது — தவிர்ப்பிற்காக அல்ல, ஆனால் உயிருடன் இருப்பதன் ஆழமான, திட்டமிட்ட இன்பத்திற்காக. நீங்கள் மட்டுமே படைக்கக்கூடியதை படைக்கவும். நீங்கள் மட்டுமே கொடுக்கக்கூடியதை கொடுக்கவும். நீங்கள் உலகிற்கு கொண்டு வரும் அழகு அலங்காரம் அல்ல — இருப்பு கொண்டாடப்படுவதற்கு தகுதியானது என்று தன்னை நினைவூட்டிக்கொள்வது. பாகதேவன் இந்த வாழ்க்கையை மகிழ்ச்சியால் ஆசீர்வதித்தார்; ஒரே உண்மையான தோல்வி அந்த ஆசீர்வாதத்தை திறக்காமல் விடுவதாகும்.",
    careerNote: "பூரம் எங்கும் அழகு படைக்கப்பட வேண்டும், இன்பம் வழங்கப்பட வேண்டும், அல்லது மக்கள் மகிழ்ச்சியில் ஒன்றிணைக்கப்பட வேண்டும் என்ற இடத்தில் சிறப்பாக செயல்படுகிறது.",
    modernLead: "பூரத்தின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "படைப்பு கதிர்வீச்சு, காந்த கவர்ச்சி, உறவு அரவணைப்பு ஆகியவை பூரத்தின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function PurvaPhalguni() {
  return <NatchathiramVisualContent data={PURVA_PHALGUNI} visual={PURVA_PHALGUNI_VISUAL} timings={dasaTimingsFor(PURVA_PHALGUNI.number)} />;
}
