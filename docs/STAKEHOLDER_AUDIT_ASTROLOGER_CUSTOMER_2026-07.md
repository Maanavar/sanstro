# Two-Stakeholder Audit — Practicing Jyotishi & Tamil Customer (2026-07-14)

**Method:** code-level audit, not a docs read. Files actually read end-to-end or in
depth: `app/calculations/` (ephemeris, astro, dasha, porutham, panchangam,
tamil_calendar, aspects, functional_nature, prediction_score, _yoga_dosham,
shadbala, ashtakavarga, remedies, propensities), `app/services/` (dasha_service,
daily_guidance_service, _dg_scoring, narrative_engine, daily_briefing_synth,
muhurta_service, chart_explanation_service, safety_filter, synastry_service),
`app/data/muhurtham_naals.py`, `app/core/tier_limits.py`, `web/lib/i18n.ts`,
`web/components/dashboard-today-tab-nova.tsx`,
`web/app/tools/marriage-porutham-calculator/*`, spec docs and tests where a
finding needed cross-checking.

Severity legend: 🔴 should fix before wider launch · 🟡 fix soon / needs a
decision · 🔵 disclosure or polish.

---

## Stakeholder 1 — a practicing Thirukanitham jyotishi

### Scorecard (their terms)

| Dimension | Verdict | One-line reason |
|---|---|---|
| Authenticity | **Strong** | Lahiri + Swiss Ephemeris + Whole Sign; real sunrise-anchored panchangam; correct Rahu-kalam/Yamagandam/Kuligai/soolam/hora tables; Navagraha temple remedies; curated almanac muhurtham dates |
| Accuracy (core math) | **Strong** | Tithi/nakshatra/yoga/karana computed by ephemeris bisection, not lookup shortcuts; Vimshottari opening-balance bhukti reconstruction is correct (a detail most apps get wrong) |
| Accuracy (interpretive tables) | **Good with flagged gaps** | Self-documented unverified zones: Jeevan/Nethiram formula, Amirdhadhi grid (7 of 189 cells verified), soolam parigaram DRAFT, 2 functional-nature contradictions |
| Doctrine discipline | **Excellent** | Promise-gate ("no dasha can manufacture an unpromised event"), chandrashtama caps the day label, gems refused for functional malefics — these are *doctrinally correct* positions rarely honoured by consumer apps |
| Explainability | **Excellent** | Every dosham returns what/why/how in ta+en; daily score decomposes into six named layers with reasons |
| Honesty of the codebase | **Exceptional** | Versioned correction log (panchangam v22→v30), validation oracles pinning hand tables, deliberate omission over guessing (Shadbala, Jeevan/Nethiram) |

**Overall:** a jyotishi reviewing this code would conclude the engine was built
by people who *respect the tradition* — the corrections log
([panchangam.py:301-329](app/calculations/panchangam.py#L301-L329)) reads like a
paddhati commentary. Their objections would concentrate on the interpretive
layer, not the ganitham.

### What earns their trust (verified in code)

1. **Panchangam ganitham is real.** Tithi/nakshatra/yoga boundaries found by
   64-step bisection on ephemeris angles ([panchangam.py:505-529](app/calculations/panchangam.py#L505-L529));
   sunrise/sunset via `swe_rise_trans`; Tamil solar month uses the classical
   sankranti-before-sunset rule ([tamil_calendar.py:106-135](app/calculations/tamil_calendar.py#L106-L135)).
   Rahu/Yama/Kuligai weekday slot tables verified against the classical 8-slot
   grid — all correct. Hora order (Sun→Venus→Mercury→Moon→Saturn→Jupiter→Mars)
   correct. Disha soolam by weekday correct.
2. **Vimshottari is correct at depth.** 5 levels; the opening mahadasha's
   antardashas are rebuilt over the *true* (pre-birth) span, not the clipped
   balance ([dasha.py:99-135](app/calculations/dasha.py#L99-L135)) — gets the
   running bhukti right for natives still in their first dasha.
3. **Porutham engine matches the frozen spec** for Dinam good-counts, gana,
   yoni pairs, nadi zigzag cycle, rajju tent-cycle, vedha pairs, vasya table;
   Rajju/Vedha treated as vetoes; eka-nakshatra rajju exception honoured.
   The public web tool calls this same backend (no duplicate calc drift).
4. **Sevvai dosham is checked from Lagna, Moon AND Venus** with the classical
   nivarthi ladder (own-sign/exaltation, Kadaga-Simha lagna exception, Guru
   aspect/conjunction, benefic association, dispositor strength, strong 7th
   lord incl. D9 corroboration, both-partners cancellation) and gendered
   high-attention houses ([_yoga_dosham.py:58-262](app/calculations/_yoga_dosham.py#L58-L262)).
5. **Muhurtham dates come from a published almanac**, not the engine — the code
   itself admits the engine's broad flag over-marks ~3× and defers to the
   curated sheet ([muhurtham_naals.py:1-24](app/data/muhurtham_naals.py#L1-L24)).
   That is exactly the humility a jyotishi wants.
6. **Remedies are doctrinally gated:** gemstones refused for functional
   malefics ([remedies.py:93-98](app/calculations/remedies.py#L93-L98)), correct
   Navagraha sthalam circuit, mantra + japa counts, fasting health caveats,
   explicit no-guarantee text in both languages.
7. **The reasoning layer enforces classical priority:** L1 birth-promise is a
   hard gate; timing layers can never manufacture an unpromised event
   ([prediction_score.py:77-129](app/calculations/prediction_score.py#L77-L129)).
8. **Sade Sati is graded by Murthi (pada), not a flat penalty**
   ([daily_guidance_service.py:446-461](app/services/daily_guidance_service.py#L446-L461));
   Kantaka Sani independent from Lagna without double-counting.

### What they would object to

| # | Sev | Finding | Where |
|---|---|---|---|
| A-1 | 🟡 | **Stree Dirgham threshold contradicts the project's own spec.** Code passes at count ≥ 8; spec §11.6 says ≥ 14 (strict half-circle). The code documents the choice but the spec was never amended — one of them is wrong for a Tamil almanac audience, and matches will disagree with printed almanacs on this kuta. Needs a jyotishi ruling, then align spec + code + test. | [porutham.py:195-203](app/calculations/porutham.py#L195-L203) vs spec §11.6 |
| A-2 | 🟡 | **Two functional-nature cells are internally inconsistent** (same house-set, different verdict at another lagna): Kanni Jupiter {4,7}=KENDRA vs Meenam Mercury {4,7}=MARAKA; Dhanusu Mercury {7,10}=NEUTRAL vs Mithunam Jupiter {7,10}=KENDRA. Already flagged in code; affects dasha/transit modifiers for 4 lagnas until resolved. | [functional_nature.py:252-268](app/calculations/functional_nature.py#L252-L268) |
| A-3 | 🟡 | **Jeevan/Nethiram ships an unverified formula** (symmetric ring distance where every other tara count in the codebase is directional). Self-flagged UNVERIFIED, but the values render on the panchangam card today. Either verify with worked almanac dates or hide the fields. | [panchangam.py:236-276](app/calculations/panchangam.py#L236-L276) |
| A-4 | 🟡 | **Porutham `label` is not downgraded on a Rajju/Vedha veto.** An 8/10 vetoed match still carries `label="GOOD"` (+ warning suffix). The web tool compensates (buckets vetoed matches under "⚠ தோஷம் — தவிர்க்கவும்" regardless of score), but any API consumer reading `label` alone — mobile, share cards, future surfaces — can show "GOOD" on a match the docstring itself calls "inauspicious regardless of score". Downgrade the label at the source. | [porutham.py:391-441](app/calculations/porutham.py#L391-L441) |
| A-5 | 🔵 | **`sevvai_mode` is a dead switch** — `TAMIL_SEVVAI_HOUSES` and `EXTENDED_SEVVAI_HOUSES` are the identical set {1,2,4,7,8,12}. Either differentiate (many Tamil practitioners use {2,4,7,8,12} without the 1st) or delete the mode so the API doesn't imply a choice it doesn't make. | [_yoga_helpers.py:21-22](app/calculations/_yoga_helpers.py#L21-L22) |
| A-6 | 🔵 | **Mahendra count direction is documented opposite to the spec** (code counts girl-from-boy; spec §11.5 + reference impl count boy-from-girl). Outcomes are *identical* because {4,7,…,25} is closed under c→29−c reversal — verified — but the symmetry is an accident of this particular set; anyone editing the set breaks it silently. Fix the docstring or the direction; add a test asserting the symmetry assumption. | [porutham.py:189-192](app/calculations/porutham.py#L189-L192) |
| A-7 | 🔵 | **Amirdhadhi Yogam grid: 182 of 189 cells unverified** (only the 7 Amrita Siddhi anchors checked). A daily-visible field with this verification ratio deserves a full-row cross-check against one printed panchangam year. | [panchangam.py:278-299](app/calculations/panchangam.py#L278-L299) |
| A-8 | 🔵 | **Soolam parigaram table still DRAFT** (direction table verified correct; the remedy-food mapping is not). | [panchangam.py:216-234](app/calculations/panchangam.py#L216-L234) |
| A-9 | 🔵 | **Nadi cancellation is lenient:** different-rasi alone cancels the dosha. Many practitioners require stronger conditions (same pada exceptions, lord friendship). Fine as a product stance if disclosed on the tool. | [porutham.py:288-327](app/calculations/porutham.py#L288-L327) |
| A-10 | 🔵 | **Methodology disclosures to publish:** mean node (not true node) for Rahu/Ketu; 365.25-day dasha year; Rahu/Ketu 5/7/9 aspect convention; daily-score component weights (0.28/0.24/0.19/0.14/0.09) are a product calibration, not sastra. All defensible — say so on the /trust/methodology page. | [ephemeris.py](app/calculations/ephemeris.py), [aspects.py](app/calculations/aspects.py), [daily_guidance_service.py:482-489](app/services/daily_guidance_service.py#L482-L489) |
| A-11 | 🟡 | **The astrologer-review queue is the real bottleneck.** `docs/ASTROLOGER_REVIEW_QUEUE.md` has zero resolved items while the open list grows (Abhijit demotion, UPACHAYA copy, 40 propensity signatures, Kalachakra, A-2 above…). The engineering discipline is ahead of the domain sign-off process. | [docs/ASTROLOGER_REVIEW_QUEUE.md](docs/ASTROLOGER_REVIEW_QUEUE.md) |

---

## Stakeholder 2 — a Tamil customer (TN + diaspora)

### Scorecard (their terms)

| Dimension | Verdict | One-line reason |
|---|---|---|
| "Does it feel like *our* jothidam?" | **Yes, mostly** | Gowri panchangam, rahu kalam, chandrashtamam, porutham, Navagraha parikaram, Tamil solar calendar — the vocabulary and furniture are genuinely Tamil, not translated Vedic-generic |
| Tamil language quality | **Good, with one glaring flaw** | UI strings and template narratives read native; but English planet names leak inside Tamil sentences on several surfaces (see C-1) |
| Ease | **Good** | Approximate birth time accepted, city auto-fills coordinates with a confirm step, cold-start empathy copy, retry chips, one bundle call for the dashboard |
| Understandable | **Very good** | Band words carry the judgement with the number alongside; six-signal "why" rows; what/why/how on every dosham; glossary-level Tamil terms kept |
| Trust / honesty | **Very good** | No fatalistic phrasing (enforced at serve time), no guarantees, health caveats on fasting, confidence stated ("இரண்டு சமிக்ஞைகள் சீரமைக்கப்பட்டுள்ளன"), methodology page |
| Feel-good factor | **Good → improving** | Briefing synthesizer exists precisely because six equal blocks felt mechanical; celestial Nova visual language; but synth flag is OFF and its Tamil glue awaits native review |

### What delights them (verified in code)

1. **The safety net is real, not marketing.** `safety_filter.run_safety_pass`
   is called at serve time on every surface; `tone_validator` bans fatalistic
   phrasing; propensities module refuses death/catastrophe/diagnosis framing
   by charter ([propensities.py:11-13](app/calculations/propensities.py#L11-L13));
   chandrashtama days can never be labelled GOOD
   ([daily_guidance_service.py:491-494](app/services/daily_guidance_service.py#L491-L494)).
2. **Remedy copy is culturally serious and modern at once** — the correct
   temple for each graha, plus seva suggestions like blood donation, girl-child
   education, feeding daily-wage workers ([remedies.py:80-90](app/calculations/remedies.py#L80-L90)).
   The fasting caution names diabetes, pregnancy, medication. This is what
   "responsible jothidam" looks like.
3. **Explainability is a first-class feature:** "Why this prediction?" rows,
   per-porutham pass/fail with Tamil names, dosham what/why/how, confidence
   reasons — rendered across 7 dashboard components.
4. **The forms speak to real Tamil lives:** occupation options
   "டிரைவர், விவசாயி, மீனவர், நெசவாளர்" ([i18n.ts:118-120](web/lib/i18n.ts#L118-L120)),
   relationship-first family vault, approximate-birth-time reassurance.
5. **Time is honest:** every "now" comparison on Today runs in the panchangam's
   timezone, not the browser's (diaspora-correct).

### What breaks the spell

| # | Sev | Finding | Where |
|---|---|---|---|
| C-1 | 🔴 | **English planet/label tokens inside Tamil sentences.** A Tamil reader gets "SATURN தசையிலிருந்து RAHU தசைக்கு மாற்றம்…", "JUPITER மகாதசை / SATURN புக்தி", "Jupiter மற்றும் Venus தசை இந்த செயலை ஆதரிக்கிறது", "supportive இணக்கம்", "{pratyantar_lord} பிரத்யந்தர தசை". This is the single most trust-eroding polish gap for the target audience — it reads machine-made, and the fix is trivial because `narrative_engine.PLANET_NAME` already has the Tamil names. Sweep every f-string that interpolates a lord/label into `ta` text. | [dasha_service.py:88-96](app/services/dasha_service.py#L88-L96), [chart_explanation_service.py:317-319](app/services/chart_explanation_service.py#L317-L319), [muhurta_service.py:257-260](app/services/muhurta_service.py#L257-L260), [_dg_scoring.py:269-277](app/services/_dg_scoring.py#L269-L277), [synastry_service.py:545-550](app/services/synastry_service.py#L545-L550), [career_service.py:192](app/services/career_service.py#L192), [decisions_service.py:232](app/services/decisions_service.py#L232) |
| C-2 | ✅ | **RESOLVED 2026-07-16.** Blunt/archaic Tamil on the panchangam card was flagged: Nethiram "குருடு" (blind), Jeevan "இல்லை". Ruling: keep the classical terms verbatim (matches real printed panchangams; softening would be a fidelity break independent of A-3), and instead fill the previously-inert "Throughout today" hint with a one-line gloss clarifying it's a muhurtham-suitability marker, not a personal reading. See ASTROLOGER_REVIEW_QUEUE.md Resolved. | [panchangam.py:250-251](app/calculations/panchangam.py#L250-L251), [i18n.ts `nethiram_jeevan_hint`](web/lib/i18n.ts) |
| C-3 | 🟡 | **The "feels human" fix is built but OFF.** `daily_briefing_synth` (salience-ranked single briefing instead of six blocks) is flag-gated OFF and its Tamil connectives are self-declared first-draft. The mechanical feel it was built to cure is what customers experience today. Schedule the native-Tamil pass (Track B) and flip it. | [daily_briefing_synth.py:23-28](app/services/daily_briefing_synth.py#L23-L28) |
| C-4 | 🟡 | **40 propensity cards + older narrative strings have never had a native-Tamil/jyotishi read.** The newer copy (briefing synth, i18n UI) is noticeably better Tamil than some older service strings (e.g. age_phase phrasing like "தொழிலாளர்" for service-significations reads odd). One consolidated native review pass over `ta` strings would lift the whole product a grade. | services layer, tracked in ASTROLOGER_REVIEW_QUEUE |
| C-5 | 🔵 | **Vocabulary drift across surfaces:** daily bands (STRONG_SUPPORT/…/RESTORATIVE), prediction interpretation (EXCEPTIONAL/…/VERY_WEAK), synastry (SUPPORTIVE/MIXED/CAREFUL), porutham (EXCELLENT/…/CAUTION). Each is coherent alone; a customer moving between Today, Porutham and Life-Areas meets four grading dialects. A shared Tamil verdict lexicon (even if internal enums stay) would read calmer. | cross-surface |
| C-6 | 🔵 | **Guest tier gives no chart at all** (`birth_profiles_max=0`) — a guest can only use public tools and 2 Ask-Vinaadi questions. Deliberate per the tier plan, but it means the product's best trust-builders (explainable daily guidance) are invisible pre-signup; the porutham tool carries the whole first impression. Consider a one-shot ephemeral chart preview. | [tier_limits.py:46-72](app/core/tier_limits.py#L46-L72) |

---

## Combined priority list

1. **C-1** — Tamil-name sweep on serve paths (small, high trust impact).
2. **A-4** — downgrade porutham `label` on Rajju/Vedha veto at the source.
3. **A-1** — Stree Dirgham ruling (spec vs code), then align.
4. ~~**A-3 / C-2** — hide or verify Jeevan/Nethiram; soften labels either way.~~ **DONE 2026-07-16** (both resolved; see ASTROLOGER_REVIEW_QUEUE.md).
5. **A-2 / A-11** — actually run the astrologer review session; the queue has
   no resolved items and now gates ≥6 findings.
6. **C-3 / C-4** — native-Tamil review pass, then enable `daily_briefing_synth`.
7. **A-5, A-6, A-7, A-8** — table hygiene (dead switch, docstring direction,
   grid verification, parigaram).
8. **A-10 / A-9** — methodology-page disclosures.

## What this audit did *not* cover

Live rendering (browser pass still pending per DASHBOARD_AUDIT_FIXES), mobile
surfaces, Ask Vinaadi LLM output quality (template-free path — only its tone
filter was reviewed), festival/calendar datasets, and Kalachakra/Ashtottari/
Yogini internals (already tracked as experimental in memory/queue).
