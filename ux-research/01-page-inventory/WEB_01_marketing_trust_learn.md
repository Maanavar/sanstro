# Page Inventory — Web · Marketing, Trust & Learn (SEO content)

All pages below render inside `PublicNav` + `PublicFooter` (see WEB_00). All are bilingual via `useLang` + `marketing-i18n` (`mt()`). None require auth.

---

## TEMPLATE — Feature pages (`/features/*`)
Four instances sharing one layout: **daily-guidance, chart-guidance, family-planning, timing-and-decisions**.

- **Purpose:** SEO + conversion landing for each of the 4 headline features; educate + drive to `/dashboard`.
- **Inputs:** Language only. All content static/hardcoded (sample readings, scores, member names are dummy data).
- **Outputs:** Hero (eyebrow, H1, lead, 2 CTAs, sample figure w/ marketing visual), 2–3 content bands, FAQ list, related-links row, CTA strip. `daily-guidance` also emits FAQ JSON-LD schema.
- **Buttons/CTAs:** Primary → `/dashboard`; secondary ghost (varies: methodology / jadhagam-generator / daily-guidance); CTA-strip → `/dashboard`.
- **Cards:** Detail-list items (4 signals / chart items / vault items); FAQ items; callout blocks; sample hero figure (score dial, best/caution windows, chips, member score bars).
- **Widgets:** Marketing SVG visuals — `TimingArcVisual`, `PanchangamWheelVisual`, `SouthIndianChartVisual`, `FamilyOrbitVisual` (`components/marketing-visuals`).
- **Actions:** Navigate only (no forms/state).
- **Navigation (related links, per page):**
  - daily-guidance → family-planning, timing-and-decisions, learn/what-is-chandrashtama, trust/methodology
  - chart-guidance → tools/jadhagam-generator, learn/how-to-read-a-jadhagam, learn/why-birth-time-matters, trust/methodology
  - family-planning → daily-guidance, tools/marriage-porutham-calculator, timing-and-decisions
  - timing-and-decisions → daily-guidance, tools/daily-panchangam-planner, family-planning
- **Dependencies:** `marketing-i18n` (FEAT_* dicts), `marketing-visuals`, `useLang`, next/link. **No API calls.**

---

## PAGE — Pricing `/pricing`
- **Purpose:** Explain Guest / Registered / Premium tiers + one-off report pricing; drive account creation and (mobile) subscription.
- **Inputs:** Static; pulls values from `@vinaadi/shared/constants` — `TIER_LIMITS`, `SUBSCRIPTION_PLANS`, `PPU_REPORT_PRODUCTS`. Server component (has `Metadata`, no `useLang` — **English only**).
- **Outputs:** Hero; 3 plan cards (Guest INR 0 / Registered INR 0 / Premium INR{monthly} + annual savings); feature-comparison table (8 rows × Guest/Registered/Premium); "Billing and currencies" card; "One-time report options" card (4 PPU reports w/ price + description); FAQ card (3 Q&A); dark upgrade card; "Get Premium: Download the app" band.
- **Buttons/CTAs:** "Create free account" → `/login`; "Try guest mode" → `/tools/indraiya-rasipalan`; Google Play badge (live link); App Store badge (disabled — "Coming soon"); "Already subscribed? Log in" → `/login`.
- **Cards:** 3 pricing cards; comparison table; billing card; PPU reports card; FAQ card; upgrade CTA card; app-download band.
- **Actions:** Navigate; external app-store link.
- **Dependencies:** `@vinaadi/shared/constants`. Note in copy: "web app does not yet process checkout directly"; premium is App/Play Store managed.

---

## TEMPLATE — Trust pages (`/trust/*`)
Two instances: **about-vinaadi, methodology**. Long-form article layout.

- **Purpose:** Build trust — explain the calculation method (methodology) and the product philosophy/positioning (about).
- **Inputs:** Language (`useLang`, TRUST_METHOD / TRUST_ABOUT dicts). Static.
- **Outputs:** Hero (eyebrow/H1/lead, 2 CTAs, `TopicSymbolPanel` figure + belief/stack rows); article with sticky **TOC** (anchor nav); prose sections (methodology: 11 sections incl. Thirukanitham, Lahiri, Rahu/Ketu, Drik, Vimshottari, transits, panchangam, daily-score, porutham, jadhagam, interpretation philosophy; about: problem, what-it-is, how-different, what-not, early-access); callouts; related-link row; CTA strip.
- **Buttons/CTAs:** Hero → `/dashboard` + cross-link; TOC anchor jumps; related links; CTA strip → `/dashboard`.
- **Widgets:** `TopicSymbolPanel` (astro-symbols); TOC anchor list.
- **Dependencies:** `marketing-i18n`, `astro-symbols`, `useLang`. **No API.**

---

## TEMPLATE — Learn articles (`/learn/*`)
Five instances: **what-is-thirukanitham, what-is-porutham, what-is-chandrashtama, how-to-read-a-jadhagam, why-birth-time-matters**.

- **Purpose:** SEO educational explainers targeting Tamil-astrology search queries; funnel to tools/dashboard.
- **Structure (two sub-patterns):**
  - `page.tsx` (server, `Metadata` + FAQ JSON-LD) → `PageContent.tsx` client component (thirukanitham, porutham). Heavy SEO metadata (title, description, keywords[], canonical, OG, Twitter).
  - Inline single-file client page (chandrashtama, how-to-read-a-jadhagam, why-birth-time-matters).
- **Inputs:** Language; static content.
- **Outputs:** Article body (concept explanation), FAQ (rendered + JSON-LD schema for rich results), related links, CTA to dashboard/tool.
- **Buttons/CTAs:** In-article links to related tools/features/dashboard.
- **Dependencies:** `marketing-i18n` / local content, JSON-LD schema. **No API.**
- **SEO note:** These + natchathiram + tamil-calendar are the primary organic-acquisition surface.
