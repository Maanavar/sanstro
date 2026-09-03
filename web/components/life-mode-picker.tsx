"use client";

import { useState } from "react";
import { BookOpen, Briefcase, Heart, Home, Coins, Leaf, Star, Flame, Scale } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { apiFetchJson } from "@/lib/api";
import { ModalShell } from "@/components/modal-shell";
import type { Lang } from "@/lib/i18n";
import type { LifeMode, LifeModeStatus } from "@/lib/types";

// ── Mode metadata ─────────────────────────────────────────────────────────────
type ModeMeta = { Icon: LucideIcon; labelEn: string; labelTa: string; descEn: string; descTa: string };

const MODE_META: Record<LifeMode, ModeMeta> = {
  STUDY:        { Icon: BookOpen,  labelEn: "Studies",      labelTa: "படிப்பு",     descEn: "Focus, exams, learning",      descTa: "கவனம், தேர்வு, கற்றல்" },
  CAREER:       { Icon: Briefcase, labelEn: "Career",       labelTa: "தொழில்",      descEn: "Work timing & decisions",     descTa: "வேலை நேரம் & முடிவுகள்" },
  LOVE:         { Icon: Heart,     labelEn: "Love",         labelTa: "காதல்",       descEn: "Communication & connection",  descTa: "தொடர்பு & நெருக்கம்" },
  MARRIAGE:     { Icon: Heart,     labelEn: "Marriage",     labelTa: "திருமணம்",    descEn: "Relationship & timing",       descTa: "உறவு & நேரம்" },
  FAMILY:       { Icon: Home,      labelEn: "Family",       labelTa: "குடும்பம்",   descEn: "Harmony & home",              descTa: "ஒற்றுமை & வீடு" },
  WEALTH:       { Icon: Coins,     labelEn: "Wealth",       labelTa: "செல்வம்",     descEn: "Money & finance timing",      descTa: "பணம் & நிதி நேரம்" },
  HEALTH:       { Icon: Leaf,      labelEn: "Health",       labelTa: "ஆரோக்கியம்",  descEn: "Energy, rest, vitality",      descTa: "சக்தி, ஓய்வு, உடல்நலம்" },
  SPIRITUALITY: { Icon: Star,      labelEn: "Spirituality", labelTa: "ஆன்மீகம்",    descEn: "Prayer & inner growth",       descTa: "வழிபாடு & உள் வளர்ச்சி" },
  REMEDIES:     { Icon: Flame,     labelEn: "Remedies",     labelTa: "பரிகாரம்",    descEn: "Parihara & practices",        descTa: "பரிகாரம் & பயிற்சிகள்" },
  BALANCED:     { Icon: Scale,     labelEn: "Balanced",     labelTa: "சமநிலை",      descEn: "A bit of everything",         descTa: "எல்லாமே சிறிது" },
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
    <ModalShell
      label={lang === "ta" ? "இப்போது எதில் கவனம்?" : "What are you focused on right now?"}
      onClose={onClose}
      overlayStyle={{ zIndex: 9998 }}
      panelStyle={{
        width: "100%", maxWidth: "600px", maxHeight: "88vh", overflowY: "auto",
        background: "var(--color-surface-soft)",
        border: "1px solid var(--color-border)",
        borderRadius: "20px",
        padding: "clamp(20px, 4vw, 32px)", boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        fontFamily: "var(--font-body)",
      }}
    >
        <p style={{ margin: "0 0 6px", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-accent, var(--panel-brand))" }}>
          {lang === "ta" ? "உங்கள் கவனம்" : "Your focus"}
        </p>
        <h2 style={{ margin: "0 0 4px", fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 500, color: "var(--color-text-strong, var(--panel-earth-dark))", letterSpacing: "-0.02em" }}>
          {lang === "ta" ? "இப்போது எதில் கவனம்?" : "What are you focused on right now?"}
        </h2>
        <p style={{ margin: "0 0 20px", fontSize: "0.875rem", color: "var(--color-muted, var(--panel-mid-earth))", lineHeight: 1.5 }}>
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
                  borderColor: isCurrent ? "var(--color-accent, var(--panel-brand))" : "var(--color-border, #E4DAC6)",
                  background: saving === mode ? "var(--chart-d1-lagna-bg)" : isCurrent ? "var(--color-mid-bg, #F7E8DA)" : "var(--chart-cell-default)",
                  opacity: saving !== null && saving !== mode ? 0.5 : 1,
                  transition: "all 0.12s ease", fontFamily: "inherit",
                }}
              >
                <meta.Icon size={22} strokeWidth={1.5} aria-hidden="true" />
                <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-text-strong, var(--panel-earth-dark))" }}>
                  {lang === "ta" ? meta.labelTa : meta.labelEn}
                </span>
                <span style={{ fontSize: "0.72rem", color: "var(--color-faint)", lineHeight: 1.35 }}>
                  {lang === "ta" ? meta.descTa : meta.descEn}
                </span>
              </button>
            );
          })}
        </div>

        {error && <p style={{ margin: "14px 0 0", fontSize: "0.8rem", color: "var(--color-low, var(--planet-saturn))" }}>{error}</p>}

        <div style={{ display: "flex", justifyContent: "center", marginTop: "18px" }}>
          <button
            type="button"
            disabled={saving !== null}
            onClick={onClose}
            style={{
              padding: "8px 18px", borderRadius: "var(--radius-pill)", background: "transparent",
              border: "none", color: "var(--color-faint)", fontSize: "0.8rem", fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", textDecoration: "underline",
            }}
          >
            {lang === "ta" ? "இப்போது தவிர்க்கவும்" : "Skip for now"}
          </button>
        </div>
    </ModalShell>
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
        border: "1.5px solid var(--color-border, #E4DAC6)", background: "var(--chart-cell-default)", cursor: "pointer",
        fontSize: "0.75rem", fontWeight: 700, color: "var(--planet-lagna)", fontFamily: "var(--font-body)",
      }}
    >
      <meta.Icon size={14} strokeWidth={1.5} aria-hidden="true" />
      {lang === "ta" ? meta.labelTa : meta.labelEn}
    </button>
  );
}
