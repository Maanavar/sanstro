# The Five-Minute Reading — "Why am I like this, and what is happening now?"

Status: DRAFT for astrologer + engineering review, prior to implementation.
Depends on: `app/services/one_minute_reading.py` (all tables, enums and helpers
below are reused, not reinvented, unless explicitly marked NEW).
Companion docs this spec assumes and does not repeat: `docs/ONE_MINUTE_READING_2026-08-04.md`,
`docs/AGE_GATED_READING_AUDIT_2026-08-05.md`.

WHAT THIS IS. The second rung of a four-rung ladder (2 / 5 / 15 / 30 minutes).
Where the two-minute reading proves the system *saw* the person, the five-minute
reading has to make one thing *make sense* — one trait, explained down to its
mechanism, one period, explained rather than merely named, and one life topic,
given room instead of a single sentence. Everything else stays out.

WHAT THIS IS NOT. Not eight independent observations wearing the two-minute
reading's clothes for longer. Not a second, unrelated personality reading bolted
onto the first — every new beat here either deepens a beat the two-minute
reading already made (nature → nature's mechanism, one topic-sentence →
five-part topic reading) or extends its own trust device to a second dimension
(one dated period → a dated period **explained**). Nothing here is a new kind of
claim; some of it is a new *depth* of an old one, and depth is exactly what has
to be justified per beat, the same way the 2-minute module's own word-count
history had to justify every raise against what was actually being bought.

---

## 0. Decisions that have to be made before any beat is written

Four questions the source document (and the ChatGPT alternative reviewed
alongside it) both left open. None of the beats below can be scoped honestly
until these are answered, so they are answered here, first, and the beat specs
downstream simply inherit them.

### 0.1 Shared chart context — one computation, four consumers

`build_one_minute_reading` currently recomputes `nakshatra_lord`,
`signature_lord`, `strongest`/`weakest`, `lagna_reliable`, `topic`, `age`,
`stage`, `addressed_to` inline. The five-minute module needs the identical
values for the identical chart at the identical `as_of` — recomputing them a
second time is not just wasted work, it is a live risk that a rounding/timing
difference between the two call sites produces a *different* `signature_lord`
for the same person in the same sitting, which is precisely the kind of
contradiction Rule 1 in the source document exists to prevent one level up.

**NEW**, required before this module is built:

```python
@dataclass(frozen=True, slots=True)
class ChartContext:
    """Computed once per (chart_id, as_of). Every reading-length module
    consumes this rather than recomputing any field on it. If a field here
    changes definition, it changes for all four modules simultaneously —
    that is the point.
    """
    chart_id: UUID
    profile: BirthProfile
    timeline: VimshottariTimeline
    moon: PlanetPosition
    age: int
    stage: str
    addressed_to: str          # self | client_with_guardian | parent | other
    topic: str                 # one of the TOPIC_* constants
    nakshatra_lord: str
    signature_lord: str
    strongest: str
    weakest: str
    lagna_reliable: bool
```

`build_one_minute_reading` and the new `build_five_minute_reading` both take a
`ChartContext` rather than a `chart_id`; a thin wrapper at the API layer builds
the context once per request. This is not new content — it is a refactor of
the existing 2-minute service that has to land *first*, as its own PR, with the
2-minute test suite passing unchanged against it. Do not write beat 1 of the
five-minute reading against the old inline computation.

### 0.2 Register scope for this module

The 2-minute reading earns all four registers because even one minute of
character content about a third party is worth defending. Five minutes is not
free the same way.

| Register | 5-min scope | Reasoning |
|---|---|---|
| `self` | Full 8-beat reading | The only register this module is designed for. |
| `client_with_guardian` | Reduced 6-beat reading | Drops the shadow/grievance half of Beat 3 and drops Beat 4 (repeating pattern) entirely — see §0.3. Keeps identity, rests-on, nature, current period, age-topic mini-reading, one thing. |
| `parent` | **Not shipped in v1.** | A parent does not want five minutes of a toddler's temperament. The 2-minute `parent` reading already says what needs saying at this age; a longer version is padding, not depth, and re-introduces the exact "child not yet earning a character verdict" risk the 2-minute module was careful to avoid even at 1/4 the length. |
| `other` | **Not shipped in v1.** | Five minutes of character material about someone who is not the reader multiplies §3.1 surface area for no established reader need. Ship the 2-minute `other` reading and route straight to "read the full chart" — no 5-minute step between them. |

For `parent` and `other`, `require_five_minute_reading_enabled` returns the
same 404 the flag gate returns when off — **not** a fallback beat set. A
half-built third-party reading that silently degrades is worse than a feature
that plainly does not exist yet; the client shows the 2-minute reading and a
"full report" link instead.

### 0.3 Provenance: the repeating-pattern beat needs its own rule, not an inherited one

Beat 4 (§2.4 below) makes a claim no existing beat makes: that *one*
underlying trait shows up identically across *two* unrelated life domains
("you don't struggle to act — you struggle to act before you feel certain, and
that shows up both in how long you take to commit at work and in how long you
take to open up in relationships"). This is structurally the same failure mode
`_beat_strength_and_cost` was rewritten to avoid — drawing a single narrative
from grahas or domains that are not actually linked, and letting the connective
("which is why") assert a causal chain that is not in the chart.

**NEW invariant, enforced the same way `_beat_strength_and_cost` enforces "one
graha, one voice":**

> A repeating-pattern beat may only be built from **one** `_Voice` entry (one
> graha). Both domain manifestations must be derivable from that same graha's
> existing facets (`gift`/`shadow` for the trait, plus one new `domain_flex`
> facet per domain — see §2.4). It is not permitted to pick the trait from one
> graha and the second domain's manifestation from a different graha's table,
> even if both individually read well. If a reviewer cannot point to one graha
> that plausibly produces both sentences, the pairing does not ship.

Classified `Provenance.TENDENCY` (a disposition, present tense, no occurrence
— identical class to `nature`/`gift`/`shadow`), and `BaseRate.COMMON` rather
than `KEYED`. The reasoning: the *shape* of the claim ("I struggle to commit
before I feel certain, in more than one part of my life") is close to
universal — most people can find two domains where a hesitation trait shows
up if invited to look. What is `KEYED` is *which* trait and *which two
domains* are named, not the fact that some cross-domain pattern exists at all.
This is the same honesty `_GRIEVANCE` already practices for exactly this
reason — see `_TABLE_PROVENANCE["_GRIEVANCE"]`'s own comment on why keying the
form doesn't fix the base rate.

### 0.4 Word budget, derived from the clock, not multiplied from 330

The 2-minute module's own comment trail is the cautionary tale here — four
raises, three forced by tests catching real overflow, one explicitly
unpaid-for and later shown to be unearned when the beat that justified it got
cut. The five-minute budget must not repeat that by being `MAX_WORDS_EN * 2.5`.
It is derived fresh, per register, from the same reading speeds already
established (`~220 wpm EN`, `~130 wpm dense Tamil prose`), then treated as a
**ceiling**, with the same instruction the 2-minute module now states
explicitly: nothing is added later without something else being cut to pay
for it.

```python
# Five minutes at conversational-but-dense pacing, held to the SAME rule the
# 2-minute ceilings were held to after four unpaid raises: this is the outer
# edge, asserted by test, and it does not rise without a cut elsewhere paying
# for the rise. Unlike MAX_WORDS_EN/TA, this is per-register from day one —
# the 2-minute module only reached a per-gate matrix after shipping a single
# global number and living with its failure mode. Skip that step here.
_FIVE_MIN_WORD_BUDGET: dict[str, tuple[int, int]] = {
    "self": (950, 550),                 # ~4m19s EN / ~4m14s TA at the established wpm
    "client_with_guardian": (650, 380), # 6 beats, not 8 — see §0.2
}
```

950 English words at 220 wpm is ~4m19s — deliberately short of 5 minutes flat,
for the same reason the 2-minute ceiling sits at the "outer edge of about a
minute" rather than dead on 60 seconds: a reader who checks a clock against a
promise that undershoots trusts the next promise; a reader who checks a clock
that overshoots does not.

---

## 1. Beat sequence

```
1. IDENTITY               (2-min opening, unchanged)
2. WHAT THIS RESTS ON      (2-min falsifiability offer, unchanged)
3. CORE NATURE             (2-min gift→shadow, EXTENDED with mechanism clause)
4. REPEATING PATTERN       (NEW — one graha, two domains, see §0.3)
5. WHAT THE LAST PERIOD
   WAS TEACHING             (2-min past_texture, EXTENDED with theme + transition)
6. RIGHT NOW                (2-min right_now, EXTENDED with "what this period asks")
7. YOUR [TOPIC] IN FULL     (NEW — 5-part mini-reading on the routed topic)
8. ONE THING                (2-min one_thing, unchanged)
```

Beats 1, 2, 8 are reused verbatim from the 2-minute module — no new copy, no
new provenance decision, no new test. They are listed here only so the whole
sequence is visible in one place. Everything below concerns beats 3, 4, 5, 6, 7.

---

## 2. Beat specifications

### 2.1 Beat 3 — Core Nature (extended)

**2-minute version:** `_beat_strength_and_cost` — gift, then shadow, two
sentences, one graha.

**5-minute addition:** one clause of *mechanism* between gift and shadow —
not a third independent fact, but the hinge that makes the first two read as
one causal object instead of two adjacent observations. This is exactly the
gap the 2-minute module's own docstring names and declines to close at that
length ("Which is why... true by construction rather than by luck" — but the
2-minute reading stops one clause short of showing the *why*).

**NEW facet on `_Voice`, one per graha:**

```python
# The clause that turns "gift, then cost" into "gift, and here is exactly how
# it becomes the cost" — the mechanism, not a new fact. Present tense, no
# occurrence: still T-class. Written so it can be inserted between `gift` and
# `shadow` as a connective clause rather than read as its own sentence, the
# same discipline `past_texture`/`now_texture` already follow for `_cap()`.
mechanism: tuple[str, str]
```

Nine new strings (one per graha), reviewable in the same sitting as the rest
of `_VOICE` — this does not grow the vocabulary-size discipline problem, it
adds one column to a table that already exists.

Provenance: `Provenance.TENDENCY`, `BaseRate.KEYED` — identical classification
to `gift`/`shadow`, added to `_Voice.PROVENANCE` and to `_TABLE_PROVENANCE`
under the same key. No new class needed; this is more of the same claim,
correctly typed already.

Example (SUN): gift = "the authority people hand you without being asked" →
mechanism = "*because people read your certainty as competence before they've
tested it*" → shadow = "being seen to be wrong; you defend a position past the
point you believe it." The mechanism clause is what makes the shadow read as
the gift's own shadow rather than an adjacent Saturn-shaped complaint.

Word cost: ~15-20 words EN / ~12-15 TA per reading. Budgeted against §0.4.

### 2.2 Beat 4 — Repeating Pattern (NEW)

Purpose stated in the source ChatGPT document is right and worth keeping
verbatim: *"You don't usually struggle because you cannot do something. You
struggle when the situation asks you to act before you feel completely
certain"* — one trait, two manifestations, explicitly **not** a list across
five life areas.

**NEW facet on `_Voice`, two per graha (one per domain slot):**

```python
# domain_flex["WORK"] / domain_flex["RELATIONSHIPS"] — how the SAME shadow
# trait shows up in each domain. Not independent facts: both entries for a
# given graha must be readable as the same underlying hesitation/excess
# named in `shadow`, just relocated. A reviewer checks this by reading
# shadow + domain_flex["WORK"] + domain_flex["RELATIONSHIPS"] as three
# sentences about ONE behaviour, not three behaviours.
domain_flex: dict[str, tuple[str, str]]
```

Two domains only (`WORK`, `RELATIONSHIPS`) — not the five-area list the source
document explicitly warns against ("Don't say: this happens in your career,
marriage, family, finances and health. That's list generation."). Two domains
that plainly connect is a pattern; five is a horoscope checklist wearing a
pattern's syntax.

18 new strings total (9 grahas × 2 domains) — this is the first table in the
system that meaningfully tests the "one Tamil review sitting" constraint
against a second axis, and it is exactly the ceiling `_MOON_MIND`/`_LAGNA_FACE`
were held at when the 2-minute module needed a third axis of its own (§ "COPY
VOCABULARY SIZE" in the source doc predicted this pressure point in advance).
Hold the line at two domains for v1; a third domain is a decision for the
15-minute module, where cross-area synthesis is the entire point, not this one.

Provenance: `Provenance.TENDENCY`, `BaseRate.COMMON` (see §0.3 for why COMMON,
not KEYED — this is the one deliberate departure from "everything new here is
KEYED", and it should be marked in `_TABLE_PROVENANCE` with the same one-line
honesty `_GRIEVANCE` already models).

**Beat structure:**

```
{transition clause}, {domain_flex["WORK"]}. {transition clause}, {domain_flex["RELATIONSHIPS"]}.
```

No `_transition` device needed here — both clauses come from one graha by
construction (§0.3's invariant), so there is no contrast/continuation choice
to make; a fixed light connective ("At work, that can look like... In
relationships, it can look like...") is honest and sufficient.

**Does not reopen on `shadow`.** The first draft did — `{shadow, capitalised
as an opening clause}` ahead of the two domain clauses — on the theory that
the beat should name the trait before relocating it. Beat 4 always follows
Beat 3 directly, though, and Beat 3 already closes on "Where it costs you is
{shadow}." Reopening Beat 4 on the same `shadow` string a sentence later
prints the identical clause twice in a row: once framed as a cost, then
again with no framing at all. An astrologer review of rendered output on
2026-08-11 caught this reading the two beats start to finish — no test did,
since each beat was individually spec-compliant and §0.3's "one graha"
invariant held regardless. Same failure class as the Beat 7 fix in §2.5's
own "Composition, not authorship" note, fixed the same way: drop the
restated clause rather than paraphrase it.

### 2.3 Beat 5 — What the Last Period Was Teaching (extended)

**2-minute version:** `_beat_last_ten_years` — dated span, `past_texture`,
`_PAST_INVITATION`. Rule 1 and the E→R+invitation operator, both already
correctly implemented; nothing here is broken or needs replacing.

**5-minute addition:** the transition clause the source document calls for —
*"the emphasis begins to shift from endurance toward movement"* — is not a
new fact about a new period. It is the **hinge sentence `_beat_right_now`
already builds** (`hinge_ta`/`hinge_en` in the existing code), simply spoken
in full rather than compressed to "That changed in {year}." Reuse the same
`hinge` tuple `_beat_last_ten_years` already returns; do not compute a second
transition independently, or the two beats risk stating the turn differently.

**NEW:** one clause naming the *theme* of the outgoing lord's stretch before
the texture sentence — not a new fact, a restatement of `past_texture` with a
one-word theme label drawn from a small fixed table:

```python
# One label per graha — the noun the theme sentence opens on. Not a new
# claim: past_texture already says what the stretch asked for; this is the
# single word a person would use to summarise it before saying more. Kept
# separate from past_texture rather than baked into a longer past_texture
# string, because the 2-minute reading needs the short form and must not
# inherit a theme-word it never asked for.
_PERIOD_THEME: dict[str, tuple[str, str]] = {
    "SUN": ("பொறுப்பு", "responsibility"),
    "MOON": ("மாற்றம்", "change"),
    "MARS": ("வேகம்", "momentum"),
    "MERCURY": ("கற்றல்", "learning"),
    "JUPITER": ("விரிவாக்கம்", "expansion"),
    "VENUS": ("சமநிலை", "balance"),
    "SATURN": ("சகிப்புத்தன்மை", "endurance"),
    "RAHU": ("தேடல்", "reaching"),
    "KETU": ("விடுதல்", "letting go"),
}
```

Provenance: `Provenance.RULE`, `BaseRate.KEYED` — same class as `past_texture`
itself, since it is a compression of the same rule-applied-to-a-D-fact, not a
new kind of claim. Added to `_TABLE_PROVENANCE`.

### 2.4 Beat 6 — Right Now (extended)

**2-minute version:** `_beat_right_now` — hinge, current lord, `now_texture`.

**5-minute addition, matching the source document's "what this period asks
from you":** one clause of `Provenance.RULE`, keyed on the current mahadasha
lord, distinct from `now_texture` (which says what the period *offers*) —
this says what it *requires*. This is the direct extension of `action`'s own
logic one level up: `action` is already "the one thing to do while this lord
runs"; this clause is the *disposition* the period asks the reader to adopt,
which `action` then makes concrete in Beat 8.

```python
# What a stretch under this lord asks OF the reader, as a disposition rather
# than a task — the clause `action` (Beat 8) then makes concrete. Same class
# as `action`: a rule application, not a disposition of the reader and not an
# event. Distinct from `now_texture`, which says what the period offers;
# this says what it requires, and the two must not read as restatements of
# each other — a reviewer checks that offers/requires are not synonyms for a
# given graha before this ships.
asks: tuple[str, str]
```

Provenance: `Provenance.RULE`, `BaseRate.KEYED`. New facet on `_Voice`, nine
strings, added to `_Voice.PROVENANCE`.

**Addendum, 2026-08-11 — the antardasha (bhukti) clause.** An astrologer
review of rendered output found that Beat 6, as specified above, speaks only
in the mahadasha lord's voice. A mahadasha runs up to ~10 years; a chart is
static; so two five-minute readings of the same person taken a year or two
apart, inside the same still-running mahadasha, rendered a word-for-word
identical Beat 6 — no freshness mechanism for a repeat visit, and no answer
to "why does life feel like THIS right now" at finer resolution than a
decade. The antardasha was already computed and already cited in
`_beat_right_now`'s own `basis` field; it had just never reached the body
text.

Fix: `_BHUKTI_FLAVOR`, one entry per graha (nine strings, `Provenance.RULE`,
`BaseRate.KEYED` — same class as `now_texture` itself, one level finer),
naming what that graha's antardasha adds to whatever mahadasha it is
currently running inside. Deliberately keyed on the antardasha lord ALONE,
not the `(maha, antar)` pair — an 81-entry cross-product is exactly the
"COPY VOCABULARY SIZE" trap §2.5 below already refused once for Beat 7.
Rendered between `now_texture` and `asks`, and withheld entirely on
swabhukti (`current_antardasha.lord == current_mahadasha.lord`, the first
bhukti of every mahadasha and the common case, not an edge one) — reusing
the table there would restate what `now_texture` just said, the same
same-clause-twice defect Beat 4 was fixed for above. This is an
**unpaid** vocabulary-cap raise (60 → 62 → 71 across the day's two fixes) —
see `test_five_minute_vocabulary_stays_under_the_reviewable_cap`'s own
comment for why it was made anyway.

### 2.5 Beat 7 — Your [Topic] in Full (NEW)

The single largest new piece of this module, and the one place the source
document's five-part structure is worth adopting close to verbatim:

```
1. natural style in this domain
2. what environment / conditions suit it
3. what tends to create friction
4. current emphasis (drawn from the SAME dasha/area affinity already
   powering _outlook in the 2-minute reading — do not recompute)
5. guidance (one clause, feeds Beat 8's action if the topic and the
   running lord's action happen to align — no forced connection if not)
```

**Composition, not authorship.** This is the highest-risk new content in the
module if approached as "write five new sentences per topic per graha" —
that is 9 topics (`_TOPIC_AREA`'s current 8 plus `TOPIC_UNKNOWN` excluded) ×
9 grahas × 5 facets, which is exactly the ~2,000-string trap the source
document's own "COPY VOCABULARY SIZE" section already refused once, for
precisely this reason. **Do not author it that way.**

Instead, compose Beat 7 from tables that already exist, keyed by topic:

- Facets 1–3 (style / environment / friction) come from the **strongest
  graha's** existing `_Voice` facets, reframed through a short topic-specific
  *lens clause* — a small fixed table (9 topics × 1 lens sentence-opener,
  not 9 topics × 9 grahas) that turns "the authority people hand you without
  being asked" into "at work, that shows up as..." The lens supplies the
  domain; the graha table supplies the content. This is the same
  small-table-plus-existing-facet composition already recommended for the
  15-minute life-area grid, pulled one module earlier because Beat 7 needs it
  first.
- Facet 4 (current emphasis) is `_outlook()` **unchanged** — literally the
  same function call the 2-minute reading already makes for this topic, just
  surfaced as its own sentence instead of a trailing clause. No new logic.
- Facet 5 (guidance) is `action` from `_Voice`, reused from Beat 8's own
  source — if the running lord's `action` reads naturally as guidance for
  this specific topic it is used verbatim; if not, a single per-topic fallback
  clause is used ("bring one open question to your next conversation," etc.)
  rather than authoring per-graha-per-topic guidance from scratch.

**NEW table required — the lens only:**

```python
# One opening clause per topic, used to reframe the strongest graha's own
# gift/shadow into that domain. NOT a new characterization — a grammatical
# hinge. "At work, that shows up as..." / "In how you connect with people,
# that becomes..." Nine entries (one per non-UNKNOWN topic), reviewed once,
# reused against all nine grahas — this is the composition move that keeps
# Beat 7 out of the 2,000-string trap.
_TOPIC_LENS: dict[str, tuple[str, str]] = { ... }
```

Provenance for the composed beat: inherits `Provenance.TENDENCY` from the
graha facets it reframes, `Provenance.RULE` from the `_outlook`/`action`
clauses it reuses — declared in `_BEAT_PROVENANCE["your_topic_in_full"]` as
`frozenset({TENDENCY, RULE, FRAME})`, matching the union rule already in place
for every other composed beat.

**Marriage/status routing is unchanged** — Beat 7 is only reached when
`topic != TOPIC_UNKNOWN`, exactly as the 2-minute reading's own age-question
beat already withholds under the same condition, and the same pending-question
mechanism (`OneMinutePendingQuestion`, reused, not reinvented) asks for the
missing marital status before Beat 7 renders. `TOPIC_CHILD_GROWTH`/`TOPIC_TEEN`
route to the `client_with_guardian`/`parent`-appropriate lens content only,
per §0.2.

---

## 3. Cross-beat consistency (small, but real, at this scale)

Even at five beats of new material there is one seam worth guarding by test
rather than by review alone: **Beat 5's outgoing-period theme and Beat 6's
current-period texture must not read as contradicting each other** when the
hinge is `"antar"`-level (i.e. the mahadasha hasn't actually changed, only the
tone inside it has — see the existing `hinge[1] == "antar"` branch in
`_beat_right_now`). If Beat 5 says the outgoing stretch "asked for endurance"
and Beat 6, in the same graha's voice, says the same still-running stretch
"pays late, but it does pay," that is not a contradiction — it is the same
lord's texture, continued — but it is exactly the kind of pairing that reads
as inconsistent if the two clauses are drafted independently. Since both
already come from the same `_Voice[lord].past_texture` / `now_texture` pair
for the antar-hinge case, this is largely self-enforcing by construction; the
one thing worth a test is confirming the `maha`-hinge case (where the lord
*does* change) never produces two different themes for the same
`_PERIOD_THEME` entry in a single reading.

---

## 4. Testing requirements (`tests/test_five_minute_reading.py`)

Extends the existing `tests/test_one_minute_reading.py` pattern rather than
replacing it — the two suites should share fixtures where the underlying
chart facts are identical.

1. **Bidirectional provenance test**, identical shape to the 2-minute suite:
   every table discovered by reflection must appear in `_TABLE_PROVENANCE` or
   `_Voice.PROVENANCE`, and every declared class must be emitted by at least
   one live beat.
2. **Word budget test** against `_FIVE_MIN_WORD_BUDGET`, per register, exactly
   as `word_budget()` is asserted today — truncation is not an acceptable
   failure mode here either.
3. **Vocabulary size assertion**: total reviewable strings introduced by this
   module (mechanism: 9, domain_flex: 18, asks: 9, period_theme: 9, topic_lens:
   9 = 54 new strings) stays under a cap that still fits one Tamil review
   sitting alongside the 2-minute module's existing 78. Proposed cap: 60. If a
   future addition would exceed it, that is the signal to cut before adding,
   the same discipline the 2-minute module's own comment trail already
   demonstrates under real pressure.
4. **"One graha" invariant test** for Beat 4 (§0.3): asserts `domain_flex`
   entries are never sourced from a different graha than the beat's `shadow`
   clause — this is a structural test on the builder function, not on the
   copy tables, so it cannot be satisfied by writing convincing-sounding
   strings in the wrong place.
5. **Theme-consistency test** for the `maha`-hinge case (§3).
6. **Register-gating test**: confirms `parent` and `other` addressed-to values
   raise the same 404 `require_five_minute_reading_enabled` raises when the
   flag is off, and that no beat-building function for this module is ever
   called with those values.

---

## 5. Rollout

- Flag name: `five_minute_reading`, gated the identical way
  `require_one_minute_reading_enabled` gates the 2-minute reading — 404 before
  the ownership check, same reasoning (`one_minute_reading.py`'s own comment on
  this applies verbatim: a feature that hasn't launched should not advertise
  its own existence, and a gate that fires after the ownership check becomes an
  oracle for which chart ids exist).
- `CALC_VERSION`-equivalent: `"five-minute-reading-v1.0-2026"`.
- Route: `/five-minute` (module name, feature flag, and every internal
  identifier follow the 2-minute module's own renaming precedent — the
  user-facing string is the only thing that should ever need to change
  without touching the API-contract chain).

---

## 6. Open decisions for astrologer review before implementation starts

1. **`_TOPIC_LENS` wording** — nine sentences, needs the same native-Tamil
   review pass the 2-minute module's Tamil is still pending (`PENDING
   NATIVE-TAMIL REVIEW`, same marker, same posture).
2. **Whether `TOPIC_STEADYING`'s Beat 7 needs the same withheld-negation
   discipline** as its 2-minute age-question frame (§ "STEADYING" in the
   source file) — five minutes gives more room for a topic beat to drift into
   naming what it should not, and this is the topic most likely to need a
   second look once real copy is drafted.
3. **Whether Beat 4's two domains should ever be `EDUCATION`+`SELF_IMAGE`
   instead of `WORK`+`RELATIONSHIPS` for the `client_with_guardian` register**
   — currently this register drops Beat 4 entirely (§0.2); confirm that's the
   right call rather than a placeholder for "not yet designed."
4. **Confirm the 60-string vocabulary cap (§4.3)** is the right ceiling before
   any table is drafted — it is easier to hold a line before copy exists than
   to cut approved copy after a reviewer has signed off on it, which is
   exactly the situation the 2-minute module's own history warns against.

---

## 7. Product-owner decisions, 2026-08-11 (post-implementation)

Four items surfaced during the astrologer review pass on the *shipped*
module (`_BHUKTI_FLAVOR`, the Beat 3/4 verbatim-repetition fixes) that were
left open pending a call. Decided here rather than left dangling, with the
reasoning that would let a future contributor re-open them if the premise
changes.

### 7.1 Provenance-mix budget — deferred, not now

The existing machinery (`_TABLE_PROVENANCE` classifying every string,
`_BEAT_PROVENANCE` declaring the class-set each beat emits, tested
bidirectionally in both modules) already does real work: it bans `EVENT`/
`COLD_READ` outright and makes it impossible to add an unclassified table or
an undeclared beat without failing the suite. What it does not do is bound
the *ratio* of `TENDENCY` (soft, dispositional) to `DERIVED`/`RULE` (hard,
chart-mechanical) content inside a single beat — a beat could in principle
lean 90% T and still pass today's bidirectional test as long as one D/R
string is present somewhere.

**Decision: do not restructure the ~20 beat-builder functions into tagged
`(text, class)` clauses now.** Two reasons, not one:

- The rewrite is not a small decision to encode, it is a rewrite of every
  already-shipped, already-tested beat in both modules, for a property
  (mix ratio) nothing has yet demonstrated is actually drifting wrong in
  the shipped copy — the risk of the refactor itself currently outweighs
  the unconfirmed benefit.
- A ratio number set now would be calibrated against exactly two reading
  lengths (2-minute, 5-minute). The 15-minute module's own spec already
  earmarks cross-area synthesis and life-area grids as its central content
  — material that is structurally more `TENDENCY`-heavy by nature (a grid
  of "how you show up in each life area" is disposition-shaped, not
  event-shaped). Freezing a ratio before that module's shape exists risks
  writing a number the 15-minute module immediately has to special-case or
  break.

**Provisional target, written down now so the eventual work has a
starting point rather than a blank page:** when this lands, aim for
**≥50% of a beat's rendered clauses carrying `DERIVED` or `RULE`
provenance, `TENDENCY` capped at ≤40%, `FRAME` absorbing the remainder** —
mirrored per-beat, not just per-module, since a module-wide average would
let one hard-fact-heavy beat (`last_ten_years`) paper over one soft-trait
beat (`repeating_pattern`) that is nearly all T. This target is
**provisional and unenforced** — no test asserts it yet. Revisit and lock it
once the 15-minute module's beat shapes exist and the two pending
`PENDING NATIVE-TAMIL REVIEW` passes on this module close, so the number is
set against three modules' worth of real copy instead of two.

### 7.2 Voice register — resolved: the shipped copy IS the reference

No separate transcript/voice-reference doc exists in the repo, and none is
being created for this. Instead: **the copy already shipped in both
modules is the de facto register standard**, read back explicitly here so
a future contributor does not have to reconstruct it by diffing commits.

Sound like this (shipped, `_BHUKTI_FLAVOR`/`asks`/`_PERIOD_THEME`):
*"pushes you to move faster than the rest of this stretch asks for,"*
*"a steadiness that doesn't wait for the room to settle first,"*
*"brings extra visibility, for better or worse."* Direct, declarative,
present-tense, grounded in a named dasha/graha mechanism, no hedging
qualifier doing the work a chart fact should be doing.

Not like this (the register this module explicitly does not use):
*"you've got this,"* *"lean into the discomfort,"* *"hold space for what
comes up,"* *"your journey of growth" —* therapy-coach vocabulary that
could be pasted under any chart unchanged, which is precisely the
`COLD_READ`/`BaseRate.UNIVERSAL` failure mode `_TABLE_PROVENANCE` already
exists to keep out the door.

This is a **jothidar register**: someone who has read the chart and is
telling you plainly what it says, not someone coaching you through a
feeling. Every new table added to either module should be reviewed against
the three "sound like this" examples above before it is reviewed for
anything else.

### 7.3 `_strongest_and_weakest` tie-break — resolved, fixed

Was alphabetical on `graha` when two grahas tied on `strength_score` — no
astrological meaning, and it happened to always hand VENUS a strongest-tie
win over SATURN and always hand SUN a weakest-tie loss to everyone
alphabetically after it. Fixed to use the same classical dignity order
(`SUN > MOON > MARS > MERCURY > JUPITER > VENUS > SATURN > RAHU > KETU`)
`jaimini_karakas.py` and `chart_signature.py` already document and test
their own ties against — reused, not reinvented, so the codebase now has
one tie-break convention instead of two. See
`_STRENGTH_TIEBREAK_ORDER` in `one_minute_reading_service.py` and
`test_strongest_and_weakest_ties_break_by_classical_dignity_not_alphabet`
in `tests/test_one_minute_reading.py`.

### 7.4 Astrologer content-QA on the action table — tracked, not blocking

Not a code decision — the mechanism that keys each graha's `action`
takeaway is structurally sound (it cannot drift to the wrong lord's
table; that is a property of the lookup, not the wording). What is
unverified is whether the nine strings themselves match classical
kārakattvam. Tracked the same way the module's two `PENDING NATIVE-TAMIL
REVIEW` markers already are: a content-review item that does not block
shipping the code, and should be closed in the same review sitting as
those two markers rather than opened as a separate pass.
