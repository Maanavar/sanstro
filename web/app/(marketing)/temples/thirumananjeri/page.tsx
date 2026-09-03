import type { Metadata } from "next";
import { TEMPLE_THIRUMANANJERI_FAQ } from "@/lib/marketing-i18n";
import { ThirumananjeriContent } from "./PageContent";

export const metadata: Metadata = {
  title: "Thirumananjeri Temple — Divine Marriage, Blessings & Pariharam | Vinaadi",
  description:
    "Thirumananjeri is where Shiva and Parvati were wed — the foremost temple for marriage blessings, thirumana thadai pariharam, and the Swayamvara Parvati mantra.",
  keywords: [
    "thirumananjeri temple",
    "thirumananjeri marriage temple",
    "thirumana thadai pariharam",
    "swayamvara parvati temple",
    "sivakama sundara thirumananjeri",
    "marriage blessing temple tamil",
    "திருமணஞ்சேரி கோயில்",
    "திருமண வாழ்த்து கோயில்",
    "சுயம்வர பார்வதி",
  ],
  alternates: { canonical: "https://vinaadi.com/temples/thirumananjeri" },
  openGraph: {
    title: "Thirumananjeri — The Temple of the Divine Marriage",
    description:
      "Where Shiva married Parvati — the primary Tamil temple for marriage blessings and thirumana thadai pariharam.",
    url: "https://vinaadi.com/temples/thirumananjeri",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Thirumananjeri — Divine Marriage Temple & Blessings",
    description: "Swayamvara Parvati mantra and the temple for marriage blessings in Tamil astrology.",
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: TEMPLE_THIRUMANANJERI_FAQ.map((f) => ({
    "@type": "Question",
    name: f.q.en,
    acceptedAnswer: { "@type": "Answer", text: f.a.en },
  })),
};

export default function ThirumananjeriPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <ThirumananjeriContent />
    </>
  );
}
