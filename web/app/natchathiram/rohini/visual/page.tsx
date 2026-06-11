import type { Metadata } from "next";
import { ROHINI } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

export const metadata: Metadata = {
  title: "Rohini Nakshathiram — Visual Profile | Vinaadi",
  description: "Visual profile of Rohini Nakshathiram: personality traits, career strengths, dasha timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/rohini/visual" },
  openGraph: {
    title: "Rohini Nakshathiram — Visual Profile",
    description: "Visual profile of Rohini Nakshathiram: personality traits, career strengths, dasha timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/rohini/visual",
    type: "article",
  },
};

const ROHINI_VISUAL: NatchathiramVisualData = {
  atAGlance: [
    { label: "Creative Abundance",  score: 95 },
    { label: "Beauty & Aesthetics", score: 93 },
    { label: "Magnetic Presence",   score: 90 },
    { label: "Nurturing Depth",     score: 88 },
    { label: "Patience & Stability",score: 85 },
  ],

  radar: {
    labels: ["Creativity", "Beauty", "Magnetism", "Nurturing", "Patience", "Prosperity"],
    values: [95, 93, 90, 88, 85, 91],
  },

  coreStrengths: [
    { symbol: "◎", label: "Creative Abundance",    score: 95, desc: "Brahma's nakshathiram — creation in all its forms is the natural expression." },
    { symbol: "◈", label: "Aesthetic Intelligence", score: 93, desc: "The most beautiful of the 27 stars — beauty, harmony, and form are instinctive gifts." },
    { symbol: "⚡", label: "Magnetic Presence",     score: 90, desc: "Krishna himself was born under Rohini — a natural magnetism that draws people effortlessly." },
    { symbol: "♥", label: "Nurturing Depth",        score: 88, desc: "The fertile earth of the zodiac — Rohini nourishes, grows, and sustains without being asked." },
    { symbol: "☽", label: "Sensory Refinement",     score: 87, desc: "Food, touch, music, fragrance — they experience the world at a heightened sensory register." },
    { symbol: "△", label: "Patient Persistence",    score: 85, desc: "The banyan tree — Rohini grows slowly and grows permanently, outlasting everything hasty." },
  ],

  careerAbilities: [
    { label: "Arts & Creative Design",  score: 95 },
    { label: "Agriculture & Nature",    score: 90 },
    { label: "Food & Hospitality",      score: 88 },
    { label: "Fashion & Beauty",        score: 93 },
    { label: "Education & Nurturing",   score: 85 },
  ],
  careerNote: "Thrives wherever beauty, creation, and nurturing abundance intersect — roles that reward sensory intelligence, aesthetic vision, and patient mastery.",

  careerClusters: [
    { symbol: "◎", title: "Arts & Creative Design",  desc: "Visual arts, interior design, jewellery, textile — Rohini's aesthetic gift finds its fullest expression." },
    { symbol: "◈", title: "Fashion & Beauty",        desc: "Styling, beauty, cosmetics, luxury fashion — Rishabam's Venusian domain." },
    { symbol: "♥", title: "Food & Hospitality",      desc: "Culinary arts, restaurant, hotel — Rohini's nourishing instinct becomes a profession." },
    { symbol: "☽", title: "Agriculture & Nature",    desc: "Farming, botanical study, landscape design — the earth as creative partner." },
    { symbol: "△", title: "Education & Childcare",   desc: "Teaching young children, early education, nurturing roles — natural Brahma territory." },
    { symbol: "⚡", title: "Performing Arts",         desc: "Music, dance, cinema — Rohini's magnetism thrives on stage and screen." },
  ],

  modernApps: [
    { symbol: "◎", title: "Content Creation & Aesthetics", desc: "Visual storytelling, photography, reels, and aesthetic brand building." },
    { symbol: "◈", title: "Beauty Tech & Wellness",        desc: "Skincare, fragrance, wellness apps, personalised beauty brands." },
    { symbol: "♥", title: "Food Tech & AgriTech",         desc: "Farm-to-table platforms, food innovation, sustainable agriculture technology." },
    { symbol: "☽", title: "Luxury & Lifestyle Brands",    desc: "Curated luxury goods, artisanal products, slow-living brands." },
    { symbol: "△", title: "EdTech for Young Learners",    desc: "Early childhood learning apps, sensory-based education, creative curricula." },
    { symbol: "⚡", title: "Music & Entertainment",        desc: "Streaming, live events, artist management — Rohini's magnetism on platforms." },
  ],

  dashaTimeline: [
    {
      planet: "Moon", period: "10 yrs", ageRange: "Age 0–10", theme: "The World in Full Bloom",
      detail: {
        expect: "Rohini is born into Moon dasha — the most appropriate opening for a Moon-ruled nakshathiram. From birth, this child is unusually beautiful, responsive to touch and sound, and deeply attuned to the emotional climate of the household. The bond with the mother is among the closest in the zodiac; early childhood is shaped almost entirely by this relationship. The home is the whole world. Creative play — drawing, music, garden, cooking — begins early and naturally. Academic entry (ages 5–10) is gentle; Rohini learns by absorption and environment, not by force. A rich emotional memory is forming in these years that will fuel creative work for decades.",
        navigate: "Moon's shadow on Rohini's birth dasha is excessive sensitivity — this child absorbs every emotional undercurrent in the family. Parental conflict, instability, or neglect leaves impressions that are unusually deep and long-lasting. Digestive health and fluid balance are Moon's primary physical concerns; do not dismiss recurring stomach complaints as minor. Moon–Rahu antardasha (approximately ages 8–9) is the most turbulent sub-period — unusual fears, disturbed sleep, and psychosomatic complaints can cluster here. The mother's own health and emotional stability directly shapes the child's foundation.",
        focus: "Monday worship, Ekadasi fasting, and establishing a stable, beautiful home environment is the most powerful remedy for Moon dasha. Music — singing, listening, or instrument — should be introduced as early as possible; it becomes a lifelong stabiliser. Visiting a sacred water body regularly with the child provides Moon's natural grounding. A stable, loving home is not merely comfort — for Rohini's Moon dasha child, it is medicine.",
      },
    },
    {
      planet: "Mars", period: "7 yrs", ageRange: "Age 10–17", theme: "First Assertion of Self",
      detail: {
        expect: "Mars dasha from 10 to 17 lands Rohini in the full intensity of adolescence. The gentle, creative child of Moon dasha suddenly encounters competition, physical growth, and the demand for independent identity. Academic pressure peaks — board examinations and competitive transitions fall squarely in this window. Athletic ability, previously secondary, may surface as a genuine strength. First romantic stirrings arrive, typically in Mars–Venus antardasha (approximately ages 15–16). The family relationship with siblings and cousins becomes more significant. A first clear career direction usually becomes visible by the end of Mars dasha.",
        navigate: "Mars's energy is sharp in contrast to Rohini's naturally gentle Moon nature — the result can be internal conflict between the desire for beauty and peace and the external demand for competition and assertion. Accidents, impulsive decisions, and conflict with parental authority are the primary risks between ages 10 and 17. Health: inflammatory conditions, skin and eye issues can surface. Do not allow Mars dasha's pressure to permanently redirect a naturally artistic Rohini into purely competitive paths they are not suited for.",
        focus: "Tuesday Murugan worship and physical discipline — sport, martial arts, yoga — channel Mars's energy without letting it damage Rohini's aesthetic nature. Academic excellence and competitive tests are genuinely available in this window; pursue them. Also watch the Mars–Venus antardasha within this dasha (the 7th sub-period, lasting 20 months, beginning approximately in the 5th year of Mars dasha, around age 15). Venus is the lord of your rasi, Rishabam — this window, brief as it is, carries the rasi lord's amplified blessing for Rohini. Creative talent receives unusual public recognition here; romantic connections formed now carry unusual weight; any artistic training intensified in this window tends to become professionally foundational. Do not let Mars's competitive pressure crowd out this sub-period's creative invitation.",
      },
    },
    {
      planet: "Rahu", period: "18 yrs", ageRange: "Age 17–35", theme: "The Magnetic World",
      detail: {
        expect: "Rahu dasha from 17 to 35 is Rohini's most consequential developmental stretch — covering late adolescence, higher education, early career, marriage, and the first decade of full adult life. Rohini's magnetic presence and aesthetic gifts find their first major audiences here. Higher education or vocational training establishes; the creative or hospitality field that becomes a lifelong vocation typically crystallises between ages 20 and 25. Marriage arrives — often in Rahu–Jupiter antardasha (approximately ages 28–30) — and the first child. Rohini's social world expands dramatically under Rahu, drawing in diverse and internationally-influenced connections.",
        navigate: "Rahu amplifies Rohini's natural magnetism to a degree that can attract both opportunity and unwanted attention. Romantic entanglements that are glamorous but unstable are a specific risk in the early portion of this dasha (ages 17–24). Financial discipline is critical — Rohini's love of beauty and abundance can translate into spending patterns that undermine long-term stability. Rahu–Saturn antardasha (approximately ages 30–32) is the most demanding sub-period; career pressures and family responsibilities converge acutely here. Reproductive health for women deserves consistent monitoring throughout this dasha.",
        focus: "Saturday prayers at a Rahu shrine and coconut offerings provide essential grounding. At the dasha's opening (age 17), establishing one clear creative or professional discipline that the entire Rahu period is directed toward yields far better results than opportunistic experimentation. Also note the Rahu–Venus antardasha within this dasha (the 2nd sub-period, lasting 20 months, arriving roughly 18 months into Rahu dasha, around age 18–20). Venus as your rasi lord makes this early window within Rahu dasha the single most important sub-period for Rohini's artistic, romantic, and prosperity foundations. The decisions made in these 20 months — educational direction, creative focus, life partner connection — carry the rasi lord's seal and tend to endure.",
      },
    },
    {
      planet: "Jupiter", period: "16 yrs", ageRange: "Age 35–51", theme: "Prosperity & Purpose",
      detail: {
        expect: "Jupiter dasha from 35 to 51 is Rohini's era of fullest prosperity. Career is established, family is growing, and the creative or business instinct that has been developing finds its most fertile expression. Business ventures — particularly in food, beauty, education, fashion, or hospitality — reach maturity. Property acquisition in the early forties is strongly favoured. Children are entering significant educational milestones and the parent–child relationship deepens into mutual respect. Jupiter brings a natural inclination toward learning, teaching, and community leadership; Rohini's nurturing instinct finds institutional expression in Jupiter dasha.",
        navigate: "Jupiter's trap for Rohini is overextension — the abundance of this period can encourage expanding in too many directions simultaneously. Choose two or three areas of deep investment and protect them over the entire 16-year arc rather than diffusing across many. Liver health, weight management, and metabolic monitoring become relevant in the mid-forties. The generous nature of Rohini under Jupiter can attract those who extract more than they contribute — discernment in business partnerships is essential.",
        focus: "Thursday Dakshinamurthy or Vishnu worship amplifies Jupiter's natural abundance for Rohini. This is the single best dasha for Rohini to make property investments and build lasting financial structure. Also note the Jupiter–Venus antardasha within this dasha (the 9th sub-period in Jupiter's sequence, lasting 20 months, arriving approximately in the 9th–10th year of Jupiter dasha, around age 44–46). Venus as rasi lord makes this the most prosperous and creatively fertile sub-period of the entire Jupiter dasha — a window for major creative breakthroughs, significant property acquisition, and relationship deepening that carries the rasi lord's amplification. Plan deliberately for this window from the start of Jupiter dasha.",
      },
    },
    {
      planet: "Saturn", period: "19 yrs", ageRange: "Age 51–70", theme: "The Structure of Maturity",
      detail: {
        expect: "Saturn dasha from 51 to 70 is Rohini's longest period and tests the durability of everything built in earlier dashas. The career structures established in Rahu and Jupiter must now demonstrate their permanence. For those in business, this is the period of institutional consolidation — formalising what was built informally. Children are becoming independent adults; grandchildren begin arriving in the sixties. Rohini's natural patience and long-view orientation aligns well with Saturn's demands, making this dasha more manageable than for many nakshatrams. Legacy-building — charitable work, community involvement, institutional contribution — comes naturally in the late Saturn years.",
        navigate: "Saturn's primary physical warnings for Rohini between 51 and 70 are musculoskeletal, respiratory, and circulatory. Joint care, particularly of knees and hips, requires proactive management. Coldness and emotional distance — Saturn's shadow on Rohini's naturally warm nature — can create friction in family relationships if left unchecked. Saturn–Rahu antardasha (approximately ages 60–62) is the most pressured sub-period; financial and legal obligations that have been deferred will surface with urgency.",
        focus: "Saturday oil bath, Shani temple worship, and service to the elderly are the primary Saturn remedies for Rohini. Also note the Saturn–Venus antardasha within this dasha (approximately in the 10th year of Saturn dasha, around age 61). Venus as rasi lord makes this one of the most significant sub-periods of the entire Saturn dasha — a window of unusual creative and relational warmth within Saturn's generally austere arc. Property matters finalised, creative projects completed, and relationships renewed in this window carry the rasi lord's blessing. Do not let Saturn's general heaviness cause you to overlook this specific opening.",
      },
    },
    {
      planet: "Mercury", period: "17 yrs", ageRange: "Age 70–87", theme: "The Living Garden",
      detail: {
        expect: "Mercury dasha from 70 to 87 finds Rohini in an unexpected flourishing of creative and intellectual expression. The accumulated aesthetic intelligence, storytelling, and creative knowledge of a lifetime produces work that is genuinely irreplaceable — memoirs, teaching, craft mastery, or artistic output that younger practitioners cannot approach. Grandchildren provide a new audience for Rohini's nurturing genius. The home becomes a creative sanctuary. Technology, if embraced in earlier decades, provides new avenues for sharing Rohini's aesthetic gifts with wider audiences.",
        navigate: "Mercury governs the nervous system and communication — at this age, maintaining vocal clarity, memory, and fine motor coordination (important for artisans and musicians) deserves daily attention. Light intellectual activity — writing, reading, conversation, music — maintains Mercury's vitality far longer than disengagement. Dry and cold environments aggravate Mercury conditions; Rohini's natural comfort with warmth and moisture should be honoured.",
        focus: "Wednesday worship, green offerings, and sustained creative engagement are Mercury's remedies for Rohini. Also note the Mercury–Venus antardasha within this dasha (the 1st sub-period within Mercury dasha, lasting approximately 11 months 27 days, arriving at the very start of Mercury dasha, around age 70). Venus as rasi lord makes this opening window of Mercury dasha a moment of unusual creative and relational grace — the most Venus-touched opening of any late-life dasha. Any significant creative project, relationship renewal, or charitable initiative begun in this first year of Mercury dasha carries the rasi lord's blessing.",
      },
    },
    {
      planet: "Ketu", period: "7 yrs", ageRange: "Age 87–94", theme: "Beautiful Renunciation",
      detail: {
        expect: "Ketu dasha from 87 to 94 calls Rohini into a gentle but unmistakable withdrawal from the world's demands. The person who has spent a lifetime creating, nurturing, and beautifying is invited to experience beauty at its most essential — the beauty of silence, of presence, of being rather than doing. Spiritual deepening, connection with grandchildren and great-grandchildren, and a quiet generosity of spirit characterise this period. Pilgrimage, if physically possible, fulfils a lifetime aspiration.",
        navigate: "Physical needs are simple and specific — warmth, gentle movement, regular nourishment, and steady companionship. Ketu can produce unusual sensitivity to spiritual presences or dimensions; for Rohini, this is not pathology but the natural opening of a lifetime of refined sensory awareness. Avoid cold, damp, and sensory harshness.",
        focus: "Ketu shrine visits, pitru tharpanam, and black sesame offerings are the remedies. The Bhagavata Purana — the story of Krishna, Rohini's own star's divine guest — is the most resonant scriptural companion for this dasha. A prepared, peaceful, and beauty-surrounded completion is the goal.",
      },
    },
    {
      planet: "Venus", period: "20 yrs", ageRange: "Age 94–114", theme: "The Rasi Lord's Final Bloom",
      detail: {
        expect: "Venus dasha from 94 onward is reached by very few, but for those who arrive here, it carries an extraordinary quality: Venus is the lord of your rasi, Rishabam — this makes her dasha doubly charged for Rohini natives. Where other nakshathirams experience Venus dasha as one planetary period among many, for Rohini it is the rasi lord herself arriving in the final chapter. A late-life flowering of beauty, grace, and creative fullness is the classical promise of this period. The person lives in a state of natural abundance — receiving care, appreciation, and the love of family — that mirrors in miniature the Venusian gift they gave to the world across their entire life.",
        navigate: "At this extreme age, physical care is complete — warmth, nourishment, companionship, and spiritual surroundings are the body's requirements. The mind, if Venus is strong in the natal chart, can remain astonishingly clear and aesthetically alive. Avoid sensory harshness and emotional disruption.",
        focus: "Friday worship of Goddess Lakshmi, rose and jasmine offerings, and surrounding the person with music, flowers, and beauty is the most appropriate care and remedy for Venus dasha at this age. A life of creating beauty, nurturing others, and honouring the natural world culminates in this gentle return to the Goddess herself.",
      },
    },
  ],

  spirituality: [
    {
      title: "Brahma & Saraswati Devotion",
      desc: "Rohini's presiding deity is Brahma — creative work is itself worship; any sustained artistic or nurturing practice is the deepest spiritual path for Rohini.",
    },
    {
      title: "Krishna & Vishnu Temples",
      desc: "Krishna was born under Rohini — Guruvayur, Udupi, and any Vishnu shrine are particularly potent for Rohini natives, especially on Rohini Vrat days.",
    },
    {
      title: "Lakshmi & Venus Worship",
      desc: "Friday Lakshmi worship, keeping the home beautiful and fragrant, and regular floral offerings maintain the rasi lord Venus's grace across the entire lifetime.",
    },
  ],

  guidance: "Your gift is creation — honour it by building things that last. Cultivate beauty, nourish people, invest in patience, and the Venusian abundance that is Rohini's birthright will arrive in every dasha that matters.",

  compatibleEn: ["Ashwini", "Bharani", "Hasta", "Uttara Phalguni", "Mrigashira"],
  compatibleNote: "These nakshatras match Rohini's creative abundance, nurturing warmth, and magnetic aesthetic sense with depth, stability, and complementary vision.",

  ta: {
    atAGlanceLabels: ["படைப்பு செழிப்பு", "அழகு & நேர்த்தி", "காந்த இருப்பு", "ஊட்டும் ஆழம்", "பொறுமை & நிலைத்தன்மை"],
    radarLabels: ["படைப்பாற்றல்", "அழகு", "காந்தம்", "ஊட்டுதல்", "பொறுமை", "செழிப்பு"],
    coreStrengths: [
      { label: "படைப்பு செழிப்பு",    desc: "பிரம்மாவின் நட்சத்திரம் — படைப்பு அனைத்து வடிவங்களிலும் இயல்பான வெளிப்பாடு." },
      { label: "அழகு நுண்ணறிவு",      desc: "27 நட்சத்திரங்களில் மிக அழகானது — அழகு, இணக்கம், வடிவம் இயல்பான கொடைகள்." },
      { label: "காந்த இருப்பு",        desc: "கிருஷ்ணரே ரோகிணி கீழ் பிறந்தார் — மக்களை இயல்பாக ஈர்க்கும் காந்தம்." },
      { label: "ஊட்டும் ஆழம்",         desc: "ராசியின் வளமான மண் — ரோகிணி கேட்காமலேயே ஊட்டுகிறார்கள், வளர்க்கிறார்கள்." },
      { label: "புலன் நுட்பம்",        desc: "உணவு, தொடு உணர்வு, இசை, வாசம் — உயர்ந்த புலன் மட்டத்தில் உலகை உணர்கிறார்கள்." },
      { label: "பொறுமை நிலைத்தன்மை",  desc: "ஆலமரம் — ரோகிணி மெதுவாக வளர்கிறார், நிரந்தரமாக வளர்கிறார்." },
    ],
    careerAbilityLabels: ["கலை & படைப்பு வடிவமைப்பு", "விவசாயம் & இயற்கை", "உணவு & விருந்தோம்பல்", "நாடி & அழகு", "கல்வி & பாதுகாப்பு"],
    careerClusters: [
      { title: "கலை & படைப்பு வடிவமைப்பு", desc: "காட்சி கலை, உள்ளறை வடிவமைப்பு, நகை, ஜவுளி — ரோகிணியின் அழகு கொடை." },
      { title: "நாடி & அழகு",              desc: "ஸ்டைலிங், அழகு, அலங்காரம், ஆடம்பர நாடி — ரிஷபத்தின் சுக்கிர தளம்." },
      { title: "உணவு & விருந்தோம்பல்",      desc: "சமையல் கலை, உணவகம், ஹோட்டல் — ரோகிணியின் ஊட்டும் உள்ளுணர்வு." },
      { title: "விவசாயம் & இயற்கை",         desc: "விவசாயம், தாவரவியல் ஆய்வு, நிலப்பரப்பு வடிவமைப்பு — மண் படைப்பு கூட்டாளி." },
      { title: "கல்வி & குழந்தை பாதுகாப்பு", desc: "சிறு குழந்தைகளுக்கு கற்பிக்கும் ஆரம்பக் கல்வி, ஊட்டும் பாத்திரங்கள்." },
      { title: "நிகழ்த்துகலை",              desc: "இசை, நடனம், திரைப்படம் — ரோகிணியின் காந்தம் மேடையில் மலர்கிறது." },
    ],
    modernApps: [
      { title: "உள்ளடக்க படைப்பு & நேர்த்தி", desc: "காட்சி கதை சொல்லல், புகைப்படம், ரீல்கள், அழகியல் பிராண்ட் கட்டுவது." },
      { title: "அழகு தொழில்நுட்பம் & நலன்",   desc: "தோல் பராமரிப்பு, வாசம், நலன் ஆப்கள், தனிப்பட்ட அழகு பிராண்டுகள்." },
      { title: "உணவு தொழில்நுட்பம் & விவசாயம்", desc: "பண்ணை முதல் மேசை தளங்கள், உணவு கண்டுபிடிப்பு, நிலையான விவசாயம்." },
      { title: "ஆடம்பரம் & வாழ்க்கை பிராண்டுகள்", desc: "கலைஞர் உருவாக்கிய பொருட்கள், மெதுவான வாழ்க்கை பிராண்டுகள்." },
      { title: "சிறு கற்பவர்களுக்கான கல்வி தொழில்நுட்பம்", desc: "ஆரம்பக் கல்வி ஆப்கள், புலன் அடிப்படையிலான கல்வி." },
      { title: "இசை & பொழுதுபோக்கு",            desc: "ஸ்ட்ரீமிங், நேரடி நிகழ்வுகள், கலைஞர் மேலாண்மை." },
    ],
    dashaThemes: [
      "உலகம் முழு மலர்ச்சியில் — தாய், அழகு, ஆரம்பக் படைப்பு",
      "சுயத்தின் முதல் வலியுறுத்தல் — போட்டி, பருவமடைதல், திசை கண்டுபிடிப்பு",
      "காந்த உலகம் — கல்வி, திருமணம், முதல் படைப்பு செழிப்பு",
      "செழிப்பு & நோக்கம் — தொழில் முதிர்ச்சி, சொத்து, கற்பித்தல்",
      "முதிர்ச்சியின் கட்டமைப்பு — மரபு கட்டுவது, சமூக தலைமை",
      "வாழும் தோட்டம் — கடைசி படைப்பு மலர்ச்சி, பேரன் பேத்திகள், ஞானம்",
      "அழகான துறவு — ஆன்மீக திரும்பல், சாரம், அமைதி",
      "ராசி அதிபதியின் இறுதி மலர்ச்சி — சுக்கிரன் வருகிறார், வட்டம் நிறைவடைகிறது",
    ],
    dashaDetails: [
      {
        expect: "ரோகிணி சந்திர தசையில் பிறக்கிறார் — சந்திரனால் ஆட்சி செய்யப்படும் நட்சத்திரத்திற்கு மிகவும் பொருத்தமான திறப்பு. பிறப்பிலிருந்தே இந்த குழந்தை அசாதாரண அழகுடன், தொடு உணர்வு மற்றும் ஒலிக்கு மிகவும் பதிலளிப்பதுடன் வருகிறது. தாயுடன் பிணைப்பு ராசியின் மிக நெருங்கிய ஒன்று. வீடு முழு உலகம். படைப்பு விளையாட்டு — வரைதல், இசை, தோட்டம் — இயல்பாக ஆரம்பிக்கும்.",
        navigate: "சந்திரனின் நிழல் ரோகிணியின் பிறப்பு தசையில் அதிகப்படியான உணர்திறன் — இந்த குழந்தை குடும்பத்தில் உள்ள ஒவ்வொரு உணர்வு சலனத்தையும் உறிஞ்சுகிறது. பெற்றோரின் மோதல் அல்லது குடும்ப அமைதியின்மை அசாதாரண ஆழமான தடமுளைக்கும். செரிமான ஆரோக்யம் மற்றும் திரவ சமநிலை கவனிக்க வேண்டும். சந்திர–ராகு அந்தர்தசை (சுமார் 8–9 வயது) அதிகமாக கலக்கமான துணை காலம்.",
        focus: "திங்கள் வழிபாடு, ஏகாதசி விரதம், அழகான மற்றும் நிலையான வீட்டு சூழல் நிறுவுவது சந்திர தசையின் மிக சக்திவாய்ந்த நிவாரணம். இசையை — பாடுவது, கேட்பது, இசை கருவி — முடிந்தவரை ஆரம்பத்திலேயே அறிமுகப்படுத்துங்கள். புனித நீர்நிலை வழக்கமான வருகை இயல்பான தரையிறக்கம் தருகிறது.",
      },
      {
        expect: "செவ்வாய் தசை 10 முதல் 17 வயது வரை ரோகிணியை பருவமடைதலின் முழு தீவிரத்தில் வைக்கிறது. சந்திர தசையின் மெல்லிய, படைப்பு குழந்தை திடீரென போட்டி, உடல் வளர்ச்சி, சுதந்திர அடையாளத்தின் கோரிக்கையை சந்திக்கிறது. வாரியக் கல்வி அழுத்தம் உச்சமடைகிறது. முதல் காதல் எழுச்சிகள் பொதுவாக செவ்வாய்–சுக்கிர அந்தர்தசையில் (சுமார் 15–16 வயது) வருகின்றன.",
        navigate: "செவ்வாய் சக்தி ரோகிணியின் இயல்பான சந்திர இயல்புடன் கடுமையாக மோதுகிறது — விளைவு அழகு மற்றும் அமைதி ஆசைக்கும் போட்டி மற்றும் வலியுறுத்தல் வெளிப்புற கோரிக்கைக்கும் இடையே உள்ளக மோதல். விபத்துகள், உந்துவித முடிவுகள், பெற்றோர் அதிகாரத்துடன் மோதல் 10–17 வயதுக்கு இடையே முதன்மையான அபாயங்கள்.",
        focus: "செவ்வாய்க்கிழமை முருகன் வழிபாடும் உடல் ஒழுக்கமும் — விளையாட்டு, யோகா — செவ்வாய் சக்தியை ரோகிணியின் அழகு இயல்பை சேதப்படுத்தாமல் திசைமாற்றுகின்றன. கவனிக்கவும்: செவ்வாய்–சுக்கிர அந்தர்தசை (7வது துணை காலம், 20 மாதங்கள், செவ்வாய் தசையின் 5வது ஆண்டில், சுமார் 15 வயது). சுக்கிரன் உங்கள் ராசியான ரிஷபத்தின் அதிபதி — இந்த சாளரம் ரோகிணிக்கு ராசி அதிபதியின் வலிமையுடன் வருகிறது. இந்த 20 மாதங்களில் கலை திறன் அசாதாரண பொது அங்கீகாரம் பெறும்.",
      },
      {
        expect: "ராகு தசை 17 முதல் 35 வயது வரை ரோகிணியின் மிக முக்கியமான வளர்ச்சி நீட்டிப்பு — பருவமடைந்த இளமை, உயர் கல்வி, ஆரம்பகால தொழில், திருமணம், முழு வயது வந்த வாழ்வின் முதல் தசகம். ரோகிணியின் காந்த இருப்பும் அழகு கொடைகளும் இங்கு தங்கள் முதல் பெரிய பார்வையாளர்களை கண்டுபிடிக்கின்றன. திருமணம் பொதுவாக ராகு–குரு அந்தர்தசையில் (சுமார் 28–30 வயது) வருகிறது.",
        navigate: "ராகு ரோகிணியின் இயல்பான காந்தத்தை வாய்ப்பும் விரும்பப்படாத கவனமும் ஈர்க்கும் அளவிற்கு அதிகரிக்கிறது. ஆரம்ப பகுதியில் (17–24 வயது) ஆடம்பரமான ஆனால் நிலையற்ற காதல் பிணைப்புகள் குறிப்பிட்ட அபாயம். ராகு–சனி அந்தர்தசை (சுமார் 30–32 வயது) மிகவும் கோரும் துணை காலம்.",
        focus: "சனிக்கிழமை ராகு சன்னதி வழிபாடும் தேங்காய் அர்ப்பணமும் அவசியமான தரையிறக்கம் தருகின்றன. கவனிக்கவும்: ராகு–சுக்கிர அந்தர்தசை (2வது துணை காலம், 20 மாதங்கள், ராகு தசை தொடங்கி சுமார் 18 மாதங்களில், சுமார் 18–20 வயது). சுக்கிரன் ராசி அதிபதி என்பதால் ராகு தசையின் இந்த ஆரம்ப சாளரம் ரோகிணியின் கலை, காதல், செழிப்பு அடித்தளங்களுக்கு மிக முக்கியமானது. இந்த 20 மாதங்களில் எடுக்கப்படும் திசைகள் — கல்வி, படைப்பு கவனம், வாழ்க்கை துணை தொடர்பு — நீடித்திருக்கின்றன.",
      },
      {
        expect: "குரு தசை 35 முதல் 51 வயது வரை ரோகிணியின் மிக நிறைவான செழிப்பின் காலம். தொழில் நிலைபெற்றுள்ளது, குடும்பம் வளர்கிறது, வணிக உள்ளுணர்வு தனது மிக வளமான வெளிப்பாட்டை கண்டுபிடிக்கிறது. சொத்து வாங்குவது நாற்பதுகளின் ஆரம்பத்தில் வலுவாக சாதகம். குழந்தைகள் முக்கிய கல்வி மைல்கற்களில் நுழைகிறார்கள்.",
        navigate: "குரு ரோகிணிக்கு அதிக திசைகளில் விரிவாக்குவதை ஊக்குவிக்கலாம் — பல திட்டங்களை ஒரே நேரத்தில் விரிவாக்கல். முழு 16 ஆண்டுகளிலும் ஆழமாக முதலீடு செய்ய இரண்டு அல்லது மூன்று பகுதிகளை தேர்ந்தெடுங்கள். கல்லீரல் ஆரோக்யம், உடல் எடை கட்டுப்பாடு நாற்பதுகளின் நடுவில் கவனிக்க வேண்டும்.",
        focus: "வியாழக்கிழமை தட்சிணாமூர்த்தி அல்லது விஷ்ணு வழிபாடு குரு தசையில் ரோகிணிக்கு செழிப்பை அதிகரிக்கிறது. சொத்து முதலீடுகள் செய்ய இந்த தசை சிறந்தது. கவனிக்கவும்: குரு–சுக்கிர அந்தர்தசை (குரு தசையின் 9–10வது ஆண்டில், சுமார் 44–46 வயது, 20 மாதங்கள்). சுக்கிரன் ராசி அதிபதி என்பதால் இந்த துணை காலம் முழு குரு தசையின் மிக செழிப்பான மற்றும் படைப்பு வளமான துணை காலம் — ராசி அதிபதியின் வலுப்படுத்தல் கொண்ட முக்கிய படைப்பு திருப்புமுனைகள், சொத்து வாங்குவது, உறவு ஆழமடைவது. குரு தசை தொடங்கும் போதே இந்த சாளரத்திற்கு திட்டமிடுங்கள்.",
      },
      {
        expect: "சனி தசை 51 முதல் 70 வயது வரை ரோகிணியின் மிக நீண்ட காலகட்டம். முந்தைய தசைகளில் கட்டியதன் நிரந்தரத்தன்மையை இப்போது நிரூபிக்க வேண்டும். வணிக அமைப்புகள் முறைப்படுத்தப்படுகின்றன. குழந்தைகள் சுதந்திர வயது வந்தோராகிறார்கள். பேரன்கள் அறுபதுகளில் வருகிறார்கள். ரோகிணியின் இயல்பான பொறுமையும் நீண்ட கண்ணோட்டமும் சனியின் கோரிக்கைகளுடன் நன்றாக ஒத்துப்போகின்றன.",
        navigate: "சனியின் முதன்மையான ஆரோக்ய எச்சரிக்கைகள் மூட்டு மண்டலம், சுவாசம், இரத்த ஓட்டம். சனி–ராகு அந்தர்தசை (சுமார் 60–62 வயது) தாமதிக்கப்பட்ட நிதி மற்றும் சட்ட கடமைகள் திடீரென மேற்பரப்பில் வரும் மிக அழுத்தமான துணை காலம்.",
        focus: "சனிக்கிழமை எண்ணெய் குளியல், சனி கோவில் வழிபாடு, முதியோருக்கு சேவை முதன்மையான நிவாரணங்கள். கவனிக்கவும்: சனி–சுக்கிர அந்தர்தசை (சனி தசையின் சுமார் 10வது ஆண்டில், சுமார் 61 வயது, 20 மாதங்கள்). சுக்கிரன் ராசி அதிபதி என்பதால் இந்த துணை காலம் சனி தசையின் பொதுவான கண்டிப்பான வளைவில் படைப்பு மற்றும் உறவு அரவணைப்பின் அசாதாரண சாளரம். சனியின் பொதுவான கனத்தால் இந்த குறிப்பிட்ட திறப்பை கவனிக்காதீர்கள்.",
      },
      {
        expect: "புதன் தசை 70 முதல் 87 வயது வரை ரோகிணியில் படைப்பு மற்றும் அறிவு வெளிப்பாட்டின் எதிர்பாராத மலர்ச்சியை கண்டுபிடிக்கிறது. ஒரு வாழ்நாள் திரட்டிய அழகு நுண்ணறிவு, கதை சொல்லல், படைப்பு ஞானம் மாற்றவியலாத பணிகளை தருகிறது — நினைவுக்குறிப்புகள், கற்பித்தல், கைவினை தேர்ச்சி, கலைப்படைப்பு. பேரன்கள் ரோகிணியின் ஊட்டும் மேதைமைக்கு புதிய பார்வையாளர்களை வழங்குகிறார்கள்.",
        navigate: "புதன் நரம்பு மண்டலம் மற்றும் தகவல் தொடர்பை நிர்வகிக்கிறார் — சரளமான பேச்சு, நினைவு, நுட்பமான மோட்டார் ஒருங்கிணைப்பு பராமரிப்பது தினசரி கவனம் தேவை. வழக்கமான கலை ஈடுபாடு — எழுத்து, வாசிப்பு, இசை — புதன் சக்தியை நீண்ட காலம் பராமரிக்கிறது.",
        focus: "புதன்கிழமை வழிபாடு, பசுமை அர்ப்பணங்கள், தொடர்ந்த படைப்பு ஈடுபாடு நிவாரணங்கள். கவனிக்கவும்: புதன்–சுக்கிர அந்தர்தசை (புதன் தசையின் முதல் துணை காலம், சுமார் 12 மாதங்கள், சுமார் 70 வயது). சுக்கிரன் ராசி அதிபதி என்பதால் புதன் தசையின் இந்த திறப்பு சாளரம் படைப்பு மற்றும் உறவு கருணையின் அசாதாரண தருணம் — 70 வயதில் எந்த முக்கியமான படைப்பு திட்டமும், உறவு புதுப்பித்தலும், தொண்டு முயற்சியும் ராசி அதிபதியின் ஆசீர்வாதத்தை கொண்டு வருகிறது.",
      },
      {
        expect: "கேது தசை 87 முதல் 94 வயது வரை ரோகிணியை உலகின் கோரிக்கைகளிலிருந்து மெல்லிய ஆனால் தெளிவான திரும்பலுக்கு அழைக்கிறது. ஒரு வாழ்நாள் படைத்து, ஊட்டி, அழகு செய்தவர் சாரமான அழகை அனுபவிக்க அழைக்கப்படுகிறார் — மவுனம், இருப்பு, செய்வதை விட இருப்பதின் அழகு. ஆன்மீக ஆழமடைதல், பேரன் பேத்திகளுடன் தொடர்பு, அமைதியான தாராளம் இந்த காலகட்டத்தை வரையறுக்கிறது.",
        navigate: "உடல் தேவைகள் எளிமையான மற்றும் குறிப்பிட்டவை — அரவணைப்பு, மெல்லிய அசைவு, வழக்கமான ஊட்டச்சத்து, நிலையான துணை. குளிர், ஈரம், மற்றும் புலன் கடுமை தவிர்க்க வேண்டும்.",
        focus: "கேது சன்னதி வழிபாடு, பித்ரு தர்ப்பணம், கருப்பு எள் அர்ப்பணங்கள் நிவாரணங்கள். பாகவத புராணம் — கிருஷ்ணர் கதை, ரோகிணி சொந்த நட்சத்திரத்தின் தெய்வீக விருந்தினர் — இந்த தசைக்கான மிகவும் பொருத்தமான வேதாகம துணை.",
      },
      {
        expect: "சுக்கிர தசை 94 வயதிலிருந்து மிகச் சிலரால் அடையப்படுகிறது — ஆனால் வருவோருக்கு அது அசாதாரண தரம் கொண்டது: சுக்கிரன் உங்கள் ராசியான ரிஷபத்தின் அதிபதி — இது ரோகிணி நேயர்களுக்கு இரட்டை வலிமையுடன் வருகிறது. மற்ற நட்சத்திரங்கள் சுக்கிர தசையை பல கிரக காலங்களில் ஒன்றாக அனுபவிக்கும்போது, ரோகிணிக்கு இது இறுதி அத்தியாயத்தில் வரும் ராசி அதிபதி. அழகு, கருணை, படைப்பு நிறைவின் இறுதிகால மலர்ச்சி இந்த காலகட்டத்தின் வாக்குறுதி.",
        navigate: "இந்த தீவிர வயதில், உடல் பராமரிப்பு முழுமை — அரவணைப்பு, ஊட்டச்சத்து, துணை, ஆன்மீக சூழல் உடலின் தேவைகள். சுக்கிரன் நட்சத்திர சாட்டத்தில் வலுவாக இருந்தால், மனம் ஆச்சரியமான தெளிவு மற்றும் அழகு உணர்வுடன் இருக்கலாம்.",
        focus: "வெள்ளிக்கிழமை லட்சுமி வழிபாடு, ரோஜா மற்றும் மல்லிகை அர்ப்பணம், இசை, மலர்கள், அழகுடன் நபரை சூழ்வது — சுக்கிர தசையில் இந்த வயதில் மிகவும் பொருத்தமான பராமரிப்பும் நிவாரணமும். அழகு படைத்து, மற்றவர்களை ஊட்டி, இயற்கை உலகை மதித்த வாழ்க்கை கடைசியில் அன்னை தேவியிடமே திரும்புகிறது.",
      },
    ],
    spirituality: [
      { title: "பிரம்மா & சரஸ்வதி பக்தி",  desc: "ரோகிணியின் தலைமை தெய்வம் பிரம்மா — படைப்பு வேலையே வழிபாடு; எந்த நிலையான கலை அல்லது ஊட்டும் நடைமுறையும் ரோகிணிக்கு ஆழமான ஆன்மீக பாதை." },
      { title: "கிருஷ்ணன் & விஷ்ணு கோவில்கள்", desc: "கிருஷ்ணர் ரோகிணி கீழ் பிறந்தார் — குருவாயூர், உடுப்பி, எந்த விஷ்ணு தலமும் ரோகிணி நேயர்களுக்கு குறிப்பாக சக்திவாய்ந்தது, ரோகிணி விரத நாட்களில் குறிப்பாக." },
      { title: "லட்சுமி & சுக்கிர வழிபாடு",    desc: "வெள்ளிக்கிழமை லட்சுமி வழிபாடு, வீட்டை அழகாகவும் வாசமாகவும் வைப்பது, வழக்கமான மலர் அர்ப்பணம் — ராசி அதிபதி சுக்கிரனின் அருளை முழு வாழ்நாளும் பராமரிக்கிறது." },
    ],
    guidance: "உங்கள் கொடை படைப்பு — நீடிக்கும் விஷயங்களை கட்டி மதிப்பு செலுத்துங்கள். அழகை வளர்த்து, மக்களை ஊட்டி, பொறுமையில் முதலீடு செய்யுங்கள் — ரோகிணியின் பிறப்புரிமையான சுக்கிர செழிப்பு முக்கியமான ஒவ்வொரு தசையிலும் வரும்.",
    compatibleNote: "இந்த நட்சத்திரங்கள் ரோகிணியின் படைப்பு செழிப்பு, ஊட்டும் அரவணைப்பு, காந்த அழகு உணர்வை ஆழம், நிலைத்தன்மை, நிரப்பும் தொலைநோக்குடன் பொருந்துகின்றன.",
    careerNote: "அழகு, படைப்பு, ஊட்டும் செழிப்பு ஆகியவை சந்திக்கும் இடங்களில் சிறப்பாக செயல்படுகிறார்கள் — புலன் நுண்ணறிவு, அழகியல் தொலைநோக்கு, பொறுமையான தேர்ச்சியை வெகுமதி தரும் பணிகளில்.",
    modernLead: "ரோகிணியின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "அழகியல் நுட்பம், ஆழமான ஊட்டல், பொறுமையான விசுவாசம் ரோகிணியின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function RohiniVisualPage() {
  return <NatchathiramVisualContent data={ROHINI} visual={ROHINI_VISUAL} />;
}
