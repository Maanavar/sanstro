import type { Metadata } from "next";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { PUNARVASU } from "@/lib/natchathiram-data";

export const metadata: Metadata = {
  title: PUNARVASU.meta.title,
  description: PUNARVASU.meta.description,
  keywords: PUNARVASU.meta.keywords,
  alternates: { canonical: "https://vinaadi.com/natchathiram/punarvasu" },
  openGraph: {
    title: PUNARVASU.meta.title,
    description: PUNARVASU.meta.description,
    url: "https://vinaadi.com/natchathiram/punarvasu",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: PUNARVASU.meta.title,
    description: PUNARVASU.meta.description,
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: PUNARVASU.faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: PUNARVASU.meta.title,
  description: PUNARVASU.meta.description,
  url: "https://vinaadi.com/natchathiram/punarvasu",
  publisher: { "@type": "Organization", name: "Vinaadi" },
};

export default function PunarvasuPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }} />
      <NatchathiramPageContent data={PUNARVASU} />
    </>
  );
}
