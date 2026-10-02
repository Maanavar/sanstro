"use client";

import { useCallback, useState } from "react";

import type { Lang } from "@/lib/i18n";
import { useFiveMinuteReading, useOneMinuteReading } from "@/hooks/useChartReading";
import { DashboardFiveMinuteReading } from "./dashboard-five-minute-reading";
import { DashboardOneMinuteReading } from "./dashboard-one-minute-reading";
import { READING_MINUTES, ReadingSkeleton } from "./dashboard-reading-shell";
import { Segmented } from "./ui/segmented";
import { ViewSwap } from "./ui/view-swap";

/**
 * One reading, with a length switch (DXA-37, owner decision D4).
 *
 * Family & Charts used to stack `DashboardOneMinuteReading` and
 * `DashboardFiveMinuteReading`, so a reader reached the end of their reading
 * and immediately started the same reading again at twice the length — the long
 * one is not a different piece, it is the short one's own beats extended
 * (ratio median 2.01 across 120 charts). D4: one reading, and the length is the
 * reader's choice.
 *
 * Three things here are less obvious than they look:
 *
 * 1. **The switch is conditional.** The four-minute endpoint 404s for any
 *    register but "self" and whenever its flag is off, so on a family member's
 *    chart there is no long reading at all. Offering a control that leads
 *    nowhere is worse than offering none, so the switch appears only once the
 *    long reading has actually loaded.
 * 2. **Both readings are fetched, and held.** That is what the hooks are for.
 *    The switch has to know whether the long reading exists before it can be
 *    drawn, and holding both means toggling never re-requests anything.
 * 3. **No scroll anchor, and that is measured.** The item asked for one, since
 *    the long body is ~2x the short. With the page scroll settled the swap
 *    moves the reading's top by 0px in both directions — a view grows and
 *    shrinks below its own header. See `ui/view-swap.tsx`.
 *
 * Today is deliberately NOT this component. It keeps rendering
 * `DashboardOneMinuteReading` with `collapseWhenRead`, because a daily surface's
 * contract is that what is on it changed since yesterday — a length switch on a
 * reading that holds until March is a choice about something the reader is not
 * there to do.
 */

type Length = "short" | "long";

/** Per viewer, not per chart: it is a reading preference, not a fact about a chart. */
const LENGTH_KEY = "vinaadi-reading-length";

function loadLength(): Length {
  try {
    return localStorage.getItem(LENGTH_KEY) === "long" ? "long" : "short";
  } catch {
    // Private mode, storage disabled. Default to the short reading, which is
    // also what a first-time reader gets.
    return "short";
  }
}

function saveLength(value: Length): void {
  try {
    localStorage.setItem(LENGTH_KEY, value);
  } catch {
    /* Nothing to do — the choice simply does not survive this visit. */
  }
}

export type DashboardChartReadingProps = {
  lang: Lang;
  chartId: string;
  /** Navigates to the full chart; omit on surfaces that already are it. */
  onOpenFullChart?: () => void;
};

export function DashboardChartReading({
  lang,
  chartId,
  onOpenFullChart,
}: DashboardChartReadingProps) {
  // Both readings are fetched here and handed down, so the two views stay
  // presentational and a toggle never re-requests anything.
  const short = useOneMinuteReading(chartId);
  const long = useFiveMinuteReading(chartId);

  // Read synchronously so a reader who chose "4 min" last visit does not watch
  // the short reading paint first and then swap under them.
  const [length, setLength] = useState<Length>(() =>
    typeof window === "undefined" ? "short" : loadLength(),
  );
  const chooseLength = useCallback((value: Length) => {
    setLength(value);
    saveLength(value);
  }, []);

  const hasLong = long.status === "ready" && !!long.data;
  const hasShort = short.status === "ready" && !!short.data;
  // A remembered "long" must not strand the reader on a blank when they select
  // a family member whose chart has no long reading.
  const shown: Length = hasLong && length === "long" ? "long" : "short";

  if (short.status === "absent" && long.status === "absent") return null;
  if (!hasShort && !hasLong) {
    return short.showSkeleton || long.showSkeleton ? <ReadingSkeleton /> : null;
  }

  const lengthSwitch = hasLong ? (
    <Segmented<Length>
      options={[
        // The labels read the same constant as the titles, so a re-measured
        // reading can never advertise two different numbers for itself.
        //
        // Tamil writes a numeral duration with the SINGULAR here — `${m}
        // நிமிடம்` is what lib/public-today.ts and mobile's inbox already
        // render — and spells the word out in the plural only in prose, which
        // is the register the H2 beside this control is in
        // ("இரண்டு நிமிடங்களில்"). Control and title therefore differ on
        // purpose; they are not two spellings of one string.
        { key: "short", label: lang === "ta" ? `${READING_MINUTES.short} நிமிடம்` : `${READING_MINUTES.short} min` },
        { key: "long", label: lang === "ta" ? `${READING_MINUTES.long} நிமிடம்` : `${READING_MINUTES.long} min` },
      ]}
      value={shown}
      onChange={chooseLength}
      ariaLabel={lang === "ta" ? "வாசிப்பு நேரம்" : "Reading length"}
    />
  ) : null;

  return (
    <ViewSwap viewKey={shown}>
      {shown === "long" ? (
        <DashboardFiveMinuteReading
          lang={lang}
          chartId={chartId}
          reading={long}
          headerExtra={lengthSwitch}
          onOpenFullChart={onOpenFullChart}
        />
      ) : (
        <DashboardOneMinuteReading
          lang={lang}
          chartId={chartId}
          reading={short}
          headerExtra={lengthSwitch}
          onOpenFullChart={onOpenFullChart}
        />
      )}
    </ViewSwap>
  );
}
