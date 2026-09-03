import type { BiText } from "./types";

/**
 * Classical rasi (moon-sign / ascendant-sign) trait content — generic,
 * non-personalised zodiac characteristics (element, ruling planet already
 * covered by RASI_LORDS in chart-utils.ts, three keyword strengths, one
 * caution, one profile line). Mirrors the shape/tone of the backend-authored
 * nakshatra profile (app/services/nakshatra_content.py, served via
 * NakshatraCardData) but is hardcoded client-side since there is no backend
 * rasi/lagna content endpoint yet — same tier of fixed fact as
 * GRAHA_ABBR/D1_RASI_NAMES/RASI_LORDS. The same table is reused for both the
 * "Rasi" (moon-sign) and "Lagnam" (ascendant-sign) trait cards; only the
 * framing sentence around it differs by which chart point is being shown.
 */
export type RasiTraitEntry = {
  element: BiText;
  traits: BiText[];
  caution: BiText;
  profile: BiText;
};

export const RASI_TRAITS: Record<number, RasiTraitEntry> = {
  1: {
    element: { ta: "நெருப்பு", en: "Fire" },
    profile: {
      ta: "மேஷ ராசியினர் தைரியமும், சுறுசுறுப்பும் கொண்டு முன்னின்று வழிநடத்துபவர்கள். விரைவாக முடிவெடுத்து செயலில் இறங்குவதை விரும்புவர்.",
      en: "Bold, energetic self-starters who lead from the front. They move fast, decide quickly, and prefer action over long deliberation.",
    },
    traits: [
      { ta: "துணிச்சலான தொடக்கம்", en: "Bold initiative" },
      { ta: "அழுத்தத்தில் தைரியம்", en: "Courage under pressure" },
      { ta: "விரைவான முடிவெடுப்பு", en: "Fast decision-making" },
    ],
    caution: { ta: "மெதுவான திட்டங்களில் பொறுமையை பேணவும்", en: "Watch impatience with slower plans" },
  },
  2: {
    element: { ta: "நிலம்", en: "Earth" },
    profile: {
      ta: "ரிஷப ராசியினர் நிலைத்தன்மையையும், வசதியையும், நிலையான முயற்சியையும் மதிக்கின்றனர். அழகு, வளங்கள் மற்றும் நம்பகமான வழக்கங்களை நோக்கி ஈர்க்கப்படுவர்.",
      en: "Value stability, comfort and steady effort. They build things that last, and are drawn to beauty, resources and dependable routines.",
    },
    traits: [
      { ta: "பொறுமையான உறுதி", en: "Patient persistence" },
      { ta: "நடைமுறை நிலைப்புத்தன்மை", en: "Practical steadiness" },
      { ta: "அழகுணர்வு", en: "Appreciation for beauty" },
    ],
    caution: { ta: "தேவையான மாற்றத்தை எதிர்க்காமல் இருக்கவும்", en: "Watch resisting change even when it's needed" },
  },
  3: {
    element: { ta: "காற்று", en: "Air" },
    profile: {
      ta: "மிதுன ராசியினர் ஆர்வமும், விரைவான சிந்தனையும் கொண்ட தொடர்பாளர்கள். ஒரே நேரத்தில் பல ஆர்வங்களை கையாண்டு புதிய நபர்கள் மற்றும் யோசனைகளுக்கு எளிதில் பொருந்துவர்.",
      en: "Curious, quick-witted communicators. They juggle many interests at once and adapt easily to new people and ideas.",
    },
    traits: [
      { ta: "விரைவான கற்றல்", en: "Quick learning" },
      { ta: "பன்முக தொடர்பு", en: "Versatile communication" },
      { ta: "சமூக தகவமைப்பு", en: "Social adaptability" },
    ],
    caution: { ta: "அதிக விஷயங்களில் கவனம் சிதறாமல் பார்க்கவும்", en: "Watch scattering focus across too many things" },
  },
  4: {
    element: { ta: "நீர்", en: "Water" },
    profile: {
      ta: "கடக ராசியினர் அரவணைப்பும், உணர்வுபூர்வமான புரிதலும் கொண்டு வீடு மற்றும் குடும்பத்தை பாதுகாப்பவர்கள். உள்ளுணர்வுடன் செயல்பட்டு தாங்கள் நேசிப்பவர்களுக்கு முக்கியமானவற்றை நினைவில் வைப்பர்.",
      en: "Nurturing, emotionally attuned, and protective of home and family. They lead with intuition and remember what matters to the people they love.",
    },
    traits: [
      { ta: "உணர்வுசார் புத்திசாலித்தனம்", en: "Emotional intelligence" },
      { ta: "அரவணைக்கும் பராமரிப்பு", en: "Nurturing care" },
      { ta: "வலுவான உள்ளுணர்வு", en: "Strong intuition" },
    ],
    caution: { ta: "அழுத்தத்தின்போது மனநிலை மாற்றத்தை கவனிக்கவும்", en: "Watch mood swings under stress" },
  },
  5: {
    element: { ta: "நெருப்பு", en: "Fire" },
    profile: {
      ta: "சிம்ம ராசியினர் இயல்பான அரவணைப்பும், தன்னம்பிக்கையும் கொண்டு முன்னணியில் நிற்க தயங்குவதில்லை. தாராளமாக வழிநடத்தி தங்கள் முயற்சி அங்கீகரிக்கப்பட வேண்டும் என விரும்புவர்.",
      en: "Carry natural warmth and confidence, and are comfortable taking center stage. They lead generously and want their effort to be recognised.",
    },
    traits: [
      { ta: "இயல்பான தன்னம்பிக்கை", en: "Natural confidence" },
      { ta: "தாராள தலைமை", en: "Generous leadership" },
      { ta: "அரவணைப்பான பிரசன்னம்", en: "Warm presence" },
    ],
    caution: { ta: "தொடர்ந்த அங்கீகாரம் தேவைப்படுவதை கவனிக்கவும்", en: "Watch needing constant recognition" },
  },
  6: {
    element: { ta: "நிலம்", en: "Earth" },
    profile: {
      ta: "கன்னி ராசியினர் நுட்பமும், பகுப்பாய்வு திறனும் கொண்டு அமைதியாக உழைப்பவர்கள். மற்றவர்கள் கவனிக்காத நுணுக்கங்களை கவனித்து சரியாக செய்வதில் பெருமிதம் கொள்வர்.",
      en: "Precise, analytical and quietly hardworking. They notice details others miss and take pride in doing things correctly.",
    },
    traits: [
      { ta: "நுட்பமான கவனம்", en: "Attention to detail" },
      { ta: "பகுப்பாய்வு சிந்தனை", en: "Analytical thinking" },
      { ta: "நம்பகமான உழைப்பு", en: "Reliable work ethic" },
    ],
    caution: { ta: "தன்னையோ மற்றவரையோ அதிகம் விமர்சிக்காமல் பார்க்கவும்", en: "Watch over-criticising yourself or others" },
  },
  7: {
    element: { ta: "காற்று", en: "Air" },
    profile: {
      ta: "துலா ராசியினர் உறவுகளில் சமநிலையும், நியாயமும், நல்லிணக்கமும் நாடுபவர்கள். மக்களை நன்கு புரிந்துகொண்டு தங்களை சுற்றி அமைதியை பேணுவர்.",
      en: "Seek balance, fairness and harmony in relationships. They read people well and work to keep the peace around them.",
    },
    traits: [
      { ta: "இராஜதந்திர நியாயம்", en: "Diplomatic fairness" },
      { ta: "உறவு புரிதல்", en: "Relationship instincts" },
      { ta: "நல்லிணக்க உணர்வு", en: "Sense of harmony" },
    ],
    caution: { ta: "அனைவரையும் திருப்திப்படுத்த முடிவெடுப்பதை தாமதிக்காமல் பார்க்கவும்", en: "Watch delaying decisions to keep everyone happy" },
  },
  8: {
    element: { ta: "நீர்", en: "Water" },
    profile: {
      ta: "விருச்சிக ராசியினர் தீவிரமும், கூர்மையான உள்ளுணர்வும் கொண்டு நம்பிக்கை கிடைத்தபின் ஆழமான விசுவாசம் காட்டுவர். மேலோட்டமான பதில்களில் திருப்தியடையாமல் ஆழமாக ஆராய்வர்.",
      en: "Intense, perceptive and deeply loyal once trust is earned. They go beneath the surface and rarely settle for a shallow answer.",
    },
    traits: [
      { ta: "ஆழமான கூர்மை", en: "Deep perception" },
      { ta: "அசைக்க முடியாத விசுவாசம்", en: "Unwavering loyalty" },
      { ta: "வலுவான மன உறுதி", en: "Strong willpower" },
    ],
    caution: { ta: "பழைய வலிகளை பிடித்துக்கொள்ளாமல் பார்க்கவும்", en: "Watch holding on to old hurts" },
  },
  9: {
    element: { ta: "நெருப்பு", en: "Fire" },
    profile: {
      ta: "தனுசு ராசியினர் நம்பிக்கையும், தத்துவ சிந்தனையும் கொண்டு பரந்த பார்வையை நோக்கி ஈர்க்கப்படுவர். கற்றல், பயணம் மற்றும் நேரடியான உண்மையான உரையாடலை விரும்புவர்.",
      en: "Optimistic, philosophical, and drawn to the bigger picture. They love learning, travel and honest, direct conversation.",
    },
    traits: [
      { ta: "பரந்த பார்வை", en: "Broad perspective" },
      { ta: "இயல்பான நம்பிக்கை", en: "Natural optimism" },
      { ta: "கற்றலில் ஆர்வம்", en: "Love of learning" },
    ],
    caution: { ta: "உற்சாகத்தில் அதிகம் வாக்களிக்காமல் பார்க்கவும்", en: "Watch overpromising out of enthusiasm" },
  },
  10: {
    element: { ta: "நிலம்", en: "Earth" },
    profile: {
      ta: "மகர ராசியினர் ஒழுங்கும், பொறுமையும் கொண்டு அமைதியாக லட்சியம் கொண்டவர்கள். நீண்ட கால முயற்சி மூலம் நடைமுறையான உழைப்பால் முடிவுகளை பெறுவர்.",
      en: "Disciplined, patient and quietly ambitious. They play the long game and earn results through consistent, practical effort.",
    },
    traits: [
      { ta: "ஒழுங்கான கவனம்", en: "Disciplined focus" },
      { ta: "நடைமுறை திட்டமிடல்", en: "Practical planning" },
      { ta: "அமைதியான சகிப்புத்தன்மை", en: "Quiet endurance" },
    ],
    caution: { ta: "தன் மீது அதிக கடுமையாக இருக்காமல் பார்க்கவும்", en: "Watch being too hard on yourself" },
  },
  11: {
    element: { ta: "காற்று", en: "Air" },
    profile: {
      ta: "கும்ப ராசியினர் சுதந்திரமாக சிந்தித்து காலத்திற்கு முந்திய யோசனைகளை நோக்கி ஈர்க்கப்படுவர். கூட்டத்திற்கான நியாயத்தை மதித்து கூட்டத்தினின்று வேறுபடுவதில் தயங்க மாட்டார்கள்.",
      en: "Independent thinkers, drawn to ideas ahead of their time. They value fairness for the group and don't mind standing apart from the crowd.",
    },
    traits: [
      { ta: "புதுமையான சிந்தனை", en: "Original thinking" },
      { ta: "நியாய உணர்வு", en: "Fairness-minded" },
      { ta: "சுதந்திர மனப்பான்மை", en: "Independent spirit" },
    ],
    caution: { ta: "நெருங்கிய உறவுகளிலிருந்து விலகிவிடாமல் பார்க்கவும்", en: "Watch detaching from close relationships" },
  },
  12: {
    element: { ta: "நீர்", en: "Water" },
    profile: {
      ta: "மீன ராசியினர் கருணையும், கற்பனை திறனும், ஆன்மீக நாட்டமும் கொண்டவர்கள். மற்றவர்கள் சொல்வதற்கு முன்பே அவர்களின் உணர்வை உணர்ந்து, கலை, குணமாக்கல் அல்லது அமைதியான சிந்தனையை நோக்கி ஈர்க்கப்படுவர்.",
      en: "Compassionate, imaginative and spiritually inclined. They sense what others feel before it's said, and are drawn to art, healing or quiet reflection.",
    },
    traits: [
      { ta: "ஆழமான கருணை", en: "Deep compassion" },
      { ta: "படைப்பாற்றல் கற்பனை", en: "Creative imagination" },
      { ta: "ஆன்மீக உணர்திறன்", en: "Spiritual sensitivity" },
    ],
    caution: { ta: "கற்பனையில் தப்பித்து ஓடிவிடாமல் பார்க்கவும்", en: "Watch escaping into daydreams" },
  },
};
