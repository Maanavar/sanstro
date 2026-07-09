"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  ChartSummaryData,
  FamilyVaultListItem,
  NotificationInboxItem,
} from "@/lib/types";
import type { UiVariant } from "@/hooks/useUiVariant";

type Tab = "onboarding" | "personal" | "tools" | "transits" | "plan" | "life-areas" | "family" | "calendar" | "journal" | "settings" | "qa" | "explore";
type LabelKey = Parameters<typeof t>[0];

const SHOW_QA_TAB = process.env.NODE_ENV !== "production";

const DAILY_PRINCIPLES: Array<{ en: string; ta: string }> = [
  {
    en: "A dasha is a window, not a verdict. What you bring to it shapes what you take from it.",
    ta: "தசை ஒரு ஜன்னல், தீர்ப்பல்ல. நீங்கள் அதில் கொண்டுவருவதே நீங்கள் பெறுவதை வடிவமைக்கிறது.",
  },
  {
    en: "Planetary periods amplify what you focus on. Direct your attention with intention.",
    ta: "கிரகக் காலங்கள் நீங்கள் கவனிப்பதை பெருக்கும். உங்கள் கவனத்தை நோக்கத்துடன் திருப்புங்கள்.",
  },
  {
    en: "A caution signal is not a prediction of failure — it is a reminder to act wisely.",
    ta: "எச்சரிக்கை சிக்னல் தோல்வியின் முன்னறிவிப்பல்ல — புத்திசாலித்தனமாக செயல்பட நினைவூட்டல் மட்டுமே.",
  },
  {
    en: "The universe tends to move you toward what you consistently hold in mind.",
    ta: "நீங்கள் தொடர்ந்து மனதில் கொண்டிருப்பதை நோக்கி பிரபஞ்சம் உங்களை நகர்த்துகிறது.",
  },
  {
    en: "A favourable period still requires your effort. Vinaadi shows you when the ground is ready.",
    ta: "சாதகமான காலமும் உங்கள் முயற்சி தேவைப்படும். நிலம் தயாராக இருக்கும் நேரத்தை விநாடி காட்டுகிறது.",
  },
  {
    en: "Astrology reads the weather. You still decide whether to dance in the rain or carry an umbrella.",
    ta: "ஜோதிடம் வானிலையை வாசிக்கிறது. மழையில் நடனமாடுவதா அல்லது குடை எடுப்பதா என்பதை நீங்கள் தீர்மானிக்கிறீர்கள்.",
  },
  {
    en: "The birth chart is the instrument you were given. How you play it remains entirely your choice.",
    ta: "ஜாதகம் உங்களுக்கு கொடுக்கப்பட்ட கருவி. நீங்கள் அதை எப்படி வாசிக்கிறீர்கள் என்பது முற்றிலும் உங்கள் தேர்வே.",
  },
];

const TAB_DEFS: Array<{ id: Tab; labelEn: string; labelTaKey?: LabelKey }> = [
  { id: "personal", labelEn: "Today", labelTaKey: "tab_today" },
  { id: "calendar", labelEn: "Calendar", labelTaKey: "tab_calendar" },
  { id: "family", labelEn: "Family & Charts", labelTaKey: "tab_family" },
  { id: "life-areas", labelEn: "Life Area", labelTaKey: "tab_life_areas" },
  { id: "plan", labelEn: "Plan", labelTaKey: "tab_plan" },
  { id: "transits", labelEn: "Transits", labelTaKey: "tab_transits" },
  { id: "journal", labelEn: "Journal", labelTaKey: "tab_journal" },
  { id: "explore", labelEn: "Explore", labelTaKey: "tab_explore" },
  { id: "tools", labelEn: "Tools", labelTaKey: "tab_tools" },
  { id: "settings", labelEn: "Settings", labelTaKey: "tab_settings" },
  { id: "qa", labelEn: "QA" },
];

interface DashboardHeroProps {
  lang: Lang;
  activeTab: Tab;
  uiVariant?: UiVariant;
  birthDisplayName: string;
  status: string;
  chartSummary: ChartSummaryData | null;
  selectedVault: FamilyVaultListItem | null;
  selectedVaultId: string;
  selectedDate: string;
  userEmail: string | null;
  showUserMenu: boolean;
  alertCount: number;
  alertItems: Array<{ type: string; title: string; body: string }>;
  inboxItems: NotificationInboxItem[];
  inboxUnreadCount: number;
  onMarkAllRead: () => void;
  onMarkOneRead: (notificationId: string) => void;
  onTabChange: (tab: Tab) => void;
  onDateChange: (date: string) => void;
  onLangToggle: () => void;
  onUserMenuToggle: () => void;
  onUserMenuClose: () => void;
  onGoToSettings: () => void;
  onSignOut: () => void;
  /** Nova navbar's "✦ Ask Vinaadi" button — omitted when no chart exists yet. */
  onAskVinaadi?: () => void;
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
    uiVariant = "classic",
    birthDisplayName,
    status,
    chartSummary,
    selectedVault,
    selectedDate,
    userEmail,
    showUserMenu,
    alertCount,
    alertItems,
    inboxItems,
    inboxUnreadCount,
    onMarkAllRead,
    onMarkOneRead,
    onTabChange,
    onDateChange,
    onLangToggle,
    onUserMenuToggle,
    onUserMenuClose,
    onGoToSettings,
    onSignOut,
    onAskVinaadi,
  } = props;

  const [showAlerts, setShowAlerts] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  const lagnaRasi = chartSummary?.lagnaRasi ?? "";
  // Settings is reachable from the avatar menu, so it is omitted from the tab
  // strip to keep the mobile nav compact. QA only shows outside production.
  // Under Nova, "Transits & Dasha" lives inside the Plan tab's own toggle
  // (see dashboard-plan-tab-nova.tsx) rather than as a separate destination —
  // Classic's standalone Transits tab is untouched, so its pill stays for Classic.
  const tabs = useMemo(
    () =>
      TAB_DEFS.filter(
        (tab) =>
          tab.id !== "settings" &&
          (SHOW_QA_TAB || tab.id !== "qa") &&
          (uiVariant !== "nova" || tab.id !== "transits"),
      ),
    [uiVariant],
  );

  // Keep the active tab scrolled into view on the mobile scrollable strip so the
  // user can always see where they are, even when tabs overflow the viewport.
  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [activeTab]);

  const langToggleTitle = lang === "ta" ? "Switch to English" : "தமிழுக்கு மாறு";

  // "05 · Jul · 2026" label for the Nova navbar's date pill. The native date
  // input stays mounted underneath (invisible, full-pill hit area) so the OS
  // picker and keyboard entry keep working — this span is display-only.
  const novaDateLabel = useMemo(() => {
    const parsed = new Date(`${selectedDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return selectedDate;
    const day = String(parsed.getDate()).padStart(2, "0");
    const month = parsed.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-GB", { month: "short" });
    return `${day} · ${month} · ${parsed.getFullYear()}`;
  }, [selectedDate, lang]);

  // One tab strip, two homes: Classic renders it in the cd-tabnav row below
  // the topbar; Nova renders it inline in the topbar itself (cd-topnav).
  // Only one of the two navs is ever mounted, so the motion layoutId is safe.
  const tabButtons = tabs.map((tab) => (
    <button
      key={tab.id}
      type="button"
      ref={activeTab === tab.id ? activeTabRef : undefined}
      className={`cd-tab${activeTab === tab.id ? " cd-tab--active" : ""}`}
      aria-current={activeTab === tab.id ? "page" : undefined}
      onClick={() => onTabChange(tab.id)}
    >
      {lang === "ta" && tab.labelTaKey ? t(tab.labelTaKey, lang) : tab.labelEn}
      {activeTab === tab.id && (
        <motion.span
          layoutId="cd-tab-indicator"
          className="cd-tab__indicator"
          transition={{ type: "spring", stiffness: 400, damping: 15, mass: 0.8 }}
        />
      )}
    </button>
  ));

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
            {uiVariant !== "nova" && lagnaRasi && (
              <span className="cd-brand__sub" title={birthDisplayName}>
                {birthDisplayName ? `${birthDisplayName} · ` : ""}
                {chartSummary
                  ? `${chartSummary.lagnaRasi} ${t("label_lagnam", lang)} · ${chartSummary.moonRasi} ${t("label_janma_rasi", lang)}`
                  : "Thirukanitham"}
              </span>
            )}
          </div>

          {uiVariant === "nova" && (
            <nav className="cd-topnav" aria-label="Dashboard navigation">
              <div className="cd-topnav__scroll">{tabButtons}</div>
            </nav>
          )}

          <div className="cd-topbar__right">
            {uiVariant !== "nova" && (
              <span className="cd-status-pill" title={status}>
                <span className="cd-status-dot" />
                {status}
              </span>
            )}

            {uiVariant !== "nova" && selectedVault && (
              <span className="cd-vault-name" title={selectedVault.name}>
                {selectedVault.name}
              </span>
            )}

            {uiVariant === "nova" && onAskVinaadi && (
              <button type="button" className="cd-ask-nav-btn" onClick={onAskVinaadi}>
                <span aria-hidden="true">✦</span>
                {t("ask_panel_title", lang)}
              </button>
            )}

            <label htmlFor="dashboard-date" className="cd-visually-hidden">
              {lang === "ta" ? "தேதி தேர்வு" : "Select date"}
            </label>
            <div className="cd-date-field">
              <input
                id="dashboard-date"
                className="cd-date-input"
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                onClick={uiVariant === "nova" ? (e) => {
                  // The input is an invisible overlay under Nova, so a click
                  // anywhere on the pill should open the picker directly.
                  try { e.currentTarget.showPicker?.(); } catch { /* non-gesture call — ignore */ }
                } : undefined}
                aria-label={lang === "ta" ? "தேதி தேர்வு" : "Select date"}
              />
              {uiVariant === "nova" && (
                <span className="cd-date-display" aria-hidden="true">
                  {novaDateLabel}
                  <span className="cd-date-display__caret">▾</span>
                </span>
              )}
            </div>

            <div className="cd-popover-anchor">
              <button
                type="button"
                className="cd-icon-btn"
                onClick={() => { setShowAlerts(false); setShowInbox((v) => !v); }}
                aria-label={t("notif_section_title", lang)}
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
                        {t("notif_sent", lang)}
                      </p>
                      {inboxUnreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => { onMarkAllRead(); }}
                          style={{ fontSize: "0.7rem", color: "var(--color-accent, var(--panel-brand))", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
                        >
                          {t("notif_mark_all_read", lang)}
                        </button>
                      )}
                    </div>
                    {inboxItems.length === 0 && alertItems.length === 0 ? (
                      <p className="cd-empty-note">
                        {t("notif_inbox_empty", lang)}
                      </p>
                    ) : inboxItems.length === 0 ? (
                      <p className="cd-empty-note" style={{ fontSize: "0.75rem" }}>
                        {t("notif_sent_empty", lang)}
                      </p>
                    ) : (
                      inboxItems.map((n) => (
                        <div key={n.notification_id} className="cd-alert-item" style={{ opacity: n.read_at ? 0.6 : 1 }}>
                          <p className="cd-alert-item__title" style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                            <span>{n.title}</span>
                            {!n.read_at && <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--color-accent, var(--panel-brand))", flexShrink: 0, marginTop: "4px" }} />}
                          </p>
                          <p className="cd-alert-item__body">{n.body}</p>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                            <p style={{ margin: 0, fontSize: "0.65rem", color: "var(--color-faint)" }}>
                              {new Date(n.send_at).toLocaleString()}
                            </p>
                            {!n.read_at && (
                              <button
                                type="button"
                                onClick={() => onMarkOneRead(n.notification_id)}
                                style={{ fontSize: "0.68rem", color: "var(--color-accent, var(--panel-brand))", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit", flexShrink: 0 }}
                              >
                                {t("notif_mark_read", lang)}
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    <div style={{ paddingTop: "10px", borderTop: "1px solid var(--color-border)" }}>
                      <Link
                        href="/notifications"
                        onClick={() => setShowInbox(false)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          color: "var(--color-accent, var(--panel-brand))",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          textDecoration: "none",
                        }}
                      >
                        {lang === "ta" ? "முழு அறிவிப்பு பெட்டி" : "Open full inbox"}
                      </Link>
                    </div>
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
                aria-label={t("label_account", lang)}
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

        {/* Nova identity sub-bar — the chart identity that Classic shows in
            cd-brand__sub, plus the status + vault chips that Classic keeps in
            the topbar right cluster. */}
        {uiVariant === "nova" && (
          <div className="cd-subbar">
            <div className="cd-subbar__inner">
              <div className="cd-subbar__identity">
                {birthDisplayName && (
                  <span className="cd-subbar__name" title={birthDisplayName}>
                    {birthDisplayName}
                  </span>
                )}
                {chartSummary && (
                  <span className="cd-subbar__chart">
                    {`${chartSummary.moonRasi} - ${chartSummary.janmaNakshatra} - ${chartSummary.lagnaRasi} ${lang === "ta" ? "லக்னம்" : "Lagnam"}`}
                  </span>
                )}
              </div>
              <div className="cd-subbar__right">
                {status && (
                  <span className="cd-subbar__status" title={status}>
                    <span className="cd-subbar__status-check" aria-hidden="true">✓</span>
                    {status}
                  </span>
                )}
                {selectedVault && (
                  <button
                    type="button"
                    className="cd-subbar__vault"
                    title={selectedVault.name}
                    onClick={() => onTabChange("family")}
                  >
                    {selectedVault.name}
                    <span className="cd-subbar__vault-caret" aria-hidden="true">▾</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {uiVariant !== "nova" && (
        <nav className="cd-tabnav" aria-label="Dashboard navigation">
          <div className="cd-tabnav__inner">
            <div className="cd-tabnav__scroll">{tabButtons}</div>
          </div>
        </nav>
      )}

      {/* Daily principle strip — rotates by day of week */}
      {(() => {
        const principle = DAILY_PRINCIPLES[new Date(selectedDate).getDay()] ?? DAILY_PRINCIPLES[0];
        return (
          <div className="cd-principle-strip" style={{
            padding: "8px 20px",
            background: uiVariant === "nova" ? "var(--color-accent-muted)" : "rgba(184, 90, 44, 0.05)",
            borderBottom: uiVariant === "nova" ? "1px solid var(--color-border)" : "1px solid rgba(184, 90, 44, 0.14)",
            textAlign: "center",
          }}>
            <p style={{
              margin: 0,
              fontSize: "0.72rem",
              fontStyle: "italic",
              color: uiVariant === "nova" ? "var(--color-text)" : "#6B4C2A",
              letterSpacing: "0.01em",
              lineHeight: 1.55,
            }}>
              {lang === "ta" ? principle.ta : principle.en}
            </p>
          </div>
        );
      })()}

    </>
  );
}

