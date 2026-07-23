# Family & Charts — Humanization Audit

**Date:** 2026-07-23
**Surface:** `web/components/dashboard-family-charts-hybrid.tsx` (default Family & Charts tab) and its leaf parts in `web/components/dashboard-hybrid-parts.tsx`.
**Trigger:** External design review of the full page. Diagnosis accepted; prescription refined for this product.

---

## 1. The verdict

The reviewer's core finding is correct and is the single most valuable UX critique the product has received:

> The page describes **astrology**. It should describe **the user's life**.
> Order everything: **"What does this mean for me?" → "Why does astrology say so?" → "Show me the technical details."**

Scores that stand: **Ease of Understanding ~4/10, Emotional Connection ~3/10**, against Visual Design ~9/10. The page is an excellent *reference document* and a poor *understanding surface*. The clearest offender is the full-width "Chart explanation" panel — correct, complete, and unreadable to a non-astrologer.

### Where we diverge from the reviewer — and why it matters

The reviewer's sample copy ("your Moon makes you curious, spiritual, eager to learn…") is **generic sun-sign filler** — a Barnum statement that reads identically for everyone. Pasting that in would make Vinaadi interchangeable with every horoscope app *and* quietly dishonest, because that text is not computed from the chart.

**Vinaadi's moat is that it computes the real thirukanitham chart.** So the fix is not "add warm blurbs." It is:

> **Translate the engine's real per-chart computation into life-language.**

Same warmth the reviewer wants — but earned by the math, and different for every chart. That is harder, and it is exactly why it is defensible.

---

## 2. The law (applies product-wide)

Every reading surface renders in this order:

1. **Meaning** — what this does in *your life*, in plain language, with a verdict (good / mixed / needs care) and a reassurance frame.
2. **Why** — the astrological reason, still in accessible prose.
3. **Mechanics** — houses, nakshatra, navamsa, drishti, functional lordship — collapsed by default, one tap away, nothing removed.

Enthusiasts lose nothing. Newcomers are never ambushed by Level-6 detail before Level-1 meaning.

---

## 3. What already exists (grounding — do not rebuild)

The engine runs ahead of the UI (a known pattern in this codebase). Per-planet, `chart_explanation_service.py` **already** emits, bilingual, computed from the real chart:

| Field (`ChartExplanationPlanet`) | Content |
| --- | --- |
| `strengthScore` (0–100) | real graha strength |
| `dignity` / `dignityScore` | exalted / own / moolatrikona / debilitated / neutral |
| `functionalNature` | Yogakaraka / Lagna lord / Trikona / Kendra / Dusthana / Maraka / Neutral |
| `houseFromLagna`, `houseGroup` | placement + kendra/trikona/dusthana |
| `nakshatraLord`, `pada`, `d9Rasi` | star lord, pada, navamsa |
| `explanation` | full prose reading |
| `facets[]` | the same reading **pre-split into labelled lines** |

The facet labels ([`chart_explanation_service.py` `_FACET_LABELS`](../app/services/chart_explanation_service.py)) are already:
`Where it sits · Its role in your chart · How strong it is · What to work with · In the Navamsa (D9) · Active right now? · Its star lord · Current transit · Traditional support`

**These are the reviewer's exact renames — already written, already bilingual, already per-chart.** The problem is purely surfacing and ordering, not content generation. Phases 0–1, 3–4 need **zero engine work**.

---

## 4. The gap

1. **Wrong lead.** The expanded planet detail ([`HyPlanetOrbs`](../web/components/dashboard-hybrid-parts.tsx)) opens with `Strength 25/100 · Pada · D9 Rasi` — Level-5/6 mechanics first.
2. **No verdict layer.** We show `25/100 · Gentle` but never answer *"should I worry?"*. A bare number is what creates anxiety.
3. **No per-planet life-domain lens.** `life_areas_service.py` computes life areas at the **chart** level; nothing attributes "this Moon governs *your* emotional life and mother" to the tapped planet. **This is the one genuine build (Phase 2).**
4. **Bottom "Chart explanation" panel is a wall of Level-6 prose**, expanded by default.

---

## 5. The phases

### Phase 0 — "At a Glance" verdict card ✅ *(highest ROI, ships alone, no engine work)*
Insert a colored verdict card at the **top** of the expanded planet detail. Pure recombination of existing data:
- **Graha domain label** — the universal kāraka of the planet (Moon = *Mind & Emotion*, Sun = *Self & Vitality*, …). Textbook, universally true per graha, not fabricated per person.
- **Strength verdict + reassurance** — from `strengthScore`, banded, each band carrying a non-scary reassurance sentence.
- **Focus areas** — from `houseFromLagna` theme (the life-areas that planet touches for *this* chart).
- **Active now** — a badge/star when the `activation` facet is `BOOST` (this planet leads a running dasha period).

**Acceptance:** tap any planet → within one glance a user with zero astrology knowledge knows (a) what the planet is about, (b) whether it's strong/weak and whether that's a worry, (c) which parts of life it touches, (d) whether it's active now. Bilingual. `tsc` + `eslint` green.

### Phase 1 — Reframe strength (copy only)
`25/100 · Gentle` → labeled `Weak ●────── Strong` scale + one reassurance line. Folds into the verdict card.

### Phase 2 — Per-planet life-domain lens *(the real build)*
A `graha → life areas` layer (natural kāraka + houses owned/occupied), rendered as ❤️ Relationships / 💼 Career / 💰 Money / 🧠 Mind cards — **each sentence generated from this chart's placement + strength**, never a static blurb. Preferred home: extend `chart_explanation_service.py` so the attribution is computed once, server-side, and stays consistent with the strength it already reports (avoids the historic double-count trap).

### Phase 3 — Restructure planet detail into progressive disclosure
Final order: verdict card → life-areas → **[collapsed] "The technical details"** (today's strength bar / pada / D9 / facets, unchanged, behind a toggle).

### Phase 4 — Demote the "Chart explanation" panel
Collapse by default; relabel *"Full technical reading →"*. It is already good Level-3 content.

### Phase 5 — Make it a product law
Roll Meaning→Why→Mechanics across every prediction surface. Separate follow-on audit.

---

## 6. Phase 2 content model (per-planet life-domain)

For the tapped graha, derive up to four domain cards from **real chart facts**:

- **Domain relevance** = natural kāraka of the graha ∪ houses it owns from lagna ∪ house it occupies. (e.g. Venus → Relationships always; + Career if it owns/occupies the 10th.)
- **Tone of each sentence** = its `strengthScore` + `dignity` + affliction flags, *reused from the engine*, never recomputed.
- **No domain card is emitted if the chart gives no real signal** — silence over Barnum.

Guardrail: the copy must survive the test *"would this sentence read differently for a chart where this planet is debilitated in the 6th?"* If not, it's filler — cut it.

---

## 7. Guardrails (non-negotiable)

- **No Barnum copy.** If we can't compute it, we don't assert it.
- **Don't scare, don't lie.** "Weak" always carries a reassurance frame; never a false "all good."
- **Tamil parity from day one.** Every new string bilingual, **active-language only** — no title+faint-other-language echo (rejected, absolute).
- **No double-count.** Any new strength surface *reads* the existing `strengthScore`; it never recomputes strength.
- **Kāraka claims stay textbook.** Graha domain labels use classical significations only.

---

## 8. Status

- **Phase 0 + 1 — implemented** 2026-07-23. `HyPlanetVerdict` card at the top of the expanded planet detail: karaka domain label, banded strength verdict + reassurance line (Phase 1 folded in), house-theme focus, "Active now" star. Reads `strengthScore`; recomputes nothing.
- **Phase 2 — implemented** 2026-07-23 (client-first). `HyPlanetLifeAreas`: ❤️/💼/💰/🧠 buckets selected from the graha's karaka ∪ the houses it owns/occupies (lagna derived from the planet's own `rasi`/`houseFromLagna`), tone from the real `strengthScore`. Client-side for fast iteration; can migrate the attribution into `chart_explanation_service.py` later for a single source of truth. Copy is deliberately conservative — a candidate for an astrologer/Tamil polish pass.
- **Phase 3 — implemented** 2026-07-23. `HyTechnicalDetails`: the strength bar, pada, D9, and the engine's labelled facet lines are collapsed by default behind a "Technical details ▸" toggle. Expanded-planet order is now verdict → life areas → remedy → [collapsed] technical. Nothing removed. The remedy ("Traditional support") stays visible as it's actionable.
- **Phase 4 — implemented** 2026-07-23. The full-width "Chart explanation" section (§9) is relabelled **"Full technical reading"** and its `ChartExplanationPanel` is collapsed by default (dropped `defaultOpen`) — it's now explicitly the bottom of the Meaning→Why→Mechanics ladder, one tap away instead of a wall of prose on load.
- No accent left-border stripes on any of the new cards (user craft preference).
- Browser + Tamil pass owed before commit. **Phase 5** (roll the law across other prediction surfaces) is a separate, broader audit — planned.
