/**
 * Which years the public `/tamil-calendar` event pages serve.
 *
 * The backend computes any year in 2020-2045 (`PUBLISHED_YEARS` in
 * `app/services/panchangam_events_service.py`), but a cold year costs it ~15 s
 * of ephemeris, so the web serves a window around today instead of the whole
 * range: last year (pages already indexed keep answering), this year, and next
 * year (people search "pournami 2027" from October). Anything else is a 404.
 *
 * "This year" is the year in India, not the server's clock: a build running in
 * UTC on 31 Dec at 20:00 is already 1 Jan in Chennai.
 */

export const TAMIL_CALENDAR_EVENT_KEYS = [
  "pournami",
  "amavasai",
  "pradosham",
  "ekadhasi",
  "sankatahara-chathurthi",
  "chathurthi",
  "sashti",
  "ashtami",
  "navami",
  "karthigai",
  "thiruvonam",
  "maadha-sivarathiri",
  "chandra-darisanam",
  "karinaal",
] as const;

export type TamilCalendarEventKey = (typeof TAMIL_CALENDAR_EVENT_KEYS)[number];

/** Mirrors the backend's `PUBLISHED_YEARS` (2020-2045 inclusive). */
export const BACKEND_FIRST_YEAR = 2020;
export const BACKEND_LAST_YEAR = 2045;

export function calendarYearNow(now: Date = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric" }).format(now));
}

/** Last year, this year and next year, clipped to what the backend publishes. */
export function servedCalendarYears(now: Date = new Date()): number[] {
  const current = calendarYearNow(now);
  return [current - 1, current, current + 1].filter((y) => y >= BACKEND_FIRST_YEAR && y <= BACKEND_LAST_YEAR);
}

/** This year and next: the years the sitemap lists and the build prerenders. */
export function promotedCalendarYears(now: Date = new Date()): number[] {
  const current = calendarYearNow(now);
  return servedCalendarYears(now).filter((y) => y >= current);
}

export function eventSlug(key: string, year: number): string {
  return `${key}-${year}`;
}

/** `pournami-2027` → `{ key: "pournami", year: 2027 }`; null for anything the web does not serve. */
export function parseEventSlug(
  slug: string,
  now: Date = new Date(),
): { key: TamilCalendarEventKey; year: number } | null {
  const match = /^([a-z-]+)-(\d{4})$/.exec(slug);
  if (!match) return null;
  const key = TAMIL_CALENDAR_EVENT_KEYS.find((k) => k === match[1]);
  const year = Number(match[2]);
  if (!key || !servedCalendarYears(now).includes(year)) return null;
  return { key, year };
}
