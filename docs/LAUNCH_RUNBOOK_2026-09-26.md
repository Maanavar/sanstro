# Go-Live Runbook — Open Beta (2026-09-26)

**Decision (owner, 2026-09-26):** launch as an **open beta**: every feature free, go live, test, then switch to payments.
**Companion:** [GROWTH_READINESS_REVIEW_2026-09-26.md](GROWTH_READINESS_REVIEW_2026-09-26.md) (the `GRW-##` items).

This page has three parts:
1. What the code now does.
2. The steps only the owner can take (accounts, DNS, secrets). Each step has a check you can run.
3. How to end the beta when payments are ready.

---

## 1. Done in code

| Item | What changed | Commit |
|---|---|---|
| GRW-05 Open beta | `JOTHIDAM_OPEN_BETA` (default on) gives every signed-in account Premium's limits: unlimited profiles and goals, 5 vault members, full dasha, reports. Ask Vinaadi keeps a daily fair-use cap of 7 (the old free cap) because each answer costs money. `/auth/me` sends `openBeta`. Mobile and web unlock to match. Upgrade prompts, trial CTAs and store badges are hidden. `/pricing` says "free during beta". | `912fa8e` |
| GRW-02/07/08 SEO | 10 pages that pointed their canonical at the homepage now name themselves, and 118 doubled "\| Vinaadi" titles are fixed. The sitemap now has all 27 nakshatra + visual pages, `/pricing`, `/beta`, `/family` and `/tools/chandrashtama`. Invalid structured data is removed. `web/lib/seo-metadata.test.ts` guards all of this. | `b19e0f6` |
| GRW-04 One address | Share cards, share text and legal contacts all print `vinaadi.com` / `support@vinaadi.com` from one constant: `packages/shared/src/constants/site.ts`, mirrored by the backend's `public_site_url`. | `b19e0f6` |
| GRW-03 Measurement | The web image now accepts PostHog and Firebase keys as build args (before this, analytics and web push compiled to no-ops). Each account records its first-touch source: utm tags, `?ref=`, referring host and landing page. New admin report: `GET /api/v1/admin/analytics/acquisition`. New funnel events: `signup_completed`, `signup_started`, `share_clicked`. | this batch |
| GRW-13 Referral | `GET /api/v1/users/me/referral` gives each account a code and link, and counts who it brought. Porutham share links carry the sharer's code. | this batch |
| GRW-10 WhatsApp | The porutham share dialog and the panchangam card have a direct WhatsApp button, which also works on desktop and in in-app browsers. | this batch |
| GRW-14 Signup | Email signup now signs the person straight in and opens setup. Before, it ended on "please sign in" and they had to type the password again. | this batch |
| GRW-15 PWA | `web/app/manifest.ts` lets Android Chrome offer "Add to Home screen". | this batch |
| Share image | The OG image was a 2 MB 1730×909 PNG declared as 1200×630. It's now a 79 KB 1200×630 JPEG, well under WhatsApp's preview size limit. | this batch |

---

## 2. Owner steps to go live, in order

### Step 1: Domain
- [ ] Register **vinaadi.com**. It currently returns NXDOMAIN, and every canonical, sitemap entry and share card uses it.
      *If you pick a different domain,* tell me and it becomes a one-line change: `SITE_URL` in `packages/shared/src/constants/site.ts` plus `JOTHIDAM_PUBLIC_SITE_URL`. The parity test keeps the two in step.
- [ ] Point `vinaadi.com` at the web host and redirect `www.vinaadi.com` to it.
- **Check:** `Resolve-DnsName vinaadi.com -Server 8.8.8.8` returns an address.

### Step 2: Mailboxes the legal pages promise
- [ ] Create `support@vinaadi.com` (privacy policy + terms) and `privacy@vinaadi.com` (privacy page). India's DPDP Act expects a working grievance contact.

### Step 3: Accounts whose keys go into the build
- [ ] **PostHog** project (EU cloud, to match `lib/analytics.ts`). Copy the project key.
- [ ] **Firebase** web app config + VAPID key, for web push.
- [ ] Build the web image with them:
  ```
  docker build -f web/Dockerfile \
    --build-arg NEXT_PUBLIC_POSTHOG_KEY=phc_... \
    --build-arg NEXT_PUBLIC_FIREBASE_API_KEY=... (and the other NEXT_PUBLIC_* in .env.example) .
  ```
- **Check:** open the live site, then open DevTools → Network. A request to `eu.i.posthog.com` means analytics is on.

### Step 4: Backend environment for the live domain
```
JOTHIDAM_ENVIRONMENT=production
JOTHIDAM_FRONTEND_URL=https://vinaadi.com
JOTHIDAM_COOKIE_SECURE=true
JOTHIDAM_PUBLIC_SITE_URL=https://vinaadi.com
JOTHIDAM_OPEN_BETA=true
JOTHIDAM_GOOGLE_CLIENT_ID=... / JOTHIDAM_GOOGLE_CLIENT_SECRET=...
```
- [ ] In Google Cloud Console, add this OAuth redirect URI:
  `https://vinaadi.com/api/backend/api/v1/auth/oauth/google/callback`
- [ ] Run migrations. `rr1b2c3d4e5f` only adds nullable columns: it was checked upgrade → downgrade → upgrade on the test DB and is forward-safe.
- **Check:** `curl https://vinaadi.com/api/backend/api/v1/auth/oauth/providers` returns `{"google": true}`.

### Step 5: Search engines
- [ ] **Google Search Console:** add a *Domain* property for `vinaadi.com` and verify by DNS TXT. Alternatively, set `GOOGLE_SITE_VERIFICATION` on the web server, which needs no rebuild.
- [ ] Submit `https://vinaadi.com/sitemap.xml`.
- [ ] **Bing Webmaster:** import from Search Console, or set `BING_SITE_VERIFICATION`.
- **Check:** `curl -s https://vinaadi.com/features/daily-guidance | findstr canonical` shows that page's own URL, not the homepage.

### Step 6: Share previews
- [ ] Paste `https://vinaadi.com/tools/marriage-porutham-calculator` into a WhatsApp chat with yourself. A picture and a title should appear.
- [ ] Run the same URL through the Facebook Sharing Debugger (WhatsApp reads the same tags).

### Step 7: Mobile (only when you ship the app)
- [ ] `mobile/eas.json` points production at `https://api.vinaadi.app`, which doesn't resolve. Set it to your real API host (for example `https://vinaadi.com/api/backend`).
- [ ] When the Play listing is published, set `PLAY_STORE_URL` in `packages/shared/src/constants/launch.ts`. The store badges then come back on their own.

---

## 3. Beta test checklist (after Step 6)

- [ ] Open a tool page with `?utm_source=test&utm_medium=manual`, then create an email account. It should land straight in setup with no second sign-in.
- [ ] Admin → `GET /api/v1/admin/analytics/acquisition?days=7` shows `test`.
- [ ] Add a 4th birth profile and a 2nd family member. Both should work (beta has Premium limits).
- [ ] Ask Vinaadi 7 times. The 8th says "ask again tomorrow" and offers **no** Upgrade.
- [ ] Porutham → Share → WhatsApp. The link carries `?ref=`. Open it in a private window, sign up, then check `GET /api/v1/users/me/referral` on the sharer's account: `referredCount` should be 1.
- [ ] `/pricing` shows the beta note and no Play badge. `/beta` names the Ask limit.

---

## 4. Ending the beta (when payments are ready)

This has to be one coordinated change:
1. Set `JOTHIDAM_OPEN_BETA=false` **and** `OPEN_BETA = false` in `launch.ts`. `tests/test_launch_parity.py` fails if only one is flipped.
2. Ship a way to pay first: Razorpay (UPI + UPI Autopay) on web writing to the same `subscriptions` table the RevenueCat webhook uses, and/or the Play listing.
3. Give the notice `/beta` promises before the switch. Existing data carries over, since `tier` was never rewritten.
4. **Teach web to answer `PREMIUM_REQUIRED` before flipping the switch** (added 2026-10-06). The server now refuses Varshaphala, Synastry, Retrospective, the life-event log and rectification to a registered account once the beta is off (`app/core/entitlements.py`, 403 with code `PREMIUM_REQUIRED`). Web has no lock UI for any of them, so without this step those panels show a generic error instead of an upgrade path. Native's Insights cards already lock; its Tools → Varshaphala entry does not.
5. **Decide the features the server cannot enforce yet** — listed with reasons in `UNENFORCEABLE_FEATURES` in the same module: Vargas (served inside `GET /charts/{id}`), remedies (tier table says premium; native shows them to everyone), `dasha_depth` and the rasi-palan window (defined per tier, read by nothing). Each is either a payload change or a ruling that the tier table is wrong.
6. Run `tests/test_entitlements.py` — it is the beta-off matrix.

---

## 5. Still open (not in this batch)

| ID | Item | Why it's next |
|---|---|---|
| GRW-06 | Tamil at its own URLs (`/ta/...`) with hreflang | **Built, not yet committed** (2026-09-26): 134 pages at `/ta/...`, reciprocal hreflang, both languages in the sitemap. Left: pricing/privacy/terms bodies (English only), a Tamil reader's review of `web/lib/marketing-seo-ta.ts`, JSON-LD in Tamil. After deploy: resubmit the sitemap in Search Console and watch the International Targeting / page-indexing report. |
| GRW-09 | Dynamic OG images per porutham share and panchangam day | The static image now works; per-result images get more clicks. |
| GRW-11 | Daily 6 am panchangam push with a one-tap forward | The habit loop. |
| GRW-12 | Carry tool inputs (birth details) into signup | Avoids re-entry at the most fragile step. |
| GRW-16 | Welcome email, newsletter sending, unsubscribe | The home card now promises the list, not a delivery. |
| GRW-17 | Static/ISR marketing pages once language moves to the URL | Speed and crawl budget. |
| GRW-18–22 | Social accounts, real usage numbers, ASO, comparison pages, partnerships | Owner and content work. |
