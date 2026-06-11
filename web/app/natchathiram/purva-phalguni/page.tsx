import type { Metadata } from "next";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { PURVA_PHALGUNI } from "@/lib/natchathiram-data";

export const metadata: Metadata = {
  title: PURVA_PHALGUNI.meta.title,
  description: PURVA_PHALGUNI.meta.description,
  keywords: PURVA_PHALGUNI.meta.keywords,
  alternates: { canonical: "https://vinaadi.com/natchathiram/purva-phalguni" },
  openGraph: {
    title: PURVA_PHALGUNI.meta.title,
    description: PURVA_PHALGUNI.meta.description,
    url: "https://vinaadi.com/natchathiram/purva-phalguni",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: PURVA_PHALGUNI.meta.title,
    description: PURVA_PHALGUNI.meta.description,
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: PURVA_PHALGUNI.faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: PURVA_PHALGUNI.meta.title,
  description: PURVA_PHALGUNI.meta.description,
  url: "https://vinaadi.com/natchathiram/purva-phalguni",
  publisher: { "@type": "Organization", name: "Vinaadi" },
};

export default function PurvaPhalguni() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }} />
      <NatchathiramPageContent data={PURVA_PHALGUNI} />
    </>
  );
}
