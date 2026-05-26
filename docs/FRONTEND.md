# Vinaadi AI — Frontend Reference
**Consolidated from:** FRONTEND_MISSING_FEATURES_PROMPT.md · FRONTEND_SURFACE_GAP_PLAN.md · VINAADI_UIUX_MVP_BACKLOG_2026.md  
**Last updated:** 2026-05-26

---

## CURRENT FRONTEND STATUS (as of 2026-05-26)

All 5 original surface gaps have been implemented. 233 backend tests passing.

### What is rendered
| Feature | API Endpoint | UI Location |
|---|---|---|
| Daily score + label | `daily-guidance` | Personal tab, guidance surface |
| Score breakdown (moon/dasha/panchangam/gochar) | `daily-guidance` | Reasons section |
| Action suggestion + tithi/paksha enrichment | `daily-guidance` | Below score |
| Remedy text | `daily-guidance` | Yellow box |
| Best window / Rahu Kalam | `daily-guidance` | Metrics row |
| Emotional weather | `daily-guidance` | Personal tab |
| Ambient alerts | `daily-guidance` | Personal tab |
| Panchangam (tithi, nakshatra, weekday, kalam) | `panchangam/daily` | Gochar surface |
| Dasha timeline (maha/antar/pratyantar) | `dasha` | Dasha surface |
| Goals panel | `goals` | Below dasha |
| What-If simulator | `whatif` | Below goals — triple confirmation |
| Peyarchi banner | `peyarchi/upcoming` | Top of personal tab |
| Chandrashtama banner | `gochar/current` | Conditional alert |
| Saturn cycle | `sani-cycle` | Gochar surface |
| Transit positions | `gochar/current` | Gochar surface |
| D1 + D9 charts | `charts/calculate` | Chart context surface |
| Planet table | `charts/calculate` | Full-width row |
| 3-day range preview | `daily-guidance/range` | Inside guidance surface |

---

## MISSING FRONTEND FEATURES (8 items)

**Context for any coding agent:** Read `docs/AGENT_INSTRUCTIONS.md` first. Backend is fully implemented for all 8 items below. Your job is **frontend only** — fetch data, add TypeScript types if missing, pass as props, render.

**Repo root:** `C:\Users\senth\OneDrive\문서\GitHub\sanstro`  
**Run tests:** `.\.venv\Scripts\python.exe -m pytest tests/ -x -q`  
All 233 tests must still pass when done. Commit after each feature.

---

### FEATURE-10 — Nakshatra Personality Card

**Endpoint:** `GET /api/v1/content/nakshatra/{nakshatra_number}` (no auth required)

**Response shape:**
```typescript
{
  success: true,
  data: {
    number: number,
    nameTa: string, nameEn: string,
    deityTa: string, deityEn: string,
    symbolTa: string, symbolEn: string,
    rulingPlanet: string,
    profile: { ta: string, en: string },
    strengths: { ta: string, en: string }[],
    cautions: { ta: string, en: string }[],
    compatibleGroups: string[]
  }
}
```

**Where to find nakshatra number:** `personalChartSummary.janmaNakshatra` (int 1–27) in `DashboardPersonalTab`.

**Where to fetch:** In `dashboard-workspace.tsx`, after chart bundle loads:
```typescript
apiFetchJson<{ success: boolean; data: NakshatraCardData }>(`/api/v1/content/nakshatra/${nakshatraNumber}`)
  .then(r => setNakshatraCard(r.data))
  .catch(() => {})
```

**Where to render:** In `DashboardPersonalTab`, after the planet table — a card with `nameTa`, `deityTa`, `symbolTa`, `profile.ta`, and `profile.en`.

---

### FEATURE-11 — Yoga & Dosham Panel

**Endpoint:** `GET /api/v1/charts/{chart_id}/yogas-doshams`

**Response shape:**
```typescript
{
  yogas: Array<{
    name: string, nameTa: string,
    strength: "STRONG" | "MODERATE" | "WEAK",
    what: { ta: string, en: string },
    why: { ta: string, en: string },
    how: { ta: string, en: string }
  }>,
  doshams: Array<{
    name: string, nameTa: string,
    label: "NO_DOSHAM" | "MILD" | "MODERATE" | "SEVERE" | "WITH_NIVARTHI",
    niv arthi: boolean,
    what: { ta: string, en: string },
    why: { ta: string, en: string },
    how: { ta: string, en: string }
  }>,
  kalasarpa: { present: boolean, type: string | null } | null,
  nakshatra_cautions: Array<{ nakshatra: string, cautionTa: string, cautionEn: string }>
}
```

**Where to render:** `dashboard-yoga-dosham-panel.tsx` — this component already exists. Wire it up in the Life Areas tab. Show yogas as green cards, doshams with nivarthi as amber, severe doshams as red.

---

### FEATURE-12 — Rasi Chakra Diagram (South Indian Grid)

All planet data is already available. This is a pure frontend rendering task.

**Data source:** `charts/calculate` response — `planets[].houseFromLagna` + `lagnaRasi`

**Implementation:** South Indian square 4×4 grid SVG. House 1 at top-center. Planets placed by `houseFromLagna`. Show both D1 (Rasi) and D9 (Navamsa) chakras side by side.

**New file:** `web/components/rasi-chakra.tsx`  
**Mount in:** `dashboard-personal-tab.tsx` — replace or augment the current flat planet table.

---

### FEATURE-13 — Birth Time Source Selector

**Backend field:** `birth_time_source` on `BirthProfile` model (already exists). `birth_time_confidence_minutes` also already exists.

**Where to add:** `dashboard-setup-tab.tsx` — birth profile creation form.

**UI:** A visible radio/select during profile creation:
- "Hospital / official record" → `confidence_minutes = 0`
- "Family memory (approximate)" → `confidence_minutes = 15`
- "Told by elder (uncertain)" → `confidence_minutes = 30`
- "Unknown / date only" → `birth_time_local = null`

When confidence ≥ 30 min, show warning: "Lagna near a rasi boundary may shift — verify with a known life event."

---

### FEATURE-14 — City Geocoding on Birth Profile Form

**API:** OpenStreetMap Nominatim (free, no key):
```
https://nominatim.openstreetmap.org/search?q=Chennai&format=json&limit=1
```

**UI:** Add a city search input. On selection, show confirmation: "Found: Chennai, Tamil Nadu — 13.0827°N, 80.2707°E" before saving lat/lon to the profile.

**Where:** `dashboard-setup-tab.tsx`

---

### FEATURE-15 — Activity-Specific Daily Guidance Text

**What exists:** `assess_activity_timing()` in `activity_timing_rules.py` already computes per-activity alignment. It is wired for goals but not surfaced in the main daily guidance view.

**What to add:** When a user has an active goal (e.g. `job_change`), include in daily text:
*"For your job-change goal: today's Rahu Kalam at 2:00–3:30 PM is particularly risky — job offers started during Rahu Kalam traditionally face unexpected reversals."*

**Where:** `daily_guidance_service.py:_build_text()` — pass `goal_type` and use `timing.combined_en` from `assess_activity_timing()`.

---

### FEATURE-16 — House-Aware Dasha Interpretation

**What's missing:** The Dasha panel shows `SATURN / MERCURY` with a one-liner theme ("Discipline, responsibility") regardless of WHERE that planet sits in the user's chart.

**What to add:**
- Look up Mahadasha lord's natal house from Lagna and Moon
- Use `DASHA_HOUSE_THEMES[lord][house_from_lagna]` table to generate specific text
- Feed `employment_type` from `BirthProfile` into Q&A context

**Files:** `app/calculations/dasha_house_mapping.py` (already exists — verify it's called from guidance service); `app/services/dasha_service.py`.

---

### FEATURE-17 — Antardasha Explanation in Dasha Panel

**What's missing:** Antardasha lord gets no interpretation — only Mahadasha is explained.

**What to add:** `antardasha_theme` text field in Dasha response:
- Natural domain of Antardasha lord
- Relationship to Mahadasha lord (friend/enemy/neutral)
- Natal house position and what it activates

**Where:** `app/schemas/dasha.py` + `app/services/dasha_service.py`. Reuse `_graha_relationship_score()` for friend/enemy classification.

---

### FEATURE-18 — Ashtama Sani / Janma Sani Highlighted Banner

**What exists:** Sani cycle is computed. It reduces the daily score by 10 points but there is no visible alert.

**What to add:** A `saturn_cycle_alert` field in `DailyGuidanceData`. When `saturn_cycle.type` is `ASHTAMA_SANI` or `JANMA_SANI`, render a highlighted amber caution card (not just a score reduction).

**Files:** `app/schemas/daily_guidance.py`, `app/services/daily_guidance_service.py`, `web/components/dashboard-hero.tsx`.

---

## UI/UX MVP BACKLOG

Follows Vinaadi standards: Tamil-first, Thirukanitham engine transparency, supportive non-fatalistic language, mobile-first responsive.

### Phase 1 (Now)
| Priority | Item | Effort |
|---|---|---|
| P0 | Daily Snapshot block on Personal tab (score, timing, caution, action) | S |
| P0 | Score transparency with progressive disclosure | S |
| P0 | Birth time confidence + timezone visibility | S |
| P1 | Per-block bilingual clarity toggle (TA + EN) | S |

### Phase 2 (Next)
| Priority | Item | Effort |
|---|---|---|
| P1 | South Indian chart tap-to-explain overlays | M |
| P1 | Family Vault quick cards (today score, dasha, trend) | M |
| P1 | Today plan card (focus window, avoid window, remedy) | M |
| P2 | Week-ahead visual strip with caution markers | M |

### Phase 3 (Later)
| Priority | Item | Effort |
|---|---|---|
| P2 | Guided onboarding confidence checks (time/place/timezone) | M |
| P2 | Accessibility pass (touch targets, contrast, reduced motion) | M |
| P2 | Personalization presets (beginner / advanced detail depth) | M |

### Acceptance rules for UI copy
Use: "traditionally associated with", "supports", "caution period", "tendency"  
Avoid: guaranteed event language, fear framing, deterministic health outcomes

---

## UPCOMING FEATURES (beyond MVP)

### Porutham (10-Point Marriage Matching)
New `app/calculations/porutham.py`. Priority order: Rajju first (most important), then Dina, Gana, Rasi, Nadi. Return per-porutham pass/fail + total score + threshold (6/10). Wire into `app/api/family_vaults.py` and `dashboard-family-tab.tsx`.

### Jadhagam PDF Export
New endpoint `GET /api/v1/charts/{chart_id}/export/pdf`. Content: birth header + Rasi Chakra (South Indian grid) + Navamsa + planet table + Dasha timeline + active Yogas/Doshams.

### Family Vault Enhancements
- Joint muhurtha: find highest common daily score window across all members
- Composite Peyarchi: per-member impact when Jupiter/Saturn changes rasi
- Side-by-side chart comparison for marriage evaluation

### Q&A Context Builder
Build `build_chart_context_prompt()` in `qa_service.py` feeding all planet positions, Navamsa, doshams with nivarthi factors, active Dasha, life area predictions into every Q&A call.

### Push Notifications
Daily 7 AM push via `notification_dispatch_service.py` + `fcm_service.py`:
- Content: score + label + best window + Rahu Kalam time
- Ashtama Sani alert when period begins
- Chandrashtama alert the evening before
