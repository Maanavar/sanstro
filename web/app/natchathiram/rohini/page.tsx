import type { Metadata } from "next";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { ROHINI } from "@/lib/natchathiram-data";

export const metadata: Metadata = {
  title: ROHINI.meta.title,
  description: ROHINI.meta.description,
  keywords: ROHINI.meta.keywords,
  alternates: { canonical: "https://vinaadi.com/natchathiram/rohini" },
  openGraph: {
    title: ROHINI.meta.title,
    description: ROHINI.meta.description,
    url: "https://vinaadi.com/natchathiram/rohini",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: ROHINI.meta.title,
    description: ROHINI.meta.description,
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: ROHINI.faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: ROHINI.meta.title,
  description: ROHINI.meta.description,
  url: "https://vinaadi.com/natchathiram/rohini",
  publisher: { "@type": "Organization", name: "Vinaadi" },
};

export default function RohiniPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }} />
      <NatchathiramPageContent data={ROHINI} />
    </>
  );
}
