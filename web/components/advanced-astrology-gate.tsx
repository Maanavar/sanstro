"use client";

import type { ReactNode } from "react";

import type { Lang } from "@/lib/i18n";

import { CollapsibleSection } from "./collapsible-section";

type UserMode = "BEGINNER" | "BALANCED" | "TRADITIONAL";

// Gates the comparison/experimental dasha panels (Yogini, Ashtottari,
// Kalachakra — none feed the daily score) behind one extra toggle for
// BEGINNER mode, so the "plain language, no jargon" mode promise actually
// holds on the Deep Dive surface. See H8 (#24) — userMode existed app-wide
// but wasn't wired into Deep Dive at all. BALANCED/TRADITIONAL render
// children unchanged (each panel still self-collapses as before).
export function AdvancedAstrologyGate({
  lang,
  mode,
  children,
}: {
  lang: Lang;
  mode?: UserMode;
  children: ReactNode;
}) {
  if (mode !== "BEGINNER") return <>{children}</>;

  return (
    <CollapsibleSection
      title={lang === "ta" ? "மேலும் மேம்பட்ட ஜோதிடம் (விருப்பத்திற்கு மட்டும்)" : "More advanced astrology (optional)"}
      defaultOpen={false}
    >
      <p style={{ margin: "0 0 var(--space-3)", fontSize: "0.75rem", color: "var(--color-muted)", lineHeight: 1.5 }}>
        {lang === "ta"
          ? "இவை ஒப்பீட்டு/சோதனை நிலை தசை முறைகள் — உங்கள் தினசரி மதிப்பெண்ணில் பயன்படுத்தப்படவில்லை. ஆர்வமுள்ளவர்களுக்கு மட்டும்."
          : "These are comparison / experimental dasha systems — none feed your daily score. For the curious reader only."}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {children}
      </div>
    </CollapsibleSection>
  );
}
