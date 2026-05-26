# docs/ Index — Vinaadi AI

Quick map to the right document for each purpose.

## Start Here
- [README.md](../README.md) — Project setup, virtualenv, database, running tests
- [AGENT_INSTRUCTIONS.md](AGENT_INSTRUCTIONS.md) — Mandatory rules for any agent/Claude working on this codebase

## Canonical Specifications (source of truth — do not modify lightly)
- [Jothidam_AI_Product_Specification_v7_FULL_Master_Build_Thirukanitham_2026.md](Jothidam_AI_Product_Specification_v7_FULL_Master_Build_Thirukanitham_2026.md) — **Master product spec** (234K): full feature list, business logic, user flows
- [Jothidam_AI_Formula_Engine_Specification_v1_Thirukanitham_2026.md](Jothidam_AI_Formula_Engine_Specification_v1_Thirukanitham_2026.md) — **Calculation formulas** (48K): Lahiri ayanamsa, dasha, divisional charts, dosha rules — source of truth for all astrology math
- [Jothidam_AI_Technical_API_Database_Spec_v1_Thirukanitham_2026.md](Jothidam_AI_Technical_API_Database_Spec_v1_Thirukanitham_2026.md) — API endpoints, request/response schemas, PostgreSQL schema

## Implementation
- [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) — **Start here for any new work**: non-negotiable rules, MVP scope, stack context, all implementation phases (P1 calc fixes → P6 reports), UX features, run commands

## Audit & QA
- [AUDIT_AND_QA.md](AUDIT_AND_QA.md) — Engine audit scores, full calculation checklist, all known bugs with file/line references, sprint work order, validation scenarios, test plan

## Frontend
- [FRONTEND.md](FRONTEND.md) — Current UI status, 8 missing features with endpoint/response shapes, UI/UX backlog, upcoming features (Porutham, PDF, push notifications)

## Tamil Astrology Reference
- [SEVVAIRAGU.MD](SEVVAIRAGU.MD) — Sevvai/Rahu dosha validation rules (Tamil-specific, includes test scenarios)
- [Vinaadi_Enhancement_Peyarchi_Notifications_v1.md](Vinaadi_Enhancement_Peyarchi_Notifications_v1.md) — Peyarchi (transit) notifications feature spec

## Enhancement Reference
- [Vinaadi_AI_Enhancement_and_Bug_Fix_Instructions_v1.md](Vinaadi_AI_Enhancement_and_Bug_Fix_Instructions_v1.md) — Detailed enhancement and bug fix guide (104K) — large reference, check IMPLEMENTATION_GUIDE.md first
- [Jothidam_AI_QA_Golden_Test_Cases_v1_Thirukanitham_2026.md](Jothidam_AI_QA_Golden_Test_Cases_v1_Thirukanitham_2026.md) — QA golden test case definitions
