import type { Metadata } from "next";
import { PARIHARAM_PUTHRA_FAQ } from "@/lib/marketing-i18n";
import { PuthraPariharamContent } from "./PageContent";

export const metadata: Metadata = {
  title: "Pariharam for Childbirth Blessings (Puthra Pariharam) | Vinaadi",
  description:
    "Puthra pariharam: when the 5th house feels blocked — Jupiter, Rahu-Ketu, and naga dosham factors — and the traditional remedy: Alangudi, naga propitiation, Santhana Gopala mantra and Murugan worship.",
  keywords: [
    "puthra pariharam",
    "childbirth pariharam",
    "5th house pariharam",
    "alangudi guru temple",
    "santhana gopala mantra",
    "naga dosham childbirth",
    "murugan puthra",
    "putra bhagya astrology",
    "புத்திர பரிகாரம்",
    "சந்தான கோபால மந்திரம்",
  ],
  alternates: { canonical: "https://vinaadi.com/pariharam/puthra-pariharam" },
  openGraph: {
    title: "Pariharam for Childbirth Blessings — Jupiter, Murugan & Santhana Gopala",
    description:
      "The 5th house, Jupiter and naga connection to childbirth delay, and the devotional pariharam with Santhana Gopala mantra.",
    url: "https://vinaadi.com/pariharam/puthra-pariharam",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Puthra Pariharam — Childbirth Blessings & Santhana Gopala",
    description: "Alangudi, naga propitiation and Santhana Gopala mantra for children's blessings.",
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: PARIHARAM_PUTHRA_FAQ.map((f) => ({
    "@type": "Question",
    name: f.q.en,
    acceptedAnswer: { "@type": "Answer", text: f.a.en },
  })),
};

export default function PuthraPariharamPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <PuthraPariharamContent />
    </>
  );
}
