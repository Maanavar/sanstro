import type { Metadata } from "next";
import type { NatchathiramEntry } from "./natchathiram-data";
import { withTamilTwin } from "./localized-metadata";

const OG_IMAGE = { url: "/brand/vinaadi-og-image.jpg", width: 1200, height: 630, alt: "Vinaadi — Tamil Astrology" };

/**
 * A nakshatra profile page's metadata, in both languages (GRW-06).
 *
 * `entry.meta` is the Tamil copy — the data files were written Tamil-first, and
 * until now the English URL carried it too, so an English searcher saw a Tamil
 * title. The English copy is built from the entry's English name.
 */
export async function natchathiramMetadata(entry: NatchathiramEntry): Promise<Metadata> {
  const path = `/natchathiram/${entry.slug}` as const;
  const title = `${entry.name_en} Nakshatra: Personality, Career & Dasha Predictions`;
  const description = `${entry.name_en} (${entry.rasi_en}) nakshatra: personality traits, career strengths, family life, dasha results and spiritual guidance, based on Thirukanitham.`;
  const url = `https://vinaadi.com${path}`;

  return withTamilTwin(
    {
      title,
      description,
      keywords: entry.meta.keywords,
      alternates: { canonical: url },
      openGraph: { title, description, url, type: "article", images: [OG_IMAGE] },
      twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
    },
    path,
    { title: entry.meta.title, description: entry.meta.description, keywords: entry.meta.keywords },
  );
}
