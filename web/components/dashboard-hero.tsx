"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Settings, LogOut, Check, X } from "lucide-react";
import Image from "next/image";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  ChartSummaryData,
  FamilyVaultListItem,
  NotificationInboxItem,
} from "@/lib/types";
import type { Tab } from "@/lib/dashboard-tabs";
import type { StatusMessage } from "./dashboard-ui-nova";

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

// IA model (DASH-13): this strip mirrors the left rail exactly — six
// first-class destinations (Today · Calendar · Family & Charts · Plan · Tools
// · Explore). Depth surfaces (Life Areas, Journal, Transits) live under
// Explore / Plan and highlight NOTHING while active — marking Explore as
// current-page while the user is actually on Life Areas/Journal misled about
// where they were (user feedback 2026-07-14); the depth page's own heading +
// the "Back to Explore" banner carry the orientation instead. Same rule in
// dashboard-left-rail.tsx — the two navs must never disagree.
const TAB_DEFS: Array<{ id: Tab; labelEn: string; labelTaKey?: LabelKey }> = [
  { id: "personal", labelEn: "Today", labelTaKey: "tab_today" },
  { id: "calendar", labelEn: "Calendar", labelTaKey: "tab_calendar" },
  { id: "family", labelEn: "Family & Charts", labelTaKey: "tab_family" },
  { id: "plan", labelEn: "Plan", labelTaKey: "tab_plan" },
  { id: "tools", labelEn: "Tools", labelTaKey: "tab_tools" },
  { id: "explore", labelEn: "Explore", labelTaKey: "tab_explore" },
  { id: "settings", labelEn: "Settings", labelTaKey: "tab_settings" },
  { id: "qa", labelEn: "QA" },
];

interface DashboardHeroProps {
  lang: Lang;
  activeTab: Tab;
  birthDisplayName: string;
  /** Tone travels with the message (DASH-08) — never inferred from wording. */
  status: StatusMessage | null;
  chartSummary: ChartSummaryData | null;
  /** UXD-15 — surfaced as a caveat when the birth time is missing/approximate,
   *  since lagna & houses depend on it. Null when unknown. */
  birthTimeConfidenceMinutes?: number | null;
  birthTimeLocal?: string | null;
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

/* Nova navbar glyphs — lucide (SHD-02). `.cd-icon` controls size (18px) and
   stroke-width (2), so these render at the same size/weight as the previous
   hand-rolled set. */
function BellIcon() {
  return <Bell className="cd-icon" aria-hidden="true" focusable="false" />;
}

function SettingsIcon() {
  return <Settings className="cd-icon" aria-hidden="true" focusable="false" />;
}

function SignOutIcon() {
  return <LogOut className="cd-icon" aria-hidden="true" focusable="false" />;
}

function CheckIcon() {
  return <Check className="cd-icon" aria-hidden="true" focusable="false" />;
}

function CloseIcon() {
  return <X className="cd-icon" aria-hidden="true" focusable="false" />;
}

export function DashboardHero(props: DashboardHeroProps) {
  const {
    lang,
    activeTab,
    birthDisplayName,
    status,
    chartSummary,
    birthTimeConfidenceMinutes,
    birthTimeLocal,
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

  // Settings is reachable from the avatar menu, so it is omitted from the tab
  // strip to keep the mobile nav compact. QA only shows outside production.
  // "Transits & Dasha" lives inside the Plan tab's own toggle
  // (see dashboard-plan-tab-nova.tsx) rather than as a separate destination.
  const tabs = useMemo(
    () =>
      TAB_DEFS.filter(
        (tab) =>
          tab.id !== "settings" &&
          (SHOW_QA_TAB || tab.id !== "qa"),
      ),
    [],
  );

  // Keep the active tab scrolled into view on the mobile scrollable strip so the
  // user can always see where they are, even when tabs overflow the viewport.
  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [activeTab]);

  // UXD-02 — edge fade + chevron affordance so overflowing tabs are discoverable
  // on narrow viewports (the strip scrolls with its scrollbar hidden). Tracks
  // whether the strip is scrolled to the start/end and exposes that as data
  // attributes the CSS fades/chevron key off.
  const topnavScrollRef = useRef<HTMLDivElement>(null);
  const [topnavEdges, setTopnavEdges] = useState({ atStart: true, atEnd: true });
  useEffect(() => {
    const el = topnavScrollRef.current;
    if (!el) return;
    const update = () => {
      const atStart = el.scrollLeft <= 1;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
      setTopnavEdges((p) => (p.atStart === atStart && p.atEnd === atEnd ? p : { atStart, atEnd }));
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { el.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
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
  const tabButtons = tabs.map((tab) => {
    const isActive = activeTab === tab.id;
    return (
      <button
        key={tab.id}
        type="button"
        ref={isActive ? activeTabRef : undefined}
        className={`cd-tab${isActive ? " cd-tab--active" : ""}`}
        aria-current={isActive ? "page" : undefined}
        onClick={() => onTabChange(tab.id)}
      >
        {lang === "ta" && tab.labelTaKey ? t(tab.labelTaKey, lang) : tab.labelEn}
        {isActive && (
          <motion.span
            layoutId="cd-tab-indicator"
            className="cd-tab__indicator"
            transition={{ type: "spring", stiffness: 400, damping: 15, mass: 0.8 }}
          />
        )}
      </button>
    );
  });

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
          </div>

          <nav
            className="cd-topnav"
            aria-label="Dashboard navigation"
            data-scroll-start={topnavEdges.atStart}
            data-scroll-end={topnavEdges.atEnd}
          >
            <div className="cd-topnav__scroll" ref={topnavScrollRef}>{tabButtons}</div>
            <button
              type="button"
              className="cd-topnav__more"
              aria-hidden="true"
              tabIndex={-1}
              onClick={() => {
                const el = topnavScrollRef.current;
                el?.scrollBy({ left: Math.round(el.clientWidth * 0.7), behavior: "smooth" });
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </nav>

          <div className="cd-topbar__right">
            {onAskVinaadi && (
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
                onClick={(e) => {
                  // The input is an invisible overlay, so a click anywhere on
                  // the pill should open the picker directly.
                  try { e.currentTarget.showPicker?.(); } catch { /* non-gesture call — ignore */ }
                }}
                aria-label={lang === "ta" ? "தேதி தேர்வு" : "Select date"}
              />
              <span className="cd-date-display" aria-hidden="true">
                {novaDateLabel}
                <span className="cd-date-display__caret">▾</span>
              </span>
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

        {/* Nova identity sub-bar — chart identity + status + vault chips. */}
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
              {/* UXD-15 — birth-time uncertainty is collected but was never shown;
                  lagna & houses depend on it, so flag low-confidence/missing time. */}
              {chartSummary && (birthTimeLocal == null || (birthTimeConfidenceMinutes != null && birthTimeConfidenceMinutes >= 60)) && (
                <span
                  className="cd-subbar__caveat"
                  title={birthTimeLocal == null
                    ? (lang === "ta" ? "பிறப்பு நேரம் இல்லை — லக்னமும் பாவங்களும் தோராயம்." : "No birth time on file — lagna and houses are estimated.")
                    : (lang === "ta" ? "பிறப்பு நேரம் தோராயம் — லக்னம் சார்ந்த பலன்கள் மாறலாம்." : "Birth time approximate — lagna-dependent results may shift.")}
                >
                  ≈ {birthTimeLocal == null
                    ? (lang === "ta" ? "நேரம் தோராயம்" : "time estimated")
                    : (lang === "ta" ? "நேரம் தோராயம்" : "time approximate")}
                </span>
              )}
            </div>
            <div className="cd-subbar__right">
              {/* aria-live so async outcomes are announced; ✓/⚠ follows the
                  message's own tone instead of always showing a check (DASH-08). */}
              {status && (
                <span
                  className="cd-subbar__status"
                  title={status.text}
                  role="status"
                  aria-live="polite"
                  style={status.tone === "error" ? { color: "var(--color-low, #C0392B)" } : undefined}
                >
                  <span className="cd-subbar__status-check" aria-hidden="true">
                    {status.tone === "error" ? "⚠" : "✓"}
                  </span>
                  {status.text}
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
      </header>

      {/* Daily principle strip — rotates by day of week */}
      {(() => {
        const principle = DAILY_PRINCIPLES[new Date(selectedDate).getDay()] ?? DAILY_PRINCIPLES[0];
        return (
          <div className="cd-principle-strip" style={{
            padding: "8px 20px",
            background: "var(--color-accent-muted)",
            borderBottom: "1px solid var(--color-border)",
            textAlign: "center",
          }}>
            <p style={{
              margin: 0,
              fontSize: "0.72rem",
              fontStyle: "italic",
              color: "var(--color-text)",
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

