import type { Metadata } from "next";
import { NumerologyCalculatorContent } from "./NumerologyCalculatorContent";

export const metadata: Metadata = {
  title: "Free Chaldean Numerology Calculator — Tamil Name & Birth Numbers",
  description:
    "Calculate your Chaldean numerology numbers from a date of birth and name — psychic, destiny and name numbers, plus mobile, vehicle and house numbers and your personal year. No birth time needed, no account required.",
  keywords: [
    "chaldean numerology calculator",
    "numerology Tamil",
    "name number calculator",
    "psychic number",
    "destiny number",
    "mobile number numerology",
    "vehicle number numerology",
    "personal year number",
    "எண் கணிதம்",
  ],
  alternates: { canonical: "https://vinaadi.com/tools/numerology-calculator" },
  openGraph: {
    title: "Free Chaldean Numerology Calculator — Tamil Name & Birth Numbers",
    description:
      "Your psychic, destiny and name numbers in the Chaldean system as practised in Tamil Nadu. Also scores mobile, vehicle and house numbers.",
    url: "https://vinaadi.com/tools/numerology-calculator",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Chaldean Numerology Calculator",
    description:
      "Psychic, destiny and name numbers from a date of birth. Free, Chaldean, no birth time needed.",
  },
};

/**
 * FAQ answers here describe the *method* — which alphabet is scored, why the
 * compound outranks the root, where the series stops. They are deliberately not
 * per-number meanings: that corpus is withheld until it clears Tamil native
 * review, and writing it here would route around the gate the backend enforces.
 */
const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Chaldean numerology?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Chaldean numerology assigns values 1–8 to the letters of the Latin alphabet and maps the resulting numbers to the grahas. It reached Tamil practice through Cheiro in the early twentieth century and is used alongside jyotisha rather than in place of it — most commonly for name correction and for choosing mobile, vehicle and house numbers.",
      },
    },
    {
      "@type": "Question",
      name: "Which spelling of my name is used?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The English or document spelling — the one on your Aadhaar, passport or certificates. Chaldean letter values are defined over the Latin alphabet, so there is no Chaldean value for a Tamil letter, and a Tamil-script name is refused rather than silently mis-scored. The exact string that was scored is always shown with the result.",
      },
    },
    {
      "@type": "Question",
      name: "What is the difference between the compound number and the root number?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The root is the final single digit, 1 to 9. The compound is the two-digit total before that final reduction, and in Chaldean practice it outranks the root: 43 and 34 both reduce to 7 and are read differently. Compounds are encoded from 10 to 52 — the series stops at 52 because adding the mystical 7 to the compound 45 gives 52, the weeks of the year.",
      },
    },
    {
      "@type": "Question",
      name: "Why does my full name have no compound number?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Because it totalled more than 52 and ran past the end of the encoded series. Most full three-part Indian names do. When that happens the calculator shows the name's real total and says plainly that the two-digit number beside it is a reduced surrogate — the meaning of a different number than the name actually makes — rather than presenting a substitute as if it were the name's own compound.",
      },
    },
    {
      "@type": "Question",
      name: "Can numerology override my horoscope?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. A number never overrides a graha. The nakshatra-pada system is codified in classical jyotisha and is centuries older than Chaldean numerology's arrival in Tamil practice; where the two disagree, the older and better-attested system leads. Vinaadi's signed-in tools score numbers against your actual birth chart for this reason — the same number is favourable for one person and not for another depending on what its graha does in that chart.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need my birth time for this calculator?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. These free calculators need only a date of birth and a name, which is why they can be used without an account. That is also their limit: without a birth time there is no lagna, and without a lagna nothing can say whether a number's graha is benefic for you specifically.",
      },
    },
  ],
};

export default function NumerologyCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />
      <NumerologyCalculatorContent />
    </>
  );
}
