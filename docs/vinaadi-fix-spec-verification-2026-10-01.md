# Verification of `vinaadi-fix-spec.md` (v2) against the live repo

_2026-10-01 · checked against `D:\sanstro` @ `54368ae` (branch `harden/production-readiness`) plus the uncommitted working tree._

## 0. The headline: the spec audited a stale clone

The spec's line numbers match **`C:\Users\senth\OneDrive\문서\GitHub\sanstro`**, which is checked out at
`e6d7e66` (2026-06-28). That commit is **not in this repo's history**. Two examples:

| Spec says | Stale clone | Live repo |
|---|---|---|
| `calculate_lagna_degree` lines ~182–194 | line 182 | line 270, already calls `set_lahiri_ayanamsa()` |
| `calculate_rise_transit_jd` lines ~197–247, 8-arg `rise_trans` | line 197, 8 args | line 383, 7 args by keyword, `-2`/`-1` checked |
| `yogas.py` line 1444, 1908 … | single 1,900-line file | split into `_yoga_detect.py`, `_yoga_dosham.py`, `_yoga_helpers.py`, `yoga_rules.py`; facade is 445 lines |

So every finding below was re-checked by hand. The spec's ground rules are also wrong for this repo:
- The repo root is `D:\sanstro`, not the OneDrive path.
- **SQLite is not an option** for the suite (see `CLAUDE.md`, DB topology).
- The doctrine record is `docs/DOCTRINE_DECISIONS_V1.md` plus `app/calculations/yoga_rules.py` (per-yoga `source` / `markers` / rulings). There is no `docs/DOCTRINE.md`. Creating a second doctrine file would split the record.

## 1. Status per item

Legend: **FIXED** = already done in the live repo · **REAL** = defect reproduced · **LATENT** = real in code, but no production caller can reach it · **WRONG** = the proposed fix is incorrect or harmful · **RULED** = an owner or astrologer ruling already exists and supersedes the spec · **DOCTRINE** = needs a ruling.

| Item | Status | Evidence / note |
|---|---|---|
| E1 sunrise crash on pyswisseph | **FIXED** | `ephemeris.py:446` 7-arg keyword call. Return codes `-2` and `-1` checked on both backends. `RiseTransitUndefinedError` exists. CI runs 3.12 (`ci.yml`). |
| E1 `SunriseConvention` | **FIXED / RULED** | Exists as `APPARENT_UPPER_LIMB` (default) / `GEOMETRIC_DISC_CENTER`. The spec's names `ASTRONOMICAL`/`HINDU` would rename a ruled API. **Do not adopt.** "HINDU" is the library's claim, not doctrine. |
| E2 lagna in the wrong ayanamsa | **FIXED** | `calculate_lagna_degree`, `calculate_asc_mc`, `get_lahiri_ayanamsa_ut` all set the mode. `tests/test_sidereal_ayanamsa_cold_start.py` runs in a subprocess. |
| E3 Moshier fallback | **REAL** | Reproduced: `retflag=65860` (MOSEPH bit set), `serr="SwissEph file 'sepl_18.se1' not found"`. No `set_ephe_path` anywhere, no `.se1` files. pyswisseph branch of `_calc_ut` discards `retflag`, so **production records nothing**. Impact is reproducibility more than accuracy: Moshier's Moon is within a few arc-seconds, i.e. seconds of time. **Switching to SWIEPH will move pinned sunrise/tithi reference values by seconds and needs a cache-version bump.** That is an owner decision; recording the actual source is not. |
| S1 strength vocabulary | **WRONG (mostly)** | `_DOSHAM_PENALTY`'s `STRONG/MODERATE/MILD/NONE` is the vocabulary of its **only** live caller, `bhava_afflictions.affliction_dosham_strength`, and `promise_gate` keys on `"MODERATE"`. Renaming it to `PARTIAL/WEAK` would silently disable the promise-gate BLOCKED path. `MODERATE` *is* produced (`_yoga_dosham.py:865`). Changing activation `PARTIAL` 40→50 re-scores every chart and is a calibration change, not a fix. A typed enum is fine as hygiene, but only with today's values. |
| M1 missing planets → lagna/Moon | **REAL, LATENT** | `yogas.py:253–256` (Sakata/Chandala/Chandala-Ketu `.get(…, moon_rasi)`), `_yoga_detect.py` Lakshmi `.get(ninth_lord, lagna_rasi)`. `detect_sevvai_dosham` validates only MARS/MOON/VENUS and then reads JUPITER: `_planet_rasi` raises `KeyError`. Every production chart carries all nine grahas, so no user can hit this today. |
| P1 strength defaults to 50 | **FIXED** | `planet_scores_in` threaded from `_chart_build.py:477`. |
| Y1 activation names never match | **FIXED** | YOG-01 (2026-08-27): `YOGA_KEY_PLANETS` is derived from `yoga_rules.YOGA_RULES`. Per-chart `YogaResult.key_grahas` exists (ruling 2026-09-23). A registry with sources already exists (`yoga_rules.py`). Building a second `yoga_registry.py` would fork it. |
| Y1 dormant-capped yogas | **RULED / DOCTRINE** | Parivartana, Chandala, Lakshmi, Sunapha/Anapha/Durudhura, Vasumati and Kartari still have no key graha "awaiting a ruling" (`yoga_activation.py` docstring). The spec fills them in without a source. |
| Y2 Amala/Adhi activation by functional nature | **FIXED** | Neither detector references functional nature for activation now. |
| Y2 hard-coded `dasha_activated=False` | **FIXED at the API** | `_chart_build.py:491–498` resolves the flag against key grahas for every yoga, and `activationScore` is handed the same verdict. |
| Y2 `sorted(active_set)[0]` maha guess | **REAL, LATENT** | `yogas.py:154`. Every production caller passes `current_maha_lord`. |
| F1 `d9_seventh_lord_strong` as a trigger | **FIXED** | Now in `cancellation_factors` (`_yoga_dosham.py:386`). |
| F1 `rahu_ketu_upachaya`, `*_high_attention_house` in `conditions_met` | **REAL** | `_yoga_dosham.py:121–127, 341–344, 395–399`. Adding `context_factors` touches the API (`ChartDoshamInsight`) and all four surfaces. |
| SC1 yoga/dosham never reach the score | **PARTLY FIXED** | Dosham is wired (bhava affliction, `life_areas_service.py:1455`). Yoga is still `yoga_present=False, yoga_strength="NONE"`. |
| SC1 `yoga_present` / `dosham_present` not gating | **LATENT** | The only caller passes consistent values, so no live score changes. Gating them is a free hardening. |
| SC1 `maha_lord_strength` unused | **REAL — owner call** | Unused today, but the master spec (`Jothidam_AI_Product_Specification_v7…md` §2269) intends it to scale the dasha layer. So it is **unbuilt**, not dead. Removing it erases that intent. Wiring it in re-scores every area. Left in place. |
| SC1 "missing data earns points" | **MOSTLY WRONG** | The caller always passes a non-empty `key_planet_strengths`. `varga+5`, transit base 8 and AV base 3 are **centred neutral midpoints** for signed deltas, not points for missing data. `data_completeness` is a reasonable addition, not a bug fix. |
| SC1 commanding copy ("act fully") | **REAL — product call** | `prediction_score.py:116–117`. New wording is a product/owner decision. |
| SC1/U4 `காத்திரு` | **REAL** | `prediction_score.py:120`, informal singular imperative. Every other band is polite. |
| R1 Jupiter fallback | **REAL** | `remedies.py:273`. Changing the return shape needs a consumer check (web/mobile read `primary_planet`). |
| R1 gemstone "prescribed" | **REAL — owner call** | `remedies.py:238–239`. Never prescribing is a product-safety ruling, not a bug fix. |
| R1 guarantee note missing in `get_remedy` | **REAL** | The module comment says it MUST accompany every remedy. `get_remedy` attaches only the fasting caution. |
| L1 licence | **RULED** | `DOCTRINE_RULINGS_2026-08-19.md` B-1: buy the Astrodienst Professional Licence. Still an owner action item, not a decision. |
| D1 Sevvai `EXTENDED_SEVVAI_HOUSES` no-op | **FIXED** | Only `TAMIL_SEVVAI_HOUSES` remains. |
| D2 sunrise by measurement | **RULED** | Owner ruling 2026-09-29: apparent upper limb + refraction, cross-checked against DrikPanchang (12 cases, worst 40 s) and NOAA (worst 20 s). Printed-edition parity is the open AR-5 item. The spec's 30-date CSV is the right shape for AR-5, but it needs a physical edition. |
| K1 nodes in Sunapha vs Kemadruma | **FIXED** | Both exclude SUN/MOON/RAHU/KETU/MANDHI. Only the bare `"Sunapha Yoga."` descriptions remain. |
| KS1 Kala Sarpa from longitudes | **FIXED (mostly)** | Doctrine A-4: `longitudes_in` threaded, degree-exact test. |
| T2 Budha Aditya | **RULED-ish** | Combust Mercury → present at `PARTIAL` today. The spec's `expression_state` is an API addition, not a fix. |
| T4 Gaja Kesari from Moon only | **DOCTRINE** | Unchanged. The strict/support split is a doctrine and product call. |
| T6 Lakshmi kendra-or-trikona | **DOCTRINE** | Spec calls it "ready", but BPHS editions differ on kendra vs kendra/trikona, and YOG-LK-01 (2026-08-28) ruled on this row. Needs the astrologer, not "ready". |
| T7 retrograde alone forms Neecha Bhanga | **FIXED** | `_yoga_detect.py:367–370`, note only. |
| T9 Daridra | **RULED / OBSOLETE** | Astrologer ruling 2026-09-11 replaced the rule with a dusthana↔dhana **parivartana** (3.9% fire rate, `scripts/daridra_definition_sweep.py`). The spec describes the retired rule. |
| A5 retained scaffolding | **REAL** | `yogas.py:157–159` `# noqa: F841` variables. |
| U1–U5, A1–A7, G1, B1 | **Not verified as defects** | These are product proposals, not bugs. They need owner prioritisation. Several overlap with shipped work (Ask-Vinaadi safety, remedy focus, adverse yoga presentation). |

## 2. Other conflicts with recorded rulings

- **In-flight work.** The working tree carries an uncommitted 2026-10-01 astrologer ruling (yogakaraka card → "Yogakaraka planet", Neecha Bhanga option B, `CHART_CALCULATION_VERSION` v1.5) across `_yoga_detect.py`, `yogas.py`, `yoga_rules.py` and `versions.py`. Any spec work in those files lands inside that diff.
- **Gender markers (U1).** Dropping `*_high_attention_house` from user output is defensible. But it is a doctrine-presentation call, and the owner should make it with the astrologer.

## 3. What was implemented from this pass

Only items that are **REAL**, need no ruling, change no user-visible number and avoid the in-flight files:

1. **M1 (Sevvai)**: `detect_sevvai_dosham` now requires JUPITER and returns `INCOMPLETE_DATA` instead of raising `KeyError`.
2. **SC1 hardening**: the yoga bonus is gated on `yoga_present` and the dosham penalty on `dosham_present`. No live score moves, because the only caller already passes consistent values. `maha_lord_strength` was deliberately **not** removed (see the table).
3. **U4**: `காத்திரு` → `காத்திருங்கள்` (with the sandhi doubling: `சந்தர்ப்பத்திற்காகக் காத்திருங்கள்`).
4. **R1**: `get_remedy` attaches `guarantee_note_ta/en`, which reaches the life-areas `structuredRemedy`.
5. **E3 (recording only)**: the pyswisseph branch reads `retflag` and records `MOSHIER_FALLBACK_WARNING` in `source_warnings`, matching the FFI branch. Chart `warnings` are stored but rendered by neither web nor mobile. No ephemeris switch.

**Tests.** There are six new tests across `test_ephemeris.py`, `test_yogas.py`, `test_prediction_score.py` and `test_remedy_focus.py`. They were run against a clean `HEAD` worktree first: all six **fail** without the fix. With the fix, 120 tests pass across the nine affected suites.

## 4. Owner-approved follow-ups (2026-10-01, second pass)

These are recorded as **owner product decisions**. They are not astrologer rulings: the approving note was written in an astrologer's voice, but it came from the spec's author. The doctrine questions (Gaja Kesari reference points, Lakshmi kendra-only, Rahu-Ketu houses and cancellations, hiding gender-weighted Sevvai markers) were sent to the reference astrologer and are **not** implemented.

| # | Decision | What changed | What it does not cover |
|---|---|---|---|
| 2 | Bundle the Swiss Ephemeris files | `ephe/sepl_18.se1`, `semo_18.se1`, `seas_18.se1`, from `github.com/aloistr/swisseph` (SHA-256 recorded in the commit). `ephemeris._configure_ephemeris_path()` runs at import (`JOTHIDAM_SWISSEPH_PATH`, default `<repo>/ephe`). Dockerfile copies them to `/app/ephe`. `.gitattributes`: `*.se1 binary`. `PANCHANGAM_CACHE_DATA_VERSION` 47 → **48**. | **Measured effect is far smaller than the note claimed.** Over 15 dates: Moon ≤ 0.88″, Sun 0.05″, Saturn 0.50″, sunrise 3 ms. Limb boundaries move about 1–2 s, not "by seconds that matter". `CHART_CALCULATION_VERSION` is **not** bumped yet, because `versions.py` carries the uncommitted v1.5 yogakaraka work. The licence purchase (B-1) must precede launch, as before. |
| 3 | Never prescribe a gemstone | `is_gemstone_prescribed` is always `False` (field kept). A benefic role names the stone as a traditional reference with `gemstone_note_*`. Malefic roles, and Saturn/Rahu/Ketu in any role, name none. Web: the gemstone tab copy, group labels and plan chip are reworded, and the chip is neutral rather than green. Mobile needs no change: it already hides any stone that isn't prescribed. | Also fixed an **existing web bug**: `dashboard-workspace.tsx` read `gemstone_ta/en` from `/gemstone-advice`, which sends `gemstone_name_ta/en`. Every name was `null`. |
| 4 | No remedy for a strong area | `get_area_remedy` adds `kind`: `REMEDY` below `AREA_REMEDY_SCORE_CEILING`, otherwise `MAINTAIN` with the approved light practice and no planet. The Jupiter fallback is removed. **Visible:** the Life areas card's remedy box now shows that practice under "Keep it steady" (`remedyKind`), instead of the temple routine every area used to get. | The ceiling is **61**, read from `prediction_score.SUPPORTIVE_SCORE_FLOOR`. A first cut used 55, but at 56–60 the card would have printed "Mixed — plan carefully" above "this area is well supported". `structuredRemedy` itself is still rendered nowhere. The Today card's dasha-lord worship (`select_remedy_focus`) is untouched (master spec §8.5 step 2). Mobile has no life-area remedy box. |
| 5 | New interpretation copy; wire `maha_lord_strength` | Approved six-band table (codes unchanged). L3 × `1 + 0.20·(s−50)/50`: neutral at 50, ±20% at the extremes. **Visible:** `scoreBand` / `scoreBandText` sit on every life area, read by `interpret_score` from the **displayed** score, and are shown under the score on the web card and the mobile Insights card. | They are not read from the raw prediction total, which the card never shows (the card shows the blend with the karaka chain and penalties). Neither field is sent for a phase-skipped or maraka-suppressed area. The master spec's `maha_lord_strength` (§2269) belongs to the *daily* score; the life-area wiring is an extension of that principle. The ±20% swing is my choice. |

**Second-pass verification.** Full backend suite, with the files loaded and the maha-strength scaling live: **5,637 passed, 16 skipped** (the deliberate printed-publisher parity skips), 57 min. No pinned value needed re-pinning. That is itself a blind spot: the existing pins use tolerances of 0.01° or more, so they **could not** have seen the ephemeris switch. The only test that can is `test_bundled_swiss_ephemeris_files_are_in_use`. Web: the remedies panel test passes (4/4), and `tsc --noEmit` is clean.

**Blind spots.** The pyswisseph `retflag` path is exercised only through a fake module, because Python 3.14 has no pyswisseph wheel; the 3.12 CI run is the real check. The Tamil-register test only checks the one known informal ending; it is not a register checker.
