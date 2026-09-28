import { withTamilTwin } from "@/lib/localized-metadata";
import { JsonLd, articleTa, faqPageLd } from "@/lib/json-ld";
import type { Metadata } from "next";
import { DOSHAM_PITHRU_FAQ } from "@/lib/marketing-i18n";
import { PithruDoshamContent } from "./PageContent";

const EN_METADATA: Metadata = {
  title: "Pithru Dosham — Ancestral Karma, Meaning, Chart Check & Pariharam",
  description:
    "Pithru dosham is the Sun-Rahu affliction (Pithru-Rahu yoga) or pressure on the 9th house. Learn what it means for fortune and lineage, how to read your chart, the most responsive pariharam (Amavasya tarpan), and the Sun slokam.",
  keywords: [
    "pithru dosham",
    "pitru dosha",
    "pithru dosha",
    "ancestral karma astrology",
    "pithru dosham pariharam",
    "amavasya tarpan",
    "pitru paksha",
    "பித்ரு தோஷம்",
    "sun rahu conjunction",
    "pithru rahu yoga",
  ],
  alternates: { canonical: "https://vinaadi.com/dosham/pithru-dosham" },
  openGraph: {
    title: "Pithru Dosham — Ancestral Karma, Meaning, Chart Check & Pariharam",
    description:
      "What Pithru dosham means for fortune and lineage, how Sun-Rahu affliction is read, why it is the most responsive dosham, and the traditional pariharam.",
    url: "https://vinaadi.com/dosham/pithru-dosham",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pithru Dosham — Ancestral Karma Explained",
    description: "Sun-Rahu yoga, 9th house, Amavasya tarpan and pariharam — calmly explained.",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withTamilTwin(EN_METADATA, "/dosham/pithru-dosham");
}

const FAQ_JSONLD = faqPageLd(DOSHAM_PITHRU_FAQ, "en");
const FAQ_JSONLD_TA = faqPageLd(DOSHAM_PITHRU_FAQ, "ta");

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Pithru Dosham — Ancestral Karma, Meaning, Chart Check & Pariharam",
  about: "Pithru dosham / Pitru dosha in Tamil Vedic astrology",
  inLanguage: ["en", "ta"],
  publisher: { "@type": "Organization", name: "Vinaadi", url: "https://vinaadi.com" },
  mainEntityOfPage: "https://vinaadi.com/dosham/pithru-dosham",
};

export default function PithruDoshamPage() {
  return (
    <>
      <JsonLd en={ARTICLE_JSONLD} ta={articleTa(ARTICLE_JSONLD)} />
      <JsonLd en={FAQ_JSONLD} ta={FAQ_JSONLD_TA} />
      <PithruDoshamContent />
    </>
  );
}
