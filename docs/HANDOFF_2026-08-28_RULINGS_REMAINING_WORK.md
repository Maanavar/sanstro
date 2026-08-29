# Handoff — remaining work from the 2026-08-28 astrologer rulings

Source of truth for everything below: [`ASTROLOGER_RULINGS_2026-08-28.md`](ASTROLOGER_RULINGS_2026-08-28.md).
That file has the full reasoning for every ruling; this file is scoped to just
the items still open, with exact code locations so any agent can pick one up
without re-reading the whole ruling record first. Read the linked section in
the rulings doc before touching code — it explains *why*, this file only
tracks *where* and *what's left*.

**Items 6 and 7b (fractional drishti + the benefic set) shipped 2026-08-29**
— `aspect_strength()` and `effective_natural_class()` are in `aspects.py`,
wired into `chart_strength.py`, `shadbala.py`, `bhava_afflictions.py`,
`propensities.py`, and `_yoga_detect.py`'s Kartari/Amala/Adhi/Vasumati
detectors; `tests/test_drishti_yoga_golden.py` was read as the gate (see its
module docstring for what did and didn't move). Only items 3 and 4b remain,
and they're independent of each other.

---

## Item 3 — janma-tara grading (A-19) 🔨

**Ruling:** "3a y — activity-specific rule > general bar (apavada > utsarga).
3b y — full / half / quarter. 3c QUARTER. Dosha attaches to the 19th as
Thri-janma, not qua Pariyaya; record that reading on the rule." Rulings doc
§3.

**What exists today — the binary bar to replace:**
- [`app/data/muhurta_activity_registry.py:226`](../app/data/muhurta_activity_registry.py#L226) —
  `janma_tara_prohibited: frozenset[int]` per activity entry (a set of
  janma-tara counts that are simply barred).
- [`app/calculations/muhurta_engine.py:1746`](../app/calculations/muhurta_engine.py#L1746) —
  `_janma_tara_count_factor(...)`. Line ~1769: `if count not in
  entry.janma_tara_prohibited: return None` — binary in/out, no grading.
- Populated per-activity in `muhurta_engine.py` at lines 798-799 (Upanayanam),
  846-847 (Seemantham), 1145-1146 (Harvest), each pointing at a
  `..._JANMA_TARA_PROHIBITED` constant defined in the matching
  `app/data/kalaprakasika_*_rules.py` file
  (`kalaprakasika_lifecycle_rules.py`, `kalaprakasika_harvest_rules.py`, etc).

**What to build:**
1. Replace the binary prohibition with a **graded weight per count**: janma
   (count 1, 10, 19 by the three-cycle reckoning — confirm exact counts
   against the existing `_JANMA_TARA_NOTE` comment at
   `muhurta_engine.py:267`) = **1.0**, 10th = **0.5**, 19th = **0.25**, third
   cycle (count 19 read as Thri-janma per 3c, not "third Pariyaya") = the
   dosha weight, **not 0** — re-read ruling 3c carefully: "Dosha attaches to
   the 19th as Thri-janma, not qua Pariyaya" is explaining *why* the 19th is
   barred (it's the third occurrence of the janma-star itself, not because
   it falls in some third 9-day cycle), not softening its weight. Cross-check
   the exact weight-per-count table against the rulings doc §3 text before
   coding — the summary here ("janma 1.0, 10th 0.5, 19th 0.25, third cycle 0")
   is quoted from the ruling doc's own "To build" list; if it and this
   paragraph appear to conflict, the ruling doc wins and this file is stale.
2. **Record the 3c reading on the rule itself** — a comment or docstring next
   to whatever constant carries the 19th-count weight, stating explicitly:
   the 19th is barred as Thri-janma (third occurrence of the janma
   nakshatra), not because of Pariyaya-cycle position. This is called out in
   the ruling as "the kind of thing that gets silently re-derived the wrong
   way in two years" — don't skip it.
3. **Per-function exemptions (apavada > utsarga):** mantra initiation (p.62)
   and first milk-feeding (p.32) lift the bar for their own rite — build
   these two now. **Annaprasana (p.34) is NOT in scope** — its exemption list
   has an OCR-ambiguous numeral (11th or 12th) and must not be encoded until
   the physical page settles it (see "Blocked" section below).
4. Grading **softens** days that fail today (a day that was a hard bar at
   count 19 now scores 0.25 instead of a full block), so this is not a
   drop-in — run a before/after sweep across the existing muhurta test
   fixtures and read it, the same way items 6/7b require a fixture diff read.
   Check `tests/test_marriage_muhurta_doctrine.py` and
   `tests/test_kalaprakasika_expansion_doctrine.py` for the existing
   janma-tara assertions to update.
5. **Not in scope, explicitly recorded as such by the ruling:** Ch. XXXIV's
   neutralizations (pp. 189-197) are still unmodeled. Don't try to fold them
   in as a "while I'm here" — the ruling notes affliction scoring stays
   systematically harsher than the source text until that's a separate,
   deliberate piece of work.

---

## Item 4b — Sthree Deergham bands (porutham) 🔨

**Ruling:** "1-7 FAIL / 8-13 MADHYAMA / 14-27 UTTAMA. Binary fallback: >=14."
Rulings doc §4, subsection 4b.

**What exists today:**
- [`app/calculations/porutham.py:261`](../app/calculations/porutham.py#L261) —
  `_stree_dirgha_score(nak_boy, nak_girl) -> int`. Currently: `diff = (nak_boy
  - nak_girl) % 27; return 1 if diff > 6 else 0` — i.e. today's pass
  threshold is count ≥ 8 (`diff > 6` in 0-based terms).
- `KutaResult` dataclass at
  [`app/calculations/porutham.py:485`](../app/calculations/porutham.py#L485)
  has no `detail` field today — `score: int` (1/0) and `label: str`
  ("PASS"/"FAIL") only. Porutham's total is `int`, 0-10, on the wire across
  four surfaces (backend, `packages/shared`, mobile, web) — **do not change
  that type.**

**What to build:**
1. Move the pass point from `diff > 6` (≥8) to `diff >= 13` (≥14,
   1-indexed) — this is the "binary fallback" the ruling names for wherever
   the product can only express pass/fail. **This is the most user-visible
   change in the whole ruling set: counts 8-13 currently PASS and will start
   failing.** Confirm this is understood before merging, and run the
   before/after sweep across real/fixture chart pairs the ruling explicitly
   asks be "read before it ships."
2. Add a `detail: str | None` (or similarly typed) field to `KutaResult` to
   carry the band — `FAIL` (1-7), `MADHYAMA` (8-13), `UTTAMA` (14-27) — so the
   grading isn't lost even though `score` stays binary. **This field is
   shared with item 4a's Jothidam p.68 Madhyama grade** (see rulings doc §4a,
   "Held" paragraph) — check whether that work has landed first; if not,
   design the field generically enough (e.g. a plain string label, not an
   enum scoped to only Sthree Deergham) that 4a can reuse it rather than
   adding a second detail field later.
3. Update `_stree_dirgha_score` (or replace it with a function returning both
   the pass/fail int and the band string) and thread the band through
   wherever `KutaResult` is constructed in `compute_porutham` (search for
   `_stree_dirgha_score(` call site — one call, inside `compute_porutham`
   around line 697+).
4. Surfaces to check for anything that assumes `KutaResult` has no `detail`
   field or hardcodes the old ≥8 threshold: `tests/test_porutham.py` (already
   modified in the current working tree — check what's already there before
   duplicating), and any web/mobile porutham detail panel that renders per-
   kuta results (grep `KutaResult`, `stree_dirgha`, `sthree`, `deergham`
   across `web/` and `packages/shared/`).

---

## Blocked on the physical page — not actionable without it

Two items are explicitly held pending the astrologer confirming an
OCR-ambiguous source page. Do not guess these — they're recorded as blocked,
not as "pick a reasonable default":

1. **Annaprasana janma-tara exemption numeral (item 3, p.34).** The exemption
   list names either the 11th or 12th count — ambiguous in OCR. Do not encode
   this exemption (it's the third of three per-function exemptions in item 3)
   until resolved. The other two exemptions (mantra initiation p.62,
   first milk-feeding p.32) are unambiguous and safe to ship now.
2. **Kalaprakasika's Taurus vasya row (item 4c, p.69).** Our current
   Kataka+Thulaam mapping for the Taurus row plausibly reads "Cancer and Leo"
   in the source as a Leo/Libra OCR slip. Simmam↔Thulaam is confirmed and
   already shipped (📋 no code change needed); the Taurus row alone stays
   held.

If picking up other work in this repo and you happen to get a clean scan or
photocopy of either page, route it the way prior source-photocopy requests
were handled (see `project_source_photocopy_request_2026-08-27` in the
project's memory index, or ask the user directly) — don't self-resolve the
ambiguity from a paraphrase.

---

## Cross-cutting notes for whoever picks this up

- `tests/test_drishti_yoga_golden.py` is no longer just a gate for pending
  work — items 6 and 7b already regenerated and read it. It stays useful as
  a general aspect/yoga regression fixture: don't touch `GOLDEN_YOGAS` or
  `ASPECT_TARGETS_FROM_MESHAM` by hand-editing for items 3 or 4b either —
  those items don't touch aspects or yoga presence, so this file should stay
  green untouched; a diff here while working on 3 or 4b means something
  unrelated moved and needs its own explanation.
- Standing rule for this codebase: domain calc bugs are silent — there's no
  runtime error when an astrology rule is wrong, only a wrong reading. Write
  the before/after sweep for each item above and actually read it; don't
  treat "tests pass" as sufficient when the test itself is the thing being
  changed.
- Test fixture / doc files already modified in the working tree as of this
  handoff (`git status`): `app/api/predictions.py`, `_yoga_detect.py`,
  `compatibility_intelligence.py`, `porutham.py`, `propensities.py`,
  `yoga_effects.py`, `yoga_rules.py`, `yogas.py`, `kuligai_polarity.py`, plus
  `aspects.py`, `chart_strength.py`, `bhava_afflictions.py`, `shadbala.py`
  (items 6/7b's own wiring), and several `tests/*.py` / `docs/*.md` files,
  plus `tests/test_drishti_yoga_golden.py`. These are **item 1, 2, 4a, 5, 6,
  7a, and 7b's already-shipped work** (per rulings doc — see "What ships in
  what order" at the bottom of that file), not part of the two items above.
  Check `git diff` on any of these before assuming a clean baseline.
