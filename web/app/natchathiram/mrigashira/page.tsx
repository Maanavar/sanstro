import type { Metadata } from "next";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { MRIGASHIRA } from "@/lib/natchathiram-data";

export const metadata: Metadata = {
  title: MRIGASHIRA.meta.title,
  description: MRIGASHIRA.meta.description,
  keywords: MRIGASHIRA.meta.keywords,
  alternates: { canonical: "https://vinaadi.com/natchathiram/mrigashira" },
  openGraph: {
    title: MRIGASHIRA.meta.title,
    description: MRIGASHIRA.meta.description,
    url: "https://vinaadi.com/natchathiram/mrigashira",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: MRIGASHIRA.meta.title,
    description: MRIGASHIRA.meta.description,
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: MRIGASHIRA.faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: MRIGASHIRA.meta.title,
  description: MRIGASHIRA.meta.description,
  url: "https://vinaadi.com/natchathiram/mrigashira",
  publisher: { "@type": "Organization", name: "Vinaadi" },
};

export default function MrigashiraPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }} />
      <NatchathiramPageContent data={MRIGASHIRA} />
    </>
  );
}
