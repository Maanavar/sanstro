"use client";

import { useState, useEffect } from "react";
import { readErrorMessage } from "@/lib/api";
import { useLang } from "@/components/lang-toggle";
import { addDays, formatClockLabel, formatDateLabel } from "@/lib/format";
import { gowriCategoryLabel, gowriPeriodLabel, gowriPurposeLabel } from "@/lib/gowri";
import { tKarana, tNakshatra, tPlanetLord, tTithi, tWeekday, tYoga, type Lang } from "@/lib/i18n";
import { TN_CITIES, type CityEntry } from "@/lib/tn-cities";
import type { PanchangamDailyResponseData, PanchangamFestival } from "@/lib/types";
import { PanchangamShareButton } from "@/components/public-share-card";

const EXTRA_CITIES: CityEntry[] = [
  { name: "Bengaluru, Karnataka, India", lat: "12.9716", lng: "77.5946", timezone: "Asia/Kolkata" },
  { name: "Mumbai, Maharashtra, India", lat: "19.0760", lng: "72.8777", timezone: "Asia/Kolkata" },
  { name: "Singapore", lat: "1.3521", lng: "103.8198", timezone: "Asia/Singapore" },
  { name: "Houston, Texas, USA", lat: "29.7604", lng: "-95.3698", timezone: "America/Chicago" },
];
const CITY_OPTIONS = [...TN_CITIES, ...EXTRA_CITIES];
const DEFAULT_CITY = CITY_OPTIONS.find((city) => city.name === "Chennai, Tamil Nadu, India") ?? CITY_OPTIONS[0];

const RASI_LABELS: Record<number, { en: string; ta: string }> = {
  1: { en: "Mesham", ta: "மேஷம்" },
  2: { en: "Rishabam", ta: "ரிஷபம்" },
  3: { en: "Mithunam", ta: "மிதுனம்" },
  4: { en: "Kadagam", ta: "கடகம்" },
  5: { en: "Simmam", ta: "சிம்மம்" },
  6: { en: "Kanni", ta: "கன்னி" },
  7: { en: "Thulam", ta: "துலாம்" },
  8: { en: "Viruchigam", ta: "விருச்சிகம்" },
  9: { en: "Dhanusu", ta: "தனுசு" },
  10: { en: "Magaram", ta: "மகரம்" },
  11: { en: "Kumbam", ta: "கும்பம்" },
  12: { en: "Meenam", ta: "மீனம்" },
};

const AMIRDHADHI_EN: Record<string, string> = {
  "அமிர்தயோகம்": "Amirdha Yogam",
  "சித்தயோகம்": "Siddha Yogam",
  "மரணயோகம்": "Marana Yogam",
};

function today(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
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

function compactCityName(name: string): string {
  return name
    .replace(", Tamil Nadu, India", "")
    .replace(", Karnataka, India", "")
    .replace(", Maharashtra, India", "")
    .replace(", Texas, USA", "");
}

function clockPart(value: string): string {
  const timePart = value.includes("T") ? value.split("T")[1] : value;
  return timePart.slice(0, 5);
}

function endsAtDate(endsAt: string, sunrise: string, dateLocal: string): string {
  if (/^\d{4}-\d{2}-\d{2}T/.test(endsAt)) {
    return endsAt.slice(0, 10);
  }
  return clockPart(endsAt) >= clockPart(sunrise) ? dateLocal : addDays(dateLocal, 1);
}

function formatRasi(number: number, fallback: string, lang: Lang): string {
  return RASI_LABELS[number]?.[lang] ?? fallback;
}

function formatAmirdhadhiYogam(name: string, lang: Lang): string {
  return lang === "en" ? (AMIRDHADHI_EN[name] ?? name) : name;
}

function festivalTags(festival: Pick<PanchangamFestival, "category" | "tags">): string[] {
  const tags = festival.tags && festival.tags.length > 0 ? festival.tags : [festival.category];
  return Array.from(new Set(tags.filter(Boolean)));
}

function festivalTagLabel(tag: string, lang: Lang): string {
  const labels: Record<string, { en: string; ta: string }> = {
    hindu: { en: "Hindu", ta: "இந்து" },
    muslim: { en: "Muslim", ta: "இஸ்லாம்" },
    christian: { en: "Christian", ta: "கிறித்தவம்" },
    indian_govt: { en: "Indian Govt", ta: "இந்திய அரசு" },
    tamilnadu_govt: { en: "Tamil Nadu Govt", ta: "தமிழ்நாடு அரசு" },
    observance: { en: "Observance", ta: "உலக தினம்" },
  };
  return labels[tag]?.[lang] ?? tag.replaceAll("_", " ");
}

function festivalTagTone(tag: string): { bg: string; border: string; color: string } {
  if (tag === "hindu") return { bg: "rgba(184,90,44,0.09)", border: "rgba(184,90,44,0.24)", color: "#A8482F" };
  if (tag === "muslim") return { bg: "rgba(92,118,84,0.09)", border: "rgba(92,118,84,0.24)", color: "#5C7654" };
  if (tag === "christian") return { bg: "rgba(130,105,75,0.1)", border: "rgba(130,105,75,0.24)", color: "var(--cl-ink)" };
  if (tag === "indian_govt") return { bg: "rgba(49,86,106,0.1)", border: "rgba(49,86,106,0.24)", color: "#31566A" };
  if (tag === "tamilnadu_govt") return { bg: "rgba(122,92,20,0.12)", border: "rgba(122,92,20,0.24)", color: "#7A5C14" };
  return { bg: "var(--cl-bg-2)", border: "var(--cl-border)", color: "var(--cl-muted)" };
}

function FestivalTagBadge({ tag, lang }: { tag: string; lang: Lang }) {
  const tone = festivalTagTone(tag);
  return (
    <span style={{
      display: "inline-flex",
      borderRadius: "999px",
      border: `1px solid ${tone.border}`,
      background: tone.bg,
      color: tone.color,
      padding: "2px 8px",
      fontSize: "0.64rem",
      fontWeight: 800,
      lineHeight: 1.2,
      whiteSpace: "nowrap",
    }}>
      {festivalTagLabel(tag, lang)}
    </span>
  );
}

function FestivalPill({ festival, lang, observance = false }: { festival: PanchangamFestival; lang: Lang; observance?: boolean }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      flexWrap: "wrap",
      fontSize: "0.82rem",
      fontWeight: 700,
      color: "var(--cl-ink-2)",
      background: observance ? "var(--cl-bg-2)" : "var(--cl-surface)",
      border: "1px solid var(--cl-border)",
      borderRadius: "999px",
      padding: "5px 12px",
    }}>
      <span>{festival.name}</span>
      {festivalTags(festival).map((tag) => (
        <FestivalTagBadge key={tag} tag={tag} lang={lang} />
      ))}
    </span>
  );
}

// Tamil panchangam day runs sunrise-to-sunrise — an "ends at" clock time
// earlier than sunrise belongs to the next Gregorian calendar date, which
// reference almanacs call out explicitly (e.g. "* Next Calendar Day").
function formatEndsAtLabel(endsAt: string, sunrise: string, dateLocal: string, lang: Lang): string {
  const clock = formatClockLabel(endsAt);
  const endDate = endsAtDate(endsAt, sunrise, dateLocal);
  const dateLabel = formatDateLabel(endDate);
  const nextDaySuffix = lang === "ta" && endDate !== dateLocal ? " (மறுநாள்)" : "";
  return `${clock}, ${dateLabel}${nextDaySuffix}`;
}

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
        {formatClockLabel(start)} – {formatClockLabel(end)}
      </p>
    </div>
  );
}

type PanchangamTimingSlot = PanchangamDailyResponseData["kalam"]["nallaNeram"][number];

function SlotStack({ slots, emptyLabel, lang }: { slots: PanchangamTimingSlot[]; emptyLabel: string; lang: Lang }) {
  if (slots.length === 0) {
    return <span style={{ color: "var(--cl-muted)", fontStyle: "italic", fontSize: "0.8rem" }}>{emptyLabel}</span>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {slots.map((slot, idx) => {
        const period = gowriPeriodLabel(slot.period, lang);
        const category = gowriCategoryLabel(slot.name, lang);
        const purpose = gowriPurposeLabel(slot.name, lang);
        return (
          <div
            key={`${slot.period ?? "slot"}-${slot.name ?? slot.slot}-${slot.start}-${slot.end}-${idx}`}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto",
              alignItems: "center",
              gap: "10px",
              padding: "7px 9px",
              borderRadius: "8px",
              background: slot.warning ? "rgba(168,72,47,0.06)" : "rgba(92,118,84,0.07)",
              border: `1px solid ${slot.warning ? "rgba(168,72,47,0.18)" : "rgba(92,118,84,0.18)"}`,
            }}
          >
            <span style={{ minWidth: 0, color: "var(--cl-muted)", fontSize: "0.72rem", fontWeight: 700, lineHeight: 1.35 }}>
              <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {[period, category].filter(Boolean).join(" · ") || `Slot ${slot.slot}`}
              </span>
              {purpose && <span style={{ display: "block", marginTop: "2px", color: "var(--cl-ink-2)", fontSize: "0.68rem", fontWeight: 600 }}>{purpose}</span>}
            </span>
            <span style={{ color: "var(--cl-ink)", fontVariantNumeric: "tabular-nums", fontWeight: 700, whiteSpace: "nowrap" }}>
              {formatClockLabel(slot.start)} - {formatClockLabel(slot.end)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function PanchangamTool() {
  const [lang] = useLang();
  const en = lang === "en";

  const [date, setDate] = useState(today());
  const [lat, setLat] = useState(DEFAULT_CITY.lat);
  const [lng, setLng] = useState(DEFAULT_CITY.lng);
  const [timezone, setTimezone] = useState(DEFAULT_CITY.timezone);
  const [cityKey, setCityKey] = useState(DEFAULT_CITY.name);
  const [data, setData] = useState<PanchangamDailyResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  function selectCity(city: CityEntry) {
    setLat(city.lat);
    setLng(city.lng);
    setTimezone(city.timezone);
    setCityKey(city.name);
  }

  function useBrowserLocation() {
    setError("");
    if (!("geolocation" in navigator)) {
      setError("Location is not available in this browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || timezone;
        const nextLat = position.coords.latitude.toFixed(6);
        const nextLng = position.coords.longitude.toFixed(6);
        setLat(nextLat);
        setLng(nextLng);
        setTimezone(browserTimezone);
        setCityKey("Browser");
        setLocating(false);
        void fetchPanchangam({ date, lat: nextLat, lng: nextLng, timezone: browserTimezone });
      },
      (geoError) => {
        setLocating(false);
        setError(
          geoError.code === geoError.PERMISSION_DENIED
            ? "Location permission was denied. Choose a city or enter coordinates manually."
            : "Could not read your location. Choose a city or enter coordinates manually.",
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 15 * 60 * 1000 },
    );
  }

  const currentCityDisplay = (() => {
    const c = CITY_OPTIONS.find((c) => c.name === cityKey);
    if (cityKey === "Browser") return en ? "Current location" : "தற்போதைய இடம்";
    if (!c) return en ? "Custom" : "தனிப்பயன்";
    return compactCityName(c.name);
  })();

  async function fetchPanchangam(next = { date, lat, lng, timezone }) {
    setError("");
    setLoading(true);
    setData(null);
    try {
      const params = new URLSearchParams(next);
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
    ? `${tTithi(data.tithi.name, lang)} (${data.tithi.paksha === "SHUKLA"
        ? (en ? "Valar Pirai" : "வளர் பிறை")
        : (en ? "Thei Pirai" : "தேய் பிறை")})`
    : "";
  const chandrashtamamRasi = data
    ? formatRasi(
        data.chandrashtamamToday.affectedJanmaRasiNumber,
        data.chandrashtamamToday.affectedJanmaRasiName,
        lang,
      )
    : "";
  const moonRasi = data
    ? formatRasi(data.chandrashtamamToday.moonRasiNumber, data.chandrashtamamToday.moonRasiName, lang)
    : "";
  const tamilDateLabel = data?.tamilDate ? data.tamilDate[lang] : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Controls */}
      <div style={{
        background: "var(--cl-surface)", border: "1px solid var(--cl-border)",
        borderRadius: "16px", padding: "20px 24px",
        display: "flex", flexDirection: "column", gap: "16px",
      }}>
        {/* Location */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "12px", alignItems: "end" }}>
          <label style={labelStyle}>
            {en ? "Location" : "இடம்"}
            <select
              style={inputStyle}
              value={CITY_OPTIONS.some((city) => city.name === cityKey) ? cityKey : ""}
              onChange={(e) => {
                const city = CITY_OPTIONS.find((option) => option.name === e.target.value);
                if (city) selectCity(city);
              }}
            >
              <option value="" disabled>
                {cityKey === "Browser"
                  ? (en ? "Current location" : "தற்போதைய இடம்")
                  : (en ? "Custom coordinates" : "தனிப்பயன் இடம்")}
              </option>
              {CITY_OPTIONS.map((city) => (
                <option key={city.name} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={useBrowserLocation}
            disabled={locating}
            style={{
              minHeight: "39px",
              padding: "9px 16px",
              borderRadius: "8px",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: locating ? "wait" : "pointer",
              fontFamily: "inherit",
              border: cityKey === "Browser" ? "1.5px solid var(--cl-accent)" : "1.5px solid var(--cl-border)",
              background: cityKey === "Browser" ? "rgba(184,90,44,0.08)" : "var(--cl-bg-2)",
              color: cityKey === "Browser" ? "#B85A2C" : "var(--cl-ink)",
              whiteSpace: "nowrap",
            }}
          >
            {locating ? (en ? "Locating..." : "இடம் பெறுகிறது...") : (en ? "Use my location" : "என் இடம்")}
          </button>
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
          <label style={labelStyle}>
            Timezone
            <input style={inputStyle} value={timezone}
              onChange={(e) => { setTimezone(e.target.value); setCityKey("Custom"); }} />
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
              {[en ? "Panchangam" : "பஞ்சாங்கம்", data.dateLocal, tamilDateLabel, currentCityDisplay].filter(Boolean).join(" · ")}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
              {[
                { label: en ? "Tithi" : "திதி",         value: tithiLabel,          sub: `${en ? "Ends" : "முடிவு"} ${formatEndsAtLabel(data.tithi.endsAt, data.sunrise, data.dateLocal, lang)} · ${en ? "then" : "பின்பு"} ${tTithi(data.tithi.nextName, lang)}` },
                { label: en ? "Vara" : "வாரம்",          value: tWeekday(data.vara.weekday, lang),   sub: `${en ? "Lord" : "அதிபதி"}: ${tPlanetLord(data.vara.lord, lang)}` },
                { label: en ? "Nakshatra" : "நட்சத்திரம்", value: tNakshatra(data.nakshatra.name, lang), sub: `${en ? "Pada" : "பாதம்"} ${data.nakshatra.pada} · ${en ? "Ends" : "முடிவு"} ${formatEndsAtLabel(data.nakshatra.endsAt, data.sunrise, data.dateLocal, lang)} · ${en ? "then" : "பின்பு"} ${tNakshatra(data.nakshatra.nextName, lang)}` },
                { label: en ? "Yoga" : "யோகம்",          value: tYoga(data.yoga.name, lang),      sub: `${en ? "Yoga" : "யோகம்"} ${data.yoga.number} · ${en ? "Ends" : "முடிவு"} ${formatEndsAtLabel(data.yoga.endsAt, data.sunrise, data.dateLocal, lang)} · ${en ? "then" : "பின்பு"} ${tYoga(data.yoga.nextName, lang)}` },
                { label: en ? "Karana" : "கரணம்",        value: tKarana(data.karana.name, lang),    sub: `${en ? "Ends" : "முடிவு"} ${formatEndsAtLabel(data.karana.endsAt, data.sunrise, data.dateLocal, lang)} · ${en ? "then" : "பின்பு"} ${tKarana(data.karana.nextName, lang)}` },
                { label: en ? "Moon Phase" : "சந்திர கலை", value: data.moonPhaseLabel, sub: "" },
                { label: en ? "Lagnam" : "லக்னம்",       value: formatRasi(data.lagnam.rasiNumber, data.lagnam.rasiName, lang), sub: `${en ? "Ends" : "முடிவு"} ${formatEndsAtLabel(data.lagnam.endsAt, data.sunrise, data.dateLocal, lang)} · ${data.lagnam.nazhigai} ${en ? "nazhigai" : "நாழிகை"} ${data.lagnam.vinadi} ${en ? "vinadi" : "விநாடி"}` },
                { label: en ? "Soolam" : "சூலம்",        value: data.soolam.direction, sub: `${en ? "Parigaram" : "பரிகாரம்"}: ${data.soolam.parigaram}` },
                { label: en ? "Nethiram" : "நேத்திரம்",   value: data.nethiram,       sub: "" },
                { label: en ? "Jeevan" : "ஜீவன்",        value: data.jeevan,         sub: "" },
                { label: en ? "Amirdhadhi Yogam" : "அமிர்தாதி யோகம்", value: formatAmirdhadhiYogam(data.amirdhadhiYogam.name, lang), sub: `${en ? "Ends" : "முடிவு"} ${formatEndsAtLabel(data.amirdhadhiYogam.endsAt, data.sunrise, data.dateLocal, lang)} · ${en ? "then" : "பின்பு"} ${formatAmirdhadhiYogam(data.amirdhadhiYogam.nextName, lang)}` },
                { label: en ? "Chandrashtamam Today" : "சந்திராஷ்டமம்", value: chandrashtamamRasi, sub: en ? `Affected Janma rasi; Moon in ${moonRasi}` : `பாதிக்கும் ஜென்ம ராசி; சந்திரன் ${moonRasi}` },
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

          {/* Share button */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <PanchangamShareButton data={{
              dateLabel: formatDateLabel(data.dateLocal),
              cityName: currentCityDisplay || cityKey,
              tithi: tTithi(data.tithi.name, lang),
              nakshatra: tNakshatra(data.nakshatra.name, lang),
              vara: tWeekday(data.vara.weekday, lang),
              yoga: data.yoga?.name,
              karana: data.karana?.name,
              sunrise: formatClockLabel(data.sunrise),
              sunset: formatClockLabel(data.sunset),
              rahuKalamStart: formatClockLabel(data.kalam.rahuKalam.start),
              rahuKalamEnd: formatClockLabel(data.kalam.rahuKalam.end),
              nallaNeram: data.kalam.nallaNeram.length > 0
                ? `${formatClockLabel(data.kalam.nallaNeram[0].start)} – ${formatClockLabel(data.kalam.nallaNeram[0].end)}`
                : (en ? "N/A" : "இல்லை"),
              lang,
            }} />
          </div>

          {/* Sunrise/sunset */}
          <div className="cl-mobile-card-split" style={{
            background: "var(--cl-surface)", border: "1px solid var(--cl-border)",
            borderRadius: "14px", padding: "18px 22px",
          }}>
            {[
              { label: en ? "Sunrise" : "சூரிய உதயம்",  value: formatClockLabel(data.sunrise) },
              { label: en ? "Sunset" : "சூரிய அஸ்தமனம்", value: formatClockLabel(data.sunset) },
              { label: en ? "Solar Noon" : "மத்தியான்னம்", value: formatClockLabel(data.solarNoon) },
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

          {/* Nalla Neram + Gowri Nalla Neram — side-by-side table */}
          <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "14px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
              <thead>
                <tr>
                  {[
                    { en: "Nalla Neram", ta: "நல்ல நேரம்" },
                    { en: "Gowri Nalla Neram", ta: "கௌரி நல்ல நேரம்" },
                  ].map((col) => (
                    <th key={col.en} style={{ padding: "12px 16px", fontWeight: 700, textAlign: "left", borderBottom: "1px solid var(--cl-border)", background: "rgba(92,118,84,0.06)", width: "50%" }}>
                      <div>{col.en}</div>
                      <div style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--cl-muted)" }}>{col.ta}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--cl-border)", verticalAlign: "top" }}>
                    <SlotStack slots={data.kalam.nallaNeram ?? []} emptyLabel={en ? "Not available" : "இல்லை"} lang={lang} />
                  </td>
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--cl-border)", verticalAlign: "top" }}>
                    <SlotStack slots={data.kalam.gowriNallaNeram ?? []} emptyLabel={en ? "Not available" : "இல்லை"} lang={lang} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Other timing windows */}
          <div style={{
            background: "var(--cl-surface)", border: "1px solid var(--cl-border)",
            borderRadius: "14px", padding: "18px 22px",
          }}>
            <p style={{ margin: "0 0 14px", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--cl-muted)" }}>
              {en ? "Timing Windows" : "நேர சாளரங்கள்"}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
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
          {data.festivals.filter((f) => !festivalTags(f).includes("observance")).length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {data.festivals.filter((f) => !festivalTags(f).includes("observance")).map((f) => (
                <FestivalPill key={f.name} festival={f} lang={lang} />
              ))}
            </div>
          )}

          {/* World observance days */}
          {data.festivals.filter((f) => festivalTags(f).includes("observance")).length > 0 && (
            <div style={{
              background: "var(--cl-surface)", border: "1px solid var(--cl-border)",
              borderRadius: "14px", padding: "14px 18px",
            }}>
              <p style={{ margin: "0 0 8px", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--cl-muted)" }}>
                {en ? "World Observance Days" : "உலக தினங்கள்"}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {data.festivals.filter((f) => festivalTags(f).includes("observance")).map((f) => (
                  <FestivalPill key={f.name} festival={f} lang={lang} observance />
                ))}
              </div>
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
