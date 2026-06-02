# Marketing Execution Tasks
**Version:** 1.0  
**Date:** 2026-06-02  
**Status:** Ready for agent execution  
**Audience:** Coding agents, product, frontend, content, SEO

---

## 1. How To Use This Document

This document is the execution layer for the marketing-site and SEO strategy.

It should be used together with:

1. `docs/SEO_GROWTH_STRATEGY_2026_06_02.md`
2. `docs/MARKETING_SITE_IA_PLAN_2026_06_02.md`
3. `docs/HOMEPAGE_CONTENT_BLUEPRINT_2026_06_02.md`
4. `docs/MARKETING_SEO_IMPLEMENTATION_ROADMAP_2026_06_02.md`

### Core rule for all tasks

- Homepage = assistant story
- Feature pages = guided use cases
- Tool pages = search capture
- App = full subscriber experience
- Preserve the current marketing visual identity
- Do not turn the public site into a generic calculator-first brand

### Agent execution rule

When executing a task from this document:

1. Read the strategy docs above first
2. Restate the task goal
3. Inspect the likely files
4. Implement only the requested task scope
5. Verify the result
6. Report follow-up tasks or blockers

---

## 2. Global Constraints

These apply to every task in this document.

1. Preserve the current marketing page design language.
2. Keep assistant-first messaging.
3. Tools support the assistant story; they do not replace it.
4. Avoid thin SEO pages.
5. Do not destabilize the app to improve marketing-site SEO.
6. If adding public pages, make them useful and substantial.
7. Public pages should be indexable only when they are ready and meaningful.

---

## 3. Task Groups

This plan is split into:

1. Technical SEO foundation
2. Homepage expansion
3. Feature-page rollout
4. Tool-page rollout
5. Trust and methodology
6. Educational content layer
7. Public-site quality and bug-fix pass

---

## 4. Technical SEO Foundation Tasks

## TASK-SEO-01: Add site-level metadata foundation

### Goal
Create a clean metadata base for the public site.

### Strategy alignment
- Supports technical SEO foundation
- Improves consistent search presentation
- Keeps public pages structurally ready for expansion

### Files to inspect
- `web/app/layout.tsx`
- `web/app/page.tsx`
- `web/next.config.mjs`

### Files likely to edit
- `web/app/layout.tsx`

### Requirements
1. Add `metadataBase`
2. Improve global metadata defaults
3. Add better Open Graph defaults
4. Add better Twitter metadata defaults if appropriate
5. Keep branding assistant-first

### Do not
1. Turn global metadata into calculator-first copy
2. Add misleading claims

### Definition of done
1. Root metadata is complete and structured
2. Public defaults are sensible
3. Metadata supports future per-page overrides

---

## TASK-SEO-02: Add robots policy

### Goal
Create a public crawling policy for the site.

### Files to inspect
- `web/app`

### Files likely to create
- `web/app/robots.ts`

### Requirements
1. Allow indexing of ready public pages
2. Avoid accidental exposure of low-value/private surfaces where appropriate
3. Include sitemap reference if applicable

### Definition of done
1. `robots.txt` is generated correctly
2. Public crawl behavior is explicit

---

## TASK-SEO-03: Add sitemap generation

### Goal
Expose all ready public pages in a sitemap.

### Files to inspect
- `web/app`

### Files likely to create
- `web/app/sitemap.ts`

### Requirements
1. Include homepage
2. Include ready public feature pages
3. Include ready public tool pages
4. Exclude private app-only routes where appropriate

### Definition of done
1. Sitemap route works
2. Only meaningful public URLs are included

---

## TASK-SEO-04: Add page-level metadata for current public pages

### Goal
Improve titles/descriptions/indexing behavior for current public pages.

### Files to inspect
- `web/app/page.tsx`
- `web/app/login/page.tsx`
- `web/app/dashboard/page.tsx`

### Files likely to edit
- `web/app/page.tsx`
- `web/app/login/page.tsx`
- `web/app/dashboard/page.tsx`

### Requirements
1. Homepage gets assistant-first metadata
2. Login gets its own metadata and likely `noindex`
3. Review whether dashboard needs explicit metadata behavior

### Definition of done
1. Public pages have deliberate metadata
2. Low-value pages are not treated like SEO targets

---

## TASK-SEO-05: Create or complete trust pages

### Goal
Replace placeholder public-site trust links with real pages.

### Files to inspect
- `web/app/page.tsx`
- any footer/nav components used by homepage

### Files likely to create
- `web/app/privacy/page.tsx`
- `web/app/terms/page.tsx`
- `web/app/methodology/page.tsx`
- optionally `web/app/about/page.tsx`

### Requirements
1. Homepage footer links must point to real pages
2. Pages should fit existing visual identity
3. Methodology page should support trust and differentiation

### Definition of done
1. No placeholder legal links remain
2. Trust pages are usable and production-worthy

---

## TASK-SEO-06: Fix current production build blockers

### Goal
Resolve issues preventing reliable production verification.

### Files to inspect
- `web/package.json`
- `web/app/**`
- any pages implicated by build output

### Requirements
1. Investigate current `npm run build` failure
2. Implement minimal correct fix
3. Re-run build verification

### Definition of done
1. Production build completes successfully
2. No new regressions are introduced

---

## 5. Homepage Expansion Tasks

## TASK-HOME-01: Rewrite homepage information hierarchy

### Goal
Make the homepage more informative and useful while preserving its current look and tone.

### Strategy alignment
- Homepage remains assistant-first
- Improves clarity without rebranding into tool-first

### Files to inspect
- `web/app/page.tsx`
- `web/app/globals.css`

### Requirements
1. Preserve visual identity
2. Strengthen assistant-first hero narrative
3. Add clearer content structure matching homepage blueprint

### Definition of done
1. Homepage better explains what Vinaadi is
2. Existing style still feels intact

---

## TASK-HOME-02: Add “How Vinaadi Helps” section

### Goal
Introduce a guided use-case section for the assistant story.

### Files likely to edit
- `web/app/page.tsx`
- `web/app/globals.css`

### Requirements
1. Add real-life capability framing
2. Keep copy concise and useful
3. Fit existing style language

### Definition of done
1. Users can quickly understand core use cases

---

## TASK-HOME-03: Add daily guidance story section

### Goal
Show the recurring subscriber value clearly.

### Requirements
1. Show daily guidance concept
2. Include best/avoid windows
3. Include dasha/transit/panchangam framing
4. Use elegant visual proof

### Definition of done
1. Homepage clearly communicates why this is more than a one-time tool

---

## TASK-HOME-04: Add family planning section

### Goal
Show the family-aware differentiator in the public narrative.

### Requirements
1. Explain family planning value
2. Show shared timing or family comparison concept
3. Keep it premium and uncluttered

### Definition of done
1. Family-aware differentiation is visible on homepage

---

## TASK-HOME-05: Add tool preview section

### Goal
Preview tools as part of the assistant ecosystem.

### Requirements
1. Preview Porutham
2. Preview Panchangam
3. Preview Jadhagam generator
4. Preview Rectification
5. Keep assistant as the framing layer

### Definition of done
1. Tools are visible
2. Tools do not overpower the assistant story

---

## TASK-HOME-06: Add trust/method section

### Goal
Increase trust with method clarity.

### Requirements
1. Mention Thirukanitham
2. Mention Lahiri ayanamsa
3. Mention multi-signal guidance logic
4. Reinforce calm-language philosophy

### Definition of done
1. Homepage has a credible trust section

---

## TASK-HOME-07: Add internal-linking section to feature/tool pages

### Goal
Guide visitors deeper into the public site.

### Requirements
1. Link to future feature pages
2. Link to future tool pages
3. Fit naturally within homepage

### Definition of done
1. Homepage acts as a hub, not a dead end

---

## 6. Feature-Page Rollout Tasks

## TASK-FEAT-01: Create Daily Guidance feature page

### Goal
Build the first assistant-aligned feature page.

### Suggested route
- `web/app/features/daily-guidance/page.tsx`

### Requirements
1. Explain daily guidance clearly
2. Show how chart, dasha, transits, and panchangam combine
3. Use existing visual language
4. Include CTA into app

### Definition of done
1. Page is useful, substantial, and assistant-first

---

## TASK-FEAT-02: Create Family Planning feature page

### Goal
Build a page around shared planning and family context.

### Suggested route
- `web/app/features/family-planning/page.tsx`

### Requirements
1. Explain family value proposition
2. Show shared timing / member context
3. Support app conversion

### Definition of done
1. Family use case is clear and differentiated

---

## TASK-FEAT-03: Create Chart Guidance feature page

### Goal
Explain chart interpretation as part of the assistant.

### Suggested route
- `web/app/features/chart-guidance/page.tsx`

### Requirements
1. Explain what users can understand from chart guidance
2. Avoid turning page into only a chart generator page

### Definition of done
1. The page supports assistant positioning, not tool-only perception

---

## TASK-FEAT-04: Create Timing and Decisions feature page

### Goal
Explain the planning and decision-support capability.

### Suggested route
- `web/app/features/timing-and-decisions/page.tsx`

### Requirements
1. Explain timing guidance
2. Explain best/avoid windows
3. Explain decision support

### Definition of done
1. Page helps users understand practical planning value

---

## 7. Tool-Page Rollout Tasks

## TASK-TOOL-01: Create Marriage Porutham public page

### Goal
Launch a useful public search-entry page for Porutham.

### Suggested route
- `web/app/tools/marriage-porutham-calculator/page.tsx`

### Requirements
1. Strong search-intent title
2. Useful explanatory content
3. Sample or preview structure
4. Assistant CTA
5. Fit existing visual language

### Definition of done
1. Page is valuable on its own
2. Page supports assistant brand

---

## TASK-TOOL-02: Create Jadhagam Generator public page

### Goal
Launch a useful chart-generation search-entry page.

### Suggested route
- `web/app/tools/jadhagam-generator/page.tsx`

### Requirements
1. Explain what jadhagam generation is
2. Show sample output or preview
3. Link to chart-related feature story
4. Support app conversion

### Definition of done
1. Page is helpful and clear

---

## TASK-TOOL-03: Create Daily Panchangam Planner public page

### Goal
Launch a public page for panchangam/planning intent.

### Suggested route
- `web/app/tools/daily-panchangam-planner/page.tsx`

### Requirements
1. Explain panchangam for planning
2. Connect it to daily guidance
3. Avoid presenting it as disconnected utility

### Definition of done
1. Page captures tool intent while strengthening assistant positioning

---

## TASK-TOOL-04: Create Birth Time Rectification public page

### Goal
Launch a public page for rectification intent.

### Suggested route
- `web/app/tools/birth-time-rectification/page.tsx`

### Requirements
1. Explain why birth time matters
2. Explain how Vinaadi approaches rectification
3. Keep expectations realistic

### Definition of done
1. Page is useful, credible, and not overclaiming

---

## 8. Trust and Method Tasks

## TASK-TRUST-01: Create Methodology page

### Goal
Explain the calculation and interpretation basis.

### Suggested route
- `web/app/trust/methodology/page.tsx`

### Requirements
1. Explain Thirukanitham
2. Explain Lahiri ayanamsa
3. Explain multi-signal reading approach
4. Explain calm interpretation philosophy

### Definition of done
1. Method page is credible and readable

---

## TASK-TRUST-02: Create About page

### Goal
Humanize the brand and explain the product intent.

### Suggested route
- `web/app/trust/about-vinaadi/page.tsx`

### Requirements
1. Explain what Vinaadi is trying to do
2. Reinforce assistant-first identity

### Definition of done
1. Public brand story feels complete

---

## 9. Educational Content Tasks

## TASK-LEARN-01: Create first learn-page template

### Goal
Establish a reusable structure for educational pages.

### Suggested route
- `web/app/learn/[slug]/page.tsx` or individual static pages, depending on approach

### Requirements
1. Consistent structure
2. Links to related feature/tool pages
3. Useful content sections

### Definition of done
1. Learn pages can be rolled out consistently

---

## TASK-LEARN-02: Publish “What is Porutham?”

### Goal
Support Porutham tool page and topical authority.

### Definition of done
1. Page is informative and internally linked properly

---

## TASK-LEARN-03: Publish “What is Thirukanitham?”

### Goal
Support trust and methodology understanding.

### Definition of done
1. Page strengthens credibility

---

## TASK-LEARN-04: Publish “What is Chandrashtama?”

### Goal
Support daily guidance and search education.

### Definition of done
1. Page explains concept clearly without fear tone

---

## TASK-LEARN-05: Publish “How to read a Jadhagam”

### Goal
Support chart guidance and jadhagam generator pages.

### Definition of done
1. Page is beginner-friendly and useful

---

## TASK-LEARN-06: Publish “Why birth time matters”

### Goal
Support rectification and chart credibility.

### Definition of done
1. Page is practical and conversion-supportive

---

## 10. Public-Site Quality and Bug-Fix Tasks

## TASK-QUAL-01: Fix placeholder or broken public links

### Goal
Improve trust and site completeness.

### Requirements
1. Audit homepage/footer/nav links
2. Replace placeholders with real pages or valid temporary destinations

### Definition of done
1. No obvious broken public links remain

---

## TASK-QUAL-02: Audit public-page responsiveness after expansion

### Goal
Keep the current polished experience across devices.

### Requirements
1. Review homepage and new public pages on mobile
2. Review desktop composition
3. Ensure no section feels cramped or generic

### Definition of done
1. Public pages remain strong visually on both mobile and desktop

---

## TASK-QUAL-03: Audit public-page performance after expansion

### Goal
Avoid regressions while adding content richness.

### Requirements
1. Review image usage
2. Review font loading
3. Review unnecessary client-side code on public pages

### Definition of done
1. Public pages stay reasonably performant

---

## TASK-QUAL-04: Add public-page QA checklist

### Goal
Create a repeatable QA process for public-site launches.

### Requirements
1. Metadata present
2. Canonical present
3. Links valid
4. Mobile layout valid
5. CTA paths valid
6. No placeholder copy

### Definition of done
1. A simple public-site QA list exists and is reusable

---

## 11. Suggested Execution Order

Agents should generally execute tasks in this order:

1. `TASK-SEO-06`
2. `TASK-SEO-01`
3. `TASK-SEO-02`
4. `TASK-SEO-03`
5. `TASK-SEO-04`
6. `TASK-SEO-05`
7. `TASK-HOME-01` through `TASK-HOME-07`
8. `TASK-FEAT-01` and `TASK-FEAT-02`
9. `TASK-TOOL-01` through `TASK-TOOL-03`
10. `TASK-TRUST-01` and `TASK-TRUST-02`
11. `TASK-LEARN-*`
12. `TASK-QUAL-*`

---

## 12. Prompting Guidance for Agents

When assigning a task, use this pattern:

```text
Read and follow:
- docs/SEO_GROWTH_STRATEGY_2026_06_02.md
- docs/MARKETING_SITE_IA_PLAN_2026_06_02.md
- docs/HOMEPAGE_CONTENT_BLUEPRINT_2026_06_02.md
- docs/MARKETING_SEO_IMPLEMENTATION_ROADMAP_2026_06_02.md
- docs/MARKETING_EXECUTION_TASKS_2026_06_02.md

Execute:
- TASK-XXXX

Rules:
- assistant-first, not tool-first
- preserve current marketing visual identity
- tools support the assistant story
- avoid thin SEO pages
- keep app subscriber experience intact unless task explicitly requires changes
```

---

## 13. Success Condition For This Document

This document succeeds if an agent can:

1. pick a task by ID
2. understand the goal quickly
3. identify likely files
4. execute with correct strategic alignment
5. avoid drifting into the wrong product story
