# Full System Audit — 2026-10-21

Three lenses: **Tamil astrologer** (does it follow Tamil practice?), **software
architect** (does the same question get one answer everywhere?), **test
engineer** (would anything catch it if it broke?).

Builds on, and does not repeat:
[`TAMIL_ASTROLOGY_GROUND_TRUTH_AUDIT_2026-10-13.md`](TAMIL_ASTROLOGY_GROUND_TRUTH_AUDIT_2026-10-13.md),
[`GROUND_TRUTH_AUDIT_IMPLEMENTATION_2026-10-13.md`](GROUND_TRUTH_AUDIT_IMPLEMENTATION_2026-10-13.md),
[`ASTROLOGER_RULINGS_2026-10-13.md`](ASTROLOGER_RULINGS_2026-10-13.md).
Every finding below is **new since those**, and every one was checked against
the code at `785287b3` (branch `harden/production-readiness`). §6 carries
forward the 10-13 items that are still open.

Format follows `DASHBOARD_AUDIT_FIXES.md`: `FSA-##`, status box, problem → why →
fix → acceptance. Each item also says **what was measured** and **what the
measurement cannot see**, per CLAUDE.md *a gate proves its own check*.

---

## 0. Summary

| ID | Sev | Lens | One line |
|---|---|---|---|
| FSA-01 | **P1** | Tamil / arch | Muhurta "lagna at sunrise" is a disguised **solar-month** score: public tool docks every Thai and Chithirai wedding date −10 and calls Purattasi "among the best marriage lagnas" |
| FSA-02 | **P1** | arch | Two "auspicious star" lists disagree; **Magam and Moolam** are a good day on the calendar and in muhurta, a caution day in PDF export and push |
| FSA-03 | **P1** | Tamil | Public nakshatra pages: **87 of 146** bhukti timings and **7 of 8** bhukti lengths are arithmetically wrong (21 sitemap-indexed pages) |
| FSA-04 | **P1** | Tamil / arch | Public Chandrashtama tool's 12-house Moon table contradicts the backend's classical gochara set (5th and 9th called good) |
| FSA-05 | **P1** ⏰ | arch | Public Tamil-calendar pages and 9 major Tamil festivals are **2026-only** — go dark on **2027-01-01** (10 weeks) |
| FSA-06 | **P1** | process | PR #5 is red since 10-14 on a ratchet false positive; 245 commits incl. both 10-13 **P0** fixes are not on `main` |
| FSA-07 | P2 | arch | Mobile parity: Varshaphala has no "Simplified" badge (Doctrine §9); porutham never shows the 6/8 note |
| FSA-08 | P2 | Tamil | Tajaka annual chart is sold as "வருஷபலன்" — a Tamil reader means something else by that word |
| FSA-09 | P2 | Tamil | Almanac header incomplete: no Tamil 60-year name, no ayanam, no ruthu — ayanam also blocks recorded muhurta rules |
| FSA-10 | P2 | arch | Public muhurta returns a slot never checked for lagna / tithi / karana *at the slot*; the signed-in picker would veto some of them |
| FSA-11 | P2 | test | No CI guard that web's direct `apiFetchJson` routes exist (manual check today: clean) |
| FSA-12 | P2 | test | `packages/shared` — localisers + every typed API wrapper — has **zero tests** and no test script |
| FSA-13 | P2 | test | Playwright e2e has **never run in CI**; an unreachable test DB skips the whole suite as "pass" |
| FSA-14 | P3 | Tamil | North-Indian / Sanskrit forms on public pages (Shani, Makar Sankranti, Shani Jayanti, Tula/Vrischika/Kanya…) |
| FSA-15 | P3 | arch | Three hand-copied `SIGN_LORD` tables (agree today) |
| FSA-16 | P3 | process | Launch runbook contradicts shipped code (quota copy; mobile API host on `vinaadi.app`) |
| FSA-17 | **P0** ✅ | Tamil / arch | Varshaphala "favourable months" are a constant per score band, not computed — **hidden 2026-10-21** — found in the §8.3 code review, see [`OWNER_RULINGS_FSA_2026-10-21.md`](OWNER_RULINGS_FSA_2026-10-21.md) §4 |

**Answers to the four questions asked**

1. *Missing tasks / functionality* — FSA-05, FSA-07, FSA-09, FSA-12, FSA-13, plus
   §6 (held astrologer tables, lunar-month festivals, 462 unreviewed Tamil strings).
2. *Incomplete tasks* — FSA-06 (nothing since 09-12 is on `main`), §6, §7 backlog counts.
3. *Contradicting results for the same thing* — FSA-01, FSA-02, FSA-03, FSA-04, FSA-07, FSA-10.
4. *Not following Tamil practice / following other systems* — FSA-01, FSA-03,
   FSA-04, FSA-08, FSA-09, FSA-14. No KP, Lal Kitab, tropical, Placidus, or
   North-Indian chart found anywhere. Tajaka is the one imported system shipped
   as a feature.

**Verified clean in this pass** (so the next reader need not redo them): dasha
year length is 365.25 days in all six dasha engines; the grep probes for
good-star lists, Rahu-kalam slot tables, dasha-year tables and rasi/star
arithmetic found no copies in web, mobile or shared apart from FSA-04; all 117
web `apiFetchJson` calls resolve to a backend route; every chart surface (web
dashboard, inline generator, share card, mobile) uses the same fixed South
Indian rasi grid; the Gowri good kalas (Amirtham, Uthi, Labham, Dhanam, Sugam)
match Tamil almanac practice.

---

## 1. P1

### FSA-01 [x] Muhurta "lagna at sunrise" is a solar-month score

> **Done 2026-10-21** per owner ruling: removed from both paths, conditional-sign
> case moved to the window factor. See [`OWNER_RULINGS_FSA_2026-10-21.md`](OWNER_RULINGS_FSA_2026-10-21.md) §3.

**Problem.** `muhurta_engine._lagna_sign_factor` (`app/calculations/muhurta_engine.py:1507`)
scores the day on the rasi rising **at sunrise** (`panchangam.py:2436`). At
sunrise the Sun is on the eastern horizon, so the rising point is the Sun's own
longitude. The sunrise lagna is therefore the Sun's rasi, which is the Tamil
solar month. Applied to `MARRIAGE_LAGNA_BEST {3,6,7}` / `AVOID {1,8,10,12}`, it
becomes a month table no Tamil text contains.

**Measured** (Chennai, every day of 2026, `compute_daily_panchangam` vs `tamil_solar_date`):

```
sunrise lagna == Tamil solar month on 350/365 days
Chithirai  AVOID −10 on 31/31      Aavani     mid 0
Vaikasi    mid 0 (29)              Purattasi  BEST +8 on 30/30
Aani       BEST +8 on 30           Aippasi    BEST +8 on 30
Aadi       mid 0                   Karthigai  AVOID −10 on 28
Margazhi   mid 0 (27)              Thai       AVOID −10 on 28
Maasi      mid 0 (29)              Panguni    AVOID −10 on 29
```

**Why it matters.** Thai is the pre-eminent Tamil wedding month and Chithirai is
a major one; both are docked 10 points on every day. Purattasi, a month in which
no Tamil wedding is held, is credited +8, with the reason text "Kanni rises at
sunrise — among the best marriage lagnas." (The −600 F-MUH-01 demotion still
sinks Purattasi overall, so the user sees a "best lagna" bonus beside a "no
weddings this month" caution.) No Tamil astrologer judges a wedding *day* by its
sunrise lagna; the muhurta lagna is the sign rising at the *chosen minute*.

**Where it reaches users.** The signed-in picker passes `include_lagna_sign=False`
(`muhurta_service.py:1472`) and judges the real window lagna instead. The
**public** tool calls `score_day(snap, event_type, subject=None)`
(`app/api/public_tools.py:1039`) and gets the default `True`. So the two muhurta
surfaces rank the same date differently, while the public route's docstring says
it is "the same engine".

**Fix.** Remove `_lagna_sign_factor` / `_registry_lagna_sign_factor` from the day
score (or flip the default to `False` and delete the `True` path). The sourced
rule belongs only in `lagna_sign_factor_at_window`, which already exists.

**Acceptance.**
- No response from any route contains factor `LAGNA_SIGN_AT_SUNRISE`.
- Test: two snapshots identical except `lagna_rasi_number` produce the same `score_day` score.
- Public `/muhurta` for MARRIAGE over a Thai range and an otherwise-equal Vaikasi range: no −10 difference.

**Blind spot.** Measured for Chennai, 2026 only. The 15 non-matching days are the
sankranti edges and do not change the conclusion.

---

### FSA-02 [ ] Two "auspicious star" lists; Magam and Moolam are good and bad at once

**Problem.** There are two general-purpose star lists:

| List | Where | Stars |
|---|---|---|
| `SUBHA_NAKSHATRAS` / `_NUMBERS` | `panchangam.py:292` | 17: 1,4,5,7,8,**10**,12,13,14,15,17,**19**,21,22,23,26,27 |
| `AUSPICIOUS_DAILY_NAKSHATRAS` | `_dg_scoring.py:55` | 11: 1,4,5,7,8,13,14,15,17,22,27 |
| `CAUTION_DAILY_NAKSHATRAS` | `_dg_scoring.py:65` | **2, 9, 10, 19** |

Magam (10) and Moolam (19) are in the first list *and* in the caution list. On a
Magam or Moolam day:

- calendar day-quality badge (`panchangam.py:1585/1621`) → நல்ல நாள் / Good day;
- muhurta engine `ALMANAC_NAKSHATRA` (`muhurta_engine.py:613`) → "சுப நட்சத்திரம்" +10;
- PDF export (`pdf_export_service.py:704`) → score 32, "caution";
- daily push (`daily_push_cron.py:293`) → caution.

`_dg_scoring.py:57-64` records that this exact class of drift was fixed once
already, between two copies of the *caution* list. The *good* lists were never
reconciled.

**Why it matters.** Same day, same user, opposite verdicts across four surfaces.
Tamil practice does treat Magam and Moolam as ugra/teekshna stars for general
beginnings while admitting them for marriage. That is an activity-specific
distinction, and `MARRIAGE_NAKSHATRA_ALLOWED` already encodes it correctly.

**Fix (needs a ruling — §8 Q2).** One general day-quality table, from which the
good and caution sets are both derived and enforced to be disjoint.
Activity-specific tables stay separate.

**Acceptance.** Test asserts `good ∩ caution = ∅` across every general list, and
that the calendar, muhurta almanac factor, PDF and push read the same table object.

---

### FSA-03 [~] Public nakshatra pages print wrong dasha-bhukti timings

> **Partly done 2026-10-21.** All 27 visual pages are noindex and out of the
> sitemap; the 87 are classified (20 datum-mislabel, 7 row-shift, 60 wrong; and
> 65 of 146 stated ages are impossible). Regeneration is open. See
> [`OWNER_RULINGS_FSA_2026-10-21.md`](OWNER_RULINGS_FSA_2026-10-21.md) §1.

**Problem.** `web/app/(marketing)/natchathiram/*/visual/page.tsx` (27 pages, all
in `sitemap.ts:304`) hand-type claims such as "Saturn–Mars antardasa (~yr 5 of
Saturn)" and "Saturn–Venus … a 20-month window". Vimshottari fixes these
exactly: a bhukti sequence starts with the dasa lord itself, and each bhukti
lasts `MD years × AD years / 120`.

**Measured** (every claim matching `X–Y antardasa (~yr N of X` and
`X–Y … N-month window`, checked against that arithmetic):

```
bhukti-start claims: 146; wrong: 87; pages with an error: 21
window-length claims:   8; wrong:  7
```

Examples:

| Page | Page says | Vimshottari |
|---|---|---|
| anuradha | Saturn–Mars ~yr 5 | yrs 12.5–13.6 |
| anuradha | Mercury–Jupiter ~yr 3 | yrs 12.0–14.3 |
| chitra | Rahu–Mercury ~yr 15 | yrs 7.9–10.5 |
| vishakha, swati | Saturn–Venus "20-month window" | 38 months |
| revati | Rahu–Jupiter "11-month window" | 29 months |

Several pages also pin bhuktis to fixed ages ("~ages 26–28"). That cannot be
right for a star, because the opening dasa balance varies from 0 to the full
period with the Moon's degree inside the star.

**Why it matters.** These are the pages Google sends Tamil readers to. A reader
who signs up sees the app's own (correct) dasa table contradict the page that
brought them in.

**Fix.** Generate timing text from `app/calculations/dasha.py` arithmetic, or
remove the numbers and keep the qualitative text. No hand-typed year or month
counts.

**Acceptance.** A test that runs the checker described above over every
`natchathiram/**` page and fails on any mismatch. Run it once against the
current pages and confirm it fails (it will: 87 + 7).

**Blind spot.** The checker reads one phrasing. Claims phrased differently
("~yr 14 of Mercury" without a pair, ages) are not counted, so 87 is a floor.
About two of the 87 sit exactly on a year boundary (e.g. Ashlesha Ketu–Mercury
at 6.0).

---

### FSA-04 [x] Public Chandrashtama tool contradicts the backend's transit table

> **Done 2026-10-21.** The 12-sign table is corrected, sourced and gated; the
> 8th row is labelled the Chandrashtama position. The split was withdrawn by the
> owner (one table serves both), and D11 is recorded as a reasoned choice. See
> [`OWNER_RULINGS_FSA_2026-10-21.md`](OWNER_RULINGS_FSA_2026-10-21.md) §2.1.

**Problem.** `web/app/(marketing)/tools/chandrashtama/page.tsx:14-27` carries its
own 12-house Moon-transit table, computed in the browser. The backend's single
table (`gochara_scores.GOCHARA_FAVOURABLE_FROM_MOON["MOON"] = {1,3,6,7,10,11}`)
is the classical one.

| House | Public page | Backend / classical |
|---|---|---|
| 5 | "creative energy, positive outlook" | adverse |
| 9 | "fortune, blessings, spiritual activity" | adverse |
| 4 | "home and emotional well-being days" | adverse |
| 7 | neutral ("partnership matters") | favourable |

Also on this page:
- line 133 prints the other language's rasi name under the active one (the rejected bilingual echo);
- Tamil copy mixes English: "Vinaadi உங்கள் Dashboard-ல்", "Chandrashtama நாட்களை", "Janma Rasi";
- `⚠` emoji used as an icon;
- the tool is rasi-keyed ("2.5 days") while the dashboard's personal flag is star-keyed per the 09-10 day-ownership ruling, so the two can name different days.

**Fix.** Serve the table from the backend (or import a shared constant generated
from `gochara_scores`). Localise the copy fully in the active language. State in
the tool which convention it uses.

**Acceptance.** No house text on this page contradicts `gochara_grade` for the
Moon. The `ta` harness phase shows no Latin-script words in the result block.

---

### FSA-05 [ ] ⏰ 2026-only calendars go dark on 2027-01-01

**Problem.**
- `panchangam_events_service.EVENTS_BY_YEAR = {2026: …}`. `list_events` / `get_event` **404** for any other year, and `/tamil-calendar/*` pages hard-code 2026 (`calendar-category-api.ts:6`, `calendar-jsonld.ts`). From January the FAQ answers "All Pournami dates for 2026 have passed".
- Pournami, Amavasai, Pradosham, Ekadasi, Sashti, Chathurthi and Kiruthigai are pure tithi/star rules the panchangam engine already computes. They are curated rows only because they were typed in.
- `festivals.py` derives about fifteen festivals algorithmically, but these exist **only** in the 2026 gazetted list or nowhere: **Bhogi, Mattu Pongal, Kaanum Pongal, Ayudha Pooja, Saraswathi Pooja, Vijayadasami, Navarathri, Arudra Darisanam, Vaikasi Visakam, Aadi Amavasai, Thai Amavasai**. They will be missing from the in-app calendar in 2027.

The gazetted-row cliff is disclosed (`PAN-17`); the curated tithi events and these
festivals are not.

**Why it matters.** This is the Karinaal failure again — the 10-13 audit found a
hand-typed 2026 list that would have returned `False` from 2027-01-01, and the
fix was to derive it. The same reasoning applies here.

**Fix.** Derive tithi events per year from `compute_daily_panchangam_range`.
Add rules for the eleven festivals (Bhogi / Mattu / Kaanum Pongal are day −1 / +1 /
+2 from the computed Thai Pongal; Navarathri–Vijayadasami from Purattasi/Aippasi Shukla
Prathamai–Dasami; Arudra Darisanam = Margazhi + Thiruvathirai; Vaikasi Visakam =
Vaikasi + Visakam). Make the web pages year-parameterised.

**Acceptance.** Every event endpoint answers for 2027 and 2028. A test asserts
each of the eleven festivals occurs exactly once in each of 2027–2030. Spot-check
2027 against a printed almanac before the pages go live.

**Blind spot.** F-FES-02's lunar-month gap (two-in-21-years double dates)
applies to any new month-keyed rule. Do not claim "exactly once" for a rule
keyed to a solar month until that is fixed.

---

### FSA-06 [ ] Nothing since 2026-09-12 is on `main`; PR #5 is red

**Problem.** `origin/main` has 0 commits the branch lacks (4 merge commits only);
the branch has **245** commits not on `main`. PR #5 has been open since
2026-10-14 with status UNSTABLE. Its only failing check is the design-token
ratchet:

```
web/lib/beta-system-contrast.test.ts:44  function rgb(value: string) {
web/lib/beta-system-contrast.test.ts:51  return rgb(token(globalsCss, name));
```

That is a false positive: the regex treats a helper *named* `rgb(` as a colour literal.

**Why it matters.** `main` still has F-MAR-01 (every dosham-free chart told
"செவ்வாய் தோஷம் உள்ளது" and docked 3–6) and F-CI-01 (one-sided active Sevvai
can read EXCELLENT). Both were P0 on 10-13 and both are fixed only on this branch.

**Fix.** Rename the test helper (e.g. `parseRgb`) or exclude `*.test.ts` from
`audit-color-literals.mjs`. Then merge.

**Acceptance.** PR #5 all green; `git rev-list --count HEAD..origin/main` and the reverse both 0 after merge.

---

## 2. P2

### FSA-07 [~] Mobile shows less than web for the same result

> **Varshaphala half resolved 2026-10-21.** Both surfaces now render the same
> shared disclosure table under the "simplified" name; mobile does not render
> the Tajaka aspects at all. The porutham 6/8 note is still open.

- `mobile/app/varshaphala/index.tsx` has no "Simplified" disclosure. Doctrine §9
  (`tajaka.py:77-81`) requires the Tajaka output to be "prominently labeled
  Simplified"; web does this (`dashboard-varshaphala-panel.tsx:220`).
- `mobile/app/(tabs)/tools/porutham.tsx` never renders `shashtashtaka`. Web shows
  the approved 6/8 note on five surfaces (`shashtashtaka-note.tsx`), so the same
  pair gets the note on web and silence on mobile.

**Acceptance.** Both present on mobile; a mobile test asserts each renders.

### FSA-08 [x] Tajaka sold as "வருஷபலன்"

> **Done 2026-10-21.** Renamed to Simplified Annual Chart (Varuda Palan) /
> வருடப்பலன், with a per-component disclosure on the paid feature. FSA-17's
> months are hidden. See [`OWNER_RULINGS_FSA_2026-10-21.md`](OWNER_RULINGS_FSA_2026-10-21.md) §4.

`pricing/page.tsx:97` sells "Varshaphala + Vargas / வருஷபலன் + வர்கங்கள்". To a
Tamil reader வருஷ பலன் means the year's rasi predictions from Guru/Sani
peyarchi, not a Tajika solar-return chart. The module itself says Varshaphala
is "a North Indian specialty … legitimate to keep this module below the fold
indefinitely" (`tajaka.py:90-92`). **Owner decision** (§8 Q3): relabel it as what
it is (e.g. "தாஜக வருஷ ஜாதகம் — வட இந்திய முறை") or take it off the pricing line.

### FSA-09 [ ] Almanac header fields missing

No Tamil 60-year cycle name (the 2026-27 year is பராபவ), no ayanam
(உத்தராயணம் / தட்சிணாயனம்), no ruthu, anywhere in the panchangam schema. Every
printed Tamil panchangam heads the page with these. The ayanam gap is also a
recorded blocker: `kalaprakasika_lifecycle_rules.py:511` and
`kalaprakasika_learning_rules.py:573` mark rules **NOT IMPLEMENTED** because "the
day snapshot carries no ayana or solar-month field".

**Acceptance.** `PanchangamResponse` carries all three; values checked against a
printed almanac for Puthandu 2026 and 2027.

### FSA-10 [ ] Public muhurta slot is never judged at the slot

`public_tools.py:1053-1057` returns the best nalla-neram slot (or Abhijit) with
Rahu/Yama/Kuligai overlap cautions only. It does not run `limb_factors_at_window`
or `lagna_sign_factor_at_window`. So it can hand back a wedding slot in an
avoid-lagna (Mesham, Viruchigam, Makaram, Meenam), or after the day's star has
ended, which the signed-in picker would penalise or veto. Either run the same
window checks, or label the public slot "general good time, not a muhurtham".

### FSA-11 [ ] Web route existence is unguarded

`tests/test_api_wrapper_route_contract.py` checks route existence for shared and
mobile wrappers, but scans web only for `.data` unwrapping (its own comment at
line 191 says so). A manual static check today matched all 117 web
`apiFetchJson` calls to backend routes (six parser misses, all verified real).
Extend the existence check to `web/{components,app,lib,hooks}` so it stays that way.

### FSA-12 [ ] `packages/shared` has no tests

0 test files and no `test` script, yet it owns `i18n/astro-names.ts`,
`i18n/panchangam-names.ts` (the display-boundary localisers) and every typed API
wrapper. It is covered only to the extent web tests happen to import it; mobile
imports the localisers too. Add a vitest target with a parity test (every rasi /
graha / nakshatra / karanam key has `ta` and `en`) and wire it into CI.

### FSA-13 [ ] Two CI gates that cannot fail

- **Playwright e2e has never run.** `ci.yml` gates it on `vars.E2E_BASE_URL`,
  which is unset; the file's own comment says "this job has only ever been
  skipped". It shows "skipping" on PR #5.
- **An unreachable test DB skips everything.** `tests/conftest.py:128` is a
  session-scoped `pytest.skip`. In CI only the coverage floor (`--cov-fail-under=88`)
  would turn that red, and only incidentally. Fail instead of skip when
  `CI=true`.

Also: mobile has 22 test files against 150 web and 299 backend.

---

## 3. P3

### FSA-14 [ ] North-Indian / Sanskrit forms on Tamil public pages

`natchathiram/*/visual` pages use "Shani" / "Shani puja" (Tamil: Sani), "Makar
Sankranti" and "Shani Jayanti" (North Indian observances; the Tamil one is Thai
Pongal), and pada names "Tula / Vrischika / Kanya / Makara / Dhanus / Kumbha /
Meena" (Thulam / Viruchigam / Kanni / Makaram / Dhanusu / Kumbam / Meenam). The
route slugs are Sanskrit (`ashwini`, `krittika`, `ardra`, `pushya`, `ashlesha`,
`shravana`…). The almanac-naming ruling (07-20) covered display names, not
URLs, so slugs are an **owner decision** (§8 Q4); changing them needs 301s to
keep their search ranking. `sevvai-dosham` metadata also leads with "Mangal
Dosha / Manglik" — defensible as search keywords, but it should not be in the
visible H1.

### FSA-15 [ ] Hand-copied sign-lord tables and chart grids

`_dg_scoring.SIGN_LORDS` (line 37), `jaimini_dasha._SIGN_LORD` (39), and an inline
dict in `chart_explanation_service.py:173` duplicate
`constants.astrology.SIGN_LORD`. All three agree today. Alias them, as eight
other modules already do.

The South Indian rasi-to-cell grid is typed four times: `dashboard-charts.tsx:19`,
`chart-generate-inline-panel.tsx:109`, `public-share-card.tsx:66` and
`mobile/src/components/JadhagamChart.tsx:9`, the last two in `[row, col]` order and
the first two in `{col, row}`. All four agree today. Move one copy into
`packages/shared` (this is also a natural first test for FSA-12).

### FSA-16 [ ] Launch runbook contradicts shipped code

`LAUNCH_RUNBOOK_2026-09-26.md`: "The 8th says 'ask again tomorrow'". Commit
`4a004995` replaced that copy with the named reset time, so the check will be
failed by correct code. `mobile/eas.json:32` points production at
`https://api.vinaadi.app`, while GRW-04 consolidated on `vinaadi.com`
(`packages/shared/src/constants/site.ts`).

---

## 4. Tamil-practice scorecard

| Area | Verdict |
|---|---|
| Ayanamsa, nodes, sunrise, Vimshottari, porutham tables, kalams, Gowri | Follows Tamil practice (10-13 verified; nothing found against it here) |
| Muhurta day score | **Not Tamil** — FSA-01 |
| Day-quality stars | Inconsistent — FSA-02 |
| Public content (nakshatra, Chandrashtama) | Arithmetic and doctrine errors — FSA-03, FSA-04 |
| Almanac header | Incomplete — FSA-09 |
| Festivals | Tamil set correct for 2026; derivation incomplete — FSA-05, F-FES-02 |
| Tajaka / Varshaphala | Imported North-Indian system, honestly flagged in code, mislabelled in product — FSA-08 |
| Ashtottari, Yogini, Kalachakra, Jaimini, conditional dashas | Not standard Tamil practice. Present as advanced views; acceptable if kept secondary to Vimshottari and labelled as such. Not audited deeper here |
| KP, Lal Kitab, tropical, Placidus, North-Indian chart | None found |

---

## 5. What this audit did not do

- **No test suite was run.** Docker Desktop's engine began returning HTTP 500 to
  every call partway through, so the measurements above come from the two runs
  that completed before it failed (FSA-01) and from static checks with host
  Python (FSA-03, FSA-11). CI on PR #5 is the authoritative test state.
- Not every one of the ~75 calculation modules was re-read line by line. This pass
  looked for **cross-module contradictions** and **imported conventions**; the
  10-13 audit did the cell-by-cell table check.
- **No Tamil wording was judged by a native reader.** Latin script inside Tamil
  copy was flagged where seen; quality was not assessed.
- Mobile was reviewed by grep only, with no device run.
- No browser pass; `title=` / `aria-label=` leaks were not re-swept.

---

## 6. Still open from 2026-10-13 (re-verified as still described, not re-measured)

| Item | State |
|---|---|
| F-POR-03 eka-nakshatra | Mechanism approved; star+pada table **held** (Anusham vs Uthirattathi) |
| F-POR-01 gana grades | Approved; 3 of 9 matrix cells unresolved in the ruling |
| F-KAR-01 Guru as husband karaka | Approved, not built; never swap Venus→Jupiter in a timing formula |
| Property split (land / residence / acquisition) | Approved, not built |
| F-POR-04 Vasya | HOLD — verify the whole 12-rasi table |
| F-FES-02 | Needs a lunar-month (amanta) derivation; no heuristic |
| Karinaal | Not yet checked against a printed almanac (five Thai dates moved a day) |
| PN-4 / "p. 243" | Source still unproduced |
| Papa samyam convention | Double-count across references unconfirmed |
| F-SAT-03 Pongu/Mangu/Marana Sani | Not modelled |
| Tuesday-night Durmuhurtham | Not shown |
| 80/65/50 composite rungs | On hold pending a measured distribution |

## 7. Recorded backlog (open `[ ]` lines in `docs/`)

Largest: Tamil review sheets **462** strings (propensity cards 368, age-phase 86,
nadi-dosha 8), never read by a Tamil reader; Doctrine v1.5 practitioner sign-off
**57**; public-site QA **45** (dated 06-02, likely stale — re-verify before
use); P2 backlog **33**; launch runbook **21** (domain registration, DNS,
PostHog, Firebase, Search Console, Play listing — owner actions). Counts are of
unticked boxes. Some lists are older than the code they describe, so treat a
count as "needs a look", not "this much work".

---

## 8. Questions for the owner / astrologer

1. **FSA-01** — Remove the sunrise-lagna factor from the day score entirely?
   (Recommended: yes. The window-lagna rule already carries the sourced doctrine.)
2. **FSA-02** — One general day-quality list. Are Magam and Moolam caution stars for
   *general* beginnings, while staying allowed for marriage?
3. **FSA-08** — Relabel Tajaka as a North-Indian annual chart, or take it off pricing?
4. **FSA-14** — Move nakshatra URLs to Tamil-almanac slugs (with 301s), or keep the Sanskrit slugs?
5. **FSA-04** — Should the public Chandrashtama tool switch to the star-keyed rule the dashboard uses?
