# Vinaadi AI — Mobile Product & UX Strategy

**Companion to:** `MOBILE_APP_PLAN.md` (implementation blueprint)
**This doc answers:** *What* the app should be and *who* it serves — not how to build it.
**Last updated:** 2026-06-14

> Core decision: the mobile app is **not** a port of the website. The website's job is
> Google ranking (SEO). The app's job is a **daily habit** + monetization. Different jobs →
> different surface. We keep the *value*, drop the *web scaffolding*, and add native
> behaviours a website can never have.

---

## 1. The principle: an app, not a website

A website replica fails on mobile because it carries baggage the app doesn't need and
misses behaviours the app must have.

**Drop (web-only forever):** top nav bars, footers, SEO long-form copy, breadcrumb pages,
"learn what is X" articles, marketing landing pages, sitemaps, contextual signup CTAs woven
into prose.

**Add (only an app can do):** bottom tab navigation, home-screen **widgets**, daily push
notifications, swipe-between-days gestures, pull-to-refresh, haptics, native date/place
pickers, offline last-good content, instant launch straight to "today", share-to-WhatsApp
cards, biometric lock.

The test for every screen: *"Would I open this every morning?"* If no, it's probably
web-only or a one-off tool, not a core tab.

---

## 2. Three audiences — and what each gets

We design for **three** tiers, not two. The middle tier (guest) is the growth + ad engine
and is the part the original plan underweighted.

### Tier A — Anonymous / Guest (NO account)
The ad-supported daily-habit app. **No login wall.** Opens straight to today's value.
Stores rasi/nakshatra + location **locally** (no account). Can receive daily push via an
anonymous device token.

They get:
- **Today's Panchangam** for their location — nalla neram, rahu kalam, yamagandam, kuligai,
  emakandam, thithi, nakshatra, yogam, karanam, sunrise/sunset. *(maps to
  `panchangam/today`, `panchangam/[date]`)*
- **Daily Rasi Palan** — pick your rasi/nakshatra once, get a daily reading.
  *(maps to `indraiya-rasipalan`, `natchathiram/*` content)*
- **Free tools** — Porutham (marriage matching), friendship compatibility, muhurta lookup,
  jadhagam generator (basic). *(maps to `tools/*`)*
- **Festival & auspicious-day calendar** — swipeable month view, "next good day for X".
- **Share cards** — beautiful WhatsApp-ready panchangam / rasi palan images.

This tier earns from **ads**. It is the funnel into Tier B.

### Tier B — Registered (free account, birth chart)
Everything in Tier A **plus** personalization driven by their actual birth chart.
The upgrade story is concrete: *generic rasi palan (1 of 12 signs)* → *guidance computed
from YOUR exact birth time and place.*

They get the dashboard value, mobile-native:
- Personal **daily guidance + score**, best/caution windows, emotional weather, alerts.
- Personalized panchangam (chandrashtama warnings, personal peyarchi alerts).
- Notification inbox + fine-grained alert settings.
- Profile/settings, multiple birth profiles.

Fewer/no ads here (or only tasteful native units) — this tier monetizes via retention and a
future subscription, not ad spam.

### Tier C — Premium (future, subscription)
Family vault, deep chart visualisation, dasha/transit timelines, journal, predictions,
Ask Vinaadi, annual wrapped, exports. **Phase 2+.** Listed here only so the tiering is
coherent; not part of MVP.

---

## 3. The guest daily-habit engine (the heart of monetization)

This is what makes people open the app every morning. Tamil astrology's natural daily loop:

```
Morning push  →  open app  →  see today's nalla neram + rahu kalam + rasi palan
              →  (scroll past 1–2 native ad units)
              →  maybe try porutham / check a good day  →  close
              ↑___________________ repeat daily ____________________
```

Design requirements for this loop:
1. **Zero friction.** No login, no splash marketing. App opens to "Today" in <1s, showing
   cached content immediately, refreshing in the background.
2. **One-time personalization without an account.** First open: "Select your rasi" + detect
   location → stored locally. That's enough for a daily reading forever.
3. **Daily push is the retention spine.** Anonymous device token + opt-in: *"இன்றைய ராசி
   பலன் & நல்ல நேரம்"* at a user-chosen morning time. This single feature drives DAU more
   than anything else.
4. **Home-screen widgets.** A panchangam/rasi-palan widget = daily impressions without even
   opening the app, and a constant brand presence. (iOS WidgetKit + Android App Widget.)
   This is a top-3 retention lever for daily-utility apps and most competitors do it poorly.
5. **Glanceable, card-based, today-centric.** Not articles. Cards you scan in 10 seconds.

---

## 4. Monetization — ads done at Apple/Google quality

Ads are for **Tier A (guests)**. The bar: never feel spammy, never block core utility,
always pass store review. Pattern, in priority order:

1. **Native in-feed ads** — blend into the rasi-palan / tools feed, clearly labelled
   "Sponsored". 1 unit per ~3–4 content cards. This is the workhorse and the least
   intrusive. (AdMob native advanced.)
2. **Rewarded ads (opt-in value exchange)** — the store-blessed money-maker. *"Watch a short
   ad to unlock your detailed porutham report / your 7-day rasi palan."* User chooses; high
   eCPM; zero resentment.
3. **One anchored adaptive banner** on tool-result screens — low yield but steady, low
   intrusion.
4. **Interstitials — sparingly.** At most one per session, only at a *natural break* (e.g.
   after viewing a full porutham result, never on app open, never mid-task), frequency-capped.

**Hard rules (so we don't get rejected or churn users):**
- **No ads on the Panchangam "today" core view above the fold** — it's the daily utility;
  keep it clean, put ads below.
- **No ads in onboarding or auth.**
- **No ads for Tier B/C** beyond an optional tasteful native unit (revisit; default off).
- iOS **App Tracking Transparency** prompt handled correctly; non-personalized ads if
  declined. GDPR/consent (UMP) for EU. Children's policy: ensure rating + no behavioural
  ads if audience skews mixed-age.
- Respect **store review**: ads must not obscure controls, no fake close buttons, no
  auto-redirect.

**Funnel framing:** ads monetize the top of funnel (guests); signup + future subscription
monetize the bottom. Both run at once. A guest who never signs up is still profitable.

---

## 5. The conversion funnel: guest → registered

The wedge is *personalization*. Place soft, contextual prompts at moments of demonstrated
intent — never a hard wall.

| Trigger moment | Prompt |
|----------------|--------|
| Viewed rasi palan 3+ days | "Your rasi covers 1/12 of people. Get guidance from YOUR exact birth chart →" |
| Opened porutham | "Save this match & get deeper compatibility — create your free chart" |
| Tapped a personal-only feature (chandrashtama, peyarchi) | "This needs your birth details — set up in 60s" |
| 7-day return streak | "You're a daily visitor 🙏 — unlock your personal daily score" |

Signup itself = the **onboarding/birth-profile** flow from `MOBILE_APP_PLAN.md` §7.2.
Pre-fill rasi/location already captured in guest mode so it feels effortless.

---

## 6. Information architecture (bottom tab bar)

Guest and registered share one shell; tabs adapt to tier.

```
┌─────────────────────────────────────────────┐
│                  [ Today ]                    │  ← default tab, opens here
├─────────────────────────────────────────────┤
│  Today  │ Panchangam │  Tools  │  More/Me     │
└─────────────────────────────────────────────┘
```

- **Today** — Guest: rasi palan + today's key panchangam + festival. Registered: personal
  daily guidance + score + alerts (rasi palan demoted to a card).
- **Panchangam** — full daily detail, swipe between days, month/festival calendar.
- **Tools** — porutham, friendship, muhurta, jadhagam, etc. (guest-usable; results may
  gate a deeper layer behind signup or rewarded ad).
- **More / Me** — Guest: settings, language, "Create account" CTA, rasi picker, about.
  Registered: profile, notification inbox, settings, sign out; (Phase 2: family, journal).

No top nav bar. No footer. No SEO pages reachable in-app (link out to web if ever needed,
e.g. privacy/terms in settings).

---

## 7. Feature mapping: web surface → mobile

| Web surface | Mobile treatment |
|-------------|------------------|
| `panchangam/today`, `panchangam/[date]` | **Core tab** (guest) — native, swipeable |
| `indraiya-rasipalan`, `natchathiram/*` content | **Today/rasi-palan** (guest) — strip the SEO article, keep the reading |
| `tools/*` (porutham, friendship, muhurta, jadhagam, rectification) | **Tools tab** (guest) — native forms, results, share |
| `dashboard/*` (personal, daily guidance, life areas, alerts) | **Registered Today + screens** — rebuild native, per-domain `useQuery` |
| `dashboard/family`, journal, predictions, dasha, ask-vinaadi, annual-wrapped | **Phase 2 / Premium** |
| `learn/*`, `dosham/*`, `yogam/*`, `temples/*`, `pariharam/*`, `features/*`, `trust/*` | **Web-only (SEO).** Not in app. Optionally surface 1–2 as light reference cards later. |
| `natchathiram/*/visual`, share cards | Reuse the *idea* as native share images; don't port the web pages |
| `admin`, `qa`, `widget/panchangam` | **Web-only** |
| `privacy`, `terms` | Link out from Settings (WebView/browser), don't rebuild |

Rule of thumb: **content that exists to rank stays on web; content people *use* becomes
native; content that needs *their chart* is the signup upgrade.**

---

## 8. Native growth surfaces (a website can't do these)

- **Home-screen widgets** (panchangam + rasi palan) — biggest daily-habit lever; build in
  an early phase, not as an afterthought.
- **Daily push** at user-chosen time — the retention spine (anonymous for guests).
- **Share-to-WhatsApp** native image cards — organic growth in Tamil family groups.
- **App Clips / Instant** (later) — try porutham without install.
- **Deep links** from push → exact screen.
- **Live Activities / notification-rich** rahu kalam countdown (later, delight feature).

---

## 9. What this means for the build plan

This strategy **adds two things** to `MOBILE_APP_PLAN.md` that change MVP scope:

1. **Guest mode is MVP, not an afterthought.** The app must be fully usable + monetizable
   with no account. That means: local rasi/location storage, anonymous device push token,
   guest-accessible panchangam + rasi palan + tools, and the ad SDK integrated from the
   start. → add to Phase 3/4.
2. **Ads + widgets + anonymous push** are net-new workstreams not in the original 8 weeks.
   Realistically this pushes a *monetizable* beta to ~12–14 weeks solo. Sequence: ship the
   guest daily-habit core first (fastest path to ad revenue + retention data), then layer
   the registered dashboard.

### Revised MVP definition
**Guest core (ship first):** Today (rasi palan + panchangam) · full Panchangam tab ·
Tools (porutham + 1–2 more) · daily push · 1 widget · ads (native + rewarded) · share cards
· soft signup prompts.
**Registered (ship second):** auth + onboarding · personal daily guidance/score ·
notification settings + inbox · profile/settings.

### Suggested phased sequencing
- **Phase A (guest habit + ads):** fastest route to DAU + revenue + real retention data.
- **Phase B (accounts + personalization):** convert the audience Phase A built.
- **Phase C (premium):** family, charts, journal, subscription.

---

## 10. Risks specific to this strategy

1. **Ad intrusion → churn or store rejection.** Mitigate with the §4 hard rules; treat the
   panchangam core view as ad-sacred.
2. **Guest mode cannibalizes signups.** Mitigate with §5 contextual upgrade prompts tied to
   personalization, not nags.
3. **Tamil rendering on Android** (shared risk; see blueprint §5) — doubly important since
   guest content is text-heavy rasi palan.
4. **ATT / consent / children's policy** misconfig → ad revenue loss or policy strike.
   Handle UMP + ATT + data-safety forms before launch.
5. **Widget/push complexity underestimated** — these are the retention levers; budget real
   time, don't bolt on at the end.

---

## 11. Open decisions for you

- [ ] Confirm **guest mode is MVP** (recommended: yes — it's the ad engine).
- [ ] Ad network: **AdMob** (recommended, best fill in India) vs alternatives.
- [ ] Which tools are guest-free vs rewarded-ad-gated vs signup-gated?
- [ ] Widget in MVP or fast-follow? (recommended: at least 1 in MVP).
- [ ] Subscription now or later? (recommended: later; prove retention first).
- [ ] Sequencing: guest-first (Phase A) vs accounts-first? (recommended: guest-first).
