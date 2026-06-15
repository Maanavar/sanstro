# 09 — Analytics & KPIs

**Author hat:** Business Analyst + Growth
**Purpose:** What we measure, how we define it, and the events that produce it.

---

## 1. North Star
**Weekly Active Habit:** users returning **≥4 days/week**. Everything ladders to this — a
daily-utility app lives or dies on habit, not installs.

## 2. KPI tree
```
North Star: ≥4-day/week returners
├─ Acquisition
│   ├─ Installs (by source: SEO web, WhatsApp share, ASO, paid)
│   ├─ Activation rate (reach first value <60s)
│   └─ Share virality (K-factor from share cards)
├─ Engagement / Retention
│   ├─ D1 / D7 / D30 retention
│   ├─ Sessions/user/week
│   ├─ Push opt-in rate & push→open rate
│   └─ Widget adds
├─ Conversion
│   ├─ Guest→account rate
│   └─ Onboarding completion
└─ Monetization
    ├─ Ad ARPDAU, fill, eCPM (without harming D7)
    ├─ Report unlock rate (reward vs IAP)
    ├─ Payer %, Payer ARPU, Blended ARPU
    └─ LTV : CAC, payback
```

## 3. Targets (initial, revise with data)
| Metric | Target |
|--------|--------|
| Activation (<60s value) | ≥70% |
| D1 / D7 / D30 | ≥45% / ≥25% / ≥12% |
| Push opt-in | ≥40% |
| Push → open | ≥15% |
| Guest → account | ≥8–12% |
| Onboarding completion | ≥70% |
| Crash-free sessions | ≥99.5% |
| Share K-factor | >0.2 (each user brings 0.2 installs) |

## 4. Event taxonomy (snake_case; props in {})
**Lifecycle:** `app_open {tier}`, `session_start`, `first_value_reached {ms}`.
**Onboarding:** `onboarding_rasi_selected {rasi}`, `onboarding_rasi_skipped`,
`onboarding_location_set {method,city}`.
**Today:** `today_view {tier,rasi}`, `rasi_palan_view`, `rasi_palan_share`,
`upgrade_prompt_view {context}`, `upgrade_prompt_click {context}`.
**Panchangam:** `panchangam_view {date}`, `panchangam_day_swipe {dir}`, `panchangam_share`,
`calendar_view {y,m}`, `calendar_day_open`.
**Tools:** `tools_hub_view`, `tool_open {tool}`, `porutham_submit {context}`,
`porutham_result_view {scoreBand}`, `friendship_submit`, `muhurta_submit {eventType}`,
`muhurta_result_view`.
**Monetization:** `ad_impression {placement,format}`, `ad_click {placement}`,
`report_unlock {method:reward|iap, tool}`, `iap_purchase {sku,amount,currency}`.
**Push:** `push_optin_prompt_view`, `push_optin_result {granted,time}`,
`push_received {type}`, `push_opened {type}`.
**Share/growth:** `share_card_generated {type}`, `share_card_shared {type,target}`.
**Widget:** `widget_add`, `widget_tap`.
**Account (Phase B):** `signup_start {source}`, `signup_complete`, `login`, `logout`,
`birth_profile_created`, `personal_today_view`, `notif_settings_changed {field}`.

## 5. Guardrail metrics (don't optimize money into churn)
- Any ad change must hold **D7 ≥ baseline** and **session length ≥ baseline**.
- Watch ad-to-open ratio; if interstitials raise uninstall rate → pull back.

## 6. Tooling
- Crash: **Sentry** (`@sentry/react-native`).
- Product analytics: a privacy-respecting SDK (e.g. PostHog/Amplitude/Firebase) — pick one,
  wire the taxonomy above. Honor ATT/consent: no tracking without permission where required.
- Dashboards: North Star + KPI tree as the home dashboard; cohort retention curves;
  funnel (install→activate→habit→account→pay).

## 7. Experiment backlog (post-launch)
Push time/copy, upgrade-prompt timing, ad density vs retention, rasi-palan length,
onboarding skip vs forced, widget promotion, report price points (regional).
