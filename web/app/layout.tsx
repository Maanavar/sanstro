import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LangProvider } from "@/components/lang-toggle";

import "./globals.css";

const BASE = "https://vinaadi.com";

const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Vinaadi",
  url: BASE,
  logo: `${BASE}/brand/vinaadi-wordmark-color.png`,
  description:
    "Vinaadi brings Thirukanitham-based Tamil astrology into a modern planning assistant — daily guidance, porutham, jadhagam, family planning, and calm interpretation.",
  sameAs: [],
};

const WEBSITE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Vinaadi",
  url: BASE,
  description:
    "Tamil astrology assistant for daily guidance, timing, porutham, and family planning. Powered by Thirukanitham.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE}/tools/marriage-porutham-calculator`,
    },
    "query-input": "required name=search_term_string",
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: "Vinaadi - Tamil Astrology Assistant for Daily Guidance & Planning",
    template: "%s | Vinaadi",
  },
  description:
    "Vinaadi brings Thirukanitham-based Tamil astrology into a modern planning assistant - daily guidance, porutham, jadhagam, family planning, and calm interpretation every morning.",
  keywords: [
    "Tamil astrology",
    "Thirukanitham",
    "daily jyotish",
    "porutham calculator",
    "jadhagam generator",
    "panchangam planner",
    "birth time rectification",
    "Tamil astrology app",
    "dasha calculator",
    "family astrology planning",
  ],
  authors: [{ name: "Vinaadi" }],
  creator: "Vinaadi",
  publisher: "Vinaadi",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: BASE,
    siteName: "Vinaadi",
    title: "Vinaadi - Tamil Astrology Assistant for Daily Guidance & Planning",
    description:
      "Precise Thirukanitham-based Tamil astrology for daily guidance, porutham matching, jadhagam generation, and family planning.",
    images: [
      {
        url: "/brand/vinaadi-og-image.png",
        width: 1200,
        height: 630,
        alt: "Vinaadi - Tamil Astrology Assistant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vinaadi - Tamil Astrology Assistant for Daily Guidance & Planning",
    description:
      "Thirukanitham-based Tamil astrology for daily guidance, porutham, jadhagam, and family planning.",
    images: ["/brand/vinaadi-og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: BASE,
    languages: {
      en: BASE,
      ta: BASE,
      "x-default": BASE,
    },
  },
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Noto+Sans+Tamil:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSONLD) }}
        />
      </head>
      <body><LangProvider>{children}</LangProvider></body>
    </html>
  );
}
