# Jothidam.AI MVP Sprint Execution Plan v1

**Version:** v1.0  
**Date:** May 21, 2026  
**Method Standard:** Thirukanitham / Drik Ganita calculations with Lahiri ayanamsa; Tamil Jyothidam interpretation layer  
**MVP Change Confirmed:** Family Aggregate Fortune is included in MVP 1.

---

## 1. Purpose of this document

This document converts the v7 master specification and the technical API/database blueprint into an execution plan that a product, backend, frontend, QA, and domain-review team can follow.

The first launch must prove one thing before anything else: **the calculation engine is reliable.** UI polish, reports, monetization, and mobile apps are important, but they must come after the astrology backend produces consistent, auditable results.

---

## 2. MVP 1 scope

### 2.1 Included in MVP 1

1. User registration and birth profile creation.
2. Birth location, latitude, longitude, timezone, and UTC conversion handling.
3. D1 Rasi chart generation in South Indian whole-sign format.
4. D9 Navamsa generation using corrected 108-pada logic.
5. Moon Rasi, Nakshatra, Pada, Janma Nakshatra, and Dasha balance.
6. Tamil Panchangam daily engine: Tithi, Vara, Nakshatra, Yoga, Karana.
7. Rahu Kalam, Yamagandam, Kuligai, Abhijit, and Hora.
8. Vimshottari Mahadasha, Antardasha, and Pratyantardasha timeline.
9. Current Gochar from Moon and Lagna.
10. Sani-cycle detection: Ezharai, Janma Sani, Ardhashtama, Ashtama, Kantaka, Kandaka.
11. Guru, Sani, Rahu/Ketu Peyarchi basic personalized interpretation.
12. Daily 0-100 guidance score.
13. Family vault for up to 6 members in MVP.
14. Family Aggregate Fortune: family day score, support need index, decision readiness index, and family calendar.
15. Tamil and English interpretation template output.
16. Internal QA dashboard with expected-vs-actual validation.

### 2.2 Deferred beyond MVP 1

1. Full marriage Porutham engine.
2. Full Muhurtham finder for all event types.
3. Full classical Shadbala.
4. Full Ashtakavarga production scoring if not completed during MVP QA.
5. Health tendency monitor beyond soft preventive messages.
6. Expert astrologer marketplace.
7. Native mobile app; launch as responsive web/PWA first.
8. Advanced report PDFs for every module.

---

## 3. Team structure

| Role | Minimum allocation | Responsibility |
|---|---:|---|
| Product owner | 0.5-1.0 FTE | Prioritization, scope discipline, acceptance decisions |
| Backend engineer | 1.0 FTE | Calculation engine, APIs, database, QA endpoints |
| Frontend engineer | 1.0 FTE | Web/PWA, dashboards, forms, family views |
| Tamil astrology domain reviewer | Part-time, weekly | Calculation review, interpretation review, tradition conflicts |
| QA engineer | 0.5-1.0 FTE | Golden tests, regression tests, API validation |
| UI/UX designer | Part-time early, then as needed | Onboarding, dashboard, family UX, reports |
| DevOps/support | Part-time | Deployment, environment, logs, backups |

---

## 4. Engineering principles

### 4.1 Calculation-first build rule

Every astrology output must be traceable to:

1. input data,
2. astronomical calculation,
3. derived astrological state,
4. scoring rule,
5. interpretation template.

No prediction text should be generated without a calculable state behind it.

### 4.2 No silent inference rule

If a birth time, location, ayanamsa, chart source, or D9 source is uncertain, the system must mark it explicitly. The system must not silently treat approximate birth data as precise.

### 4.3 Whole-sign primary rule

For MVP, D1 houses are whole-sign from Lagna. Bhava/cusp/KP layers are deferred unless separately enabled as an advanced mode. This avoids mixing South Indian fixed-rasi chart practice with Placidus-derived house ownership.

### 4.4 Interpretation safety rule

Use phrases like “traditionally associated with,” “this period is interpreted as,” and “a useful practical focus is.” Avoid claiming scientific proof, guaranteed events, doom language, or medical/legal/financial certainty.

---

## 5. Sprint plan overview

| Sprint | Focus | Main output |
|---|---|---|
| Sprint 0 | Foundation setup | Repo, local env, Swiss Ephemeris proof-of-concept, CI |
| Sprint 1 | Birth profile + D1 chart | Birth profile API, UTC/JD, D1 chart calculation |
| Sprint 2 | D9 + Nakshatra validation | D9/Navamsa, Nakshatra/Pada, Vargottama checks |
| Sprint 3 | Panchangam engine | Daily Panchangam API and timing windows |
| Sprint 4 | Vimshottari Dasha | Dasha timeline API and current period lookup |
| Sprint 5 | Gochar + Sani/Guru/Rahu-Ketu | Transit API, Sani cycle detection, Peyarchi basics |
| Sprint 6 | Daily guidance score | 0-100 score, daily card API, interpretation templates |
| Sprint 7 | Family vault + aggregate fortune | Family profiles, family score, calendar aggregation |
| Sprint 8 | Frontend MVP integration | Onboarding, dashboards, family pages, language output |
| Sprint 9 | QA dashboard + golden validation | Internal QA tool, golden tests, regression suite |
| Sprint 10 | Beta hardening | Security, performance, logging, deployment, beta release |

Recommended duration: 2 weeks per sprint. If the team is small, treat each sprint as a milestone rather than a strict 2-week cycle.

---

## 6. Sprint 0 — Foundation setup

### Goal

Create a stable development foundation before feature development begins.

### Backend tasks

- Create monorepo or two-repo structure: `backend/` and `web/`.
- Set up Python FastAPI backend.
- Add `pyswisseph` or Swiss Ephemeris wrapper proof-of-concept.
- Add PostgreSQL and Redis local Docker Compose.
- Add environment management via `.env`.
- Add linting, formatting, and unit test command.
- Create basic health endpoint: `GET /health`.

### DevOps tasks

- Create staging and local environments.
- Add CI workflow for tests.
- Set up secret management pattern.
- Confirm Swiss Ephemeris licensing path before commercial launch.

### Acceptance criteria

- Developer can run backend locally with one command.
- `GET /health` returns status OK.
- Swiss Ephemeris can compute Sun/Moon longitude for a test date.
- PostgreSQL and Redis are available locally.
- CI runs tests on every push.

---

## 7. Sprint 1 — Birth profile + D1 chart engine

### Goal

Generate a reliable D1 Rasi chart from birth details.

### Backend tasks

- Implement birth profile model and API.
- Store local birth datetime and timezone.
- Convert local birth time to UTC.
- Compute Julian Day.
- Apply Lahiri ayanamsa.
- Compute 9 graha longitudes: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu mean node, Ketu.
- Compute Lagna using latitude and longitude.
- Convert all longitudes into Rasi, degree in Rasi, Nakshatra, and Pada.
- Assign whole-sign house numbers from Lagna.
- Persist chart calculation version.

### API endpoints

- `POST /v1/birth-profiles`
- `GET /v1/birth-profiles/{profileId}`
- `POST /v1/charts/d1/calculate`
- `GET /v1/charts/{chartId}`

### Acceptance criteria

- Given birth date, time, and place, the API returns D1 chart with all 9 grahas.
- UTC conversion is visible in the response metadata.
- Lagna, Moon Rasi, Moon Nakshatra, and Pada are included.
- Whole-sign house number is assigned for every planet.
- Output includes calculation version and ephemeris provider.

---

## 8. Sprint 2 — D9/Navamsa + Nakshatra validation

### Goal

Complete D9 and prevent the most common Navamsa/Vargottama errors.

### Backend tasks

- Implement corrected Navamsa formula.
- Implement explicit 108-pada lookup table as a test oracle.
- Generate D9 positions for Lagna and all grahas.
- Implement Vargottama detection: D1 Rasi equals D9 Rasi.
- Add data reconciliation flags if supplied D9 conflicts with derived D9.
- Add golden tests for Uthiradam 3rd Pada, Moolam 1st Pada, Rohini 4th Pada, Hastham 2nd Pada.

### Acceptance criteria

- Uthiradam 3rd Pada maps to Kumbam Navamsa.
- Moolam 1st Pada maps to Mesham Navamsa.
- D9 does not use the incorrect fixed “movable=Mesha, fixed=Makara, dual=Thula” shortcut.
- Vargottama is declared only when D1 and D9 signs match.

---

## 9. Sprint 3 — Panchangam engine

### Goal

Provide city-specific daily Panchangam and timing windows.

### Backend tasks

- Compute city-specific sunrise and sunset.
- Compute Tithi from Moon-Sun angular difference.
- Compute Vara from local civil date.
- Compute daily Nakshatra and Pada from Moon longitude.
- Compute Yoga from Sun+Moon longitude.
- Compute Karana from half-Tithi.
- Compute Rahu Kalam, Yamagandam, and Kuligai using correct weekday slots.
- Compute Abhijit centered on solar noon.
- Compute daytime and nighttime Hora.
- Cache daily Panchangam per city/date.

### API endpoints

- `GET /v1/panchangam/daily?date=&lat=&lng=&timezone=`
- `GET /v1/panchangam/timings?date=&lat=&lng=&timezone=`

### Acceptance criteria

- May 20, 2025 is treated as Tuesday, not Wednesday.
- Tuesday Rahu Kalam uses slot 7.
- Timings are based on actual sunrise/sunset, not fixed Tamil Nadu averages.
- Response includes all five Panchangam limbs and timing windows.

---

## 10. Sprint 4 — Vimshottari Dasha engine

### Goal

Create a full Dasha timeline and current-period lookup.

### Backend tasks

- Determine opening Mahadasha from Moon Nakshatra lord.
- Compute Dasha balance from Moon’s progress inside Nakshatra.
- Generate 120-year Mahadasha sequence.
- Generate Antardasha and Pratyantardasha periods.
- Store Julian Day boundaries and display dates.
- Add current Dasha lookup by date.

### API endpoints

- `POST /v1/dasha/calculate`
- `GET /v1/dasha/current?profileId=&date=`
- `GET /v1/dasha/timeline?profileId=`

### Acceptance criteria

- Dasha balance matches formula based on Moon’s exact Nakshatra progress.
- Antardasha durations sum exactly to the Mahadasha duration.
- Current Maha, Antar, and Pratyantar are returned for any query date.

---

## 11. Sprint 5 — Gochar + Sani/Guru/Rahu-Ketu transit

### Goal

Create the transit layer used by daily guidance and family aggregation.

### Backend tasks

- Compute current transit Rasi for all grahas.
- Count each transit from natal Moon and Lagna.
- Implement Sani-cycle formula from Moon.
- Implement Kandaka Sani from Lagna as a separate layer.
- Implement Guru transit interpretation by house from Moon.
- Implement Rahu/Ketu axis from Moon and Lagna.
- Implement Chandrashtama detection.
- Implement retrograde, combustion, sandhi, and Gandanta flags.

### API endpoints

- `GET /v1/gochar/current?profileId=&date=`
- `GET /v1/sani-cycle/current?profileId=&date=`
- `GET /v1/transits/major?profileId=&date=`

### Acceptance criteria

- Saturn in Meenam for Dhanusu Moon is Ardhashtama Sani, not Janma Sani.
- Sani cycles are never named without explicit house-from-Moon calculation.
- Gochar response includes house from Moon and house from Lagna for every graha.

---

## 12. Sprint 6 — Daily guidance score

### Goal

Produce a practical daily companion card for each user.

### Backend tasks

- Implement 0-100 day score formula.
- Include Moon/Nakshatra day quality.
- Include Panchangam quality.
- Include active Dasha quality.
- Include Gochar stress/support.
- Include Sani-cycle adjustment.
- Include Chandrashtama adjustment.
- Output a short Tamil and English guidance sentence.
- Output action suggestion and caution suggestion.

### API endpoints

- `GET /v1/daily-guidance?profileId=&date=`
- `GET /v1/daily-guidance/range?profileId=&from=&to=`

### Acceptance criteria

- Every score shows breakdown by component.
- No negative score is presented without a constructive action.
- No fatalistic or fear-based language appears.
- Health language remains preventive and non-diagnostic.

---

## 13. Sprint 7 — Family vault + Family Aggregate Fortune

### Goal

Deliver the family companion feature in MVP 1.

### Backend tasks

- Create family vault model.
- Add family members with birth profiles.
- Generate each member’s daily guidance score.
- Compute Family Day Score.
- Compute Support Need Index.
- Compute Decision Readiness Index.
- Compute member-level tags: strong day, normal day, support day, avoid-new-start day.
- Generate family calendar response.
- Add family-level interpretation template.

### Family scoring formula

```text
member_day_score = personal daily 0-100 score
family_day_score = weighted_average(member_day_score, member_weight)
support_need_index = count(member_score < 45) / total_members * 100
decision_readiness_index = average(scores of decision-relevant members) adjusted by severe caution flags
```

### Member weight guidance

| Member type | Default weight |
|---|---:|
| Family decision owner | 1.25 |
| Adult family member | 1.00 |
| Child | 0.75 |
| Elder needing care | 1.15 |
| Temporary guest/prospective partner | 0.50 |

### API endpoints

- `POST /v1/families`
- `POST /v1/families/{familyId}/members`
- `GET /v1/families/{familyId}/daily-aggregate?date=`
- `GET /v1/families/{familyId}/calendar?from=&to=`

### Acceptance criteria

- Family dashboard identifies who needs support today.
- Family decision score is not just a simple average; severe caution flags are visible.
- Family guidance remains supportive and non-alarming.
- Parent-managed child profiles are permissioned separately.

---

## 14. Sprint 8 — Frontend MVP integration

### Goal

Create a usable web/PWA MVP that demonstrates the companion experience.

### Screens

1. Landing / sign-in.
2. Birth profile onboarding.
3. Personal dashboard.
4. Daily guide card.
5. Panchangam card.
6. D1/D9 chart view.
7. Dasha timeline view.
8. Transit/Sani alert view.
9. Family vault.
10. Family aggregate fortune calendar.
11. Settings: language, notification preferences, privacy.

### Acceptance criteria

- User can create profile and see chart output.
- User can add family members.
- Family dashboard shows today and next 7 days.
- Tamil/English toggle works for MVP text.
- Empty states and uncertain birth-time states are handled clearly.

---

## 15. Sprint 9 — QA dashboard + golden validation

### Goal

Create internal confidence before beta release.

### QA dashboard requirements

- Input birth details.
- Input expected values.
- Run calculation.
- Display expected vs actual.
- Show degree differences.
- Show pass/fail by module.
- Save failed cases as regression tests.

### Golden test categories

1. UTC conversion test.
2. Rasi boundary test.
3. Nakshatra boundary test.
4. D9/Navamsa test.
5. Vargottama test.
6. Dasha balance test.
7. Panchangam weekday/timing test.
8. Sani-cycle identification test.
9. Chandrashtama test.
10. Family aggregation test.

### Acceptance criteria

- No MVP calculation module ships without at least 5 golden tests.
- All known prior errors are locked as regression tests.
- Failed cases are stored and visible to developers.

---

## 16. Sprint 10 — Beta hardening and launch readiness

### Goal

Prepare the MVP for a limited private beta.

### Tasks

- Security review of birth data and family data.
- Database backups and restore testing.
- Error logging and observability.
- Rate limiting for APIs.
- Basic admin dashboard.
- Privacy policy and terms draft.
- Disclaimers for astrology, medical, legal, and financial content.
- Beta onboarding flow.
- Feedback collection mechanism.

### Acceptance criteria

- Beta users can onboard without developer help.
- Calculation errors are logged with input metadata.
- Users can delete account and family data.
- Privacy and interpretation disclaimers are visible.

---

## 17. MVP release gate checklist

Before private beta, confirm:

- [ ] D1 chart tests pass.
- [ ] D9/Navamsa tests pass.
- [ ] Panchangam tests pass.
- [ ] Dasha tests pass.
- [ ] Gochar tests pass.
- [ ] Sani-cycle tests pass.
- [ ] Daily score tests pass.
- [ ] Family aggregate tests pass.
- [ ] Tamil text reviewed by native/domain reviewer.
- [ ] No “scientifically proven astrology” claim appears.
- [ ] No doom/fear language appears in notifications.
- [ ] Birth data encryption path is implemented.
- [ ] Data deletion is implemented.
- [ ] Swiss Ephemeris licensing path is resolved before public launch.

---

## 18. Backend starter pack usage

The accompanying backend starter pack provides:

- FastAPI project skeleton.
- Core calculation helper modules.
- Rasi, Nakshatra, Navamsa, Sani-cycle, Panchangam slot, and family aggregation formula functions.
- Route placeholders matching the technical API blueprint.
- Unit tests for the historical correction cases.
- QA runner skeleton.

The starter pack is not the complete production backend. It is the starting structure for developers to implement and validate the calculation engine sprint by sprint.

---

## 19. First 7 days action plan

### Day 1

- Confirm stack: Python FastAPI, PostgreSQL, Redis, Next.js PWA.
- Create Git repository and branch strategy.
- Assign module owners.

### Day 2

- Run backend starter pack locally.
- Install Swiss Ephemeris dependency.
- Confirm Sun/Moon calculation proof-of-concept.

### Day 3

- Implement D1 calculation endpoint stub to real calculation.
- Add birth profile database table.

### Day 4

- Implement D9/Navamsa helper and tests.
- Lock Uthiradam 3rd Pada regression test.

### Day 5

- Implement Panchangam weekday and Kalam slot tests.
- Lock May 20, 2025 Tuesday regression test.

### Day 6

- Implement Sani-cycle helper and tests.
- Lock Dhanusu Moon + Meenam Saturn = Ardhashtama regression test.

### Day 7

- Review outputs with Tamil astrology domain reviewer.
- Finalize Sprint 1 backlog in issue tracker.

---

## 20. Immediate decision list for founder/product owner

1. Confirm MVP family limit: recommended 6 members.
2. Choose auth provider: Supabase Auth, Clerk, or Auth0.
3. Choose launch mode: PWA first, native app later.
4. Decide whether birth chart calculations happen server-side only for MVP.
5. Select first 20 golden charts for QA.
6. Appoint one domain reviewer to sign off calculation outputs weekly.
7. Decide Tamil writing style: classical, modern conversational, or bilingual plain Tamil.

---

## 21. Final recommendation

Proceed with **Sprint 0 immediately**, but do not allow frontend design to outrun the calculation engine. The MVP becomes valuable when a user can trust that their daily guidance, family aggregate, Dasha, Gochar, and Panchangam are calculated consistently and explained calmly.

The correct build order is:

```text
Calculation accuracy → QA dashboard → API stability → Frontend experience → Beta launch
```
