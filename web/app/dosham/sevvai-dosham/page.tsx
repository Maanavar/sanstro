import type { Metadata } from "next";
import { DOSHAM_SEVVAI_FAQ } from "@/lib/marketing-i18n";
import { SevvaiDoshamContent } from "./PageContent";

export const metadata: Metadata = {
  title: "Sevvai Dosham (Mangal Dosha) — Meaning, Calculation & Pariharam | Vinaadi",
  description:
    "Sevvai dosham (Mangal dosha / Manglik) forms when Mars sits in the 1st, 2nd, 4th, 7th, 8th or 12th house. Learn how it is calculated, what it means for marriage, when it is cancelled, and the traditional pariharam with slokam.",
  keywords: [
    "sevvai dosham",
    "mangal dosha",
    "chevvai dosham",
    "kuja dosha",
    "manglik",
    "sevvai dosham parikaram",
    "sevvai dosham calculation",
    "sevvai dosham marriage",
    "செவ்வாய் தோஷம்",
    "மங்கள் தோஷம்",
  ],
  alternates: { canonical: "https://vinaadi.com/dosham/sevvai-dosham" },
  openGraph: {
    title: "Sevvai Dosham (Mangal Dosha) — Meaning, Calculation & Pariharam",
    description:
      "What Sevvai dosham really means, how it is calculated from Lagna, Moon and Venus, when it is cancelled, and the traditional pariharam.",
    url: "https://vinaadi.com/dosham/sevvai-dosham",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sevvai Dosham (Mangal Dosha) Explained",
    description: "Meaning, calculation, cancellations and pariharam — calmly explained.",
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: DOSHAM_SEVVAI_FAQ.map((f) => ({
    "@type": "Question",
    name: f.q.en,
    acceptedAnswer: { "@type": "Answer", text: f.a.en },
  })),
};

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Sevvai Dosham (Mangal Dosha) — Meaning, Calculation & Pariharam",
  about: "Sevvai dosham / Mangal dosha in Tamil Vedic astrology",
  inLanguage: ["en", "ta"],
  publisher: { "@type": "Organization", name: "Vinaadi", url: "https://vinaadi.com" },
  mainEntityOfPage: "https://vinaadi.com/dosham/sevvai-dosham",
};

export default function SevvaiDoshamPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <SevvaiDoshamContent />
    </>
  );
}
