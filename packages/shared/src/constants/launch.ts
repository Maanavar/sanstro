/**
 * Launch state for public copy (pricing, beta, upgrade prompts).
 *
 * Owner ruling 2026-09-26: Vinaadi runs as an open beta — every feature free —
 * until the site is live and tested; payments come after.
 *
 * The server's switch is `JOTHIDAM_OPEN_BETA` (app/core/config.py `open_beta`),
 * which is what actually lifts the caps. This constant is the copy's copy of it,
 * for pages that render without a signed-in user. `tests/test_launch_parity.py`
 * fails if the two defaults disagree, so ending the beta is one coordinated
 * change: flip both, then ship payments.
 *
 * Copy may read this anywhere. A feature *gate* must not — gates read `openBeta`
 * from `/auth/me` (mobile: `useSession().gateTier`), which reflects the
 * server's live value, so a lock can never disagree with what the server allows.
 */
export const OPEN_BETA = true;

/**
 * The Google Play listing, or null while there is none. `ai.vinaadi.app`
 * returned 404 on Play on 2026-09-26, so every "Get it on Google Play" badge was
 * a dead link. Set the real URL the day the listing is published and the badges
 * return (the iOS badge already follows this pattern with its own null URL).
 */
export const PLAY_STORE_URL: string | null = null;
