"use client";

// The chart reading panel (Family & Charts §9, and the legacy family deep-dive).
//
// One payload, two lenses (docs/FULL_READING_STORY_MODE_PLAN_2026-10-04.md):
//   - Story view — five chapters organised by the questions a reader has,
//     a picture before each sentence, a visible-word budget;
//   - Astrologer view — the complete ledger, every field the engine computes.
// Nothing is computed differently between them and nothing is dropped; the
// toggle only changes how much is in front of the reader at once.
//
// This file used to be the whole 1,800-line ten-tab panel. The body moved to
// chart-reading/astrologer-view.tsx and its helpers to chart-reading/reading-helpers.ts
// (FTR-05); what remains is the shell both callers mount.

import dynamic from "next/dynamic";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { SkeletonDashboardCard } from "@/components/skeleton";
import { useRequestedDosham } from "@/lib/dosham-deep-link";
import type { Lang } from "@/lib/i18n";
import type {
  ChartCalculateResponseData,
  ChartDoshamInsight,
  ChartExplanationData,
  ChartSummaryData,
  ChartYogaInsight,
  DashaTimelineItem,
  DashaTimelineResponseData,
  PeyarchiEvent,
  SaniCycleData,
  TransitSnapshotData,
} from "@/lib/types";

import { Card } from "./ui/card";
import { Kicker } from "./ui/kicker";
import { Segmented } from "./ui/segmented";
import { Chevron } from "./chart-reading/reading-atoms";
import { displayPlanet, normalizePlanet, ordinalHouse, ordinalSuffix } from "./chart-reading/reading-helpers";
import { storyHeadline } from "./chart-reading/reading-selectors";
import { StoryView, type ReadingLinkTarget } from "./chart-reading/story-view";
import { useReadingView, type ReadingView, type UserMode } from "./chart-reading/use-reading-view";

// Kept importable from here: dashboard-chart-explanation-ashtakavarga.test.ts
// and older call sites reach for them by this path.
export { lagnaRasiNumber, ordinalSuffix, transitBindus } from "./chart-reading/reading-helpers";
export type { ReadingLinkTarget } from "./chart-reading/story-view";
export type { ReadingView } from "./chart-reading/use-reading-view";

// The Astrologer view is the old ten-tab ledger plus the yoga panel, roughly
// three times the Story view's code. It is its own chunk, so a Story reader
// (most of them) never downloads it. The skeleton stands in for its short
// first tab, which is what opens.
const AstrologerView = dynamic(
  () => import("./chart-reading/astrologer-view").then((mod) => mod.AstrologerView),
  { loading: () => <SkeletonDashboardCard lines={3} /> },
);

type ChartExplanationPanelProps = {
  lang: Lang;
  chart: ChartCalculateResponseData;
  explanation?: ChartExplanationData | null;
  summary: ChartSummaryData | null;
  transit: TransitSnapshotData | null;
  sani: SaniCycleData | null;
  peyarchiUpcoming: PeyarchiEvent[];
  dasha: DashaTimelineResponseData | null;
  dashaAntar: DashaTimelineItem[];
  /** Nova passes a Nova-token-styled renderer here so the Yogas section shows
   *  `NovaYogaDoshamPanel` instead of the Classic-token `YogaDoshamPanel`
   *  (docs/NOVA_ONLY_MIGRATION_PLAN.md Phase 3). Classic callers omit it. */
  renderYogaDoshamPanel?: (props: { lang: Lang; yogas: ChartYogaInsight[]; doshams: ChartDoshamInsight[] }) => ReactNode;
  /** Start expanded instead of behind the collapse toggle. Off by default so
      existing callers keep the click-to-open behaviour. */
  defaultOpen?: boolean;
  /** The account's mode — seeds the default lens (TRADITIONAL → Astrologer). */
  mode?: UserMode;
  /** Controlled lens, for a host that gates other panels on it (the Hybrid
   *  page opens its classical-detail panels in the Astrologer view). Omit
   *  both and the panel keeps its own, remembered per device. */
  view?: ReadingView;
  onViewChange?: (view: ReadingView) => void;
  /** Jump to a fuller section elsewhere on the page instead of repeating it
   *  here. Omitted where no such section exists (the legacy family tab). */
  onOpenSection?: (target: ReadingLinkTarget) => void;
};

/** Hook line when the explanation payload is missing — the chart alone. */
function fallbackTeaser(chart: ChartCalculateResponseData, sani: SaniCycleData | null, transit: TransitSnapshotData | null, lang: Lang): string {
  const moon = chart.planets.find((planet) => planet.graha === "MOON") ?? null;
  const moonPhrase = moon
    ? lang === "ta" ? `சந்திரன் ${ordinalHouse(moon.houseFromLagna, lang)}` : `Moon in ${ordinalHouse(moon.houseFromLagna, lang)}`
    : null;
  // The transit feed names Saturn "SANI"; normalizePlanet folds both spellings.
  const saturnFromMoon = sani?.positionFromMoon ?? transit?.transits.find((item) => normalizePlanet(item.graha) === "SATURN")?.houseFromMoon ?? null;
  const saniPhrase =
    saturnFromMoon !== null
      ? lang === "ta" ? `சனி சந்திரனிலிருந்து ${saturnFromMoon}-ஆம் இடம்` : `Saturn is ${ordinalSuffix(saturnFromMoon)} from your Moon`
      : null;
  return [moonPhrase, saniPhrase].filter(Boolean).join("; ");
}

export function ChartExplanationPanel({
  lang,
  chart,
  explanation,
  summary,
  transit,
  sani,
  peyarchiUpcoming,
  dasha,
  dashaAntar,
  renderYogaDoshamPanel,
  defaultOpen = false,
  mode,
  view: controlledView,
  onViewChange,
  onOpenSection,
}: ChartExplanationPanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [ownView, setOwnView] = useReadingView(mode);
  const view = controlledView ?? ownView;
  const setView = onViewChange ?? setOwnView;
  const [today] = useState(() => new Date());

  // Opening/closing (or swapping lens) unmounts a large block; pin the clicked
  // control's viewport position across the change, as collapsible-section.tsx does.
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const anchorEl = useRef<HTMLElement | null>(null);
  const anchorTop = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (anchorTop.current === null || !anchorEl.current) return;
    const drift = anchorEl.current.getBoundingClientRect().top - anchorTop.current;
    if (drift !== 0) window.scrollBy(0, drift);
    anchorEl.current = null;
    anchorTop.current = null;
  }, [open, view]);
  function pinTo(el: HTMLElement | null) {
    anchorEl.current = el;
    anchorTop.current = el ? el.getBoundingClientRect().top : null;
  }

  // "See the full reckoning" (lib/dosham-deep-link): open and switch to the
  // Astrologer view; the view and the card do the rest.
  const requestedDosham = useRequestedDosham();
  useEffect(() => {
    if (!requestedDosham) return;
    setOpen(true);
    setView("astrologer");
    // setView is a stable setter or the host's handler; re-running on the
    // request alone is the intent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedDosham]);

  const backend = explanation ?? null;
  const headline = storyHeadline(backend, lang) ?? fallbackTeaser(chart, sani, transit, lang);
  const maha = backend?.coreIdentity?.currentMahadasha;

  return (
    <Card
      variant="soft"
      style={{
        borderRadius: "var(--radius-md)",
        padding: "var(--space-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 260px", minWidth: 0 }}>
          <Kicker
            as="p"
            color="var(--color-faint)"
            style={{ margin: "0 0 var(--space-1)", fontSize: "var(--text-2xs)", letterSpacing: "0.1em" }}
          >
            {lang === "ta" ? "உங்கள் ஜாதகம், உங்களுக்காக விளக்கம்" : "Your chart, read for you"}
          </Kicker>
          <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "var(--text-lg)", color: "var(--color-text-strong)", lineHeight: 1.45 }}>
            {headline || (maha ? displayPlanet(maha, lang) : "")}
          </p>
        </div>
        {/* Kit variants carry the two states (OD-4 button kind): secondary
            while closed, primary while open. */}
        <button
          ref={toggleRef}
          type="button"
          className={open ? "ui-btn ui-btn--primary" : "ui-btn ui-btn--secondary"}
          aria-expanded={open}
          onClick={() => {
            pinTo(toggleRef.current);
            setOpen((value) => !value);
          }}
          style={{ overflowAnchor: "none", borderRadius: "var(--radius-pill)", fontSize: "var(--text-base)" }}
        >
          <Chevron open={open} />
          {open
            ? (lang === "ta" ? "விளக்கத்தை மூடு" : "Close explanation")
            : (lang === "ta" ? "ஜாதக விளக்கம் திற" : "Open chart explanation")}
        </button>
      </div>

      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", overflowAnchor: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <Segmented<ReadingView>
              ariaLabel={lang === "ta" ? "விளக்க முறை" : "Reading style"}
              value={view}
              onChange={(next) => {
                pinTo(toggleRef.current);
                setView(next);
              }}
              options={[
                // New Tamil, pending native review (Q1).
                { key: "story", label: lang === "ta" ? "எளிய விளக்கம்" : "Story" },
                { key: "astrologer", label: lang === "ta" ? "ஜோதிடர் பார்வை" : "Astrologer view" },
              ]}
            />
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>
              {view === "story"
                ? lang === "ta" ? "முக்கியமானவை மட்டும், படங்களுடன்." : "The essentials, with pictures."
                : lang === "ta" ? "ஒவ்வொரு கணக்கும், முழு விவரத்துடன்." : "Every calculation, in full."}
            </span>
          </div>

          {view === "story" ? (
            <StoryView
              lang={lang}
              chart={chart}
              explanation={backend}
              transit={transit}
              sani={sani}
              peyarchiUpcoming={peyarchiUpcoming}
              today={today}
              onOpenSection={onOpenSection}
              onShowAstrologer={() => {
                pinTo(toggleRef.current);
                setView("astrologer");
              }}
            />
          ) : (
            <AstrologerView
              lang={lang}
              chart={chart}
              explanation={backend}
              summary={summary}
              transit={transit}
              sani={sani}
              peyarchiUpcoming={peyarchiUpcoming}
              dasha={dasha}
              dashaAntar={dashaAntar}
              renderYogaDoshamPanel={renderYogaDoshamPanel}
            />
          )}
        </div>
      )}
    </Card>
  );
}
