"use client";

import { useEffect, useRef, useState } from "react";

import { useTheme, type Theme } from "@/hooks/useTheme";
import { apiFetchJson } from "@/lib/api";
import { clearFcmTokenLocal, fetchFcmToken, hasFirebaseMessagingConfig } from "@/lib/firebase-messaging";
import { formatDateLabel, formatDateTimeLabel, todayIso } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ContextData, ContextEvent, JournalRetentionApplyData, NotificationPreferenceData } from "@/lib/types";
import { CONTEXT_EVENT_TYPES, CTX_TYPE_KEY, type ContextEventType } from "./dashboard-journal-shared";
import { NovaSelect } from "./nova-select";
import { SettingsRail, SETTINGS_C as C, type SettingsSectionId } from "./dashboard-settings-rail";

type UserMode = "BEGINNER" | "BALANCED" | "TRADITIONAL";
type GoalTrack = "CAREER" | "EXAM" | "RELATIONSHIP" | "FINANCIAL";

// Mirrors the backend FeedbackPayload.category literal (app/api/feedback.py).
type FeedbackCategory = "suggestion" | "bug" | "calculation" | "review" | "other";
const FEEDBACK_CATEGORIES: { v: FeedbackCategory; en: string; ta: string }[] = [
  { v: "suggestion",  en: "Suggestion",       ta: "பரிந்துரை" },
  { v: "bug",         en: "Something's broken", ta: "பிழை" },
  { v: "calculation", en: "Calculation looks off", ta: "கணிப்பு சரியில்லை" },
  { v: "review",      en: "A review / praise", ta: "மதிப்பீடு" },
  { v: "other",       en: "Other",            ta: "மற்றவை" },
];

type DashboardSettingsSessionTabProps = {
  lang: Lang;
  section: SettingsSectionId;
  onNavigate: (id: SettingsSectionId) => void;
  onLangChange: (lang: Lang) => void;
  userDisplayName: string;
  moonRasi: string;
  janmaNakshatra: string;
  lagnaRasi: string;
  vaultName: string;
  ownerUserId: string;
  selectedDate: string;
  selectedVaultId: string;
  birthProfileId: string;
  chartId: string;
  /** Life-context events (job change / marriage / relocation) — moved here from
   *  the Journal tab (IA audit 2026-07-22, Phase 4). Same `POST /api/v1/context`
   *  data the engine reads; Journal/Reflections still consume `contextData`. */
  contextData: ContextData | null;
  onContextUpdated: (data: ContextData) => void;
  busyPersonal: boolean;
  busyFamily: boolean;
  journalRetentionDays: number;
  journalLastUpdatedAt: string | null;
  journalLastRetentionReviewedAt: string | null;
  journalNextRecommendedReviewDate: string | null;
  busyJournalSettings: boolean;
  notificationPrefs: NotificationPreferenceData | null;
  onNotificationPrefsSaved: (prefs: NotificationPreferenceData) => void;
  userMode: UserMode;
  goalTrack: GoalTrack | null;
  onSaveUserSettings: (mode: UserMode, track: GoalTrack | null) => void;
  onSelectedDateChange: (value: string) => void;
  onRefreshPersonal: () => void;
  onRefreshFamily: () => void;
  onSaveJournalRetentionDays: (days: number) => void;
  onAcknowledgeJournalReminder: () => void;
  onApplyRetention: (dryRun: boolean) => Promise<JournalRetentionApplyData | null>;
  busyRetentionApply: boolean;
  onSignOut: () => void;
};

/* ═══════════════ Shared primitives (all colors theme-reactive) ═══════════════ */

function PanelHeader({ title, desc, danger }: { title: string; desc: string; danger?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* audit B-1: the active settings panel's title is this view's <h1>
          (the left rail shows one panel at a time). */}
      <h1 style={{ margin: 0, fontFamily: "var(--font-display, Georgia, serif)", fontSize: "clamp(1.8rem, 3.4vw, 2.15rem)", fontWeight: 600, lineHeight: 1.05, color: danger ? C.danger : C.text }}>
        {title}
      </h1>
      <div style={{ fontFamily: "var(--font-body, Georgia, serif)", fontSize: "15px", color: C.muted, maxWidth: "520px", lineHeight: 1.55 }}>
        {desc}
      </div>
    </div>
  );
}

function Card({ children, tone }: { children: React.ReactNode; tone?: "plain" | "danger" }) {
  const base: React.CSSProperties = {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: "16px",
    padding: "24px 26px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  };
  if (tone === "danger") {
    return <div style={{ ...base, background: C.dangerBg, border: `1px solid ${C.dangerBorder}` }}>{children}</div>;
  }
  return <div style={base}>{children}</div>;
}

function RowHeader({ title, desc }: { title: string; desc?: string }) {
  return (
    <div style={{ maxWidth: "360px" }}>
      <div style={{ fontSize: "15px", fontWeight: 600, color: C.text }}>{title}</div>
      {desc && <div style={{ fontSize: "12.5px", color: C.faint, marginTop: "3px", lineHeight: 1.5 }}>{desc}</div>}
    </div>
  );
}

function Segmented<T extends string>({ value, options, onChange }: {
  value: T;
  options: { v: T; label: React.ReactNode }[];
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: "inline-flex", background: C.surfaceSoft, border: `1px solid ${C.border}`, borderRadius: "11px", padding: "4px", gap: "4px", flexWrap: "wrap" }}>
      {options.map((o) => {
        const on = o.v === value;
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(o.v)}
            style={{
              padding: "9px 17px", borderRadius: "8px", fontSize: "12.5px", fontWeight: on ? 700 : 500,
              color: on ? C.onAccent : C.muted, background: on ? C.accent : "transparent",
              cursor: "pointer", border: "none", fontFamily: "inherit", transition: "background .15s, color .15s", whiteSpace: "nowrap",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "9px 16px", borderRadius: "999px", fontSize: "12.5px", fontWeight: active ? 600 : 500,
        background: active ? C.accentMuted : C.raised,
        border: `1px solid ${active ? C.accent : C.border}`,
        color: active ? C.text : C.muted,
        cursor: "pointer", fontFamily: "inherit", transition: "background .15s, border-color .15s",
      }}
    >
      {children}
    </button>
  );
}

function Toggle({ checked, onChange, tone }: { checked: boolean; onChange: (v: boolean) => void; tone?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: "44px", height: "25px", borderRadius: "999px",
        background: checked ? (tone ?? C.sage) : C.offTrack,
        position: "relative", cursor: "pointer", border: "none", flex: "none", transition: "background .2s", padding: 0,
      }}
    >
      <span style={{ position: "absolute", top: "2.5px", left: checked ? "21px" : "2.5px", width: "20px", height: "20px", borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.35)" }} />
    </button>
  );
}

function PrimaryBtn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        alignSelf: "flex-start", background: C.accent, color: C.onAccent, fontWeight: 700, borderRadius: "10px",
        padding: "11px 22px", fontSize: "13px", cursor: disabled ? "not-allowed" : "pointer", border: "none",
        opacity: disabled ? 0.5 : 1, fontFamily: "inherit", whiteSpace: "nowrap", transition: "opacity .15s",
      }}
    >
      {children}
    </button>
  );
}

function GhostBtn({ onClick, disabled, children, danger }: { onClick: () => void; disabled?: boolean; children: React.ReactNode; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        alignSelf: "flex-start", background: "transparent",
        border: `1px solid ${danger ? C.dangerBorder : C.border}`,
        color: danger ? C.danger : C.accentText, borderRadius: "9px", padding: "9px 16px", fontSize: "12.5px",
        fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
        fontFamily: "inherit", whiteSpace: "nowrap", transition: "opacity .15s",
      }}
    >
      {children}
    </button>
  );
}

const KICKER: React.CSSProperties = {
  fontSize: "var(--text-xs)", letterSpacing: ".12em", textTransform: "uppercase", color: C.faint, fontWeight: 700,
};

const fieldStyle: React.CSSProperties = {
  width: "100%", background: C.surfaceSoft, border: `1px solid ${C.border}`, borderRadius: "10px",
  padding: "11px 13px", fontSize: "14px", color: C.text, fontFamily: "inherit", outline: "none",
};

/* ═══════════════ Component ═══════════════ */

export function DashboardSettingsSessionTab({
  lang,
  section,
  onNavigate,
  onLangChange,
  userDisplayName,
  moonRasi,
  janmaNakshatra,
  lagnaRasi,
  vaultName,
  ownerUserId,
  selectedDate,
  selectedVaultId,
  birthProfileId,
  chartId,
  contextData,
  onContextUpdated,
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
  onSelectedDateChange,
  onRefreshPersonal,
  onRefreshFamily,
  onSaveJournalRetentionDays,
  onAcknowledgeJournalReminder,
  onApplyRetention,
  busyRetentionApply,
  onSignOut,
}: DashboardSettingsSessionTabProps) {
  const { theme: currentTheme, setTheme } = useTheme();

  const [modeDraft, setModeDraft] = useState<UserMode>(userMode);
  const [trackDraft, setTrackDraft] = useState<GoalTrack | "">(goalTrack ?? "");
  const [userSettingsSaving, setUserSettingsSaving] = useState(false);

  const [retentionDraft, setRetentionDraft] = useState(journalRetentionDays);

  const [notifChannel, setNotifChannel] = useState<"none" | "email" | "push" | "both">("none");
  const [notifMorning, setNotifMorning] = useState(false);
  const [notifMorningTime, setNotifMorningTime] = useState("06:00");
  const [notifDasha, setNotifDasha] = useState(false);
  const [notifPirantha, setNotifPirantha] = useState(false);
  const [notifSmartSilence, setNotifSmartSilence] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState("");

  const [showIds, setShowIds] = useState(false);
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deleteDeleting, setDeleteDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [retentionPreview, setRetentionPreview] = useState<JournalRetentionApplyData | null>(null);
  const [retentionApplied, setRetentionApplied] = useState<JournalRetentionApplyData | null>(null);

  // Life-context editor (moved from Journal, Phase 4). Same add/remove flow
  // against POST /api/v1/context.
  const [ctxEventType, setCtxEventType] = useState<ContextEventType>("job_change");
  const [ctxEventDate, setCtxEventDate] = useState(selectedDate);
  const [ctxEventNote, setCtxEventNote] = useState("");
  const [ctxBusy, setCtxBusy] = useState(false);
  const [ctxSuccess, setCtxSuccess] = useState(false);
  useEffect(() => { setCtxEventDate(selectedDate); }, [selectedDate]);

  async function handleAddContextEvent() {
    if (!chartId) return;
    setCtxBusy(true);
    setCtxSuccess(false);
    try {
      const existingEvents: ContextEvent[] = contextData?.activeEvents ?? [];
      const newEvent: ContextEvent = { type: ctxEventType, date: ctxEventDate, note: ctxEventNote.trim() || null };
      const merged = [...existingEvents, newEvent];
      const r = await apiFetchJson<{ success: boolean; data: ContextData }>("/api/v1/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chartId, activeEvents: merged }),
      });
      onContextUpdated(r.data);
      setCtxEventNote("");
      setCtxSuccess(true);
      setTimeout(() => setCtxSuccess(false), 3000);
    } catch {
      // ignore
    } finally {
      setCtxBusy(false);
    }
  }

  async function handleRemoveContextEvent(index: number) {
    if (!chartId) return;
    const updated = (contextData?.activeEvents ?? []).filter((_, i) => i !== index);
    try {
      const r = await apiFetchJson<{ success: boolean; data: ContextData }>("/api/v1/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chartId, activeEvents: updated }),
      });
      onContextUpdated(r.data);
    } catch {
      // ignore
    }
  }

  // In-app feedback modal — replaces the old mailto: link, which silently did
  // nothing on any device without a configured mail client. Posts to the
  // existing /feedback endpoint (persisted to the feedback table).
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState<FeedbackCategory>("suggestion");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackContact, setFeedbackContact] = useState(false);
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flash = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2100);
  };
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const openFeedback = () => {
    setFeedbackError("");
    setFeedbackDone(false);
    setFeedbackOpen(true);
  };

  const submitFeedback = async () => {
    const message = feedbackMessage.trim();
    if (!message) return;
    setFeedbackSending(true);
    setFeedbackError("");
    try {
      await apiFetchJson<{ received: boolean }>("/api/v1/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: feedbackCategory,
          message,
          page_context: "settings",
          is_review: feedbackCategory === "review",
          allow_contact: feedbackContact,
        }),
      });
      setFeedbackDone(true);
      setFeedbackMessage("");
    } catch {
      setFeedbackError(lang === "ta"
        ? "அனுப்ப முடியவில்லை. மீண்டும் முயற்சிக்கவும்."
        : "Couldn't send that — please try again.");
    } finally {
      setFeedbackSending(false);
    }
  };

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
    if (pushUnavailable) { setPushMessage(lang === "ta" ? "Push notifications unavailable." : "Push notifications unavailable."); return; }
    if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
    setPushBusy(true);
    setPushMessage("");
    try {
      await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setPushMessage(lang === "ta" ? "அனுமதி தேவை." : "Notification permission is required."); return; }
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
    try {
      await onSaveUserSettings(modeDraft, trackDraft || null);
      flash(lang === "ta" ? "விருப்பங்கள் சேமிக்கப்பட்டன" : "Preferences saved");
    } finally {
      setUserSettingsSaving(false);
    }
  };

  const handleSaveNotifications = () => {
    setNotifSaving(true);
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
      .then((r) => { onNotificationPrefsSaved(r.data); flash(lang === "ta" ? "அறிவிப்பு அமைப்புகள் சேமிக்கப்பட்டன" : "Notification settings saved"); })
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

  const handleRetentionPreview = async () => {
    setRetentionApplied(null);
    const result = await onApplyRetention(true);
    if (result) setRetentionPreview(result);
  };
  const handleRetentionApply = async () => {
    const result = await onApplyRetention(false);
    if (result) { setRetentionPreview(null); setRetentionApplied(result); }
  };

  const copyId = async (value: string) => {
    try { await navigator.clipboard.writeText(value); flash(lang === "ta" ? "நகலெடுக்கப்பட்டது" : "Copied to clipboard"); } catch { /* clipboard unavailable */ }
  };

  const retentionValid = Number.isFinite(retentionDraft) && retentionDraft >= 7 && retentionDraft <= 3650;
  const retentionNotice =
    retentionDraft <= 30 ? t("settings_retention_notice_short", lang)
    : retentionDraft <= 90 ? t("settings_retention_notice_medium", lang)
    : t("settings_retention_notice_long", lang);

  const fmt = (v: string | null) => {
    if (!v) return t("settings_retention_not_available", lang);
    const formatted = formatDateTimeLabel(v);
    return formatted === v ? t("settings_retention_not_available", lang) : formatted;
  };
  const fmtDate = (v: string | null) => {
    if (!v) return t("settings_retention_not_available", lang);
    const d = new Date(`${v}T00:00:00Z`);
    return Number.isNaN(d.getTime()) ? t("settings_retention_not_available", lang) : d.toLocaleDateString();
  };

  const chartLine = [moonRasi, janmaNakshatra, lagnaRasi ? `${lagnaRasi} ${lang === "ta" ? "லக்னம்" : "Lagnam"}` : ""]
    .filter(Boolean)
    .join(" · ");

  const idFields = [
    { label: lang === "ta" ? "உரிமையாளர் பயனர் ID" : "Owner user ID", value: ownerUserId },
    { label: lang === "ta" ? "பிறப்பு விவர ID" : "Birth profile ID", value: birthProfileId },
    { label: lang === "ta" ? "ஜாதக ID" : "Chart ID", value: chartId },
    { label: lang === "ta" ? "கொட்டில் ID" : "Vault ID", value: selectedVaultId },
  ].filter((f) => f.value);

  const panelWrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "20px", animation: "vfade .3s ease" };

  /* ── Panels ── */
  const renderAccount = () => (
    <div style={panelWrap}>
      <PanelHeader
        title={lang === "ta" ? "கணக்கு" : "Account"}
        desc={lang === "ta"
          ? "உங்கள் அடையாளம், இந்த அமர்வு படிக்கும் கொட்டில், மற்றும் ஒவ்வொரு கணிப்பும் நங்கூரமிடும் தேதி."
          : "Your identity, the vault this session is reading from, and the date every forecast is anchored to."}
      />

      {/* identity hero */}
      <div style={{ background: `linear-gradient(150deg, ${C.accentMuted}, ${C.card} 62%)`, border: `1px solid ${C.borderStrong}`, borderRadius: "18px", padding: "26px 28px", display: "flex", alignItems: "center", gap: "22px", flexWrap: "wrap" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: C.accent, color: C.onAccent, display: "grid", placeItems: "center", fontSize: "26px", fontFamily: "var(--font-display, serif)", fontWeight: 700, flex: "none" }}>
          {(userDisplayName || "S").trim().charAt(0).toUpperCase() || "S"}
        </div>
        <div style={{ flex: 1, minWidth: "220px" }}>
          <div style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "26px", fontWeight: 600, color: C.text, lineHeight: 1.1 }}>
            {userDisplayName?.trim() || (lang === "ta" ? "உங்கள் கணக்கு" : "Your account")}
          </div>
          {chartLine && (
            <div style={{ fontSize: "12px", letterSpacing: ".08em", textTransform: "uppercase", color: C.accentText, marginTop: "6px", fontWeight: 600 }}>{chartLine}</div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "12px", color: C.sage, background: C.sageBg, border: `1px solid ${C.sageBorder}`, borderRadius: "999px", padding: "6px 13px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: busyFamily ? C.accent : C.sage }} />
            {busyFamily ? (lang === "ta" ? "குடும்பத் தரவு புதுப்பிக்கப்படுகிறது…" : "Refreshing family data…") : (lang === "ta" ? "குடும்பத் தரவு தயார்" : "Family data loaded")}
          </div>
          {vaultName?.trim() && (
            <div style={{ fontSize: "11.5px", color: C.faint }}>
              {lang === "ta" ? "படிக்கிறது " : "Reading "}
              <span style={{ color: C.purple, fontWeight: 600 }}>{vaultName}</span>
              {lang === "ta" ? " கொட்டில்" : " vault"}
            </div>
          )}
        </div>
      </div>

      {/* session facts */}
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          <div>
            <div style={{ ...KICKER, marginBottom: "8px" }}>{lang === "ta" ? "தேர்ந்தெடுத்த தேதி" : "Selected date"}</div>
            <input type="date" value={selectedDate} onChange={(e) => onSelectedDateChange(e.target.value)} style={fieldStyle} />
            <div style={{ fontSize: "11.5px", color: C.faint, marginTop: "7px" }}>{lang === "ta" ? "அனைத்து கணிப்புகளையும் இயக்குகிறது." : "Drives all forecasts and transits."}</div>
          </div>
          <div>
            <div style={{ ...KICKER, marginBottom: "8px" }}>{lang === "ta" ? "செயலில் உள்ள கொட்டில்" : "Active vault"}</div>
            <div style={{ ...fieldStyle, padding: "12px 14px" }}>
              {vaultName?.trim() || (lang === "ta" ? "தேர்ந்தெடுக்கப்படவில்லை" : "None selected")}
            </div>
            <div style={{ fontSize: "11.5px", color: C.faint, marginTop: "7px" }}>{lang === "ta" ? "குடும்பத் தாவலில் கொட்டில்களை மாற்றவும்." : "Switch vaults from the Family tab."}</div>
          </div>
        </div>

        <div style={{ height: "1px", background: C.border }} />

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span style={{ ...KICKER, letterSpacing: ".14em", marginRight: "2px" }}>{lang === "ta" ? "விரைவு செயல்கள்" : "Quick actions"}</span>
          <GhostBtn onClick={onRefreshPersonal} disabled={!birthProfileId || busyPersonal}>
            {busyPersonal ? t("btn_refreshing", lang) : `↻ ${t("btn_refresh_personal", lang)}`}
          </GhostBtn>
          <GhostBtn onClick={onRefreshFamily} disabled={!selectedVaultId || busyFamily}>
            {busyFamily ? t("btn_refreshing", lang) : `↻ ${t("btn_refresh_family", lang)}`}
          </GhostBtn>
          <GhostBtn onClick={() => onNavigate("setup")}>{lang === "ta" ? "அமைப்பு" : "Setup"}</GhostBtn>
          <div style={{ marginLeft: "auto" }}>
            <GhostBtn onClick={onSignOut} danger>{lang === "ta" ? "வெளியேறு" : "Sign out"}</GhostBtn>
          </div>
        </div>
      </Card>

      {/* support IDs disclosure */}
      {idFields.length > 0 && (
        <div style={{ background: C.raised, border: `1px solid ${C.border}`, borderRadius: "14px", overflow: "hidden" }}>
          <button
            type="button"
            onClick={() => setShowIds((s) => !s)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", cursor: "pointer", width: "100%", background: "transparent", border: "none", fontFamily: "inherit", textAlign: "left" }}
          >
            <span>
              <span style={{ display: "block", fontSize: "13.5px", fontWeight: 600, color: C.text }}>{lang === "ta" ? "ஆதரவு & டெவலப்பர் அடையாளங்கள்" : "Support & developer identifiers"}</span>
              <span style={{ display: "block", fontSize: "11.5px", color: C.faint, marginTop: "2px" }}>{lang === "ta" ? "ஆதரவு கேட்கக்கூடிய படிக்க-மட்டும் ID-கள். திருத்த ஏதுமில்லை." : "Read-only IDs you may be asked for by support. Nothing to edit."}</span>
            </span>
            <span style={{ color: C.accentText, fontSize: "13px" }}>{showIds ? "▾" : "▸"}</span>
          </button>
          {showIds && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1px", background: C.border, borderTop: `1px solid ${C.border}` }}>
              {idFields.map((f) => (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => copyId(f.value)}
                  title={f.value}
                  style={{ background: C.surfaceSoft, padding: "14px 22px", cursor: "pointer", display: "flex", flexDirection: "column", gap: "5px", border: "none", fontFamily: "inherit", textAlign: "left" }}
                >
                  <span style={{ fontSize: "var(--text-xs)", letterSpacing: ".12em", textTransform: "uppercase", color: C.faint, fontWeight: 700 }}>{f.label}</span>
                  <span style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: "12px", color: C.textMid, display: "flex", alignItems: "center", gap: "8px" }}>
                    {f.value.length > 24 ? `${f.value.slice(0, 24)}…` : f.value}
                    <span style={{ color: C.accentText, fontSize: "11px" }}>⧉</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const detailDesc = modeDraft === "BEGINNER"
    ? (lang === "ta" ? "எளிய மொழி முதலில் — ஜோதிட சொற்கள் தேவைப்படும்வரை மறைந்திருக்கும்." : "Plain language first — classical terms tucked away until you want them.")
    : modeDraft === "BALANCED"
    ? (lang === "ta" ? "எளிய மொழி வழிகாட்டல், ஜோதிட சொற்களுடன் இணைந்து." : "Plain-language guidance paired with the classical terms.")
    : (lang === "ta" ? "முழு ஜோதிட சொற்களஞ்சியம், குறைந்த எளிமைப்படுத்தல்." : "Full Jothidam vocabulary, minimal simplification.");

  const renderExperience = () => (
    <div style={panelWrap}>
      <PanelHeader
        title={lang === "ta" ? "அனுபவம்" : "Experience"}
        desc={lang === "ta" ? "விநாடி எவ்வளவு ஜோதிட ஆழம் காட்டுகிறது, எந்த வாழ்க்கைப் பகுதிகளுக்கு சாய்கிறது என்பதை சரிசெய்யுங்கள்." : "Tune how much classical depth Vinaadi shows, and which life areas it leans into for you."}
      />

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "16px", flexWrap: "wrap" }}>
          <RowHeader title={t("mode_label", lang)} desc={detailDesc} />
          <Segmented<UserMode>
            value={modeDraft}
            onChange={setModeDraft}
            options={[
              { v: "BEGINNER", label: t("mode_beginner", lang) },
              { v: "BALANCED", label: t("mode_balanced", lang) },
              { v: "TRADITIONAL", label: t("mode_traditional", lang) },
            ]}
          />
        </div>
      </Card>

      <Card>
        <RowHeader title={t("track_label", lang)} desc={lang === "ta" ? "இப்போது முக்கியமான ஒன்றைத் தேர்வுசெய்யுங்கள் — வழிகாட்டலும் நேரமும் அதை நோக்கி சாயும்." : "Pick what matters right now — guidance and timing lean toward it."} />
        <div style={{ display: "flex", gap: "9px", flexWrap: "wrap" }}>
          <Chip active={trackDraft === ""} onClick={() => setTrackDraft("")}>{t("track_none", lang)}</Chip>
          {(["CAREER", "EXAM", "RELATIONSHIP", "FINANCIAL"] as GoalTrack[]).map((tr) => (
            <Chip key={tr} active={trackDraft === tr} onClick={() => setTrackDraft(tr)}>
              {t(tr === "CAREER" ? "track_career" : tr === "EXAM" ? "track_exam" : tr === "RELATIONSHIP" ? "track_relationship" : "track_financial", lang)}
            </Chip>
          ))}
        </div>
      </Card>

      <PrimaryBtn onClick={() => void handleSaveUserSettings()} disabled={userSettingsSaving}>
        {userSettingsSaving ? t("notif_saving", lang) : (lang === "ta" ? "விருப்பங்களை சேமி" : "Save preferences")}
      </PrimaryBtn>
    </div>
  );

  const renderAppearance = () => (
    <div style={panelWrap}>
      <PanelHeader
        title={lang === "ta" ? "தோற்றம்" : "Appearance"}
        desc={lang === "ta" ? "தீம் மற்றும் மொழி. நீங்கள் உள்நுழையும் ஒவ்வொரு சாதனத்திலும் இவை ஒத்திசைக்கப்படும்." : "Theme and language. These sync across every device you sign in on."}
      />

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <RowHeader title={lang === "ta" ? "தீம்" : "Theme"} desc={lang === "ta" ? "இருண்ட, வெளிர், அல்லது சாதன அமைப்பைப் பின்பற்றவும்." : "Dark, light, or follow your device setting."} />
          <Segmented<Theme>
            value={currentTheme}
            onChange={setTheme}
            options={[
              { v: "system", label: lang === "ta" ? "சாதனம்" : "System" },
              { v: "light", label: lang === "ta" ? "வெளிர்" : "Light" },
              { v: "dark", label: lang === "ta" ? "இருண்ட" : "Dark" },
            ]}
          />
        </div>
        <div style={{ fontSize: "11.5px", color: C.accentText, background: C.accentMuted, border: `1px solid ${C.border}`, borderRadius: "9px", padding: "9px 13px", lineHeight: 1.5 }}>
          {lang === "ta" ? "Nova தோற்றம் செயலில் இருக்கும்போது, இந்த அமைப்பைப் பொருட்படுத்தாமல் ஆப் இருண்டதாகவே இருக்கும்." : "While the Nova look is active, the app stays dark regardless of this setting."}
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <RowHeader title={lang === "ta" ? "மொழி" : "Language"} desc={lang === "ta" ? "ஆப் ஏற்றப்படும் இயல்பு மொழி." : "Default language the app loads in."} />
          <Segmented<Lang>
            value={lang}
            onChange={onLangChange}
            options={[
              { v: "en", label: "English" },
              { v: "ta", label: <span style={{ fontFamily: "var(--font-tamil, 'Noto Sans Tamil', sans-serif)" }}>தமிழ்</span> },
            ]}
          />
        </div>
      </Card>
    </div>
  );

  const notifRow = (title: string, desc: string, node: React.ReactNode, last?: boolean) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", padding: "18px 0", borderBottom: last ? undefined : `1px solid ${C.border}` }}>
      <div style={{ maxWidth: "70%" }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: C.text }}>{title}</div>
        <div style={{ fontSize: "12px", color: C.faint, marginTop: "2px" }}>{desc}</div>
      </div>
      {node}
    </div>
  );

  const renderNotifications = () => (
    <div style={panelWrap}>
      <PanelHeader
        title={lang === "ta" ? "அறிவிப்புகள்" : "Notifications"}
        desc={lang === "ta" ? "விநாடி எப்படி, எத்தனை முறை உங்களை அடைகிறது என்பதைத் தேர்வுசெய்யுங்கள். அமைதி நேரங்களில் Smart silence அறிவிப்புகளைப் பிடித்து வைக்கும்." : "Choose how, and how often, Vinaadi reaches you. Smart silence holds alerts during your quiet hours."}
      />

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <RowHeader title={t("notif_channel", lang)} desc={lang === "ta" ? "அறிவிப்புகள் எங்கு அனுப்பப்படும்." : "Where alerts are sent."} />
          <Segmented<"none" | "push" | "email" | "both">
            value={notifChannel}
            onChange={setNotifChannel}
            options={[
              { v: "none", label: t("notif_channel_none", lang) },
              { v: "push", label: t("notif_channel_push", lang) },
              { v: "email", label: t("notif_channel_email", lang) },
              { v: "both", label: t("notif_channel_both", lang) },
            ]}
          />
        </div>
      </Card>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "6px 26px", display: "flex", flexDirection: "column" }}>
        {notifRow(
          t("notif_morning_alert", lang),
          lang === "ta" ? "உங்கள் தினசரி வாசிப்பு, குறிப்பிட்ட நேரத்தில்." : "Your daily reading, delivered at a set time.",
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {notifMorning && (
              <input type="time" value={notifMorningTime} onChange={(e) => setNotifMorningTime(e.target.value)} style={{ ...fieldStyle, width: "auto", padding: "7px 11px", fontSize: "12.5px" }} />
            )}
            <Toggle checked={notifMorning} onChange={setNotifMorning} />
          </div>,
        )}
        {notifRow(t("notif_dasha_alert", lang), lang === "ta" ? "ஒரு பெரிய கிரக காலம் மாறும்போது." : "When a major planetary period shifts.", <Toggle checked={notifDasha} onChange={setNotifDasha} />)}
        {notifRow(t("notif_pirantha_alert", lang), lang === "ta" ? "குடும்ப உறுப்பினர்களுக்கான நட்சத்திரப் பிறந்தநாள் நினைவூட்டல்." : "Star-birthday reminders for family members.", <Toggle checked={notifPirantha} onChange={setNotifPirantha} />)}
        {notifRow(t("notif_smart_silence", lang), lang === "ta" ? "ராகு காலம் & இரவில் அவசரமற்ற அறிவிப்புகளை இடைநிறுத்து." : "Pause non-urgent alerts during Rahu Kalam & night.", <Toggle checked={notifSmartSilence} onChange={setNotifSmartSilence} tone={C.accent} />, true)}
      </div>

      {(notificationPrefs && !notificationPrefs.fcmTokenRegistered) || pushUnavailable ? (
        <div style={{ background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, borderRadius: "10px", padding: "11px 15px", fontSize: "12px", color: C.dangerText, lineHeight: 1.5 }}>
          {pushUnavailable
            ? (lang === "ta" ? "Push notifications unavailable." : "Push notifications unavailable.")
            : t("notif_fcm_not_registered", lang)}
        </div>
      ) : notificationPrefs?.fcmTokenRegistered ? (
        <div style={{ fontSize: "12px", color: C.sage }}>{t("notif_fcm_registered", lang)}</div>
      ) : null}

      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <PrimaryBtn onClick={handleSaveNotifications} disabled={notifSaving}>
          {notifSaving ? t("notif_saving", lang) : t("btn_save_notifications", lang)}
        </PrimaryBtn>
        {!pushUnavailable && (
          <>
            <GhostBtn onClick={() => void registerPushToken()} disabled={pushBusy}>
              {pushBusy ? (lang === "ta" ? "செயலாக்கம்…" : "Processing…") : (lang === "ta" ? "Push பதிவு" : "Register push")}
            </GhostBtn>
            <GhostBtn onClick={() => void unregisterPushToken()} disabled={pushBusy} danger>
              {lang === "ta" ? "Push நீக்கு" : "Remove push"}
            </GhostBtn>
          </>
        )}
      </div>
      {pushMessage && <div style={{ fontSize: "12px", color: C.muted }}>{pushMessage}</div>}
    </div>
  );

  const renderJournal = () => (
    <div style={panelWrap}>
      <PanelHeader
        title={lang === "ta" ? "குறிப்பேடு & தரவு" : "Journal & Data"}
        desc={lang === "ta" ? "தக்கவைப்பு சுத்தம் செய்வதற்கு முன் உங்கள் குறிப்புகள் எவ்வளவு காலம் வைக்கப்படும். உங்கள் உறுதிப்படுத்தல் இல்லாமல் எதுவும் நீக்கப்படாது." : "How long your journal entries are kept before retention cleanup. Nothing is ever removed without your confirmation."}
      />

      <Card>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
          <div style={{ fontSize: "15px", fontWeight: 600, color: C.text }}>{lang === "ta" ? "தக்கவைப்பு காலம்" : "Retention window"}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontFamily: "var(--font-display, serif)", fontSize: "34px", fontWeight: 600, color: C.accentText, lineHeight: 1 }}>{retentionDraft}</span>
            <span style={{ fontSize: "13px", color: C.faint }}>{lang === "ta" ? "நாட்கள்" : "days"}</span>
          </div>
        </div>
        <input
          type="range"
          min={7}
          max={3650}
          step={1}
          value={retentionValid ? retentionDraft : 7}
          onChange={(e) => setRetentionDraft(Number.parseInt(e.target.value, 10))}
          style={{ width: "100%", accentColor: "var(--color-accent, #d4af5f)" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: C.faint }}>
          <span>{lang === "ta" ? "7 நாட்கள்" : "7 days"}</span>
          <span>{lang === "ta" ? "நீண்ட வரலாறு →" : "Longer history kept before cleanup →"}</span>
          <span>{lang === "ta" ? "3650 நாட்கள்" : "3650 days"}</span>
        </div>

        <div style={{ height: "1px", background: C.border }} />

        <div style={{ display: "flex", gap: "26px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <span style={{ ...KICKER, letterSpacing: ".1em" }}>{t("settings_retention_last_updated", lang)}</span>
            <span style={{ fontSize: "13px", color: C.textMid }}>{fmt(journalLastUpdatedAt)}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <span style={{ ...KICKER, letterSpacing: ".1em" }}>{t("settings_retention_next_review", lang)}</span>
            <span style={{ fontSize: "13px", color: C.textMid }}>{fmtDate(journalNextRecommendedReviewDate)}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <span style={{ ...KICKER, letterSpacing: ".1em" }}>{t("settings_retention_last_reviewed", lang)}</span>
            <span style={{ fontSize: "13px", color: C.faint }}>{fmt(journalLastRetentionReviewedAt)}</span>
          </div>
        </div>

        <div style={{ fontSize: "13px", color: retentionDraft <= 30 ? C.accentText : C.muted, lineHeight: 1.5 }}>{retentionNotice}</div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <PrimaryBtn onClick={() => onSaveJournalRetentionDays(retentionDraft)} disabled={!retentionValid || busyJournalSettings}>
            {busyJournalSettings ? t("settings_retention_saving", lang) : t("settings_retention_save", lang)}
          </PrimaryBtn>
          <GhostBtn onClick={onAcknowledgeJournalReminder} disabled={busyJournalSettings}>{t("settings_retention_acknowledge", lang)}</GhostBtn>
          {chartId && !retentionPreview && (
            <GhostBtn onClick={() => void handleRetentionPreview()} disabled={busyRetentionApply}>
              {busyRetentionApply ? (lang === "ta" ? "சரிபார்க்கிறது…" : "Checking…") : (lang === "ta" ? "சுத்தம் முன்னோட்டம்" : "Preview cleanup")}
            </GhostBtn>
          )}
        </div>

        {retentionPreview && retentionPreview.matchedCount === 0 && (
          <div style={{ fontSize: "13px", color: C.sage }}>{lang === "ta" ? "காப்பகப்படுத்த பழைய குறிப்புகள் எதுவும் இல்லை." : "No entries are older than your retention window — nothing to clean up."}</div>
        )}
        {retentionPreview && retentionPreview.matchedCount > 0 && (
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", color: C.textMid }}>
              {lang === "ta"
                ? `${retentionPreview.matchedCount} குறிப்புகள் (${fmtDate(retentionPreview.thresholdDate)} க்கு முந்தையவை) காப்பகப்படுத்தப்படும்.`
                : `${retentionPreview.matchedCount} entr${retentionPreview.matchedCount === 1 ? "y" : "ies"} older than ${fmtDate(retentionPreview.thresholdDate)} will be archived.`}
            </span>
            <PrimaryBtn onClick={() => void handleRetentionApply()} disabled={busyRetentionApply}>
              {busyRetentionApply ? (lang === "ta" ? "காப்பகப்படுத்துகிறது…" : "Archiving…") : (lang === "ta" ? "உறுதி & காப்பகம்" : "Confirm & archive")}
            </PrimaryBtn>
            <GhostBtn onClick={() => setRetentionPreview(null)} disabled={busyRetentionApply}>{lang === "ta" ? "ரத்து" : "Cancel"}</GhostBtn>
          </div>
        )}
        {retentionApplied && (
          <div style={{ fontSize: "13px", color: C.sage }}>
            {lang === "ta"
              ? `${retentionApplied.archivedCount} குறிப்புகள் காப்பகப்படுத்தப்பட்டன.`
              : `Archived ${retentionApplied.archivedCount} entr${retentionApplied.archivedCount === 1 ? "y" : "ies"}.`}
          </div>
        )}
      </Card>
    </div>
  );

  const activeContextEvents = contextData?.activeEvents ?? [];
  const renderContext = () => (
    <div style={panelWrap}>
      <PanelHeader
        title={lang === "ta" ? "வாழ்க்கை சூழல்" : "Life context"}
        desc={lang === "ta"
          ? "வேலை மாற்றம், திருமணம், இடமாற்றம் போன்ற உண்மை நிகழ்வுகள் — இவை உங்கள் தினசரி வழிகாட்டலை மேலும் துல்லியமாக்கும். (இது நாட்குறிப்பு அல்ல; அது தனியாக உள்ளது.)"
          : "Real-life events — a job change, marriage, relocation — that sharpen your daily guidance. (This isn't your diary; that lives on its own.)"}
      />

      <Card>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <RowHeader
            title={t("context_section_label", lang)}
            desc={t("context_section_desc", lang)}
          />
          {ctxSuccess && <span style={{ fontSize: "12.5px", color: C.sage }}>{t("context_event_saved", lang)}</span>}
        </div>

        {activeContextEvents.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {activeContextEvents.map((ev, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 13px", borderRadius: "10px", background: C.surfaceSoft, border: `1px solid ${C.border}`, flexWrap: "wrap" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: C.accentText, background: C.accentMuted, border: `1px solid ${C.border}`, borderRadius: "999px", padding: "3px 11px" }}>
                  {CTX_TYPE_KEY[ev.type as ContextEventType] ? t(CTX_TYPE_KEY[ev.type as ContextEventType], lang) : ev.type}
                </span>
                <span style={{ fontSize: "12.5px", color: C.muted }}>{formatDateLabel(ev.date)}</span>
                {ev.note && <span style={{ fontSize: "12.5px", color: C.muted, fontStyle: "italic", flex: 1 }}>{ev.note}</span>}
                <button
                  type="button"
                  onClick={() => void handleRemoveContextEvent(i)}
                  style={{ marginLeft: "auto", padding: "4px 12px", borderRadius: "8px", border: `1px solid ${C.dangerBorder}`, background: "transparent", color: C.danger, fontSize: "11.5px", cursor: "pointer", fontFamily: "inherit" }}
                >
                  {t("btn_remove_event", lang)}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: "12.5px", color: C.faint }}>{t("context_no_events", lang)}</div>
        )}

        <div style={{ height: "1px", background: C.border }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={KICKER}>{lang === "ta" ? "புதிய நிகழ்வைச் சேர்" : "Add an event"}</div>
          <NovaSelect
            value={ctxEventType}
            onChange={(v) => setCtxEventType(v as ContextEventType)}
            options={CONTEXT_EVENT_TYPES.map((type) => ({ value: type, label: t(CTX_TYPE_KEY[type], lang) }))}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <input style={fieldStyle} type="date" value={ctxEventDate} min={todayIso()} onChange={(e) => setCtxEventDate(e.target.value)} />
            <input
              style={fieldStyle}
              type="text"
              value={ctxEventNote}
              onChange={(e) => setCtxEventNote(e.target.value)}
              maxLength={200}
              placeholder={lang === "ta" ? "விரும்பினால் குறிப்பு…" : "Optional note..."}
            />
          </div>
          <PrimaryBtn onClick={() => void handleAddContextEvent()} disabled={ctxBusy || !chartId}>
            {ctxBusy ? t("btn_adding_event", lang) : t("btn_add_event", lang)}
          </PrimaryBtn>
        </div>
      </Card>
    </div>
  );

  const renderPrivacy = () => (
    <div style={panelWrap}>
      <PanelHeader
        title={lang === "ta" ? "தனியுரிமை & சட்டம்" : "Privacy & Legal"}
        desc={lang === "ta" ? "விநாடி உங்கள் தரவை எவ்வாறு கையாளுகிறது, மற்றும் அது வழங்கும் வழிகாட்டலின் எல்லைகள்." : "How Vinaadi handles your data, and the boundaries of the guidance it offers."}
      />

      <Card>
        <div style={{ fontSize: "15px", fontWeight: 600, color: C.text }}>{lang === "ta" ? "உதவி & கருத்து" : "Help & feedback"}</div>
        <div style={{ fontFamily: "var(--font-body, serif)", fontSize: "14px", color: C.muted, lineHeight: 1.6 }}>
          {lang === "ta" ? "கேள்விகள் அல்லது பரிந்துரைகள்? நாங்கள் ஒரு சிறிய குழு — ஒவ்வொரு குறிப்பையும் படிக்கிறோம். உங்கள் கருத்து இறுதி வடிவத்தை வடிவமைக்கிறது." : "Questions or suggestions? We're a small team and read every note — your feedback shapes the final version."}
        </div>
        <GhostBtn onClick={openFeedback}>{lang === "ta" ? "✉ கருத்து அனுப்பு" : "✉ Send feedback"}</GhostBtn>
      </Card>

      <div style={{ background: C.raised, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "24px 26px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ ...KICKER, letterSpacing: ".14em", color: C.purple }}>{lang === "ta" ? "வழிகாட்டல் மறுப்பு" : "Guidance disclaimer"}</div>
        <div style={{ fontFamily: "var(--font-body, serif)", fontSize: "13.5px", lineHeight: 1.7, color: C.muted, display: "flex", flexDirection: "column", gap: "8px" }}>
          <p style={{ margin: 0 }}>{t("disclaimer_astro", lang)}</p>
          <p style={{ margin: 0 }}>{t("disclaimer_no_doom", lang)}</p>
          <p style={{ margin: 0 }}>{t("disclaimer_data", lang)}</p>
        </div>
        <div style={{ display: "flex", gap: "20px", fontSize: "13px", fontWeight: 600, marginTop: "2px" }}>
          <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: C.accentText, textDecoration: "none" }}>{t("privacy_link", lang)} ↗</a>
          <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: C.accentText, textDecoration: "none" }}>{t("terms_link", lang)} ↗</a>
        </div>
      </div>
    </div>
  );

  const renderDanger = () => (
    <div style={panelWrap}>
      <PanelHeader
        title={t("danger_zone_title", lang)}
        desc={lang === "ta" ? "மீட்க முடியாத செயல்கள். தொடர்வதற்கு முன் ஒரு மூச்சு விடுங்கள்." : "Irreversible actions. Take a breath before you continue."}
        danger
      />
      <Card tone="danger">
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ fontSize: "15px", fontWeight: 600, color: C.text }}>{t("delete_account_btn", lang)}</div>
          <div style={{ fontFamily: "var(--font-body, serif)", fontSize: "14px", color: C.muted, lineHeight: 1.6, maxWidth: "560px" }}>{t("delete_account_warning", lang)}</div>
        </div>
        {deleteError && <div style={{ fontSize: "13px", color: C.danger }}>{deleteError}</div>}
        {!deleteConfirming ? (
          <GhostBtn onClick={() => { setDeleteConfirming(true); setDeleteError(""); }} danger>{t("delete_account_btn", lang)}</GhostBtn>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: C.danger }}>{t("delete_account_confirm_prompt", lang)}</div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => void handleDeleteAccount()}
                disabled={deleteDeleting}
                style={{ alignSelf: "flex-start", background: C.danger, border: `1px solid ${C.danger}`, color: "#fff", borderRadius: "10px", padding: "11px 22px", fontSize: "13px", fontWeight: 700, cursor: deleteDeleting ? "not-allowed" : "pointer", opacity: deleteDeleting ? 0.6 : 1, fontFamily: "inherit" }}
              >
                {deleteDeleting ? t("delete_account_deleting", lang) : t("delete_account_confirm_btn", lang)}
              </button>
              <GhostBtn onClick={() => { setDeleteConfirming(false); setDeleteError(""); }} disabled={deleteDeleting}>{t("delete_account_cancel", lang)}</GhostBtn>
            </div>
          </div>
        )}
      </Card>
    </div>
  );

  const panel =
    section === "account" ? renderAccount()
    : section === "context" ? renderContext()
    : section === "experience" ? renderExperience()
    : section === "appearance" ? renderAppearance()
    : section === "notifications" ? renderNotifications()
    : section === "journal" ? renderJournal()
    : section === "privacy" ? renderPrivacy()
    : section === "danger" ? renderDanger()
    : renderAccount();

  return (
    <div style={{ fontFamily: "var(--font-body, Georgia, serif)", color: C.text, maxWidth: "1180px", margin: "0 auto", width: "100%" }}>
      <div className="vs-settings-grid">
        <SettingsRail active={section} onNavigate={onNavigate} lang={lang} userDisplayName={userDisplayName} vaultName={vaultName} />
        <div style={{ minWidth: 0 }}>{panel}</div>
      </div>

      {/* In-app feedback modal */}
      {feedbackOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lang === "ta" ? "கருத்து அனுப்பு" : "Send feedback"}
          onClick={() => { if (!feedbackSending) setFeedbackOpen(false); }}
          style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,.5)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "min(480px, 100%)", background: C.card, border: `1px solid ${C.borderStrong}`, borderRadius: "18px", padding: "26px 28px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 24px 60px rgba(0,0,0,.5)", maxHeight: "90vh", overflowY: "auto" }}
          >
            {feedbackDone ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-start" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: C.sageBg, color: C.sage, display: "grid", placeItems: "center", fontSize: "20px" }}>✓</div>
                <div style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "20px", fontWeight: 600, color: C.text }}>
                  {lang === "ta" ? "நன்றி!" : "Thank you."}
                </div>
                <div style={{ fontSize: "14px", color: C.muted, lineHeight: 1.55 }}>
                  {lang === "ta" ? "உங்கள் குறிப்பு எங்களை சென்றடைந்தது — ஒவ்வொன்றையும் படிக்கிறோம்." : "Your note reached us — we read every one."}
                </div>
                <PrimaryBtn onClick={() => setFeedbackOpen(false)}>{lang === "ta" ? "மூடு" : "Done"}</PrimaryBtn>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "21px", fontWeight: 600, color: C.text }}>
                      {lang === "ta" ? "கருத்து அனுப்பு" : "Send feedback"}
                    </div>
                    <div style={{ fontSize: "13px", color: C.muted, marginTop: "3px", lineHeight: 1.5 }}>
                      {lang === "ta" ? "நாங்கள் ஒரு சிறிய குழு — ஒவ்வொரு குறிப்பையும் படிக்கிறோம்." : "We're a small team and read every note."}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFeedbackOpen(false)}
                    aria-label={lang === "ta" ? "மூடு" : "Close"}
                    style={{ flex: "none", background: "none", border: "none", color: C.faint, fontSize: "22px", lineHeight: 1, cursor: "pointer", padding: "2px 4px" }}
                  >
                    ×
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ ...KICKER }}>{lang === "ta" ? "வகை" : "About"}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {FEEDBACK_CATEGORIES.map((c) => {
                      const on = c.v === feedbackCategory;
                      return (
                        <button
                          key={c.v}
                          type="button"
                          onClick={() => setFeedbackCategory(c.v)}
                          style={{
                            padding: "8px 14px", borderRadius: "999px", fontSize: "12.5px", fontWeight: on ? 600 : 500,
                            background: on ? C.accentMuted : C.raised, border: `1px solid ${on ? C.accent : C.border}`,
                            color: on ? C.text : C.muted, cursor: "pointer", fontFamily: "inherit",
                          }}
                        >
                          {lang === "ta" ? c.ta : c.en}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <textarea
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  maxLength={2000}
                  rows={5}
                  autoFocus
                  placeholder={lang === "ta" ? "என்ன நடந்தது அல்லது என்ன மேம்படுத்தலாம்?" : "What happened, or what would make this better?"}
                  style={{
                    width: "100%", boxSizing: "border-box", resize: "vertical", minHeight: "110px",
                    background: C.surfaceSoft, border: `1px solid ${C.border}`, borderRadius: "11px",
                    padding: "12px 14px", fontSize: "14px", color: C.text, fontFamily: "inherit", lineHeight: 1.5,
                  }}
                />

                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13px", color: C.muted }}>
                  <input
                    type="checkbox"
                    checked={feedbackContact}
                    onChange={(e) => setFeedbackContact(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "var(--color-accent)", cursor: "pointer" }}
                  />
                  {lang === "ta" ? "இது குறித்து என்னைத் தொடர்பு கொள்ளலாம்" : "You can contact me about this"}
                </label>

                {feedbackError && (
                  <div style={{ fontSize: "12.5px", color: C.danger }}>{feedbackError}</div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "2px" }}>
                  <PrimaryBtn onClick={() => void submitFeedback()} disabled={feedbackSending || !feedbackMessage.trim()}>
                    {feedbackSending ? (lang === "ta" ? "அனுப்புகிறது…" : "Sending…") : (lang === "ta" ? "அனுப்பு" : "Send")}
                  </PrimaryBtn>
                  <span style={{ fontSize: "11.5px", color: C.faint, marginLeft: "auto" }}>{feedbackMessage.length}/2000</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* toast */}
      {toast && (
        <div style={{ position: "fixed", left: "50%", bottom: "30px", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: "9px", background: C.card, border: `1px solid ${C.sageBorder}`, borderRadius: "999px", padding: "11px 20px", fontSize: "13px", color: C.text, boxShadow: "0 10px 34px rgba(0,0,0,.45)", zIndex: 40 }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: C.sage }} />
          {toast}
        </div>
      )}
    </div>
  );
}
