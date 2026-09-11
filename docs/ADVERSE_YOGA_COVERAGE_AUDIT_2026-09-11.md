# Adverse-yoga coverage audit — Balarishta, Alpayu, Kemadruma, Shakata, Daridra

**Date:** 2026-09-11 · **Branch:** `harden/production-readiness`
**Question asked:** are these five handled, and are the Vinaadi surfaces wired correctly for them?

> **Status: astrologer ruled 2026-09-11; everything approved is implemented and
> green.** See §0 for what shipped and what is still open. Two of this document's
> original claims were overturned by that ruling and are corrected in place —
> the Sakata "6/8 is simply wrong" framing (§3 D1) and the "make Sakata cancel
> like Kemadruma" suggestion (§6). Both were mine and both were overstated.

---

## 0. Ruling outcomes

| Item | Ruling | State |
|---|---|---|
| D3 — `DARIDRA_PROXY_YOGA` "supportive" label | Fix first; inverts an adverse indicator | ✅ shipped |
| D1 — Sakata copy 6/8 → 6/8/12 | Standardise on 6/8/12, but **log it as a lineage choice, not a bug** | ✅ shipped |
| D2 — Daridra copy post-split | Fix | ✅ shipped |
| D4 — `planet_kendra_from_moon` "softens" → cancels | Fix | ✅ shipped |
| D5 — cancelled Kemadruma reads "Absent" | **Highest priority.** A cancelled Kemadruma is a real "hidden resilience" reading | ✅ shipped |
| §4 — adverse yogas styled as benefics | Engineering findings accepted | ✅ shipped |
| §5 — key grahas: Kemadruma → Moon, Sakata → Moon+Jupiter | Approved, ship it | ✅ shipped |
| §5 — Daridra key graha | Build the per-chart field; use 11th lord **+ 2nd lord** | ✅ shipped |
| §5 — "and transits" in the tooltip | Drop the copy now; log real gochara activation as a genuine doctrine gap | ✅ shipped + logged |
| §6 — Sakata bhanga symmetry | **Overturned.** Keep the asymmetry; do not promote Sakata to a cancel | ✅ registry note updated |
| Balarishta | **❌ Permanent refusal. Close it, do not park it.** | ✅ docs closed |
| Alpayu | Name it explicitly in the doctrine | ✅ docs updated |
| §6 — Daridra definition | Switch to the brief's dusthana→dhana formulation, "far fewer false positives". Measured first (§8): only **parivartana** delivers that. **Ruled: parivartana-only.** | ✅ shipped |

All of it is implemented, with `tests/test_adverse_yoga_activation.py` (13 tests) and
`web/components/dashboard-yoga-adverse-presentation.test.tsx` (27 tests) pinning it.
Suites green: **699 backend** (yoga/chart/rulebook/propensity slice), **837 web**,
**92 mobile**; ruff and `tsc --noEmit` clean on every file touched.

**Local runs are not authoritative here** — per the repo's own recorded gotcha, a branch
push does not run backend CI (`ci.yml` needs `main` or a PR), so these numbers stand only
until CI confirms them on the PR.

**Answer in one line:** three of five are computed and shipped; two are a deliberately
gated engine that was never built. Of the three that ship, every one of them reaches the
reader through the *benefic* yoga presentation grammar, and three carry stale copy that
contradicts their own detector.

---

## 1. Coverage table

| Yoga | Engine | Rule ID | Surfaces | Verdict |
|---|---|---|---|---|
| **Kemadruma** | `_yoga_detect.detect_kemadruma_yoga` | `YOG-KD-01` | web yoga panel, Nova life-areas panel, mobile Yogam, 2 propensity cards | ✅ computed, ⚠️ presented as a benefic |
| **Shakata / Sakata** | `_yoga_detect.detect_sakata_yoga` | `YOG-SK-01` | web, Nova, mobile | ✅ computed, ❌ UI copy contradicts detector |
| **Daridra** | `_yoga_detect.detect_daridra_yoga` | `YOG-DR-01` | web, Nova, mobile | ✅ computed, ❌ UI copy is pre-split (stale) |
| **Daridra (Vinaadi proxy)** | `detect_daridra_yoga_proxy` | `YOG-DR-02` | shared display + mobile + Nova | ⚠️ mislabelled "supportive" |
| **Balarishta** | — none — | — | — | ⛔ not built; gated as **T9** |
| **Alpayu** | — none — | — | — | ⛔ not built; gated as **T9** |

`Prabalarishta` appears 12× in the codebase and is **not** this. It is the fourth class of
the Amirdhadhi Yogam day table in `panchangam.py` / `muhurta_engine.py` — a muhurta-quality
cell, unrelated to natal balarishta. Anyone grepping for "balarishta" will get a false
positive from it.

---

## 2. Balarishta and Alpayu — gated, not forgotten

Both are longevity readings, and longevity is a **standing product refusal** here, recorded
in three independent places:

- `docs/THIRUKANITHAM_DEGREE_ADHIPATHI_AUDIT_2026-07.md:56` — the 8th lord (ஆயுஷாதிபதி) is
  *"folded into DUSTHANA — no longevity (Ayurdaya/Balarishta) engine"*.
- `docs/THIRUKANITHAM_DEGREE_ADHIPATHI_AUDIT_2026-07.md:166` — **T9. R5 — Ayurdaya /
  longevity engine … Balarishta + Ayurdaya. Gate: requires an astrologer worked example
  before coding.** Effort ~1–2 weeks after sign-off.
- `docs/ASTROLOGER_REVIEW_QUEUE.md:145` — *"Do not start without that worked example."*

And the content layer enforces the refusal independently:
`app/services/primary_concern_service.py:13` — *"the wording never uses longevity/death
framing"*; `app/calculations/_yoga_dosham.py:923,1021` — *"This is not a longevity or death
prediction."*; `docs/AGE_GATED_READING_AUDIT_2026-08-05.md` — *"Longevity vocabulary banned
at every gate."*

**So the absence is correct policy, not a defect.** Two notes on it:

1. Alpayu is not named anywhere. T9 says "Ayurdaya", which is the *band* engine
   (alpayu / madhyayu / purnayu) that Alpayu is one third of — so it is covered by the
   gate, but a reader grepping for "alpayu" finds nothing and may conclude it was missed.
   Worth naming it in the T9 row.
2. Per `docs/RULINGS_*` and the five-minute-reading decisions, **the owner is the
   astrologer**. The gate's premise — "requires an astrologer worked example" — is
   satisfiable in one sitting. This item has been parked since 2026-07 on a condition that
   is not actually external. Re-check the gate before assuming it still blocks.

Recommendation if T9 is ever unblocked: Balarishta is a **child-mortality** reading. Given
the existing refusal doctrine, ship it only as an *arishta-bhanga-first* health-attention
signal for the 0–8 age band, never as a survival statement, and never on a chart the user
entered for a living child. That is a doctrine call, not a code one.

---

## 3. Defects found in the three that DO ship

### D1 — Sakata's card text contradicts its own detector · `[correctness]` · ✅ fixed

`_yoga_detect.py:521` — `present = moon_from_jupiter in {6, 8, 12}`.
`web/components/dashboard-yoga-dosham-panel.tsx:326-329` —
*"Formed when the Moon is in the **6th or 8th** from Jupiter."*

A chart with the Moon 12th from Jupiter shows the card as **Present / Strong**, with a
"Triggered because: The Moon is 12 houses from Jupiter" line, above an explanation whose
stated condition the reader can see is not met. The registry
(`yoga_rules.py:527`) and the rulebook appendix both say 6/8/12 — the web copy is the
only place that says 6/8.

**Corrected by the 2026-09-11 ruling.** This section originally said "Phaladeepika has
6/8/12; the copy is simply wrong", which overstated the case. Phaladeepika does give
6/8/12 and the detector is right to follow it — but **6/8 is a real competing lineage**,
followed by several Tamil texts, not a typo. Whoever wrote the card was following the
other stream.

So this is still a defect — the product must speak with one voice, and two surfaces
describing the same detector differently is not a lineage, it is drift — but the
**record is "we chose the 6/8/12 lineage", not "the copy was wrong."** That distinction
is now carried in the `YOG-SK-01` `source` field, where a reviewer will actually find it.

Fixed: `6th, 8th, or 12th` / `6/8/12-ம் வீட்டில்` in both `ta` and `en`.

### D2 — Daridra's card text is the pre-split definition · `[correctness]`

The 2026-08-28 ruling `YOG-DR-01` / `YOG-DR-02` ("proxy split") separated the two
conditions onto two cards. The detector for `DARIDRA_YOGA` is now **the dusthana test
only**; the weak-plus-malefic half moved to `DARIDRA_PROXY_YOGA`.

`dashboard-yoga-dosham-panel.tsx:346-349` still describes the **merged** condition —
*"when the 11th lord (income house) is weak — in a dusthana **or with malefics**"*. So the
classical card advertises a trigger it no longer tests, and the proxy card's actual trigger
is described on the wrong card. Copy was not updated when the ruling shipped.

### D3 — `DARIDRA_PROXY_YOGA` is labelled "supportive" · `[correctness]`

`packages/shared/src/yogaDisplay.ts:34`:
```ts
DARIDRA_PROXY_YOGA:  { ta: "Daridra Yoga (துணை அளவுகோல்)", en: "Daridra Yoga (supportive measure)" },
```
This is a copy-paste of line 20's `DHANA_SUPPORTIVE_YOGA` → `(துணை)` / `(supportive)`.
Dhana-supportive is a *supportive variant of a wealth yoga*; Daridra-proxy is an **adverse
income-pressure indicator**. Calling it "supportive" inverts its meaning.

It also breaks the ruling that created it: `yoga_rules.py:775` names it
**`தரித்ர யோகம் (வினாடி அளவுகோல்)`** — *Vinaadi measure* — precisely because the ruling
said the proxy must be "labelled as ours". The shared display drops the attribution and
substitutes a word that means the opposite.

`yogaDisplay.ts` is the single naming source for **both web and mobile**, so this string is
what every surface renders.

Fix: `{ ta: "தரித்ர யோகம் (வினாடி அளவுகோல்)", en: "Daridra Yoga (Vinaadi measure)" }`.

### D4 — `planet_kendra_from_moon` marker still says "softens" · `[correctness]`

`dashboard-yoga-dosham-panel.tsx:119` — *"A planet sits in a kendra from the Moon — this
**softens** the Kemadruma condition."* Since `YOG-KD-01` (2026-08-28) that factor is a
**full bhanga**: it sets `is_present=False` and cancels the card outright. The string
understates it, and is now unreachable anyway (see D5).

### D5 — a cancelled Kemadruma reads as "Absent", and the why-text says the geometry never formed · `[correctness]`

Chain:
- Full bhanga → `is_present=False`, `strength="WEAK"`, `cancellation_factors` **non-empty**.
- `yogaDisplay.ts:94` — `if (!y.isPresent) return "ABSENT";` — returns before it ever looks
  at `cancellationFactors`, so the `CANCELLED` branch is dead for exactly the case it was
  written for.
- `dashboard-yoga-dosham-panel.tsx:394` — `buildWhyText` with `isPresent=false` prints
  *"Your chart does not have the planetary positions needed to trigger this yoga."*

That sentence is false. The geometry **did** form — no graha flanks the Moon — and was then
annulled by a graha in a kendra from it. "Formed and cancelled" and "never formed" are
different readings, and the second is the one no jyotishi would sign. The file's own
docstring (lines 71–84) argues for exactly this distinction and then loses it one branch
later, because the ruling moved presence in the backend after the tri-state was written.

Fix: `yogaReadingStatus` should return `CANCELLED` when `!isPresent` **and**
`cancellationFactors.length > 0`, and `buildWhyText` needs a cancelled-but-not-present
branch that names the bhanga.

---

## 4. The bigger wiring problem: adverse yogas ride the benefic presentation

This is the finding that matters most, and it is not a copy bug.

**Web** (`dashboard-yoga-dosham-panel.tsx:761-798` and
`dashboard-life-areas-yogas-doshams-nova.tsx:140-193`) renders a present yoga as:

```
★  Kemadruma Yoga            [ Strong ]  [ 34 ]
```
with `--color-high` / `--color-high-bg` / `--color-high-border` (Nova) and
`--chart-d9-active` (Classic) — the *good-outcome* tokens — plus a filled star, chosen
purely on `strength === "STRONG"`. Valence is never consulted.

**Mobile** (`mobile/app/(tabs)/tools/yogam.tsx:95`):
```ts
const top3 = yogas.filter((y) => y.strength === "STRONG").slice(0, 3);
```
rendered under the heading **"Key Yogas" / "முக்கிய யோகங்கள்"** with a gold rank medallion.
A chart whose only STRONG yoga is Kemadruma puts *"emotional isolation"* at position 1
under "Key Yogas", with a gold 1 beside it.

The codebase already contains the correct pattern — in the very same Nova file, the
**Dosham** card (lines 388-399) carries a proper tri-state status label and adverse styling.
Kemadruma, Sakata and Daridra behave like doshams and are rendered with the yoga grammar
only because of which list the backend puts them in.

Minimum fix: an `ADVERSE_YOGAS` set (`SAKATA_YOGA`, `KEMADRUMA_YOGA`, `DARIDRA_YOGA`,
`DARIDRA_PROXY_YOGA`, `PAPA_KARTARI_YOGA`, `CHANDALA_YOGA`, `CHANDALA_KETU_YOGA`) in
`packages/shared/src/yogaDisplay.ts` — one source, both surfaces — driving (a) the caution
token instead of `--color-high`, (b) a different glyph than ★, and (c) exclusion from
mobile's "Key Yogas" top-3.

The registry already knows the answer: `yoga_rules.py` calls each of these *"An adverse
yoga"* in its `note`. The marker is in the data and is not exported to the client.

---

## 5. Dormant-cap: the activation number is a constant

All four rows declare `key_planets=()`. `yoga_activation.py:46-52` therefore never finds a
key graha, `activated` is always `False`, and the score collapses to
`round(strength_base * 0.45)`:

| strength | activation score shown |
|---|---|
| STRONG | **34** — always |
| PARTIAL | **18** — always |
| WEAK | **11** — always |

So every Kemadruma in the product shows `34` forever, on every chart and every date, under
a tooltip reading *"Today's activation score — how strongly Dasha and transits are
triggering this yoga now"*. It is triggered by neither.

Same cause, second symptom: `dasha_activated` is hardcoded `False` in all four detectors, so
mobile's How-sheet (`yogam.tsx:63-65`) tells every user *"No current dasha lord activates
this yoga, so it is formed but dormant"* — during a Chandra mahadasha, on a Kemadruma
chart. The web card appends the same claim via `getYogaPowerContext`
(`dashboard-yoga-dosham-panel.tsx:710-714`).

`yoga_activation.py:15-19` discloses the cap honestly and declines to fix it in code,
because picking a key graha is a doctrine call. It is a short one here:

- **Kemadruma** → `MOON` (the yoga is defined entirely on the Moon).
- **Sakata** → `MOON`, `JUPITER` (both defining grahas).
- **Daridra / proxy** → the **11th lord**, which is chart-dependent — so this one needs
  either a per-chart key-graha field on `YogaResult` or an explicit decision to leave it
  dormant-capped.

Two of the three are free. **This needs your ruling.**

Separately: the tooltip's *"and transits"* is wrong for **every** yoga —
`yoga_activation_score` takes maha lord, antar lord and natal planet scores. No transit
input exists.

### 5b — no power-context copy for any adverse yoga

`YOGA_POWER_CONTEXT` covers only `GAJA_KESARI_YOGA`, `RAJA_YOGA`, `DHANA_YOGA`,
`NEECHA_BHANGA_RAJA_YOGA`, `KALASARPA`. All four adverse rows fall to the generic
*"The impact of this yoga varies with your current Dasha and transit positions."*
`DARIDRA_PROXY_YOGA` additionally has no `YOGA_WHAT_EXTRA` entry, so its "what is this"
falls through to the engine effect string. The engine effect copy in `yoga_effects.py` is
good and correctly framed ("a demand and its answer, never a prediction of misfortune") —
the gap is only the *live* "what it can do now" band.

---

## 6. Doctrine notes from the reading itself

- **~~Sakata's bhanga should probably cancel like Kemadruma's.~~ OVERTURNED, ruled
  2026-09-11 — keep the asymmetry.** This section originally argued that Moon-in-kendra-
  from-Lagna "is generally read as destroying Sakata" and nudged toward symmetry. That is
  shakier than it was presented. Kemadruma's bhanga sits on much firmer ground — a graha
  in a kendra from the Moon is near-universally a **full** Kemadruma-bhanga — while
  Sakata's is genuinely contested, some texts cancelling and others mitigating. So the
  asymmetry is **classically correct as it stands**, and tracks how firm each bhanga's
  ground is. Wanting the two rules to match was an engineering aesthetic, not a jyotisha
  one. The reasoning now lives in the `YOG-SK-01` note so it does not get "fixed" again.
- **Daridra is one narrow member of a family.** `yoga_rules.py:756-760` says so plainly.
  The definition in the brief that prompted this audit — *dusthana lords connecting with
  houses of wealth* — is a **different** member than the one implemented (*11th lord in a
  dusthana*). The 2026-09-11 ruling called the brief's version the stronger, rarer rule
  and directed a switch. **That switch is on hold: the measurement disagrees with the
  premise. See §8.**
- **Silent default.** `detect_daridra_yoga` falls back to the Lagna rasi when the 11th
  lord is missing from the planet map, which makes the dusthana test read house 1 and
  return absent. Disclosed at `yoga_rules.py:764-767`; every production call site supplies
  all nine grahas, so it cannot fire today.

---

## 8. The Daridra redefinition — measured, and it does the opposite

**Held, not implemented.** The 2026-09-11 ruling directed a switch from the shipped rule
(*11th lord in a dusthana*) to the brief's (*dusthana lords connecting with houses of
wealth*), on the stated grounds that the brief's version *"produces far fewer false
positives"* and that the shipped one *"fires too easily and over-reports."*

The reason is checkable, so it was checked before the detector moved — 200,000 random
charts (uniform lagna, uniform rasi per graha; seed 20260911), reproducible with
`py -3 scripts/daridra_definition_sweep.py`:

| rule | fire rate |
|---|---|
| **A — shipped:** 11th lord in a dusthana | **25.1%** |
| B — loose: a dusthana lord occupies the 2nd/11th | 42.1% |
| C — conjunction: a dusthana lord shares a rasi with a dhana lord | 35.9% |
| **D — parivartana:** a true dusthana↔dhana exchange | **3.9%** |
| E — B or C (the plain reading of "connecting") | 63.2% |
| F — C or D (mutual link only) | 38.6% |

**Every reading of the brief's rule fires more often than the rule it was meant to
replace, except pure parivartana.** The plain reading is 63.2% — two and a half times the
current rate, and it would put a poverty yoga on nearly two thirds of all charts.

There is a second trap underneath it. For **5 of the 12 lagnas** (2, 3, 8, 9 and 12) a
single graha owns both a dusthana and a dhana house, so any rule that counts shared
lordship as a "connection" fires for **100% of charts of that lagna**, on lagna alone,
before a single placement is read. That is a lagna constant wearing a yoga's name.

The ruling's *intent* — make Daridra rarer and stronger — is sound and is the opposite of
what its *stated rule* produces. Only **D, parivartana**, delivers the intent: a genuine
exchange between a dusthana lord and a dhana lord is rare (3.9%), is classically a real
and strong Daridra formulation, and is six times stricter than what shipped before.

**Ruled 2026-09-11: parivartana-only. Shipped.** `detect_daridra_yoga` now requires the
dusthana lord to occupy the dhana house *and* that dhana lord to occupy that same
dusthana, between **two distinct grahas**. The rule row moved `[VARIANT]` → `[TRADITION]`
— the exchange formulation is classical, where the old single-condition test was one
narrow pick from the family.

What moved as a result: exactly one cell in `tests/test_drishti_yoga_golden.py` — the
`spread` chart's `DARIDRA_YOGA`, True/STRONG → False/WEAK. That chart has the old rule's
condition and not the new one, which is precisely the narrowing. **Nothing else moved on
any of the three golden charts**, which is the part worth stating: the redefinition did
not leak sideways.

Three tests pin it: a one-way placement must not fire; the five collision lagnas must not
fire on shared lordship alone; and a 20k-chart sweep must land under 8% (it lands at ~4%),
so the ruling's stated reason stays enforced rather than merely recorded.

---

## 7. Priority

| # | Item | State |
|---|---|---|
| 1 | D3 — un-invert `DARIDRA_PROXY_YOGA`'s label (ships to web **and** mobile) | ✅ done |
| 2 | D1 — Sakata copy `6/8` → `6/8/12`, logged as a lineage choice | ✅ done |
| 3 | D2 — Daridra copy to the post-split condition | ✅ done |
| 4 | §4 — `ADVERSE_YOGAS` set; stop starring adverse yogas; drop them from mobile "Key Yogas" | ✅ done |
| 5 | D5 — `yogaReadingStatus` CANCELLED-when-absent-with-bhanga + why-text branch | ✅ done |
| 6 | D4 — marker copy "softens" → "cancels" | ✅ done |
| 7 | §5 — key grahas (Kemadruma→Moon, Sakata→Moon+Jupiter, Daridra→11th+2nd lord per chart); `dashaActivated` resolved in the chart builder; "and transits" dropped | ✅ done |
| 8 | §5b — power-context copy for the four adverse rows | ⬜ open, ~2h |
| 9 | Balarishta ❌ closed permanently; Alpayu named in the doctrine | ✅ done |
| 10 | §8 — Daridra redefined to parivartana-only (25.1% → ~4%) | ✅ done |
| 11 | Real gochara-modulated activation — a genuine doctrine gap, now logged rather than described in a tooltip | ⬜ open, new engine |
| 12 | Ayurdaya bands (Alpayu/Madhyayu/Purnayu, adult charts) — still gated on a worked example | ⬜ open |
| 13 | "N Present" counter chip was in the good-outcome tokens regardless of valence | ✅ done |
| 14 | Mobile yoga cards carried an accent left-border stripe, against the standing 2026-07-23 ruling | ✅ done |

Everything except 11 and 12 is shipped. **11 and 12 both need you, not me**: the
gochara engine is a new module and the Ayurdaya bands are gated on a worked example.

### What item 8 turned out to be

Larger than logged. The 2026-09-11 pass corrected the "and transits" claim in the
*tooltips* and missed it in the *body copy* — `getYogaPowerContext`'s fallback
(`…varies with your current Dasha and transit positions`) is exactly the string all four
adverse yogas landed on, since none had a `YOGA_POWER_CONTEXT` entry. So the users most
affected by that ruling were still being told about a calculation we do not perform. The
dosham fallback carried the same claim, and every dosham detector sets `dasha_activated`
from `_is_active(active_lords, …)` in `_yoga_dosham.py` — no transit input there either.

Both fallbacks are now dasha-only, and `ADVERSE_POWER_CONTEXT` gives Sakata, Kemadruma,
Daridra and the proxy real strong/partial/weak copy in the established house style — the
pressure named, then the thing that answers it.

One register fix came with it: the unactivated suffix said the yoga *"may express more
strongly in the next **supporting** Dasha."* Nobody is waiting for their Daridra to be
supported. An unactivated adverse yoga now reads as *"its pressure should sit lighter for
now — which makes this the easier stretch in which to build the habits above,"* while
benefics keep the original wording.
