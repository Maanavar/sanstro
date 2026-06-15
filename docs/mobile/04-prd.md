# 04 — Product Requirements Document (PRD)

**Author hat:** Product Manager
**Scope:** Phase A (Guest) + Phase B (Accounts) MVP. Phase C noted as out-of-scope.
**Status:** Draft for sign-off.

---

## 1. Goals & non-goals

**Goals**
- G1: A guest can reach daily value (panchangam + rasi palan) in <60s, no account. (Phase A)
- G2: Build a daily habit (north star: DAU returning ≥4 days/week). (Phase A)
- G3: Monetize guests via ads without harming retention. (Phase A)
- G4: Convert engaged guests to accounts for personalized guidance. (Phase B)
- G5: Earn first direct revenue via a paid report. (Phase B)

**Non-goals (this release)**
- Family vault, chart visualisation, dasha/transit timelines, journal, Ask Vinaadi,
  annual wrapped, astrologer consults, devotional commerce, subscription. (Phase C)
- Porting any SEO/marketing/admin/QA web pages.

## 2. Personas served
P1 Daily Devotee, P4 Curious Newcomer (Phase A); P2 Diaspora Seeker, P3 Marriage
Decision-Maker (Phase B). See `02-personas-journeys.md`.

## 3. Functional requirements

### Phase A — Guest (no account)
| ID | Requirement | Priority | Source endpoint |
|----|-------------|----------|-----------------|
| FA-1 | First-run: capture rasi/nakshatra + location (local only) | P0 | local + reverse-geocode |
| FA-2 | **Today** screen: rasi palan + key panchangam + festival of day | P0 | `GET /public/rasi-palan` *(NEW)* + `GET /public/panchangam` |
| FA-3 | **Panchangam** screen: full daily detail | P0 | `GET /public/panchangam` |
| FA-4 | Swipe between days (prev/next) | P0 | `GET /public/panchangam?date=` |
| FA-5 | Month/festival calendar | P1 | `GET /panchangam/monthly` *(make public or proxy)* |
| FA-6 | **Tools:** Porutham (free summary) | P0 | `POST /public/porutham` |
| FA-7 | Porutham detailed report (rewarded ad or paid) | P1 | `POST /public/porutham` (full data) |
| FA-8 | **Tools:** Friendship compatibility | P1 | `POST /public/friendship-compatibility` |
| FA-9 | **Tools:** Muhurta finder (top-3) | P1 | `POST /public/muhurta` |
| FA-10 | Share card (panchangam / rasi palan / porutham) to WhatsApp | P0 | `GET /public/panchangam-share-card` + native share |
| FA-11 | Daily push (anonymous token, user-set time) | P0 | `POST /devices/push-token` *(NEW)* + scheduler |
| FA-12 | Home-screen widget (panchangam + rasi palan) | P1 | `GET /public/panchangam` (+ rasi-palan) |
| FA-13 | Ads: native in-feed + rewarded + capped interstitial | P0 | AdMob SDK |
| FA-14 | Soft signup prompts at intent moments | P0 | client logic |
| FA-15 | Language toggle Tamil/English; default Tamil | P0 | client + `lang` params |
| FA-16 | Offline: show last-good Today/panchangam | P1 | RQ persist cache |

### Phase B — Registered
| ID | Requirement | Priority | Source endpoint |
|----|-------------|----------|-----------------|
| FB-1 | Mobile signup/login (bearer + refresh) | P0 | `POST /auth/mobile/*` *(NEW)* |
| FB-2 | Session restore + silent refresh on launch | P0 | `/auth/mobile/refresh` |
| FB-3 | Onboarding: birth profile (date/time/place, validation) | P0 | `POST /birth-profiles` |
| FB-4 | Personal **Today**: guidance + score + windows + alerts | P0 | `GET /daily-guidance`, charts |
| FB-5 | Personalized panchangam (chandrashtama/peyarchi alerts) | P1 | `GET /panchangam/daily` (auth) |
| FB-6 | Notification settings (channel, morning time, dasha, pirantha-naal, smart silence) | P0 | `GET/PATCH /settings/notifications` |
| FB-7 | Notification inbox | P1 | `GET /notifications` |
| FB-8 | Profile/settings, multiple birth profiles | P1 | `birth-profiles`, `/auth/me` |
| FB-9 | Sign out (revoke refresh) + delete account | P0 | `/auth/mobile/logout`, `DELETE /auth/me` |
| FB-10 | First paid report (IAP) | P1 | report endpoint + store IAP |

## 4. Non-functional requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1 Performance | Cold start to visible Today | <1.5s with cache; first value <60s for new user |
| NFR-2 Offline | Last-good Today/panchangam available offline | yes |
| NFR-3 Reliability | Crash-free sessions | ≥99.5% |
| NFR-4 Accessibility | Dynamic type, contrast AA, screen-reader labels | yes |
| NFR-5 Localization | Tamil + English; correct Tamil shaping on Android API 29+ | verified on device |
| NFR-6 Privacy | Tokens in secure store; chart deletable; ATT/consent handled | yes |
| NFR-7 Security | Bearer+refresh, rotation, reuse-revoke; no secrets in bundle | yes |
| NFR-8 Timezone | Birth tz vs device tz handled correctly | verified |
| NFR-9 Store compliance | Apple/Google ad, privacy, astrology-content policies | pass review |
| NFR-10 Observability | Crash (Sentry) + analytics events live before beta | yes |

## 5. Acceptance criteria (samples)
- **FA-2:** Given a returning guest, when they open the app offline, then Today shows the
  last cached rasi palan + panchangam within 1.5s and refreshes when online.
- **FA-11:** Given push opt-in at 07:00, then a daily notification arrives ~07:00 device
  time and deep-links to Today; revoking permission stops it and removes the device token.
- **FB-2:** Given a valid refresh token on launch, when the access token is expired, then it
  is silently refreshed and the user lands authenticated without re-login; on refresh failure
  they are routed to login with state preserved.
- **FA-13:** Ads never appear above the fold on panchangam Today, in onboarding, auth, or
  payment screens; interstitial frequency ≤1/session.

## 6. Dependencies / backend gaps (see `08-api-contract.md`)
- NEW: `POST /auth/mobile/login|register|refresh|logout` (tokens in body).
- NEW: refresh-token model + rotation; refactor `/auth/me` family to `get_current_user`.
- NEW: `POST/DELETE /devices/push-token` + multi-device table; dispatcher fan-out.
- NEW: `GET /public/rasi-palan?rasi=&date=&lang=` (rasi palan currently web-client only).
- CONFIRM: make `GET /panchangam/monthly` guest-accessible (public) or add `/public/monthly`.

## 7. Release criteria (Phase A beta)
All P0 done; NFR-1/2/3/5/6/9/10 met; ads pass review; Tamil render verified on 3 Android API
levels; crash + analytics live; push delivery verified background/killed; TestFlight + Play
internal builds green.
