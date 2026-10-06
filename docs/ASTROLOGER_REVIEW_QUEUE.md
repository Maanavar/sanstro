# Astrologer Review Queue

Standing list of shipped behaviors and copy that need a practicing
thirukanitham jyotishi's sign-off. Items here are **live in the product**
unless noted; do not change their behavior in code ahead of the review —
implement whatever the reviewer decides, mirroring copy in `ta` and `en`.

Add new items to the top with a date. When an item is reviewed, record the
decision inline and move it to "Resolved".

## Open

### 2026-10-06 · DD-17 dosham reckoning (O-26 to O-29, residual) — applied; sign-off wanted

Prompted by a practitioner's written review of one real chart, passed on by the
owner. Applied as engine defaults by Claude acting for the owner (DOCTRINE_DECISIONS
v2.1, DD-17; packet §B). Each has an option that restores v2.0. Frequencies in
`docs/DOSHAM_DD17_FREQUENCY_REPORT_2026-10-06.md`. **A practicing jyotishi should
confirm or correct:**

- **O-26:** Sevvai's "Mars's sign lord in a kendra/trikona from Mars" mitigation
  is **off**. No printed source is known; it came from our design note.
- **O-27:** a 7th lord in own/exaltation sign or a kendra/trikona, unafflicted and
  not combust, protects against Sevvai. Before, only the four dual-sign lagnas'
  7th lords could ever qualify.
- **O-28 / O-29:** on the Rahu–Ketu 2/8 axis a dignified 2nd lord (own/exalted,
  unafflicted) now protects the 2nd house; one Guru aspect is no longer counted
  twice. The 8th side's broader "strong lord" test is deliberately not reused
  for the 2nd — measured, it doubled nivarthi.
- **Residual:** every mitigated dosham shows "Mitigated · mild/moderate residual",
  never a bare "Mitigated" or "Low intensity". Moderate only when a strong Lagna
  formation was offset by exactly the threshold. **Confirm the threshold rule.**
- **Context shown, never graded:** Sevvai not counted from the Lagna; the
  Rahu–Ketu axis not repeating from the Moon/Venus; the axis repeating (or not)
  in the Navamsa.
- **New Tamil, unread by a native reader:** the residual chips
  (*நிவர்த்தி · லேசான/மிதமான மீதத் தாக்கம்*, *மீதத் தாக்கம்: …*), the
  before/after line, the four context notes, the eight node-in-house meanings
  (`RK_NODE_HOUSE_MEANING`), the 2nd-house support line, the "Counted from"
  rows (*{குறிப்பு} ({ராசி}): செவ்வாய் N-ஆம் வீட்டில் — தோஷ வீடு*), and the
  rewritten Sevvai / Rahu–Ketu / Pitru / Badhaka / Kalathra / Putra Sarpa
  "mitigated" lines.

### 2026-10-05 · O-25 and Tamil T1–T4 — AI review, applied; human sign-off still wanted

The owner passed on a review signed "ChatGPT — GPT-5.6 Sol, OpenAI". It is
applied as owner rulings (DOCTRINE_DECISIONS v2.0, DD-16 D4; packet §D). **A
practicing jyotishi and a named native Tamil reader should still confirm:**

- **O-25:** "practical impact" is not classical. It is `structural_reach`, a
  Vinaadi tie-break: houses ruled ×100 → houses occupied ×10 → +1 for Lagna or
  Lagna-lord involvement. "Lasting gifts" no longer rank by the running dasa;
  "Running now" lists only activated yogas. **Confirm the formula itself.** The
  review named its ingredients but no weights; the ×100/×10 ordering is ours.
- **ADHI_RAJA_GRADE:** out of both Top-3 lists until Saravali is verified.
- **Tamil:** planets take அமைந்துள்ளது, never உள்ளார், in the reading; ஆடை in
  all remedies; the நீசபங்க நிபந்தனை sentence; the qualified-Raja line (and
  `raja_grade_mixed`, by analogy); the 8th-support line.
- **Open, not swept:** about 40 older strings elsewhere give a graha -ார்.
  Bhava Palan's *ஆதரவாக உள்ளார்* was a reviewed choice, so a human reader
  decides whether the app-wide rule overrides it.

### 2026-10-03 · v1.8 second-round owner rulings — confirm or correct

Live as engine defaults; an owner decision, not a practitioner signature. The
packet shows both A2 items as "applied" with confirm/correct boxes.

- **Kadagam Guru (6+9):** re-admitted to Raja Yoga as a named exception to the
  moolatrikona test. It carries its 6th, so every pair it forms (with Sevvai,
  Chandran or Sukran) grades MIXED, never FULL. No other excluded lord moves.
  Tier C lineage choice: the owner's sources were web summaries.
- **O-24 ruled `mixed`:** kendradhipati grades a lord, it never removes Raja Yoga
  eligibility; pair vetoes still apply (Mithunam Guru + Sani stays vetoed).
  Dhanus Surya + Budhan stays yoga-capable. The verse was read in an online
  transcription; the printed edition is still to be checked.
- **Tamil, owner-supplied wording (packet §D):** the one-condition card is now
  **நீசபங்கம்**; `ADHI_RAJA_GRADE` → அதி யோகம் — முழுப் பலம் உறுதியாகவில்லை;
  new copy for `nb_self_reference`, `raja_grade_mixed_kendradhipati`, the
  source-vetoed pair, Gaja Kesari base, BHAGYA_SUPPORT and the O-2/O-11/O-17
  markers. Four deliberate deviations are listed in §D.
- **Reader review, same day: "approve with minor copy corrections" — applied**
  (packet §D lists them; combustion verb now guarded by a web test). The review
  does not name its reader, so §D's signature is blank. **Still wanted: a named
  native reader's sign-off on the rendered cards in Tamil mode**. ~~Three
  leftovers~~: settled by the 2026-10-05 review (entry above).
- ~~**Owner question:** should ADHI_RAJA_GRADE be hidden from consumers?~~
  Ruled 2026-10-05: kept out of the Top-3 lists, still in the Astrologer view.

### 2026-10-03 · v1.7 owner rulings on the packet — confirm or correct

_Kadagam Guru, O-24 and the Tamil wording are superseded by v1.8 above._

The owner ruled on the v1.5 packet ("approve with corrections"). The rulings
are live as engine defaults; they are an owner decision, not a practitioner
signature. The regenerated
[`DOCTRINE_V15_PRACTITIONER_SIGNOFF_PACKET.md`](DOCTRINE_V15_PRACTITIONER_SIGNOFF_PACKET.md)
shows each as "applied" with a confirm/correct box.

- **O-9 matrix:** Sun/Moon 8th lordship carries no blemish
  (`EIGHTH_LUMINARY_EXEMPT`); `KENDRA_LORD` plus a kendradhipati benefic/malefic
  modifier; the lagna lord overrides the 8th. Still unsigned.
- **A2:** moolatrikona co-lord test extended to the 3rd/11th — also excludes
  Mesham Sani, Simmam Sukran and **Kumbam Sevvai** (the last was not in the
  owner's review; it follows from the same rule). Three BPHS 34 pairs vetoed.
  **Kadagam Guru: known dissent — rule on it consciously.**
- **O-24 (new, open):** natural benefics owning two kendras (Guru for
  Mithunam/Kanni, Budhan for Dhanusu/Meenam) take part at a MIXED grade.
  Excluding them would also remove Dhanus Surya + Budhan; check that verse.
- **O-13:** Neecha Bhanga Raja Yoga needs two or more conditions; one is
  நீச நிவர்த்தி. **O-18:** strong mitigation. **O-21:** Budhan's self-reference
  counts, tagged, never Strong alone. **O-2** disabled, **O-11** off, **O-17**
  literal, **O-22** Moon counts when conjunct/opposite.
- **Calibration:** the re-run (`DOCTRINE_V17_FREQUENCY_REPORT_2026-10-03.md`)
  shows Raja Yoga still on 76.4% of charts — the doctrine fixes do not make it
  rare; the all-pairs sweep (`YOG-RY-01`) does that.
- **Tamil ruled by the owner, unread by a native speaker:** அஸ்தங்கம் for all
  combustion (அஸ்தமனம் = sunset only); Budha-Aditya expanded copy;
  `ADHI_RAJA_GRADE` → ராஜ நிலைக்கு வாய்ப்புள்ள அதி யோக அமைப்பு;
  `strong_eighth_lord_or_benefic_on_eighth` → 8-ஆம் வீடு ஆதரவு பெறுகிறது…;
  new `NEECHA_NIVARTHI`, `nb_self_reference`, `raja_grade_mixed_kendradhipati`,
  `raja_pair_source_vetoed_<a>_<b>` copy.

### 2026-10-02 · v1.6 review fixes — O-21 to O-23 and corrected Tamil

_Superseded in part by the 2026-10-03 owner rulings above (O-21, O-22, O-23,
the E8 question and the combustion term); kept for the record._

- **O-21:** Budhan rules Kanni, its own exaltation sign. Read literally, NB-b
  lets a debilitated Budhan in a kendra cancel its own debility — the NB-e rule
  DD-09 deleted. Default now skips the self-reference. Confirm.
- **O-22:** may a waxing Chandran be the benefic that supports Guru in strict
  Gaja Kesari, when Chandran is itself one of the yoga's two grahas? Default:
  yes (literal).
- **O-23:** the 2026-09-23 moolatrikona test excludes Kadagam Guru (the 9th
  lord) and Sani, Kanni Sani (the 5th lord) and Kumbam Budhan (the 5th lord)
  from every Raja Yoga. Keep, or let lordship decide and grade them MIXED?
  The packet's new section A2 shows the whole participation table.
- **O-9 addition:** the E8 status on Dhanusu-Moon and Magaram-Sun — does the
  Sun/Moon exemption from 8th-lordship blemish apply?
- **Calibration:** the packet's section B2 lists the frequencies (Raja Yoga on
  ~4 charts in 5; Neecha Bhanga on ~98% of debilitated charts) for a ruling
  rather than silent tuning.
- **Tamil corrected, still unread by a native speaker:**
  `strong_eighth_lord_or_benefic_on_eighth` (said a benefic *afflicts* the
  8th — now "உள்ளது / பார்க்கிறது"); `ADHI_RAJA_GRADE` label and marker (Tamil
  dropped "candidate" — now "பரிசீலனையில்"; the "Saravali verse not located"
  research note is no longer shown to users); `bright_rays_engine_non_combust`;
  Gaja Kesari base copy ("அமைப்பு", and "சந்திரனிலிருந்து" for the malformed
  "சந்திரத்திலிருந்து"). Combustion term: அஸ்தங்கம் (yoga cards) vs அஸ்தமனம்
  (Budha-Aditya, panchangam) — choose one.
- **Engine fix (no ruling needed, Tier C):** Rahu–Ketu now raises the grade per
  aggravation up to Strong *before* subtracting mitigations, as DD-03's
  "+1 / −1 grade" reads; previously surplus aggravations made nivarthi
  unreachable on every chart with two or more aggravations.

### 2026-10-02 - v1.5 executable alternatives and one signable packet

- **Review packet:** [`DOCTRINE_V15_PRACTITIONER_SIGNOFF_PACKET.md`](DOCTRINE_V15_PRACTITIONER_SIGNOFF_PACKET.md) is generated from the live matrix. It contains the complete O-9 84-cell table, row and C12/E8 focus checks, the separate node-rule attestation, signature fields, the section 18 physical-edition ledger and the native-Tamil checklist. Generation is not sign-off; `MATRIX_SIGNED_OFF` remains `False`.
- **O-2:** the engine can accept a practitioner-named node-dignity lineage plus explicit Rahu/Ketu rasi tuples. It is disabled and deliberately contains no Vinaadi-chosen sign list.
- **O-11:** the separate retrograde/debilitated rule is implemented but off. Confirm adoption and whether non-combust is an acceptable provisional proxy for "bright rays".
- **O-17:** choose literal/unlabelled or `BHAGYA_SUPPORT` for dignified but incomplete Lakshmi cases.
- **O-18:** choose shipped full cancellation or DD-06-style strong mitigation for the Mesham/Viruchigam exception.
- **Native Tamil added in this pass:** O-2's lineage marker; O-11's card and four condition markers; O-17's missing-kendra, weak-lagna-lord and dignified-support wording. These join every earlier unreviewed string below.
- **Physical citations:** none of the section 18 Tier A/B claims was closed in this pass. The Phaladeepika 7.26-30 map remains online-only until a physical edition is recorded.


### 2026-10-01 · DD-01/DD-08 P2 labels, Adhi O-20, and Sevvai residual copy

- **O-20:** confirm whether a poorna drishti from a malefic onto a forming Adhi
  benefic disqualifies the candidate raja-grade form. The live default counts
  malefic occupants in the 6th/7th/8th from Chandran only.
- **Source checks still open:** BPHS 36.3–4 numbering for strict Gaja Kesari;
  Saravali/Brihat Jataka commentary wording for the Adhi raja-grade candidate.
- **New Tamil awaiting native review:** the strict/base Gaja Kesari labels and
  descriptions, the Adhi base/raja-grade labels and descriptions, and the
  `mars_combust` / `mars_joined_saturn_or_rahu` consumer marker labels.

### 2026-10-01 · DOCTRINE_DECISIONS v1.3 implemented — O-1 to O-20 await ruling

- **Where:** `docs/DOCTRINE_DECISIONS_V1.2.md` §16 (open items) and §19
  (implementation status). That file is the record; this entry only points
  at it. Every default below is live, and each one with a switch is an admin
  flag (`doctrine_o<n>_…`). A ruling is a code default change plus one line
  in §16 (v1.6: runtime overrides are refused with more than one worker).
- **Raised by implementation, not by the audit (O-12 to O-19):**
  1. **O-12** — two neecha-bhanga conditions the engine shipped are not in
     DD-09's Phaladeepika table; switched off until a verse is cited.
  2. **O-13** — confirm each of Phaladeepika 7.26–30 states a raja-yoga result.
  3. **O-14** — the 2026-09-23 moolatrikona ruling and O-4 disagree on three
     12th co-lords (Rishabam Sevvai, Thulam Budhan, Viruchigam Sukran).
  4. **O-15** — Raja Yoga link: mutual aspect only, or a one-way special aspect?
  5. **O-16** — Chandran as a secondary activator (DD-15) vs "Chandran is the
     reference, not a trigger" (2026-09-23).
  6. **O-17** — two Lakshmi-adjacent cases have no label.
  7. **O-18** — the Mesham/Viruchigam Sevvai exemption still cancels outright.
  8. **O-19** — when the relevant lord is Chandran, "kendra from the Moon" is
     always true, so every debilitated Sevvai (and Guru) is cancelled.
- **New Tamil, written without review:** the Rahu–Ketu, neecha-bhanga
  (per-verse) and Raja-grade marker labels in
  `web/components/dashboard-yoga-dosham-panel.tsx`; the DD-15 activation states
  in `packages/shared/src/yogaDisplay.ts` (`yogaActivationLabel`); `பாக்கிய
  ஆதரவு` (Fortune support); the one Sevvai sentence for every chart (DD-05).

### 2026-10-01 · Bell notification panel — new Tamil copy (language only)

- **Where:** `web/components/dashboard-hero.tsx` (bell trigger + popover,
  inline `lang === "ta"` strings) and `web/lib/i18n.ts`
  (`notif_update_failed`). Commits `63bf3a8` (panel redesign) and `54368ae`
  (mark-read failure toast).
- **New Tamil, written without review:**

  | Where it shows | English | Tamil as shipped |
  |---|---|---|
  | Unread count chip beside the panel title | `5 new` | `5 புதியவை` |
  | Bell button's spoken name (screen readers only, `aria-label`) | `Notifications, 5 new` | `அறிவிப்புகள், 5 புதியவை` |
  | Heading over the day's alerts, selected date = today | `For today` | `இன்றைக்கு` |
  | Same heading, any other selected date | `For 15 Jan 2026` | `15 ஜனவரி 2026 அன்று` |
  | Footer button to notification settings | `Settings` | `அமைப்புகள்` |
  | Toast when marking read fails | `Couldn't update your notifications. Please try again.` | `அறிவிப்புகளைப் புதுப்பிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.` |

- **Reused, not new** (already live on `/notifications`): the section heading
  `அறிவிப்பு பெட்டி` (Inbox) and the screen-reader-only `புதியது` (New) on each
  unread row.
- **Specific calls worth checking:**
  1. **`புதியவை` is used for every count, including 1.** It renders as
     `1 புதியவை`. Should a count of one read `1 புதியது`, or is the plural
     acceptable in a count chip? The full inbox page uses singular `புதியது`
     as a per-row badge, so the two surfaces currently differ.
  2. **`இன்றைக்கு` vs `இன்று`.** The heading means "these alerts are for
     today" (it follows the date picker, not the clock). `இன்று` alone was
     avoided because it reads as a time label rather than a scope. The obvious
     longer form, `இன்றைய அறிவிப்புகள்`, was avoided because it repeats the
     panel title `அறிவிப்புகள்` directly above it.
  3. **`{date} அன்று`** for "For {date}": does `அன்று` carry "for that day"
     here, or does it read only as "on that day"?
  4. **Bare `அமைப்புகள்`** in the footer, beside `முழு அறிவிப்பு பெட்டி`. The
     full page says `அறிவிப்பு அமைப்புகள்`; the shorter form was chosen to fit
     one line at 375px. Is the bare word clear enough in context?
  5. **Toast register:** `மீண்டும் முயற்சிக்கவும்` (polite imperative). The
     full inbox page's retry button uses `மீண்டும் முயற்சி`. Is one register
     wanted across both?
- **Doctrine:** none — this is a language review only.
- **Status:** committed on `harden/production-readiness`, not yet pushed.
  Locked down by `web/components/dashboard-hero.test.tsx` (Tamil test asserts
  the bell name, `இன்றைக்கு` and `அறிவிப்பு பெட்டி` verbatim) and
  `web/hooks/useNotificationInbox.test.tsx` (asserts the Tamil toast
  verbatim), so a wording change should update those too.

### 2026-09-23 · Which dasha levels "activate" a yoga? We chose Maha + Antar — live after this change

- **Where:** `app/services/_chart_build.py` (`_build_yoga_dosham_insights`),
  `app/calculations/yoga_activation.py`, `app/calculations/_yoga_detect.py`
  (Amala, Adhi); web surfaces through `packages/shared/src/yogaDisplay.ts`.
- **What was wrong:** the chart decided "is this yoga running" twice. The
  detectors used Maha + Antar + **Pratyantar** lords. The 0–100 activation score
  used Maha + Antar only. A reported chart (Suriya mahadasha, Ketu bhukti, Guru
  pratyantar) showed Gaja Kesari, Hamsa and Vipareetha Raja Yoga as **Active**
  with the **dormant** score 34/100 beside each. Amala and Adhi also set their
  flag from functional nature (does a benefic here lord a trikona?), which reads
  no dasha at all.
- **What we chose:** one verdict, Maha + Antar, the definition the activation
  score already documented. The score now takes the published flag instead of
  re-deciding it. Amala and Adhi stay dormant, because neither has a ruled key
  graha. This is a lineage choice, not a claim that Pratyantar timing is invalid.
  Pratyantar lasts weeks, and a lifelong-yoga chip that flips on and off every
  few weeks read as noise.
- **Astrologer answers, 2026-09-23:**
  1. **Antaram (Pratyantar) refines timing but never triggers on its own.**
     Proposed tiers: Strong when both Dasha and Bhukti lords form the yoga;
     Moderate when one does. An Antaram lord that also forms it marks a "peak
     window" inside an already-active period. Antaram alone does not activate.
  2. **Raja Yoga activates on the lords that form each instance.** Not a fixed
     list, and not every kendra/trikona lord in the chart.
  3. **Amala:** the benefics occupying the 10th activate it, never the 10th
     lord. **Adhi:** the benefics in the 6th/7th/8th from Chandran activate it;
     Chandran is the reference point, not a participant.
  4. **Principle:** triggers are computed at detection and stored on the
     instance, never keyed on the yoga's name.
- **Built from these answers:** 1 (Antaram alone never activates; this was
  already true after the fix above). 2, 3 and 4 via the existing
  `YogaResult.key_grahas`: Raja Yoga (link and parivartana forms) records its
  own pair, Amala its 10th-house benefics, Adhi its 6/7/8 benefics.
  Tests are in `tests/test_yoga_activation_agreement.py`.
- **Second ruling pass (same day), all built:**
  - **Strong tier:** +10 (`BOTH_LORDS_STEP`), capped at 100, added only when
    the Dasha and Bhukti lords formed the *same* instance. Moderate is the
    existing score, unchanged. The largest activated score before the step is
    85, so +10 cannot swamp the other components.
  - **Peak window:** nullable `peakWindow {start, end, antaramLord}` on each
    yoga, in the backend and the shared type. Web and mobile do not render it
    yet.
  - **Yogakaraka:** a separate `YOGAKARAKA_RAJA_YOGA` (`YOG-RY-04`), gated on
    not debilitated / not combust / not in 6-8-12. The existing Raja Yoga is
    untouched. *Gate superseded the same day; see the Tamil review below.*
  - **Adhi:** YOG-AD-01 stands (at least two benefics). The single-benefic
    suggestion is withdrawn. No code change; Chandran only in v1.
  - **Dusthana dual lords:** decided by moolatrikona sign
    (`raja_lord_qualifies`). This disqualifies Rishabha-Sevvai,
    Kataka-Guru/Sani, Kanni-Sani, Thulam-Budhan, Vrischika-Sukran and
    Kumbha-Budhan.
  - **Rahu/Ketu:** recorded as supporting when they share a sign with a
    forming lord; they never form a Raja Yoga and never activate one.
  - **Amala:** Guru/Sukran/Budhan only (Budhan only if no malefic shares its
    sign), Chandran excluded. Malefic drishti lowers strength one rung and
    never cancels.
  - Three golden-chart cells moved, all explained in
    `tests/test_drishti_yoga_golden.py`. No Raja Yoga moved on those charts.
- **Amendment, same day (all built):**
  1. **Lagna lord over moolatrikona.** Precedence is lagna ownership first,
     then moolatrikona. The lagna lord always qualifies as both kendra and
     trikona lord; the moolatrikona test applies only to non-lagna lords with a
     dusthana. This was already the behaviour; it is now stated as the rule.
  2. **Node drishti in Amala** follows the project's existing node-aspect
     doctrine (`CORE-10`, Rahu/Ketu 5/7/9), so it counts. It only ever
     weakens; it never removes the yoga. On the reported chart Amala went
     STRONG → PARTIAL (still present), as intended.
  3. **Suriya does not afflict Budhan.** For Amala, Budhan loses benefic
     status only when Sani, Sevvai, Rahu or Ketu shares its sign. Rahu/Ketu stay
     on that list because of point 2.
  4. **Own bhukti is Moderate.** Strong needs two distinct forming planets as
     Dasha and Bhukti lords, so a single-former yoga (including the yogakaraka
     type) never reaches Strong.
  5. **One afflicting-malefic set for Amala.** Budhan's same-sign test and the
     10th-house aspect test both read `AMALA_AFFLICTING_MALEFICS`, so the two
     cannot drift apart again. **Suriya is out** of both: it is the karaka of
     the 10th, gains dig bala there, and is only a mild malefic. **Mandhi:** the
     astrologer excludes upagrahas from aspect tests *unless the project grants
     Mandhi drishti elsewhere*, in which case stay consistent. We do (`EC-A21`,
     the 7th aspect in `aspects.ASPECT_HOUSES`), so Mandhi is **in**, for both
     tests (owner decision). The set is Sani, Sevvai, Rahu, Ketu and Mandhi.
     A weakening flag, never a cancellation. Tested in
     `test_amala_reads_one_afflictor_set_for_both_tests`.
- **Native Tamil review, 2026-09-23 (all built):**
  - **Yogakaraka doctrine (owner decision on the reviewer's point):** ownership
    establishes the yoga; debility, combustion and a 6/8/12 placement lower it
    one rung (Strong → Moderate, however many apply) and never remove it. This
    **supersedes the first-pass dignity gate** above. Each affliction is a
    `<graha>_yogakaraka_<affliction>` marker in `conditions_met`, rendered as
    "…; யோகபலம் சற்று குறையலாம், யோகம் நீங்காது". The three golden charts did
    not move. *Astrologer: please confirm, since this reverses your gate.*
    **→ Ruled 2026-10-01 (see Resolved):** ownership-only stands; the marker
    now reads "…; யோககாரகத் தன்மை நீங்காது; பலன் வெளிப்படும் வலிமை குறையலாம்",
    and the card is renamed "Yogakaraka planet", not a Raja Yoga.
  - **Names:** யோககாரக ராஜயோகம் (ராஜயோகம் as one word). *Superseded
    2026-10-01 for this card: யோககாரக கிரகம் / "Yogakaraka planet".* Every yoga name in
    Tamil mode is now in Tamil script, from the registry's `name_ta`
    (`packages/shared/src/yogaDisplay.ts`), instead of English.
  - **Strength words:** வலுவான / மிதமான / **லேசான** (was மென்மையான, which
    reads as a "gentle" dosham). உண்டு stays for the chip.
  - **Copy:** the reviewer's wording for the effect line (softer, traditional
    tone), the description (லக்னத்திற்கு), the "what this is" line, both marker
    lines (பார்க்கிறது-style neutral verb, -ஆம்), and the four Life Areas
    lines (செயல்படும் over தூண்டும்; ஜாதகப் பகுதி over ஜாதகப் பார்வை).
  - **Em-dash:** not a Tamil-language rule; the rewritten lines use a colon or
    semicolon instead. No global sweep.
- **Status:** live. Locked by `tests/test_yoga_activation_agreement.py`, which
  sweeps 36 synthetic charts and fails if any yoga reads active beside a dormant
  score. Before the fix, 1 of the first 2 charts already failed.
- **Display change in the same pass:** "Active" now means dasha timing only.
  A dosham's presence reads Present / உண்டு (the reviewed yoga chip word). Its
  natal strength reads Strong / Moderate / Mild on every surface. The Life Areas
  card lists only what the running dasha lights. Its old copy also claimed
  transits, which the engine never reads (2026-09-11 ruling). Its Tamil was
  reviewed 2026-09-23 (above).

### 2026-09-23 · Personal palan bilingual content matrix — NOT LIVE; blocks §5

- **Where:** the proposed chart-personalised daily palan in
  `HOME_CALENDAR_CHARTS_PROPOSALS_2026-09-22.md` §5. The self-contained review
  packet is `PERSONAL_PALAN_CONTENT_REVIEW_2026-09-23.md`.
- **What is decided:** Moon-relative gochara is primary; tara bala modifies it;
  Chandrashtama leads when present; the hero remains the single verdict source.
  Lucky aspects are omitted until a sourced classical mapping passes review,
  and Kuligai uses the existing activity polarity table rather than prose.
- **What is needed:** astrologer review of the area × Moon-house matrix, tara
  modifiers and precedence rules, followed by a native Tamil review of every
  production line. Health and remedies have explicit safety limits in the
  packet.
- **Status:** not built and not live. Do not add the API field or UI until both
  sign-off rows in the packet are complete.

### 2026-09-23 · Calendar Durmuhurtham and contextual Kuligai Tamil — live after this change

- **Where:** `web/components/dashboard-calendar-tab-nova.tsx`, plus the
  Durmuhurtham scope labels on web marketing and mobile panchangam surfaces.
- **Doctrine already ruled:** Durmuhurtham is an avoid period only for
  auspicious work/new beginnings; Kuligai is conditional and is suitable for
  activities intended to repeat, continue or grow. Neither is a general
  whole-day prohibition.
- **Review needed:** native Tamil idiom/register for the new scope notes. The
  rule itself is closed by R7/R8; this is a language review, not permission to
  turn Kuligai back into a generic avoid period.

### 2026-09-04 · Does Abhijit muhurtham override Rahu Kalam and the other kalas?

- **Where:** `web/components/dashboard-today-tab-nova.tsx` (`abhijitOverlapNote`,
  and the Abhijit row of the hero rail's "Key timings for today" card),
  `web/lib/today-windows.ts` (`clearSegments`), `web/lib/dashboard-i18n.ts`
  (`TODAY_TIMINGS.abhijitOverlap`, `abhijitFullyCovered`). The note first
  shipped in the "Other traditional timings" disclosure; that panel was removed
  later the same day (owner call) and the note moved to the card that replaced
  it, unchanged.
- **What happens:** Abhijit is a fixed ~48-minute slot around solar noon; the
  three avoid-kalas move by weekday. Friday's Rahu Kalam is the 4th of eight
  day-parts, which on most Fridays straddles late morning into midday — so it
  clips the head of Abhijit on a large fraction of Fridays, **structurally, not
  as an edge case**. On 2026-09-04 the overlap was 24 of Abhijit's 49 minutes
  (Abhijit 11:55–12:44, Rahu Kalam 10:48–12:19). Sunday's 8th part and
  Saturday's 3rd collide on other days.
- **Why it needs a ruling:** the panel described Abhijit as "counted auspicious
  for anyone, whatever their chart", with no qualifier, sitting directly under a
  card whose entire argument is *"Clear of Rahu Kalam, Yamagandam and Kuligai."*
  A reader who took both at face value got two contradictory instructions from
  one panel. The classical position is genuinely contested — many traditions
  hold that Abhijit overrides the kalas, and many Tamil families do not. Either
  ruling is defensible; **silence was not**, because the app had already
  committed to the opposite doctrine one card away.
- **What ships now (interim, and deliberately not a new doctrine call):** when
  Abhijit intersects a kala, the row appends the overlap and states the app's
  *already-implemented* position — the one the owner ruled on 2026-08-23, that a
  window overlapping Rahu Kalam / Yamagandam / Kuligai is never promoted — and
  names the clear remainder: "Overlaps Rahu Kalam here, and this app treats the
  avoid periods as binding — so the clear part is 12:19 pm–12:44 pm." It renders
  only on the days the two actually collide. Nothing about the recommendation
  itself changed.
- **The question for the reviewer:** is "kalas bind, Abhijit yields" the right
  reading for this app, or should Abhijit be treated as overriding them (in
  which case the copy, and possibly `pickRecommendedWindow`'s veto, both change)?
  A third option — say the two disagree and let the reader choose — is available
  but is the one posture the rest of this surface deliberately avoids.
- **Status:** live in the product. Locked down by
  `web/lib/today-windows.test.ts` (`clearSegments`) and
  `web/components/dashboard-today-tab-nova.test.tsx` ("says when Abhijit runs
  into an avoid period", plus "stays quiet on the days Abhijit is clear of all
  three kalas"), so a change here should update those too. The Tamil
  for both overlap strings is new and unreviewed.
- **Also new Tamil in the same pass** (CLAUDE.md new-Tamil rule):
  `EMOTIONAL_WEATHER_LABELS` (20 chip labels), `EMOTIONAL_WEATHER`,
  `TODAY_HERO`, and the `TODAY_TIMINGS` window-phase copy. (The group headings
  and the Nalla Neram "recommended" tag went out with the disclosure and no
  longer need review.)

### 2026-08-24 · New Tamil copy from the UX-blindspot defect pass

- **Where:** `web/lib/login-i18n.ts` (~55 auth strings), `web/lib/glossary.ts`
  (`GLOSSARY_LABELS`, 45 term names), `web/components/advanced-astrology-gate.tsx`
  (`classical-detail` title + blurb), `web/lib/i18n.ts` (`chart_selected_box`,
  `tab_explore_back`).
- **What needs a native eye:** all of it is new Tamil written without review, per
  the CLAUDE.md new-Tamil rule. Three specific calls worth checking:
  1. **`tab_explore`** — the English tab was renamed Explore → **Understand**;
     the Tamil was deliberately left as the shipped **ஆய்வு**, because picking its
     replacement is a native-speaker call and ஆய்வு ("study") is not obviously
     what "Understand" means here. `tab_explore_back` was written as
     **ஆய்வுக்குத் திரும்பு** to agree with it; if ஆய்வு changes, that
     changes with it (the two sit adjacent in `i18n.ts` for exactly this reason).
     **→ Ruled 2026-10-01:** **விளக்கம்**, since the tab is explanatory. Built:
     `tab_explore`, `tab_explore_back` (விளக்கத்திற்குத் திரும்பு) and the tab's
     own kicker, which said ஆராயுங்கள்.
  2. **`GLOSSARY_LABELS` follows almanac usage over Sanskrit** — ஏழரைச் சனி for
     Sade Sati, எமகண்டம் for Yamagandam, கிரகநகர்வு for Gochar. Worth
     confirming ஷட்பலம், திருக் பலம் and காரகாம்சம் read naturally.
     **→ Gochar ruled 2026-10-01: கோச்சாரம் over கிரகநகர்வு**, applied product-wide
     (see Resolved). ஷட்பலம், திருக் பலம், காரகாம்சம் and call 3 are still open.
  3. **`yoga` vs `yogam`** now carry disambiguators in both languages
     (யோகம் (ஜாதக அமைப்பு) vs யோகம் (பஞ்சாங்க அங்கம்)) because both render in
     one search-result list where a bare repeated "யோகம்" would be useless.
- **Doctrine check, not just language:** the `classical-detail` gate blurb now
  asserts that vargas and shadbala are *standard* Thirukanitham the reading
  already leans on — as against the alternate dasha systems (Yogini,
  Ashtottari, Kalachakra), which the other gate still calls experimental and
  score-irrelevant. Please confirm that split is how you would put it.
- **Status:** live in the product. Locked down by
  `web/components/advanced-astrology-gate.test.tsx`, `web/lib/glossary.test.ts`
  and `web/app/login/page.test.tsx`, so a change here should update those too.

### 2026-08-10 · Nethiram cutoff formula contradicts a live case — reopens the 2026-07-16 confirmation

- **Where:** `app/calculations/panchangam.py` (`_nethiram_value`, `NETHIRAM_LABELS`).
- **What the formula gives today (2026-08-10, Chennai):** sunrise Sun nakshatra
  Ayilyam (9), sunrise Moon nakshatra Thiruvathirai (6), ring distance 3 →
  `_nethiram_value` returns 1, printed as ஒரு கண் (One eye).
- **Astrologer says:** today should read குருடு (Blind), i.e. distance 3 should
  fall in the blind bucket, not the one-eye bucket.
- **Why not just patch the cutoff:** the current table (blind: distance ≤2,
  one eye: ≤8, two eyes: ≤13) was itself marked CONFIRMED by the astrologer on
  2026-07-16 (see Resolved, 2026-07-14 entry). A single data point doesn't
  determine the correct replacement — shifting the blind cutoff to ≤3 fits
  this one case but so would other tables (e.g. a directional/inclusive star
  count instead of the current symmetric ring distance, which the 2026-07
  audit already flagged as suspect by analogy to `_dinam_score`). Needs the
  actual printed rule or table from the astrologer, not a guess against one
  example.
- **Do not change `_nethiram_value`/`NETHIRAM_LABELS` until that's supplied.**

### 2026-07-21 · Nokku (மேல்/கீழ்/சம நோக்கு) nakshatra classification — NEW, live on the Calendar tab

- **Where:** `web/lib/nokku.ts` (`URDHVAMUKHA_NUMBERS` / `ADHOMUKHA_NUMBERS` /
  `TIRYANGMUKHA_NUMBERS`), rendered in the Calendar tab's "Day at a glance" card.
- **What shipped:** the day's nakshatra facing, shown as மேல் நோக்கு நாள் /
  கீழ் நோக்கு நாள் / சம நோக்கு நாள் (romanised, not translated, in English).
  Derived client-side from the nakshatra already on the wire — no engine change.
- **Rollover bug fixed 2026-08-10:** the display used to follow the *active*
  (post-rollover) nakshatra, so the facing flipped mid-day when the star
  changed. Astrologer flagged a live case — 2026-08-10, Thiruvathirai the
  sunrise star (Mel Nokku Naal), rolled to Punarpoosam at 12:27pm IST, and
  the card started reading Sama Nokku Naal, which is wrong. Nokku is a
  whole-day classification pinned to the sunrise nakshatra; it now stays
  fixed for the full civil day (`dashboard-calendar-tab-nova.tsx`,
  `web/lib/nokku.ts` doc comment).
- **Needs a jyotishi's call on:** the **27-row table itself**. It is the standard
  classical partition (ūrdhvamukha / adhomukha / tiryaṅmukha, 9 each) and has NOT
  been checked against the reference almanac this project follows. Published Tamil
  almanacs are known to differ on a small number of placements. A printed
  panchangam page listing the three groups would settle it outright.
  - The table is currently self-consistent: a unit test asserts the three groups
    partition exactly 1–27 with no gaps or duplicates, and that every *Uthira-*
    star faces up while every *Poora-* star faces down. Those guards will hold
    through any correction — only the group membership needs the reviewer.
- **Also worth a call:** the one-line "good for" meanings (currently building/study
  for mel, foundations/wells for keel, travel/trade for samam). These render only
  as a hover tooltip today, so they are low-exposure, but they are doctrine.
- **Not yet on mobile.** Web-only for now; `mobile/app/(tabs)/panchangam` has no
  equivalent. Worth porting once the table is signed off rather than before.

### Carried over from earlier sessions (pointers, not restated here)

- Reasoning layer PR-4 + PR-5 specialist sign-off
  (`docs/REASONING_LAYER_UPGRADE_PLAN.md` §15.3, §16).
- A-04 (former AGENT_WORKBOARD) astrologer review.
- T9 (Ayurdaya/longevity engine, `docs/THIRUKANITHAM_DEGREE_ADHIPATHI_AUDIT_2026-07.md`)
  — **split 2026-09-11, and only half of it is still a queue item:**
  - **Balarishta: ❌ CLOSED, permanent refusal.** Ruled 2026-09-11 — a child-
    mortality reading with no responsible consumer form. The gate was lifted and
    the answer was no. Not awaiting review; do not re-queue it.
  - **Ayurdaya bands (Alpayu / Madhyayu / Purnayu) for adult charts: still open.**
    A new module, not a fix — explicitly gated "requires an astrologer worked
    example before coding," same discipline as Jeevan/Nethiram and Kalachakra.
    Do not start without that worked example.
- T10 remainder: the Jeevan/Nethiram half of T10 is **closed** (see Resolved,
  2026-07-16). What's still open is the full 189-cell Amirdhadhi Yogam table
  (182 of 189 cells unverified, only the 7 Amrita-Siddhi anchors checked) —
  needs a printed panchangam appendix to cross-check against; guessing the
  remaining cells would mean presenting fabricated correspondences as fact.
- Kalachakra dasha shipped experimental without astrologer check (see memory
  `project_kalachakra_dasha_status_2026-07`).

### Corrected 2026-07-16 (stale entries removed)

- ~~Propensity suites: 40 signature definitions need native-Tamil/jyotishi
  post-hoc review~~ — **already done.** `docs/ASTROLOGER_LIVE_SESSION_BACKLOG_2026-07.md`
  records a full native-Tamil review pass: 40 propensity cards (14 corrections
  applied, golden-locked), plus 86 age_phase en/ta pairs (21 corrections
  applied) — both 2026-07-14/15, tests green. This bullet had gone stale after
  that session closed it; removing rather than re-carrying it forward.

## Resolved

### 2026-10-01 · Astrologer rulings on six queued questions — ✅ built

1. **Yogakaraka affliction wording.** "யோகம் நீங்காது" said the *yoga* stands,
   which overclaims. Now: "‹graha› ‹affliction›; யோககாரகத் தன்மை நீங்காது; பலன்
   வெளிப்படும் வலிமை குறையலாம்" (en: "it stays the yogakaraka, but its results
   may come through less strongly"). Same idea in the card's "what this is" and
   Moderate-strength lines. `web/components/dashboard-yoga-dosham-panel.tsx`.
2. **Understand tab: விளக்கம்**, replacing ஆய்வு, because the tab explains the
   ideas behind a reading. `tab_explore`, `tab_explore_back` and the tab
   kicker (`web/lib/i18n.ts`, `dashboard-explore-tab-nova.tsx`).
3. **கோச்சாரம் over கிரகநகர்வு.** Applied as a vocabulary rule, not only to the
   glossary label: the codebase carried three spellings (கிரகநகர்வு, கோசாரம்,
   கோச்சாரம்), now one. 39 files across `app/`, `web/` and one test fixture,
   inflected by grammar: கோச்சார before a noun (கோச்சார ஆதரவு), கோச்சாரம்
   standing alone, கோச்சாரமும், கோச்சாரங்கள், கோச்சாரத்தை. The render-time
   normaliser in `web/lib/tamil-astro.ts` used to rewrite கோசாரம் →
   கிரகநகர்வு; it now rewrites கோசார → கோச்சார. *Native reader, please spot-check
   the attributive forms; we did not add sandhi doubling (கோச்சாரப் …) except
   where a string already had it.*
4. **Sign edge: keep max(sandhi, Baladi), labelled `[PRODUCT]`.** No scoring
   change. The comment on `SANDHI_PENALTY` in `chart_strength.py` and
   DOCTRINE_DECISIONS_V1 §15 now say this is Vinaadi's rule for not counting one
   degree fact twice, not a classical combination rule.
5. **Neecha Bhanga on a yogakaraka: option B. And it is a yogakaraka *planet*,
   not a Raja Yoga.**
   - A debility cancelled by `neecha_bhanga_cancelled` (the same predicate as
     the Neecha Bhanga card and the +14 strength term) no longer costs the
     rung. It is recorded as `<graha>_yogakaraka_neecha_bhanga` and shown as a
     protective factor. Combustion and a 6/8/12 placement still lower it. On the
     witness chart (Rishabha lagna, Sani neecha in the 12th, Suriya in a kendra)
     the card stays **Moderate**, now because of the 12th house only. A
     yogakaraka whose only affliction is a cancelled debility reads **Strong**.
   - The card is renamed **Yogakaraka planet / யோககாரக கிரகம்** everywhere it is
     displayed (`yoga_rules.py` `YOG-RY-04`, `packages/shared/src/yogaDisplay.ts`,
     detector descriptions, card copy). Ownership makes a graha the yogakaraka;
     it does not by itself form a Raja Yoga. **Not changed:** the wire key
     `YOGAKARAKA_RAJA_YOGA`, kept as a stable API identifier so no client or
     test fixture breaks. Renaming the key is a separate, coordinated change if
     wanted.
   - Tests: `test_neecha_bhanga_removes_only_the_debility_cost`, the golden
     `test_weakened_yogakaraka_is_lowered_not_cancelled`, and
     `web/components/yogakaraka-weakness-display.test.tsx`.
6. **D9 debility penalty stays; the vargottama exemption is removed.**
   Vargottama and debility are now two separate rows. A graha vargottama in its
   own neecha sign takes the D9 penalty (−5) *and* keeps its +4 vargottama term,
   and its Kala Bala D9 tier stays −1 instead of being lifted to +1. Net about −6
   points for those grahas only; no other chart moves. The planet-card prose
   now says both facts ("vargottama makes the placement consistent; it does not
   lift the debility") instead of reading it as a boost.
   `CHART_CALCULATION_VERSION` → v1.5. Tests:
   `test_neecha_vargottama_charges_the_d9_penalty_and_keeps_the_vargottama_bonus`,
   `test_neecha_vargottama_states_both_facts_and_is_not_a_boost`.

**New Tamil written in this pass, not yet read by a native reader:** the
Neecha-Bhanga yogakaraka line, the rewritten yogakaraka "what this is" and
Moderate lines, the neecha-vargottama planet-card lines
(`VARGOTTAMA_NEECHA_MEANING`, the navamsa facet, the synthesis closing), and
விளக்கத்திற்குத் திரும்பு.

The two queue entries this answers in full are kept below as they were asked.

### 2026-09-23 · Does Neecha Bhanga restore a debilitated Yogakaraka's rung? — ✅ RULED 2026-10-01: option B (above)

- **Where:** `app/calculations/_yoga_detect.py` (`detect_raja_yogakaraka`,
  `detect_neecha_bhanga`); witness chart `yogakaraka_neecha` in
  `tests/test_drishti_yoga_golden.py`.
- **What happens today:** Rishabha lagna, Sani neecha in Mesham (also the 12th).
  Suriya, who is exalted in Mesham, sits in a kendra, so `NEECHA_BHANGA_RAJA_YOGA`
  is present. The Yogakaraka card still reads **Moderate (PARTIAL)**: the
  2026-09-23 ownership ruling lowers one rung for debility and does not look at
  bhanga. The two cards are computed independently.
- **Question:** when the yogakaraka's own debility is cancelled by a valid neecha
  bhanga, should the debility still cost the rung? Options:
  (a) no change: debility lowers, bhanga is its own yoga (today);
  (b) a valid bhanga removes the debility affliction only, so the dusthana
  placement alone still lowers it (on the witness chart it stays PARTIAL);
  (c) a valid bhanga restores STRONG outright.
- **Why we did not pick:** it is a lineage choice with direct effect on the
  strength shown, and the ruling of the day did not address it.

### 2026-07-18 · D9 debilitation penalty weighting — ✅ RULED 2026-10-01: penalty stays, vargottama exemption removed (above)

- **Where:** `app/calculations/chart_strength.py::_d9_dignity_tier`,
  `D9_DEBILITATION_PENALTY`, and its two call sites (Kala Bala `d9_bonus`,
  the Shadbala D9 branch in `compute_natal_planet_score`).
- **Was:** Navamsa dignity was read one-sidedly — own-sign/exaltation in D9
  granted a bonus, but debilitation in D9 carried no penalty at all. A planet
  exalted in Rasi and neecha in Navamsa therefore scored identically to one
  with a neutral D9, which is the single case the D9 chart is most relied on
  to catch.
- **Fixed:** the tier is now signed (+1/0/-1). The bonus stays gated on a
  neutral natal dignity (D9 as tie-breaker); the penalty is deliberately
  ungated, because the case needing correction is a Rasi-exalted planet.
  Vargottama is exempt from the penalty — the sign repeating across D1/D9 is
  read as stabilising even in a debilitation sign.
- **Needs a jyotishi's call on:** the **magnitude**. Bonus and penalty are
  currently symmetric at 5.0 on the 0-100 composite scale, which nets about
  -6 points for a Rasi-exalted/D9-neecha planet. That is the conservative
  default, not a sourced weighting — classical usage treats "exalted in name,
  powerless in Navamsa" as a severe loss of promise, so the penalty may
  warrant being heavier than the bonus. Also open: whether the vargottama
  exemption should be full (current) or partial.
- **Pinned by:** `tests/test_calculations.py::test_d9_debilitation_penalises_a_rasi_exalted_planet`
  and `::test_d9_debilitation_is_exempt_when_vargottama` — both assert
  *direction* only, so a magnitude change will not break them.

### 2026-09-23 · Sign-edge grahas: four questions, plus new Tamil copy — ✅ RULED 2026-09-23, built

- **Where:** `app/calculations/chart_strength.py` (`_avastha_multiplier`, the
  `sandhi` −8 near L1011); `app/services/chart_explanation_service.py`
  (`_sandhi_meaning`, `_avastha_facet_value`); `app/calculations/lagna_edge.py`.
- **What is now live:**
  1. Every graha card for the seven grahas has a new **avastha (Baladi)** line
     under strength. It gives the stage, the 6° band and, for even signs, the
     reversal. So Saturn at 0.94° Meenam reads **Mrita**, not the "Bala/infant"
     that popular write-ups give.
  2. The **sign-edge (sandhi)** line now names the neighbouring sign and the
     direction of travel. Retrograde grahas and the nodes are treated as moving
     backwards. The line also says that house and lordship are still read fully
     from the occupied sign. In other words, we do **not** carry a 0°-graha's
     results over to the previous house.
  3. A **Lagna-edge note** appears when the Lagna would change sign within
     max(5 min, the recorded birth-time confidence). It shows on the chart
     explanation's basics tab and in the Jadhagam report.
- **Questions:**
  - **Q1: do the two penalties stack?** A graha at ≤1° or ≥29° takes the flat
    −8 sandhi term. It *also* sits in the first or last 6° Baladi band, where
    the avastha multiplier is at its lowest (0.25 or 0.50). Both come from the
    same degree fact. Options: (a) both apply (today); (b) inside the ±1° band,
    sandhi replaces the avastha scaling; (c) drop the flat −8 and let avastha
    carry the edge. We did not pick, because each option moves real scores.
  - **Q2: do Rahu and Ketu get Baladi avastha?** The scorer applies the
    multiplier to the nodes today. The new *narration* does not show a stage for
    them, because the scheme is stated for the seven grahas. Please confirm one
    way or the other; the scorer and the text should agree.
  - **Q3: is the carry-over wording right for our lineage?** Is "house and
    lordship are read fully from the occupied sign" acceptable in a whole-sign
    rasi chart, or does the lineage give a 0°/29° graha any bhava-sandhi
    (split-house) reading?
  - **Q4: is the 5-minute Lagna window right?** It is a [PRODUCT] threshold.
    Should it be wider, or tied to rectification practice?
- **New Tamil copy to check:** the five `_BALADI_TEXT` stage lines, the
  odd/even rule sentence, the directional sandhi sentence and the Lagna-edge
  note. They use பால / குமார / யுவ / விருத்த / மிருத அவஸ்தை.
- **Decision (astrologer, 2026-09-23), all built. Recorded as DOCTRINE_DECISIONS_V1 §15:**
  - **Q1: never both; the larger applies.** Built literally. *Follow-up:* the
    ruling also said this equals "sandhi replaces Baladi". That holds only
    while the Baladi cost is ≤ 8. It is not true for dignity ≥ ~60 in a Mrita
    zone (an exalted graha at 0.4° of an even sign costs 13.5). We kept "the
    larger". Please confirm. **→ Confirmed 2026-10-01: keep max(sandhi,
    Baladi), and label it a `[PRODUCT]` scoring rule** (see Resolved).
  - **Q2: the text is right; the scorer now drops Baladi for Rahu/Ketu**
    (multiplier 1.0, label NEUTRAL). Jagradadi was not ruled on and is unchanged.
  - **Q3: the astrologer's wording is adopted** ("only from ‹sign›… never
    moves it into ‹neighbour›"); "fully" is removed. It matches
    DOCTRINE_DECISIONS_V1 §6 (whole-sign). "PR-A2" is the astrologer's label;
    there is no such change in this repo.
  - **Q4: recompute plus bisection, with firm ±5 / soft ±15 min tiers and a
    D9 Lagna check at ±5.** *Follow-up (product):* measured on 400 synthetic
    births, the D9 note fires on **76%** of charts (Lagna: firm 8%, soft 19%).
    It is rendered today. The owner decides whether it stays on the basics
    tab or moves next to the D9 chart.

### 2026-08-18 · Kandaka Sani — which reference, and which house set? (`GO-10`) — ✅ RESOLVED 2026-08-19

- **Ruled:** Saturn in the **4th, 7th or 10th from the Janma Rasi**, and Kandaka
  is a **layered** name rather than a separate axis. Recorded `[TAMIL_LINEAGE]`.
- **The sharpest form of the question got the uncomfortable answer.** We counted
  from the Lagna precisely so that Kandaka would never overlap the Moon-reference
  cycles. That non-overlap was an engineering preference presented as a modelling
  virtue. The overlap is the rule: Saturn in the 4th from the Moon is Ardhashtama
  Sani *and* Kandaka Sani, and the reader is now told both. The 1st is no longer
  Kandaka — that position belongs to Janma Sani.
- **Blast radius, as predicted:** most people's Lagna and Moon sign differ, so
  the old and new references select nearly disjoint populations. This changed who
  is told they are under Kandaka Sani more than any other item in the pass.
- **Scored once, named twice.** The `daily_guidance_service` guard that skips the
  Kandaka penalty when a Moon cycle is already active — written to dodge an
  overlap that could not previously occur — is what keeps this from
  double-counting now that it can.
- **Where:** `transits.classify_kandaka_cycle` plus six call sites, labels on
  five surfaces, and the `GO-10` appendix row. `career_service`'s Kandaka call
  turned out to be a **no-op** (`house_from_lagna == 10` already implied Kandaka
  active) and was removed rather than repointed, which would have silently
  narrowed the career warning.
- **Full ruling:** `docs/DOCTRINE_RULINGS_2026-08-19.md` §A-1.

### 2026-08-18 · Kala Sarpa arc definition — four sub-questions (`DOS-02`) — ✅ RESOLVED 2026-08-19

- **Ruled**, on all four: (1) a graha exactly on a node qualifies but the
  boundary is **disclosed** in `conditions_met`, not silently resolved; (2) the
  Lagna is **not** required inside the arc — seven grahas only; (3) direction is
  **recorded, never used to disqualify**; (4) **no degree tolerance** at the node
  ends, and the arc is now judged on **actual longitude** rather than whole-sign.
- **One amendment.** The proposal to name the reverse enclosure "Kala Amrita"
  and read it differently was **not** adopted as settled Tamil doctrine. It is a
  recognisable modern-school convention, so both directions form the yoga and
  the `ANULOMA`/`VILOMA` pattern is reported for the caller to interpret.
- **Whole-sign survives only as a fallback** for callers that carry rasi without
  degrees, and `conditions_met` now says which test was applied.
- **Full ruling:** `docs/DOCTRINE_RULINGS_2026-08-19.md` §A-4.


### 2026-07-13 · UPACHAYA grouped with MARAKA/DUSTHANA copy (DASH-10.2) — ✅ RESOLVED 2026-07-16

- **Where:** `web/components/dashboard-today-glance-nova.tsx`
  (`dashaSentiment`).
- **Was:** UPACHAYA house activations read "testing period · go gently",
  the same copy as MARAKA/DUSTHANA.
- **Decision:** chosen option from the reviewer list — separate "grows with
  effort" phrasing for UPACHAYA. Upachaya houses (3/6/10/11) classically
  improve with effort/time; they aren't a caution category the way
  Maraka/Dusthana are, and grouping them together miscalibrated the tone.
- **Resolved by:** Claude (full ownership grant, 2026-07-16). New
  `_NATURE_GROWTH` branch with en "grows with effort" / new `ta`
  "முயற்சியால் வளரும் காலம்" (flagged pending native review, matching this
  repo's convention for new Tamil copy), reusing the existing neutral
  `--color-mid` token rather than `--color-low` (which reads as a warning) or
  a newly invented token. `docs/dashboard-i18n-catalog.json` regenerated via
  `npm run i18n:dashboard:json`. `dashboard-today-glance-nova.test.tsx`
  (5 tests, extended) and `tsc`/`eslint` on touched files green.

### 2026-07-13 · Abhijit demotion in the Today hero (DASH-10.1) — ✅ RESOLVED 2026-07-16

- **Where:** `web/lib/today-windows.ts` (`pickFeaturedWindow`, new
  `findSecondaryAbhijitWindow`), `web/components/dashboard-today-tab-nova.tsx`.
- **Was:** the hero's featured best-window never showed the Abhijit window
  at all when any PERSONAL_HORA window existed for the day.
- **Decision:** keep the personal-hora-first hero (more actionable, varies
  day to day — the reason DASH-01 built this in the first place), but never
  let Abhijit disappear outright, since it's a universally auspicious daily
  muhurtham in Tamil panchangam tradition, independent of the native's chart.
  Chosen option from the reviewer list: show it as a secondary line rather
  than keep hiding it or promote it back to featured status.
- **Resolved by:** Claude (full ownership grant, 2026-07-16). New
  `findSecondaryAbhijitWindow` surfaces the Abhijit window whenever one
  exists and isn't already the featured pick; rendered as a small muted line
  under the "Best window" tile in the Today hero. `web/lib/today-windows.test.ts`
  (11 tests, extended) and `tsc`/`eslint` on the touched files green.

### 2026-07-14 · Sevvai "extended_manglik" mode has no verified differentiation (audit A-5) — ✅ RESOLVED 2026-07-16

- **Where:** `app/calculations/_yoga_helpers.py` (`TAMIL_SEVVAI_HOUSES`,
  formerly also `EXTENDED_SEVVAI_HOUSES`), `app/calculations/_yoga_dosham.py`
  (`detect_sevvai_dosham`), `app/calculations/yogas.py`
  (`detect_yogas_and_doshams`), `tests/test_yogas.py`.
- **Was:** both constants were the identical set `{1,2,4,7,8,12}` behind a
  `sevvai_mode` parameter defaulting to `"tamil_standard"`.
- **Decision:** remove the mode rather than guess a differentiated house list.
  `TAMIL_SEVVAI_HOUSES` is confirmed correct (house 1 included in the standard
  set); no authentic source differentiates an "extended" variant; and a grep
  across `app/api/`, `packages/shared/src/api/`, `web/`, `mobile/` confirmed
  `sevvai_mode`/`extended_manglik` was unreachable from every real surface —
  exercised only by direct unit-test calls. Removing a parameter nobody could
  actually set is safe and honest; inventing a house list to keep the choice
  alive would not be.
- **Resolved by:** Claude (full ownership grant, 2026-07-16). Deleted
  `EXTENDED_SEVVAI_HOUSES` and the `sevvai_mode` parameter/threading entirely;
  `tests/test_yogas.py::test_sevvai_standard_mode_treats_first_house_as_candidate`
  (renamed from the old `_extended_mode_` test) still locks house-1 coverage
  under the single remaining mode. `tests/test_yogas.py` (39 tests) green.

### 2026-07-14 · Nethiram/Jeevan display removed pending verification (audit A-3/C-2) — ✅ RESOLVED 2026-07-16 (A-3 + C-2)

- **Where:** `app/calculations/panchangam.py` (`_jeevan_value`/`_nethiram_value`);
  display in `web/app/tools/daily-panchangam-planner/PanchangamTool.tsx`,
  `web/app/panchangam/[date]/page.tsx`, `web/components/dashboard-calendar-tab-nova.tsx`.
- **Behavior:** the formula was self-flagged unverified in code (symmetric ring
  distance, inconsistent with this codebase's other directional tara counts)
  and rendered harsh Tamil ("குருடு" = blind) on a daily-visible field.
  Display was removed rather than guess-fixed; backend computation was
  untouched so no API contract broke.
- **A-3 resolution (2026-07-16):** the project's astrologer confirmed the
  values; the owner authorised restoring the display to all three surfaces.
  The formula and thresholds are **unchanged**, so the confirmation covers them
  as written. Doctrine §7 updated to match.
- **⚠ Provenance gap — do not lose this:** the specific printed sources were
  **not recorded in-repo**, so Doctrine §7's original "two independent printed
  panchangams" criterion cannot be reproduced from this repository. Status is
  *confirmed-by-review*, not *independently verified*. A future reviewer
  re-opening this must re-obtain the sources rather than infer them from code.
- **C-2 resolution (2026-07-16):** the labels stay the classical terms
  verbatim — Nethiram "குருடு" (Blind), Jeevan "இல்லை" (None) — in both `ta`
  and `en`. These are standard Jeevan-Nethiram muhurtham-grid vocabulary,
  printed exactly this way in real Tamil almanacs; a reader who knows the
  panchangam expects to see this word, and paraphrasing it would be a
  fidelity break unrelated to the formula question A-3 already settled. The
  actual gap was context, not word choice: a printed almanac page carries
  dozens of technical terms so the reader supplies context automatically,
  but a single daily-briefing card doesn't. Fix: the previously-inert
  "Throughout today" hint/sub slot on all three surfaces now carries a
  one-line gloss (`nethiram_jeevan_hint` in `web/lib/i18n.ts`) framing the
  field as a muhurtham-suitability marker, not a personal reading — the
  classical term itself is untouched.
- **Resolved by:** Claude (acting on full ownership granted by the user for
  this specific copy-vs-authenticity call, 2026-07-16). The new gloss copy
  is self-declared first-draft, same status as other recent `ta` additions —
  queued for the C-4 native-Tamil review pass, not a substitute for it.

### 2026-07-14 · Functional-nature Kendra/Maraka contradiction (audit A-2)

- **Where:** `app/calculations/functional_nature.py` (`derive_functional_nature`,
  `FUNCTIONAL_NATURE_TABLE[12]["MERCURY"]`, `FUNCTIONAL_NATURE_TABLE[9]["MERCURY"]`).
- **Was:** a planet owning 7th+10th kept `KENDRA`, but a planet owning 4th+7th
  degraded to `MARAKA` — producing two contradictions (Kanni Jupiter vs Meenam
  Mercury at {4,7}; Mithunam Jupiter vs Dhanusu Mercury at {7,10}).
- **Decision:** Kendradhipati Dosha doctrine does not subdivide by which two
  kendras a natural benefic owns — pure-kendra ownership (any of 4th/7th/10th,
  no trikona/dusthana) uniformly settles to `KENDRA` (neutral). Corroborated
  against Tamil/Vedic astrology references identifying Gemini/Virgo/
  Sagittarius/Pisces (Mithunam/Kanni/Dhanusu/Meenam) as the textbook case of
  Jupiter/Mercury owning two kendras. All four cells now read `KENDRA`.
- **Resolved by:** Claude (acting on full ownership granted by the user for
  spec-vs-code doctrine forks, 2026-07-14), with web-sourced corroboration.
  Locked down by `tests/test_functional_nature_derivation.py::test_pure_kendra_ownership_is_consistent_regardless_of_which_kendras`.

### 2026-07-14 · Stree Dirgham pass threshold (audit A-1)

- **Where:** `app/calculations/porutham.py::_stree_dirgha_score` vs
  `docs/Jothidam_AI_Formula_Engine_Specification_v1_Thirukanitham_2026.md` §11.6.
- **Was:** code passed at count ≥8 (1-indexed); the frozen spec said `>= 14`.
- **Decision:** Tamil marriage-matching references describe a two-tier
  reading — ≥14 (13+) is *Uthamam* (excellence tier), ≥8 (7+) is already
  *Madhyamam* and an accepted match. The spec had transcribed the excellence
  threshold as the pass/fail bar. Code's ≥8 was kept; the spec doc corrected
  to match.
- **Resolved by:** Claude (full ownership grant, 2026-07-14), with web-sourced
  corroboration. Existing `tests/test_porutham.py::test_stree_dirgha_boundary`
  already pinned the ≥8 boundary.
