# Page Inventory — Web · Shared Chrome & Home

**Scope:** The web app (`web/app/*`) — public marketing/SEO site + logged-in dashboard.
**Method:** Documentation only, read from source. No review/opinions.
**Convention:** Templated route families documented once as a template + instance list.

---

## SHARED — Public Nav (`components/public-nav.tsx`)
Rendered on every public (logged-out) page via each page's shell.

- **Purpose:** Primary top navigation + brand + language toggle + sign-in for the public site.
- **Inputs:** Language (from `useLang`); mobile-menu open/close state.
- **Outputs:** Header bar; desktop dropdown menus; mobile slide-down menu.
- **Buttons:** Hamburger menu toggle (≤1024px); dropdown triggers (Features, Tools, Guide); Lang toggle (EN/TA); "Sign in".
- **Cards:** none.
- **Menus (dropdowns):**
  - **Features →** /features/daily-guidance · /features/family-planning · /family (Family Vault) · /features/chart-guidance · /features/timing-and-decisions
  - **Tools →** /tools/marriage-porutham-calculator · /tools/jadhagam-generator · /tools/daily-panchangam-planner · /muhurtham-naal · /tamil-calendar · /tools/birth-time-rectification · /tools/indraiya-rasipalan
  - **Guide →** /dosham · /yogam · /pariharam · /temples
  - Direct links: /natchathiram · /pricing · /learn/what-is-thirukanitham · /trust/methodology
- **Widgets:** LangToggle.
- **Actions:** Navigate; toggle language; open/close mobile menu.
- **Navigation:** Brand logo → `/`; all links above; "Sign in" → `/login`.
- **Dependencies:** `marketing-i18n` (NAV strings), `lang-toggle` (`useLang`), next/link, next/image (brand assets `/brand/*`).

## SHARED — Public Footer (`components/public-footer.tsx`)
- **Purpose:** Sitewide footer navigation, legal, beta line, disclaimer.
- **Outputs:** Brand lockup + tagline; 5 link columns; bottom legal bar.
- **Menus / link columns:**
  - **Company:** /trust/about-vinaadi · /trust/methodology · /pricing · /privacy · /terms
  - **Features:** daily-guidance · family-planning · chart-guidance · timing-and-decisions
  - **Tools:** porutham · jadhagam-generator · daily-panchangam-planner · birth-time-rectification · indraiya-rasipalan
  - **Learn:** what-is-porutham · what-is-thirukanitham · what-is-chandrashtama · how-to-read-a-jadhagam · why-birth-time-matters
  - **Guide:** /dosham · /yogam · /pariharam · /temples · /panchangam · /tamil-calendar
- **Actions:** Navigate; beta line → `/beta`.
- **Dependencies:** `marketing-i18n` (FOOTER strings), `useLang`, dynamic copyright year.

---

## PAGE — Home `/` (`app/page.tsx` → `components/home-content.tsx`)
- **Purpose:** Marketing landing page. Sell the daily-guidance value prop, drive to `/dashboard`, capture guest Rasi, newsletter signup, app download.
- **Inputs:**
  - Language (`useLang`).
  - Guest Rasi selection (`useGuestStore`, persisted) via in-hero Rasi picker.
  - CTA A/B variant from `getFeatureFlag("cta_primary")` (analytics).
  - Live `charts_generated` count from `GET /api/backend/api/v1/stats/public`.
  - Newsletter email input.
- **Outputs:** 9 sections (Hero + sample reading card, Social proof counter + 3 testimonials, "What Vinaadi does" 6-card grid, Daily Guidance section + sample card, Family Planning + member score panel, Tools 4-card grid, How-it-works 3 steps, Method & Trust, CTA, Stay-connected [newsletter + app badges]).
- **Buttons / CTAs:**
  - Hero primary → `/dashboard` (label varies by A/B variant; fires `track("cta_clicked")`).
  - Hero ghost "How it works" → `#how-it-works` anchor.
  - Guest Rasi: "Pick your Rasi" trigger → opens picker; 12 Rasi chips (set rasi); "See today's Rasi palan" → `/tools/indraiya-rasipalan`; "Change"; "Cancel".
  - Section links: Daily Guidance → `/features/daily-guidance`; Family → `/features/family-planning`; Method → `/trust/methodology`; CTA → `/dashboard`.
  - Newsletter Subscribe (POST `/api/v1/newsletter`).
  - App badges: Google Play link (live); App Store badge (hidden — `APP_STORE_URL=null`). Both fire `track("app_dl_clicked")`.
- **Cards:** Sample "Your day" reading card (score dial 64, best/hold windows, arc timeline SVG, lagna·nakshatra·rasi meta); 6 "helps" cards; daily-reading card; family score panel (3 members w/ bars); 4 tool cards; 3 how-steps; 5 method items; 2 connect cards (email, app).
- **Menus:** none beyond nav/footer.
- **Widgets:** Score dial (SVG), day-arc timeline (SVG), Rasi picker, NewsletterForm.
- **Actions:** Navigate; pick guest rasi (persisted); subscribe to newsletter; download app; A/B tracked CTA.
- **Navigation:** Into `/dashboard`, `/features/*`, `/tools/indraiya-rasipalan`, `/trust/methodology`; anchors `#how-it-works`, `#top`, `#sample`.
- **Dependencies:** `marketing-i18n` (HOME), `useLang`, `useGuestStore` (RASI_LIST), `lib/analytics` (initAnalytics/track/getFeatureFlag), `lib/format` (formatClockLabel), `GET /stats/public`, `POST /newsletter`. Sample reading data is **hardcoded** (not a real chart).
