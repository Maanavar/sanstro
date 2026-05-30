"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { formatDateLabel, getScoreBand, todayIso } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  ChartSummaryData,
  DailyGuidanceData,
  FamilyAggregateData,
  FamilyVaultListItem,
  TransitSnapshotData,
} from "@/lib/types";

type Tab = "onboarding" | "personal" | "tools" | "transits" | "plan" | "life-areas" | "family" | "calendar" | "journal" | "settings" | "qa";

const TAB_DEFS: { id: Tab; label: string; labelTa: string }[] = [
  { id: "personal",   label: "Personal",   labelTa: "தனிப்பட்ட" },
  { id: "family",     label: "Family",     labelTa: "குடும்பம்" },
  { id: "life-areas", label: "Life Areas", labelTa: "வாழ்க்கை" },
  { id: "plan",       label: "Plan",       labelTa: "திட்டம்" },
  { id: "transits",   label: "Transits",   labelTa: "கோசாரம்" },
  { id: "journal",    label: "Journal",    labelTa: "குறிப்பேடு" },
  { id: "calendar",   label: "Calendar",   labelTa: "நாட்காட்டி" },
  { id: "tools",      label: "Tools",      labelTa: "கருவிகள்" },
  { id: "settings",   label: "Settings",   labelTa: "அமைப்புகள்" },
  { id: "qa",         label: "QA",         labelTa: "QA" },
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
  onTabChange: (tab: Tab) => void;
  onDateChange: (date: string) => void;
  onLangToggle: () => void;
  onUserMenuToggle: () => void;
  onUserMenuClose: () => void;
  onGoToSettings: () => void;
  onSignOut: () => void;
}

export function DashboardHero({
  lang,
  activeTab,
  birthDisplayName,
  status,
  chartSummary,
  todayGuidance,
  todayTransit,
  familyAggregate,
  selectedVault,
  selectedVaultId,
  selectedDate,
  userEmail,
  showUserMenu,
  toast,
  alertCount,
  alertItems,
  onTabChange,
  onDateChange,
  onLangToggle,
  onUserMenuToggle,
  onUserMenuClose,
  onGoToSettings,
  onSignOut,
}: DashboardHeroProps) {
  const todayDate = useRef(todayIso());
  const [showAlerts, setShowAlerts] = useState(false);
  const isTodayChandrashtama = todayTransit?.isChandrashtama ?? false;

  const lagnaRasi = chartSummary?.lagnaRasi ?? "";

  return (
    <>
      <style>{`
        /* ── Clarity Dashboard Shell ── */
        .cd-shell {
          background: #F4EEE2;
          min-height: 100vh;
          font-family: 'Noto Sans Tamil', 'Inter', system-ui, sans-serif;
          color: #3D352B;
        }

        /* ── Top bar ── */
        .cd-topbar {
          position: sticky;
          top: 0;
          z-index: 60;
          background: rgba(244,238,226,0.95);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid #E4DBC8;
        }
        .cd-topbar__inner {
          width: min(1280px, calc(100% - 32px));
          margin: 0 auto;
          height: 56px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        /* Brand */
        .cd-brand {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-shrink: 0;
          text-decoration: none;
        }
        .cd-brand__symbol {
          width: 24px;
          height: 24px;
          display: block;
        }
        .cd-brand__name {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 1.15rem;
          font-weight: 500;
          letter-spacing: -0.02em;
          color: #1A1612;
        }
        .cd-brand__sub {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 0.68rem;
          font-weight: 500;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #A89D89;
          padding-left: 10px;
          border-left: 1px solid #D4C8AE;
          margin-left: 4px;
        }

        /* Status pill */
        .cd-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid #E4DBC8;
          background: #FAF5EA;
          font-size: 0.72rem;
          color: #7A6F5E;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 180px;
        }
        .cd-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #5C7654;
          flex-shrink: 0;
        }

        /* Right utility buttons */
        .cd-topbar__right {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cd-vault-name {
          font-size: 0.78rem;
          color: #7A6F5E;
          font-weight: 500;
        }
        .cd-popover-anchor {
          position: relative;
        }
        .cd-overlay {
          position: fixed;
          inset: 0;
        }
        .cd-overlay--alerts { z-index: 299; }
        .cd-overlay--menu { z-index: 199; }
        .cd-empty-note {
          margin: 0;
          padding: 8px 10px;
          font-size: 0.78rem;
          color: #A89D89;
        }
        .cd-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid #E4DBC8;
          background: #FAF5EA;
          color: #7A6F5E;
          font-size: 0.85rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: background 150ms ease, border-color 150ms ease;
          flex-shrink: 0;
        }
        .cd-icon-btn:hover { background: #EDE5D4; border-color: #D4C8AE; }

        .cd-badge {
          position: absolute;
          top: -3px;
          right: -3px;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          background: #B85A2C;
          color: #fff;
          font-size: 0.5rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cd-lang-btn {
          padding: 4px 11px;
          border-radius: 999px;
          border: 1px solid #D4C8AE;
          background: #FAF5EA;
          color: #3D352B;
          font-size: 0.73rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 150ms ease;
        }
        .cd-lang-btn:hover { background: #EDE5D4; }

        .cd-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #1A1612;
          color: #F4EEE2;
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #D4C8AE;
          transition: transform 0.12s ease;
          flex-shrink: 0;
        }
        .cd-avatar:hover { transform: scale(1.06); }

        /* Dropdown */
        .cd-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          z-index: 300;
          background: #FFFFFF;
          border: 1px solid #E4DBC8;
          border-radius: 14px;
          padding: 6px;
          min-width: 200px;
          box-shadow: 0 8px 32px rgba(60,40,20,0.16);
        }
        .cd-dropdown__head {
          padding: 8px 10px 10px;
          border-bottom: 1px solid #E4DBC8;
          margin-bottom: 4px;
        }
        .cd-dropdown__email-label {
          margin: 0 0 2px;
          font-size: 0.62rem;
          color: #A89D89;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        .cd-dropdown__email {
          margin: 0;
          font-size: 0.8rem;
          color: #1A1612;
          font-weight: 500;
          word-break: break-all;
        }
        .cd-dropdown__btn {
          width: 100%;
          padding: 8px 10px;
          border-radius: 8px;
          background: transparent;
          border: none;
          color: #3D352B;
          font-size: 0.83rem;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: inherit;
          transition: background 0.12s;
        }
        .cd-dropdown__btn:hover { background: #FAF5EA; }
        .cd-dropdown__btn--danger { color: #A8482F; }
        .cd-dropdown__btn--danger:hover { background: #F2D8CC; }
        .cd-dropdown__divider { height: 1px; background: #E4DBC8; margin: 4px 0; }

        /* Alert popover */
        .cd-alerts-popover {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          z-index: 300;
          background: #FFFFFF;
          border: 1px solid #E4DBC8;
          border-radius: 14px;
          padding: 6px;
          min-width: 280px;
          max-width: 340px;
          box-shadow: 0 8px 32px rgba(60,40,20,0.16);
        }
        .cd-alerts-head {
          margin: 0 0 6px;
          padding: 4px 8px;
          font-size: 0.62rem;
          font-weight: 700;
          color: #A89D89;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .cd-alert-item {
          padding: 8px 10px;
          border-radius: 8px;
          margin-bottom: 3px;
          background: #FAF5EA;
          border: 1px solid #E4DBC8;
        }
        .cd-alert-item__title {
          margin: 0 0 2px;
          font-size: 0.72rem;
          font-weight: 700;
          color: #B85A2C;
        }
        .cd-alert-item__body {
          margin: 0;
          font-size: 0.7rem;
          color: #7A6F5E;
          line-height: 1.4;
        }

        /* ── Tab nav ── */
        .cd-tabnav {
          border-bottom: 1px solid #E4DBC8;
          background: rgba(244,238,226,0.97);
        }
        .cd-tabnav__inner {
          width: min(1280px, calc(100% - 32px));
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 0;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .cd-tabnav__inner::-webkit-scrollbar { display: none; }

        .cd-tab {
          padding: 14px 18px 12px;
          border: none;
          background: transparent;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 0.88rem;
          font-weight: 500;
          color: #A89D89;
          cursor: pointer;
          white-space: nowrap;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          transition: color 150ms ease, border-color 150ms ease;
        }
        .cd-tab:hover { color: #3D352B; }
        .cd-tab--active {
          color: #1A1612;
          font-weight: 600;
          border-bottom-color: #1A1612;
        }

        .cd-tabnav__right {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 0;
          flex-shrink: 0;
        }
        .cd-date-input {
          padding: 5px 10px;
          border-radius: 8px;
          border: 1px solid #D4C8AE;
          background: #FFFFFF;
          color: #1A1612;
          font-size: 0.8rem;
          font-family: inherit;
          outline: none;
          cursor: pointer;
        }
        .cd-date-input:focus { border-color: #B85A2C; box-shadow: 0 0 0 2px rgba(184,90,44,0.1); }

        /* ── Toast ── */
        .cd-toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 200;
          padding: 11px 22px;
          border-radius: 10px;
          font-size: 0.88rem;
          font-weight: 500;
          pointer-events: none;
          white-space: nowrap;
          box-shadow: 0 4px 20px rgba(60,40,20,0.18);
        }
        .cd-toast--success {
          background: #DCE4D2;
          border: 1px solid rgba(92,118,84,0.5);
          color: #3a6b40;
        }
        .cd-toast--error {
          background: #F2D8CC;
          border: 1px solid rgba(168,72,47,0.4);
          color: #A8482F;
        }

        /* ── Page content wrapper ── */
        .cd-page {
          width: min(1280px, calc(100% - 32px));
          margin: 0 auto;
          padding: 28px 0 64px;
        }
      `}</style>

      {/* ── Top bar ── */}
      <header className="cd-topbar">
        <div className="cd-topbar__inner">
          {/* Brand */}
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
              <span className="cd-brand__sub">
                {birthDisplayName ? `${birthDisplayName} · ` : ""}
                {chartSummary
                  ? `${chartSummary.lagnaRasi} ${t("label_lagnam", lang)} · ${chartSummary.moonRasi} ${t("label_janma_rasi", lang)}`
                  : "Thirukanitham"}
              </span>
            )}
          </div>

          <div className="cd-topbar__right">
            {/* Status */}
            <span className="cd-status-pill" title={status}>
              <span className="cd-status-dot" />
              {status}
            </span>

            {/* Family vault name */}
            {selectedVault && (
              <span className="cd-vault-name">
                {selectedVault.name}
              </span>
            )}

            {/* Alerts bell */}
            <div className="cd-popover-anchor">
              <button
                type="button"
                className="cd-icon-btn"
                onClick={() => setShowAlerts((v) => !v)}
                title={lang === "ta" ? "அறிவிப்புகள்" : "Alerts"}
              >
                🔔
                {alertCount > 0 && (
                  <span className="cd-badge">{alertCount > 9 ? "9+" : alertCount}</span>
                )}
              </button>
              {showAlerts && (
                <>
                  <div className="cd-overlay cd-overlay--alerts" onClick={() => setShowAlerts(false)} />
                  <div className="cd-alerts-popover">
                    <p className="cd-alerts-head">{lang === "ta" ? "அலர்ட்கள்" : "Alerts & Cautions"}</p>
                    {alertItems.length === 0 ? (
                      <p className="cd-empty-note">
                        {lang === "ta" ? "இன்று எந்த அலர்ட்டும் இல்லை." : "No alerts today."}
                      </p>
                    ) : (
                      alertItems.map((a, i) => (
                        <div key={i} className="cd-alert-item">
                          <p className="cd-alert-item__title">{a.title}</p>
                          <p className="cd-alert-item__body">{a.body}</p>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Lang toggle */}
            <button type="button" className="cd-lang-btn" onClick={onLangToggle}
              title={lang === "ta" ? "Switch to English" : "தமிழுக்கு மாறு"}>
              {lang === "ta" ? "EN" : "த"}
            </button>

            {/* Avatar + user menu */}
            <div className="cd-popover-anchor">
              <button
                type="button"
                className="cd-avatar"
                onClick={onUserMenuToggle}
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
                      <span>⚙️</span> Settings
                    </button>
                    <div className="cd-dropdown__divider" />
                    <button type="button" className="cd-dropdown__btn cd-dropdown__btn--danger" onClick={onSignOut}>
                      <span>→</span> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Tab navigation ── */}
      <nav className="cd-tabnav" aria-label="Dashboard navigation">
        <div className="cd-tabnav__inner">
          {TAB_DEFS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`cd-tab${activeTab === tab.id ? " cd-tab--active" : ""}`}
              onClick={() => onTabChange(tab.id)}
            >
              {lang === "ta" ? tab.labelTa : tab.label}
            </button>
          ))}

          <div className="cd-tabnav__right">
            <input
              className="cd-date-input"
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
            />
          </div>
        </div>
      </nav>

      {/* Toast */}
      {toast && (
        <div className={`cd-toast cd-toast--${toast.tone}`}>
          {toast.tone === "success" ? "✔ " : "✕ "}{toast.message}
        </div>
      )}
    </>
  );
}
