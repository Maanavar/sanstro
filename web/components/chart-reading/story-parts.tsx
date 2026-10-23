"use client";

// Shared pieces for the Story chapters (FTR-09). Kept apart from story-view so
// the chapters and the view that hosts them do not import each other.

import type { CSSProperties, ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import type { Lang } from "@/lib/i18n";
import type {
  ChartCalculateResponseData,
  ChartExplanationData,
  PeyarchiEvent,
  SaniCycleData,
  TransitSnapshotData,
} from "@/lib/types";

/** Sections elsewhere on the page a chapter can point to instead of repeating
 *  them (plan principle 7, "say it once"). The host decides what exists. */
export type ReadingLinkTarget = "planets" | "dasha" | "remedies" | "forecast" | "strengths";

export type StoryProps = {
  lang: Lang;
  chart: ChartCalculateResponseData;
  explanation: ChartExplanationData | null;
  transit: TransitSnapshotData | null;
  sani: SaniCycleData | null;
  peyarchiUpcoming: PeyarchiEvent[];
  today: Date;
  onOpenSection?: (target: ReadingLinkTarget) => void;
  onShowAstrologer: () => void;
};

/** Small uppercase label over a card. */
export function StoryKicker({ children }: { children: ReactNode }) {
  return (
    <p style={{ margin: 0, fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-faint)" }}>
      {children}
    </p>
  );
}

/** A card that leads with its visual. No accent left-border (owner ruling). */
export function StoryCard({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
        padding: "var(--space-3) var(--space-4)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        minWidth: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** "Open X on this page ↑" — used where a fuller version already exists above. */
export function SeeAlso({ label, onClick }: { label: string; onClick?: () => void }) {
  if (!onClick) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        alignSelf: "flex-start",
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-1)",
        padding: 0,
        border: "none",
        background: "transparent",
        color: "var(--color-accent-strong)",
        fontFamily: "inherit",
        fontSize: "var(--text-sm)",
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {label}
      <ArrowRight size={14} aria-hidden />
    </button>
  );
}

export const bodyText: CSSProperties = {
  margin: 0,
  fontSize: "var(--text-base)",
  lineHeight: 1.55,
  color: "var(--color-text)",
};

export const quietText: CSSProperties = {
  margin: 0,
  fontSize: "var(--text-sm)",
  lineHeight: 1.5,
  color: "var(--color-muted)",
};

/** Text for assistive tech only — the visual carries the same fact as a mark. */
export const srOnly: CSSProperties = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};
