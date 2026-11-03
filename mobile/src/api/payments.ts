/**
 * The app does not *sell* through Razorpay — Apple and Google require their own
 * purchase flow for digital goods, so buying stays with the store (RevenueCat,
 * `app/premium.tsx`). What it does need is the two read/manage calls:
 *
 * - `listPaymentProducts` for the catalogue price, so the screen is not
 *   hardcoding ₹149/₹999 when the store has no offering to quote;
 * - `cancelSubscription` for a subscription bought on the **web**, which the
 *   store cannot stop (see `@vinaadi/shared/subscriptionManage`).
 */
export type { PaymentProduct, SubscriptionCancelResponse } from "@vinaadi/shared/api/payments";
export { listPaymentProducts, cancelSubscription } from "@vinaadi/shared/api/payments";
