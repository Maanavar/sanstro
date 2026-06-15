# 03 — Monetization & Unit Economics

**Author hat:** CMO + Business Analyst
**Purpose:** How the app makes money, in what order, and the math that must hold.

---

## 1. Revenue model (layered, by phase)

| Layer | Mechanism | Phase | Why this order |
|-------|-----------|-------|----------------|
| **Ads (floor)** | AdMob native + rewarded + occasional interstitial | A (MVP) | Monetize guests who never pay; needs only scale |
| **Paid reports (IAP)** | One-time: detailed jadhagam, porutham, year-ahead | B | We already have the report engine; fastest *real* revenue |
| **Subscription** | Monthly/annual: ad-free + unlimited personal guidance + premium features | B/C | Recurring revenue, proven by retention |
| **Devotional commerce** | Pooja booking, pariharam items/kits, temple offerings (own `temples/*`,`pariharam/*` content) | C | High margin, culturally native, AstroTalk can't easily copy |
| **Astrologer consultation** | Pay-per-minute chat/call marketplace | C+ | Highest ceiling, needs human-supply ops |

**Principle:** ads are the *floor*, not the plan. Depth monetization (reports → subscription
→ commerce → consults) is where the business is.

## 2. Why not ads-first as the business
Indian ad eCPMs are among the world's lowest (rough order: banners ~$0.3–1, native ~$1–3,
rewarded ~$3–8 — directional, region/seasonal dependent). To net meaningful revenue on ads
alone you need **millions of DAU**. We therefore use ads to monetize the funnel top and
invest the product in depth monetization where ARPU is 10–100×.

## 3. Pricing hypotheses (to validate)

| Item | Hypothesis | Rationale |
|------|-----------|-----------|
| Detailed porutham report | ₹99–199 one-time | High-intent marriage moment; family will pay |
| Full jadhagam / year-ahead report | ₹199–499 one-time | Premium artifact, giftable |
| Subscription (India) | ₹99–149/mo or ₹699–999/yr | Below consult cost, daily value |
| Subscription (diaspora) | $4.99–7.99/mo | Hard-currency ARPU |
| Rewarded-ad unlock | free (ad view) | Monetize non-payers on the same intent |

Use **regional pricing** (Play/App Store price tiers): TN mass low, diaspora higher.

## 4. Funnel math (illustrative model — plug real numbers as they arrive)

```
Installs (month)                         100,000
→ Activated guests (reach value <60s)     70%  = 70,000
→ Daily-habit (≥4 days/wk)                25%  = 17,500   ← north star
→ Account conversion (of active)          10%  = 7,000
→ Paying (report/sub) of accounts          8%  =   560
```
- **Ad revenue** scales with the 70k guests' sessions × eCPM (the floor).
- **Direct revenue** scales with the 560 payers × ARPU (the engine).
- Both run simultaneously; a non-converting guest is still ad-profitable.

## 5. Unit economics framework (track from day 1)

| Metric | Definition | Target posture |
|--------|-----------|----------------|
| CAC | Blended cost per install (organic-heavy early) | Keep near-zero via SEO web + WhatsApp virality |
| Ad ARPDAU | Daily ad revenue / DAU | Optimize without harming D7 |
| Payer ARPU | Direct revenue / paying user | Grow via reports→sub→commerce |
| Blended ARPU | Total revenue / active user | The number that matters |
| LTV | ARPU × avg lifetime (retention-driven) | Must exceed CAC with margin |
| Payback | CAC / monthly ARPU | <3 months once paid acq starts |

**Rule:** do not start paid acquisition until **organic LTV:CAC and D30 retention** are
understood from the organic cohort.

## 6. Ad policy & placement (recap; full UX in design system + screen spec)
- Native in-feed (workhorse), rewarded (opt-in unlocks), one banner on tool results,
  interstitial only at natural breaks (capped).
- **Sacred zones (no ads):** panchangam "today" above the fold, onboarding, auth, payment.
- Compliance: ATT (iOS), UMP consent (EU), Play Data Safety, Families policy if mixed-age.
- Default: registered/premium see **far fewer/no** ads (revisit; ads are a guest mechanism).

## 7. Revenue risks
- Ad eCPM volatility / policy strikes → diversify to direct revenue early.
- IAP store fees (15–30%) → factor into pricing.
- Commerce/consults add operational + regulatory load (payments, refunds, KYC) → Phase C.
- Cultural mispricing → use regional tiers + experiments.
