import type { Metadata } from "next";
import { RasippalanPageContent } from "./RasippalanPageContent";

export const metadata: Metadata = {
  title: "Indraiya Rasipalan — Today's Horoscope for All 12 Tamil Rasis",
  description:
    "Get today's Tamil rasipalan (daily horoscope) for all 12 rasis based on the Moon's position. Thirukanitham-accurate Moon transit predictions. Select your janma rasi to see your reading. Free, no account required.",
  keywords: [
    "indraiya rasipalan",
    "இன்றைய ராசிபலன்",
    "today rasipalan",
    "Tamil daily horoscope",
    "Tamil rasi palan",
    "Moon transit rasi",
    "chandrashtamam today",
    "janma rasi palan",
    "Mesham rasipalan",
    "Rishabam rasipalan",
  ],
  alternates: { canonical: "https://vinaadi.com/tools/indraiya-rasipalan" },
  openGraph: {
    title: "Indraiya Rasipalan — Today's Tamil Horoscope for All 12 Rasis",
    description:
      "Free Thirukanitham-based daily rasi palan. Moon transit predictions for Mesham to Meenam. Select your janma rasi for your reading.",
    url: "https://vinaadi.com/tools/indraiya-rasipalan",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Indraiya Rasipalan — Today's Tamil Horoscope for All 12 Rasis",
    description: "Free daily rasi palan based on Moon transit. Thirukanitham-accurate. Select your janma rasi.",
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is indraiya rasipalan (இன்றைய ராசிபலன்)?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Indraiya rasipalan means 'today's rasi prediction' in Tamil. It is a daily horoscope based on the Moon's position in the zodiac. The Moon moves through a new rasi roughly every 2.5 days, and its house position from your natal Moon sign (janma rasi) determines the energy and guidance for the day.",
      },
    },
    {
      "@type": "Question",
      name: "How is Tamil rasipalan different from sun-sign horoscopes?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Tamil Jyothidam rasipalan is based on your janma rasi — the rasi where the Moon was at birth — not the Sun. The daily palan is calculated from the Moon's transit position each day, making it much more dynamic (changes every 2.5 days) compared to sun-sign horoscopes which change monthly.",
      },
    },
    {
      "@type": "Question",
      name: "What is Chandrashtamam and which rasi has it today?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Chandrashtamam occurs when the transiting Moon is in the 8th rasi from your janma rasi. It lasts approximately 2.5 days. During Chandrashtamam, Tamil astrology recommends avoiding new ventures, surgeries, important decisions, and risky investments. Use Vinaadi's free rasipalan tool to find out which rasi is affected today.",
      },
    },
    {
      "@type": "Question",
      name: "Which Moon transit house is most auspicious?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "In classical Tamil Jyothidam, the Moon in the 11th house from janma rasi is the most auspicious — associated with gains, fulfilled desires, and success. The 9th house (fortune, dharma) and 3rd house (courage, effort) are also positive. The 8th house (Chandrashtamam) is the most challenging.",
      },
    },
    {
      "@type": "Question",
      name: "Is this rasipalan based on Thirukanitham or Vakya?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Vinaadi uses Thirukanitham (திருக்கணிதம்), calculated via Swiss Ephemeris for the Moon's precise longitude. This is more accurate than traditional Vakya almanac tables, especially for current and future dates.",
      },
    },
  ],
};

export default function IndraiyaRasippalanPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />
      <RasippalanPageContent />
    </>
  );
}
