import type { Metadata } from "next";
import { PoruthamPageContent } from "./PoruthamPageContent";

export const metadata: Metadata = {
  title: "Free Tamil Porutham Calculator — 10 Kuta Compatibility Check",
  description:
    "Check marriage compatibility instantly with our free Tamil astrology porutham calculator. Verifies all 10 kutas including Rajju and Nadi dosha using Thirukanitham-based calculations. No account required.",
  keywords: [
    "porutham calculator",
    "Tamil marriage compatibility",
    "nakshatra porutham",
    "10 kuta check",
    "rajju dosha",
    "nadi dosha",
    "Thirukanitham porutham",
    "jathaga porutham",
  ],
  alternates: { canonical: "https://vinaadi.com/tools/marriage-porutham-calculator" },
  openGraph: {
    title: "Free Tamil Porutham Calculator — 10 Kuta Compatibility",
    description:
      "Check marriage compatibility instantly. Our free porutham calculator checks all 10 kutas — Dinam, Ganam, Rajju, Nadi, and more — using precise Thirukanitham calculations.",
    url: "https://vinaadi.com/tools/marriage-porutham-calculator",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Tamil Porutham Calculator — 10 Kuta Compatibility",
    description: "Check all 10 porutham kutas including Rajju & Nadi dosha. Free, instant, Thirukanitham-based.",
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
        text: "Porutham is the Tamil system of checking marriage compatibility using the birth nakshatras (birth stars) of both partners. It evaluates 10 factors called kutas — covering temperament, health, longevity, and intimacy — based on Thirukanitham (astronomically precise) calculations.",
      },
    },
    {
      "@type": "Question",
      name: "How many porutham factors are checked?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "There are 10 porutham factors (kutas): Dinam, Ganam, Mahendram, Stree Deergham, Yoni, Rajju, Vedha, Rasi, Rasiyathipathi (Graha Maitri), and Nadi. The maximum total score is 36 points. Additionally, Rajju dosha and Nadi dosha are checked as critical factors independent of the score.",
      },
    },
    {
      "@type": "Question",
      name: "What is the minimum porutham score for marriage?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Traditionally, a score of 18 or above out of 36 is considered acceptable for marriage. However, Rajju dosha and Nadi dosha are critical checks that must also be clear regardless of the total score. Vinaadi evaluates both the score and these special doshas.",
      },
    },
    {
      "@type": "Question",
      name: "What is Nadi dosha and can it be cancelled?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Nadi dosha occurs when both partners share the same Nadi category (Adi, Madhya, or Antya). It is associated with health concerns for offspring. Certain conditions — such as different Rasi (moon sign) or different Nakshatra — can cancel the dosha. Vinaadi checks these cancellations automatically.",
      },
    },
    {
      "@type": "Question",
      name: "Is the porutham calculator free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, the Vinaadi porutham calculator is completely free. Enter birth date, time, and place for both partners and get an instant compatibility report covering all 10 kutas and dosha checks. No account or registration required.",
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
