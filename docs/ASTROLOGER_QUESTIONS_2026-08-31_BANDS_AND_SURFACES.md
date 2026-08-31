# Two open questions for the astrologer — 2026-08-31

> **ANSWERED 2026-08-31.** All five questions ruled; see
> [`RULINGS_2026-08-31_MADHYAMA_HALF_POINT.md`](RULINGS_2026-08-31_MADHYAMA_HALF_POINT.md).
> Headline: **Madhyama is a weak pass and earns 0.5**, which resolves Q1a, Q1c,
> Q2a and Q2b at once — the composite rungs stay where they are, because the
> downward pressure this document measured was the arithmetic being stricter
> than the doctrine, and it is fixed at source rather than compensated for at
> the rungs. This file is kept as the question as it was put.

Both come out of the 2026-08-28 ruling set, which has now shipped in full. Neither
is a bug. Both are decisions I deliberately did **not** make on my own, because
each one is a doctrine or presentation judgement, not a coding judgement.

Source documents:
- [`ASTROLOGER_RULINGS_2026-08-28.md`](ASTROLOGER_RULINGS_2026-08-28.md) — the rulings themselves
- [`AUDIT_15_DAY_VERIFICATION_2026-08-31.md`](AUDIT_15_DAY_VERIFICATION_2026-08-31.md) — the audit that found these
- [`RULINGS_2026-08-31_VERIFICATION_AUDIT_CLOSURE.md`](RULINGS_2026-08-31_VERIFICATION_AUDIT_CLOSURE.md) — what was fixed

---

# Question 1 — The four verdict bands (80 / 65 / 50) have not been re-cut since the scoring model changed

## 1.1 What the composite score is

Every couple gets a headline number out of 100 and a one-word verdict. The 100
points are split across seven layers. **Porutham is only one of them.**

| Layer | What it measures | Weight **before** 2026-08-28 | Weight **now** |
|---|---|---|---|
| **Porutham** (10 poruthams) | the traditional star/rasi matching | 20 | **35** |
| 7th house strength | both charts' marriage house, lord, Venus | 20 | 20 |
| Navamsa (D9) | the marriage divisional chart | 20 | **15** |
| Dasha harmony | whether the running dasas favour marriage now | 15 | 15 |
| Dosham | Sevvai/Chevvai dosham both sides, Nadi dosham penalty | 10 | 10 |
| Emotional | Moon and Venus temperament fit | 10 | **5** |
| Synastry | generic planet-to-planet cross aspects | 5 | **0** |
| | | **100** | **100** |

You ruled on 2026-08-28 that Porutham was under-weighted at one fifth — it is the
instrument the family actually uses — and that the generic synastry layer should
stop moving the headline number at all. Both are shipped. The raise to Porutham
was paid for by Navamsa, Emotional and Synastry, so the total is still 100.

The verdict word is then cut from that number at three rungs
([`compatibility_intelligence.py:822`](../app/calculations/compatibility_intelligence.py#L822)):

| Score | Verdict shown to the couple |
|---|---|
| 80–100 | **EXCELLENT** |
| 65–79 | **GOOD** |
| 50–64 | **AVERAGE** |
| 0–49 | **CAUTION** |

Plus one override: **if Rajju or Vedha fails, the verdict is forced to CAUTION**
no matter how high the number is. That veto is unaffected by anything below.

**These three rungs — 80, 65, 50 — were chosen when Porutham was worth 20 points.
They have never been re-cut. That is what I am asking about.**

## 1.2 What moved underneath them

Two separate things from the same ruling set moved the distribution, in
**opposite directions**.

### (a) The re-weighting moves each couple by up to ±15 points

Because Porutham went 20 → 35 while Navamsa, Emotional and Synastry each lost
points, a couple's composite changes by:

```
change = (0.15 × porutham %) − (0.05 × navamsa %) − (0.05 × emotional %) − (0.05 × synastry %)
```

- A couple strong in porutham and weak in the other three gains up to **+15 points**.
- A couple weak in porutham but strong in the other three loses up to **−15 points**.
- Realistic middle cases: 80% porutham with decent charts ≈ **+2 to +3**;
  40% porutham with strong charts ≈ **−7**.

15 points on a 100-point scale is **one whole verdict band, and part of a
second**. The rungs did not move to meet it.

This is not a mistake — it is exactly what you asked for. A couple whose star
matching is strong *should* now read better, and a couple carried by generic
chart factors *should* now read worse. The question is only whether 80/65/50 is
still where the words should break.

### (b) The Sthree Deergham grading pushes 22% of pairs down 3.5 points

Your ruling 4b: **1–7 FAIL / 8–13 MADHYAMA / 14–27 UTTAMA**, with the binary
fallback that the point is awarded at **≥ 14**. So Madhyama scores **zero** in the
10-porutham total — it used to pass at ≥ 8.

I ran every possible star pair (27 × 27 = 729):

| Sthree Deergham band | pairs | share |
|---|---|---|
| FAIL (count 1–7) | 189 | 25.9% |
| **MADHYAMA (count 8–13)** | **162** | **22.2%** |
| UTTAMA (count 14–27) | 378 | 51.9% |

**Pass rate on this one porutham: 74.1% → 51.9%.** Each of those 162 pairs loses
exactly one porutham out of ten, which at the new weight is **3.5 composite
points** (it would have been 2 points under the old weighting). Averaged over all
pairs that is a **−0.78 point** shift.

## 1.3 Why I held instead of re-cutting the rungs

Three reasons, in order of weight.

**1. Attribution.** If I re-cut the rungs in the same change that moved the
distribution, then when a couple's verdict changes from GOOD to AVERAGE next
month, nobody — you included — can tell whether that came from your doctrine
ruling or from my re-tuning. The doctrine change would become unauditable. We
already have this rule recorded in the muhurta engine, on the Amavasai weight
([`muhurta_engine.py:209`](../app/calculations/muhurta_engine.py#L209)): *"retuning
the generic weight in the same change would make it impossible to tell which edit
moved a ranking."* Same situation, same answer.

**2. The downward part is intended.** You ruled that Madhyama earns no point.
Couples in that band scoring lower is the ruling *working*. Re-cutting the rungs
to keep their verdicts where they were would quietly undo the ruling I had just
implemented.

**3. The 729-pair sweep cannot answer this question, even though it looks like it
can.** The sweep only varies the two birth stars. **65 of the 100 composite points
come from layers no star pair determines** — 7th house strength, Navamsa, running
dasas, Sevvai dosham, Moon/Venus temperament. All of those need real birth data:
date, time and place. So the star grid tells us exactly how the *porutham* layer
moved and tells us nothing reliable about where the composite scores actually pile
up. Re-cutting 80/65/50 against it would be fitting the rungs to a distribution
that does not exist in practice.

## 1.4 What I need from you

**Q1a — Should the rungs be re-cut at all?**
A defensible answer is "no": the verdict follows the doctrine wherever the doctrine
sends it, and if fewer couples now read EXCELLENT, that is the truthful result.
The opposite answer is also defensible: the four words are a communication device
with an intended spread, and they should be kept meaning what they meant.

**Q1b — If yes, re-cut against what?**
Not "what makes the numbers look nice." I need an astrological anchor. The most
useful form for me is **anchor cases**: describe 5–10 couples in doctrinal terms —
how many poruthams pass, which ones, dosham present or not, strength of the 7th
and of the Navamsa — and tell me the one-word verdict *you* would give each. I fit
the rungs to your judgements and record your reasoning at the rungs themselves.

A quicker version of the same question, if that is too long: **what verdict should
a couple get who passes 7 of 10 poruthams, has no Rajju/Vedha and no Sevvai
dosham, and has ordinary, unremarkable charts otherwise?** Today they land around
GOOD. If you say that couple should read EXCELLENT, or should read AVERAGE, the
rungs move accordingly.

**Q1c — Where does Madhyama sit in a *couple's* reading?**
This one feeds Question 2 as well. Sthree Deergham at count 8–13 now scores zero,
i.e. it counts on the failing side of the tally. Is Madhyama, in your practice,
**a weak pass** or **a soft fail**? The arithmetic already treats it as a fail (your
binary fallback said ≥ 14). I am asking about the *reading*, because the words on
screen have to match how you would say it aloud to a family.

**Independent of your answer**, I will build the real-chart distribution — the
composite scores over a few hundred synthetic-but-realistic charts — so that
whichever way you rule, the rungs are cut against how the number actually behaves
and not against a star grid. That work does not need your sign-off; it is just
measurement.

*(Housekeeping, no decision needed: while I was at the rungs I found a stale code
comment still claiming "Porutham is only 20 of the 100 weighted points" next to
the Rajju/Vedha veto. It said 20 until 2026-08-31. Corrected.)*

---

# Question 2 — Where the Madhyama grade should appear, on screens whose verdict is not a word

## 2.1 The background

Your 4b ruling created a three-band grade where there used to be a pass/fail. The
score stays 0 or 1 per porutham — you gave the binary fallback for exactly that
reason — so the **grade has to be carried as a separate word alongside the score**,
or it is lost.

Without it, a couple at count 8–13 sees a plain red **FAIL** on Sthree Deergham
(ஸ்திரீ தீர்கம்) where the same couple read **PASS** a week ago, with no word on the
screen to explain why. That is 22.2% of star pairs.

## 2.2 What is fixed

Three screens now carry the grade:

| Screen | Status |
|---|---|
| Porutham tool, signed-in dashboard | ✅ already showed it |
| Mobile porutham screen | ✅ already showed it |
| **Compatibility Intelligence panel, signed-in dashboard** | ✅ **fixed 2026-08-31** |

The third one is the one the audit caught, and it was the worst to have missed —
it is the full seven-layer report, the deepest reading we produce.

**How I fixed it, and why this matters for the rest of the question:** the row now
shows **"Madhyama"** *in place of* the PASS/FAIL word, not next to it. A row that
says **FAIL** on one side and **Madhyama** on the other reads as the system
contradicting itself. The band is not a competing second opinion — it is the same
judgement at finer resolution, so it replaces the coarser word. A short plain-
language gloss appears under the list when any porutham comes out Madhyama,
because "Madhyama" on its own is not much more use to a family than "FAIL" on its
own. (I also fixed a bilingual echo on that row — it was printing the porutham
name in both languages; it now follows the language the reader has chosen, like
its sibling screen.)

## 2.3 What is NOT fixed, and why I stopped

**Four more screens show the ten poruthams and none of them shows the grade.** The
same 22.2% of couples still see an unexplained FAIL on those.

| Screen | Who sees it | How it shows a porutham today |
|---|---|---|
| **Synastry panel** (dashboard) | signed-in | a rich coloured row; the colour is **calculated from the score**, not read from a word |
| **Public porutham calculator** (`/tools/marriage-porutham-calculator`) | anyone, not signed in | a ✓ / ✗ table |
| **Shared porutham page** (the link a couple sends to family) | anyone with the link | a green **✓ Pass** / red **✗ Fail** pill, built from a true/false flag |
| **Share card image** | anyone the image reaches | a rendered picture, 8 bars, fixed size |

I did not bolt the grade onto these, deliberately. **They are four different
renderers, not four copies of one thing**, and each fails differently:

- The **synastry panel** decides its colour by arithmetic: 70% of the maximum or
  more is green, 40–70% is amber, below that is red. Each porutham is worth 1
  point, so the score is only ever 0 or 1 — meaning **the amber middle state
  already exists in that screen and can never be reached.** Adding Madhyama there
  is not adding a label, it is deciding what that middle state is for.
- The **shared page** has no verdict word to replace — it receives a plain
  true/false and prints Pass or Fail from it. Showing a grade there means changing
  what the screen is given, not just what it prints.
- The **share card** is a fixed-size generated image showing the top 8 bars. It
  may well be right to leave the grade off it rather than crowd the picture; that
  is a judgement about what a shareable image is for.

If I patch each one on its own, I recreate exactly the two-ratings contradiction I
was careful to avoid on the panel — some screens saying "Fail / Madhyama" side by
side, others saying only one, none of them agreeing.

## 2.4 What I need from you

**This is one decision, not four.** Once it is settled, the three list screens all
follow from it mechanically.

**Q2a — On a screen where the verdict is derived from the score rather than
written as a word, how should a graded band read?**

| Option | What a Madhyama couple would see | Trade-off |
|---|---|---|
| **A. Third state everywhere** | An amber **Madhyama** in place of the red Fail, on every screen including the public and shared ones | Consistent, and no couple ever sees an unexplained Fail. But it puts a Sanskrit grade in front of a public, non-astrologer audience with little room to explain it |
| **B. Grade only where it can be explained** | Signed-in detail panels show **Madhyama**; the public calculator, shared page and card keep the plain **Fail** (the score genuinely is 0) | Honest to the arithmetic and keeps the public surfaces simple. But the same couple reads Fail on the link they shared with family and Madhyama in their own report — and they will notice |
| **C. Middle ground** | Grade on every interactive screen, omitted only on the rendered share image | Keeps the picture uncluttered while nothing a couple can tap disagrees with anything else |

**My recommendation is C**, but this is your call: it is a question about how a
qualified verdict should be delivered to a family, not about code. **Q1c above —
whether Madhyama is a weak pass or a soft fail — largely settles it.** If Madhyama
is a soft fail, option B is coherent. If it is a weak pass, showing a bare "Fail"
on the page a couple forwards to their parents is a misrepresentation, and C or A
is required.

**Q2b — Should the plain-language gloss travel with the grade?**
On the fixed panel, "Madhyama" is accompanied by a one-line explanation for
readers with no astrology background. If the grade goes to public screens, does
the explanation go with it, or is the grade alone enough there?

---

## Summary of what I am asking

| # | Question | Blocks |
|---|---|---|
| Q1a | Should the 80/65/50 verdict rungs be re-cut now that Porutham is 35 of 100? | the composite verdict wording |
| Q1b | If yes — 5–10 anchor couples with the verdict you would give each, **or** just: what should a 7-of-10, no-dosham, ordinary-chart couple read as? | fitting the rungs |
| Q1c | Is **Madhyama** a weak pass or a soft fail in the reading (its *score* is already 0)? | Q2a, and the wording everywhere |
| Q2a | Should the Madhyama grade show on public and shared screens, or only in signed-in detail reports? | 3 remaining screens |
| Q2b | Does the plain-language explanation travel with the grade to those screens? | wording on 3 screens |

Nothing is blocked from shipping while these are open — the current behaviour is
your 2026-08-28 rulings applied literally. These are refinements to how that
result is cut into words and shown.
