import type { Metadata } from "next";
import { MuhurtaPageContent } from "./MuhurtaPageContent";

export const metadata: Metadata = {
  title: "Free Tamil Muhurta Calculator — Auspicious Time Finder",
  description:
    "Find auspicious muhurta dates and times for weddings, job starts, travel, exams, and more. Uses Thirukanitham Panchangam — tithi, nakshatra, Rahu Kalam — to pick the best windows. No account required.",
  keywords: [
    "muhurta calculator",
    "auspicious time Tamil",
    "shubh muhurat",
    "wedding muhurta",
    "nalla neram",
    "Thirukanitham muhurtha",
    "Tamil panchangam timing",
    "rahu kalam",
  ],
  alternates: { canonical: "https://vinaadi.com/tools/muhurta-calculator" },
  openGraph: {
    title: "Free Tamil Muhurta Calculator — Auspicious Time Finder",
    description:
      "Pick the best auspicious time for your event using Thirukanitham Panchangam. Covers tithi, nakshatra, Rahu Kalam and Abhijit muhurta.",
    url: "https://vinaadi.com/tools/muhurta-calculator",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Tamil Muhurta Calculator",
    description:
      "Find auspicious muhurta for weddings, job starts, travel, exams and more. Free, Thirukanitham-based.",
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is a muhurta?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A muhurta is an auspicious time window chosen by examining the Panchangam — specifically the tithi (lunar day), nakshatra (birth star), vara (weekday), yoga, and inauspicious periods like Rahu Kalam. Starting important events during a good muhurta is a core Tamil and Hindu tradition.",
      },
    },
    {
      "@type": "Question",
      name: "What events can I find muhurta for?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You can find auspicious muhurta for weddings, job or career starts, business and investments, property purchases, travel, exams and education, medical procedures, and spiritual events like puja or griha pravesh.",
      },
    },
    {
      "@type": "Question",
      name: "How is this muhurta calculator different from a personalised one?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "This free tool uses Panchangam alone — tithi, nakshatra, yoga, and Rahu Kalam. A personalised muhurta (available with a free Vinaadi account) also considers your birth chart: dasha support, hora windows, and Chandrashtama avoidance. The personalised version is significantly stronger.",
      },
    },
    {
      "@type": "Question",
      name: "What is Rahu Kalam and why is it avoided?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Rahu Kalam is a daily inauspicious period governed by the shadow planet Rahu. It falls at a different time each day of the week based on local sunrise. Starting auspicious activities during Rahu Kalam is traditionally avoided in Tamil astrology.",
      },
    },
    {
      "@type": "Question",
      name: "What calculations does Vinaadi use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Vinaadi uses the Thirukanitham (திருகணிதம்) system — a Tamil tradition that applies precise astronomical calculations rather than traditional mean-value tables. Panchangam elements are computed using real planetary positions for your location.",
      },
    },
  ],
};

export default function MuhurtaCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />
      <MuhurtaPageContent />
    </>
  );
}
