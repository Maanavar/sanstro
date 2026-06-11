import type { Metadata } from "next";
import { HowToReadJadhagamPageContent } from "./PageContent";

export const metadata: Metadata = {
  title: "How to Read a Jadhagam — South Indian Tamil Birth Chart Guide | Vinaadi",
  description:
    "Learn how to read a South Indian Tamil jadhagam — the fixed square chart structure, how lagna is determined, how planets are placed across the 12 rasis, and how the Vimshottari dasha sequence is calculated from your Moon's birth star.",
  keywords: [
    "how to read jadhagam",
    "how to read Tamil birth chart",
    "Tamil horoscope reading",
    "South Indian chart explained",
    "lagna meaning astrology",
    "dasha sequence Tamil",
    "jathagam reading guide",
    "Tamil chart structure",
    "birth star pada astrology",
  ],
  alternates: { canonical: "https://vinaadi.com/learn/how-to-read-a-jadhagam" },
  openGraph: {
    title: "How to Read a Jadhagam — South Indian Tamil Birth Chart Guide",
    description:
      "A clear guide to reading a South Indian Tamil jadhagam — chart structure, lagna, planet placements, and dasha sequence explained in plain language.",
    url: "https://vinaadi.com/learn/how-to-read-a-jadhagam",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Read a Tamil Jadhagam — Birth Chart Guide",
    description: "South Indian chart structure, lagna, planets, and dasha sequence explained simply.",
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is the structure of a South Indian jadhagam?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The South Indian jadhagam uses a fixed square grid where the 12 rasis always occupy the same positions — unlike the North Indian chart where the lagna rotates. The rasi positions are fixed (Mesha in the top-middle, moving clockwise), and only the planet symbols and lagna marker change based on birth details.",
      },
    },
    {
      "@type": "Question",
      name: "What is lagna in a Tamil birth chart?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Lagna (also called the ascendant or rising sign) is the rasi that was rising on the eastern horizon at the exact moment of birth. It marks the 1st house in the chart — the reference point from which all 12 house positions are counted. Lagna changes approximately every 2 hours, making birth time critical for an accurate chart.",
      },
    },
    {
      "@type": "Question",
      name: "How is the Vimshottari dasha sequence calculated?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Vimshottari dasha sequence starts from the Moon's birth star at birth. Each of the 27 birth stars has a planetary lord, and the sequence cycles through 9 planets over 120 years. The Moon's exact pada, which requires an accurate birth time, determines where in the sequence you begin and how much of the first dasha period has already elapsed.",
      },
    },
    {
      "@type": "Question",
      name: "What is the difference between D1 and D9 charts?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The D1 Rasi chart is the main birth chart showing all 9 planets in their rasis at birth. The D9 Navamsa chart is a divisional chart where each rasi is divided into 9 equal parts — it reveals deeper patterns about marriage, dharma, and the second half of life. Both are generated together in a Thirukanitham jadhagam.",
      },
    },
  ],
};

export default function HowToReadAJadhagamPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />
      <HowToReadJadhagamPageContent />
    </>
  );
}
