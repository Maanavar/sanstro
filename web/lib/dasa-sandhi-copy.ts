/**
 * FAA-31 copy: dasa sandhi, the junction where one mahadasa hands over to the
 * next. Composed here so the server never chooses a name (CLAUDE.md display
 * boundary). Mirrored for the PDF by app/services/dasa_sandhi_copy.py; both
 * reproduce tests/golden/dasa_sandhi/dasa_sandhi_copy.json.
 *
 * Describes and times only (spec §0.4). No score, no dosham, no parihara, no
 * veto on the match, and nothing about mortality or lifespan (EC-RULING-06).
 * The thresholds are a vendor-documented practice, not doctrine, and the copy
 * says so.
 */
import type { DasaSandhi, DasaSandhiPair } from "@vinaadi/shared";
import { tPlanetLord } from "./i18n";
import type { Lang } from "./i18n";

/** Days per month, the same fraction of the Julian year the engine uses, so a
 *  gap reads the same here as the band that was decided from it. */
const DAYS_PER_MONTH = 365.25 / 12;

/** A day count as months, to one decimal; "x months" / "x month" in English. */
export function sandhiMonths(days: number, lang: Lang): string {
  const m = Math.abs(days) / DAYS_PER_MONTH;
  const n = m.toFixed(1).replace(/\.0$/, "");
  if (lang === "ta") return `${n} மாதம்`;
  return `${n} ${n === "1" ? "month" : "months"}`;
}

export const DASA_SANDHI_HEADING: Record<Lang, string> = {
  en: "When each chart's mahadasa changes",
  ta: "மகாதசை மாறும் காலங்கள்",
};

export const DASA_SANDHI_INTRO: Record<Lang, string> = {
  en: "A mahadasa is a long planetary period, and the handover from one to the next is called dasa sandhi. One matching practice looks at whether both partners' handovers fall close together in the years after marriage, and reads that as a period of change for both at once. We list the dates here so your astrologer can read them against the two charts. This is that practice's way of looking, not a rule from the classical texts; it is not a dosham, it changes no score, and it says nothing about whether to marry.",
  ta: "மகாதசை என்பது ஒரு நீண்ட கிரக காலம்; ஒன்று முடிந்து அடுத்தது தொடங்கும் இடைவெளியைத் தசா சந்தி என்பார்கள். திருமணத்திற்குப் பிறகு இருவருக்கும் இந்த மாற்றங்கள் அருகருகே வருகிறதா என்று பார்க்கும் ஒரு பொருத்த வழக்கம் உண்டு; அப்படி வந்தால் இருவருக்கும் ஒரே நேரத்தில் மாற்றங்கள் நிறைந்த காலம் என்று அது படிக்கிறது. ஜோதிடர் இரு ஜாதகங்களுடன் சேர்த்துப் பார்க்க அந்தத் தேதிகளை இங்கே தந்துள்ளோம். இது அந்த வழக்கத்தின் பார்வை; சாஸ்திர விதி அல்ல. இது தோஷம் அல்ல, மதிப்பெண்ணை மாற்றாது, திருமணம் செய்யலாமா என்பதைப் பற்றி எதுவும் சொல்லவில்லை.",
};

/** The couple's summary line. `band` is the closest pair; null = none flagged. */
export function dasaSandhiBandLine(d: DasaSandhi, lang: Lang): string {
  if (d.band === "CLOSE") {
    return lang === "en"
      ? "The two mahadasa changes fall close together, under six months apart. Read them alongside each whole chart with your astrologer."
      : "இரு மகாதசை மாற்றங்களும் அருகருகே — ஆறு மாதத்திற்கு உள்ளாகவே — வருகின்றன. ஒவ்வொரு ஜாதகத்தையும் முழுமையாகப் பார்த்து ஜோதிடரிடம் இவற்றைச் சேர்த்துக் கேளுங்கள்.";
  }
  if (d.band === "NEAR") {
    return lang === "en"
      ? "The two mahadasa changes fall near each other, between six and twelve months apart. Read them alongside the individual charts."
      : "இரு மகாதசை மாற்றங்களும் ஆறு முதல் பன்னிரண்டு மாதங்களுக்குள், ஒன்றுக்கொன்று அருகில் வருகின்றன. தனித்தனி ஜாதகங்களுடன் சேர்த்து இவற்றைப் பாருங்கள்.";
  }
  return lang === "en"
    ? `No two mahadasa changes fall within twelve months of each other in the next ${d.horizonYears} years.`
    : `அடுத்த ${d.horizonYears} ஆண்டுகளில் இரு மகாதசை மாற்றங்களும் பன்னிரண்டு மாதங்களுக்கு உள்ளாக அருகருகே வருவதில்லை.`;
}

/** The horizon the dates were taken over. */
export function dasaSandhiHorizon(d: DasaSandhi, lang: Lang): string {
  return lang === "en"
    ? `Taken over the next ${d.horizonYears} years (${d.horizonStart} to ${d.horizonEnd}).`
    : `அடுத்த ${d.horizonYears} ஆண்டுகளுக்கு (${d.horizonStart} முதல் ${d.horizonEnd} வரை) எடுக்கப்பட்டது.`;
}

/** One pair: each partner's handover, then the gap the band came from. */
export function dasaSandhiPairLine(p: DasaSandhiPair, nameA: string, nameB: string, lang: Lang): string {
  const a = `${tPlanetLord(p.outgoingA, lang)} → ${tPlanetLord(p.incomingA, lang)}`;
  const b = `${tPlanetLord(p.outgoingB, lang)} → ${tPlanetLord(p.incomingB, lang)}`;
  const gap = sandhiMonths(p.changeGapDays, lang);
  return lang === "en"
    ? `${nameA}: ${a} on ${p.changeA}. ${nameB}: ${b} on ${p.changeB}. The two changes are ${gap} apart.`
    : `${nameA}: ${p.changeA} அன்று ${a}. ${nameB}: ${p.changeB} அன்று ${b}. இரு மாற்றங்களுக்கும் இடையே ${gap}.`;
}

/**
 * The supplementary window measure, shown beside the pair. It never decides
 * the band (spec §0.2: the practice's own sample rates a couple with a
 * 5.8-month window gap as satisfactory).
 *
 * **It restates the primary gap, it does not add to it.** With a six-month
 * span either side, the overlap is exactly twelve months minus the change-point
 * gap, so on the ruled configuration a flagged pair's windows always overlap
 * and this line carries no independent information. The copy says so rather
 * than presenting one fact as two. The "apart" branch is unreachable while the
 * window is A_FIXED +/- 6 months; it is kept for the other window options.
 */
export function dasaSandhiWindowLine(p: DasaSandhiPair, lang: Lang): string {
  const gap = sandhiMonths(p.windowGapDays, lang);
  const spans = `${p.windowAStart} – ${p.windowAEnd}, ${p.windowBStart} – ${p.windowBEnd}`;
  if (p.windowsOverlap) {
    return lang === "en"
      ? `Seen as spans — six months either side of each change (${spans}) — they overlap by ${gap}. That restates the gap above rather than adding to it: with a six-month span, the overlap is always twelve months less the gap.`
      : `காலப்பகுதிகளாகப் பார்த்தால் — ஒவ்வொரு மாற்றத்துக்கும் இருபுறமும் ஆறு மாதம் (${spans}) — இவை ${gap} ஒன்றையொன்று மறைக்கின்றன. இது மேலே உள்ள இடைவெளியையே வேறு வகையில் சொல்கிறது, கூடுதல் தகவல் அல்ல: ஆறு மாதக் கணக்கில் இந்த மறைவு எப்போதும் பன்னிரண்டு மாதத்தில் அந்த இடைவெளியைக் கழித்ததே.`;
  }
  return lang === "en"
    ? `Seen as spans — six months either side of each change (${spans}) — they stay ${gap} apart.`
    : `காலப்பகுதிகளாகப் பார்த்தால் — ஒவ்வொரு மாற்றத்துக்கும் இருபுறமும் ஆறு மாதம் (${spans}) — இவற்றுக்கு இடையே ${gap} இடைவெளி உள்ளது.`;
}

/** The closing note. Says what this is not. */
export const DASA_SANDHI_NOTE: Record<Lang, string> = {
  en: "These are dates to read, not a finding against the match. A mahadasa change is a period of change in anyone's life, and both charts keep running their own periods either way. Nothing here is a dosham, and there is no remedy to buy for it.",
  ta: "இவை படிக்க வேண்டிய தேதிகள்; பொருத்தத்திற்கு எதிரான குறிப்பு அல்ல. மகாதசை மாற்றம் யாருடைய வாழ்க்கையிலும் மாற்றங்கள் நிறைந்த காலம்; எப்படியிருந்தாலும் இரு ஜாதகங்களும் அவற்றின் சொந்தக் காலங்களைத் தொடர்ந்து நடத்தும். இங்கு எதுவும் தோஷம் அல்ல; இதற்காக வாங்க வேண்டிய பரிகாரமும் இல்லை.",
};
