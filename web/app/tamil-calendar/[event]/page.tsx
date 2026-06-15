import type { Metadata } from "next";
import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
const YEAR = 2026;

const EVENT_KEYS = [
  "pournami", "amavasai", "pradosham", "ekadhasi", "sankatahara-chathurthi",
  "chathurthi", "sashti", "ashtami", "navami", "karthigai", "thiruvonam",
  "maadha-sivarathiri", "chandra-darisanam", "karinaal",
] as const;

interface BiText { ta: string; en: string }
interface EventSummary { key: string; slug: string; name: BiText; category: string; count: number; nextDate: string | null }
interface EventsList { year: number; source: string; events: EventSummary[] }
interface EventDate { date: string; weekday: BiText; tamilDate: BiText; tamilMonth: BiText; tamilDay: number }
interface EventDetail {
  year: number;
  source: string;
  key: string;
  slug: string;
  name: BiText;
  tagline: BiText;
  category: string;
  summary: BiText;
  significance: BiText;
  keywords: string[];
  count: number;
  nextDate: string | null;
  dates: EventDate[];
}

async function fetchEvent(slug: string): Promise<EventDetail | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/public/panchangam-events/${slug}?year=${YEAR}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as EventDetail;
  } catch {
    return null;
  }
}

async function fetchEvents(): Promise<EventSummary[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/public/panchangam-events?year=${YEAR}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return ((await res.json()) as EventsList).events ?? [];
  } catch {
    return [];
  }
}

export function generateStaticParams() {
  return EVENT_KEYS.map((k) => ({ event: `${k}-${YEAR}` }));
}

function fmt(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
}
function fmtShort(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

type Props = { params: Promise<{ event: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { event } = await params;
  const data = await fetchEvent(event);
  if (!data) return { title: "Tamil Calendar 2026 | Vinaadi" };
  const next = data.nextDate ? `Next: ${fmtShort(data.nextDate)}.` : "";
  const title = `${data.name.en} 2026 Dates (${data.name.ta}) — All ${data.count} Dates | Vinaadi`;
  const description = `${data.name.en} (${data.name.ta}) 2026: all ${data.count} dates with weekday and Tamil date. ${data.summary.en} ${next}`.slice(0, 300);
  return {
    title,
    description,
    keywords: data.keywords,
    alternates: { canonical: `https://vinaadi.com/tamil-calendar/${data.slug}` },
    openGraph: {
      title: `${data.name.en} 2026 — All Dates`,
      description: data.summary.en,
      url: `https://vinaadi.com/tamil-calendar/${data.slug}`,
      type: "website",
    },
  };
}

export default async function EventPage({ params }: Props) {
  const { event } = await params;
  const [data, allEvents] = await Promise.all([fetchEvent(event), fetchEvents()]);

  if (!data) {
    return (
      <div className="clarity-shell">
        <PublicNav />
        <main>
          <section className="cl-pub-hero">
            <div className="cl-container">
              <h1 className="cl-pub-h1">Tamil Calendar 2026</h1>
              <p className="cl-pub-lead">This page is being updated. <Link href="/tamil-calendar">See all special days →</Link></p>
            </div>
          </section>
        </main>
        <PublicFooter />
      </div>
    );
  }

  const isCaution = data.category === "INAUSPICIOUS";
  const faq = [
    {
      q: `When is the next ${data.name.en} in 2026?`,
      a: data.nextDate
        ? `The next ${data.name.en} is on ${fmt(data.nextDate)}.`
        : `All ${data.name.en} dates for 2026 have passed; see the full list above.`,
    },
    {
      q: `How many ${data.name.en} days are there in 2026?`,
      a: `There are ${data.count} ${data.name.en} dates in 2026.`,
    },
    {
      q: `What is ${data.name.en} (${data.name.ta})?`,
      a: `${data.summary.en} ${data.significance.en}`,
    },
  ];

  const faqJsonld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const itemListJsonld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${data.name.en} 2026 Dates`,
    numberOfItems: data.count,
    itemListElement: data.dates.map((d, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${data.name.en} — ${fmtShort(d.date)}`,
    })),
  };

  const accent = isCaution ? "#8A2B16" : "#B85A2C";

  // Cross-navigation: let visitors jump straight to any other special day (and
  // step prev/next) without returning to the hub and re-selecting a card.
  const navEvents = allEvents.length > 0 ? allEvents : [{ slug: data.slug, name: data.name, category: data.category, key: data.key, count: data.count, nextDate: data.nextDate }];
  const currentIdx = navEvents.findIndex((e) => e.slug === data.slug);
  const prevEvent = currentIdx > 0 ? navEvents[currentIdx - 1] : null;
  const nextEvent = currentIdx >= 0 && currentIdx < navEvents.length - 1 ? navEvents[currentIdx + 1] : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonld) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonld) }} />
      <div className="clarity-shell">
        <PublicNav />
        <main>
          <section className="cl-pub-hero" style={{ paddingBottom: "16px" }}>
            <div className="cl-container">
              <p className="cl-eyebrow">
                <Link href="/tamil-calendar" style={{ color: "inherit" }}>Tamil Calendar 2026</Link> · {data.name.ta}
              </p>
              <h1 className="cl-pub-h1" style={{ maxWidth: "26ch" }}>
                {data.name.en} 2026 Dates
              </h1>
              <p className="cl-pub-lead" style={{ marginBottom: "12px" }}>
                {data.summary.en}
              </p>
              <p style={{ fontSize: "0.95rem", color: accent, fontWeight: 600 }}>{data.name.ta} — {data.summary.ta}</p>

              {data.nextDate && (
                <div
                  style={{
                    display: "inline-block", marginTop: "16px", padding: "12px 18px", borderRadius: "12px",
                    background: isCaution ? "#FBE9E7" : "#F2E8D9",
                    border: `1.5px solid ${isCaution ? "#E0A89C" : "#D9C6A6"}`,
                  }}
                >
                  <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--cl-muted, #7A6F5E)" }}>
                    {isCaution ? "Next Karinaal" : `Next ${data.name.en}`}
                  </div>
                  <div style={{ fontSize: "1.15rem", fontWeight: 700, color: accent }}>{fmt(data.nextDate)}</div>
                </div>
              )}
            </div>
          </section>

          {/* Cross-navigation: switch between special days without going back */}
          {navEvents.length > 1 && (
            <div
              style={{
                position: "sticky", top: 0, zIndex: 20,
                background: "var(--cl-surface, #FFF)",
                borderBottom: "1px solid var(--cl-border, #E4DBC8)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <div className="cl-container" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 0", overflowX: "auto" }}>
                <span style={{ flexShrink: 0, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--cl-muted, #7A6F5E)" }}>
                  Jump to:
                </span>
                {navEvents.map((e) => {
                  const isActive = e.slug === data.slug;
                  const caution = e.category === "INAUSPICIOUS";
                  return (
                    <Link
                      key={e.slug}
                      href={`/tamil-calendar/${e.slug}`}
                      style={{
                        flexShrink: 0, padding: "6px 14px", borderRadius: "999px",
                        fontSize: "0.82rem", fontWeight: isActive ? 700 : 600, whiteSpace: "nowrap",
                        textDecoration: "none",
                        border: `1.5px solid ${isActive ? accent : (caution ? "#E0A89C" : "var(--cl-border, #E4DBC8)")}`,
                        background: isActive ? accent : (caution ? "#FCEFEC" : "var(--cl-bg, #FFF)"),
                        color: isActive ? "#FFF" : "var(--cl-ink, #1A1612)",
                      }}
                    >
                      {e.name.en}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <section style={{ paddingBottom: "48px" }}>
            <div className="cl-container">
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", borderBottom: "2px solid var(--cl-border, #ddd)" }}>
                      <th style={{ padding: "8px" }}>#</th>
                      <th style={{ padding: "8px" }}>Date</th>
                      <th style={{ padding: "8px" }}>Weekday</th>
                      <th style={{ padding: "8px" }}>Tamil date</th>
                      <th style={{ padding: "8px" }}>Panchangam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.dates.map((d, i) => (
                      <tr key={d.date} style={{ borderBottom: "1px solid var(--cl-border, #eee)" }}>
                        <td style={{ padding: "8px", color: "var(--cl-muted,#888)" }}>{i + 1}</td>
                        <td style={{ padding: "8px", fontWeight: 600, whiteSpace: "nowrap" }}>{fmtShort(d.date)}</td>
                        <td style={{ padding: "8px" }}>{d.weekday.en} <span style={{ color: accent }}>· {d.weekday.ta}</span></td>
                        <td style={{ padding: "8px", whiteSpace: "nowrap" }}>{d.tamilDate.en} <span style={{ color: accent }}>({d.tamilDate.ta})</span></td>
                        <td style={{ padding: "8px" }}>
                          <Link href={`/panchangam/${d.date}`} style={{ fontSize: "0.85rem" }}>View panchangam →</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="cl-band cl-band--alt">
            <div className="cl-container">
              <h2 className="cl-section-h2">About {data.name.en} ({data.name.ta})</h2>
              <p>{data.summary.en}</p>
              <p>{data.significance.en}</p>
              <p style={{ color: accent }}>{data.significance.ta}</p>

              <h2 className="cl-section-h2" style={{ marginTop: "2rem" }}>Frequently asked questions</h2>
              <div style={{ maxWidth: "760px" }}>
                {faq.map((f, i) => (
                  <details key={f.q} className="cl-faq-item" open={i === 0}>
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>

              <div className="cl-pub-related-links" style={{ marginTop: "1.5rem" }}>
                {prevEvent && (
                  <Link href={`/tamil-calendar/${prevEvent.slug}`} className="cl-pub-related-link">← {prevEvent.name.en} 2026</Link>
                )}
                {nextEvent && (
                  <Link href={`/tamil-calendar/${nextEvent.slug}`} className="cl-pub-related-link">{nextEvent.name.en} 2026 →</Link>
                )}
                <Link href="/tamil-calendar" className="cl-pub-related-link">All Tamil calendar 2026 days</Link>
                <Link href="/muhurtham-naal" className="cl-pub-related-link">Wedding muhurtham dates →</Link>
              </div>
            </div>
          </section>
        </main>
        <PublicFooter />
      </div>
    </>
  );
}
