import type { MetadataRoute } from "next";

/**
 * Web app manifest (GRW-15). With it, Android Chrome offers "Add to Home
 * screen" and opens Vinaadi as its own window, which is the nearest thing to an
 * app until the Play listing exists (`PLAY_STORE_URL` is null). Web push
 * already works through lib/firebase-messaging.ts; an installed page is where a
 * daily reminder is most likely to be seen.
 *
 * `start_url` is the dashboard: an installed icon is for a returning reader,
 * and a signed-out one is sent to /login from there.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vinaadi — Tamil Astrology Assistant",
    short_name: "Vinaadi",
    description:
      "Thirukanitham-based Tamil astrology: daily guidance, panchangam, porutham, jadhagam and family timing.",
    start_url: "/dashboard?source=pwa",
    scope: "/",
    display: "standalone",
    // Literal values of --cl-bg and --cl-ink (app/marketing.css): a manifest
    // is read before any CSS exists, so it cannot use the tokens themselves.
    background_color: "#F4EEE2",
    theme_color: "#1A1612",
    lang: "en-IN",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
