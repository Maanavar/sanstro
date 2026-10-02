import { withTamilTwin } from "@/lib/localized-metadata";
import { JsonLd, faqPageLd } from "@/lib/json-ld";
import type { Metadata } from "next";
import { TEMPLE_ARUPADAI_VEEDU_FAQ } from "@/lib/marketing-i18n";
import { ArupadaiVeeduContent } from "./PageContent";

const EN_METADATA: Metadata = {
  title: "Arupadai Veedu — Six Sacred Abodes of Lord Murugan",
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

export async function generateMetadata(): Promise<Metadata> {
  return withTamilTwin(EN_METADATA, "/temples/arupadai-veedu");
}

const FAQ_JSONLD = faqPageLd(TEMPLE_ARUPADAI_VEEDU_FAQ, "en");
const FAQ_JSONLD_TA = faqPageLd(TEMPLE_ARUPADAI_VEEDU_FAQ, "ta");

export default function ArupadaiVeeduPage() {
  return (
    <>
      <JsonLd en={FAQ_JSONLD} ta={FAQ_JSONLD_TA} />
      <ArupadaiVeeduContent />
    </>
  );
}
