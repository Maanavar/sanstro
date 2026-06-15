# 06 — Screen Spec: Phase A (Guest)

**Author hat:** Product Designer + PM
**Purpose:** The buildable spec. Each screen: purpose, layout, data, states, ads, actions,
analytics. Build against this.

Conventions: **[P0]** must-have. Ad rules per `03`/`07`. Endpoints per `08`.

---

## S0 — First-run: Rasi Picker [P0]
- **Purpose:** capture rasi/nakshatra once (local), zero friction, no account.
- **Layout:** title "உங்கள் ராசி?" → 12-rasi grid (icon + Tamil + English) → "or pick by
  nakshatra" link (27 list). Skip allowed (defaults to generic Today + prompt later).
- **Data:** none (static list). Persist choice to AsyncStorage.
- **States:** n/a (static). 
- **Ads:** none.
- **Next:** → S0b Location.
- **Analytics:** `onboarding_rasi_selected {rasi}`, `onboarding_rasi_skipped`.

## S0b — First-run: Location [P0]
- **Purpose:** get lat/lng/timezone for panchangam.
- **Layout:** "Detect my location" (primary) → permission → reverse-geocode to city; fallback
  city search (place combobox); default Chennai if denied.
- **Data:** reverse geocode; store {lat,lng,timezone,city} locally.
- **States:** permission denied → city search; geocode fail → manual.
- **Ads:** none.
- **Next:** → S1 Today + optional push opt-in card.
- **Analytics:** `onboarding_location_set {method, city}`.

## S1 — Today (Guest) [P0]
- **Purpose:** the daily habit. Everything valuable in one scroll.
- **Layout (top→bottom):**
  1. Header: date (Tamil + greg), city, language toggle.
  2. **Rasi Palan card** [ad-free zone]: today's reading for chosen rasi (headline + body),
     "share" + "change rasi".
  3. **Today's key timings card** [ad-free zone]: nalla neram, rahu kalam, yamagandam (compact;
     "see full →" → S2).
  4. **Festival/special-day** strip (if any): festival name, pournami/amavasai, chandrashtamam.
  5. — fold —
  6. **Native ad** (in-feed, labelled Sponsored).
  7. **Tools shortcuts** row (Porutham, Muhurta, Friendship).
  8. **Upgrade card** (contextual): "Get guidance from YOUR birth chart →".
- **Data:** `GET /public/rasi-palan?rasi&date&lang` *(NEW)* + `GET /public/panchangam?date&lat&lng&timezone`.
- **States:** cached-first render; skeleton on cold; offline banner uses last-good; error →
  retry with cached fallback.
- **Ads:** one native unit **below fold** only.
- **Actions:** pull-to-refresh; share card; tap timings → S2; tap tool → S4.
- **Analytics:** `today_view {tier:guest, rasi}`, `rasi_palan_share`, `upgrade_prompt_view/click`.

## S2 — Panchangam (Day) [P0]
- **Purpose:** full daily almanac, swipeable.
- **Layout:** day header with ◀ ▶ + date picker; sections (collapsible):
  Sunrise/Sunset/Solar noon · Tithi · Nakshatra · Yoga · Karana · Vara · **Nalla Neram /
  Gowri** · **Rahu Kalam / Yamagandam / Kuligai** · Abhijit · Hora · Soolam (direction +
  parigaram) · Lagnam · Amirdhadhi yogam · Chandrashtamam today · Festivals · Subha muhurtham.
- **Data:** `GET /public/panchangam` (full `PanchangamDailyResponseData` — already rich).
- **States:** skeleton per section; cached-first; error→retry.
- **Ads:** one native unit between mid sections (not above timings); banner allowed at bottom.
- **Actions:** swipe/arrows change day; share card; "jump to today"; → S3 calendar.
- **Analytics:** `panchangam_view {date}`, `panchangam_day_swipe`, `panchangam_share`.

## S3 — Panchangam Calendar (Month) [P1]
- **Purpose:** browse festivals/auspicious days at a glance.
- **Layout:** month grid; markers for festivals, subha muhurtham, pournami/amavasai; tap day → S2.
- **Data:** `GET /panchangam/monthly` *(make public)*.
- **States:** skeleton grid; error→retry.
- **Ads:** banner at bottom.
- **Analytics:** `calendar_view {year,month}`, `calendar_day_open`.

## S4 — Tools Hub [P0]
- **Purpose:** entry to guest tools.
- **Layout:** cards: **Porutham** (marriage matching), **Friendship compatibility**,
  **Muhurta finder**. Each: icon, Tamil+English title, one-line benefit.
- **Data:** none.
- **Ads:** none on hub.
- **Analytics:** `tools_hub_view`, `tool_open {tool}`.

## S5 — Porutham (Input) [P0]
- **Layout:** two birth-detail blocks (Person A/B): name, date, time(optional), place
  (combobox). Context selector (Marriage default). "Check compatibility" CTA.
- **Validation:** date bounds; place required; time optional (note reduced precision).
- **Data:** `POST /public/porutham`.
- **States:** submit loading; validation inline; 422 → field errors.
- **Ads:** none on input.
- **Next:** → S5b Result.
- **Analytics:** `porutham_submit {context}`.

## S5b — Porutham Result [P0]
- **Layout:** **free summary** (total score %, label, headline `summary` BiText, top 2–3
  kutas). Below: locked "Full report" panel (all 10 kutas, rajju/vedha/nadi dosha, remedies).
- **Unlock:** "Watch ad to unlock" (rewarded) OR "Buy full report ₹—" (IAP, Phase B for
  purchase; rewarded works Phase A). Save requires account → upgrade modal.
- **Data:** `POST /public/porutham` returns full `DirectPoruthamData`; client gates display.
- **Ads:** rewarded (unlock); banner at bottom; optional interstitial on back (capped).
- **Actions:** share result card; unlock; upgrade-to-save.
- **Analytics:** `porutham_result_view {scoreBand}`, `report_unlock {method:reward|iap}`,
  `porutham_share`.

## S6 — Friendship Compatibility [P1]
- Like S5/S5b, positive framing; `POST /public/friendship-compatibility`. Share card.

## S7 — Muhurta Finder [P1]
- **Layout:** event type picker (Marriage, Job start, Investment, Travel, Purchase, Exam,
  Medical, Spiritual), date range (≤30d), place. "Find good times" CTA.
- **Result:** top-3 slots (date, window, tithi, nakshatra, quality, reasons, cautions).
- **Data:** `POST /public/muhurta`.
- **Upsell:** "Personalized muhurta uses your chart + dasha → create account".
- **Ads:** native between results; rewarded to reveal more than top-3 (optional).
- **Analytics:** `muhurta_submit {eventType}`, `muhurta_result_view`.

## S8 — Share Card [P0] (sheet, not full screen)
- **Purpose:** WhatsApp-ready image for panchangam / rasi palan / porutham.
- **Data:** `GET /public/panchangam-share-card?date&lat&lng&timezone&city&lang`; render to
  image natively (or server image) → native share sheet.
- **Branding:** watermark + deep link to install. **Growth loop — instrument every share.**
- **Analytics:** `share_card_generated {type}`, `share_card_shared {type,target}`.

## S9 — Me (Guest) [P0]
- **Layout:** rasi (change), location (change), language toggle, push settings (time/on-off),
  **Create free account** (primary CTA with benefit), About / Trust (Thirukanitham, privacy),
  Privacy/Terms (link out), app version.
- **Data:** local prefs; `POST /devices/push-token` for push.
- **Ads:** none.
- **Analytics:** `me_view {tier:guest}`, `account_cta_click`, `push_toggle {on,time}`.

## S10 — Push Opt-in (card/sheet) [P0]
- **Trigger:** Today, after 1st–2nd session (not on first launch).
- **Copy:** "இன்றைய ராசி பலன் & நல்ல நேரம் — get it every morning?" → time picker → system
  permission → register anonymous device token.
- **Analytics:** `push_optin_prompt_view`, `push_optin_result {granted, time}`.

## S11 — Widget (home screen) [P1]
- **Content:** today's nalla neram + rahu kalam + rasi palan one-liner; tap → S1.
- **Data:** background fetch `GET /public/panchangam` (+ rasi-palan); refresh ~daily.
- **Analytics:** `widget_add`, `widget_tap` (where measurable).

---

## Global empty/error copy (Tamil-first, English fallback)
- Offline: "இணைப்பு இல்லை — சமீபத்திய தகவலைக் காட்டுகிறோம்." / "Offline — showing last saved."
- Error: "ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்." + Retry.
- Empty (no festival today): hide section, don't show empty box.
