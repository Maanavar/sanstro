import type { Metadata } from "next";
import { BabyNameFinderContent } from "./BabyNameFinderContent";

export const metadata: Metadata = {
  title: "Tamil Baby Name Finder — Nakshatra Pada Names (Draft)",
  description:
    "Enter a date, time and place of birth and get baby names matched to the birth-nakshatra pada, ranked by Fortune Alignment against that chart — no account needed. In active development — names and the underlying pada table are both unverified drafts, shown for preview only.",
  keywords: [
    "tamil baby names",
    "nakshatra pada names",
    "baby name by star",
    "janma nakshatram baby name",
    "பெயர் தேர்வு நட்சத்திரம்",
  ],
  alternates: { canonical: "https://vinaadi.com/tools/baby-name-finder" },
  openGraph: {
    title: "Tamil Baby Name Finder — Nakshatra Pada Names (Draft)",
    description:
      "Names matched to a birth nakshatra's opening syllable (pada aksharam) from a date, time and place of birth — the traditional starting point, ranked by Fortune Alignment as a secondary filter.",
    url: "https://vinaadi.com/tools/baby-name-finder",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tamil Baby Name Finder (Draft)",
    description:
      "Nakshatra-pada baby names from birth details, ranked by Fortune Alignment. Preview only — pending astrologer and native-speaker review.",
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is a nakshatra-pada name?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Each of the 27 nakshatras (birth stars) is divided into 4 padas, and classical practice assigns each pada a starting syllable (aksharam). A name whose opening matches the baby's own janma-nakshatra pada is considered auspicious under this tradition — the same system used to choose a naming-ceremony name (namakaranam), independent of Chaldean numerology.",
      },
    },
    {
      "@type": "Question",
      name: "Why does this tool say the results are a draft?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Two things behind this tool are still unverified: the 108-row nakshatra-pada syllable table, and the Tamil name list itself, which was drafted to build and test this feature rather than sourced from an astrologer. Both need review before a result here should be treated as a real recommendation, and the tool says so on every screen until that review is done.",
      },
    },
    {
      "@type": "Question",
      name: "Does numerology decide the name here?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. The nakshatra-pada syllable is the primary filter — only names whose opening matches it are shown at all. Fortune Alignment, scored against the exact chart built from the birth details you enter, only ranks the names that already passed that filter. A number never overrides the pada match.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need an account or a saved profile to use this?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Enter a date, time and place of birth and the chart is computed once, in memory, to find and rank names — nothing is saved. This is the same no-login chart computation the Jadhagam Generator tool uses.",
      },
    },
  ],
};

export default function BabyNameFinderPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />
      <BabyNameFinderContent />
    </>
  );
}
