/**
 * Which check-in strip a surface may show, when more than one is owed.
 *
 * §2.3 of docs/HOME_CALENDAR_CHARTS_PROPOSALS_2026-09-22.md: the life-focus
 * strip (60 days) and the location strip (45 days) must never stack. At most
 * one check-in per visit.
 *
 * The decision lives here rather than in each surface because the two signals
 * arrive from different endpoints — `focusNudgeDue` from the life-mode
 * settings route, the location ones from the dashboard bundle — so every
 * consumer that wanted to obey the rule would otherwise re-derive the same
 * priority, and web and mobile would drift.
 */

export type CheckIn = "location-mismatch" | "location-backstop" | "focus";

export interface CheckInSignals {
  /** The device's timezone disagrees with the one today's timings were built
   *  for. Decided client-side: only the client knows what the device is set
   *  to. */
  locationMismatch?: boolean;
  /** Server-computed backstop (LOCATION_CHECK_DUE_DAYS, R2: 45 days). */
  locationCheckDue?: boolean;
  /** Server-computed life-focus staleness (LIFE_MODE_STALE_DAYS, 60 days). */
  focusNudgeDue?: boolean;
  /** Check-ins this reader has already waved away on this surface. */
  dismissed?: readonly CheckIn[];
}

/**
 * Priority order, strongest claim first.
 *
 * A timezone mismatch outranks everything: the timings on screen are wrong
 * *now*, and every other check-in is a question about upkeep. The 45-day
 * backstop outranks the focus strip because a wrong location makes the
 * numbers wrong, while a stale focus only makes them less pointed.
 */
const PRIORITY: readonly CheckIn[] = ["location-mismatch", "location-backstop", "focus"];

export function pickCheckIn(signals: CheckInSignals): CheckIn | null {
  const dismissed = new Set(signals.dismissed ?? []);
  const owed: Record<CheckIn, boolean> = {
    "location-mismatch": Boolean(signals.locationMismatch),
    "location-backstop": Boolean(signals.locationCheckDue),
    focus: Boolean(signals.focusNudgeDue),
  };
  return PRIORITY.find((slot) => owed[slot] && !dismissed.has(slot)) ?? null;
}

/**
 * Whether the device disagrees with the place the timings were built for.
 *
 * Compares IANA zone ids, not offsets: two zones can share an offset today and
 * diverge at the next DST boundary, and the reader's *place* is what §2 is
 * asking about. A missing or unreadable value on either side is not a
 * mismatch — an absent answer must never provoke the prompt.
 */
export function isLocationMismatch(
  deviceTimeZone: string | null | undefined,
  timingsTimeZone: string | null | undefined,
): boolean {
  if (!deviceTimeZone || !timingsTimeZone) return false;
  return deviceTimeZone !== timingsTimeZone;
}

/**
 * The city part of an IANA zone id, for naming the zone in the prompt and for
 * prefilling the place search.
 *
 * This is a **label and a search seed, never saved coordinates.** A zone names
 * a representative city, not the reader's city — `Asia/Kolkata` covers Chennai,
 * and a reader on `America/Los_Angeles` may be in San Diego. Owner ruling
 * (2026-09-22): accepting the prompt opens the place picker prefilled with
 * this, and the reader confirms an actual place, so the saved location is one
 * a human chose rather than one a timezone implied.
 */
export function timeZoneCityLabel(timeZone: string | null | undefined): string {
  if (!timeZone) return "";
  const segments = timeZone.split("/");
  const last = segments[segments.length - 1] ?? "";
  return last.replace(/_/g, " ");
}
