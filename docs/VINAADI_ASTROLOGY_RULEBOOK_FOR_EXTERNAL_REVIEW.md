# Vinaadi Astrology Rulebook — external review edition

**Purpose.** This is the single working checklist for astrologers reviewing what
Vinaadi *actually calculates and applies*.  Please mark each rule as **Correct**,
**Incorrect**, **Incomplete**, or **School/tradition variant**, and give the
source (book/edition/page, panchangam publisher, or lineage) for any correction.

**Snapshot date:** 2026-08-18  
**Scope:** live calculation and interpretation rules in the codebase. It excludes
pure UI, database, and language rules. It includes custom product scoring, but
labels it clearly so it is never mistaken for a classical rule.

## How to read this document

| Marker | Meaning |
|---|---|
| **[CORE]** | Locked foundational convention used across modules. |
| **[TRADITION]** | Implemented traditional rule/table; suitable for source checking. |
| **[PRODUCT]** | Vinaadi calibration or presentation policy, not claimed as a shastra rule. |
| **[VARIANT]** | Deliberate school choice; another authentic practice may differ. |
| **[LIMIT]** | Present but simplified, or intentionally not used for prediction. |

A rule may carry **two markers**. That is deliberate, not indecision: several
rules are a traditional principle wrapped in a Vinaadi calibration, and marking
the whole thing `[TRADITION]` would claim source authority for our arithmetic.
`GO-07` and `POR-12`/`POR-12a` are the clearest cases.

**Tables live in a generated companion file.** Every lookup table this document
refers to is printed in full in
[the table appendix](VINAADI_RULEBOOK_TABLE_APPENDIX.md), which is generated
directly from the constants the engine evaluates and kept in sync by a test. A
reviewer should never have to take a table on trust, and a table hand-copied into
prose drifts from the code the day after it is written.

When reporting an issue, please use the rule ID (for example, `PAN-07`) and
state whether the proposed correction affects a calculation, a label, a timing
window, or explanatory text.

## A. Foundation: chart construction

- `CORE-01` **[CORE]** All longitudes use the **Lahiri sidereal ayanamsa**. Vinaadi does not use tropical zodiac positions.
- `CORE-02` **[CORE]** Rahu is calculated as the **mean node**. Ketu is always exactly 180° opposite Rahu. The true node is not used in current live calculations.
- `CORE-03` **[CORE]** The natal chart uses the nine grahas: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, and Ketu.
- `CORE-04` **[CORE]** Houses for the primary reading are **whole-sign houses**: the rasi containing Lagna is house 1, and every following rasi is the next house.
- `CORE-05` **[CORE]** The South-Indian rasi chart has fixed signs; planets and Lagna move within that fixed sign grid.
- `CORE-06` **[TRADITION]** Rasi is derived by 30° divisions; nakshatra by 13°20′ divisions; pada by 3°20′ divisions.
- `CORE-07` **[TRADITION]** Nakshatra lords use the Vimshottari sequence: Ketu, Venus, Sun, Moon, Mars, Rahu, Jupiter, Saturn, Mercury, repeating.
- `CORE-08` **[TRADITION]** Lagna is calculated for the supplied birth place and local birth time converted to UTC; it is marked uncertain when birth time is unknown/approximate.
- `CORE-09` **[TRADITION]** Sign lordship, exaltation/debilitation, moolatrikona ranges, natural friendship/enmity, functional nature by Lagna, dignity, avastha, and standard Parashari aspects are available to interpretation modules.
- `CORE-10` **[VARIANT]** Node aspects are read as 5th/7th/9th in the current interpretation layer. This is documented as the chosen node-aspect tradition, not universal Parashari consensus.
- `CORE-11` **[TRADITION]** Special aspects: Mars 4th/7th/8th; Jupiter 5th/7th/9th; Saturn 3rd/7th/10th; other grahas 7th.
- `CORE-12` **[LIMIT]** The product does not claim a full six-fold Shadbala calculation. Its dignity/strength outputs are a simplified interpretation aid, not Shadbala.

## B. Divisional charts, strengths, yogas, and doshas

- `DIV-01` **[TRADITION]** Varga calculations include D2 Hora, D3 Drekkana, D4 Chaturthamsa, D7 Saptamsa, D9 Navamsa, D10 Dashamsa, D12 Dwadasamsa, D16 Shodashamsa, D20 Vimsamsa, D24 Chaturvimsamsa, D30 Trimsamsa, and D60 Shashtiamsa.
- `DIV-02` **[TRADITION]** Navamsa follows the corrected movable/fixed/dual sign start rules. Vargottama is detected where D1 and the relevant varga agree.
- `STR-01` **[VARIANT]** Natural friendship uses a Parashari-*style* directional table extended to include Rahu and Ketu as participants, which strict Parashari natural-friendship tables do not. Moon–Mercury remains the genuine classical directional asymmetry; Venus–Rahu and Venus–Ketu are mutual friends in this node-inclusive Tamil table. Reclassified from `[TRADITION]` on the 2026-08-18 release-gate review: the node rows make it an overlay, not the base table. **The full 9×9 grid is printed in the [table appendix](VINAADI_RULEBOOK_TABLE_APPENDIX.md), including two node asymmetries a reviewer should rule on** — Ketu holds Rahu an enemy while Rahu does not list Ketu, and Ketu holds Mars a friend while Mars holds Ketu neutral.
- `STR-02` **[PRODUCT]** When a combined relationship must be reduced to one symmetric label, Vinaadi uses: enemy in either direction = enemy; friend in both directions = friend; otherwise neutral. Reclassified from `[TRADITION]`: the doctrine is the *directional* table in `STR-01`; this reduction is a Vinaadi reconciliation algorithm applied where a single UI label is required, and no source prescribes it.
- `STR-03` **[VARIANT]** Moon treats Rahu/Ketu as enemies in the current Tamil overlay; strict classical Parashari tables may give Moon no enemies.
- `STR-04` **[TRADITION]** Bhinnashtakavarga is computed for the seven classical planets, and Sarvashtakavarga is their aggregate. The bindu grid itself is treated as chart arithmetic — shown to the reader, like a rasi or navamsa chart, with no interpretive gate.
- `STR-05` **[TRADITION]** Four indications are read by counting from a **karaka graha's own rasi** rather than from Lagna: 5th from Guru (progeny), 3rd from Sevvai (siblings), 4th from Budhan (maternal relatives — Budhan as matula-karaka, deliberately replacing the weaker Moon-BAV 4th formulation), 9th from Suriyan (paternal). **Reviewers: please check the karaka/bhava pairing and whether your lineage counts these from the karaka or from Lagna.**
- `STR-06` **[PRODUCT]** `STR-05` outputs a band (strong / neutral / thin), **never a number of children, siblings, or relatives**, even though the classical sutras are often quoted as giving exact counts. A printed count is instantly checkable by the reader and being wrong about their own family costs more than saying nothing. The band threshold is each rule's own analytically-derived baseline (progeny 4.00, siblings 2.67, maternal 3.83, paternal 4.33), not a flat cut — the grahas' BAV totals differ (Guru 56, Budhan 54, Suriyan 48, Sevvai 39), so a flat cut called 74% of sibling indications thin as an artefact of Sevvai's small table. **Reviewers: the ±1-bindu margin is a product calibration; the direction of each rule is the part to check.**
- `STR-07` **[PRODUCT]** `STR-05` indications are shown only on the relevant life-area card, after the reader's life-phase and age gates. Progeny discloses its supportive band only; the thin band is withheld, because discouraging fertility content belongs to the one disclaimed surface built for it and not to an undisclaimed chip. Siblings, maternal and paternal disclose both bands, being descriptive rather than a hope denied.
- `STR-08` **[TRADITION] — ruled 2026-08-19.** Rahu and Ketu have no Bhinnashtakavarga table of their own, and Vinaadi **no longer invents one for them**: the nodes are omitted from bindu-based transit scoring entirely, and a transit involving them simply carries no bindu adjustment. This replaced a substitution of **Saturn's table** for both nodes, described in the code as common Thirukanitham practice — an attribution nothing in this repository sourced. A different pairing (Saturn for Rahu, Mars for Ketu, or any other) was explicitly *not* adopted in its place: the failure was never which graha was borrowed, it was borrowing without a source. **A second defect fell out of this:** the old "neutral" default of 4 for any table-less graha was read by every caller as a supportive transit worth +8, so the neutral value was quietly a bonus. The `STR-05` karaka-relative rules always refused the proxy — meaningless for "the 5th bhava from Guru" — so the two layers now agree. Ruling in `docs/DOCTRINE_RULINGS_2026-08-19.md` §A-15.
- `YOG-01` **[TRADITION]** The engine detects Raja Yoga, Dhana Yoga, Pancha Mahapurusha yogas, Gaja Kesari/Kesari, Budha Aditya, Vipareeta Raja Yoga, and selected supporting combinations, subject to strength/activation gates. **Auditability gap, acknowledged:** this is one rule ID covering many independent definitions, and "Raja Yoga" alone has several. A reviewer cannot tell from this line whether each is a legitimate classical definition or a loose modern one. Each yoga is owed its own rule ID (`YOG-GK-01`, `YOG-VRY-01`, …) with its own condition set; that split is open work, not a claim already met.
- `DOS-01` **[TRADITION]** Sevvai (Chevvai/Kuja/Manglik) dosha checks Mars in houses 1, 2, 4, 7, 8, or 12 counted **from all three references independently — Lagna, Moon, and Venus**. A hit from any one raises the condition, and the read-out records which reference fired. Severity, not presence, is then weighted by gender (female 4/8/12; male 2/7/8), and reduced by own-sign/exalted Mars, the Kadagam and Simmam yogakaraka Lagnas, Mars-as-Lagna-lord in the 1st or 2nd for Mesham/Viruchigam, benefic association, and a house-specific nivarthi table. Two uncancelled charts cancel each other. "From the relevant reference" was the previous wording and was not a specification; **the full reference set, house set, gender weighting, and every cancellation factor are now printed in the [table appendix](VINAADI_RULEBOOK_TABLE_APPENDIX.md)**.
- `DOS-02` **[TRADITION] — Kala Sarpa mechanics ruled 2026-08-19.** Rahu/Ketu marriage attention checks houses 1, 2, 7, and 8. The **Kala Sarpa arc** is now judged on **actual longitude**, over the **seven grahas only** — the Lagna is not required to fall inside the arc — with **no degree tolerance** at the node ends. A graha sitting exactly on a node qualifies, but the boundary is **disclosed** in `conditions_met` rather than silently resolved in or out. Whole-sign survives only as a fallback for callers that carry rasi without degrees, and `conditions_met` records which test was applied. **Direction is recorded, never used to disqualify:** Rahu→Ketu is `ANULOMA`, Ketu→Rahu `VILOMA`. Some modern schools name the reverse enclosure "Kala Amrita" and read it quite differently; that is a school convention we deliberately do **not** bake in as settled Tamil doctrine, so both directions form the yoga and the pattern is reported for the caller to interpret. Kala Sarpa is heavy language for a reader, which is why each of these is a ruling rather than an implementation default. Ruling in `docs/DOCTRINE_RULINGS_2026-08-19.md` §A-4.
- `DOS-03` **[LIMIT]** Yogas and doshas are indicators, not deterministic promises. Vinaadi gates their prominence by dignity, house context, and active dasha where data is available.

## C. Panchangam and daily astronomical rules

- `PAN-01` **[CORE]** Sunrise is Hindu sunrise: geometric rising of the **centre of the Sun’s disc**, with no atmospheric refraction. This is the anchor for sunrise-dependent rules.
- `PAN-02` **[TRADITION]** Panchangam is location-specific and calculated at local sunrise unless the particular output is explicitly an interval/event calculation.
- `PAN-03` **[TRADITION]** Tithi = `floor(((moon − sun) mod 360) / 12°)`, yielding 30 tithis. The separation is normalised into `[0, 360)` before division. Paksha is Shukla for 1–15, Krishna for 16–30.
- `PAN-04` **[TRADITION]** Nakshatra = Moon's sidereal longitude divided by 13°20′; yoga = the **sum** `((sun + moon) mod 360)` divided by 13°20′ — a sum, not the difference used for tithi; vara = weekday. **Karana is not merely a "6° half-tithi sequence"** — that phrase does not reproduce it. It is one fixed opening karana (Kimstughna), then the seven movable karanas repeating eight times across indices 1–56, then three fixed closing karanas (Shakuni, Chatushpada, Naga). Full sequence in the [table appendix](VINAADI_RULEBOOK_TABLE_APPENDIX.md).
- `PAN-05` **[TRADITION] — ruled 2026-08-19.** Tamil month is derived from the sidereal solar month, not Gregorian month names, with the boundary found by bisecting the Sun's rasi ingress (Sankranti) to the exact instant. **The day-assignment rule is the sunset threshold, with no exceptions:** a sankranti falling before that day's sunset starts the month on that same civil day, otherwise the month starts the day after. The previous hardcoded correction — forcing Aavani 1, 2026 to 18 August from one unverified almanac reading — **has been deleted**. 18 August is what the competing *sunrise* rule gives, and that rule contradicts the gazetted Puthandu (Chithirai 1, 2026 = 14 April), which our own festival table independently carries; the two rules disagree on 8 of 12 months in 2026, so this was a systematic fork rather than one stray date. Reintroducing any per-month correction now requires a named almanac — publisher, edition, **and whether it is Vakya or Thirukanitham**, since a Vakya reference cannot be reproduced by a drik engine at all. Ruling in `docs/DOCTRINE_RULINGS_2026-08-19.md` §A-3.
- `PAN-06` **[TRADITION]** Rahu Kalam, Yamagandam, and Kuligai split the actual local **sunrise-to-sunset daylight interval into eight equal parts**, then select the classical weekday slot.
- `PAN-07` **[TRADITION]** Gowri Panchangam/Nalla Neram uses a per-weekday eight-kala sequence for day and for night. These are **not** one rotating 8-cycle — each weekday row differs — so **both full 7×8 tables are printed in the [table appendix](VINAADI_RULEBOOK_TABLE_APPENDIX.md)** rather than described. Overlap warnings are shown when a nominally good Gowri period conflicts with a caution window.
- `PAN-08` **[VARIANT]** Hora consists of **equal 60-minute periods from local Hindu sunrise**, 24 per day, cycling by weekday hora lord along the descending-geocentric-distance chain. It is not calculated as twelve unequal daylight and twelve unequal night planetary hours. Both conventions are authentic; this is a declared school choice, and it has classical textual footing — a sunrise-to-sunrise day divided into 24 equal parts is how BPHS describes Hora Bala. The Tamil almanac tables also print whole-hour boundaries and rely on the 6-1-8-3 mnemonic, which only holds if every hora is exactly sixty minutes. **See `MUH-07`: there is one shared implementation, and both rules now carry the same marker.**
- `PAN-09` **[TRADITION] — ruled 2026-08-19.** Abhijit Muhurtham is the **8th of the 15 equal muhurtas dividing the daylight span**: its width is `(sunset − sunrise) / 15` and it is centred on the midpoint of daylight by construction. It is therefore wider in summer and narrower in winter, and it moves with latitude. **Wednesday is the only weekday exclusion.** This replaced a fixed solar-noon ± 24 minutes, which is the clock-table simplification and only ever coincided with the real width near the equinox at low latitude — at London the old rule gave 48 minutes in both June and December, where the true windows are roughly 67 and 32 minutes. Ruling in `docs/DOCTRINE_RULINGS_2026-08-19.md` §A-9.
- `PAN-10` **[TRADITION]** Chandrashtama means the transiting Moon is in the **8th rasi from Janma Rasi**. It is never calculated as the 8th nakshatra.
- `PAN-11` **[VARIANT] [LIMIT]** Jeevan/Nethiram are derived from a **symmetric ring distance** between the Sun's nakshatra and the day's Moon nakshatra; **the exact cutoffs are printed in the [table appendix](VINAADI_RULEBOOK_TABLE_APPENDIX.md)**. The classical labels, including "Blind" and "None," remain literal, with contextual wording that they are muhurta markers—not personal judgments. **Scoring reach: none.** Both are display-only strings on the panchangam snapshot; neither feeds daily score, muhurta ranking, porutham, or any recommendation, so an unresolved provenance question here cannot move a recommendation. Two things remain open and are recorded rather than papered over: the formula was accepted in astrologer review but **no independent printed source is captured in-repo**, so treat it as confirmed-by-review and not independently re-derivable; and a **2026-08-10 live case contradicts the Nethiram cutoff** (see the appendix). A single case underdetermines the replacement table, so the cutoff has deliberately not been guess-patched. Reclassified from `[TRADITION]` because a review-confirmed formula with no printed source is not a source-checkable traditional rule.
- `PAN-12` **[TRADITION]** Amirdhadhi Yogam classifies each weekday–nakshatra pair as Amirtha, Siddha, Marana, or Prabalarishta using the 7×27 almanac table. **All 189 cells are printed in the [table appendix](VINAADI_RULEBOOK_TABLE_APPENDIX.md)**; a shifted row would mean 27 wrong daily classifications, so the grid's shape and class domain are asserted by `tests/test_rulebook_invariants.py`. Source: the *Ungal Vazhkkai Vazhikatti* panchangam (astrologer-supplied, re-sourced 2026-07-14). Two Prabalarishta cells — Thursday+Kettai and Friday+Pooradam — were independently confirmed against the same publisher's public article; their apparent divergence from the classical Dagdha-yoga list is a taxonomy difference, as Prabalarishta and Dagdha are distinct yogas. The whole Thursday and Friday Marana rows match Ernst Wilhelm's Dagdha sets cell-for-cell. **Note for reviewers: the seven Amrita-Siddhi *muhurta* pairs land on Siddha (C) here, not Amirtha (A).** That is correct — an earlier audit assumed otherwise, "corrected" two cells on that assumption, and the change was reverted. The muhurta yoga and this daily-classification table are different objects.
- `PAN-13` **[PRODUCT]** In broad muhurta scoring, Amirtha = +12, Siddha = +4, Marana = −16, and Prabalarishta = −30. These are Vinaadi weights, not classical numerical values.
- `PAN-14` **[VARIANT]** Adverse Amirdhadhi classes are penalties, not an absolute veto. A future terminating activity may be allowed to use their “ending/cutting” polarity; current scored activities are acquisitive/unitive, so that exception is normally inactive.
- `PAN-15` **[TRADITION]** Amavasai is a sacred ancestor day. Daily guidance must not apply a blanket negative daily-score penalty merely because tithi is Amavasai; it may present an appropriate observance/content card.
- `PAN-16` **[PRODUCT]** In dedicated muhurta ranking, Amavasai currently contributes −5 as one panchangam suitability factor. This is separate from `PAN-15`, and must be reviewed as a product policy rather than a contradiction in doctrine.
- `PAN-17` **[LIMIT]** Two festival engines run, with **different reach**, and the boundary is now named in code rather than described. (1) *Algorithmic* — Ekadashi (Smarta default, with dashami-viddha handling), Pradosham, Sankatahara Chaturthi, Amavasai/Pournami, Karthigai, Sashti, and the solar-day yearly festivals are computed from tithi/nakshatra/solar-month rules against the ephemeris, and answer for **any** year. (2) *Gazetted* — government holiday dates plus a few dates that are administrative records rather than calculations exist for **2025-2026 only**, named by `festivals.GAZETTED_FESTIVAL_YEARS` and asserted against this sentence by `tests/test_rulebook_invariants.py`. Outside that range a calendar shows the algorithmic set and no gazetted rows: **thinner, never wrong**. Government-holiday coverage must be extended before the product presents a later year as complete.

## D. Dasha systems

- `DAS-01` **[CORE]** Vimshottari is Vinaadi’s primary dasha system and primary timing language.
- `DAS-02` **[TRADITION]** Full Vimshottari cycle = 120 years: Ketu 7, Venus 20, Sun 6, Moon 10, Mars 7, Rahu 18, Jupiter 16, Saturn 19, Mercury 17.
- `DAS-03` **[TRADITION]** Opening mahadasha comes from the Moon’s birth nakshatra lord. The remaining balance is proportional to the nakshatra portion left at birth.
- `DAS-04` **[TRADITION]** Antardasha, pratyantardasha, sookshma, and prana periods follow proportional subdivision in the same Vimshottari order.
- `DAS-05` **[TRADITION]** Dasha interpretation uses dasha lord condition, whole-sign house activation, natural/functional nature, and relevant life-area houses; it does not treat a planet as universally good/bad.
- `DAS-06` **[LIMIT]** Ashtottari, Yogini, Kalachakra, and conditional dashas may be calculated/displayed when their eligibility rules are met, but they are secondary systems and must not silently override the primary Vimshottari reading.
- `DAS-07` **[LIMIT]** Chara Dasha is not to be used for interpretive output until the full BPHS/K.N. Rao rule set (direction, own-sign length, and Scorpio/Aquarius dual-lord resolution) is confirmed in implementation.
- `DAS-08` **[VARIANT]** Jaimini Chara Karaka ranking should use Rahu’s reverse degree, `30° − degrees traversed`, and an 8-karaka scheme including Rahu. Any output must be checked against that standard before public interpretation.

## E. Gochar, Sani cycles, and daily guidance

- `GO-01` **[CORE]** Gochar is counted primarily from the user’s **Janma Rasi (natal Moon sign)**. Lagna-based Jupiter/Saturn effects are supplemental, never a replacement for Moon-based reading.
- `GO-02` **[TRADITION]** Transit houses are whole-sign counts from Janma Rasi and, where used, Lagna.
- `GO-03` **[TRADITION]** Jupiter, Saturn, Rahu/Ketu transit tables, Vedha Vichara, retrograde, combustion, sandhi, and gandanta flags are available as inputs to explanations and timing. **The numeric thresholds are in the [table appendix](VINAADI_RULEBOOK_TABLE_APPENDIX.md)** — per-graha combustion orbs with separate direct and retrograde values, the Cazimi orb, and the six gandanta ranges — because "a combustion flag exists" is not a checkable rule and the orb is the whole rule.
- `GO-04` **[VARIANT]** Moon near the Sun is treated as Amavasai rather than applying a Moon combustion penalty; other grahas use the configured combustion logic.
- `GO-05` **[TRADITION]** Vedha checks transit-house obstruction with documented Sun–Saturn and Moon–Mercury exemption pairs. **The complete per-graha good-house → blocking-house table is in the [table appendix](VINAADI_RULEBOOK_TABLE_APPENDIX.md).**
- `GO-06` **[TRADITION]** Sade Sati / Ezharai Sani covers Saturn’s 12th, 1st, and 2nd rasis from Janma Rasi, with phase-sensitive narrative and scoring rather than a single identical seven-and-a-half-year warning.
- `GO-07` **[TRADITION] + [PRODUCT]** The *principle* is traditional: transit severity is modified by the transiting graha's natal condition and by Ashtakavarga support. The *specific reducer* — which factors count (natal Saturn own/exalted, favourable placement, Sarvashtakavarga support) and how much each subtracts — is a Vinaadi synthesis, and no single canonical formula is claimed for it. A mitigation reduces severity; it does not erase the cycle. Split from a plain `[TRADITION]` marker on the 2026-08-18 review.
- `GO-08` **[TRADITION]** Across the complete Sade Sati path, Saturn occupies/aspects all houses except the 5th; Vinaadi may use this as a bounded reassurance insight, not a guarantee.
- `GO-09` **[TRADITION]** Ardha Ashtama and Ashtama Sani are identified from the Moon-reference cycle.
- `GO-10` **[TAMIL_LINEAGE] — ruled 2026-08-19.** Vinaadi calculates Kandaka Sani from the **Janma Rasi**, with Saturn in the **4th, 7th or 10th**. Kantaka/Kandaka Sani is **not uniform across lineages** — variously reckoned from Lagna, Janma Rasi or Arudha Lagna, over 1/4/7/10, 1/4/8/10 or 4/7/10 — so this is our lineage's practice, recorded as such, not a locked foundation. Every surface labels it "Kandaka Sani (from Janma Rasi)" / "கண்டக சனி (ஜென்ம ராசி)" so the reference is disclosed and never implied to be universal. **Kandaka is a layered name, not a separate axis:** Saturn in the 4th from the Janma Rasi is Ardhashtama Sani *and* Kandaka Sani, and the reader is told both — though the score is applied once. Vinaadi previously reckoned this from Lagna over the four kendras *specifically so that no such overlap could occur*; that tidiness was an engineering preference rather than a source, and it selected a nearly disjoint population, since most people's Lagna and Moon sign differ. The 1st is now excluded because that position is Janma Sani's. Ruling in `docs/DOCTRINE_RULINGS_2026-08-19.md` §A-1; `tests/test_rulebook_invariants.py` pins the code to 4/7/10 from the Janma Rasi so a further doctrine change cannot land without updating this rule too.
- `GO-11` **[TRADITION] [VARIANT]** Ezharai Sani Murthi is determined at Saturn's rasi ingress by the transiting Moon counted from Janma Rasi: 1/6/11 Swarna; 2/5/9 Rajata; 3/7/10 Tamra; 4/8/12 Loha. The Moorti table itself is standard and widely documented; using it **specifically within Ezharai Sani interpretation** is the lineage choice, hence the second marker. Table printed in the [appendix](VINAADI_RULEBOOK_TABLE_APPENDIX.md).
- `GO-12` **[PRODUCT]** Daily score combines Moon/nakshatra, transit, dasha, and panchangam signals. The 0–100 score and its score bands are Vinaadi’s calibrated communication model, not a traditional astrological measurement.
- `GO-13` **[PRODUCT]** `TRANSIT_BASE_SCORE`, `PLANET_DAILY_WEIGHT`, and `PLANET_PERIOD_SCORE` are explicit custom numeric tables. They are not Shadbala, not a printed Thirukanitham table, and require separate empirical/product review.
- `GO-14` **[PRODUCT]** A daily score is an advisory snapshot, not a prediction of fixed events. Narrative must state both cautions and constructive actions/windows.

## F. Marriage matching and compatibility

- `POR-01` **[CORE]** Marriage matching uses the Tamil **10 Porutham** framework: Dinam, Gana, Mahendra, Sthree Deergham, Yoni, Rasi, Rasi Adhipathi/Graha Maitri, Vasya, Rajju, and Vedha.
- `POR-02` **[TRADITION]** Dinam passes the 12-count set `{2,4,6,8,9,11,13,15,18,20,24,26}` counted from the girl’s birth nakshatra to the boy’s.
- `POR-03` **[TRADITION] — Mahendra direction ruled 2026-08-19.** Mahendra passes the count set `{4,7,10,13,16,19,22,25}`, counting the boy's nakshatra **from the girl's** — the bride's star is the base and counts as 1. We previously had the direction recorded the other way round, and **no outcome changed when it was corrected**, which is precisely why it needed fixing rather than shrugging at: the set is closed under `c → 29−c`, and the two count directions around a 27-star ring always sum to 29, so the set is direction-blind and the wrong direction was *invisible*. That symmetry is an accident of this particular set, not a general property — any future edit to it breaks the accident silently, and a test pins it. **Sthree Deergham remains open at the boundary:** the three-state architecture is ruled (1–6 fails, 7–13 Madhyama, 14–27 Uttama), with 13 held at the Madhyama end, but how a Madhyama result scores and displays is not yet decided, so the shipped rule is still the lenient binary ≥ 8. See `docs/DOCTRINE_RULINGS_2026-08-19.md` §A-7 and §A-18.
- `POR-04` **[TRADITION]** Gana, Yoni, Graha Maitri, and Vasya use fixed classical tables. **All four are now printed in full in the [table appendix](VINAADI_RULEBOOK_TABLE_APPENDIX.md)** — a reviewer cannot verify a table they cannot see, and this rule already carries one adjudicated source conflict, which makes an unseen table worse than useless. Vasya includes Viruchigam → Kadagam/Kanni and Magaram → Mesham/Kumbham (both were incomplete rows until 2026-08-17, and both omissions produced spurious *failures*); Simmam → Thulaam is retained, not the conflicting Simmam → Makaram book row, which is treated as a source defect.
- `POR-05` **[VARIANT]** Rasi Porutham uses the Tamil directional skeleton: count from the woman’s Moon rasi to the man’s; same rasi and 7–12 pass, 2–6 fail. Historical exception rows are disabled rather than silently applied.
- `POR-06` **[TRADITION]** Rajju is a hard concern: same Rajju group fails. There is **no eka-nakshatra Rajju exemption** — two people born under the same nakshatra share a group by definition and therefore fail, asserted for all 27 stars in `tests/test_rulebook_invariants.py`. The eka-nakshatra/bhinna-pada exception belongs to Nadi, not Rajju. Five-group table in the [appendix](VINAADI_RULEBOOK_TABLE_APPENDIX.md).
- `POR-07` **[TRADITION]** Vedha is a hard concern. Mrigashira, Chitra, and Dhanishta form a mutual three-star Vedha group; **no nakshatra is left structurally exempt**, and all 15 pairs are printed in the [appendix](VINAADI_RULEBOOK_TABLE_APPENDIX.md). 27 is odd, so any table built purely of pairs necessarily exempts exactly one star — that arithmetic is how a dropped Chitra edge previously hid, and it is now caught by a coverage assertion rather than by inspection. Source: Jothidam p.70, whose closing line states the triad explicitly; twelve of the thirteen previously-shipped rows are verbatim identical to that page.
- `POR-08` **[TRADITION]** Nadi is shown as an add-on with its proper same-star/different-pada handling; a Nadi pass does not cancel Rajju. The 27-star Nadi assignment (a repeating 6-star zigzag, **not** contiguous blocks of nine) is printed in the [appendix](VINAADI_RULEBOOK_TABLE_APPENDIX.md), along with the two parihara modes and which layer resolves them.
- `POR-09` **[PRODUCT]** Rajju or Vedha failure caps the public porutham headline and the paid Compatibility Intelligence headline at **CAUTION**, even if a weighted score is high. The numeric breakdown remains visible. The *doctrine* is that Rajju and Vedha are hard concerns; the word **CAUTION** and the capping mechanism are Vinaadi presentation, not classical vocabulary. The cap is asserted across all 729 nakshatra pairs, not spot-checked.
- `POR-10` **[PRODUCT]** Vinaadi flags traditional longevity concern without making widowhood/death predictions or using fear-based language.
- `POR-11` **[TRADITION]** Sevvai dosha comparison is part of relationship assessment, with mitigations and matched-strength context; it is not a standalone automatic rejection.
- `POR-12` **[TRADITION]** The Moon–Moon *positional grouping* used by Compatibility Intelligence is classical: 2/12 dwirdwadasa, 3/11 upachaya, 4/10 kendra, 5/9 trikona, 6/8 shadashtaka, 7 samasaptama, and same rasi. Symmetric by construction, and asserted symmetric for all 144 rasi pairs.
- `POR-12a` **[PRODUCT]** The *verdict words* mapped onto those positions — same = Good; 2/12 = Mixed; 3/11 = Good; 4/10 = Good; 5/9 = Excellent; 6/8 = Tense; 7 = Good — and their subscore contributions (Excellent 5, Good 4, Mixed 2, Tense 0) are a Vinaadi normalisation layer. **Split out of `POR-12` on the 2026-08-18 review**, which correctly observed that no source produces exactly this four-word classification. The grouping is the doctrine; the wording is ours.
- `POR-13` **[PRODUCT]** The paid multi-level compatibility score is an aggregation aid. Its weights are Vinaadi design weights, while its hard Rajju/Vedha label cap is a doctrine policy.

## G. Muhurta and activity timing

- `MUH-01` **[CORE]** Muhurta is location- and date-specific, using the Hindu-sunrise panchangam anchor.
- `MUH-02` **[TRADITION]** Candidate windows are evaluated through panchangam factors: vara, tithi, nakshatra, yoga/karana where applicable, tara bala, chandra bala, Rahu Kalam, Yamagandam, Kuligai, Gowri/Nalla Neram, Hora, and activity-specific constraints.
- `MUH-03` **[TRADITION]** Tara Bala counts the day’s nakshatra from the native’s Janma Nakshatra in a repeating nine-tara cycle. Adverse tara classes are 3 (Vipat), 5 (Pratyak), and 7 (Naidhana); activity-specific source rules can be stricter.
- `MUH-04` **[TRADITION]** Chandra Bala evaluates the transiting Moon’s rasi from Janma Rasi; Chandrashtama is an especially adverse condition.
- `MUH-05` **[TRADITION]** Rahu Kalam and Yamagandam are excluded/cautioned for ordinary auspicious starts.
- `MUH-06` **[VARIANT]** Kuligai has polarity: it **repeats** whatever is begun in it, so the discriminator is never "is the act auspicious" but "does repeating it add to a stock, or does it mean the first one came undone". Buying gold repeats as more gold; marrying repeats as a first marriage ended. **The complete activity mapping is printed in the [table appendix](VINAADI_RULEBOOK_TABLE_APPENDIX.md)**, since which activities benefit from repetition is exactly what changes a recommendation. Source: Jothidam p.152 for the multiplying mechanism and the cremation case, plus the owner ruling of 2026-08-17 extending the same reasoning to every activity. **Two divergences are recorded rather than hidden:** MEDICAL is adverse here although Kalaprakasika lists medical treatment among Gulika's favoured acts, because treatment recurring means illness recurring under the Tamil rule; and SPIRITUAL is favourable by reasoning rather than a quoted line. An unclassified activity returns `UNSPECIFIED`, which must never read as rejection — blanket exclusion was the defect this ruling corrected.
- `MUH-07` **[VARIANT]** Hora uses equal sixty-minute sunrise-anchored windows and activity–graha associations. **Reclassified from `[TRADITION]` to match `PAN-08`.** There is one shared hora implementation in the engine — the panchangam display and the muhurta ranker read the same one — so the previous split marker was a documentation inconsistency rather than two behaviours, but the inconsistency mattered: hora directly moves the recommended window, and one marker claimed universality while the other declared a choice. See `PAN-08` for the textual basis and the alternative convention.
- `MUH-08` **[TRADITION]** Activity-specific rules are stored with source IDs, including lifecycle/samskara, learning, agricultural, and harvest timings. A source rule may prescribe particular nakshatras, weekdays, tithis, lagna, or tara counts.
- `MUH-09` **[LIMIT]** Textually ambiguous source rules are deliberately held rather than guessed. An absent positive rule is not inferred from another chapter’s rule.
- `MUH-10` **[PRODUCT]** Muhurta combines traditional factor direction with Vinaadi numeric contributions, rank bands, display caps, and a top-N result limit. The arithmetic ranking is not presented as a classical single formula.
- `MUH-11` **[PRODUCT]** A recommended date/window must expose its contributing positive and caution factors so an astrologer can audit the result; no opaque “best day” claim is sufficient.

## H. Interpretation, remedies, and safety boundaries

- `INT-01` **[CORE]** Interpretation is chart-specific: it uses Lagna, Moon, houses, lords, grahas, dasha, and transits rather than assigning identical predictions to everyone.
- `INT-02` **[TRADITION]** Career/education interpretations **emphasise** the 2nd, 6th, 10th, and 11th houses and their lords; marriage/relationship interpretations emphasise the 7th and relevant supporting houses; life-area modules use corresponding house signatures. "Emphasise" is load-bearing and must stay: these are the primary signatures, not a closed formula. Career and education are not reducible to four houses — the 3rd, 5th, 9th, dasha condition, and Dashamsa all legitimately bear on them, and a rule that read "career = 2+6+10+11 only" would be wrong.
- `INT-03` **[TRADITION]** Health content is tendency-oriented and maps grahas/houses to traditional body themes. It must never diagnose, promise medical outcomes, or replace professional healthcare.
- `INT-04` **[TRADITION]** Remedies are chart-specific and tied to the relevant graha/dasha/dosha. Generic remedies are not treated as a substitute for analysis.
- `INT-05` **[PRODUCT]** Gemstone advice is withheld unless the product has enough chart-specific basis and the relevant policy conditions; it is never a casual universal recommendation.
- `INT-06` **[CORE]** Vinaadi does not make deterministic death, widowhood, catastrophe, or guaranteed-event claims. Traditional concerns may be explained responsibly without fear language.
- `INT-07` **[PRODUCT]** User-facing outcomes include constructive timing, practical action, and improvement windows where possible; caution is not presented as hopelessness.

## I. Explicitly not claimed / not currently complete

- `OUT-01` **[LIMIT]** No complete classical Shadbala engine is claimed.
- `OUT-02` **[LIMIT]** No Sarvashtakavarga-based predictive system is claimed beyond the implemented BAV/SAV calculations, the four karaka-relative indications in `STR-05`, and the specific places that consume them.
- `OUT-03` **[LIMIT]** Kendradhipatya Dosha and Indu Lagna are not current live interpretive rules.
- `OUT-04` **[LIMIT]** Tajaka Ithasala/Isarafa, where displayed, is a same-rasi ±5° simplified, display-only approximation; it must not be called complete Tajika or drive interpretation.
- `OUT-05` **[LIMIT]** Full standard Chara Dasha remains unavailable for interpretation until its doctrine implementation is completed and verified.
- `OUT-06` **[VARIANT]** Mean node, Tamil node friendship, node aspects, Moon-combustion treatment, Rasi Porutham direction, equal-hour Hora, Kandaka Sani's Lagna reference, and Murthi method are explicit choices that may differ from JHora, KP, North-Indian, Nadi, or local family practice.
- `OUT-08` **[LIMIT]** Ayanamsa is Lahiri and node calculation is mean, and neither is claimed as universal Jyotisha doctrine — they are locked Vinaadi foundations (`CORE-01`, `CORE-02`) chosen for consistency with Tamil almanac practice. A chart cast under Raman or KP ayanamsa, or under true nodes, will differ from ours by design.
- `OUT-07` **[LIMIT]** Nadi-tier association rules — planets conjunct Sevvai, Chandran or Sukran read as clues to siblings, the mother's family and the spouse's family — are **not implemented**. Their natural output is a count of relatives, which `STR-06` forbids; and the Sukran rule would assert a spouse for readers who have not stated one. They would need a labelled auxiliary section and a marital-status gate before being built.

## Requested reviewer response

For each correction, please return:

1. Rule ID and current wording.
2. Verdict: Correct / Incorrect / Incomplete / Variant.
3. Correct rule or table, including direction of counting and exceptions.
4. Source: title, author/publisher, edition/year, page/table—or named lineage.
5. Severity: chart positions, daily guidance, marriage matching, muhurta, or wording only.
6. Whether it is universal in your practice or a school-specific choice.

## Source and implementation trail

This summary is derived from the live calculation modules and these maintained
references: **[table appendix](VINAADI_RULEBOOK_TABLE_APPENDIX.md)** (every
lookup table, generated from the live constants), [ratified
doctrine](DOCTRINE_DECISIONS_V1.md), [formula-engine
specification](Jothidam_AI_Formula_Engine_Specification_v1_Thirukanitham_2026.md),
[muhurta status](MUHURTA_STATUS_2026-08-18.md), [recent adjudicated
implementation notes](EC_RULING_IMPLEMENTATION_2026-08-17.md), and the
[open-question queue](ASTROLOGER_REVIEW_QUEUE.md). When this review changes
doctrine, update the ratified doctrine and tests—not only this review copy.

## Revision note — 2026-08-18 release-gate review

An external release-gate review of this document raised seven blockers. The
[adjudication](RELEASE_GATE_REVIEW_RESPONSE_2026-08-18.md) records each verdict
with the code evidence. Six classification corrections were accepted and applied
above (`STR-01`, `STR-02`, `GO-07`, `GO-10`, `MUH-07`, `POR-12`/`POR-12a`), plus
specification completions for `DOS-01`, `PAN-11`, and `PAN-17`. Three flagged
items were **already closed in code** and were re-stated here rather than
re-worked: the Amirdhadhi grid is sourced and cross-checked (`PAN-12`), the
Kuligai activity mapping is sourced and owner-ruled (`MUH-06`), and the Vedha
triad is fixed and now coverage-asserted (`POR-07`). The reviewer's one
non-astrology finding — Swiss Ephemeris licensing — is tracked in
[the go-live checklist](launch/GO_LIVE_CHECKLIST.md) and is a commercial
decision, not a doctrine one.

The invariants this review asked for are now enforced by
`tests/test_rulebook_invariants.py` (exhaustive 729-pair porutham sweep, Vedha
coverage, Rajju non-exemption, table shapes, Vimshottari total, Sani-cycle
position sets, threshold sanity) and `tests/test_rulebook_appendix_sync.py`.
