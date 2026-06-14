import type { Metadata } from "next";
import { DOSHAM_KALATHRA_FAQ } from "@/lib/marketing-i18n";
import { KalathraDoshamContent } from "./PageContent";

export const metadata: Metadata = {
  title: "Kalathra Dosham — Marriage Affliction, Meaning, Chart Check & Pariharam | Vinaadi",
  description:
    "Kalathra dosham covers any malefic (Saturn, Mars, Rahu, Ketu, Sun) pressing the 7th house, its lord, or Venus. Learn how it differs from Sevvai dosham, how to read your chart for marriage timing, when it eases, and the traditional pariharam.",
  keywords: [
    "kalathra dosham",
    "kalathra dosha",
    "7th house dosham",
    "marriage delay astrology",
    "kalathra dosham pariharam",
    "venus debilitated astrology",
    "7th lord weak",
    "களத்திர தோஷம்",
    "thirumananjeri temple",
    "marriage horoscope dosham",
  ],
  alternates: { canonical: "https://vinaadi.com/dosham/kalathra-dosham" },
  openGraph: {
    title: "Kalathra Dosham — Marriage Affliction, Meaning, Chart Check & Pariharam",
    description:
      "What Kalathra dosham means for marriage timing and harmony, how it differs from Sevvai dosham, how to check the 7th house, and the traditional pariharam.",
    url: "https://vinaadi.com/dosham/kalathra-dosham",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kalathra Dosham — Marriage Affliction Explained",
    description: "7th house, Venus, marriage timing and pariharam — calmly explained.",
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: DOSHAM_KALATHRA_FAQ.map((f) => ({
    "@type": "Question",
    name: f.q.en,
    acceptedAnswer: { "@type": "Answer", text: f.a.en },
  })),
};

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Kalathra Dosham — Marriage Affliction, Meaning, Chart Check & Pariharam",
  about: "Kalathra dosham in Tamil Vedic astrology",
  inLanguage: ["en", "ta"],
  publisher: { "@type": "Organization", name: "Vinaadi", url: "https://vinaadi.com" },
  mainEntityOfPage: "https://vinaadi.com/dosham/kalathra-dosham",
};

export default function KalathraDoshamPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <KalathraDoshamContent />
    </>
  );
}
