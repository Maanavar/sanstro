# DOCTRINE_DECISIONS_V1

**Project:** Vinaadi — yoga and dosham detection layer
**Status:** CODE-READY — doctrine verification pending — not frozen
**Version:** v1.6 - 2026-10-02 (review fixes; no practitioner ruling added)
**Inputs merged:** Claude audit + ChatGPT audit + ChatGPT review rounds 2–4 (2026-10-01), reconciled

**Change log v1.1:** DD-02 strength model; DD-03 doctrine/engine split; DD-04 wording; DD-06 split exception vs. Vinaadi interpretation; DD-07 rewritten as functional-status matrix; DD-08 base vs. raja-grade; DD-09 verse map verified, NB-e removed; DD-12 exact boundaries; DD-15 activation basis enum.

**Change log v1.2:** DD-07 matrix is 12 × 7 (sign lords only) + separate node rules; O-4 rewritten to match DD-07; DD-08 provenance split (verse / commentary / Raman), raja-grade marked Tier A candidate; DD-03 aggravations get the same doctrine/engine split as mitigations; `AXIS_EPSILON` renamed `LONGITUDE_EPSILON`; checklist covers O-1 to O-11.

**Change log v1.3:** DD-07 `YOGAKARAKA` defined explicitly (house 1 never satisfies either side); `LAGNA_LORD` tracked separately; whole-matrix yogakaraka fixture added.

**Change log v1.4:** DD-07's ownership status renamed `YOGAKARAKA` → `DUAL_LORD_YOGAKARAKA` for textual precision: it names what the status tests (one lord of {4, 7, 10} and of {5, 9}), not the looser textual "yogakaraka". The six-lagna logic is unchanged. Open items O-12 to O-19 added — each a conflict or gap found while implementing P0/P1, recorded here instead of settled in code. Implementation status added as §19. No other rule is changed.

**Change log v1.5:** O-2, O-11, O-17 and O-18 now have executable, default-preserving doctrine branches. O-2 requires an explicit named lineage and sign list; O-11 is a separate off-by-default rule and labels non-combust as a provisional engine proxy for bright rays; O-17 can optionally label dignified but incomplete Lakshmi cases as `BHAGYA_SUPPORT`; O-18 can switch the Mesham/Viruchigam exception from full cancellation to strong mitigation. Added a generated practitioner packet for O-9, open rulings, physical-edition verification and native Tamil review. No external sign-off is claimed.

**Change log v1.6:** A review of v1.5 found four places where the code disagreed with this document or settled a doctrine question silently. (1) DD-03's Rahu–Ketu grade summed every aggravation before applying the Strong ceiling, so surplus aggravations absorbed mitigations and no chart with two or more aggravations could reach nivarthi — the P0 "uncancellable" defect again, by arithmetic. The tables' "+1 grade / −1 grade" is now applied as written: aggravations raise the grade up to Strong, then each mitigation lowers it one grade (engine fix, Tier C; no doctrine change). (2) O-21 added: Budhan rules its own exaltation sign, so a literal NB-b/NB-c/NB-g re-created the deleted NB-e for Budhan; default follows DD-09 (skipped). (3) O-22 added: whether the waxing Moon may be strict Gaja Kesari's own supporting benefic; default literal. (4) O-23 added: the 2026-09-23 moolatrikona test shuts four kendra/trikona lords out of every Raja Yoga, and it was not in the O-9 packet; default keeps the ruling. Raja Yoga eligibility now reads kendra/trikona lordship from the 84-cell matrix, so a correction at O-9 sign-off reaches it. DD-08 now shows one Adhi card (the raja-grade candidate wins the label, as DD-01's strict form does). Doctrine flags are validated when set and cannot be overridden at runtime with more than one worker (a ruling is a code default plus a §16 line). Tamil copy corrected where it contradicted the English.

**Implementation instruction:** P0/P1/P2 and the dormant O-2/O-11/O-17/O-18 branches are implemented. Every unresolved rule remains feature-flagged and source-tagged. Doctrine constants are not frozen until the verification checklist (section 18) and O-1 to O-23 sign-off are complete.

**Change control:** Implementation follows this document exactly. A developer who disagrees with a rule raises it as a doctrine question (new O-item); rules are never silently "improved" in code.

---

## 0. Governing rules for this document

### 0.1 Source tiers

Every rule carries exactly one tier. Never describe a lower-tier rule as "classical".

| Tier | Meaning | Examples |
|---|---|---|
| **A** | Classical formation rule, cited by text + chapter/verse | BPHS, Brihat Jataka, Phaladeepika, Laghu Parashari |
| **B** | South Indian / Tamil practical authority | B. V. Raman; established Tamil marriage (porutham) practice |
| **C** | Vinaadi engine convention | Thresholds, severity weights, tolerances, UI labels |

Popular websites (AstroVed, Maalai Malar, etc.) are **evidence that a Tamil practice exists**, not authority. They can support a Tier B rule only until a printed Tamil text (Jataka Alankaram, Sarvartha Chintamani, Kumaraswamiyam, etc.) is cited.

### 0.2 Principles

1. **Thirukkanitham decides positions; phala texts decide yogas.** (Governing Principle 6.)
2. **Preserve lineage — never blend.** Where BPHS, Phaladeepika, Raman and Tamil practice differ, store each as a named variant with its own detector.
3. **Grade, don't veto.** No configuration is "uncancellable". Doshams carry a severity grade; mitigations lower it; nothing locks it.
4. **Presence ≠ activation.** A yoga is present in the birth chart; dasha/bhukti decide when it is active.
5. **Strict name, honest fallback.** The full yoga name is shown only when its defining conditions are met. Partial geometry gets a distinct, honest label.
6. **Verification before freeze.** Every Tier A/B citation must be checked against a physical edition (column "Verify") before this file is frozen.

### 0.3 Editions to verify against

| Text | Edition to cite |
|---|---|
| BPHS | R. Santhanam, Ranjan Publications (note: verse numbers differ from G. C. Sharma edition) |
| Phaladeepika | V. Subrahmanya Sastri translation |
| Brihat Jataka | V. Subrahmanya Sastri / N. Chidambaram Iyer translation |
| Three Hundred Important Combinations | B. V. Raman, Motilal Banarsidass, 10th ed. (1991) — page numbers from online scans are unverified |
| Laghu Parashari | Any standard edition (Jataka Chandrika) |

---

## DD-01 Gaja Kesari Yoga — கஜகேசரி யோகம்

**Decision:** Two detectors, two labels.

```text
GAJA_KESARI_PARASHARA            (Tier A)
    Guru in kendra (1/4/7/10) from Lagna OR from Moon
    AND Guru joined or aspected by a benefic (per DD-12 dynamic classification)
    AND Guru NOT debilitated
    AND Guru NOT combust
    AND Guru NOT in an enemy sign
    label: கஜகேசரி யோகம்

GAJA_KESARI_BASE                 (Tier B)
    Guru in kendra from Moon
    strength graded by Guru and Moon condition
    label: கஜகேசரி அமைப்பு (Gaja Kesari pattern)
```

**Refinements**
- Guru in the same sign as the Moon (1st from Moon) counts as a kendra.
- If the strict form is met, show only the strict label (don't show both).
- Debilitated Guru with a valid neecha bhanga (DD-09): strict form still fails (BPHS lists debility as a bar); base form is graded, not suppressed. **[Tier C — astrologer to confirm]**
- A Moon close to amavasya lowers the grade of the base form (via Paksha Bala, DD-12). **[Tier C]**
- Activators: Guru + Moon (DD-15).

**Code change:** Current detector becomes `GAJA_KESARI_BASE`. Add `GAJA_KESARI_PARASHARA`.

| Source | Tier | Verify |
|---|---|---|
| BPHS 36.3–4 | A | Verse no. in Santhanam ed. |
| Raman, 300 Combinations, Yoga 1 | B | Page no. in physical 10th ed. |

---

## DD-02 Lakshmi Yoga — லட்சுமி யோகம்

**Decision:** Rewrite. Dignity is mandatory. Parāśari form is primary.

```text
LAKSHMI_YOGA_PARASHARA            (Tier A — primary)
    9th lord in a KENDRA (1/4/7/10)          -- kendra only, not trikona
    AND 9th lord in own / moolatrikona / exaltation sign
    AND lagna lord is strong (see below)

LAKSHMI_YOGA_PHALADEEPIKA         (Tier A — variant, off in consumer UI by default)
    9th lord AND Venus both in own/exaltation sign
    AND both in a kendra or trikona

BHAGYA_SUPPORT                    (Tier C — fallback label)
    9th lord well placed (kendra/trikona) but dignity condition not met
    label: பாக்கிய ஆதரவு (Fortune support)
```

**"Strong lagna lord"**

- **Doctrine [Tier A]:** BPHS requires only that the lagna lord be *balāḍhya* (endowed with strength). It gives no list of conditions.
- **Engine [Tier C]:** Vinaadi translates *balāḍhya* into a strength model. None of the factors below is a classical prohibition.

```text
LAGNA_LORD_STRENGTH                        (Tier C)
      dignity
    + Vinaadi strength / shadbala components
    + house strength
    + benefic support
    − debility penalty      (reduced if valid neecha bhanga)
    − combustion penalty
    − graha-yuddham-loss penalty
    − 6/8/12 placement penalty (waived in own/exaltation sign)
    − serious malefic affliction penalty

    balāḍhya  ⇔  LAGNA_LORD_STRENGTH ≥ threshold   (initial threshold 60, calibrate on fixtures)
```

- Penalties may be set large enough that severe debility or deep combustion practically never passes, but this is calibration, not doctrine.
- An unrelated high component must not offset a severe penalty (e.g. cap the score when debilitated without bhanga). **[Tier C]**

**Code change:** Replace current rule (9L kendra/trikona + both scores ≥ 60, no dignity). Activators: 9th lord + lagna lord (Parāśari); 9th lord + Venus (Phaladeepika).

| Source | Tier | Verify |
|---|---|---|
| BPHS 36.27–28 | A | Verse no.; confirm "kendra" wording |
| Phaladeepika 6.21 | A | Verse no. |
| Raman, Yoga 27 | B | Page no. |

---

## DD-03 Rahu–Ketu marriage dosham — ராகு கேது தோஷம்

**Decision:** Keep as a **Tier B Tamil marriage-practice rule** (not a named classical BPHS dosha). Graded, never vetoed.

### Formation

```text
RAHU_KETU_MARRIAGE_AXIS
    node in house 1, 2, 7 or 8 from Lagna
    reported as ONE axis finding:
        AXIS_1_7   (node in 1 or 7)
        AXIS_2_8   (node in 2 or 8)
    never counted as two separate doshas for Rahu and Ketu
```

- **Houses 5 and 9 removed** from this detector (see DD-04).
- "From Moon" / "from Venus" checks: secondary reference only — may raise severity, cannot create the dosham alone. **[Tier B — astrologer to confirm whether to include at all]**

### Severity model [Tier C]

```text
severity = base(axis)
         + aggravations (see table)
         − mitigations  (see table)
grades: Mild | Moderate | Strong
```

Aggravations and mitigations follow the same evidence discipline: the doctrine (that a factor aggravates or mitigates) and the engine arithmetic (by how much) are recorded separately. No aggravation locks the dosham.

### Aggravations

| Factor | Doctrine | Engine implementation |
|---|---|---|
| Node joined with the 7th lord | Aggravating factor **[Tier B — verify printed Tamil source]** | severity +1 grade **[Tier C]** |
| Node joined with Venus | Aggravating factor **[Tier B — verify printed Tamil source]** | severity +1 grade **[Tier C]** |
| Node joined with the Moon | Aggravating factor **[Tier B — verify printed Tamil source]** | severity +1 grade **[Tier C]** |
| Malefic influence on the 7th house | Aggravating factor **[Tier B, or Tier A if a classical 7th-house verse is cited]** | severity +1 grade **[Tier C]** |
| Node also afflicting from Moon / Venus (O-1) | Aggravating factor **[Tier B — pending O-1]** | severity +1 grade **[Tier C]** |

### Mitigations

| Factor | Doctrine | Engine implementation |
|---|---|---|
| Guru joins or aspects the node | Mitigating influence **[Tier B]** | severity −1 grade **[Tier C]** |
| Guru aspects the 7th house or 7th lord | Mitigating influence **[Tier B]** | severity −1 grade **[Tier C]** |
| Strong 7th lord (for a 7th-house node) | Mitigating influence **[Tier B]** | severity −1 grade **[Tier C]** |
| Strong 8th lord / benefic influence on 8H (for an 8th-house node) | Mitigating influence **[Tier B]** | severity −1 grade **[Tier C]** |
| Node in "favourable sign" | **NOT IMPLEMENTED** until node-dignity lineage is chosen (BPHS recensions and Tamil texts — e.g. Jatakalankaram — disagree) | — |

The severity grades themselves (Mild / Moderate / Strong) and their thresholds are **Tier C**.

### Dosha samyam (matching only)

```text
rahu_ketu_samyam: both partners carry a Rahu–Ketu marriage axis of comparable grade
    -> balanced for porutham purposes
```

- `rahu_ketu_samyam`, `sevvai_samyam`, `papa_samyam` are **separate** concepts.
- Cross-samyam (Rahu–Ketu in one chart balanced by Sevvai in the other): **astrologer view only, off by default.** **[Tier B, contested]**

**Code change (P0):** Delete `strong_affliction -> blocks every cancellation`. This currently makes cancellation impossible for every 1/7 and 2/8 axis chart — one third of all charts.

| Source | Tier | Verify |
|---|---|---|
| Tamil porutham practice (1/2/7/8, samyam) | B | Cite a printed Tamil text |
| Mitigation examples | B | Same |

---

## DD-04 Node influence on progeny (5th house)

**Decision:** Separate item, **not** labelled a dosham in the consumer UI.

```text
NODE_PUTRA_BHAVA_INFLUENCE
    node in 5th house
    evaluated inside the 5th house / 5th lord analysis
```

- Rahu/Ketu in the **5th** → direct progeny analysis (primary detector).
- Rahu/Ketu in the **9th** does **not** independently create `NODE_PUTRA_BHAVA_INFLUENCE` and never produces an automatic progeny dosham. The 9th may be used only as a **secondary** factor if a selected lineage applies bhavat-bhavam / extended progeny analysis. Otherwise it is read under dharma / father / fortune.

| Source | Tier | Verify |
|---|---|---|
| Traditional bhava significations | A/B | — |

---

## DD-05 Sevvai dosham and gender markers

**Formation (unchanged core):** Mars in 2, 4, 7, 8, 12 from Lagna (Moon and Venus as Tamil secondary references). **[Tier B]**

**Gender weighting:**

| Chart | Special weighting | Status |
|---|---|---|
| Male | 2, 7, 8 | Attested in Tamil practice — Tier B |
| Female | 4, 8, 12 | Attested in Tamil practice — Tier B (8th = mangalya sthanam is the best-supported part) |

**Decision:**
- Gender weighting is used **only** in the astrologer / porutham view.
- Consumer UI: identical wording for both genders, e.g.

  > "Mars is in a marriage-sensitive position in this chart. Its actual effect depends on Mars's strength, aspects and the rest of the marriage indicators."

- Remove "Female chart: this house position of Mars needs extra attention" from the web dashboard.

**Rahu–Ketu gender markers** (female 8th; male 7th or with Venus): **remove from DD-03.** If kept at all, they live in `porutham.papa_samyam`. **[Tier B]**

---

## DD-06 Sevvai exception — Kadagam / Simmam lagna

**Decision:** Record two separate ideas. Do not merge them. **O-6 stays OPEN.**

```text
TAMIL_TRADITIONAL_EXCEPTION                         (Tier B — source pending)
    Kadagam or Simmam lagna → traditional Sevvai exemption / mitigation
    exact scope unknown: online Tamil sources disagree on whether it is
    universal or limited to certain Mars positions
    printed Tamil source REQUIRED before its scope is fixed

VINAADI_CONSERVATIVE_INTERPRETATION                 (Tier C)
    the exception never erases the Mars analysis
    residual severity is still set by:
        Mars house and dignity
        combustion
        association with Sani / Rahu
        Moon and Venus references
        7th house / 7th lord condition
        partner samyam
```

- Reason for the Tier C layer: Mars is yogakaraka for both lagnas, but "functionally auspicious" ≠ "can never afflict marriage".
- Note: for Kadagam lagna, Mars in the 1st is **debilitated**.
- **Interim engine behaviour until O-6 is ruled:** apply the exception as a strong mitigation (severity reduction), never as `sevvai_dosha = False`. Store `TAMIL_SEVVAI_EXCEPTION_CANCER_LEO = true` so a later ruling can switch to full exemption without recomputation.
- The earlier v1.0 rule ("full cancel if not debilitated / not combust / not with Rahu-Sani") is **withdrawn**: those three conditions were a Vinaadi invention, not part of the traditional exception.

---

## DD-07 Raja Yoga with dusthana co-lordship

**Decision:** Kendra lord + trikona lord relationship is **necessary but not sufficient.** No generic dusthana rule (the v1.0 "6/12 → QUALIFIED, 8 → SPOILED" table is **withdrawn**). Raja Yoga reads each participant's **lagna-specific functional status**.

### Step 1 — functional status matrix (computed once per lagna, 12 lagnas × 7 sign lords)

Rows: the 12 lagnas. Columns: the seven sign-owning grahas only — Suryan, Chandran, Sevvai, Budhan, Guru, Sukran, Sani. **Rahu and Ketu are not in the matrix.**

```python
planet_functional_status(lagna, planet) -> set[FunctionalStatus]

FunctionalStatus:
    LAGNA_LORD             # owns house 1 — auspicious; tracked separately
    TRIKONA_BENEFIC        # owns 1/5/9 — always auspicious (Laghu Parashari)
    DUAL_LORD_YOGAKARAKA   # owns one of {4,7,10} AND one of {5,9} — see rule below
    KENDRA_NEUTRAL         # kendra lordship (kendradhipati: natural benefics lose beneficence, malefics lose malefic nature)
    TRISHADAYA_MALEFIC     # owns 3/6/11
    CONTEXTUAL_2ND         # 2nd lordship — result by association/other sign
    CONTEXTUAL_12TH        # 12th lordship — result by association/other sign
    EIGHTH_SPECIAL_CASE    # owns 8th; lagna-specific exceptions (e.g. also lagna lord)
    MARAKA                 # 2nd/7th lord (timing context only)
```

**DUAL_LORD_YOGAKARAKA rule (explicit):**

```python
DUAL_LORD_YOGAKARAKA = owns_any({4, 7, 10}) and owns_any({5, 9})
```

- House 1 **never** satisfies either side, even though it is geometrically both a kendra and a trikona. Otherwise every lagna lord would wrongly become a yogakaraka.
- Result: exactly six lagnas have a yogakaraka — Rishabam (Sani, 9+10), Kadagam (Sevvai, 5+10), Simmam (Sevvai, 4+9), Thulam (Sani, 4+5), Magaram (Sukran, 5+10), Kumbam (Sukran, 4+9).
- Lagna lords that also own a kendra (Budhan for Mithunam/Kanni, Guru for Dhanusu/Meenam) are `LAGNA_LORD` + `KENDRA_NEUTRAL`, **not** yogakaraka.

- The matrix is a static, reviewed table — **84 cells** (12 × 7) — signed off by the astrologer, not derived ad hoc in code.
- Each cell carries its source (Laghu Parashari verse) or `VINAADI_CONVENTION`.

### Step 1b — Rahu / Ketu functional context (separate rules)

Laghu Parashari treats the nodes by placement and association, not by sign lordship. They never pass through the lordship matrix.

```python
planet_functional_status(lagna, RAHU | KETU) -> {NON_SIGN_LORD}

node_functional_context(lagna, node, house, sign, dispositor,
                        conjunctions, aspects)
    -> FUNCTION_BY_DISPOSITOR_AND_ASSOCIATION
```

- A node must **never** acquire `TRIKONA_BENEFIC`, `DUAL_LORD_YOGAKARAKA`, `MARAKA`, `TRISHADAYA_MALEFIC` or any other status from a sign-ownership table.
- The `Planet` enum may keep nine members; the matrix lookup must reject Rahu/Ketu (assertion in code + fixture test).

**Required fixtures for the matrix**

```python
def test_lagna_lord_not_automatically_yogakaraka():
    assert DUAL_LORD_YOGAKARAKA not in functional_status(MESHAM, SEVVAI)     # owns 1, 8
    assert DUAL_LORD_YOGAKARAKA not in functional_status(MITHUNAM, BUDHAN)   # owns 1, 4
    assert DUAL_LORD_YOGAKARAKA not in functional_status(DHANUSU, GURU)      # owns 1, 4
    assert DUAL_LORD_YOGAKARAKA in functional_status(KADAGAM, SEVVAI)        # owns 5, 10
    assert DUAL_LORD_YOGAKARAKA in functional_status(RISHABAM, SANI)         # owns 9, 10

def test_yogakaraka_whole_matrix():
    expected = {
        (RISHABAM, SANI), (KADAGAM, SEVVAI), (SIMMAM, SEVVAI),
        (THULAM, SANI), (MAGARAM, SUKRAN), (KUMBAM, SUKRAN),
    }
    found = {(l, p) for l in ALL_LAGNAS for p in SEVEN_SIGN_LORDS
             if DUAL_LORD_YOGAKARAKA in functional_status(l, p)}
    assert found == expected

def test_nodes_rejected_by_matrix():
    for lagna in ALL_LAGNAS:
        for node in (RAHU, KETU):
            assert functional_status(lagna, node) == {NON_SIGN_LORD}
```

### Step 2 — Raja Yoga evaluation

```text
RAJA_YOGA_KENDRA_TRIKONA
    relationship (conjunction / mutual aspect / exchange) between
    a kendra lord and a trikona lord
    → status derived from BOTH participants' functional status sets
       using a reviewed rule table (Tier A where Laghu Parashari is explicit,
       Tier C otherwise)
```

**Refinements**
- Never downgrade a planet merely because its other sign is the 12th (e.g. Guru for Mesha lagna, lord of 9 and 12): trikona lordship dominates; 12th lordship is contextual.
- Never apply `if owns_8: SPOILED` universally; the 8th-lord cases are lagna-specific.
- A single-planet yogakaraka (`DUAL_LORD_YOGAKARAKA`, per the explicit rule above) is a separate detector.
- Output labels (FULL / QUALIFIED / MIXED) are **Tier C** display labels on top of the matrix.

| Source | Tier | Verify |
|---|---|---|
| BPHS 34.11–12 (kendra–trikona rule) | A | Verse no. |
| BPHS 34.15 (evil-house ownership caveat) | A | Verse no. and exact wording |
| Laghu Parashari (functional lordship) | A | Verse no. for each matrix rule |

**Priority raised to P1** — the matrix is shared infrastructure (Raja Yoga, yogakaraka, maraka, dasha interpretation).

---

## DD-08 Adhi Yoga

**Decision:** Formation and grade are separate. Weakness and combustion **grade** the yoga; they do not erase formation. Malefics make it mixed, not cancelled.

```text
ADHI_BASE  — built from three provenance layers:

  ADHI_BASE_GEOMETRY                            [Tier A — Brihat Jataka 13.2]
      natural benefics {Budhan, Guru, Sukran} occupying 6 / 7 / 8 from Moon
      (Budhan only if benefic per DD-12)

  ADHI_DISTRIBUTION_INTERPRETATION              [Tier A commentary — Srutakeerti on BJ 13.2]
      one or more of the three houses may be occupied:
      seven distributions (6, 7, 8, 6+7, 6+8, 7+8, all three)

  ADHI_SINGLE_PLANET_SUFFICIENCY                [Tier B — B. V. Raman, Yoga 7]
      one sufficiently strong benefic may form a partial Adhi

  => ADHI_BASE: >= 1 qualifying benefic in 6/7/8 from Moon

  graded by:                                    [Tier C]
      adhi_benefic_count          1 | 2 | 3
      adhi_benefic_strength       individual bala of each forming benefic
      combustion                  penalty (does NOT remove the planet)
      adhi_malefic_contamination  malefics in 6/7/8 from Moon
      Moon strength
      adhi_purity                 PURE | MIXED | ADVERSE

ADHI_RAJA_GRADE                                 [Tier A CANDIDATE — direct Saravali verse pending;
                                                 currently known only as reported in the BJ commentary]
    ADHI_BASE
    AND forming benefics not combust
    AND free from serious malefic affliction
    -> promote to Tier A once the Saravali verse is located
```

**Labels [Tier C]**
- ADHI_RAJA_GRADE → அதி யோகம் (full)
- ADHI_BASE, 2–3 benefics → Adhi Yoga (moderate)
- ADHI_BASE, 1 benefic or weak/combust benefics → Adhi Yoga (partial)
- Malefic contamination → append "mixed results"

| Source | Tier | Verify |
|---|---|---|
| Brihat Jataka 13.2 (geometry) | A | Verse no. |
| Srutakeerti commentary on BJ 13.2 (seven distributions) | A (commentary) | Locate in printed commentary |
| Saravali / Mandavya (combustion-free for raja-grade), as reported in BJ commentary | A candidate | Locate in Saravali directly |
| Raman, 300 Combinations, Yoga 7 (one strong planet suffices) | B | Page no. |

---

## DD-09 Neecha Bhanga and Neecha Bhanga Raja Yoga

**Decision:** Delete the "any two conditions" rule. There is no classical count threshold. Each textual condition is tested independently and the verse that fired is recorded.

```text
NEECHA                     planet in debilitation sign
NEECHA_BHANGA[rule_id]     any one authenticated condition satisfied
NEECHA_BHANGA_RAJA_YOGA[rule_id]  where the cited verse itself gives raja-yoga result
```

**Phaladeepika 7.26–30 conditions** (verse map checked against the Subrahmanya Sastri translation as published on siva.sh, 2026-10-01; re-check in the physical edition):

| ID | Condition | Verse |
|---|---|---|
| NB-a | Lord of the debilitation sign in a kendra from Lagna or Moon | 7.26, restated 7.29 |
| NB-b | Lord of the planet's exaltation sign in a kendra from Lagna or Moon | 7.26, restated 7.29 |
| NB-c | Debilitation-sign lord and exaltation-sign lord in mutual kendras | 7.27 |
| NB-d | Debilitated planet aspected by its debilitation-sign lord | 7.28 |
| NB-d+ | NB-d **and** the debilitated planet in a house other than 6/8/12 → stronger result ("foremost king") | 7.28 (second half) |
| NB-g | Debilitation-sign lord and/or exaltation-sign lord in a kendra (reference point not specified in the verse — Vinaadi reads it from Lagna, **Tier C**) | 7.30 |

**Removed from this list**
- **NB-e** ("debilitated planet itself in a kendra") — **not in Phaladeepika 7.26–30.** Deleted. It may return only under the ID of a text that actually states it.
  - Lead to check: Phaladeepika Ch 7 also has a verse in which a single debilitated planet with bright rays, **retrograde**, in a house other than 6/8/12 gives raja-yoga results. If adopted, it enters as its own rule with all those conditions, cited to its own verse.
- **NB-f** (exalted in navamsa) — not in 7.26–30; source separately (O-7).

**Refinements**
- Each satisfied condition contributes to a strength grade. **[Tier C]**
- **Warning:** with "any one condition", NBRY will fire on many charts. Consumer UI must show strength, not a bare "You have Raja Yoga". Run frequency check on the fixture set before launch.

| Source | Tier | Verify |
|---|---|---|
| Phaladeepika 7.26–30 | A | Mapping done online; confirm in physical edition |
| Phaladeepika Ch 7 (retrograde debilitated planet verse) | A | Locate verse number before adopting |

---

## DD-10 Kala Sarpa

**Decision:** Low-authority doctrine; pure geometry; no astrological orb.

- Kala Sarpa is **not** in BPHS, Brihat Jataka or Phaladeepika in its current popular form. **[Tier B at most — later/popular doctrine]**

```text
KALA_SARPA
    all seven grahas lie within ONE of the two arcs between Rahu and Ketu
    test = actual sidereal longitude, no orb
    LONGITUDE_EPSILON = 1e-6 degrees   (floating-point safety only, Tier C;
                                        shared constant, also used by DD-12)
```

- Whether a planet is **conjunct** a node is a separate question, handled by the conjunction/drishti layer (PR-A2) with its own orb.
- Do not use 1°/3°/5° orbs to decide which side of the axis a planet lies on.
- Consumer UI: not shown as a frightening "dosham" on the primary dashboard.

---

## DD-11 (reserved — Guru Chandala; see DD-15 for activators)

```text
GURU_CHANDALA
    Guru conjunct Rahu (primary); Guru conjunct Ketu (variant flag)   [Tier B]
```

---

## DD-12 Natural benefic / malefic classification

**Decision:** Dynamic. Mercury and Moon are no longer always-benefic.

```text
MOON
    elongation = (MoonLongitude − SunLongitude) mod 360

    elongation == 0°            exact amavasya — darkest; NOT benefic
    0° < elongation < 180°      waxing (Shukla) -> natural benefic
    elongation == 180°          exact pournami — brightest; benefic
    180° < elongation < 360°    waning (Krishna) -> natural malefic / reduced beneficence

    equality tests use LONGITUDE_EPSILON (shared constant, defined in DD-10)
    Paksha Bala gives the continuous strength value, so the binary label
    never jumps from "strong benefic" to "malefic" without a strength gradient
    (legacy 72° convention: available as a flag, OFF by default — Tier B/C)

MERCURY
    alone, or joined only by benefics      -> benefic
    joined only by malefics                -> malefic
    joined by both                         -> graded by the stronger side   [Tier C]
```

- Keep **natural** beneficence separate from **functional** beneficence by lagna (DD-07).
- This change flows into every detector that tests "benefic aspect/association" (DD-01, DD-03, DD-08, Vasumati, Kartari).

| Source | Tier | Verify |
|---|---|---|
| BPHS 3.11 | A | Verse no. |
| Raman (well-associated Mercury, waxing Moon) | B | Page no. |

---

## DD-13 Vasumati, Kartari, Chandra yogas — formation (unchanged)

Formation rules unchanged in this pass. Their **benefic/malefic tests now use DD-12**. Activation per DD-15.

---

## DD-14 Parivartana — formation (unchanged)

Formation unchanged. Activation per DD-15.

---

## DD-15 Dasha activation

**Decision:** Replace the single activation planet with sets. No yoga shows as "dormant" merely because an activator was never assigned.

```python
primary_activation_planets: set[Planet]
secondary_activation_planets: set[Planet]
activation_basis: ActivationBasis

class ActivationBasis(Enum):
    SOURCE_EXPLICIT     # a cited text states this planet activates this yoga
    SOURCE_INFERRED     # follows from a stated general principle
    VINAADI_CONVENTION  # engine choice, Tier C
```

General principle: effects become prominent in the dashas/bhuktis of the planets forming the yoga (Raman, stated for Sunapha and applied to Gajakesari). **[Tier B]** Applying it to every other yoga is **inference**, not something Raman wrote for each one.

| Yoga | Primary activators | Basis | Secondary | Basis |
|---|---|---|---|---|
| Gaja Kesari (both forms) | Guru, Moon | SOURCE_EXPLICIT (Raman) | — | — |
| Sunapha | Planet(s) in 2nd from Moon | SOURCE_EXPLICIT (Raman) | Moon | VINAADI_CONVENTION |
| Anapha | Planet(s) in 12th from Moon | SOURCE_INFERRED | Moon | VINAADI_CONVENTION |
| Durudhura | Planets on both sides of Moon | SOURCE_INFERRED | Moon | VINAADI_CONVENTION |
| Lakshmi — BPHS | 9th lord, lagna lord | SOURCE_INFERRED | — | — |
| Lakshmi — Phaladeepika | 9th lord, Venus | SOURCE_INFERRED | — | — |
| Parivartana | Both exchanging lords | SOURCE_INFERRED | — | — |
| Guru Chandala | Guru + the participating node | SOURCE_INFERRED | Node's dispositor | SOURCE_INFERRED (BPHS node principle) |
| Vasumati | Each qualifying benefic in the upachayas | SOURCE_INFERRED | — | — |
| Kartari | The two hemming planets | SOURCE_INFERRED | Lord of the hemmed house | VINAADI_CONVENTION |
| Adhi | Each forming benefic | SOURCE_INFERRED | Moon | VINAADI_CONVENTION |
| Raja Yoga (kendra–trikona) | Both participating lords | SOURCE_INFERRED | — | — |
| Neecha Bhanga | Debilitated planet | SOURCE_INFERRED | Planet(s) causing the cancellation | VINAADI_CONVENTION |

**Rules**
- Bhukti activation counts, not only mahadasha.
- For any yoga involving a node, the node's dispositor is a secondary activator (BPHS: nodes give results of their house and associated lord). **[Tier A — verify verse]**

**UI states (replace "Dormant")**
- Present in birth chart
- Currently strongly activated
- Currently moderately activated
- Not a dominant influence in the current period

---

## 16. Open items for practitioner ruling

| # | Question | Default until ruled |
|---|---|---|
| O-1 | Rahu–Ketu: include "from Moon" / "from Venus" checks? | Secondary, severity only |
| O-2 | Node-dignity lineage (which signs are favourable for Rahu/Ketu)? | Mechanism implemented, disabled. Enabling requires a named lineage/source and explicit Rahu/Ketu rasi lists; Vinaadi supplies no list |
| O-3 | Cross-samyam between Rahu–Ketu and Sevvai? | Astrologer view only, off |
| O-4 | 12th co-lordship treatment in the functional-status matrix (DD-07): confirm each lagna-specific case | `CONTEXTUAL_12TH`. Never automatically downgrade an otherwise qualifying kendra/trikona lord solely because it also owns the 12th |
| O-5 | Gaja Kesari base form with neecha-bhanga Guru: graded or suppressed? | Graded |
| O-6 | Sevvai Kadagam/Simmam: universal exemption, or limited to certain Mars positions? Printed Tamil source needed (DD-06) | Strong mitigation, never full erasure |
| O-7 | Neecha bhanga in navamsa (NB-f): source and inclusion? | Excluded |
| O-8 | Lagna-lord strength threshold (60) and penalty sizes after fixture testing | 60 |
| O-9 | Sign-off of the 12 × 7 functional-status matrix (84 cells, DD-07), especially 12th-lord and 8th-lord cells, and of the separate Rahu/Ketu functional-context rules | Matrix built, unsigned |
| O-10 | NB-g (Phaladeepika 7.30): kendra from Lagna only, or Lagna/Moon? | Lagna |
| O-11 | Adopt the retrograde-debilitated-planet raja yoga (Phaladeepika Ch 7) as a separate rule? | Separate rule implemented, off. Candidate requires debility, retrogression, placement outside 6/8/12 and non-combust as a provisional proxy for bright rays |

**Added during implementation (v1.4).** Each is a conflict or gap found while coding P0/P1. No practitioner ruling is invented in code: defaults preserve this document or shipped behavior. Every operational alternative is exposed as an admin flag (`doctrine_o<n>_...`).

| # | Question | Default until ruled |
|---|---|---|
| O-12 | The engine shipped two neecha-bhanga conditions that are **not** in DD-09's Phaladeepika table: (a) the planet that *exalts* in the debilitation sign in a kendra from Lagna/Moon (BPHS-style); (b) the debilitated planet aspected by the lord of its *exaltation* sign. Is either sourced, and under which verse? | Excluded (DD-09's table governs). Flagged |
| O-13 | DD-09 says `NEECHA_BHANGA_RAJA_YOGA` applies "where the cited verse itself gives raja-yoga result" but does not mark which verses do. All of 7.26–30 sit in Phaladeepika's raja-yoga chapter. Confirm each verse states a raja-yoga result. | Every 7.26–30 rule treated as giving one; the card keeps its raja-yoga name. Flagged |
| O-14 | The 2026-09-23 moolatrikona ruling downgraded three 12th co-lords in Raja Yoga — Rishabam Sevvai (7+12), Thulam Budhan (9+12), Viruchigam Sukran (7+12). DD-07 / O-4 says never downgrade for the 12th alone. Which governs? | O-4 (this document). The moolatrikona reading is the switchable alternative |
| O-15 | DD-07 reads the Raja Yoga link as conjunction / **mutual** aspect / exchange. Audit L-3 had added a **one-way** special aspect (Sevvai 4/8, Guru 5/9, Sani 3/10). Does a one-way special aspect link? | Mutual only. Flagged |
| O-16 | DD-15 makes the Moon a secondary activator for Sunapha, Anapha, Durudhura and Adhi. The 2026-09-23 ruling said Chandran is the reference point, not a trigger. Which governs? | DD-15 table. Flagged |
| O-17 | `BHAGYA_SUPPORT` is "well placed but dignity not met". Two cases get no label: a dignified 9th lord in a trikona only, and a dignified 9th lord in a kendra with a lagna lord below threshold. Label them, and how? | Literal text: unlabelled. `all_incomplete_lakshmi` alternative implemented but not selected |
| O-18 | The Sevvai detector still cancels outright for Mesham/Viruchigam lagna with Mars in the 1st or 2nd - the same "lagna exempts Mars" pattern DD-06 withdrew for Kadagam/Simmam. Keep, or treat as a strong mitigation too? | Full cancellation unchanged. `strong_mitigation` alternative implemented but not selected |
| O-19 | NB-a and NB-b read "kendra from Lagna **or Moon**". When the lord in question **is** the Moon — Sevvai debilitated in Kadagam, and Guru, who exalts in Kadagam — the Moon is always in the 1st from itself, so a literal reading cancels **every** such debility. Does the Moon reference count for the Moon? | Literal reading (the shipped behaviour). Flagged |
| O-20 | For the DD-08 raja-grade candidate, does "serious malefic affliction" include a malefic's poorna drishti on a forming benefic, or only a malefic occupying the 6th/7th/8th from Chandran? | Occupants only. Malefic aspects are excluded unless the flag is enabled |
| O-21 | Budhan is debilitated in Meenam and rules Kanni, its own exaltation sign. Read literally, NB-b ("exaltation-sign lord in a kendra"), NB-c and NB-g then test the debilitated Budhan's own position — which is NB-e, deleted by DD-09. Does the self-reference count? | Skipped (DD-09 governs). `doctrine_o21_nb_planet_as_own_lord` restores the literal reading |
| O-22 | DD-01's strict form requires Guru "joined or aspected by a benefic". A waxing Moon beside or opposite Guru is such a benefic — but it is one of the yoga's two grahas. May it be the support? | Yes (literal DD-01 / DD-12). Flagged |
| O-23 | The 2026-09-23 ruling admits a 6th/8th co-lord to Raja Yoga only if its moolatrikona sign is the kendra/trikona it owns. That shuts Kadagam Guru (6+9) and Sani (7+8), Kanni Sani (5+6) and Kumbam Budhan (5+8) out of every Raja Yoga, against DD-07's "trikona lordship dominates" reading. Which governs? | The 2026-09-23 test (shipped). `lordship_only` admits them and leaves the co-lordship to the MIXED grade |

---

## 17. Implementation priority

| Priority | Item | Why |
|---|---|---|
| **P0** | DD-03 remove "uncancellable" veto; add samyam | Wrong result for ~1/3 of charts |
| **P0** | DD-02 Lakshmi rewrite | Current rule broader than every source |
| **P0** | DD-09 delete "any two"; per-verse conditions; NB-e removed | Rule has no textual basis |
| **P1** | DD-12 dynamic Moon/Mercury with exact boundaries | Feeds many other detectors |
| **P1** | DD-07 functional-status matrix + Raja Yoga rewrite | Shared infrastructure; generic dusthana rule wrong |
| **P1** | DD-15 activation sets + basis enum + UI states | Yogas falsely shown as dormant |
| **P1** | DD-05 gender markers out of consumer UI | User harm |
| **P1** | DD-06 replace `sevvai_dosha = False` with mitigation flag | Current rule erases analysis for 1/6 of charts |
| **P2** | DD-01 strict Gaja Kesari detector | Labelling accuracy |
| **P2** | DD-08 ADHI_BASE / ADHI_RAJA_GRADE | Grading accuracy |
| **P2** | DD-10 Kala Sarpa epsilon | Edge-case correctness |

**Fixture tests to add:** one golden chart per DD, plus a frequency report (how many fixture charts trigger each yoga/dosham before vs. after) for DD-02, DD-03 and DD-09.

---

## 18. Verification checklist (before freeze)

No physical edition was accessed during the v1.5 implementation pass. Every unchecked box below remains external evidence work; the generated packet provides fields for edition, page, verifier and date.

- [ ] BPHS 36.3–4, 36.27–28, 34.11–15, 3.11 against Santhanam edition
- [ ] Phaladeepika 6.21
- [x] Phaladeepika 7.26–30 verse map (online, siva.sh) — [ ] confirm in physical edition
- [ ] Phaladeepika Ch 7 retrograde-debilitated-planet verse (O-11)
- [ ] Saravali Adhi Yoga raja-grade condition (DD-08)
- [ ] Brihat Jataka 13.2 Adhi Yoga verse
- [ ] Srutakeerti commentary on BJ 13.2 (seven distributions)
- [ ] Raman, 300 Combinations: Yoga 1, Yoga 7 and Yoga 27 page numbers, physical 10th ed.
- [ ] Laghu Parashari functional-lordship verses
- [ ] A printed Tamil text for Rahu–Ketu 1/2/7/8, samyam, aggravating factors, and gender-weighted Sevvai lists
- [ ] Practitioner sign-off on Open items O-1 to O-11
- [ ] Practitioner ruling on O-12 to O-23 (raised during implementation and review)
- [ ] O-9 packet section A2 (Raja Yoga participation) and the Sun/Moon 8th-lordship question

---

## 19. Implementation status (2026-10-02)

P0, P1 and P2 are implemented. Nothing is frozen: every open-item default lives in `app/calculations/doctrine_options.py` (`DEFAULT_DOCTRINE`) and is mirrored by an admin flag in `app/services/feature_flags.py`; `current_doctrine_options()` reads the flags once per chart build and passes them down. O-2, O-11, O-17 and O-18 now have executable alternatives whose defaults preserve the previous result. O-9 remains `functional_status.MATRIX_SIGNED_OFF = False`; generated review material is not a signature.

| DD | Where | What changed |
|---|---|---|
| O-2 | `doctrine_options.py`, `_yoga_dosham.detect_rahu_ketu_dosham` | Disabled by default. `explicit_signs` requires a non-empty practitioner source and explicit 1-12 rasi tuples; a matching node sign adds one named mitigation. No dignity list is built in |
| O-11 | `_yoga_detect.detect_retrograde_debilitated_raja_yoga`, yoga registry/facade/display | Separate off-by-default card. Requires a debilitated retrograde graha outside 6/8/12 and non-combust; the marker says non-combust is a provisional bright-rays proxy |
| O-17 | `_yoga_detect.detect_bhagya_support` | Default `literal` keeps dignified incomplete cases unlabelled. `all_incomplete_lakshmi` emits the existing support label and records whether kendra placement or lagna-lord strength is missing |
| O-18 | `_yoga_dosham.detect_sevvai_dosham` | Default preserves full cancellation. `strong_mitigation` records the same factor but softens one grade/point; independent mitigations may still combine to nivarthi |
| DD-03 (P0) | `_yoga_dosham.detect_rahu_ketu_dosham`, `dosha_samyam.py` | One axis finding (`rahu_ketu_axis_1_7` / `_2_8`); houses 5/9 removed; base Moderate, +1 grade per aggravation up to Strong, then −1 grade per mitigation (v1.6: the ceiling now applies before the mitigations); below Mild is nivarthi. The `strong_affliction` veto is gone. `rahu_ketu_samyam` and the off-by-default cross-samyam; the compatibility report adds a samyam line (text only, no score) |
| O-21 / O-22 / O-23 (v1.6) | `neecha_bhanga.py`, `detect_gaja_kesari_parashara`, `functional_status.raja_participation` | Budhan's self-reference skipped by default; Moon-as-support kept literal; 6th/8th moolatrikona test kept, `lordship_only` alternative. Raja participation reads LL/KN/TB from the matrix. Packet section A2 shows the participation table |
| Flags (v1.6) | `feature_flags.set_flag`, `api/admin.set_flag_value` | Doctrine values type-checked and `validated()` when set (422), not at the next chart build; runtime doctrine overrides refused with more than one worker (409) |
| DD-02 (P0) | `_yoga_detect.detect_lakshmi_yoga`, `detect_bhagya_support`, `detect_lakshmi_yoga_phaladeepika`, `lagna_lord_strength.py` | Parāśari form primary (wire key `LAKSHMI_YOGA` kept); Phaladeepika variant hidden by default; `BHAGYA_SUPPORT` fallback |
| DD-09 (P0) | `neecha_bhanga.py`; `chart_strength.neecha_bhanga_cancelled` wraps it | One rule per verse, one marker per rule, any one cancels; grade by distinct conditions (Tier C). NB-e gone; NB-f and the two unlisted conditions off (O-7, O-12). Card, +14 strength term, yogakaraka card and bhava palan share the evaluator |
| DD-12 (P1) | `aspects.moon_is_natural_benefic`, `effective_natural_class` | Exact amavasya / pournami boundaries with `LONGITUDE_EPSILON`; legacy 72° flag off; Budhan with mixed company follows the strictly stronger side when scores are known. Kala Bala's paksha term is untouched |
| DD-07 (P1) | `functional_status.py` | Static 84-cell matrix (`DUAL_LORD_YOGAKARAKA` and the rest), pinned to its derivation; nodes rejected; node context by dispositor; Raja participation table and FULL / QUALIFIED / MIXED grade; mutual-aspect link. Matrix unsigned (O-9) |
| DD-15 (P1) | `yoga_rules.ActivationBasis`, `YogaResult.secondary_grahas`, `yoga_activation.activation_tier` | Primary / secondary activators per chart with a basis per registry row; `activationTier` on the wire; shared `yogaActivationState` gives the four UI states |
| DD-05 (P1) | Sevvai detector, web dosham panels | Gender markers moved to engine-only `astrologer_markers`; one consumer sentence for every chart; web "Female/Male chart" copy removed |
| DD-06 (P1) | Sevvai detector | Kadagam/Simmam is a strong mitigation (one grade, one point), never a cancellation alone; `tamil_sevvai_exception_cancer_leo` is always recorded so O-6 can switch to full exemption |
| DD-01 (P2) | `detect_gaja_kesari_parashara`, `detect_gaja_kesari` | Strict Parashara form and supportive Moon-kendra base are separate results; strict wins the label. The strict form excludes debilitated, combust and enemy-sign Guru even with neecha bhanga. O-5 controls the base with bhanga |
| DD-08 (P2) | `detect_adhi_base`, `detect_adhi_raja_grade` | Base accepts one dynamic benefic and records provenance/purity; raja-grade is an explicitly candidate row without a false tradition marker. O-20 exposes the unresolved malefic-aspect scope. v1.6: one Adhi card per chart — when the raja-grade candidate forms, the base card is absent |
| DD-10 (P2) | `doctrine_options.LONGITUDE_EPSILON`, `detect_kalasarpa` | Kala Sarpa node-boundary equality now uses the same `1e-6` float-safety constant as DD-12, without introducing an astrological orb |

**Fixtures.** `tests/test_doctrine_decisions_v13.py`: a synthetic chart per DD, the three DD-07 fixtures above, and one test per open-item switch. The central P0 claims were run against the pre-change commit and differ there: a Guru-mitigated 1/7 axis read STRONG and could not be cancelled; a 9th lord without dignity formed Lakshmi; a bhanga from the planet exalting in the debilitation sign alone formed the raja yoga. Frequency report: `docs/DOCTRINE_V13_FREQUENCY_REPORT_2026-10-01.md`, from `scripts/doctrine_v13_frequency_sweep.py`. The same suite now proves O-2 validation and mitigation, every O-11 gate, both O-17 scopes, and both O-18 postures.

**What the checks cannot see.**
- Every Tier A/B citation is still unverified against a physical edition (section 18). The verse map behind DD-09 is the online one. No physical edition was inspected during v1.5.
- Tier C numbers (the Rahu–Ketu base and step, the lagna-lord penalties and cap, the NB grade cut-offs, "comparable grade" for samyam) are calibration, not doctrine. The sweep measures how often they fire, not whether they are right.
- DD-06's residual combustion and Sani/Rahu association factors are now recorded and affect uncancelled strength, but the source and relative weighting still require practitioner review.
- Bhava palan now receives the same live `DoctrineOptions` object as chart explanation, so O-7/O-10/O-12/O-19 cannot diverge from the neecha-bhanga card in that request.
- Tamil copy added for the new markers, labels and activation states has not been read by a native reviewer. This includes the O-2 lineage marker, O-11 card/markers and O-17 dignified-support wording added in v1.5, and the v1.6 corrections (a benefic said to *afflict* the 8th; the raja-grade Adhi label that dropped "candidate" in Tamil only). Combustion is written அஸ்தங்கம் on the yoga cards and அஸ்தமனம் elsewhere; the reviewer chooses.
- The 84-cell matrix is pinned to its ownership derivation, so the test proves the table carries no typo, not that the statuses are right. The E8 status on Dhanusu-Moon and Magaram-Sun ignores the reading that the Sun and Moon carry no 8th-lordship blemish; that is put to the practitioner in the packet, not settled here.
- Mobile shows DD-15's states in the "How?" sheet only; its yoga cards carry no timing line. No device pass was run.
