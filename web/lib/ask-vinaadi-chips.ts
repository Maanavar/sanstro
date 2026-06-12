// Ask Vinaadi Lite — pre-written daily prompt chips per Life Mode (Feature 3).
// Chips are sent as ordinary questions; the `isChipQuestion` flag is only for
// rate-limit accounting. Three chips per mode, bilingual.

import type { LifeMode } from "@/lib/types";

export interface ChipText {
  ta: string;
  en: string;
}

const CHIPS: Record<LifeMode, [ChipText, ChipText, ChipText]> = {
  STUDY: [
    { ta: "இன்று என் கவனம் எப்படி?", en: "How is my focus today?" },
    { ta: "இன்று மாலை படிக்க சிறந்த நேரம்?", en: "Best time to study this evening?" },
    { ta: "இன்று எதைத் தவிர்க்க வேண்டும்?", en: "What should I avoid today?" },
  ],
  CAREER: [
    { ta: "இன்று என் வேலை சக்தி எப்படி?", en: "How is my work energy today?" },
    { ta: "முக்கிய முடிவுகளுக்கு இன்று நல்லதா?", en: "Is today good for important decisions?" },
    { ta: "எதில் கவனமாக இருக்க வேண்டும்?", en: "What should I be careful about?" },
  ],
  LOVE: [
    { ta: "இன்று என் தொடர்பு எப்படி?", en: "How is my communication today?" },
    { ta: "கடினமான உரையாடலுக்கு இன்று நல்லதா?", en: "Is today good for a difficult conversation?" },
    { ta: "உறவுகள் பற்றி என் ஜாதகம் என்ன சொல்கிறது?", en: "What does my chart say about relationships?" },
  ],
  MARRIAGE: [
    { ta: "இன்று என் உறவு சக்தி எப்படி?", en: "How is my relationship energy today?" },
    { ta: "இந்த வாரம் எந்த நேரம் நல்லது?", en: "What timing is good this week?" },
    { ta: "என் திருமணத்தில் எதில் கவனம் செலுத்த வேண்டும்?", en: "What should I focus on in my marriage?" },
  ],
  FAMILY: [
    { ta: "இன்று குடும்ப ஒற்றுமை எப்படி?", en: "How is family harmony today?" },
    { ta: "முக்கிய குடும்ப உரையாடலுக்கு சிறந்த நேரம்?", en: "Best time for an important family talk?" },
    { ta: "இன்று எதைக் கவனிக்க வேண்டும்?", en: "What should I watch out for today?" },
  ],
  WEALTH: [
    { ta: "இன்று என் நிதி சக்தி எப்படி?", en: "How is my financial energy today?" },
    { ta: "புதிய நிதி முடிவுகளுக்கு இன்று நல்லதா?", en: "Is today good for new financial decisions?" },
    { ta: "செல்வ நேரம் பற்றி என் ஜாதகம் என்ன சொல்கிறது?", en: "What does my chart say about wealth timing?" },
  ],
  HEALTH: [
    { ta: "இன்று என் உடல் சக்தி எப்படி?", en: "How is my physical energy today?" },
    { ta: "ஆரோக்கியத்தில் எதில் கவனமாக இருக்க வேண்டும்?", en: "What should I be careful about health-wise?" },
    { ta: "ஓய்வு அல்லது உடற்பயிற்சிக்கு சிறந்த நேரம்?", en: "Best time for rest or exercise?" },
  ],
  SPIRITUALITY: [
    { ta: "இன்று ஆன்மிக ரீதியில் முக்கியமானது என்ன?", en: "What's spiritually significant today?" },
    { ta: "வழிபாடு அல்லது தியானத்திற்கு சிறந்த நேரம்?", en: "Best time for prayer or meditation?" },
    { ta: "இன்றைய நட்சத்திரம் என்ன சொல்கிறது?", en: "What does today's nakshatra say?" },
  ],
  REMEDIES: [
    { ta: "இன்று எந்த பரிகாரம் உதவும்?", en: "Which remedy helps me today?" },
    { ta: "எந்த கடவுளை வழிபடுவது நல்லது?", en: "Which deity is good to worship today?" },
    { ta: "இன்று எந்த எளிய பரிகாரம் செய்யலாம்?", en: "What simple parihara can I do today?" },
  ],
  BALANCED: [
    { ta: "இன்று என் ஒட்டுமொத்த சக்தி எப்படி?", en: "How is my overall energy today?" },
    { ta: "இன்று எதில் கவனம் செலுத்த வேண்டும்?", en: "What should I focus on?" },
    { ta: "இன்று எதைத் தவிர்க்க வேண்டும்?", en: "What should I avoid today?" },
  ],
};

export function getChipsForMode(mode: LifeMode): [ChipText, ChipText, ChipText] {
  return CHIPS[mode] ?? CHIPS.BALANCED;
}
