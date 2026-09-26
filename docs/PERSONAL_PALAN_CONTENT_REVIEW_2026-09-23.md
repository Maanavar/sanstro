# Personal Palan Content Review — 2026-09-23

**Status:** SHIPPED AS OWNER-COMMISSIONED DRAFT (2026-09-23) · review still owed.

> **2026-09-23, owner direction.** The original gate below stopped all code
> until both sign-off rows were complete. No reviewer was ever named, so it
> could not open, and the feature the owner had asked for never reached the
> screen. The owner directed that it be built, with Claude acting as the
> Thirukanitham astrologer. The content now lives in
> `app/services/personal_palan.py` (`CONTENT_VERSION = palan-2026-09-23-v1`,
> `REVIEW_STATUS = OWNER_COMMISSIONED_DRAFT`). The composable structure below
> (A: 144-cell matrix, B: tara modifiers, C: precedence, D: banks) is exactly
> what was built. A reviewer reviews that file. Any wording change bumps
> `CONTENT_VERSION`. The sign-off rows remain open. They no longer block
> shipping; they gate the status moving from draft to reviewed.

This is the review packet for §5 of
[`HOME_CALENDAR_CHARTS_PROPOSALS_2026-09-22.md`](HOME_CALENDAR_CHARTS_PROPOSALS_2026-09-22.md).
It turns the product outline into a finite content job without pretending that
AI-written Tamil has already received a native or practicing-astrologer review.

## Product promise

The feature is **இன்றைய பலன் · உங்கள் ஜாதகப்படி** / **Today, from your
chart**. It is not a 12-bucket television rasipalan. Every line must be
traceable to the same daily-guidance evidence already used by the hero:

1. Moon's whole-sign transit house from the natal Moon (primary gochara lens).
2. Tara bala from the natal nakshatra.
3. Chandrashtama, when present, takes editorial precedence.
4. The running dasa/bhukti and day-lord relationship may qualify the reading,
   but must not introduce a second headline score.
5. Best part of day reuses the hero's recommended window; it is not recomputed.

The Moon-house component can remain similar for roughly 2¼ days. The product
must not imply that every sentence is newly calculated at midnight.

## Required reviewed content

Use **composable, independently reviewed tables**, not a 12 × 12 × 9 Cartesian
set of opaque finished readings:

### A. Area × Moon-house base matrix

Twelve consumer areas × twelve Moon houses = **144 rows**, each with English
and Tamil. Areas: career, business, money, family, love/marriage, health,
education, travel/vehicle, government/documents/legal, friends/community,
communication, and mental state.

Each row must contain:

| Field | Requirement |
|---|---|
| `area` | Stable language-free key |
| `moon_house` | Integer 1–12, counted from natal Moon |
| `polarity` | `FAVOURABLE`, `MIXED`, or `CAUTION`; must agree with the engine |
| `en` / `ta` | One concise observation; Tamil must be native-reviewed |
| `claim_scope` | What the sentence may and may not claim |
| `source_note` | Classical rule, project ruling, or explicitly marked product interpretation |

### B. Tara modifiers

Nine tara states × English/Tamil = **9 modifier rows**, not nine rewrites of
every area. A modifier may soften, sharpen, or prioritise a base line, but it
must not reverse an engine verdict. Record the tara number/name, permitted
areas, wording, and source note.

### C. Precedence copy

Review one English/Tamil rule for each of these collisions:

- Chandrashtama + otherwise favourable base line.
- Adverse tara + favourable Moon-house base.
- Favourable tara + caution Moon-house base.
- Dasa/bhukti qualification that conflicts with the day's headline verdict.
- No reliable birth time. The Moon/tara reading may remain; D9-house evidence
  must not be introduced as if reliable.

### D. Advice, worship and closing-line banks

Review finite keyed banks for actionable advice, light worship/remedy and the
closing line. A remedy may suggest prayer, gratitude or modest charity. It may
not frighten, promise a cure, demand a purchase or imply that skipping it
causes harm.

## Fifteen-section output contract

The complete reading may expose: overall, career/business, money, family,
love/marriage, health, education, travel/vehicle, government/documents/legal,
friends/community, Moon/mental state, one actionable advice line, lucky
aspects when separately approved, light worship/remedy, and a closing line.

On Today, render only overall + the three areas selected by life focus + advice
+ closing line. The remaining sections open in place. Family members keep the
neutral area order.

## Locked decisions

- **Lucky colour / number / direction:** built 2026-09-23 under R9 (see
  `personal_palan.py` section G). One graha is chosen (the best window's hora lord, else the weekday lord),
  with its BPHS ch. 3 colour and direction and its number from the app's own
  numerology table. The rule is shown on tap, and the Soolam overrides the
  direction. Existing public rasipalan values are still not a source. A
  reviewer should confirm the Venus colour: BPHS reads "variegated", while
  Tamil practice wears white.
- **Kuligai:** never encode a second prose polarity list. Use
  `app/data/kuligai_polarity.py`; `UNSPECIFIED` remains conditional.
- **Health:** general wellbeing caution only (sleep, tiredness, digestion,
  headache, stress). No diagnosis, treatment advice, certainty or medication
  language.
- **Tone:** counsel, not command; grounded and specific, not fear-based or
  deterministic. Address the person, not “people of your rasi”.

## Reviewer acceptance sample

Before completing all rows, review a 12-case pilot that covers every Moon
house once, all nine tara states at least once, both languages, Chandrashtama,
and favourable/mixed/caution verdicts. The pilot must demonstrate that the
composed output reads naturally rather than like two stitched sentences.

## Sign-off

| Review | Reviewer | Date | Result / notes |
|---|---|---|---|
| Practicing Tamil Thirukanitham astrologer: rules, precedence, source notes | — | — | **OPEN** |
| Native Tamil content reviewer: idiom, register, grammar, health/remedy tone | — | — | **OPEN** |

Only after both rows pass may engineering add the daily-guidance field, family
aggregation, UI, and release flag. Tests must then prove one verdict source,
content-key coverage, Tamil rendering, and health/remedy forbidden-language
checks.
