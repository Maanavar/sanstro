# Thirukkanitham Veteran-Consultation Protocol — Codebase Audit & Fix Plan

**Date:** 2026-07-11
**Branch:** `harden/production-readiness`
**Scope:** Does Vinaadi's engine actually follow the six-stage silent protocol a 20-year
Thirukkanitham veteran runs (structural read → yoga/dosha → timing → vargas → synthesis →
presentation)? And which backend capabilities are built but never reach the web frontend?

This audit was produced by reading the code, not the memory/`docs/*.md` files. Every claim
below is anchored to a file/line.

---

## 1. Verdict

- **Calculation engine:** ~75% of the veteran pipeline is implemented, and in several places
  (Sani murthi-grading by pada, six-source Shadbala, five parallel dasha systems, Sevvai
  cancellation worksheet) the engine is **deeper than the protocol**.
- **Synthesis:** the weakest link. The system does **not** combine age × gender ×
  dasha-activated houses × gochara stress to *name the single unspoken question* the way a
  veteran opens a reading. Focus areas are derived from **age alone**.
- **Wiring:** several finished backend modules are reachable by `mobile/` through the shared
  client but have **zero web fetch call sites** — computed, invisible on web.

---

## 2. The six-stage protocol, mapped to code

| Stage | Protocol step | Where it lives | Status |
|---|---|---|---|
| 1 | Cast chart + birth-time sanity via Lagna/body signature | `app/services/rectification_service.py` (event-constraint based, `_EVENT_KEY_HOUSES`) | ⚠️ Partial — event-based, no physical-signature check |
| 2 | Structural read: exalt/debil/retro/combustion/vargottama, lord strength | `app/calculations/chart_strength.py`, `house_lords.py`, `functional_nature.py`, `astro.py` | ✅ Strong |
| 3 | Yoga/dosha scan incl. Sevvai + cancellation worksheet | `app/calculations/_yoga_dosham.py` (`cancellation_factors`, `is_cancelled`, `major_cancellation`) | ✅ Strong |
| 4 | Timing: Vimshottari + Sani gochara sub-types + Ashtakavarga | `app/calculations/transits.py` (`EZHARAI_SANI_PHASE_*`, `JANMA_SANI`, `ARDHASHTAMA_SANI`, `ASHTAMA_SANI`, `classify_ezharai_sani_murthi`), `ashtakavarga.py`, `double_transit.py` | ✅ Strong — exceeds protocol |
| 5 | Vargas per life-stage: D9 / D10 / D24 / D7 | `app/calculations/divisional_charts.py` (`compute_d7/d10/d24`), `d9_chart.py` | ⚠️ Computed but only D9 reaches web |
| 6 | Verifiable past statements (trust + rectification) | `app/services/retrospective_service.py` → `web/components/dashboard-retrospective-panel.tsx` | ✅ Wired |

---

## 3. Issues, explained

### ISSUE-1 — The "unspoken question" is never named (age-only inference)
**Severity: High. This is the core skill of the protocol.**

`app/services/age_phase_service.py :: get_active_life_phases(current_age)` maps *age → life
phases* and feeds `activeFocusAreas` into the chart summary. But it:

- takes **only `current_age`** — no gender, no dasha, no gochara;
- returns a **static list** of phases, not a **single ranked "primary concern"** with a
  confidence signal.

The veteran's move — "you came about children" (≈90% confidence) — is derived from
*age × gender × the house the current dasha-bhukti activates × Sani stress*. Vinaadi has all
four ingredients computed separately (`dasha_service`, `dasha_house_mapping.py`,
`transits.py`, `age_phase_service`) but **never fuses them into one prioritized statement**.

**Impact:** the product reads like a comprehensive calculator, not a veteran who leads with
the client's actual worry.

---

### ISSUE-2 — Phase engine is gender-blind
**Severity: High (cheap to fix).**

`get_active_life_phases(current_age)` and the summary inference in
`app/services/_chart_summary.py` contain **no gender term** (verified: no `gender`/`female`/
`male` reference in either). The protocol's inference is heavily gender-weighted (female-25
married → children-timing default; male-35 → Sani/career story). Without gender, the
"female, 25, married" vs "male, 25, married" scenarios collapse to the same output.

---

### ISSUE-3 — Shadbala computed and endpointed, but no web consumer
**Severity: Medium-High.**

- Backend: `app/calculations/shadbala.py` + `app/services/shadbala_service.py` +
  `GET /charts/{id}/shadbala` (`app/api/charts.py:450`).
- Shared/mobile: wrapper exists, mobile consumes it.
- **Web: zero fetch call sites.**

Shadbala (six-source planetary strength) is the protocol's Stage-2 strength quantifier — the
number that tells the veteran whether a "strong" planet is really strong. It is invisible on
web today.

---

### ISSUE-4 — D10 / D24 / D7 divisional charts computed but not surfaced on web
**Severity: Medium-High.**

`app/calculations/divisional_charts.py` computes D7 (children), D10 (career), D24 (education)
via `get_varga`, called from `app/services/_chart_planets.py:21`. But:

- there is **no dedicated `/charts/{id}/divisional` (or per-varga) endpoint**;
- web fetches **only D9 navamsa** (no `dasamsa`/`saptamsa`/`chaturvimsamsa` fetch anywhere).

These are exactly the vargas the protocol opens *by life-stage* (D24 for the 18-yr-old
student, D10 for the 25-yr-old professional, D7 for the couple wanting children). Computed,
invisible.

---

### ISSUE-5 — Advanced dasha systems built + mobile-wired, absent on web
**Severity: Medium (partly deliberate/experimental).**

Endpoints exist, mobile+shared wrap them, **web never fetches**:

| Endpoint | File |
|---|---|
| `GET /charts/{id}/yogini-dasha` | `app/api/charts.py:321` |
| `GET /charts/{id}/ashtottari-dasha` | `app/api/charts.py:340` |
| `GET /charts/{id}/kalachakra-dasha` | `app/api/charts.py:360` |

Note: `chara-dasha` (Jaimini) **is** wired to web — these three are the outliers. Kalachakra
is already flagged experimental in project memory; Yogini/Ashtottari are simply un-surfaced.

---

### ISSUE-6 — Full Tajaka annual chart reduced to a summary on web
**Severity: Low-Medium.**

`app/services/tajaka_service.py` / `app/calculations/tajaka.py` compute a full annual chart
(muntha, sahams, tajaka aspects). Web surfaces only `/varshaphala` + `/solar-return`
summaries. The richer annual-analysis data is computed but not exposed.

---

### ISSUE-7 — No priority-weighting/module-ranking layer
**Severity: Medium (architectural).**

All scenario services exist and are heavily wired to web — `marriage_service` (≈70 web refs),
`career_service` (≈59), `health_service` (≈52), `wealth_service` (≈19), `life_areas_service`.
What's missing is the matrix that **ranks which module to surface first** for a given
`(age, gender, dasha-activated houses)`. Today the dashboard shows everything at one altitude;
the veteran leads with the one thing that matters now. This is the presentation-layer
consequence of ISSUE-1/ISSUE-2.

---

### ISSUE-8 — Birth-time rectification has no physical-signature path
**Severity: Low (likely acceptable for a non-in-person product).**

`rectification_service.py` rectifies from **life-event constraints** (`_EVENT_KEY_HOUSES`),
not from Lagna-derived physical appearance. Reasonable for an app (no body in the room), but
worth recording as a known divergence from the protocol's Stage 1.

---

## 4. What already meets or exceeds the protocol (keep)

- **Sevvai dosham with a real cancellation worksheet** (`_yoga_dosham.py`) — the exact
  safeguard the protocol insists on.
- **Sani gochara sub-typing + murthi grading by natal Moon pada** (`transits.py`) — finer than
  the protocol describes.
- **Kemadruma / Kala Sarpa / Gaja Kesari / Pitru dosha** detection (`_yoga_detect.py`,
  `yogas.py`).
- **Ashtakavarga bindus** used across 5 modules; **double transit** (Guru+Sani).
- **Retrospective / "nadandhadhu" trust step** wired to web.
- Five dasha systems (Vimshottari, Jaimini chara, Yogini, Ashtottari, Kalachakra).

---

## 5. Fix plan (sequenced)

### Phase A — Synthesis (highest leverage; turns calculator → veteran)

**A1. Gender into the phase engine** *(ISSUE-2)*
- Add `gender` param to `get_active_life_phases()` and `get_age_based_practical_guidance()`.
- Source gender from the birth profile (already stored).
- Adjust phase ordering/weights per gender where the tradition differs (e.g. female-25 married
  → children-timing weighted up).
- Backwards-compatible default when gender is unknown.
- Tests: golden cases for the 12 scenario cells (male/female × 18/25/35/45/55/65).

**A2. "Primary concern" synthesizer** *(ISSUE-1, ISSUE-7)*
- New pure function, e.g. `app/services/age_phase_service.py :: infer_primary_concern(age, gender, mahadasha, antardasha, activated_houses, sani_phase) -> RankedConcern`.
- Inputs already available: `dasha_house_mapping.py` (dasha → houses), `transits.py` (Sani
  phase), age/gender.
- Output: ordered list of concerns each with a house-signification rationale + a soft
  confidence band (`high/medium/low`), NOT a percentage claim.
- Surface as a new `primaryConcern` field on `ChartSummaryResponse`
  (`app/schemas/charts.py`), rendered at the top of the dashboard summary.
- Ethics gate: never emit longevity/death framing; delay ≠ denial language for marriage;
  reuse existing remedy-path guardrails.
- Update `packages/shared` types + web summary panel.

### Phase B — Surface computed-but-hidden strength/vargas on web

**B1. Shadbala on web** *(ISSUE-3)* — endpoint + shared wrapper already exist; frontend-only.
Add a Shadbala panel (or fold into the existing strength display) reading
`GET /charts/{id}/shadbala`.

**B2. Divisional charts D10/D24/D7** *(ISSUE-4)*
- Add `GET /charts/{id}/divisional?varga=D10|D24|D7|D9` (compute already done via `get_varga`).
- Add shared wrapper per `packages/shared/src/api/` forward policy.
- Web: show the varga relevant to the user's current life-phase (ties into A2 output —
  student → D24, professional → D10, family-planning → D7).

### Phase C — Advanced dasha + Tajaka exposure (lower priority)

**C1. Yogini & Ashtottari dasha on web** *(ISSUE-5)* — mirror the existing `chara-dasha` web
integration; keep behind a feature flag if desired. Leave Kalachakra experimental until
astrologer sign-off.

**C2. Full Tajaka annual detail** *(ISSUE-6)* — extend the varshaphala web view with muntha /
sahams / tajaka aspects from data already computed.

### Phase D — Record known divergences (no code)

**D1.** Document ISSUE-8 (event-based, not physical-signature rectification) in
`docs/trust`/methodology copy so it is an explicit, defensible design choice.

---

## 6. Priority order (recommendation)

1. **A1 (gender)** — cheapest, unblocks correct per-scenario output.
2. **A2 (primary-concern synthesizer)** — the single change that most closes the gap to a
   veteran reading.
3. **B1 (Shadbala web)** — near-zero backend work, real analytical value.
4. **B2 (divisional web)** — completes the vargas-per-life-stage story.
5. **C1/C2/D1** — polish / completeness.

---

## 7. Cross-surface checklist (per CLAUDE.md API-contract rule)

Any endpoint added/changed in Phase B/C must be updated in **all four** locations in the same
change: `app/api/`, `packages/shared/src/api/`, `mobile/src/api/`, `web/`. New endpoints get a
typed shared wrapper; re-read the FastAPI route decorator to confirm path-param vs query-param
and HTTP verb before wiring the wrapper.

---

## 8. Evidence index (file anchors)

- Age inference: `app/services/age_phase_service.py:41` (`get_active_life_phases`),
  `:80` (`get_age_based_practical_guidance`)
- Summary assembly: `app/services/_chart_summary.py:324` (`active_focus`), `:335`, `:343`
- Sevvai cancellation: `app/calculations/_yoga_dosham.py:134`
- Sani gochara sub-types: `app/calculations/transits.py:103`; murthi grading `:143`
- Divisional compute: `app/calculations/divisional_charts.py:59/71/124`; consumed at
  `app/services/_chart_planets.py:21`
- Chart endpoints: `app/api/charts.py:321` (yogini), `:340` (ashtottari), `:360` (kalachakra),
  `:435` (varshaphala), `:450` (shadbala)
- Rectification method: `app/services/rectification_service.py:43` (`_EVENT_KEY_HOUSES`)
