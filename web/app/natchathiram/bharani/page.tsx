import type { Metadata } from "next";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { BHARANI } from "@/lib/natchathiram-data";

export const metadata: Metadata = {
  title: BHARANI.meta.title,
  description: BHARANI.meta.description,
  keywords: BHARANI.meta.keywords,
  alternates: { canonical: "https://vinaadi.com/natchathiram/bharani" },
  openGraph: {
    title: BHARANI.meta.title,
    description: BHARANI.meta.description,
    url: "https://vinaadi.com/natchathiram/bharani",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: BHARANI.meta.title,
    description: BHARANI.meta.description,
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: BHARANI.faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: BHARANI.meta.title,
  description: BHARANI.meta.description,
  url: "https://vinaadi.com/natchathiram/bharani",
  publisher: { "@type": "Organization", name: "Vinaadi" },
};

export default function BharaniPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }} />
      <NatchathiramPageContent data={BHARANI} />
    </>
  );
}
