# docs/ Index — Vinaadi AI

Quick map to the right document for each purpose. **Last regenerated: 2026-07-16.**

> Files under [archive/](archive/) are historical and **superseded** — kept for
> reference only, do not treat as current. Everything else is live.

## Start Here
- [VINAADI_DASHBOARD_SYSTEM_REFERENCE_2026-08-25.md](VINAADI_DASHBOARD_SYSTEM_REFERENCE_2026-08-25.md) — **What the signed-in product is and does.** Every dashboard screen explained (product layer first, then architecture), access/tier model, engine map, tech stack, testing, full route + API reference, and a findings appendix
- [VINAADI_MARKETING_SITE_SYSTEM_REFERENCE_2026-08-25.md](VINAADI_MARKETING_SITE_SYSTEM_REFERENCE_2026-08-25.md) — **What the public site is and does.** All 121 marketing routes, the free tools and their rate limits, the acquisition/conversion model, SEO architecture, rendering strategy, and a findings appendix
- [VINAADI_FUNCTION_CALCULATION_AND_SCORING_REFERENCE_2026-08-27.md](VINAADI_FUNCTION_CALCULATION_AND_SCORING_REFERENCE_2026-08-27.md) — **What the engine computes and how every score is derived.** The 14-layer pipeline, every calculating function and the measures it consumes, a register of all 36 user-visible scores with formula and marker, worked arithmetic for the daily score / prediction score / muhurta scale / porutham, the declared non-computations, 12 open questions and a reviewer sign-off sheet. Hand this to an external astrologer
- [VINAADI_PAGE_NEEDED_REGISTER_2026-08-27.md](VINAADI_PAGE_NEEDED_REGISTER_2026-08-27.md) — **The five executing rules that have no citation** (`PN-1`…`PN-5`: naisargika node rows, Baladi multipliers, Sevvai gender weighting, Sade Sati month bands, Jeevan/Nethiram cutoffs). Code site, provenance grade and scoring reach for each, plus what closes a row — **including why "Vakya or Thirukanitham" is a mandatory field and not clerical**. Read before citing any almanac rule
- [../README.md](../README.md) — Project setup: prerequisites, Docker, backend, web, mobile, quick reference
- [../CLAUDE.md](../CLAUDE.md) — Workspace rules: path conventions, PowerShell/shell rules, DB safety, encoding
- [AGENT_INSTRUCTIONS.md](AGENT_INSTRUCTIONS.md) — **Canonical agent reference**: stack map, mandatory astrology/coding rules, Tamil + cultural rules, tone rules, UI/UX rules, anti-patterns
- [../AGENTS.md](../AGENTS.md) — Agent work guide scoped to mobile-app gap closure (bugs → features → polish)
- [HOW_TO_USE_CODEBASE.md](HOW_TO_USE_CODEBASE.md) — Codebase orientation: repo layout, service map, key patterns

## Canonical Specifications (source of truth — do not modify lightly)
- [Jothidam_AI_Product_Specification_v7_FULL_Master_Build_Thirukanitham_2026.md](Jothidam_AI_Product_Specification_v7_FULL_Master_Build_Thirukanitham_2026.md) — **Master product spec**: full feature list, business logic, user flows
- [Jothidam_AI_Formula_Engine_Specification_v1_Thirukanitham_2026.md](Jothidam_AI_Formula_Engine_Specification_v1_Thirukanitham_2026.md) — **Calculation formulas**: ayanamsa, dasha, divisional charts, dosha rules — source of truth for astrology math
- [Jothidam_AI_Technical_API_Database_Spec_v1_Thirukanitham_2026.md](Jothidam_AI_Technical_API_Database_Spec_v1_Thirukanitham_2026.md) — API endpoints, request/response schemas, PostgreSQL schema
- [Jothidam_AI_OpenAPI_v1_Thirukanitham_2026.yaml](Jothidam_AI_OpenAPI_v1_Thirukanitham_2026.yaml) — OpenAPI contract for the v1 API
- [Jothidam_AI_PostgreSQL_Schema_v1_Thirukanitham_2026.sql](Jothidam_AI_PostgreSQL_Schema_v1_Thirukanitham_2026.sql) — Reference PostgreSQL schema DDL
- [Jothidam_AI_QA_Golden_Test_Cases_v1_Thirukanitham_2026.md](Jothidam_AI_QA_Golden_Test_Cases_v1_Thirukanitham_2026.md) — QA golden test case definitions
- [DOCTRINE_DECISIONS_V1.md](DOCTRINE_DECISIONS_V1.md) — **Ratified calculation doctrine v1.0**: the authoritative astrology decisions all modules follow
- [VINAADI_ASTROLOGY_RULEBOOK_FOR_EXTERNAL_REVIEW.md](VINAADI_ASTROLOGY_RULEBOOK_FOR_EXTERNAL_REVIEW.md) — **The doc to hand an outside astrologer.** Every live calculation and interpretation rule with an ID and a `[CORE]`/`[TRADITION]`/`[PRODUCT]`/`[VARIANT]`/`[LIMIT]` marker, so custom scoring is never mistaken for shastra. **`YOG-01` split 2026-08-27** into 32 markable per-yoga rules (`YOG-GK-01` … `YOG-ACT-01`), generated from `app/calculations/yoga_rules.py`
- [VINAADI_RULEBOOK_TABLE_APPENDIX.md](VINAADI_RULEBOOK_TABLE_APPENDIX.md) — **Generated, do not hand-edit.** Every lookup table the rulebook refers to, printed from the live constants by `scripts/generate_rulebook_appendix.py` and held in sync by `tests/test_rulebook_appendix_sync.py`. A reviewer should never have to take a table on trust

## Astrology Calculation — Audits & Reviews
- [SOURCE_PHOTOCOPY_REQUEST_2026-08-27.md](SOURCE_PHOTOCOPY_REQUEST_2026-08-27.md) — **What to physically photocopy, grouped by book rather than by rule ID.** Three volumes: the Tamil *Jothidam* book (cited 12×, title recorded nowhere), Kalaprakasika (**Book 2 CLOSED 2026-08-28** — pp.1–249 all in hand), and a printed Tamil Thirukanitham panchangam (we hold none). Names the pages that are known, refuses to guess the ones that are not, and lists what no photocopy can close
- [KALAPRAKASIKA_FULL_BOOK_EXTRACTION_2026-08-28.md](KALAPRAKASIKA_FULL_BOOK_EXTRACTION_2026-08-28.md) — **The full Kalaprakasika (printed pp.1–249) read against every open item.** Closes `A-10` (p.244 gives all seven combustion orbs *and* both retrograde variants), `MUH-06`'s SPIRITUAL divergence (p.192's eighteen-item Gulika-favourable list), `A-19` (pp.167–168 resolve the janma-tara reversal as precedence, and grade it full/half/quarter), `STR-03` and the varga amsa-lord rules (pp.178–182, incl. D7's 84 amsas). Closes three **negative** — Kalaprakasika has no Kandaka Sani rule at all (four unrelated "Kantakam"s, none involving Saturn), Ch. XL is ingress *omens* not calendar arithmetic, and Nethiram's classical parent (p.171) restricts itself to *north of the Sone*. **And one finding cuts against a ruling already made:** the Appendix (p.249) numbers thithis **1–14** with New-Moon and Full-Moon named outside the series, so `FCR-10c`'s "Krishna 15 *is* Amavasai" — the basis of the marriage 83→74 change — is not the book's own scheme. Owner's call, and the constant and its gate must move together
- [ASTROLOGER_BRIEFING_OPEN_ITEMS_2026-08-18.md](ASTROLOGER_BRIEFING_OPEN_ITEMS_2026-08-18.md) — **The document to actually hand the astrologer.** Every open item explained to answering depth: the rule, exactly what we compute, the competing practice, who is affected, and what a usable answer looks like — with an answer sheet at the end. Contains the 2026 month-boundary table that makes `PAN-05` decidable rather than open-ended
- [ASTROLOGER_RULINGS_2026-08-28.md](ASTROLOGER_RULINGS_2026-08-28.md) — **The answers to all seven, plus the optional four. Read this before touching any rule they name.** Two rulings overshot the options offered: `FCR-10c` came back a third way (Amavasai is a **VETO**, `[TRADITION]`, never citing p.79 — shipped) and `A-7` answered a threshold question with a three-band grading. `PN-1` closed `[PRODUCT]` (shipped). Queued with their gating conditions: fractional drishti and the paksha-Moon/association-Mercury benefic set ship **only** against golden-fixture diffs; Porutham rises to 35 by **trimming Emotional and Navamsa**, not by capping; 25 of 32 yoga rows are SIGNED and 7 change
- [ASTROLOGER_DECISION_REQUEST_2026-08-28.md](ASTROLOGER_DECISION_REQUEST_2026-08-28.md) — **The seven decisions only the astrologer can make, written to be pasted whole.** Self-contained: no repo access needed. `FCR-10c` (marriage on Amavasai — keep 74 as a `[VARIANT]` inference or revert to 83, constant and gate moving together), `PN-1` (relabel the two node rows `[PRODUCT]`), `A-19` (per-function exemptions, and p.167's full/half/quarter grading over our binary), `A-5`/`A-7`/`A-8` (which text governs porutham where *Jothidam* and Kalaprakasika disagree), the Porutham share at 20/100, p.245 fractional drishti, and the 32 yoga verdicts — the last with a silence-means-signed protocol and two group questions that collapse eight rows into two answers
- [OPEN_ITEMS_NEEDING_ASTROLOGER_2026-08-18.md](OPEN_ITEMS_NEEDING_ASTROLOGER_2026-08-18.md) — The same items in short form, tiered by whether the answer changes an output or only a marker 18 open doctrine items with the exact ask per item, tiered by whether the answer changes an output or only a marker; plus what needs the owner instead, what I can build unblocked, and the five questions to ask if there is time for only five
- [RELEASE_GATE_REVIEW_RESPONSE_2026-08-18.md](RELEASE_GATE_REVIEW_RESPONSE_2026-08-18.md) — **Adjudication of the external release-gate review.** Seven blockers, checked against code: six classification corrections applied, three already closed and only under-documented, one (Jeevan/Nethiram) failing its own trigger — and Swiss Ephemeris licensing, the one finding that gets harder to unwind after launch
- [ASTROLOGY_FULL_CODE_AUDIT_2026-07-16.md](ASTROLOGY_FULL_CODE_AUDIT_2026-07-16.md) — Full line-by-line re-audit of every calc + reasoning module (5 medium, ~17 low findings; no critical)
- [ASTROLOGY_AUDIT_TODOS_2026-07-16.md](ASTROLOGY_AUDIT_TODOS_2026-07-16.md) — Actionable checklist from the full-code audit (M-1..M-5, L-1..L-17, AR-1..AR-7), with suggested landing order
- [PROSE_REASONING_AUDIT_2026-07-16.md](PROSE_REASONING_AUDIT_2026-07-16.md) — Astrologer-lens audit of every reasoning/fortune *presentation* surface (RP-01..RP-17): enum-in-Tamil leaks, Thanglish nakshatra lens, register bugs, machine-print structure
- [CALC_AUDIT_REMEDIATION_PLAN_2026-07.md](CALC_AUDIT_REMEDIATION_PLAN_2026-07.md) — 44-module calc audit → Doctrine v1.0 + remediation work items
- [AUDIT_REMEDIATION_PLAN.md](AUDIT_REMEDIATION_PLAN.md) — Earlier broad calc/logic audit and remediation plan
- [THIRUKANITHAM_DEGREE_ADHIPATHI_AUDIT_2026-07.md](THIRUKANITHAM_DEGREE_ADHIPATHI_AUDIT_2026-07.md) — Degree-strength + house-lord (adhipathi) audit
- [THIRUKANITHAM_DEPTH_EXPANSION_PLAN.md](THIRUKANITHAM_DEPTH_EXPANSION_PLAN.md) — Deep-technique expansion plan (aspects, vargas, Gulika, Shadbala, extra dashas)
- [THIRUKANITHAM_VETERAN_PROTOCOL_AUDIT_2026-07.md](THIRUKANITHAM_VETERAN_PROTOCOL_AUDIT_2026-07.md) — Veteran-astrologer protocol audit
- [SEVVAIRAGU.MD](SEVVAIRAGU.MD) — Sevvai/Rahu dosha validation rules (Tamil-specific, with test scenarios)
- [FAQ_COMPARISON_WITH_OTHER_SOFTWARE.md](FAQ_COMPARISON_WITH_OTHER_SOFTWARE.md) — Why Vinaadi's output deliberately differs from JHora / Parashara Light etc.
- [ASTROLOGER_REVIEW_QUEUE.md](ASTROLOGER_REVIEW_QUEUE.md) — Open items awaiting astrologer sign-off
- [ASTROLOGER_LIVE_SESSION_BACKLOG_2026-07.md](ASTROLOGER_LIVE_SESSION_BACKLOG_2026-07.md) — Backlog worked through in the live Tamil-reader astrologer session
- [STAKEHOLDER_AUDIT_ASTROLOGER_CUSTOMER_2026-07.md](STAKEHOLDER_AUDIT_ASTROLOGER_CUSTOMER_2026-07.md) — Combined jyotishi + customer audit findings
- [PROPENSITY_ASTROLOGER_REVIEW_2026-07.md](PROPENSITY_ASTROLOGER_REVIEW_2026-07.md) — Astrologer review of the propensity ("chances & cautions") card set
- [MUHURTA_MASTER_REMEDIATION_2026-08-14.md](MUHURTA_MASTER_REMEDIATION_2026-08-14.md) — **Muhurta plan**: the 8 Thirukanitham timing factors explained, what we actually compute (2 of 10), 5 live defects, the one-engine/two-mode design, phased work, and the acceptance criteria + golden cases + perf budgets that define "fixed". **Its §8 phase table is stale** — see the handoff below for the corrected state
- [MUHURTA_STATUS_2026-08-18.md](MUHURTA_STATUS_2026-08-18.md) — **Read this before the handoff below.** Corrected state of every muhurta task at `84de58c`: T1/T2/T3/T6/A2 and the S2/S3/S4 rulings all landed after the handoff was written, so six of its "NOT STARTED" rows are wrong. Records T4 karaka dignity (and why retrogression is deliberately *not* penalised — it contradicts this codebase's own cheshta bala), T5's shipped backend+web vs outstanding mobile, the four Tamil strings awaiting approval, and what is genuinely next
- [HANDOFF_MUHURTA_NEXT_2026-08-16.md](HANDOFF_MUHURTA_NEXT_2026-08-16.md) — **Paste-to-agent handoff**: corrected state of every plan item after D1/D2/D3 shipped, then 9 scoped tasks (D4 ranking, D5 naal times, Tara Bala, karaka dignity, activity location, lagna schedule, evening windows, family gap) with acceptance tests, gates and the six questions still blocked on the astrologer
- [EC_RULING_IMPLEMENTATION_2026-08-17.md](EC_RULING_IMPLEMENTATION_2026-08-17.md) — **Implementation of the 8 adjudicated doctrine items** (EC-RULING-01…08): widowhood copy excised on two public surfaces + a static mortality sweep, Hora moved to equal 60-min from sunrise (cache v42), Rajju exemption removed, Sade Sati segmented/gated with the 5th-house insight derived, Rasi porutham made directional, Kuligai polarity mechanism, Chitra Vedha released from its hold once p.70 supplied the full table (Mrigashira/Chitra/Dhanishta is a mutual triad, not a pair — 27 is odd, so a clean-pair table must orphan a star). Answers EC-RULING-08's blocking question: the coded Marana is the 7×27 vara×nakshatra grid, adverse in 23.3% of cells
- [DOCTRINE_RULINGS_2026-08-19.md](DOCTRINE_RULINGS_2026-08-19.md) — **Adjudicated rulings on the 2026-08-18 briefing** (A-1…A-18, B-1). Kandaka Sani re-referenced from the Moon (widest behavioural change in the pass), the node Ashtakavarga proxy removed along with a `get_av_bindu` neutral-4 default that was silently handing table-less grahas a bonus, Abhijit corrected to the 8th of 15 daylight muhurtas, Mahendra's direction fixed where *no output changed* (the count set is closed under `c → 29−c`, so the error was invisible). **A-3 is CLOSED as a rule but OPEN at Aavani** — see the boundary table below. A-2/A-5 deliberately left open with evidence bars stated
- [TAMIL_MONTH_BOUNDARY_TABLE_2026-27.md](TAMIL_MONTH_BOUNDARY_TABLE_2026-27.md) — **Generated** by `scripts/derive_tamil_month_boundaries.py` (`--check` guards staleness). Every 2026-27 sankranti instant with what the sunset and sunrise conventions each do with it, the derivation behind the "8 of 12 months disagree" claim, month lengths, and the evidence trail for the open Aavani 1 dispute (17 vs 18 August). Records the finding that **no threshold rule can yield both the gazetted Puthandu and an 18 August Aavani**, which points at Vakya-vs-drik rather than a cut-off disagreement
- [ASTROLOGER_CONSULTATION_2026-08-19.md](ASTROLOGER_CONSULTATION_2026-08-19.md) — **Hand-to-the-astrologer briefing** for the five remaining open questions: Sthree Deergham/Dinam Madhyama scoring (measured — 3.7% vs 22.2% of pairings depending on the answer), the Vasya Simmam row, Abhijit's marriage/Upanayana exclusion (`PROHIBITION` vs `NO_AUSPICIOUS_CREDIT`), the Aavani month boundary + Vakya/Thirukanitham system question, and the Swiss Ephemeris licence (explicitly *not* for the astrologer)
- [DOCTRINE_CODE_AUDIT_JOTHIDAM_V2_2026-08-17.md](DOCTRINE_CODE_AUDIT_JOTHIDAM_V2_2026-08-17.md) — **Doctrine ↔ code audit**: every EC item in the *Jothidam* AUDITED Edition v2 checked against the running modules with table-vs-table diffs. 4 defects fixed (Vasya rows, a maitri contradiction, a duplicated table, and Marana Yogam never being scored); 8 items needing an astrologer ruling (Rasi porutham school, Chitra's missing Vedha pair, equal-vs-unequal Hora, Rajju eka-nakshatra, the three Sade Sati INSIGHT items, public "widowhood" copy, Kuligai polarity); 5 places the book itself is wrong

## Prediction & Reasoning Engine
- [PREDICTION_DOCTRINE_AND_ROADMAP.md](PREDICTION_DOCTRINE_AND_ROADMAP.md) — Prediction doctrine and the P0–P3 roadmap
- [PREDICTION_ONTOLOGY_EXPANSION_PLAN_2026-07.md](PREDICTION_ONTOLOGY_EXPANSION_PLAN_2026-07.md) — Plan to expand the prediction ontology / signatures
- [PREDICTION_TAXONOMY.md](PREDICTION_TAXONOMY.md) — Taxonomy of prediction categories
- [REASONING_LAYER_UPGRADE_PLAN.md](REASONING_LAYER_UPGRADE_PLAN.md) — Reasoning-layer upgrade plan (calibration, explanation surfaces)

## Content & Tamil Astrology Reference
- [NATCHATHIRAM_DASHA_WRITING_GUIDE.md](NATCHATHIRAM_DASHA_WRITING_GUIDE.md) — Rules and patterns for writing dasha content for all 27 nakshatrams
- [tamil-review-age-phase.md](tamil-review-age-phase.md) — Native-Tamil review notes: age-phase content
- [tamil-review-daily-briefing.md](tamil-review-daily-briefing.md) — Native-Tamil review notes: daily briefing
- [tamil-review-nadi-dosha.md](tamil-review-nadi-dosha.md) — Native-Tamil review notes: Nadi dosha copy
- [tamil-review-propensity-cards.md](tamil-review-propensity-cards.md) — Native-Tamil review notes: propensity cards

## Implementation & Engineering
- [REFACTOR_PLAN.md](REFACTOR_PLAN.md) — Production-readiness refactor plan (phases 0–5; some DONE, some DEFERRED)
- [error-handling.md](error-handling.md) — Centralized error-code system: backend ErrorCode enum, frontend formatters
- [MASTER_FIX_LIST.md](MASTER_FIX_LIST.md) — Cumulative fix/issue tracking list
- [API_FRONTEND_WIRING_AUDIT_2026-07.md](API_FRONTEND_WIRING_AUDIT_2026-07.md) — Endpoint-by-endpoint audit of what's wired to a real frontend vs. dead/unreachable
- [CRON_WORKER.md](CRON_WORKER.md) — Cron/scheduler worker design and operation

## Dashboard & Web UX
- [DASHBOARD_UI_REVAMP_PLAN.md](DASHBOARD_UI_REVAMP_PLAN.md) — Dashboard UI revamp plan (largest design doc)
- [DASHBOARD_AUDIT_FIXES.md](DASHBOARD_AUDIT_FIXES.md) — Dashboard audit findings and fix statuses (DASH-01..17)
- [DASHBOARD_CONSISTENCY_AUDIT_2026-07.md](DASHBOARD_CONSISTENCY_AUDIT_2026-07.md) — Dashboard consistency audit
- [DASHBOARD_IA_CARDSORT_2026-07-15.md](DASHBOARD_IA_CARDSORT_2026-07-15.md) — Dashboard information-architecture card-sort results
- [NOVA_ONLY_MIGRATION_PLAN.md](NOVA_ONLY_MIGRATION_PLAN.md) — Plan for removing the Classic UI and going Nova-only
- [UX_EXCELLENCE_AUDIT.md](UX_EXCELLENCE_AUDIT.md) — UX excellence audit findings and recommendations
- [WEB_UX_AUDIT_2026-07-15.md](WEB_UX_AUDIT_2026-07-15.md) — Web-only UX backlog (MKT/UXD/SHD items)
- [BIRTH_PROFILE_MANAGEMENT.md](BIRTH_PROFILE_MANAGEMENT.md) — Birth-profile management UX spec
- [dashboard-i18n-catalog.json](dashboard-i18n-catalog.json) — Generated dashboard i18n string catalog (consumed by `web/lib/dashboard-i18n.ts`)

## Roadmap & Product
- [VINAADI_ENHANCEMENT_ROADMAP_v1.md](VINAADI_ENHANCEMENT_ROADMAP_v1.md) — Enhancement roadmap and decisions log
- [ROADMAP_TASKS.md](ROADMAP_TASKS.md) — Roadmap task list
- [TIER_PLAN.md](TIER_PLAN.md) — Guest/registered/premium tiers, pay-per-use catalogue, product decisions

## Marketing, SEO, Public Site & Launch
- [MARKETING_PLAN.md](MARKETING_PLAN.md) — Growth strategy, site IA, homepage blueprint, SEO roadmap
- [PUBLIC_SITE_QA_CHECKLIST.md](PUBLIC_SITE_QA_CHECKLIST.md) — Repeatable QA checklist before any public-site deploy
- [RELEASE_GATE_BROWSER_PASS.md](RELEASE_GATE_BROWSER_PASS.md) — Release-gate live browser-pass checklist
- [launch/GO_LIVE_CHECKLIST.md](launch/GO_LIVE_CHECKLIST.md) — Master go-live checklist: product, engineering, infra, legal, analytics, support
- [launch/BETA_LAUNCH_CHECKLIST.md](launch/BETA_LAUNCH_CHECKLIST.md) — Narrower checklist for the current public beta flow

## Mobile
- [mobile/00-INDEX.md](mobile/00-INDEX.md) — **Mobile docs index** for the numbered spec set (`01`–`12`: market, personas, PRD, screens, design, API, analytics, risks, gap closure)
- [mobile/MOBILE_DECISIONS.md](mobile/MOBILE_DECISIONS.md) — **Owner-level decisions**: scope, monetization, GTM, access model (LOCKED)
- [mobile/MOBILE_DESIGN_BRIEF.md](mobile/MOBILE_DESIGN_BRIEF.md) — Design authority: color, typography, all screens across phases A/B/C
- [mobile/MOBILE_BUILD_SPEC.md](mobile/MOBILE_BUILD_SPEC.md) — **Coding-agent reference**: tech stack, non-negotiables, screen-by-screen build spec
- [MOBILE_PRODUCT_DESIGN.md](MOBILE_PRODUCT_DESIGN.md) — Mobile product design overview
- [MOBILE_UX_2026.md](MOBILE_UX_2026.md) — Mobile UX principles and screen patterns for 2026

## Admin
- [admin/ADMIN_FULL_IMPLEMENTATION.md](admin/ADMIN_FULL_IMPLEMENTATION.md) — Admin panel full implementation reference

## Archive (historical — superseded, do not treat as current)
- [archive/FRONTEND.md](archive/FRONTEND.md) — Old frontend status/gap list; superseded by [API_FRONTEND_WIRING_AUDIT_2026-07.md](API_FRONTEND_WIRING_AUDIT_2026-07.md)
- [archive/IMPLEMENTATION_GUIDE.md](archive/IMPLEMENTATION_GUIDE.md) — Frozen MVP-1 implementation snapshot; see [REFACTOR_PLAN.md](REFACTOR_PLAN.md) and [AGENT_INSTRUCTIONS.md](AGENT_INSTRUCTIONS.md) for current
- [archive/ONBOARDING_PRICING_FIXES.md](archive/ONBOARDING_PRICING_FIXES.md) — Historical onboarding/pricing fix notes
- [archive/FAMILY_CHART_EXPLANATION_PLAN_v1.md](archive/FAMILY_CHART_EXPLANATION_PLAN_v1.md) — Per-person chart-explanation panel plan (implemented)
- [archive/Vinaadi_Enhancement_Peyarchi_Notifications_v1.md](archive/Vinaadi_Enhancement_Peyarchi_Notifications_v1.md) — Peyarchi (transit) notifications feature spec
