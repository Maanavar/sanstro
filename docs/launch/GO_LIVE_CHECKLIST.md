# Vinaadi Go-Live Checklist

Use this as the master go-live checklist for the Vinaadi web app, API, and public
site. It is broader than the beta checklist and is meant to cover product,
engineering, security, legal, analytics, support, launch-day execution, and
rollback.

Companion docs:
- `docs/launch/BETA_LAUNCH_CHECKLIST.md`
- `docs/PUBLIC_SITE_QA_CHECKLIST.md`
- `README.md`
- `.github/workflows/ci.yml`

Status legend:
- `[ ]` not done
- `[~]` in progress / verify
- `[x]` done
- `N/A` not part of this launch

## 1. Launch definition

Fill this section first so everyone is agreeing to the same launch.

- [ ] Launch type is defined: `closed beta`, `open beta`, `soft launch`, or `full production`
- [ ] Launch date and time are fixed
- [ ] Deployment window is fixed
- [ ] Go/no-go owner is named
- [ ] Rollback owner is named
- [ ] Support owner is named
- [ ] Success metrics for the first 24 hours are written down
- [ ] Stop-ship conditions are written down

Suggested stop-ship conditions:
- auth broken
- chart generation broken
- incorrect production environment secrets
- migrations fail
- error rate spikes after deploy
- privacy/support inbox not reachable

## 2. Product and business readiness

- [ ] The launch promise is clear: what users get today vs what is still beta
- [ ] Public messaging matches reality on homepage, `/beta`, `/terms`, `/privacy`
- [ ] Pricing state is clear: free beta, paid launch, or invite-only
- [ ] Any beta wording is present everywhere it needs to be
- [ ] Screenshots, OG image, app description, and release notes are current
- [ ] Feedback collection path is live and visible
- [ ] Internal owners know what feedback must be handled in under 24 hours
- [ ] Success funnel is defined: visit -> signup -> chart generated -> return

Repo-specific checks:
- [ ] `/beta` page content matches current launch strategy
- [ ] Footer copy and beta line are correct in `web/components/public-footer.tsx`
- [ ] Marketing copy is aligned in `web/lib/marketing-i18n.ts`
- [ ] App Store URL placeholder replaced: `https://apps.apple.com/app/vinaadi/id0000000000` still appears in `web/app/pricing/page.tsx` and `web/components/dashboard-setup-tab.tsx` (bundle ID `ai.vinaadi.app`) — swap `id0000000000` for the real numeric App Store ID once the app is approved and listed (carried over from the now-archived `docs/archive/ONBOARDING_PRICING_FIXES.md`)

## 3. Legal, privacy, and policy readiness

- [ ] Terms page is published and reviewed
- [ ] Privacy page is published and reviewed
- [ ] Sensitive birth-data handling is accurately described
- [ ] User deletion/contact path is documented and reachable
- [ ] Support/privacy email address is real and monitored
- [ ] Data retention policy is decided
- [ ] Refund / credits policy is decided if money is involved
- [ ] Child / age policy is decided and aligned with product behavior
- [ ] Any required consent copy for analytics, notifications, or emails is present
- [ ] Region-specific compliance has been reviewed for target markets

Repo-specific checks:
- [ ] `web/app/privacy/page.tsx` has the correct live contact email
- [ ] `web/app/terms/page.tsx` matches actual beta / production behavior
- [ ] Admin delete policy aligns with `app/api/admin.py`
- [ ] DPDP consent record is implemented (consent checkbox + `consent_given_at` on User model)
- [ ] Privacy page discloses Anthropic as data processor if Ask Vinaadi is enabled
- [ ] `JOTHIDAM_ENABLE_ADMIN_DATA_DELETE=true` is set in production so operator-triggered
  deletion requests (from `privacy@vinaadi.com` inbox) can be fulfilled

## 4. Domains, hosting, and infrastructure

- [ ] Production domain is live
- [ ] DNS records are correct
- [ ] TLS certificate is valid and auto-renewing
- [ ] `www` / apex redirect behavior is intentional
- [ ] Reverse proxy / CDN config is documented
- [ ] Staging and production are separate
- [ ] Production environment cannot accidentally point at dev services
- [ ] Server clock / timezone assumptions are understood
- [ ] Resource sizing is adequate for launch traffic
- [ ] Disk space and database storage headroom are checked

If using a proxy/load balancer:
- [ ] `JOTHIDAM_TRUSTED_PROXY_COUNT` matches real proxy hops
- [ ] Real client IP reaches the backend correctly for rate limiting and logs

## 5. Production configuration and secrets

These are hard blockers for this repo.

- [ ] `APP_ENV=production` or equivalent production environment is set
- [ ] `JOTHIDAM_ENVIRONMENT=production`
- [ ] `JOTHIDAM_DATABASE_URL` points to the production database
- [ ] `JOTHIDAM_JWT_SECRET` is set to a strong random secret
- [ ] `JOTHIDAM_ADMIN_API_KEY` is set to a strong random secret
- [ ] `JOTHIDAM_ENCRYPTION_KEY` is set and backed up securely
- [ ] `JOTHIDAM_COOKIE_SECURE=true`
- [ ] `JOTHIDAM_DEBUG=false`
- [ ] `JOTHIDAM_FRONTEND_URL` is the real domain
- [ ] `JOTHIDAM_CORS_ALLOW_ORIGINS` is restricted to real origins only

Strongly recommended:
- [ ] `JOTHIDAM_RATE_LIMIT_ENABLED=true`
- [ ] `JOTHIDAM_RATE_LIMIT_WINDOW_SECONDS` is tuned for launch
- [ ] `JOTHIDAM_RATE_LIMIT_MAX_REQUESTS` is tuned for launch
- [ ] `JOTHIDAM_ENABLE_ADMIN_DATA_DELETE` is intentionally on or off
- [ ] `JOTHIDAM_ASK_VINAADI_DAILY_LIMIT` matches budget

Feature-specific:
- [ ] `JOTHIDAM_ANTHROPIC_API_KEY` is set if Ask Vinaadi is enabled
- [ ] `JOTHIDAM_SMTP_HOST`, `...USER`, `...PASS`, `...FROM_EMAIL` are set if email is enabled
- [ ] `JOTHIDAM_FCM_PROJECT_ID` and `JOTHIDAM_FCM_SERVICE_ACCOUNT_JSON` are set if push is enabled
- [ ] `NEXT_PUBLIC_POSTHOG_KEY` is set if analytics is enabled
- [ ] `NEXT_PUBLIC_POSTHOG_HOST` is set if analytics is enabled

Operational checks:
- [ ] Secrets are stored in the hosting platform, not in git
- [ ] Secret rotation owner is known
- [ ] Recovery access to secret storage is tested

## 6. Database, migrations, and backup safety

- [ ] `alembic upgrade head` has been run in production
- [ ] The exact migration revision applied is recorded
- [ ] Migration was tested in staging first
- [ ] Pre-deploy backup was taken
- [ ] Post-deploy backup was taken after schema stabilization
- [ ] Restore procedure has been tested at least once
- [ ] Data encryption key recovery procedure exists
- [ ] Any one-time backfill scripts are documented and idempotent

Repo-specific checks:
- [ ] Feedback table migration `v7c8d9e0f1a2` is applied if not already present
- [ ] Production DB is not sharing credentials or host with dev/test DBs
- [ ] Any launch-day manual data fixes are written down before deployment

## 7. Security readiness

- [ ] HTTPS is enforced end to end
- [ ] Auth cookies are secure over HTTPS only
- [ ] Admin endpoints are protected and tested
- [ ] Rate limiting is enabled for public traffic
- [ ] Public inputs are validated
- [ ] Logs do not include secrets or sensitive birth details
- [ ] Only intended origins can reach browser-facing APIs
- [ ] Security headers are present in production responses
- [ ] Error responses do not leak stack traces in production
- [ ] Dependency risk review has been done for launch-critical packages

Repo-specific checks:
- [ ] `app/middleware.py` security headers are present in production responses
- [ ] `app/core/auth.py` login and token flows are smoke-tested
- [ ] `app/middleware.py` in-memory rate limiting is acceptable for current topology
- [ ] If running multiple workers or instances, a decision has been made on Redis or accepting approximate limits

Security audit findings — must clear before go-live:
- [ ] **JWT/Admin key defaults**: `app/core/config.py` lines 7–8 define public default secrets
  (`CHANGE_ME_IN_PRODUCTION_USE_STRONG_SECRET`, `CHANGE_ME_ADMIN_KEY`). The production
  guard only fires when `APP_ENV=production` / `JOTHIDAM_ENVIRONMENT=production` is
  explicitly set. A deployment that omits this flag silently uses the known-public
  defaults. Confirm both env vars are set AND both secrets are strong random values
  before any public traffic reaches the deployment.
- [ ] **DPDP Act 2023 consent**: No logged affirmative consent record exists at registration.
  Section 6 requires a specific, informed, unambiguous consent action before collecting
  birth data. Add a consent checkbox + store `consent_given_at` timestamp on the User
  model before launch.
- [ ] **Ask Vinaadi — Anthropic data processor disclosure** *(before enabling the feature)*:
  When Ask Vinaadi is live, user chart context (birth date/time/place + planetary data)
  is sent to Anthropic (USA). Add one sentence to `web/app/privacy/page.tsx`:
  "When you use Ask Vinaadi, your anonymised chart context is processed by Anthropic PBC
  (USA) to generate your answer." Required under DPDP Act Section 9.

## 8. Quality, testing, and release gates

- [ ] CI is green on the release commit
- [ ] Backend tests pass
- [ ] Frontend lint passes
- [ ] Frontend unit tests pass
- [ ] Frontend production build passes
- [ ] Migration round-trip is green in CI
- [ ] Critical manual smoke test has been completed in a production-like environment
- [ ] Known issues list is written down and accepted

Repo commands:

```powershell
pytest -q
cd web
npm run lint
npm test
npm run build
```

CI references:
- `.github/workflows/ci.yml`

Manual smoke tests:
- [ ] Sign up / log in works
- [ ] Generate chart works
- [ ] Dashboard loads for a returning user
- [ ] Public tools load
- [ ] Feedback submission persists and is visible to admins
- [ ] Admin login / protected actions work
- [ ] Ask Vinaadi behavior is correct when enabled and when disabled
- [ ] Mobile layout is usable

## 9. Public site, SEO, and content readiness

- [ ] Public pages pass `docs/PUBLIC_SITE_QA_CHECKLIST.md`
- [ ] `web/app/sitemap.ts` includes all intended public pages
- [ ] `web/app/robots.ts` matches indexing intent
- [ ] Canonical URLs are correct
- [ ] Open Graph image and metadata are correct
- [ ] Legal pages are indexable only if intended
- [ ] Dashboard and login are not indexed
- [ ] No placeholder copy remains
- [ ] Tamil and English copy both render correctly
- [ ] Text encoding is verified on deployed pages

## 10. Analytics, logging, and observability

- [ ] Product analytics destination is configured
- [ ] At least the core funnel events are visible in production
- [ ] Error logs are accessible to the team
- [ ] Request logs include correlation IDs
- [ ] A dashboard or query exists for launch-day monitoring
- [ ] Error-rate alert threshold is defined
- [ ] Traffic spike response owner is known

Minimum events for this repo:
- [ ] page view
- [ ] signup completed
- [ ] chart generated
- [ ] feedback submitted
- [ ] return visit D1 / D7

Repo-specific checks:
- [ ] `web/lib/analytics.ts` is configured for the chosen PostHog project
- [ ] `web/components/posthog-provider.tsx` is enabled in production
- [ ] Sensitive data is not sent in analytics events
- [ ] `X-Request-ID` is visible in API responses and logs

## 11. Notifications, email, and background jobs

Mark each area `done` or `N/A`; do not leave ambiguous.

- [ ] Email delivery tested or explicitly `N/A`
- [ ] Push notifications tested or explicitly `N/A`
- [ ] Background jobs / schedulers tested or explicitly `N/A`
- [ ] Cron ownership is defined
- [ ] Retry / failure behavior is understood
- [ ] Disabled integrations fail gracefully

Repo-specific checks:
- [ ] `app/services/daily_push_cron.py` behavior is confirmed or marked `N/A`
- [ ] Notification preferences flow behaves correctly
- [ ] Stub mode behavior is acceptable if SMTP / FCM are unset

## 12. Support, moderation, and operations

- [ ] Support inbox is monitored
- [ ] Privacy/deletion requests owner is assigned
- [ ] Bug triage owner is assigned
- [ ] Incident response contact path is known
- [ ] Admins know how to review feedback and issue rewards if applicable
- [ ] User-facing incident message template exists
- [ ] Internal launch room / chat channel is ready
- [ ] First-week support hours are agreed

Repo-specific checks:
- [ ] Feedback review process is defined for `GET /feedback`
- [ ] Reviewer reward process is defined for `PATCH /feedback/{id}/reward`

## 13. Financial and commercial readiness

Use this section if the launch involves money now or soon.

- [ ] Payment provider account is configured or explicitly `N/A`
- [ ] Tax / invoicing behavior is decided or explicitly `N/A`
- [ ] Refund handling path is documented or explicitly `N/A`
- [ ] Paid entitlement checks are tested or explicitly `N/A`
- [ ] Free-to-paid migration plan is written down
- [ ] Revenue reporting owner is assigned

For current beta launches, this may be mostly `N/A`, but the decision should still
be explicit.

## 14. Launch-day runbook

Before deploy:
- [ ] Announce code freeze
- [ ] Confirm the release commit / tag
- [ ] Confirm backups complete
- [ ] Confirm environment variables are present
- [ ] Confirm owners are available for the launch window

Deploy:
- [ ] Apply migrations
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Run smoke tests on live production
- [ ] Verify analytics, logs, and key pages

After deploy:
- [ ] Watch logs for at least 30-60 minutes
- [ ] Confirm first successful user journey end to end
- [ ] Confirm no major regression in mobile usage
- [ ] Announce launch only after the smoke pass is complete

## 15. Rollback plan

- [ ] Rollback trigger conditions are defined
- [ ] The previous stable release is known
- [ ] Frontend rollback command/path is documented
- [ ] Backend rollback command/path is documented
- [ ] Migration rollback stance is explicit: revert app only, or DB downgrade if safe
- [ ] Data-loss risk of rollback is understood
- [ ] Customer communication template exists if rollback is user-visible

Recommended rollback stance for this repo:
- prefer rolling application code back first
- downgrade database only if the migration is proven reversible and data-safe
- disable optional integrations before taking the app fully offline when possible

## 16. First 24-hour review

- [ ] Compare actual traffic vs expected traffic
- [ ] Review signup conversion
- [ ] Review chart-generation success rate
- [ ] Review error logs and support tickets
- [ ] Review feedback themes
- [ ] Decide hotfixes vs backlog items
- [ ] Record launch learnings in `docs/launch/`

## 17. Sign-off sheet

| Area | Owner | Status | Notes |
|---|---|---|---|
| Product |  |  |  |
| Engineering |  |  |  |
| Backend |  |  |  |
| Frontend |  |  |  |
| Database |  |  |  |
| Security |  |  |  |
| Legal / Privacy |  |  |  |
| Analytics |  |  |  |
| Support / Ops |  |  |  |
| Final go / no-go |  |  |  |

## Suggested minimum go-live gate for this repo

Do not launch unless all of these are true:

- [ ] CI is green
- [ ] Production secrets are set correctly
- [ ] Production database is backed up
- [ ] Migrations applied successfully
- [ ] Auth flow works
- [ ] Chart generation works
- [ ] Feedback path works
- [ ] Privacy and terms are live
- [ ] Support/privacy inbox is monitored
- [ ] Logs and analytics are visible on launch day
