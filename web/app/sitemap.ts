import type { MetadataRoute } from "next";
import { DOSHAM_DETAILS, DRAFT_GUIDE_SLUGS, YOGAM_DETAILS, TEMPLE_DETAILS, PARIHARAM_DETAILS } from "@/lib/guide-detail-content";
import { NAKSHATRA_LIST } from "@vinaadi/shared/constants";
import { languageUrls } from "@/lib/localized-metadata";
import { SITE_URL } from "@/lib/page-metadata";
import { isTaReady } from "@/lib/ta-routes";
import { CALENDAR_CATEGORY_SLUGS } from "./(marketing)/tamil-calendar/calendar-category-api";

// Every indexable public page belongs here; lib/seo-metadata.test.ts fails
// when one is missing.
const BASE = SITE_URL;

function guideEntries(prefix: string, slugs: string[]): MetadataRoute.Sitemap {
  return slugs.map((slug) => ({
    url: `${BASE}/${prefix}/${slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
}

function isoDate(offset = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

function panchangamDateEntries(): MetadataRoute.Sitemap {
  return Array.from({ length: 30 }, (_, i) => ({
    url: `${BASE}/panchangam/${isoDate(i)}`,
    changeFrequency: "daily" as const,
    priority: 0.8,
    lastModified: new Date(),
  }));
}

const TAMIL_CALENDAR_EVENTS = [
  "pournami", "amavasai", "pradosham", "ekadhasi", "sankatahara-chathurthi",
  "chathurthi", "sashti", "ashtami", "navami", "karthigai", "thiruvonam",
  "maadha-sivarathiri", "chandra-darisanam", "karinaal",
];

function tamilCalendarEntries(): MetadataRoute.Sitemap {
  return [
    ...CALENDAR_CATEGORY_SLUGS.map((slug) => ({
      url: `${BASE}/tamil-calendar/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.88,
    })),
    ...TAMIL_CALENDAR_EVENTS.map((key) => ({
    url: `${BASE}/tamil-calendar/${key}-2026`,
    changeFrequency: "weekly" as const,
    priority: 0.85,
    })),
  ];
}

/**
 * Every page that has a Tamil twin is listed twice — once per language — and
 * each entry names both, which is the reciprocal `hreflang` set Google needs
 * (GRW-06). Pages without a twin pass through unchanged.
 */
function withTamilTwins(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  return entries.flatMap((entry) => {
    const path = (entry.url.replace(BASE, "") || "/") as `/${string}`;
    if (!isTaReady(path)) return [entry];
    const { ta, languages } = languageUrls(path);
    return [
      { ...entry, alternates: { languages } },
      { ...entry, url: ta, alternates: { languages } },
    ];
  });
}

export default function sitemap(): MetadataRoute.Sitemap {
  return withTamilTwins([
    {
      url: BASE,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    /* ── Feature pages ── */
    {
      url: `${BASE}/features/daily-guidance`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/features/family-planning`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/features/chart-guidance`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/features/timing-and-decisions`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    /* ── Tool pages ── */
    {
      url: `${BASE}/tools/marriage-porutham-calculator`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/tools/jadhagam-generator`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/tools/daily-panchangam-planner`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/tools/birth-time-rectification`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/tools/muhurta-calculator`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/muhurtham-naal`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/muhurtham-naal/2027`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/muhurtham-naal/2026`,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${BASE}/tamil-calendar`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...tamilCalendarEntries(),
    {
      url: `${BASE}/tools/indraiya-rasipalan`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE}/tools/friendship-compatibility`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/tools/numerology-calculator`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      // Draft: numerology_baby_naming defaults true (access-gating only, see
      // app/services/feature_flags.py) but the pada canon and name corpus
      // are both still unreviewed. Lower priority than the launched tools
      // above for that reason.
      url: `${BASE}/tools/baby-name-finder`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    /* ── Share pages ── */
    {
      url: `${BASE}/share/panchangam`,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BASE}/tools/chandrashtama`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/family`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    /* ── Plans ── */
    {
      url: `${BASE}/pricing`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE}/beta`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    /* ── Trust pages ── */
    {
      url: `${BASE}/trust/methodology`,
      changeFrequency: "yearly",
      priority: 0.7,
    },
    {
      url: `${BASE}/trust/about-vinaadi`,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${BASE}/privacy`,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${BASE}/terms`,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    /* ── Learn pages ── */
    {
      // The orientation article, and the only one addressed to a reader who has
      // no Vedic vocabulary at all — which makes search its primary route in.
      // Ranked above the rest of Learn for that reason.
      url: `${BASE}/learn/vedic-vs-western`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/learn/what-is-porutham`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE}/learn/what-is-thirukanitham`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE}/learn/what-is-chandrashtama`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE}/learn/how-to-read-a-jadhagam`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE}/learn/why-birth-time-matters`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    /* ── Dosham pages ── */
    {
      url: `${BASE}/dosham`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    // Draft, not-yet-reviewed dosham slugs are excluded — see DRAFT_GUIDE_SLUGS.
    ...guideEntries("dosham", Object.keys(DOSHAM_DETAILS).filter((slug) => !DRAFT_GUIDE_SLUGS.has(slug))),
    /* ── Yogam pages ── */
    {
      url: `${BASE}/yogam`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...guideEntries("yogam", Object.keys(YOGAM_DETAILS)),
    /* ── Pariharam pages ── */
    {
      url: `${BASE}/pariharam`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/pariharam/thirumana-thadai`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...guideEntries("pariharam", Object.keys(PARIHARAM_DETAILS)),
    /* ── Temple pages ── */
    {
      url: `${BASE}/temples`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/temples/thirunallar`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...guideEntries("temples", Object.keys(TEMPLE_DETAILS)),
    /* ── Natchathiram pages ── */
    {
      url: `${BASE}/natchathiram`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    // All 27, generated — the hand-written list had drifted to 4 of 27 visual
    // profiles. The shared slugs are the route folder names.
    ...NAKSHATRA_LIST.flatMap(({ slug }) => [
      { url: `${BASE}/natchathiram/${slug}`, changeFrequency: "monthly" as const, priority: 0.8 },
      { url: `${BASE}/natchathiram/${slug}/visual`, changeFrequency: "monthly" as const, priority: 0.7 },
    ]),
    /* ── Daily panchangam pages (30 days) ── */
    ...panchangamDateEntries(),
  ]);
}
