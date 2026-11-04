/**
 * The PostHog event taxonomy, shared by web and mobile (admin spec §7, L6).
 *
 * This file is the *only* place either client decides what may leave the
 * device. Both go through `filterAnalyticsPayload`, so the boundary is one
 * allowlist with one test, not two that drift. Mobile had its own pair of sets
 * and web had no filter at all — web's `track()` passed whatever a call site
 * handed it straight to `posthog.capture`, which is how a birth date reaches an
 * analytics vendor by accident.
 *
 * Two rules, both deliberate:
 * - An event name not in `ANALYTICS_EVENTS` is dropped. An allowlist means a new
 *   event has to be named here, where the property question gets asked, instead
 *   of a call site inventing one.
 * - A property not in `ALLOWED_PROPERTIES` is stripped, and the event still
 *   sends. Dropping the whole event would lose the count over a typo; stripping
 *   loses one dimension and keeps the funnel honest.
 *
 * Forbidden everywhere, per the spec: name, email, phone, birth date/time/place,
 * chart content, family member details, question or answer text, free-text
 * feedback. `FORBIDDEN_PROPERTIES` lists the shapes those arrive in so the test
 * can assert the allowlist does not contain one, rather than only asserting that
 * today's call sites happen to behave.
 */

/** Events from spec §7. The funnel the business metrics are defined over. */
const SPEC_EVENTS = [
  "guest_chart_started",
  "guest_chart_generated",
  "signup_started",
  "signup_completed",
  "profile_completed",
  "trial_started",
  "trial_ended",
  "chart_generated",
  "feature_opened",
  "ask_question_submitted",
  "ask_answer_rated",
  "paywall_viewed",
  "checkout_started",
  "payment_succeeded",
  "payment_failed",
  "subscription_started",
  "subscription_renewed",
  "subscription_cancelled",
  "subscription_halted",
  "unlock_used",
  "notification_opened",
  "consent_changed",
] as const;

/**
 * Growth and onboarding events that predate the spec and are live on one or
 * both clients. Kept because removing them would blank the growth funnels
 * mid-flight; they obey the same property rules as everything else.
 */
const PRODUCT_EVENTS = [
  "onboarding_step_completed",
  "onboarding_complete",
  "jadhagam_teaser_shown",
  "register_from_teaser",
  "cta_clicked",
  "app_dl_clicked",
  "share_clicked",
  "share_card_opened",
  "share_card_shared",
  "whatsapp_share_tapped",
  "feedback_submitted",
  "life_focus_ask_chip_tapped",
  "life_focus_row_tapped",
  "life_focus_first_run_dismissed",
] as const;

export const ANALYTICS_EVENTS: ReadonlySet<string> = new Set([
  ...SPEC_EVENTS,
  ...PRODUCT_EVENTS,
]);

export type AnalyticsEvent = (typeof SPEC_EVENTS)[number] | (typeof PRODUCT_EVENTS)[number];

/**
 * Every property either client may send, on any event.
 *
 * All of them are closed sets, counts or enums — nothing a person typed and
 * nothing computed from a birth chart. `language` and `platform` are the
 * account's own settings, not device fingerprints.
 */
export const ALLOWED_PROPERTIES: ReadonlySet<string> = new Set([
  // Spec §7
  "language",
  "platform",
  "access_state",
  "sku",
  "kind",
  "amount_inr",
  "trigger_feature",
  "feature",
  "is_first",
  "rating",
  "reason_code",
  "has_referral",
  // Named in the spec's own event table
  "method",
  "converted",
  "purpose",
  "granted",
  // Onboarding and growth events above
  "step",
  "skipped",
  "source",
  "channel",
  "has_profile",
  "report_upsell",
  "pages",
  "focus",
  "surface",
  "chip_index",
  "activity",
  "target",
  "variant",
  "store",
  "category",
  "is_review",
]);

/** `utm_source`, `utm_medium`, `utm_campaign`, … — a prefix rule in the spec. */
const ALLOWED_PREFIXES = ["utm_"] as const;

/**
 * The property names the forbidden data actually arrives under, in the casings
 * both codebases use. Not consulted at runtime — the allowlist already decides
 * — but asserted against it in the tests, so adding "dob" to the allowlist
 * fails a test instead of shipping.
 */
export const FORBIDDEN_PROPERTIES: readonly string[] = [
  "name", "full_name", "fullName", "first_name", "firstName", "last_name", "lastName",
  "email", "email_address", "emailAddress", "phone", "phone_number", "phoneNumber", "mobile",
  "dob", "date_of_birth", "dateOfBirth", "birth_date", "birthDate", "birthdate",
  "birth_time", "birthTime", "tob", "time_of_birth", "timeOfBirth",
  "birth_place", "birthPlace", "pob", "place_of_birth", "placeOfBirth",
  "city", "town", "location", "place", "lat", "latitude", "lon", "lng", "longitude",
  "timezone", "time_zone", "tz",
  "rasi", "rasi_name", "rasiName", "nakshatra", "nakshatra_name", "nakshatraName",
  "lagna", "lagnam", "chart", "chart_data", "chartData", "graha", "grahas", "dasha", "dasa",
  "tithi", "yoga", "karana", "porutham", "dosham",
  "question", "question_text", "questionText", "answer", "answer_text", "answerText",
  "prompt", "response", "message", "text", "comment", "comments", "feedback",
  "feedback_text", "feedbackText", "free_text", "freeText", "note", "notes",
  "member", "member_name", "memberName", "relation", "relationship", "family_member",
];

export function isAllowedAnalyticsProperty(key: string): boolean {
  return ALLOWED_PROPERTIES.has(key) || ALLOWED_PREFIXES.some((p) => key.startsWith(p));
}

export function isAllowedAnalyticsEvent(name: string): boolean {
  return ANALYTICS_EVENTS.has(name);
}

/**
 * Strip everything not on the allowlist. Returns `undefined` when nothing
 * survives, which both PostHog clients read as "event with no properties".
 */
export function filterAnalyticsPayload(
  props?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!props) return undefined;
  const kept = Object.fromEntries(
    Object.entries(props).filter(([key]) => isAllowedAnalyticsProperty(key)),
  );
  return Object.keys(kept).length > 0 ? kept : undefined;
}
