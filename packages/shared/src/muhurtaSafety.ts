/**
 * Words for the fixed muhurta safety lines (deferred-checks plan, item 4).
 * Shared by web and mobile so neither app can word, or drop, them differently.
 *
 * The backend sends keys in `safetyNotices`; this is the only place they
 * become sentences. They are not factors and never touch a score: they say
 * what a muhurta is for, whatever the star tables eventually rule.
 *
 * Tamil strings here are pending native review.
 */
import type { MuhurtaSafetyNoticeKey } from "./types";

export type SafetyLang = "ta" | "en";

const NOTICES: Record<MuhurtaSafetyNoticeKey, { ta: string; en: string }> = {
  medical_doctor_first: {
    en: "This timing is cultural guidance for planned, non-urgent procedures only. Your doctor's advice comes first: never delay urgent care or prescribed treatment to wait for a good time.",
    ta: "இந்த நேரக் கணிப்பு திட்டமிட்ட, அவசரமில்லாத சிகிச்சைகளுக்கான பண்பாட்டு வழிகாட்டி மட்டுமே. மருத்துவரின் ஆலோசனையே முதன்மையானது: நல்ல நேரத்துக்காக அவசர சிகிச்சையையோ மருத்துவர் சொன்ன சிகிச்சையையோ தள்ளிப்போடாதீர்கள்.",
  },
};

/** The lines for a response, in order; unknown keys are skipped, never shown raw. */
export function muhurtaSafetyNotices(
  keys: readonly string[] | null | undefined,
  lang: SafetyLang,
): string[] {
  return (keys ?? [])
    .map((k) => NOTICES[k as MuhurtaSafetyNoticeKey])
    .filter((n): n is { ta: string; en: string } => Boolean(n))
    .map((n) => n[lang]);
}
