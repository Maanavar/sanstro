import type { Metadata } from "next";
import { JadhagamPageContent } from "./JadhagamPageContent";

export const metadata: Metadata = {
  title: "Free Tamil Jadhagam Generator — South Indian Birth Chart with D1 & D9 | Vinaadi",
  description:
    "Generate your Thirukanitham-precise South Indian Tamil jadhagam free. Get D1 Rasi chart, D9 Navamsa, all planet positions with nakshatra details, and full Vimshottari dasha sequence. No account required.",
  keywords: [
    "jadhagam generator",
    "jathagam online free",
    "Tamil birth chart",
    "South Indian horoscope",
    "D1 D9 chart Tamil",
    "Thirukanitham jadhagam",
    "birth chart Tamil astrology",
    "nakshatra birth chart",
    "Vimshottari dasha",
    "Tamil jathagam calculator",
  ],
  alternates: { canonical: "https://vinaadi.com/tools/jadhagam-generator" },
  openGraph: {
    title: "Free Tamil Jadhagam Generator — South Indian Birth Chart with D1 & D9",
    description:
      "Generate a Thirukanitham-precise South Indian jadhagam with D1 Rasi chart, D9 Navamsa, planet positions, and full dasha sequence. Free, no account needed.",
    url: "https://vinaadi.com/tools/jadhagam-generator",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Tamil Jadhagam Generator — D1 & D9 South Indian Birth Chart",
    description: "Thirukanitham-precise Tamil jadhagam with D1, D9, planet positions, nakshatra, and dasha. Free.",
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is a Tamil jadhagam?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A jadhagam (also spelled jathagam) is the South Indian Tamil birth chart — a fixed square grid showing the positions of all 9 planets across the 12 rasis at the moment of birth. It includes the lagna (rising sign), nakshatra details, and forms the basis for dasha calculation and astrological readings.",
      },
    },
    {
      "@type": "Question",
      name: "What does the Vinaadi jadhagam generator include?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Every generated jadhagam includes: D1 Rasi chart (the main South Indian square chart), D9 Navamsa chart (divisional chart for deeper patterns), planet positions with longitude, rasi, nakshatra, pada and retrograde status for all 9 planets, and the full Vimshottari dasha-bhukti sequence with start and end dates.",
      },
    },
    {
      "@type": "Question",
      name: "What calculation method is used — Thirukanitham or Vakya?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Vinaadi uses Thirukanitham — the precise astronomical calculation method that uses actual (drik) planetary positions computed with the Swiss Ephemeris and Lahiri ayanamsa. Thirukanitham is more accurate than the traditional Vakya method for contemporary birth charts.",
      },
    },
    {
      "@type": "Question",
      name: "Is the jadhagam generator free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, the jadhagam generator is completely free. Enter date, time, and place of birth to get your full South Indian chart including D1, D9, planet positions, and dasha sequence. No account or registration is required.",
      },
    },
    {
      "@type": "Question",
      name: "What is the D9 Navamsa chart?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The D9 Navamsa is a divisional chart derived from the D1 Rasi chart by dividing each sign into 9 equal parts. It is used to examine deeper patterns beyond the main chart — especially marriage, dharma, and the second half of life. Both D1 and D9 are generated together in Vinaadi.",
      },
    },
  ],
};

export default function JadhagamGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />
      <JadhagamPageContent />
    </>
  );
}
