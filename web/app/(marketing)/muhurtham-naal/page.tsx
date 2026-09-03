import type { Metadata } from "next";
import { LATEST_MUHURTHAM_NAAL_YEAR } from "@/lib/muhurtham-naal";
import { MuhurthamNaalContent } from "./MuhurthamNaalContent";

const SITE = "https://vinaadi.com";

export function metadataForMuhurthamYear(year: number, path = "/muhurtham-naal"): Metadata {
  const title = `${year} Tamil Muhurtham Naal (Wedding Dates) - Verified Almanac List | Vinaadi`;
  const description =
    `All auspicious Tamil muhurtham (wedding) dates for ${year} from the published almanac, with weekday, Tamil date, pirai, nakshatra and nalla neram for each. Sign in to find the dates that best match your birth star.`;

  return {
    title,
    description,
    keywords: [
      `tamil muhurtham dates ${year}`,
      `marriage muhurtham ${year}`,
      `wedding dates tamil ${year}`,
      `muhurtham naal ${year}`,
      `subha muhurtham ${year}`,
      `திருமண முகூர்த்த நாட்கள் ${year}`,
      `முகூர்த்த நாள் ${year}`,
      "valarpirai theipirai muhurtham",
    ],
    alternates: { canonical: `${SITE}${path}` },
    openGraph: {
      title: `${year} Tamil Muhurtham Naal - Verified Wedding Dates`,
      description: `The full almanac list of ${year} Tamil wedding muhurtham dates with nakshatra and nalla neram. Match the best dates to your birth star.`,
      url: `${SITE}${path}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${year} Tamil Muhurtham Naal`,
      description: `Verified Tamil wedding muhurtham dates for ${year}, with Tamil date, pirai, nakshatra and nalla neram.`,
    },
  };
}

export function jsonLdForMuhurthamYear(year: number, path = "/muhurtham-naal") {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${year} Tamil Muhurtham Naal (Wedding Dates)`,
    url: `${SITE}${path}`,
    description: `The published ${year} Tamil muhurtham (wedding) date list with weekday, Tamil date, pirai and nakshatra.`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE },
        { "@type": "ListItem", position: 2, name: `Muhurtham Naal ${year}`, item: `${SITE}${path}` },
      ],
    },
  };
}

export const metadata = metadataForMuhurthamYear(LATEST_MUHURTHAM_NAAL_YEAR);

export default function MuhurthamNaalPage() {
  const jsonLd = jsonLdForMuhurthamYear(LATEST_MUHURTHAM_NAAL_YEAR);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MuhurthamNaalContent year={LATEST_MUHURTHAM_NAAL_YEAR} />
    </>
  );
}
