# docs/ Index — Vinaadi AI

Quick map to the right document for each purpose.

## Start Here
- [README.md](../README.md) — Project setup, virtualenv, database, running tests
- [AGENT_INSTRUCTIONS.md](AGENT_INSTRUCTIONS.md) — **Single canonical reference** for any agent/Claude working on this codebase: stack map, mandatory astrology/coding rules, Tamil astrology + cultural rules, content tone rules, UI/UX rules, anti-patterns, file/test/doc reference

## Canonical Specifications (source of truth — do not modify lightly)
- [Jothidam_AI_Product_Specification_v7_FULL_Master_Build_Thirukanitham_2026.md](Jothidam_AI_Product_Specification_v7_FULL_Master_Build_Thirukanitham_2026.md) — **Master product spec** (234K): full feature list, business logic, user flows
- [Jothidam_AI_Formula_Engine_Specification_v1_Thirukanitham_2026.md](Jothidam_AI_Formula_Engine_Specification_v1_Thirukanitham_2026.md) — **Calculation formulas** (48K): Lahiri ayanamsa, dasha, divisional charts, dosha rules — source of truth for all astrology math
- [Jothidam_AI_Technical_API_Database_Spec_v1_Thirukanitham_2026.md](Jothidam_AI_Technical_API_Database_Spec_v1_Thirukanitham_2026.md) — API endpoints, request/response schemas, PostgreSQL schema
- [Jothidam_AI_QA_Golden_Test_Cases_v1_Thirukanitham_2026.md](Jothidam_AI_QA_Golden_Test_Cases_v1_Thirukanitham_2026.md) — QA golden test case definitions, verify calculation output against known-correct values

## Implementation
- [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) — **Start here for any new work**: non-negotiable rules, MVP scope, stack context, all implementation phases (P1 calc fixes → P6 reports), UX features, run commands

## Frontend
- [FRONTEND.md](FRONTEND.md) — Current UI status, missing features with endpoint/response shapes, UI/UX backlog, upcoming features (Porutham, PDF, push notifications)

## Marketing, SEO, and Public Site
- [MARKETING_PLAN.md](MARKETING_PLAN.md) — Consolidated marketing & SEO plan: growth strategy, site IA, homepage content blueprint, SEO implementation roadmap, and execution tasks (merged from the five 2026-06-02 marketing docs)
- [PUBLIC_SITE_QA_CHECKLIST.md](PUBLIC_SITE_QA_CHECKLIST.md) — Repeatable QA checklist to run before deploying any public-site change

## Roadmap
- [VINAADI_ENHANCEMENT_ROADMAP_v1.md](VINAADI_ENHANCEMENT_ROADMAP_v1.md) — Forward enhancement roadmap, decisions log (referenced by AGENT_INSTRUCTIONS)

## Tamil Astrology Reference
- [SEVVAIRAGU.MD](SEVVAIRAGU.MD) — Sevvai/Rahu dosha validation rules (Tamil-specific, includes test scenarios)
- [Vinaadi_Enhancement_Peyarchi_Notifications_v1.md](Vinaadi_Enhancement_Peyarchi_Notifications_v1.md) — Peyarchi (transit) notifications feature spec
