---
title: Functional Requirements Document
subtitle: Vinaadi AI: system behaviour, rules, data and interfaces
doc_id: VIN-FRD-001
version: 2.0
date: 9 October 2026
status: Draft for review
classification: External: may be shared with partners, investors and delivery teams
rev1: 1.0 | 9 October 2026 | Vinaadi AI product team | First issue for stakeholder review
rev2: 2.0 | 9 October 2026 | Vinaadi AI product team | Corrected against an audit of the code and engine output: State column added to every requirement; mobile auth paths, registration, error codes and webhook authentication corrected; entitlement enforcement shown; onboarding, Ask Vinaadi safeguards, operator authentication, webhook ordering, share revocation, Nadi and porutham ladders added; encryption scope stated in full; known issues and open technical items added; endpoint catalogue regenerated from the code (220 operations)
---

# 1. Introduction

## 1.1 Purpose

This document specifies the functional behaviour of the Vinaadi AI platform in enough detail to build, test and accept it. It turns the product features in VIN-PRD-001 into testable requirements, calculation and business rules, data requirements, and interface contracts.

Version 2.0 was checked against the application code and the calculation engine's actual output on 9 October 2026. The **State** column records what is built today, so this document is both a specification and an accurate account of the current system.

## 1.2 Audience

Engineering teams (backend, web, mobile), QA, solution architects, delivery partners, and technical reviewers on the investor or partner side.

## 1.3 Conventions

- **Requirement IDs:** `FR-<MODULE>-<NN>` (functional), `CR-<NN>` (calculation rule), `ER-<NN>` (entitlement rule), `PR-<NN>` (presentation rule), `NFR-<AREA>-<NN>` (non-functional), `KI-<NN>` (known issue), `OT-<NN>` (open technical item).
- **"Shall"** marks a mandatory requirement; **"should"** marks a recommended one.
- **Priority (Pri):** M = Must, S = Should, C = Could (MoSCoW).
- **State:** **Built** = implemented as specified · **Partial** = implemented with the stated gap · **Not built** = specified, not yet implemented.
- **API paths** are relative to the versioned base `/api/v1` unless shown otherwise, and are always written in full. `{chart_id}` and similar placeholders are UUIDs.
- **Names:** on-screen names are used in prose (for example "Goals", "Understand"). Internal identifiers appear only in `code` (for example the tab ID `plan`).
- **Acceptance criteria** name the automated test that checks them where one exists. Test files are in `tests/` (backend), `web/lib` and `web/components` (web unit tests) and `web/e2e` (browser tests).

## 1.4 Reference documents

| ID | Document |
|---|---|
| VIN-BRD-001 | Business Requirements Document v2.0 |
| VIN-PRD-001 | Product Requirements Document v2.0 |
| — | Vinaadi AI Product Specification v7.0 (module catalogue and calculation methodology) |
| — | Formula Engine Specification v1 and QA Golden Test Cases v1 |
| — | Live OpenAPI schema, served at `/docs` in non-production environments only (disabled in production) |

<!-- pagebreak -->

# 2. System overview

## 2.1 Context

Vinaadi is a three-tier system. Two client applications (web and mobile) and a public website call one HTTP API. The API owns **all** astrology calculation, entitlement decisions and data storage. Clients present results and never recompute astrology (PR-06).

| Component | Technology | Responsibility |
|---|---|---|
| Web application | Next.js 15 (React, TypeScript), hand-written CSS design system | Public site (server-rendered for search, English and `/ta/` Tamil), signed-in dashboard, admin console |
| Mobile application | Expo / React Native (TypeScript) | Android and iOS daily companion; store purchases through the RevenueCat SDK |
| Shared client package | TypeScript workspace package | Typed API wrappers, shared constants (tiers, launch state, site address), shared copy tables |
| API service | Python FastAPI | REST API; authentication; entitlements; orchestration |
| Calculation engine | Python on Swiss Ephemeris | Planetary positions, panchangam, dashas, vargas, strengths, compatibility, muhurta, numerology |
| Interpretation layer | Python services | Converts calculations into narrative guidance under the tone and presentation rules |
| Worker | APScheduler process | Scheduled jobs (Section 11) and the notification delivery outbox |
| Database | PostgreSQL | System of record, including the panchangam cache; Alembic-managed schema migrations |
| Redis | Redis | Shared rate-limit and sign-in throttling state, and caching, for multi-worker deployments |
| Edge | Reverse proxy with automated TLS certificates | TLS termination, routing, security headers |

## 2.2 External interfaces

| System | Purpose | Failure behaviour |
|---|---|---|
| Swiss Ephemeris (bundled library and data) | Astronomical positions | Not a network dependency; ships with the service |
| Anthropic Claude API | Ask Vinaadi answers | The endpoint returns 503; the reserved question is refunded; nothing else is affected |
| Firebase Cloud Messaging | Mobile push and web browser push | Outbox retries; in-app inbox unaffected |
| SMTP email provider | Password reset; transactional email | Outbox retries; the user sees a neutral confirmation |
| Google OAuth 2.0 | Social sign-in (web) | Email sign-in remains available |
| RevenueCat with App Store and Google Play | Subscriptions and purchases (webhooks authenticated by a shared bearer secret) | Entitlement stays at its last applied event; the endpoint returns 503 if the secret is not configured |
| Geocoding service (proxied) | Birthplace lookup | Falls back to the bundled offline place index |
| Error monitoring and product analytics (mobile) | Crash reports; usage analytics (opt-in) | Non-blocking |
| Mobile ad network | Ads on free tiers (app) | Non-blocking |

## 2.3 Deployment topology

The production deployment is containerised. It has these services: `db` (PostgreSQL), `redis`, `api` (FastAPI), `worker` (scheduler), `web` (Next.js), `edge` (reverse proxy) and `certbot` (certificate renewal).

- The `web` container holds **no** secrets.
- Secrets are supplied as mounted files (`JOTHIDAM_<FIELD>_FILE`).
- Separate staging and production environments are required.

# 3. Actors and access levels

| Actor | Description | Authentication |
|---|---|---|
| Guest | Unauthenticated visitor | None. Public tools and content only. |
| Registered user | Free account holder | Web: session cookie. Mobile: bearer access token plus refresh token. |
| Premium user | Paid subscriber, or any registered user during the open beta | As registered |
| Family member | A person whose chart is held in a user's family vault. Not a system user. | None (data subject only) |
| Operator / admin | Support and operations staff | A signed-in account marked as admin (or listed in the bootstrap admin email setting). Destructive actions also need a short-lived elevation token from re-entering the password. A legacy `X-Admin-Key` header is accepted only from server-to-server callers and refused from browser origins. Every action is audit-logged. |
| Scheduler | Internal worker process | Internal |
| Payment platform | Subscription webhook sender | Shared-secret bearer token, compared in constant time |

<!-- pagebreak -->

# 4. Functional requirements

## 4.1 Authentication and account (AUTH)

| ID | Requirement | Pri | Acceptance criteria | State |
|---|---|---|---|---|
| FR-AUTH-01 | The system shall register a user with email and password and record explicit privacy consent with a timestamp and the policy version. Registration shall not reveal whether an email is already registered. | M | Registration without consent is rejected (422). For an existing email, the response and its timing equal those of a new registration, and the existing owner is emailed. `consent_given_at` and `consent_policy_version` are stored. | Built |
| FR-AUTH-02 | The system shall sign in web users with an HttpOnly, Secure (in production) session cookie valid for 24 hours. | M | The cookie is not readable from JavaScript; `max_age` is 86,400 s; sign-out clears it. | Built |
| FR-AUTH-03 | Cookie-authenticated **mutating** requests shall require the header `X-Vinaadi-CSRF: 1`. | M | A POST, PATCH, PUT or DELETE with the cookie and without the header returns 403; bearer-token requests are exempt. | Built |
| FR-AUTH-04 | The system shall sign in mobile users through `/auth/mobile/register`, `/auth/mobile/login`, `/auth/mobile/refresh` and `/auth/mobile/logout`, using a bearer access token and a rotating refresh token valid for 60 days. | M | Refresh issues a new pair and revokes the old refresh token. Reusing a revoked token is treated as theft: every refresh token for that user is revoked and the user's token version advances, invalidating access tokens. | Built |
| FR-AUTH-05 | The web shall support "Sign in with Google" using OAuth 2.0 with a state cookie. | S | A state mismatch aborts sign-in; a first-time Google user gets an account with consent captured. The mobile app does not offer Google sign-in. | Built (web) |
| FR-AUTH-06 | The system shall support password reset by emailed, single-use, time-limited token. | M | The request response is identical whether or not the email exists. A token is marked used on first use and refused after expiry. | Built |
| FR-AUTH-07 | Passwords shall be stored only as bcrypt hashes. | M | No plaintext or reversible password is stored or logged. | Built |
| FR-AUTH-08 | `GET /auth/me` shall return the profile, the true `tier`, and the live `openBeta` flag. | M | Clients gate features from this response (mobile: `gateTier`), never from a hard-coded constant (ER-02). | Built |
| FR-AUTH-09 | A user shall be able to permanently delete their account and all associated data with `DELETE /auth/me`. | M | After deletion: profiles, charts, family data, journal, notifications and tokens are gone; the session is cleared; further requests return 401. | Built |
| FR-AUTH-10 | The system shall record first-touch acquisition attributes and expose a referral code. | S | Attribution is stored on the user at sign-up; `GET /users/me/referral` returns a stable code. | Built |
| FR-AUTH-11 | An operator shall be able to suspend an account. | M | A suspended user's sign-in returns 403 on web and mobile; the action is audit-logged. | Built |

## 4.2 Onboarding (ONB)

| ID | Requirement | Pri | Acceptance criteria | State |
|---|---|---|---|---|
| FR-ONB-01 | A new user shall be guided to enter birth date, time (optional) and place, and shall then see their computed jadhagam. | M | Completing the flow creates a birth profile and a chart (`createBirthProfile` wrapper, used by both clients). | Built |
| FR-ONB-02 | The mobile app shall offer a quick start: pick a moon sign (rasi) and optionally a nakshatra, changeable later in Settings. | S | Choosing a rasi unlocks rasi-level daily content without full birth details. | Built (app) |
| FR-ONB-03 | The user shall be able to confirm that a saved location is still correct without changing it. | C | `POST /birth-profiles/{birth_profile_id}/confirm-location` records the confirmation. | Built |
| FR-ONB-04 | A user who skips the life-focus question shall continue at once, and the focus is saved as "balanced" in the background. | M | Skipping never blocks the user or shows an error loop. | Built |

## 4.3 Birth profiles and places (PROF)

| ID | Requirement | Pri | Acceptance criteria | State |
|---|---|---|---|---|
| FR-PROF-01 | A user shall be able to create, read, update and list birth profiles: name, date, time, place, coordinates, timezone and birth-time source. | M | Creation beyond the plan limit (ER-03) returns an entitlement error; the latest profile is at `GET /birth-profiles/me/latest`. | Built |
| FR-PROF-02 | The system shall resolve a typed birthplace to coordinates and an IANA timezone. | M | `GET /places/search` returns matches from the bundled index; `POST /geo/geocode` resolves other places through the proxy. | Built |
| FR-PROF-03 | Local birth time shall be converted to UTC using the historical timezone rules for the birth date and place (IANA database). | M | Conversion uses the IANA timezone database (`zoneinfo`). A dedicated test set of historical-offset and daylight-saving dates converts correctly. | Partial: the conversion is built; the dedicated historical test set is not yet written (OT-06) |
| FR-PROF-04 | The system shall record how the birth time is known (`birthTimeSource`) and a confidence in minutes. Values in use: `BIRTH_CERTIFICATE`, `HOSPITAL_RECORD` and `FAMILY_RECORD` (treated as reliable), `approximate`, `unknown` (the default) and `ESTIMATED_RECTIFIED` (set by rectification). Lagna-dependent statements shall be suppressed or qualified unless the source is reliable. | M | With an unreliable source, readings do not assert lagna-dependent claims as certain. | Partial: the field accepts any text (OT-01) |
| FR-PROF-05 | Birth-time rectification shall propose a corrected time from known life events, and apply it only on the user's confirmation (Premium). | C | Proposing does not modify the profile; applying it sets the source to `ESTIMATED_RECTIFIED` and recalculates. | Built |
| FR-PROF-06 | Identifying birth and location fields shall be stored encrypted, as listed in Section 8.2. | M | `tests/test_birth_data_at_rest.py` passes. | Built |

## 4.4 Chart engine (CHART)

| ID | Requirement | Pri | Acceptance criteria | State |
|---|---|---|---|---|
| FR-CHART-01 | `POST /charts/calculate` shall compute and persist a chart from a birth profile: sidereal longitudes of the nine grahas, lagnam, rasi, nakshatra and pada for each, house placement, retrogression and combustion. | M | Results match the golden reference cases within tolerance (NFR-ACC-01). | Built |
| FR-CHART-02 | The chart shall present the South Indian square layout (whole-sign houses). Bhava madhya cusps are available as a secondary view. | M | Each graha appears in the correct sign box; the lagnam is marked. | Built |
| FR-CHART-03 | The system shall compute divisional charts (vargas), including D9 navamsa, using the documented formulas. | M (D9), C (others) | D9 matches the reference cases for odd and even signs. | Built; the Premium gate is in the app only (KI-02) |
| FR-CHART-04 | The system shall compute Shadbala and Ashtakavarga. | C | `tests/test_shadbala.py` and `tests/test_ashtakavarga_golden.py` pass. | Built |
| FR-CHART-05 | The system shall detect yogas and doshams and grade each by strength. Its **status** shall reflect dasha timing only ("active" = the relevant dasha is running now). | M | Every detected yoga has a display name in both languages (`tests/test_yoga_display_parity.py`); "active" never means "strong". | Built |
| FR-CHART-06 | Dosham reckoning (for example sevvai dosham) shall apply the recorded cancellation and residual rules, and show the residual and its context. | M | The reference charts produce the ruled outcome on every surface (web, mobile, PDF). | Built |
| FR-CHART-07 | The system shall provide alternative dasha systems: Chara, Yogini, Ashtottari, Kalachakra and conditional dashas. | C | Each endpoint returns period sequences with start and end dates for every golden chart. | Built |
| FR-CHART-08 | The system shall compute the annual chart (`GET /charts/{chart_id}/varshaphala`, Premium) and the solar return (`GET /charts/{chart_id}/solar-return`). | C | At the return moment, the Sun's sidereal longitude equals its natal longitude within the documented tolerance; non-Premium callers receive `PREMIUM_REQUIRED` once the beta ends. | Built |
| FR-CHART-09 | The system shall generate a jadhagam PDF at `GET /charts/{chart_id}/export/pdf`, in standard and astrologer-detail (`detail=astrologer`) versions. | S | The PDF opens, is in the user's language, and contains the chart, dasha and readings. | Built |
| FR-CHART-10 | The system shall produce a shareable chart image card. | S | The card shows the public site address and no precise birth time or coordinates. | Built |
| FR-CHART-11 | `GET /charts/{chart_id}/dashboard-bundle` shall return everything the dashboard needs for one chart and date in a single response. | S | One request renders Today without further chart calls. | Built |

## 4.5 Readings and interpretation (READ)

| ID | Requirement | Pri | Acceptance criteria | State |
|---|---|---|---|---|
| FR-READ-01 | The system shall produce a short and a long reading for each chart, served at `GET /charts/{chart_id}/one-minute` and `GET /charts/{chart_id}/five-minute`. The **displayed** length is measured: advertised minutes = median English word count ÷ 118, rounded ("two minutes" and "four minutes" today). The route names are historical and deliberately kept stable. | M | A measurement over a chart sample confirms the displayed titles; titles change only after re-measurement; routes never change for a copy change. | Built |
| FR-READ-02 | Readings for family members shall use the third person for adults and a parent-addressed register for minors. | M | No second-person pronoun appears in a member's reading; minors' readings omit adult-only significations. | Built |
| FR-READ-03 | The full reading (`GET /charts/{chart_id}/explanation`) shall offer a Story view (five chapters, each ≤ 120 words) and an Astrologer view. | S | `web/components/chart-reading/story-reading-budget.test.tsx` fails if any chapter exceeds 120 words; `web/e2e/chart-reading-say-once.spec.ts` fails if a Story sentence repeats. | Built (web); app shows a text-first version |
| FR-READ-04 | Story selections shall be computed on the server, and clients shall render the server's selection. | M | `web/components/chart-reading/reading-story-parity.test.ts` confirms that the server and client selections are equal. | Built |
| FR-READ-05 | Every reading statement shall cite its basis: the planet, house, period or factor it rests on. | M | Each statement maps to at least one chart factor in the response payload. | Built |
| FR-READ-06 | Pending marital-status questions shall be asked *about* the member when the reading is for a family member. | S | The question text names the member; answering it reloads both reading lengths. | Built |

## 4.6 Daily guidance (DAY)

| ID | Requirement | Pri | Acceptance criteria | State |
|---|---|---|---|---|
| FR-DAY-01 | `GET /charts/{chart_id}/daily-guidance` shall return, for a date and location: a day verdict, a 0–100 rating, life-area guidance, good and caution windows, and reasons. | M | Each rating component maps to an identified factor; the response is deterministic for the same inputs. | Built |
| FR-DAY-02 | Life-area guidance shall be ordered by the user's life focus on the user's own chart, and in neutral order on a family member's chart. | M | Changing the focus reorders only the owner's chart. | Built |
| FR-DAY-03 | The daily score cache shall be keyed by profile, date and focus track. | M | Two tracks for the same day do not overwrite each other. | Built |
| FR-DAY-04 | The system shall flag chandrashtama days, attributing each to the calendar day it belongs to under the recorded day-ownership rule. | M | Reference transitions near midnight and sunrise are attributed correctly. | Built |
| FR-DAY-05 | Activity timing (`GET /activity-timing`, `GET /activity-timing/batch`) shall return ranked windows for a named activity. | S | No window overlaps rahu kalam or yamagandam. Kuligai is treated according to the activity (CR-09). | Built |
| FR-DAY-06 | Week-ahead and range endpoints shall return day-level summaries. Requests beyond the plan's rasi-palan window (ER-07) shall be refused with `PREMIUM_REQUIRED`. | S | A free account requesting day +8 is refused. | Partial: the window is not enforced (KI-02) |
| FR-DAY-07 | `GET /daily-snapshot` shall return a lightweight summary, personalised when signed in. | S | The response carries only summary fields, never the full chart payload. | Built |
| FR-DAY-08 | Ambient alerts (`GET /alerts/ambient`) shall surface relevant upcoming events. | S | Each alert has an expiry and a link to its detail. | Built |
| FR-DAY-09 | The public rasi palan shall serve today's forecast for all 12 moon signs. | M | `GET /public/rasi-palan` and `GET /public/rasi-palan/grid` respond without authentication. | Built |

## 4.7 Panchangam and calendar (PAN)

| ID | Requirement | Pri | Acceptance criteria | State |
|---|---|---|---|---|
| FR-PAN-01 | `GET /panchangam/daily` shall return, for a date and coordinates: sunrise, sunset and solar noon; weekday and its lord; tithi, nakshatra (with pada), yoga and karana, each with end time, next value and spans across the civil day; dominant values for the day; Tamil date; and the moon's rasi. | M | Values match `tests/test_panchangam.py` and the golden cases. Example: on 9 Oct 2026 sunrise is 05:58 IST in Chennai and 07:24 EDT in Toronto. | Built |
| FR-PAN-02 | The panchangam shall include the day's timings: rahu kalam, yamagandam, kuligai, nalla neram, gowri panchangam and gowri nalla neram, durmuhurtham, abhijit (with a restricted flag), hora, and subha-muhurtham flags. It shall also include almanac details: soolam and its parigaram, nethiram and jeevan, amirdhadhi yogam, chandrashtamam by rasi and by star, and the daylight lagna schedule. | M | All timings are derived from the actual sunrise and sunset at the location (CR-08). On 9 Oct 2026 in Chennai (a Friday), rahu kalam is 10:26–11:56, the 4th of eight daylight parts. | Built |
| FR-PAN-03 | `GET /panchangam/monthly` shall return a month grid with each day's dominant tithi, nakshatra and yoga, and festivals. | M | Monthly values equal the daily values for the same day. | Built |
| FR-PAN-04 | `GET /panchangam/tamil-months` shall return Tamil month boundaries. | S | Month starts follow the solar ingress rule (CR-05). | Built |
| FR-PAN-05 | The system shall list festival and holiday categories and events by year. | S | The Hindu, Christian and Muslim festival lists and the Tamil Nadu government holiday list resolve. | Built |
| FR-PAN-06 | The system shall list muhurtham naal (wedding-auspicious days) for a year, publicly and matched to a chart. | S | Each listed day carries its nalla neram windows and tithi. | Built |
| FR-PAN-07 | The system shall cache the panchangam per date, location and ayanamsa, and pre-warm popular locations every day. | M | A repeat request is served from cache; the pre-warm job is idempotent. | Built |
| FR-PAN-08 | The system shall render a panchangam share card and an embeddable widget. | S | The widget loads without authentication. | Built |

## 4.8 Dasha and transits (DSH)

| ID | Requirement | Pri | Acceptance criteria | State |
|---|---|---|---|---|
| FR-DSH-01 | `GET /charts/{chart_id}/dasha` shall return the Vimshottari tree, limited to the plan's depth (ER-05). | M | The balance at birth matches the golden case. A free account receives the current major and sub-period only. | Partial: depth is not enforced (KI-02) |
| FR-DSH-02 | `GET /charts/{chart_id}/dasha/timeline` shall return dasha periods positioned against today. | S | The current period is flagged. | Built |
| FR-DSH-03 | `GET /charts/{chart_id}/gochar/current` shall return the current transit of each graha relative to the natal moon and lagnam, with a grade. | M | Guru and Sani grades follow the recorded supportive-house rulings (CR-11). | Built |
| FR-DSH-04 | `GET /charts/{chart_id}/sani-cycle` shall return the current and next Saturn phases with dates. | M | The phase boundaries match the reference Saturn-cycle cases. | Built |
| FR-DSH-05 | Upcoming peyarchi (`GET /charts/{chart_id}/peyarchi/upcoming`) and a personal peyarchi report (`GET /transits/peyarchi-report/{chart_id}`) shall be available. | S | The next Guru, Sani and Rahu-Ketu sign changes are listed with dates. | Built |
| FR-DSH-06 | The system shall refresh peyarchi alerts for all charts every day (Section 11). | S | The job is idempotent; re-running it creates no duplicate alerts. | Built |

## 4.9 Life areas and predictions (LIFE)

| ID | Requirement | Pri | Acceptance criteria | State |
|---|---|---|---|---|
| FR-LIFE-01 | `GET /charts/{chart_id}/life-areas` shall return scored life areas with narratives. | S | `tests/test_life_areas_golden.py` passes. | Built |
| FR-LIFE-02 | The prediction endpoints (`/charts/{chart_id}/predictions/marriage`, `/career`, `/wealth`, `/health`) shall return timing windows and tendencies, each with a stated basis. | S | Every window lists its contributing factors; health text is preventive only (`tests/test_tone_compliance.py`). | Built |
| FR-LIFE-03 | Marriage prediction shall give the same result for the same chart regardless of request order or caching. | M | `tests/test_marriage_signature_determinism.py` and `tests/test_marriage_prediction_golden.py` pass. | Built |
| FR-LIFE-04 | The system shall compute bhava palan (results by house) using the agreed grade cut-offs. | S | Grades follow the configured thresholds. | Built |
| FR-LIFE-05 | Life-event windows and propensities shall be available for each chart. | C | Both endpoints return 200 with at least one entry for every golden chart. | Built |
| FR-LIFE-06 | A user shall be able to log real life events against a chart (Premium). | C | Entries persist and are listed in date order; non-Premium callers receive `PREMIUM_REQUIRED` once the beta ends. | Built |
| FR-LIFE-07 | The system shall serve the history and trend of each life area (Premium). | C | A history endpoint returns at least 12 months of scores. | Not built |

## 4.10 Family (FAM)

| ID | Requirement | Pri | Acceptance criteria | State |
|---|---|---|---|---|
| FR-FAM-01 | A user shall be able to create a family vault and add, edit and remove members (`/family-vaults/{family_vault_id}/members`), each with birth details and a relationship to the owner. | M | Adding members beyond the plan limit returns an entitlement error (`tests/test_family_vaults_api.py`). | Built |
| FR-FAM-02 | A member whose relationship is `self` shall be treated as the owner. | M | Life focus applies only to the owner. | Built |
| FR-FAM-03 | Each member shall have readings, daily guidance and charts like the owner's (FR-READ-02 voice rules). | M | Every member offers both reading lengths. | Built |
| FR-FAM-04 | The vault shall provide each member's day (`/today`), a summary, a composite view, a daily aggregate and family harmony remedies. | S | Each view names the member each entry concerns. | Built |
| FR-FAM-05 | `GET /family-vaults/{family_vault_id}/calendar` shall merge members' significant days. | S | Each entry names the member it concerns. | Built |
| FR-FAM-06 | The system shall compute relationship alerts between members every day. | C | Alerts are de-duplicated per pair and period. | Built |
| FR-FAM-07 | Only the vault owner shall be able to read or modify vault data. Requests for a vault the caller does not own shall not reveal that it exists. | M | Another user's vault returns 404, the same as a missing vault. | Partial: returns **403** today, which confirms existence (decision D-10) |

## 4.11 Compatibility (CMP)

| ID | Requirement | Pri | Acceptance criteria | State |
|---|---|---|---|---|
| FR-CMP-01 | The system shall compute the ten Tamil poruthams between two charts or two birth stars (CR-15), giving each factor's result, a total out of 10, a band label and an overall summary. The summary shall never contradict the label. | M | `tests/test_porutham.py` passes. A sweep of all 27 × 27 star pairs finds no result labelled `CAUTION` whose summary says "suitable match" or "highly auspicious", in either language. | Partial: KI-01 |
| FR-CMP-02 | The system shall provide a star-by-star porutham grid. | S | 27 × 27 results are consistent with the pairwise endpoint. | Built |
| FR-CMP-03 | A chart comparison shall add a dasha-period comparison, a navamsa view and remedies, with PDF export. | S | The PDF is generated in the requested language. | Built |
| FR-CMP-04 | A user shall be able to create a public share for a porutham result. The public view shall show stars, scores, doshas and optional labels only. | S | `GET /porutham-shares/{token}` renders without authentication and contains no birth date, time, place or coordinates; it is refused after `expiresAt` (`tests/test_porutham_shares_api.py`). | Built |
| FR-CMP-05 | The creator of a share shall be able to revoke it. | S | After `POST /porutham-shares/{share_id}/revoke`, the public view is refused. | Built |
| FR-CMP-06 | The system shall provide friendship compatibility, synastry (Premium) and compatibility intelligence for members and for direct inputs. | C | Each endpoint returns 200 for every pair of golden charts; synastry returns `PREMIUM_REQUIRED` to non-Premium callers once the beta ends. | Built |

## 4.12 Muhurta (MUH)

| ID | Requirement | Pri | Acceptance criteria | State |
|---|---|---|---|---|
| FR-MUH-01 | The system shall return ranked muhurta windows for an activity, date range and location, with the reasons for each. | M | No window falls in rahu kalam, yamagandam or an excluded tithi or nakshatra for that activity (`tests/test_muhurta_api.py`). | Built |
| FR-MUH-02 | Personalised muhurta shall exclude the user's chandrashtama and weak tara bala days. | M | A reference chart's chandrashtama days never appear. | Built |
| FR-MUH-03 | Couple mode shall apply to **marriage only**. Both charts are scored, the weaker reading governs, a veto from either chart removes the day, and a dasha bonus counts only if it applies to both. | S | A day bad for either partner is never ranked good; requesting couple mode for another activity is refused. | Built |
| FR-MUH-04 | Muhurta scores shall use a documented, bounded scale. | M | Scores fall within the documented range. | Built |

## 4.13 Numerology and naming (NUM)

| ID | Requirement | Pri | Acceptance criteria | State |
|---|---|---|---|---|
| FR-NUM-01 | The system shall compute a numerology profile, personal year and cycle, favourable numbers and lucky dates. | S | `tests/test_numerology_api.py` passes. | Built |
| FR-NUM-02 | Name correction shall return candidate spellings, each with a verdict and an explanation consistent with its own numbers. | S | No explanation contradicts the numbers it reports. | Built |
| FR-NUM-03 | Name-correction sessions shall be saveable, listable and deletable. | C | Deletion removes the session permanently. | Built |
| FR-NUM-04 | The baby-name finder shall filter names by the child's birth-star naming syllables and numerology, and show their meanings. | S | Every returned name starts with a valid syllable for the nakshatra pada (`tests/test_numerology_baby_names_api.py`). | Built |
| FR-NUM-05 | The system shall provide numerology compatibility and favourable marriage dates. | C | Both endpoints return 200 for every pair of golden charts. | Built (API only; no client yet) |

## 4.14 Remedies (REM)

| ID | Requirement | Pri | Acceptance criteria | State |
|---|---|---|---|---|
| FR-REM-01 | The system shall produce a remedy plan tied to the current dasha lord. Remedies are never selected by the life focus. | S | Changing the focus does not change the remedy. | Built |
| FR-REM-02 | Gemstone advice shall include suitability caveats. | C | The caveat is always present in the response. | Built |
| FR-REM-03 | All remedy text shall be framed as optional (PR-01). | M | `tests/test_tone_compliance.py` finds no obligation wording. | Built |

## 4.15 Ask Vinaadi (ASK)

| ID | Requirement | Pri | Acceptance criteria | State |
|---|---|---|---|---|
| FR-ASK-01 | `POST /charts/{chart_id}/ask` shall answer a natural-language question from a signed-in owner of the chart, grounded in the chart's computed data, in the user's language. | S | Guests receive 401. A chart the caller does not own returns 403 before any processing. The answer follows the tone rules. | Built |
| FR-ASK-02 | The system shall enforce per-plan question limits (ER-06), reserving a question **before** calling the AI provider. | M | Exceeding the limit returns 429 with `DAILY_LIMIT_REACHED` or `MONTHLY_LIMIT_REACHED`, the questions used and the limit. Concurrent requests cannot exceed the quota (`tests/test_ask_vinaadi_quota_race.py`). | Built |
| FR-ASK-03 | `GET /ask-vinaadi/daily-status` shall return the questions used and remaining. | S | The client's meter matches the server's count. | Built |
| FR-ASK-04 | The assistant shall decline medical, legal and financial advice, and predictions of death or disaster. | M | A safety pass runs on every generated answer (`tests/test_ask_vinaadi.py::test_ask_vinaadi_runs_safety_pass_on_llm_output`). A fixed set of medical, legal, financial and death-prediction questions each produces a decline. | Partial: the safety pass is built; the fixed refusal test set is not yet written (OT-05) |
| FR-ASK-05 | If the AI provider fails, the reserved question shall be refunded. If Ask Vinaadi is not configured, the endpoint shall return 503. | M | A simulated provider error leaves the usage count unchanged. | Built |
| FR-ASK-06 | Questions shall be redirected, not answered, when the topic is unsuitable for the chart owner's life stage. Under 18: love, marriage, career and wellbeing or health-sensitive topics. Under 6: study topics as well. Married: marriage-timing topics. 50 and over: love and marriage topics. | M | Each rule returns its redirect response for a matching question. | Built |
| FR-ASK-07 | A life-stage redirect shall not use a question from the quota. | M | The usage count is unchanged after a redirect. | Built |

## 4.16 Engagement (ENG)

| ID | Requirement | Pri | Acceptance criteria | State |
|---|---|---|---|---|
| FR-ENG-01 | The journal shall support create, read, update and delete, prompts, export, and archive with an optional hard-delete retention window. Entry text is encrypted. | S | Export returns all of the user's entries; hard delete runs only when a retention period is configured (`tests/test_journal_purge.py`). | Built |
| FR-ENG-02 | The system shall show journal correlations with planetary periods. | C | Correlations reference real periods. | Built |
| FR-ENG-03 | Goals shall support create, list and delete, up to the plan limit. | C | Exceeding the limit returns an entitlement error. | Built |
| FR-ENG-04 | Streaks shall increment at most once per day, with the day defined in the user's own timezone. | C | Repeated pings on the same day do not increment (`tests/test_streak_api.py`). | Partial: the day is India time (Asia/Kolkata) for every user (decision D-11) |
| FR-ENG-05 | The system shall provide retrospective entries (Premium) and an annual Wrapped summary. Wrapped sharing is Premium-only. | C | Retrospective returns `PREMIUM_REQUIRED` to non-Premium callers once the beta ends. | Built; the Wrapped share gate is in the app only |
| FR-ENG-06 | The system shall provide a decision brief, what-if exploration and prasna. | C | Each endpoint returns 200 within 2 s at p95 for golden charts. | Built (latency target not measured) |
| FR-ENG-07 | Feedback submissions shall reach the admin console with a rating. | M | Each entry is stored with the user, rating, category, page context and time. | Built |

## 4.17 Notifications (NOT)

| ID | Requirement | Pri | Acceptance criteria | State |
|---|---|---|---|---|
| FR-NOT-01 | The system shall send a morning push (today's nalla neram and rahu kalam) to each opted-in user: at most once per local day, at the user's chosen alert time (default 06:00), in the timezone of the user's effective location (current location if set, otherwise birth), and in their language. A catch-up window covers a missed run. | S | No user receives two morning pushes on the same local day (`tests/test_daily_push_cron.py`). | Built |
| FR-NOT-02 | The system shall send a dasha-transition alert when the user's planetary period changes. | S | At most one per user per local day. | Built |
| FR-NOT-03 | Notifications shall be written to a durable outbox and delivered by a worker with retries. | M | A crash between enqueue and send does not lose or duplicate the notification. | Built |
| FR-NOT-04 | Users shall be able to set per-category preferences and the alert time, and register or remove a device or browser push token (`PUT` / `DELETE /settings/notifications/fcm-token`). | M | Opted-out categories are never sent. | Built |
| FR-NOT-05 | The in-app inbox shall list notifications, with read and read-all actions. | S | The unread count updates after each action. | Built |
| FR-NOT-06 | Notification text shall pass the tone rules, and Tamil times shall use Tamil period words. | M | `tests/test_tone_compliance.py` passes. | Built |
| FR-NOT-07 | Operators shall be able to broadcast a notice. | S | The broadcast requires elevation and is audit-logged. | Built |

## 4.18 Plans and payments (PAY)

| ID | Requirement | Pri | Acceptance criteria | State |
|---|---|---|---|---|
| FR-PAY-01 | `POST /webhooks/revenuecat` shall accept subscription events authenticated by a shared-secret bearer token. | M | A wrong or missing token returns 401 (constant-time comparison); an unconfigured secret returns 503. | Built |
| FR-PAY-02 | Each event shall be recorded exactly once, keyed on (provider, event ID). | M | Redelivering an event returns 200 and changes nothing (`tests/test_webhook_inbox.py`). | Built |
| FR-PAY-03 | An event older than the last applied event shall be recorded as stale and change nothing. | M | A renewal followed by an older expiration leaves the subscription active. | Built |
| FR-PAY-04 | Cancellation and billing issues shall keep access until the end of the paid period; expiration ends it. An event that matches no account shall be kept for reconciliation. | M | After `CANCELLATION`, the user remains Premium until `expiration_at`. | Built |
| FR-PAY-05 | `GET /users/me/subscription` shall return the current plan and its expiry. | M | Reflects the last applied event. | Built |
| FR-PAY-06 | Subscription state shall be reconciled with the payment platform's current state, so that a lost event is recovered. | M | A deliberately dropped event is corrected within 24 hours. | Not built (KI-04) |
| FR-PAY-07 | Buying a pay-per-use report shall create the report entitlement once payment is confirmed, and count included Premium reports against the monthly allowance (ER-09). | M | An unconfirmed purchase grants nothing; a confirmed one grants exactly one report. | Not built: `POST /reports/purchase` validates the product and returns a reference only (KI-03) |
| FR-PAY-08 | Purchases shall require an account and be restorable on any device. | M | Signing in on a new device restores entitlements. | Partial (app) |
| FR-PAY-09 | Ending the beta shall need both the server switch and the client copy constant to change. | M | `tests/test_launch_parity.py` fails on a mismatch. | Built |

## 4.19 Public tools and content (PUB)

| ID | Requirement | Pri | Acceptance criteria | State |
|---|---|---|---|---|
| FR-PUB-01 | The `/public/*` endpoints shall serve the free tools without authentication, under the rate limit. | M | Each tool works signed out. | Built |
| FR-PUB-02 | Public pages shall be server-rendered with their own title, description, canonical URL and Tamil/English alternates, and appear in the sitemap. | M | `web/lib/seo-metadata.test.ts` evaluates the real metadata of every page. | Built |
| FR-PUB-03 | Tamil twins of public pages shall be served under `/ta/`. | S | Each English page has a reachable Tamil twin. | Built |
| FR-PUB-04 | All shared content shall use the single public site address. | M | `tests/test_launch_parity.py` fails if the backend and shared constants differ. | Built |
| FR-PUB-05 | Public statistics (`GET /stats/public`) shall expose only aggregate counts. | S | No personal data in the response. | Built |

## 4.20 Settings (SET)

| ID | Requirement | Pri | Acceptance criteria | State |
|---|---|---|---|---|
| FR-SET-01 | Users shall be able to read and update UI settings (language, theme), life mode and journal settings. | M | Changing the account language changes every surface on the next load. | Built |
| FR-SET-02 | Life-focus changes shall record the intent and the surface they came from. | S | Each change writes a life-focus event row. | Built |
| FR-SET-03 | The client shall re-ask the life focus every 60 days with an inline prompt. | S | No modal is used. | Built |

## 4.21 Administration (ADM)

| ID | Requirement | Pri | Acceptance criteria | State |
|---|---|---|---|---|
| FR-ADM-01 | Only admin accounts shall reach operator endpoints. The legacy `X-Admin-Key` shall be refused from browser origins. | M | A non-admin session returns 403 (`tests/test_admin_key_and_attribution.py`). | Built |
| FR-ADM-02 | Destructive and outward-sending actions shall need an elevation token obtained by re-entering the password (`POST /admin/elevate`). The token is short-lived and bound to the operator and their token version. | M | Without elevation, a destructive action is refused with `ELEVATION_REQUIRED` (`tests/test_admin_elevation.py`). | Built |
| FR-ADM-03 | Operators shall be able to list and view users, suspend accounts, and delete a user's data (`DELETE /admin/users/{user_id}/data`, when enabled by configuration). | M | Every action is audit-logged with the operator, time and target. | Built |
| FR-ADM-04 | Operators shall be able to view scheduled jobs and trigger them manually. | M | Triggering a destructive job without elevation is refused. | Built |
| FR-ADM-05 | Operators shall be able to read, set and reset feature flags. | M | Changes take effect without a deployment. | Built |
| FR-ADM-06 | The analytics endpoints shall report daily activity, feature usage, D7/D30 retention, acquisition and life-focus statistics. | M | For a seeded test dataset, each figure equals a direct count over the source tables. | Built |
| FR-ADM-07 | Health endpoints shall report liveness, readiness and detail (database, scheduler heartbeats, dependencies). | M | A stale scheduler heartbeat is reported as unhealthy. | Built |
| FR-ADM-08 | Calculation QA endpoints shall validate against golden cases, keep a regression register, and report prediction calibration. | S | A regression appears in the register until it is cleared. | Built |

<!-- pagebreak -->

# 5. Calculation rules

These rules are fixed by the product's documented convention and by recorded astrology-advisor rulings. Changing one requires a new ruling (BRD BR-19).

| ID | Rule |
|---|---|
| CR-01 | **Zodiac and ayanamsa:** sidereal zodiac with the Lahiri ayanamsa, set explicitly in the ephemeris library (a sidereal flag alone does not select the ayanamsa). Users cannot override it in this release. |
| CR-02 | **Houses:** whole-sign houses from the lagnam for the primary South Indian chart. Bhava madhya (cusp) houses are a secondary view. |
| CR-03 | **Nodes:** Rahu is the **mean** lunar node. Ketu is exactly 180° from Rahu. |
| CR-04 | **Sunrise and sunset:** the apparent **upper limb** of the Sun, with standard atmospheric refraction, at the user's exact coordinates. The engine also supports a geometric disc-centre convention, used only where explicitly requested. The Tamil day runs from sunrise to sunrise. |
| CR-05 | **Tamil months:** solar months that begin when the Sun enters a sidereal sign, with the civil start day set by the documented ingress-time rule. |
| CR-06 | **Panchangam elements:** tithi from the Moon–Sun elongation (12° per tithi); nakshatra from the Moon's longitude (13°20′ each); yoga from the sum of the Sun's and Moon's longitudes; karana as half-tithis. A day's element is the one in force at sunrise; transitions during the day are reported with their times, and a dominant value is computed for the civil day. |
| CR-07 | **Vimshottari dasha:** 120-year cycle. The starting lord and balance come from the natal Moon's nakshatra and the fraction of it left at birth. Sub-periods are proportional. |
| CR-08 | **Day timings:** rahu kalam, yamagandam and kuligai divide the period between actual sunrise and sunset into eight parts, with the weekday choosing the part. |
| CR-09 | **Kuligai is conditional:** whether it suits an activity is decided by the activity. There is no second, fixed polarity table. |
| CR-10 | **Maandhi / Gulika:** proportional nāzhigai division. The Gulika sphuta is taken at the **end** of Saturn's portion. |
| CR-11 | **Transit grading:** Saturn is supportive in houses 3, 6 and 11 from the Moon. Jupiter's grading follows the recorded house table, including the "mixed" grade where ruled. |
| CR-12 | **Chandrashtama:** the Moon transiting the 8th sign from the natal moon sign. It is assigned to calendar days under the recorded day-ownership rule. |
| CR-13 | **Saturn cycles:** classified by Saturn's sign relative to the natal moon sign, e.g. 12th, 1st and 2nd = *ezharai sani* (7½ years); 4th = *ardhashtama*; 8th = *ashtama*. |
| CR-14 | **Sign-edge grahas:** a graha within the defined margin of a sign boundary is flagged, and statements that depend on its sign are qualified. |
| CR-15 | **Porutham factors:** Dinam, Ganam, Mahendra, Stree Dirgha, Yoni, Rasi, Graha Maitri (rasi adhipathi), Vasya, Rajju and Vedha, computed from the birth nakshatras and rasis using the reference tables. A madhyama result scores 0.5. If Rajju or Vedha fails, the label is `CAUTION` whatever the total. |
| CR-16 | **Yoga and dosham status:** "active" refers only to dasha timing; strength is reported separately. Balarishta is never computed for users. |
| CR-17 | **Muhurta couple mode:** marriage only. Each candidate window is scored per partner, the lower score governs, and a veto from either partner removes the window. |
| CR-18 | **Determinism:** the same inputs always produce the same outputs, whatever the request order, cache state or process. |
| CR-19 | **Nadi:** each porutham result also reports the partners' nadis and whether a Nadi dosha applies, with its traditional cancellations, a severity and a mitigation. The parihara mode defaults to `strict`. A Rajju failure is restated as still applying whatever the Nadi outcome. |
| CR-20 | **Two compatibility ladders:** the porutham band (EXCELLENT / GOOD / AVERAGE / CAUTION) measures star-matching alone. The composite compatibility ladder weighs all layers. They answer different questions and may differ; neither is adjusted to match the other (ruling 2026-08-31). Ties in the porutham band round upward. |

# 6. Entitlement rules

| ID | Rule | Enforced today |
|---|---|---|
| ER-01 | Tier limits are defined once in a shared constants module (TypeScript), mirrored on the server (Python), and kept equal by a parity test. Feature code never hard-codes a limit. Every Premium flag must be either gated on a route or listed with a reason as not enforceable (`tests/test_entitlements.py`). | Yes |
| ER-02 | During the open beta, every signed-in user receives Premium limits, except that Ask Vinaadi keeps the registered daily cap (7) and top-ups are off. `tier` still reports the true plan. Clients gate on `openBeta` from `/auth/me`. | Server |
| ER-03 | Birth profiles: guest 0, registered 3, Premium unlimited. Family vault members: 0 / 1 / 5. Goals: 0 / 3 / unlimited. | Server |
| ER-04 | Annual Wrapped: registered and Premium. Wrapped sharing: Premium only. | Wrapped: server (sign-in); sharing: app only |
| ER-05 | Dasha depth: guest none; registered the current major and sub-period; Premium the full tree. | **Not yet (KI-02)** |
| ER-06 | Ask Vinaadi: guests none (sign-in required); registered 7 per day; Premium 30 per month plus top-ups; open beta 7 per day. | Server; top-up purchase not built |
| ER-07 | Rasi palan window: guest today only; registered ± 7 days; Premium ± 30 days. | **Not yet (KI-02)** |
| ER-08 | Premium-only features with a route gate: varshaphala, synastry, retrospective, life-event log, birth-time rectification. Premium-only without a server gate: vargas (app only), life-area history (not built), remedies plan (pending decision D-9). | As stated |
| ER-09 | Included reports per month (Premium): 5 detailed and 3 porutham. Further reports are pay-per-use. | **Not yet (KI-03)** |
| ER-10 | An entitlement failure returns a structured error naming the limit (`PREMIUM_REQUIRED`, `PROFILE_LIMIT_REACHED`, `RESOURCE_LIMIT_EXCEEDED`, `DAILY_LIMIT_REACHED`, `MONTHLY_LIMIT_REACHED`), so the client can show the correct upgrade message. | Server |

# 7. Presentation and content rules

| ID | Rule |
|---|---|
| PR-01 | **Tone:** every interpretation follows *tendency → helpful action → positive frame*. Fixed lists of doom words are blocked by `tests/test_tone_compliance.py`. Health text is preventive only. Remedies are optional. |
| PR-02 | **One language:** only the active language is shown. No bilingual echo of a title. |
| PR-03 | **Display boundary:** clients render astrology terms from language-neutral keys through the localiser (rasi number, graha key, nakshatra, tithi, yoga and karana keys). English `…Name` and `…Code` fields from the API are never rendered, including in `title` and `aria-label` attributes. `web/lib/rasi-display-boundary.test.ts` checks the rasi case. |
| PR-04 | **Tamil terminology:** Tamil almanac naming is preferred over Sanskrit forms. Clock periods use Tamil period words, never "am" or "pm". |
| PR-05 | **Honest labels:** labels describe measured reality (for example, reading length per FR-READ-01). Claims about encryption state exactly what is encrypted (`web/lib/encryption-claim-copy.test.ts`). |
| PR-06 | **No client astrology:** clients present server results and never compute astrology themselves. |
| PR-07 | **Explain every verdict:** each verdict shown has its reason in the same view, and the reason never contradicts the verdict (see KI-01). A view never shows two scales that appear to contradict each other on one card. |
| PR-08 | **Layout stability:** pending states keep the height of the loaded content in both languages. |

<!-- pagebreak -->

# 8. Data requirements

## 8.1 Principal entities

| Entity | Purpose | Key relationships |
|---|---|---|
| users | Account, language, plan, consent timestamp and policy version, acquisition attributes, admin flag, token version | Has birth profiles, vaults, settings |
| birth_profiles | Birth details for a person (encrypted identifying fields; birth-time source and confidence) | Belongs to a user; has charts |
| charts, chart_planets | Computed chart and planetary positions (encrypted positions) | Belongs to a birth profile |
| family_vaults, family_members | Family groupings and relationships | Vault belongs to a user; member links to a birth profile |
| daily_scores, family_daily_scores | Cached daily guidance | Keyed by profile, date and track |
| panchangam_cache | Cached panchangam | Keyed by date, location and ayanamsa |
| transit_snapshots, peyarchi_alerts, relationship_alerts | Transit state and alerts | Chart- or member-scoped |
| interpretation_outputs, prediction_log | Generated interpretations and prediction audit | Chart-scoped |
| journal_entries, user_goals, user_streaks, user_life_events, retrospective_entries | Engagement data | User-scoped |
| numerology_name_sessions | Saved name-correction sessions | Chart-scoped |
| porutham_shares | Public share tokens with expiry and revocation | Created by a user |
| notifications, notification_deliveries, device_tokens, user_notification_preferences | Notification inbox, outbox and delivery; alert time | User-scoped |
| subscriptions, webhook_events | Plan state; event inbox (unique by provider and event ID) | User-scoped |
| ask_vinaadi_usage | AI question metering | User-scoped |
| user_preferences, user_contexts, life_focus_events | Settings, context, focus history | User-scoped |
| refresh_tokens, password_reset_tokens | Credentials lifecycle | User-scoped |
| feedback, newsletter_subscribers | Inbound communication (feedback carries a rating) | Optional user link |
| admin_audit_log, scheduler_heartbeats, qa_golden_cases | Operations and QA | System |
| places | Bundled place index | Reference |

## 8.2 Sensitive data handling

| Data | Classification | Handling |
|---|---|---|
| Birth date, birth time, birth instant (UTC), birth place, birth coordinates, birth timezone | Sensitive personal data | **Encrypted** (field level, versioned keys); decrypted only for calculation |
| Current place, coordinates and timezone | Sensitive personal data | **Encrypted** |
| Family member date of birth | Sensitive personal data | **Encrypted** |
| Chart Julian day and lagna longitude; planet longitude, degree in sign, speed and raw calculation payload | Personal (derived) | **Encrypted** |
| Journal entry text | Personal (private writing) | **Encrypted**; owner-only access; exportable; hard delete after an optional retention period |
| Derived chart keys: rasi, nakshatra, pada | Personal (lower sensitivity) | **Plaintext**, so it can be queried. These narrow down the birth date, and public copy says so. |
| Names (profile, family member, display names) | Personal | **Plaintext** |
| Password | Credential | bcrypt hash only |
| Payment details | Not stored | Handled by app stores and the payment platform |

**Key management**

- Keys are versioned and rotated without losing the ability to decrypt older data. Every new encrypted column is added to the key-rotation and restore-verification scripts.
- An old key is kept for at least as long as the oldest database backup.
- Keys are escrowed in two independent places, not alongside the backups.
- A restore must be performed and verified before launch.

## 8.3 Retention

| Data | Retention |
|---|---|
| Account and profiles | Until the user deletes the account |
| Journal (archived) | Hard-deleted after the configured window (off by default) |
| Porutham shares | Until expiry or revocation |
| Webhook events | As required for reconciliation (to be set; BRD D-5) |
| Audit log | At least 1 year (proposed) |
| Backups | Forward-only policy, with key retention to match |

<!-- pagebreak -->

# 9. Interface requirements

## 9.1 API conventions

| Topic | Requirement |
|---|---|
| Base path | `/api/v1`; breaking changes need a new version or coordinated client updates. Health endpoints are unversioned. |
| Format | JSON with camelCase field names in responses |
| Authentication | Web: session cookie plus `X-Vinaadi-CSRF: 1` on mutating calls. Mobile: `Authorization: Bearer` via `/auth/mobile/*`. |
| Error body | `{ "success": false, "error": { "code": "<STABLE_CODE>", …, "request_id": "…" }, "detail": "…", "request_id": "…" }`. Codes are stable and machine-readable, for example `NOT_AUTHENTICATED`, `ACCESS_DENIED`, `ELEVATION_REQUIRED`, `PREMIUM_REQUIRED`, `PROFILE_LIMIT_REACHED`, `DAILY_LIMIT_REACHED`, `RATE_LIMITED`, `VALIDATION_ERROR`, `CHART_NOT_FOUND`, `SERVICE_UNAVAILABLE`. |
| Status codes | 401 unauthenticated; 403 forbidden, CSRF failure, suspended, or a resource owned by someone else (today; see D-10); 404 not found; 409 conflict; 422 validation; 429 rate or quota limit; 503 dependency not configured or unavailable |
| Rate limiting | 120 requests per 60 s per client by default (configurable); sign-in actions additionally throttled per IP and account; shared Redis backend for multi-worker deployments; the real client IP is taken from the configured trusted-proxy count |
| Contract | The OpenAPI schema is the reference, and Appendix A is generated from it. Any change to a path, parameter or response shape updates the backend, shared client, web and mobile together. |
| Optional filters | Prefer query parameters over path segments |
| Idempotency | Webhook and outbox processing is idempotent |

## 9.2 Client applications

| Client | Requirement |
|---|---|
| Web dashboard | Main navigation: Today, Calendar, Family & Charts, Goals, Life Areas, Tools, Understand; plus Journal and Settings. The settings sections include Danger Zone, where the account is deleted. Deep-linkable path segments use internal IDs (`personal`, `calendar`, `family`, `plan`, `life-areas`, `tools`, `explore`, `journal`, `settings`); legacy `?tab=` links still resolve. |
| Mobile app | Tabs: Today, Panchangam, Tools, Insights, Me. Onboarding stack (birth details, location, rasi picker, jadhagam teaser and reveal); stacks for dasha, transits, vargas, shadbala, varshaphala, synastry, family vault, reading, reports, notifications, Ask Vinaadi, journal, goals, Wrapped. |
| Shared package | All new endpoints get a typed wrapper; new client code uses that wrapper. |

# 10. Non-functional requirements

| ID | Requirement | State |
|---|---|---|
| NFR-ACC-01 | Planetary longitudes agree with the reference values to within 1 arc-minute; panchangam timings to within 1 minute; golden test cases run in continuous integration. | Golden suite in CI |
| NFR-PERF-01 | API p95 latency: under 500 ms for cached daily endpoints; under 2 s for full chart calculation; under 5 s for PDF generation. | Target; baseline not yet measured |
| NFR-PERF-02 | Web: main content within 2.5 s at the 75th percentile on mid-range mobile over 4G. | Target; baseline not yet measured |
| NFR-SEC-01 | Security headers on API responses: HSTS (1 year, subdomains), Content-Security-Policy, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`; secure cookies in production. | Built |
| NFR-SEC-02 | Strong secrets are required at start-up in staging and production; the service refuses to start otherwise. Secrets can be supplied as mounted files (`JOTHIDAM_<FIELD>_FILE`). | Built |
| NFR-SEC-03 | Dependency vulnerability audit runs in CI with no ignored findings. | Built |
| NFR-SEC-04 | Operator actions are audit-logged; destructive actions need a fresh elevation. API docs (`/docs`, `/openapi.json`) are disabled in production. | Built |
| NFR-REL-01 | API availability 99.5% in beta and 99.9% after launch. Scheduler heartbeat monitored. | Target; heartbeat built |
| NFR-REL-02 | Every unbounded wait (network calls, CI jobs, builds) has a timeout. | Built |
| NFR-SCAL-01 | Stateless API workers scale horizontally with a shared Redis for rate limits and throttling. | Built |
| NFR-OBS-01 | Structured logs; health, liveness and readiness endpoints; error monitoring on mobile. | Built |
| NFR-A11Y-01 | WCAG 2.2 AA. An automated accessibility scan across states, both languages, both themes, and 375 px width (`web/e2e/chart-reading-a11y.spec.ts`). | Partial: chart reading scanned; other surfaces in progress |
| NFR-L10N-01 | All strings in Tamil and English; native-reader review before release. | Partial: review backlog open; see OT-04 |
| NFR-MAINT-01 | Automated test suites (backend, web, mobile, end-to-end) must pass in CI before release; database migrations are reversible and tested apply → downgrade → apply. | Built |
| NFR-PRIV-01 | Test fixtures use only clearly synthetic identities, never real birth data. | Built |
| NFR-LIC-01 | Third-party licences (including the Swiss Ephemeris) are recorded in a notices file, and their obligations are met for web and mobile distribution. | **Not built (stop-ship decision D-3)** |
| NFR-OFF-01 | The mobile app shows the last-loaded Today and panchangam when offline. | **Not built (KI-05)** |

# 11. Scheduled jobs

| Job | Schedule (UTC) | Function | Notes |
|---|---|---|---|
| Peyarchi refresh | Daily 02:00 | Refresh transit alerts for all charts | Idempotent recompute |
| Relationship alerts | Daily 02:05 | Refresh relationship (synastry) alerts | Idempotent recompute |
| Panchangam pre-warm | Daily 02:10 | Pre-compute the panchangam for popular locations | Idempotent |
| Daily push | Hourly, on the hour | Send morning and dasha-transition pushes to users whose local alert window is open | Sends outward; elevated trigger |
| Notification outbox | Every minute | Claim and deliver durable push and email intents | Sends outward; elevated trigger |
| Journal purge | Daily 03:00 | Hard-delete journal entries archived beyond the retention window | Destroys data; disabled unless a retention period is set; elevated trigger |

The scheduler and the manual-trigger console read the same job list, so the two cannot drift apart.

# 12. Acceptance and traceability

## 12.1 Release acceptance

A release is accepted when:

1. all **Must** requirements in scope are in the Built state and pass their acceptance criteria;
2. CI is green across the backend, web, mobile and end-to-end suites;
3. the golden calculation cases pass;
4. the accessibility scan passes in both languages;
5. the go-live checklist items for the release are signed off by their owners;
6. every known issue scheduled for the release (Section 13) is closed.

**Recording a check.** Each automated check states what it cannot see. That blind spot is reviewed by hand before a PASS is recorded.

## 12.2 Traceability

| BRD requirement | PRD features | FRD requirements |
|---|---|---|
| BR-01 | F-CHT-01, F-PAN-01, F-DSH-01 | FR-CHART-01…11, FR-PAN-01…08, FR-DSH-01…06, CR-01…20, NFR-ACC-01 |
| BR-02 | All interpretation | PR-01, FR-NOT-06, FR-REM-03, FR-ASK-04, FR-LIFE-02 |
| BR-03 | F-ACC-06, F-PUB-03 | PR-02…04, NFR-L10N-01, FR-SET-01, FR-PUB-03 |
| BR-04 | F-DAY-*, F-ACC-04, F-ENG-* | FR-DAY-01…09, FR-ONB-01…04, FR-ENG-01…07, FR-DSH-02…05 |
| BR-05 | F-FAM-* | FR-FAM-01…07, FR-READ-02 |
| BR-06 | F-CMP-* | FR-CMP-01…06, CR-15, CR-19, CR-20, KI-01 |
| BR-07 | F-MUH-* | FR-MUH-01…04, CR-17 |
| BR-08 | Explainability | FR-READ-01…06, FR-LIFE-01…07, PR-07 |
| BR-09 / BR-10 | F-PAY-* | ER-01…10, FR-PAY-01…09, KI-02…04 |
| BR-11…13 | F-PUB-*, F-ACC-09 | FR-PUB-01…05, FR-AUTH-10 |
| BR-14 | F-ASK-* | FR-ASK-01…07, ER-06 |
| BR-15 | F-NOT-* | FR-NOT-01…07, FR-ENG-04 |
| BR-16 / BR-17 | F-ACC-01, F-ACC-08, F-ENG-01 | FR-AUTH-01, FR-AUTH-09, FR-PROF-06, FR-ENG-01, Section 8.2 |
| BR-18 | F-ADM-* | FR-ADM-01…08, Section 11 |
| BR-19 | Principle P4 | Section 5 |
| BR-20 | F-REM-* | FR-REM-01…03 |
| BR-21 | F-NUM-* | FR-NUM-01…05 |
| BR-22 | F-CHT-04/06/07, F-DSH-02/06 | FR-CHART-03, 04, 07, 08 |
| BR-23 | Principle P8 | PR-06, CR-18, FR-CHART-11 |

Interface-only features (PRD F-DAY-09 quick links, F-FAM-03 member switcher) have no functional requirement by design. They are accepted in the web interface review.

# 13. Known issues and open technical items (at 9 October 2026)

## 13.1 Known issues

| ID | Issue | Requirement | Planned |
|---|---|---|---|
| KI-01 | In `compute_porutham`, the summary sentence is chosen from the score band *before* the Rajju/Vedha veto sets the label to `CAUTION`. A 7/10 result with Rajju failing is therefore labelled `CAUTION` but summarised as "Traditionally considered a suitable match", in English and Tamil. It is visible in the public calculator and the dashboard porutham tool. | FR-CMP-01, PR-07 | Before external launch; the replacement Tamil sentence needs native review |
| KI-02 | Plan limits without a server gate: dasha depth and rasi-palan window (no reader at all), vargas and Wrapped sharing (app only), life-area history (not built), remedies (pending D-9). | ER-04, ER-05, ER-07, ER-08 | Paid launch |
| KI-03 | `POST /reports/purchase` validates the product and returns a reference, but records nothing and grants nothing. | FR-PAY-07 | Paid launch |
| KI-04 | No reconciliation with the payment platform; a permanently lost event is not recovered. | FR-PAY-06 | Paid launch |
| KI-05 | The mobile app has an offline indicator but no offline data cache. | NFR-OFF-01 | Beta hardening |
| KI-06 | Another user's vault or chart returns 403, which confirms that it exists. | FR-FAM-07 | Decision D-10 |
| KI-07 | The streak day is India time for every user. | FR-ENG-04 | Decision D-11 |

## 13.2 Open technical items

| ID | Item | Recommendation |
|---|---|---|
| OT-01 | `birthTimeSource` is free text. A misspelt value silently counts as unreliable, which lowers trust in the lagnam. | Validate against the enumerated values in FR-PROF-04 |
| OT-02 | The docstring of the morning-notification builder says delivery uses the birth city's timezone; the code uses the effective location. | Correct the docstring |
| OT-03 | The guest Ask Vinaadi limit (2 per day) is configured but unreachable, because Ask Vinaadi requires sign-in. | Set it to 0 or remove it, in both constant files |
| OT-04 | In web Settings, the Tamil branch of the "push notifications unavailable" message is in English. | Supply the Tamil string |
| OT-05 | No fixed refusal test set for medical, legal, financial and death-prediction questions to Ask Vinaadi. | Add the test set to `tests/test_ask_vinaadi.py` |
| OT-06 | No dedicated test of birth-time conversion across historical timezone offsets and daylight-saving changes. | Add a test set covering India's pre-1955 offsets and diaspora daylight-saving dates |

<!-- pagebreak -->

# Appendix A. API endpoint catalogue

Generated from the application's OpenAPI route table on 9 October 2026, so every path below exists in the code. Paths are under `/api/v1` except the health endpoints. **Access** is derived from each route's actual authentication dependencies; "Premium (…)" names the plan feature checked on the server. Purposes are the routes' own summaries.

## A.1 Identity and account

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/auth/consent` | Signed-in | Record consent |
| POST | `/auth/forgot-password` | Public | Forgot password |
| POST | `/auth/login` | Public | Login |
| POST | `/auth/logout` | Public | Logout |
| DELETE | `/auth/me` | Signed-in | Delete my account |
| GET | `/auth/me` | Signed-in | Me |
| PATCH | `/auth/me` | Signed-in | Patch me |
| POST | `/auth/mobile/login` | Public | Mobile login |
| POST | `/auth/mobile/logout` | Public | Mobile logout |
| POST | `/auth/mobile/refresh` | Public | Mobile refresh |
| POST | `/auth/mobile/register` | Public | Mobile register |
| GET | `/auth/oauth/google/callback` | Public | Oauth google callback |
| GET | `/auth/oauth/google/start` | Public | Oauth google start |
| GET | `/auth/oauth/providers` | Public | Oauth providers |
| POST | `/auth/register` | Public | Register |
| POST | `/auth/reset-password` | Public | Reset password |
| POST | `/auth/reset-password/confirm` | Public | Reset password |
| POST | `/auth/reset-password/request` | Public | Forgot password |
| GET | `/users/me/referral` | Signed-in | Return (minting on first call) the authenticated user's referral code |
| GET | `/users/me/subscription` | Signed-in | Return the authenticated user's active subscription details |

## A.2 Profiles, places, settings and context

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/birth-profiles` | Signed-in | List birth profiles endpoint |
| POST | `/birth-profiles` | Signed-in | Create birth profile endpoint |
| GET | `/birth-profiles/me/latest` | Signed-in | Get latest birth profile for current user endpoint |
| DELETE | `/birth-profiles/{birth_profile_id}` | Signed-in | Delete a birth profile and all associated chart data |
| GET | `/birth-profiles/{birth_profile_id}` | Signed-in | Get birth profile endpoint |
| PATCH | `/birth-profiles/{birth_profile_id}` | Signed-in | Update birth profile endpoint |
| POST | `/birth-profiles/{birth_profile_id}/confirm-location` | Signed-in | Record that the saved location is still correct, without changing it |
| POST | `/birth-profiles/{birth_profile_id}/rectify` | Signed-in; Premium (birth_time_rectification) | Rectify birth time |
| PATCH | `/birth-profiles/{birth_profile_id}/rectify/apply` | Signed-in; Premium (birth_time_rectification) | Apply rectification |
| GET | `/context` | Signed-in | Get user context |
| POST | `/context` | Signed-in | Upsert user context |
| POST | `/geo/geocode` | Public | Geocode a place name (server-side Nominatim proxy with cache) |
| GET | `/places/search` | Public | Search bundled offline place data |
| GET | `/settings/journal` | Signed-in | Get user journal settings |
| PATCH | `/settings/journal` | Signed-in | Update user journal settings |
| GET | `/settings/life-mode` | Signed-in | Get life mode |
| PATCH | `/settings/life-mode` | Signed-in | Update life mode |
| GET | `/settings/notifications` | Signed-in | Get notification preferences for the current user |
| PATCH | `/settings/notifications` | Signed-in | Update notification preferences (opt-in — all fields optional) |
| DELETE | `/settings/notifications/fcm-token` | Signed-in | Remove FCM device token (deregister push for this device) |
| PUT | `/settings/notifications/fcm-token` | Signed-in | Register or update FCM device token for push delivery |
| GET | `/settings/ui` | Signed-in | Get ui preferences |
| PATCH | `/settings/ui` | Signed-in | Update ui preferences |

## A.3 Charts, readings, predictions and remedies

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/charts/calculate` | Signed-in | Calculate chart |
| GET | `/charts/{chart_id}` | Signed-in | Get chart |
| GET | `/charts/{chart_id}/annual-wrapped` | Signed-in | Get annual wrapped |
| GET | `/charts/{chart_id}/ashtottari-dasha` | Signed-in | Get ashtottari dasha |
| GET | `/charts/{chart_id}/chara-dasha` | Signed-in | Get chara dasha |
| GET | `/charts/{chart_id}/conditional-dashas` | Signed-in | Get conditional dashas |
| GET | `/charts/{chart_id}/daily-guidance` | Signed-in | Daily guidance |
| GET | `/charts/{chart_id}/dasha` | Signed-in | Get dasha |
| GET | `/charts/{chart_id}/dasha/timeline` | Signed-in | Dasha story timeline |
| GET | `/charts/{chart_id}/dashboard-bundle` | Signed-in | Everything the dashboard needs for one chart+date in a single response (DASH-04) |
| GET | `/charts/{chart_id}/event-windows` | Signed-in | Get event windows |
| GET | `/charts/{chart_id}/explanation` | Signed-in | Get explanation |
| GET | `/charts/{chart_id}/export/pdf` | Signed-in | Download a PDF snapshot of the chart, dasha, and daily guidance |
| GET | `/charts/{chart_id}/five-minute` | Signed-in | Your Chart in Four Minutes — nature, its mechanism, and one thing to do |
| GET | `/charts/{chart_id}/gemstone-advice` | Signed-in | Gemstone advice |
| GET | `/charts/{chart_id}/gochar/current` | Signed-in | Gochar current |
| GET | `/charts/{chart_id}/jadhagam-report` | Signed-in | Get report |
| GET | `/charts/{chart_id}/kalachakra-dasha` | Signed-in | Get kalachakra dasha |
| GET | `/charts/{chart_id}/life-areas` | Signed-in | Get chart life areas |
| GET | `/charts/{chart_id}/life-event-log` | Signed-in; Premium (life_event_log) | List life events |
| POST | `/charts/{chart_id}/life-event-log` | Signed-in; Premium (life_event_log) | Create life event |
| GET | `/charts/{chart_id}/life-events` | Signed-in | Get chart life events |
| GET | `/charts/{chart_id}/muhurta` | Signed-in | Get muhurta |
| GET | `/charts/{chart_id}/muhurtham-naals` | Signed-in | Get muhurtham naals for chart |
| GET | `/charts/{chart_id}/one-minute` | Signed-in | Your Chart in Two Minutes — the astrologer's opening reading, in plain language |
| GET | `/charts/{chart_id}/peyarchi/upcoming` | Signed-in | Peyarchi upcoming |
| GET | `/charts/{chart_id}/predictions/career` | Signed-in | Get career prediction |
| GET | `/charts/{chart_id}/predictions/health` | Signed-in | Get health prediction |
| GET | `/charts/{chart_id}/predictions/marriage` | Signed-in | Get marriage prediction |
| GET | `/charts/{chart_id}/predictions/wealth` | Signed-in | Get wealth prediction |
| GET | `/charts/{chart_id}/propensities` | Signed-in | Get propensities |
| GET | `/charts/{chart_id}/remedy-plan` | Signed-in | Remedy plan |
| GET | `/charts/{chart_id}/sani-cycle` | Signed-in | Sani cycle |
| GET | `/charts/{chart_id}/shadbala` | Signed-in | Get shadbala |
| GET | `/charts/{chart_id}/share-card` | Signed-in | Get share card |
| GET | `/charts/{chart_id}/solar-return` | Signed-in | Get solar return |
| GET | `/charts/{chart_id}/summary` | Signed-in | Get summary |
| GET | `/charts/{chart_id}/varshaphala` | Signed-in; Premium (varshaphala) | Get varshaphala endpoint |
| GET | `/charts/{chart_id}/week-ahead` | Signed-in | Week ahead by chart |
| GET | `/charts/{chart_id}/yogini-dasha` | Signed-in | Get yogini dasha |
| GET | `/content/nakshatra/{nakshatra_number}` | Public | Get personality and cultural profile for a Nakshatra (1-27) |

## A.4 Daily guidance, panchangam and transits

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/activity-timing` | Signed-in | Activity timing |
| GET | `/activity-timing/batch` | Signed-in | Activity timing batch |
| GET | `/alerts/ambient` | Signed-in | Ambient alerts |
| GET | `/daily-guidance/range` | Signed-in | Daily guidance range |
| GET | `/daily-guidance/week-ahead` | Signed-in | Week ahead |
| GET | `/daily-snapshot` | Public (personalised if signed in) | Daily snapshot |
| GET | `/muhurta` | Public (personalised if signed in) | Get muhurta for activity location |
| GET | `/panchangam/daily` | Signed-in | Get daily panchangam |
| GET | `/panchangam/monthly` | Signed-in | Get monthly panchangam |
| GET | `/panchangam/tamil-months` | Signed-in | Get tamil months |
| GET | `/panchangam/timings` | Signed-in | Get panchangam timings |
| GET | `/transits/peyarchi-report/{chart_id}` | Signed-in | Peyarchi report |

## A.5 Family, relationships and compatibility

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/family-vaults` | Signed-in | Family vault list endpoint |
| POST | `/family-vaults` | Signed-in | Create family vault endpoint |
| DELETE | `/family-vaults/{family_vault_id}` | Signed-in | Delete a family vault and all member data |
| GET | `/family-vaults/{family_vault_id}` | Signed-in | Family vault detail endpoint |
| GET | `/family-vaults/{family_vault_id}/calendar` | Signed-in | Family calendar endpoint |
| GET | `/family-vaults/{family_vault_id}/composite` | Signed-in | Family composite score timeline with per-member individual scores |
| GET | `/family-vaults/{family_vault_id}/daily-aggregate` | Signed-in | Family daily aggregate endpoint |
| GET | `/family-vaults/{family_vault_id}/harmony-remedies` | Signed-in | Consolidated family-harmony remedies read across every member's chart |
| GET | `/family-vaults/{family_vault_id}/journal` | Signed-in | List family vault journal |
| GET | `/family-vaults/{family_vault_id}/journal/summary` | Signed-in | Get family vault journal summary |
| GET | `/family-vaults/{family_vault_id}/members` | Signed-in | List all members in a family vault |
| POST | `/family-vaults/{family_vault_id}/members` | Signed-in | Add family member endpoint |
| DELETE | `/family-vaults/{family_vault_id}/members/{family_member_id}` | Signed-in | Remove a member from a family vault |
| GET | `/family-vaults/{family_vault_id}/members/{family_member_id}` | Signed-in | Get a single family member |
| PATCH | `/family-vaults/{family_vault_id}/members/{family_member_id}` | Signed-in | Update a family member's details |
| GET | `/family-vaults/{family_vault_id}/summary` | Signed-in | Family summary endpoint |
| GET | `/family-vaults/{family_vault_id}/today` | Signed-in | Today's score and key info for every member in the vault |
| POST | `/porutham-shares` | Signed-in | Create share |
| POST | `/porutham-shares/{share_id}/revoke` | Signed-in | Revoke share |
| GET | `/porutham-shares/{token}` | Public | View share |
| GET | `/relationships/alerts` | Signed-in | Relationship alerts |
| POST | `/relationships/compare` | Signed-in | Compare charts |
| POST | `/relationships/compare-synastry` | Signed-in; Premium (synastry) | Compare synastry |
| POST | `/relationships/compare/pdf` | Signed-in | Compare charts pdf |
| POST | `/relationships/compatibility-intelligence/direct` | Signed-in | Compatibility intelligence direct pair |
| POST | `/relationships/compatibility-intelligence/direct/pdf` | Signed-in | Compatibility intelligence direct pair pdf |
| GET | `/relationships/{member_id}/compatibility-intelligence` | Signed-in | Relationship compatibility intelligence |
| POST | `/relationships/{member_id}/compatibility-intelligence/direct` | Signed-in | Relationship compatibility intelligence direct |
| POST | `/relationships/{member_id}/compatibility-intelligence/direct/pdf` | Signed-in | Relationship compatibility intelligence direct pdf |
| GET | `/relationships/{member_id}/compatibility-intelligence/pdf` | Signed-in | Relationship compatibility intelligence pdf |
| GET | `/relationships/{member_id}/porutham` | Signed-in | Relationship porutham |
| GET | `/relationships/{member_id}/synastry` | Signed-in; Premium (synastry) | Relationship synastry |

## A.6 Numerology

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/charts/{chart_id}/numerology/alignment` | Signed-in | Get fortune alignment |
| GET | `/charts/{chart_id}/numerology/baby-names` | Signed-in | Get baby names |
| GET | `/charts/{chart_id}/numerology/favourable-numbers` | Signed-in | Get favourable numbers |
| GET | `/charts/{chart_id}/numerology/lucky-dates` | Signed-in | Get lucky dates |
| GET | `/charts/{chart_id}/numerology/marriage-dates` | Signed-in | Get marriage dates |
| POST | `/charts/{chart_id}/numerology/name-correction` | Signed-in | Get name correction |
| GET | `/charts/{chart_id}/numerology/name-sessions` | Signed-in | Get numerology name sessions |
| POST | `/charts/{chart_id}/numerology/name-sessions` | Signed-in | Save numerology name session |
| DELETE | `/charts/{chart_id}/numerology/name-sessions/{name_session_id}` | Signed-in | Delete numerology name session |
| GET | `/charts/{chart_id}/numerology/personal-cycle` | Signed-in | Get personal cycle |
| POST | `/numerology/compatibility` | Signed-in | Get numerology compatibility |
| POST | `/public/numerology/baby-names` | Public | Public baby names |
| POST | `/public/numerology/baby-names-preview` | Public | Public baby names preview |
| POST | `/public/numerology/number` | Public | Public numerology number |
| POST | `/public/numerology/personal-year` | Public | Public personal year |
| POST | `/public/numerology/profile` | Public | Public numerology profile |

## A.7 Ask Vinaadi, engagement and notifications

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/ask-vinaadi/daily-status` | Signed-in | Ask vinaadi daily status |
| POST | `/charts/{chart_id}/ask` | Signed-in | Ask vinaadi |
| POST | `/decisions/brief` | Signed-in | Decision brief |
| GET | `/feedback` | Operator | List feedback (admin only) |
| POST | `/feedback` | Signed-in | Submit in-app feedback or a review |
| PATCH | `/feedback/{feedback_id}/reward` | Operator | Flag a reviewer as reward-qualified (admin only, discretionary) |
| GET | `/goals` | Signed-in | List user goals |
| POST | `/goals` | Signed-in | Create user goal |
| DELETE | `/goals/{goal_id}` | Signed-in | Deactivate user goal |
| GET | `/journal` | Signed-in | List journal |
| POST | `/journal` | Signed-in | Create journal |
| GET | `/journal/export` | Signed-in | Export journal |
| GET | `/journal/prompts` | Signed-in | Get prompts for journal |
| POST | `/journal/retention/apply` | Signed-in | Apply journal retention |
| GET | `/journal/{chart_id}/correlations` | Signed-in | Journal correlations |
| DELETE | `/journal/{journal_id}` | Signed-in | Archive journal |
| PATCH | `/journal/{journal_id}` | Signed-in | Update journal |
| POST | `/newsletter` | Public | Subscribe newsletter |
| GET | `/notifications` | Signed-in | List recent notifications for the current user (inbox / bell feed) |
| POST | `/notifications/read-all` | Signed-in | Mark all notifications as read |
| POST | `/notifications/{notification_id}/read` | Signed-in | Mark a notification as read |
| POST | `/prasna` | Signed-in | Ask prasna |
| GET | `/retrospective` | Signed-in; Premium (retrospective) | Get retrospectives |
| POST | `/retrospective` | Signed-in; Premium (retrospective) | Create retrospective |
| GET | `/streak` | Signed-in | Read streak |
| POST | `/streak/ping` | Signed-in | Ping streak |
| POST | `/whatif` | Signed-in | What if simulator |

## A.8 Public tools

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/public/calendar-categories` | Public | Public calendar categories |
| GET | `/public/calendar-categories/{category}` | Public | Public calendar category |
| POST | `/public/chart` | Public | Public chart |
| POST | `/public/chart-preview` | Public | Public chart preview |
| POST | `/public/compare` | Public | Public compare |
| POST | `/public/compare/pdf` | Public | Public compare pdf |
| POST | `/public/friendship-compatibility` | Public | Public friendship compatibility |
| POST | `/public/muhurta` | Public | Public muhurta |
| POST | `/public/muhurta/personalized` | Public | Public personalized muhurta |
| GET | `/public/muhurtham-naals` | Public | Public muhurtham naals |
| GET | `/public/panchangam` | Public | Public panchangam |
| GET | `/public/panchangam-events` | Public | Public panchangam events |
| GET | `/public/panchangam-events/{event}` | Public | Public panchangam event |
| GET | `/public/panchangam-share-card` | Public | Public panchangam share card |
| GET | `/public/panchangam/monthly` | Public | Public panchangam monthly |
| POST | `/public/porutham` | Public | Public porutham |
| POST | `/public/porutham/by-star` | Public | Public porutham by star |
| POST | `/public/porutham/by-star/grid` | Public | Public porutham by star grid |
| GET | `/public/rasi-palan` | Public | Public rasi palan |
| GET | `/public/rasi-palan/grid` | Public | Public rasi palan grid |
| GET | `/stats/public` | Public | Public stats |

## A.9 Payments, reports and operations

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/admin/analytics/acquisition` | Operator | Signups and activation by first-touch channel and landing page (GRW-03) |
| GET | `/admin/analytics/daily` | Operator | New signups and active users per day (last N days) |
| GET | `/admin/analytics/features` | Operator | Overall feature usage counts |
| GET | `/admin/analytics/life-focus` | Operator | Life Focus adoption, first-run Skip, and monthly change rate |
| GET | `/admin/analytics/retention` | Operator | Weekly cohort retention (D7, D30) |
| GET | `/admin/audit-log` | Operator | List admin audit log entries |
| GET | `/admin/calibration` | Operator | D5 prediction calibration report — hit/near/miss per area, band, and dasha lord |
| POST | `/admin/elevate` | Operator | Re-authenticate to authorise destructive admin operations |
| GET | `/admin/flags` | Operator | List all feature flags with current values |
| PATCH | `/admin/flags/{flag_name}` | Operator | Set a feature flag value |
| DELETE | `/admin/flags/{flag_name}/reset` | Operator | Reset a feature flag to its default value |
| GET | `/admin/health/detail` | Operator | Detailed system health for admin |
| GET | `/admin/jobs` | Operator | List all registered background jobs |
| POST | `/admin/jobs/{job_id}/trigger` | Operator | Manually trigger a background job |
| POST | `/admin/notify/broadcast` | Operator | Send push notification to users |
| GET | `/admin/stats` | Operator | Aggregate record counts for admin dashboard |
| GET | `/admin/users` | Operator | List all users (paginated) |
| DELETE | `/admin/users/{owner_user_id}/data` | Operator | Delete all data for a user (GDPR erasure) |
| GET | `/admin/users/{user_id}` | Operator | Get full detail for one user |
| PATCH | `/admin/users/{user_id}/suspend` | Operator | Suspend or unsuspend a user account |
| GET | `/health` | Public | Health check |
| GET | `/health/live` | Public | Liveness check |
| GET | `/health/ready` | Public | Readiness check |
| DELETE | `/qa/regressions` | Operator | Clear all stored regression failures |
| GET | `/qa/regressions` | Operator | List all stored regression failures |
| GET | `/qa/validate` | Operator | Run internal golden test suite |
| POST | `/reports/purchase` | Signed-in | Purchase report |
| POST | `/webhooks/revenuecat` | Payment platform (shared secret) | Revenuecat webhook |


# Appendix B. Glossary

See VIN-BRD-001 Appendix A and VIN-PRD-001 Appendix B.
