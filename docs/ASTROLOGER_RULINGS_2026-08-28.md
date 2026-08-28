# Astrologer rulings — 2026-08-28

**All seven decisions in [`ASTROLOGER_DECISION_REQUEST_2026-08-28.md`](ASTROLOGER_DECISION_REQUEST_2026-08-28.md)
were answered, plus all four of the optional items.** This file is the record:
the verdict as given, what it means for the engine, and what remains to build.

**Two rulings went further than the options offered.** `FCR-10c` was a two-way
fork and came back a third way (VETO, not the penalty-or-revert choice), and
`A-7` was a binary threshold question answered with a three-band grading. Both
are recorded below as ruled, not as asked.

**Status key:** ✅ shipped in this change · 🔨 queued, scoped below · 📋 recorded,
no code change.

---

## 1. `FCR-10c` — marriage on Amavasai ✅

> **(c) VETO, `[TRADITION]`. Never cite p.79 as "Krishna 15". Show score as
> informational under the veto; keep gate logic documented.**

Neither branch of the fork. The treatment gets **stronger** (penalty → veto)
while its provenance claim gets **weaker** (a cited page → declared practice),
and those are the same correction rather than opposite ones: Tamil practice does
not elect a wedding on the new moon, and what it lacks is a marriage-chapter
sentence saying so. `FCR-10c` had manufactured that sentence out of an
arithmetic slip.

**Shipped:**

| Change | Site |
|---|---|
| Sweep set ends at 14 — p.79 can no longer reach Amavasai | [marriage_muhurta_rules.py:111](../app/data/marriage_muhurta_rules.py#L111) |
| `MARRIAGE_AMAVASAI_IS_VETO` + its own rule id, with the ruling recorded | [marriage_muhurta_rules.py](../app/data/marriage_muhurta_rules.py) §5b |
| `MARRIAGE_AMAVASAI__TRADITION` provenance record — `TRADITIONALLY_REPORTED`, no page by design | [marriage_muhurta_rules.py](../app/data/marriage_muhurta_rules.py) `RULE_SOURCES` |
| Veto branch above the sweep, contribution `0.0` | [muhurta_engine.py](../app/calculations/muhurta_engine.py) `_tithi_factor` |
| Generic −5 still stands down for MARRIAGE — one cause, one chip | [muhurta_engine.py](../app/calculations/muhurta_engine.py) `_activity_rules_on_amavasai` |

**"Show score as informational" needed no work** — `DayScore` already computes
`score` alongside `vetoed`, and a veto contributes `0.0` rather than zeroing the
day. The rest of the factors still score, which is exactly what makes the number
under the veto worth showing.

**One test had to change its mind, and the change is the interesting part.**
`test_every_emitted_rule_id_resolves_to_a_page_and_a_passage` required *every*
emitted rule to have a page. That was right while every rule rested on a text;
it would now forbid the first rule the astrologer deliberately rested on
practice. It is now
`test_every_emitted_rule_id_resolves_and_declares_what_it_rests_on`: a
`CONFIRMED` record must still produce page and passage, and a non-`CONFIRMED`
one must name its tradition and explain itself in `notes`. **A rule may be
unsourced; it may not be silently unsourced.**

---

## 2. `PN-1` — naisargika maitri node rows ✅

> **YES — relabel node rows `[PRODUCT]`. No lineage table exists to offer.**

Relabelled at the constant ([chart_strength.py:176](../app/calculations/chart_strength.py#L176));
`PN-1` closed in [the register](VINAADI_PAGE_NEEDED_REGISTER_2026-08-27.md).
Values unchanged. Two of the register's five rows are now closed, both by
relabelling rather than by sourcing.

Recorded at the constant so a future reviewer cannot undo it by good intentions:
**node-row symmetry is internal consistency, never provenance**, and the
seven-graha core's new citation (p. 246, all 49 ordered pairs) **must not drift
across the boundary** into the node rows.

---

## 3. `A-19` — janma / anu-janma / thri-janma 🔨

> **3a  y — activity-specific rule > general bar (apavada > utsarga)**
> **3b  y — full / half / quarter**
> **3c  QUARTER. Dosha attaches to the 19th as Thri-janma, not qua Pariyaya;
> record that reading on the rule.**

All three adopted. 3c resolves the p.167 tension the way that keeps the rule
coherent: **the 19th is barred because it is Thri-janma, not because of where it
falls in the Pariyaya cycle**, so "the third Pariyaya has no adverse qualities"
does not swallow it. That reading must be written on the rule itself — it is the
kind of thing that gets silently re-derived the wrong way in two years.

**To build:**

1. Replace the binary janma-tara bar with a **graded** one: janma 1.0, 10th 0.5,
   19th 0.25, third cycle 0. The engine currently has one prohibition set; this
   becomes a weight per count.
2. **Per-function exemptions** (`apavada > utsarga`): mantra initiation
   (p. 62), first milk-feeding (p. 32) and Annaprasana (p. 34) lift the bar for
   their own rite. p. 34's list has one OCR-ambiguous numeral (11th or 12th) and
   **must not be encoded until the physical page settles it** — the other two
   can ship now.
3. Grading softens days that fail today, so this needs a before/after sweep, not
   just unit tests.

**Not in scope and worth stating:** we still model none of Ch. XXXIV's
neutralizations (pp. 189–197), so affliction scoring stays systematically
harsher than the text. Recorded, not ruled.

---

## 4. Porutham — which text governs 🔨

### 4a — Rasi exceptions: **both, with a precedence rule**

> **Enable BOTH + the six enumerated pairs `[CLASSICAL p.74]`. 2nd =
> `[CLASSICAL:KP]`, 6th even-sign = `[LINEAGE:Jothidam]`. Enumerated pairs beat
> even-sign generic at the 6th. Where both lift a pairing, show the more
> conservative grade.**

Not "which text wins" but **both, separately marked, with a stated precedence** —
which is the answer the marker system exists to make possible. Kalaprakasika's
2nd-position exception and Jothidam's 6th-position one are different claims, not
rival versions of one claim, so both can run as long as each says where it comes
from. Two mechanical consequences:

* at the 6th, the **six enumerated pairs** are the specific rule and beat the
  even-sign generic;
* where both routes lift the same pairing, **the more conservative grade wins** —
  so enabling exceptions can never be a back door to a softer verdict than
  either source alone would give.

`RASI_EXCEPTIONS_ENABLED` flips, the two sets get filled, and the precedence
above needs a test each.

### 4b — Sthree Deergham: **three bands, not a threshold**

> **1–7 FAIL / 8–13 MADHYAMA / 14–27 UTTAMA. Binary fallback: >=14.**

The answer to a binary question is a grading, and the fallback tells us what to
do where the product cannot express it. **Porutham is integer 0/1 per criterion,
0–10 total, and `score: int` is on the wire across four surfaces** — so:

* the **point** follows the binary fallback: pass at **≥ 14** (today: ≥ 8);
* the **band** (FAIL / MADHYAMA / UTTAMA) is carried in the criterion's detail
  so the grading is not lost, without changing the total's type.

**This is the most user-visible change in the whole set**: counts 8–13 currently
pass and will stop passing. It needs the before/after sweep run and read before
it ships.

### 4c — Vasya Simmam → Thulaam: **confirmed** 📋

> **y — Simmam ↔ Thulaam confirmed as a recorded ruling. Taurus row: hold for
> the physical page.**

No code change: the value we ship is the value ruled. What changes is that
overruling Jothidam p.69's Makaram is now a **ruling** rather than my inference.
The Taurus row ("Cancer and Leo" vs our Kataka + Thulaam) stays held — correctly,
since it is plausibly a Leo/Libra OCR slip.

---

## 5. Compatibility weights 🔨

> **Porutham 35 / 7th 20 / Navamsa 15 / Dasha 15 / Dosham 10 / Emotional 5 /
> Synastry 0. De-duplicate by trimming Emotional and Navamsa, not by capping
> Porutham.**

| Layer | Was | Now |
|---|---|---|
| Porutham | 20 | **35** |
| 7th-house strength | 20 | 20 |
| Navamsa | 20 | **15** |
| Dasha harmony | 15 | 15 |
| Dosham | 10 | 10 |
| Emotional | 10 | **5** |
| Synastry | 5 | **0** |

Sums to 100. **Synastry goes to zero** — the Western-aspect layer is out of the
headline number entirely.

The instruction attached to it is the substantive part: *"de-duplicate by
trimming Emotional and Navamsa, not by capping Porutham."* Moon–Moon harmony and
D9 Venus/7th-lord agreement **restate** things the ten poruthams already measure,
so raising Porutham without trimming them would count the same agreement twice
and inflate every score. The trim is what makes the raise honest.

**Scope:** each layer's max is baked into its own scoring function in
[compatibility_intelligence.py](../app/calculations/compatibility_intelligence.py),
not held in one weights table, so each rescales individually — and
`porutham_max` and the per-layer maxima are on the wire, so web and mobile
display need checking in the same change.

---

## 6. p. 245 fractional drishti — **adopt** 🔨

> **ADOPT. Central `aspect_strength()` 0/.25/.50/.75/1. Sevvai 4/8, Guru 5/9,
> Sani 3/10 promoted to FULL. Yoga presence requires poorna drishti by default.
> Fold into PR-A2; roll out against golden-fixture diffs.**

Adopted with the special aspects preserved at full strength — so the familiar
Tamil readings are unchanged, and what is *added* is that every other graha now
casts a graded sight where it previously cast none.

The good news on scope: [`aspects.py`](../app/calculations/aspects.py) already
exists as the single definition, and ten modules import from it. The work is not
finding the call sites; it is that **`aspects_house()` returns a boolean and each
of those ten call sites must now say which threshold it means** — poorna only, or
any non-zero sight, or a weighted contribution. Yoga presence is ruled: **poorna
by default.**

There is no `PR-A2` in this repository — that identifier is the astrologer's,
not ours. Read as: land it as one reviewable change, not a drive-by.
**Golden-fixture diffs are a condition of the ruling, not a nicety**, and this
item does not ship until they are read.

---

## 7. Yoga verdicts — **7 changed, 25 signed** 🔨

> **Rest: SIGNED.** — 25 of the 32 rows are now doctrine and need no further
> review.

| Rule | Ruling | Shape of the change |
|---|---|---|
| `YOG-AD-01` Adhi | **≥ 2 of Guru/Sukran/Budhan = present; 3 = full; grade by planets, not houses** | Tightens presence *and* replaces the strength axis. Removes the yoga from charts that show it today |
| `YOG-CH-01` Chandala | **Guru + Rahu ONLY. Guru + Ketu = separate `[VARIANT]` card** | Splits one detector into two cards; the Ketu form must not read as the same yoga |
| `YOG-DN-01` Dhana | **Separate `[PRODUCT]`** | The parentless third condition is kept but emitted as its own labelled row, not folded in under a classical name |
| `YOG-VS-01` Vasumati | **Lagna-or-Moon** | Upachaya counted from either reference, not from Chandran alone |
| `YOG-KD-01` Kemadruma | **Bhanga mandatory before display** | Cancellation must be evaluated *before* the card is shown — today a cancelled Kemadruma can still surface |
| `YOG-DR-01` Daridra | **Proxy split** | The two conditions separate; the weak-and-afflicted proxy is labelled as ours |
| `YOG-LK-01` Lakshmi | **Strength-gated** | Presence gated on strength rather than reported and then graded |
| `YOG-ACT-01` | **`[PRODUCT]`; activation never gates existence** | The load-bearing one — see below |
| Pancha Mahapurusha ×5 | **Lagna only** | Confirmed as shipped |
| Sunapha/Anapha/Durudhura ×3 | **Exclusions correct** | Confirmed as shipped |

**`YOG-ACT-01`: "activation never gates existence."** A yoga that is present is
present whether or not its lord is running. Activation may scale how loudly it
reads and must never decide whether it is there at all — which is the general
form of the defect found on 2026-08-27, where nine yogas were dormant-capped by
a mis-keyed lookup. The rule now forbids the whole class, not just that instance.

**Benefic set — the one that touches everything:**

> **paksha-Moon + association-Mercury via `effective_natural_class()`; ship
> behind fixture diffs.**

Both classical tests adopted: Chandran's benefic status becomes **paksha-dependent**
(waxing benefic, waning not), and Budhan's depends on **association**. One
function, `effective_natural_class()`, so no module can drift from another —
and, like item 6, **gated on fixture diffs**. It changes the benefic set used by
Kartari, Amala, Adhi, Vasumati, Sunapha/Anapha and every malefic-affliction
count in the engine.

---

## The optional four

| Item | Ruling | Status |
|---|---|---|
| **`A-6` Dinam pada exceptions** | **Keep the Tamil Dinam; Kalaprakasika as `[VARIANT]`** | 📋 Our 12-count table stands. The book's more permissive pada-level reading is recorded as a variant, not adopted — no behaviour change, but the omission is now explicit rather than implied |
| **`A-20` Upanayanam janma-tara** | **UNION** | 🔨 Both passages stand; the prohibition widens from p.50's named list to the union of p.50 and p.51 — **11 of 27 counts**. Real behaviour change for Upanayanam elections |
| **`MUH-06` Kuligai / medical** | **KEEP adverse, relabel `[LINEAGE]`; cite p.192 as counter-citation** | 🔨 The divergence stands and gets stronger provenance hygiene: p.192 is cited *against* us, on our own rule. A rule that names its own counter-evidence is the pattern to copy |
| **Ashtottari seed** | **Hold until applicability + mapping lock together** | 📋 Neither Ardra-adi nor Krittika-adi. The seed question is not answerable apart from *when Ashtottari applies at all*, and locking one without the other produces a dasha that runs on the wrong charts with confident dates |

---

## What ships in what order

**Shipped now (this change):** item 1, item 2, and the `A-6`/`4c` records —
nothing gated, and item 1 was the live defect.

**Next, independently testable:** `A-20` union · `MUH-06` relabel · item 4a
(rasi exceptions + precedence) · item 5 (weights, four surfaces) · item 4b
(Sthree Deergham bands — needs the before/after sweep read first) · item 3
(janma-tara grading + the two safe exemptions).

**Gated on golden-fixture diffs, by the astrologer's own instruction:** item 6
(fractional drishti) and the benefic-set half of item 7. The rest of item 7's
per-yoga changes can land before those.

**Blocked on the physical page, not on us:** p. 34's Annaprasana numeral
(11th or 12th) inside item 3, and Kalaprakasika's Taurus vasya row.
