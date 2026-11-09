/**
 * Words for the children's-dosham D7 and dasa checks (V1 §18 Q13, step three).
 * Shared by web and mobile so the two apps cannot word them differently.
 *
 * The engine (`app/calculations/progeny_checks.py`) sends language-free facts;
 * this module is the only place they become sentences. Every planet and rasi
 * goes through the shared name tables, never a server string.
 *
 * Two rules hold in every line:
 *  - Q18: these checks are `engine_inference`. They describe and time; no line
 *    may say the grade went up or down because of them.
 *  - Q17: no line says a person cannot have children. Delay, effort, care.
 *
 * Tamil strings here are pending native review.
 */
import type { ChartDoshamInsight, ProgenyChecks, ProgenyDashaWindow } from "./types";
import { PLANET_LORDS, rasiDisplayName } from "./i18n/astro-names";

export type ProgenyLang = "ta" | "en";
type Text = { ta: string; en: string };
const pick = (t: Text, lang: ProgenyLang) => (lang === "ta" ? t.ta : t.en);

/** The adjective form Tamil uses before தசை / புக்தி (சுக்கிர தசை, not சுக்கிரன் தசை). */
const PERIOD_FORM_TA: Record<string, string> = {
  SUN: "சூரிய",
  MOON: "சந்திர",
  MARS: "செவ்வாய்",
  MERCURY: "புதன்",
  JUPITER: "குரு",
  VENUS: "சுக்கிர",
  SATURN: "சனி",
  RAHU: "ராகு",
  KETU: "கேது",
};

const MONTHS: Record<ProgenyLang, readonly string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  ta: ["ஜனவரி", "பிப்ரவரி", "மார்ச்", "ஏப்ரல்", "மே", "ஜூன்", "ஜூலை", "ஆகஸ்ட்", "செப்டம்பர்", "அக்டோபர்", "நவம்பர்", "டிசம்பர்"],
};

function planet(key: string, lang: ProgenyLang): string {
  const entry = PLANET_LORDS[key.toUpperCase()];
  return entry ? entry[lang] : key;
}

function planets(keys: readonly string[], lang: ProgenyLang): string {
  const names = keys.map((k) => planet(k, lang));
  if (names.length <= 1) return names.join("");
  return lang === "ta" ? names.join(", ") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function ordinal(n: number, lang: ProgenyLang): string {
  if (lang === "ta") return `${n}ஆம்`;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  return `${n}${n % 10 === 1 ? "st" : n % 10 === 2 ? "nd" : n % 10 === 3 ? "rd" : "th"}`;
}

function monthYear(iso: string, lang: ProgenyLang): string {
  const [y, m] = iso.split("-").map(Number);
  return `${MONTHS[lang][(m || 1) - 1]} ${y}`;
}

/** "Ketu bhukti in Venus dasa" / "சுக்கிர தசையில் கேது புக்தி". */
export function periodName(w: Pick<ProgenyDashaWindow, "lord" | "level" | "mahaLord">, lang: ProgenyLang): string {
  if (lang === "ta") {
    const lord = PERIOD_FORM_TA[w.lord] ?? planet(w.lord, lang);
    if (w.level === "MAHA") return `${lord} தசை`;
    const maha = PERIOD_FORM_TA[w.mahaLord] ?? planet(w.mahaLord, lang);
    return `${maha} தசையில் ${lord} புக்தி`;
  }
  if (w.level === "MAHA") return `${planet(w.lord, lang)} dasa`;
  return `${planet(w.lord, lang)} bhukti in ${planet(w.mahaLord, lang)} dasa`;
}

export interface ProgenyWindowLine {
  period: string;
  dates: string;
  kind: ProgenyDashaWindow["kind"];
  /** What this kind of window means, in one short phrase. */
  meaning: string;
  isCurrent: boolean;
}

export interface ProgenyCheckView {
  /** The D7 finding, then what it means for this dosham. */
  d7Finding: string;
  d7Effect: string;
  /** What is running now, and what it means here. */
  dashaNow: string;
  windows: ProgenyWindowLine[];
  /** What to do, given the D7 and the timing. */
  precautions: string[];
}

const WINDOW_MEANING: Record<ProgenyDashaWindow["kind"], Text> = {
  AFFLICTION: { ta: "இந்தத் தோஷம் அதிகம் தெரியும் காலம்", en: "when this dosham is felt most" },
  SUPPORT: { ta: "குழந்தை விஷயங்களுக்குத் துணையான காலம்", en: "a supportive period for children" },
  MIXED: { ta: "கலந்த பலன் தரும் காலம்", en: "a mixed period" },
};

function d7Lines(c: ProgenyChecks, lang: ProgenyLang): { finding: string; effect: string } {
  const d = c.d7;
  if (d.verdict === "UNCERTAIN") {
    return lang === "ta"
      ? {
          finding: `சப்தாம்ச (D7) லக்னம் பிறந்த நேரத்தில் சில நிமிடம் மாறினாலே மாறிவிடும்; உங்கள் கட்டத்தில் அடுத்த D7 லக்னம் சுமார் ${d.marginMinutes} நிமிடத் தூரத்தில் உள்ளது, அல்லது பிறந்த நேரம் துல்லியமாகத் தெரியவில்லை.`,
          effect: "அதனால் D7 சோதனையின் முடிவு இங்கு சொல்லப்படவில்லை. துல்லியமான பிறந்த நேரத்துடன் ஒரு ஜோதிடர் இதைப் பார்க்கலாம்.",
        }
      : {
          finding: `The Saptamsa (D7) lagna shifts with a few minutes of birth time, and here the next one is about ${d.marginMinutes} minutes away, or the birth time is not exact.`,
          effect: "So no D7 verdict is given here. An astrologer can read it with an exact birth time.",
        };
  }
  const fifth = rasiDisplayName(d.fifthRasi, lang);
  const lord = planet(d.fifthLord, lang);
  const lordHouse = ordinal(d.fifthLordHouse, lang);
  const jupHouse = ordinal(d.jupiterHouse, lang);
  if (d.verdict === "REPEATS") {
    const who = planets(d.repeatedBy, lang);
    return lang === "ta"
      ? {
          finding: `சப்தாம்சத்திலும் (D7) ${who} 5ஆம் வீட்டை (${fifth}) அல்லது அதன் அதிபதி ${lord}-ஐத் தொடுகிறது. ராசிக் கட்டத்தில் உள்ள அதே அமைப்பு குழந்தைக்கான கட்டத்திலும் மீண்டும் வருகிறது.`,
          effect: "இது இந்த அமைப்பை உறுதிப்படுத்துகிறது. மேலே உள்ள தீவிரம் அப்படியே நிற்கிறது; இதைக் கவனத்துடன் அணுகுங்கள்.",
        }
      : {
          finding: `In the Saptamsa (D7) too, ${who} touches the 5th house (${fifth}) or its lord ${lord}. The pattern in the birth chart repeats in the chart for children.`,
          effect: "This confirms the pattern. The grade above stands, and it deserves real attention.",
        };
  }
  if (d.verdict === "SUPPORTS") {
    return lang === "ta"
      ? {
          finding: `சப்தாம்சத்தில் (D7) குரு ${jupHouse} வீட்டில் இருந்து 5ஆம் வீட்டுக்குத் துணை தருகிறார்; 5ஆம் அதிபதி ${lord} ${lordHouse} வீட்டில் நல்ல நிலையில் உள்ளார்.`,
          effect: "குழந்தைக்கான கட்டம் துணை நிற்கிறது; இது உங்களுக்குச் சாதகமான அம்சம். ஆனாலும் மேலே உள்ள தீவிரம் ராசிக் கட்டத்திலிருந்து வருகிறது, அது அப்படியே நிற்கிறது.",
        }
      : {
          finding: `In the Saptamsa (D7), Jupiter in the ${jupHouse} house supports the 5th, and the 5th lord ${lord} is well placed in the ${lordHouse}.`,
          effect: "The chart for children supports, which is in your favour. The grade above comes from the birth chart and still stands.",
        };
  }
  if (d.verdict === "STRAINED") {
    return lang === "ta"
      ? {
          finding: `சப்தாம்சத்தில் (D7) 5ஆம் அதிபதி ${lord} ${lordHouse} வீட்டில் (மறைவு ஸ்தானம்) உள்ளார்; குருவின் துணையும் அங்கு இல்லை.`,
          effect: "குழந்தைக்கான கட்டம் இந்தத் தோஷத்தைக் குறைக்கவில்லை. நேரத்தையும் முயற்சியையும் திட்டமிட்டுச் செய்வது நல்லது.",
        }
      : {
          finding: `In the Saptamsa (D7), the 5th lord ${lord} sits in the ${lordHouse} house, a hidden (dusthana) house, and Jupiter gives no support there.`,
          effect: "The chart for children does not lighten this dosham. Plan timing and effort with care.",
        };
  }
  return lang === "ta"
    ? {
        finding: `சப்தாம்சத்தில் (D7) அமைப்பு மீண்டும் வரவில்லை, ஆனால் தெளிவான துணையும் இல்லை: 5ஆம் அதிபதி ${lord} ${lordHouse} வீட்டிலும், குரு ${jupHouse} வீட்டிலும் உள்ளனர்.`,
        effect: "D7 இந்தத் தோஷத்தைக் கூட்டவும் இல்லை, குறைக்கவும் இல்லை; ராசிக் கட்டத்தின் வாசிப்பே நிற்கிறது.",
      }
    : {
        finding: `In the Saptamsa (D7) the pattern does not repeat, but there is no clear support either: the 5th lord ${lord} is in the ${lordHouse} house and Jupiter in the ${jupHouse}.`,
        effect: "The D7 neither adds to this dosham nor lightens it; the birth-chart reading stands.",
      };
}

function dashaNow(c: ProgenyChecks, lang: ProgenyLang): string {
  const d = c.dasha;
  if (!d.currentMaha) return "";
  const running = periodName({ lord: d.currentBhukti, level: "BHUKTI", mahaLord: d.currentMaha }, lang);
  const meaning: Record<ProgenyChecks["dasha"]["currentKind"], Text> = {
    AFFLICTION: { ta: "இந்தத் தோஷம் அதிகம் தெரியக்கூடிய காலம் இது.", en: "This is a period when the dosham is felt most." },
    SUPPORT: { ta: "குழந்தை விஷயங்களுக்குத் துணையான காலம் இது.", en: "This is a supportive period for children." },
    MIXED: { ta: "இது கலந்த பலன் தரும் காலம்: தோஷமும் துணையும் சேர்ந்தே இருக்கும்.", en: "This is a mixed period: the dosham and the support both run." },
    NEUTRAL: { ta: "இந்தத் தோஷத்தைப் பொறுத்தவரை இது அமைதியான காலம்.", en: "For this dosham, this is a quiet period." },
  };
  return lang === "ta"
    ? `இப்போது நடப்பது ${running}. ${pick(meaning[d.currentKind], lang)}`
    : `Now running: ${running}. ${pick(meaning[d.currentKind], lang)}`;
}

function precautions(c: ProgenyChecks, lang: ProgenyLang): string[] {
  const out: Text[] = [];
  const d = c.dasha;
  if (d.ageBand === "UNDER_18") {
    out.push({
      ta: "இது பிற்காலத்துக்கான குறிப்பு. இப்போது எதுவும் செய்ய வேண்டியதில்லை; உரிய வயதில் ஜோதிடரிடம் மீண்டும் பார்க்கலாம்.",
      en: "This is for later years. Nothing needs doing now; look at it again with an astrologer at the right age.",
    });
  } else if (d.ageBand === "PAST") {
    out.push({
      ta: "இந்த வயதில் இந்தக் காலங்கள் பெரும்பாலும் இருக்கும் பிள்ளைகள், பேரப்பிள்ளைகளின் நலனைப் பற்றியே பேசுகின்றன.",
      en: "At this age these periods speak mostly to the well-being of existing children and grandchildren.",
    });
  } else {
    if (d.windows.some((w) => w.kind === "AFFLICTION")) {
      out.push({
        ta: "தோஷம் அதிகம் தெரியும் காலங்களில் குழந்தைக்குத் திட்டமிடும்போது மருத்துவ ஆலோசனையை முன்கூட்டியே பெறுங்கள்; பரிசோதனைகளைத் தள்ளிப்போடாதீர்கள்.",
        en: "In the periods when the dosham is felt most, get medical advice early when planning for a child, and do not put off check-ups.",
      });
    }
    if (d.windows.some((w) => w.kind === "SUPPORT")) {
      out.push({
        ta: "துணையான காலங்கள் முயற்சிக்கு உகந்தவை; ஆனால் அவற்றுக்காக மட்டும் காத்திருக்க வேண்டியதில்லை.",
        en: "The supportive periods suit the effort, but there is no need to wait for them alone.",
      });
    }
  }
  out.push({
    ta: "இது ஜோதிட வாசிப்பு, மருத்துவக் கணிப்பு அல்ல. குழந்தைப்பேறு பற்றிய முடிவுகளை மருத்துவரின் ஆலோசனையுடன் எடுங்கள்.",
    en: "This is an astrological reading, not a medical prediction. Make decisions about children with a doctor's advice.",
  });
  return out.map((t) => pick(t, lang));
}

/** The view for a dosham card, or null when the engine sent no checks. */
export function progenyCheckView(
  d: Pick<ChartDoshamInsight, "progenyChecks">,
  lang: ProgenyLang,
): ProgenyCheckView | null {
  const c = d.progenyChecks;
  if (!c) return null;
  const { finding, effect } = d7Lines(c, lang);
  return {
    d7Finding: finding,
    d7Effect: effect,
    dashaNow: dashaNow(c, lang),
    windows: c.dasha.windows.map((w) => ({
      period: periodName(w, lang),
      dates: `${monthYear(w.start, lang)} – ${monthYear(w.end, lang)}`,
      kind: w.kind,
      meaning: pick(WINDOW_MEANING[w.kind], lang),
      isCurrent: w.isCurrent,
    })),
    precautions: precautions(c, lang),
  };
}

/** Section headings, so both apps title the block the same way. */
export const PROGENY_HEADINGS: Record<"d7" | "dasha" | "precautions", Text> = {
  d7: { ta: "சப்தாம்சம் (D7) சோதனை", en: "Saptamsa (D7) check" },
  dasha: { ta: "தசை: எப்போது அதிகம் தெரியும்", en: "Dasa: when it is felt" },
  precautions: { ta: "கவனிக்க வேண்டியவை", en: "Precautions" },
};

export function progenyHeading(key: keyof typeof PROGENY_HEADINGS, lang: ProgenyLang): string {
  return pick(PROGENY_HEADINGS[key], lang);
}
