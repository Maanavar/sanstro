/**
 * Zone-aware "now" helpers (DASH-01).
 *
 * All panchangam times (sunrise, hora, best windows, kalam spans) are wall-clock
 * times at the chart's panchangam location (current location if set, else birth
 * location — see fetchChartBundle). Comparing them against the *browser's* clock
 * gives a diaspora user (e.g. Toronto browser, Chennai panchangam) a wrong NOW
 * marker, wrong running horai and wrong countdowns. Every "now" comparison on
 * the Today surface must instead be computed in the panchangam timezone via
 * these helpers. Each helper accepts `timeZone: string | null | undefined` and
 * falls back to the browser-local clock when it's absent or invalid, so callers
 * without a resolvable panchangam location keep today's behavior.
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

/** Hour of day (0-23) of `at` in `timeZone`; browser-local when absent/invalid. */
export function hourInZone(at: Date, timeZone?: string | null): number {
  if (timeZone) {
    const parts = zonedParts(at, timeZone);
    if (parts) return parts.hour;
  }
  return at.getHours();
}

/** Minutes since midnight of `at` in `timeZone`; browser-local when absent/invalid. */
export function minutesOfDayInZone(at: Date, timeZone?: string | null): number {
  if (timeZone) {
    const parts = zonedParts(at, timeZone);
    if (parts) return parts.hour * 60 + parts.minute;
  }
  return at.getHours() * 60 + at.getMinutes();
}

/** Offset (ms) such that wall-clock-in-zone = UTC instant + offset, at `at`. */
function zoneOffsetMs(timeZone: string, at: Date): number | null {
  const parts = zonedParts(at, timeZone);
  if (!parts) return null;
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - at.getTime();
}

/**
 * Epoch ms of the wall-clock time `clock` ("HH:MM" or an ISO string with a
 * time part) on calendar date `dateLocal` ("YYYY-MM-DD") in `timeZone`.
 * Without a zone (or with an invalid one) the browser-local interpretation is
 * used — the pre-DASH-01 behavior. Returns null on unparseable input.
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

/** Localized clock label (e.g. "3:41 pm") for `at` in `timeZone`;
 *  browser-local when the zone is absent or invalid. */
export function formatClockInZone(at: Date, locale: string, timeZone?: string | null): string {
  if (timeZone) {
    try {
      return at.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit", timeZone });
    } catch {
      // fall through to the local clock
    }
  }
  return at.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
}
