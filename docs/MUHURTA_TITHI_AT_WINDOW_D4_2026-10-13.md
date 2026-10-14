# D4 — Muhurta windows elected on the tithi in force at them

**Date:** 2026-10-13 · **Branch:** `harden/production-readiness` · **Status:** implemented, not committed

## The question that surfaced it

A family searched Tonsure (Choulam), Tiruppur, October 2026. Top result: **Mon 26 Oct,
06:35–07:39**, carrying "Pournami is among the tithis Kalaprakasika says to avoid for the
tonsure (−14)". The almanac shows Pournami ending at **09:42**. Their question:
*"Why not do it after the Pournami ends?"*

## The ruling (astrology)

Moving past 09:42 does not help on 26 Oct, and the product now says so on the card.

| Limb | Before | Becomes | At |
|---|---|---|---|
| Tithi | Pournami | Krishna Prathamai | 09:42 |
| Lagna | Thulam (best for tonsure) | Vrischikam (avoid: "breed disease and distress") | 07:45 |
| Nakshatra | Aswini (favoured) | Bharani (excluded) | 17:41 |

1. **Prathamai is on the same avoid list** (Ch. V p.39: "Chathurthi, Prathamai, Shashti,
   Ashtami, Navami, Chathurdhasi, the New-Moon and the Full-Moon"). Tithi family: Pournami
   −14 + bright fortnight +6 = **−8**; Prathamai −14 + 0 = **−14**. Later is worse.
2. **The lagna falls away** after 07:45 (Thulam +8 → Vrischikam −10).
3. **Muhurta is a joint election.** Moving the clock moves every limb at once; you cannot
   repair one limb by sliding the time without paying on the others.

**Krishna 1–5 (not reopened, now documented).** Ch. V p.37–38 says the first five
dark-fortnight tithis are beneficent. The engine already reads that as a carve-out from the
*fortnight* penalty (PAKSHA → neutral), **not** as lifting a tithi the p.39 list names. Krishna
Prathamai is therefore paksha-neutral **and** tithi-avoided for the tonsure. Those are two
statements at two levels, both kept as printed. This is a lineage reading, recorded in
`muhurta_engine.TITHI_FAMILY`'s docstring; the other reading exists.

## The defect it exposed (engineering)

`score_day` judges the tithi at **sunrise** (R-1: the sunrise tithi *names* the day). The
picker could return a window hours later, in the next tithi, and the card still showed the
sunrise verdict. `limb_factors_at_window` already re-judged karana and nakshatra at the
window, but **never the tithi**. This is the same class as D1: a window certified by a reason
that didn't hold during it.

**Measured** (Tiruppur, 2026-10-01 + 182 days × 30 sourced activities, synthetic lagna so the
hora path runs):

| | Before | After |
|---|---|---|
| Offered window judged on a tithi not in force | **595** | **0** |
| Offered window inside a tithi the activity's text **vetoes** | **40** | **0** |
| Vetoed moment chosen while an electable one existed | n/a | **0** |
| Days rescued (only the sunrise tithi was vetoed; a clear window is permitted) | — | 76 |
| Days lost (every clear window sits in a vetoed tithi) | — | 3 |
| Offered windows that moved | — | 798 of 3,750 |
| Score change on offered cells | — | 615 cells, −47 … +49, median +14 |

## What changed

- **Engine** (`app/calculations/muhurta_engine.py`, pure): `TITHI_FAMILY`
  (ALMANAC_TITHI, TITHI, PAKSHA), `tithi_factors` (the same three calls `score_day`
  makes, so a one-tithi day gets byte-identical results), `tithi_span_at`,
  `tithi_factors_at` (returns None, not a guess, when there are no spans, i.e. pre-v43), and
  `karana_avoided_at` (now shared with `limb_factors_at_window`).
- **Picker** (`app/services/muhurta_service.py`): every candidate is cut wherever its
  judgement changes (tithi, an excluded karana, and on the shortlist the rising sign).
  Pieces that judge the same are merged back. Candidates are ranked on
  **hora credit + what the moment is worth**, and a vetoed moment is never preferred.
  Plain good kalas now compete in the same ranking rather than acting only as a fallback;
  where the limbs judge alike, a hora window still wins exactly as before.
- **Re-judging:** the day's tithi family is replaced by the window's (`_rejudged_at_window`).
  `vetoed` is recomputed, which is what rescues or drops a day.
- **Shortlist re-election:** with the lagna schedule known, each top-5 window is re-elected
  over hora, Gowri, tithi **and lagna**, and rebuilt if it moves. Side effect, same defect
  class: 28 Oct's tonsure window used to open in **Kumbham** (Ch. V: "Aquarius should be
  totally avoided") while its chip said "Meenam rises", because the lagna was read only at
  the midpoint. It now opens at 15:34.
- **Explanation chip** `TITHI_AT_WINDOW` (NEUTRAL, 0 points, `LIMB_AT_WINDOW_DISCLOSURE`),
  placed after the tithi verdicts. It says which tithi governs the window, and when that
  tithi is avoided it says why the time wasn't moved: the other daylight tithi is no
  kinder; it is kinder but has no clear Gowri period; or it is kinder but loses on the rest,
  naming the rising sign when that is the reason. The chip is read back from the election,
  not written separately. Tamil uses period-words (காலை 9:42) and the advisory register.

Response shape is unchanged: one new `factor` string value. No client keys on factor names
(grepped `web/`, `mobile/`, `packages/`), so this is not a four-surface contract change.

## Result for the reported search (Tonsure, Tiruppur, 13–31 Oct, general mode)

| Before | After |
|---|---|
| 30 Oct 12:04–12:28 · 90.4 | 30 Oct 12:04–12:28 · 90.4 |
| 26 Oct 06:35–07:39 · 86.8 | 26 Oct 06:35–07:39 · 86.8 **+ explanation** |
| 28 Oct 15:01–16:29 · 81.0 | **23 Oct 16:31–17:35 · 82.0** (Thrayodasi, favoured; the day is named for Dvadasi) |
| 22 Oct 12:05–13:34 · 80.8 | 28 Oct **15:34**–16:29 · 81.0 (Kumbham part removed) |
| 19 Oct 06:34–07:39 · 80.0 (Ashtami, avoided) | 22 Oct **12:20**–13:34 · 80.8 |

## What the gates cannot see

- `tests/test_muhurta_tithi_at_window.py` asserts the **API factor list**, not the rendered
  card. No browser pass has been done.
- The Tamil copy (4 new sentence shapes) has **not** had a native review; tests check
  script and period-words only.
- `paksha=` still selects days by their **sunrise** fortnight, so on a Pournami/Amavasai
  transition day the window can be elected in the other fortnight.
- Picker cost rose ~6× in isolation (≈0.7 ms per day-activity). The 19-day end-to-end
  search went 0.86 s → 0.95 s.

## Still open: astrology owed to the family that asked

- **Ayana (Ch. V p.37, `KP_CH5_TONSURE_AYANA_001`, NOT IMPLEMENTED):** "most beneficent
  when the Sun is in northern course; the other half of the year is unfavourable." Every
  October date is in Dakshinayana. Utharayana is Thai → Aani (≈ 14 Jan – mid-Jul).
- **Year rule (`KP_CH5_TONSURE_YEAR_001`):** 3rd, 5th or 7th year; 3rd best. The picker
  takes no child birth date.
