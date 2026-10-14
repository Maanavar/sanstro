"use client";

import { useState, type ReactNode } from "react";

import type { Lang } from "@/lib/i18n";
import { useFiveMinuteReading, type ReadingState } from "@/hooks/useChartReading";
import type { FiveMinuteReadingData } from "@vinaadi/shared/api/fiveMinuteReading";
import {
  BasisToggle,
  BeatBlock,
  ReadingShell,
  ReadingSkeleton,
  fourMinuteTitle,
  readingMeta,
} from "./dashboard-reading-shell";

/**
 * "Your Chart in Five Minutes" — docs/FIVE_MINUTE_READING_SPEC_2026-08-11.md.
 *
 * A thin sibling of dashboard-one-minute-reading.tsx, not a generalisation over
 * both: the five-minute reading IS the two-minute reading's own beats extended,
 * not a different kind of object. Since DXA-37 the `.om` markup they shared by
 * copy lives in `dashboard-reading-shell.tsx` and the fetch in
 * `hooks/useChartReading.ts`, so what is left here is only what is true of THIS
 * reading.
 *
 * What it still does NOT have is the pending-question machinery. The backend
 * does send `pendingQuestion` when it withholds the topic beat, but the same
 * question is asked by the two-minute reading on this same card, and
 * `DashboardChartReading` makes an answer given there refetch both lengths —
 * so this view leaves it to that one rather than offering the same form twice.
 *
 * Renders nothing when the endpoint 404s — the flag is off. Every register
 * ships since the owner ruling of 2026-10-06 (family members included), so the
 * title is name-aware exactly as the two-minute one is.
 *
 * Family & Charts reaches this reading through `DashboardChartReading`'s length
 * switch, which fetches BOTH lengths itself and hands this one its `reading`.
 * Mounted without that prop it fetches for itself, which is how any other
 * surface would use it.
 */

export type DashboardFiveMinuteReadingProps = {
  lang: Lang;
  chartId: string;
  onOpenFullChart?: () => void;
  /**
   * Pre-fetched by a parent holding both reading lengths (DXA-37).
   *
   * Passing the state in, rather than letting this component fetch, is what
   * makes the length switch free: crossfading unmounts this view, and a
   * component that owned its own request would re-issue it on every toggle.
   */
  reading?: ReadingState<FiveMinuteReadingData>;
  /** Header controls, left of the basis toggle — the length switch. */
  headerExtra?: ReactNode;
};

export function DashboardFiveMinuteReading({
  lang,
  chartId,
  onOpenFullChart,
  reading,
  headerExtra,
}: DashboardFiveMinuteReadingProps) {
  // Always called, never conditionally — `enabled` is what stands it down when
  // a parent has already fetched.
  const own = useFiveMinuteReading(chartId, { enabled: !reading });
  const { data, status, showSkeleton } = reading ?? own;
  const [showBasis, setShowBasis] = useState(false);

  if (status === "absent") return null;
  if (status === "loading" || !data) return showSkeleton ? <ReadingSkeleton /> : null;

  const hasBasis = data.beats.some((beat) => beat.basis);

  return (
    <ReadingShell
      titleId={`fm-title-${chartId}`}
      title={fourMinuteTitle(lang, data.displayName, data.addressedTo)}
      meta={readingMeta(data.asOf, data.readingWindow?.to ?? "", lang)}
      headerExtra={headerExtra}
      basisToggle={
        hasBasis ? (
          <BasisToggle lang={lang} open={showBasis} onToggle={() => setShowBasis((open) => !open)} />
        ) : null
      }
      nextLabel={lang === "ta" ? data.nextStep.label.ta : data.nextStep.label.en}
      onOpenFullChart={onOpenFullChart}
    >
      {data.beats.map((beat) => (
        <BeatBlock key={beat.id} beat={beat} lang={lang} showBasis={showBasis} />
      ))}
    </ReadingShell>
  );
}
