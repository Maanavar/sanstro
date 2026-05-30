

# Vinaadi AI — Issue Analysis & Action Plan
**Session:** 2026-05-29 | **Analyst:** Claude Sonnet 4.6  
**Status:** APPROVED — implementation in progress

---

## User Decisions (confirmed)
- Issue 5 tiles: Replace "Today's Date" with Rahu Kalam, keep/improve Tithi tile
- Issue 6: Card grid for planetary positions
- Issue 9: Respect current calibrated formula weights — panchangam already included in daily score (0.15 weight). Activity timing (whatif) does not include panchangam — that is the gap to address.
- Issue 16/18: Collect marital_status + employment_status at profile creation; relationship_type at member-add time
- Work order: Full ownership to Claude — implement by priority stream

---

## Formula Audit Summary (2026-05-29)

### Daily Score — MATCHES SPEC (with intentional extensions)
```
day_score = moon_nakshatra*0.30 + transit*0.25 + dasha*0.20 + panchangam*0.15 + personal_safety*0.10
```
Extensions in code (intentional, do NOT change):
- `remedial_support` bonus (up to +6) for best_windows
- Vedha reduction on transit contributions (×0.25)
- Lagna-based functional nature modifier on transit + dasha
- Detailed Saturn cycle penalties in personal_safety

### What-if / Activity Timing — MISSING PANCHANGAM (confirmed gap)
```
overall = natal*0.30 + dasha*0.40 + gochar*0.30
```
Panchangam is completely absent. This is why good panchangam days don't surface in Plan tab.

### Formula spec authority
Formula spec wins over product spec. The code's calibrated values are authoritative — do NOT change daily score weights. Only add panchangam to whatif scoring.

---

## Implementation Plan (by stream)

---

## STREAM A — Crashes & Broken Interactions (P0/P1)

### A1 — ISSUE 17: Synastry crash on timingIndicators [P0]
**Root cause:** `app/schemas/relationships.py` SynastryData has no `timingIndicators` field. At runtime it is `undefined`, crashing `.length` access at `dashboard-synastry-panel.tsx:476`.

**Fix — two parts:**
1. Python: Add `timing_indicators: list[dict] = Field(default_factory=list, alias="timingIndicators")` to SynastryData schema.
2. TypeScript: Change `synastry.timingIndicators.length` to `(synastry.timingIndicators ?? []).length` as safety net.

**Files:** `app/schemas/relationships.py`, `web/components/dashboard-synastry-panel.tsx:476`

---

### A2 — ISSUE 2: Signup → wrong tab [P1]
**Root cause:** After profile creation, localStorage retains `activeTab:"settings"`. On next load, hydration (line 222) restores it. The profile-check effect (line 272) only forces settings if `birthProfileId` is null — so once profile exists, it should go to personal. But if the hydration fires AFTER the profile check, settings tab persists briefly then snaps to personal.

**Real fix:** After `handleCreateProfile()` succeeds, explicitly call `setActiveTab("personal")` AND clear the persisted activeTab from localStorage. Currently L456 calls `setActiveTab("personal")` but the next localStorage persist (L242–253) may re-save "settings" if the persist effect runs before the state update lands.

**Files:** `web/components/dashboard-workspace.tsx` — add localStorage clear after profile creation.

---

### A3 — ISSUE 4: Family attention chips — click does nothing [P1]
**Root cause:** `MemberChip` in `dashboard-personal-tab.tsx:358` is rendered without an `onClick` prop.

**Fix:** Pass `onClick={() => onTabChange?.("family")}` (or equivalent). The personal tab receives a `setActiveTab` callback — wire it through.

**Files:** `web/components/dashboard-personal-tab.tsx:354-366`

---

### A4 — ISSUE 7: Life Event Log 502 [P1]
**Root cause:** Router IS registered in `app/main.py:130`. The 502 is a proxy/backend-unreachable error meaning the FastAPI server wasn't running when the user tested. This is a runtime/deployment issue, not a code bug.

**Action:** Verify frontend is calling the correct URL path. The frontend component calls the right endpoint — no code change needed. Document that the backend must be running.

---

### A5 — ISSUE 12: Remove Find Birth Time module [P1]
**Root cause:** User confirmed answers are wrong/unreliable.

**Fix:** Remove the "Find Your Birth Time" entry from the Specialist Tools panel. Do NOT remove birth time confidence indicator.

**Files:** `web/components/dashboard-personal-tab.tsx` — remove tool entry from Specialist Tools list.

---

## STREAM B — Tamil Localisation (P2)

### B1 — ISSUE 3: Planet/Nakshatra names in English in Tamil mode
**Root cause:** `tPlanetLord()` and `tNakshatra()` functions exist and handle uppercase keys. But several render sites pass planet names as raw API strings without calling these functions.

**Affected sites:**
1. `dashboard-synastry-panel.tsx:483` — `{ti.planet}` renders raw English planet name
2. Wherever transit planet positions are displayed (not in dasha.tsx — find the actual component)
3. Decision panel `alignmentNotes` / `riskFactors` text — these are BiText from backend so should be OK if backend provides Tamil
4. Chart cells — Rasi abbreviations are English-only

**Fix:** Wrap `{ti.planet}` with `{tPlanetLord(ti.planet, lang)}` and similarly for all raw planet name renders.

**Files:** `dashboard-synastry-panel.tsx`, and wherever transit planet table is rendered.

---

## STREAM C — Decision Engine & Activity Timing (P2)

### C1 — ISSUE 9: Activity timing ignores panchangam
**Finding:** Daily score uses panchangam at 0.15 weight correctly. But `whatif_service.py` formula (`natal*0.30 + dasha*0.40 + gochar*0.30`) has no panchangam component.

**Formula authority:** Formula spec does not define whatif formula — it's custom code. Safe to extend.

**Fix plan:** Add panchangam score to `_overall_verdict()`:
- Pull panchangam_score from the existing panchangam service (it's already computed for the date)
- New weights: `natal*0.25 + dasha*0.35 + gochar*0.25 + panchangam*0.15`
- Good tithi/nakshatra → higher panchangam component → better window identified
- Kalam avoid windows → lower score

**Files:** `app/services/whatif_service.py`

### C2 — ISSUE 10: Decision panel — both options show same result
**Root cause:** 
1. Both options share same dasha period and gochar — so those components are identical
2. The natal promise check differentiates per scenario type but the karaka weighting is too coarse
3. alignmentNotes are generic timing messages, not option-specific analysis
4. Both show "Base timing verdict is caution" because it derives from the same Sani transit

**Fixes:**
1. Add option-specific comparison narrative in the response: "Option A leads by X because [specific karaka]"
2. Show the delta explicitly: score A vs B with the decisive factor named
3. When DEFER: show what changes and when (which transit, which dasha shift)
4. Expand scenario sub-types for more differentiated karaka analysis

**Files:** `app/services/whatif_service.py`, `web/components/dashboard-decision-panel.tsx`

---

## STREAM D — Goals & Personalisation (P2/P3)

### D1 — ISSUE 11: Goals silently drop, no goal-driven guidance
**Root cause:** Goals saved to DB but no success/error feedback shown. Also, saved goals don't visibly change what is surfaced in the dashboard.

**Fix:**
1. Add success toast after goal save
2. Pin selected life areas to top of life areas list
3. Show "Your focus: X, Y" in personal tab header

**Files:** `web/components/dashboard-personal-tab.tsx`, `web/components/dashboard-life-areas-tab.tsx`

### D2 — ISSUE 16: Demographic-aware content gating
**Decision:** Collect at profile creation time (not signup — don't overwhelm new users):
- `marital_status`: single / married / divorced / widowed / separated
- `employment_status`: student / employed / self-employed / retired / homemaker
- Collect at member-add time: `relationship_type` (spouse/child/parent/sibling/friend/other)

**DB migration needed:** Add columns to birth_profiles table.

**Files:** `app/models/birth_profile.py`, migration file, `web/components/dashboard-edit-profile-modal.tsx`, `app/services/life_areas_service.py`

### D3 — ISSUE 18: Porutham for wrong relationship types
**Depends on D2** (relationship_type field needed).

After D2: show marriage kutas only for spouse/romantic. For parent-child: house overlaps. For siblings: temperament/3rd house. For friends/business: Mercury/Jupiter alignment.

---

## STREAM E — UI/UX Polish (P3)

### E1 — ISSUE 5: Replace "Today's Date" tile
**User decision:** Show Rahu Kalam + Tithi

**Current Tile 3** (Today's Context) already shows Chandrashtama/Sani cycle/Tithi. The issue is Tile 1 (Today's Score) and Tile 2 (Best Window) the user finds OK, but Tile 3 (Today's Context shows Tithi buried in text) and Tile 4 (Moon Nakshatra) could be replaced.

**Analysis:** The 4 tiles in `dashboard-daily-snapshot.tsx` are:
- Tile 1: Today's Score — KEEP
- Tile 2: Best Window — KEEP (high value)
- Tile 3: Today's Context (Chandrashtama/Sani/Tithi) — replace with dedicated Rahu Kalam tile
- Tile 4: Moon Nakshatra — replace with dedicated Tithi tile

**New tiles:**
- Tile 3: Rahu Kalam — `panchangam.kalam.rahuKalam.start/end` (already in data)
- Tile 4: Tithi — `panchangam.tithi.name + paksha` (already in data)

**Files:** `web/components/dashboard-daily-snapshot.tsx`

### E2 — ISSUE 6: Card grid for planetary positions
**Location to find:** Transit planetary positions table is NOT in dashboard-dasha.tsx. Need to find where it actually renders. Likely in `dashboard-personal-tab.tsx` or a dedicated transit component.

**Design:** 3×3 card grid (or 9 cards in a flow layout), each card:
- Planet name (Tamil/English via `tPlanetLord`)
- Current sign (Tamil/English)
- Degree
- Status badge: Direct / Retrograde ℞ / Combust
- One-line interpretation relative to user's Moon rasi

### E3 — ISSUE 15: Print Jadhagam
**Fix:**
1. Add `@media print` CSS hiding navigation/sidebar/tools
2. Move print button to chart header with label + icon
3. Print-only layout: chart grid + planet table + basic info only

### E4 — ISSUES 8, 13, 14: Dropdown UX, values, keyboard nav
**Grouped work:** Audit all dropdowns for keyboard accessibility. Expand decision panel scenario sub-types. Style dropdowns consistently.

---

## Implementation Order

```
A1 (crash fix)        → immediate
A2 + A3 + A5          → same sitting, small fixes
B1                    → Tamil planet names
E1                    → tile swap (Rahu Kalam + Tithi)
E3                    → print fix
C1                    → panchangam in whatif
C2                    → decision panel improvement
D1                    → goals feedback
E2                    → planetary positions card grid
E4                    → dropdown UX
D2 + D3               → profile fields + content gating (largest work, last)
A4 (Life Event Log)   → document as runtime issue, not code bug
```

---

## Files To Change (master list)

| File | Issues |
|---|---|
| `app/schemas/relationships.py` | A1 (timingIndicators field) |
| `web/components/dashboard-synastry-panel.tsx` | A1 (optional chain), B1 (planet name Tamil) |
| `web/components/dashboard-workspace.tsx` | A2 (localStorage clear after profile) |
| `web/components/dashboard-personal-tab.tsx` | A3 (chip onClick), A5 (remove tool), D1 |
| `web/components/dashboard-daily-snapshot.tsx` | E1 (tile swap) |
| `app/services/whatif_service.py` | C1 (panchangam), C2 (better narratives) |
| `web/components/dashboard-decision-panel.tsx` | C2 (UI for comparison narrative) |
| `app/models/birth_profile.py` | D2 (new fields) |
| `web/components/dashboard-edit-profile-modal.tsx` | D2 (collect fields) |
| `app/services/life_areas_service.py` | D2 (content gating) |

---

*Last updated: 2026-05-29 after full formula audit and file inspection.*
