import type { Metadata } from "next";
import { PARIHARAM_KADAN_FAQ } from "@/lib/marketing-i18n";
import { KadanPariharamContent } from "./PageContent";

export const metadata: Metadata = {
  title: "Pariharam for Debt & Financial Strain (Kadan Pariharam) | Vinaadi",
  description:
    "Why the chart shows persistent debt — 2nd, 6th, 11th house pressure — and the traditional pariharam: Mahalakshmi Friday worship, Kubera mantra, Kanjanur and Alangudi temples.",
  keywords: [
    "kadan pariharam",
    "debt pariharam",
    "financial pariharam astrology",
    "lakshmi pariharam",
    "kubera mantra",
    "kanjanur sukra temple",
    "alangudi guru temple",
    "2nd house debt astrology",
    "கடன் பரிகாரம்",
    "லட்சுமி வழிபாடு",
  ],
  alternates: { canonical: "https://vinaadi.com/pariharam/kadan-pariharam" },
  openGraph: {
    title: "Pariharam for Debt & Financial Strain — Lakshmi, Kubera & Temple Worship",
    description:
      "Astrological roots of persistent debt and the traditional Lakshmi-Kubera devotional remedy — step by step.",
    url: "https://vinaadi.com/pariharam/kadan-pariharam",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kadan Pariharam — Debt Remedy & Lakshmi Worship",
    description: "Friday Mahalakshmi worship, Kubera mantra and key temples for financial relief.",
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: PARIHARAM_KADAN_FAQ.map((f) => ({
    "@type": "Question",
    name: f.q.en,
    acceptedAnswer: { "@type": "Answer", text: f.a.en },
  })),
};

export default function KadanPariharamPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <KadanPariharamContent />
    </>
  );
}
