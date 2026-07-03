# Vinaadi AI — Tier Plan

**Status:** Approved · **Date:** 2026-06-27 · **Owner:** Product

**Canonical code:** `packages/shared/src/constants/tiers.ts` (TypeScript) · `app/core/tier_limits.py` (Python)

> This document is the human-readable companion to those files. When the numbers here conflict with the code, the code wins — update this doc to match.

---

## 1. Tier Overview

| | Guest | Registered | Premium |
|---|---|---|---|
| **Account required** | No | Email + password | Email + password |
| **Subscription** | None | None | ₹149/month or ₹999/year |
| **Intent** | Discover & trust | Daily driver | Power user + family |
| **Pay-per-use** | Yes (requires account creation at checkout) | Yes | Yes (for overage beyond included quota) |

---

## 2. Full Feature Matrix

### 2.1 Core Astrology

| Feature | Guest | Registered | Premium |
|---|---|---|---|
| Today's rasi palan | Today only | ±3 days | ±30 days |
| Panchangam (tithi, vara, nakshatra, karanam, kalam) | Today only | Full + share card | Full + share card |
| Today's score ring | Yes (no history) | Yes | Yes + history trend |
| Life area pulse | Today only | Today only | Full history chart |
| Chandrashtama alert | Via panchangam | Dedicated screen | Dedicated screen |
| Dasha | None | Current mahadasha + antardasha only | Full tree: mahadasha → antardasha → pratyantardasha |
| Transits | None | Current positions | Full analysis + peyarchi alerts |
| Varshaphala | No | No | Yes |
| Divisional charts (all 16 vargas) | No | No | Yes |
| Yoga / dosham education pages | Read-only | Yes | Yes |
| Nakshatra education (27 pages) | Read-only | Yes | Yes |
| Dosham education (5 pages) | Read-only | Yes | Yes |
| Pariharam content (7 pages) | Read-only | Yes | Yes |

### 2.2 Personal Charts & Profiles

| Feature | Guest | Registered | Premium |
|---|---|---|---|
| Birth profiles (saved jadhagams) | 0 — gate → create account | **3 total** | Unlimited |
| Family Vault | No | **1 extra profile** (self + 1) | **5 profiles** |
| Porutham / compatibility | Gate → register nudge | Basic 10-factor score | Full analysis + dasha bhukti comparison + remedies |
| Birth time rectification | No | No | Yes |
| Synastry panel | No | No | Yes |

> **Why 3 total, not 3/day:** A jadhagam is a permanent birth record, not a query. The natural upgrade moment is "add my newborn's chart" — not a daily friction point.

### 2.3 AI & Guidance

| Feature | Guest | Registered | Premium |
|---|---|---|---|
| Ask Vinaadi | **1 question/day** | **2 questions/day** | **5 questions/day** + top-up pack |
| Ask Vinaadi top-up pack (10 questions, ₹49) | No | No | Yes (when over daily quota) |
| Prasna (horary) | No | Yes | Yes |
| Muhurta calculator | No | Yes | Yes (unlimited) |
| Decision brief | No | Yes | Yes |
| What-if scenarios | No | Yes | Yes |
| Activity timing | No | Yes | Yes |
| Retrospective | No | No | Yes |
| Life event log | No | No | Yes |

> **Why one per-day unit across all tiers:** A single unit makes the ladder legible at a glance — 1 → 2 → 5 questions/day — and Premium is strictly superior on every axis instead of trading 7/day for 30/month. Worst-case free-tier LLM cost drops below the previous 2/day + 7/day ladder. Unlimited at ₹149/month stays off the table because LLM compute costs are real; when Premium users hit 5/day they can buy a 10-question top-up at ₹49 — much better UX than a hard block.

### 2.4 Journal, Goals & Insights

| Feature | Guest | Registered | Premium |
|---|---|---|---|
| Journal (quick-log + full entries) | No | Unlimited entries | Unlimited entries |
| Journal correlation insights | No | Yes | Yes |
| Goals | No | **3 active** | Unlimited |
| Insights tab — weekly trends | No | Current week | Full history |
| Annual Wrapped | No | Yes + share card export | Yes + full timeline & retrospective |
| Streak tracking | No | Yes | Yes |
| Retrospective | No | No | Yes |

> **Why the Wrapped share card is free:** every shared card is an acquisition surface — the share *is* the marketing. Only the deep Wrapped content (full timeline, retrospective) stays Premium.

### 2.5 Family & Relationships

| Feature | Guest | Registered | Premium |
|---|---|---|---|
| Family Vault | No | 1 additional profile | 5 profiles |
| Family aggregate score | No | No (need ≥ 2 profiles) | Yes |
| Relationship alerts | No | No | Yes |
| Synastry panel | No | No | Yes |
| Porutham (included/month) | 0 | 0 (pay-per-use) | 3 included |

### 2.6 Notifications & Communication

| Feature | Guest | Registered | Premium |
|---|---|---|---|
| Push notifications | No | Yes | Yes |
| Daily morning alert | No | Yes | Yes |
| Dasha transition alert | No | Yes | Yes |
| Peyarchi (transit) alert | No | Yes | Yes |
| Notification inbox | No | Yes | Yes |
| Smart silence | No | Yes | Yes |

### 2.7 UX Quality

| Feature | Guest | Registered | Premium |
|---|---|---|---|
| Ads | Yes (standard) | Yes (reduced — 1/session) | No ads |
| Offline mode / cached data | No | Yes | Yes |
| Share cards (panchangam, score, wrapped) | No | All, including Annual Wrapped share card | All, including Annual Wrapped share card |

### 2.8 Remedies & Pariharam

| Feature | Guest | Registered | Premium |
|---|---|---|---|
| Pariharam content (static education) | Read-only | Yes | Yes |
| Personalised remedy plan | No | No | Yes |
| Gemstone advice | No | No | Yes |

---

## 3. Pay-Per-Use Product Catalogue

Pay-per-use is available to **all tiers** (guests must create a free account at checkout). Reports are delivered in-app and to the registered email.

### 3.1 Jadhagam Reports

| Product | RevenueCat ID | Pages | Price | Contents |
|---|---|---|---|---|
| Quick Snapshot | `vinaadi.ppu.report.1page` | 1 | ₹29 | Ascendant, rasi, nakshatra, current dasha, 3 key life insights |
| Standard Report | `vinaadi.ppu.report.3page` | 3 | ₹59 | + Planetary positions, full dasha, basic varshaphala |
| Detailed Report | `vinaadi.ppu.report.5page` | 5 | ₹99 | + All divisional charts, life event windows, remedies |
| Full Portrait | `vinaadi.ppu.report.10page` | 10 | ₹179 | + Yoga/dosham analysis, muhurta windows, parihara chart |

### 3.2 Compatibility (Porutham) Reports

| Product | RevenueCat ID | Pages | Price | Contents |
|---|---|---|---|---|
| Porutham Summary | `vinaadi.ppu.porutham.1page` | 1 | ₹49 | 10-factor score + overall verdict |
| Detailed Jadhagam Porutham | `vinaadi.ppu.porutham.3page` | 3 | ₹99 | Full 10-factor + dasha bhukti comparison + remedies |

### 3.3 Ask Vinaadi Top-Up (Premium overage only)

| Product | RevenueCat ID | Quantity | Price |
|---|---|---|---|
| 10-Question Pack | `vinaadi.ppu.topup.10q` | 10 questions | ₹49 |

### 3.4 PPU Pricing Rationale

- 1-page at ₹29: impulse buy, lower than a temple prasad donation — removes price as an objection.
- 10-page at ₹179: positioned as a birthday gift or new year ritual purchase, not a daily expense.
- Porutham at ₹99: targeted at a single high-stakes marriage decision moment; family will pay without friction.
- Top-up at ₹49 for 10 questions: buying 3 packs (30 questions) = ₹147, which is barely cheaper than the monthly subscription — nudges conversion without being punitive.

---

## 4. Subscription Pricing

| Plan | RevenueCat ID | Price | Trial | Savings |
|---|---|---|---|---|
| Monthly | `vinaadi.premium.monthly` | ₹149 / month | 7 days free | — |
| Annual | `vinaadi.premium.annual` | ₹999 / year | 7 days free | 44% vs monthly |

**Savings calculation:** ₹149 × 12 = ₹1,788/year. Annual saves ₹789 = 44.1% ≈ **44%**.

*(The premium screen previously displayed 48% — corrected to 44%.)*

---

## 5. Guest Pay-Per-Use Flow

Guests have no account, so a standard RevenueCat IAP cannot be restored on device swap.

**Flow:**
1. Guest taps a pay-per-use CTA (e.g., "Get your Jadhagam Report").
2. App shows a lightweight account creation sheet: name + email + password (skip birth details for now — they're captured as part of the report order).
3. On successful account creation, the IAP sheet opens via RevenueCat.
4. Report is stored in-app against the new account and emailed to the registered address.
5. Post-purchase: "Your chart is ready — want to see your daily score too?" → conversion CTA to explore free registered features.

**Why not email-only checkout:** RevenueCat requires a logged-in user to restore purchases. Without an account, the user loses the report on uninstall. The free account is a save slot, not a paywall.

---

## 6. Upgrade Trigger Points

These are the moments where the app surfaces a conversion nudge. Each trigger maps to a specific action in `useConversionPrompt.ts`.

| Trigger | Tier affected | Gate type | Upgrade CTA |
|---|---|---|---|
| Rasi palan view × 3 | Guest | Soft (after 3rd view) | "See ±3 days — create free account" |
| 7-day visit streak | Guest | Soft | "You're on a streak! Save your history" |
| Tap jadhagam generate | Guest | Hard gate | "Create free account to save your chart" |
| Tap porutham result | Guest | Soft | "See the full 10-factor breakdown — register" |
| Birth profiles reach 3 | Registered | Hard gate | "Upgrade to Premium for unlimited charts" |
| Family Vault — add 2nd profile | Registered | Hard gate | "Upgrade for Family Vault (5 profiles)" |
| Ask Vinaadi daily limit reached | Guest / Registered | Hard gate | "Upgrade for more questions" |
| Ask Vinaadi daily limit reached | Premium | Soft (top-up offer) | "Buy 10 more questions for ₹49" |
| Dasha timeline — tap full tree | Registered | Hard gate | "Full dasha timeline — Premium only" |
| Varshaphala / vargas / synastry | Registered | Hard gate | "Unlock with Premium" |
| PPU report CTA | Guest | Soft account creation | "Create free account to buy" |
| Detailed reports over monthly quota | Premium | Soft (pay-per-use offer) | "Buy an additional report (₹99)" |

---

## 7. Backend Gating

The backend enforces limits at the API layer. Key services:

| Service | File | Current state | Required update |
|---|---|---|---|
| Ask Vinaadi chips | `app/services/ask_vinaadi_usage_service.py` | Uses `ask_vinaadi_limit_for_tier()` — currently guest 2/day, registered 7/day, premium 30/month | Change the ladder in `app/core/tier_limits.py` + `packages/shared/src/constants/tiers.ts` to guest 1/day, registered 2/day, premium 5/day (premium ₹49 top-up unchanged, now triggered by the daily quota) |
| Birth profiles | `app/services/birth_profile_service.py` | No count gate | Add check against `birth_profiles_max` from `get_limits(tier)` |
| Family Vault | `app/services/family_vault_service.py` (TBC) | Unknown | Add check against `family_vault_profiles_max` |
| Goals | `app/services/goals_service.py` (TBC) | Unknown | Add check against `goals_max` |

---

## 8. What Registered Users Do NOT Get (Common Misconceptions)

These features are often assumed to be "free" but are Premium-only:

- Full dasha timeline (only current maha + antar shown to registered)
- Varshaphala
- Any divisional chart (vargas)
- Life area history/trend charts
- Remedy suggestions (personalised)
- Synastry panel
- Retrospective
- Life event log
- Birth time rectification
- Deep Wrapped content — full timeline & retrospective (the Wrapped share card itself is free for all registered users)
- No ads (registered users still see ads, at reduced frequency)

---

## 9. Open Questions (Future Sprints)

| Question | Priority | Notes |
|---|---|---|
| Diaspora pricing (USD/GBP/SGD/AUD/CAD) | P1 | App Store price tiers should be set; ₹149 → ~$2.99 is very compelling for diaspora |
| Devotional commerce tier (Phase C) | P2 | Pooja booking, pariharam kits — separate revenue stream |
| Astrologer marketplace tier (Phase C+) | P3 | Human consultation layer — requires ops |
| Free trial conversion tracking | P1 | 7-day trial → paid conversion rate is the key metric |
| PPU → subscription upsell | P1 | If a user buys 3 PPU reports, auto-surface "₹149/month includes 5 reports + everything else" |
| Web guest mode | P0 | Web currently forces login — CEO/CPO review flagged this as the single biggest acquisition gap |
