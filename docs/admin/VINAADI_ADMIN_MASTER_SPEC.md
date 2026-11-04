# Vinaadi Admin, Payments and Privacy — Master Specification

Version 1.0 · 2026-11-01 · Owner: Senthil · Suggested repo path: `docs/admin/VINAADI_ADMIN_MASTER_SPEC.md`

This is the single source of truth for the admin system, payments, entitlements and privacy work.
It supersedes the separate notes in the 2026-10-30 admin audit (ADM-01 to ADM-09) and the
2026-11-01 addendum (ADM-10 to ADM-37). Those IDs are kept so findings stay traceable.

Situation: Vinaadi is not live. About 20% of product work remains (rule validation, UX fixes,
Ask Vinaadi). Web launch target is about 30 days out (early December 2026). Mobile follows about a
month later. Payments are live from launch day.

---

## 0. Instructions for Claude Code (read first)

1. **Read `CLAUDE.md` and this spec in full before changing anything.**
2. **Verify before you build.** The audit was written from code reading only. Before starting a work
   package, write `docs/admin/VERIFICATION.md` with one row per ADM finding the package touches:
   `ADM-xx | confirmed / partly / not found | file:line | note`. Two findings are explicitly
   unverified: ADM-01's `interpretation_outputs` foreign key behaviour, and ADM-09's flag storage.
3. **Reuse what exists.** Extend existing tables, services, the elevation helper, the scheduler and the
   notification outbox. Do not create a parallel implementation of anything that already exists.
4. **One work package per pull request**, in the order of section 4. Each PR includes the acceptance
   tests listed for that package, a migration (if any), and typed wrappers in `packages/shared/src/api/`
   for every new admin endpoint.
5. **Never touch doctrine or calculation code** as part of this work. Doctrine changes need a recorded
   ruling (§16–§18 of the doctrine process).
6. **Stop and report, don't guess,** when: the code contradicts a decision in section 1; a change would
   alter what an existing user sees about their chart; or an item is marked `PENDING-LEGAL`.
7. **No new services or infrastructure** beyond what section 3 lists. Vinaadi stays a modular monolith.

---

## 1. Decision log

Each decision has an owner rationale. "Revisit" names the signal that would reopen it.

| ID | Decision | Rationale | Revisit when |
|---|---|---|---|
| D-01 | Web launch in ~30 days; mobile ~30 days later | Founder plan | — |
| D-02 | Work is gated by launch events, not phases: **L** (before launch), **L+30**, **M** (before mobile), **Later** | Admin work must not delay the product | — |
| D-03 | Build a thin core in-house; buy commodity tools (section 3) | Only identity, personal data, entitlements and doctrine are Vinaadi-specific | A vendor bill exceeds the cost of building |
| D-04 | **Razorpay** is the payment gateway: Orders API for one-time purchases, Subscriptions for recurring (UPI AutoPay + cards) | Widely used Indian checkout, no annual fee, one provider for both payment types; Cashfree is ~equal and kept as a negotiation fallback | Monthly volume justifies negotiating rates |
| D-05 | **Vinaadi's own `entitlements` table is the source of truth for access.** Razorpay webhooks feed it at launch; RevenueCat feeds it for app-store purchases at mobile launch | RevenueCat has no native Razorpay support (verify); it earns its place only for Apple/Google billing | — |
| D-06 | Access states: **Guest** (unsigned), **Free**, **Trial**, **Premium**. One-time purchases ("unlocks") stack on top of any signed-in state | Matches founder's model: unsigned, signed, paid, plus pay-per-service | — |
| D-07 | Trial = 7 days of Premium, starts automatically when the account is created (basic profile complete), **no payment mandate required**. Reminders on day 5 and day 7. One trial per account | Lowest friction for a new brand; mandate-first trials can be tested later | Trial-to-paid below target after 60 days → test a mandate trial |
| D-08 | Prices, plans and SKUs are **data** (`products` table), not code | Prices will change; no deploy needed | — |
| D-09 | Guests may generate a chart. Guest birth details are stored server-side against a guest session, **auto-deleted after 30 days** unless claimed by signing up. Guests see the privacy notice before entering details | Birth details are personal data even without an account | PENDING-LEGAL review |
| D-10 | Consent purposes: **P1 Service** (required); **P2 Updates and astro alerts** (optional, off); **P3 Product analytics** (optional, off); **P4 Help improve Ask Vinaadi** (optional, off). No pre-ticked boxes. Withdrawal is as easy as granting (one toggle in settings) | DPDP: specific, itemised, freely given consent; pre-ticked boxes invalid | PENDING-LEGAL review |
| D-11 | Core business metrics (active users, retention, funnel, revenue) are computed **server-side from Vinaadi's own database** as part of operating the service (P1). PostHog receives an identified user only with P3 consent; otherwise PostHog runs anonymous / cookieless with no user ID | Keeps metrics honest without depending on an optional consent | PENDING-LEGAL review |
| D-12 | Account holders must be **18+** (self-declaration at signup). Children appear only as family members added by a parent, flagged `is_minor` from date of birth, and are **excluded from every marketing segment** | DPDP treats under-18 as a child and requires verifiable parental consent | PENDING-LEGAL review |
| D-13 | Retention periods are **settings**: guest charts 30 days; Ask Vinaadi transcripts 90 days; erased-account retention record 12 months; audit log 3 years | Lets the lawyer's answer become a config change | PENDING-LEGAL review |
| D-14 | Admin roles at launch: **owner** and **support** only. Others (ops, privacy, viewer, astrologer) are defined in code but unassigned until needed | Founder plus up to 2 support staff | Astrologer joins |
| D-15 | Admin MFA = **TOTP, mandatory** for any admin role, with 10 single-use recovery codes. Passkeys later | Simple, works for Google-sign-in admins too | — |
| D-16 | Ask Vinaadi: provider as currently integrated (verify; assumed Anthropic). Transcripts encrypted at rest, kept 90 days. Answers auto-flagged on sensitive topics are reviewable for safety; other answers only with P4 consent. Birth details never sent to tracing tools | Safety review without broad human access to private questions | PENDING-LEGAL review of safety-review basis |
| D-17 | Messaging at launch is **transactional only**: verification, password reset, receipts, trial ending, renewal failed, and the user's own enabled alerts. **Broadcast is disabled** until the consent-aware outbox version ships (L+30) | ADM-02 risk removed at zero cost | — |
| D-18 | Refunds: one-time services refunded on technical failure or non-delivery; subscriptions can be cancelled anytime and stop renewing, no partial refunds. Refunds are issued from the Razorpay dashboard at launch; the console shows status | Simple and defensible; the gateway requires a published refund policy | Complaint volume |
| D-19 | Support channel at launch: a support email routed into **Zoho Desk Free** (3 agents) | Free, Chennai-built, INR billing | > 3 agents |
| D-20 | Mobile billing (Gate M): App Store and Google Play billing through **RevenueCat**, feeding the same entitlements. Whether the apps sell in-app or only show content is decided at Gate M | Store billing is largely unavoidable; Play's India alternative billing cuts the fee by only 4% | — |

### Items pending legal review (`PENDING-LEGAL`)

Build these so the answer is a setting, not a rewrite. The founder books a one-time privacy-lawyer
review before **13 May 2027**, when Rule 3 (notice) and the other core rules come into force.

1. Is the Service purpose (P1) a sufficient basis for server-side business metrics (D-11)?
2. Does the parent-adds-child family flow satisfy verifiable parental consent (D-12)?
3. "Erase from product, keep a minimal encrypted record for 12 months" versus Rule 8(3)'s one-year retention of personal data and logs (D-13).
4. Safety review of flagged Ask Vinaadi answers without P4 consent (D-16).
5. Guest data handling and 30-day retention (D-09).

---

## 2. Principles every package follows

1. **IDs out, personal data in.** Third-party tools (PostHog, Sentry, LLM tracing, Zoho Desk) receive an opaque user ID, language and plan state. Never name, email, phone, birth date, time or place, chart content, or question text. Sentry scrubbing and PostHog property filters enforce this in code.
2. **One service per sensitive action.** Erasure, export, entitlement changes, messaging and audit each have exactly one service. Admin routes, user routes and jobs all call it.
3. **Server decides, always.** Permissions, entitlements and payment success are decided server-side. The client's payment callback is never trusted alone.
4. **Nothing slow inside a request.** Webhook processing, bulk actions, exports and job triggers are enqueued; the request returns an ID.
5. **Every privileged action is audited** with actor, action, target, reason, IP, outcome and a per-table count where relevant.
6. **Every number has a definition** (section 8), a timezone (IST) and an as-of time on screen.
7. **Settings are data with history.** Flags, retention periods, prices and quotas live in the database; every change records who, when, why, old and new.

---

## 3. Build versus buy

| Area | Tool (buy or already in use) | Built in-house (thin) |
|---|---|---|
| Product analytics, funnels, experiments, surveys | PostHog | Server-side core metrics (D-11), event emission |
| Product rollout flags | PostHog flags | Kill switches, doctrine flags, retention settings (must work if PostHog is down) |
| Errors | Sentry | PII scrubbing config |
| Uptime | Any uptime monitor with alerts (founder picks) | `/health` endpoint |
| Payments | Razorpay | Checkout, webhooks, entitlements, reconciliation |
| App-store billing (Gate M) | RevenueCat | Webhook into the same entitlements |
| Accounting, GST invoices | Zoho Books or the founder's CA | Store tax fields on each payment |
| Support tickets | Zoho Desk Free | User 360 and support actions in the console |
| AI tracing and cost | PostHog LLM analytics | Budget caps, quotas, kill switch, prompt version |
| Push delivery | FCM (web push now, native later) | Consent, outbox, quiet hours |
| Email delivery | Existing provider in repo | Templates (Tamil + English) |
| Privacy, RBAC, MFA, audit | — | All |
| Astrology governance | — | All |

Do not use internal-tool builders (Retool, Appsmith) for anything touching user data.

---

## 4. Gate L — before launch (next ~30 days)

Order matters: L1 and L2 block launch-day revenue and legality; L3 and L4 must exist before the
first real user so history is trustworthy from row one.

### L1. Payments and entitlements (Razorpay)

**Goal.** Users can buy a subscription or a one-time service; access is granted exactly once, revoked
correctly, and every rupee is traceable.

**Data model** (extend existing `subscriptions` and `WebhookEvent`/`webhook_events` where they exist):

- `products`: `sku` (pk), `kind` (`subscription` | `one_time`), `name_en`, `name_ta`, `price_inr_paise`, `billing_period` (null | `month` | `year`), `entitlement_grants` (object, key → days; one-time SKUs only, ARC-43), `credit_grants` (object),
  `razorpay_plan_id` (subscriptions), `active`, timestamps.
- `orders`: `id`, `user_id`, `sku`, `provider` (`razorpay`), `provider_order_id` (unique), `amount_paise`, `currency`, `status` (`created` | `paid` | `failed` | `refunded` | `partially_refunded`), `tax_paise` (nullable), `invoice_number` (nullable), timestamps.
- `payments`: `id`, `order_id` or `subscription_id`, `provider_payment_id` (unique), `method` (upi | card | netbanking | wallet | other), `amount_paise`, `fee_paise`, `tax_on_fee_paise`, `status`, timestamps.
- `subscriptions` (extend): `provider` (`razorpay` | `revenuecat`), `provider_subscription_id` (unique), `sku`, `status` (`created` | `authenticated` | `active` | `pending` | `halted` | `cancelled` | `completed` | `expired`), `current_period_start`, `current_period_end`, `cancel_at_period_end`.
- `entitlements`: `id`, `user_id`, `key` (e.g. `premium`, `porutham_report`), `source` (`trial` | `subscription` | `purchase` | `grant`), `source_id`, `starts_at`, `ends_at` (nullable), `revoked_at`, `revoked_reason`, `granted_by` (admin user for grants). Effective access = union of unrevoked rows active now.
- `payment_events` (built as the existing `webhook_events` inbox): `provider`, `event_id` (unique — Razorpay `X-Razorpay-Event-Id`), `event_type`, `minimal_payload` (ids, states and amounts only — never `raw_body`, which carries payer email, phone and VPA; ARC-15, plan §8), `signature_valid`, `received_at`, `processed_at`, `outcome`, `error`.
- `refunds`: `provider_refund_id` (unique), `payment_id`, `amount_paise`, `status`, timestamps.

**Flows.**

1. *One-time purchase.* Server creates a Razorpay order from `products` (never from a client-sent amount) → Checkout → client posts `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature` → server verifies the HMAC (order_id + "|" + payment_id, key secret) and shows "processing" → the **webhook** (`payment.captured` / `order.paid`) grants the entitlement. If the webhook is late, the server confirms by fetching the order from the Razorpay API.
2. *Subscription.* Server creates a Razorpay subscription from the `razorpay_plan_id` → user authorises (UPI AutoPay or card) → `subscription.activated` / `subscription.charged` extend the `premium` entitlement to `current_period_end`; `subscription.pending` keeps access during retries; `subscription.halted`, `cancelled`, `completed`, `expired` end it at period end.
3. *Trial.* Account creation inserts a `trial` entitlement for `premium` with `ends_at = now + 7 days`. A job sends reminders at day 5 and day 7. Trial never needs a payment.
4. *Refund.* `refund.processed` marks the refund; one-time entitlements tied to a fully refunded payment are revoked with reason `refunded`.
5. *Guest.* No purchases for guests; the paywall asks them to sign up first.

**Webhook endpoint** `POST /api/payments/razorpay/webhook`: verify `X-Razorpay-Signature` (HMAC-SHA256 over the **raw** body with the webhook secret) → insert into `payment_events` (duplicate `event_id` = return 200 and stop) → enqueue processing → return 200 fast. Processing and entitlement writes happen in one transaction with the event marked processed.

**Subscribe to:** `payment.captured`, `payment.failed`, `order.paid`, `refund.created`, `refund.processed`, `refund.failed`, `subscription.authenticated`, `subscription.activated`, `subscription.charged`, `subscription.pending`, `subscription.halted`, `subscription.cancelled`, `subscription.completed`, `subscription.paused`, `subscription.resumed`, `subscription.updated`.

**Reconciliation job** (nightly, IST 03:30): fetch Razorpay payments, refunds and subscriptions for the last 3 days via API; compare with local rows; write mismatches to an `ops_queue` (see L+30 home queue; at launch, the console lists them on the Payments page).

**Paywall.** Every paywall view carries `trigger_feature` (porutham, ask, family, report SKU…) for analytics.

**Acceptance.**
- A replayed webhook (same `event_id`) grants nothing twice.
- A webhook with a bad signature is stored with `signature_valid=false`, grants nothing, returns 400.
- A client-only success callback without a webhook or API confirmation grants nothing.
- Subscription lifecycle test walks created → active → charged ×2 → halted → access ends at period end.
- Refund of a one-time purchase revokes its entitlement.
- Amount is always taken from `products`; a tampered client amount is ignored.
- Reconciliation flags a payment present in Razorpay but missing locally.

### L2. Privacy notice, consent and guest data

**Goal.** Every person, signed in or not, sees an itemised notice before giving birth details, and every optional use has its own consent.

- **Notice** (separate screen or sheet, plain language, Tamil and English with a language switch): itemised list of data collected (name, email, birth date, time, place, family members' birth details, questions asked to Ask Vinaadi, payment records); each purpose P1–P4 with what it enables; how to withdraw consent; how to exercise rights; grievance contact; how to complain to the Data Protection Board.
- **Consent ledger** `consent_records`: `subject_id` (user or guest session), `purpose`, `granted` (bool), `notice_version`, `language`, `channel` (web/android/ios), `ip`, `created_at`. Append-only; current state = latest row per purpose.
- **Signup:** 18+ self-declaration checkbox (unticked) + P1 acceptance + optional P2–P4 toggles (all off).
- **Settings page:** each purpose as a toggle; withdrawal takes effect immediately (P3 off → PostHog reset to anonymous; P2 off → excluded from all non-transactional messages).
- **Guest sessions** `guest_sessions`: `id`, `created_at`, `claimed_by_user_id`, `expires_at` (= created + retention setting). Guest charts reference it. On signup the session is claimed and its data moves to the user. A daily job hard-deletes unclaimed expired sessions and their charts.
- **Minors:** family members whose DOB gives age < 18 get `is_minor = true`; segment builders exclude them and their parent's marketing never references them.

**Acceptance.** No birth details stored before a P1 record exists for that subject. Guest data older than the retention setting is gone after the daily job. Toggling P3 off stops identified PostHog events in the next request. A minor family member never appears in any segment query.

### L3. Admin access hardening (ADM-04, ADM-10, Part C.1 minimum)

- TOTP enrolment required before any admin route responds (`403 mfa_required`); recovery codes hashed; elevation uses TOTP (works for Google-sign-in admins).
- `JOTHIDAM_ADMIN_EMAILS` only seeds the first **owner** at startup for an existing, **verified** account, then is ignored. Every role grant/revoke is an audited, elevated owner action.
- Roles in code: `owner`, `support` (plus defined-but-unassigned `ops`, `privacy`, `viewer`, `astrologer`). Each route declares `require_permission(...)`. Permission map in section 6.
- Admin session: 8 h absolute, 30 min idle. New admin sign-in emails the owner (device, IP).
- Guards: cannot suspend yourself or remove the last owner.

**Acceptance.** Generated permission-matrix test (route × role → allow/deny) with a committed snapshot. Admin without TOTP gets 403. Registering an email listed in `JOTHIDAM_ADMIN_EMAILS` grants nothing.

### L4. Audit log (ADM-03, ADM-11)

- Every admin mutation and every personal-data read in the console writes: actor id + email, role, action, target type/id, reason (required for reveals and destructive actions), IP, user agent, outcome, details JSON (per-table counts for erasure).
- Application DB role has `INSERT`, `SELECT` only on the audit table. Each row stores `prev_hash` and `row_hash`; a nightly job verifies the chain and alerts on a break.
- Console audit page: Who column, IP, filters (actor, action, target, date), CSV export (owner only, itself audited).
- Fix the stragglers: `DELETE /qa/regressions` and `PATCH /feedback/{id}/reward` become audited; QA delete needs elevation.
- Erasure pseudonymises `target_id` in old audit rows (keyed hash) instead of deleting them.

**Acceptance.** Every non-GET route depending on an admin dependency writes an audit row with non-null actor (test enumerates routes). App DB role cannot UPDATE/DELETE audit rows. Chain verifier detects a tampered row.

### L5. Data registry, erasure and export (ADM-01, ADM-12, ADM-13 core)

- `app/privacy/registry.py`: one entry per store holding personal data — every user-owned table, plus PostHog, Sentry, LLM provider logs, Zoho Desk, Razorpay (record retained as a financial record), email provider, FCM tokens, object storage, caches. Each entry: what it holds, `export(user_id)`, `erase(user_id)`, retention.
- `erase_user(user_id, actor, reason)` and `export_user(user_id, actor)` walk the registry. Both `DELETE /auth/me` and the admin route call `erase_user`; admin erasure has the same effect as self-delete (decision). Financial records (orders, payments, refunds) are kept as legally required accounting records but detached from personal fields.
- Erased user IDs go to a `tombstones` table; any backup restore replays it.
- Export produces JSON plus a readable summary (Tamil/English).
- `privacy_requests` table: type (access, correction, erasure, withdrawal, grievance), subject, received_at, due_at, status, assignee, evidence, closed_at. Console page lists open requests with due dates.

**Acceptance.** Test creates one row in every user-owned table (and stubs external processors), erases via each route, asserts zero personal rows remain and per-table counts are audited. CI check fails when a model with a `user_id` FK is missing from the registry.

### L6. Analytics instrumentation (ADM-05, ADM-06 capture)

- `users.last_seen_on` (date, IST), `last_platform`, `last_language`; written at most once per user per day (skip when the session already carries today's date).
- Capture `utm_source/medium/campaign`, `referrer`, `referral_code` at first visit; persist on the guest session and copy to the user at signup.
- Server-side daily rollup job writes `daily_metrics` (definitions in section 8).
- PostHog events per section 7, gated by D-11.
- Admin Overview tiles read only `daily_metrics`; each tile shows definition + as-of. Label anything still derived from chart generation as "chart generations".

**Acceptance.** A test asserts no PostHog payload contains forbidden fields (section 7). Rollup for a fixture day matches hand-computed values.

### L7. Ask Vinaadi guard rails

- Every answer stores `prompt_version`, `model`, `input_tokens`, `output_tokens`, `cost_paise`, `latency_ms`, `flags` (sensitive-topic categories).
- Settings: daily spend cap (whole product), per-user daily quota by access state, per-feature kill switch. Over cap → friendly "come back tomorrow" message, owner alerted.
- Sensitive-topic flags (death, illness, pregnancy, children's health, divorce, self-harm, money loss): answer follows the safety prompt; flagged items enter the review list (L+30 builds the review UI).
- Transcripts encrypted at rest; deleted after the retention setting; birth details never sent to tracing.

**Acceptance.** Cap reached → no further LLM calls that day (test with a fake clock). Kill switch off → endpoint returns the maintenance message without calling the provider.

### L8. Messaging safety (ADM-02 interim)

- Disable `POST /admin/notify/broadcast` (return 410 with a message) until L+30.
- All sends go through the existing outbox with idempotency keys.
- Prune device tokens the push service reports as unregistered.
- Quiet hours 21:00–08:00 IST for anything non-urgent.

### L9. Minimal support console (ADM-08, ADM-14, ADM-24 core)

- Search by email, user ID, phone (if collected), Razorpay order/payment/subscription ID.
- User page: account (status, created, last seen, language, platform, acquisition), access state and entitlements with sources, orders/payments/subscriptions/refunds, consent state, family members (relation + **masked** birth data: year and district only), recent errors (Sentry link by user ID), notes.
- Actions: send password-reset link; force logout everywhere (`token_version` bump); grant/revoke courtesy entitlement (support: max 30 days, reason required); suspend/unsuspend (owner, elevated); reveal full birth data (reason required, audited); add note.

**Acceptance.** Support role can do the support actions and nothing in section 6 marked owner-only. Every reveal and action has an audit row with reason.

### L10. Operations minimum (ADM-07, ADM-09, ADM-19, ADM-22 core)

- Feature flags and kill switches persisted in the database (fixes per-process drift); change history with reason; rollback.
- Kill switches: Ask Vinaadi, payments checkout, push, guest charts, signups. Maintenance banner (Tamil + English).
- Health tab reads `SchedulerHeartbeat`; manual job triggers enqueue instead of running inline; `job_runs` table (job, trigger, actor, start, end, outcome, summary).
- QA regression store persisted (not in memory).
- Backups: confirm automated backups and point-in-time recovery with the hosting provider; perform one restore into a scratch database; record date and result on the Health tab.
- Environment bar: PROD/STAGING on every admin page; staging never holds real users' birth data.

### L11. Runbooks (documents, `docs/runbooks/`)

One page each: personal-data breach (notify affected users and the Board; detailed report within 72 hours), payment dispute/refund, privacy request handling, Ask Vinaadi harmful answer, push or email outage, wrong-prediction complaint.

---

## 5. Gate L+30, Gate M and Later

### L+30 (first month after launch)

| Item | Source |
|---|---|
| Admin home work queue: privacy requests by due date, payment mismatches, failed jobs, flagged Ask answers, feedback older than 48 h | ADM-23 |
| Ask Vinaadi review UI: astrologer/owner verdict (correct, doctrinally wrong, harmful), feeds regression set, prompt rollback | ADM-25 |
| Consent-aware broadcast through the outbox: segment, preview, test-to-self, schedule, typed-count confirmation, cancel window, delivery counts | ADM-02, ADM-16 |
| Zoho Desk link from user page; feedback reply and resolve | ADM-26 |
| Daily owner digest email (08:00 IST): signups, active users, trials started/converted, revenue (gross, fees, net), refunds, Ask spend, incidents, open privacy requests | Section 6 of addendum |
| Alerts: job failure, webhook failure rate, payment mismatch, Ask spend > 80% of cap, backup age > 24 h, privacy request due in 7 days | ADM-21 |
| Split the 1,650-line console into `web/app/admin/<section>/page.tsx` routes, gated per role server-side | Part C.2 |

### Gate M (before the mobile app)

RevenueCat for App Store and Google Play purchases → same `entitlements`; decide in-app selling versus web-only purchase; native push tokens; minimum supported app version and force-update flag; mobile analytics consent flow.

### Later (once real usage exists)

Lifecycle journeys and astro-event campaigns (ADM-31, ADM-32), acquisition economics (ADM-33), referral ledger and fraud checks (ADM-34), paywall experiments (ADM-35), feedback theme clustering (ADM-36), experiment registry (ADM-37), dosham/yoga prevalence dashboards, countersign queue, content review workflow (ADM-27, ADM-28), runbooks inside the console (ADM-29), phone layout for the owner (ADM-30), view-as-user (ADM-15), WhatsApp channel, additional roles.

---

## 6. Permission map at launch

| Permission | owner | support |
|---|---|---|
| `overview.read` | ✓ | ✓ |
| `users.search`, `users.read_masked` | ✓ | ✓ |
| `users.reveal_birth_data` (reason, audited) | ✓ | ✓ |
| `users.reset_link`, `users.force_logout`, `users.note` | ✓ | ✓ |
| `entitlements.grant` (support ≤ 30 days) | ✓ | ✓ |
| `entitlements.revoke` | ✓ | — |
| `users.suspend` (elevated) | ✓ | — |
| `payments.read` | ✓ | ✓ |
| `privacy.requests.read` | ✓ | ✓ |
| `privacy.export`, `privacy.erase` (elevated) | ✓ | — |
| `audit.read`, `audit.export` | ✓ | — |
| `flags.write`, `killswitch.write`, `settings.write` (elevated) | ✓ | — |
| `jobs.trigger` | ✓ | — |
| `roles.grant` (elevated) | ✓ | — |
| `ask.review` | ✓ | — |

---

## 7. Event taxonomy (PostHog)

Names are `snake_case`. **Allowed properties:** opaque `user_id` (only with P3), `language`, `platform`, `access_state`, `sku`, `kind`, `amount_inr` (integer), `trigger_feature`, `feature`, `is_first`, `rating`, `reason_code`, `utm_*`, `has_referral`.
**Forbidden everywhere:** name, email, phone, birth date/time/place, chart content, family member details, question or answer text, free-text feedback.

| Event | Key properties |
|---|---|
| `guest_chart_started`, `guest_chart_generated` | `language` |
| `signup_started`, `signup_completed` | `method` |
| `profile_completed` (account created) | — |
| `trial_started`, `trial_ended` | `converted` |
| `chart_generated` | `is_first` |
| `feature_opened` | `feature` (today, calendar, porutham, family, ask, numerology, panchangam, dasha) |
| `ask_question_submitted`, `ask_answer_rated` | `rating` |
| `paywall_viewed` | `trigger_feature` |
| `checkout_started`, `payment_succeeded`, `payment_failed` | `sku`, `kind`, `amount_inr`, `reason_code` |
| `subscription_started`, `subscription_renewed`, `subscription_cancelled`, `subscription_halted` | `sku` |
| `unlock_used` | `sku` |
| `notification_opened` | `kind` |
| `consent_changed` | `purpose`, `granted` |

---

## 8. Metric definitions (all dates in IST)

| Metric | Definition |
|---|---|
| Active user (day) | Signed-in user with `last_seen_on` = that day |
| DAU / WAU / MAU | Distinct active users in the day / trailing 7 days / trailing 30 days |
| Activation | Account created and first chart viewed within 24 h |
| D1 / D7 / D30 retention | Share of a signup-day cohort active on day 1 / 7 / 30 after signup |
| Trial conversion | Trials ended in period that became Premium within 3 days of trial end ÷ trials ended |
| MRR | Sum of active subscriptions' price normalised to a month, excluding GST |
| Gross / fees / net revenue | Captured payments; gateway fee + GST on fee; gross − fees − refunds |
| Ask spend | Sum of `cost_paise` per day |
| Guest conversion | Guest sessions claimed by signup ÷ guest sessions created |

---

## 9. Launch acceptance checklist (Gate L is done when all pass)

- [ ] Permission-matrix, MFA, audit-coverage, erase-everything and registry CI tests green
- [ ] Webhook idempotency, bad-signature, tampered-amount and subscription-lifecycle tests green
- [ ] Live test purchase and refund completed end to end on production with a real UPI payment
- [ ] Notice reviewed in Tamil and English; no birth data stored without a P1 record
- [ ] Guest-data purge job ran in staging and deleted expired fixtures
- [ ] PostHog payload test green; Sentry scrubbing verified with a test error
- [ ] Ask Vinaadi cap and kill switch tested
- [ ] Broadcast endpoint returns 410
- [ ] Restore drill done and recorded
- [ ] Runbooks committed
- [ ] Owner TOTP enrolled; recovery codes stored offline

---

## 10. Founder actions (not code)

1. **This week:** open the Razorpay account and start KYC (entity, PAN, bank, GST if registered). Enable Subscriptions and UPI AutoPay. The live site must show the pages below for approval.
2. Publish **Terms, Privacy Notice (Tamil + English), Refund & Cancellation, Contact & Grievance** pages. Name a grievance contact.
3. Set launch prices for the subscription plans and each pay-now service (they go into `products`).
4. With your CA: GST registration for the selling entity, invoice format, and how tax is shown on receipts.
5. Book a privacy-lawyer review before 13 May 2027 with the `PENDING-LEGAL` list in section 1.
6. Create the support email and Zoho Desk Free account.
7. Confirm automated backups and point-in-time recovery with the database host.
8. Choose an uptime monitor and point it at `/health`.

---

## 11. Traceability

| Package | Audit IDs |
|---|---|
| L1 | Part B revenue/finance, ADM-35 (paywall trigger capture) |
| L2 | ADM-13 (consent ledger), ADM-14 |
| L3 | ADM-04, ADM-10, Part C.1 |
| L4 | ADM-03, ADM-11 |
| L5 | ADM-01, ADM-12, ADM-13 |
| L6 | ADM-05, ADM-06, ADM-18 |
| L7 | ADM-25 (data), Part B finance (LLM cost) |
| L8 | ADM-02 (interim) |
| L9 | ADM-08, ADM-14, ADM-24 |
| L10 | ADM-07, ADM-09, ADM-19, ADM-20, ADM-22 |
| L11 | ADM-29 (as documents) |

---

## Sources

- Razorpay webhooks: signature, idempotency via `x-razorpay-event-id` — https://razorpay.com/docs/us/api/payments/recurring-payments/webhooks
- Razorpay India pricing and Subscriptions fee — https://razorpay.com/blog/?p=26027
- Cashfree payment gateway charges — https://www.cashfree.com/en/payment-gateway-charges/
- RevenueCat pricing (free to $2,500 MTR, then 1%) — https://freetier.co/directory/products/revenuecat
- Google Play alternative billing in India (fee reduced by 4%) — https://support.google.com/googleplay/android-developer/answer/13306652
- DPDP Rule 3 notice; in force 13 May 2027 — https://dpdp.myndsolution.com/wiki/rules/rule-3/
- DPDP Rules: one-year retention under Rule 8(3), 72-hour breach report — https://www.barandbench.com/view-point/meity-notifies-final-digital-personal-data-protection-rules-2025
- Vinaadi admin audit 2026-10-30 and addendum 2026-11-01 (ADM-01 to ADM-37)
