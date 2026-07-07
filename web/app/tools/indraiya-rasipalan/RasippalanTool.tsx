"use client";

import { useState, useEffect } from "react";
import { Moon } from "lucide-react";
import { readErrorMessage } from "@/lib/api";
import { useLang } from "@/components/lang-toggle";
import { tNakshatra, type Lang } from "@/lib/i18n";
import { getRasiPalanGrid, type RasiPalanGridData, type RasiPalanGridItem } from "@vinaadi/shared/api/rasiPalan";

// ── Static data ───────────────────────────────────────────────────────────────
// Fixed classical zodiac names/symbols only — no prediction content lives here.
// All headline/body/luckyColor/luckyNumbers/pariharam/tone text comes from the API.

const RASI_LIST: { number: number; en: string; ta: string; symbol: string }[] = [
  { number: 1,  en: "Mesham",     ta: "மேஷம்",      symbol: "♈" },
  { number: 2,  en: "Rishabam",   ta: "ரிஷபம்",     symbol: "♉" },
  { number: 3,  en: "Mithunam",   ta: "மிதுனம்",    symbol: "♊" },
  { number: 4,  en: "Kadagam",    ta: "கடகம்",       symbol: "♋" },
  { number: 5,  en: "Simmam",     ta: "சிம்மம்",    symbol: "♌" },
  { number: 6,  en: "Kanni",      ta: "கன்னி",       symbol: "♍" },
  { number: 7,  en: "Thulam",     ta: "துலாம்",      symbol: "♎" },
  { number: 8,  en: "Viruchigam", ta: "விருச்சிகம்", symbol: "♏" },
  { number: 9,  en: "Dhanusu",    ta: "தனுசு",       symbol: "♐" },
  { number: 10, en: "Magaram",    ta: "மகரம்",       symbol: "♑" },
  { number: 11, en: "Kumbam",     ta: "கும்பம்",     symbol: "♒" },
  { number: 12, en: "Meenam",     ta: "மீனம்",       symbol: "♓" },
];

type Tone = "positive" | "neutral" | "caution" | "warn";

const TONE_COLORS: Record<Tone, { bg: string; border: string; text: string; badge: string }> = {
  positive: { bg: "var(--cl-sage-tint)",    border: "var(--cl-sage-edge)",  text: "var(--chart-d9-active)", badge: "var(--cl-sage-mid)" },
  neutral:  { bg: "var(--cl-neutral-tint)", border: "var(--cl-neutral-ring)", text: "var(--cl-neutral-ink)", badge: "var(--cl-neutral-mid)" },
  caution:  { bg: "var(--cl-rust-tint)",    border: "var(--cl-rust-ring)",  text: "var(--planet-saturn)",   badge: "var(--cl-rust-mid)" },
  warn:     { bg: "var(--cl-rust-fill)",    border: "var(--cl-rust-edge)",  text: "var(--planet-saturn)",   badge: "var(--cl-rust-ring)" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function today(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function rasiName(number: number, lang: Lang): string {
  return RASI_LIST.find((r) => r.number === number)?.[lang] ?? String(number);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RasiSelectorGrid({
  selectedRasi,
  onSelect,
  lang,
}: {
  selectedRasi: number | null;
  onSelect: (n: number) => void;
  lang: Lang;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 132px), 1fr))", gap: "8px" }}>
      {RASI_LIST.map((r) => {
        const isSelected = r.number === selectedRasi;
        return (
          <button
            key={r.number}
            type="button"
            onClick={() => onSelect(r.number)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
              padding: "10px 6px",
              borderRadius: "10px",
              border: isSelected ? "2px solid var(--cl-accent)" : "1.5px solid var(--cl-border)",
              background: isSelected ? "var(--cl-brand-tint)" : "var(--cl-bg-2)",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "border-color 0.15s, background 0.15s",
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>{r.symbol}</span>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: isSelected ? "var(--chart-d1-active)" : "var(--cl-ink)" }}>
              {lang === "ta" ? r.ta : r.en}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function RasiCard({
  item,
  lang,
  isSelected,
  onClick,
}: {
  item: RasiPalanGridItem;
  lang: Lang;
  isSelected: boolean;
  onClick: () => void;
}) {
  const colors = TONE_COLORS[item.tone];
  const rasi = RASI_LIST.find((r) => r.number === item.rasi)!;

  return (
    <div
      onClick={onClick}
      style={{
        background: isSelected ? colors.bg : "var(--cl-surface)",
        border: isSelected ? `2px solid ${colors.border}` : "1.5px solid var(--cl-border)",
        borderRadius: "12px",
        padding: "14px 16px",
        cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
        <span style={{ fontSize: "1rem" }}>{rasi.symbol}</span>
        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--cl-ink)" }}>
          {lang === "ta" ? rasi.ta : rasi.en}
        </span>
        <span style={{
          marginLeft: "auto",
          fontSize: "0.62rem", fontWeight: 700,
          padding: "2px 7px", borderRadius: "999px",
          background: colors.badge, color: colors.text,
        }}>
          {lang === "ta" ? `${item.moonHouse}ஆம் இடம்` : `House ${item.moonHouse}`}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: colors.text }}>
        {item.headline[lang]}
      </p>
      {isSelected && (
        <p style={{ margin: "6px 0 0", fontSize: "0.78rem", color: "var(--cl-ink-2)", lineHeight: 1.55 }}>
          {item.body[lang]}
        </p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function RasippalanTool({ hideCta = false }: { hideCta?: boolean } = {}) {
  const [lang] = useLang();
  const en = lang === "en";

  const [date, setDate] = useState(today());
  const [data, setData] = useState<RasiPalanGridData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRasi, setSelectedRasi] = useState<number | null>(null);

  async function fetchRasiPalan(d = date) {
    setError("");
    setLoading(true);
    setData(null);
    try {
      const result = await getRasiPalanGrid({ date: d, lat: 13.0827, lng: 80.2707, timezone: "Asia/Kolkata" });
      setData(result);
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchRasiPalan();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const moonRasiLabel = data ? rasiName(data.moonRasi, lang) : null;
  const nakshatraLabel = data ? tNakshatra(data.nakshatra, lang) : null;
  const selectedItem = data && selectedRasi ? data.results.find((r) => r.rasi === selectedRasi) ?? null : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Date picker */}
      <div style={{
        background: "var(--cl-surface)", border: "1px solid var(--cl-border)",
        borderRadius: "16px", padding: "20px 24px",
        display: "flex", flexDirection: "column", gap: "14px",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "12px", alignItems: "end" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "0.78rem", fontWeight: 600, color: "var(--cl-ink-2)" }}>
            {en ? "Date" : "தேதி"}
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                width: "100%", border: "1.5px solid var(--cl-border)", borderRadius: "8px",
                padding: "9px 12px", background: "var(--cl-bg)", color: "var(--cl-ink)",
                fontSize: "0.88rem", fontFamily: "inherit", outline: "none", boxSizing: "border-box",
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => void fetchRasiPalan()}
            disabled={loading}
            style={{
              minHeight: "39px", padding: "9px 24px",
              background: loading ? "var(--cl-border)" : "var(--cl-ink)",
              color: "var(--cl-bg)", border: "none", borderRadius: "999px",
              fontFamily: "inherit", fontSize: "0.88rem", fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer", whiteSpace: "nowrap", width: "100%",
            }}
          >
            {loading ? (en ? "Loading…" : "ஏற்றுகிறது…") : (en ? "Get Rasipalan" : "ராசிபலன் பெறு")}
          </button>
        </div>

        {error && (
          <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--planet-saturn)", background: "var(--cl-rust-tint)", border: "1px solid var(--cl-rust-ring)", borderRadius: "8px", padding: "10px 14px" }}>
            {error}
          </p>
        )}
      </div>

      {/* Moon status banner */}
      {data && (
        <div style={{
          background: "var(--cl-brand-tint)", border: "1px solid var(--cl-brand-ring-md)",
          borderRadius: "14px", padding: "16px 20px",
          display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px",
        }}>
          <Moon size={22} color="var(--cl-ink)" strokeWidth={1.5} aria-hidden="true" />
          <div>
            <p style={{ margin: 0, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--cl-muted)" }}>
              {en ? "Moon's position today" : "இன்று சந்திரன் நிலை"}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "1rem", fontWeight: 700, color: "var(--cl-ink)" }}>
              {moonRasiLabel}
              {nakshatraLabel && (
                <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--cl-muted)", marginLeft: "8px" }}>
                  · {nakshatraLabel}
                </span>
              )}
            </p>
          </div>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--cl-muted)", marginLeft: "auto" }}>
            {en ? "Select your rasi below" : "கீழே உங்கள் ராசியை தேர்வு செய்யுங்கள்"}
          </p>
        </div>
      )}

      {/* Rasi selector */}
      {data && (
        <div style={{
          background: "var(--cl-surface)", border: "1px solid var(--cl-border)",
          borderRadius: "16px", padding: "20px 24px",
          display: "flex", flexDirection: "column", gap: "14px",
        }}>
          <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--cl-muted)" }}>
            {en ? "Select your birth sign" : "உங்கள் பிறப்பு ராசியைத் தேர்வு செய்யுங்கள்"}
          </p>
          <RasiSelectorGrid selectedRasi={selectedRasi} onSelect={setSelectedRasi} lang={lang} />
        </div>
      )}

      {/* Selected rasi — full prediction */}
      {data && selectedItem && (() => {
        const colors = TONE_COLORS[selectedItem.tone];
        const rasi = RASI_LIST.find((r) => r.number === selectedItem.rasi)!;
        return (
          <div style={{
            background: colors.bg, border: `2px solid ${colors.border}`,
            borderRadius: "16px", padding: "22px 26px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <span style={{ fontSize: "1.5rem" }}>{rasi.symbol}</span>
              <div>
                <p style={{ margin: 0, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: colors.text }}>
                  {lang === "ta" ? rasi.ta : rasi.en} · {en ? `Moon in House ${selectedItem.moonHouse}` : `சந்திரன் ${selectedItem.moonHouse}ஆம் இடம்`}
                </p>
                <p style={{ margin: "3px 0 0", fontSize: "1.1rem", fontWeight: 700, color: colors.text }}>
                  {selectedItem.headline[lang]}
                </p>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--cl-ink-2)", lineHeight: 1.65 }}>
              {selectedItem.body[lang]}
            </p>

            {/* Lucky number · color · pariharam */}
            <div style={{ marginTop: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>

              {/* Lucky row */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {/* Lucky numbers */}
                <div style={{ flex: "1 1 auto", background: "var(--veil-white-55)", border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "10px 14px" }}>
                  <p style={{ margin: 0, fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: colors.text, marginBottom: "5px" }}>
                    {en ? "Lucky Numbers" : "அதிர்ஷ்ட எண்கள்"}
                  </p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {selectedItem.luckyNumbers.map((n) => (
                      <span key={n} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "30px", height: "30px", borderRadius: "50%", background: colors.badge, color: colors.text, fontWeight: 700, fontSize: "0.88rem" }}>
                        {n}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Lucky color */}
                <div style={{ flex: "1 1 auto", background: "var(--veil-white-55)", border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "10px 14px" }}>
                  <p style={{ margin: 0, fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: colors.text, marginBottom: "5px" }}>
                    {en ? "Lucky Colour" : "அதிர்ஷ்ட நிறம்"}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--cl-ink)" }}>{selectedItem.luckyColor[lang]}</span>
                  </div>
                </div>
              </div>

              {/* Pariharam */}
              <div style={{ background: "var(--veil-white-55)", border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "12px 14px" }}>
                <p style={{ margin: "0 0 5px", fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: colors.text }}>
                  {en ? "Pariharam (Today's Remedy)" : "பரிகாரம் (இன்றைய தினம்)"}
                </p>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--cl-ink-2)", lineHeight: 1.6 }}>
                  {selectedItem.pariharam[lang]}
                </p>
              </div>

            </div>
          </div>
        );
      })()}

      {/* All 12 rasis grid */}
      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--cl-muted)" }}>
            {en ? "All 12 Rasis" : "12 ராசிகள் அனைத்தும்"}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
            {data.results.map((item) => (
              <RasiCard
                key={item.rasi}
                item={item}
                lang={lang}
                isSelected={item.rasi === selectedRasi}
                onClick={() => setSelectedRasi(item.rasi)}
              />
            ))}
          </div>
        </div>
      )}

      {/* CTA — omitted when embedded in the dashboard (hideCta): "Get started
          free" pointing back at /dashboard is a marketing-site upsell that
          makes no sense for a user who's already logged in and viewing this
          tool inside their own dashboard. */}
      {data && !hideCta && (
        <div className="cl-mobile-card-split" style={{
          background: "var(--cl-brand-tint)", border: "1px solid var(--cl-brand-ring-md)",
          borderRadius: "14px", padding: "18px 22px",
        }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600, color: "var(--cl-ink)", fontSize: "0.92rem" }}>
              {en ? "Get rasipalan matched to your personal chart" : "உங்கள் ஜாதகத்துடன் பொருந்திய ராசிபலன் பெறுங்கள்"}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--cl-muted)" }}>
              {en
                ? "Free account — daily guidance combining your dasha, natal chart, and panchangam."
                : "இலவச கணக்கு — தசை, ஜாதகம், பஞ்சாங்கம் ஒன்றாக இணைந்த தினசரி வழிகாட்டுதல்."}
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
      )}
    </div>
  );
}
