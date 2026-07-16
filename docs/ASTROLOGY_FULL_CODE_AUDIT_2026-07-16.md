# Full Line-by-Line Astrology Code Audit — 2026-07-16

**Scope:** every line of `app/calculations/` (44 modules, ~13,300 lines), `app/reasoning/` (7 modules),
`app/constants/astrology.py`, plus targeted presentation checks (shadbala_service weekday handling,
`web/lib/gowri.ts` and `web/lib/verdict-lexicon.ts` hand-maintained mirrors).
**Method:** direct source reading and cross-checking against classical Thirukanitham / BPHS / B.V. Raman /
printed-panchangam rules — *not* a re-read of prior audit docs. Every numeric table was re-verified
(sums, anchors, cell spot-checks) independently in this pass.
**Auditor posture:** 50+-years-Tamil-astrologer review — calculation correctness first, presentation honesty second.

**Verdict up front:** the engine is in *very good* shape. The heavy machinery — ephemeris, panchangam
limbs, Vimshottari and all seven+3 secondary dashas, Shadbala, Ashtakavarga, vargas, porutham tables,
gochara/vedha — is classically correct, and the codebase's habit of documenting every convention choice
inline is exactly right. This pass found **no critical calculation bug**. It found **5 medium** findings
(2 genuine domain errors, 3 rule-fidelity gaps), **~15 low** findings, and a catalogue of documented
conventions that are fine but should stay on the astrologer-review radar.

---

## 1. What was re-verified as CORRECT (with the actual checks done)

### 1.1 Foundation — `ephemeris.py`, `astro.py`, `constants/astrology.py`
| Item | Check | Result |
|---|---|---|
| Ayanamsa | Lahiri via Swiss Ephemeris `SIDM_LAHIRI` | ✅ |
| Node type | Mean node, doctrinally documented (§2), JHora caveat noted | ✅ documented convention |
| Ketu | Rahu + 180°, same speed, always retrograde | ✅ |
| Hindu sunrise | disc-center, no refraction, geocentric (`SE_BIT_HINDU_RISING` = 896 fallback verified against swephexp.h) | ✅ (WI-07) |
| Julian Day conversion | Meeus Gregorian algorithm, tz-aware guard | ✅ |
| DST handling | fold-0/fold-1 disambiguation, non-existent time raises | ✅ |
| Nakshatra/pada/rasi indexing | 13°20′/3°20′ with 1e-9 epsilon boundary guard | ✅ |
| Navamsa | movable→same, fixed→9th, dual→5th; verified equivalent to the continuous 108-count (Taurus 0° → Capricorn etc.) | ✅ |
| `nakshatra_to_rasi` | (nak−1)·4+(pada−1) // 9 — 9 padas per rasi | ✅ |
| Chandrashtama | +7 inclusive = 8th | ✅ |

### 1.2 Panchangam — `panchangam.py` (1,772 lines, fully read)
| Limb | Rule in code | Classical rule | Result |
|---|---|---|---|
| Tithi | ⌊(Moon−Sun)/12°⌋+1 at sunrise (udaya) | same | ✅ |
| Nakshatra | ⌊Moon/13°20′⌋+1 | same | ✅ |
| Yoga | ⌊(Sun+Moon)/13°20′⌋+1 | same | ✅ |
| Karana | ⌊(Moon−Sun)/6°⌋; 0=Kimstughna, 1–56 movable cycle, 57/58/59 = Shakuni/Chatushpada/Naga | same | ✅ |
| Rahu kalam slots | Sun 8, Mon 2, Tue 7, Wed 5, Thu 6, Fri 4, Sat 3 (of 8 daytime slots) | standard | ✅ |
| Yamagandam | Sun 5, Mon 4, Tue 3, Wed 2, Thu 1, Fri 7, Sat 6 | standard | ✅ |
| Kuligai | Sun 7, Mon 6, Tue 5, Wed 4, Thu 3, Fri 2, Sat 1 | standard | ✅ |
| Horai | Chaldean order SUN→VENUS→MERCURY→MOON→SATURN→GURU→MARS, first = weekday lord, 12+12 unequal day/night | standard | ✅ |
| Gowri tables | all 14 rows verified as true rotations of the 8-kala master cycle (v27 fix holds) | spec §4.8a | ✅ |
| Muhurtham blocks | Tue/Sat, Amavasai, Rikta {4,9,14} | standard (v28 fix holds) | ✅ |
| Soolam + parigaram | astrologer-corrected v32 values | astrologer-supplied | ✅ |
| Amirdhadhi 7×27 grid | every row covers 27 nakshatras once; Prabalarishta cells cross-checked per v31 notes | source-locked | ✅ |
| Chandrashtama windows | Moon−210° back-mapping, dedup with rasi-window intersection | self-consistent convention | ✅ |
| Lagna nazhigai/vinadi | 24 min / 24 s | standard | ✅ |
| Cache discipline | schema v33, recompute-on-version-change | — | ✅ |

### 1.3 Dashas — every year-table re-summed in this pass
| System | Verification done | Result |
|---|---|---|
| Vimshottari (`dasha.py`) | years total 120; Aswini→Ketu anchor; balance formula; **opening-mahadasha true-start reconstruction** (the classical detail most software gets wrong) present and correct at every sub-level | ✅ |
| Ashtottari (`ashtottari_dasha.py`) | Ardra-adi Raman table: runs 3/3/3/4/3/4/3/4 = 27 ✅; anchors Ashwini/Bharani/Revati→Rahu ✅; 108-year total ✅; two-tradition fork (Raman vs Santhanam-28) documented; applicability = informational verdict, non-gating | ✅ |
| Yogini (`yogini_dasha.py`) | (nak+3) mod 8, remainder 0→8; years 1..8 = 36 | ✅ |
| Kalachakra (`kalachakra_dasha.py`) | **all 16 chakra×pada rows hand-summed against their stated Paramayus (100/85/83/86 …) — every row exact**; pada-fraction balance; antardasha rotation by table-index (handles repeated rasis); Portion-Zero continuation documented | ✅ (still experimental/display-only as labeled) |
| Conditional 7 (`conditional_dashas.py`) | Shodashottari 116 ✅, Dwadashottari 112 ✅ (+reverse janma→Revati count), Panchottari 105 ✅, Shatabdika 100 ✅, Chaturashiti 84 ✅, Dwisaptati 72 ✅, Shashtihayani 60 ✅ with inserted-Abhijit degree blocks (Venus/Saturn boundary at 276°40′) and full-block balance; anchors Pushya/Revati/Anuradha/Revati/Swati/Mula/Ashwini all match BPHS | ✅ |
| Jaimini Chara (`jaimini_dasha.py`) | Savya {1,2,3,7,8,9} / Apasavya {4,5,6,10,11,12} = classical odd-footed/even-footed split ✅; count-minus-1 length, own-sign→12 ✅; Scorpio/Aquarius co-lord ladder documented | ✅ (JHora cross-check still owed — WI-10 known) |
| Chara Karakas (`jaimini_karakas.py`) | 8-karaka scheme, **Rahu degree reversed (30−deg)** ✅, stable-sort dignity tie-break as documented | ✅ |
| Maturation ages | Jup 16, Sun 22, Moon 24, Ven 25, Mars 28, Merc 32, Sat 36, Rahu 42, Ketu 48 | ✅ standard |

### 1.4 Strength — `shadbala.py`, `chart_strength.py`, `ashtakavarga.py`
* **Shadbala**: deep-exaltation longitudes (Sun 10° Ar, Moon 33°, Mars 298°, Merc 165°, Jup 95°, Ven 357°, Sat 200°) ✅; Saptavargaja points 45/30/22.5/15/7.5/3.75/1.875 ✅; panchadha-maitri compound table ✅ (temporal friends 2,3,4,10,11,12); Oja-Yugma (Moon/Venus even) ✅; Kendradi 60/30/15 ✅; Drekkana male/neutral/female thirds ✅; Dig peaks (Jup/Merc→Asc, Sun/Mars→MC, Sat→Desc, Moon/Ven→IC) ✅; Nathonnatha diurnal/nocturnal + Mercury 60 ✅; Paksha with **Moon doubled** ✅; Tribhaga (Merc/Sun/Sat day, Moon/Ven/Mars night, Jupiter always 60) ✅; Vara 45 ✅; Hora 60 via Chaldean-from-weekday-lord ✅; Ayana (24+δ)/48·60 with **Sun doubled** ✅; Chesta: Sun=Ayana, Moon=Paksha ✅, speed-state approximation documented. Omissions (Abda/Masa/Yuddha, sputa-drishti Drik) are documented, not silent.
* **Service-layer weekday**: `shadbala_service.py` correctly converts Python Mon=0 → Sun=0 **and applies the pre-sunrise previous-vara rule** — verified.
* **Ashtakavarga**: per-planet bindu totals recomputed by hand: Sun 48, Moon 49, Mars 39, Mercury 54, Jupiter 56, Venus 52, Saturn 39 → **SAV 337** — exactly the classical totals. Mercury-from-Lagna Phala-Deepika variant and Mars-from-Lagna correction both hold. Rahu/Ketu→Saturn proxy documented.
* **chart_strength**: exaltation/debilitation/MT/own tables ✅; naisargika hierarchy Sun>Moon>Venus>Jup>Merc>Mars>Sat ✅; friendship tables match Parashari exactly (all 7×2 sets cross-checked); Baladi avastha odd/even reversal ✅; combustion gradient + cazimi override (EC-7) ✅; planetary war forward-arc rule (OQ-1 fix) ✅ with Surya-Siddhanta latitude variant documented as deferred.

### 1.5 Vargas & aspects
* D2 (odd: Leo/Cancer), D3 (1/5/9), D4 (part·3), D7 (odd same / even 7th), D9, D10 (odd same / even 9th), D12, D16 (Ar/Le/Sg), D20 (Ar/Sg/Le), D24 (Le/Cn), D30 (asymmetric Mars5/Sat5/Jup8/Merc7/Ven5 + even-sign own-sign mapping), D27 (element quartets), D40 (Ar/Li), D45 (Ar/Le/Sg) — **all match BPHS**.
* `aspects.py`: Mars 4/7/8, Jupiter 5/7/9, Saturn 3/7/10, nodes 5/7/9 (documented project convention), Mandhi 7-only (documented) ✅.

### 1.6 Porutham — every table re-checked cell-by-cell
* Gana (Deva/Manushya/Rakshasa 27 cells) ✅ classical.
* Yoni animals (27 cells) + 7 hostile pairs ✅ classical.
* Nadi zigzag (Aadi/Madhya/Anthya 6-cycle) ✅ classical.
* Rajju tent cycle [1,2,3,4,5,4,3,2,1] → Pada/Kati/Udara/Kanta/Sira groups ✅ classical.
* Vedha 13 pairs (Chitra unpaired) ✅ classical.
* Vasya rasi table ✅ common Tamil table.
* Graha-maitri asymmetric relation table ✅ matches Parashari including all one-way cells (Moon→Merc friend / Merc→Moon enemy, etc.).
* Nadi-dosha v2 cancellation ladder (astrologer-ruled, mode-gated) — logic implements the ruling faithfully; Rajju guard fires independently ✅.
* Label vetoes: Rajju/Vedha force CAUTION at source (porutham) **and** at the compatibility-intelligence headline (WI-21) ✅.

### 1.7 Transits & timing
* Combustion orbs (Merc 14/12R, Ven 10/8R, Mars 17, Jup 11, Sat 15) ✅ classical; Moon excluded with correct Amavasai note.
* Cazimi 0°17′ ✅; combustion severity linear taper ✅.
* Gandanta six 3°20′ zones ✅.
* Sade Sati 12/1/2, Ardhashtama 4, Ashtama 8 ✅.
* Ezharai Sani Murthi: ingress-Moon default (1/6/11 Gold, 2/5/9 Silver, 3/7/10 Copper, 4/8/12 Iron) ✅ with pada-method correctly demoted to labeled regional variant (Doctrine §3).
* **Gochara Vedha table verified against the classical Moorti/vedha grid for all 7 planets** (including Venus's famously irregular row) + Sun–Saturn / Moon–Mercury exemptions ✅.
* Saturn-ingress bisection finder sound (retrograde-loop edge documented).

### 1.8 Reasoning layer (`app/reasoning/`)
Doctrine-clean: promise = veto not weight (D1), ordinal bands never percentages (D2), BLOCKED ≠ SILENT (D3),
contradiction named not averaged (D4), calibration manual-review only (D5), non-fatalistic copy (D6).
No calculation issues. `chart_signature` weights are explicit judgment calls, documented.

### 1.9 Presentation spot-checks
* `web/lib/verdict-lexicon.ts` — **in sync** with `verdict_lexicon.py` (all rungs, both approved irregularities).
* `web/lib/gowri.ts` — **in sync** with the backend Gowri category names/purposes.
* Remedies: Navagraha sthalams, beeja mantras, japa counts (7k/11k/10k/9k/19k/16k/23k/18k/17k) ✅ standard; gemstone gated on functional nature (correct practice); health + no-guarantee disclaimers mandatory ✅.

---

## 2. FINDINGS — Medium (should be fixed or explicitly ruled)

### M-1. Deeptadi avastha labels shifted by one rung — `chart_strength.py:199-213`
`_deeptadi_avastha` maps dignity 80 (own sign) → **MUDITA** and 60 (friend's sign) → **SHANTA**.
Classically: Deepta = exalted, **Swastha = own sign**, **Mudita = friend's sign**, Shanta = benefic
varga, Deena = neutral, Dukhita = enemy sign. The Moolatrikona band (90) consumed the SWASTHA slot and
pushed own/friend down one label each. These are user-facing classical terms on the strength breakdown —
a Tamil-literate user checking a planet in own sign will expect ஸ்வஸ்த (Swastha), not முதித (Mudita).
**Fix:** map MT+own → SWASTHA, friend → MUDITA, neutral → SHANTA or DEENA per source; keep the
documented Vikala/Kopa omission.

### M-2. Sivarathiri dated by sunrise tithi, not nishita — `festivals.py:321-327`
Maha Shivaratri is defined by Krishna Chaturdashi prevailing at **nishita (midnight)**, and on the true
vrata day the *sunrise* tithi is usually still Trayodashi. Keying on udaya tithi 14 labels the **following**
civil day in the common case — the exact same class of error as the already-fixed sunrise-vs-sunset
Pradhosham (issue #10), whose fix added `pradhosham_tithi_number`. Unlike Deepavali/Vinayagar Chaturthi,
this simplification is **not documented** at the rule.
**Fix:** compute a `nishita_tithi_number` (tithi at local midnight following sunrise) and key Sivarathiri
on it — the machinery from the Pradhosham fix generalizes directly. At minimum, document the one-day-late
behaviour and verify 2026 Maasi against a printed panchangam (2026 Maha Shivaratri gazetted date exists to
check against).

### M-3. Node drishti drift: propensities reimplements aspects without Rahu/Ketu 5/7/9 — `propensities.py:108-120`
`_planet_aspects` special-cases only Mars/Jupiter/Saturn; Rahu/Ketu therefore aspect only the 7th inside
all 40 propensity cards, while the canonical `aspects.py` (whose docstring exists *specifically to stop
this drift*) gives nodes 5/7/9. `malefic_hits()` — used everywhere in the card suite — silently
under-counts node aspects, and e.g. `eval_windfall_gains`'s `aspects_house("RAHU", 11)` behaves
differently from every other module's Rahu aspect.
**Fix:** either delegate to `aspects.py` (add a house-frame helper there) or add the node rows locally
with a comment; if node-aspect-exclusion was a deliberate propensity-layer call, document it where
`_planet_aspects` is defined.

### M-4. Vipareetha Raja Yoga misses the own-dusthana case — `_yoga_detect.py:339-347`
`lord_house in dusthana and lord_house != house_num` excludes e.g. the 6th lord in the 6th — but classical
Harsha Yoga is the 6th lord in 6/8/12 **including its own house** (likewise Sarala 8th-in-8th, Vimala
12th-in-12th). Current code only fires on cross-placements.
**Fix:** drop the `!=` exclusion (a dusthana lord in its own dusthana is still VRY), or gate own-house on
strength if the stricter reading is wanted — either way document the school.

### M-5. Activity-timing tithi fall-through grants SUPPORTS to unclassified tithis — `activity_timing_rules.py:171-241`
The docstring's AUSPICIOUS list is {2,3,5,6,7,10,12,13,16,17,20,21,22}, but the code's final `return`
treats *every* tithi not in Rikta/Heavy/Ekadasi/Pournami as favourable — so **Prathama (1)**, 18, 25,
27, 28 read "favourable for this activity". Prathama in particular is classically avoided for new
beginnings (it opens the paksha; Shukla Pratipada is excluded from most muhurtha lists).
**Fix:** make the auspicious set explicit and route the remainder (1, 18, 25, 27, 28) to NEUTRAL.

---

## 3. FINDINGS — Low (paper cuts, edge cases, presentational)

| # | Where | Issue |
|---|---|---|
| L-1 | `panchangam.py:1616` | `amirdhadhi_yogam_next_name` uses **today's** weekday row; when the nakshatra boundary lands after midnight (and especially after next sunrise, for a long nakshatra) the "next" preview should use the next vara's row. Cosmetic-preview field only. |
| L-2 | `_yoga_detect.py:364` | Parivartana MAHA set {1,4,5,7,9,10} omits **2 and 11** — a classical Maha-parivartana includes dhana-house lords (1,2,4,5,7,9,10,11). A 2↔11 exchange currently labels KAHALA/WEAK instead of MAHA/STRONG. |
| L-3 | `_yoga_detect.py:119` | Raja-yoga link checks only trikona-lord → kendra-lord aspect. A kendra lord with a special aspect (Mars/Jup/Sat) one-way onto the trikona lord is missed. Conjunction/7th cases are symmetric so impact is limited to special aspects. |
| L-4 | `_yoga_dosham.py:380-385` | `detect_rahu_ketu_dosham` appends the **protective** marker `d9_seventh_lord_strong` to `conditions_met` (renders under "Triggered factors") instead of `cancellation_factors`. |
| L-5 | `_yoga_dosham.py:961-975` | Putra Sarpa checks only malefics **conjunct the 5th lord** and nodes conjunct Jupiter — never nodes/Saturn occupying the **5th house itself**, contradicting its own "5th house … afflicted" description. Also `is_cancelled=bool(cancellation)` can be True while `is_present` is False. |
| L-6 | `_yoga_detect.py:670` | Daridra yoga `conditions_met` always lists **both** trigger strings when present, even if only one fired. |
| L-7 | `_yoga_dosham.py:637` | Kala Sarpa is rasi-granular: a planet in the **same sign** as a node but beyond its degree still counts inside the arc. Degree-exact Kala Sarpa (the stricter classical test) isn't modeled and the simplification isn't noted in the docstring. |
| L-8 | `jaimini_dasha.py:227-239` | `current_chara_dasha` returns `None` after the first 12-sign cycle is exhausted — total Chara years can be < a person's age, so an older native gets no running period (other dasha modules generate 2-4 cycles). |
| L-9 | `divisional_charts.py:220` | D60 counts **backward for even signs** (spec §3.13). BPHS's common reading counts forward from the sign itself for all signs (JHora default). Display-only; flag for the astrologer with the other varga conventions. |
| L-10 | `chart_strength.py:168-187` | Jagradadi via degree-thirds is a minority formulation; the more common classical rule is dignity-based (own/exalted = Jagrat, friend/neutral = Swapna, enemy/debilitated = Sushupti). Source is cited in-code — keep, but include in the next astrologer session. |
| L-11 | `panchangam.py:980` | `_compute_subha_muhurtham_strict` accepts `abhijit_restricted` and never reads it (dead parameter). |
| L-12 | `birth_conditions.py:188` | `angular_distance(elongation, 180.0) <= 0.0` is only true at exactly 180° — dead clause; the `>= 180-orb` clause does all the work. Harmless, confusing. |
| L-13 | `festivals.py:306` | Every Shukla Sashti is labeled generic "Sashti"; the flagship **Aippasi Skanda Sashti** gets no specific name (Tamil users will look for it). |
| L-14 | `festivals.py:354-357` | Karthigai Deepam requires `special_tithi_day == 15` (pournami-dominant civil day) **and** Krittika nakshatra **and** Karthigai month. Classically the festival is **nakshatra-anchored** (Krittika day of Karthigai month); full-moon proximity is descriptive. In a year where the Krittika day misses the pournami-dominant day the deepam is silently skipped (the test suite notes one kshaya gap — same root cause). Consider nakshatra-anchored rule with pournami as tiebreak. |
| L-15 | `prasna.py:135` | DELAY branch fires for karaka house ∈ {3,6,10,11} — but 10 is simultaneously in the kendra/trikona *positive* set, so a 10th-house karaka yields positive indicator + DELAY verdict. Upachaya-with-10 is a legitimate school, but the two rules disagree internally; pick 3/6/11 for DELAY or drop 10 from the positive set. |
| L-16 | `ephemeris.py:310` / `tamil_calendar.py` | `sun_longitude_at_jd` computes a full 9-body snapshot per call and is bisected ~64× per sankranti search with no memoization (Saturn's finder has `lru_cache`; the Sun's doesn't). Perf-only. |
| L-17 | `astro.py` proleptic-Gregorian JD | `utc_datetime_to_julian_day` applies the Gregorian correction unconditionally — dates before 1582 would be proleptic. Irrelevant for birth charts; noted for completeness. |

---

## 4. Documented conventions (correct as shipped; keep on the astrologer-review ledger)

These were re-read and are *internally consistent + disclosed*. No action needed beyond keeping them
in the standing review list:

1. **Mean node** (vs JHora's true node) — Doctrine §2, in-code caveat present.
2. **365.25-day year** for all dasha arithmetic — uniform everywhere.
3. **Abhijit muhurta = fixed ±24 min** around apparent-noon midpoint (vs day/15 scaling) — documented.
4. **Nalla Neram fixed clock tables** (almanac convention) vs sunrise-scaled Gowri — deliberate dual system, documented.
5. **Moon Moolatrikona 4°–30° Taurus** (vs BPHS 3°) — documented, pending confirmation.
6. **Mercury-from-Lagna BAV row** per Phala Deepika (Tamil primary) — documented; totals still classical.
7. **Dinam 12-count Tamil variant** (17/22/27 excluded), **Mahendra direction** (symmetric-set proof in test), **Stree Dirgha ≥8 lenient**, **Rasi kuta 6/8-only** — all documented with the competing school named.
8. **Ashtottari Raman vs Santhanam-28 fork**, **Kalachakra Portion-Zero continuation**, **Chara 9th-from-pivot direction school** — all documented; Chara still owes a reference-software cross-check (WI-10 note stands).
9. **Tajaka itthasala/isarafa = same-rasi ±5° simplification** — display-only, correctly fenced from scoring (WI-18), full deeptamsa model documented as deferred.
10. **Jeevan/Nethiram** — astrologer-confirmed 2026-07-16; in-repo provenance caveat correctly retained.
11. **Shadbala omissions** (Abda/Masa bala, Yuddha fold-in, discrete Drik) — labeled floor, experimental gate, pending JHora cross-validation.
12. **Whole-sign bhava** primary; equal-bhava explicitly secondary (Doctrine §6).
13. **Kuja dosham house set {1,2,4,7,8,12}** from Lagna+Moon+Venus with Tamil nivarthi ladder — matches docs/SEVVAIRAGU.MD §4.1 (A-5).
14. **Dagda Rasi tithi-keyed Zero-Rasi table** — astrologer-supplied (EC-2); paksha-dependent *primary* burnt sign correctly deferred with an in-code warning.
15. **Nadi parihara strict/lenient mode flag** — implements the A-9 v2 ruling faithfully.

---

## 5. Presentation-layer honesty (verified in this pass)

* **Bilingual discipline** — every user-facing verdict carries ta+en; Tamil verdict lexicon is a single
  shared ladder, and the web mirror matches cell-for-cell.
* **Non-fatalism** — MKS explicitly "not a death prediction" (both languages); severe-loss card is
  insurance/reserves framing; remedies carry mandatory fasting-health and no-guarantee notes; BLOCKED
  copy reads "redirect", never "denied".
* **Ordinal honesty** — bands never percentages in user copy; internal scores marked internal.
* **Silence vs denial** — SILENT vs BLOCKED distinct end-to-end (gate → band → reading).
* **Cache correctness** — panchangam snapshots versioned (v33) so every table correction invalidates
  stale cached verdicts. This discipline is why old fixes actually reach users.

---

## 6. Recommended actions (priority order)

1. **M-2 Sivarathiri nishita fix** — user-visible festival date, cheap to fix with existing machinery. Verify against a printed 2026 panchangam.
2. **M-1 Deeptadi relabel** — classical-term correctness on a live UI surface.
3. **M-5 activity-timing tithi fall-through** — Prathama-as-favourable is the kind of thing a knowledgeable user screenshots.
4. **M-3 node-drishti drift** — one-line table fix or one-line documentation; decide which.
5. **M-4 VRY own-dusthana** — decide the school, then one-line fix.
6. Batch the L-items: L-4/L-5/L-6 (dosham presentational), L-2/L-3 (yoga completeness), L-1/L-11/L-12 (dead code/edge), L-8 (Chara cycle), L-13/L-14 (festival naming/anchoring), L-15 (prasna).
7. Add to the next astrologer session agenda: L-9 (D60 direction), L-10 (Jagradadi formulation), L-7 (degree-exact Kala Sarpa), Chara JHora cross-check, WI-07 printed-panchangam sunrise validation (still the doctrine launch gate).

---

*Audit performed by direct source reading of every module listed; no findings were taken on faith from
earlier audit documents. Where this document says "verified", the specific check performed is named.*
