import type { Metadata } from "next";
import { PARIHARAM_SEVVAI_FAQ } from "@/lib/marketing-i18n";
import { SevvaiDoshaPariharamContent } from "./PageContent";

export const metadata: Metadata = {
  title: "Sevvai Dosham Pariharam — Mars Remedy, Temples & Mantra | Vinaadi",
  description:
    "Sevvai dosham pariharam: understanding Mars placement, which charts are truly affected, and the step-by-step remedy — Vaitheeswaran Koil, Murugan worship and the Angaraka mantra.",
  keywords: [
    "sevvai dosham pariharam",
    "mangal dosha remedy",
    "mars pariharam",
    "angaraka pariharam",
    "vaitheeswaran koil mars",
    "murugan sevvai dosham",
    "angaraka mantra",
    "செவ்வாய் தோஷ பரிகாரம்",
    "அங்காரக பரிகாரம்",
  ],
  alternates: { canonical: "https://vinaadi.com/pariharam/sevvai-dosha-pariharam" },
  openGraph: {
    title: "Sevvai Dosham Pariharam — Mars Remedy, Temples & Mantra",
    description:
      "Which charts actually need Mars pariharam, and the traditional devotional remedy — step by step.",
    url: "https://vinaadi.com/pariharam/sevvai-dosha-pariharam",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sevvai Dosham Pariharam — Mars Remedy & Vaitheeswaran Koil",
    description: "Step-by-step remedy for Sevvai dosham with the Angaraka Beeja Mantra.",
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: PARIHARAM_SEVVAI_FAQ.map((f) => ({
    "@type": "Question",
    name: f.q.en,
    acceptedAnswer: { "@type": "Answer", text: f.a.en },
  })),
};

export default function SevvaiDoshaPariharamPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <SevvaiDoshaPariharamContent />
    </>
  );
}
