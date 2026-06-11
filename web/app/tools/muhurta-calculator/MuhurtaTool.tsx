"use client";

import { useState } from "react";
import { readErrorMessage } from "@/lib/api";
import { useLang } from "@/components/lang-toggle";
import { TN_CITIES, type CityEntry } from "@/lib/tn-cities";
import { romanNakshathiramName } from "@/lib/tamil-astro";
import Link from "next/link";

const EXTRA_CITIES: CityEntry[] = [
  { name: "Bengaluru, Karnataka, India", lat: "12.9716", lng: "77.5946", timezone: "Asia/Kolkata" },
  { name: "Mumbai, Maharashtra, India", lat: "19.0760", lng: "72.8777", timezone: "Asia/Kolkata" },
  { name: "Singapore", lat: "1.3521", lng: "103.8198", timezone: "Asia/Singapore" },
  { name: "Houston, Texas, USA", lat: "29.7604", lng: "-95.3698", timezone: "America/Chicago" },
];
const CITY_OPTIONS = [...TN_CITIES, ...EXTRA_CITIES];
const DEFAULT_CITY = CITY_OPTIONS.find((c) => c.name === "Chennai, Tamil Nadu, India") ?? CITY_OPTIONS[0];

const EVENT_TYPES = [
  { value: "MARRIAGE",   en: "Wedding / Marriage",       ta: "திருமணம்" },
  { value: "JOB_START",  en: "Job / Career Start",       ta: "வேலை / தொழில் தொடக்கம்" },
  { value: "INVESTMENT", en: "Business / Investment",    ta: "வியாபாரம் / முதலீடு" },
  { value: "PURCHASE",   en: "Purchase / Property",      ta: "வாங்குதல் / சொத்து" },
  { value: "TRAVEL",     en: "Travel",                   ta: "பயணம்" },
  { value: "EXAM",       en: "Exam / Education",         ta: "தேர்வு / கல்வி" },
  { value: "MEDICAL",    en: "Medical / Surgery",        ta: "மருத்துவம் / அறுவை சிகிச்சை" },
  { value: "SPIRITUAL",  en: "Spiritual / Puja",         ta: "ஆன்மிகம் / பூஜை" },
];

interface MuhurtaSlot {
  date: string;
  timeWindow: string;
  tithi: string;
  nakshatra: string;
  quality: "excellent" | "good" | "fair";
  reason: string;
  reasonTa: string;
  cautions: string[];
  cautionsTa: string[];
}

function todayStr(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDateDisplay(dateStr: string, lang: "en" | "ta"): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function compactCityName(name: string): string {
  return name
    .replace(", Tamil Nadu, India", "")
    .replace(", Karnataka, India", "")
    .replace(", Maharashtra, India", "")
    .replace(", Texas, USA", "");
}

const QUALITY_CONFIG = {
  excellent: {
    en: "Excellent",
    ta: "மிகவும் சிறந்தது",
    color: "var(--cl-accent, #4f7c3e)",
    bg: "rgba(79,124,62,0.08)",
  },
  good: {
    en: "Good",
    ta: "நல்லது",
    color: "#7a6a1a",
    bg: "rgba(200,180,40,0.10)",
  },
  fair: {
    en: "Fair",
    ta: "சாதாரணம்",
    color: "var(--cl-ink-2)",
    bg: "var(--cl-surface)",
  },
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid var(--cl-border)",
  borderRadius: "8px",
  padding: "9px 12px",
  background: "var(--cl-bg)",
  color: "var(--cl-ink)",
  fontSize: "0.88rem",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "5px",
  fontSize: "0.78rem",
  fontWeight: 600,
  color: "var(--cl-ink-2)",
};

export function MuhurtaTool() {
  const [lang] = useLang();
  const [eventType, setEventType] = useState("MARRIAGE");
  const [dateFrom, setDateFrom] = useState(todayStr());
  const [dateTo, setDateTo] = useState(addDaysStr(todayStr(), 14));
  const [city, setCity] = useState<CityEntry>(DEFAULT_CITY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<MuhurtaSlot[] | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSlots(null);
    try {
      const res = await fetch("/api/backend/api/v1/public/muhurta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: eventType,
          dateFrom: dateFrom,
          dateTo: dateTo,
          lat: parseFloat(city.lat),
          lng: parseFloat(city.lng),
          timezone: city.timezone,
        }),
      });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch {
      setError(lang === "en" ? "Network error — please try again." : "நெட்வொர்க் பிழை — மீண்டும் முயற்சிக்கவும்.");
    } finally {
      setLoading(false);
    }
  }

  const selectedEvent = EVENT_TYPES.find((e) => e.value === eventType) ?? EVENT_TYPES[0];
  const slotStarName = (value: string) => romanNakshathiramName(value);

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: "var(--cl-surface)",
          border: "1.5px solid var(--cl-border)",
          borderRadius: "12px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* Event type */}
        <label style={labelStyle}>
          {lang === "en" ? "Event type" : "நிகழ்வு வகை"}
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            style={inputStyle}
          >
            {EVENT_TYPES.map((et) => (
              <option key={et.value} value={et.value}>
                {lang === "en" ? et.en : et.ta}
              </option>
            ))}
          </select>
        </label>

        {/* Date range */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <label style={labelStyle}>
            {lang === "en" ? "From date" : "தொடக்க நாள்"}
            <input
              type="date"
              value={dateFrom}
              min={todayStr()}
              onChange={(e) => {
                setDateFrom(e.target.value);
                if (dateTo < e.target.value) setDateTo(addDaysStr(e.target.value, 7));
              }}
              style={inputStyle}
              required
            />
          </label>
          <label style={labelStyle}>
            {lang === "en" ? "To date (max 30 days)" : "இறுதி நாள் (அதிகபட்சம் 30 நாட்கள்)"}
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              max={addDaysStr(dateFrom, 30)}
              onChange={(e) => setDateTo(e.target.value)}
              style={inputStyle}
              required
            />
          </label>
        </div>

        {/* Location */}
        <label style={labelStyle}>
          {lang === "en" ? "Location" : "இடம்"}
          <select
            value={city.name}
            onChange={(e) => {
              const found = CITY_OPTIONS.find((c) => c.name === e.target.value);
              if (found) setCity(found);
            }}
            style={inputStyle}
          >
            {CITY_OPTIONS.map((c) => (
              <option key={c.name} value={c.name}>
                {compactCityName(c.name)}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? "var(--cl-border)" : "var(--cl-accent, #4f7c3e)",
            color: loading ? "var(--cl-ink-2)" : "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "11px 20px",
            fontSize: "0.9rem",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.15s",
          }}
        >
          {loading
            ? (lang === "en" ? "Finding auspicious slots…" : "சுப நேரங்கள் தேடுகிறோம்…")
            : (lang === "en" ? "Find auspicious muhurtham →" : "சுப முகூர்த்தம் காண்க →")}
        </button>
      </form>

      {error && (
        <p style={{
          marginTop: "16px",
          color: "var(--cl-error, #c0392b)",
          fontSize: "0.85rem",
          background: "rgba(192,57,43,0.07)",
          border: "1px solid rgba(192,57,43,0.2)",
          borderRadius: "8px",
          padding: "10px 14px",
        }}>
          {error}
        </p>
      )}

      {slots !== null && (
        <div style={{ marginTop: "28px" }}>
          {slots.length === 0 ? (
            <p style={{ color: "var(--cl-ink-2)", fontSize: "0.9rem", textAlign: "center" }}>
              {lang === "en"
                ? "No strong muhurtham found in this range. Try extending the date range."
                : "இந்த வரம்பில் சிறந்த முகூர்த்தம் இல்லை. தேதி வரம்பை நீட்டிக்கவும்."}
            </p>
          ) : (
            <>
              <p style={{ fontSize: "0.78rem", color: "var(--cl-ink-2)", marginBottom: "16px" }}>
                {lang === "en"
                  ? `Top ${slots.length} auspicious slots for ${selectedEvent.en} — ${compactCityName(city.name)}`
                  : `${selectedEvent.ta} — ${compactCityName(city.name)} — சிறந்த ${slots.length} சுப நேரங்கள்`}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {slots.map((slot, i) => {
                  const qc = QUALITY_CONFIG[slot.quality] ?? QUALITY_CONFIG.fair;
                  return (
                    <div
                      key={slot.date}
                      style={{
                        border: `1.5px solid var(--cl-border)`,
                        borderLeft: `4px solid ${qc.color}`,
                        borderRadius: "10px",
                        background: qc.bg,
                        padding: "16px 20px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                          {i + 1}. {formatDateDisplay(slot.date, lang)}
                        </span>
                        <span style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color: qc.color,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}>
                          {lang === "en" ? qc.en : qc.ta}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--cl-ink)", marginBottom: "4px" }}>
                        {lang === "en" ? "Time window:" : "நேர சாளரம்:"} {slot.timeWindow}
                      </p>
                      <p style={{ fontSize: "0.82rem", color: "var(--cl-ink-2)", marginBottom: "6px" }}>
                        {lang === "en"
                          ? `${slot.tithi} tithi · ${slotStarName(slot.nakshatra)} moon star`
                          : `${slot.tithi} திதி · ${slot.nakshatra} நட்சத்திரம்`}
                      </p>
                      <p style={{ fontSize: "0.82rem", color: "var(--cl-ink)", marginBottom: slot.cautions.length ? "6px" : 0 }}>
                        {lang === "en" ? slot.reason : slot.reasonTa}
                      </p>
                      {slot.cautions.length > 0 && (
                        <ul style={{ margin: "4px 0 0", paddingLeft: "16px", fontSize: "0.78rem", color: "#9a6010" }}>
                          {(lang === "en" ? slot.cautions : slot.cautionsTa).map((c) => (
                            <li key={c}>{c}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              <div style={{
                marginTop: "24px",
                background: "var(--cl-surface)",
                border: "1.5px solid var(--cl-border)",
                borderRadius: "10px",
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}>
                <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                  {lang === "en"
                    ? "Get muhurtham matched to your birth chart"
                    : "உங்கள் ஜாதகத்துடன் பொருந்திய முகூர்த்தம் பெறுங்கள்"}
                </p>
                <p style={{ fontSize: "0.82rem", color: "var(--cl-ink-2)" }}>
                  {lang === "en"
                    ? "The results above are based on Panchangam alone. A free Vinaadi account adds birth-chart personalisation, dasha support, hora windows, and Chandrashtama checks for a much stronger recommendation."
                    : "மேலுள்ள முடிவுகள் பஞ்சாங்கத்தை மட்டும் அடிப்படையாகக் கொண்டவை. இலவச விநாடி கணக்கில் ஜாதகத்துக்கு ஏற்ப தசை ஆதரவு, ஹோரை நேரம், சந்திராஷ்டமம் சோதனை ஆகியவை சேர்ந்து இன்னும் வலுவான பரிந்துரையை தரும்."}
                </p>
                <Link
                  href="/dashboard"
                  style={{
                    display: "inline-block",
                    background: "var(--cl-accent, #4f7c3e)",
                    color: "#fff",
                    borderRadius: "8px",
                    padding: "10px 18px",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    textDecoration: "none",
                    alignSelf: "flex-start",
                  }}
                >
                  {lang === "en" ? "Create free account →" : "இலவச கணக்கை உருவாக்கவும் →"}
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
