import type { Metadata } from "next";
import { SITE_URL } from "@vinaadi/shared/constants";
import { getServerLang } from "./server-lang";
import { tamilCopyFor } from "./marketing-seo-ta";
import { TA_PREFIX, isTaReady } from "./ta-routes";

/** The per-language text of a page's metadata. */
export type MetaCopy = { title: string; description: string; keywords?: string[] };

/** The two addresses of one page, and the `hreflang` set that ties them together. */
export function languageUrls(path: `/${string}`) {
  const en = path === "/" ? SITE_URL : `${SITE_URL}${path}`;
  const ta = `${SITE_URL}${TA_PREFIX}${path === "/" ? "" : path}`;
  return { en, ta, languages: { en, ta, "x-default": en } };
}

/**
 * Give a page's English metadata a Tamil twin (GRW-06).
 *
 * The page keeps building its English metadata exactly as before; this wraps
 * it. On `/ta/...` the title, description, keywords, canonical and share card
 * switch to `ta`; on the English URL only the canonical stays put. Both carry
 * the same reciprocal `hreflang` set, which Google requires — a Tamil page that
 * names an English twin that does not name it back is ignored.
 *
 * A path with no Tamil twin (`isTaReady`) is returned untouched, so a page is
 * never advertised in a language it does not render.
 */
export async function withTamilTwin(en: Metadata, path: `/${string}`, tamil?: MetaCopy): Promise<Metadata> {
  if (!isTaReady(path)) return en;
  // Copy passed by the page, else the central file (`marketing-seo-ta.ts`). A
  // ready page with neither is a bug the metadata suite fails on.
  const ta = tamil ?? tamilCopyFor(path);
  if (!ta) return en;
  const urls = languageUrls(path);
  const lang = await getServerLang();

  if (lang !== "ta") {
    return {
      ...en,
      alternates: { ...en.alternates, canonical: urls.en, languages: urls.languages },
      openGraph: en.openGraph ? { ...en.openGraph, locale: "en_IN", alternateLocale: ["ta_IN"] } : en.openGraph,
    };
  }

  // Keep the English page's decision about the brand suffix: a title that
  // opted out of the root template stays opted out.
  const title =
    typeof en.title === "object" && en.title !== null && "absolute" in en.title ? { absolute: ta.title } : ta.title;

  return {
    ...en,
    title,
    description: ta.description,
    keywords: ta.keywords ?? en.keywords,
    alternates: { ...en.alternates, canonical: urls.ta, languages: urls.languages },
    openGraph: {
      ...en.openGraph,
      title: ta.title,
      description: ta.description,
      url: urls.ta,
      locale: "ta_IN",
      alternateLocale: ["en_IN"],
    },
    twitter: en.twitter ? { ...en.twitter, title: ta.title, description: ta.description } : en.twitter,
  };
}
