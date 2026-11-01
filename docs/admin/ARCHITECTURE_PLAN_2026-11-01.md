# Admin, payments and privacy: architecture plan

2026-11-01 · Companion to `VINAADI_ADMIN_MASTER_SPEC.md` (the spec) and `VERIFICATION.md`.
Prefix **ARC**. Covers three things: what is already built, where I'd change the spec, and the
access/tier matrix for launch.

---

## 1. Bottom line

**We have more built than the spec assumes in some places and much less in others.**

- **Strong base:** server-side auth with `token_version` logout-everywhere, elevation tokens, an
  audit log with actors, an idempotent webhook inbox (RevenueCat, A05), a notification outbox
  with claim/retry, a scheduler with heartbeats, server-side feature gates (`require_feature`,
  `limits_for_user`), encrypted birth dates, `is_minor`, acquisition columns, PostHog and Sentry
  on web and mobile, and mobile RevenueCat purchase identity.
- **Absent:** any real payment path (`/reports/purchase` is a stub), Razorpay, an `entitlements`
  model, TOTP, roles, a consent ledger, a data registry, persisted flags, Ask cost tracking.
- **Not built as products:** the four report sizes (1/3/5/10-page) that the price list sells. There
  is one PDF generator.

**30 days is not enough for all of Gate L plus the remaining ~20% of product work.** My estimate for
Gate L alone is **28–37 focused build days**, before review, testing on production, and waiting on
Razorpay KYC. §5 proposes a launch cut that fits: payments, privacy and admin safety in; analytics
rollups, the full support console and the audit hash chain moved to L+30.

---

## 2. What exists versus each package

Size is in focused build days. ●= exists and is reusable, ◐ = partial, ○ = absent.

| Pkg | Reuse | Gap | Size |
|---|---|---|---|
| L1 Payments | ● `webhook_events` inbox + idempotency pattern · ● `subscriptions` with period end · ● `limits_for_user` single reader · ● mobile RevenueCat | ○ Razorpay client, checkout, webhook · ○ `products`, `orders`, `payments`, `refunds`, `entitlements` · ○ web checkout UI · ○ reconciliation · ○ report deliverables per SKU | 6–8 |
| L2 Consent | ◐ `users.consent_given_at` + `consent_policy_version`, `/auth/consent`, `privacy_policy.py` · ● stateless guest charts (`/public/chart`, `/chart-preview`) | ○ purpose ledger P1–P4 · ○ 18+ checkbox · ○ settings toggles · ○ notice screen in Tamil/English | 3–4 |
| L3 Admin access | ● elevation tokens bound to `token_version` · ● `is_suspended` | ○ TOTP + recovery codes · ○ roles/permissions · ○ admin-email seed-once · ○ idle timeout | 3–4 |
| L4 Audit | ● `admin_audit_log`, `log_admin_action` | ◐ add role, reason, UA, outcome, details JSON · ○ DB grant guard · ○ hash chain · ○ route-coverage test | 2 |
| L5 Erasure | ◐ two divergent delete paths (see ADM-01) | ○ registry · ○ one `erase_user` · ○ export · ○ tombstones · ○ `privacy_requests` | 3–4 |
| L6 Analytics | ● acquisition columns · ● PostHog web+mobile | ○ `last_seen_on` · ○ `daily_metrics` rollup · ○ payload filter test | 2–3 |
| L7 Ask rails | ● `ask_vinaadi_usage` quota table · ● provider error handling | ○ tokens/cost/latency/prompt-version · ○ global spend cap · ○ kill switch · ○ sensitive-topic flags | 2 |
| L8 Messaging | ● outbox with retries | ○ 410 on broadcast · ○ quiet hours · ○ token pruning (check FCM service first) | 0.5–1 |
| L9 Support | ◐ user list/detail/suspend in admin | ○ search by order/payment ID · ○ user 360 · ○ courtesy grants · ○ masked/reveal | 3–4 |
| L10 Ops | ● scheduler heartbeat, job triggers | ○ flags in DB (ADM-09) · ○ kill switches · ○ `job_runs` · ○ restore drill | 2–3 |
| L11 Runbooks | — | six one-page docs | 1 |

---

## 3. Where I'd change the spec

Each item is a recommendation. Items marked **(needs you)** are in §6.

**ARC-01. Keep guest charts stateless; drop `guest_sessions` storage (changes D-09).**
Guest charts are already computed in memory and never stored (`app/api/public_tools.py:183-218`).
The spec would start storing guest birth details server-side, then build a 30-day purge job and a
legal question (#5) to cover them. Instead: the browser keeps the guest's birth details for the
session, and at signup the client posts them as the user's first profile, after P1 consent. That
removes a table, a purge job, a retention setting and one PENDING-LEGAL item. UTM and referral
capture moves to a first-party cookie read at signup, which `web/lib/acquisition.ts` already does
in some form (verify). **(needs you)**

**ARC-02. Entitlements need quantities, not only time ranges.**
The spec's `entitlements` row is "key active from–to". That covers Premium and trials. It does not
cover a 10-question top-up, a purchased porutham report used once, or "5 reports a month included".
Add a `credit_ledger` (user, credit key, +n/−n, source, idempotency key) beside `entitlements`.
Purchases add credits; using a report or question spends one, keyed so a retry can't spend twice.
The monthly included allowance is counted from usage in the period, the way Ask quota works today.

**ARC-03. One reader for access: keep `limits_for_user`.**
Don't add a second gate. `limits_for_user` stays the only function every route asks, and changes
from "subscription row or open beta" to "union of active entitlements → TierLimits". `trial`
resolves to a `TRIAL_LIMITS` built with `replace(...)`, the same pattern as `OPEN_BETA_LIMITS`.
`require_feature`, quota counts and `/auth/me` keep working unchanged. RevenueCat's webhook starts
writing entitlements too, so web and app purchases meet in one place.

**ARC-04. Process Razorpay webhooks inside the request; no queue.**
The spec says "enqueue" but also says no new infrastructure, and there is no queue. Applying one
event is a few row writes in one transaction, well under Razorpay's timeout. Do it inline behind the
`payment_events` unique key (the A05 pattern), return 5xx on failure so Razorpay retries, and let
the nightly reconciliation catch anything lost. Bulk admin actions and exports still go to the
scheduler.

**ARC-05. Fewer SKUs at launch.**
The catalogue sells 1/3/5/10-page Jadhagam reports and 1/3-page Porutham reports. One PDF generator
exists (`app/services/pdf_export_service.py`). Building and reviewing four report formats, in Tamil
and English, inside 30 days competes with doctrine work. Launch with: Premium monthly, Premium
annual, **one** Jadhagam report, **one** Porutham report, the Ask 10-question top-up. Add sizes when
the content exists. Since prices are data (D-08), adding a SKU later needs no deploy. **(needs you)**

**ARC-06. Premium's included reports undercut pay-per-service.**
TIER_PLAN gives Premium 5 reports + 3 porutham reports a month. At ₹99 each that's about ₹790 of
reports inside a ₹149 plan, so nobody who wants a report would buy one. Suggest 1 Jadhagam report and
1 Porutham report included per month. **(needs you)**

**ARC-07. One Ask Vinaadi limit, not three.**
Today there are three: `tier_limits.py` (guest 2/day, free 7/day, premium 30/month),
`config.ask_vinaadi_daily_limit = 10`, and the `ask_vinaadi_daily_limit` flag. The approved plan
says 1/2/5 per day and the code was never updated (memory note from 2026-07-03). L7 makes the per-state
quota a DB setting with history and deletes the other two. Guests can't reach Ask today (it needs a
saved chart and sign-in), so guest = 0, not 1.

**ARC-08. Trial = Premium features with a smaller allowance.**
D-07's trial starts on signup with no mandate, so every new email address gets 7 days of Premium.
That's fine for features that cost nothing to serve. It costs money where Ask (LLM spend) and
included reports are concerned. Suggest the trial gets all Premium features, Ask at 3/day, and
**no** included reports. Also start the trial when the email is verified, not at account creation,
so throwaway sign-ups don't get a trial. **(needs you)**

**ARC-09. Audit hash chain to L+30; DB grant restriction stays in L.**
Restricting the app's DB role to `INSERT, SELECT` on the audit table gives most of the
tamper-resistance for a fraction of the work. The chain, verifier job and alert can follow at L+30.
Check first whether production runs migrations with the same DB role as the app: if it does, the
grant needs a second role, which is a hosting change.

**ARC-10. Gate M is partly done already.**
Mobile has RevenueCat purchase identity (`mobile/src/lib/purchaseIdentity.ts`, tested) and the
server has an idempotent RevenueCat webhook. Gate M is mostly "write entitlements from the existing
webhook" plus store setup, not a new integration.

**ARC-11. The web pricing page currently sends buyers to Google Play.**
`web/app/(marketing)/pricing/page.tsx:321-323` says "Premium is managed through Google Play.
Download the app to start your trial". With Razorpay on web that copy is wrong and L1 must replace
it. Its trial copy ("every subscription starts with a 7-day trial") also describes a
payment-first trial, which D-07 replaces.

**ARC-12. Ending the open beta is a launch step that needs its own plan.**
`settings.open_beta` defaults to `True` and gives every signed-in account Premium features. Turning it
off at launch removes features from existing beta users. The spec says to stop and report on any
change to what an existing user sees, so it needs your decision (§6). Suggest: on launch day,
every beta account gets a `grant` entitlement for 30 days of Premium ("founding member"),
with an email 7 days before it ends. **(needs you)**

---

## 4. Access matrix for launch

**Yes, this was already split:** `docs/TIER_PLAN.md` (approved 2026-06-27) defines Guest, Registered
and Premium plus the pay-per-use catalogue, and `tier_limits.py` / `tiers.ts` encode it. Gaps: the
trial was never defined as its own state, the code drifted from the plan on Ask, remedies have no
owner ruling, numerology has no tier, and the pay-per-use products have no deliverables.

Below is the proposed launch matrix. **Bold** marks a change from TIER_PLAN, with the reason in the
ARC item named.

| Area | Guest (unsigned) | Free (signed in) | Trial (7 days) | Premium | Pay per service |
|---|---|---|---|---|---|
| Birth chart | Generate and view, **not saved** (ARC-01) | Save 3 profiles | Unlimited | Unlimited | — |
| Panchangam, calendar, festivals, rasi palan (public) | Full public pages | Full | Full | Full | — |
| Personal rasi palan window | Today | ±3 days | ±30 days | ±30 days | — |
| Dasha | — | Current maha + antar | Full tree | Full tree | — |
| Porutham | Basic score (public tool) | Basic 10-factor | Full analysis | Full analysis | Porutham report |
| Family vault | — | Self + 1 | 5 | 5 | — |
| Ask Vinaadi per day | **0** (ARC-07) | 2 | **3** (ARC-08) | 5 | 10-question top-up, Premium only |
| Varshaphala, vargas, synastry, rectification, retrospective, life-event log | — | — | Yes | Yes | — |
| Journal, goals, streaks | — | Journal, 3 goals | Unlimited | Unlimited | — |
| Notifications and alerts | — | Yes | Yes | Yes | — |
| Included reports per month | — | — | **0** (ARC-08) | **1 Jadhagam + 1 Porutham** (ARC-06) | — |
| Personalised remedies | Owner ruling pending (`UNENFORCEABLE_FEATURES`) | ? | ? | ? | — |
| Numerology, baby naming | No tier assigned; baby naming blocked by the unverified pada-akshara canon | ? | ? | ? | ? |
| Buying anything | Sign up first | Yes | Yes | Yes | — |

**Pay-per-service at launch** (prices from TIER_PLAN, stored in `products`): Jadhagam report
(one size, price to set), Porutham report ₹99, Ask top-up 10 questions ₹49. Premium monthly ₹149,
annual ₹999.

**Trial rules:** one per account; starts on email verification; ends after 7 days with no charge;
reminders on day 5 and day 7; a user who subscribes during the trial keeps Premium without a gap.

---

## 5. Build order and the launch cut

Order follows the spec (one package per PR), with the changes above.

| # | Package | In launch | Moved to L+30 |
|---|---|---|---|
| 1 | **L10a** flags and settings in DB | Flags, kill switches, settings with history | `job_runs` UI, restore drill UI (do the drill itself) |
| 2 | **L3** admin access | TOTP, recovery codes, owner/support roles, seed-once, permission matrix test | Owner sign-in email, idle timeout |
| 3 | **L4** audit | Extended columns, reason required, route-coverage test, DB grant | Hash chain + verifier (ARC-09), CSV export |
| 4 | **L1** payments | Razorpay orders + subscriptions, webhook, entitlements + credit ledger, trial, paywall, reconciliation job | Reconciliation UI beyond a list |
| 5 | **L5** erasure | Registry, one `erase_user`, export JSON, tombstones, registry CI check | Readable export summary, `privacy_requests` UI (track in Zoho Desk meanwhile) |
| 6 | **L2** consent | Notice, P1–P4 ledger, signup 18+, settings toggles, minors excluded | — |
| 7 | **L7** Ask rails | Cost capture, spend cap, per-state quota, kill switch | Sensitive-topic review list |
| 8 | **L8** messaging | All of it | — |
| 9 | **L6** analytics | `last_seen_on`, PostHog payload test | `daily_metrics` rollup + Overview tiles |
| 10 | **L9** support | Search by email/order ID, entitlements and payments on user page, courtesy grant, reset link, force logout | Masked/reveal flow, notes, Sentry link |
| 11 | **L11** runbooks | Breach, payment/refund, privacy request | The other three |

Why flags first: kill switches for payments and Ask are needed by L1 and L7, and they must work on
every worker, which today's in-memory flags don't.

**Launch cut: roughly 20–24 build days.** Still tight alongside product work. If something slips,
L9 and L6 slip first. L1, L2, L3 and L5 don't.

**External blockers:** Razorpay KYC and Subscriptions approval (L1 can be built in test mode before
approval, but the live test purchase in §9 cannot happen until it clears); published Terms, Privacy,
Refund and Grievance pages (Razorpay needs them to approve the site); the GST answer from your CA
(fields can be stored without it).

---

## 6. Decisions

**Decided 2026-11-01:** the owner accepted every recommendation below ("go with your
recommendation"). Each item is now a ruling; the recommendation in italics is the decision.

1. **Guest storage (ARC-01).** Keep guest charts stateless, so they're never stored? *Recommend yes.*
2. **Launch SKUs (ARC-05).** One Jadhagam report + one Porutham report + top-up + two Premium plans?
   And the Jadhagam report's launch price? *Recommend yes; price ₹99.*
3. **Included reports (ARC-06).** Premium includes 1 + 1 per month instead of 5 + 3? *Recommend yes.*
4. **Trial allowance (ARC-08).** Trial Ask at 3/day, no included reports, starts on email
   verification? *Recommend yes.* (I haven't checked whether email verification exists yet; if not,
   it joins L2.)
5. **Beta users at launch (ARC-12).** 30 days of free Premium for existing accounts, then normal
   rules? *Recommend yes.*
6. **Remedies tier.** TIER_PLAN says Premium; the app shows them to everyone today. *Recommend: static
   pariharam free for all, personalised remedy plan Premium.*
7. **Numerology tier.** *Recommend: numerology numbers free while the copy is unreviewed; baby naming
   stays off until the canon is verified.*
8. **Ask top-up for Free users.** TIER_PLAN: Premium only. *Recommend keep* (a Free user buying two
   top-ups pays nearly the Premium price and gets less).
9. **Annual plan via Razorpay.** Annual is a one-time ₹999 payment per year (Orders API, no mandate),
   or a yearly Subscription with a mandate? *Recommend a yearly Subscription*, so renewal is automatic
   and handled by the same code path as monthly.
10. **Admin erasure scope.** The spec decides admin erasure equals self-delete (account removed).
    Confirm. *Recommend yes.*

---

## 7. Progress

Branch `harden/production-readiness`, uncommitted. Backend tests run in the `vinaadi-test:312`
container (not authoritative; CI is). Every migration below was round-tripped
(upgrade → downgrade to `vv5f6a7b8c9d` → upgrade → step down/up) on a scratch database.

| # | Package | State | Tests |
|---|---|---|---|
| 1 | **L10a** flags in DB | Done (2026-11-01). `runtime_settings` + history, kill switches, `/site-status`, banner, console flag tab with reason and Undo. Migration `vv5f6a7b8c9d`. | `test_runtime_settings.py` |
| 8 | **L8** messaging | Done. Broadcast 410 and audited; quiet hours 21:00–08:00 local (IST fallback), priority ≥ 90 urgent. | `test_messaging_safety.py` |
| 2 | **L3** admin access | Done. TOTP enrolment + 10 hashed single-use recovery codes; `403 mfa_required` on every admin route except `/admin/me` and `/admin/mfa/*`; elevation by TOTP or recovery code; roles `owner`/`support` (+4 defined, unassignable); `require_permission` on every admin route; seed-once owner from `JOTHIDAM_ADMIN_EMAILS` (verified account only); 8 h admin session; last-owner and self-suspend guards. Email verification (`/auth/verify-email`, resend, bilingual email). Console: code-based elevation dialog, set-up screen, Roles tab. Migration `ww6a7b8c9d0e`. | `test_admin_permissions.py` (structural + snapshot `tests/golden/admin_permission_matrix.json` + real support account), `test_admin_mfa.py`, `test_email_verification.py`, `test_admin_elevation.py` |
| 4 | **L1** core: ladder, trial, entitlements | Done. Ladder per §6 (Ask guest 0 / registered 2 / premium 5 a day; premium 1 + 1 reports); beta Ask pinned at 7; `TRIAL_LIMITS`; `entitlements` table (trial / purchase / grant, one trial per account enforced by a partial unique index); `limits_for_user` = premium → trial → beta → registered; `/auth/me` adds `accessState` + `trialEndsAt` (shared types, web, mobile `gateTier`). Dead `ask_vinaadi_daily_limit` flag/config removed. Pricing page copy fixed (ARC-11). Migration `xx7b8c9d0e1f`. | `test_trial_entitlements.py`, `test_tier_parity.py`, `test_open_beta.py` |
| 4 | **L1** payments | Built, test mode only. `products` (seeded, prices as data), `orders`, `payments`, `refunds`, `credit_ledger`, `payment_mismatches`; `subscriptions` gains `provider_status` / `sku` / `cancel_at_period_end`; `webhook_events` gains `signature_valid` / `error`. Razorpay client over httpx; checkout (order + subscription), `/payments/confirm` (grants only on API confirmation), `/payments/razorpay/webhook` (HMAC over raw body, idempotent on `X-Razorpay-Event-Id`, inline), subscription lifecycle, refunds, nightly reconciliation (22:00 UTC = 03:30 IST), admin mismatch + order lists. Web `/dashboard/upgrade` with Razorpay Checkout; CSP widened on that route only. Migration `yy8c9d0e1f2a`. | `test_razorpay_payments.py` — all seven spec acceptance tests plus 15 more |
| 3 | **L4** audit | Next. | — |
| 5 | **L5** erasure | Not started. ADM-01 still open: `interpretation_outputs`, device tokens and feedback survive deletion. | — |
| 6–11 | L2, L7, L6, L9, L11 | Not started. | — |

**Gates proven to fail with the fix removed** (CLAUDE.md): permission declared per route, the MFA
requirement, the listed-email bypass, the trial branch of `limits_for_user`, the webhook signature
check, "grant only on API confirmation", refund revocation, a halted subscription ending at period
end, and reconciliation recording a missing payment. One test passed a mutant: the lifecycle test
rewrote the field the mutant broke. It now asserts the period end before moving the clock.

**Known blind spots**, also written in each test file's docstring:
- The permission test sees permissions declared as dependencies, not a handler that branches on `role_has`.
- The Razorpay fake follows Razorpay's documentation. The live test purchase in spec §9 is what proves the real API.
- The Google callback is not driven end to end; its two lifecycle calls are tested directly.

### Owner actions to switch payments on

1. Razorpay test keys in `JOTHIDAM_RAZORPAY_KEY_ID` / `_KEY_SECRET`. Create the webhook at
   `{backend}/api/v1/payments/razorpay/webhook` with a secret in `JOTHIDAM_RAZORPAY_WEBHOOK_SECRET`, and
   subscribe it to the `payment.*`, `order.paid`, `refund.*` and `subscription.*` events.
2. Create the monthly and yearly plans in the Razorpay dashboard, then
   `UPDATE products SET razorpay_plan_id = 'plan_…' WHERE sku IN ('premium_monthly','premium_annual')`.
   Subscription checkout answers 503 until this is done.
3. The report SKUs and the Ask top-up are seeded `active = false` (ARC-14). Switch each on when it
   has something to deliver.
4. `JOTHIDAM_OPEN_BETA=false` on launch day, together with the ARC-12 founding-member grant (not built yet).

## 8. Decisions taken while building (owner to confirm)

**ARC-13. Subscription access stays computed from `subscriptions`.** Trials, purchases and grants go in
`entitlements`; a subscription's period end is Razorpay's (or RevenueCat's) fact and is not copied
into a second table. `subscriptions.status` is the access projection ("active" = access until
`current_period_end`). Razorpay's own state goes in `provider_status`. A `pending` renewal (charge
being retried) keeps access past the period end until `halted` or `cancelled` arrives. Reconciliation
catches a pending state whose closing webhook never came.

**ARC-14. Products with nothing to deliver are not sold.** The Jadhagam report, Porutham report and Ask
top-up are seeded inactive: no report deliverable exists yet, and Ask credit spending is L7. Their
purchase, refund and credit paths are built and tested. Turning one on is a row update.

**ARC-15. The webhook inbox stores ids, states and amounts, not the raw body.** The spec asks for
`raw_body`. Razorpay's payment entity carries the payer's email, phone and VPA, and the existing inbox
rule (A05) is "pick fields explicitly", so `minimal_payload` keeps only what reconciliation needs. A
test pins that contact details are absent. Reuses `webhook_events` (spec §0.3) instead of a new
`payment_events` table. A bad-signature request is stored under a generated id, never the id it
claimed, so a forger cannot pre-empt a real event's idempotency key.

**ARC-16. No trial starts while the open beta is on.** The trial outranks the beta in `limits_for_user`
and its Ask allowance is smaller (3 vs 7 a day). A beta user who verified their email would lose
allowance and spend their one trial invisibly. Beta accounts get the ARC-12 grant instead. Accounts
created after the beta ends get the trial as designed.

**ARC-17. New finding, not changed: Google sign-in links to an unverified password account.** If someone
registers `victim@gmail.com` with a password and never verifies it, the victim's later Google sign-in
links to that account. The squatter still knows the password, so this is an account pre-hijack. It
predates this work. Fix options: on linking, clear `hashed_password` and bump `token_version` when the
existing account is unverified. That changes behaviour for an existing user, so it needs your
decision.

*Ruled 2026-11-01 (delegated): fixed.* Google's verified address is proof of ownership. Proof beats
an unproven claim, so on linking to an account with `email_verified_at IS NULL` the callback clears
`hashed_password`, bumps `token_version`, revokes refresh tokens and clears the consent stamp. Then it
links, and verifies the address. Accounts already verified link exactly as before. The user-visible
change: someone who registered with a password, never clicked the link, and later used Google can
no longer sign in with that password. "Forgot password" restores it, and the link goes to the proven
address. They are asked for consent again (non-blocking). Their data stays: detaching it into a fresh
account would lose the real owner's data in that common case, to protect against a squatter who
planted only synthetic data. Gate: `test_oauth_google_link_to_unverified_account_evicts_the_registrant`.
With the whole fix removed it fails on the squatter's old token still answering 200. With only the
password clear removed it fails on the squatter's re-login answering 200. Blind spot: the callback
is driven with a faked Google exchange, not real Google. Mobile has no Google sign-in, so it has
no second path to fix.

**ARC-18. Pre-existing model/migration drift.** `alembic check` reports six differences in older tables:
`birth_profiles` NOT NULL on three encrypted columns, and three indexes that exist in migrations but
not in the models (`ix_subscriptions_provider_subscription`, `ix_users_google_sub`,
`ix_webhook_events_status_created`). None are in this work's tables. They are worth one cleanup
migration before launch.

*Ruled 2026-11-01 (delegated): fixed, each on the side that was wrong.* The indexes were right in
the database and missing from the models, so they are now declared in the models with no migration.
Dropping them, which is what autogenerate wanted, would have removed the uniqueness that keeps one
Google identity to one account. `birth_profiles.birth_date_local / birth_latitude / birth_longitude` were right
in the model and lax in the database, so migration `zz9d0e1f2a3b` sets NOT NULL. It refuses, with
counts, if any NULL exists, and its downgrade drops the constraints. Verified on a scratch DB:
`alembic check` reports no new operations at head. The downgrade and re-upgrade round trip is clean.
A seeded NULL row made the upgrade refuse with its message. vinaadi_dev held 0 NULLs of 4 rows. Not
applied to dev; it rides with the rest of the unapplied chain.
