import type { Metadata } from "next";
import { WhyBirthTimeMattersPageContent } from "./PageContent";

export const metadata: Metadata = {
  title: "Why Birth Time Matters in Tamil Astrology — Lagna and Dasha | Vinaadi",
  description:
    "In Thirukanitham astrology, birth time determines your lagna (which changes every ~2 hours) and the Moon's exact birth-star pada. Both shape your full chart and dasha sequence. Learn why accuracy matters and what to do when birth time is uncertain.",
  keywords: [
    "why birth time matters astrology",
    "birth time Tamil astrology",
    "lagna birth time",
    "dasha birth time accuracy",
    "birth time rectification",
    "birth star pada",
    "uncertain birth time horoscope",
    "accurate Tamil horoscope",
  ],
  alternates: { canonical: "https://vinaadi.com/learn/why-birth-time-matters" },
  openGraph: {
    title: "Why Birth Time Matters in Tamil Astrology — Lagna and Dasha",
    description:
      "Lagna changes every 2 hours and dasha start depends on the Moon's exact birth-star pada. Both require an accurate birth time. Learn why and what to do when time is uncertain.",
    url: "https://vinaadi.com/learn/why-birth-time-matters",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Why Birth Time Matters in Tamil Astrology",
    description: "Lagna changes every 2 hours, dasha depends on Moon pada — accurate birth time is essential for a correct jadhagam.",
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Why does birth time matter so much in Tamil astrology?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Birth time determines two critical factors in a Thirukanitham jadhagam: the lagna (rising sign), which changes about every 2 hours and sets the house positions for all 9 planets, and the exact pada of the Moon's birth star, which determines where the Vimshottari dasha sequence begins. Even a 30-minute difference can change the lagna or shift the Moon to a different pada.",
      },
    },
    {
      "@type": "Question",
      name: "How often does lagna change?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Lagna (the rising sign) changes approximately every 2 hours as the Earth rotates. Two people born on the same day in the same city but 2 hours apart can have entirely different lagnas — meaning their charts have different house lords, different planetary house placements, and different overall interpretations.",
      },
    },
    {
      "@type": "Question",
      name: "What if I don't know my exact birth time?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Vinaadi can still generate a chart with an approximate birth time, clearly flagging which elements — lagna, certain planet positions — are uncertain. For a more accurate chart, birth time rectification uses known life events (marriage, career changes, major moves) to narrow down the probable birth time.",
      },
    },
    {
      "@type": "Question",
      name: "What is birth time rectification?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Birth time rectification is the process of using life events as reference points — working backwards through the dasha and transit system — to narrow down an uncertain birth time. If major events in your life align with specific dasha periods, the birth time that produces that dasha sequence is likely close to the actual birth time.",
      },
    },
  ],
};

export default function WhyBirthTimeMattersPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />
      <WhyBirthTimeMattersPageContent />
    </>
  );
}
