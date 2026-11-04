/**
 * Where renewal is stopped depends on where the subscription was bought
 * (`@vinaadi/shared/subscriptionManage`). The Me tab used to send *every*
 * premium user to the store, so someone who subscribed on the web landed on an
 * App Store page listing nothing and had no way to stop renewing.
 *
 * Gate for the decision table only. It does not prove the screens read it: the
 * two call sites (`app/premium.tsx`, `app/(tabs)/me.tsx`) are rendered by no
 * test here, so a screen that stopped calling this would still pass.
 */
import {
  isStoreSubscription,
  periodEndMeaning,
  subscriptionManageAction,
  type ManageableSubscription,
} from "@vinaadi/shared/subscriptionManage";

const active = (over: Partial<ManageableSubscription> = {}): ManageableSubscription => ({
  tier: "premium",
  status: "active",
  provider: "razorpay",
  cancel_at_period_end: false,
  ...over,
});

describe("subscriptionManageAction", () => {
  it("cancels a web (Razorpay) subscription in the app", () => {
    expect(subscriptionManageAction(active())).toBe("cancel_in_app");
  });

  it("sends a store-bought subscription to the store", () => {
    expect(subscriptionManageAction(active({ provider: "revenuecat" }))).toBe("store");
    // Case and the store's own names, so a later direct integration does not
    // fall through to the Razorpay branch.
    expect(subscriptionManageAction(active({ provider: "RevenueCat" }))).toBe("store");
    expect(subscriptionManageAction(active({ provider: "app_store" }))).toBe("store");
    expect(subscriptionManageAction(active({ provider: "google_play" }))).toBe("store");
  });

  it("offers nothing once renewal is already stopped", () => {
    expect(subscriptionManageAction(active({ cancel_at_period_end: true }))).toBe("none");
    expect(subscriptionManageAction(active({ provider: "revenuecat", cancel_at_period_end: true }))).toBe("none");
  });

  it("offers nothing without an active premium subscription", () => {
    expect(subscriptionManageAction(null)).toBe("none");
    expect(subscriptionManageAction(undefined)).toBe("none");
    expect(subscriptionManageAction(active({ status: "expired" }))).toBe("none");
    expect(subscriptionManageAction(active({ tier: "free" }))).toBe("none");
  });

  it("treats an unknown provider as ours, which fails loudly rather than silently", () => {
    // `POST /payments/subscription/cancel` answers 404 "No active subscription
    // to cancel" — a true message. The store branch would show an empty list.
    expect(subscriptionManageAction(active({ provider: null }))).toBe("cancel_in_app");
    expect(subscriptionManageAction(active({ provider: "stripe" }))).toBe("cancel_in_app");
  });
});

describe("periodEndMeaning", () => {
  it("reads the period end as a renewal date, or a stop date once cancelled", () => {
    expect(periodEndMeaning(active())).toBe("renews");
    expect(periodEndMeaning(active({ cancel_at_period_end: true }))).toBe("ends");
    expect(periodEndMeaning(active({ provider: "revenuecat", cancel_at_period_end: true }))).toBe("ends");
  });

  it("says nothing when there is no active premium subscription", () => {
    expect(periodEndMeaning(null)).toBe("none");
    expect(periodEndMeaning(active({ status: "cancelled" }))).toBe("none");
  });
});

describe("isStoreSubscription", () => {
  it("is false for our own provider and for an absent one", () => {
    expect(isStoreSubscription("razorpay")).toBe(false);
    expect(isStoreSubscription(null)).toBe(false);
    expect(isStoreSubscription(undefined)).toBe(false);
  });
});
