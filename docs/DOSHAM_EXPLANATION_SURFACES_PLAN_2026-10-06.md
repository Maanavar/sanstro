# Dosham explanations across surfaces — audit and plan (2026-10-06)

**Owner question:** the new DD-17 explanations (counted from, what remains,
context, "in your chart") seem to appear only in Family → Full chart reading →
Astrologer view → Yogas & Doshams. Why not Life Areas, Story mode, or "Yogas,
strengths & remedies"?

**Short answer:** mostly right. The full explanation lives only where the full
dosham *card* renders. Everywhere else shows a one-word chip. That was a
deliberate rule from earlier work (IA audit 2026-07-22 D1: one home for the full
catalogue; FTR-18: say it once). The rule is sound. Its result is not: the
surfaces most people actually read now answer "is my Sevvai serious?" with one
word, or with nothing.

## 1. Where dosham content appears today (verified in code)

| Surface | Component | What the reader sees |
|---|---|---|
| Family → Full chart reading → Astrologer view → Yogas & Doshams | `NovaYogaDoshamPanel` via `dashboard-family-charts-hybrid.tsx` | **Full**: chips + counted-from + what remains + context + in your chart + why + remedies |
| Life Areas → **Full report** sub-tab | `NovaYogaDoshamPanel` via `dashboard-life-areas-report-nova.tsx` | **Full** (same panel), but four clicks deep |
| Explore → Dosham → (one dosham) | `DashboardExploreDoshamNova` | **Full** block + residual in hero, attribute band, family rows |
| Personal Astrologer view (legacy host) | `YogaDoshamPanel` | **Full** |
| Family → member profile page | `dashboard-family-member-nova.tsx` | Chip + chart-specific meaning line (fixed today; it used to print the engine enum) |
| Mobile → Dosha Check | `mobile/app/(tabs)/tools/dosham.tsx` | **Full** in the expanded card |
| Family → Full chart reading → §7 **Yogas, strengths & remedies** | `HyYogaDoshaCard` (`dashboard-hybrid-parts.tsx`) | **Chip only** ("Mitigated · mild residual"), max 6 rows, "View all" scrolls to the section, not to the card |
| Life Areas → **Yogas & Doshams** sub-tab | `YogaActivationSummary` (`dashboard-life-areas-tab-nova.tsx`) | **Chip only**, grouped by dasha activation, link out |
| Story mode → **Gifts & care** | `story-gifts.tsx` → `carePatterns` | **Chip only, and usually nothing**: a mitigated dosham with a mild residual is excluded from "Handle with care". For a chart like the owner's, Story mode says nothing at all about Sevvai or Rahu–Ketu |
| Mobile → reading | `mobile/app/reading/[id].tsx` | Chip only |
| Life Areas → **Marriage** area card (wire key `RELATIONSHIPS`) | `life-area-card.tsx` | Nothing about Sevvai or Rahu–Ketu. *Correction, found while implementing:* the papa-kartari "area dosham" in `life_areas_service` is an internal input to the area score (`prediction_score`, `promise_gate`) and is **never rendered as text**, so the "no dosham" contradiction this row first claimed does not exist on screen |

## 2. Diagnosis (product view)

1. **The question people arrive with is not answered where they arrive.** For
   a Tamil reader, "do I have Sevvai / naga dosham, and how bad is it?" is the
   first question, often the only one. Story mode is the consumer reading, and
   it is silent on both. Only the expert surfaces answer it.
2. **One word is too little for a dosham verdict.** The practitioner's review
   was a paragraph per dosham. A chip alone ("Mitigated · mild residual") is
   honest but unexplained: it doesn't say *from where* or *what softened it*.
3. **"Say it once" got read as "say it nowhere else".** FTR-18 forbids printing
   the same *paragraph* twice. It doesn't forbid a one-line verdict that links to
   the paragraph.
4. **Navigation drops the reader.** "View all yogas & doshas" scrolls to a list
   of collapsed cards; the reader has to find and open the right one again.
5. **The Marriage area is silent on the marriage doshams.** It is where a
   reader looks for marriage, and it said nothing about Sevvai or Rahu–Ketu.
   (First written as a naming contradiction; see the §1 correction.)

## 3. Design: three layers, one source

| Layer | Content | Where |
|---|---|---|
| **L1 Chip** | "Sevvai · Mitigated · mild residual" | Already everywhere (`doshamStanding`) |
| **L2 Verdict line** (new) | One sentence, built from the engine's own fields: *"Counted from your Moon and Venus, not your Lagna; softened by a strong 7th lord and Jupiter's aspect — a mild residual remains."* | Under every chip that names a Sevvai or Rahu–Ketu dosham: Story, §7 card, Life Areas sub-tab, member page, mobile reading |
| **L3 Full reckoning** | `DoshamReckoningBlock` + why + remedies | The full panel only (unchanged) |

L2 is written once, server-side (`ChartDoshamInsight.verdictTa / verdictEn`,
built from `referenceHouses`, `cancellationFactors` and `residual`), so web,
mobile and PDF share it. That satisfies "say it once": it is a summary of the
card, not a copy of it.

## 4. Work items, in order

| # | Item | Why first | Size |
|---|---|---|---|
| 1 | **Verify on the real app** (owner's chart, en + ta): screenshot each surface in §1 before changing more | Nothing in DD-17 has been seen rendered yet; the tests use synthetic charts | S |
| 2 | **L2 verdict line**: engine builds `verdict*` per dosham; shared type; one test that it never contradicts `residual` or `isCancelled` | Every later item renders it | M |
| 3 | **Story → Gifts & care**: add a "Marriage doshams" row for Sevvai and Rahu–Ketu whenever *present* (active or mitigated): chip + L2 + "See the full reckoning →" | The consumer reading currently omits the most-asked question | S–M |
| 4 | **§7 Yogas, strengths & remedies**: L2 under the dosham rows; "View all" → deep link that scrolls to **and opens** that dosham's card (`#dosham-SEVVAI_DOSHAM`) | Highest-traffic glance in the full reading | S |
| 5 | **Life Areas → Yogas & Doshams**: L2 under dosham rows; link opens the card. Keep the activation grouping (IA D1 stands) | Same gap, same fix | S |
| 6 | **Marriage area card**: rename the papa-kartari finding (e.g. "7th-house pressure"), and show the Sevvai / Rahu–Ketu L1+L2 there, because that is where a reader looks for marriage | Removes a live contradiction | M (copy + Tamil review) |
| 7 | **Mobile reading**: L2 under the dosham chips | Parity | S |
| 8 | **Ratchet test**: every surface that names Sevvai or Rahu–Ketu renders the residual and the verdict line (vitest over the components in §1) | Stops a future chip-only regression | S |

Items 3–5 and 7 are pure presentation on top of item 2. Item 6 needs a
doctrine-copy decision and native Tamil review.

## 5. What this plan does not change

- The full catalogue's home (IA D1) and the "say it once" rule (FTR-18).
- Any dosham verdict: this is presentation only. DD-17 rulings stay as recorded.
- Gender weighting stays astrologer-only (DD-05).

## 6. Decisions (answered by the owner-forwarded review, 2026-10-06)

1. **L2 verdict line: approved**, generated from structured engine facts, never
   stored as engine prose.
2. **Story mode: a separate "Checked & softened" line** for mitigated doshams;
   only an unmitigated finding sits under "Needs attention".
3. **Marriage area: rename** the papa-kartari finding; it is not called a dosham there.
   *Moot on inspection:* the finding is never shown as text (§1 correction), so
   nothing is renamed; the Marriage area now shows the real marriage doshams instead.

## 7. Review response — adopted, adapted, deferred

| Review point | Response |
|---|---|
| L2 from structured facts, not a stored sentence | **Adopted.** No `verdict*` wire field. The sentence is composed in `packages/shared/src/doshamReckoning.ts` from fields the engine already sends (`referenceHouses`, `conditionsMet`, `cancellationFactors`, `residual`). The engine changes, the sentence follows. |
| A. Sevvai and Rahu–Ketu need different templates | **Adopted** as one composer per dosham. **Not adopted:** splitting the wire type into `SevvaiDoshamInsight` / `RahuKetuDoshamInsight`. The reasoning fields are already per-row and generic (`referenceHouses` carries Mars's one house or the two node houses). A discriminated union would change a contract shared by backend, shared, web and mobile for no fact the UI cannot already read. |
| B. Rename `cancellationFactors` | **Adapted.** The field is a four-surface contract (and the yoga card's too), so it keeps its name. Its dosham semantics are now written down: every entry *lowers a grade*; none erases a placement; `isCancelled` means "nivarthi threshold reached", displayed as **Mitigated**. The distinctions the review asks for are made in the shared layer: formation evidence and reinforcements are separated out of `conditionsMet`, and the two true major cancellations (`jupiter_conjunct_mars`, `both_partners_have_sevvai`) are named. |
| C. A mild–moderate grade for Rahu–Ketu | **Deferred to the practitioner as O-31.** On the reviewer's own chart the engine reads the axis as mild after three mitigations. A new public grade tuned to one chart would be the wrong move. What the review is really asking for — that a softened axis never reads as erased — is met in copy: every Rahu–Ketu verdict says *"the placement itself remains"*. |
| D. Never hide a mitigated dosham in Story | **Adopted** (item 3). |
| E. Don't call it Naga Dosham | **Already true.** The in-app name is "Rahu-Ketu Dosham" (`ராகு-கேது தோஷம்`); the Naga/Sarpa guide is wired to Putra Sarpa (node in the 5th), not to this axis. The axis is now named as a variant badge: "2/8 axis". |
| Invariant tests | **Adopted.** No mitigation phrase that is not in `cancellationFactors`; references printed = references counted; mitigated ⇒ "remains"; not present ⇒ no line. "Cancelled ⇒ no residual" does not arise: no dosham is reported as fully erased (DD-17). |
| "See full reckoning" opens the exact card | **Adopted.** `#dosham-<NAME>` opens the reading, switches to the Astrologer view, selects its Yogas & Doshams section, opens and scrolls to the card. |
| 2A reasoning contract before L2 | **Adopted** as the shared-layer contract above, not a schema migration. |

## 8. Status (2026-10-06, end of day)

| # | Item | Status | Where |
|---|---|---|---|
| 1 | Verify on the real app | **Open — owner.** Not run; every test uses synthetic charts | — |
| 2 | L2 verdict line | **Built** | `doshamVerdictLine`, `MITIGATION_PHRASE`, `VERDICT_DOSHAMS` in `packages/shared/src/doshamReckoning.ts`; `web/components/dosham-verdict-line.tsx` |
| 3 | Story → Gifts & care | **Built**: "Marriage doshams" card, *Needs attention* / *Checked & softened*; Sevvai and Rahu–Ketu leave the care chips | `chart-reading/story-gifts.tsx` |
| 4 | §7 Yogas, strengths & remedies | **Built**: L2 under each dosham row; "See how this was calculated" opens the exact card | `dashboard-hybrid-parts.tsx`; `web/lib/dosham-deep-link.ts` (reading → Astrologer view → Yogas section → card, opened, scrolled, focused) |
| 5 | Life Areas → Yogas & Doshams | **Built**: own "Marriage doshams" block (chip + L2 + link); the activation lists keep everything else | `dashboard-life-areas-tab-nova.tsx` `MarriageDoshamList` |
| 6 | Marriage area | **Built differently**: no rename needed (§1 correction); the Marriage (`RELATIONSHIPS`) detail drawer ends with `MarriageDoshamList` | `life-area-card.tsx` `footer`, `dashboard-life-areas-tab-nova.tsx` |
| 7 | Mobile reading | **Built**: "Marriage doshams" card with chip + L2 | `mobile/app/reading/[id].tsx` |
| 8 | Ratchet tests | **Built** | `web/components/dosham-verdict-line.test.tsx` (references printed = counted, no phrase without its marker, mitigated ⇒ remains, Rahu–Ketu ⇒ "the placement itself remains", Tamil carries no English, the deep link opens the card); `tests/test_marker_label_coverage.py` (every Sevvai / Rahu–Ketu mitigation marker has a phrase); `yoga-dosham-standing.test.tsx` (each marriage dosham said once on Life Areas) |
| — | Axis badge | **Built**: Rahu–Ketu carries "2/8 axis" / "2/8 அச்சு" as its variant | `_yoga_dosham.py`; Nova card no longer appends "Kala Sarpa" to a non-Kala-Sarpa variant |
| — | O-31 (mild–moderate grade) | **Open — practitioner** | packet §B |

New Tamil from this round (pending native review): the verdict composer's
sentences and the 20 mitigation phrases, "திருமண தோஷங்கள்", "கவனம் தேவை",
"சரிபார்த்து, குறைந்தவை", "இது எப்படிக் கணக்கிடப்பட்டது", "2/8 அச்சு".

## 9. Round 3 — Putra Sarpa and Marana Karaka Sthana cards (2026-10-06, evening)

**Owner report (screenshot, Astrologer view):** Putra Sarpa names the 5th house
as the cause *and* a strong 5th lord as the cure, which is confusing. The Marana
Karaka Sthana explanation is not meaningful.

**Diagnosis.** Neither card said anything about the chart in front of it.

| Card line | What it said | Why |
|---|---|---|
| Putra Sarpa trigger | "The 5th house or its lord is afflicted by the nodes or malefics" | One marker (`fifth_afflicted`) for three different triggers; no planet named |
| Putra Sarpa "now" | "reduced by a strong 5th lord **or** Jupiter in a kendra" | Static text listed both protections, whichever one applied. A chart guarded only by Jupiter was told its 5th lord was strong |
| Putra Sarpa "What this is" | "afflicted by Rahu/Ketu **or malefics**" | The engine checks Rahu, Ketu and Saturn only |
| MKS trigger | "mercury in marana karaka sthana" | No label existed; the raw token was printed |
| MKS "now" | "The impact varies with your current Dasha period" | No entry; generic fallback, never said whose dasha |
| MKS affect / reduce / remedies / guide | absent | No entries at all |

**Why a guard didn't catch the raw MKS token.** `tests/test_marker_label_coverage.py`
scanned f-strings with a character class that allowed `{}` but not `.` or `(`,
so every expression placeholder (`{planet.lower()}`) was skipped. The guard was
green while these markers rendered raw. Widening it surfaced 13 more raw-token
leaks on yoga cards: Pancha Mahapurusha dignity, Vipareetha lords, Parivartana
exchange and sub-type, Kartari hemming, Bhagya Support, Kala Sarpa naga variant,
and the Phaladeepika Lakshmi form. All are now labelled. Run with the new rules
removed, the guard fails on exactly the Putra Sarpa / MKS tokens.

**Built.**
- Putra Sarpa markers name their facts: `fifth_house_has_<p>`,
  `fifth_lord_<lord>_joined_by_<p>`, `jupiter_joined_by_<node>`; protections
  `fifth_lord_<lord>_strong`, `jupiter_in_kendra_house_<n>`. Old keys keep their
  web labels for older payloads.
- "In your chart" (`meaningTa/En`) for Putra Sarpa, built from those facts and
  split into two sides: *What disturbs your 5th house (Simmam): Rahu in the
  house itself. What guards it: Jupiter … in your 4th house (a kendra).* When
  the same lord sits on both sides it is named once ("the strength of that lord").
- The general line now explains the two sides once. The "now" line says
  "reduced by the protective factors above". The "softens" sentence was removed
  from "How this may affect you", where it read as a claim about this chart.
- MKS "In your chart": per planet, what it signifies, the house and rasi, why
  that house is hard for it, the dasha/bhukti to watch, and dignity or Jupiter's
  aspect if present. Saturn's ayush karakatva is left out on purpose, so the
  card never reads as a life-span claim.
- MKS gets a general line (the full table), "How this may affect you", "How to
  reduce", a "now" line naming the planet whose dasha it waits on, and
  planet-specific remedies (weekday + navagraha sthalam) via `getDoshamRemedies`
  (used by the full panel, Life Areas and Explore).

**Doctrine-relevant bug fixes (code defects, not rulings).**
- Thulam lagna: Saturn is the 5th lord, and "Saturn beside the 5th lord"
  compared Saturn with itself, so **every Thulam-lagna chart** got Putra Sarpa.
  A planet no longer joins itself.
- A chart missing Jupiter and a node compared `None == None` and formed the
  dosham; a missing Jupiter defaulted to house 1 and counted as a kendra
  protection. Both are now guarded on presence.

**O-32 — ruled the same evening; see §10.**

**Tests.** `tests/test_dosham_chart_reading.py` (11, synthetic charts);
`web/components/dosham-chart-specific-copy.test.tsx` (7). Targeted backend run:
342 passed; web: tsc clean, 195 component tests passed.

**Blind spots.** Not seen rendered on the real app (item 1 is still open), and
no Tamil-mode visual pass was done. The new Tamil (Putra Sarpa reading, MKS
reading, 15 marker labels, navagraha remedy lines, naga labels) is unread by a
native reader. Mars's `mars_own_sign` / `mars_exaltation` labels carry
Sevvai wording ("dosham intensity reduced") when Ruchaka Yoga emits the same
keys. Pre-existing, noted here only. (The repeated why/bullets item is fixed in §10.)

## 10. Round 4 — O-32 ruling and "say it once" inside a card (2026-10-06, night)

**O-32, owner ruling (from a practitioner's written answer):** Thulam lagna,
Sani in Kumbam is the 5th lord, in its own sign, and the yogakaraka. The
placement is recorded but does not form Putra Sarpa. Any independent affliction
(a node in the 5th or beside Guru) still forms it. This is the one case, not a
blanket own-sign rule.
- **Engine:** `o32_putra_sarpa_thulam_sani = "neutralized"` (`"ordinary"`
  restores the plain reading), with admin flag, §16 row (DOCTRINE_DECISIONS
  v2.2) and sign-off packet §B line.
- **Card:** chip **Neutralized** (`செயல்படவில்லை`), not "Absent". The why
  line says the placement is there but does not act as a dosham. Bullets show
  the placement and its reason. "Now" says no remedy is needed.
- **Sweep:** 3,000 random charts: 11 neutralized; 5 more Thulam/Kumbam
  charts still form it from a node.

**A defect found on the way.** Pitru, Kalathra and Sevvai sent protective
factors on charts where the dosham never formed: 2,105 of 3,000 random charts.
The web card read that as *"This combination did form in your chart, and was
then annulled"*, a false statement on every absent Kalathra or Pitru card that
had a strong 7th lord or Sun. An unformed dosham now sends none. The only
exceptions are O-32's recorded reason and Sevvai's non-default O-18
`full_cancellation`, which really un-forms a formed dosham. Ratcheted by
`test_unformed_doshams_carry_no_protective_factors`.

**Said once per card (owner: "if content repeats in the same section, remove it").**

| Repeat | Fix |
|---|---|
| "Why your chart has this" sentence restated the bullets printed under it (every dosham and yoga card: Nova, Classic, both Explore pages) | `buildWhyText(..., { listsShown })` keeps only what bullets cannot say: formed-and-annulled, "not enough on its own", dasha activation. Empty ⇒ not rendered |
| Putra Sarpa / MKS: "In your chart" names every marker, then the bullets named them again | `doshamMeaningCoversMarkers` hides those bullets on those two doshams |
| "Reduced, not erased" on the chip, "What remains", the why sentence and the "Now" line | Kept on the chip and "What remains"; removed from the why sentence and from the Sevvai, Rahu–Ketu, Pitru, Badhaka, Kalathra and Putra Sarpa "Now" lines, which keep only their action |
| Putra Sarpa medical note in Affect, Reduce, Remedies, Now and "In your chart" | Disclaimer in Affect; the action in Reduce only |
| Putra Sarpa "watch the 5th-lord/Jupiter dasha" vs "In your chart": dasha of the afflictor | Reduce now points to the dasha named in "In your chart" |
| MKS "slowly / dasha / care" in What-is, In-your-chart, Affect, Reduce and Now | What-is: definition; In your chart: the fact; Affect: effects; Reduce: steps; Now: whether this is the period |
| Explore: hero prose and "What it actually means" printed the same `whatText` | Second copy removed (yogam card dropped; dosham card keeps only the reading guidance, retitled "How to read this") |
| Explore dosham: two "In your chart" headings on one page | The "Now" card is retitled "What this means for you now" |
| Mobile Dosha Check: engine description above `explanationWhat` / "In your chart" saying the same thing | Description shown only for Kalathra and Sevvai (it adds the 7th lord's house / what Mars's effect depends on), or when nothing else is there |

**Tests:** backend 21 in `test_dosham_chart_reading.py` (O-32 ×4, unformed
sweep), targeted run 655 + admin 12 passed. Web
`dosham-chart-specific-copy.test.tsx` 11 (incl. a rendered card: each fact
once), 740 component tests, web + mobile tsc clean.

**Blind spot:** the rendered "said once" test was not run against the old code
(reasoned: the old card printed "Planet Positions" and "Triggered because", and
both are asserted absent). Still nothing seen on the real app, in either language.
New Tamil (unreviewed): the O-32 why line and chip, "இதை எப்படிப் படிப்பது", the
rewritten Now lines.
