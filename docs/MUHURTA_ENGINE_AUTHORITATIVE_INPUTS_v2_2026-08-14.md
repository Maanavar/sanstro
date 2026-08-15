# Vinaadi Muhurta Engine — Authoritative Thirukkanitham Inputs (v2.3, Consolidated)

**Date:** 2026-08-14
**Status:** Working specification. Supersedes v1, v2, v2.1, v2.2, and all five review rounds. v2.3 changes: fixed RULE_PRECEDENCE bhanga-ordering bug (exceptions now resolve above the primary rule they modify); separated policy_class from severity so HIGH_PRIORITY_RESTRICTION is no longer a stray seventh severity; CONFIRMED_WITH_CONDITION now eligible for PRIMARY_TEXT_CONFIRMED; removed the "yogas override" presumption.

> **STATUS UPDATE (2026-08-14, same day):** Priority-queue item 1 (Kalaprakasika Ch. XIV marriage) is now complete —
> see `docs/MARRIAGE_EXTRACTION_WORKSHEET_KALAPRAKASIKA_CH14_2026-08-14.yaml`, verified against 20 user-supplied
> page images (pp. 68–87). Six of the eight worksheet records graduated to `PRIMARY_TEXT_CONFIRMED`; one
> (8th-house vacancy) was **CONTRADICTED**, not confirmed — the marriage chapter gives a graha-specific rule
> (Saturn/Sun/Mars in 8th = good), not a blanket vacancy requirement. Several items this document marks
> `PENDING` below (marriage 11-star list, marriage lagna signs, marriage tithi list, Guru/Sukra asthangata
> buffers) are consequently now sourced with page citations — treat the worksheet as authoritative over this
> document wherever the two disagree, and see `app/data/marriage_muhurta_rules.py` for the encoded values.

**Provenance classes used throughout** (aligned with Vinaadi's existing taxonomy):

- `CONFIRMED` — verified against Kalaprakasika primary text (Subramonia Iyer translation, Internet Archive copy) in this review cycle
- `TRADITIONALLY_REPORTED` — widely attested in Tamil/South Indian practice; primary-source citation not yet located
- `PENDING` — specific claim awaiting verification against Kalaprakasika Ch. XIV or another primary text
- `ENGINE_CONCEPT` — engineering construct, no traditional authority claimed; numbers are tunable, never presented as sastra

**Master principle (freeze this first):**
The correct rule primitive is `RULE(activity, factor, context, person/profile)`, never `FACTOR = GOOD/BAD`. Kalaprakasika itself is organized as per-activity chapters, each with its own nakshatra, tithi, vara, lagna, and house-vacancy prescriptions — including explicit per-activity *exceptions* to otherwise serious rules (see §Q-Combustion). Do not build "Tamil Muhurta" out of generic labels (Fixed = good, Tikshna = bad, Rikta = bad, Kuligai = bad).

**Severity vocabulary:** `HARD_VETO`, `SEVERE_PENALTY`, `PENALTY`, `NEUTRAL`, `BONUS`, `STRONG_BONUS`. Bonuses at any level can never cancel a veto at a higher level. This enum is the *effect*. Do not add members to it. Priority/classification labels such as `HIGH_PRIORITY_RESTRICTION` are a **separate axis** (`policy_class`), never a severity value: a rule carries both, e.g. `policy_class: HIGH_PRIORITY_RESTRICTION` + `severity: HARD_VETO` (or `SEVERE_PENALTY`) once the source settles the effect. Keeping them separate prevents a stray seventh severity from leaking into the effect enum.

---

## Q1. Durmuhurtham — offsets and durations per weekday

**Architecture — FREEZE:**

- Never store fixed clock times. Compute from local sunrise/sunset per location.
- Daytime muhurta duration: `D = (sunset - sunrise) / 15`
- Muhurta k: `start = sunrise + (k-1)*D`, `end = sunrise + k*D`
- Night muhurta duration (for Tuesday's night Durmuhurtham): `N = (next_sunrise - sunset) / 15`
- Engine treatment: `HARD_VETO` for the initiation moment of Subha Karya (marriage, griha pravesham, business inauguration, property execution, vehicle first use, gold purchase, major investment, naming, samskaras). Routine activity already in progress need not stop.

**Weekday offset table — DO NOT FREEZE. Status: BLOCKER `DURMUHURTHAM_TABLE_VALIDATION`.**

Published sources circulate at least two internally consistent conventions. Do NOT anoint either before empirical validation — register both as named variants and let the diff against Tamil panchangams decide. (Note: variant B's supporting citations are Telugu-panchangam-adjacent; Telugu convention is not automatically Tamil convention.)

| Weekday | Variant A (DrikPanchang-style timings) | Variant B (sunrise-offset rule set) |
|---|---|---|
| Sunday | 14 | 14 |
| Monday | 9, 12 | 12, 14 |
| Tuesday | 4 + night 7 | 4 + night 7 |
| Wednesday | 8 | 8 |
| Thursday | 6, 12 | 6, 12 |
| Friday | 4, 9 | 4, 12 |
| Saturday | 3 | 1, 2 |

Arithmetic cross-check for validators: under a nominal 6:00 sunrise / 12-hour day, muhurta k starts at `6:00 + (k-1)*48min`. Variant A Saturday 07:36 start → muhurta 3; Variant B Saturday "sunrise + 0h" for 1h36 → muhurtas 1–2. Variant A Friday 08:24/12:24 → 4 and 9; Variant B Friday "+2h24/+8h48" → 4 and 12. The validation run resolves per weekday — the winning table may mix rows from both variants.

**Validation protocol before freezing:**
20–30 sample dates × multiple seasons × Tamil Nadu locations (Chennai, Madurai, Coimbatore, Tiruchirappalli). Generate predicted intervals from each candidate table; diff against (a) DrikPanchang and (b) at least one established printed Tamil Thirukkanitham panchangam. Freeze whichever offsets reproduce published Tamil timings. DrikPanchang is a comparison dataset, not a doctrinal authority.

---

## Q2. Nakshatras per activity

**Architecture — FREEZE:**

Two-layer schema: `nakshatra.nature` (the sevenfold classification) **plus** `activity × nakshatra` suitability tables. The activity-specific prescription always overrides the generic nature classification. This is not optional: Kalaprakasika's marriage list (per current reading) includes Magha (Ugra) and Mula (Tikshna), which a naive "Ugra/Tikshna = reject" rule would wrongly exclude.

**Sevenfold nature classification (standard, uncontested):**

- Dhruva/Fixed: Rohini, Uttara Phalguni, Uttara Ashadha, Uttara Bhadrapada
- Chara/Movable: Punarvasu, Swati, Shravana, Dhanishta, Shatabhisha
- Kshipra/Swift: Ashwini, Pushya, Hasta
- Mridu/Gentle: Mrigashira, Chitra, Anuradha, Revati
- Tikshna/Sharp: Ardra, Ashlesha, Jyeshtha, Mula
- Ugra/Fierce: Bharani, Magha, Purva Phalguni, Purva Ashadha, Purva Bhadrapada
- Mishra/Mixed: Krittika, Vishakha

**Marriage list — Kalaprakasika profile (11 stars). Status: PENDING (Ch. XIV verification; both AI reviewers converge on this list but neither has confirmed against the printed page):**

```
MARRIAGE_NAKSHATRA_KALAPRAKASIKA = [
  ROHINI, MRIGASHIRSHA, MAGHA, UTTARA_PHALGUNI, HASTA,
  SWATI, ANURADHA, MULA, UTTARA_ASHADHA,
  UTTARA_BHADRAPADA, REVATI
]  // count = 11
```

- Magha-1 / Mula-1 (and possibly Revati-4) pada exclusions: `TRADITIONALLY_REPORTED`, do **not** hard-code until a primary source is identified. TODO item stands.
- Offer the conservative pan-Indian list (no Magha, no Mula) as an alternate school profile behind a config flag.

**Per-activity lists CONFIRMED from Kalaprakasika early chapters (use verbatim):**

- **Namakaranam (naming):** Ashwini, Rohini, Mrigashira, Ardra, Punarvasu, Pushya, Uttara Phalguni, Hasta, Swati, Anuradha, Shravana, Dhanishta (Sravishta), Shatabhisha, Revati. Note Ardra appears here despite being Tikshna — further proof activity tables override nature classes.
- **Annaprasana (first rice):** Ashwini, Rohini, Mrigashira, Punarvasu, Pushya, Uttara Phalguni, Hasta, Chitra, Swati, Anuradha, Uttara Ashadha, Shravana, Dhanishta, Shatabhisha, Uttara Bhadrapada, Revati. Explicitly avoid: Ardra, Krittika, Jyeshtha, Bharani, Ashlesha, Purva Phalguni, Purva Ashadha, Purva Bhadrapada.
- **Ear-boring:** Mrigashira, Ardra, Punarvasu, Pushya, Hasta, Chitra, Shravana, Dhanishta, Revati. Nakshatra-sandhi (junction between two stars) inauspicious.

**Other activity rows (business, vehicle, travel, education, contracts, etc.):** retain the v1 matrix as `TRADITIONALLY_REPORTED` working defaults, replacing each row with the corresponding Kalaprakasika chapter list as chapters are read (the book has dedicated chapters for treasure/gold, land, foundation, travel, new clothes, new ornaments, agriculture, etc.).

---

## Q3. Gold/valuables as a separate activity

**Yes — FREEZE the enum split:**

```
PURCHASE_GENERAL
PURCHASE_GOLD_VALUABLES
PURCHASE_VEHICLE
PURCHASE_PROPERTY
PURCHASE_EQUIPMENT
```

For `PURCHASE_GOLD_VALUABLES`, upweight: Jupiter, Venus, 2nd and 11th bhavas, dhana indications, Pushya/Rohini/wealth-supportive stars, Sampat Tara, Guru/Shukra hora. Kalaprakasika Ch. XXI ("To Lay Up Treasure") covers gold, grain, gems, land, cattle, loans — read it before freezing the gold star list (`PENDING`).

**Calendar overlays — FREEZE the mechanism:**

```
CALENDAR_OVERLAY: AKSHAYA_TRITIYA, GURU_PUSHYA, SHUKRA_PUSHYA, ...
overlay = STRONG_BONUS   // never bypass_all_rules
```

An Akshaya Tritiya window inside Chandrashtama or Vadha Tara remains rejected.

**Kuligai/Gulikai — activity-conditional policy, not a universal veto:**

```
KULIGAI_POLICY:
  MARRIAGE / GRIHA_PRAVESHAM / NAMING / FIRST_JOURNEY  => AVOID
  GOLD_ACCUMULATION / ASSET_ACCUMULATION               => SCHOOL_DEPENDENT
  RECURRING_PROSPERITY                                  => POSSIBLE_BONUS (Tamil profile)
  DEBT_INITIATION                                       => STRONG_AVOID
```

Rationale (`TRADITIONALLY_REPORTED`): Tamil tradition holds that what is done in Kuligai kaalam recurs/multiplies. A positive Kuligai treatment must never bypass higher veto layers: good Kuligai + Chandrashtama = REJECT. Surface this as an explicit school setting; never default it silently.

---

## Q4. Vipat, Pratyak, Vadha Tara — veto or penalty?

Navatara counted inclusively from Janma Nakshatra: 1 Janma, 2 Sampat, 3 Vipat, 4 Kshema, 5 Pratyak, 6 Sadhana, 7 Vadha/Naidhana, 8 Mitra, 9 Parama Mitra.

**Default engine treatment — FREEZE the split between traditional fact and engine policy.** These are two provenance-distinct claims and must not share a source record:

```
traditional_fact:  tara ∈ {VIPAT, PRATYAK, VADHA} classification = ADVERSE
                    // TRADITIONALLY_REPORTED / PRACTICE_CONSENSUS
engine_policy:      the severity mapping below is Vinaadi's product decision,
                    not sourced doctrine, unless a passage explicitly says
                    "reject the muhurta absolutely"   // ENGINE_POLICY
```

Severity mapping (engine policy):

- **Vadha/Naidhana (7):** `HARD_VETO` for personalized major auspicious beginnings
- **Pratyak (5):** `SEVERE_PENALTY`; promote to veto for marriage, griha pravesham, major samskara, property, major investment, gold/high-value purchase
- **Vipat (3):** `PENALTY`–`SEVERE_PENALTY`; promotable to veto for highly ceremonial activities
- Strict mode: `strict_tarabala = true` → all three = VETO (Acharya profile)

**Two-party rule for marriage — FREEZE:**

```
bride_tara, groom_tara computed independently
if bride.VADHA or groom.VADHA: REJECT
else: combined_penalty = bride_penalty + groom_penalty
```

Never compute a single marriage tarabala.

**Three-navaka severity weighting — ENGINE_CONCEPT, keep configurable, do NOT present as tradition:**

```
NAVAKA_1 adverse × 1.00 | NAVAKA_2 × 0.75 | NAVAKA_3 × 0.50   // tunable placeholders
```

The directional idea (first navaka gravest) is `TRADITIONALLY_REPORTED`; the specific ratios are invented and must not be frozen without source validation.

---

## Q5. Chandra Bala

Count transit Moon's rasi inclusively from Janma Rasi. **FREEZE:**

| Position | Treatment |
|---|---|
| 3, 6, 10, 11 | STRONG_BONUS (11 = excellent) |
| 1, 7 | BONUS |
| 2, 5, 9 | NEUTRAL / small penalty, context-sensitive |
| 4, 12 | SEVERE_PENALTY |
| **8** | **HARD_VETO — Chandrashtama** |

Chandrashtama is not compensable by any aggregate score — arguably the most rigorously observed rule in Tamil household practice. For marriage: check bride and groom independently; neither party's Chandrashtama is offset by the other's excellent Moon.

---

## Q6. Muhurta Lagna — 2nd/11th strength, lagna suddhi, sign preference

**2nd/11th strength: bonus, never a prerequisite — FREEZE.** General engine: `BONUS`. Gold/investment/business: `STRONG_BONUS` / important criterion. But an excellent Pushya + clean Tara + clean Chandra Bala + clean lagna is never discarded solely for a middling 11th lord.

**Lagna suddhi (the mandatory layer) — provenance-split, FREEZE the split:**

- **Marriage 7th-house vacancy:** `planet_in_7th_from_muhurta_lagna => VETO`. Status: `PENDING` against Ch. XIV directly, but treat as the working hard rule (both reviewers agree; consistent with the text's pattern).
- **Marriage 8th-house vacancy:** `TRADITIONALLY_REPORTED`, primary verification pending. Note: 8th-vacancy IS `CONFIRMED` as an explicit Kalaprakasika rule for **naming** and **ear-boring** ("The 8th house, from the rising sign, at the time, should be unoccupied") — so it is a genuine per-activity Kalaprakasika device; only its marriage-chapter instance awaits citation.
- Malefic affliction to lagna: grounds for rejection regardless of house-lord strength (`TRADITIONALLY_REPORTED`).

**Lagna sign preference — ACTIVITY_SPECIFIC, never global. FREEZE the architecture; hold the marriage contents:**

- `CONFIRMED`: Namakaranam prefers fixed signs (Taurus, Leo, Scorpio, Aquarius), common signs acceptable with a benefic. Father's first sight of child: fixed rising sign with dignified Moon.
- **Correction to v1/review-1:** "Sthira lagna preferred" is NOT a universal marriage rule. ChatGPT reports Kalaprakasika Ch. XIV gives marriage BEST = Gemini, Virgo, Libra; AVOID = Aries, Scorpio, Capricorn, Pisces; MIDDLE = rest. Status: `PENDING` (not yet read in the primary text by either party). Encode as the working Kalaprakasika-profile default, tagged PENDING.

```
lagna_preference = ACTIVITY_SPECIFIC   // frozen
MARRIAGE (Kalaprakasika profile, PENDING):
  BEST: GEMINI, VIRGO, LIBRA
  AVOID: ARIES, SCORPIO, CAPRICORN, PISCES
  MIDDLE: TAURUS, CANCER, LEO, SAGITTARIUS, AQUARIUS
```

---

## Q7. Tie-break — deterministic lexicographic hierarchy

**FREEZE.** Never a single 0–100 score; some defects can never be numerically cancelled.

```
L0 - ASTRONOMY / THIRUKKANITHAM
     sunrise/sunset, planetary longitudes (via configured ephemeris engine
     + ayanamsa profile — see CALCULATION_CONFIG below),
     tithi, nakshatra+pada, yoga, karana, Moon rasi, lagna/navamsa,
     combustion & heliacal visibility

L1 - ACTIVITY CALENDAR GATES
     Tamil solar month × activity, ayana, seasonal restrictions,
     Guru/Sukra visibility rules

L2 - ABSOLUTE TIME VETOES
     eclipse; Durmuhurtham; Varjyam/Thyajyam per profile;
     Vishti where prohibited; prohibited tithi; prohibited nakshatra/pada;
     Gandanta where strict; Rahu Kalam / Yamagandam per activity

L3 - PERSONAL VETOES
     Chandrashtama; Vadha Tara; personal Guru/Sukra requirements;
     bride AND groom rules for marriage

L4 - MUHURTA LAGNA SUDDHI
     activity-specific lagna preference; forbidden occupied houses (7th/8th
     per activity); lagnesha; Moon; malefic/benefic placements; event bhava

L5 - PANCHANGA QUALITY
     preferred tithi / nakshatra / vara / yoga / karana per activity table

L6 - ACTIVITY SIGNIFICATORS
     marriage: 7th, Venus, Jupiter | gold: 2/11, Jupiter, Venus |
     property: 4th, Mars | education: 4/5/9, Mercury/Jupiter |
     business: 2/7/10/11, Mercury/Jupiter

L7 - ENHANCERS
     Guru/Sukra hora; Pushya overlays; Akshaya Tritiya; Siddha/Amrita
     yogas; Kuligai activity-positive rule (Tamil profile)

L8 - PRACTICAL WINDOW QUALITY
     margin from nearest transition (nakshatra/tithi end, Rahu start,
     Durmuhurtham start, Varjyam start, lagna sandhi);
     minimum duration; reasonable local clock time

L9 - DETERMINISTIC TIE-BREAK
     lexicographic quality → largest boundary safety margin → earlier window
```

Invariant: **no bonus at L5–L7 ever cancels a veto at L1–L4.** For gold hora preference: Guru > Shukra > Budha, applied only after higher levels are clean.

**CALCULATION_CONFIG — three layers, never conflated:**

```
CALCULATION_SYSTEM:  THIRUKKANITHAM            // the doctrinal claim
EPHEMERIS_ENGINE:    SWISS_EPHEMERIS           // ENGINE_CONCEPT — implementation choice
AYANAMSA_PROFILE:    LAHIRI                    // configurable; Vinaadi's verified default
                                               // per calculation spec v4
```

"Thirukkanitham" ≠ "Swiss Ephemeris + Lahiri." The former is the doctrinal system; the latter two are how Vinaadi implements it. This separation matters most near boundaries (nakshatra/pada/tithi endings, Chandrashtama entry, lagna sandhi, Varjyam), where small calculation-policy differences flip results. Task 5 in the priority list validates that this config actually reproduces the Tamil Thirukkanitham panchangam reference the product claims compatibility with.

**RULE_PRECEDENCE — architecture-frozen invariant.** When multiple rules touch the same (activity, factor, moment), resolve in this fixed order; a lower level never overrides a higher one:

```
1. explicit activity-specific exception / bhanga   (e.g. Annaprasana waives combustion)
2. explicit activity-specific primary rule         (e.g. Namakaranam permits Ardra)
3. school / profile-specific rule                  (Kalaprakasika vs pan-Indian)
4. general Subha Karya rule
5. generic nakshatra / tithi nature class          (Tikshna, Rikta, etc.)
6. engine heuristic
```

Bhanga/exception sits at level 1, ABOVE the primary rule it modifies — otherwise it could never do its job (a v2.2 bug: with bhanga below the primary rule, "lower never overrides higher" made every exception dead code). A bhanga is by definition a licensed override of a stricter rule, so it must win.

**Preferred implementation:** rather than relying on cross-rule precedence, attach exceptions directly to the primary rule so the override is local and auditable:

```yaml
rule:
  effect: VETO
  exceptions:
    - when: <condition>
      effect: ALLOWED
```

Then RULE_PRECEDENCE only has to resolve genuinely *separate* rules, and bhanga logic never depends on global ordering. The precedence list remains the tie-breaker for independent rules; the master principle still holds mechanically — a generic Tikshna label (level 5) can never override an explicit activity prescription (levels 1–2). The no-cancellation severity invariant (bonuses L5–L7 never cancel vetoes L1–L4) operates *within* whichever rule wins here.

---

## Modules beyond the original seven questions

### M1. Guru/Sukra Asthangata (combustion) + Balam — highest-priority new module

Three independent dimensions per planet; never collapse into one boolean:

```
guru_visibility        // combust / heliacal reappearance state (astronomy, L0)
guru_gochara_bala      // transit favorability from person's janma rasi
guru_muhurta_chart_strength
(sukra_* likewise; for marriage: bride.* and groom.* separately)
```

- Marriage/Upanayana: `policy_class = HIGH_PRIORITY_RESTRICTION`, `severity = PENDING` (resolve to HARD_VETO or SEVERE_PENALTY per source) for both `guru_astangata` and `sukra_astangata`. Not a blind `combust => VETO`: the source contains reappearance buffers and remedial/dignity conditions — rules need their own spec.
- **CONFIRMED activity exception (key evidence):** Kalaprakasika states for Annaprasana that the month is the most important element "and so it does not matter if Jupiter and Venus be 'Asthangatha' at the time." The text itself waives combustion per activity. Architecture (module + per-activity config) is therefore frozen; individual rule contents pending Ch. XIV reading.
- "Both Jupiter and Venus combust = irremediable" (`PENDING`, ChatGPT-reported).

### M2. Tamil solar month × activity gating

Schema `tamil_solar_month × activity`, never one global month blacklist:

```
MARRIAGE: strict | GRIHA_PRAVESHAM: strict/moderate | UPANAYANA: strict
BUSINESS_OPENING: moderate | GOLD_PURCHASE: weak | ROUTINE_PURCHASE: none
```

Marriage-favored months (Tamil practice, `TRADITIONALLY_REPORTED`): Thai, Maasi, Panguni, Vaikasi, Aani, Aavani; Aadi/Purattasi/Margazhi avoided for major subha karyams. Kalaprakasika Ch. XIV discusses Uttarayana/Dakshinayana and month influence — read before freezing contents. Month prohibitions do NOT auto-apply to commercial activities.

### M3. Karana

`activity_karana_rule`, not a generic karana score. **CONFIRMED:** naming chapter explicitly avoids Vishti and Sakunam karanas, and enumerates the tithi-halves constituting Vishti; Annaprasana avoids Sthira karana and Vishti. Default Tamil profile: `VISHTI => VETO` at L2 for subha karya.

### M4. Tithi

`activity × paksha × tithi` tables. **CONFIRMED examples:** naming avoids 4, 6, 8, 9, 12, 14 of both pakshas plus Full/New Moon; ear-boring favors 2, 3, 5, 6, 7, 10, 11, 12, 13 with all others excluded. Marriage tithi list (reported: 2, 3, 5, 7, 10, 11, 13 with paksha distinctions): `PENDING` Ch. XIV. Never encode `RIKTA = universally bad` as the primitive.

### M5. Gandanta — three types. Definitions CONFIRMED (verbatim Kalaprakasika, Ch. II nativity context); computational interpretation and election-applicability PENDING. **Implementation hold until interpretation is settled.**

Kalaprakasika's wording, preserved exactly:

```
NAKSHATRA_GANDANTA: last 2 ghatikas of Ashlesha, Jyeshtha, Revati
                    + first 2 ghatikas of Magha, Mula, Ashwini       // both sides, per text
TITHI_GANDANTA:     last 2 ghatikas of Panchami, Dashami, Purnima,
                    Amavasya                                          // END-ONLY, per text
RASI_GANDANTA:      last navamsa of Cancer, Scorpio, Pisces
                    + first navamsa of Aries, Leo, Sagittarius
```

Provenance notes:

- The nakshatra/tithi asymmetry (both sides vs end-only) is **in the text itself**. The junction-inclusive tithi variant found in secondary literature (last 2 of Panchami → first 2 of Shashthi; Dashami → Ekadashi; Purnima/Amavasya → Pratipada) is `TRADITIONALLY_REPORTED` — offer it as a school variant, do not overwrite the primary wording with it.
- **Ghatika interpretation:** a ghatika is classically a fixed time unit (≈24 min; 2 ghatikas ≈ 48 min). The proportional reading (2/60 of the actual nakshatra/tithi duration) was an engine inference in v2 and is hereby withdrawn from CONFIRMED status. Interpretation choice = `PENDING_PRIMARY_VERIFICATION`; implement both behind a config flag if development cannot wait.
- **Rasi gandanta:** the navamsa-based definition is verbatim from the text, but stated in the *birth* chapter. Whether and how it applies as an election veto = `PENDING`. Definitions of gandanta genuinely vary by context (birth vs lagna vs Moon vs election); do not freeze election-side rasi gandanta from the nativity passage alone.

Engine treatment (unchanged, architecture only):

```
baseline = SEVERE_PENALTY
strict samskara profile: may promote to VETO
explicit bhanga condition (Moon dignity/benefic influence): downgrade per school
```

Bhanga conditions: `PENDING` (specific passage not yet located).

### M6. Two-party evaluation (marriage)

All personal factors — tarabala, chandra bala, guru/sukra balam — computed for bride AND groom with deterministic resolution rules (§Q4, §Q5, M1).

---

## Freeze register (v2.3 — four-tier)

An architecture freeze is NOT a doctrine freeze, and primary-text confirmation is NOT the same as practice consensus. Developers must never read "architecture frozen" as "every value is verified tradition," nor "frozen" as "sourced to a passage."

**ARCHITECTURE_FROZEN** (interfaces safe to code against):
rule primitive `RULE(activity, factor, context, profile)`; RULE_PRECEDENCE hierarchy; severity vocabulary; sunrise-relative Durmuhurtham computation; nakshatra dual-layer schema (nature + activity tables); activity-specific tithi/karana/lagna/month table shapes; purchase enum split; overlay-as-bonus mechanism (never bypass); Kuligai policy structure; two-party evaluation model; strict-mode school flags; L0–L9 hierarchy + no-cancellation invariant; combustion three-dimension module shape; three-type gandanta module shape; CALCULATION_CONFIG three-layer separation; RULE_SOURCE schema (below).

**PRIMARY_TEXT_CONFIRMED** (verbatim against an identified Kalaprakasika passage):
naming/annaprasana/ear-boring nakshatra, tithi, karana, vara, lagna-sign lists; 8th-vacancy for naming and ear-boring; Vishti tithi-half enumeration; Annaprasana combustion waiver; gandanta *wording* (nakshatra both-sides, tithi end-only, rasi navamsa). All carry `source_scope` — several are NATAL-context and must not be auto-promoted to MUHURTA/election scope (see RULE_SOURCE).

**PRACTICE_CONSENSUS_FROZEN** (stable Tamil practice, no serious dissent across review rounds, but not yet tied to a cited passage):
Chandrashtama avoidance (position 8 veto); Vipat/Pratyak/Vadha adverse-tara *identification* (the classification only — the severity mapping is ENGINE_POLICY, see Q4). Kept separate from PRIMARY_TEXT_CONFIRMED precisely because no passage has been pinned yet.

**VALIDATION_PENDING** (everything else, notably):
Durmuhurtham weekday offsets (BLOCKER, two-variant registry); marriage 11-star list; Magha-1/Mula-1/Revati-4 pada exclusions; marriage lagna signs; marriage 7th/8th-vacancy citations; marriage tithi list; combustion rule details incl. "both combust" clause; gandanta ghatika interpretation + election applicability + bhanga conditions; tithi-gandanta junction-inclusive variant; gold chapter star list; navaka multiplier ratios (ENGINE_CONCEPT); month × activity contents; all tarabala/chandra-bala severity *mappings* (ENGINE_POLICY).

---

## RULE_SOURCE — mandatory per-rule provenance object

Every rule in the engine carries a machine-readable source record; prose provenance labels are not enough. This is what makes Vinaadi auditable: when a Tamil astrologer asks "why did you allow Moolam?", the system answers with profile + authority + passage, not "the scoring model liked it."

```yaml
rule_id: MARRIAGE_NAKSHATRA_MULA
authority:
  tradition: KALAPRAKASIKA
  chapter: XIV
  page: null                    # fill on verification
  verse_or_passage: null
  translation_edition: "Subramonia Iyer"
  original_language_term: null  # optional; the Sanskrit/Tamil term as printed
provenance:
  status: PENDING               # CONFIRMED | TRADITIONALLY_REPORTED | PENDING | ENGINE_CONCEPT
source_scope: MARRIAGE          # NATAL | MUHURTA_GENERAL | MARRIAGE | ANNAPRASANA | PROPERTY | TREASURE | ...
rule_type: TEXTUAL_RULE         # TEXTUAL_RULE | INTERPRETATION | ENGINE_POLICY
source_confidence: null         # EXACT | INTERPRETED | SECONDARY
profile:
  tamil_kalaprakasika: enabled
  pan_indian_conservative: disabled
severity: ALLOWED
exceptions: []                  # pada conditions, bhanga conditions, etc.
verified_on: null
verified_by: null
```

**Why `source_scope` is load-bearing:** the gandanta case proves it. Its wording is genuinely `CONFIRMED`, but from a `NATAL` chapter — so `GANDANTA status=CONFIRMED` must NOT be read as `GANDANTA_MUHURTA_VETO=CONFIRMED`. Scope stops that silent promotion. **Why `rule_type` matters:** it keeps the three-way split clean — a `TEXTUAL_RULE` ("Mula is in the marriage list") is a different provenance object from an `INTERPRETATION` (how to compute 2 ghatikas) and from an `ENGINE_POLICY` (Vadha → HARD_VETO).

**PRIMARY_TEXT_CONFIRMED eligibility.** A rule may enter that tier iff ALL hold: `outcome ∈ {CONFIRMED_EXACT, CONFIRMED_WITH_CONDITION}`; `source_scope` matches the usage; `rule_type = TEXTUAL_RULE`; the passage is recorded; and every attached condition is captured in `conditions`/`exceptions`. `CONFIRMED_WITH_CONDITION` is NOT weaker provenance — "X allowed provided Y" is a fully-sourced conditional rule, and excluding it would wrongly rank classical conditional rules below unconditional ones. `PARTIAL`, `TRANSLATION_AMBIGUOUS`, `OUT_OF_SCOPE`, etc. remain excluded.

---

## Priority queue (v2.3)

1. **Kalaprakasika Ch. XIV (Marriage, pp. 79–90)** — settles the flagship profile: 11-star list, lagna signs, 7th/8th vacancy, tithi list, combustion clauses. **DONE 2026-08-14** — see status update at top of document.
2. **Gandanta passages** — settle ghatika interpretation and election-side applicability **before anyone implements M5** (implementation hold in force).
3. **Ch. XXI (To Lay Up Treasure)** — settles `PURCHASE_GOLD_VALUABLES` star/tithi content.
4. **Durmuhurtham empirical validation** — resolves the two-variant registry per weekday.
5. **Ayanamsa/panchang reproduction test** — prove CALCULATION_CONFIG reproduces the target Tamil Thirukkanitham panchangam, especially at boundaries.

Completing these five converts this from a sophisticated specification into a defensible Tamil Thirukkanitham Muhurta ruleset. **Tasks 4 and 5 are engineering-validation work and should run in parallel with the textual research (1–3), not after it** — they don't depend on the Sanskrit/Tamil rule extraction. The remaining weakness is no longer architecture; it is source extraction. From here the standing job is converting each rule `PENDING → CONFIRMED / NOT_FOUND / SCHOOL_VARIANT` and filling its RULE_SOURCE record.
