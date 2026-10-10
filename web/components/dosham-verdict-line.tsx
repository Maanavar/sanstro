"use client";

import { ArrowRight } from "lucide-react";

import type { Lang } from "@/lib/i18n";
import type { ChartDoshamInsight } from "@/lib/types";
import { requestDoshamCard } from "@/lib/dosham-deep-link";
import { doshamVerdictLine } from "@vinaadi/shared/doshamReckoning";

/**
 * L2 of the dosham explanation (plan 2026-10-06): the one-line verdict under a
 * chip, and the way to the full reckoning. Used on every summary surface —
 * Story, the reading's "Yogas, strengths & remedies", Life Areas — so the
 * question "how serious is my Sevvai?" is answered where it is asked, and the
 * full card is one click away and opens itself (lib/dosham-deep-link).
 *
 * Renders nothing for doshams without an L2 (only Sevvai and Rahu–Ketu have
 * one) or for a payload that predates the reference rows.
 */
export function DoshamVerdictLine({
  dosham,
  lang,
  onNavigate,
  compact = false,
}: {
  dosham: ChartDoshamInsight;
  lang: Lang;
  /** Called after the request is made, for a host that must first switch tab or scroll. */
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const line = doshamVerdictLine(dosham, lang);
  if (!line) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", minWidth: 0 }}>
      <p style={{ margin: 0, fontSize: compact ? "var(--text-xs)" : "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.5 }}>{line}</p>
      <button
        type="button"
        onClick={() => {
          requestDoshamCard(dosham.name);
          onNavigate?.();
        }}
        style={{
          alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "var(--space-1)",
          minHeight: 24, padding: 0, background: "transparent", border: "none", cursor: "pointer",
          fontFamily: "inherit", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-accent-strong)",
        }}
      >
        {lang === "ta" ? "இது எப்படிக் கணக்கிடப்பட்டது" : "See how this was calculated"}
        <ArrowRight size={12} strokeWidth={1.5} aria-hidden="true" />
      </button>
    </div>
  );
}
