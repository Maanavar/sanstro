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
| 3 | **L4** audit | Done (launch cut). `admin_audit_log` gains `actor_email`, `actor_role` (`service_key` for X-Admin-Key), `reason`, `outcome` (success / refused / error), `details` JSONB, `user_agent`, target index. One writer: every mutating admin route and the two personal-data reads (`GET /admin/users`, `/admin/users/{id}`) take `audited(...)` first, which writes one row per request on every outcome, commits the handler's session before "success" (ARC-20), and skips only the console's tokenless elevation prompt. Routes no longer call `log_admin_action`. Reason required on the nine destructive routes and destructive job runs (ARC-21). Append-only trigger: UPDATE/DELETE/TRUNCATE refused except actor nulling and `erased:` target pseudonymisation (ARC-19). `GET /admin/audit-log` filters by action, actor, target, outcome, date. Shared `adminAudit.ts`; console: Who/Outcome/Reason/Details columns, filters, reason inputs for suspend/reinstate, erasure and destructive jobs. Migration `ab0f1a2b3c4d`, round-tripped on scratch; applied to dev 2026-11-01 (backup first; legacy rows kept, DELETE refused, `alembic check` clean). Deferred per ARC-09: hash chain + verifier, CSV export. | `test_admin_audit.py` (structural, coverage over all 16 mutating routes, outcomes, reasons, DB guard, migration/model SQL parity) |
| 5 | **L5** erasure | Done (launch cut, 2026-11-02). `app/privacy/registry.py` has 48 table stores (each with what it holds, how erasure treats it: delete, detach or keep, its retention and what export shows) plus 7 external processors as manual steps. One `erase_user` serves `DELETE /auth/me` and the console's `DELETE /admin/users/{id}/data`, which now removes the account itself (decision 10). Accounting records stay, detached: orders, subscriptions (now `SET NULL`, ARC-22), payments, refunds, webhook events. Audit rows: actor nulled, target rewritten to `erased:<tombstone id>`. Every erasure writes an `erasure_tombstones` row and an audit row with per-store counts. Refusals: ARC-23. Export: `GET /auth/me/export` (settings "Download my data") and `GET /admin/users/{id}/export` (elevated, reason, audited), ARC-27. `restore-dev-db.ps1` carries tombstones across a restore and replays them (`app.privacy.tombstones`). Migration `bc1d2e3f4a5b`, round-tripped on scratch (downgrade refuses while a detached subscription exists); applied to dev 2026-11-02 after backup `backup_20261102_1646.sql` (5 users, 4 profiles intact, `alembic check` clean). Deferred per §5: the readable Tamil/English summary, the `privacy_requests` table and UI (Zoho Desk meanwhile), and mobile export. | `test_account_deletion.py` (registry coverage walk; erase everything via each route, checked row by row; refusals; export; tombstone replay) |
| 6–11 | L2, L7, L6, L9, L11 | Not started. | — |

**Gates proven to fail with the fix removed** (CLAUDE.md): permission declared per route, the MFA
requirement, the listed-email bypass, the trial branch of `limits_for_user`, the webhook signature
check, "grant only on API confirmation", refund revocation, a halted subscription ending at period
end, and reconciliation recording a missing payment. One test passed a mutant: the lifecycle test
rewrote the field the mutant broke. It now asserts the period end before moving the clock.
L4 (2026-11-01), four mutants at once, each caught by its own layer: no trigger in `create_all`
(7 guard tests failed), one route's rows dropped (coverage test named it), the audit parameter
placed after the elevation guard (ordering test named it), one reason check removed (reason test
named it). Blind spots are listed in the `test_admin_audit.py` docstring: permission refusals are
not recorded, ARC-20's failed-commit path is not provoked, and the guard runs as a role that could
still drop the trigger.
L5 (2026-11-02), three mutants run one at a time, each caught. (1) Subscriptions back to
`CASCADE`/`NOT NULL`: erasure failed, both routes. Simulating the old cascade reproduced
`ck_payments_has_parent`, the bug ARC-22 fixes. (2) `interpretation_outputs` moved after `charts`:
the row-by-row check named the surviving row. (3) `device_tokens` dropped from the registry: the
coverage walk named the table. Blind spots are in the `test_account_deletion.py` docstring: personal
data copied into an unrelated column, external processors (listed, not verified), and pre-L5 audit
rows whose `details` or `payload_summary` hold an email the trigger will not let erasure rewrite.

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

*Ruled 2026-11-01 (delegated): confirmed as built.* One fact, one owner. Copying the provider's period
end into `entitlements` would create two answers to "does this user have access", and they would
drift on every renewal, retry and cancellation. Keeping access through a `pending` retry is the
customer-fair default. Razorpay retries a failed card for days, and cutting a paying user off
mid-retry for a bank's delay costs more trust than the few days of access it saves. The exposure
ends when `halted` or `cancelled` arrives, or when reconciliation finds the missing close.

**ARC-14. Products with nothing to deliver are not sold.** The Jadhagam report, Porutham report and Ask
top-up are seeded inactive: no report deliverable exists yet, and Ask credit spending is L7. Their
purchase, refund and credit paths are built and tested. Turning one on is a row update.

*Ruled 2026-11-01 (delegated): confirmed as built.* Taking money for something that cannot be handed
over is a refund queue and a consumer-protection complaint, not revenue. Each SKU's switch-on
condition: a report SKU goes active when its deliverable (generated report, download path, Tamil
copy reviewed) ships and has a test buying it end to end. The Ask top-up goes active only after L7
spends credits, so a bought credit can never sit unspendable. Each switch-on is its own reviewed
change that names the SKU, not a bulk "activate all".

**ARC-15. The webhook inbox stores ids, states and amounts, not the raw body.** The spec asks for
`raw_body`. Razorpay's payment entity carries the payer's email, phone and VPA, and the existing inbox
rule (A05) is "pick fields explicitly", so `minimal_payload` keeps only what reconciliation needs. A
test pins that contact details are absent. Reuses `webhook_events` (spec §0.3) instead of a new
`payment_events` table. A bad-signature request is stored under a generated id, never the id it
claimed, so a forger cannot pre-empt a real event's idempotency key.

*Ruled 2026-11-01 (delegated): confirmed as built; the spec is wrong and is corrected.* Data
minimisation (DPDP) beats debugging convenience. A raw body would put payer email, phone and VPA in
a table that is retained, backed up and read by admins, and none of that is needed. Nothing is lost:
any event's full entity can be re-fetched from Razorpay's API by the id the inbox keeps, under
Razorpay's access control instead of ours. Spec §0.3's `payment_events.raw_body` line now points
here. If a dispute ever needs a field outside `minimal_payload`, add that one field with a test,
never the whole body.

**ARC-16. No trial starts while the open beta is on.** The trial outranks the beta in `limits_for_user`
and its Ask allowance is smaller (3 vs 7 a day). A beta user who verified their email would lose
allowance and spend their one trial invisibly. Beta accounts get the ARC-12 grant instead. Accounts
created after the beta ends get the trial as designed.

*Ruled 2026-11-01 (delegated): confirmed as built.* A trial that lowers what the user already has is
a penalty with a "free" label, and spending someone's only trial while they cannot notice it breaks
the trial's purpose. The trial starts on email verification, so the consequences are: a beta account
that verifies during the beta never gets a trial and is covered by the ARC-12 launch grant. An
account that registers during the beta but verifies after it ends gets the trial normally. Launch
checklist item this creates: the ARC-12 grant must run in the same release that sets
`JOTHIDAM_OPEN_BETA=false`. Otherwise beta users drop to Registered with neither trial nor grant.

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
applied to dev at first; applied to vinaadi_dev with the rest of the chain on 2026-11-01, after the
`backup_20261101_1745.sql` backup (dev verified at `zz9d0e1f2a3b`, 4 birth_profiles intact).

**ARC-19. Append-only is a trigger now; the role split is a hosting step.** Spec L4 asks that the
app's DB role hold only `INSERT, SELECT` on the audit table. ARC-09 said to check first whether
migrations run as the app's role. In dev and CI they do (`slw_admin` owns the table and runs the
app), so a `REVOKE` there would revoke nothing. Production's role layout is not verified. *Decided (architect, 2026-11-01):* a
`BEFORE UPDATE OR DELETE` row trigger plus a `BEFORE TRUNCATE` statement trigger, which bind the
table owner too. UPDATE is allowed only to null `actor_user_id` (the FK's ON DELETE SET NULL, or no
admin account could be deleted), null `actor_email`, or set `target_id` to `erased:...`. Those are
the changes L5 erasure needs. Residual: the owning role can still `DROP TRIGGER`. **Launch
checklist:** run the app as a role that does not own the table (migrations keep the owner), then
`REVOKE UPDATE, DELETE, TRUNCATE ON admin_audit_log FROM <app role>`. **L5 note:** the D-13
retention job (audit log 3 years) cannot delete through this guard. It must run as the owner role,
in its own audited job.

**ARC-20. "Success" is written only after the handler's commit.** `get_db` commits after the response
is sent, so a row written by the handler could say "success" for a change the database then lost,
and the client would get a 200 for it. That is a pre-existing gap for every route relying on
`get_db`'s commit, not only admin ones. *Decided:* the audit dependency (function scope, so its exit
runs before the response) commits the handler's session, then writes "success". If that commit
fails, the row says "error" and the client gets a 500. This closes the gap for audited routes only.
The general `get_db` ordering is left as it is.

**ARC-21. Which actions need a reason.** Spec L4: "required for reveals and destructive actions".
*Decided:* the nine routes pinned in `tests/test_admin_audit.py` `_REASON_REQUIRED` (role grant and
revoke, MFA reset, erasure, suspend, flag set, reset and rollback, QA clear), plus any destructive
job run. Reinstating a suspended account needs one too: it undoes a decision, and a review asks why
just as often. Not required: elevation, MFA self-service, recompute jobs, the feedback reward
toggle, the broadcast refusal. The search text on `GET /admin/users` is not stored, since it is
usually an email address; the row records that a search happened and how many results came back.
Reveals do not exist yet (L9). When they ship, each takes `reason_required=True`.

**ARC-22. Subscriptions outlive the account, detached.** Found while building L5:
`subscriptions.user_id` was `NOT NULL ON DELETE CASCADE`, `payments.subscription_id` is `SET NULL`, and
`payments.ck_payments_has_parent` needs an order or a subscription. Deleting any user with a
subscription-only payment therefore failed the check and rolled back the whole delete, so
self-deletion was broken for every paying subscriber. *Decided (architect, 2026-11-02):* migration
`bc1d2e3f4a5b` makes `subscriptions.user_id` nullable with `SET NULL`, matching `orders`. Erasure
detaches the row and the spec's "financial records kept, detached" now holds. Access checks filter on
`user_id`, so a detached row grants nothing. The downgrade refuses while a detached row exists, since
restoring `NOT NULL` would mean deleting accounting records.

**ARC-23. When erasure refuses.** *Decided:* 409, with nothing touched, in three cases.
(1) A Razorpay subscription that is active and not set to cancel. Erasing would not stop Razorpay from
charging, and the person could no longer sign in to cancel. The person cancels at the end of the
period, then deletes (code `ERASURE_BLOCKED_BY_SUBSCRIPTION`, bilingual message on web). App-store
subscriptions cannot be cancelled from here and never report `cancel_at_period_end`, so they do not
block erasure. The person is told to cancel in the store (`app_store_subscription` follow-up).
(2) An account holding an admin role: remove the role first, so the last-owner guard is never bypassed
(`ERASURE_BLOCKED_BY_ADMIN_ROLE`). (3) The console erasing its own operator: the audit row would name an
actor that no longer exists.

**ARC-24. A newsletter sign-up under the same email is erased too.** It is a separate sign-up with
separate consent, but it is the same person's address. Erasure fails safe towards removing it. A
person who wants the newsletter can sign up again. The match ignores case.

**ARC-25. External processors are manual steps, listed.** PostHog, Sentry, Anthropic, the SMTP
provider, Zoho Desk, Razorpay and app-store subscriptions each have a registry entry with the step to
take. Erasure returns the list, the console shows it, and the audit row records it. Automating PostHog
person deletion needs a server-side PostHog key the app does not hold. That is a later change.

**ARC-26. How an erased person appears afterwards.** The tombstone keeps `user_id`, because replay after
a restore needs it. Its `id` is the pseudonym (`erased:<id>`) that every audit row about the person now
carries. The self-erasure audit row has `actor_role = "self"` and no actor, IP or user agent, since
those would be the erased person's. **Retention check:** D-13 sets 12 months for the erased-account
record. Tombstones must outlive the longest backup retention, or a restore of an older backup brings
the person back with nothing to replay. Confirm the backup retention when the legal review settles D-13.

**ARC-27. What an export contains.** Every registry store marked exportable, read through the ORM so
encrypted columns come out decrypted. It leaves out credentials and hashes (password, refresh and reset
tokens, porutham share tokens, push tokens, admin TOTP and recovery codes), recomputable derivations
(planet positions, dasha, varga, daily scores) and other people's rows that name the person. Audit
rows about the person are exported as action, outcome and date only, without other admins' identities.
The console export is a reveal, so it is elevated, needs a reason and is audited with per-store counts
(ARC-21). Self-export needs no reason: it is the person's own data.
