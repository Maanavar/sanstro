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
 *
 * `zonedParts`, `zoneOffsetMs` and `timeOnDateToMs` live in
 * `@vinaadi/shared/utils/tz` so mobile's kalam reminders resolve the same
 * instant this file does, instead of a second copy that can drift; re-exported
 * here so existing web imports are unchanged.
 */
export { zonedParts, timeOnDateToMs } from "@vinaadi/shared/utils/tz";
import { zonedParts } from "@vinaadi/shared/utils/tz";

/** Calendar date of `at` in `timeZone` as "YYYY-MM-DD"; browser-local when the
 *  zone is absent or invalid.
 *
 *  Needed to answer "is the selected date today?" the way every other time on
 *  the panchangam surfaces is answered — at the panchangam location, not in the
 *  browser's zone. A reader in Toronto looking at a Chennai panchangam is on the
 *  Chennai day, and comparing against their own local date would promote the
 *  live limb on the wrong day. */
export function toDateKeyInZone(at: Date, timeZone?: string | null): string {
  const pad = (n: number): string => String(n).padStart(2, "0");
  if (timeZone) {
    const parts = zonedParts(at, timeZone);
    if (parts) return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
  }
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
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
