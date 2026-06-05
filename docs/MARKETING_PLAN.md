# Marketing & SEO Plan — Vinaadi AI

_Consolidated 2026-06-05 from five 2026-06-02 marketing docs (SEO strategy, site IA, homepage blueprint, SEO implementation roadmap, execution tasks). Content preserved verbatim under the sections below._

## Contents

1. [SEO & Growth Strategy](#1-seo--growth-strategy)
2. [Marketing Site IA Plan](#2-marketing-site-ia-plan)
3. [Homepage Content Blueprint](#3-homepage-content-blueprint)
4. [Marketing & SEO Implementation Roadmap](#4-marketing--seo-implementation-roadmap)
5. [Marketing Execution Tasks](#5-marketing-execution-tasks)

---

## 1. SEO & Growth Strategy

# Vinaadi SEO Growth Strategy
**Date:** 2026-06-02  
**Author:** Codex  
**Audience:** Founder / Product Owner / Growth / Engineering  
**Status:** Recommended execution plan

---

## Executive Summary

Vinaadi does not mainly have a metadata problem. It has a **search-surface problem**.

Today, the product's strongest value lives inside authenticated or client-heavy app flows, while search engines mostly see a single public landing page. That means the business is underexposed for the exact categories users are already searching for:

- Tamil astrology
- Porutham / marriage matching
- Birth chart generation
- Dasha interpretation
- Daily panchangam guidance
- Birth time rectification

If I were the product owner, I would treat SEO as a **product distribution system**, not a content side-project.

The strategy is simple:

1. Fix technical crawl/index basics.
2. Turn the strongest tools into public landing pages.
3. Build a tight educational cluster around those tools.
4. Measure signups and activation from each page.
5. Expand only after the first wedge proves traction.

---

## Core Thesis

**Do not try to rank the app. Rank the use cases.**

Users are not searching for:

- "dashboard"
- "daily calm planning interface"
- "login page"

They are searching for:

- "porutham calculator"
- "Tamil birth chart generator"
- "daily jyotish app"
- "vimshottari dasha calculator"
- "chandrashtama meaning"
- "thirukanitham astrology"

The acquisition layer must match search intent directly.

---

## Strategic Positioning

### Category
Vinaadi should position itself as:

**Precise Tamil astrology for real daily decisions**

### Differentiation
This should be repeated across every public page:

- Tamil astrology, not generic horoscope content
- Thirukanitham precision
- Useful for real decisions, not passive entertainment
- Family-aware planning
- Transparent reasoning, not fear-based predictions

### Positioning Line
Recommended core message:

**Vinaadi brings Thirukanitham-based Tamil astrology into a modern planning tool for daily guidance, porutham, charts, and family decisions.**

---

## What To Prioritize First

### Primary wedge
Launch and rank around:

1. `Porutham`
2. `Birth chart generation`
3. `Daily jyotish guidance`

This is the best balance of:

- search intent
- product differentiation
- user conversion potential

### Why this wedge first

#### Porutham
- High intent
- Clear problem/solution fit
- Easy to explain
- Strong cultural fit
- Naturally shareable

#### Birth chart generator
- Large search demand
- Great product-led acquisition entry
- Can drive signup after output or export

#### Daily guidance
- Strong retention narrative
- Supports subscription positioning
- Differentiates Vinaadi from one-time calculators

---

## What I Would Ship

### Public pages to launch first

#### Tier 1: Ship first
- `/porutham-calculator`
- `/birth-chart-calculator`
- `/tamil-astrology-app`

#### Tier 2: Ship next
- `/birth-time-rectification`
- `/dasha-calculator`
- `/thirukanitham-method`
- `/daily-panchangam-planner`

#### Tier 3: Expand after traction
- `/varshaphala-reading`
- `/prasna`
- `/astrology-remedies`
- `/family-astrology`
- `/south-indian-chart-guide`

---

## Page Strategy

Each public page should follow the same conversion structure:

1. Clear query-matching headline
2. One-sentence value proposition
3. Interactive preview or sample result
4. Trust section
5. "How it works"
6. FAQ
7. Primary CTA
8. Internal links to related pages

### Example: Porutham page

#### Purpose
Capture search demand around compatibility and marriage matching.

#### H1 direction
**Tamil Porutham Calculator for Marriage Matching**

#### Supporting sections
- What porutham means
- What Vinaadi checks
- Kuta / dosha coverage
- Why Tamil users need Thirukanitham-aware matching
- Sample result preview
- FAQ: Rajju, Vedha, Yoni, Nadi, Dinam

#### CTA
- Check compatibility
- Save result
- Create family vault

### Example: Birth chart page

#### Purpose
Capture chart generator intent and move users into signup.

#### H1 direction
**Generate a South Indian Tamil Birth Chart Online**

#### Supporting sections
- Enter date, time, place
- D1 and D9 output
- Thirukanitham method
- Printable jathagam preview
- FAQ on accuracy and ayanamsa

#### CTA
- Generate chart
- Print jathagam
- Save profile

### Example: Daily guidance page

#### Purpose
Own the "daily usefulness" positioning.

#### H1 direction
**Daily Tamil Jyotish Guidance for Planning Your Day**

#### Supporting sections
- Best window
- Avoid window
- Dasha + transit reasoning
- Panchangam context
- Family planning angle

#### CTA
- See today's reading
- Try sample guidance
- Start free

---

## Content Moat

### The role of content
Content should not be generic blog filler. It should directly support:

- query capture
- trust building
- product conversion

### First content cluster

#### Porutham cluster
- What is porutham in Tamil astrology?
- How many poruthams matter in marriage matching?
- What is Rajju dosham?
- What is Vedha porutham?
- How to read porutham results

#### Birth chart cluster
- How to read a South Indian chart
- What is lagna?
- What is navamsa?
- Why birth time matters
- What is Lahiri ayanamsa?

#### Daily guidance cluster
- What is Chandrashtama?
- What is Peyarchi?
- How dasha affects daily guidance
- Panchangam for planning important days
- Astrology guidance vs fear-based prediction

### Content rule
Every article must link into a relevant tool page.

No orphan educational content.

---

## Technical SEO Priorities

### Immediate fixes
- Add `robots.txt`
- Add `sitemap.xml`
- Add canonical URLs
- Add `metadataBase`
- Add page-level titles and descriptions
- Add `noindex` on `/login` and any low-value/private pages
- Create real `privacy`, `terms`, and `methodology` pages
- Fix the production build failure before rollout

### Structured data to add
- `Organization`
- `WebSite`
- `SoftwareApplication`
- `FAQPage`
- `BreadcrumbList`

### Performance priorities
- Remove duplicate font loading patterns
- Keep public landing pages mostly server-rendered
- Keep interactive tools lightweight above the fold
- Optimize for good Core Web Vitals before scaling content

---

## Language Strategy

This needs an explicit owner decision.

### Option A: English-first SEO, Tamil in UX
Best for faster execution.

#### Benefits
- Faster rollout
- Broader addressable search volume
- Lower implementation complexity

#### Tradeoff
- Weaker Tamil-language search moat initially

### Option B: True bilingual SEO with separate URLs
Best for long-term defensibility.

#### Benefits
- Better Tamil search relevance
- Better multilingual clarity
- Stronger `hreflang` strategy

#### Tradeoff
- More engineering and content work

### Recommendation

#### Phase 1
Use **English-first public pages** with strong Tamil context in copy.

#### Phase 2
Expand to dedicated `/ta/...` and `/en/...` page variants with `hreflang`.

---

## Conversion Strategy

SEO traffic is not the goal by itself.

The real funnel is:

1. Query
2. Landing page
3. Tool interaction
4. Signup
5. Activation
6. Retention

### Conversion principles
- Public pages should offer useful value before signup
- Saving, exporting, family vaults, and personalization can be gated
- Use sample outputs generously
- Do not force users to imagine the result

### Good gating model
- View sample or limited result for free
- Sign up to save, compare, export, or revisit

---

## What I Would Not Do

- I would not spend major effort optimizing `/login`
- I would not expect `/dashboard` to be a search asset
- I would not chase broad "astrology app" rankings first
- I would not publish thin AI-generated articles at scale
- I would not create dozens of pages before 3 pages prove traction

---

## 30 / 60 / 90 Day Plan

## Day 0-30: Fix foundations and launch first wedge

### Product and engineering
- Fix production build issue
- Implement `robots.txt`
- Implement sitemap generation
- Add canonicals and page-level metadata
- Add `noindex` for `/login`
- Publish real legal and methodology pages

### Landing pages
- Launch `Porutham Calculator`
- Launch `Birth Chart Calculator`
- Refresh homepage around search-intent language

### Content
- Publish:
  - What is porutham?
  - How porutham works
  - How to read a Tamil birth chart
  - Why birth time matters
  - What is Thirukanitham?

### Measurement
- Set up Search Console
- Submit sitemap
- Baseline:
  - branded impressions
  - non-branded impressions
  - CTR
  - signups from each landing page

### Success criteria
- Public pages indexed
- Early impression growth for non-brand queries
- Tool pages converting better than homepage-only traffic

---

## Day 31-60: Build authority and tighten conversion

### Landing pages
- Launch `Daily Tamil Jyotish Guidance`
- Launch `Birth Time Rectification`
- Launch `Dasha Calculator`

### Content
- Publish:
  - Chandrashtama explainer
  - Peyarchi explainer
  - Vimshottari dasha explainer
  - Navamsa explainer
  - Rajju and Vedha dosha explainers

### Conversion
- Add sample output previews to landing pages
- Add stronger CTA paths from content pages into tools
- Add internal linking between cluster pages

### Measurement
- Track which pages bring:
  - highest CTR
  - best signup rate
  - best activation rate

### Success criteria
- One page breaks out as the strongest acquisition entry
- Non-branded organic traffic becomes visible and directional

---

## Day 61-90: Double down on winners

### Expansion
- Build out bilingual URL strategy if early demand supports it
- Launch secondary pages:
  - Varshaphala
  - Prasna
  - Remedies
  - Family astrology

### Brand authority
- Publish a strong methodology page:
  - Thirukanitham
  - Lahiri ayanamsa
  - house system
  - dasha logic
  - how guidance is framed

### Growth optimization
- Build comparison pages if useful:
  - Vinaadi vs generic horoscope apps
  - Tamil astrology vs generalized astrology apps

### Success criteria
- Clear organic acquisition loop
- At least 2 landing pages with repeat search growth
- Clear SEO-to-activation reporting

---

## Owner Decisions Needed

### Decision 1: Primary language motion
Choose:
- English-first now
- Bilingual URL strategy now

### Decision 2: Public tool exposure
Choose:
- fully public tool previews
- partially gated tools

### Decision 3: First wedge
Choose:
- Porutham first
- Birth chart first
- Daily guidance first

### Recommendation
- Porutham first
- Birth chart second
- Daily guidance third

---

## Recommended Messaging Directions

### Homepage
**Tamil astrology for daily planning, porutham, and precise chart guidance**

### Porutham
**Marriage matching with Tamil astrology logic you can actually understand**

### Birth chart
**Generate a printable South Indian chart with Thirukanitham-based calculations**

### Daily guidance
**See today's best window, caution window, and chart-based guidance in one quiet reading**

---

## Final Recommendation

If I were the owner, I would make one hard strategic shift:

**Stop treating SEO as optimization of the existing public site.**

Instead:

**Build a public acquisition layer around the strongest product use cases.**

That is the move most likely to create:

- search visibility
- compounding authority
- product-qualified traffic
- better signup conversion
- long-term moat

Vinaadi already has differentiated product depth. The next step is to make that depth visible to search.


---

## 2. Marketing Site IA Plan

# Vinaadi Marketing Site IA Plan
**Version:** 1.0  
**Date:** 2026-06-02  
**Status:** Approved direction for planning and implementation  
**Audience:** Product, design, content, frontend, SEO

---

## 1. Purpose

This document defines the information architecture for the public-facing Vinaadi marketing site.

It aligns the site with the product truth:

- **Homepage** = assistant story
- **Feature pages** = guided use cases
- **Tool pages** = search capture
- **App** = full subscriber experience

This is the governing rule for all future marketing-site work.

---

## 2. Strategic Principle

Vinaadi should not be marketed as a loose collection of astrology calculators.

Vinaadi should be presented as:

**a Tamil astrology assistant and guide that also includes powerful tools when the user needs them**

That means:

- assistant identity comes first
- tools support the assistant story
- the app remains the premium subscriber destination
- public pages help discovery, education, and conversion

---

## 3. Site Architecture

## 3.1 Top-level structure

### Core public surfaces

1. Homepage
2. Feature pages
3. Tool pages
4. Trust / methodology pages
5. Educational content pages

### Private product surface

1. App
2. Dashboard
3. Logged-in tools and personalized guidance

---

## 3.2 Hierarchy map

```text
/
  Homepage: assistant story

/features/
  daily-guidance
  family-planning
  chart-guidance
  dasha-and-transits
  timing-and-decisions
  life-areas

/tools/
  marriage-porutham-calculator
  jadhagam-generator
  daily-panchangam-planner
  birth-time-rectification
  dasha-calculator
  remedies

/learn/
  what-is-porutham
  what-is-thirukanitham
  what-is-chandrashtama
  how-to-read-a-jadhagam
  what-is-vimshottari-dasha
  why-birth-time-matters

/trust/
  methodology
  privacy-policy
  terms-of-service
  about-vinaadi

/login
/dashboard
```

---

## 4. Public Page Roles

## 4.1 Homepage

### Role
The homepage is the brand and product story.

### It must answer

- What is Vinaadi?
- Who is it for?
- Why is it different?
- How does it help daily life?
- What can I do inside it?

### It must not become

- a generic calculator landing page
- a thin SEO page
- a feature dump with no narrative

---

## 4.2 Feature pages

### Role
Feature pages explain the assistant through real use cases.

These are commercial-explanatory pages, not just SEO targets.

### Their job

- explain a capability in user language
- connect guidance to daily life
- show why the subscription is valuable
- deepen trust and conversion

### First-wave feature pages

1. `daily-guidance`
2. `family-planning`
3. `chart-guidance`
4. `dasha-and-transits`
5. `timing-and-decisions`

---

## 4.3 Tool pages

### Role
Tool pages capture high-intent search demand.

### Their job

- meet users on concrete searches
- provide real utility
- demonstrate product depth
- route users naturally into the assistant story

### Rule
Tool pages must be useful on their own.

They must not exist only to funnel traffic into the app. That would weaken both user value and SEO quality.

### First-wave tool pages

1. `marriage-porutham-calculator`
2. `jadhagam-generator`
3. `daily-panchangam-planner`
4. `birth-time-rectification`

---

## 4.4 Trust pages

### Role
Trust pages support credibility, quality, and conversion.

### Required pages

1. Methodology
2. Privacy policy
3. Terms of service
4. About Vinaadi

### Why they matter

- user trust
- search quality
- clear differentiation
- legitimacy for subscription purchase

---

## 4.5 Educational content

### Role
Educational pages build topical authority and help users understand the concepts behind the assistant and tools.

### Content themes

1. Porutham and compatibility
2. Jadhagam and chart reading
3. Panchangam and daily planning
4. Dasha and transits
5. Tamil astrology foundations

### Rule
Every educational page must link to:

- one feature page
- one tool page where relevant
- the assistant product story

---

## 5. Navigation Model

## 5.1 Primary navigation

Recommended top navigation:

1. Home
2. Features
3. Tools
4. Learn
5. Method
6. Sign in

Optional CTA:

- Start free
- Open dashboard

---

## 5.2 Homepage-to-page flow

Recommended user flow:

1. Land on homepage
2. Understand Vinaadi as assistant / guide
3. Explore guided capabilities
4. See tool previews
5. Click into relevant feature or tool page
6. Convert into app or signup

---

## 5.3 Tool-page-to-assistant flow

Recommended user flow:

1. Search for concrete tool
2. Land on useful tool page
3. Use preview or understand output
4. Discover that Vinaadi is broader than the tool
5. Convert into assistant/subscriber path

---

## 6. Brand Rules for the Public Site

## 6.1 Messaging hierarchy

Always preserve this hierarchy:

1. Vinaadi is the assistant
2. Guidance is the core value
3. Tools are supporting capabilities
4. Subscription is the full experience

---

## 6.2 Tone

The public site must match the app's strongest tone qualities:

- calm
- intelligent
- practical
- tradition-aware
- non-fatalistic
- clear and respectful

Avoid:

- sensational astrology language
- fear-based warnings
- generic horoscope style
- SEO-stuffed phrasing

---

## 6.3 Visual direction

The current marketing page visual identity should be preserved.

Keep:

- current color palette
- current typography direction
- current spacing rhythm
- current calm premium feel
- current composition style

Allowed expansions:

- richer content sections
- more product graphics
- tool preview modules
- sample result cards
- capability strips
- methodology visuals

Avoid:

- redesigning into a generic SEO landing page
- noisy card overload
- changing the visual language just to add content

---

## 7. Public Page Priority Order

## Phase A: Immediate

1. Homepage refresh
2. Daily Guidance feature page
3. Family Planning feature page
4. Methodology page

## Phase B: Search capture

1. Marriage Porutham Calculator
2. Jadhagam Generator
3. Daily Panchangam Planner

## Phase C: Expansion

1. Chart Guidance feature page
2. Dasha and Transits feature page
3. Birth Time Rectification tool page
4. Educational content cluster

---

## 8. What Stays in the App

The app remains the full subscriber environment.

Do not collapse app complexity into the marketing site.

The app should remain the home for:

- personalized readings
- daily subscriber experience
- family workspace
- member management
- deeper chart exploration
- tool completion flows
- journal, plan, and settings surfaces

Public pages should preview and explain this value, not replace it.

---

## 9. Success Criteria

This IA is working if:

1. users understand Vinaadi as an assistant, not just a calculator site
2. tool pages bring organic traffic without weakening brand positioning
3. feature pages improve conversion into signup
4. educational pages strengthen trust and internal linking
5. the app remains the premium destination

---

## 10. Non-Negotiables

1. Homepage must remain assistant-first.
2. Tool pages must remain useful and substantial.
3. Public site must preserve existing visual language.
4. The app should not be re-architected around SEO.
5. Trust, method, and legal pages must become real and complete.
6. All future marketing-site work should follow this IA unless explicitly revised.


---

## 3. Homepage Content Blueprint

# Vinaadi Homepage Content Blueprint
**Version:** 1.0  
**Date:** 2026-06-02  
**Status:** Ready for copy/design planning  
**Audience:** Product, content, design, frontend

---

## 1. Goal

This document defines the ideal structure for the Vinaadi homepage while preserving the current visual identity:

- same color world
- same typography direction
- same calm premium feel
- same overall arrangement language

The homepage should become more informative and useful without losing elegance.

---

## 2. Homepage Job

The homepage has four jobs:

1. Explain Vinaadi as a personal astrology assistant
2. Show what life problems it helps with
3. Demonstrate product depth and trust
4. Guide visitors into feature pages, tool pages, and signup

---

## 3. Core Positioning

### Primary message
**Your Tamil astrology assistant for daily guidance, timing, family planning, and clarity**

### Supporting message
Vinaadi helps you understand your chart, read the day calmly, plan with family, and use tools like porutham, panchangam, jadhagam generation, and rectification when needed.

---

## 4. Section-by-Section Homepage Plan

## Section 1: Hero

### Purpose
Immediately establish Vinaadi as an assistant, not a static horoscope site.

### Keep from current page

- current premium palette
- current fonts
- current split composition
- current product-preview energy

### Content goals

- strong assistant story
- one clear sentence on what the product does
- one strong primary CTA
- one secondary CTA

### Recommended structure

#### Eyebrow
`Tamil Astrology Assistant`

#### H1
**One calm guide for your chart, your day, and the people you plan with.**

#### Body
Vinaadi turns Thirukanitham-based astrology into daily guidance, timing windows, family planning, and tools you can actually use.

#### CTAs

- `Start with today's guidance`
- `See how Vinaadi works`

### Visual on right side

Keep a refined product preview, but evolve it beyond one static card:

- daily guidance sample
- best/avoid window
- dasha breadcrumb
- family snapshot

---

## Section 2: What Vinaadi Helps You Do

### Purpose
Translate the assistant into real-life use cases.

### Recommended module style
Elegant tiles or stacked cards in current visual language.

### Suggested capabilities

1. Understand today
2. Plan important actions
3. Read family timing together
4. Understand chart patterns
5. Check compatibility when needed
6. Use remedies and reflection calmly

### Suggested section heading
**Guidance for the moments people actually need help with**

---

## Section 3: Daily Guidance Story

### Purpose
Show the ongoing subscriber value.

This is the section that explains why Vinaadi is not just a one-time tool.

### Suggested heading
**Every day starts with one quiet reading**

### Content to show

- today's score / day tone
- best window
- caution window
- dasha and transit context
- panchangam summary
- one practical suggestion

### Visual direction

Use a polished reading card or sequence of cards that feel like the live app.

---

## Section 4: Family Planning Story

### Purpose
Introduce one of the strongest differentiators in the product.

### Suggested heading
**Plan for yourself, or for the people you share life with**

### Content to show

- family score comparison
- shared timing windows
- compatibility context
- planning together

### Why it matters

Most astrology products stop at individual readings.
This section makes Vinaadi feel more distinctive and more subscription-worthy.

---

## Section 5: Tools Inside the Assistant

### Purpose
Show that Vinaadi includes powerful tools, while keeping the assistant as the main story.

### Suggested heading
**When you need a tool, it's already part of the guide**

### Tools to preview

1. Marriage Porutham
2. Panchangam Planner
3. Jadhagam Generator
4. Birth Time Rectification

### Recommended format

Preview strip or 2x2 tool cards with:

- tool name
- one-sentence use case
- elegant preview graphic or sample result
- link to public page

### Important rule
These should feel like modules inside Vinaadi, not disconnected mini-products.

---

## Section 6: How It Works

### Purpose
Reduce mystery and increase trust.

### Suggested heading
**Traditional inputs, clear output, modern guidance**

### Suggested three-step flow

1. Add your birth details
2. Vinaadi reads chart, dasha, transits, and panchangam together
3. Get one balanced answer for the day, the decision, or the tool you need

### Optional micro-copy
Supportive, not over-explanatory.

---

## Section 7: Method and Trust

### Purpose
Give serious users confidence.

### Suggested heading
**Built on method, not vague astrology language**

### Content blocks

- Thirukanitham
- Lahiri ayanamsa
- dasha, transit, and panchangam logic
- transparent reasoning
- calm tone commitment

### Supporting line
Vinaadi is designed to help users interpret astrology thoughtfully, not fearfully.

---

## Section 8: Use Cases / Feature Links

### Purpose
Create strong internal linking into feature pages.

### Suggested cards

1. Daily Guidance
2. Family Planning
3. Chart Guidance
4. Dasha and Transit Reading
5. Timing and Decisions

### Suggested heading
**Explore the ways Vinaadi can guide you**

---

## Section 9: Learn and Understand

### Purpose
Create room for educational discovery and topical trust.

### Suggested heading
**Learn the ideas behind the guidance**

### Links to include

- What is Porutham?
- What is Thirukanitham?
- What is Chandrashtama?
- How to read a Jadhagam
- Why birth time matters

---

## Section 10: Final CTA

### Purpose
Close with a calm but decisive invitation.

### Suggested heading
**Start with one reading. Stay for the clarity.**

### CTA options

- `Start free`
- `Open dashboard`

### Supporting copy
Daily guidance, family context, chart tools, and calm interpretation in one place.

---

## 5. Graphics and Content Elements to Introduce

To make the page more informative without making it heavy, introduce:

1. richer product-preview cards
2. tool preview modules
3. family planning mini-visuals
4. chart and dasha sample fragments
5. methodology strip
6. refined iconography only where useful

Avoid:

- generic stock illustrations
- decorative graphics with no product meaning
- random SEO text blocks

---

## 6. Homepage Content Rules

1. Assistant-first messaging always wins.
2. Every section should feel useful, not promotional-only.
3. Tools are shown as part of the broader assistant experience.
4. Copy must stay calm, premium, and practical.
5. Design should stay close to the current homepage style.
6. Sections should use real product logic and outputs where possible.

---

## 7. SEO Intent Coverage

The homepage should lightly support these intent areas:

- Tamil astrology app
- daily astrology guidance
- family astrology planning
- porutham
- panchangam
- jadhagam

But it should not try to rank for every tool directly.

Specific tool intent should live on dedicated pages.

---

## 8. Deliverables This Blueprint Should Feed

This document should be used to create:

1. homepage wireframe
2. homepage copy draft
3. homepage section implementation tasks
4. supporting graphics plan
5. internal links to feature and tool pages


---

## 4. Marketing & SEO Implementation Roadmap

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


---

## 5. Marketing Execution Tasks

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
