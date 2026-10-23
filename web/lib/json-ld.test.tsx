import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./server-lang", () => ({ getServerLang: vi.fn() }));

import { getServerLang } from "./server-lang";
import { JsonLd, articleTa, faqPageFromPairs, faqPageLd, safeJsonLd } from "./json-ld";
import { guideJsonLd, DOSHAM_DETAILS, getGuideDetail } from "./guide-detail-content";
import { NATCHATHIRAM_LIST, ASHWINI } from "./natchathiram-data";
import { natchathiramJsonLd } from "./natchathiram-metadata";
import { taUrl } from "./ta-routes";

const TAMIL = /[஀-௿]/u;
const mockLang = (lang: "en" | "ta") => vi.mocked(getServerLang).mockResolvedValue(lang);

/** Every string value in a JSON-LD tree, minus URLs and machine tokens. */
function textValues(node: unknown, out: string[] = []): string[] {
  if (typeof node === "string") out.push(node);
  else if (Array.isArray(node)) node.forEach((n) => textValues(n, out));
  else if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      if (["@context", "@type", "url", "item", "mainEntityOfPage", "logo", "inLanguage", "datePublished"].includes(key)) continue;
      textValues(value, out);
    }
  }
  return out;
}

describe("<JsonLd>", () => {
  beforeEach(() => vi.mocked(getServerLang).mockReset());

  it("prints the English block on the English page and nothing else", async () => {
    mockLang("en");
    const el = await JsonLd({ en: { "@type": "A" }, ta: { "@type": "B" } });
    expect(el?.props.dangerouslySetInnerHTML.__html).toContain('"A"');
    expect(el?.props.dangerouslySetInnerHTML.__html).not.toContain('"B"');
  });

  it("prints the Tamil block on the Tamil twin", async () => {
    mockLang("ta");
    const el = await JsonLd({ en: { "@type": "A" }, ta: { "@type": "B" } });
    expect(el?.props.dangerouslySetInnerHTML.__html).toContain('"B"');
  });

  it("prints nothing on the Tamil twin when the page has no Tamil block (never the English one)", async () => {
    mockLang("ta");
    expect(await JsonLd({ en: { "@type": "A" } })).toBeNull();
    expect(await JsonLd({ en: { "@type": "A" }, ta: null })).toBeNull();
  });

  it("prints nothing on the English page when only a Tamil block exists", async () => {
    mockLang("en");
    expect(await JsonLd({ ta: { "@type": "B" } })).toBeNull();
  });
});

describe("safeJsonLd", () => {
  it("cannot be closed early by text that contains a closing script tag", () => {
    const json = safeJsonLd({ text: "</script><script>alert(1)</script>" });
    expect(json).not.toContain("</script>");
    expect(JSON.parse(json).text).toBe("</script><script>alert(1)</script>");
  });
});

describe("FAQ builders", () => {
  it("builds a FAQPage in the asked language from bilingual items", () => {
    const items = [{ q: { en: "Why?", ta: "ஏன்?" }, a: { en: "Because.", ta: "ஏனெனில்." } }];
    expect(JSON.stringify(faqPageLd(items, "ta"))).toContain("ஏன்?");
    expect(JSON.stringify(faqPageLd(items, "ta"))).not.toContain("Why?");
    expect(JSON.stringify(faqPageLd(items, "en"))).not.toMatch(TAMIL);
  });

  it("builds from single-language pairs", () => {
    const ld = faqPageFromPairs([{ q: "q", a: "a" }]) as { mainEntity: unknown[] };
    expect(ld.mainEntity).toHaveLength(1);
  });
});

describe("articleTa", () => {
  const en = {
    "@type": "Article",
    headline: "Sevvai Dosham (Mangal Dosha) — Meaning, Calculation & Pariharam",
    about: "Sevvai dosham / Mangal dosha in Tamil Vedic astrology",
    inLanguage: ["en", "ta"],
    mainEntityOfPage: "https://vinaadi.com/dosham/sevvai-dosham",
  };

  it("takes the headline from the page's Tamil title and moves the URL to /ta", () => {
    const ta = articleTa(en)!;
    expect(ta.headline).toMatch(TAMIL);
    expect(ta.headline).not.toBe(en.headline);
    expect(ta.about).toMatch(TAMIL);
    expect(ta.inLanguage).toBe("ta");
    expect(ta.mainEntityOfPage).toBe("https://vinaadi.com/ta/dosham/sevvai-dosham");
  });

  it("returns null for a page with no Tamil copy, so the twin carries no Article", () => {
    expect(articleTa({ ...en, mainEntityOfPage: "https://vinaadi.com/share/panchangam" })).toBeNull();
    expect(articleTa({ "@type": "Article" })).toBeNull();
  });
});

describe("taUrl", () => {
  it("prefixes the path, keeps the root clean, and leaves foreign URLs alone", () => {
    expect(taUrl("https://vinaadi.com/dosham")).toBe("https://vinaadi.com/ta/dosham");
    expect(taUrl("https://vinaadi.com/")).toBe("https://vinaadi.com/ta");
    expect(taUrl("https://vinaadi.com")).toBe("https://vinaadi.com/ta");
    expect(taUrl("https://example.org/x")).toBe("https://example.org/x");
  });
});

describe("guideJsonLd, one language per call", () => {
  const slug = Object.keys(DOSHAM_DETAILS)[0]!;
  const content = getGuideDetail("dosham", slug)!;
  const url = `https://vinaadi.com/dosham/${slug}`;

  it("writes the English block in English only, at the English address", () => {
    const en = guideJsonLd(content, url, "en");
    expect(textValues(en).join(" ")).not.toMatch(TAMIL);
    expect(JSON.stringify(en)).not.toContain("/ta/");
  });

  it("writes the Tamil block in Tamil, at /ta addresses, with a Tamil breadcrumb", () => {
    const ta = guideJsonLd(content, url, "ta") as { "@graph": Record<string, unknown>[] };
    const article = ta["@graph"][0]!;
    expect(article.headline).toBe(content.title.ta);
    expect(article.inLanguage).toBe("ta");
    expect(article.url).toBe(`https://vinaadi.com/ta/dosham/${slug}`);
    const crumbs = (ta["@graph"][1] as { itemListElement: { name: string; item: string }[] }).itemListElement;
    expect(crumbs.map((c) => c.name).every((n) => TAMIL.test(n))).toBe(true);
    expect(crumbs.every((c) => c.item.startsWith("https://vinaadi.com/ta"))).toBe(true);
  });
});

describe("nakshatra structured data", () => {
  const ld = natchathiramJsonLd(ASHWINI);

  it("keeps Tamil off the English page: English Article, no FAQ", () => {
    expect(textValues(ld.article.en).join(" ")).not.toMatch(TAMIL);
    expect(ld.article.en.inLanguage).toBe("en");
  });

  it("gives the Tamil twin a Tamil Article and the Tamil FAQ", () => {
    expect(ld.article.ta.headline).toMatch(TAMIL);
    expect(ld.article.ta.inLanguage).toBe("ta");
    expect(textValues(ld.faqTa).every((t) => TAMIL.test(t))).toBe(true);
  });

  it("covers every listed nakshatra without an empty headline", () => {
    for (const n of NATCHATHIRAM_LIST) expect(n.slug.length).toBeGreaterThan(0);
  });
});
