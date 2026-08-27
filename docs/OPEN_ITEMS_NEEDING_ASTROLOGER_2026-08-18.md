# What is still open — 2026-08-18

Written after adjudicating the external release-gate review
([response](RELEASE_GATE_REVIEW_RESPONSE_2026-08-18.md)). Everything in that
review that could be closed from the code has been closed. This file is the
remainder: what I could **not** finish, split by what actually unblocks it.

Read §A into an astrologer conversation. §B needs you, not an astrologer. §C is
mine to build and needs nobody. §D is what I decided not to do, and why.

**A note on how to use §A.** Each item says what ships today, what would change
if the answer differs, and the exact ask. Bring the *ask*, not the item — an
astrologer answering "what does your lineage do for X" in the abstract will give
a different answer than one shown our table and asked "is this row right".
Please get **the printed table or page reference** wherever the ask says so; a
verbal "yes that's right" has burned us once already (Nethiram, A-2 below, was
verbally confirmed in July and contradicted by a live case in August).

---

## §A. Needs an astrologer — nothing else unblocks these

### Tier 1 — answering differently changes what a user is told

#### A-1. `GO-10` Kandaka Sani — reference and house set

- **Ships today:** Saturn in the **1st, 4th, 7th or 10th from Lagna**. Labelled
  "Kandaka Sani (from Lagna)" / "கண்டக சனி (லக்னம்)" on every surface.
- **What changes:** whether a reader is told they are *currently under* Kandaka
  Sani at all. Switching the reference from Lagna to Moon changes the entire
  population who see the flag.
- **The ask, in three parts:**
  1. Reference — Lagna, Janma Rasi, or Arudha Lagna?
  2. House set — 1/4/7/10, or 1/4/8/10, or 4/7/10 without the 1st?
  3. **The part the external review missed, and the one I most want answered:**
     many Tamil sources give Kandaka as 4/7/10 *from Janma Rasi*. If that is
     right, it collides by design with cycles we already compute from the Moon —
     the 4th from Janma Rasi is already Ardhashtama Sani, the 8th is already
     Ashtama Sani. So: **is Kandaka Sani a separate axis from the Moon cycle, or
     a layered second name for positions the Moon cycle already covers?** If
     layered, someone in Saturn's 4th from the Moon should arguably see both
     names, and today they see one.
- **Please bring:** book/publisher/page, or a named lineage.
- **Status:** reclassified `[CORE]` → `[VARIANT]`, still live (the reference is
  disclosed in the label, so nobody is misled), pinned by
  `test_kandaka_sani_activates_only_on_the_four_kendras_from_lagna`.

#### A-2. `PAN-11` Nethiram cutoff — a known-wrong value on screen

- **Ships today:** symmetric ring distance `d` from the Sun's nakshatra to the
  day's Moon nakshatra. Nethiram: `d ≤ 2` → blind, `d ≤ 8` → one eye, else two
  eyes. Jeevan: `d ≤ 1` → none, `d = 9` → none, `d ≤ 8` → half, else full.
- **The contradiction:** 2026-08-10 Chennai, Sun in Ayilyam (10), Moon in
  Thiruvathirai (7), so `d = 3`. Table says "one eye". You said **"blind"**.
- **Why I did not patch it:** the same formula was confirmed by the same
  astrologer on 2026-07-16, and one data point does not determine the
  replacement. Two candidate fixes with different consequences: shift the blind
  cutoff to `d ≤ 3`, or abandon the symmetric ring distance entirely for a
  **directional inclusive star count** (which is what every other count in this
  codebase uses — Dinam, tara bala — and which an earlier audit already flagged
  as suspicious by analogy).
- **The ask:** the **printed table**, or the printed rule, not a spot
  confirmation. Also: is the count directional (Sun→Moon) or symmetric?
- **Also owed here:** Doctrine §7 originally asked for two independent printed
  panchangams for Jeevan/Nethiram provenance. Neither is recorded in-repo. This
  is display-only so it blocks no ranking, but it is a wrong value today.

#### A-3. `PAN-05` Tamil month boundary — the rule, not the one date

- **Ships today:** the Sun's rasi ingress (Sankranti) bisected to the exact
  instant, with a sunset-based day-assignment rule — **plus one hardcoded
  override**: `tamil_calendar._MONTH_START_DATE_OVERRIDES` forces Aavani 1, 2026
  to 18 August, where the implemented rule gives 17 August.
- **Why this matters more than one date:** an override means the general rule
  does not match published Chennai practice in every case. There will be other
  such dates, and we will only find them when someone notices.
- **The ask:** what is the **day-assignment rule** the Chennai/Tamil almanac
  actually applies when Sankranti falls near a boundary? Common candidates:
  ingress before sunset → that day; before sunrise → that day; before midnight;
  or the Madras-specific rule if there is one. **This is the highest-value single
  answer in this whole document** — it would let me delete the override and trust
  the rule, and it silently affects every Tamil-month-derived output: monthly
  calendar, festivals, Tamil date display, muhurta month notices.

#### A-4. `DOS-02` Kala Sarpa arc — four sub-questions

Our Rahu/Ketu marriage houses (1/2/7/8) are not in question. The arc test is,
because schools disagree on four points and we silently pick one answer to each.
Ships today: whole-sign, direction-agnostic.

1. Does a planet sitting exactly *on* a node count as inside the arc?
2. Must Lagna fall inside the arc, or only the seven grahas?
3. Does the Rahu→Ketu direction matter, or is the arc read undirected?
4. Is there a conjunction-boundary tolerance, or is it strict whole-sign?

**The ask:** a ruling on each, ideally with the page. Marked `[VARIANT]` until
then.

### Tier 2 — changes a table or threshold

#### A-5. `POR-05` Rasi Porutham exception rows — shipped disabled

- **Ships today:** the directional skeleton only. Same rasi and 7–12 pass, 2–6
  fail. `RASI_EXCEPTIONS_ENABLED = False`.
- **What is missing:** two reported refinements arrived without a quoted passage
  and were deliberately not built — an **even-sign exception at the 2nd
  position**, and **six enumerated pair exceptions at the 6th**. The schema
  exists; nothing fires.
- **The ask:** the verbatim p.68 passage, plus whichever page states the 2nd and
  6th exceptions. Then the sets get filled and the flag flips in one change.
- **Effect if enabled:** couples currently failed on Rasi at the 2nd or 6th would
  pass. This is a *missing pass*, not a spurious fail — the same shape as the
  Vasya defect we already found.

#### A-6. `POR-02` Dinam — is the exception policy deliberate?

- **Ships today:** binary pass/fail on the 12-count set
  `{2,4,6,8,9,11,13,15,18,20,24,26}`, girl→boy.
- **What we may be omitting:** some traditions carry **pada-specific Madhyama
  (partial) exceptions**, notably around the 12th, 14th and 16th counts.
- **The ask:** do those exceptions apply in our lineage? If yes, the table. If
  no, I will state the omission explicitly in the rulebook rather than leave it
  implied — right now a reviewer cannot tell whether we omitted them on purpose.

#### A-7. `POR-03` Sthree Deergham threshold — ≥8 or ≥13?

- **Ships today:** the lenient **≥ 8** (inclusive count, boy's star from girl's).
- **The alternative:** ≥ 13, i.e. half the 27-star circle. Already declared as a
  school choice in the rulebook.
- **The ask:** confirm ≥ 8 is right for Tamil practice as we present it. This
  changes pass/fail for counts 8–12, which is a broad band.

#### A-8. `POR-04` Vasya — Simmam → Thulaam vs the book's Simmam → Makaram

- **Ships today:** Simmam → Thulaam. Jothidam p.69 prints Simmam → **Makaram**,
  which contradicts every standard table (Muhurta Chintamani, Jataka Parijata),
  so we treat the book row as a source/OCR defect and keep Thulaam.
- **The ask:** is that judgement right? This is us overruling a printed page, and
  it should be a ruling rather than my inference.

#### A-9. `PAN-09` Abhijit window — fixed or scaled?

- **Ships today:** fixed **solar noon ± 24 minutes**, excluded on **Wednesday**.
- **The alternative:** scale Abhijit to one fifteenth of the actual daylight
  span, making it wider in summer and narrower in winter.
- **The ask:** which convention, and is Wednesday the only exclusion?

#### A-10. `GO-03` combustion and gandanta thresholds — are our numbers right?

- **Ships today** (degrees from the Sun, direct / retrograde): Mercury 14/12,
  Venus 10/8, Mars 17/17, Jupiter 11/11, Saturn 15/15. Cazimi orb 0.28°. Gandanta
  = six ranges of exactly 3°20′ at the water–fire junctions.
- **Note:** the Moon is deliberately absent — `GO-04` routes Moon-near-Sun through
  Amavasai instead, and a test pins that.
- **The ask:** confirm the orbs against Tamil practice. These are published now
  but never independently checked. Also: does retrogression change the *result* of
  a transit reading or only its intensity?

#### A-11. `MUH-03` Tara Bala — adverse classes and stricter activity rules

- **Ships today:** nine-tara cycle from Janma Nakshatra; adverse are 3 (Vipat),
  5 (Pratyak), 7 (Naidhana). Janma counts as 1, not 0 (pinned).
- **The ask:** confirm the three adverse classes, and whether any activity in our
  catalogue takes a *stricter* set than these three.

### Tier 3 — marker and provenance only, no behaviour change

These do not change a single output. They change whether we are allowed to call
a rule `[TRADITION]` rather than `[VARIANT]`. Lower priority, but they are the
last rules claiming more certainty than we hold.

- **A-12. `PAN-07` Gowri.** Both 7×8 tables are now published, but no printed
  source is named in-repo. **Ask:** which panchangam, which page.
- **A-13. `STR-01` node friendship asymmetries.** Two oddities in the live 9×9
  grid: Ketu holds Rahu an enemy while Rahu does not list Ketu at all; Ketu holds
  Mars a friend while Mars holds Ketu neutral. **Ask:** intended, or transcription
  drift? (Moon–Mercury's asymmetry *is* intended and classical — not asking about
  that one.)
- **A-14. `STR-03` Moon–nodes enmity.** Moon holds both nodes as enemies in our
  Tamil overlay; strict Parashari gives Moon no enemies. **Ask:** confirm the
  overlay.
- **A-15. `STR-08` Saturn's BAV table proxied for Rahu and Ketu.** When a transit
  is scored for bindu support we substitute Saturn's table for both nodes, and the
  code calls this common Thirukanitham practice — **that attribution is unsourced
  in-repo.** **Ask:** is the Saturn proxy your practice, is another graha used, or
  should nodes simply be omitted from bindu-based transit scoring?
- **A-16. `STR-05` karaka-relative indications.** Four rules count from a karaka
  graha's own rasi: 5th from Guru (progeny), 3rd from Sevvai (siblings), 4th from
  Budhan (maternal), 9th from Suriyan (paternal). **Ask:** is the karaka/bhava
  pairing right, and does your lineage count these **from the karaka or from
  Lagna**?
- **A-17. `GO-11` Murthi within Ezharai Sani.** The Moorti table itself is
  standard and widely documented. Using it *specifically inside Ezharai Sani
  interpretation* is the lineage choice. **Ask:** confirm.
- **A-18. `POR-03` Mahendra count direction.** We count girl-from-boy; the
  reference spec counts boy-from-girl. Outcomes are identical *only* because
  `{4,7,10,13,16,19,22,25}` happens to be closed under `c → 29−c`. **Ask:** which
  direction is correct, so a future edit to the set cannot silently break it.

---

## §B. Needs you, not an astrologer

#### B-1. Swiss Ephemeris licensing — stop-ship

`ephemeris.py` uses `SEFLG_SWIEPH`, the real Astrodienst engine. Dependencies are
`pyswisseph` / `swisseph-ffi`. **There is no LICENSE file at repo root.** It is
AGPL-3.0 or a paid professional licence, every chart in the product runs through
it, and the mobile build *distributes* rather than serves — a different AGPL
trigger than the web service. Gated in
[GO_LIVE_CHECKLIST.md](launch/GO_LIVE_CHECKLIST.md) §3a. Commercial decision with
an authority requirement; I flagged it and cannot make it.

#### B-2. Which external reference for the golden matrices?

The review demanded 100 charts compared against an independent reference, and a
7-weekday × 12-month × multi-location panchangam matrix. **I deliberately did not
build either**, because both need something to compare *against*. Generating
expected values from our own engine would be a tautology that reads as
verification, which is worse than having no test.

**Decide and I build it:** JHora output? Drik Panchang? A named printed almanac
for named cities? And which cities — the review suggested Chennai, Coimbatore,
Delhi, London, Singapore, and the non-Indian ones matter most because that is
where our sunrise and timezone handling is least exercised.

This is the largest genuine verification gap left in the product.

#### B-3. 2027 gazetted festival dates

Not an astrology question — it is the Tamil Nadu government holiday gazette.
Algorithmic festivals (Ekadashi, Pradosham, Sankatahara Chaturthi, Amavasai,
Pournami, Karthigai, Sashti, solar-day festivals) already work for any year.
Only the gazetted rows stop at 2026, which is now disclosed and bounded rather
than silent.

---

## §C. Mine to build — needs nobody, not done yet

Listing these so they are not mistaken for blocked work.

- **C-1. `MUH-08` source-id invariant.** The review's single best engineering
  suggestion: *no activity rule may go live without a valid `source_id`.* Right
  now provenance is enforced per-module (the samskara suite loops over its
  `RULE_SOURCES`) but there is **no global assertion across all seven
  Kalaprakasika rule modules**. I can add one.
- **C-2. `YOG-01` split into per-yoga rule IDs — DONE 2026-08-27.** One ID
  covered Raja Yoga, Dhana Yoga, Pancha Mahapurusha, Gaja Kesari, Budha Aditya
  and Vipareeta Raja Yoga, so a reviewer could not tell whether each was a
  legitimate classical definition or a loose modern one. `YOG-01` is now retired
  to a signpost and **32 per-yoga rules** carry their own presence test, strength
  ladder, cancellation set, marker and source, generated from
  `app/calculations/yoga_rules.py` into the table appendix and pinned to the
  emitted codes by `tests/test_yoga_rules.py`. Raja Yoga became three rows
  (association, exchange, and a `[LIMIT]` row naming what we do not implement);
  Pancha Mahapurusha became five. **The verdicts are still owed** — the split is
  what unblocks the marking pass, not a substitute for it — and writing the rows
  out exposed a live defect: nine yogas were capped at the dormant activation
  rung because the activation table was keyed on names no detector emits.
- **C-3. `DIV-01`/`DIV-02` varga boundary tests.** The divisional *names* are
  legitimate; the *mapping algorithms* are unverified by test. Navamsa in
  particular needs exact-boundary cases (0°00′, 3°20′, 6°40′, … 29°59′59″) for
  floating-point behaviour.
- **C-4. `STR-04` BAV bindu contribution golden fixtures.** The seven-planet
  Bhinnashtakavarga tables have no golden test.
- **C-5. `DAS-06`/`DAS-08` secondary dasha certification.** Ashtottari, Yogini,
  Kalachakra eligibility rules and the Jaimini 8-karaka reverse-Rahu scheme each
  need their own verification. Currently `[LIMIT]`, so they cannot override
  Vimshottari — which is the right guard, but it is not certification.

---

## §D. Decided not to do, and why

- **Did not disable `GO-10`**, against the review's recommendation. Every surface
  already labels it "(from Lagna)" in both languages, which *is* the `[VARIANT]`
  disclosure standard. Removing a correctly-labelled live cycle deletes
  information rather than correcting it.
- **Did not patch the Nethiram cutoff** off one data point. See A-2.
- **Did not hand-copy tables into the rulebook.** The appendix is generated from
  the live constants and sync-tested, because a hand-copied table drifts from the
  code the day after it is written and then launders a stale table as verified.
- **Did not enable the Rasi exception rows** on a plausible-sounding
  reconstruction. See A-5.
- **Did not build the golden matrices** against our own engine's output. See B-2.

---

## The short version to take to the astrologer

If there is time for only a few questions, ask these five — they are the ones
that change outputs rather than markers:

1. **Tamil month boundary rule** — what day-assignment rule does the Chennai
   almanac apply when Sankranti falls near a boundary? (A-3; would let me delete
   a hardcoded override and fixes a whole class of dates)
2. **Nethiram** — the printed table or rule, and is the count directional or
   symmetric? (A-2; a wrong value is on screen today)
3. **Kandaka Sani** — reference, house set, and is it a separate axis from the
   Moon cycle or a layered name? (A-1)
4. **Rasi Porutham** — the verbatim passage for the 2nd-position even-sign and
   the six 6th-position pair exceptions. (A-5; couples are being failed today
   who may deserve a pass)
5. **Sthree Deergham** — ≥8 or ≥13? (A-7; changes pass/fail across a five-count
   band)

And please bring **pages, not confirmations**, for anything in Tier 1 or 2.
