/**
 * Coordinate parsing for profile forms (DASH-03). The old validation used
 * truthiness (`!parseNumber(v)`), which rejected a legitimate latitude or
 * longitude of exactly 0 — parsed 0 is falsy. Presence and parseability are
 * checked explicitly instead.
 */

/** Parses a form coordinate string. Returns the finite number within
 *  [-bound, bound], or null when empty/unparseable/out of range. */
export function parseCoordinate(value: string, bound: number): number | null {
  if (!value.trim()) return null;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return null;
  if (Math.abs(parsed) > bound) return null;
  return parsed;
}

export function parseLatitude(value: string): number | null {
  return parseCoordinate(value, 90);
}

export function parseLongitude(value: string): number | null {
  return parseCoordinate(value, 180);
}
