import { timeOnDateToMs } from "@/lib/tz";
import type { PanchangamDailyResponseData } from "@/lib/types";

type Kalam = PanchangamDailyResponseData["kalam"];
export type KalamWindows = Pick<Kalam, "rahuKalam" | "yamagandam" | "kuligai">;
export type KalamKey = keyof KalamWindows;
export type KalamPhase = "before" | "during" | "after";

export interface ResolvedKalamPeriod {
  key: KalamKey;
  type: "RAHU_KALAM" | "YAMAGANDAM" | "KULIGAI";
  start: string;
  end: string;
  phase: KalamPhase | null;
  remainingMs: number | null;
}

export interface KalamStatus {
  /** The strongest period running now: Rahu Kalam, then Yamagandam, then Kuligai. */
  current: ResolvedKalamPeriod | null;
  /** The next period by clock time when none is running. */
  next: ResolvedKalamPeriod | null;
}

const DEFINITIONS: ReadonlyArray<{
  key: KalamKey;
  type: ResolvedKalamPeriod["type"];
}> = [
  { key: "rahuKalam", type: "RAHU_KALAM" },
  { key: "yamagandam", type: "YAMAGANDAM" },
  { key: "kuligai", type: "KULIGAI" },
];

function stateFor(
  start: string,
  end: string,
  options: { now: Date; dateLocal: string; timeZone?: string | null; isToday: boolean },
): Pick<ResolvedKalamPeriod, "phase" | "remainingMs"> {
  if (!options.isToday) return { phase: null, remainingMs: null };
  const startMs = timeOnDateToMs(options.dateLocal, start, options.timeZone);
  const endMs = timeOnDateToMs(options.dateLocal, end, options.timeZone);
  if (startMs === null || endMs === null) return { phase: null, remainingMs: null };
  const nowMs = options.now.getTime();
  if (nowMs < startMs) return { phase: "before", remainingMs: startMs - nowMs };
  // Panchangam spans are half-open: at the printed end time this period has
  // finished and the next state may begin.
  if (nowMs < endMs) return { phase: "during", remainingMs: endMs - nowMs };
  return { phase: "after", remainingMs: null };
}

/**
 * Resolve the three daylight kalams once for every surface that says “now”.
 *
 * The definition order is the owner-ruled overlap priority, so `.find()` gives
 * Rahu Kalam precedence over Yamagandam, and Yamagandam over Kuligai. Kuligai's
 * meaning is deliberately not decided here; this function reports time state,
 * while the UI gives it the ruled repeat-friendly language.
 */
export function resolveKalamStatus(
  kalam: KalamWindows | null | undefined,
  options: { now: Date; dateLocal: string; timeZone?: string | null; isToday: boolean },
): KalamStatus {
  if (!kalam) return { current: null, next: null };

  const periods = DEFINITIONS.map(({ key, type }) => {
    const slot = kalam[key];
    return {
      key,
      type,
      start: slot.start,
      end: slot.end,
      ...stateFor(slot.start, slot.end, options),
    } satisfies ResolvedKalamPeriod;
  });

  if (!options.isToday) {
    return { current: null, next: periods[0] ?? null };
  }

  const current = periods.find((period) => period.phase === "during") ?? null;
  const next = periods
    .filter((period) => period.phase === "before")
    .sort((a, b) => {
      const aMs = timeOnDateToMs(options.dateLocal, a.start, options.timeZone) ?? Number.MAX_SAFE_INTEGER;
      const bMs = timeOnDateToMs(options.dateLocal, b.start, options.timeZone) ?? Number.MAX_SAFE_INTEGER;
      return aMs - bMs;
    })[0] ?? null;

  return { current, next };
}
