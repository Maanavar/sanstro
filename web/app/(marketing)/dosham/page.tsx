import type { Metadata } from "next";
import { DoshamIndexContent } from "./IndexContent";

export const metadata: Metadata = {
  title: "Doshams in Tamil Astrology — Meaning, Calculation & Pariharam | Vinaadi",
  description:
    "Understand the doshams in your horoscope — Sevvai (Mangal) dosham, Naga dosham, Kala Sarpa, Pithru and Kalathra dosham. What each means, how it is calculated in Thirukanitham, and how its strength can be softened.",
  keywords: [
    "dosham meaning",
    "sevvai dosham",
    "mangal dosha",
    "naga dosham",
    "kala sarpa dosham",
    "pithru dosham",
    "dosham parikaram",
    "தோஷம்",
    "Tamil astrology dosham",
  ],
  alternates: { canonical: "https://vinaadi.com/dosham" },
  openGraph: {
    title: "Doshams in Tamil Astrology — Meaning, Calculation & Pariharam | Vinaadi",
    description:
      "What every dosham means, how it is calculated, and the traditional pariharam — explained calmly in Tamil and English.",
    url: "https://vinaadi.com/dosham",
    type: "website",
  },
};

const JSONLD = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Doshams in Tamil Astrology",
  url: "https://vinaadi.com/dosham",
  description: "Guides to the doshams found in a Thirukanitham horoscope — meaning, calculation, effects and pariharam.",
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://vinaadi.com" },
      { "@type": "ListItem", position: 2, name: "Dosham", item: "https://vinaadi.com/dosham" },
    ],
  },
};

export default function DoshamIndexPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD) }} />
      <DoshamIndexContent />
    </>
  );
}
