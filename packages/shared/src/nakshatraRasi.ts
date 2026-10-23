/**
 * Which rasi a nakshatra pada falls in, derived rather than transcribed.
 *
 * A rasi is 30° and a nakshatra 13°20', so each rasi holds exactly nine padas
 * and nine of the 27 nakshatras straddle a rasi boundary. For those nine the
 * star alone does not fix the Moon sign — and porutham's Rasi kuta and the 6/8
 * (Shashtashtaka) note are both judged on the Moon sign. Measured on the
 * backend: of the 405 star pairings that involve a split star, 144 change their
 * 6/8 answer with the pada.
 *
 * Same arithmetic as `nakshatra_to_rasi` in app/calculations/astro.py; the
 * test pins all 108 padas against that function's output.
 */

function assertNakshatra(nakshatra: number): void {
  if (!Number.isInteger(nakshatra) || nakshatra < 1 || nakshatra > 27) {
    throw new RangeError(`nakshatra must be an integer 1-27, received ${nakshatra}`);
  }
}

/** Rasi (1-12) of a nakshatra (1-27) pada (1-4). */
export function nakshatraPadaRasi(nakshatra: number, pada: number): number {
  assertNakshatra(nakshatra);
  if (!Number.isInteger(pada) || pada < 1 || pada > 4) {
    throw new RangeError(`pada must be an integer 1-4, received ${pada}`);
  }
  return Math.floor(((nakshatra - 1) * 4 + (pada - 1)) / 9) + 1;
}

export interface NakshatraPadaGroup {
  /** Rasi (1-12) these padas fall in. */
  rasi: number;
  /** The padas, ascending. */
  padas: number[];
}

/**
 * The nakshatra's padas grouped by rasi: one group for most stars, two for the
 * nine that straddle a boundary. Any pada of a group resolves to its rasi, so
 * a caller may send `group.padas[0]` as the pada.
 */
export function nakshatraPadaGroups(nakshatra: number): NakshatraPadaGroup[] {
  assertNakshatra(nakshatra);
  const groups: NakshatraPadaGroup[] = [];
  for (let pada = 1; pada <= 4; pada += 1) {
    const rasi = nakshatraPadaRasi(nakshatra, pada);
    const last = groups[groups.length - 1];
    if (last && last.rasi === rasi) last.padas.push(pada);
    else groups.push({ rasi, padas: [pada] });
  }
  return groups;
}
