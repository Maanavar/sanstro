import type { Metadata } from "next";
import { JsonLd } from "@/lib/json-ld";
import { AlertTriangle } from "lucide-react";
import { redirect } from "next/navigation";
import { LocalizedLink as Link } from "@/components/localized-link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { t, tNakshatra, tTithi, tWeekday, tYoga, tKarana, tPlanetLord, tMoonPhase, tSoolamDirection, tParigaram, tNethiram, tJeevan, tAmirdhadhiYogam, type Lang } from "@/lib/i18n";
import { tFestival, tFestivalCategory } from "@/lib/festival-names";
import { formatClockLabel, formatDateLabelIn, addDays, formatHijriDate } from "@/lib/format";
import { withTamilTwin } from "@/lib/localized-metadata";
import { getServerLang } from "@/lib/server-lang";
import { localizePath } from "@/lib/ta-routes";
import type { PanchangamDailyResponseData } from "@/lib/types";
import { PanchangamShareButton } from "@/components/public-share-card";
import { PanchangamShareCard } from "@/components/panchangam-share-card";
import { ThirukanithamBadge } from "@/components/thirukanitham-badge";
import { PanchangamDatePicker } from "@/components/panchangam-date-picker";
import { backendUrl } from "@/lib/backend-url";

const DEFAULT_LAT = "13.0827";
const DEFAULT_LNG = "80.2707";
const DEFAULT_TZ = "Asia/Kolkata";
const DEFAULT_CITY = "Chennai";
const DEFAULT_CITY_TA = "சென்னை";

async function fetchPanchangam(date: string): Promise<PanchangamDailyResponseData | null> {
  try {
    const url = `${backendUrl()}/api/v1/public/panchangam?date=${date}&lat=${DEFAULT_LAT}&lng=${DEFAULT_LNG}&timezone=${encodeURIComponent(DEFAULT_TZ)}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json() as { success?: boolean; data?: PanchangamDailyResponseData };
    return json.data ?? null;
  } catch {
    return null;
  }
}

type Props = { params: Promise<{ date: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { title: "Panchangam" };

  const data = await fetchPanchangam(date);
  const path = `/panchangam/${date}` as const;
  const dateLabel = formatDateLabelIn(date, "en");
  const dateLabelTa = formatDateLabelIn(date, "ta");
  const title = `Tamil Panchangam ${dateLabel} — Tithi, Nakshatra & Muhurtham`;
  const titleTa = `${dateLabelTa} தமிழ் பஞ்சாங்கம்: திதி, நட்சத்திரம், முகூர்த்தம்`;

  let description = `Tamil Panchangam for ${dateLabel}. Thirukanitham-based calculation. Set your city for local sunrise, Rahu Kalam, and Nalla Neram timings.`;
  let descriptionTa = `${dateLabelTa} அன்றைய தமிழ் பஞ்சாங்கம். திருக்கணித முறையில் கணிக்கப்பட்டது. உங்கள் நகரத்தை அமைத்தால் உள்ளூர் சூரிய உதயம், ராகு காலம், நல்ல நேரம் தெரியும்.`;
  if (data) {
    const range = (start: string, end: string, l: Lang) => `${formatClockLabel(start, l)}–${formatClockLabel(end, l)}`;
    const nalla = (l: Lang) => (data.kalam.nallaNeram[0] ? range(data.kalam.nallaNeram[0].start, data.kalam.nallaNeram[0].end, l) : null);
    description = `${tWeekday(data.vara.weekday, "en")} ${dateLabel}: Tithi ${tTithi(data.tithi.name, "en")}, Nakshatra ${tNakshatra(data.nakshatra.name, "en")}. Rahu Kalam ${range(data.kalam.rahuKalam.start, data.kalam.rahuKalam.end, "en")}. Nalla Neram ${nalla("en") ?? "not available"}. Thirukanitham-based panchangam (default city: Chennai). Set your city for local timings.`;
    descriptionTa = `${tWeekday(data.vara.weekday, "ta")} ${dateLabelTa}: திதி ${tTithi(data.tithi.name, "ta")}, நட்சத்திரம் ${tNakshatra(data.nakshatra.name, "ta")}. ராகு காலம் ${range(data.kalam.rahuKalam.start, data.kalam.rahuKalam.end, "ta")}. நல்ல நேரம் ${nalla("ta") ?? "கிடைக்கவில்லை"}. திருக்கணித பஞ்சாங்கம் (இயல்பு நகரம்: சென்னை). உள்ளூர் நேரங்களுக்கு உங்கள் நகரத்தை அமைக்கவும்.`;
  }

  return withTamilTwin(
    {
      title,
      description,
      keywords: ["Tamil panchangam", `panchangam ${date}`, "Rahu kalam today", "Nalla neram", "Tithi Nakshatra today", "Thirukanitham panchangam"],
      alternates: { canonical: `https://vinaadi.com${path}` },
      openGraph: { title, description, url: `https://vinaadi.com${path}`, type: "website" },
      twitter: { card: "summary", title, description },
    },
    path,
    {
      title: titleTa,
      description: descriptionTa,
      keywords: ["தமிழ் பஞ்சாங்கம்", "இன்றைய பஞ்சாங்கம்", "ராகு காலம் இன்று", "நல்ல நேரம் இன்று", "இன்றைய திதி நட்சத்திரம்", "திருக்கணித பஞ்சாங்கம்"],
    },
  );
}

// ── Display helpers ────────────────────────────────────────────────────────────

function clockRange(start: string, end: string, lang: Lang) {
  return `${formatClockLabel(start, lang)} – ${formatClockLabel(end, lang)}`;
}

// One label, in the active language: the page no longer prints "English · Tamil"
// pairs (owner ruling: active language only, no bilingual echo).
function DataCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: "var(--cl-bg-2)", border: "1px solid var(--cl-border)",
      borderRadius: "10px", padding: "14px 16px",
    }}>
      <p style={{ margin: "0 0 2px", fontSize: "0.63rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--cl-muted)" }}>
        {label}
      </p>
      <p style={{ margin: "0 0 2px", fontSize: "1rem", fontWeight: 700, color: "var(--cl-ink)" }}>{value}</p>
      {sub && <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--cl-muted)" }}>{sub}</p>}
    </div>
  );
}

function TimeRow({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "hold" | "good" | "neutral" }) {
  const color = tone === "hold" ? "#f87171" : tone === "good" ? "#4ade80" : "var(--cl-ink)";
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 16px", borderBottom: "1px solid var(--cl-border)",
    }}>
      <span style={{ fontSize: "0.86rem", color: "var(--cl-ink)" }}>{label}</span>
      <span style={{ fontSize: "0.86rem", fontWeight: 600, color }}>{value}</span>
    </div>
  );
}

function SectionHead({ title }: { title: string }) {
  return (
    <p style={{ margin: "0 0 14px", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--cl-muted)" }}>
      {title}
    </p>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default async function PanchangamDatePage({ params }: Props) {
  const { date } = await params;
  const lang = await getServerLang();
  // The same words in the reader's language. Written inline, page-local: these
  // strings exist nowhere else, so a catalog entry would only add indirection.
  const L = (en: string, ta: string) => (lang === "ta" ? ta : en);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) redirect(localizePath("/panchangam/today", lang));

  const data = await fetchPanchangam(date);
  const prevDate = addDays(date, -1);
  const nextDate = addDays(date, 1);
  const dateLabel = formatDateLabelIn(date, lang);
  const hijri = formatHijriDate(date);
  const city = L(DEFAULT_CITY, DEFAULT_CITY_TA);
  const clock = (v: string) => formatClockLabel(v, lang);
  const range = (s: string, e: string) => clockRange(s, e, lang);
  // "Ends 3:10 pm · then Pournami" / "மதியம் 3:10 வரை · அடுத்து பௌர்ணமி"
  const endsThen = (endsAt: string, next: string) =>
    lang === "ta" ? `${clock(endsAt)} வரை · அடுத்து ${next}` : `Ends ${clock(endsAt)} · then ${next}`;

  const PAGE_JSONLD = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: L(`Tamil Panchangam ${dateLabel} — Thirukanitham Calculation`, `${dateLabel} தமிழ் பஞ்சாங்கம்: திருக்கணித கணிப்பு`),
    url: `https://vinaadi.com${lang === "ta" ? "/ta" : ""}/panchangam/${date}`,
    description: L(
      `Daily Tamil panchangam for ${dateLabel}. Tithi, Nakshatra, Yoga, Karana, Rahu Kalam, Nalla Neram, and auspicious timings. Thirukanitham-based sidereal calculation.`,
      `${dateLabel} அன்றைய தமிழ் பஞ்சாங்கம்: திதி, நட்சத்திரம், யோகம், கரணம், ராகு காலம், நல்ல நேரம் மற்றும் சுப நேரங்கள். திருக்கணித நிரயன கணிப்பு.`,
    ),
    datePublished: date,
    inLanguage: lang,
  };

  return (
    <div className="clarity-shell">
      <PublicNav />
      <main>
        {/* Built above in the reader's language, so both sides are the same block. */}
        <JsonLd en={PAGE_JSONLD} ta={PAGE_JSONLD} />

        {/* Hero */}
        <section className="cl-pub-hero" style={{ paddingBottom: "24px" }}>
          <div className="cl-container">
            <p className="cl-eyebrow">{L("Daily Panchangam", "தினசரி பஞ்சாங்கம்")}</p>
            <h1 className="cl-pub-h1" style={{ maxWidth: "28ch" }}>
              {dateLabel} — {city}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
              <p className="cl-pub-lead" style={{ margin: 0 }}>
                {L("Thirukanitham-based · Sunrise-adjusted timings", "திருக்கணித முறை · சூரிய உதயத்திற்கு ஏற்ற நேரங்கள்")}
              </p>
              <ThirukanithamBadge size="sm" />
            </div>
            <div
              style={{
                marginBottom: "20px",
                maxWidth: "52rem",
                padding: "12px 14px",
                borderRadius: "12px",
                border: "1px solid #E0C29E",
                background: "#FFF7ED",
                color: "#6C4B32",
                lineHeight: 1.6,
              }}
            >
              {L("Showing panchangam for Chennai by default. ", "இயல்பாக சென்னைக்கான பஞ்சாங்கம் காட்டப்படுகிறது. ")}
              <Link href="/tools/daily-panchangam-planner" style={{ color: "var(--cl-accent)", fontWeight: 700, textDecoration: "none" }}>
                {L("Set your city", "உங்கள் நகரத்தை அமைக்கவும்")}
              </Link>
              {L(" for accurate sunrise, Rahu Kalam, and Nalla Neram.", " துல்லியமான சூரிய உதயம், ராகு காலம், நல்ல நேரத்திற்கு.")}
            </div>

            {/* Date navigation */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Link href={`/panchangam/${prevDate}`} style={{
                padding: "6px 14px", borderRadius: "8px", fontSize: "0.82rem", fontWeight: 600,
                border: "1.5px solid var(--cl-border)", background: "var(--cl-surface)",
                color: "var(--cl-ink)", textDecoration: "none",
              }}>
                ← {formatDateLabelIn(prevDate, lang)}
              </Link>
              <Link href="/panchangam/today" style={{
                padding: "6px 14px", borderRadius: "8px", fontSize: "0.82rem", fontWeight: 600,
                border: "1.5px solid var(--cl-border)", background: "var(--cl-surface)",
                color: "var(--cl-ink)", textDecoration: "none",
              }}>
                {L("Today", "இன்று")}
              </Link>
              <Link href={`/panchangam/${nextDate}`} style={{
                padding: "6px 14px", borderRadius: "8px", fontSize: "0.82rem", fontWeight: 600,
                border: "1.5px solid var(--cl-border)", background: "var(--cl-surface)",
                color: "var(--cl-ink)", textDecoration: "none",
              }}>
                {formatDateLabelIn(nextDate, lang)} →
              </Link>
              <PanchangamDatePicker date={date} />
            </div>

            {data?.isKarinaal && (
              <Link
                href="/tamil-calendar/karinaal-2026"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px", marginTop: "16px",
                  padding: "8px 16px", borderRadius: "10px", textDecoration: "none",
                  background: "#FBE9E7", border: "1.5px solid #E0A89C", color: "#8A2B16",
                  fontWeight: 700, fontSize: "0.85rem",
                }}
              >
                <AlertTriangle size={14} strokeWidth={2} aria-hidden="true" />
                {L(
                  "Karinaal: an inauspicious day, avoid new auspicious starts →",
                  "கரிநாள்: புதிய சுப காரியங்களைத் தொடங்காமல் இருப்பது நல்லது →",
                )}
              </Link>
            )}
          </div>
        </section>

        {data ? (
          <section style={{ paddingBottom: "64px" }}>
            <div className="cl-container" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

              {/* Five elements */}
              <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "16px", padding: "22px 24px" }}>
                <SectionHead title={L("Five Elements", "ஐந்து அங்கங்கள்")} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                  <DataCard label={L("Tithi", "திதி")} value={tTithi(data.tithi.name, lang)} sub={endsThen(data.tithi.endsAt, tTithi(data.tithi.nextName, lang))} />
                  <DataCard label={L("Vara", "வாரம்")} value={tWeekday(data.vara.weekday, lang)} sub={`${L("Lord", "அதிபதி")}: ${tPlanetLord(data.vara.lord, lang)}`} />
                  <DataCard label={L("Nakshatra", "நட்சத்திரம்")} value={tNakshatra(data.nakshatra.name, lang)} sub={`${L("Pada", "பாதம்")} ${data.nakshatra.pada} · ${endsThen(data.nakshatra.endsAt, tNakshatra(data.nakshatra.nextName, lang))}`} />
                  <DataCard label={L("Yoga", "யோகம்")} value={tYoga(data.yoga.name, lang)} sub={`${L("Yoga", "யோகம்")} ${data.yoga.number} · ${lang === "ta" ? `${clock(data.yoga.endsAt)} வரை` : `Ends ${clock(data.yoga.endsAt)}`}`} />
                  <DataCard label={L("Karana", "கரணம்")} value={tKarana(data.karana.name, lang)} sub={endsThen(data.karana.endsAt, tKarana(data.karana.nextName, lang))} />
                  {data.tamilDate && (
                    <DataCard label={L("Tamil Date", "தமிழ் தேதி")} value={(lang === "ta" ? data.tamilDate.ta : data.tamilDate.en) ?? ""} />
                  )}
                  {hijri && (
                    <DataCard
                      label={L("Islamic Date", "இஸ்லாமிய தேதி")}
                      value={lang === "ta" ? hijri.ta : hijri.en}
                      sub={L("May vary by a day with moon sighting", "பிறைப் பார்வையால் ±1 நாள் மாறலாம்")}
                    />
                  )}
                </div>
              </div>

              {/* Sunrise / Sunset */}
              <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "14px", padding: "18px 22px" }}>
                <SectionHead title={L("Sun Timings", "சூரியன்")} />
                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                  {[
                    { label: L("Sunrise", "சூரிய உதயம்"), value: clock(data.sunrise) },
                    { label: L("Sunset", "சூரிய அஸ்தமனம்"), value: clock(data.sunset) },
                    { label: L("Solar Noon", "மத்தியான்னம்"), value: clock(data.solarNoon) },
                  ].map(item => (
                    <div key={item.label}>
                      <p style={{ margin: "0 0 2px", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--cl-muted)" }}>{item.label}</p>
                      <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--cl-ink)" }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inauspicious timings */}
              <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "14px", overflow: "hidden" }}>
                <div style={{ padding: "18px 22px 6px" }}>
                  <SectionHead title={L("Inauspicious Windows", "தவிர்க்க வேண்டிய நேரங்கள்")} />
                </div>
                <TimeRow label={L("Rahu Kalam", "ராகு காலம்")} value={range(data.kalam.rahuKalam.start, data.kalam.rahuKalam.end)} tone="hold" />
                <TimeRow label={L("Yamagandam", "எமகண்டம்")} value={range(data.kalam.yamagandam.start, data.kalam.yamagandam.end)} tone="hold" />
                {(data.kalam.durmuhurtham ?? []).map((slot, index) => (
                  <TimeRow
                    key={`dur-${index}`}
                    label={L("Durmuhurtham · avoid auspicious/new beginnings", "துர்முகூர்த்தம் · சுப, புதிய தொடக்கங்களைத் தவிர்ப்பது நல்லது")}
                    value={range(slot.start, slot.end)}
                    tone="hold"
                  />
                ))}
              </div>

              {/* Kuligai is activity-dependent, not part of the general avoid register. */}
              <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "14px", overflow: "hidden" }}>
                <div style={{ padding: "18px 22px 6px" }}>
                  <SectionHead title={L("Activity-dependent Window", "செயலைப் பொறுத்த நேரம்")} />
                </div>
                <TimeRow
                  label={L(
                    "Kuligai · for activities meant to repeat, continue or grow",
                    "குளிகை · மீண்டும் நிகழ, தொடர அல்லது வளர வேண்டிய செயல்களுக்கு",
                  )}
                  value={range(data.kalam.kuligai.start, data.kalam.kuligai.end)}
                />
              </div>

              {/* Auspicious timings */}
              <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "14px", overflow: "hidden" }}>
                <div style={{ padding: "18px 22px 6px" }}>
                  <SectionHead title={L("Auspicious Timings", "நல்ல நேரம்")} />
                </div>
                {data.kalam.nallaNeram.map((slot, i) => (
                  <TimeRow key={i} label={L("Nalla Neram", "நல்ல நேரம்")} value={range(slot.start, slot.end)} tone="good" />
                ))}
                {data.kalam.gowriNallaNeram?.map((slot, i) => (
                  <TimeRow key={i} label={L("Gowri Nalla Neram", "கௌரி நல்ல நேரம்")} value={range(slot.start, slot.end)} tone="good" />
                ))}
                <TimeRow
                  label={L("Abhijit Muhurta", "அபிஜித் முகூர்த்தம்")}
                  value={data.abhijit.isRestrictedByWeekday ? L("Restricted today", "இன்று விலக்கப்பட்டது") : range(data.abhijit.start, data.abhijit.end)}
                  tone={data.abhijit.isRestrictedByWeekday ? "hold" : "good"}
                />
              </div>

              {/* Subha Muhurtham */}
              {data.subhaMuhurtham && (
                <div style={{
                  background: data.subhaMuhurtham.isSubha ? "rgba(74,222,128,0.06)" : "rgba(248,113,113,0.06)",
                  border: `1px solid ${data.subhaMuhurtham.isSubha ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)"}`,
                  borderRadius: "12px", padding: "16px 20px",
                }}>
                  <p style={{ margin: "0 0 4px", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--cl-muted)" }}>
                    {L("Subha Muhurtham", "சுபமுகூர்த்தம்")}
                  </p>
                  <p style={{ margin: "0 0 4px", fontSize: "1rem", fontWeight: 700, color: data.subhaMuhurtham.isSubha ? "#4ade80" : "#f87171" }}>
                    {data.subhaMuhurtham.isSubha
                      ? L("Auspicious Day", "சுபமுகூர்த்த நாள்")
                      : L("Not recommended for ceremonies", "சுப நிகழ்வுகளுக்கு ஏற்ற நாள் அல்ல")}
                  </p>
                  {/* The backend's reason is an English engine string; it is not
                      shown on the Tamil page rather than printing English there. */}
                  {lang === "en" && (
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--cl-ink-2)" }}>{data.subhaMuhurtham.reason}</p>
                  )}
                </div>
              )}

              {/* Festivals */}
              {data.festivals && data.festivals.length > 0 && (
                <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "14px", padding: "18px 22px" }}>
                  <SectionHead title={L("Festivals & Observances", "விழாக்கள்")} />
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {data.festivals.map((f, i) => (
                      <div key={i} style={{ padding: "8px 12px", background: "var(--cl-bg-2)", borderRadius: "8px", border: "1px solid var(--cl-border)" }}>
                        <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600, color: "var(--cl-ink)" }}>{tFestival(f.name, lang)}</p>
                        <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "var(--cl-muted)", textTransform: "capitalize" }}>{tFestivalCategory(f.category, lang)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional details */}
              <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "14px", padding: "18px 22px" }}>
                <SectionHead title={L("Additional Details", "மேலும் விவரங்கள்")} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
                  <DataCard label={L("Moon Phase", "சந்திர கலை")} value={tMoonPhase(data.moonPhaseLabel, lang)} />
                  <DataCard label={L("Soolam", "சூலம்")} value={tSoolamDirection(data.soolam.direction, lang)} sub={`${L("Parigaram", "பரிகாரம்")}: ${tParigaram(data.soolam.parigaram, lang)}`} />
                  {data.nethiram && <DataCard label={L("Nethiram", "நேத்திரம்")} value={tNethiram(data.nethiram, lang)} sub={t("nethiram_jeevan_hint", lang)} />}
                  {data.jeevan && <DataCard label={L("Jeevan", "ஜீவன்")} value={tJeevan(data.jeevan, lang)} sub={t("nethiram_jeevan_hint", lang)} />}
                  <DataCard label={L("Amirdhadhi Yogam", "அமிர்தாதி யோகம்")} value={tAmirdhadhiYogam(data.amirdhadhiYogam.name, lang)} sub={lang === "ta" ? `${clock(data.amirdhadhiYogam.endsAt)} வரை` : `Ends ${clock(data.amirdhadhiYogam.endsAt)}`} />
                </div>
              </div>

              {/* Share — festive WhatsApp card (deity + festival themes, 9:16 / 1:1) */}
              <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
                <PanchangamShareCard lang={lang} date={date} city={DEFAULT_CITY} />
              </div>

              {/* Legacy share button (text card) */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <PanchangamShareButton data={{
                  dateLabel,
                  cityName: city,
                  tithi: tTithi(data.tithi.name, lang),
                  nakshatra: tNakshatra(data.nakshatra.name, lang),
                  vara: tWeekday(data.vara.weekday, lang),
                  yoga: data.yoga?.name,
                  karana: data.karana?.name,
                  sunrise: clock(data.sunrise),
                  sunset: clock(data.sunset),
                  rahuKalamStart: clock(data.kalam.rahuKalam.start),
                  rahuKalamEnd: clock(data.kalam.rahuKalam.end),
                  nallaNeram: data.kalam.nallaNeram[0]
                    ? range(data.kalam.nallaNeram[0].start, data.kalam.nallaNeram[0].end)
                    : "—",
                  lang,
                }} />
              </div>

              {/* Date nav footer */}
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px" }}>
                <Link href={`/panchangam/${prevDate}`} style={{ fontSize: "0.84rem", color: "var(--cl-ink-2)", textDecoration: "none" }}>
                  ← {formatDateLabelIn(prevDate, lang)}
                </Link>
                <Link href={`/panchangam/${nextDate}`} style={{ fontSize: "0.84rem", color: "var(--cl-ink-2)", textDecoration: "none" }}>
                  {formatDateLabelIn(nextDate, lang)} →
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <section style={{ padding: "40px 0 64px" }}>
            <div className="cl-container">
              <p style={{ color: "var(--cl-muted)", marginBottom: "16px" }}>
                {L("Could not load panchangam for this date.", "இந்தத் தேதிக்கான பஞ்சாங்கத்தை ஏற்ற முடியவில்லை.")}
              </p>
              <Link href="/tools/daily-panchangam-planner" style={{
                display: "inline-flex", padding: "9px 22px", background: "var(--cl-ink)", color: "var(--cl-bg)",
                borderRadius: "999px", fontWeight: 600, fontSize: "0.88rem", textDecoration: "none",
              }}>
                {L("Try the interactive tool →", "இயங்கும் கருவியைப் பயன்படுத்துங்கள் →")}
              </Link>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">{L("Get panchangam connected to your chart", "பஞ்சாங்கத்தை உங்கள் ஜாதகத்துடன் இணையுங்கள்")}</h2>
              <p className="cl-cta-strip__body">
                {L(
                  "Create a free account for daily guidance that combines your chart, dasa, and panchangam together.",
                  "உங்கள் ஜாதகம், தசை, பஞ்சாங்கம் மூன்றையும் இணைத்த தினசரி வழிகாட்டுதலுக்கு இலவசக் கணக்கை உருவாக்குங்கள்.",
                )}
              </p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">{L("Get started free →", "இலவசமாகத் தொடங்குங்கள் →")}</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
