import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/features/",
          "/tools/",
          "/learn/",
          "/trust/",
          "/dosham/",
          "/yogam/",
          "/pariharam/",
          "/temples/",
        ],
        disallow: [
          "/dashboard",
          "/dashboard/",
          "/api/",
        ],
      },
    ],
    sitemap: "https://vinaadi.com/sitemap.xml",
  };
}
