import type { Metadata } from "next";
import { withTamilTwin } from "@/lib/localized-metadata";
import { withDasaTimingHold } from "@/lib/natchathiram-dasa-hold";
import { dasaTimingsFor } from "@/lib/natchathiram-dasa-timings";
import { nakshatraDisplayName } from "@/lib/nakshatra-display-name";
import { natchathiramVisualTa } from "@/lib/marketing-seo-ta";
import { UTTARA_PHALGUNI } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

const EN_METADATA: Metadata = {
  title: `${nakshatraDisplayName(UTTARA_PHALGUNI.number, "en")} — Visual Profile`,
  description: "Visual profile of Uthiram Nakshathiram: personality traits, career strengths, dasa timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/uttara-phalguni/visual" },
  openGraph: {
    title: `${nakshatraDisplayName(UTTARA_PHALGUNI.number, "en")} — Visual Profile`,
    description: "Visual profile of Uthiram Nakshathiram: personality traits, career strengths, dasa timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/uttara-phalguni/visual",
    type: "article",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withDasaTimingHold(await withTamilTwin(EN_METADATA, "/natchathiram/uttara-phalguni/visual", natchathiramVisualTa("uttara-phalguni")!), "uttara-phalguni");
}

const UTTARA_PHALGUNI_VISUAL: NatchathiramVisualData = {
  atAGlance: [
    { label: "Service & Duty",         score: 95 },
    { label: "Social Bonds",           score: 93 },
    { label: "Practical Wisdom",       score: 91 },
    { label: "Leadership Integrity",   score: 90 },
    { label: "Analytical Excellence",  score: 88 },
  ],

  radar: {
    labels: ["Service", "Social Bonds", "Wisdom", "Leadership", "Analysis", "Reliability"],
    values: [95, 93, 91, 90, 88, 94],
  },

  coreStrengths: [
    { symbol: "◎", label: "Service & Duty",          score: 95, desc: "Aryaman's child — Uttara Phalguni fulfils contracts, honours obligations, and serves with quiet, unshakeable reliability." },
    { symbol: "◈", label: "Social Architecture",      score: 93, desc: "Builder of bonds — friendships, alliances, and institutions that persist because Uttara Phalguni builds them to last." },
    { symbol: "⚡", label: "Practical Wisdom",        score: 91, desc: "Neither purely idealistic nor merely pragmatic — Uttara Phalguni synthesises principle and practicality into enduring action." },
    { symbol: "♥", label: "Leadership Integrity",    score: 90, desc: "The leader others trust not because they demand loyalty but because their consistency has earned it over time." },
    { symbol: "△", label: "Analytical Excellence",   score: 88, desc: "Mercury's Kanya influence gives Uttara Phalguni a discerning precision that Sun's Simha flair would never produce alone." },
    { symbol: "☽", label: "Steady Reliability",      score: 94, desc: "Aryaman governs agreements — Uttara Phalguni is the person who shows up, does the work, and finishes what they started." },
  ],

  careerAbilities: [
    { label: "Social & Civic Service",     score: 95 },
    { label: "Law, Contracts & Policy",    score: 93 },
    { label: "Administration & Management", score: 91 },
    { label: "Healthcare & Social Work",   score: 90 },
    { label: "Education & Research",       score: 88 },
  ],
  careerNote: "Uttara Phalguni thrives wherever service, social architecture, and reliable execution meet — the administrator who makes institutions work, the social worker who changes structural conditions, the lawyer who defends the deserving.",

  careerClusters: [
    { symbol: "◎", title: "Civic Service & Administration", desc: "Government, public sector, NGOs — Aryaman's domain of social obligation fulfilled with integrity." },
    { symbol: "◈", title: "Law & Contracts",               desc: "Legal practice, policy drafting, mediation — Uttara Phalguni's gift for binding agreements." },
    { symbol: "⚡", title: "Healthcare & Social Work",     desc: "Medicine, social welfare, community health — service as constitutional calling." },
    { symbol: "♥", title: "Education & Academia",         desc: "Teaching, research, curriculum — practical wisdom transmitted systematically." },
    { symbol: "△", title: "Management & Leadership",      desc: "Institutional leadership, operations management — reliable execution at scale." },
    { symbol: "☽", title: "Finance & Accounting",         desc: "Auditing, financial management, resource allocation — the precision of Mercury meeting the authority of the Sun." },
  ],

  modernApps: [
    { symbol: "◎", title: "GovTech & Civic Platforms",    desc: "Digital public services, civic technology, e-governance — Aryaman's reliability in modern infrastructure." },
    { symbol: "◈", title: "LegalTech & Compliance",       desc: "Contract management, regulatory technology, legal process automation." },
    { symbol: "⚡", title: "HealthTech & Social Impact",  desc: "Healthcare systems, social welfare platforms, community health technology." },
    { symbol: "♥", title: "EdTech & Research Platforms",  desc: "Educational technology, academic research tools, knowledge management." },
    { symbol: "△", title: "Enterprise Management Tools",  desc: "Operations software, project management platforms, institutional efficiency tools." },
    { symbol: "☽", title: "FinTech & Audit Technology",   desc: "Financial management platforms, audit automation, compliance tools." },
  ],

  dashaTimeline: [
    {
      planet: "Sun", theme: "Born in Solar Light",
      detail: {
        expect: "Uttara Phalguni opens in Sun dasa — a radiant, purposeful beginning for a nakshathiram that carries Aryaman's solar authority. Sun's is a short opening dasa; the balance left at birth runs from long for births in the first pada to brief for the fourth, and the range shown for this dasa gives it. The very earliest years are often marked by a family environment of warmth, structure, and clear values. The Simha pada child feels the Sun's confidence from the first; the Kanya pada child already shows Mercury's discerning thoughtfulness before school age. Both arrive at early childhood with a quiet readiness that caregivers notice. The foundation of duty, service, and social obligation that will define the entire life begins to be laid in the family dynamics of these early years.",
        navigate: "Sun dasa's opening brevity means Uttara Phalguni arrives at Moon dasa's emotional complexity before the character has had time to fully consolidate. For Simha pada, Sun is the rasi lord; this brief first dasa carries the rasi lord's amplified confidence, leadership potential, and solar brightness. Any unusual early recognition — the child others naturally look to, the natural young leader — is the rasi lord's signature. Protect this quality through the turbulence of Rahu dasa that lies ahead.",
        focus: "Sunday Surya worship, red flower offerings, and early instillation of the values of service, contract-honouring, and social responsibility are the most formative gifts parents can give. The Sun dasa child is soaking in the family's values of reliability and duty; make sure those values are worthy of being soaked in.",
      },
    },
    {
      planet: "Moon", theme: "Emotional Foundation",
      detail: {
        expect: "Moon dasa takes the solar clarity of Uttara Phalguni's earliest years and deposits it into the emotional field; it carries the child through the school years, to the middle of schooling for the shorter balances and to its close for the longer ones. The school years produce a student who is both sociable and studious; friendships are taken seriously and tend to last. The social intelligence that is core to Uttara Phalguni's nature — understanding what people need, honouring agreements, being the reliable friend — emerges consciously in Moon dasa. Toward the close of the dasa, the first significant social tests arrive: the first experience of a commitment broken, a friendship betrayed, or an agreement dishonoured by another, and the formative response Uttara Phalguni develops to those experiences.",
        navigate: "Moon dasa for Uttara Phalguni can produce over-sensitivity to social disappointment — the gap between the standard they hold themselves to and the unreliability they occasionally encounter in others. Physical concerns: digestive, hormonal, and cold-related vulnerabilities typical of Moon dasa. The Moon–Rahu bhukti (the table below gives when it begins and how long it lasts) is the most unsettled sub-period; social complexity or a family disruption may test the young Uttara Phalguni.",
        focus: "Monday Moon worship and white flower offerings provide emotional stabilisation. The most important parenting investment in Moon dasa is helping Uttara Phalguni distinguish between the standard they should maintain for themselves and the realistic variability they should extend to others — perfectionism about others' reliability will cause unnecessary suffering.",
      },
    },
    {
      planet: "Mars", theme: "First Testing",
      detail: {
        expect: "Mars dasa brings the first serious tests to Uttara Phalguni's character and commitments; it begins anywhere from late childhood to mid-adolescence, by pada, and runs toward early adulthood. Higher secondary education and, for the longer balances, early tertiary education; the first significant career or vocational choices; the first serious relationship or family obligation — all land in or near Mars dasa. Uttara Phalguni's constitutional reliability is stress-tested: can they maintain commitments under pressure? The answer established in Mars dasa tends to define the character for decades. For those who pass Mars's test with integrity, the reputation that follows is the bedrock of everything that comes after.",
        navigate: "Mars's energy at this stage can produce impatience and over-commitment — Uttara Phalguni taking on obligations they cannot yet fulfil, driven by the desire to be seen as reliable before reliability is fully established. Physical concerns: accidents, inflammatory conditions, and overexertion deserve attention. The Mars–Rahu bhukti (the table below gives when it begins and how long it lasts) is the most turbulent sub-period.",
        focus: "Tuesday Mars shrine prayers and red offering. Channel Mars's drive into one well-chosen commitment rather than many — depth of reliability on a single obligation is worth more to Uttara Phalguni's long-term reputation than breadth of undertakings.",
      },
    },
    {
      planet: "Rahu", theme: "The World Opens",
      detail: {
        expect: "Rahu dasa is the great expansion of Uttara Phalguni's career and social world; it begins in late adolescence or early adulthood and runs through the building years of working life. Advanced education or professional establishment; career ascent; marriage and family formation, where they fall here; property acquisition and potential financial progress; widening professional networks and institutional responsibilities — the full arc of adult establishment runs through Rahu's long span. A node carries no marriage significator of its own: where marriage falls in Rahu's dasa, it is read from Rahu's dispositor and from the seventh house and its lord, with Venus and Jupiter as the significators, not from Rahu itself, and judged from the individual horoscope as a tendency rather than a fixed time. Uttara Phalguni's gifts for social architecture and reliable execution find their first large-scale expression here. Recognition within a field, institutional leadership, or significant community contribution typically arrives in the second half of the dasa.",
        navigate: "Rahu's expansion can pull Uttara Phalguni beyond their authentic commitments — taking on social and professional obligations for prestige or external approval rather than genuine alignment with values. The Rahu–Saturn bhukti (the table below gives when it begins and how long it lasts) is the most demanding sub-period; overextension and value conflicts peak. Also watch the Rahu–Mercury bhukti for Kanya-pada Uttara Phalguni: Mercury as rasi lord brings an exceptional period of analytical and professional breakthrough.",
        focus: "Saturday Rahu shrine and deliberate re-alignment with genuine obligations rather than merely prestigious ones. This is the period for Uttara Phalguni to establish the professional and social foundation that will be built upon for the rest of life — invest in depth, not just breadth.",
      },
    },
    {
      planet: "Jupiter", theme: "Wisdom and Leadership",
      detail: {
        expect: "Jupiter dasa, in mid-life, is the great wisdom and leadership period for Uttara Phalguni. The social and professional foundations laid in Rahu dasa now support institutional authority and mentoring responsibilities. Career reaches peak leadership expression; community roles of genuine weight are assumed. Children are growing into adulthood; the grandparent generation is in its final years; Uttara Phalguni stands in the middle generation holding the family's practical continuity. The Jupiter–Venus bhukti (the table below gives when it begins and how long it lasts) brings particular relational and creative abundance.",
        navigate: "Jupiter's generosity can produce over-expansion of obligations in mid-career. Cardiovascular and liver health deserve sustained attention as this dasa advances. The Jupiter–Saturn bhukti (the table below gives when it begins and how long it lasts) demands careful pacing — reduce scope, not depth.",
        focus: "Thursday Brihaspati worship and sustained leadership in a domain where Uttara Phalguni's reliability and wisdom have the most genuine value. This is the period to crystallise the institutional contribution — a policy, programme, or leadership tradition — that will outlast this person's direct involvement.",
      },
    },
    {
      planet: "Saturn", theme: "Long Service, Deep Root",
      detail: {
        expect: "Saturn dasa, in the later years, brings the long, deep service of Uttara Phalguni's mature decades. Retirement from primary career may come mid-Saturn, but service does not stop — the form changes. Community elder roles, advisory positions, family patriarch/matriarch responsibilities, and spiritual deepening all fill the space. Grandchildren arrive and are nurtured. Property and financial matters are settled and simplified. The Kanya pada native particularly excels in Saturn dasa — the Saturn-Mercury affinity produces a period of unusual analytical clarity and practical wisdom.",
        navigate: "Saturn's primary health concerns in this dasa are musculoskeletal, cardiovascular, and respiratory. Chronic overwork accumulating from Rahu and Jupiter dasas must be addressed with deliberate rest. The Saturn–Rahu bhukti (the table below gives when it begins and how long it lasts) is the most physically demanding sub-period.",
        focus: "Saturday oil bath, Shani worship and Hanuman worship are essential. The Kanya pada Uttara Phalguni is particularly nourished by Saturn — Mercury's precision meeting Saturn's discipline produces the most refined analytical and service expression of the lifetime.",
      },
    },
    {
      planet: "Mercury", theme: "Rasi Lord for Kanya-born — The Great Refinement",
      detail: {
        expect: "Mercury dasa, in very advanced age, is the rasi lord's arrival for Kanya-pada Uttara Phalguni. Mercury is the lord of your rasi, Kanya — this makes his dasa doubly charged for Kanya-born Uttara Phalguni natives. Analytical precision, written legacy, communicative clarity, and service through intellect reach their lifetime peak. The accumulated wisdom of a lifetime in service — the pattern recognition that only long experience provides — now finds expression in teaching, writing, or systematic knowledge transmission. For Simha pada Uttara Phalguni, Mercury dasa at this age is a late-life gift of intellectual clarity.",
        navigate: "Physical care for the nervous system and respiratory function is primary at this age. Mercury's mental agility, maintained through active intellectual engagement, outlasts physical agility in old age. Isolation is Mercury's enemy — sustained social and intellectual engagement is both the remedy and the requirement.",
        focus: "Wednesday worship, green offerings, and active writing or teaching practice. Any significant written legacy — a memoir, a systematic account of professional experience, a guide for those who follow — belongs in Mercury dasa. Vishnu Sahasranama and Gayatri Mantra are Uttara Phalguni's most resonant Mercury recitations.",
      },
    },
    {
      planet: "Ketu", theme: "Dissolution into Service",
      detail: {
        expect: "Ketu dasa, the last in this sequence, is the completion of the cycle — the Uttara Phalguni who opened in the Sun's social confidence closes in Ketu's quiet interiority. The decades of service, contract-honouring, and social architecture settle into a deep inner stillness. Spiritual depth that has been present throughout the life but always secondary to practical service now becomes primary. Great-grandchildren and family members receive a quality of loving presence that is purely relational, unburdened by obligation or agenda.",
        navigate: "Complete physical care from loving caregivers. Ketu's natural withdrawal is appropriate at this age; ensure warmth, company, and spiritual companionship rather than forcing outward engagement.",
        focus: "Ganapati worship and Ketu shrine visits; pitru tharpanam and black sesame offerings complete the ancestral circle. Aryaman's child, who has honoured every social contract with consistency and integrity, completes the cycle in Ketu's quiet completion.",
      },
    },
  ],

  spirituality: [
    {
      title: "Aryaman & Solar Worship",
      desc: "Aryaman, the Aditya of contracts and friendship, is Uttara Phalguni's deity — Sunday Surya worship, Aditya Hridayam recitation, and offerings to the rising sun are the deepest devotional expressions.",
    },
    {
      title: "Vishnu & Duty Worship",
      desc: "Uttara Phalguni's service ethic finds its highest spiritual form in Vishnu worship — Thursday Vishnu puja, Vishnu Sahasranama recitation, and Ekadashi fasting honour the dharmic dimension of this nakshathiram's nature.",
    },
    {
      title: "Temples of Civic Faith",
      desc: "Temples associated with social service, community feeding, and the honouring of human bonds — Tirupati, Kanchipuram Varadaraja, and regional Vishnu shrines — carry special resonance for Uttara Phalguni.",
    },
  ],

  guidance: "The contract you honour with the greatest fidelity is the one with yourself — your own values, your own word, your own standard. When that is maintained with the same reliability you extend to every external obligation, Aryaman's full blessing flows. Service without self-neglect; duty without depletion. These are the equations your life is built to solve.",

  compatibleEn: ["Hastham", "Chithirai", "Rohini", "Revathi", "Anusham"],
  compatibleNote: "These nakshatras complement Uttara Phalguni's service ethic, social intelligence, and practical wisdom with creativity, warmth, and complementary depth.",

  ta: {
    atAGlanceLabels: ["சேவை & கடமை", "சமூக பிணைப்புகள்", "நடைமுறை ஞானம்", "தலைமை நேர்மை", "பகுப்பாய்வு சிறப்பு"],
    radarLabels: ["சேவை", "சமூக பிணைப்பு", "ஞானம்", "தலைமை", "பகுப்பாய்வு", "நம்பகத்தன்மை"],
    coreStrengths: [
      { label: "சேவை & கடமை",          desc: "அர்யமனின் பிள்ளை — உத்திர ஜாதகர் ஒப்பந்தங்களை நிறைவேற்றுகிறார், கடமைகளை மதிக்கிறார், அமைதியான, அசைக்கமுடியாத நம்பகத்தன்மையுடன் சேவை செய்கிறார்." },
      { label: "சமூக கட்டமைப்பு",       desc: "பிணைப்புகளை கட்டுபவர் — உத்திர ஜாதகர் நீடிக்கும்படி கட்டுவதால், நட்புகள், கூட்டணிகள், நிறுவனங்கள் நிலைக்கின்றன." },
      { label: "நடைமுறை ஞானம்",         desc: "தூய இலட்சியவாதியும் அல்ல, வெறும் நடைமுறைவாதியும் அல்ல — உத்திர ஜாதகர் கொள்கையையும் நடைமுறையையும் நீடித்த செயல்பாட்டில் ஒன்றிணைக்கிறார்." },
      { label: "தலைமை நேர்மை",          desc: "மற்றவர்கள் நம்பும் தலைவர் விசுவாசத்தை கோருவதால் அல்ல ஆனால் அவர்களின் நிலைத்தன்மை காலப்போக்கில் அதை பெற்றதால்." },
      { label: "பகுப்பாய்வு சிறப்பு",    desc: "புதனின் கன்னி தாக்கம் சூரியனின் சிம்ம வெளிப்பாடு மட்டுமே ஒருபோதும் உருவாக்காத துல்லிய நுண்ணறிவை உத்திரத்துக்கு கொடுக்கிறது." },
      { label: "நிலையான நம்பகத்தன்மை",  desc: "அர்யமன் ஒப்பந்தங்களை நிர்வகிக்கிறார் — உத்திர ஜாதகர் வருகிறார், வேலை செய்கிறார், தொடங்கியதை முடிக்கிறார்." },
    ],
    careerAbilityLabels: ["சமூக & குடிமை சேவை", "சட்டம், ஒப்பந்தங்கள் & கொள்கை", "நிர்வாகம் & மேலாண்மை", "சுகாதாரம் & சமூக வேலை", "கல்வி & ஆராய்ச்சி"],
    careerClusters: [
      { title: "குடிமை சேவை & நிர்வாகம்", desc: "அரசு, பொதுத்துறை, NGOகள் — சமூக கடமையின் அர்யமன் தளம் நேர்மையுடன் நிறைவேற்றப்படுகிறது." },
      { title: "சட்டம் & ஒப்பந்தங்கள்",   desc: "சட்டத் தொழில், கொள்கை வரைவு, மத்தியஸ்தம் — பிணைக்கும் ஒப்பந்தங்களுக்கான உத்திரத்தின் கொடை." },
      { title: "சுகாதாரம் & சமூக வேலை",   desc: "மருத்துவம், சமூக நலன், சமூக சுகாதாரம் — சேவை இயல்பான அழைப்பு." },
      { title: "கல்வி & கல்விதுறை",        desc: "கற்பித்தல், ஆராய்ச்சி, பாடத்திட்டம் — நடைமுறை ஞானம் முறையாக பரிமாற்றப்படுகிறது." },
      { title: "மேலாண்மை & தலைமை",        desc: "நிறுவன தலைமை, செயல்பாட்டு மேலாண்மை — அளவில் நம்பகமான செயல்பாடு." },
      { title: "நிதி & கணக்காய்வு",         desc: "கணக்காய்வு, நிதி மேலாண்மை, வள ஒதுக்கீடு — சூரியனின் அதிகாரத்தை சந்திக்கும் புதனின் துல்லியம்." },
    ],
    modernApps: [
      { title: "குடிமை தொழில்நுட்பம் & தளங்கள்", desc: "டிஜிட்டல் பொது சேவைகள், குடிமை தொழில்நுட்பம், மின்-ஆட்சி — நவீன உள்கட்டமைப்பில் அர்யமனின் நம்பகத்தன்மை." },
      { title: "சட்டத்தொழில்நுட்பம் & இணக்கம்",  desc: "ஒப்பந்த மேலாண்மை, ஒழுங்குமுறை தொழில்நுட்பம், சட்ட செயல்முறை தானியங்கல்." },
      { title: "சுகாதார தொழில்நுட்பம் & சமூக தாக்கம்", desc: "சுகாதார அமைப்புகள், சமூக நலன் தளங்கள், சமூக சுகாதார தொழில்நுட்பம்." },
      { title: "எட்டெக் & ஆராய்ச்சி தளங்கள்",    desc: "கல்வி தொழில்நுட்பம், கல்வியியல் ஆராய்ச்சி கருவிகள், அறிவு மேலாண்மை." },
      { title: "நிறுவன மேலாண்மை கருவிகள்",       desc: "செயல்பாட்டு மென்பொருள், திட்ட மேலாண்மை தளங்கள், நிறுவன திறன் கருவிகள்." },
      { title: "நிதி தொழில்நுட்பம் & கணக்காய்வு தொழில்நுட்பம்", desc: "நிதி மேலாண்மை தளங்கள், கணக்காய்வு தானியங்கல், இணக்க கருவிகள்." },
    ],
    dashaThemes: [
      "சூரிய ஒளியில் பிறப்பு — அர்யமன் ஒளி, சிம்ம ராசி ஆரம்பம்",
      "உணர்வு அடித்தளம் — சமூக நுண்ணறிவு, நட்பு, கடமையின் முதல் சோதனைகள்",
      "முதல் சோதனை — செவ்வாய் ஒழுக்கம், முதல் கடமைகள்",
      "உலகம் திறக்கிறது — ராகு விரிவாக்கம், தொழில், குடும்ப அமைவு",
      "ஞானம் மற்றும் தலைமை — குரு அதிகாரம், நிறுவன ஆழம்",
      "நீண்ட சேவை, ஆழமான வேர் — சனி முதிர்ந்த தசகங்கள்",
      "கன்னி ராசி அதிபதி — மாபெரும் செம்மைப்படுத்தல் — புதன் தசை",
      "சேவையில் கரைதல் — கேது வட்டம் முடிகிறது",
    ],
    dashaDetails: [
      {
        expect: "உத்திரம் சூரிய தசையில் தொடங்குகிறது — அர்யமனின் சூரிய அதிகாரத்தைச் சுமக்கும் நட்சத்திரத்துக்கு ஒளிர்ந்த, நோக்கம் நிறைந்த தொடக்கம். சூரியன் குறுகிய தொடக்க தசை; பிறக்கும்போது மீதமுள்ள இருப்பு முதல் பாதத்தில் நீளமாகவும் நான்காம் பாதத்தில் சிறிதாகவும் இருக்கும் — இந்த தசைக்குக் காட்டப்படும் வரம்பு அதைச் சொல்கிறது. மிக ஆரம்ப ஆண்டுகள் அடிக்கடி அரவணைப்பு, கட்டமைப்பு, தெளிவான மதிப்புகள் நிறைந்த குடும்பச் சூழலால் குறிக்கப்படுகின்றன. சிம்ம பாதக் குழந்தை சூரியனின் நம்பிக்கையை முதலிலிருந்தே உணர்கிறது; கன்னி பாதக் குழந்தை பள்ளி வயதுக்கு முன்பே புதனின் பகுத்தறியும் சிந்தனைத் தன்மையைக் காட்டுகிறது. இருவரும் பராமரிப்பாளர்கள் கவனிக்கும் அமைதியான தயார்நிலையுடன் குழந்தைப் பருவத்துக்கு வருகிறார்கள். முழு வாழ்வையும் வரையறுக்கப்போகும் கடமை, சேவை, சமூகப் பொறுப்பின் அடித்தளம் இந்த ஆரம்ப ஆண்டுகளின் குடும்ப இயக்கவியலில் இடப்படத் தொடங்குகிறது.",
        navigate: "சூரிய தசையின் தொடக்கச் சுருக்கம், குணம் முழுமையாக ஒருங்கிணைய நேரம் கிடைக்கும் முன்பே உத்திரம் சந்திர தசையின் உணர்வுச் சிக்கலுக்கு வருவதைக் குறிக்கிறது. சிம்ம பாதத்துக்கு, சூரியன் ராசி அதிபதி; இந்த சுருக்கமான முதல் தசை ராசி அதிபதியின் பெருக்கப்பட்ட நம்பிக்கை, தலைமைத் திறன், சூரிய பிரகாசத்தைக் கொண்டுள்ளது. அசாதாரணமான ஆரம்ப அங்கீகாரம் — மற்றவர்கள் இயல்பாக நோக்கும் குழந்தை, இயல்பான இளம் தலைவர் — ராசி அதிபதியின் அடையாளம். முன்னால் உள்ள ராகு தசையின் கலக்கத்தின் வழியாகவும் இந்தத் தன்மையைப் பாதுகாத்துக்கொள்ளுங்கள்.",
        focus: "ஞாயிற்றுக்கிழமை சூரிய வழிபாடு, சிவப்பு பூ அர்ப்பணம். சேவை, ஒப்பந்த மரியாதை, சமூகப் பொறுப்பு ஆகிய மதிப்புகளை ஆரம்பத்திலேயே ஊட்டுவது பெற்றோர் தரக்கூடிய மிகவும் உருவாக்கும் கொடை. சூரிய தசைக் குழந்தை குடும்பத்தின் நம்பகத்தன்மை, கடமை மதிப்புகளை உள்வாங்குகிறது; அவ்வாறு உள்வாங்கத் தகுதியான மதிப்புகளாக அவை இருப்பதை உறுதிசெய்யுங்கள்.",
      },
      {
        expect: "சந்திர தசை உத்திரத்தின் ஆரம்ப ஆண்டுகளின் சூரியத் தெளிவை உணர்வுக் களத்தில் படியவைக்கிறது; பள்ளிக் காலம் வழியாகக் குழந்தையை அழைத்துச் செல்கிறது — குறைந்த இருப்பில் பள்ளிக் காலத்தின் நடுப்பகுதி வரை, நீண்ட இருப்பில் அதன் முடிவு வரை. பள்ளி ஆண்டுகள் சமூக இயல்பும் படிப்பார்வமும் கொண்ட மாணவரை உருவாக்குகின்றன; நட்புகள் தீவிரமாக எடுத்துக்கொள்ளப்படுகின்றன, நீடிக்கின்றன. உத்திரத்தின் இயல்பின் மையமான சமூக நுண்ணறிவு — மக்களுக்கு என்ன தேவை என்று புரிந்துகொள்வது, ஒப்பந்தங்களை மதிப்பது, நம்பகமான நண்பராக இருப்பது — சந்திர தசையில் உணர்வுடன் வெளிப்படுகிறது. தசையின் முடிவை நோக்கி முதல் குறிப்பிடத்தக்க சமூகச் சோதனைகள் வருகின்றன: முறிந்த உறுதிமொழி, காட்டிக்கொடுக்கப்பட்ட நட்பு, அல்லது பிறரால் மீறப்பட்ட ஒப்பந்தத்தின் முதல் அனுபவம், அவற்றுக்கு உத்திரம் வளர்த்துக்கொள்ளும் உருவாக்கும் பதில்.",
        navigate: "உத்திரத்துக்கு சந்திர தசை சமூக ஏமாற்றத்துக்கு அதீத உணர்திறனை உருவாக்கலாம் — தனக்குத் தானே வைத்த தரத்துக்கும் பிறரிடம் அவ்வப்போது காணும் நம்பகமின்மைக்கும் இடையிலான இடைவெளி. உடல் கவலைகள்: செரிமானம், ஹார்மோன், சந்திர தசைக்கே உரிய குளிர் தொடர்பான பாதிப்புகள். சந்திர–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மிகவும் கலக்கமான துணைக் காலம்; சமூகச் சிக்கலோ குடும்பக் குலைவோ இளம் உத்திரத்தைச் சோதிக்கலாம்.",
        focus: "திங்கட்கிழமை சந்திர வழிபாடும் வெள்ளை பூ அர்ப்பணமும் உணர்வு நிலைப்பாட்டைத் தருகின்றன. சந்திர தசையில் மிக முக்கியமான பெற்றோர் முதலீடு, தனக்குத் தானே பேண வேண்டிய தரத்தையும் பிறருக்கு நீட்ட வேண்டிய நியாயமான மாறுபாட்டையும் உத்திரம் வேறுபடுத்த உதவுவது — பிறரின் நம்பகத்தன்மை பற்றிய முழுமைவாதம் தேவையற்ற துன்பத்தை உண்டாக்கும்.",
      },
      {
        expect: "செவ்வாய் தசை உத்திரத்தின் குணத்துக்கும் அர்ப்பணிப்புகளுக்கும் முதல் தீவிரச் சோதனைகளைக் கொண்டுவருகிறது; பாதத்தைப் பொறுத்து குழந்தைப் பருவத்தின் இறுதியிலோ வளரிளம் பருவத்தின் நடுப்பகுதியிலோ தொடங்கி, இளம் வயது வந்த காலம் நோக்கிச் செல்கிறது. மேல்நிலைக் கல்வி, நீண்ட இருப்பில் ஆரம்ப உயர் கல்வி; முதல் குறிப்பிடத்தக்க தொழில் அல்லது தொழில்முறைத் தேர்வுகள்; முதல் தீவிர உறவு அல்லது குடும்பக் கடமை — அனைத்தும் செவ்வாய் தசையில் அல்லது அதன் அருகில் வருகின்றன. உத்திரத்தின் இயல்பான நம்பகத்தன்மை அழுத்தத்தில் சோதிக்கப்படுகிறது: அழுத்தத்தின் கீழ் அர்ப்பணிப்புகளைப் பேண முடியுமா? செவ்வாய் தசையில் நிறுவப்படும் பதில் பல தசகங்களுக்கு குணத்தை வரையறுக்கிறது. செவ்வாயின் சோதனையை நேர்மையுடன் கடப்பவர்களுக்கு, அதன் பின் வரும் நற்பெயர் அதற்குப் பின் வரும் அனைத்தின் அடித்தளம்.",
        navigate: "இந்த கட்டத்தில் செவ்வாயின் ஆற்றல் பொறுமையின்மையையும் அதீத அர்ப்பணிப்பையும் உருவாக்கலாம் — நம்பகத்தன்மை முழுமையாக நிறுவப்படும் முன்பே நம்பகமானவராகக் காணப்பட விரும்பி, இன்னும் நிறைவேற்ற முடியாத கடமைகளை ஏற்கும் உத்திரம். உடல் கவலைகள்: விபத்துகள், அழற்சி நிலைகள், மிகை உழைப்பு. செவ்வாய்–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மிகவும் கலக்கமான துணைக் காலம்.",
        focus: "செவ்வாய்க்கிழமை செவ்வாய் சன்னதி வழிபாடும் சிவப்பு அர்ப்பணமும். செவ்வாயின் உந்துதலை பல கடமைகளில் அல்லாமல் ஒரு நன்கு தேர்ந்தெடுத்த அர்ப்பணிப்பில் செலுத்துங்கள் — ஒரே கடமையில் நம்பகத்தன்மையின் ஆழம், பல முயற்சிகளின் அகலத்தை விட உத்திரத்தின் நீண்டகால நற்பெயருக்கு மதிப்புமிக்கது.",
      },
      {
        expect: "ராகு தசை உத்திரத்தின் தொழிலுக்கும் சமூக உலகுக்கும் மாபெரும் விரிவாக்கம்; வளரிளம் பருவத்தின் இறுதியிலோ இளம் வயது வந்த காலத்திலோ தொடங்கி பணி வாழ்வின் கட்டுமான ஆண்டுகள் வழியாகச் செல்கிறது. உயர் கல்வி அல்லது தொழில்முறை நிறுவல்; தொழில் ஏற்றம்; இங்கு அமைந்தால் திருமணமும் குடும்ப அமைவும்; சொத்து வாங்குதல், சாத்தியமான நிதி முன்னேற்றம்; விரியும் தொழில்முறை வலைப்பின்னல்கள், நிறுவனப் பொறுப்புகள் — வயது வந்த நிலைபெறுதலின் முழு வளைவும் ராகுவின் நீண்ட காலம் வழியாகச் செல்கிறது. சாயாக் கிரகத்துக்குத் திருமணக் காரகத்துவம் இல்லை. ராகு தசைக்குள் திருமணம் அமைந்தால், அது ராகுவைக் கொண்டு அல்ல — ராகு நின்ற ராசியின் அதிபதி, ஜாதகத்தின் ஏழாம் வீடு, அதன் அதிபதி ஆகியவற்றைக் கொண்டு, சுக்கிரனையும் குருவையும் காரகர்களாகக் கொண்டு பார்க்கப்படுகிறது. அது ஒரு நிலையான காலம் அல்ல, ஒரு போக்கே. சமூகக் கட்டமைப்பு, நம்பகமான செயல்படுத்தலுக்கான உத்திரத்தின் கொடைகள் இங்கு தங்கள் முதல் பெரிய அளவு வெளிப்பாட்டைக் காண்கின்றன. ஒரு துறையில் அங்கீகாரம், நிறுவனத் தலைமை, அல்லது குறிப்பிடத்தக்க சமூகப் பங்களிப்பு பொதுவாக தசையின் இரண்டாம் பாதியில் வரும்.",
        navigate: "ராகுவின் விரிவாக்கம் உத்திரத்தை அவரது உண்மையான அர்ப்பணிப்புகளுக்கு அப்பால் இழுக்கலாம் — மதிப்புகளுடன் உண்மையான இணக்கத்தால் அல்ல, கௌரவம் அல்லது வெளிப்புற ஒப்புதலுக்காக சமூக, தொழில்முறைக் கடமைகளை ஏற்பது. ராகு–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மிகவும் கோரும் துணைக் காலம்; அதீத விரிவும் மதிப்பு மோதல்களும் உச்சமடைகின்றன. கன்னி பாத உத்திரத்துக்கு ராகு–புதன் புக்தியையும் கவனிக்கவும்: ராசி அதிபதி புதன் அசாதாரண பகுப்பாய்வு, தொழில்முறைத் திருப்புமுனைக் காலத்தைக் கொண்டுவருகிறார்.",
        focus: "சனிக்கிழமை ராகு சன்னதி வழிபாடும், கௌரவமான கடமைகளை மட்டுமல்ல, உண்மையான கடமைகளுடன் வேண்டுமென்று மறு-சீரமைப்பதும். வாழ்வின் மீதமுள்ள காலத்துக்கு கட்டப்படப்போகும் தொழில்முறை, சமூக அடித்தளத்தை நிறுவ உத்திரத்துக்கு இதுவே காலம் — அகலத்தில் மட்டுமல்ல, ஆழத்திலும் முதலீடு செய்யுங்கள்.",
      },
      {
        expect: "நடுவயதில் வரும் குரு தசை உத்திரத்துக்கு மாபெரும் ஞானத்தின், தலைமையின் காலம். ராகு தசையில் அமைக்கப்பட்ட சமூக, தொழில்முறை அடித்தளங்கள் இப்போது நிறுவன அதிகாரத்தையும் வழிகாட்டல் பொறுப்புகளையும் ஆதரிக்கின்றன. தொழில் உச்சத் தலைமை வெளிப்பாட்டை அடைகிறது; உண்மையான எடை கொண்ட சமூகப் பங்குகள் ஏற்கப்படுகின்றன. குழந்தைகள் வயது வந்தோராக வளர்கிறார்கள்; தாத்தா-பாட்டித் தலைமுறை தன் இறுதி ஆண்டுகளில் இருக்கிறது; குடும்பத்தின் நடைமுறைத் தொடர்ச்சியைத் தாங்கும் நடுத் தலைமுறையில் உத்திர ஜாதகர் நிற்கிறார். குரு–சுக்கிர புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) குறிப்பிட்ட உறவு, படைப்புச் செழிப்பைக் கொண்டுவருகிறது.",
        navigate: "குருவின் தாராளத்தன்மை நடுத் தொழில் வாழ்வில் கடமைகளின் அதீத விரிவாக்கத்தை உருவாக்கலாம். தசை முன்னேறும்போது இதய-இரத்தக் குழாய், கல்லீரல் ஆரோக்கியம் நிலையான கவனம் பெற வேண்டும். குரு–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) கவனமான வேகத்தைக் கோருகிறது — ஆழத்தை அல்ல, நோக்கத்தைக் குறையுங்கள்.",
        focus: "வியாழக்கிழமை பிருஹஸ்பதி வழிபாடு. உத்திரத்தின் நம்பகத்தன்மையும் ஞானமும் மிகவும் உண்மையான மதிப்பை கொண்ட தளத்தில் நீடித்த நிறுவன பங்களிப்பை படிகமாக்குங்கள்.",
      },
      {
        expect: "பிற்கால ஆண்டுகளில் வரும் சனி தசை உத்திரத்தின் முதிர்ந்த தசகங்களின் நீண்ட, ஆழமான சேவையைக் கொண்டுவருகிறது. முதன்மைத் தொழிலிலிருந்து ஓய்வு சனி தசையின் நடுவில் வரலாம், ஆனால் சேவை நிற்காது — வடிவம் மாறுகிறது. சமூக மூத்தோர் பங்குகள், ஆலோசனைப் பதவிகள், குடும்பத் தலைவர்/தலைவியின் பொறுப்புகள், ஆன்மீக ஆழமாதல் ஆகிய அனைத்தும் இடத்தை நிரப்புகின்றன. பேரக்குழந்தைகள் வருகிறார்கள், போஷிக்கப்படுகிறார்கள். சொத்து, நிதி விஷயங்கள் தீர்க்கப்பட்டு எளிமைப்படுத்தப்படுகின்றன. கன்னி பாத ஜாதகர் சனி தசையில் குறிப்பாகச் சிறக்கிறார் — சனி-புதன் இணக்கம் அசாதாரண பகுப்பாய்வுத் தெளிவையும் நடைமுறை ஞானத்தையும் தரும் காலத்தை உருவாக்குகிறது.",
        navigate: "இந்த தசையில் சனியின் முதன்மை ஆரோக்கிய கவலைகள் எலும்பு–மூட்டு–தசைநார் அமைப்பு, இதய-இரத்தக் குழாய், சுவாசம். ராகு, குரு தசைகளிலிருந்து திரண்ட நாள்பட்ட அதிக வேலையை வேண்டுமென்ற ஓய்வால் கவனிக்க வேண்டும். சனி–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மிகவும் உடல் ரீதியாகக் கோரும் துணைக் காலம்.",
        focus: "சனிக்கிழமை எண்ணெய் குளியல், சனி வழிபாடு, ஆஞ்சநேயர் வழிபாடு. கன்னி பாத உத்திர ஜாதகர் சனி தசையில் குறிப்பாக வளர்க்கப்படுகிறார் — புதனின் துல்லியம் சனியின் ஒழுக்கத்தை சந்திக்கிறது.",
      },
      {
        expect: "மிக முதிர்ந்த வயதில் வரும் புதன் தசை கன்னி-பாத உத்திரத்துக்கு ராசி அதிபதியின் வருகை. புதன் உங்கள் ராசியான கன்னியின் அதிபதி — இது கன்னியில் பிறந்த உத்திர ஜாதகர்களுக்கு இரட்டை வலிமையுடன் வருகிறது. பகுப்பாய்வுத் துல்லியம், எழுத்து மரபு, தொடர்புத் தெளிவு, நுண்ணறிவு வழியான சேவை வாழ்நாள் உச்சத்தை அடைகின்றன. ஒரு வாழ்நாள் சேவையில் திரண்ட ஞானம் — நீண்ட அனுபவம் மட்டுமே தரும் வடிவம் அறியும் திறன் — இப்போது கற்பித்தல், எழுத்து, அல்லது முறையான அறிவுக் கடத்தலில் வெளிப்பாட்டைக் காண்கிறது. சிம்ம பாத உத்திரத்துக்கு இந்த வயதில் புதன் தசை பிற்கால வாழ்வின் அறிவுத் தெளிவின் கொடை.",
        navigate: "இந்த வயதில் நரம்பு மண்டலத்துக்கும் சுவாச செயல்பாட்டுக்குமான உடல் பராமரிப்பு முதன்மை. செயலில் அறிவார்ந்த ஈடுபாட்டால் பேணப்படும் புதனின் மனச் சுறுசுறுப்பு, முதுமையில் உடல் சுறுசுறுப்பை விட நீடிக்கிறது. தனிமை புதனின் எதிரி — நீடித்த சமூக, அறிவார்ந்த ஈடுபாடே நிவாரணமும் தேவையும்.",
        focus: "புதன்கிழமை வழிபாடு, பசுமை அர்ப்பணம், செயலில் எழுத்து அல்லது கற்பித்தல் பயிற்சி. எந்த முக்கிய எழுத்து மரபும் — ஒரு நினைவுக் குறிப்பு, தொழில் அனுபவத்தின் முறையான கணக்கு, பின்தொடர்பவர்களுக்கான வழிகாட்டி — புதன் தசைக்கு உரியது. விஷ்ணு சஹஸ்ரநாமமும் காயத்ரி மந்திரமும் உத்திரத்தின் மிக ஒத்திசையும் புதன் பாராயணங்கள்.",
      },
      {
        expect: "இந்த வரிசையின் கடைசி தசையான கேது தசை சுழற்சியின் நிறைவு — சூரியனின் சமூக நம்பிக்கையில் தொடங்கிய உத்திரம் கேதுவின் அமைதியான உள்ளுணர்வில் முடிகிறது. சேவை, ஒப்பந்த மரியாதை, சமூகக் கட்டமைப்பின் தசகங்கள் ஆழ்ந்த உள் அமைதியில் நிலைபெறுகின்றன. வாழ்வு முழுவதும் இருந்தும் எப்போதும் நடைமுறைச் சேவைக்கு இரண்டாம் பட்சமாக இருந்த ஆன்மீக ஆழம் இப்போது முதன்மையாகிறது. கொள்ளுப் பேரக்குழந்தைகளும் குடும்பத்தினரும் கடமை அல்லது எதிர்பார்ப்பின் சுமையற்ற, தூய உறவு இருப்புத் தரத்தைப் பெறுகிறார்கள்.",
        navigate: "அன்பான பராமரிப்பாளர்களிடமிருந்து முழுமையான உடல் பராமரிப்பு. கேதுவின் இயல்பான விலகல் இந்த வயதில் பொருத்தமானது; வெளிப்புற ஈடுபாட்டைக் கட்டாயப்படுத்தாமல் அரவணைப்பு, துணை, ஆன்மீகத் துணையை உறுதிசெய்யுங்கள்.",
        focus: "விநாயகர் வழிபாடு, கேது சன்னதி வழிபாடு; பித்ரு தர்ப்பணமும் கருப்பு எள் அர்ப்பணமும் முன்னோர் வட்டத்தை நிறைவு செய்கின்றன. ஒவ்வொரு சமூக ஒப்பந்தத்தையும் நிலைத்தன்மையுடனும் நேர்மையுடனும் மதித்த அர்யமனின் பிள்ளை, கேதுவின் அமைதியான நிறைவில் சுழற்சியை முடிக்கிறார்.",
      },
    ],
    spirituality: [
      { title: "அர்யமன் & சூரிய வழிபாடு",  desc: "ஒப்பந்தங்கள் மற்றும் நட்பின் ஆதித்யனான அர்யமன் உத்திரத்தின் தெய்வம் — ஞாயிற்றுக்கிழமை சூரிய வழிபாடு, ஆதித்ய ஹ்ருதயம் பாராயணம், உதய சூரியனுக்கு அர்ப்பணங்கள் ஆழமான பக்தி வெளிப்பாடுகள்." },
      { title: "விஷ்ணு & கடமை வழிபாடு",    desc: "உத்திரத்தின் சேவை நெறிமுறை விஷ்ணு வழிபாட்டில் உயர்ந்த ஆன்மீக வடிவம் காண்கிறது — வியாழக்கிழமை விஷ்ணு பூஜை, விஷ்ணு சஹஸ்ரநாம பாராயணம், ஏகாதசி விரதம் இந்த நட்சத்திரத்தின் தர்மப் பரிமாணத்தை போற்றுகிறது." },
      { title: "குடிமை நம்பிக்கை கோவில்கள்", desc: "சமூக சேவை, சமூக ஊட்டல், மனித பிணைப்புகளை மதிப்பதுடன் தொடர்புடைய கோவில்கள் — திருப்பதி, காஞ்சிபுரம் வரதராஜர் — உத்திரத்துக்குச் சிறப்புத் தொடர்பு கொண்டுள்ளன." },
    ],
    guidance: "நீங்கள் மிகவும் நம்பகத்தன்மையுடன் மதிக்கும் ஒப்பந்தம் உங்களுடனேயே உள்ளது — உங்கள் சொந்த மதிப்புகள், உங்கள் சொந்த வார்த்தை, உங்கள் சொந்த தரம். சுய-அலட்சியமின்றி சேவை; குறைவின்றி கடமை. இவை உங்கள் வாழ்க்கை தீர்க்க கட்டப்பட்ட சமன்பாடுகள்.",
    careerNote: "சேவை, சமூக கட்டமைப்பு, நம்பகமான செயல்பாடு சந்திக்கும் இடங்களில் உத்திர ஜாதகர் சிறப்பாக செயல்படுகிறார்.",
    modernLead: "உத்திரத்தின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "சேவை, சமூக பிணைப்புகள், நடைமுறை ஞானம் உத்திரத்தின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function UttaraPhalguniVisualPage() {
  return <NatchathiramVisualContent data={UTTARA_PHALGUNI} visual={UTTARA_PHALGUNI_VISUAL} timings={dasaTimingsFor(UTTARA_PHALGUNI.number)} />;
}
