"use client";

import { useState } from "react";
import { apiFetchJson } from "@/lib/api";
import type { Lang } from "@/lib/i18n";
import type { LifeMode, LifeModeStatus } from "@/lib/types";

// ── Mode metadata ─────────────────────────────────────────────────────────────
type ModeMeta = { icon: string; labelEn: string; labelTa: string; descEn: string; descTa: string };

const MODE_META: Record<LifeMode, ModeMeta> = {
  STUDY:        { icon: "📚", labelEn: "Studies",      labelTa: "படிப்பு",     descEn: "Focus, exams, learning",      descTa: "கவனம், தேர்வு, கற்றல்" },
  CAREER:       { icon: "💼", labelEn: "Career",       labelTa: "தொழில்",      descEn: "Work timing & decisions",     descTa: "வேலை நேரம் & முடிவுகள்" },
  LOVE:         { icon: "❤️", labelEn: "Love",         labelTa: "காதல்",       descEn: "Communication & connection",  descTa: "தொடர்பு & நெருக்கம்" },
  MARRIAGE:     { icon: "💍", labelEn: "Marriage",     labelTa: "திருமணம்",    descEn: "Relationship & timing",       descTa: "உறவு & நேரம்" },
  FAMILY:       { icon: "🏠", labelEn: "Family",       labelTa: "குடும்பம்",   descEn: "Harmony & home",              descTa: "ஒற்றுமை & வீடு" },
  WEALTH:       { icon: "💰", labelEn: "Wealth",       labelTa: "செல்வம்",     descEn: "Money & finance timing",      descTa: "பணம் & நிதி நேரம்" },
  HEALTH:       { icon: "🌿", labelEn: "Health",       labelTa: "ஆரோக்கியம்",  descEn: "Energy, rest, vitality",      descTa: "சக்தி, ஓய்வு, உடல்நலம்" },
  SPIRITUALITY: { icon: "🕉️", labelEn: "Spirituality", labelTa: "ஆன்மிகம்",    descEn: "Prayer & inner growth",       descTa: "வழிபாடு & உள் வளர்ச்சி" },
  REMEDIES:     { icon: "🪔", labelEn: "Remedies",     labelTa: "பரிகாரம்",    descEn: "Parihara & practices",        descTa: "பரிகாரம் & பயிற்சிகள்" },
  BALANCED:     { icon: "⚖️", labelEn: "Balanced",     labelTa: "சமநிலை",      descEn: "A bit of everything",         descTa: "எல்லாமே சிறிது" },
};

const MODE_ORDER: LifeMode[] = [
  "STUDY", "CAREER", "LOVE", "MARRIAGE", "FAMILY",
  "WEALTH", "HEALTH", "SPIRITUALITY", "REMEDIES", "BALANCED",
];

interface LifeModePickerProps {
  lang: Lang;
  currentMode: LifeMode;
  blockedModes: string[];
  onClose: () => void;
  onSelected: (status: LifeModeStatus) => void;
}

export function LifeModePicker({ lang, currentMode, blockedModes, onClose, onSelected }: LifeModePickerProps) {
  const [saving, setSaving] = useState<LifeMode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visibleModes = MODE_ORDER.filter((m) => !blockedModes.includes(m));

  async function choose(mode: LifeMode) {
    setSaving(mode);
    setError(null);
    try {
      const status = await apiFetchJson<LifeModeStatus>("/api/v1/settings/life-mode", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      onSelected(status);
      onClose();
    } catch {
      setError(lang === "ta" ? "சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்." : "Couldn't save. Please try again.");
      setSaving(null);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed", inset: 0, zIndex: 9998,
        background: "rgba(26,22,18,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: "640px", maxHeight: "88vh", overflowY: "auto",
          background: "#FBF7EF", borderTopLeftRadius: "24px", borderTopRightRadius: "24px",
          padding: "clamp(20px, 4vw, 32px)", boxShadow: "0 -12px 48px rgba(0,0,0,0.3)",
          fontFamily: "var(--font-body)",
        }}
      >
        <div style={{ width: "40px", height: "4px", borderRadius: "2px", background: "#D4C8AE", margin: "0 auto 18px" }} />

        <p style={{ margin: "0 0 6px", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#B85A2C" }}>
          {lang === "ta" ? "உங்கள் கவனம்" : "Your focus"}
        </p>
        <h2 style={{ margin: "0 0 4px", fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 500, color: "#1A1612", letterSpacing: "-0.02em" }}>
          {lang === "ta" ? "இப்போது எதில் கவனம்?" : "What are you focused on right now?"}
        </h2>
        <p style={{ margin: "0 0 20px", fontSize: "0.875rem", color: "#5a4f42", lineHeight: 1.5 }}>
          {lang === "ta"
            ? "உங்கள் தேர்வைப் பொறுத்து தினசரி வழிகாட்டுதலை முன்னிலைப்படுத்துகிறோம். எப்போது வேண்டுமானாலும் மாற்றலாம்."
            : "We'll surface daily guidance around your choice. You can change it anytime."}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 180px), 1fr))", gap: "10px" }}>
          {visibleModes.map((mode) => {
            const meta = MODE_META[mode];
            const isCurrent = mode === currentMode;
            return (
              <button
                key={mode}
                type="button"
                disabled={saving !== null}
                onClick={() => void choose(mode)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px",
                  padding: "14px", borderRadius: "16px", cursor: saving ? "wait" : "pointer",
                  textAlign: "left", border: "1.5px solid",
                  borderColor: isCurrent ? "#B85A2C" : "#E4DAC6",
                  background: saving === mode ? "#F0D9C4" : isCurrent ? "#F7E8DA" : "#FFFFFF",
                  opacity: saving !== null && saving !== mode ? 0.5 : 1,
                  transition: "all 0.12s ease", fontFamily: "inherit",
                }}
              >
                <span style={{ fontSize: "1.5rem", lineHeight: 1 }} aria-hidden="true">{meta.icon}</span>
                <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1A1612" }}>
                  {lang === "ta" ? meta.labelTa : meta.labelEn}
                </span>
                <span style={{ fontSize: "0.72rem", color: "#7A6F5E", lineHeight: 1.35 }}>
                  {lang === "ta" ? meta.descTa : meta.descEn}
                </span>
              </button>
            );
          })}
        </div>

        {error && <p style={{ margin: "14px 0 0", fontSize: "0.8rem", color: "#A8482F" }}>{error}</p>}

        <div style={{ display: "flex", justifyContent: "center", marginTop: "18px" }}>
          <button
            type="button"
            disabled={saving !== null}
            onClick={() => void choose("BALANCED")}
            style={{
              padding: "8px 18px", borderRadius: "var(--radius-pill)", background: "transparent",
              border: "none", color: "#7A6F5E", fontSize: "0.8rem", fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", textDecoration: "underline",
            }}
          >
            {lang === "ta" ? "இப்போது தவிர்க்கவும்" : "Skip for now"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Small inline badge shown on the dashboard; tapping re-opens the picker.
export function LifeModeBadge({ mode, lang, onClick }: { mode: LifeMode; lang: Lang; onClick: () => void }) {
  const meta = MODE_META[mode];
  return (
    <button
      type="button"
      onClick={onClick}
      title={lang === "ta" ? "கவனத்தை மாற்று" : "Change focus"}
      style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        padding: "4px 12px", borderRadius: "var(--radius-pill)",
        border: "1.5px solid #E4DAC6", background: "#FFFFFF", cursor: "pointer",
        fontSize: "0.75rem", fontWeight: 700, color: "#8c3e18", fontFamily: "var(--font-body)",
      }}
    >
      <span aria-hidden="true">{meta.icon}</span>
      {lang === "ta" ? meta.labelTa : meta.labelEn}
    </button>
  );
}
