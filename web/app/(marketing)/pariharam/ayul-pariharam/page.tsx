import type { Metadata } from "next";
import { PARIHARAM_AYUL_FAQ } from "@/lib/marketing-i18n";
import { AyulPariharamContent } from "./PageContent";

export const metadata: Metadata = {
  title: "Pariharam for Health & Longevity (Ayul Pariharam) | Vinaadi",
  description:
    "Ayul pariharam: 8th house, Sun and 6th house factors in health, and the traditional remedy — Vaitheeswaran Koil, Suryanar Koil, Surya worship and the Mahamrityunjaya mantra.",
  keywords: [
    "ayul pariharam",
    "health pariharam astrology",
    "longevity pariharam",
    "mahamrityunjaya pariharam",
    "vaitheeswaran koil health",
    "suryanar koil",
    "8th house health astrology",
    "sun worship health",
    "ஆயுள் பரிகாரம்",
    "மஹாம்ருத்யுஞ்சய மந்திரம்",
  ],
  alternates: { canonical: "https://vinaadi.com/pariharam/ayul-pariharam" },
  openGraph: {
    title: "Pariharam for Health & Longevity — Vaitheeswaran Koil & Mahamrityunjaya",
    description:
      "The 8th house, Sun and healing temple pariharam — with the Mahamrityunjaya mantra for health and longevity.",
    url: "https://vinaadi.com/pariharam/ayul-pariharam",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ayul Pariharam — Health Remedy & Mahamrityunjaya",
    description: "Vaitheeswaran Koil, Surya worship and the Mahamrityunjaya mantra for longevity.",
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: PARIHARAM_AYUL_FAQ.map((f) => ({
    "@type": "Question",
    name: f.q.en,
    acceptedAnswer: { "@type": "Answer", text: f.a.en },
  })),
};

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Pariharam for Health & Longevity (Ayul Pariharam)",
  about: "Ayul (health and longevity) pariharam in Tamil Vedic astrology",
  inLanguage: ["en", "ta"],
  publisher: { "@type": "Organization", name: "Vinaadi", url: "https://vinaadi.com" },
  mainEntityOfPage: "https://vinaadi.com/pariharam/ayul-pariharam",
};

export default function AyulPariharamPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <AyulPariharamContent />
    </>
  );
}
