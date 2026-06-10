"use client";

import { useEffect, useState } from "react";
import { apiFetchJson } from "@/lib/api";
import type { Lang } from "@/lib/i18n";
import type { NotificationPreferenceData } from "@/lib/types";

type Props = { lang: Lang };

const W = {
  ink:      "#1A1612",
  inkMid:   "#3D352B",
  muted:    "#7A6F5E",
  border:   "#D4C8AE",
  borderLt: "#E4DBC8",
  surface:  "#FAF5EA",
  surfaceMd:"#F4EEE2",
  card:     "#FFFFFF",
  terracota:"#B85A2C",
  sage:     "#5C7654",
} as const;

const TIME_PRESETS = [
  { value: "06:00", labelEn: "6 AM", labelTa: "காலை 6" },
  { value: "07:00", labelEn: "7 AM", labelTa: "காலை 7" },
  { value: "08:00", labelEn: "8 AM", labelTa: "காலை 8" },
];

const CHANNEL_OPTS: { value: "email" | "push" | "both"; labelEn: string; labelTa: string }[] = [
  { value: "email", labelEn: "Email", labelTa: "மின்னஞ்சல்" },
  { value: "push",  labelEn: "Push",  labelTa: "Push" },
  { value: "both",  labelEn: "Both",  labelTa: "இரண்டும்" },
];

function Pill({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "var(--space-1) var(--space-3)",
        borderRadius: "var(--radius-pill)",
        fontSize: "0.8125rem",
        fontWeight: 600,
        cursor: "pointer",
        border: "1.5px solid",
        borderColor: active ? W.terracota : W.borderLt,
        background: active ? W.terracota : "transparent",
        color: active ? "#fff" : W.muted,
        fontFamily: "inherit",
        transition: "all 0.12s ease",
      }}
    >
      {children}
    </button>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <span
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        display: "inline-flex",
        width: "36px", height: "20px",
        borderRadius: "var(--radius-pill)",
        border: `1.5px solid ${checked ? W.terracota : W.border}`,
        background: checked ? W.terracota : W.surfaceMd,
        position: "relative",
        flexShrink: 0,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      <span style={{
        position: "absolute",
        top: "2px",
        left: checked ? "16px" : "2px",
        width: "14px", height: "14px",
        borderRadius: "50%",
        background: checked ? "#fff" : W.muted,
        transition: "left 0.15s",
      }} />
    </span>
  );
}

export function MorningGuidanceCard({ lang }: Props) {
  const [prefs, setPrefs] = useState<NotificationPreferenceData | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState("06:00");
  const [channel, setChannel] = useState<"none" | "email" | "push" | "both">("email");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetchJson<{ success: boolean; data: NotificationPreferenceData }>("/api/v1/settings/notifications")
      .then((r) => {
        const p = r.data;
        setPrefs(p);
        setEnabled(p.morningAlertEnabled);
        setTime(p.morningAlertTime || "06:00");
        setChannel(p.notification_channel === "none" ? "email" : p.notification_channel);
      })
      .catch(() => {});
  }, []);

  function save(
    nextEnabled: boolean,
    nextTime: string,
    nextChannel: "none" | "email" | "push" | "both",
  ) {
    setSaving(true);
    setSaved(false);
    apiFetchJson<{ success: boolean; data: NotificationPreferenceData }>("/api/v1/settings/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        morningAlertEnabled: nextEnabled,
        morningAlertTime: nextTime,
        notificationChannel: nextEnabled ? nextChannel : (prefs?.notification_channel ?? "none"),
      }),
    })
      .then((r) => {
        setPrefs(r.data);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  }

  function handleToggle(v: boolean) {
    setEnabled(v);
    save(v, time, channel);
  }

  function handleTime(v: string) {
    setTime(v);
    if (enabled) save(true, v, channel);
  }

  function handleChannel(v: "email" | "push" | "both") {
    setChannel(v);
    if (enabled) save(true, time, v);
  }

  if (prefs === null) return null;

  return (
    <div style={{
      background: W.surface,
      border: `1px solid ${W.borderLt}`,
      borderRadius: "var(--radius-md)",
      padding: "var(--space-5) var(--space-6)",
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-4)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <span style={{
          fontSize: "1.25rem",
          lineHeight: 1,
          flexShrink: 0,
          color: W.terracota,
        }} aria-hidden>🔔</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: W.terracota }}>
            {lang === "ta" ? "காலை வழிகாட்டல்" : "Morning Guidance"}
          </p>
          <p style={{ margin: 0, fontSize: "0.875rem", color: W.muted, lineHeight: 1.4, marginTop: "2px" }}>
            {lang === "ta"
              ? "ஒவ்வொரு நாளும் காலையில் உங்கள் ஜோதிட வழிகாட்டலை பெறுங்கள்"
              : "Receive your daily astrological guidance every morning"}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexShrink: 0 }}>
          {saving && <span style={{ fontSize: "0.75rem", color: W.muted }}>…</span>}
          {saved && !saving && (
            <span style={{ fontSize: "0.75rem", color: W.sage, fontWeight: 600 }}>
              {lang === "ta" ? "சேமிக்கப்பட்டது" : "Saved"}
            </span>
          )}
          <Toggle checked={enabled} onChange={handleToggle} />
        </div>
      </div>

      {/* Toggle label */}
      <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: enabled ? W.inkMid : W.muted }}>
        {lang === "ta"
          ? "இன்றைய வழிகாட்டலை ஒவ்வொரு காலையும் அனுப்பவும்"
          : "Send me today's guidance every morning"}
      </p>

      {/* Options — shown when enabled */}
      {enabled && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3_5)" }}>
          {/* Time presets */}
          <div>
            <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.75rem", fontWeight: 700, color: W.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {lang === "ta" ? "நேரம்" : "Time"}
            </p>
            <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
              {TIME_PRESETS.map((p) => (
                <Pill key={p.value} active={time === p.value} onClick={() => handleTime(p.value)}>
                  {lang === "ta" ? p.labelTa : p.labelEn}
                </Pill>
              ))}
            </div>
          </div>

          {/* Delivery channel */}
          <div>
            <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.75rem", fontWeight: 700, color: W.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {lang === "ta" ? "வழிமுறை" : "Delivery"}
            </p>
            <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
              {CHANNEL_OPTS.map((opt) => (
                <Pill
                  key={opt.value}
                  active={channel === opt.value}
                  onClick={() => handleChannel(opt.value)}
                >
                  {lang === "ta" ? opt.labelTa : opt.labelEn}
                </Pill>
              ))}
            </div>
          </div>

          {/* What you'll receive */}
          <div style={{
            padding: "var(--space-3) var(--space-4)",
            borderRadius: "var(--radius-md)",
            background: W.surfaceMd,
            border: `1px solid ${W.borderLt}`,
          }}>
            <p style={{ margin: "0 0 var(--space-1_5)", fontSize: "0.75rem", fontWeight: 700, color: W.inkMid }}>
              {lang === "ta" ? "உள்ளடக்கம்" : "Each morning includes"}
            </p>
            <ul style={{ margin: 0, padding: "0 0 0 var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-0_5)" }}>
              {(lang === "ta" ? [
                "சந்திராஷ்டம எச்சரிக்கை (பொருந்தும் போது)",
                "இன்றைய நல்ல நேரம்",
                "ராகு காலம்",
                "தசை / புக்தி சூழல்",
                "ஒரு வழிகாட்டல் கருத்து",
              ] : [
                "Chandrashtama warning (if applicable)",
                "Today's Nalla Neram",
                "Rahu Kalam",
                "Current Dasha / Bhukti context",
                "One action guidance",
              ]).map((item) => (
                <li key={item} style={{ fontSize: "0.8125rem", color: W.muted, lineHeight: 1.4 }}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
