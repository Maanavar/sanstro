---
title: Business Requirements Document
subtitle: Vinaadi AI: a Tamil-first astrology life companion
doc_id: VIN-BRD-001
version: 1.0
date: 9 October 2026
status: Draft for review
classification: External: may be shared with partners, investors and delivery teams
---

# 1. Executive summary

Vinaadi AI is a Tamil-first astrology companion for the web and for mobile. It turns a person's birth chart (*jadhagam*) and the daily Tamil almanac (*panchangam*) into calm, practical guidance for everyday life. That guidance covers the day ahead, the year ahead, family harmony, marriage compatibility, auspicious timing and remedies.

Tamil astrology is a daily habit for millions of households. Today it is served in three main ways:

- consultations with a human astrologer, which are reactive and expensive;
- printed almanacs, which are generic and not personal;
- apps that are mostly Hindi- or English-first and often lean on fear.

Vinaadi's business case rests on three things existing products do not offer together:

1. **Precision you can check.** Every calculation uses astronomical ephemeris data (Thirukanitham / Drik Ganita, Lahiri ayanamsa) and city-specific sunrise. It does not use regional averages.
2. **Tamil-first, without fear.** Every interpretation follows a fixed tone rule: *tendency, then helpful action, then a positive frame*. The product never predicts doom.
3. **A lifelong family companion.** Vinaadi is used daily, not as a one-time chart reading. It follows the user and their family through life stages, planetary periods and important events.

**Current state (October 2026).** The core product is built and running as an **open beta**. Every signed-in user gets all features free while the service is refined. The web application, the public tools and content site, and the Android/iOS app share one backend. The business decision recorded for this phase is: *launch the open beta, validate it in production, and then introduce paid plans.*

**What this document asks for.** Stakeholder agreement on:

- the business objectives and success measures (Section 3);
- the scope boundary for the paid launch (Section 4);
- the pricing model (Section 8);
- the open business decisions listed in Section 15.

> This BRD states *why* and *what the business needs*. The Product Requirements Document (VIN-PRD-001) describes *what the product does for users*. The Functional Requirements Document (VIN-FRD-001) specifies *how the system must behave*. Each requirement in those documents traces back to a business requirement here.

<!-- pagebreak -->

# 2. Business context

## 2.1 The problem

| Who | Today's experience | Cost of the status quo |
|---|---|---|
| Tamil families | Consult an astrologer for major events: marriage matching, naming a child, house-warming dates | Expensive, slow, reactive; quality varies widely between practitioners |
| Daily practitioners | Read a printed or generic panchangam: rahu kalam, nalla neram, festival days | Timings are averaged for a region, so they can be off by many minutes for the reader's actual city |
| Diaspora Tamils | Little access to trusted Tamil astrologers; time-zone conversions done by hand | Errors in local timings; tradition drifts away from the next generation |
| App users | Generic horoscope apps, often in Hindi or English, built on mixed systems | Fear-based messaging ("bad times ahead") erodes trust; the content does not reflect Tamil practice |

## 2.2 The opportunity

- Tamil has roughly 80 million speakers worldwide, with large communities in Tamil Nadu, Puducherry, Sri Lanka, Singapore, Malaysia, the Gulf states, the UK, North America and Australia.
- Astrology in Tamil households is used **continuously, not occasionally**: daily timings, weekly planning, monthly festivals, yearly transits (*peyarchi*), and life events such as marriage, childbirth and education. This frequency supports a **daily-use product with subscription economics**, not only one-off report sales.
- Family decisions are made collectively. A product that holds the charts of a whole family creates strong retention and a natural reason to upgrade.

## 2.3 Why now

- High-precision ephemeris calculation, AI-assisted natural-language answers and bilingual mobile delivery can now be combined at low running cost.
- Smartphone use is close to universal among working-age Tamil speakers, and families already share astrology content over WhatsApp. Share-ready cards and public links turn that habit into free acquisition.
- The core engine (charts, panchangam, planetary periods, compatibility, timing, numerology) is already built and tested. The remaining work is mainly launch readiness and monetisation, not invention.

# 3. Business objectives and success measures

## 3.1 Objectives

| ID | Objective | Horizon |
|---|---|---|
| BO-1 | Establish Vinaadi as the most trusted Tamil-first astrology product, measured by precision and tone | Open beta → 12 months |
| BO-2 | Build a daily habit: users return for daily guidance, not only for one-off reports | Open beta |
| BO-3 | Convert engaged users to paid plans once beta validation completes | Paid launch → 12 months |
| BO-4 | Grow through sharing and search, with low paid-acquisition cost | Continuous |
| BO-5 | Protect user trust and meet data-protection obligations (India DPDP Act 2023 and app-store policies) | Before paid launch |
| BO-6 | Keep the running cost per active user low enough for an affordable price point | Continuous |

## 3.2 Key performance indicators

The beta has not yet produced a production baseline. These targets are **proposed** and will be re-set after the first 60 days of beta data.

| KPI | Definition | Proposed target | Objective |
|---|---|---|---|
| Activation rate | Share of sign-ups who generate their own chart within 24 hours | ≥ 70% | BO-2 |
| Day-7 return | Share of activated users who return on day 7 | ≥ 30% | BO-2 |
| Day-30 return | Share of activated users who return on day 30 | ≥ 18% | BO-2 |
| Weekly active charts | Distinct charts viewed in a rolling week (north-star measure) | Growth ≥ 10% month-on-month during beta | BO-2 |
| Share rate | Share cards or links created per 100 weekly active users | ≥ 8 | BO-4 |
| Organic share of sign-ups | Sign-ups attributed to search, shares or referral rather than paid ads | ≥ 60% | BO-4 |
| Paid conversion | Share of 30-day-active users on a paid plan, 90 days after paid launch | ≥ 4% | BO-3 |
| Monthly churn (paid) | Share of paying subscribers lost per month | ≤ 6% | BO-3 |
| Trust signal | Share of feedback that rates guidance "helpful" or better | ≥ 75% | BO-1 |
| Data-rights response | Account deletion completed in-product, without an operator | 100% self-service | BO-5 |

Sign-up attribution (first-touch source, referral codes), feature usage and retention cohorts are already captured by the platform's built-in analytics, so these KPIs can be measured from day one.

<!-- pagebreak -->

# 4. Scope

## 4.1 In scope for the paid launch

| Area | Summary |
|---|---|
| Birth chart (jadhagam) | South Indian chart, planetary positions, divisional charts, strengths, yogas and doshams, readings of several lengths, PDF export |
| Daily guidance | Personal day rating, guidance by life area, best and caution windows, chandrashtama, week ahead |
| Tamil panchangam and calendar | City-specific daily almanac, monthly calendar, Tamil months, festivals, auspicious wedding days (*muhurtham naal*) |
| Planetary periods and transits | Vimshottari dasha timeline, other dasha systems for advanced users, Saturn cycles, Jupiter/Saturn/Rahu-Ketu transits (*peyarchi*) |
| Life areas and predictions | Career, marriage, wealth and health tendencies and timing windows, with plain-language reasons |
| Family | Family vault of member charts, readings for each member, family calendar, relationship alerts |
| Compatibility | Tamil 10-porutham marriage matching, star-to-star matching, friendship compatibility, shareable results |
| Muhurta | Personal and couple-mode auspicious time finder for named activities |
| Numerology and baby names | Numerology profile, name correction, baby-name finder aligned to the birth star |
| Remedies | Optional remedies (*pariharam*), temple guidance, gemstone advice |
| Ask Vinaadi | AI-assisted answers to natural-language questions, grounded in the user's chart |
| Engagement | Journal, goals, streaks, life-event log, retrospective, annual "Wrapped" summary |
| Notifications | Morning guidance push, transit and relationship alerts, in-app inbox |
| Public site | Free tools, educational articles, nakshatra, temple, festival and panchangam pages for search acquisition |
| Accounts and plans | Email and Google sign-in, plans and entitlements, pay-per-use reports, subscriptions |
| Operations | Admin console, feature flags, analytics, audit log, scheduled jobs |

## 4.2 Out of scope (this release)

- Live consultations with human astrologers. A referral marketplace is a candidate for a later phase (see Section 15).
- Languages other than Tamil and English.
- Western (tropical) astrology, and Vedic systems that conflict with Tamil practice where the two disagree.
- Medical, legal or financial advice. All guidance is framed as traditional interpretation, never as professional advice.
- Physical products: printed reports, gemstones, ritual services.
- Anonymous purchases. Buying anything requires a free account so that purchases can be restored on any device.

# 5. Stakeholders

| Stakeholder | Interest | Role in this project |
|---|---|---|
| Founder / product owner | Vision, business outcome, final decisions | Approves this BRD; owns go/no-go |
| Tamil astrology advisor(s) | Fidelity to Tamil tradition and doctrine | Reviews calculation conventions, interpretations and remedies; issues rulings on contested points |
| Native Tamil language reviewer | Natural, correct Tamil copy | Reviews all user-facing Tamil text before release |
| Engineering (backend, web, mobile) | Feasible, maintainable delivery | Builds and operates the platform |
| Design / UX | Clarity, accessibility, calm tone | Owns the interface and the design system |
| Operations and support | Uptime, user issues, data requests | Runs the admin console; handles feedback within service levels |
| Legal and privacy advisor | Compliance (DPDP, app stores, licensing) | Reviews privacy policy, terms, consent, licensing |
| End users and families | Trustworthy, useful guidance | Beta feedback; usage data informs priorities |
| Investors and partners | Growth and return | Informed through this BRD and the KPI reports |
| Third-party providers | Service agreements | Ephemeris licensing, AI model, push, email, payments, maps |

**RACI for key decisions**

| Decision | Responsible | Accountable | Consulted | Informed |
|---|---|---|---|---|
| Calculation doctrine and conventions | Astrology advisor | Product owner | Engineering | All |
| Pricing and plans | Product owner | Product owner | Investors, Engineering | Users (with notice) |
| Release go/no-go | Engineering lead | Product owner | Ops, Legal | All |
| Privacy policy and consent | Legal advisor | Product owner | Engineering | Users |
| Tamil copy sign-off | Language reviewer | Product owner | Astrology advisor | Engineering |

<!-- pagebreak -->

# 6. Target market and customer segments

| Segment | Description | Primary needs | Value to the business |
|---|---|---|---|
| S1: Daily practitioner | Adult Tamil speaker who checks timings and the day's outlook | Accurate local timings; a short daily outlook | High frequency; strong habit; ad and subscription base |
| S2: Family organiser | Parent or head of household managing the family's astrology needs | Charts for every member; family calendar; marriage and child-naming support | Highest willingness to pay; strongest retention |
| S3: Marriage-seeking family | Families evaluating matches for a son or daughter | Porutham matching, detailed compatibility, wedding dates | Event-driven purchase of reports; strong word of mouth |
| S4: Diaspora professional | Tamils outside India, aged 25–45, digitally native, English-comfortable | Correct local-timezone timings; an explanation of tradition | Higher income; prefers subscription; shares content |
| S5: Learner / enthusiast | Wants to understand their chart in depth | Deeper charts, divisional charts, alternative dasha systems, an astrologer-level view | Premium feature usage; advocates; content engagement |

**Geography.** Primary: Tamil Nadu and Puducherry. Secondary: Sri Lanka, Singapore, Malaysia, the Gulf states, the UK, the US, Canada and Australia. City-specific calculation works worldwide, so the diaspora is served without separate work.

# 7. Value proposition and differentiation

| Dimension | Typical alternatives | Vinaadi |
|---|---|---|
| Calculation system | Mixed or generic, often unstated | Thirukanitham / Drik Ganita with Lahiri ayanamsa; the conventions are written down and verifiable |
| Local accuracy | Regional averages | Calculated for the user's exact location and timezone, anywhere in the world |
| Language | Hindi- or English-first | Tamil-first; full English alternative; Tamil almanac naming |
| Tone | Fear-based, fatalistic | Tendency → helpful action → positive frame; no doom language, including in notifications |
| Coverage | One-time reading | Daily, yearly and lifelong; family-wide |
| Transparency | "Trust us" | Each result explains *why*: the planetary period, transit or factor behind it |
| Family | Individual only | Family vault, readings for each member, family calendar |
| Sharing | Screenshots | Purpose-built share cards and public share links |

**Positioning statement.** *For Tamil families who live by the almanac, Vinaadi is the astrology companion that is precise to their city, speaks their language, and guides without fear. Unlike generic horoscope apps, every Vinaadi answer is calculated from real astronomy and explains its reasons.*

# 8. Business model and pricing

## 8.1 Phasing

| Phase | Commercial state | Exit criterion |
|---|---|---|
| Phase 1: Open beta (current) | All features free for any signed-in user; Ask Vinaadi capped at a fair-use daily limit | Production stability, measured baseline KPIs, legal readiness complete, payment path live |
| Phase 2: Paid launch | Free tier plus a Premium subscription and pay-per-use reports; users get advance notice | 90-day conversion and churn read against targets |
| Phase 3: Growth | Price and plan tuning; family plan; partner channels | Business-plan milestones |

Ending the beta is a single coordinated switch, made on both the server and the client copy. It is gated on a working payment path. Users will be notified before anything that was free becomes paid.

## 8.2 Plans and entitlements (post-beta, proposed)

| Entitlement | Guest (no account) | Free account | Premium |
|---|---|---|---|
| Public tools and panchangam | Yes | Yes | Yes |
| Saved birth profiles | None | Up to 3 | Unlimited |
| Family vault members | None | 1 | 5 |
| Daily rasi palan window | Today only | ± 7 days | ± 30 days |
| Planetary period (dasha) depth | None | Current major and sub-period | Full tree, including sub-sub-periods |
| Ask Vinaadi | 2 per day | 7 per day | 30 per month, plus top-up packs |
| Detailed reports included | None | Pay per use | 5 per month |
| Porutham reports included | None | Pay per use | 3 per month |
| Advanced tools: divisional charts, annual chart (*varshaphala*), synastry, rectification, remedies plan, life-event log, retrospective, life-area history | No | No | Yes |
| Journal, streaks, push notifications, annual Wrapped | No | Yes | Yes, including Wrapped sharing |
| Advertising | Yes | Yes | No |

## 8.3 Price points (proposed, in INR)

| Product | Price |
|---|---|
| Premium monthly | ₹149 / month |
| Premium annual | ₹999 / year (about 44% saving over monthly) |
| Free trial | 7 days on any subscription |
| Report: Quick Snapshot (1 page) | ₹29 |
| Report: Standard (3 pages) | ₹59 |
| Report: Detailed (5 pages) | ₹99 |
| Report: Full Portrait (10 pages) | ₹179 |
| Porutham Summary (1 page) | ₹49 |
| Detailed Jadhagam Porutham (3 pages) | ₹99 |
| Ask Vinaadi top-up (10 questions) | ₹49 |

> **Decision required (D-1).** An earlier product specification proposed higher tiers: Personal at ₹499/month and Family at ₹899/month for up to six members, plus one-time reports at ₹299–₹499. The figures above are the ones currently configured in the product. Stakeholders should confirm the launch price points, and decide whether a separate Family plan is offered at launch or in Phase 3.

## 8.4 Revenue streams

1. **Subscriptions** (primary): Premium monthly and annual, managed through the app stores and a subscription platform.
2. **Pay-per-use reports**: event-driven purchases (a marriage match, a child's chart) by free users.
3. **Advertising**: free tiers only; never shown to Premium users.
4. **Future (Phase 3 candidates)**: Family plan; referral commissions from partner astrologers; B2B panchangam widget and API licensing (an embeddable panchangam widget already exists).

## 8.5 Cost drivers

| Cost | Driver | Control |
|---|---|---|
| Hosting and database | Active users; calculation volume | Caching (daily panchangam pre-warmed for popular locations); efficient calculation |
| AI model usage (Ask Vinaadi) | Questions asked | Per-tier daily and monthly caps; paid top-ups |
| Push and email | Notifications sent | One morning push per user, sent in the user's own timezone |
| Ephemeris licensing | Licence model chosen (see Section 11) | One-time decision before launch |
| App-store fees | Store billing commission | Price points set with the commission included |

<!-- pagebreak -->

# 9. Business requirements

Priority uses MoSCoW: **M** = Must, **S** = Should, **C** = Could.

| ID | Business requirement | Priority | Rationale | Traces to |
|---|---|---|---|---|
| BR-01 | The product shall compute charts, panchangam and timing from astronomical ephemeris data, using a single documented convention (Lahiri ayanamsa, sidereal zodiac, whole-sign South Indian houses, city-specific sunrise). | M | Precision is the core differentiator | BO-1 |
| BR-02 | Every user-facing interpretation shall follow the tone rule: tendency, helpful action, positive frame. No fear or doom language anywhere, including notifications. | M | Trust and brand | BO-1 |
| BR-03 | The product shall be fully usable in Tamil and in English, showing only the user's chosen language on screen. | M | Tamil-first market | BO-1, BO-2 |
| BR-04 | The product shall give a personalised daily outlook that makes users want to return each day. | M | Habit and retention | BO-2 |
| BR-05 | The product shall let one account hold and read charts for family members. | M | Segment S2; retention; upgrade driver | BO-2, BO-3 |
| BR-06 | The product shall provide Tamil marriage-compatibility (porutham) matching with clear, explainable results. | M | Segment S3; high-value event | BO-3 |
| BR-07 | The product shall find auspicious times (muhurta) for named activities, personalised to the user's chart. | M | Core Tamil use case | BO-2 |
| BR-08 | Results shall explain their reasons (the planetary period, transit or factor) so that claims can be checked. | M | Transparency and trust | BO-1 |
| BR-09 | The product shall support tiered entitlements (guest, free, Premium) and an open-beta override from one central configuration. | M | Monetisation | BO-3 |
| BR-10 | The product shall support subscriptions and pay-per-use purchases through the app stores, with purchases restorable across devices. | M (before Phase 2) | Revenue | BO-3 |
| BR-11 | The product shall provide free, indexable public tools and educational content in both languages. | M | Low-cost acquisition | BO-4 |
| BR-12 | Users shall be able to share results (cards and links) that bring recipients back to Vinaadi. | S | Viral acquisition | BO-4 |
| BR-13 | The product shall record sign-up attribution and referrals. | S | Measure acquisition channels | BO-4 |
| BR-14 | The product shall answer natural-language questions about the user's chart, with usage limits that control cost. | S | Engagement; Premium value | BO-2, BO-6 |
| BR-15 | The product shall send timely, opt-in notifications in the user's own timezone. | S | Retention | BO-2 |
| BR-16 | Users shall be able to give consent, view their data, export their journal, and permanently delete their account themselves. | M | DPDP compliance; trust | BO-5 |
| BR-17 | Birth details and location data shall be encrypted at the field level, and public statements about encryption shall match exactly what is encrypted. | M | Sensitive personal data | BO-5 |
| BR-18 | Operators shall have an admin console for user support, feature flags, scheduled jobs, analytics and an audit log. | M | Operability | BO-5, BO-6 |
| BR-19 | Contested points of tradition shall be settled by a recorded ruling from the astrology advisor, and the product shall apply each ruling consistently on every surface. | M | Doctrinal integrity | BO-1 |
| BR-20 | The product shall offer optional remedies and temple guidance, framed as optional practices and never as mandatory or paid rituals. | S | Cultural fit; tone | BO-1 |
| BR-21 | The product shall provide numerology and baby-naming aligned to the child's birth star. | S | Family events | BO-3 |
| BR-22 | Advanced users shall have access to an astrologer-level view (divisional charts, alternative dasha systems, strength tables). | C | Segment S5; Premium value | BO-3 |
| BR-23 | The service shall run on both web and mobile from one backend, so results are identical across platforms. | M | Consistency; cost | BO-6 |

<!-- pagebreak -->

# 10. Business process overview

## 10.1 Acquisition-to-revenue funnel

| Stage | User action | Business mechanism |
|---|---|---|
| Discover | Searches "today's panchangam Chennai" or opens a shared card | Indexable public pages; share cards and links; WhatsApp sharing |
| Try | Uses a free tool: chart generator, porutham, muhurta, numerology | No sign-in required for public tools |
| Sign up | Creates a free account (email or Google) | The tool's result carries into the new account; first-touch attribution is recorded |
| Activate | Enters birth details and sees their jadhagam and today's guidance | Guided onboarding; immediate personal value |
| Habit | Returns daily for the outlook, timings and alerts | Morning push; streaks; journal |
| Expand | Adds family members, matches charts, plans events | Family vault; porutham; muhurta |
| Convert | Buys a report or subscribes to Premium | Limits on the free tier; event-driven reports (Phase 2) |
| Advocate | Shares results; refers friends | Share cards; referral code; annual Wrapped |

## 10.2 Supporting processes

- **Doctrine governance.** Questions about tradition are recorded, the astrology advisor issues a ruling, the ruling is implemented and covered by an automated test, and a reference record is kept. Ruled points are not re-opened without new evidence.
- **Content and language review.** New Tamil copy is reviewed by a native reader before release.
- **Support.** In-product feedback reaches the admin console and is triaged within one business day during beta.
- **Release.** Continuous integration runs the automated test suites (backend, web, mobile). Production releases need a go/no-go decision by the product owner against the go-live checklist.

# 11. Regulatory, legal and compliance requirements

| Area | Requirement | Status |
|---|---|---|
| India DPDP Act 2023 | Explicit consent at sign-up, with a timestamped consent record; a stated purpose for data use; self-service erasure; a published contact for data requests | Consent capture and self-service deletion built; privacy policy under final review |
| Sensitive personal data | Birth date, time, place, coordinates and timezone are encrypted at the field level. Some derived values (for example the birth star and moon sign) stay unencrypted because the calculations need them. These derived values narrow down the birth date, so public statements must not claim more encryption than this. | Built; public wording aligned to the actual residual |
| Third-party processors | The privacy policy names processors, including the AI model provider for Ask Vinaadi, push and email providers, and payment platforms | To be confirmed in the final privacy policy |
| Ephemeris licensing | The Swiss Ephemeris is dual-licensed: AGPL, or a paid professional licence. The model must be chosen explicitly and recorded before public launch, including for the distributed mobile app. | **Stop-ship decision pending** |
| App stores | Google Play and Apple App Store billing for digital goods; content policies; age rating; listing assets | Listings not yet published |
| Consumer protection | Guidance is labelled as traditional interpretation, not a guarantee. Remedies are optional. No health, legal or financial advice. | Built into the tone rules and copy |
| Children's data | An age policy for account holders. Family members who are minors are entered and managed by an adult account holder. | Policy decision pending |
| Refunds | A refund and credits policy for subscriptions and reports | To be decided before Phase 2 |

<!-- pagebreak -->

# 12. Assumptions, constraints and dependencies

## 12.1 Assumptions

- A1. Target users value city-precise timings and a calm tone enough to choose Vinaadi over free generic alternatives.
- A2. Family organisers will pay for multi-member features and event reports.
- A3. Organic search and sharing can deliver most sign-ups at launch.
- A4. Ask Vinaadi usage can be held within the per-user cost budget by the tier caps.
- A5. One documented calculation convention (with recorded advisor rulings on contested points) is acceptable to the target audience. Users who follow a different lineage are a minority who can be addressed later with options.

## 12.2 Constraints

- C1. The paid launch cannot happen until a payment path (app-store billing and a subscription platform) is live and tested.
- C2. Tamil copy must be reviewed by a native reader. Machine translation is not acceptable for release.
- C3. Doctrinal changes need an advisor ruling and cannot be made by engineering alone.
- C4. Budget: infrastructure is sized for a single-region deployment at launch, with horizontal scaling available through a shared cache.

## 12.3 Dependencies

| Dependency | Used for | Risk if unavailable |
|---|---|---|
| Swiss Ephemeris | All astronomical positions | Core product unusable; licence decision is a launch gate |
| Anthropic Claude API | Ask Vinaadi answers | Ask Vinaadi degrades; the rest of the product is unaffected |
| Firebase Cloud Messaging | Mobile push | Push paused; the in-app inbox still works |
| Email provider (SMTP) | Password reset; transactional mail | Password reset blocked |
| RevenueCat and the app stores | Subscriptions and purchases | Paid launch blocked |
| Google OAuth | "Sign in with Google" | Email sign-in still available |
| Geocoding service | Birthplace lookup | A bundled offline place list covers common locations |
| Domain, DNS and TLS | Public web presence | Launch blocked |

# 13. Risks and mitigations

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-1 | Users from other traditions dispute results | Medium | Medium | Publish the methodology; advisor rulings; explain the "why" on every result; consider lineage options later |
| R-2 | Fear-based copy slips into generated text | Low | High | Fixed tone rules; Ask Vinaadi prompt constraints; automated copy checks; no doom words in notifications |
| R-3 | Personal data breach | Low | Very high | Field-level encryption; key escrow and a tested restore; rate limiting; least-privilege secrets; audit log |
| R-4 | Ephemeris licence non-compliance | Medium | High | Explicit licence decision before launch (stop-ship item) |
| R-5 | Low conversion after the beta | Medium | High | Give notice before pricing; event-driven reports; family value; measured trials |
| R-6 | AI cost overrun | Low | Medium | Daily and monthly caps; fair-use cap during beta; paid top-ups |
| R-7 | Tamil copy quality issues | Medium | Medium | Native-reader review gate; owner-approved terminology rules |
| R-8 | App-store rejection or delay | Medium | Medium | Early submission; compliant billing; content-policy review |
| R-9 | Dependence on a single founder or team for decisions | Medium | Medium | Recorded rulings and decision logs; documented runbooks |
| R-10 | Calculation errors damage credibility | Low | High | Golden test cases against reference values; large automated test suite in continuous integration; independent verification audits |

# 14. High-level roadmap

| Milestone | Content | Exit gate |
|---|---|---|
| M1: Open beta live | Production domain, TLS, monitoring, Android app listing, privacy and terms published, licence decision | Go-live checklist complete |
| M2: Beta validation (about 60 days) | Measure the KPI baseline; fix defects; native Tamil review backlog; device testing | KPI baseline recorded; no severity-1 defects |
| M3: Paid launch | Payment path; plans active; advance notice to users; refund policy | First paying subscribers; billing reconciled |
| M4: Growth | Family plan; dynamic share images; daily push improvements; partner channels | KPIs on target |

# 15. Open business decisions

| ID | Decision | Options | Recommended | Owner |
|---|---|---|---|---|
| D-1 | Launch price points | ₹149/₹999 (configured) vs ₹499/₹899 (earlier specification) | Launch at ₹149/₹999; test higher tiers later | Product owner |
| D-2 | Family plan at launch? | Launch with Premium only / add a Family plan | Premium only; Family plan in Phase 3 after usage data | Product owner |
| D-3 | Ephemeris licence | AGPL (publish source) / professional licence | Decide with legal counsel before M1 | Product owner and legal |
| D-4 | Account-holder age policy | 18+ only / 13+ with consent | 18+ account holders; minors only as family members | Legal |
| D-5 | Data retention periods | Per data type | Define per type before M3 | Legal and engineering |
| D-6 | Refund policy | Store default / custom credits | Store default plus goodwill credits | Product owner |
| D-7 | Human astrologer referrals | Not offered / referral partnership | Revisit in Phase 3 | Product owner |
| D-8 | Expansion beyond Tamil | Other South Indian languages | Not before Tamil product-market fit | Product owner |

# 16. Approval

| Role | Name | Signature | Date |
|---|---|---|---|
| Product owner | | | |
| Astrology advisor | | | |
| Engineering lead | | | |
| Legal / privacy advisor | | | |

# Appendix A. Glossary

| Term | Meaning |
|---|---|
| Jadhagam | The birth chart (horoscope) |
| Panchangam | The Tamil almanac: the day's tithi, nakshatra, yoga, karana and weekday, plus timings |
| Rasi | One of the 12 zodiac signs; also the moon sign |
| Nakshatra / natchathiram | One of the 27 lunar mansions; a person's birth star |
| Lagnam | The ascendant: the sign rising at the moment of birth |
| Dasha / bhukti | Planetary periods (Vimshottari system) that time life events |
| Gochar / gochaaram | Planetary transits measured against the birth chart |
| Peyarchi | A major transit, such as Jupiter, Saturn or Rahu-Ketu changing sign |
| Sani cycle | Saturn's transit phases relative to the moon sign (for example *ezharai sani*, Saturn's 7½-year transit) |
| Chandrashtama | Days when the moon transits the 8th sign from the birth moon sign; traditionally a time for caution |
| Porutham | Tamil marriage-compatibility matching across 10 factors |
| Muhurta / muhurtham | An auspicious time chosen for an activity |
| Rahu kalam, yamagandam, kuligai | Daily time periods that are traditionally avoided or used conditionally |
| Nalla neram | Auspicious time windows within a day |
| Pariharam | A remedy or propitiation practice |
| Thirukanitham / Drik Ganita | The Tamil astronomical calculation tradition based on observed planetary positions |
| Ayanamsa (Lahiri) | The offset between the tropical and sidereal zodiacs; Lahiri is the standard used in India |
| DPDP Act | India's Digital Personal Data Protection Act, 2023 |
