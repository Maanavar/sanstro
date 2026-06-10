import type { Metadata } from "next";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { ASHWINI } from "@/lib/natchathiram-data";

export const metadata: Metadata = {
  title: ASHWINI.meta.title,
  description: ASHWINI.meta.description,
  keywords: ASHWINI.meta.keywords,
  alternates: { canonical: "https://vinaadi.com/natchathiram/ashwini" },
  openGraph: {
    title: ASHWINI.meta.title,
    description: ASHWINI.meta.description,
    url: "https://vinaadi.com/natchathiram/ashwini",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: ASHWINI.meta.title,
    description: ASHWINI.meta.description,
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: ASHWINI.faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: ASHWINI.meta.title,
  description: ASHWINI.meta.description,
  url: "https://vinaadi.com/natchathiram/ashwini",
  publisher: { "@type": "Organization", name: "Vinaadi" },
};

export default function AshwiniPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }} />
      <NatchathiramPageContent data={ASHWINI} />
    </>
  );
}
