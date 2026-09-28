import { withTamilTwin } from "@/lib/localized-metadata";
import { JsonLd, articleTa, faqPageLd } from "@/lib/json-ld";
import type { Metadata } from "next";
import { DOSHAM_NAGA_FAQ } from "@/lib/marketing-i18n";
import { NagaDoshamContent } from "./PageContent";

const EN_METADATA: Metadata = {
  title: "Naga Dosham (Sarpa Dosham) — Meaning, Chart Check & Pariharam",
  description:
    "Naga or Sarpa dosham forms when Rahu or Ketu presses the 5th house, its lord, or Jupiter. Learn what it means for children and lineage, how to read your chart, when it is cancelled, and the traditional pariharam with Rahu slokam.",
  keywords: [
    "naga dosham",
    "sarpa dosham",
    "naga dosha",
    "serpent dosham",
    "naga dosham pariharam",
    "naga dosham meaning",
    "naga dosham children",
    "sarpa shanti",
    "நாக தோஷம்",
    "சர்ப்ப தோஷம்",
  ],
  alternates: { canonical: "https://vinaadi.com/dosham/naga-sarpa-dosham" },
  openGraph: {
    title: "Naga Dosham (Sarpa Dosham) — Meaning, Chart Check & Pariharam",
    description:
      "What Naga dosham really means for children and lineage, how it is identified in the Thirukanitham chart, when it is cancelled, and the traditional pariharam.",
    url: "https://vinaadi.com/dosham/naga-sarpa-dosham",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Naga Dosham (Sarpa Dosham) Explained",
    description: "Meaning, chart check, cancellations and pariharam — calmly explained.",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withTamilTwin(EN_METADATA, "/dosham/naga-sarpa-dosham");
}

const FAQ_JSONLD = faqPageLd(DOSHAM_NAGA_FAQ, "en");
const FAQ_JSONLD_TA = faqPageLd(DOSHAM_NAGA_FAQ, "ta");

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Naga Dosham (Sarpa Dosham) — Meaning, Chart Check & Pariharam",
  about: "Naga dosham / Sarpa dosham in Tamil Vedic astrology",
  inLanguage: ["en", "ta"],
  publisher: { "@type": "Organization", name: "Vinaadi", url: "https://vinaadi.com" },
  mainEntityOfPage: "https://vinaadi.com/dosham/naga-sarpa-dosham",
};

export default function NagaDoshamPage() {
  return (
    <>
      <JsonLd en={ARTICLE_JSONLD} ta={articleTa(ARTICLE_JSONLD)} />
      <JsonLd en={FAQ_JSONLD} ta={FAQ_JSONLD_TA} />
      <NagaDoshamContent />
    </>
  );
}
