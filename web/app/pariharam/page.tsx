import type { Metadata } from "next";
import { PariharamIndexContent } from "./IndexContent";

export const metadata: Metadata = {
  title: "Pariharam for Life's Difficulties — Remedies & Slokams | Vinaadi",
  description:
    "Traditional pariharam (remedies) for delayed marriage, Rahu-Ketu and Sevvai dosham, debt, health and more — with the astrological reason behind each difficulty, slokams, fasts and temple worship.",
  keywords: [
    "pariharam",
    "parikaram",
    "astrology remedies tamil",
    "thirumana thadai pariharam",
    "rahu ketu pariharam",
    "sevvai dosham pariharam",
    "dosham remedy slokam",
    "பரிகாரம்",
    "ஜோதிட பரிகாரம்",
  ],
  alternates: { canonical: "https://vinaadi.com/pariharam" },
  openGraph: {
    title: "Pariharam for Life's Difficulties — Remedies & Slokams | Vinaadi",
    description:
      "Devotional remedies, slokams and temple worship for life's difficulties — with the astrological reason behind each.",
    url: "https://vinaadi.com/pariharam",
    type: "website",
  },
};

const JSONLD = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Pariharam for Life's Difficulties",
  url: "https://vinaadi.com/pariharam",
  description: "Traditional astrological remedies (pariharam) organised by life situation, with slokams and temple guidance.",
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://vinaadi.com" },
      { "@type": "ListItem", position: 2, name: "Pariharam", item: "https://vinaadi.com/pariharam" },
    ],
  },
};

export default function PariharamIndexPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD) }} />
      <PariharamIndexContent />
    </>
  );
}
