import type { Metadata } from "next";
import { TEMPLE_ARUPADAI_VEEDU_FAQ } from "@/lib/marketing-i18n";
import { ArupadaiVeeduContent } from "./PageContent";

export const metadata: Metadata = {
  title: "Arupadai Veedu — Six Sacred Abodes of Lord Murugan | Vinaadi",
  description:
    "The six sacred Murugan temples — Thiruparankundram, Thiruchendur, Palani, Swamimalai, Pazhamudircholai, Thiruthani — and the pilgrimage circuit for Sevvai dosham, Mars energy and courage.",
  keywords: [
    "arupadai veedu",
    "six murugan temples",
    "murugan pilgrimage circuit",
    "thiruparankundram murugan",
    "thiruchendur murugan",
    "palani murugan",
    "swamimalai murugan",
    "thiruthani murugan",
    "skanda sashti temples",
    "அறுபடை வீடு",
    "முருகன் யாத்திரை",
  ],
  alternates: { canonical: "https://vinaadi.com/temples/arupadai-veedu" },
  openGraph: {
    title: "Arupadai Veedu — The Six Sacred Abodes of Lord Murugan",
    description:
      "The six Murugan temples and their individual powers — the pilgrimage for Sevvai dosham, strength and grace in adversity.",
    url: "https://vinaadi.com/temples/arupadai-veedu",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arupadai Veedu — Six Murugan Temples & Their Powers",
    description: "Thiruparankundram, Thiruchendur, Palani, Swamimalai, Pazhamudircholai, Thiruthani — and when to visit.",
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: TEMPLE_ARUPADAI_VEEDU_FAQ.map((f) => ({
    "@type": "Question",
    name: f.q.en,
    acceptedAnswer: { "@type": "Answer", text: f.a.en },
  })),
};

export default function ArupadaiVeeduPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <ArupadaiVeeduContent />
    </>
  );
}
