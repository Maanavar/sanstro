/**
 * The one public address, used everywhere a person is sent to Vinaadi: web
 * canonicals and sitemap, share-card footers, shared text, legal contacts.
 *
 * GRW-04 (2026-09-26): the code printed three domains — vinaadi.com (web SEO),
 * vinaadi.ai (backend panchangam share card) and vinaadi.app (mobile share
 * text) — and none of them resolved. A forwarded card is the cheapest
 * acquisition there is, so it must point at one address that exists.
 *
 * The backend mirrors this as `settings.public_site_url`;
 * tests/test_launch_parity.py fails if the two disagree. App bundle IDs
 * (`ai.vinaadi.app`) are package names, not addresses, and are not governed here.
 */
export const SITE_URL = "https://vinaadi.com";

/** The address as printed on a card or in a message: no scheme. */
export const SITE_HOST = "vinaadi.com";

/** Where the privacy policy and terms tell people to write. */
export const SUPPORT_EMAIL = `support@${SITE_HOST}`;
