import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono, Noto_Sans_Tamil } from "next/font/google";
import { headers } from "next/headers";
import type { ReactNode } from "react";
// F6 — what every visitor used to get here before a single pixel of content:
// QueryProvider (react-query), PostHogProvider (-> posthog-js), BetaSystem
// (-> 524 KB marketing-i18n) and Toaster (sonner). Measured against the real
// import graph (scripts/payload-probe.mjs), the public site reaches NONE of
// react-query or sonner, and neither does /login or /admin — so those two moved
// to the dashboard layout, which is the only context that uses them. The other
// two are deferred past first paint; see components/deferred-chrome.tsx.
import { DeferredChrome } from "@/components/deferred-chrome";
import { LangProvider } from "@/components/lang-toggle";
import { getServerLang } from "@/lib/server-lang";

import "@vinaadi/design-tokens/dist/web/tokens.css";
import "./globals.css";

const BASE = "https://vinaadi.com";

// The single Fraunces instance for the whole product. 700 is here because the
// dashboard renders it (Nova declared its own 500/600/700 instance until this
// merged them); 400 and the italics are here because marketing renders them
// (`.cl-hero__h1 em`, `.cl-num-quote`, `/login`'s `.ca-left-headline em`). The
// union is what each surface already used — no cut was added speculatively and
// none was dropped, so this changes what is *declared*, not what is rendered.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
  // SHD-04 — 700 is loaded so the UI's 700/800 Tamil headings/chips render a real
  // bold cut instead of the browser synthesising faux-bold on the script the
  // brand is named after.
  subsets: ["tamil"],
  weight: ["400", "500", "600", "700"],
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

// No `potentialAction`: a SearchAction needs a URL template carrying the query
// (`{search_term_string}`), and the site has no search page to point it at. The
// one that was here targeted the porutham calculator with no placeholder, which
// is invalid structured data (GRW-08).
const WEBSITE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Vinaadi",
  url: BASE,
  description:
    "Tamil astrology assistant for daily guidance, timing, porutham, and family planning. Powered by Thirukanitham.",
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
    "daily jothidam",
    "porutham calculator",
    "jadhagam generator",
    "panchangam planner",
    "birth time rectification",
    "Tamil astrology app",
    "dasa calculator",
    "family astrology planning",
  ],
  authors: [{ name: "Vinaadi" }],
  creator: "Vinaadi",
  publisher: "Vinaadi",
  // No `url` here, and no `alternates` below: both are inherited by every page
  // that does not set its own, and a site-wide value tells search engines and
  // share previews that the page is the homepage. Ten public pages declared
  // exactly that until 2026-09-26 (GRW-02). Each page sets its own through
  // lib/page-metadata.ts; lib/seo-metadata.test.ts checks every one.
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Vinaadi",
    title: "Vinaadi - Tamil Astrology Assistant for Daily Guidance & Planning",
    description:
      "Precise Thirukanitham-based Tamil astrology for daily guidance, porutham matching, jadhagam generation, and family planning.",
    images: [
      {
        url: "/brand/vinaadi-og-image.jpg",
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
    images: ["/brand/vinaadi-og-image.jpg"],
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
  // No site-wide hreflang: declaring `en` and `ta` at one address told crawlers
  // the two were one page. Tamil now has its own URLs (`/ta/...`, GRW-06), and
  // each page that has a twin declares the reciprocal pair itself through
  // lib/localized-metadata.ts. Pages without a twin declare none.
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  // Search Console / Bing ownership tokens, read from the server's runtime env
  // so they can be set at deploy without a rebuild (GRW-01). A DNS TXT record
  // verifies the whole domain too; either works. Absent env -> no tag.
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : {}),
    ...(process.env.BING_SITE_VERIFICATION ? { other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION } } : {}),
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  // English-by-default: the site loads in English unless the visitor saved an
  // explicit Tamil preference (the language toggle / Settings card persists a
  // cookie, so returning Tamil users are unaffected). Signed-in users can set
  // their default load language in Settings; it syncs across devices via the DB.
  // Resolved through `getServerLang()` so this layout and every server-rendered
  // marketing page read the language exactly one way — see lib/server-lang.ts.
  const initialLang = await getServerLang();
  // Minted per request in middleware.ts and handed over on the request headers.
  // Reading headers() forces dynamic rendering, which costs nothing here: the
  // `getServerLang()` call above already awaits cookies(), so this layout — and
  // so every route beneath it — was dynamic before the CSP existed.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang={initialLang}
      data-ui="nova"
      suppressHydrationWarning
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} ${notoSansTamil.variable}`}
    >
      <head>
        <meta charSet="utf-8" />
        {/* MKT-19 — public pages are light-only; the Nova dashboard opts back
            into dark via `color-scheme: dark` on its own shell. Declaring "light
            dark" here made dark-OS visitors get dark native form controls on the
            cream marketing pages. */}
        <meta name="color-scheme" content="light" />
        {/* Apply saved theme before first paint to prevent flash of wrong theme.
            data-ui="nova" is set statically on <html> above (Nova is the only
            dashboard look now — see docs/NOVA_ONLY_MIGRATION_PLAN.md Phase 3). */}
        {/* UXD-03 — resolve the theme before first paint. Explicit light/dark win;
            "system" (or unset) follows the OS via prefers-color-scheme. Kept in
            sync with hooks/useTheme.ts. */}
        {/* The only executable inline script in the app, and therefore the only
            one needing the CSP nonce minted in middleware.ts. The ld+json blocks
            below carry it for consistency; browsers never execute a non-JS
            script type, so CSP does not gate them. */}
        <script suppressHydrationWarning nonce={nonce} dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem("vinaadi-theme");var r=(t==="light"||t==="dark")?t:((window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches)?"light":"dark");document.documentElement.setAttribute("data-theme",r);}catch(e){}})();` }} />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }}
        />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSONLD) }}
        />
      </head>
      <body>
        <LangProvider initialLang={initialLang}>
          <DeferredChrome />
          {children}
        </LangProvider>
      </body>
    </html>
  );
}
