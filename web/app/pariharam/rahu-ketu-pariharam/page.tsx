import type { Metadata } from "next";
import { PARIHARAM_RAHU_KETU_FAQ } from "@/lib/marketing-i18n";
import { RahuKetuPariharamContent } from "./PageContent";

export const metadata: Metadata = {
  title: "Rahu-Ketu Pariharam — Nodal Remedy, Temples & Mantra | Vinaadi",
  description:
    "Rahu-Ketu pariharam: why the lunar nodes create instability, and the step-by-step devotional remedy — Thirunageswaram, Keezhaperumpallam, Aayilyam observances and the Rahu Beeja Mantra.",
  keywords: [
    "rahu ketu pariharam",
    "rahu pariharam",
    "ketu pariharam",
    "sarpa dosham remedy",
    "kala sarpa pariharam",
    "thirunageswaram rahu temple",
    "keezhaperumpallam ketu temple",
    "rahu beeja mantra",
    "ராகு கேது பரிகாரம்",
    "சர்ப்ப தோஷ பரிகாரம்",
  ],
  alternates: { canonical: "https://vinaadi.com/pariharam/rahu-ketu-pariharam" },
  openGraph: {
    title: "Rahu-Ketu Pariharam — Nodal Remedy, Temples & Mantra",
    description:
      "The traditional devotional remedy when the lunar nodes pressure the chart — step-by-step with the Rahu Beeja Mantra.",
    url: "https://vinaadi.com/pariharam/rahu-ketu-pariharam",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rahu-Ketu Pariharam — Nodal Remedy & Temples",
    description: "Thirunageswaram, Keezhaperumpallam, Aayilyam observances and the Rahu Beeja Mantra.",
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: PARIHARAM_RAHU_KETU_FAQ.map((f) => ({
    "@type": "Question",
    name: f.q.en,
    acceptedAnswer: { "@type": "Answer", text: f.a.en },
  })),
};

export default function RahuKetuPariharamPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <RahuKetuPariharamContent />
    </>
  );
}
