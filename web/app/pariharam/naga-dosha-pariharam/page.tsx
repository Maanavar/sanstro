import type { Metadata } from "next";
import { PARIHARAM_NAGA_FAQ } from "@/lib/marketing-i18n";
import { NagaDoshaPariharamContent } from "./PageContent";

export const metadata: Metadata = {
  title: "Naga Dosham Pariharam — Sarpa Remedy, Temples & Observances | Vinaadi",
  description:
    "Naga dosham pariharam: the ancestral and karmic meaning of serpent energy in the chart, and the step-by-step remedy — milk abhishekam, Panchami-Aayilyam observances, and naga prarthana.",
  keywords: [
    "naga dosham pariharam",
    "sarpa dosham remedy",
    "naga pariharam",
    "serpent dosha remedy",
    "thirunageswaram naga pariharam",
    "aayilyam naga worship",
    "நாக தோஷ பரிகாரம்",
    "சர்ப்ப தோஷ பரிகாரம்",
    "நாக பிரார்த்தனை",
  ],
  alternates: { canonical: "https://vinaadi.com/pariharam/naga-dosha-pariharam" },
  openGraph: {
    title: "Naga Dosham Pariharam — Sarpa Remedy, Temples & Observances",
    description:
      "What naga dosham means, who needs it, and the traditional milk-abhishekam and Aayilyam observance remedy.",
    url: "https://vinaadi.com/pariharam/naga-dosha-pariharam",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Naga Dosham Pariharam — Serpent Remedy & Temples",
    description: "Traditional pariharam for Sarpa dosham with Aayilyam and milk abhishekam.",
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: PARIHARAM_NAGA_FAQ.map((f) => ({
    "@type": "Question",
    name: f.q.en,
    acceptedAnswer: { "@type": "Answer", text: f.a.en },
  })),
};

export default function NagaDoshaPariharamPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <NagaDoshaPariharamContent />
    </>
  );
}
