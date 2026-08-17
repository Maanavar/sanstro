"use client";

import { useState } from "react";
import { getPersonalizedMuhurta } from "@vinaadi/shared/api";
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

// Values must match `app.api.public_tools._PUBLIC_MUHURTA_ACTIVITIES`, which is
// kept in step with the signed-in picker on purpose — the same question must
// not get a different answer depending on whether you are signed in.
//
// The Samskara and Treasure entries are the page-cited ones (Kalaprakasika
// Ch. III, IV and XXI). They stay separate values because their rules differ;
// see `app/data/muhurta_activity_registry.py`.
const EVENT_TYPES = [
  { value: "MARRIAGE",        en: "Wedding / Marriage",           ta: "திருமணம்" },
  { value: "NAMING_CEREMONY", en: "Baby Naming / Namakarana",     ta: "பெயர் சூட்டு விழா / நாமகரணம்" },
  { value: "MILK_FEEDING",    en: "First Feeding on Milk",        ta: "பால் ஊட்டத் தொடங்குதல்" },
  { value: "ANNAPRASANA",     en: "Annaprasana / First Feeding",  ta: "அன்னப்பிராசனம் / சோறூட்டு" },
  { value: "EAR_BORING",      en: "Ear Boring / Karnavedha",      ta: "காதுகுத்து / கர்ணவேதம்" },
  { value: "GOLD",            en: "Gold & Precious Metals",       ta: "தங்கம் / விலைமதிப்புள்ள உலோகம்" },
  { value: "GEMS",            en: "Gems & Jewels",                ta: "ரத்தினம் / நகை" },
  { value: "TREASURE_STORE",  en: "Laying Up Treasure",           ta: "செல்வம் சேமிப்பு" },
  { value: "GRAIN",           en: "Storing Grain",                ta: "தானியம் சேமிப்பு" },
  { value: "LAND_POSSESSION", en: "Taking Possession of Land",    ta: "நிலம் கைவசப்படுத்தல்" },
  { value: "LAND_PURCHASE",   en: "Buying Land",                  ta: "நிலம் வாங்குதல்" },
  { value: "CATTLE_PURCHASE", en: "Buying Cattle",                ta: "கால்நடை வாங்குதல்" },
  // Ch. V, VII, XVII, XVIII — the later life-stage samskaras.
  { value: "TONSURE",         en: "Tonsure / Choulam",            ta: "மொட்டை / சூடாகர்மம்" },
  { value: "UPANAYANAM",      en: "Upanayanam / Thread Ceremony", ta: "உபநயனம் / பூணூல் விழா" },
  { value: "SEEMANTHAM",      en: "Seemantham / Valaikappu",      ta: "சீமந்தம் / வளைகாப்பு" },
  { value: "LYING_IN_CHAMBER", en: "Arranging the Lying-in Chamber", ta: "பேறுகால அறை ஏற்பாடு" },
  // Ch. VI, VIII, X, XI, XII — the student's arc, start to finish.
  { value: "VIDYARAMBHAM",    en: "Vidyarambham / First Letters", ta: "வித்யாரம்பம் / எழுத்தறிவித்தல்" },
  { value: "EDUCATION_START", en: "Starting Education",           ta: "கல்வியைத் தொடங்குதல்" },
  { value: "MANTRA_INITIATION", en: "Mantra Initiation / Upadesam", ta: "மந்திர உபதேசம்" },
  { value: "VEDA_STUDY",      en: "Beginning Veda Study",         ta: "வேத அத்யயனம் தொடங்குதல்" },
  { value: "SNAANA",          en: "Samavarthanam Bath / Snaana",  ta: "சமாவர்த்தன ஸ்நானம்" },
  // Ch. XXIII, XXIV — wearing something new.
  { value: "NEW_CLOTHES",     en: "Wearing New Clothes",          ta: "புத்தாடை அணிதல்" },
  { value: "NEW_ORNAMENT",    en: "Wearing a New Gold Ornament",  ta: "புது தங்க நகை அணிதல்" },
  // Ch. XX — harvest and the grain store.
  { value: "HARVEST",         en: "Starting the Harvest",         ta: "அறுவடை தொடங்குதல்" },
  { value: "HARVEST_INGATHERING", en: "Bringing the Crop In",     ta: "விளைச்சலைச் சேர்த்தல்" },
  { value: "GRAIN_EXPENDITURE", en: "Drawing Down the Grain Store", ta: "தானியத்தைச் செலவிடுதல்" },
  // Ch. XIX, XXII — the crop cycle from first footstep to first mouthful.
  { value: "AGRICULTURE_START", en: "Starting Work on the Land",  ta: "வேளாண் பணியைத் தொடங்குதல்" },
  { value: "TILLAGE",         en: "Ploughing the Field",          ta: "நிலத்தை உழுதல்" },
  { value: "SOWING",          en: "Sowing Seed",                  ta: "விதைத்தல்" },
  { value: "NEW_GRAIN_MEAL",  en: "First Meal of the New Grain",  ta: "புதிய தானியத்தை உண்ணுதல்" },
  { value: "JOB_START",       en: "Job / Career Start",           ta: "வேலை / தொழில் தொடக்கம்" },
  { value: "INVESTMENT",      en: "Business / Investment",        ta: "வியாபாரம் / முதலீடு" },
  { value: "PURCHASE",        en: "Purchase / Property",          ta: "வாங்குதல் / சொத்து" },
  { value: "TRAVEL",          en: "Travel",                       ta: "பயணம்" },
  { value: "EXAM",            en: "Exam / Education",             ta: "தேர்வு / கல்வி" },
  { value: "MEDICAL",         en: "Medical / Surgery",            ta: "மருத்துவம் / அறுவை சிகிச்சை" },
  { value: "SPIRITUAL",       en: "Spiritual / Puja",             ta: "ஆன்மீகம் / பூஜை" },
];

interface MuhurtaSlot {
  date: string;
  timeStart: string;
  timeEnd: string;
  score: number;
  panchangamSupport: { en: string; ta: string };
  dashaSupport?: { en: string; ta: string } | null;
  horaSupport?: { en: string; ta: string } | null;
  factors?: Array<{ verdict: string; contribution: number; reason: { en: string; ta: string } }>;
  // Retained while the old public-only result renderer is phased out below.
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

function formatTime(value: string): string {
  const [hourText, minute = "00"] = value.split(":");
  const hour = Number(hourText);
  if (!Number.isFinite(hour)) return value;
  return `${hour % 12 || 12}:${minute} ${hour < 12 ? "am" : "pm"}`;
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
    color: "var(--cl-muhurta-green)",
    bg: "var(--cl-muhurta-green-bg)",
  },
  good: {
    en: "Good",
    ta: "நல்லது",
    color: "var(--cl-muhurta-caution)",
    bg: "var(--cl-muhurta-caution-bg)",
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
  const [birthCity, setBirthCity] = useState<CityEntry>(DEFAULT_CITY);
  const [birthDate, setBirthDate] = useState("1992-04-18");
  const [birthTime, setBirthTime] = useState("09:15");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<MuhurtaSlot[] | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSlots(null);
    try {
      const response = await getPersonalizedMuhurta({
        birth: {
          birthDateLocal: birthDate,
          birthTimeLocal: `${birthTime}:00`,
          birthLatitude: Number(birthCity.lat),
          birthLongitude: Number(birthCity.lng),
          birthTimezone: birthCity.timezone,
          birthPlace: birthCity.name,
        },
        eventType,
        dateFrom,
        dateTo,
        lat: Number(city.lat),
        lng: Number(city.lng),
        timezone: city.timezone,
        place: city.name,
      });
      setSlots(response.data.slots as unknown as MuhurtaSlot[]);
      return;

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

        <div style={{ padding: "14px", background: "var(--cl-brand-tint)", borderRadius: "8px", display: "grid", gap: "12px" }}>
          <strong style={{ fontSize: "0.9rem", color: "var(--cl-ink)" }}>{lang === "en" ? "Whose timing is this for?" : "யாருக்கான முகூர்த்தம்?"}</strong>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: "12px" }}>
            <label style={labelStyle}>
              {lang === "en" ? "Birth date" : "பிறந்த தேதி"}
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} style={inputStyle} required />
            </label>
            <label style={labelStyle}>
              {lang === "en" ? "Birth time" : "பிறந்த நேரம்"}
              <input type="time" value={birthTime} onChange={(e) => setBirthTime(e.target.value)} style={inputStyle} required />
            </label>
          </div>
          <label style={labelStyle}>
            {lang === "en" ? "Birth city" : "பிறந்த ஊர்"}
            <select value={birthCity.name} onChange={(e) => {
              const found = CITY_OPTIONS.find((c) => c.name === e.target.value);
              if (found) setBirthCity(found);
            }} style={inputStyle}>
              {CITY_OPTIONS.map((c) => <option key={c.name} value={c.name}>{compactCityName(c.name)}</option>)}
            </select>
          </label>
          <span style={{ fontSize: "0.76rem", color: "var(--cl-ink-2)" }}>{lang === "en" ? "Used only for this calculation; it is not saved." : "இந்தக் கணக்கீட்டிற்கு மட்டும் பயன்படுத்தப்படும்; சேமிக்கப்படாது."}</span>
        </div>

        {/* Date range */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "12px" }}>
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
            background: loading ? "var(--cl-border)" : "var(--cl-muhurta-green)",
            color: loading ? "var(--cl-ink-2)" : "var(--cl-surface)",
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
          color: "var(--cl-error)",
          fontSize: "0.85rem",
          background: "var(--cl-error-tint)",
          border: "1px solid var(--cl-error-ring)",
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
                  if (Number.isFinite(slot.score)) {
                    const positiveFactors = (slot.factors ?? []).filter((factor) => factor.contribution !== 0);
                    return (
                      <div key={slot.date} style={{ border: "1.5px solid var(--cl-border)", borderLeft: "4px solid var(--cl-muhurta-green)", borderRadius: "10px", background: "var(--cl-surface)", padding: "16px 20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "baseline", marginBottom: "8px" }}>
                          <strong>{i + 1}. {formatDateDisplay(slot.date, lang)}</strong>
                          <span style={{ color: "var(--cl-muhurta-green)", fontWeight: 700 }}>{slot.score.toFixed(1)} / 100</span>
                        </div>
                        <p style={{ margin: "0 0 6px", fontWeight: 700, color: "var(--cl-ink)" }}>{lang === "en" ? "Recommended window:" : "பரிந்துரைக்கப்படும் நேரம்:"} {formatTime(slot.timeStart)} – {formatTime(slot.timeEnd)}</p>
                        <p style={{ margin: "0 0 6px", color: "var(--cl-ink-2)" }}>{lang === "en" ? slot.panchangamSupport.en : slot.panchangamSupport.ta}</p>
                        {slot.dashaSupport && <p style={{ margin: "0 0 6px", color: "var(--cl-ink-2)" }}><strong>{lang === "en" ? "Dasha support: " : "தசை ஆதரவு: "}</strong>{lang === "en" ? slot.dashaSupport.en : slot.dashaSupport.ta}</p>}
                        {slot.horaSupport && <p style={{ margin: 0, color: "var(--cl-ink-2)" }}><strong>{lang === "en" ? "Hora: " : "ஹோரை: "}</strong>{lang === "en" ? slot.horaSupport.en : slot.horaSupport.ta}</p>}
                        {positiveFactors.length > 0 && <details style={{ marginTop: "10px", color: "var(--cl-ink-2)" }}><summary style={{ cursor: "pointer", fontWeight: 700 }}>{lang === "en" ? "What was weighed" : "பரிசீலிக்கப்பட்டவை"}</summary><ul style={{ margin: "8px 0 0", paddingLeft: "18px" }}>{positiveFactors.map((factor, factorIndex) => <li key={factorIndex}>{lang === "en" ? factor.reason.en : factor.reason.ta}</li>)}</ul></details>}
                      </div>
                    );
                  }
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
                        <ul style={{ margin: "4px 0 0", paddingLeft: "16px", fontSize: "0.78rem", color: "var(--cl-caution-ink)" }}>
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
                    ? "The results above are based on Panchangam alone. A free Vinaadi account adds birth-chart personalisation, dasa support, hora windows, and Chandrashtama checks for a much stronger recommendation."
                    : "மேலுள்ள முடிவுகள் பஞ்சாங்கத்தை மட்டும் அடிப்படையாகக் கொண்டவை. இலவச விநாடி கணக்கில் ஜாதகத்துக்கு ஏற்ப தசை ஆதரவு, ஹோரை நேரம், சந்திராஷ்டமம் சோதனை ஆகியவை சேர்ந்து இன்னும் வலுவான பரிந்துரையை தரும்."}
                </p>
                <Link
                  href="/dashboard"
                  style={{
                    display: "inline-block",
                    background: "var(--cl-muhurta-green)",
                    color: "var(--cl-surface)",
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
