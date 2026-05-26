"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { formatDateLabel, getScoreBand, todayIso } from "@/lib/format";
import { t, tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  ChartSummaryData,
  DailyGuidanceData,
  DashaTimelineResponseData,
  FamilyAggregateData,
  FamilyVaultListItem,
  TransitSnapshotData,
} from "@/lib/types";
import { Metric } from "./dashboard-ui";

type Tab = "onboarding" | "personal" | "life-areas" | "family" | "calendar" | "settings" | "qa";

const TAB_IDS: { id: Tab; emoji: string }[] = [
  { id: "personal",   emoji: "◎" },
  { id: "life-areas", emoji: "🌿" },
  { id: "family",     emoji: "👪" },
  { id: "calendar",   emoji: "📅" },
  { id: "settings",   emoji: "⚙️" },
  { id: "qa",         emoji: "❓" },
];

interface DashboardHeroProps {
  lang: Lang;
  activeTab: Tab;
  birthDisplayName: string;
  status: string;
  chartSummary: ChartSummaryData | null;
  dasha: DashaTimelineResponseData | null;
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
  dasha,
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
  const headerScoreBand = todayGuidance ? getScoreBand(todayGuidance.score) : null;
  const isTodayChandrashtama = todayTransit?.isChandrashtama ?? false;

  return (
    <>
      {/* Site hero */}
      <div className="site__hero">
        <div className="site__hero-inner">
          <div className="site__identity">
            <div>
              <Image
                src="/brand/vinaadi-wordmark-color-transparent.png"
                alt="Vinaadi - Your Cosmic Copilot"
                width={1764}
                height={619}
                className="site__wordmark"
                priority
              />
              <p className="site__subtitle">
                {chartSummary
                  ? `${birthDisplayName ? `${birthDisplayName} · ` : ""}${chartSummary.lagnaRasi} ${t("label_lagnam", lang)} · ${chartSummary.moonRasi} ${t("label_janma_rasi", lang)} · ${chartSummary.janmaNakshatra} ${t("label_nakshatra", lang)}`
                  : "Tamil astrology – Thirukanitham"}
              </p>
              <div className="site__meta-row">
                {todayGuidance ? (
                  <span className="chip chip--accent" title="Today's score – fixed to the current calendar date">
                    {`${t("personal_today", lang)} ${todayGuidance.score}/100`}
                  </span>
                ) : null}
                {selectedVault ? <span className="chip chip--neutral">{selectedVault.name}</span> : null}
                {isTodayChandrashtama && (
                  <span style={{
                    fontSize: "0.78rem", fontWeight: 700, padding: "4px 12px", borderRadius: "999px",
                    background: "rgba(239,68,68,0.2)", color: "#f87171",
                    border: "1px solid rgba(248,113,113,0.5)",
                  }}>
                    ⚠ {t("chandrashtamam_active", lang)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="site__utility-row">
            {/* Notification bell */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setShowAlerts((v) => !v)}
                title={lang === "ta" ? "அறிவிப்புகள்" : "Alerts"}
                style={{
                  width: "34px", height: "34px", borderRadius: "50%",
                  background: alertCount > 0 ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.07)",
                  border: alertCount > 0 ? "1px solid rgba(251,191,36,0.4)" : "1px solid rgba(255,255,255,0.15)",
                  color: alertCount > 0 ? "#fbbf24" : "rgba(255,255,255,0.5)",
                  fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", position: "relative", flexShrink: 0,
                }}
              >
                🔔
                {alertCount > 0 && (
                  <span style={{
                    position: "absolute", top: "-3px", right: "-3px",
                    width: "16px", height: "16px", borderRadius: "50%",
                    background: "#fbbf24", color: "#0a0800",
                    fontSize: "0.55rem", fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {alertCount > 9 ? "9+" : alertCount}
                  </span>
                )}
              </button>

              {showAlerts && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 299 }} onClick={() => setShowAlerts(false)} />
                  <div style={{
                    position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 300,
                    background: "#111218", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px", padding: "8px", minWidth: "280px", maxWidth: "340px",
                    boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
                  }}>
                    <p style={{ margin: "0 0 8px", padding: "4px 8px", fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {lang === "ta" ? "அலர்ட்கள்" : "Alerts & Cautions"}
                    </p>
                    {alertItems.length === 0 ? (
                      <p style={{ margin: 0, padding: "8px 10px", fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>
                        {lang === "ta" ? "இன்று எந்த அலர்ட்டும் இல்லை." : "No alerts today."}
                      </p>
                    ) : (
                      alertItems.map((a, i) => (
                        <div key={i} style={{
                          padding: "8px 10px", borderRadius: "8px", marginBottom: "4px",
                          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                        }}>
                          <p style={{ margin: "0 0 2px", fontSize: "0.72rem", fontWeight: 700, color: "#fbbf24" }}>{a.title}</p>
                          <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>{a.body}</p>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={onLangToggle}
              style={{
                padding: "4px 12px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.8)",
                fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", letterSpacing: "0.04em",
              }}
              title={lang === "ta" ? "Switch to English" : "தமிழுக்கு மாறு"}
            >
              {lang === "ta" ? "EN" : "த"}
            </button>

            <span className="site__status-pill" title={status}>
              <span className="site__status-dot" />
              {status}
            </span>

            {/* User avatar + dropdown */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={onUserMenuToggle}
                title={userEmail ?? "Account"}
                style={{
                  width: "34px", height: "34px", borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(229,184,77,0.85), rgba(200,155,50,0.7))",
                  border: "2px solid rgba(229,184,77,0.4)",
                  color: "#0a0800", fontWeight: 700, fontSize: "0.85rem",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 10px rgba(229,184,77,0.25)",
                  transition: "box-shadow 0.15s, transform 0.1s", flexShrink: 0,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.06)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
              >
                {userEmail ? userEmail[0].toUpperCase() : "U"}
              </button>

              {showUserMenu && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 199 }} onClick={onUserMenuClose} />
                  <div style={{
                    position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 200,
                    background: "#111218", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px", padding: "8px", minWidth: "200px",
                    boxShadow: "0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
                  }}>
                    <div style={{ padding: "8px 10px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: "6px" }}>
                      <p style={{ margin: "0 0 2px", fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Signed in as</p>
                      <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(255,255,255,0.75)", fontWeight: 500, wordBreak: "break-all" }}>{userEmail ?? "—"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={onGoToSettings}
                      style={{
                        width: "100%", padding: "8px 10px", borderRadius: "8px",
                        background: "transparent", border: "none", color: "rgba(255,255,255,0.65)",
                        fontSize: "0.84rem", textAlign: "left", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: "8px",
                        transition: "background 0.12s, color 0.12s", fontFamily: "inherit",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.65)"; }}
                    >
                      <span style={{ fontSize: "1rem" }}>⚙️</span> Settings
                    </button>
                    <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "6px 0" }} />
                    <button
                      type="button"
                      onClick={onSignOut}
                      style={{
                        width: "100%", padding: "8px 10px", borderRadius: "8px",
                        background: "transparent", border: "none", color: "rgba(248,113,113,0.8)",
                        fontSize: "0.84rem", textAlign: "left", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: "8px",
                        transition: "background 0.12s, color 0.12s", fontFamily: "inherit",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "#f87171"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(248,113,113,0.8)"; }}
                    >
                      <span style={{ fontSize: "1rem" }}>→</span> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Metric strip – today's data, never changes with date picker */}
      <div style={{ width: "min(1200px, calc(100% - 32px))", margin: "0 auto", paddingTop: "16px" }}>
        <div className="metric-strip">
          <Metric
            label={t("metric_today", lang)}
            value={formatDateLabel(todayDate.current)}
            hint={new Date().toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { weekday: "long" })}
            tone="high"
          />
          <Metric
            label={t("metric_nakshatra", lang)}
            value={chartSummary ? chartSummary.janmaNakshatra : "—"}
            hint={chartSummary
              ? `${t("metric_pada", lang)} ${chartSummary.janmaPada} · ${chartSummary.moonRasi} ${t("metric_janma_rasi", lang)}`
              : t("hint_no_profile", lang)}
            tone="mid"
          />
          <Metric
            label={t("metric_dasha", lang)}
            value={dasha ? `${tPlanetLord(dasha.current.mahadasha.lord, lang)} ${t("dasha_word", lang)}` : todayGuidance ? `${todayGuidance.score}/100` : "—"}
            hint={dasha ? `${tPlanetLord(dasha.current.antardasha.lord, lang)} ${t("bhukti_word", lang)}` : headerScoreBand?.label ?? ""}
            tone={headerScoreBand?.tone === "high" ? "high" : headerScoreBand?.tone === "low" ? "low" : "mid"}
          />
          <Metric
            label={t("metric_family_score", lang)}
            value={familyAggregate ? `${familyAggregate.familyScore}/100` : selectedVault ? selectedVault.name : "—"}
            hint={familyAggregate
              ? familyAggregate.familyLabel
              : selectedVaultId
                ? `${selectedVault?.memberCount ?? 0} ${t("metric_members", lang)}`
                : t("metric_vault_select", lang)}
            tone={familyAggregate
              ? (getScoreBand(familyAggregate.familyScore).tone === "high" ? "high" : getScoreBand(familyAggregate.familyScore).tone === "low" ? "low" : "mid")
              : "rest"}
          />
        </div>
      </div>

      {/* Tab bar */}
      <div className="site__nav-wrap" style={{ marginTop: "16px" }}>
        <nav className="site__nav">
          {TAB_IDS.map((tab) => {
            const tabLabel = tab.id === "personal" ? t("tab_personal", lang)
              : tab.id === "life-areas" ? t("tab_life_areas", lang)
              : tab.id === "family" ? t("tab_family", lang)
              : tab.id === "calendar" ? t("tab_calendar", lang)
              : tab.id === "qa" ? t("tab_qa", lang)
              : t("tab_settings", lang);
            return (
              <button
                key={tab.id}
                className={`site__tab${activeTab === tab.id ? " site__tab--active" : ""}`}
                type="button"
                onClick={() => onTabChange(tab.id)}
              >
                <span>{tab.emoji}</span>{tabLabel}
              </button>
            );
          })}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              className="input input--compact"
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              style={{ padding: "0.3rem 0.7rem", fontSize: "0.82rem" }}
            />
          </div>
        </nav>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
          zIndex: 100, padding: "12px 24px", borderRadius: "10px", fontSize: "0.9rem",
          fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          background: toast.tone === "success" ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)",
          border: `1px solid ${toast.tone === "success" ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)"}`,
          color: toast.tone === "success" ? "#4ade80" : "#f87171", pointerEvents: "none",
        }}>
          {toast.tone === "success" ? "✔ " : "✕ "}{toast.message}
        </div>
      )}
    </>
  );
}
