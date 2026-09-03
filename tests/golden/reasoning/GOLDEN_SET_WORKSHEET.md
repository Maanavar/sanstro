# Golden-set expansion worksheet (3 → ~20)

Tracks [`docs/REASONING_LAYER_UPGRADE_PLAN.md`](../../../docs/REASONING_LAYER_UPGRADE_PLAN.md)
§7 item 1 and §11 item 4 — owed since PR-1, now more important because each chart must also
carry an **expected reading**, not just a band (PR-4 added the `Reading` classifier).

**Division of labour:** engineering scaffolds this worksheet (schema + coverage plan + stub
rows) — done 2026-07-03. The chief Thirukanitham specialist annotates the 17 `TODO` rows
(chart placements + expected gate/band/reading per row). This blocks any beta flag-on for
`reasoning_gate` / `reasoning_contradiction` (plan §8 astrological review gate).

## Where the data lives

[`golden_set_worksheet.json`](./golden_set_worksheet.json) — the fill-in-the-blanks file. It has:
- `schema` — field-by-field meaning of `input` / `expected`.
- `coverage_table` — the 20 planned rows (3 `DONE`, 17 `TODO`), each targeting one life area
  and one `Reading` value so the finished set exercises every combination at least once.
- `todo_template` — copy this object, fill it in, rename `REPLACE_ME` placeholders, flip
  `status` to `DONE`.

The 3 `DONE` rows (K1–K3) are **not** duplicated as live data here — they point back to
[`marriage_promise_gate.json`](./marriage_promise_gate.json), which stays the source of truth
consumed by [`tests/reasoning/test_marriage_gate.py`](../../reasoning/test_marriage_gate.py).

## How to fill a `TODO` row

1. Copy `todo_template`, rename it to the row's `id` (e.g. `K5`) → `name`.
2. Fill `input`: full D1 (`planets_rasi` for all nine grahas + `lagna_rasi`), the area's varga
   placements (`varga` + `varga_rasi_by_planet` — see the varga column below), the dasha lords
   and transits active `as_of_date`, and any affliction flags the row's gate grade depends on
   (combustion, debilitation, dosham cancellation, etc.).
3. Fill `expected`: the `assess_promise` grade (PASS/WEAK/BLOCKED/SILENT per plan §Phase 1),
   the resulting `Band`, the `Reading` this row targets (per `coverage_table`), and whether a
   timing window should be claimed.
4. Write `annotation`: one or two sentences on *why* — which lord/karaka placement drives the
   grade. This is what makes the row reviewable, not just a pass/fail fixture.

## Area → varga (per `_AREA_ROUTING`, `app/services/life_areas_service.py`)

| Area | Varga | Karaka(s) | Houses |
|---|---|---|---|
| RELATIONSHIPS | D9 | VENUS, JUPITER | 7, 2, 4, 8 |
| CAREER | D10 | SUN, SATURN | 10, 6, 2, 11 |
| HEALTH | D30 | SUN, MOON | 1, 6, 8, 12 |
| MONEY / WEALTH | D2 | JUPITER, VENUS | 2, 5, 9, 11 |
| EDUCATION | D24 | MERCURY, JUPITER | 2, 4, 5, 9 |
| CHILDREN | D7 | JUPITER | 5, 9 |
| PROPERTY | D4 | MARS, VENUS | 4, 11 |
| FOREIGN | D9 | RAHU | 3, 9, 12 |
| LITIGATION | D30 | MARS, SATURN | 6, 7, 8 |
| SPIRITUAL / SPIRITUALITY | D20 | KETU, JUPITER | 5, 9, 12 |

## After annotation

Once a row flips to `DONE`, engineering wires it into a golden-case test. For `RELATIONSHIPS`
rows this extends `test_marriage_gate.py`; for the other nine areas this is new coverage —
likely a `tests/reasoning/test_life_areas_golden.py` calling `assess_promise` /
`life_areas_service._score_area` / `contradiction.classify` directly per plan §Phase 1/§Phase 3,
the same shape as the existing marriage tests (D1 property test: BLOCKED can't be lifted by any
timing sweep; regression: STRONG/PROMISED_AND_TIMED charts stay strong).

## Coverage snapshot (2026-07-03)

| Reading | Rows |
|---|---|
| PROMISED_AND_TIMED | K3 (done), K5, K10, K14, K20 |
| PROMISED_NOT_NOW | K2 (done), K6, K12, K17 |
| ACTIVE_BUT_UNPROMISED | K4, K13 |
| NOT_PROMISED | K1 (done), K7, K8, K15, K19 |
| MIXED | K9, K16 |
| SILENT | K11, K18 |

Every life area in `_AREA_ROUTING` appears at least once; `HEALTH` (K8) is flagged for extra
tone-review care since it's the one `maraka_risk: True` area — a BLOCKED health reading is the
highest-stakes place for the non-fatalism rule (D6) to hold.
