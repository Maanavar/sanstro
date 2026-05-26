"use client";

import { useEffect, useState } from "react";

import { apiFetchJson } from "@/lib/api";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { NotificationPreferenceData } from "@/lib/types";

import { Button, Field } from "./dashboard-ui";

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
  onOpenSetup: () => void;
  onOwnerUserIdChange: (value: string) => void;
  onSelectedDateChange: (value: string) => void;
  onRefreshPersonal: () => void;
  onRefreshFamily: () => void;
  onSaveJournalRetentionDays: (days: number) => void;
  onAcknowledgeJournalReminder: () => void;
  onSignOut: () => void;
};

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
  onOpenSetup,
  onOwnerUserIdChange,
  onSelectedDateChange,
  onRefreshPersonal,
  onRefreshFamily,
  onSaveJournalRetentionDays,
  onAcknowledgeJournalReminder,
  onSignOut,
}: DashboardSettingsSessionTabProps) {
  const [retentionDraft, setRetentionDraft] = useState(journalRetentionDays);

  // ARCH-02: Notification preferences local draft state
  const [notifChannel, setNotifChannel] = useState<"none" | "email" | "push" | "both">("none");
  const [notifMorning, setNotifMorning] = useState(false);
  const [notifMorningTime, setNotifMorningTime] = useState("06:00");
  const [notifDasha, setNotifDasha] = useState(false);
  const [notifPirantha, setNotifPirantha] = useState(false);
  const [notifSmartSilence, setNotifSmartSilence] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

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

  useEffect(() => {
    setRetentionDraft(journalRetentionDays);
  }, [journalRetentionDays]);

  const noticeKey: "settings_retention_notice_short" | "settings_retention_notice_medium" | "settings_retention_notice_long" =
    retentionDraft <= 30
      ? "settings_retention_notice_short"
      : retentionDraft <= 90
        ? "settings_retention_notice_medium"
        : "settings_retention_notice_long";
  const retentionValid = Number.isFinite(retentionDraft) && retentionDraft >= 7 && retentionDraft <= 3650;

  const formatTimestamp = (value: string | null): string => {
    if (!value) return t("settings_retention_not_available", lang);
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return t("settings_retention_not_available", lang);
    return parsed.toLocaleString();
  };

  const formatDateOnly = (value: string | null): string => {
    if (!value) return t("settings_retention_not_available", lang);
    const parsed = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) return t("settings_retention_not_available", lang);
    return parsed.toLocaleDateString();
  };

  return (
    <div className="tab-section">
            <div className="settings-layout">
              <aside className="card settings-sidebar">
                <button
                  type="button"
                  className="settings-sidebtn"
                  onClick={() => onOpenSetup()}
                >
                  {t("tab_setup", lang)}
                </button>
                <button
                  type="button"
                  className="settings-sidebtn settings-sidebtn--active"
                  onClick={() => {}}
                >
                  {t("settings_title", lang)}
                </button>
              </aside>
              <div className="settings-content">
            <div>
              <p className="section-kicker">{t("settings_kicker", lang)}</p>
              <h2 className="section-title">{t("settings_title", lang)}</h2>
              <p className="section-description">{t("settings_desc", lang)}</p>
            </div>

            <div className="card" style={{ padding: "24px" }}>
              <div className="settings-grid">
                <Field label={t("settings_owner", lang)} helper={t("settings_owner_hint", lang)}>
                  <input className="input" value={ownerUserId}
                    onChange={(e) => { onOwnerUserIdChange(e.target.value); }} />
                </Field>
                <Field label={t("settings_date", lang)}>
                  <input className="input" type="date" value={selectedDate} onChange={(e) => onSelectedDateChange(e.target.value)} />
                </Field>
                <Field label={t("settings_vault", lang)} helper={t("settings_vault_hint", lang)}>
                  <input className="input" value={selectedVaultId} readOnly />
                </Field>
                <Field label={t("settings_profile", lang)}>
                  <input className="input" value={birthProfileId} readOnly />
                </Field>
                <Field label={t("settings_chart", lang)}>
                  <input className="input" value={chartId} readOnly />
                </Field>
              </div>

              <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="surface__subhead" style={{ marginBottom: "10px" }}>{t("settings_quick", lang)}</p>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <Button onClick={() => onRefreshPersonal()} variant="ghost" disabled={!birthProfileId || busyPersonal}>
                    {busyPersonal ? t("btn_refreshing", lang) : t("btn_refresh_personal", lang)}
                  </Button>
                  <Button onClick={() => onRefreshFamily()} variant="ghost" disabled={!selectedVaultId || busyFamily}>
                    {busyFamily ? t("btn_refreshing", lang) : t("btn_refresh_family", lang)}
                  </Button>
                  <Button onClick={onSignOut} variant="ghost">Sign out</Button>
                </div>
              </div>

              <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="surface__subhead" style={{ marginBottom: "6px" }}>{t("settings_retention_title", lang)}</p>
                <p style={{ margin: "0 0 12px", color: "rgba(255,255,255,0.6)", fontSize: "0.84rem" }}>
                  {t("settings_retention_desc", lang)}
                </p>
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap" }}>
                  <Field label={t("settings_retention_days", lang)} helper={t("settings_retention_hint", lang)}>
                    <input
                      className="input"
                      type="number"
                      min={7}
                      max={3650}
                      value={retentionDraft}
                      onChange={(e) => setRetentionDraft(Number.parseInt(e.target.value || "0", 10))}
                    />
                  </Field>
                  <Button
                    onClick={() => onSaveJournalRetentionDays(retentionDraft)}
                    variant="ghost"
                    disabled={!retentionValid || busyJournalSettings}
                  >
                    {busyJournalSettings ? t("settings_retention_saving", lang) : t("settings_retention_save", lang)}
                  </Button>
                </div>
                <p
                  style={{
                    margin: "8px 0 0",
                    color: retentionDraft <= 30 ? "rgba(255,210,120,0.95)" : "rgba(255,255,255,0.72)",
                    fontSize: "0.82rem",
                  }}
                >
                  {t(noticeKey, lang)}
                </p>
                <div style={{ marginTop: "12px", display: "grid", gap: "6px", fontSize: "0.82rem", color: "rgba(255,255,255,0.72)" }}>
                  <p style={{ margin: 0 }}>
                    {t("settings_retention_last_updated", lang)}: {formatTimestamp(journalLastUpdatedAt)}
                  </p>
                  <p style={{ margin: 0 }}>
                    {t("settings_retention_last_reviewed", lang)}: {formatTimestamp(journalLastRetentionReviewedAt)}
                  </p>
                  <p style={{ margin: 0 }}>
                    {t("settings_retention_next_review", lang)}: {formatDateOnly(journalNextRecommendedReviewDate)}
                  </p>
                </div>
                <div style={{ marginTop: "10px" }}>
                  <Button onClick={onAcknowledgeJournalReminder} variant="ghost" disabled={busyJournalSettings}>
                    {busyJournalSettings ? t("settings_retention_saving", lang) : t("settings_retention_acknowledge", lang)}
                  </Button>
                </div>
              </div>
            </div>

            {/* ARCH-02: Notification Preferences */}
            <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="surface__subhead" style={{ marginBottom: "6px" }}>🔔 {t("notif_section_title", lang)}</p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

                <Field label={t("notif_channel", lang)}>
                  <select className="input" value={notifChannel} onChange={(e) => setNotifChannel(e.target.value as "none" | "email" | "push" | "both")}>
                    <option value="none">{t("notif_channel_none", lang)}</option>
                    <option value="email">{t("notif_channel_email", lang)}</option>
                    <option value="push">{t("notif_channel_push", lang)}</option>
                    <option value="both">{t("notif_channel_both", lang)}</option>
                  </select>
                </Field>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                    <input type="checkbox" checked={notifMorning} onChange={(e) => setNotifMorning(e.target.checked)} />
                    <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)" }}>{t("notif_morning_alert", lang)}</span>
                    {notifMorning && (
                      <input className="input" type="time" value={notifMorningTime} onChange={(e) => setNotifMorningTime(e.target.value)} style={{ maxWidth: "100px", marginLeft: "8px" }} />
                    )}
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                    <input type="checkbox" checked={notifDasha} onChange={(e) => setNotifDasha(e.target.checked)} />
                    <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)" }}>{t("notif_dasha_alert", lang)}</span>
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                    <input type="checkbox" checked={notifPirantha} onChange={(e) => setNotifPirantha(e.target.checked)} />
                    <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)" }}>{t("notif_pirantha_alert", lang)}</span>
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                    <input type="checkbox" checked={notifSmartSilence} onChange={(e) => setNotifSmartSilence(e.target.checked)} />
                    <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)" }}>{t("notif_smart_silence", lang)}</span>
                  </label>
                </div>

                {notificationPrefs && (
                  <p style={{ margin: 0, fontSize: "0.72rem", color: notificationPrefs.fcmTokenRegistered ? "rgba(74,222,128,0.8)" : "rgba(255,255,255,0.35)" }}>
                    {notificationPrefs.fcmTokenRegistered ? t("notif_fcm_registered", lang) : t("notif_fcm_not_registered", lang)}
                  </p>
                )}

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <Button
                    variant="ghost"
                    disabled={notifSaving}
                    onClick={() => {
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
                    }}
                  >
                    {notifSaving ? t("notif_saving", lang) : t("btn_save_notifications", lang)}
                  </Button>
                  {notifSaved && <span style={{ fontSize: "0.75rem", color: "#4ade80" }}>{t("notif_saved", lang)}</span>}
                </div>
              </div>
            </div>

            {/* Privacy & disclaimer footer */}
            <div style={{
              borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)", padding: "14px 18px",
              display: "flex", flexDirection: "column", gap: "6px",
            }}>
              <p style={{ margin: 0, fontSize: "0.73rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                {t("disclaimer_astro", lang)}
              </p>
              <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>
                {t("disclaimer_no_doom", lang)}
              </p>
              <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>
                {t("disclaimer_data", lang)}
              </p>
              <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)", textDecoration: "underline", cursor: "pointer" }}>
                  {t("privacy_link", lang)}
                </span>
                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)", textDecoration: "underline", cursor: "pointer" }}>
                  {t("terms_link", lang)}
                </span>
              </div>
            </div>
              </div>
            </div>
    </div>
  );
}

