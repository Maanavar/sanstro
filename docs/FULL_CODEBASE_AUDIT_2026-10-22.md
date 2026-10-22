# Full codebase audit — 2026-10-22

Scope: backend engine and services (`app/`), API (`app/api/`), web (`web/`),
mobile (`mobile/`), shared client (`packages/shared/`). Run as three roles at
once — full-stack engineer, Tamil astrologer, test lead. Builds on
`TAMIL_ASTROLOGY_GROUND_TRUTH_AUDIT_2026-10-13.md` and
`FULL_SYSTEM_AUDIT_2026-10-21.md`; does not repeat what they already hold open.

**Method — measured, not read.** Every P1 below was reproduced by running the
engine (in the `vinaadi-dev-api` container, pyswisseph — the production
binding) or the live API, not inferred from source. The scripts that produced
the evidence are listed under each item so the result can be re-run.

Status key: `[ ]` open · `[~]` needs an owner/astrologer ruling first · `[x]` done

---

## Summary

| ID | Pri | Area | One line |
|---|---|---|---|
| FCA-01 | P1 | Festivals | Lunar festivals are keyed to the **solar** Tamil month — wrong in 16 festival-years of 2020-2045 |
| FCA-02 | P1 | Tamil calendar | Published month starts cover Apr 2026–Mar 2027 only; the rule outside it already misses 3 boundaries |
| FCA-03 | P1 | Rectification | "Birth time updated" changes nothing the engine reads — every reading stays on the old time |
| FCA-04 | P1 | Festivals | Star-day vratams use the star *at sunrise*; Karthigai vratam is a day late 9 times of 13 in 2026 |
| FCA-05 | P1 | Mobile i18n | Tamil readers still see `SATURN`, `Mithunam`, raw star codes on 6 mobile screens |
| FCA-06 | P2 | Calendar | Two almanacs served as one — SEO pages and the daily panchangam disagree on 20 dates + 71 Tamil dates |
| FCA-07 | P2 | Calendar | 2026-only data: SEO event hubs 404 and ~10 major observances vanish on 1 Jan 2027 |
| FCA-08 | P2 | Festivals | Pongal week 2026 shows two Pongals and two Mattu Pongals on consecutive days |
| FCA-09 | P2 | Sevvai dosham | Any two minor mitigations cancel the dosham — astrologer to confirm the threshold |
| FCA-10 | P3 | Chart | A birth above the Arctic Circle in polar season gets no chart at all |
| FCA-11 | P3 | Panchangam | Nishita (Sivarathiri) read at civil 00:00, not local midnight |
| FCA-12 | P3 | Dasha | Period dates are cut in UTC — can show one day early in IST |
| FCA-13 | P3 | Copy | Sadhana tara rendered சாதனை ("achievement") |

---

## P1

### FCA-01 — Lunar festivals keyed to the solar month `[x]` (Krishna Jayanthi `[~]`)

**Problem.** `app/calculations/festivals.py` names Vinayagar Chaturthi (`:340`),
Skanda Sashti (`:348`), Krishna Jayanthi (`:360`), Maha Sivarathiri (`:370`),
Deepavali (`:385`) and Mahalaya Amavasai (`:432`) by *tithi + solar Tamil
month*. These are lunar-month festivals. A solar month (29-32 days) can hold
zero, one or two occurrences of a given lunar tithi, and the lunar month drifts
up to ~18 days against it, so the rule fires a month early, twice, or never.

**Evidence** — engine vs. amanta lunar month (new-moon based, adhika months
excluded), Chennai, every day 2020-01-01 → 2045-12-31:

| Festival | Years wrong | Examples |
|---|---|---|
| Skanda Sashti | 6 | 2023: engine 20 Oct, true 19 Nov (Soorasamharam 18 Nov); **2031: none at all** |
| Vinayagar Chaturthi | 5 | **2023: engine 20 Aug; TN observed 18 Sep (G.O. 528)**; 2031, 2042 a month early; 2034 extra |
| Maha Sivarathiri | 2 | **2029: engine 13 Mar, true 11 Feb**; 2037 labelled twice |
| Deepavali | 1 | 2028: true 17 Oct **plus a false Deepavali on 15 Nov** |
| Mahalaya Amavasai | 2 | 2020, 2039: a second, false one 29 days later |
| Krishna Jayanthi | 8 | lineage question — see below |

The 2023 rows were confirmed on the live API
(`GET /api/v1/public/panchangam?date=2023-08-20` → "Vinayagar Chaturthi").

**Krishna Jayanthi is a ruling, not a bug.** The engine's solar-Aavani rule
matches Vaishnava *Sri Jayanthi*; the TN government holiday follows the lunar
*Gokulashtami* (2020: TN holiday 11 Aug, engine 10 Sep). A contested doctrine
is a lineage choice, so this becomes a declared tradition parameter, never a
silent pick.

**Fix.** Compute the amanta lunar month: month = rasi the Sun occupies at the
opening new moon, +1; a lunation with no sankranti inside is adhika and carries
no festival. Name each festival by (lunar month, paksha, tithi). Keep the solar
month only where tradition is solar — Vaikunta Ekadasi (Margazhi), Aadi Perukku,
Puthandu, Thai Pongal, Karthigai Deepam's month gate.

**Acceptance.** The scan below reports 0 differing years for the five non-lineage
festivals; a pinned test for 2023 (Vinayagar 18/19 Sep, Soorasamharam 18 Nov),
2028 (one Deepavali) and 2029 (Sivarathiri 11 Feb).

**Gate blind spot.** The scan compares month assignment with a sunrise tithi. It
does not decide the madhyahna (Vinayagar) or pre-dawn (Deepavali) kala rules —
those can still move a day.

*Evidence script:* `scripts/audit/festival_lunar_month_scan.py <from> <to>` —
run inside the API container (`docker cp` it to `/tmp`, then
`docker exec vinaadi-dev-api python /tmp/festival_lunar_month_scan.py 2020 2045`;
~18 min for 26 years).

---

### FCA-02 — The Tamil month authority covers one year, and the rule outside it is known wrong `[x]` (2028 edition due `[ ]`)

**Problem.** `app/data/tamil_calendar_authority.py:25` holds the published month
starts for **April 2026 – March 2027 only**. Outside that window
`tamil_calendar.month_start_date_for_sankranti` falls back to the sunset rule,
which disagrees with published almanacs on boundaries we can already see:

| Boundary | Sunset rule | Published |
|---|---|---|
| Thai 2026 (Pongal) | 14 Jan | **15 Jan** (Dinamalar; TN holiday 15 Jan) |
| Aavani 2026 | 17 Aug | 18 Aug (Gnanananda) |
| Purattasi 2026 | 17 Sep | 18 Sep (Gnanananda) |

`docs/TAMIL_MONTH_BOUNDARY_TABLE_2026-27.md` already proves no single threshold
reproduces them — the almanac is computing sankranti differently (likely
Vakya/Thirukanitham instants), not choosing another cut-off.

From **Chithirai 1, 2027 (≈14 Apr 2027)** every boundary returns to the
unverified rule. Nothing fails, nothing is disclosed — the Karinaal-2027 cliff
again. Every Tamil date, Karinaal, Puthandu, Pongal, Aadi Perukku and every
solar-month festival hangs off this.

Also: the override applies only when `tz.key == "Asia/Kolkata"`
(`tamil_calendar.py:183`), so a diaspora user (Singapore, Malaysia, UK, US) never
gets the published dates even inside the covered year.

**Owner decision needed.** (a) import the 2027-28 Gnanananda edition before
April and every year after, or (b) adopt the almanac's own sankranti method so
the rule reproduces the book. Also: is the published Tamil date the date for
a Tamil user anywhere, or only in India?

**Fix (either way).** A test that fails when today + 120 days is outside the
authority's coverage, and an API flag (`tamilDateSource: "published" |
"computed"`) so a computed date is never presented as the almanac's.

**Acceptance.** The coverage test exists and fails on a clock set to 2027-01-01
with only the 2026-27 table loaded.

---

### FCA-03 — Rectification "applies" a time that nothing reads `[x]`

**Problem.** `PATCH /birth-profiles/{id}/rectify/apply` →
`rectification_service.apply_rectified_time` (`:171-193`) writes
`birth_time_local` and commits. It does **not**:

1. refresh `birth_datetime_utc` — which the chart builder
   (`_chart_build.py:140`), daily scoring (`_dg_scoring.py:214`), Shadbala
   (`shadbala_service.py:62`) and the push cron (`daily_push_cron.py:377`) all
   read **in preference to** the local time (see the comment at
   `birth_profile_service.py:172`);
2. recalculate the persisted chart — `load_persisted_chart_response`
   (`_chart_persist.py:175`) returns stored planets whenever they exist;
3. drop cached daily scores.

So the user sees "Birth time updated: 07:42" (`dashboard-workspace.tsx:1605`)
while lagna, houses, dasha balance and every daily score stay on the old
time — and because `birth_datetime_utc` is stale, even a forced recalculation
rebuilds the old chart. Only a later profile edit that touches a birth field
repairs it.

Also in the same route: it answers **403** to a non-owner (the existence oracle
`app/core/chart_access.py` was written to remove), accepts a soft-deleted
profile, and computes `appliedOffsetMinutes` across midnight wrongly
(23:50 → 00:10 reports −1420 instead of +20).

**Why the suite is green.** `tests/test_rectification.py:117` asserts only that
the response has three keys.

**Fix.** Route the write through `apply_birth_profile_changes(...,
recalculate=True)` — the one function that already does (1)-(3) — and resolve
the profile with the shared 404-first ownership check.

**Acceptance.** A test applies a rectified time 2 hours later and asserts the
chart's lagna degree and `birth_datetime_utc` both change; run once against
current HEAD to see it fail.

---

### FCA-04 — Star-day vratams use the star at sunrise `[x]` (astrologer to confirm `[~]`)

**Problem.** The festival path passes the **sunrise** nakshatra
(`panchangam_service.py:160`). A star that begins mid-morning and still holds
for a few minutes at the next sunrise is labelled on the *next* day. The
engine already computes the star that rules the day (`dominant_nakshatra_number`,
`panchangam.py:2501`) but the festival rules never read it.

**Evidence** — 2026, engine vs. the curated almanac rows the SEO pages publish:

- Karthigai vratam: **9 of 13** dates differ, the almanac always one day earlier.
- Thiruvonam vratam: 5 differ, and the engine adds 2 extra occurrences.
- Same rule drives Karthigai Deepam, Thai Poosam, Maasi Magam, Panguni Uthiram,
  Vaigasi Visakam; the code comment at `festivals.py:424-428` already concedes
  "both days carry the label" for these.

**Astrologer question.** For a star-day observance, which instant names the
day: sunrise, the star's majority of the solar day, or a kala (sunset for
Deepam)? Answer per observance class.

**Acceptance.** Karthigai vratam 2026 matches the almanac on 13/13 (or the
difference is a named, ruled convention).

---

### FCA-05 — Mobile still renders the name field, not the key `[x]`

The 2026-10-13 audit's mobile items are still open, plus more. Every one shows
English or an upper-case code to a Tamil reader (CLAUDE.md "Display boundary"):

| File | Line | Renders |
|---|---|---|
| `mobile/app/(tabs)/insights/index.tsx` | 195, 198 | `isTamil ? x.lord : x.lord` — **both branches identical** → `SATURN` |
| `mobile/app/(onboarding)/jadhagam-reveal.tsx` | 103-104 | `lagna.rasiName`, `lagna.nakshatraName` — the first chart a new user sees |
| `mobile/app/(tabs)/tools/jadhagam.tsx` | 99-100, 189-190, 210 | rasiName, nakshatraName (incl. share text), `{p.graha}` |
| `mobile/app/jadhagam/[id].tsx` | 261 | `{p.graha}` |
| `mobile/app/dasha/index.tsx` | 713, 729, 752 | `rasiName ?? rasiCode` |
| `mobile/app/rectification/index.tsx` | 367 | `lagnaRasiName` |

**Fix.** `rasiDisplayName(rasi, lang)`, `tPlanetLord`, `tNakshatra`; then port
`web/lib/astro-name-display-boundary.test.ts` to `mobile/` so it ratchets.

**Acceptance.** The ported ratchet fails on current HEAD with these 13 sites and
passes after. Blind spot: like the web ratchet, it cannot see names built by
concatenation.

---

## P2

### FCA-06 — Two almanacs presented as one `[~]`

`app/data/panchangam_events_2026.py` (tamildailycalendar.com) feeds the SEO
`/tamil-calendar` pages; the engine feeds the daily panchangam and the signed-in
calendar. For 2026 they disagree on **Ekadasi 3, Ashtami 5, Navami 4,
Chathurthi 3, Sashti 1, Amavasai 1 (8 vs 9 Nov), Pradosham 1 (12 Jun)** dates,
and **71** of the stored Tamil dates differ from `tamil_solar_date` for the same
day (Thai and Aani a day one way; Aavani and Purattasi a day the other — the
stored list follows a different month-start almanac than Gnanananda). Example:
27 Aug 2026 is "Aavani 11" on the Pournami page and "Aavani 10" on the
panchangam. `_enrich_date` (`panchangam_events_service.py:204`) serves the
stored values as-is.

*Evidence script:* `scripts/audit/seo_events_vs_engine.py` (container, ~4 min).

**Owner decision.** One source of truth. Recommended: derive the event pages from
the engine (as Karinaal already is) once FCA-01/02/04 settle the rules.

### FCA-07 — 2026-only data `[x]` (observances; SEO event hubs `[ ]`)

- `panchangam_events_service.EVENTS_BY_YEAR` has only 2026; `?year=2027`
  returns 404 "No calendar published" for all 15 event hubs. "Pournami 2027"
  searches start in November.
- `calendar_categories_2026.py` is the **only** source for Navarathiri, Ayudha
  Pooja, Thai Amavasai, Aadi Pooram, Arudra Darisanam, Varalakshmi Vratham —
  no algorithmic rule exists, so they disappear from every calendar on
  1 Jan 2027. Aadi Amavasai and monthly Masa Sivarathiri are not computed at all.

**Acceptance.** A test that asserts each named observance appears exactly once
in 2027 and 2028.

### FCA-08 — Pongal week 2026 contradicts itself `[x]`

Live API, Chennai: 14 Jan "Thai Pongal"; 15 Jan "Pongal" **and** "Mattu
Pongal"; 16 Jan "Mattu Pongal" again + "Kaanum Pongal"; 17 Jan Uzhavar Thirunal.
`festivals.py:86-96` says Bhogi/Mattu/Kaanum are Pongal −1/+1/+2, but the rows
are 13/15/16 against a Pongal of 15. Correct (TN, 2026): Bhogi 14, Pongal 15,
Mattu Pongal + Thiruvalluvar Day 16, Kaanum Pongal + Uzhavar Thirunal 17. The
algorithmic "Thai Pongal" lands on 14 Jan because of FCA-02.

### FCA-09 — Sevvai cancellation threshold `[~]`

`_yoga_dosham.py:323`: `is_cancelled = major_cancellation or mitigation_score >= 2`.
Jupiter aspecting Mars and Jupiter aspecting the 7th lord often co-occur, so many
charts read "cancelled" on two minor points with no major cancellation.
Astrologer to confirm whether two minor mitigations equal one major.

---

## P3

- **FCA-10** — `_birth_panchangam_signature` (`_chart_build.py:837`) needs a
  sunrise, so a birth in polar day/night (sweep: Tromsø, 21 Jun) gets no chart,
  though planets and lagna are computable. `_chart_planets.py:272` already shows
  the degrade-gracefully pattern.
- **FCA-11** — `panchangam.py:2512` reads the nishita tithi at civil 00:00.
  Nishita is the midpoint of sunset→sunrise: ~10-20 min off in Chennai, over an
  hour in DST zones. Moves Sivarathiri only on edge days.
- **FCA-12** — `dasha.py:68` cuts dates in UTC; a boundary between 00:00 and
  05:30 IST displays a day early.
- **FCA-13** — `tara_bala.py:28` Sadhana tara = "சாதனை" (achievement); almanacs
  print சாதக. Native-speaker review item.
- `personal_palan.py:565` keeps a hand copy of the gochara table that
  `gochara_scores.py` now owns — identical today, drift risk tomorrow.

---

## Verified correct (this pass)

| Check | How | Result |
|---|---|---|
| Lagna + Moon nakshatra | 306 synthetic births, 12 locations, both hemispheres, 1940-2025 vs raw swisseph (Lahiri, whole-sign asc) | 304/306 match; 2 are deliberate refusals (DST gap, polar — FCA-10). `scripts/audit/chart_property_sweep.py` |
| Vimshottari | read `dasha.py` | balance, 120-yr proportions, opening-dasha bhuktis over the true span — correct |
| Hora / Tarabalam / gochara tables | read | correct (Chaldean order, 24 equal hours per EC-RULING-03; 9 taras; classical from-Moon tables) |
| Sade Sati | read + aspect arithmetic | 3 phases, Janma heaviest; "5th untouched" claim holds |
| Karinaal 2027 cliff (F-MUH-02) | read | fixed — derived from solar calendar |
| F-MAR-01 / F-MAR-02 / F-CI-01 / F-PAN-01 | read | fixed and wired (`sevvai_label_cap` called at `compatibility_intelligence.py:1099`) |
| Muhurta reads Karinaal | read | yes, −22 factor |
| Ownership (IDOR) | AST sweep of every route taking a chart/profile/member/session id | all guarded (rectification: 403 oracle, FCA-03) |
| Secrets / CORS | `git ls-files`, `main.py` | no tracked secrets; CORS is an explicit allow-list |
| Web display boundary | grep | localised; two ratchets in place |
| Web tests | `vitest run`, `tsc --noEmit` | 156 files, **1797/1797 pass**; tsc clean |
| Mobile tests | `jest`, `tsc --noEmit` | 22 suites, **179/179 pass**; tsc clean |
| Backend suite | `test-docker.ps1` (full, pyswisseph) | see "Test status" |

## Not covered — read before treating this as a clean bill

- Narrative/reading prose (`one_minute_reading_service.py` 297 KB and peers) and
  the 27 nakshatra pages — under the owner's separate review (FSA §8-11).
- Porutham tables — verified cell-by-cell on 2026-10-13, not re-run.
- Numerology, PDF export, payments/entitlements, push delivery.
- Playwright e2e and visual suites; performance.
- Tamil copy outside the items named here (FSA open decision O1 still stands).
- Every gate above sees English-mode output only, except where stated.

## Test status

Backend full suite (`test-docker.ps1`, container, pyswisseph, `--no-cov`):
**stopped by the script's 7200 s hard ceiling at 72% with zero failures and
zero errors** up to that point. Not a completed run: this audit's evidence
scans were running in the same container concurrently and slowed it, and the
run started before the Remediation below, so it mixes pre-fix and mid-edit code
(`app/` is mounted live). It is evidence for nothing in the Remediation. CI
remains authoritative (CLAUDE.md); re-run the suite on the remediated tree.

After the Remediation (remediated tree, `test-docker.ps1`, pyswisseph): a focused run of the 23 test
files that touch the changed areas. It covered rectification, birth profiles, festivals, the Tamil
calendar, the panchangam and muhurta APIs, generated types, field contracts, the rulebook, query and
perf budgets, and the daily-guidance goldens. **757 passed, 0 failed.** Also: web vitest 1797/1797,
mobile jest 182/182, tsc clean on web, mobile and shared, ruff and mypy clean. The full backend suite
has not been rerun on the remediated tree.

---

## Remediation — 2026-10-22 (same day)

The owner supplied a 2027 almanac ("Tamil Dates 2027", from tamildailycalendar.com). It contains a muhurtham
table, a festival list, and every monthly observance. That made it the reference for FCA-02, FCA-04
and FCA-07, and a full-year cross-check for FCA-01. How each value was read from it is in
`docs/TAMIL_CALENDAR_2027_IMPORT.md`.

| ID | Outcome | Gate (and what it cannot see) |
|---|---|---|
| FCA-01 | `app/calculations/lunar_month.py` computes the amanta month (opening new moon's Sun rasi +1; no sankranti = adhika, no festival). Vinayagar, Skanda Sashti, Sivarathiri, Deepavali and Mahalaya key on it. Krishna Jayanthi is a declared constant, `KRISHNA_JAYANTHI_RECKONING` (default unchanged: Sri Jayanthi). | `festival_lunar_month_scan.py 2020 2045`: **Deepavali, Skanda Sashti, Sivarathiri, Mahalaya 0 years differ** (were 1/6/2/2). Vinayagar 1: the 2026 curated TN-gazette row on 14 Sep beside the computed 15 Sep (data, not the rule). Pinned: 2023 Vinayagar 19 Sep, Skanda 19 Nov, 2028 one Deepavali, 2029 Sivarathiri 11 Feb, all six 2027 PDF dates. *Blind spot:* madhyahna/pre-dawn kala rules, as before. |
| FCA-02 | The authority is now a list of published sources, and they must agree where they overlap. 2027 imported from the PDF (its Thai/Maasi/Panguni equal Gnanananda's). Coverage is **14 Apr 2026 → 12 Jan 2028**. Fixed a latent bug: a published start *earlier* than the sunset rule (Aani 2027) printed "Vaikasi 32". API: `tamilDateSource: "published" \| "computed"` on the daily panchangam, the month grid and muhurta slots. | `tests/test_tamil_calendar.py`: coverage guard (fails when today + 120 d passes coverage; shown failing with only the 2026-27 table at 2027-01-01), every published boundary round-trips, sources agree, Aani 2027. Day-by-day continuity 2026-03 → 2028-02: 0 problems. *Blind spot:* clients do not yet *render* the computed flag. |
| FCA-03 | The apply route goes through `apply_birth_profile_changes(..., recalculate=True)`: UTC instant refreshed, scores dropped, chart recalculated. Soft-deleted profile → 404. Offset computed from UTC instants. | `test_rectify_apply_moves_the_birth_instant_and_the_chart` (UTC +2 h, new chart, lagna moves 15–60°). **Correction to this report:** 23:50 → 00:10 *is* −1420. Candidates sweep the recorded date and the date never changes, so the instant really moves back; pinned. |
| FCA-04 | Each observance at its own instant, measured against the 2027 almanac. **Karthigai vratam = star at sunset** (13/13; sunrise was 7/13). Thiruvonam = star at sunrise, first of two (13/13). **Sankatahara = Krishna Chaturthi at moonrise** (12/12; sunrise was **5/12**, a defect this report missed). `calculate_rise_transit_jd(body="MOON")` added. | `almanac_2027_vs_engine.py`. Against the 2026 curated rows: Karthigai **12/13** (was 4/13), Sankatahara 12/13. Recorded as this almanac's convention, for the astrologer to confirm. |
| FCA-05 | All 13 sites, plus **5 more screens the ratchet found** (prashan, dasha karakamsa/fallback, life-event log, shadbala, wrapped). The onboarding/jadhagam "நட்சத்திரம்" cell showed the **lagna's** star; it now shows the janma (Moon) star. Onboarding "ரோஜா சக்கரம்" ("rose wheel") corrected to ராசி சக்கரம். | `mobile/__tests__/astro-name-display-boundary.test.ts`: flags 10 files on HEAD, 0 now. *Blind spots:* names built by `+`; *which* star a cell shows (the lagna/Moon fix is invisible to it). |
| FCA-07 | Rules for Bhogi, Mattu/Kaanum Pongal, Thai/Aadi Amavasai, Thiru Aadi Pooram, Aadi Krithigai, Arudra Darisanam, Navarathiri Begins, Saraswathi Poojai/Ayudha Pooja and Vijayadasami (aparahna), Varalakshmi Vratham, and monthly Masa Sivarathiri. | `yearly_observances_scan.py 2026 2028`: every 2027 PDF date matched. Open: SEO event hubs still 2026-only (`EVENTS_BY_YEAR`). |
| FCA-08 | Pongal week is derived from Thai 1 for every year. 2026 is fixed by the owner's ruling (Thai 1 = 15 Jan 2026), which made the curated rows (Bhogi 14, Pongal 15, Mattu 16, Kaanum 17) agree with the gazette rows. | `test_thai_pongal_2026_is_the_published_15_january`, `test_thai_2026_is_the_owner_ruled_15_january`. |

### Found while fixing (not in the report above)

- **Sankatahara Chaturthi** used the sunrise tithi, which was wrong 7 of 12 times in 2027 (fixed, FCA-04).
- **Sri Jayanthi double in 2033.** Solar Aavani holds two Krishna Ashtamis (17 Aug and 16 Sep), and the
  current default labels both. Whichever lineage is ruled, it needs a tie-break.
- **Two occurrences in one solar month.** Pooram falls twice in Aadi 2026 (18 Jul and 14 Aug; the 2026
  rows keep the second), and Karthigai twice in Aadi 2028. Both days are labelled until this is ruled.
- **Mobile calendar prints `fest.name` raw**, so Tamil readers see English festival names. The Tamil map is
  `web/lib/festival-names.ts` and needs to move to `packages/shared`.
- **26 `isTamil ? "English" : "English"` UI strings on mobile** (17 in `today.tsx`). These are copy, so
  they were left for the Tamil review (FSA O1).

### Owner rulings (2026-10-22)

1. **Source:** the 2027 almanac is tamildailycalendar.com's. That is also the source of the 2026 SEO
   rows (`panchangam_events_2026.py`), so FCA-06's "two almanacs" are one publisher in two years. Even
   so, its 2026 and 2027 data use different moments for Thiruvonam (Q2 in the review requests).
2. **Thai 1, 2026 = 15 Jan.** Recorded as an owner-ruled boundary (`OWNER_RULING_THAI_2026`,
   `complete=False`).
3. **Published Tamil dates apply everywhere.** The `Asia/Kolkata`-only restriction is removed. A reader
   in Singapore or Toronto now gets the almanac's dates, and `tamilDateSource` no longer depends on the
   timezone.

### Still open

**Owner**
1. Import the **2028 edition before ~15 Sep 2027**. The coverage test fails from then.
2. How should a computed Tamil date be shown to the user? (The API flag exists; nothing renders it yet.)

**Astrologer:** eight questions in `docs/REVIEW_REQUESTS_2026-10-22.md`, each self-contained and ready
to forward. **Answered the same day** — see below.

### Astrologer's answers applied (2026-10-22, evening)

| Q | Applied | Gate (and what it cannot see) |
|---|---|---|
| Q1 → FCA-01 `[x]` | Krishna Jayanthi = Shravana Krishna Ashtami at true midnight, Rohini tie-break; `KRISHNA_JAYANTHI_RECKONING` removed. 2020 now 11 Aug; the 2033 double is gone. | `test_krishna_jayanthi_*`; yearly gate 2020-2045. *Open (F1):* which civil day carries a midnight; published dates match the sunrise-Ashtami day. |
| Q2 | Vratams unchanged. Karthigai Deepam = Krittika at pradosham beside the Karthigai full moon, falling back to the sunrise star (2025). Moves 2027 to 11 Dec. | `test_karthigai_deepam_*`. *Open (F2):* 2027 vs the almanac's 12 Dec. |
| Q3, Q4 | Confirmed. The fallback principle was applied to aparahna: Vijayadasami 2022 had **no day** (now 5 Oct), and Ayudha Pooja 2045 had two. | `test_a_failed_aparahna_falls_back_to_the_sunrise_tithi`. *Open (F7):* is "two aparahnas" a failure? |
| Q5 → FCA-07 | Family A (Thai Poosam, Maasi Magam, Panguni Uthiram, Vaigasi Visakam, Arudra, Deepam): the star day beside the month's own full moon (`lunar_month.full_moon_tamil_month_index`). Aadi Pooram: Shravana's Pooram. A star holding no sunrise names its day: **Thai Poosam 2028, Vaigasi Visakam 2021, Maasi Magam 2020/2045 and Panguni Uthiram 2037 had no day.** | `test_thai_poosam_*`, `test_a_star_holding_no_sunrise_*`, `test_aadi_pooram_*`. *Open:* Aadi Krithigai (F3), two full moons in one month (F8: Vaikasi 2022/2041). |
| Q6 → FCA-06 | Amavasai/Pournami day = sunrise tithi, first of two, kshaya = the day it falls in (`special_tithi_day_from_sunrises`; majority-of-day deleted). Tharpanam (Mahalaya, Thai/Aadi Amavasai) at aparahna. **Cache v49.** | `almanac_2027_vs_engine.py`: **13/13, 12/12** (were 10/13, 10/12); Mahalaya 29 Sep kept. |
| Q7 | Thai Karinaal 1, 2, 3, **10, 16**; Karthigai 7 and Margazhi 11 kept. Checked first: all other months already equal the almanac. | Same script: 33/33 + the two kept days. *Open (F5):* name the lineage. |
| Q8 → FCA-09 `[x]` | Only a major factor cancels Sevvai; two or more minors reduce one grade. | 6 tests rewritten to the ruling. *Owner (O-33):* the ruling's major list (own sign, exaltation, exempt rasis, debilitation) reverses O-18 and is not built. |

**Pre-existing, found by the 26-year gate** (`yearly_observances_scan.py 2020 2045`; it had only run
2026-2028): Aadi Amavasai 2023 twice (solar Aadi held two Amavasais; F8); Varalakshmi 2025 on two
Fridays (1 and 8 Aug: the Shukla 8–14 window admits both); Maasi Magam 2026 on the curated 2 Mar and
the rule's 3 Mar; Krishna Jayanthi 2025 on the rule's 15 Aug and the 2025 row's 16 Aug (F1).

**Before deploying:** `PANCHANGAM_CACHE_DATA_VERSION` 48 → 49 invalidates every cached snapshot at once
(see the cache-bump note: check the largest uncached fan-out against the 300 s proxy limit).

