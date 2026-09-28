import type { Metadata } from "next";
import { withTamilTwin } from "@/lib/localized-metadata";
import { JsonLd } from "@/lib/json-ld";
import { muhurthamNaalTa } from "@/lib/marketing-seo-ta";
import { taUrl } from "@/lib/ta-routes";
import { LATEST_MUHURTHAM_NAAL_YEAR } from "@/lib/muhurtham-naal";
import { MuhurthamNaalContent } from "./MuhurthamNaalContent";

const SITE = "https://vinaadi.com";

export function metadataForMuhurthamYear(year: number, path = "/muhurtham-naal"): Metadata {
  const title = `${year} Tamil Muhurtham Naal (Wedding Dates) - Verified Almanac List`;
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

/**
 * The CollectionPage block for a muhurtham year, in one language (GRW-06). The
 * Tamil name and description are the page's own Tamil metadata, so the
 * structured data says what the `<title>` says.
 */
export function jsonLdForMuhurthamYear(year: number, path = "/muhurtham-naal", lang: "en" | "ta" = "en") {
  const ta = lang === "ta";
  const url = ta ? taUrl(`${SITE}${path}`) : `${SITE}${path}`;
  const copy = muhurthamNaalTa(year);
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: ta ? copy.title : `${year} Tamil Muhurtham Naal (Wedding Dates)`,
    url,
    description: ta
      ? copy.description
      : `The published ${year} Tamil muhurtham (wedding) date list with weekday, Tamil date, pirai and nakshatra.`,
    inLanguage: lang,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: ta ? "முகப்பு" : "Home", item: ta ? taUrl(SITE) : SITE },
        { "@type": "ListItem", position: 2, name: ta ? `முகூர்த்த நாள் ${year}` : `Muhurtham Naal ${year}`, item: url },
      ],
    },
  };
}

export async function generateMetadata(): Promise<Metadata> {
  return withTamilTwin(
    metadataForMuhurthamYear(LATEST_MUHURTHAM_NAAL_YEAR),
    "/muhurtham-naal",
    muhurthamNaalTa(LATEST_MUHURTHAM_NAAL_YEAR),
  );
}

export default function MuhurthamNaalPage() {
  const year = LATEST_MUHURTHAM_NAAL_YEAR;
  return (
    <>
      <JsonLd en={jsonLdForMuhurthamYear(year)} ta={jsonLdForMuhurthamYear(year, "/muhurtham-naal", "ta")} />
      <MuhurthamNaalContent year={LATEST_MUHURTHAM_NAAL_YEAR} />
    </>
  );
}
