/**
 * Time-of-day artwork ("Two Skies"). The decorative calendar scene follows the
 * reader's actual sky, not the colour theme: a daylit temple tank at noon, the
 * moonlit one at night, whichever theme is on.
 *
 * The theme still matters, but only for *presentation*. Art whose ground
 * matches the page (night art on Nova dark, day art on light) is feathered into
 * the page as atmosphere. Art on the opposite ground cannot blend — a night sky
 * at low opacity over cream is grey fog, which is the defect this replaces — so
 * it is shown whole, as a framed window. See IMG-01 in
 * docs/IMAGERY_AUDIT_AND_ART_DIRECTION_2026-10-14.md.
 */

export type SkyPhase = "dawn" | "day" | "dusk" | "night";

/** Which page ground an artwork was painted for. */
export type ArtGround = "light" | "dark";

export type SkyArt = { src: string; ground: ArtGround };

/**
 * Fixed civil boundaries, local clock, in minutes after midnight. Sunrise
 * across Tamil Nadu stays within ~05:50–06:30 and sunset within ~17:40–18:35
 * all year, so fixed bands are accurate enough for a decorative scene. The
 * reckoned sunrise (upper limb + refraction) is not on the monthly payload and
 * is deliberately not fetched for decoration.
 */
const DAWN_START = 5 * 60 + 15;
const DAY_START = 6 * 60 + 45;
const DUSK_START = 17 * 60 + 30;
const NIGHT_START = 19 * 60;

export function skyPhaseAt(date: Date): SkyPhase {
  const minutes = date.getHours() * 60 + date.getMinutes();
  if (minutes >= DAWN_START && minutes < DAY_START) return "dawn";
  if (minutes >= DAY_START && minutes < DUSK_START) return "day";
  if (minutes >= DUSK_START && minutes < NIGHT_START) return "dusk";
  return "night";
}

/**
 * The temple-tank scene at each hour. `null` = not delivered yet; the phase
 * then borrows its nearest delivered neighbour (see FALLBACK). Only the night
 * master exists today, so every phase currently resolves to it.
 */
export const CALENDAR_SKY_ART: Record<SkyPhase, SkyArt | null> = {
  night: { src: "/calendar/moonlit-temple.png", ground: "dark" },
  day: null,
  dawn: null,
  dusk: null,
};

/** Nearest neighbour first; night is always delivered, so it ends every chain. */
const FALLBACK: Record<SkyPhase, SkyPhase[]> = {
  dawn: ["dawn", "day", "night"],
  day: ["day", "dawn", "night"],
  dusk: ["dusk", "night"],
  night: ["night"],
};

export function skyArtFor(phase: SkyPhase, set: Record<SkyPhase, SkyArt | null> = CALENDAR_SKY_ART): SkyArt {
  for (const candidate of FALLBACK[phase]) {
    const art = set[candidate];
    if (art) return art;
  }
  // Unreachable while night is delivered; typed as a hard failure, not a blank.
  throw new Error("calendar sky art: night master missing");
}
