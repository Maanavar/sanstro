import type { Metadata } from "next";
import type { NatchathiramEntry } from "./natchathiram-data";
import { withTamilTwin } from "./localized-metadata";
import { faqPageFromPairs, type Ld } from "./json-ld";

const OG_IMAGE = { url: "/brand/vinaadi-og-image.jpg", width: 1200, height: 630, alt: "Vinaadi — Tamil Astrology" };

/**
 * A nakshatra profile page's metadata, in both languages (GRW-06).
 *
 * `entry.meta` is the Tamil copy — the data files were written Tamil-first, and
 * until now the English URL carried it too, so an English searcher saw a Tamil
 * title. The English copy is built from the entry's English name.
 */
function englishCopy(entry: NatchathiramEntry) {
  return {
    title: `${entry.name_en} Nakshatra: Personality, Career & Dasha Predictions`,
    description: `${entry.name_en} (${entry.rasi_en}) nakshatra: personality traits, career strengths, family life, dasha results and spiritual guidance, based on Thirukanitham.`,
  };
}

export async function natchathiramMetadata(entry: NatchathiramEntry): Promise<Metadata> {
  const path = `/natchathiram/${entry.slug}` as const;
  const { title, description } = englishCopy(entry);
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

/**
 * A nakshatra page's structured data, per language.
 *
 * The entry is Tamil-first, so its `faq` and `meta` are Tamil. The Article is
 * built in both languages (English from the entry's English name, matching the
 * English `<title>`). The FAQ exists in Tamil only, so it belongs to the Tamil
 * twin; printing it on the English URL put Tamil structured data on an English
 * page. NOTE: the FAQ is not rendered anywhere on the page, so it marks up text a
 * visitor cannot see. That predates GRW-06 and is left as it was.
 */
export function natchathiramJsonLd(entry: NatchathiramEntry): { faqTa: Ld; article: { en: Ld; ta: Ld } } {
  const url = `https://vinaadi.com/natchathiram/${entry.slug}`;
  const en = englishCopy(entry);
  const article = (headline: string, description: string, inLanguage: "en" | "ta"): Ld => ({
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    inLanguage,
    url,
    publisher: { "@type": "Organization", name: "Vinaadi" },
  });
  return {
    faqTa: faqPageFromPairs(entry.faq),
    article: {
      en: article(en.title, en.description, "en"),
      ta: article(entry.meta.title, entry.meta.description, "ta"),
    },
  };
}
