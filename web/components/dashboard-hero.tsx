"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { todayIso } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  ChartSummaryData,
  DailyGuidanceData,
  FamilyAggregateData,
  FamilyVaultListItem,
  NotificationInboxItem,
  TransitSnapshotData,
} from "@/lib/types";

type Tab = "onboarding" | "personal" | "tools" | "transits" | "plan" | "life-areas" | "family" | "calendar" | "journal" | "settings" | "qa";
type LabelKey = Parameters<typeof t>[0];

const SHOW_QA_TAB = process.env.NODE_ENV !== "production";

const TAB_DEFS: Array<{ id: Tab; labelEn: string; labelTaKey?: LabelKey }> = [
  { id: "personal", labelEn: "Personal", labelTaKey: "tab_personal" },
  { id: "calendar", labelEn: "Calendar", labelTaKey: "tab_calendar" },
  { id: "family", labelEn: "Family", labelTaKey: "tab_family" },
  { id: "life-areas", labelEn: "Life Area", labelTaKey: "tab_life_areas" },
  { id: "plan", labelEn: "Plan", labelTaKey: "tab_plan" },
  { id: "transits", labelEn: "Transits", labelTaKey: "tab_transits" },
  { id: "journal", labelEn: "Journal", labelTaKey: "tab_journal" },
  { id: "tools", labelEn: "Tools", labelTaKey: "tab_tools" },
  { id: "settings", labelEn: "Settings", labelTaKey: "tab_settings" },
  { id: "qa", labelEn: "QA" },
];

interface DashboardHeroProps {
  lang: Lang;
  activeTab: Tab;
  birthDisplayName: string;
  status: string;
  chartSummary: ChartSummaryData | null;
  todayGuidance: DailyGuidanceData | null;
  todayTransit: TransitSnapshotData | null;
  familyAggregate: FamilyAggregateData | null;
  selectedVault: FamilyVaultListItem | null;
  selectedVaultId: string;
  selectedDate: string;
  userEmail: string | null;
  showUserMenu: boolean;
  toast: { message: string; tone: "success" | "error" } | null;
  alertCount: number;
  alertItems: Array<{ type: string; title: string; body: string }>;
  inboxItems: NotificationInboxItem[];
  inboxUnreadCount: number;
  onMarkAllRead: () => void;
  onTabChange: (tab: Tab) => void;
  onDateChange: (date: string) => void;
  onLangToggle: () => void;
  onUserMenuToggle: () => void;
  onUserMenuClose: () => void;
  onGoToSettings: () => void;
  onSignOut: () => void;
  onToastDismiss: () => void;
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="cd-icon"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

function BellIcon() {
  return (
    <Icon>
      <path d="M15 17H9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 16V11C18 7.686 15.314 5 12 5C8.686 5 6 7.686 6 11V16L4.5 17.5H19.5L18 16Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.25 19C10.7 19.6 11.3 20 12 20C12.7 20 13.3 19.6 13.75 19" stroke="currentColor" strokeLinecap="round" />
    </Icon>
  );
}

function SettingsIcon() {
  return (
    <Icon>
      <path d="M12 15.2A3.2 3.2 0 1 0 12 8.8A3.2 3.2 0 0 0 12 15.2Z" stroke="currentColor" />
      <path d="M19.4 15.1L20.2 13.7L18.9 11.9L19 10.1L17.2 9.3L16.1 7.7L14.2 8L12.7 7L11.3 7L9.8 8L7.9 7.7L6.8 9.3L5 10.1L5.1 11.9L3.8 13.7L4.6 15.1L4.5 16.9L6.3 17.7L7.4 19.3L9.3 19L10.8 20H13.2L14.7 19L16.6 19.3L17.7 17.7L19.5 16.9L19.4 15.1Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  );
}

function SignOutIcon() {
  return (
    <Icon>
      <path d="M10 5H7C5.895 5 5 5.895 5 7V17C5 18.105 5.895 19 7 19H10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 16L18 12L14 8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 12H9" stroke="currentColor" strokeLinecap="round" />
    </Icon>
  );
}

function CheckIcon() {
  return (
    <Icon>
      <path d="M5.5 12.5L10 17L18.5 8.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  );
}

function CloseIcon() {
  return (
    <Icon>
      <path d="M6 6L18 18" stroke="currentColor" strokeLinecap="round" />
      <path d="M18 6L6 18" stroke="currentColor" strokeLinecap="round" />
    </Icon>
  );
}

export function DashboardHero(props: DashboardHeroProps) {
  const {
    lang,
    activeTab,
    birthDisplayName,
    status,
    chartSummary,
    selectedVault,
    selectedDate,
    userEmail,
    showUserMenu,
    toast,
    alertCount,
    alertItems,
    inboxItems,
    inboxUnreadCount,
    onMarkAllRead,
    onTabChange,
    onDateChange,
    onLangToggle,
    onUserMenuToggle,
    onUserMenuClose,
    onGoToSettings,
    onSignOut,
    onToastDismiss,
  } = props;

  const todayDate = useRef(todayIso());
  const [showAlerts, setShowAlerts] = useState(false);
  const [showInbox, setShowInbox] = useState(false);

  const lagnaRasi = chartSummary?.lagnaRasi ?? "";
  const tabs = useMemo(
    () => (SHOW_QA_TAB ? TAB_DEFS : TAB_DEFS.filter((tab) => tab.id !== "qa")),
    [],
  );

  const langToggleTitle = lang === "ta" ? "Switch to English" : "தமிழுக்கு மாறு";

  return (
    <>
      <header className="cd-topbar">
        <div className="cd-topbar__inner">
          <div className="cd-brand">
            <Image
              src="/brand/vinaadi-symbol-icon.png"
              alt=""
              aria-hidden
              width={512}
              height={512}
              className="cd-brand__symbol"
              priority
            />
            <span className="cd-brand__name">Vinaadi</span>
            {lagnaRasi && (
              <span className="cd-brand__sub" title={birthDisplayName}>
                {birthDisplayName ? `${birthDisplayName} · ` : ""}
                {chartSummary
                  ? `${chartSummary.lagnaRasi} ${t("label_lagnam", lang)} · ${chartSummary.moonRasi} ${t("label_janma_rasi", lang)}`
                  : "Thirukanitham"}
              </span>
            )}
          </div>

          <div className="cd-topbar__right">
            <span className="cd-status-pill" title={status}>
              <span className="cd-status-dot" />
              {status}
            </span>

            {selectedVault && (
              <span className="cd-vault-name" title={selectedVault.name}>
                {selectedVault.name}
              </span>
            )}

            <div className="cd-popover-anchor">
              <button
                type="button"
                className="cd-icon-btn"
                onClick={() => { setShowAlerts(false); setShowInbox((v) => !v); }}
                aria-label={lang === "ta" ? "அறிவிப்புகள்" : "Notifications"}
              >
                <BellIcon />
                {(alertCount + inboxUnreadCount) > 0 && (
                  <span className="cd-badge">{(alertCount + inboxUnreadCount) > 9 ? "9+" : alertCount + inboxUnreadCount}</span>
                )}
              </button>
              {showInbox && (
                <>
                  <div className="cd-overlay cd-overlay--alerts" onClick={() => setShowInbox(false)} />
                  <div className="cd-alerts-popover">
                    {/* Ambient (astro) alerts */}
                    {alertItems.length > 0 && (
                      <>
                        <p className="cd-alerts-head">{t("ambient_alerts_label", lang)}</p>
                        {alertItems.map((a, i) => (
                          <div key={`alert-${a.type}-${i}`} className="cd-alert-item">
                            <p className="cd-alert-item__title">{a.title}</p>
                            <p className="cd-alert-item__body">{a.body}</p>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Sent notifications inbox */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                      <p className="cd-alerts-head" style={{ margin: 0 }}>
                        {lang === "ta" ? "அனுப்பிய அறிவிப்புகள்" : "Sent notifications"}
                      </p>
                      {inboxUnreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => { onMarkAllRead(); }}
                          style={{ fontSize: "0.7rem", color: "#B85A2C", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
                        >
                          {lang === "ta" ? "அனைத்தும் படித்தது" : "Mark all read"}
                        </button>
                      )}
                    </div>
                    {inboxItems.length === 0 && alertItems.length === 0 ? (
                      <p className="cd-empty-note">
                        {lang === "ta" ? "இன்று எந்த அறிவிப்பும் இல்லை." : "No notifications yet."}
                      </p>
                    ) : inboxItems.length === 0 ? (
                      <p className="cd-empty-note" style={{ fontSize: "0.75rem" }}>
                        {lang === "ta" ? "அனுப்பிய அறிவிப்புகள் இல்லை." : "No sent notifications yet."}
                      </p>
                    ) : (
                      inboxItems.map((n) => (
                        <div key={n.notification_id} className="cd-alert-item" style={{ opacity: n.read_at ? 0.6 : 1 }}>
                          <p className="cd-alert-item__title" style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                            <span>{n.title}</span>
                            {!n.read_at && <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#B85A2C", flexShrink: 0, marginTop: "4px" }} />}
                          </p>
                          <p className="cd-alert-item__body">{n.body}</p>
                          <p style={{ margin: 0, fontSize: "0.65rem", color: "#7A6F5E" }}>
                            {new Date(n.send_at).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              className="cd-lang-btn"
              onClick={onLangToggle}
              aria-label={langToggleTitle}
              title={langToggleTitle}
            >
              {lang === "ta" ? "EN" : "த"}
            </button>

            <div className="cd-popover-anchor">
              <button
                type="button"
                className="cd-avatar"
                onClick={onUserMenuToggle}
                aria-label={lang === "ta" ? "கணக்கு" : "Account"}
                title={userEmail ?? "Account"}
              >
                {userEmail ? userEmail[0].toUpperCase() : "U"}
              </button>
              {showUserMenu && (
                <>
                  <div className="cd-overlay cd-overlay--menu" onClick={onUserMenuClose} />
                  <div className="cd-dropdown">
                    <div className="cd-dropdown__head">
                      <p className="cd-dropdown__email-label">Signed in as</p>
                      <p className="cd-dropdown__email">{userEmail ?? "—"}</p>
                    </div>
                    <button type="button" className="cd-dropdown__btn" onClick={onGoToSettings}>
                      <SettingsIcon />
                      <span>Settings</span>
                    </button>
                    <div className="cd-dropdown__divider" />
                    <button type="button" className="cd-dropdown__btn cd-dropdown__btn--danger" onClick={onSignOut}>
                      <SignOutIcon />
                      <span>Sign out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <nav className="cd-tabnav" aria-label="Dashboard navigation">
        <div className="cd-tabnav__inner">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`cd-tab${activeTab === tab.id ? " cd-tab--active" : ""}`}
              onClick={() => onTabChange(tab.id)}
            >
              {lang === "ta" && tab.labelTaKey ? t(tab.labelTaKey, lang) : tab.labelEn}
            </button>
          ))}

          <div className="cd-tabnav__right">
            <label htmlFor="dashboard-date" className="cd-visually-hidden">
              {lang === "ta" ? "தேதி தேர்வு" : "Select date"}
            </label>
            <div className="cd-date-field">
              <input
                id="dashboard-date"
                className="cd-date-input"
                type="date"
                value={selectedDate}
                max={todayDate.current}
                onChange={(e) => onDateChange(e.target.value)}
                aria-label={lang === "ta" ? "தேதி தேர்வு" : "Select date"}
              />
            </div>
          </div>
        </div>
      </nav>

      {toast && (
        <div className={`cd-toast cd-toast--${toast.tone}`} role="status" aria-live="polite">
          {toast.tone === "success" ? <CheckIcon /> : <CloseIcon />}
          <span>{toast.message}</span>
          <button
            type="button"
            className="cd-toast__close"
            onClick={onToastDismiss}
            aria-label={lang === "ta" ? "மூடு" : "Dismiss"}
          >
            <CloseIcon />
          </button>
        </div>
      )}
    </>
  );
}
