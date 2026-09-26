import type { Metadata } from "next";
import { SITE_URL } from "@vinaadi/shared/constants";

/** The public origin every canonical, sitemap and share URL is built from. */
export { SITE_URL };

const OG_IMAGE = { url: "/brand/vinaadi-og-image.png", width: 1200, height: 630, alt: "Vinaadi — Tamil astrology assistant" };

/**
 * Metadata for one public page: its own title, description, canonical and
 * share card.
 *
 * Every field here has to be set per page. Next merges metadata down the
 * layout tree key by key, so a page that leaves `alternates` out inherits its
 * parent's canonical — which is how ten pages once declared themselves
 * duplicates of the homepage — and a page that sets `openGraph` without
 * `images` loses the share image. `lib/seo-metadata.test.ts` holds the line.
 *
 * `title` is the bare page title: the root layout's template appends
 * " | Vinaadi", so do not add the brand here. A title that already names the
 * brand (the About page) passes `absolute: true` to skip the template.
 */
export function pageMetadata({
  path,
  title,
  description,
  keywords,
  absolute = false,
}: {
  path: `/${string}`;
  title: string;
  description: string;
  keywords?: string[];
  absolute?: boolean;
}): Metadata {
  const url = `${SITE_URL}${path}`;
  return {
    title: absolute ? { absolute: title } : title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", siteName: "Vinaadi", images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
  };
}
