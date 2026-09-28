import { withTamilTwin } from "@/lib/localized-metadata";
import { JsonLd, articleTa, faqPageLd } from "@/lib/json-ld";
import type { Metadata } from "next";
import { PARIHARAM_NAGA_FAQ } from "@/lib/marketing-i18n";
import { NagaDoshaPariharamContent } from "./PageContent";

const EN_METADATA: Metadata = {
  title: "Naga Dosham Pariharam — Sarpa Remedy, Temples & Observances",
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

export async function generateMetadata(): Promise<Metadata> {
  return withTamilTwin(EN_METADATA, "/pariharam/naga-dosha-pariharam");
}

const FAQ_JSONLD = faqPageLd(PARIHARAM_NAGA_FAQ, "en");
const FAQ_JSONLD_TA = faqPageLd(PARIHARAM_NAGA_FAQ, "ta");

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Naga Dosham Pariharam — Sarpa Remedy, Temples & Observances",
  about: "Naga dosham (sarpa dosham) pariharam in Tamil Vedic astrology",
  inLanguage: ["en", "ta"],
  publisher: { "@type": "Organization", name: "Vinaadi", url: "https://vinaadi.com" },
  mainEntityOfPage: "https://vinaadi.com/pariharam/naga-dosha-pariharam",
};

export default function NagaDoshaPariharamPage() {
  return (
    <>
      <JsonLd en={ARTICLE_JSONLD} ta={articleTa(ARTICLE_JSONLD)} />
      <JsonLd en={FAQ_JSONLD} ta={FAQ_JSONLD_TA} />
      <NagaDoshaPariharamContent />
    </>
  );
}
