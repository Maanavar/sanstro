/**
 * Zone-aware wall-clock math shared between web and mobile (DASH-01 on web;
 * extracted 2026-09-22 so mobile's kalam reminders can resolve the same
 * instant web's hero/ribbon do, instead of a second copy that can drift).
 *
 * Panchangam times (sunrise, hora, kalam spans) are wall-clock times at the
 * chart's panchangam location. Comparing them against the *device's* clock
 * gives a diaspora reader (e.g. Toronto device, Chennai panchangam) a wrong
 * instant. Callers pass `timeZone: string | null | undefined` and fall back
 * to the device-local clock when it is absent or invalid.
 */

type ZonedParts = {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
  second: number;
};

const partsFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getPartsFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = partsFormatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    partsFormatterCache.set(timeZone, formatter);
  }
  return formatter;
}

/** Wall-clock parts of `at` in `timeZone`. Returns null when the zone id is
 *  invalid rather than throwing, so callers can fall back to the local clock. */
export function zonedParts(at: Date, timeZone: string): ZonedParts | null {
  try {
    const parts = getPartsFormatter(timeZone).formatToParts(at);
    const read = (type: Intl.DateTimeFormatPartTypes): number =>
      Number.parseInt(parts.find((p) => p.type === type)?.value ?? "", 10);
    const hour = read("hour");
    return {
      year: read("year"),
      month: read("month"),
      day: read("day"),
      // Some ICU builds report midnight as 24 with hour12: false.
      hour: hour === 24 ? 0 : hour,
      minute: read("minute"),
      second: read("second"),
    };
  } catch {
    return null;
  }
}

/** Offset (ms) such that wall-clock-in-zone = UTC instant + offset, at `at`. */
export function zoneOffsetMs(timeZone: string, at: Date): number | null {
  const parts = zonedParts(at, timeZone);
  if (!parts) return null;
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - at.getTime();
}

/**
 * Epoch ms of the wall-clock time `clock` ("HH:MM" or an ISO string with a
 * time part) on calendar date `dateLocal` ("YYYY-MM-DD") in `timeZone`.
 * Without a zone (or with an invalid one) the device-local interpretation is
 * used. Returns null on unparseable input.
 */
export function timeOnDateToMs(dateLocal: string, clock: string, timeZone?: string | null): number | null {
  const timePart = clock.includes("T") ? clock.split("T")[1] : clock;
  const [hhStr, mmStr] = (timePart ?? "").split(":");
  if (hhStr === undefined || mmStr === undefined) return null;
  const hh = Number.parseInt(hhStr, 10);
  const mm = Number.parseInt(mmStr, 10);
  const [yStr, moStr, dStr] = dateLocal.split("-");
  const y = Number.parseInt(yStr ?? "", 10);
  const mo = Number.parseInt(moStr ?? "", 10);
  const d = Number.parseInt(dStr ?? "", 10);
  if (![hh, mm, y, mo, d].every(Number.isFinite)) return null;

  if (timeZone) {
    // Guess the instant as if the zone were UTC, then correct by the zone's
    // offset at that instant; one refinement pass handles DST boundaries.
    const utcGuess = Date.UTC(y, mo - 1, d, hh, mm, 0);
    const firstOffset = zoneOffsetMs(timeZone, new Date(utcGuess));
    if (firstOffset !== null) {
      const candidate = utcGuess - firstOffset;
      const refinedOffset = zoneOffsetMs(timeZone, new Date(candidate));
      return refinedOffset !== null ? utcGuess - refinedOffset : candidate;
    }
  }

  const local = new Date(
    `${dateLocal}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`,
  );
  const ms = local.getTime();
  return Number.isNaN(ms) ? null : ms;
}
