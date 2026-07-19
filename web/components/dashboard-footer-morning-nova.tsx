"use client";

import { useEffect, useState } from "react";
import { apiFetchJson } from "@/lib/api";
import type { Lang } from "@/lib/i18n";
import type { NotificationPreferenceData } from "@/lib/types";

const CHANNEL_LABELS: Record<"email" | "push" | "both", { en: string; ta: string }> = {
  email: { en: "Email", ta: "மின்னஞ்சல்" },
  push:  { en: "Push",  ta: "Push" },
  both:  { en: "Email + Push", ta: "மின்னஞ்சல் + Push" },
};

/**
 * Morning-guidance card in the workspace footer (homepage redesign
 * 2026-07-18) — replaces the Today tab's MorningGuidanceCard pointer. The
 * switch flips `morningAlertEnabled` only; delivery time and channel still
 * have exactly one editing surface, Settings → Notifications. Turning the
 * alert ON while the notification channel is "none" never silently picks a
 * channel (DASH-06) — it opens Settings so the user chooses.
 */
export function DashboardFooterMorningGuidance({ lang, onOpenSettings }: { lang: Lang; onOpenSettings?: () => void }) {
  const [prefs, setPrefs] = useState<NotificationPreferenceData | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiFetchJson<{ success: boolean; data: NotificationPreferenceData }>("/api/v1/settings/notifications")
      .then((r) => setPrefs(r.data))
      .catch(() => {});
  }, []);

  // Prefs unavailable (guest / unauthenticated) — hide, same as the old card.
  if (prefs === null) return null;

  const enabled = prefs.morningAlertEnabled;
  const channel = prefs.notification_channel;
  const channelLabel =
    channel === "none" ? null : (lang === "ta" ? CHANNEL_LABELS[channel].ta : CHANNEL_LABELS[channel].en);
  const statusLine = [
    enabled ? (lang === "ta" ? "இயக்கத்தில்" : "On") : (lang === "ta" ? "நிறுத்தப்பட்டது" : "Off"),
    prefs.morningAlertTime || "06:00",
    ...(channelLabel ? [channelLabel] : []),
  ].join(" · ");

  async function handleToggle() {
    if (busy || prefs === null) return;
    if (!enabled && channel === "none") {
      // DASH-06 — no channel chosen yet; enabling must go through Settings.
      onOpenSettings?.();
      return;
    }
    setBusy(true);
    try {
      const next = !enabled;
      await apiFetchJson("/api/v1/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationChannel: channel,
          morningAlertEnabled: next,
          morningAlertTime: prefs.morningAlertTime || "06:00",
        }),
      });
      setPrefs({ ...prefs, morningAlertEnabled: next });
    } catch {
      // Leave the switch where it was — the next settings read is the truth.
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "14px",
      background: "color-mix(in srgb, var(--color-text-strong) 4%, transparent)",
      border: "1px solid var(--color-border, rgba(0,0,0,0.12))",
      borderRadius: "12px", padding: "14px 16px",
    }}>
      <span aria-hidden="true" style={{ color: "var(--color-accent-strong, #a8842c)", fontSize: "16px", flex: "none" }}>☀</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--color-text-strong, inherit)" }}>
          {lang === "ta" ? "காலை வழிகாட்டல்" : "Morning guidance"}
        </div>
        <div style={{ fontSize: "11px", color: "var(--color-faint, inherit)", marginTop: "1px", whiteSpace: "nowrap" }}>
          {statusLine}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={lang === "ta" ? "காலை வழிகாட்டல்" : "Morning guidance"}
        onClick={() => void handleToggle()}
        disabled={busy}
        style={{
          width: "34px", height: "19px", borderRadius: "999px",
          background: enabled ? "var(--color-accent, #C9A227)" : "color-mix(in srgb, var(--color-text-strong) 15%, transparent)",
          border: "none", position: "relative", cursor: busy ? "wait" : "pointer",
          transition: "background 0.2s ease", flex: "none", marginLeft: "6px", padding: 0,
        }}
      >
        <span style={{
          position: "absolute", top: "2.5px", left: enabled ? "17px" : "3px",
          width: "14px", height: "14px", borderRadius: "50%",
          background: "var(--color-surface, #fff)", transition: "left 0.2s ease",
        }} />
      </button>
    </div>
  );
}
