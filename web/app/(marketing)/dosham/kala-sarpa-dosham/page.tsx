import type { Metadata } from "next";
import { DOSHAM_KALA_SARPA_FAQ } from "@/lib/marketing-i18n";
import { KalaSarpaDoshamContent } from "./PageContent";

export const metadata: Metadata = {
  title: "Kala Sarpa Dosham — Meaning, Types, Chart Check & Pariharam | Vinaadi",
  description:
    "Kala Sarpa dosham forms when all 7 classical planets are enclosed between Rahu and Ketu. Learn the 12 types (Ananta to Sheshanaga), how to check your chart, what it means for life, when it softens, and the traditional pariharam.",
  keywords: [
    "kala sarpa dosham",
    "kala sarpa dosha",
    "kala sarpa yoga",
    "kala sarpa dosham types",
    "kala sarpa dosham pariharam",
    "kala sarpa dosham meaning",
    "கால சர்ப்ப தோஷம்",
    "kala sarpa shanti",
    "srikalahasti kala sarpa",
  ],
  alternates: { canonical: "https://vinaadi.com/dosham/kala-sarpa-dosham" },
  openGraph: {
    title: "Kala Sarpa Dosham — Meaning, Types, Chart Check & Pariharam",
    description:
      "What Kala Sarpa dosham really means, the 12 named types, how to check if all 7 planets are enclosed, when it softens, and the traditional pariharam.",
    url: "https://vinaadi.com/dosham/kala-sarpa-dosham",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kala Sarpa Dosham Explained",
    description: "12 types, chart check, real meaning and pariharam — calmly explained.",
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: DOSHAM_KALA_SARPA_FAQ.map((f) => ({
    "@type": "Question",
    name: f.q.en,
    acceptedAnswer: { "@type": "Answer", text: f.a.en },
  })),
};

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Kala Sarpa Dosham — Meaning, Types, Chart Check & Pariharam",
  about: "Kala Sarpa dosham in Tamil Vedic astrology",
  inLanguage: ["en", "ta"],
  publisher: { "@type": "Organization", name: "Vinaadi", url: "https://vinaadi.com" },
  mainEntityOfPage: "https://vinaadi.com/dosham/kala-sarpa-dosham",
};

export default function KalaSarpaDoshamPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <KalaSarpaDoshamContent />
    </>
  );
}
