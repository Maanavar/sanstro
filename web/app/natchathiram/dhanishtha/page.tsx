import type { Metadata } from "next";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { AVITTAM } from "@/lib/natchathiram-data";

export const metadata: Metadata = {
  title: AVITTAM.meta.title,
  description: AVITTAM.meta.description,
  keywords: AVITTAM.meta.keywords,
  alternates: { canonical: "https://vinaadi.com/natchathiram/dhanishtha" },
  openGraph: {
    title: AVITTAM.meta.title,
    description: AVITTAM.meta.description,
    url: "https://vinaadi.com/natchathiram/dhanishtha",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: AVITTAM.meta.title,
    description: AVITTAM.meta.description,
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: AVITTAM.faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: AVITTAM.meta.title,
  description: AVITTAM.meta.description,
  url: "https://vinaadi.com/natchathiram/dhanishtha",
  publisher: { "@type": "Organization", name: "Vinaadi" },
};

export default function DhanishthraPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }} />
      <NatchathiramPageContent data={AVITTAM} />
    </>
  );
}
