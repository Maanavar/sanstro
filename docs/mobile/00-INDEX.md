# Vinaadi AI Mobile — Documentation Index

This folder is the **single home** for mobile specification & reference. Read top to bottom.

## Source-of-truth map (avoid duplication / drift)

| Topic | Authoritative doc | Don't redefine elsewhere |
|-------|-------------------|--------------------------|
| Business/product decisions, scope, GTM | `MOBILE_DECISIONS.md` (this folder) | timelines, tiers, pricing |
| Market & competitors | `01-market-competitive-analysis.md` | |
| Users, journeys, JTBD | `02-personas-journeys.md` | |
| Money model & unit economics | `03-monetization-unit-economics.md` | pricing numbers |
| Requirements (what to build) | `04-prd.md` | functional/non-functional reqs |
| Navigation, IA, flows | `05-ia-navigation-flows.md` | tab structure |
| Screen-by-screen build spec | `06-screen-spec-phase-a.md` | screen layouts, states |
| Visual/UX system | `07-design-system.md` | tokens, type, components |
| API contract for mobile | `08-api-contract.md` | endpoints, payloads |
| Metrics & event taxonomy | `09-analytics-kpis.md` | KPI definitions, events |
| Risks | `10-risk-register.md` | |

The authoritative docs for all mobile decisions, design, and build spec live in this folder (`MOBILE_DECISIONS.md`, `MOBILE_DESIGN_BRIEF.md`, `MOBILE_BUILD_SPEC.md`). No other planning docs exist at repo root.

## The 60-second summary

- **Product:** Tamil-first daily astrology companion. Owns the user's morning (panchangam +
  rasi palan), converts the habit into personalized birth-chart guidance.
- **Access model:** no login wall. Guest gets instant value and light ads; free account
  unlocks birth-chart personalization; premium/paid reports unlock depth.
- **Build order:** Phase A guest habit app → Phase B accounts+personalization → Phase C money depth.
- **Money:** ads are a *floor*; real revenue = paid reports → subscription → devotional
  commerce → (later) astrologer consults.
- **Huge head start:** `/public/*` API already serves guest chart/porutham/panchangam/muhurta
  with no auth. Main backend gaps: mobile auth tokens, refresh, device-token table, a
  **public daily rasi-palan endpoint**.

## Build readiness gates

- [ ] Decisions approved (`/MOBILE_DECISIONS.md`)
- [ ] PRD signed off (`04-prd.md`)
- [ ] API contract + backend gap tickets created (`08-api-contract.md`)
- [ ] Design system tokens implemented (`07-design-system.md`)
- [ ] Phase A screens estimated (`06-screen-spec-phase-a.md`)
