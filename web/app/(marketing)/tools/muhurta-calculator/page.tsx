import type { Metadata } from "next";
import { MuhurtaPageContent } from "./MuhurtaPageContent";

export const metadata: Metadata = {
  title: "Free Tamil Muhurtham Calculator — Auspicious Time Finder",
  description:
    "Find auspicious muhurtham dates and times for weddings, job starts, travel, exams, and more. Scored on Thirukanitham Panchangam and your birth chart — Tara Bala, Chandrashtama, dasa and hora — with both charts checked for a wedding. No account required.",
  keywords: [
    "muhurta calculator",
    "auspicious time Tamil",
    "shubh muhurat",
    "wedding muhurtham",
    "nalla neram",
    "Thirukanitham muhurtha",
    "Tamil panchangam timing",
    "rahu kalam",
  ],
  alternates: { canonical: "https://vinaadi.com/tools/muhurta-calculator" },
  openGraph: {
    title: "Free Tamil Muhurtham Calculator — Auspicious Time Finder",
    description:
      "Pick the best auspicious time for your event from Thirukanitham Panchangam and your birth chart. Covers tithi, Moon star, Rahu Kalam, Tara Bala and Chandrashtama — for both charts at a wedding.",
    url: "https://vinaadi.com/tools/muhurta-calculator",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Tamil Muhurtham Calculator",
    description:
      "Find auspicious muhurtham for weddings, job starts, travel, exams and more. Free, Thirukanitham-based.",
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is a muhurtham?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A muhurtham is an auspicious time window chosen by examining the Panchangam, especially the tithi (lunar day), Moon star, vara (weekday), yoga, and caution periods like Rahu Kalam. Starting important events during a good muhurtham is a long-standing Tamil tradition.",
      },
    },
    {
      "@type": "Question",
      name: "What events can I find muhurtham for?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You can find auspicious muhurtham for weddings, job or career starts, business and investments, property purchases, travel, exams and education, medical procedures, and spiritual events like puja or griha pravesh.",
      },
    },
    {
      "@type": "Question",
      // Rewritten 2026-09-15. The old answer said the tool "uses Panchangam
      // alone" and sold birth-chart personalisation as the account upgrade —
      // false since the tool moved onto the personalised endpoint, and this is
      // structured data a search engine can quote verbatim.
      name: "Does this muhurtham calculator use my birth chart?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Along with the Panchangam — tithi, Moon star, yoga, and Rahu Kalam — it reads the birth details you enter for Tara Bala, Chandra Bala, Chandrashtama, dasa, and hora. For a wedding it checks both the bride's and the groom's charts, and a day that is Chandrashtama for either of them is ruled out. The details are used once and not saved; a free Vinaadi account keeps your chart, so you can return to a shortlist and see the published muhurtham days ranked for you, or for you and your partner together.",
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
