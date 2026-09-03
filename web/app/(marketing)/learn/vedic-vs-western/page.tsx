import type { Metadata } from "next";
import { VedicVsWesternPageContent } from "./PageContent";

export const metadata: Metadata = {
  title: "Vedic vs Western Astrology — Zodiac, Lagna, Nakshatra, Dasha | Vinaadi",
  description:
    "A plain-language guide to how Vedic astrology differs from Western astrology: sidereal vs tropical zodiac, lagna over sun sign, 27 nakshatras, and multi-year dasha periods.",
  keywords: [
    "vedic vs western astrology",
    "sidereal vs tropical zodiac",
    "lagna vs sun sign",
    "nakshatra meaning",
    "dasha periods astrology",
    "vedic astrology basics",
    "tamil astrology for beginners",
  ],
  alternates: { canonical: "https://vinaadi.com/learn/vedic-vs-western" },
  openGraph: {
    title: "Vedic vs Western Astrology — The Basics",
    description:
      "Understand why your Vedic chart can look different from your Western chart: zodiac, lagna, nakshatra, and dasha timing.",
    url: "https://vinaadi.com/learn/vedic-vs-western",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vedic vs Western Astrology — The Basics",
    description: "Sidereal zodiac, lagna, nakshatra, and dasha explained in plain language.",
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Why is my Vedic sign different from my Western sign?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Western astrology usually uses the tropical zodiac, tied to the seasons. Vedic astrology uses the sidereal zodiac, measured against the fixed stars. Because of precession, the two systems can place the same planet in different signs.",
      },
    },
    {
      "@type": "Question",
      name: "Is Vedic astrology based on my sun sign?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Sun matters, but many Vedic readings use the lagna, or rising sign, as the main chart frame. The Moon sign and birth star are also central.",
      },
    },
    {
      "@type": "Question",
      name: "What is a nakshatra?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A nakshatra is one of 27 lunar stars used in Vedic astrology. The Moon's nakshatra at birth shapes the reading and determines the starting point of the dasha sequence.",
      },
    },
  ],
};

export default function VedicVsWesternPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />
      <VedicVsWesternPageContent />
    </>
  );
}
