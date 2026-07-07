import {
  LEARN_BIRTH,
  LEARN_CHANDRA,
  LEARN_JAD,
  LEARN_PORUTHAM,
  LEARN_THIRUK,
} from "@/lib/marketing-i18n";

/**
 * Data-only mapping of the 5 real, already-shipped `/learn/*` marketing
 * articles into a generic bilingual shape, reused by the in-app Learn
 * viewers (Nova's Explore tab + Classic's single-article modal) instead of
 * navigating out to the marketing site. Every string here is imported
 * directly from `web/lib/marketing-i18n.ts` — nothing is re-authored; only
 * each article's bespoke `xxx_h2`/`xxx_body` field pairs are collected into
 * a uniform `sections[]` array (the marketing objects don't share a common
 * schema, so this mapping has to be done by hand once per article).
 */

export type BiText = { en: string; ta: string };

export type LearnArticleContent = {
  slug: string;
  eyebrow: BiText;
  title: BiText;
  lead: BiText;
  sections: { heading: BiText; body: BiText }[];
};

export const LEARN_ARTICLES_CONTENT: LearnArticleContent[] = [
  {
    slug: "what-is-thirukanitham",
    eyebrow: LEARN_THIRUK.eyebrow,
    title: LEARN_THIRUK.h1,
    lead: LEARN_THIRUK.lead,
    sections: [
      { heading: LEARN_THIRUK.meaning_h2, body: LEARN_THIRUK.meaning_body },
      { heading: LEARN_THIRUK.drik_h2, body: LEARN_THIRUK.drik_body },
      { heading: LEARN_THIRUK.ayanamsa_h2, body: LEARN_THIRUK.ayanamsa_body },
      { heading: LEARN_THIRUK.matters_h2, body: LEARN_THIRUK.matters_body },
      { heading: LEARN_THIRUK.how_h2, body: LEARN_THIRUK.how_body },
    ],
  },
  {
    slug: "how-to-read-a-jadhagam",
    eyebrow: LEARN_JAD.eyebrow,
    title: LEARN_JAD.h1,
    lead: LEARN_JAD.lead,
    sections: [
      { heading: LEARN_JAD.structure_h2, body: LEARN_JAD.structure_body },
      { heading: LEARN_JAD.lagna_h2, body: LEARN_JAD.lagna_body },
      { heading: LEARN_JAD.dasha_h2, body: LEARN_JAD.dasha_body },
    ],
  },
  {
    slug: "what-is-chandrashtama",
    eyebrow: LEARN_CHANDRA.eyebrow,
    title: LEARN_CHANDRA.h1,
    lead: LEARN_CHANDRA.lead,
    sections: [
      { heading: LEARN_CHANDRA.what_h2, body: LEARN_CHANDRA.what_body },
      { heading: LEARN_CHANDRA.calm_h2, body: LEARN_CHANDRA.calm_body },
    ],
  },
  {
    slug: "what-is-porutham",
    eyebrow: LEARN_PORUTHAM.eyebrow,
    title: LEARN_PORUTHAM.h1,
    lead: LEARN_PORUTHAM.lead,
    sections: [
      { heading: LEARN_PORUTHAM.meaning_h2, body: LEARN_PORUTHAM.meaning_body },
      { heading: LEARN_PORUTHAM.how_h2, body: LEARN_PORUTHAM.how_body },
      { heading: LEARN_PORUTHAM.critical_h2, body: LEARN_PORUTHAM.critical_body },
      { heading: LEARN_PORUTHAM.sevvai_h2, body: LEARN_PORUTHAM.sevvai_body },
      { heading: LEARN_PORUTHAM.count_h2, body: LEARN_PORUTHAM.count_body },
    ],
  },
  {
    slug: "why-birth-time-matters",
    eyebrow: LEARN_BIRTH.eyebrow,
    title: LEARN_BIRTH.h1,
    lead: LEARN_BIRTH.lead,
    sections: [
      { heading: LEARN_BIRTH.lagna_h2, body: LEARN_BIRTH.lagna_body },
      { heading: LEARN_BIRTH.dasha_h2, body: LEARN_BIRTH.dasha_body },
      { heading: LEARN_BIRTH.uncertain_h2, body: LEARN_BIRTH.uncertain_body },
    ],
  },
];

export function getLearnArticle(slug: string): LearnArticleContent | undefined {
  return LEARN_ARTICLES_CONTENT.find((a) => a.slug === slug);
}
