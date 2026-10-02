import { SITE_URL } from "@vinaadi/shared/constants";
import { getServerLang } from "./server-lang";
import { tamilCopyFor } from "./marketing-seo-ta";
import { taUrl } from "./ta-routes";

// Structured data for the pages that have a Tamil twin (GRW-06).
//
// A `/ta/...` page is a Tamil page: its `<html lang>`, title, description and
// body are Tamil. Its JSON-LD has to be too, or a search engine reads a Tamil
// page whose FAQ answers, headline and breadcrumbs are English. The reverse
// leak existed as well: the 27 nakshatra pages built their Article and FAQ from
// the Tamil-first data files, so the English URL carried Tamil structured data.
//
// The rule, applied by `<JsonLd>` for every page:
//   - the English block renders on the English URL only;
//   - a Tamil block renders on `/ta/...` only, and only where a page hands one
//     over. Where there is no Tamil source (a hand-written English FAQ, a HowTo,
//     a Place), the Tamil twin carries no block at all. An absent block is
//     honest; a translated one nobody has read is not.
//
// `lib/json-ld-boundary.test.ts` fails a page that prints a `ld+json` script
// directly, because that is the way an English block gets onto a Tamil page.

export type Ld = Record<string, unknown>;
type Bilingual = { en: string; ta: string };

/** JSON for a `<script>` body. `<` is escaped so text can never close the tag. */
export function safeJsonLd(data: Ld): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** FAQPage from bilingual `{ q: {en, ta}, a: {en, ta} }` items, in one language. */
export function faqPageLd(items: readonly { q: Bilingual; a: Bilingual }[], lang: "en" | "ta"): Ld {
  return faqPageFromPairs(items.map((item) => ({ q: item.q[lang], a: item.a[lang] })));
}

/** FAQPage from single-language `{ q, a }` items. */
export function faqPageFromPairs(items: readonly { q: string; a: string }[]): Ld {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/** The path of an Article's own URL (`mainEntityOfPage` or `url`), origin removed. */
function articlePath(article: Ld): `/${string}` | null {
  const raw = [article.mainEntityOfPage, article.url].find((v): v is string => typeof v === "string");
  if (!raw) return null;
  const path = raw.startsWith(SITE_URL) ? raw.slice(SITE_URL.length) || "/" : raw;
  return path.startsWith("/") ? (path as `/${string}`) : null;
}

/**
 * The Tamil twin of an English Article block: headline (and description or
 * `about`, where the English one has them) from the page's Tamil metadata, so
 * the structured data says what the `<title>` says. `null` when the page has no
 * Tamil copy, which leaves the Tamil twin without an Article rather than with
 * an English one.
 */
export function articleTa(en: Ld): Ld | null {
  const path = articlePath(en);
  const ta = path ? tamilCopyFor(path) : null;
  if (!ta) return null;
  return {
    ...en,
    ...(typeof en.mainEntityOfPage === "string" ? { mainEntityOfPage: taUrl(en.mainEntityOfPage) } : {}),
    ...(typeof en.url === "string" ? { url: taUrl(en.url) } : {}),
    headline: ta.title,
    ...(typeof en.description === "string" ? { description: ta.description } : {}),
    ...(typeof en.about === "string" ? { about: ta.title } : {}),
    inLanguage: "ta",
  };
}

/**
 * One JSON-LD `<script>`, in the language of the URL it is served from. `en`
 * renders on the English page and `ta` on the Tamil twin; a missing side renders
 * nothing. Never print an `ld+json` script by hand in a page.
 */
export async function JsonLd({ en, ta }: { en?: Ld | null; ta?: Ld | null }) {
  const lang = await getServerLang();
  const data = lang === "ta" ? ta : en;
  if (!data) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }} />;
}
