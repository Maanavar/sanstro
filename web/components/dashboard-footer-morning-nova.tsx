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
 * Morning-guidance control in the workspace footer (homepage redesign
 * 2026-07-18) — replaces the Today tab's MorningGuidanceCard pointer. The
 * switch flips `morningAlertEnabled` only; delivery time and channel still
 * have exactly one editing surface, Settings → Notifications. Turning the
 * alert ON while the notification channel is "none" never silently picks a
 * channel (DASH-06) — it opens Settings so the user chooses.
 *
 * Presentation (Apple pass 2026-07-20): the boxed card treatment is gone —
 * a bordered, tinted panel inside a footer reads as a second surface, and
 * Apple footers carry no such competing container. It is now a plain
 * label/status/switch row that sits directly on the footer ground, styled
 * via `.nova-fmg*` in dashboard-nova.css. Styles moved out of inline
 * `style={{}}` at the same time: the old literal hex fallbacks
 * (`#a8842c`, `#C9A227`, `#fff`) could not respond to the Nova
 * light/dark token flip, so the switch kept a dark-theme gold on the cream
 * theme whenever a token failed to resolve.
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

  const label = lang === "ta" ? "காலை வழிகாட்டல்" : "Morning guidance";

  return (
    <div className="nova-fmg">
      <span className="nova-fmg__text">
        <span className="nova-fmg__label">{label}</span>
        <span className="nova-fmg__status">{statusLine}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        className="nova-fmg__switch"
        data-on={enabled ? "true" : "false"}
        onClick={() => void handleToggle()}
        disabled={busy}
      >
        <span className="nova-fmg__knob" aria-hidden="true" />
      </button>
    </div>
  );
}
