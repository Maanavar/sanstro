"use client";

// ORPHANED 2026-08-08 — NOT IMPORTED ANYWHERE. Replaced by
// `dashboard-footer-morning-nova.tsx`. `dashboard-today-deepdive-extras-nova.tsx:518`
// still points at "./morning-guidance-card" in a comment. Verified by sweeping
// every import specifier in web/, packages/ and mobile/.
// See docs/EFFICIENCY_FIX_PLAN_2026-08-07.md F11. Deletion is a separate,
// per-file decision and has not been made.

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { apiFetchJson } from "@/lib/api";
import type { Lang } from "@/lib/i18n";
import type { NotificationPreferenceData } from "@/lib/types";

type Props = { lang: Lang; onOpenSettings?: () => void };

const CHANNEL_LABELS: Record<"email" | "push" | "both", { en: string; ta: string }> = {
  email: { en: "Email", ta: "மின்னஞ்சல்" },
  push:  { en: "Push",  ta: "Push" },
  both:  { en: "Email + Push", ta: "மின்னஞ்சல் + Push" },
};

/**
 * Compact pointer to Settings → Notifications. The actual morning-guidance
 * controls (enable toggle, delivery time, channel) live in
 * dashboard-settings-session-tab.tsx — this card only shows the current
 * status and deep-links there, so the preference has exactly one editing
 * surface instead of the three duplicated widgets it had before.
 */
export function MorningGuidanceCard({ lang, onOpenSettings }: Props) {
  const [prefs, setPrefs] = useState<NotificationPreferenceData | null>(null);

  useEffect(() => {
    apiFetchJson<{ success: boolean; data: NotificationPreferenceData }>("/api/v1/settings/notifications")
      .then((r) => setPrefs(r.data))
      .catch(() => {});
  }, []);

  // Prefs unavailable (guest / unauthenticated) — same hide behaviour as the old card.
  if (prefs === null) return null;

  const enabled = prefs.morningAlertEnabled;
  const channel = prefs.notification_channel;
  const channelLabel =
    channel === "none" ? null : (lang === "ta" ? CHANNEL_LABELS[channel].ta : CHANNEL_LABELS[channel].en);
  const statusLine = enabled
    ? [
        lang === "ta" ? "இயக்கத்தில்" : "On",
        prefs.morningAlertTime || "06:00",
        ...(channelLabel ? [channelLabel] : []),
      ].join(" · ")
    : lang === "ta"
      ? "ஒவ்வொரு நாளும் காலையில் உங்கள் ஜோதிட வழிகாட்டலை பெறுங்கள்"
      : "Receive your daily astrological guidance every morning";

  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-md)",
      padding: "var(--space-4) var(--space-5)",
      display: "flex",
      alignItems: "center",
      gap: "var(--space-3)",
      flexWrap: "wrap",
    }}>
      <Bell size={20} color="var(--color-accent-strong)" strokeWidth={1.5} aria-hidden="true" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: "200px" }}>
        <p style={{ margin: 0, fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-accent-strong)" }}>
          {lang === "ta" ? "காலை வழிகாட்டல்" : "Morning Guidance"}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: "0.875rem", color: "var(--color-muted)", lineHeight: 1.4 }}>
          {statusLine}
        </p>
      </div>
      {onOpenSettings && (
        <button
          type="button"
          onClick={onOpenSettings}
          style={{
            padding: "var(--space-1_5) var(--space-3_5)",
            borderRadius: "var(--radius-pill)",
            fontSize: "0.8125rem",
            fontWeight: 600,
            cursor: "pointer",
            border: "1.5px solid var(--color-accent)",
            background: "transparent",
            color: "var(--color-accent-strong)",
            fontFamily: "inherit",
            flexShrink: 0,
          }}
        >
          {enabled
            ? (lang === "ta" ? "அமைப்புகளில் மாற்றவும்" : "Manage in Settings")
            : (lang === "ta" ? "அமைப்புகளில் இயக்கவும்" : "Set up in Settings")}
        </button>
      )}
    </div>
  );
}
