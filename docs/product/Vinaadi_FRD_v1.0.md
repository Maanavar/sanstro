---
title: Functional Requirements Document
subtitle: Vinaadi AI: system behaviour, rules, data and interfaces
doc_id: VIN-FRD-001
version: 1.0
date: 9 October 2026
status: Draft for review
classification: External: may be shared with partners, investors and delivery teams
---

# 1. Introduction

## 1.1 Purpose

This document specifies the functional behaviour of the Vinaadi AI platform in enough detail to build, test and accept it. It turns the product features in VIN-PRD-001 into testable requirements, calculation and business rules, data requirements, and interface contracts.

## 1.2 Audience

Engineering teams (backend, web, mobile), QA, solution architects, delivery partners, and technical reviewers on the investor or partner side.

## 1.3 Conventions

- **Requirement IDs:** `FR-<MODULE>-<NN>` (functional), `CR-<NN>` (calculation rule), `ER-<NN>` (entitlement rule), `PR-<NN>` (presentation rule), `NFR-<AREA>-<NN>` (non-functional).
- **"Shall"** marks a mandatory requirement; **"should"** marks a recommended one.
- **Priority:** M = Must, S = Should, C = Could (MoSCoW).
- **API paths** are relative to the versioned base `/api/v1` unless shown otherwise. `{chart_id}` and similar placeholders are UUIDs.
- **Acceptance criteria** are written so that each one can become one or more automated tests.

## 1.4 Reference documents

| ID | Document |
|---|---|
| VIN-BRD-001 | Business Requirements Document |
| VIN-PRD-001 | Product Requirements Document |
| — | Vinaadi AI Product Specification v7.0 (module catalogue and calculation methodology) |
| — | Formula Engine Specification v1 and QA Golden Test Cases v1 |
| — | Technical API and Database Specification v1 |
| — | Live OpenAPI schema, served by the API at `/docs` in non-production environments |

<!-- pagebreak -->

# 2. System overview

## 2.1 Context

Vinaadi is a three-tier system. Two client applications (web and mobile) and a public website call one HTTP API. The API owns **all** astrology calculation, entitlement decisions and data storage. Clients present results and never recompute astrology (PR-06).

| Component | Technology | Responsibility |
|---|---|---|
| Web application | Next.js 15 (React, TypeScript), hand-written CSS design system | Public site (server-rendered for search), signed-in dashboard, admin console |
| Mobile application | Expo / React Native (TypeScript) | Android and iOS daily companion |
| Shared client package | TypeScript workspace package | Typed API wrappers, shared constants (tiers, launch state, site address), shared copy tables |
| API service | Python FastAPI | REST API; authentication; entitlements; orchestration |
| Calculation engine | Python on Swiss Ephemeris | Planetary positions, panchangam, dashas, vargas, strengths, compatibility, muhurta, numerology |
| Interpretation layer | Python services | Converts calculations into narrative guidance under the tone and presentation rules |
| Worker | APScheduler process | Scheduled jobs (Section 11) and the notification delivery outbox |
| Database | PostgreSQL | System of record; Alembic-managed schema migrations |
| Cache / shared state | Redis | Shared rate-limit state and caching for multi-worker deployments |
| Edge | Reverse proxy with automated TLS certificates | TLS termination, routing, security headers |

## 2.2 External interfaces

| System | Purpose | Failure behaviour |
|---|---|---|
| Swiss Ephemeris (bundled library and data) | Astronomical positions | Not a network dependency; ships with the service |
| Anthropic Claude API | Ask Vinaadi answers | Ask Vinaadi returns a polite "unavailable" message; nothing else is affected |
| Firebase Cloud Messaging | Mobile push delivery | Outbox retries; in-app inbox unaffected |
| SMTP email provider | Password reset; transactional email | Outbox retries; the user sees a generic confirmation |
| Google OAuth 2.0 | Social sign-in | Email sign-in remains available |
| RevenueCat with App Store and Google Play | Subscriptions and purchases (webhooks) | Entitlement stays at its last confirmed state |
| Geocoding service (proxied) | Birthplace lookup | Falls back to the bundled offline place index |
| Error monitoring and product analytics (mobile) | Crash reports; usage analytics | Non-blocking |
| Mobile ad network | Ads on free tiers | Non-blocking |

## 2.3 Deployment topology

The production deployment is containerised. It has these services: `db` (PostgreSQL), `redis`, `api` (FastAPI), `worker` (scheduler), `web` (Next.js), `edge` (reverse proxy) and `certbot` (certificate renewal).

- The `web` container holds **no** secrets.
- Secrets are supplied as mounted files.
- Separate staging and production environments are required.

# 3. Actors and access levels

| Actor | Description | Authentication |
|---|---|---|
| Guest | Unauthenticated visitor | None. Public tools and content only. |
| Registered user | Free account holder | Web: session cookie. Mobile: bearer access token plus refresh token. |
| Premium user | Paid subscriber, or any registered user during the open beta | As registered |
| Family member | A person whose chart is held in a user's family vault. Not a system user. | None (data subject only) |
| Operator / admin | Support and operations staff | Admin credentials plus elevated authorisation; every action is audit-logged |
| Scheduler | Internal worker process | Internal |
| Payment platform | Subscription webhook sender | Shared-secret signature verification |

<!-- pagebreak -->

# 4. Functional requirements

## 4.1 Authentication and account (AUTH)

| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| FR-AUTH-01 | The system shall register a user with email and password, and record explicit privacy consent with a timestamp. | M | Registration without consent is rejected; a `consent_given_at` timestamp is stored; a duplicate email is rejected. |
| FR-AUTH-02 | The system shall sign in web users with an HttpOnly, Secure (in production) session cookie that is valid for 1 day. | M | The cookie is not readable from JavaScript; it expires after 24 h; sign-out clears it. |
| FR-AUTH-03 | Cookie-authenticated **mutating** requests shall require the `X-Vinaadi-CSRF` header. | M | A POST, PATCH, PUT or DELETE with a cookie and without the header returns 403; requests with a bearer token are exempt. |
| FR-AUTH-04 | The system shall sign in mobile users with a bearer access token and a rotating refresh token valid for 60 days. | M | `/auth/refresh` issues a new pair and revokes the old refresh token. Reusing a revoked token is treated as theft: every refresh token for that user is revoked and existing access tokens are invalidated. |
| FR-AUTH-05 | The system shall support "Sign in with Google" using OAuth 2.0 with a state parameter. | S | A state mismatch aborts sign-in; a first-time Google user gets an account with consent captured. |
| FR-AUTH-06 | The system shall support password reset by emailed, single-use, time-limited token. | M | The response is identical whether or not the email exists; a token works only once and expires. |
| FR-AUTH-07 | Passwords shall be stored only as bcrypt hashes. | M | No plaintext or reversible password is stored or logged. |
| FR-AUTH-08 | `GET /auth/me` shall return the profile, the true `tier`, and the live `openBeta` flag. | M | Gates in both clients read entitlement from this response, never from a hard-coded constant (ER-02). |
| FR-AUTH-09 | A user shall be able to permanently delete their account and all associated data with `DELETE /auth/me`. | M | After deletion: profiles, charts, family data, journal, notifications and tokens are gone; the session is cleared; further requests return 401. |
| FR-AUTH-10 | The system shall record first-touch acquisition attributes and expose a referral code. | S | Attribution is stored on the user at sign-up; `GET /users/me/referral` returns a stable code. |
| FR-AUTH-11 | An operator shall be able to suspend an account. | M | A suspended user cannot sign in; the action is in the audit log. |

## 4.2 Birth profiles and places (PROF)

| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| FR-PROF-01 | A user shall be able to create, read, update and list birth profiles: name, date, time, place, coordinates, timezone and birth-time confidence. | M | Creation beyond the tier limit (ER-03) returns an entitlement error; the latest profile is available at `/birth-profiles/me/latest`. |
| FR-PROF-02 | The system shall resolve a typed birthplace to coordinates and an IANA timezone. | M | `/places/search` returns matches from the bundled index; `/geo/geocode` resolves other places through the proxy. |
| FR-PROF-03 | Local birth time shall be converted to UTC using the **historical** timezone offset in force at the birth date and place. | M | Dates affected by historical offset or daylight-saving changes convert correctly against reference cases. |
| FR-PROF-04 | Birth-time confidence (`known`, `approximate`, `unknown`) shall be stored. Features that depend on the lagnam shall show it as unconfirmed when the time is unknown. | M | With an unknown time, lagna-dependent statements are suppressed or flagged; moon-based results still show. |
| FR-PROF-05 | Birth-time rectification shall propose a corrected time from known life events and apply it only on the user's confirmation. | C | Proposing does not modify the profile; applying it updates the profile and invalidates the derived chart. |
| FR-PROF-06 | Identifying birth fields shall be stored encrypted (CR-DATA, Section 8.2). | M | The database stores ciphertext for date and time, place, coordinates and timezone fields. |

## 4.3 Chart engine (CHART)

| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| FR-CHART-01 | `POST /charts/calculate` shall compute and persist a chart from a birth profile: sidereal longitudes of the nine grahas, lagnam, rasi, nakshatra and pada for each, house placement, retrogression and combustion. | M | Results match the golden test cases within tolerance (NFR-ACC-01). |
| FR-CHART-02 | The chart shall present the South Indian square layout (whole-sign houses). Bhava madhya cusps are available as a secondary view. | M | Each graha appears in the correct sign box; the lagnam is marked. |
| FR-CHART-03 | The system shall compute divisional charts (vargas), including D9 navamsa, using the documented formulas. | M (D9), C (others) | D9 matches the reference cases for odd and even signs. |
| FR-CHART-04 | The system shall compute Shadbala and Ashtakavarga. | C | Totals match the reference values. |
| FR-CHART-05 | The system shall detect yogas and doshams and grade each by strength. Its **status** shall reflect dasha timing only ("active" = the relevant dasha is running now). | M | Every detected yoga has a display name in both languages (a test checks registry coverage); "active" never means "strong". |
| FR-CHART-06 | Dosham reckoning (for example sevvai dosham) shall apply the recorded cancellation and residual rules, and show the residual and its context. | M | The reference charts produce the ruled outcome on every surface (web, mobile, PDF). |
| FR-CHART-07 | The system shall provide alternative dasha systems: Chara, Yogini, Ashtottari, Kalachakra and conditional dashas. | C | Each endpoint returns period sequences with start and end dates. |
| FR-CHART-08 | The system shall compute the annual (solar-return) chart. | C | At the return moment, the Sun's sidereal longitude equals its natal longitude within the documented tolerance. |
| FR-CHART-09 | The system shall generate a jadhagam PDF in standard and astrologer-detail versions. | S | The PDF opens, is in the user's language, and contains the chart, dasha and readings. |
| FR-CHART-10 | The system shall produce a shareable chart image card. | S | The card shows the public site address and no precise birth time or coordinates. |

## 4.4 Readings and interpretation (READ)

| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| FR-READ-01 | The system shall produce a short reading and a long reading for each chart. The advertised minutes shall equal the median English word count ÷ 118, rounded. | M | A measurement over a chart sample confirms the titles ("two minutes", "four minutes"); titles change only after re-measurement. |
| FR-READ-02 | Readings for family members shall use the third person for adults and a parent-addressed register for minors. | M | No second-person pronoun appears in a member's reading; minors' readings omit adult-only significations. |
| FR-READ-03 | The full reading shall offer a Story view (five chapters, each ≤ 120 words) and an Astrologer view. | S | A budget test fails if any chapter exceeds 120 words; no Story sentence repeats elsewhere on the page. |
| FR-READ-04 | Selections in the Story view shall be computed on the server, and clients shall render the server's selection. | M | A parity test confirms that the server and client selections are equal. |
| FR-READ-05 | Every reading statement shall cite its basis: the planet, house, period or factor it rests on. | M | Each statement maps to at least one chart factor in the response payload. |
| FR-READ-06 | Pending marital-status questions shall be asked *about* the member when the reading is for a family member. | S | The question text names the member; answering it reloads both reading lengths. |

## 4.5 Daily guidance (DAY)

| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| FR-DAY-01 | `GET /charts/{chart_id}/daily-guidance` shall return, for a date and location: a day verdict, a 0–100 rating, life-area guidance, good and caution windows, and reasons. | M | Each rating component maps to an identified factor; the response is deterministic for the same inputs. |
| FR-DAY-02 | Life-area guidance shall be ordered by the user's life focus on the user's own chart, and in neutral order on a family member's chart. | M | Changing the focus reorders only the owner's chart. |
| FR-DAY-03 | The daily score cache shall be keyed by profile, date and focus track. | M | Two tracks for the same day do not overwrite each other. |
| FR-DAY-04 | The system shall flag chandrashtama days, attributing each to the calendar day it belongs to under the recorded day-ownership rule. | M | Reference transitions near midnight and sunrise are attributed correctly. |
| FR-DAY-05 | Activity timing shall return ranked windows for a named activity on a date (single, or batch for several dates). | S | Windows inside rahu kalam or yamagandam are excluded. Kuligai is treated according to the activity (CR-09). |
| FR-DAY-06 | Week-ahead and range endpoints shall return day-level summaries for up to the tier's rasi-palan window. | S | Requests beyond the window return an entitlement error. |
| FR-DAY-07 | `GET /daily-snapshot` shall return a lightweight summary for widgets and notifications. | S | The response carries only summary fields, never the full chart payload. |
| FR-DAY-08 | Ambient alerts shall surface relevant upcoming events (transits, festivals, relationship alerts). | S | Each alert has an expiry and a link to its detail. |
| FR-DAY-09 | The public rasi palan shall serve today's forecast for all 12 moon signs. | M | `/public/rasi-palan` and `/public/rasi-palan/grid` respond without authentication. |

## 4.6 Panchangam and calendar (PAN)

| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| FR-PAN-01 | `GET /panchangam/daily` shall return, for a date and coordinates: sunrise, sunset, tithi, nakshatra, yoga, karana, weekday (vaaram), Tamil date, and transition times during the day. | M | Values match the golden cases; sunrise follows CR-04. |
| FR-PAN-02 | `GET /panchangam/timings` shall return rahu kalam, yamagandam, kuligai, nalla neram and gowri windows. | M | Derived from the day's actual sunrise and sunset at the location (CR-08). |
| FR-PAN-03 | `GET /panchangam/monthly` shall return a month grid, with each day's dominant tithi, nakshatra and yoga, and festivals. | M | Monthly values equal the daily values for the same day. |
| FR-PAN-04 | `GET /panchangam/tamil-months` shall return Tamil month boundaries. | S | Month starts follow the solar ingress rule (CR-05). |
| FR-PAN-05 | The system shall list festival and holiday categories and events by year. | S | The Hindu, Christian, Muslim and Tamil Nadu government holiday lists resolve. |
| FR-PAN-06 | The system shall list muhurtham naal (wedding-auspicious days) for a year. | S | Each listed day carries its nalla neram windows and tithi. |
| FR-PAN-07 | The system shall cache the panchangam per date, location and ayanamsa, and pre-warm popular locations every day. | M | A repeat request is served from cache; the pre-warm job is idempotent. |
| FR-PAN-08 | The system shall render a panchangam share card and an embeddable widget. | S | The widget loads without authentication. |

## 4.7 Dasha and transits (DSH)

| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| FR-DSH-01 | `GET /charts/{chart_id}/dasha` shall return the Vimshottari tree to the tier's depth (ER-05). | M | The balance at birth matches the golden case; Premium includes pratyantardasha. |
| FR-DSH-02 | A timeline endpoint shall return dasha periods positioned against today. | S | The current period is flagged. |
| FR-DSH-03 | `GET /charts/{chart_id}/gochar/current` shall return the current transit of each graha relative to the natal moon and lagnam, with a grade. | M | Guru and Sani grades follow the recorded supportive-house rulings (CR-11). |
| FR-DSH-04 | `GET /charts/{chart_id}/sani-cycle` shall return the current and next Saturn phases with dates. | M | The phase boundaries match the reference Saturn-cycle cases. |
| FR-DSH-05 | Upcoming peyarchi and a personal peyarchi report shall be available. | S | The next Guru, Sani and Rahu-Ketu sign changes are listed with dates. |
| FR-DSH-06 | The system shall refresh peyarchi alerts for all charts every day (Section 11). | S | The job is idempotent; re-running it creates no duplicate alerts. |

## 4.8 Life areas and predictions (LIFE)

| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| FR-LIFE-01 | `GET /charts/{chart_id}/life-areas` shall return scored life areas with narratives. | S | The output matches the golden snapshot for the reference charts. |
| FR-LIFE-02 | The prediction endpoints (marriage, career, wealth, health) shall return timing windows and tendencies, each with a stated basis. | S | Every window lists its contributing factors; health text is preventive only. |
| FR-LIFE-03 | Marriage prediction shall give the same result for the same chart regardless of request order or caching. | M | A determinism test passes over the golden cases. |
| FR-LIFE-04 | The system shall compute bhava palan (results by house) using the agreed grade cut-offs. | S | Grades follow the configured thresholds. |
| FR-LIFE-05 | Life-event windows and propensities shall be available per chart. | C | Endpoints respond for any valid chart. |
| FR-LIFE-06 | A user shall be able to log real life events against a chart. | C | Entries persist and are listed in date order. |

## 4.9 Family (FAM)

| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| FR-FAM-01 | A user shall be able to create a family vault and add members, each with birth details and a relationship to the owner. | M | Adding members beyond the tier limit returns an entitlement error. |
| FR-FAM-02 | A member whose relationship is `self` shall be treated as the owner. | M | Life focus applies only to the owner. |
| FR-FAM-03 | Each member shall have readings, daily guidance and charts like the owner's (FR-READ-02 voice rules). | M | Every member offers both reading lengths. |
| FR-FAM-04 | `GET /family-vaults/{id}/calendar` shall merge members' significant days. | S | Each entry names the member it concerns. |
| FR-FAM-05 | The system shall compute relationship alerts between members every day. | C | Alerts are de-duplicated per pair and period. |
| FR-FAM-06 | Only the vault owner shall be able to read or modify vault data. | M | Another user's request returns 404 (no existence leak). |

## 4.10 Compatibility (CMP)

| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| FR-CMP-01 | The system shall compute Tamil 10-porutham between two charts or two birth stars, giving each factor's result and an overall verdict. | M | The ten factors (dina, gana, mahendra, stree deergham, yoni, rasi, rasi adhipathi, vasya, rajju, vedhai) match the reference tables. |
| FR-CMP-02 | The system shall provide a star-by-star porutham grid. | S | 27 × 27 results are consistent with the pairwise endpoint. |
| FR-CMP-03 | A chart comparison shall add dasha-period comparison, a navamsa view and remedies, with PDF export. | S | The PDF is generated in the requested language. |
| FR-CMP-04 | A user shall be able to create a public share token for a porutham result. | S | `/porutham-shares/{token}` renders without authentication and contains no birth times or coordinates. |
| FR-CMP-05 | The system shall provide friendship compatibility and synastry. | C | Both endpoints respond for any two valid inputs. |

## 4.11 Muhurta (MUH)

| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| FR-MUH-01 | The system shall return ranked muhurta windows for an activity, date range and location, with the reasons for each. | M | No window falls in rahu kalam, yamagandam or an excluded tithi or nakshatra for that activity. |
| FR-MUH-02 | Personalised muhurta shall exclude the user's chandrashtama and weak tara bala days. | M | A reference chart's chandrashtama days never appear. |
| FR-MUH-03 | Couple mode shall evaluate both charts, with the weaker chart's result governing. | S | A day bad for either partner is not ranked as good. |
| FR-MUH-04 | Muhurta scores shall use a documented, bounded scale. | M | Scores fall within the documented range. |

## 4.12 Numerology and naming (NUM)

| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| FR-NUM-01 | The system shall compute a numerology profile, personal year and cycle, favourable numbers and lucky dates. | S | Results match the reference values. |
| FR-NUM-02 | Name correction shall return candidate spellings, each with a verdict and an explanation consistent with its own numbers. | S | No explanation contradicts the numbers it reports. |
| FR-NUM-03 | Name-correction sessions shall be saveable, listable and deletable. | C | Deletion removes the session permanently. |
| FR-NUM-04 | The baby-name finder shall filter names by the child's birth-star naming syllables and numerology, and show their meanings. | S | Every returned name starts with a valid syllable for the nakshatra pada. |
| FR-NUM-05 | The system shall provide numerology compatibility and favourable marriage dates. | C | Both endpoints respond for valid input. |

## 4.13 Remedies (REM)

| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| FR-REM-01 | The system shall produce a remedy plan tied to the current dasha lord. Remedies are never selected by the life focus. | S | Changing the focus does not change the remedy. |
| FR-REM-02 | Gemstone advice shall include suitability caveats. | C | The caveat is always present in the response. |
| FR-REM-03 | All remedy text shall be framed as optional (PR-01). | M | The copy check finds no obligation wording. |

## 4.14 Ask Vinaadi (ASK)

| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| FR-ASK-01 | `POST /charts/{chart_id}/ask` shall answer a natural-language question, grounded in the chart's computed data, in the user's language. | S | The prompt includes only computed chart facts; the answer follows the tone rules. |
| FR-ASK-02 | The system shall enforce per-tier question limits (ER-06) and count usage on the server. | M | Exceeding the limit returns a limit error with the reset time; usage cannot be reset by the client. |
| FR-ASK-03 | `GET /ask-vinaadi/daily-status` shall return questions used and remaining. | S | The client's limit meter matches the server's count. |
| FR-ASK-04 | The assistant shall decline medical, legal and financial advice, and predictions of death or disaster. | M | A red-team test set produces refusals or redirects. |
| FR-ASK-05 | When the AI provider is unavailable, the endpoint shall fail gracefully and shall not consume a question. | M | A simulated provider error leaves the usage count unchanged. |

## 4.15 Engagement (ENG)

| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| FR-ENG-01 | The journal shall support create, read, update and delete operations, prompts, export, and archive with an optional hard-delete retention window. | S | Export returns all of the user's entries; hard delete runs only when a retention period is configured. |
| FR-ENG-02 | The system shall show journal correlations with planetary periods. | C | Correlations reference real periods. |
| FR-ENG-03 | Goals shall support create, list and delete, up to the tier limit. | C | Exceeding the limit returns an entitlement error. |
| FR-ENG-04 | Streaks shall increment at most once per local day. | C | Repeated pings on the same day do not increment the streak. |
| FR-ENG-05 | The system shall provide retrospective entries and an annual Wrapped summary. Wrapped sharing is Premium-only. | C | ER-04 is enforced. |
| FR-ENG-06 | The system shall provide a decision brief, what-if exploration and prasna. | C | Each endpoint responds within the performance budget. |
| FR-ENG-07 | Feedback submissions shall reach the admin console. | M | Each entry is stored with the user, time and context. |

## 4.16 Notifications (NOT)

| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| FR-NOT-01 | The system shall send one morning guidance push per opted-in user, in the user's local morning window and language. | S | No user receives two morning pushes on the same local day. |
| FR-NOT-02 | Notifications shall be written to a durable outbox and delivered by a worker with retries. | M | A crash between enqueue and send does not lose or duplicate the notification. |
| FR-NOT-03 | Users shall be able to set per-category preferences, and register or remove a device token (`PUT` / `DELETE /settings/notifications/fcm-token`). | M | Opted-out categories are never sent. |
| FR-NOT-04 | The in-app inbox shall list notifications, with read and read-all actions. | S | The unread count updates after each action. |
| FR-NOT-05 | Notification text shall pass the tone rules. | M | The copy check finds no doom vocabulary. |
| FR-NOT-06 | Operators shall be able to broadcast a notice. | S | The broadcast is in the audit log. |

## 4.17 Plans and payments (PAY)

| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| FR-PAY-01 | The system shall process RevenueCat webhooks (`POST /webhooks/revenuecat`) to create, renew, cancel and expire subscriptions. | M | Signatures are verified; events are idempotent (stored by event ID); replaying an event changes nothing. |
| FR-PAY-02 | `GET /users/me/subscription` shall return the current plan and its expiry. | M | Reflects the last confirmed event. |
| FR-PAY-03 | Pay-per-use report purchase shall create the report entitlement once payment is confirmed. | M | An unconfirmed purchase grants nothing. |
| FR-PAY-04 | Purchases shall require an account and be restorable on any device. | M | Signing in on a new device restores entitlements. |
| FR-PAY-05 | Ending the beta shall need both the server switch and the client copy constant to change. A parity test shall fail if they disagree. | M | `tests/test_launch_parity.py` fails on a mismatch. |

## 4.18 Public tools and content (PUB)

| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| FR-PUB-01 | The `/public/*` endpoints shall serve the free tools without authentication, under the rate limit. | M | Each tool works signed out. |
| FR-PUB-02 | Public pages shall be server-rendered with their own title, description, canonical URL and Tamil/English alternates, and appear in the sitemap. | M | A metadata test evaluates the real metadata of every page. |
| FR-PUB-03 | Tamil twins of public pages shall be served under `/ta/`. | S | Each English page has a reachable Tamil twin. |
| FR-PUB-04 | All shared content shall use the single public site address. | M | The parity test fails if the backend and shared constants differ. |
| FR-PUB-05 | Public statistics (`/stats/public`) shall expose only aggregate counts. | S | No personal data in the response. |

## 4.19 Settings (SET)

| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| FR-SET-01 | Users shall be able to read and update UI settings (language, theme), life mode and journal settings. | M | Changing the account language changes every surface on the next load. |
| FR-SET-02 | Life-focus changes shall record the intent and the surface they came from. | S | Each change writes a life-focus event row. |
| FR-SET-03 | The client shall re-ask the life focus every 60 days with an inline prompt. | S | No modal is used; skipping saves "balanced" without blocking the user. |

## 4.20 Administration (ADM)

| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| FR-ADM-01 | Operators shall be able to list and view users, and suspend accounts. | M | Every action is audit-logged with the operator, time and target. |
| FR-ADM-02 | Operators shall be able to view scheduled jobs and trigger them manually. Destructive or outward-sending jobs need elevated authorisation. | M | Triggering a destructive job without elevation is refused. |
| FR-ADM-03 | Operators shall be able to read, set and reset feature flags. | M | Changes take effect without a deployment. |
| FR-ADM-04 | The analytics endpoints shall report daily activity, feature usage, retention, acquisition and life-focus statistics. | M | The figures reconcile with the raw tables. |
| FR-ADM-05 | A detailed health endpoint shall report the database, scheduler heartbeats and dependencies. | M | A stale scheduler heartbeat is reported as unhealthy. |
| FR-ADM-06 | Calculation QA endpoints shall validate against golden cases and keep a regression register. | S | A regression appears in the register until it is cleared. |

<!-- pagebreak -->

# 5. Calculation rules

These rules are fixed by the product's documented convention and by recorded astrology-advisor rulings. Changing one requires a new ruling (BRD BR-19).

| ID | Rule |
|---|---|
| CR-01 | **Zodiac and ayanamsa:** sidereal zodiac with the Lahiri (Chitrapaksha) ayanamsa, set explicitly in the ephemeris library. A sidereal flag alone does not select the ayanamsa. Users cannot override it in this release. |
| CR-02 | **Houses:** whole-sign houses from the lagnam for the primary South Indian chart. Bhava madhya (cusp) houses are a secondary view. |
| CR-03 | **Nodes:** Rahu and Ketu use the documented node convention. Ketu is exactly 180° from Rahu. |
| CR-04 | **Sunrise and sunset:** the apparent **upper limb** of the Sun, with standard atmospheric refraction, at the user's exact coordinates. The Tamil day runs from sunrise to sunrise. |
| CR-05 | **Tamil months:** solar months that begin when the Sun enters a sidereal sign, with the civil start day set by the documented ingress-time rule. |
| CR-06 | **Panchangam elements:** tithi from the Moon–Sun elongation (12° per tithi); nakshatra from the Moon's longitude (13°20′ each); yoga from the sum of the Sun's and Moon's longitudes; karana as half-tithis. A day's element is the one in force at sunrise; transitions during the day are reported with their times. |
| CR-07 | **Vimshottari dasha:** 120-year cycle. The starting lord and balance come from the natal Moon's nakshatra and the fraction of it left at birth. Sub-periods are proportional. |
| CR-08 | **Day timings:** rahu kalam, yamagandam and kuligai divide the period between actual sunrise and sunset into eight parts, with the weekday choosing the part. |
| CR-09 | **Kuligai is conditional:** whether it suits an activity is decided by the activity. There is no second, fixed polarity table. |
| CR-10 | **Maandhi / Gulika:** proportional nāzhigai division. The Gulika sphuta is taken at the **end** of Saturn's portion. |
| CR-11 | **Transit grading:** Saturn is supportive in houses 3, 6 and 11 from the Moon. Jupiter's grading follows the recorded house table, including the "mixed" grade where ruled. |
| CR-12 | **Chandrashtama:** the Moon transiting the 8th sign from the natal moon sign. It is assigned to calendar days under the recorded day-ownership rule. |
| CR-13 | **Saturn cycles:** classified by Saturn's sign relative to the natal moon sign, e.g. 12th, 1st and 2nd = *ezharai sani* (7½ years); 4th = *ardhashtama*; 8th = *ashtama*. |
| CR-14 | **Sign-edge grahas:** a graha within the defined margin of a sign boundary is flagged, and statements that depend on its sign are qualified. |
| CR-15 | **Porutham:** the ten Tamil poruthams are computed from the birth nakshatras and rasis, using the reference tables. Rajju and vedhai are treated as critical factors. |
| CR-16 | **Yoga and dosham status:** "active" refers only to dasha timing. Strength is reported separately. Balarishta is never shown to users. |
| CR-17 | **Muhurta couple mode:** each candidate window is scored per partner, and the lower score governs. |
| CR-18 | **Determinism:** the same inputs always produce the same outputs, whatever the request order, cache state or process. |

# 6. Entitlement rules

| ID | Rule |
|---|---|
| ER-01 | Tier limits are defined once in a shared constants module (TypeScript), mirrored on the server (Python), and kept equal by a parity test. Feature code never hard-codes a limit. |
| ER-02 | During the open beta, every signed-in user receives the open-beta limits (Premium-equivalent), while `tier` still reports the true plan. Clients read `openBeta` from `/auth/me` for gating. |
| ER-03 | Birth profiles: guest 0, registered 3, Premium unlimited. Family vault members: 0 / 1 / 5. Goals: 0 / 3 / unlimited. |
| ER-04 | Annual Wrapped: registered and Premium. Wrapped sharing: Premium only. |
| ER-05 | Dasha depth: guest none; registered the current major and sub-period; Premium the full tree. |
| ER-06 | Ask Vinaadi: guest 2 per day; registered 7 per day; Premium 30 per month plus top-ups; open beta 7 per day as fair use. |
| ER-07 | Rasi palan window: guest today only; registered ± 7 days; Premium ± 30 days. |
| ER-08 | Premium-only features: varshaphala, vargas, synastry, retrospective, remedies plan, life-event log, birth-time rectification, life-area history. |
| ER-09 | Included reports per month (Premium): 5 detailed and 3 porutham. Further reports are pay-per-use. |
| ER-10 | An entitlement failure returns a structured error naming the limit, so the client can show the correct upgrade message. |

# 7. Presentation and content rules

| ID | Rule |
|---|---|
| PR-01 | **Tone:** every interpretation follows *tendency → helpful action → positive frame*. Fixed lists of doom words are blocked by tests. Health text is preventive only. Remedies are optional. |
| PR-02 | **One language:** only the active language is shown. No bilingual echo of a title. |
| PR-03 | **Display boundary:** clients render astrology terms from language-neutral keys through the localiser (rasi number, graha key, nakshatra, tithi, yoga and karana keys). English `…Name` and `…Code` fields from the API are never rendered, including in `title` and `aria-label` attributes. |
| PR-04 | **Tamil terminology:** Tamil almanac naming is preferred over Sanskrit forms. Clock periods use Tamil period words, never "am" or "pm". |
| PR-05 | **Honest labels:** labels describe measured reality (for example, reading length per FR-READ-01). Claims about encryption state exactly what is encrypted. |
| PR-06 | **No client astrology:** clients present server results and never compute astrology themselves. |
| PR-07 | **Explain every verdict:** each verdict shown has its reason in the same view. A view never shows two scales that appear to contradict each other on one card. |
| PR-08 | **Layout stability:** pending states keep the height of the loaded content in both languages. |

<!-- pagebreak -->

# 8. Data requirements

## 8.1 Principal entities

| Entity | Purpose | Key relationships |
|---|---|---|
| users | Account, language, plan, consent timestamp, acquisition attributes | Has birth profiles, vaults, settings |
| birth_profiles | Birth details for a person (encrypted identifying fields) | Belongs to a user; has charts |
| charts, chart_planets | Computed chart and planetary positions | Belongs to a birth profile |
| family_vaults, family_members | Family groupings and relationships | Vault belongs to a user; member links to a birth profile |
| daily_scores, family_daily_scores | Cached daily guidance | Keyed by profile, date and track |
| panchangam_cache | Cached panchangam | Keyed by date, location and ayanamsa |
| transit_snapshots, peyarchi_alerts, relationship_alerts | Transit state and alerts | Chart- or member-scoped |
| interpretation_outputs, prediction_log | Generated interpretations and prediction audit | Chart-scoped |
| journal_entries, user_goals, user_streaks, user_life_events, retrospective_entries | Engagement data | User-scoped |
| numerology_name_sessions | Saved name-correction sessions | Chart-scoped |
| porutham_shares | Public share tokens | Created by a user |
| notifications, notification_deliveries, device_tokens, user_notification_preferences | Notification inbox, outbox and delivery | User-scoped |
| subscriptions, webhook_events | Plan state; idempotent payment events | User-scoped |
| ask_vinaadi_usage | AI question metering | User-scoped |
| user_preferences, user_contexts, life_focus_events | Settings, context, focus history | User-scoped |
| refresh_tokens, password_reset_tokens | Credentials lifecycle | User-scoped |
| feedback, newsletter_subscribers | Inbound communication | Optional user link |
| admin_audit_log, scheduler_heartbeats, qa_golden_cases | Operations and QA | System |
| places | Bundled place index | Reference |

## 8.2 Sensitive data handling

| Data | Classification | Handling |
|---|---|---|
| Birth date and time, birth place, coordinates, timezone, current location | Sensitive personal data | Field-level encryption with versioned keys; decrypted only for calculation |
| Derived chart keys (rasi, nakshatra, pada) | Personal (lower sensitivity) | Plaintext, so it can be queried. **This narrows down the birth date**, and public copy must say so. |
| Planetary longitudes and Julian day for a chart | Personal | Encrypted where stored on the chart path |
| Journal entries | Personal | Owner-only access; exportable; hard delete after an optional retention period |
| Password | Credential | bcrypt hash only |
| Payment details | Not stored | Handled by app stores and the payment platform |

**Key management**

- Keys are versioned and rotated without losing the ability to decrypt older data.
- An old key is kept for at least as long as the oldest database backup.
- Keys are escrowed in two independent places, not alongside the backups.
- A restore must be performed and verified before launch.

## 8.3 Retention

| Data | Retention |
|---|---|
| Account and profiles | Until the user deletes the account |
| Journal (archived) | Hard-deleted after the configured window (off by default) |
| Webhook events | As required for reconciliation (to be set; BRD D-5) |
| Audit log | At least 1 year (proposed) |
| Backups | Forward-only policy, with key retention to match |

<!-- pagebreak -->

# 9. Interface requirements

## 9.1 API conventions

| Topic | Requirement |
|---|---|
| Base path | `/api/v1`; breaking changes need a new version or coordinated client updates |
| Format | JSON with camelCase field names in responses |
| Authentication | Web: session cookie plus CSRF header on mutating calls. Mobile: `Authorization: Bearer`. |
| Errors | Consistent error body with machine-readable codes; 401 unauthenticated, 403 forbidden or CSRF, 404 not found (including "not yours"), 409 conflict, 422 validation, 429 rate limited |
| Rate limiting | 120 requests per 60 s per client by default (configurable); shared backend for multi-worker deployments; the real client IP is taken from the configured trusted-proxy count |
| Contract | The OpenAPI schema is the reference. Shared typed wrappers are checked against it. Any change to a path, parameter or response shape updates the backend, shared client, web and mobile together. |
| Optional filters | Prefer query parameters over path segments |
| Idempotency | Webhook and outbox processing is idempotent |

## 9.2 Client applications

| Client | Requirement |
|---|---|
| Web dashboard | Tabs: Today, Calendar, Family and Charts, Life Areas, Plan, Journal, Tools, Explore, Settings. Deep-linkable path segments; legacy `?tab=` links still resolve. |
| Mobile app | Tabs: Today, Panchangam, Tools, Insights, Me. Onboarding stack; stacks for dasha, transits, family vault, reading, reports, notifications, Ask Vinaadi. |
| Shared package | All new endpoints get a typed wrapper; new client code uses that wrapper. |

# 10. Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-ACC-01 | Planetary longitudes agree with the reference values to within 1 arc-minute; panchangam timings to within 1 minute; golden test cases run in continuous integration. |
| NFR-PERF-01 | API p95 latency: under 500 ms for cached daily endpoints; under 2 s for full chart calculation; under 5 s for PDF generation. |
| NFR-PERF-02 | Web: main content within 2.5 s at the 75th percentile on mid-range mobile over 4G. |
| NFR-SEC-01 | Security headers (HSTS, CSP, frame-ancestors, referrer policy) on all responses; secure cookies in production. |
| NFR-SEC-02 | Strong secrets are required at start-up in staging and production; the service refuses to start otherwise. Secrets are supplied as mounted files. |
| NFR-SEC-03 | Dependency vulnerability audit runs in CI with no ignored findings. |
| NFR-SEC-04 | Operator actions are audit-logged; destructive jobs need elevation. |
| NFR-REL-01 | API availability 99.5% in beta and 99.9% after launch. Scheduler heartbeat monitored. |
| NFR-REL-02 | Every unbounded wait (network calls, CI jobs, builds) has a timeout. |
| NFR-SCAL-01 | Stateless API workers scale horizontally with a shared Redis for rate limits. |
| NFR-OBS-01 | Structured logs; health and liveness endpoints; error monitoring on mobile. |
| NFR-A11Y-01 | WCAG 2.2 AA. An automated accessibility scan across states, both languages, both themes, and 375 px width. |
| NFR-L10N-01 | All strings in Tamil and English; native-reader review before release. |
| NFR-MAINT-01 | Automated test suites (backend, web, mobile, end-to-end) must pass in CI before release; database migrations are reversible and are tested apply → downgrade → apply. |
| NFR-PRIV-01 | Test fixtures use only clearly synthetic identities, never real birth data. |
| NFR-LIC-01 | Third-party licences (including the Swiss Ephemeris) are recorded in a notices file, and their obligations are met for web and mobile distribution. |

# 11. Scheduled jobs

| Job | Schedule (UTC) | Function | Notes |
|---|---|---|---|
| Peyarchi refresh | Daily 02:00 | Refresh transit alerts for all charts | Idempotent recompute |
| Relationship alerts | Daily 02:05 | Refresh relationship (synastry) alerts | Idempotent recompute |
| Panchangam pre-warm | Daily 02:10 | Pre-compute the panchangam for popular locations | Idempotent |
| Daily push | Hourly, on the hour | Send the morning push to users whose local morning window is open | Sends outward; elevated trigger |
| Notification outbox | Every minute | Claim and deliver durable push and email intents | Sends outward; elevated trigger |
| Journal purge | Daily 03:00 | Hard-delete journal entries archived beyond the retention window | Destroys data; disabled unless a retention period is set; elevated trigger |

The scheduler and the manual-trigger console read the same job list, so the two cannot drift apart.

# 12. Acceptance and traceability

## 12.1 Release acceptance

A release is accepted when:

1. all **Must** requirements in scope pass their acceptance criteria;
2. CI is green across the backend, web, mobile and end-to-end suites;
3. the golden calculation cases pass;
4. the accessibility scan passes in both languages;
5. the go-live checklist items for the release are signed off by their owners.

**Recording a check.** Each automated check states what it cannot see. That blind spot is reviewed by hand before a PASS is recorded.

## 12.2 Traceability

| BRD requirement | PRD features | FRD requirements |
|---|---|---|
| BR-01 | F-CHT-01, F-PAN-01, F-DSH-01 | FR-CHART-01…08, FR-PAN-01…04, CR-01…18, NFR-ACC-01 |
| BR-02 | All interpretation | PR-01, FR-NOT-05, FR-REM-03, FR-ASK-04 |
| BR-03 | F-ACC-05, F-PUB-03 | PR-02…04, NFR-L10N-01, FR-SET-01 |
| BR-04 | F-DAY-* | FR-DAY-01…09 |
| BR-05 | F-FAM-* | FR-FAM-01…06, FR-READ-02 |
| BR-06 | F-CMP-* | FR-CMP-01…05, CR-15 |
| BR-07 | F-MUH-* | FR-MUH-01…04, CR-17 |
| BR-08 | Explainability | FR-READ-05, PR-07 |
| BR-09 / BR-10 | F-PAY-* | ER-01…10, FR-PAY-01…05 |
| BR-11…13 | F-PUB-*, F-ACC-08 | FR-PUB-01…05, FR-AUTH-10 |
| BR-14 | F-ASK-* | FR-ASK-01…05, ER-06 |
| BR-15 | F-NOT-* | FR-NOT-01…06 |
| BR-16 / BR-17 | F-ACC-01, F-ACC-07 | FR-AUTH-01, FR-AUTH-09, FR-PROF-06, Section 8.2 |
| BR-18 | F-ADM-* | FR-ADM-01…06, Section 11 |
| BR-19 | Principle P4 | Section 5 |
| BR-20 | F-REM-* | FR-REM-01…03 |
| BR-21 | F-NUM-* | FR-NUM-01…05 |
| BR-22 | F-CHT-04/06/07, F-DSH-02 | FR-CHART-03, 04, 07, 08 |
| BR-23 | Principle P8 | PR-06, CR-18 |

<!-- pagebreak -->

# Appendix A. API endpoint catalogue

All paths are under `/api/v1` except the health endpoints. "Public" = no authentication.

## A.1 Identity and account

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | /auth/register | Public | Register (web) |
| POST | /auth/login | Public | Sign in (web cookie or mobile tokens) |
| POST | /auth/logout | User | Sign out |
| POST | /auth/refresh | Mobile | Rotate tokens |
| GET / PATCH | /auth/me | User | Profile, tier, openBeta / update profile |
| DELETE | /auth/me | User | Permanently delete account |
| POST | /auth/consent | User | Record consent |
| POST | /auth/forgot-password, /auth/reset-password | Public | Password reset |
| GET | /auth/oauth/providers, /auth/oauth/google/start, /auth/oauth/google/callback | Public | Google sign-in |
| GET | /users/me/subscription, /users/me/referral | User | Plan; referral code |

## A.2 Profiles, places and settings

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET / POST | /birth-profiles | User | List / create |
| GET / PATCH | /birth-profiles/{id} | User | Read / update |
| GET | /birth-profiles/me/latest | User | Latest profile |
| POST / PATCH | /birth-profiles/{id}/rectify, /rectify/apply | User | Birth-time rectification |
| GET | /places/search | Public | Offline place search |
| POST | /geo/geocode | Public | Geocoding proxy |
| GET / PATCH | /settings/ui, /settings/life-mode, /settings/journal | User | Settings |
| GET / PATCH | /settings/notifications | User | Notification preferences |
| PUT / DELETE | /settings/notifications/fcm-token | User | Device token |
| GET / POST | /context | User | User context |

## A.3 Charts, readings and predictions

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | /charts/calculate | User | Compute chart |
| GET | /charts/{id}, /summary, /explanation, /jadhagam-report | User | Chart, summary, reading, report |
| GET | /charts/{id}/dasha, /chara-dasha, /yogini-dasha, /ashtottari-dasha, /kalachakra-dasha, /conditional-dashas | User | Dasha systems |
| GET | /charts/{id}/shadbala, /solar-return, /event-windows | User | Strength; annual chart; event windows |
| GET | /charts/{id}/life-areas, /life-events, /propensities | User | Life areas and events |
| GET | /charts/{id}/predictions/marriage, /career, /wealth, /health | User | Predictions |
| GET / POST | /charts/{id}/life-event-log | User | Life-event log |
| GET | /charts/{id}/share-card, /annual-wrapped | User | Share card; Wrapped |
| GET | /charts/{id}/gemstone-advice, /remedy-plan | User | Remedies |
| GET | /content/nakshatra/{n} | User | Nakshatra content |

## A.4 Daily guidance, panchangam and transits

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | /charts/{id}/daily-guidance, /charts/{id}/week-ahead | User | Daily and weekly guidance |
| GET | /daily-guidance/week-ahead, /daily-guidance/range | User | Range guidance |
| GET | /activity-timing, /activity-timing/batch | User | Activity windows |
| GET | /daily-snapshot | User | Lightweight summary |
| GET | /alerts/ambient | User | Ambient alerts |
| GET | /panchangam/daily, /timings, /monthly, /tamil-months | User | Panchangam |
| GET | /charts/{id}/gochar/current, /sani-cycle, /peyarchi/upcoming | User | Transits |
| GET | /charts/{id}/dasha/timeline, /transits/peyarchi-report/{id} | User | Timeline; peyarchi report |
| GET / POST | /charts/{id}/muhurta, /muhurta | User | Muhurta |

## A.5 Family, relationships and compatibility

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET / POST | /family-vaults | User | List / create vault |
| GET | /family-vaults/{id}, /calendar, /journal | User | Vault, calendar, journal |
| GET | /relationships/alerts, /relationships/{member_id}/porutham | User | Alerts; member porutham |
| POST | /relationships/compare, /compare/pdf, /compatibility-intelligence/direct/pdf | User | Comparisons and PDFs |
| POST / GET | /porutham-shares, /porutham-shares/{token} | User / Public | Create / view share |

## A.6 Numerology

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | /charts/{id}/numerology/alignment, /name-correction | User | Alignment; name correction |
| GET / POST / DELETE | /charts/{id}/numerology/name-sessions[/{session_id}] | User | Saved sessions |
| GET | /charts/{id}/numerology/favourable-numbers, /personal-cycle, /lucky-dates, /marriage-dates, /baby-names | User | Numerology outputs |
| POST | /numerology/compatibility | User | Couple numerology |

## A.7 Ask Vinaadi, engagement and notifications

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | /charts/{id}/ask | User | Ask a question |
| GET | /ask-vinaadi/daily-status | User | Usage meter |
| GET / POST / PATCH / DELETE | /journal[/{id}] | User | Journal |
| GET / POST | /journal/prompts, /journal/export, /journal/retention/apply, /journal/{chart_id}/correlations | User | Journal features |
| GET / POST / DELETE | /goals[/{id}] | User | Goals |
| GET / POST | /streak, /streak/ping | User | Streak |
| GET / POST | /retrospective | User | Retrospective |
| POST | /decisions/brief, /whatif, /prasna | User | Decision tools |
| GET / POST | /notifications, /notifications/{id}/read, /notifications/read-all | User | Inbox |
| GET / POST | /feedback | User | Feedback |
| POST | /newsletter | Public | Newsletter sign-up |

## A.8 Public tools (`/public`)

| Method | Path | Purpose |
|---|---|---|
| POST | /public/chart-preview, /public/chart | Jadhagam generator |
| POST | /public/porutham, /porutham/by-star, /porutham/by-star/grid | Porutham |
| POST | /public/compare, /compare/pdf, /friendship-compatibility | Comparisons |
| POST | /public/muhurta, /muhurta/personalized | Muhurta |
| GET | /public/panchangam, /panchangam/monthly, /panchangam-share-card | Panchangam |
| GET | /public/panchangam-events[/{event}], /calendar-categories[/{category}], /muhurtham-naals | Calendar |
| GET | /public/rasi-palan, /rasi-palan/grid | Rasi palan |
| POST | /public/numerology/profile, /number, /personal-year, /baby-names, /baby-names-preview | Numerology |
| GET | /stats/public | Aggregate statistics |

## A.9 Payments, reports and operations

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | /webhooks/revenuecat | Platform (signed) | Subscription events |
| POST | /reports/purchase | User | Pay-per-use report |
| GET | /admin/stats, /users, /users/{id}, /jobs, /audit-log, /flags, /health/detail | Admin | Operations |
| PATCH / POST / DELETE | /admin/users/{id}/suspend, /jobs/{id}/trigger, /notify/broadcast, /flags/{name}, /flags/{name}/reset | Admin | Operator actions |
| GET | /admin/analytics/daily, /features, /retention, /acquisition, /life-focus | Admin | Analytics |
| GET / DELETE | /qa/validate, /qa/regressions | Admin | Calculation QA |
| GET | /health, /health/live | Public | Health and liveness (unversioned) |

# Appendix B. Glossary

See VIN-BRD-001 Appendix A and VIN-PRD-001 Appendix B.
