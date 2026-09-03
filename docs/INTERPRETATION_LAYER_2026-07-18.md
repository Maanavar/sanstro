# Interpretation Layer & D9 Correctness — 2026-07-18

Work arising from a UX/tonal-resonance review: the engine's output was
astrologically correct but read as software rather than as guidance. One item
in that review turned out to be an engine correctness bug rather than a
presentation problem.

## 1. D9 debilitation — a correctness fix, not a UX fix

**`app/calculations/chart_strength.py`**

Navamsa dignity was read one-sidedly. `_has_d9_dignity` tested own-sign or
exaltation only and granted a bonus; there was no debilitation branch at all.

The consequence: a planet **exalted in Rasi and neecha in Navamsa** — the single
case the D9 chart is most relied on to catch — scored *identically* to one with
a neutral D9.

Fixed by making the tier signed (`_d9_dignity_tier` → +1 / 0 / −1):

- The **bonus** stays gated on a neutral natal dignity (D9 as tie-breaker).
- The **penalty** is deliberately ungated. Gating it would re-open the hole,
  since the case needing correction has `dignity == 100`.
- **Vargottama is exempt** from the penalty — the sign repeating across D1/D9 is
  classically stabilising even in a debilitation sign.

Measured effect: Rasi-exalted Jupiter with a neecha D9 moved **56 → 50**, where
it previously scored the same as neutral.

> **Open for the astrologer:** the *magnitude*. Bonus and penalty are symmetric
> at 5.0 as the conservative default, netting about −6. Classical usage treats
> "exalted in name, powerless in Navamsa" as a severe loss, so the penalty may
> warrant more weight than the bonus. Logged in `ASTROLOGER_REVIEW_QUEUE.md`.
> The tests assert *direction only*, so a re-weighting will not break them.

## 2. Yoga "so what" — `app/calculations/yoga_effects.py`

Detectors carried `description_*`, but that field is the **mechanism**
("Amala Yoga — benefics in the 10th from Lagna or Moon"). Several were worse:
`SUNAPHA_YOGA` shipped the literal string `"Sunapha Yoga."`.

Web had a `YOGA_WHAT` dictionary covering **5** yogas; the engine detects **29**.
Everything else fell through to the mechanism string.

New backend catalogue covers all 29 with a one-sentence effect, bilingual.
Placed in the backend (not web) so **mobile gets it too** — mobile previously
showed the mechanism as "Basis" with no meaning line at all.

Guarded by `tests/test_yoga_effects.py`, which scans the detector sources for
yoga codes and fails if any lacks an entry — a new yoga cannot ship as a name,
a score, and no meaning. Tone gates assert no guarantees and no mechanism
restatement.

## 3. Marker labels — every cancellation/condition reason now reads as a sentence

`markerLabel` fell back to `marker.replaceAll("_", " ")`, so unmapped tokens
rendered to users as `eleventh lord weak malefic conj`. Scripted diff found
**18** such tokens, plus **9 parametrized families** (`rahu_house_{n}`,
`{planet}_in_10th`, `combust_key_planet_{...}`, the two `*_link` shapes) that
could never be enumerated as fixed keys.

Added the missing labels plus a `MARKER_PATTERNS` rule set.

`tests/test_marker_label_coverage.py` is a **cross-boundary guard**: tokens are
authored in `app/calculations/`, labels in `web/`, and neither side's own suite
can see the other. Its self-check caught a real bug in its own extraction regex
(f-string markers were being skipped entirely, making the coverage assertion
vacuous) — the same class of failure a previous session's guard caught in
itself.

## 4. Planet reading — facets instead of a wall of text

`_planet_explanation` concatenated placement + dignity + functional role +
dasha + transit + conditions into one paragraph, and the web card appended
`D9: <rasi>.` to the end of it.

Added `ChartExplanationFacet` (`key` / `label` / `value` / `tone`) and a
`facets` list. **Nothing new is computed** — it is the same content pre-split.
`explanation` is retained unchanged for existing consumers; web prefers facets
and falls back.

`tone` (BOOST / CAUTION / NEUTRAL) lets clients style without re-deriving
meaning.

### 4a. Condition meanings — `app/calculations/planet_conditions.py`

Retrograde and combustion were flagged as badges with no translation. Now each
carries a practical sentence, **per planet** — combust Mercury is a
communication signal, combust Venus a relationship one. Collapsing them into one
generic line would repeat the mechanism-only failure above.

Priority order is explicit: cazimi outranks combustion (it inverts it); an
explicit D9 debilitation outranks the milder vargottama/D9-dignity notes.
Retrograde reads as NEUTRAL, not CAUTION — the scorer awards it chesta bala, so
calling it a weakness would have the prose contradict the number. Rahu/Ketu get
no retrograde note (they are perpetually retrograde, so the flag distinguishes
nothing).

## 5. Nakshatra lord dynamics — `app/calculations/nakshatra_lord_dynamics.py`

Charts showed "Mercury in Sadayam pada 4" and stopped. Sadayam is Rahu-ruled,
and the star lord's own placement often decides what the occupant delivers.

New facet states the linkage **and the lord's house**: *"Mercury sits in Sadayam,
a nakshatra ruled by Rahu — and Rahu is placed in house 11. So Mercury's results
tend to arrive through gains, networks, and friendships."* Lords in 6/8/12 add a
note of care.

Deliberately modest: it states the linkage and its direction, and does not
attempt a combined verdict.

### 5a. Duplicated lord tables consolidated

`JadhagamTool.tsx` and `chart-generate-inline-panel.tsx` each carried a
hand-transcribed 27-row lord table. They were byte-identical — no drift *yet*,
but nothing bound them. Both now derive from
`packages/shared/src/nakshatraLord.ts`, since the 27 lords are just the 9-graha
Vimshottari cycle repeated three times. `web/lib/nakshatra-lord.test.ts` pins the
derivation against the legacy table verbatim.

The backend also now serves `nakshatraLord` on the planet payload.

## 6. Daily green/red light

**This needed almost no new doctrine.** `activity_timing_rules.py` already
encoded 12 activity types × paksha/tithi/weekday with bilingual reasons — but it
was only ever consulted one activity at a time, for a goal the user had already
chosen. The question people open the app with is the other way round.

`daily_activity_board()` sweeps all activities and partitions them. Verified as a
*partition* of the existing rules, not a second opinion — a test asserts the
board's bucket matches `assess_activity_timing` for every activity.

Doctrine decisions made:

- **Chandrashtama suppresses all green.** Recommending someone sign a contract
  on their Chandrashtama day would contradict the alert the rest of the app
  raises. Cautions are *not* suppressed.
- **`other` is excluded** — it is a fallback for an unclassified user goal, not
  something to tell someone today is good for.
- Neutral rows collapse behind a toggle; eleven "routine progress is fine" rows
  would bury the two that carry information.
- Amber not red, "worth a second look" not "do not" — matching the existing
  non-fatalist Chandrashtama framing.

Surfaced as `activityBoard` on daily guidance, rendered by
`dashboard-today-activity-board-nova.tsx` beneath the existing Decide strip.

## Gates

| Gate | Result |
|---|---|
| web tsc | clean |
| web eslint | clean (`--max-warnings=0`) |
| web vitest | 169/169 (29 files) |
| ruff | 154 errors — **unchanged from HEAD baseline**, none new |
| mobile tsc | clean |
| mobile jest | 70/70 |
| mobile eslint | 0 errors (69 pre-existing warnings) |
| pytest | see below |

New backend tests: `test_yoga_effects.py` (6), `test_marker_label_coverage.py`
(2), `test_planet_facets.py` (10), `test_nakshatra_lord_dynamics.py` (8),
`test_daily_activity_board.py` (8), plus 2 in `test_calculations.py`.

## Owed

- **Native-Tamil review** on all new `ta` copy — 29 yoga effects, 11 condition
  meanings, 12 house-colour phrases, 11 activity labels, board UI strings. All
  flagged first-draft in-file, queued with the existing C-4 pass.
- **Astrologer sign-off** on the D9 penalty magnitude (§1).
- **Live browser pass** — none of this has been seen in a running authed app.
- Mobile does not yet render facets, the nakshatra-lord note, or the activity
  board; it does get the yoga effects.
