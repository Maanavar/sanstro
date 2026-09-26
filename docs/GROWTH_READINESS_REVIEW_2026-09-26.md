# Growth Readiness Review — 2026-09-26

**Scope:** the whole product, read from code (web `(marketing)` + dashboard, backend `app/api`, `app/services`, `packages/shared`, `mobile/`), measured against the growth loop
**Discovery → Signup → First value → Habit → Premium → Retention → Referral → Return.**
**Lenses:** marketing, SEO, business analysis, product management.
**Item prefix:** `GRW-##`. Status: `[ ]` open · `[~]` partial · `[x]` done.
**Progress:** owner chose open beta on 2026-09-26; code-side items shipped the same day — see [LAUNCH_RUNBOOK_2026-09-26.md](LAUNCH_RUNBOOK_2026-09-26.md) for what shipped and the owner's go-live steps.

---

## 0. The one-paragraph verdict

Vinaadi has **built more growth machinery than most products at launch**. It has 127 public routes, 10 free public tools backed by 25 public API endpoints, 9:16 share cards, a porutham share link, streaks, Wrapped, web and mobile push, D7/D30 cohort retention in admin, and a tier and pay-per-use catalogue. **None of it is compounding**, for three reasons:

1. **The site is not on the internet.** `vinaadi.com`, `vinaadi.ai`, `vinaadi.app`, `www.vinaadi.ai` and `app.vinaadi.ai` all return **NXDOMAIN** from 8.8.8.8 and 1.1.1.1 (checked 2026-09-26, control lookup OK). Every canonical, sitemap URL, OG tag and share-card footer points at a domain that does not exist.
2. **Nothing is measured.** `NEXT_PUBLIC_POSTHOG_KEY` is not supplied to the web Docker build or CI, web sends ~8 named events, and the user row stores no acquisition source.
3. **There is no way to pay** on web, on iOS, or before the Android app ships. The pricing page ends at a Google Play badge, while `/beta` says every feature is free.

**PM recommendation:** freeze new feature surfaces until P0 below is done. The product already has enough depth to win the Tamil daily-astrology niche. What it lacks is distribution plumbing, and most of that is days of work, not months.

> **Blind spot of this review:** it is a code read plus one DNS probe. If production runs on a host not named anywhere in the repo, P0-1 changes from "launch" to "unify the domain", and the SEO items still stand. Search Console, store listings, and whether the Play app is published are outside the repo and were not checked.

---

## 1. "Do we have all these things already?" — the ChatGPT list, checked

| Channel / asset | In code? | Evidence | Gap |
|---|---|---|---|
| Tamil astrology SEO | **Built, broken** | 127 `page.tsx`, sitemap, robots, JSON-LD on ~90 pages | Domain dead; 10 pages canonicalise to the homepage; Tamil copy invisible to crawlers; 80 double-branded titles (GRW-01…07) |
| Shareable personalised cards | **Yes** | `public-share-card.tsx`, `wrapped-share-card.tsx`, `panchangam-share-card.tsx`, `dashboard-share-card.tsx`, `mobile/src/components/ShareCard.tsx` (9:16 for WhatsApp Status / Reels) | Footers print 3 different dead domains; no attribution code (GRW-09, GRW-13) |
| WhatsApp sharing | **Partial** | `navigator.share` only | No `wa.me` fallback, so desktop and in-app browsers get nothing; shared links unfurl without an image (GRW-10, GRW-11) |
| Instagram / Reels / YouTube Shorts | **Assets only** | 9:16 renderers exist | No brand accounts: `ORG_JSONLD.sameAs: []`, no social links in `public-footer.tsx` (GRW-18) |
| Referral links | **No** | No referral, invite or `utm_` capture anywhere in backend or web | GRW-13 |
| High-intent landing pages | **Mostly yes** | `/features/daily-guidance`, `/tools/marriage-porutham-calculator`, `/tools/muhurta-calculator`, `/muhurtham-naal/[year]`, `/tools/jadhagam-generator` | `/features/*` are the ones canonicalised to the homepage (GRW-02) |
| Premium demos / sample output | **Yes** | Public tools return real results without signup (`app/api/public_tools.py`) | Result isn't carried into signup (GRW-14) |
| Testimonials | **Deliberately no** | `home-content.tsx:262` uses verifiable proofs instead (owner ruling) | Keep. Add real usage numbers once measurable (GRW-19) |
| Comparison pages | **No** | Only `/learn/vedic-vs-western` | Low priority (GRW-21) |
| App-store optimisation | **No** | No store-listing metadata in `mobile/`, app is `1.0.0` | Blocked on mobile launch (GRW-20) |
| Email capture → nurture | **Capture only** | `app/api/newsletter.py` stores addresses | Nothing ever sends to them; no unsubscribe (GRW-16) |

---

## 2. Funnel scorecard

| Stage | Grade | Strongest asset | Biggest leak |
|---|---|---|---|
| Discovery | B− (A if live) | Breadth: 27 nakshatra, dosham, pariharam, temples, festival calendar, 30 dated panchangam pages | Not live; canonical bug; English-only to Google |
| Signup | C | Google OAuth exists (`/oauth/google/*`) | Password + confirm field; no phone OTP; no `?next=` so context is lost |
| First value | A− | Free chart, porutham, muhurta, rasi palan, numerology with no account | Tool result isn't carried into the account |
| Habit | B | Personal palan, streaks, FCM push (web + mobile), Peyarchi email | No welcome or lifecycle email; newsletter never sends; no PWA manifest |
| Premium | D | Clean tier table + INR pay-per-use catalogue, RevenueCat webhook | No web checkout; Android-only; beta page contradicts gates; 3 different quota numbers |
| Retention | B | Admin D7/D30 cohorts, daily signups, feature usage | No acquisition source, so you can't tell which channel retains |
| Referral | F | Share artefacts exist | No referral mechanism or attribution |
| Return | B− | Push, calendar events rail, festival pages | Festival pages hard-coded to 2026 with Q4 2027 searches starting |

---

## 3. P0 — launch blockers (do these before any marketing spend)

### [~] GRW-01 — The domain does not resolve
- **Problem:** `vinaadi.com` / `.ai` / `.app` all NXDOMAIN. `web/app/layout.tsx:19`, `web/app/sitemap.ts:5`, `web/app/robots.ts:26` hard-code `https://vinaadi.com`.
- **Why:** zero pages can be indexed, zero shared links work, and domain age (a slow SEO factor) isn't accruing.
- **Fix:** register one domain, deploy web + API behind it, and verify it in Google Search Console and Bing Webmaster (`metadata.verification`). Submit the sitemap.
- **Acceptance:** `Resolve-DnsName <domain> -Server 8.8.8.8` returns A/AAAA; `curl -I https://<domain>/sitemap.xml` is 200; Search Console shows "Sitemap: Success".

### [x] GRW-02 — 10 public pages canonicalise to the homepage
- **Problem:** the root layout sets `alternates.canonical: BASE` (`web/app/layout.tsx:145`). Next.js passes metadata fields down to any child segment that doesn't override them. These pages export no metadata at all, so they ship `<link rel="canonical" href="https://vinaadi.com">` **and** the homepage's title and description:
  `features/daily-guidance`, `features/family-planning`, `features/chart-guidance`, `features/timing-and-decisions`, `trust/methodology`, `trust/about-vinaadi`, `tools/birth-time-rectification`, `tools/chandrashtama` (`"use client"`, so it needs a `layout.tsx`), `family`, `widget/panchangam`.
- **Why:** Google treats each one as a duplicate of `/` and drops it. Four are in the sitemap at priority 0.8–0.9, and they are the highest-intent commercial pages on the site ("Daily Personalized Astrology", methodology/trust).
- **Fix:** give each its own `metadata` (title, description, `alternates.canonical`, OG). Set `robots: { index: false }` on `widget/panchangam`. **Then remove `canonical` from the root layout**, so the next page that forgets metadata gets no canonical instead of a wrong one. Keep only the homepage's canonical in `(marketing)/page.tsx`.
- **Acceptance:** a vitest that imports every `(marketing)/**/page.tsx` (or its layout) and asserts `alternates.canonical` equals its own path. Run it once with the root canonical restored and confirm it fails. Then `curl -s <url> | findstr canonical` on the 10 URLs in prod.

### [x] GRW-03 — Analytics is dark and signups have no source
- **Problem:** `web/lib/analytics.ts` no-ops without `NEXT_PUBLIC_POSTHOG_KEY`, which is not passed as a build arg in `web/Dockerfile` or `.github/workflows/*` (`NEXT_PUBLIC_*` is baked in at build time). Web sends ~8 event names (`chart_generated`, `onboarding_step_completed`, `cta_clicked`, `app_dl_clicked`, …). There is no `signup_completed`, `public_tool_used`, `share_clicked`, `upgrade_viewed` or `paywall_hit`. `app/models/user.py` has no `signup_source` / `utm_*` / `landing_path` / `referrer`.
- **Why:** you can't answer "which page or channel produces retained users", which is the only question that should steer spend.
- **Fix:** (a) add `ARG NEXT_PUBLIC_POSTHOG_KEY` / `HOST` to the web Dockerfile and CI. (b) Capture first-touch `utm_*`, `document.referrer` and landing path into a first-party cookie, and persist it to new nullable `users.acquisition_*` columns on register (reversible migration). (c) Add ~10 funnel events: `public_tool_used{tool}`, `public_tool_result{tool}`, `signup_started{from}`, `signup_completed{method,source}`, `first_reading_viewed`, `share_clicked{surface,channel}`, `paywall_hit{feature}`, `upgrade_clicked{surface}`, `push_opt_in`, `day7_return`.
- **Acceptance:** a PostHog funnel `public_tool_used → signup_completed → first_reading_viewed` renders with non-zero counts in staging; admin `/daily` can split signups by source.

### [x] GRW-04 — One domain, one brand name everywhere
- **Problem:** web SEO says `vinaadi.com`, `app/services/panchangam_card_service.py:110-113` prints `vinaadi.ai` on every panchangam share image, and `mobile/src/components/ShareCard.tsx:105` prints `vinaadi.app`. The name also alternates between "Vinaadi" and "Vinaadi AI" (`share/porutham/[token]` titles, email subjects).
- **Why:** a forwarded image is the cheapest acquisition you'll ever get. Today it sends people to a dead address, and splits brand search across three names.
- **Fix:** add a single `PUBLIC_SITE_URL` setting consumed by backend, web and mobile, and pick one brand string.
- **Acceptance:** `rg -n "vinaadi\.(ai|app)\b"` returns only intentional hits; a rendered share PNG shows the live domain.

### [x] GRW-05 — Premium story contradicts itself; no one can pay outside Android
- **Problem:**
  - `/beta` (`BETA.page_free_b`) says *"Every feature is unlocked for now"*. The server enforces caps via `is_premium()` in `ask_vinaadi_usage_service`, `birth_profile_service`, `family_vault_service`, `goals_service` and `reports`: registered = 7 Ask/day, 3 profiles, 1 vault member, 3 goals.
  - The Ask upgrade modal says *"You've used your 3 free questions today"* (`dashboard-ask-vinaadi.tsx:244`). `tier_limits.py` says 7, and the recorded 2026-07-03 decision says 2 (ladder 1/2/5), still unimplemented.
  - The recorded decision "Wrapped share card is free for registered" contradicts `tiers.ts` `annualWrappedShareEnabled: false` for `registered`.
  - "Upgrade" goes to `/pricing`, which says *"Premium is managed through Google Play. Download the app"*. There is no web checkout (`web/PAYMENT.md`: "No web payment code exists"), no iOS badge, and `mobile` is `1.0.0` with no store metadata.
- **Why:** a user who hits a limit the beta page said didn't exist, then lands on a store badge they can't use, leaves and doesn't trust the next prompt. This is the whole Premium stage.
- **Fix (decision needed, see §7):** either (A) **true open beta**: lift server caps behind one `open_beta` flag, hide Upgrade, and collect "notify me at launch" intent; or (B) **paid now**: remove the "everything free" copy and add web checkout. For India that means **Razorpay (UPI + cards + UPI Autopay for subscriptions)** writing to the same `Subscription` table the RevenueCat webhook writes, so `is_premium()` stays the single source. Either way, make the Ask quota one number from one constant and render it from the API (`chipsRemaining` already comes back), never from copy.
- **Acceptance:** `rg -n "3 free questions"` → 0; a test asserts the modal copy interpolates the server limit; a paid path exists on web or the Upgrade button is absent.

---

## 4. P1 — SEO that turns the existing content into traffic

### [ ] GRW-06 — Tamil content is invisible to search engines
- **Problem:** language comes only from a cookie (`web/lib/server-lang.ts`). Googlebot sends no cookie, so it indexes English only. The root `alternates.languages` maps `en` **and** `ta` to the same URL. There are ~524 KB of Tamil marketing copy (`lib/marketing-i18n`) that no search engine can reach, and only 28 of 77 literal page titles contain any Tamil script.
- **Why:** the highest-volume queries in this niche are Tamil script: இன்றைய ராசி பலன், திருமண பொருத்தம், நல்ல நேரம் இன்று, முகூர்த்த நாள் 2027, பஞ்சாங்கம். An English-only index concedes them to incumbents (Tamil calendar apps, Drik Panchang, AstroSage).
- **Fix:** serve Tamil at its own URL. Least disruption: a `/ta/...` mirror via middleware rewrite that sets the language from the path (cookie still wins for the toggle UX but never for URL-addressed pages). Emit reciprocal `hreflang` (`en`, `ta`, `x-default`) per page and add `ta` URLs to the sitemap. Start with the 6 highest-intent templates: rasi palan, panchangam/[date], porutham, muhurtham-naal/[year], nakshatra, festival calendar.
- **Acceptance:** `curl https://<domain>/ta/panchangam/2026-10-01` returns `<html lang="ta">` with a Tamil `<title>` and no cookie sent; Search Console → International Targeting shows no hreflang errors.

### [x] GRW-07 — Titles render "… | Vinaadi | Vinaadi"
- **Problem:** the root template is `"%s | Vinaadi"`, and 80 page titles already end in `| Vinaadi`. Only 1 uses `title.absolute`.
- **Why:** it burns ~10 of ~60 visible SERP characters on every page.
- **Fix:** strip the suffix from the 80 titles (or switch those to `absolute`). Add a test that no `title:` literal contains `| Vinaadi`.
- **Acceptance:** that test, run once before the fix to see it fail.

### [~] GRW-08 — Sitemap is hand-maintained and has drifted
- **Missing:** `/pricing`, `/beta`, `/family`, `/tools/chandrashtama`, 23 of 27 `/natchathiram/*/visual`, the `/features` and `/tools` hubs (if they exist). **Stale soon:** `TAMIL_CALENDAR_EVENTS` are hard-coded `-2026`. Searches for "2027 Tamil calendar", "2027 muhurtham" and "pongal 2027" start in October.
- **Also:** `WEBSITE_JSONLD.potentialAction` is a `SearchAction` whose target has no `{search_term_string}`, which is invalid structured data, so remove it. `ORG_JSONLD.sameAs: []` stays empty until GRW-18.
- **Fix:** generate the sitemap from the route tree plus the content registries, add a year parameter to the festival pages, and publish 2027 before 1 Oct.
- **Acceptance:** a test diffs `sitemap()` URLs against indexable `page.tsx` routes; a Rich Results test on the homepage shows no errors.

### [~] GRW-09 — Shared links unfurl without an image
- **Problem:** there are no `opengraph-image.tsx` routes. `share/porutham/[token]` overrides `openGraph` without `images`, so it loses the root OG image too, and uses `twitter: summary`. `panchangam/[date]` does the same. A WhatsApp paste shows a bare text link.
- **Fix:** add `next/og` `ImageResponse` routes for `share/porutham/[token]` (names + score dial), `panchangam/[date]` (tithi/nakshatra/nalla neram), and `natchathiram/[slug]`.
- **Acceptance:** the WhatsApp / Facebook Sharing Debugger shows a 1200×630 preview for each.

---

## 5. P1 — Loop mechanics (signup, habit, referral)

### [~] GRW-10 — WhatsApp is the channel; give it a first-class button
- **Problem:** every share path is `navigator.share`, which isn't available on most desktop browsers and some in-app webviews. There is no `wa.me/?text=` fallback anywhere.
- **Fix:** a single `ShareButtons` component with a WhatsApp button (`https://wa.me/?text=<encoded text + url>`), `navigator.share`, and copy link. Pre-fill a Tamil or English message per surface. The daily panchangam card is the one to optimise, since families forward it every morning.

### [ ] GRW-11 — Daily panchangam as a forwarding habit
- **Problem:** the pieces exist (`/share/panchangam`, `panchangam-share-card`, `/widget/panchangam`, `/api/v1/public/panchangam-share-card`) but aren't packaged as a daily ritual.
- **Fix:** a "Today's panchangam image" at a stable URL (`/panchangam/today.png`), a push at ~6 am with a one-tap forward, and the card footer carrying the live domain plus a `?src=wa_panchangam` tag. This is the organic loop the Tamil calendar incumbents grew on.

### [ ] GRW-12 — Carry the tool result into signup
- **Problem:** `/login` reads no `next` or `mode` param. 12 of 17 tool CTAs link to `/dashboard`, and none hands over the birth details the visitor just typed. They are asked again in onboarding.
- **Fix:** stash the tool input (in `sessionStorage`, never in the URL) and have `/login?mode=signup&next=/dashboard/...&from=porutham_tool` prefill onboarding from it, so the first dashboard view shows **their** chart.
- **Acceptance:** an e2e test: porutham tool → "Save this" → signup → dashboard shows the same names with no re-entry.

### [x] GRW-13 — Referral + attribution
- **Fix (minimum viable):** a per-user `ref` code, `?ref=` captured into the first-touch cookie from GRW-03, and every share URL and card footer auto-tagged. Reward something that costs little and is on-brand. For example, both people get +1 family-vault slot or a month of extended rasi-palan window, not cash. Admin: "signups by referrer".
- **Don't:** leaderboards or streak shaming (the owner's "reflective artifacts, not gamification" rule in `MARKETING_PLAN.md` §1).

### [~] GRW-14 — Signup friction for the actual buyer
- **Observation:** registration is email + strong password + confirm password, with Google OAuth when configured. The family decision-maker for porutham and muhurtham is often 45+ and phone-first.
- **Fix:** make Google the primary button, drop the confirm-password field (show/hide already exists), and plan **phone OTP** (MSG91 / Firebase Phone Auth) as the next auth method. Measure with `signup_started → signup_completed` from GRW-03 before and after.

### [x] GRW-15 — PWA manifest
- **Problem:** no `web/app/manifest.ts`. Web push already works via `lib/firebase-messaging.ts`.
- **Fix:** add a manifest with the Tamil name, icons and `start_url=/dashboard`, so Android Chrome offers "Add to Home screen". It's the cheapest "app" until the Play release.

### [ ] GRW-16 — Email is capture-only
- **Problem:** `NewsletterSubscriber` rows are written and never read. There's no consent timestamp and no unsubscribe token, which matters under India's DPDP Act 2023. Transactional email covers password reset, the existing-account reminder and Peyarchi alerts only. There's no welcome or lifecycle email.
- **Fix:** (a) add `consented_at` and `unsubscribe_token` (reversible migration). (b) Send a welcome email (what to expect, set up push, add a family member) and a day-3 "your first week" email. (c) Send a weekly "your week ahead" digest built from the personal palan and the festival calendar. Use a provider with deliverability tooling (SES / Postmark) rather than raw SMTP.

---

## 6. P2 — Brand, store, and content breadth

| ID | Item | Note |
|---|---|---|
| [ ] GRW-17 | **Performance of public pages.** The root layout awaits `cookies()` + `headers()`, so every marketing page is dynamic with no CDN cache. After GRW-06 moves language into the path, the marketing tree can go static/ISR. | Core Web Vitals and crawl budget |
| [ ] GRW-18 | **Brand social accounts** (Instagram, YouTube, WhatsApp Channel), then fill `sameAs` and the footer. Feed them from the existing 9:16 renderers: daily panchangam, weekly rasi palan, peyarchi explainers. | Assets already exist |
| [ ] GRW-19 | **Real social proof** once GRW-03 lands: "N families plan with Vinaadi", ratings from the Play listing. Keeps the owner's no-fake-testimonial rule. | |
| [ ] GRW-20 | **ASO** at Play launch: Tamil + English listing, keyword-led title ("Vinaadi – Tamil Jathagam & Panchangam"), 9:16 screenshots from the share renderers. | Blocked on mobile v1 |
| [ ] GRW-21 | **Comparison / alternative pages** ("Thirukanitham vs Vakya panchangam", "Why porutham scores differ between apps"). Frame them as lineage choices, not "they're wrong" (standing rule). | Moat content |
| [ ] GRW-22 | **Partnerships:** temple pages (`/temples/*`) and muhurtham-naal are natural hooks for wedding halls, priests and jewellers. Give partners a `?ref=` code (GRW-13). | Offline → online |

---

## 7. Business / product calls the owner must make

1. **Beta or paid?** (GRW-05) Pick one this week. My recommendation: **stay open beta until GRW-01/02/03 are live and there are ~4 weeks of retention data**, with server caps lifted and "notify me at launch" collected. Then launch paid with Razorpay on web and Play Billing on Android. Pricing the product before knowing D30 is guessing.
2. **Price points.** ₹149/mo and ₹999/yr are in range for Indian consumer subscriptions. The **pay-per-use catalogue (₹29–₹179) is the better first monetisation for this audience**: porutham and jadhagam are event-driven purchases (a wedding, a birth), not daily habits. Make PPU work on web first.
3. **North-star metric.** Suggest **weekly readers**: users who open their personal daily reading on ≥3 days a week. Signups is a vanity number, and revenue lags too far to steer by.
4. **Scope freeze.** The product surface (numerology, baby names, friendship, temples, 27 nakshatra visuals, 3 festival calendars) is already wider than the incumbents' web presence. Every week spent adding depth before P0 is a week of zero compounding.

---

## 8. Suggested sequence (≈ 8 weeks, one engineer)

| Week | Items | Exit check |
|---|---|---|
| 1 | GRW-01, GRW-02, GRW-04, GRW-07 | Domain live, Search Console verified, canonical test green |
| 2 | GRW-03, GRW-05 (decision + copy/quota fix) | Funnel visible in PostHog; no contradictory copy |
| 3–4 | GRW-06 (6 templates), GRW-08, GRW-09 | `/ta/` pages indexed; festival 2027 live by 1 Oct |
| 5 | GRW-10, GRW-11, GRW-12 | WhatsApp share on every card; tool → signup keeps data |
| 6 | GRW-13, GRW-15, GRW-16 | Referral codes attributed; welcome email sending |
| 7–8 | GRW-05 payments (if paid), GRW-14, GRW-17 | First web payment in Razorpay test mode end-to-end |

---

## 9. What is already strong (keep it)

- **Free value before signup** is real, not a teaser: 25 public endpoints (`app/api/public_tools.py`).
- **Content breadth with doctrine discipline**: draft slugs are excluded from the sitemap (`DRAFT_GUIDE_SLUGS`), and the baby-name page has a lower priority because its canon is unreviewed. That honesty is a trust asset.
- **Privacy-first analytics design** (`web/lib/analytics.ts`: no autocapture, no session recording, opaque IDs). It only needs a key.
- **Positioning** ("calm, method-transparent Tamil astrology for real decisions, family-aware") is differentiated from the fear-driven incumbents. Keep saying it everywhere.
- **Admin retention cohorts** already exist (`app/api/admin_analytics.py` `/retention`).
