import type { Metadata } from "next";
import { MuhurthamNaalContent } from "./MuhurthamNaalContent";

export const metadata: Metadata = {
  title: "2026 Tamil Muhurtham Naal (Wedding Dates) — Verified Almanac List | Vinaadi",
  description:
    "All 55 auspicious Tamil muhurtham (wedding) dates for 2026 from the published almanac — with weekday, Tamil date, pirai, nakshatra and nalla neram for each. Sign in to find the dates that best match your birth star.",
  keywords: [
    "tamil muhurtham dates 2026",
    "marriage muhurtham 2026",
    "wedding dates tamil 2026",
    "muhurtham naal 2026",
    "subha muhurtham 2026",
    "திருமண முகூர்த்த நாட்கள் 2026",
    "முகூர்த்த நாள் 2026",
    "valarpirai theipirai muhurtham",
  ],
  alternates: { canonical: "https://vinaadi.com/muhurtham-naal" },
  openGraph: {
    title: "2026 Tamil Muhurtham Naal — Verified Wedding Dates",
    description:
      "The full almanac list of 2026 Tamil wedding muhurtham dates with nakshatra and nalla neram. Match the best dates to your birth star.",
    url: "https://vinaadi.com/muhurtham-naal",
    type: "website",
  },
};

const JSONLD = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "2026 Tamil Muhurtham Naal (Wedding Dates)",
  url: "https://vinaadi.com/muhurtham-naal",
  description:
    "The published 2026 Tamil muhurtham (wedding) date list — 55 auspicious dates with weekday, Tamil date, pirai and nakshatra.",
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://vinaadi.com" },
      { "@type": "ListItem", position: 2, name: "Muhurtham Naal 2026", item: "https://vinaadi.com/muhurtham-naal" },
    ],
  },
};

export default function MuhurthamNaalPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD) }} />
      <MuhurthamNaalContent />
    </>
  );
}
