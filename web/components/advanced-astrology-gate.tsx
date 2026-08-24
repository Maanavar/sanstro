"use client";

import type { ReactNode } from "react";

import type { Lang } from "@/lib/i18n";

import { CollapsibleSection } from "./collapsible-section";

type UserMode = "BEGINNER" | "BALANCED" | "TRADITIONAL";

/**
 * Which KIND of advanced material is behind the toggle. This is not styling —
 * the two say opposite things about whether the reader can trust what's inside,
 * and one blurb cannot cover both.
 *
 * `experimental-dasha` — Yogini, Ashtottari, Kalachakra. Comparison systems, none
 *   of which feed the daily score. "For the curious reader only" is accurate.
 *
 * `classical-detail` — Vargas (D9/D10/…) and Shadbala. These are load-bearing
 *   classical Thirukanitham, not experiments: the planet table prints each
 *   planet's D9 sign as a fact, and treats Vargottama — same sign in D1 and D9 —
 *   as a dignity that "steadies how it behaves". They are gated for BEGINNER
 *   because they are DENSE, not because they are doubtful.
 *
 * Both panels used to render ungated above this component, then were moved
 * inside it wholesale. That put Vargas and Shadbala under copy calling them
 * "comparison / experimental dasha systems — none feed your daily score": wrong
 * on the category (neither is a dasha system) and contradicting, two screens
 * away, the app's own Vargottama explanation. A gate must not undermine what it
 * is gating.
 */
type GateKind = "experimental-dasha" | "classical-detail";

const GATE_COPY: Record<GateKind, { title: { ta: string; en: string }; blurb: { ta: string; en: string } }> = {
  "experimental-dasha": {
    title: {
      en: "Other dasha systems (optional)",
      ta: "மற்ற தசை முறைகள் (விருப்பத்திற்கு மட்டும்)",
    },
    blurb: {
      en: "These are comparison / experimental dasha systems — none feed your daily score. For the curious reader only.",
      ta: "இவை ஒப்பீட்டு/சோதனை நிலை தசை முறைகள் — உங்கள் தினசரி மதிப்பெண்ணில் பயன்படுத்தப்படவில்லை. ஆர்வமுள்ளவர்களுக்கு மட்டும்.",
    },
  },
  // New Tamil, pending native review (CLAUDE.md new-Tamil rule).
  "classical-detail": {
    title: {
      en: "More chart detail (optional)",
      ta: "மேலும் ஜாதக விவரம் (விருப்பத்திற்கு மட்டும்)",
    },
    blurb: {
      en: "Standard Thirukanitham detail, folded away because it is dense rather than because it is doubtful — divisional charts and planetary strength. Your reading already uses them; open this only if you want to see the working.",
      ta: "இவை வழக்கமான திருக்கணித விவரங்கள் — சந்தேகத்திற்குரியவை அல்ல, அடர்த்தியானவை என்பதால் மட்டுமே மறைக்கப்பட்டுள்ளன: வர்க ஜாதகங்களும் கிரக பலமும். உங்கள் பலன்களில் இவை ஏற்கனவே பயன்படுத்தப்படுகின்றன; விவரம் பார்க்க விரும்பினால் மட்டும் திறக்கவும்.",
    },
  },
};

// Gates dense or experimental material behind one extra toggle for BEGINNER
// mode, so the "plain language, no jargon" mode promise actually holds on the
// Deep Dive surface. See H8 (#24) — userMode existed app-wide but wasn't wired
// into Deep Dive at all. BALANCED/TRADITIONAL render children unchanged (each
// panel still self-collapses as before).
export function AdvancedAstrologyGate({
  lang,
  mode,
  kind = "experimental-dasha",
  children,
}: {
  lang: Lang;
  mode?: UserMode;
  /** Defaults to the original behaviour so existing call sites are unchanged. */
  kind?: GateKind;
  children: ReactNode;
}) {
  if (mode !== "BEGINNER") return <>{children}</>;

  const copy = GATE_COPY[kind];

  return (
    <CollapsibleSection title={lang === "ta" ? copy.title.ta : copy.title.en} defaultOpen={false}>
      <p style={{ margin: "0 0 var(--space-3)", fontSize: "0.75rem", color: "var(--color-muted)", lineHeight: 1.5 }}>
        {lang === "ta" ? copy.blurb.ta : copy.blurb.en}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {children}
      </div>
    </CollapsibleSection>
  );
}
