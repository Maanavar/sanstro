# Payment & Subscription Flow

## Overview

Vinaadi AI uses **RevenueCat** as the paywall/entitlement layer on mobile and a separate web payment flow for the Next.js web app.

---

## Mobile (iOS / Android)

**SDK:** `react-native-purchases` (RevenueCat)

**Initialisation:** `Purchases.configure({ apiKey })` is called in `mobile/app/_layout.tsx` at module load, before the React tree mounts. Separate API keys are used per platform (`REVENUECAT_PUBLIC_KEY` for iOS, `REVENUECAT_ANDROID_KEY` for Android) — stored as EAS secrets and injected via `app.config.js` → `extra`.

**Purchase flow:**
1. `Purchases.getOfferings()` → returns current offerings configured in the RevenueCat dashboard.
2. User selects monthly or annual package → `Purchases.purchasePackage(pkg)`.
3. On success, `customerInfo.entitlements.active['premium']` is truthy → session tier is updated to `'premium'`.
4. On restore: `Purchases.restorePurchases()` → same entitlement check.

**User identification:** After JWT login, `Purchases.logIn(userId)` links the RevenueCat customer to the backend user, ensuring entitlements survive app reinstalls.

**Entitlement ID:** `premium` (configure this exact string in the RevenueCat dashboard).

**Sandbox testing:** Use TestFlight (iOS) or internal test track (Android). RevenueCat sandbox purchases do not charge real money.

**Files:**
- `mobile/src/lib/env.ts` — `REVENUECAT_PUBLIC_KEY`, `REVENUECAT_ANDROID_KEY`
- `mobile/app/_layout.tsx` — SDK init + user login
- `mobile/app/premium.tsx` — paywall UI + purchase / restore logic

---

## Web (Next.js)

The web app does **not** currently have an in-app payment flow. Options under consideration:

1. **RevenueCat Web SDK** — RevenueCat supports web purchases via Stripe under the hood. This would unify entitlement management across mobile and web.
2. **Stripe Checkout** — Direct Stripe integration with a `/api/create-checkout-session` endpoint. Webhook at `/api/stripe-webhook` updates the user's tier in the database.
3. **External redirect** — Users are directed to a hosted payment page (Lemon Squeezy or Paddle) which webhooks back to the backend.

**Current status:** No web payment code exists in this repo. The web app gates premium features by reading `tier` from the JWT, which is set by the backend after a successful mobile in-app purchase entitlement sync.

**To add web payments:**
1. Choose provider (recommend RevenueCat Web for unified entitlement).
2. Add `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` (or equivalent) to `web/.env.local` and CI secrets.
3. Create `web/app/api/create-checkout-session/route.ts` and `web/app/api/stripe-webhook/route.ts`.
4. Add a `/premium` page in the web app with the payment UI.
