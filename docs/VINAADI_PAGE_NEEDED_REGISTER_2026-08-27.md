# `[PAGE NEEDED]` Register

**Opened 2026-08-27** from §9.1 item 3 of
[`VINAADI_FUNCTION_CALCULATION_AND_SCORING_REFERENCE_2026-08-27.md`](VINAADI_FUNCTION_CALCULATION_AND_SCORING_REFERENCE_2026-08-27.md).

Five rules in the engine rest on **lineage or a specific almanac**, not on a
classical work that can be derived from or reasoned about. They are executing
today and they are not wrong; what they lack is a citation. This file is the one
place that tracks them, so that none of them drifts into being treated as
sourced merely because it has been in the tree a long time.

**Nothing here is closed by reasoning.** Each row closes only when a physical
copy supplies the fields below. An astrologer who cites a page from memory is
how fabricated provenance enters a system and never leaves; that is the failure
this register exists to prevent.

---

## What closes a row

Every row needs four fields. Three are obvious. The fourth is the one that
actually matters.

| Field | Why |
|---|---|
| **Publisher** | Tamil almanac and muhurta texts are reprinted by many houses with divergent tables under the same title |
| **Edition / year** | Tables are silently corrected between editions |
| **Page** | So the next reviewer can check the claim rather than trust this file |
| **Vakya or Thirukanitham** | **See below — this is not bookkeeping** |

### Why the reckoning field is mandatory for any almanac row

A Vakya panchangam and a Thirukanitham panchangam disagree on tithi and
nakshatra end-times, sometimes by hours. **We ship Thirukanitham.**

If a rule was printed against Vakya reckoning and we execute it on
Thirukanitham longitudes, the rule fires **on different days than its own author
intended**. That is a permanent, silent off-by-one. No test catches it, because
the code faithfully implements the rule it was given; the error is in the frame,
not the arithmetic. A source without this field is not a closed row — it is a
new bug with a citation attached.

A photograph of the page, including the title page and edition line, closes a
row completely.

---

## The register

| ID | Rule | Code site | Grade today | Scoring reach |
|---|---|---|---|---|
| `PN-1` | Naisargika maitri — **node rows only** | [chart_strength.py:176](../app/calculations/chart_strength.py#L176), [:187](../app/calculations/chart_strength.py#L187) | `[LINEAGE]` | Scores — natal + daily transit |
| `PN-2` | Baladi avastha **multiplier curve** | [chart_strength.py:286](../app/calculations/chart_strength.py#L286) | `[PRODUCT]` *(relabelled 2026-08-27)* | Scores — ~4–5 pts of the composite |
| `PN-3` | Sevvai dosham **gender weighting** | [_yoga_helpers.py:41-42](../app/calculations/_yoga_helpers.py#L41) | `[LINEAGE]` | Scores — dosham severity |
| `PN-4` | Sade Sati **90-month grade bands** | [sade_sati.py:69](../app/calculations/sade_sati.py#L69) | `[LINEAGE]` | Scores — phase severity |
| `PN-5` | **Jeevan / Nethiram cutoffs** | [panchangam.py:354](../app/calculations/panchangam.py#L354), [:393](../app/calculations/panchangam.py#L393) | `[LINEAGE]` | **None — display only** |

---

### `PN-1` — Naisargika maitri, node rows

**What is sourced and signed:** the seven-graha core. Every asymmetry in it
falls out of the Moolatrikona arithmetic, which is exactly what makes it
doctrine rather than preference — it can be re-derived and checked.

**What is not:** Rahu's and Ketu's rows. **The nodes have no Moolatrikona sign,
so no node friendship can be derived from anything.** Every entry in those two
rows is a choice someone made, and the code cannot say whose. A 2026-08-27 sweep
of all 9×9 ordered pairs found three asymmetries, one of them (Rahu holding
Saturn a friend while Saturn listed neither node) on the heaviest-weighted graha
in the daily transit component. All three are now symmetric and a test pins node
symmetry — but symmetry is an internal consistency property, not a source.

**Needed:** the lineage's own node friendship table, or an explicit ruling that
these are house policy, in which case they are relabelled `[PRODUCT]` like
`PN-2` and the row closes that way instead.

---

### `PN-2` — Baladi avastha multipliers

**Partially closed 2026-08-27 — by relabelling, not by sourcing.**

The five zones, their Bala→Mrita order and the reversal in even signs are BPHS
and are **signed**. The five *numbers* — `0.50 / 0.75 / 1.00 / 0.65 / 0.25` —
are a smoothed product curve. The texts express avastha as fractions of effect
(broadly a quarter, a half, full, little, nil) and differ among themselves at
the tails; ours doubles the infant and floors the dead at a quarter where the
texts give nothing.

That smoothing is a defensible engineering choice and was kept. What changed is
the label: it was sitting inside a `[CLASSICAL]` block, which put a product
judgement under Parashara's name. It is now `[PRODUCT]`, documented at the
constant.

**This row stays open** only for the optional upgrade: supply the lineage's
printed fractions and the curve can be restored to `[CLASSICAL]`. **If no source
is forthcoming, close this row as `[PRODUCT]` permanently** — that is an honest
resting state, and preferable to hunting for a source to justify a number
already chosen for engineering reasons.

---

### `PN-3` — Sevvai dosham gender weighting

Female high-attention houses `{4, 8, 12}`, male `{2, 7, 8}`.

**Signed and not in question:** checking all three references independently —
Lagna, Chandran and Sukran — and recording which fired. That is the correct
Tamil treatment, and the common shortcut of reading from Lagna alone is why two
astrologers so often disagree on the same chart. Houses 1/2/4/7/8/12 and the
mutual-cancellation rule are correct.

**Open:** only the gender split. Widely practised, rarely printed.

**Reach:** this changes a severity grade a reader sees on a marriage report, so
it is not cosmetic.

---

### `PN-4` — Sade Sati 90-month grade bands

**Signed and not in question:** the *structure*. Replacing a flat seven-and-a-
half-year penalty with the month-wise division is right, and **the source's own
point in citing it — that the whole period is not adverse — is what most
readings get wrong.** Taking phase position from the real Saturn ingress instant
is right. The Moorti table (1/6/11 Swarna, 2/5/9 Rajata, 3/7/10 Tamra, 4/8/12
Loha) is the classical one. Flooring a mitigated cycle at 1 so it is lighter but
never free is right.

**Open:** the month-band grades themselves — which months are DIFFICULT,
FAVOURABLE, ACUTE, MIXED, and where each boundary falls. The module comment
cites p.243 of the working text; that citation needs its publisher and edition
before it counts.

---

### `PN-5` — Jeevan / Nethiram cutoffs

**The only row with zero scoring reach.** Both limbs are display-only and must
stay that way until this row closes. Do not wire either into a score on the
strength of "it has been on the screen for months".

**Fixed 2026-08-27 without a source, and correctly so** (`FCR-07`): Nethiram and
Jeevan are one paired rubric, and at ring distance exactly 9 the engine printed
**இரு கண்** — both eyes, the best Nethiram — beside **ஜீவன் இல்லை**, no life,
the worst Jeevan. The only such cell in the 0–13 domain; no almanac prints it,
and the same line made Jeevan non-monotonic. The `distance == 9` special case is
deleted and both limbs now share the 8|9 boundary. That defect was identifiable
from internal contradiction alone.

**Still open:** the cutoffs themselves. **This row is the one where the
Vakya/Thirukanitham field bites hardest** — Jeevan and Nethiram are read off
nakshatra positions relative to the Sun's star, exactly the quantity the two
reckonings disagree about.

---

## Rules for maintaining this file

1. **A row closes only on a physical page.** Not on a website, not on a second
   astrologer's recollection, not on internal consistency.
2. **Never fill a page number from memory**, including your own. An empty field
   is a known gap; a wrong one is a lie that survives every future review.
3. **A row may also close by relabelling** — conceding the rule is house policy
   and marking it `[PRODUCT]`. That is a legitimate outcome, not a failure, and
   `PN-2` has already taken it.
4. **Do not increase a row's scoring reach while it is open.** `PN-5` is
   display-only by ruling; the others already score and must not score *more*.
5. When a row closes, record the four fields **in the code comment at the site**,
   not only here — the register is an index, and the citation belongs next to
   the constant it justifies.

## Change log

| Date | Change |
|---|---|
| 2026-08-27 | Register opened with five rows. `PN-2` relabelled `[PRODUCT]` at the constant and in §3.3.3 of the reference doc — its classical claim withdrawn rather than left unsigned |
