# Admin system audit (2026-10-30)

Two lenses: a product owner asking "can the people who run Vinaadi run it from here?", and an
architect asking "is what exists safe and correct?". "Admin" here means anyone at the top who
needs the console: the owner/CEO, an operations admin, a support person, the astrologer who
owns doctrine, and whoever answers privacy and payment questions.

**Scope.** `app/api/admin.py`, `app/api/admin_analytics.py`, the admin-gated routes in
`feedback.py` and `qa.py`, `app/core/auth.py` (admin + elevation), `audit_service.py`,
`scheduler.py`, and the web console (`web/app/admin/page.tsx`, `web/components/admin-console.tsx`).
Read from code; nothing was run against a live database. Prefix **ADM**.

## Verdict

The **security core is good**, better than most products at this stage: admin authority is
server-side, the browser holds no admin secret, destructive actions need a fresh password
("elevation") bound to the user and their token version, and every write is audited with an actor.

The **product surface is thin**. It is an engineer's operations console (11 tabs: overview,
health, users, analytics, calibration, feedback, jobs, push, flags, audit, privacy). It does not
yet serve a CEO (no revenue, no real active-user or retention figure, no funnel), a support person
(cannot see what a user saw, cannot help with login or subscription), the astrologer (doctrine is
code-only by design, but there is no review queue), or a compliance officer (erasure is partial,
broadcast ignores consent).

| Area | State |
|---|---|
| Authentication, elevation, audit writes | Solid |
| User lookup and suspension | Basic: email search only, no detail beyond counts |
| Business metrics | Misleading: "active" means "generated a chart" |
| Revenue and subscriptions | Absent |
| Support tooling | Absent |
| Privacy (DPDP) operations | Partial and inconsistent with self-delete |
| Communications | Unsafe: broadcast ignores consent and the outbox |
| Roles and permissions | One tier: admin or not |
| Content and doctrine operations | Absent (flags only) |

---

## Part A: defects in what exists

### ADM-01 (P1). Admin "GDPR erasure" leaves most personal data behind

`DELETE /admin/users/{id}/data` deletes birth profiles, charts, family vaults, members, daily
scores and relationship alerts. It leaves the **user row (email)**, journal entries,
retrospectives, preferences, user contexts, feedback, prediction log, notification preferences
(including the **FCM device token**), subscriptions, Ask Vinaadi usage, life-focus events and
numerology name sessions. The user's own `DELETE /auth/me` deletes the user and lets the cascades
run, and also clears `interpretation_outputs`, which the admin path does not touch (if that table
has a non-cascading FK to `charts`, the admin delete may also fail outright: **not verified**).

So the same DPDP request gives two different results depending on who presses the button, and the
one labelled "erasure" in the admin console is the weaker. The audit row is also hard to defend:
it records `profiles=,charts=` only.

**Fix.** One `erase_user(user_id, actor)` service called by both routes. Write a per-table count
into the audit row. Decide separately whether admin erasure removes the account or only its
data, and name the button for what it does.
**Acceptance.** A test that creates one row in every user-owned table, erases through each route,
and asserts zero rows remain. It fails on today's admin route.

### ADM-02 (P1). Broadcast push ignores consent and bypasses the delivery outbox

`POST /admin/notify/broadcast` with no target loads **every** `UserNotificationPreference` row and
sends to every device token. It does not check any opt-in (there is no "announcements" consent at
all; `morning_alert_enabled` etc. are per-feature), skips nothing for suspended or soft-deleted
users, and calls `send_push_to_token` in a loop **inside the HTTP request**. The product already
has a durable outbox (`notification_outbox` job, `NotificationDelivery`) with retries and delivery
records; broadcast does not use it.

**Why it matters.** Under DPDP, a promotional push to someone who never agreed to one is a
complaint. Operationally, at a few thousand tokens the request times out half-way and nobody knows
who got it; pressing again double-sends.

**Fix.** Broadcast writes intents to the outbox and returns a broadcast id. Add a
`announcements_opt_in` preference (default off), exclude suspended/deleted users, and add
segment, preview, test-send-to-self and schedule. Show delivery counts from `NotificationDelivery`.

### ADM-03 (P1). The audit log records who acted, then hides it

`actor_user_id` is stored (`admin_audit_log.py`) but `AuditLogEntry` does not return it and the
console has no "Who" column. The first question an incident review asks cannot be answered from
the console. Also:

- `ip_address` is written only on elevation events, so other rows show "-".
- No filter (actor, action, target, date) and no export.
- **Reads are not audited.** Opening a user's detail is personal-data access; DPDP and any future
  SOC-style review will ask who looked at whom.
- Two admin writes are not audited at all: `DELETE /qa/regressions` and
  `PATCH /feedback/{id}/reward`. The QA delete is also not behind elevation.

**Fix.** Return and render actor email + IP on every row; pass the client IP from every call site;
add filters and CSV export; log `view_user_detail`; audit and elevate the two stragglers.
**Acceptance.** A test that every route depending on `get_admin_user` with a non-GET method writes
an audit row with a non-null actor.

### ADM-04 (P1, conditional). Bootstrap admin email can be claimed by registering it

`is_admin_user` grants admin to any account whose email is in `JOTHIDAM_ADMIN_EMAILS`. Password
registration does not verify email ownership (only Google sign-in checks `email_verified`). If an
address is listed before its owner has an account (a new executive, a typo, a former employee
whose account was deleted), **whoever registers that address first becomes admin**.

**Fix.** Either require a verified email for the bootstrap path, or use the env list only to seed
`is_admin` once at startup for accounts that already exist, then ignore it. Log every admin grant.

### ADM-05 (P2). "Active users" and "retention" measure chart generation, not use

`/analytics/daily` counts as active anyone whose profile got a **new chart row** that day;
`/analytics/retention` counts a cohort member as retained if a chart was created after day 7/30.
A returning reader who opens Today, the calendar or a reading on an existing chart creates no new
chart, so both figures read near zero for exactly the engaged users. A CEO looking at this tab
would conclude the product has no retention.

**Fix.** Record a last-seen date per user (one `UPDATE` per user per day from the auth dependency
is cheap), or read DAU/retention from PostHog and say so on the tab. Label the current figures
"chart generations" until then.

### ADM-06 (P2). Two analytics endpoints are built and never shown

`/admin/analytics/acquisition` (GRW-03 channel + activation) and `/admin/analytics/life-focus`
(with a typed wrapper in `packages/shared`) have no tab. Growth attribution is the first thing an
owner asks for after signups.

### ADM-07 (P2). Jobs: no history, no schedule, and they run inside the request

The Operations tab lists jobs and can trigger one. It cannot show last run, next run, duration,
failure, or whether the worker is alive. `SchedulerHeartbeat` exists and feeds the worker's own
health check, but the admin health tab infers the scheduler from Postgres advisory locks instead.
A manual trigger runs the job synchronously in the API request, so a long job blocks a worker and
times out at the proxy.

**Fix.** A `job_run` table (job, trigger = cron/manual, actor, start, end, outcome, summary);
health reads the heartbeat; manual triggers enqueue rather than run inline.

### ADM-08 (P2). User management cannot answer a support question

Search is email substring only. Detail shows counts. There is no way to see the user's
subscription history, devices, consent version and date, last login, acquisition source, recent
errors, or what their dashboard showed. No password-reset link, no "log out everywhere" (the
`token_version` lever exists but has no button), no note field. Suspension has no guard against
suspending yourself or the last admin.

### ADM-09 (P3). Small

- Health says "Secrets appear configured" when only the admin API key is checked.
- Feature-flag edits are per-process for non-doctrine flags too; with more than one worker, a flag
  change reaches one worker. Doctrine flags already refuse this (409); the others silently half-apply.
  (Verify against `feature_flags.py` storage before acting.)
- QA regression store is in memory; it empties on restart and differs per worker.

---

## Part B: what each kind of admin needs, and what is missing

✓ exists · ◐ partial · ✗ missing

### Owner / CEO: "how is the business doing?"

| Need | State |
|---|---|
| Signups per day | ✓ |
| DAU / WAU / MAU, real retention | ✗ (ADM-05) |
| Activation funnel: visit → signup → profile → first chart → return D1/D7 | ✗ |
| Acquisition by channel | ◐ built, not shown (ADM-06) |
| Revenue: MRR, active subscribers, new / churned, trial conversion, ARPU | ✗ |
| Feature adoption (Today, calendar, porutham, family, Ask Vinaadi) | ◐ totals only |
| Tamil vs English share, web vs mobile, city/region | ✗ |
| Feedback themes and rating trend | ◐ inbox only |
| Weekly summary email / export to sheet | ✗ |
| Read-only access without destructive power | ✗ (ADM-04, Part C) |

### Operations admin: "is it working?"

| Need | State |
|---|---|
| DB / scheduler health | ◐ (ADM-07) |
| Job history, failures, re-run | ◐ trigger only |
| Push delivery rate, outbox backlog, dead letters | ✗ |
| Webhook (RevenueCat) event log, replays | ✗ (`WebhookEvent` stored, not shown) |
| Error rate / slow endpoints | ✗ (link out to Sentry/logs is enough) |
| Panchangam cache warm state, almanac edition due dates (2028 edition ~15 Sep 2027) | ✗ |
| Feature flags with who/when/why | ◐ no reason field, no history view |
| Maintenance banner / kill switch per feature | ✗ |

### Support: "help this one person"

| Need | State |
|---|---|
| Find user by email, phone, user id, referral code | ◐ email only |
| See subscription, entitlements, payment status | ✗ |
| Send password reset, force logout, unlock throttle | ✗ |
| See consent state and history | ✗ |
| See what their Today / chart showed (read-only, audited) | ✗ |
| Grant a courtesy subscription or quota bump (audited) | ✗ |
| Internal notes on a user, link to their feedback | ✗ |
| Reply to feedback, mark resolved | ✗ (reward toggle only) |

### Astrologer / content owner: "is what we tell families right?"

Doctrine changes stay in code with a recorded ruling (§16–§18); that is correct and should not move
into a console. What they lack is visibility:

| Need | State |
|---|---|
| Prediction calibration | ✓ |
| Dosham / yoga prevalence over real users (the AAU-13 gate, live) | ✗ |
| Queue of items awaiting countersign (§17 delegated rulings, canon 0/108 verified) | ✗ |
| Content review status: Tamil copy unreviewed, guide pages unsigned | ✗ |
| User-reported "this is wrong" feedback filtered to accuracy | ✗ |

### Privacy / compliance: "can we prove we handle data correctly?"

| Need | State |
|---|---|
| Erasure that matches self-delete | ✗ (ADM-01) |
| Data export for a user (access request) | ✗ |
| Request register: received, due date, done, by whom | ✗ |
| Consent coverage (share of users on current policy version) | ✗ |
| Who viewed whose data | ✗ (ADM-03) |
| Marketing-consent-aware messaging | ✗ (ADM-02) |

### Finance

| Need | State |
|---|---|
| Subscription list, status, period end, provider | ✗ (`subscriptions` table exists) |
| Revenue by month, refunds, failed renewals | ✗ |
| Ask Vinaadi (LLM) cost per day vs quota | ✗ |

---

## Part C: architecture recommendations

**1. Roles, not a boolean.** Replace `is_admin` with a small fixed role set and a permission map in
code (no role editor needed yet):

| Role | Can |
|---|---|
| `viewer` (CEO, investors, advisors) | All dashboards and analytics. No personal data beyond aggregates. |
| `support` | User lookup and detail (audited), reset link, force logout, notes, feedback replies |
| `ops` | Health, jobs, flags, outbox, webhooks |
| `privacy` | Export, erasure, request register |
| `owner` | Everything, plus granting roles |

Each route declares `require_permission("users.read")` etc. Elevation stays on top for destructive
permissions regardless of role. Role grants and revokes go through an audited endpoint; the env
list only seeds the first owner (ADM-04).

**2. Split the 1,650-line console.** `admin-console.tsx` holds every tab's state in one component.
Move to `web/app/admin/<section>/page.tsx` routes with the existing elevation helper shared, so
each section loads its own data and can be gated per role server-side in its `page.tsx`.

**3. Typed wrappers.** The console calls `/api/backend/...` with hand-written types. Per CLAUDE.md,
admin endpoints should get wrappers in `packages/shared/src/api/` (only life-focus has one).

**4. Metrics from events, not from row counts.** Add `users.last_seen_on` now (cheap, fixes
ADM-05). For funnels and feature adoption, read PostHog rather than rebuilding it; the admin
overview can show a few headline numbers and link out.

**5. One service per sensitive action.** Erasure (ADM-01), messaging (ADM-02) and audit (ADM-03)
each become a single service the admin route, the user route and any job all call. That is the
same "one question, one engine" rule the astrology side follows.

---

## Part D: suggested order

| Phase | Items | Why first |
|---|---|---|
| 1. Correctness and compliance | ADM-01, 02, 03, 04 | Legal and security exposure today |
| 2. Owner can read the business | ADM-05, 06; revenue tab from `subscriptions`; Ask Vinaadi cost | The CEO question |
| 3. Roles | Part C.1, C.2 | Before anyone besides the owner gets access |
| 4. Support | ADM-08: search, subscription view, reset, force logout, notes | Before paid launch |
| 5. Ops depth | ADM-07, outbox and webhook views, flag history | As volume grows |
| 6. Astrologer views | prevalence, countersign queue, content review | Supports doctrine sign-off |

## Blind spots

- Read from code only; no route was exercised. ADM-01's `interpretation_outputs` FK behaviour and
  ADM-09's flag storage are marked unverified.
- Mobile has no admin surface and none was expected; not audited.
- "What an admin needs" is from the product's stated plans (beta then payments, DPDP consent work)
  and common practice, not from interviews with the people who will use it. The role table in
  Part C should be checked against who will actually log in.
