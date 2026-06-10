import type { Metadata } from "next";
import { ThirukanithamPageContent } from "./PageContent";

export const metadata: Metadata = {
  title: "What is Thirukanitham? — The Precise Tamil Astrology Calculation System | Vinaadi",
  description:
    "Thirukanitham is the Tamil astronomical calculation method that uses actual planetary positions — not Vakya's pre-computed tables. Learn how it differs from Vakya, what Lahiri ayanamsa is, and why it matters for your birth chart.",
  keywords: [
    "what is Thirukanitham",
    "Thirukanitham vs Vakya",
    "Thirukanitham meaning",
    "Thiruganitha Panchangam",
    "Vakya Panchangam difference",
    "Lahiri ayanamsa",
    "Tamil astrology calculation",
    "drik panchang Tamil",
    "Tamil jyotish method",
  ],
  alternates: { canonical: "https://vinaadi.com/learn/what-is-thirukanitham" },
  openGraph: {
    title: "What is Thirukanitham? — The Precise Tamil Astrology Calculation System",
    description:
      "Learn what Thirukanitham is, how it differs from Vakya, and why it gives more accurate planet positions for Tamil birth charts and panchangam.",
    url: "https://vinaadi.com/learn/what-is-thirukanitham",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "What is Thirukanitham? — Tamil Astrology Calculation Explained",
    description: "Thirukanitham vs Vakya, Lahiri ayanamsa, and why precise planetary positions matter for your jadhagam.",
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Thirukanitham?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Thirukanitham is the Tamil astronomical calculation system for astrology, based on actual (drik) planetary positions rather than traditional pre-computed tables. The word comes from 'Thiru' (sacred) and 'Kanitham' (mathematics). It is the modern, precise standard used by most Tamil panchangam publications and online astrology software today.",
      },
    },
    {
      "@type": "Question",
      name: "What is the difference between Thirukanitham and Vakya?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Vakya astrology uses planetary positions derived from ancient Sanskrit verses — approximations that were accurate centuries ago but have accumulated errors over time. Thirukanitham uses drik (direct observation) calculations — real-time astronomical data from modern ephemerides. For contemporary birth charts, Thirukanitham is significantly more accurate, especially for slow-moving planets like Saturn, Jupiter, Rahu, and Ketu.",
      },
    },
    {
      "@type": "Question",
      name: "What is Lahiri ayanamsa and why is it used in Thirukanitham?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ayanamsa is the correction applied to convert tropical (Western) planetary longitudes to sidereal (Vedic) positions, accounting for the precession of the equinoxes. Lahiri ayanamsa — also called Chitrapaksha ayanamsa — is India's government-recognised standard and is used by most Tamil Jyotish practitioners. Thirukanitham uses Lahiri ayanamsa for all chart calculations.",
      },
    },
    {
      "@type": "Question",
      name: "Why does the choice between Thirukanitham and Vakya affect my birth chart?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A planet's position can differ by 1–2 degrees or more between Vakya and Thirukanitham calculations. This difference can shift a planet from one nakshatra to another, change its pada (quarter division), and sometimes place it in a different rasi. For charts near cusps — especially the Moon's nakshatra which determines the dasha start — this matters significantly for the entire reading.",
      },
    },
  ],
};

export default function WhatIsThirukanithamPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />
      <ThirukanithamPageContent />
    </>
  );
}
