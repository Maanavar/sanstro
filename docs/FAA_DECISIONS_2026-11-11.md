# FAA decisions — rulings, gender policy and source findings (2026-11-11)

Companion to `docs/FULL_ASTRO_ACCURACY_AUDIT_2026-11-10.md` (rev. 2.2). This is the decision
document the audit asks for in §8.8: one entry per Group B/C item with the question, what the
engine did, the readings found, the ruling (or that it is still open), and where it is built.

Rulings below were given by the owner on 2026-11-11 in this session, each by choosing the
recommended option. They are owner rulings, not astrologer sign-off. Nothing here makes Vinaadi
"astrologically audited" (audit §11).

---

## 1. Rulings given and built

| Item | Question | Ruling (owner, 2026-11-11) | Built in |
|---|---|---|---|
| FAA-24 | Eclipse under way but not visible at the birthplace | Still Grahana Janma, with the −10 luminary penalty; the copy says it was not visible there | `ephemeris.eclipse_at_birth`, `birth_conditions._grahana_flag` |
| FAA-24 | Penumbral-only lunar eclipse | Not Grahana Janma (almanacs do not observe it) | `ephemeris.eclipse_at_birth` |
| FAA-39 | Anusham adhi-devata | Mitra (மித்திரன்), with a note that Tamil devotion on this star is to Mahalakshmi | `web/lib/natchathiram-data.ts` |
| FAA-39 | தசை vs திசை on the nakshatra pages | Keep திசை on those pages (everyday voice); the glossary's தசை is not forced there | no change |
| FAA-06 | Janma tara polarity | Caution on both surfaces: picker +8 → −8; Today keeps −20 | `tara_bala.TARA_SCORE`, `muhurta_engine._tara_bala_factor`, `muhurtham_naal_service.TARA_MEANING` |
| FAA-07 | Ashubha nitya yoga and Vishti in the picker | Generic −10 each, weighted by share of the day, from the one `ASHUBHA_YOGAS` table; Vishti stands down where the chapter rules on karanas | `muhurta_engine._almanac_yoga_factor`, `_almanac_vishti_factor` |
| FAA-15 | Amavasai | By activity: pitru karma favourable; new auspicious work avoid; daily score neutral. Badge reads "avoided for new auspicious work; a right day for pitru tarpanam", not "Inauspicious" | `panchangam.AMAVASAI_BY_ACTIVITY` (read by badge, `_dg_scoring`, picker) |
| FAA-16 | Spouse karaka | By **stated** gender (policy §2). Bride: Guru primary + Venus. Groom: Venus primary + Guru. Unknown: both equally, and the reading says so | `marriage_service._spouse_karakas`, gate and score |
| FAA-12 | Venus–Venus harmony table | Grade it on the §10 Moon table (2/12 = MIXED) | `compatibility_intelligence._compute_emotional_compatibility` |
| FAA-19 | 7th lord in the 2nd / 3rd | 2nd: 0, with a maraka note only when the lord is debilitated. 3rd: −3. (6/8/12 keep −8.) | `marriage_service._score_marriage_prediction` |
| FAA-26 | Chaturdashi touching no night's nishita | Pradosha fallback: the day Chaturdashi holds sunset, flagged (`sivarathiri_pradosha_fallback`) for the almanac cross-check | `festivals._recurring_tithi_festivals` |
| Porutham source | Which text governs porutham | **Kalaprakasika** (N. P. Subramonia Iyer), whole tables, its own exceptions kept; no Ashtakoota rules, no splicing from calculators. Authority order: Kalaprakasika > other named Tamil texts > printed Tamil panchangams > documented astrologers > websites | `porutham.py` |
| FAA-03 | Vasya, Simmam row | Keep Thulaam (Kalaprakasika p.75) | no change |
| Rasi (A-5) | 2nd / 6th / 8th position | 2nd: even-sign exception (KP p.74). 6th: only KP's six named pairs. Jothidam p.68's 6th-house even-sign Madhyama **not adopted** (backlog). **8th: favourable** — KP p.73-74 reads every bride→groom count 8–12 as the favourable converse of 6–2 ("the converse favours birth of sons"). The reviewer's "retain 8th unfavourable" assumed the engine failed it; the governing text passes it, so it stays a pass, with the existing Shashtashtaka disclosure note | `porutham._rasi_score` (unchanged) |
| FAA-34 Gana | Madhyama for Gana | KP p.72: same = Uttama; Deva+Manushya = Madhyama (book names groom Deva/bride Manushya; reverse ruled the same); Rakshasa mix = Adhama, **lifted to Madhyama** when the bride's star is beyond the 14th from the groom's ("will diminish") | `porutham._ganam_band` |
| FAA-34 Yoni | Madhyama for Yoni; table | KP p.73 table adopted whole: Uthiradam = Cow; hostile = Monkey–Sheep, Deer–Elephant, Horse–Buffalo, Cow–Tiger, Rat–Cat, Serpent–Rat, Serpent–Mongoose, Dog–Deer (Elephant–Lion removed). Same = Uttama; "neutral" = **Madhyama label at full point**; hostile = Adhama | `porutham._yoni_band`, web `PoruthamTool` mirror |
| FAA-35 | Eka-nakshatra | KP p.71 three classes recorded: excellent (Rohini, Thiruvathirai, Magam, Hastham, Visakam, Thiruvonam, Uthirattathi, Revathi), neutral (11), unsuitable (Bharani, Ayilyam, Swathi, Kettai, Moolam, Avittam, Sathayam, Poorattathi). Disclosure only; Rajju never altered. The book's pada-order sentences contradict each other as transcribed; held | `porutham.EKA_NAKSHATRA_CLASS` |
| FAA-38 / FAA-25 | Tyajya; Kala Sarpa grading | Tyajya stays provisional, not built, until a printed Thirukanitham panchangam is compared; Kala Sarpa type shown, never graded | no change |

**Measured effects** (recorded beside each change in code):

- FAA-09 (Group A, removing the duplicate Jupiter-from-Moon term): transit component
  p5/p50/p95 34.0/46.1/57.9 → 37.7/45.7/55.2 over 35,136 synthetic cases; the day score's transit
  part moves −1…+2 points.
- FAA-10 (one star credit) then FAA-07 (yoga/Vishti), 9 activities × 365 days, Chennai, general
  mode: display p50/p95 74.0/89.4 → 73.0/85.6 → 68.0/84.8; BEST share 48.1% → 44.5% → 38.4%;
  GOOD share 27.7% → 31.2% → 31.2%.

---

## 2. Gender-input policy (FAA-16 prerequisite, audit §8.7)

1. **Source.** Gender comes only from the explicit `gender_for_traditional_rules` field on the
   birth profile or family member. Values `female` and `male` are "stated". Every other value
   (`not_specified`, empty, anything else) is "unknown".
2. **Never inferred.** Not from a name, a relationship label (wife, son, daughter-in-law), a
   pronoun, a photo or any other field. A test pins that `gender=None` and `"other"` take the
   unknown path.
3. **Unknown and non-binary.** Both spouse karakas are read at equal weight (0.75 each, so the
   total matches the stated case's 1.0 + 0.5). This is a Vinaadi product policy, not a
   traditional rule, and the reading says which gender-specific readings it did not apply: spouse
   karaka, mangalya sthana, Guru's transit for a bride.
4. **Where gender is used today.** Sevvai markers, Jupiter gochara, the marriage gate and
   score, prasna's marriage karaka (the querent's OWN profile via `find_owner_birth_profile`,
   never a family member's), and the two-chart CI marriage strength (each chart's own field;
   the porutham direction inferred from the partner is not read as a stated gender).
   CI weights the two karaka bands by the same table and takes the weighted mean, so the
   layer stays 1–3 points. Prasna counts the verdict from the primary alone and lists the
   secondary as "noted, not counted".
5. **Copy (owner ruling 2026-11-11).** Role words are neutral: the primary karaka for the
   stated gender is the "primary spouse significator" (முதன்மை வாழ்க்கைத் துணை காரகன்), the
   other the "secondary spouse significator" (இரண்டாம் நிலை வாழ்க்கைத் துணை காரகன்). Never
   "husband" / "wife". With gender unknown, both are "marriage significator".

---

## 3. Group C — source search (owner: search the web, report, do not adopt)

Web sources are secondary and conflict; none is a printed page. Nothing below has been adopted.

| Item | What the engine does | What the search found | Recommendation |
|---|---|---|---|
| FAA-03 Vasya, Simha row | Simha → **Thula** | Printed and in the repo: **Kalaprakasika p. 75 gives Thulaam** and matches our table on 11 of 12 rows (`docs/SOURCE_PHOTOCOPY_REQUEST_2026-08-27.md`, A-8); Muhurta Chintamani / Jataka Parijata agree. Web: ePanchang and Prokerala give Thula; some Tamil blogs (aruniyengar, astrologyatoz) give Makaram, as Jothidam p. 69 is *reported* to (transcription only, page never seen). | Keep Thulaam: two printed/standard sources against one unseen transcription. A photo of Jothidam p. 69 (book title still unknown) would close it. |
| FAA-28 Dinam counts | {2,4,6,8,9,11,13,15,18,20,24,26} | Most sources give exactly this 12-count list; Prokerala/AIFAS omit 6. Some grade 12/14/16 Madhyama by pada. | Engine matches the majority list; keep. Madhyama by pada is FAA-34 territory. |
| FAA-38 Tyajya (varjyam) | Not built | Drik/Astrovachmi tables agree on several rows (Ashwini 51–54, Bharani 25–28, Pushya 21–24, Revathi 31–34) but disagree on the window length (3 vs 4 ghatis) and some rows are unreadable; no transcription of Muhurta Chintamani's verse found. One source says Kalaprakasika does not treat it as inauspicious. | Do not build from web tables. Needs the printed Muhurta Chintamani page and a ruling on whether Kalaprakasika-led activities read it at all. |
| FAA-25 Kala Sarpa grading | Every type reported at one level; page promise removed | No source with the twelve types' effects found worth citing | Keep ungraded until a cited source. |
| FAA-34/35/36/37 | Madhyama tiers, eka-nakshatra padas, pada-level Rajju, papa samyam weights | Not searched in depth: these need Jothidam pp.68–69 and the astrologer | Pages needed: Jothidam p.68 (Madhyama tiers), the eka-nakshatra pada table, any pada-Rajju table, a papa-samyam weighting table. |

Sources: [aruniyengar.blogspot.com — Jathaka Porutham](http://aruniyengar.blogspot.com/2012/08/jathaka-porutham.html),
[ePanchang — Vasiya Porutham](https://www.epanchang.com/Vasiya-Porutham),
[Prokerala — Vasya Porutham](https://www.prokerala.com/astrology/porutham/vasya-porutham.htm),
[Oneindia Tamil — Vasya Porutham](https://tamil.oneindia.com/porutham/vasya-porutham-tamil.html),
[Prokerala — Dina Porutham](https://www.prokerala.com/astrology/porutham/dina-porutham.htm),
[AIFAS — 10 Porutham](https://www.aifas.com/article/en/10-poruthamp-for-a-blessed-married-life-10836),
[Drik Panchang — Nakshatra Thyajyam](https://www.drikpanchang.com/tutorials/panchang-utilities/nakshatra-thyajyam.html),
[Astrovachmi — Nakshatra Thyajyam](https://www.astrovachmi.com/nakshatra-thyajyam).

---

## 4. Still open

### Resolved 2026-11-11 (owner)

- **Vasya, Rishabam row:** whole table checked against the p.75 scan (11 of 12 rows already
  matched); Rishabam → Kadagam, **Simmam** adopted. Directional relation kept as printed.
- **Kalaprakasika p.76 general exception:** built as a **separate evaluation**
  (`porutham.classical_exception_assessment`, wire field `classicalException`), never an
  override. It appears only when Rajju, Vedhai, Ganam or Rasi failed; it names which, lists the
  conditions met, cites the source, and says whether the exception applies. The score, label and
  Rajju/Vedha veto never change. Conditions are read as alternatives, because "same lord" and
  "opposite rasis" can never both hold; `pendingVerification` stays true until the Sanskrit
  is checked. "Friendly" is read mutually on the **Parashari** table that Rasiyathipathi and the
  Nadi parihara use (changed later the same day; see below). Tamil wording is the
  owner-supplied text. Shown on the dashboard porutham tool, the synastry panel, the public
  calculator and the mobile porutham tool; not yet on shares or PDFs.

### Nadi — RULED 2026-11-11 (owner): a secondary note

Nadi is a North Indian (Ashtakoota) check, not one of the Tamil ten poruthams; Vinaadi's customers
are Tamil families. The engine still computes it (`check_nadi_dosha`, its native-reviewed text
unchanged), but nothing treats it as a finding:

- **No number moves.** The composite's −3 Nadi deduction in the dosham layer is removed
  (`compatibility_intelligence.py`), and Nadi no longer counts as an "astrological caution" that
  blocks a positive numerology adjustment (`numerology_compatibility_service.has_astrological_caution`).
  So for a couple with a shared Nadi, the composite score can rise by up to 3, and numerology may now
  nudge it upward.
- **No badge or ⚠.** Removed from the badge row beside Rajju/Vedhai on the compatibility panel and
  the share page, and from the public calculator's grid (muted "Nadi note" word instead of ⚠ and an
  accent border). The PDF's "Warning: Nadi dosha present" line is gone.
- **One secondary note**, `NadiSecondaryNote` (web/components/shashtashtaka-note.tsx), and the
  matching PDF caption, shown after the Tamil findings: a lead-in saying Nadi is not one of the
  Tamil ten and changes nothing, then the server's reviewed note. Lead-in wording is Claude's draft
  (en + ta), not native-reviewed.
- **Marketing copy** that listed Nadi as one of the ten (methodology page, tool page list,
  calculator FAQ, which dropped Vasya or Vedhai to make room) or ranked it with Rajju as a
  "critical dosha" is corrected. Gate: `web/lib/marketing-copy-parity.test.ts`, two rules,
  verified to fail on the HEAD copy.
- Not changed: the reviewed Nadi note itself still opens "children's health needs extra caution",
  which a native reviewer approved on 2026-07-15. Softening it is a separate review item.

### Rules that differ from Kalaprakasika — RULED 2026-11-11: follow Tamil Nadu practice

Found 2026-11-11, scan-verified. **Ruled the same day** at the owner's request ("decide what is
followed in Tamil Nadu and Tamil families"). The ruling was made by Claude (AI) acting for Tamil
practice, **not by a practitioner**; the astrologer review of the whole app should confirm it.
It is a lineage choice, not a claim that the book is wrong. Recorded in code as
`porutham.PORUTHAM_RULED_DEPARTURES`, with both readings named;
`PORUTHAM_SOURCE_CONFLICTS` is now empty.

| Rule | Kept (Tamil Nadu practice) | Kalaprakasika (recorded, not adopted) | Why |
|---|---|---|---|
| Dinam (FAA-28) | 12-count list {2,4,6,8,9,11,13,15,18,20,24,26} | p.69: tara cycle. 2/4/6/8 good, 3/5/7 bad; second round avoids only one pada each of the 12th/14th/16th; third round "no evil" except the 22nd and 27th. Would also pass 10, 17, 19, 21, 23, 25 | This is the list Tamil panchangam porutham tables print and family jothidars count by; the 11-11 web search found the same majority list. The book's reading is more lenient and would also need a pada input nobody prints |
| Rasiyathipathi | Parashari natural friendship; fails if either lord counts the other an enemy | p.74-75: its own table (Mars: Mercury, Venus; Sun: Jupiter only; Moon: Mercury, Jupiter; Saturn: Jupiter enemy). Flips 10 of the 21 lord pairs | Tamil panchangams print the Parashari நட்பு / சமம் / பகை table for this porutham |

**Follow-on fix (no score change):** the p.76 exception's "friendly lords" condition was built on
the book's table, so it could call two lords friendly while the Rasiyathipathi row beside it failed
them as enemies (28 of the 144 sign pairs, e.g. Kataka × Mithuna). It now reads friendship mutually
on the same Parashari table (`_rasi_lords_mutually_friendly`, also used by the Nadi parihara).
Gate: `test_faa_group_a.py::test_exception_friendship_never_contradicts_rasiyathipathi`. Run with the
fix removed, it reports those 28 pairs. Blind spot: it proves the note agrees with the row, not
that Parashari is the table a given family's jothidar uses. That part is the ruling, not the gate.

- ~~FAA-03 Vasya~~ — **ruled 2026-11-11: keep Thulaam** (Kalaprakasika p.75 + standard tables;
  the Makaram reading is unverified).
- ~~FAA-08~~ — **ruled 2026-11-11: keep as is.** Equal 60-minute horai for the panchangam
  (EC-RULING-03), classical unequal hora for Shadbala; they serve different purposes.
- ~~FAA-16 remainder~~ — built 2026-11-11 (§2 item 4).
- **FAA-26** — still unverified against print. Scan 2026-11-11 (Chennai/Madurai/Delhi agree):
  - **2037-06-11**: Krishna Chaturdashi 12 Jun 00:05 → 23:38 IST. Only the 11 Jun night's
    nishita (23:46–00:30) touches it. vedicmarga lists Masik Shivaratri 11 Jun (computed, not
    print). The engine's date matches.
  - **2045 (two touching nights) — RULED by the owner 2026-11-11: a partial first night
    yields to a whole second night.** Both nights whole, or the first whole, still take the
    first. Chaturdashi runs 15 Feb 00:20 → 16 Feb 02:56. The 14 Feb nishita (23:58–00:47) is
    touched for only ~27 min; the 15 Feb nishita is covered whole → **15 Feb**. Dharmasindhu (as
    reported on advaita-l, 2018): Hemadri took the first night; most nibandhakaras take the
    second when the first is partial. Built in `festivals._recurring_tithi_festivals` with
    `ObservanceInstants.{previous_,next_,}nishita_k_chaturdashi_full`; the switch is
    `sivarathiri_partial_night_yields`.
  - **26-year scan (Chennai, 2020–2045), old rule → new rule:** 321 dates both ways. Exactly three
    move: 2022-04-28 → 04-29, 2037-03-14 → 03-15, 2045-02-14 → 02-15. The 2027 almanac still
    matches **13/13**. **2022-04-29 is verified**: Drik Panchang's New Delhi page lists Masik
    Shivaratri on Fri 29 Apr 2022 (nishita 23:57–00:40, Chaturdashi 29 Apr 00:26 → 30 Apr
    00:57). That is the same shape as 2045, and the past case that supports the ruling.
    2037-03-15 and 2045-02-15 are still unverified against print.
- ~~`_dg_hora` first-12-hours~~ — fixed 2026-11-11: `_day_horas` = horas starting before sunset,
  clipped at sunset. The daily-guidance golden was regenerated. The only changes are extra
  windows after hour 12 on long days (May, and London in August), plus one conflict re-ranked.
- **Group D** — specs drafted: `docs/GROUP_D_SPECS_2026-11-11.md` (11 open questions).
- **§9 (FAA-44…48) and §13 (FAA-49…59)** — the prediction-quality audit and the supplementary
  rule investigation; not started.
