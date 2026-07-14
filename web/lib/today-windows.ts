import { timeOnDateToMs } from "@/lib/tz";
import type { DailyGuidanceWindow } from "@/lib/types";

/**
 * Choose which best-window to feature in the Today hero. The backend always
 * lists Abhijit first — a ~48-min slot fixed around solar noon, so it barely
 * moves day to day and made the hero read "12:02–12:50" every single day. We
 * instead prefer the user's own planetary-hora windows (PERSONAL_HORA — keyed
 * to lagna lord + running dasha), which land at a different clock time each
 * weekday, then any benefic hora, and only fall back to Abhijit when nothing
 * personal exists. On today we surface the next window that hasn't ended yet,
 * so the hero stays actionable as the day advances; on other dates we show the
 * first. "Ended yet" is judged in the panchangam timezone (`timeZone`) when
 * given — window times are wall-clock at the panchangam location, not the
 * browser's (DASH-01).
 *
 * NOTE (DASH-10): hiding Abhijit whenever any PERSONAL_HORA window exists is a
 * doctrine deviation queued for jyotishi sign-off — do not "fix" it here
 * without that review.
 */
export function pickFeaturedWindow(
  windows: DailyGuidanceWindow[] | undefined,
  now: Date,
  isToday: boolean,
  dateLocal: string,
  timeZone?: string | null,
): DailyGuidanceWindow | null {
  if (!windows || windows.length === 0) return null;
  const personal = windows.filter((w) => w.type.includes("PERSONAL_HORA"));
  const horas = windows.filter((w) => w.type.includes("HORA"));
  const preferred = personal.length ? personal : horas.length ? horas : windows;
  if (isToday) {
    const upcoming = preferred.find((w) => {
      const endMs = timeOnDateToMs(dateLocal, w.end, timeZone);
      return endMs === null || endMs >= now.getTime();
    });
    return upcoming ?? preferred[preferred.length - 1] ?? null;
  }
  return preferred[0] ?? null;
}
