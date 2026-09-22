"use client";

import { useState } from "react";
import { BookOpen, Briefcase, Heart, Home, Coins, Leaf, Star, Flame, Scale, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { updateLifeMode } from "@vinaadi/shared/api";
import "@/lib/api"; // initialises the shared API client the wrapper above uses
import { ModalShell } from "@/components/modal-shell";
import { dt, LIFE_FOCUS } from "@/lib/dashboard-i18n";
import type { Lang } from "@/lib/i18n";
import type { LifeMode, LifeModeStatus } from "@/lib/types";

// ── Mode metadata ─────────────────────────────────────────────────────────────
// The one place a focus gets its label and icon. The picker, the Today chip
// and the Settings card all read it; do not re-type these labels elsewhere.
type ModeMeta = { Icon: LucideIcon; labelEn: string; labelTa: string; descEn: string; descTa: string };

export const MODE_META: Record<LifeMode, ModeMeta> = {
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

export const MODE_ORDER: LifeMode[] = [
  "STUDY", "CAREER", "LOVE", "MARRIAGE", "FAMILY",
  "WEALTH", "HEALTH", "SPIRITUALITY", "REMEDIES", "BALANCED",
];

export function lifeModeLabel(mode: LifeMode, lang: Lang): string {
  const meta = MODE_META[mode];
  return lang === "ta" ? meta.labelTa : meta.labelEn;
}

interface LifeModePickerProps {
  lang: Lang;
  currentMode: LifeMode;
  blockedModes: string[];
  /** First run: the dismiss button is "Skip for now" and records BALANCED so
   *  the picker does not come back. Opened from the chip: it is a plain close. */
  firstRun: boolean;
  onClose: () => void;
  onSelected: (status: LifeModeStatus) => void;
}

export function LifeModePicker({ lang, currentMode, blockedModes, firstRun, onClose, onSelected }: LifeModePickerProps) {
  const [saving, setSaving] = useState<LifeMode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visibleModes = MODE_ORDER.filter((m) => !blockedModes.includes(m));

  async function choose(mode: LifeMode) {
    setSaving(mode);
    setError(null);
    try {
      const status = await updateLifeMode(mode);
      onSelected(status);
      onClose();
    } catch {
      setError(dt(LIFE_FOCUS.saveFailed, lang));
      setSaving(null);
    }
  }

  // Skip means skip, and it never waits. UXD-08 (3a353f9) made Skip a local
  // no-op because the old Skip awaited this PATCH, so a failed request left
  // the user in an error loop over a choice they had declined to make. The
  // close is still immediate; the save runs behind it. If the save fails,
  // the only cost is that the picker is offered again on a later load.
  function skip() {
    onClose();
    if (!firstRun) return;
    updateLifeMode("BALANCED").then(onSelected).catch(() => {});
  }

  return (
    <ModalShell
      label={dt(LIFE_FOCUS.question, lang)}
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
          {dt(LIFE_FOCUS.eyebrow, lang)}
        </p>
        <h2 style={{ margin: "0 0 4px", fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 500, color: "var(--color-text-strong, var(--panel-earth-dark))", letterSpacing: "-0.02em" }}>
          {dt(LIFE_FOCUS.question, lang)}
        </h2>
        <p style={{ margin: "0 0 20px", fontSize: "0.875rem", color: "var(--color-muted, var(--panel-mid-earth))", lineHeight: 1.5 }}>
          {dt(LIFE_FOCUS.subtitle, lang)}
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
                  transition: "all 0.12s var(--ease-nova)", fontFamily: "inherit",
                }}
              >
                <meta.Icon size={22} strokeWidth={1.5} aria-hidden="true" />
                <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-text-strong, var(--panel-earth-dark))" }}>
                  {lifeModeLabel(mode, lang)}
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
            onClick={skip}
            style={{
              padding: "8px 18px", borderRadius: "var(--radius-pill)", background: "transparent",
              border: "none", color: "var(--color-faint)", fontSize: "0.8rem", fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", textDecoration: "underline",
            }}
          >
            {dt(firstRun ? LIFE_FOCUS.skip : LIFE_FOCUS.close, lang)}
          </button>
        </div>
    </ModalShell>
  );
}

// The 60-day "Still focused on X?" strip (plan D3). Replaces the old full
// modal re-ask: one line, three actions, never blocks the page.
export function FocusNudgeStrip({
  mode, lang, onKeep, onChange, onDismiss,
}: {
  mode: LifeMode;
  lang: Lang;
  onKeep: () => Promise<void>;
  onChange: () => void;
  onDismiss: () => void;
}) {
  const [keeping, setKeeping] = useState(false);
  const meta = MODE_META[mode];
  return (
    <div className="nova-focus-nudge" role="region" aria-label={dt(LIFE_FOCUS.eyebrow, lang)}>
      <meta.Icon size={15} strokeWidth={1.9} aria-hidden="true" className="nova-focus-nudge__icon" />
      <span className="nova-focus-nudge__q">
        {dt(LIFE_FOCUS.nudgeQuestion, lang).replace("%s", lifeModeLabel(mode, lang))}
      </span>
      <span className="nova-focus-nudge__actions">
        <button
          type="button"
          className="nova-focus-nudge__btn nova-focus-nudge__btn--primary"
          disabled={keeping}
          onClick={() => {
            setKeeping(true);
            void onKeep().finally(() => setKeeping(false));
          }}
        >
          {dt(LIFE_FOCUS.nudgeKeep, lang)}
        </button>
        <button type="button" className="nova-focus-nudge__btn" onClick={onChange} aria-haspopup="dialog">
          {dt(LIFE_FOCUS.nudgeChange, lang)}
        </button>
        <button
          type="button"
          className="nova-focus-nudge__close"
          onClick={onDismiss}
          aria-label={dt(LIFE_FOCUS.nudgeDismiss, lang)}
        >
          <X size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      </span>
    </div>
  );
}

// The always-visible focus chip in the Today masthead (plan D3 / T0). Sized
// and toned to sit beside StreakChip; tapping it opens the picker.
export function LifeModeBadge({ mode, lang, onClick }: { mode: LifeMode; lang: Lang; onClick: () => void }) {
  const meta = MODE_META[mode];
  const label = lifeModeLabel(mode, lang);
  const prefix = dt(LIFE_FOCUS.chipPrefix, lang);
  return (
    <button
      type="button"
      className="nova-focus-chip"
      onClick={onClick}
      aria-label={dt(LIFE_FOCUS.chipAria, lang).replace("%s", `${prefix} ${label}`)}
      aria-haspopup="dialog"
    >
      <meta.Icon size={13} strokeWidth={1.9} aria-hidden="true" />
      <span className="nova-focus-chip__prefix">{prefix}</span>
      <span>{label}</span>
    </button>
  );
}
