import type { Metadata } from "next";
import { withTamilTwin } from "@/lib/localized-metadata";
import { withDasaTimingHold } from "@/lib/natchathiram-dasa-hold";
import { dasaTimingsFor } from "@/lib/natchathiram-dasa-timings";
import { nakshatraDisplayName } from "@/lib/nakshatra-display-name";
import { natchathiramVisualTa } from "@/lib/marketing-seo-ta";
import { PURVA_ASHADHA } from "@/lib/natchathiram-data";
import { NatchathiramVisualContent, type NatchathiramVisualData } from "@/components/natchathiram-visual";

const EN_METADATA: Metadata = {
  title: `${nakshatraDisplayName(PURVA_ASHADHA.number, "en")} — Visual Profile`,
  description: "Visual profile of Pooradam Nakshathiram: personality traits, career strengths, dasa timeline, compatible nakshathirams, and spiritual guidance.",
  alternates: { canonical: "https://vinaadi.com/natchathiram/purva-ashadha/visual" },
  openGraph: {
    title: `${nakshatraDisplayName(PURVA_ASHADHA.number, "en")} — Visual Profile`,
    description: "Visual profile of Pooradam Nakshathiram: personality traits, career strengths, dasa timeline, and spiritual guidance.",
    url: "https://vinaadi.com/natchathiram/purva-ashadha/visual",
    type: "article",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withDasaTimingHold(await withTamilTwin(EN_METADATA, "/natchathiram/purva-ashadha/visual", natchathiramVisualTa("purva-ashadha")!), "purva-ashadha");
}

const PURVA_ASHADHA_VISUAL: NatchathiramVisualData = {
  atAGlance: [
    { label: "Invincible Optimism",        score: 97 },
    { label: "Philosophical Expansiveness", score: 96 },
    { label: "Venus-Refined Beauty",        score: 94 },
    { label: "Water's Adaptive Flow",       score: 95 },
    { label: "Dhanus Fire",                 score: 93 },
  ],

  radar: {
    labels: ["Optimism", "Philosophy", "Aesthetics", "Adaptability", "Idealism", "Inspiration"],
    values: [97, 96, 94, 95, 93, 95],
  },

  coreStrengths: [
    { symbol: "◎", label: "Invincible Optimism",          score: 97, desc: "Purva Ashadha means 'the early victory' — and this victory is not the final conquest but the optimism that continues to move forward regardless of what has come before. The invincibility here is not arrogance but the water's capacity to find its way through any obstacle." },
    { symbol: "◈", label: "Philosophical Expansiveness",   score: 96, desc: "Dhanus's philosophical range joined to Venus's aesthetic grace — Purva Ashadha seeks understanding not as a narrow discipline but as the broad horizon of ideas, traditions, and cultures that expand the sense of what is possible." },
    { symbol: "⚡", label: "Venus-Refined Beauty",         score: 94, desc: "The nakshathiram of Apas — the divine waters — under Venus's rulership. Purva Ashadha's sense of beauty is fluid, inclusive, and generous: beauty not as perfection but as the quality that makes the ordinary luminous." },
    { symbol: "♥", label: "Water's Adaptive Flow",        score: 95, desc: "Apas — the deity of purifying, nourishing water — gives Purva Ashadha the capacity to adapt without losing essence. Like water, these natives find the path through rather than the path over or under." },
    { symbol: "△", label: "Dhanus Idealism",              score: 93, desc: "Jupiter's rasi fire expressed through Dhanus's arrow — Purva Ashadha carries ideals not as abstractions but as genuine orientating principles that guide practical action in the world." },
    { symbol: "☽", label: "Inspirational Transmission",   score: 95, desc: "The capacity to inspire — to make others feel that the impossible is possible — is Purva Ashadha's most remarkable social gift. The Venus-refined tongue and the Dhanus expansive vision combine as the natural teacher and motivator." },
  ],

  careerAbilities: [
    { label: "Philosophy & Higher Teaching",     score: 96 },
    { label: "Arts & Aesthetic Creation",        score: 94 },
    { label: "International Relations & Law",    score: 95 },
    { label: "Water & Environmental Sciences",   score: 93 },
    { label: "Motivational Leadership",          score: 97 },
  ],
  careerNote: "Purva Ashadha excels wherever the combination of philosophical breadth, aesthetic grace, motivational presence, and the capacity to adapt while maintaining essential vision are the central requirements. They are the inspired teachers, international diplomats, and creative leaders who make others believe that higher possibilities are genuinely attainable.",

  careerClusters: [
    { symbol: "◎", title: "Philosophy & Higher Teaching",       desc: "University teaching, philosophical writing, dharma transmission — Purva Ashadha's philosophical range and Venus-refined articulation at their most direct." },
    { symbol: "◈", title: "Arts & Creative Leadership",         desc: "Fine arts, music, creative direction, aesthetic enterprise — the Venus-Dhanus combination producing beauty in service of a larger vision." },
    { symbol: "⚡", title: "International Work & Diplomacy",     desc: "International relations, cross-cultural diplomacy, global education — Dhanus's expansive engagement with the world's diversity." },
    { symbol: "♥", title: "Environmental & Water Sciences",     desc: "Hydrology, environmental conservation, water policy — the Apas deity's domain translated into professional service." },
    { symbol: "△", title: "Law & Ethics",                       desc: "Constitutional law, international law, ethical frameworks — the idealistic capacity to articulate what ought to be in the domain of justice." },
    { symbol: "☽", title: "Motivational Leadership & Coaching", desc: "Inspirational speaking, life coaching, organisational motivation — the Venus tongue and Dhanus vision mobilising others toward their highest possibility." },
  ],

  modernApps: [
    { symbol: "◎", title: "Education Tech & Philosophy Platforms", desc: "Higher education technology, philosophical inquiry platforms, dharma transmission applications — Purva Ashadha's teaching range digitised." },
    { symbol: "◈", title: "Creative & Aesthetic Tech",             desc: "Creative direction platforms, aesthetic AI tools, music and arts technology — Venus-refined beauty at digital scale." },
    { symbol: "⚡", title: "Global Collaboration & Diplomacy Tech", desc: "Cross-cultural collaboration platforms, international negotiation tools, global education technology." },
    { symbol: "♥", title: "Environmental & Water Technology",      desc: "Hydrology platforms, water conservation technology, environmental intelligence tools." },
    { symbol: "△", title: "Legal & Ethics Technology",             desc: "Legal reasoning platforms, ethical framework tools, constitutional analysis technology." },
    { symbol: "☽", title: "Coaching & Inspiration Technology",     desc: "Motivational coaching platforms, leadership development tools, inspirational content technology." },
  ],

  dashaTimeline: [
    {
      planet: "Venus", theme: "Born in the Beautiful",
      detail: {
        expect: "Purva Ashadha opens in Venus dasa — a beginning of unusual beauty, abundance, and sensory richness. Venus is the longest dasa of the cycle, and the balance left at birth runs from long for births in the first pada to short for the fourth; the range shown for this dasa gives it. The childhood environment typically carries aesthetic quality: music, art, beauty, and the pleasure of ideas are available from the earliest years. Where the balance reaches the school years, they produce a student of genuine breadth — not necessarily the most disciplined but consistently the most inspired, the one who makes others feel that learning is an adventure rather than a requirement. Where it runs on into adolescence, early romantic and creative interests blossom; the first serious aesthetic passion — music, writing, visual art, performance — often crystallises in this stretch. The Venus–Jupiter bhukti (the table below gives when it begins and how long it lasts; for the shorter balances it falls before birth) carries the rasi lord's presence in a luminous window — where it falls after birth, a philosophical or spiritual quality in the childhood environment.",
        navigate: "Venus's primary challenge for the young Purva Ashadha is the comfort of the beautiful — the child whose natural environment is aesthetic and expansive can find the plainness and discipline of structured learning jarring. The Dhanus fire that motivates genuine philosophical commitment has not yet fully ignited in Venus dasa; the result can be breadth without depth, enthusiasm without completion. The Venus–Jupiter bhukti is a rasi lord flag; where it falls after birth, it comes in childhood.",
        focus: "Friday Lakshmi and Saraswati worship — beauty and wisdom as the twin foundations of the Purva Ashadha Venus opening. Provide wide aesthetic and philosophical exposure, but gently cultivate the follow-through that Venus dasa can lack. The first great love — of a subject, an art form, a person — that enters in Venus dasa will echo through the entire life.",
      },
    },
    {
      planet: "Sun", theme: "The First Clarity",
      detail: {
        expect: "Sun dasa wears two faces, depending on the pada. For the later padas it begins in childhood and runs through the school years, bringing a first concentrated sense of self to Venus's expansive opening. For the first pada, it comes as school gives way to adulthood: university completion, first career steps, and the consolidation of identity are its central dramas. The philosophical idealism that has been gestating in Venus dasa now meets the discipline of having to choose: which vision, which career, which life? The solar clarity that comes from this choice — even when the choice is difficult — is Purva Ashadha's first real experience of their own determination.",
        navigate: "Sun's primary challenge for Purva Ashadha is the conflict between the solar demand for singular focus and the Dhanus–Venus appetite for breadth. The person who wants to study everything and experience everything finds, in Sun dasa, the productive constraint of having to become something specific. The Sun–Rahu bhukti (the table below gives when it begins and how long it lasts) can bring disruption and unexpected direction changes.",
        focus: "Sunday Surya worship and the cultivation of sustained focus on the single most important professional or philosophical commitment. The identity that crystallises in Sun dasa — though it may be revised in later dasas — provides the spine around which Purva Ashadha's eventual wisdom accumulates.",
      },
    },
    {
      planet: "Moon", theme: "Emotional Foundations",
      detail: {
        // Marriage: the astrologer's ruled sentence, verbatim (owner rulings, fourth round). Do not reword.
        expect: "Moon dasa falls in very different years by pada — in adolescence for the later padas, in young adulthood and beyond for the first. It brings emotional depth and relational richness to Purva Ashadha's otherwise philosophical and aesthetic nature. Where marriage falls within this dasa, it is read from the seventh house and its lord, with Venus and Jupiter as the natural significators, and judged from the individual horoscope as a tendency rather than a fixed time. Where it falls in adult life, children may arrive; the family foundation that Purva Ashadha will nourish through decades may take root. Professional development continues through the Moon dasa; the motivational and teaching capacities that are Purva Ashadha's most distinctive professional gifts begin to find their most effective expression as the emotional intelligence deepens.",
        navigate: "Moon's primary challenge for Purva Ashadha is the encounter with emotional limitation — their own and others'. The expansive optimism that is their deepest nature meets, in Moon dasa, the reality that emotional life cannot always be expanded or philosophically reframed. The Moon–Jupiter bhukti (the table below gives when it begins and how long it lasts) is a warm sub-period with rasi lord presence — an expansive, wise, and possibly pivotal personal or professional moment.",
        focus: "Monday Moon worship and deliberate cultivation of emotional presence without the philosophical reframe. The Moon–Jupiter bhukti (the bhukti table below gives when it begins and how long it lasts) is a rasi lord flag: Jupiter arrives in Moon's emotional field as a moment of philosophical ease, expansive relationship energy, or significant personal wisdom.",
      },
    },
    {
      planet: "Mars", theme: "Directed Fire",
      detail: {
        expect: "Mars dasa ignites Purva Ashadha's idealism with directed action; it arrives in early adulthood for the later padas and nearer mid-life for the first. The philosophical vision and the motivational presence now meet the energy of decisive implementation — the inspired teacher who begins to build institutions, the philosophical writer who completes the major work, the creative director who launches the defining project. Mars's fire in Dhanus is the fire of the philosopher-warrior: not the warrior who fights for territory but the one who fights for ideas, for higher possibilities, for the vision that others have not yet seen. Professional achievements of Mars dasa typically have a quality of invincibility — the obstacles are met with the Apas deity's patient, insistent, adaptive advance.",
        navigate: "Mars's primary challenge for Purva Ashadha is impatience — the motivated person who has finally found the directed fire for their vision can become intolerant of the time that implementation actually requires. The optimism of Purva Ashadha's nature meets the reality that even the invincible advance takes the time it takes. The Mars–Jupiter bhukti (the table below gives when it begins and how long it lasts) brings a brief but significant rasi lord presence — the philosophical moderator in Mars's active field.",
        focus: "Tuesday Mars shrine prayers. The Mars–Jupiter bhukti (the bhukti table below gives when it begins and how long it lasts) is a rasi lord flag: Jupiter arrives in Mars's directed field as the philosophical wisdom and expansive perspective that ensures the directed fire serves the larger vision.",
      },
    },
    {
      planet: "Rahu", theme: "The World Stage",
      detail: {
        expect: "Rahu dasa brings Purva Ashadha's vision and motivational presence to the widest possible arena; it begins in young adulthood for the later padas and in middle age for the first. International recognition, cross-cultural work, and the encounter with ideas and traditions far outside the birth culture are the signature experiences of Rahu's long span. The philosophical breadth of Dhanus and the aesthetic grace of Venus find in Rahu dasa the amplifying field they have been building toward. Teaching, writing, leadership, and the transmission of the higher vision that Purva Ashadha carries reach their widest reach in this period. Financial prosperity typically peaks in Rahu dasa as well — the combination of Venus's abundance instinct and Rahu's expansive appetite produces significant material results.",
        navigate: "Rahu's primary challenge for Purva Ashadha is the amplification of the optimism beyond its genuine capacity — the invincible attitude that works as a genuine spiritual orientation becoming a refusal to acknowledge real limits. The water's adaptive flow requires acknowledging the presence of obstacles before finding the path through them. The Rahu–Jupiter bhukti (the table below gives when it begins and how long it lasts) is a window of major philosophical, spiritual, or wisdom-tradition deepening.",
        focus: "Saturday Rahu shrine prayers and deliberate cultivation of epistemic humility — the acknowledgement that even Purva Ashadha's invincible optimism has limits. The Rahu–Jupiter bhukti (the bhukti table below gives when it begins and how long it lasts) is a major rasi lord flag: Jupiter arrives in Rahu's expanded field as the most significant philosophical, spiritual, and wisdom-deepening sub-period of the entire Rahu dasa.",
      },
    },
    {
      planet: "Jupiter", theme: "Rasi Lord — The Philosopher's Fullness",
      detail: {
        expect: "Jupiter dasa, in the second half of life, is the rasi lord's arrival for Purva Ashadha — the planet that rules your rasi, Dhanus, now governs your dasa. For the Purva Ashadha native whose entire life has been animated by philosophical expansiveness, aesthetic grace, motivational presence, and invincible optimism, Jupiter dasa is the fullness — the period in which the breadth and beauty of the life that has been lived can be transmitted with the authority of genuine experience. Grandchildren receive the teacher of teachers. The philosophical and spiritual institutions Purva Ashadha has been building through Rahu dasa now enter their mature phase. Writing and teaching reach a quality of transmission that the earlier work, however inspired, could not achieve — because it is now informed by the fullness of a life actually lived.",
        navigate: "Jupiter's primary shadow in the rasi lord dasa is the philosophical inflation of the teacher — the person whose vision has been validated across decades beginning to believe their vision is the vision, rather than one inspired expression of a truth that exceeds any single formulation. The Apas deity's humility — the water that serves by flowing, not by demanding that the landscape accommodate it — is the antidote. Physical care and the deliberate simplicity of later life are important.",
        focus: "Thursday Brihaspati and Dakshinamurthy worship — the teacher of teachers, who transmits by silence and by presence. Jupiter dasa is the fullness that the life has been building toward; give the philosophical vision freely, hold the formulations lightly, and let the invincible optimism continue to illuminate those whose lives you touch.",
      },
    },
    {
      planet: "Saturn", theme: "The Long Discipline",
      detail: {
        expect: "Saturn dasa, in advanced age, brings the great discipline of time and limitation to Purva Ashadha's otherwise expansive and optimistic life. After the philosophical fullness of Jupiter dasa, Saturn insists on simplicity: the single relationship, the single practice, the single truth that has survived the long life. For those who have remained genuinely open to learning, Saturn dasa is the most honest period of the life — the discipline that strips away what is remaining of the performed philosophical optimism and leaves the genuine equanimity underneath.",
        navigate: "Complete and gentle physical care. Saturn's demands at this age require deliberate, devoted attention from those who love this person. The Saturn–Jupiter bhukti, which closes this dasa (the table below gives when it begins and how long it lasts), brings the rasi lord in Saturn's disciplined late field.",
        focus: "Saturn dasa is the long discipline that proves whether the invincible optimism was genuine or performed. For the true Purva Ashadha, the answer is evident in the quality of their presence — the water that has been flowing across a lifetime is still clear.",
      },
    },
    {
      planet: "Mercury", theme: "Final Intelligence",
      detail: {
        expect: "Mercury dasa, in very advanced age, is reached by extraordinarily few Purva Ashadha souls. For those who arrive, Mercury brings a final return to the mind's capacity — the intelligence of articulation, the precision of language — in a context of radical simplicity.",
        navigate: "Complete and devoted physical care. Mercury at this extreme age is a gift of the sharpness of understanding — a mind that has been refined by nine decades of philosophical engagement.",
        focus: "Wednesday Mercury worship and the presence of those who love to listen to this person. The Venus-refined tongue and the Dhanus philosophical vision, distilled across a long life, speak simply and memorably.",
      },
    },
  ],

  spirituality: [
    {
      title: "Apas (Waters) Worship & Water Rituals",
      desc: "Apas — the divine waters, the purifying and nourishing force — is Purva Ashadha's presiding deity. Water rituals (Jalabhishekam), offerings to sacred rivers, and the spiritual practice of bathing in holy waters are among Purva Ashadha's deepest expressions. The Apas Sukta from the Rigveda is the most resonant scriptural text.",
    },
    {
      title: "Jupiter & Guru Devotion",
      desc: "The Brihaspati–Jupiter lineage — Guru puja on Thursdays, Dakshinamurthy worship, and the devotional relationship with a living guru or wisdom tradition — is the central spiritual orientation of Purva Ashadha's life. Jupiter's philosophical expansiveness and the Guru's capacity for genuine transmission both express what Purva Ashadha carries at the deepest level.",
    },
    {
      title: "Philosophy as Devotion",
      desc: "For Purva Ashadha, the philosophical life — the genuine, sustained investigation of what is ultimately true and what is ultimately good — is not separate from devotional practice but is itself the highest devotional practice. The Gita, the Upanishads, and the philosophical traditions of Vedanta and Mimamsa are the natural spiritual study.",
    },
  ],

  guidance: "The early victory is not the final victory — it is the victory of continuing to advance, even when the landscape is difficult, even when the previous understanding has been dissolved, even when the goal is further than it appeared when you began. The water's invincibility is not the invincibility of the boulder but of the river: it finds its way because it never stops moving. The philosophical vision you carry is a gift given to be given — hold it generously and give it freely, and the giving will always exceed what the holding could provide.",

  compatibleEn: ["Moolam", "Uthiradam", "Rohini", "Hastham", "Aswini"],
  compatibleNote: "These nakshatras complement Purva Ashadha's invincible optimism, philosophical expansiveness, and Venus-refined beauty with grounding, depth, and philosophical resonance.",

  ta: {
    atAGlanceLabels: ["தோற்கடிக்க முடியாத நம்பிக்கை", "தத்துவ விரிவாக்கம்", "சுக்கிர-மெருகு அழகு", "நீரின் தகவமைப்பு ஓட்டம்", "தனுசு நெருப்பு"],
    radarLabels: ["நம்பிக்கை", "தத்துவம்", "அழகியல்", "தகவமைப்பு", "இலட்சியவாதம்", "உத்வேகம்"],
    coreStrengths: [
      { label: "தோற்கடிக்க முடியாத நம்பிக்கை",  desc: "பூர்வ ஆஷாடா என்றால் 'ஆரம்ப வெற்றி' — இந்த வெற்றி இறுதி வெற்றி அல்ல ஆனால் முன்பு என்ன வந்தாலும் முன்னால் தொடர்ந்து நகரும் நம்பிக்கை. தோற்கடிக்க முடியாத தன்மை இங்கே ஆணவம் அல்ல ஆனால் எந்த தடையிலும் வழி காணும் நீரின் திறன்." },
      { label: "தத்துவ விரிவாக்கம்",              desc: "தனுசின் தத்துவ வரம்பு சுக்கிரனின் அழகியல் நளினத்துடன் சேர்ந்தது — பூராடம் புரிதலை ஒரு குறுகிய துறையாக அல்ல, சாத்தியமானது பற்றிய உணர்வை விரிவாக்கும் யோசனைகள், மரபுகள், பண்பாடுகளின் பரந்த தொடுவானமாகத் தேடுகிறது." },
      { label: "சுக்கிர-மெருகு அழகு",            desc: "அபஸ் — தெய்வீக நீர் — சுக்கிரனின் ஆட்சியின் கீழ் நட்சத்திரம். பூராடத்தின் அழகு உணர்வு திரவமானது, உள்ளடக்கியது மற்றும் தாராளமானது: பரிபூரணம் அல்ல; சாதாரணத்தை ஒளிரச் செய்யும் தரம்." },
      { label: "நீரின் தகவமைப்பு ஓட்டம்",       desc: "அபஸ் — சுத்திகரிக்கும், ஊட்டமளிக்கும் நீரின் தெய்வம் — பூராடத்துக்கு சாரத்தை இழக்காமல் தகவமைக்கும் திறனை கொடுக்கிறது. நீரைப் போல, இந்த ஜாதகர்கள் மேலேயோ கீழேயோ அல்ல, ஊடாகச் செல்லும் பாதையைக் காண்கிறார்கள்." },
      { label: "தனுசு இலட்சியவாதம்",            desc: "தனுசின் அம்பு மூலம் வெளிப்படும் குருவின் ராசி நெருப்பு — பூராடம் இலட்சியங்களை வெறும் கருத்துகளாக அல்ல, உலகில் நடைமுறைச் செயலை வழிநடத்தும் உண்மையான திசைகாட்டும் கொள்கைகளாகச் சுமக்கிறது." },
      { label: "உத்வேகமான பரிமாற்றம்",          desc: "உத்வேகம் தரும் திறன் — மற்றவர்களுக்கு சாத்தியமற்றது சாத்தியம் என்று உணர வைப்பது — பூராடத்தின் மிகவும் குறிப்பிடத்தக்க சமூக கொடை. சுக்கிர-மெருகு நாக்கும் தனுசு விரிவான பார்வையும் இயற்கையான ஆசிரியராகவும் உந்துதல் அளிப்பவராகவும் சேர்கின்றன." },
    ],
    careerAbilityLabels: ["தத்துவம் & உயர் கற்பித்தல்", "கலை & அழகியல் படைப்பு", "சர்வதேச உறவுகள் & சட்டம்", "நீர் & சுற்றுச்சூழல் அறிவியல்கள்", "உந்துதல் தலைமை"],
    careerClusters: [
      { title: "தத்துவம் & உயர் கற்பித்தல்",       desc: "பல்கலைக்கழக கற்பித்தல், தத்துவ எழுத்து, தர்ம பரிமாற்றம் — பூராடத்தின் தத்துவ வரம்பு மற்றும் சுக்கிர-மெருகு வாய்மொழி." },
      { title: "கலை & படைப்பு தலைமை",             desc: "நுண்கலை, இசை, படைப்பு இயக்குநர்கள், அழகியல் நிறுவனங்கள் — ஒரு பெரிய பார்வையின் சேவையில் அழகை உருவாக்கும் சுக்கிர-தனுசு கலவை." },
      { title: "சர்வதேச வேலை & இராஜதந்திரம்",     desc: "சர்வதேச உறவுகள், கலாச்சாரங்களுக்கு இடையிலான இராஜதந்திரம், உலகளாவிய கல்வி — உலகின் வேற்றுமையுடன் தனுசின் விரிவான ஈடுபாடு." },
      { title: "சுற்றுச்சூழல் & நீர் அறிவியல்கள்", desc: "நீரியல், சுற்றுச்சூழல் பாதுகாப்பு, நீர் கொள்கை — தொழில்முறை சேவையில் மொழிபெயர்க்கப்பட்ட அபஸ் தெய்வத்தின் தளம்." },
      { title: "சட்டம் & நெறிமுறைகள்",            desc: "அரசியலமைப்பு சட்டம், சர்வதேச சட்டம், நெறிமுறை கட்டமைப்புகள் — நீதியின் தளத்தில் என்னவாக இருக்க வேண்டும் என்பதை வெளிப்படுத்தும் இலட்சியவாத திறன்." },
      { title: "உந்துதல் தலைமை & பயிற்சி",       desc: "உத்வேகமான பேச்சு, வாழ்க்கை பயிற்சி, நிறுவன உந்துதல் — சுக்கிர நாக்கும் தனுசு பார்வையும் மற்றவர்களை அவர்களின் உயர்ந்த சாத்தியத்தை நோக்கி அணிதிரட்டுகிறது." },
    ],
    modernApps: [
      { title: "கல்வி தொழில்நுட்பம் & தத்துவ தளங்கள்", desc: "உயர்கல்வி தொழில்நுட்பம், தத்துவ விசாரணை தளங்கள், தர்ம பரிமாற்ற பயன்பாடுகள்." },
      { title: "படைப்பு & அழகியல் தொழில்நுட்பம்",    desc: "படைப்பு இயக்குநர் தளங்கள், அழகியல் AI கருவிகள், இசை மற்றும் கலை தொழில்நுட்பம்." },
      { title: "உலகளாவிய ஒத்துழைப்பு & இராஜதந்திர தொழில்நுட்பம்", desc: "கலாச்சாரங்களுக்கு இடையிலான ஒத்துழைப்பு தளங்கள், சர்வதேச பேச்சுவார்த்தை கருவிகள்." },
      { title: "சுற்றுச்சூழல் & நீர் தொழில்நுட்பம்", desc: "நீரியல் தளங்கள், நீர் பாதுகாப்பு தொழில்நுட்பம், சுற்றுச்சூழல் நுண்ணறிவு கருவிகள்." },
      { title: "சட்டம் & நெறிமுறை தொழில்நுட்பம்",   desc: "சட்ட பகுத்தறிவு தளங்கள், நெறிமுறை கட்டமைப்பு கருவிகள், அரசியலமைப்பு பகுப்பாய்வு தொழில்நுட்பம்." },
      { title: "பயிற்சி & உத்வேக தொழில்நுட்பம்",    desc: "உந்துதல் பயிற்சி தளங்கள், தலைமை வளர்ச்சி கருவிகள், உத்வேகமான உள்ளடக்க தொழில்நுட்பம்." },
    ],
    dashaThemes: [
      "அழகியலில் பிறப்பு — சுக்கிர ஆரம்பம், தாராளமான தொடக்கம்",
      "முதல் தெளிவு — சூரியன் அடையாளம், தன்னுணர்வு",
      "உணர்வு அடித்தளங்கள் — சந்திர குடும்பம், உறவுகள்",
      "திசைப்பட்ட நெருப்பு — செவ்வாய் செயல்படுத்தல்",
      "உலக மேடை — ராகு விரிவு",
      "ராசி அதிபதி — தத்துவஞானியின் முழுமை — குரு தசை தனுசு ராசிக்கு",
      "நீண்ட ஒழுக்கம் — சனி நேர்மை மற்றும் எளிமை",
      "இறுதி நுண்ணறிவு — புதன் இறுதி",
    ],
    dashaDetails: [
      {
        expect: "பூராடம் சுக்கிர தசையில் தொடங்குகிறது — அசாதாரண அழகு, செழிப்பு, புலன் வளமையின் தொடக்கம். சுக்கிரன் முழுச் சுழற்சியிலும் மிக நீண்ட தசை; பிறக்கும்போது மீதமுள்ள இருப்பு முதல் பாதத்தில் நீளமாகவும் நான்காம் பாதத்தில் குறுகியதாகவும் இருக்கும் — இந்த தசைக்குக் காட்டப்படும் வரம்பு அதைச் சொல்கிறது. குழந்தைப் பருவச் சூழல் பொதுவாக அழகியல் தரத்தைக் கொண்டிருக்கும்: இசை, கலை, அழகு, கருத்துகளின் இன்பம் ஆகியவை ஆரம்ப ஆண்டுகளிலிருந்தே கிடைக்கின்றன. இருப்பு பள்ளிக் காலத்தை எட்டினால், உண்மையான பரந்த அறிவு கொண்ட மாணவர் உருவாகிறார் — மிகுந்த ஒழுக்கமுள்ளவர் என்று அவசியமில்லை, எனினும் தொடர்ந்து மிகவும் ஊக்கமளிப்பவர்; கற்றல் கட்டாயமல்ல ஒரு சாகசம் என்று பிறருக்கு உணர்த்துபவர். வளரிளம் பருவம் வரை நீண்டால் ஆரம்பகாலக் காதல், படைப்பு ஆர்வங்கள் மலர்கின்றன; முதல் தீவிர அழகியல் ஆர்வம் — இசை, எழுத்து, காட்சிக் கலை, நிகழ்த்துகலை — இந்த கட்டத்தில் பெரும்பாலும் படிகமாகிறது. சுக்கிர–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்; இருப்பு குறைவாக இருந்தால் அது பிறப்புக்கு முன்பே வந்துவிடும்) ஒளிரும் சாளரத்தில் ராசி அதிபதியின் இருப்பைக் கொண்டுவருகிறது — இது பிறப்புக்குப் பின் வருமானால், குழந்தைப் பருவச் சூழலுக்கு தத்துவ அல்லது ஆன்மீகத் தரத்தைச் சேர்க்கிறது.",
        navigate: "இளம் பூராடத்திற்கு சுக்கிரனின் முதன்மைச் சவால் அழகின் வசதி — இயல்பாகவே அழகியலும் விரிவும் நிறைந்த சூழலில் வளரும் குழந்தை, கட்டமைக்கப்பட்ட கற்றலின் எளிமையும் ஒழுக்கமும் அதிர்ச்சி தருவதாகக் காணலாம். உண்மையான தத்துவ அர்ப்பணிப்பைத் தூண்டும் தனுசு நெருப்பு சுக்கிர தசையில் இன்னும் முழுமையாகப் பற்றவில்லை; விளைவு ஆழமில்லாத அகலம், முடிவில்லாத உற்சாகமாக இருக்கலாம். சுக்கிர–குரு புக்தி ஒரு ராசி அதிபதி அடையாளம்; இது பிறப்புக்குப் பின் வருமானால், குழந்தைப் பருவத்தில் வருகிறது.",
        focus: "வெள்ளிக்கிழமை லட்சுமி மற்றும் சரஸ்வதி வழிபாடு. முடித்துவைக்கும் தன்மையை கவனமாக வளர்க்கவும். சுக்கிர தசையில் நுழையும் முதல் பெரிய அன்பு — ஒரு பாடம், கலை வடிவம், ஒரு நபர் — முழு வாழ்க்கை முழுவதும் எதிரொலிக்கும்.",
      },
      {
        expect: "சூரிய தசைக்கு பாதத்தைப் பொறுத்து இரண்டு முகங்கள். பிந்தைய பாதங்களில் இது குழந்தைப் பருவத்தில் தொடங்கி பள்ளிக் காலம் முழுவதும் நீண்டு, சுக்கிரனின் விரிந்த தொடக்கத்துக்கு தன்னைப் பற்றிய முதல் குவிந்த உணர்வைக் கொண்டுவருகிறது. முதல் பாதத்தில், பள்ளி வாழ்வு வயது வந்த வாழ்வாக மாறும் தருணத்தில் வருகிறது: பல்கலைக்கழகம் முடிவது, முதல் தொழில் அடிகள், அடையாள ஒருங்கிணைப்பு ஆகியவை அதன் மைய நாடகங்கள். சுக்கிர தசையில் கருவான தத்துவ இலட்சியவாதம் இப்போது தேர்ந்தெடுக்க வேண்டிய ஒழுக்கத்தைச் சந்திக்கிறது: எந்த நோக்கு, எந்தத் தொழில், எந்த வாழ்க்கை? இந்தத் தேர்விலிருந்து வரும் சூரியத் தெளிவு — தேர்வு கடினமாக இருந்தாலும் — பூராடத்தின் தம் சொந்த உறுதியைப் பற்றிய முதல் உண்மை அனுபவம்.",
        navigate: "பூராடத்திற்கு சூரியனின் முதன்மைச் சவால், ஒற்றைக் கவனம் கோரும் சூரியனுக்கும் தனுசு–சுக்கிரனின் அகல ஆசைக்கும் இடையிலான மோதல். எல்லாவற்றையும் படிக்கவும் அனுபவிக்கவும் விரும்பும் நபர், சூரிய தசையில் ஏதோ ஒன்றாக மாற வேண்டிய ஆக்கபூர்வமான கட்டுப்பாட்டைக் காண்கிறார். சூரிய–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) குலைவையும் எதிர்பாராத திசை மாற்றங்களையும் கொண்டுவரலாம்.",
        focus: "ஞாயிற்றுக்கிழமை சூரிய வழிபாடு மற்றும் மிகவும் முக்கியமான தொழில்முறை அல்லது தத்துவ அர்ப்பணத்தில் நீடித்த கவனம் வளர்க்கவும். சூரிய தசையில் உருவாகும் அடையாளம் — பின்வரும் தசைகளில் திருத்தப்படலாம் என்றாலும் — பூராடத்தின் பிற்கால ஞானம் திரளும் முதுகெலும்பாகிறது.",
      },
      {
        // Marriage: the astrologer's ruled sentence, verbatim (owner rulings, fourth round). Do not reword.
        expect: "சந்திர தசை பாதத்தைப் பொறுத்து மிகவும் வேறுபட்ட வயதுகளில் வருகிறது — பிந்தைய பாதங்களில் வளரிளம் பருவத்தில், முதல் பாதத்தில் இளம் வயது வந்த காலத்திலும் அதற்கு அப்பாலும். இது பூராடத்தின் மற்றபடி தத்துவ, அழகியல் இயல்புக்கு உணர்வு ஆழத்தையும் உறவு வளமையையும் கொண்டுவருகிறது. இந்தத் தசைக்குள் திருமணம் அமைந்தால், அது ஜாதகத்தின் ஏழாம் வீட்டையும் அதன் அதிபதியையும் கொண்டு பார்க்கப்படுகிறது; சுக்கிரனும் குருவும் அதன் இயல்பான காரகர்கள். அது ஒரு நிலையான காலம் அல்ல, ஒரு போக்கே. இது வயது வந்த வாழ்வில் வருமானால், குழந்தைகள் வரலாம்; பூராடம் பல தசகங்களாகப் போஷிக்கும் குடும்ப அடித்தளம் வேர்விடலாம். சந்திர தசை முழுவதும் தொழில் வளர்ச்சி தொடர்கிறது; பூராடத்தின் மிகத் தனித்துவமான தொழில் கொடைகளான ஊக்குவிக்கும், கற்பிக்கும் ஆற்றல்கள் உணர்வு நுண்ணறிவு ஆழமாகும்போது தங்கள் மிகச் செயல்திறன் வாய்ந்த வெளிப்பாட்டைக் காணத் தொடங்குகின்றன.",
        navigate: "பூராடத்திற்கு சந்திரனின் முதன்மைச் சவால், உணர்வு வரம்புடனான சந்திப்பு — தன்னுடையதும் பிறருடையதும். அதன் ஆழ்ந்த இயல்பான விரிந்த நம்பிக்கை, சந்திர தசையில் உணர்வு வாழ்வை எப்போதும் விரிவாக்கவோ தத்துவ ரீதியாக மறுவடிவமைக்கவோ முடியாது என்ற யதார்த்தத்தைச் சந்திக்கிறது. சந்திர–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ராசி அதிபதியின் இருப்புடன் கூடிய அரவணைப்பான துணைக் காலம் — விரிந்த, ஞானமுள்ள, ஒருவேளை திருப்புமுனையான தனிப்பட்ட அல்லது தொழில்முறைத் தருணம்.",
        focus: "திங்கட்கிழமை சந்திர வழிபாடும், தத்துவ மறுவடிவமைப்பு இல்லாமல் உணர்வு இருப்பை வேண்டுமென்றே வளர்ப்பதும். சந்திர–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு ராசி அதிபதி அடையாளம்: சந்திரனின் உணர்வுக் களத்தில் குரு தத்துவ எளிமை, விரிந்த உறவு ஆற்றல், அல்லது முக்கியமான தனிப்பட்ட ஞானத்தின் தருணமாக வருகிறார்.",
      },
      {
        expect: "செவ்வாய் தசை பூராடத்தின் இலட்சியவாதத்தை திசைப்பட்ட செயலால் பற்றவைக்கிறது; பிந்தைய பாதங்களில் இளம் வயது வந்த காலத்திலும், முதல் பாதத்தில் நடுவயதை நெருங்கியும் வருகிறது. தத்துவ தரிசனமும் ஊக்குவிக்கும் இருப்பும் இப்போது தீர்க்கமான செயல்படுத்தலின் ஆற்றலைச் சந்திக்கின்றன — நிறுவனங்களைக் கட்டத் தொடங்கும் ஊக்கமுள்ள ஆசிரியர், முக்கிய படைப்பை முடிக்கும் தத்துவ எழுத்தாளர், வரையறுக்கும் திட்டத்தைத் தொடங்கும் படைப்பு இயக்குநர். தனுசில் செவ்வாயின் நெருப்பு தத்துவ-போர்வீரனின் நெருப்பு: நிலத்துக்காகப் போரிடும் வீரன் அல்ல, கருத்துகளுக்காக, உயர் சாத்தியங்களுக்காக, மற்றவர்கள் இன்னும் காணாத தொலைநோக்குக்காகப் போரிடுபவன். செவ்வாய் தசையின் தொழில்முறைச் சாதனைகள் பொதுவாக வெல்ல முடியாத தன்மை கொண்டவை — தடைகளை அப்ஸ் தெய்வத்தின் பொறுமையான, விடாப்பிடியான, தகவமைக்கும் முன்னேற்றத்துடன் சந்திக்கின்றன.",
        navigate: "பூராடத்திற்கு செவ்வாயின் முதன்மைச் சவால் பொறுமையின்மை — தன் நோக்குக்கான திசைப்பட்ட நெருப்பை இறுதியாகக் கண்டுபிடித்த ஊக்கமுள்ள நபர், செயல்படுத்தலுக்கு உண்மையில் தேவைப்படும் நேரத்தைச் சகிக்காதவராகலாம். வெல்ல முடியாத முன்னேற்றமும் எடுத்துக்கொள்ளும் நேரத்தை எடுத்துக்கொள்கிறது என்ற யதார்த்தத்தை பூராடத்தின் நம்பிக்கை சந்திக்கிறது. செவ்வாய்–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) சுருக்கமான ஆனால் முக்கியமான ராசி அதிபதி இருப்பைக் கொண்டுவருகிறது — செவ்வாயின் செயலில் களத்தில் தத்துவ மிதப்படுத்தி.",
        focus: "செவ்வாய்க்கிழமை செவ்வாய் சன்னதி வழிபாடு. செவ்வாய்–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு ராசி அதிபதி அடையாளம்: திசைப்பட்ட நெருப்பு பெரிய நோக்குக்குச் சேவை செய்வதை உறுதிசெய்யும் தத்துவ ஞானமும் விரிந்த கண்ணோட்டமுமாக, செவ்வாயின் திசைப்பட்ட களத்தில் குரு வருகிறார்.",
      },
      {
        expect: "ராகு தசை பூராடத்தின் நோக்கையும் ஊக்குவிக்கும் இருப்பையும் மிகப் பரந்த அரங்குக்குக் கொண்டுவருகிறது; பிந்தைய பாதங்களில் இளம் வயது வந்த காலத்திலும், முதல் பாதத்தில் நடுவயதிலும் தொடங்குகிறது. சர்வதேச அங்கீகாரம், பண்பாடுகளுக்கிடையிலான பணி, பிறந்த பண்பாட்டுக்கு அப்பாற்பட்ட கருத்துகள், மரபுகளுடன் சந்திப்பு ஆகியவை ராகுவின் நீண்ட காலத்தின் தனித்துவ அனுபவங்கள். தனுசின் தத்துவ அகலமும் சுக்கிரனின் அழகியல் அருளும் ராகு தசையில் தாம் நோக்கி வளர்ந்த பெருக்கும் களத்தைக் காண்கின்றன. கற்பித்தல், எழுத்து, தலைமை, பூராடம் சுமக்கும் உயர் நோக்கின் கடத்தல் ஆகியவை இந்த காலத்தில் தங்கள் மிக அகலமான எல்லையை எட்டுகின்றன. நிதிச் செழிப்பும் பொதுவாக ராகு தசையில் உச்சமடைகிறது — சுக்கிரனின் செழிப்பு உள்ளுணர்வும் ராகுவின் விரிந்த பசியும் இணைவது குறிப்பிடத்தக்க பொருள் பலன்களைத் தருகிறது.",
        navigate: "பூராடத்திற்கு ராகுவின் முதன்மைச் சவால், நம்பிக்கையை அதன் உண்மையான திறனுக்கு அப்பால் பெருக்குவது — உண்மையான ஆன்மீக அணுகுமுறையாகச் செயல்படும் வெல்ல முடியாத மனப்பான்மை, உண்மையான எல்லைகளை ஒப்புக்கொள்ள மறுப்பதாக மாறுவது. நீரின் தகவமைக்கும் ஓட்டம், பாதையைக் காணும் முன் தடைகளின் இருப்பை ஒப்புக்கொள்ளக் கோருகிறது. ராகு–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) முக்கிய தத்துவ, ஆன்மீக அல்லது ஞான மரபு ஆழமாதலின் சாளரம்.",
        focus: "சனிக்கிழமை ராகு சன்னதி வழிபாடும், அறிவுப் பணிவை வேண்டுமென்றே வளர்ப்பதும் — பூராடத்தின் வெல்ல முடியாத நம்பிக்கைக்கும் எல்லைகள் உண்டு என்ற ஒப்புதல். ராகு–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) ஒரு முக்கிய ராசி அதிபதி அடையாளம்: ராகுவின் விரிந்த களத்தில், முழு ராகு தசையிலும் மிகவும் குறிப்பிடத்தக்க தத்துவ, ஆன்மீக, ஞான ஆழமாதல் துணைக் காலமாக குரு வருகிறார்.",
      },
      {
        expect: "வாழ்வின் இரண்டாம் பாதியில் வரும் குரு தசை பூராடத்திற்கு ராசி அதிபதியின் வருகை — உங்கள் ராசியான தனுசை ஆளும் கிரகம் இப்போது உங்கள் தசையை நிர்வகிக்கிறது. தத்துவ விரிவு, அழகியல் அருள், ஊக்குவிக்கும் இருப்பு, வெல்ல முடியாத நம்பிக்கை ஆகியவற்றால் முழு வாழ்வும் இயக்கப்பட்ட பூராட ஜாதகருக்கு, குரு தசை முழுமை — வாழ்ந்த வாழ்வின் அகலமும் அழகும் உண்மையான அனுபவத்தின் அதிகாரத்துடன் கடத்தப்படக்கூடிய காலம். பேரக்குழந்தைகள் ஆசிரியர்களின் ஆசிரியரைப் பெறுகிறார்கள். ராகு தசையில் பூராடம் கட்டிவந்த தத்துவ, ஆன்மீக நிறுவனங்கள் இப்போது தங்கள் முதிர்ந்த கட்டத்துக்குள் நுழைகின்றன. இப்போது அவை உண்மையாக வாழ்ந்த வாழ்வின் முழுமையால் அறிவூட்டப்பட்டிருப்பதால், எழுத்தும் கற்பித்தலும் முந்தைய பணி — எவ்வளவு ஊக்கமளித்ததாயினும் — எட்ட முடியாத கடத்தல் தரத்தை அடைகின்றன.",
        navigate: "ராசி அதிபதி தசையில் குருவின் முதன்மையான நிழல் ஆசிரியரின் தத்துவப் பெருக்கம் — பல தசகங்களாகத் தன் பார்வை அங்கீகரிக்கப்பட்டவர், எந்த ஒரு வடிவத்தையும் கடந்து நிற்கும் உண்மையின் ஊக்கமிக்க ஒரு வெளிப்பாடாக அல்லாமல், தன் பார்வையே இறுதியான பார்வை என்று நம்பத் தொடங்குவது. அபஸ் தெய்வத்தின் பணிவு — நிலப்பரப்பு தனக்கு இடமளிக்க வேண்டும் என்று கோராமல், ஓடுவதன் மூலமே சேவை செய்யும் நீர் — இதற்கு முறிவு மருந்து. உடல் பராமரிப்பும் பிற்கால வாழ்வின் வேண்டுமென்ற எளிமையும் முக்கியம்.",
        focus: "வியாழக்கிழமை பிரஹஸ்பதி மற்றும் தட்சிணாமூர்த்தி வழிபாடு. குரு தசை வாழ்க்கை கட்டியிருந்த முழுமை; தத்துவ பார்வையை சுதந்திரமாக கொடுங்கள், சூத்திரங்களை லேசாக வைத்திருங்கள்.",
      },
      {
        expect: "முதிர்ந்த வயதில் வரும் சனி தசை பூராடத்தின் மற்றபடி விரிந்த, நம்பிக்கையான வாழ்வுக்கு காலம் மற்றும் வரம்பின் மாபெரும் ஒழுக்கத்தைக் கொண்டுவருகிறது. குரு தசையின் தத்துவ முழுமைக்குப் பிறகு, சனி எளிமையை வலியுறுத்துகிறது: நீண்ட வாழ்வில் எஞ்சியிருக்கும் ஒற்றை உறவு, ஒற்றைப் பயிற்சி, ஒற்றை உண்மை. கற்பதற்கு உண்மையில் திறந்திருந்தவர்களுக்கு, சனி தசை வாழ்வின் மிக நேர்மையான காலம் — நிகழ்த்தப்பட்ட தத்துவ நம்பிக்கையில் எஞ்சியதை உரித்து, அடியிலுள்ள உண்மையான சமநிலையை விட்டுச்செல்லும் ஒழுக்கம்.",
        navigate: "முழுமையான, மென்மையான உடல் பராமரிப்பு. இந்த வயதில் சனியின் கோரிக்கைகள் இந்த நபரை நேசிப்பவர்களிடமிருந்து வேண்டுமென்றே, அர்ப்பணிப்புடன் கூடிய கவனத்தைக் கோருகின்றன. இந்த தசையை நிறைவு செய்யும் சனி–குரு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) சனியின் ஒழுக்கமான பிற்கால களத்தில் ராசி அதிபதியைக் கொண்டுவருகிறது.",
        focus: "சனி தசை நீண்ட ஒழுக்கம் — தோற்கடிக்க முடியாத நம்பிக்கை உண்மையானதா அல்லது நிகழ்த்தப்பட்டதா என்று நிரூபிக்கிறது. உண்மையான பூராடத்துக்கு, பதில் தெளிவாக உள்ளது.",
      },
      {
        expect: "மிக முதிர்ந்த வயதில் வரும் புதன் தசையை அசாதாரணமாகச் சில பூராட ஆத்மாக்கள் மட்டுமே அடைகின்றன. வருபவர்களுக்கு, புதன் மனதின் திறனுக்கான இறுதித் திரும்புதலைக் கொண்டுவருகிறார் — தெளிவாக வெளிப்படுத்தும் நுண்ணறிவு, மொழியின் துல்லியம் — அடிப்படை எளிமையின் சூழலில்.",
        navigate: "முழுமையான, அர்ப்பணிப்புடன் கூடிய உடல் பராமரிப்பு. இந்த மிக முதிர்ந்த வயதில் புதன் என்பது புரிதலின் கூர்மையின் கொடை — பல தசகங்களாகத் தத்துவ ஈடுபாட்டால் மெருகேறிய மனம்.",
        focus: "புதன்கிழமை புதன் வழிபாடும், இந்த நபர் பேசுவதைக் கேட்க விரும்புபவர்களின் இருப்பும். சுக்கிரனால் மெருகேறிய நாவும் தனுசின் தத்துவ தரிசனமும் நீண்ட வாழ்வில் காய்ச்சி வடிக்கப்பட்டு, எளிமையாகவும் மறக்க முடியாத வகையிலும் பேசுகின்றன.",
      },
    ],
    spirituality: [
      { title: "அபஸ் (நீர்) வழிபாடு & நீர் சடங்குகள்",  desc: "அபஸ் — தெய்வீக நீர், சுத்திகரிக்கும் மற்றும் ஊட்டமளிக்கும் சக்தி — பூராடத்தின் தலைமை தெய்வம். நீர் சடங்குகள் (ஜலாபிஷேகம்), புனித நதிகளுக்கு காணிக்கைகள், மற்றும் புனித நீரில் நீராடும் ஆன்மீக அனுஷ்டானம் மிகவும் ஆழமான வெளிப்பாடுகளில் ஒன்று. ரிக்வேதத்தில் இருந்து அபஸ் சூக்தம் மிகவும் ஒத்திசையும் வேதப் பகுதி." },
      { title: "குரு & குரு பக்தி",                       desc: "பிரஹஸ்பதி–குரு வம்சம் — வியாழக்கிழமை குரு பூஜை, தட்சிணாமூர்த்தி வழிபாடு, மற்றும் வாழும் குரு அல்லது ஞான மரபுடன் பக்தி உறவு — பூராட வாழ்க்கையின் மையமான ஆன்மீக திசைவிடுகை." },
      { title: "தத்துவமாக பக்தி",                         desc: "பூராடத்துக்கு, தத்துவ வாழ்க்கை — இறுதியில் உண்மையானது மற்றும் நன்மையானது என்ன என்பதற்கான உண்மையான, நீடித்த விசாரணை — பக்திப் பயிற்சியிலிருந்து தனியானதல்ல; அதுவே மிக உயர்ந்த பக்திப் பயிற்சி. கீதை, உபநிடதங்கள் இயற்கையான ஆன்மீக ஆய்வு." },
    ],
    guidance: "ஆரம்ப வெற்றி இறுதி வெற்றி அல்ல — நிலப்பரப்பு கஷ்டமாக இருந்தாலும், முந்தைய புரிதல் கரைக்கப்பட்டிருந்தாலும், நீங்கள் தொடங்கியபோது தோன்றியதை விட இலக்கு தொலைவில் இருந்தாலும், முன்னால் தொடர்ந்து நகரும் வெற்றி. நீரின் தோற்கடிக்க முடியாத தன்மை பாறையின் தோற்கடிக்க முடியாத தன்மை அல்ல ஆனால் ஆற்றின் — எப்போதும் நிற்காமல் நகர்வதால் அது வழி காண்கிறது. நீங்கள் சுமக்கும் தத்துவ பார்வை கொடுக்கப்பட கொடுக்கப்பட்ட கொடை — தாராளமாக அதை வைத்திருங்கள் மற்றும் சுதந்திரமாக கொடுங்கள், மற்றும் கொடுப்பது வைத்திருப்பது வழங்கக்கூடியதை எப்போதும் மீறும்.",
    careerNote: "தத்துவ அகலம், அழகியல் நளினம், உந்துதல் இருப்பு மற்றும் அத்தியாவசிய பார்வையை பராமரிக்கும் போது தகவமைக்கும் திறன் ஆகியவற்றின் கலவை மையத் தேவைகளாக இருக்கும் இடங்களில் பூராடம் சிறப்பாக செயல்படுகிறது.",
    modernLead: "பூராடத்தின் பாரம்பரிய குணங்கள் இன்றைய வாய்ப்புகளில் எவ்வாறு வெளிப்படுகின்றன.",
    familyLead: "தோற்கடிக்க முடியாத நம்பிக்கை, தத்துவ விரிவாக்கம், சுக்கிர-மெருகு அழகு பூராடத்தின் உறவுகளை வடிவமைக்கின்றன.",
  },
};

export default function PurvaAshadhaVisualPage() {
  return <NatchathiramVisualContent data={PURVA_ASHADHA} visual={PURVA_ASHADHA_VISUAL} timings={dasaTimingsFor(PURVA_ASHADHA.number)} />;
}
