# Page Inventory — Web · SEO Content Templates (Guide/Calendar/Nakshatra families)

These are large route families driven by shared content components + data files. Documented as template + instance list. All render `PublicNav`/`PublicFooter`, bilingual, FAQ/Article JSON-LD for SEO. Most are static content; panchangam/calendar pages fetch from `/public/*` at build/revalidate time (server components, `revalidate: 3600`).

---

## TEMPLATE — Natchathiram (nakshatra) pages `/natchathiram/*`
- **Instances:** Hub `/natchathiram` + **27 star pages** (ashwini … revati) + **27 `/visual` variants** (55 pages total).
- **Component:** `NatchathiramPageContent` (data from `lib/natchathiram-data`, e.g. `ROHINI`); visual → `NatchathiramVisualContent`.
- **Purpose:** SEO star profiles — personality, career, dasa timeline, compatible stars, spiritual guidance; `/visual` = data-viz variant (radar chart, at-a-glance scores, core strengths, career clusters, modern applications).
- **Inputs:** Static per-star data; language.
- **Outputs:** Article body + FAQ; visual pages render score bars, radar, symbol cards.
- **Buttons/Nav:** Internal links to related stars, tools, dashboard CTA.
- **Dependencies:** `natchathiram-data`, `natchathiram-page`, `natchathiram-visual`. FAQ + Article JSON-LD. **No runtime API.**

## TEMPLATE — Guide detail: Dosham `/dosham/*`
- **Instances:** Hub `/dosham` (`DoshamIndexContent`, CollectionPage JSON-LD) + 5 hand-authored pages (sevvai-dosham, kala-sarpa-dosham, kalathra-dosham, naga-sarpa-dosham, pithru-dosham — each own `PageContent` + FAQ) + dynamic `[slug]` (`GuideDetailPage` from `DOSHAM_DETAILS` via `getGuideDetail`).
- **Purpose:** Explain each dosham — meaning, chart-based calculation, effects, when cancelled, pariharam. Calm tone.
- **Inputs:** slug → content lookup; language.
- **Outputs:** Article (title, lead, calculation, effects, cancellation, pariharam w/ slokam), FAQ.
- **Nav:** Cross-links to pariharam, tools, dashboard.
- **Dependencies:** `guide-detail-content`, `guide-detail-page`. `generateStaticParams` from DOSHAM_DETAILS keys.

## TEMPLATE — Guide detail: Pariharam `/pariharam/*`
- **Instances:** Hub `/pariharam` + 7 named (ayul, kadan, naga-dosha, puthra, rahu-ketu, sevvai-dosha, thirumana-thadai) + dynamic `[slug]` (same `GuideDetailPage` mechanism).
- **Purpose:** Remedy explainers — which affliction, temple tradition, practice, slokam. Same guide-detail template as dosham.

## TEMPLATE — Guide detail: Yogam `/yogam/*`
- **Instances:** Hub `/yogam` + dynamic `[slug]` (`GuideDetailPage`).
- **Purpose:** Explain auspicious/inauspicious yogas.

## TEMPLATE — Temples `/temples/*`
- **Instances:** Hub `/temples` + 4 named (arupadai-veedu, pancha-bhoota-sthalams, thirumananjeri, thirunallar) + dynamic `[slug]`.
- **Purpose:** Temple guides tied to remedies/deities (navagraha, Murugan arupadai, pancha-bhoota, Thirunallar-Shani).

## TEMPLATE — Tamil Calendar `/tamil-calendar/*`
- **Instances:** Hub `/tamil-calendar` + 4 named festival-category pages (hindu / muslim / christian festivals 2026, tamil-nadu-government-holidays-2026) + dynamic `[event]` (14 event keys: pournami, amavasai, pradosham, ekadhasi, sankatahara-chathurthi, chathurthi, sashti, ashtami, navami, karthigai, thiruvonam, maadha-sivarathiri, chandra-darisanam, karinaal — each `{key}-2026`).
- **Component:** `TamilCalendarEventContent` (server).
- **Purpose:** All 2026 dates for each observance (weekday + Tamil date), significance, next date.
- **Inputs:** event slug + year (2026).
- **Outputs:** Date list, summary, significance; ItemList + FAQ JSON-LD.
- **Dependencies:** `GET /public/panchangam-events` + `/public/panchangam-events/{slug}` (server fetch, revalidate 1h). `generateStaticParams` for the 14 keys.

## TEMPLATE — Muhurtham Naal `/muhurtham-naal/*`
- **Instances:** Hub `/muhurtham-naal` + dynamic `[year]` (from `MUHURTHAM_NAAL_YEARS`).
- **Component:** `MuhurthamNaalContent`.
- **Purpose:** Verified Tamil auspicious wedding/ceremony dates by year.

## TEMPLATE — Public Panchangam `/panchangam/*`
- **Instances:** `/panchangam/today` (redirect/wrapper) + dynamic `/panchangam/[date]` (YYYY-MM-DD).
- **Component:** Server page (`PanchangamDatePage`).
- **Purpose:** Full public daily almanac for any date (default city Chennai).
- **Inputs:** date param (validated → redirect to /today if malformed); default lat/lng/tz Chennai.
- **Outputs:** Five Elements (tithi/vara/nakshatra/yoga/karana + Tamil date); Sun timings (sunrise/sunset/solar-noon); Inauspicious windows (Rahu Kalam, Yamagandam, Kuligai); Auspicious (Nalla Neram, Gowri Nalla Neram, Abhijit); Subha Muhurtham verdict; Festivals; Additional details (moon phase, Soolam+parigaram, Nethiram, Jeevan, Amirdhadhi yogam); Karinaal alert banner.
- **Buttons/Nav:** Prev/Today/Next date links; `PanchangamDatePicker`; "Set your city" → daily-panchangam-planner; Share (`PanchangamShareCard` WhatsApp 9:16/1:1 + legacy `PanchangamShareButton`); CTA → `/dashboard`.
- **Dependencies:** `GET /public/panchangam` (server, revalidate 1h), panchangam i18n helpers, share-card components, ThirukanithamBadge.
