import type { Metadata } from "next";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { REVATHI } from "@/lib/natchathiram-data";

export const metadata: Metadata = {
  title: REVATHI.meta.title,
  description: REVATHI.meta.description,
  keywords: REVATHI.meta.keywords,
  alternates: { canonical: "https://vinaadi.com/natchathiram/revati" },
  openGraph: {
    title: REVATHI.meta.title,
    description: REVATHI.meta.description,
    url: "https://vinaadi.com/natchathiram/revati",
    type: "article",
    images: [{ url: "/brand/vinaadi-og-image.png", width: 1200, height: 630, alt: "Vinaadi — Tamil Astrology" }],
  },
  twitter: {
    card: "summary_large_image",
    title: REVATHI.meta.title,
    description: REVATHI.meta.description,
    images: ["/brand/vinaadi-og-image.png"],
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: REVATHI.faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: REVATHI.meta.title,
  description: REVATHI.meta.description,
  url: "https://vinaadi.com/natchathiram/revati",
  publisher: { "@type": "Organization", name: "Vinaadi" },
};

export default function RevatiPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }} />
      <NatchathiramPageContent data={REVATHI} />
    </>
  );
}
