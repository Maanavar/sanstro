import { withTamilTwin } from "@/lib/localized-metadata";
import { JsonLd, articleTa, faqPageLd } from "@/lib/json-ld";
import type { Metadata } from "next";
import { PARIHARAM_KADAN_FAQ } from "@/lib/marketing-i18n";
import { KadanPariharamContent } from "./PageContent";

const EN_METADATA: Metadata = {
  title: "Pariharam for Debt & Financial Strain (Kadan Pariharam)",
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

export async function generateMetadata(): Promise<Metadata> {
  return withTamilTwin(EN_METADATA, "/pariharam/kadan-pariharam");
}

const FAQ_JSONLD = faqPageLd(PARIHARAM_KADAN_FAQ, "en");
const FAQ_JSONLD_TA = faqPageLd(PARIHARAM_KADAN_FAQ, "ta");

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Pariharam for Debt & Financial Strain (Kadan Pariharam)",
  about: "Kadan (debt) pariharam in Tamil Vedic astrology",
  inLanguage: ["en", "ta"],
  publisher: { "@type": "Organization", name: "Vinaadi", url: "https://vinaadi.com" },
  mainEntityOfPage: "https://vinaadi.com/pariharam/kadan-pariharam",
};

export default function KadanPariharamPage() {
  return (
    <>
      <JsonLd en={ARTICLE_JSONLD} ta={articleTa(ARTICLE_JSONLD)} />
      <JsonLd en={FAQ_JSONLD} ta={FAQ_JSONLD_TA} />
      <KadanPariharamContent />
    </>
  );
}
