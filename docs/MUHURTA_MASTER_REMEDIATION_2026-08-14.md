# Muhurta Master Remediation — Explanations, Methods & Measures

**Date:** 2026-08-14 (updated 2026-08-15)
**Status:** IN PROGRESS — B3 done, B4 part done, `factors[]` shipped on all four surfaces. See §4.1, §6.4, §8 Phase B and §9.4 for what changed and what it cost to find out.
**Branch:** `harden/production-readiness`
**Supersedes:** `docs/muhurta-two-mode-plan.md` (earlier draft, same session)
**Trigger:** astrologer's written description of the correct Thirukanitham muhurta method for a gold purchase, plus the product decision that every timing surface must serve **both** a personalised and a general audience.

---

## 0. Reading guide

| If you want… | Go to |
| --- | --- |
| The one-paragraph verdict | §1 |
| What each astrological factor *is* and why omitting it breaks the answer | §3 |
| Proof of what we do and don't compute today, with file:line | §4 |
| Bugs that are live right now | §5 |
| The design we're building | §6–§7 |
| The work, phased | §8 |
| **How we will know it's fixed** — acceptance criteria, gates, budgets | §9 |
| What we cannot build without the astrologer | §11 |

---

## 1. Verdict in one paragraph

The astrologer's method is sound and is a **strict superset** of what Vinaadi computes. He names eight factors; we fully satisfy **two** (tithi, and Rahu Kalam / Yamagandam / Kuligai avoidance). Three factors are missing outright (Chandra Bala, Durmuhurtham, Muhurta Lagna). Three exist but are unreachable, siloed, or discarded before they affect the answer (Tara Bala, Nakshatra, Hora). Separately, our two modes — personal and general — are implemented as **two different scoring engines on two different endpoints**, and the personal one is hardwired to the account owner's own chart, so a family user cannot ask a timing question about their spouse or child at all. The fix is one engine, five layers, an optional `Subject`, and six reference tables we do not yet have.

---

## 2. What "fixed" means

Vinaadi is fixed when all five statements are true:

1. **Both modes, everywhere.** Every surface that names a day or a time offers *Personal* (any family-vault member) and *General* (location + date only).
2. **One engine.** General mode is the same code path with the personal layer switched off — not a parallel implementation that drifts.
3. **All eight factors participate.** Each factor either raises the score, lowers it, or vetoes the window — and says so in the response.
4. **The stated reason matches the returned time.** No window may cite a justification that occurs at a different hour than the window itself.
5. **It survives the astrologer's own test.** Given "Chennai, next 7 days, gold", our No. 1 day and No. 1 time match his, or the divergence is explained by a named factor we can defend.

---

## 3. The doctrine — what each factor is, and what breaks without it

This section exists so that whoever implements the engine understands *why* each rule is there. Where the astrologer's wording is the source, it is quoted.

### 3.1 Sunrise at the activity location
Every Thirukanitham day-division — Gowri Panchangam, Rahu Kalam, hora sequence, Nalla Neram — is derived by dividing the interval between **sunrise and sunset at the place the event happens**. Chennai and Coimbatore differ by roughly 20 minutes of sunrise.

**Without it:** every derived window is offset. A Rahu Kalam we report as clear may in fact overlap. This is not a rounding error — it shifts every one of the day's eight Gowri segments.

**Our bug:** we use the *birth profile's* location, so a Chennai-born user buying gold in Coimbatore gets Chennai's day-divisions.

### 3.2 Tithi — the lunar day
The 30 lunar days carry inherent character. **Rikta tithis** (4, 9, 14 of each paksha) are void — traditionally avoided for beginnings. **Shukla paksha** (waxing) favours growth and acquisition; **Krishna paksha** (waning) favours completion and reduction. Gold is an acquisition, so waxing is preferred.

**Without it:** you recommend a starting day that tradition explicitly voids.

**Status:** implemented, and the only factor implemented well in both engines.

### 3.3 Nakshatra and Pada — the Moon's mansion
The Moon's exact nakshatra (and its quarter) is, for most Tamil muhurta work, the **single strongest day-selection factor** — stronger than the weekday. Nakshatras carry activity-specific suitability: Pushya/Poosam is the classical star for gold and wealth acquisition; others are inauspicious for the same act while being fine for travel or study.

The astrologer is explicit that it is necessary but not sufficient: *"Nakshatra alone is not enough."*

**Without it:** you are choosing days on the two weakest signals. Concretely, our month-level "top 5 dates" ranker consults tithi, paksha, and weekday only — it will happily rank a Bharani day above a Pushya day for a gold purchase.

### 3.4 Tara Bala — the 9-fold star strength (**personal**)
Count from the person's **birth star** to the day's star; the count mod 9 yields one of nine taras — Janma, Sampat, Vipat, Kshema, Pratyak, Sadhaka, Vadha, Mitra, Ati-Mitra. Sampat, Kshema, Sadhaka, Mitra and Ati-Mitra are favourable; Vipat, Pratyak and Vadha are to be avoided.

**This is the factor that makes a muhurta personal.** As the astrologer puts it: *"the same Muhurtham may be excellent for one person but only average for another."*

**Without it:** every user gets the same answer. Our "personalised" muhurta is, on the day-selection axis, nearly impersonal.

**Our situation:** `_tara_number()` is implemented — but privately, inside the curated wedding-date service. The muhurta picker cannot call it.

### 3.5 Chandra Bala — the Moon's position from Janma Rasi (**personal**)
The Moon's transit house counted from the native's birth Moon sign. The 4th, 8th and 12th are classically weak; the 8th is **Chandrashtama**, a whole-day veto for important beginnings.

The astrologer's worked example is precisely this: *"If the Moon is in an unfavorable position — such as the 8th from the buyer's Janma Rasi — … I may reject that period and select another one."*

**Without it:** you recommend a day the tradition would reject outright.

**Our situation:** we detect the 8th house only (`Chandrashtama`, −20 points, and only in one of the four engines). The other eleven positions are not evaluated anywhere.

### 3.6 Jupiter and Venus — the wealth karakas
For acquisitions of value — gold, property, luxury, savings — Guru (Jupiter, expansion and wealth) and Sukra (Venus, valuables and luxury) are the significators. Their **transit condition on the candidate day** matters: combustion, retrogression, debilitation, or an inimical sign weakens the muhurta even when the almanac reads well.

**Without it:** you can recommend an excellent almanac day on which the wealth karaka is combust.

**Our situation:** Jupiter and Venus appear in `_ACTIVITY_LORDS` only as *dasha* lords. Their transit dignity on the candidate day is never examined by any timing engine.

### 3.7 Rahu Kalam, Yamagandam, Kuligai, Durmuhurtham — the exclusion bands
Fixed inauspicious segments of the day. The first three are weekday-indexed eighths of the daylight span. **Durmuhurtham** is a separate, finer set of segments — typically two per day, weekday-dependent, each about 48 minutes — and it is routinely excluded for new financial activity.

**Without it:** you recommend a window inside a band every Tamil almanac prints in red.

**Our situation:** the first three are handled in three of four engines. **Durmuhurtham does not exist anywhere in `app/`** — the term returns zero matches.

### 3.8 Hora — the planetary hour
The day is divided into 24 horas ruled in the Chaldean order. For gold, **Guru hora or Sukra hora** is preferred. Personalised further, the hora of the **lagna lord** or the running **dasha lord** is the strongest personal slice of the day.

**Without it:** your window is chosen at day-granularity and the clock time is essentially arbitrary within it.

**Our situation:** we compute this correctly and then **throw the result away** — see D1 in §5.

### 3.9 Muhurta Lagna — the ascendant at the chosen moment
The most precise layer. For the exact proposed minute, compute the rising sign; then examine whether the **2nd house (accumulated wealth)** and **11th house (gains)** are strong and unafflicted, and whether the Moon or a malefic sits badly relative to the buyer.

**Without it:** you cannot distinguish two windows that are equal on every almanac factor — which is exactly the choice between "Best 10:42–11:27" and "Second choice 1:18–1:56".

**Our situation:** lagna is computed **once per day, at sunrise** (`panchangam.py:1848`), yielding one rasi and the time it ends. There is no lagna schedule across the day, so no engine can answer "what is rising at 10:42?" The primitive to build it — `calculate_lagna_degree(jd, lat, lon)` — exists.

---

## 4. Current-state audit

### 4.1 Factor coverage

| # | Factor | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Sunrise at activity location | ⚠️ wrong location | `app/services/muhurta_service.py:298` — `resolve_effective_daily_location(bp)` is the **birth profile's** location; no activity-location parameter exists on the route (`app/api/muhurta.py:25`) |
| 2 | Tithi | ✅ | `muhurta_service.py:161`; `app/calculations/activity_timing_rules.py:255` |
| 3 | Nakshatra + Pada | ✅ day-level (B4 done 2026-08-15); pada still absent | `assess_activity_timing()` now takes `nakshatra_number` and judges it on the **sourced** table where one exists (marriage → Kalaprakasika Ch. XIV) and on the generic `SUBHA_NAKSHATRA_NUMBERS` list otherwise, **labelled as generic in the copy**. The engine keeps the two apart as `NAKSHATRA` vs `ALMANAC_NAKSHATRA`. Gold/property still ride the generic layer until Ch. XXI lands (§11 item 2) |
| 4 | Tara Bala | ⚠️ siloed | `app/services/muhurtham_naal_service.py:211` `_tara_number()` — private, used only by `match_muhurtham_naals` |
| 5 | Chandra Bala | ❌ missing | no match for `chandra_bala` in `app/`; only the 8th-house case at `muhurta_service.py:168` |
| 6 | Jupiter / Venus transit condition | ❌ missing | `_ACTIVITY_LORDS` (`muhurta_service.py:47`) treats them as dasha lords only |
| 7 | Rahu/Yama/Kuligai | ✅ | `muhurta_service.py:345-350`; `app/services/_dg_hora.py:111` |
| 8 | Durmuhurtham | ❌ missing | zero matches for `durmuhurt` in `app/` |
| 9 | Hora | ✅ in the picker (D1/D2 fixed 2026-08-14); still discarded elsewhere | `muhurta_service._best_time_window` now returns hora ∩ Gowri kala — see §5.1 |
| 10 | Muhurta Lagna / 2nd & 11th | ❌ missing | `panchangam.py:1848` computes lagna at sunrise only |

**Score: 2 of 10 fully satisfied.**

### 4.2 Mode coverage

| Engine | Personal | General | Note |
| --- | --- | --- | --- |
| `muhurta_service.find_best_muhurta_slots` | ✅ | ❌ | chart mandatory (C1 still open) |
| ~~`public_tools._score_public_muhurta`~~ | — | — | **DELETED 2026-08-15 (B3).** `/public/muhurta` calls `score_day(..., subject=None)` |
| `daily_guidance_service.get_activity_timing` (`:1328`) | ✅ | ❌ | chart mandatory, but the underlying rules need no chart |
| `activity_timing_rules.daily_activity_board` (`:539`) | partial | ✅ | takes a pre-computed `is_chandrashtama` flag |
| `muhurtham_naal_service.match_muhurtham_naals` (`:237`) | ✅ | ✅ | **the reference implementation** |
| `_dg_hora._best_hours` (`app/services/_dg_hora.py:352`) | ✅ | ✅ | has a genuine pre-chart fallback at `:145` |

### 4.3 The family gap

Every dashboard timing component receives `personal.chartId` — the account owner's own chart. Family members are unreachable.

The plumbing to fix this **already exists**: `web/components/dashboard-workspace.tsx:1021` resolves `lifeAreasViewId → member?.chart.chartId ?? personal.chartId` for the Life Areas tab, and `web/components/dashboard-plan-muhurtham-naal-nova.tsx:163` already handles `chartId === null` as general mode. Reuse both patterns; do not invent a third.

---

## 5. Defect register — live now, independent of this plan

| ID | Severity | Status | Defect |
| --- | --- | --- | --- |
| **D1** | High — user-visible contradiction | **FIXED 2026-08-14** | **The personal hora never moved the clock.** `_score_hora()` located the lagna-lord hora and wrote *"Lagna lord Venus hora (2:14 pm–3:16 pm) — strongest personal window"* into `horaSupport`. The returned `timeStart`/`timeEnd` came from `_best_time_window()`, which read **only** Gowri Nalla Neram or Abhijit. The slot shown and the reason printed beside it named different hours. |
| **D2** | Medium | **FIXED 2026-08-14** (daytime scope kept) | **First match, not best match.** `_score_hora` scanned `snap.hora[:12]` and returned on the first hit — a lagna-lord hora at index 9 lost to a generic Venus hora at index 2. |
| **D3** | High — fabricated astrology | **FIXED 2026-08-14** | `decisions_service._optimal_window()` returned `target_date + 21 days` or `+ 45 days` selected by verdict string. It was presented to the user as an optimal window and contained no astrological computation whatsoever. |
| **D4** | Medium | open | **Almanac drowns personalisation.** `daily_guidance_service.py:1439` ranks by `alignment_rank * 100 + score`. The almanac alignment term (0/100/200) dominates a 0–100 personal score, so the chart can only reorder days *within* a bucket. |
| **D5** | Low | open | Muhurtham-naal times are a **static weekday lookup** (`muhurtham_naal_service.py:141`), not computed for the date or location, while the surrounding date ranking *is* personalised — an inconsistency in one response. |
| **D6** | Medium — user-visible | **FIXED 2026-08-15** | **Latin names inside Tamil reason copy.** The engine composed both languages from the snapshot's own fields, which are uppercase transliterated codes: the Tamil reason read *"…பதினொரு நட்சத்திரங்களுள் **Aswini** ஒன்று."* and *"சூரிய உதயத்தில் **Rishabam** லக்னம்"*. It affected the nakshatra, tithi, yoga and lagna-sign factors in both modes. All four now compose from `app/calculations/display_names.py`; the tithi table moved there from `activity_timing_rules` so the two modules share one. Pinned by `test_tamil_reason_copy_never_carries_a_latin_star_name`, which flags any ASCII run in a Tamil reason. New Tamil strings from this change remain pending native review, per the standing convention. |

### 5.1 D1 / D2 — what shipped

`_score_hora` and `_best_time_window` are replaced by a single
`_best_time_window(snapshot, activity, lagna_rasi)` that returns the window and
the hora credit together. The window is the **intersection** of a favoured hora
with a good Gowri day kala clear of Rahu Kalam / Yamagandam / Kuligai, so the
returned clock range always lies inside the hora its own reason names. Every
hora/kala pair is ranked — lagna-lord hora, then the kala's own rank, then
earliest — instead of returning on the first hit.

Two consequences worth stating plainly:

- **The hora bonus is now earned only by a usable window.** A favoured hora
  spent entirely inside Rahu Kalam no longer lifts a day's score, and no hora is
  named when none is usable. Day rankings will shift.
- **Windows are narrower.** They are now an intersection (typically 30–60 min),
  not a whole Gowri kala (~95 min).

The contradiction was not occasional. Over the seven days from 2026-08-17 in
Chennai, for `PURCHASE`, the old window and the hora its own reason named
**failed to overlap on all seven** — e.g. Mon 17 Aug returned 06:00–07:33 beside
a reason naming the 08:04–09:06 Guru hora. `tests/test_muhurta_hora_window.py`
reproduces the old pairing and asserts it disagrees, so the fix cannot be
quietly reverted.

**Left open deliberately:** the returned window is still daytime. Night horas
are scanned but cannot intersect a DAY kala, so they never win. Extending the
picker to evening windows is a product decision that needs §11 input — and
ranking a night window has already walked this repo into the small hours once
(see `_compute_gowri_nalla_neram`).

### 5.2 D3 — what shipped

`_optimal_window` now takes a `(date, lord)` computed by `_next_dasha_shift`
from the chart's own Vimshottari timeline: the end of the **running
antardasha**, and the lord that takes over. FAVOURABLE still names the date the
user asked about. When the timeline cannot be built, the copy names **no date**
rather than inventing one.

The antardasha is chosen over the pratyantardasha on purpose: `whatif_service`'s
dasha pillar — one of the three this brief is scored on — reads the mahadasha
and antardasha lords and nothing finer, so the pratyantar boundary would change
none of the brief's own inputs. The cost is horizon: an antardasha runs months
to a few years, so the line can point a long way out. A tighter "next
favourable window" needs the muhurta engine, and is the remaining half of B5.

D4 remains defensible as an immediate fix before the larger build.

---

## 6. Target architecture

### 6.1 One engine, one optional subject

```
app/calculations/muhurta_engine.py          # new, pure — no DB, no HTTP

@dataclass(frozen=True)
class Subject:                              # the personal layer's entire input
    janma_nakshatra: int                    # 1..27  → Tara Bala
    janma_rasi: int                         # 1..12  → Chandra Bala, Chandrashtama
    lagna_rasi: int                         # 1..12  → lagna-lord hora, 2nd/11th
    maha_lord: str
    antar_lord: str

def score_day(snapshot, activity, subject: Subject | None) -> DayScore
def rank_windows(snapshot, activity, subject: Subject | None) -> list[Window]
```

`subject=None` **is** general mode. Every personal rule short-circuits; nothing else changes. There is no second code path to keep in sync.

### 6.2 Five layers, in evaluation order

| Layer | Runs when | Consumes |
| --- | --- | --- |
| **L1 Almanac** | always | tithi, nakshatra+pada, yoga, karana, weekday, sunrise/sunset, kalams, durmuhurtham |
| **L2 Activity** | always | per-activity nakshatra / tithi / weekday preference tables (§11 Q2) — *"Poosam for gold"* lives here |
| **L3 Graha** | always | transit dignity of the activity's karakas — Jupiter & Venus for wealth |
| **L4 Personal** | `subject is not None` | Tara Bala, Chandra Bala, Chandrashtama, dasha support, lagna-lord hora |
| **L5 Lagna** | only for candidate *windows*, only for top-N days | rising sign at the candidate minute; 2nd/11th occupancy and affliction |

L5 is deliberately last and narrow — see the performance budget in §9.5.

### 6.3 Veto vs. penalty

Two distinct mechanisms, never conflated:

- **VETO** — the window is removed from the result and, if the user asked about that specific time, appears in the **Avoid** band with the vetoing factor named. Vetoes: Rahu Kalam / Yamagandam / Kuligai / Durmuhurtham overlap; Chandrashtama (personal); Vadha tara (personal, pending §11 Q4).
- **PENALTY** — a weighted score reduction that can be outweighed. Everything else.

A general-mode result can never be vetoed by a personal factor — that is the definition of the mode.

### 6.4 Response contract

```
mode: "PERSONAL" | "GENERAL"
subjectLabel: str | null            # "Meera" | null
location: { lat, lon, tz, label }   # the ACTIVITY location, echoed back
bands: {
  best:         Window   | null
  secondChoice: Window   | null
  avoid:        Window[]            # with the vetoing factor on each
}
factors: FactorResult[]             # every factor: name, verdict, contribution, bilingual reason
```

`factors[]` is what lets the UI render the astrologer's *"I would then explain exactly why each period was selected or rejected"* — and it is also the audit trail that makes §9's validation possible.

**Shipped 2026-08-15** on `MuhurtaSlot.factors`, across all four surfaces per CLAUDE.md (`app/schemas/muhurta.py`, `packages/shared/src/types/index.ts`, `web/`, `mobile/`). Until then the engine computed verdicts, citations and the tithi conflict and the API dropped every bit of it except the penalties, folded anonymously into `cautions` — the product had paid for provenance nobody could see. Each factor carries:

| Field | Why it is separate |
| --- | --- |
| `verdict` | Five states, and two of the distinctions are load-bearing. `UNSOURCED` ≠ `NEUTRAL`: "we checked and it is fine" and "we have no table to check against" must never render alike. `VETO` ≠ a large `PENALTY`: a veto removes the day and cannot be outweighed, so it renders as an exclusion, not a low score. |
| `contribution` | The signed weight. `ENGINE_POLICY`, never presented as traditional. |
| `sourced` | True only when the rule is **primary-text confirmed** (`RuleSource.is_primary_text_confirmed()`), not merely when a `rule_id` exists. A citation on screen claims a named page of a named edition says this. |
| `citation` | tradition / chapter / page / passage / edition, resolved through `muhurta_engine.resolve_rule_source`. |
| `conflict` | The unresolved-in-the-source case — e.g. the best-tithi list overlapping the Krishna post-Ashtami sweep — surfaced to the reader rather than silently resolved. |

`factors` is a **superset** of `cautions` (every caution is a PENALTY factor in it, including the per-window kalam overlaps), so a surface renders one list or the other, never both. `cautions` stays for back-compat; new UI reads `factors`.

Two things deliberately **not** done here: the kalam-overlap factors carry `contribution: 0.0` because what an overlap should cost on the fallback window path is an open doctrine question (§6.3 argues for a veto), and the public `/muhurta` response keeps its flat shape — repointing its scoring was B3, reshaping its DTO is separate.

---

## 7. Mode semantics — the contract

| | Personal | General |
| --- | --- | --- |
| Input | `chartId` (owner **or any family-vault member**) + activity + range + activity location | activity + range + activity location |
| Layers | L1–L5 | L1–L3, L5 |
| Personal vetoes | apply | never |
| Copy | "Strong for **Meera** — Sampat tara from her star Rohini" | "Strong day by the almanac — Poosam nakshatra, waxing Moon" |
| Honesty rule | — | must **never** imply personalisation. No "for you" phrasing in general mode. |

The honesty rule matters: a general answer that reads as personal is worse than no answer, because the user acts on it believing their chart was consulted.

---

## 8. Methods — the work, phased

### Phase A — foundations (no user-visible change)

| ID | Work | Files |
| --- | --- | --- |
| A1 | Extract `_tara_number` into `app/calculations/tara_bala.py`; add `chandra_bala()` alongside. Naal service calls the shared version. | new `app/calculations/tara_bala.py`; `app/services/muhurtham_naal_service.py` |
| A2 | Durmuhurtham segments added to the panchangam snapshot | `app/calculations/panchangam.py`, `app/schemas/panchangam.py` — **blocked on §11 Q1** |
| A3 | Full-day lagna schedule — 12 rising windows per day via `calculate_lagna_degree` | `app/calculations/panchangam.py` (extends `:1848`) — see §9.5 budget |
| A4 | Per-activity preference tables | ✅ **Eleven activities sourced.** `app/data/marriage_muhurta_rules.py` (Ch. XIII–XIV), `app/data/kalaprakasika_samskara_rules.py` (Ch. III–IV: naming, annaprasana, ear-boring) and `app/data/kalaprakasika_treasure_rules.py` (Ch. XXI: treasure, gold, gems, grain, land-possession, land-purchase, cattle), all page-cited with `RULE_SOURCES` records via `app/calculations/muhurta_doctrine.py`. Bound to the engine by `app/data/muhurta_activity_registry.py`; MARRIAGE deliberately keeps its own engine branch because its paksha-conditional tithi tiers do not fit the registry's flat shape |
| A5 | Transit dignity helper for karaka grahas | reuse `app/calculations/functional_nature.py` / `chart_strength.py` |

### Phase B — the engine

| ID | Work |
| --- | --- |
| B1 | Build `muhurta_engine.py` with the `Subject \| None` contract and the L1–L5 layers |
| B2 | Port `muhurta_service` onto it. D1/D2 are **already fixed in place** (§5.1) — the port must carry the intersection rule over, and add durmuhurtham to it once §11 Q1 lands |
| B3 | ✅ **DONE 2026-08-15.** `_score_public_muhurta` deleted; `/public/muhurta` calls `score_day(..., subject=None)`. Required moving the generic almanac layer **into** the engine as L1 first — without it, general mode for an unsourced activity would have returned an identical score every day (§9.4 note below) |
| B4 | ⚠️ **PART DONE 2026-08-15.** Nakshatra added to `assess_activity_timing` and wired at every call site holding a snapshot. **Tara Bala and the D4 re-weight are still open** — both need `get_activity_timing` to build a `Subject`, which is the same work as C2 |
| B5 | D3's fabrication is **already fixed** (§5.2). What remains: point `decisions_service` at the engine so a defer verdict can name a real *muhurta* window, not just the next antardasha |

### Phase C — API

| ID | Work |
| --- | --- |
| C1 | `GET /muhurta`: `chartId` becomes **optional**; add `lat`/`lon`/`tz` for the activity location, defaulting to the chart's daily location when a chart is given |
| C2 | Same for `/activity-timing` |
| C3 | Typed wrappers in `packages/shared/src/api/` — per CLAUDE.md, **re-read the FastAPI route decorators** when wiring; two wrappers have silently drifted before |
| C4 | Keep `assert_chart_owner` on every path where `chartId` is supplied — a personal muhurta discloses birth-star information |

### Phase D — UI, every surface

| ID | Work |
| --- | --- |
| D1 | Shared `<SubjectSelector>`: *General* + every family-vault member, reusing the `lifeAreasViewId` resolution at `dashboard-workspace.tsx:1021` |
| D2 | Mount on: muhurta picker, plan muhurta panel, activity-timing card, today glance best-hours, today activity board, calendar tab, mobile today |
| D3 | Activity-location picker on the muhurta picker, defaulting to the profile's daily location |
| D4 | Render the **Best / Second choice / Avoid** three-band result with per-factor reasons, bilingual |
| D5 | Mobile parity — `mobile/app/(tabs)/today.tsx` and the mobile plan surface |

### Phase E — validation
Covered in §9.

---

## 9. Measures — how we will know it is fixed

### 9.1 Per-factor acceptance criteria

Each factor is "done" only when all three hold: it is computed, it demonstrably changes at least one output, and it is named in `factors[]`.

| Factor | Acceptance test |
| --- | --- |
| Activity location | Same date, same chart, Chennai vs Coimbatore → sunrise differs, and at least one Gowri/kalam boundary shifts accordingly |
| Nakshatra | For a gold activity, a Poosam day outranks an otherwise-identical non-favoured-star day in the month ranker |
| Tara Bala | Two family members, same date range, same activity → **different** day ordering, and the diff is attributable to named tara values |
| Chandra Bala | A day with Moon 8th from Janma Rasi is vetoed, not merely penalised; 4th/12th are penalised with the position named |
| Jupiter/Venus | A day on which Venus is combust scores lower for `PURCHASE` than the same almanac day with Venus direct and dignified |
| Durmuhurtham | No returned Best or Second-choice window intersects a durmuhurtham segment |
| Hora | **The returned window's clock time falls inside the hora named in its own reason** — this is the direct regression test for D1. ✅ pinned by `tests/test_muhurta_hora_window.py` over a 60-day × 4-activity sweep |
| Muhurta Lagna | Two windows equal on L1–L4 are separated by 2nd/11th strength, and the response says so |

### 9.2 Golden cases — the primary gate

Per this repo's standing rule that domain calculation bugs are silent and unit tests do not catch them, the authoritative gate is **golden cases validated against the astrologer's own answers**, not assertions we wrote ourselves.

Minimum set, each with the astrologer's expected Best / Second / Avoid:

| # | Case | Exercises |
| --- | --- | --- |
| G1 | Gold purchase, Chennai, a known Pushya day | nakshatra, Jupiter/Venus, hora |
| G2 | Same day, same city, **two different birth stars** | Tara Bala differentiation |
| G3 | A day that is Chandrashtama for one subject only | personal veto |
| G4 | Same date, Chennai vs Coimbatore | activity location |
| G5 | A day where the almanac is excellent but Venus is combust | L3 outweighing L1 |
| G6 | General mode, no chart, "Chennai, next 7 days" | mode honesty, no personal claims |

**Pass criterion:** our No. 1 day matches the astrologer's for ≥5 of 6, and every divergence is explained by a named factor we can defend in review. A divergence we cannot explain is a bug, not a difference of opinion.

Golden cases use **synthetic birth identities only** — no real profiles, names or exact coordinates, per repo policy.

### 9.3 Regression gates (must pass before merge)

1. `pytest` green, including new engine tests
2. **D1 invariant test**: for every returned window across a 60-day sweep, the window's clock range ⊆ the hora range named in its own reason
3. **No-kalam invariant**: no Best or Second-choice window intersects Rahu Kalam, Yamagandam, Kuligai, or Durmuhurtham — asserted over a 60-day sweep, not a single day
4. **Mode-differentiation test**: personal and general runs over the same range must differ, and every difference must map to a personal factor in `factors[]`
5. **Mode-honesty test**: no general-mode string contains a second-person personalisation claim
6. `npm run typecheck` + `npm test` in `web/`, and mobile `tsc` + jest — both belong in the routine gate
7. **Contract parity**: the four surfaces (`app/api/`, `packages/shared/src/api/`, `mobile/`, `web/`) grep-checked for every changed route, param, and field in the same change

### 9.4 Duplicate-logic gate — ✅ CLOSED 2026-08-15

There is exactly **one** function in the repo that scores a day for a muhurta: `muhurta_engine.score_day`. Pinned by `test_there_is_exactly_one_day_scorer_in_the_repo`, which scans `app/` for a `def` of either dead scorer. It matches the `def` rather than the bare name, because the surviving comments deliberately name both to record where the logic went — the literal `grep` this section originally specified would flag that history as a violation.

**What the duplication had already cost**, found while merging the two copies:

- **Amavasai scored −5 in `public_tools` and 0 in `muhurta_service`.** Resolved toward the penalty: a day we print a caution for and then score as though we had not is the silence-taken-for-approval failure the engine exists to prevent.
- **Neither copy consulted the sourced per-activity doctrine.** A public MARRIAGE query was judged without the Kalaprakasika table the signed-in one used — the same question, two answers, depending on whether you were logged in.
- **The yoga name was appended to the *support* string unconditionally in both**, so a day carrying Vyatipata or Vaidhriti read back to the user as *supported by* it. The yoga is now its own `ALMANAC_YOGA` factor, NEUTRAL and zero-weight, which says it is ungraded instead of posing as a reason.
- **Both compared nakshatra names with a `.upper().replace("H", "")` fuzz** guarding a spelling mismatch that does not exist — all 17 `SUBHA_NAKSHATRAS` resolve cleanly against `NAKSHATRA_NAMES`. The set is keyed by number now (`SUBHA_NAKSHATRA_NUMBERS`).

**Consequence to expect:** day scores and orderings shift. General mode gains the doctrine layer it never had, and Amavasai now costs points on the picker.

### 9.5 Performance budget

The lagna schedule is the expensive addition and needs a measured ceiling.

`_find_lagna_rasi_boundary_jd` (`panchangam.py:1341`) steps in 1-hour increments and then bisects 48 times — roughly **50 `calculate_lagna_degree` calls per boundary**. A full-day schedule is 12 boundaries ≈ **600 ephemeris calls per day**. Over the picker's 60-day maximum range that is ~36,000 calls, against a panchangam pipeline previously tuned from 2.28s to 0.251s per day.

**Therefore L5 is two-stage and non-negotiable:**
1. Rank all candidate days on L1–L4 only (cheap).
2. Compute the lagna schedule **only for the top 5 days**.

Budgets:

| Metric | Ceiling |
| --- | --- |
| 60-day personal muhurta request, p95 | ≤ 1.5s |
| Added cost per day for L1–L4 vs. today | ≤ +15% |
| Lagna schedule, per day, when computed | ≤ 120ms |
| Days on which L5 runs, per request | ≤ 5 |

Measure before and after; a regression beyond these is a blocker, and the tuning history says these regressions hide easily.

### 9.6 Definition of done, per phase

| Phase | Done when |
| --- | --- |
| A | Shared Tara/Chandra Bala module has tests; durmuhurtham and lagna schedule present in the snapshot and cached; perf budget re-measured |
| B | One scoring function repo-wide; D1–D5 closed with regression tests; `/public/muhurta` served by the engine |
| C | Both routes serve both modes; shared wrappers added and verified against the route decorators; ownership checks intact |
| D | All seven surfaces carry the subject selector; three-band result renders bilingually; mobile at parity |
| E | ≥5 of 6 golden cases match the astrologer; all §9.3 gates green; **astrologer sign-off recorded in `ASTROLOGER_REVIEW_QUEUE.md`** |

---

## 10. Risks

| Risk | Mitigation |
| --- | --- |
| Lagna schedule blows the perf budget | Two-stage L5 (§9.5); cache the schedule with the panchangam snapshot |
| Tamil strings for new factors go out unreviewed | Route through the standing convention — new Tamil is pending native review until the astrologer approves it in chat |
| Weight tuning turns into guesswork | Weights come from §11 answers, not from fitting to a result we already like |
| The general/personal split confuses users | The mode is stated in the response and rendered on the card; honesty rule in §7 is gate 5 in §9.3 |
| Cache keys miss the new inputs | Activity location, durmuhurtham and subject identity all enter the cache key — a stale key would silently serve another city's or another person's answer |
| Scope drift into year-scale forecasting | `event_windows.py` (marriage/career/finance year windows) is explicitly **out of scope** here |

---

## 11. Blocked on the astrologer

Phase A cannot complete without these. They are reference data, not opinions — and per standing practice, the right move is to ask for the tables directly rather than offer multiple-choice.

**Status 2026-08-14/15:** the Kalaprakasika Ch. XIII–XIV extraction closed several of these from the primary text rather than from opinion — see `docs/MARRIAGE_EXTRACTION_WORKSHEET_KALAPRAKASIKA_CH14_2026-08-14.yaml` (page-cited, verified against 20 page images) and the encoded constants in `app/data/marriage_muhurta_rules.py`. Items below are re-marked accordingly. Note the scope limit: what the extraction settled is **marriage**, not gold — item 2's actual blocker for the astrologer's own worked example (a gold purchase) is untouched.

| # | Item | Status |
| --- | --- | --- |
| 1 | **Durmuhurtham table** — start offset from sunrise and duration, per weekday. (Blocks A2.) | **STILL BLOCKED.** The v2.3 spec registers two competing weekday-offset variants (A: DrikPanchang-style, B: sunrise-offset) and deliberately refuses to pick one. Resolution is empirical, not editorial — §Q1's validation protocol (20–30 dates × seasons × 4 TN cities, diffed against a printed Tamil panchangam) decides it, and the winning table may mix rows from both variants. |
| 2 | **Per-activity nakshatra lists** — favoured and forbidden stars per activity. (Blocks A4.) | **RESOLVED for ten activities, 2026-08-15.** *Marriage*: 11 stars, page-cited, with Magha and Mula explicitly **included** (a naive "Ugra/Tikshna = reject" rule would wrongly drop both). *Gold* — the astrologer's own example — is now sourced from Ch. XXI, along with gems, grain, land-possession and cattle (`app/data/kalaprakasika_treasure_rules.py`, worksheet `docs/sources/kalaprakasika_ch21_treasure_rules.md`). *Naming / annaprasana / ear-boring* are extracted from Ch. III–IV and wired end-to-end (`app/data/kalaprakasika_samskara_rules.py`). **Three findings worth carrying forward:** (a) Ch. XXI gives **no star list for *buying* land** — its 14-star list is scoped to *taking possession*, and the only buying rule is a weekday one; (b) **Annaprasana is the sole activity with a named forbidden-star set** (8 stars, veto-grade), and it forbids Ardra, which the naming chapter calls *good* — the two rites disagree, which is why they are not one activity; (c) the Ch. XXI grain material is one sentence — **Ch. XX (Harvest, pp.105–109) is the real grain chapter and is still unread.** |
| 3 | **Is gold its own activity?** | **RESOLVED in spec, unconfirmed by the astrologer.** v2.3 freezes the enum split (`PURCHASE_GENERAL / GOLD_VALUABLES / VEHICLE / PROPERTY / EQUIPMENT`). The *architecture* is safe to build against; the gold rule *contents* wait on item 2. |
| 4 | **Tara Bala weighting** — veto or large penalty for Vadha/Vipat/Pratyak? | **STILL BLOCKED, and deliberately so.** v2.3 draws a hard line here: the adverse *classification* is `PRACTICE_CONSENSUS`, but the severity *mapping* is `ENGINE_POLICY` — Vinaadi's product decision, not doctrine, unless a passage says "reject absolutely." No passage found yet. The proposed default (Vadha → veto, Pratyak → severe penalty promotable to veto, Vipat → penalty) needs sign-off **as policy**, and must not be presented to users as sastra. |
| 5 | **Chandra Bala** — which of the twelve positions veto, penalise, or pass? | **ANSWERED (spec Q5, frozen).** 3/6/10/11 strong bonus; 1/7 bonus; 2/5/9 neutral; 4/12 severe penalty; **8 = Chandrashtama = hard veto**, not compensable by any aggregate score. Same provenance caveat as item 4: the 8th-house veto is practice consensus, the rest of the mapping is engine policy. |
| 6 | **Muhurta Lagna** — is a strong 2nd/11th a bonus or a requirement? | **ANSWERED for the general rule (spec Q6, frozen):** bonus, never a prerequisite — an excellent Pushya + clean tara + clean Chandra Bala + clean lagna is never discarded for a middling 11th lord. Gold/investment upgrades it to strong bonus. **Marriage lagna signs are now primary-sourced:** best = Gemini/Virgo/Libra, avoid = Aries/Scorpio/Capricorn/Pisces. This *contradicted* the earlier "fixed lagna preferred for marriage" assumption — none of the three best signs is fixed. Still open: what counts as "strong" (occupancy vs lord's dignity vs aspect). |
| 7 | **Tie-breaking** — what decides between two almanac-equal windows? | **ANSWERED (spec L9, frozen).** Deterministic lexicographic: quality → largest boundary safety margin → earlier window. Worth confirming against his practice, since his example returns a Best *and* a Second choice. |

**Two findings worth the astrologer's attention** — both are cases where the primary text contradicted a rule we were about to build:

- **8th-house vacancy is not a marriage rule.** Ch. XIV says Saturn, Sun and Mars in the 8th *cause good*. The vacancy requirement is genuine — but for naming (Ch. III), ear-boring (Ch. IV), and the pre-marriage **Snaana** bath rite (p.68), which is a different moment from the marriage lagna. We had it queued to import into marriage.
- **The Magha-1 / Mula-1 / Revati-4 pada exclusions are absent from Ch. XIV.** The pada-sensitive rule that does exist (p.69) is a bride-star *compatibility* check, and the Magha/Mula pada danger is gandanta from the *natal* chapter. Does his practice apply the pada exclusions anyway? If so they are a school variant, not a Kalaprakasika rule, and should be flagged as such.

An open question the text itself did not settle, flagged rather than silently resolved: the marriage best-tithi list (2, 3, 5, 7, 10, 11, 13) overlaps in-paksha numbers 10/11/13 with the same page's "all tithis after Ashtami of Krishna Paksha are inauspicious." The most defensible reading is that the unqualified best-list is primarily Shukla-paksha and the Krishna sweep governs the dark fortnight — but that is an inference, and it needs his ruling before an engine acts on it.

---

## 12. Appendix — full surface inventory

### Backend

| Engine | File | Mode today | Disposition |
| --- | --- | --- | --- |
| Muhurta picker | `app/services/muhurta_service.py:269` | personal | port to engine (B2) |
| Public muhurta | `app/api/public_tools.py:781` | general | **delete** (B3) |
| Activity timing | `app/services/daily_guidance_service.py:1328` | personal | both modes (B4, C2) |
| Activity rules | `app/calculations/activity_timing_rules.py:593` | general | + nakshatra, + tara (B4) |
| Daily activity board | `app/calculations/activity_timing_rules.py:539` | general + flag | + optional chart layer |
| Muhurtham naals | `app/services/muhurtham_naal_service.py:237` | **both** ✅ | reference impl; fix D5 |
| Daily best hours | `app/services/_dg_hora.py:352` | both ✅ | + durmuhurtham exclusion |
| Panchangam | `app/services/panchangam_service.py` | general | unchanged — the almanac layer |
| Decisions | `app/services/decisions_service.py:128` | neither | fix D3 (B5) |
| Event windows | `app/calculations/event_windows.py:396` | personal | **out of scope** |

### Frontend

| Surface | File | Mode today |
| --- | --- | --- |
| Muhurta picker | `web/components/dashboard-plan-muhurta-picker-nova.tsx:144` | personal |
| Plan muhurta panel | `web/components/dashboard-plan-muhurta-nova.tsx:98` | personal |
| Activity timing card | `web/components/dashboard-activity-timing-card.tsx:108` | personal |
| Muhurtham naal | `web/components/dashboard-plan-muhurtham-naal-nova.tsx:163` | **both** ✅ |
| Today glance (best hours) | `web/components/dashboard-today-glance-nova.tsx` | personal |
| Today activity board | `web/components/dashboard-today-activity-board-nova.tsx` | personal |
| Calendar tab | `web/components/dashboard-calendar-tab-nova.tsx` | personal |
| Muhurta calculator | `web/app/(marketing)/tools/muhurta-calculator/MuhurtaTool.tsx:126` | general |
| Panchangam planner | `web/app/(marketing)/tools/daily-panchangam-planner/` | general |
| Panchangam by date | `web/app/(marketing)/panchangam/[date]/page.tsx` | general |
| Mobile today | `mobile/app/(tabs)/today.tsx` | personal |
