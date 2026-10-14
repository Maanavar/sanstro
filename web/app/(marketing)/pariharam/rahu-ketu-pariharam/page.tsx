import { withTamilTwin } from "@/lib/localized-metadata";
import { JsonLd, articleTa, faqPageLd } from "@/lib/json-ld";
import type { Metadata } from "next";
import { PARIHARAM_RAHU_KETU_FAQ } from "@/lib/marketing-i18n";
import { RahuKetuPariharamContent } from "./PageContent";

const EN_METADATA: Metadata = {
  title: "Rahu-Ketu Pariharam — Nodal Remedy, Temples & Mantra",
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

export async function generateMetadata(): Promise<Metadata> {
  return withTamilTwin(EN_METADATA, "/pariharam/rahu-ketu-pariharam");
}

const FAQ_JSONLD = faqPageLd(PARIHARAM_RAHU_KETU_FAQ, "en");
const FAQ_JSONLD_TA = faqPageLd(PARIHARAM_RAHU_KETU_FAQ, "ta");

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Rahu-Ketu Pariharam — Nodal Remedy, Temples & Mantra",
  about: "Rahu-Ketu (lunar node) pariharam in Tamil Vedic astrology",
  inLanguage: ["en", "ta"],
  publisher: { "@type": "Organization", name: "Vinaadi", url: "https://vinaadi.com" },
  mainEntityOfPage: "https://vinaadi.com/pariharam/rahu-ketu-pariharam",
};

export default function RahuKetuPariharamPage() {
  return (
    <>
      <JsonLd en={ARTICLE_JSONLD} ta={articleTa(ARTICLE_JSONLD)} />
      <JsonLd en={FAQ_JSONLD} ta={FAQ_JSONLD_TA} />
      <RahuKetuPariharamContent />
    </>
  );
}
