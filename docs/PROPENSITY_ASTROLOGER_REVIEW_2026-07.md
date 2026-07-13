# "Chances & Cautions" — Astrologer + Native-Tamil Review Checklist

**Purpose.** This is the review packet for the `propensity_insights` feature
(23 cards, flag OFF, code committed `7ce60d1`). Nothing here is user-facing
yet — it only ships once you sign off. Companion to
`docs/PREDICTION_ONTOLOGY_EXPANSION_PLAN_2026-07.md` (the original plan);
this doc is the point-by-point checklist against the code as actually built.

**How to give feedback.** For each card below there's a `factor key` in
brackets next to every line (e.g. `[venus_strong]`) — that's the identifier
in the code, so you can just say "change `venus_strong`'s Tamil to ___" or
"drop `service_signature`, that's not a valid rule" and I'll find it exactly.
You don't need to touch code or files — just mark up this doc or reply
point-by-point and I'll apply the changes.

**What to check per card:**
1. Is the house/karaka/varga combination the right classical technique for
   this topic?
2. Is the support/caution *logic* sound (the actual planetary condition
   being tested), not just the wording?
3. Is the Tamil natural, correctly registered (not stilted/machine-sounding),
   and non-fatalistic?
4. Does the English mean the same thing as the Tamil (not a looser paraphrase)?
5. Is anything classically important missing for this topic?

---

## How the grading works (context, not something to change)

- **CHANCE** cards grade `STRONG → PROMISING → MIXED → LIMITED → QUIET`.
  **CAUTION** cards grade `STEADY → WATCHFUL → EXTRA_CARE → QUIET`. Never a
  percentage — ordinal bands only.
- **QUIET = the chart is silent**, never a denial. A card with no signal
  says nothing rather than manufacturing a verdict.
- Support factors count as `pro`, caution factors count as `con`. The level
  is decided by the pro/con balance (see `propensity_service._grade_chance` /
  `_grade_caution` if you want the exact thresholds).
- A "varga vote" (e.g. "D24 confirms/softens") only ever *strengthens or
  softens* a reading that already fired from the main (Rasi) chart — it can
  never manufacture a signal on its own. This is deliberate (doctrine: a
  varga corroborates, it doesn't invent).
- Every card also carries a **what-helps** guidance block (non-astrological,
  practical) and, for sensitive topics, a **disclaimer**.

---

## ⚠️ Flagged design decisions — please rule on these explicitly

These are calls I made acting as astrologer where I'm genuinely unsure I
got the classical answer right, or where I had to work around a technical
constraint. Please give an explicit yes/no on each, separate from the
per-card review below.

1. **`career_mode` has no D10 (Dasamsa) vote.** I judged that Dasamsa
   refines career *strength/status*, not the enterprise-vs-salaried
   *direction* this card reads, and that mapping D10 placements onto that
   axis would be a modern heuristic rather than a classical rule. Do you
   agree D10 shouldn't vote here, or is there a real classical technique I'm
   missing?
2. **Moon's Moolatrikona zone is set to 4°-30° Taurus** in this codebase
   (`chart_strength.py`). Some sources (BPHS) give 3°-30°. This affects
   every card that checks Moon's dignity (`emotional_load`, `loneliness`,
   `swabhava_profile`, etc.). Which convention should this project use?
3. **Rahu and Ketu have no exaltation/own-sign/moolatrikona data at all** in
   this codebase — `is_strong("RAHU")` can never be true via dignity, only
   via a raw strength-score threshold. Several traditions treat Rahu as
   functionally exalted in Taurus/Gemini (and Ketu in Scorpio/Sagittarius).
   Should nodal dignity be added, or is "no dignity system for nodes" the
   right call for this project?
4. **`marriage_harmony` and `business_partnership_fit` read the Rasi chart
   only — no D9 (Navamsa) vote**, even though D9 is the classical marriage
   varga. Reason: this engine's varga data only carries D2/D3/D4/D7/D10/D12/
   D16/D20/D24/D27/D30/D40/D45/D60; D9 is stored per-planet without a
   Lagna-relative house frame, so it can't safely feed the same
   varga-corroboration machinery the other cards use. `business_partnership_fit`
   gets a D10 vote instead (career/status varga, since it's reading the
   *commercial* half of the 7th house). Acceptable, or is this important
   enough to warrant a bigger fix?
5. **`litigation_season`, `debt_watch`, `competitive_edge` (the Bhava-6
   suite) have no varga vote at all** — D6 (Shashthamsa) is not computed
   anywhere in this codebase. Same question: acceptable as Rasi-only for
   now, or a priority to add?
6. **Wealth suite's D2 (Hora) reading uses the BPHS "Ubhayachara" rule**:
   benefics in Chandra Hora (Cancer) + malefics in Surya Hora (Leo) is
   auspicious for wealth, the reverse is not. Applied to `income_growth` and
   `savings_capacity` (not `inheritance_lean`, which reads the 8th house
   instead — different question). Is this the Hora rule you'd want applied,
   or a different one?
7. **`spouse_nature` (a row in the original plan) was folded into
   `marriage_harmony`** rather than shipped as its own card, because reading
   "the 7th lord's placement quality" twice under two different names felt
   redundant. Should spouse-nature be its own separate card after all?
8. **`accident_care` uses 8th house + Mars** as its signature (no dedicated
   row existed in the original plan grid) — the classical accident/injury
   pairing. Confirm this is the right house/karaka pairing.
9. **`debt_watch` treats a *strong* 6th lord as a support factor** (capacity
   to clear debts), not a caution — i.e. Bhava 6 is read as "debt AND the
   ability to overcome it," so strength is protective. Please confirm this
   is the correct classical reading and not backwards.
10. **Timing windows (`timing_window_start/end`) only narrow the *currently
    running* antardasha** — they never search forward for a future bhukti.
    So a topic with real classical support but whose favorable window hasn't
    arrived yet will show no dates, not a "wait until X" date range. Fine as
    a v1 limitation, or does it need fixing before this can go live?

---

## Card-by-card checklist

### Love & Relationships

#### 1. `love` — CHANCE · age 15+ · timing: 5th house / Venus
*Support*
- `[venus_strong]` சுக்கிரன் வலுவாக உள்ளார் — அன்பு ஈர்ப்பு நல்லது. / Venus is strong — natural warmth and attraction. *(Venus well-dignified, not combust)*
- `[fifth_benefic]` 5ஆம் வீட்டில் (காதல்) சுப கிரக பார்வை. / The 5th house of romance receives benefic support.
- `[seventh_benefic]` 7ஆம் வீடு (துணை) சுப அமைப்பில். / The 7th house of partnership is benefic-supported.
- `[fifth_lord_placed]` 5ஆம் அதிபதி நல்ல நிலையில். / The 5th lord is well placed for romance. *(5th lord in house 1/5/7/11)*

*Caution*
- `[venus_weak]` சுக்கிரன் பலவீனம் — உறவில் பொறுமை தேவை. / Venus is weak — relationships need patience. *(debilitated or combust)*
- `[seventh_lord_dusthana]` 7ஆம் அதிபதி சிரமமான வீட்டில். / The 7th lord sits in a difficult house. *(6/8/12)*

*What helps:* உங்கள் மதிப்புகளை பகிரும் இடங்களில் கலந்துகொள்ளுங்கள். / Spend time in settings that share your values — connection follows. · அவசரப்படாமல் நம்பிக்கையை வளர்க்கவும். / Let trust build without rushing.

**Comments:**

---

#### 2. `relationship_strain` — CAUTION · age 15+ · disclaimer
*Caution*
- `[mars_venus]` செவ்வாய்-சுக்கிரன் சேர்க்கை — உணர்ச்சி வேகம். / Mars with Venus can bring heat and friction in bonds.
- `[seventh_malefic]` 7ஆம் வீட்டில் பாபக் கிரகம் — உறவில் அழுத்தம். / A malefic in the 7th can strain partnership. *(malefic or Rahu in 7th)*
- `[saturn_seventh]` சனி பார்வை 7ல் — தூரம்/தாமதம் உணர்வு. / Saturn touching the 7th can bring distance or coolness.
- `[kalathra]` களத்திர தோஷம் செயலில். / Kalathra dosham is active.

*Support*
- `[seventh_benefic_mit]` 7ல் சுப பார்வை — சமநிலை காக்கும். / Benefic support to the 7th steadies the bond.
- `[jupiter_guards]` குரு பார்வை 7ல் — முதிர்ச்சி காக்கும். / Jupiter's grace on the 7th protects with maturity.

*Disclaimer:* இது ஒரு போக்கு மட்டுமே — உங்கள் தேர்வுகளே உறவை வடிவமைக்கும். / This is a tendency only — your choices shape the bond far more.

*What helps:* கடினமான காலத்தில் திறந்த, அமைதியான உரையாடலைத் தேர்ந்தெடுங்கள். / In strained seasons choose open, calm conversation over reaction. · தேவைப்பட்டால் இணை ஆலோசனை பயனளிக்கும். / Couples counselling helps when things feel stuck.

**Comments:**

---

### Marriage & Partnership *(new category — see flag #4 and #7 above)*

#### 3. `marriage_harmony` — CHANCE · age 18+
*Support*
- `[jupiter_blesses]` குரு 7ஆம் வீட்டை ஆசீர்வதிக்கிறார் — திருமண மகிழ்ச்சி. / Jupiter's blessing on the 7th supports a contented marriage.
- `[seventh_lord_placed]` 7ஆம் அதிபதி நல்ல வீட்டில் — உறுதியான துணை பிணைப்பு. / The 7th lord sits in a strong house — a steady partnership bond. *(kendra/trikona, unafflicted)*
- `[venus_jupiter]` சுக்கிரன்-குரு தொடர்பு — இணக்கமான தாம்பத்திய வாழ்க்கை. / A Venus-Jupiter link favours harmonious companionship.

*Caution*
- `[seventh_lord_afflicted]` 7ஆம் அதிபதி அழுத்தத்தில் — புரிதலுக்கு நேரம் தேவை. / The 7th lord is under pressure — understanding takes time to build here.
- `[seventh_malefic_unmitigated]` 7ஆம் வீட்டில் பாப தாக்கம், சுப நிவாரணம் இல்லை. / Malefic pressure on the 7th with no benefic offset — patience and communication help most.

*What helps:* திறந்த தொடர்பு மற்றும் பகிரப்பட்ட நேரம் பிணைப்பை வலுப்படுத்தும். / Open communication and shared time are what steady a bond most.

**Comments:**

---

#### 4. `business_partnership_fit` — CHANCE · age 18+ · varga: D10
*Support*
- `[seventh_lord_strong]` 7ஆம் அதிபதி வலு — கூட்டாண்மை உள்ளுணர்வு. / A strong 7th lord — good instinct for partnership.
- `[mercury_seventh]` புதன் 7ஆம் வீட்டுடன் தொடர்பு — பேச்சுவார்த்தை திறன். / Mercury's link to the 7th brings sharp negotiation skill.
- `[seventh_benefic]` 7ஆம் வீடு சுப ஆதரவில் — கூட்டு முயற்சிக்கு ஏற்றது. / The 7th house has benefic support for shared ventures.
- `[d10_confirms]` D10 (தசாம்சம்) கூட்டாண்மை பலத்தை உறுதிப்படுத்துகிறது. / The D10 career chart confirms strength for partnership.

*Caution*
- `[seventh_afflicted]` 7ஆம் வீடு/அதிபதி அழுத்தத்தில் — ஒப்பந்தத்தை எழுத்தில் வைக்கவும். / Pressure on the 7th — put partnership terms in writing.
- `[mercury_node]` புதன்-ராகு/கேது — புரிதல் இடைவெளி சாத்தியம். / Mercury with a node can bring communication gaps in dealings.
- `[d10_softens]` D10 (தசாம்சம்) — கூட்டாண்மையில் கூடுதல் விழிப்பு தேவை. / The D10 career chart counsels extra vigilance in partnership.

*What helps:* பொறுப்புகளை தெளிவாக பகிரவும், ஒப்பந்தங்களை எழுத்தில் வைக்கவும். / Share responsibilities clearly and keep agreements in writing.

**Comments:**

---

### Education

#### 5. `higher_education` — CHANCE · varga: D24 · timing: 9th / Jupiter
*Support*
- `[jupiter_strong]` குரு வலுவாக — உயர் கல்விக்கு ஆசி. / Jupiter is strong — a blessing for higher study.
- `[mercury_strong]` புதன் வலு — கூர்மையான பகுப்பாய்வு. / Mercury is strong — sharp analytical mind.
- `[budha_aditya]` புத ஆதித்ய யோகம் — அறிவுத் திறன். / Budha-Aditya yoga — intellectual brilliance. *(Sun-Mercury conjunct, not combust)*
- `[fifth_support]` 5ஆம் வீடு (அறிவு) சுப அமைப்பில். / The 5th house of intelligence is well supported.
- `[ninth_support]` 9ஆம் வீடு (உயர்கல்வி) ஆதரவில். / The 9th house of higher learning is supported.
- `[d24_confirms]` D24 (சதுர்விம்சாம்சம்) கல்வி பலத்தை உறுதிப்படுத்துகிறது. / The D24 education chart confirms the strength for higher study.

*Caution*
- `[both_afflicted]` புதன்-குரு இருவரும் அழுத்தத்தில் — கூடுதல் முயற்சி. / Both Mercury and Jupiter are pressured — study needs extra effort.
- `[d24_softens]` D24 (சதுர்விம்சாம்சம்) — கூடுதல் முயற்சி தேவை என்கிறது. / The D24 education chart asks for extra effort here.

*What helps:* சரஸ்வதி வழிபாடு மற்றும் நிலையான படிப்பு பழக்கம் உதவும். / Steady study routines (and, if you wish, Saraswati prayers) help.

**Comments:**

---

#### 6. `dropout_risk` — CAUTION · age ≤35 · disclaimer
*Caution*
- `[fourth_malefic]` 4ஆம் வீடு (முறையான படிப்பு) பாப தாக்கம். / Malefic pressure on the 4th house of formal schooling.
- `[fourth_lord_dusthana]` 4ஆம் அதிபதி கஷ்ட வீட்டில். / The 4th lord sits in a difficult house.
- `[mercury_rahu]` புதன்-ராகு — கவனச்சிதறல் வாய்ப்பு. / Mercury with Rahu can scatter focus.
- `[mercury_afflicted]` புதன் அழுத்தத்தில். / Mercury is under pressure.

*Support*
- `[fourth_protected]` 4ஆம் வீடு பாதுகாப்பில் — படிப்பு தொடரும். / The 4th house is protected — schooling holds steady.
- `[jupiter_guides]` குரு வலு — வழிகாட்டல் கிடைக்கும். / A strong Jupiter draws good mentorship.

*Disclaimer:* இது ஒரு எச்சரிக்கை மட்டுமே — சரியான ஆதரவுடன் இதை எளிதில் கடக்கலாம். / This is a heads-up only — with the right support it is easily navigated.

*What helps:* வழிகாட்டி/மென்டார் மற்றும் கட்டமைக்கப்பட்ட காலஅட்டவணை உதவும். / A mentor and a structured timetable make the difference here. · படிப்பை சிறு இலக்குகளாக பிரிக்கவும். / Break study into small, finishable goals.

**Comments:**

---

### Career & Work

#### 7. `career_mode` — directional (not graded CHANCE/CAUTION) · age 16+ — see flag #1
Labels: **ENTERPRISE_LEANING / SALARIED_LEANING / BALANCED / QUIET**, decided
by which side's factor count leads by 2+.

*Enterprise-leaning*
- `[enterprise_drive]` 3ஆம் வீடு/செவ்வாய் வலு — சுயமுயற்சி தைரியம். / Strong 3rd-house / Mars drive — appetite for self-effort.
- `[business_gains]` 7-11 அதிபதிகள் வலு — வணிக/லாப யோகம். / Strong 7th & 11th lords — business and gains.
- `[rahu_trade]` ராகு-வணிக அமைப்பு — சந்தை உள்ளுணர்வு. / A Rahu trade signature — market instinct.

*Salaried-leaning (shown as neutral, not a caution)*
- `[service_signature]` 10-6/சனி அமைப்பு — நிலையான வேலைக்கு ஏற்றது. / A 10th-6th / Saturn pattern — suits steady salaried service.
- `[saturn_over_mars]` சனி மேலோங்கல் — ஒழுங்கான அமைப்பு விருப்பம். / Saturn over Mars — thrives inside structure and routine.

*What helps:* இரண்டு பாதைகளும் செல்லுபடியாகும் — உங்கள் இயல்பான தாளத்தை மதிக்கவும். / Both paths are valid — honour the rhythm that fits your temperament.

**Comments:**

---

#### 8. `government_job` — CHANCE · age 16+ · varga: D10 · timing: 10th / Sun
*Support*
- `[sun_strong]` சூரியன் வலு — அரசு/அதிகார யோகம். / A strong Sun favours government and authority roles.
- `[sun_tenth]` சூரியன் 10ல் தொடர்பு — பதவி யோகம். / The Sun touches the 10th of office and standing.
- `[raja_yoga]` ராஜ/மகாபுருஷ யோகம் — உயர் பதவி வாய்ப்பு. / A Raja/Mahapurusha yoga raises the chance of high office. *(Raja/Ruchaka/Sasa yoga present)*
- `[tenth_ninth]` 10-9 அதிபதிகள் வலு — தேர்வு/அதிர்ஷ்டம். / Strong 10th & 9th lords — selection and fortune align.
- `[saturn_service]` சனி வலு — போட்டித் தேர்வு/சேவை பொறுமை. / Saturn strength suits competitive exams and service discipline.
- `[d10_confirms]` D10 (தசாம்சம்) பதவி பலத்தை உறுதிப்படுத்துகிறது. / The D10 career chart confirms strength for office and standing.

*Caution*
- `[sun_afflicted]` சூரியன் அழுத்தத்தில் — பொறுமை தேவை. / The Sun is pressured — the path needs patience.
- `[d10_softens]` D10 (தசாம்சம்) — கூடுதல் பொறுமை தேவை. / The D10 career chart counsels patience on this path.

*What helps:* போட்டித் தேர்வுகளுக்கு நிலையான தயாரிப்பே முக்கியம். / Consistent preparation is what turns this chance into a result.

**Comments:**

---

#### 9. `job_disruption` — CAUTION · age 18+ · varga: D10 · disclaimer · timing: 10th / Saturn
*Caution*
- `[tenth_lord_afflicted]` 10ஆம் அதிபதி அழுத்தத்தில் — தொழில் மாற்றம். / The 10th lord is pressured — a career shift may surface.
- `[tenth_malefic]` 10ஆம் வீட்டில் பாப தாக்கம். / Malefic pressure on the 10th house of work.
- `[sade_sati]` சடே சதி காலம் — வேலையில் நிலைமாற்றம் சாத்தியம். / A Sade-Sati season can reshuffle work — stay adaptable.
- `[saturn_transit_tenth]` சனி பெயர்ச்சி 10ல் — பொறுப்பு/அழுத்தம் மாற்றம். / Saturn transiting the 10th brings load and change at work.
- `[d10_change]` D10 (தசாம்சம்) — தொழில் மாற்றத்திற்கு கவனம். / The D10 career chart flags a work-change season — stay ready.

*Support*
- `[tenth_stable]` 10/11 அதிபதி வலு — வருமான நிலைத்தன்மை. / Strong 10th/11th lords give income resilience.
- `[d10_stable]` D10 (தசாம்சம்) தொழில் நிலைத்தன்மையை ஆதரிக்கிறது. / The D10 career chart supports work stability.

*Disclaimer:* இது ஒரு முன்னெச்சரிக்கை காலம் மட்டுமே — தயாரிப்பே பாதுகாப்பு. / This flags a season for foresight only — preparation is the protection.

*What helps:* இந்த காலத்தில் சேமிப்பு மற்றும் திறன் மேம்பாட்டில் கவனம் செலுத்துங்கள். / Build reserves and upskill through this window — that's the hedge. · முக்கிய முடிவுகளை அவசரப்படாமல் எடுக்கவும். / Avoid abrupt job moves in a strained season unless well planned.

**Comments:**

---

#### 10. `competitive_edge` — CHANCE · age 16+ — see flag #8's neighbour, no varga (D6 absent, flag #5)
*Support*
- `[mars_strong]` செவ்வாய் வலு — போட்டி துணிச்சல். / A strong Mars gives real competitive courage.
- `[sixth_lord_strong]` 6ஆம் அதிபதி வலு — போட்டியில் மேலோங்கல். / A strong 6th lord favours winning contests and exams.
- `[saturn_discipline]` சனி 6ல் வலுவாக — தொடர் தயாரிப்பு பலன் தரும். / A strong Saturn in the 6th rewards sustained, disciplined preparation.

*Caution*
- `[sixth_lord_weak]` 6ஆம் அதிபதி பலவீனம் — கூடுதல் தயாரிப்பு தேவை. / A weak 6th lord asks for extra preparation before contests.

*What helps:* குறிப்பிட்ட, அளவிடக்கூடிய இலக்குகளுடன் தயாராகுங்கள். / Prepare against specific, measurable targets — that's what tips a contest.

**Comments:**

---

### Wealth *(new category)*

#### 11. `income_growth` — CHANCE · age 18+ · varga: D2 (Hora, see flag #6) · timing: 11th / Jupiter
*Support*
- `[eleventh_lord_strong]` 11ஆம் அதிபதி வலு — வருமான வளர்ச்சி. / A strong 11th lord favours growing income.
- `[eleventh_benefic]` 11ஆம் வீடு (லாபம்) சுப ஆதரவில். / The 11th house of gains is benefic-supported.
- `[jupiter_expands]` குரு வலு — வருமான வாய்ப்புகள் விரிவடையும். / A strong Jupiter expands income opportunities over time.
- `[hora_confirms]` ஹோரா (D2) செல்வ வளர்ச்சியை ஆதரிக்கிறது. / The Hora (D2) chart supports growing wealth.

*Caution*
- `[eleventh_lord_afflicted]` 11ஆம் அதிபதி அழுத்தத்தில் — வருமான வளர்ச்சி மெதுவாக இருக்கலாம். / The 11th lord is pressured — income growth may be slower and need effort.
- `[hora_softens]` ஹோரா (D2) — கூடுதல் நிதி ஒழுக்கம் தேவை. / The Hora (D2) chart counsels more financial discipline.

*What helps:* பல வருமான வழிகளை படிப்படியாக உருவாக்குங்கள். / Build multiple income streams gradually — that's what this chance rewards.

**Comments:**

---

#### 12. `savings_capacity` — CHANCE · age 18+ · varga: D2 (Hora)
*Support*
- `[dhana_yoga]` தன யோகம் செயலில் — சேமிப்பு திறன். / A Dhana yoga is active — a natural capacity to save.
- `[second_supported]` 2ஆம் வீடு (சேமிப்பு) ஆதரவில். / The 2nd house of accumulated wealth is well supported.
- `[wealth_karakas_strong]` குரு/சுக்கிரன் வலு — நிதி நிலைத்தன்மை. / Strong Jupiter/Venus support financial steadiness.
- `[hora_confirms]` ஹோரா (D2) சேமிப்பு திறனை உறுதிப்படுத்துகிறது. / The Hora (D2) chart confirms the capacity to save.

*Caution*
- `[second_afflicted]` 2ஆம் வீடு/அதிபதி அழுத்தத்தில் — செலவு கட்டுப்பாடு தேவை. / Pressure on the 2nd house/lord — expense discipline needs attention.
- `[hora_softens]` ஹோரா (D2) — சேமிப்பில் கூடுதல் கவனம். / The Hora (D2) chart asks for extra attention to saving.

*What helps:* வருவாயில் ஒரு பகுதியை தானியங்கி முறையில் சேமிக்கும் பழக்கத்தை உருவாக்குங்கள். / Automate a fixed share of income into savings — habit beats willpower here.

**Comments:**

---

#### 13. `inheritance_lean` — CHANCE · age 18+ · no varga vote (see flag #6)
*Support*
- `[eighth_lord_strong]` 8ஆம் அதிபதி வலுவாக நல்ல வீட்டில் — பரம்பரை ஆதாய சாத்தியம். / A strong, well-placed 8th lord favours inherited or unearned gains.
- `[eighth_wealth_link]` 8-2/11 அதிபதிகள் தொடர்பில் — பரம்பரை செல்வ இணைப்பு. / A link between the 8th and the 2nd/11th wealth lords — an inheritance channel.
- `[eighth_benefic]` 8ஆம் வீட்டில் சுப பார்வை — பாதுகாப்பான ஆதாயம். / Benefic support to the 8th favours a protected, steady gain.

*Caution*
- `[eighth_lord_afflicted]` 8ஆம் அதிபதி அழுத்தத்தில் — பரம்பரை விவகாரங்களில் தாமதம் சாத்தியம். / The 8th lord is pressured — inheritance matters may involve delay or complication.

*What helps:* பரம்பரை/ஆதாய விவகாரங்களில் சட்ட ஆவணங்களை தெளிவாக வைத்திருங்கள். / Keep legal paperwork clear and current in any inheritance matter.

**Comments:**

---

### Life Path *(new category)*

#### 14. `foreign_settlement` — CHANCE · age 16+ · varga: D12 · timing: 12th / Rahu
*Support*
- `[rahu_twelfth]` ராகு 12ஆம் வீட்டுடன் தொடர்பு — வெளிநாட்டு/தொலைதூர வாய்ப்பு. / Rahu's link to the 12th favours a foreign or far-from-home chance.
- `[twelfth_lord_travel]` 12ஆம் அதிபதி பயண வீடுகளில் — தொலைதூர வாய்ப்பு. / The 12th lord sits in a travel-linked house — distance draws you. *(3rd/9th/11th/12th)*
- `[twelfth_benefic]` 12ஆம் வீடு சுப ஆதரவில் — புது இடத்தில் செழிப்பு. / The 12th house is benefic-supported — settling elsewhere can flourish.
- `[saturn_rahu_twelfth]` சனி-ராகு 12ல் — நீண்ட கால குடியேற்ற சாத்தியம். / Saturn with Rahu near the 12th favours a long-term settlement abroad.
- `[d12_confirms]` D12 (துவாதசாம்சம்) வெளிநாட்டு வாய்ப்பை உறுதிப்படுத்துகிறது. / The D12 chart confirms the foreign/settlement chance.

*Caution*
- `[d12_softens]` D12 (துவாதசாம்சம்) — தேவையான தயாரிப்பு அதிகம். / The D12 chart counsels more preparation before the move.

*What helps:* ஆவணங்கள், மொழி, கலாச்சார தயாரிப்பை முன்கூட்டியே தொடங்குங்கள். / Start paperwork, language, and cultural preparation well ahead of time.

**Comments:**

---

#### 15. `litigation_season` — CAUTION · age 18+ · disclaimer (new: legal) · no varga (D6 absent, flag #5)
*Caution*
- `[sixth_mars_saturn]` 6ஆம் வீட்டில் செவ்வாய்/சனி தாக்கம் — சர்ச்சை காலம். / Mars/Saturn pressure on the 6th — a season where disputes may need careful handling.
- `[sixth_lord_dusthana]` 6ஆம் அதிபதி கஷ்ட வீட்டில் — நீடித்த சர்ச்சை சாத்தியம். / The 6th lord in a difficult house — disputes can drag if not addressed early.
- `[mars_saturn]` செவ்வாய்-சனி சேர்க்கை — மோதல் தன்மை அதிகரிக்கலாம். / Mars-Saturn together can sharpen confrontational moments.

*Support*
- `[sixth_managed]` 6ஆம் வீடு கட்டுப்பாட்டில் — சர்ச்சைகளை சமாளிக்கும் திறன். / The 6th house is well-managed — a real ability to resolve disputes cleanly.
- `[jupiter_mediates]` குரு பார்வை 6ல் — சமரச வழி கிடைக்கும். / Jupiter's aspect on the 6th opens a path to settlement.

*Disclaimer (new — please review carefully, this is the one legal-flavoured
card in the set):* இது ஒரு பொது எச்சரிக்கை காலம் மட்டுமே — இது எந்த குறிப்பிட்ட வழக்கு அல்லது முடிவையும் கணிக்கவில்லை. சட்ட விவகாரங்களுக்கு ஒரு தகுதிவாய்ந்த வழக்கறிஞரையே அணுகவும். / This flags a general season for care only — it does not predict any specific case or outcome. For real legal matters, a qualified lawyer is the right guide, not this chart.

*What helps:* சர்ச்சைகளை ஆவணப்படுத்தி, ஆரம்பத்திலேயே சட்ட ஆலோசனை பெறுங்கள். / Document disagreements and get legal advice early — before they harden.

**Comments:**

---

#### 16. `debt_watch` — CAUTION · age 18+ · disclaimer (reused from resilience_watch) · no varga — see flag #9
*Caution*
- `[sixth_lord_afflicted]` 6ஆம் அதிபதி அழுத்தத்தில் — கடன் தீர்வு தாமதமாகலாம். / A pressured 6th lord can slow how easily debts clear.
- `[second_lord_afflicted]` 2ஆம் அதிபதி அழுத்தத்தில் — நிதி வெளியேற்றம். / The 2nd lord is pressured — outflow can outpace savings.
- `[saturn_debt_house]` சனி 6/12ல் — கடன்/செலவு சுமை. / Saturn in the 6th/12th can add a persistent debt or expense load.

*Support*
- `[sixth_lord_strong]` 6ஆம் அதிபதி வலு — கடன்களை தீர்க்கும் திறன். / A strong 6th lord — a real capacity to clear debts.
- `[second_lord_stable]` 2ஆம் அதிபதி நிலையாக — நிதி கட்டுப்பாடு எளிதாகும். / A stable, unafflicted 2nd lord makes financial discipline easier.

*Disclaimer:* இது ஒரு நிதி/வாழ்க்கை எச்சரிக்கை காலம் மட்டுமே — இது எந்த குறிப்பிட்ட துயரத்தையும் கணிக்கவில்லை. முன்னெச்சரிக்கை (சேமிப்பு, காப்பீடு) மட்டுமே இதன் நோக்கம். / This flags a season for prudence only — it does not predict any specific misfortune. Its whole purpose is foresight: reserves, insurance, and not over-extending. *(shared with `resilience_watch` below — same wording used for both, confirm that's fine or wants its own text)*

*What helps:* பெரிய கடன் முடிவுகளுக்கு முன் பட்ஜெட் திட்டமிடவும். / Budget carefully before any major borrowing decision.

**Comments:**

---

### Wellbeing & Temperament

#### 17. `child_timing` — CAUTION · age 21-50 · varga: D7 · fertility disclaimer · timing: 5th / Jupiter
*Caution*
- `[fifth_saturn_ketu]` 5ஆம் வீட்டில் சனி/கேது — குழந்தை பேறில் தாமதம் சாத்தியம். / Saturn/Ketu in the 5th can slow the timing of children.
- `[fifth_lord_dusthana]` 5ஆம் அதிபதி கஷ்ட வீட்டில். / The 5th lord sits in a difficult house.
- `[jupiter_afflicted]` குரு (புத்திர காரகன்) அழுத்தத்தில். / Jupiter, the karaka of children, is pressured.
- `[d7_softens]` D7 (சப்தாம்சம்) — நேரத்தில் கூடுதல் பொறுமை/வழிகாட்டல். / The D7 (Saptamsa) chart counsels more patience and guidance on timing.

*Support*
- `[fifth_blessed]` 5ஆம் வீடு/குரு ஆசி — சந்ததி யோகம் நல்லது. / A blessed 5th / strong Jupiter supports children's fortune.
- `[d7_confirms]` D7 (சப்தாம்சம்) சந்ததி யோகத்தை ஆதரிக்கிறது. / The D7 (Saptamsa) chart supports the children outlook.

*Disclaimer (fertility-specific):* இது மருத்துவ ஆலோசனையை மாற்றாது. குழந்தை பேறு தொடர்பான கேள்விகளுக்கு மருத்துவ நிபுணரை அணுகுவதே சிறந்தது. / This does not replace medical advice. For anything about conception, a doctor is the right guide.

*What helps:* மருத்துவ வழிகாட்டலுடன் பொறுமையாக இருங்கள் — தாமதம் மறுப்பு அல்ல. / Pair patience with medical guidance — a delay is not a denial.

**Comments:**

---

#### 18. `accident_care` — CAUTION · safety disclaimer · timing: 8th / Mars — see flag #8
*Caution*
- `[mars_rahu]` செவ்வாய்-ராகு — அவசர/வேக செயல்பாட்டில் கவனம். / Mars with Rahu — take care with haste and rash moves.
- `[mars_saturn]` செவ்வாய்-சனி — உடல் உழைப்பில் கவனம். / Mars with Saturn — mind physical strain and machinery.
- `[eighth_sixth_malefic]` 8/6 வீடுகளில் பாப தாக்கம் — கூடுதல் கவனம். / Malefic pressure on the 6th/8th — a season for extra care.
- `[lagna_lord_afflicted]` லக்ன அதிபதி அழுத்தத்தில் — உடல் கவனம். / The Lagna lord is pressured — protect your physical wellbeing.

*Support*
- `[jupiter_shield]` குரு பார்வை — பாதுகாப்பு கவசம். / Jupiter's aspect offers a protective shield.

*Disclaimer:* இது எச்சரிக்கை கவனத்திற்கான காலம் மட்டுமே — நிச்சயமான நிகழ்வு அல்ல. வழக்கமான பாதுகாப்பு நடவடிக்கைகளுடன் அமைதியாக இருங்கள். / This is a season for extra care, not a certain event. Stay calm and keep your usual safety habits.

*What helps:* வாகனம், இயந்திரம், சாகச செயல்களில் வழக்கமான பாதுகாப்பை கடைப்பிடிக்கவும். / Keep normal safety habits with vehicles, machinery, and adventure.

**Comments:**

---

#### 19. `emotional_load` — CAUTION · wellbeing disclaimer + support-resources block
*Caution*
- `[moon_saturn]` சந்திரன்-சனி தொடர்பு — மனச்சோர்வு உணர்வு காலங்கள். / A Moon-Saturn link can bring heavier, low-energy seasons.
- `[moon_ketu]` சந்திரன்-கேது — தனிமை/விலகல் உணர்வு. / Moon with Ketu can bring detachment or withdrawal.
- `[moon_rahu]` சந்திரன்-ராகு — கவலை/அமைதியின்மை. / Moon with Rahu can stir worry or restlessness.
- `[moon_dusthana]` சந்திரன் கஷ்ட வீட்டில் — உணர்வு சுமை. / The Moon in a difficult house can add emotional weight.
- `[kemadruma]` கேமத்ரும யோகம் — மன ஆதரவு உணர்வு குறைவு. / Kemadruma yoga can leave the mind feeling unsupported.
- `[sade_sati]` சடே சதி காலம் — உணர்வு சுமை அதிகரிக்கலாம். / A Sade-Sati season can raise emotional load.

*Support*
- `[moon_jupiter_steady]` சந்திரன்/குரு வலு — மன உறுதி ஆதரவு. / A strong Moon/Jupiter lends emotional steadiness.

*Disclaimer:* இது மருத்துவ அல்லது உளவியல் கண்டறிதல் அல்ல. ஜோதிடம் ஒரு போக்கை மட்டுமே சுட்டிக்காட்டுகிறது — அது விதி அல்ல. கவலை தொடர்ந்தால் நம்பகமான நபரிடம் அல்லது மருத்துவ நிபுணரிடம் பேசுங்கள். / This is not a medical or psychological diagnosis. Astrology points to a tendency only — it is not destiny. If the feeling persists, please talk to someone you trust or a health professional.

*What helps:* வழக்கமான தூக்கம், சூரிய ஒளி, உடற்பயிற்சி மனதை காக்கும். / Regular sleep, sunlight, and movement genuinely steady the mind. · உணர்வுகளை நம்பகமான நபருடன் பகிர்ந்து கொள்ளுங்கள். / Share what you feel with someone you trust — you needn't carry it alone.

**Comments:**

---

#### 20. `loneliness` — CAUTION · wellbeing disclaimer + support-resources block
*Caution*
- `[moon_saturn_ketu]` சந்திரன்-சனி/கேது — தனிமை உணர்வு காலங்கள். / Moon with Saturn/Ketu can bring seasons of feeling alone.
- `[kemadruma]` கேமத்ரும யோகம் — தொடர்பு முயற்சி தேவை. / Kemadruma yoga — connection takes intentional effort.
- `[moon_twelfth]` சந்திரன் 12ல் — உள்முக இயல்பு. / The Moon in the 12th leans inward and private.
- `[friend_home_lord]` 4/11 அதிபதி அழுத்தம் — நட்பு வட்டம் கவனம். / Pressure on the 4th/11th lords — nurture your circle of friends.

*Support*
- `[eleventh_support]` 11ஆம் வீடு (நண்பர்கள்) ஆதரவில். / The 11th house of friends is well supported.

*Disclaimer:* same wellbeing disclaimer as `emotional_load` above.

*What helps:* வாரம் ஒரு சிறிய சமூக பழக்கத்தை உருவாக்குங்கள். / Build one small weekly social habit — it compounds. · பழைய நண்பர்களுடன் தொடர்பை புதுப்பிக்கவும். / Reach back to old friends first.

**Comments:**

---

#### 21. `conviction` — CHANCE (thinly graded — 2 of 4 factors are descriptive notes, don't count toward the level; flag if this should be restructured)
*Descriptive (always shown, doesn't affect the level)*
- `[fixed_sign]` நிலையான ராசி மேலோங்கல் — உறுதியான குணம். / A fixed-sign emphasis — steady, determined temperament.
- `[sun_mars]` சூரியன்-செவ்வாய் வலு — தன்னம்பிக்கை/உறுதி. / Strong Sun and Mars — confidence and firm will.

*Caution*
- `[ego_edge]` சூரியன்/செவ்வாய்-ராகு — பிடிவாதம் எல்லை. / Sun/Mars-Rahu heat can tip conviction into rigidity.

*Support*
- `[wisdom_balance]` புதன்/குரு வலு — திறந்த மனது சமநிலை. / A strong Mercury/Jupiter balances firmness with open listening.

*What helps:* முடிவுக்கு முன் ஒரு எதிர்க் கருத்தை கேட்பதை பழக்கமாக்குங்கள். / Make a habit of hearing one opposing view before deciding — it's your edge.

**Comments:**

---

#### 22. `resilience_watch` — CAUTION · age 18+ · loss disclaimer · timing: 8th / Saturn
*Caution*
- `[eighth_pressure]` 8ஆம் வீடு (திடீர் மாற்றம்) பாப தாக்கம். / Malefic pressure on the 8th house of sudden change.
- `[node_saturn]` ராகு/கேது-சனி — எதிர்பாராத மாற்றக் காலம். / A node-Saturn link marks a season of unexpected change.
- `[kalasarpa]` காலசர்ப்ப அமைப்பு செயலில். / A Kalasarpa pattern is active.
- `[wealth_lords]` 2/11 அதிபதி அழுத்தம் — நிதி முன்னெச்சரிக்கை. / Pressure on the 2nd/11th wealth lords — keep finances prudent.

*Support*
- `[jupiter_cushions]` குரு பார்வை 8ல் — பாதுகாப்பு. / Jupiter's aspect on the 8th cushions and protects.

*Disclaimer:* இது ஒரு நிதி/வாழ்க்கை எச்சரிக்கை காலம் மட்டுமே — இது எந்த குறிப்பிட்ட துயரத்தையும் கணிக்கவில்லை. முன்னெச்சரிக்கை (சேமிப்பு, காப்பீடு) மட்டுமே இதன் நோக்கம். / This flags a season for prudence only — it does not predict any specific misfortune. Its whole purpose is foresight: reserves, insurance, and not over-extending. *(same text reused for `debt_watch` above)*

*What helps:* காப்பீடு, அவசர சேமிப்பு, அதிக கடன் தவிர்ப்பு — இவையே இதன் நோக்கம். / Insurance, an emergency fund, and avoiding over-leverage — that's the whole point.

**Comments:**

---

#### 23. `swabhava_profile` — PROFILE tier (new, descriptive only — never graded, always shown, never QUIET)
Fixed intro (always shown): உங்கள் லக்னம், சந்திரன், புதன் அடிப்படையிலான ஒரு இயல்பு சுருக்கம் — இவை போக்குகள், தீர்ப்புகள் அல்ல. / A temperament synthesis from your Lagna, Moon, and Mercury — tendencies, not verdicts.

*Notes shown (0-5 depending on chart; all NEUTRAL, never SUPPORT/CAUTION)*
- `[lagna_element]` (always) லக்னம் [தீ/நிலம்/காற்று/நீர்] தத்துவம் — உங்கள் இயல்பான அணுகுமுறையின் அடித்தளம். / A [fire/earth/air/water]-element Lagna — the base note of how you naturally approach life.
- `[lagna_lord_strong]` லக்ன அதிபதி வலு — தன்னம்பிக்கையான, தெளிவான சுய உணர்வு. / A strong Lagna lord — a confident, clearly-defined sense of self. *(or, if afflicted instead:)*
- `[lagna_lord_afflicted]` லக்ன அதிபதி அழுத்தத்தில் — சுய நம்பிக்கை காலப்போக்கில் வளரும். / The Lagna lord is under some pressure — self-confidence is something you grow into.
- `[moon_fixed]` / `[moon_movable]` / `[moon_dual]` — one of three, by Moon's sign quality (Sthira/Chara/Dwiswabhava).
- `[mercury_strong]` புதன் வலு — கூர்மையான, தெளிவான சிந்தனை. / A strong Mercury — sharp, articulate thinking.
- `[mercury_moon]` புதன்-சந்திரன் இணைப்பு — உணர்வையும் தர்க்கத்தையும் இணைக்கும் திறன். / A Mercury-Moon link — the ability to blend feeling and logic.

*What helps:* இந்த போக்குகள் ஒரு தொடக்க புள்ளியே — வளர்ச்சி எப்போதும் சாத்தியம். / These tendencies are a starting point, not a limit — growth is always possible.

**Note:** this is the one card with genuinely new *scope* (a personality synthesis, not a chance/caution reading) — please sanity-check the whole approach, not just wording: is a 4-trait Lagna+Moon+Mercury synthesis a reasonable "one card" version of Swabhava, or does it need a different structure entirely?

**Comments:**

---

## After you're done

Send back comments against whichever factor keys need changes (wording,
logic, or "delete this factor entirely") plus your answers to the 10 flagged
design questions above. I'll apply everything in one pass and we can re-run
the test suite before deciding whether to flip `propensity_insights` on.
