import type { Metadata } from "next";
import { DOSHAM_NAGA_FAQ } from "@/lib/marketing-i18n";
import { NagaDoshamContent } from "./PageContent";

export const metadata: Metadata = {
  title: "Naga Dosham (Sarpa Dosham) — Meaning, Chart Check & Pariharam | Vinaadi",
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

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: DOSHAM_NAGA_FAQ.map((f) => ({
    "@type": "Question",
    name: f.q.en,
    acceptedAnswer: { "@type": "Answer", text: f.a.en },
  })),
};

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <NagaDoshamContent />
    </>
  );
}
