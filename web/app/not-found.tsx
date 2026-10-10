import Link from "next/link";
import type { Metadata } from "next";

import { getServerLang } from "@/lib/server-lang";

/**
 * The 404 page.
 *
 * Until this file existed, every mistyped, truncated or retired URL on the
 * site rendered Next's built-in default: a black-on-white "404 | This page
 * could not be found" with no header, no link, no brand and no Tamil. That is
 * the page a visitor sees at the exact moment they are most likely to leave,
 * and the most common way to arrive at it is not a typo — it is truncating a
 * URL by hand (`/natchathiram/rohini` → `/natchathiram`) to look for the
 * section above. So this page's real job is not to apologise; it is to name
 * the sections and get the visitor back into one.
 *
 * A Server Component reading `getServerLang()`, like the marketing pages, so a
 * Tamil reader gets Tamil here too. It deliberately does NOT import
 * `marketing.css`: that stylesheet is ~117 KB and lives in the (marketing)
 * route group, while this file is at the app root and catches 404s from every
 * route — including `/dashboard/...`, which has never downloaded it. The
 * styles below use the global `--color-*` token layer from the root layout, so
 * they follow the active theme without pulling a second design system in.
 */
export const metadata: Metadata = {
  title: "Page not found",
  // A 404 must never be indexed, and Next does not add this for you.
  robots: { index: false, follow: true },
};

type Destination = { href: string; en: string; ta: string };

/** The sections worth offering, in the order a lost visitor is likely to want
 *  them — not the order of the nav. Each one is a real, shipped hub page. */
const DESTINATIONS: Destination[] = [
  { href: "/panchangam/today", en: "Today's panchangam", ta: "இன்றைய பஞ்சாங்கம்" },
  { href: "/tamil-calendar", en: "Tamil calendar", ta: "தமிழ் காலண்டர்" },
  { href: "/natchathiram", en: "Natchathiram guide", ta: "நட்சத்திர வழிகாட்டி" },
  { href: "/tools/marriage-porutham-calculator", en: "Porutham calculator", ta: "பொருத்தக் கணிப்பான்" },
  { href: "/muhurtham-naal", en: "Muhurtham days", ta: "முகூர்த்த நாட்கள்" },
  { href: "/dosham", en: "Dosham guide", ta: "தோஷ வழிகாட்டி" },
  { href: "/pariharam", en: "Pariharam guide", ta: "பரிகார வழிகாட்டி" },
  { href: "/temples", en: "Temples", ta: "கோயில்கள்" },
];

export default async function NotFound() {
  const lang = await getServerLang();
  const L = (en: string, ta: string) => (lang === "ta" ? ta : en);

  return (
    <main
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        maxWidth: "46rem",
        // 16px side gutter at phone width, generous above it.
        margin: "0 auto",
        padding: "var(--space-10, 3rem) 1rem",
        color: "var(--color-text)",
        // `--font-heading` rather than `--font-display`: Fraunces carries no
        // Tamil, so a bare display stack paints Tamil in the system fallback.
        fontFamily: "var(--font-body)",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "var(--text-sm, 0.875rem)",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--color-muted)",
        }}
      >
        404
      </p>

      <h1
        style={{
          margin: "var(--space-3, 0.75rem) 0 0",
          fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
          lineHeight: 1.2,
          fontWeight: 600,
        }}
      >
        {L("This page isn't here", "இந்தப் பக்கம் இங்கு இல்லை")}
      </h1>

      <p
        style={{
          margin: "var(--space-4, 1rem) 0 0",
          fontSize: "var(--text-lg, 1.125rem)",
          lineHeight: 1.65,
          color: "var(--color-muted)",
        }}
      >
        {L(
          "The address may have changed, or part of it may have been cut off. Everything below is one click away.",
          "முகவரி மாறியிருக்கலாம், அல்லது அதன் ஒரு பகுதி விடுபட்டிருக்கலாம். கீழே உள்ள அனைத்தும் ஒரே சொடுக்கில் கிடைக்கும்.",
        )}
      </p>

      <nav
        aria-label={L("Main sections", "முக்கியப் பிரிவுகள்")}
        style={{ marginTop: "var(--space-8, 2rem)" }}
      >
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "grid",
            // One column on a phone, two once there is room — no media query
            // needed, and no horizontal scroll at 375px.
            gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))",
            gap: "var(--space-2, 0.5rem)",
          }}
        >
          {DESTINATIONS.map((d) => (
            <li key={d.href}>
              <Link
                href={d.href}
                style={{
                  display: "block",
                  padding: "var(--space-3, 0.75rem) var(--space-4, 1rem)",
                  borderRadius: "var(--radius-md, 0.5rem)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface-2)",
                  color: "var(--color-text)",
                  textDecoration: "none",
                  fontSize: "var(--text-base, 1rem)",
                  // 44px minimum target — the rows are close together.
                  minHeight: "2.75rem",
                }}
              >
                {L(d.en, d.ta)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <p style={{ marginTop: "var(--space-8, 2rem)", fontSize: "var(--text-base, 1rem)" }}>
        <Link href="/" style={{ color: "var(--color-accent)", fontWeight: 500 }}>
          {L("Back to the home page", "முகப்புப் பக்கத்திற்குத் திரும்பு")}
        </Link>
      </p>
    </main>
  );
}
