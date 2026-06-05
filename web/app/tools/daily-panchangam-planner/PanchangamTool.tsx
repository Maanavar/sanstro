"use client";

import { useState, useEffect } from "react";
import { readErrorMessage } from "@/lib/api";
import { useLang } from "@/components/lang-toggle";
import type { PanchangamDailyResponseData } from "@/lib/types";

const CITIES = [
  { name: "Chennai",    nameTa: "சென்னை",    lat: 13.0827, lng: 80.2707, tz: "Asia/Kolkata" },
  { name: "Coimbatore", nameTa: "கோயம்புத்தூர்", lat: 11.0168, lng: 76.9558, tz: "Asia/Kolkata" },
  { name: "Madurai",    nameTa: "மதுரை",     lat: 9.9252,  lng: 78.1198, tz: "Asia/Kolkata" },
  { name: "Trichy",     nameTa: "திருச்சி",   lat: 10.7905, lng: 78.7047, tz: "Asia/Kolkata" },
  { name: "Salem",      nameTa: "சேலம்",     lat: 11.6643, lng: 78.146,  tz: "Asia/Kolkata" },
  { name: "Bengaluru",  nameTa: "பெங்களூரு", lat: 12.9716, lng: 77.5946, tz: "Asia/Kolkata" },
  { name: "Mumbai",     nameTa: "மும்பை",    lat: 19.076,  lng: 72.8777, tz: "Asia/Kolkata" },
  { name: "Singapore",  nameTa: "சிங்கப்பூர்", lat: 1.3521, lng: 103.8198, tz: "Asia/Singapore" },
];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const inputStyle: React.CSSProperties = {
  width: "100%", border: "1.5px solid var(--cl-border)", borderRadius: "8px",
  padding: "9px 12px", background: "var(--cl-bg)", color: "var(--cl-ink)",
  fontSize: "0.88rem", fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const,
};
const labelStyle: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: "5px",
  fontSize: "0.78rem", fontWeight: 600, color: "var(--cl-ink-2)",
};

function TimeSlot({ label, start, end, tone }: { label: string; start: string; end: string; tone: "best" | "hold" | "neutral" }) {
  const colors = {
    best: { bg: "rgba(92,118,84,0.08)", border: "rgba(92,118,84,0.3)", text: "#5C7654" },
    hold: { bg: "rgba(168,72,47,0.08)", border: "rgba(168,72,47,0.3)", text: "#A8482F" },
    neutral: { bg: "var(--cl-bg-2)", border: "var(--cl-border)", text: "var(--cl-muted)" },
  }[tone];

  return (
    <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "10px 14px" }}>
      <p style={{ margin: "0 0 3px", fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: colors.text }}>{label}</p>
      <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600, color: colors.text, fontFamily: "monospace" }}>
        {start} – {end}
      </p>
    </div>
  );
}

export function PanchangamTool() {
  const [lang] = useLang();
  const en = lang === "en";

  const [date, setDate] = useState(today());
  const [lat, setLat] = useState("13.0827");
  const [lng, setLng] = useState("80.2707");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [cityKey, setCityKey] = useState("Chennai");
  const [data, setData] = useState<PanchangamDailyResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function selectCity(city: typeof CITIES[0]) {
    setLat(String(city.lat));
    setLng(String(city.lng));
    setTimezone(city.tz);
    setCityKey(city.name);
  }

  const currentCityDisplay = (() => {
    const c = CITIES.find((c) => c.name === cityKey);
    if (!c) return en ? "Custom" : "தனிப்பயன்";
    return en ? c.name : c.nameTa;
  })();

  async function fetchPanchangam() {
    setError("");
    setLoading(true);
    setData(null);
    try {
      const params = new URLSearchParams({ date, lat, lng, timezone });
      const res = await fetch(`/api/backend/api/v1/public/panchangam?${params.toString()}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(j.detail ?? `Error ${res.status}`);
      }
      const json = await res.json() as { success: boolean; data: PanchangamDailyResponseData };
      setData(json.data);
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchPanchangam();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tithiLabel = data
    ? `${data.tithi.name} (${data.tithi.paksha === "SHUKLA"
        ? (en ? "Valar Pirai" : "வளர் பிறை")
        : (en ? "Thei Pirai" : "தேய் பிறை")})`
    : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Controls */}
      <div style={{
        background: "var(--cl-surface)", border: "1px solid var(--cl-border)",
        borderRadius: "16px", padding: "20px 24px",
        display: "flex", flexDirection: "column", gap: "16px",
      }}>
        {/* City quick picks */}
        <div>
          <p style={{ margin: "0 0 8px", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--cl-muted)" }}>
            {en ? "Location" : "இடம்"}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {CITIES.map((city) => (
              <button
                key={city.name}
                type="button"
                onClick={() => selectCity(city)}
                style={{
                  padding: "5px 14px", borderRadius: "999px", fontSize: "0.82rem", fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                  border: cityKey === city.name ? "1.5px solid var(--cl-accent)" : "1.5px solid var(--cl-border)",
                  background: cityKey === city.name ? "rgba(184,90,44,0.08)" : "var(--cl-surface)",
                  color: cityKey === city.name ? "#B85A2C" : "var(--cl-ink-2)",
                }}
              >
                {en ? city.name : city.nameTa}
              </button>
            ))}
          </div>
        </div>

        {/* Date and manual coords */}
        <div className="cl-mobile-form-grid-3" style={{ gap: "12px" }}>
          <label style={labelStyle}>
            {en ? "Date" : "தேதி"}
            <input style={inputStyle} type="date" value={date}
              onChange={(e) => setDate(e.target.value)} />
          </label>
          <label style={labelStyle}>
            {en ? "Latitude" : "அட்சாம்சம்"}
            <input style={inputStyle} inputMode="decimal" value={lat}
              onChange={(e) => { setLat(e.target.value); setCityKey("Custom"); }} />
          </label>
          <label style={labelStyle}>
            {en ? "Longitude" : "தீர்க்காம்சம்"}
            <input style={inputStyle} inputMode="decimal" value={lng}
              onChange={(e) => { setLng(e.target.value); setCityKey("Custom"); }} />
          </label>
        </div>

        {error && (
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#A8482F", background: "rgba(168,72,47,0.08)", border: "1px solid rgba(168,72,47,0.25)", borderRadius: "8px", padding: "10px 14px" }}>
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => void fetchPanchangam()}
          disabled={loading}
          style={{
            alignSelf: "flex-start", padding: "9px 24px",
            background: loading ? "var(--cl-border)" : "var(--cl-ink)",
            color: "var(--cl-bg)", border: "none", borderRadius: "999px",
            fontFamily: "inherit", fontSize: "0.88rem", fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading
            ? (en ? "Loading…" : "ஏற்றுகிறது…")
            : (en ? "Get Panchangam" : "பஞ்சாங்கம் பெறு")}
        </button>
      </div>

      {/* Results */}
      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Five elements */}
          <div style={{
            background: "var(--cl-surface)", border: "1px solid var(--cl-border)",
            borderRadius: "16px", padding: "22px 24px",
          }}>
            <p style={{ margin: "0 0 16px", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--cl-muted)" }}>
              {en ? "Panchangam" : "பஞ்சாங்கம்"} · {data.dateLocal} · {currentCityDisplay}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
              {[
                { label: en ? "Tithi" : "திதி",         value: tithiLabel,          sub: `${en ? "Ends" : "முடிவு"} ${data.tithi.endsAt}` },
                { label: en ? "Vara" : "வாரம்",          value: data.vara.weekday,   sub: `${en ? "Lord" : "அதிபதி"}: ${data.vara.lord}` },
                { label: en ? "Nakshatra" : "நட்சத்திரம்", value: data.nakshatra.name, sub: `${en ? "Pada" : "பாதம்"} ${data.nakshatra.pada} · ${en ? "Ends" : "முடிவு"} ${data.nakshatra.endsAt}` },
                { label: en ? "Yoga" : "யோகம்",          value: data.yoga.name,      sub: `${en ? "Yoga" : "யோகம்"} ${data.yoga.number}` },
                { label: en ? "Karana" : "கரணம்",        value: data.karana.name,    sub: "" },
              ].map((item) => (
                <div key={item.label} style={{
                  background: "var(--cl-bg-2)", border: "1px solid var(--cl-border)",
                  borderRadius: "10px", padding: "12px 14px",
                }}>
                  <p style={{ margin: "0 0 4px", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--cl-muted)" }}>
                    {item.label}
                  </p>
                  <p style={{ margin: "0 0 2px", fontSize: "0.95rem", fontWeight: 700, color: "var(--cl-ink)" }}>
                    {item.value}
                  </p>
                  {item.sub && (
                    <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--cl-muted)" }}>{item.sub}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sunrise/sunset */}
          <div className="cl-mobile-card-split" style={{
            background: "var(--cl-surface)", border: "1px solid var(--cl-border)",
            borderRadius: "14px", padding: "18px 22px",
          }}>
            {[
              { label: en ? "Sunrise" : "சூரிய உதயம்",  value: data.sunrise },
              { label: en ? "Sunset" : "சூரிய அஸ்தமனம்", value: data.sunset },
              { label: en ? "Solar Noon" : "மத்தியான்னம்", value: data.solarNoon },
            ].map((item) => (
              <div key={item.label}>
                <p style={{ margin: "0 0 2px", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--cl-muted)" }}>
                  {item.label}
                </p>
                <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--cl-ink)", fontFamily: "monospace" }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Timing windows */}
          <div style={{
            background: "var(--cl-surface)", border: "1px solid var(--cl-border)",
            borderRadius: "14px", padding: "18px 22px",
          }}>
            <p style={{ margin: "0 0 14px", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--cl-muted)" }}>
              {en ? "Timing Windows" : "நேர சாளரங்கள்"}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
              {data.kalam.nallaNeram.length > 0 && (
                <TimeSlot label={en ? "Nalla Neram" : "நல்ல நேரம்"} start={data.kalam.nallaNeram[0].start} end={data.kalam.nallaNeram[data.kalam.nallaNeram.length - 1].end} tone="best" />
              )}
              {data.kalam.gowriNallaNeram.length > 0 && (
                <TimeSlot label={en ? "Gowri Nalla Neram" : "கௌரி நல்ல நேரம்"} start={data.kalam.gowriNallaNeram[0].start} end={data.kalam.gowriNallaNeram[data.kalam.gowriNallaNeram.length - 1].end} tone="best" />
              )}
              {!data.abhijit.isRestrictedByWeekday && (
                <TimeSlot label={en ? "Abhijit Muhurta" : "அபிஜித் முகூர்த்தம்"} start={data.abhijit.start} end={data.abhijit.end} tone="best" />
              )}
              <TimeSlot label={en ? "Rahu Kalam" : "ராகு காலம்"} start={data.kalam.rahuKalam.start} end={data.kalam.rahuKalam.end} tone="hold" />
              <TimeSlot label={en ? "Yamagandam" : "யமகண்டம்"} start={data.kalam.yamagandam.start} end={data.kalam.yamagandam.end} tone="hold" />
              <TimeSlot label={en ? "Kuligai" : "குளிகை"} start={data.kalam.kuligai.start} end={data.kalam.kuligai.end} tone="hold" />
            </div>
          </div>

          {/* Subha muhurtham status */}
          <div style={{
            background: data.subhaMuhurtham.isSubha ? "rgba(92,118,84,0.07)" : "rgba(168,72,47,0.05)",
            border: `1px solid ${data.subhaMuhurtham.isSubha ? "rgba(92,118,84,0.3)" : "rgba(168,72,47,0.2)"}`,
            borderRadius: "12px", padding: "14px 18px",
          }}>
            <p style={{ margin: "0 0 4px", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: data.subhaMuhurtham.isSubha ? "#5C7654" : "#A8482F" }}>
              {data.subhaMuhurtham.isSubha
                ? (en ? "Subha Muhurtham Day" : "சுப முகூர்த்த நாள்")
                : (en ? "Not a Subha Muhurtham Day" : "சுப முகூர்த்த நாள் அல்ல")}
            </p>
            <p style={{ margin: 0, fontSize: "0.86rem", color: "var(--cl-ink-2)" }}>{data.subhaMuhurtham.reason}</p>
          </div>

          {/* Festivals */}
          {data.festivals.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {data.festivals.map((f) => (
                <span key={f.name} style={{
                  fontSize: "0.82rem", fontWeight: 600, color: "var(--cl-ink-2)",
                  background: "var(--cl-surface)", border: "1px solid var(--cl-border)",
                  borderRadius: "999px", padding: "4px 14px",
                }}>
                  {f.name}
                </span>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="cl-mobile-card-split" style={{
            background: "rgba(184,90,44,0.05)", border: "1px solid rgba(184,90,44,0.2)",
            borderRadius: "14px", padding: "18px 22px",
          }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: "var(--cl-ink)", fontSize: "0.92rem" }}>
                {en ? "Get panchangam connected to your personal chart" : "உங்கள் ஜாதகத்துடன் இணைந்த பஞ்சாங்கம் பெறுங்கள்"}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--cl-muted)" }}>
                {en ? "Free account — daily guidance that combines your chart, dasha, and panchangam." : "இலவச கணக்கு — ஜாதகம், தசை, பஞ்சாங்கம் ஒன்றாக இணைந்த தினசரி வழிகாட்டுதல்."}
              </p>
            </div>
            <a href="/dashboard" className="cl-mobile-cta" style={{
              display: "inline-flex", alignItems: "center", padding: "9px 22px",
              background: "var(--cl-ink)", color: "var(--cl-bg)", borderRadius: "999px",
              fontWeight: 600, fontSize: "0.88rem", textDecoration: "none",
            }}>
              {en ? "Get started free →" : "இலவசமாக தொடங்கு →"}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
