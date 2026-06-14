import type { Metadata } from "next";
import { YogamIndexContent } from "./IndexContent";

export const metadata: Metadata = {
  title: "Yogams in Tamil Astrology — Meaning, Formula & Benefits | Vinaadi",
  description:
    "Understand the auspicious yogams in your horoscope — Gaja Kesari, Dhana, Budha-Aditya and Neecha Bhanga Raja yogam. What each means, the formula that forms it, and when it activates through dasha.",
  keywords: [
    "yogam astrology",
    "gaja kesari yogam",
    "dhana yogam",
    "raja yogam",
    "neecha bhanga raja yoga",
    "budha aditya yoga",
    "yogam formula",
    "யோகம்",
    "Tamil astrology yogam",
  ],
  alternates: { canonical: "https://vinaadi.com/yogam" },
  openGraph: {
    title: "Yogams in Tamil Astrology — Meaning, Formula & Benefits | Vinaadi",
    description:
      "What every yogam means, the formula that forms it, and when it activates — explained in Tamil and English.",
    url: "https://vinaadi.com/yogam",
    type: "website",
  },
};

const JSONLD = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Yogams in Tamil Astrology",
  url: "https://vinaadi.com/yogam",
  description: "Guides to the auspicious yogams in a Thirukanitham horoscope — meaning, formula, benefits and activation.",
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://vinaadi.com" },
      { "@type": "ListItem", position: 2, name: "Yogam", item: "https://vinaadi.com/yogam" },
    ],
  },
};

export default function YogamIndexPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD) }} />
      <YogamIndexContent />
    </>
  );
}
