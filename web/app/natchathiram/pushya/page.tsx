import type { Metadata } from "next";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { PUSHYA } from "@/lib/natchathiram-data";

export const metadata: Metadata = {
  title: PUSHYA.meta.title,
  description: PUSHYA.meta.description,
  keywords: PUSHYA.meta.keywords,
  alternates: { canonical: "https://vinaadi.com/natchathiram/pushya" },
  openGraph: {
    title: PUSHYA.meta.title,
    description: PUSHYA.meta.description,
    url: "https://vinaadi.com/natchathiram/pushya",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: PUSHYA.meta.title,
    description: PUSHYA.meta.description,
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: PUSHYA.faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: PUSHYA.meta.title,
  description: PUSHYA.meta.description,
  url: "https://vinaadi.com/natchathiram/pushya",
  publisher: { "@type": "Organization", name: "Vinaadi" },
};

export default function PushyaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }} />
      <NatchathiramPageContent data={PUSHYA} />
    </>
  );
}
