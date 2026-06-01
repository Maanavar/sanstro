"use client";

import { useEffect, useState } from "react";

import { apiFetchJson } from "@/lib/api";
import { clearFcmTokenLocal, fetchFcmToken, hasFirebaseMessagingConfig } from "@/lib/firebase-messaging";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { NotificationPreferenceData } from "@/lib/types";

type DashboardSettingsSessionTabProps = {
  lang: Lang;
  ownerUserId: string;
  selectedDate: string;
  selectedVaultId: string;
  birthProfileId: string;
  chartId: string;
  busyPersonal: boolean;
  busyFamily: boolean;
  journalRetentionDays: number;
  journalLastUpdatedAt: string | null;
  journalLastRetentionReviewedAt: string | null;
  journalNextRecommendedReviewDate: string | null;
  busyJournalSettings: boolean;
  notificationPrefs: NotificationPreferenceData | null;
  onNotificationPrefsSaved: (prefs: NotificationPreferenceData) => void;
  userMode: "BEGINNER" | "BALANCED" | "TRADITIONAL";
  goalTrack: "CAREER" | "EXAM" | "RELATIONSHIP" | "FINANCIAL" | null;
  onSaveUserSettings: (mode: "BEGINNER" | "BALANCED" | "TRADITIONAL", track: "CAREER" | "EXAM" | "RELATIONSHIP" | "FINANCIAL" | null) => void;
  onOpenSetup: () => void;
  onSettingsSubTabChange: (sub: "setup" | "session") => void;
  onOwnerUserIdChange: (value: string) => void;
  onSelectedDateChange: (value: string) => void;
  onRefreshPersonal: () => void;
  onRefreshFamily: () => void;
  onSaveJournalRetentionDays: (days: number) => void;
  onAcknowledgeJournalReminder: () => void;
  onSignOut: () => void;
};

/* ── Warm design tokens (match personal / family / life-areas tabs) ── */
const W = {
  ink:       "#1A1612",
  inkMid:    "#3D352B",
  muted:     "#7A6F5E",
  mutedLt:   "var(--color-faint)",
  border:    "#D4C8AE",
  borderLt:  "#E4DBC8",
  surface:   "#FAF5EA",
  surfaceMd: "#F4EEE2",
  card:      "#FFFFFF",
  terracota: "#B85A2C",
  gold:      "#C6973A",
  sage:      "#5C7654",
  accent:    "#8c3e18",
} as const;

/* ── Pill toggle button ── */
function PillBtn({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "var(--space-1_5) var(--space-4)",
        borderRadius: "var(--radius-pill)",
        fontSize: "0.875rem",
        fontWeight: 600,
        cursor: "pointer",
        border: "1.5px solid",
        borderColor: active ? W.ink : W.border,
        background: active ? W.ink : "transparent",
        color: active ? W.surfaceMd : W.muted,
        fontFamily: "inherit",
        transition: "all 0.12s ease",
      }}
    >
      {children}
    </button>
  );
}

/* ── Section card ── */
function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: W.surface,
      border: `1px solid ${W.borderLt}`,
      borderRadius: "var(--radius-md)",
      padding: "var(--space-6)",
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-5)",
    }}>
      {children}
    </div>
  );
}

/* ── Section label ── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      margin: 0,
      fontSize: "0.625rem",
      fontWeight: 700,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: W.terracota,
    }}>
      {children}
    </p>
  );
}

/* ── Field row ── */
function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
      <label style={{ fontSize: "0.875rem", fontWeight: 600, color: W.inkMid }}>{label}</label>
      {children}
      {hint && <span style={{ fontSize: "0.75rem", color: W.mutedLt, lineHeight: 1.4 }}>{hint}</span>}
    </div>
  );
}

/* ── Input ── */
function WarmInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: "var(--space-2) var(--space-3)",
        borderRadius: "var(--radius-md)",
        border: `1.5px solid ${W.borderLt}`,
        background: W.card,
        color: W.inkMid,
        fontSize: "0.875rem",
        fontFamily: "inherit",
        outline: "none",
        ...(props.style ?? {}),
      }}
    />
  );
}

/* ── Select ── */
function WarmSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        width: "100%",
        padding: "var(--space-2) var(--space-3)",
        borderRadius: "var(--radius-md)",
        border: `1.5px solid ${W.borderLt}`,
        background: W.card,
        color: W.inkMid,
        fontSize: "0.875rem",
        fontFamily: "inherit",
        outline: "none",
        ...(props.style ?? {}),
      }}
    />
  );
}

/* ── Action button ── */
function ActionBtn({
  onClick, disabled, children, variant = "primary",
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "danger";
}) {
  const styles: React.CSSProperties =
    variant === "primary"
      ? { background: W.ink, color: W.surfaceMd, border: `1.5px solid ${W.ink}` }
      : variant === "danger"
      ? { background: "transparent", color: "#A8482F", border: "1.5px solid #A8482F" }
      : { background: "transparent", color: W.muted, border: `1.5px solid ${W.border}` };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "var(--space-2) var(--space-5)",
        borderRadius: "var(--radius-md)",
        fontSize: "0.875rem",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        fontFamily: "inherit",
        transition: "opacity 0.12s",
        ...styles,
      }}
    >
      {children}
    </button>
  );
}

/* ── Toggle checkbox row ── */
function ToggleRow({
  checked, onChange, children,
}: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2_5)", cursor: "pointer" }}>
      <span style={{
        display: "inline-flex",
        width: "36px", height: "20px",
        borderRadius: "var(--radius-pill)",
        border: `1.5px solid ${checked ? W.terracota : W.border}`,
        background: checked ? W.terracota : W.surfaceMd,
        position: "relative",
        flexShrink: 0,
        transition: "all 0.15s",
        cursor: "pointer",
      }} onClick={() => onChange(!checked)}>
        <span style={{
          position: "absolute",
          top: "2px",
          left: checked ? "16px" : "2px",
          width: "14px", height: "14px",
          borderRadius: "50%",
          background: checked ? "#fff" : W.mutedLt,
          transition: "left 0.15s",
        }} />
      </span>
      <span style={{ fontSize: "0.875rem", color: W.inkMid, lineHeight: 1.4 }}>{children}</span>
    </label>
  );
}

export function DashboardSettingsSessionTab({
  lang,
  ownerUserId,
  selectedDate,
  selectedVaultId,
  birthProfileId,
  chartId,
  busyPersonal,
  busyFamily,
  journalRetentionDays,
  journalLastUpdatedAt,
  journalLastRetentionReviewedAt,
  journalNextRecommendedReviewDate,
  busyJournalSettings,
  notificationPrefs,
  onNotificationPrefsSaved,
  userMode,
  goalTrack,
  onSaveUserSettings,
  onOpenSetup,
  onSettingsSubTabChange,
  onOwnerUserIdChange,
  onSelectedDateChange,
  onRefreshPersonal,
  onRefreshFamily,
  onSaveJournalRetentionDays,
  onAcknowledgeJournalReminder,
  onSignOut,
}: DashboardSettingsSessionTabProps) {
  const [retentionDraft, setRetentionDraft] = useState(journalRetentionDays);
  const [modeDraft, setModeDraft] = useState<"BEGINNER" | "BALANCED" | "TRADITIONAL">(userMode);
  const [trackDraft, setTrackDraft] = useState<"CAREER" | "EXAM" | "RELATIONSHIP" | "FINANCIAL" | "">(goalTrack ?? "");
  const [userSettingsSaving, setUserSettingsSaving] = useState(false);
  const [userSettingsSaved, setUserSettingsSaved] = useState(false);

  const [notifChannel, setNotifChannel] = useState<"none" | "email" | "push" | "both">("none");
  const [notifMorning, setNotifMorning] = useState(false);
  const [notifMorningTime, setNotifMorningTime] = useState("06:00");
  const [notifDasha, setNotifDasha] = useState(false);
  const [notifPirantha, setNotifPirantha] = useState(false);
  const [notifSmartSilence, setNotifSmartSilence] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState("");

  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deleteDeleting, setDeleteDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => { setModeDraft(userMode); }, [userMode]);
  useEffect(() => { setTrackDraft(goalTrack ?? ""); }, [goalTrack]);
  useEffect(() => { setRetentionDraft(journalRetentionDays); }, [journalRetentionDays]);
  useEffect(() => {
    if (notificationPrefs) {
      setNotifChannel(notificationPrefs.notification_channel);
      setNotifMorning(notificationPrefs.morningAlertEnabled);
      setNotifMorningTime(notificationPrefs.morningAlertTime);
      setNotifDasha(notificationPrefs.dashaAlertEnabled);
      setNotifPirantha(notificationPrefs.piranthaNaalAlertEnabled);
      setNotifSmartSilence(notificationPrefs.smartSilenceEnabled);
    }
  }, [notificationPrefs]);

  const pushUnavailable = !hasFirebaseMessagingConfig();

  async function registerPushToken() {
    if (pushUnavailable) {
      setPushMessage(lang === "ta" ? "Push notifications unavailable." : "Push notifications unavailable.");
      return;
    }
    if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
    setPushBusy(true);
    setPushMessage("");
    try {
      // Requires web Firebase config + VAPID key in env and firebase-messaging-sw.js in public/.
      await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushMessage(lang === "ta" ? "அனுமதி தேவை." : "Notification permission is required.");
        return;
      }
      const swRegistration = await navigator.serviceWorker.ready;
      const token = await fetchFcmToken(swRegistration);
      await apiFetchJson("/api/v1/settings/notifications/fcm-token", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, platform: "web" }),
      });
      setPushMessage(lang === "ta" ? "Push token பதிவு செய்யப்பட்டது." : "Push token registered.");
    } catch {
      setPushMessage(lang === "ta" ? "Push பதிவு தோல்வியடைந்தது." : "Push registration failed.");
    } finally {
      setPushBusy(false);
    }
  }

  async function unregisterPushToken() {
    setPushBusy(true);
    setPushMessage("");
    try {
      await apiFetchJson("/api/v1/settings/notifications/fcm-token", { method: "DELETE" });
      await clearFcmTokenLocal();
      setPushMessage(lang === "ta" ? "Push token நீக்கப்பட்டது." : "Push token removed.");
    } catch {
      setPushMessage(lang === "ta" ? "Push token நீக்க முடியவில்லை." : "Unable to remove push token.");
    } finally {
      setPushBusy(false);
    }
  }

  const handleSaveUserSettings = async () => {
    setUserSettingsSaving(true);
    setUserSettingsSaved(false);
    try {
      await onSaveUserSettings(modeDraft, trackDraft || null);
      setUserSettingsSaved(true);
      setTimeout(() => setUserSettingsSaved(false), 2500);
    } finally {
      setUserSettingsSaving(false);
    }
  };

  const handleSaveNotifications = () => {
    setNotifSaving(true);
    setNotifSaved(false);
    apiFetchJson<{ success: boolean; data: NotificationPreferenceData }>("/api/v1/settings/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notificationChannel: notifChannel,
        morningAlertEnabled: notifMorning,
        morningAlertTime: notifMorningTime,
        dashaAlertEnabled: notifDasha,
        piranthaNaalAlertEnabled: notifPirantha,
        smartSilenceEnabled: notifSmartSilence,
      }),
    })
      .then((r) => { onNotificationPrefsSaved(r.data); setNotifSaved(true); setTimeout(() => setNotifSaved(false), 3000); })
      .catch(() => {})
      .finally(() => setNotifSaving(false));
  };

  const handleDeleteAccount = async () => {
    setDeleteDeleting(true);
    setDeleteError("");
    try {
      await apiFetchJson<{ detail: string }>("/api/v1/auth/me", { method: "DELETE" });
      window.location.href = "/login";
    } catch {
      setDeleteError(lang === "ta" ? "நீக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்." : "Could not delete account. Please try again.");
      setDeleteDeleting(false);
    }
  };

  const retentionValid = Number.isFinite(retentionDraft) && retentionDraft >= 7 && retentionDraft <= 3650;
  const retentionNotice =
    retentionDraft <= 30 ? t("settings_retention_notice_short", lang)
    : retentionDraft <= 90 ? t("settings_retention_notice_medium", lang)
    : t("settings_retention_notice_long", lang);

  const fmt = (v: string | null) => {
    if (!v) return t("settings_retention_not_available", lang);
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? t("settings_retention_not_available", lang) : d.toLocaleString();
  };
  const fmtDate = (v: string | null) => {
    if (!v) return t("settings_retention_not_available", lang);
    const d = new Date(`${v}T00:00:00Z`);
    return Number.isNaN(d.getTime()) ? t("settings_retention_not_available", lang) : d.toLocaleDateString();
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-8)",
      fontFamily: "var(--font-body)",
      color: W.ink,
      maxWidth: "760px",
    }}>

      {/* ── Settings sub-tab switcher ── */}
      <div style={{ display: "flex", gap: "var(--space-1_5)" }}>
        {([
          { key: "setup",   label: lang === "ta" ? "ஆரம்ப நிலை" : "Onboarding" },
          { key: "session", label: lang === "ta" ? "அமைப்புகள்" : "Settings" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => onSettingsSubTabChange(key)}
            style={{
              padding: "var(--space-2) var(--space-4_5)", borderRadius: "var(--radius-pill)", fontSize: "0.875rem", fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
              border: "1.5px solid",
              borderColor: key === "session" ? W.ink : W.border,
              background: key === "session" ? W.ink : "transparent",
              color: key === "session" ? W.surfaceMd : W.muted,
              transition: "all 0.12s ease",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Hero ── */}
      <div>
        <p style={{ margin: "0 0 var(--space-1_5)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: W.terracota }}>
          {t("settings_kicker", lang)}
        </p>
        <h1 style={{
          margin: "0 0 var(--space-2_5)",
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2rem, 4vw, 2.8rem)",
          fontWeight: 500,
          letterSpacing: "-0.03em",
          lineHeight: 1.08,
          color: W.ink,
        }}>
          {lang === "ta" ? "அமைப்புகள்" : "Settings"}
          <br />
          <em style={{ fontStyle: "italic", color: W.muted }}>
            {lang === "ta" ? "& விருப்பத்தேர்வுகள்." : "& preferences."}
          </em>
        </h1>
        <p style={{ margin: 0, fontSize: "0.875rem", color: W.muted, lineHeight: 1.6 }}>
          {t("settings_desc", lang)}
        </p>
      </div>

      {/* ── Session info ── */}
      <SettingsCard>
        <SectionLabel>{lang === "ta" ? "அமர்வு" : "Session"}</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)" }}>
          <FieldRow label={t("settings_owner", lang)} hint={t("settings_owner_hint", lang)}>
            <WarmInput value={ownerUserId} onChange={(e) => onOwnerUserIdChange(e.target.value)} />
          </FieldRow>
          <FieldRow label={t("settings_date", lang)}>
            <WarmInput type="date" value={selectedDate} onChange={(e) => onSelectedDateChange(e.target.value)} />
          </FieldRow>
          <FieldRow label={t("settings_vault", lang)} hint={t("settings_vault_hint", lang)}>
            <WarmInput value={selectedVaultId} readOnly style={{ background: W.surfaceMd, cursor: "default" }} />
          </FieldRow>
          <FieldRow label={t("settings_profile", lang)}>
            <WarmInput value={birthProfileId} readOnly style={{ background: W.surfaceMd, cursor: "default" }} />
          </FieldRow>
          <FieldRow label={t("settings_chart", lang)}>
            <WarmInput value={chartId} readOnly style={{ background: W.surfaceMd, cursor: "default" }} />
          </FieldRow>
        </div>

        {/* Quick actions */}
        <div style={{ paddingTop: "var(--space-1)", borderTop: `1px solid ${W.borderLt}` }}>
          <p style={{ margin: "0 0 var(--space-2_5)", fontSize: "0.75rem", fontWeight: 700, color: W.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {t("settings_quick", lang)}
          </p>
          <div style={{ display: "flex", gap: "var(--space-2_5)", flexWrap: "wrap" }}>
            <ActionBtn onClick={onRefreshPersonal} disabled={!birthProfileId || busyPersonal} variant="ghost">
              {busyPersonal ? t("btn_refreshing", lang) : t("btn_refresh_personal", lang)}
            </ActionBtn>
            <ActionBtn onClick={onRefreshFamily} disabled={!selectedVaultId || busyFamily} variant="ghost">
              {busyFamily ? t("btn_refreshing", lang) : t("btn_refresh_family", lang)}
            </ActionBtn>
            <ActionBtn onClick={onOpenSetup} variant="ghost">
              {t("tab_setup", lang)}
            </ActionBtn>
            <ActionBtn onClick={onSignOut} variant="danger">
              {lang === "ta" ? "வெளியேறு" : "Sign out"}
            </ActionBtn>
          </div>
        </div>
      </SettingsCard>

      {/* ── Experience mode + Goal track ── */}
      <SettingsCard>
        <SectionLabel>{lang === "ta" ? "அனுபவ அமைப்பு" : "Experience mode"}</SectionLabel>

        <div>
          <p style={{ margin: "0 0 var(--space-2_5)", fontSize: "0.875rem", color: W.muted }}>{t("mode_label", lang)}</p>
          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
            {(["BEGINNER", "BALANCED", "TRADITIONAL"] as const).map((m) => (
              <PillBtn key={m} active={modeDraft === m} onClick={() => setModeDraft(m)}>
                {t(m === "BEGINNER" ? "mode_beginner" : m === "BALANCED" ? "mode_balanced" : "mode_traditional", lang)}
              </PillBtn>
            ))}
          </div>
        </div>

        <div>
          <p style={{ margin: "0 0 var(--space-2_5)", fontSize: "0.875rem", color: W.muted }}>{t("track_label", lang)}</p>
          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
            <PillBtn active={trackDraft === ""} onClick={() => setTrackDraft("")}>
              {t("track_none", lang)}
            </PillBtn>
            {(["CAREER", "EXAM", "RELATIONSHIP", "FINANCIAL"] as const).map((tr) => (
              <PillBtn key={tr} active={trackDraft === tr} onClick={() => setTrackDraft(tr)}>
                {t(tr === "CAREER" ? "track_career" : tr === "EXAM" ? "track_exam" : tr === "RELATIONSHIP" ? "track_relationship" : "track_financial", lang)}
              </PillBtn>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
          <ActionBtn onClick={() => void handleSaveUserSettings()} disabled={userSettingsSaving}>
            {userSettingsSaving ? t("notif_saving", lang) : lang === "ta" ? "சேமி" : "Save preferences"}
          </ActionBtn>
          {userSettingsSaved && (
            <span style={{ fontSize: "0.875rem", color: W.sage, fontWeight: 600 }}>
              <svg viewBox="0 0 24 24" fill="none" width="14" height="14" aria-hidden="true" style={{ flexShrink: 0 }}><path d="M5.5 12.5L10 17L18.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {lang === "ta" ? "சேமிக்கப்பட்டது" : "Saved"}
            </span>
          )}
        </div>
      </SettingsCard>

      {/* ── Journal retention ── */}
      <SettingsCard>
        <SectionLabel>{lang === "ta" ? "குறிப்பேடு தக்கவைப்பு" : "Journal retention"}</SectionLabel>
        <p style={{ margin: 0, fontSize: "0.875rem", color: W.muted, lineHeight: 1.55 }}>
          {t("settings_retention_desc", lang)}
        </p>

        <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-end", flexWrap: "wrap" }}>
          <FieldRow label={t("settings_retention_days", lang)} hint={t("settings_retention_hint", lang)}>
            <WarmInput
              type="number"
              min={7}
              max={3650}
              value={retentionDraft}
              onChange={(e) => setRetentionDraft(Number.parseInt(e.target.value || "0", 10))}
              style={{ maxWidth: "120px" }}
            />
          </FieldRow>
          <ActionBtn onClick={() => onSaveJournalRetentionDays(retentionDraft)} disabled={!retentionValid || busyJournalSettings}>
            {busyJournalSettings ? t("settings_retention_saving", lang) : t("settings_retention_save", lang)}
          </ActionBtn>
        </div>

        <p style={{
          margin: 0,
          fontSize: "0.875rem",
          color: retentionDraft <= 30 ? W.terracota : W.muted,
          lineHeight: 1.5,
        }}>
          {retentionNotice}
        </p>

        <div style={{ display: "grid", gap: "var(--space-1)", fontSize: "0.875rem", color: W.mutedLt }}>
          <p style={{ margin: 0 }}>{t("settings_retention_last_updated", lang)}: {fmt(journalLastUpdatedAt)}</p>
          <p style={{ margin: 0 }}>{t("settings_retention_last_reviewed", lang)}: {fmt(journalLastRetentionReviewedAt)}</p>
          <p style={{ margin: 0 }}>{t("settings_retention_next_review", lang)}: {fmtDate(journalNextRecommendedReviewDate)}</p>
        </div>

        <div>
          <ActionBtn onClick={onAcknowledgeJournalReminder} disabled={busyJournalSettings} variant="ghost">
            {busyJournalSettings ? t("settings_retention_saving", lang) : t("settings_retention_acknowledge", lang)}
          </ActionBtn>
        </div>
      </SettingsCard>

      {/* ── Notifications ── */}
      <SettingsCard>
        <SectionLabel>{lang === "ta" ? "அறிவிப்புகள்" : "Notifications"}</SectionLabel>

        <FieldRow label={t("notif_channel", lang)}>
          <WarmSelect value={notifChannel} onChange={(e) => setNotifChannel(e.target.value as "none" | "email" | "push" | "both")} style={{ maxWidth: "240px" }}>
            <option value="none">{t("notif_channel_none", lang)}</option>
            <option value="email">{t("notif_channel_email", lang)}</option>
            <option value="push">{t("notif_channel_push", lang)}</option>
            <option value="both">{t("notif_channel_both", lang)}</option>
          </WarmSelect>
        </FieldRow>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3_5)" }}>
          <ToggleRow checked={notifMorning} onChange={setNotifMorning}>
            {t("notif_morning_alert", lang)}
            {notifMorning && (
              <WarmInput
                type="time"
                value={notifMorningTime}
                onChange={(e) => setNotifMorningTime(e.target.value)}
                style={{ maxWidth: "100px", marginLeft: "var(--space-2)", display: "inline-block" }}
              />
            )}
          </ToggleRow>
          <ToggleRow checked={notifDasha} onChange={setNotifDasha}>
            {t("notif_dasha_alert", lang)}
          </ToggleRow>
          <ToggleRow checked={notifPirantha} onChange={setNotifPirantha}>
            {t("notif_pirantha_alert", lang)}
          </ToggleRow>
          <ToggleRow checked={notifSmartSilence} onChange={setNotifSmartSilence}>
            {t("notif_smart_silence", lang)}
          </ToggleRow>
        </div>

        {notificationPrefs && (
          <p style={{ margin: 0, fontSize: "0.75rem", color: notificationPrefs.fcmTokenRegistered ? W.sage : W.mutedLt }}>
            {notificationPrefs.fcmTokenRegistered ? t("notif_fcm_registered", lang) : t("notif_fcm_not_registered", lang)}
          </p>
        )}
        {pushUnavailable && (
          <p style={{ margin: 0, fontSize: "0.75rem", color: W.mutedLt }}>
            {lang === "ta" ? "Push notifications unavailable." : "Push notifications unavailable."}
          </p>
        )}

        <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
          <ActionBtn onClick={handleSaveNotifications} disabled={notifSaving}>
            {notifSaving ? t("notif_saving", lang) : t("btn_save_notifications", lang)}
          </ActionBtn>
          {!pushUnavailable && (
            <>
              <ActionBtn onClick={() => void registerPushToken()} disabled={pushBusy} variant="ghost">
                {pushBusy ? (lang === "ta" ? "செயலாக்கம்..." : "Processing...") : (lang === "ta" ? "Push பதிவு" : "Register push")}
              </ActionBtn>
              <ActionBtn onClick={() => void unregisterPushToken()} disabled={pushBusy} variant="danger">
                {lang === "ta" ? "Push நீக்கு" : "Remove push"}
              </ActionBtn>
            </>
          )}
          {notifSaved && (
            <span style={{ fontSize: "0.875rem", color: W.sage, fontWeight: 600 }}>
              {t("notif_saved", lang)}
            </span>
          )}
        </div>
        {pushMessage && <p style={{ margin: 0, fontSize: "0.75rem", color: W.muted }}>{pushMessage}</p>}
      </SettingsCard>

      {/* ── Help & Feedback ── */}
      <SettingsCard>
        <SectionLabel>{lang === "ta" ? "உதவி & கருத்து" : "Help & feedback"}</SectionLabel>
        <p style={{ margin: 0, fontSize: "0.875rem", color: W.muted, lineHeight: 1.55 }}>
          {lang === "ta"
            ? "கேள்விகள் அல்லது பரிந்துரைகள் இருந்தால் தொடர்பு கொள்ளவும்."
            : "Have questions or suggestions? We're here to help."}
        </p>
        <div>
          <ActionBtn onClick={() => { window.location.href = "mailto:support@vinaadi.ai"; }} variant="ghost">
            {lang === "ta" ? "✉ கருத்து அனுப்பு" : "✉ Send feedback"}
          </ActionBtn>
        </div>
      </SettingsCard>

      {/* ── Danger zone ── */}
      <SettingsCard>
        <p style={{ margin: 0, fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#991B1B" }}>
          {t("danger_zone_title", lang)}
        </p>
        <p style={{ margin: "0 0 var(--space-3)", fontSize: "0.875rem", color: W.muted, lineHeight: 1.55 }}>
          {t("delete_account_warning", lang)}
        </p>
        {!deleteConfirming ? (
          <ActionBtn onClick={() => { setDeleteConfirming(true); setDeleteError(""); }} variant="danger">
            {t("delete_account_btn", lang)}
          </ActionBtn>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", padding: "var(--space-4)", background: "#FEF2F2", borderRadius: "var(--radius-md)", border: "1px solid #FECACA" }}>
            <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "#991B1B" }}>
              {t("delete_account_confirm_prompt", lang)}
            </p>
            {deleteError && (
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#991B1B" }}>{deleteError}</p>
            )}
            <div style={{ display: "flex", gap: "var(--space-2_5)", flexWrap: "wrap" }}>
              <ActionBtn onClick={() => void handleDeleteAccount()} disabled={deleteDeleting} variant="danger">
                {deleteDeleting ? t("delete_account_deleting", lang) : t("delete_account_confirm_btn", lang)}
              </ActionBtn>
              <ActionBtn onClick={() => { setDeleteConfirming(false); setDeleteError(""); }} disabled={deleteDeleting} variant="ghost">
                {t("delete_account_cancel", lang)}
              </ActionBtn>
            </div>
          </div>
        )}
      </SettingsCard>

      {/* ── Privacy footer ── */}
      <div style={{
        borderRadius: "var(--radius-md)",
        border: `1px solid ${W.borderLt}`,
        background: W.surfaceMd,
        padding: "var(--space-4) var(--space-5)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
      }}>
        <p style={{ margin: 0, fontSize: "0.75rem", color: W.mutedLt, lineHeight: 1.6 }}>
          {t("disclaimer_astro", lang)}
        </p>
        <p style={{ margin: 0, fontSize: "0.75rem", color: W.mutedLt, lineHeight: 1.5 }}>
          {t("disclaimer_no_doom", lang)}
        </p>
        <p style={{ margin: 0, fontSize: "0.75rem", color: W.mutedLt, lineHeight: 1.5 }}>
          {t("disclaimer_data", lang)}
        </p>
        <div style={{ display: "flex", gap: "var(--space-4)", marginTop: "var(--space-1)" }}>
          <span style={{ fontSize: "0.75rem", color: W.muted, textDecoration: "underline", cursor: "pointer" }}>
            {t("privacy_link", lang)}
          </span>
          <span style={{ fontSize: "0.75rem", color: W.muted, textDecoration: "underline", cursor: "pointer" }}>
            {t("terms_link", lang)}
          </span>
        </div>
      </div>

    </div>
  );
}
