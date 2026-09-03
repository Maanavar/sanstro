# Page Inventory — Web · Public Tools (`/tools/*`)

Free, no-account calculators. Most are `page.tsx` (SEO metadata + FAQ JSON-LD) → a client `*Tool`/`*PageContent` component. All render inside `PublicNav`/`PublicFooter`, bilingual. Backend calls hit **`/api/v1/public/*`** (guest-safe endpoints).

---

## PAGE — Jadhagam Generator `/tools/jadhagam-generator` (`JadhagamTool.tsx`)
- **Purpose:** Generate a full Thirukanitham South Indian birth chart free, no login. SEO acquisition + funnel to dashboard.
- **Inputs (form):** Name (opt), Birth Date*, Father's name (opt), Mother's name (opt), Birth Time, Gender (Male/Female), Birth Place* (`PlaceCombobox` city search → sets lat/lng/timezone), Latitude, Longitude.
- **Outputs (on generate):** Summary strip (Lagna, Birth Star + pada, Birth Sign, Ayanamsa Lahiri°); D1 Rasi grid + D9 Navamsa grid (`RasiGrid`, South-Indian square); Planet Positions table (Planet, Degrees DMS, Nakshatra, Pada, Nak. Lord, Rasi, Navamsa, Dignity) + Lagna row; (dasha section below).
- **Buttons:** "Generate Jadhagam" (→ `POST /api/backend/api/v1/public/chart-preview`); "Export PDF" (`handleExportPdf`).
- **Cards/Widgets:** RasiGrid ×2, planet table, PlaceCombobox autocomplete.
- **Actions:** Generate chart; export PDF; error display.
- **Dependencies:** `/public/chart-preview`, PlaceCombobox (geo search), shared RASI/NAKSHATRA constants. FAQ JSON-LD.

## PAGE — Marriage Porutham Calculator `/tools/marriage-porutham-calculator` (`PoruthamTool.tsx`)
- **Purpose:** Free birth-star porutham preview; upsell to signed-in full 10-factor report.
- **Inputs:** Girl's nakshatra (27), Boy's nakshatra (27), optional pada "split" (early/late) for boundary-straddling stars. Two views: `selector` and `grid`.
- **Outputs:** 10-porutham grid/score for a chosen star vs all 27; Rajju / Vedhai / Rasi / same-Nadi cautions; per-pair detail (`getPoruthamDetail`). Effective rasi shown.
- **Buttons:** star chips; view toggle; sign-in upsell CTA (full report requires dashboard).
- **Actions:** Select stars → fetch grid/detail via shared client (`getPoruthamGrid`, `getPoruthamDetail` → `/public/porutham`).
- **Dependencies:** `@vinaadi/shared` porutham client, RASI/NAKSHATRA maps. FAQ JSON-LD.

## PAGE — Muhurta Calculator `/tools/muhurta-calculator` (`MuhurtaTool.tsx`)
- **Purpose:** Find auspicious muhurtham slots for an event within a date range.
- **Inputs:** Event type (select), From date (min today), To date (max +30 days), Location (city select).
- **Outputs:** List of auspicious slots (with star names) after submit; error state.
- **Buttons:** "Find auspicious muhurtham →" (submit → `POST /api/backend/api/v1/public/muhurta`).
- **Actions:** Submit → slot results.
- **Dependencies:** `/public/muhurta`, CITY_OPTIONS, nakshatra name helper. FAQ JSON-LD.

## PAGE — Daily Panchangam Planner `/tools/daily-panchangam-planner` (`PanchangamTool.tsx`, 821 lines)
- **Purpose:** Public daily panchangam + day-planning view for any date/location.
- **Inputs (form, multiple labels):** Date, Location, plus additional planner fields.
- **Outputs:** Full panchangam (tithi, nakshatra, yoga, karana, vara, kalam, sunrise/sunset, hora) + planning surface.
- **Buttons:** submit/fetch; (share/print likely).
- **Actions:** Fetch → `GET /api/backend/api/v1/public/panchangam?…`.
- **Dependencies:** `/public/panchangam`, panchangam i18n helpers. SEO wrapper `PanchangamPageContent`.

## PAGE — Indraiya Rasipalan `/tools/indraiya-rasipalan` (`RasippalanTool.tsx`)
- **Purpose:** Today's Tamil daily horoscope for all 12 rasis (Moon-transit based); guest personalization entry point (linked from home Rasi picker + pricing "Try guest mode").
- **Inputs:** Janma Rasi selector (12).
- **Outputs:** Daily rasi palan reading per rasi (Moon house-from-janma-rasi interpretation), Chandrashtama flag for affected rasi.
- **Buttons:** rasi select chips.
- **Actions:** Select rasi → show reading.
- **Dependencies:** Moon-transit lookup (public panchangam / shared), house-label maps. FAQ JSON-LD.

## PAGE — Friendship Compatibility `/tools/friendship-compatibility` (`FriendshipTool.tsx`)
- **Purpose:** Positive nakshatra-based friendship compatibility report between two people.
- **Inputs:** Person A + Person B (name + birth details).
- **Outputs:** Friendship report (communication, trust, energy balance, growth).
- **Buttons:** submit → report.
- **Actions:** `apiFetchJson("/api/v1/public/friendship-compatibility", …)`.
- **Dependencies:** `/public/friendship-compatibility`. (One tool using `apiFetchJson` rather than raw `fetch`.)

## PAGE — Chandrashtama `/tools/chandrashtama` (inline `page.tsx`)
- **Purpose:** Find the 8th rasi from birth Moon sign (Chandrashtama period) + per-house Moon-transit guidance.
- **Inputs:** Birth Rasi selector (12). **Client-side only — no API** (`chandrashtamaRasi = (n+6)%12+1`).
- **Outputs:** Computed Chandrashtama rasi; house-label guidance for each of the 12 Moon-transit houses.
- **Buttons:** rasi select.
- **Dependencies:** `@vinaadi/shared` RASI_LIST. Pure computation.

## PAGE — Birth-Time Rectification `/tools/birth-time-rectification` (inline `page.tsx`)
- **Purpose:** **Explainer/marketing** page for the rectification feature (the actual interactive wizard lives in the dashboard). Not interactive here.
- **Inputs:** None (static).
- **Outputs:** Hero + 4-step explanation + SVG (candidate-time narrowing) + FAQ.
- **Buttons:** "Open dashboard"/"Get started" → `/dashboard`; "Why birth time matters" → `/learn/why-birth-time-matters`.
- **Dependencies:** `marketing-i18n` (TOOL_BTR). No API.
