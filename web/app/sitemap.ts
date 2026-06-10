import type { MetadataRoute } from "next";

const BASE = "https://vinaadi.com";

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

export default function sitemap(): MetadataRoute.Sitemap {
  return [
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
      url: `${BASE}/tools/indraiya-rasipalan`,
      changeFrequency: "daily",
      priority: 0.9,
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
    /* ── Natchathiram pages ── */
    {
      url: `${BASE}/natchathiram`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/natchathiram/ashwini`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/natchathiram/bharani`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/natchathiram/krittika`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/natchathiram/rohini`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/natchathiram/mrigashira`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/natchathiram/ardra`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/natchathiram/punarvasu`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/natchathiram/pushya`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/natchathiram/uttara-phalguni`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/natchathiram/hasta`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/natchathiram/chitra`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/natchathiram/swati`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    /* ── Daily panchangam pages (30 days) ── */
    ...panchangamDateEntries(),
  ];
}
