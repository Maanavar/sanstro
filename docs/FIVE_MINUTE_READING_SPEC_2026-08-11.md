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
**provisional and unenforced** — no test asserts it yet. **Both Tamil passes
this gate named closed 2026-08-12** (§8.8, §8.9), so the one remaining
precondition is the 15-minute module's beat shapes, which are unbuilt.
Revisit and lock the number once they exist, so it is set against three
modules' worth of real copy instead of two.

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

### 7.4 Astrologer content-QA on the action table — kārakattvam closed 2026-08-13

Not a code decision — the mechanism that keys each graha's `action`
takeaway is structurally sound (it cannot drift to the wrong lord's
table; that is a property of the lookup, not the wording). What is
unverified is whether the strings themselves match classical
kārakattvam.

**Scope corrected 2026-08-12: eighteen strings, not nine.** This section
said "the nine strings" and meant `_VOICE[*].action`. `_CHILD_VOICE[*].action`
is a second nine-entry set, printed by `_beat_one_thing` whenever
`addressed_to == "parent"` — reader-facing copy on exactly the same axis,
sitting outside a review whose scope was written as a count. That is the
same defect §8.8 records between §8.5 and §7.1, one section over: **a
review scope named by how many strings it covers cannot tell you when a
new string joins the set. Name the predicate — every `action` entry any
register can print — and the count follows.**

The three criteria, applied to all eighteen: **kārakattvam** (is the
action genuinely that graha's?), **voice** (does it sit in §7.2's register
— and for `_CHILD_VOICE`, in the parent register specifically?), and
**claim strength** (does it smuggle in a prescription, a timing claim, a
number, or a ritual implication the reading has not earned?).

**Closed so far (owner review, 2026-08-12), both on claim strength:**
`_VOICE["VENUS"]` dropped "on a Friday" — Venus does own Friday, but this
beat is keyed on the running mahadasha and nothing upstream establishes
why *this* reader should act on a weekday, so it read as ritual;
`activity_timing_rules` owns vara where vara genuinely decides something.
`_VOICE["SATURN"]` dropped "for forty days" — the Saturn idea
(consistency, measurable effort) is right and kept, but a count that
specific is vrata shape and implies a doctrinal basis this module neither
has nor cites. Two Tamil strings were also replaced as unnatural
(`MERCURY`, `SATURN`); the remaining Tamil pass over all eighteen is
tracked separately from the kārakattvam question, because a string can be
doctrinally right and still read as translated.

**Kārakattvam pass, 2026-08-13 — seventeen held, one did not.**
`_CHILD_VOICE["MARS"]` read *"give the energy somewhere to go every day —
a sport, not a screen"*. The sport half is sound: physical exertion is
Kuja's own kārakattvam, and the `note` above it has already named the
energy needing somewhere to go. The screen half is derived from nothing.
No graha in this reading's frame owns the screen; insofar as any does it
is Budha's or Rahu's, so the clause reached outside its own key to forbid
something. That makes it worse than the three claims cut the day before —
those were merely unearned, whereas this is a rule about how a household
runs, handed to a parent with the chart's authority behind it. A parent
whose child games after homework is told, in a jothidam reading, that
they have it wrong. Replaced with what Kuja does license: *"give the
energy a physical outlet every day — the daily part matters more than
which one"*, which additionally hands the activity choice back to the
parent, where it belonged.

**The test that caught it, stated so it survives this session.** Six of
the eighteen actions are built as *"do X, not Y"*, and the shape hides
the defect, because the prescribed half is always checked and the
rejected half rarely is. **A contrast is earned only when the graha's own
kārakattvam covers both sides and picks between them.** Budha owns speech
and reading alike and prefers the mouth, so `_CHILD_VOICE["MERCURY"]`'s
"out loud rather than re-reading" is a choice made inside his own domain
and holds. Kuja owns the sport and owns nothing at all about the screen.
A prohibition whose object the chart never names is a household rule
wearing the reading's authority — check the rejected half, not just the
prescribed one. Recorded in `_TABLE_PROVENANCE`'s `action` comment beside
the claim-strength rule, since that is where the next contributor looks.

**Considered and deliberately kept:** `_VOICE["MARS"]`'s "stop pushing
the other three". It is a count, which is the shape §7.4 cut twice, but
it is a figure of speech for *the rest* rather than a doctrinal quantity
or a schedule, and it asserts nothing datable. Sanding it to "the rest"
would trade the register's bite (§7.2: direct, declarative) for
protection against a misreading no reader actually makes. The
claim-strength rule bites on durations, weekdays and repetition counts —
prescriptions — not on rhetorical number.

**Still open on this table:** the native-Tamil axis. All eighteen strings
live in `one_minute_reading_service.py`, under that module's still-open
module-level marker covering all 78 of its strings (less the five
`_AREA_NOUN` exemptions). The Tamil written for the MARS replacement
therefore ships in exactly the same unreviewed state as its 77 siblings —
no new debt, and no marker may be dated from this pass. Closing
kārakattvam does not close §7.4; it closes one of its two axes, which is
the §8.8 lesson applied one section over.

---

## 8. The descent rebuild, 2026-08-11 — what shipped, and where it departs from §1–§2

A second astrologer review, this time of **rendered output read start to
finish** rather than of the tables, found that the module as specified in §1–§2
had a structural problem no per-beat test could see, and that the spec itself
had walked into it.

**The finding, in one sentence:** the five-minute reading contained *less
chart* than the two-minute reading it is sold as an upgrade from. It elaborated
the most cold-readable material (temperament) at greater length, and silently
dropped the most derived material (`_beat_next_ten_years`, the forward horizon,
which §1's beat sequence never listed and so was never wired in). A reader who
chose five minutes over two paid for the extra length with the one beat that
named a dated event they had not reached yet.

That is a defect in §1's beat sequence, not only in the implementation. §1 is
eight beats of which five are natal temperament, and the two dated beats are
both dasha spans measured in years. Nothing in the shipped reading was true of
*this season* rather than *this life*, so nothing in it could be checked against
the reader's next few months — which is what a returning reader actually
verifies.

### 8.1 The sequence that shipped

```
1.  IDENTITY              (2-min, REORDERED — see §8.3)
2.  WHAT THIS RESTS ON    (2-min, unchanged)
3.  CORE NATURE           (gift → shadow, mechanism hinging INTO the shadow)
4.  REPEATING PATTERN     (unchanged)
5.  THE TENSION           (NEW — _LAGNA_FACE vs _MOON_MIND; withheld without a lagna)
6.  WHAT THE LAST PERIOD
    WAS TEACHING          (as §2.3, invitation now invitational — §8.3)
7.  RIGHT NOW             (maha + bhukti WITH ITS REAL END DATE + asks)
8.  THE WINDOW AHEAD      (NEW — Sani gochara from the janma rasi, dated to a month)
9.  YOUR [TOPIC] IN FULL  (REBUILT on the topic's house and its adhipathi)
10. WHAT COMES AFTER      (the forward horizon §1 omitted, now wired in)
11. ONE THING             (action, now naming the period it descends from)
```

Eleven beats for `self`, not eight. The three additions are all `DERIVED`/
`RULE` material, which is the point: **length buys chart, not sentences.**
The reading is a descent — mahadasha → bhukti → houses → transit window →
remedy — where each level cites something the previous level did not.

### 8.2 Where the implementation departs from §2, and why

- **§2.5's Beat 7 is rebuilt, not tuned.** The spec composed it from the
  strongest graha's `gift` behind a `_TOPIC_LENS` opener. That composition is
  what produced *"In home and family, that shows up as judgment people trust
  enough to act on"* — Beat 3's own opening clause, relabelled as the
  home-and-family manifestation four beats later. It is not fixable by
  rewording the lens: the defect is that the beat had no material of its own
  and was re-serving the two-minute reading's vocabulary. It now reads the
  topic's own house (`_TOPIC_HOUSE`), that house's adhipathi, and where the
  adhipathi actually sits — three chart facts used nowhere else in either
  reading. The lens survives as a bare locative phrase; its "that shows up as"
  hand-off, which is what made the reuse grammatically possible, is gone.
- **§2.1's mechanism clause moved to the other side of the full stop.** The
  spec said the clause is "the hinge that makes the first two read as one
  causal object", and the implementation printed it as `{gift} — {mechanism}.
  {shadow}.` — attaching a *because* clause to the strength. Seven of the nine
  strings were already written as gift→shadow bridges and were simply on the
  wrong side; Sun's and Jupiter's were not bridges at all and were rewritten.
- **§0.4's word budget went DOWN, 950/550 → 650/450.** Measured across 220
  synthetic charts, the widest reading this module can produce is 522 English
  words. A ceiling 82% above the worst real case cannot fail and therefore is
  not a guard. See `_FIVE_MIN_WORD_BUDGET`'s own comment — including the part
  worth a product decision: 522 words is ~2m22s at 220 wpm, against a feature
  called "five minutes", and three beats were *added* to get there.
- **§4's test list gains a seventh item, and it is the one that matters most.**
  Every copy defect this module has shipped — three of them — was a beat
  printing a content string another beat had already spent, found by a person
  reading rendered output and by no test. `repeated_source_clauses()` now scans
  an assembled reading by reflection over every content table in both modules;
  `test_no_content_clause_is_printed_by_two_beats_of_one_reading` runs it
  across five topic routes, and a positive-control test asserts the guard
  itself fires. This is the check the two-builder architecture needed to be
  safe — see §8.4.
- **§4.3's vocabulary cap rises 71 → 96**, the largest raise it has taken, and
  unpaid. The accounting is in the test's own docstring.

### 8.3 Shared two-minute fixes made in the same pass

These change the *two-minute* reading and were made there rather than
overridden in this module, because in each case the string was wrong at its
source and a second copy would have left the shorter reading broken:

- **The opening no longer leads with the forced choice.** `_SIGNATURE_OPENING`
  ("Some people X. Others Y. You are the second kind.") is a flattering binary
  most readers accept about themselves, and it was standing in the position the
  reading has earned the least. `nature` — keyed on the janma nakshatra's lord,
  and the only opening sentence with a cost in it — now leads, with the binary
  following as a summary rather than a hook.
- **`_PAST_INVITATION` became an invitation.** "Whether it took that form for
  you, only you can say" pre-conceded the retrodiction beat, which is the
  reading's strongest trust device. It now asks: "Where did that show up for
  you?" The reading keeps exactly one epistemic retreat — `_FALSIFIABILITY` in
  Beat 2 — because two read as insecurity.
- **The outlook clause names its own subject.** "The period running now
  supports that" was written as a trailing clause where "that" was clear; the
  five-minute module promoted it to a standalone sentence where the nearest
  antecedent was a *friction* clause, producing "…not knowing how to say no.
  The period running now supports that." Now keyed on `_AREA_NOUN`.
- Three smaller ones: the married-life beat names the reader's age instead of
  the undefined UI label "the building years"; Chandra's `action` drops
  "hydration" (no graha behind it, standing beside a remedy that has one);
  `_theme_prefix` suppresses the theme word when `past_texture` already
  contains it ("Endurance — it asked for endurance") and joins with a colon,
  since six of the nine textures carry an em dash of their own.

### 8.4 Architecture: two builders, one repetition guard

Considered and rejected: generating the five-minute reading first and deriving
the two-minute one by extraction, which would guarantee by construction that
the long version strictly contains more chart. Rejected because the two-minute
module ships four registers (`self`, `client_with_guardian`, `parent`, `other`)
and this module ships two — `parent`/`other` would need a separate path
regardless, so the inversion buys the guarantee for only half the surface while
putting a shipped, flag-on module with a 96 KB test suite through a rewrite.

`repeated_source_clauses()` buys the same guarantee for the case that actually
broke, at a fraction of the risk. If a third reading length is built, revisit:
the argument above gets weaker with each module that has to stay in sync.

### 8.5 Still open

- ~~**`PENDING NATIVE-TAMIL REVIEW` now covers 25 more strings**~~ — **CLOSED
  2026-08-12, see §8.8.** `_BHUKTI_FLAVOR` (9) followed the same day (§8.9);
  **this module carries no pending Tamil marker.** The 2-minute module's
  own module-level pass remains open in full.
- ~~**`find_saturn_egress_jd` does not special-case a retrograde loop**~~ —
  **CLOSED 2026-08-12, see §8.10.** It was not the edge case this bullet
  called it: measured over one reading per month, 1990–2050, **380 of 732
  samples (51.9%) rendered a different month**. `find_saturn_ingress_jd`
  still has the old behaviour in the backward direction — its consumer is a
  cycle report, and it was left alone rather than changed untested.
- ~~**The elder path states the mahadasha's end twice**~~ — **CLOSED
  2026-08-12, see §8.6.**
- **Guru's gochara is computed but not spoken** — only Sani gets a texture
  table, deliberately (§ the `_GOCHARA_SANI` comment). If the window beat
  earns a second graha, Guru is the one, and it is 12 more strings.

### 8.6 The doubled mahadasha end date, 2026-08-12 — closed

Beat 7's no-hinge branch bounded its texture with the mahadasha's end year
("runs to 2033") and Beat 10 stated the same handover to the month ("until
March 2033"), three beats later. §8.5 left it open on the grounds that the
first clause belongs to the shared `_beat_right_now` and the two-minute
reading depends on it. That framing was the obstacle, and it was wrong: the
clause does not have to be *removed* from the shared beat, only *suppressible
by a caller that has replaced it*.

`_beat_right_now` gains `name_maha_end: bool = True`. The default is the
two-minute reading's existing behaviour and both of its call sites take it —
this is additive to the shorter reading, which is asserted by
`test_the_two_minute_reading_still_bounds_its_own_no_hinge_lead`. Dropping the
year leaves both leads identical to the maha-hinge branch's own leads minus
the hinge prefix, so it is a suppression, not a fourth pair of strings.

**The judgement stays with the caller, and it is a conjunction of three
conditions, all of which must hold before the bound is dropped:**

1. `forward_beat_follows` — a fact about the **register**, not the chart, and
   therefore not derivable from the timeline: `client_with_guardian` is six
   beats with no forward horizon (§0.2), so nothing there would ever restate
   the handover.
2. `forward_beat_names_mahadasha_handover(timeline, as_of)` — new predicate in
   `one_minute_reading_service.py`. Both of `_beat_next_ten_years`'s
   `upcoming` branches print the handover month; its third branch names only
   an antardasha turn inside an unbroken mahadasha and never says when the
   mahadasha ends. It deliberately shares `_forward_horizon` and
   `_handovers_within` with the beat itself — the decade is computed once, so
   the predicate cannot drift from what the beat actually does.
3. A bhukti clause on Beat 7 itself, withheld on swabhukti. This is what makes
   the drop safe rather than merely tidy: it is the **nearer** expiry (months,
   not a decade) and it sits in the same breath as the texture it bounds,
   which a beat three positions away does not.

**The direction to fail is deliberate.** Keeping the year when any condition
is missing costs a reader a raised eyebrow; dropping it when nothing replaces
it re-breaks the cross-gate rule the bound was added for — "Saturn pays late"
with no expiry anywhere in the reading. Every condition above is a separate
regression test, including the two that assert the year *survives*.

### 8.7 The name, 2026-08-12 — it is a four-minute reading

§8.2 left this as "a product call and not a code one": ~520 words is about
2m22s at 220 wpm, against a feature called "five minutes". Decided by
measuring rather than arguing. Both readings were built for the same 120
charts (10 ages × 4 marital statuses × 3 birth times) and their `wordCount`
compared:

| | min | median | max |
|---|---|---|---|
| 2-minute EN | 207 | **236** | 268 |
| 4-minute EN | 388 | **487** | 519 |
| 4-minute TA | 270 | **332** | 357 |
| ratio (EN long ÷ short) | 1.83 | **2.01** | 2.15 |

**The longer reading is almost exactly twice the shorter one on every chart**
— a 0.32 spread across all 120. The content ladder is 2.0×; the names
promised 2.5×. One of the two had to move, and it was never going to be the
content: padding to reach a name is the failure §0.4 exists to prevent.

**The rate is the product's own, and this is the part worth keeping.** The
2026-08-10 rename shipped a 236-word median reading under the label "two
minutes" — **118 words per advertised minute**. That is not a claim about
reading speed; it is a labelling convention, and a defensible one for copy a
person stops to check against their own life rather than skims. Nobody had
written it down. At that rate 487 words is 4.1 minutes.

So the surface is titled **"Your chart in four minutes"** / **"உங்கள் ஜாதகம்
— நான்கு நிமிடங்களில்"**, and the rule for every future reading length is:

```
advertised minutes = round(median EN words / 118)
```

Re-measure whenever beats are added. **The name follows the measurement,
never the other way round** — which also means the 15-minute module inherits
an arithmetic answer instead of a fresh argument, and would need ~1,770
median EN words to keep its own name.

**Scope of the change, identical to the split `930689c` made:** the displayed
title (`dashboard-five-minute-reading.tsx`) and the OpenAPI `summary=`. The
module name, the route `/charts/{id}/five-minute`, the feature flag
`five_minute_reading`, this spec's filename and every internal identifier are
untouched. A route rename would break three packages to change a word the
reader never sees.

**Renaming DOWN is the uncomfortable half and it is still right.** A tier
someone may pay for now advertises a smaller number than it did yesterday.
But the alternative is a reader who checks a five-minute promise against a
three-minute read, and this product's entire thesis is that its claims are
checkable — trust is earned on the part the reader can verify. Advertising 2×
against a sibling that genuinely delivers 2× is a better ladder than a false
2.5×.

**Not done, deliberately:** growing the reading to earn "five minutes" would
take ~590 median EN words, and closing that 100-word gap by writing copy *to
hit a number* is the same mistake in the other direction. If the content does
grow — §8.5's Guru gochara table is the obvious next increment of real chart
— the name is re-derived from the formula above, not restored out of
nostalgia for the old one.

### 8.8 Native-Tamil review, 2026-08-12 — 25 of 34 strings passed

Owner sign-off on the four tables §8.5 listed: `_GOCHARA_SANI` (12),
`_SANI_PHASE_NAME` (5), `_LORD_STRENGTH_NOTE` (3), `_AREA_NOUN` (5). Each
table's `PENDING NATIVE-TAMIL REVIEW` comment is replaced in place by a
dated `NATIVE-TAMIL REVIEW PASSED` marker naming the entry count reviewed,
so the marker keeps saying what was actually checked rather than degrading
into an undated "reviewed" that nobody can scope later.

**§8.5's count and §7.1's gate were never the same set, and the difference
mattered.** §8.5 counted 25 *strings*; §7.1 gates the provenance-mix budget
on "the two pending passes", which are the two inline markers in this
module — `_BHUKTI_FLAVOR` (9) and `_GOCHARA_SANI` (12), 21 strings, only 12
of them shared with §8.5's 25. A sign-off taken on §8.5's list alone closes
one of the two markers and leaves the other untouched while reading, from
the §8.5 bullet, as though the whole thing were done. Two adjacent sections
counting the same backlog on different axes is the defect; the fix is that
both now name `_BHUKTI_FLAVOR` explicitly as the single remaining pass.

**Three of the four tables had no marker of their own** and shipped under
"the same posture as every other table in this module". That is fine as a
default and useless as a work item — a reviewer cannot sign off on a
posture. Each now carries its own dated marker.

`_AREA_NOUN` is the exception worth stating: it lives in
`one_minute_reading_service.py`, whose PENDING marker is a *module-level*
one in the docstring covering all 78 of that module's strings. Passing 5 of
those 78 cannot lift it, so the note there is written as an explicit
per-table exemption that says the module marker still stands. The 2-minute
module's own review remains open in full.

**Two review outcomes are recorded as constraints, not just approvals,**
because both look like defects to the next reader: `_GOCHARA_SANI[12]`
deliberately does not mention the cycle opening (its `_SANI_PHASE_NAME`
entry already carries that word, and the pair rendered as a tautology in
the first draft), and `_AREA_NOUN` entries are bare uninflected nouns by
design — the case is carried by a following `இதற்கு` or `பற்றி`, and
inflecting the noun itself would break all three call sites.

~~**Still open:** `_BHUKTI_FLAVOR` (9).~~ **Closed the same day — §8.9.**

### 8.9 `_BHUKTI_FLAVOR`, 2026-08-12 — the module's last Tamil marker

Owner sign-off on all nine entries, read as a set. This module now carries
**no** `PENDING NATIVE-TAMIL REVIEW` marker; 34 of 34 strings across §8.8
and here have passed.

**What was actually checked, beyond the wording.** Every entry ends in a
finite predicate — `கொண்டுவருகிறது`, `சேர்க்கிறது`, `திறக்கிறது`,
`தூண்டுகிறது` — so each completes the caller's frame on its own and the
caller never splices a case ending onto a table entry. That is the same
whole-words discipline `_SANI_PHASE_NAME` and `_GUIDANCE_FALLBACK` each
cite this table for, which means it is not a stylistic preference here but
a constraint three other places depend on. A future entry written as a
bare noun phrase would pass a native-speaker read of the string in
isolation and still break the frame; the marker records the predicate rule
so the next reviewer checks the property, not just the Tamil.

**Why the whole set closing does not move §7.1.** The provenance-mix budget
had two preconditions and this was the cheaper one. The other — the
15-minute module's beat shapes — is unbuilt, so the budget stays deferred
and §7.1 now names that as its single remaining blocker instead of
carrying a Tamil clause that is no longer true. The point of closing these
markers was never to unlock §7.1; it was to stop three separate sections
from describing the same backlog in terms that had drifted apart.

**Unchanged by this pass:** the 2-minute module's module-level marker in
`one_minute_reading_service.py`'s docstring, which still covers all 78 of
its strings less the 5 `_AREA_NOUN` entries exempted in §8.8. Closing the
5-minute module's Tamil says nothing about that one.

### 8.10 The Saturn egress date, 2026-08-12 — a 51.9% defect filed as an edge case

§8.5 carried this as a known simplification: `find_saturn_egress_jd`
returned the first crossing out of the sign rather than the last, and the
bullet reasoned that since the copy renders a month and "builds nothing on
the exact day", the imprecision was absorbed. **Both halves of that
defence were wrong**, and the second one is the more instructive.

**A retrograde loop moves the answer by months, not days.** A sign
boundary falling inside Saturn's retrograde arc is crossed three times —
forward, back, forward — and the gap between the first and last crossing is
a station interval. Month-rendering cannot absorb an error measured in
station intervals. Measured before fixing, one reading per month across
1990–2050: **380 of 732 samples (51.9%) would have printed a different
month, worst case 1302 days out.** A defect that fires on a coin flip was
sitting under a bullet that called it "a rare edge case", because the
frequency was reasoned about rather than counted. Counting it took one
throwaway script.

**And the value was never only rendered as a month.** `basis` prints
`egress.isoformat()` — the full instant — and the web surface shows it
behind the disclosure toggle. The argument for tolerating imprecision was
made about the prose while the exact figure was on screen one click away.
**When deciding how precise a value has to be, check every surface that
prints it, not the one the argument is about.**

**The fix is geometric, not a time window.** Saturn's retrograde arc is
~6.8° at its widest, so once it stands more than that past a boundary no
loop can reach back; the search walks past the first crossing, treats any
return to the sign as proof that the crossing behind it was not the last,
and bisects only after Saturn is 9° clear. A "wait N days and assume it is
settled" heuristic would have had to guess how long the loop takes, which
varies with where in the arc the boundary falls; this assumes only how far
back a loop can reach, which is a property of the orbit.

One implementation detail worth keeping: the coarse step is 30 days, the
band around the boundary is 5°, and Saturn's fastest is ~0.134°/day — so a
coarse step moves at most ~4.02° and **cannot** cross the boundary. Every
crossing is therefore approached at the 4-day fine step. Without that
invariant a re-entry lasting under a month could be stepped straight over,
which is the exact case the function exists to catch: the fix would have
looked correct and still missed the shortest loops.

Regression tests are in `tests/test_transits_calculations.py`, including
the pre-fix algorithm kept verbatim as the thing being regressed, and a
probe (December 2014, Saturn in rasi 8) where first and final crossings are
nine months apart.
