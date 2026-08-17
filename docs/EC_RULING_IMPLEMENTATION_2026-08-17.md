# EC-RULING implementation — the 8 adjudicated items

**Date:** 2026-08-17
**Ruling:** `EC-RULING-DOCTRINE-2026-08-17.md` (final; supersedes prior informal review threads)
**Audit that raised them:** [DOCTRINE_CODE_AUDIT_JOTHIDAM_V2_2026-08-17.md](DOCTRINE_CODE_AUDIT_JOTHIDAM_V2_2026-08-17.md)

Worked in the ruling's own priority order: #6 first (P0), then the ADOPTs, then
the two HOLDs. Nothing is committed.

| # | Item | Ruling | State |
|---|---|---|---|
| 6 | Widowhood string | ADOPT (P0) | **Done** — and a second, unreported breach found |
| 3 | Hora | ADOPT | **Done** — equal 60-min from sunrise; cache version bumped |
| 4 | Rajju | ADOPT after a check | **Done** — exemption removed; the check came back *not extractable*, so a flagged gap |
| 5 | Sade Sati | ADOPT (A26→A25→A27) | **Done** — flat −4 replaced, gates live, insight derived |
| 8 | Marana | ADOPT-MODIFIED | **Done** — penalty default retained; blocking question answered below |
| 1 | Rasi Porutham | ADOPT-MODIFIED | **Done** — directional skeleton; exceptions ship disabled |
| 7 | Kuligai | ADOPT | **Done** — mechanism live, activity table empty pending p.152 |
| 2 | Chitra Vedha | HOLD → **released** | **Done** — p.70 supplied; the triad is real, `{5,14}`/`{14,23}` added |

---

## EC-RULING-08 — the blocking question, answered

The ruling would not finalise the severity tier until it was established *which*
Marana is coded, and flagged that ~19% did not match "7 fixed weekday–nakshatra
combinations". Both halves resolve:

**Which Marana.** The **vara × nakshatra** classification — a full 7 × 27 = 189-cell
grid (`panchangam.AMIRDHADHI_YOGAM_TABLE`), sourced from the *Ungal Vazhkkai
Vazhikatti* almanac and cross-checked against the publisher's own article and the
classical Dagdha set. It is **not** one of the 27 nitya yogas (those are
Vishkambha…Vaidhriti, live in `YOGA_NAMES`, and are handled by
`_almanac_yoga_factor`, which deliberately scores zero on them), and there is no
muhurta-specific Marana kalam anywhere in the codebase.

**The incidence.** Measured over the grid:

```
A (Amirtha)        30 cells
C (Siddha)        115 cells
M (Marana)         37 cells
P (Prabalarishta)   7 cells   <- exactly one per weekday
                  ---
adverse (M+P)      44 / 189 = 23.3% of all weekday-star pairs
```

So 19% in a 90-day window is a sample of a 23.3% population, not a mismatch. The
"7" almost certainly refers to **Prabalarishta**, the fourth class, which has
exactly one cell per weekday. Worth noting the source text's own printed Marana
list is **22** combinations across the seven weekdays, so "7 fixed combinations"
matches neither the engine nor the book.

Severity therefore stays at the penalty tier per the corrected burden of proof.
Promotion to L0 remains a one-constant change if a passage with explicit
reject/no-remedy language and no exception clause turns up.

---

## EC-RULING-06 — widowhood string (P0)

**A second live breach was found while implementing the first.**

`web/lib/marketing-i18n/tool-porutham.ts` carried
`"Rajju porutham — the critical dosha check (widow/widower risk)"` on the
**public marketing page** — a more exposed surface than the calculator result,
in the i18n layer that no Python check touches. This is precisely the gap the
ruling predicted when it asked for coverage over "every output template and every
i18n string, not just runtime-generated text".

Applied, per *excise, don't reword*:

* `porutham.py` — the Rajju summary now states the objection's weight without
  naming an outcome, in both languages. The finding is unchanged: Rajju still
  fails, still forces `CAUTION`.
* `porutham.RAJJU_REASON_CODE` / `RAJJU_SOURCE_TEXT_CATEGORY` carry the doctrine
  internally for traceability, and a test asserts neither ever renders.
* `tool-porutham.ts` — parenthetical excised.
* `narrative_engine` — the single flat banned list is split into
  `_BANNED_TONE_PHRASES` and `_BANNED_MORTALITY_PHRASES`, with a new
  `mortality_validator`. The two classes are deliberately separable **because
  they call for different responses**: a tone hit gets rewritten, a mortality hit
  gets deleted. The mortality set covers inflections, the Sanskrit term, the
  direct Tamil words, and the euphemism (`மாங்கல்ய பங்கம்`) that a well-meaning
  rewrite would reach for.
* `tests/test_mortality_class_sweep.py` — a **static** sweep over every string
  literal in `app/`, `web/`, `mobile/` and `packages/`, with a per-file allowlist
  that states a reason. Only two kinds are admissible: `widowed` as a
  self-selected marital status, and preserved source text inside a provenance
  record. A new file appearing fails the build.

Two implementation notes worth keeping:

* The obvious TS string-literal regex — ``(['"`])((?:\\.|(?!\1).)*)\1`` with
  `DOTALL` — **backtracks catastrophically** on real `.tsx` files, because a
  prose apostrophe opens a quote that never closes and the engine rescans to EOF
  from every position. It took the sweep past five minutes. Replaced with a
  linear state machine (~10s for the whole repo).
* `Path.glob("web/**/*.ts")` descends into `node_modules` before any filter can
  skip it. Pruning has to happen *during* the walk (`os.walk` + in-place
  `dirnames[:]`), not after.

---

## EC-RULING-03 — Hora

`_make_hora_entries` now produces 24 equal 60-minute horas anchored at true local
sunrise. The lord sequence and its stepping are unchanged, so the cycle is
identical; only the boundaries move.

**`PANCHANGAM_CACHE_DATA_VERSION` bumped 41 → 42.** Hora entries are serialised
into the panchangam cache, and the muhurta picker reads those boundaries to
choose the clock time it recommends — without the bump the correction would have
been invisible on every date already warmed into the cache.

Regression tests parametrise over Chennai at both solstices and equinoxes plus
Toronto in midwinter (~9h daylight, where the old method produced ~45-minute day
horas), and assert three properties: every hora is exactly one hour; horas start
at real sunrise and run contiguously; and the **6-1-8-3 mnemonic holds** — the
sunrise lord recurs every 7 horas, exactly 7 clock hours later. That last one is
the property the unequal method could not satisfy and is the reason the ruling
went the way it did.

---

## EC-RULING-04 — Rajju

Eka-nakshatra exemption removed. It was self-defeating: the same star is
necessarily the same Rajju group, so the exemption waived the veto in the single
most concentrated case the rule describes. Its provenance was a category error —
*eka nakshatra – bhinna pada* is a **Nadi** exception, which this repo already
implements correctly and which a new test pins so the removal did not take it
along.

**The pre-check the ruling required came back negative, and is recorded as a gap
rather than assumed either way.** No matching or porutham chapter has been
extracted into this repo at all: every `kalaprakasika_*` module is a *muhurta*
chapter, and the porutham tables come from the Formula Engine Specification, not
a primary text. So the separate general Rajju/Vedha/Gana/Rasi mitigation passage
can be neither confirmed nor ruled out from inside this codebase. Per the ruling
it is left unencoded and flagged: if it surfaces, it is a different rule and must
arrive on its own citation, not as a restoration of this exemption.

---

## EC-RULING-05 — Sade Sati

New module `app/calculations/sade_sati.py`, implemented A26 → A25 → A27.

**A26 — segmentation.** The ninety months are graded 16 DIFFICULT / 35
FAVOURABLE / 4 ACUTE / remainder MIXED, with the acute window placed where the
source puts it — closing Janma Sani (months 57–60), not opening the cycle. The
phase offset uses the table's own 30-month arithmetic; the position *within* a
phase comes from the real Saturn-ingress instant, so a native three months into
Janma Sani is not scored like one three months from its end.

**A25 — gates.** Natal Saturn dignity (exalted Thula, own Makara/Kumbha) and
placement in 3/6/10/11 from Lagna. The Ashtakavarga bindu gate (>30 in the
transited sign) is included, which the ruling permits only because SAV is already
computed for the same request. `None` bindus means *not evaluated* and never
counts against the native.

**A27 — the 5th house.** `houses_touched_during_cycle()` derives the answer
rather than tabulating it: Saturn in the 12th/1st/2nd aspects 2-6-9 / 3-7-10 /
4-8-11, union = every house **except the 5th**. Shipped as bilingual Insight-tier
text that names the mechanism, with a regression test asserting the structural
impossibility — so if anyone ever changes Saturn's special aspects, the
reassurance stops shipping, which is correct.

**Scoring.** `prediction_score` replaces the flat `l5 -= 4` with a segmented,
gated penalty. The unsegmented value is **exactly 4**, so any caller not yet
passing the new fields scores identically to before — adding this was not also a
silent re-scoring of every surface. `life_areas_service` passes them, reusing the
Saturn-ingress search it already performs once per request for the murthi grade.

**Standing rule.** Sade Sati never becomes a porutham/marriage veto at any tier.
Asserted structurally as an import boundary in `tests/test_sade_sati.py`, because
a prose rule in a doc cannot fail a build.

---

## EC-RULING-01 — Rasi Porutham

`_rasi_score` is now the asymmetric bride→groom inclusive count: 1 routes to
same-rasi handling, 2–6 adverse, 7–12 favourable (8–12 as the converse of the
corresponding reverse-direction case). The old symmetric Bhakoot 6/8 check is
gone.

Net behavioural change: 2nd/3rd/4th/5th from the bride now fail where they
passed; 8th now passes where it failed. A test asserts the **directionality**
itself — Mesha bride with Kanni groom fails, swap them and it passes — because
that is what makes this a different rule rather than a variant of the old one.

The exception clauses ship **disabled** (`RASI_EXCEPTIONS_ENABLED = False`) with
the schema in place, pending verbatim p.68.

One knock-on: `test_moon_harmony_never_grades_above_tense_when_porutham_rasi_fails`
asserted that every pair failing Rasi porutham also graded TENSE in Moon harmony.
That held only while both were the symmetric 6/8 rule. Moon harmony is —
correctly — still symmetric, since emotional resonance between two Moons has no
bride/groom direction. The invariant was **narrowed to the shared positions**
(6th/8th apart must read TENSE in both) rather than deleted, with a companion
test asserting the divergence is deliberate.

---

## EC-RULING-07 — Kuligai

`app/data/kuligai_polarity.py` ships the mechanism with **empty** tables.
`polarity_for()` returns `UNSPECIFIED` for everything, and `UNSPECIFIED` does not
reject — which is the one part of the ruling actionable without p.152, because
the blanket exclusion *is* the defect. `UNSPECIFIED` is deliberately distinct
from `NEUTRALISED`: "the text settles this as neutral" and "we have no reading"
must never render alike.

`muhurta_service` now names a Kuligai overlap without implying a verdict the
source does not support. A test drives the classifying branches through a
temporary table so this is a wired mechanism, not scaffolding waiting on data.

---

## EC-RULING-02 — Chitra Vedha (HELD → RELEASED same day)

The hold's release condition was the **full** printed table, "not just the Chitra
line, since the surrounding rows are what disambiguate which structure the source
is using". Jothidam p.70 supplies it, and disambiguates three ways over:

* **Twelve of thirteen shipped rows are verbatim identical to p.70.** The
  thirteenth, `{5,23}`, is p.70's closing line — *"Mrigashirsha, Chitra and
  Dhanishta are mutually Vedha with one another"* — flattened to one edge with
  Chitra dropped. One source, one row lost; not a cross-tradition variance.
* **27 is odd.** A table of clean pairs cannot cover it, so "13 pairs, one star
  unpaired" was never a rival structure — it is the arithmetic residue of losing
  a triad member. The held reading was self-describing its own defect.
* **The pair sums fall into three families of four — 19, 28, 37 — and the triad
  members are the one star each family lacks** (5+14=19, 5+23=28, 14+23=37).
  They sit at 5/14/23, i.e. ≡5 (mod 9): the middle star of each nakshatra ninth.
  The same triple recurs in the source as a natural class at p.69 (Siro Rajju)
  and pp.60–61 (the Kuja Dosha exemption).

`{5,14}` and `{14,23}` added; `VEDHA_TABLE_UNVERIFIED` cleared in the same
change, as the binding test required. Chitra × Mrigashira and Chitra × Dhanishta
now fail Vedha; **nothing that failed before now passes**.

---

## Still needed from source

#5 is answered above; #2 is closed. The remaining two are **narrower than they
were**, because Jothidam p.68 and p.152 are now in hand and each answers less
than the ruling assumed it would:

1. **Rasi Porutham exceptions (#1) — now a source-selection question, not a gap.**
   p.68 prints exactly **one** exception: *a bride in an even sign from Rishabha,
   groom 6th → Madhyama*. It does **not** contain the reported 2nd-position
   even-sign exception, nor six enumerated 6th-position pairs; those come from
   *Kalaprakasika*, which has **no porutham chapter extracted into this repo**
   (see #4). So `RASI_EXCEPTIONS_ENABLED` stays `False` pending an owner ruling
   on which text governs porutham — the two disagree on where the even-sign
   exception attaches. Encoding p.68's single exception is a small change once
   that is settled.
2. **Kuligai activity table (#7) — p.152 gives a mechanism, not a list.** It
   states Gulika Kalam is "generally described in texts as a good or auspicious
   period", that it **multiplies** whatever is undertaken in it, and gives
   exactly one adverse classification: a body is not carried to the cremation
   ground during it. The six-item favourable list (harvest, trade, debt
   liquidation, medical treatment, installation, land gifts) is *Kalaprakasika*,
   not p.152 — same source-selection question as #1. p.152 alone supports
   populating `ADVERSE` with funeral/cremation transport and a general
   favourable default; it does not support the six-item list.
3. The general Rajju/Vedha/Gana/Rasi mitigation passage, if it exists (unblocks
   #4 fully). Still unresolvable from inside this codebase, for the reason in
   §EC-RULING-04: it is reported to sit in *Kalaprakasika* immediately after
   Vedha, and no Kalaprakasika porutham chapter is extracted here.

**The pattern across all three:** every remaining gap is the same gap — this repo
has *Kalaprakasika muhurta* chapters and *Jothidam* porutham pages, and the
outstanding claims all live in a *Kalaprakasika porutham* chapter nobody has
extracted. That is one acquisition task, not three doctrine questions.
