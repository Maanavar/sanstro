// Static astrological reference data + shared types for the chart-explanation
// panel. Extracted from dashboard-chart-explanation.tsx (UXD-09) to shrink the
// monolith: pure data, no React — safe to import statically or lazily.

export type BiCopy = { ta: string; en: string };
export type RelationshipTone = "friendly" | "neutral" | "hostile";
export type SectionId =
  | "basics"
  | "activation"
  | "positions"
  | "conjunctions"
  | "drishti"
  | "houses"
  | "functional"
  | "yogas"
  | "summary"
  | "peyarchi";

export const TAMIL_RASI_NAMES: Record<number, string> = {
  1: "மேஷம்",
  2: "ரிஷபம்",
  3: "மிதுனம்",
  4: "கடகம்",
  5: "சிம்மம்",
  6: "கன்னி",
  7: "துலாம்",
  8: "விருச்சிகம்",
  9: "தனுசு",
  10: "மகரம்",
  11: "கும்பம்",
  12: "மீனம்",
};

export const KENDRA_HOUSES = new Set([1, 4, 7, 10]);
export const TRIKONA_HOUSES = new Set([1, 5, 9]);
export const DUSTHANA_HOUSES = new Set([6, 8, 12]);

// ── Dignity doctrine, re-exported from lib/chart-utils ───────────────────────
//
// These six tables were duplicated here and in the public
// `app/tools/jadhagam-generator/JadhagamTool.tsx`, where NATURAL_ENEMIES had
// already drifted. They now live in `lib/chart-utils.ts`, which is where a
// marketing surface can read them WITHOUT pulling in this module's bilingual
// prose (`HOUSE_MEANING`, `SECTION_META`) — see the note there.
//
// Re-exported rather than repointed at the call sites: the values are unchanged,
// and this module is the natural place to look for them when you are already
// reading the chart explanation.
export {
  EXALTATION_RASI,
  DEBILITATION_RASI,
  MOOLATRIKONA_ZONE,
  OWN_SIGN_RASI,
  NATURAL_FRIENDS,
  NATURAL_ENEMIES,
} from "@/lib/chart-utils";

// One table, two names. `RASI_LORDS` is the canonical export in chart-utils and
// `SIGN_LORD` is what this module's consumers ask for; both were already present
// in the tree with identical values, so neither name is being taken away.
export { RASI_LORDS as SIGN_LORD } from "@/lib/chart-utils";

export const HOUSE_MEANING: Record<number, BiCopy> = {
  1: { ta: "உடல், தன்மை, வாழ்க்கை திசை", en: "self, body, life direction" },
  2: { ta: "குடும்பம், பேச்சு, பண அடித்தளம்", en: "family, speech, money base" },
  3: { ta: "முயற்சி, துணிவு, தொடர்பு", en: "effort, courage, communication" },
  4: { ta: "வீடு, மன அமைதி, சொத்து", en: "home, inner peace, property" },
  5: { ta: "கல்வி, புத்தி, குழந்தைகள்", en: "learning, intelligence, children" },
  6: { ta: "சேவை, பழக்கங்கள், ஒழுங்கு", en: "service, habits, discipline" },
  7: { ta: "உறவுகள், கூட்டாண்மை", en: "relationships, partnership" },
  8: { ta: "ஆழமான மாற்றம், ஆராய்ச்சி, கவனம்", en: "deep change, research, careful renewal" },
  9: { ta: "தர்மம், ஆசீர்வாதம், உயர்கல்வி", en: "dharma, grace, higher learning" },
  10: { ta: "தொழில், பொறுப்பு, வெளிப்படை செயல்", en: "career, responsibility, public work" },
  11: { ta: "லாபம், நண்பர்கள், வலையமைப்பு", en: "gains, friends, networks" },
  12: { ta: "ஓய்வு, வெளிநாடு, ஆன்மீக விடுவிப்பு", en: "rest, foreign links, spiritual release" },
};

export const HOUSE_GROUP_COPY: Record<"kendra" | "trikona" | "dusthana" | "other", BiCopy> = {
  kendra: {
    ta: "கேந்திரம்: வாழ்க்கையின் முக்கிய தூண்கள். இங்கு உள்ள கிரகங்கள் வெளிப்படையாக வேலை செய்கின்றன.",
    en: "Kendra: the main pillars of life. Planets here tend to act visibly.",
  },
  trikona: {
    ta: "திரிகோணம்: திறமை, புண்ணியம், ஆதரவு. இங்கு உள்ள கிரகங்கள் வளர்ச்சிக்கான வழிகளை காட்டும்.",
    en: "Trikona: talent, grace, support. Planets here point to growth channels.",
  },
  dusthana: {
    ta: "துஷ்டானம்: கவனமும் திருத்தமும் தேவைப்படும் இடங்கள். நல்ல ஒழுங்கு இதை சமநிலைப்படுத்தும்.",
    en: "Dusthana: areas needing care and refinement. Good routines help balance them.",
  },
  other: {
    ta: "மற்ற வீடுகள்: சூழ்நிலைக்கு ஏற்ப விளைவு தரும் இடங்கள்.",
    en: "Other houses: areas that work through context and timing.",
  },
};

export const SECTION_META: Array<{ id: SectionId; title: BiCopy; hint: BiCopy }> = [
  {
    id: "basics",
    title: { ta: "உங்கள் ஜாதகத்தின் அடித்தளம்", en: "What your chart is built around" },
    hint: { ta: "லக்னம், சந்திரன், நடப்பு தசை", en: "Lagna, Moon, current Dasa" },
  },
  {
    id: "activation",
    title: { ta: "இப்போது உங்களுக்கு செயல்படும் காலம்", en: "What is active for you now" },
    hint: { ta: "தசை / புக்தி / அந்தரம் + கிரகநகர்வு", en: "Dasa / Bhukti / Antaram + transit" },
  },
  {
    id: "positions",
    title: { ta: "உங்கள் கிரகங்கள் எங்கு உள்ளன", en: "Where your planets are placed" },
    hint: { ta: "வீடு, ராசி, நட்சத்திரம், பலம்", en: "House, sign, nakshatra, strength" },
  },
  {
    id: "conjunctions",
    title: { ta: "ஒன்றாக நிற்கும் கிரகங்கள்", en: "Friends Standing Together" },
    hint: { ta: "ஒரே ராசியில் உள்ள கூட்டங்கள்", en: "Groups sharing one sign" },
  },
  {
    id: "drishti",
    // New Tamil, pending native review
    title: { ta: "எந்த கிரகம் எதைப் பார்க்கிறது", en: "Which planets look at which" },
    hint: { ta: "7-ஆம் பார்வை மற்றும் கிரகநகர்விலான குரு/சனி பார்வை", en: "7th aspect and Guru/Sani transit aspects" },
  },
  {
    id: "houses",
    // New Tamil, pending native review
    title: { ta: "கிரகங்கள் இருக்கும் வாழ்க்கைப் பகுதிகள்", en: "Which parts of life your planets sit in" },
    hint: { ta: "கிரகங்கள் எந்த வீட்டு குழுவில் உள்ளன", en: "Which house group each planet occupies" },
  },
  {
    id: "functional",
    title: { ta: "ஒவ்வொரு கிரகமும் உங்களுக்கு எப்படி செயல்படுகிறது", en: "How each planet works for you" },
    hint: { ta: "லக்னத்திற்கு கிரகத்தின் பங்கு", en: "Each planet's role for the Lagna" },
  },
  {
    id: "yogas",
    title: { ta: "ஜாதக அமைப்புகளும் கவனிக்க வேண்டிய நிலைகளும்", en: "Chart patterns and difficult placements" },
    hint: { ta: "ஏற்கனவே கணிக்கப்பட்ட யோக/தோஷ விளக்கம்", en: "Existing yoga and dosham interpretation" },
  },
  {
    id: "summary",
    title: { ta: "உங்கள் பலங்களும் கவனிக்க வேண்டிய பகுதிகளும்", en: "Your strengths and areas for care" },
    hint: { ta: "வலுவானது, ஆதரவு தேவைப்படுவது, நடைமுறை குறிப்பு", en: "Strongest, needs support, practical notes" },
  },
  {
    id: "peyarchi",
    // New Tamil, pending native review
    title: { ta: "உங்களுக்கான பெரிய கிரக மாற்றங்கள்", en: "Big planet moves coming for you" },
    hint: { ta: "குரு, சனி, ராகு, கேது இந்த ஜாதகத்தில் தொடும் வீடுகள்", en: "Guru, Sani, Rahu, Ketu houses for this chart" },
  },
];
