# Family Tab — "Understand This Chart" Explanation Panel — Implementation Plan v1

## Goal

Add a dedicated, per-person chart-explanation section in the Family tab, placed directly
below each member's D1 (Rasi) / D9 (Navamsa) charts and above the Dasha block. It should
explain, in plain bilingual (Tamil/English) language:

- What the person's chart contains (lagna, moon, planets, houses)
- What each planet's placement means (dignity, strength, retrograde/combust/vargottama)
- Which planets are "standing together" (conjunctions) and whether that company is
  friendly/neutral/hostile (graha maitri)
- Trikona / Kendra / Dusthana placements and what they imply
- Aspects (drishti) — who looks at whom
- Functional nature (yogakaraka, lagna lord, maraka, etc.)
- Yogas / Doshams present
- A short positives/cautions summary
- How upcoming Peyarchi (Guru, Sani, Rahu, Ketu transits) will affect THIS specific chart

## Current State (verified in codebase)

- Family tab expanded member view already renders D1/D9 charts:
  `web/components/dashboard-family-tab.tsx` (around line 378), via `RasiChart` /
  `NavamsaChart` from `web/components/dashboard-charts.tsx` (lines 88–310).
- `useFamilyData.ts` (around line 92) already loads, per member: `chart`, `summary`,
  `dailyGuidance`, `transit`, `sani`, `peyarchiUpcoming`, `dasha`, `dashaAntar`. Phase 1
  should reuse this data — no new network calls needed.
- Existing reusable report UI pattern: `dashboard-jadhagam-report-panel.tsx` (~line 166) —
  follow its visual/structural conventions (collapsible sections, bilingual labels).
- Chart data shape: `ChartCalculateResponseData` / `ChartPlanet` in `web/lib/types.ts`
  (lines 158–223) — includes `houseFromLagna`, `rasi`, `nakshatra`, `isRetrograde`,
  `isCombust`, `isVargottama`, `d9Rasi`, `strengthScore`, `strengthBreakdown`.

### Backend logic that already exists (reuse, don't reinvent)

| Concern | Location |
|---|---|
| Planetary dignity (exalted/debilitated/own sign/moolatrikona/friend-enemy of sign lord) | `app/calculations/chart_strength.py` `_dignity_score()` (lines 97–121), `EXALTATION_RASI`/`DEBILITATION_RASI`/`MOOLATRIKONA_ZONE`/`OWN_SIGN_RASI` (lines 11–44) |
| Graha maitri (natural friends/enemies) | `app/calculations/chart_strength.py` `_NATURAL_FRIENDS` / `_NATURAL_ENEMIES` (lines 47–68) |
| Planetary war detection (conjunction within 1°) | `app/calculations/chart_strength.py` `detect_planetary_wars()` (lines 203–233) |
| Composite natal strength (shadbala-style) | `app/calculations/chart_strength.py` `compute_natal_planet_score()` (lines 293–329) |
| Aspect houses for Jupiter/Saturn | `app/calculations/transits.py` `get_jupiter_aspects()` / `get_saturn_aspects()` (lines 173–186) — Note: only Jupiter (4th/7th/9th) and Saturn (3rd/6th/10th from transit position) currently; full natal drishti for all planets is NOT implemented |
| Kendra / Trikona house sets | `app/calculations/yogas.py` `KENDRA_HOUSES = {1,4,7,10}`, `TRIKONA_HOUSES = {1,5,9}` (lines 13–44); Dusthana = {6,8,12} implied via `functional_nature.py` |
| House-from-reference helper | `app/calculations/astro.py` `house_from_reference()` |
| Functional nature (yogakaraka/maraka/etc.) | `app/services/chart_service.py` `get_chart_summary()` (~line 1126) — already returned in `ChartSummaryResponse` |
| Yoga/Dosham list | Already present in `ChartCalculateResponseData.yogas` / `.doshams` and in jadhagam report |
| Bilingual text pattern | `app/services/narrative_engine.py` `BiText` dataclass (lines 22–29) and helpers like `build_strength_narrative()` (lines 32–68) |
| Peyarchi (transit) upcoming events — Guru/Sani/Rahu/Ketu summary | `app/services/peyarchi_service.py` (`find_next_rasi_change`, `find_next_permanent_rasi_change`, ~line 21) |
| Full Peyarchi narrative report — **Guru & Sani only today** | `app/services/daily_guidance_service.py` (~line 1777) — Rahu/Ketu full narrative is a gap |
| Transit snapshot (current positions, Chandrashtama, aspects) | `app/services/transit_service.py` `build_transit_snapshot()` (lines 40–80+) |
| Full Jadhagam report endpoint | `app/api/charts.py` `GET /charts/{chart_id}/jadhagam-report` (~line 100) |
| Chart summary endpoint | `app/api/charts.py` `GET /charts/{chart_id}/summary` (~line 89) |

### Gaps identified

1. No general-purpose "natal drishti" (aspect) calculator covering all planets'
   standard 7th-house aspect plus special aspects (Mars 4th/8th, Jupiter 5th/9th,
   Saturn 3rd/10th, optionally nodes). Only transit-Jupiter/Saturn aspect-house lists exist.
2. No conjunction grouping helper (group natal planets sharing a rasi/house) — trivial
   to derive client-side from `chart.planets`, or do it server-side for consistency.
3. `_NATURAL_FRIENDS`/`_NATURAL_ENEMIES` tables are Python-only; frontend has no
   equivalent. Either port a small static lookup to TS, or expose via a backend endpoint.
4. Full Peyarchi narrative currently covers Guru & Sani only — Rahu/Ketu detailed
   narrative is missing (`daily_guidance_service.py` ~line 1777).

## Recommended Approach: Two Phases

### Phase 1 — Frontend-only interpretation layer (fast, ships value quickly)

Build the explanation UI entirely from data already loaded by `useFamilyData.ts`
(`chart`, `summary`, `transit`, `sani`, `peyarchiUpcoming`, `dasha`). Derive
conjunctions, kendra/trikona/dusthana grouping, and basic graha-maitri client-side.
Do NOT add new backend endpoints in this phase — validate UX first.

#### Phase 1 Tasks

1. **New component**: `web/components/dashboard-chart-explanation.tsx`
   - Props: the member's already-loaded data bundle (`chart`, `summary`, `transit`,
     `sani`, `peyarchiUpcoming`, `dasha`, `dashaAntar`, `language`).
   - Default collapsed; show a single "Open chart explanation" / "ஜாதக விளக்கம்" button.
   - Internally organize as collapsible sections (reuse visual patterns from
     `dashboard-jadhagam-report-panel.tsx`):
     1. **Chart Basics** — Lagna rasi/nakshatra, Moon rasi/nakshatra, current
        Dasha/Bhukti lord (from `dasha`/`dashaAntar`)
     2. **Planet Positions** — table/list per graha: house (`houseFromLagna`), rasi,
        nakshatra, retrograde/combust/vargottama flags, `strengthScore`
     3. **Friends Standing Together** — group `chart.planets` by `rasi` (conjunctions);
        for each group of 2+, label the relationship (friendly/neutral/hostile) using a
        small ported lookup table (see Data Approach below)
     4. **Drishti / பார்வை** — for Phase 1, limit to what's derivable without a full
        natal-aspect engine: show transit aspects from `transit`/`sani` data, and a
        simple "planets in mutual 7th-house aspect" check (universal aspect, easy to
        compute client-side: house difference == 6)
     5. **Kendra / Trikona / Dusthana** — classify each planet's `houseFromLagna` into
        {1,4,7,10} / {1,5,9} / {6,8,12}, with one-line plain-language meaning for each
     6. **Functional Nature** — surface whatever `summary` already returns
        (yogakaraka/lagna lord/maraka/etc.) — do not recompute
     7. **Yogas / Doshams** — reuse existing rendering from the jadhagam report panel
        (don't duplicate logic; extract/share a sub-component if convenient)
     8. **Positive / Caution Summary** — short bullets: strongest planet & why
        (highest `strengthScore` + good dignity/house), weakest planet & why, 1-2
        practical notes (tone modeled on existing `narrative_engine.py` bilingual style)
     9. **Upcoming Peyarchi for this chart** — using `peyarchiUpcoming` + `sani` +
        `transit`:
        - Sani: identify stage (Janma Sani / Ezharai Sani-Sade Sati / Ardhashtama /
          Ashtama / Kantaka) by counting transit house from natal Moon
        - Guru: classify the upcoming transit house from Moon as generally supportive
          (2/5/7/9/11) vs needing care (6/8/12), and what life area it touches from lagna
        - Rahu/Ketu: identify the axis of houses about to be activated (from Moon and
          from lagna) and give a short "what becomes amplified / what fades" note

2. **Integration**: Mount `<ChartExplanationPanel />` inside `MemberDetailExpanded` in
   `dashboard-family-tab.tsx`, directly below the D1/D9 chart block (~line 378–384) and
   above the Dasha section (~line 387).

3. **Bilingual**: Follow the existing `BiText`-equivalent pattern already used in the
   family tab / i18n setup — every label and generated sentence needs Tamil + English.

4. **UX**: Default collapsed. Show a one-line summary teaser even when collapsed
   (e.g., "3 planets in Kendra, Moon well-placed, Sani transit nearing 4th from Moon").
   Avoid dumping raw astrology jargon — lead with plain language, let users expand
   technical layers (each of the 9 sections above collapsible independently).

#### Phase 1 Data Approach for Graha Maitri

Two options — pick based on effort:
- **(a) Port a small static table to TypeScript**: `_NATURAL_FRIENDS`/`_NATURAL_ENEMIES`
  is a fixed 9x9 relationship table (no per-chart computation needed for *natural*
  friendship — only *compound* friendship needs the sign-lord factor). Porting the
  natural-friendship table alone (≈20 lines of data) is enough for a "friends standing
  together" feature and keeps Phase 1 fully frontend-only.
- **(b) Check if `summary`/`ChartSummaryResponse` already exposes a friend/enemy field**
  per planet — if yes, just consume it (preferred — avoids duplication). Verify by
  reading `chart_service.py` `get_chart_summary()` response shape before deciding.

Recommendation: try (b) first; fall back to (a) only if no such field exists.

### Phase 2 — Centralize rules in a backend endpoint (cleaner, testable, reusable)

Once Phase 1 UX is validated with users, move the derived-rule logic
(conjunctions, full natal drishti, kendra/trikona/dusthana grouping, compound graha
maitri, Rahu/Ketu peyarchi narrative) into the backend so it's centrally testable and
reusable across features (e.g., PDF export, notifications).

#### Phase 2 Tasks

1. **New service**: `app/services/chart_explanation_service.py` (or extend
   `chart_service.py`) with `build_chart_explanation(chart, language) ->
   ChartExplanationResponse`:
   - Reuse `_dignity_score()`, `_NATURAL_FRIENDS`/`_NATURAL_ENEMIES`,
     `compute_natal_planet_score()` from `chart_strength.py`
   - Reuse `KENDRA_HOUSES`/`TRIKONA_HOUSES` from `yogas.py`
   - **New**: implement a general natal-drishti calculator — standard 7th-house aspect
     for all planets + special aspects (Mars 4th/8th, Jupiter 5th/9th, Saturn 3rd/10th;
     decide whether to include Rahu/Ketu aspects — there are multiple traditions, pick
     one and document it)
   - **New**: conjunction grouping helper (group by rasi, label relationship via maitri)
   - Compose bilingual narrative strings using the `BiText` pattern from
     `narrative_engine.py`

2. **New schema**: `ChartExplanationResponse` in `app/schemas/` — structured,
   bilingual, per-planet + per-house + summary sections matching the Phase 1 UI
   sections above (so the frontend can later swap from local derivation to this
   endpoint with minimal changes).

3. **New endpoint**: `GET /charts/{chart_id}/explanation` in `app/api/charts.py`.

4. **Extend Peyarchi narrative to Rahu/Ketu**: in `daily_guidance_service.py`
   (currently Guru/Sani only, ~line 1777), add full Rahu/Ketu transit narrative
   generation — axis-based (both houses activated together), themes (amplification at
   Rahu's house, detachment/release at Ketu's house), and cross-reference with natal
   planets/lords occupying those houses.

5. **Swap frontend to consume the new endpoint** in place of the Phase 1 client-side
   derivations, keeping the same UI/section structure (minimal UI churn).

## Astrological Rules Reference (for whoever implements the narrative text)

### Assessing any Peyarchi against an individual chart — general method
1. Note natal Moon, lagna, and the transiting planet's own natal placement.
2. Count the transiting house from both lagna and Moon.
3. Check aspects (drishti) the transiting planet casts on natal planets/houses.
4. Check if it conjoins/aspects natal lagna lord, Moon, or the lord of the house being
   transited — this determines which life area is "switched on."
5. Cross-reference with current dasha/bhukti — transit effects are amplified or muted
   depending on whether the dasha lord aligns with the transit's themes.

### Guru Peyarchi (Jupiter, ~13 months/sign)
- From natal Moon: 1st/5th/9th/11th generally favorable; 6th/8th/12th need more care.
- Also assess from lagna — which house Jupiter now occupies/aspects natally.
- Domains: knowledge, marriage, children, finance, spiritual growth, expansion.

### Rahu-Ketu Peyarchi (~18 months/axis)
- Rahu's house = amplification/material pursuit/obsession; Ketu's house =
  detachment/release/spiritual redirection — always assess both ends together.
- Flag which natal planets/lords sit in or rule the now-activated houses.
- Special watch: Rahu/Ketu conjunct/aspecting natal Moon, Sun, or lagna lord — often
  brings confusion, sudden change, health/mental stress periods.

### Sani Peyarchi (Saturn, ~2.5 years/sign)
- From natal Moon, identify the stage:
  - **Ezharai Sani / Sade Sati**: Saturn transiting 12th, 1st, or 2nd from natal Moon
  - **Ashtama Sani**: 8th from Moon
  - **Kantaka Sani**: 4th from Moon
  - **Janma Sani**: Saturn returning to natal position (~29.5 years, the "Saturn return")
- Also assess from lagna — houses of natal lagna lord, planets aspected via Saturn's
  3rd/7th/10th drishti.
- Domains: discipline, delays, restructuring, career, health, long-term consequences —
  not inherently bad; "what you sowed, you now reap," demands endurance.

## File/Line Reference Summary

| Item | Path |
|---|---|
| Family tab member detail | `web/components/dashboard-family-tab.tsx` (~line 378 chart block, ~line 387 dasha block) |
| Family data hook | `web/hooks/useFamilyData.ts` (~line 92) |
| Chart visuals | `web/components/dashboard-charts.tsx` (lines 88–310) |
| Chart/Planet types | `web/lib/types.ts` (lines 158–223) |
| Reusable report UI pattern | `web/components/dashboard-jadhagam-report-panel.tsx` (~line 166) |
| Dignity / maitri / strength | `app/calculations/chart_strength.py` (lines 11–121, 203–233, 293–329) |
| Transit aspect helpers (Guru/Sani only) | `app/calculations/transits.py` (lines 173–186) |
| House classification sets | `app/calculations/yogas.py` (lines 13–44) |
| Functional nature | `app/services/chart_service.py` `get_chart_summary()` (~line 1126) |
| Bilingual text helpers | `app/services/narrative_engine.py` (`BiText` lines 22–29, `build_strength_narrative` lines 32–68) |
| Peyarchi upcoming events | `app/services/peyarchi_service.py` (~line 21) |
| Full Peyarchi narrative (Guru/Sani only) | `app/services/daily_guidance_service.py` (~line 1777) |
| Transit snapshot | `app/services/transit_service.py` `build_transit_snapshot()` (lines 40–80+) |
| Chart API endpoints | `app/api/charts.py` (`/summary` ~line 89, `/jadhagam-report` ~line 100) |

## Acceptance Checklist

- [x] Panel appears below D1/D9 charts, above Dasha block, in family member detail view
- [x] Default collapsed with one-line teaser; each of the 9 sections independently expandable
- [x] All text bilingual (Tamil + English) following existing `BiText`/i18n conventions
- [x] No new network calls in Phase 1 (uses data already loaded by `useFamilyData.ts`)
- [x] Conjunctions correctly grouped and labeled friendly/neutral/hostile
- [x] Kendra/Trikona/Dusthana classification matches `KENDRA_HOUSES`/`TRIKONA_HOUSES` constants
- [x] Functional nature surfaced from existing `summary` data in Phase 1; Phase 2 now consumes centralized backend functional nature
- [x] Yoga/Dosham section reuses existing rendering (no duplicated logic)
- [x] Peyarchi section correctly identifies Sade Sati / Ashtama / Kantaka / Janma Sani stages
  by counting transit house from natal Moon
- [x] Current Dasha/Bhukti/Antaram activation explains active lords by natal placement,
  functional nature, strength, current gochar house, and major transit contacts
- [x] Phase 2: new `/charts/{chart_id}/explanation` endpoint covered by tests
  (place in test DB per repo rules — never `vinaadi_dev`)
- [x] Phase 2: Rahu/Ketu full narrative added to `daily_guidance_service.py`
