/**
 * FAA-33 copy: one line per cross-chart observation, composed here so the
 * server never chooses a name (CLAUDE.md display boundary). `rasi` and `graha`
 * are the SOURCE chart's (X of X->Y).
 *
 * Advisory voice: lines state where a point falls. Nothing here says a pair is
 * "meant for each other" or that a placement rules a marriage in or out.
 */
import type { CrossChartObservation } from "@vinaadi/shared";
import { rasiDisplayName } from "./chart-utils";
import { tPlanetLord } from "./i18n";
import type { Lang } from "./i18n";

function ordEn(n: number): string {
  const s = n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
  return `${n}${s}`;
}

/** Overlay rows (Venus, Guru) ask one question: on the partner's 7th or not.
 *  Off the 7th they say nothing, so the card hides them. */
export function crossChartRowVisible(o: CrossChartObservation): boolean {
  return !(o.key === "VENUS" || o.key === "JUPITER") || o.houseFromLagna === 7;
}

export function crossChartLine(o: CrossChartObservation, src: string, dst: string, lang: Lang): string {
  const sign = rasiDisplayName(o.rasi, lang);
  const graha = o.graha ? tPlanetLord(o.graha, lang) : "";
  const fromMoon = o.houseFromMoon != null;
  const n = (fromMoon ? o.houseFromMoon : o.houseFromLagna) ?? 0;

  if (lang === "en") {
    const ref = fromMoon ? `${dst}'s Moon sign` : `${dst}'s lagna`;
    switch (o.key) {
      case "SEVENTH_LORD":
        return `${src}'s 7th lord ${graha} (in ${sign}) falls in the ${ordEn(n)} house from ${ref}.`;
      case "LAGNA":
        return `${src}'s lagna, ${sign}, is the ${ordEn(n)} house from ${ref}.`;
      case "MOON":
        return `${src}'s Moon sign, ${sign}, is the ${ordEn(n)} from ${ref}.`;
      default:
        return `${src}'s ${graha} (in ${sign}) falls on ${dst}'s 7th house.`;
    }
  }

  const ref = fromMoon ? `${dst} ஜாதகத்தில் ராசியிலிருந்து` : `${dst} ஜாதகத்தில் லக்னத்திலிருந்து`;
  switch (o.key) {
    case "SEVENTH_LORD":
      return `${src} ஜாதகத்தின் 7ஆம் அதிபதி ${graha} (${sign}), ${ref} ${n}ஆம் இடத்தில் வருகிறது.`;
    case "LAGNA":
      return `${src} ஜாதகத்தின் லக்னம் ${sign}, ${ref} ${n}ஆம் இடம்.`;
    case "MOON":
      return `${src} ஜாதகத்தின் ராசி ${sign}, ${ref} ${n}ஆம் இடம்.`;
    default:
      return `${src} ஜாதகத்தின் ${graha} (${sign}), ${dst} ஜாதகத்தின் 7ஆம் இடத்தில் வருகிறது.`;
  }
}

/** What the house is about, in plain words (owner 2026-11-11: category words
 *  like "Context" or "Secondary support" told the reader nothing). Meanings
 *  follow the rulings' table (1 personal, 5 affection, 7 partnership,
 *  9 dharma, 11 gains). The 8th is "sudden changes" only: EC-RULING-06 keeps
 *  lifespan out. */
const HOUSE_MEANING: Record<number, [string, string]> = {
  1: ["Personal closeness", "நெருக்கம், தனிப்பட்ட இணைப்பு"],
  2: ["Family and speech", "குடும்பம், பேச்சு"],
  3: ["Effort and courage", "முயற்சி, தைரியம்"],
  4: ["Home and peace of mind", "வீடு, மன நிம்மதி"],
  5: ["Affection", "அன்பு, பாசம்"],
  6: ["Differences to work through", "சரிசெய்ய வேண்டிய கருத்து வேறுபாடுகள்"],
  7: ["Partnership", "இல்லறத் துணை"],
  8: ["Sudden changes", "எதிர்பாராத மாற்றங்கள்"],
  9: ["Fortune and shared values", "பாக்கியம், தர்மம்"],
  10: ["Work and standing", "தொழில், மதிப்பு"],
  11: ["Gains and fulfilment", "லாபம், நிறைவு"],
  12: ["Expenses and distance", "செலவு, விலகல்"],
};

/** How to read it: favourable for 1/5/7/9/11, neutral for 2/3/4/10, and for
 *  6/8/12 a pointer to the astrologer, never a rejection. */
export function crossChartTone(o: CrossChartObservation): "favourable" | "neutral" | "ask" {
  const n = o.houseFromLagna ?? o.houseFromMoon ?? 0;
  if (o.status === "SUPPORT" || n === 11) return "favourable";
  if (o.status === "NOTE") return "ask";
  return "neutral";
}

/** Badge text: the house's meaning, then how to read it. */
export function crossChartBadge(o: CrossChartObservation, lang: Lang): string {
  const n = o.houseFromLagna ?? o.houseFromMoon ?? 0;
  const [mEn, mTa] = HOUSE_MEANING[n] ?? ["", ""];
  const tone = crossChartTone(o);
  if (lang === "en") {
    const t = { favourable: "favourable", neutral: "neutral", ask: "ask your astrologer about this" }[tone];
    return `${mEn} (${t})`;
  }
  const t = { favourable: "சாதகம்", neutral: "பொது", ask: "ஜோதிடரிடம் கேட்கவும்" }[tone];
  return `${mTa} (${t})`;
}
