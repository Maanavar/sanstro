import { withTamilTwin } from "@/lib/localized-metadata";
import { JsonLd, faqPageLd } from "@/lib/json-ld";
import type { Metadata } from "next";
import { TEMPLE_PANCHA_BHOOTA_FAQ } from "@/lib/marketing-i18n";
import { PanchaBhootaContent } from "./PageContent";

const EN_METADATA: Metadata = {
  title: "Pancha Bhoota Sthalams — Five Element Temples of Shiva",
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

export async function generateMetadata(): Promise<Metadata> {
  return withTamilTwin(EN_METADATA, "/temples/pancha-bhoota-sthalams");
}

const FAQ_JSONLD = faqPageLd(TEMPLE_PANCHA_BHOOTA_FAQ, "en");
const FAQ_JSONLD_TA = faqPageLd(TEMPLE_PANCHA_BHOOTA_FAQ, "ta");

export default function PanchaBhootaSthalamsPage() {
  return (
    <>
      <JsonLd en={FAQ_JSONLD} ta={FAQ_JSONLD_TA} />
      <PanchaBhootaContent />
    </>
  );
}
