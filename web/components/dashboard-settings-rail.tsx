"use client";

import type { Lang } from "@/lib/i18n";

/* ── Shared palette — 100% theme-reactive tokens (flips dark ⇄ light) ──
   Every value resolves against the Nova [data-ui="nova"] token blocks in
   dashboard-nova.css, which redefine the whole --color-* set under
   [data-theme="light"]. No raw hex/rgba literals here, so the Settings
   surface tracks whichever theme the shell is in. */
export const SETTINGS_C = {
  // text ladder
  text:         "var(--color-text-strong)",
  textMid:      "var(--color-text)",
  muted:        "var(--color-muted)",
  faint:        "var(--color-faint)",
  // brand / semantic
  accent:       "var(--color-accent)",         // fills + borders
  accentText:   "var(--color-text-accent)",    // gold used as TEXT (legible both themes)
  accentMuted:  "var(--color-accent-muted)",
  purple:       "var(--color-accent-secondary)",
  sage:         "var(--color-accent-alt)",
  sageBg:       "var(--color-high-bg)",
  sageBorder:   "var(--color-high-border)",
  danger:       "var(--color-low)",
  dangerText:   "var(--color-alert-critical-text)",
  dangerBg:     "var(--color-low-bg)",
  dangerBorder: "var(--color-low-border)",
  onAccent:     "var(--color-on-accent)",
  // surfaces + lines
  card:         "var(--color-surface)",
  surfaceSoft:  "var(--color-surface-soft)",
  raised:       "var(--color-hover-bg)",        // subtle raised fill in both themes
  border:       "var(--color-border)",
  borderStrong: "var(--color-border-strong)",
  // switch off-track: neutral in both themes via the text hue at low alpha
  offTrack:     "color-mix(in srgb, var(--color-muted) 45%, transparent)",
} as const;

export type SettingsSectionId =
  | "setup"
  | "account"
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
    gap: "11px",
    padding: "10px 13px",
    borderRadius: "10px",
    fontSize: "13.5px",
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
      ? { ...base, fontWeight: 600, color: SETTINGS_C.danger, background: SETTINGS_C.dangerBg, borderColor: SETTINGS_C.dangerBorder }
      : { ...base, fontWeight: 500, color: SETTINGS_C.danger, opacity: 0.82 };
  } else {
    style = active
      ? { ...base, fontWeight: 600, color: SETTINGS_C.text, background: SETTINGS_C.accentMuted, borderColor: SETTINGS_C.borderStrong }
      : { ...base, fontWeight: 500, color: SETTINGS_C.muted };
  }
  return (
    <button type="button" onClick={() => onNavigate(item.id)} style={style} aria-current={active ? "page" : undefined}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "currentColor", opacity: 0.65, flex: "none" }} />
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
  const vaultLine = vaultName?.trim()
    ? `${vaultName} ${lang === "ta" ? "கொட்டில்" : "vault"}`
    : (lang === "ta" ? "கொட்டில் தேர்ந்தெடுக்கப்படவில்லை" : "No vault selected");

  return (
    <div className="vs-settings-rail">
      <div className="vs-settings-rail-heading" style={{ padding: "0 4px 6px" }}>
        <div style={{ fontSize: "11px", letterSpacing: ".22em", textTransform: "uppercase", color: SETTINGS_C.purple, fontWeight: 700 }}>
          {lang === "ta" ? "அமைப்புகள்" : "Settings"}
        </div>
        <div style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "27px", fontWeight: 600, lineHeight: 1.05, color: SETTINGS_C.text, marginTop: "6px" }}>
          {lang === "ta" ? "விருப்பங்கள்" : "Preferences"}
        </div>
      </div>

      <nav className="vs-settings-railnav" aria-label={lang === "ta" ? "அமைப்புகள் வழிசெலுத்தல்" : "Settings navigation"}>
        {ITEMS.map((item) => (
          <RailButton key={item.id} item={item} active={active === item.id} onNavigate={onNavigate} lang={lang} />
        ))}
        <div className="vs-settings-rail-divider" style={{ height: "1px", background: SETTINGS_C.border, margin: "9px 6px" }} />
        <RailButton item={DANGER} active={active === "danger"} danger onNavigate={onNavigate} lang={lang} />
      </nav>

      <div
        className="vs-settings-identity"
        style={{
          marginTop: "20px",
          background: SETTINGS_C.surfaceSoft,
          border: `1px solid ${SETTINGS_C.border}`,
          borderRadius: "13px",
          padding: "13px 14px",
          display: "flex",
          alignItems: "center",
          gap: "11px",
        }}
      >
        <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: SETTINGS_C.accent, color: SETTINGS_C.onAccent, display: "grid", placeItems: "center", fontSize: "15px", fontWeight: 700, flex: "none" }}>
          {initialOf(userDisplayName)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: SETTINGS_C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</div>
          <div style={{ fontSize: "11px", color: SETTINGS_C.faint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{vaultLine}</div>
        </div>
      </div>
    </div>
  );
}
