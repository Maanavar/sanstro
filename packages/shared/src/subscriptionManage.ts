/**
 * Where a subscriber manages or stops their subscription — one table, because
 * the answer depends on *where it was bought*, and both clients were guessing.
 *
 * - Bought on the web, through Razorpay: `POST /payments/subscription/cancel`
 *   stops renewal, in the app or in the browser. Managing a subscription bought
 *   outside the store is not a store purchase, so the app may do it.
 * - Bought in the app, through the store (RevenueCat writes `revenuecat`):
 *   only the store can stop it. Razorpay holds no such subscription, so
 *   `/payments/subscription/cancel` answers 404 — the user must be sent to the
 *   store's own subscriptions screen.
 *
 * Mobile had this backwards: `me.tsx` sent *every* premium user to the store,
 * so a web (Razorpay) subscriber landed on an App Store page that lists
 * nothing, with no other way to stop renewing (audit 2026-11-03).
 *
 * The app never *sells* through Razorpay: Apple and Google both require their
 * own purchase flow for digital goods, so buying on mobile stays with the store
 * (RevenueCat) and `premium.tsx` shows store prices.
 */

export type SubscriptionManageAction =
  /** Send the user to the store's subscriptions screen; we cannot cancel it. */
  | "store"
  /** Call `cancelSubscription()`; renewal stops, access runs to the period end. */
  | "cancel_in_app"
  /** Nothing to manage: no subscription, or renewal is already stopped. */
  | "none";

/** The fields of `SubscriptionInfo` (GET /users/me/subscription) this needs. */
export interface ManageableSubscription {
  tier: string;
  status: string;
  provider: string | null;
  cancel_at_period_end: boolean;
}

/**
 * Providers whose subscriptions only the store can stop. `revenuecat` is what
 * the webhook writes today; the store names are here so a later direct
 * integration does not silently fall through to the Razorpay branch.
 */
const STORE_PROVIDERS = new Set(["revenuecat", "apple", "app_store", "google", "google_play"]);

export function isStoreSubscription(provider: string | null | undefined): boolean {
  return STORE_PROVIDERS.has((provider ?? "").toLowerCase());
}

/**
 * An unknown provider is treated as ours, not the store's: `cancel_in_app`
 * then answers 404 "No active subscription to cancel", which tells the user
 * something true, where a store deep link leaves them on an empty list.
 */
export function subscriptionManageAction(sub: ManageableSubscription | null | undefined): SubscriptionManageAction {
  if (!sub || sub.tier !== "premium" || sub.status !== "active") return "none";
  if (sub.cancel_at_period_end) return "none";
  return isStoreSubscription(sub.provider) ? "store" : "cancel_in_app";
}

/**
 * Whether the paid period's end date is a renewal date or a stop date. The Me
 * tab said "Renews:" either way, so a user who had cancelled was told the
 * opposite of what they had just done.
 */
export function periodEndMeaning(sub: ManageableSubscription | null | undefined): "renews" | "ends" | "none" {
  if (!sub || sub.tier !== "premium" || sub.status !== "active") return "none";
  return sub.cancel_at_period_end ? "ends" : "renews";
}
