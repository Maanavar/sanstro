import type { Metadata } from "next";
import { TEMPLE_PANCHA_BHOOTA_FAQ } from "@/lib/marketing-i18n";
import { PanchaBhootaContent } from "./PageContent";

export const metadata: Metadata = {
  title: "Pancha Bhoota Sthalams — Five Element Temples of Shiva | Vinaadi",
  description:
    "The five Shiva temples of the elements — Kanchipuram (earth), Thiruvanaikaval (water), Thiruvannamalai (fire), Srikalahasti (wind), Chidambaram (space) — and how to do the pilgrimage circuit.",
  keywords: [
    "pancha bhoota sthalams",
    "five element temples shiva",
    "ekambareswarar kanchipuram",
    "jambukeswarar thiruvanaikaval",
    "arunachaleswarar thiruvannamalai",
    "srikalahasti temple",
    "nataraja chidambaram",
    "pancha bhuta stalas",
    "பஞ்ச பூத ஸ்தலங்கள்",
    "ஐம்பூத கோயில்கள்",
  ],
  alternates: { canonical: "https://vinaadi.com/temples/pancha-bhoota-sthalams" },
  openGraph: {
    title: "Pancha Bhoota Sthalams — The Five Element Temples of Shiva",
    description:
      "The five ancient Shiva temples for elemental purification and planetary harmony — Kanchipuram, Thiruvanaikaval, Thiruvannamalai, Srikalahasti, Chidambaram.",
    url: "https://vinaadi.com/temples/pancha-bhoota-sthalams",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pancha Bhoota Sthalams — Five Shiva Element Temples",
    description: "The pilgrimage circuit of earth, water, fire, wind, and space — with the Panchakshara mantra.",
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: TEMPLE_PANCHA_BHOOTA_FAQ.map((f) => ({
    "@type": "Question",
    name: f.q.en,
    acceptedAnswer: { "@type": "Answer", text: f.a.en },
  })),
};

export default function PanchaBhootaSthalamsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <PanchaBhootaContent />
    </>
  );
}
