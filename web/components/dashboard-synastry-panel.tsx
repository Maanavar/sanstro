"use client";

import React, { useState } from "react";
import { apiFetchJson, readErrorMessage, toQuery } from "@/lib/api";
import { t, tLang } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  ApiEnvelope,
  SynastryData,
  RelationshipAlertItem,
} from "@/lib/types";

type MemberOption = { memberId: string; displayName: string };

type Props = {
  lang: Lang;
  chartId: string;
  familyVaultId: string;
  memberOptions: MemberOption[];
  relationshipAlerts: RelationshipAlertItem[];
  alertsLoading: boolean;
};

function toneColor(tone: string): string {
  if (tone === "supportive") return "#4ade80";
  if (tone === "challenging") return "#f87171";
  return "#fbbf24";
}

function toneLabel(tone: string, lang: Lang): string {
  if (tone === "supportive") return t("synastry_aspect_supportive", lang);
  if (tone === "challenging") return t("synastry_aspect_challenging", lang);
  return t("synastry_aspect_neutral", lang);
}

function scoreColor(score: number): string {
  if (score >= 70) return "#4ade80";
  if (score >= 40) return "#fbbf24";
  return "#f87171";
}

export function SynastryPanel({
  lang,
  chartId,
  familyVaultId,
  memberOptions,
  relationshipAlerts,
  alertsLoading,
}: Props) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [synastry, setSynastry] = useState<SynastryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [subTab, setSubTab] = useState<"compatibility" | "alerts">("compatibility");

  async function loadSynastry(memberId: string) {
    if (!memberId || !chartId) return;
    setSelectedMemberId(memberId);
    setSynastry(null);
    setError("");
    setLoading(true);
    try {
      const r = await apiFetchJson<ApiEnvelope<SynastryData>>(
        `/api/v1/relationships/${memberId}/synastry${toQuery({ ownerChartId: chartId })}`
      );
      setSynastry(r.data);
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const SUB_TABS = [
    { key: "compatibility" as const, label: t("synastry_panel_title", lang) },
    { key: "alerts" as const, label: t("rel_alerts_title", lang) },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <p style={{ margin: "0 0 4px", fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {t("synastry_panel_title", lang)}
        </p>
        <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>
          {t("synastry_panel_desc", lang)}
        </p>
      </div>

      {/* Sub-tab switcher */}
      <div style={{ display: "flex", gap: "6px" }}>
        {SUB_TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setSubTab(key)}
            style={{
              padding: "6px 14px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
              border: subTab === key ? "1px solid rgba(255,255,255,0.35)" : "1px solid rgba(255,255,255,0.1)",
              background: subTab === key ? "rgba(255,255,255,0.1)" : "transparent",
              color: subTab === key ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Compatibility sub-tab ── */}
      {subTab === "compatibility" && (
        <>
          {memberOptions.length === 0 ? (
            <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>
              {t("synastry_no_vault", lang)}
            </p>
          ) : (
            <>
              {/* Member selector */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {memberOptions.map((m) => (
                  <button
                    key={m.memberId}
                    type="button"
                    onClick={() => void loadSynastry(m.memberId)}
                    style={{
                      padding: "6px 14px", borderRadius: "20px", fontSize: "0.78rem", cursor: "pointer",
                      fontWeight: selectedMemberId === m.memberId ? 700 : 400,
                      background: selectedMemberId === m.memberId ? "rgba(147,197,253,0.2)" : "rgba(255,255,255,0.06)",
                      border: selectedMemberId === m.memberId ? "1px solid rgba(147,197,253,0.45)" : "1px solid rgba(255,255,255,0.1)",
                      color: selectedMemberId === m.memberId ? "#93c5fd" : "rgba(255,255,255,0.55)",
                    }}
                  >
                    {m.displayName}
                  </button>
                ))}
              </div>

              {!selectedMemberId && (
                <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255,255,255,0.35)" }}>
                  {t("synastry_select_member", lang)}
                </p>
              )}

              {loading && (
                <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>
                  {t("synastry_loading", lang)}
                </p>
              )}

              {error && (
                <p style={{ margin: 0, fontSize: "0.78rem", color: "#f87171" }}>{error}</p>
              )}

              {synastry && !loading && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {/* Score header */}
                  <div style={{
                    padding: "16px 20px", borderRadius: "12px",
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap",
                  }}>
                    <div>
                      <p style={{ margin: "0 0 4px", fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {t("synastry_score", lang)}
                      </p>
                      <p style={{ margin: 0, fontSize: "2.2rem", fontWeight: 900, lineHeight: 1, color: scoreColor(synastry.compatibilityScore) }}>
                        {synastry.compatibilityScore}
                        <span style={{ fontSize: "1rem", fontWeight: 400, color: "rgba(255,255,255,0.35)" }}>/100</span>
                      </p>
                      <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "rgba(255,255,255,0.55)" }}>
                        {synastry.compatibilityLabel}
                      </p>
                    </div>
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <p style={{ margin: "0 0 6px", fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
                        {t("synastry_summary", lang)}
                      </p>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
                        {tLang(synastry.summary, lang)}
                      </p>
                    </div>
                  </div>

                  {/* Caution */}
                  {synastry.caution && (
                    <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)" }}>
                      <p style={{ margin: "0 0 4px", fontSize: "0.65rem", fontWeight: 700, color: "#f87171", textTransform: "uppercase" }}>
                        ⚠ {t("synastry_caution", lang)}
                      </p>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "#fca5a5", lineHeight: 1.5 }}>
                        {tLang(synastry.caution, lang)}
                      </p>
                    </div>
                  )}

                  {/* Aspects */}
                  {synastry.aspects.length > 0 && (
                    <div>
                      <p style={{ margin: "0 0 8px", fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {t("synastry_aspects", lang)}
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {synastry.aspects.map((a, i) => {
                          const tc = toneColor(a.tone);
                          return (
                            <div key={i} style={{
                              display: "flex", gap: "10px", alignItems: "flex-start",
                              padding: "8px 12px", borderRadius: "8px",
                              background: "rgba(255,255,255,0.03)", border: `1px solid ${tc}22`,
                            }}>
                              <span style={{
                                fontSize: "0.58rem", fontWeight: 700, color: tc,
                                border: `1px solid ${tc}`, borderRadius: "3px",
                                padding: "1px 5px", whiteSpace: "nowrap", marginTop: "2px", flexShrink: 0,
                              }}>
                                {toneLabel(a.tone, lang)}
                              </span>
                              <div style={{ flex: 1 }}>
                                <p style={{ margin: "0 0 2px", fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.65)" }}>
                                  {a.planet1} — {a.aspectType} — {a.planet2}
                                  <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.35)", marginLeft: "6px" }}>
                                    {a.orb.toFixed(1)}°
                                  </span>
                                </p>
                                <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>
                                  {lang === "ta" ? a.descriptionTa : a.descriptionEn}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Timing indicators */}
                  {synastry.timingIndicators.length > 0 && (
                    <div style={{ padding: "12px 14px", borderRadius: "8px", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)" }}>
                      <p style={{ margin: "0 0 8px", fontSize: "0.68rem", fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {t("synastry_timing", lang)}
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        {synastry.timingIndicators.map((ti, i) => (
                          <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#fbbf24", minWidth: "52px", paddingTop: "2px" }}>
                              {ti.planet}
                            </span>
                            <p style={{ margin: 0, fontSize: "0.74rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>
                              {tLang(ti.description, lang)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Relationship alerts sub-tab ── */}
      {subTab === "alerts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {alertsLoading ? (
            <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>
              {t("rel_alerts_loading", lang)}
            </p>
          ) : relationshipAlerts.length === 0 ? (
            <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>
              {t("rel_alerts_empty", lang)}
            </p>
          ) : (
            relationshipAlerts.map((alert) => {
              const dayLabel =
                alert.daysFromToday === 0
                  ? t("alert_today", lang)
                  : alert.daysFromToday === 1
                  ? t("alert_tomorrow", lang)
                  : `${alert.daysFromToday} ${t("alert_days_away", lang)}`;
              return (
                <div key={alert.alertId} style={{
                  padding: "12px 14px", borderRadius: "10px",
                  background: "rgba(147,197,253,0.06)", border: "1px solid rgba(147,197,253,0.2)",
                }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "4px" }}>
                    <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#93c5fd" }}>
                      {alert.memberName}
                    </span>
                    <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>
                      {tLang(alert.title, lang)}
                    </span>
                    <span style={{ fontSize: "0.62rem", padding: "1px 6px", borderRadius: "999px", background: "rgba(147,197,253,0.12)", border: "1px solid rgba(147,197,253,0.3)", color: "#93c5fd" }}>
                      {dayLabel}
                    </span>
                    <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.28)" }}>
                      sig: {alert.significanceScore}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.74rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>
                    {tLang(alert.message, lang)}
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
