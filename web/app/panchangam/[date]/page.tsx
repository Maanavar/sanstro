import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { tNakshatra, tTithi, tWeekday, tYoga, tKarana, tPlanetLord } from "@/lib/i18n";
import { formatClockLabel, formatDateLabel, addDays } from "@/lib/format";
import type { PanchangamDailyResponseData } from "@/lib/types";
import { PanchangamShareButton } from "@/components/public-share-card";
import { PanchangamShareCard } from "@/components/panchangam-share-card";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
const DEFAULT_LAT = "13.0827";
const DEFAULT_LNG = "80.2707";
const DEFAULT_TZ = "Asia/Kolkata";
const DEFAULT_CITY = "Chennai";

async function fetchPanchangam(date: string): Promise<PanchangamDailyResponseData | null> {
  try {
    const url = `${BACKEND_URL}/api/v1/public/panchangam?date=${date}&lat=${DEFAULT_LAT}&lng=${DEFAULT_LNG}&timezone=${encodeURIComponent(DEFAULT_TZ)}`;
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { title: "Panchangam | Vinaadi" };

  const data = await fetchPanchangam(date);
  const dateLabel = formatDateLabel(date);
  const title = `Tamil Panchangam ${dateLabel} — Tithi, Nakshatra & Muhurtham | Vinaadi`;

  let description = `Tamil panchangam for ${dateLabel}, ${DEFAULT_CITY}. Includes Tithi, Nakshatra, Rahu Kalam, Nalla Neram, and auspicious timings.`;
  if (data) {
    const tithi = tTithi(data.tithi.name, "en");
    const nakshatra = tNakshatra(data.nakshatra.name, "en");
    const vara = tWeekday(data.vara.weekday, "en");
    const rahuStart = formatClockLabel(data.kalam.rahuKalam.start);
    const rahuEnd = formatClockLabel(data.kalam.rahuKalam.end);
    const nallaNeram = data.kalam.nallaNeram[0]
      ? `${formatClockLabel(data.kalam.nallaNeram[0].start)}–${formatClockLabel(data.kalam.nallaNeram[0].end)}`
      : "not available";
    description = `${vara} ${dateLabel}, ${DEFAULT_CITY}: Tithi ${tithi}, Nakshatra ${nakshatra}. Rahu Kalam ${rahuStart}–${rahuEnd}. Nalla Neram ${nallaNeram}. Thirukanitham-based calculation.`;
  }

  return {
    title,
    description,
    keywords: ["Tamil panchangam", `panchangam ${date}`, "Rahu kalam today", "Nalla neram", "Tithi Nakshatra today", DEFAULT_CITY.toLowerCase() + " panchangam"],
    alternates: { canonical: `https://vinaadi.com/panchangam/${date}` },
    openGraph: { title, description, url: `https://vinaadi.com/panchangam/${date}`, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

// ── Display helpers ────────────────────────────────────────────────────────────

function clockRange(start: string, end: string) {
  return `${formatClockLabel(start)} – ${formatClockLabel(end)}`;
}

function DataCard({ label, labelTa, value, sub }: { label: string; labelTa: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: "var(--cl-bg-2)", border: "1px solid var(--cl-border)",
      borderRadius: "10px", padding: "14px 16px",
    }}>
      <p style={{ margin: "0 0 2px", fontSize: "0.63rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--cl-muted)" }}>
        {label} · <span style={{ fontWeight: 400 }}>{labelTa}</span>
      </p>
      <p style={{ margin: "0 0 2px", fontSize: "1rem", fontWeight: 700, color: "var(--cl-ink)" }}>{value}</p>
      {sub && <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--cl-muted)" }}>{sub}</p>}
    </div>
  );
}

function TimeRow({ label, labelTa, value, tone = "neutral" }: { label: string; labelTa: string; value: string; tone?: "hold" | "good" | "neutral" }) {
  const color = tone === "hold" ? "#f87171" : tone === "good" ? "#4ade80" : "var(--cl-ink)";
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 16px", borderBottom: "1px solid var(--cl-border)",
    }}>
      <span style={{ fontSize: "0.86rem", color: "var(--cl-ink)" }}>
        {label} <span style={{ fontSize: "0.75rem", color: "var(--cl-muted)" }}>· {labelTa}</span>
      </span>
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

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) redirect("/panchangam/today");

  const data = await fetchPanchangam(date);
  const prevDate = addDays(date, -1);
  const nextDate = addDays(date, 1);
  const dateLabel = formatDateLabel(date);

  const PAGE_JSONLD = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Tamil Panchangam ${dateLabel} — ${DEFAULT_CITY}`,
    url: `https://vinaadi.com/panchangam/${date}`,
    description: `Daily Tamil panchangam for ${dateLabel}. Tithi, Nakshatra, Yoga, Karana, Rahu Kalam, Nalla Neram, and auspicious timings for ${DEFAULT_CITY}.`,
    datePublished: date,
    inLanguage: ["en", "ta"],
  };

  return (
    <div className="clarity-shell">
      <PublicNav />
      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(PAGE_JSONLD) }}
        />

        {/* Hero */}
        <section className="cl-pub-hero" style={{ paddingBottom: "24px" }}>
          <div className="cl-container">
            <p className="cl-eyebrow">Daily Panchangam · தினசரி பஞ்சாங்கம்</p>
            <h1 className="cl-pub-h1" style={{ maxWidth: "28ch" }}>
              {dateLabel} — {DEFAULT_CITY}
            </h1>
            <p className="cl-pub-lead" style={{ marginBottom: "20px" }}>
              Thirukanitham-based · Sunrise-adjusted timings
            </p>

            {/* Date navigation */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Link href={`/panchangam/${prevDate}`} style={{
                padding: "6px 14px", borderRadius: "8px", fontSize: "0.82rem", fontWeight: 600,
                border: "1.5px solid var(--cl-border)", background: "var(--cl-surface)",
                color: "var(--cl-ink)", textDecoration: "none",
              }}>
                ← {formatDateLabel(prevDate)}
              </Link>
              <Link href="/panchangam/today" style={{
                padding: "6px 14px", borderRadius: "8px", fontSize: "0.82rem", fontWeight: 600,
                border: "1.5px solid var(--cl-border)", background: "var(--cl-surface)",
                color: "var(--cl-ink)", textDecoration: "none",
              }}>
                Today
              </Link>
              <Link href={`/panchangam/${nextDate}`} style={{
                padding: "6px 14px", borderRadius: "8px", fontSize: "0.82rem", fontWeight: 600,
                border: "1.5px solid var(--cl-border)", background: "var(--cl-surface)",
                color: "var(--cl-ink)", textDecoration: "none",
              }}>
                {formatDateLabel(nextDate)} →
              </Link>
            </div>
          </div>
        </section>

        {data ? (
          <section style={{ paddingBottom: "64px" }}>
            <div className="cl-container" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

              {/* Five elements */}
              <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "16px", padding: "22px 24px" }}>
                <SectionHead title="Five Elements · ஐந்து அங்கங்கள்" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                  <DataCard label="Tithi" labelTa="திதி" value={tTithi(data.tithi.name, "en")} sub={`Ends ${formatClockLabel(data.tithi.endsAt)} · then ${tTithi(data.tithi.nextName, "en")}`} />
                  <DataCard label="Vara" labelTa="வாரம்" value={tWeekday(data.vara.weekday, "en")} sub={`Lord: ${tPlanetLord(data.vara.lord, "en")}`} />
                  <DataCard label="Nakshatra" labelTa="நட்சத்திரம்" value={tNakshatra(data.nakshatra.name, "en")} sub={`Pada ${data.nakshatra.pada} · Ends ${formatClockLabel(data.nakshatra.endsAt)} · then ${tNakshatra(data.nakshatra.nextName, "en")}`} />
                  <DataCard label="Yoga" labelTa="யோகம்" value={tYoga(data.yoga.name, "en")} sub={`Yoga ${data.yoga.number} · Ends ${formatClockLabel(data.yoga.endsAt)}`} />
                  <DataCard label="Karana" labelTa="கரணம்" value={tKarana(data.karana.name, "en")} sub={`Ends ${formatClockLabel(data.karana.endsAt)} · then ${tKarana(data.karana.nextName, "en")}`} />
                  {data.tamilDate && (
                    <DataCard label="Tamil Date" labelTa="தமிழ் தேதி" value={data.tamilDate.en ?? ""} sub={data.tamilDate.ta ?? undefined} />
                  )}
                </div>
              </div>

              {/* Sunrise / Sunset */}
              <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "14px", padding: "18px 22px" }}>
                <SectionHead title="Sun Timings · சூரியன்" />
                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                  {[
                    { label: "Sunrise", labelTa: "சூரிய உதயம்", value: formatClockLabel(data.sunrise) },
                    { label: "Sunset", labelTa: "சூரிய அஸ்தமனம்", value: formatClockLabel(data.sunset) },
                    { label: "Solar Noon", labelTa: "மத்தியான்னம்", value: formatClockLabel(data.solarNoon) },
                  ].map(item => (
                    <div key={item.label}>
                      <p style={{ margin: "0 0 2px", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--cl-muted)" }}>{item.label} · {item.labelTa}</p>
                      <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--cl-ink)" }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inauspicious timings */}
              <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "14px", overflow: "hidden" }}>
                <div style={{ padding: "18px 22px 6px" }}>
                  <SectionHead title="Inauspicious Windows · தவிர்க்க வேண்டிய நேரம்" />
                </div>
                <TimeRow label="Rahu Kalam" labelTa="ராகு காலம்" value={clockRange(data.kalam.rahuKalam.start, data.kalam.rahuKalam.end)} tone="hold" />
                <TimeRow label="Yamagandam" labelTa="எமகண்டம்" value={clockRange(data.kalam.yamagandam.start, data.kalam.yamagandam.end)} tone="hold" />
                <TimeRow label="Kuligai" labelTa="குளிகை" value={clockRange(data.kalam.kuligai.start, data.kalam.kuligai.end)} tone="hold" />
              </div>

              {/* Auspicious timings */}
              <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "14px", overflow: "hidden" }}>
                <div style={{ padding: "18px 22px 6px" }}>
                  <SectionHead title="Auspicious Timings · நல்ல நேரம்" />
                </div>
                {data.kalam.nallaNeram.map((slot, i) => (
                  <TimeRow key={i} label="Nalla Neram" labelTa="நல்ல நேரம்" value={clockRange(slot.start, slot.end)} tone="good" />
                ))}
                {data.kalam.gowriNallaNeram?.map((slot, i) => (
                  <TimeRow key={i} label="Gowri Nalla Neram" labelTa="கௌரி நல்ல நேரம்" value={clockRange(slot.start, slot.end)} tone="good" />
                ))}
                <TimeRow
                  label="Abhijit Muhurta"
                  labelTa="அபிஜித் முகூர்த்தம்"
                  value={data.abhijit.isRestrictedByWeekday ? "Restricted today" : clockRange(data.abhijit.start, data.abhijit.end)}
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
                    Subha Muhurtham · சுபமுகூர்த்தம்
                  </p>
                  <p style={{ margin: "0 0 4px", fontSize: "1rem", fontWeight: 700, color: data.subhaMuhurtham.isSubha ? "#4ade80" : "#f87171" }}>
                    {data.subhaMuhurtham.isSubha ? "Auspicious Day" : "Not recommended for ceremonies"}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--cl-ink-2)" }}>{data.subhaMuhurtham.reason}</p>
                </div>
              )}

              {/* Festivals */}
              {data.festivals && data.festivals.length > 0 && (
                <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "14px", padding: "18px 22px" }}>
                  <SectionHead title="Festivals & Observances · விழாக்கள்" />
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {data.festivals.map((f, i) => (
                      <div key={i} style={{ padding: "8px 12px", background: "var(--cl-bg-2)", borderRadius: "8px", border: "1px solid var(--cl-border)" }}>
                        <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600, color: "var(--cl-ink)" }}>{f.name}</p>
                        <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "var(--cl-muted)", textTransform: "capitalize" }}>{f.category.replace(/_/g, " ")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional details */}
              <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "14px", padding: "18px 22px" }}>
                <SectionHead title="Additional Details · மேலும் விவரங்கள்" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
                  <DataCard label="Moon Phase" labelTa="சந்திர கலை" value={data.moonPhaseLabel} />
                  <DataCard label="Soolam" labelTa="சூலம்" value={data.soolam.direction} sub={`Parigaram: ${data.soolam.parigaram}`} />
                  {data.nethiram && <DataCard label="Nethiram" labelTa="நேத்திரம்" value={data.nethiram} />}
                  {data.jeevan && <DataCard label="Jeevan" labelTa="ஜீவன்" value={data.jeevan} />}
                  <DataCard label="Amirdhadhi Yogam" labelTa="அமிர்தாதி யோகம்" value={data.amirdhadhiYogam.name} sub={`Ends ${formatClockLabel(data.amirdhadhiYogam.endsAt)}`} />
                </div>
              </div>

              {/* Share — festive WhatsApp card (deity + festival themes, 9:16 / 1:1) */}
              <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
                <PanchangamShareCard lang="ta" date={date} city={DEFAULT_CITY} />
              </div>

              {/* Legacy share button (text card) */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <PanchangamShareButton data={{
                  dateLabel,
                  cityName: DEFAULT_CITY,
                  tithi: tTithi(data.tithi.name, "en"),
                  nakshatra: tNakshatra(data.nakshatra.name, "en"),
                  vara: tWeekday(data.vara.weekday, "en"),
                  yoga: data.yoga?.name,
                  karana: data.karana?.name,
                  sunrise: formatClockLabel(data.sunrise),
                  sunset: formatClockLabel(data.sunset),
                  rahuKalamStart: formatClockLabel(data.kalam.rahuKalam.start),
                  rahuKalamEnd: formatClockLabel(data.kalam.rahuKalam.end),
                  nallaNeram: data.kalam.nallaNeram[0]
                    ? `${formatClockLabel(data.kalam.nallaNeram[0].start)} – ${formatClockLabel(data.kalam.nallaNeram[0].end)}`
                    : "—",
                  lang: "en",
                }} />
              </div>

              {/* Date nav footer */}
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px" }}>
                <Link href={`/panchangam/${prevDate}`} style={{ fontSize: "0.84rem", color: "var(--cl-ink-2)", textDecoration: "none" }}>
                  ← {formatDateLabel(prevDate)}
                </Link>
                <Link href={`/panchangam/${nextDate}`} style={{ fontSize: "0.84rem", color: "var(--cl-ink-2)", textDecoration: "none" }}>
                  {formatDateLabel(nextDate)} →
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <section style={{ padding: "40px 0 64px" }}>
            <div className="cl-container">
              <p style={{ color: "var(--cl-muted)", marginBottom: "16px" }}>
                Could not load panchangam for this date.
              </p>
              <Link href="/tools/daily-panchangam-planner" style={{
                display: "inline-flex", padding: "9px 22px", background: "var(--cl-ink)", color: "var(--cl-bg)",
                borderRadius: "999px", fontWeight: 600, fontSize: "0.88rem", textDecoration: "none",
              }}>
                Try the interactive tool →
              </Link>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">Get panchangam connected to your chart</h2>
              <p className="cl-cta-strip__body">Create a free account for daily guidance that combines your chart, dasha, and panchangam together.</p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">Get started free →</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
