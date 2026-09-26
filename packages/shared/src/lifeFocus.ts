import type { LifeMode } from "./types";

/**
 * Life focus copy shared by web and mobile (docs/LIFE_FOCUS_PLAN_2026-09-22.md).
 *
 * The labels a focus is shown under. Web's `MODE_META` (life-mode-picker.tsx)
 * adds its icons on top of these; mobile reads them directly. Keep the wording
 * here only, so the two surfaces cannot name the same focus differently.
 *
 * Not the D1 table: which life area and activities a focus drives is the
 * server's (`FOCUS_TABLE` in app/core/life_mode.py), delivered on the
 * life-mode response as `focusArea` / `focusActivities`.
 */

type BiText = { ta: string; en: string };

export const LIFE_MODE_ORDER: readonly LifeMode[] = [
  "STUDY", "CAREER", "LOVE", "MARRIAGE", "FAMILY",
  "WEALTH", "HEALTH", "SPIRITUALITY", "REMEDIES", "BALANCED",
];

export const LIFE_MODE_TEXT: Record<LifeMode, { label: BiText; desc: BiText }> = {
  STUDY:        { label: { en: "Studies",      ta: "படிப்பு" },     desc: { en: "Focus, exams, learning",     ta: "கவனம், தேர்வு, கற்றல்" } },
  CAREER:       { label: { en: "Career",       ta: "தொழில்" },      desc: { en: "Work timing & decisions",    ta: "வேலை நேரம் & முடிவுகள்" } },
  LOVE:         { label: { en: "Love",         ta: "காதல்" },       desc: { en: "Communication & connection", ta: "தொடர்பு & நெருக்கம்" } },
  MARRIAGE:     { label: { en: "Marriage",     ta: "திருமணம்" },    desc: { en: "Relationship & timing",      ta: "உறவு & நேரம்" } },
  FAMILY:       { label: { en: "Family",       ta: "குடும்பம்" },   desc: { en: "Harmony & home",             ta: "ஒற்றுமை & வீடு" } },
  WEALTH:       { label: { en: "Wealth",       ta: "செல்வம்" },     desc: { en: "Money & finance timing",     ta: "பணம் & நிதி நேரம்" } },
  HEALTH:       { label: { en: "Health",       ta: "ஆரோக்கியம்" },  desc: { en: "Energy, rest, vitality",     ta: "சக்தி, ஓய்வு, உடல்நலம்" } },
  SPIRITUALITY: { label: { en: "Spirituality", ta: "ஆன்மீகம்" },    desc: { en: "Prayer & inner growth",      ta: "வழிபாடு & உள் வளர்ச்சி" } },
  REMEDIES:     { label: { en: "Remedies",     ta: "பரிகாரம்" },    desc: { en: "Parihara & practices",       ta: "பரிகாரம் & பயிற்சிகள்" } },
  BALANCED:     { label: { en: "Balanced",     ta: "சமநிலை" },      desc: { en: "A bit of everything",        ta: "எல்லாமே சிறிது" } },
};

/** Ask Vinaadi quick-question chips, three per focus (Feature 3). Chips are
 *  sent as ordinary questions; the chip flag only counts against the chip
 *  allowance. Moved here from web/lib/ask-vinaadi-chips.ts so mobile asks the
 *  same three questions (Phase 3). */
export const LIFE_MODE_ASK_CHIPS: Record<LifeMode, readonly [BiText, BiText, BiText]> = {
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

/** The one reordering primitive for focus surfaces (D2: reorder, never
 *  rescore). A stable partition: matching items first, each group in its
 *  original order. Returns the input objects themselves, never copies. Web's
 *  Today and Life areas and mobile's Today pulse all pin through this. */
export function pinFirst<T>(items: readonly T[], isPinned: (item: T) => boolean): T[] {
  const pinned: T[] = [];
  const rest: T[] = [];
  for (const item of items) (isPinned(item) ? pinned : rest).push(item);
  return [...pinned, ...rest];
}

export function askChipsForMode(mode: LifeMode): readonly [BiText, BiText, BiText] {
  return LIFE_MODE_ASK_CHIPS[mode] ?? LIFE_MODE_ASK_CHIPS.BALANCED;
}

/** The copy both surfaces use around the focus. New Tamil is pending native
 *  review, as on web (`LIFE_FOCUS` in web/lib/dashboard-i18n.ts). */
export const LIFE_FOCUS_TEXT = {
  eyebrow: { en: "Your focus", ta: "உங்கள் கவனம்" },
  question: { en: "What are you focused on right now?", ta: "இப்போது எதில் கவனம்?" },
  chipPrefix: { en: "Focus", ta: "கவனம்" },
  chipAria: { en: "%s. Change focus", ta: "%s. கவனத்தை மாற்று" },
  settingsDesc: {
    en: "Pick what matters right now. Your quick questions and daily tips lean toward it; your scores never change.",
    ta: "இப்போது முக்கியமானதைத் தேர்வுசெய்யுங்கள். விரைவுக் கேள்விகளும் தினசரி குறிப்புகளும் அதை நோக்கிச் சாயும்; உங்கள் மதிப்பெண்கள் மாறாது.",
  },
  close: { en: "Close", ta: "மூடு" },
  saveFailed: { en: "Couldn't save. Please try again.", ta: "சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்." },
} as const;
