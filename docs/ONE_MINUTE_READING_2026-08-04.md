# "Your Chart in One Minute" — product + doctrine spec, 2026-08-04

**Hats:** Product Owner · Thirukanitham astrologer
**Method:** same as `DASHBOARD_PRODUCT_DECISIONS_2026-08-02.md` — read from the code, cite `file:line`,
code wins over docs.

> **Status, 2026-08-04 — BUILT, behind `one_minute_reading` (default off).**
> `app/services/one_minute_reading_service.py` · `app/schemas/one_minute_reading.py` ·
> `GET /charts/{id}/one-minute` (`app/api/charts.py`) · `packages/shared/src/api/oneMinuteReading.ts` ·
> `web/components/dashboard-one-minute-reading.tsx`, placed at the top of the active member's reading
> in `dashboard-family-charts-hybrid.tsx`. 53 tests in `tests/test_one_minute_reading.py`, all green;
> ruff, eslint and `tsc` clean; the two API-wrapper contract guards pass.
> **The one thing not done is the authed browser pass** — that is the gate on flipping the flag.
> §12 records where the build departed from this spec and why.

---

## Verdict in one paragraph

Vinaadi already computes everything this feature needs. `age_phase_service.py` knows the life stage
and rewrites house meanings for children; `life_areas_service.py` scores thirteen life areas and
already gates them on age, marital status and employment; `dasha.py` returns the full Vimshottari
timeline, so "the last ten years" and "the next ten years" are a walk over data we hold. What does
not exist is a **single ordered piece of prose that a person who knows no astrology can read in one
minute and recognise themselves in.** Every narrative surface we have is either term-heavy
(`/charts/{id}/jadhagam-report` returns tables of `lagnaRasi`, `vargottamaPlanets`,
`functionalNatureTable`) or arrives as parallel panels the reader must assemble themselves. This
spec is a **synthesis layer, not a new engine** — which is the only kind of new feature the 08-02
roadmap sanctions.

The strategic value is not the content. It is the **placement**: right now the moment after someone
enters their birth details is a dashboard of panels. It should be a minute of prose that makes them
say *"this is right about me."* That minute is the entire conversion event.

---

## 1. What a Tamil astrologer actually does in the first minute

This is the doctrinal anchor, and it dictates the whole information architecture.

When a jodhidar picks up a jadhagam, they speak for roughly a minute **before the client asks
anything**. The order is never random:

1. They name the star and describe the person's **nature** — checkable, not predictive.
2. They name **what the person is good at**, then the cost of it.
3. They describe the **stretch of years just past** — and this is the moment the client either leans
   in or stops listening.
4. They say **what is running now**.
5. They raise **the one question that belongs to this person's age** — never all of them.
6. They say **what changes next, and roughly when**.
7. They give **one thing to do**.

The client is convinced by steps 1–3, not by step 6. **Trust is earned on the checkable past and
spent on the unknowable future** — in that order, never the reverse. Every product decision below
follows from that one sentence.

---

## 2. The product

| | |
|---|---|
| **Name (EN)** | Your Chart in One Minute |
| **Name (TA)** | ஒரு நிமிடத்தில் உங்கள் ஜாதகம் |
| **Route** | `GET /api/v1/charts/{chart_id}/one-minute` |
| **Service** | `app/services/one_minute_reading_service.py` |
| **Flag** | `one_minute_reading` (default `False` until §9 review closes) |
| **Cost** | No new ephemeris work. One dasha timeline call + one life-areas call, both already cached. |

Single language per render, never both (standing rule: active language only, no title echo).

---

## 3. The seven beats, and where each one's data comes from

Word budget is the design constraint, not a nicety. At ~200 wpm English / ~130 wpm Tamil, one
minute is **200 English words / 150 Tamil words**. Hard ceiling 240 / 180, enforced by test (§8).
That means **one to two sentences per beat**. Anything richer belongs in the Jadhagam report,
which already exists.

### Beat 1 — Who you are · ~35 words

*The verification beat. If this misses, nothing after it is read.*

- **Source:** janma nakshatra + pada, Moon rasi, lagna — `ChartSummaryData.janma_nakshatra`,
  `.janma_pada`, `.moon_rasi`, `.lagna_rasi` (`app/schemas/charts.py:238-235`). Archetype line from
  `NAKSHATRA_LENS` (`app/services/nakshatra_content.py:19`).
- **Rule:** built from *observation-grade* chart facts only — never from a computed score. The star
  is what it is; a strength score is an inference, and inference has no place in the sentence whose
  job is to be recognised.
- **Rule — the trait must carry its own cost.** "You decide fast" is a horoscope. "You decide fast,
  and sometimes before you have the last fact" is an observation. A description that includes a
  flaw reads as someone who has looked; a description of pure gifts reads as flattery, and the
  reader discounts everything downstream.

### Beat 2 — What you are good at, and where it costs you · ~35 words

- **Source:** strongest and weakest planet from `strength_score`
  (`app/calculations/chart_strength.py`, with `holistic_strength_synthesis` on —
  `feature_flags.py:128`). Same inputs `JadhagamReportPlanetStrengthSummary`
  (`app/schemas/charts.py:311`) already uses.
- **Rule:** translate the graha into a **human capacity**, never the planet name in the body text.
  Sun → being seen and carrying authority · Moon → reading a room · Mars → drive, and confrontation
  · Mercury → words and analysis · Jupiter → judgment · Venus → relationships and taste · Saturn →
  endurance and structure · Rahu → ambition and unconventional routes · Ketu → detachment and depth.
- **Rule — order is fixed: strength first, soft spot second.** Never the reverse, and never two soft
  spots. The soft spot is phrased as *a tendency under pressure*, never as a defect.

### Beat 3 — The last ten years · ~35 words

*The proof beat. This is where the reader decides whether we are worth their time.*

- **Source:** `calculate_vimshottari_timeline(birth_jd, moon_lon, as_of_jd)`
  (`app/calculations/dasha.py:160`) walked **backwards** across the ten-year window; take the maha
  lord(s) covering the majority of it, plus any **mahadasha handover** falling inside it.
- **Rule — antardasha is required, not optional.** A Venus mahadasha runs 20 years; "the last ten
  years" inside one unbroken maha has no texture at all unless the antar level is walked. What a
  person actually *felt* was a transition, so the beat is built from transitions.
- **Rule (the important one) — name the texture, never the event.** Vimshottari tells us which lord
  ran a stretch. It does not tell us the person lost a job. "You had trouble at work in 2019" is a
  fabrication. "From 2015 to 2022 you were under Saturn — a stretch that asks for endurance and
  pays late" is a defensible claim about the *quality* of a period, and it is the line between this
  product and a fortune-teller.
- **Rule:** anchor to **calendar years the reader lived through**. "2015 to 2022" beats "a long
  phase" by a wide margin, because it is checkable.

### Beat 4 — Right now · ~25 words

- **Source:** `timeline.current_mahadasha` / `.current_antardasha`. Optionally one
  peyarchi-scale transit from `app/services/peyarchi_service.py`.
- **Rule:** peyarchi scale only (Sani ~2.5 yr, Guru ~1 yr). Nothing day-scale — Chandrashtama and
  the daily score belong on Today, and mixing a day-signal into a life-story beat makes the whole
  piece read as a horoscope.

### Beat 5 — The question your age is actually asking · ~40 words

*The user's core requirement, and the beat with the most ways to humiliate us.*

**Exactly one topic.** Routing, in strict precedence order:

| Condition | Topic | Source |
|---|---|---|
| `is_minor(stage)` (`age_phase_service.py:120`) | education + health, **addressed to the parent** | `_CHILD_HOUSE_THEMES` / `_TEEN_HOUSE_THEMES` (`age_phase_service.py:128,142`) |
| `employment_type == "student"` (`life_areas_service.py:369`) | education — **regardless of age** | `EDUCATION` area |
| `marital_status == "married"` (`:365`) | married-life harmony; children if 28–45 | `_married_relationship_text` (`:417`) |
| unmarried, 21–35 | marriage timing window | `RELATIONSHIPS` area + `marriage_service.py` |
| 25–55, not student | career and income | `CAREER` / `MONEY` areas |
| 55+ | health, and what you hand on | `HEALTH` / `SPIRITUAL` |

**Amended 2026-08-05** — two rows this table did not have, both safety
([audit §6.8](AGE_GATED_READING_AUDIT_2026-08-05.md)):

| Condition | Topic | Why the row above was wrong |
|---|---|---|
| `marital_status` null or `undisclosed`, adult | **no beat at all**, question raised | Every row above assumes a status. Absence is not "unmarried" — reading it that way is the same inference-from-absence that asserted progeny from age |
| `divorced` / `widowed` / `breakup`, under 60 | `STEADYING` — home, health, the people closest | `is_seeking_marriage()` is right for the marriage surface a reader *navigates to* and wrong for one that opens by itself. It told a 45-year-old widow marriage was her chart's question |

- **Rule:** gate on **facts we hold**, not on age alone. A 28-year-old PhD student is a student. A
  married 40-year-old must never be told when they will marry — that single failure loses the user
  permanently, and we already store the field that prevents it.
- **Rule — minors:** the reading addresses the **parent**, never the child, and mentions no career,
  no marriage, no money. `age_phase_service.py:96-102` records why this rule exists: an
  eight-month-old's chart once came back advising her to watch her standing at work. That was not a
  wrong graha reading; it was text written for the wrong person. This surface must route through
  `life_stage()` before it composes a single sentence.

### Beat 6 — The next ten years · ~35 words

- **Source:** forward walk of the same timeline. Name the next handover, its approximate date, and
  what changes in texture.
- **Rule:** **windows, never date-certain outcomes.** "From mid-2028" — not "in June 2028 you will".
  Every string passes `tone_validator` (`narrative_engine.py:1165`) via `run_safety_pass`
  (`safety_filter.py`), same seam whatif / life-areas / marriage already share.

### Beat 7 — One thing to do · ~20 words

- **Source:** `select_remedy_focus` (shared, anchored on the running dasa lord) or
  `_AREA_ACTION_GUIDANCE` (`life_areas_service.py:380`).
- **Rule:** exactly one action. For minors, prefixed via `remedy_lead_in_for_stage`
  (`age_phase_service.py:162`) so the instruction has a valid recipient.

Then one closing line that names the next click: *"This is the one-minute version → read the full
chart."*

---

## 4. What makes it read like a person wrote it

The brief was "user should think *yeah, he is right, I should read the next one.*" That is a
craft problem with specific, testable mechanics:

1. **Falsifiable before predictive.** Beats 1–3 contain nothing the reader cannot check against
   their own memory. Not one prediction until beat 6.
2. **Named years.** Beat 3 must contain at least one four-digit year.
3. **Every beat except the last ends on a hinge into the next.** Beat 3 closes "…and that changed in
   2022"; beat 4 opens there. This is what turns seven facts into one piece of writing, and it is
   the single highest-leverage copy rule in this document.
4. **One idea per sentence.** No clause stacking three claims.
5. **Tense discipline.** Present for nature, past for the past, conditional for the future. A reading
   that says "you will be patient" instead of "you are patient" has already told the reader it is
   guessing.
6. **Jargon out of the body, available on demand.** Each beat carries an optional `basis` string
   revealing the astrological ground ("Rohini, Moon in Rishaba; Saturn mahadasha 2015-2022"). The
   plain reader never sees it; the reader who wants to check us can. This pattern is already proven
   here — it is exactly what `AlignmentBasis` does for the numerology verdict.

**The jargon rule is language-specific, and this is not a detail.** In Tamil, நட்சத்திரம், ராசி, சனி,
சுக்கிரன் are ordinary household words — stripping them would make the copy read as translated-from-
English and *lose* trust. In English, "nakshatra", "rasi", "mahadasha", "lagna", "ashtakavarga" are
jargon to a diaspora reader who nonetheless knows what "Rohini" and "Saturn" mean. So: **proper
nouns are always allowed; technical terms are banned in English and permitted in Tamil.** The lint
in §8 encodes exactly this asymmetry.

---

## 5. Worked example

Illustrative draft against a **synthetic** profile (no real birth data — standing rule). Assume the
engine returns: Meena lagna · Moon in Rishaba, Rohini pada 2 · Saturn mahadasha to 2022, now Venus ·
`marital_status = "married"` · age 33.

### English — 216 words

> **Kavitha, this is your chart in one minute.**
>
> You were born under Rohini, with the Moon steady in Rishaba. That makes you someone people find
> easy to trust — you finish what you start, and you would rather be sure than be first. The cost is
> that once you have committed to a way of doing something, you find it unusually hard to let go of
> it, even after it stops working.
>
> Your real strength is patience with people. Where it costs you is confrontation: you tend to
> absorb rather than object, and it accumulates.
>
> Between 2015 and 2022 you were living under Saturn's long stretch. Saturn does not hand things
> over easily — that period asked for endurance more than it offered reward, and much of what you
> built then was built slowly, and mostly alone.
>
> That changed in 2022. You are in a Venus period now, and Venus repays exactly the kind of steady
> work Saturn extracted from you. This is the more generous half, not the harder one.
>
> Married, and in the building years — so the weight of the chart sits on home and children rather
> than on reinventing your work. The next three years support that more than they support a move.
>
> **One thing:** Fridays are yours. Start what matters on a Friday.

### Tamil — 158 words

> **கவிதா, உங்கள் ஜாதகம் — ஒரு நிமிடத்தில்.**
>
> நீங்கள் ரோகிணி நட்சத்திரத்தில், ரிஷப ராசியில் பிறந்தவர். தொடங்கியதை முடிப்பவர்; முதலில் இருப்பதை
> விட உறுதியாக இருப்பதையே விரும்புவீர்கள் — அதனால் மற்றவர்கள் உங்களை எளிதில் நம்புகிறார்கள். அதற்கு
> ஒரு விலையும் உண்டு: ஒரு வழிமுறையை ஏற்றுக்கொண்ட பிறகு, அது பலன் தராத நிலையிலும் அதை விட்டு
> விலகுவது உங்களுக்குக் கடினம்.
>
> உங்கள் உண்மையான பலம் மனிதர்களிடம் காட்டும் பொறுமை. விலை என்பது நேரடி மோதல் — எதிர்த்துச்
> சொல்வதை விட உள்ளுக்குள் தாங்கிக்கொள்கிறீர்கள்; அது சேர்ந்துகொண்டே வரும்.
>
> 2015 முதல் 2022 வரை சனியின் நீண்ட காலம் நடந்தது. சனி எளிதில் எதையும் தருவதில்லை — அந்தக் காலம்
> பலனை விடப் பொறுமையையே அதிகம் கேட்டது. அப்போது நீங்கள் கட்டியது மெதுவாக, பெரும்பாலும் தனியாகவே
> கட்டப்பட்டது.
>
> 2022-ல் அது மாறியது. இப்போது சுக்கிர காலம். சனி உங்களிடம் இருந்து எடுத்த அதே நிலையான உழைப்புக்கு
> சுக்கிரன் திருப்பித் தருகிறார். இது கடினமான பாதி அல்ல — தாராளமான பாதி.
>
> திருமணமானவர், வளர்ச்சிப் பருவத்தில் இருப்பவர் என்பதால், இப்போது ஜாதகத்தின் கவனம் வீடு மற்றும்
> பிள்ளைகள் மீதே இருக்கிறது. அடுத்த மூன்று ஆண்டுகள் தொழில் மாற்றத்தை விட அதையே ஆதரிக்கின்றன.
>
> **ஒரு செயல்:** வெள்ளிக்கிழமை உங்களுடையது. முக்கியமானதை வெள்ளியில் தொடங்குங்கள்.

Note what the two versions do differently: the Tamil keeps சனி/சுக்கிரன்/நட்சத்திரம் because those
are household words, and the English keeps "Rohini" and "Saturn" but never says "nakshatra" or
"mahadasha". Same beats, different jargon line — §4.

---

## 6. The one question the reading is allowed to ask

> **Superseded 2026-08-05 as to shape, not as to principle.** The three reasons below stood; the
> binary did not. See [AGE_GATED_READING_AUDIT_2026-08-05.md §6.8](AGE_GATED_READING_AUDIT_2026-08-05.md).
> What changed: the beat is **withheld** until the answer arrives rather than emitted alongside the
> question; the question carries **five** options, not two; and it is raised for any adult of unknown
> status, not only 21–35, because unknown was never evidence of anything.

`marital_status` is nullable (`app/models/birth_profile.py:49`). For an unmarried-or-unknown reader
aged 21–35, beat 5 has two completely different correct answers and no way to choose.

**Decision:** when `marital_status` is null and age is 21–35, beat 5 renders as a single inline
question — *"Are you married?"* — with two buttons, and the beat fills in on answer. This is the
only interactive element in the piece.

Three reasons it is right, not a cop-out: it prevents the one unrecoverable failure (telling a
married person when they will marry); it makes the article feel like a conversation rather than a
printout, which is exactly the "he is right" effect we are after; and it captures a field that
improves `life_areas`, `marriage_service` and daily guidance permanently. One question, asked at
the moment the reader can see why it matters, converts far better than the same field on an
onboarding form.

---

## 7. Placement — the "where"

**Rejected: the Today tab.** The 08-02 decisions doc is explicit that Today is at capacity and the
next thing added there must replace something. It is also the wrong surface conceptually: this is
about a life, not a day.

**Rejected: a new primary tab.** Same doc rules against tab proliferation; the IA re-cut already
landed.

**Decision — three placements, one canonical:**

1. **Canonical home: top of Family & Charts**, per member. `dashboard-family-charts-hybrid.tsx` is
   already a member-centric single-scroll page with a section rail — the reading becomes its first
   section, above the chart grid. Free win: it works for every member of the family vault, so a
   parent reads their child's minute too (correctly stage-gated by §3 beat 5).
2. **First-run hand-off — the highest-value placement.** The screen immediately after chart
   creation, full-bleed, one column, no dashboard chrome. This is the conversion event and the whole
   reason to build the feature. Costs a change to the onboarding gate, so it ships as its own commit.
3. **Re-entry:** one Today Quick Link (`dashboard-today-glance-nova.tsx`) — a link, not a card.

### Regeneration cadence — a trust decision, not a caching one

**The reading must not change day to day.** A life-story article that reads differently each morning
tells the reader instantly that it is generated. Cache key: `(chart_id, current_antardasha_period,
age_band, marital_status, employment_type, lang)`. It moves when the astrology actually moves — at
the antardasha boundary — and the response carries `readingWindow: {from, to}` and `asOf` so the UI
can say *"as of March 2026"* honestly.

---

## 8. Contract and tests

```
GET /api/v1/charts/{chart_id}/one-minute?lang=ta|en

data: {
  chartId, displayName, asOf,
  readingWindow: { from, to },
  stage, ageBand, focusTopic,
  beats: [ { id, text: {ta,en}, basis: {ta,en} | null } ],
  pendingQuestion: { field: "maritalStatus", options: [...] } | null,
  wordCount: { ta, en },
  nextStep: { label, href }
}
```

`beats` is an **array, not seven named fields**, so a beat can be suppressed (minor → no career
beat) without the frontend needing to know why. Per `CLAUDE.md`, a new endpoint gets a typed wrapper
in `packages/shared/src/api/` and web/mobile consume that wrapper — not a fresh direct fetch.

Tests that must exist before this ships:

| Test | Why |
|---|---|
| Word budget per language over a matrix of synthetic charts | The budget *is* the product; without a test it becomes a report within two sprints — which is exactly how the Jadhagam report got to where it is |
| Minor safety: no marriage/career/money token for INFANT/CHILD/TEEN | The failure `age_phase_service.py:96` documents, on a new surface |
| Married safety: no marriage-timing string when `marital_status == "married"` | The unrecoverable failure |
| `tone_validator` sweep over every generated string | Standing serve-time rule |
| English jargon lint (banned: mahadasha, antardasha, lagna, rasi, nakshatra, dasha, ashtakavarga, dosham, yoga, pada) — **not applied to Tamil** | §4's language asymmetry |
| Stability: same chart + same antardasha window → byte-identical output | §7's trust decision |
| Hinge check: every beat but the last ends on a forward reference | §4.3, the copy rule that does the most work |

---

## 9. The review gate — and how to keep it from becoming another closed one

The 08-02 doc's one-line summary is *"stop building engines, start opening gates,"* and we currently
hold four closed content gates. **This feature must not open a fifth that cannot close.**

That is a hard design constraint, not a caveat: **the template vocabulary must fit in one review
sitting — ceiling 60 strings per language.** Which means the beats compose from a small shared
vocabulary (9 planet-capacity phrasings + 7 beat frames + 6 topic frames + a handful of connectives),
**not** a per-nakshatra × per-planet × per-stage matrix, which would be 2,000 strings and would never
be reviewed. Ship English on merge; Tamil on one review pass, sized so that pass is a morning's work.

---

## 10. What this is explicitly not

- **Not a replacement for the Jadhagam report.** That is the document someone carries out of the
  room; per the 08-02 monetization table, that is the paid artifact. This is the free minute that
  makes them want it.
- **Not a place for scores.** No number appears on this surface. Scores live in Life Areas. A second
  rating beside a narrative verdict fuses into one confused claim.
- **Not personalised by an LLM.** Every string is a reviewed template filled from computed values —
  same posture as every other narrative surface here. An LLM in this loop would make the one
  surface whose entire value is trustworthiness the one surface we cannot audit.
- **Not daily.** See §7.

---

## 11. Sequence

1. **Phase 1 — backend.** `one_minute_reading_service.py`, schema, route, shared-client wrapper, the
   seven tests in §8. Flag `one_minute_reading = False`. Nothing user-visible.
2. **Phase 2 — frontend.** The reading component + Family & Charts placement. Flag still off; review
   in dev.
3. **Phase 3 — the question.** §6 inline `marital_status` capture.
4. **Phase 4 — Tamil review pass** (§9), then flag on for English + Tamil together.
5. **Phase 5 — onboarding hand-off** (§7.2). Separate commit because it touches the onboarding gate,
   and it is the piece with real conversion upside — it deserves its own before/after measurement.

---

## 12. What the build changed, and why — written after the code, not before

Six things in the spec above turned out to be wrong once real output existed. Recorded here because
the next person will otherwise reintroduce them.

### 12.1 A child's reading is a different artifact, not the adult one rephrased

The spec said minors get the same seven beats "addressed to the parent". The first build implemented
that by running the adult second-person copy through a string rewrite, and produced **"they carry
yourself as someone in charge"**. The broken grammar was the symptom; the defect underneath is that
the adult copy is about a life the child does not have. "Your soft spot is confrontation" is a
character verdict on an eight-year-old, and "the last ten years asked you for endurance" describes
their parents' decade.

**Built instead:** a separate `_CHILD_VOICE` vocabulary written natively in third person, and a
**four-beat** minor reading that *drops* the strength and last-ten-years beats rather than softening
them. Its forward beat states the shape of the years with no texture claim at all — a parent wants to
know when things change, not a character reading of a decade their child has not lived.

### 12.2 The vocabulary is 78 strings per language, not 60

The 60 was an estimate; the binding constraint was always "a Tamil review pass fits in one sitting",
which 78 short strings does. The size cap itself is real and load-bearing — the alternative shape
(per-nakshatra × per-graha × per-stage) is ~2,000 strings and would become a fifth
permanently-closed content gate.

### 12.3 "That changed in 2026" was contradicting itself one sentence later

Beat 3 found a *bhukti* turn inside an unbroken Venus mahadasha and handed the year to beat 4, which
opened "That changed in 2026. You are in a Venus period now." The reader is told something changed
and then told it is the same graha. The hinge now carries its **level**, and a within-mahadasha turn
gets a different connective ("Since 2026 the tone inside it has shifted. You are still under
Venus."). Pinned by `test_a_turn_that_was_only_a_bhukti_change_never_claims_the_period_changed`.

### 12.4 The ten-year window is clamped to age 15

"The last ten years repaid your patience with comfort", told to a 22-year-old, is a claim about a
twelve-year-old. The beat now names the real span ("From 2019"), which is both accurate and more
checkable — which was the entire job of the beat.

### 12.5 Elder is checked before married

A married 66-year-old was routed to MARRIED_LIFE and told the chart's weight sits on home "rather
than on reinventing your work" — not wrong so much as faintly absurd at 66. `ELDER_TOPIC_AGE = 60`
now precedes the married check, and is deliberately *higher* than `age_gate.MARRIAGE_UPPER_AGE`
(50): that constant answers "may we still discuss marriage timing", this one answers "is health and
legacy now the question", and 50 is far too early for the second.

### 12.6 Two prose-hygiene defects that no correctness test would ever catch

Star and rasi names arrive uppercase from the chart layer, so the first noun the reader met was
`MIRUGASEERIDAM`. And the facets are written as clauses, so used to open a sentence they produced
"You are in a Venus period now. **this** is a generous stretch". Both are now fixed and both are
tested (`test_star_and_rasi_names_are_not_shouted`, `test_no_sentence_starts_in_lower_case`),
because they are exactly the class of defect that ships past a green suite and destroys the one
thing this surface sells.

**All six were found by reading the generated output, not by a failing test.** That is the same
lesson `project_baby_names_own_names_2026-08-03` records, and it is the reason a preview pass over
real output belongs in this feature's definition of done.

---

## 13. The two open decisions, now decided

1. **The onboarding hand-off ships** (§7.2) — it is where nearly all of the value is. It is *not* in
   this build: it touches the onboarding gate and deserves its own commit and its own before/after
   measurement. Family & Charts is the v1 placement.
2. **English and Tamil ship together, behind a rollout flag rather than a content gate.** This
   reverses the framing of §9's original recommendation, on the strength of the 08-02 doc's own
   argument. A content gate produces a feature that renders with its sentences nulled — the outcome
   P0-2 is a full account of why to avoid. `one_minute_reading` is off/on, not reviewed/unreviewed,
   and the Tamil ships under the same `PENDING NATIVE-TAMIL REVIEW` marker
   `nakshatra_content.NAKSHATRA_LENS` is already live under. The risk class genuinely differs: this
   copy is chart-derived and passes `tone_validator` at serve time; the numerology gates hold back
   character claims made from a number.

## 14. The signature opening and the grievance (added after a copy review)

A competing Tamil draft was put beside this one. As writing it was better: it opened with a greeting
and a pause, it placed the reader in one of **two kinds of life** ("some people find opportunities
arrive; others must win each one — yours is the second"), and it quoted the reader's private
complaint back at them as their own inner question, then validated it before reframing.

As astrology it was unusable: **not one clause in it was chart-derived.** No date, no star, no
period — nothing a reader could check and find *wrong*. It was, specifically, a good
`delay_then_reward` reading served to everyone, including charts that are nothing like Saturn.

**Decision: take the craft, refuse the content — by making both devices chart-derived.** Both are now
keyed on the chart's dominant graha via `detect_signature()`
([app/reasoning/chart_signature.py:117](../app/reasoning/chart_signature.py#L117)), which was already
flag-on in production and unused by this surface:

- `_SIGNATURE_OPENING` — nine two-kinds-of-life placements, one per dominant graha. Every one is
  falsifiable: a reader can say "no, that is not me", which is the only thing that makes being right
  worth anything.
- `_SIGNATURE_GRIEVANCE` — nine private complaints. Saturn: *why is it still taking so long.* Rahu:
  *why does none of it ever feel like enough.* Moon: *why does everyone else's mood end up mine to
  carry.* Placed in beat 2 rather than the opening, because a complaint only lands once the cost that
  causes it has been named — first it is a guess, after the soft spot it is a conclusion.
- `detect_signature` raises rather than fabricating a "Sun chart" from empty input, so `_signature_lord`
  falls back to the janma nakshatra lord — the other graha this reading is already built on.

**This immediately produced a defect, and the fix is worth keeping.** Beat 1 now names two grahas in
consecutive sentences — the signature (opening) and the nakshatra lord (nature) — and they often
disagree. A Sun-signature chart with a Ketu nakshatra opened *"only fully yourself when you are being
watched"* and then said *"you withdraw"*. Printed flat that is whiplash and reads as an app that does
not know the reader. It is **not** fixed by suppressing one: a jodhidar reading two significators
that pull apart says so out loud, and naming the tension is more convincing than a flat single note
because real people are in fact contradictory. Silence when they agree, an explicit `And yet:` when
they do not.

### Two more defects the budget guard surfaced

- **`_beat_last_ten_years` described one year out of ten.** A Ketu mahadasha ending in 2017 inside a
  2016-2026 window produced *"From 2016 to 2017 you were under Ketu"* — and silently dropped the
  nine-year Venus stretch the reader actually lived. A handover is now only the story if the outgoing
  lord held ≥30% of the window (`_DOMINANT_STRETCH_SHARE`); below that the long stretch is the story
  and the turn is read at the bhukti level.
- **The 66-year-old married case was absent from the budget matrix** and ran 259 words against a 255
  ceiling — found by reading a preview, not by the test. The gap was the matrix, not the guard. Five
  more combinations added.

Ceilings moved 240/180 → 255/190, and most of the added words were paid for by **deleting** the
neutral outlook clause (thirteen words to report an absence of signal — silence is the honest
rendering of "no signal") rather than by the raise.

## 15. What remains

- **The authed browser pass.** The only gate left on flipping `one_minute_reading` to True. Layout,
  the disclosure toggles, the inline marital-status question round-trip, and the Tamil at real
  measure.
- **The onboarding hand-off** (§7.2, decision 1 above) — its own commit.
- **The Tamil review pass** — 78 strings, one sitting, and it is not blocking the flag.
