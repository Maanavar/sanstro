# DOCTRINE_DECISIONS_V1

**Project:** Vinaadi — yoga and dosham detection layer
**Status:** CODE-READY — doctrine verification pending — not frozen
**Version:** v2.2 - 2026-10-06 (O-32 Putra Sarpa Thulam-lagna exception; v2.1: DD-17 dosham reckoning, O-26 to O-29; applied for the owner, not a practitioner signature)
**Inputs merged:** Claude audit + ChatGPT audit + ChatGPT review rounds 2–4 (2026-10-01), reconciled

**Change log v1.1:** DD-02 strength model; DD-03 doctrine/engine split; DD-04 wording; DD-06 split exception vs. Vinaadi interpretation; DD-07 rewritten as functional-status matrix; DD-08 base vs. raja-grade; DD-09 verse map verified, NB-e removed; DD-12 exact boundaries; DD-15 activation basis enum.

**Change log v1.2:** DD-07 matrix is 12 × 7 (sign lords only) + separate node rules; O-4 rewritten to match DD-07; DD-08 provenance split (verse / commentary / Raman), raja-grade marked Tier A candidate; DD-03 aggravations get the same doctrine/engine split as mitigations; `AXIS_EPSILON` renamed `LONGITUDE_EPSILON`; checklist covers O-1 to O-11.

**Change log v1.3:** DD-07 `YOGAKARAKA` defined explicitly (house 1 never satisfies either side); `LAGNA_LORD` tracked separately; whole-matrix yogakaraka fixture added.

**Change log v1.4:** DD-07's ownership status renamed `YOGAKARAKA` → `DUAL_LORD_YOGAKARAKA` for textual precision: it names what the status tests (one lord of {4, 7, 10} and of {5, 9}), not the looser textual "yogakaraka". The six-lagna logic is unchanged. Open items O-12 to O-19 added — each a conflict or gap found while implementing P0/P1, recorded here instead of settled in code. Implementation status added as §19. No other rule is changed.

**Change log v1.5:** O-2, O-11, O-17 and O-18 now have executable, default-preserving doctrine branches. O-2 requires an explicit named lineage and sign list; O-11 is a separate off-by-default rule and labels non-combust as a provisional engine proxy for bright rays; O-17 can optionally label dignified but incomplete Lakshmi cases as `BHAGYA_SUPPORT`; O-18 can switch the Mesham/Viruchigam exception from full cancellation to strong mitigation. Added a generated practitioner packet for O-9, open rulings, physical-edition verification and native Tamil review. No external sign-off is claimed.

**Change log v1.6:** A review of v1.5 found four places where the code disagreed with this document or settled a doctrine question silently. (1) DD-03's Rahu–Ketu grade summed every aggravation before applying the Strong ceiling, so surplus aggravations absorbed mitigations and no chart with two or more aggravations could reach nivarthi — the P0 "uncancellable" defect again, by arithmetic. The tables' "+1 grade / −1 grade" is now applied as written: aggravations raise the grade up to Strong, then each mitigation lowers it one grade (engine fix, Tier C; no doctrine change). (2) O-21 added: Budhan rules its own exaltation sign, so a literal NB-b/NB-c/NB-g re-created the deleted NB-e for Budhan; default follows DD-09 (skipped). (3) O-22 added: whether the waxing Moon may be strict Gaja Kesari's own supporting benefic; default literal. (4) O-23 added: the 2026-09-23 moolatrikona test shuts four kendra/trikona lords out of every Raja Yoga, and it was not in the O-9 packet; default keeps the ruling. Raja Yoga eligibility now reads kendra/trikona lordship from the 84-cell matrix, so a correction at O-9 sign-off reaches it. DD-08 now shows one Adhi card (the raja-grade candidate wins the label, as DD-01's strict form does). Doctrine flags are validated when set and cannot be overridden at runtime with more than one worker (a ruling is a code default plus a §16 line). Tamil copy corrected where it contradicted the English.

**Change log v1.7:** The owner ruled on the v1.5 practitioner packet on 2026-10-03 ("approve with corrections", adopting a consolidated review). These are owner rulings applied as code defaults, **not** a practitioner signature: `MATRIX_SIGNED_OFF` stays `False`, and §18's physical-edition ledger and the native Tamil review still need named humans. (1) **O-9 matrix:** the Sun and Moon carry no 8th-lordship blemish (`EIGHTH_LUMINARY_EXEMPT` on Dhanusu-Moon and Magaram-Sun; ownership kept). `KENDRA_NEUTRAL` is renamed `KENDRA_LORD` (lordship only), with a separate kendradhipati modifier, `KENDRADHIPATI_BENEFIC` / `KENDRADHIPATI_MALEFIC`, never given to the lagna lord. The lagna lord overrides the 8th (Mesham-Sevvai, Thulam-Sukran). Badhaka lordship is a recorded omission. (2) **Nodes:** context is the occupied house and its lord, conjunctions and received aspects; outgoing nodal aspects stay a separate lineage question. (3) **DD-07 step 2 / A2:** the moolatrikona co-lord test extends from the 6th/8th to the 3rd/6th/8th/11th (O-23), which also excludes Mesham Sani, Simmam Sukran and Kumbam Sevvai; three BPHS Ch. 34 pairs are source-vetoed; each linked pair is CONFIRMED, MIXED or SOURCE_VETOED; Kadagam Guru's exclusion is kept with a recorded dissent. The review's "kendradhipati handling" for natural benefics owning two kendras is **O-24**, new: excluding them would also remove the Surya + Budhan pair BPHS 34's Dhanus paragraph is commonly translated as naming, so the default grades them MIXED and `exclude` is the alternative. (4) **O-13:** the Neecha Bhanga Raja Yoga name needs two or more distinct conditions; one condition is நீச நிவர்த்தி (`NEECHA_NIVARTHI`). Cancellation still needs one (DD-09). (5) **O-2** disabled, **O-11** off, **O-17** `literal` (confirmed); **O-18** `strong_mitigation`; **O-21** counted and tagged `nb_self_reference`, never Strong on its own; **O-22** the Moon counts when benefic and conjunct or opposite Guru. (6) **Tamil:** அஸ்தங்கம் for combustion on every yoga surface; அஸ்தமனம் for sunset only; the ADHI_RAJA_GRADE, 8th-support and Gaja Kesari wording fixed. (7) **B2:** frequencies are not accepted yet; the 3,000-chart sweep was re-run (`docs/DOCTRINE_V17_FREQUENCY_REPORT_2026-10-03.md`); the FORMED / STRENGTH / ACTIVE NOW display model is recorded, not built.

**Change log v1.8:** The owner answered three of the four items the v1.7 packet left open, also on 2026-10-03. Again these are owner rulings applied as code defaults, not a practitioner signature. (1) **Kadagam Guru (A2 / O-23):** keep the moolatrikona co-lord test, and add a named lineage exception: Guru (6+9) takes part in Raja Yoga as the 9th lord and carries its 6th, so every pair it forms grades MIXED, never FULL. It is a table row (`functional_status.RAJA_LINEAGE_EXCEPTIONS`, switch `o23_lineage_exceptions`), not a weaker rule: Kadagam Sani, Kanni Sani, Kumbam Budhan and the three 3rd/11th exclusions stand. The owner's supporting sources were web summaries and an online Laghu Parashari text, so this is recorded as a **Tier C lineage choice**, not a Tier A citation. (2) **O-24 ruled `mixed`:** kendradhipati modifies functional nature and grade; it never removes Raja Yoga eligibility. Pair vetoes still apply after eligibility (Mithunam Guru + Sani stays vetoed). Dhanusu Surya + Budhan must stay capable of yoga; a golden test pins it. The owner read the Dhanus line in an online BPHS transcription (sanskritdocuments.org), so the citation is **provisional Tier A** until a printed edition is checked (§18). (3) **Tamil wording (packet §D):** the owner supplied wording for the v1.7 keys and the older O-2/O-11/O-17 keys, applied on web, shared and backend surfaces. The one-condition card is now **நீசபங்கம்** (was நீச நிவர்த்தி); ADHI_RAJA_GRADE is **அதி யோகம் — முழுப் பலம் உறுதியாகவில்லை**; the source-vetoed pair and kendradhipati copy no longer use engine terms. The backend still described benefic support of the 8th as a benefic that *afflicts* it (`_yoga_helpers`, a string the v1.6 fix missed); corrected. No native reader is recorded as having read the copy on the rendered cards, so §D stays open. The physical-edition ledger (§18) is unchanged.

**Change log v1.9:** On 2026-10-04 the owner ruled on the four items that docs/FULL_READING_STORY_MODE_PLAN_2026-10-04.md §13 left for an astrologer. The owner adopted a consolidated review whose sources were online texts (wisdomlib, vedicpupil, siva.sh and jyotishvidya transcriptions of Phaladeepika ch. 26; a horasad BPHS PDF). So these are **owner rulings applied as code defaults, not a practitioner signature**, and the Phaladeepika citations are **provisional Tier A** until a printed edition is checked (§18). The rulings are recorded as **DD-16**. In summary: (D1) the Lagna-lord line is confirmed. (D2) Sani gochara from the Janma Rasi is supportive only in 3/6/11 and needs care everywhere else; the named Sani periods are a separate axis. This **overturns** the earlier product rule that softened Sade Sati to "neutral" on mobile and called Sani "quiet" in 2/5/7/9/10 in the daily line. (D3) Guru's 1/3/4/10 "Mixed" is kept as Vinaadi grading over a classical non-supportive set. (D4) Top yogas are computed per chart; there is no name hierarchy.

**Change log v2.0:** On 2026-10-05 the owner passed on a review of O-25 and of the pending Tamil copy, signed by its author as "ChatGPT — GPT-5.6 Sol, OpenAI" (an AI review; its author says itself it is not the packet's practitioner or physical-edition signature). Applied as **owner rulings and code defaults**, as with v1.7–v1.9. (1) **O-25 ruled:** "practical impact" is **not** classical doctrine and is not scored as such. It becomes **`structural_reach`**, a Vinaadi product tie-break: houses the forming grahas rule, then houses they occupy, then whether the Lagna or its lord takes part. No universal life-area hierarchy, no generic kendra/trikona points across yoga families, and no house strength (already inside natal strength, so it would count twice). (2) **D4 revised:** the two lists now use different keys. *Lasting gifts*: formed → natal strength → structural reach; the running dasa is a badge there, never a key. *Running now*: formed → activation (a gate, then the tier) → natal strength → structural reach → activation score. (3) **ADHI_RAJA_GRADE** stays out of both consumer Top-3 lists until Saravali is verified in print; it stays in the Astrologer view. (4) **Tamil:** a graha takes no honorific anywhere in the reading (அமைந்துள்ளது, not உள்ளார்); ஆடை over வஸ்திரம் in every remedy; the நீசபங்கம் card says *ஒரு நீசபங்க நிபந்தனை நிறைவேறியுள்ளது*; the qualified-Raja line drops ஒருவர் … ஆள்கிறார்; the 8th-support line says "8-ஆம்" once. The review confirmed the 3 October corrections. The native-reader signature in packet §D stays **blank**: no named human has read the copy.

**Change log v2.1:** On 2026-10-06 the owner passed on a practitioner's written review of one real chart and asked Claude to act as Tamil astrologer, developer and product owner and complete the fix. The review's verdicts were sound and every placement fact in it was correct; it found the *presentation* wrong ("Mitigated · Low intensity" read as neutralised; Sevvai's Moon/Venus-only reckoning was invisible) and one rule unsourced. Recorded as **DD-17**, applied as code defaults with v2.0-restoring options, **not** a practitioner signature: (1) **O-26** the Sevvai "Mars's sign lord in a kendra/trikona from Mars" mitigation is off — no printed source, and on the reviewed chart it alone decided nivarthi. (2) **O-27** a 7th lord protects against Sevvai when own/exalted or in a kendra/trikona, unafflicted, not combust — the Rahu–Ketu 7th-lord test; the old test also required a functional benefic, which only four lagnas' 7th lords ever are. (3) **O-28** the Rahu–Ketu 2/8 axis weighs the 2nd lord's dignity (the broader 8th-side test was measured and rejected for the 2nd: it doubled nivarthi). (4) **O-29** one Guru aspect is counted once (it fired both Guru-on-node and benefic-on-8th). (5) Every dosham now reports a **formation grade** and a **residual** (Tier C): a mitigated dosham is never "none". (6) Facts that shape the reading without moving a grade are reported as **context** (Sevvai not from the Lagna; the node axis not repeating from the Moon/Venus; the axis in the Navamsa, which DD-03 keeps out of the grade). (7) Defects fixed on the way: Badhaka reported nivarthi on charts where it never formed; Kalathra used a `MODERATE` strength every shared helper read as Mild, and printed raw graha codes; Putra Sarpa kept PARTIAL beside its nivarthi label; the "why" text opened with the engine label.

**Implementation instruction:** P0/P1/P2, the dormant O-2/O-11/O-17/O-18 branches and the v1.7 and v1.8 owner rulings are implemented. Every unresolved rule remains feature-flagged and source-tagged. Doctrine constants are not frozen until the verification checklist (section 18) and practitioner sign-off on O-1 to O-24 are complete.

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
- **v1.7 owner ruling (2026-10-03), O-22:** the Moon may be the supporting benefic only when it is benefic (waxing, DD-12) **and** conjunct or opposite Guru. From the 4th or 10th it sets up the kendra but does not aspect Guru, so another benefic is needed. Guru in a kendra **from Lagna** qualifies without the Moon taking part. The detector already enforces both (same-rasi-or-aspect test; Lagna or Moon reference); v1.7 adds tests, not code.

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
    KENDRA_LORD            # owns 4/7/10 — lordship only (v1.7; was KENDRA_NEUTRAL)
    KENDRADHIPATI_BENEFIC  # natural benefic owning a kendra: loses its beneficence (v1.7)
    KENDRADHIPATI_MALEFIC  # natural malefic owning a kendra: sheds its malefic nature (v1.7)
    TRISHADAYA_MALEFIC     # owns 3/6/11
    CONTEXTUAL_2ND         # 2nd lordship — result by association/other sign
    CONTEXTUAL_12TH        # 12th lordship — result by association/other sign
    EIGHTH_SPECIAL_CASE    # owns 8th; lagna-specific exceptions (e.g. also lagna lord)
    EIGHTH_LUMINARY_EXEMPT # Sun/Moon owning the 8th: ownership kept, blemish withdrawn (v1.7)
    MARAKA                 # 2nd/7th lord (timing context only)
```

**v1.7 owner rulings on the matrix (2026-10-03, not a practitioner signature):**
- **Luminaries:** Laghu Parashari and BPHS Ch. 34 exempt the Sun and Moon from the 8th-lordship fault. Dhanusu-Moon and Magaram-Sun carry `EIGHTH_LUMINARY_EXEMPT`, not `EIGHTH_SPECIAL_CASE`. The ownership is not deleted: 8th-house significations still route through the graha. It does not make them benefic. **[Tier A — verse number pending §18]**
- **Kendradhipati:** natural nature follows Laghu Parashari's static list (Guru, Sukran, Budhan, Chandran benefic; Surya, Sevvai, Sani malefic). The lagna lord carries no kendradhipati modifier, because lagna lordship decides first. DD-12's chart-dynamic Moon/Mercury class cannot be seen per lagna. **[Tier A principle; the static list is Tier C at matrix level]**
- **Precedence:** the lagna lord overrides the 8th. For Mesham-Sevvai and Thulam-Sukran, E8 never dominates.
- **Omission:** badhaka lordship is deliberately absent, consistent with Tamil practice.

**DUAL_LORD_YOGAKARAKA rule (explicit):**

```python
DUAL_LORD_YOGAKARAKA = owns_any({4, 7, 10}) and owns_any({5, 9})
```

- House 1 **never** satisfies either side, even though it is geometrically both a kendra and a trikona. Otherwise every lagna lord would wrongly become a yogakaraka.
- Result: exactly six lagnas have a yogakaraka — Rishabam (Sani, 9+10), Kadagam (Sevvai, 5+10), Simmam (Sevvai, 4+9), Thulam (Sani, 4+5), Magaram (Sukran, 5+10), Kumbam (Sukran, 4+9).
- Lagna lords that also own a kendra (Budhan for Mithunam/Kanni, Guru for Dhanusu/Meenam) are `LAGNA_LORD` + `KENDRA_LORD`, **not** yogakaraka, and carry no kendradhipati modifier.

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
- **v1.7 (owner ruling 2026-10-03):** the context is the **occupied house** and its sign lord, conjunctions, and aspects **received**. Laghu Parashari: the nodes give the results of the bhava they occupy and the lord they join. The nodes' own outgoing aspects are a separate lineage decision and are not read here. The rule applies to both nodes.
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
- Output labels (FULL / QUALIFIED / MIXED / MIXED_KENDRADHIPATI) are **Tier C** display labels on top of the matrix.

**v1.7 owner rulings on participation (2026-10-03).** BPHS Ch. 34 (around 34.15) warns that a kendra–trikona relationship does not automatically give Raja Yoga when a lord also owns an evil house, then gives ascendant-specific counterexamples the v1.6 table wrongly allowed.

```text
PARTICIPATION
    lagna lord                      always takes part
    3rd / 6th / 8th / 11th co-lord  takes part only if its moolatrikona sign is the
                                    kendra/trikona it owns   (O-23; 3rd/11th added v1.7)
      named lineage exception       Kadagam Guru (6+9) takes part as the 9th lord;
                                    its 6th stays, so the pair grades MIXED (v1.8)
    12th co-lord                    takes part (O-4 / O-14)
    natural benefic owning two      takes part, grade MIXED_KENDRADHIPATI   (O-24, owner
    kendras (not the lagna lord)    ruling v1.8; "exclude" is the alternative)

SOURCE_VETOED_RAJA_PAIRS            [Tier A — BPHS 34, verse numbers pending §18]
    Mesham    Guru + Sani      no auspicious result from mere association
    Mithunam  Guru + Sani      as for Mesham
    Simmam    Guru + Sukran    no Raja Yoga from mere association

OUTCOME per linked pair
    SOURCE_VETOED_RELATION   pair is in the veto table — forms nothing, recorded
    MIXED_RAJA_RELATION      grade MIXED or MIXED_KENDRADHIPATI
    CONFIRMED_RAJA_YOGA      grade FULL or QUALIFIED
```

- The 3rd/11th extension excludes Mesham Sani (10+11, moolatrikona Kumbam is the 11th), Simmam Sukran (3+10, Thulam is the 3rd) and Kumbam Sevvai (3+10, Mesham is the 3rd). The first two are the review's; the third follows from the same rule and matches BPHS 34's usual reading of Sevvai as malefic for Kumbha.
- Under the default the moolatrikona test already removes Mesham Sani and Simmam Sukran, so the veto table carries Mithunam, and all three if the co-lord test is switched.
- The review asked for kendradhipati handling of the two-kendra benefics (Guru for Mithunam/Kanni, Budhan for Dhanusu/Meenam). Exclusion would also remove Surya + Budhan for Dhanusu, which BPHS 34's Dhanus paragraph is commonly translated as naming as yoga-giving. That conflict is O-24; the default grades them MIXED.
- **v1.8 owner ruling, O-24 — `mixed`.** Kendradhipati (BPHS 34.2–10, as numbered in the online transcription) is a functional-grade modifier, not an eligibility veto; the kendra–trikona rule (34.11–12) still applies to these lords. Eligibility comes first, then the pair rules: Mithunam Guru is eligible, and its pair with Sani is still vetoed. Dhanusu Surya + Budhan stays capable of yoga, graded MIXED_KENDRADHIPATI, never automatically FULL. Provisional Tier A until the printed edition is checked.
- **Kadagam Guru (6+9) — v1.8 owner ruling: a named exception.** Kept excluded in v1.7 with a recorded dissent (many Tamil practitioners regard Guru as a strong benefic for Kataka). v1.8 keeps the moolatrikona test and lets Guru take part as the 9th lord. Its 6th lordship is not erased: every pair it forms (with Sevvai the yogakaraka, Chandran the lagna lord, or Sukran 4+11) grades MIXED. The exception is one table row; it does not change the treatment of any other 6th/8th co-lord. **Tier C** lineage choice — the owner's sources were web summaries, not an edition.
- `lordship_only` is rejected by the owner: it raised Raja Yoga to 86.8% of charts.

| Source | Tier | Verify |
|---|---|---|
| BPHS 34.11–12 (kendra–trikona rule) | A | Verse no. |
| BPHS 34.15 (evil-house ownership caveat) | A | Verse no. and exact wording |
| BPHS 34, ascendant-wise counterexamples (Mesha, Mithuna, Simha) | A | Verse no. per edition |
| BPHS 34, Dhanus — Surya + Budhan (O-24) | A | Verse no. and wording |
| Laghu Parashari (functional lordship) | A | Verse no. for each matrix rule |
| Laghu Parashari — Sun/Moon exempt from 8th-lordship blemish | A | Verse no. |
| Laghu Parashari — nodes give results of bhava and associated lord | A | Verse no. |

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
- **v1.7 owner ruling (2026-10-03), O-13 — the name needs two conditions.** v1.6 fired NBRY on 95% of charts carrying a debilitated graha. Cancellation still needs any one authenticated condition (this DD stands: there is no *classical* count threshold). The *name* is a separate, Vinaadi display rule **[Tier C]**:

  ```text
  NEECHA_NIVARTHI           one distinct condition       label: நீச நிவர்த்தி   (WEAK)
  NEECHA_BHANGA_RAJA_YOGA   two or more, and a firing verse states a raja-yoga result
                            two → PARTIAL, three+ → STRONG
  ```

  Both cards feed the same `neecha_bhanga_cancelled` predicate, so the +14 strength term, the yogakaraka card and bhava palan are unchanged.
- **v1.7 owner ruling, O-21 — Budhan's self-reference counts, tagged.** A rule that fires only because Budhan is its own exaltation-sign lord (NB-b, NB-c, NB-g) is recorded as `nb_self_reference`. Its positional condition must still hold, and such rules can never on their own lift the grade to STRONG (for Budhan they are effectively the deleted NB-e).

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

## DD-16 Reading-surface rulings — Lagna lord, gochara, top yogas (owner, 2026-10-04)

Source tier as in the v1.9 change log: owner rulings, provisional Tier A citations, no practitioner signature.

**D1 — Lagna lord's house (CONFIRMED).** *"Life's attention tends to turn there."* The Lagna lord's placement says where life's attention, effort or involvement goes (BPHS gives the house-by-house results of the Lagna lord). It does **not** say that house is strong, successful or fortunate; dignity, conjunction, aspects and house condition still decide that, so no surface may read it as a verdict. Code: `web/components/chart-reading/story-who.tsx`.

**D2 — Sani gochara from the Janma Rasi (REVISED).**

```text
SANI_SUPPORTIVE_FROM_MOON = {3, 6, 11}
SANI_NEEDS_CARE_FROM_MOON = {1, 2, 4, 5, 7, 8, 9, 10, 12}
SADE_SATI = {12, 1, 2}   ARDHASHTAMA = {4}   ASHTAMA_SANI = {8}   (separate, named alerts)
```

There is no neutral band. The 5th, 7th, 9th and 10th need care because Phaladeepika 26's detailed verses name difficulties there, not because they are named periods. The engine kept "special named Saturn period" and "ordinary unfavourable gochara" as two axes, and still does. A care-grade house now reads with one of two strengths of wording: *pressing* in the named-period houses, *asks for patience* elsewhere. Neither reads as neutral.

**D3 — Guru gochara (ACCEPTED WITH LABEL).**

```text
CLASSICAL_GURU_SUPPORTIVE     = {2, 5, 7, 9, 11}
CLASSICAL_GURU_NON_SUPPORTIVE = {1, 3, 4, 6, 8, 10, 12}
VINAADI GRADE: 2/5/7/9/11 SUPPORTIVE · 1/3/4/10 MIXED · 6/8/12 NEEDS_CARE
```

Do **not** document "classical astrology calls Guru in 1/3/4/10 mixed". The Mixed band is Vinaadi's presentation grade, chosen to avoid catastrophic wording, and the classical set is kept beside it in code.

**D4 — Top yogas (ACCEPTED).** "Top 3" means the three most consequential yogas *in this chart*, never a fixed ranking of yoga names. The keys, in order:

1. Formation validity: the full conditions hold.
2. Natal effective strength: the engine's strength grade, then fewer cancellation/affliction factors.
3. Current activation: the Maha/Antar activation tier.
4. The engine's per-chart activation score as the final tie-break.

There are two lists: `top_natal_yogas` (strongest lasting) and `top_active_yogas` (strongest the running dasa activates). D4's fourth criterion, **practical impact** (which life areas the yoga governs), was open as **O-25**.

**D4 revised by the O-25 ruling (owner, 2026-10-05; AI review, provisional).** The two lists answer different questions, so their keys differ:

```text
LASTING GIFTS (top_natal_yogas):  formed → natal strength (grade, then fewer cancellations) → structural_reach
RUNNING NOW   (top_active_yogas): formed → activated (gate) → activation tier → natal strength → structural_reach → activation score
```

Today's dasa does not decide which yogas are a person's strongest lifelong ones: in Lasting gifts activation is an "Active now" badge, never a key. A yoga the dasa is not activating is not listed under Running now.

**`structural_reach` is a Vinaadi tie-break, not classical doctrine.** No classical text gives a universal "top yogas by life impact" rule; the texts support its ingredients (lordship, placement, the kendra–trikona relationship, timing by dasa). Computed on the server per yoga from its forming grahas (`_chart_build._structural_reach`, wire field `structuralReach`) and encoded lexicographically: houses **ruled** (×100) before houses **occupied** (×10), then **+1** when the Lagna or the Lagna lord takes part. It deliberately carries no kendra/trikona weight (one weight across yoga families with different logic) and no house strength (already in natal strength). **Blind spots, recorded beside the ruling:** it cannot see what each yoga family is classically said to produce, nor which houses are central to a particular family; two yogas formed by the same grahas reach equally. The review's suggested finer activation order (both forming lords in Maha/Antar > one directly running > indirect) is already DD-15's STRONG / MODERATE tier.

**ADHI_RAJA_GRADE** never enters either consumer Top-3 list until its Saravali source is verified in print (§18); it stays in the Astrologer view.

**Where it lives (one table, three runtimes):**

| Rule | Backend | Web / mobile |
|---|---|---|
| D2, D3 | `app/calculations/gochara_grade.py` (read by `narrative_engine._TRANSIT_QUALITY` and `gochar_spoken`) | `packages/shared/src/api/transits.ts` `gocharaGrade` (read by `moonHouseImpact` on mobile and the reading's chapters on web) |
| D4 / O-25 | `app/services/reading_story.py` (the `story` picks); `_chart_build._structural_reach` | `web/components/chart-reading/reading-selectors.ts` `topNatalYogas` / `topActiveYogas` (fallback when no `story`) |

`tests/test_gochara_grade.py` pins D2/D3 and parses the TypeScript arrays so the two runtimes cannot drift. D4 is pinned in `reading-selectors.test.ts`, including an input-order test that would catch a hidden name ordering. Already consistent and left unchanged: `personal_palan._GOCHARA_GOOD` (classical sets) and `chart_explanation_service._peyarchi_text` (Guru's grade matches D3 exactly).

---

## DD-17 Dosham reckoning — formation, residual, reference points, context (2026-10-06)

Source tier: rulings applied by Claude acting for the owner, after a practitioner's written review of one real chart (owner-passed). Not a practitioner signature; each has an option that restores v2.0, and §16 carries them as O-26 to O-29.

**What the review found.** Its placement facts were all correct and its verdicts matched the engine's: both doshams mitigated. What was wrong was what the reader could see. (a) "Mitigated · Low intensity" read as neutralised, while classical judgement keeps a residual — the 2/8 axis is still there after Guru aspects it. (b) The single most important fact about that Sevvai — counted from the Moon (7th) and Venus (4th), **not** from the Lagna (3rd) — was nowhere on the card. (c) The axis *not* repeating from the Moon, Venus or in the Navamsa was the reviewer's strongest mitigating argument; the engine checked the Moon/Venus repetition but could only ever voice its presence, never its absence. (d) One cancellation the card showed ("Mars sign-lord is in a kendra or trikona") was counted from Mars, the label said nothing of it, and no text is cited for it.

**O-26 — Sevvai dispositor mitigation: off.** `mars_dispositor_kendra_trikona` came from `docs/SEVVAIRAGU.MD` §6.7, an internal design note, with no textual source. On the reviewed chart it was one of exactly two mitigations, so it alone decided nivarthi versus a strong active dosham. A rule that decides verdicts needs a source; until one is produced it is off. Option `o26_sevvai_dispositor_mitigation = "from_mars"` restores it, and its label now says "counted from Mars".

**O-27 — the strong 7th lord (Sevvai).** Before: `benefic_strong_seventh_lord` required a functional benefic **and** a kendra from the Lagna. The 7th lord is a functional benefic for only four lagnas (Mithunam, Kanni, Dhanusu, Meenam: measured with `_is_functional_benefic` over all twelve), so on eight lagnas no 7th lord — exalted or not — could ever protect against Sevvai. Now it is the test the Rahu–Ketu axis already used: own sign, exaltation or a kendra/trikona from the Lagna; not joined by Sevvai, Sani, Rahu or Ketu; not combust (`_yoga_dosham._lord_is_strong`). One chart, one answer to "is the 7th lord strong". Option: `kendra_functional_benefic`.

**O-28 — the 2nd house on the 2/8 axis.** DD-03's table weighed the 8th house's support (`strong_eighth_lord_or_benefic_on_eighth`) and not the 2nd's, though the node in the 2nd sits in the kudumba sthana. Added as `second_lord_dignified`: the 2nd lord in its own or exaltation sign, unafflicted, not combust — the classical "bhava lord strong" reading. The 8th side's broader test (any kendra/trikona placement, or a benefic on the house) was built first and **measured**: applied to the 2nd it doubled the axis's nivarthi rate, the opposite of what a review complaining of over-softened doshams asked for. It remains an option (`strong_or_benefic`); the asymmetry with the 8th side is deliberate, not tidied away.

**O-29 — Guru counted once.** On the 2/8 axis a node always sits in the 8th, so a Guru aspect on it fired both `guru_joins_or_aspects_node` and the benefic-on-the-8th test — one fact, two grades. The house-support tests now read the other benefics only.

**Formation and residual (Tier C, engine convention).** Every dosham reports `formation_strength` (the grade before any mitigation) and `residual` (what remains): NONE when not formed; for an active dosham its strength renamed (PARTIAL → MODERATE); for a mitigated one **MILD**, or **MODERATE** when a STRONG formation standing on the primary reference (the Lagna) was offset by exactly the threshold number of mitigations (`_yoga_helpers.dosham_residual`). A mitigated dosham is never NONE: nivarthi lowers a dosham, it does not erase the placement (the reasoning of O-18). Surfaces show "Mitigated · mild residual", never a bare "Mitigated" or "Low intensity".

**Context, never counted.** `context_notes` carry facts that shape the reading without moving a grade: `sevvai_not_from_lagna`, `rk_axis_not_repeated_from_moon_venus`, `rk_axis_repeated_in_navamsa` / `rk_axis_not_repeated_in_navamsa`. DD-03 keeps the Navamsa out of the Rahu–Ketu grade and that stands; the Navamsa is now *read* and *shown*. `reference_houses` lists each reference point (Lagna, Moon, Venus, Navamsa Lagna) with the house counted from it, so the card shows the reckoning the reviewer wrote out by hand. `meaning_*` carries what the formed axis tends to bring per node and house (`RK_NODE_HOUSE_MEANING`), as tendencies, never outcomes.

**Blind spots, recorded beside the ruling.** The residual threshold is ours, not a text's. The Moon reference is weighed equally with the Lagna for Sevvai's *formation* grade (a 7th from the Moon plus a second reference still grades STRONG); only the residual and the context note discount a Moon/Venus-only Sevvai. A practitioner may prefer to discount it in the formation grade itself — that would be O-30 if raised.

**Where it lives.** Engine: `app/calculations/_yoga_dosham.py`, `_yoga_helpers.py`. Wire: `ChartDoshamInsight.formationStrength / residual / contextNotes / referenceHouses / meaningTa / meaningEn`. Words: `packages/shared/src/doshamReckoning.ts` (web and mobile), `yoga_display.dosham_standing_word` (PDF). Cards: `web/components/dosham-reckoning-block.tsx` on every web dosham card; `mobile/app/(tabs)/tools/dosham.tsx`. Tests: `tests/test_doctrine_decisions_dd17.py`, `web/components/dosham-reckoning-block.test.tsx`. Frequencies: `docs/DOSHAM_DD17_FREQUENCY_REPORT_2026-10-06.md`.

---

## 16. Open items for practitioner ruling

| # | Question | Default until ruled |
|---|---|---|
| O-1 | Rahu–Ketu: include "from Moon" / "from Venus" checks? | Secondary, severity only |
| O-2 | Node-dignity lineage (which signs are favourable for Rahu/Ketu)? | **Owner ruling 2026-10-03: keep disabled** (lineages conflict). Enabling requires a named printed source and explicit Rahu/Ketu rasi lists; Vinaadi supplies no list |
| O-3 | Cross-samyam between Rahu–Ketu and Sevvai? | Astrologer view only, off |
| O-4 | 12th co-lordship treatment in the functional-status matrix (DD-07): confirm each lagna-specific case | `CONTEXTUAL_12TH`. Never automatically downgrade an otherwise qualifying kendra/trikona lord solely because it also owns the 12th |
| O-5 | Gaja Kesari base form with neecha-bhanga Guru: graded or suppressed? | Graded |
| O-6 | Sevvai Kadagam/Simmam: universal exemption, or limited to certain Mars positions? Printed Tamil source needed (DD-06) | Strong mitigation, never full erasure |
| O-7 | Neecha bhanga in navamsa (NB-f): source and inclusion? | Excluded |
| O-8 | Lagna-lord strength threshold (60) and penalty sizes after fixture testing | 60 |
| O-9 | Sign-off of the 12 × 7 functional-status matrix (84 cells, DD-07), especially 12th-lord and 8th-lord cells, and of the separate Rahu/Ketu functional-context rules | Matrix built, **unsigned**. Owner corrections 2026-10-03 applied (luminary 8th exemption, KENDRA_LORD + kendradhipati split, LL over E8, node context by occupied house); awaiting practitioner signature |
| O-10 | NB-g (Phaladeepika 7.30): kendra from Lagna only, or Lagna/Moon? | Lagna |
| O-11 | Adopt the retrograde-debilitated-planet raja yoga (Phaladeepika Ch 7) as a separate rule? | **Owner ruling 2026-10-03: keep off** until "bright rays" is modelled; non-combust is not the rashmi condition, and copy must never claim it is. Candidate verse: Phaladeepika 7.3 (§18) |

**Added during implementation (v1.4).** Each is a conflict or gap found while coding P0/P1. No practitioner ruling is invented in code: defaults preserve this document or shipped behavior. Every operational alternative is exposed as an admin flag (`doctrine_o<n>_...`).

| # | Question | Default until ruled |
|---|---|---|
| O-12 | The engine shipped two neecha-bhanga conditions that are **not** in DD-09's Phaladeepika table: (a) the planet that *exalts* in the debilitation sign in a kendra from Lagna/Moon (BPHS-style); (b) the debilitated planet aspected by the lord of its *exaltation* sign. Is either sourced, and under which verse? | Excluded (DD-09's table governs). Flagged |
| O-13 | DD-09 says `NEECHA_BHANGA_RAJA_YOGA` applies "where the cited verse itself gives raja-yoga result" but does not mark which verses do. All of 7.26–30 sit in Phaladeepika's raja-yoga chapter. Confirm each verse states a raja-yoga result. | Every 7.26–30 rule treated as giving one. **Owner ruling 2026-10-03:** the raja-yoga name also needs two or more distinct conditions (`o13_nb_raja_min_points = 2`); one condition is நீச நிவர்த்தி (`NEECHA_NIVARTHI`) |
| O-14 | The 2026-09-23 moolatrikona ruling downgraded three 12th co-lords in Raja Yoga — Rishabam Sevvai (7+12), Thulam Budhan (9+12), Viruchigam Sukran (7+12). DD-07 / O-4 says never downgrade for the 12th alone. Which governs? | O-4 (this document). The moolatrikona reading is the switchable alternative |
| O-15 | DD-07 reads the Raja Yoga link as conjunction / **mutual** aspect / exchange. Audit L-3 had added a **one-way** special aspect (Sevvai 4/8, Guru 5/9, Sani 3/10). Does a one-way special aspect link? | Mutual only. Flagged |
| O-16 | DD-15 makes the Moon a secondary activator for Sunapha, Anapha, Durudhura and Adhi. The 2026-09-23 ruling said Chandran is the reference point, not a trigger. Which governs? | DD-15 table. Flagged |
| O-17 | `BHAGYA_SUPPORT` is "well placed but dignity not met". Two cases get no label: a dignified 9th lord in a trikona only, and a dignified 9th lord in a kendra with a lagna lord below threshold. Label them, and how? | **Owner ruling 2026-10-03: `literal`** (no pseudo-yoga from "almost Lakshmi"). `all_incomplete_lakshmi` kept as the alternative |
| O-18 | The Sevvai detector still cancels outright for Mesham/Viruchigam lagna with Mars in the 1st or 2nd - the same "lagna exempts Mars" pattern DD-06 withdrew for Kadagam/Simmam. Keep, or treat as a strong mitigation too? | **Owner ruling 2026-10-03: `strong_mitigation`** — a false "no dosham" is the costlier error in a marriage reading. Vinaadi's deliberate divergence from the popular Tamil list (aatchi/ucham as nivarthi) |
| O-19 | NB-a and NB-b read "kendra from Lagna **or Moon**". When the lord in question **is** the Moon — Sevvai debilitated in Kadagam, and Guru, who exalts in Kadagam — the Moon is always in the 1st from itself, so a literal reading cancels **every** such debility. Does the Moon reference count for the Moon? | Literal reading (the shipped behaviour). Flagged |
| O-20 | For the DD-08 raja-grade candidate, does "serious malefic affliction" include a malefic's poorna drishti on a forming benefic, or only a malefic occupying the 6th/7th/8th from Chandran? | Occupants only. Malefic aspects are excluded unless the flag is enabled |
| O-21 | Budhan is debilitated in Meenam and rules Kanni, its own exaltation sign. Read literally, NB-b ("exaltation-sign lord in a kendra"), NB-c and NB-g then test the debilitated Budhan's own position — which is NB-e, deleted by DD-09. Does the self-reference count? | **Owner ruling 2026-10-03: counted, tagged `nb_self_reference`**, never STRONG on its own (DD-09 section). `false` skips it (v1.6) |
| O-22 | DD-01's strict form requires Guru "joined or aspected by a benefic". A waxing Moon beside or opposite Guru is such a benefic — but it is one of the yoga's two grahas. May it be the support? | **Owner ruling 2026-10-03: yes**, when benefic and conjunct or opposite Guru — never from the 4th/10th (DD-01 section) |
| O-23 | The 2026-09-23 ruling admits a 6th/8th co-lord to Raja Yoga only if its moolatrikona sign is the kendra/trikona it owns. That shuts Kadagam Guru (6+9) and Sani (7+8), Kanni Sani (5+6) and Kumbam Budhan (5+8) out of every Raja Yoga, against DD-07's "trikona lordship dominates" reading. Which governs? | **Owner ruling 2026-10-03: the moolatrikona test, extended to 3rd/11th co-lords** (`moolatrikona_3_6_8_11`); also excludes Mesham Sani, Simmam Sukran, Kumbam Sevvai. `lordship_only` rejected. **v1.8:** Kadagam Guru re-admitted as a named exception (`o23_lineage_exceptions`), graded MIXED by its 6th |

**Added v1.7.**

| # | Question | Default until ruled |
|---|---|---|
| O-24 | The owner's review asked for kendradhipati handling of natural benefics owning two kendras (Guru for Mithunam/Kanni, Budhan for Dhanusu/Meenam). Excluded from Raja Yoga, or taking part at a mixed grade? Exclusion also removes Surya + Budhan for Dhanusu, which BPHS 34's Dhanus paragraph is commonly translated as naming as yoga-giving. | **Owner ruling 2026-10-03 (v1.8): `mixed`.** Takes part, grade `MIXED_KENDRADHIPATI`; a grade modifier, never an eligibility veto; pair vetoes still apply. `exclude` kept as the alternative. Dhanus verse provisional Tier A until checked in print (§18) |
| O-25 | DD-16 D4's fourth ranking key, **practical impact**: how should a yoga's life-area consequence be measured for the Top-3 ranking (houses it governs? the bhava strength of those houses?), and should it come before or after current activation? | **Owner ruling 2026-10-05 (v2.0; AI review, provisional): not classical doctrine.** Renamed `structural_reach`, a Vinaadi tie-break: houses ruled → houses occupied → Lagna involvement; no life-area hierarchy, no generic kendra/trikona points, no house strength. Lasting gifts drop activation as a key; Running now gates on it. ADHI_RAJA_GRADE kept out of both Top-3 lists until Saravali is verified. See DD-16 D4 |

**Added v2.1 (DD-17).** Applied for the owner on 2026-10-06; practitioner confirmation wanted. Admin flags `doctrine_o26_…` to `doctrine_o29_…`.

| # | Question | Default until ruled |
|---|---|---|
| O-26 | Sevvai: does Mars's sign lord in a kendra/trikona **from Mars** mitigate? No printed source is known; it came from an internal design note | **Off.** `from_mars` restores v2.0 (label now says "counted from Mars") |
| O-27 | Sevvai: does a dignified 7th lord protect outside a kendra, and must it be a functional benefic? | **Own/exalted or kendra/trikona, unafflicted, not combust** (the Rahu–Ketu test). `kendra_functional_benefic` restores v2.0, under which only four lagnas' 7th lords could ever qualify |
| O-28 | Rahu–Ketu 2/8: is the 2nd house's support read, as the 8th's is? | **Yes, by dignity:** the 2nd lord own/exalted, unafflicted, not combust (`dignity`). `strong_or_benefic` (the 8th's broader test) and `off` are the alternatives |
| O-29 | Rahu–Ketu: may one Guru aspect count both as Guru-on-node and as benefic-on-house? | **No, counted once** |
| O-30 | Sevvai counted only from the Moon and/or Venus still grades STRONG before mitigation (a 7th from the Moon plus a second reference). Discount a non-Lagna Sevvai in the formation grade itself? | Not discounted; only the residual and the `sevvai_not_from_lagna` context discount it (DD-17 blind spot) |
| O-31 | A mitigated Rahu–Ketu axis: the placement stays, so should its residual floor be a "mild–moderate" grade rather than MILD (owner-forwarded review, 2026-10-06)? | Three public grades kept; every Rahu–Ketu verdict says "the placement itself remains". No grade tuned to one chart |

**Added v2.2 (2026-10-06, evening).** Owner ruling, forwarded from a practitioner's written answer; not a signature. Admin flag `doctrine_o32_putra_sarpa_thulam_sani`.

| # | Question | Default until ruled |
|---|---|---|
| O-32 | Putra Sarpa: Sani in the 5th is a trigger. For Thulam lagna, Sani in Kumbam is the 5th lord, in its own sign, and the yogakaraka (4th + 5th). Does it form the dosham? | **Owner ruling 2026-10-06: `neutralized`.** The placement is recorded (`fifth_house_has_saturn`, with `saturn_yogakaraka_own_fifth` as the reason; chip "Neutralized") but does not form the dosham. A node in the 5th or beside Guru still forms it, graded as usual. Deliberately this one case: 5th lord + own sign + yogakaraka; not "own sign always cancels". Hierarchy used: placement → dignity → ownership/function → affliction → final strength. `ordinary` counts it as any Sani in the 5th. Found alongside: Sani "beside the 5th lord" compared Sani with itself, so every Thulam-lagna chart formed Putra Sarpa (code defect, fixed regardless of this option) |

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
- [ ] BPHS 34 ascendant-wise Raja Yoga counterexamples (Mesha/Mithuna Guru+Sani, Simha Guru+Sukran) and the Dhanus Surya+Budhan line (O-24)
- [ ] Phaladeepika 7.3 (O-11 candidate verse)
- [ ] Laghu Parashari: the Sun/Moon 8th-lordship exemption; the nodes giving the results of their bhava and associated lord
- [ ] Practitioner sign-off on Open items O-1 to O-11
- [ ] Practitioner ruling on O-12 to O-24 (raised during implementation and review). The owner ruled O-2, O-11, O-13, O-17, O-18, O-21, O-22, O-23 (with the Kadagam Guru exception) and O-24 on 2026-10-03; a practitioner still confirms or corrects them
- [ ] O-9 packet section A2 (Raja Yoga participation) — owner-corrected 2026-10-03, unsigned
- [ ] Native Tamil review of the 2026-10-03 wording (packet section D) — owner-supplied wording applied in v1.8; not yet read on the rendered cards by a named native reader

---

## 19. Implementation status (2026-10-03)

**v1.8 (second round of owner rulings, 2026-10-03).**

| Item | Where | What changed |
|---|---|---|
| Kadagam Guru (A2 / O-23) | `functional_status.RAJA_LINEAGE_EXCEPTIONS`, `raja_participation`; `doctrine_options.o23_lineage_exceptions`; admin flag `doctrine_o23_lineage_exceptions` | Default `true`: Guru takes part with basis `kadagam_guru_9th_lord_exception`; `raja_grade` already grades any pair with a 6th co-lord MIXED, so no new grade or display copy. `false` restores v1.7. Exclusion set is now six lords |
| O-24 | `doctrine_options`, `OPEN_ITEMS` | Default unchanged (`mixed`); recorded as ruled. Golden Dhanusu Surya + Budhan test; Mithunam Guru eligible with its Sani pair still vetoed |
| Tamil (§D) | `yogaDisplay.ts`, `yoga_rules` name_ta, `_yoga_detect` descriptions, `_yoga_helpers`, `dashboard-yoga-dosham-panel.tsx` | NEECHA_NIVARTHI → நீசபங்கம்; ADHI_RAJA_GRADE → அதி யோகம் — முழுப் பலம் உறுதியாகவில்லை (English: "full strength not confirmed"); RETROGRADE_DEBILITATED_RAJA_YOGA → வக்கிர நீச கிரக ராஜயோகம்; new wording for `nb_self_reference`, `raja_grade_mixed_kendradhipati`, `raja_pair_source_vetoed_<a>_<b>`, the O-2/O-11/O-17 markers, the Gaja Kesari base and BHAGYA_SUPPORT descriptions. Backend 8th-support "afflicts" string fixed |
| Tests | `tests/test_doctrine_decisions_v18.py`; v13/v17/activation-agreement tests updated | The v1.7 exclusion set is pinned with the exception switched off; the v1.8 set with it on |
| Frequency | `docs/DOCTRINE_V17_FREQUENCY_REPORT_2026-10-03.md`, v1.8 section | Raja Yoga 76.43% → 78.63% (66 of 3,000 charts), all MIXED-only; CONFIRMED unchanged at 56.87%; every other row unchanged |

**Deviations from the supplied wording, each deliberate.** லக்ஷ்மி, not லட்சுமி, to match the yoga card's name on the same screen. "Vinaadi-யில்" dropped from the O-2 marker (Latin script mid-sentence, and வினாடியில் reads as "in a second"). "தற்போது" (now) dropped from the retrograde marker: a natal retrograde is a birth fact. Where the wording carried a `{கிரகம்}` placeholder on a static marker, it reads கிரகம். For `raja_grade_mixed_kendradhipati` the generic sentence is used, as supplied, though the detector does establish kendradhipati exactly. The source-vetoed pair uses the supplied "more formal" variant, which names no product.

**Reader review of the §D copy (2026-10-03, same day).** A review passed on by the owner returned "approve with minor copy corrections". It does not name the reader, so packet §D's signature stays blank. Applied: நீசபங்கம் used throughout its card (strength lines; "குறைகிறது", never "நீங்குகிறது"); that card's outcome hedged and its how-to no longer claims service makes the cancellation hold; ஆடை for வஸ்திரம் in its remedies; the 8th-support line made identical on web and backend, with "— இதனால் தாக்கம் குறைகிறது"; "இயந்திரக் குறிகை" replaced; `raja_grade_mixed` without the "6/8" shorthand; combustion standardised to அஸ்தங்கமடைந்துள்ளது / அஸ்தங்கமடையவில்லை / அஸ்தங்கமடைந்துள்ளன, with no honorific -ார் and a plural that follows the planet count; smaller fixes to Gaja Kesari, Adhi ("its full strength", since the engine tests Adhi at full strength, not a Raja Yoga), Bhagya, Budha-Aditya and the mixed-kendradhipati line. `web/lib/combustion-verb.test.ts` guards the verb form; run against the pre-fix panel it reports 8 offending lines, so it can fail. By analogy, not reviewed: `raja_grade_qualified` lost its "2/3/11/12" shorthand. Left for the reader: the Neecha Bhanga Raja Yoga card's remedies still say வஸ்திரம், and the நீசபங்கம் card's explanation still says "நிவர்த்தி நிபந்தனை".

**Open question raised by the wording (not ruled).** The supplied note says that if ADHI_RAJA_GRADE "is only an internal source-verification state rather than an astrological state, do not display it to the consumer at all". It is both: the engine has checked its astrological conditions (forming benefics not combust, no serious malefic affliction), and the *source* of the raja-grade rule (Saravali) is unlocated. The card is still shown under the new wording. Hiding it would be a product change for the owner to make.

**What the v1.8 checks cannot see.** The new tests prove the exception touches exactly one cell and that every Kadagam Guru pair grades MIXED; they cannot say whether a practitioner agrees. Nothing in CI reads Tamil for meaning: the label tests pin strings, not sense.

**v1.7 (owner rulings of 2026-10-03).**

| Item | Where | What changed |
|---|---|---|
| O-9 matrix | `functional_status.py` | `EIGHTH_LUMINARY_EXEMPT` on Dhanusu-Moon and Magaram-Sun; `KENDRA_NEUTRAL` → `KENDRA_LORD`; `KENDRADHIPATI_BENEFIC` / `_MALEFIC` on every non-lagna-lord kendra lord; `derive_status` re-derives all of it, so the table is still pinned. SHA-256 in the packet changes accordingly. `MATRIX_SIGNED_OFF = False` |
| A2 / O-23 | `functional_status.raja_participation` | Default `moolatrikona_3_6_8_11`: seven lords excluded (four 6th/8th, plus Mesham Sani, Simmam Sukran, Kumbam Sevvai). `moolatrikona` (6th/8th only) and `lordship_only` remain |
| A2 vetoes | `functional_status.SOURCE_VETOED_RAJA_PAIRS`, `detect_raja_yoga`, the facade's exchange path | A vetoed linked pair forms nothing; it is an absent instance carrying `raja_pair_source_vetoed_<a>_<b>`, no key grahas. `raja_relation()` returns CONFIRMED / MIXED / SOURCE_VETOED |
| O-24 (new) | `raja_participation`, `raja_grade` | Two-kendra natural benefics take part at `raja_grade_mixed_kendradhipati` by default; `exclude` shuts them out |
| O-13 | `detect_neecha_bhanga`, `yogas.py`, `yoga_rules` YOG-NBR-02, web/shared labels | One condition → `NEECHA_NIVARTHI` (நீச நிவர்த்தி, WEAK); two or more → `NEECHA_BHANGA_RAJA_YOGA`. `o13_nb_raja_min_points = 1` restores v1.6 |
| O-21 | `neecha_bhanga.py` | Default `true`. `self_reference_rules`, `independent_points`, `strength`; marker `nb_self_reference`. Note the cancellation now reaches every consumer of the predicate (strength term, bhava palan) for a Budhan whose only bhanga is self-referenced |
| O-18 | `doctrine_options`, `feature_flags` | Default `strong_mitigation` |
| O-2 / O-11 / O-17 / O-22 | — | Defaults confirmed; O-22 needed no code (tests added) |
| Tamil | `_yoga_detect`, `family_harmony_remedies`, `narrative_engine`, `chart_explanation_service`, web panels, `yogaDisplay.ts` | அஸ்தங்கம் for every combustion use; அஸ்தமனம் only for sunset. ADHI_RAJA_GRADE → ராஜ நிலைக்கு வாய்ப்புள்ள அதி யோக அமைப்பு; 8th-support label; Budha-Aditya expanded copy |
| Tests | `tests/test_doctrine_decisions_v17.py` | One test per ruling; the three BPHS pairs under all three co-lord modes. Run with the veto table emptied and the 6th/8th-only test, all three pairs form — the gate can fail |

**Not built (recorded):** the FORMED / STRENGTH / ACTIVE NOW display model, and the consumer "Raja Yoga" label gate (neither lord combust, debilitated without cancellation, or in 6/8/12). Both are product display work, to be decided on the re-run frequencies.

**What the v1.7 checks cannot see.** Every new citation (BPHS 34 pairs, the Dhanus line, the Laghu Parashari luminary and node verses, Phaladeepika 7.3) is unverified against a physical edition. The Tamil wording was ruled by the owner, not read in context by a native reviewer. The veto table pins three named pairs; BPHS 34 has counterexamples for other lagnas that are not encoded. O-24's default rests on a commonly cited reading of the Dhanus paragraph, not on an inspected edition.

**v1.6 and earlier.** P0, P1 and P2 are implemented. Nothing is frozen: every open-item default lives in `app/calculations/doctrine_options.py` (`DEFAULT_DOCTRINE`) and is mirrored by an admin flag in `app/services/feature_flags.py`; `current_doctrine_options()` reads the flags once per chart build and passes them down. O-2, O-11, O-17 and O-18 now have executable alternatives whose defaults preserve the previous result. O-9 remains `functional_status.MATRIX_SIGNED_OFF = False`; generated review material is not a signature.

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
- Tamil copy added for the new markers, labels and activation states has not been read by a native reviewer. This includes the O-2 lineage marker, O-11 card/markers and O-17 dignified-support wording added in v1.5, and the v1.6 corrections (a benefic said to *afflict* the 8th; the raja-grade Adhi label that dropped "candidate" in Tamil only). Combustion was written அஸ்தங்கம் on the yoga cards and அஸ்தமனம் elsewhere; the owner chose அஸ்தங்கம் on 2026-10-03 (v1.7).
- The 84-cell matrix is pinned to its ownership derivation, so the test proves the table carries no typo, not that the statuses are right. The E8 status on Dhanusu-Moon and Magaram-Sun ignored the reading that the Sun and Moon carry no 8th-lordship blemish; the owner ruled it on 2026-10-03 (v1.7, `EIGHTH_LUMINARY_EXEMPT`), and the practitioner still confirms the verse.
- Mobile shows DD-15's states in the "How?" sheet only; its yoga cards carry no timing line. No device pass was run.
