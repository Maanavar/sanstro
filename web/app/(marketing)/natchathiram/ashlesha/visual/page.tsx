import type { Metadata } from "next";
import { withTamilTwin } from "@/lib/localized-metadata";
import { withDasaTimingHold } from "@/lib/natchathiram-dasa-hold";
import { dasaTimingsFor } from "@/lib/natchathiram-dasa-timings";
import { nakshatraDisplayName } from "@/lib/nakshatra-display-name";
import { natchathiramVisualTa } from "@/lib/marketing-seo-ta";
import { ASHLESHA } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

const EN_METADATA: Metadata = {
  title: `${nakshatraDisplayName(ASHLESHA.number, "en")} — Visual Profile`,
  description: "Visual profile of Ayilyam Nakshathiram: personality traits, career strengths, dasa timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/ashlesha/visual" },
  openGraph: {
    title: `${nakshatraDisplayName(ASHLESHA.number, "en")} — Visual Profile`,
    description: "Visual profile of Ayilyam Nakshathiram: personality traits, career strengths, dasa timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/ashlesha/visual",
    type: "article",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withDasaTimingHold(await withTamilTwin(EN_METADATA, "/natchathiram/ashlesha/visual", natchathiramVisualTa("ashlesha")!), "ashlesha");
}

const ASHLESHA_VISUAL: NatchathiramVisualData = {
  atAGlance: [
    { label: "Penetrating Intelligence", score: 97 },
    { label: "Transformative Power",     score: 94 },
    { label: "Healing Depth",            score: 91 },
    { label: "Psychological Acuity",     score: 95 },
    { label: "Mystical Perception",      score: 93 },
  ],

  radar: {
    labels: ["Intelligence", "Perception", "Healing", "Transformation", "Mysticism", "Endurance"],
    values: [97, 95, 91, 94, 93, 88],
  },

  coreStrengths: [
    { symbol: "◎", label: "Penetrating Intelligence",  score: 97, desc: "The serpent's coil holds all accumulated wisdom — Ashlesha perceives the hidden truth beneath every surface with a precision that defies ordinary understanding." },
    { symbol: "◈", label: "Psychological Acuity",       score: 95, desc: "Mercury's analytical gift fused with the Naga's depth — Ashlesha reads people, motives, and undercurrents before a word is spoken." },
    { symbol: "⚡", label: "Transformative Power",      score: 94, desc: "The coiled serpent holds latent kundalini — Ashlesha carries the capacity for complete personal transformation and the power to catalyse it in others." },
    { symbol: "♥", label: "Mystical Perception",        score: 93, desc: "Born under the Naga deities — Ashlesha's connection to the unseen world, ancestral memory, and karmic current is direct and unmediated." },
    { symbol: "△", label: "Healing Depth",              score: 91, desc: "The serpent both carries venom and the antidote — Ashlesha's healing works at the root, not the symptom, transforming what others only suppress." },
    { symbol: "☽", label: "Tenacious Endurance",        score: 88, desc: "The serpent waits with perfect patience — Ashlesha endures, observes, and holds until the moment is exactly right to act." },
  ],

  careerAbilities: [
    { label: "Research & Investigation",    score: 97 },
    { label: "Psychology & Therapy",        score: 95 },
    { label: "Technology & Data Science",   score: 92 },
    { label: "Healing & Medicine",          score: 91 },
    { label: "Spiritual & Occult Sciences", score: 93 },
  ],
  careerNote: "Ashlesha excels wherever hidden truth must be found, transformed, or healed — the investigator, the psychologist, the data scientist, the healer, and the spiritual guide all embody Ashlesha's essential nature.",

  careerClusters: [
    { symbol: "◎", title: "Research & Investigation",  desc: "Forensics, intelligence analysis, academic research, investigative journalism — the coiled serpent always finds what is hidden." },
    { symbol: "◈", title: "Psychology & Counselling",  desc: "Therapists, psychiatrists, trauma counsellors, behavioural analysts — Ashlesha sees beneath the surface to the wound that needs healing." },
    { symbol: "⚡", title: "Technology & Cybersecurity", desc: "Data science, cybersecurity, AI ethics, software engineering — Mercury's analytical precision meets the serpent's unerring instinct." },
    { symbol: "♥", title: "Healing & Alternative Medicine", desc: "Ayurveda, toxicology, herbalism, energy healing, kundalini yoga — the serpent carries both the poison and the remedy." },
    { symbol: "△", title: "Spiritual & Occult Sciences", desc: "Astrology, tantra, mystical traditions, shamanic healing — Ashlesha's access to the unseen world is constitutional." },
    { symbol: "☽", title: "Law & Compliance",          desc: "Legal investigation, audit, fraud detection, regulatory compliance — the penetrating intelligence finds what others miss." },
  ],

  modernApps: [
    { symbol: "◎", title: "Cybersecurity & Forensics",   desc: "Threat intelligence, digital forensics, ethical hacking — the serpent's coil penetrates every defence." },
    { symbol: "◈", title: "Mental Health Technology",     desc: "Therapy apps, trauma-informed platforms, AI-driven mental wellness — healing at depth, at scale." },
    { symbol: "⚡", title: "Data Science & AI Ethics",    desc: "Pattern recognition, behavioural AI, ethical oversight — Ashlesha's perception translated into algorithmic precision." },
    { symbol: "♥", title: "Integrative Medicine Platforms", desc: "Holistic health apps, Ayurvedic AI, energy medicine — the ancient healing wisdom in modern infrastructure." },
    { symbol: "△", title: "Investigative Journalism Tech", desc: "Data journalism, OSINT platforms, whistleblower systems — truth-finding at digital scale." },
    { symbol: "☽", title: "Spiritual & Wellness Tech",    desc: "Kundalini platforms, occult learning apps, ancestral healing technology — the mystical made accessible." },
  ],

  dashaTimeline: [
    {
      planet: "Mercury", theme: "The Serpent's First Coil",
      detail: {
        expect: "Ashlesha opens life in Mercury dasa — a fitting beginning for a nakshathiram whose ruler is the planet of intelligence and communication. Mercury's is a long dasa, and the balance left at birth runs from long for births in the first pada to short for the fourth; the range shown for this dasa gives it. Childhood is marked by unusual perceptiveness: the child who notices what adults think they have hidden, who asks questions that cut to the heart of a matter, who seems older than their years. There is often a striking verbal or analytical precocity — the child who reads early, who constructs arguments, who remembers conversations verbatim. The Naga's penetrating sight is present from the first breath. Where the balance runs through the school years, this develops into a formidable intellectual range. Ashlesha in Mercury dasa tends to be drawn toward multiple subjects simultaneously — languages, science, and the arts each claim their share of this insatiable curiosity. The tendency to keep observations private — to know what others don't know they are known — establishes early.",
        navigate: "Mercury dasa's challenge for young Ashlesha is managing the gap between what they perceive and what they are permitted to say. The child who sees through people is not always welcomed; where the dasa reaches adolescence, the one who knows too much can become isolated. The Mercury–Rahu bhukti (the table below gives when it begins and how long it lasts; for the shorter balances it falls before birth) is the most intense sub-period — sudden revelations, boundary-testing, or a significant intellectual turning point may arrive. Physical concerns in Mercury dasa: nervous system, respiratory tract, digestive sensitivity. Anxiety can surface when the active Mercury mind has no outlet.",
        focus: "Wednesday Mercury worship, green offerings, and outlets for the insatiable curiosity — books, puzzles, structured debates, writing. The most important parental support is validating the child's perceptions while teaching discernment about when and to whom they are shared. Ashlesha's gift for reading people is a double-edged serpent's tongue: powerful when disciplined, isolating when untamed.",
      },
    },
    {
      planet: "Ketu", theme: "Shedding the First Skin",
      detail: {
        expect: "Ketu dasa marks Ashlesha's first great transformation — the serpent's first deliberate skin-shedding. It falls in very different years by pada: in childhood and early adolescence for the later padas, and in late adolescence or early adulthood for the first. Wherever it falls, it typically brings a withdrawal from the conventional path, an intensified spiritual inquiry, or a sudden disruption that forces internal reassessment. The Naga's ancestral karma speaks loudly in Ketu dasa: dreams become vivid, the pull toward occult or spiritual study becomes undeniable, and the question of what one truly desires — beneath all conditioning — cannot be avoided. Some Ashlesha natives experience a dramatic life change in this period: a rejection of a chosen path, a spiritual encounter, or a karmic relationship that catalyses fundamental transformation.",
        navigate: "Ketu's detachment from the outer world can create a period of apparent aimlessness that is actually necessary inner restructuring. Those around Ashlesha may find this period alarming — the person who was so clearly on a track appears to have lost their direction. Do not force conventional milestones onto Ketu dasa. Physical concerns: autoimmune vulnerabilities, mysterious symptoms that resist ordinary diagnosis (fitting for the serpent's medicine), and the nervous system conditions Mercury left sensitive. The Ketu–Mercury bhukti, which closes this dasa (the table below gives when it begins and how long it lasts), brings a return of Mercury's analytical drive with deeper Ketu wisdom — the first sign of integration.",
        focus: "Ganapati worship, Ketu shrine prayers, pitru tharpanam, black sesame offerings. The serpent worship that is Ashlesha's birthright finds its deepest expression in Ketu dasa — Naga Panchami observances, temple visits to Nagercoil or Thirunageswaram, and the naga sadhana tradition offer the most grounding spiritual practice for this period.",
      },
    },
    {
      planet: "Venus", theme: "The Serpent Unfolds",
      detail: {
        expect: "Venus is the long adult-life dasa for Ashlesha — for the later padas it begins in childhood or adolescence, for the first pada in early adulthood — and it brings the most outwardly productive and relationally rich stretch of the life. Career establishes and deepens; the intellectual gifts of Mercury dasa and the spiritual foundations of Ketu dasa now find their professional and creative expression. Psychology, research, technology, healing, or the investigative arts attract; the chosen field often integrates Ashlesha's capacity for depth with the social and creative gifts Venus brings. Where marriage falls within this dasa, it is read from the seventh house and its lord, with Venus and Jupiter as the natural significators, and judged from the individual horoscope as a tendency rather than a fixed time. The Naga's intensity in relationship finds a container — though the choosing of a partner requires care, as Ashlesha's deep possessiveness and high standards can make early relationships turbulent. The Venus–Jupiter bhukti (the table below gives when) is a peak of creative and relational abundance.",
        navigate: "Venus dasa's primary challenge for Ashlesha is maintaining the depth that is natural while engaging the social dimension that Venus requires. The serpent in open meadow is not the serpent in the forest — Ashlesha must find ways to bring their penetrating nature into relationships without the dynamic becoming one of perpetual testing or hidden watching. Physical concerns: kidneys, skin, and the hormonal system. The Venus–Saturn bhukti (the table below gives when it begins and how long it lasts) demands a reduction in pace and a willingness to let some complexity resolve without forcing it.",
        focus: "Friday Lakshmi worship, white and rose offerings, and the practice of genuinely allowing intimacy — being known as well as knowing. Also watch the Venus–Moon bhukti within this dasa (the bhukti table below gives when it begins and how long it lasts). Moon governs the rasi, Kadagam — this window brings amplified emotional depth, family milestones, and the deepest relational encounter of the first half of life. Give it full, present attention.",
      },
    },
    {
      planet: "Sun", theme: "The Serpent Illuminated",
      detail: {
        expect: "Sun dasa, in mid-life, brings a clarifying solar quality to the deep, often hidden work Ashlesha has been doing across Venus dasa. Professional recognition arrives — the researcher whose work is finally noticed, the healer whose reputation spreads, the investigator whose findings are acknowledged. Ashlesha's instinct has been to work in shadow; Sun dasa pulls this into light, not always comfortably but necessarily. Authority, clarity of direction, and institutional standing all increase. The relationship with masculine authority figures — father, employer, the state — resolves or clarifies.",
        navigate: "Sun's directness is not Ashlesha's natural medium; the discomfort of sustained visibility can generate withdrawal impulses that must be consciously managed. The Sun–Saturn bhukti (the table below gives when it begins and how long it lasts) brings the sharpest challenge: public expectations versus private nature. Physical care focuses on heart, eyes, and circulatory health.",
        focus: "Sunday Surya worship, Aditya Hridayam recitation, and the deliberate acceptance of the recognition that Sun dasa delivers. Ashlesha has earned this visibility through years of deep, precise work; the serpent that finally allows itself to be seen in full light completes something essential.",
      },
    },
    {
      planet: "Moon", theme: "Rasi Lord — The Tidal Deep",
      detail: {
        expect: "Moon dasa, in the later working years, is the rasi lord's arrival for Ashlesha. Moon governs Kadagam, Ashlesha's rasi — making this dasa doubly significant. The emotional intelligence that has always been present but often subordinated to the analytical mind now rises fully. The capacity for genuine nurturing, for holding space, for receiving and giving care at depth — these Cancerian qualities, which Ashlesha sometimes distrust as weakness, emerge as Ashlesha's most profound social gift in Moon dasa. Family relationships deepen; the role of elder, healer, and keeper of memory comes into its fullness. For those in healing or spiritual practice, Moon dasa produces the most profound client work of the lifetime.",
        navigate: "Moon dasa's health concerns at this stage of life are fluid balance, memory, and emotional regulation. The depth of feeling that Moon amplifies can be overwhelming for a nature accustomed to the analytical distance of Mercury; the serpent must learn to live in the water, not merely watch it. The Moon–Saturn bhukti (the table below gives when it begins and how long it lasts) is the most demanding sub-period; reduce obligation and protect rest.",
        focus: "Monday Moon worship, water offerings, white flowers, and the deliberate cultivation of receptivity. Ashlesha in Moon dasa completes the integration that Ketu began: the serpent's depth and the moon's emotional intelligence merge into a wisdom that heals simply by being present.",
      },
    },
    {
      planet: "Mars", theme: "The Serpent's Final Strike",
      detail: {
        expect: "Mars dasa, in the later years, brings a sharpness and directness to Ashlesha's late wisdom that surprises those who have grown accustomed to the serpent's characteristic indirection. The Naga, when it strikes, strikes true — and in Mars dasa, Ashlesha speaks directly, acts with conviction, and has no patience for the evasions and surface-living that once provoked only quiet internal observation. This is the period of Ashlesha's most direct moral and intellectual interventions: the paper that names what others hedge around, the family conversation that finally states what has been circling for years, the healing work that cuts to the root.",
        navigate: "Physical care at this age is primary. Mars energy manifests as mental precision and willful clarity rather than physical exertion — do not mistake the clarity of thought for a physical vigour that may not be present. The Mars–Rahu bhukti (the table below gives when it begins and how long it lasts) can bring a period of intensity and friction; navigate with the patient wisdom of Moon dasa.",
        focus: "Tuesday Mars shrine prayers, red flower offerings, and the willingness to speak what has been perceived clearly and held long. The strike is not aggression — it is completion, the final uncoiling of a serpent that has held its knowledge with perfect patience.",
      },
    },
    {
      planet: "Rahu", theme: "Into the Mystery",
      detail: {
        expect: "Rahu dasa, running well into later life, brings the Naga's final and most complete expression. Rahu, the shadow planet of illusion and transgression, is entirely at home with Ashlesha's serpent energy — where other nakshathirams find Rahu disorienting, Ashlesha in Rahu dasa often experiences a strange homecoming, a sense that the hidden, the liminal, and the mysterious have finally been given full permission. Spiritual practice reaches its most unorthodox and direct expression; ancestral healing work, the resolution of the Naga karma that has threaded through the entire life, and the transmission of deep wisdom to those ready to receive it all characterise this extended final active period.",
        navigate: "Rahu's span is long; the physical and cognitive challenges of this stage of life require careful management. The Rahu–Jupiter bhukti (the table below gives when it begins and how long it lasts) brings an interval of genuine grace and wisdom-transmission that is among the most meaningful periods of the entire life.",
        focus: "Rahu shrine prayers, coconut offerings, and the complete embrace of Ashlesha's most essential nature: the serpent that holds the knowledge of the deep, transmits it without fear, and finally rests in the mystery from which it came.",
      },
    },
    {
      planet: "Jupiter", theme: "The Elder's Grace",
      detail: {
        expect: "Jupiter dasa, in very advanced age, is reached by very few. For those Ashlesha souls who arrive here — carrying eight dasas of deep perception, transformation, and healing — Jupiter brings a benediction: the guru's wisdom that was always latent in the Naga's knowledge finds its most complete and expansive expression. The serpent, which carries both the venom and the antidote, rests in the full knowledge that the antidote always wins.",
        navigate: "Complete physical care and the acceptance of dependency as grace rather than defeat. Jupiter's expansion at this age is primarily of consciousness — the capacity to hold paradox, to forgive completely, to know that the hidden and the apparent are finally one.",
        focus: "Thursday Jupiter worship and the simple presence of one whose entire life has been a serpent's pilgrimage into truth. The transmission happens through being, not speaking.",
      },
    },
  ],

  spirituality: [
    {
      title: "Naga Devata Worship",
      desc: "The Naga deities — Nagarja, Naga Kanni, Adishesha, Vasuki — are Ashlesha's presiding powers. Naga Panchami fasting and worship, Nagercoil temple visits, and serpent shrine offerings are the most direct spiritual practices.",
    },
    {
      title: "Kundalini & Tantric Sadhana",
      desc: "Ashlesha carries an innate affinity for the awakening of kundalini energy. Yoga, pranayama, meditation, and disciplined tantric practice are constitutional — not add-ons but expressions of what Ashlesha already is.",
    },
    {
      title: "Ancestral Karma & Naga Dosha Resolution",
      desc: "Serpent karma threading through the lineage — naga dosha, ancestral vows, the consequences of harm to serpents in prior generations — is Ashlesha's karmic inheritance to resolve. Sarpa Samskara, pitru tharpanam, and dedicated naga puja are the primary remedies.",
    },
  ],

  guidance: "The serpent does not strike without reason, does not move without purpose, does not show itself without necessity. Your penetrating intelligence is not a weapon — it is a gift for healing what is hidden. Use it to find what needs to be found, transform what needs to be transformed, and heal what has been waiting in the dark. The venom and the antidote are one. You carry both.",

  compatibleEn: ["Punarpoosam", "Poosam", "Kettai", "Revathi", "Mirugaseeridam"],
  compatibleNote: "These nakshatras complement Ashlesha's penetrating intelligence and transformative depth with warmth, expansion, and grounding that balance the serpent's intensity.",

  ta: {
    atAGlanceLabels: ["துளைக்கும் நுண்ணறிவு", "மாற்றும் சக்தி", "குணப்படுத்தும் ஆழம்", "உளவியல் கூர்மை", "மர்ம உணர்தல்"],
    radarLabels: ["நுண்ணறிவு", "உணர்தல்", "குணப்படுத்தல்", "மாற்றம்", "மர்மம்", "சகிப்புத்தன்மை"],
    coreStrengths: [
      { label: "துளைக்கும் நுண்ணறிவு",   desc: "நாகத்தின் சுருள் அனைத்து ஞானத்தையும் கொண்டுள்ளது — ஆயில்ய ஜாதகர் ஒவ்வொரு மேற்பரப்பிற்கும் கீழே மறைந்திருக்கும் உண்மையை சாதாரண புரிதலுக்கு அப்பால் துல்லியமாக உணர்கிறார்." },
      { label: "உளவியல் கூர்மை",          desc: "புதனின் பகுப்பாய்வு கொடை நாகத்தின் ஆழத்துடன் இணைந்தது — ஒரு வார்த்தை பேசப்படுவதற்கு முன்பே ஆயில்ய ஜாதகர் மக்களையும் நோக்கங்களையும் படிக்கிறார்." },
      { label: "மாற்றும் சக்தி",           desc: "சுருண்ட நாகம் குண்டலினியை கொண்டுள்ளது — ஆயில்யம் முழுமையான தனிப்பட்ட மாற்றத்திற்கும் மற்றவர்களில் அதை ஊக்கமளிக்கும் சக்திக்கும் திறனை கொண்டுள்ளார்." },
      { label: "மர்ம உணர்தல்",             desc: "நாக தேவதைகளின் கீழ் பிறந்தவர் — தெரியாத உலகம், முன்னோர் நினைவு, கர்ம ஓட்டம் ஆகியவற்றுடன் ஆயில்யத்தின் தொடர்பு நேரடியானது." },
      { label: "குணப்படுத்தும் ஆழம்",      desc: "நாகம் நஞ்சையும் மருந்தையும் கொண்டுள்ளது — ஆயில்யத்தின் குணப்படுத்தல் வேரில் செயல்படுகிறது, அறிகுறியில் அல்ல." },
      { label: "உறுதியான சகிப்புத்தன்மை",  desc: "நாகம் சரியான நேரம் வரும் வரை பொறுமையாக காத்திருக்கிறது — ஆயில்ய ஜாதகர் சகிக்கிறார், கவனிக்கிறார், செயல்படுவதற்கான சரியான தருணம் வரும் வரை நிறுத்துகிறார்." },
    ],
    careerAbilityLabels: ["ஆராய்ச்சி & விசாரணை", "உளவியல் & சிகிச்சை", "தொழில்நுட்பம் & தரவு அறிவியல்", "குணப்படுத்தல் & மருத்துவம்", "ஆன்மீக & மறை அறிவியல்"],
    careerClusters: [
      { title: "ஆராய்ச்சி & விசாரணை",   desc: "மறைவாக இருப்பதை கண்டுபிடிக்க — தடயவியல், புலனாய்வு பகுப்பாய்வு, விசாரண பத்திரிகை." },
      { title: "உளவியல் & ஆலோசனை",       desc: "சிகிச்சையாளர்கள், மனநல மருத்துவர்கள், நடத்தை பகுப்பாய்வாளர்கள் — மேற்பரப்பிற்கு கீழே காயத்தை பார்க்கிறார்கள்." },
      { title: "தொழில்நுட்பம் & சைபர் பாதுகாப்பு", desc: "தரவு அறிவியல், சைபர் பாதுகாப்பு, AI — புதனின் துல்லியம் நாகத்தின் உள்ளுணர்வுடன் இணைகிறது." },
      { title: "குணப்படுத்தல் & மாற்று மருத்துவம்", desc: "ஆயுர்வேதம், மூலிகை மருத்துவம், ஆற்றல் குணப்படுத்தல் — நாகம் நஞ்சையும் மருந்தையும் கொண்டுள்ளது." },
      { title: "ஆன்மீக & மறை அறிவியல்",  desc: "ஜோதிடம், தந்திரம், மர்ம மரபுகள் — தெரியாத உலகத்திற்கான ஆயில்யத்தின் அணுகல் இயல்பானது." },
      { title: "சட்டம் & இணக்கம்",        desc: "சட்ட விசாரணை, தணிக்கை, மோசடி கண்டறிதல் — துளைக்கும் நுண்ணறிவு மற்றவர்கள் தவறவிடுவதை கண்டறிகிறது." },
    ],
    modernApps: [
      { title: "சைபர் பாதுகாப்பு & தடயவியல்", desc: "அச்சுறுத்தல் நுண்ணறிவு, டிஜிட்டல் தடயவியல் — நாகத்தின் சுருள் ஒவ்வொரு பாதுகாப்பையும் துளைக்கிறது." },
      { title: "மனநல தொழில்நுட்பம்",         desc: "சிகிச்சை ஆப்கள், ஆழமான குணப்படுத்தல் தளங்கள் — ஆழத்தில் குணப்படுத்துதல்." },
      { title: "தரவு அறிவியல் & AI நெறிமுறை",  desc: "வடிவ அங்கீகாரம், நடத்தை AI, நெறிமுறை மேற்பார்வை — ஆயில்யத்தின் உணர்தல் வழிமுறை துல்லியமாக மாறுகிறது." },
      { title: "ஒருங்கிணைந்த மருத்துவ தளங்கள்", desc: "ஒட்டுமொத்த சுகாதார ஆப்கள், ஆயுர்வேத AI — நவீன கட்டமைப்பில் பண்டைய குணப்படுத்தல் ஞானம்." },
      { title: "விசாரண பத்திரிகை தொழில்நுட்பம்", desc: "தரவு பத்திரிகை, OSINT தளங்கள் — டிஜிட்டல் அளவில் உண்மை கண்டுபிடிப்பு." },
      { title: "ஆன்மீக & ஆரோக்கிய தொழில்நுட்பம்", desc: "குண்டலினி தளங்கள், மறை கற்றல் ஆப்கள் — மர்மமானது அணுகக்கூடியதாக மாறுகிறது." },
    ],
    dashaThemes: [
      "நாகத்தின் முதல் சுருள் — புதன் நுண்ணறிவு, ஆரம்ப கூர்மை, பல ஆர்வங்கள்",
      "முதல் தோல் உரித்தல் — கேது மாற்றம், ஆன்மீக ஈர்ப்பு, உள்ளுக்குள் திரும்புதல்",
      "நாகம் விரிகிறது — சுக்கிர செழிப்பு, தொழில் ஆழம், திருமண உறவு",
      "நாகம் ஒளிரும் — சூரியன் தெரிவுநிலை, அங்கீகாரம், தெளிவு",
      "ராசி அதிபதி — அலை ஆழம் — சந்திர தசை கடக ராசிக்கு",
      "நாகத்தின் இறுதி தாக்கல் — செவ்வாய் நேரடித்தன்மை, இறுதி ஞானம்",
      "மர்மத்திற்குள் — ராகு இறுதி முடிவு",
      "முதியோர் கருணை — குரு வாழ்நாள் ஞானம்",
    ],
    dashaDetails: [
      {
        expect: "ஆயில்ய ஜாதகர் புதன் தசையில் வாழ்க்கையைத் தொடங்குகிறார் — புத்திசாலித்தனத்தையும் தகவல் தொடர்பையும் ஆளும் கிரகம் அதிபதியாக உள்ள நட்சத்திரத்துக்குப் பொருத்தமான தொடக்கம். புதன் நீண்ட தசை; பிறக்கும்போது மீதமுள்ள இருப்பு முதல் பாதத்தில் நீளமாகவும் நான்காம் பாதத்தில் குறுகியதாகவும் இருக்கும் — இந்த தசைக்குக் காட்டப்படும் வரம்பு அதைச் சொல்கிறது. குழந்தைப் பருவம் அசாதாரண உணர்திறனால் குறிக்கப்படுகிறது: பெரியவர்கள் மறைத்ததாக நினைப்பதை கவனிக்கும் குழந்தை, ஒரு விஷயத்தின் மையத்தை வெட்டும் கேள்விகளைக் கேட்கும் குழந்தை, வயதுக்கு மீறிய முதிர்ச்சி தெரியும் குழந்தை. பெரும்பாலும் மொழி அல்லது பகுப்பாய்வில் முன்கூட்டிய திறன் தெரியும் — சீக்கிரம் படிக்கும், வாதங்களை உருவாக்கும், உரையாடல்களை அப்படியே நினைவில் வைத்திருக்கும். நாகத்தின் ஊடுருவும் பார்வை முதல் மூச்சிலிருந்தே இருக்கிறது. இருப்பு பள்ளிக் காலம் முழுவதும் நீளுமானால் இது வலிமையான அறிவுப் பரப்பாக வளர்கிறது. புதன் தசையில் ஆயில்யம் பல பாடங்களை ஒரே நேரத்தில் நாடும் — மொழிகள், அறிவியல், கலைகள் ஒவ்வொன்றும் இந்த தீராத ஆர்வத்தில் தன் பங்கைக் கோருகின்றன. தன் அவதானிப்புகளைத் தனக்குள் வைத்துக்கொள்ளும் இயல்பு — மற்றவர்களுக்குத் தெரியாதது தனக்குத் தெரியும் என்பதை அவர்கள் அறியாமல் இருப்பது — ஆரம்பத்திலேயே உருவாகிறது.",
        navigate: "இளம் ஆயில்யத்திற்கு புதன் தசையின் சவால், தான் உணர்வதற்கும் சொல்ல அனுமதிக்கப்படுவதற்கும் இடையிலான இடைவெளியை நிர்வகிப்பது. மனிதர்களை ஊடுருவிப் பார்க்கும் குழந்தை எப்போதும் வரவேற்கப்படுவதில்லை; தசை வளரிளம் பருவம் வரை நீளும்போது, அதிகம் அறிந்தவர் தனிமைப்படலாம். புதன்–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்; குறைந்த இருப்பில் அது பிறப்புக்கு முன்பே வந்துவிடும்) மிகவும் தீவிரமான துணைக் காலம் — திடீர் வெளிப்பாடுகள், எல்லை சோதனைகள், அல்லது முக்கியமான அறிவுத் திருப்பம் வரலாம். உடல் கவலைகள்: நரம்பு மண்டலம், சுவாசக் குழாய், செரிமான உணர்திறன். சுறுசுறுப்பான புதன் மனதுக்கு வடிகால் இல்லையென்றால் பதற்றம் தோன்றலாம்.",
        focus: "புதன்கிழமை புதன் வழிபாடு, பசுமை அர்ப்பணம், தணியாத ஆர்வத்துக்கான வடிகால்கள் — புத்தகங்கள், புதிர்கள், ஒழுங்கான விவாதங்கள், எழுத்து. குழந்தை உணர்ந்தறிவதை ஏற்று உறுதிப்படுத்துவதும், அதை எப்போது, யாரிடம் பகிர்வது என்ற விவேகத்தைக் கற்பிப்பதுமே மிக முக்கியமான பெற்றோர் ஆதரவு. மனிதர்களைப் படிக்கும் ஆயில்யத்தின் திறன் இருமுனை கொண்ட நாகத்தின் நாக்கு: ஒழுங்குபடுத்தினால் வலிமை, கட்டுப்பாடின்றி விட்டால் தனிமை.",
      },
      {
        expect: "கேது தசை ஆயில்யத்தின் முதல் மாபெரும் மாற்றம் — நாகத்தின் முதல் திட்டமிட்ட தோல் உரித்தல். இது பாதத்தைப் பொறுத்து மிகவும் வேறுபட்ட வயதுகளில் வருகிறது: பிந்தைய பாதங்களில் குழந்தைப் பருவத்திலும் வளரிளம் பருவத்தின் தொடக்கத்திலும், முதல் பாதத்தில் வளரிளம் பருவத்தின் முடிவிலோ இளம் வயது வந்த காலத்திலோ. எப்போது வந்தாலும், வழக்கமான பாதையிலிருந்து விலகல், தீவிரமடையும் ஆன்மீக விசாரணை, அல்லது உள் மறுமதிப்பீட்டைக் கட்டாயப்படுத்தும் திடீர் இடையூறு ஆகியவற்றை இது கொண்டுவரும். கேது தசையில் நாகத்தின் மூதாதை கர்மம் உரத்துப் பேசுகிறது: கனவுகள் தெளிவாகின்றன, மறைபொருள் அல்லது ஆன்மீகக் கல்வியின் ஈர்ப்பு தவிர்க்க முடியாததாகிறது, எல்லாப் பழக்கங்களுக்கும் கீழே உண்மையில் ஒருவர் எதை விரும்புகிறார் என்ற கேள்வி தவிர்க்க முடியாதது. சில ஆயில்ய ஜாதகர்கள் இந்தக் காலத்தில் வியத்தகு வாழ்க்கை மாற்றத்தை அனுபவிக்கின்றனர்: தேர்ந்த பாதையை நிராகரிப்பது, ஆன்மீக சந்திப்பு, அல்லது அடிப்படை மாற்றத்தைத் தூண்டும் கர்ம உறவு.",
        navigate: "கேதுவின் வெளி உலகிலிருந்து விலகல் வெளிப்படையாக இலக்கற்றதாகத் தோன்றும் காலத்தை உருவாக்கலாம்; உண்மையில் அது தேவையான உள் மறுகட்டமைப்பு. ஆயில்யத்தைச் சுற்றியிருப்பவர்கள் இந்தக் காலத்தை அச்சமூட்டுவதாகக் காணலாம் — தெளிவான பாதையில் இருந்தவர் திசையை இழந்துவிட்டதாகத் தோன்றும். கேது தசையில் வழக்கமான மைல்கற்களைத் திணிக்காதீர்கள். உடல் கவலைகள்: தன்னெதிர்ப்பு பாதிப்புகள், சாதாரண நோயறிதலுக்கு அடங்காத மர்ம அறிகுறிகள் (நாகத்தின் மருத்துவத்துக்குப் பொருத்தமானவை), புதன் உணர்திறனாக விட்டுச்சென்ற நரம்பு மண்டல நிலைகள். இந்த தசையை நிறைவு செய்யும் கேது–புதன் புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) புதனின் பகுப்பாய்வு உந்துதல் ஆழமான கேது ஞானத்துடன் திரும்புவதைக் கொண்டுவருகிறது — ஒருங்கிணைப்பின் முதல் அறிகுறி.",
        focus: "விநாயகர் வழிபாடு, கேது சன்னதி வழிபாடு, நாக பஞ்சமி அனுஷ்டானம், நாகர்கோவில் கோவில் வருகைகள். நாக வழிபாடு இந்தக் காலகட்டத்தில் மிகவும் ஆழமான ஆன்மீகப் பயிற்சியாகச் செயல்படுகிறது.",
      },
      {
        expect: "சுக்கிர தசை ஆயில்யத்தின் வயது வந்த வாழ்வின் நீண்ட தசை — பிந்தைய பாதங்களில் குழந்தைப் பருவத்திலோ வளரிளம் பருவத்திலோ, முதல் பாதத்தில் இளம் வயது வந்த காலத்திலும் தொடங்குகிறது — வாழ்வின் வெளிப்படையாக மிக உற்பத்தியான, உறவுகள் செழிக்கும் காலத்தைத் தருகிறது. தொழில் நிலைபெற்று ஆழமடைகிறது; புதன் தசையின் அறிவுக் கொடைகளும் கேது தசையின் ஆன்மீக அடித்தளங்களும் இப்போது தொழில் மற்றும் படைப்பு வெளிப்பாட்டைக் காண்கின்றன. உளவியல், ஆராய்ச்சி, தொழில்நுட்பம், குணப்படுத்தல் அல்லது புலனாய்வுக் கலைகள் ஈர்க்கும்; தேர்ந்தெடுத்த துறை பெரும்பாலும் ஆயில்யத்தின் ஆழத்தை சுக்கிரன் தரும் சமூக, படைப்புக் கொடைகளுடன் இணைக்கிறது. இந்தத் தசைக்குள் திருமணம் அமைந்தால், அது ஜாதகத்தின் ஏழாம் வீட்டையும் அதன் அதிபதியையும் கொண்டு பார்க்கப்படுகிறது; சுக்கிரனும் குருவும் அதன் இயல்பான காரகர்கள். அது ஒரு நிலையான காலம் அல்ல, ஒரு போக்கே. நாகத்தின் தீவிரம் உறவில் ஒரு கொள்கலனைக் காண்கிறது — ஆயினும் ஆயில்யத்தின் ஆழ்ந்த உடைமை உணர்வும் உயர் தரங்களும் ஆரம்ப உறவுகளைக் கலக்கமாக்கலாம் என்பதால், துணை தேர்வில் கவனம் தேவை. சுக்கிர–குரு புக்தி (எப்போது என்பது கீழே உள்ள புக்தி அட்டவணையில்) படைப்பு மற்றும் உறவு செழிப்பின் உச்சம்.",
        navigate: "ஆயில்யத்திற்கு சுக்கிர தசையின் முதன்மை சவால் இயல்பான ஆழத்தைப் பேணிக்கொண்டே சுக்கிரன் கோரும் சமூகப் பரிமாணத்தில் ஈடுபடுவது. திறந்த புல்வெளியில் உள்ள நாகம் காட்டில் உள்ள நாகம் அல்ல — ஆயில்யம் தன் ஊடுருவும் இயல்பை, உறவு முடிவற்ற சோதனையாகவோ மறைவான கண்காணிப்பாகவோ மாறாதவாறு உறவுகளுக்குள் கொண்டுவர வழிகளைக் காண வேண்டும். உடல் கவலைகள்: சிறுநீரகங்கள், தோல், ஹார்மோன் அமைப்பு. சுக்கிர–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) வேகத்தைக் குறைக்கவும், சில சிக்கல்கள் கட்டாயப்படுத்தாமல் தாமாகத் தீரவிடவும் கோருகிறது.",
        focus: "வெள்ளிக்கிழமை லட்சுமி வழிபாடு, வெண்மை, இளஞ்சிவப்பு அர்ப்பணம், உண்மையில் நெருக்கத்தை அனுமதிக்கும் பழக்கம் — அறியப்படுவதும் அறிவதும். சுக்கிர தசையில் சுக்கிர–சந்திர புக்தியையும் கவனிக்கவும் (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்). சந்திரன் கடக ராசிக்கு அதிபதி — இந்த சாளரம் ஆழமான உணர்வு, குடும்ப மைல்கற்கள், வாழ்வின் முதல் பாதியின் ஆழ்ந்த உறவுச் சந்திப்பைக் கொண்டுவருகிறது. இதற்கு முழுமையான, விழிப்பான கவனம் கொடுங்கள்.",
      },
      {
        expect: "நடுவயதில் வரும் சூரிய தசை, ஆயில்யம் சுக்கிர தசை முழுவதும் செய்த ஆழமான, பெரும்பாலும் மறைவான வேலைக்கு ஒரு தெளிவுபடுத்தும் சூரிய குணத்தைக் கொண்டுவருகிறது. தொழில் அங்கீகாரம் வருகிறது — இறுதியில் கவனிக்கப்படும் ஆராய்ச்சியாளரின் பணி, நற்பெயர் பரவும் குணப்படுத்துபவர், கண்டுபிடிப்புகள் ஏற்கப்படும் புலனாய்வாளர். ஆயில்யத்தின் உள்ளுணர்வு நிழலில் வேலை செய்வது; சூரிய தசை அதை வெளிச்சத்துக்கு இழுக்கிறது — எப்போதும் வசதியாக இல்லாவிட்டாலும், அவசியமாக. அதிகாரம், திசைத் தெளிவு, நிறுவன நிலை எல்லாம் உயர்கின்றன. தந்தை, முதலாளி, அரசு போன்ற ஆண் அதிகார உருவங்களுடனான உறவு தீர்கிறது அல்லது தெளிவடைகிறது.",
        navigate: "சூரியனின் நேரடித்தன்மை ஆயில்யத்தின் இயல்பான ஊடகம் அல்ல; நீடித்த தெரிவுநிலையின் சங்கடம் பின்வாங்கும் உந்துதல்களை உருவாக்கலாம், அவை உணர்வுடன் நிர்வகிக்கப்பட வேண்டும். சூரிய–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) கூர்மையான சவாலைக் கொண்டுவருகிறது: பொது எதிர்பார்ப்புகளுக்கும் தனிப்பட்ட இயல்புக்கும் இடையிலான மோதல். உடல் கவனம்: இதயம், கண்கள், இரத்த ஓட்டம்.",
        focus: "ஞாயிற்றுக்கிழமை சூரிய வழிபாடு மற்றும் சூரியன் தசை வழங்கும் தெரிவுநிலையின் நேர்மையான ஏற்பு. ஒளியில் காண்பிக்கப்படும் நாகம் ஒரு இன்றியமையாத ஒன்றை நிறைவு செய்கிறது.",
      },
      {
        expect: "பிற்கால பணி ஆண்டுகளில் வரும் சந்திர தசை ஆயில்யத்திற்கு ராசி அதிபதியின் வருகை. கடகம் ஆயில்யத்தின் ராசி; அதனை ஆளும் சந்திரனின் தசை இரட்டை முக்கியத்துவம் பெறுகிறது. எப்போதும் இருந்தும் பகுப்பாய்வு மனதுக்குக் கீழ்ப்பட்டிருந்த உணர்வு நுண்ணறிவு இப்போது முழுமையாக எழுகிறது. உண்மையான ஊட்டும் திறன், இடம் தந்து தாங்கும் திறன், ஆழத்தில் அக்கறையைப் பெறுவதும் தருவதும் — ஆயில்யம் சில நேரம் பலவீனம் என்று சந்தேகிக்கும் இந்த கடக குணங்கள் — சந்திர தசையில் ஆயில்யத்தின் மிக ஆழ்ந்த சமூகக் கொடையாக வெளிப்படுகின்றன. குடும்ப உறவுகள் ஆழமடைகின்றன; மூத்தவர், குணப்படுத்துபவர், நினைவுக் காவலர் என்ற பாத்திரம் முழுமை பெறுகிறது. குணப்படுத்தல் அல்லது ஆன்மீகப் பயிற்சியில் உள்ளவர்களுக்கு, சந்திர தசை வாழ்நாளின் மிக ஆழ்ந்த பணியை உருவாக்குகிறது.",
        navigate: "வாழ்வின் இந்த கட்டத்தில் சந்திர தசையின் ஆரோக்கிய கவலைகள் திரவ சமநிலை, நினைவாற்றல், உணர்வு ஒழுங்குமுறை. சந்திரன் பெருக்கும் உணர்வின் ஆழம், புதனின் பகுப்பாய்வு இடைவெளிக்குப் பழகிய இயல்புக்கு மூழ்கடிப்பதாக இருக்கலாம்; நாகம் நீரைப் பார்ப்பதோடு நிற்காமல் நீரில் வாழக் கற்க வேண்டும். சந்திர–சனி புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மிகவும் கோரும் துணைக் காலம்; பொறுப்புகளைக் குறைத்து ஓய்வைப் பாதுகாக்கவும்.",
        focus: "திங்கட்கிழமை சந்திர வழிபாடு, நீர் அர்ப்பணம். ஆயில்ய ஜாதகர் சந்திர தசையில் முழுமைப்படுத்துகிறார் — நாகத்தின் ஆழமும் சந்திரனின் உணர்வு நுண்ணறிவும் ஒன்றாக இணைகின்றன.",
      },
      {
        expect: "பிற்கால ஆண்டுகளில் வரும் செவ்வாய் தசை ஆயில்யத்தின் பிற்கால ஞானத்துக்கு, நாகத்தின் வழக்கமான மறைமுகத்தன்மைக்குப் பழகியவர்களை ஆச்சரியப்படுத்தும் கூர்மையையும் நேரடித்தன்மையையும் கொண்டுவருகிறது. நாகம் தாக்கும்போது குறி தவறாது தாக்குகிறது — செவ்வாய் தசையில் ஆயில்யம் நேரடியாகப் பேசுகிறது, நம்பிக்கையுடன் செயல்படுகிறது, ஒருகாலத்தில் அமைதியான உள் கவனிப்பை மட்டும் தூண்டிய தட்டிக்கழிப்புகளிலும் மேலோட்ட வாழ்விலும் பொறுமை இல்லை. இது ஆயில்யத்தின் மிக நேரடியான நெறி மற்றும் அறிவுத் தலையீடுகளின் காலம்: மற்றவர்கள் சுற்றிவளைப்பதை பெயரிட்டுச் சொல்லும் ஆய்வுக் கட்டுரை, ஆண்டுகளாகச் சுற்றிக்கொண்டிருந்ததை இறுதியாகச் சொல்லும் குடும்ப உரையாடல், வேர் வரை வெட்டும் குணப்படுத்தும் பணி.",
        navigate: "இந்த வயதில் உடல் பராமரிப்பு முதன்மை. செவ்வாய் சக்தி உடல் உழைப்பாக அல்லாமல் மனத் துல்லியமாகவும் மன உறுதியான தெளிவாகவும் வெளிப்படுகிறது — சிந்தனைத் தெளிவை, இல்லாமல் இருக்கக்கூடிய உடல் வலிமை என்று தவறாக எண்ணாதீர்கள். செவ்வாய்–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) தீவிரமும் உரசலும் நிறைந்த காலத்தை கொண்டுவரலாம்; சந்திர தசையின் பொறுமையான ஞானத்துடன் அதைக் கடக்கவும்.",
        focus: "செவ்வாய்க்கிழமை செவ்வாய் சன்னதி வழிபாடு. நாகத்தின் இறுதி தாக்கல் — இது ஆக்கிரமிப்பு அல்ல, நீண்ட காலமாக நிறுவப்பட்ட அறிவின் நிறைவு.",
      },
      {
        expect: "பிற்கால வாழ்வுக்குள் நீளும் ராகு தசை நாகத்தின் இறுதியான, மிக முழுமையான வெளிப்பாட்டைக் கொண்டுவருகிறது. மாயை, எல்லைமீறலின் நிழல் கிரகமான ராகு, ஆயில்யத்தின் நாக சக்தியுடன் முழுமையாக இணக்கமாக இருக்கிறது — மற்ற நட்சத்திரங்கள் ராகுவைக் குழப்பமாகக் காணும்போது, ராகு தசையில் ஆயில்யம் ஒரு விசித்திரமான வீடு திரும்புதலை, மறைந்ததும் இடைநிலையானதும் மர்மமானதும் இறுதியாக முழு அனுமதி பெற்றது போன்ற உணர்வை அனுபவிக்கிறது. ஆன்மீகப் பயிற்சி மிகவும் வழக்கத்துக்கு மாறான, நேரடியான வெளிப்பாட்டை அடைகிறது; மூதாதையர் குணப்படுத்தல், வாழ்நாள் முழுவதும் ஓடிய நாக கர்மத்தின் தீர்வு, பெற்றுக்கொள்ளத் தயாரானவர்களுக்கு ஆழ்ந்த ஞானத்தைக் கடத்துதல் — இவை எல்லாம் செயல்படும் இந்த நீட்டிக்கப்பட்ட இறுதிக் காலத்தை வரையறுக்கின்றன.",
        navigate: "ராகுவின் காலம் நீளமானது; வாழ்வின் இந்த கட்டத்தின் உடல், அறிவாற்றல் சவால்கள் கவனமான மேலாண்மையைக் கோருகின்றன. ராகு–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) உண்மையான அருளும் ஞானப் பரிமாற்றமும் நிறைந்த இடைவெளியைக் கொண்டுவருகிறது; இது முழு வாழ்வின் மிக அர்த்தமுள்ள காலங்களில் ஒன்று.",
        focus: "ராகு சன்னதி வழிபாடு, தேங்காய் அர்ப்பணம். நாகம் அது எழுந்த மர்மத்தில் ஓய்கிறது.",
      },
      {
        expect: "மிக முதிர்ந்த வயதில் வரும் குரு தசையை மிகச் சிலரே அடைகிறார்கள். ஆழ்ந்த உணர்தல், மாற்றம், குணப்படுத்தல் ஆகியவற்றின் எட்டு தசைகளைச் சுமந்து இங்கு வரும் ஆயில்ய ஆத்மாக்களுக்கு, குரு ஒரு ஆசீர்வாதத்தைக் கொண்டுவருகிறார்: நாகத்தின் அறிவில் எப்போதும் மறைந்திருந்த குருவின் ஞானம் தன் மிக முழுமையான, விரிந்த வெளிப்பாட்டைக் காண்கிறது. விஷத்தையும் மருந்தையும் சுமக்கும் நாகம், மருந்தே எப்போதும் வெல்லும் என்ற முழுமையான அறிவில் ஓய்கிறது.",
        navigate: "முழுமையான உடல் பராமரிப்பும், சார்பை தோல்வியாக அல்லாமல் அருளாக ஏற்பதும். இந்த வயதில் குருவின் விரிவு முதன்மையாக உணர்வு நிலையின் விரிவு — முரண்பாட்டைத் தாங்கும் திறன், முழுமையாக மன்னிக்கும் திறன், மறைந்ததும் வெளிப்படையானதும் இறுதியில் ஒன்றே என்று அறியும் திறன்.",
        focus: "வியாழக்கிழமை குரு வழிபாடும், உண்மையை நோக்கிய நாகத்தின் யாத்திரையாக வாழ்க்கை முழுவதும் இருந்தவரின் எளிய இருப்பும். கடத்தல் பேச்சால் அல்ல, இருப்பால் நிகழ்கிறது.",
      },
    ],
    spirituality: [
      { title: "நாக தேவதை வழிபாடு",        desc: "நாகராஜா, நாக கன்னி, ஆதிசேஷன், வாசுகி — ஆயில்யத்தின் ஆளும் சக்திகள். நாக பஞ்சமி விரதம், நாகர்கோவில் கோவில் வருகைகள், நாக சன்னதி அர்ப்பணங்கள் மிகவும் நேரடியான ஆன்மீக நடைமுறைகள்." },
      { title: "குண்டலினி & தந்திர சாதனை", desc: "ஆயில்யம் குண்டலினி சக்தியின் விழிப்பிற்கு இயல்பான உறவை கொண்டுள்ளது. யோகா, ப்ராணாயாமம், தியானம் — கூட்டுக்கள் அல்ல, ஆயில்யம் ஏற்கனவே இருப்பதன் வெளிப்பாடுகள்." },
      { title: "முன்னோர் கர்மம் & நாக தோஷ தீர்வு", desc: "சர்ப்ப சம்ஸ்காரம், பித்ரு தர்ப்பணம், நாக பூஜை — வம்சாவளியின் நாக கர்மத்தை தீர்க்கும் ஆயில்யத்தின் முக்கியமான பரிகாரங்கள்." },
    ],
    guidance: "நாகம் காரணமில்லாமல் தாக்காது, நோக்கமில்லாமல் நகரவில்லை, அவசியமில்லாமல் தன்னை காட்டிக்கொள்வதில்லை. உங்கள் துளைக்கும் நுண்ணறிவு ஒரு ஆயுதம் அல்ல — மறைந்திருப்பதை குணப்படுத்த கொடுக்கப்பட்ட கொடை. நஞ்சும் மருந்தும் ஒன்றே. நீங்கள் இரண்டையும் கொண்டிருக்கிறீர்கள்.",
    careerNote: "ஆயில்ய ஜாதகர் எங்கும் மறைந்த உண்மை கண்டுபிடிக்கப்பட வேண்டும், மாற்றப்பட வேண்டும், அல்லது குணப்படுத்தப்பட வேண்டும் என்ற இடத்தில் சிறப்பாக செயல்படுகிறார்.",
    modernLead: "ஆயில்யத்தின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "துளைக்கும் நுண்ணறிவு, மாற்றும் சக்தி, குணப்படுத்தும் ஆழம் ஆகியவை ஆயில்யத்தின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function AshleshaVisualPage() {
  return <NatchathiramVisualContent data={ASHLESHA} visual={ASHLESHA_VISUAL} timings={dasaTimingsFor(ASHLESHA.number)} />;
}
