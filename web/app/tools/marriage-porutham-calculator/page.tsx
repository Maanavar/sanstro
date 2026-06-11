import type { Metadata } from "next";
import { PoruthamPageContent } from "./PoruthamPageContent";

export const metadata: Metadata = {
  title: "Free Tamil Birth Star Porutham Preview",
  description:
    "Get a quick Tamil birth-star porutham preview with Rajju, Vedha, Rasi, and Nadi cautions. Sign in for the full chart-grade 36-point porutham reading.",
  keywords: [
    "porutham calculator",
    "Tamil marriage compatibility",
    "birth star porutham",
    "10 factor check",
    "rajju dosha",
    "nadi dosha",
    "Thirukanitham porutham",
    "jathaga porutham",
  ],
  alternates: { canonical: "https://vinaadi.com/tools/marriage-porutham-calculator" },
  openGraph: {
    title: "Free Tamil Birth Star Porutham Preview",
    description:
      "Check a quick birth-star compatibility preview first. For full 36-point porutham, Nadi cancellation, Sevvai dosham, D9, and dasha context, use the signed-in dashboard.",
    url: "https://vinaadi.com/tools/marriage-porutham-calculator",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Tamil Birth Star Porutham Preview",
    description:
      "Quick Tamil birth-star porutham preview with Rajju, Vedha, Rasi, and Nadi cautions. Full chart reading is available after sign-in.",
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is porutham in Tamil astrology?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Porutham is the Tamil system of checking marriage compatibility using the birth stars and horoscopes of both partners. The public Vinaadi tool gives a quick birth-star preview; the signed-in dashboard gives the fuller chart-grade reading.",
      },
    },
    {
      "@type": "Question",
      name: "How many porutham factors are checked?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The public tool is a quick birth-star preview. It shows the main star-based porutham checks and separately flags Rajju, Vedha, Rasi, and same-Nadi cautions. The signed-in dashboard uses the fuller 36-point porutham engine with chart context.",
      },
    },
    {
      "@type": "Question",
      name: "What is the minimum porutham score for marriage?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The quick /10 score is only a first look and should not be treated as a final marriage verdict. For a proper Tamil porutham decision, use the signed-in dashboard so the 36-point score, Rajju, Vedha, Nadi, Sevvai dosham, D9, and dasha context can be read together.",
      },
    },
    {
      "@type": "Question",
      name: "What is Nadi dosha and can it be cancelled?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Nadi dosha is traditionally considered when both partners fall in the same Nadi category. The public tool flags same-Nadi as a caution only. Cancellation and final judgement require full chart context, which is handled in the signed-in porutham report.",
      },
    },
    {
      "@type": "Question",
      name: "Is the porutham calculator free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The public birth-star preview is free and does not require an account. For the detailed saved report with full chart reasoning and dosha context, sign in and use the dashboard.",
      },
    },
  ],
};

export default function PoruthamCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />
      <PoruthamPageContent />
    </>
  );
}
