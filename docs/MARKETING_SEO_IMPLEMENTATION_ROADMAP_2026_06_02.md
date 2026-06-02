# Marketing SEO Implementation Roadmap
**Version:** 1.0  
**Date:** 2026-06-02  
**Status:** Ready for phased execution  
**Audience:** Product, engineering, design, content

---

## 1. Goal

This roadmap translates the assistant-first marketing strategy into concrete implementation phases.

It assumes:

- the current app architecture stays largely intact
- the current homepage visual identity is preserved
- the public site expands in content, structure, and SEO quality
- bug fixes and technical cleanup happen alongside marketing-site work

---

## 2. Outcomes We Want

1. Better discoverability in Google
2. Stronger explanation of the product
3. More useful marketing pages
4. Search entry points through tool and concept pages
5. Better conversion into the subscriber experience

---

## 3. Workstreams

There are five workstreams:

1. Technical SEO
2. Homepage expansion
3. Feature-page rollout
4. Tool-page rollout
5. Quality / bug-fix / trust pass

---

## 4. Phase Plan

## Phase 0: Audit lock and strategy alignment

### Goal
Freeze the public-site direction before implementation.

### Deliverables

- IA doc
- homepage blueprint
- implementation roadmap

### Status
Ready

---

## Phase 1: Technical SEO and quality foundation

### Goal
Fix the underlying public-site SEO and quality gaps before scaling content.

### Engineering tasks

1. Add `robots.txt`
2. Add sitemap generation
3. Add page-level metadata
4. Add canonical URL support
5. Add `metadataBase`
6. Add Open Graph and Twitter metadata
7. Add `noindex` where needed:
   - login
   - private or low-value routes
8. Fix placeholder links:
   - privacy
   - terms
9. Fix current production build issue
10. Review duplicate font loading and general page weight

### Content/product tasks

1. Define site title patterns
2. Define meta description patterns
3. Define trust-page copy requirements

### Success criteria

- public pages are crawlable and indexable correctly
- low-value pages are controlled correctly
- build is stable
- trust basics are in place

---

## Phase 2: Homepage expansion in current style

### Goal
Make the marketing page more informative and useful without changing its brand feel.

### Keep

- current palette
- current typography
- current layout rhythm
- current premium calm tone

### Add

1. stronger assistant narrative
2. richer product-preview content
3. guidance use-case sections
4. family-planning section
5. tool preview section
6. trust/method section
7. feature discovery section

### Design tasks

1. define section modules in existing visual language
2. design preview cards for:
   - daily guidance
   - family planning
   - porutham
   - panchangam
   - jadhagam
3. define internal link placements

### Content tasks

1. write assistant-first hero copy
2. write use-case section copy
3. write trust/method copy
4. write final CTA copy

### Engineering tasks

1. implement expanded homepage sections
2. keep responsiveness clean on mobile and desktop
3. preserve performance while increasing content depth

### Success criteria

- homepage explains product clearly
- homepage remains visually strong
- homepage sends users into feature and tool paths

---

## Phase 3: First-wave feature pages

### Goal
Create commercial-explanatory pages that mirror the app's real product philosophy.

### First-wave pages

1. Daily Guidance
2. Family Planning
3. Chart Guidance
4. Timing and Decisions

### Each page should include

1. clear H1
2. problem/use-case framing
3. how Vinaadi helps
4. sample outputs or previews
5. links to app and related pages
6. trust/method references

### Why these come before some tool pages

They reinforce the assistant story and protect the brand from becoming tool-only in the eyes of new visitors.

### Success criteria

- assistant story becomes clearer across the site
- internal linking improves
- visitors understand the product beyond the homepage

---

## Phase 4: First-wave tool pages

### Goal
Capture search demand through useful public tools and tool-explainer pages.

### First-wave pages

1. Marriage Porutham Calculator
2. Jadhagam Generator
3. Daily Panchangam Planner

### Second-wave tool page

4. Birth Time Rectification

### Each tool page should include

1. query-matching title
2. short explanation
3. why it matters
4. sample result or preview
5. method/trust section
6. assistant CTA
7. links to related educational pages

### Quality rule
Tool pages must provide standalone value.

They must not be thin doorway pages.

### Success criteria

- tool pages are indexable and useful
- tool pages support, not replace, the assistant brand
- organic search entry improves

---

## Phase 5: Trust and methodology layer

### Goal
Strengthen authority and conversion.

### Pages to complete

1. Methodology
2. Privacy Policy
3. Terms of Service
4. About Vinaadi

### Methodology page should explain

1. Thirukanitham basis
2. Lahiri ayanamsa
3. chart + dasha + transit + panchangam integration
4. interpretation philosophy
5. calm-language positioning

### Success criteria

- trust objections are reduced
- premium feel is reinforced
- public site looks complete and credible

---

## Phase 6: Educational content cluster

### Goal
Build topical depth around the assistant and tools.

### First articles

1. What is Porutham?
2. What is Thirukanitham?
3. What is Chandrashtama?
4. How to read a Jadhagam
5. Why birth time matters
6. What is Vimshottari Dasha?

### Editorial rule
Every article must:

1. teach something real
2. link to a relevant feature page
3. link to a relevant tool page
4. reinforce Vinaadi's assistant identity

### Success criteria

- stronger internal linking
- higher topical coverage
- more informative public site

---

## Phase 7: App-adjacent SEO and quality pass

### Goal
Keep the full app experience intact while cleaning up public-facing quality issues.

### Scope

1. metadata corrections
2. public-route polish
3. selective `noindex`
4. bug fixes affecting trust or performance
5. rendering stability improvements

### Important note
The goal is not to make `/dashboard` rank.

The goal is to ensure the broader web experience is technically strong and consistent.

---

## 5. Recommended Execution Order

1. Technical SEO foundation
2. Homepage expansion
3. Trust pages
4. Daily Guidance feature page
5. Family Planning feature page
6. Porutham tool page
7. Jadhagam tool page
8. Panchangam tool page
9. Educational cluster
10. App-adjacent cleanup and refinements

---

## 6. Team Responsibilities

## Product

- approve IA
- approve page priority
- approve assistant-first messaging hierarchy

## Design

- evolve homepage within current visual language
- define preview graphics and new section modules
- maintain premium calm aesthetic

## Content

- write homepage copy
- write feature-page copy
- write tool-page explanatory copy
- write trust/method pages
- write educational content

## Engineering

- implement technical SEO foundation
- build new public pages
- preserve performance and responsiveness
- fix quality issues and bugs

---

## 7. Risks to Avoid

1. Turning Vinaadi into a calculator-first public brand
2. Creating thin tool pages with little value
3. Breaking the current strong visual identity
4. Expanding content without fixing technical SEO first
5. Letting public-site work destabilize the app

---

## 8. Definition of Success

This roadmap succeeds if:

1. the public site becomes more useful and more discoverable
2. visitors understand Vinaadi as an assistant/guide
3. tool pages bring relevant search traffic
4. feature pages help conversion into the app
5. the app remains the full premium subscriber experience

---

## 9. Immediate Next Actions

1. Approve the three strategy docs
2. Freeze page priority for phase 1 and phase 2
3. Draft homepage copy
4. Draft first-wave page wireframes
5. Start technical SEO implementation
