"use client";

import React, { useState } from "react";
import { apiFetchJson, readErrorMessage, toQuery } from "@/lib/api";
import { t, tLang, tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ApiEnvelope, RetrospectiveData, RetrospectiveListData } from "@/lib/types";

const EVENT_TYPES = [
  "career", "health", "relationship", "finance", "family", "travel", "spiritual", "other",
] as const;
type EventType = typeof EVENT_TYPES[number];

type Props = {
  lang: Lang;
  chartId: string;
};

const W = {
  ink: "#1A1612",
  inkMid: "#3D352B",
  muted: "#7A6F5E",
  mutedLt: "var(--color-faint)",
  border: "#D4C8AE",
  borderLt: "#E4DBC8",
  surface: "#FAF5EA",
  surfaceMd: "#F4EEE2",
  card: "#FFFFFF",
  terracotta: "#B85A2C",
  rust: "#A8482F",
  sage: "#5C7654",
} as const;

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "var(--space-2) var(--space-2_5)",
  borderRadius: "var(--radius-md)",
  background: W.card,
  border: `1.5px solid ${W.borderLt}`,
  color: W.inkMid,
  fontSize: "0.875rem",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

function intensityLabel(intensity: string, lang: Lang): string {
  if (intensity === "similar") return t("retro_intensity_similar", lang);
  if (intensity === "milder") return t("retro_intensity_milder", lang);
  return t("retro_intensity_stronger", lang);
}

function intensityColor(intensity: string): string {
  if (intensity === "stronger") return W.rust;
  if (intensity === "similar") return W.terracotta;
  return W.sage;
}

export function RetrospectivePanel({ lang, chartId }: Props) {
  const [eventDate, setEventDate] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventType, setEventType] = useState<EventType>("career");
  const [result, setResult] = useState<RetrospectiveData | null>(null);
  const [history, setHistory] = useState<RetrospectiveData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  async function analyse() {
    if (!chartId || !eventDate || !eventDesc.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const r = await apiFetchJson<ApiEnvelope<RetrospectiveData>>("/api/v1/retrospective", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chartId,
          eventDate,
          eventDescription: eventDesc.trim(),
          eventType,
        }),
      });
      setResult(r.data);
      setHistory((prev) => [r.data, ...prev.slice(0, 4)]);
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    if (!chartId) return;
    try {
      const r = await apiFetchJson<ApiEnvelope<RetrospectiveListData>>(
        `/api/v1/retrospective${toQuery({ chartId })}`
      );
      setHistory(r.data.items);
      setShowHistory(true);
    } catch {
      // ignore
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div>
        <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700, color: W.mutedLt, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {t("retro_panel_title", lang)}
        </p>
        <p style={{ margin: 0, fontSize: "0.875rem", color: W.muted }}>
          {t("retro_panel_desc", lang)}
        </p>
      </div>

      {/* Input form */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2_5)", padding: "var(--space-3_5) var(--space-4)", borderRadius: "var(--radius-md)", background: W.card, border: `1px solid ${W.borderLt}` }}>
        <div style={{ display: "flex", gap: "var(--space-2_5)", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "160px" }}>
            <label style={{ display: "block", fontSize: "0.625rem", fontWeight: 700, color: W.mutedLt, marginBottom: "var(--space-1)", textTransform: "uppercase" }}>
              {t("retro_event_date", lang)} *
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              style={fieldStyle}
            />
          </div>
          <div style={{ flex: 1, minWidth: "140px" }}>
            <label style={{ display: "block", fontSize: "0.625rem", fontWeight: 700, color: W.mutedLt, marginBottom: "var(--space-1)", textTransform: "uppercase" }}>
              {t("retro_event_type", lang)}
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
              style={fieldStyle}
            >
              {EVENT_TYPES.map((et) => (
                <option key={et} value={et}>
                  {t(`retro_event_${et}` as any, lang)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.625rem", fontWeight: 700, color: W.mutedLt, marginBottom: "var(--space-1)", textTransform: "uppercase" }}>
            {t("retro_event_desc", lang)}
          </label>
          <textarea
            value={eventDesc}
            onChange={(e) => setEventDesc(e.target.value)}
            rows={2}
            placeholder={lang === "ta" ? "உதாரணம்: வேலை கிடைத்தது, திருமணம்…" : "e.g. Got a job offer, had an accident…"}
            style={{ ...fieldStyle, resize: "vertical" }}
          />
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <button
            type="button"
            onClick={() => void analyse()}
            disabled={loading || !chartId || !eventDate || !eventDesc.trim()}
            style={{
              padding: "var(--space-2) var(--space-4_5)", borderRadius: "var(--radius-sm)", cursor: "pointer",
              fontSize: "0.875rem", fontWeight: 700,
              background: loading || !chartId || !eventDate || !eventDesc.trim() ? W.surfaceMd : "#F8E4D2",
              border: `1px solid ${W.terracotta}55`,
              color: loading || !chartId || !eventDate || !eventDesc.trim() ? W.mutedLt : W.terracotta,
            }}
          >
            {loading ? t("retro_analysing", lang) : t("retro_analyse", lang)}
          </button>
          <button
            type="button"
            onClick={() => void loadHistory()}
            style={{ padding: "var(--space-2) var(--space-3_5)", borderRadius: "var(--radius-sm)", border: `1px solid ${W.border}`, cursor: "pointer", fontSize: "0.75rem", background: W.card, color: W.muted }}
          >
            {lang === "ta" ? "வரலாறு" : "History"}
          </button>
        </div>
        {error && <p style={{ margin: 0, fontSize: "0.75rem", color: W.rust }}>{error}</p>}
      </div>

      {/* Result */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {/* Active dasha */}
          <div style={{ display: "flex", gap: "var(--space-2_5)", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.625rem", fontWeight: 700, color: W.mutedLt, textTransform: "uppercase" }}>
              {t("retro_active_dasha", lang)}:
            </span>
            <span style={{ fontSize: "0.875rem", color: W.terracotta, fontWeight: 700 }}>{result.activeDasha}</span>
            <span style={{ fontSize: "0.625rem", color: W.mutedLt }}>{result.eventDate}</span>
          </div>

          {/* Correlation explanation */}
          <div style={{ padding: "var(--space-3) var(--space-3_5)", borderRadius: "var(--radius-sm)", background: W.surface, border: `1px solid ${W.border}` }}>
            <p style={{ margin: "0 0 var(--space-1_5)", fontSize: "0.625rem", fontWeight: 700, color: W.terracotta, textTransform: "uppercase" }}>
              {t("retro_correlation", lang)}
            </p>
            <p style={{ margin: 0, fontSize: "0.875rem", color: W.inkMid, lineHeight: 1.5 }}>
              {tLang(result.correlationExplanation, lang)}
            </p>
          </div>

          {/* Key transits */}
          {result.keyTransits.length > 0 && (
            <div>
              <p style={{ margin: "0 0 var(--space-1_5)", fontSize: "0.625rem", fontWeight: 700, color: W.mutedLt, textTransform: "uppercase" }}>
                {t("retro_key_transits", lang)}
              </p>
              <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
                {result.keyTransits.map((kt, i) => (
                  <span key={i} style={{ fontSize: "0.75rem", padding: "var(--space-0_75) var(--space-2_5)", borderRadius: "var(--radius-pill)", background: W.surface, border: `1px solid ${W.border}`, color: W.muted }}>
                    {tPlanetLord(kt.planet, lang)} H{kt.houseFromMoon}L{kt.houseFromLagna}
                    {kt.notableAspect && <span style={{ color: W.terracotta, marginLeft: "var(--space-1)" }}>{kt.notableAspect}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Future recurrences */}
          {result.futureRecurrences.length > 0 && (
          <div style={{ padding: "var(--space-3) var(--space-3_5)", borderRadius: "var(--radius-sm)", background: "#FFF7EB", border: `1px solid ${W.border}` }}>
              <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.625rem", fontWeight: 700, color: W.terracotta, textTransform: "uppercase" }}>
                {t("retro_future_recurrence", lang)}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {result.futureRecurrences.map((fr, i) => (
                  <div key={i} style={{ display: "flex", gap: "var(--space-2_5)", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "0.625rem", fontWeight: 700, color: intensityColor(fr.intensity), minWidth: "60px", paddingTop: "var(--space-0_5)" }}>
                      {intensityLabel(fr.intensity, lang)}
                    </span>
                    <div>
                      <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "0.75rem", color: W.inkMid }}>{fr.approximateDate}</p>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: W.muted, lineHeight: 1.4 }}>{fr.signatureDescription}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Caution */}
          {result.caution && (
          <div style={{ padding: "var(--space-2_5) var(--space-3_5)", borderRadius: "var(--radius-sm)", background: "#FCE7E2", border: `1px solid ${W.rust}44` }}>
              <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700, color: W.rust, textTransform: "uppercase" }}>
                âš  {t("retro_caution", lang)}
              </p>
              <p style={{ margin: 0, fontSize: "0.75rem", color: W.rust, lineHeight: 1.5 }}>
                {tLang(result.caution, lang)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* History list */}
      {showHistory && history.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700, color: W.mutedLt, textTransform: "uppercase" }}>
            {lang === "ta" ? "முந்தைய ஆய்வுகள்" : "Past analyses"}
          </p>
          {history.map((h) => (
            <button
              key={h.retrospectiveId}
              type="button"
              onClick={() => setResult(h)}
              style={{
                padding: "var(--space-2_5) var(--space-3_5)", borderRadius: "var(--radius-sm)", textAlign: "left", cursor: "pointer",
                background: result?.retrospectiveId === h.retrospectiveId ? "#F8E4D2" : W.card,
                border: result?.retrospectiveId === h.retrospectiveId ? `1px solid ${W.terracotta}55` : `1px solid ${W.borderLt}`,
              }}
            >
              <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "0.75rem", fontWeight: 600, color: W.inkMid }}>
                {h.eventDate} - {h.eventType}
              </p>
              <p style={{ margin: 0, fontSize: "0.75rem", color: W.muted }}>{h.eventDescription.slice(0, 80)}{h.eventDescription.length > 80 ? "..." : ""}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

