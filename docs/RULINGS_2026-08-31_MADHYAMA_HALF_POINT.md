# Rulings — Madhyama earns half a point (2026-08-31)

Answers to the five questions in
[`ASTROLOGER_QUESTIONS_2026-08-31_BANDS_AND_SURFACES.md`](ASTROLOGER_QUESTIONS_2026-08-31_BANDS_AND_SURFACES.md),
plus the four implementation decisions the answers forced. All shipped.

**The one line to carry:** the single change that resolves Q1a, Q1c, Q2a and Q2b
at once is giving Madhyama its **0.5**. It makes the score match the doctrine,
halves the downward pressure at its source so the composite rungs never need
chasing, and turns "is it a pass or a fail" from a presentation argument into a
settled reading.

---

## Q1c (taken first — it settles most of the rest) · Madhyama is a **weak pass**

> **உத்தமம் / மத்யமம் / அதமம்** — uttama / madhyama / adhama; best / middling /
> worst. This ladder runs through all of Jyotisha — muhurta, yoga strength and
> porutham quality alike. **Madhyama is the acceptable-with-reservation tier.
> Adhama is the fail.** A Tamil astrologer sitting with a family never says a
> madhyama porutham "failed". The words spoken are *"மத்யமம் — பரவாயில்ல, ஆனா
> உசந்தது இல்ல"* — middling; it's alright, but not the best of it. That is a
> qualified yes, not a no.

So the hard 0 that Sthree Deergham's Madhyama carried was **an engineering
artifact of the binary fallback, not a doctrinal verdict**. The 2026-08-28
fallback (`>= 14`) was a sound simplification *while the engine could only hold
true/false*, but it was stricter than the sastra.

| Grade | Credit |
|---|---|
| Uttama (count 14–27) | **1.0** |
| Madhyama (count 8–13) | **0.5** |
| Adhama (count 1–7) | **0.0** |

Shipped: `GRADE_SCORE` in [porutham.py](../app/calculations/porutham.py).

## Q1a · Do **not** re-cut the composite rungs. Fix the Madhyama credit instead.

The two movements under the 80/65/50 rungs are different in kind and deserve
opposite treatment:

- **The re-weighting (±15 pts) — leave the rungs alone.** Raising Porutham
  20 → 35 was doctrinally right; the composite is now a *truer* mirror of how a
  family weighs a match, not a distorted one. Re-cutting to preserve the old
  spread would partially undo the correction. A couple carried by generic chart
  arithmetic *should* now read lower; a star-strong couple *should* read higher.
- **The Madhyama drop — do not compensate at the rungs; it was a source bug.**
  If a madhyama is a weak pass but scores 0, the −0.78 mean shift and the 22.2%
  of pairs losing 3.5 points were **the arithmetic being stricter than the
  sastra**, not the sastra sending anyone down. Re-cutting the rungs to make
  room for that would launder an over-harsh score into doctrine. Fixed at
  source: with the 0.5, that downward pressure roughly halves and there is
  nothing left at the rungs to chase.

The 2026-08-31 hold on the rungs therefore stands, and the reasoning recorded on
`ALMANAC_AMAVASAI` — never re-tune the words in the same breath as the weighting
— was affirmed as correct. **Cut nothing against the 729-star grid**; 65 of the
100 composite points come from layers no star pair determines.

## Q1b · Anchor cases

**The load-bearing one:** 7 of 10 poruthams pass, Rajju and Vedha both clear, no
Sevvai dosham, ordinary charts → **நல்லது / GOOD**. That is where they land
today and it is right. In the dasa-porutham tradition the practical ladder is
5–6 marriageable/average, 7–8 good, 9–10 excellent, with Rajju and Vedha as
absolute gates underneath. **Do not move this to EXCELLENT** — if a 7-of-10
ordinary match reads EXCELLENT, the top word loses its meaning and there is
nothing left to say to the 9-of-10-with-strong-charts family.

The ladder to fit the rungs against. **These sentences are the record, not the
numbers** — verdicts are the astrologer's, in the reading they would give a
family:

| # | Case | Verdict |
|---|---|---|
| 1 | 9–10 pass incl. Rajju + Vedha + Mahendra + Yoni; no Sevvai/Nadi dosham either side; both 7th houses strong (lord well-placed, Sukra unafflicted); D9 throws benefic influence on the 7th | **EXCELLENT** — proceed with confidence |
| 2 | 8 pass, both gates clear, the one shortfall is Sthree Deergham at **Madhyama**, no dosham, strong charts | **EXCELLENT** — *this anchor is the whole point of Q1c: a madhyama shortfall must not by itself knock a match out of the top band* |
| 3 | 7 pass, both gates clear, no dosham, ordinary charts | **GOOD** (the benchmark) |
| 4 | 8 pass but **Sevvai dosham present and cancelled** | **GOOD** — present-but-cancelled caps an otherwise-excellent match one rung down, and the family must be *told* it was cancelled, not that it was absent |
| 5 | 5–6 pass, gates technically clear but marginal, **Gana mismatch** (Deva–Rakshasa), no dosham, weak-ish 7th | **AVERAGE** — marriageable, eyes open |
| 6 | 6 pass, gates clear, **Sevvai dosham present and NOT cancelled** | **AVERAGE** — the live dosham holds it here despite a respectable count |
| 7 | **Rajju fails** (any count elsewhere) | **CAUTION** — Rajju governs the mangalya/longevity of the union; not overridden by a high number |
| 8 | **Vedha fails** | **CAUTION** — same hard gate |
| 9 | 3–4 pass, gates clear, but **Gana clash + Sthree Deergham fail + Nadi dosham** (same Nadi — serious for progeny/health) | **CAUTION**, with no single hard veto: an accumulation of the weighty poruthams failing is itself a caution-grade reading |

Fit 80/65/50 so cases 1–2 land ≥ 80, case 3 lands mid-GOOD, and 5–6 land
AVERAGE — against a **real-chart** composite distribution, still to be built.

**Standing caveat, recorded as an open item:** *which* seven matters as much as
*how many*. A seven including Gana, Mahendra and Yoni reads better than a seven
missing Gana — a Deva–Rakshasa temperament clash is a genuine red flag even when
the tally is fine. Each porutham being a flat 1 point flattens this. Not this
week; but it is why the rungs can never be cut perfectly against count alone.

---

## Decision 1 · The porutham layer's own ladder — a different object

**Not lockstepped to the composite.** The porutham label answers "how strong is
the star-matching, on its own?"; the composite answers "should this marriage
proceed, all seven layers weighed?" Different scopes, *allowed* to say different
words. A couple with 8.5 porutham and ordinary charts **should** read "Porutham
EXCELLENT" under a composite of GOOD — that reads correctly: the stars are
strong, the charts temper the whole. Do not suppress that.

The 9-rung learns to read a half instead:

> **Round the porutham total to the nearest band. A tie — a trailing .5, which
> only a madhyama can ever produce — breaks upward, to the pass side.**

Giving, in effect, EXCELLENT ≥ 8.5, GOOD ≥ 6.5, AVERAGE ≥ 4.5 — as a *derived*
rule, not a fresh cut. The rungs are still 9/7/5. The justification is the one
behind the 0.5 itself: a madhyama is a weak pass, so at a boundary it tips
toward passing, never away. Rounding a madhyama **down** would mean it never
helps at a rung — the binary under-credit creeping back in through the label
after we paid to remove it from the score.

Shipped as `porutham_band_label`. Implemented with `math.floor(total + 0.5)`,
**not** `round()`: Python's `round()` is banker's, so `round(8.5) == 8` would
break the tie downward — precisely the under-credit the rule exists to prevent.

Two things recorded beside it: this is the porutham-**layer** ladder only, and
the band is composition-blind (8.5 might be 8 clean + 1 madhyama, or 7 clean +
3). The second is the standing "which seven" limitation inherited, not created.

## Decision 2 · `passed` is a pass — the fail-safe runs toward the doctrine

The proposed shape (`passed` true only for Uttama) was **overruled, and the
reasoning matters**: the consumers most likely to still read only the boolean
are exactly the un-upgraded public/shared surfaces, where a false Fail does the
most damage. That shape put the failure mode precisely where it hurts.

The field is named `passed`; it answers the question its name asks, and the
doctrine already answered that.

| Field | Value | Read by |
|---|---|---|
| `score` | 1.0 / 0.5 / 0.0 | all weighted math; **the veto reads `score == 0`** |
| `grade` | UTTAMA / MADHYAMA / ADHAMA | any consumer that can paint three states |
| `passed` | derived, `grade != ADHAMA` — **true for a madhyama** | binary consumers that cannot paint amber |

"Earned full marks" is a *different* concept and keeps its own home (`score == 1`,
exposed as `is_uttama`). The two answers diverge exactly at madhyama, which is
the entire reason the grade exists, so they are never overloaded onto one flag.

The invariant: **an un-upgraded surface shows green Pass for a madhyama — an
overstatement, but on the correct side of the doctrine. It never shows a false
Fail.** Overstating a pass is venial; calling a pass a fail is the one error Q2a
exists to prevent.

## Decisions 3 & 4 · General mechanism, and the veto coupling

**3 — general, populated per authored doctrine.** Hard-coding 0.5 as a
Sthree-Deergham special case would itself assert that only that porutham has a
middle state, which is false. So the *mechanism* is general; a band is
*populated* only where thresholds are authored, not paraphrased — Sthree
Deergham now, Rasi when Jothidam p.68 settles. Eventual footprint is four or
five poruthams, not ten: Gana and Rasi genuinely carry a classical madhyama
(Deva/Manushya/Rakshasa gradations; the 2-12/6-8 positional shades), Yoni
arguably; Dinam, Vasya, Rasyadipathi and Mahendra are rendered binary in
practice.

**4 — the veto is unchanged, and 3 and 4 are coupled.** Recorded as one
invariant, on one line, in `BINARY_ONLY_KUTAS`:

> **Rajju and Vedha are permanently binary. The 0.5 mechanism must never be
> populated for them.** Not "not yet" — never. A gate is open or shut; there is
> no middling Rajju. The safety reason is concrete: the veto fires on
> `score == 0`, so a half-failed Rajju would carry `score == 0.5` and **slip
> straight past the veto**. Treating "the veto reads score == 0" and "madhyama
> is general" as independent facts is what would punch a hole in the hardest
> gate in the engine.

Enforced by `test_veto_kutas_are_never_graded` over all 729 star pairs, plus an
assertion at the point where bands are assigned.

---

## Q2a · Option C, refined — the middle state the design already reserved

Q1c settles it: a madhyama is a weak pass, so a bare red **Fail** on the page a
couple forwards to their parents is a misrepresentation. That kills option B.

The synastry panel's amber 40–70% band **already existed and was structurally
unreachable** — every kuta scored 0 or 1, so the middle could never be hit.
Madhyama is precisely the state it was built for and never got. So this was not
"add a label"; it was *finally populating the middle state the design already
reserves.*

- **Every interactive surface** (public calculator, shared page, both dashboard
  panels, mobile): the grade word **replaces** the coarse pass/fail word, in
  amber. Never beside it.
- **The share image**: no text grade, but the bar renders in the **amber middle
  state** rather than red. A three-colour bar carries the grade without a single
  Sanskrit word — the picture stays uncluttered and stops lying about madhyama
  pairs.

## Q2b · The gloss travels with the *word*, not with the colour

On any surface showing "Madhyama" to a non-astrologer, the gloss travels with
it: a bare Sanskrit grade strands a reader exactly as badly as an unexplained
red Fail, so swapping one for the other would trade one confusion for another.
It does **not** need to travel to the share image, where the colour-only route
leaves no word to explain — an amber bar between a green and a red one reads as
"in between" on its own.

Authored copy, in [`web/lib/kuta-grade.ts`](../web/lib/kuta-grade.ts) — do not
paraphrase:

**Panel (long):**
> Madhyama — a middling result on this porutham. Acceptable, but not the
> strongest grade. It counts as a soft pass, not a failure.

> மத்யமம் — இந்தப் பொருத்தத்தில் நடுத்தர நிலை. பரவாயில்லை, ஆனால் உயர்ந்தது அல்ல.
> இது தோல்வி அல்ல, மிதமான பொருத்தமே.

**Public calculator & shared page (short):**
> Madhyama — a moderate match, not a failure.

> மத்யமம் — மிதமான பொருத்தம், தோல்வி அல்ல.

Three notes carried with the copy. The spoken form was composed to written
standard for a product surface (பரவாயில்ல → பரவாயில்லை, உசந்தது இல்ல → உயர்ந்தது
அல்ல). **தோல்வி அல்ல — "this is not a failure" — is the load-bearing clause**:
spoken aloud an astrologer's tone carries that reassurance, and on a silent
screen beside an amber bar it has to be written down or it is lost; if space
ever forces another cut, **cut the grade descriptor before "not a failure."**
And the short form says மிதமான ("moderate") rather than சாதாரண deliberately —
சாதாரண collides with the AVERAGE verdict word and would blur the two.

---

## What shipped

**Engine** — `GRADE_UTTAMA/MADHYAMA/ADHAMA`, `GRADE_SCORE`, `BINARY_ONLY_KUTAS`,
`porutham_band_label`, `format_porutham_total`; `KutaResult` gains `grade` and a
`float` score; `PorutthamResult.total_score` is a float. The band name `FAIL`
became `ADHAMA` to match the doctrine it implements.

**Wire** — `score` widened to float and `passed` + `grade` emitted across all
five construction sites; `total_score` widened in six schemas (relationships ×2,
porutham_shares, public_tools ×2, numerology). Share snapshots stored before the
grade are backfilled by a `model_validator` — their derivation is exact, because
those snapshots are strictly binary — so no existing share link 500s. Their
stored `score` is left as recorded; re-crediting a historical row to 0.5 would
leave it disagreeing with its own stored total.

**Surfaces (all seven)** — the two dashboard panels, the public calculator, the
shared page, the share card, and mobile. The two panels that were previously
recorded as "already correct" were in fact printing the band *beside* the
pass/fail chip, i.e. carrying the very two-ratings contradiction the ruling
rejects; both now replace it. Copy lives once, in `web/lib/kuta-grade.ts` — the
two Tamil words had already drifted in spelling between surfaces
(மத்தியமம் / மத்யமம்), which is the same parity failure this repo keeps hitting.

**Stale copy corrected** — the Nova panel told every family "Each porutham is a
strict pass/fail check — one point each", with a code comment insisting there
are "no half scores". That comment was itself a 2026-07 correction of an earlier
wrong claim, so the sentence has now been wrong in both directions; it states
the rule and points at `GRADE_SCORE` for the next reader.

**Tests** — the band tests are rewritten against the grades; new:
`test_madhyama_scores_half_not_zero`, `test_veto_kutas_are_never_graded` (all 729
pairs), `test_porutham_band_ties_break_upward`,
`test_total_formats_without_a_trailing_decimal`.

---

## Two bugs found while wiring this — neither related to the ruling

### `KutaResult.passed` was never emitted — every shared link read "Fail" on all ten poruthams 🔴

`passed` had been declared in `packages/shared` for months and **no backend
schema ever sent it**. The public share page — the link a couple forwards to
their family — renders each row from that boolean alone, so `k.passed` was
`undefined`, and every porutham on every shared link printed **"✗ Fail"**,
regardless of the real result, directly beneath a headline score reading (say)
8/10 GOOD. Fixed as part of Decision 2, which is what makes the fix
load-bearing rather than incidental: the ruling's fail-safe floor did not exist
on the wire at all.

### The field-parity guard could not see it — and had never checked half the client 🟠

`test_api_wrapper_field_contract.py` exists to catch exactly this ("a misspelled
field is `undefined` — no error, no type error… forever"). It missed it through
**three** compounding blind spots, all now closed:

1. It parsed interfaces only from `packages/shared/src/api`, so any field typed
   with a shape from `src/types` — where the shared types live — resolved to an
   unknown name and the walk stopped.
2. Its regexes required one member per line at exactly two spaces of indent, so
   every **single-line** interface was skipped silently. `KutaResult` was one.
   Both are now brace-matched and depth-parsed instead.
3. **It skipped the inline-envelope cast form** — `as Promise<{ success, data:
   X }>` — on the stated grounds that it "has no identifier to look up". It has
   one: the `data` member's type. **45 of the client's 83 casts are written that
   way, so more than half the shared client had never been checked at all**, the
   porutham wrappers included.

An unparsed interface was indistinguishable from the honest silence this guard
deliberately keeps for genuinely unresolvable schemas — which is why the gap
never announced itself. Reach went from 35 comparisons over 704 fields to **65
over 2,699**; the floors in `test_interfaces_and_casts_were_discovered` are
ratcheted to match. Verified by removing `passed` again: the guard now fails
through two independent routes, naming the field and the file:line.

**One new drift surfaced immediately and is recorded, not fixed:**
`GuidanceEnvelope.data.chandrashtamaEnds` is declared in TS and sent by nothing.
`ChandrashtamaCard`'s "Ends: <time>" line has therefore never rendered, and
mobile's defensive `chandrashtamaEnds ?? chandrashtama_ends` fallback is dead on
both branches — someone hit this and patched the symptom rather than the wire.
Recorded in `KNOWN_DRIFT` because sending it is a real change, not a rename: the
end instant must come from the Moon's rasi span (`_dg_scoring.py` already
computes it), and *which* instant counts as "ends" — the span boundary or the
following sunrise — is a doctrine question.

---

## Still open

* **The composite rungs (A-4)** — held, per Q1a. Needs the real-chart composite
  distribution, which is measurement and needs no ruling.
* **"Which seven, not just how many"** — flat 1-point weighting cannot hear a
  Gana clash. Named by the astrologer, deferred by the astrologer.
* **Anchor #4's duty** — **half closed 2026-09-01** (`c4c226e`). Audited: the
  client surfaces were already right — the compatibility panel renders
  Cancelled / <severity> / No Dosham as three distinct chips, and
  `dashboard-yoga-dosham-panel.tsx` already carries the explicit "should not be
  called 'dosham free'" copy. The *report narrative* was not: both Sevvai
  branches required `not is_cancelled`, so a cancelled dosham produced no line
  at all and read word-for-word like a couple who never had it. Fixed, and the
  block extracted to `sevvai_risk_lines` so the rule is reachable by a test.

  **Still open — the scoring half.** Anchor #4 also says present-but-cancelled
  "caps an otherwise-excellent match one rung down". There is no such cap: the
  only label cap is Rajju/Vedha → CAUTION, and a cancelled dosham costs 1 point
  of a 5-point sub-score inside a 10-point layer (~2 composite points), which
  crosses the 80 rung only from a narrow band. A real cap changes verdicts, so
  it wants its own change and an explicit go-ahead — the same attribution
  reasoning as the rung retune.
* **`chandrashtamaEnds`** — **closed 2026-09-01** (`53281b6`). Now sent, and
  the wrapper-parity guard reported the fix itself by failing with "the bug is
  fixed — delete those entries from KNOWN_DRIFT". Ruled: report a time only
  when Chandrashtama actually lifts that day. `moon_rasi_spans` is clipped to
  `[sunrise, next_sunrise]` and the Moon spends ~2.25 days per rasi, so taking
  the last span's end unconditionally would have named the next sunrise as the
  end on every day but the last — a false, precise-looking time, and the common
  case rather than an edge one. It returns null while the stretch continues,
  and the card keeps its untimed line, which is true throughout.
* **Rasi's madhyama band** — mechanism ready, still gated on Jothidam p.68.
