import type { Metadata } from "next";
import { PanchangamPageContent } from "./PanchangamPageContent";

export const metadata: Metadata = {
  title: "Tamil Panchangam Today — Tithi, Birth Star, Rahu Kalam & Nalla Neram",
  description:
    "Get today's Tamil panchangam with Tithi, Vara, Birth Star, Yoga, Karana, Rahu Kalam, Nalla Neram, and Muhurtham timings. Free Thirukanitham-based daily panchangam for any city worldwide.",
  keywords: [
    "Tamil panchangam",
    "panchangam today",
    "Rahu kalam today",
    "Nalla neram",
    "Tithi today",
    "Tamil calendar",
    "Thirukanitham panchangam",
    "birth star today",
    "nakshatra today",
    "muhurtham today",
  ],
  alternates: { canonical: "https://vinaadi.com/tools/daily-panchangam-planner" },
  openGraph: {
    title: "Tamil Panchangam Today — Tithi, Birth Star, Rahu Kalam & Nalla Neram",
    description:
      "Free daily Tamil panchangam with all five elements, Rahu Kalam, Nalla Neram, and auspicious timings. Thirukanitham-based, accurate for any city.",
    url: "https://vinaadi.com/tools/daily-panchangam-planner",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tamil Panchangam Today — Tithi, Birth Star, Rahu Kalam & Nalla Neram",
    description: "Free Thirukanitham-based daily panchangam. Tithi, Birth Star, Rahu Kalam, Nalla Neram for any city.",
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Tamil panchangam?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Panchangam (பஞ்சாங்கம்) is the traditional Tamil almanac that describes the astrological quality of each day. It lists five daily elements — Tithi (lunar day), Vara (weekday), Birth Star, Yoga (planetary combination), and Karana (half-day period) — along with auspicious and inauspicious timing windows like Nalla Neram and Rahu Kalam.",
      },
    },
    {
      "@type": "Question",
      name: "What are the five elements of panchangam?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The five elements of panchangam are: Tithi (lunar day — 30 in a lunar month), Vara (day of the week and its ruling planet), Birth Star (the Moon's position among the 27 stars), Yoga (a combined Sun-Moon calculation — 27 yogas), and Karana (each Tithi is divided into two Karanas). Together they define the spiritual and energetic character of the day.",
      },
    },
    {
      "@type": "Question",
      name: "What is Rahu Kalam and should I avoid it?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Rahu Kalam is a 90-minute period each day traditionally considered inauspicious in Tamil astrology. It falls at a different time each weekday. New ventures, travel, and important ceremonies are typically avoided during Rahu Kalam. The exact times vary by location and depend on local sunrise time.",
      },
    },
    {
      "@type": "Question",
      name: "How do I find today's Nalla Neram?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Nalla Neram (நல்ல நேரம்) means 'auspicious time'. It is determined by the day's Gowri Panchangam cycles. Enter your date and city into Vinaadi's free panchangam calculator to get exact Nalla Neram windows for your location. The times change daily based on the weekday and local sunrise.",
      },
    },
    {
      "@type": "Question",
      name: "Is this panchangam based on Thirukanitham or Vakya?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Vinaadi uses Thirukanitham (திருக்கணிதம்), the astronomically precise calculation method based on actual planetary positions computed using Swiss Ephemeris. Thirukanitham is more accurate than the traditional Vakya method for contemporary dates and is widely accepted by modern Tamil astrologers.",
      },
    },
  ],
};

export default function PanchangamPlannerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />
      <PanchangamPageContent />
    </>
  );
}
