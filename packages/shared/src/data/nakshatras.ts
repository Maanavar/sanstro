export interface NakshatraEntry {
  number: number;
  slug: string;
  name: { ta: string; en: string };
  symbol: string;
  deity: { ta: string; en: string };
  planet: { ta: string; en: string };
  qualities: { ta: string; en: string }[];
  description: { ta: string; en: string };
  compatibility: { ta: string; en: string };
}

export const NAKSHATRA_DATA: NakshatraEntry[] = [
  {
    number: 1, slug: "ashwini",
    name: { ta: "அஸ்வினி", en: "Aswini" }, symbol: "🐴",
    deity: { ta: "அஸ்வினி தேவர்கள்", en: "Ashwini Kumaras" },
    planet: { ta: "கேது", en: "Ketu" },
    qualities: [{ ta: "வேகம்", en: "Speed" }, { ta: "குணமாக்கும் சக்தி", en: "Healing" }, { ta: "தொடக்கம்", en: "Initiative" }],
    description: {
      ta: "அஸ்வினி முதல் நட்சத்திரம். வேகம், குணமாக்கும் சக்தி மற்றும் புதிய தொடக்கங்களை குறிக்கிறது. அஸ்வினி குமாரர்கள் இதன் தெய்வங்கள்.",
      en: "Ashwini is the first nakshatra, symbolised by a horse's head. It represents speed, healing, and new beginnings. Ruled by the divine Ashwini Kumaras, celestial physicians.",
    },
    compatibility: { ta: "சதயம், ஆயில்யம் உடன் சிறந்த பொருத்தம்", en: "Best with Shatabhisha and Ashlesha" },
  },
  {
    number: 2, slug: "bharani",
    name: { ta: "பரணி", en: "Bharani" }, symbol: "🔺",
    deity: { ta: "யமன்", en: "Yama" },
    planet: { ta: "சுக்கிரன்", en: "Venus" },
    qualities: [{ ta: "நிர்வாகம்", en: "Restraint" }, { ta: "ஆக்கம்", en: "Creativity" }, { ta: "மாற்றம்", en: "Transformation" }],
    description: {
      ta: "பரணி இரண்டாம் நட்சத்திரம். யமனால் ஆளப்படுகிறது. ஆக்கம், நிர்வாகம் மற்றும் மாற்றத்தை குறிக்கிறது.",
      en: "Bharani, the second nakshatra, is ruled by Yama, god of death and dharma. It represents the cycle of creation, preservation, and transformation.",
    },
    compatibility: { ta: "ரோகிணி, அனுஷம் உடன் சிறந்தது", en: "Best with Rohini and Anuradha" },
  },
  {
    number: 3, slug: "krittika",
    name: { ta: "கார்த்திகை", en: "Karthigai" }, symbol: "🔥",
    deity: { ta: "அக்னி", en: "Agni" },
    planet: { ta: "சூரியன்", en: "Sun" },
    qualities: [{ ta: "வலிமை", en: "Power" }, { ta: "துணிவு", en: "Courage" }, { ta: "சுத்திகரிப்பு", en: "Purification" }],
    description: {
      ta: "கார்த்திகை ஒளி மற்றும் வலிமையின் நட்சத்திரம். அக்னி தெய்வமாக இருக்கிறார். கடினமான முடிவெடுக்கும் திறன் இதன் சிறப்பு.",
      en: "Krittika, the third nakshatra, is associated with fire (Agni) and the Pleiades star cluster. It bestows sharpness, courage, and the power to purify.",
    },
    compatibility: { ta: "விசாகம், ஹஸ்தம் உடன் பொருந்தும்", en: "Compatible with Vishakha and Hasta" },
  },
  {
    number: 4, slug: "rohini",
    name: { ta: "ரோகிணி", en: "Rohini" }, symbol: "🐂",
    deity: { ta: "பிரம்மா", en: "Brahma" },
    planet: { ta: "சந்திரன்", en: "Moon" },
    qualities: [{ ta: "அழகு", en: "Beauty" }, { ta: "செழிப்பு", en: "Fertility" }, { ta: "படைப்பு", en: "Creativity" }],
    description: {
      ta: "ரோகிணி சந்திரனின் மிகவும் விரும்பிய நட்சத்திரம். அழகு, வளம் மற்றும் படைப்பு சக்தியின் அடையாளம்.",
      en: "Rohini, the Moon's favourite nakshatra, represents growth, beauty, and material abundance. The Moon is exalted here, making it a highly auspicious star.",
    },
    compatibility: { ta: "மிருகசீரிடம், உத்திரம் உடன் சிறந்தது", en: "Best with Mrigashira and Uttara Phalguni" },
  },
  {
    number: 5, slug: "mrigashira",
    name: { ta: "மிருகசீரிடம்", en: "Mirugaseeridam" }, symbol: "🦌",
    deity: { ta: "சோமன்", en: "Soma" },
    planet: { ta: "செவ்வாய்", en: "Mars" },
    qualities: [{ ta: "தேடல்", en: "Search" }, { ta: "அறிவு", en: "Intellect" }, { ta: "மென்மை", en: "Gentleness" }],
    description: {
      ta: "மிருகசீரிடம் தேட்டம் மற்றும் கண்டுபிடிப்பின் நட்சத்திரம். மான் தலையால் குறிக்கப்படுகிறது. அமைதியான மனசு இதன் சிறப்பு.",
      en: "Mrigashira, symbolised by a deer's head, is the nakshatra of seeking, exploration, and gentle intellect. It brings curiosity and a love of beauty.",
    },
    compatibility: { ta: "ரோகிணி, சித்திரை உடன் பொருந்தும்", en: "Compatible with Rohini and Chitra" },
  },
  {
    number: 6, slug: "ardra",
    name: { ta: "திருவாதிரை", en: "Thiruvathirai" }, symbol: "💎",
    deity: { ta: "ருத்திரன்", en: "Rudra" },
    planet: { ta: "ராகு", en: "Rahu" },
    qualities: [{ ta: "மாற்றம்", en: "Transformation" }, { ta: "புரட்சி", en: "Revolution" }, { ta: "ஆழமான சிந்தனை", en: "Deep thought" }],
    description: {
      ta: "திருவாதிரை嵐 மற்றும் மாற்றத்தின் நட்சத்திரம். ருத்திரன் ஆட்சியாளன். இது முழுமையான மறுமலர்ச்சியை தருகிறது.",
      en: "Ardra, the nakshatra of the storm, represents radical change and emotional intensity. Ruled by Rudra, it brings both destruction and renewal.",
    },
    compatibility: { ta: "புனர்பூசம், சதயம் உடன் சிறந்தது", en: "Best with Punarvasu and Shatabhisha" },
  },
  {
    number: 7, slug: "punarvasu",
    name: { ta: "புனர்பூசம்", en: "Punarpoosam" }, symbol: "🏹",
    deity: { ta: "அதிதி", en: "Aditi" },
    planet: { ta: "குரு", en: "Jupiter" },
    qualities: [{ ta: "புதுப்பித்தல்", en: "Renewal" }, { ta: "நன்மை", en: "Benevolence" }, { ta: "வீடு திரும்பல்", en: "Homecoming" }],
    description: {
      ta: "புனர்பூசம் மீள்வரவின் நட்சத்திரம். அதிதி தெய்வம். சிறந்த ஆற்றல் மீட்பு மற்றும் நம்பிக்கை இதன் சிறப்பியல்புகள்.",
      en: "Punarvasu means 'return of light'. Ruled by Jupiter and governed by Aditi, this nakshatra bestows renewal, optimism, and material abundance after hardship.",
    },
    compatibility: { ta: "திருவாதிரை, பூசம் உடன் சிறந்தது", en: "Best with Ardra and Pushya" },
  },
  {
    number: 8, slug: "pushya",
    name: { ta: "பூசம்", en: "Poosam" }, symbol: "🌸",
    deity: { ta: "பிரகஸ்பதி", en: "Brihaspati" },
    planet: { ta: "சனி", en: "Saturn" },
    qualities: [{ ta: "ஊட்டமளித்தல்", en: "Nourishment" }, { ta: "அக்கறை", en: "Care" }, { ta: "வளம்", en: "Prosperity" }],
    description: {
      ta: "பூசம் அனைத்து நட்சத்திரங்களிலும் மிகவும் சாதகமானது என கருதப்படுகிறது. ஊட்டமளிக்கும் ஆற்றல் மற்றும் செழிப்பு இதன் அடையாளம்.",
      en: "Pushya is considered the most auspicious of all nakshatras. Ruled by Saturn and governed by Brihaspati, it symbolises nourishment, protection, and spiritual growth.",
    },
    compatibility: { ta: "ரோகிணி, ஹஸ்தம் உடன் மிகவும் சிறந்தது", en: "Excellent with Rohini and Hasta" },
  },
  {
    number: 9, slug: "ashlesha",
    name: { ta: "ஆயில்யம்", en: "Ayilyam" }, symbol: "🐍",
    deity: { ta: "நாகங்கள்", en: "Nagas" },
    planet: { ta: "புதன்", en: "Mercury" },
    qualities: [{ ta: "ஆழ்ந்த அறிவு", en: "Deep wisdom" }, { ta: "நுட்பம்", en: "Subtlety" }, { ta: "மாற்றம்", en: "Transformation" }],
    description: {
      ta: "ஆயில்யம் பாம்பின் நட்சத்திரம். ஆழமான அறிவு, ஆன்மீக சக்தி மற்றும் மாற்றத்தை குறிக்கிறது. புதன் இதன் ஆட்சியாளன்.",
      en: "Ashlesha, the serpent star, is associated with Nagas (serpent deities). It represents deep intuition, occult knowledge, and the transformative power of kundalini energy.",
    },
    compatibility: { ta: "அஸ்வினி, கேட்டை உடன் சிறந்தது", en: "Best with Ashwini and Jyeshtha" },
  },
  {
    number: 10, slug: "magha",
    name: { ta: "மகம்", en: "Magam" }, symbol: "👑",
    deity: { ta: "பித்ருக்கள்", en: "Pitrs (Ancestors)" },
    planet: { ta: "கேது", en: "Ketu" },
    qualities: [{ ta: "பெருமை", en: "Grandeur" }, { ta: "தலைமை", en: "Leadership" }, { ta: "மரபு", en: "Tradition" }],
    description: {
      ta: "மகம் அரசகுல நட்சத்திரம். பித்ருக்கள் (முன்னோர்கள்) இதன் தெய்வங்கள். மரபு, பெருமை மற்றும் தலைமை இதன் அடையாளம்.",
      en: "Magha, the royal nakshatra, is associated with the Pitrs (ancestral spirits). It bestows dignity, leadership, and a strong connection to lineage and tradition.",
    },
    compatibility: { ta: "உத்திரம், ஸ்வாதி உடன் பொருந்தும்", en: "Compatible with Uttara Phalguni and Swati" },
  },
  {
    number: 11, slug: "purva-phalguni",
    name: { ta: "பூரம்", en: "Pooram" }, symbol: "🛋️",
    deity: { ta: "பகன்", en: "Bhaga" },
    planet: { ta: "சுக்கிரன்", en: "Venus" },
    qualities: [{ ta: "இன்பம்", en: "Pleasure" }, { ta: "படைப்பாற்றல்", en: "Creativity" }, { ta: "ஆடம்பரம்", en: "Luxury" }],
    description: {
      ta: "பூரம் சந்தோஷம் மற்றும் இன்பத்தின் நட்சத்திரம். பகன் தெய்வம் ஆசீர்வாதங்களை வழங்குகிறார். கலை மற்றும் ஆடம்பரம் இதன் சிறப்பு.",
      en: "Purva Phalguni is the nakshatra of pleasure, rest, and creativity. Governed by Bhaga, the god of prosperity and marital bliss, it brings joy, artistry, and sensuality.",
    },
    compatibility: { ta: "உத்திரட்டாதி, பரணி உடன் சிறந்தது", en: "Best with Uttara Bhadra and Bharani" },
  },
  {
    number: 12, slug: "uttara-phalguni",
    name: { ta: "உத்திரம்", en: "Uthiram" }, symbol: "🛏️",
    deity: { ta: "ஆர்யமன்", en: "Aryaman" },
    planet: { ta: "சூரியன்", en: "Sun" },
    qualities: [{ ta: "நட்பு", en: "Friendship" }, { ta: "கடமை", en: "Duty" }, { ta: "உறவு", en: "Partnership" }],
    description: {
      ta: "உத்திரம் கடமை மற்றும் நட்பின் நட்சத்திரம். ஆர்யமன் தெய்வம். திருமண உறவுகள் மற்றும் சமூக பொறுப்புணர்வை குறிக்கிறது.",
      en: "Uttara Phalguni is the star of patronage and union. Ruled by Aryaman, god of contracts, it represents committed relationships, social duty, and service.",
    },
    compatibility: { ta: "ஹஸ்தம், மகம் உடன் சிறந்தது", en: "Best with Hasta and Magha" },
  },
  {
    number: 13, slug: "hasta",
    name: { ta: "ஹஸ்தம்", en: "Hastham" }, symbol: "✋",
    deity: { ta: "சவிதிர்", en: "Savitri" },
    planet: { ta: "சந்திரன்", en: "Moon" },
    qualities: [{ ta: "திறமை", en: "Skill" }, { ta: "கைத்தொழில்", en: "Craftsmanship" }, { ta: "நடைமுறை", en: "Practicality" }],
    description: {
      ta: "ஹஸ்தம் திறமை மற்றும் கைவினைப் பாடுபடுவதன் நட்சத்திரம். சூரியனின் சவிதிர் அம்சம் தெய்வமாக உள்ளது.",
      en: "Hasta, symbolised by an open hand, represents dexterity, skill, and the ability to manifest ideas into reality. Ruled by Moon, it blends practicality with intuition.",
    },
    compatibility: { ta: "ரோகிணி, பூசம் உடன் சிறந்தது", en: "Excellent with Rohini and Pushya" },
  },
  {
    number: 14, slug: "chitra",
    name: { ta: "சித்திரை", en: "Chithirai" }, symbol: "💎",
    deity: { ta: "விஷ்வகர்மா", en: "Vishwakarma" },
    planet: { ta: "செவ்வாய்", en: "Mars" },
    qualities: [{ ta: "அழகு", en: "Beauty" }, { ta: "கலை", en: "Artistry" }, { ta: "வடிவமைப்பு", en: "Design" }],
    description: {
      ta: "சித்திரை அழகு மற்றும் வடிவமைப்பின் நட்சத்திரம். விஷ்வகர்மா தெய்வம். கலைஞர்கள் மற்றும் வடிவமைப்பாளர்களுக்கு மிகவும் சாதகமானது.",
      en: "Chitra, the star of the brilliant jewel, is associated with Vishwakarma (divine architect). It bestows artistic brilliance, beauty, and the eye for perfection.",
    },
    compatibility: { ta: "விசாகம், மிருகசீரிடம் உடன் சிறந்தது", en: "Best with Vishakha and Mrigashira" },
  },
  {
    number: 15, slug: "swati",
    name: { ta: "சுவாதி", en: "Swathi" }, symbol: "🌱",
    deity: { ta: "வாயு", en: "Vayu" },
    planet: { ta: "ராகு", en: "Rahu" },
    qualities: [{ ta: "சுதந்திரம்", en: "Independence" }, { ta: "நெகிழ்வு", en: "Flexibility" }, { ta: "வளர்ச்சி", en: "Growth" }],
    description: {
      ta: "சுவாதி காற்றின் நட்சத்திரம். வாயு தெய்வம். சுதந்திரம், மெல்லிய வளர்ச்சி மற்றும் நெகிழ்வான தன்மை இதன் குணங்கள்.",
      en: "Swati, ruled by Vayu (wind god), symbolises independence, flexibility, and the ability to thrive under pressure like a blade of grass in the wind.",
    },
    compatibility: { ta: "அனுஷம், மகம் உடன் சிறந்தது", en: "Best with Anuradha and Magha" },
  },
  {
    number: 16, slug: "vishakha",
    name: { ta: "விசாகம்", en: "Visakam" }, symbol: "⚡",
    deity: { ta: "இந்திரன் & அக்னி", en: "Indra & Agni" },
    planet: { ta: "குரு", en: "Jupiter" },
    qualities: [{ ta: "நோக்கம்", en: "Purpose" }, { ta: "வெற்றி", en: "Achievement" }, { ta: "ஆர்வம்", en: "Ambition" }],
    description: {
      ta: "விசாகம் நோக்கத்தின் நட்சத்திரம். இந்திரன் மற்றும் அக்னி இரு தெய்வங்கள். குறிக்கோளை அடையும் வலிமை இதன் சிறப்பு.",
      en: "Vishakha, the nakshatra of purpose, is ruled by both Indra and Agni. It represents the drive to achieve goals, transforming ambition into tangible results.",
    },
    compatibility: { ta: "அனுஷம், சித்திரை உடன் சிறந்தது", en: "Best with Anuradha and Chitra" },
  },
  {
    number: 17, slug: "anuradha",
    name: { ta: "அனுஷம்", en: "Anusham" }, symbol: "🌸",
    deity: { ta: "மித்ரன்", en: "Mitra" },
    planet: { ta: "சனி", en: "Saturn" },
    qualities: [{ ta: "நட்பு", en: "Friendship" }, { ta: "பக்தி", en: "Devotion" }, { ta: "ஒத்துழைப்பு", en: "Cooperation" }],
    description: {
      ta: "அனுஷம் நட்பு மற்றும் ஒத்துழைப்பின் நட்சத்திரம். மித்ரன் தெய்வம். உறவுகளில் ஆழமான பிணைப்பை உருவாக்கும் ஆற்றல் இதன் சிறப்பு.",
      en: "Anuradha, governed by Mitra (god of friendship), represents loyalty, devotion, and the ability to build deep, lasting bonds with others.",
    },
    compatibility: { ta: "விசாகம், ஜேஷ்டா உடன் சிறந்தது", en: "Best with Vishakha and Jyeshtha" },
  },
  {
    number: 18, slug: "jyeshtha",
    name: { ta: "கேட்டை", en: "Kettai" }, symbol: "🛡️",
    deity: { ta: "இந்திரன்", en: "Indra" },
    planet: { ta: "புதன்", en: "Mercury" },
    qualities: [{ ta: "வலிமை", en: "Strength" }, { ta: "பாதுகாப்பு", en: "Protection" }, { ta: "தலைமை", en: "Authority" }],
    description: {
      ta: "கேட்டை அதிகாரம் மற்றும் பாதுகாப்பின் நட்சத்திரம். இந்திரன் தெய்வம். பழைய ஆட்சி அனுபவம் மற்றும் தலைமைத்துவ குணம் இதன் சிறப்பு.",
      en: "Jyeshtha, the eldest nakshatra, is ruled by Indra (king of gods). It represents authority, seniority, and the responsibility to protect those in one's care.",
    },
    compatibility: { ta: "அனுஷம், ஆயில்யம் உடன் சிறந்தது", en: "Best with Anuradha and Ashlesha" },
  },
  {
    number: 19, slug: "mula",
    name: { ta: "மூலம்", en: "Moolam" }, symbol: "🌿",
    deity: { ta: "நிர்ருதி", en: "Nirriti" },
    planet: { ta: "கேது", en: "Ketu" },
    qualities: [{ ta: "வேர் தேடல்", en: "Root seeking" }, { ta: "ஆய்வு", en: "Investigation" }, { ta: "மாற்றம்", en: "Dissolution" }],
    description: {
      ta: "மூலம் வேர்களின் நட்சத்திரம். நிர்ருதி தெய்வம். ஆழமான உண்மைகளை கண்டறியும் தேட்டம் மற்றும் பழைய கட்டமைப்புகளை இடிக்கும் ஆற்றல் இதன் சிறப்பு.",
      en: "Mula, symbolised by roots tied together, is associated with uncovering deep truths. Ruled by Ketu and Nirriti, it represents dissolution of the old to make room for the new.",
    },
    compatibility: { ta: "ஆயில்யம், திருவோணம் உடன் சிறந்தது", en: "Best with Ashlesha and Shravana" },
  },
  {
    number: 20, slug: "purva-ashadha",
    name: { ta: "பூராடம்", en: "Pooradam" }, symbol: "🪭",
    deity: { ta: "ஆபஸ்", en: "Apas" },
    planet: { ta: "சுக்கிரன்", en: "Venus" },
    qualities: [{ ta: "சுத்திகரிப்பு", en: "Purification" }, { ta: "அழகு", en: "Beauty" }, { ta: "உத்வேகம்", en: "Invigoration" }],
    description: {
      ta: "பூராடம் ஆற்றல் மற்றும் சுத்திகரிப்பின் நட்சத்திரம். தண்ணீர் தெய்வமான ஆபஸ் இதன் ஆட்சியாளர்.",
      en: "Purva Ashadha, ruled by Apas (water deity), represents purification, invigoration, and the beauty of flowing water. It bestows pride, strength, and an independent spirit.",
    },
    compatibility: { ta: "உத்திராடம், பரணி உடன் சிறந்தது", en: "Best with Uttara Ashadha and Bharani" },
  },
  {
    number: 21, slug: "uttara-ashadha",
    name: { ta: "உத்திராடம்", en: "Uthiradam" }, symbol: "⚔️",
    deity: { ta: "விஸ்வதேவர்கள்", en: "Vishvadevas" },
    planet: { ta: "சூரியன்", en: "Sun" },
    qualities: [{ ta: "வெற்றி", en: "Victory" }, { ta: "நீதி", en: "Justice" }, { ta: "நிரந்தரம்", en: "Permanence" }],
    description: {
      ta: "உத்திராடம் நிரந்தர வெற்றியின் நட்சத்திரம். விஸ்வதேவர்கள் (உலக தெய்வங்கள்) இதன் ஆட்சியாளர்கள். உண்மையான வெற்றி மற்றும் நீதியை குறிக்கிறது.",
      en: "Uttara Ashadha, the star of 'later victory', is associated with unshakeable victory and justice. Ruled by Vishvadevas, it represents achievements that stand the test of time.",
    },
    compatibility: { ta: "திருவோணம், பூராடம் உடன் சிறந்தது", en: "Best with Shravana and Purva Ashadha" },
  },
  {
    number: 22, slug: "shravana",
    name: { ta: "திருவோணம்", en: "Thiruvonam" }, symbol: "👂",
    deity: { ta: "விஷ்ணு", en: "Vishnu" },
    planet: { ta: "சந்திரன்", en: "Moon" },
    qualities: [{ ta: "கேட்டல்", en: "Listening" }, { ta: "கற்றல்", en: "Learning" }, { ta: "தொடர்பு", en: "Connection" }],
    description: {
      ta: "திருவோணம் கேட்டல் மற்றும் கற்றலின் நட்சத்திரம். விஷ்ணு தெய்வம். தகவல் தொடர்பு மற்றும் அறிவு பரவலை குறிக்கிறது.",
      en: "Shravana, symbolised by three footsteps, is ruled by Vishnu (preserver). It represents the power of listening, learning, and the dissemination of wisdom.",
    },
    compatibility: { ta: "உத்திராடம், ரேவதி உடன் சிறந்தது", en: "Best with Uttara Ashadha and Revati" },
  },
  {
    number: 23, slug: "dhanishtha",
    name: { ta: "அவிட்டம்", en: "Avittam" }, symbol: "🥁",
    deity: { ta: "எட்டு வசுக்கள்", en: "Eight Vasus" },
    planet: { ta: "செவ்வாய்", en: "Mars" },
    qualities: [{ ta: "இசை", en: "Music" }, { ta: "செல்வம்", en: "Wealth" }, { ta: "தைரியம்", en: "Boldness" }],
    description: {
      ta: "அவிட்டம் செல்வம் மற்றும் இசையின் நட்சத்திரம். எட்டு வசுக்கள் தெய்வங்கள். தைரியம் மற்றும் சமூக திறமை இதன் சிறப்பியல்புகள்.",
      en: "Dhanishtha, symbolised by a drum, is associated with the eight Vasus (elemental gods). It represents wealth, music, boldness, and the ability to inspire through rhythm.",
    },
    compatibility: { ta: "சதயம், பூசம் உடன் சிறந்தது", en: "Best with Shatabhisha and Pushya" },
  },
  {
    number: 24, slug: "shatabhisha",
    name: { ta: "சதயம்", en: "Sadayam" }, symbol: "⭕",
    deity: { ta: "வருணன்", en: "Varuna" },
    planet: { ta: "ராகு", en: "Rahu" },
    qualities: [{ ta: "குணமாக்கல்", en: "Healing" }, { ta: "ஆய்வு", en: "Research" }, { ta: "தனிமை", en: "Solitude" }],
    description: {
      ta: "சதயம் குணமாக்கலும் ஆய்வின் நட்சத்திரம். வருணன் தெய்வம். ஆழமான ஆராய்ச்சி, குணமாக்கும் திறன் மற்றும் தனித்துவம் இதன் அடையாளம்.",
      en: "Shatabhisha, meaning 'a hundred healers', is associated with Varuna (god of cosmic waters). It represents healing, research, and the need for periodic solitude.",
    },
    compatibility: { ta: "அவிட்டம், அஸ்வினி உடன் சிறந்தது", en: "Best with Dhanishtha and Ashwini" },
  },
  {
    number: 25, slug: "purva-bhadra",
    name: { ta: "பூரட்டாதி", en: "Poorattathi" }, symbol: "🗡️",
    deity: { ta: "அஜ ஏகபாதன்", en: "Aja Ekapada" },
    planet: { ta: "குரு", en: "Jupiter" },
    qualities: [{ ta: "நீதி", en: "Righteousness" }, { ta: "தீவிரம்", en: "Intensity" }, { ta: "மாற்றம்", en: "Transformation" }],
    description: {
      ta: "பூரட்டாதி மாற்றம் மற்றும் தீவிரத்தின் நட்சத்திரம். அஜ ஏகபாதன் தெய்வம். ஆன்மீக தேட்டம் மற்றும் நீதியை நிலை நாட்டும் ஆற்றல் இதன் சிறப்பு.",
      en: "Purva Bhadra, associated with Aja Ekapada (the one-footed serpent), represents intensity, spiritual transformation, and the capacity for great moral conviction.",
    },
    compatibility: { ta: "உத்திரட்டாதி, விசாகம் உடன் சிறந்தது", en: "Best with Uttara Bhadra and Vishakha" },
  },
  {
    number: 26, slug: "uttara-bhadra",
    name: { ta: "உத்திரட்டாதி", en: "Uthirattathi" }, symbol: "🌊",
    deity: { ta: "அஹிர்புத்னியன்", en: "Ahir Budhanya" },
    planet: { ta: "சனி", en: "Saturn" },
    qualities: [{ ta: "ஆழம்", en: "Depth" }, { ta: "ஸ்திரத்தன்மை", en: "Stability" }, { ta: "ஞானம்", en: "Wisdom" }],
    description: {
      ta: "உத்திரட்டாதி ஆழமான ஞானத்தின் நட்சத்திரம். அஹிர்புத்னியன் தெய்வம். உண்மை அர்த்தங்களை ஆழமாக புரிந்துகொள்ளும் ஆற்றல் இதன் சிறப்பு.",
      en: "Uttara Bhadra represents profound wisdom, stability, and the capacity for deep compassion. Its serpentine deity Ahir Budhanya symbolises the depths of the unconscious.",
    },
    compatibility: { ta: "பூரட்டாதி, உத்திரம் உடன் சிறந்தது", en: "Best with Purva Bhadra and Uttara Phalguni" },
  },
  {
    number: 27, slug: "revati",
    name: { ta: "ரேவதி", en: "Revathi" }, symbol: "🐟",
    deity: { ta: "பூஷன்", en: "Pushan" },
    planet: { ta: "புதன்", en: "Mercury" },
    qualities: [{ ta: "ஊட்டமளித்தல்", en: "Nourishment" }, { ta: "பயணம்", en: "Journey" }, { ta: "அனுகூலம்", en: "Auspiciousness" }],
    description: {
      ta: "ரேவதி கடைசி மற்றும் ஒரு சுழற்சியின் முடிவின் நட்சத்திரம். பூஷன் தெய்வம். ஊட்டமளிக்கும் ஆற்றல் மற்றும் பாதுகாப்பான பயணத்தை குறிக்கிறது.",
      en: "Revati, the last nakshatra, is associated with Pushan (guide of souls). It represents nourishment, safe journeys, and the completion of the cosmic cycle, ready for renewal.",
    },
    compatibility: { ta: "திருவோணம், ஹஸ்தம் உடன் சிறந்தது", en: "Best with Shravana and Hasta" },
  },
];
