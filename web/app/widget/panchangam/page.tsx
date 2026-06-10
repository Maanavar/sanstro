"use client";

import { useState, useEffect } from "react";
import { tNakshatra, tTithi, tWeekday, tKarana, tYoga, type Lang } from "@/lib/i18n";
import { formatClockLabel, formatDateLabel } from "@/lib/format";
import type { PanchangamDailyResponseData } from "@/lib/types";

// Widgets are embedded in iframes — no nav, no footer, minimal chrome.

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function clockRange(start: string, end: string): string {
  return `${formatClockLabel(start)} – ${formatClockLabel(end)}`;
}

export default function PanchangamWidget() {
  const [data, setData] = useState<PanchangamDailyResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Read URL params (works after mount in the browser)
  const [params, setParams] = useState({ date: today(), lat: "13.0827", lng: "80.2707", tz: "Asia/Kolkata", lang: "en" as Lang });

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setParams({
      date: sp.get("date") ?? today(),
      lat: sp.get("lat") ?? "13.0827",
      lng: sp.get("lng") ?? "80.2707",
      tz: sp.get("tz") ?? "Asia/Kolkata",
      lang: (sp.get("lang") === "ta" ? "ta" : "en") as Lang,
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    const qs = new URLSearchParams({ date: params.date, lat: params.lat, lng: params.lng, timezone: params.tz }).toString();
    fetch(`/api/backend/api/v1/public/panchangam?${qs}`)
      .then(r => r.json())
      .then((json: { success?: boolean; data?: PanchangamDailyResponseData }) => setData(json.data ?? null))
      .catch(() => setError("Could not load panchangam."))
      .finally(() => setLoading(false));
  }, [params.date, params.lat, params.lng, params.tz]);

  const en = params.lang === "en";

  const widgetStyle: React.CSSProperties = {
    fontFamily: "system-ui, -apple-system, sans-serif",
    background: "#0d1117",
    color: "#e6edf3",
    borderRadius: "12px",
    padding: "16px",
    maxWidth: "400px",
    margin: "0 auto",
    fontSize: "13px",
    lineHeight: 1.5,
  };

  if (loading) return (
    <div style={widgetStyle}>
      <p style={{ color: "#8b949e", textAlign: "center", margin: "20px 0" }}>
        {en ? "Loading panchangam…" : "பஞ்சாங்கம் ஏற்றுகிறது…"}
      </p>
    </div>
  );

  if (error || !data) return (
    <div style={widgetStyle}>
      <p style={{ color: "#f87171", textAlign: "center", margin: "20px 0" }}>
        {en ? "Could not load panchangam." : "பஞ்சாங்கம் ஏற்ற முடியவில்லை."}
      </p>
    </div>
  );

  const accent = "#818cf8";
  const muted = "#8b949e";

  return (
    <div style={widgetStyle}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div>
          <p style={{ margin: 0, fontSize: "11px", color: muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {en ? "Daily Panchangam" : "தினசரி பஞ்சாங்கம்"}
          </p>
          <p style={{ margin: "2px 0 0", fontWeight: 700, fontSize: "14px", color: "#e6edf3" }}>
            {formatDateLabel(data.dateLocal)}
          </p>
        </div>
        <a
          href={`https://vinaadi.com/panchangam/${data.dateLocal}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: "10px", color: accent, textDecoration: "none", marginTop: "4px" }}
        >
          vinaadi.com ↗
        </a>
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", marginBottom: "12px" }} />

      {/* Five elements */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
        {[
          { lbl: en ? "Tithi" : "திதி",       val: tTithi(data.tithi.name, params.lang) },
          { lbl: en ? "Vara" : "வாரம்",        val: tWeekday(data.vara.weekday, params.lang) },
          { lbl: en ? "Nakshatra" : "நட்சத்திரம்", val: tNakshatra(data.nakshatra.name, params.lang) },
          { lbl: en ? "Yoga" : "யோகம்",        val: tYoga(data.yoga.name, params.lang) },
          { lbl: en ? "Karana" : "கரணம்",      val: tKarana(data.karana.name, params.lang) },
          { lbl: en ? "Moon Phase" : "சந்திர கலை", val: data.moonPhaseLabel },
        ].map(item => (
          <div key={item.lbl} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "8px 10px" }}>
            <p style={{ margin: "0 0 2px", fontSize: "10px", color: muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.lbl}</p>
            <p style={{ margin: 0, fontWeight: 600, fontSize: "12px", color: "#e6edf3" }}>{item.val}</p>
          </div>
        ))}
      </div>

      {/* Timings */}
      <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "8px", overflow: "hidden" }}>
        {[
          { lbl: en ? "Rahu Kalam" : "ராகு காலம்", val: clockRange(data.kalam.rahuKalam.start, data.kalam.rahuKalam.end), color: "#f87171" },
          { lbl: en ? "Yamagandam" : "எமகண்டம்", val: clockRange(data.kalam.yamagandam.start, data.kalam.yamagandam.end), color: "#fbbf24" },
          ...(data.kalam.nallaNeram.slice(0, 2).map(s => ({
            lbl: en ? "Nalla Neram" : "நல்ல நேரம்",
            val: clockRange(s.start, s.end),
            color: "#4ade80",
          }))),
        ].map((item, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between",
            padding: "7px 10px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <span style={{ color: muted, fontSize: "12px" }}>{item.lbl}</span>
            <span style={{ color: item.color, fontWeight: 600, fontSize: "12px" }}>{item.val}</span>
          </div>
        ))}
      </div>

      {/* Sunrise row */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <span style={{ color: muted, fontSize: "11px" }}>
          {en ? "Sunrise" : "சூரிய உதயம்"} {formatClockLabel(data.sunrise)}
        </span>
        <span style={{ color: muted, fontSize: "11px" }}>
          {en ? "Sunset" : "சூரிய அஸ்தமனம்"} {formatClockLabel(data.sunset)}
        </span>
      </div>
    </div>
  );
}
