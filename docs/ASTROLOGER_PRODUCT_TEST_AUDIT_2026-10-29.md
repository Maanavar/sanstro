# Astrologer + product + test audit (2026-10-29)

Three lenses on one engine: a Thirukanitham astrologer checking what a family is told, a product
owner checking what the screens say, and a test lead checking that one question gets one answer.

**Scope.** Derived layers only. Raw positions (lagna, Moon star, dasa balance) are already swept
against Swiss Ephemeris by `scripts/audit/chart_property_sweep.py`. Festivals and Tamil dates were
audited 21–23 Oct and are not repeated. Nothing in `OPEN_ITEMS_2026-10-22.md` is re-reported unless
something new was found.

**Method.** Synthetic birth profiles only (no real person), run through the production chart
builder (`_chart_response_from_profile`) in `vinaadi-dev-api`. Where two code paths answer the same
question, both were run on the same charts and the answers compared. Numbers below are counts from
those runs.

Status key: `[ ]` open · `[~]` partly done · `[x]` done. Prefix **AAU**.

| Priority | Meaning | Count |
|---|---|---|
| P1 | Wrong on a screen or printout today, or two screens disagree | 7 |
| P2 | Doctrine error, latent wrong data, or a contradiction a reader can find | 9 |
| P3 | Small, cosmetic, or needs a ruling first | 4 |

### Ruling gate (added after the external review, 29 Oct)

This audit can show that two code paths disagree, or that output contradicts a definition. Where
traditions differ, it cannot say which answer is right. That needs the astrologer. So every item is
in one of two lanes, and nothing in the second lane ships as a production rule before its ruling is
recorded in the doctrine document:

| Lane | Items | Why no ruling is needed / what the ruling is |
|---|---|---|
| **Fix now** | 01, 02, 03, 05, 06, 08, 14, 17 | They follow from a definition (the birth instant, the sunrise-to-sunrise day, the tharparai unit), from a rule already ruled (display boundary, KI-01 veto), or from the standard nadi koota table. 05 copies the card's inputs into the report and changes no doctrine. 14 removes an unsourced weight. |
| **Ruling first** | 04, 07, 09, 10, 11, 12, 13, 15, 16, 18, 19 (20 goes with 07) | The syllable canon (04); what "is today good?" means on each surface (07); node houses (09); bhava reckoning (10); the 6.1 reading (11); Putra/Sarpa grahas (12); the 1st house for Sevvai (13); the yoga policies (15); the year-name tradition and the Ayanam/Ruthu rules (16); spellings (18); the Sankranti window (19). |

Where an item proposes the answer as well, read the proposal as a question to put to the astrologer,
not as a finding.

---

## P1: wrong on a screen today

### [ ] AAU-01. The printed Jadhagam's birth tithi, yoga and karana are the sunrise values, not the birth values

**Problem.** `_birth_panchangam_signature_items` (`app/services/_chart_build.py:154`) calls
`calculate_daily_panchangam` for the birth **date** and copies its tithi, nakshatra, pada, yoga and
karana. Those are sunrise values. The public Jadhagam generator prints them as the birth panchangam
(`JadhagamTool.tsx:522`, `:530`).

**Evidence.** On 60 random synthetic charts, the signature's nakshatra differed from the natal
Moon's nakshatra in **17 (28%)**. For example, a birth at 20:03 printed Uthiradam while the Moon was
in Thiruvonam, with the tithi a day out. The Jadhagam takes the nakshatra from the Moon (correct)
and the tithi from the signature (wrong), so one printed sheet can name a star and a tithi that never
coexisted.

**Why it matters.** A family takes a printed jathagam to their astrologer. The birth tithi is the
first thing checked, and it feeds Dagdha rasi, tithi-lord readings and naming.

**Fix.** Build the signature from the birth instant: tithi = ⌊(Moon − Sun)/12°⌋ + 1, nakshatra and
pada from the Moon, yoga from (Sun + Moon), karana from the half-tithi. The chart already holds both
longitudes. Keep sunrise and sunset from the day panchangam (see AAU-02 for which day).

**Acceptance.** A sweep test of at least 200 charts: the signature's tithi, nakshatra, pada, yoga and
karana equal values recomputed from the chart's own Sun and Moon. Random charts rarely land near a
transition, so add births placed one minute either side of a tithi, nakshatra, yoga and karana
change. Run it once on the old code and confirm it fails.

### [ ] AAU-02. A birth before sunrise is printed on the next Tamil day

**Problem.** The Tamil day runs sunrise to sunrise. The signature uses the civil date for the Tamil
date (`format_tamil_date(birth_date_local, …)`), the weekday and the sunrise. So does the naaligai
count.

**Evidence.** A synthetic birth at 03:00 on 14 Apr 1995 (Chennai) prints **"Chithirai 1, Friday"**,
the Tamil New Year. By Tamil reckoning it is **Panguni 30, Thursday night**. 03:00 on 15 Jan 2001
prints Thai 2 (should be Thai 1); 03:00 on 10 Jul 1990 prints Aani 26 (should be Aani 25). This
applies to every birth between midnight and sunrise, roughly a quarter of all births.

**Fix.** If the birth instant is before that date's sunrise, use the previous civil date for the
Tamil date, vaaram and the sunrise that anchors the naaligai. AAU-01 then supplies the tithi and star
at the birth instant either way.

**Acceptance.** The three cases above print Panguni 30 / Thursday, Thai 1, Aani 25. A birth at
sunrise + 1 minute is unchanged; so is one at sunrise − 1 minute on the far side. Repeat at a
second Tamil Nadu location and in the other half of the year, since sunrise moves by both.

### [ ] AAU-03. Raw English engine codes in Tamil documents (Jadhagam, PDF), plus a label typo

**Problem.** The CLAUDE.md display rule: tithi, yoga and karana go through `tTithi` / `tYoga` /
`tKarana`; a bare engine string is the wrong field. Two printed surfaces break it.

- **Jadhagam generator.** `JadhagamTool.tsx:522` prints `sig.tithi` (e.g. `EKADASI`). `:530` prints
  `sig.yogam` and `sig.karanam` (e.g. `PARIGHA/BAVA`). These sit inside an all-Tamil document.
- **PDF, "Today's guidance".** `pdf_export_service.py:370-371` prints `panchang.nakshatra_name` and
  `panchang.tithi_name (panchang.tithi_paksha)`, for example `UTHIRADAM` and `EKADASI (KRISHNA)`,
  under Tamil labels. The appendix comment in the same file says "never a raw engine code".
- **Label typo.** `JadhagamTool.tsx:520` reads **பஷ்ம-திதி**, which is not a Tamil word. Use
  பக்ஷம்-திதி (or பட்சம்), as the native reviewer prefers.
- **Brand.** The Jadhagam header spells the brand **விண்ணாடி**, a third spelling beside the
  விநாடி / வினாடி split already logged in `MOBILE_TAMIL_PLACEHOLDERS_2026-10-23.md`.

**Acceptance.** In Tamil mode the Jadhagam and PDF contain no `[A-Z]{4,}` tithi, yoga, karana,
nakshatra or paksha code. Add both files to the display-boundary ratchets (web and backend).

### [ ] AAU-04. The Jadhagam's name-syllable table is wrong on 14 pada initials

**Problem.** `JadhagamTool.tsx:68` hand-types the four starting syllables per star
(நட்சத்திர எழுத்துக்கள்). The app's own naming canon, `app/data/nakshatra_pada_akshara.py`, holds the
same fact. They differ on **59 of 108 cells**. Most of those are vowel length (லு vs லூ), but
**14 differ in the consonant**. In every one, the canon matches the commonly printed syllable and the
Jadhagam does not. The canon is itself unverified (below), so this is a proposal for the astrologer
to confirm, not a ruling:

| Star | Jadhagam | Canon / standard |
|---|---|---|
| Ashwini 1–4 | அ, சி, சு, சே (shifted by one) | சு, சே, சோ, லா |
| Thiruvathirai 2–4 | க்ஷ, ண, ஞ | கா, ங, சா |
| Pooradam 2–4 | ட, ட, டீ | தா, பா, டா |
| Thiruvonam 4 | க்ஷீ | கா |
| Uthirattathi 2–4 | ஜ, ஜீ, ஜு | தா, ஜா, ஞா |

**Why it matters.** Families name children from this line. An Ashwini pada-1 baby is told "அ", which
is Karthigai's letter.

**Also.** The canon itself is **0 of 108 rows verified** (`verified_row_count()`). That is already
known to block baby naming. It should block this printout too.

**Fix.** Delete the hand-typed table. Render from the canon (API field or generated TS, like
`natchathiram-dasa-timings.ts`), and show the same "unverified" state the naming feature uses until
the astrologer signs the canon.

**Acceptance.** A drift test fails if the Jadhagam's syllables differ from the canon in any cell.

### [ ] AAU-05. Sevvai dosham: the compatibility report and the Jadhagam card disagree

**Problem.** `compatibility_intelligence._compute_sevvai` and `_sevvai_references` call
`detect_sevvai_dosham` with planets and lagna only. The Jadhagam card's path (`yogas.py:387`) also
passes `combust_planets`, `d9_rasi_map`, `d9_lagna_rasi`, `active_lords` and the live `doctrine`.
The comment at `compatibility_intelligence.py:277` says the two "can never disagree" (WI-13). They
can.

**Evidence (400 synthetic charts, single-chart reading).** Presence agreed on all 400. **Severity
differed on 57 (14%)**: the card said STRONG (combust Mars is an aggravation) while the report said
MODERATE, or the reverse when D9 supplied a mitigation. **The reason list differed on 214 (54%).**
The partner's references are computed the same incomplete way, so dosha-samyam can also differ.

**Why it matters.** The same person sees "severe" on one screen and "moderate" on the other, about
the most feared item in Tamil marriage matching.

**Fix.** One helper `sevvai_inputs_from_snapshot(snap, doctrine)` that both paths call, carrying
combustion, D9 and doctrine.

**Acceptance.** A sweep test of at least 400 charts shows 0 differences in `is_present`, `strength`,
`label` and `cancellation_factors` between the card and the report. It fails on today's code
(checked: 57).

### [ ] AAU-06. Mobile porutham celebrates a match the server has vetoed

**Problem.** `mobile/app/(tabs)/tools/porutham.tsx:168-174` colours the score hero saffron (its
"best" colour) and fires a **success haptic** at `totalScore >= 8`. It never reads the label, Rajju
or Vedha. Since KI-01 the server labels a Rajju/Vedha failure CAUTION and its summary says "needs
extra care". KI-01's own count is **604 of 11,664 star/pada pairings** at 8/10 or more with Rajju
failing. On mobile those show a celebratory hero above a caution sentence.

**Also.**
- The haptic call sits in the render body, so it fires again on every re-render.
- Three surfaces use three ladders for one score: server bands 9/7/5 with ties rounding up, web tool
  7/5 (with a critical check), mobile 8/5 (with none).

**Fix.** Colour from the server's `label` (CAUTION → caution colour). Fire the haptic once, in an
effect keyed on the result, and only when `label` is EXCELLENT or GOOD. Use the same mapping on web.

**Acceptance.** A render test with 8/10 and Rajju failing shows the caution colour and no success
haptic. It fails on the current screen.

### [ ] AAU-07. On 14 days of 2026 the calendar badges "good day" while the PDF and push say "caution"

**Problem.** Two "good star" lists and one "caution star" list answer "is today good?":

- `panchangam.SUBHA_NAKSHATRAS` (17 stars) drives the calendar's நல்ல நாள் badge
  (`is_subha_muhurtham`), read on the **sunrise** star.
- `_dg_scoring.AUSPICIOUS_DAILY_NAKSHATRAS` (11 stars) and `CAUTION_DAILY_NAKSHATRAS` {Bharani,
  Ayilyam, Magam, Moolam} drive the PDF's day score (72 / 32) and the push fallback, read on the
  **dominant** star.

Magam and Moolam are in both the subha list and the caution list.

**Evidence (Chennai, every day of 2026).** On **14 days** the badge says good and the PDF/push says
caution, scored 32/100. Seven come from the list overlap (Magam 26 Apr, 17 Jul, 7 Oct; Moolam
16 Jan, 8 Apr, 29 Jun, 10 Dec). Seven come from the sunrise-vs-dominant star (Poosam at sunrise,
Ayilyam dominant: 5 Jan, 1 Mar, 29 Nov; Aswini/Bharani: 22 Feb, 12 Jun, 26 Oct, 20 Dec).

**Fix.** One day-quality module that every surface calls, with the star it reads and the list it
uses named per purpose. Do not assume the D11 sunrise-star rule carries over: it was ruled for
Chandrashtama. **Astrologer, a scope question first:** do the calendar's நல்ல நாள் badge, the
PDF day score and the push answer one question ("is today generally good?"), or different ones
(general day, a given activity, this person's transits)? Then: which star (sunrise or dominant)
for each, and are Magam and Moolam good or caution stars for ordinary new work? If the questions
really are different, the surfaces may differ, but each must say which question it answers. Two
unlabelled verdicts on the same day may not contradict.

**Acceptance.** A 2026 sweep shows 0 days where the badge and the PDF/push disagree.

---

## P2: doctrine errors, latent wrong data, findable contradictions

### [ ] AAU-08. The chart's nadi is wrong for 18 of 27 stars and contradicts porutham

`_chart_planets._nakshatra_nadi` (`:135`) uses contiguous blocks of three: stars 1–3 Aadhi, 4–6
Madhya, 7–9 Anthya. The classical pattern runs A-M-An-An-M-A, as `porutham.py:183` has it. They
agree only on stars ≡ 1, 5, 0 (mod 9), so the chart is wrong for 18 stars. Example: Uthiradam is
Anthya, but the chart says Aadhi. The value ships on every chart payload as
`birthPanchangamSignature.nadi`. No screen renders it today, but any consumer that reads it (API,
future card, PDF) will contradict the porutham screen's nadi dosham.

**Fix.** Import porutham's `_NAKSHATRA_NADI` (or make it public) and delete the copy.
**Acceptance.** A test that both functions agree for all 27 stars.

### [ ] AAU-09. Rahu/Ketu in the 10th: the score says adverse, the words say supportive

`gochara_scores.GOCHARA_FAVOURABLE_FROM_MOON` gives the nodes {3, 6, 11}, so the 10th scores 38
(adverse) on Today, Life Areas and What-if. `_dg_peyarchi.NODE_AXIS_SUPPORTIVE` = {3, 6, **10**, 11}
feeds Today's palan sentence (`personal_palan._GOCHARA_GOOD`) and the Peyarchi report, which call
the 10th supportive. Meanwhile `gochara_grade.py` says the nodes have "no astrologer-approved
gochara table yet". This is the number-vs-word contradiction F-SCO-01 set out to remove, back for
the nodes.

**Fix.** One node set, used by both. **Astrologer:** is Rahu in the 10th from the Moon favourable
(some texts add the 10th for Rahu)?
**Acceptance.** Extend `test_the_two_modules_list_the_same_favourable_houses` to the nodes.

### [ ] AAU-10. "Equal bhava" uses the lagna as the start of the 1st house, not its middle

`equal_bhava.compute_equal_bhava` puts house 1 at lagna → lagna + 30°. That is the Western equal-house
convention. In Indian bhava reckoning, and in what a Tamil reader expects from "சம பாவம்", the lagna
degree is the **bhava madhya**, so house 1 runs lagna − 15° → lagna + 15°. The vargas panel lists
"planets that differ between rasi and bhava", and the shift then goes the wrong way: any planet whose
degree in its sign is below the lagna degree is moved **back** a house. Under madhya, planets more
than 15° past the lagna degree move **forward**.

Example (synthetic, lagna Meenam 5.9°): the Moon at Magaram 3.9° is shown in bhava 10. Under madhya
it stays in 11. The value is also persisted as `chart_planets.bhava_house`.

**Fix.** Offset by 15°, or relabel the panel honestly as a Western equal-house lens. **Owner:**
which. If the reckoning changes, recompute the stored `bhava_house` column and update
`tests/test_equal_bhava.py`.

### [ ] AAU-11. Sunapha, Anapha and Durudhura are shown together for one configuration

`_yoga_detect.detect_sunapha_anapha_durudhura` (`:1676-1684`) emits Sunapha and Anapha **and**
Durudhura when both sides of the Moon are occupied, so the reader gets three yoga cards. The rule
file (`yoga_rules.py:1240`) leaves this as "a presentation call". It may not be one: Phaladeepika
6.1 gives the three "respectively", for planets in the 2nd, the 12th, or both, which reads as
Durudhura replacing the other two rather than sitting beside them. In the sample, Sunapha fired on 33% of
charts and Anapha on 30%, including every Durudhura chart.

**Fix.** Emit Durudhura alone when both sides are occupied.
**Astrologer:** confirm the reading of 6.1.

### [ ] AAU-12. "Putra Sarpa dosham" counts Saturn, and fires on 47% of charts

`_PUTRA_SARPA_AFFLICTORS = ("RAHU", "KETU", "SATURN")` (`_yoga_dosham.py:1502`). Sarpa means the
serpent, the nodes. Saturn in the 5th (or with the 5th lord) is புத்திர தோஷம், not சர்ப்ப
தோஷம். Calling it Sarpa sends families to naga remedies (`remedies.py:153` routes
PUTRA_SARPA_DOSHAM with the node doshams) for a Saturn placement. Prevalence on 120 synthetic
charts: **56 (47%)**, a children-related dosham for nearly every second family.

**Fix.** Split it into Putra dosham (Saturn) and Sarpa dosham (nodes), each with its own remedy
route, or rename. **Astrologer:** which grahas, and whether "node conjunct Jupiter anywhere" is
enough on its own.

### [ ] AAU-13. Every chart has a dosham: 0 of 200 dosham-free, mean 3.25

**Product finding, not a single bug.** On 200 synthetic charts (1960–2010, Chennai):

- Doshams shown per chart: mean **3.25**. After excluding cancelled and "candidate" labels: mean
  **2.6**. **No chart had none.**
- Sevvai present on **363 of 400 (91%)**: 317 active or strong from Lagna or Moon, 46 Venus-only
  "candidate". Counted from the Lagna (with or without other references): 55%, where five
  houses of twelve would give about 42%.
- Yogas: Raja yoga 76%, Viparita Raja yoga 58%, Vasumati 52%.

**Why.** The Sevvai house set is six houses ({1, 2, 4, 7, 8, 12}, `_yoga_helpers.py:28`, recorded in
`SEVVAIRAGU.MD`) from three references. Many Tamil practitioners use five ({2, 4, 7, 8, 12}), and the
app's own nivarthi table (`HOUSE_SIGN_NIVARTHI`) has **no row for the 1st house**. So a 1st-house
Mars can never receive the house-sign exemption the other five houses get. That is a sign the 1st
was added to a five-house scheme.

**Why it matters.** When a warning applies to 91% of users it tells a family nothing about their own
child, and it is the screen most likely to frighten them.

**Fix (owner + astrologer).**
1. Ask the astrologer to confirm or drop the 1st house, and, if kept, to supply its nivarthi signs.
2. Lead the dosham panel with the one or two that matter (by strength and Lagna reference), and
   collapse the rest under "minor factors".
3. Add a prevalence gate: a test that prints the share of a fixed synthetic population carrying each
   dosham, so a doctrine change that moves it is seen.

### [ ] AAU-14. Marriage timing calls ages 25–35 the only supportive band, for everyone

`marriage_service.py:697`: ages 25–35 add +6 ("Age phase is supportive"); any other age adds a
challenge, "Age phase is outside peak range". The rule ignores gender, so a 23-year-old woman, a
common Tamil marriage age, is told she is outside the peak. It has no named source.

**Fix (owner + astrologer).** Either drop age from the score (dasa and gochara already carry timing),
or make it a sourced, gender-aware band. Never word it as "outside peak".
**Decided 29 Oct (delegated by the owner):** drop age from the score. A sourced band can come back
if the astrologer supplies one. Acceptance: the same chart's timing score does not change when only
the age crosses 25 or 35.

### [ ] AAU-15. Two lists of bad yogas disagree

`_dg_scoring.CAUTION_YOGAS` = {Vishkambha, Atiganda, Shoola, Ganda, Vyatipata, Vaidhriti} (6) drives
the Today score. `panchangam.ASHUBHA_YOGAS` adds **Vyaghata, Vajra, Parigha** (9) and drives the
strict muhurtham check. On a Parigha day, Today does not caution while the muhurtham check rejects
the day. A weighted daily score and a strict muhurtham veto may legitimately use different subsets,
but today nothing records that as a choice, so it reads as drift. **Fix:** one yoga classification
table, and each policy (daily caution, strict muhurtham) names its subset of it explicitly. Never
make the strict check looser to match the daily one. **Astrologer:** should Vyaghata, Vajra and
Parigha caution an ordinary day?

### [ ] AAU-16. No Tamil year name anywhere, including the printed Jadhagam

Nothing in `app/`, `web/` or `mobile/` names the 60-year cycle (e.g. விசுவாவசு 2025–26, பராபவ
2026–27). Ayanam and ruthu are also absent. A Tamil jathagam always carries "… வருடம், … மாதம்
… தேதி", and families notice when the line is missing. **Fix: three specs, one per field.**
(a) Samvatsara: a pure function from the Tamil year (Chithirai 1 boundary) to the name, with a
test that the 1 a.m. before Chithirai 1 still names the old year (AAU-02's day rule). (b) Ayanam:
from the Sun's sidereal position, Uttarayanam from Thai (Makara sankranti) in Tamil reckoning. It
does not follow from the year. (c) Ruthu: from the solar month, two months per ruthu, with the
starting month confirmed. Show them on the Jadhagam, the PDF and the calendar header.
**Astrologer:** the Ayanam and Ruthu conventions. **Native reviewer:** the Tamil names.

---

## P3: small, or needs a ruling first

### [ ] AAU-17. The naaligai's third field is leftover seconds, not tharparai

`computeNaaligai` (`JadhagamTool.tsx:159`) prints naazhigai.vinaadi.**seconds (0–23)**. The Tamil
third unit is the tharparai: 60 per vinaadi, 0.4 s each, so 0–59. Birth and sunrise seconds are also
dropped, which can shift the vinaadi by up to 2.5. **Fix:** compute from full seconds; print
tharparai or drop the field.

### [ ] AAU-18. One porutham, three Tamil spellings

Result screens (`porutham.py:1125`, `synastry_service.py:613`) say **வாஸ்யம்**, மகேந்திரம்,
ஸ்திரீ தீர்கம். Mobile's learn page (`learnContent.ts:213`) says **வசியம்**, மாஹேந்திரம்,
ஸ்திரீ தீர்க்கம். Almanacs print வசியப் பொருத்தம். **Native reviewer:** pick one set.

### [ ] AAU-19. "Sankranti birth" alerts on the whole civil day

`birth_conditions.is_sankranti_birth` fires an ALERT ("inner restlessness … many changes") for any
birth on the civil day, midnight to midnight, of a solar ingress: about 1 chart in 30. The Tamil day
starts at sunrise, and the classical concern is birth near the ingress (its punya kalam), not the
whole day. **Astrologer:** the window, in nazhigai either side of the ingress.

### [ ] AAU-20. The PDF's day block names one star and scores another

`pdf_export_service.py:370` prints the sunrise nakshatra. Line 703 scores the dominant one. On a
transition morning the sheet says "Poosam" beside a score that was set by Ayilyam. It goes away with
AAU-07.

---

## Checked and correct

These were tested and need no action:

- Rahu kalam, Yamagandam and Kuligai slots, all 7 weekdays.
- Soolam directions and parigaram.
- Durmuhurtham indices (except the Tuesday-night slot, already known).
- Hora lord order and the sunrise anchor (equal 60-minute horas are a recorded ruling).
- Dagdha rasi table, cell by cell against Muhurta Chintamani.
- Gana table.
- Birth tithi, yoga and karana arithmetic, where it uses the birth longitudes (`birth_conditions`).
- Vimshottari: sequence, years, bhukti proportions, and the opening maha's bhuktis anchored to its
  true start. 365.25-day years everywhere.
- Ezharai Sani phases, Ardhashtama, Ashtama and Kandaka (4/7/10 from the Moon); the derived claim
  that the 5th from the Moon is never touched.
- Murthi defaults to the ingress-Moon method; the pada variant is labelled.
- Gochara favourable sets for the seven grahas.
- Chandrashtama arithmetic, behind one function.
- Sign lords single-sourced.
- All `compute_porutham` callers pass Moon star, rasi and pada the same way.
- Rajju/Vedha veto server-side (KI-01).
- D9 rasi and D9 dignity, spot-checked.

## Blind spots of this audit

- Synthetic charts, mostly at Chennai, 1960–2010. Prevalence figures depend on that range.
- The probes compare the engine with itself through two paths. They cannot say which path agrees
  with a printed panchangam. AAU-01/02 are the exception: those follow from the definition of the
  Tamil day and the birth instant.
- Not covered: the muhurta engine (138 KB), festivals and Tamil dates (audited 21–23 Oct),
  numerology, and the long-form reading prose.
- Mobile findings are from reading code; nothing was run on a device.
- No fix in this document has been made yet, so no gate has been run with a fix removed.
