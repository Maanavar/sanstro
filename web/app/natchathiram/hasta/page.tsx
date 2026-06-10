import type { Metadata } from "next";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { HASTA } from "@/lib/natchathiram-data";

export const metadata: Metadata = {
  title: HASTA.meta.title,
  description: HASTA.meta.description,
  keywords: HASTA.meta.keywords,
  alternates: { canonical: "https://vinaadi.com/natchathiram/hasta" },
  openGraph: {
    title: HASTA.meta.title,
    description: HASTA.meta.description,
    url: "https://vinaadi.com/natchathiram/hasta",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: HASTA.meta.title,
    description: HASTA.meta.description,
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: HASTA.faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: HASTA.meta.title,
  description: HASTA.meta.description,
  url: "https://vinaadi.com/natchathiram/hasta",
  publisher: { "@type": "Organization", name: "Vinaadi" },
};

export default function HastaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }} />
      <NatchathiramPageContent data={HASTA} />
    </>
  );
}
