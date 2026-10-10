import type { Lang } from "@/lib/i18n";
import type { AlmanacMuhurtham } from "@/lib/types";

/**
 * How to say whether the printed almanac also lists a wedding day.
 *
 * §3 of docs/HOME_CALENDAR_CHARTS_PROPOSALS_2026-09-22.md. The astrologer's
 * reading: for a wedding, **being on the almanac list is a gate, not a bonus
 * point** — most Tamil families will not accept a date the almanac does not
 * list, however good its computed score. So this is reported beside the score
 * and contributes nothing to it.
 *
 * The wording lives here rather than in either renderer because two surfaces
 * show wedding slots from the same endpoint — the signed-in picker and the
 * public muhurta calculator — and they are built in different design systems
 * (Nova `--color-*` tokens, marketing `--cl-*` tokens). A doctrine answer
 * applied to one of two surfaces is the DXA-08 failure this repo has recorded
 * twice, so the tone and the words are decided once and each surface paints
 * them with its own tokens.
 */
export interface AlmanacMuhurthamLabel {
  /** `listed` earns visible emphasis; `quiet` is a faint one-liner. */
  tone: "listed" | "quiet";
  status: AlmanacMuhurtham["status"];
  text: string;
  /** The almanac's own fortnight, Tamil-named. Only for `ON_LIST`. */
  pirai: string | null;
}

/**
 * Null when there is nothing to say: every non-wedding activity, since the
 * sourced sheets are wedding sheets and "not on the list" is a meaningless
 * verdict on a day someone picked for an exam.
 */
export function almanacMuhurthamLabel(
  almanac: AlmanacMuhurtham | null | undefined,
  lang: Lang,
): AlmanacMuhurthamLabel | null {
  if (!almanac) return null;

  if (almanac.status === "ON_LIST") {
    return {
      tone: "listed",
      status: "ON_LIST",
      text: lang === "ta" ? "பஞ்சாங்க முகூர்த்த நாள்" : "Almanac muhurtham day",
      // Tamil almanac naming, not Sanskrit (owner ruling): வளர்பிறை / தேய்பிறை,
      // never Shukla / Krishna. The fortnight comes from the almanac entry
      // itself rather than being re-derived from the day's tithi.
      pirai: almanac.pirai
        ? lang === "ta"
          ? almanac.pirai === "VALARPIRAI" ? "வளர்பிறை" : "தேய்பிறை"
          : almanac.pirai === "VALARPIRAI" ? "Valarpirai" : "Theipirai"
        : null,
    };
  }

  // Both remaining states are quiet, and they are two states rather than one
  // boolean on purpose. A result list of well-scored dates must not read as a
  // wall of faults — the almanac's silence is a fact for the family to weigh,
  // not an error in the date — and telling a family their date failed a list
  // nobody has published would be worse than saying nothing at all.
  return {
    tone: "quiet",
    status: almanac.status,
    text:
      almanac.status === "NO_SHEET"
        ? lang === "ta"
          ? "இந்த ஆண்டின் முகூர்த்த நாள் பட்டியல் இதுவரை சேர்க்கப்படவில்லை"
          : "No almanac muhurtham list sourced for this year yet"
        : lang === "ta"
          ? "பஞ்சாங்க முகூர்த்த நாள் பட்டியலில் இல்லை"
          : "Not on the almanac muhurtham list",
    pirai: null,
  };
}
