import type { Metadata } from "next";
import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
const YEAR = 2026;

interface BiText { ta: string; en: string }
interface EventSummary {
  key: string;
  slug: string;
  name: BiText;
  tagline: BiText;
  category: string;
  count: number;
  nextDate: string | null;
}
interface EventsList { year: number; source: string; events: EventSummary[] }

async function fetchEvents(): Promise<EventsList | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/public/panchangam-events?year=${YEAR}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as EventsList;
  } catch {
    return null;
  }
}

export const metadata: Metadata = {
  title: "Tamil Calendar 2026 — Pournami, Amavasai, Pradosham, Ekadhasi Dates | Vinaadi",
  description:
    "Full 2026 Tamil calendar of special days — Pournami (full moon), Amavasai (new moon), Pradosham, Ekadhasi, Sankatahara Chathurthi, Karthigai, Sashti, Sivarathiri and Karinaal — with every date, weekday and Tamil date.",
  keywords: [
    "tamil calendar 2026",
    "pournami 2026",
    "amavasai 2026",
    "pradosham 2026",
    "ekadhasi 2026",
    "sankatahara chathurthi 2026",
    "karthigai 2026",
    "tamil festival dates 2026",
    "தமிழ் நாட்காட்டி 2026",
  ],
  alternates: { canonical: "https://vinaadi.com/tamil-calendar" },
  openGraph: {
    title: "Tamil Calendar 2026 — All Special Days & Dates",
    description: "Pournami, Amavasai, Pradosham, Ekadhasi and every special Tamil-calendar day for 2026, with dates and Tamil months.",
    url: "https://vinaadi.com/tamil-calendar",
    type: "website",
  },
};

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function TamilCalendarHub() {
  const data = await fetchEvents();
  const events = data?.events ?? [];

  const jsonld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Tamil Calendar 2026 — Special Days",
    url: "https://vinaadi.com/tamil-calendar",
    hasPart: events.map((e) => ({
      "@type": "WebPage",
      name: `${e.name.en} 2026`,
      url: `https://vinaadi.com/tamil-calendar/${e.slug}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />
      <div className="clarity-shell">
        <PublicNav />
        <main>
          <section className="cl-pub-hero" style={{ paddingBottom: "24px" }}>
            <div className="cl-container">
              <p className="cl-eyebrow">Tamil Calendar · தமிழ் நாட்காட்டி</p>
              <h1 className="cl-pub-h1" style={{ maxWidth: "26ch" }}>
                Tamil Calendar 2026 — Special Days &amp; Dates
              </h1>
              <p className="cl-pub-lead">
                Every Pournami, Amavasai, Pradosham, Ekadhasi and more for 2026 — with the next upcoming date,
                weekday and Tamil date. ஒவ்வொரு சுப/விசேட நாளின் முழுப் பட்டியல்.
              </p>
            </div>
          </section>

          <section style={{ paddingBottom: "56px" }}>
            <div className="cl-container">
              {events.length === 0 ? (
                <p>Calendar is being updated. Please check back soon.</p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {events.map((e) => (
                    <Link
                      key={e.slug}
                      href={`/tamil-calendar/${e.slug}`}
                      style={{
                        display: "block", padding: "18px 20px", borderRadius: "14px",
                        border: e.category === "INAUSPICIOUS" ? "1.5px solid #E0A89C" : "1.5px solid var(--cl-border, #E4DBC8)",
                        background: e.category === "INAUSPICIOUS" ? "#FCEFEC" : "var(--cl-surface, #FFF)",
                        textDecoration: "none", color: "var(--cl-ink, #1A1612)",
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{e.name.en}</div>
                      <div style={{ fontSize: "0.9rem", color: "#B85A2C", fontWeight: 600, marginBottom: "6px" }}>{e.name.ta}</div>
                      <div style={{ fontSize: "0.82rem", color: "var(--cl-muted, #7A6F5E)", marginBottom: "10px" }}>{e.tagline.en}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--cl-ink, #3D352B)" }}>
                        <strong>{e.count}</strong> dates in 2026
                        {e.nextDate && <> · next: <strong>{formatDate(e.nextDate)}</strong></>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
        <PublicFooter />
      </div>
    </>
  );
}
