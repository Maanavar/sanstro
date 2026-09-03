"use client";

import type { Lang } from "@/lib/i18n";

/* ── Settings surface styling ──
   All colours reference the semantic --color-* token layer directly, so the
   surface tracks whichever theme (Nova Galaxy / Warm) the shell is in — the
   Nova [data-ui="nova"] blocks in dashboard-nova.css redefine the whole set
   under [data-theme="light"]. */

export type SettingsSectionId =
  | "setup"
  | "account"
  | "context"
  | "experience"
  | "appearance"
  | "notifications"
  | "journal"
  | "privacy"
  | "danger";

type RailItem = { id: SettingsSectionId; labelEn: string; labelTa: string };

const ITEMS: RailItem[] = [
  { id: "setup",         labelEn: "Setup & Family",  labelTa: "அமைப்பு & குடும்பம்" },
  { id: "account",       labelEn: "Account",         labelTa: "கணக்கு" },
  // Life context (job change / marriage / relocation) is profile input the
  // engine reads — it lives with the profile now, not inside the diary (IA
  // audit 2026-07-22, Phase 4).
  { id: "context",       labelEn: "Life context",    labelTa: "வாழ்க்கை சூழல்" },
  { id: "experience",    labelEn: "Experience",      labelTa: "அனுபவம்" },
  { id: "appearance",    labelEn: "Appearance",      labelTa: "தோற்றம்" },
  { id: "notifications", labelEn: "Notifications",   labelTa: "அறிவிப்புகள்" },
  { id: "journal",       labelEn: "Journal & Data",  labelTa: "குறிப்பேடு & தரவு" },
  { id: "privacy",       labelEn: "Privacy & Legal", labelTa: "தனியுரிமை & சட்டம்" },
];

const DANGER: RailItem = { id: "danger", labelEn: "Danger Zone", labelTa: "ஆபத்து மண்டலம்" };

function initialOf(name: string): string {
  const trimmed = (name || "").trim();
  return trimmed ? trimmed[0]!.toUpperCase() : "S";
}

function RailButton({
  item, active, danger, onNavigate, lang,
}: {
  item: RailItem;
  active: boolean;
  danger?: boolean;
  onNavigate: (id: SettingsSectionId) => void;
  lang: Lang;
}) {
  const base: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-3)",
    padding: "var(--space-3) var(--space-3)",
    borderRadius: "var(--radius-md)",
    fontSize: "var(--text-base)",
    cursor: "pointer",
    transition: "background .15s, color .15s, border-color .15s",
    // Longhand (not the `border` shorthand) so the active branch can toggle
    // borderColor between renders without React warning about mixing
    // shorthand + non-shorthand for the same property.
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "transparent",
    background: "transparent",
    textAlign: "left",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  };
  let style: React.CSSProperties;
  if (danger) {
    style = active
      ? { ...base, fontWeight: 600, color: "var(--color-low)", background: "var(--color-low-bg)", borderColor: "var(--color-low-border)" }
      : { ...base, fontWeight: 500, color: "var(--color-low)", opacity: 0.82 };
  } else {
    style = active
      ? { ...base, fontWeight: 600, color: "var(--color-text-strong)", background: "var(--color-accent-muted)", borderColor: "var(--color-border-strong)" }
      : { ...base, fontWeight: 500, color: "var(--color-muted)" };
  }
  return (
    <button type="button" onClick={() => onNavigate(item.id)} style={style} aria-current={active ? "page" : undefined}>
      <span style={{ width: "6px", height: "6px", borderRadius: "var(--radius-pill)", background: "currentColor", opacity: 0.65, flex: "none" }} />
      {lang === "ta" ? item.labelTa : item.labelEn}
    </button>
  );
}

/**
 * Persistent left navigation for the Settings surface. Shared by the session
 * settings panels and the onboarding tab so both read as one Preferences space.
 */
export function SettingsRail({
  active,
  onNavigate,
  lang,
  userDisplayName,
  vaultName,
}: {
  active: SettingsSectionId;
  onNavigate: (id: SettingsSectionId) => void;
  lang: Lang;
  userDisplayName: string;
  vaultName: string;
}) {
  const displayName = userDisplayName?.trim() || (lang === "ta" ? "உங்கள் கணக்கு" : "Your account");
  // A-010: the reader's own family, not a "vault".
  const vaultLine = vaultName?.trim()
    ? `${vaultName} ${lang === "ta" ? "குடும்பம்" : "family"}`
    : (lang === "ta" ? "குடும்பம் தேர்ந்தெடுக்கப்படவில்லை" : "No family selected");

  return (
    <div className="vs-settings-rail">
      <div className="vs-settings-rail-heading" style={{ paddingRight: "var(--space-1)", paddingBottom: "var(--space-2)", paddingLeft: "var(--space-1)" }}>
        <div style={{ fontSize: "var(--text-xs)", letterSpacing: ".22em", textTransform: "uppercase", color: "var(--color-accent-secondary)", fontWeight: 700 }}>
          {lang === "ta" ? "அமைப்புகள்" : "Settings"}
        </div>
        <div style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "var(--text-xl)", fontWeight: 600, lineHeight: 1.05, color: "var(--color-text-strong)", marginTop: "6px" }}>
          {lang === "ta" ? "விருப்பங்கள்" : "Preferences"}
        </div>
      </div>

      <nav className="vs-settings-railnav" aria-label={lang === "ta" ? "அமைப்புகள் வழிசெலுத்தல்" : "Settings navigation"}>
        {ITEMS.map((item) => (
          <RailButton key={item.id} item={item} active={active === item.id} onNavigate={onNavigate} lang={lang} />
        ))}
        <div className="vs-settings-rail-divider" style={{ height: "1px", background: "var(--color-border)", margin: "9px 6px" }} />
        <RailButton item={DANGER} active={active === "danger"} danger onNavigate={onNavigate} lang={lang} />
      </nav>

      <div
        className="vs-settings-identity"
        style={{
          marginTop: "20px",
          background: "var(--color-surface-soft)",
          border: `1px solid var(--color-border)`,
          borderRadius: "var(--radius-md)",
          padding: "var(--space-3) var(--space-4)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
        }}
      >
        <div style={{ width: "38px", height: "38px", borderRadius: "var(--radius-pill)", background: "var(--color-accent)", color: "var(--color-on-accent)", display: "grid", placeItems: "center", fontSize: "var(--text-md)", fontWeight: 700, flex: "none" }}>
          {initialOf(userDisplayName)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{vaultLine}</div>
        </div>
      </div>
    </div>
  );
}
