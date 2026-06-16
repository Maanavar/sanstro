# Vinaadi — Beta Launch Checklist

Go-live gate for the **open beta** of the Vinaadi web app + marketing site.
Strategy: full free access for the first ~month, beta-labelled everywhere, to
collect usage data + reviews while the paid v1 is prepared.

Status legend: ✅ done · 🟡 verify before launch · ⬜ to do

---

## 1. The six non-negotiable security/legal gates

These are table stakes for being on the public internet while collecting
**sensitive personal data** (birth date, time, place). They are NOT deferrable
even for a free beta.

| # | Gate | Status | Where / action |
|---|------|--------|----------------|
| 1 | HTTPS + secrets not in client/git | 🟡 verify | `JOTHIDAM_COOKIE_SECURE=true` enforced in prod config (`app/core/config.py`). Confirm TLS at the proxy and that `.env` is gitignored. |
| 2 | Auth can't be trivially bypassed | ✅ | JWT (httpOnly cookie) — `app/core/auth.py`. Admin routes need JWT **+** `X-Admin-Key`. |
| 3 | Rate limiting on public endpoints | ✅ | Per-IP sliding window — `app/middleware.py`. Ask Vinaadi has a separate daily cap. |
| 4 | Input validation | ✅ | Pydantic schemas across `app/schemas/`. |
| 5 | Data deletion path | 🟡 verify | Admin delete endpoint exists (`app/api/admin.py`); privacy page now lists `privacy@vinaadi.com`. **Wire that inbox before launch.** |
| 6 | Privacy + Terms + disclaimers published | ✅ | `/privacy`, `/terms` (updated for beta + encryption + data rights). Astrology disclaimer in footer + both legal pages. |

---

## 2. Production environment variables (set before deploy)

The prod config validator (`app/core/config.py`) **refuses to boot** without
these when `APP_ENV=production`:

- [ ] `JOTHIDAM_JWT_SECRET` — strong random (not the default)
- [ ] `JOTHIDAM_ADMIN_API_KEY` — strong random (not the default)
- [ ] `JOTHIDAM_ENCRYPTION_KEY` — birth-data encryption at rest
- [ ] `JOTHIDAM_COOKIE_SECURE=true`
- [ ] `JOTHIDAM_DEBUG=false`

Also review:
- [ ] `JOTHIDAM_CORS_ALLOW_ORIGINS` — set to the real web origin(s)
- [ ] `JOTHIDAM_TRUSTED_PROXY_COUNT` — set to match your reverse-proxy hops (so
      rate limiting keys on the real client IP, not the proxy)
- [ ] `JOTHIDAM_RATE_LIMIT_MAX_REQUESTS` / `_WINDOW_SECONDS` — tune for launch
- [ ] `JOTHIDAM_ANTHROPIC_API_KEY` + `JOTHIDAM_ASK_VINAADI_DAILY_LIMIT` — budget guard
- [ ] `JOTHIDAM_FRONTEND_URL` — real domain

> ⚠️ Rate-limit state is in-process per worker (see note in `app/middleware.py`).
> With N Gunicorn/Uvicorn workers the effective limit ≈ N × max. For a strict
> cluster-wide cap, move counters to Redis. Acceptable for a single-instance beta.

---

## 2b. Web (Next.js) environment variables

Product analytics (PostHog) is wired in but **stays a no-op until these are set**,
so nothing phones home in dev:

- [ ] `NEXT_PUBLIC_POSTHOG_KEY` — your PostHog project API key
- [ ] `NEXT_PUBLIC_POSTHOG_HOST` — `https://eu.i.posthog.com` (EU) or your instance

---

## 3. Database

- [ ] Apply the feedback table migration: `alembic upgrade head`
      (adds `feedback`, revision `v7c8d9e0f1a2`; forward-only, reversible).
- [ ] Confirm migration ran against the **prod** DB, not dev/test.
- [ ] Take a baseline backup after first deploy (`pg_dump`).

---

## 4. Beta messaging (shipped in this change)

- ✅ Sitewide dismissible **beta banner** (`components/beta-system.tsx`)
- ✅ First-visit **welcome modal** (explains free beta + reviewer perk)
- ✅ **Footer** beta line linking to `/beta`
- ✅ **`/beta` page** — what's free, what's coming, data & privacy, feedback
- ✅ Bilingual (EN/TA) copy in `lib/marketing-i18n.ts` (`BETA`, `FOOTER.beta_line`)

To verify:
- [ ] Banner appears on both the public site and the dashboard.
- [ ] Dismiss persists (localStorage `vinaadi_beta_banner_dismissed`).
- [ ] Welcome modal shows once (localStorage `vinaadi_beta_welcome_seen`).

---

## 5. Feedback & reviews (shipped in this change)

- ✅ Feedback now **persists to the DB** (`feedback` table) — was an in-memory
      list that vanished on restart.
- ✅ New `review` category + "feature as a review" + "you may contact me" opt-ins.
- ✅ Admin list endpoint `GET /feedback` (paginated, `reviews_only` filter).
- ✅ Discretionary reviewer-perk flag: `PATCH /feedback/{id}/reward` (admin only).

Reviewer perk = **manual & discretionary**. Copy everywhere says reviewers
"may qualify" — no automated promise (kept defensible in Terms §"Beta feedback").

To do:
- [ ] Add a "Reviews" view to the admin console that reads `GET /feedback?reviews_only=true`
      and exposes the reward toggle (backend is ready; UI optional for launch).

---

## 5b. Analytics (shipped in this change)

PostHog product analytics, privacy-first (`lib/analytics.ts`, `components/posthog-provider.tsx`):
- ✅ Autocapture **off**, session recording **off** — only named events are sent.
- ✅ Birth details, name, email, and typed content are **never** sent.
- ✅ Users identified by opaque UUID only; first-party localStorage (no tracking
      cookie); EU host; respects Do Not Track.
- ✅ Events wired: `$pageview`, `chart_generated` (activation), `feedback_submitted`.

To verify / decide:
- [ ] Create the PostHog project, set the two `NEXT_PUBLIC_POSTHOG_*` vars.
- [ ] Build a funnel in PostHog: visit → signup → `chart_generated` → return D1/D7.
- [ ] **EU cookie-consent**: this setup is cookieless (localStorage) and DNT-aware,
      which is low-risk, but if you market heavily to EU/UK users, consider a
      lightweight consent banner. India DPDP is covered by the privacy notice.
- [ ] (Optional) add more events: `signup_completed`, `porutham_run`, `ask_vinaadi_used`.

---

## 6. Pre-launch QA pass

- [ ] `cd web && npm run build` passes (typecheck + lint).
- [ ] Backend tests in the user env / Docker `vinaadi_test` (not sandbox — swisseph DLL).
- [ ] Manual smoke: sign in → generate a chart → submit feedback → see it in admin.
- [ ] Mobile/responsive check of banner + modal.
- [ ] Lighthouse/SEO sanity on `/` and `/beta`.

## 7. Day-one operations

- [ ] `privacy@vinaadi.com` (or chosen address) is a real, monitored inbox.
- [ ] Analytics + error logging confirmed live (the free month is a *data* play —
      a month with no instrumentation is wasted).
- [ ] Someone owns triaging incoming feedback daily.

---

### Open items needing a human decision
- **Support/privacy email**: the privacy & terms pages reference
  `privacy@vinaadi.com`. Change to your real address if different, in one place:
  `web/app/privacy/page.tsx`.
- **Reviewer perk scope**: currently discretionary. If you later want automated
  tracking, the `reward_qualified` flag already exists on each feedback row.
