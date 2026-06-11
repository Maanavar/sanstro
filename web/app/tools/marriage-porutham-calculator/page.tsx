import type { Metadata } from "next";
import { PoruthamPageContent } from "./PoruthamPageContent";

export const metadata: Metadata = {
  title: "Free Tamil Porutham Calculator — 10-Factor Compatibility Check",
  description:
    "Check marriage compatibility instantly with our free Tamil astrology porutham calculator. Verifies all 10 factors including Rajju and Nadi dosha using Thirukanitham-based calculations. No account required.",
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
    title: "Free Tamil Porutham Calculator — 10-Factor Compatibility",
    description:
      "Check marriage compatibility instantly. Our free porutham calculator checks all 10 factors — Dinam, Ganam, Rajju, Nadi, and more — using precise Thirukanitham calculations.",
    url: "https://vinaadi.com/tools/marriage-porutham-calculator",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Tamil Porutham Calculator — 10-Factor Compatibility",
    description: "Check all 10 porutham factors including Rajju and Nadi dosha. Free, instant, Thirukanitham-based.",
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
        text: "Porutham is the Tamil system of checking marriage compatibility using the birth stars of both partners. It evaluates 10 factors covering temperament, health, longevity, and intimacy using Thirukanitham calculations.",
      },
    },
    {
      "@type": "Question",
      name: "How many porutham factors are checked?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "There are 10 porutham factors: Dinam, Ganam, Mahendram, Stree Deergham, Yoni, Rajju, Vedha, Rasi, Rasiyathipathi (Graha Maitri), and Nadi. The maximum total score is 36 points. Additionally, Rajju dosha and Nadi dosha are checked as critical factors independent of the score.",
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
        text: "Nadi dosha occurs when both partners share the same Nadi category (Adi, Madhya, or Antya). It is associated with health concerns for offspring. Certain conditions, such as different moon signs or different birth stars, can cancel the dosha. Vinaadi checks these cancellations automatically.",
      },
    },
    {
      "@type": "Question",
      name: "Is the porutham calculator free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, the Vinaadi porutham calculator is completely free. Enter birth date, time, and place for both partners and get an instant compatibility report covering all 10 factors and dosha checks. No account or registration required.",
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
