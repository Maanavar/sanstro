# Feature-by-Feature Testing — One Feature at a Time (across P01–P10)

**Method:** The companion to `FEATURE_TEST_P01-P10.md`, with the axis flipped. Instead of *one feature per persona*, we take **one feature at a time** and run it against the same six questions — but now across the ten personas we've observed, capturing how they split:

1. **What they expected** · 2. **What happened** · 3. **Understood it?** · 4. **Trust it?** · 5. **Return tomorrow?** · 6. **Pay for it?**

Grounded in the real Nova dashboard and the P01–P10 first-run think-alouds. Where a feature's *true* audience is a persona beyond P10 (P11–P30), that's flagged rather than invented — honesty over coverage. No redesign; behaviour and judgement only.

**Feature scorecard (across observed personas P01–P10)**

| # | Feature | Lands with | Confuses / loses | Verdict |
|---|---------|-----------|------------------|---------|
| 1 | Daily Score Dial (/100) | P02, P08, P10 (as a *model*) | P01, P07, P09 (opaque number) | Trust-builder for analysts, noise for folk users |
| 2 | "See why" 6-signal breakdown | P02, P08, P10 | P06 (glazes) | The single smartest trust move; wasted on low-literacy |
| 3 | Emotional Weather | P05, P13-type, P06 | P03, P08 (ignore it) | Retention hook for reflective users |
| 4 | Panchangam strip | P01, P07, P08, P09 | — (universally legible) | The one feature *everyone* reads |
| 5 | Today's One Focus + window | P01, P10 | P06 ("if I had a thing") | Actionable atom; screenshot-worthy |
| 6 | Remedy / Parihaaram | P01, P07 | P05 (religion clash), P09 (wife's dept) | Payload for believers, friction for others |
| 7 | Ask Vinaadi (chat) | P05, P10 | P01/P07 (cost fear), P09 (paragraph≠answer) | Competent; fails voice-first + cost-anxious |
| 8 | Family vault | (intent: P07, P04, P19) | Everyone (empty on day 1) | High-intent, blocked by cold-start |
| 9 | Porutham | P02, P04 | — | Came-for feature; trusted as *method* |
| 10 | Muhurta / Muhurtham Naal | P03 | — | Highest willingness-to-pay |
| 11 | Decisions (A vs B) / What-If | P03, P10 | — | Works on skeptics who see the mechanism |
| 12 | Life Areas | P08, P10 | P01/P07 (red = panic) | Retention engine; red tiers scare folk users |
| 13 | Deep Dive (chart + dashas) | P08 (only) | P01, P05, P06, P07 (a wall) | Moat + liability; correctly collapsed |
| 14 | Annual Wrapped | P06 | — | Acquisition/share loop |
| 15 | Reports store (pay-per-use) | P03 (P08 for reports) | P01 (flees it) | Monetisation lands on 2 of 10 |

---

## Feature 1 — Daily Score Dial (/100 + label)

- **Expected:** A clear "is today good or bad." The folk users (P01, P07) wanted a plain verdict — நல்ல நாள் / ஜாக்கிரதை. The analysts (P02, P10) expected a mystical number and braced to dismiss it.
- **Happened:** An amber dial with a "/100" and an English caps label. P01, P07, P09 all hit the same wall: *is amber good? is 60 like pass marks?* The label is English caps they read slowly or not at all. P02/P08/P10 immediately reframed it as a scoring model, not a fortune.
- **Understood it?** Split hard. **No** for P01, P07, P09 (the number is opaque, the colour ambiguous). **Yes** for P02, P08, P10 (they read it as a normalised weighted output).
- **Trust it?** As a bare number, low across the board — even P08 calls it "astrology-for-children." Trust only appears *after* opening the breakdown (see Feature 2). The dial alone earns no trust from anyone.
- **Return tomorrow?** The dial isn't why anyone returns. Folk users return for the panchangam beside it; analysts return (if at all) for the breakdown beneath it. The number is decoration.
- **Pay for it?** No one, from anyone. It's the free hook, correctly.

## Feature 2 — "See why this score →" (6-signal breakdown)

- **Expected:** The analysts (P02, P08, P10) hoped for either a black box (to dismiss) or, best case, shown workings. Folk users didn't seek this at all.
- **Happened:** Six weighted signals — moon transit 28 · gochar 24 · dasha 19 · panchangam 14 · cautions 9 · remedial 6. P02 read it as "a linear weighted sum, hand-tuned, normalised — a reasonable little model." P10: "the single smartest trust move in the whole app." P08 approved the Chandra-transit-dominant weighting as "an opinion, honestly stated." P06 saw "a formula, not random — respect, low-key," then glazed at the paragraphs.
- **Understood it?** **Yes** for P02, P08, P10 (deeply). **Partial** for P06 (gets that it's a formula, not the terms). Not reached by P01, P07, P09.
- **Trust it?** This is where trust is *manufactured*. P10: "it reframes 'do you believe in astrology' into 'here's a scoring rubric, judge it yourself.'" Even the skeptics extend trust to the *transparency* while rejecting the astrology. The breakdown, not the dial, is the trust object.
- **Return tomorrow?** P10 names it "the retention hook, right there." For analysts, yes — a legible model invites re-checking. For folk users, irrelevant.
- **Pay for it?** No — but P10 (founder hat) rates it the feature he'd "lead the pitch with." Its value is trust/retention, not revenue.

## Feature 3 — Emotional Weather (tone · tendency · best-use tags)

- **Expected:** P05 (nurse) quietly wanted a gentle "what kind of day is this" to brace for a shift. P06 expected something cringe to roast. P03/P08 expected fluff to skip.
- **Happened:** A tone line + leaf/handshake/warning tags, deliberately un-scary and un-deterministic. P05: "THIS is the thing… a mood check-in with a cultural accent." P06: "ready to laugh and it's… fine? Slightly annoying that it's fine." P02 clocked it as carefully-hedged Barnum; P03/P08 waved past it as "poetry."
- **Understood it?** **Yes** universally — it's plain-language by design (beginner mode keeps it clean).
- **Trust it?** Bimodal. Reflective users (P05, and the P13/P20 archetype) trust it *as a mood mirror*, not fact — P05 rejects the clinical claim yet "it landed a little anyway." Analysts (P02) file it as un-falsifiable cold-reading. Busy/expert users (P03, P08) don't engage enough to trust or distrust.
- **Return tomorrow?** **Yes** for the reflective segment — P05 will "check tomorrow's emotional weather after I sleep." This is a genuine daily hook for a specific persona. No for P03/P08.
- **Pay for it?** No. It's a free comfort glance; P05 explicitly won't pay. Its ROI is retention among stress/reflection users, not revenue.

## Feature 4 — Panchangam strip (Nakshatram · Tithi · Nalla Neram · Rahu Kalam · Sunrise)

- **Expected:** The folk-devout users (P01, P07, P09) came *for this* — the caution/good hours they already live by. P08 expected to audit it against his own almanac.
- **Happened:** Rahu Kalam in red with exact times, Nalla Neram in green, right at the top. P01 found it in seconds and mapped it to real life. P07 brightened: "this is what I came for." P08 compared it to his panjangam — "tithi, nakshatra, Rahu Kalam to the minute, matches." P09 (the fisherman) leaned in for the first time.
- **Understood it?** **Yes** — the most universally legible feature in the app. Even P09, who can't read the UI, understands Rahu Kalam times when his nephew points to them. (P07 briefly confused *what* Rahu Kalam governs — travel vs. tiffin — but not the times.)
- **Trust it?** **Highest trust of any feature.** It matches the temple almanac (P01, P07) and the expert's own panjangam to the minute (P08). It reads as "real," same category as the priest's paper.
- **Return tomorrow?** **Yes — the strongest daily habit in the app.** P01 ("check in the morning before a big-fare day"), P07 ("every morning like the lamp"). This is the retention spine for the folk-devout majority.
- **Pay for it?** **No — from anyone.** Panchangam is free public/temple knowledge in every folk user's mental model. P01 actively fled the moment a price appeared. A daily feature that will never monetise directly — and shouldn't try.

## Feature 5 — Today's One Focus + green "Do it HH:MM" window

- **Expected:** A concrete "when should I act." P01 hoped for a good-earning hour to hustle. P10 expected (and wanted) one actionable atom, not a lecture.
- **Happened:** One focus line + a green do-it window. P01: "if this is a good-earning time I should be on the road then — I like that it gives one clear time and not a big lecture." P10: "the window is the actionable atom — the thing a user screenshots and acts on." P06: "if I had an important thing" (no real use, but not confused).
- **Understood it?** **Yes** across the board — one line, one time, one action. The clearest information design in the app.
- **Trust it?** Moderate-to-good where it's relevant. P01 trusts it enough to plan his road time around it. P10 respects the *design decision* (bury the rest, hero one window) more than the astrology.
- **Return tomorrow?** **Yes** for action-oriented users (P01, P10) — it's screenshot-and-act. Neutral for students/skeptics with no "important thing" that day.
- **Pay for it?** No. Part of the free daily loop. Its value is engagement/actionability.

## Feature 6 — Remedy / Parihaaram card

- **Expected:** Folk-devout users (P01, P07) expected — and feared — a possible expensive-pooja upsell. P05 (Catholic) braced for a religious ask.
- **Happened:** A small, low-cost remedy — light a lamp, a short prayer. P01: "I was afraid it would say 'do a 5000-rupee pooja.' It didn't. Relief." P07: "it agrees with me — I light the lamp anyway." P05 winced: "this is where it stops being a mood app and becomes a religion that isn't mine — I skip it." P09 waved it off: "my wife does all that."
- **Understood it?** **Yes** — plain and small. No comprehension issue.
- **Trust it?** Trusted *and welcomed* by the devout (P01, P07) precisely because it's small and non-extractive. Actively declined on faith grounds by P05; treated as "not my department" by P09.
- **Return tomorrow?** For P01/P07 it's a gentle daily affirmation they'd glance at. For P05 it's a repel-point she routes around. Mixed by faith.
- **Pay for it?** No — and notably, its *trust value* depends on staying free/cheap. The moment a remedy implies paid ritual, P01's core fear ("hidden charges") reactivates. Keep it unmonetised.

## Feature 7 — Ask Vinaadi (floating chat)

- **Expected:** A place to ask one plain question. P09 wanted a yes/no on going to sea. P05 wanted gentle reassurance. P01/P07 wanted an answer *without* it costing data/money.
- **Happened:** A calm, hedged Claude-backed reply. P05: "soft and kind, more like a gentle friend — I feel a bit seen." P10: "competent astrology-flavoured wrapper." But P01 and P07 both froze on **cost anxiety** ("does each question cost money? it didn't say"). P09's fatal miss: he asked "can I go to sea tomorrow?" and got a paragraph, never a "go/stay" — "for a man who cannot read paragraphs, a paragraph is useless."
- **Understood it?** **Yes** for the literate (it's a chat). **No** for P09 — mediated, text-only, and the answer format doesn't match his need.
- **Trust it?** Where used, moderate — P05 trusts the *tone*; P10 trusts it's competent. But un-earned for P01/P07 (too scared of cost to test twice) and rejected by P09 (didn't answer clearly).
- **Return tomorrow?** Low-frequency. P05 might; P01/P07 won't "in case each question costs"; P09 can't. The cost-transparency gap actively suppresses return among the anxious-poor majority.
- **Pay for it?** This is the one daily-surface feature with a **direct monetisation line** (Ask-Vinaadi top-ups in the Reports store, per P10). But the personas who'd pay-per-question are the least likely to (P01/P07 fear the cost; P09 can't use it). The paying user for this is P03/P10-type, not the daily folk user.

## Feature 8 — Family vault / Family tab

- **Expected:** P07 wanted to see the *whole household's* good/caution days together — "the nice part." P04 wanted to add her daughter to run porutham. P19-type users want to track mother/kids/self in one place.
- **Happened:** **Empty on day one** for every observed persona. P07 deflated: "konjam eemai — I wanted to see everyone's day together, and I can't yet." P04: "the main reason I came, I can't do yet." P01/P03/P05 all left it empty (no birth details on hand / not committed).
- **Understood it?** Yes — everyone understood "add members." The problem isn't comprehension, it's **cold-start friction** (needs exact birth times they don't have at the moment).
- **Trust it?** Untested at first run — but P04 surfaced a real trust blocker: *"my daughter's private birth details in a company's computer… in our custom you don't hand a horoscope to strangers."* Data-custody trust is the gate here, not feature trust.
- **Return tomorrow?** **Yes, with intent** — P07 ("Sunday with my son"), P04 ("tomorrow, from the almirah, carefully"). The intent is strong; the return is *deferred* by cold-start and privacy hesitation.
- **Pay for it?** No — the vault itself is the retention engine, not a paywall. But it's the on-ramp to paid porutham/reports once populated.

## Feature 9 — Porutham (10-factor match, Rajju/Vedhai gates)

- **Expected:** P02 (skeptic) came to decode *why* matches "fail on Rajju." P04 (mother) came for a trustworthy, non-exploitative second opinion on a match for her daughter.
- **Happened:** All ten factors laid out, with Rajju/Vedhai flagged as hard-fail gates. P02: "I came to catch my parents out and instead I understand the machine — worth something." P04: "the proper traditional method, not a broker's shortcut… I can see all ten myself instead of trusting 'no, Sevvai.'" (Both blocked from *running* it without a second chart, but the structure delivered.)
- **Understood it?** **Yes** — both grasped the gate logic precisely. P02 read it as a rules engine; P04, the teacher, followed all ten factors.
- **Trust it?** Trusted as **faithful implementation of the method**. P02 rejects the belief but trusts the rules are correctly applied; P04 trusts the completeness and the calm, non-upselling tone.
- **Return tomorrow?** P04 **yes** (deferred until she adds her daughter). P02 **no** — one-time informational win, question resolved, she's a dissect-and-leave user.
- **Pay for it?** P04: **maybe** ("only if the free porutham isn't enough"). P02: no. But note P03 and P16 (wedding planner, unobserved here) are the willing porutham-report buyers — the paying market is the *facilitators*, not the skeptic.

## Feature 10 — Muhurta / Muhurtham Naal (auspicious-timing lookup)

- **Expected:** P03 wanted an always-available muhurtham so he's not waiting days for his astrologer to sign off on a business move.
- **Happened:** Auspicious windows + good-days-by-year, and — decisively — **it roughly matched his purohitar** for a recent date ("same day is green"). P03 flipped from "not for me" to "more than interested."
- **Understood it?** **Yes** — his domain; zero learning curve.
- **Trust it?** **Yes, roughly** — the match-with-his-own-astrologer is the exact thing that converted him. "Same day green, in my pocket at midnight" clears his bar.
- **Return tomorrow?** **Yes — on demand.** Not daily, but high-value whenever a signing/launch/family date arises.
- **Pay for it?** **Yes — the strongest willingness-to-pay in the ten.** P03: "money is not my problem, time is." Buys a report at 11pm rather than chase the astrologer for a week. This feature + Reports is the app's clearest revenue engine. (Also the true home of P15/P16/P18/P22 — farmers, planners, jewellers, dancers — all unobserved but muhurtham-driven.)

## Feature 11 — Decisions (A vs B) / What-If

- **Expected:** P10 wanted a "structured coin-flip with a story" for a choice he's 70% decided on — explicitly *not* a fortune-teller. P03 wanted a calm read on a real business fork.
- **Happened:** A hedged comparison keyed to timing signals, agency left to the user, openly framed as structured comparison not prophecy. P10 put in a real round-timing dilemma: "a decision journal wearing astrology, honest that that's what it is." P03: "it's helping me think, not pretending to be God — as a businessman I appreciate that it knows its place."
- **Understood it?** **Yes** — both grasped surface *and* mechanism. P10 names every lever pulled on him.
- **Trust it?** P10: **no — and it works anyway.** "I can see the mechanism and still feel less anxious." P03 trusts it as thinking-support. The honesty of the framing ("not a fortune-teller") is what earns respect from skeptics.
- **Return tomorrow?** **Yes, situationally** — reached for at every real fork. Founder/trader decision-cadence makes it frequent enough to be sticky.
- **Pay for it?** P10: soft **maybe** — "a good placebo before a board meeting is worth something." As a founder he rates its monetisation potential highly. This is the feature that monetises the *analytical-agnostic* segment (P10, P13, P27).

## Feature 12 — Life Areas ("Where you stand, area by area")

- **Expected:** A per-domain read (money/health/family/career). P01 went straight to money (his tight spot); P05 to health (her profession); P08 wanted karaka reasoning tied to dasha.
- **Happened:** Tiered cards (needs-attention / steady / supportive), a chart-signature line, per-area caution + remedy. P10: "the retention engine — twelve re-engagement surfaces with a goals hook." P08: "more coherent than I feared — ties each to the active mahadasha." **But** a red "needs attention" tier spiked real anxiety in folk users: P07 "that red word caught my heart — a mother's mind runs"; P01 "my chest was tight for a second."
- **Understood it?** **Yes** at surface (cards + colours). The *tier colour* is where meaning slips — red reads as "something is wrong with my health" to P01/P07 rather than "take care."
- **Trust it?** P08 (expert) trusts the dasha-linkage. P02/P10 read it as calibrated Barnum ("plausible, non-committal, not insulting"). P05's clinical brain rejects the health claim while admitting it "landed." Trust tracks the persona's baseline skepticism.
- **Return tomorrow?** **Yes** — P10 calls it the habit-forming layer that turns a novelty into life-tracking. Each domain is a re-open reason. (The anxiety it triggers in folk users is *also* a return driver, uncomfortably.)
- **Pay for it?** Indirectly — the "Full report" per area is the pay-per-use on-ramp. The free tier drives habit; the depth drives P03/P08-type report purchases.

## Feature 13 — Deep Dive (planet table · Vargas · Shadbala · Yogini/Ashtottari/Kalachakra · Chara Dasha · Prasna)

- **Expected:** P08 (hobbyist) wanted Thirukanitham precision and *shown workings*, expecting to catch a wrong calculation instantly. Everyone else expected nothing from it.
- **Happened:** For P08, the core **passed his audit** (Lahiri applied correctly, padas/combustion/vargottama shown, his Moon nakshatra/pada and Lagna correct) — but the edges drew suspicion: **Shadbala simplified while wearing the full name; Kalachakra shipped prominently without a caveat.** For everyone else it was a wall: P01 "aiyaiyo, so many tables"; P05 "a completely different app hiding under the calm one"; P06 "the PhD section"; P07 "idhu enakku puriyaadhu," closed it embarrassed.
- **Understood it?** **Yes — only P08** (and the unobserved P11 priest, P19-type). **No** for P01, P05, P06, P07, P09 — correctly collapsed behind a toggle, but still overwhelming when opened.
- **Trust it?** P08: core **yes** (matches his hand-work), edges **no** (Shadbala mislabelled, Kalachakra unverified). This is the app's honest fault line — "a serious instrument whose ambition outruns its rigor at the edges." Folk users can't assess it; they just feel the shape (P01/P09 recognise the kattam and trust *that* familiar form).
- **Return tomorrow?** **Yes — for P08 specifically**, and powerfully: it gave him something to *interrogate* ("I'll check that Kalachakra against my texts this week"). For a hobbyist, an engine worth arguing with is the ultimate hook. No one else returns to it.
- **Pay for it?** P08: **maybe, for reports/PDFs** (studying grandchildren's charts). The daily depth he consumes free. This feature is a **moat** (nobody else computes Kalachakra) and a **liability** (nobody's verified it) at once — P10's exact read.

## Feature 14 — Annual Wrapped

- **Expected:** P06 saw "Wrapped" and instantly read "Spotify Wrapped, astrological" — expecting a fun, shareable novelty.
- **Happened:** Slides — his astrological year in review. "The shareable one, the thing I'd actually put on my story. I'm into this more than anything else so far." The single feature he engaged with most.
- **Understood it?** **Yes** — the format is native to his generation, zero learning curve.
- **Trust it?** **N/A — wrong axis.** He's a "timepass, machan" user; it needs to be *fun and roastable*, not true. Clears that bar easily.
- **Return tomorrow?** **Occasionally, not daily** — Wrapped is seasonal/social. He'd screenshot it to the group and re-open the daily card now and then. Real but low-frequency.
- **Pay for it?** **No** — ₹3,000/month pocket money, soft skeptic. The value he extracts (social currency) dies at any price point. P10 correctly reads Wrapped as the **acquisition/virality loop**, not a revenue line.

## Feature 15 — Reports store (pay-per-use)

- **Expected:** Most personas didn't come looking for it; they *encountered* it. P01 stumbled on it and tensed. P03 sized it up as a busy man's convenience.
- **Happened:** A pay-per-use store — jadhagam reports, porutham reports, Ask-Vinaadi top-ups. P01 **fled**: "aiyo, this is the money part — I stay far from this tab." P03: "if I can buy a proper porutham at 11pm instead of chasing the astrologer for a week — I'll pay without thinking twice." P05/P06: "prices, skip." P10 (founder): "freemium daily loop + subscription depth + pay-per-use reports — a more sophisticated stack than the category runs."
- **Understood it?** **Yes** — everyone understood "these cost money." The comprehension is instant; the *reaction* is what splits.
- **Trust it?** P01's core fear ("hidden charges") makes him distrust the whole *tab* by reflex — though he's relieved it's quarantined and "not blocking my daily number." P03 trusts it as a fair deal for a busy man. Trust here = whether the persona has money-anxiety or time-anxiety.
- **Return tomorrow?** Not a daily surface by design. Returned to *on need* — P03 when marriage talk starts, P08 for a full report to study.
- **Pay for it?** **This is the actual paying question, and it lands on 2 of 10:** P03 (yes, readily) and P08 (maybe, for serious reports). Everyone else is a firm no — folk users on money-anxiety (P01, P07, P09), skeptics on "won't pay to test a resolved hypothesis" (P02), reflective users on guilt/low-commitment (P05, P06). **Willingness-to-pay concentrates in the time-rich/cash-fine and the serious-hobbyist — not the daily majority.**

---

## What testing feature-by-feature reveals

1. **Legibility, not accuracy, decides adoption.** The panchangam strip wins universally because *everyone can read it*; the score dial loses the folk majority because an amber number + English caps label answers no question they asked. The same engine underneath, opposite outcomes — comprehension is the gate.
2. **The trust move is transparency, not truth.** Feature 2 (the 6-signal breakdown) converts skeptics *without* converting belief — P02/P08/P10 trust the *shown model* while rejecting the astrology. That's the app's cleverest mechanic and it's aimed squarely at the analytical segment.
3. **Willingness-to-pay lives in timing + artefacts, never the daily glance.** Muhurta (F10), Reports (F15), and depth PDFs (F13) are where money appears — and only for P03 (time-rich) and P08 (hobbyist). The daily-habit features (panchangam, emotional weather, one-focus) are load-bearing for *retention* and structurally un-monetisable, because their core users file them as free almanac knowledge.
4. **Two features actively suppress their own audience.** Ask Vinaadi (F7) loses the anxious-poor to cost-opacity and the voice-first fisherman to paragraph-answers; the red tiers in Life Areas (F12) convert "take care" into "something's wrong" for folk mothers. Both are content-correct and delivery-wrong.
5. **The Deep Dive (F13) is the honest fault line.** One persona in ten can use it (P08), and even he catches the over-reach — Shadbala mislabelled, Kalachakra uncaveated. It's simultaneously the moat and the biggest verification liability. Correctly collapsed, but its edges are where an expert's trust cracks.

*End — fifteen features, each tested against the six questions across P01–P10. Behaviour and judgement only; no redesign proposed.*
