import type { Metadata } from "next";
import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { formatDateLabel } from "@/lib/format";
import { PanchangamShareCard } from "@/components/panchangam-share-card";

const DEFAULT_CITY = "Chennai";

type Props = { searchParams: Promise<{ date?: string; city?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { date, city } = await searchParams;
  const dateLabel = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? formatDateLabel(date) : "Today";
  const place = city ?? DEFAULT_CITY;
  const title = `Today's Panchangam Card — ${dateLabel}, ${place} | Vinaadi AI`;
  const description = `Share today's Tamil Panchangam — Tithi, Nakshatra, Rahu Kalam, and auspicious timings for ${place}. Free shareable card from Vinaadi AI.`;
  return {
    title,
    description,
    alternates: { canonical: "https://vinaadi.com/share/panchangam" },
    openGraph: { title, description, url: "https://vinaadi.com/share/panchangam", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SharePanchangamPage({ searchParams }: Props) {
  const { date, city } = await searchParams;
  const validDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;
  const dateLabel = validDate ? formatDateLabel(validDate) : "Today";
  const place = city ?? DEFAULT_CITY;

  return (
    <div className="clarity-shell">
      <PublicNav />
      <main>
        <section className="cl-pub-hero" style={{ paddingBottom: "32px" }}>
          <div className="cl-container" style={{ textAlign: "center" }}>
            <p className="cl-eyebrow">Shareable Panchangam · பகிரக்கூடிய பஞ்சாங்கம்</p>
            <h1 className="cl-pub-h1" style={{ maxWidth: "24ch", margin: "0 auto 12px" }}>
              {dateLabel} — {place}
            </h1>
            <p className="cl-pub-lead" style={{ marginBottom: "24px", maxWidth: "52ch", marginInline: "auto" }}>
              Tap below to preview a festive Panchangam card and share it to WhatsApp.
              Pournami, Amavasai, Shivarathiri, Ekadasi and Pradosham get their own dedicated cards.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
              <PanchangamShareCard lang="ta" date={validDate} city={place} label="Preview & Share" />
              <PanchangamShareCard lang="en" date={validDate} city={place} label="Preview (English)" />
            </div>
          </div>
        </section>

        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">Get your free Jadhagam</h2>
              <p className="cl-cta-strip__body">
                Create a free account for daily guidance that combines your chart, dasha, and panchangam together.
              </p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">Get started free →</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
