# docs/ Index — Vinaadi AI

Quick map to the right document for each purpose.

## Start Here
- [README.md](../README.md) — Project setup: prerequisites, Docker, backend, web, mobile, quick reference
- [AGENT_INSTRUCTIONS.md](AGENT_INSTRUCTIONS.md) — **Single canonical reference** for any agent/Claude working on this codebase: stack map, mandatory astrology/coding rules, Tamil astrology + cultural rules, content tone rules, UI/UX rules, anti-patterns

## Canonical Specifications (source of truth — do not modify lightly)
- [Jothidam_AI_Product_Specification_v7_FULL_Master_Build_Thirukanitham_2026.md](Jothidam_AI_Product_Specification_v7_FULL_Master_Build_Thirukanitham_2026.md) — **Master product spec**: full feature list, business logic, user flows
- [Jothidam_AI_Formula_Engine_Specification_v1_Thirukanitham_2026.md](Jothidam_AI_Formula_Engine_Specification_v1_Thirukanitham_2026.md) — **Calculation formulas**: Lahiri ayanamsa, dasha, divisional charts, dosha rules — source of truth for all astrology math
- [Jothidam_AI_Technical_API_Database_Spec_v1_Thirukanitham_2026.md](Jothidam_AI_Technical_API_Database_Spec_v1_Thirukanitham_2026.md) — API endpoints, request/response schemas, PostgreSQL schema
- [Jothidam_AI_QA_Golden_Test_Cases_v1_Thirukanitham_2026.md](Jothidam_AI_QA_Golden_Test_Cases_v1_Thirukanitham_2026.md) — QA golden test case definitions

## Implementation
- [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) — Non-negotiable rules, MVP scope, stack context, all implementation phases
- [REFACTOR_PLAN.md](../REFACTOR_PLAN.md) — Production-readiness refactor plan (phases 0–5; some DONE, some DEFERRED)

## Frontend
- [FRONTEND.md](FRONTEND.md) — Current UI status, missing features, UI/UX backlog

## Mobile
- [mobile/00-INDEX.md](mobile/00-INDEX.md) — Mobile docs index (10 spec files covering market, personas, PRD, screens, design, API, analytics, risks)
- [mobile/MOBILE_DECISIONS.md](mobile/MOBILE_DECISIONS.md) — **Owner-level decisions**: scope, monetization, GTM, access model (LOCKED)
- [mobile/MOBILE_DESIGN_BRIEF.md](mobile/MOBILE_DESIGN_BRIEF.md) — Design authority: color, typography, all screens across phases A/B/C
- [mobile/MOBILE_BUILD_SPEC.md](mobile/MOBILE_BUILD_SPEC.md) — **Coding agent reference**: tech stack, non-negotiables, screen-by-screen build spec

## Marketing, SEO, and Public Site
- [MARKETING_PLAN.md](MARKETING_PLAN.md) — Growth strategy, site IA, homepage content blueprint, SEO roadmap
- [PUBLIC_SITE_QA_CHECKLIST.md](PUBLIC_SITE_QA_CHECKLIST.md) — Repeatable QA checklist before any public-site deploy
- [launch/GO_LIVE_CHECKLIST.md](launch/GO_LIVE_CHECKLIST.md) — Master go-live checklist: product, engineering, infra, legal, analytics, support
- [launch/BETA_LAUNCH_CHECKLIST.md](launch/BETA_LAUNCH_CHECKLIST.md) — Narrower checklist for the current public beta flow

## Roadmap & Features
- [VINAADI_ENHANCEMENT_ROADMAP_v1.md](VINAADI_ENHANCEMENT_ROADMAP_v1.md) — Enhancement roadmap and decisions log
- [FAMILY_CHART_EXPLANATION_PLAN_v1.md](FAMILY_CHART_EXPLANATION_PLAN_v1.md) — Per-person chart explanation panel implementation plan
- [Vinaadi_Enhancement_Peyarchi_Notifications_v1.md](Vinaadi_Enhancement_Peyarchi_Notifications_v1.md) — Peyarchi (transit) notifications feature spec

## Content & Tamil Astrology Reference
- [NATCHATHIRAM_DASHA_WRITING_GUIDE.md](NATCHATHIRAM_DASHA_WRITING_GUIDE.md) — Rules and patterns for writing dasha content for all 27 nakshatrams
- [SEVVAIRAGU.MD](SEVVAIRAGU.MD) — Sevvai/Rahu dosha validation rules (Tamil-specific, includes test scenarios)
- [admin/ADMIN_FULL_IMPLEMENTATION.md](admin/ADMIN_FULL_IMPLEMENTATION.md) — Admin panel full implementation reference
