# Admin spec: verification of audit findings

Step 0 of `VINAADI_ADMIN_MASTER_SPEC.md` §0.2. One row per ADM finding, checked against the code on
branch `harden/production-readiness`, 2026-11-01. Read from code only; nothing was run.

Status: **confirmed** (code shows it) · **partly** (true with a correction) · **not found** · **not checked yet**.

| ID | Status | Where | Note |
|---|---|---|---|
| ADM-01 | confirmed, worse than written | `app/api/admin.py:295`, `app/api/auth.py:428`, `app/models/interpretation_output.py:16-18` | The FK question is answered: `interpretation_outputs.chart_id` and `.family_vault_id` are `ON DELETE SET NULL`. Admin erasure does not fail. It **succeeds and leaves interpretation rows behind with their links nulled**: personal reading text with no owner. Admin erasure also leaves the user row, journal, retrospectives, Ask usage, notifications, subscriptions, preferences, streaks, goals, life-focus events, numerology sessions, porutham shares. |
| ADM-01a (new) | confirmed | `app/models/device_token.py:26`, `app/models/feedback.py:31`, `app/models/family_member.py:32` | Self-delete (`DELETE /auth/me`) has gaps too. These FKs are `SET NULL`, so after self-delete the **push device token and free-text feedback survive**, detached. The registry in L5 must cover them. |
| ADM-02 | partly | `app/api/admin.py:626` | Broadcast exists and needs elevation. Not yet checked: whether it reads notification preferences or the outbox. L8 disables it anyway, so the answer doesn't block anything. |
| ADM-03 / ADM-11 | partly | `app/models/admin_audit_log.py` | Actor, action, target, summary and IP exist. Missing: role, reason, user agent, outcome, structured details. No DB-level append-only guard, no hash chain. Extend this table; don't add a second one. |
| ADM-04 / ADM-10 | confirmed | `app/core/auth.py:218-290`, `app/core/config.py:180,257` | No TOTP anywhere in `app/`. Elevation re-asks the password (`admin.py:76`), so Google-only admins can't elevate. `is_admin_user` treats a `JOTHIDAM_ADMIN_EMAILS` match as admin **on every request**, not only as a one-time seed. One role: admin or not. |
| ADM-09 | confirmed | `app/services/feature_flags.py:311` | Flags live in a module-level dict `_overrides`. Each worker keeps its own copy and loses it on restart. The doctrine path already refuses runtime overrides when `WEB_CONCURRENCY > 1`. Non-doctrine flags (`maintenance_mode`, `enable_push_notifications`, `ask_vinaadi_daily_limit`) still drift. |
| ADM-05 / ADM-06 | not checked yet | `app/api/admin_analytics.py` | Acquisition columns already exist on `users` (`acquisition_source/medium/campaign/ref/referrer_host/landing_path`, `referral_code`), so L6 capture is partly done. |
| Payments (Part B) | confirmed absent | `app/api/reports.py` | `POST /reports/purchase` is a stub: it checks the SKU and returns `status: queued` with a random ID. Nothing is charged, stored or delivered. No Razorpay code anywhere in the repo. |
| Ask provider (D-16) | confirmed | `app/services/ask_vinaadi_service.py:338-350` | Anthropic SDK, model hard-coded `claude-sonnet-4-6`. No token, cost, latency or prompt-version capture. |
| Minors (D-12) | partly | `app/models/family_member.py:31` | `is_minor` already exists. Birth dates are already encrypted at rest (`EncryptedDate`). |

Not yet checked: ADM-07, ADM-08, ADM-12 to ADM-37. Each gets a row before the package that touches it starts.

## Resolution log

| ID | Resolved by | Note |
|---|---|---|
| ADM-04 / ADM-10 | L3 (plan §7) | TOTP required; `JOTHIDAM_ADMIN_EMAILS` seeds one owner, once, from a verified account; roles + per-route permissions. |
| ADM-09 | L10a | Flags persisted in `runtime_settings`; every worker reads them within 5 s. |
| ADM-02 | L8 (interim) | Broadcast returns 410. |
| Payments (Part B) | L1 | Razorpay checkout, webhook, reconciliation; the `/reports/purchase` stub remains for the report waitlist until report deliverables exist (ARC-14). |
| ADM-01 / ADM-01a | **open** — L5 | Unchanged by this work. |
