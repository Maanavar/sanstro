import type { Metadata } from "next";
import { withTamilTwin } from "@/lib/localized-metadata";
import { withDasaTimingHold } from "@/lib/natchathiram-dasa-hold";
import { dasaTimingsFor } from "@/lib/natchathiram-dasa-timings";
import { nakshatraDisplayName } from "@/lib/nakshatra-display-name";
import { natchathiramVisualTa } from "@/lib/marketing-seo-ta";
import { KRITTIKA } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

const EN_METADATA: Metadata = {
  title: `${nakshatraDisplayName(KRITTIKA.number, "en")} — Visual Profile`,
  description: "Visual profile of Karthigai Nakshathiram: personality traits, career strengths, dasa timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/krittika/visual" },
  openGraph: {
    title: `${nakshatraDisplayName(KRITTIKA.number, "en")} — Visual Profile`,
    description: "Visual profile of Karthigai Nakshathiram: personality traits, career strengths, dasa timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/krittika/visual",
    type: "article",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withDasaTimingHold(await withTamilTwin(EN_METADATA, "/natchathiram/krittika/visual", natchathiramVisualTa("krittika")!), "krittika");
}

const KRITTIKA_VISUAL: NatchathiramVisualData = {
  atAGlance: [
    { label: "Sharp Intellect",    score: 93 },
    { label: "Discipline",         score: 90 },
    { label: "Leadership",         score: 88 },
    { label: "Purifying Force",    score: 85 },
    { label: "Spiritual Strength", score: 83 },
  ],

  radar: {
    labels: ["Intelligence", "Discipline", "Leadership", "Courage", "Spirituality", "Precision"],
    values: [93, 90, 88, 86, 83, 91],
  },

  coreStrengths: [
    { symbol: "◎", label: "Sharp Intelligence",   score: 93, desc: "Agni's child — cutting clarity of thought that sees through pretence instantly." },
    { symbol: "◈", label: "Iron Discipline",       score: 90, desc: "Krittika's razor symbol: precise, structured, and uncompromising in standards." },
    { symbol: "⚡", label: "Command Presence",     score: 88, desc: "Natural authority — they lead by competence, not by pleasing." },
    { symbol: "△", label: "Purifying Instinct",    score: 85, desc: "They cut away the false — in ideas, in organisations, in relationships." },
    { symbol: "☽", label: "Spiritual Discipline",  score: 83, desc: "Kartikeya's energy — spiritual practice is not optional, it is structure." },
    { symbol: "✚", label: "Perfectionism",         score: 91, desc: "Highest personal standards; they are their own most demanding critic." },
  ],

  careerAbilities: [
    { label: "Military & Defence",          score: 92 },
    { label: "Engineering & Precision Work", score: 90 },
    { label: "Medicine & Surgery",           score: 88 },
    { label: "Administration & Law",         score: 86 },
    { label: "Education & Research",         score: 82 },
  ],
  careerNote: "Thrives in roles that demand precision, command, and the courage to cut through complexity — the surgeon, the commander, the builder of systems.",

  careerClusters: [
    { symbol: "⚡", title: "Military & Defence",     desc: "Command, strategy, discipline — Kartikeya's domain suits Krittika perfectly." },
    { symbol: "◎", title: "Engineering & Science",   desc: "Structural analysis, precision engineering, mathematics, and physics." },
    { symbol: "✚", title: "Medicine & Surgery",      desc: "The scalpel is Krittika's instrument — surgical precision and diagnostic clarity." },
    { symbol: "◈", title: "Law & Administration",    desc: "Judge, IAS, corporate governance — authority with discipline." },
    { symbol: "△", title: "Education & Training",    desc: "Demanding teacher, excellent trainer, produces results others cannot." },
    { symbol: "☽", title: "Spiritual Leadership",    desc: "Temple administration, Vedic teaching, fire ritual — Agni's natural domain." },
  ],

  modernApps: [
    { symbol: "⚡", title: "Cybersecurity & Defence Tech", desc: "Precision, vigilance, and strategic thinking — ideal for security roles." },
    { symbol: "◎", title: "Systems & Data Engineering",    desc: "Architecture design, database systems, precision analytics." },
    { symbol: "✚", title: "Medical & Surgical Innovation", desc: "Robotic surgery, diagnostics AI, precision medicine." },
    { symbol: "◈", title: "Legal & Compliance Tech",       desc: "Regulatory AI, corporate governance, forensic accounting." },
    { symbol: "△", title: "Educational Technology",        desc: "Curriculum design, e-learning platforms, skill certification." },
    { symbol: "☽", title: "Vedic & Heritage Studies",     desc: "Agamic studies, temple documentation, sacred fire traditions." },
  ],

  dashaTimeline: [
    {
      planet: "Sun", theme: "Born into Authority",
      detail: {
        expect: "Krittika is born into Sun dasa — a powerful but brief opening statement. This child arrives with an unusual sense of presence that even adults recognise; there is something commanding about them from infancy. The early years often place the father at the centre of the family narrative — either as a strong, shaping influence or, if absent or compromised, as a defining absence. Where the balance at birth is long enough to reach school entry, academic life begins easily; Krittika children are sharp and structured learners. Health in Sun dasa is generally good but fevers and inflammatory conditions can appear quickly. Krittika is born inside this dasa, so only the balance remaining at birth is lived; the pada decides how much, and the range shown for this dasa gives it.",
        navigate: "The father's health and professional standing are deeply tied to the family's stability in this period — monitor both. Krittika Sun-Dasa children can display early perfectionism that manifests as rigidity or temper; do not mistake these for personality flaws, they are Agni's fire seeking correct channelling. Eye health deserves attention even in infancy. The brevity of this dasa is its own challenge — the Sun's gifts open fast and close before the person can fully comprehend them.",
        focus: "Surya namaskar practice introduced as early as possible — even as family ritual — seeds a lifetime of solar strength. Sunday worship at a Suryanarayana shrine or Aditya temple establishes the child's connection to solar authority. Naming the child after a solar or warrior deity or on a significant Sunday is traditionally considered auspicious. The brevity of this dasa means every day of it carries weight.",
      },
    },
    {
      planet: "Moon", theme: "Learning & First World",
      detail: {
        expect: "Moon dasa opens anywhere from birth to the start of schooling, by pada, and carries Krittika through the school years — for the shorter balances to the middle of schooling, for the longer ones to its close. The sharp intellect established at birth now encounters the emotional complexity of peer relationships and social learning. Academic performance is typically strong — Krittika Moon children excel in structured subjects (mathematics, science, languages) — but the emotional dimension of school life can be harder. Friendships are selective and deep rather than wide. A strong attachment to the mother and maternal figure characterises this period. Toward the close of the dasa, the first clear academic direction emerges.",
        navigate: "Moon's emotional tides conflict with Krittika's fire nature — mood swings, unexplained irritability, and sensitivity to criticism are common while it runs — through childhood for the shorter balances, and on into mid-adolescence for the longer ones. Mother's health and the relationship with the mother requires careful stewardship; any disruption in the maternal bond resonates through Krittika's entire emotional development. The Moon–Rahu bhukti (the table below gives when it begins and how long it lasts) is the most turbulent sub-period — in a child it shows as fears, disturbed sleep, and sudden unsettlement, so keep routines steady. Monitor sleep patterns and digestive health throughout this dasa.",
        focus: "Monday fasting and Ekadasi observances stabilise Moon dasa's emotional undertow even for a child. Channelling Krittika's intensity into structured activities — martial arts, competitive academics, music — prevents the frustration of unstructured energy from becoming anxiety. Also watch the Moon–Mars bhukti within this dasa (the bhukti table below gives when it begins and how long it lasts); it falls early in the dasa, in infancy or early childhood. For Mesha-pada Krittika, Mars is the rasi lord — this sub-period carries the first serious assertion of self-will, physical aggression drive, and competitive fire. Channel it into disciplined sport or physical training rather than allowing it to create conflict at home.",
      },
    },
    {
      planet: "Mars", theme: "Rasi Lord Claims the Field",
      detail: {
        expect: "Mars dasa, running from adolescence toward early adulthood, is among the most consequential periods in Krittika's life. For Mesha-pada (first pada) Krittika natives, Mars is the lord of your rasi — this makes his dasa doubly charged. Where other nakshathirams experience Mars dasa as one planetary period among nine, for Mesha Krittika it is the rasi lord himself arriving at the threshold of adulthood. Physical power, competitive drive, and the will to achieve peak together at the very years when life's first major battles are fought: board examinations, competitive entrance tests, first independent decisions, and — where the dasa runs on — first jobs. Campus leadership, military ambitions, or athletic achievement are strongly favoured. A first serious romantic interest can arrive in the Mars–Venus bhukti (the bhukti table below gives when).",
        navigate: "Mars dasa's combination with Agni nakshathiram energy creates a potent but potentially destructive mix if unchecked. Accidents, rash decisions, and confrontations with authority figures (parents, teachers, supervisors) are the primary risks of this dasa. Anger management is not optional — one violent or irreversible action in this window can alter the trajectory permanently. For Rishabam-pada Krittika, Mars dasa is less personally charged but still brings physical boldness and independence that requires direction.",
        focus: "Tuesday Murugan worship — Krittika's own presiding deity is Kartikeya, making this the natural remedy and amplifier both. Red-flower offerings, Shashthi Kavacham recitation, and disciplined martial or athletic practice channel Mars's peak energy constructively. Competitive entrance examinations and physical endurance challenges are Krittika's natural domain in this dasa — pursue both without hesitation. The warrior within must have a worthy battle to fight.",
      },
    },
    {
      planet: "Rahu", theme: "The Great World Opens",
      detail: {
        expect: "Rahu dasa is Krittika's longest dasa and coincides with the building years of adult life, the prime professional years. This is when Krittika's disciplined intelligence collides with the complexity of the real world — and, for those who navigate it well, when the most significant career achievements are built. Foreign influence — study abroad, international clients, technology exposure — accelerates progress. The analytical and engineering instinct that Krittika carries from birth finds its most fertile professional soil here. Marriage and children may fall within this dasa, and property acquisition becomes feasible as it advances. A node carries no marriage significator of its own: where marriage falls in Rahu's dasa, it is read from Rahu's dispositor and from the seventh house and its lord, with Venus and Jupiter as the significators, not from Rahu itself, and judged from the individual horoscope as a tendency rather than a fixed time. By its close, the professional identity is fully formed and typically commanding.",
        navigate: "Rahu's principal danger for Krittika is the corruption of the perfectionist nature — a drive for excellence mutating into an obsession with external recognition that compromises integrity. The Rahu–Saturn bhukti (the table below gives when it begins and how long it lasts) is a high-pressure sub-period, combining Rahu's ambition with Saturn's demand for results. Health: nervous system, respiratory system, and skin conditions require attention. Rahu dasa can also produce a period of spiritual emptiness as the intellectual focus crowds out the inner life — do not ignore this signal.",
        focus: "Saturday prayers at a Rahu shrine and coconut offerings maintain grounding. Also watch the Rahu–Venus bhukti within this dasa (the bhukti table below gives when it begins and how long it lasts). For Rishabam-pada Krittika, Venus is the rasi lord — this window carries the rasi lord's amplified quality: creative intelligence, aesthetic refinement, and relational depth surge strongly. Major relationships formed or major creative professional work launched in this sub-period carries the rasi lord's seal. Do not let pragmatism override this window's invitation to connect deeply.",
      },
    },
    {
      planet: "Jupiter", theme: "Authority Earns Its Wisdom",
      detail: {
        expect: "Jupiter dasa finds Krittika in mid-life, at the summit of professional authority. Career peaks — a senior leadership role, an institutional honour, or the establishment of an independent practice — arrive within this dasa, most often in its first half. The teaching impulse strengthens dramatically; Krittika begins training successors and contributing to the field rather than simply competing within it. Children are entering adulthood and requiring the parent's wisdom rather than their control — a transition that Krittika's perfectionist nature must navigate consciously. Financial prosperity typically reaches its most stable phase in Jupiter dasa.",
        navigate: "Jupiter's greatest trap for Krittika is rigidity — the belief that hard-won experience translates into permanent correctness. Intellectual arrogance, particularly toward younger professionals, can alienate the very people who would carry Krittika's legacy forward. Liver health, weight management, and metabolic monitoring become relevant as this dasa advances. A tendency to over-commit — to lead more projects than is sustainable — requires conscious limitation.",
        focus: "Thursday Dakshinamurthy worship — the presiding deity of teaching and wisdom — is particularly resonant for Krittika in Jupiter dasa. Unconditional generosity with knowledge and mentoring is the primary remedy. Guru Pushyami days carry extraordinary potency for Krittika during this period. Write, document, and formalise what you know — the next generation needs the structure your mind has built.",
      },
    },
    {
      planet: "Saturn", theme: "Disciplined Ripening",
      detail: {
        expect: "Saturn dasa, in the later years, is one of Krittika's longest periods and — unusually among nakshatrams — one of its most productive. Krittika's natural discipline and structural intelligence aligns with Saturn's demands rather than chafing against them. Institutional recognition, community leadership, and the quiet consolidation of everything built in prior decades characterise this period. Grandchildren arrive and provide a new dimension of purpose. Charitable and social work amplifies naturally. Late-career achievements — honours, publications, leadership of organisations — are more common in Krittika's Saturn dasa than in almost any other nakshathiram.",
        navigate: "Saturn's primary health warnings for Krittika in this dasa are musculoskeletal (joints, spine), cardiovascular, and respiratory. Cold, dampness, and overwork compound rapidly at this stage of life. The discipline that served Krittika through the working years must now be applied to rest and recovery — a lesson Krittika resists but cannot avoid. Any unresolved karmic obligations — broken promises, family disputes, unfulfilled commitments — surface with unusual persistence in Saturn dasa.",
        focus: "Saturday oil bath, Shani worship, Hanuman worship, and systematic service to the disadvantaged are Saturn's correct remedies for Krittika. Makar Sankranti and Shani Jayanti observances carry particular potency. Legal and financial affairs should be settled cleanly early in this dasa, before it deepens — Saturn does not allow indefinite deferral of obligations. The discipline you have maintained becomes the foundation of peace in this period.",
      },
    },
    {
      planet: "Mercury", theme: "The Living Library",
      detail: {
        expect: "Mercury dasa, in the very late years, finds Krittika in an unexpected flowering of intellectual life. The accumulated precision of a lifetime — the sharp analysis, the structured knowledge, the disciplined study — produces insights that are genuinely irreplaceable. Writing memoirs, teaching spiritually, advising institutions, and conducting correspondence with depth become the primary activities. Technology (if embraced in earlier decades) provides surprising new avenues of connection and contribution. The mind, kept active by decades of rigorous use, tends to remain lucid well into Mercury dasa.",
        navigate: "Mercury governs the nervous system and lungs — at this age, respiratory conditions, tremors, and memory fragmentation are the primary concerns. Regular social and intellectual engagement maintains Mercury's vitality far longer than withdrawal into passivity. Cold and dry environments aggravate Mercury conditions — adequate warmth is non-negotiable. Avoid excessive sensory stimulation that fragments the still-sharp mind.",
        focus: "Wednesday worship, green offerings, and continued intellectual engagement — reading, writing, and substantive conversation — are the remedies. Any formal transfer of knowledge — writings, recordings, mentorships — completed in Mercury dasa becomes a lasting contribution. Vishnu Sahasranama recitation provides both spiritual grounding and Mercury's natural resonance.",
      },
    },
    {
      planet: "Ketu", theme: "Return to Fire",
      detail: {
        expect: "Ketu dasa is the final chapter — reached by very few, but those who reach it carry the fullness of Agni's lifecycle. Where life began under the Sun's solar fire, it completes under Ketu's spiritual fire. A deep withdrawal from outer engagement is natural and appropriate. Attachment to outcomes dissolves. The person experiences — and this is most clearly seen in Krittika of all nakshatrams — a return to the essential: silence, spiritual presence, and the simple flame of consciousness. Pilgrimage, if physically possible, carries special significance here.",
        navigate: "Physical dependence must be met with grace rather than Krittika's habitual resistance to vulnerability. The body's demands are simple and absolute — warmth, nourishment, adequate rest, gentle movement. Spiritual companions and caregivers who understand the depth of this period belong alongside medical care, not in place of it.",
        focus: "Ganapati worship, Ketu shrine visits, pitru tharpanam, black sesame offerings, and recitation of the Katha Upanishad (Yama's teaching on death) or any text on liberation are the correct remedies. A peaceful end — conscious, prepared, and spiritually anchored — is the final achievement of Agni's child.",
      },
    },
  ],

  spirituality: [
    {
      title: "Kartikeya & Agni Worship",
      desc: "Krittika's presiding deity is Agni and its protector is Kartikeya — Tuesday Murugan worship and fire ritual (homa) are the primary spiritual practices.",
    },
    {
      title: "Suryanarayana Devotion",
      desc: "Sunday Surya worship, Aditya Hridayam recitation, and offering water to the rising sun amplify the Sun dasa's foundational gifts across the entire lifetime.",
    },
    {
      title: "Fire Ritual & Vedic Discipline",
      desc: "Krittika's spiritual home is the yajna fire — any regular fire ritual, even a simple deepam lighting at home, fulfils the native's natural inclination toward purification.",
    },
  ],

  guidance: "Your sharpness is a gift — never dull it to make others comfortable. Master one field completely, build the discipline that sustains mastery across decades, and remember that Agni purifies but does not destroy what is worthy.",

  compatibleEn: ["Rohini", "Hastham", "Uthiram", "Poosam", "Anusham"],
  compatibleNote: "These nakshatras complement Krittika's precision, discipline, and command presence with warmth, depth, and relational balance.",

  ta: {
    atAGlanceLabels: ["கூர்மையான அறிவு", "ஒழுக்கம்", "தலைமை", "சுத்திகரிக்கும் சக்தி", "ஆன்மீக வலிமை"],
    radarLabels: ["அறிவு", "ஒழுக்கம்", "தலைமை", "தைரியம்", "ஆன்மீகம்", "துல்லியம்"],
    coreStrengths: [
      { label: "கூர்மையான அறிவு",       desc: "அக்னியின் பிள்ளை — பொய்யை கூரிய தெளிவுடன் உடனே அடையாளம் காண்கிறார்கள்." },
      { label: "இரும்பு ஒழுக்கம்",       desc: "கார்த்திகை ரேகை சின்னம்: துல்லியம், கட்டமைப்பு, தரத்தில் சமரசமின்மை." },
      { label: "கட்டளை இருப்பு",         desc: "இயல்பான அதிகாரம் — திறமை மூலம் தலைமை, மகிழ்விக்க முயன்று அல்ல." },
      { label: "சுத்திகரிக்கும் உள்ளுணர்வு", desc: "பொய்யானதை வெட்டி தெளிவு செய்கிறார்கள் — சிந்தனையில், அமைப்பில், உறவில்." },
      { label: "ஆன்மீக ஒழுக்கம்",        desc: "முருகன் சக்தி — ஆன்மீக நடைமுறை விருப்பமல்ல, அது கட்டமைப்பு." },
      { label: "சிறந்தது மட்டுமே போதும்", desc: "உயர்ந்த தனிப்பட்ட தரங்கள்; தங்கள் கடுமையான விமர்சகர் தாங்களே." },
    ],
    careerAbilityLabels: ["இராணுவம் & பாதுகாப்பு", "பொறியியல் & துல்லிய வேலை", "மருத்துவம் & அறுவை சிகிச்சை", "நிர்வாகம் & சட்டம்", "கல்வி & ஆராய்ச்சி"],
    careerClusters: [
      { title: "இராணுவம் & பாதுகாப்பு",     desc: "கட்டளை, உத்தி, ஒழுக்கம் — கார்த்திகேயனின் தளம் கார்த்திகைக்கு ஏற்றது." },
      { title: "பொறியியல் & அறிவியல்",       desc: "கட்டமைப்பு பகுப்பாய்வு, துல்லிய பொறியியல், கணிதம்." },
      { title: "மருத்துவம் & அறுவை சிகிச்சை", desc: "அறுவை கத்தி கார்த்திகையின் கருவி — அறுவை துல்லியம் இயல்பு." },
      { title: "சட்டம் & நிர்வாகம்",          desc: "நீதிபதி, IAS, நிறுவன ஆட்சி — ஒழுக்கத்துடன் அதிகாரம்." },
      { title: "கல்வி & பயிற்சி",              desc: "கடுமையான ஆசிரியர், சிறந்த பயிற்சியாளர், மற்றவர்களால் முடியாத முடிவுகளை தருகிறார்கள்." },
      { title: "ஆன்மீக தலைமை",               desc: "கோயில் நிர்வாகம், வேத கற்பித்தல், யாக நடத்துதல் — அக்னியின் இயல்பான தளம்." },
    ],
    modernApps: [
      { title: "சைபர் பாதுகாப்பு & தொழில்நுட்பம்", desc: "துல்லியம், விழிப்புணர்வு, உத்தி சிந்தனை — பாதுகாப்பு பாத்திரங்களுக்கு ஏற்றது." },
      { title: "அமைப்பு & தரவு பொறியியல்",          desc: "கட்டிடக்கலை வடிவமைப்பு, தரவுத்தளம், துல்லிய பகுப்பாய்வு." },
      { title: "மருத்துவ & அறுவை கண்டுபிடிப்பு",    desc: "ரோபோ அறுவை சிகிச்சை, நோயறிதல் AI, துல்லிய மருத்துவம்." },
      { title: "சட்ட & இணக்க தொழில்நுட்பம்",        desc: "ஒழுங்குமுறை AI, நிறுவன ஆட்சி, தடயவியல் கணக்கு." },
      { title: "கல்வி தொழில்நுட்பம்",               desc: "பாடத்திட்ட வடிவமைப்பு, e-learning தளங்கள், திறன் சான்றிதழ்." },
      { title: "வேதிய & பாரம்பரிய ஆய்வுகள்",        desc: "ஆகம ஆய்வுகள், கோயில் ஆவணமாக்கல், யாக மரபு." },
    ],
    dashaThemes: [
      "அதிகாரத்தில் பிறப்பு — சூரியன், தந்தை, முதல் தீ",
      "கற்றல் & முதல் உலகம் — பள்ளி, நண்பர்கள், உணர்வு கண்டுபிடிப்பு",
      "ராசி அதிபதி ஆட்டத்தை கோருகிறார் — போட்டி, வெற்றி, முதல் சாதனை",
      "மாபெரும் உலகம் திறக்கிறது — தொழில், திருமணம், சர்வதேச தொடர்பு",
      "அதிகாரம் ஞானம் பெறுகிறது — தலைமை, கற்பித்தல், மரபு கட்டுவது",
      "ஒழுக்கமான பக்குவம் — பிற்கால தொழில் உச்சம், சமூக தலைமை",
      "வாழும் நூலகம் — ஆழமான ஞானம், எழுத்து, நீடித்த பங்களிப்பு",
      "நெருப்புக்கு திரும்புகிறது — ஆன்மீக விடுதலை, கர்ம நிறைவு",
    ],
    dashaDetails: [
      {
        expect: "கார்த்திகை ஜாதகர் சூரிய தசையில் பிறக்கிறார் — சக்திவாய்ந்த ஆனால் குறுகிய திறப்பு அறிக்கை. இந்த குழந்தை குழந்தைப் பருவத்திலிருந்தே பெரியவர்களும் உணரும் அசாதாரண இருப்பு உணர்வுடன் வருகிறது. ஆரம்ப ஆண்டுகள் அடிக்கடி தந்தையை குடும்பக் கதையின் மையத்தில் வைக்கின்றன — வலுவான, வடிவமைக்கும் தாக்கமாக, அல்லது இல்லாமலோ குறைபாடுடனோ இருந்தால் வரையறுக்கும் வெற்றிடமாக. பிறக்கும்போது இருப்பு பள்ளி தொடக்கம் வரை நீளுமானால் கல்வி எளிதாகத் தொடங்கும்; கார்த்திகைக் குழந்தைகள் கூர்மையான, கட்டமைப்புடன் கற்பவர்கள். சூரிய தசையில் ஆரோக்கியம் பொதுவாக நன்று, ஆனால் காய்ச்சலும் அழற்சி நிலைகளும் விரைவில் தோன்றலாம். கார்த்திகை இந்த தசையின் நடுவிலேயே பிறப்பதால், பிறக்கும்போது மீதமுள்ள இருப்பு மட்டுமே வாழப்படுகிறது; அது பாதத்தைப் பொறுத்தது — இந்த தசைக்குக் காட்டப்படும் வரம்பு அதைச் சொல்கிறது.",
        navigate: "இந்தக் காலத்தில் தந்தையின் ஆரோக்கியமும் தொழில் நிலையும் குடும்பத்தின் நிலைத்தன்மையுடன் ஆழமாகப் பிணைந்துள்ளன — இரண்டையும் கவனியுங்கள். சூரிய தசையில் உள்ள கார்த்திகைக் குழந்தைகள் ஆரம்பத்திலேயே பரிபூரணவாதம் காட்டலாம்; அது பிடிவாதமாகவோ கோபமாகவோ வெளிப்படலாம் — இவற்றைக் குணக் குறைபாடுகள் என்று தவறாக எண்ணாதீர்கள்; சரியான வழியைத் தேடும் அக்னியின் நெருப்பு அது. கைக்குழந்தைப் பருவத்திலேயே கண் ஆரோக்கியம் கவனம் பெற வேண்டும். இந்தத் தசையின் குறுகிய காலமே அதன் சவால் — சூரியனின் கொடைகள் வேகமாகத் திறந்து, முழுமையாகப் புரிந்துகொள்ளும் முன்பே மூடிவிடுகின்றன.",
        focus: "சூர்ய நமஸ்காரத்தை முடிந்தவரை ஆரம்பத்திலேயே — குடும்பச் சடங்காகவேனும் — அறிமுகப்படுத்துவது வாழ்நாள் முழுவதற்குமான சூரிய வலிமையை விதைக்கிறது. ஞாயிற்றுக்கிழமை சூரிய நாராயணர் சன்னதியிலோ ஆதித்யர் கோவிலிலோ வழிபாடு, சூரிய அதிகாரத்துடனான குழந்தையின் தொடர்பை நிறுவுகிறது. சூரிய அல்லது வீர தெய்வத்தின் பெயரைக் குழந்தைக்குச் சூட்டுவதோ, முக்கியமான ஞாயிற்றுக்கிழமையில் பெயர் சூட்டுவதோ மரபாகச் சுபமாகக் கருதப்படுகிறது. இந்தக் குறுகிய தசையின் ஒவ்வொரு நாளும் முக்கியத்துவம் கொண்டது.",
      },
      {
        expect: "சந்திர தசை பாதத்தைப் பொறுத்து பிறப்பிலோ பள்ளித் தொடக்கத்திலோ தொடங்கி, கார்த்திகையை பள்ளிக் காலம் வழியாக அழைத்துச் செல்கிறது — குறைந்த இருப்பில் பள்ளிக் காலத்தின் நடுப்பகுதி வரை, நீண்ட இருப்பில் அதன் முடிவு வரை. பிறப்பிலேயே நிறுவப்பட்ட கூர்மையான அறிவு இப்போது சகாக்கள் உறவுகளினதும் சமூகக் கற்றலினதும் உணர்வுச் சிக்கலைச் சந்திக்கிறது. கணிதம், அறிவியல், மொழிகள் போன்ற கட்டமைப்புப் பாடங்களில் கல்விச் செயல்திறன் பொதுவாக வலுவாக இருக்கும்; ஆனால் பள்ளி வாழ்வின் உணர்வுப் பக்கம் கடினமாகலாம். நட்புகள் அகலமாக அல்லாமல் தேர்ந்தெடுத்த, ஆழமானவையாக இருக்கும். தாயுடனும் தாய்வழி பெரியவர்களுடனும் வலுவான பிணைப்பு இந்த காலகட்டத்தை வரையறுக்கிறது. தசையின் முடிவை நெருங்கும்போது முதல் தெளிவான கல்வித் திசை உருவாகிறது.",
        navigate: "சந்திரனின் உணர்வு அலைகள் கார்த்திகையின் நெருப்பு இயல்புடன் மோதுகின்றன — மனநிலை மாற்றங்கள், விளக்கமுடியாத எரிச்சல், விமர்சனத்துக்கான உணர்திறன் ஆகியவை இந்தத் தசை நடக்கும் வரை பொதுவானவை — குறைந்த இருப்பில் குழந்தைப் பருவம் முழுவதும், நீண்ட இருப்பில் வளரிளம் பருவத்தின் நடுப்பகுதி வரை. தாயின் ஆரோக்கியமும் தாயுடனான உறவும் கவனமாகப் பேணப்பட வேண்டும்; தாய்ப் பிணைப்பில் ஏற்படும் எந்தத் தடையும் கார்த்திகையின் முழு உணர்வு வளர்ச்சியிலும் எதிரொலிக்கும். சந்திர–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மிகவும் கலக்கமான துணைக் காலம் — குழந்தையிடம் அது பயம், தூக்கக் கலக்கம், திடீர் அமைதியின்மையாக வெளிப்படும்; ஆகவே வழக்கங்களை நிலையாக வைத்திருங்கள். இந்த தசை முழுவதும் தூக்கம் மற்றும் செரிமான ஆரோக்கியத்தைக் கவனியுங்கள்.",
        focus: "திங்கள் விரதம் மற்றும் ஏகாதசி அனுஷ்டானங்கள் குழந்தைக்கும் சந்திரனின் உணர்வு அலைகளை நிலைப்படுத்தும். கார்த்திகையின் தீவிரத்தை கட்டமைக்கப்பட்ட செயல்களில் — போர்க்கலை, போட்டிக் கல்வி, இசை — செலுத்துவது கட்டமைப்பற்ற ஆற்றலின் விரக்தி பதற்றமாக மாறுவதைத் தடுக்கும். கவனிக்கவும்: சந்திர–செவ்வாய் புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்); இது தசையின் தொடக்கத்திலேயே, கைக்குழந்தைப் பருவத்திலோ ஆரம்பக் குழந்தைப் பருவத்திலோ வருகிறது. மேஷ பாத கார்த்திகைக்கு செவ்வாய் ராசி அதிபதி — இந்த துணைக் காலம் சுய உறுதி, உடல் போட்டி உந்துதல், ஆக்கிரமிப்பு நெருப்பு ஆகியவற்றின் முதல் தீவிர வெளிப்பாட்டை கொண்டு வருகிறது. இதை வீட்டில் மோதலாக மாற விடாமல், ஒழுக்கமான விளையாட்டு அல்லது உடல் பயிற்சியில் செலுத்துங்கள்.",
      },
      {
        expect: "செவ்வாய் தசை வளரிளம் பருவத்திலிருந்து இளம் வயது வந்த காலம் நோக்கிச் செல்வது; கார்த்திகையின் வாழ்வில் மிக முக்கியமான காலகட்டங்களில் ஒன்று. மேஷ பாத (முதல் பாதம்) கார்த்திகை ஜாதகர்களுக்கு, செவ்வாய் உங்கள் ராசியின் அதிபதி — இது இரட்டை வலிமையுடன் வருகிறது. மற்ற நட்சத்திரங்கள் செவ்வாய் தசையை ஒன்பது கிரக காலங்களில் ஒன்றாக அனுபவிக்கும்போது, மேஷ கார்த்திகைக்கு இது வயது வந்த வாழ்வின் வாயிலில் ராசி அதிபதியே வருவது. உடல் வலிமை, போட்டி உந்துதல், சாதிக்கும் விருப்பம் ஆகியவை வாழ்வின் முதல் பெரிய போர்கள் நடக்கும் அதே ஆண்டுகளில் உச்சம் அடைகின்றன: வாரியத் தேர்வுகள், போட்டி நுழைவுத் தேர்வுகள், முதல் சுதந்திரமான முடிவுகள், தசை நீளும்போது முதல் வேலைகளும். கல்லூரி தலைமை, ராணுவ லட்சியம், விளையாட்டுச் சாதனை வலுவாகச் சாதகம். முதல் தீவிர காதல் ஈர்ப்பு செவ்வாய்–சுக்கிர புக்தியில் வரலாம் (எப்போது என்பது கீழே உள்ள புக்தி அட்டவணையில்).",
        navigate: "அக்னி நட்சத்திர சக்தியுடன் செவ்வாய் தசையின் இணைவு கட்டுப்படுத்தப்படாவிட்டால் அழிவை ஏற்படுத்தும். விபத்துகள், அவசர முடிவுகள், அதிகாரிகளுடன் மோதல் — பெற்றோர், ஆசிரியர்கள், மேலதிகாரிகள் — இந்த தசையின் முதன்மை அபாயங்கள். கோப நிர்வாகம் விருப்பமல்ல — இந்த சாளரத்தில் ஒரு வன்முறையான அல்லது திரும்ப முடியாத செயல் திசையை நிரந்தரமாக மாற்றலாம். ரிஷப பாத கார்த்திகைக்கு செவ்வாய் தசை தனிப்பட்ட முறையில் குறைவாக வலுவூட்டப்பட்டது, ஆனாலும் வழிகாட்டுதல் தேவைப்படும் உடல் துணிவையும் சுதந்திரத்தையும் தருகிறது.",
        focus: "செவ்வாய்க்கிழமை முருகன் வழிபாடு — கார்த்திகையின் தலைமை தெய்வமே கார்த்திகேயன் என்பதால், இது இயல்பான பரிகாரமும் வலுப்படுத்தலும் ஆகும். சிவப்பு மலர் அர்ப்பணம், ஷஷ்டி கவசம் பாராயணம், ஒழுக்கமான தற்காப்புக்கலை அல்லது விளையாட்டுப் பயிற்சி செவ்வாயின் உச்ச ஆற்றலை ஆக்கபூர்வமாகச் செலுத்துகின்றன. போட்டி நுழைவுத் தேர்வுகளும் உடல் தாங்குதிறன் சவால்களும் இந்தத் தசையில் கார்த்திகையின் இயல்பான களம் — இரண்டையும் தயக்கமின்றித் தொடருங்கள். உள்ளிருக்கும் வீரனுக்குப் போராடத் தகுந்த ஒரு போர் வேண்டும்.",
      },
      {
        expect: "ராகு தசை கார்த்திகையின் மிக நீண்ட தசை; வயது வந்த வாழ்வின் கட்டுமான ஆண்டுகளுடனும் முதன்மையான தொழில் ஆண்டுகளுடனும் ஒத்துப்போகிறது. கார்த்திகையின் ஒழுக்கமான அறிவு நிஜ உலகின் சிக்கலுடன் மோதும்போது, நன்றாகக் கடப்பவர்களுக்கு மிக முக்கியமான தொழில் சாதனைகள் கட்டப்படுகின்றன. வெளிநாட்டுத் தாக்கம் — வெளிநாட்டுக் கல்வி, சர்வதேச வாடிக்கையாளர்கள், தொழில்நுட்ப வெளிப்பாடு — முன்னேற்றத்தை வேகப்படுத்தும். பிறப்பிலிருந்தே கார்த்திகை சுமக்கும் பகுப்பாய்வு, பொறியியல் உள்ளுணர்வு இங்கு தனது மிக வளமான தொழில் மண்ணைக் காண்கிறது. திருமணமும் குழந்தைகளும் இந்தத் தசைக்குள் அமையலாம்; தசை முன்னேறும்போது சொத்து வாங்குவது சாத்தியமாகிறது. சாயாக் கிரகத்துக்குத் திருமணக் காரகத்துவம் இல்லை. ராகு தசைக்குள் திருமணம் அமைந்தால், அது ராகுவைக் கொண்டு அல்ல — ராகு நின்ற ராசியின் அதிபதி, ஜாதகத்தின் ஏழாம் வீடு, அதன் அதிபதி ஆகியவற்றைக் கொண்டு, சுக்கிரனையும் குருவையும் காரகர்களாகக் கொண்டு பார்க்கப்படுகிறது. அது ஒரு நிலையான காலம் அல்ல, ஒரு போக்கே. தசையின் முடிவில் தொழில் அடையாளம் முழுமையாக உருவாகி, பொதுவாக ஆளுமை செலுத்துவதாக இருக்கும்.",
        navigate: "ராகுவின் முதன்மையான ஆபத்து கார்த்திகையின் முழுமை நாடும் இயல்பின் சீர்கேடு — சிறப்புக்கான ஆர்வம் நேர்மையைச் சமரசம் செய்யும் வெளிப்புற அங்கீகார வெறியாக மாறுவது. ராகு–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ராகுவின் இலட்சியத்துடன் சனியின் பலன் கோரிக்கையும் சேரும் அதிக அழுத்தமான துணைக் காலம். நரம்பு மண்டலம், சுவாசம், தோல் நிலைகள் கவனிக்க வேண்டும். அறிவார்ந்த கவனம் உள் வாழ்க்கையை நெருக்குவதால் ராகு தசையில் ஆன்மீக வெறுமையும் ஏற்படலாம் — இந்த சமிக்ஞையைப் புறக்கணிக்காதீர்கள்.",
        focus: "சனிக்கிழமை ராகு சன்னதி வழிபாடு மற்றும் தேங்காய் அர்ப்பணம் தரையிறக்கத்தை பராமரிக்கிறது. கவனிக்கவும்: இந்த தசைக்குள் ராகு–சுக்கிர புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்). ரிஷப பாத கார்த்திகைக்கு சுக்கிரன் ராசி அதிபதி — இந்த சாளரம் ராசி அதிபதியின் மிகைப்படுத்தப்பட்ட தரத்தை கொண்டு வருகிறது: படைப்பு அறிவு, அழகியல் நுட்பம், உறவு ஆழம் வலுவாக உயர்கின்றன. இந்த துணைக் காலத்தில் உருவாகும் முக்கிய உறவுகள் அல்லது தொடங்கப்படும் முக்கிய படைப்பு தொழில் பணிகள் ராசி அதிபதியின் முத்திரை கொண்டவை. நடைமுறை சிந்தனை ஆழமாக இணைவதற்கான இந்த சாளரத்தின் அழைப்பை மீறிவிட விடாதீர்கள்.",
      },
      {
        expect: "குரு தசை கார்த்திகையை நடுவயதில், தொழில் அதிகாரத்தின் உச்சியில் காண்கிறது. தொழில் உச்சம் — மூத்த தலைமைப் பொறுப்பு, நிறுவன கௌரவம், அல்லது சுதந்திர நடைமுறையின் தொடக்கம் — இந்த தசைக்குள், பெரும்பாலும் அதன் முதல் பாதியில் வருகிறது. கற்பிக்கும் உந்துதல் கணிசமாக வலுப்பெறுகிறது; கார்த்திகை ஜாதகர் வெறுமனே போட்டியிடாமல் வாரிசுகளைப் பயிற்றுவித்து துறைக்கு பங்களிக்கத் தொடங்குகிறார். குழந்தைகள் வயது வந்தோராகி பெற்றோரின் கட்டுப்பாட்டை அல்லாமல் ஞானத்தைத் தேடுகிறார்கள் — கார்த்திகையின் முழுமை நாடும் இயல்பு இந்த மாற்றத்தை விழிப்புடன் கடக்க வேண்டும். நிதிச் செழிப்பு பொதுவாக குரு தசையில் மிகவும் நிலையான கட்டத்தை அடைகிறது.",
        navigate: "குரு தசையில் கார்த்திகையின் மிகப்பெரிய ஆபத்து கடினத்தன்மை — கஷ்டப்பட்டு பெற்ற அனுபவம் நிரந்தரமான சரியாகிவிடும் என்ற நம்பிக்கை. இளைய தொழில் வல்லுநர்களிடம் காட்டும் அறிவார்ந்த அகந்தை, கார்த்திகையின் மரபை முன்னெடுக்க வேண்டியவர்களையே விலக்கிவிடலாம். தசை முன்னேறும்போது கல்லீரல் ஆரோக்கியம், உடல் எடை கட்டுப்பாடு, வளர்சிதை மாற்றக் கண்காணிப்பு தேவைப்படும். தாங்கக்கூடியதை விட அதிக திட்டங்களுக்குத் தலைமை ஏற்கும் போக்கை உணர்வுடன் கட்டுப்படுத்த வேண்டும்.",
        focus: "வியாழக்கிழமை தட்சிணாமூர்த்தி வழிபாடு — கற்பித்தல் மற்றும் ஞானத்தின் தலைமை தெய்வம் — கார்த்திகைக்கு குரு தசையில் குறிப்பாக பொருத்தமானது. ஞானத்தை நிபந்தனையற்று பகிர்வதும் வழிகாட்டுவதும் முதன்மையான பரிகாரம். குரு புஷ்யமி நாட்கள் இந்த காலகட்டத்தில் அசாதாரண சக்தி கொண்டவை. உங்களுக்குத் தெரிந்ததை எழுதி, ஆவணப்படுத்தி, முறைப்படுத்துங்கள் — உங்கள் மனம் கட்டிய கட்டமைப்பு அடுத்த தலைமுறைக்குத் தேவை.",
      },
      {
        expect: "சனி தசை பிற்கால ஆண்டுகளில் வருகிறது; கார்த்திகையின் மிக நீண்ட காலகட்டங்களில் ஒன்று — மற்ற நட்சத்திரங்களில் காணாத வகையில், அதிக பயனுள்ள ஒன்றும். கார்த்திகையின் இயல்பான ஒழுக்கமும் கட்டமைப்பு அறிவும் சனியின் கோரிக்கைகளுடன் உரசாமல் ஒத்துப்போகின்றன. நிறுவன அங்கீகாரம், சமூகத் தலைமை, முந்தைய தசகங்களில் கட்டியவற்றின் அமைதியான ஒருங்கிணைப்பு இந்த காலகட்டத்தை வரையறுக்கிறது. பேரக்குழந்தைகள் வருகிறார்கள்; புதிய நோக்கத்தின் பரிமாணத்தை தருகிறார்கள். தொண்டும் சமூகப் பணியும் இயல்பாகப் பெருகும். பிற்கால தொழில் சாதனைகள் — கௌரவங்கள், வெளியீடுகள், அமைப்புகளின் தலைமை — பிற நட்சத்திரங்களை விட கார்த்திகையின் சனி தசையில் அதிகம் காணப்படுகின்றன.",
        navigate: "இந்த தசையில் கார்த்திகைக்கு சனியின் முதன்மையான ஆரோக்கிய எச்சரிக்கைகள் எலும்பு–மூட்டு–தசைநார் அமைப்பு (மூட்டுகள், முதுகெலும்பு), இதயம், சுவாசம் ஆகியவை. வாழ்வின் இந்த நிலையில் குளிர், ஈரம், அதிக வேலை விரைவாக தேங்குகின்றன. வேலை செய்யும் ஆண்டுகளில் கார்த்திகைக்கு சேவை செய்த ஒழுக்கம் இப்போது ஓய்வு மற்றும் மீட்சிக்குப் பயன்படுத்தப்பட வேண்டும் — கார்த்திகை எதிர்க்கும், ஆனால் தவிர்க்க முடியாத பாடம். தீர்க்கப்படாத கர்மக் கடமைகள் — உடைந்த வாக்குறுதிகள், குடும்பப் பூசல்கள், நிறைவேறாத பொறுப்புகள் — சனி தசையில் அசாதாரண விடாப்பிடியுடன் மேலெழும்.",
        focus: "சனிக்கிழமை எண்ணெய் குளியல், சனி வழிபாடு, ஆஞ்சநேயர் வழிபாடு, பாதிக்கப்பட்டவர்களுக்கு முறையான சேவை — சனியின் சரியான பரிகாரங்கள். மகர சங்கராந்தி, சனி ஜெயந்தி அனுஷ்டானங்கள் குறிப்பிட்ட சக்தி கொண்டவை. சட்ட மற்றும் நிதி விவகாரங்கள் இந்த தசை ஆழமடையும் முன், தொடக்கத்திலேயே தெளிவாகத் தீர்க்கப்பட வேண்டும் — சனி கடமைகளை காலவரையின்றி தள்ளி வைக்க அனுமதிக்காது. நீங்கள் காத்த ஒழுக்கமே இந்த காலத்தின் அமைதிக்கு அடித்தளம்.",
      },
      {
        expect: "மிகப் பிற்கால ஆண்டுகளில் வரும் புதன் தசை கார்த்திகையில் அறிவு வாழ்க்கையின் எதிர்பாராத பூக்கத்தை காண்கிறது. ஒரு வாழ்நாள் திரட்டிய துல்லியம் — கூர்மையான பகுப்பாய்வு, கட்டமைக்கப்பட்ட ஞானம், ஒழுக்கமான கற்றல் — மாற்றவியலாத நுண்ணறிவுகளை தருகிறது. நினைவுக் குறிப்புகள் எழுதுவது, ஆன்மீகம் கற்பிப்பது, நிறுவனங்களுக்கு ஆலோசனை கூறுவது, ஆழமான கடிதப் பரிமாற்றம் ஆகியவை முதன்மைச் செயல்பாடுகளாகின்றன. முந்தைய தசகங்களில் தொழில்நுட்பத்தை ஏற்றிருந்தால், அது இணைப்புக்கும் பங்களிப்புக்கும் வியக்கத்தக்க புதிய வழிகளைத் தரும். பல தசகங்களாக கடுமையாகப் பயன்படுத்தப்பட்டு சுறுசுறுப்பாக வைக்கப்பட்ட மனம் புதன் தசையிலும் நீண்டகாலம் தெளிவாகவே இருக்கும்.",
        navigate: "புதன் நரம்பு மண்டலம் மற்றும் நுரையீரல்களை நிர்வகிக்கிறார் — இந்த வயதில் சுவாச நிலைகள், நடுக்கம், நினைவு சிதறல் முதன்மையான கவலைகள். செயலற்ற ஒதுக்கத்தை விட, வழக்கமான சமூக மற்றும் அறிவார்ந்த ஈடுபாடு புதன் சக்தியை நீண்டகாலம் பராமரிக்கிறது. குளிரும் வறட்சியும் புதன் சார்ந்த நிலைகளை மோசமாக்கும் — போதுமான வெப்பம் தவிர்க்க முடியாதது. இன்னும் கூர்மையாக இருக்கும் மனதைச் சிதறடிக்கும் அதிகப்படியான புலன் தூண்டலைத் தவிருங்கள்.",
        focus: "புதன்கிழமை வழிபாடு, பசுமை அர்ப்பணங்கள், தொடர்ந்த அறிவார்ந்த ஈடுபாடு — வாசிப்பு, எழுத்து, பொருள் நிறைந்த உரையாடல் — பரிகாரங்கள். புதன் தசையில் நிறைவு செய்யப்படும் எந்த முறையான ஞானப் பரிமாற்றமும் — எழுத்துகள், பதிவுகள், வழிகாட்டல்கள் — நீடித்த பங்களிப்பாகிறது. விஷ்ணு சஹஸ்ரநாம பாராயணம் ஆன்மீக அடித்தளத்தையும் புதனின் இயல்பான ஒத்திசைவையும் ஒருசேரத் தருகிறது.",
      },
      {
        expect: "கேது தசை இறுதி அத்தியாயம் — மிகச் சிலரே இதை அடைகிறார்கள், ஆனால் அடைவோர் அக்னியின் வாழ்க்கை சுழற்சியின் முழுமையை சுமந்திருப்பார்கள். சூரியனின் நெருப்பில் தொடங்கிய வாழ்க்கை, கேதுவின் ஆன்மீக நெருப்பில் முடிகிறது. வெளிப்புற ஈடுபாட்டிலிருந்து ஆழமான விலகல் இயல்பானது, பொருத்தமானதும் கூட. விளைவுகள் மீதான பற்று கரைகிறது. எல்லா நட்சத்திரங்களிலும் கார்த்திகையில் இது மிகத் தெளிவாகத் தெரியும்: அத்தியாவசியத்துக்குத் திரும்புதல் — மௌனம், ஆன்மீக இருப்பு, உணர்வின் எளிய சுடர். உடல் ரீதியாக சாத்தியமானால் திருத்தல யாத்திரை இங்கு சிறப்பு முக்கியத்துவம் பெறும்.",
        navigate: "உடல் சார்பு கார்த்திகையின் வழக்கமான பாதிப்பை எதிர்ப்பதை விட கருணையுடன் சந்திக்கப்பட வேண்டும். உடலின் கோரிக்கைகள் எளிமையானவை மற்றும் முழுமையானவை — அரவணைப்பு, ஊட்டச்சத்து, போதுமான ஓய்வு, மென்மையான உடலசைவு. இந்தக் காலத்தின் ஆழத்தைப் புரிந்துகொள்ளும் ஆன்மீகத் துணைகளும் பராமரிப்பாளர்களும் தேவை; மருத்துவ சிகிச்சைக்கு மாற்றாக அல்ல, அதனுடன் சேர்த்து.",
        focus: "விநாயகர் வழிபாடு, கேது சன்னதி வழிபாடு, பித்ரு தர்ப்பணம், கருப்பு எள் அர்ப்பணம், கட உபநிஷத் (யமனின் மரணத்தைப் பற்றிய போதனை) அல்லது எந்த விடுதலை நூலின் பாராயணம் — சரியான பரிகாரங்கள். ஒரு அமைதியான முடிவு — விழிப்புடன், தயாரிக்கப்பட்டு, ஆன்மீக நங்கூரத்துடன் — அக்னியின் பிள்ளையின் இறுதி சாதனை.",
      },
    ],
    spirituality: [
      { title: "கார்த்திகேயன் & அக்னி வழிபாடு", desc: "கார்த்திகையின் தலைமை தெய்வம் அக்னி, பாதுகாவலன் கார்த்திகேயன் — செவ்வாய்க்கிழமை முருகன் வழிபாடும் ஹோம சடங்கும் முதன்மையான ஆன்மீக நடைமுறைகள்." },
      { title: "சூரிய நாராயண பக்தி",             desc: "ஞாயிற்றுக்கிழமை சூரிய வழிபாடு, ஆதித்ய ஹ்ருதயம் பாராயணம், உதய சூரியனுக்கு நீர் அர்ப்பணம் ஆகியவை சூரிய தசையின் அடித்தள கொடைகளை முழு வாழ்நாளும் வலுப்படுத்துகின்றன." },
      { title: "நெருப்பு சடங்கு & வேத ஒழுக்கம்", desc: "கார்த்திகையின் ஆன்மீக வீடு யாக நெருப்பு — வீட்டில் எளிமையான தீபம் ஏற்றுவது கூட சுத்திகரிப்பு நோக்கிய இயல்பு ஆர்வத்தை நிறைவு செய்கிறது." },
    ],
    guidance: "உங்கள் கூர்மை ஒரு வரம் — மற்றவர்களை வசதியாக வைக்க அதை மழுங்கடிக்காதீர்கள். ஒரு துறையை முழுமையாக தேர்ச்சி பெறுங்கள், தசகங்களில் தேர்ச்சியை தாங்கும் ஒழுக்கத்தை கட்டுங்கள், அக்னி சுத்திகரிக்கிறது ஆனால் தகுதியானதை அழிக்காது என்பதை நினைவில் வையுங்கள்.",
    compatibleNote: "இந்த நட்சத்திரங்கள் கார்த்திகையின் துல்லியம், ஒழுக்கம், கட்டளை இருப்பை அரவணைப்பு, ஆழம், உறவு சமநிலையால் நிரப்புகின்றன.",
    careerNote: "துல்லியம், கட்டளை, சிக்கலை வெட்டி தெளிவு செய்யும் தைரியம் ஆகியவற்றை கோரும் பாத்திரங்களில் சிறப்பாக செயல்படுகிறார்கள்.",
    modernLead: "கார்த்திகையின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "கட்டமைப்பு, விசுவாசம் மற்றும் உயர்ந்த தரங்கள் கார்த்திகையின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function KrittikaVisualPage() {
  return <NatchathiramVisualContent data={KRITTIKA} visual={KRITTIKA_VISUAL} timings={dasaTimingsFor(KRITTIKA.number)} />;
}
