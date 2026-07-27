# Vinaadi AI — What It Does and How It Decides Things

*Compiled 2026-07-25 from a full-codebase + doctrine-docs pass (app/calculations, app/services, app/reasoning, docs/Jothidam_AI_*). This is a snapshot of the shipped system, not the aspirational roadmap — placeholders are called out explicitly where found.*

## 1. What tradition it's built on

Thirukanitham / Drik Ganita Tamil Jyothidam, deliberately not mixed with generic Vedic defaults:

- **Ayanamsa**: Lahiri/Chitra Paksha only (`app/calculations/ephemeris.py`), hardcoded — no toggle.
- **Ephemeris**: Swiss Ephemeris (pyswisseph, with a ctypes fallback).
- **Houses**: whole-sign (rasi-as-bhava) as primary; a separate Equal-Bhava (Lagna-degree) module exists as a secondary lens only.
- **Nodes**: mean node (not true node) — an explicit doctrine choice, noted as a divergence from JHora's default.
- **Sunrise/Panchangam**: "Hindu sunrise" (disc-center, no refraction), chosen because Swiss Ephemeris's default (refracted upper limb) drifted ~3 minutes from printed Tamil almanacs.
- **Primary life-timing system**: Vimshottari Dasha.

Rationale documented in `docs/DOCTRINE_DECISIONS_V1.md`: every convention was picked so the panchangam output matches printed Tamil almanacs, not generic astrology-software defaults.

## 2. Calculation pipeline (what actually runs)

- **Chart construction**: birth data → JD → sidereal planetary longitudes → Lagna → whole-sign houses → Rasi/Nakshatra/Pada.
- **Divisional charts (vargas)**: 14 implemented — D2, D3, D4, D7, D9, D10, D12, D16, D20, D24, D27, D30, D40, D45, D60 (`divisional_charts.py`). D27 and D45 are in-code flagged as "not in this project's frozen spec," best-effort pending cross-check.
- **Panchangam**: sunrise/sunset, Tithi, Nakshatra, Yoga, Karana, Vara, Rahu Kalam/Yamagandam/Kuligai, the 16-slot Gowri/Nalla Neram grid, Abhijit Muhurtham, Hora, Chandrashtama, Tamil solar month.
- **Dasha systems — 9 total, but only 1 feeds predictions**: Vimshottari is the sole system wired into scoring (`prediction_score.py`, `dasha_activation.py`, `event_windows.py`). Yogini, Ashtottari, Kalachakra, Jaimini Chara, and 7 conditional-nakshatra dashas are all explicitly documented in their own code as **"display-only — never feeds scoring."** Several of those (Kalachakra, Jaimini Chara, conditional dashas) additionally carry unresolved multi-tradition table disputes not yet astrologer-confirmed. Jaimini Chara Dasha is explicitly labeled "Experimental — non-standard school," barred from feeding any interpretive layer per doctrine.
- **Transits**: live sidereal positions, graduated combustion orbs, cazimi, gandanta, Jupiter/Saturn named transit tables (Ezharai Sani, Kandaka, Ashtama Sani), double-transit corroboration scoring.
- **Ashtakavarga**: full Bhinnashtakavarga + Sarvashtakavarga + Kakshya.
- **Yogas/doshas**: ~35-40 named conditions detected (`_yoga_detect.py`, `_yoga_dosham.py`) — Gaja Kesari, Raja Yoga, Dhana Yoga, Neecha Bhanga (+ its Raja Yoga variant), Pancha Mahapurusha (5 sub-yogas), Budha-Aditya, Vipareetha Raja, 3 Parivartana sub-types, Sevvai/Mangal Dosham, Kalasarpa, Pitru Dosham, Kalathra Dosham, Marana Karaka Sthana, Badhaka, and more.

## 3. How it decides "good" vs "bad" — the actual reasoning kernel

This is the core of "what perceptions it uses." There are two generations of logic in the codebase, and the newer one is now the live default.

**Older, still-present layer** — `prediction_score.py`: a flat 6-layer additive 0-100 score (birth promise 30 + planet strength 15 + dasha activation 25 + varga confirmation 10 + transit support 15 + ashtakavarga 5), mapped to a 6-tier ladder (EXCEPTIONAL/STRONG/GOOD/MIXED/DIFFICULT/VERY_WEAK).

**Live default** — the **reasoning gate architecture** (`app/reasoning/promise_gate.py`, `timing_vote.py`, `contradiction.py`, flag `reasoning_gate = True`):
- **The Promise Gate**: "a dasha can only ripen what the birth chart has already promised." The natal-only signal (house lord + karaka strength, yoga bonus, dosham penalty) is converted to a hard **PASS / WEAK / BLOCKED / SILENT** gate *before* any timing signal is consulted.
- If the gate is **BLOCKED or SILENT**, dasha/transit/varga/ashtakavarga signals are **skipped entirely** — they are never allowed to manufacture an outcome the natal chart didn't promise. This is explicitly the fix for what the doctrine calls "the banned averaging error."
- If **PASS or WEAK**, the remaining timing signals (dasha activation, varga, transit, ashtakavarga) are combined into a **Band**: STRONG / LIKELY / MIXED / WEAK. A WEAK natal gate caps the final band at LIKELY no matter how strong the timing looks.
- **SILENT ≠ BLOCKED**: "the chart hasn't spoken" (insufficient signal) is treated as a distinct epistemic state from "the chart denies this" — worded differently, never penalized in calibration as a wrong answer.
- **Contradiction typing**: when the natal promise and timing signals disagree, it's labeled (`PROMISED_NOT_NOW`, `ACTIVE_BUT_UNPROMISED`, `PARTIALLY_PROMISED`, `MIXED`) rather than silently averaged away.

**Planet/chart strength** (the input to all of the above) comes from `chart_strength.py`: a 0-100 composite blending sthana/dik/kala/chesta/naisargika/drik bala-style components, then adjusted for vargottama, D9 dignity, cazimi/combustion, rasi-sandhi, gandanta, planetary war. A second-pass "Holistic Strength Synthesis" (flag currently **ON**) layers functional lordship, yuti, neecha-bhanga cancellation, and weighted drishti on top, capped at ±22 net.

Worth flagging: a **separate, full classical Shadbala engine** (`shadbala.py`, Virupas/Rupas, BPHS pass/fail thresholds) exists in the codebase but its own docstring says it explicitly does **not** feed the production score — it's an unused/experimental second engine, pending Jagannatha Hora cross-validation.

## 4. What it actually predicts (life-domain catalog)

| Domain | Astrological basis read |
|---|---|
| Career | 10th/6th/2nd/11th lords, lagna lord, dasha lords, Saturn transit |
| Wealth | 11th-house Ashtakavarga bindus of Jupiter, Dhana Yoga, Jupiter transit, dasha lords, Pitru/Rahu-Ketu doshams |
| Health | Lagna(1st)/6th/8th/12th lords; hard age-gated to preventive-only framing under age 12 |
| Marriage | Bhava afflictions, dasha activation, Jupiter aspects, dignity tables, Sevvai dosham age-softening, causal-chain narrative |
| 7 dashboard life areas (family, relationships, education, spiritual, wealth, health, career) | house signification + karaka transit + dasha weighting (maha 70%/antar 30%) + Sade Sati/Chandrashtama penalties |
| Propensities ("Chances & Cautions") | 40+ cards across 6 categories, each tied to a specific house+karaka pair |
| Decisions (A vs B) | keyword-classified scenario → reused what-if evaluation per option |
| Primary concern | age×gender life-phase fused with which houses the running dasha activates |
| Emotional weather | dominant transiting planet's tone template |
| Compatibility/Porutham | classical 10-kuta Dasa Sandhanam, Rajju/Vedhai as hard veto gates |
| Muhurtham | hard filters + weighted score + Tara Bala |
| Remedies | chart-driven selection (afflicted/weak/combust/dusthana planets) from a fixed per-planet catalog |

Explicitly out of scope by product decision, not oversight: death/lifespan prediction (no maraka engine exists at all — "by omission"), named-disease diagnosis, and deterministic marriage/children denial.

## 5. Daily guidance — what wins when signals disagree

`daily_guidance_service.py` blends 5 sub-scores with fixed weights: **Moon/Tarabalam 28%, transit 24%, dasha 19% (maha 45%/antar 30%/friendship 25% within that), panchangam 14%, personal-safety 9%**, plus a small remedial bonus. Nothing "wins" outright in the arithmetic — but **Chandrashtama (Moon in the 8th rasi from natal Moon) forcibly caps the label at BALANCED** regardless of how strong the weighted score reads, and a confidence band (LIKELY/MIXED/WEAK) separately reports how many of {moon, dasha, transit} actually agree, rather than resolving disagreement silently.

## 6. Guardrails — what it refuses to say

- **Banned phrase list**, enforced by `safety_filter.py` → `tone_validator()`: "bad day," "danger," "will fail," "doomed," "trouble ahead," "crisis," "hardship," "inauspicious," etc. — a case-insensitive blocklist run at serve time (logs, doesn't hard-block, since templates are pre-swept by tests).
- **Never**: scientific-proof claims, medical diagnosis, death/longevity predictions, deterministic "no marriage"/"no children," mandatory remedies. Health guidance is explicitly preventive-only.
- **Gemstones**: withheld outright for functionally malefic/maraka placements — framed in the doctrine docs as a deliberate stance against "predatory" commercial-astrology gemstone practice.
- **SILENT vs BLOCKED** wording is kept distinct so a quiet chart is never phrased as a denial.
- Every remedy response carries two disclaimers: remedies are optional/substitutable, and none guarantee an outcome or date.

## 7. The one LLM surface: Ask Vinaadi

Everything above is deterministic — templates keyed on calculated values, explicitly documented as "no LLM required." The single exception is **Ask Vinaadi** (`ask_vinaadi_service.py`), which calls Claude with a system prompt enforcing: use only the supplied Drik Ganita context, apply the triple-confirmation rule (natal + dasha + gochar), lead with a plain GO/WAIT/CAUTION/MIXED/NA verdict, never give medical/legal/financial advice, never invent planetary positions. Its output is the only non-templated text in the product and is the one place the tone-safety check can catch a genuine violation rather than a pre-swept template.

## 8. Known gaps and inconsistencies (worth the founder's attention)

- **Two strength engines**: `chart_strength.py` (production) and `shadbala.py` (full classical, unused/experimental) both exist; not wired together.
- **`holistic_strength_synthesis` flag is ON** in current code, though earlier internal notes describe it as gated off pending astrologer sign-off — worth confirming the sign-off actually happened.
- **8 of 9 dasha systems are decorative** (display-only, never scored) — only Vimshottari drives predictions.
- **Rahu/Ketu aspect convention** (5/7/9 vs. classical) is flagged in-code as "a school choice, not a universal rule," materially changing Kala Sarpa/yoga output — not yet surfaced to users as a methodology choice.
- **D27/D45 vargas** and several conditional dasha tables are best-effort, not cross-checked against a second classical source.
- **Ekadashi/festival dates were hardcoded for 2026 only** — a flagged "silent 2027 failure" pending an algorithmic rules engine.
- **A large share of Tamil remedy/yoga-effect copy is tagged "first-draft, author-written," not yet reviewed by a native Tamil speaker.**
- FCM push and email run in silent "stub mode" without configured credentials — alerts can silently no-op.
- Prediction breadth (~40 propensity cards, ~11 life areas, 13 what-if scenarios) is far short of the doctrine docs' original 300–500-topic ambition; a later planning doc (`PREDICTION_ONTOLOGY_EXPANSION_PLAN_2026-07.md`) deliberately reframes the target down to a ~65-topic curated 12-Bhava grid rather than chasing raw breadth, and explicitly rejects building 40 named-disease or 40 micro-personality-trait cards as a credibility risk.

---

*Sources: `docs/Jothidam_AI_Formula_Engine_Specification_v1_Thirukanitham_2026.md`, `docs/DOCTRINE_DECISIONS_V1.md`, `docs/PREDICTION_DOCTRINE_AND_ROADMAP.md`, `docs/PREDICTION_TAXONOMY.md`, `docs/PREDICTION_ONTOLOGY_EXPANSION_PLAN_2026-07.md`, plus direct reads of `app/calculations/*.py`, `app/services/*.py`, `app/reasoning/*.py`, `app/schemas/chart_explanation.py`, `app/schemas/charts.py`.*
