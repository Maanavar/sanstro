# Prose & Reasoning Presentation Audit — 2026-07-16

> **Status update (same day):** RP-01 through RP-14 are **FIXED in the working
> tree** (see "Remediation log" at the bottom). RP-15..RP-17 (depth pass)
> remain open. Every new/changed Tamil string is **PENDING NATIVE-TAMIL
> REVIEW** — flagged inline with comments in the code.

**Lens:** veteran Thirukanitham astrologer reviewing how every prediction, reasoning and
fortune sentence is *presented* to the user — is the explanation astrologically grounded,
is the Tamil this-century natural Tamil, and does it read like a human astrologer speaking
or like machine-printed output.

**Scope:** every module that composes user-facing reasoning/fortune text.
Backend: `narrative_engine.py`, `daily_briefing_synth.py`, `verdict_lexicon.py`,
`propensities.py` + `propensity_service.py` (40 cards), `life_areas_service.py`,
`chart_explanation_service.py`, `nakshatra_content.py`, `dasha_service.py`,
`whatif_service.py`, `marriage_service.py`, `compatibility_intelligence.py`,
`activity_timing_rules.py`, `age_phase_service.py`. Web: `lib/reasoning.ts`,
`lib/verdict-lexicon.ts`, `dashboard-chart-explanation-data.ts`, `dashboard-today-tab-nova.tsx`.
This is a code-level audit; a live browser pass with a native Tamil reader remains the
final gate (same rule as SHD-05).

**Overall verdict:** the *architecture* of the reasoning voice is genuinely strong — the
synth layer, the band/reading vocabulary, and the honest SILENT/BLOCKED voices are better
than most commercial astrology products. The weaknesses are concentrated in (1) raw
English enum codes leaking into Tamil sentences, (2) one whole table written in Thanglish
instead of Tamil script, and (3) a handful of surfaces that still speak in template-stamped,
chip-joined fragments instead of flowing speech.

---

## P0 — Breaks the illusion immediately (fix first)

### RP-01 · Raw English planet/period codes inside Tamil sentences

Multiple Tamil sentences interpolate the internal enum (`SUN`, `JUPITER`, `MAHADASHA`…)
directly. A Tamil reader sees **"SUN உங்கள் ஜாதகத்தில் 5ஆம் வீட்டில் நிற்கிறது"** — the
single most machine-printed thing in the app. Confirmed sites (all reach the UI):

| Site | What leaks |
|---|---|
| `app/services/chart_explanation_service.py:299` (`_planet_explanation`) | `planet.graha` raw — shown at `dashboard-chart-explanation.tsx:953` |
| `chart_explanation_service.py:392-402` (`_relationship_text`) | "SUN மற்றும் MARS இயல்பான நட்பு…" |
| `chart_explanation_service.py:432,441` (conjunction groups) | `planets_label` = "SUN, MERCURY" in the Tamil sentence |
| `chart_explanation_service.py:595-606` (`_activation_signal_text`) | "கோசார SATURN நடப்பு JUPITER தசை கிரகத்தின்…" |
| `chart_explanation_service.py:659` (`_activation_explanation`) | "**MAHADASHA** நிலையில் **SATURN** செயல்படும் கிரகம்" — note `_PERIOD_ROLE_TA` (line 137) already exists but is not used here |
| `chart_explanation_service.py:799,806` | `strongest.graha` / `weakest.graha` raw |
| `app/calculations/compatibility_intelligence.py:323,333,343` | `{seventh_lord}` raw |
| `compatibility_intelligence.py:497,508,530,541,788,791` | "தசை அதிபதிகள் JUPITER மற்றும் VENUS நண்பர்கள்" |
| `compatibility_intelligence.py:639-658` | `{moon_harmony.lower()}` → English word ("supportive"/"mixed") inside the Tamil sentence |
| `compatibility_intelligence.py:795,798` | `{sevvai_a.severity}` raw ("HIGH") |
| `app/services/whatif_service.py:523` | `sani_cycle_type.replace('_',' ')` → "ASHTAMA SANI நடப்பில் உள்ளது" |
| `app/services/marriage_service.py:343` | `f"வாழ்க்கை கட்டம்: {payload.life_stage}."` → "young_adult" |
| `marriage_service.py:462` | `', '.join(planets_in_7th)` — raw planet codes |
| `app/services/narrative_engine.py:355-361` (`panchangam_reason`) | Yoga name in Latin script inside the Tamil sentence: "யோகம்: Vishkambha" — needs a Tamil-script name table (விஷ்கம்பம், ப்ரீதி, ஆயுஷ்மான்…) |

**Fix pattern:** one shared `planet_ta()` / `period_role_ta()` helper (narrative_engine's
`PLANET_NAME` is already the canonical table) and a sweep of every f-string Tamil site.
`_lord_ta` inside `chart_explanation_service.py:331` shows the authors know the pattern —
it just wasn't applied consistently.

**Regression guard:** extend `tests/test_arch03_bilingual_audit.py` (today it only checks
non-empty ta/en) with a script-purity rule: a `ta` string may not contain `[A-Z]{3,}`
tokens (allowlist: D1/D9/D10/D24-style varga codes, "AM/PM").

### RP-02 · The 27 nakshatra "lens" lines are Thanglish, not Tamil

`app/services/nakshatra_content.py:18-151` — every `ta` value is romanized Tamil:

> `"Aswini janma nakshatra lens: vegam irundhalum mudivugalai amaidiyudan sei."`

…including the CAUTION/GOOD suffixes appended by `build_nakshatra_perspective`
(`"Inru periya mudivugalai vida siru, urudhiyaana seyalgalai munneru."`). This text goes
into **daily guidance** (`daily_guidance_service.py:525`) and **daily push notifications**
(`daily_push_cron.py:268`) — two of the highest-frequency Tamil surfaces in the product.
In Tamil mode the user gets a Latin-script sentence in the middle of Tamil-script content.
Also, "lens" as a loanword has no meaning for the target reader.

**Fix:** rewrite all 27 + DEFAULT + the two suffixes in Tamil script, contemporary
register, and drop the word "lens" (e.g. "அசுவினி நட்சத்திர பார்வை: வேகம் இருந்தாலும்
முடிவுகளை நிதானமாக எடுங்கள்."). 30 short lines — one astrologer-review batch.

---

## P1 — Tamil word-choice and register bugs (native pass needed)

These read as direct English→Tamil translation, or use a word whose modern colloquial
meaning betrays the intent. All in `app/services/narrative_engine.py` unless noted.

- **RP-03 · "வெட்டியான முடிவு"** (`_NAK_QUALITY[3]`, Karthigai): intended "decisive
  cutting-through", but **வெட்டி** in living Tamil means *useless/idle* — a Karthigai
  native reads "useless decision". Use "தீர்க்கமான முடிவு". Same entry: "தீச்சக்தி" is a
  coined compound; "நெருப்புத் தன்மை" or simply "துணிவு" is natural.
- **RP-04 · "மென்மையான விசாரணை"** (`_NAK_QUALITY[5]`): விசாரணை today means *police
  interrogation / court inquiry*. Use "மென்மையான தேடல்".
- **RP-05 · "மனதள திறப்பு"** (`_NAK_QUALITY[11]`) — not a Tamil word; "உள்ளம் திறத்தல்".
  **"நீர் தன்மை"** (`_NAK_QUALITY[20]`) — literal "water-ness" for *fluidity*; use
  "நெகிழ்வுத் தன்மை".
- **RP-06 · "…{quality} நிறத்தை சேர்க்கிறது"** (`daily_summary`, line 678): English "adds
  a tone/colour of" translated literally — "நிறம்" is paint colour. Use "…சாயலைச்
  சேர்க்கிறது" or "…தன்மையை கூட்டுகிறது".
- **RP-07 · "கரணம் விஷ்டி — தீய கரணம்"** (`panchangam_reason`, line 364): the Tamil says
  *evil karana* while the English side was deliberately softened to "traditionally
  cautious". This is the one place the Tamil violates the app's own non-fatalism doctrine
  (D6) while the English complies. Use "பாரம்பரியப்படி கவனம் தேவைப்படும் கரணம்".
- **RP-08 · Shadow-work prompts** (`_SHADOW_PROMPTS_*`, lines 985-1038): several are
  machine-translated — "நான் எங்கு ஆற்றலை மிகவும் கடுமையாக **உட்புகுத்துகிறேன்**?"
  (nonsense for "where am I pushing too hard"), "**ஒளிவிலக்கப்பட்ட** பகுதி" (coined).
  These are journal prompts — they must read like a counsellor, not a translation.
- **RP-09 · `render_causal_chain`** (line 1273): produces "காரணம்: A → B → எனவே: C" —
  arrow chains in user-facing prose are the definition of machine print. Render as a
  sentence: "A இருப்பதால், B; எனவே C." (The English side has the same issue.)

---

## P1 — Machine-print structure (reads stamped, not spoken)

- **RP-10 · Chip-joins presented as sentences.** `panchangam_reason`, `gochar_reason`,
  `personal_caution_reason` (narrative_engine 334-526) join fragments with `" · "` and end
  with a formula tail ("— பஞ்சாங்கம் ஆதரவாக உள்ளது (பஞ்சாங்க மதிப்பெண்: 72/100)"). As
  *tiles* in the "Why this prediction?" grid this is fine; but the same string is also fed
  to the briefing weaver, where `_first_sentence` slices at `" · "` and the woven clause
  inherits the telegraphic register ("திதி 4 (ரிக்த திதி) — புதிய முயற்சிகளுக்கு
  சாதகமில்லை"). Give each builder a `spoken` variant (one flowing sentence) alongside the
  chip variant, and let the synth consume the spoken one.
- **RP-11 · Life-areas verdict line is one template for all 13 areas**
  (`life_areas_service.py:494`): "{planet} ({area} காரகன்) சந்திரனிலிருந்து {n}ஆம்
  இடத்தில் சாதகமான இடத்தில் உள்ளது. {dasha}. மொத்தப் பலன்: **தொழில் வலிமையாக (72/100)**."
  Two problems: the closing clause is grammatically dangling (adverb with no verb — should
  be "தொழில் பலன் வலுவாக உள்ளது"), and every area on the page carries the identical
  skeleton, so scanning three cards feels like a mail-merge. Two or three seeded skeleton
  variants (same trick `daily_briefing_synth._pick` already uses) would break the stamp.
- **RP-12 · Dasha voice is em-dash fragments everywhere.** `_DASHA_CHARACTER` /
  `_ANTARA_NOTE` ("சனி தசை — கடமை, ஒழுக்கம், நிலைத்தன்மை. கேது புக்தி — ஆன்மீக வழிகாட்டல்
  கிடைக்கும்.") are reused verbatim on Today, dasha panel, and life areas. A real
  astrologer would inflect: "இப்போது உங்களுக்கு சனி தசை நடக்கிறது — இது கடமையும்
  ஒழுக்கமும் கேட்கும் காலம்." One sentence-form per lord (in addition to the fragment
  used in chips) removes the most-repeated mechanical cadence in the app.
- **RP-13 · "கவனம்" fatigue.** "கவனம் தேவை / கவனம் செலுத்துங்கள் / கவனமாக" appears in
  nearly every caution string across all modules; on a CAUTION day a single screen can
  show it 6-8 times. The verdict-lexicon unification is correct (keep it for the *verdict
  chip*), but body prose needs a synonym pool: நிதானம், எச்சரிக்கை, பொறுமை, மெதுவாக
  அணுகுங்கள், விழிப்புடன்.
- **RP-14 · 40 propensity cards share five summary sentences.**
  `propensity_service.py:326-347` — every CHANCE card at a given level gets the identical
  predicate ("… — உங்கள் ஜாதகம் இதற்கு வலுவாக ஆதரவளிக்கிறது."). With 40 cards on one
  screen the repetition is visible within one scroll. Seeded variants (2-3 per level) fix
  it cheaply; the evidence chips themselves are fine as chips.

---

## P2 — Depth / richness opportunities

- **RP-15 ·** Propensity evidence lines (`calculations/propensities.py:431-900`) are
  headline-style ("சுக்கிரன் வலுவாக உள்ளார் — அன்பு ஈர்ப்பு நல்லது."). Acceptable as
  evidence chips, but the *why* is one hop short of what a jyotishi would say (which house
  Venus rules for this lagna, why that matters for this topic). The data is available from
  `house_lords.py`. Adding the lordship clause to the top-1 support and top-1 caution chip
  per card would materially deepen "reasoning richness" without touching scoring.
- **RP-16 ·** `moon_transit_reason` names the house number ("ஜன்ம ராசியிலிருந்து 6ஆம்
  இடம்") but never says what a 6th-house Moon day *means* (competition/health chores day,
  good for clearing debts). A 12-entry Moon-house meaning table would make the most-read
  daily line genuinely informative.
- **RP-17 ·** English and Tamil register asymmetry: the English openers got a
  copywriter's voice ("Today reads strongly in your favour"), the Tamil equivalents are
  correct but flatter. Since Tamil is the primary audience, the next native pass should
  aim the same warmth at the Tamil side.

---

## Astrological validity spot-checks (presentation layer) — all sound

- Rikta tithis {4,9,14,19,24,29}, Vishti karana call-out, six inauspicious nityayogas
  {Vishkambha, Atiganda, Shoola, Ganda, Vyatipata, Vaidhriti} — classical. (Parigha is
  sometimes added with a first-half-only caution; optional astrologer item, not a bug.)
- Chandrashtama (8th rasi from natal Moon) vs Janma-nakshatra day are correctly
  distinguished and never conflated (`moon_transit_reason`).
- Gochar favourability (Jupiter 2/5/7/9/11; Saturn 3/6/11; Saturn cycles resolved from
  the actual house, cycle-agnostic base line) — correct, including the Ardhashtama
  mislabel fix already noted in `_TRANSIT_QUALITY`'s comment.
- Special-tithi cards (Amavasai 30, Pournami 15, Shivarathiri 29, Pradosham 13/28,
  Ekadasi 11/26) — correct tithi keys; devotional framing appropriate and health-caveated
  fasting language is a nice touch.
- Sani cycle labels (Janma/Ardhashtama/Ashtama/Kantaka/Ezharai phases) match the cycle
  types; remedies are planet-appropriate and the seva-oriented remedy prose is genuinely
  distinctive — keep as-is.

## What is already excellent (do not regress)

- **`daily_briefing_synth`** — opener pools per band, tone-aware connectors, neutral-signal
  dropping, forced-salience cautions with dedup against the component that explains them.
  This is exactly how a human briefing is structured. It is live (`daily_briefing_synth: True`).
- **Honest epistemic voices** — SILENT ("ஜாதகம் அமைதியாக உள்ளது"), BLOCKED-as-redirect,
  PROMISED_NOT_NOW with a concrete window date, ACTIVE_BUT_UNPROMISED naming where the
  chart points instead. Marriage-timing's "நேர்மையான பதில்: இப்போது உறுதியாக சொல்ல
  முடியாது" is the single most trust-building sentence in the product.
- **Verdict lexicon** (C-5) — one word-family across Today/porutham/synastry with the two
  native-approved exceptions (ஓய்வு நாள், கலப்பான) — keep the web mirror in sync.
- **Age-phase and activity-timing Tamil** — natural, already astrologer-reviewed.
- **Remedy/seva prose** — specific, compassionate, modern (blood donation, first-gen
  student mentoring) while staying classical in anchor.

## Suggested landing order

1. **RP-01 + RP-02** (enum leaks + Thanglish lens) — mechanical, high-visibility; add the
   script-purity regression test in the same change.
2. **RP-03..RP-09** — one native-Tamil review batch (≈15 strings + 27 lens rewrites from
   RP-02 can share the same session).
3. **RP-10..RP-14** — structure pass: spoken variants for the three chip-join builders,
   life-area skeleton variants, dasha sentence forms, caution synonym pool, propensity
   summary variants. All seeded via the existing `_pick` pattern so output stays
   deterministic and testable.
4. **RP-15..RP-17** — depth pass, can ride along future astrologer sessions.

*Author: code-level audit, 2026-07-16. Native-reader verification required before any
Tamil string introduced by fixes ships (per Tamil-review rule in AGENT_INSTRUCTIONS).*

---

## Remediation log — 2026-07-16 (same session)

- **RP-01 FIXED.** New canonical lookup `app/calculations/display_names.py`
  (PLANET_TA/EN, YOGA_NAME_TA/EN 1..27, SANI_CYCLE_TA/EN). All listed leak
  sites swept: chart_explanation_service (planet why-text, maitri pairs,
  conjunction groups + the `{group_tone}` leak, aspects, house-group
  synthesis, activation signals/explanation incl. `MAHADASHA` level word,
  dasha chain, strongest/weakest, `_peyarchi_text` `{stage}`/`{quality}`),
  compatibility_intelligence (7th-lord + malefics — Tamil side also gained the
  previously EN-only malefics clause — dasha-lord pairs, harmony labels,
  Sevvai severity), whatif (`sani_cycle_type`), marriage (`life_stage` label
  map, planets-in-7th), narrative_engine (Tamil-script nitya-yoga names).
- **RP-01 regression guard ADDED.** `tests/test_arch03_bilingual_audit.py`:
  `_assert_bilingual_text` now enforces Tamil-script presence + no
  `[A-Z]{3,}` enum runs in every `ta` string it touches; plus targeted tests
  for the chart-explanation composers and the yoga-name table.
- **RP-02 FIXED (wider than audited).** The guard immediately caught more
  Thanglish beyond NAKSHATRA_LENS: `emotional_weather._TONE_MAP` +
  `_DEFAULT_RESULT`, `context_service` proactive notes,
  `ambient_alerts_service` peyarchi title/message (also a raw-planet leak),
  `retrospective_service` caution. All rewritten in Tamil script,
  contemporary register, "lens"/loanword framing dropped
  ("உங்கள் ஜன்ம நட்சத்திரம் {பெயர்} — {வழிகாட்டல்}").
- **RP-03..09 FIXED.** தீர்க்கமான முடிவு (3), அறிய விரும்பும் மனது (5),
  உள்ளம் திறத்தல் (11), நெகிழ்வுத் தன்மை (20), சாயலைச் சேர்க்கிறது,
  Vishti softened to match EN + doctrine, four shadow prompts rewritten,
  `render_causal_chain` arrows → "காரணம்: …; …. எனவே: …" prose (tests
  updated to pin the *absence* of arrows).
- **RP-10 FIXED.** New `panchangam_spoken` / `gochar_spoken` in
  narrative_engine — one flowing sentence naming the most salient fact —
  wired into `BriefingInputs` in daily_guidance_service. The chip-join tile
  variants are untouched on the six-row output.
- **RP-11 FIXED.** `_build_area_reason`: 3 seeded opener skeletons per area
  + grammatical close ("மொத்தமாக, {area} பலன் வலுவாக உள்ளது (72/100)");
  also fixed the raw `{maha_lord}` enum leaks on the **English** side.
- **RP-12 FIXED.** `dasha_support_reason` now speaks in sentences
  ("இப்போது உங்களுக்கு சனி தசை நடக்கிறது — இந்தக் காலம் … முன்னிலைப்படுத்தும்.
  உள்ளே கேது புக்தி நடக்கிறது; …"); catalogue fragments kept for chips.
- **RP-13 PARTIAL (by design).** Word variety folded into the new variant
  pools (நிதானம்/விழிப்பு/எச்சரிக்கை/மௌனம்); a dedicated repo-wide "கவனம்"
  sweep was deliberately not done blind — fold into the native review.
- **RP-14 FIXED.** `_CHANCE_PHRASE`/`_CAUTION_PHRASE` now 2 variants per
  level, chosen deterministically per card key (`_pick_phrase`, sha256).
- **Open:** RP-15..RP-17 (lordship clause in evidence chips, Moon-house
  meaning table, Tamil warmth parity) + the native-Tamil review batch + live
  browser pass.
