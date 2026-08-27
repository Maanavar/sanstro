# Vinaadi — Marketing / Public Site System Reference

**Document 2 of 2.** Companion document: `docs/VINAADI_DASHBOARD_SYSTEM_REFERENCE_2026-08-25.md`
**Date:** 2026-08-25 · **Repo:** `D:\sanstro` · **Branch at time of writing:** `harden/production-readiness`
**Scope:** the public site at `vinaadi.com` — everything in the `(marketing)` route group — and the
public backend it calls.

> **How to read this.** §1–§6 are the product/business/marketing layer — what the site is, every
> page, what each does, and how acquisition and conversion work. §7–§10 are the engineering layer.
> §11 is an as-built route and API reference. §12 is my own findings and recommendations —
> **proposals, not shipped state.**

---

## Table of contents

1. [What the public site is for](#1-what-the-public-site-is-for)
2. [The acquisition and conversion model](#2-the-acquisition-and-conversion-model)
3. [Site map — all 121 route files](#3-site-map--all-121-route-files)
4. [Every page, explained](#4-every-page-explained)
5. [The free tools in detail](#5-the-free-tools-in-detail)
6. [Bilingual system, chrome and search](#6-bilingual-system-chrome-and-search)
7. [SEO architecture](#7-seo-architecture)
8. [Rendering strategy and data flow](#8-rendering-strategy-and-data-flow)
9. [Tech stack](#9-tech-stack)
10. [Testing and quality gates](#10-testing-and-quality-gates)
11. [Appendix A — route and public API reference](#11-appendix-a--route-and-public-api-reference)
12. [Appendix B — findings, risks and recommendations](#12-appendix-b--findings-risks-and-recommendations)

---

## 1. What the public site is for

**Vinaadi** is a Tamil-first, bilingual Vedic astrology companion. It computes Thirukanitham
(true-position, drik) sidereal charts from Swiss Ephemeris, applies doctrine sourced to named
classical texts and reviewed by a practising astrologer, and answers real questions — what is today
like, when should I act, is this match good, what should I name my child — in plain Tamil or English.

The signed-in dashboard is the product. **The public site has three jobs, in this order:**

1. **Be found.** Rank for the Tamil-language astrology queries people actually type — *"indraiya
   panchangam"*, *"sevvai dosham"*, *"muhurtham naal 2027"*, *"jadhagam porutham"*, *"pournami 2026"*.
   This is why the site carries 121 route files, of which ~90 are content.
2. **Be useful before asking for anything.** Every headline tool works end-to-end with no account —
   a full chart, a 10-porutham match, a muhurta window, a numerology profile. The bet is that
   accuracy is the demo.
3. **Convert at the moment of value.** Sign-up prompts are contextual — they appear when a result
   has just been delivered and the natural next question ("what about tomorrow? what about my whole
   family?") requires an account.

It also carries the load-bearing trust and legal surfaces (methodology, about, privacy, terms),
the pricing page, share landings for results sent between family members, and an embeddable
panchangam widget.

---

## 2. The acquisition and conversion model

### 2.1 The funnel as the code implements it

```
 SEO / share link
      │
      ▼
 Content page  ──────────────►  Free tool  ──────────►  Result
 (dosham, natchathiram,          (no account,            │
  panchangam, temple,             rate-limited            │  ContextualSignupCta
  learn, tamil-calendar)          per IP)                 │  fires here
      │                              ▲                    ▼
      │  in-content links            │              /login (signup)
      └──────────────────────────────┘                    │
                                                          ▼
                              Onboarding (birth profile) ──► /dashboard
                                                          │
                                          Registered ─────► Premium ₹149/mo · ₹999/yr
                                                          └─► Pay-per-use ₹29–₹179
```

Two secondary loops:

- **Newsletter** — `POST /newsletter` from the home page "Stay connected" section. Email capture
  for people not ready to sign up.
- **Share loop** — a porutham result becomes a tokenised public link (`/share/porutham/{token}`)
  and a panchangam becomes a share card (`/share/panchangam`). A family member receives a real
  result page, not an invite — and lands inside the acquisition funnel.

### 2.2 The guest experience

A signed-out visitor is not treated as anonymous. `useGuestStore` persists a chosen **rasi** in
localStorage, so the site can personalise rasi palan and daily content without an account. Tier
limits define guest explicitly: 0 saved profiles, today-only rasi palan window, 2 Ask Vinaadi
questions per day, ads enabled, and — importantly — **pay-per-use enabled**, meaning a guest can
buy a report without subscribing.

### 2.3 Contextual conversion

`ContextualSignupCta` ([web/components/contextual-signup-cta.tsx](web/components/contextual-signup-cta.tsx))
takes a `variant` and renders bilingual copy specific to what the reader just did. This is the
opposite of a global banner: the pitch after a porutham result differs from the pitch after a
panchangam lookup, because the unmet need differs.

### 2.4 App distribution

`StoreBadges` / `GooglePlayBadge` appear on the home page and pricing page, pointing at the Expo
mobile app. The mobile app shares the same backend and the same `@vinaadi/shared` client.

### 2.5 Beta positioning

`/beta` exists as a live page: "Every feature free while we refine Vinaadi. Your feedback shapes
v1." The footer links to it. The product is positioned as an open beta at the time of writing,
which is consistent with the pricing page showing plans that are largely aspirational.

---

## 3. Site map — all 121 route files

Every page lives in the `(marketing)` route group. **The parentheses are stripped from the URL** —
the group exists purely so these routes share a layout that loads `marketing.css` (~117 KB) which
no dashboard file references. Signed-in routes therefore never download it.

| Section | Routes | Count |
|---|---|---|
| **Home** | `/` | 1 |
| **Features** | `/features/{daily-guidance, family-planning, chart-guidance, timing-and-decisions}`, `/family` | 5 |
| **Tools** | `/tools/{marriage-porutham-calculator, jadhagam-generator, daily-panchangam-planner, muhurta-calculator, indraiya-rasipalan, numerology-calculator, baby-name-finder, birth-time-rectification, friendship-compatibility, chandrashtama}` | 10 |
| **Natchathiram** | index + 27 nakshatra pages + 27 `/visual` variants | 55 |
| **Dosham** | index + 5 detail + `[slug]` | 7 |
| **Yogam** | index + `[slug]` | 2 |
| **Pariharam** | index + 7 detail + `[slug]` | 9 |
| **Temples** | index + 4 detail + `[slug]` | 6 |
| **Learn** | 6 articles | 6 |
| **Panchangam** | `/panchangam/today`, `/panchangam/[date]` | 2 |
| **Tamil Calendar** | index + 4 category pages + `[event]` | 6 |
| **Muhurtham Naal** | index + `[year]` | 2 |
| **Trust & legal** | `/trust/methodology`, `/trust/about-vinaadi`, `/privacy`, `/terms` | 4 |
| **Commerce** | `/pricing` | 1 |
| **Share & embed** | `/share/panchangam`, `/share/porutham/[token]`, `/widget/panchangam` | 3 |
| **Other** | `/beta`, `/notifications` | 2 |
| **Total** | | **121** |

Five of these are dynamic patterns (`[slug]`, `[year]`, `[date]`, `[event]`, `[token]`) that expand
to hundreds of real URLs — the panchangam route alone contributes 30 sitemap entries at any time.

---

## 4. Every page, explained

### 4.1 Home — `/`

[web/components/home-content.tsx](web/components/home-content.tsx) (34 KB). Nine sections, numbered
in the source:

| # | Section | What it does |
|---|---|---|
| 1 | **Hero** | Positioning, primary CTA, plus a live **sample "Your day" card** (`#sample`) — the product shown, not described |
| 1b | **Social proof** | Trust signals |
| 2 | **What Vinaadi does** | The three-or-four-thing value summary |
| 3 | **Daily Guidance** (`#how-it-works`) | The core daily loop |
| 4 | **Family Planning** (`#family`) | The family/multi-chart proposition |
| 5 | **Tools preview** | Entry points into the free tools |
| 6 | **How it works** | Mechanism — birth details → chart → guidance |
| 7 | **Method & Trust** | Thirukanitham, ephemeris, doctrine sourcing → `/trust/methodology` |
| 8 | **CTA** (`#get-started`) | Primary conversion block |
| 9 | **Stay connected** (`#connect`) | Newsletter capture **merged with** app-store download |

Anchored section ids mean the nav and inbound links can deep-link into the page.

### 4.2 Feature pages — `/features/*` and `/family`

Four narrative pages, one per pillar of the product, each backed by its own i18n module
(`feat-daily.ts` 11 KB, `feat-chart.ts`, `feat-timing.ts`, `feat-family.ts`):

- **`/features/daily-guidance`** — the Today surface: score, windows, one-minute reading.
- **`/features/family-planning`** — multi-chart family work.
- **`/features/chart-guidance`** — the chart engine and its explanations.
- **`/features/timing-and-decisions`** — muhurta, activity timing, decision briefs.
- **`/family`** — the family vault proposition as its own destination (linked from the Features nav
  dropdown with its own description).

### 4.3 Free tools — `/tools/*`

Ten tools. Full treatment in [§5](#5-the-free-tools-in-detail). Each follows the same shape:
a server `page.tsx` owning metadata and static SEO copy, a `PageContent` component for prose, and a
`Tool` client component for the interactive part. That split is what lets the *same* `Tool`
component be reused inside the dashboard — `RasippalanTool` and `MuhurtaTool` are imported directly
by the dashboard's Tools tab.

### 4.4 Natchathiram — 55 routes

The largest content block: an index plus **27 nakshatra pages, each with a `/visual` variant**.
Backed by `lib/natchathiram-data.ts` (**557 KB**) and `natchathiram-data-en.ts` (153 KB) — by a wide
margin the largest data files in the repo.

Each page covers the star's nature, lord, pada breakdown, character, career and relationship
indications, and compatible/incompatible stars. The `/visual` variants render the 27 nakshatra SVG
gems and a graphical treatment ([web/components/natchathiram-visual.tsx](web/components/natchathiram-visual.tsx), 49 KB).

**Naming follows Tamil almanac usage.** The URL slug is the Sanskrit transliteration (`/krittika`)
but the search index and display carry the Tamil name (*Karthigai*), with the Sanskrit form as a
search keyword. This is a recorded doctrine ruling, and it is also correct SEO — people search both.

### 4.5 Guide hubs — Dosham · Yogam · Pariharam · Temples

Four encyclopedia sections sharing one content store,
[web/lib/guide-detail-content.ts](web/lib/guide-detail-content.ts) (**351 KB**), and one detail
renderer (`guide-detail-page.tsx`). Each has an index page with JSON-LD, hand-authored detail pages
for the high-value slugs, and a `[slug]` catch-all for the rest.

| Hub | Hand-authored detail pages |
|---|---|
| **Dosham** — `/dosham` | Sevvai (Mars), Kala Sarpa, Naga Sarpa, Kalathra, Pithru |
| **Yogam** — `/yogam` | (index + `[slug]` only) |
| **Pariharam** — `/pariharam` | Thirumana Thadai (marriage obstruction), Sevvai dosha, Naga dosha, Rahu-Ketu, Ayul (longevity), Kadan (debt), Puthra (progeny) |
| **Temples** — `/temples` | Thirunallar, Thirumananjeri, Arupadai Veedu, Pancha Bhoota Sthalams |

Each hand-authored page has its own dedicated i18n module of 12–38 KB — `dosham-kalathra.ts` alone
is 38 KB. This is real editorial content, not templated filler.

**`DRAFT_GUIDE_SLUGS`** marks slugs that exist but are not astrologer-reviewed; the sitemap
**excludes them**. Draft content is reachable but not promoted — a good discipline.

### 4.6 Learn — six articles

`/learn/vedic-vs-western` · `what-is-porutham` · `what-is-thirukanitham` · `what-is-chandrashtama` ·
`how-to-read-a-jadhagam` · `why-birth-time-matters`.

`vedic-vs-western` is deliberately ranked highest in the sitemap (0.8 vs 0.7): it is the orientation
article and the only one addressed to a reader with no Vedic vocabulary at all, which makes search
its primary route in. That reasoning is written into the sitemap source.

### 4.7 Panchangam — `/panchangam/today` and `/panchangam/[date]`

The highest-frequency-intent surface on the site.

- `/panchangam/today` is a **server redirect** to today's dated URL, so the canonical page is always
  date-addressed and cacheable.
- `/panchangam/[date]` is a **server component** that fetches the backend directly (server-to-server
  via `BACKEND_URL`, bypassing the browser proxy) with `next: { revalidate: 3600 }` — hourly ISR.
- **`generateMetadata` fetches the real panchangam** and writes the tithi and nakshatra into the
  page title and description. Search results therefore show the actual day's contents, not a
  template. This is the strongest single SEO decision on the site.
- Default location is **Chennai** (13.0827, 80.2707, Asia/Kolkata), with a date picker and a "set
  your city" prompt in the description.
- Renders tithi, nakshatra, yogam, karanam, weekday, Tamil date, moon phase, soolam direction,
  parigaram, nethiram, jeevan, amirdhadhi yogam, Hijri date, plus a share card and a Thirukanitham
  provenance badge.

### 4.8 Tamil Calendar — `/tamil-calendar`

Index + `[event]` + four curated category pages: `hindu-festivals-2026`, `christian-festivals-2026`,
`muslim-festivals-2026`, `tamil-nadu-government-holidays-2026`.

The `[event]` route covers 14 recurring observances — pournami, amavasai, pradosham, ekadhasi,
sankatahara chathurthi, chathurthi, sashti, ashtami, navami, karthigai, thiruvonam, maadha
sivarathiri, chandra darisanam, karinaal — each as a year page (`/tamil-calendar/pournami-2026`).

Backed by `app/data/panchangam_events_2026.py` (25 KB), `calendar_categories_2026.py` (23 KB) and
`tamil_calendar_authority.py`. Sitemap priority is high (0.85–0.88) and change frequency weekly.

Note the inclusiveness: Christian and Muslim festival pages sit alongside Hindu ones. That is a
correct read of what a Tamil Nadu calendar is expected to carry.

### 4.9 Muhurtham Naal — `/muhurtham-naal` and `/muhurtham-naal/[year]`

Curated, verified Tamil wedding dates by year, with JSON-LD. `LATEST_MUHURTHAM_NAAL_YEAR` drives
the nav label so the link always reads the current year. Sitemap ranks 2027 and the index at 0.9
and 2026 at 0.75 — forward years matter more, because nobody searches for last year's wedding dates.

Backed by `app/data/muhurtham_naals.py` (17 KB) and `muhurtham_naal_service.py`. This is a genuinely
differentiated content asset: verified dates are what families actually want and what is hardest
to fake.

### 4.10 Trust and legal

- **`/trust/methodology`** — how the calculation works: Thirukanitham, Swiss Ephemeris, the
  `thirukanitham-2026-v1` version string, doctrine sourcing. Included in the visual regression
  suite, which signals its importance.
- **`/trust/about-vinaadi`** — who is behind it.
- **`/privacy`**, **`/terms`** — legal, with copy shared from `packages/shared/src/data/legal.ts` so
  web and mobile cannot drift.

### 4.11 Pricing — `/pricing`

[web/components/pricing-plans.tsx](web/components/pricing-plans.tsx) plus a comparison table whose
rows are **generated from the shared `TIER_LIMITS` constants** — the numbers on the pricing page
cannot drift from the numbers the backend enforces. Carries JSON-LD and a Google Play badge.

Three columns: **Guest** · **Registered (free)** · **Premium**. Premium ₹149/month or ₹999/year.
Pay-per-use reports (₹29–₹179) and Ask Vinaadi top-ups (₹49) are shown as complementary, not
alternative.

### 4.12 Share and embed

- **`/share/porutham/[token]`** — a tokenised public view of a porutham result. Rate-limited at
  30/min per IP. Lets a match be sent to family without either party holding an account.
- **`/share/panchangam`** — a shareable panchangam card, daily in the sitemap.
- **`/widget/panchangam`** — an **iframe-embeddable** widget: no nav, no footer, minimal chrome,
  configured entirely by URL params (`date`, `lat`, `lng`, `tz`, `lang`). This is a distribution
  channel — any Tamil site can embed Vinaadi's panchangam and each embed is a backlink and an
  impression.

### 4.13 Other

- **`/beta`** — open beta positioning, linked from the footer.
- **`/notifications`** — a notification inbox. **This is a signed-in surface sitting inside the
  marketing route group** (it calls `useSession` and `GET /api/v1/notifications`). See §12.

---

## 5. The free tools in detail

All ten work with no account. Each is rate-limited per IP by
[app/core/public_endpoint_limiter.py](app/core/public_endpoint_limiter.py), with budgets tuned to
actual compute cost.

| Tool | Route | What it does | Backend | Limit |
|---|---|---|---|---|
| **Marriage Porutham** | `/tools/marriage-porutham-calculator` | 10-porutham match by star or by full birth details, with per-porutham reasons and a verdict; FAQ JSON-LD | `POST /public/porutham`, `/porutham/by-star`, `/porutham/by-star/grid` | 10/min |
| **Jadhagam Generator** | `/tools/jadhagam-generator` | Full natal chart — rasi, navamsa, planets, dignities | `POST /public/chart`, `/chart-preview` | 10/min |
| **Daily Panchangam Planner** | `/tools/daily-panchangam-planner` | Panchangam for a chosen date and place | `GET /public/panchangam`, `/panchangam/monthly` | 30/min |
| **Muhurta Calculator** | `/tools/muhurta-calculator` | Best window for a named activity; a personalised variant when birth details are given | `POST /public/muhurta`, `/muhurta/personalized` | **5/min** (heaviest) |
| **Indraiya Rasipalan** | `/tools/indraiya-rasipalan` | Today's forecast per rasi; grid view for all 12 | `GET /public/rasi-palan`, `/rasi-palan/grid` | 30/min |
| **Numerology Calculator** | `/tools/numerology-calculator` | Full profile, object numbers, personal-year cycle | `POST /public/numerology/{profile, number, personal-year}` | 30/min |
| **Baby Name Finder** | `/tools/baby-name-finder` | Pada-akshara-correct names with meanings | `POST /public/numerology/baby-names[-preview]` | 30/min |
| **Friendship Compatibility** | `/tools/friendship-compatibility` | Non-marital compatibility between two people | `POST /public/friendship-compatibility` | 10/min |
| **Birth Time Rectification** | `/tools/birth-time-rectification` | Narrow an uncertain birth time against known life events | rectification service | — |
| **Chandrashtama** | `/tools/chandrashtama` | When the moon transits the 8th from your star | panchangam | — |

Also public: `POST /public/compare` and `POST /public/compare/pdf` (3/min — PDF generation is
expensive), `GET /public/muhurtham-naals`, `/panchangam-events`, `/calendar-categories`,
`/panchangam-share-card`, and `GET /places/search` at 60/min because it fires on every debounced
keystroke of an autocomplete.

The limiter **fails open** on an unknown endpoint key, which is the right default — an unrecognised
name should not block legitimate traffic — but see §12.

**Reuse note.** `RasippalanTool` and `MuhurtaTool` are imported by the dashboard's Tools tab and
wrapped in a `NovaToolIsland` for theming. One implementation serves both the public funnel and the
paid product; a fix to the tool lands in both places at once.

---

## 6. Bilingual system, chrome and search

### 6.1 The i18n split

[web/lib/marketing-i18n.ts](web/lib/marketing-i18n.ts) is a **barrel over 63 per-page modules**.
The split was a deliberate performance fix: before it, every route downloaded all 63. Because
`package.json` declares `sideEffects: ["*.css"]`, webpack can now tree-shake the modules a given
route does not use. The recorded saving was **−477 KB per route**. The barrel is kept so the ~63
existing import sites are unchanged.

`mt(str, lang)` is the accessor. It routes Tamil through `normalizeTamilAstroText`, a normaliser
that enforces consistent Tamil astrological spelling across pages.

**Governing rules** (recorded owner rulings, not style preferences):

- **Active language only.** No faint second-language echo under a title. This was proposed and rejected.
- **Tamil almanac naming over Sanskrit** in display. Sanskrit forms survive as search keywords and
  URL slugs.
- **Family-name spellings are fixed** — never re-spell a surname.

### 6.2 Chrome

**`PublicNav`** ([web/components/public-nav.tsx](web/components/public-nav.tsx)) — three keyboard-
accessible dropdowns (Features, Tools, Guide), then direct links to Natchathirams, Pricing, Learn
and Method, plus the language toggle and Sign in. Two labels are computed live: the Muhurtham Naal
entry carries `LATEST_MUHURTHAM_NAAL_YEAR`, the Tamil Calendar entry carries the current year.

Accessibility done properly: the dropdown is a **plain disclosure, not `role="menu"`**, so
`aria-expanded` reflects real state and it works by keyboard (Tab/Enter/Escape) and on touch, not
only CSS `:hover`. It opens on hover, focus or click; closes on Escape, on blur out of the group,
or on a second click. The mobile menu is a separate grouped list with `aria-controls`/`aria-expanded`
wiring.

**`PublicFooter`** — link groups plus a beta link.

### 6.3 Site search

[web/lib/search-index.ts](web/lib/search-index.ts) (13 KB) — a **client-side index over seven
categories**: Nakshatra, Dosham, Yogam, Temple, Pariharam, Tool, Page.

Each entry carries `en`, `ta`, a `kw` keyword string and an `href`. The keyword field is what makes
it work across spelling variance: *Karthigai* is findable as `krittika` **and** `karthikai`;
*Thiruvathirai* as `ardra` **and** `arudra`. Tamil astrological terms have no single Latin
transliteration in common use, and this field is the accommodation.

Exposed via `SiteSearch` in the nav.

---

## 7. SEO architecture

### 7.1 Sitemap

[web/app/sitemap.ts](web/app/sitemap.ts) is generated, not hand-maintained, and is the clearest
statement of content priority in the repo:

| Priority | Content |
|---|---|
| 1.0 | Home |
| 0.9 | Daily guidance & family-planning features, porutham, jadhagam generator, muhurta calculator, muhurtham naal (current + next year), tamil calendar, rasipalan |
| 0.88 / 0.85 | Tamil calendar categories / events |
| 0.8 | Chart & timing features, panchangam planner, BTR, friendship, numerology, **daily panchangam pages (30 days, `changeFrequency: daily`)**, guide hub indexes, natchathiram pages, `learn/vedic-vs-western` |
| 0.7 | Guide detail pages, other learn articles, natchathiram `/visual` variants, share/panchangam, methodology |
| 0.6 | About, **baby-name-finder** |
| 0.4 | Privacy, terms |

Two judgements encoded here are worth surfacing to anyone doing marketing:

- **The 30 rolling daily panchangam URLs regenerate every build** with `lastModified: new Date()`
  and `changeFrequency: daily`. This is a deliberate freshness signal on the highest-frequency-intent
  content on the site.
- **Baby Name Finder is ranked 0.6, below every launched tool**, with an inline comment explaining
  why: the pada canon and name corpus are still unreviewed. Content that has not passed astrologer
  review is deliberately not promoted. Draft dosham slugs are excluded from the sitemap entirely.

### 7.2 Robots

[web/app/robots.ts](web/app/robots.ts) — explicit allow-list of the content sections; disallows
`/dashboard`, `/dashboard/`, `/api/`. Sitemap declared at `https://vinaadi.com/sitemap.xml`.

### 7.3 Structured data

JSON-LD is present on: `/dosham`, `/yogam`, `/pariharam`, `/temples`, `/tamil-calendar`,
`/muhurtham-naal`, `/pricing`, and `/tools/marriage-porutham-calculator` (an **FAQ** block).

### 7.4 Per-page metadata

Every marketing `page.tsx` exports `metadata` with a title, a description and — where relevant —
`alternates.canonical` pointing at the `https://vinaadi.com` URL. Metadata is deliberately written
for the Tamil-English search reality: *"Free Tamil Birth Star Porutham Preview"*, *"Tamil Panchangam
{date} — Tithi, Nakshatra & Muhurtham | Vinaadi"*.

The panchangam route's `generateMetadata` is the standout — it fetches real data so the title and
description carry the actual tithi and nakshatra for that date.

### 7.5 Content moat

The defensible asset is volume of *reviewed* Tamil astrological content:

- 557 KB + 153 KB of nakshatra data (27 stars × full treatment × 2 languages)
- 351 KB of guide detail content (dosham / yogam / pariharam / temples)
- ~63 per-page bilingual i18n modules, several over 30 KB each
- 17 KB of curated, verified muhurtham naal dates
- 48 KB of Tamil calendar event and category data

This is not scraped or generated filler. Combined with the calculation engine behind the tools, it
is the reason the site can rank on substance rather than on link-building.

---

## 8. Rendering strategy and data flow

### 8.1 Rendering

Next.js 15 App Router. **No route uses `export const revalidate` or `export const dynamic`** — the
strategy is instead:

| Page type | How it renders |
|---|---|
| Content pages (natchathiram, dosham, learn, temples, features…) | **Static** — data is in TS modules, no runtime fetch |
| `/panchangam/[date]` | **Server component + fetch-level ISR** (`next: { revalidate: 3600 }`), fetching `BACKEND_URL` server-to-server |
| `/panchangam/today` | Server redirect to the dated URL |
| Tools | Server `page.tsx` for metadata + SEO copy; `"use client"` `Tool` component fetching on interaction |
| `/widget/panchangam` | Fully client, configured by URL params, no chrome |
| `/notifications` | Fully client, session-authenticated |

The consistent pattern — server page owns metadata and static prose, client component owns the
interaction — means every tool page is fully indexable even though the tool itself is JavaScript.

### 8.2 Two different backend paths

This is worth being precise about, because the site uses **both**:

```
Client tool components
  fetch("/api/backend/api/v1/public/…")
     → Next route handler  web/app/api/backend/[...path]/route.ts
        → FastAPI          (forces charset=utf-8 on JSON so Tamil never mis-decodes)

Server components (/panchangam/[date])
  fetch(`${BACKEND_URL}/api/v1/public/panchangam?…`, { next: { revalidate: 3600 } })
     → FastAPI directly, server-to-server, no proxy hop
```

### 8.3 Backend surface

Public routers are mounted **without** the CSRF dependency (they take no cookie auth):
`public_tools` (74 KB, 26 endpoints), `places`, `geo`, `content`, `newsletter`, `stats`,
`daily_snapshot`, `webhooks`, `porutham_shares` (partially).

Defence in depth on these: the global `RateLimitMiddleware` (120 req/60 s by default) **plus**
per-endpoint per-IP budgets. When a reverse proxy is in front, `trusted_proxy_count` tells the
limiter how far into `X-Forwarded-For` to look for the real client IP — without it, every request
would appear to come from the proxy and the limiter would be useless.

---

## 9. Tech stack

Identical to the dashboard's — one Next.js application serves both, split by route group.

| Concern | Choice |
|---|---|
| Framework | **Next.js 15** App Router, **React 19**, **TypeScript 5** |
| Styling | **Hand-written CSS**. `marketing.css` (~117 KB) holds the "Clarity" system: `.cl-*`, `.clf-*`, `.mk-*`, `.site-*`, `.as-*`. **No Tailwind, no shadcn/ui, no Radix** — and none may be added |
| Icons | **lucide-react** + a local `marketing-icons.tsx` |
| Images | `next/image` |
| Motion | **framer-motion 12**, `prefers-reduced-motion` respected |
| Analytics | **posthog-js** |
| Forms | **react-hook-form** + **zod 4** |
| Package manager | **pnpm 11** workspaces (`web`, `mobile`, `packages/*`) |
| Backend | **FastAPI** + **PostgreSQL** + **Swiss Ephemeris** (see Document 1 §9) |

Shared code: `packages/shared` (typed API client, tier constants, legal copy, nakshatra data,
formatters) and `packages/design-tokens`.

---

## 10. Testing and quality gates

| Gate | Covers the public site how |
|---|---|
| **Visual regression** (`web/tests/visual/quality-gates.spec.ts`) | Snapshots of **home**, **features/daily-guidance** and **trust/methodology** across chromium, mobile-safari and a reduced-motion profile |
| **CSS A/B harness** (`e2e/css-ab.spec.ts`) | Captures home, login, natchathiram, features/daily-guidance, learn/what-is-porutham, trust/methodology and four tool pages in **light and dark × desktop and mobile** |
| **axe** (`@axe-core/playwright`) | Contrast gate — see the caveat below |
| **`pnpm qa:colors`** | Colour-literal ratchet — new raw hex outside the token layer fails |
| **ESLint** | `--max-warnings=0` |
| **Vitest** | 76 web test files, 682 tests (shared with the dashboard) |
| **`docs/PUBLIC_SITE_QA_CHECKLIST.md`** | Manual pre-release pass |

**Accessibility caveat, recorded in the repo:** the axe gate as configured effectively checks colour
contrast, so other ARIA defects can ship silently. A browser axe run once found 42 failing nodes
*after* static token math had cleared the palette. The nav's disclosure pattern and aria wiring are
hand-verified, not gate-verified.

The manual pre-delivery checklist the project uses: reflow at 375 / 768 / 1024 / 1440, visible
focus, `prefers-reduced-motion`, no emoji as icons.

---

## 11. Appendix A — route and public API reference

### 11.1 Full route table

**Home & features** — `/` · `/features/daily-guidance` · `/features/family-planning` ·
`/features/chart-guidance` · `/features/timing-and-decisions` · `/family`

**Tools** — `/tools/marriage-porutham-calculator` · `/tools/jadhagam-generator` ·
`/tools/daily-panchangam-planner` · `/tools/muhurta-calculator` · `/tools/indraiya-rasipalan` ·
`/tools/numerology-calculator` · `/tools/baby-name-finder` · `/tools/birth-time-rectification` ·
`/tools/friendship-compatibility` · `/tools/chandrashtama`

**Natchathiram** — `/natchathiram` · `/natchathiram/{ashwini, bharani, krittika, rohini, mrigashira,
ardra, punarvasu, pushya, ashlesha, magha, purva-phalguni, uttara-phalguni, hasta, chitra, swati,
vishakha, anuradha, jyeshtha, mula, purva-ashadha, uttara-ashadha, shravana, dhanishtha, shatabhisha,
purva-bhadra, uttara-bhadra, revati}` · each `+ /visual`

**Guides** — `/dosham` · `/dosham/{sevvai-dosham, kala-sarpa-dosham, naga-sarpa-dosham,
kalathra-dosham, pithru-dosham, [slug]}` · `/yogam` · `/yogam/[slug]` · `/pariharam` ·
`/pariharam/{thirumana-thadai, sevvai-dosha-pariharam, naga-dosha-pariharam, rahu-ketu-pariharam,
ayul-pariharam, kadan-pariharam, puthra-pariharam, [slug]}` · `/temples` ·
`/temples/{thirunallar, thirumananjeri, arupadai-veedu, pancha-bhoota-sthalams, [slug]}`

**Learn** — `/learn/{vedic-vs-western, what-is-porutham, what-is-thirukanitham, what-is-chandrashtama,
how-to-read-a-jadhagam, why-birth-time-matters}`

**Calendar & panchangam** — `/panchangam/today` · `/panchangam/[date]` · `/tamil-calendar` ·
`/tamil-calendar/[event]` · `/tamil-calendar/{hindu-festivals-2026, christian-festivals-2026,
muslim-festivals-2026, tamil-nadu-government-holidays-2026}` · `/muhurtham-naal` ·
`/muhurtham-naal/[year]`

**Trust, legal, commerce** — `/trust/methodology` · `/trust/about-vinaadi` · `/privacy` · `/terms` ·
`/pricing`

**Share, embed, other** — `/share/panchangam` · `/share/porutham/[token]` · `/widget/panchangam` ·
`/beta` · `/notifications`

### 11.2 Public API (no auth, no CSRF)

All under `/api/v1`. Per-IP budgets in parentheses.

| Endpoint | Method | Budget |
|---|---|---|
| `/public/chart`, `/public/chart-preview` | POST | 10/min |
| `/public/porutham`, `/porutham/by-star`, `/porutham/by-star/grid` | POST | 10/min |
| `/public/compare` | POST | 10/min |
| `/public/compare/pdf` | POST | **3/min** |
| `/public/friendship-compatibility` | POST | 10/min |
| `/public/muhurta`, `/public/muhurta/personalized` | POST | **5/min** |
| `/public/panchangam`, `/public/panchangam/monthly` | GET | 30/min |
| `/public/rasi-palan`, `/public/rasi-palan/grid` | GET | 30/min |
| `/public/panchangam-share-card` | GET | 30/min |
| `/public/muhurtham-naals` | GET | 30/min |
| `/public/panchangam-events`, `/panchangam-events/{event}` | GET | 30/min |
| `/public/calendar-categories`, `/calendar-categories/{category}` | GET | 30/min |
| `/public/numerology/{profile, number, personal-year, baby-names, baby-names-preview}` | POST | 30/min |
| `/places/search` | GET | 60/min |
| `/geo/…` | POST | fallback only |
| `/porutham-shares/{token}` | GET | 30/min |
| `/newsletter` | POST | global limiter |
| `/stats/public` | GET | global limiter |
| `/content/nakshatra/{n}` | GET | global limiter |
| `/daily-snapshot` | GET | global limiter |

---

## 12. Appendix B — findings, risks and recommendations

**These are my own assessments and proposals. Nothing in this section describes shipped
behaviour.** Ordered by my read of severity.

### 12.1 Correctness and placement

**F1 — `/notifications` is a signed-in surface living in the marketing route group.** It calls
`useSession` and `GET /api/v1/notifications`, but it sits under `(marketing)` — so it loads the
117 KB marketing stylesheet, is not covered by the `middleware.ts` auth guard (which matches only
`/dashboard/*`, `/admin/*` and `/login`), and is not disallowed in `robots.ts`. A signed-out
visitor reaching it gets a `useSession` bootstrap failure and a hard `window.location` bounce to
`/login`, rather than a clean redirect. *Recommendation:* move it to `/dashboard/notifications` (it
then inherits the guard, the dashboard CSS and the workspace chrome), or at minimum add it to the
middleware matcher and the robots disallow list. **This is the clearest defect in the marketing tree.**

**F2 — The per-endpoint limiter fails open on unknown keys.** Correct as a default for legitimate
traffic, but it means a typo in a `@public_endpoint_rate_limit("…")` decorator silently removes the
tighter budget on an expensive endpoint, leaving only the 120/min global limit. Nothing catches
this. *Recommendation:* keep the runtime fail-open, and add a startup assertion (or a unit test)
that every decorator string in `app/api/` exists in `_ENDPOINT_CONFIG`. Five lines, closes the class.

**F3 — `/panchangam/[date]` accepts any date string.** The format is regex-validated in
`generateMetadata`, but the route is a dynamic segment with no `generateStaticParams` and no
`dynamicParams: false`, so arbitrary `/panchangam/<anything>` URLs are crawlable and each triggers a
backend fetch. *Recommendation:* return `notFound()` on a malformed or out-of-range date, and cap
the accepted window (say ±2 years). Otherwise this is both a thin-content surface for crawlers and
an unmetered path to an ephemeris computation.

### 12.2 SEO and content

**F4 — No `hreflang` for a bilingual site.** Tamil and English are served from the *same* URL with
a client-side toggle and a cookie. Search engines therefore see one language per crawl and cannot
be told the other exists. For a site whose entire differentiation is Tamil-language content, this
is the biggest unrealised SEO opportunity on the page. *Recommendation:* evaluate `/ta/…` and
`/en/…` prefixed routes with reciprocal `hreflang` annotations. This is a significant change — it
touches every route and every internal link — so it deserves a measurement first: check Search
Console for which language actually gets served to crawlers today.

**F5 — Structured data is thin relative to the content.** JSON-LD is on 8 pages. The 27 nakshatra
pages, 6 learn articles and ~17 guide detail pages carry none. *Recommendation:* add `Article`
schema to Learn, `FAQPage` to the guide detail pages (they already answer questions in that shape),
and `Event` to the Tamil calendar event pages. The FAQ block on the porutham tool already proves the
pattern works here; this is mostly mechanical.

**F6 — The rolling 30-day panchangam window regenerates only at build time.** `panchangamDateEntries()`
computes from `new Date()` when the sitemap module runs. On a statically built deployment that means
the window freezes at build time and slowly goes stale until the next deploy. *Recommendation:*
confirm the sitemap route is dynamic in production; if it is not, either force it dynamic or add a
scheduled rebuild.

**F7 — No OpenGraph images verified.** Metadata carries titles, descriptions and canonicals. I did
not find `openGraph.images` in the pages I read. For a product whose growth loop is *sharing a
result with family over WhatsApp*, the share preview image is the conversion surface.
*Recommendation:* the share-card infrastructure already exists (`panchangam-share-card.tsx`,
`public-share-card.tsx`, `share_card_service.py`) — wire it into `generateMetadata` as a dynamic OG
image for the panchangam and porutham share routes at minimum. **Highest commercial return of
anything in this list.**

### 12.3 Product and conversion

**F8 — Ten tools, nine in a dropdown.** The nav Tools dropdown is nine items deep, and the home
page's tools preview is a separate curation. There is no `/tools` index page.
*Recommendation:* add one — it is a natural ranking target for *"tamil astrology tools"* and a
better destination for the nav's parent item than a hover-only menu.

**F9 — Beta positioning and pricing sit side by side.** `/beta` says every feature is free while
the product is refined; `/pricing` presents a three-tier ladder with real prices. Both are linked
from primary chrome. A visitor can reasonably read these as contradictory.
*Recommendation:* decide which is the current message and make the other subordinate — e.g. keep
`/pricing` as the plan reference but banner it with the beta status, or move `/beta` out of the
footer into a dismissible strip. This is a positioning call for the owner, not an engineering one.

**F10 — The widget is a distribution channel with no attribution.** `/widget/panchangam` is
embeddable by any site and carries "no nav, no footer, minimal chrome". That means no logo, no link
back, and no way to count embeds. *Recommendation:* add a small, non-intrusive "Powered by Vinaadi"
link and a `?ref=` param, then track it. An embeddable panchangam on Tamil community sites is a
genuinely good growth channel and it is currently untracked.

**F11 — Draft content is reachable but unranked, with no on-page signal.** `DRAFT_GUIDE_SLUGS`
correctly keeps unreviewed slugs out of the sitemap, but a reader who arrives via an internal link
sees no indication that the content has not passed astrologer review. Given that the entire brand
claim is reviewed accuracy, this is a trust risk. *Recommendation:* render a visible "draft —
pending astrologer review" note on those pages, or `noindex` them and remove internal links until
reviewed.

### 12.4 Performance and maintainability

**F12 — Two very large data modules.** `natchathiram-data.ts` at **557 KB** and
`guide-detail-content.ts` at **351 KB**. The i18n barrel was already split for exactly this reason
(−477 KB/route), and these are larger than what was split. If a single natchathiram page imports the
whole 557 KB module, that page is carrying 26 stars it will never render.
*Recommendation:* measure first (the repo already has `scripts/i18n-split.mjs` as a precedent), then
split per-slug if the measurement confirms it. Note the recorded gotcha: **a UTF-8 BOM once hid the
38 heaviest files from the measuring script** — check encoding before trusting the numbers.

**F13 — The visual regression suite covers 3 of ~90 content pages.** Home, one feature page, and
methodology. The CSS A/B harness covers ten. A styling regression on the natchathiram, dosham or
tamil-calendar templates would ship unnoticed. *Recommendation:* add one representative snapshot
per *template* — natchathiram detail, guide detail, tamil-calendar event, panchangam date, one tool.
Five snapshots would cover the great majority of the site by template, which is the right unit here.

**F14 — `marketing.css` is one ~117 KB file.** Already correctly scoped away from the dashboard, but
within the public site every page loads all of it. *Recommendation:* low priority given it is
cached across navigations, but worth measuring against Core Web Vitals on a first mobile visit from
search — which is the site's single most important load.

---

*Prepared 2026-08-25 against branch `harden/production-readiness`. Every factual claim above was
read from the source on that branch; §12 is analysis, not description.*
