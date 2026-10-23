# Tamil Astrology Ground-Truth Audit — 2026-10-13

**Standard applied:** classical Tamil jothidam as working practitioners apply it
(Thirukanitham/Drik panchangam, Parashari natal rules, Tamil porutham and muhurtham
practice), *not* merely "does the code match our own docs". Where a recorded owner
ruling departs from mainstream practice it is flagged, not assumed correct.

**Verdict key**
- ✅ **CORRECT** — matches standard published Tamil practice, verified cell-by-cell.
- ⚠️ **VARIANT** — defensible, but a minority/strict reading; families comparing with a
  local jothidar or a mainstream Tamil app will see a different answer.
- ❌ **WRONG** — departs from practice in a way a Tamil reader would call an error.
- 🔍 **UNVERIFIABLE** — single-source table I cannot independently confirm.

**Severity:** P0 = wrong verdict shown to users on a life decision · P1 = wrong/misleading
on a common surface · P2 = nuance/variance · P3 = cosmetic/copy.

---

## 1. Foundation (ephemeris, ayanamsa, sunrise, dasha)

| Item | Code | Verdict |
|---|---|---|
| Ayanamsa | Lahiri (Chitrapaksha), set before *every* Swiss Ephemeris call incl. lagna/asc-mc (`ephemeris.py:194-216, 334`) | ✅ Mainstream Tamil Thirukanitham standard |
| Ephemeris data | Swiss `.se1` files bundled; Moshier fallback is surfaced as a warning | ✅ |
| Rahu/Ketu | **Mean node**; Ketu = Rahu+180° | ✅ Majority Tamil & Vakya convention (JHora defaults to true node — users comparing will see ≤1.5° drift) |
| Sunrise | Apparent upper limb + refraction (`THIRUKANITHAM_SUNRISE_CONVENTION`) | ✅ Matches Rashtriya Panchang / Drik. Printed Tamil almanac parity still unverified (recorded open item) |
| House system | Whole-sign (sidereal) | ✅ South Indian standard |
| Nakshatra/pada/rasi arithmetic (`astro.py`) | 13°20′ / 3°20′, 9 padas per rasi | ✅ |
| Navamsa (`navamsa_rasi_from_degree`) | Movable→same, fixed→9th, dual→5th | ✅ Classical |
| Vimshottari | Order Ke-Ve-Su-Mo-Ma-Ra-Ju-Sa-Me; 7/20/6/10/7/18/16/19/17 = 120; balance = unelapsed fraction of Moon's nakshatra × lord years | ✅ |
| Dasha year | 365.25 days | ✅ Standard (some software uses 365.2425/sidereal year → ±days over decades; not an error) |
| Opening-dasha bhuktis | Rebuilt from the *true* (pre-birth) mahadasha start, not compressed into the balance (`dasha.py:110-113`) | ✅ This is a common bug in other apps; ours is right |
| Chandrashtamam | 8th rasi from janma; star-level = Moon − 210° | ✅ 210° is exactly the classical **64th navamsa** (vainasika) rule |

## 2. Panchangam

| Item | Code | Verdict |
|---|---|---|
| Tithi = (Moon−Sun)/12°, 1–30; 30 = Amavasai | ✅ |
| Nitya yoga = (Sun+Moon)/13°20′, 27 names in order | ✅ |
| Karana: idx0 Kimstughna, 1–56 Bava…Vishti ×8, 57 Shakuni, 58 Chatushpada, 59 Naga (`panchangam.py:1220`) | ✅ |
| Rahu Kalam slot (8-part day) Sun 8, Mon 2, Tue 7, Wed 5, Thu 6, Fri 4, Sat 3 | ✅ |
| Yamagandam Sun 5, Mon 4, Tue 3, Wed 2, Thu 1, Fri 7, Sat 6 | ✅ |
| Kuligai (day) Sun 7, Mon 6, Tue 5, Wed 4, Thu 3, Fri 2, Sat 1 | ✅ |
| Kuligai (night) — rulership from 5th weekday lord, Saturn's part | ✅ derivation checked for all 7 days |
| Gowri Panchangam day table — all 7 rows (Sun: Uthi-Amirtham-Rogam-Labam-Dhanam-Sugam-Soram-Visham … Sat: Soram-Uthi-Visham-Amirtham-Rogam-Labam-Dhanam-Sugam) | ✅ cell-for-cell vs standard Tamil table |
| Durmuhurtham (15-part day): Sun 14; Mon 9,12; Tue 4; Wed 8; Thu 6,12; Fri 4,9; Sat 1,2 | ✅ (Tuesday's *night* durmuhurtham is not shown — minor, P3) |
| Hora sequence Su-Ve-Me-Mo-Sa-Ju-Ma, 24 equal hours from sunrise | ✅ Tamil almanac ஓரை convention |
| Soolam direction + parigaram (Mon E/curd, Tue N/milk, Wed N/milk, Thu S/oil, Fri W/jaggery, Sat E/curd, Sun W/jaggery) | ✅ |
| Inauspicious nitya yogas (Vishkambha, Atiganda, Shoola, Ganda, Vyaghata, Vajra, Vyatipata, Parigha, Vaidhriti) | ✅ |
| Amirdhadhi yogam 7×27 grid | 🔍 Single publisher (Ungal Vazhkkai Vazhikatti). Differs from the Sanskrit Amrita-Siddhi list (e.g. Sun+Hastham is not "A" here). Defensible as a Tamil-almanac table; cannot be confirmed from a second source |
| Jeevan / Nethiram | 🔍 No printed source captured; already display-only with zero scoring reach — correct containment |

### ❌ F-PAN-01 (P1) — the "சுபமுகூர்த்த நாள்" day flag is not a Tamil muhurtham-day rule

`_compute_subha_muhurtham_broad` (`panchangam.py:1539`) drives the **"Auspicious Day / சுபமுகூர்த்த நாள்"**
card on the public panchangam page (`web/app/(marketing)/panchangam/[date]/page.tsx:344-349`), the
calendar day drawer (`dashboard-calendar-tab-nova.tsx:893`) and mobile daily panchangam. To a Tamil
reader that phrase means *a wedding-muhurtham day*. Against Tamil practice the rule:

1. **Counts Poosam (Pushya) as auspicious.** Poosam is the one star Tamil practice excludes for
   marriage outright; our own marriage engine already excludes it (`app/data/marriage_muhurta_rules.py`
   uses the Kalaprakasika 11-star list). Also counts Chithirai, Avittam, Thiruvonam, Ashwini,
   Punarpoosam — none in the marriage list.
2. **Does not exclude Ashtami.** The code comment calls this deliberate ("Jaya group, not Rikta").
   That is Sanskrit tithi-group theory; Tamil practice avoids **அஷ்டமி and நவமி** together for any
   subha karyam, and every Tamil calendar marks them.
3. **Ignores the no-wedding months** (ஆடி, புரட்டாசி, மார்கழி), Karinaal, and Krishna-paksha
   tithis after Ashtami.
4. Two flags now disagree on the same day: this computed one, and the almanac-sourced
   `muhurtham_naals` list (which is what the muhurtham-naal service correctly uses).

**Fix direction:** either (a) relabel the computed flag as a generic "good day for routine
starts" (நல்ல நாள்) and never use the word முகூர்த்தம், or (b) make "சுபமுகூர்த்த நாள்" true only
when the date is in the almanac `muhurtham_naals` list. Add Ashtami to the broad exclusion either way.

## 3. Marriage matching — 10 Porutham (`app/calculations/porutham.py`)

Every lookup table was checked cell-by-cell against the standard Tamil tables.

| Porutham | Table / rule in code | Verdict |
|---|---|---|
| Gana (27 stars → Deva/Manushya/Rakshasa) | all 27 correct | ✅ table |
| Yoni (27 stars → 14 animals) | all 27 correct; 7 enemy pairs (Horse-Buffalo, Elephant-Lion, Sheep-Monkey, Serpent-Mongoose, Dog-Deer, Cat-Rat, Cow-Tiger) | ✅ |
| Rajju (Pada/Kati/Nabhi/Kanta/Siro) | Pada = 1,9,10,18,19,27; Siro = 5,14,23; Kanta = 4,6,13,15,22,24 … | ✅ all five groups |
| Vedha | 12 pairs + Mirugaseeridam/Chithirai/Avittam triad | ✅ |
| Graha maitri (Parashari natural friendship, both directions) | every one of 42 directed relations correct | ✅ |
| Dinam | count girl→boy ∈ {2,4,6,8,9,11,13,15,18,20,24,26} | ✅ standard Tamil list |
| Mahendra | {4,7,10,13,16,19,22,25} from girl | ✅ |
| Sthree Deergham | 1–7 adhama, 8–13 madhyama (½), 14–27 uttama | ✅ common Tamil grading |
| Rajju/Vedha veto forces CAUTION regardless of score | ✅ correct Tamil weighting |
| Nadi (outside the 10) with eka-nakshatra-bhinna-pada / eka-rasi-bhinna-nakshatra parihara | ✅ |

### ⚠️ F-POR-01 (P2) — Ganam is binary and strict
Code: same gana or Deva+Manushya = pass, any Rakshasa mix = fail. Tamil practice grades it:
boy Rakshasa + girl Manushya is commonly *madhyama*, and the widely used exception — gana
mismatch is overlooked when the girl→boy star count exceeds 14 — is absent. Result: some
couples a local jothidar would pass on Ganam fail here.

### ⚠️ F-POR-02 (P2) — Rasi porutham passes the 8th
Code (EC-RULING-01, Kalaprakasika p.74): girl→boy count 2–6 adverse, 7–12 favourable, so the
boy's rasi **8th from the girl's passes**. Popular Tamil practice treats **ஷஷ்டாஷ்டகம் (6/8)**
as adverse in *both* directions. Most Tamil matching software and printed porutham charts fail
6/8 either way. The ruling has a citation, but this is the single most likely
"your app says pass, my jothidar says fail" disagreement. Recommend an astrologer re-confirm
with that exact framing, or at minimum show a madhyama/"verify" note at count 8.

### ⚠️ F-POR-03 (P2) — Same-nakshatra couples always fail
Code: same star ⇒ Dinam fail **and** Rajju veto (EC-RULING-04 removed the exemption). Classical
Tamil **ஏக நட்சத்திரம்** rules accept same-star marriage for a named set of stars (Rohini,
Thiruvathirai, Magam, Hastham, Visakam, Thiruvonam, Uthirattathi, Revathi are commonly uttama),
madhyama for others, and reject only a specific list (Bharani, Ayilyam, Swathi, Kettai, Moolam,
Avittam, Sadhayam, Poorattathi…). The app gives all ~2.6% same-star couples a hard CAUTION. The
ruling's logic (same star ⇒ same rajju) is correct *within the Rajju rule*; the missing piece is
the separate eka-nakshatra rule that practice applies **before** Rajju. Needs astrologer ruling.

### 🔍 F-POR-04 (P3) — Vasya: Thulam→Kanni absent
Code gives Thulam only Makaram. Several Tamil/Muhurta-Chintamani tables list Thulam → Kanni,
Makaram. Verify against the source page before changing.

### ❌ F-POR-05 (P1) — Bride/groom fallback can count a known bride as the groom
`synastry_service._assign_bride_groom` swaps only when A=female **and** B=male. If A is female
and B is unspecified (or A unspecified and B male), A is still treated as the **boy**. Dinam,
Mahendra, Sthree Deergham and Rasi all count girl→boy, so the result is computed in the wrong
direction. **Fix:** if either gender is known, infer the other; only fall back to A=boy when
both are unknown, and disclose that on the card.

## 4. Marriage matching — the 100-point "Compatibility Intelligence" composite

### ❌ F-CI-01 (P0) — A one-sided active Chevvai dosham can still read "EXCELLENT"
In Tamil practice the rule after Rajju is **தோஷ சாம்யம்**: a chart with an *uncancelled*
Chevvai dosham is matched only with another dosham chart. One-sided active dosham is
normally a stop, not a five-point deduction.

In code (`compatibility_intelligence.py:854-934`) one partner with a **STRONG active** dosham
and one with none costs at most **5 of 100** points (dosham layer 10 → 5). Only Rajju/Vedha
cap the label. Worked example: porutham 9/10 (32) + 7th house 16 + navamsa 12 + dasha 15 +
dosham 5 + emotional 4 = **84 → "EXCELLENT … a holistically auspicious pairing"**, with the
risk list saying the opposite.
**This is already ruled; only the code is missing.** The astrologer's own anchor cases
(`docs/RULINGS_2026-08-31_MADHYAMA_HALF_POINT.md` §Q1b) say:
- #6 — Sevvai dosham present and **not** cancelled → **AVERAGE** ("the live dosham holds it here").
- #4 — Sevvai dosham present and cancelled → caps an otherwise-excellent match **one rung down** (GOOD).

The same document (line 335) records the cap as *"Still open — the scoring half … wants its own
change and an explicit go-ahead."* No label cap exists today besides Rajju/Vedha.
**Fix:** implement anchors #4 and #6 as label caps beside the Rajju/Vedha cap (the go-ahead
the ruling asked for); make the summary sentence cause-aware so a capped report never says
"all point strongly in favour".

### ❌ F-CI-02 (P1) — Rajju risk line reintroduces the banned longevity framing
`compatibility_intelligence.py:982-983`: *"Rajju Dosha is present — health/longevity remedies
advised" / "ஆரோக்யம்/ஆயுள் பரிகாரம் பரிந்துரை"*. EC-RULING-06 excised exactly this framing from
the porutham engine (ஆயுள் = lifespan). It survives in this second module, which
`tests/test_tone_compliance.py` evidently does not sweep. Also there is **no Vedha risk line**, even
though Vedha caps the label to CAUTION, so a capped report never says why.

### ❌ F-CI-03 (P1) — Papa samyam (பாப சாம்யம்) not implemented
A standard part of Tamil jadhaga porutham: count malefics (Mars, Saturn, Sun, Rahu, Ketu) in
1/2/4/7/8/12 from Lagna, Moon and Venus in both charts; the boy's papa points should be ≥ the
girl's. `dosha_samyam.py` says "Not built". Tamil families who bring two jadhagams to a jothidar
expect this check; the report silently omits it.

### ⚠️ F-CI-04 (P2) — The match score changes with today's date
The dasha layer (15 pts) scores the two **current** mahadasha lords, so the same couple's
compatibility moves by up to 11 points depending on the day the report is run. Classical
matching is a property of the two charts; dasha belongs in *marriage timing*, not
compatibility. Either label this layer "current period" or drop it from the composite.

### ⚠️ F-CI-05 (P3) — "Venus–Mars harmony" is computed Venus-to-Venus
`_compute_emotional_compatibility` labels the field venus_mars but measures Venus A ↔ Venus B
and rates 2/12 (dwirdwadasa) as STRONG. Small weight (≤5 pts), but the name is misleading.

### ✅ Correct in the composite
- Chevvai detection shared with the Jadhagam card (one engine, cannot disagree).
- Mutual Sevvai cancellation when both are uncancelled.
- Moon-Moon table now classical: 5/9 excellent, 6/8 tense, 7th good, 2/12 mixed.
- Rajju/Vedha veto caps the composite label.

## 5. Chevvai (Sevvai) dosham (`_yoga_dosham.detect_sevvai_dosham`)

| Rule | Code | Verdict |
|---|---|---|
| Houses | 1,2,4,7,8,12 from Lagna, Moon, Venus | ⚠️ VARIANT — classical Tamil list is 2,4,7,8,12; including the 1st is the wider South-Indian union and flags more charts |
| House-sign nivarthi | 2nd: Mithunam/Kanni · 4th: Mesham/Viruchigam · 7th: Kadagam/Magaram · 8th: Dhanusu/Meenam · 12th: Rishabam/Thulam | ✅ all five exactly |
| Kadagam/Simmam lagna (Mars yogakaraka) | mitigation (full exemption behind O-6 switch) | ✅ |
| Mars own/exalted, Jupiter aspect/conjunction, benefic association | mitigations | ✅ |
| Mars + Saturn/Rahu, combust Mars | aggravation | ✅ |
| Lagna, Moon, Venus weighted (Venus-only → "candidate") | ✅ sensible Tamil weighting |

## 6. Saturn cycles, Gochara, Tara/Chandra bala

| Item | Code | Verdict |
|---|---|---|
| Ezharai Sani = Saturn 12/1/2 from Janma Rasi | ✅ |
| Ardhashtama (4th), Ashtama (8th), Kandaka (4/7/10) | ✅ |
| Guru gochara favourable 2/5/7/9/11 | ✅ Phaladeepika / every Tamil almanac |
| Sani gochara favourable 3/6/11 only | ✅ |
| 5th-from-Moon untouched during Sade Sati (derived from 3/7/10 aspects) | ✅ arithmetic is right |
| Tara bala: count janma→day star, mod 9, Janma…Parama Mitra | ✅ |
| Chandrashtamam star window = veto, rest of 8th-rasi span = caution | ⚠️ VARIANT — mainstream Tamil readers treat the whole ~2¼ days of Moon in the 8th rasi as Chandrashtamam for every native of that rasi. Ruled, documented, and fails toward caution, so acceptable; worth one line of copy explaining why "Chandrashtamam" may show for fewer hours than a rasi-palan column says |
| Rahu/Ketu gochara | not graded (disclosed); classical = favourable in 3/6/11 — gap, P3 |
| Gochara vedha (`transits.VEDHA_TABLE`) — Su 3/6/10/11↔9/12/4/5, Mo 1/3/6/7/10/11↔5/9/12/2/4/8, Ma & Sa 3/6/11↔12/9/5, Me 2/4/6/8/10/11↔5/3/9/1/8/12, Ju 2/5/7/9/11↔12/4/3/10/8, Ve 9 pairs; Sun–Saturn and Moon–Mercury exempt | ✅ Phaladeepika, every pair |

### ❌ F-SAT-01 (P1) — Janma Sani is scored as the *lightest* stretch of Sade Sati
`sade_sati.py:69-75` + `prediction_score.py:75-80`: months 17–51 of the 90 are "FAVOURABLE"
(penalty **1**), covering the back half of Viraya Sani and **most of Janma Sani**. That is less
than Ashtama Sani (3) and less than the opening of Viraya Sani (5). Mainstream Tamil practice
holds the opposite: **ஜென்ம சனி is the heaviest phase** of ஏழரை சனி, and every Tamil rasi-palan
column treats it that way.

The segmentation cites "p.243" **with no book named**. The repo's own
`docs/SOURCE_PHOTOCOPY_REQUEST_2026-08-27.md` and `VINAADI_PAGE_NEEDED_REGISTER` mark it
unverified. The 16/35/4 figures look like the classical **Sani Nara-Chakra**, which segments by the
**nakshatra Saturn is transiting relative to the janma star**, not by elapsed months since the
12th-house ingress. Mapping a nakshatra-based body chart onto a month clock moves every boundary.

**Fix direction:** until the page is produced, revert to an unsegmented (or Janma-heaviest)
weighting. If the Nara-Chakra is the intended source, compute it from Saturn's transit nakshatra
counted from the janma nakshatra, not from months.

### ⚠️ F-SAT-02 (P2) — Ardhashtama Sani carries no direct score penalty
`prediction_score` deducts for `is_sade_sati` and `is_ashtama_sani` only. Ardhashtama (4th) and
Kandaka (7th/10th) reach the score only through the generic `saturn_house_score`. Tamil readers
see அர்த்தாஷ்டம சனி as a named, serious period. Make the named periods consistent: either all
named periods carry an explicit cost, or none do.

### ⚠️ F-SAT-03 (P3) — Pongu / Mangu / Marana Sani (which round of Ezharai) not modelled
Tamil practice distinguishes the 1st, 2nd and 3rd Sade Sati of a life (மங்கு / பொங்கு / மரண சனி).
The 2nd is widely read as beneficial. The app treats every round the same. Not an error, but a
commonly expected nuance; if ever added, the "marana" label must stay out of user-facing copy.

## 7. Muhurtham and the Tamil calendar

| Item | Code | Verdict |
|---|---|---|
| Marriage star list (Kalaprakasika p.79): Rohini, Mirugaseeridam, Magam, Uthiram, Hastham, Swathi, Anusham, Moolam, Uthiradam, Uthirattathi, Revathi | `marriage_muhurta_rules.py` | ✅ excludes Poosam, as practice requires |
| Marriage lagna: Mithunam/Kanni/Thulam best; Mesham/Viruchigam/Magaram/Meenam avoid | ✅ textual |
| 7th house vacant at muhurta lagna | ✅ |
| Amavasai = veto for marriage | ✅ |
| Guru/Sukra asthangata buffers (Venus 7 d after rising, Guru 8 d after / 15 d before) | ✅ textual |
| Chandrashtamam star-window veto, Tara bala ordering | ✅ |
| Rikta tithis 4/9/14 | ✅ |
| Tamil month start (sankranti before sunset → same day), with published-almanac overrides (Aavani/Purattasi 2026) | ✅ Thirukanitham rule; derived table in `docs/TAMIL_MONTH_BOUNDARY_TABLE_2026-27.md` |
| Almanac muhurtham-naal list | 2026 + 2027 sourced; other years return an explicit 404 | ✅ honest |

### ❌ F-MUH-01 (P1) — No-wedding months are a footnote, not a filter
`muhurta_service._WEDDING_MONTH_CUSTOMS` attaches a notice for ஆடி / புரட்டாசி / மார்கழி saying
*"it does not change this muhurta's score or recommendation"*. In real Tamil practice these are
not a family preference. **No printed Tamil almanac lists a single subha-muhurtham day in Aadi,
Purattasi or Margazhi**, and no Tamil purohit will conduct a wedding then. A "top recommended
muhurtham" in Aadi is a recommendation every Tamil family will reject on sight.
**Fix:** for MARRIAGE, demote these months below every other month (or veto with an
explicit "show anyway" toggle); keep the notice text. The Thai/eldest-child note can stay
advisory: that one genuinely is family-specific.

### ❌ F-MUH-02 (P1) — Karinaal goes silent on 1 Jan 2027 and the picker never reads it
- `panchangam_events_service.is_karinaal` looks dates up in a hand-entered **2026-only** list;
  for any other year it returns `False` with no warning. From 1 Jan 2027 every calendar page,
  the daily panchangam and the mobile app will show *no* Karinaal.
- `muhurta_engine` does not consult Karinaal at all, so the personal muhurta picker can
  recommend a கரிநாள், which every Tamil daily sheet marks.
- Karinaal days are **fixed Tamil solar dates** (Chithirai 6, 15 · Vaikasi 7, 16, 17 · Aani 1, 6 ·
  Aadi 2, 10, 20 · Aavani 2, 9, 28 · Purattasi 16, 29 · Aippasi 6, 20 · Karthigai 1, 10, 17 ·
  Margazhi 6, 9, 11 · Thai 1, 2, 3, 11, 17 · Maasi 15, 16, 17 · Panguni 6, 15, 19), so they can be
  **derived every year** from `tamil_solar_date` rather than typed in.
- Data hygiene in the 2026 list: the stored `tamilDay` labels are stale (2026-06-15 is labelled
  "Vaikasi 32", but the engine says Aani 1; Aavani/Purattasi labels are +1 off the engine). The
  *dates* are right, but **Margazhi 11 (2026-12-26) is missing**, and Karthigai 7 (2026-11-23) is
  not on the standard list. Verify both against the source sheet.

### ❌ F-PAN-01 — see §2 (the "சுபமுகூர்த்த நாள்" flag)

## 8. Planetary strength, dignity, aspects, vargas, Ashtakavarga

| Item | Code | Verdict |
|---|---|---|
| Exaltation / debilitation signs, deep-exaltation degrees (Su 10° Ar … Sa 20° Li) | `chart_strength.py`, `shadbala.py` | ✅ |
| Own signs; Moolatrikona (Su Le 0-20, Mo Ta 4-30, Ma Ar 0-12, Me Vi 16-20, Ju Sg 0-10, Ve Li 0-15, Sa Aq 0-20) | ✅ |
| Naisargika friendship (7 grahas) and Panchadha compound grading; temporary friends 2/3/4/10/11/12 | ✅ |
| Baladi (6° zones, even-sign reversal), Jagradadi | ✅ |
| Combustion orbs Me 14/12R, Ve 10/8R, Ma 17, Ju 11, Sa 15; Moon not "combust" | ✅ Surya Siddhanta |
| Gandanta: last 3°20′ water / first 3°20′ fire | ✅ |
| Special aspects Ma 4/8, Ju 5/9, Sa 3/10; fractional drishti ¼ (3,10), ½ (5,9), ¾ (4,8) | ✅ BPHS |
| Rahu/Ketu 5/7/9 aspect | ⚠️ VARIANT — disclosed as a school choice; fine |
| Shadbala: required rupas (6.5/6/5/7/6.5/5.5/5), naisargika, uchcha, saptavargaja points (45/30/22.5/15/7.5/3.75/1.875), kendradi, drekkana, oja-yugma, dig, nathonnatha, tribhaga, vara 45, hora 60, ayana (Sun ×2) | ✅ |
| Ashtakavarga BAV — all 7 tables, totals Su 48 · Mo 49 · Ma 39 · Me 54 · Ju 56 · Ve 52 · Sa 39 = **337** | ✅ |
| Vargas D2, D3, D4, D7, D9, D10, D12, D16, D20, D24, D27, D30 (correct even-sign lords), D40, D45 | ✅ BPHS |
| Yogas — Pancha Mahapurusha, Budha-Aditya, Chandra-Mangala, Sakata, Kemadruma, Papa/Shubha Kartari, Guru-Chandala, Amala, Adhi, Viparita, Raja (kendra-trikona), Parivartana, Neecha-bhanga | ✅ definitions classical; Gaja Kesari stricter than BPHS but a classical "pattern" twin is also reported |
| Kala Sarpa — 7 grahas on one side, degree-exact, both directions | ✅ |
| Navagraha remedy sthalams, japa counts, bija mantras | ✅ all nine correct |

### ❌ F-STR-01 (P2) — Chesta Bala runs the wrong way for fast planets
`shadbala._chesta_bala`: accelerated motion scores **15** (weakest), mean speed 20,
near-stationary 45. Classical eight-fold chesta: Vakra 60, Anuvakra 30, Vikala 15, Manda 30,
Mandatara 15, Sama 7.5, **Chara 45, Atichara 30**. A fast planet is classically strong, not
weakest, and a stationary (Vikala) one is weak, not 45. Shown in the Shadbala panel.

### ⚠️ F-STR-02 (P2) — Shadbala Drik Bala starts every planet at +30 virupa
Classical Drik Bala is (benefic drishti − malefic drishti)/4, typically within ±15. A flat +30
baseline (0.5 rupa) on every graha, combined with Abda/Masa/Yuddha being omitted, means the
"is classically strong" verdict is not comparable to JHora. It is labelled experimental, so
keep the label; do not cite it as BPHS-exact.

### ❌ F-VAR-01 (P2) — D60 counts backward for even signs
`divisional_charts.compute_d60`: odd signs count forward, even signs **backward**. BPHS (and
JHora): take (degree × 2), divide by 12, the remainder + 1 counted **forward from the sign
itself** for every sign. The odd/even reversal in the text applies to the *names* of the 60
shashtiamsa deities, not to the sign mapping. Every even-sign D60 placement is wrong.

### 🔍 F-ASV-01 (P3) — Mercury BAV from Lagna
Code uses {1,3,5,6,9,10,11} ("Phaladeepika"). BPHS and most software use **{1,2,4,6,8,10,11}**.
The total stays 54, so SAV totals look right while the per-rasi distribution differs. Confirm
which text the astrologer wants; if BPHS, change it.

### ⚠️ F-REM-01 (P3) — Navadhanya: Mars and Ketu grains
Mars is traditionally **துவரை** (toor/red gram), not "red lentils" (masoor). Ketu is
**கொள்ளு** (horse gram), not "mixed grains". Venus's traditional grain (மொச்சை) is absent.

## 9. Scoring tables (daily, life areas, what-if)

### ❌ F-SCO-01 (P1) — The daily transit table contradicts classical gochara *and* the app's own grade
`_dg_scoring.TRANSIT_BASE_SCORE` (labelled `[PRODUCT]` in the rulebook, "require separate
review") versus classical gochara from the Janma Rasi, which `gochara_grade.py` already encodes:

| Transit | Classical | Daily score | Problem |
|---|---|---|---|
| Saturn 10th | adverse (Kandaka) | 62 (= Saturn 3rd) | rated as good as a favourable house |
| Saturn 7th / 5th | adverse | 50 / 52 | neutral |
| Rahu 6th · 11th | **best** houses | 44 · 52 | below / at neutral |
| Ketu 3rd · 6th · 11th | **best** houses | 46 · 42 · 40 | all *below* neutral |
| Moon 6th · 10th | good | 46 · 52 | below / near neutral |
| Moon 5th · 9th | not favourable | 62 · **64** (highest) | inverted |

So the Today score can rise while the Transits card for the same planet says "needs care".

### ❌ F-SCO-02 (P1) — Three copies of the transit table disagree
`life_areas_service._*_HOUSE_SCORE`, `whatif_service._*_HOUSE_SCORE` and
`_dg_scoring.TRANSIT_BASE_SCORE` differ: Jupiter 7th 68 vs 74; **Moon 4th 48 vs 65** (classically
adverse); Rahu 6th 44 vs 58; Ketu 12th 38 vs 62. The same transit gets a different grade on
Today, Life Areas and What-if. The inventory doc already names a single
`gochara_scores.py` as the fix. Do it, and derive the numbers from the classical favourable
sets (Sun 3-6-10-11; Mars/Saturn/Rahu/Ketu 3-6-11; Jupiter 2-5-7-9-11; Moon 1-3-6-7-10-11;
Mercury 2-4-6-8-10-11; Venus 1-2-3-4-5-8-9-11-12) instead of hand-typing them.

## 10. Other engines (spot-verified)

| Item | Verdict |
|---|---|
| Ashtottari — Su 6, Mo 15, Ma 8, Me 17, Sa 10, Ju 19, Ra 12, Ve 21 = 108; Raman/Jataka-Parijata star grouping | ✅ (BPHS 28-star Abhijit variant deliberately not used — documented) |
| Yogini — Mangala 1 (Mo) … Sankata 8 (Ra) = 36 | ✅ |
| Jaimini chara karakas — 8-karaka scheme, Rahu degree reversed | ✅ |
| Tajaka — sidereal solar return, muntha +1 sign/yr | ✅; Itthasala/Isarafa is a labelled display-only simplification (Isarafa ">5° apart in one sign" is not separation; keep it display-only) |
| Numerology — Chaldean A1 B2 C3 D4 E5 F8 G3 H5 I1 J1 K2 L3 M4 N5 O7 P8 Q1 R2 S3 T4 U6 V6 W6 X5 Y1 Z7; 4 = Rahu, 7 = Ketu, 9 = Mars | ✅ Cheiro / Indian convention |
| Tamil star, rasi and month names | ✅ standard forms |
| Festivals — Vaikunta Ekadasi (Margazhi Shukla 11), Karthigai Deepam (Karthigai + Krittika), Thai Poosam, Pradosham at sunset, Sivarathiri at nishita, Mahalaya Amavasai | ✅ Tamil solar-month rules |

### ⚠️ F-FES-01 (P2) — Pournami-anchored festivals require the star and the full moon on the same civil day
`Chitra Pournami` fires only when Pournami *and* Chithirai star dominate the same day (and the
Tamil month is not checked at all). Tamil practice: **Chithirai-month Pournami**, whatever the
star. `Maasi Magam` and `Panguni Uthiram` have the same AND-gate, the exact bug class L-14
already fixed for Karthigai Deepam. In years where the star and the full moon split across
two days, the festival silently disappears.

### ⚠️ F-FES-02 (P3) — Solar-month + tithi festivals can fire twice
Vinayagar Chathurthi (Aavani Shukla 4), Krishna Jayanthi (Aavani Krishna 8), Skanda Sashti and
Deepavali (Aippasi) are keyed to a 30–32-day solar month that can contain two occurrences of
the same tithi (~5% of years). Dedup is by name *within a day*, not across the month.

### ⚠️ F-KAR-01 (P2) — Karaka tables disagree, and the marriage karaka ignores gender
- Property: `karaka_chains` = Moon/Mars; `life_areas_service._AREA_KARAKA` = Mars/Venus.
- Marriage: Venus primary for every chart. Tamil practice reads **Guru as the husband's karaka
  in a woman's chart** (Venus for a man's). DD-05 deliberately made marriage copy
  gender-neutral; that ruling governs *copy*, so the karaka choice still needs an explicit
  ruling of its own.

---

## Summary of verdicts

**What is right (and it is most of the system).** Every lookup table a Tamil astrologer would
check by eye matches standard practice: ayanamsa, node type, sunrise convention, Vimshottari
(including the opening-bhukti reconstruction many apps get wrong), all ten porutham tables,
Rajju/Vedha veto, Chevvai house set and all five nivarthi signs, Rahu Kalam / Yamagandam /
Kuligai / Gowri / Durmuhurtham / Hora / Soolam, karana, combustion orbs, dignity tables,
aspects, Ashtakavarga (337), fourteen vargas, gochara favourable houses and vedha pairs,
Navagraha sthalams and japa counts, the 11 marriage stars, Chaldean numerology.

**What a Tamil family would notice first** (fix in this order):

| # | ID | Sev | One line |
|---|---|---|---|
| 0 | F-MAR-01 | **P0** | Marriage prediction tells every chart **without** Sevvai dosham that "செவ்வாய் தோஷம் உள்ளது" and deducts 3–6 points (§11) |
| 1 | F-CI-01 | **P0** | Active one-sided Chevvai dosham can still read "EXCELLENT"; the astrologer's anchor #6 says AVERAGE, and the cap was never built |
| 1a | F-MAR-02 | P1 | Any planet in the 7th, malefic included, scores +6 "SUPPORT"; lone Saturn/Rahu nets +3 (§11) |
| 1b | F-DSP-01 | P1 | Raw English engine values in Tamil mode: compatibility badges, mobile dasha lord, mobile Jadhagam rasi/nakshatra (§11) |
| 2 | F-MUH-02 | P1 | Karinaal goes dark on **1 Jan 2027** (hand-typed 2026 list) and the muhurta picker never checks it |
| 3 | F-MUH-01 | P1 | Aadi / Purattasi / Margazhi weddings are ranked normally; only a footnote |
| 4 | F-PAN-01 | P1 | "சுபமுகூர்த்த நாள்" badge uses a list with Poosam and without the Ashtami / month / Karinaal exclusions |
| 5 | F-SAT-01 | P1 | Janma Sani scored as the *lightest* stretch of Sade Sati, from an unnamed "p.243" |
| 6 | F-SCO-01/02 | P1 | Three hand-typed transit tables disagree with each other and with classical gochara (Rahu/Ketu 3-6-11 below neutral; Saturn 10th = Saturn 3rd) |
| 7 | F-POR-05 | P1 | A known bride with an unspecified partner is counted as the groom |
| 8 | F-CI-02 | P1 | Rajju risk line says "ஆயுள்" (lifespan), which EC-RULING-06 banned |
| 9 | F-CI-03 | P1 | Papa samyam (பாப சாம்யம்) not implemented |
| 10 | F-POR-02/03 | P2 | Rasi 8th passes; same-star couples always vetoed. Both are cited rulings, but they diverge from mainstream practice, so re-confirm with the astrologer using that framing |
| 11 | F-VAR-01, F-STR-01 | P2 | D60 even-sign direction; Chesta Bala inverted for fast planets |
| 12 | rest | P2–P3 | see sections above |

**Scope limits of this audit (what it cannot see).** Tables and rules were checked by reading
code against classical sources. Nothing was executed against a printed almanac: the
Thirukanitham-almanac parity of sunrise and month starts remains the recorded open item.
The web/mobile copy was sampled, not swept. Amirdhadhi yogam, Jeevan/Nethiram and the Gowri
*night* table rest on single sources I cannot independently confirm.

## 11. Cross-check against a second review (Codex, same day) — confirmed items

A parallel review was run with another tool. Each claim below was **re-verified against the code
here** before being added; none is taken on report alone.

### ❌ F-MAR-01 (P0) — "No Sevvai dosham" is treated as "uncancelled Sevvai dosham"
`app/api/predictions.py:212` sends only `sevvai_cancelled = bool(sevvai and sevvai.is_cancelled)`.
`marriage_service.py:676` then branches on `if not payload.sevvai_dosham_cancelled:`. For a chart
with **no** Sevvai dosham that is `True`, so the user loses 6 points (3 if age ≥ 28) **and is told
"Sevvai dosham is present … / செவ்வாய் தோஷம் உள்ளது"** or "Sevvai dosham requires caution". In
practice that is every dosham-free chart, i.e. most users of the marriage prediction.
**Fix:** pass presence and cancellation separately (`sevvai_present`, `sevvai_cancelled`), apply the
penalty only when present and not cancelled, and add a test for the absent case. Grep the other
consumers of `MarriageAssessmentInput` for the same contract.

### ❌ F-MAR-02 (P1) — 7th-house occupancy is scored as support regardless of the planet
`marriage_service.py:413-428`: any planet in the 7th adds **+6** and is labelled `SUPPORT` / "7th
house is activated". The malefic penalty at `:474-476` is −3 per malefic (capped at −9). A lone
Saturn, Rahu, Ketu or Mars in the 7th therefore nets **+3**. In classical and Tamil reading, a
malefic alone in the 7th is a delay/friction indicator (and a Chevvai-dosham house), never a plus.
**Fix:** occupancy activates the house without scoring it; benefic occupants add, malefic
occupants subtract.

### ❌ F-DSP-01 (P1) — Raw engine values reach Tamil readers (Display-boundary rule)
- `web/components/compatibility-intelligence-panel.tsx:547, 592` — `<Badge text={…harmonyLabel}>`
  prints `STRONG` / `SUPPORTIVE` / `MIXED` in Tamil mode (also the Moon/Venus harmony, Sevvai
  severity and the English-only `communicationNote`).
- `mobile/app/dasha/index.tsx:259` — `{isTamil ? d.current.mahadasha.lord : d.current.mahadasha.lord}`:
  both branches are the raw English key.
- `mobile/app/jadhagam/[id].tsx:222-223` — renders `rasiName` / `nakshatraName`, the exact fields
  CLAUDE.md's display-boundary table forbids.

### ⚠️ F-DOC-01 (P2) — Status documents contradict the live code
`docs/MASTER_FIX_LIST.md:569` (AST-1) still says Porutham is "relabeled 36-point Ashtakoota",
status open. The engine has been the Tamil 10-porutham with Rajju/Vedha veto for months. Per
CLAUDE.md's "a stale conclusion outlives its check", close or annotate it. (The second review
reports similar stale rows in `DOCTRINE_DECISIONS_V1.md:496`; not re-verified here.)

### Also noted by the second review, consistent with this audit
- `venusMarsHarmony` measures Venus↔Venus = **F-CI-05** here.
- The composite's weights, 80/65/50 rungs and "Venus/Jupiter/Moon dasha = marriage-supportive"
  are `[PRODUCT]` conventions, not Thirukanitham formulas, and should be labelled so in the
  explanation. Overlaps **F-CI-04**.
- 32 open practitioner questions and an unsigned physical-edition ledger
  (`DOCTRINE_DECISIONS_V1.2.md`): the yoga/dosham layer is "implemented per Vinaadi's rulings",
  not "classically certified". Agreed; it should not be marketed as certified.

### Found here but not in the second review
F-CI-01 (matching-composite Sevvai cap), F-MUH-01/02 (no-wedding months, Karinaal 2027 cliff),
F-PAN-01 (சுபமுகூர்த்த நாள் badge), F-SAT-01 (Janma Sani), F-SCO-01/02 (transit tables),
F-POR-05 (bride/groom fallback), F-CI-02 (ஆயுள் wording), F-CI-03 (papa samyam), F-VAR-01 (D60),
F-STR-01 (Chesta), F-POR-02/03 (practice divergences to re-confirm).
