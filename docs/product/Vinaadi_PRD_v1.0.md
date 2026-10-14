---
title: Product Requirements Document
subtitle: Vinaadi AI: a Tamil-first astrology life companion
doc_id: VIN-PRD-001
version: 1.0
date: 9 October 2026
status: Draft for review
classification: External: may be shared with partners, investors and delivery teams
---

# 1. Introduction

## 1.1 Purpose

This document defines **what Vinaadi AI does for its users**: who they are, the problems the product solves for them, the features that solve them, how users move through the product, and how success is measured. It sits between the Business Requirements Document (VIN-BRD-001), which explains *why*, and the Functional Requirements Document (VIN-FRD-001), which specifies *exactly how the system behaves*.

## 1.2 Product summary

Vinaadi is a **Tamil-first astrology companion** on three surfaces that share one backend:

| Surface | Audience | Role |
|---|---|---|
| Public website | Anyone; search and social traffic | Free tools, panchangam, educational content, sign-up |
| Signed-in web dashboard | Account holders | The full daily companion: Today, Calendar, Family and Charts, Life Areas, Plan, Journal, Tools, Explore, Settings |
| Mobile app (Android and iOS) | Account holders | Daily companion optimised for phones: Today, Panchangam, Tools, Insights, Me |

From a person's birth details, Vinaadi produces their jadhagam (birth chart), then keeps it alive. It turns each day's planetary positions, the Tamil almanac and the person's planetary periods into guidance that is **personal, explained and calm**.

## 1.3 Release context

The product is in **open beta**: every signed-in user has all Premium features for free. Ask Vinaadi (the AI question feature) has a fair-use daily cap. Paid plans follow once production validation and the payment path are complete (BRD Section 8). This PRD describes the product **as it will ship at paid launch**, and marks each feature's current status.

# 2. Product principles

These principles are product requirements. A feature that breaks one is defective, however well it otherwise works.

| # | Principle | What it means in practice |
|---|---|---|
| P1 | **Precise and checkable** | Calculations use real ephemeris data for the user's exact place and time. Every result shows *why*: the planetary period, transit or factor behind it. Labels on screen match what is measured (for example, a reading titled "two minutes" is actually about two minutes long at a measured reading rate). |
| P2 | **Calm, never fearful** | Every interpretation follows *tendency → helpful action → positive frame*. Saturn periods are refinement cycles, not punishment. No doom language anywhere, including notifications. |
| P3 | **Tamil-first, one language at a time** | The full product works in Tamil or English. The screen shows only the chosen language, never a bilingual echo of the same title. Tamil almanac terms are preferred over Sanskrit forms (for example *gochaaram* for transit). |
| P4 | **One doctrine, applied everywhere** | Contested points of tradition are settled by a recorded ruling from the astrology advisor and applied the same way on every surface: web, mobile, reports and notifications. |
| P5 | **Remedies are optional** | Remedies are suggestions, never obligations, and never sold as rituals. |
| P6 | **Privacy by default** | Birth details are sensitive personal data. The product collects only what calculation needs, encrypts identifying birth data, and lets the user delete everything themselves. |
| P7 | **Accessible to everyone** | WCAG 2.2 AA; works at 375 px phone width; supports light and dark themes and reduced motion. |
| P8 | **Same answer everywhere** | Web and mobile show identical results because both use the same backend calculations. Clients never recompute astrology. |

<!-- pagebreak -->

# 3. Users and personas

The personas are illustrative composites, not real people.

## 3.1 Persona A: Meena, the daily practitioner (segment S1)

- **Profile:** 38, Coimbatore, office worker; reads Tamil comfortably; checks rahu kalam before important errands.
- **Goals:** Know the day's good and caution windows for their own city; a short personal outlook each morning.
- **Frustrations:** Printed almanacs use Chennai times; horoscope apps feel generic and alarming.
- **What wins them:** Today screen with city-precise timings, a day rating with its reasons, and a morning notification in Tamil.

## 3.2 Persona B: Raghavan, the family organiser (segment S2)

- **Profile:** 52, Madurai; manages astrology for spouse, two children and an elderly parent.
- **Goals:** Every family member's chart in one place; know whose period is challenging; plan family events.
- **Frustrations:** Paper charts scattered across drawers; recalculating dates by hand; astrologer visits for every question.
- **What wins them:** The family vault, readings for each member, a family calendar and relationship alerts.

## 3.3 Persona C: Lakshmi's parents, marriage seekers (segment S3)

- **Profile:** A couple in their late 50s in Chennai, looking for a match for their daughter.
- **Goals:** Fast, trustworthy porutham checks for many prospective matches; a shareable result; a good wedding date.
- **Frustrations:** Each match check costs money and time; results are hard to explain to relatives.
- **What wins them:** The porutham calculator, a detailed compatibility report, share links, and couple-mode muhurta.

## 3.4 Persona D: Arun, the diaspora professional (segment S4)

- **Profile:** 31, Toronto, software engineer; reads English more easily than Tamil.
- **Goals:** Observe festivals and good days correctly in their own timezone; understand the meaning behind the tradition.
- **Frustrations:** India-time almanacs; explanations that assume prior knowledge.
- **What wins them:** Timezone-correct panchangam, English mode, Learn articles, and Ask Vinaadi.

## 3.5 Persona E: Divya, the enthusiast learner (segment S5)

- **Profile:** 26, Bengaluru; studies astrology as a hobby.
- **Goals:** Look under the hood: divisional charts, planetary strengths, alternative dasha systems.
- **Frustrations:** Apps hide the working; free tools are shallow.
- **What wins them:** The Astrologer view, divisional charts, shadbala, the annual chart, and the PDF export.

<!-- pagebreak -->

# 4. Feature inventory

**Status:** Live (beta) = built and available now · Partial = built with known gaps · Planned = not yet built.
**Priority:** M = Must, S = Should, C = Could for the paid launch.

## 4.1 Onboarding and accounts

| ID | Feature | Description | Priority | Status |
|---|---|---|---|---|
| F-ACC-01 | Sign up and sign in | Email and password, or Google sign-in. Explicit privacy consent is recorded at sign-up. | M | Live (beta) |
| F-ACC-02 | Password reset | Reset link by email | M | Live (beta) |
| F-ACC-03 | Guided onboarding | Birth date, time and place; a "birth time unknown" path (moon-sign picker); a jadhagam teaser and reveal | M | Live (beta) |
| F-ACC-04 | Birthplace search | Place lookup with automatic timezone; works offline for common places | M | Live (beta) |
| F-ACC-05 | Language and theme | Tamil or English per account; light or dark theme | M | Live (beta) |
| F-ACC-06 | Life focus | User picks a focus (for example career, marriage, health, family) that reorders daily guidance. Re-asked every 60 days with an inline prompt, never a pop-up. | S | Live (beta) |
| F-ACC-07 | Delete account | Self-service permanent deletion of all user data | M | Live (beta) |
| F-ACC-08 | Referral code | Personal referral link | S | Live (beta) |

## 4.2 Jadhagam (birth chart) and readings

| ID | Feature | Description | Priority | Status |
|---|---|---|---|---|
| F-CHT-01 | Birth chart | South Indian square chart; planetary positions with sign, star and pada; lagnam; navamsa | M | Live (beta) |
| F-CHT-02 | Short and long readings | "Your chart in two minutes" and "in four minutes": plain-language narratives with their reasons; available for family members too, written in the third person | M | Live (beta) |
| F-CHT-03 | Full reading: Story view | Five short chapters, each ≤ 120 words | S | Live (beta) |
| F-CHT-04 | Full reading: Astrologer view | Detailed tables for practitioners | S | Live (beta) |
| F-CHT-05 | Yogas and doshams | Detected yogas and doshams, each with its strength, its timing (whether a dasha activates it now) and context; dosham reckoning follows recorded rulings | M | Live (beta) |
| F-CHT-06 | Divisional charts (vargas) | D-charts for deeper analysis | C | Live (beta) |
| F-CHT-07 | Planetary strength | Shadbala and Ashtakavarga | C | Live (beta) |
| F-CHT-08 | PDF export | Downloadable jadhagam report, including an Astrologer-detail version | S | Live (beta) |
| F-CHT-09 | Birth-time rectification | Helps refine an uncertain birth time from known life events | C | Live (beta) |
| F-CHT-10 | Share card | Image card of chart highlights for social sharing | S | Live (beta) |

## 4.3 Today and daily guidance

| ID | Feature | Description | Priority | Status |
|---|---|---|---|---|
| F-DAY-01 | Today hero | A one-line verdict for the day with its reason, plus a day rating from 0 to 100 | M | Live (beta) |
| F-DAY-02 | Life-area guidance | Daily guidance across career, relationships, health, finance and family; ordered by life focus | M | Live (beta) |
| F-DAY-03 | Good and caution windows | Nalla neram, rahu kalam, yamagandam and kuligai for the user's location. Kuligai is treated as conditional on the activity. | M | Live (beta) |
| F-DAY-04 | Chandrashtama | Warns of the user's chandrashtama days, framed calmly | M | Live (beta) |
| F-DAY-05 | Activity timing | Best time today, or on a chosen day, for a named activity | S | Live (beta) |
| F-DAY-06 | Week ahead | Seven-day outlook | S | Live (beta) |
| F-DAY-07 | Personal rasi palan | Daily moon-sign forecast across a tier-dependent window of days | M | Live (beta) |
| F-DAY-08 | Ambient alerts | Contextual notices: a transit starting, an upcoming festival, a relationship alert | S | Live (beta) |
| F-DAY-09 | Quick links | Shortcuts from Today into the most-used tools | C | Live (beta) |

## 4.4 Panchangam and Tamil calendar

| ID | Feature | Description | Priority | Status |
|---|---|---|---|---|
| F-PAN-01 | Daily panchangam | Tithi, nakshatra, yoga, karana, weekday, sunrise and sunset, and day timings for any location, including transition times during the day | M | Live (beta) |
| F-PAN-02 | Monthly calendar | Month view with Tamil months, festivals, personal markers (chandrashtama, good days) and an events side panel | M | Live (beta) |
| F-PAN-03 | Festivals and holidays | Hindu, Christian and Muslim festivals and Tamil Nadu government holidays | S | Live (beta) |
| F-PAN-04 | Muhurtham naal | Auspicious wedding days by year | S | Live (beta) |
| F-PAN-05 | Shareable panchangam | Share card and embeddable widget | S | Live (beta) |

## 4.5 Planetary periods and transits

| ID | Feature | Description | Priority | Status |
|---|---|---|---|---|
| F-DSH-01 | Vimshottari dasha timeline | Major periods and sub-periods, with depth by tier; the current period highlighted | M | Live (beta) |
| F-DSH-02 | Other dasha systems | Chara, Yogini, Ashtottari, Kalachakra and conditional dashas | C | Live (beta) |
| F-DSH-03 | Current transits (gochaaram) | Current planetary transits measured against the user's chart | M | Live (beta) |
| F-DSH-04 | Saturn cycle | The user's current and upcoming Saturn transit phases (for example *ezharai sani*), framed as refinement | M | Live (beta) |
| F-DSH-05 | Peyarchi | Upcoming major transits and a personal peyarchi report | S | Live (beta) |
| F-DSH-06 | Annual chart (varshaphala) | Solar-return year chart | C | Live (beta) |

## 4.6 Life areas and predictions

| ID | Feature | Description | Priority | Status |
|---|---|---|---|---|
| F-LIF-01 | Life areas | Scores and narratives for each life area, with history and trend (trend is Premium) | S | Live (beta) |
| F-LIF-02 | Life predictions | Timing windows and tendencies for marriage, career, wealth and health, each with its reasons | S | Live (beta) |
| F-LIF-03 | Life events | Upcoming event windows from the chart | S | Live (beta) |
| F-LIF-04 | Propensities | Inherent tendencies from the chart | C | Live (beta) |
| F-LIF-05 | Bhava palan | House-by-house results, each graded | S | Live (beta) |

## 4.7 Family

| ID | Feature | Description | Priority | Status |
|---|---|---|---|---|
| F-FAM-01 | Family vault | Add family members with birth details and relationship; the limit depends on tier | M | Live (beta) |
| F-FAM-02 | Member readings | The same two- and four-minute readings as the owner's, in the third person. Readings for minors are addressed to the parent. | M | Live (beta) |
| F-FAM-03 | Member switcher | A persistent bar to switch members while staying on the same section | S | Live (beta) |
| F-FAM-04 | Family calendar | Combined view of the family's important days | S | Live (beta) |
| F-FAM-05 | Relationship alerts | Alerts when members' charts interact notably | C | Live (beta) |
| F-FAM-06 | Family journal | Journal entries shared within the vault | C | Live (beta) |

## 4.8 Compatibility

| ID | Feature | Description | Priority | Status |
|---|---|---|---|---|
| F-CMP-01 | Marriage porutham | Tamil 10-porutham matching from two charts, with an overall verdict | M | Live (beta) |
| F-CMP-02 | Star-to-star matching | Quick porutham from birth stars alone, plus a full grid | S | Live (beta) |
| F-CMP-03 | Detailed compatibility | Chart comparison with a dasha-period comparison and remedies; PDF | S | Live (beta) |
| F-CMP-04 | Friendship compatibility | Non-marital compatibility | C | Live (beta) |
| F-CMP-05 | Share link | Public, tokenised share page for a porutham result | S | Live (beta) |
| F-CMP-06 | Synastry | Cross-chart influence analysis | C | Live (beta) |

## 4.9 Muhurta (auspicious timing)

| ID | Feature | Description | Priority | Status |
|---|---|---|---|---|
| F-MUH-01 | Muhurta finder | Ranked auspicious windows for a named activity over a date range, with reasons | M | Live (beta) |
| F-MUH-02 | Personalised muhurta | Filters windows against the user's chart (for example chandrashtama, tara bala) | M | Live (beta) |
| F-MUH-03 | Couple mode | For joint events, considers both charts; the weaker chart governs | S | Live (beta) |

## 4.10 Numerology and naming

| ID | Feature | Description | Priority | Status |
|---|---|---|---|---|
| F-NUM-01 | Numerology profile | Core numbers, personal year and cycles, favourable numbers, lucky dates | S | Live (beta) |
| F-NUM-02 | Name correction | Suggests spelling adjustments, with a verdict and its explanation; sessions are saved | S | Live (beta) |
| F-NUM-03 | Baby-name finder | Names matched to the child's birth-star syllables (*pada akshara*) and numerology, with meanings | S | Live (beta) |
| F-NUM-04 | Numerology compatibility and marriage dates | Couple number compatibility and favourable dates | C | Live (beta) |

## 4.11 Remedies and spiritual guidance

| ID | Feature | Description | Priority | Status |
|---|---|---|---|---|
| F-REM-01 | Remedy plan | Optional remedies tied to the current dasha lord | S | Live (beta) |
| F-REM-02 | Remedy focus card | Today's suggested practice | C | Live (beta) |
| F-REM-03 | Gemstone advice | Traditional gemstone guidance, with caveats | C | Live (beta) |
| F-REM-04 | Temples and pariharam content | Navagraha and pilgrimage temple guides; remedy articles | S | Live (beta) |

## 4.12 Ask Vinaadi (AI assistant)

| ID | Feature | Description | Priority | Status |
|---|---|---|---|---|
| F-ASK-01 | Ask a question | A natural-language question answered from the user's actual chart data, in the user's language and Vinaadi's tone | S | Live (beta) |
| F-ASK-02 | Suggested questions | Question chips matched to the user's life focus | C | Live (beta) |
| F-ASK-03 | Usage meter | Shows the questions remaining today or this month | S | Live (beta) |
| F-ASK-04 | Top-up pack | Buy 10 extra questions (Premium) | S | Planned (with payments) |

## 4.13 Engagement and reflection

| ID | Feature | Description | Priority | Status |
|---|---|---|---|---|
| F-ENG-01 | Journal | Private entries with prompts, correlated with the user's planetary periods; export; archive and retention | S | Live (beta) |
| F-ENG-02 | Goals (Plan) | Up to N active goals, depending on tier | C | Live (beta) |
| F-ENG-03 | Streak | Daily-visit streak | C | Live (beta) |
| F-ENG-04 | Life-event log | Record real events to compare with the chart | C | Live (beta) |
| F-ENG-05 | Retrospective | Look back over past periods | C | Live (beta) |
| F-ENG-06 | Annual Wrapped | A year-in-review summary, with a share card | C | Live (beta) |
| F-ENG-07 | Decision brief and what-if | Structured guidance for a decision; explore hypothetical timing | C | Live (beta) |
| F-ENG-08 | Prasna | Horary answer to a question asked now | C | Live (beta) |
| F-ENG-09 | Feedback | In-product feedback to the team | M | Live (beta) |

## 4.14 Notifications

| ID | Feature | Description | Priority | Status |
|---|---|---|---|---|
| F-NOT-01 | Morning guidance push | One push per day in the user's morning, in their timezone and language | S | Live (beta) |
| F-NOT-02 | Event alerts | Peyarchi and relationship alerts | S | Live (beta) |
| F-NOT-03 | In-app inbox | All notifications, with read state | S | Live (beta) |
| F-NOT-04 | Preferences | Per-category opt-in and opt-out | M | Live (beta) |

## 4.15 Plans, purchases and reports

| ID | Feature | Description | Priority | Status |
|---|---|---|---|---|
| F-PAY-01 | Plan display | Pricing page; the user's current plan; open-beta notice | M | Live (beta) |
| F-PAY-02 | Subscriptions | Premium monthly and annual with a 7-day trial, through the app stores | M | Partial: server-side handling built; store listings and checkout pending |
| F-PAY-03 | Pay-per-use reports | 1-, 3-, 5- and 10-page reports; 1- and 3-page porutham reports | M | Partial: purchase endpoint built; checkout pending |
| F-PAY-04 | Restore purchases | On any device, tied to the account | M | Partial |
| F-PAY-05 | Ads on free tiers | Mobile ads for guest and free users; none for Premium | C | Partial |

## 4.16 Public site (acquisition)

| ID | Feature | Description | Priority | Status |
|---|---|---|---|---|
| F-PUB-01 | Free tools | Jadhagam generator, marriage porutham calculator, muhurta calculator, numerology calculator, baby-name finder, chandrashtama, daily rasi palan, daily panchangam planner, friendship compatibility, birth-time rectification | M | Live (beta) |
| F-PUB-02 | Reference content | Pages for all 27 nakshatras, doshams, pariharams, yogas, temples, festivals and the Tamil calendar, plus Learn articles | M | Live (beta) |
| F-PUB-03 | Tamil URLs | Tamil-language twins of public pages under `/ta/` | S | Live (beta) |
| F-PUB-04 | Trust pages | About, methodology, privacy, terms, beta notice | M | Live (beta) |
| F-PUB-05 | Tool-to-signup carry-over | A tool result carries into the new account | S | Partial |
| F-PUB-06 | Dynamic share images | Per-page social preview images | C | Planned |

## 4.17 Administration

| ID | Feature | Description | Priority | Status |
|---|---|---|---|---|
| F-ADM-01 | Admin console | Users, suspension, scheduled jobs, audit log, broadcast notices, health | M | Live (beta) |
| F-ADM-02 | Feature flags | Switch features on or off without a release | M | Live (beta) |
| F-ADM-03 | Analytics | Daily activity, feature usage, retention, acquisition sources, life-focus choices | M | Live (beta) |
| F-ADM-04 | Calculation QA | Validation against reference values and a regression register | S | Live (beta) |

<!-- pagebreak -->

# 5. Key user journeys

## 5.1 J1: From search to first value (Persona D)

1. Searches "Toronto panchangam today" and lands on the public panchangam page.
2. Tries the free jadhagam generator and sees their chart.
3. Signs up with Google. The birth details carry over, and consent is recorded.
4. Lands on **Today**: a one-line verdict, the day rating with reasons, and good and caution windows for Toronto.
5. Accepts the morning notification.

**Success:** a chart is generated within the first session; the user returns within 7 days.

## 5.2 J2: Building the family vault (Persona B)

1. Opens **Family and Charts** and taps *Add member*.
2. Enters the member's birth details and relationship.
3. Uses the member switcher to read each member's two-minute reading.
4. Opens the family calendar to see everyone's important days for the month.

**Success:** at least two members added within 14 days; the user returns weekly.

## 5.3 J3: Checking a marriage match (Persona C)

1. Opens the porutham calculator (public or signed-in) and enters both people's details.
2. Sees all 10 poruthams with an overall verdict and plain-language reasons.
3. Shares the result by link with relatives.
4. *(Paid launch)* Buys a detailed 3-page porutham report.
5. Uses couple-mode muhurta to find wedding dates.

**Success:** the result is shared; a report is purchased after the paid launch.

## 5.4 J4: The daily habit (Persona A)

1. Receives the morning push in Tamil with a one-line outlook.
2. Opens Today and checks rahu kalam and nalla neram for their city.
3. Checks the activity timing for an errand.
4. Writes a short journal note in the evening; the streak increments.

**Success:** active five or more days a week.

## 5.5 J5: Going deep (Persona E)

1. Opens the full reading and switches to the **Astrologer view**.
2. Reviews divisional charts, shadbala and the Chara dasha.
3. Exports the Astrologer PDF.
4. Asks Vinaadi a question about a specific yoga.

**Success:** uses Premium-only features; converts to Premium.

## 5.6 J6: Leaving with their data (any persona)

1. Settings → Privacy → *Delete my account*.
2. Confirms. All profiles, charts, journal entries and family data are permanently deleted, and the user is signed out.

**Success:** completed in-product with no operator involvement.

# 6. Entitlements by plan

The rules below apply after the paid launch. During the open beta, every signed-in user receives Premium entitlements, and Ask Vinaadi is capped at 7 questions per day as fair use.

| Capability | Guest | Free account | Premium |
|---|---|---|---|
| Public tools, panchangam, content | ✓ | ✓ | ✓ |
| Saved birth profiles | 0 | 3 | Unlimited |
| Family vault members | 0 | 1 | 5 |
| Goals | 0 | 3 | Unlimited |
| Rasi palan window | Today | ± 7 days | ± 30 days |
| Dasha depth | None | Current major + sub-period | Full |
| Ask Vinaadi | 2 / day | 7 / day | 30 / month + top-ups |
| Reports included | None | Pay per use | 5 detailed + 3 porutham / month |
| Journal, streak, push, annual Wrapped | ✗ | ✓ | ✓ |
| Wrapped share card | ✗ | ✗ | ✓ |
| Varshaphala, vargas, synastry, rectification, remedies plan, life-event log, retrospective, life-area history | ✗ | ✗ | ✓ |
| Ads | Yes | Yes | No |

**Rule:** a feature gate always reads the user's live entitlement from the server. It never reads a copy held in the client, so a lock can never disagree with what the server allows.

# 7. Product-level non-functional requirements

| ID | Area | Requirement |
|---|---|---|
| NFR-P-01 | Performance | Today and the panchangam load their main content within 2.5 s at the 75th percentile on a mid-range phone over 4G. Pending states keep the final layout height, so content does not jump. |
| NFR-P-02 | Accuracy | Calculations match reference test cases. Planetary positions agree with the ephemeris to within one arc-minute; day timings to within one minute for the given location. |
| NFR-P-03 | Accessibility | WCAG 2.2 AA: contrast, keyboard access, visible focus, screen-reader labels, no horizontal scroll at 375 px, `prefers-reduced-motion` respected. |
| NFR-P-04 | Localisation | Every user-facing string exists in Tamil and English. Astrology names are rendered from language-neutral keys through the localiser, never from English name fields. Tamil copy is reviewed by a native reader. |
| NFR-P-05 | Tone | No fear or doom vocabulary in any interpretation or notification; checked by automated tests and review. |
| NFR-P-06 | Privacy | Identifying birth data is encrypted at the field level. Public claims about encryption state exactly what is and is not encrypted. Self-service deletion is available. |
| NFR-P-07 | Availability | 99.5% monthly availability for the API during beta; 99.9% target after the paid launch. |
| NFR-P-08 | Consistency | Web and mobile show identical calculated values for the same input. |
| NFR-P-09 | Offline resilience | The mobile app shows the last-loaded Today and panchangam when offline; birthplace search works offline for common places. |
| NFR-P-10 | Search visibility | Each public page has its own title, description and canonical URL, Tamil/English alternates, and is in the sitemap. |

# 8. Success metrics

| Metric | Definition | Target (proposed) |
|---|---|---|
| **North star: weekly active charts** | Distinct charts viewed per rolling week | +10% month-on-month during beta |
| Activation | Sign-ups who generate their own chart within 24 h | ≥ 70% |
| D7 / D30 return | Activated users returning on day 7 / day 30 | ≥ 30% / ≥ 18% |
| Family adoption | Active users with at least 1 family member | ≥ 25% |
| Share rate | Shares per 100 weekly active users | ≥ 8 |
| Ask Vinaadi engagement | Weekly active users who ask at least one question | ≥ 20% |
| Notification opt-in | Mobile users with morning push enabled | ≥ 50% |
| Paid conversion (post-launch) | 30-day active users on Premium | ≥ 4% at 90 days |
| Helpfulness | Feedback rated helpful or better | ≥ 75% |

The **life-focus picker** has a pre-registered tuning rule. A focus option is retired from the picker only if at least 400 users have been offered it, fewer than 2% picked it (statistical upper bound below 4%), and two readings at least 28 days apart agree. Saved choices are never rewritten.

# 9. Release plan

| Release | Scope | Status |
|---|---|---|
| R1: Open beta | Everything marked Live (beta) above; production domain; Android listing; legal pages; licence decision | In progress |
| R2: Beta hardening | Native Tamil review backlog; device testing pass; production KPI baseline | Next |
| R3: Paid launch | Subscriptions, pay-per-use, restore purchases, top-ups, advance notice to users | After R2 |
| R4: Growth | Dynamic share images, tool-to-signup carry-over, notification improvements, Family plan evaluation | After R3 |

# 10. Non-goals

- Live chat or video with astrologers.
- Western or tropical astrology, sun-sign horoscopes, tarot.
- Any medical, legal or financial advice.
- Selling rituals, poojas or gemstones.
- User-selectable ayanamsa or house systems in this release (one documented convention).
- Social feeds or public user profiles.

# 11. Open product questions

| ID | Question | Proposed answer |
|---|---|---|
| Q-1 | Should a Family plan exist separately from Premium? | Evaluate after 90 days of paid data (BRD D-2) |
| Q-2 | Should the "practical impact" grading of structural yogas be shown to all users or only in the Astrologer view? | Astrologer view only until the advisor rules |
| Q-3 | Should guests be able to save one chart on the device without an account? | No. An account is required, so data can be restored and deleted. |
| Q-4 | Should Ask Vinaadi answers be saved to a history? | Yes, in R4, subject to the privacy review |

# Appendix A. Traceability to business requirements

| Business requirement | Product features |
|---|---|
| BR-01 Precise calculation | F-CHT-01, F-PAN-01, F-DSH-01, F-ADM-04, NFR-P-02 |
| BR-02 Tone | All interpretation features; NFR-P-05 |
| BR-03 Tamil and English | F-ACC-05, F-PUB-03, NFR-P-04 |
| BR-04 Daily outlook | F-DAY-01 … F-DAY-09, F-NOT-01 |
| BR-05 Family | F-FAM-01 … F-FAM-06 |
| BR-06 Porutham | F-CMP-01 … F-CMP-05 |
| BR-07 Muhurta | F-MUH-01 … F-MUH-03 |
| BR-08 Explainability | F-CHT-02, F-DAY-01, F-LIF-02, F-MUH-01 |
| BR-09 / BR-10 Plans and payments | Section 6; F-PAY-01 … F-PAY-05 |
| BR-11 / BR-12 / BR-13 Acquisition | F-PUB-01 … F-PUB-06, F-CHT-10, F-CMP-05, F-ACC-08 |
| BR-14 Ask Vinaadi | F-ASK-01 … F-ASK-04 |
| BR-15 Notifications | F-NOT-01 … F-NOT-04 |
| BR-16 / BR-17 Data rights and encryption | F-ACC-01, F-ACC-07, NFR-P-06 |
| BR-18 Operations | F-ADM-01 … F-ADM-04 |
| BR-19 Doctrine governance | Principle P4 |
| BR-20 Remedies | F-REM-01 … F-REM-04 |
| BR-21 Numerology and naming | F-NUM-01 … F-NUM-04 |
| BR-22 Astrologer depth | F-CHT-04, F-CHT-06, F-CHT-07, F-DSH-02 |
| BR-23 One backend | Principle P8; NFR-P-08 |

# Appendix B. Glossary

See the glossary in VIN-BRD-001, Appendix A. Additional terms used here:

| Term | Meaning |
|---|---|
| Pada / paadham | One quarter of a nakshatra; used for naming syllables |
| Pada akshara | The naming syllable associated with a birth star's pada |
| Navamsa (D9) | The ninth divisional chart; important for marriage |
| Shadbala | Six-fold planetary strength calculation |
| Ashtakavarga | Point-based strength system for transits |
| Varshaphala | Annual (solar-return) chart |
| Tara bala | The strength of a day's star relative to the birth star |
| Prasna | Horary astrology: answering a question from the moment it is asked |
