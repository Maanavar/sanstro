import type { Metadata } from "next";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { KRITTIKA } from "@/lib/natchathiram-data";

export const metadata: Metadata = {
  title: KRITTIKA.meta.title,
  description: KRITTIKA.meta.description,
  keywords: KRITTIKA.meta.keywords,
  alternates: { canonical: "https://vinaadi.com/natchathiram/krittika" },
  openGraph: {
    title: KRITTIKA.meta.title,
    description: KRITTIKA.meta.description,
    url: "https://vinaadi.com/natchathiram/krittika",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: KRITTIKA.meta.title,
    description: KRITTIKA.meta.description,
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: KRITTIKA.faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: KRITTIKA.meta.title,
  description: KRITTIKA.meta.description,
  url: "https://vinaadi.com/natchathiram/krittika",
  publisher: { "@type": "Organization", name: "Vinaadi" },
};

export default function KrittikaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }} />
      <NatchathiramPageContent data={KRITTIKA} />
    </>
  );
}
