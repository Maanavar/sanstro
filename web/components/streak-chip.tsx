"use client";

import { Flame, Moon } from "lucide-react";
import type { Lang } from "@/lib/i18n";
import { STREAK, dt } from "@/lib/dashboard-i18n";

/**
 * First-class streak surface (UXD-18). Milestone tiers get a warm glow so the
 * 7 / 30 / 100 / 365-day marks feel earned; a spent grace day is shown as a
 * calm "rest day kept" moon rather than silently vanishing. Renders nothing for
 * a day-1 (i.e. not-yet-a-streak) count.
 */

const TIERS = [365, 100, 30, 14, 7] as const;

function tierFor(days: number): number | null {
  return TIERS.find((t) => days >= t) ?? null;
}

function tierLabel(tier: number, lang: Lang): string {
  const en: Record<number, string> = {
    7: "One-week", 14: "Two-week", 30: "One-month", 100: "100-day", 365: "One-year",
  };
  const ta: Record<number, string> = {
    7: "ஒரு வார", 14: "இரு வார", 30: "ஒரு மாத", 100: "100 நாள்", 365: "ஒரு வருட",
  };
  return lang === "ta" ? ta[tier] : en[tier];
}

export function StreakChip({
  days,
  best,
  forgiven,
  lang,
}: {
  days: number;
  best?: number;
  forgiven?: boolean;
  lang: Lang;
}) {
  if (days <= 1) return null;
  const ta = lang === "ta";
  const tier = tierFor(days);
  const atMilestone = TIERS.includes(days as (typeof TIERS)[number]); // exactly landed on a tier today

  const label = ta ? `${days} நாள் தொடர்ச்சி` : `${days}-day streak`;

  const titleParts: string[] = [];
  if (best && best > days) titleParts.push(ta ? `சிறந்தது: ${best} நாட்கள்` : `Best: ${best} days`);
  if (tier) titleParts.push(`${tierLabel(tier, lang)} ${dt(STREAK.milestone, lang)}`);
  if (forgiven) titleParts.push(dt(STREAK.restDayKept, lang));

  return (
    <span
      title={titleParts.join(" · ") || undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        fontSize: "11.5px",
        fontWeight: 700,
        color: "var(--color-accent-strong)",
        background: "var(--color-accent-muted)",
        border: "1px solid var(--color-border-strong)",
        borderRadius: "999px",
        padding: "5px 12px",
        // Milestone tiers get a soft accent glow so the mark reads as earned.
        boxShadow: tier ? "0 0 0 1px var(--color-border-strong), 0 2px 14px var(--color-accent-muted)" : undefined,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <Flame size={13} strokeWidth={2.2} fill={atMilestone ? "currentColor" : "none"} aria-hidden="true" />
      {label}
      {forgiven && (
        <>
          <span aria-hidden="true" style={{ opacity: 0.4 }}>·</span>
          <Moon size={12} strokeWidth={2} aria-hidden="true" style={{ opacity: 0.85 }} />
        </>
      )}
    </span>
  );
}
