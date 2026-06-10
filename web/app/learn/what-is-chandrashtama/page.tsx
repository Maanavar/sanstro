import type { Metadata } from "next";
import { ChandrashtamaPageContent } from "./PageContent";

export const metadata: Metadata = {
  title: "What is Chandrashtama? — Moon's 8th Sign Transit in Tamil Astrology | Vinaadi",
  description:
    "Chandrashtama is the period when the transiting Moon passes through the 8th sign from your birth Moon sign. It occurs every 27 days and lasts about 2.5 days. Learn what it means and how to approach it calmly.",
  keywords: [
    "what is chandrashtama",
    "chandrashtama meaning",
    "chandrashtama Tamil astrology",
    "moon 8th sign transit",
    "chandrashtama period",
    "chandrashtama astrology",
    "moon transit inauspicious",
  ],
  alternates: { canonical: "https://vinaadi.com/learn/what-is-chandrashtama" },
  openGraph: {
    title: "What is Chandrashtama? — Moon's 8th Sign Transit in Tamil Astrology",
    description:
      "Chandrashtama is when the Moon transits the 8th sign from your birth Moon sign. It repeats monthly, lasts 2.5 days, and signals a period for caution — not crisis.",
    url: "https://vinaadi.com/learn/what-is-chandrashtama",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "What is Chandrashtama? — Tamil Astrology Explained",
    description: "Moon's 8th sign transit — what it is, how often it occurs, and a calm approach to it.",
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Chandrashtama?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Chandrashtama is the period when the transiting Moon passes through the 8th sign from your birth Moon sign (Janma Rasi). In Tamil jyotish, the 8th house is associated with obstacles and matters requiring extra care. The word comes from 'Chandra' (Moon) and 'Ashtama' (eighth).",
      },
    },
    {
      "@type": "Question",
      name: "How often does Chandrashtama occur and how long does it last?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Chandrashtama occurs approximately every 27 days, since the Moon completes one cycle through all 12 signs in about 27.3 days. Each Chandrashtama period lasts roughly 2.5 days — the time the Moon spends in a single sign.",
      },
    },
    {
      "@type": "Question",
      name: "What should I avoid during Chandrashtama?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Traditional Tamil astrology recommends avoiding starting major new actions during Chandrashtama — such as beginning a new business, signing important agreements, or making large purchases. Routine work continues normally. It is a period for caution and reflection rather than new beginnings.",
      },
    },
    {
      "@type": "Question",
      name: "How do I know when my Chandrashtama is?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Chandrashtama depends on your birth Moon sign (Janma Rasi). Count eight signs forward from your Janma Rasi — when the transiting Moon enters that sign, Chandrashtama begins. Vinaadi tracks this automatically and shows it clearly in your daily reading without dramatising it.",
      },
    },
  ],
};

export default function WhatIsChandrashtamaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />
      <ChandrashtamaPageContent />
    </>
  );
}
