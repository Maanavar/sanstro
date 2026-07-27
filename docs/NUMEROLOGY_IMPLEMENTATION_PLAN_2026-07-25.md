# Numerology Engine — Full Implementation Plan

**Date:** 2026-07-25
**Status:** Plan — no code written
**Scope:** Build the complete numerology capability end-to-end. **Monetization gating is deliberately out of scope** and deferred to Phase 8.
**Owner hats consulted:** Product Owner · CEO · CMO · Thirukanitham astrologer · Numerologist

---

## Build status (updated 2026-07-25)

All doctrine rulings and their sources: **`NUMEROLOGY_DOCTRINE_RULINGS_2026-07-25.md`**.

| Phase | State | Artefacts |
|---|---|---|
| 0 — Doctrine & data | **Closed except one item.** D1/D2/D3 ruled; NU-05 discharged (Cheiro 1935, pp. 126-133). Only a *printed* Tamil source for the pada table remains. | `NUMEROLOGY_DOCTRINE_RULINGS_2026-07-25.md` |
| 1 — Core engine | **Built.** Chaldean table, four numbers, compound preservation, graha bridge. | `app/calculations/numerology.py`, `app/services/numerology_content.py` |
| 2 — Object numerology | **Built**, incl. public endpoints + shared client. | `app/schemas/numerology.py`, `app/api/public_tools.py`, `packages/shared/src/api/numerology.ts` |
| 3 — Fortune Alignment | **Complete as of 2026-07-27** — NUM-34 was the last item. Chart bridge over `functional_nature.py`; the three doctrine guards are code, not review. | `app/calculations/numerology_alignment.py`, `app/services/numerology_alignment_service.py`, `tests/test_numerology_alignment.py` |
| 3 — Compatibility (NUM-34) | **Built 2026-07-27.** Jathagam Porutham decides; **Peyar Porutham** (பெயர் பொருத்தம்) is read alongside it. Pair relation follows **Cheiro's series (D4)**, not naisargika maitri; Sethuraman's per-partner name↔date harmony ships (D5). Astrology authoritative in three enforced places. | `app/calculations/numerology_compatibility.py`, `app/services/numerology_compatibility_service.py`, `tests/test_numerology_compatibility.py` |
| 4 — Time numerology | **Built and wired.** All three D1 epochs ship; muhurta/naal layering with the "astrology stays authoritative" guard enforced in two places. | `app/calculations/numerology_timing.py`, `app/services/numerology_timing_service.py`, `tests/test_numerology_timing.py` |
| **API layer (3 + 4)** | **Built 2026-07-27**, ahead of the phase order — see §7 "API layer" below. 6 authenticated routes (5 chart-scoped + `POST /numerology/compatibility`, which takes two charts) + 1 public route, typed wrappers, prose gated dark. | `app/api/numerology.py`, `app/services/numerology_service.py`, `packages/shared/src/api/numerology.ts`, `tests/test_numerology_chart_api.py` |
| 5 — Name engine (pada half) | **Pipeline built ahead of schedule** against draft canon; gated, cannot produce user-facing names. | `app/data/nakshatra_pada_akshara.py`, `app/calculations/numerology_naming.py` |
| 5 — Name engine (correction half) | **Built 2026-07-27.** Needs no pada table. NUM-53/54/57 done + `numerology_alignment_required` registered; recommendations withheld pending Tamil review, analysis ships. | `app/calculations/numerology_correction.py`, `app/services/numerology_correction_service.py`, `tests/test_numerology_correction.py` |
| 6, 7, 8 | Not started. | — |

**Flags:** `numerology_engine=False`, `numerology_personal_year_epoch="birthday"` (also accepts `"january"`, `"chithirai"`), `numerology_naming_mode="pada_first"`, `numerology_alignment_required=True`, `numerology_compatibility_basis="cheiro_series"` (also accepts `"graha_maitri"`).

**Two corrections recorded against earlier revisions of this document:**

1. **§3 D1 claimed 1 January rollover is "correct in neither tradition" and a bug. That was wrong** — it is the dominant published convention. Corrected, and `"january"` is now an available option. See rulings D1.
2. **§4 item 1 understated the pada problem.** `tamil_collapse` affects **59 of 108 rows across 21 of 27 nakshatras (55%)**, not ~20% — every ka/ca/ja/ṭa/ta/pa-series row, not only the aspirates. The Tamil substitution rule is a **blocker on baby naming**, not an edge case.

**Remaining blockers:**
0. **A copy of Pandit Sethuraman's *Adhista Vingyanam* (Tamil, 1954)** — added 2026-07-27 and now the **largest** open item. Tamil Nadu follows Chaldean/Cheiro *through Sethuraman*, and nothing in this repo cites him: every ruling here is sourced to Cheiro's English original, to Parashari tables, or to online material. Where he differs he outranks all of them, and he could close D4, NU-05, possibly NU-04, and the NUM-53/54 operation set at once. See rulings D5.
1. **One named Tamil printed source** for the pada table. It is cross-checked against Drik Panchang's Swar Siddhanta (108/108 rows) but `verified` stays `False` — your protocol ranks online tables below print, and it is right to.
2. **Tamil native review** of the root 1–9 and compound 10–52 copy. `CONTENT_REVIEWED = False`; API responses ship numbers + graha names only, no prose.

---

## 1. Why gating comes last

Tier logic in this repo is already centralized (`app/core/tier_limits.py` + `packages/shared/src/constants/tiers.ts`, per `TIER_PLAN.md`). A gate is therefore a thin decorator over a finished engine, not an architectural concern. Designing engine internals around a paywall is what produces crippled abstractions — e.g. an engine that can only ever compute the "teaser" number, or a name scorer that can't explain itself because the explanation was the paid part.

**Rule for this whole plan:** every engine function computes the *complete, honest* result. Truncation for tier is a presentation concern applied at the API boundary in Phase 8.

---

## 2. Ground truth (verified 2026-07-25)

### What does not exist
Grep for `numerolog|chaldean|pythagorean|name_number|life_path` across the repo returns **zero matches**. This is entirely greenfield. No prior art, no legacy to preserve, no migration.

### What already exists and will be reused

| Existing asset | Path | Reused for |
|---|---|---|
| Pada math | `app/calculations/astro.py::pada_from_degree`, `nakshatra_to_rasi`, `PADA_SIZE_DEGREES` | Baby naming (pada aksharam) |
| Nakshatra content corpus | `app/services/nakshatra_content.py`, `nakshatra_content_static.py` | Naming content, bilingual card pattern |
| Muhurta scoring | `app/services/muhurta_service.py::find_best_muhurta_slots` | Lucky dates, marriage dates, launch dates |
| Muhurtham naal matching | `app/services/muhurtham_naal_service.py::match_muhurtham_naals` | Marriage date numerology |
| Porutham / synastry | `app/calculations/porutham.py`, `app/services/synastry_service.py` | Jathagam Porutham, which NUM-34 layers Peyar Porutham over |
| Functional lordship | holistic strength synthesis (G1), `house_lords.py` | **Fortune Alignment Score** (the differentiator) |
| Annual report pattern | `app/services/annual_wrapped_service.py` | Annual numerology report |
| Public unauthenticated tools | `app/api/public_tools.py` | Free calculators / SEO surface |
| Runtime flags | `app/services/feature_flags.py` | Rollout + doctrine modes |
| Bilingual text primitive | `BiText` (used throughout muhurta/panchangam) | All numerology copy |

**Consequence:** roughly a third of the requested feature list is a *scoring layer over engines that already work*, not a new build. That is reflected in the phasing.

---

## 3. Doctrine decisions

**D4 and D5 were added 2026-07-27 with NUM-34 — see the rulings doc.** Three calls were required originally. Two of them are encoded as **string feature flags** following the existing `nadi_parihara_mode` precedent (astrologer live session, 2026-07-14) so that implementation is *not blocked* on the ruling — both branches get built and tested, and the default is flippable via the existing `PATCH /admin/flags/{flag_name}` endpoint.

### D1 — Personal year epoch
**RULED 2026-07-25 — see `NUMEROLOGY_DOCTRINE_RULINGS_2026-07-25.md` D1.**

**Encoding:** flag `numerology_personal_year_epoch`
- `"birthday"` *(default)* — increments on the native's birthday
- `"january"` — increments 1 January; the **dominant published convention** in both Pythagorean and Chaldean practice
- `"chithirai"` — increments at Tamil new year; a minority Tamil view

**Basis for the default:** coherence, not correctness. Vinaadi already computes varshaphala from the solar return (`tajaka.py::find_solar_return_jd`), which is the birthday boundary. Two "your year ahead" features with different year starts would contradict each other inside the same app.

> **Correction.** An earlier revision of this section claimed 1 January is "correct in *neither* tradition" and is the most common bug in numerology software. **That was wrong** — it is the most widely published method. The option now exists.

### D2 — Baby naming precedence
**Question:** In baby naming, does the **nakshatra-pada aksharam** hard-veto candidates, or merely rank them?

**Astrologer position (stated):** pada aksharam is the authentic Thirukanitham method and must lead; Chaldean numerology entered Tamil practice via Cheiro in the early 20th century and is a secondary filter. A number must never override a graha.

**Encoding:** flag `numerology_naming_mode`
- `"pada_first"` *(proposed default)* — only names starting with a valid pada syllable are returned; numerology ranks within that set
- `"pada_weighted"` — pada-valid names rank far higher but non-conforming names may appear, clearly marked

`"numerology_first"` is deliberately **not** offered. It contradicts stated doctrine.

### D3 — Which script scores a name
**Status: IMPLEMENTED under the proposed answer, pending astrologer confirmation.** Unlike D1/D2 this has no flag — it is a single answer, and the code now commits to it. If the ruling goes the other way it is a real (though contained) rework: `score_text` and its tests.

**Question:** Chaldean values are defined over the Latin alphabet. A Tamil name has a different value in English spelling than in Tamil script.

**Answer taken:** name scoring runs on the **English/document spelling** (Aadhaar, passport, certificates), because that is what Tamil Nadu practice actually corrects, and the whole premise of name correction is the *written, used* name. Tamil-script rendering is displayed alongside for readability but is **not** the scored string.

**How it is enforced** (not merely documented):
- `app/calculations/numerology.py::score_text` raises `ScriptMismatchError` on any non-Latin letter rather than skipping it — a silently skipped Tamil character would return a confident wrong number.
- `NumerologyProfile.scored_name` / `scoredName` echoes the exact string scored on every response, so a reading can never be acted on without knowing its input.
- `tests/test_numerology_core.py::test_non_latin_script_is_refused_not_silently_skipped` and `tests/test_numerology_api.py::test_non_latin_name_is_refused_with_422` pin both.

**Note this is the opposite of the pada engine's script rule**, and deliberately so: numerology scores the Latin/document spelling, while pada matching needs the Tamil form (see `app/data/nakshatra_pada_akshara.py` — Latin alone resolves only 94 of 108 padas). Two scripts, two jobs, in the same feature. Any future code that conflates them will be wrong in one of the two directions.

---

## 4. Reference data required from the astrologer

Requested directly, not as multiple-choice — these are data assets I should not invent:

1. **The 108 nakshatra-pada aksharam table.** Starting syllable per pada (Ashwini p1 … Revati p4), in Tamil script, with the romanisation you want displayed. This is the backbone of authentic baby naming and I will not guess it.
2. **Compound number meanings, 10–52.** Cheiro's compound series is the real interpretive layer; single-digit reduction alone is what the junk apps ship. If you have a preferred Tamil source, that source's readings should be the corpus.
3. **Tamil-script letter values** — only if D3 is decided against the proposal above and Tamil-script scoring comes into scope.
4. **Any house/vehicle/mobile number rules you personally use** that differ from generic Chaldean reduction — TN practice has local conventions here.

---

## 5. Architecture

Mirrors the existing `calculations/` (pure) → `services/` (orchestration) → `schemas/` → `api/` layering.

```
app/calculations/numerology.py           # PURE. No DB, no ephemeris, no clock.
                                         # Chaldean table, reduction, compound
                                         # preservation, graha mapping.
app/calculations/numerology_naming.py    # Pada aksharam ↔ candidate matching

app/services/numerology_service.py       # Core profile: the four numbers
app/services/numerology_content.py       # Static bilingual interpretive corpus
                                         # (pattern: nakshatra_content_static.py)
app/services/numerology_alignment_service.py  # Chart bridge / Fortune Alignment
app/services/numerology_timing_service.py     # Personal year/month, lucky dates
app/services/numerology_name_service.py       # Baby naming, correction, business
app/services/numerology_report_service.py     # Annual + monthly reports

app/schemas/numerology.py
app/api/numerology.py                    # Authenticated, chart-aware
app/api/public_tools.py                  # (extend) free calculators, SEO

packages/shared/src/api/numerology.ts    # MANDATORY — see §5.1
web/components/dashboard-numerology-*.tsx
web/app/tools/numerology/*               # Public marketing/SEO pages
mobile/src/api/  (consumes shared client)

tests/test_numerology_core.py
tests/test_numerology_naming.py
tests/test_numerology_alignment.py
tests/test_numerology_timing.py
tests/golden/numerology/*.json
```

### 5.1 API contract policy — non-negotiable

Per `CLAUDE.md`, **every new backend endpoint gets a typed wrapper in `packages/shared/src/api/numerology.ts`**, and all new web/mobile code consumes that wrapper — no fresh direct-fetch call sites. This is a brand-new surface, so there is no grandfathered bypass to inherit. Two shared wrappers have silently drifted from their backend routes historically (`getDailyGuidance`, `registerFcmToken`); when authoring each wrapper, re-read the FastAPI decorator and confirm path shape and HTTP verb.

### 5.2 Persistence

Phases 1–4 are **stateless compute** — no tables. Persistence enters at Phase 5:

- `numerology_name_analysis` — saved name-correction / baby-name sessions (a user returns to compare candidates over weeks)
- Optional denormalized numerology block on the existing birth profile for dashboard reads

Migrations must be reversible with a filled `downgrade()`, per repo rules.

### 5.3 Feature flags

| Flag | Type | Default | Purpose |
|---|---|---|---|
| `numerology_engine` | bool | `False` | Master rollout gate |
| `numerology_personal_year_epoch` | str | `"birthday"` | D1 doctrine |
| `numerology_naming_mode` | str | `"pada_first"` | D2 doctrine |
| `numerology_alignment_required` | bool | `True` | Forces chart cross-check before any name-change recommendation (§9). **Registered 2026-07-27** with the name-correction build |

Registered in `app/services/feature_flags.py::_defaults()` with the same explanatory-comment discipline the existing flags use.

---

## 6. Engine specification

### 6.1 System: Chaldean, not Pythagorean

Tamil Nadu practice is Chaldean. Shipping Pythagorean would be dismissed on sight by any practitioner.

```
1 → A  I  J  Q  Y
2 → B  K  R
3 → C  G  L  S
4 → D  M  T
5 → E  H  N  X
6 → U  V  W
7 → O  Z
8 → F  P
9 → (none — no letter carries 9)
```

**Implementation traps, both of which break naive builds:**

1. **No letter maps to 9.** Nine is held sacred and unassigned. Any auto-generated A=1…Z=26-mod-9 table is wrong. The table above is data, not a formula.
2. **The compound number outranks the root.** 43 and 34 both reduce to 7 and carry different meanings. The engine must return `{compound, root}` for every computed number and **never discard the compound**. Reducing and stopping is the single clearest tell of a low-quality implementation.

### 6.2 The four numbers

| Number | Derivation | Period of strongest effect |
|---|---|---|
| **Psychic / birth** | Day-of-month of birth, reduced | ~1–35 years |
| **Destiny / life path** | Full DOB (D+M+Y) summed | Lifelong |
| **Name number** | Chaldean sum of the document spelling (D3) | The number "correction" targets |
| **Namesake / called-name** | Chaldean sum of the name actually used daily | Often differs from the document name; matters more than users expect |

### 6.3 Number → graha mapping

This is the bridge to the existing jyotisha engine — and the only point where the two systems genuinely touch, because it lands on grahas Vinaadi already models.

| n | Enum key | Tamil display | English display |
|---|---|---|---|
| 1 | `SUN` | சூரியன் | Suriyan |
| 2 | `MOON` | சந்திரன் | Chandran |
| 3 | `JUPITER` | குரு | Guru |
| 4 | `RAHU` | ராகு | Rahu |
| 5 | `MERCURY` | புதன் | Budhan |
| 6 | `VENUS` | சுக்கிரன் | Sukran |
| 7 | `KETU` | கேது | Ketu |
| 8 | `SATURN` | சனி | Sani |
| 9 | `MARS` | செவ்வாய் | Chevvai |

Naming follows the established repo convention (memory: *Tamil Almanac Naming Over Sanskrit*): **enum keys stay Sanskrit/English, display names follow Tamil almanac usage, and the English display romanises the Tamil.**

---

## 7. Phase plan

### Phase 0 — Doctrine & data *(blocking, no code)*

| ID | Work item |
|---|---|
| NUM-01 | Astrologer rules D1 (personal year epoch) |
| NUM-02 | Astrologer rules D2 (pada precedence) |
| NUM-03 | Astrologer rules D3 (scored script) — **must be answered, no flag** |
| NUM-04 | Receive the 108 pada-aksharam table |
| NUM-05 | Receive/approve compound-number corpus 10–52 |

Phases 1–2 can start before Phase 0 closes; Phases 4–5 cannot.

### Phase 1 — Core engine

| ID | Work item |
|---|---|
| NUM-10 | `numerology.py`: Chaldean table, reduction preserving compound |
| NUM-11 | Four-number computation from DOB + name(s) |
| NUM-12 | Graha mapping + bilingual display names |
| NUM-13 | Bilingual interpretive corpus for roots 1–9 |
| NUM-14 | Compound corpus 10–52 (depends NUM-05) |
| NUM-15 | Golden test set (§10) |
| NUM-16 | Register `numerology_engine` flag, default OFF |

**Exit:** given DOB + name, the engine returns all four numbers with compound + root + graha + bilingual reading. Pure, deterministic, sub-millisecond, fully unit-tested.

### Phase 2 — Object numerology

Covers: mobile, vehicle, house numbers. Trivial on Phase 1; highest value-to-effort ratio in the whole plan.

| ID | Work item |
|---|---|
| NUM-20 | Digit-string analyzer (compound + root + graha) |
| NUM-21 | Mobile number analysis (full-number and last-4 conventions) |
| NUM-22 | Vehicle number (alphanumeric plate — letters use Chaldean) |
| NUM-23 | House/door number (incl. alphabetic suffixes: 12A, 4/2) |
| NUM-24 | Public unauthenticated endpoints in `public_tools.py` |
| NUM-25 | Shared client wrappers |

### Phase 3 — Chart bridge · **Fortune Alignment Score**

**This is the differentiator and the moat.** Every competing numerology app scores a number in isolation. Vinaadi is the only product that can check the number against the native's actual jadhagam.

| ID | Work item |
|---|---|
| NUM-30 | Resolve a number's graha to its **functional nature in this chart** (yogakaraka / lagnadhipathi / maraka / badhaka / dusthana lord) — reuse holistic-strength G1 lordship |
| NUM-31 | Alignment score: numerology graha × functional nature × natal strength |
| NUM-32 | **"No change needed"** verdict path (§9 — must be reachable and must actually fire) |
| NUM-33 | Personalized favorable numbers, derived chart-first |
| NUM-34 | Horoscope + numerology compatibility (layers over `porutham.py` / `synastry_service.py`) — **BUILT 2026-07-27.** Needs two charts, so it is `POST /numerology/compatibility` with both ids in the body rather than the `/charts/{id}/numerology/*` shape. See "NUM-34" below |
| NUM-35 | Bilingual explanation of *why* the number and the chart agree or disagree |

**The reading this enables — and the entire marketing story:** *"Your name number is 8 (Sani). In your chart Sani is yogakaraka. Do not change your name."*

### Phase 4 — Time numerology

| ID | Work item | State |
|---|---|---|
| NUM-40 | Personal year (**all three** D1 branches, flag-selected) | Built |
| NUM-41 | Personal month + day | Built |
| NUM-42 | Lucky dates — numerology layer over `find_best_muhurta_slots` | Built |
| NUM-43 | Marriage date numerology — layer over `muhurtham_naal_service` | Built |
| NUM-44 | Muhurtham + numerology combined engine | Built (same layering path as NUM-42) |
| NUM-45 | Business launch score | Built |

**Design note:** these are *scoring layers*, not new engines. Muhurta remains authoritative on the panchangam; numerology adjusts the ranking within an already-valid set. A numerologically ideal date that is astrologically inauspicious must never be recommended.

**How that note became code, in two independent places** — one guard would have been a comment:

1. `numerology_timing.score_date` takes `has_astrological_caution` and refuses to return a *positive* adjustment when it is set. The clamp is surfaced as `clamped_by_astrology`, not applied silently.
2. The service sort keys put the astrological verdict ahead of the number: a slot carrying cautions can never sort above a clean one, and an unrecommended naal can never sort above a recommended one. `is_recommended` is read, never written — numerology cannot promote a chandrashtama date into the recommended set.

The adjustment is bounded at **±8** on the 0-100 scales it layers over (`NUMEROLOGY_ADJUSTMENT_BOUND`); widening it is a doctrine change, not a tuning change. Its sign comes from where the date's number sits in `favourable_numbers_for(lagna)` — the Phase 3 chart-first ranking — never from a number's generic reputation. The layering adds and removes nothing: muhurta decides *which* dates are fit to act on, numerology only reorders that set.

**Other Phase 4 decisions worth recording:**

- **Chithirai is resolved, not assumed.** Puthandu moves with the Sun's sidereal entry into Mesha. Measured over 1960-2060 at the Chennai reference point it lands on 14 April 83 times, 13 April 14 times and 15 April 4 times — so the service scans the Tamil solar calendar for it and the pure engine *raises* rather than defaulting to 14 April. Two tests pin this.
- **Digit convention matches `destiny_number`:** all digits of day + month + governing year (17 May, 2026 → 8 + 5 + 10 = 23). Sources that pre-reduce each component first agree on the root but produce a different **compound**, and the compound outranks the root — so this is a real choice, taken for consistency with the rest of the engine.
- **Leap-day births roll to 1 March** in a common year, not back to 28 February. Documented and tested.
- ~~**No endpoints in this phase**, matching Phase 3.~~ **Superseded 2026-07-27 — see "API layer" below.** The original reasoning (surfaces are Phase 7, so routes wait) conflated two different things: an endpoint is not a surface. Wiring the routes before Phase 5 keeps the engines from running further ahead of anything observable, which this repo has a documented history of.

### API layer for Phases 3 + 4 *(built 2026-07-27, out of phase order)*

| Verb | Route | Phase |
|---|---|---|
| POST | `/charts/{chart_id}/numerology/alignment` | 3 — Fortune Alignment (NUM-30..32) |
| GET | `/charts/{chart_id}/numerology/favourable-numbers` | 3 — personalised favourable numbers (NUM-33) |
| GET | `/charts/{chart_id}/numerology/personal-cycle` | 4 — personal year/month/day (NUM-40, 41) |
| GET | `/charts/{chart_id}/numerology/lucky-dates` | 4 — muhurta layering (NUM-42, 44) |
| GET | `/charts/{chart_id}/numerology/marriage-dates` | 4 — naal layering (NUM-43) |
| POST | `/public/numerology/personal-year` | 4 — free tool, numbers only |
| POST | `/numerology/compatibility` | 3 — horoscope + numerology compatibility (NUM-34), added 2026-07-27 |

Decisions worth keeping:

- **Prose ships dark, structurally.** Every explanation string these engines emit (`reason_ta`, `note_ta`, the name-change recommendation) was drafted by one hand with no Tamil native pass. The fields exist on the response models but are populated only through `schemas/numerology.py::reviewed_prose`, which returns `None` while `CONTENT_REVIEWED` is `False`; every response carries `readingsAvailable` so a client can distinguish "withheld" from "nothing to say". `test_numerology_chart_api.py` walks the whole response tree for any `*En`/`*Ta` key rather than a list of known fields — a Phase 5/6 model that adds a new explanation field is caught by the existing test. A companion test flips `CONTENT_REVIEWED` and asserts the prose *does* appear, so "no leak" cannot pass by the fields simply being absent.
- **The flag is checked before the chart.** Otherwise a flag-off deployment answers 404-for-missing and 403-for-not-yours, and the gate becomes an existence oracle for chart ids. Pinned by a test comparing a real chart's 404 against a nonexistent one's.
- **One flag gate, one chart context.** `numerology_engine` was being read in three places and the chart snapshot loaded in two. Both are now in `app/services/numerology_service.py`; Phase 5 should reach for it rather than adding a fourth copy.
- **POST for alignment, GET for the rest.** The names being scored are the user's own and belong in a body, not in URLs and access logs. Same reason `/public/numerology/personal-year` is a POST despite being a pure read.
- **`favourable_numbers_for` is now a projection of `ranked_alignments_for`**, so the ranked list a surface renders and the bare numbers the timing layer consumes cannot disagree about the order.
- **No `chartId` echo** on these responses — it is already in the path, and leaving it out lets the authenticated and public personal-cycle routes share one response model and one TypeScript interface.

Still owed before Phase 7 can render any of this: the Tamil native review (NUM-74), which is the only thing standing between these routes and a complete reading.

### NUM-34 — Jathagam Porutham + Peyar Porutham *(built 2026-07-27)*

Phase 3 is complete. `POST /numerology/compatibility`,
`app/calculations/numerology_compatibility.py`,
`app/services/numerology_compatibility_service.py`,
`tests/test_numerology_compatibility.py` (44 tests) plus route tests.

**Two doctrine rulings came out of this build — D4 and D5 in
`NUMEROLOGY_DOCTRINE_RULINGS_2026-07-25.md`. Read those first; this section is
the build note, not the reasoning.**

**Not chart-scoped, deliberately.** It reads two charts and neither is
subordinate to the other; `/charts/{id}/numerology/...` would have to elect one
as the subject. Both ids go in the body — the shape
`POST /relationships/compare` already uses for the porutham this layers over. A
chart compared with itself is refused (422) before any load.

**The two instruments are named and ranked, in Tamil (D5).** `astrology` is
**Jathagam Porutham** and decides. `peyarPorutham` is **பெயர் பொருத்தம்** and is
read alongside it, never over it. `authority: "jathagam_porutham"` states the
ranking as a **token**, so it ships while the Tamil corpus is dark and does not
depend on a client's layout; the sentences saying the same thing are gated like
all other prose.

**The pair relation follows Cheiro, not naisargika maitri (D4).** The first
draft read the pair off number → graha → Parashari natural friendship. That was
the wrong instrument: naisargika maitri is a *dignity* rule about a graha in
another graha's sign, not a statement about two people. Cheiro states the
person-to-person doctrine outright — the sympathetic series {1,2,4,7}, {3,6,9}
and {4,8}, with 5 friendly to almost anyone — and Chaldean numerology reached
Tamil practice through him. Flag `numerology_compatibility_basis`, default
`"cheiro_series"`, with `"graha_maitri"` as the second branch.

**Cheiro names sympathies, never enmities — so the layer cannot condemn.**
Measured over the 45 unordered pairs: harmonious 19, supportive 8, neutral 18,
**nothing negative**. Consequence: under the default basis numerology can raise
a compatibility score and can never lower one, and every negative verdict comes
from the poruthams. That is "a number never overrides a graha" carried to its
conclusion. Pinned by
`test_cheiro_basis_can_raise_a_score_and_never_lower_one`.

**Cheiro's 4-and-8 fatalism is refused.** He calls it "the terrible combination"
and fatalistic in marriage; standing ruling 3 bans the 8-and-4 fear trade. Same
call as NU-05: keep his structure (4 and 8 are interchangeable, so they grade
harmonious), drop his doom. Whether Sani or Rahu is heavy for *these two people*
is what their charts answer.

**Sethuraman's name↔date harmony ships per partner (D5).** Each partner's own
name against their own birth date and chart — the Fortune Alignment Phase 3
already computes — arrives as `nameHarmonyA`/`nameHarmonyB`. This is the
load-bearing part of Tamil practice and the first build omitted it entirely: it
compared her numbers with his and never asked whether either person's name
suited them. Reported, **never folded into the pair score** — a one-person
finding must not make a two-person number partly about one person.

**The graha view still ships on every pair, under both bases.** The one thing
the first build got right was that permanent friendship is *asymmetric* — Rahu
counts Venus a friend, Venus counts Rahu an enemy — and which partner carries
the difficulty is the reading. It was merely filed in the wrong drawer, as a
property of the number pair rather than the graha pair. Now
`grahaRegardAToB`/`grahaRegardBToA`/`grahaRelation`, plus `basesAgree` so a
disagreement between the two doctrines is declared rather than hidden.

**The two graha encodings in the repo were checked, not trusted:** `chart_strength`'s
friendship sets and `porutham._GRAHA_RELATION` agree on all 49 classical ordered
pairs, pinned by a test. chart_strength is the one read, because it is the only
one covering Rahu and Ketu — which numbers 4 and 7 are.

**The astrology cannot be overridden, in three enforced places.**
1. `layer_over_porutham` takes the porutham percentage and label as *arguments*
   — no code path produces a reading without the astrology having spoken.
2. A positive adjustment is clamped to zero on any Rajju/Vedha/Nadi dosha or
   CAUTION label, mirroring `score_date`. One-directional, and
   `clampedByAstrology` surfaces it.
3. `overallLabel` is the porutham engine's own label and a `model_validator`
   **refuses to serialise any other value**.

The adjustment bound is imported from the Phase 4 timing layer rather than
redeclared: one answer to "how far may numerology move an astrological score".

**Summary band separated from pair relation.** An aggregate reporting
`one_sided` would read as a finding about a specific graha pair. `CompatibilityBand`
(strong/supportive/neutral/guarded/difficult) is now a distinct vocabulary.

**No porutham prose is echoed** — the astrology arrives as structured facts only.
Its reviewed bilingual summary and ten-kuta breakdown stay on
`POST /relationships/compare`, so the same copy does not live in two models and
reviewed Tamil does not sit beside withheld Tamil under one `readingsAvailable`.

**One name is no name.** The name *pair* is scored only when both are supplied;
weights renormalise over the pairs present. Per-partner name harmony needs only
that partner's own name, so it can appear for one side alone.

**Two chart loads, not four.** `load_chart_context` gained an optional
`snapshot` argument so the service reuses what it loaded for the porutham.

### Phase 5 — Name engine

The highest-effort and highest-liability phase. Requires Phase 0 closed and Phase 3 shipped (alignment is a hard dependency, per `numerology_alignment_required` — **note this flag is still unregistered**; it lands with Phase 5, which is the first phase that can violate it).

| ID | Work item |
|---|---|
| NUM-50 | Pada aksharam ↔ name matching (`numerology_naming.py`, depends NUM-04) |
| NUM-51 | Baby naming — pada-first candidate generation, numerology ranking |
| NUM-52 | Name candidate corpus (Tamil names, meanings, gender, syllable index) |
| NUM-53 | Name correction — spelling variants scored against chart alignment — **BUILT 2026-07-27** |
| NUM-54 | Name optimization engine (ranked alternatives + rationale) — **BUILT 2026-07-27** |
| NUM-55 | Business name analysis — **served today** by `POST /charts/{id}/numerology/alignment` with the business name as `documentName`; a dedicated route buys nothing until the promoter-vs-firm lagna question is answered |
| NUM-56 | Brand naming engine — **not started**, and should not be until Q6 (in-app vs separate B2B line) is decided |
| NUM-57 | **Legal-consequence warning** surfaced with every correction (§9) — **BUILT 2026-07-27**, enforced by a pydantic `model_validator` |
| NUM-58 | Persistence: saved name sessions — **not started**; needs a reversible migration and is the only part of Phase 5 that touches the DB |

**Phase 5 splits in two, and only one half was buildable (verified 2026-07-27):**

*Blocked.* Baby naming (NUM-50/51/52) depends on the pada canon, which is 0/108
verified and whose `assert_canon_usable()` raises outside dev. With
`tamil_collapse` affecting 59 of 108 rows, this cannot produce a user-facing
name at all — it is not a "finish it later" item.

*Built.* Name correction needs no pada table: Chaldean scoring plus the Phase 3
chart bridge, both of which exist and are now reachable over HTTP.

### Name correction — what was built *(2026-07-27)*

`POST /charts/{chart_id}/numerology/name-correction`, over
`app/calculations/numerology_correction.py` (pure) and
`app/services/numerology_correction_service.py`.

- **Variants come from a named, finite operation set**, not a generator. Seven
  `SpellingOperation` members (lengthen vowel, double consonant, add/drop
  aspirate, …), each variant records the operations that produced it, and edits
  are capped at two — past that a "correction" is a different name. **The
  reviewable artefact is the seven rules, not the outputs**, and a test pins the
  exact single-edit set so adding a member cannot pass as a refactor.
- **A benefic name number yields an empty list, not a hedged one.** The search
  never runs. For "Rajesh" (root 8, Sani) that is 6 of 12 lagnas outright, 8 of
  12 once neutral verdicts are included — measured, not asserted. Only spellings
  that *beat* the current one are offered, one per number, ties broken toward the
  smallest change.
- **`numerology_alignment_required` is now registered** (default `True`), as the
  plan anticipated: Phase 5 is the first phase capable of violating §9.1,
  because it is the first one that recommends an action.
- **§9.4 and the prose gate compose rather than conflict.** The legal warning is
  mandatory alongside any recommendation, and it is unreviewed Tamil. So while
  the corpus is dark, **the alternatives are withheld and the analysis still
  ships** — `alternativesWithheldReason: "pending_content_review"`. A client must
  never render that as "your name is fine"; the response keeps
  `noChangeReason` and `alternativesWithheldReason` as separate fields precisely
  so it cannot. A `model_validator` refuses to serialise alternatives without the
  warning in both languages, so the coupling survives a future edit to the route.

### Phase 6 — Reports

| ID | Work item |
|---|---|
| NUM-60 | Annual numerology report (pattern: `annual_wrapped_service.py`) |
| NUM-61 | Monthly numerology forecast |
| NUM-62 | PDF export (`pdf_export_service.py`) |
| NUM-63 | Shareable "Number Identity" card (`share_card.py`) |

### Phase 7 — Surfaces

| ID | Work item |
|---|---|
| NUM-70 | **IA decision:** numerology under the existing **Tools** tab as a sub-view — do *not* add a 12th `Tab` to `web/lib/dashboard-tabs.ts` in v1. The 2026-07-22 IA refactor explicitly resolved against new tabs (D2, Option A). Promote to its own tab in a later pass only if usage justifies it. |
| NUM-71 | Web components (design-system tokens; no accent left-borders; no bilingual title echo) |
| NUM-72 | Public SEO pages under `web/app/tools/numerology/` |
| NUM-73 | Mobile screens via the shared client |
| NUM-74 | Tamil native review of the full corpus |

### Phase 8 — Gating *(deliberately last)*

Only after everything above works end-to-end, ungated:

| ID | Work item |
|---|---|
| NUM-80 | Tier limits into `tier_limits.py` + `tiers.ts` |
| NUM-81 | Pay-per-use products (`vinaadi.ppu.*`) for one-shot transformations |
| NUM-82 | Truncation at the API boundary — **never** in the engine |

Recorded for later, not decided now: the CEO position is that *recurring* items (personal year, monthly, lucky dates, favorable numbers) belong to subscription, while *one-shot transformations* (name correction, baby naming, business naming) are pay-per-use at realistic prices, because they carry no repeat purchase.

---

## 8. Requested features → phase

| # | Requested feature | Phase | Notes |
|---|---|---|---|
| 1 | Baby naming | 5 | Pada-first (D2) |
| 2 | Name correction | 5 | Alignment + legal warning mandatory |
| 3 | Business names | 5 | |
| 4 | Lucky dates | 4 | Layers on muhurta |
| 5 | Personal year forecasts | 4 | D1 flag |
| 6 | Vehicle numbers | 2 | |
| 7 | Mobile number analysis | 2 | |
| 8 | House number analysis | 2 | |
| 9 | Marriage date numerology | 4 | Layers on muhurtham naal |
| 10 | Horoscope + numerology compatibility | 3 | Layers on porutham |
| 11 | **Fortune alignment score** | 3 | **The differentiator** |
| 12 | Name optimization engine | 5 | |
| 13 | Brand naming engine | 5 | B2B — lowest priority |
| 14 | Muhurtham + numerology engine | 4 | |
| 15 | Business launch score | 4 | |
| 16 | Personalized favorable numbers | 3 | Chart-first |
| 17 | Annual numerology report | 6 | |
| 18 | Monthly numerology forecast | 6 | |

---

## 9. Safety & ethics guardrails — enforced in code, not in copy review

These come from the astrologer hat and are **build requirements**, not nice-to-haves.

1. **A number never overrides a graha.** The alignment engine reads the chart *first*. If a name number's graha is a benefic/yogakaraka for the native, no change is recommended regardless of the number's generic reputation.

2. **"No change needed" must be reachable and must actually fire.** If the name engine can never conclude "your current name is well-aligned," it is a slot machine, not an analysis. Add an explicit test asserting this outcome occurs for well-aligned inputs.

3. **The 8-and-4 fear trade is banned.** Scaring users about Sani (8) and Rahu (4) numbers is the most profitable and most corrosive practice in this trade. Sani is the karaka of longevity, discipline, and earned result — not evil. Content lint should flag doom-framing on 4/8 the way `safety_filter` already handles sensitive-tier copy.

4. **Legal-consequence warning ships with name correction or the feature doesn't ship.** Users add letters to legal names, then Aadhaar, bank KYC, passport, and degree certificates disagree. This is real-world harm.

5. **Declare the tradition.** One honest UI line — *"Chaldean numerology, as practised in Tamil Nadu"* — costs nothing and is the difference between a tradition-bearer and a fortune-teller. Vinaadi's brand is authentic Thirukanitham; grafting on an early-20th-century Cheiro import without attribution is exactly the syncretism that discredits us with the serious practitioners whose endorsement we want.

6. **No guarantees.** No "will get", "guaranteed", "become rich". ASCI has acted against astrology advertisers in India and app-store review is unforgiving. Frame as tendency and timing — consistent with how the rest of the product already speaks.

---

## 10. Testing strategy

Domain calculation bugs in this codebase are *silent* — they produce plausible wrong numbers that pass unit tests (memory: *Astrology Calc Accuracy*). Unit tests alone are insufficient.

- **Golden cases** in `tests/golden/numerology/` with expected outputs verified by the astrologer, covering: every Chaldean letter, compound-vs-root preservation, the no-9 rule, both D1 epoch branches, both D2 naming modes, alignment verdicts including the "no change needed" path.
- **Property tests:** reduction is idempotent; compound is never lost; a name and its uppercase/lowercase/whitespace variants score identically; unknown characters are handled explicitly rather than silently dropped.
- **Cross-surface:** `pytest` + `tsc` + `eslint` + web tests + **mobile tsc + jest** (memory: mobile gates belong in the routine set).
- **Script-diff table claims — never eyeball them** (memory: *Nalla Neram Collision Fix*). The Chaldean table and the 108-pada table must be verified by script against the source, not by reading.

---

## 11. Open questions

| ID | Question | Owner |
|---|---|---|
| Q1 | D1 — personal year epoch: birthday or Chithirai 1? | Astrologer |
| Q2 | D2 — pada hard-veto or weighted? | Astrologer |
| Q3 | D3 — scored script: English document spelling (proposed) or Tamil? | Astrologer |
| Q4 | Is there a Tamil source you want the compound 10–52 corpus drawn from? | Astrologer |
| Q5 | Name candidate corpus — license/source for the Tamil baby-name dataset? | PO |
| Q6 | Does brand/business naming stay in-app, or become a separate B2B line (different buyer, ₹5k–25k, no store cut)? | CEO |

---

## 12. Recommended first move

Phases 1 + 2 are unblocked *today* — they need no astrologer ruling and no reference tables beyond the Chaldean table in §6.1. They deliver working mobile/vehicle/house analysis and the four core numbers, which is a demonstrable surface, and they de-risk everything above them.

Phase 0 runs in parallel as a conversation, not a work stoppage.
