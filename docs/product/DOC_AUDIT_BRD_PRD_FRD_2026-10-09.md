# Audit: BRD / PRD / FRD v1.0 against the code and the running engine

**Date:** 2026-10-09 · **Audited:** `Vinaadi_BRD_v1.0`, `Vinaadi_PRD_v1.0`, `Vinaadi_FRD_v1.0` (docs/product) · **Against:** branch `harden/production-readiness` at `90ec6a5` plus working tree.

## Verdict

The documents are **structurally sound but not yet safe to send externally**.

- About 70 factual claims were checked. Most core claims hold: the calculation convention, auth and session security, prices, the scheduled jobs, the open-beta mechanics, webhook idempotency and the security headers.
- **27 findings:** 8 P0, 14 P1 and 5 P2.
- The P0s fall into two groups. Some overstate what is built (entitlement enforcement, the purchase flow). Others give a developer wrong instructions (mobile auth paths, error codes).
- One finding (DOCA-08) is **not a document defect**. It is a product defect that running the engine surfaced: a porutham result labelled CAUTION tells families the match is "Traditionally considered a suitable match".

Status key: `[ ]` open · `[x]` fixed · `[~]` partly fixed.

## Resolution: v2.0 (same day)

`Vinaadi_{BRD,PRD,FRD}_v2.0` apply every **documentation** finding, DOCA-01…07 and DOCA-09…27. v1.0 is kept unchanged for comparison.

| Finding | Where it is resolved in v2.0 |
|---|---|
| DOCA-01 | "Enforced" column in BRD §8.2, PRD §6 and FRD §6; risk R-11; decision D-9; KI-02 |
| DOCA-02 | PRD F-PAY-03 "Stub"; FRD FR-PAY-07 "Not built"; KI-03; BRD constraint C1 |
| DOCA-03 | FRD FR-AUTH-04 and the generated Appendix A |
| DOCA-04 | FRD FR-AUTH-01 |
| DOCA-05 | FRD FR-FAM-07 (Partial) and §9.1; decision D-10; KI-06 |
| DOCA-06 | Guest Ask shown as "Not available" everywhere; OT-03 |
| DOCA-07 | FRD FR-PAY-01…06 |
| DOCA-09 / DOCA-10 | FRD Appendix A generated from the live route table: 220 operations, full paths, access derived from the actual auth dependencies |
| DOCA-11 | PRD F-ENG-03; FRD FR-ENG-04; decision D-11; KI-07 |
| DOCA-12 | FRD FR-PROF-04; OT-01 |
| DOCA-13 | FRD §8.2 (column-level list); BRD §11 |
| DOCA-14 | Web/App columns in the PRD inventory, from source evidence; NFR-P-09 and NFR-OFF-01 marked not built |
| DOCA-15 | PRD F-MUH-03; FRD FR-MUH-03 and CR-17 |
| DOCA-16 | PRD F-NOT-01/02; FRD FR-NOT-01/02; OT-02 |
| DOCA-17 | On-screen names throughout; FRD §9.2 |
| DOCA-18 | PRD F-ASK-04; FRD FR-ASK-06/07; BRD §11 |
| DOCA-19 | FRD CR-03, CR-04, CR-15, CR-19 and CR-20 |
| DOCA-20 | FRD FR-PAN-01/02 |
| DOCA-21 | FRD §4.2 (ONB), §12.2 rows for DSH, ENG and LIFE; interface-only features noted |
| DOCA-22 | FRD FR-CMP-04/05 |
| DOCA-23…27 | Placeholder and undefined ID removed; acceptance criteria name real tests or measurable bounds; route names explained (FR-READ-01); glossary and terminology normalised; performance figures marked as targets |

**Still open: DOCA-08.** It is a code defect, not a documentation one. v2.0 records it as **KI-01** and adds the acceptance test to FR-CMP-01, but the product still shows the contradictory summary until the code is fixed.

**Also found while writing v2.0:**

- **OT-04:** a Tamil-branch string in web Settings is in English.
- **OT-05:** there is no fixed refusal test set for Ask Vinaadi.
- **OT-06:** there is no historical-timezone conversion test set.

In each case v1.0 had claimed coverage that does not exist.

## Method, and what this audit cannot see

| Check | How |
|---|---|
| API catalogue (FRD Appendix A) | Generated the live OpenAPI schema from `app.main` (220 operations, 196 paths) and diffed it against every catalogue row in both directions |
| Entitlements | Read `tiers.ts`, `tier_limits.py`, `OPEN_BETA_LIMITS` and `app/core/entitlements.py`; grepped every limit for an enforcing reader |
| Behaviour claims | Read the route and service code behind each FRD acceptance criterion that can be checked by reading |
| Engine output | Ran `compute_daily_panchangam` (Chennai and Toronto, 2026-10-09) and `compute_porutham` (a synthetic star pair) and compared the output with the documents |
| Document quality | Placeholders, undefined IDs, orphan requirements in the traceability tables, ambiguous notation, untestable acceptance criteria |

**Blind spots:**

- No browser or device pass. Web and mobile claims come from source code, not from rendered screens.
- No HTTP calls against a running API with a database. Status codes come from reading the handlers.
- Reading lengths were not re-measured.
- Tamil copy was not reviewed.
- Calculations were spot-checked on one date in two cities and one porutham pair, not the golden suite.
- BRD market facts (speaker counts, geography) and the KPI targets were not audited; the KPI targets are labelled proposals.

<!-- pagebreak -->

## P0: wrong in a way an external reader would act on

### DOCA-01 `[ ]` Seven plan limits are documented as enforced; the server does not enforce them

**Problem.** BRD §8.2, PRD §6 and FRD ER-03/05/07/08, FR-DSH-01 and FR-DAY-06 present every plan limit as a server rule. PRD §6 adds: "a feature gate always reads the user's live entitlement from the server". The code enforces counts (profiles, vault members, goals, Ask quota) and five Premium booleans by route dependency: varshaphala, life-event log, rectification, synastry and retrospective. **Not enforced by the server:**

| Limit | Actual state | Evidence |
|---|---|---|
| Dasha depth (none / current / full) | No reader anywhere in `app/` | grep of `dasha_depth` finds only `tier_limits.py` |
| Rasi palan window (0 / 7 / 30 days) | No reader in `app/` or in either client | grep of `rasi_palan_window_days` / `rasiPalanWindowDays` |
| Vargas | UI lock on mobile only; data ships in `GET /charts/{id}` | `entitlements.py` `UNENFORCEABLE_FEATURES`; `mobile/app/(tabs)/insights/index.tsx:291` |
| Life-area history | No route serves it | `UNENFORCEABLE_FEATURES` |
| Remedies | **Owner decision pending**: shown to every account | `UNENFORCEABLE_FEATURES["remedies_enabled"]` |
| Wrapped share | Client action, no route | same |
| Ask top-up | No purchase path | same |

**Why it matters.** An investor or delivery team reads these documents as a description of the paywall. The code's own docstring warns that ending the beta "would have given premium away". These seven are exactly where that is still true.

**Fix.** Add an "Enforced by" column (Server / Client only / Not enforced) to BRD §8.2, PRD §6 and FRD §6. Rewrite the PRD §6 rule as a requirement with this known gap beside it. Add BRD decision **D-9: are remedies Premium?** Add risk **R-11: unenforced limits at paid launch**.

**Acceptance.** Every limit row names its enforcer. No document claims server enforcement for a limit that `UNENFORCEABLE_FEATURES` lists or that has no reader.

### DOCA-02 `[ ]` The pay-per-use purchase endpoint is a stub, documented as built

**Problem.** PRD F-PAY-03 says "Partial: purchase endpoint built". FRD FR-PAY-03 specifies granting an entitlement on confirmed payment. In fact `POST /reports/purchase` ([app/api/reports.py](../../app/api/reports.py)) validates the product ID and returns `status: "queued"` with a random UUID. It **persists nothing and grants nothing**, and its docstring says so ("Payment processing is not yet live").

**Fix.** Set the status to **Stub (validation only)** in the PRD. Mark FR-PAY-03 as *not built* in the FRD. Add "pay-per-use fulfilment" to BRD constraint C1.

**Acceptance.** No document describes report purchase as functional.

### DOCA-03 `[ ]` Mobile authentication paths are wrong

**Problem.** FRD FR-AUTH-04 and Appendix A.1 give `/auth/refresh`, and describe `/auth/login` as issuing "web cookie or mobile tokens". The real mobile routes are `/auth/mobile/login`, `/auth/mobile/register`, `/auth/mobile/refresh` and `/auth/mobile/logout`. `/auth/login` is cookie-only.

**Fix.** Correct FR-AUTH-04 and A.1. Add the four mobile routes.

**Acceptance.** Every auth path in the FRD appears in the OpenAPI schema.

### DOCA-04 `[ ]` Registration does not reject a duplicate email

**Problem.** FRD FR-AUTH-01's acceptance criterion says "a duplicate email is rejected". This error was introduced during authoring. The handler ([app/api/auth.py:270-277](../../app/api/auth.py#L270-L277)) returns the **same neutral response** for new and existing emails. It does matching bcrypt work to remove a timing difference, and emails the existing owner out-of-band. This is deliberate anti-enumeration.

**Fix.** "A duplicate email receives the same response as a new one, with equal timing; the existing account owner is notified by email."

**Acceptance.** FR-AUTH-01 matches the handler.

### DOCA-05 `[ ]` "Not yours" returns 403, not 404

**Problem.** FR-FAM-06 ("returns 404 (no existence leak)") and FRD §9.1 ("404 … including 'not yours'") are false. A missing vault returns 404; another user's vault returns **403** ([app/api/family_vaults.py:50-55](../../app/api/family_vaults.py#L50-L55)). Ask Vinaadi likewise returns 403 for a chart the caller doesn't own. So the difference between the two codes *does* reveal that a resource exists.

**Fix.** Either correct the documents to 403, or make "existence hiding" a product requirement and change the code (an owner decision, D-10). Do not leave a security property in the FRD that the code does not have.

**Acceptance.** The FRD error table matches the handlers, or a ticket exists for the code change.

### DOCA-06 `[ ]` "Guest: Ask Vinaadi 2 per day" is unreachable

**Problem.** BRD §8.2, PRD §6 and FRD ER-06 list 2 questions a day for guests. Both Ask routes depend on `get_current_user`, so a guest cannot ask at all. The value 2 is a dead configuration entry.

**Fix.** Show "Not available (sign-in required)" for guests. Note the dead value for cleanup in `tiers.ts` and `tier_limits.py`.

**Acceptance.** No document offers guests a capability the API refuses.

### DOCA-07 `[ ]` Webhook authentication is a shared bearer secret, not a signature; the strengths are undocumented

**Problem.** FR-PAY-01 says "Signatures are verified". RevenueCat sends a shared-secret bearer token, which the code compares in constant time. The endpoint returns 503 when the secret is not configured.

The FRD also omits the properties that matter most to a payments reviewer, all present in [app/api/webhooks.py](../../app/api/webhooks.py):

- events are deduplicated on a unique `(provider, event_id)`;
- out-of-order (stale) events are recorded and ignored;
- `CANCELLATION` and `BILLING_ISSUE` keep access until the paid period ends;
- unresolved events are kept for reconciliation.

It also omits the stated gap: **no reconciliation against RevenueCat's current state**.

**Fix.** Rewrite FR-PAY-01 and add FR-PAY-06 (stale-event ordering) and FR-PAY-07 (period-end access). Record the reconciliation gap as a known limitation.

**Acceptance.** Each webhook rule in the module docstring has a matching FR.

### DOCA-08 `[ ]` PRODUCT DEFECT: a CAUTION porutham result says "a suitable match"

**Problem (found by running the engine).** In `compute_porutham` ([app/calculations/porutham.py:939-1016](../../app/calculations/porutham.py#L939-L1016)), the summary sentence is chosen from the score band first. The label is forced to CAUTION afterwards when Rajju or Vedha fails. For a synthetic pair (stars 4 and 13) the output is:

> label `CAUTION`, 7/10 — "Good compatibility with minor differences. **Traditionally considered a suitable match.** ⚠ Rajju Porutham not met: … one of the strongest objections in Tamil matching…"

The Tamil summary has the same contradiction. It is returned by the public calculator (`app/api/public_tools.py:377`, anonymous users) and rendered in the dashboard tool (`web/components/dashboard-tools-porutham-nova.tsx:544`).

**Why it matters.** This verdict is the one marriage-seeking families act on (Persona C), and the product's principle is that an explanation must match its own numbers.

**Fix (code, not documents).** Apply the Rajju/Vedha veto *before* choosing the summary, or choose a "strong score, but a critical factor failed" sentence when a veto overrides a GOOD or EXCELLENT band. The Tamil twin needs a native-reader review. The FRD should add an acceptance criterion to FR-CMP-01.

**Acceptance.** A test sweeps all 27 × 27 star pairs. No result labelled CAUTION contains "suitable match" or "highly auspicious", in either language.

<!-- pagebreak -->

## P1: material inaccuracies or gaps

### DOCA-09 `[ ]` The endpoint catalogue misses 43 of 196 paths, including core features

**Missing:**

- **Readings:** `/charts/{id}/one-minute`, `/five-minute`
- **PDF:** `/charts/{id}/export/pdf`
- **Family-member CRUD:** `/family-vaults/{id}/members[/{member_id}]`
- **Family views:** `/family-vaults/{id}/today`, `/summary`, `/composite`, `/daily-aggregate`, `/harmony-remedies`, `/journal/summary`
- **Annual chart:** `/charts/{id}/varshaphala`
- **Synastry and compatibility intelligence:** six routes
- **Sharing:** `/porutham-shares/{token}/revoke`
- **Admin:** `/admin/elevate`, `DELETE /admin/users/{id}/data`, `/admin/calibration`
- **Other:** `/health/ready`, `/charts/{id}/dashboard-bundle`, `/birth-profiles/{id}/confirm-location`, `PATCH /feedback/{id}/reward`, `/charts/{id}/muhurtham-naals`, and the `/public/calendar-categories` and `/public/muhurtham-naals` forms

**Fix.** Generate Appendix A from the OpenAPI schema with a script instead of writing it by hand. Keep the hand-written "Purpose" column as a lookup keyed on path.

**Acceptance.** A re-run of the diff (method above) reports zero paths in either direction.

### DOCA-10 `[ ]` The path shorthand is ambiguous

**Problem.** In "/charts/{id}/gochar/current, /sani-cycle, /peyarchi/upcoming", the obvious reading is `/charts/{id}/gochar/sani-cycle`. The real path is `/charts/{id}/sani-cycle`. Some rows use the shorthand for siblings and others for children, and the admin row mixes verbs across paths.

**Fix.** One full path per row, one method set per row.

### DOCA-11 `[ ]` The streak day is India time for everyone

**Problem.** FR-ENG-04 says "once per local day". `streak_service` uses `Asia/Kolkata` for all users, which is documented in the service as "the app-wide convention". For the Toronto persona, the streak day rolls over at 14:30 local time.

**Fix.** Correct the documents. Raise a product question: should streaks follow the user's effective timezone, as the morning push already does?

### DOCA-12 `[ ]` Birth-time confidence is free text, not a three-value enum

**Problem.** FR-PROF-04 lists `known` / `approximate` / `unknown`. The field is `birth_time_source: str`, default `"unknown"`, and is not validated. The values the code uses include `BIRTH_CERTIFICATE`, `HOSPITAL_RECORD`, `FAMILY_RECORD`, `approximate`, `unknown` and `ESTIMATED_RECTIFIED`. There is also a numeric `birth_time_confidence_minutes`. Reading trust uses an exact-match set (`_RELIABLE_TIME_SOURCES`), so a client typo silently lowers lagna trust.

**Fix.** Document the real values. Recommend a validated enum in the schema (code change).

### DOCA-13 `[ ]` The encryption scope is understated and incomplete

**Problem.** FRD §8.2 lists only the birth fields. Also encrypted: current place, coordinates and timezone; family members' dates of birth; chart Julian day and lagna longitude; planet longitudes, degree, speed and raw payload; **journal note text**. The documents do not say that **names** are stored in plain text.

**Fix.** Replace §8.2 with the column-level list. Align BRD §11 wording, and keep the stated residual for rasi, nakshatra and pada.

### DOCA-14 `[ ]` Platform differences are invisible

**Problem.** The PRD gives one status per feature. In fact:

- Google sign-in is **web only**; mobile has none.
- Ads are **mobile only**, on one screen (muhurta).
- The mobile app has **no offline data cache**, only an offline indicator (`useOfflineStatus`), so **NFR-P-09 is not met**.
- The full reading's Story and Astrologer views are web; the mobile reading is text-first.
- The admin console is web only.

**Fix.** Add Web and Mobile columns to the PRD inventory. Set NFR-P-09 to "Not built".

### DOCA-15 `[ ]` Couple-mode muhurta is marriage only

**Problem.** PRD F-MUH-03 says "for joint events". By ruling (2026-09-15) only `MARRIAGE` is elected on two charts; every other activity uses the chart of the person it is for.

**Fix.** Correct F-MUH-03 and FR-MUH-03 and cite the ruling.

### DOCA-16 `[ ]` Notification behaviour is misdescribed

**Problem.** The documents say "one morning push per day". There is also a `DASHA_TRANSITION` push. The alert time is user-configurable, defaulting to 06:00. The timezone is the *effective* location (current if set, otherwise birth). The docstring in `notification_service.build_morning_notification` still says "birth city timezone"; that is stale, and the code does not do it.

**Fix.** Rewrite FR-NOT-01, BRD §8.5 and PRD F-NOT-01. Code hygiene: correct the docstring.

### DOCA-17 `[ ]` UI names don't match the product

**Problem.** The documents say "Plan" and "Explore"; the dashboard shows **Goals** and **Understand**. "Family and Charts" is **Family & Charts** in the UI. PRD J6 says "Settings → Privacy → Delete my account"; deletion is in the **Danger Zone** section.

**Fix.** Use the on-screen labels. Keep internal IDs (`plan`, `explore`) only in the FRD, marked as IDs.

### DOCA-18 `[ ]` Ask Vinaadi's age and life-stage rules are undocumented

**Problem.** The handler redirects some topics instead of answering them, without using up quota:

- **under 18:** love and marriage, career, and wellbeing or health topics;
- **under 6:** study topics as well;
- **married users:** marriage-timing questions;
- **50 and over:** love and marriage topics.

For legal and investor readers this is the product's child-safety behaviour, and BRD §11 says the children's policy is "pending".

**Fix.** Add FR-ASK-06 (life-stage redirects) and FR-ASK-07 (redirects do not use quota). Reference both from BRD §11.

### DOCA-19 `[ ]` Calculation rules are imprecise or missing

**Problem.**

- **CR-03** should state the **mean node**, as in the code.
- **CR-04** should note that a geometric disc-centre convention exists in code as a non-default alternative.
- The porutham engine also computes **Nadi dosha**, with cancellations, a parihara mode (`strict` by default) and a Rajju guard. No document mentions it, and the glossary lacks "Nadi".
- The porutham band ladder is deliberately separate from the composite compatibility ladder (ruling 2026-08-31).

**Fix.** Amend CR-03, CR-04 and CR-15. Add CR-19 (Nadi) and CR-20 (two ladders).

### DOCA-20 `[ ]` Panchangam output is underspecified

**Problem.** The engine returns far more than FR-PAN-01/02 list: hora, durmuhurtham, abhijit (with a restricted flag), subha-muhurtham flags, soolam and its parigaram, nethiram and jeevan, amirdhadhi yogam, chandrashtamam by star, the daylight lagna schedule, limb spans, and dominant elements for the civil day.

**Fix.** List the output groups in FR-PAN-01/02, so an external team knows what the panchangam contract carries.

### DOCA-21 `[ ]` Traceability has orphans

**Problem.**

- FRD §12.2 traces no requirement in **FR-DSH**, **FR-ENG** or **FR-LIFE**.
- Onboarding (PRD F-ACC-03) has **no FR** at all.
- UI-only features (F-DAY-09 quick links, F-FAM-03 member switcher) have no FR and aren't marked as UI-only.

**Fix.** Add the rows (FR-DSH → BR-01/BR-04; FR-LIFE → BR-08; FR-ENG → BR-04/BR-15). Add FR-ONB-01…n. Tag UI-only features.

**Acceptance.** Every FR module appears in §12.2, and every PRD feature maps to an FR or carries "UI only".

### DOCA-22 `[ ]` Porutham share expiry and revocation are undocumented

**Problem.** Shares have `expiresAt` and a `revoke` route. The public view carries no birth data, only stars, scores and optional labels, which is verified and correct. None of this is in FR-CMP-04.

**Fix.** Extend FR-CMP-04 and add FR-CMP-06 (revoke).

<!-- pagebreak -->

## P2: editorial quality

### DOCA-23 `[ ]` A placeholder and an undefined reference

PRD F-ENG-02 says "Up to **N** active goals"; it should be "3 on a free account, unlimited on Premium". FRD FR-PROF-06 cites "**CR-DATA**", which is defined nowhere; it should cite §8.2.

### DOCA-24 `[ ]` Weak acceptance criteria

These criteria can't fail, or can't be run as written:

- FR-ENG-06: "within the performance budget"
- FR-LIFE-05, FR-CMP-05, FR-NUM-05: "respond for any valid input"
- FR-ADM-04: "figures reconcile"
- FR-ASK-04: "a red-team test set", which is undefined
- FR-CHART-04: "reference values", with no named source

**Fix.** Name the test, fixture or golden file, or state a measurable bound.

### DOCA-25 `[ ]` Route names versus displayed names

The readings advertised as "two minutes" and "four minutes" are served by `/one-minute` and `/five-minute`. This is deliberate: the display was renamed and the routes kept, to avoid breaking clients. An external developer will be confused unless FR-READ-01 says so.

### DOCA-26 `[ ]` Terminology consistency

- "Family and Charts" / "Family & Charts"
- "Premium" / "premium"
- "rasi palan" / "Rasi Palan"
- "Thirukanitham / Drik Ganita" is sometimes shortened

Add a style line to each document's conventions and normalise the text. Add Nadi, Hora, Durmuhurtham and Abhijit to the glossary.

### DOCA-27 `[ ]` Performance and availability numbers have no baseline

NFR-P-01, NFR-P-07 and NFR-PERF-01 state p75/p95 and availability figures that have never been measured. Label them "target, baseline not yet measured" so a partner does not read them as achieved service levels.

## Verified correct (no change needed)

| Area | Claim | Evidence |
|---|---|---|
| Consent | Required at sign-up; timestamp and policy version stored | `schemas/auth.py` `ConsentGiven`; `auth.py:288-289` |
| Web session | HttpOnly cookie, 24 h | `auth.py:56,95,98` |
| CSRF | `X-Vinaadi-CSRF` on mutating cookie requests → 403; bearer exempt | `core/auth.py:416-434` |
| Passwords | bcrypt | `mobile_auth.py:116-120` |
| Refresh tokens | 60 days, rotation, reuse treated as theft (all revoked) | `mobile_auth.py:8-9,41,220` |
| Password reset | Neutral response; single-use; expiring | `auth.py:64,502-515` |
| Suspension | Blocks web and mobile sign-in | `auth.py:76-80`; `mobile_auth.py:175` |
| Ayanamsa | Lahiri set explicitly | `calculations/ephemeris.py:197` |
| Sunrise | Apparent upper limb with refraction is the default | `ephemeris.py:32-36,420-472` |
| City-specific timings | Chennai sunrise 05:58 IST, Toronto 07:24 EDT on 2026-10-09 | engine run |
| Rahu kalam | Friday falls in the 4th of 8 daylight parts (10:26–11:56, Chennai) | engine run |
| Panchangam cache | Keyed by ayanamsa; daily pre-warm | `panchangam_cache.py:151-162`; scheduler |
| Prices and products | ₹149 / ₹999, 7-day trial; pay-per-use catalogue and top-up ₹49 | `tiers.ts` |
| Open beta | Premium limits, Ask capped at the registered daily 7, top-up off | `tier_limits.py` `OPEN_BETA_LIMITS` |
| Scheduled jobs | The six jobs, their times and the destructive flags match FRD §11 exactly | `app/scheduler.py:43-97` |
| Security headers | HSTS, CSP, X-Frame-Options, Referrer-Policy | `app/middleware.py` |
| File-backed secrets | `JOTHIDAM_<FIELD>_FILE` supported | `core/config.py:254` |
| API docs | `/docs` disabled in production | `main.py` |
| Ask Vinaadi failure | Quota reserved before the call and refunded on failure; 503 when not configured | `api/ask_vinaadi.py:281-292`; `ask_vinaadi_service.py:330-378` |
| Morning push | Deduplicated per local day; effective location's timezone | `daily_push_cron.py:234-255` |
| Tamil URLs | `/ta/…` twins via middleware | `web/middleware.ts` (`ta-routes`) |
| Life-focus options | Study, Career, Love, Marriage, Family, Wealth, Health, Spirituality, Remedies | `core/life_mode.py` |
| Helpfulness KPI | Feedback has a `rating` field | `models/feedback.py` |
| Share privacy | The public porutham view carries no birth data | `schemas/porutham_shares.py:69-90` |
| Data model | All 41 tables named in FRD §8.1 exist | `app/models` |

## Recommended order

1. **DOCA-08** (code fix, plus a Tamil review of the replacement sentence). It is user-facing now.
2. **DOCA-01…07** in the documents, then re-issue them as v1.1 before any external send.
3. **DOCA-09/10** by script, so the catalogue cannot drift again.
4. The remaining P1s, then the P2s.
5. Owner decisions surfaced by this audit: **D-9** (remedies Premium?), **D-10** (hide resource existence: 403 → 404?), the streak timezone (DOCA-11), and validating the birth-time source (DOCA-12).
