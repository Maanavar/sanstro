# Vinaadi AI Mobile — Final Decisions (Owner's Call)

**Decided by:** acting PM + Design + CMO, full ownership.
**Reads with:** `MOBILE_APP_PLAN.md` (build) + `MOBILE_UX_STRATEGY.md` (UX). This doc
**overrides** both where they conflict.
**Status:** LOCKED — build to this.
**Date:** 2026-06-14

---

## 0. The one-paragraph verdict

Vinaadi AI mobile is a **Tamil-first daily astrology companion**: it owns the user's morning
(panchangam + rasi palan, free, ad-supported, no login) and converts that daily habit into
**personalized AI guidance from the user's own birth chart** (free account), then monetizes
seriously through **paid reports and, later, astrologer/devotional commerce — not ads.**
Ads are a floor, not the floor plan. We launch guest-first to build the audience and the
daily habit cheaply, then turn that audience into accounts and paying users.

---

## 1. The decision that changes everything: ads are NOT the business

My earlier note leaned on ads. As CMO I'm correcting that. **Indian ad eCPMs are among the
lowest in the world** — a pure ad model needs *millions* of DAU to matter. Meanwhile the
Indian astrology market is a multi-thousand-crore business and the money is made elsewhere:

**The Indian astrology monetization stack (by revenue power):**
1. **Astrologer consultation** (pay-per-minute chat/call) — the giant (this is how AstroTalk
   became huge). High revenue, but needs an astrologer *supply* operation. **Phase 3.**
2. **Devotional / remedy commerce** — book a pooja, order pariharam items, temple offerings
   (the Sri Mandir model). **We already own this content** (`temples/*`, `pariharam/*`).
   **Phase 2–3.**
3. **Paid one-time reports** (IAP) — detailed jadhagam, porutham, year-ahead. **We already
   have the report engine.** **MVP/Phase 2 — fastest real revenue.**
4. **Subscription** — unlimited personalized guidance, ad-free. **Phase 2.**
5. **Ads** — monetize guests who never pay. The floor. **MVP.**

**Decision:** MVP earns from **ads (floor) + one paid report IAP**. We architect for
subscription (Phase 2) and consultation/commerce (Phase 3) from day one but don't build them
yet. We do **not** pretend ads are the destination.

---

## 2. Positioning & brand (locked)

**Category:** Daily Tamil astrology + panchangam companion.
**Positioning line (internal):** *"Your private astrologer in your pocket — computed
precisely with Thirukanitham, available every morning, no queue, no judgment."*
**The wedge vs the market:**
- vs **AstroTalk / human-consult apps:** instant, private, 24/7, computed-not-guessed,
  free to start. (They win on human trust; we win on speed, privacy, cost, daily habit.)
- vs **AstroSage / Clickastro (report tools):** we're a *daily* habit, not a one-off report.
- vs **Sri Mandir (devotional):** we're guidance-led, with devotion as a remedy layer.
**Brand voice:** warm, respectful, Tamil-cultural, never fear-mongering. We *guide*, we don't
scare. (This is also a store-approval + trust advantage.)
**Trust pillars to surface:** "Thirukanitham-precise," transparent methodology, privacy
("your chart never leaves you / is yours to delete").

---

## 3. Market & language (locked)

- **Launch market:** Tamil Nadu + **Tamil diaspora** (Singapore, Malaysia, Sri Lanka, Gulf,
  US/UK). Diaspora = higher ad eCPM + higher willingness to pay; do not ignore them.
- **Language at launch:** **Tamil-first, English available** (contracts already bilingual —
  near-zero cost). Default to Tamil, let user switch.
- **The scale play (post-PMF):** the engine is language-agnostic — **Telugu, Kannada, Hindi,
  Malayalam** are the expansion path to a national audience. Note now, build later. Do not
  dilute the Tamil launch by chasing this early.

---

## 4. Every open question — decided

| # | Question | DECISION | Why |
|---|----------|----------|-----|
| 1 | Guest mode in MVP? | **Yes — guest is the MVP core** | It's the cheap, viral, daily-habit + ad engine and top of funnel |
| 2 | Sequencing | **Guest-first (Phase A), then accounts (Phase B), then money tiers (Phase C)** | Fastest to DAU + retention data; de-risks everything |
| 3 | Ad network | **AdMob** (with UMP consent + ATT) | Best fill/eCPM in India; standard, store-safe |
| 4 | Widget in MVP? | **Yes — one: daily Panchangam + rasi palan** | #1 daily-habit lever; competitors do it badly |
| 5 | Tools: free vs gated | **Porutham & panchangam free; *detailed* porutham report = rewarded-ad OR paid; jadhagam full report = paid IAP** | Free hook, paid depth |
| 6 | Subscription now? | **No — Phase 2** | Prove retention first; don't gate before there's habit |
| 7 | Consultation marketplace? | **No for MVP — Phase 3** | Needs astrologer supply ops; too heavy solo now |
| 8 | Devotional/remedy commerce? | **Phase 2 pilot** (we own the content) | High-margin, culturally native, differentiates from AstroTalk |
| 9 | Chart visualisation in v1? | **No — Phase 2** | Not a daily-habit driver; heavy to build native |
| 10 | Family vault in v1? | **No — Phase 2** | Same |
| 11 | Languages day 1 | **Tamil + English** | Cheap; diaspora needs English fallback |
| 12 | Login wall on open? | **Never** | Guest must reach value in <1s |
| 13 | Data hook style | **per-domain React Query; do NOT port `usePersonalData.ts`** | Avoid importing web complexity |
| 14 | Monetization MVP | **Ads (floor) + 1 paid report IAP** | Real revenue without heavy ops |

---

## 5. The final MVP definition (this is the contract)

**Phase A — Guest daily-habit app (ship first, monetizable):**
- **Today** tab: daily rasi palan (pick rasi once, stored locally) + today's key panchangam
  (nalla neram, rahu kalam, yamagandam, thithi, nakshatra) + festival/auspicious-day note.
- **Panchangam** tab: full daily detail, swipe between days, festival calendar.
- **Tools** tab: Porutham (free result; detailed report = rewarded ad or paid) +
  friendship compatibility + muhurta lookup.
- **Daily push** (anonymous token, user-set morning time) — the retention spine.
- **One home-screen widget** (panchangam + rasi palan).
- **Share-to-WhatsApp** native cards.
- **Ads:** native in-feed + rewarded; panchangam "today" core stays ad-free above fold.
- **Soft signup prompts** at intent moments (not a wall).

**Phase B — Accounts + personalization (convert the audience):**
- Mobile auth (Bearer + refresh — see `MOBILE_APP_PLAN.md` §3), onboarding/birth profile.
- Personal **daily guidance + score**, best/caution windows, emotional weather, alerts.
- Notification settings + inbox.
- Profile/settings, multiple profiles.
- **First paid report IAP** (detailed jadhagam / year-ahead).

**Phase C — Real monetization & depth:**
- Subscription (ad-free + unlimited guidance).
- Devotional/remedy commerce pilot (pooja booking, pariharam items — uses `temples/*`,
  `pariharam/*`).
- Family vault, chart visualisation, dasha/transits, journal, Ask Vinaadi, annual wrapped.
- (Stretch) astrologer consultation marketplace.

**Web-only forever:** all SEO pages (`learn/*`, `dosham/*`, `yogam/*`, `temples/*` content,
`pariharam/*` content, `features/*`, `trust/*`, nakshatra article pages), admin, QA.
The web's job is **Google ranking + app installs**, not feature parity.

---

## 6. Go-to-market (CMO call)

**Acquisition (cheap-first, in priority):**
1. **Your existing SEO web → app installs.** You already rank/are building ~70 content
   pages. Put smart "Open in app / Install" banners + deep links on every one. This is free,
   high-intent traffic most startups would pay dearly for. **Biggest lever.**
2. **WhatsApp virality** via share cards (panchangam, rasi palan, porutham result). Tamil
   family groups share these daily. Every card watermarked + deep-linked to install.
3. **ASO** in Tamil: target "panchangam," "ராசி பலன்," "jathagam / jadhagam," "porutham,"
   "rahu kalam," "tamil calendar." These have huge volume and weak app competition in Tamil.
4. **Festival-timed campaigns** (Tamil New Year, Pongal, Deepavali, Aadi, eclipses, major
   peyarchi) — push + share + ASO spikes around them.
5. Paid (later, only after organic CAC/LTV is understood).

**Retention:** daily push + widget + streaks. Target D1/D7/D30 like a utility, not content.
**Virality:** every share card is a growth loop; instrument them.

---

## 7. Success metrics (what we judge ourselves on)

- **North star:** **DAU returning ≥4 days/week** (daily-habit proof).
- Phase A: install→first-value <60s; D7 retention ≥25%; push opt-in ≥40%; widget adds.
- Phase B: guest→account conversion ≥8–12%; onboarding completion ≥70%.
- Phase C: paying-user %, ARPU, report attach rate, subscription trial→paid.
- Ads are measured but **never** at the cost of the north star (no ad that lowers D7).

---

## 8. What I'm explicitly NOT doing (and why)

- **Not** porting the website's look/navigation — app ≠ website (see strategy doc §1).
- **Not** building astrologer marketplace in MVP — needs human-supply ops; revisit Phase 3.
- **Not** chasing multi-language before Tamil PMF — focus wins.
- **Not** gating the daily habit behind login or ads — the habit is the asset; protect it.
- **Not** treating ads as the business — they're the floor for non-payers.
- **Not** shipping chart/family/journal in v1 — they aren't daily-habit drivers.

---

## 9. Timeline (honest, solo)

Guest-first lets revenue + retention start early even though full depth takes longer.

- **Phase A (guest app, ads, widget, push):** ~6–8 weeks → first ad revenue + retention data.
- **Phase B (auth, onboarding, personal dashboard, first IAP):** ~6–8 weeks.
- **Phase C (subscription, commerce, depth):** ongoing.

Solo to a **monetizable public beta (Phase A): ~8 weeks.** Full personalized app
(A+B): ~14–16 weeks. (2 engineers ≈ halve B/C.)

---

## 10. Immediate next deliverable

A **Phase A screen-by-screen spec** (wireframe-level): every guest screen, its data sources
(mapped to real endpoints), ad slots, share hooks, and upgrade prompts — the thing we build
against. That's the next doc.
```
Today · Panchangam (day + calendar) · Tools (porutham/friendship/muhurta) ·
More/Me · Rasi picker · Onboarding-to-account · Widget · Push settings
```
```
```
