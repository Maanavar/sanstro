import type { Metadata } from "next";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { ASHLESHA } from "@/lib/natchathiram-data";

export const metadata: Metadata = {
  title: ASHLESHA.meta.title,
  description: ASHLESHA.meta.description,
  keywords: ASHLESHA.meta.keywords,
  alternates: { canonical: "https://vinaadi.com/natchathiram/ashlesha" },
  openGraph: {
    title: ASHLESHA.meta.title,
    description: ASHLESHA.meta.description,
    url: "https://vinaadi.com/natchathiram/ashlesha",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: ASHLESHA.meta.title,
    description: ASHLESHA.meta.description,
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: ASHLESHA.faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: ASHLESHA.meta.title,
  description: ASHLESHA.meta.description,
  url: "https://vinaadi.com/natchathiram/ashlesha",
  publisher: { "@type": "Organization", name: "Vinaadi" },
};

export default function AshleshaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }} />
      <NatchathiramPageContent data={ASHLESHA} />
    </>
  );
}
