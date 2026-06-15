import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Fraunces, Inter, JetBrains_Mono, Noto_Sans_Tamil } from "next/font/google";
import type { ReactNode } from "react";
import { BetaSystem } from "@/components/beta-system";
import { PostHogProvider } from "@/components/posthog-provider";
import { LangProvider } from "@/components/lang-toggle";
import { LANG_COOKIE_NAME, type Lang } from "@/lib/i18n";

import "./globals.css";

const BASE = "https://vinaadi.com";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-body",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
});

const notoSansTamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-tamil",
});

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get(LANG_COOKIE_NAME)?.value;
  const initialLang: Lang = langCookie === "ta" ? "ta" : "en";

  return (
    <html
      lang={initialLang}
      suppressHydrationWarning
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} ${notoSansTamil.variable}`}
    >
      <head>
        <meta charSet="utf-8" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSONLD) }}
        />
      </head>
      <body><LangProvider initialLang={initialLang}><PostHogProvider /><BetaSystem />{children}</LangProvider></body>
    </html>
  );
}
