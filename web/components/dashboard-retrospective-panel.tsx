"use client";

import React, { useState } from "react";
import { apiFetchJson, readErrorMessage, toQuery } from "@/lib/api";
import { t, tLang } from "@/lib/i18n";
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

function intensityLabel(intensity: string, lang: Lang): string {
  if (intensity === "similar") return t("retro_intensity_similar", lang);
  if (intensity === "milder") return t("retro_intensity_milder", lang);
  return t("retro_intensity_stronger", lang);
}

function intensityColor(intensity: string): string {
  if (intensity === "stronger") return "#f87171";
  if (intensity === "similar") return "#fbbf24";
  return "#4ade80";
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
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <p style={{ margin: "0 0 4px", fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {t("retro_panel_title", lang)}
        </p>
        <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>
          {t("retro_panel_desc", lang)}
        </p>
      </div>

      {/* Input form */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "14px 16px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "160px" }}>
            <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: "4px", textTransform: "uppercase" }}>
              {t("retro_event_date", lang)} *
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ flex: 1, minWidth: "140px" }}>
            <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: "4px", textTransform: "uppercase" }}>
              {t("retro_event_type", lang)}
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
              style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", background: "rgba(30,30,40,0.9)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }}
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
          <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: "4px", textTransform: "uppercase" }}>
            {t("retro_event_desc", lang)}
          </label>
          <textarea
            value={eventDesc}
            onChange={(e) => setEventDesc(e.target.value)}
            rows={2}
            placeholder={lang === "ta" ? "உதாரணம்: வேலை கிடைத்தது, திருமணம்…" : "e.g. Got a job offer, had an accident…"}
            style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "0.82rem", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
          />
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={() => void analyse()}
            disabled={loading || !chartId || !eventDate || !eventDesc.trim()}
            style={{
              padding: "8px 18px", borderRadius: "8px", border: "none", cursor: "pointer",
              fontSize: "0.8rem", fontWeight: 700,
              background: loading || !chartId || !eventDate || !eventDesc.trim() ? "rgba(255,255,255,0.08)" : "rgba(229,184,77,0.85)",
              color: loading || !chartId || !eventDate || !eventDesc.trim() ? "rgba(255,255,255,0.3)" : "#0a0800",
            }}
          >
            {loading ? t("retro_analysing", lang) : t("retro_analyse", lang)}
          </button>
          <button
            type="button"
            onClick={() => void loadHistory()}
            style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer", fontSize: "0.76rem", background: "transparent", color: "rgba(255,255,255,0.5)" }}
          >
            {lang === "ta" ? "வரலாறு" : "History"}
          </button>
        </div>
        {error && <p style={{ margin: 0, fontSize: "0.76rem", color: "#f87171" }}>{error}</p>}
      </div>

      {/* Result */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Active dasha */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
              {t("retro_active_dasha", lang)}:
            </span>
            <span style={{ fontSize: "0.78rem", color: "#e5b84d", fontWeight: 700 }}>{result.activeDasha}</span>
            <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)" }}>{result.eventDate}</span>
          </div>

          {/* Correlation explanation */}
          <div style={{ padding: "12px 14px", borderRadius: "8px", background: "rgba(139,92,246,0.07)", border: "1px solid rgba(167,139,250,0.22)" }}>
            <p style={{ margin: "0 0 6px", fontSize: "0.65rem", fontWeight: 700, color: "#a78bfa", textTransform: "uppercase" }}>
              {t("retro_correlation", lang)}
            </p>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
              {tLang(result.correlationExplanation, lang)}
            </p>
          </div>

          {/* Key transits */}
          {result.keyTransits.length > 0 && (
            <div>
              <p style={{ margin: "0 0 6px", fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
                {t("retro_key_transits", lang)}
              </p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {result.keyTransits.map((kt, i) => (
                  <span key={i} style={{ fontSize: "0.72rem", padding: "3px 10px", borderRadius: "999px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.65)" }}>
                    {kt.planet} H{kt.houseFromMoon}L{kt.houseFromLagna}
                    {kt.notableAspect && <span style={{ color: "#fbbf24", marginLeft: "4px" }}>{kt.notableAspect}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Future recurrences */}
          {result.futureRecurrences.length > 0 && (
            <div style={{ padding: "12px 14px", borderRadius: "8px", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.18)" }}>
              <p style={{ margin: "0 0 8px", fontSize: "0.65rem", fontWeight: 700, color: "#fbbf24", textTransform: "uppercase" }}>
                {t("retro_future_recurrence", lang)}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {result.futureRecurrences.map((fr, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, color: intensityColor(fr.intensity), minWidth: "60px", paddingTop: "2px" }}>
                      {intensityLabel(fr.intensity, lang)}
                    </span>
                    <div>
                      <p style={{ margin: "0 0 2px", fontSize: "0.74rem", color: "rgba(255,255,255,0.65)" }}>{fr.approximateDate}</p>
                      <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>{fr.signatureDescription}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Caution */}
          {result.caution && (
            <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.22)" }}>
              <p style={{ margin: "0 0 4px", fontSize: "0.65rem", fontWeight: 700, color: "#f87171", textTransform: "uppercase" }}>
                ⚠ {t("retro_caution", lang)}
              </p>
              <p style={{ margin: 0, fontSize: "0.76rem", color: "#fca5a5", lineHeight: 1.5 }}>
                {tLang(result.caution, lang)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* History list */}
      {showHistory && history.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <p style={{ margin: "0 0 4px", fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
            {lang === "ta" ? "முந்தைய ஆய்வுகள்" : "Past analyses"}
          </p>
          {history.map((h) => (
            <button
              key={h.retrospectiveId}
              type="button"
              onClick={() => setResult(h)}
              style={{
                padding: "10px 14px", borderRadius: "8px", textAlign: "left", cursor: "pointer",
                background: result?.retrospectiveId === h.retrospectiveId ? "rgba(229,184,77,0.1)" : "rgba(255,255,255,0.03)",
                border: result?.retrospectiveId === h.retrospectiveId ? "1px solid rgba(229,184,77,0.35)" : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p style={{ margin: "0 0 2px", fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
                {h.eventDate} — {h.eventType}
              </p>
              <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.45)" }}>{h.eventDescription.slice(0, 80)}{h.eventDescription.length > 80 ? "…" : ""}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
